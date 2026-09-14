# 素材与图片来源

## 实际使用的 CC0 纹理

| 素材 | 来源 | 使用通道 | 许可 |
| :--- | :--- | :--- | :--- |
| Brown Mud Dry | [Poly Haven](https://polyhaven.com/a/brown_mud_dry)，Rob Tuytel | Diffuse、Normal OpenGL、Roughness，各 1K JPEG | CC0 |
| Aerial Grass Rock | [Poly Haven](https://polyhaven.com/a/aerial_grass_rock) | 同上 | CC0 |

[Poly Haven 资产许可](https://polyhaven.com/license) · [实际文件、下载 URL、大小与 MD5](texture-manifest.json)

下载并逐文件核对 MD5 的日期为 2026-09-14。6 张纹理合计 4,783,758 字节。没有改变原图；场景中的颜色、法线强度和粗糙度是材质参数，不是修改源文件。

## 参考截图

`reference-mini-moto.png`：复制自 007 项目的作者原版实测截图，原地址为 [Mini Moto](https://mini-moto-park.chipchaunceytheonlyone.chatgpt.site/)。该图只说明研究来源，权利归原作者/相关权利人，具体许可待核实。未使用原作模型和地表文件。

## 本项目原创与生成内容

观光车、乘客、松树、岩石、草、建筑、道路与地形由 `app/scene.mjs` 和 `app/model.mjs` 独立构建；标牌和点粒子的透明衰减贴图由浏览器 Canvas 生成。没有调用图片生成模型，也没有把独立实现归为原作者制作方法。

本实现已有实际浏览器截图，见下方逐轮记录。完整素材讲解在 [materials.html](../app/materials.html)。


### 松树表面素材（2026-09-14）

`vegetation/` 的四张原始贴图来自 [Poly Haven Pine Tree 01](https://polyhaven.com/a/pine_tree_01)，[CC0](https://polyhaven.com/license)。原图、下载地址、字节数、MD5 记录于 `vegetation-manifest.json`。本演示使用自行生成的分枝几何与图集局部 UV，未使用完整上游树模型。图集没有被修改。资产 commit/tag：待核实。


### 户外行程实际截图（2026-09-14）

`outdoor-camp.png` 为黄昏营地；`outdoor-sunrise.png` 为山顶日出视角。均为本地 WebGL 演示实拍，不是素材站样图或实景照片。

`outdoor-refined.png`：2026-09-14 连续体验优化后的实际页面截图，进度 47%，营地休息阶段。

`forest-valley.png`：2026-09-14 扩展并优化树形、地表色斑后的实际全景截图。远树外观由浏览器在运行时渲染原有详细树形得到，未引入新的图片素材。

`outdoor-layout.png`：2026-09-14 重排布局后的实际页面截图。车道沿谷底止于停车处，折返步道通向独立日出山脊；带地点标签的动线总览采用白天光照，标线用于说明路线。

`sunrise-reveal.png`：2026-09-14 修正镜头、树冠遮挡与天空绘制顺序后的实际日出截图；进度 93.5%，日轮完整露出山脊缺口。

`shadows-noon.png`、`shadows-evening.png`：2026-09-14 同一动线总览视角下的正午/傍晚实际地面投影。远树参与太阳阴影，场景内时钟分别为 12:30、18:05。

`trail-grounded.png`、`forest-morning-light.png`：2026-09-14 本地浏览器实际截图，分别为 73.5% 正午步道近景和 97% 自动晨光。对应新增的细节观察入口；不是实景照片。

`sunrise-facing.png`：2026-09-14 修正人物观看朝向后的实际截图；97% 自动晨光，人物后侧镜头，人物与日轮同框。

`layout-workbench.png`、`layout-regenerated.png`：2026-09-14 实际浏览器截图。前者展示从低坡方案恢复远山方案后的参数与指标比较，后者展示生成的远山营地动线；两者均为虚构场景演示。


## 2026-09-14 自然环境效果记录

`effect-01-before.png` 为本轮修改前画面；`effect-01-forest.png`、`effect-02-meadow.png`、`effect-03-alpine.png` 为同一营地/时间/机位的三环境结果；`effect-03-alpine-initial.png` 保留大石过多的中间版本；`effect-04-valley.png`、`effect-05-dawn.png` 为远景及日出验证。均为实际浏览器截图，未进行图片美化；窗口尺寸有差异。配套 JSON 为页面状态或可导入方案，`effect-record-manifest.json` 为本轮源码指纹和记录索引。详见 [逐步效果记录](../effect-log.md)。

新增 Rock 2 三张 1K 贴图（颜色、OpenGL 法线、粗糙度），来自 Poly Haven/Rob Tuytel，CC0，官方物理宽度 1.5m；2026-09-14 按官方 API MD5 核对。来源和文件校验数据见 texture-manifest.json。


`effect-06-v001-before.png` 为 V001 独立运行的真实截图；`effect-06-crown-after.png`、配套 JSON 与 `effect-07-ground-after.png` 为本轮开发版实看记录。`snapshot-v001-state.json` 保存原始场景/自由镜头位置与未生成草稿；`snapshot-v001-replay.json` 为封存前固定观察点的真实状态。


`effect-08-camp-plan-a.png` / `effect-08-camp-plan-b.png`：同场地、同 15:00 光照、同总览机位的两案实际截图。`effect-08-camp-pitch-17h.png` 为西前营位 17:00 示意光照。配套 JSON 是页面实际状态。`camp-review-example.md` 提取自页面可见的评审单预览，保留实际生成时间及示例理由。所有截图均未美化。


`capabilities-page.png`：2026-09-14 网页能力汇总的实际浏览器截图，记录统一入口接入后的显示效果，未进行美化。


`capabilities-purpose.png`：2026-09-14 明确道路、地表、树木三项核心后的首屏实际截图，未美化；之前的 `capabilities-page.png` 保留作为上一版展示记录。


能力入口的三图导览复用 `natural-ground-view.png`、`effect-07-ground-after.png`、`effect-06-crown-after.png`，分别引导道路、地表和树木观察。均为此前实际记录，保留原图与当时页面界面，未重新美化；当前参数与机位可能不同。

`capabilities-effect-guide.png`：2026-09-14 三图操作导览实际浏览器截图，记录图片、观察点、操作提示与沉淀内容的网页布局。

`published-sunrise.png`：2026-09-14 GitHub Pages 公网版本实际截图，低坡营地、97% 自动晨光，未美化。`published-resource-check.json` 保存首轮上线后 32 个资源的 HTTP 状态、大小与 SHA-256。
