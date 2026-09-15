# 012 · 我们的作品馆

一座用于组织已有研究成果的独立三维展馆：三组展区、六个展台，点击近看、阅读能力、进入已发布作品并返回。

[在线双图导览](https://yydshly.github.io/0913_codex_project/012-whistlevale/research.html) · [线上实际对照](https://yydshly.github.io/0913_codex_project/012-whistlevale/renderer-compare.html) · [发布记录](../publishing.md)

[展馆布局与能力](../gallery.md) · [Whistlevale 原库研究](../README.md) · [本地预览](http://127.0.0.1:8412/)

## WebGL 2 实现实验

新增[实际技术对照](http://127.0.0.1:8412/renderer-compare.html)与[验证说明](../renderer-comparison.md)：同一精细模型由 Three.js 和原生 WebGL 2 分别绘制。Three.js 一侧可以切换内置材质／同算法自定义，检查五个看点与当前帧像素差异。对照页使用已有本地 Three.js 依赖，无新增安装步骤。

[本地实验](http://127.0.0.1:8412/webgl-lab.html) · [同机位细节对照](../webgl-detail-study.md) · [七步研究说明](../webgl2-study.md)。默认打开细节研究，可滑动比较基础／精细两套实现，分别开关结构、材料、柔影与补光。顶部可进入三角形、形体、光照、程序材质、阴影、动画与摄影七步；保留光线/昼夜/粗糙度/景深/曝光、法线和阴影深度视图。

原生实验使用 `webgl-*` 十个运行文件及共享的 `renderer-scene.mjs`，该入口没有 Three.js 运行依赖；沿用下面的服务与构建入口。入门第 02 步起几何相同；启动时准备基础与精细模型，细节开关切换已有缓冲，不是七个独立最小程序。另一个技术对照入口才导入 Three.js。已随本项目部署，线上入口见上方链接。

额外检查：`node --test webgl-math.test.mjs`，共 8 项，验证矩阵、投影边界、光源范围、新旧网格、倒角边界和比较状态不变性；不能代替浏览器着色器编译和实际效果观察。

本轮合并运行：`node --test webgl-math.test.mjs renderer-compare.test.mjs`，共 11 项，额外验证共享相机／车轮变换和像素差异指标。比较页本身不测 FPS；两个上下文同时绘制，GPU 读回也会影响耗时。

## 运行

环境：Node.js 22.15.0 已实测启动与构建；使用浏览器 WebGL 2。项目自带 Three.js r185 和 OrbitControls，运行无需 npm install，没有密钥配置。

在本目录执行：

```powershell
node serve.mjs
```

打开终端显示的 http://127.0.0.1:8412/ 。可用 PORT 环境变量指定其他端口。退出进程后本地链接不再可用。

## 操作

白鹭河谷现进入 [单展品参观样板](../valley-exhibit.md)，也可直接打开 [valley.html](http://127.0.0.1:8412/valley.html)。提供三个看点、站房揭顶/合顶、同机位春秋、暂停与全景；顶部返回作品馆。下述弹窗流程适用于其余五件作品。

- 点击展台标签、图片展板或底部作品目录：选择作品并靠近展台。
- 拖动、滚轮：环顾与缩放；“俯瞰全馆”返回总览。
- “进入作品”：打开原有已发布页面；顶部“返回展馆”关闭作品并恢复展馆。
- 作品页面加载较慢或不兼容嵌入时，使用“单独打开”。
- 来源与能力边界在每件作品下方，可展开阅读。

图片、展馆和白鹭河谷参观样板使用本地资源。其余作品及线上研究需要网络。五张截图均来自现有档案；010 使用主题缩景，没有把上游原作当作自己的截图。

启动/构建新增显式依赖：`prepare-valley.mjs` 从同仓库 003 的当前源文件准备场景到 `valley-runtime/`，不改动 003。该生成目录已忽略，不作为新源码提交；输出包含版本哈希与许可证，详见单展品记录。

## 检查与构建

```powershell
node check.mjs
node build.mjs
```

构建结果为本目录 dist/。根 scripts/build-site.mjs 会自动发现这个构建入口，在正式发布时汇总；本轮 GitHub Actions 已执行全站构建与资源检查，并新增 012 专项验证步骤。构建只收集本项目入口、模块、图片和依赖许可，不复制整个上游仓库。

检查覆盖数据、DOM 引用、相对模块、HTML 资源和语法；不表示浏览器交互或多设备画质已验收。

## 技术与来源

- 展馆、六种主题缩景、导航和能力面板：本轮独立实现。
- 组织方式参考 Whistlevale 固定提交 f3d769e8ea54d2f5a47d12f27773541b484c6302，未复制上游源码。
- Three.js r185 / OrbitControls：复用仓库 010 已有的 vendored 文件，保留 [MIT 许可](vendor/THREE-LICENSE.txt)。
- [展品截图来源](../assets/exhibits/README.md)。
- 新增作品主要修改 exhibits.mjs；新增主题缩景按需扩展 hall.mjs，不承诺任意项目的原生模型自动接入。
