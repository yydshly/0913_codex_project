# 009 GitHub Pages发布记录

2026-09-14，用户授权整理、提交远端并部署。摘要：保留原始景区微缩图鉴效果参考，以实际网页截图引导查看图稿、对比版本和阅读研究；技能沉淀暂缓，位置驱动旅游理解图作为可扩展方向。

发布沿用仓库GitHub Actions / Pages。首选导览 `009-city-landmark-map/archive.html`，完整资料 `library.html`，图稿查看为根入口。构建使用相对路径，包含素材、全部研究文档原文及来源；不会新增地图或生图能力。冻结压缩备份随Git仓库保存，未装进Pages站点。

执行009依赖安装与40项测试、项目构建及静态检查，再由全站构建保留已有项目。引导图来自本次真实浏览器截图，详情见assets/demo/README.md。实际结果见下方记录。

发布前本地验证：009的40项测试通过，项目306处静态引用检查通过；隔离发布副本全站构建9个项目，1799处本地引用无缺失。浏览器确认实际截图引导、图稿查看和版本对比入口。没有改动其他项目源码。

## 已完成发布

发布提交：`8e3678ca698d88cd03645cbd7d0df707b601f95c`。[GitHub Actions构建与部署成功](https://github.com/yydshly/0913_codex_project/actions/runs/34862251860)。发布前已合入远端003新提交，保留已有项目。

[实际演示导览](https://yydshly.github.io/0913_codex_project/009-city-landmark-map/archive.html) · [全部图稿资料](https://yydshly.github.io/0913_codex_project/009-city-landmark-map/library.html) · [西安样稿查看](https://yydshly.github.io/0913_codex_project/009-city-landmark-map/)。

部署后逐个请求009的149个发布文件，全部HTTP 200；24个PNG/SVG文件（含地图控件图标）的SHA-256与本地构建一致。19份图稿与构图、29份说明文档、27份提示词/数据/来源记录已收录。引导截图来自真实本地运行页面；线上HTTP与文件一致性检查通过，但本轮线上浏览器连接超时，未把线上视觉复核记为通过。

补充修复本地预览的SVG类型支持，已验证返回HTTP 200、正确类型及SVG内容。既有样稿仍存在地理位置问题，本次发布不代表位置、景物外形或产品方向验收通过。
