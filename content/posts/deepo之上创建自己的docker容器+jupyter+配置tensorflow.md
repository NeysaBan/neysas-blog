---
title: "deepo之上创建自己的docker容器+jupyter+配置tensorflow"
date: "2021-09-16"
author: "NeysaBan"
category: "环境"
tags:
 - 环境
readTime: "10分钟"
---

最开始要自己配一个容器的起因是和大家一起用一个容器比较混乱，然后我还要用tensorflow0.1.15版本，和当时容器中的tensorflow版本不匹配。种种原因之下，就自己配了个容器。

# 前置知识

### docker

🍇docker类似于以前用的虚拟机，这里主要有两个概念：

- 镜像：就是原始版本，类似于ubuntu18.04\centos7······，可以直接从网上拉取到宿主机上；当然，也可以把自己配置好的容器保存为镜像
- 容器：在镜像之上建立的，就是我们所使用的虚拟环境本体，一个镜像可以对应很多个容器

🍒除此之外，要注意的是，如果要在外部使用端口有访问自己的容器（比如远程登陆、使用jupyter时）,当然不能简单粗暴地开放容器对应的端口就好，容器始终是个虚拟环境，最后还是要找到宿主机上来。也就是说，要在外部使用端口，就要做好：

- 开放宿主机和容器的端口
- 做好宿主机和容器端口的映射

这一步最好最好的就是在建立容器的时候做好，不然后续再追加端口，就需要重启宿主机上的docker服务，换言之，所有的容器都要随之重启

🥝最好要做好容器中文件的保护，也就是可以建立宿主机文件夹和容器中重要文件夹的映射，这一步也是最好在容器建立之初就做好

🍋容器本身权利是很低的，最好在创立之初赋予它特权，不然后续会有很多命令不能使用

