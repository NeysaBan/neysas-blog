
---
title: "torch.fx PTQ量化流程"
date: "2023-12-01"
author: "NeysaBan"
category: "量化"
tags:
- pytorch
- 量化
readTime: "12分钟"
---

- ✨ **Ref**
    
    [TORCH.FX第二篇——PTQ量化实操](https://oldpan.me/archives/torch-fx-second-quantize-with-fx)
    
    - 👆讲到的内容
        - [第一篇——什么是torch.fx](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E7%AC%AC%E4%B8%80%E7%AF%87%E4%BB%80%E4%B9%88%E6%98%AFtorchfx)
        - [什么是Torch.FX](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%BB%80%E4%B9%88%E6%98%AFtorchfx)
            - [torch.fx与量化的关系](https://www.cnblogs.com/bigoldpan/p/16296035.html#torchfx%E4%B8%8E%E9%87%8F%E5%8C%96%E7%9A%84%E5%85%B3%E7%B3%BB)
            - [与TorchScript的区别](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%B8%8Etorchscript%E7%9A%84%E5%8C%BA%E5%88%AB)
                - [Python to Python?](https://www.cnblogs.com/bigoldpan/p/16296035.html#python-to-python)
                - [FX的IR和Jit的IR](https://www.cnblogs.com/bigoldpan/p/16296035.html#fx%E7%9A%84ir%E5%92%8Cjit%E7%9A%84ir)
            - [symbolic tracer](https://www.cnblogs.com/bigoldpan/p/16296035.html#symbolic-tracer)
        - [相关结构](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E7%9B%B8%E5%85%B3%E7%BB%93%E6%9E%84)
            - [修改Graph](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%BF%AE%E6%94%B9graph)
            - [优雅地修改graph网络](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%BC%98%E9%9B%85%E5%9C%B0%E4%BF%AE%E6%94%B9graph%E7%BD%91%E7%BB%9C)
            - [借助replace\_pattern来修改网络](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E5%80%9F%E5%8A%A9replace%5C_pattern%E6%9D%A5%E4%BF%AE%E6%94%B9%E7%BD%91%E7%BB%9C)
            - [Interpreter](https://www.cnblogs.com/bigoldpan/p/16296035.html#interpreter)
            - [Transformer](https://www.cnblogs.com/bigoldpan/p/16296035.html#transformer)
        - [举个FX的栗子](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%B8%BE%E4%B8%AAfx%E7%9A%84%E6%A0%97%E5%AD%90)
            - [OP融合](https://www.cnblogs.com/bigoldpan/p/16296035.html#op%E8%9E%8D%E5%90%88)
        - [如何debug](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E5%A6%82%E4%BD%95debug)
            - [直接通过pdb进行debug](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E7%9B%B4%E6%8E%A5%E9%80%9A%E8%BF%87pdb%E8%BF%9B%E8%A1%8Cdebug)
            - [打印生成的代码，并且和Module组合](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E6%89%93%E5%8D%B0%E7%94%9F%E6%88%90%E7%9A%84%E4%BB%A3%E7%A0%81%E5%B9%B6%E4%B8%94%E5%92%8Cmodule%E7%BB%84%E5%90%88)
            - [使用to\_folder函数](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%BD%BF%E7%94%A8to%5C_folder%E5%87%BD%E6%95%B0)
        - [一些限制](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E4%B8%80%E4%BA%9B%E9%99%90%E5%88%B6)
        - [撩我吧](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E6%92%A9%E6%88%91%E5%90%A7)
        - [参考链接](https://www.cnblogs.com/bigoldpan/p/16296035.html#%E5%8F%82%E8%80%83%E9%93%BE%E6%8E%A5)
    
    [用沐神的方法阅读PyTorch FX论文](https://zhuanlan.zhihu.com/p/449908382)
    
    [https://pytorch.org/docs/1.13/quantization.html#quantization-support-matrix:~:text=dynamically quantized operators.-,Quantization Support Matrix,-Quantization Mode Support](https://pytorch.org/docs/1.13/quantization.html#quantization-support-matrix:~:text=dynamically%20quantized%20operators.-,Quantization%20Support%20Matrix,-Quantization%20Mode%20Support)
    
    [PyTorch新技能解锁：torch.fx](https://zhuanlan.zhihu.com/p/428735136)
    
    [Quantization Accuracy Debugging — PyTorch 2.1 documentation](https://pytorch.org/docs/stable/quantization-accuracy-debugging.html)
    
    量化精度调试
    
    [INT8 Quantization for x86 CPU in PyTorch](https://pytorch.org/blog/int8-quantization/)
    
    [模型压缩：模型量化打怪升级之路 - 1 工具篇](https://zhuanlan.zhihu.com/p/355598250)
    
    [PyTorch Numeric Suite Tutorial — PyTorch Tutorials 2.1.1+cu121 documentation](https://pytorch.org/tutorials/prototype/numeric_suite_tutorial.html)
    
    [FX2TRT-Pytorch转TensorRT新方式-实践torch.fx第三篇](https://zhuanlan.zhihu.com/p/580962484)
    
    [Pytorch模型加速系列（一）——新的Torch-TensorRT以及TorchScript/FX/dynamo](https://ai.oldpan.me/t/topic/152)
    

## 1 Pytorch中的量化框架

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011806207.png)

![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011806208.png)

二者区别

Eager Mode Quantization 有些需要自己手动去指定，比如算子融合、Quant/DeQuant Placement等

但是FX Graph Mode Quantization就不用，然而它的作用范围是有限的，fx graph通过symbolic trace得到，有一定的trace失败几率，而且trace出的fx graph可能没有完整表达模型【NLP的都不能，第一因为语言模型中有很多控制流算子 if while等追踪不到，第二因为输入形状动态；CV基本都可以】，此时只有选择eager Mode quant

## 2 FX

个人理解：fx工具的作用是读取和转换pytorch模型(symbolic)，对IR（Intermediate Represent）进行调整（算子融合、去掉算子、替换算子、插入算子，**而量化也可以理解成这些操作的组合**），输出（Python code generation）

实际上给出的应用场景：

- [Replace one op](https://link.zhihu.com/?target=https%3A//github.com/pytorch/examples/blob/master/fx/replace_op.py)
- [Conv/Batch Norm fusion](https://link.zhihu.com/?target=https%3A//github.com/pytorch/pytorch/blob/40cbf342d3c000712da92cfafeaca651b3e0bd3e/torch/fx/experimental/optimization.py%23L50)
- [replace_pattern: Basic usage](https://link.zhihu.com/?target=https%3A//github.com/pytorch/examples/blob/master/fx/subgraph_rewriter_basic_use.py)
- [Quantization](https://link.zhihu.com/?target=https%3A//pytorch.org/docs/master/quantization.html%23prototype-fx-graph-mode-quantization)
- [Invert Transformation](https://link.zhihu.com/?target=https%3A//github.com/pytorch/examples/blob/master/fx/invert.py)
- [feature_extraction](https://link.zhihu.com/?target=https%3A//pytorch.org/vision/stable/feature_extraction.html)

修改Node的工具：

- replace_pattern：修改完之后需要recompile重新生成forward代码

### 2.1 重要组成部分 Graph & Graph Module

- torch.fx.Graph
    - torch.fx.Node组合起来（下面指一个Node包含哪些IR）
        - input：placeholder
        - weight：get_attr
        - op：
            - call_function
            - call_module
        - output：output
- GraphModule：继承自`torch.nn.Module`，包含了前向forward函数和网络中模块需要的**参数**，这些参数会被graph中的node调用

### 2.2 量化流程(PTQ

- 从代码来讲
    
    [(prototype) FX Graph Mode Post Training Static Quantization — PyTorch Tutorials 2.1.1+cu121 documentation](https://pytorch.org/tutorials/prototype/fx_graph_mode_ptq_static.html?highlight=quantization)
    
    - prepare 准备：插入 Observer/FakeQuantize 基于用户指定的 qconfig 模块
    - calibrate/train：取决于训练后量化或量化感知训练
        - 允许 Observers 收集统计数据或 FakeQuantize 模块来学习量化参数
    - convert：将校准/训练的模型转换为量化模型
- 从原理来讲
    - fuse 算子
        - conv+bn+relu
        - conv_transpose+bn
        - bn+relu
    - 插入observer：`insert_observers_for_model()`
        - 在该函数中检查qconfig是否合法
            - 如果有想要量化且pytorch事实上可以实现，但是在pytorch给出的support列表中没有，可以尝试在这里注释掉相应的检查语句
        - 插入量化观察节点
            - weight：由于不需要使用数据来观察，因此不需要observers
            - activation：需要observers(HistogramObserver)
    - calibration：收集activation的scale & zero_point
    - 转换成量化后的算子
        - activation(input, output)： `replace_observer_with_quantize_dequantize()`
        - weight(get_attr)： `convert_weighted_module()` 此时才收集scale & zero_point，对应的observers(PerChannelMinMaxObserver)

### 2.3 debug精度

- 官方文档
    
    [Quantization Accuracy Debugging — PyTorch 2.1 documentation](https://pytorch.org/docs/stable/quantization-accuracy-debugging.html)
    
    - 灵敏度分析：Numeric Suite [🪐](https://www.zhihu.com/question/489354492/answer/3234519045)
        
        [PyTorch Numeric Suite Tutorial — PyTorch Tutorials 2.1.1+cu121 documentation](https://pytorch.org/tutorials/prototype/numeric_suite_tutorial.html)
        
        1. **比较权重的量化损失**：它可以帮助你找到哪些权重受到量化影响最大，也就是哪些权重在量化后具有较大的误差。
        2. **比较激活的累积量化损失**：它可以评估整个模型的激活在量化后的总体误差。
        3. **比较每个操作符的激活量化损失**：它允许你查看每个操作符（例如卷积层、[池化层](https://www.zhihu.com/search?q=%E6%B1%A0%E5%8C%96%E5%B1%82&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A3234519045%7D)等）在量化后的误差情况，帮助你找到对量化最敏感的操作符。
- 一个参数：在量化时指定 `is_reference` 参数，也就是模拟量化
    - 如果此时精度都不符合要求：那么硬件上精度一定不符合要求
    - 但如果此时精度符合要求，但真正部署到硬件上出现问题：说明是int8算子的实现问题
- ShapeProp：from [🧀](https://oldpan.me/archives/torch-fx-second-quantize-with-fx#:~:text=%E7%94%A8%E4%BA%8E%E4%BD%9C%E5%AF%B9%E6%AF%94%E3%80%82-,DEBUG%20%E7%B2%BE%E5%BA%A6,-%E5%88%A9%E7%94%A8reference%E6%A8%A1%E5%9E%8B)  对比以下几个方面的余弦相似度
    
    ```python
    import torch
    import torch.fx
    from torch.fx.node import Node
    
    from typing import Dict
    
    class ShapeProp:
        """
        Shape propagation. This class takes a `GraphModule`.
        Then, its `propagate` method executes the `GraphModule`
        node-by-node with the given arguments. As each operation
        executes, the ShapeProp class stores away the shape and
        element type for the output values of each operation on
        the `shape` and `dtype` attributes of the operation's
        `Node`.
        """
        def __init__(self, mod):
            self.mod = mod
            self.graph = mod.graph
            self.modules = dict(self.mod.named_modules())
    
        def propagate(self, *args):
            args_iter = iter(args)
            env : Dict[str, Node] = {}
    
            def load_arg(a):
                return torch.fx.graph.map_arg(a, lambda n: env[n.name])
    
            def fetch_attr(target : str):
                target_atoms = target.split('.')
                attr_itr = self.mod
                for i, atom in enumerate(target_atoms):
                    if not hasattr(attr_itr, atom):
                        raise RuntimeError(f"Node referenced nonexistant target {'.'.join(target_atoms[:i])}")
                    attr_itr = getattr(attr_itr, atom)
                return attr_itr
    
    		        # 主要修改以下部分
    		        for node in self.graph.nodes:
    		            # op_sim即当前的node-op
    								result_fp32_layer = op_sim.forward_fp32(*load_arg(node.args), **load_arg(node.kwargs))
    								result_int8_layer = op_sim(*load_arg(node.args), **load_arg(node.kwargs))
    								result_fp32_model = op_sim.forward_fp32(*load_arg_fp32(node.args), **load_arg_fp32(node.kwargs))
    								activation_dif_accmulated = torch_cosine_similarity(result_int8_layer, result_fp32_model)
    								activation_dif_layer = torch_cosine_similarity(result_int8_layer, result_fp32_layer)
    								weight_dif = torch_cosine_similarity(op_sim.weight, op_sim.get_weight())
    
                # This is the only code specific to shape propagation.
                # you can delete this `if` branch and this becomes
                # a generic GraphModule interpreter.
                if isinstance(result, torch.Tensor):
                    node.shape = result.shape
                    node.dtype = result.dtype
    
                env[node.name] = result
    
            return load_arg(self.graph.result)
    ```
    
    - 当前激活层FP32-INT8误差
    - 当前激活层FP32-INT8累计误差
    - 当前层权重误差