---
title: "GRec模型性能分析 && 优化"
date: "2023-09-16"
author: "NeysaBan"
category: "gpu"
tags:
- pytorch
- gpu
readTime: "12分钟"
---

最近在搞GRec，因此分析了一下性能瓶颈和优化方法

- ⭐ **Ref**
    
    1、torch 设置
    
    [https://github.com/espnet/espnet/issues/3041](https://github.com/espnet/espnet/issues/3041)
    
    设置`torch.backends.cudnn.deterministic = True`会导致训练很慢，用一张A100，设置为True能训一天半，设置为Fasle变成一个半小时，似乎是torch的原因
    
    2、cProfile使用
    
    [python 程序如何使用 cProfile 工具](https://zhuanlan.zhihu.com/p/611594977?utm_id=0)
    
    3、nsys 使用
    
    [Kernel Profiling Guide](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html)
    
    [nsight system 使用](https://zhuanlan.zhihu.com/p/433500747)
    
    [Nvidia Nsight](http://home.ustc.edu.cn/~shaojiemike/posts/nvidiansight/)
    
    [手把手教你训练千亿级LLM模型（四）：训练性能优化](https://zhuanlan.zhihu.com/p/646304614)
    
    4、python 性能
    
    [Python 使用和高性能技巧总结](https://zhuanlan.zhihu.com/p/567073236?utm_id=0)
    
    [TimeComplexity - Python Wiki](https://wiki.python.org/moin/TimeComplexity)
    
    [Python 各种集合内置方法的时间复杂度_python中对集合的操作的时间复杂度_MaoningGuan的博客-CSDN博客](https://blog.csdn.net/guanmaoning/article/details/108214896)
    

## CProfile 粗略估计

```python
## run.py | example
import pstats
import cProfile

def test():
	## test code

if __name__ == '__main__':
	cProfile.run('test()', filename=log_path)
	p = pstats.Stats(log_path) 
	p.sort_stats('cumulative').print_stats()
```

### 热点排查

// 这里只采样了前两个period的数据

- Raw Total Res
    
    ```cpp
    Sat Sep 16 16:11:13 2023    res_raw.txt
    
             138417964 function calls (138110679 primitive calls) in 434.016 seconds
    
       Ordered by: cumulative time
    
       ncalls  tottime  percall  cumtime  percall filename:lineno(function)
            1    0.000    0.000  434.587  434.587 {built-in method builtins.exec}
            1    0.000    0.000  434.587  434.587 <string>:1(<module>)
            1    0.016    0.016  434.587  434.587 run_profile.py:23(cpro)
            2    1.418    0.709  434.569  217.284 /data/RS/Never-Forgotten/train_eval_profile.py:150(train_CFeD_c)
          752    6.107    0.008  312.750    0.416 /data/RS/Never-Forgotten/utils.py:104(create_masked_lm_predictions_frombatch)
       375382   17.532    0.000  302.859    0.001 /data/RS/Never-Forgotten/utils.py:22(create_masked_lm_predictions)
      6789648   22.435    0.000  256.781    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:21(wrapped)
      6788887  211.012    0.000  211.012    0.000 {method 'eq' of 'torch._C._TensorBase' objects}
         2942   46.707    0.016   46.707    0.016 {built-in method as_tensor}
          732    0.011    0.000   29.206    0.040 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:181(backward)
          732    0.006    0.000   29.195    0.040 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:68(backward)
          732   29.161    0.040   29.161    0.040 {method 'run_backward' of 'torch._C._EngineBase' objects}
      7294168    4.759    0.000   17.524    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/overrides.py:1070(has_torch_function)
          752    0.017    0.000   16.761    0.022 /data/RS/Never-Forgotten/utils.py:17(iter_merge)
       750798    1.977    0.000   15.755    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:576(__iter__)
       750798   12.765    0.000   12.765    0.000 {method 'unbind' of 'torch._C._TensorBase' objects}
           47    0.001    0.000   12.607    0.268 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:339(__iter__)
           47    0.001    0.000   12.606    0.268 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:290(_get_iterator)
           47    0.028    0.001   12.605    0.268 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:762(__init__)
          188    0.010    0.000   11.906    0.063 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:110(start)
          188    0.003    0.000   11.847    0.063 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:222(_Popen)
          188    0.003    0.000   11.844    0.063 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:274(_Popen)
          188    0.004    0.000   11.840    0.063 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:15(__init__)
          188    0.017    0.000   11.833    0.063 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:66(_launch)
          188   11.673    0.062   11.766    0.063 {built-in method posix.fork}
      7296142    4.347    0.000   11.515    0.000 {built-in method builtins.any}
          732    0.018    0.000   11.012    0.015 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:23(decorate_context)
          732    0.398    0.001   10.972    0.015 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/adam.py:55(step)
          732    2.011    0.003    8.629    0.012 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/functional.py:53(adam)
    57358/1518    0.377    0.000    7.438    0.005 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:715(_call_impl)
          786    0.024    0.000    7.312    0.009 /data/RS/Never-Forgotten/GRec.py:26(forward)
          833    0.004    0.000    7.278    0.009 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:432(__next__)
          833    0.009    0.000    7.273    0.009 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1038(_next_data)
     21345960    6.112    0.000    7.167    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/overrides.py:1083(<genexpr>)
         1572    0.004    0.000    6.047    0.004 /data/RS/Never-Forgotten/GRec.py:147(forward)
         1572    0.020    0.000    6.029    0.004 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/container.py:115(forward)
         6288    0.192    0.000    5.955    0.001 /data/RS/Never-Forgotten/GRec.py:124(forward)
      6789648    2.674    0.000    5.818    0.000 {built-in method builtins.all}
           94    0.004    0.000    5.617    0.060 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1140(_shutdown_workers)
          188    0.001    0.000    5.558    0.030 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:142(join)
          188    0.003    0.000    5.556    0.030 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:40(wait)
          188    0.003    0.000    5.545    0.029 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:917(wait)
          188    0.002    0.000    5.535    0.029 /opt/anaconda3/lib/python3.8/selectors.py:402(select)
          188    5.530    0.029    5.532    0.029 {method 'poll' of 'select.poll' objects}
            6    0.008    0.001    5.173    0.862 /data/RS/Never-Forgotten/train_eval.py:751(eval)
       375382    1.857    0.000    4.631    0.000 /opt/anaconda3/lib/python3.8/random.py:293(shuffle)
     20368944    4.301    0.000    4.301    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:24(<genexpr>)
      1501562    3.135    0.000    3.577    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:567(__len__)
        14934    0.086    0.000    3.430    0.000 /data/RS/Never-Forgotten/GRec.py:97(forward)
      3010892    1.914    0.000    2.716    0.000 /opt/anaconda3/lib/python3.8/random.py:250(_randbelow_with_getrandbits)
       374832    1.480    0.000    2.487    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:933(grad)
        12576    1.475    0.000    2.464    0.000 /data/RS/Never-Forgotten/GRec.py:194(forward)
    4354182/4354170    0.837    0.000    2.402    0.000 {built-in method builtins.len}
          752    0.168    0.000    2.386    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1316(zero_grad)
      1502921    2.363    0.000    2.363    0.000 {built-in method __new__ of type object at 0x560198ce8ac0}
           34    0.192    0.006    1.953    0.057 /data/RS/Never-Forgotten/metrics.py:5(getMetrics)
       105408    1.952    0.000    1.952    0.000 {method 'mul_' of 'torch._C._TensorBase' objects}
       379176    1.897    0.000    1.897    0.000 {method 'to' of 'torch._C._TensorBase' objects}
       105408    1.760    0.000    1.760    0.000 {method 'add_' of 'torch._C._TensorBase' objects}
        30864    0.177    0.000    1.685    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:646(__contains__)
        14934    0.028    0.000    1.608    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/conv.py:422(forward)
        14934    0.040    0.000    1.568    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/conv.py:414(_conv_forward)
         5156    1.528    0.000    1.528    0.000 {method 'acquire' of '_thread.lock' objects}
        14934    1.521    0.000    1.521    0.000 {built-in method conv2d}
          374    0.003    0.000    1.516    0.004 /opt/anaconda3/lib/python3.8/threading.py:270(wait)
          786    0.004    0.000    1.391    0.002 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1005(_get_data)
          786    0.003    0.000    1.381    0.002 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:859(_try_get_data)
          786    0.007    0.000    1.378    0.002 /opt/anaconda3/lib/python3.8/queue.py:153(get)
        14934    0.078    0.000    1.370    0.000 /data/RS/Never-Forgotten/GRec.py:102(conv_pad)
     10040182    1.296    0.000    1.296    0.000 {method 'append' of 'list' objects}
      7294168    1.254    0.000    1.254    0.000 {built-in method torch._C._is_torch_function_enabled}
      7313746    1.066    0.000    1.071    0.000 {built-in method builtins.getattr}
        52704    1.069    0.000    1.069    0.000 {method 'sqrt' of 'torch._C._TensorBase' objects}
       375382    0.790    0.000    1.032    0.000 {built-in method builtins.sorted}
        52704    0.997    0.000    0.997    0.000 {method 'addcdiv_' of 'torch._C._TensorBase' objects}
         2249    0.013    0.000    0.878    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1424(info)
         2249    0.015    0.000    0.861    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1553(_log)
        52704    0.813    0.000    0.813    0.000 {method 'addcmul_' of 'torch._C._TensorBase' objects}
        55042    0.023    0.000    0.812    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1068(parameters)
        55042    0.021    0.000    0.788    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1092(named_parameters)
        55042    0.120    0.000    0.768    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1055(_named_members)
       161712    0.340    0.000    0.767    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:596(__hash__)
         2249    0.006    0.000    0.694    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1579(handle)
        32849    0.687    0.000    0.687    0.000 {method 'item' of 'torch._C._TensorBase' objects}
         2249    0.013    0.000    0.685    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1633(callHandlers)
        14934    0.102    0.000    0.674    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:3486(_pad)
         4498    0.016    0.000    0.672    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:937(handle)
      2267922    0.649    0.000    0.649    0.000 {method 'dim' of 'torch._C._TensorBase' objects}
         4498    0.018    0.000    0.637    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1069(emit)
          786    0.024    0.000    0.628    0.001 /data/RS/Never-Forgotten/GRec.py:160(forward)
       808156    0.588    0.000    0.588    0.000 {built-in method torch._C._get_tracing_state}
         1162    0.009    0.000    0.569    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1087(_try_put_index)
        14934    0.539    0.000    0.539    0.000 {built-in method constant_pad_nd}
      4964776    0.490    0.000    0.490    0.000 {method 'getrandbits' of '_random.Random' objects}
         4909    0.007    0.000    0.485    0.000 {built-in method builtins.next}
         8646    0.045    0.000    0.482    0.000 /data/RS/Never-Forgotten/GRec.py:212(forward)
       751476    0.298    0.000    0.452    0.000 {built-in method builtins.min}
          786    0.013    0.000    0.438    0.001 /data/RS/Never-Forgotten/GRec.py:37(masked_logits)
         1162    0.001    0.000    0.434    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:426(_next_index)
          880    0.219    0.000    0.431    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:225(__iter__)
      1612131    0.252    0.000    0.431    0.000 {method 'add' of 'set' objects}
       751497    0.394    0.000    0.394    0.000 {built-in method builtins.round}
        54144    0.383    0.000    0.383    0.000 {method 'zero_' of 'torch._C._TensorBase' objects}
        30864    0.380    0.000    0.380    0.000 {method 'any' of 'torch._C._TensorBase' objects}
       750764    0.361    0.000    0.361    0.000 {built-in method builtins.max}
         8646    0.026    0.000    0.332    0.000 /data/RS/Never-Forgotten/GRec.py:207(__init__)
          738    0.006    0.000    0.322    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:228(wrapper)
           47    0.001    0.000    0.319    0.007 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:829(_reset)
          738    0.002    0.000    0.314    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:197(wrapper)
          738    0.003    0.000    0.312    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1361(log)
      3010892    0.312    0.000    0.312    0.000 {method 'bit_length' of 'int' objects}
          738    0.009    0.000    0.309    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1327(_log)
        12576    0.304    0.000    0.304    0.000 {method 'mean' of 'torch._C._TensorBase' objects}
         2249    0.004    0.000    0.294    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1174(emit)
        13362    0.032    0.000    0.288    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1124(relu)
          738    0.015    0.000    0.286    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1212(_partial_history_callback)
        12576    0.279    0.000    0.279    0.000 {method 'var' of 'torch._C._TensorBase' objects}
         4498    0.015    0.000    0.279    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1058(flush)
       752464    0.277    0.000    0.277    0.000 {built-in method builtins.iter}
         8684    0.060    0.000    0.273    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:223(__init__)
          786    0.002    0.000    0.256    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1107(_process_data)
         4874    0.254    0.000    0.254    0.000 {method 'flush' of '_io.TextIOWrapper' objects}
        13362    0.253    0.000    0.253    0.000 {built-in method relu}
          738    0.029    0.000    0.250    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface.py:530(publish_partial_history)
      1501528    0.243    0.000    0.243    0.000 /data/RS/Never-Forgotten/utils.py:86(<lambda>)
       106036    0.178    0.000    0.242    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:781(__setattr__)
        12576    0.227    0.000    0.227    0.000 {built-in method sqrt}
        29868    0.206    0.000    0.206    0.000 {method 'permute' of 'torch._C._TensorBase' objects}
      1501528    0.202    0.000    0.202    0.000 {method 'random' of '_random.Random' objects}
    303108/55042    0.172    0.000    0.191    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1222(named_modules)
         4498    0.008    0.000    0.184    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:914(format)
          786    0.128    0.000    0.183    0.000 /data/RS/Never-Forgotten/GRec.py:166(gelu)
          235    0.013    0.000    0.182    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:100(Queue)
         4498    0.019    0.000    0.176    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:651(format)
          282    0.002    0.000    0.170    0.001 /opt/anaconda3/lib/python3.8/threading.py:834(start)
         1759    0.016    0.000    0.169    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:80(put)
          235    0.012    0.000    0.166    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:36(__init__)
          752    0.038    0.000    0.166    0.000 /data/RS/Never-Forgotten/GRec.py:53(gather_ids)
        28778    0.162    0.000    0.162    0.000 {method 'view' of 'torch._C._TensorBase' objects}
          282    0.002    0.000    0.156    0.001 /opt/anaconda3/lib/python3.8/threading.py:540(wait)
         4498    0.156    0.000    0.156    0.000 {method 'write' of '_io.TextIOWrapper' objects}
          730    0.150    0.000    0.150    0.000 {method 'lt' of 'torch._C._TensorBase' objects}
          940    0.065    0.000    0.146    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:50(__init__)
       375382    0.137    0.000    0.137    0.000 {method 'insert' of 'list' objects}
       107482    0.130    0.000    0.131    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:765(__getattr__)
         2249    0.010    0.000    0.121    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1538(makeRecord)
       390861    0.078    0.000    0.120    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:113(__iter__)
         2249    0.014    0.000    0.119    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:584(formatTime)
         1572    0.005    0.000    0.117    0.000 /data/RS/Never-Forgotten/GRec.py:82(forward)
        14934    0.114    0.000    0.114    0.000 {method 'squeeze' of 'torch._C._TensorBase' objects}
         2249    0.056    0.000    0.111    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:284(__init__)
          517    0.005    0.000    0.106    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:65(Lock)
          738    0.007    0.000    0.103    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:58(_publish_partial_history)
        14934    0.103    0.000    0.103    0.000 {method 'unsqueeze' of 'torch._C._TensorBase' objects}
          235    0.007    0.000    0.101    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:158(_start_thread)
          517    0.004    0.000    0.100    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:161(__init__)
         1572    0.009    0.000    0.096    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/sparse.py:123(forward)
         2249    0.094    0.000    0.094    0.000 {built-in method time.strftime}
          188    0.090    0.000    0.092    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:223(_releaseLock)
         1572    0.003    0.000    0.086    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1774(embedding)
         1572    0.084    0.000    0.084    0.000 {built-in method embedding}
       384662    0.083    0.000    0.083    0.000 {built-in method builtins.hasattr}
         1584    0.006    0.000    0.077    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:24(poll)
          618    0.005    0.000    0.073    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:960(forward)
         1396    0.070    0.000    0.070    0.000 {built-in method posix.waitpid}
    267927/265677    0.048    0.000    0.067    0.000 {built-in method builtins.isinstance}
          618    0.005    0.000    0.067    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2416(cross_entropy)
          738    0.009    0.000    0.062    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_queue.py:47(_publish)
          738    0.008    0.000    0.060    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/data_types/utils.py:34(history_dict_to_json)
          940    0.006    0.000    0.058    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:114(_make_name)
         2250    0.009    0.000    0.052    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:818(json_dumps_safer_history)
         2250    0.015    0.000    0.051    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/data_types/utils.py:62(val_to_json)
          188    0.003    0.000    0.049    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:61(_cleanup)
          987    0.047    0.000    0.047    0.000 {built-in method posix.close}
          940    0.009    0.000    0.047    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:144(__next__)
         2250    0.013    0.000    0.043    0.000 /opt/anaconda3/lib/python3.8/json/__init__.py:183(dumps)
          423    0.004    0.000    0.042    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:205(__call__)
           47    0.001    0.000    0.039    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:90(Event)
       324270    0.039    0.000    0.039    0.000 {method 'get' of 'dict' objects}
       162981    0.038    0.000    0.038    0.000 {built-in method builtins.id}
           47    0.000    0.000    0.038    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:323(__init__)
          786    0.036    0.000    0.036    0.000 {built-in method pow}
          752    0.002    0.000    0.035    0.000 /opt/anaconda3/lib/python3.8/random.py:94(__init__)
          738    0.014    0.000    0.034    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:92(_make_request)
          940    0.006    0.000    0.034    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:147(<listcomp>)
        54144    0.034    0.000    0.034    0.000 {method 'requires_grad_' of 'torch._C._TensorBase' objects}
          752    0.005    0.000    0.033    0.000 /opt/anaconda3/lib/python3.8/random.py:123(seed)
        34898    0.033    0.000    0.033    0.000 {method 'size' of 'torch._C._TensorBase' objects}
          732    0.002    0.000    0.033    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1581(log_softmax)
       231004    0.033    0.000    0.033    0.000 {method 'values' of 'collections.OrderedDict' objects}
          188    0.001    0.000    0.032    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:461(close_fds)
          611    0.032    0.000    0.032    0.000 {built-in method posix.pipe}
        54288    0.025    0.000    0.031    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1113(<lambda>)
          618    0.006    0.000    0.031    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2204(nll_loss)
         2249    0.020    0.000    0.031    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1502(findCaller)
          926    0.006    0.000    0.031    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:153(is_alive)
          732    0.030    0.000    0.030    0.000 {method 'log_softmax' of 'torch._C._TensorBase' objects}
          188    0.002    0.000    0.030    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:80(Semaphore)
         7520    0.012    0.000    0.028    0.000 /opt/anaconda3/lib/python3.8/random.py:285(choice)
          752    0.028    0.000    0.028    0.000 {function Random.seed at 0x7fb2131f1b80}
          188    0.000    0.000    0.028    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:125(__init__)
         2827    0.013    0.000    0.028    0.000 /opt/anaconda3/lib/python3.8/threading.py:341(notify)
         3109    0.004    0.000    0.027    0.000 /opt/anaconda3/lib/python3.8/threading.py:246(__enter__)
          114    0.015    0.000    0.027    0.000 /data/RS/Never-Forgotten/loss.py:13(forward)
          732    0.006    0.000    0.027    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:28(_make_grads)
          235    0.002    0.000    0.026    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:85(BoundedSemaphore)
         2250    0.008    0.000    0.026    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:182(encode)
           20    0.006    0.000    0.026    0.001 /data/RS/Never-Forgotten/utils.py:209(__call__)
        52704    0.025    0.000    0.025    0.000 {built-in method math.sqrt}
           47    0.000    0.000    0.025    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:75(Condition)
           47    0.000    0.000    0.024    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:212(__init__)
          235    0.000    0.000    0.024    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:144(__init__)
         3109    0.024    0.000    0.024    0.000 {method '__enter__' of '_thread.lock' objects}
          618    0.023    0.000    0.023    0.000 {built-in method torch._C._nn.nll_loss}
         1175    0.005    0.000    0.022    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:171(register_after_fork)
          752    0.022    0.000    0.022    0.000 {built-in method arange}
          417    0.021    0.000    0.021    0.000 {built-in method where}
          752    0.021    0.000    0.021    0.000 {built-in method index_select}
          732    0.020    0.000    0.020    0.000 {built-in method ones_like}
         8696    0.020    0.000    0.020    0.000 {built-in method torch._C._log_api_usage_once}
           47    0.020    0.000    0.020    0.000 {method 'tolist' of 'torch._C._TensorBase' objects}
        14934    0.012    0.000    0.019    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/_VF.py:25(__getattr__)
          786    0.019    0.000    0.019    0.000 {built-in method tanh}
         1504    0.017    0.000    0.017    0.000 {method 'contiguous' of 'torch._C._TensorBase' objects}
         4498    0.004    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:635(formatMessage)
            6    0.000    0.000    0.017    0.003 /data/RS/Never-Forgotten/metrics.py:36(recMetrics)
         1175    0.011    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/weakref.py:159(__setitem__)
         2249    0.007    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:117(splitext)
          833    0.001    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/threading.py:1017(_wait_for_tstate_lock)
      1080/15    0.004    0.000    0.016    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1260(train)
         2249    0.009    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:140(basename)
          738    0.013    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:826(_get_start_time)
         2250    0.004    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/typing.py:768(__instancecheck__)
         1476    0.016    0.000    0.016    0.000 {method 'CopyFrom' of 'google.protobuf.pyext._message.CMessage' objects}
         2250    0.016    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:204(iterencode)
         4498    0.005    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:629(usesTime)
          752    0.015    0.000    0.015    0.000 {built-in method add}
       109656    0.015    0.000    0.015    0.000 {method 'items' of 'collections.OrderedDict' objects}
           47    0.000    0.000    0.015    0.000 /opt/anaconda3/lib/python3.8/threading.py:979(join)
           13    0.000    0.000    0.015    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1280(eval)
         8996    0.009    0.000    0.015    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:894(acquire)
          235    0.005    0.000    0.014    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:516(Pipe)
           47    0.002    0.000    0.014    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:401(__init__)
           94    0.014    0.000    0.014    0.000 {built-in method empty}
          235    0.001    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:134(close)
          282    0.006    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/threading.py:761(__init__)
          658    0.012    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:186(__init__)
         4498    0.004    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:434(format)
           47    0.012    0.000    0.012    0.000 {built-in method randperm}
          786    0.012    0.000    0.012    0.000 {method 'add' of 'torch._C._TensorBase' objects}
          235    0.007    0.000    0.012    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:67(_after_fork)
          188    0.009    0.000    0.012    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:80(__init__)
         2249    0.012    0.000    0.012    0.000 {built-in method time.localtime}
         2250    0.004    0.000    0.012    0.000 /opt/anaconda3/lib/python3.8/typing.py:771(__subclasscheck__)
          733    0.009    0.000    0.011    0.000 /data/RS/Never-Forgotten/utils.py:12(get_time_dif)
          282    0.011    0.000    0.011    0.000 {built-in method _thread.start_new_thread}
          738    0.004    0.000    0.011    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:157(_make_record)
         4498    0.007    0.000    0.010    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:423(usesTime)
         2255    0.009    0.000    0.010    0.000 {method 'format' of 'str' objects}
         2123    0.010    0.000    0.010    0.000 {method 'release' of '_thread.lock' objects}
        17292    0.009    0.000    0.009    0.000 {built-in method math.floor}
         4498    0.009    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:431(_format)
          288    0.009    0.000    0.009    0.000 {built-in method zeros_like}
         6733    0.009    0.000    0.009    0.000 {built-in method posix.getpid}
          705    0.009    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/threading.py:222(__init__)
          739    0.004    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:85(__enter__)
         2249    0.006    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/genericpath.py:121(_splitext)
         2250    0.003    0.000    0.008    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:502(is_pandas_data_frame)
         8996    0.006    0.000    0.008    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:901(release)
          739    0.007    0.000    0.008    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:80(__init__)
         2250    0.002    0.000    0.008    0.000 {built-in method builtins.issubclass}
         1478    0.005    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:166(__init__)
           68    0.007    0.000    0.007    0.000 {built-in method topk}
          739    0.003    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:89(__exit__)
          329    0.002    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/threading.py:505(__init__)
          235    0.002    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:200(_finalize_close)
         4500    0.006    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:334(get_full_typename)
         2145    0.002    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1166(children)
        31151    0.006    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/_jit_internal.py:750(is_scripting)
            2    0.001    0.000    0.006    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:167(zero_grad)
         6747    0.006    0.000    0.006    0.000 {method 'rfind' of 'str' objects}
         2249    0.004    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:156(<lambda>)
          786    0.003    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/threading.py:1071(is_alive)
         9184    0.006    0.000    0.006    0.000 {method 'acquire' of '_thread.RLock' objects}
         6747    0.006    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:792(filter)
         1692    0.004    0.000    0.005    0.000 <frozen importlib._bootstrap>:389(parent)
    2270/2251    0.002    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/abc.py:100(__subclasscheck__)
         2250    0.005    0.000    0.005    0.000 {method 'add' of 'google.protobuf.pyext._message.RepeatedCompositeContainer' objects}
         4498    0.005    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:360(getMessage)
         2625    0.004    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/threading.py:1306(current_thread)
          786    0.005    0.000    0.005    0.000 {method 'reshape' of 'torch._C._TensorBase' objects}
            2    0.000    0.000    0.005    0.002 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/adam.py:34(__init__)
            2    0.000    0.000    0.005    0.002 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:33(__init__)
           94    0.005    0.000    0.005    0.000 {method 'random_' of 'torch._C._TensorBase' objects}
         3201    0.003    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/threading.py:261(_is_owned)
         3109    0.003    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/threading.py:249(__exit__)
          738    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:595(__setattr__)
          114    0.004    0.000    0.004    0.000 {built-in method sum}
          188    0.000    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1114(_mark_worker_as_unavailable)
           20    0.000    0.000    0.004    0.000 /data/RS/Never-Forgotten/utils.py:187(__call__)
          738    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1187(_visualization_hack)
         2249    0.003    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:119(getLevelName)
         2249    0.003    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:52(normcase)
           20    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:622(step)
         2135    0.004    0.000    0.004    0.000 {method 'acquire' of '_multiprocessing.SemLock' objects}
         1175    0.002    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/weakref.py:323(__new__)
         9184    0.004    0.000    0.004    0.000 {method 'release' of '_thread.RLock' objects}
          188    0.002    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:433(_flush_std_streams)
         4498    0.004    0.000    0.004    0.000 {method 'find' of 'str' objects}
         2145    0.003    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1175(named_children)
         2249    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1677(isEnabledFor)
          742    0.001    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/abc.py:96(__instancecheck__)
    2270/2251    0.003    0.000    0.004    0.000 {built-in method _abc._abc_subclasscheck}
         2249    0.002    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:41(_get_sep)
         2250    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:104(__init__)
          940    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:133(rng)
          148    0.000    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1479(softmax)
         2250    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:482(is_pandas_data_frame_typename)
          470    0.003    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:117(__init__)
          235    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:173(close)
          188    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/selectors.py:351(register)
      153/149    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/_utils/signal_handling.py:63(handler)
         1572    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/container.py:107(__iter__)
          738    0.003    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/google/protobuf/internal/well_known_types.py:211(ToSeconds)
          148    0.003    0.000    0.003    0.000 {method 'softmax' of 'torch._C._TensorBase' objects}
         2249    0.003    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/threading.py:1031(name)
         3378    0.002    0.000    0.003    0.000 {method 'join' of 'str' objects}
            2    0.003    0.001    0.003    0.001 {built-in method numpy.array}
          235    0.000    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:360(_close)
          153    0.003    0.000    0.003    0.000 {built-in method torch._C._error_if_any_worker_fails}
           47    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/queue.py:33(__init__)
           47    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:364(current_device)
          742    0.002    0.000    0.002    0.000 {built-in method _abc._abc_instancecheck}
         6750    0.002    0.000    0.002    0.000 {method 'startswith' of 'str' objects}
         4479    0.002    0.000    0.002    0.000 {built-in method time.time}
           47    0.000    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:334(set)
          470    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/_weakrefset.py:81(add)
          188    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/selectors.py:234(register)
          807    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/weakref.py:103(remove)
          940    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:90(_make_methods)
          235    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:150(cancel_join_thread)
         2217    0.002    0.000    0.002    0.000 {built-in method torch._C.is_grad_enabled}
         6747    0.002    0.000    0.002    0.000 {built-in method posix.fspath}
         1175    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/weakref.py:328(__init__)
         2250    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:486(is_matplotlib_typename)
          114    0.002    0.000    0.002    0.000 {method 'mul' of 'torch._C._TensorBase' objects}
         2250    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:490(is_plotly_typename)
           47    0.002    0.000    0.002    0.000 {built-in method torch._C._set_worker_pids}
         4874    0.002    0.000    0.002    0.000 {built-in method _thread.get_ident}
           18    0.002    0.000    0.002    0.000 {method 'gt' of 'torch._C._TensorBase' objects}
         3109    0.002    0.000    0.002    0.000 {method '__exit__' of '_thread.lock' objects}
          188    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/selectors.py:347(__init__)
         3189    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:37(current_process)
          985    0.002    0.000    0.002    0.000 {built-in method _thread.allocate_lock}
         2368    0.002    0.000    0.002    0.000 {method 'append' of 'collections.deque' objects}
         2249    0.002    0.000    0.002    0.000 {built-in method sys._getframe}
         1512    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1336(<genexpr>)
           47    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:421(_reset)
            2    0.000    0.000    0.001    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:207(add_param_group)
         2437    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:189(name)
           34    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/activation.py:1188(__init__)
            2    0.000    0.000    0.001    0.001 /opt/anaconda3/lib/python3.8/random.py:315(sample)
         1692    0.001    0.000    0.001    0.000 {method 'rpartition' of 'str' objects}
          188    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:202(__exit__)
           36    0.001    0.000    0.001    0.000 {built-in method builtins.sum}
           10    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:154(__init__)
           47    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:140(_lazy_init)
           34    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/activation.py:1197(forward)
           13    0.001    0.000    0.001    0.000 {method 'ge' of 'torch._C._TensorBase' objects}
          786    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/queue.py:216(_get)
          235    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:824(<genexpr>)
         1478    0.001    0.000    0.001    0.000 {built-in method torch._C._set_grad_enabled}
          282    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:1177(_make_invoke_excepthook)
          188    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:327(is_set)
         2350    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:48(debug)
           47    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:296(notify_all)
          235    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:229(cancel)
          878    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/queue.py:208(_qsize)
         1490    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:99(_check_closed)
          618    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2461(<listcomp>)
          286    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/_weakrefset.py:38(_remove)
          732    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:60(_tensor_or_tensors_to_tuple)
          470    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:233(get_context)
           47    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:519(set)
          235    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:229(__enter__)
          188    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:268(close)
          188    0.001    0.000    0.001    0.000 {method 'copy' of 'dict' objects}
          188    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:234(ident)
          188    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:209(__init__)
           47    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:270(notify)
          807    0.001    0.000    0.001    0.000 {built-in method _weakref._remove_dead_weakref}
           47    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:107(is_initialized)
          188    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:215(_fileobj_lookup)
          374    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:258(_acquire_restore)
           47    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:46(is_available)
          282    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:1110(daemon)
            4    0.001    0.000    0.001    0.000 {method 'extend' of 'list' objects}
          188    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:214(_acquireLock)
         1066    0.001    0.000    0.001    0.000 {built-in method time.monotonic}
         1702    0.001    0.000    0.001    0.000 {method 'remove' of 'collections.deque' objects}
          419    0.001    0.000    0.001    0.000 {built-in method math.log}
          235    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:94(__enter__)
         1397    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:513(is_set)
          376    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:94(<genexpr>)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:734(_newname)
          618    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2250(<listcomp>)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:528(__format__)
          188    0.000    0.000    0.000    0.000 <string>:1(__new__)
          329    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:1095(daemon)
          235    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:232(__exit__)
          940    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:197(get_start_method)
          664    0.000    0.000    0.000    0.000 {method 'discard' of 'set' objects}
          618    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/_reduction.py:7(get_enum)
          976    0.000    0.000    0.000    0.000 {method 'pop' of 'dict' objects}
          987    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:187(get_context)
      190/180    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:329(__setattr__)
          738    0.000    0.000    0.000    0.000 {method 'keys' of 'dict' objects}
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:21(_fileobj_to_fd)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/_utils/signal_handling.py:47(_set_SIGCHLD_handler)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:364(notify_all)
          732    0.000    0.000    0.000    0.000 {method 'numel' of 'torch._C._TensorBase' objects}
           47    0.000    0.000    0.000    0.000 {built-in method torch._C._cuda_getDevice}
           47    0.000    0.000    0.000    0.000 {built-in method torch._C._cuda_isInBadFork}
          190    0.000    0.000    0.000    0.000 {built-in method math.ceil}
          738    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/lib/tracelog.py:193(log_message_queue)
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:933(<listcomp>)
          235    0.000    0.000    0.000    0.000 {method '__enter__' of '_multiprocessing.SemLock' objects}
          786    0.000    0.000    0.000    0.000 {method 'popleft' of 'collections.deque' objects}
           47    0.000    0.000    0.000    0.000 {built-in method torch._C._cuda_getDeviceCount}
          374    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:255(_release_save)
          740    0.000    0.000    0.000    0.000 {method 'items' of 'dict' objects}
           47    0.000    0.000    0.000    0.000 {built-in method torch._C._remove_worker_pids}
          423    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:44(sub_debug)
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:275(_key_from_fd)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:944(_stop)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1202(__del__)
          235    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:97(__exit__)
           30    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/typing.py:868(__new__)
          286    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:130(__del__)
           47    0.000    0.000    0.000    0.000 {method 'manual_seed' of 'torch._C.Generator' objects}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:955(__init__)
          188    0.000    0.000    0.000    0.000 {method 'register' of 'select.poll' objects}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:24(__init__)
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:205(daemon)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:87(__init__)
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:63(__init__)
           20    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:662(is_better)
          188    0.000    0.000    0.000    0.000 {built-in method posix.WIFSIGNALED}
          188    0.000    0.000    0.000    0.000 {method 'clear' of 'dict' objects}
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/queue.py:205(_init)
          188    0.000    0.000    0.000    0.000 {built-in method select.poll}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:15(__init__)
           51    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:358(_index_sampler)
          188    0.000    0.000    0.000    0.000 {built-in method posix.WIFEXITED}
          188    0.000    0.000    0.000    0.000 {built-in method posix.WEXITSTATUS}
          108    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:354(_auto_collation)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:235(_make_methods)
          235    0.000    0.000    0.000    0.000 {method 'release' of '_multiprocessing.SemLock' objects}
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/utils.py:165(__init__)
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/loss.py:10(__init__)
          188    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:199(__enter__)
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:845(<listcomp>)
          235    0.000    0.000    0.000    0.000 {method 'clear' of 'collections.deque' objects}
           47    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:296(multiprocessing_context)
           10    0.000    0.000    0.000    0.000 {method '__format__' of 'float' objects}
            1    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:51(getsignal)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:210(__init__)
           24    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:106(num_samples)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:578(__init__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:25(_int_to_enum)
          235    0.000    0.000    0.000    0.000 {method '__exit__' of '_multiprocessing.SemLock' objects}
           20    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:646(<listcomp>)
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:370(__len__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:242(register_buffer)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:300(multiprocessing_context)
            1    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:45(signal)
           20    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:658(in_cooldown)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/enum.py:283(__call__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:35(_enum_to_int)
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:235(__len__)
           30    0.000    0.000    0.000    0.000 {method 'setdefault' of 'dict' objects}
           47    0.000    0.000    0.000    0.000 {method '_is_mine' of '_multiprocessing.SemLock' objects}
           47    0.000    0.000    0.000    0.000 {method 'locked' of '_thread.lock' objects}
            9    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/_collections_abc.py:392(__subclasshook__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/enum.py:562(__new__)
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:127(__len__)
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/utils.py:195(__init__)
            9    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/_collections_abc.py:302(__subclasshook__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:677(_init_is_better)
            1    0.000    0.000    0.000    0.000 {built-in method _signal.signal}
            1    0.000    0.000    0.000    0.000 {built-in method _signal.getsignal}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:616(_reset)
            1    0.000    0.000    0.000    0.000 {method 'disable' of '_lsprof.Profiler' objects}
            2    0.000    0.000    0.000    0.000 {method 'isdisjoint' of 'set' objects}
            1    0.000    0.000    0.000    0.000 {built-in method builtins.callable}
    ```
    

分析：本以为卷积会花时间最久，没想到`create_masked_lm_predictions` 这个函数占比居然比forward和backward都要多，大概占到69%左右。当然想想也是符合逻辑，因为这个函数是用于为每个batch中的序列生成mask的，每次都调用，且未经过优化，因此如果函数内部有写得不小心的地方，就很容易造成性能瓶颈。

进入函数内部确定是哪里耗时多

```python
def create_masked_lm_predictions(tokens, masked_lm_prob,
                                    max_predictions_per_seq, vocab_words, rng, skip_tokens):

    candidate_indexes = []

    ## HACK 1
    start_time = time.perf_counter()
    for (i, token) in enumerate(tokens):
        if token == "[CLS]" or token == "[SEP]":  # 这种的不记
            continue
        candidate_indexes.append(i)  # 记录位置信息
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK1 time: {}".format(interval))
    
    ## HACK 2
    start_time = time.perf_counter()
    rng.shuffle(candidate_indexes)  # 这里shuffle的是位置
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK2 time: {}".format(interval))

    ## HACK 3
    start_time = time.perf_counter()
    output_tokens = list(tokens)

    predict_num = min(max_predictions_per_seq,
                      max(1, int(round(len(tokens) * masked_lm_prob))))
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK3 time: {}".format(interval))

    ## HACK 4
    start_time = time.perf_counter()
    masked_lms = []
    have_covered_indexes = set()
    for index in candidate_indexes:
        if len(masked_lms) >= predict_num:
            break
        if index in have_covered_indexes:
            continue
        have_covered_indexes.add(index)

        masked_token = None
        if rng.random() < 1.0:  # 被mask成0的token
            masked_token = 0
        else:
            if rng.random() < 0.5:  # 不被mask的token
                masked_token = tokens[index]
            else:  # 被随机mask的token
                masked_token = vocab_words[rng.randint(
                    0, len(vocab_words) - 1
                )]
        output_tokens[index] = masked_token  # 这里是index位置对应mask的token

        # 这里是index位置对应原始label（item
        masked_lms.append(MaskedLmInstance(index=index, label=tokens[index]))
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK4 time: {}".format(interval))

    ## HACK 5
    start_time = time.perf_counter()
    masked_lms = sorted(masked_lms, key=lambda x: x.index)  # 这里会按顺序排好
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK5 time: {}".format(interval))

    # HACK 6
    start_time = time.perf_counter()
    masked_lm_positions = []
    masked_lm_labels = []
    for p in masked_lms:
        masked_lm_positions.append(p.index)
        masked_lm_labels.append(p.label)
    end_time = time.perf_counter()
    interval = (end_time - start_time) * 1e6
    print("HACK6 time: {}".format(interval))

    return (output_tokens, masked_lm_positions, masked_lm_labels)
```

- Raw Func Res
    
    ```python
    HACK 1 : 4200 us
    ```
    

定位得知 HACK 1占`create_masked_lm_predictions` 高达 79%，因此针对HACK 1展开优化

### 优化

<aside>
👩‍🚀 tokens的shape是 (9,)，实际上很小，那为什么呢？

</aside>

可以做一个[小实验](https://stackoverflow.com/questions/55330338/time-complexity-of-string-comparison) ，根据结果可以得知，python 和 开启O2优化的C++ 进行字符串比较的速度差不读，且耗时与字符串的长度成正比，因此python的实现方法应该是优化后的逐位比较 N位 * 比较的字符串个数 M个，所以这里的时间复杂度是 O(M*N)

可以想到把需要比较的存入数据结构，这样应该可以降低查找的难度（即比较的字符串的个数这里的时间复杂度 M）。经过查询后选择set，因为它的底部使用哈希表实现，所以检查一个字符串是否存在于set中时，只要计算这个字符串的散列值，然后找对应的存储桶，而无需逐个比较字符串的所有字符。

```python
## HACK 1 | Before
for (i, token) in enumerate(tokens):
    if token == "[CLS]" or token == "[SEP]":  # 这种的不记
        continue
    candidate_indexes.append(i)  # 记录位置信息

## HACK 1 | After
candidate_indexes = [i for i, token in enumerate(tokens) if token not in skip_tokens]
```

- After Total Res
    
    ```python
    Sat Sep 16 08:00:26 2023    res1.txt
    
             68824482 function calls (68435649 primitive calls) in 230.456 seconds
    
       Ordered by: cumulative time
    
       ncalls  tottime  percall  cumtime  percall filename:lineno(function)
            1    0.000    0.000  231.243  231.243 {built-in method builtins.exec}
            1    0.000    0.000  231.243  231.243 <string>:1(<module>)
            1    0.018    0.018  231.243  231.243 run_profile.py:23(cpro)
            2    1.760    0.880  231.224  115.612 /data/RS/Never-Forgotten/train_eval_profile.py:150(train_CFeD_c)
          954    7.847    0.008   69.168    0.073 /data/RS/Never-Forgotten/utils.py:104(create_masked_lm_predictions_frombatch)
         3678   61.049    0.017   61.049    0.017 {built-in method as_tensor}
       476008   13.952    0.000   57.041    0.000 /data/RS/Never-Forgotten/utils.py:22(create_masked_lm_predictions)
          934    0.016    0.000   37.515    0.040 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:181(backward)
          934    0.008    0.000   37.499    0.040 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:68(backward)
          934   37.454    0.040   37.454    0.040 {method 'run_backward' of 'torch._C._EngineBase' objects}
          960    0.023    0.000   23.519    0.024 /data/RS/Never-Forgotten/utils.py:17(iter_merge)
       952052    2.451    0.000   19.472    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:576(__iter__)
           59    0.001    0.000   18.152    0.308 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:339(__iter__)
           59    0.001    0.000   18.151    0.308 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:290(_get_iterator)
           59    0.035    0.001   18.150    0.308 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:762(__init__)
          934    0.027    0.000   17.550    0.019 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:23(decorate_context)
          934    0.631    0.001   17.492    0.019 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/adam.py:55(step)
          236    0.012    0.000   17.186    0.073 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:110(start)
          236    0.003    0.000   17.115    0.073 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:222(_Popen)
          236    0.004    0.000   17.112    0.073 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:274(_Popen)
          236    0.005    0.000   17.108    0.072 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:15(__init__)
          236    0.025    0.000   17.098    0.072 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:66(_launch)
          236   16.809    0.071   16.997    0.072 {built-in method posix.fork}
       952052   13.878    0.000   13.878    0.000 {method 'unbind' of 'torch._C._TensorBase' objects}
          934    3.217    0.003   13.786    0.015 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/functional.py:53(adam)
    72250/1924    0.452    0.000    9.500    0.005 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:715(_call_impl)
          990    0.032    0.000    9.328    0.009 /data/RS/Never-Forgotten/GRec.py:26(forward)
         1049    0.005    0.000    8.542    0.008 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:432(__next__)
         1049    0.014    0.000    8.537    0.008 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1038(_next_data)
         1980    0.005    0.000    7.747    0.004 /data/RS/Never-Forgotten/GRec.py:147(forward)
       476008    2.483    0.000    7.728    0.000 /data/RS/Never-Forgotten/utils.py:33(<listcomp>)
         1980    0.025    0.000    7.725    0.004 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/container.py:115(forward)
         7920    0.255    0.000    7.631    0.001 /data/RS/Never-Forgotten/GRec.py:124(forward)
          118    0.005    0.000    6.681    0.057 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1140(_shutdown_workers)
          236    0.002    0.000    6.600    0.028 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:142(join)
          236    0.003    0.000    6.598    0.028 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:40(wait)
          236    0.004    0.000    6.573    0.028 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:917(wait)
          236    0.003    0.000    6.560    0.028 /opt/anaconda3/lib/python3.8/selectors.py:402(select)
          236    6.553    0.028    6.556    0.028 {method 'poll' of 'select.poll' objects}
      4489416    5.222    0.000    6.331    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:596(__hash__)
       476008    2.054    0.000    5.489    0.000 /opt/anaconda3/lib/python3.8/random.py:293(shuffle)
            6    0.008    0.001    5.480    0.913 /data/RS/Never-Forgotten/train_eval.py:751(eval)
        18810    0.104    0.000    4.322    0.000 /data/RS/Never-Forgotten/GRec.py:97(forward)
      1904068    3.681    0.000    4.202    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:567(__len__)
       476640    2.139    0.000    3.614    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:933(grad)
      1905773    3.451    0.000    3.451    0.000 {built-in method __new__ of type object at 0x559afae1fac0}
      3817833    2.384    0.000    3.396    0.000 /opt/anaconda3/lib/python3.8/random.py:250(_randbelow_with_getrandbits)
        15840    1.897    0.000    3.212    0.000 /data/RS/Never-Forgotten/GRec.py:194(forward)
       134496    3.094    0.000    3.094    0.000 {method 'mul_' of 'torch._C._TensorBase' objects}
          954    0.213    0.000    3.076    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1316(zero_grad)
    5517322/5517310    1.025    0.000    3.070    0.000 {built-in method builtins.len}
       134496    2.827    0.000    2.827    0.000 {method 'add_' of 'torch._C._TensorBase' objects}
       954150    2.321    0.000    2.321    0.000 {built-in method builtins.iter}
           36    0.228    0.006    2.253    0.063 /data/RS/Never-Forgotten/metrics.py:5(getMetrics)
        18810    0.035    0.000    2.030    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/conv.py:422(forward)
        18810    0.051    0.000    1.981    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/conv.py:414(_conv_forward)
        32952    0.202    0.000    1.936    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:646(__contains__)
       682940    0.634    0.000    1.925    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/overrides.py:1070(has_torch_function)
        18810    1.922    0.000    1.922    0.000 {built-in method conv2d}
       480814    1.903    0.000    1.903    0.000 {method 'to' of 'torch._C._TensorBase' objects}
        18810    0.098    0.000    1.732    0.000 /data/RS/Never-Forgotten/GRec.py:102(conv_pad)
        67248    1.727    0.000    1.727    0.000 {method 'sqrt' of 'torch._C._TensorBase' objects}
         6402    1.691    0.000    1.691    0.000 {method 'acquire' of '_thread.lock' objects}
          446    0.004    0.000    1.674    0.004 /opt/anaconda3/lib/python3.8/threading.py:270(wait)
        67248    1.577    0.000    1.577    0.000 {method 'addcdiv_' of 'torch._C._TensorBase' objects}
          990    0.005    0.000    1.483    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1005(_get_data)
          990    0.004    0.000    1.470    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:859(_try_get_data)
          990    0.011    0.000    1.467    0.001 /opt/anaconda3/lib/python3.8/queue.py:153(get)
         2867    0.018    0.000    1.364    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1424(info)
         2867    0.018    0.000    1.341    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1553(_log)
        67248    1.307    0.000    1.307    0.000 {method 'addcmul_' of 'torch._C._TensorBase' objects}
       685368    0.459    0.000    1.169    0.000 {built-in method builtins.any}
       476008    0.820    0.000    1.128    0.000 {built-in method builtins.sorted}
         2867    0.008    0.000    1.125    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1579(handle)
         2867    0.019    0.000    1.113    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1633(callHandlers)
         5734    0.021    0.000    1.095    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:937(handle)
         5734    0.025    0.000    1.048    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1069(emit)
        69788    0.029    0.000    1.032    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1068(parameters)
        69788    0.026    0.000    1.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1092(named_parameters)
        35322    0.086    0.000    0.980    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:21(wrapped)
        69788    0.150    0.000    0.977    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1055(_named_members)
      8446496    0.949    0.000    0.949    0.000 {method 'append' of 'list' objects}
        18810    0.123    0.000    0.857    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:3486(_pad)
         1462    0.012    0.000    0.816    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1087(_try_put_index)
        35420    0.813    0.000    0.813    0.000 {method 'item' of 'torch._C._TensorBase' objects}
      2875690    0.787    0.000    0.787    0.000 {method 'dim' of 'torch._C._TensorBase' objects}
          990    0.030    0.000    0.778    0.001 /data/RS/Never-Forgotten/GRec.py:160(forward)
      1366836    0.583    0.000    0.707    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/overrides.py:1083(<genexpr>)
         6169    0.008    0.000    0.694    0.000 {built-in method builtins.next}
        18810    0.692    0.000    0.692    0.000 {built-in method constant_pad_nd}
      6295793    0.632    0.000    0.632    0.000 {method 'getrandbits' of '_random.Random' objects}
      1024302    0.632    0.000    0.632    0.000 {built-in method torch._C._get_tracing_state}
         1462    0.002    0.000    0.626    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:426(_next_index)
         1108    0.308    0.000    0.623    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:225(__iter__)
        34350    0.608    0.000    0.608    0.000 {method 'eq' of 'torch._C._TensorBase' objects}
        10890    0.053    0.000    0.608    0.000 /data/RS/Never-Forgotten/GRec.py:212(forward)
       952924    0.360    0.000    0.587    0.000 {built-in method builtins.min}
          990    0.016    0.000    0.566    0.001 /data/RS/Never-Forgotten/GRec.py:37(masked_logits)
      4491009    0.555    0.000    0.555    0.000 {built-in method builtins.id}
      2043891    0.315    0.000    0.541    0.000 {method 'add' of 'set' objects}
        68688    0.539    0.000    0.539    0.000 {method 'zero_' of 'torch._C._TensorBase' objects}
         2867    0.006    0.000    0.532    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1174(emit)
         5734    0.020    0.000    0.510    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1058(flush)
         6206    0.473    0.000    0.473    0.000 {method 'flush' of '_io.TextIOWrapper' objects}
           59    0.002    0.000    0.465    0.008 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:829(_reset)
        32952    0.453    0.000    0.453    0.000 {method 'any' of 'torch._C._TensorBase' objects}
          940    0.008    0.000    0.441    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:228(wrapper)
          940    0.003    0.000    0.430    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:197(wrapper)
          940    0.003    0.000    0.426    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1361(log)
          940    0.012    0.000    0.423    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1327(_log)
        10890    0.034    0.000    0.415    0.000 /data/RS/Never-Forgotten/GRec.py:207(__init__)
        15840    0.401    0.000    0.401    0.000 {method 'mean' of 'torch._C._TensorBase' objects}
       952951    0.393    0.000    0.393    0.000 {built-in method builtins.round}
          940    0.021    0.000    0.390    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1212(_partial_history_callback)
       952016    0.384    0.000    0.384    0.000 {built-in method builtins.max}
      3817833    0.381    0.000    0.381    0.000 {method 'bit_length' of 'int' objects}
        15840    0.369    0.000    0.369    0.000 {method 'var' of 'torch._C._TensorBase' objects}
        16830    0.040    0.000    0.368    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1124(relu)
          990    0.003    0.000    0.358    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1107(_process_data)
        10930    0.073    0.000    0.341    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:223(__init__)
          940    0.042    0.000    0.341    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface.py:530(publish_partial_history)
        16830    0.325    0.000    0.325    0.000 {built-in method relu}
      1904032    0.308    0.000    0.308    0.000 /data/RS/Never-Forgotten/utils.py:86(<lambda>)
        15840    0.305    0.000    0.305    0.000 {built-in method sqrt}
       133190    0.223    0.000    0.303    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:781(__setattr__)
         5734    0.011    0.000    0.295    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:914(format)
         5734    0.024    0.000    0.284    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:651(format)
        37620    0.267    0.000    0.267    0.000 {method 'permute' of 'torch._C._TensorBase' objects}
      1904032    0.256    0.000    0.256    0.000 {method 'random' of '_random.Random' objects}
          354    0.003    0.000    0.252    0.001 /opt/anaconda3/lib/python3.8/threading.py:834(start)
    384312/69788    0.222    0.000    0.247    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1222(named_modules)
         2225    0.022    0.000    0.237    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:80(put)
          354    0.003    0.000    0.233    0.001 /opt/anaconda3/lib/python3.8/threading.py:540(wait)
          990    0.152    0.000    0.222    0.000 /data/RS/Never-Forgotten/GRec.py:166(gelu)
          932    0.222    0.000    0.222    0.000 {method 'lt' of 'torch._C._TensorBase' objects}
        36240    0.220    0.000    0.220    0.000 {method 'view' of 'torch._C._TensorBase' objects}
          954    0.051    0.000    0.219    0.000 /data/RS/Never-Forgotten/GRec.py:53(gather_ids)
          295    0.016    0.000    0.218    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:100(Queue)
         5734    0.218    0.000    0.218    0.000 {method 'write' of '_io.TextIOWrapper' objects}
         2867    0.021    0.000    0.206    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:584(formatTime)
          295    0.015    0.000    0.198    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:36(__init__)
          236    0.185    0.001    0.188    0.001 /opt/anaconda3/lib/python3.8/logging/__init__.py:223(_releaseLock)
         1180    0.077    0.000    0.182    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:50(__init__)
       492543    0.121    0.000    0.179    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:113(__iter__)
         2867    0.168    0.000    0.168    0.000 {built-in method time.strftime}
         2867    0.011    0.000    0.159    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1538(makeRecord)
       476008    0.158    0.000    0.158    0.000 {method 'insert' of 'list' objects}
       135350    0.154    0.000    0.155    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:765(__getattr__)
         2867    0.071    0.000    0.148    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:284(__init__)
        18810    0.146    0.000    0.146    0.000 {method 'squeeze' of 'torch._C._TensorBase' objects}
       707644    0.139    0.000    0.145    0.000 {built-in method builtins.getattr}
          295    0.009    0.000    0.140    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:158(_start_thread)
         1980    0.006    0.000    0.137    0.000 /data/RS/Never-Forgotten/GRec.py:82(forward)
          940    0.010    0.000    0.137    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:58(_publish_partial_history)
        18810    0.134    0.000    0.134    0.000 {method 'unsqueeze' of 'torch._C._TensorBase' objects}
          649    0.006    0.000    0.130    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:65(Lock)
       682940    0.127    0.000    0.127    0.000 {built-in method torch._C._is_torch_function_enabled}
          649    0.004    0.000    0.122    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:161(__init__)
       489168    0.119    0.000    0.119    0.000 {built-in method builtins.hasattr}
         1980    0.009    0.000    0.114    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/sparse.py:123(forward)
         1980    0.004    0.000    0.103    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1774(embedding)
         2002    0.008    0.000    0.100    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/popen_fork.py:24(poll)
         1980    0.100    0.000    0.100    0.000 {built-in method embedding}
    330993/328137    0.064    0.000    0.091    0.000 {built-in method builtins.isinstance}
         1766    0.091    0.000    0.091    0.000 {built-in method posix.waitpid}
          744    0.006    0.000    0.088    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:960(forward)
          940    0.011    0.000    0.083    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/data_types/utils.py:34(history_dict_to_json)
         1239    0.081    0.000    0.081    0.000 {built-in method posix.close}
          744    0.006    0.000    0.080    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2416(cross_entropy)
          940    0.011    0.000    0.078    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_queue.py:47(_publish)
         1180    0.006    0.000    0.075    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:114(_make_name)
         2856    0.012    0.000    0.071    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:818(json_dumps_safer_history)
         2856    0.019    0.000    0.071    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/data_types/utils.py:62(val_to_json)
         1180    0.012    0.000    0.063    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:144(__next__)
         2856    0.018    0.000    0.059    0.000 /opt/anaconda3/lib/python3.8/json/__init__.py:183(dumps)
          236    0.003    0.000    0.058    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:61(_cleanup)
          190    0.032    0.000    0.053    0.000 /data/RS/Never-Forgotten/loss.py:13(forward)
          531    0.005    0.000    0.051    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:205(__call__)
           59    0.001    0.000    0.051    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:90(Event)
        35322    0.026    0.000    0.050    0.000 {built-in method builtins.all}
           59    0.000    0.000    0.050    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:323(__init__)
          954    0.003    0.000    0.049    0.000 /opt/anaconda3/lib/python3.8/random.py:94(__init__)
          940    0.018    0.000    0.049    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:92(_make_request)
       407420    0.046    0.000    0.046    0.000 {method 'get' of 'dict' objects}
          954    0.006    0.000    0.046    0.000 /opt/anaconda3/lib/python3.8/random.py:123(seed)
         1180    0.008    0.000    0.045    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:147(<listcomp>)
          990    0.044    0.000    0.044    0.000 {built-in method pow}
        68688    0.043    0.000    0.043    0.000 {method 'requires_grad_' of 'torch._C._TensorBase' objects}
       290980    0.042    0.000    0.042    0.000 {method 'values' of 'collections.OrderedDict' objects}
        43914    0.042    0.000    0.042    0.000 {method 'size' of 'torch._C._TensorBase' objects}
          934    0.003    0.000    0.040    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1581(log_softmax)
          236    0.002    0.000    0.040    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:80(Semaphore)
         3923    0.005    0.000    0.040    0.000 /opt/anaconda3/lib/python3.8/threading.py:246(__enter__)
          954    0.040    0.000    0.040    0.000 {function Random.seed at 0x7f5713c5eb80}
         2867    0.025    0.000    0.039    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1502(findCaller)
           26    0.010    0.000    0.039    0.002 /data/RS/Never-Forgotten/utils.py:209(__call__)
        68832    0.031    0.000    0.039    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1113(<lambda>)
          744    0.007    0.000    0.038    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2204(nll_loss)
         3569    0.019    0.000    0.038    0.000 /opt/anaconda3/lib/python3.8/threading.py:341(notify)
         9440    0.015    0.000    0.038    0.000 /opt/anaconda3/lib/python3.8/random.py:285(choice)
        67248    0.037    0.000    0.037    0.000 {built-in method math.sqrt}
          236    0.001    0.000    0.037    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:461(close_fds)
          934    0.037    0.000    0.037    0.000 {method 'log_softmax' of 'torch._C._TensorBase' objects}
          236    0.000    0.000    0.037    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:125(__init__)
         2856    0.012    0.000    0.036    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:182(encode)
         1176    0.008    0.000    0.035    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:153(is_alive)
          934    0.008    0.000    0.035    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:28(_make_grads)
         3923    0.034    0.000    0.034    0.000 {method '__enter__' of '_thread.lock' objects}
           59    0.001    0.000    0.033    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:75(Condition)
           59    0.001    0.000    0.032    0.001 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:212(__init__)
          295    0.003    0.000    0.031    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:85(BoundedSemaphore)
         1475    0.006    0.000    0.030    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:171(register_after_fork)
          954    0.029    0.000    0.029    0.000 {built-in method arange}
          744    0.028    0.000    0.028    0.000 {built-in method torch._C._nn.nll_loss}
           59    0.028    0.000    0.028    0.000 {method 'tolist' of 'torch._C._TensorBase' objects}
          295    0.001    0.000    0.027    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:144(__init__)
          954    0.026    0.000    0.026    0.000 {built-in method index_select}
         5734    0.006    0.000    0.026    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:635(formatMessage)
          990    0.026    0.000    0.026    0.000 {built-in method tanh}
          466    0.026    0.000    0.026    0.000 {built-in method where}
          934    0.026    0.000    0.026    0.000 {built-in method ones_like}
       105966    0.025    0.000    0.025    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:24(<genexpr>)
         2867    0.010    0.000    0.024    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:117(splitext)
        10942    0.024    0.000    0.024    0.000 {built-in method torch._C._log_api_usage_once}
         1880    0.024    0.000    0.024    0.000 {method 'CopyFrom' of 'google.protobuf.pyext._message.CMessage' objects}
        18810    0.016    0.000    0.024    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/_VF.py:25(__getattr__)
         1049    0.002    0.000    0.023    0.000 /opt/anaconda3/lib/python3.8/threading.py:1017(_wait_for_tstate_lock)
          767    0.023    0.000    0.023    0.000 {built-in method posix.pipe}
         1475    0.015    0.000    0.023    0.000 /opt/anaconda3/lib/python3.8/weakref.py:159(__setitem__)
         2856    0.005    0.000    0.023    0.000 /opt/anaconda3/lib/python3.8/typing.py:768(__instancecheck__)
         2856    0.022    0.000    0.022    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:204(iterencode)
         2867    0.011    0.000    0.022    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:140(basename)
         1908    0.022    0.000    0.022    0.000 {method 'contiguous' of 'torch._C._TensorBase' objects}
         5734    0.007    0.000    0.021    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:629(usesTime)
           59    0.000    0.000    0.021    0.000 /opt/anaconda3/lib/python3.8/threading.py:979(join)
          940    0.017    0.000    0.021    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:826(_get_start_time)
         5734    0.006    0.000    0.020    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:434(format)
          954    0.020    0.000    0.020    0.000 {built-in method add}
        11468    0.012    0.000    0.019    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:894(acquire)
       138744    0.019    0.000    0.019    0.000 {method 'items' of 'collections.OrderedDict' objects}
      1080/15    0.007    0.000    0.019    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1260(train)
           59    0.019    0.000    0.019    0.000 {built-in method randperm}
          826    0.017    0.000    0.019    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:186(__init__)
          354    0.008    0.000    0.018    0.000 /opt/anaconda3/lib/python3.8/threading.py:761(__init__)
            6    0.000    0.000    0.018    0.003 /data/RS/Never-Forgotten/metrics.py:36(recMetrics)
         2856    0.005    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/typing.py:771(__subclasscheck__)
           59    0.003    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:401(__init__)
         2867    0.017    0.000    0.017    0.000 {built-in method time.localtime}
          295    0.002    0.000    0.017    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:134(close)
           13    0.000    0.000    0.017    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1280(eval)
          354    0.016    0.000    0.016    0.000 {built-in method _thread.start_new_thread}
          940    0.007    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/interface/interface_shared.py:157(_make_record)
          990    0.016    0.000    0.016    0.000 {method 'add' of 'torch._C._TensorBase' objects}
          236    0.011    0.000    0.016    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:80(__init__)
          935    0.012    0.000    0.015    0.000 /data/RS/Never-Forgotten/utils.py:12(get_time_dif)
          295    0.009    0.000    0.014    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:67(_after_fork)
          990    0.014    0.000    0.014    0.000 {method 'reshape' of 'torch._C._TensorBase' objects}
         5734    0.009    0.000    0.014    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:423(usesTime)
          288    0.014    0.000    0.014    0.000 {built-in method zeros_like}
         2870    0.013    0.000    0.014    0.000 {method 'format' of 'str' objects}
         5734    0.014    0.000    0.014    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:431(_format)
        11468    0.010    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:901(release)
          295    0.006    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:516(Pipe)
         2867    0.010    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/genericpath.py:121(_splitext)
          941    0.006    0.000    0.013    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:85(__enter__)
         2656    0.013    0.000    0.013    0.000 {method 'release' of '_thread.lock' objects}
          118    0.012    0.000    0.012    0.000 {built-in method empty}
          885    0.012    0.000    0.012    0.000 /opt/anaconda3/lib/python3.8/threading.py:222(__init__)
         2856    0.004    0.000    0.012    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:502(is_pandas_data_frame)
         8523    0.012    0.000    0.012    0.000 {built-in method posix.getpid}
        21780    0.011    0.000    0.011    0.000 {built-in method math.floor}
         2856    0.003    0.000    0.011    0.000 {built-in method builtins.issubclass}
          941    0.009    0.000    0.010    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:80(__init__)
         1882    0.007    0.000    0.010    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:166(__init__)
          941    0.005    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/grad_mode.py:89(__exit__)
         5712    0.009    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:334(get_full_typename)
          413    0.002    0.000    0.009    0.000 /opt/anaconda3/lib/python3.8/threading.py:505(__init__)
         8601    0.008    0.000    0.008    0.000 {method 'rfind' of 'str' objects}
           72    0.008    0.000    0.008    0.000 {built-in method topk}
    2876/2857    0.002    0.000    0.008    0.000 /opt/anaconda3/lib/python3.8/abc.py:100(__subclasscheck__)
          295    0.002    0.000    0.008    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:200(_finalize_close)
        11704    0.008    0.000    0.008    0.000 {method 'acquire' of '_thread.RLock' objects}
         2856    0.008    0.000    0.008    0.000 {method 'add' of 'google.protobuf.pyext._message.RepeatedCompositeContainer' objects}
          990    0.004    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/threading.py:1071(is_alive)
         8601    0.007    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:792(filter)
        39229    0.007    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/_jit_internal.py:750(is_scripting)
         5734    0.007    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:360(getMessage)
         2867    0.005    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:156(<lambda>)
          190    0.007    0.000    0.007    0.000 {built-in method sum}
         2124    0.005    0.000    0.007    0.000 <frozen importlib._bootstrap>:389(parent)
         3339    0.006    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/threading.py:1306(current_thread)
         4015    0.004    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/threading.py:261(_is_owned)
          236    0.001    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1114(_mark_worker_as_unavailable)
         3923    0.004    0.000    0.007    0.000 /opt/anaconda3/lib/python3.8/threading.py:249(__exit__)
          940    0.006    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:595(__setattr__)
          118    0.006    0.000    0.006    0.000 {method 'random_' of 'torch._C._TensorBase' objects}
          944    0.002    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/abc.py:96(__instancecheck__)
         2145    0.002    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1166(children)
            2    0.001    0.000    0.006    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:167(zero_grad)
         2867    0.004    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:119(getLevelName)
           26    0.000    0.000    0.006    0.000 /data/RS/Never-Forgotten/utils.py:187(__call__)
    2876/2857    0.006    0.000    0.006    0.000 {built-in method _abc._abc_subclasscheck}
          940    0.005    0.000    0.006    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1187(_visualization_hack)
           26    0.005    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:622(step)
         5734    0.005    0.000    0.005    0.000 {method 'find' of 'str' objects}
        11704    0.005    0.000    0.005    0.000 {method 'release' of '_thread.RLock' objects}
            2    0.000    0.000    0.005    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/adam.py:34(__init__)
            2    0.000    0.000    0.005    0.003 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:33(__init__)
         2697    0.005    0.000    0.005    0.000 {method 'acquire' of '_multiprocessing.SemLock' objects}
          226    0.001    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:1479(softmax)
         2867    0.004    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:52(normcase)
         2856    0.003    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:482(is_pandas_data_frame_typename)
         2867    0.003    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/posixpath.py:41(_get_sep)
         1475    0.003    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/weakref.py:323(__new__)
         2867    0.005    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:1677(isEnabledFor)
         1180    0.002    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/tempfile.py:133(rng)
          236    0.002    0.000    0.005    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:433(_flush_std_streams)
          944    0.004    0.000    0.004    0.000 {built-in method _abc._abc_instancecheck}
          236    0.001    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/selectors.py:351(register)
          226    0.004    0.000    0.004    0.000 {method 'softmax' of 'torch._C._TensorBase' objects}
         2856    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/json/encoder.py:104(__init__)
      223/221    0.001    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/_utils/signal_handling.py:63(handler)
         1980    0.003    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/container.py:107(__iter__)
          295    0.001    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:173(close)
         2867    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/threading.py:1031(name)
         4272    0.003    0.000    0.004    0.000 {method 'join' of 'str' objects}
          590    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:117(__init__)
          940    0.004    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/google/protobuf/internal/well_known_types.py:211(ToSeconds)
            2    0.004    0.002    0.004    0.002 {built-in method numpy.array}
         2145    0.003    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:1175(named_children)
          223    0.004    0.000    0.004    0.000 {built-in method torch._C._error_if_any_worker_fails}
           59    0.001    0.000    0.004    0.000 /opt/anaconda3/lib/python3.8/queue.py:33(__init__)
         8568    0.004    0.000    0.004    0.000 {method 'startswith' of 'str' objects}
         5709    0.003    0.000    0.003    0.000 {built-in method time.time}
          190    0.003    0.000    0.003    0.000 {method 'mul' of 'torch._C._TensorBase' objects}
          295    0.000    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:360(_close)
           59    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:364(current_device)
           59    0.000    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:334(set)
          236    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/selectors.py:234(register)
         2823    0.003    0.000    0.003    0.000 {built-in method torch._C.is_grad_enabled}
          590    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/_weakrefset.py:81(add)
         2856    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:486(is_matplotlib_typename)
         8601    0.003    0.000    0.003    0.000 {built-in method posix.fspath}
          295    0.001    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/queues.py:150(cancel_join_thread)
         1009    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/weakref.py:103(remove)
         2856    0.002    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/util.py:490(is_plotly_typename)
         3103    0.003    0.000    0.003    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:189(name)
           24    0.002    0.000    0.002    0.000 {method 'gt' of 'torch._C._TensorBase' objects}
         6206    0.002    0.000    0.002    0.000 {built-in method _thread.get_ident}
         3923    0.002    0.000    0.002    0.000 {method '__exit__' of '_thread.lock' objects}
         1475    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/weakref.py:328(__init__)
         2966    0.002    0.000    0.002    0.000 {method 'append' of 'collections.deque' objects}
           59    0.002    0.000    0.002    0.000 {built-in method torch._C._set_worker_pids}
          236    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/selectors.py:347(__init__)
         1916    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/wandb_run.py:1336(<genexpr>)
         2867    0.002    0.000    0.002    0.000 {built-in method sys._getframe}
         4047    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:37(current_process)
         1884    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:99(_check_closed)
            2    0.000    0.000    0.002    0.001 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/optimizer.py:207(add_param_group)
         1213    0.002    0.000    0.002    0.000 {built-in method _thread.allocate_lock}
         1180    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:90(_make_methods)
           59    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:421(_reset)
          990    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/queue.py:216(_get)
          236    0.001    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:327(is_set)
         2124    0.002    0.000    0.002    0.000 {method 'rpartition' of 'str' objects}
          236    0.000    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/selectors.py:202(__exit__)
          354    0.002    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/threading.py:1177(_make_invoke_excepthook)
           36    0.000    0.000    0.002    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/activation.py:1188(__init__)
         1882    0.001    0.000    0.001    0.000 {built-in method torch._C._set_grad_enabled}
          295    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:824(<genexpr>)
           16    0.001    0.000    0.001    0.000 {method 'ge' of 'torch._C._TensorBase' objects}
           59    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:140(_lazy_init)
         1082    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/queue.py:208(_qsize)
           36    0.001    0.000    0.001    0.000 {built-in method builtins.sum}
         2950    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:48(debug)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:296(notify_all)
          295    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:229(cancel)
            2    0.000    0.000    0.001    0.001 /opt/anaconda3/lib/python3.8/random.py:315(sample)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:519(set)
           10    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:154(__init__)
          744    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2461(<listcomp>)
          295    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:229(__enter__)
           36    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/activation.py:1197(forward)
          236    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:268(close)
          446    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:258(_acquire_restore)
          357    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/_weakrefset.py:38(_remove)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:270(notify)
          934    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/autograd/__init__.py:60(_tensor_or_tensors_to_tuple)
          590    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:233(get_context)
           16    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/tensor.py:528(__format__)
          236    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:209(__init__)
          236    0.001    0.000    0.001    0.000 {method 'copy' of 'dict' objects}
          236    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:234(ident)
         1009    0.001    0.000    0.001    0.000 {built-in method _weakref._remove_dead_weakref}
          236    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/selectors.py:215(_fileobj_lookup)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:107(is_initialized)
         2151    0.001    0.000    0.001    0.000 {method 'remove' of 'collections.deque' objects}
          354    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:1110(daemon)
          295    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:94(__enter__)
         1757    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:513(is_set)
         1318    0.001    0.000    0.001    0.000 {built-in method time.monotonic}
         1250    0.001    0.000    0.001    0.000 {method 'pop' of 'dict' objects}
          468    0.001    0.000    0.001    0.000 {built-in method math.log}
          940    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/wandb/sdk/lib/tracelog.py:193(log_message_queue)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/cuda/__init__.py:46(is_available)
          236    0.000    0.000    0.001    0.000 <string>:1(__new__)
            4    0.001    0.000    0.001    0.000 {method 'extend' of 'list' objects}
          295    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:232(__exit__)
          472    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:94(<genexpr>)
          236    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/logging/__init__.py:214(_acquireLock)
           59    0.000    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:364(notify_all)
           59    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:734(_newname)
         1180    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:197(get_start_method)
          831    0.001    0.000    0.001    0.000 {method 'discard' of 'set' objects}
          744    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/functional.py:2250(<listcomp>)
          940    0.001    0.000    0.001    0.000 {method 'keys' of 'dict' objects}
          413    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/threading.py:1095(daemon)
           59    0.001    0.000    0.001    0.000 {built-in method torch._C._cuda_getDevice}
          744    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/_reduction.py:7(get_enum)
         1239    0.001    0.000    0.001    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/context.py:187(get_context)
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:21(_fileobj_to_fd)
          934    0.000    0.000    0.000    0.000 {method 'numel' of 'torch._C._TensorBase' objects}
          990    0.000    0.000    0.000    0.000 {method 'popleft' of 'collections.deque' objects}
          295    0.000    0.000    0.000    0.000 {method '__enter__' of '_multiprocessing.SemLock' objects}
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/_utils/signal_handling.py:47(_set_SIGCHLD_handler)
          238    0.000    0.000    0.000    0.000 {built-in method math.ceil}
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:933(<listcomp>)
           59    0.000    0.000    0.000    0.000 {built-in method torch._C._cuda_isInBadFork}
          446    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:255(_release_save)
          942    0.000    0.000    0.000    0.000 {method 'items' of 'dict' objects}
      190/180    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:329(__setattr__)
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:275(_key_from_fd)
           59    0.000    0.000    0.000    0.000 {built-in method torch._C._remove_worker_pids}
          531    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/util.py:44(sub_debug)
           26    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:658(in_cooldown)
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/threading.py:944(_stop)
          295    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:97(__exit__)
           59    0.000    0.000    0.000    0.000 {built-in method torch._C._cuda_getDeviceCount}
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:1202(__del__)
          357    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/connection.py:130(__del__)
          236    0.000    0.000    0.000    0.000 {method 'register' of 'select.poll' objects}
           59    0.000    0.000    0.000    0.000 {method 'manual_seed' of 'torch._C.Generator' objects}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:955(__init__)
           26    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:662(is_better)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:24(__init__)
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:63(__init__)
           30    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/typing.py:868(__new__)
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/process.py:205(daemon)
          236    0.000    0.000    0.000    0.000 {method 'clear' of 'dict' objects}
          236    0.000    0.000    0.000    0.000 {built-in method posix.WIFSIGNALED}
          236    0.000    0.000    0.000    0.000 {built-in method select.poll}
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:87(__init__)
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/multiprocessing/synchronize.py:235(_make_methods)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/loss.py:15(__init__)
          132    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:354(_auto_collation)
           63    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:358(_index_sampler)
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/queue.py:205(_init)
           16    0.000    0.000    0.000    0.000 {method '__format__' of 'float' objects}
          295    0.000    0.000    0.000    0.000 {method 'release' of '_multiprocessing.SemLock' objects}
          236    0.000    0.000    0.000    0.000 {built-in method posix.WIFEXITED}
          236    0.000    0.000    0.000    0.000 {built-in method posix.WEXITSTATUS}
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/loss.py:10(__init__)
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:296(multiprocessing_context)
          236    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/selectors.py:199(__enter__)
          295    0.000    0.000    0.000    0.000 {method 'clear' of 'collections.deque' objects}
           59    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:845(<listcomp>)
            1    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:51(getsignal)
          295    0.000    0.000    0.000    0.000 {method '__exit__' of '_multiprocessing.SemLock' objects}
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/utils.py:165(__init__)
           26    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:646(<listcomp>)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:210(__init__)
           24    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:106(num_samples)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/nn/modules/module.py:242(register_buffer)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:25(_int_to_enum)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:578(__init__)
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:370(__len__)
           10    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/dataloader.py:300(multiprocessing_context)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/enum.py:283(__call__)
            1    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:45(signal)
           59    0.000    0.000    0.000    0.000 {method '_is_mine' of '_multiprocessing.SemLock' objects}
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:235(__len__)
           59    0.000    0.000    0.000    0.000 {method 'locked' of '_thread.lock' objects}
           30    0.000    0.000    0.000    0.000 {method 'setdefault' of 'dict' objects}
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/signal.py:35(_enum_to_int)
            9    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/_collections_abc.py:302(__subclasshook__)
            4    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/utils/data/sampler.py:127(__len__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/enum.py:562(__new__)
            2    0.000    0.000    0.000    0.000 /data/RS/Never-Forgotten/utils.py:195(__init__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:677(_init_is_better)
            9    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/_collections_abc.py:392(__subclasshook__)
            2    0.000    0.000    0.000    0.000 /opt/anaconda3/lib/python3.8/site-packages/torch/optim/lr_scheduler.py:616(_reset)
            1    0.000    0.000    0.000    0.000 {built-in method _signal.signal}
            1    0.000    0.000    0.000    0.000 {built-in method _signal.getsignal}
            2    0.000    0.000    0.000    0.000 {method 'isdisjoint' of 'set' objects}
            1    0.000    0.000    0.000    0.000 {method 'disable' of '_lsprof.Profiler' objects}
            1    0.000    0.000    0.000    0.000 {built-in method builtins.callable}
    ```
    
- After Func Res
    
    ```python
    HACK 1 : 720 us
    ```
    

**总时间减少了47%，HACK1占`create_masked_lm_predictions` 的耗时减少了83%，大成功**

## NSight System优化 Timeline

- 未优化之前
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852336.png)
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852338.png)
    
- opt0: 优化过create_masked_lm_predictions的HACK1之后
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852339.png)
    
    ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852340.png)
    
    可以看到Memory的拷贝也从17.2%→ 0.8%
    
    - 问题
        - opt01: 在forward中，大半部分sm都是处于不活跃的状态，而且cuda的DtoH占用了很长时间，也就是说数据传送是个大问题
- opt01：这里的传送的数据其实还是来自于函数create_masked_lm_predictions，[tensor(…, device=’cuda:0’), …] 的形式
    - 直接在create_masked_lm_predictions对cuda上的tensor操作，而非对列表操作
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852341.png)
        
        forward的情况的确有所改善，看来就是数据的问题，但是create_masked_lm_predictions的时间变长了很多，所以这个方法不行
        
    - 思考了一下，这部分的计算是这样的
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852342.png)
        
        gpu的长处不在判断，甚至说这应该是个短处。而且create_masked_lm_predictions中有一部分数据在gpu，一部分在cpu，这样来回读取笨；唉也更耗时。所以可以把 create_masked_lm_predictions放在cpu上计算，计算完之后统一转换成tensor并搬运。
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852343.png)
        
        **这样结束之后果然优化了很多，而且 create_masked_lm_predictions + 数据转换 & 搬运+ forward加起来的时间也大大减少 （149ms → 62ms， 优化了58%）**
        
- opt1：经过前面的优化之后，发现还可以优化的点：在模型迭代训练的循环中，create_masked_lm_predictions只在cpu上运行，而后续的操作基本在gpu上完成。
    - opt10: gpu上的计算仅依赖于本次迭代中cpu产生的结果，因此想到本次迭代的gpu运算和下次迭代的cpu运算可以并行。下面写出伪代码：
        
        ```python
        ----------------- Before --------------
        for idx, batch in enumerate(train_data):
        	## cpu上的运算 cpu_computation
        	create_masked_lm_predictions(...) 
        
        	## 以下均是gpu上的计算 gpu_computeation
        	forward
        	loss
        	backward
        
        ----------------- After --------------
        ## 分析要点
        ## cpu上的任务可以一次全部提交，然后并行计算
        ## gpu上的任务要等待cpu上的结果计算完成才可以
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=32)
        future_results = {executor.submit(cpu_computation, (args, idx, itemlist, batch)) : 
                                        idx for idx, batch in enumerate(surrogate_data)}
        while future_results:
              done, _ = concurrent.futures.wait(future_results, return_when=concurrent.futures.FIRST_COMPLETED)
              for future in done:
        					gpu_computeation
        			for future in done:
                  del future_results[future]
        ```
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852344.png)
        
        Before
        
        ![](https://20231118-1258904223.cos.ap-shanghai.myqcloud.com/image/202602011852345.png)
        
        After
        
        **可以看出，本次gpu上的计算结束到下次gpu上的计算开始时间明显少了很多 69.4ms → 7.2ms**
        
        **以period 0的数据(11541个session)为例，跑完所有epoch(32个epoch)，所需的时间 553ms → 288 s**