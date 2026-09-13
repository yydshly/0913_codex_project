# 002 · 图片与素材来源

| 文件 | 来源与日期 | 用途与边界 |
| :--- | :--- | :--- |
| [upstream-dunhuang-panorama.png](upstream-dunhuang-panorama.png) | 上游 `assets/example-5x2-text-free.png`，2026-09-13 获取，commit `4b8ff65b99729a002072108467ae5b3f99fed939` | 原始 1983 × 793 PNG，用于预览和效果说明；未修改像素，非本研究生成或复现 |
| [local-demo-home.jpg](local-demo-home.jpg) | 2026-09-13，本机预览的内置浏览器截图，约 676 × 879 视口 | 本研究网页首屏实拍；其中展示的绘图作品仍属于上游样张 |
| [local-prompt-workbench.jpg](local-prompt-workbench.jpg) | 同日本机预览，单品广告 / 茶叶罐 / 丰富装饰 | 确定性提示词交互演示截图，没有生成新图片 |
| [generated-tea-panorama.png](generated-tea-panorama.png) | 2026-09-13 内置 imagegen，文生图 | 本次生成，1983 × 793；茶品牌无字横幅 |
| [generated-fragrance-portrait.png](generated-fragrance-portrait.png) | 同日内置 imagegen，文生图 | 本次生成，1122 × 1402；无字香氛广告 |
| [generated-exhibition-cover.png](generated-exhibition-cover.png) | 同日内置 imagegen，文生图 | 本次生成，1983 × 793；千年壁色中文封面，无后期排字 |
| [edited-fragrance-no-ribbon.png](edited-fragrance-no-ribbon.png) | 同日内置 imagegen，以香氛广告为编辑目标 | 本次编辑，1122 × 1402；删除红色飘带 |
| [extension-light-tea.png](extension-light-tea.png) | 2026-09-13 内置 imagegen，文生图 | 本次扩展，1536 × 1024；清淡青绿茶广告 |
| [extension-mural-packaging.png](extension-mural-packaging.png) | 同日内置 imagegen，文生图 | 本次扩展，1536 × 1024；平面壁画礼盒包装概念 |
| [extension-caisson-poster.png](extension-caisson-poster.png) | 同日内置 imagegen，文生图 | 本次扩展，1122 × 1402；藻井几何海报 |
| [extension-textile-accessories.png](extension-textile-accessories.png) | 同日内置 imagegen，第二批文生图 | 1536 × 1024；丝巾与帆布手提袋概念 |
| [extension-tea-interior.png](extension-tea-interior.png) | 同日内置 imagegen，第二批文生图 | 1536 × 1024；现代茶空间概念，非真实店铺照片 |
| [extension-editorial-stationery.png](extension-editorial-stationery.png) | 同日内置 imagegen，第二批文生图 | 1536 × 1024；壁上山河艺术书与纸品概念 |

[上游固定图片来源](https://github.com/govin-ai/dunhuang-aura-skill/blob/4b8ff65b99729a002072108467ae5b3f99fed939/assets/example-5x2-text-free.png)。上游仓库 MIT，保留 [原始 LICENSE](../app/UPSTREAM-LICENSE.txt)。没有将样张冒充同模型对照实验或表单的实时输出。

两张本地截图已检查实际文件头为 JPEG，使用 `.jpg` 扩展名。截图只记录当前界面，不代表已完成图像生成、下载或所有设备测试。

两张本地截图记录的是加入新生成画廊之前的旧版页面。四张新作品均保留工具原始输出，未裁切、缩放或加字；与上游 MIT 素材分别标记。完整提示词及观察见 [实际生成实验](../experiments/README.md)。

新增三张扩展样图同样保留首轮原始输出，无参考图、无后期处理。详见 [扩展方向与观察](../experiments/extensions.md)。


## 三个用户历史产品案例 · 2026-09-13

为品牌物料工作台新增三份既有图片，全部原样复制，无生成式重绘。它们用于模拟推广制作，不证明正式活动、官方背书、付费需求或当前版本效果。复制来源、读取时 checkout 与 SHA-256 见 [记录](../experiments/product-case-record.json)。

| 素材 | 来源与边界 |
| :--- | :--- |
| [慢光画室](case-slowlight-studio.png) | 用户的慢光项目 `artifacts/m2/delivery/sunset-guided.png`，历史 M2 实测截图，1440 × 900；可见旅行日落引导、画作和颜料。不引用用户私人照片；项目整体许可证待核实。 |
| [PaperRoute 研究原型](case-paperroute-gameplay.jpg) | 从 [001 发布实测](../../001-paperroute/assets/README.md) 复制 `09-published-gameplay.jpg`，1280 × 720；属于本仓库独立游戏原型，不是上游原版或官方广告。 |
| [OpenMAIC 课堂](case-openmaic-classroom.png) | 用户此前研究项目保留的 THU-MAIC 官方太阳系样例，2142 × 1204。上游固定版本 `d5be3933176247feebf4007f6e31e20b93871609` 的 `assets/interactive_mode/desktop_interactive.png`；[来源](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/assets/interactive_mode/desktop_interactive.png)，MIT，保留 [许可](../app/OPENMAIC-LICENSE.txt)。这是官方样例，非本次实测，也不是此前本地欧姆定律案例截图。 |

三个案例的活动任务、标题与引导语为本次模拟拟写。PNG 中保留模拟推广及素材类别标记。未发布推广内容或联系任何第三方。


## 按产品特色重设计 · V2

2026-09-13 使用内置 imagegen，分别以本目录三张历史产品画面作参考，一次生成三张独立的 4:5 宣传概念海报，各为 1122 × 1402。未做后期加字、裁切或修图；每张均保留概念图声明。

| 文件 | 设计意图 | 提示词 |
| :--- | :--- | :--- |
| [慢光](redesign-slowlight-v2.png) | 厚涂颜料、日落与画笔，突出绘画感受 | [完整提示词](../experiments/redesign-slowlight-v2.txt) |
| [PaperRoute](redesign-paperroute-v2.png) | 报纸刊头、骑行投递与低多边形街区 | [完整提示词](../experiments/redesign-paperroute-v2.txt) |
| [OpenMAIC](redesign-openmaic-v2.png) | 深蓝轨道实验、观察/提问/验证，突出学习交互 | [完整提示词](../experiments/redesign-openmaic-v2.txt) |

这些是 AI 重新创作的宣传图，不是原产品当前可生成的画面或实测截图，不保证保真还原角色、画作或界面。OpenMAIC 图中人物、图形标识和装饰星体为生成内容，不认定为官方视觉规范或精确天文模型。PaperRoute 与 OpenMAIC 自行增加了少量装饰文案，未完全遵循只使用指定文字的约束；主要标题和概念声明经目视检查可读。具体模型版本与 seed 未提供，生成文件、尺寸与哈希见 [记录](../experiments/product-redesign-v2.json)。
