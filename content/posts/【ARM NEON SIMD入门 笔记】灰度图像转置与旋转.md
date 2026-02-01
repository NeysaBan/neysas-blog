---
title: "【ARM NEON SIMD入门 | 笔记】灰度图像转置与旋转"
date: "2023-03-14"
author: "NeysaBan"
category: "cpu"
tags:
 - cpu
 - simd
 - arm
readTime: "9分钟"
---

**✨ Ref**

[灰度图像转置与旋转_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1GJ411x7XW?p=4&spm_id_from=pageDriver&vd_source=f2b3b4ebaaa049d7cb0ace5981b12a4c)

## 转置

![|1004x276](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740892.png)

输入矩阵是2*2的矩阵，然后转置这个矩阵

![|1004x599](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740893.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740894.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740895.png)

vrtn：0、1、2、3在第一个寄存器，4、5、6、7在第二个寄存器；经过这个转置函数，1、4交换，3、6交换

Q：这种功能的意义？

A：

<aside>
🔥 转置的意义

一下子访问一行很容易做到，但一下子访问一列需要加载出所有的行才行，因此对图像做转置，方便访问列

</aside>

## 举个🌰 转置8bit灰度图像

（需要转置三次

~~// 每个8*8的小方块转置一次就可以~~

- vtrn_u8转置：0、1 | 2、3 | 4、5 |  6、7换；比如0、1，是1、8换…，以此类推
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740896.png)
    
- vtrn_u16转置：0、2 | 1、3 | 4、6 | 5、7换；比如0、2，是2、10和16、24换，以此类推
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740897.png)
    
- vtrn_u32是0、4|…换，4、12、20、28和32、40、48、56换
    
      现在终于转置成功了
    
    ![|742x276](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740898.png)
    

> up主测试：比普通cpu转置操作，速度提高大概8倍
> 

```c

## trainsposition.h
#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <png.h>
#include <string.h>
#include "util.h"
#include "util.c"
 
void tran_32(   
                uint32_t *bildcol_,     //Eingangsdaten
                uint32_t *bildcol_t_,   //Ausgangsdaten
                size_t gx,              //Eingangsbildbereit
                size_t gy               //Ausgangsbildbereit
            );
 
void tran_16(   
                uint16_t *in_,          //Eingangsdaten
                uint16_t *out_,         //Ausgangsdaten
                size_t gx,              //Eingangsbildbereit
                size_t gy               //Ausgangsbildbereit
            );
 
void tran_8(    
                png_bytep gbild_,       //Eingangsdaten
                png_bytep gbild_t_,     //Ausgangsdaten
                size_t gx,              //Eingangsbildbereit
                size_t gy               //Ausgangsbildbereit
            );
```

