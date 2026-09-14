# 技术与验证记录

## 2026-09-14 · 截图溯源

用户请求“查找并参考”。截图中的 MINIMOTO、Christopher J. DiMarco 只作检索线索。搜索同名游戏和作者后，从作者 X 主页置顶原帖找到演示，浏览器比对成功。同名 Android 手游未采用。Dream Loop 讨论中作者另一个作品不能证明摩托项目也使用该 Skill。

原帖 ID：2098919328368197682。浏览器原帖详情显示“2026年9月13日 7:38”，主页摘要显示 9月12日，可能与显示时区有关，不将摘要日期作精确发布时间。X 抓取工具返回 403，但浏览器能够读取原帖和讨论串。

## 版本与资源

公开仓库、commit/tag 和项目许可证均待核实。以下是本次实际读取的线上构建标识，不是 Git commit：

- HTML deploymentVersion：`bde6c866-0151-4432-bb13-5203da23eb80`。
- 页面块：`/_next/static/chunks/page-CmKjfBRo.js`，117,666 字节。
- 引擎块：`/_next/static/chunks/engine-Ci7MRUyi.js`，3,226,715 字节。
- 引擎 SHA-256：`B9E5B89988C307C08F089CD60E72E2E1947443EFEBCF7B87D5A426024AA979AA`。

文件大小不是压缩传输大小、总资源量或显存。发布脚本仅下载到系统临时研究目录，未收录进仓库，未作为开源代码分发。

## 发布脚本观察

| 定位线索 | 实际观察 | 结论边界 |
| :--- | :--- | :--- |
| MotoEngine | 页面动态 import 后创建实例 | UI 与主要模拟逻辑分离 |
| THREE.GLTFLoader | 引擎包含 Three.js 加载与渲染代码 | Three.js 版本待核实 |
| rapier_wasm3d | 初始化重力 -9.81 的世界，timestep=1/120 | 包含 Rapier，设置 120 Hz 物理时间步；不等于稳定渲染帧率 |
| track.gripAt / track.surface | 路面与轮胎选择参与速度和抓地力计算 | 路面具备行为用途；未做效果量化 |
| rebuildWorld | 清理部分效果对象并重建世界 | 存在编辑更新路径；未验证所有编辑 |
| mini-moto-park-v1 | localStorage 保存 edits | 本地公园存档逻辑 |
| mini-moto-roster-v1 | 保存档案、替补与车辆配置 | 独立车手存档逻辑 |
| AudioContext | 创建增益、压缩器等音频节点 | Web Audio；不能据此称全部音频是合成 |
| get_race_state | 注册只读页面工具 | 可供状态检查，本次未调用 |

引擎加载 `/assets/terrain-v4.png`、`bike-v3.glb`、`pine-v3.glb`、`pit-station-v1.glb`、`course-dirt-v1.png`。当前版本使用模型和贴图文件，不能宣称完全由程序几何生成。资产创作方式、是否由 AI 生成及许可均待核实。

标识可在对应公开 JS 中全文搜索。本次没有源工程的模块路径、开发命令或测试套件证据。

## 浏览器实测

环境：Windows，Codex 内置浏览器，作者线上网页；截图 1280×720。

- 比赛加载成功，计时、名次和圈数推进，观察到第 5 圈，未验证 8 圈结算。
- Helmet cam 切为 REX / HELMET CAM，画面沿赛道倾斜；Park overview 恢复全景。
- Rider roster 显示八名车手、七项能力、490 总点数/70 平均值与车辆方案；页面说明查看档案期间比赛暂停。
- Take control 切为 REX / YOU ARE RIDING，出现 Hand back 和输入提示；Escape 后恢复 Take control。仅验证控制权切换，未做完整加速、转向或手柄测试。
- 一次按 checkbox 角色定位 Take control 未命中，读取新界面状态后通过实际元素成功点击，不据此判断为产品故障。
- 页面显示过 36、52、69、120 等瞬时 FPS；没有控制机位、前后台与采样时间，不作为性能结论。
- 未验证地形编辑、撤销、刷新恢复存档、战斗、炮塔、声音、移动端和长时间稳定性。

已保存用户原始图、实测头盔视角、车手档案和公园全景。没有新增游戏、部署或提交。其他研究目录独立维护，本项目保留已有 005、006 编号，使用 007。

## 文档检查

实际检查通过：4 份文档无模板占位符，9 处本地引用目标存在；根 README 的索引和预览均升序，007 各出现一次。`git diff --check` 通过，仅提示现有 CRLF 将转换为 LF；已打开保存的头盔截图确认画面有效。未运行应用测试，因为本次没有新增或修改应用代码。
