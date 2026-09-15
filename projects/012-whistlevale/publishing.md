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

## 已发布入口

- [双图导览与理解摘要](https://yydshly.github.io/0913_codex_project/012-whistlevale/research.html)
- [Three.js / WebGL 2 实际对照](https://yydshly.github.io/0913_codex_project/012-whistlevale/renderer-compare.html)
- [精细化开关与七步实验](https://yydshly.github.io/0913_codex_project/012-whistlevale/webgl-lab.html#detail)
- [六展台作品馆](https://yydshly.github.io/0913_codex_project/012-whistlevale/)
- [白鹭河谷单展品](https://yydshly.github.io/0913_codex_project/012-whistlevale/valley.html)

发布提交：[14a5c31](https://github.com/yydshly/0913_codex_project/commit/14a5c31d6f3ea27caf1d29de2715b41530909061)。[GitHub Actions 第 34936155948 次运行](https://github.com/yydshly/0913_codex_project/actions/runs/34936155948)的构建和部署均成功。后续文档提交只补充已验证的地址与结果，使用 `[skip ci]`；部署资源仍对应此发布提交。

## 发布后核验（2026-09-15）

- 自动发布：全站 11 个可构建项目完成构建；2487 个本地资源和锚点引用检查通过；既有项目检查继续执行，012 的 11 项测试与 97 项检查通过。
- 线上资源：012 构建清单内的 83 个文件均返回 HTTP 200，字节数和 SHA-256 与线上构建清单一致。两张引导图也与项目内原始截图逐字节一致。
- 导航抽查：总目录及 001、003、004、008、009、011 的既有入口均返回 HTTP 200；总目录包含 012 双图与导览入口。[HTTP 与哈希原始记录](assets/publishing-v1/http-verification.json)。这不代替其他项目的完整交互测试。
- 浏览器：确认线上双图显示；从导览进入实时对照，两侧画面就绪；当前站房画面读回平均 RGB 差 0.0012 / 255、最大差 143、超过阈值 2 的像素约 0.009%；切换内置材质与夜景成功。当前窗口结果独立于之前五个固定看点的基准数据。
- 单展品：本地与线上均已验证复用远端 003 版本的场景加载与站房揭顶操作；线上页面正确显示场景、启用控制，并切换到“屋顶已揭开，场景暂停”的状态。
- 文档：收尾检查根目录、项目索引和 012 文档共 422 个相对文件链接，无缺失。

范围限制：没有新增实体手机、独立 FPS、长期内存或完整上下文恢复测试。历史截图和实测清单按采集时版本保留，不改写成线上采集。

此前浏览器实测的五个看点、像素差异数据与限制见 [实际对照记录](renderer-comparison.md)。这些数值说明本轮效果可移植，不能用于推断全设备表现、FPS 或开发效率。

## 来源

上游：[nickfromlater/whistlevale](https://github.com/nickfromlater/whistlevale)，MIT，研究版本 `f3d769e8ea54d2f5a47d12f27773541b484c6302`（2026-09-13）；研究日期 2026-09-15。作者线上部署 commit 待核实。两张引导图来源分别为 `assets/01-alder-valley-overview.jpg` 和 `assets/renderer-comparison-v1/01-custom-station.jpg`，构建时按原字节复制，未合成或修改画面。