```c
## tranposition.cc
//************************************************************************************
//
//
//          32-bit-tief Bild transposition
//
//
//
//************************************************************************************
 
void tran_32(uint32_t *bildcol_, uint32_t *bildcol_t_, size_t gx, size_t gy)
{
    //2D-var für originales und getransponiertes Bild
    uint32_t **bildcol = malloc(sizeof(char *) * gy);
    uint32_t **bildcol_t = malloc(sizeof(char *) * gx);
    for(int i = 0 ; i < gy ; i++)
    {
        bildcol[i] = bildcol_ + i * gx;
    }
    for(int i = 0 ; i < gx ; i++)
    {
        bildcol_t[i] = bildcol_t_ + i * gy;
    }
 
    //Neon-Register definieren
    uint32x2x2_t reg3222_0, reg3222_1, reg3222_2, reg3222_3, reg3222_4, reg3222_5, reg3222_6, reg3222_7;
    uint32x2x2_t reg3222_8, reg3222_9, reg3222_10, reg3222_11, reg3222_12, reg3222_13, reg3222_14, reg3222_15;
 
    int gx_r = gx % 16;
    int gy_r = gy % 2;
    int gx_l = gx - 15;
    int gy_l = gy - 1;
    int gx_k = gx - gx_r;
    int gy_k = gy - gy_r;
    int x, y; 
 
    for(y = 0 ; y < gy_l ; y += 2)
    {
        for(x = 0 ; x < gx_l ; x += 16)
        {
            //laden 2 Reihen Daten
            reg3222_0.val[0] = vld1_u32(&bildcol[y    ][x    ]);
            reg3222_0.val[1] = vld1_u32(&bildcol[y + 1][x    ]);
            reg3222_1.val[0] = vld1_u32(&bildcol[y    ][x + 2]);
            reg3222_1.val[1] = vld1_u32(&bildcol[y + 1][x + 2]);
            reg3222_2.val[0] = vld1_u32(&bildcol[y    ][x + 4]);
            reg3222_2.val[1] = vld1_u32(&bildcol[y + 1][x + 4]);
            reg3222_3.val[0] = vld1_u32(&bildcol[y    ][x + 6]);
            reg3222_3.val[1] = vld1_u32(&bildcol[y + 1][x + 6]);
            reg3222_4.val[0] = vld1_u32(&bildcol[y    ][x + 8]);
            reg3222_4.val[1] = vld1_u32(&bildcol[y + 1][x + 8]);
            reg3222_5.val[0] = vld1_u32(&bildcol[y    ][x + 10]);
            reg3222_5.val[1] = vld1_u32(&bildcol[y + 1][x + 10]);
            reg3222_6.val[0] = vld1_u32(&bildcol[y    ][x + 12]);
            reg3222_6.val[1] = vld1_u32(&bildcol[y + 1][x + 12]);
            reg3222_7.val[0] = vld1_u32(&bildcol[y    ][x + 14]);
            reg3222_7.val[1] = vld1_u32(&bildcol[y + 1][x + 14]);
 
            //transposition
            reg3222_8 = vtrn_u32(reg3222_0.val[0],reg3222_0.val[1]);
            reg3222_9 = vtrn_u32(reg3222_1.val[0],reg3222_1.val[1]);
            reg3222_10 = vtrn_u32(reg3222_2.val[0],reg3222_2.val[1]);
            reg3222_11 = vtrn_u32(reg3222_3.val[0],reg3222_3.val[1]);
            reg3222_12 = vtrn_u32(reg3222_4.val[0],reg3222_4.val[1]);
            reg3222_13 = vtrn_u32(reg3222_5.val[0],reg3222_5.val[1]);
            reg3222_14 = vtrn_u32(reg3222_6.val[0],reg3222_6.val[1]);
            reg3222_15 = vtrn_u32(reg3222_7.val[0],reg3222_7.val[1]);
 
            //store
            vst1_u32(&bildcol_t[x    ][y], reg3222_8.val[0]);
            vst1_u32(&bildcol_t[x + 1][y], reg3222_8.val[1]);
            vst1_u32(&bildcol_t[x + 2][y], reg3222_9.val[0]);
            vst1_u32(&bildcol_t[x + 3][y], reg3222_9.val[1]);
            vst1_u32(&bildcol_t[x + 4][y], reg3222_10.val[0]);
            vst1_u32(&bildcol_t[x + 5][y], reg3222_10.val[1]);
            vst1_u32(&bildcol_t[x + 6][y], reg3222_11.val[0]);
            vst1_u32(&bildcol_t[x + 7][y], reg3222_11.val[1]);
            vst1_u32(&bildcol_t[x + 8][y], reg3222_12.val[0]);
            vst1_u32(&bildcol_t[x + 9][y], reg3222_12.val[1]);
            vst1_u32(&bildcol_t[x + 10][y], reg3222_13.val[0]);
            vst1_u32(&bildcol_t[x + 11][y], reg3222_13.val[1]);
            vst1_u32(&bildcol_t[x + 12][y], reg3222_14.val[0]);
            vst1_u32(&bildcol_t[x + 13][y], reg3222_14.val[1]);
            vst1_u32(&bildcol_t[x + 14][y], reg3222_15.val[0]);
            vst1_u32(&bildcol_t[x + 15][y], reg3222_15.val[1]);
        }
    }
 
    //Rest transponieren
    for(y = gy_k ; y < gy ; y++)
    {
      for(x = 0 ; x < gx ; x++)
      {
        bildcol_t[x][y] = bildcol[y][x];
        }
    }
    for(x = gx_k ; x < gx ; x++)
    {    
      for(y = 0 ; y < gy_k ; y++)
      {
        bildcol_t[x][y] = bildcol[y][x];
      }
    }
    free(bildcol);
    free(bildcol_t);
}
 
//************************************************************************************
//
//
//          16-bit-tief Bild transposition
//
//
//
//************************************************************************************
 
void tran_16(uint16_t *in_, uint16_t *out_, size_t gx, size_t gy)
{
    uint16_t **in = malloc(sizeof(char *) * gy);
    uint16_t **out = malloc(sizeof(char *) * gy);
    for(int i = 0 ; i < gy ; i++)
    {
        in[i] = in_ + i * gx;
    }
    for(int i = 0 ; i < gx ; i++)
    {
        out[i] = out_ + i * gy;
    }
 
 
    uint16x4x2_t reg1642_0, reg1642_1, reg1642_2, reg1642_3;
    uint16x4x2_t reg1642_4, reg1642_5, reg1642_6, reg1642_7;
    uint16x4x2_t reg1642t_0, reg1642t_1, reg1642t_2, reg1642t_3;
    uint32x2x2_t reg3222_0, reg3222_1, reg3222_2, reg3222_3;
    uint32x2x2_t reg3222_4, reg3222_5, reg3222_6, reg3222_7;
    uint32x2x2_t reg3224t_0, reg3224t_1, reg3224t_2, reg3224t_3;
 
		// 优化代码，这期没讲
    int gx_r = gx % 8;
    int gy_r = gy % 4;
    int gx_l = gx - 7;
    int gy_l = gy - 3;
    int gx_k = gx - gx_r;
    int gy_k = gy - gy_r;
    int x, y; 
 
    for(y = 0 ; y < gy_l ; y +=4)
    {
        for(x = 0 ; x < gx_l ; x += 8)
        {
            reg1642_0.val[0] = vld1_u16(&in[y    ][x    ]);
            reg1642_0.val[1] = vld1_u16(&in[y + 1][x    ]);
            reg1642_1.val[0] = vld1_u16(&in[y + 2][x    ]);
            reg1642_1.val[1] = vld1_u16(&in[y + 3][x    ]);
            reg1642_2.val[0] = vld1_u16(&in[y    ][x + 4]);
            reg1642_2.val[1] = vld1_u16(&in[y + 1][x + 4]);
            reg1642_3.val[0] = vld1_u16(&in[y + 2][x + 4]);
            reg1642_3.val[1] = vld1_u16(&in[y + 3][x + 4]);
 
            reg1642t_0 = vtrn_u16(reg1642_0.val[0], reg1642_0.val[1]);
            reg1642t_1 = vtrn_u16(reg1642_1.val[0], reg1642_1.val[1]);
            reg1642t_2 = vtrn_u16(reg1642_2.val[0], reg1642_2.val[1]);
            reg1642t_3 = vtrn_u16(reg1642_3.val[0], reg1642_3.val[1]);
 
            reg3222_0.val[0] = vreinterpret_u32_u16(reg1642t_0.val[0]);
            reg3222_0.val[1] = vreinterpret_u32_u16(reg1642t_0.val[1]);
            reg3222_1.val[0] = vreinterpret_u32_u16(reg1642t_1.val[0]);
            reg3222_1.val[1] = vreinterpret_u32_u16(reg1642t_1.val[1]);
            reg3222_2.val[0] = vreinterpret_u32_u16(reg1642t_2.val[0]);
            reg3222_2.val[1] = vreinterpret_u32_u16(reg1642t_2.val[1]);
            reg3222_3.val[0] = vreinterpret_u32_u16(reg1642t_3.val[0]);
            reg3222_3.val[1] = vreinterpret_u32_u16(reg1642t_3.val[1]);
 
            reg3224t_0 = vtrn_u32(reg3222_0.val[0], reg3222_1.val[0]);
            reg3224t_1 = vtrn_u32(reg3222_0.val[1], reg3222_1.val[1]);
            reg3224t_2 = vtrn_u32(reg3222_2.val[0], reg3222_3.val[0]);
            reg3224t_3 = vtrn_u32(reg3222_2.val[1], reg3222_3.val[1]);
 
            reg1642_0.val[0] = vreinterpret_u16_u32(reg3224t_0.val[0]);
            reg1642_0.val[1] = vreinterpret_u16_u32(reg3224t_0.val[1]);
            reg1642_1.val[0] = vreinterpret_u16_u32(reg3224t_1.val[0]);
            reg1642_1.val[1] = vreinterpret_u16_u32(reg3224t_1.val[1]);
            reg1642_2.val[0] = vreinterpret_u16_u32(reg3224t_2.val[0]);
            reg1642_2.val[1] = vreinterpret_u16_u32(reg3224t_2.val[1]);
            reg1642_3.val[0] = vreinterpret_u16_u32(reg3224t_3.val[0]);
            reg1642_3.val[1] = vreinterpret_u16_u32(reg3224t_3.val[1]);
 
            vst1_u16(&out[x    ][y], reg1642_0.val[0]);
            vst1_u16(&out[x + 1][y], reg1642_1.val[0]);
            vst1_u16(&out[x + 2][y], reg1642_0.val[1]);
            vst1_u16(&out[x + 3][y], reg1642_1.val[1]);
            vst1_u16(&out[x + 4][y], reg1642_2.val[0]);
            vst1_u16(&out[x + 5][y], reg1642_3.val[0]);
            vst1_u16(&out[x + 6][y], reg1642_2.val[1]);
            vst1_u16(&out[x + 7][y], reg1642_3.val[1]);
        }
    }
 
    for(y = gy_k ; y < gy ; y++)
    {
      for(x = 0 ; x < gx ; x++)
      {
            out[x][y] = in[y][x];
        }
    }
    for(x = gx_k ; x < gx ; x++)
    {    
      for(y = 0 ; y < gy_k ; y++)
      {
            out[x][y] = in[y][x];
      }
    }
    free(in);
    free(out);
}
 
//************************************************************************************
//
//
//          8-bit-tief Bild transposition  8bit灰度图像转置
//
//
//
//************************************************************************************
 
void tran_8(png_bytep gbild_, png_bytep gbild_t_, size_t gx, size_t gy)
{
    //2D-var für originales und getransponiertes Bild
    png_bytep *gbild = malloc(sizeof(char *) * gy);
    png_bytep *gbild_t = malloc(sizeof(char *) * gx);
 
    for(int i = 0 ; i < gy ; i++)
    {
        gbild[i] = gbild_ + i * gx;
    }
    for(int i = 0 ; i < gx ; i++)
    {
        gbild_t[i] = gbild_t_ + i * gy;
    }
 
 
    //Neon-Register definieren
    uint8x8x2_t reg882_0, reg882_1, reg882_2, reg882_3;
    uint16x4x2_t reg1642_0, reg1642_1, reg1642_2, reg1642_3;
    uint32x2x2_t reg3222_0, reg3222_1, reg3222_2, reg3222_3;
    int gx_r = gx % 8;
    int gy_r = gy % 8;
    int gx_l = gx - 7;
    int gy_l = gy - 7;
    int gx_k = gx - gx_r;
    int gy_k = gy - gy_r;
    int x, y;
 
 
    for(y = 0 ; y < gy_l ; y+=8)
    {
        for(x = 0 ; x < gx_l ; x+=8)
        {
            //laden 8 Reihen Daten 先加载8bit数据
					 // 每两行交换，所以8行4组，0、1、2、3组
          reg882_0.val[0] = vld1_u8(&gbild[y][x]);
          reg882_0.val[1] = vld1_u8(&gbild[y + 1][x]);
          reg882_1.val[0] = vld1_u8(&gbild[y + 2][x]);
          reg882_1.val[1] = vld1_u8(&gbild[y + 3][x]);
          reg882_2.val[0] = vld1_u8(&gbild[y + 4][x]);
          reg882_2.val[1] = vld1_u8(&gbild[y + 5][x]);
          reg882_3.val[0] = vld1_u8(&gbild[y + 6][x]);
          reg882_3.val[1] = vld1_u8(&gbild[y + 7][x]);
 
          //je 2 Reihen transponieren  每组内部交换
          reg882_0 = vtrn_u8(reg882_0.val[0], reg882_0.val[1]);
          reg882_1 = vtrn_u8(reg882_1.val[0], reg882_1.val[1]);
          reg882_2 = vtrn_u8(reg882_2.val[0], reg882_2.val[1]);
          reg882_3 = vtrn_u8(reg882_3.val[0], reg882_3.val[1]);
 
          //8-bit-tief -> 16-bit-tief, dann 1 und 3 Reihe, 2 und 4 Reihen, 5 und 7 Reihen, 6 und 8 Reihen transponieren
         // 把8*8的寄存器看成16*4的寄存器，并让1、3行交换，也就是第0组的第0行，和第1组的第0行
					reg1642_0 = vtrn_u16(vreinterpret_u16_u8(reg882_0.val[0]), vreinterpret_u16_u8(reg882_1.val[0]));
          reg1642_1 = vtrn_u16(vreinterpret_u16_u8(reg882_0.val[1]), vreinterpret_u16_u8(reg882_1.val[1]));
          reg1642_2 = vtrn_u16(vreinterpret_u16_u8(reg882_2.val[0]), vreinterpret_u16_u8(reg882_3.val[0]));
          reg1642_3 = vtrn_u16(vreinterpret_u16_u8(reg882_2.val[1]), vreinterpret_u16_u8(reg882_3.val[1]));
 
          //16-bit-tief -> 32-bit-tief, dann 1 und 5 Reihen, 2 und 6 Reihen, 3 und 7 Reihen, 4 und 8 Reihen transpinieren
         // 把16*4的寄存器看成32*2的寄存器，并让1、5行交换，也就是第0组第0行和第2组第0行
          reg3222_0 = vtrn_u32(vreinterpret_u32_u16(reg1642_0.val[0]), vreinterpret_u32_u16(reg1642_2.val[0]));
          reg3222_1 = vtrn_u32(vreinterpret_u32_u16(reg1642_0.val[1]), vreinterpret_u32_u16(reg1642_2.val[1]));
          reg3222_2 = vtrn_u32(vreinterpret_u32_u16(reg1642_1.val[0]), vreinterpret_u32_u16(reg1642_3.val[0]));
          reg3222_3 = vtrn_u32(vreinterpret_u32_u16(reg1642_1.val[1]), vreinterpret_u32_u16(reg1642_3.val[1]));
 
          //32-bit-tief -> 8-bit-tief
         // 把一个32bit深的数看成8bit的数
          reg882_0.val[0] = vreinterpret_u8_u32(reg3222_0.val[0]);
          reg882_0.val[1] = vreinterpret_u8_u32(reg3222_0.val[1]);
          reg882_1.val[0] = vreinterpret_u8_u32(reg3222_1.val[0]);
          reg882_1.val[1] = vreinterpret_u8_u32(reg3222_1.val[1]);
          reg882_2.val[0] = vreinterpret_u8_u32(reg3222_2.val[0]);
          reg882_2.val[1] = vreinterpret_u8_u32(reg3222_2.val[1]);
          reg882_3.val[0] = vreinterpret_u8_u32(reg3222_3.val[0]);
          reg882_3.val[1] = vreinterpret_u8_u32(reg3222_3.val[1]);
 
          //store
					// 最后回写到相应的位置
          vst1_u8(&gbild_t[x    ][y], reg882_0.val[0]);
          vst1_u8(&gbild_t[x + 1][y], reg882_2.val[0]);
          vst1_u8(&gbild_t[x + 2][y], reg882_1.val[0]);
          vst1_u8(&gbild_t[x + 3][y], reg882_3.val[0]);
          vst1_u8(&gbild_t[x + 4][y], reg882_0.val[1]);
          vst1_u8(&gbild_t[x + 5][y], reg882_2.val[1]);
          vst1_u8(&gbild_t[x + 6][y], reg882_1.val[1]);
          vst1_u8(&gbild_t[x + 7][y], reg882_3.val[1]);
      }
    }
 
    //Rest transponieren
    // 如果图片是一个13*9的图片，要用c语言单独实现剩余部分的转置
    for(y = gy_k ; y < gy ; y++)
    {
      for(x = 0 ; x < gx ; x++)
      {
        gbild_t[x][y] = gbild[y][x];
        }
    }
    for(x = gx_k ; x < gx ; x++)
    {    
      for(y = 0 ; y < gy_k ; y++)
      {
        gbild_t[x][y] = gbild[y][x];
      }
    }
    // 还要把申请的内存释放掉，以免内存泄漏
    free(gbild);
    free(gbild_t);
}
```

