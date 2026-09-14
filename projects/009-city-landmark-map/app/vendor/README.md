# 浏览器依赖

核对日期：2026-09-14。来自 npm 官方注册表的固定发布包；未提交上游完整仓库。

- [Leaflet](https://github.com/Leaflet/Leaflet)：1.9.4，BSD-2-Clause，保留 LICENSE.txt；commit 待核实，研究版本为 npm 1.9.4。
- [coordtransform](https://github.com/wandergis/coordtransform)：2.1.2，MIT，保留 LICENSE.txt；commit 待核实，研究版本为 npm 2.1.2。

为兼容现有本地服务器，原始 leaflet.js 与 coordtransform index.js 分别原样复制为对应目录下的同名 .mjs 资源；HTML 按传统脚本加载，文件内容未改。Leaflet 的样式和图片原样保留。版本与完整性校验见 ../package-lock.json。

OpenStreetMap 底图在线请求，遵守[瓦片使用政策](https://operations.osmfoundation.org/policies/tiles/)：显示署名、保留正常浏览器 Referer 与缓存，不做批量预取、离线缓存或底图导出。底图配置在 ../atlas-config.mjs。转换是近似算法，不保证入口或导航级精度。
