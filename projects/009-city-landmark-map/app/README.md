# 城景工坊 · 运行与操作

新增 `library.html`，可查看全部现有图稿及资料原文。`node build-library.mjs` 从项目资料生成页面与 `archive-files/` 副本；`npm run build` 自动执行并复制全部资源。无需扩大本地服务文件访问范围。

> 归档状态（2026-09-14）：技能沉淀暂缓，本文保留历史研究与运行资料；不作为继续开发安排。当前入口：[阶段备忘](../archive-summary.md)。

## 最新真实位置核对（v0.7）

已补入4个真实高德点位，总计24处有坐标、15个目的地缺坐标；OSM范围核对为1处区域支持、1处边界附近待核。执行 `npm run research:xian` 从原始响应离线复算，再导出清单；不会自动实时采集。新增5项测试，全部40项通过。见[真实证据与算法边界](../xian-location-evidence.md)。

## 首次西安验证基线（v0.6历史）

研究页顶部新增40条归集记录：35个目的地、4个抵达参照与白鹿原地域。支持筛选用户必选点、缺坐标及缺独立证据并保存JSON。20处沿用单源坐标、19处新增目的地没有坐标，当前没有地点通过独立坐标一致性检查；这不是旧8素材合成测试失败，而是新增数据证据层尚未齐备。

在本目录运行 `npm run research:xian` 生成 `../assets/xian-destination-validation-v1.json`，`npm test` 包含6项新增证据校验测试。`destination-audit.mjs` 接受城市配置和地点记录，`xian-validation-data.mjs` 保存西安样本；尚未接入自动检索和外部坐标采集器。详见[产品验证记录](../xian-product-validation.md)。

本项目独立编写，默认展示最新用户提供的西安与周边景区横图，支持全图/细节查看、原图保存和8个已有地点档案。research.html 为位置研究原型；city.html 保留城区旧图，geography.html 保留13点地理依据，map.html 为地点详情地图。腾冲、丽江插画由此前内置 imagegen 生成；西安图片为用户上传，不混记为工具生成。

## 启动

环境：Node.js >= 20，本次验证 v22.15.0。

在仓库根目录运行：

~~~powershell
node projects/009-city-landmark-map/app/serve.mjs
~~~

