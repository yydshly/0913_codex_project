# 005 · Stick & Steel｜火柴人游戏效果构建

[![火柴人姿态、受力、接球、握持、攀爬与镜头六组实际效果](assets/14-capabilities-overview.jpg)](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=capabilities)

*效果引导图：六组实际交互截图。点击图片亲手体验火柴人游戏效果；研究导览与演示已发布至 GitHub Pages。*

**本质：用火柴人形象构建游戏效果。** 通过关节、动作、碰撞、受力、握持与攀爬表现角色操作和游戏反馈。后续将这套效果与制作流程沉淀为 Skill，由 Codex 等代理驱动，制作火柴人游戏效果视频，或构建采用同类火柴人风格与物理效果的游戏。现有人物和生活故事是风格与表演的扩展实验；视频导出与 Skill 尚待开发。

可复用的是火柴人的表现风格、关节与物理机制、动作反馈、场景及镜头控制，以及围绕这些效果建立的制作方法。既有动作和物理效果可以成为视频素材，也可以接入新游戏的操作与规则；制作效率与复用成本仍需通过实际作品验证。

[在线效果导览](https://yydshly.github.io/0913_codex_project/005-stick-steel/) · [六组游戏效果](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=capabilities) · [训练与对战](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=duel) · [当前能力](capabilities.md) · [后续开发与 Skill](next-steps.md) · [验证记录](notes.md)

## 从实际效果理解当前能力

### 1. 火柴人游戏效果与可玩验证

六组独立演示展示关节姿态、受力恢复、接球释放、武器握持碰撞、悬边攀爬与镜头观察。中文训练和机器人对战把角色操作、物理反馈与游戏规则放在一起验证。输入会改变实际模拟状态。

[逐项效果与操作](reusable-capabilities.md) · [训练与对战操作](app/README.md)

### 2. 形象扩展实验：同一种风格如何区分角色

[![四种火柴人衍生形象在同一时刻的动作对照](assets/24-character-comparison.png)](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=characters)

林乔、周岚、唐悦与陈远共同演出 24 秒的进门、回应、落座。用发型、衣服、姿态、步速和停顿区分角色，验证简化形象能否支持不同人物；提供四人对照和隐藏外形后只看动作。[人物说明](characters.md)

### 3. 编排与声音实验：效果如何形成连续片段

[![父子、伴侣与同事三个生活故事的实际画面](assets/20-story-overview.jpg)](https://yydshly.github.io/0913_codex_project/005-stick-steel/demo/?view=stories)

三个原创生活故事用于尝试动作编排、场景、镜头、字幕与 MiniMax 配音的结合。已生成 20 句旁白与对白，时长分别为 72、36、36 秒。它们是已有的叙事扩展实验，可供后续视频制作参考，当前仍是网页实时演示，没有导出视频文件。[故事说明](stories.md) · [配音验证](minimax-audio.md)

## 可扩展方向：用 Skill 复用这套游戏效果

| 方向 | 希望交付什么 | 可用基础 | 尚需开发 |
| :--- | :--- | :--- | :--- |
| 火柴人游戏效果视频 | 角色动作展示、战斗片段、武器与碰撞演示、玩法介绍视频 | 火柴人角色、动作与物理效果、场景镜头、已有时间轴和配音实验 | 效果编排、物理状态记录或确定性重放、固定帧率渲染、音画合成、MP4 导出 |
| 同类火柴人风格游戏 | 使用这种形象、动作和物理反馈的新游戏，例如对战、攀爬或道具交互玩法 | 输入控制、关节、接触反馈、握持、攀爬、训练与对战样例 | 规则与场景解耦、新关卡与玩法、操作反馈、可运行打包及验证 |

**Skill 是实现这两条方向的可复用制作流程。** 后续整理效果目录、人物与场景模板、执行脚本、修改方式与验收标准，让 Codex 等代理根据需求调用已有能力，交付视频或可玩的游戏工程。Skill 尚未创建，视频导出和通用游戏构建接口也尚未实现。

## 后续开发顺序

1. 整理火柴人角色、动作、物理效果与场景接口，明确每种效果的输入、反馈与可调参数。
2. 完成一支游戏效果视频，打通编排、物理效果记录/重放、渲染、MiniMax 配音和 MP4 导出。
3. 在第二支视频与一个同类风格新游戏中验证复用，保留不变的效果模块，按需求修改内容与规则。
4. 将验证过的制作与修改流程沉淀为 Skill，分别提供视频交付与游戏交付入口。

详细交付物与验收条件见 [后续开发与 Skill 路线](next-steps.md)。现有生活故事仍属预设表演；不能直接当作可回放的物理对战记录。人物造型尚未统一接入旧故事，没有自动生成完整视频、任意游戏、口型同步、联机或完整编辑器。

## 来源、运行与验证

| 项目 | 记录 |
| :--- | :--- |
| 上游网页 | [Genex · Stick & Steel](https://genex.games/stick-steel) |
| 上游仓库 | [Rabneba/stick-steel](https://github.com/Rabneba/stick-steel) |
| 固定提交 | `4c8e1d05a1ec47db93b687a81a82878727308b20` |
| 研究日期 | 2026-09-14 |
| 复用范围 | 选择性提取上游关节、物理、手部及对战模块；人物造型、生活故事、中文说明和配音接入为本项目新增 |
| 许可证 | 上游代码 MIT，Patrick Hand 字体 OFL；第三方生成模型/声音的单独分发条款待核实；本仓库原创内容尚未指定统一开源许可证 |
| 应用位置 | `app/client/`，React、Three.js、Rapier、Vite、TypeScript；独立管理依赖 |
| 本地运行 | 按 [运行说明](app/README.md) 启动后访问 http://127.0.0.1:8055/；开发预览仅监听本机 |
| 在线发布 | [GitHub Pages 研究导览](https://yydshly.github.io/0913_codex_project/005-stick-steel/)；main 推送自动构建，见[发布记录](../../docs/deployment.md#005--人物动画与交互研究发布适配) |
| 已有验证 | 44 项人物/物理/故事测试、5 项音轨测试；类型检查和生产构建通过，执行轮次见 [验证记录](notes.md) |
| 未验证范围 | 长期性能、手机实机、完整教学逐关人工通关、观众角色辨识率与独立音质评分；仍有大分包和 Rapier 初始化弃用提示 |

播放已生成的本地素材不需要 API Key；重新生成 MiniMax 配音需要本地凭据与相应服务额度，密钥不进入浏览器或版本库。没有复制完整上游仓库或嵌套 `.git`。

[MIT 原文](app/client/THIRD_PARTY_LICENSES/Stick-Steel-MIT.txt) · [字体 OFL](app/client/public/fonts/OFL.txt) · [上游素材说明](app/client/public/assets/README.md) · [效果图索引](assets/README.md) · [视觉检查](design-qa.md)
