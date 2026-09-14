# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 用户反馈 · 2026-09-15

以当前个人作品页为具体优化目标，将研究过的技巧直接应用到页面，让用户观察结果；每轮保存优化前后的画面，并记录技巧、位置、行为变化、验证与边界。不要把需求替换成继续堆效果数量，或先搭建大而全的效果切换控制台。

## 整体视觉优化反馈 · 2026-09-15

用户授权直接按设计判断优化整个作品页，要求不仅增加动画，也提升静态构图、字体、配色、图片比例和信息层级。持续保存上一版源码和前后截图，不将新版描述为已经证明的“最佳”或业务指标提升。

## Product Design 与 Canvas UI · 2026-09-15

用户确认要完整体验 Product Design 的三套视觉探索、选择后落地，并指出作品页尚未接入 Canvas UI。三张显示顺序与对应文件见 ../product-design-options.md，等待选择。后续保留真实项目素材，将合适的 Canvas UI 原版组件实际用于作品页并验证；静态概念图、CSS 磨砂和真实组件运行必须区分记录。


## 已选择方案 · 2026-09-15

用户已确认第二张深色沉浸方案（assets/97-product-design-immersive.png），已实现 V4 并接入原版 Clouds。单独云雾开关用于观察真实叠加；首屏生成封面与原始截图必须持续明确区分。后续不再询问选择哪套方案。


## 场景对应效果 · 2026-09-15

用户确认听雨山居接入真实 Frost 冰霜，已实现 V4.1。保留白鹭河谷 Clouds、听雨山居 Frost、人物原始画面；独立开关用于对照，标题与按钮不纳入冰霜层。按实际运行画面继续记录，不能把覆盖层解释为原项目结冰物理。

## 详情连续转场 · 2026-09-15

用户确认继续将作品图片连贯展开到详情并在关闭时返回，已实现 V4.2。保留真实图来源，铁路 AI 封面不作为真实详情转场源；保持关闭后阅读位置和键盘焦点恢复。来源不可见或已移除时允许渐显回退，关闭动效后所有功能仍可用。截图和边界记录于 ../portfolio-v42-validation.md。

## 场景手记 · 2026-09-15

用户确认把听雨山居详情改为天气素材切换、场景说明与实时体验入口，已实现V4.3。晴、雨、雪是不同机位与阶段的真实截图，不能描述成同机位实时天气；Frost仅用于雪景。保留选定视觉与键盘、收藏、关闭返回功能。初始雪景共享图片转场，切换成其他素材后安全渐隐返回。来源与验证记录见 ../portfolio-v43-validation.md。