浏览器打开 [本地工作台](http://127.0.0.1:4309/)。默认只监听 127.0.0.1。若端口已占用，在当前 PowerShell 中设置 PORT 环境变量后启动；程序不会主动扫描端口。停止服务用 Ctrl+C。

## 西安理解图

默认入口 index.html 为景区横图展示，默认资料为钟楼。“看全图 / 放大细节”切换阅读方式，“保存原图”下载用户提供的1536×1024 PNG；8个地点按钮显示已有来源。图像原样保留，袁家村、楼观台和汉城湖等已知方位问题在图下注明，具体生成工具和授权待核实。city.html 仍提供此前1024×1536城区样稿。

## 位置研究

当前默认模式为8处实际生成的景区候选素材，另保留色块故障实验。主图和城区放大分别保持坐标关系；支持素材预览、图层PNG及报告导出。运行 npm run test:scenic 检查实际图像集成，npm run research:scenic 导出材料；这两个命令需要Python和Pillow。详见[本轮图像实验](../scenic-material-integration.md)。下段为首轮色块模式说明。

research.html 自动运行8处测试素材的受控合成与像素归属检查，无需人工观察表。可切换正常、错位、漏画、遮挡和错误素材场景；位置失败时禁止测试 PNG 导出，仍可保存报告。npm run research 生成五种场景的报告；npm test 包含故障注入。见[自动位置校验研究](../automatic-position-audit.md)。旧观察表／verify-artwork.mjs 仅作历史调试；当前色块实验不代表真实景区图已生成。

## 地理依据

入口 geography.html。四个范围按钮切换城市与周边、中心城区、雁塔一带和临潼景区；地点列表与图中标签均可选择。详情显示坐标、参考点含义、来源链接和核对日期。比较控件只计算近似直线距离，不提供车程。导出当前图件为 SVG，地点依据为 JSON。

地图点位按坐标固定。整体图与城区放大图有独立比例尺；未绘制路网或行政边界。手机窄屏可横向滚动地图，地点列表提供同等选择入口。实际浏览器交互和移动端显示尚未测试。

[西安数据与研究说明](../xian-research.md)

## 插画工作台操作

从顶部“插画工作台”打开 studio.html：

1. 在左栏选择腾冲或丽江，编辑海报文字和装裱配色。
2. 在右栏选择地标，编辑名称、控制标注显示、调整横向和纵向位置。
3. 也可直接拖动画布中的标注；聚焦画布后方向键每次移动 0.5%，Shift 加方向键每次移动 2%。
4. 导出海报按钮输出 1800 × 2400 PNG。导出不会包含编辑选择框。
5. 保存工程输出 JSON，导入工程可恢复文字、位置和配色；不包含重复底图。
6. 草稿按城市保存在当前浏览器本机。存储不可用时会提示保存工程。
7. 新城市提示词工具支持微缩模型、水彩和分层纸雕三种创作说明；不会在线生成新图片。

底图固定，隐藏标注不等于隐藏建筑，改名称不改变建筑。地标来源链接始终指向原始地标资料，修改名称后界面会提示重新核实。

## 测试与构建

~~~powershell
node --test projects/009-city-landmark-map/app/studio.test.mjs projects/009-city-landmark-map/app/xian.test.mjs
node projects/009-city-landmark-map/app/build.mjs
node projects/009-city-landmark-map/app/check.mjs
~~~

构建复制本站源文件和必要图片到 dist/，重写为部署后同目录相对引用。沿用[仓库部署规范](../../../docs/deployment.md)，尚未发布。

## 源码结构

| 文件 | 作用 |
| :--- | :--- |
| index.html / illustration.css / illustration.mjs | 默认西安插画展示、全图/细节、原图下载及六个地点来源 |
| geography.html / xian.css / xian.mjs | 西安地理关系图与来源、距离比较界面 |
| xian-data.mjs / xian-geo.mjs | 13 个地点、近似投影、距离计算与 SVG 标签避让 |
| xian.test.mjs / render-xian.mjs | 地理逻辑测试与导出验证图件 |
| studio.html / style.css | 原插画工作台、响应式版式与操作面板 |
| model.mjs | 城市资料、工程验证、位置边界、提示词 |
| render.mjs | 屏幕与导出共用的 Canvas 渲染及标注命中 |
| app.mjs | 编辑、保存、导入、导出与可选 WebMCP 注册 |
| serve.mjs | 仅本机静态服务 |
| build.mjs | 独立静态构建 |
| studio.test.mjs | 状态与渲染规则测试 |
| check.mjs | 构建引用、控件 ID 和脚本语法检查 |
| render-samples.mjs | 使用外部提供的 @napi-rs/canvas 生成验证用成品 |

普通运行不需要 @napi-rs/canvas。render-samples.mjs 是本次 PNG 验证辅助工具，需要单独传入该模块的绝对路径，并使用 Windows 字体目录；不属于网页运行依赖，不在构建中执行。

## 隐私与已知限制

编辑数据只保存在本机；工程导入不接受任意外部图片地址。点击资料来源才离开本站。没有账号、后端或 API 密钥配置。

2026-09-14 已通过真实浏览器确认首页新图、放大切换和研究页8点资料。WebMCP 在支持的 document.modelContext 上可注册读取和配置工具，未在真实支持环境中验证。页面主要操作不依赖它。


## 2026-09-14 宏观范围扩展

此前宏观地图已移至 map.html，20个地点档案；当前首页为最新用户景区图。地图支持三个范围、片区筛选、五个抵达或中心参照，以及地点介绍、方位和直线距离。Leaflet 与坐标转换库已本地化，底图仍需联网。详见[宏观地图记录](../xian-atlas.md)。此前13点地理校验页和图件保持原有范围。
