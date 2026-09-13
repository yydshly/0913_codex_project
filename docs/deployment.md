# 多项目网页演示约定

目前只初始化研究仓库，尚未发布演示或启用自动部署。

## 发布结构

GitHub Pages 每个仓库提供一个站点，可在该站点下使用不同子路径展示多个项目。它托管静态 HTML、CSS 和 JavaScript；需要持续运行的后端服务应另行部署。参见 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

本仓库预留以下目录结构；下列路径是规划示例，尚不是已上线页面：

```text
projects/001-project-slug/app/     # 第一个演示的源码与构建配置
projects/002-another-project/app/  # 第二个演示的源码与构建配置

site/                            # 将来作为 Pages 发布根目录
├── index.html                   # 演示导航页，首个演示就绪时添加
├── .nojekyll                    # 已预留，避免静态资源被 Jekyll 处理
├── 001-project-slug/             # 第一个项目构建后的静态文件
│   └── index.html
└── 002-another-project/
    └── index.html
```

默认站点根路径规划为 `https://yydshly.github.io/0913_codex_project/`，项目演示位于其下的 `001-project-slug/` 等路径。未上线前不要将这些规划地址加入首页的“在线演示”列。

## 首个演示就绪时

1. 在对应项目的 `app/` 内建立应用，记录安装、开发和构建命令。
2. 配置应用资源基路径为 `/0913_codex_project/NNN-project-slug/`，或使用经过验证的相对资源路径。
3. 将静态构建结果汇总到 `site/NNN-project-slug/`，创建 `site/index.html` 导航页。
4. 为仓库添加 GitHub Actions 发布工作流，并在 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。
5. 工作流构建需要发布的各项目，将完整 `site/` 目录上传为一个 Pages artifact，再部署到 GitHub Pages。
6. 实际检查导航、图片、资源加载和刷新页面后，将可访问的演示链接写入项目 README 与首页索引。

配置工作流时参照 [GitHub 官方自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)，按当时的环境选择 Actions 版本和应用运行时。

## 多项目维护

- 发布时必须包含所有已上线项目，避免只上传新项目导致旧演示消失。
- 每个项目独立管理依赖和构建命令，发布目录使用相同的固定编号。
- 单页应用可使用 hash 路由；使用路径路由时，必须验证 GitHub Pages 下的深层链接与刷新行为。
- 项目中的 `dist/`、`build/` 等构建目录默认忽略；可由后续工作流构建并汇总到 `site/`。
- 无静态导出能力的应用需要独立托管服务，在索引中记录其真实演示地址即可。

返回[仓库首页](../README.md)。
