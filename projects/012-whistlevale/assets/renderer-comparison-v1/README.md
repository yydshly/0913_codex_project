# Three.js 与原生 WebGL 2：实际对照证据

日期：2026-09-15。来源为本地 `http://127.0.0.1:8412/renderer-compare.html`，通过 Codex 内置浏览器实际操作与截图。没有使用上游图片或生成图替代实验画面。未公开部署。

| 文件 | 状态 |
| :--- | :--- |
| [01-custom-station.jpg](01-custom-station.jpg) | 同算法：站房、屋檐、窗框与站牌 |
| [02-custom-wood.jpg](02-custom-wood.jpg) | 同算法：木纹与砖缝近景 |
| [03-custom-metal.jpg](03-custom-metal.jpg) | 同算法：车漆与金属 |
| [04-custom-night.jpg](04-custom-night.jpg) | 同算法：夜间灯光 |
| [05-custom-lens.jpg](05-custom-lens.jpg) | 同算法：微缩景深 |
| [06-standard-station.jpg](06-standard-station.jpg) | 内置材质配置：站房与屋檐 |
| [07-standard-wood.jpg](07-standard-wood.jpg) | 内置材质配置：贴图木纹与砖缝 |
| [08-standard-metal.jpg](08-standard-metal.jpg) | 内置材质配置：金属环境反光 |
| [09-standard-night.jpg](09-standard-night.jpg) | 内置材质配置：夜间灯光 |
| [10-standard-lens.jpg](10-standard-lens.jpg) | 内置材质配置与统一摄影处理 |

截图为浏览器原样返回的 JPEG，保存时没有裁切、重绘或改变颜色。截图中的页面滚动位置、分界线比例可能不同，不将它们当作像素验证输入。

[comparison-results.json](comparison-results.json) 中记录十组真实 GPU 读回数据、当时的参数、输出尺寸、缓冲格式、绘制统计和日志。像素检测在每套渲染完成后立即执行，覆盖全画布 RGB，忽略 alpha，不受 HTML 分界线或文字标签影响。所有主测试的输出均为 1105×658、两侧 RGBA16F；这些是当前设备条件，不代表物理手机测试。

[control-check.json](control-check.json) 是额外组合参数检查。[image-manifest.json](image-manifest.json)记录图片格式、尺寸、字节数与 SHA-256；[source-manifest.json](source-manifest.json)记录本轮源码和 Three.js 依赖版本。

本轮结果显示：同算法输出非常接近，但没有完全逐像素一致，也未定位所有残余差异。内置配置算法不同，较大的颜色差值不能视为画质评分或框架能力上限。详见[研究结论与边界](../../renderer-comparison.md)。
