# 005 · 本地运行与操作

应用位于 `client/`，依赖由这个子项目单独管理。

## 启动

环境：Windows、Node.js 22.15.0、npm 10.9.2。本轮已实际安装并启动。

```powershell
cd projects/005-stick-steel/app/client
npm ci
npm run dev
```

访问 http://127.0.0.1:8055/ 。端口固定为 8055，占用时会明确报错。预览服务只监听本机。双击目录不能启动物理引擎，需要上述本地 HTTP 服务。

## 玩法

默认入口是六项能力展示。点击顶部能力按钮切换场景，按右侧“这样看效果”操作；下方控件直接驱动物理演示。每组可以重置、暂停、减速。说明详见 [能力清单](../reusable-capabilities.md)。

点击右上角“完整对战”（`?view=duel`），再选择武器，进入训练场或与机器人对战。以下快捷键用于对战：

| 操作 | 作用 |
| :--- | :--- |
| WASD / 方向键 | 前进、后退、侧绕 |
| 左键按住并拖动 | 挥动武器 |
| 右键按住并拖动 | 调整格挡 |
| Space / C | 横斩 / 下劈 |
| Shift / F | 突进 / 空手近距离推击 |
| E / 长按 E | 拾取 / 起身、攀爬 |
| G | 丢下武器或松开边缘 |
| 鼠标中键 / 滚轮 | 环视 / 缩放 |
| Q | 四分之一慢动作 |
| R | 重置当前回合 |
| Esc | 暂停、释放鼠标并打开菜单 |

菜单可以切换场地、对手武器、音量，或进入悬边练习。选择场地或武器会重置场景；“重新选择武器”回到普通对战准备状态。触屏设备显示移动摇杆和挥剑、格挡、互动按钮，尚未用真实手机测试。

## 验证与构建

在 `client/` 执行：

```powershell
npm run typecheck
npm test
npm run build
```

构建输出为 `client/dist/client/`。当前没有根 `app/build.mjs` 发布入口，避免被全仓库构建自动发布。本轮没有部署；构建目录和 `node_modules` 均由根忽略规则排除。

## 源码导航

- `client/src/Game.jsx`：中文入口、设置、教学展示、战斗状态与控制。
- `client/src/styles.css`：手绘风格布局、桌面与窄屏适配。
- `client/lib/duel/scene.ts`：物理、输入、镜头、场景和资源生命周期。
- `client/lib/duel/physics.ts`、`client/lib/rig/`：固定时间步、关节、握持、恢复与碰撞。
- `client/lib/duel/offline.ts`：明确禁用外部联机的本地适配。
- `client/public/assets/`：本地武器与声音；`client/public/fonts/`：手写字体。

[研究主页](../README.md) · [真实验证记录](../notes.md)

## 人物故事入口

访问 `http://127.0.0.1:8055/?view=stories`，或从能力页右上角进入“人物故事”。三个故事可播放、暂停、定位、切换章节、隐藏字幕和拉近镜头。详细内容和范围见 [故事说明](../stories.md)。

## MiniMax 配音

在本地 `.env.local` 配置密钥后运行 `npm run audio:generate`，生成后刷新故事页面。`npm run audio:plan` 仅检查计划，`npm run test:audio` 验证音轨排布。已生成三条配音，外部配置可通过 MINIMAX_ENV_FILE 指定，详见 [MiniMax 说明](../minimax-audio.md)。

## 人物刻画入口

启动服务后访问 `http://127.0.0.1:8055/?view=characters#zhou`。支持 `#lin`、`#zhou`、`#tang`、`#chen`；也可从人物故事页进入。四位人物演同一段 24 秒生活片段；同步对照、移除外形、暂停、拖动、三段跳转及 0.5× / 1× / 1.5×。本页采用无声表演，三个原有故事仍使用已生成的 MiniMax 音轨。见 [人物刻画说明](../characters.md)。


## GitHub Pages 发布适配

`app/build.mjs` 使用 `client/` 的 Vite 依赖构建，将静态客户端放入 `app/dist/demo/`，研究导览放入 `app/dist/index.html`，效果引导图放入 `guide-assets/`。根汇总脚本再复制到 `site/005-stick-steel/`。所有资源使用相对路径；生产版人物、故事和能力页面底部有返回研究导览的链接。

仓库根目录执行：

```powershell
npm ci --prefix projects/005-stick-steel/app/client
node scripts/build-site.mjs
node scripts/check-site.mjs
node projects/005-stick-steel/app/check.mjs
```

全站构建还需安装既有 001 项目的依赖，详见仓库部署说明。只发布静态页面、模型、音轨与截图；不复制本地配置、PCM 缓存或可选 Sites Worker。GitHub Actions 不调用 MiniMax，只验证已生成音频的摘要与时长。
