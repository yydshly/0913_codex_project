# 多项目网页部署

本仓库使用 GitHub Actions 构建并部署 GitHub Pages。导航页为 `site/index.html`，各项目使用稳定编号子路径。2026-09-13 首次发布成功，已实际检查线上页面与游戏操作。

已上线：[项目目录](https://yydshly.github.io/0913_codex_project/) · [001 研究汇总](https://yydshly.github.io/0913_codex_project/001-paperroute/research.html) · [001 独立原型](https://yydshly.github.io/0913_codex_project/001-paperroute/)。

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

工作流由 `main` 分支推送或手动运行触发，执行依赖安装、规则测试、全站构建、资源检查、artifact 上传和 Pages 部署。Pages 的构建来源设为 GitHub Actions，部署任务使用 `github-pages` environment，权限为 `pages: write` 与 `id-token: write`。

构建输出来自每次干净的 Actions checkout，包含全部已配置项目，避免只部署新项目导致旧演示丢失。本地汇总会覆盖同名文件；若删除了源码资源，应检查输出没有过期文件，正式发布以干净的 CI 构建为准。

项目资源使用相对路径，检查脚本会拒绝依赖站点根路径的本地链接。发布后验证导航、研究页、游戏、图片、模块加载和刷新，再将实际地址写入根索引。

GitHub Pages 托管静态网页；联网排行榜、账户和持久化后端需要另外实现。当前研究原型仅在页面内保存进度。

首次成功构建对应提交 `764ffe8afd53b695d4c8e26b119b99edfbec2a69`，见[运行记录](https://github.com/yydshly/0913_codex_project/actions/runs/34756435613)。15 个线上文件的 HTTP 状态和内容一致性通过检查，浏览器确认研究目录、能力图片、研究结论与一次成功投递。后续发布版本以[Actions 历史](https://github.com/yydshly/0913_codex_project/actions/workflows/pages.yml)为准；首页在线链接在上述检查后补入。

依据：[GitHub Pages 说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) · [自定义发布工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

[返回索引](../README.md) · [静态目录](../site/README.md) · [001 运行说明](../projects/001-paperroute/app/README.md)
