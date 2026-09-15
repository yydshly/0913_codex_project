# 012 · 研究与验证记录

## 2026-09-15 · 原库效果与单场景理解

### 本轮任务

新增子项目，分为两部分：第一展示 Whistlevale 原库的效果和能力；第二以 Alder Valley 铁路沙盘为入口，理解其模型、运行、镜头、氛围、编辑与展馆组织方式。

交付为 Markdown 图文档案及原作实测截图。未复制完整上游仓库、未实现独立应用、未提交或部署。

### 版本与环境

| 项目 | 记录 |
| :--- | :--- |
| 上游 | https://github.com/nickfromlater/whistlevale |
| 固定源码版本 | f3d769e8ea54d2f5a47d12f27773541b484c6302 |
| 对应提交 | 2026-09-13，Merge pull request #37；本次通过 GitHub API 获取 main 的 SHA |
| 线上观察 | https://whistlevale.com/?room=valley |
| 展厅观察 | https://whistlevale.com/grandhall.html?from=valley&gallery=grand |
| 地图截图入口 | https://whistlevale.com/index.html?map=grandhall&room=valley |
| 浏览器 | Windows 上的 Codex 内置浏览器，实际 WebGL 页面 |
| 版本一致性 | 未取得线上部署 SHA，未逐文件对照线上与固定源码；截图与源码分开记录 |
| 本地上游测试 | 未执行 npm test、build 或本地运行；不把上游测试脚本的存在写成测试通过 |

### 已实际完成的观察

| 编号 | 操作 | 可确认结果 | 图片 |
| :--- | :--- | :--- | :--- |
| O1 | 打开 Alder Valley，收起贡献邀请卡 | 完整房间与桌面沙盘出现，可见列车运行 | 01 |
| O2 | Train → Look at the locomotive → Train → Lift off the roofs | 进入列车近景；揭顶开关变为选中，车厢顶部打开 | 02 |
| O3 | 关闭面板，暂停，再继续 | 暂停按钮变为 Run the railway，继续后恢复 Pause the railway | 03 为暂停状态 |
| O4 | More → Atmosphere → Night run；窗雨开关打开；Cinema | 灯光变暗，进入 Gentle drift，出现 Cinema 操作；Leave cinema 返回成功 | 04 |
| O5 | More → Build your railway → Plan | 出现模型目录、俯视图、Grid/Snap/Shape track 等入口 | 05 |
| O6 | 打开 Project menu | 出现 JSON 导出、可玩 HTML 导出、存档导入；本轮没有执行这些动作 | 无另存截图 |
| O7 | Run my railway → Switch room | 编辑器退出成功；房间地图可显示九个房间入口 | 06 |
| O8 | 观察 Grand Hall；House map 返回 | 展柜、已放置模型与空展位可见，返回地图成功 | 07 |

O4 只确认夜间视觉、开关状态与 Cinema 进入/退出。窗雨细节、声音听感、所有机位、任意角度相机均未完成专项验收。

同日上一阶段已观察 Yamaai，确认原 Mountain Railway Diorama 以真实模型出现在展室，并显示原作者与来源链接。本轮将其作为接入参考，不作为单场景主线，也没有把上一阶段未落盘的画面当成本轮图片。

### 数量与文档差异

- 本轮线上地图显示九个房间入口，已记录在场景导读。
- Train 菜单显示 “Explore the collection · 9 trains”；较早的 EXPERIENCE.md 写八种。说明文档枚举和线上 UI 存在时间差，不声称逐款列车完成验证。
- Grand Hall 的七个展厅、112 个展位是贡献空间总量；空展位不能记作已有模型。
- README 的无依赖表述适用于主程序无需 npm 安装包即可运行；外接 Yamaai 与 Queens 的仓库内容包含 Three.js。
- 原生 Alder Valley 面板明确写 Rain on the windows；没有把它扩大描述成 004 同等级的完整天气系统。

### 原理定位（不可变链接）

以下为直接阅读过的源码或约定，解释见 [scene-guide.md](scene-guide.md)。

