---
title: "关于cpu支持何种指令集的问题"
date: "2023-03-29"
author: "NeysaBan"
category: "cpu"
tags:
 - cpu
 - simd
 - x86
 - 环境
readTime: "8分钟"
---

以下是在写x86版本intrinsic时遇到的问题

因为要改进的算法中涉及的浮点数都是double类型，用128位的寄存器性能改进不大，ld让改成256位的

看了下**Intel® Intrinsics Guide**，貌似SSE family只支持128位，所以改成AVX指令集

但改成AVX之后，bug就来了

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748481.png)

看了下StackOverflow上，这样说

[inlining failed in call to always_inline '__m256d _mm256_broadcast_sd(const double*)'](https://stackoverflow.com/questions/44962849/inlining-failed-in-call-to-always-inline-m256d-mm256-broadcast-sdconst-doub)

但感觉不是这个问题（主要也是在gdb的debug模式下不知道把这个参数加到哪里、、）

后来看网上说可能只因为cpu不支持这个指令集，查看cpu支持何种指令集的方法

- 命令，但怎么感觉这个不太准呢，这上面写的有avx，但是英特尔官方网站只写了avx2、
    
    ```bash
    // linux
    //  查看cpu支持的所有指令集
    cat /proc/cpuinfo |grep -i 'flags'
    或
    lscpu
    // 查看cpu是否支持SSE指令集
    cat /proc/cpuinfo |grep -i 'sse'
    
    // mac
    // 我试了下不行......
    // macos查看cpu支持的指令集
    sysctl -a | grep machdep.cpu.features
    // macos 查看cpu是否支持SSE 4.2
    sysctl -a | grep machdep.cpu.features | grep SSE
    ```
    
    - 查看是何种架构
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748482.png)
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748483.png)
        
- 官网查询文档 [cr](https://www.cnblogs.com/qmjc/p/13495708.html)
    - 先看自己cpu是哪种
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748484.png)
        
    - 百度一搜确定具体信息
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748485.png)
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748486.png)
    

如果确实是只支持AVX2的话，确实是不能用 的，因为单独勾选AVX2和General Support下面根本没有这个指令；AVX的General Support才有、、、

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748487.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011748488.png)