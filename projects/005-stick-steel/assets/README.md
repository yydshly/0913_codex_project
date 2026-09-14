# 005 · 图片与证据

所有图片为 2026-09-14 本次浏览器捕获，未经重绘。

| 文件 | 内容 |
| :--- | :--- |
| `01-local-menu.png` | 本地中文主菜单，1280 × 720 |
| `02-local-training.png` | 本地移动教学，1280 × 720 |
| `03-local-duel.png` | 本地物理对战与慢动作，1280 × 720 |
| `04-local-mobile.png` | 本地 390 × 844 窄屏布局；不代表真实手机性能验证 |
| `05-visual-comparison.jpg` | 原作与本地同尺寸全景并置 |
| `06-ui-comparison.jpg` | 菜单、文字与武器卡片局部并置 |
| `reference/01-menu.png` | 第一轮上游 Genex 包装页主菜单 |
| `reference/02-training.png` | 第一轮上游训练场 |
| `reference/03-duel.png` | 第一轮上游悬边对战 |
| `reference/04-source-desktop.png` | 同尺寸原作游戏本体主菜单，1280 × 720 |

上游地址：https://genex.games/stick-steel 。本地图与原作图区分命名，原作图片用于研究对照。视觉比较见 [design-qa.md](../design-qa.md)。

## 能力展示截图

- `07-capabilities-pose.png`：抬手与蓝色目标圆环。
- `08-capabilities-catch.png`：接触后已握住球。
- `09-capabilities-ledge.png`：初始悬挂暂停状态。
- `10-capabilities-impact.png`：释放姿态控制后的倒下状态。
- `11-capabilities-weapon.png`：放下后重新握持武器。
- `12-capabilities-camera.png`：落球暂停后改变观察角度。
- `13-capabilities-mobile.png`：390 × 844 视口检查捕获，工具存在缩放表现；以 DOM 测量辅助确认无横向溢出。
- `14-capabilities-overview.jpg`：07–12 六张真实截图的等比拼接，顺序按能力 01–06；未重绘内容。
- `15-capabilities-comparison.jpg`：原作与新能力页面同尺寸并置，用于检查视觉语言延续。

## 人物故事截图

- `16-story-father.png`：晚年父子牵手，66 秒。
- `17-story-dinner.png`：晚饭递碗回应，31 秒，近景。
- `18-story-newcomer.png`：新人走入让出的空间，34 秒。
- `19-story-mobile.png`：390 × 844 视口的故事播放器。
- `20-story-overview.jpg`：三张故事截图并置，无重绘。
- `21-story-design-comparison.jpg`：原能力页与人物故事的等比并置，用于视觉语言检查，视口和叙事内容不同。

- `22-minimax-audio-checks.json`：最终三条音轨的实际时长、摘要、每句信号强度、峰值及本地增益，来自生成文件检查。

## 人物刻画截图

- `23-minimax-ready.png`：前一轮 MiniMax 配音就绪状态。
- `24-character-comparison.png`：1440 × 1050 视口，四位人物在第 6 秒同步对照。
- `25-character-motion-only.png`：相同视口与第 6 秒，隐藏外形并统一人物颜色，保留动作。
- `26-character-tang.png`：1440 × 1050 视口，唐悦在第 22 秒坐下并向对方挪近。
- `27-character-mobile.png`：390 × 844 视口，唐悦第 22 秒的窄屏实际效果。

以上为本地浏览器实际渲染截图，未重绘角色；浏览器截图的实际像素尺寸可能因系统显示缩放略小于请求 CSS 视口。
