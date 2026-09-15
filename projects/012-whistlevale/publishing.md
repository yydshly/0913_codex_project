# 012 · 发布与验证

## 发布范围

2026-09-15：整理展厅与展台、适用场景、精细化和技术选型的理解；以原作实际截图和我们实际技术对照截图作为共同入口。

- `research.html`：双图研究导览与摘要。
- `index.html`：三组展区、六个展台的作品馆。
- `valley.html`：复用 003 场景的单展品参观页。
- `webgl-lab.html`：精细化开关与七步原生绘制实验。
- `renderer-compare.html`：Three.js 与原生 WebGL 2 的实际对照。

使用现有 GitHub Pages 工作流，构建入口为 `app/build.mjs`，不新增部署平台。原作仍由作者托管；本站保留研究截图和独立实践，没有复制完整上游应用。生成的 `dist/`、`valley-runtime/` 不作为源码提交。

## 验证记录

发布准备检查（2026-09-15）：11 项数学／比较规则测试通过；97 项展馆数据、DOM、资源与语法检查通过；构建输出 83 个清单文件；012 输出内 186 个本地引用检查通过。已在浏览器确认双图显示及进入对照页面。

公开地址和 GitHub Actions 执行结果将在实际部署成功后记录。

此前浏览器实测的五个看点、像素差异数据与限制见 [实际对照记录](renderer-comparison.md)。这些数值说明本轮效果可移植，不能用于推断全设备表现、FPS 或开发效率。

## 来源

上游：[nickfromlater/whistlevale](https://github.com/nickfromlater/whistlevale)，MIT，研究版本 `f3d769e8ea54d2f5a47d12f27773541b484c6302`（2026-09-13）；研究日期 2026-09-15。作者线上部署 commit 待核实。两张引导图来源分别为 `assets/01-alder-valley-overview.jpg` 和 `assets/renderer-comparison-v1/01-custom-station.jpg`，构建时按原字节复制，未合成或修改画面。
