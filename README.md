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
<!-- PROJECT_INDEX_END -->

进度：`待研究` → `研究中` → `已复现` → `已总结`；暂时停止的项目标为 `暂缓`。演示未上线时填写 `—`。

## 项目预览

<!-- PROJECT_PREVIEWS_START -->
### 001 · PaperRoute

浏览器 3D 骑车送报游戏，包含投递、障碍、七日挑战与成绩展示。**对我们的价值：**观察交互效果和作品完成度；开发流程仍是原型、打磨与优化，暂未确认独有方法或可复用代码，保留为低优先级案例参考。

![001 PaperRoute 官方能力概览：任务简报、街区骑行、投递得分、追狗、每日结算与手机横屏](projects/001-paperroute/assets/04-official-gallery.jpg)

*2026-09-13 官网画廊截图；画面由上游提供，非本项目实际游玩截图。*

[研究汇总](projects/001-paperroute/README.md) · [在线研究页](https://yydshly.github.io/0913_codex_project/001-paperroute/research.html) · [试玩研究原型](https://yydshly.github.io/0913_codex_project/001-paperroute/) · [原始网页](https://www.paperroute.lol/) · [原版游戏](https://www.paperroute.lol/play/) · [实践指南](projects/001-paperroute/practical-guide.md)
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
