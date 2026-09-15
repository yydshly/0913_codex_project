# WebGL 2 细节研究第二版：实景与验证

2026-09-15，通过 Codex 内置浏览器在本地 `http://127.0.0.1:8412/webgl-lab.html` 实际操作并截图。全部画面来自本仓库独立教学场景，没有使用生成图、上游截图或照片替代。未公开部署。

| 文件 | 状态 |
| :--- | :--- |
| [01-split.jpg](01-split.jpg) | 默认近景，左基础、右精细，三项全部开启，50% 分界线 |
| [02-base.jpg](02-base.jpg) | 同机位只看基础，太阳 135°、白天、曝光 1.1、景深 0、小车固定 |
| [03-fine.jpg](03-fine.jpg) | 与 02 相同机位与参数，三项全部开启，只看精细 |
| [04-structure-only.jpg](04-structure-only.jpg) | 滑动对照，仅增加结构几何 |
| [05-materials-only.jpg](05-materials-only.jpg) | 滑动对照，仅增加材料处理，模型三角形均为 3430 |
| [06-lighting-only.jpg](06-lighting-only.jpg) | 滑动对照，仅增加阴影滤波与补光 |
| [07-night-lighting.jpg](07-night-lighting.jpg) | 06 改为夜间，页面滚动位置不同，未启用精细结构和材料 |
| [verification-all-off.jpg](verification-all-off.jpg) | 只看精细，但三项全部关闭；浏览器取样图含部分界面 |
| [verification-base.jpg](verification-base.jpg) | 同参数只看基础，作为取样验证参考 |

七张完整视口截图均为 782×881 JPEG。两张取样图均为 473×427 JPEG，由浏览器截图接口直接返回；保存时未二次裁剪、重绘或改变颜色。界面标签不同，因此没有把整张图片说成一致：使用 Pillow 只读比较取样图中的场景区域 `(0,70,330,375)`，330×305 像素的解码 RGB 差值包围盒为 `None`，表示该区域一致。它是压缩截图的固定区域对照，不是 GPU 原始缓冲的无损全画面验证，也不覆盖所有机位、设备或动画状态。

各截图滚动位置可能不同；01—03 的模型机位和时间保持相同。03 的变化来自三项实现同时开启，不能仅凭它归因于某一项算法。04—07 才用于分别观察。

[图片尺寸、字节与 SHA-256](image-manifest.json) · [十个运行文件及一个测试文件的版本清单](source-manifest.json) · [研究正文](../../webgl-detail-study.md)。第一版档案保留在 [webgl-lab](../webgl-lab/README.md)，不覆盖旧证据。
