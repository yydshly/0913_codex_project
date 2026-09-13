# 静态演示发布目录

此目录汇总 GitHub Pages 导航与多个研究项目的静态网页输出。`index.html` 为导航源码，各 `NNN-project-slug/` 由构建生成，生成目录不提交。

当前配置项目为 `001-paperroute`，包含研究汇总和独立可玩原型。能力展示图引用该项目真实的官网画廊截图，原图存放在项目 `assets/`。应用源码保存在 `projects/NNN-project-slug/app/`。

仓库根目录运行 `node scripts/build-site.mjs` 后，使用 `node scripts/check-site.mjs` 检查发布资源。依赖安装、自动发布与实际上线状态见[部署说明](../docs/deployment.md)。
