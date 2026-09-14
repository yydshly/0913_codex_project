# 图片、来源与生成记录

全部现有PNG/SVG以及本目录的提示词、来源和数据，已通过应用的 `library.html` 集中接入。透明合成层、用户样稿与代码底稿在页面分别说明，不能互相冒称。

## 最新位置证据（v0.7）

`location-evidence/`保存2个原始OSM园区对象及许可说明；`xian-destination-validation-v1.json`已更新为24处有坐标、15个目的地缺坐标，1处区域支持、1处靠近边界待核。点位一致性和作品状态仍pending。详见[真实位置记录](../xian-location-evidence.md)。

## 首次西安验证数据（v0.6历史）

`xian-destination-validation-v1.json`：由既有20点坐标与周边内容研究归集，含40条记录及可复算检查报告，不是新图像或已验证完成的景点库。35个目的地、4个抵达参照、1个地域；20处单源坐标、19处目的地缺坐标，独立证据一致性为pending。来源链接、来源分组、采集日期和许可待核状态逐条保留。生成方式为应用目录的 `npm run research:xian`。

## 最新接入与位置研究

- [8处景区透明素材](xian-scenic-sprites-v1.png)／[登记与哈希](xian-scenic-sprites-v1.json)／[实际提示词](xian-scenic-sprites-v1-prompt.txt)：2026-09-14内置生图成功返回，1774×887、RGBA。与此前失败请求及用户上传样图分别记录。
- [2600×1550透明景观合成层](xian-scenic-layer-v1.png)／[布局](xian-scenic-layout-v1.json)／[位置检查报告](xian-scenic-audit-v1.json)：实际素材8/8通过位置规则，但作品状态pending；图层不含背景标签，网页另层显示。见[实验记录](../scenic-material-integration.md)。

- [自动位置实验报告](xian-auto-audit-report.json)：正常合成及四类故障的实际扫描结果；使用代码色块，未验证真实景区外形。旧人工观察表不再是位置检查的必需步骤。

- [xian-scenic-user-v3.png](xian-scenic-user-v3.png)：最新用户上传的1536×1024景区横图，原样作为首页主图；[来源与哈希](xian-scenic-user-v3-source.json)。存在景区方位问题，仅作画风参考。
- [位置实验 SVG](xian-position-study.svg)／[布局 JSON](xian-position-plan.json)：8个已有来源点的代码底稿，不是 AI 景观成图。
- [空成图观察表](xian-artwork-observation-template.json)／[研究初始报告](xian-position-study-report.json)：成图尚待验收，不能将计划落点复制成已观察位置。
- [31点提示词与失败记录](xian-scenic-overview-v3-attempt.json)：此前内置两次请求失败，无新图；与用户 V3 来源分开。

详见[位置与生成研究](../position-generation-research.md)。下方为历史素材。

| 文件 | 内容与来源 |
| :--- | :--- |
| [xian-illustrated-atlas.png](xian-illustrated-atlas.png) | 用户提供的西安微缩插画，1024 × 1536；原样复制，无重生成。以西安站作抵达参照；[来源元数据](xian-illustration-source.json)，具体模型和许可待核实，地理精度未验收 |
| [xian-overview.png](xian-overview.png) / [SVG](xian-overview.svg) | 13 个高德公开地点坐标的城市与周边、城区放大关系图，共用网页 SVG 渲染器，1280 × 860；非生图或浏览器截图 |
| [xian-center.png](xian-center.png) / [SVG](xian-center.svg) | 西安中心城区展开，同一 SVG 渲染器输出，1280 × 860；[来源与计算说明](../xian-research.md) |
| [source-city-map-reference.png](source-city-map-reference.png) | 用户提供的 Wang Shuyi 帖文截图；原帖 URL、原图版本、许可待核实 |
| [tengchong-art.png](tengchong-art.png) | 本次内置 imagegen 独立生成的腾冲无文字底图，1086 × 1448 |
| [lijiang-art.png](lijiang-art.png) | 本次内置 imagegen 独立生成的丽江无文字底图，1086 × 1448 |
| [tengchong-poster.png](tengchong-poster.png) | 使用工作台相同的 paint 函数输出的腾冲海报，1800 × 2400 |
| [lijiang-poster.png](lijiang-poster.png) | 使用工作台相同的 paint 函数输出的丽江海报，1800 × 2400 |
| [generation-prompts.txt](generation-prompts.txt) | 两张底图实际使用的完整原创提示词，生成前保存 |

腾冲、丽江生成日期：2026-09-14。这两座城市各调用一次内置 imagegen，没有重试或候选筛选。实际工具未暴露可核实的模型版本，不猜测具体模型名。未调用 YouMind 或执行上游 Skill。西安此前四次内置请求失败，随后用户提供插画，本次仅原样接入，来源不混记。

两张插画均为对真实景物的艺术化重排；地标归属来源见 [实现分析](../implementation.md)。照片级还原、地图精确性和建筑细节未验证。

海报导出包含放大，1800 × 2400 是输出像素尺寸，不代表底图原生细节。海报是本项目的实际输出，不是网页运行截图。当前暂无浏览器截图。

用户参考图不视为本项目原创素材，也不作商业授权承诺。本仓库尚未为原创实现指定开源许可证。


## 西安宏观 V1 用户样本

[xian-macro-user-v1.png](xian-macro-user-v1.png) 为用户上传的宏观结果，原样保存；模型、实际提交提示词和授权范围待核实。[来源记录](xian-macro-user-v1-source.json) 保存尺寸和哈希。它用于分析全景透视与建筑密度问题，不能冒记为此前失败的内置生成结果，也不是下一轮推荐的画风参考。


## 西安宏观 V2 用户样本

[xian-macro-user-v2.png](xian-macro-user-v2.png) 为用户上传的第二张宏观插画，原样保存，[来源与哈希](xian-macro-user-v2-source.json)。画风改善，地理和文字仍待修订；[验收记录与局部修改稿](../skills/city-tourism-atlas/references/xian-v2-review.md)。模型、实际提示词与许可待核实，不作为内置工具输出。
