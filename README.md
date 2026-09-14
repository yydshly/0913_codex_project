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
| 003 | [Mountain Railway Diorama · 白鹭河谷](projects/003-mountain-railway-diorama/README.md) | 从原作研究到可调场景：三种构图、四季光线、风与植被联动、三种水流与方案保存/比较；附实景、能力边界和开发记录 | [iamtechartist/mountain-railway-diorama](https://github.com/iamtechartist/mountain-railway-diorama) | 已总结 | [研究分析](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/) · [实际场景](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/scene.html) · [开发过程](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/dev-log.html) |
| 007 | [Mini Moto — Pine Ridge Park](projects/007-mini-moto-park/README.md) | 迷你越野摩托公园；已定位并体验原作，参考赛道与比赛联动、跟随镜头和车手能力；源码许可待核实 | [作者原帖](https://x.com/chrisjdimarco/status/2098919328368197682) | 已总结 | — |
| 010 | [Mini Moto 赛车游戏参考与实践总结](projects/010-mini-moto-comparison/README.md) | 赛车类游戏参考：核心为场景构建与赛车手能力构建；保留基础竞速和驾驶演示，后续按项目需求开发 | [作者原作](https://mini-moto-park.chipchaunceytheonlyone.chatgpt.site/) | 已总结 | — |
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
### 003 · Mountain Railway Diorama / 白鹭河谷

研究山间铁路微缩景观，并独立重建可调地形的“白鹭河谷”。**可以看什么：**三种构图、春夏秋冬、风与植被联动，以及连续跌水、浅滩缓流、岩间分流。**研究价值：**观察地形、植被、水体与光照如何共同构成场景；当前支持方案保存、恢复、文件迁移与同机位比较，仍未提供自由绘轨或真实流体模拟。

[![003 白鹭河谷当前实景：秋季溪谷、环线列车、拱桥与连续跌水](projects/003-mountain-railway-diorama/assets/b1-review-overview.jpg)](projects/003-mountain-railway-diorama/README.md)

*本研究独立重建的 V17 基线实景，2026-09-14 本地浏览器截图；点击图片进入研究与效果导览。*

[研究分析](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/) · [实际场景](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/scene.html) · [开发过程](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/dev-log.html) · [看效果与操作导览](projects/003-mountain-railway-diorama/README.md) · [查当前能力](projects/003-mountain-railway-diorama/capabilities.md) · [本地运行](projects/003-mountain-railway-diorama/app/README.md) · [开发记录](projects/003-mountain-railway-diorama/development-log.md) · [后续路线](projects/003-mountain-railway-diorama/next-steps.md) · [上游原作演示](https://iamtechartist.github.io/mountain-railway-diorama/)

### 007 · Mini Moto — Pine Ridge Park

已找到截图对应原作并验证自主比赛、头盔镜头与驾驶权切换。参考可编辑赛道、车手能力取舍和场景运镜；公开源码及许可证待核实，尚未本地复现。

![007 Mini Moto 原版实测：头盔视角、土路与轮胎护栏](projects/007-mini-moto-park/assets/02-live-helmet-camera.png)

*2026-09-14 作者线上演示实测截图，非本仓库重建。*

[完整研究](projects/007-mini-moto-park/README.md) · [技术与验证](projects/007-mini-moto-park/notes.md) · [作者原版](https://mini-moto-park.chipchaunceytheonlyone.chatgpt.site/) · [原帖](https://x.com/chrisjdimarco/status/2098919328368197682)

### 010 · Mini Moto 赛车游戏参考与实践总结

[![010 引导图：Mini Moto 原作游戏全景、越野赛道、摩托车手和竞赛排名](projects/010-mini-moto-comparison/assets/mini-moto-game-overview.png)](projects/010-mini-moto-comparison/README.md)

**赛车类游戏参考，核心是场景构建和赛车手能力构建。** 场景提供路线、地形和路面选择，车手能力连接主体表现、驾驶操作、参数与反馈。基础演示已验证；研究已总结，后续按具体项目需求开发，当前不是成熟赛车框架。

*2026-09-14 原作游戏实测效果图，来自 007 来源档案；非 010 重建画面。上游源码与许可待核实。*

[研究总结](projects/010-mini-moto-comparison/README.md) · [运行与操作](projects/010-mini-moto-comparison/app/README.md) · [原作对比](projects/010-mini-moto-comparison/comparison.md) · [实现与验证](projects/010-mini-moto-comparison/notes.md)

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
