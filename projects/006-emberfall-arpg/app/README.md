# 006 · 运行与操作

[在线试玩 ARPG](https://yydshly.github.io/0913_codex_project/006-emberfall-arpg/) · [在线研究导览](https://yydshly.github.io/0913_codex_project/006-emberfall-arpg/research/)

> 当前主线已转为 [杠杆实验室](lever-lab/README.md)，使用独立 Windows 启动包；本页保留旧浏览器 ARPG 的操作说明。

版本 3.0.0，单人跨区域 ARPG 原型。支持 WebGL 2 的现代浏览器与 Node.js 18+。

## 本地运行

在本目录执行 `npm start`，打开 http://127.0.0.1:4176/ 。服务仅监听本机，尚未部署。模块不能直接通过文件协议打开。

验证命令：`npm test`、`npm run test:journey`、`npm run build`。构建输出为 dist/，依赖随项目保留，不需要 CDN。

## 操作

| 操作 | 方法 |
| :--- | :--- |
| 移动 | 点击地面 / WASD / 方向键 / 触控摇杆 |
| 追击 | 点击敌人，自动靠近并近战；手动移动取消 |
| 斩击、闪避、星陨、药剂 | J / 空格 / Q / R，或对应按钮 |
| 交互 | 点击地点名称自动前往；靠近按 E |
| 区域地图 | M，显示三地区域关系、位置与进度 |
| 行囊、装备、战技 | B，比较穿戴、分配技能点；出售需靠近铁匠 |
| 暂停 | ESC，含备份与恢复入口；切走窗口自动暂停 |

先向守夜人接受委托，按任务目标寻找封印，进入两层地下城。西翼斥候和支路宝箱可探索；领主倒下后回城交付核心，再向守夜人开启下一轮。详细数值与地图见 [玩法规划](../game-design.md)。

## 存档

本地键 `emberfall-chapter-v3`；自动尝试迁移旧版 v2。任务里程碑、换图、篝火、穿戴、研习与交易保存检查点；死亡后重试会回退未保存进度。暂停面板可复制检查点文字，或粘贴后校验并确认恢复。导入会替换当前检查点，开始新旅程也会覆盖它；可先备份。

没有云同步。存储不可用时仅保留本次会话检查点。三个地区的清理、掉落和木桶状态跨切换与刷新保留。

## 代码与验证

- game-state.mjs：战斗、任务、导航、经济、地图切换与存档。
- maps.mjs / equipment.mjs：地图与交互点、装备模板和成长规则。
- game.js：输入、镜头、场景切换、对话、行囊、地图与存档界面。
- art.js / chapter.js / dungeon.js：场景、角色、材质、标签与战斗效果。
- game-state.test.mjs：20 项规则测试。
- chapter-playthrough.mjs：正常输入自动游玩；加 `--save-fixtures` 可把过程检查点写入已忽略的 test-output/，供界面验证使用。

规则测试、全流程模拟与构建已通过；浏览器验证与截图见 [notes.md](../notes.md)。尚未完成真人完整通关、跨浏览器、真实触控设备及长时间性能测量。


## 研究汇总网页

构建后的 `dist/research/index.html` 包含全部 006 研究文档、实际画面、历史方案与分类参考网页。实验台仍是独立 Windows 程序，网页不内嵌运行 Godot。

首次在本目录执行 `python -m pip install -r requirements-research.txt` 安装文档渲染依赖，再执行 `node build.mjs`，随后执行 `node research-preview.mjs`，打开本地 `http://127.0.0.1:4186/research/`。此地址仅在预览进程运行时有效，不是线上发布地址。原 ARPG 的 4176 预览入口保留。

修改研究文档后，重新执行 `node build.mjs`，它会调用 Python 3 与固定版本 Markdown，从文档和原图生成 `dist/research/`。可用环境变量 `RESEARCH_PYTHON` 指定 Python 程序。单独运行 `python build-research.py` 可生成被 Git 忽略的 `research/` 临时预览。`research-links.json` 由生成脚本中的来源目录维护。仓库提交原始 Markdown、图片和生成器，不重复提交生成页或引擎运行包。构建结果包含阅读页、Markdown 下载与原图，运行网页不依赖外部 CDN。
