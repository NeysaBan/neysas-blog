
---
title: "【How To Optimize GEMM｜笔记】x86部分"
date: "2023-03-19"
author: "NeysaBan"
category: "cpu"
excerpt: "neon SSE（Streaming SIMD Extensions）指令集优化gemm"
tags:
- cpu
- simd
- arm
readTime: "8分钟"
---

**✨Ref**

// 前面普通的变换就不说了，和x86的差不多

## 内嵌汇编

内嵌汇编的具体知识可以参考这两个链接；

[C语言的内嵌汇编](https://zhuanlan.zhihu.com/p/348372132)

[移动端arm cpu优化学习笔记第4弹--内联汇编入门](https://zhuanlan.zhihu.com/p/143328317)

[机器学习中的高性能计算（二）SSE优化](https://zhuanlan.zhihu.com/p/409973153)

关于v8a的指令 // 对应到代码的话，github上的库注释里有写具体的对应网页

[Armv8/armv9架构入门指南 — Armv8/armv9架构入门指南 v1.0 文档](http://hehezhou.cn/arm_doc/index.html)

### 为什么加载到同一个寄存器时要分开加载

忘了在哪看的了，大概率是如果连续从内存取数容易流水线阻塞，中断指令流之类的

## 代码梳理

### `MMult_4x4_18.h`

🤬 **s变量梳理**

- 最外层循环 `for (ms = 0; ms < m; ms += GEMM_M)`
    - 第二层循环 `for (ks = 0; ks < k; ks += min_k)`
        - 第三层 并列两个循环
            - `for (mms = ms; mms < ms + min_m; mms += min_mm)` // 分割A并矩阵相乘
            - `for (ns = min_n; ns < n; ns += min_n)`// 分割B并矩阵相乘

就是没懂为什么不直接小块分割a呢？

🐾 **packA_4（packB_4同理**

1、关于传入参数：

- int m：要打包的行数
- int k：要打包的列数
- float* from：要打包的地方在原始矩阵中开始的位置（实际上也就是(0,0)位置+不用再遍历的行数*lda+不用再遍历的在当前行的列）
- int lda
- float* to

2、逻辑梳理

- 外层循环：每次a_offset都指向a的行首
    - 内层循环
        - 连续打包a的4行4列，即16个数字（注意，是这一次内层循环可以打包4行4列的14个数字
        - 变量改变
            - a所有指针向下移动4行
            - to指针向后移动16个位置

那么事实上，总共能打包的数字应该是，内层循环*外层循环*16个数字（注意，这个过程只有行指针移动，列是不移动的，也就是说，始终是那4列），即一共有 `(min_mm * min_k * 16)/4 = m*k*4` // 这样就清楚多了，实际上和前面代码示例的打包过程是一样的

👻 **Q**

还没懂的是分割规则

### conveolution1x1s1_4x4.h

🤑 卷积运算的优化方法

- 手工展开某些特定的卷积核并且一次处理多行数据
    
    [基于NCNN的3x3可分离卷积再思考盒子滤波](https://mp.weixin.qq.com/s/bfxbRtdviPuXM4MJc_AyAQ)
    
- Im2Col(按照卷积核移动的方向，把每次卷积核框起来的部分转置）+Sgemm(OpenBlas中就提供了矩阵相乘的多种算法如Sgemm)
    
    [im2col方法实现卷积算法](https://zhuanlan.zhihu.com/p/63974249)
    
    [卷积算法另一种高效实现，as_strided详解](https://zhuanlan.zhihu.com/p/64933417)
    
    因为时间紧，这个还没仔细看
    
    [AI移动端优化之Im2Col+Pack+Sgemm_just_sort的博客-CSDN博客](https://blog.csdn.net/just_sort/article/details/108412760)
    
- Winograd
    
    [详解卷积中的Winograd加速算法](https://zhuanlan.zhihu.com/p/260109670)
    
- FFT
- Strassen

🕵️‍♀️ Im2Col + Segmm

卷积算法另一种高效实现，as_strided详解 - 永远在你身后的文章 - 知乎

conveolution1x1s1_4x4.h主要是使用Im2Col + Segmm的方法，这里根据上面的链接顺表解释一下个人对细节的理解

- Im2Col
    - 看第一个链接，讲得很清楚
        - 自己的笔记
            
            ![|896x1247](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011745421.png)
            
            还有一个多输入，多通道，多卷积核
            
        - Code
            
            ```python
            ## 多通道多卷积核（链接1
            def im2col(img, ksize, stride=1):
            	  ## N：输入矩阵的个数， H：输入矩阵的高度，W：输入矩阵的宽度，C：通道个数
                N, H, W, C = img.shape 
                out_h = (H - ksize) // stride + 1 ## 
                out_w = (W - ksize) // stride + 1
            
            		## col的大小，即做完im2col之后的矩阵的行数和列数
            		## 行数：卷积核在单个矩阵上的滚动次数（卷积操作后得到的数字的个数，也就是输出矩阵的宽*高）
            		##                                      x 输入矩阵的个数
            		## 列数：卷积核宽x高（也就是卷积核一次能覆盖的元素有多少）x通道数（所有的通道子矩阵会拼成一个大的子矩阵）
                col = np.empty((N * out_h * out_w, ksize * ksize * C))
                outsize = out_w * out_h
                for y in range(out_h):
                    y_min = y * stride ## y_min即卷积核在列上的起始位置，是按照步长跳着走的
                    y_max = y_min + ksize ## y_max即卷积核在列上的末尾位置
                    y_start = y * out_w 
                    for x in range(out_w):
                        x_min = x * stride
                        x_max = x_min + ksize
            						## [m::n] #从a[m]开始，每跳|n|个取一个，当n为负时逆序取数，当n为正的时候，m为空则默认m=0，n为负时，m为空则默认为-1
                        col[y_start+x::outsize, :] = img[:, y_min:y_max, x_min:x_max, :].reshape(N, -1)
                return col
            ```
            
            - 对于最后一句的解释（摘自链接1
            
            ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011745422.png)
            
            - 为什么Channel放在最后
                
                ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011745423.png)
                
                个人理解：连续的存放方式是同一个输入的同行的列数x通道数的元素都在内存的一行
                
    - 下面已废弃(第二个链接
        - 关于第二个链接的一些理解：感觉真的说得很乱，怎么会是卷积核尺寸比较大的时候，卷积核在原始矩阵上移动的次数变少，也就是需要展平的子矩阵变少，怎么可能行非常多啊？？？输出特征图的通道变大，也就是说卷积核数量增多，卷积核经过im2col之后得到的矩阵列变多啊。。。。。。；文中的3.3部分代码其实思路和上面链接1的python代码是一样的
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011745424.png)
        
        ~~这里文章是对 3x3x3 的卷积核 和 4x4x3 的特征图 先进行了Im2Col，跟随文章中的定义和例子，输入特征图维度是 $(1,D,H,W)$ 即 $(1,3,5,5)$ ；卷积核维度是 $(D_{out}, D, K, K)$ 即 $(D_{out}, 3,3,3)$~~ 
        
        - ~~卷积核：展成**3输出** $D_{out}$  x ( (3宽 $K$  x 3高 $K$ ) x 3通道 $D$ ) = 3 x 27的矩阵 // 公式 $D_{out} \times ( K \times K )$~~
        - ~~特征图：按照3x3的卷积核在特征图上按照步长为1的方式展开，展成 (3卷积核宽 $K$  x 3卷积核高 $K$ ) x 3通道 $D$ ) x ( 移动次数 ( 横着移动的次数(1卷积核最开始移动的一次 + (4特征图宽 $W$  - 3卷积核宽 $K$ ) / 1步长 $Stride$) ) * (竖着移动的次数 (1卷积核最开始移动的一次 + (4特征图高 $H$  - 3卷积核高 $K$ ) / 1步长 $Stride$  ) ） = 27 x 4的矩阵 //  公式 $(K \times K \times D) \times ( (1 + (W -K) / Stride ) \times (1 + (H -K) / Stride ))$~~
        - Code
            
            ```cpp
            // 1. im2col
            				// 看这里空间的分配可以看出来，是把im2col得到的矩阵全部放在一行
                    float *src_im2col = new float[outWidth * outHeight * kernelH * kernelW * inChannel];
                    
                    const int Stride = kernelW * kernelH * outHeight * outWidth;
                    //const int inSize = inHeight * inWidth;
                    const int outSize = outHeight * outWidth; 
                    const int kernelSize = kernelH * kernelW;
            
                // inCahnnel x kW x kH
                // outWidth x outHeight
            
                    for(int cc = 0; cc < inChannel; cc++){
                        const float *src0 = src + cc * kernelH * kernelW * inChannel;
                        int dst_idx = Stride * cc;
            						// 看循环，这里是一下子把一个channel的矩阵的im2col结果全部得到
                        for(int i = 0; i < kernelH; i++){
                            for(int j = 0; j < kernelW; j++){
                                for(int x = 0; x < outHeight; x++){
                                    for(int y = 0; y < outWidth; y++){
            														// StrideH和StrideW分别指卷积核在横向和纵向的步长（一般是相同的）
            														// 那么x和y就指在
                                        int row = x * StrideH + i;
                                        int col = y * StrideW + j;
                                        int ori_idx = row * inWidth + col;
                                        src_im2col[dst_idx] = src0[ori_idx];
                                        dst_idx++;      
                                    }
                                }
                            }
                        }
                    }
            ```
            
            ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011745425.png)
            
- Col2Im
    - 获得了乘积矩阵之后只需要按照通道进行顺序排列就可以获得输出特征图