🍍docker创建容器[参数说明](https://blog.csdn.net/mtsunbw/article/details/109708003?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164164529416780264090433%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=164164529416780264090433&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-10-109708003.pc_search_insert_ulrmf&utm_term=docker+run+--ipc%3D%3Dhost&spm=1018.2226.3001.4187)

### linux文件夹说明

因为我想要比较清楚地管理容器，不要东西安得这里也是那里也是，所以看了下linux下的文件夹含义，更详细的在[link](https://blog.csdn.net/yangtze_1006/article/details/46738489?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164164140316781685372263%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=164164140316781685372263&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-2-46738489.pc_search_insert_ulrmf&utm_term=linux%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84&spm=1018.2226.3001.4187)1，[link](https://blog.51cto.com/yangrong/1288072)2 ，这里只说明比较重要的，其中标表情的是目前一定要了解的
![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011708878.png)


# 前期弯路

因为师兄们已经配置好宿主机上docker的环境了，所以这里不再赘述

最开始是想直接拉取一个最亲切的unbuntu16.04版本的镜像，当然最后失败了，具体原因是因为这样直接拉取，最后配置tensorflow的时候还要自己安装驱动，安装驱动的时候屡试屡败，这里先按下不表，记录一下这里的步骤：

👉

```bash
#拉取ubuntu16.04
docker pull ubuntu:16.04

#查看docker现在的镜像
docker images

#参数说明
#-it 保留命令行运行
#-d 创建一个守护式容器在后台运行
#--privileged==true一定要加上，不然后面连systemctl都没办法运行
#--name容器名字
#-p 前面是主机端口，后面是容器端口,这里主机端口910映射到容器22端口的原因是因为我要用ssh远程登陆，所以容器端口一定要映射到tcp的22端口
#ubuntu:16.04就是我这里使用的镜像name:tag
#设置容器中的1号进程为/sbin/init，以使用systemctl?
docker run -it -d --privileged=true --name ubuntu_pxr -p 910:22 ubuntu:16.04 /sbin/init

#查看所有容器
docker ps -a
#查看正在运行的容器
docker ps
####这一步可以看到容器的id

#启动容器
docker start 容器id

#进入到容器
docker attach 容器id
```

👉这样就可以进入容器了，但是现在容器里面基本啥命令也没有，也不能通过ssh远程登录，所以这些还需要自己配置一下

```bash
#配置容器密码，后续ssh服务也可以通过这个密码登录
passwd

#安装vim，这里是为了下面配置镜像源，不然只能用echo写入
apt-get install vim
#安装之后用:q强行退出

#配置国内镜像源
root@ :/# mv /etc/apt/sources.list /etc/apt/sources.list.bak
root@ :/# vim sources.list 
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse

#换完源记得更新一下
apt-get upgrade

#设置root可以通过ssh远程登陆，当然，我们学校服务器现在常常被入侵，解决这个问题最好的办法是使用公私钥，这里不再赘述，只说一下怎么用设置密码ssh远程登录
apt-get install openssh-server
apt-get install openssh-clients   #网上说要这一步，但实际上最后我没装上
#修改sshd配置文件
vim /etc/ssh/sshd_config
PermitRootLogin yes #修改内容
#重启ssh服务
service ssh restart
#现在就可以尝试在windows命令行上使用
#端口号：一开始配置容器时映射到容器22端口的宿主端口，这里应该是910
ssh -p 端口号 root@宿主机ip
```

👉安装python

```bash
#在usr/local目录下
wget https://npm.taobao.org/mirrors/python/3.6.9/Python-3.6.9.tgz
#解压安装包

##发现没有gcc-c++，直接安装有错误，最后安装了gcc

###最后出现了在命令行中敲python但是command not found的情况，用xftp查看，也不知道为什么python3.6.9安装到usr/local/bin里边去了（也可以whereis查找）
###，实际上这个文件夹需要在/usr/local/bin/python3.6（不管了）。总之这肯定是环境变量没配好，ubuntu环境变量是在/usr/bin下边登记，所以要增加软链接
ln -s /usr/local/bin/python3.6 /usr/bin/python
```

👉下面其实还尝试安装了tensorflow，但实际上这样还要装驱动，很麻烦，弃用

👉补充内容

docker端口出现过不能用的情况，重启ssh又报错，情况及解决办法如下

```bash
root@fafa58ef1685:/# service ssh restart
/etc/ssh/sshd_config line 38: Deprecated option RSAAuthentication
 * Restarting OpenBSD Secure Shell server sshd  

####deprecated说是已弃用，就改了相应的文件，注释掉了这一行。再重启服务，还是有warning，但连得上（怪不得说有warning的悬崖只有程序员会掉下去）

root@fafa58ef1685:/#  service ssh restart
 * Restarting OpenBSD Secure Shell server sshd                                                                          
start-stop-daemon: warning: failed to kill 29: No such process
```

# Deepo——正道的光（包含大多数深度学习框架+jupyter）

其实这个师兄在组会上讲了，但是年少不知deepo好55，走了太多弯路，蓦然回首它在灯火阑珊处

首先还是要拉取镜像，这里注意要拉取gpu版的deepo。因为我们实验室服务器上师兄早就拉取好了这个镜像，所以不再赘述。

👉容器创建

```bash
#--runtime=nvidia使容器能调用本地gpu
#-v 宿主机中的/data/WorkSpace/code2tumb和容器中的/data映射，防止文件丢失；/data/dockerconfig:/config······配置映射？
#-p jupyter端口映射：宿主机98映射容器8888；ssh端口映射：宿主机22映射到容器910
#--ipc==host ipc模式？
#ufoym/deepo镜像
###jupyter notebook之后应该都是jupyter的命令
#--no-browser不自动打开浏览器
#--ip=0.0.0.0使用实例ip+端口访问
#--allow-root 以root用户启动
#--NotebookApp.token= jupyter密码？
#--notebook-dir='/data' 设置jupyter启动目录
docker run --runtime=nvidia -it -v /data/WorkSpace/code2tumb:/data -v /data/dockerconfig:/config -p 98:8888 -p 910:22 --ipc=host ufoym/deepo jupyter notebook --no-browser --ip=0.0.0.0 --allow-root --NotebookApp.token= --notebook-dir='/data'

#这样容器就创建好了，然后就是按“前期弯路”中的内容，启动容器，进入容器。这时候就发现了一个问题，进不了容器，只能启动jupyter服务。只好在浏览器中ip地址:宿主机中映射的
#容器提供jupyter服务端口，进入jupyter，打开jupyter中的terminal，按照“前期弯路”中的内容配置好了ssh服务，这样就可以远程登录（“前期弯路”中有），也可以在宿主机中正常启动了
```

👉deepo中python啥的也都安装好了，它里面集成的深度学习框架基本都在默认python环境中,pip list一看，tensorflow版本太高（2.5.0），要换cuda+cudnn，tensorflow[版本对应](https://blog.csdn.net/weixin_44560088/article/details/117457619?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164164708716780366555940%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=164164708716780366555940&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-6-117457619.pc_search_insert_ulrmf&utm_term=tensorflow%E7%89%88%E6%9C%AC&spm=1018.2226.3001.4187)，nvdia[版本对应与下载更快的网址](https://blog.csdn.net/sinat_28371057/article/details/109278045?utm_term=cuda%E9%95%9C%E5%83%8F&utm_medium=distribute.pc_aggpage_search_result.none-task-blog-2~all~sobaiduweb~default-2-109278045&spm=3001.4430) ， 安装过程就不具体说了，网上随便百度一个就好，[可参考链接](https://zhuanlan.zhihu.com/p/64967173?from_voters_page=true)

1.驱动

不用管，这里面的很合适，当然这是对于tensorflow0.1.15来说

要注意的一个问题，驱动可以用nvidia-smi和nvcc —version查，但是nvidia查出来时cuda的driver api，nvcc查出来是runtime api，而

![|1085x103](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011707571.png)

2.cuda

这个很多人都以为只能装一个，其实不是，可以装多个，然后[切换版本](https://blog.csdn.net/DeepOscar/article/details/109808238?ops_request_misc=&request_id=&biz_id=102&utm_term=cuda%E7%89%88%E6%9C%AC%E5%88%87%E6%8D%A2&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-0-109808238.pc_search_em_sort&spm=1018.2226.3001.4187) 。切换的主要思想就是，python中使用的cuda是在/usr/local下软链接到的cuda，只要更改软链接就好了

就按照tensorflow的版本装就好

还改了~/.bashrc，已经不记得为什么了

3.cudnn

很顺利地安装完成

4.把python基本环境中的tensorflow换成0.1.15

看了一篇[博客](https://blog.csdn.net/weixin_43218120/article/details/108447605?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164015295916780366554693%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=164015295916780366554693&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-108447605.pc_search_em_sort&utm_term=%E5%AE%89%E8%A3%85tesnfordlow-gpu+1.15&spm=1018.2226.3001.4187)，先装cudatoolkit，再装tensorflow-gpu，就这样大胆把容器里的基本环境tensorflow换掉了，居然就可以了，大感震惊！！

（gcc版本还是很高8.4.0，但似乎没有影响，有些时候可能需要安装其他版本gcc）

其实在装的过程中还有一个报错，在此记录
![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011708703.png)

如何查看是否使用gpu跑的程序，python命令行中

```python
import tensorflow as tf
sess = tf.Session(config=tf.ConfigProto(log_device_placement=True))
```

👉[安装anaconda](https://blog.csdn.net/Nin7a/article/details/109250342?ops_request_misc=&request_id=&biz_id=102&utm_term=%E6%9C%8D%E5%8A%A1%E5%99%A8root%E5%AE%89%E8%A3%85anaconda&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-0-109250342.first_rank_v2_pc_rank_v29&spm=1018.2226.3001.4187)

要装到/opt下，这样可以保证后面不止root用户能用

conda安装requirements

```bash
conda install --yes --file requirements.txt
```

conda和pip混合使用，这样conda没有的包可以装到pip下

```bash
\\ Linux
while read requirement; do conda install --yes $requirement; done < requirements.txt
\\ Windows
FOR /F "delims=~" %f in (requirements.txt) DO conda install --yes "%f" || pip install "%f"
```

👉[不能没有的终端美化](https://blog.csdn.net/qwe641259875/article/details/107201760/?ops_request_misc=&request_id=&biz_id=102&utm_term=oh-my-zsh%E5%9B%BD%E5%86%85&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-0-107201760.pc_search_em_sort&spm=1018.2226.3001.4187)