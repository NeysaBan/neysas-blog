---
title: "【ARM NEON SIMD入门 | 笔记】C语言编程与数据加载及回写"
date: "2023-03-14"
author: "NeysaBan"
category: "cpu"
tags:
 - cpu
 - simd
 - arm
readTime: "8分钟"
---

**✨ Ref**

[NEON的加法，减法，乘法运算_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1GJ411x7XW?p=3&vd_source=f2b3b4ebaaa049d7cb0ace5981b12a4c)

## 数据类型

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737062.png)

<类型><大小>*<lane的数量>

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737063.png)

### 结构体

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737064.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737065.png)

多了一个 *2

## NEON INTRINSICS的使用

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737066.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737067.png)

操作名称：vadd

flags：q

type：u8， unsinged 8 bit

## C代码编程流程

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737068.png)

### 数据读取与回写

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737069.png)

vld1从内存加载向量，vst1向内存写入向量，右边是NEON展示的数据的读写指令

**malloc函数**

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737070.png)

## 举个🌰 **8 bit灰度图像的读取与写入**👇

[LIBPNG](https://libpng.sourceforge.io/index.html)

```bash
sudo apt-get install libpng // 安装库
```

```c
#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <png.h>
#include "util.h"
#include "util.c"
 
//8-bit 灰度PNG图片读取与写入
int main()
{
 
    size_t gx, gy;      //Var für Bild 图像尺寸  size_t = unsigned char
    png_bytep gbild_;   //图像数据首地址 unsigned char *
    readImageData("ggray.png",&gbild_,&gx,&gy); //Bild lesen 读图，gx是宽(有几列)，gy是高(有几行)
 
    unsigned char **gbild = malloc(sizeof(char *) * gy);    //定义二维数据
    for(int i = 0 ; i < gy ; i++)
    {
        gbild[i] = gbild_ + i * gx; 
    }
 
    //个人理解是二维图像如何在内存中存储,这里视频里的意思就是说，存成二维可以省去多余的计算，效率更高
		// 第一种是二维图像一维存储(多分配16个数据类型的内存空间，保证这段内存可知，不会出现段错误
    unsigned char *gbild_out_ = malloc(sizeof(char) * (gx * gy + 16)); //a[5 * 列数gx + 6] 5行6列
		// 第二种是二维图像二维存储    （二级指针）
		unsigned char **gbild_out = malloc(sizeof(char * ) * gy);
    for(int i = 0 ; i < gy ; i++)
    {
				// 这里的意思是让二维存储的指向行首的指针，指向分配好的一维存储的每行的行首位置
        gbild_out[i] = gbild_out_ + i * gx;     //gbild_out[1][3] 按行把像素赋值
    }
 
 
    uint8x16_t regin, mitt; //定义NEON向量
    for(int i = 0 ; i < gy ; i++) // 行
    {
        for(int ii = 0 ; ii < gx ; ii += 16) // 列
        {
					// gbild是二级指针
					// &gbild是行元素数组的首地址，可以看成名为row的数组
				 // row[i]定位到的就是这一行数组的是地址，可以看成名为col的数组
				// col[ii]定位到的就是(i,ii)位置的像素值
            regin = vld1q_u8(&gbild[i][ii]);    //数据读取
 
            // mitt = vdupq_n_u8(50);
           //  regin = vqsubq_u8(regin, mitt);
             
						// 这里是往gbild_out写，但是别忘记二级指针gblid_out_存储的行首地址是指向gblid_out具体的列的
            vst1q_u8(&gbild_out[i][ii], regin); //数据回写,一次写16个像素值，但这里怎么没考虑列数不是16的倍数呢？
        }
    }
    writeImageData("out.png", gbild_out_, gx, gy, 8);   //制作PNG图
}   
//struct timespec start, end;                           //Var für Zeitmessung
//clock_gettime(CLOCK_REALTIME, &start);                //Zeitmessung - Start
//clock_gettime(CLOCK_REALTIME, &end);                  //Zeitmessung - End
//float delta_ms = (end.tv_sec - start.tv_sec) * 1E3+ (float) (end.tv_nsec - start.tv_nsec) / 1E6;
//printf("\ndiff_time=%fms\n", delta_ms);
 
/*
mitt = vdupq_n_u8(50);
regin = vqsubq_u8(regin, mitt);
*/
```

ps：为什么vst1q_u8，但列却是+=16？

答：这是因为unsined char是8 bit，所以用u8后缀读写，但是这里是q后缀，也就是VLD1Q，如下 👇

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737071.png)

以load指令（从内存中加载数据）为例

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737072.png)

短指令

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011737073.png)

长指令

```bash
gcc -o test test.c -mfpu=neon -lpng16 // 编译,记得链接libpeng
```