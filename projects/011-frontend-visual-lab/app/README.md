# 011 · 视觉实验室运行与操作

## 运行

已在 Windows、Node.js v22.15.0、npm 10.9.2 下验证。

```powershell
cd projects/011-frontend-visual-lab/app
npm ci
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4311 --strictPort
```

打开 http://127.0.0.1:4311/ 。当前会话已启动该本地服务。`npm run dev` 使用 Vite 默认端口；Windows 下传递额外启动参数建议使用上面的直接入口。

```powershell
npm run build
```

构建输出为 `dist/client/`；相对资源基路径适配静态子目录。模板同时保留 `dist/server/index.js` 和 Sites 元数据，GitHub Pages发布使用客户端目录，已接入根目录汇总；不注册或部署Site。research.html为摘要，records.html为完整档案，release-manifest.json用于逐文件核验。

## 操作

- 左侧四阶段切换；“前后对照”显示基础和当前两个可独立滚动的页面。
- GSAP 阶段：重播入场；点击阅读本期；在样页内滚动，观察固定段落中的进度与连续转场。
- Canvas UI 阶段：十六种组件分组选择（新增 4 / 氛围 6 / 经典 6）、每种两项原生参数、参数重置、特效开关。
- 默认展示 GSAP 粒子星云，顶部默认显示本轮新增 10 项，“全部交互 · 64”可访问完整列表；预览上方可选粒子星云、雨幕视窗、胶片走带、折叠地图、航线连接、陀螺仪、莫比乌斯环、弹珠弹跳、字母换位、流光边框、极光丝带、蜂巢拼合、火花迸发、液滴融合、齿轮咬合、折纸飞行、镜头光圈、弧形菜单、花瓣绽放、牛顿摆、沙漏计时、弹簧振子、波浪旗帜、日食对齐、景深对焦、滚动诗句、立体书本、等距阶梯、扫描成像、罗盘转向、翻页日历、雷达扫描、拉链开幕、点阵标牌、纸带扭转、彗星巡航、线稿描绘、透视长廊、万花镜、形状变奏、轨道星系、手风琴画廊、昼夜切换、立体方块、声波律动、弹性网格、折扇展开、像素拼图、擦除对比、同心波纹、环形文字、聚光探索、立体折页、数字翻牌、百叶切换、路径巡游、层叠轮播、拖拽回弹、弹性按压、圆形揭幕、磁吸、倾斜、解码和翻牌，点击“演示一次”自动演示当前交互。点击翻牌支持 Enter / 空格键，触屏可通过点击操作。
- 进入 Canvas UI 阶段后可选字符雨；新增组还有鼠标融霜、火焰边框和悬浮蜂窝。氛围组保留能量护盾、水波等上一轮六种效果。组件按需加载。
- 收藏按钮即时切换，状态只存在本次页面中；刷新后恢复。
- 桌面/手机图标调整预览宽度；手机上点右上角调节图标打开控制面板。
- 页面遵循系统“减少动态效果”；该模式下停止 GSAP 和 Canvas UI，而不是强制播放。

## 源码入口

- `src/lab.jsx`：控制面板、同内容样页、GSAP 时间线、功能探测、Canvas UI 接入。
- `src/interactions.jsx`：六十四种 GSAP 交互、双面封面、键盘操作和动画清理。
- `src/extra-studies.jsx`：昼夜、方块、声波、弹性网格、折扇、拼图、擦除对比、同心波纹、环形文字，独立管理控件与动画清理。
- `src/shape-studies.jsx`：线稿、透视长廊、万花镜、形状变奏、轨道星系和手风琴画廊。
- `src/motion-studies.jsx`：点阵标牌、纸带扭转与彗星巡航。
- `src/sequence-studies.jsx`：翻页日历、雷达扫描与拉链开幕。
- `src/collection-catalogue.js`：第十五批 12 项交互名称与说明。
- `src/collection-studies.jsx`：第十五批 12 项交互的按需加载实现。
- `src/atelier-catalogue.js`：第十六批 8 项交互名称与说明。
- `src/atelier-studies.jsx`：第十六批 8 项交互的按需加载实现。
- `src/journey-catalogue.js`：本轮 10 项交互名称与说明。
- `src/journey-studies.jsx`：本轮 10 项交互的按需加载实现。
- `src/lab.css`：工作台、两种排版与响应式布局。
- `src/vendor/`：固定版本 Canvas UI 原版文件、许可证及哈希记录。
- `scripts/fetch-canvas-ui.py`：按固定 commit 重新获取实际使用的组件及相对依赖，需要 Python 3.10+ 和网络。
- `public/licenses/`：构建时一起发布的来源与许可说明。

完整 HTML 特效需要浏览器实验性能力。本地当前只有叠加效果；对无法运行的粒子重组、页面破碎，保留普通页面并明确说明。不要将普通降级页面称为完整效果复现。

拖拽通过 Draggable 限制在 x ±18px / y ±22px 内，松开回弹；方向键推动，Enter 演示。总开关关闭、切换交互时清理事件和临时样式。

本轮补充：左侧可按中英文名称或关键词搜索全部 80 项效果；顶部“重置实验”恢复初始阶段、效果参数、速度、样页临时收藏和预览方式，保留交互效果收藏。路径运动参考 [MotionPath 官方文档](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/)，版本随 GSAP 3.15.0 固定。

新增浏览方式：可按“本轮新增 / 全部交互 / 我的收藏”筛选 GSAP 交互；上一种、下一种只在当前列表内循环。交互收藏保存在当前浏览器本地，刷新和重置实验均保留；通过“取消收藏当前效果”移除。样页中的“收藏本期”仍只是临时按钮演示，两者互不影响。

## 个人作品实际场景

在现有本地地址后加 `?view=portfolio`，或点击实验室顶部“实际场景”。实现位于 `src/portfolio.jsx`、`src/portfolio-data.js`、`src/portfolio.css`，截图副本位于 `public/portfolio/`；内容与验证见 [场景说明](../product-scenario.md)。页面按需加载，与原实验室入口分开。

