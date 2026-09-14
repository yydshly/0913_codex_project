# V003 可运行快照

入口：app/camp-planner.html。完整依赖和素材均在本目录。

独立运行：在 app 目录选择空闲端口，例如设置 PORT=4388 后运行 node serve.mjs，访问 http://127.0.0.1:4388/app/camp-planner.html。需要支持 WebGL 的浏览器。

保存时的场景和观察条件见 replay.json；编辑器未应用草稿另行留档，不作为初始场景。入口仅替换初始配置、回放位置，存档键隔离，并增加历史版提示；渲染实现和素材未改变。

历史目录不再修改。验证：开发版执行 node snapshot.mjs verify v003。旧文件如需修复，创建新版本并说明原因，禁止覆盖。
