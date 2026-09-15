# WebGL 2 独立教学实验实景

2026-09-15，实际访问本地 <http://127.0.0.1:8412/webgl-lab.html> 采集的浏览器截图。模型为本仓库独立实现，不是 Whistlevale 原作截图。无 AI 生成、裁切、合成或画面修饰。

| 文件 | 状态 |
| :--- | :--- |
| [01-step-0.jpg](01-step-0.jpg) | 第 01 步，三角形 |
| [02-step-1.jpg](02-step-1.jpg) | 第 02 步，完整几何、纯色、无光照 |
| [03-step-2.jpg](03-step-2.jpg) | 第 03 步，方向光和环境光 |
| [04-step-3.jpg](04-step-3.jpg) | 第 04 步，程序材料与高光 |
| [05-step-4.jpg](05-step-4.jpg) | 第 05 步，加入阴影 |
| [06-step-5.jpg](06-step-5.jpg) | 第 06 步，动画层；采集时暂停，不以单张图片证明运动 |
| [07-step-6.jpg](07-step-6.jpg) | 第 07 步，景深与色调处理 |
| [08-shadow-depth.jpg](08-shadow-depth.jpg) | 实际光源深度纹理的调试视图 |
| [09-normals.jpg](09-normals.jpg) | 表面法线映射为颜色 |
| [10-night-closeup.jpg](10-night-closeup.jpg) | 夜间、站房近看，景深 0.8、曝光 1.1 |

第 02—07 步保持同一机位、光照参数与暂停的小车位置，几何相同。浏览器使用自然视口，未模拟移动设备；页面滚动位置在检查其他控制时可能改变。[image-manifest.json](image-manifest.json) 记录实际尺寸和 SHA-256。

源码版本由 [source-manifest.json](source-manifest.json) 的哈希标识。上游研究版本 `f3d769e8ea54d2f5a47d12f27773541b484c6302`（MIT），许可见[原文](../UPSTREAM-LICENSE.txt)；此目录没有复制上游模型。

[完整研究](../../webgl2-study.md) · [返回素材目录](../README.md)
