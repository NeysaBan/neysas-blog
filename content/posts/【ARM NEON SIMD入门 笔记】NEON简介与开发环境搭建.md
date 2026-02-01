---
title: 【ARM NEON SIMD入门 笔记】NEON简介与开发环境搭建
date: 2023-03-13
author: NeysaBan
category: cpu
tags:
  - cpu
  - simd
  - arm
readTime: 10分钟
---

✨**Ref**

[NEON简介与开发环境搭建_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1GJ411x7XW/?buvid=XXBDF6AB73C2A5863D607C37B2DFD8E956F59&is_story_h5=false&mid=Bp5/DJdfEL88NbdlWBNWsg==&p=1&plat_id=116&share_from=ugc&share_medium=android&share_plat=android&share_session_id=c628bc69-1eb3-46cb-92ff-b322499050f7&share_source=GENERIC&share_tag=s_i&timestamp=1678449642&unique_k=SkBWwMY&up_id=260324764&vd_source=f2b3b4ebaaa049d7cb0ace5981b12a4c)

# 简单介绍

ARM-NEON——单指令多数据(Single instruction, multiple data) 协处理器 

核心：// 已经很宽了

寄存器：32x 64-bit type D-Register

可组成：16x 128-bit type Q-Register

这里的D（Double）、Q（Quadruple）是相对于32位寄存器而言，可以实现加减、移位、转置等简单的操作

## 寄存器的拆分格式

![|357x394](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011721395.png)


### 图例

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011723257.png)



一个时钟周期可以完成8个无符号整型的加法运算，这就是单指令多数据，一个指令并行处理8个数据

理论上是普通C语言的八倍，但其实可以更快（通过不同指令之间的并发执行，速度可以达到十倍左右

## 编程语言

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011723838.png)


NENO intrinsics

- 效率低：因为要把C语言再翻译成汇编语言再链接之类的，最后才能形成可执行程序
- 不必考虑超出寄存器数量：如果定义了40个寄存器，编译器会自动帮我们分配NEON寄存器

## 知识储备

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011723764.png)


# 开发环境

## 硬件

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011723203.png)


只用电脑，交叉编译也可以；但是程序没法运行，所以debug比较困难。

## 软件

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011723526.png)


最好不要在开发板上直接写代码，防止开发板变砖头，代码消失

## 资料

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011724984.png)


[如何免费在 arm 官网上下载合适的手册 - schips - 博客园](https://www.cnblogs.com/schips/p/how-to-find-and-download-arm-manual-in-offical-way.html)

[DEN0018A_neon_programmers_guide.pdf](%E3%80%90ARM%20NEON%20SIMD%E5%85%A5%E9%97%A8%20%E7%AC%94%E8%AE%B0%E3%80%91NEON%E7%AE%80%E4%BB%8B%E4%B8%8E%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA/DEN0018A_neon_programmers_guide.pdf)

或者直接线上看intrinsic指令

[Intrinsics – Arm Developer](https://developer.arm.com/architectures/instruction-sets/intrinsics/)

## 准备

![|795x323](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011724644.png)


视频演示： 16:23

# 举个🌰 **NEON实现a+b=c的并行计算**👇

```c
#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <math.h>

int main(){
    // 定义a\b\c
    unsigned char a[8] = {0,1,2,3,4,5,6,7};
    unsigned char b[8] = {8,9,10,11,12,13,14,15,16};
    unsigned char c[8];

    unit8x8_t rega, regb, regc; // 定义3个 8*8bit无符号整型的NEON寄存器

    // 加载a,b到寄存器
    rega = vld1_u8(&a[0]);
    regb = vld1_u8(&b[0]);

    regc = vadd_u8(rega, regb); // 做加法

    vst1_u8(&c[0], regc); // 回写到c中

    // 测试
    for(int i = 0 ; i < 8 ; i++){
        printf("%d ", c[i]);
    }
    printf("%n");
}
```

编译命令

```bash
gcc -o neon_test neon_test.c -mfpu=neon
```