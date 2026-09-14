# 多项目网页部署

本仓库使用 GitHub Actions 构建并部署 GitHub Pages。导航页为 `site/index.html`，各项目使用稳定编号子路径。2026-09-13 首次发布成功，已实际检查线上页面与游戏操作。

已上线：[项目目录](https://yydshly.github.io/0913_codex_project/) · [001 研究汇总](https://yydshly.github.io/0913_codex_project/001-paperroute/research.html) · [001 独立原型](https://yydshly.github.io/0913_codex_project/001-paperroute/)。

002 已上线：[Dunhuang Aura 研究结论与后续参考价值](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/) · [实验归因与延伸设计](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/studio.html#generation-note)。

## 源码与发布输出

```text
projects/001-paperroute/app/      # 独立应用与依赖
scripts/build-site.mjs           # 按编号汇总可构建的项目
scripts/check-site.mjs           # 检查发布资源、锚点和子路径兼容性
site/
├── index.html                  # 提交的静态导航页
├── .nojekyll
└── 001-paperroute/              # 构建生成，Git 忽略
    ├── index.html              # 独立研究原型
    ├── research.html           # 能力、价值与研究结论
    ├── assets/                 # 随构建复制的真实观察截图
    └── vendor/                 # Three.js 模块与许可证
.github/workflows/pages.yml
```

应用源码保留在各自 `app/`。不提交依赖目录、完整上游仓库或重复的构建产物。研究截图原件保存在对应项目 `assets/`。

## 本地验证

仓库根目录执行：

```powershell
npm ci --prefix projects/001-paperroute/app
node --test projects/001-paperroute/app/game-state.test.mjs
node scripts/build-site.mjs
node scripts/check-site.mjs
```

各项目继续自行管理依赖。新增可发布项目时，在工作流中加入其安装与必要验证步骤；汇总脚本按编号查找 `app/build.mjs` 并复制其 `dist/`。含有 `index.html` 的构建结果才会发布，无构建入口的研究项目跳过。

## 自动发布

### 002 · Dunhuang Aura 研究归档与发布

`projects/002-dunhuang-aura/app/` 为无第三方依赖的静态演示，根构建脚本会自动执行其 `build.mjs`，汇总到 `site/002-dunhuang-aura/`。原图、样式、脚本与 MIT 许可使用相对路径随构建复制，静态导航按编号加入入口。

2026-09-14 用户授权归档、提交和发布。摘要聚焦库的美术规范与流程参考价值，研究延伸和 Skill 效果归因分别标明。本地 9 项 Node 测试、2 项上游 Python 测试、两项目构建及 139 处站内引用检查通过；首次发布成功，来源提交 `d1f6b8364e7f0013588177ba00ee7ed8ac6980b4`，见 [Actions 运行](https://github.com/yydshly/0913_codex_project/actions/runs/34769637576)。实际请求线上目录、001 两个既有页面及 002 的全部 42 个发布文件，共 45 个 URL：全部 HTTP 200；文本统一换行后与本地构建一致，图片逐字节一致。主要结论、Skill 归因提示、三张新版海报和模块均已包含。本轮没有将网页检查扩展成新的效果评测，也未声称原始 PNG 下载落盘成功。上游 Python 检查器属于研究复核与 CI 验证，不是网页运行依赖。

工作流由 `main` 分支推送或手动运行触发，执行依赖安装、规则测试、全站构建、资源检查、artifact 上传和 Pages 部署。Pages 的构建来源设为 GitHub Actions，部署任务使用 `github-pages` environment，权限为 `pages: write` 与 `id-token: write`。

构建输出来自每次干净的 Actions checkout，包含全部已配置项目，避免只部署新项目导致旧演示丢失。本地汇总会覆盖同名文件；若删除了源码资源，应检查输出没有过期文件，正式发布以干净的 CI 构建为准。

项目资源使用相对路径，检查脚本会拒绝依赖站点根路径的本地链接。发布后验证导航、研究页、游戏、图片、模块加载和刷新，再将实际地址写入根索引。

GitHub Pages 托管静态网页；联网排行榜、账户和持久化后端需要另外实现。当前研究原型仅在页面内保存进度。

首次成功构建对应提交 `764ffe8afd53b695d4c8e26b119b99edfbec2a69`，见[运行记录](https://github.com/yydshly/0913_codex_project/actions/runs/34756435613)。15 个线上文件的 HTTP 状态和内容一致性通过检查，浏览器确认研究目录、能力图片、研究结论与一次成功投递。后续发布版本以[Actions 历史](https://github.com/yydshly/0913_codex_project/actions/workflows/pages.yml)为准；首页在线链接在上述检查后补入。

依据：[GitHub Pages 说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) · [自定义发布工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

[返回索引](../README.md) · [静态目录](../site/README.md) · [001 运行说明](../projects/001-paperroute/app/README.md)

## 003 · 白鹭河谷发布补记

2026-09-14，用户要求把当前源码与效果摘要推送远端。仓库原有 main 推送工作流自动构建 003；新增其 43 项规则检查，保留 001、002 的构建与验证。干净 checkout 构建 3 个项目并通过 209 处引用检查。首次成功发布来自 b64aae801f6ae5ea4d2906cfbe91a7c2e8fb716f，见 [Actions 记录](https://github.com/yydshly/0913_codex_project/actions/runs/34818941356)。

[真实场景](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/scene.html) · [原理分析](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/index.html) · [开发记录](https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/dev-log.html)。浏览器已确认默认秋季场景生成，8 个代表 URL 返回 200，详情与编译警告见 [003 验证笔记](../projects/003-mountain-railway-diorama/notes.md)。这不表示全参数或移动端画质已经验收。


## 005 · 人物动画与交互研究发布适配

用户于 2026-09-14 授权推送远端并关联网页部署。新增 005 的 `app/build.mjs` 接入原有多项目汇总流程：研究导览为项目根页，`demo/` 为可运行的 Vite 静态客户端，`guide-assets/` 为实际效果引导图与上游 MIT 原文。总目录卡片以四人效果图进入研究导览，提供人物、配音故事与物理能力入口；演示底部可返回研究摘要和开发路线。

工作流新增 005 的依赖安装、类型检查、44 项人物/故事/物理测试及 5 项音轨测试；全站构建之后检查各路由、引导文字、三条音轨摘要/时长及发布目录不含本地配置。保留远端既有项目及其检查，不复制其他工作区未提交项目。`client/.openai/hosting.json` 仅保留原有模板兼容信息，本次发布使用现有 GitHub Pages。

首次发布提交 `c05400f6b1f7a66612c9d7184ced9611fa2d37f2`，对应 [Actions 成功记录](https://github.com/yydshly/0913_codex_project/actions/runs/34824369331)。[在线效果导览](https://yydshly.github.io/0913_codex_project/005-stick-steel/) · [人物表演](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=characters) · [配音故事](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=stories) · [物理能力](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=capabilities)。

干净工作树构建 5 个项目，295 处静态引用检查通过；005 类型检查、44 项功能测试及 5 项音轨测试通过。线上 39 个文件全部返回 HTTP 200，内容与本地构建一致（HTML/CSS/文本仅归一化 Windows 与 Linux 换行；图片、音轨与 JS 校验原始字节）。总目录与 001、002、003、010 项目页均返回 200。浏览器检查及截图见 [005 验证记录](../projects/005-stick-steel/notes.md)。Actions 出现既有 Pages action 的 Node 20 弃用提示，未阻止本次构建和部署。


## 006 · 游戏与研究导览

[在线 ARPG](https://yydshly.github.io/0913_codex_project/006-emberfall-arpg/) · [三图研究导览](https://yydshly.github.io/0913_codex_project/006-emberfall-arpg/research/) · [物理实验台介绍](https://yydshly.github.io/0913_codex_project/006-emberfall-arpg/research/physics-lab.html)。此前 Pages 运行 34824948133 已成功，2026-09-14 实际检查游戏、研究页、脚本、引擎模块及代表截图均返回 HTTP 200。

本次补齐网站目录、研究导览与可玩游戏的双向入口。006 的 `app/build.mjs` 生成游戏及 `dist/research/`，沿用现有全站构建；Python Markdown 依赖已接入工作流。物理实验台的 Windows 包仍未网络发布。