```c
## transposition_test.c

#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <png.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include "util.h"
#include "util.c"       
#include "transposition.c"
 
 
int main()
{
    png_bytep input;
    size_t x, y;        //Var für Bild und Muster
    readImageData("gray.png",&input,&x,&y); //Bild lesen
 
    png_bytep output = malloc(sizeof(png_bytep) * x * y);
 
    tran_8(input, output, x, y);    //8-bit-tief Bild Transposition
 
    writeImageData("out.png", output, y, x, 8); 
		// 记得释放空间
    free(input)
    free(output);
}
```

## 再举个🌰 灰度图任意角度旋转

要确定两个坐标之间的关系

// 其实SLAM那本书里也有写坐标变换（包括为什么二维坐标扩展到三维，但是忘记了😕《视觉SLAM13讲》ch03 P73）

<aside>
🔥 射影几何中的概念：在二维向量的末位添1，变成三维向量，成为齐次坐标；对这个三维向量，可以把平移和旋转写在一个矩阵里，使这个关系变成齐次的。只要把该向量中的所有维除以最后一维的值（得到非齐次坐标），就得到它在二维空间中的位置。

</aside>

[云胶片-图像浏览器绕任意角度旋转-转换矩阵推导_恒哥的爸爸的博客-CSDN博客](https://blog.csdn.net/rendaweibuaa/article/details/103218612)

[图像处理学习笔记之图像的几何变换(3)旋转变换_图像变换_linshanxian的博客-CSDN博客](https://blog.csdn.net/linshanxian/article/details/68944748/)

- 先把图像中心移动到坐标轴原点
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740899.png)
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740900.png)
    
    位移矩阵，w’ h’是因为是旋转之后的图，~~往水平负轴方向走，往~~
    
