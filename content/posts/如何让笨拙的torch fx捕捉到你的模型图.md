---
title: "如何让笨拙的torch fx捕捉到你的模型图"
date: "2024-01-19"
author: "NeysaBan"
category: "量化"
tags:
 - pytorch
 - 量化
readTime: "12分钟"
---

- ✨**Ref**
    
    [](https://pytorch.org/docs/1.10/torch.quantization.html)
    
    [深入理解 TORCH.FX 模块](https://zhuanlan.zhihu.com/p/625690498)
    
    [pytorch2.0目前值得更新吗? - 知乎](https://www.zhihu.com/question/596483796/answer/3125767007)
    

<aside>
📌 motivation：在实习的时候，针对模型量化任务，部署平台是orin，对应使用的量化工具是trt；然而后面要换地平线征程，只能用torch.fx，因此调研了torch.fx如何应用到现有模型上。

</aside>

## 1. torch.fx与trt的量化对比

| 对比项 | torch.fx (PyTorch 1.10) | TensorRT | PyTorch 2.x |
| --- | --- | --- | --- |
| 支持的后端 | both CPU & CUDA | CUDA | /(代表和1.10相同) |
| 量化模式 | 静态量化、动态量化（但qat仅支持静态量化） | 静态、动态 | / |
| 对称/非对称量化 | `torch.qscheme` — 支持类型：`per_tensor_affine`(非对称)、`per_channel_affine`(非对称)、`per_tensor_symmetric`(对称)、`per_channel_symmetric`(对称) | 只有对称量化 | / |
| per-channel/per-tensor量化 | activation：per-channel、per-tensor的非对称量化；weight：只有conv和linear算子支持per-channel，其他per-tensor | activation：per-tensor；weight：conv、deconv、fc、matmul(需要矩阵2D，且第二个input恒定）支持per-channel | / |
| 选择scale和zero point的方式 | HistogramObserver、MinMaxObserver、MovingAverageMinMaxObserver、MovingAveragePerChannelMinMaxObserver、NoopObserver、ObserverBase、PerChannelMinMaxObserver、RecordingObserver | pytorch_quantization/calib下：Max、Histogram | / |
| 支持的数据类型 | INT8, UINT8, INT32 | FP32, FP16, INT8, INT32, UINT8, BOOL | INT8, UINT8, INT32, FP16 |
| qat流程 | PyTorch1.10模型没跑通(onnx导出报错)。PyTorch1.12流程：1.prepare_qat_fx(qconfig/prepare_custom_config_dict/backend_config_dict) 2.train 3.convert_fx | (yolov5) 1.qdq算子插入 2.calibrate 3.finetune | / |
| 算子支持情况 | [PyTorch 1.10文档](https://pytorch.org/docs/1.10/quantization-support.html)，ConvTranspose可通过修改底层代码强制支持 | Conv, ConvTranspose, Linear, LSTM, LSTMCell, AvgPool, AdaptiveAvgPool | [PyTorch 2.1文档](https://pytorch.org/docs/2.1/quantization.html) |

**结论：**
- 手动实现的代码量：torch.fx相对较少
- torch.fx的符号追踪仅追踪torch.nn中的函数
  - 不支持的函数要用 `@torch.fx.wrap` 包起来
  - 仅仅使用torch.fx，是不支持动态数据流(if-else)的【不过这里yolov5的trt qat量化是否也是因为动态控制流的原因不能确定add算子的scale？
- 版本问题：目前ai平台上使用的是pytorch1.10，该版本的torch.fx尚不成熟，符号追踪图的方式也有很多问题；pytorch2.0推出dynamo，允许动态追踪图，要好很多
- 支持的数据类型：torch.fx不支持fp16
- scale的确定方式：看起来是torch.fx支持的范围广一些。存疑，这个不涉及到硬件的话，那难道不是自己想per-channel就per-channel吗？为什么还要专门说明哪些算子支持不支持？而且pytorch中也有说法是支持什么看observer里是per-channel还是per-tensor

## 2. 为什么torch.fx捕捉模型图总是出错

推荐阅读：[**pytorch2.0目前值得更新吗?**](https://www.zhihu.com/question/596483796/answer/3125767007)

想要使用torch.fx量化，就必须经过torch.nn的动态图转换成fx静态图的过程，然而，在转换这个过程中，总是出错。事实上，主要是因为torch.fx底层是笨拙的符号追踪。

在追踪图的问题上，根据推荐阅读的内容，主要有以下三种难题：

1. 使用了条件判断
2. 计算与变量形状相关
3. 调用了其它包（比如[numpy](https://www.zhihu.com/search?q=numpy&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A3125767007%7D)、scipy）、调用了其它语言的扩展（比如Rust、C++）

而追踪的方法及分析如下：

| 对比项 | 符号追踪 | 即时追踪 | 动态优化 |
| --- | --- | --- | --- |
| 工具 | torch.fx（得到的是fx图） | torch.jit（得到的是f_traced.graph） | torch.dynamo（得到的也是fx图） |
| 原理 | 假定函数的参数都是torch.Tensor类型（只是将它作为一个抽象的整体，而不确定它的shape、dtype、device、requires_grad），使用Proxy的变量作为输入（假设为 `x` )，记录在输入参数上执行的各种操作 | 在代码跑起来的时候，根据第一个真实的输入数据进行追踪，并且会追踪预定义算子的调用。 | 在代码跑起来的时候，根据第一个真实的输入数据进行追踪。而且会使用python解释器提供的api，劫持全部的函数调用，分析字节码并从中获取计算图及设置守卫条件。 |
| 计算图难题上的表现 | 1.error 2.error 3.silent failure | 1.error 2.error 3.silent failure | 1.pass 2.pass 3.pass🌟 |

## 3. torch.fx图捕获可行方法

1. 模型修改
    - demo
        
        ```python
        import torch  
        import torch.nn as nn  
        import torch.optim as optim

        from torch.quantization import quantize_fx
          

        input_size = 784  
        hidden_size = 500  
        output_size = 10  
        num_epochs = 5  
        batch_size = 100  
        learning_rate = 0.001  
          
          
        x = torch.randn(batch_size, input_size)  
        y = torch.randint(0, output_size, (batch_size,))  

        @torch.fx.wrap
        def wrap_kwargs(kwargs_dict):
            if 'iter' in kwargs_dict:
                pass

        def wrap_x(x):
            for tensor in x.shape[1]:
                print(tensor)
                break
         
        class Net(nn.Module):  
            def __init__(self, input_size, hidden_size, output_size):  
                super(Net, self).__init__()  
                self.fc1 = nn.Linear(input_size, hidden_size)  
                self.relu = nn.ReLU()  
                self.fc2 = nn.Linear(hidden_size, output_size)
            
            def train(self):
                pass
            def test(self):
                pass
            
            ## general forward
            def forward(self, x, **kwargs):
        
                t = kwargs['iter']
                
                ## --------------------- 1. -----------------
                ## Error: Proxy object cannot be iterated. This can be attempted when the Proxy is used in a loop or as a *args or **kwargs function argument. See the torch.fx docs on pytorch.org for a more detailed explanation of what types of control flow can be traced, and check out the Proxy docstring for help troubleshooting Proxy iteration errors
                if 'iter' in kwargs:
                    pass
        
                ## --------------------- 2. -----------------
                ## TypeError: 'Proxy' object cannot be interpreted as an integer
                for tensor in x.shape[1]:
                    print(tensor)
                    break
                
        
                ## --------------------- 3. -----------------
                ## torch.fx.proxy.TraceError: symbolically traced variables cannot be used as inputs to control flow
                if x:
                    self.train()
                else:
                    self.test()
                
        
                out = self.fc1(x)  
                out = self.relu(out)
                out = self.fc2(out)
                return out
            
            # ## using fx
            # def forward(self, x, kwargs_dict):
        
            #     ## --------------------- 1. -----------------
            #     # if 'iter' in kwargs:
            #     #     pass
                
            #     ## 1.1 factor out the untraceable logic into a top-level function and use fx.wrap on it
            #     wrap_kwargs(kwargs_dict)
        
            #     ## 1.2 read the dict statically
            #     print(kwargs_dict['iter'])
                
            #     ## 1.3 However, if you want to use the contents of the dictionary iteration in the next code, you must explicitly show these in the function parameters.
            #     ## example: kwargs_dict = {'iter': 
            #                                       {'a': xxx, 
            #                                        'b': xxx}
            #                                }
            #    ##           forward(self, x, kwargs_dict)   -> forward(self, x, a, b) 
        
            #     ## --------------------- 2. -----------------
            #     ## factor out the untraceable logic into a top-level function and use fx.wrap on it
            #     wrap_x(x)
                
        
            #     ## --------------------- 3. -----------------
            #     ## retain a fixed logic of the control flow.
            #     self.train()
                
        
            #     out = self.fc1(x)
            #     out = self.relu(out)
            #     out = self.fc2(out)
            #     return out
          
        model = Net(input_size, hidden_size, output_size)

        #------------ new load model param -----------
        # net = torch.load(cfg.model_path, map_location=torch.device('cuda'))
        # model.load_state_dict(net['state_dict'])
        #--------------------- end -------------------

        #------------------ fx qconfig & prepare------------------
        qconfig_dict={"":torch.quantization.get_default_qat_qconfig('qnnpack')} 
        model = quantize_fx.prepare_qat_fx(model, qconfig_dict)
        #-------------------------- end --------------------------

        criterion = nn.CrossEntropyLoss()  
        optimizer = optim.SGD(model.parameters(), lr=learning_rate)  
          

        for epoch in range(num_epochs):  
              
            outputs = model(x)  
            loss = criterion(outputs, y)  
              
              
            optimizer.zero_grad()  
            loss.backward()  
            optimizer.step()  
              
            if (epoch+1) % 1 == 0:  
                print ('Epoch [{}/{}], Loss: {:.4f}'.format(epoch+1, num_epochs, loss.item()))

        #------------------ fx convert & export ------------------
        model_quantized=quantize_fx.convert_fx(model)
        torch.save(model_quantized.state_dict(), 'fx_model.pth')
        #-------------------------- end --------------------------
        ```
        
    - 前后模型结构对比
        
        ```python
        ## before
        Net(
          (fc1): Linear(in_features=784, out_features=500, bias=True)
          (relu): ReLU()
          (fc2): Linear(in_features=500, out_features=10, bias=True)
        )

        ## after
        print(model)
        GraphModule(
          (x_activation_post_process_0): FusedMovingAvgObsFakeQuantize(
            fake_quant_enabled=tensor([1]), observer_enabled=tensor([1]), scale=tensor([1.]), zero_point=tensor([0], dtype=torch.int32), dtype=torch.quint8, quant_min=0, quant_max=255, qscheme=torch.per_tensor_affine, reduce_range=False
            (activation_post_process): MovingAverageMinMaxObserver(min_val=inf, max_val=-inf)
          )
          (fc1): LinearReLU(
            in_features=784, out_features=500, bias=True
            (weight_fake_quant): FusedMovingAvgObsFakeQuantize(
              fake_quant_enabled=tensor([1]), observer_enabled=tensor([1]), scale=tensor([1.]), zero_point=tensor([0], dtype=torch.int32), dtype=torch.qint8, quant_min=-128, quant_max=127, qscheme=torch.per_tensor_symmetric, reduce_range=False
              (activation_post_process): MovingAverageMinMaxObserver(min_val=inf, max_val=-inf)
            )
          )
          (fc1_activation_post_process_0): FusedMovingAvgObsFakeQuantize(
            fake_quant_enabled=tensor([1]), observer_enabled=tensor([1]), scale=tensor([1.]), zero_point=tensor([0], dtype=torch.int32), dtype=torch.quint8, quant_min=0, quant_max=255, qscheme=torch.per_tensor_affine, reduce_range=False
            (activation_post_process): MovingAverageMinMaxObserver(min_val=inf, max_val=-inf)
          )
          (fc2): Linear(
            in_features=500, out_features=10, bias=True
            (weight_fake_quant): FusedMovingAvgObsFakeQuantize(
              fake_quant_enabled=tensor([1]), observer_enabled=tensor([1]), scale=tensor([1.]), zero_point=tensor([0], dtype=torch.int32), dtype=torch.qint8, quant_min=-128, quant_max=127, qscheme=torch.per_tensor_symmetric, reduce_range=False
              (activation_post_process): MovingAverageMinMaxObserver(min_val=inf, max_val=-inf)
            )
          )
          (fc2_activation_post_process_0): FusedMovingAvgObsFakeQuantize(
            fake_quant_enabled=tensor([1]), observer_enabled=tensor([1]), scale=tensor([1.]), zero_point=tensor([0], dtype=torch.int32), dtype=torch.quint8, quant_min=0, quant_max=255, qscheme=torch.per_tensor_affine, reduce_range=False
            (activation_post_process): MovingAverageMinMaxObserver(min_val=inf, max_val=-inf)
          )
        )

        torch.fx._symbolic_trace.wrap("__main___wrap_kwargs")
        torch.fx._symbolic_trace.wrap("__main___wrap_x")

        def forward(self, x, kwargs_dict):
            x_activation_post_process_0 = self.x_activation_post_process_0(x)
            wrap_kwargs = __main___wrap_kwargs(kwargs_dict)
            getitem = kwargs_dict['iter'];  kwargs_dict = None
            wrap_x = __main___wrap_x(x);  x = None
            fc1 = self.fc1(x_activation_post_process_0);  x_activation_post_process_0 = None
            fc1_activation_post_process_0 = self.fc1_activation_post_process_0(fc1);  fc1 = None
            fc2 = self.fc2(fc1_activation_post_process_0);  fc1_activation_post_process_0 = None
            fc2_activation_post_process_0 = self.fc2_activation_post_process_0(fc2);  fc2 = None
            return fc2_activation_post_process_0
        ```
        
2. mmrazor：不可行，这个应该只能自动包装不可追踪的函数，而且还需要自己把可追踪和不可追踪的逻辑分开
3. 地平线docker：也是把torch.fx的方法包起来了，但是应该也不能对**kwargs这种做出自动处理（没有进一步调研）
4. torch.dynamo：torch.dynamo转换成fx图，再接torch.fx进行量化。但是需要pytorch版本升级到2.0
