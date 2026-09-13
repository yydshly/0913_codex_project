# 新增与维护研究项目

## 1. 分配顺序编号

- 从 `001` 起使用三位数字，后接简短英文名称，例如 `001-project-slug`。
- 新项目编号为已有最大编号加一；索引与预览按编号升序展示。
- 编号用于长期引用，确定后不重复使用。暂缓或归档的项目保留原编号和记录。
- `templates/project/` 是模板，不占用编号。

## 2. 复制模板

将 `templates/project/` 整个复制到 `projects/NNN-project-slug/`。首个项目的示例命令：

```powershell
# 在仓库根目录执行；project-slug 替换成实际英文简称。
$projectPath = 'projects/001-project-slug'
if (Test-Path -LiteralPath $projectPath) { throw '目标目录已存在，请检查编号。' }
Copy-Item -LiteralPath 'templates/project' -Destination $projectPath -Recurse
```

替换 README 中的 `{{编号}}`、`{{项目名称}}` 等占位内容，并删除不适用的章节。保留未完成项的真实状态，不填写尚未核实的结论。

```text
projects/001-project-slug/
├── README.md          # 摘要、来源、运行方法、截图、结论
├── notes.md           # 详细研究与实验记录
├── assets/            # 封面、截图、架构图
└── app/               # 自己编写或适配的实践应用，可选
```

## 3. 登记首页索引

在根 README 的 `PROJECT_INDEX_START` 与 `PROJECT_INDEX_END` 之间添加一行，并在第一次收录时移除“尚未收录”的提示。以下仅为语法示例：

```markdown
| 001 | [项目名称](projects/001-project-slug/README.md) | 一句话描述研究关注点 | [owner/repo](https://github.com/owner/repo) | 待研究 | — |
```

目录名称、标题编号和索引编号必须一致。只有演示实际可访问后，才将 `—` 替换为在线链接。

索引中的原始来源优先使用用户提供的入口。研究对象是网页时，填写原始网页 URL；发现的源码仓库线索另记在子项目，不替代原网页入口。

## 4. 添加图片预览

首页每个项目最多放一张代表图，完整截图集放在子项目 README。图片建议使用 `cover.webp`、`01-overview.png`、`02-workflow.png` 等可读名称。

在根 README 的 `PROJECT_PREVIEWS_START` 与 `PROJECT_PREVIEWS_END` 之间加入以下内容，并在第一次收录时移除初始提示。图片文件存在后再加入图片语法：

```markdown
### 001 · 项目名称

一句话说明项目价值和本次研究关注点。

![001 项目名称：主要界面与功能概览](projects/001-project-slug/assets/cover.webp)

[研究记录](projects/001-project-slug/README.md) · [原始仓库](https://github.com/owner/repo)
```

尚无图片时写“截图待补充”。上游图片需记录来源；自己运行得到的截图应与记录的版本一致。

## 5. 完成收录前检查

- 原始仓库、研究版本和许可证是否已填写或标为待核实？
- 首页索引和预览是否按编号升序，链接是否指向实际文件？
- 图片是否存在，并附有说明？
- 运行命令是否经过验证，环境条件与未解决问题是否有记录？
- 演示状态是否真实，应用依赖与输出是否留在自己的项目范围内？

返回[仓库首页](../README.md)。
