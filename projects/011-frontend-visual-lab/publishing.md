# 011 · 发布范围与验证

2026-09-15，用户明确要求整理理解、描述四种优化方式与效果能力、以我们的实际效果作为引导图，并部署完整网页。

## 发布范围

- research.html：理解摘要、四种优化方式、实际效果图与操作入口。
- index.html：完整实验室，保留64项自编GSAP交互、16个Canvas UI原版组件，支持图示直达参数。
- ?view=portfolio：V4.3作品页、真实云雾/冰霜、图片详情转场、听雨山居场景手记。
- records.html、records/、research-assets/：全部项目级Markdown研究记录与全部图片档案；概念图、AI封面与运行截图分别标注。
- portfolio/、assets/、licenses/：实际素材、全部动态加载模块、第三方来源与许可。
- release-manifest.json：逐文件字节数与SHA-256清单，用于发布完整性验证。
- 项目源码和archive/局部源码留档随源码提交；历史局部文件不标成独立可运行版本。

沿用本仓库GitHub Pages，保留已有项目及003固定V23归档。发布以最新远端分支为基础，只加入011及其导航、构建和说明，避免将其他进行中的本地改动带入。

## 构建与检查

独立build.mjs构建Vite客户端并生成研究档案，根构建支持dist/client静态输出。保留模板Sites元数据与worker，但GitHub Pages只发布客户端目录，不部署服务端或新建Site。

使用npm run build、npm run test:pages验证入口参数、16个懒加载模块、实际图片、研究文档和清单哈希。全站构建与资源检查在GitHub Actions干净检出中完成；成功后复查线上每个清单文件及既有入口。

## 首次上线结果

首次部署成功：提交 d49e2b6a0bad4f82cee7543b3419aab78aab2f20，[Actions运行](https://github.com/yydshly/0913_codex_project/actions/runs/34883847417)。CI干净构建10个项目，2220处本地资源与锚点引用通过；011的188个文件、16个懒加载组件、135张图片和10份项目级研究记录全部通过检查。

[摘要与看图体验](https://yydshly.github.io/0913_codex_project/011-frontend-visual-lab/research.html) · [完整实验室](https://yydshly.github.io/0913_codex_project/011-frontend-visual-lab/) · [作品页](https://yydshly.github.io/0913_codex_project/011-frontend-visual-lab/?view=portfolio) · [完整档案](https://yydshly.github.io/0913_codex_project/011-frontend-visual-lab/records.html)。

对线上发布清单逐文件请求：188/188的字节数与SHA-256一致，18个既有入口均可访问，包括003固定V23归档、004天气、005游戏、006研究、008历史版本与010驾驶。报告见deployment-verification.json。该检查证明发布完整性，不代表重新完成所有旧项目功能测试。

子目录浏览器检查：摘要桌面布局、手机四种方式阅读、冰霜直达、完整64项交互入口通过。手机文档375/375无水平溢出；发现顶部入口文字换行过密，修正为品牌与控制在上、四个入口在下的两行导航，见135截图。本轮没有实体触屏或跨浏览器验收。

历史迭代文档中的“未部署”属于当时状态，不回写为过去已上线。后续说明与导航修正由同一工作流全站构建发布；当前版本以线上manifest及Actions为准。

