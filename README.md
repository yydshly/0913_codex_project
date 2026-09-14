<p align="center">
  <img src="assets/images/research-hub.svg" alt="GitHub Research Hub · 开源项目研究与实践" width="100%">
</p>

# 开源项目研究与实践

记录日常在 GitHub、X 等渠道发现的项目与开发案例：从理解能力、运行体验，到源码研究、实践改造，形成可检索的研究档案。项目的开源状态、许可证和可复现程度逐项核实。

首页提供**摘要、顺序索引、项目图片和演示入口**；完整笔记、代码与运行说明保存在各子项目中。

[项目索引](#项目索引) · [项目预览](#项目预览) · [在线目录](https://yydshly.github.io/0913_codex_project/) · [新增项目指南](docs/adding-projects.md) · [研究模板](templates/project/README.md) · [网页演示说明](docs/deployment.md)

## 项目索引

按固定三位编号升序排列，从 `001` 开始。编号分配后保留，目录、研究标题、截图说明及演示路径使用同一编号。

<!-- PROJECT_INDEX_START -->
| 编号 | 研究项目 | 摘要 / 关注点 | 原始网页 | 进度 | 在线演示 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 001 | [PaperRoute](projects/001-paperroute/README.md) | 浏览器 3D 送报、障碍反馈与七日进程；AI 辅助常规迭代案例，可复用技术价值有限 | [PaperRoute 官网](https://www.paperroute.lol/) | 已总结 | [研究汇总](https://yydshly.github.io/0913_codex_project/001-paperroute/research.html) · [研究原型](https://yydshly.github.io/0913_codex_project/001-paperroute/) |
| 002 | [Dunhuang Aura](projects/002-dunhuang-aura/README.md) | 敦煌美术风格与出图流程说明书；可复用配色、构图、提示词和修图要求，未新增绘图能力，质量与效率增益未验证 | [govin-ai/dunhuang-aura-skill](https://github.com/govin-ai/dunhuang-aura-skill) | 已总结 | [研究结论与参考价值](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/) |
| 003 | [Mountain Railway Diorama](projects/003-mountain-railway-diorama/README.md) | 山间铁路微缩景观研究；“白鹭河谷”四季微缩景观，新增花瓣、落叶、夏夜萤火，支持地形编辑、风与植被联动、溪谷与浅湾构图、树冠与冬季枝形、地表分区配色、短草与树下落叶、空地与山后细节、连续坡脚与贴坡露岩、铁路净空与水石遮挡、跌水流纹与落点同步、四季光线匹配和三种水流模式，附原理分析 | [iamtechartist/mountain-railway-diorama](https://github.com/iamtechartist/mountain-railway-diorama) | 已总结 | — |
<!-- PROJECT_INDEX_END -->

进度：`待研究` → `研究中` → `已复现` → `已总结`；暂时停止的项目标为 `暂缓`。演示未上线时填写 `—`。

## 项目预览

<!-- PROJECT_PREVIEWS_START -->
### 001 · PaperRoute

浏览器 3D 骑车送报游戏，包含投递、障碍、七日挑战与成绩展示。**对我们的价值：**观察交互效果和作品完成度；开发流程仍是原型、打磨与优化，暂未确认独有方法或可复用代码，保留为低优先级案例参考。

![001 PaperRoute 官方能力概览：任务简报、街区骑行、投递得分、追狗、每日结算与手机横屏](projects/001-paperroute/assets/04-official-gallery.jpg)

*2026-09-13 官网画廊截图；画面由上游提供，非本项目实际游玩截图。*

[研究汇总](projects/001-paperroute/README.md) · [在线研究页](https://yydshly.github.io/0913_codex_project/001-paperroute/research.html) · [试玩研究原型](https://yydshly.github.io/0913_codex_project/001-paperroute/) · [原始网页](https://www.paperroute.lol/) · [原版游戏](https://www.paperroute.lol/play/) · [实践指南](projects/001-paperroute/practical-guide.md)
### 002 · Dunhuang Aura

**本质是敦煌主题的美术指导与制作流程，不是绘图模型。** 后续可参考它如何整理配色、构图、文字限制和修改保留项，作为特定风格任务的说明模板。技术创新较低，质量与效率增益未验证；暂作为美术规范和提示词组织参考归档，不继续扩展。

![002 Dunhuang Aura 本次生成效果：左侧彩陶瓶、右侧茶叶罐和茶杯，中央水面与洞窟形成景深](projects/002-dunhuang-aura/assets/generated-tea-panorama.png)

*本次依据上游规则调用 imagegen 生成，1983 × 793，约 5:2。子项目另附香氛广告、中文标题封面和删除飘带的修图对照；未做同模型有无 Skill 的评测。*

[在线研究结论](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/) · [完整研究](projects/002-dunhuang-aura/README.md) · [实验与延伸设计](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/studio.html#generation-note) · [原始仓库](https://github.com/govin-ai/dunhuang-aura-skill)
### 003 · Mountain Railway Diorama

研究程序化几何、路径运动、Shader、灯光和运镜如何协同。**新增实践：**以景区观景展示为用途，重建“白鹭河谷”，直接编辑地形与河道，比较四季树冠、地表、水体和光照，并观察风的联动；提供连续跌水、浅滩缓流、岩间分流三种水体模式，支持水层、白沫、水雾、倒影和水纹独立精调，新增层峦溪谷、疏林浅湾构图及四季光线匹配，保留原有河谷、固定观察机位与开发记录；保留五步搭建与原理分析。已修复岸石侵入轨道及固定水束与实际石块不匹配的问题，补充跌水加速流纹、小幅起伏与白沫落点同步。

![003 白鹭河谷第十五版：山后连续坡脚与贴坡露岩](projects/003-mountain-railway-diorama/assets/scene-v15-ridge-back-summer.jpg)

*2026-09-14 本研究独立重建场景的本地截图；原作截图与版本证据见子项目，网页尚未部署。*

[能力基线](projects/003-mountain-railway-diorama/capabilities.md) · [完整研究](projects/003-mountain-railway-diorama/README.md) · [真实场景与分析页运行说明](projects/003-mountain-railway-diorama/app/README.md) · [开发与优化记录](projects/003-mountain-railway-diorama/development-log.md) · [技术与验证记录](projects/003-mountain-railway-diorama/notes.md) · [扩展方向](projects/003-mountain-railway-diorama/extensions.md) · [上游官方演示](https://iamtechartist.github.io/mountain-railway-diorama/) · [原始仓库](https://github.com/iamtechartist/mountain-railway-diorama)

<!-- PROJECT_PREVIEWS_END -->

## 仓库结构

```text
.
├── README.md                 # 对外总览：摘要、索引、项目预览
├── projects/                 # 研究子项目：001-slug、002-slug……
├── templates/project/        # 可复制的研究模板、图片与应用目录
├── assets/images/            # 首页公共图片
├── docs/                     # 收录规范与部署说明
└── site/                     # GitHub Pages 导航与构建输出目录
```

## 使用方式

1. 选定一个原始网页或仓库，按[新增项目指南](docs/adding-projects.md)分配编号并复制模板。
2. 在子项目中记录研究目标、上游版本、运行步骤、截图与结论。
3. 更新本页对应的索引行和预览卡片，保持编号升序。
4. 有可展示的网页时，再按[部署说明](docs/deployment.md)添加演示入口。

## 来源与使用说明

每个子项目单独记录原始仓库、作者、许可证及研究使用的版本。第三方代码和素材遵循原项目许可证；本仓库目前未为原创内容指定开源许可证。
