# 发布与验收记录

## 发布内容与摘要

本次首次收录 008 自然环境原型，核心是沉淀道路、地表和树木的素材、生成规则、共享模块、参数与效果记录。入口新增三组真实截图和观察／操作引导，串联 8 个当前页面与 V001—V003 历史快照。参考原作与独立实现的来源、许可边界分别记录，未将本地代码描述为已核实的上游能力。

## 发布方式

使用仓库既有 GitHub Pages 工作流，部署目标路径 `008-terrain-motion-lab/`，能力导览入口 `capabilities.html`。依赖与素材均随静态包提供；运行效果需要浏览器 WebGL。历史快照直接复制发布，保持原始 SHA-256 校验。自动检查失败则不会部署新产物。

## 本轮验证

2026-09-14 本轮实际执行：

- `npm test`：62/62 通过。
- 本项目构建：8 个页面、22 个应用模块；254 处本地引用通过。
- 9 张地表与 4 张植被素材的文件大小、MD5 核对通过，总计 9.27 MiB。
- V001 / V002 / V003：103 / 110 / 123 个归档文件逐项 SHA-256 通过；Git 暂存内容共 336 个文件再次按字节核对通过。项目 `.gitattributes` 禁止封存文件换行转换。
- 完整站点构建：8 个项目及固定 V23 归档成功；全站 1470 处本地引用通过，无缺失文件与锚点。
- 浏览器实看三图导览，图片、操作说明、全部页面和历史版本入口可见，记录于 `assets/capabilities-effect-guide.png`。

## 已上线与实际复核

功能发布提交：`85480126f4681318a55572a8588fb52e58311a2d`。GitHub Actions [34859223402](https://github.com/yydshly/0913_codex_project/actions/runs/34859223402) 的构建、检查与 Pages 部署均成功。

[能力汇总与图片导览](https://yydshly.github.io/0913_codex_project/008-terrain-motion-lab/capabilities.html) · [完整山林效果](https://yydshly.github.io/0913_codex_project/008-terrain-motion-lab/outdoor.html?layout=valley&view=sunrise#stage) · [历史版本](https://yydshly.github.io/0913_codex_project/008-terrain-motion-lab/versions.html)

- 公网 32 个页面／脚本／图片／纹理／历史页面均返回 200，内容与本地发布包一致；首次并发读取遇到一次临时 503，降低并发并重试后全部通过。逐文件结果见 [公网核对记录](assets/published-resource-check.json)。
- 浏览器从能力入口进入山林日出：`ready=true`、`renderError=null`、97% 进度、日轮可见，实看树冠、山脊和人物方向；[线上实际截图](assets/published-sunrise.png)。
- 公网 V002 独立入口：`ready=true`、`renderError=null`、97% 进度、日轮可见。V001/V003 的页面与资源路径完成自动检查，未宣称本轮逐一进行完整交互验收。
- 入口三图在网页中显示正常；仓库索引与项目说明补上经验证的在线地址。历史快照内“本地／未部署”等旧文案属于封存时的记录，保持原样。

以上不代表全面视觉验收、移动设备或性能基准。
