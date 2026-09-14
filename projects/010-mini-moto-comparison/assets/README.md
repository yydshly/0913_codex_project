# 010 · 图片来源

| 文件 | 来源与用途 | 许可 / 版本 |
| :--- | :--- | :--- |
| mini-moto-game-overview.png | 2026-09-14 原作游戏全景实测，原样复制自 007 的 04-live-park-overview.png；用作首页与研究页引导图 | 原作权利人保留权利，许可与 commit/tag 待核实；不是 010 重建效果 |
| user-mini-moto-reference.png | 本次用户提供的 Edgex 转述截图，含 Christopher J. DiMarco 视频画面；识别研究对象 | 权利归原作者及相关权利人，许可证及截图对应 commit/tag 待核实 |

2026-09-14 从本次附件原样复制，SHA-256：`3400B8846BD9C0E82552FA56F1352CB96962D791FFE4ADA1F47614D8A6949E20`。

本附件与 007 保存的附件哈希不同，不声称是同一个文件。没有生成、修改或伪造游戏运行截图。010 应用截图待补充。

## 实时场景使用的纹理

- [Brown Mud Dry](https://polyhaven.com/a/brown_mud_dry)，作者 Rob Tuytel；CC0。
- [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock)；CC0。
- 每组使用 1K JPEG 颜色、OpenGL 法线和粗糙度，共六张。原样复制自 008 已下载的资源；[texture-manifest.json](texture-manifest.json) 保留原始 URL、许可、日期、大小与 MD5。六张合计 4,783,758 字节，本轮再次校验通过。
- [Poly Haven 许可](https://polyhaven.com/license)。没有使用原作的 GLB 或地形/土路图片。

摩托、车手、道路、松树、岩石、维修区与围栏由 010 的 scene.mjs 新写三维几何，参考 008 的实例化与分层思路，未复制其场景代码。标牌文字和粒子衰减由 Canvas 生成；这是运行所需的程序图形，不是生成的场景截图。

引导图 mini-moto-game-overview.png：1280×720，原样复制；SHA-256：eb26d36f3c7aae215ad917b0aee1ea1b1eb492e18fcb8a7f49954d0b907ac1f2。用于研究摘要的原作效果展示，不代表 010 的画面或能力。
