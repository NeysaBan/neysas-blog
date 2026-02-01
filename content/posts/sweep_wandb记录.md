
---
title: "sweep_wandb记录"
date: "2022-05-10"
author: "NeysaBan"
category: "wandb"
excerpt: "深度学习搜索最优参数"
tags:
- DL
readTime: "3分钟"
---

type: Post
status: Published
date: 2022/05/10
tags: Base
category: DL
Brief: 搜索最优参数

今天学会了怎么搜索最优参数！（是在NCF项目里实践的）

[参考link](https://github.com/wandb/examples/tree/master/examples/pytorch/pytorch-cnn-fashion) （主要看看readme里怎么写的）

详解

💗主要步骤都在link里了，在项目里新建sweep就好

💘

ps：sweep configuration是在第二步里，删掉自动的配置然后复制上自己的配置。
![|573x608](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011714895.png)




💝还有需要注意的是，之前很疑惑，wandb到底是怎么把参数传给文件的，当时也没耐心看代码，今天好好看了看，流程如下：

- 在创建sweep时，第二步把想要搜索的参数上传
- 在代码中
    ![|587x410](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011714289.png)


    
    ### 步骤
    
    🧙🏻‍♀️更改默认参数
    ![|622x408](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011715030.png)

    
    🧙🏻‍♀️shell命令行运行就可以了
    ![|696x442](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011715907.png)
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011716693.png)
