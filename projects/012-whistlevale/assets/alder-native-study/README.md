# 原生 Alder Valley 细节研究截图

2026-09-15 实际浏览器截图；未裁切、合成或生成。用于[原生细节分析](../../native-alder-analysis.md)。

| 文件 | 来源与状态 |
| :--- | :--- |
| [01-native-overview.jpg](01-native-overview.jpg) | 作者线上 Alder Valley，全景：房间、收藏桌与铁路沙盘 |
| [02-native-locomotive.jpg](02-native-locomotive.jpg) | Nightingale 近景；暂停后缩放到车头完整可见 |
| [03-native-cutaway.jpg](03-native-cutaway.jpg) | 沿用机车观察方向，开启列车揭顶 |
| [04-native-night.jpg](04-native-night.jpg) | 沿用揭顶状态与观察方向，切换 Night run；Miniature lens 开启 |
| [05-ours-overview.jpg](05-ours-overview.jpg) | 本地 012 单展品，春日全景；页面滚动到画布与内容区，车站说明仍选中 |
| [06-ours-station.jpg](06-ours-station.jpg) | 本地 012 单展品，重新点击车站看点后的近景，暂停、春日、屋顶合上 |

原作入口为 <https://whistlevale.com/?room=valley>，线上部署 SHA 未确认。源码研究固定到 `f3d769e8ea54d2f5a47d12f27773541b484c6302`，主仓库 MIT，见[许可证](../UPSTREAM-LICENSE.txt)。

本地入口为 <http://127.0.0.1:8412/valley.html>，需要服务运行，未公开部署。003 主体源文件与[现有快照](../valley-exhibit-v1/source-manifest.json)全部匹配。

双方浏览器视口不同，未指定设备模拟，也未进行同机位像素比较。图片不证明音质、帧率、完整物理仿真或每个内部零件都已逐一观察。尺寸、SHA-256 与文件头校验见 [image-manifest.json](image-manifest.json)。
