# 002 · 本地能力演示

无依赖静态网页：三张商业图、六张扩展图、一次修图对照、上游原图、风格拆解与提示词交互。网页本身没有接入图像生成服务，不需要 API Key；新作品是在本次会话中通过内置 imagegen 生成后加入画廊的。

## 启动

在仓库根目录执行，使用 Node.js（已验证 v22.15.0）：

```powershell
node projects/002-dunhuang-aura/app/build.mjs
node projects/002-dunhuang-aura/app/preview.mjs
```

打开 `http://127.0.0.1:4174`。Ctrl+C 停止服务，`PORT` 环境变量可更改端口。预览仅监听本机。也可直接打开 [index.html](index.html)；复制若受浏览器权限限制，会选中文字并提示手动复制。

## 按产品特色重设计的海报

[工作台顶部](studio.html#redesign) 展示三张独立创作的 AI 宣传概念：慢光的厚涂日落、PaperRoute 的骑行投递、OpenMAIC 的轨道实验。原图为 1122 × 1402 PNG，提供原图与完整提示词；它们不是下方模板合成器生成的结果，也不等于软件实测截图。三张主要来自助手对产品特色的理解与独立设计提示词，没有严格沿用 Dunhuang Aura Skill，不能作为其增益证据。页面海报前新增常显提示及可展开的各轮制作方式、对照实验要求。

## 品牌物料工作台

运行后打开 `http://127.0.0.1:4174/studio.html`。本页使用浏览器 Canvas 合成，不依赖 AI 服务。默认案例是慢光画室，可切换 PaperRoute 研究原型与 OpenMAIC。前两者为用户此前项目的历史实测截图，第三者为上游官方样例；推广文案均为本次模拟。旧版虚构茶罐已移除。

1. 选择顶部案例载入图片、模拟文案、推荐配色和软件版式；也可上传 PNG/JPG/WebP，最大 15 MB、4000 万像素。图片仅在本机读取；透明底 PNG 更适合，JPG 保留原背景。
2. 填写品牌名称、标题和说明，切换浅矿青绿/砂岩朱砂/雾蓝简洁，调整商品大小。
3. 预览 1500 × 600、1080 × 1350、1080 × 1080 三种画布；标题与说明独立换行，超出区域时停止该尺寸导出。
4. 点击每张图的下载 PNG；若浏览器没有保存，使用打开成品后保存图片。刷新会清除上传素材。

背景为本研究新增的固定模板（山形矿物配色或简洁底色），商品图只等比缩放、不裁切或重绘。未接入自动抠图、AI 背景、品牌标识、项目保存和审批。本机字体可能影响跨设备排版。上述规格是演示设定，不代表平台最新要求。

验证布局：`node --test projects/002-dunhuang-aura/app/studio-layout.test.mjs`。

## 体验

新增 [products.html](products.html)：从当前实测结果分析品牌活动物料助手、设计提案助手和品牌规范工具。页面是产品研究说明，其中物料助手已有上述本机原型，其余方向尚未实现；运行后访问 `http://127.0.0.1:4174/products.html`。

新增 [extensions.html](extensions.html)：查看茶广告、礼盒包装、几何海报、织物配件、茶空间、出版纸品六个方向的描述与实际生成效果。启动后访问 `http://127.0.0.1:4174/extensions.html`。六张是本研究扩展规则得到的作品，不是上游内置模式。

1. 先看本次新生成的茶品牌横幅、香氛广告、中文封面及删除飘带对照。每张图附实际提示词，点击图片查看原图；上游自带样张在后方折叠参考区。
2. 切换无字横幅、单品广告、带标题封面，观察比例、数量、文字状态。
3. 输入产品与标题，切换装饰密度。
4. 编辑、复制或下载 TXT，交给外部绘图工具使用。

首页提示词表单是本研究根据上游规则编写的确定性模板，没有 AI 调用、图像编辑或生成，也不在浏览器执行 Python 检查器。更改选项只改变文字，原始样张保持不变。

浏览器实测确认三种用途切换、主体与标题输入、装饰密度和复制；390 像素窄屏下布局改为单列。TXT 下载按钮可触发请求，但当前内置浏览器没有返回下载事件，也未在预期 Downloads 路径发现文件，因此不记录下载保存成功；遇到此情况使用复制按钮。没有真机触控测试。

## 上游检查器

Python 3.10.11 已验证。`validator/` 原样保留一个脚本、三个测试文件及 MIT 许可，见 [来源说明](validator/README.md)。

```powershell
python -m unittest discover -s projects/002-dunhuang-aura/app/validator/tests -v
python projects/002-dunhuang-aura/app/validator/scripts/check_prompt.py projects/002-dunhuang-aura/app/validator/tests/valid-text-free.txt --mode text-free --ratio 5:2
```

检查自己的 TXT 时替换输入文件，按用途选择 `--mode text-free` / `--mode exact-text`，以及 `--ratio 5:2` / `--ratio 4:5`。词项齐全不等于语义无矛盾或出图合格。

## 构建与许可

`build.mjs` 生成 `app/dist/`，复制页面、样式、脚本、图片与 [上游许可](UPSTREAM-LICENSE.txt)，改写图片相对路径。根汇总脚本可自动发现本项目，复制到 `site/002-dunhuang-aura/`，所有输出均不提交。

```powershell
node scripts/build-site.mjs
node scripts/check-site.mjs
```

2026-09-14 已发布至 [GitHub Pages](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/)；[工作台](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/studio.html#generation-note)、[扩展实验](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/extensions.html) 和 [备选产品方向](https://yydshly.github.io/0913_codex_project/002-dunhuang-aura/products.html) 随站点发布。状态与验证见 [仓库部署记录](../../../docs/deployment.md)。页面与交互为本研究新增，检查器遵循上游 MIT；[图片来源](../assets/README.md)单独记录。返回 [研究汇总](../README.md)。
