# 005 · MiniMax 人物故事配音

当前状态：**三个故事的 MiniMax 真实配音已生成并接入播放器。** 使用 `speech-2.8-hd`，20 句、245 字符，生成 72 / 36 / 36 秒完整本地音轨。

## 声音与文件

| 故事 | 音轨 | 内容 |
| :--- | :--- | :--- |
| 父亲慢下来了 | [72 秒配音](app/client/public/audio/stories/father.24bcfd11550c.wav) | 温润男声旁白与男童对白 |
| 吵架后的晚饭 | [36 秒配音](app/client/public/audio/stories/dinner.42c313f97041.wav) | 男声旁白与温暖女声回应 |
| 新来的同事 | [36 秒配音](app/client/public/audio/stories/newcomer.11337f44760b.wav) | 男声旁白与青年同事对白 |

使用官方系统音色，没有声音克隆。各句按故事时点放入音轨，保留停顿；在本地平衡不同音色的音量并限制峰值，避免突然过轻或削波。浏览器以音轨位置驱动画面，暂停时停在同一位置，跳转、倍速、静音和音量作用于该音轨。生成后观看不再调用 MiniMax。

## 配置与再次生成

实际读取用户指定的 `F:\codex_project\.env.minimax`，其中包含 `MINIMAX_API_KEY` 与 `MINIMAX_API_BASE`。未把密钥复制到项目或浏览器。项目 `.env.local` 仍为未填写密钥的模板。

在 `app/client` 中执行：

```powershell
$env:MINIMAX_ENV_FILE='F:\codex_project\.env.minimax'
npm run audio:plan
npm run audio:generate
```

支持外部配置文件、直接环境变量或项目 `.env.local`。只允许官方 HTTPS 语音端点。生成脚本逐句缓存原始 PCM 到 `.cache/minimax/`；相同请求复用缓存。本轮第二次运行仅进行了本地音量平衡和封装，没有新增 API 调用。最终清单位于 `public/audio/stories/manifest.json`，记录模型、音色、语速、句子时点、增益、摘要和生成日期。旧版本保留在忽略的缓存目录。

接口与音色依据 [MiniMax 同步语音文档](https://platform.minimax.cn/docs/api-reference/speech-t2a-http) 与 [系统音色列表](https://platform.minimax.cn/docs/faq/system-voice-id)。语音为 MiniMax 生成资产，其使用遵循服务及账户条款；不将生成语音声称为上游 MIT 自带素材。

## 实际验证

- 20 个请求全部成功，未需要超时台词重试；三条 WAV 的实际时长分别为 72、36、36 秒。
- 所有句子都有非静音信号，均未超出时段；文件摘要验证通过，平衡后峰值不超过 30000/32768。详情见 [音频文件检查](assets/22-minimax-audio-checks.json)。
- 五项音频单元测试通过，类型检查与最终生产构建通过。既有 41 项物理/故事测试结果保留，未因本次配音重复运行。
- 浏览器已实播 MiniMax 音轨，验证加载、暂停、定位、倍速保调、静音，以及切换故事时旧音轨移除。音频播放时场景跟随当前音轨时间；暂停后进度条取音轨暂停位置。
- 以上是生成结果、音频信号与浏览器播放链路验证，不包含独立人工音质评分或语音识别逐字校对。

[观看有声故事](http://127.0.0.1:8055/?view=stories) · [故事说明](stories.md) · [运行说明](app/README.md)
