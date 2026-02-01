---
title: "【How To Optimize GEMM｜笔记】x86部分"
date: "2023-03-15"
author: "NeysaBan"
category: "cpu"
excerpt: "x86 SSE（Streaming SIMD Extensions）指令集优化gemm"
tags:
 - cpu
 - simd
 - x86
readTime: "8分钟"
---

**✨Ref**

[https://github.com/BBuf/how-to-optimize-gemm](https://github.com/BBuf/how-to-optimize-gemm)

在自己fork下来的库里([🔗](https://github.com/NeysaBan/how-to-optimize-gemm-comments))，增加了具体的注释(其实也没多少，在代码里)，和版本对比注释(在README里）

这里简单写一下个人理解～

> ps：这里只以4x4部分举例
> 

## 1. 不涉及指令集优化的部分

### 版本对比

- v6 🆚 v7 —— 「B矩阵计算时每次访存，1.6gflops」→ 「B矩阵每次计算时先直接寻址找值，最后指针自增，5.0gflops」
    
    ```cpp
    //********************//
    //MMult_4x4_7.h 代码截取
    //********************//
    
    // func——AddDot4x4
    float *bp1_pntr;
    	
    	// 在for循环中
    	bp1_pntr = &B(p,1); // 取本次地址
    
    	// 每次计算时，先直接寻址使用，然后再自增
    	/* First row */
    	c_01_reg += a_0p_reg * *b_p1_pntr;
    	/* Second row */
    	c_11_reg += a_1p_reg * *b_p1_pntr;
    	/* Third row */
    	c_21_reg += a_2p_reg * *b_p1_pntr
    	/* Four row */
    	c_31_reg += a_3p_reg * *b_p1_pntr++;
    ```
    
- v7 🆚 v8 —— 「A矩阵用指针间接寻址，5.0gflops」→ 「B矩阵每次把值先直接保存到寄存器，5gflops」
    
    ```cpp
    //********************//
    //MMult_4x4_8.h 代码截取
    //********************//
    
    // func——AddDot4x4
    register float b_p1_reg;
    	
    	// 在for循环中
    	b_p1_reg = B(p, 1); // 取本次(p,1)位置的元素
    
    	// 每次计算时，直接从寄存器中取数使用，然后再自增
    	/* First row */
    	c_01_reg += a_0p_reg * b_p1_reg;
    	/* Second row */
    	c_11_reg += a_1p_reg * b_p1_reg;
    	/* Third row */
    	c_21_reg += a_2p_reg * b_p1_reg
    	/* Four row */
    	c_31_reg += a_3p_reg * b_p1_reg;
    ```
    
    > 因此，速度比较，`寄存器存值 = 间接寻址 >> 访存`
    > 

问题是间接寻址为什么这么快？可能需要追溯到内存取值到底慢在哪里？是慢在偏移吗？

## 2. SSE指令集优化

### 2.1 前置知识

🥥 **Union 🔗**

```cpp
typedef union
{
  __m128 v; // 单精度浮点数，128bits=16bytes，能存储4个单精度浮点数
  float d[4];
} v2df_t;
```

这里v和d[4]共享同一片内存空间

这片内存空间，有空就往后写；没空就覆盖。

🥵 **SSE指令** 

[Intel® Intrinsics Guide](https://software.intel.com/sites/landingpage/IntrinsicsGuide/)

[C/C++指令集介绍以及优化（主要针对SSE优化）](https://zhuanlan.zhihu.com/p/325632066#:~:text=到内存里面；-,三、SSE指令集的使用说明,-SSE本质上)

😪 **矩阵运算**

// 目前看到一种说法，是得到C的扇面，说得很好诶 [🔗](https://zhuanlan.zhihu.com/p/272208879#:~:text=%E4%B8%80%E4%B8%AA%20C%20%E7%9A%84%E2%80%9C-,%E6%89%87%E9%9D%A2,-%E2%80%9D%EF%BC%8C%E5%A4%9A%E4%B8%AA%E2%80%9C%E6%89%87%E9%9D%A2%E2%80%9D%E5%8F%A0)

当时看得有点晕，所以在这里记录一下，当寄存器可以一次加载4个浮点数时候的运算过程。

一次AddDot4x4函数的调用，可以得出16个数字，而这需要矩阵a的4行k列，矩阵b的k行4列。

看循环`for (int p = 0; p < k; ++p)` ，计算了k次，那么基本可以确定每次加载时(_mm_load_ps、_mm_set_ps1)是同时加载了四个浮点数

这里直接看计算公式可能有点晕，但是看A、B矩阵的`指针/寄存器的加载方向`可能更容易理解。按矩阵乘法，行乘列其实就是A向右B向下。

A、B都一次加载4个数，不过需要注意的是，A的寄存器一次加载的4个浮点数是完全相同的，B寄存器加载的是不同的；而且A是向右加载（也就是按列加载，换句话说计算方向向右），B是向下加载（也就是按行加载，换句话说计算方向是向下的）。

```cpp

// 代码如下，摘自MMult_4x4_10.h
for (int p = 0; p < k; ++p) {
    b_reg.v = _mm_load_ps((float *)&B(p, 0));

    a_0p_reg.v = _mm_set_ps1(*a_0p_pntr++); // 把4个位置的浮点数全都赋值为*a_0p_pntr
    a_1p_reg.v = _mm_set_ps1(*a_1p_pntr++);
    a_2p_reg.v = _mm_set_ps1(*a_2p_pntr++);
    a_3p_reg.v = _mm_set_ps1(*a_3p_pntr++);

    c_p0_sum.v += b_reg.v * a_0p_reg.v;
    c_p1_sum.v += b_reg.v * a_1p_reg.v;
    c_p2_sum.v += b_reg.v * a_2p_reg.v;
    c_p3_sum.v += b_reg.v * a_3p_reg.v;
  }
```

### 2.2 版本对比

v10：指令集优化

v11：矩阵分块

v12：PACK矩阵B，但实际上PACK矩阵B与否不重要，因为PACK的意义是连续访问内存，而按行加载的B矩阵本来就能做到

v13：PACK矩阵A和B，对A还是蛮重要的，因为A本身是按列加载，所以性能果然显著提升

```cpp
// 摘录自 armv7a/src/MMult_4x4_18.h

/**
pack A means

Input:
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7

8 9 a b  c d e f
8 9 a b  c d e f
8 9 a b  c d e f
8 9 a b  c d e f

Pack it zigzag

Output:
0 0 0 0 1 1 1 1 2 2 2 2 3 3 3 3
4 4 4 4 5 5 5 5 6 6 6 6 7 7 7 7
8 8 8 8 9 9 9 9 a a a a b b b b 
c c c c d d d d e e e e f f f f

Draw it with a line
*/

/*
suppose that k and n is mutiple of 4
pack B means

Input:
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7
0 1 2 3  4 5 6 7

8 9 a b  c d e f
8 9 a b  c d e f
8 9 a b  c d e f
8 9 a b  c d e f

Pack it zigzag, not like pack A

Output:
0 1 2 3 0 1 2 3 0 1 2 3 0 1 2 3
8 9 a b 8 9 a b 8 9 a b 8 9 a b
4 5 6 7 4 5 6 7 4 5 6 7 4 5 6 7
c d e f c d e f c d e f c d e f
*/
```

v14：增加寄存器，一次算64个数

大概就是这样，感觉懂了在这里矩阵如何运算和怎么看SSE指令就差不多～