| 主题 | 固定版本入口 | 核实到的内容 |
| :--- | :--- | :--- |
| 模型构建 | [railway.js / Builder](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L49) | 几何变换与顶点组装，形成原生模型 |
| 微缩镜头 | [railway.js / POSTFS](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L258) | 场景颜色、深度与焦距参数参与后处理 |
| WebGL 初始化 | [railway.js / initGL](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L332) | 创建 WebGL 2、主程序、阴影与后处理资源 |
| 路径取样 | [railway.js / Edge](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L340) | 三次曲线采样、累计长度、按距离二分查询位置和方向 |
| 运行状态 | [railway.js / workshopUpdateSimulation](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L481) | 油门目标速度、加减速、停站距离、车轮和烟汽更新 |
| 帧更新 | [railway.js / animate](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L514) | 时间步进、模拟、相机、声音和渲染的更新顺序 |
| 布局数据 | [railway.js / workshopSnapshot](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L1194) | 名称、物体、轨道等进入快照；后续保存到 localStorage |
| 导出入口 | [railway.js / exportProject](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/railway.js#L1242) | 布局 JSON 的导出入口；实际便携内容还受后续代码与外接项目规则影响 |
| 房间注册 | [rooms.js / registerHouseRoom](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/rooms.js#L17) | 房间定义、缓存失效和注册修订 |
| 房间构建 | [rooms.js / getHouseScene](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/rooms.js#L198) | 生成房间、验证列车、分配与释放图形资源 |
| 外接适配 | [guest-yamaai.js](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/src/guest-yamaai.js) · [接入约定](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/docs/contributing/embedded-projects.md) | 按需导入原作者模型、相机与深度对齐、更新与释放；渲染器间阴影存在边界 |
| 展厅规则 | [grandhall.md](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/docs/contributing/grandhall.md) | 展位身份、几何预算、按需加载及审核；不等于多人实时编辑 |
| Blender 接入 | [blender.md](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/docs/contributing/blender.md) | 静态模型转换桥接，不是通用动画导入 |
| 用户操作 | [EXPERIENCE.md](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/docs/EXPERIENCE.md) | 镜头、列车、声音、编辑和发布说明 |
| 环境与检查 | [package.json](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/package.json) · [README](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/README.md) | Node.js >=24，开发服务器调用 Python；有完整测试脚本，本轮未执行 |
| 许可证 | [LICENSE](https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/LICENSE) | MIT，版权主体 Whistlevale contributors |

### 上游运行条件（仅文档确认）

上游要求 Node.js 24+、Python 3.10+ 和支持 WebGL 2 的浏览器。其开发命令为 npm run dev，内部调用 python3 scripts/serve.py，文档端口 4174；主程序不要求先 npm install。

本轮没有在 Windows 上验证 python3 命令别名、端口或启动过程，故不列为可复现成功。后续若运行，应在临时或被忽略的上游工作目录中检出固定提交，不把完整上游仓库或嵌套 .git 放入本项目。

### 当前限制与下一步

1. 图文归档可直接阅读；尚无本项目独立运行版或线上研究页。
2. 油门/路线/停站、布局增删改、JSON 导入回环与可玩 HTML 导出待实测。
3. 本次浏览器尺寸变化来自当前页面观察环境，不代表物理手机测试；无 FPS、显存或多设备性能结论。
4. 之后若实践，先选“一项布局修改并保存恢复”验证编辑链路，再评估统一展馆或接入 003 的投入。
5. 主仓库 MIT 已保留原文；可选录音不在此次材料中，也不视为 MIT 覆盖。

### 本项目文件验证

2026-09-15 实际检查结果：5 份 Markdown、36 个相对文件链接、3 个锚点通过；7 张 JPEG 文件头、尺寸及 SHA-256 已记录；未遗留模板占位；根索引和预览均为 001—012 升序且编号唯一。

采集接口返回的是 JPEG 字节，首次使用 PNG 后缀被文件头检查发现，现已修正为 .jpg 并同步所有引用；原图字节未改变。前四张为 1280×720，后三张为 797×898。此结果只验证研究材料与导航，不代替上游应用功能、音频或性能测试。

## 2026-09-15 · 新增独立作品展馆

根据后续“整体展厅布局 + 单个展台风格和能力”的沟通，新增 012/app 独立 Three.js 作品馆。三组主题展区包括 003/004、008/010、009/011，共六个展台。展台缩景为独立导览示意，五张实际效果图来自既有档案；010 不用上游截图冒充本仓库成果。

实现和状态见 [gallery.md](gallery.md)。本地预览运行于 8412，94 项数据、DOM、资源和语法检查通过；构建 15 个资源，本地 HTTP 内容与构建哈希一致。十二个既有作品/研究入口均返回 200。本轮没有浏览器交互验收或部署，不把静态检查当作 GPU 画面和嵌入作品功能验证。

## 2026-09-15 · 后续：适用场景与单展台深入研究

新增 [exhibit-research.md](exhibit-research.md)，围绕陌生地方首次认识、旅游地介绍、主题作品馆的区别，以及一个精致单展品的内容、镜头、交互、真实性和技术边界展开。引用 7 个官方资料页面；Whistlevale 接入文档继续使用原固定 commit。研究提案与外部事实分别标明，没有将虚构白鹭河谷当成真实目的地。

后续浏览器观察见 [gallery-audit.md](gallery-audit.md)：全馆 → 近看白鹭河谷 → 打开已发布 003 页面及三维场景 → 返回，四步已实际操作并截图。发现中等宽度窗口下水平溢出、近景裁切、文字叠压及编辑面板抢占画面。此结果补充上一节的静态验证，不意味着其余五个展品、所有内部控制、无障碍或性能已验收。

本轮只更新研究文档、导航和截图，未改应用。检查本轮涉及的 7 份 Markdown 中 193 个相对文件链接，无缺失；4 张图片均确认 JPEG 文件头、像素尺寸与 SHA-256，保存为 [清单](assets/audit-2026-09-15/image-manifest.json)。没有重新运行应用构建或历史测试，也没有提交、推送或部署。

## 2026-09-15 · 确认后实施：白鹭河谷单展品样板

用户确认后完成 [一座车站的日常](valley-exhibit.md)：完整原场景、车站/拱桥/河岸三个看点、站房揭顶/合顶、同机位春秋、暂停/继续和全景。作品馆的白鹭河谷入口改为本地参观页，其他五件作品沿用原入口。

新增 `valley.html/css/mjs` 与 `prepare-valley.mjs`。从同仓库 003 复制 42 个必需场景源文件，生成目录不提交；只在生成副本隐藏旧界面、调整相机偏移与减少动画策略，未写入 003，也未运行 003 构建。许可与精确源码哈希随运行副本保留。使用同源 iframe 控制原有场景，不称作大厅内原生三维嵌入。

实际验证：构建 63 个资源，HTTP 内容逐项匹配输出哈希；95 项原有展馆静态检查通过；新增模块语法、页面 DOM 引用、源场景控制契约与依赖引用检查通过。8 份文档的 208 个相对文件链接无缺失。6 张实际 JPEG 截图已保存并重新查看，见[图片目录](assets/valley-exhibit-v1/README.md)和[哈希清单](assets/valley-exhibit-v1/image-manifest.json)。

浏览器实际完成场景就绪、三个看点、揭顶/合顶、春秋（秋日使用 Enter）、继续/全景、顶部回馆、从展馆重新进入，并观察浏览器后退与前进的恢复过程。最初揭顶文字与原控件的暂停行为不一致，修正为显式暂停后复查。日志仅见继承的阴影模式弃用提示，没有本轮参观页运行错误。一次跨 iframe 的只读检查受工具限制未执行成功，相关判断使用实际画面与界面状态；不将失败检查记为通过。

未设置手机视口、未测实体手机、完整键盘/读屏、长时间内存或全部失败路径；旧大厅的近景裁切等问题仍在前次审视中。未提交、推送或部署。

## 2026-09-15 · 原生 Alder Valley 细节对照

新增 [原生技术与细节分析](native-alder-analysis.md)，选择 Alder Valley 房间与 Nightingale 机车作为原生样本，和 012 当前单展品复用的 003 场景比较。固定上游源码仍为 `f3d769e8ea54d2f5a47d12f27773541b484c6302`；线上部署 SHA 未确认。

本轮实际查看原作全景、机车近景、揭顶和 Night run，检查 Miniature lens 开启状态，并查看我们的春日全景与车站近景。保存六张 JPEG，均重新查看并核验文件头、尺寸和 SHA-256，见[图片说明与边界](assets/alder-native-study/README.md)。原作四张为 797×898，我们的两张为 782×881，不当作同视口像素比较或手机测试。

源码追踪覆盖 Builder、有效机车与客车构造、后加载的列车机构、材料分支、灯光、后处理、原生房间和 Cinema。明确区分自定义实时近似与物理仿真，并记录我们已有的平面倒影、四季、转向架、平滑镜头和室内观察能力。003 的 42 个复用源文件 SHA-256 均与既有源清单一致。

本轮涉及的五份 Markdown 相对文件链接检查无缺失。只新增研究文档、图片和导航，没有更改应用，没有重跑历史构建或性能测试，也没有提交、推送或部署。

## 2026-09-15 · WebGL 2 从数据到效果的独立实验

新增 [WebGL 2 实现研究](webgl2-study.md)和 `app/webgl-lab.html`，沿用 012 的本地服务与构建。八个运行文件包含独立的数学、几何、着色器、渲染、步骤说明和交互；没有导入 Three.js，没有移植上游模型。当前工作区版本由[源文件清单](assets/webgl-lab/source-manifest.json)标识，包含八个运行文件和一个测试文件。

七步为三角形、形体、光照、材质、阴影、动画和摄影。第 02 步起采用相同几何，控制对照时保留相机与参数并暂停时间。附法线颜色、光源深度图、实际绘制调用与三角形提交数；明确阶段共用完整初始化，不把三角形阶段当作最小加载体积，也不把调用数当成 FPS。

实际验证：

- 六项数学与几何测试通过：矩阵组合、相机方向、透视边界、所有采样光线方向的阴影范围、盒体外法线、全模型数据和三角形朝向。
- 原有展馆检查增至 96 项并通过；新增模块语法、HTML 资源、DOM 引用、模块引用与不依赖 Three.js 的检查通过。
- 012 构建输出 71 个文件，本地 HTTP 逐文件返回 200，内容哈希全部匹配构建清单。未运行全站构建。
- 浏览器逐一显示七个阶段，渲染状态均为 ready。摄影对照实际回到前一步；法线和阴影深度视图实际显示；光线、夜色、粗糙度、景深和曝光输入状态与画面更新已检查。
- 观察小车运行与暂停、全景与近看、滚轮缩放和恢复默认。运行摄影阶段读到 13 次绘制调用，暂停且复用阴影时为 7 次；这是当前场景工作量，不是跨框架速度比较。
- 浏览器实际使用 RGBA16F，错误和警告日志均为空。没有在不支持浮点颜色缓冲的设备上测试 RGBA8 降级，也未实测上下文丢失恢复、实体手机、完整键盘/读屏或长时间内存。
- 保存十张 1265×712 JPEG，文件头、尺寸、SHA-256 通过，见[图片目录](assets/webgl-lab/README.md)。八份相关 Markdown 的相对文件链接检查无缺失。

图片展示的是本仓库新教学实验，不能当成 Whistlevale 原作复现。新增展馆页的实验入口，更新根索引和项目导航；没有改动 003 源码，没有提交、推送或部署。研究使用 Deep Research 技能与官方资料，技术事实、实验结果和后续建议分别说明。

## 2026-09-15 · WebGL 2 同机位细节对照

用户指出上一版与已有场景效果接近。本轮在同一实验中新增“细节研究”，保留七步入门；详细方法与边界见 [细节研究](webgl-detail-study.md)。两侧仍是同一个原生 WebGL 2 渲染器，不当作 Three.js 与 WebGL 2 的画质排名。

新增可独立切换的结构部件、局部 UV 和程序凹凸、反光近似、5×5 阴影滤波与天空／地面补光。基础／精细共用机位、时刻、曝光和景深，滑动对照固定小车。真实模型数量为 3430 与 19168 个三角形；新增结构可能增加阴影成本，材料与补光也增加片元计算。没有实现完整物理材质、全局光照或场景反射。

实际验证：8 项数学／几何／比较配置测试通过，展馆原有 96 项检查通过，012 构建 73 个文件。浏览器新旧两种模式、七步逐项就绪、独立开关、只比较操作、基础／精细、夜色、法线和阴影视图通过；检查未见 error／warn。一次批量浏览器操作超时后重新读取页面状态，并分批完成相关步骤，没有将超时本身记为通过。

第二版保存 7 张实际视口截图及 2 张取样截图，见[截图与逐像素检查范围](assets/webgl-detail-v2/README.md)。全部细节关闭时，固定场景取样与基础版一致。第一版截图与原始哈希清单保持独立历史记录。未测实体移动设备、FPS 或长期资源稳定性；没有修改 003，没有提交、推送或部署。

## 2026-09-15 · Three.js 与原生 WebGL 2 的真实同场景对照

新增 [实际技术对照](renderer-comparison.md)与 `app/renderer-compare.html`。两套独立渲染器共享精细几何、变换和 GLSL 算法，原生直接提交绘制，Three.js 使用 BufferGeometry、RawShaderMaterial、WebGLRenderTarget 和 render()。另提供配置了凹凸贴图、环境反光与灯光的 MeshStandardMaterial 版本；明确内置配置的风格差异不能当作框架画质上限。

GPU 实测：两种 Three.js 配置各五个看点，共十组，输出 1105×658、两侧 RGBA16F。同算法的五组 RGB 平均差约 0.000729—0.002371／255，差值超过 2 的像素占 0.003026%—0.038647%；少量像素存在较大差异，没有宣称逐像素完全相同。另完成五个参数组合修改后的检测。结果、准确参数和原始日志见[数据档案](assets/renderer-comparison-v1/comparison-results.json)与[参数联动](assets/renderer-comparison-v1/control-check.json)。

实际完成 11 项测试、96 项原展馆检查与 79 文件构建／HTTP 哈希核对。浏览器验证两种材质模式、五个看点、参数、分界线端点和拖动、单侧观看、恢复默认；回归原实验精细模式、三角形、摄影对照及导航。验证中修正比较状态属性与按钮选择器的冲突，并增加鼠标按键状态检查，防止结束拖动后继续移动分界线。一次 DOM 取值超时后改为读取已完成的属性，不把失败操作记为成功。

保存 10 张 782×881 实际 JPEG，[图片和源码清单](assets/renderer-comparison-v1/README.md)已记录哈希。日志没有渲染 error；环境贴图预处理曾有一条驱动精度 warning，原文保留。没有进行实体移动设备、FPS、长期内存或完整上下文恢复测试。未修改 003，也未提交、推送或部署。