- 旋转图像
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740901.png)
    
    旋转矩阵
    
- 把坐标轴移回去
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740902.png)
    

也就是说，三个矩阵相乘，就能得到像素之间的关系👇

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011740903.png)

由于后面算的都是定值，所以算的时候先把前面算出来

## 代码

```c
## rotation.h

#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <png.h>
#include <string.h>
#include <math.h>
#include "util.h"
#include "util.c"
 
unsigned char *neon_rota(   int winkel,                 //winkle im Grad
                            unsigned char *gbild_in_,   //Eingangsbild
                            size_t gx,                  //Eingangsbildbereit
                            size_t gy,                  //Eingangsbildhöhe
                            size_t *x_out,              //Ausgangsbildbereit
                            size_t *y_out               //Ausgangsbildhöhe
                        );
```

```c
## rotation.c
unsigned char *neon_rota(float winkel, unsigned char *gbild_in_, size_t gx, size_t gy, size_t *x_out, size_t *y_out)
{
    // 先从弧度值转成正常角度值
    winkel = -1 * winkel;
    double pi = acos(-1);       //definieren pi = arccos(-1)
    float sin_c = (float)sin(winkel * pi / 180);        //berechnen sin(EingangsWinkel)
    float cos_c = (float)cos(winkel * pi / 180);        //berechnen cos(EingangsWinkel)
 
    // 因为使用强制类型转换实现四舍五入，所以+0.5
    *x_out = (int)(gx * fabs(cos_c) + gy * fabs(sin_c) + 0.5);      //berechnen die Größe des Ausgang-Bild 
    *y_out = (int)(gy * fabs(cos_c) + gx * fabs(sin_c) + 0.5);      //
 

		//中心移动到坐标轴原点
    //Mittelwert berechnen                                                              //W ,H : Breite und Höhe des Eingangsbild
                                                                                        //W',H': Breite und Höhe des Ausgangsbild
    float x_m = ((float)gx - 1) / 2 - (*x_out - 1) * cos_c / 2 - (*y_out - 1) * sin_c / 2;      //dx = 0,5W - 0,5W' * cos - 0,5H' * sin 
    float y_m = ((float)gy - 1) / 2 + (*x_out - 1) * sin_c / 2 - (*y_out - 1) * cos_c / 2;      //dy = 0,5H + 0,5W' * sin - 0,5H' * cos
 
    float koor_x[32];       //bauen Koordinatensystem für AusgangsBild
    float koor_y[32];
    int int_x;
    int int_y;
    int x, y;
    int m;
    if(x_out > y_out)        
        m = *x_out;
    else
        m = *y_out;
 
 
    unsigned char **gbild_in = malloc(sizeof(char *) * gy);
    unsigned char *gbild_out_ = malloc(sizeof(unsigned char) * (*x_out * *y_out + 16));
    unsigned char **gbild_out = malloc(sizeof(char *) * *y_out);
    float *koor = malloc(sizeof(float) * (m + 16));
    for(int i = 0 ; i < m + 16 ; i++)
    {
        koor[i] = (float)i;     //bauen Koordinatensystem für EingangsBild 
    }
 
    //2D-Var
    for(int i = 0 ; i < gy ; i++)
    {
        gbild_in[i] = gbild_in_ + i * gx;
    }
    for(int i = 0 ; i < *y_out ; i++)
    {
        gbild_out[i] = gbild_out_ + i * *x_out;
    }
 
    //Neon Reg
    float32x4_t f324_x0, f324_x1, f324_x2, f324_x3;
    float32x4_t f324_y, fsin, fcos, fx_m, fy_m;
    float32x4_t fx_out_00, fx_out_01, fx_out_02, fx_out_03;
    float32x4_t fx_out_10, fx_out_11, fx_out_12, fx_out_13;
    float32x4_t fy_out_00, fy_out_01, fy_out_02, fy_out_03;
    float32x4_t fy_out_10, fy_out_11, fy_out_12, fy_out_13;
     
    //laden sin, cos, und Mittelwert
    fsin = vdupq_n_f32(sin_c);
    fcos = vdupq_n_f32(cos_c);
     
    for(y = 0 ; y < *y_out ; y++)
    {
 
        //x_m = y * sin + dx
        //y_m = y * cos + dy
				// 先加载定值
        float x_m_m = x_m + y * sin_c;
        float y_m_m = y_m + y * cos_c;
        fx_m = vdupq_n_f32(x_m_m);
        fy_m = vdupq_n_f32(y_m_m);
 
 
        for(x = 0 ; x < *x_out ; x += 16)
        {
            //laden X-Koordinaten
						// 先加载x
            f324_x0 = vld1q_f32(koor + x    );
            f324_x1 = vld1q_f32(koor + x + 4);
            f324_x2 = vld1q_f32(koor + x + 8);
            f324_x3 = vld1q_f32(koor + x + 12);
 
            //X: out1 = dx + X * cos 
            // 计算x的值加上中间变量
            fx_out_10 = vmlaq_f32(fx_m, f324_x0, fcos);
            fx_out_11 = vmlaq_f32(fx_m, f324_x1, fcos);
            fx_out_12 = vmlaq_f32(fx_m, f324_x2, fcos);
            fx_out_13 = vmlaq_f32(fx_m, f324_x3, fcos);
 
            //Y: out1 = dy - X * sin 
            fy_out_10 = vmlsq_f32(fy_m, f324_x0, fsin);
            fy_out_11 = vmlsq_f32(fy_m, f324_x1, fsin);
            fy_out_12 = vmlsq_f32(fy_m, f324_x2, fsin);
            fy_out_13 = vmlsq_f32(fy_m, f324_x3, fsin);
 
            //zurückschreiben
            vst1q_f32(&koor_x[0], fx_out_10);
            vst1q_f32(&koor_x[4], fx_out_11);
            vst1q_f32(&koor_x[8], fx_out_12);
            vst1q_f32(&koor_x[12], fx_out_13);
 
            vst1q_f32(&koor_y[0], fy_out_10);
            vst1q_f32(&koor_y[4], fy_out_11);
            vst1q_f32(&koor_y[8], fy_out_12);
            vst1q_f32(&koor_y[12], fy_out_13);
 
 
            for(int i = 0 ; i < 16 ; i++)
            {
                // 因为计算出来的坐标有负数，这部分应该置0（就是偏出坐标轴的部分）
                int_x = (int)(round(koor_x[i]));        //nächsten Koordinate
                int_y = (int)(round(koor_y[i]));
 
                if(int_x >= 0 && int_y >= 0 && int_x < gx && int_y < gy)        //wenn die Koordinaten sind im originalen Bild, zurückschreiben
                    gbild_out[y][x + i] = gbild_in[int_y][int_x];
                else
                    gbild_out[y][x + i] = 0;                                    //sonst schreiben 255 (weiß)
                //if(x + i == 416)
                    //printf("%d    %d  %d  %d  %f  %f  %d\n", x + i, y, int_x, int_y, koor_x[i], koor_y[i], gbild_out[y][x + i]);
                 
            }
        }
    }
    /*
    for(int i = 0 ; i < *y_out ; i++)
    {
        for(int ii = 0 ; ii < *x_out ; ii++)
        {
            printf("%d  ",gbild_out[i][ii] );
        }
        printf("\n");
    }
    */
    //printf("%p\n",gbild_out_ );
    free(gbild_in);
    free(gbild_out);
    free(koor);
    return(gbild_out_);     //Zeiger rückgeben
}
```

```c
## rotation_test.c

#include <stdio.h>
#include <stdlib.h>
#include <arm_neon.h>
#include <png.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include "util.h"
#include "util.c"       
#include "transposition.c"
#include "rotation.c"
 
 
int main(int argc, char const *argv[])
{
    png_bytep input, output;
    size_t x, y, x_out, y_out;      //Var für Bild und Muster
    readImageData("gray.png",&input,&x,&y); //Bild lesen
    float winkel = atof(argv[1]);
 
    output = neon_rota(winkel, input, x, y, &x_out, &y_out);
 
    writeImageData("out2.png", output, x_out, y_out, 8);    
 
 
    free(input);
    free(output);
}
```