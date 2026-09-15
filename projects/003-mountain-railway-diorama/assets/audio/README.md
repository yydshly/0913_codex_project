# MiniMax 场景播报

2026-09-15 使用 MiniMax 官方语音接口生成，模型 speech-2.8-hd，预设音色 male-qn-qingse；没有克隆真人声音。生成信息见 [manifest](minimax-manifest.json)。

| 文件 | 文字 | 时长 |
|---|---|---|
| arrival.mp3 | 白鹭河站到了。列车已停稳，请先下后上，留意脚下的台阶。 | 6.624 秒 |
| departure.mp3 | 车门即将关闭，请站在安全线内。祝您旅途愉快。 | 6.156 秒 |

使用 [MiniMax HTTP 语音接口](https://platform.minimax.cn/docs/api-reference/speech-t2a-http)，MP3 / 32000 Hz / 单声道 / 128 kbps。文件为本研究生成，适用 MiniMax 对该账户生成内容的使用条款；没有将其标为上游 MIT 授权素材。

生成工具位于 `tools/generate-minimax-audio.mjs`。从仓库根目录传入外部配置路径运行：

`node projects/003-mountain-railway-diorama/tools/generate-minimax-audio.mjs <本机配置文件路径>`

配置只需 MINIMAX_API_KEY，可选 MINIMAX_API_BASE。凭据留在仓库外；前端没有 API 密钥，也不会在播放时请求 MiniMax。工具遇到已有音频会退出，避免重复生成费用。不要把配置放进 app、assets 或发布目录。

目前只生成两段语音。风、水、雨、轮轨仍由 Web Audio 合成；狗叫、鸟鸣和自然环境录音尚未接入。
