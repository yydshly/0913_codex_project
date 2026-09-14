# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 用户已确定的展示方向（2026-09-14）

优先描述并展示可复用能力。默认入口提供能力说明与真实可交互演示，每项解释可复用部分、用途和边界；保留原对战入口。沿用米白手绘视觉，不先扩展具体行业场景，不只列效果名称或显示静态截图。

用户后续明确选择贴近人物、生活和关系的故事创作方向。故事入口以人物表演、视线、停顿、站位与生活环境表达关系；首批《父亲慢下来了》《吵架后的晚饭》《新来的同事》。提供观看、暂停、时间轴与章节，不采用胜负、闯关、任务奖励的叙事方式。明确区分新编排表演与原物理模拟能力。

用户指定人物故事配音使用 MiniMax。API Key 仅通过本地环境或 .env.local 供生成脚本使用，不放入客户端。先生成并缓存音频，观看时与故事时间轴同步；没有实际生成音频时明确显示待生成，不使用浏览器系统语音冒充 MiniMax。

用户进一步要求以真实效果展示不同人物（包括女性、老人）的刻画，并给出必要描述。人物实验采用具体的虚构人物，结合外形轮廓、动作节奏与互动习惯；提供同场景同步对照、去掉外形后的动作比较，避免只换颜色或用单一性别/年龄符号代替人物塑造。沿用现有米白手绘风格。
