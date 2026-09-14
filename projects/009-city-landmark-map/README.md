# 009 · 城景工坊 / 城市景点汇总 Skill

城市景点汇总 Skill：收集城市及周边值得去的景点，以景区图鉴的方式展示景点特色、简要介绍和大体位置，帮助用户直观了解与探索城市。

**当前为研究原型，后期需要优化实现。** 以最初腾冲／丽江原图为效果参考，已有西安样稿、景点资料和技能草稿。后续重点是景点收集与筛选、位置准确性、图像效果和可复用的生成流程。既有阶段备份与历史记录保留，本次仅调整产品摘要。

[资料总览与方向备忘](archive-summary.md) · [备份与恢复](backups/README.md) · [历史研究记录](notes.md) · [本地运行](app/README.md)

## 实际演示与操作引导

![实际网页截图：西安样稿与图稿查看控件](assets/demo/01-xian-demo.png)

本地实际运行截图，非AI生成的网页示意。先从图稿查看页看全图、放大和保存，再进入全部图稿资料页比较V1/V2/V3；参考原图与技术实验分别保留。已通过GitHub Pages发布：[实际演示导览](https://yydshly.github.io/0913_codex_project/009-city-landmark-map/archive.html) · [全部图稿资料](https://yydshly.github.io/0913_codex_project/009-city-landmark-map/library.html)。结果见[发布记录](publishing.md)。

## 效果参考

![最初的腾冲与丽江景区微缩插画参考截图](assets/source-city-map-reference.png)

景区为主体，名称和短看点辅助阅读，关注大体位置。用户提供的原始截图为效果参考；具体作者版本和使用许可待核实。西安多轮样稿及代码实验保留为过程资料，尚未达到最终验收标准。

## 后续优化方向

从全球任意城市、车站或具体位置出发，汇总有真实游览价值的周边目的地，按地理依据组织景区微缩总览图片，让初访者建立方向感与探索兴趣。真实地图用于细节查看。西安作为研究样本；全球自动流程尚未实现。

候选实现路线为地点与来源采集、坐标及范围核对、代码构图、图生图或景观素材生成、受控合成与结果检查。自动位置检查已有局部实验，实际景观外形与整体美术效果仍未解决。详见[阶段备忘](archive-summary.md)。

## 资料索引

| 分类 | 入口 |
| --- | --- |
| 原图、生成图、用户样稿、提示词及来源 | [素材与来源](assets/README.md) |
| 西安周边景区收录理由 | [周边目的地](xian-weekend-destinations.md) · [内容研究](xian-content-inventory.md) |
| 40条地点及地域记录 | [完整数据与校验报告](assets/xian-destination-validation-v1.json) |
| 地理位置研究 | [真实证据](xian-location-evidence.md) · [产品验证基线](xian-product-validation.md) |
| 生成及合成实验 | [8处素材实验](scenic-material-integration.md) · [自动位置检查](automatic-position-audit.md) |
| 原始能力与其他场景 | [实现分析](implementation.md) · [扩展研究](extension-research.md) |
| 历史目标与技能草稿 | [历史目标](skill-objective.md) · [冻结v0.7草稿](skills/city-tourism-atlas/SKILL.md) |

当前40条记录包含35个目的地、4个抵达参照、1个地域；24处有来源坐标、15个目的地缺坐标。动物园获得另一来源园区的区域支持，影视城靠近边界待核。8处生成素材通过合成位置检查，但不证明地理来源及外形真实。

## 上游与版本

| 项目 | 记录 |
| --- | --- |
| 公开相关线索 | [nano banana 画城市 · YouMind](https://youmind.com/skills/yhbukK6TtKX0t9) |
| 公开作者 | Shuyi Wang；未确认就是截图中“老范”的原版本 |
| 上游仓库、commit/tag与许可证 | 待核实；未找到可确认的原始GitHub仓库，未复现上游 |
| 记录日期 | 2026-09-14 |
| 来源元数据 | [原始元数据与指令哈希](source-metadata.json) |
| 本项目实现 | 独立研究应用、绘图与校验代码；冻结项目内技能草稿v0.7 |
| 部署状态 | GitHub Pages已部署并验证；149个在线文件可访问，图片哈希一致 |

## 回看与恢复

应用提供项目介绍页 `archive.html`、西安样稿首页、历史研究页 `research.html`、地点详情 `map.html` 和腾冲／丽江工作台 `studio.html`。

在仓库根目录运行 `node projects/009-city-landmark-map/app/serve.mjs` 后，可打开本地 `http://127.0.0.1:4309/archive.html`。静态预览需要Node；完整测试和研究脚本需要按[应用说明](app/README.md)恢复依赖。

备份压缩包包含资料、素材、源码与依赖清单，附逐文件SHA256清单；排除安装依赖、缓存及构建输出，见[备份说明](backups/README.md)。整理前README原文保留为[历史文本](archive/README-before-pause-20260914.txt)。

[返回仓库索引](../../README.md) · [全部项目](../README.md)
