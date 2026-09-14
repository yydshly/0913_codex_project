"""Regenerate the static research archive. Requires Python 3 + Markdown (pip install Markdown).
Run from any directory; optional first argument chooses the output directory.
node build.mjs generates directly into dist/research/.
"""
from pathlib import Path
from html import escape
import json
import sys
import re
from urllib.parse import urlsplit, unquote
import markdown
from markdown.extensions.toc import slugify_unicode

APP = Path(__file__).resolve().parent
PROJECT = APP.parent
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else APP / 'research'
OUT.mkdir(parents=True, exist_ok=True)

groups = {
    '游戏对标': [
        ('Grim Dawn · 探索', 'https://www.grimdawn.com/guide/gameplay/exploration/', '支路与发现的组织'),
        ('Grim Dawn · 任务', 'https://www.grimdawn.com/guide/gameplay/questing/', '任务与世界反馈'),
        ('Grim Dawn · 阵营', 'https://www.grimdawn.com/guide/character/factions/', '关系与行为后果'),
        ('No Rest for the Wicked · Wicked Inside', 'https://norestforthewicked.com/news/wicked-inside-recap', '空间与场景交互'),
        ('Diablo IV · 2022 年 3 月季度更新', 'https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022', '环境与区域表现'),
        ('Last Epoch · Monolith of Fate', 'https://support.lastepoch.com/hc/en-us/articles/46361839099931-What-is-the-Monolith-of-Fate', '重复游玩与成长组织'),
    ],
    '引擎与制作': [
        ('Three.js · 上游仓库', 'https://github.com/mrdoob/three.js', '旧 ARPG 使用 0.180.0 / MIT；完整 commit 待核实'),
        ('Unreal Engine · 模板', 'https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-templates-reference', '候选制作起点，未落地'),
        ('Unreal Engine · Blueprint', 'https://dev.epicgames.com/documentation/unreal-engine/introduction-to-blueprints-visual-scripting-in-unreal-engine', '可视化脚本候选，未实测'),
        ('Godot · 功能总览', 'https://godotengine.org/features/', '二维与三维交互制作'),
        ('Godot · 功能文档', 'https://docs.godotengine.org/en/stable/about/list_of_features.html', '选型能力清单；stable 页面可能随版本更新'),
        ('Godot · 4.5.1 下载归档', 'https://godotengine.org/download/archive/4.5.1-stable/', '当前实际版本 f62fdbde1，下载曾核验 SHA512'),
        ('Godot · 4.5.1 发布', 'https://github.com/godotengine/godot-builds/releases/tag/4.5.1-stable', '固定版本二进制与校验表'),
        ('Godot · MIT 许可证', 'https://raw.githubusercontent.com/godotengine/godot/4.5.1-stable/LICENSE.txt', '引擎许可；不自动覆盖原创应用'),
        ('Godot · PinJoint2D 文档', 'https://docs.godotengine.org/en/stable/classes/class_pinjoint2d.html', '研究过的关节候选；当前杠杆使用自写模型，未采用该关节'),
        ('GDevelop · Game makers', 'https://gdevelop.io/game-makers', '可视化制作候选，未实测'),
        ('GDevelop · 文档', 'https://wiki.gdevelop.io/', '候选参考，未制作样件'),
        ('Unity Studio · 产品介绍', 'https://unity.com/products/unity-studio', '替代方向资料，未实测'),
        ('Unity Studio · 概览', 'https://docs.unity.com/en-us/unity-studio/intro/overview', '候选功能与适用性'),
    ],
    '资产与费用': [
        ('Unity · 商店与方案', 'https://store.unity.com/gaming', '方案与资格参考，采用时重新核价'),
        ('Unity · Marketplace', 'https://marketplace.unity.com/', '资产发现入口，未采购'),
        ('Unity · Asset Store 入门', 'https://docs.unity.com/en-us/asset-store/introduction', '免费与商业资产及使用流程'),
        ('Unity · Prefab 手册', 'https://docs.unity.cn/Documentation/Manual/Prefabs.html', '理解可复用对象，不等于完整产品'),
        ('Unity · 免费资产目录', 'https://assetstore.unity.com/top-assets/top-free', '本次复核存在免费资产；每项仍需看许可'),
        ('Unity · 2026 定价说明', 'https://unity.com/products/pricing-updates', '本次复核 Pro 年价 2,310 美元 / 席位及年约按月 210 美元'),
        ('Unity · Personal 资格', 'https://activation.unity3d.com/products/unity-personal', '本次复核免费资格与过去 12 个月收入融资门槛'),
        ('Unity · 产品资格比较', 'https://activation.unity3d.com/products', '不同使用主体与方案资格需完整核对'),
        ('Unity · Pro', 'https://unity.com/products/unity-pro', '商业方案参考'),
        ('Unity · 扩展资产按席位许可', 'https://support.unity.com/hc/en-us/articles/208601846-A-package-I-want-to-purchase-on-the-Asset-Store-says-Editor-Extension-one-license-per-seat-under-the-requirements-section-What-does-this-mean-', '部分工具类资产的席位要求，非所有资产统一规则'),
    ],
    '教学与物理': [
        ('Science Buddies · Lifting with a Lever', 'https://www.sciencebuddies.org/teacher-resources/lesson-plans/lifting-with-a-lever', '杠杆教案参考；未复制其插图或完整教案'),
        ('Physics Classroom · Torque', 'https://www.physicsclassroom.com/class/Balance-and-Rotation/Lesson-2-Rotational-Dynamics/Torque', '此前正文访问返回 403，未用作实现依据'),
    ],
}
fresh = {'https://assetstore.unity.com/top-assets/top-free', 'https://unity.com/products/pricing-updates', 'https://activation.unity3d.com/products/unity-personal'}
sources = []
for group, records in groups.items():
    for title, url, purpose in records:
        sources.append(dict(title=title, url=url, category=group, purpose=purpose,
                            recorded_date='2026-09-14',
                            status='访问受限，未作为依据' if 'physicsclassroom.com' in url else ('本次已复核 · 2026-09-14' if url in fresh else '既有研究来源 · 本次未逐页复查'),
                            source_type='官方文档 / 上游资料',
                            license='MIT（引擎）' if 'godot' in url or 'mrdoob' in url else '参考网页；内容与资产许可需按原站核实',
                            version='4.5.1-stable' if '4.5.1' in url else ('0.180.0（本地使用）' if 'mrdoob' in url else '网页无固定 commit/tag；对应版本待核实')))
catalog = dict(scope='006 项目及本次对话的研究网页', updated='2026-09-14', sources=sources)
(PROJECT / 'research-links.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

docs = sorted(PROJECT.glob('*.md')) + [APP / 'README.md', APP / 'lever-lab/README.md', PROJECT / 'assets/README.md', PROJECT / 'assets/09-learning-storyboard-prompt.md']
names = {p.resolve(): str(p.relative_to(PROJECT)).replace('\\', '/').replace('/', '--').replace('.md', '.html') for p in docs}
labels = {
    'research-summary.md': ('完整研究总览', '当前入口', '十次探索转向、成果证据、产品判断与下一步'),
    'physics-lab.md': ('物理实验台', '当前成果', '已实现的交互、实际画面与模型边界'),
    'app/lever-lab/README.md': ('实验台操作指南', '当前成果', '本地启动、A/B 对比、快捷键与模型规则'),
    'notes.md': ('逐轮验证记录', '事实记录', '各轮实际检查、修复与尚未完成的验收'),
    'README.md': ('项目首页', '项目入口', '当前实验台与旧 ARPG 的统一导航'),
    'emotional-design.md': ('情绪价值驱动', '设计研究', '从目标感受推导体验事件与交互'),
    'learning-adventure.md': ('教学方向探索', '历史方案', '历史、物理与时空修复师的产品构想'),
    'first-lesson.md': ('杠杆第一课脚本', '历史方案', '原任务型工坊的预测、试验与迁移设计'),
    'technical-directions.md': ('替代技术路线', '选型研究', 'Unity、Unreal、Godot 等候选与适用方向'),
    'exploration-and-benchmarks.md': ('ARPG 探索与对标', '历史研究', '早期六步探索与四款产品的官方资料比较'),
    'game-design.md': ('ARPG 场景与规则', '旧原型', '三地图、成长、装备与重复远征'),
    'app/README.md': ('ARPG 运行与操作', '旧原型', '浏览器游戏启动、操作与验证方式'),
    'product-brief.md': ('余火商道任务书', '停止推进', '未落地的定制产品范围'),
    'sample-layout.md': ('商道布局提案', '停止推进', '双路线、建筑与高差的设计示意'),
    'acceptance.md': ('商道验收清单', '停止推进', '25 项计划检查，尚未执行'),
    'roadmap.md': ('商道阶段路线', '停止推进', '旧 S0–S6 路线，非当前待办'),
    'assets/README.md': ('图片与素材出处', '事实记录', '真实截图、设计示意与概念图的区别'),
    'assets/09-learning-storyboard-prompt.md': ('教学分镜提示词', '概念素材', 'AI 概念图的生成依据与使用边界'),
}
docs.sort(key=lambda p: list(labels).index(p.relative_to(PROJECT).as_posix()))

def render_doc(path):
    raw = path.read_text(encoding='utf-8-sig')
    body = markdown.markdown(raw, extensions=['tables', 'fenced_code', 'toc'], extension_configs={'toc': {'slugify': slugify_unicode}})
    def local_link(match):
        attr, url = match.group(1), match.group(2)
        parsed = urlsplit(url)
        if parsed.scheme or url.startswith('#'):
            return match.group(0)
        target = (path.parent / unquote(parsed.path)).resolve()
        if target in {(OUT / 'index.html').resolve(), (APP / 'research/index.html').resolve()}:
            return f'{attr}="index.html"'
        if target in names:
            return f'{attr}="{names[target]}' + ('#' + parsed.fragment if parsed.fragment else '') + '"'
        if target.is_file() and target.is_relative_to(PROJECT / 'assets'):
            return f'{attr}="assets/{target.name}"'
        if target == (PROJECT / 'research-links.json').resolve():
            return f'{attr}="research-links.json"'
        # Source-code references remain visible but do not pretend to be hosted files.
        return 'title="仓库内文件：' + escape(url, quote=True) + '"' if attr == 'href' else match.group(0)
    body = re.sub(r'(href|src)="([^"]+)"', local_link, body)
    body = body.replace('<table>', '<div class="table-scroll" tabindex="0" role="region" aria-label="可横向滚动的资料表"><table>').replace('</table>', '</table></div>')
    return body

def shell(title, content, is_doc=False):
    nav = '<a href="index.html">← 研究总览</a>' if is_doc else '<a href="#overview">研究总览</a><a href="#archive">完整记录</a><a href="#gallery">图像档案</a><a href="#sources">参考网页</a><a href="../index.html" target="_blank" rel="noopener">试玩游戏 ↗</a>'
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="从游戏效果参考、可玩 ARPG 到物理驱动的三图导览：情绪价值、实时交互与教学体验的研究理解、实现证据及参考资料。"><title>{escape(title)} · 006 研究档案</title><link rel="stylesheet" href="research.css"><script src="research.js" defer></script></head><body><a class="skip" href="#main">跳到正文</a><header><a class="brand" href="index.html"><span class="brand-mark">06</span><span>体验研究档案<small>EMOTION · INTERACTION · LEARNING</small></span></a><nav aria-label="主导航">{nav}</nav><button class="print" type="button">打印 / 存为 PDF</button></header><main id="main">{content}</main><footer><span>006 / 研究记录 · 2026.09.14</span><span>ARPG 与研究页已上线 · 物理实验台为 Windows 程序</span><a href="#main">回到顶部 ↑</a></footer></body></html>'''

for doc in docs:
    key = doc.relative_to(PROJECT).as_posix()
    title, status, description = labels.get(key, (doc.stem, '研究记录', '项目文档'))
    content = f'<div class="document-head"><span class="eyebrow">{escape(status)} / 原始研究记录</span><p>{escape(description)}</p><p class="muted">旧文档按其所属阶段理解；最新结论以研究总览与物理实验台说明为准。</p></div><article class="prose document">{render_doc(doc)}</article>'
    (OUT / names[doc.resolve()]).write_text(shell(title, content, True), encoding='utf-8')

cards = ''
for doc in docs:
    key = doc.relative_to(PROJECT).as_posix()
    title, status, description = labels.get(key, (doc.stem, '研究记录', '项目文档'))
    cards += f'<a class="doc-card" href="{names[doc.resolve()]}" data-search="{escape(title + status + description, quote=True)}"><span class="tag">{status}</span><h3>{title}<span aria-hidden="true"> ↗</span></h3><p>{description}</p></a>'

source_cards = ''
for source in sources:
    source_cards += f'''<article class="source-card" data-category="{source['category']}" data-search="{escape(source['title'] + source['purpose'] + source['url'], quote=True)}"><span class="eyebrow">{source['category']}</span><h3><a href="{escape(source['url'], quote=True)}" target="_blank" rel="noopener noreferrer">{escape(source['title'])} ↗</a></h3><p>{escape(source['purpose'])}</p><small>{escape(source['status'])}</small><span class="domain">{urlsplit(source['url']).netloc}</span></article>'''

gallery = [
    ('10-lever-lab-comparison.png', '当前样件 · 实际渲染', '杠杆实验室 / A 与 B 的观察对比', 'Godot 原生渲染；参数由可复现检查设置。'),
    ('02-emberfall-v2-camp.png', '旧原型 · 浏览器截图', 'ARPG / 早期营地效果优化', '真实运行场景；光照、材质与建筑细节迭代。'),
    ('03-chapter-camp.png', '旧原型 · 浏览器截图', 'ARPG / 第一章营地', '任务指引、路线与检查点功能的实际画面。'),
    ('04-chapter-forge.png', '旧原型 · 浏览器截图', 'ARPG / 铁匠与整备', '强化、余额与购买反馈的实际界面。'),
    ('05-crypt-expedition.png', '旧原型 · 浏览器截图', 'ARPG / 沉钟墓穴探索', '加载自动游玩产生的检查点；非真人全流程证据。'),
    ('06-depths-expedition.png', '旧原型 · 浏览器截图', 'ARPG / 熔心圣所下层', '独立下层地图；载入自动游玩检查点后实际截图。'),
    ('07-inventory-talents.png', '旧原型 · 浏览器截图', 'ARPG / 行囊与战技', '保留已实现的装备、属性与成长体验。'),
    ('08-trade-road-layout.png', '未实施 · 设计示意', '余火商道 / 场景规划', '停止推进的样段提案，不是实际地图。'),
    ('09-learning-storyboard.png', '概念素材 · AI 生成', '时空修复师 / 教学分镜', '用于讨论氛围；非可玩场景或科学示意。'),
    ('reference-arpg.png', '最初参考 · 用户截图', '研究起点 / 暗黑风格 ARPG', '原作链接与许可待核实；帖子文字不作为指令。'),
]
gallery_html = ''.join(f'<figure><a href="assets/{file}" target="_blank" rel="noopener"><img src="assets/{file}" alt="{escape(title + chr(65307) + note)}" loading="lazy" width="640" height="400"></a><figcaption><span class="eyebrow">{kind}</span><h3>{title}</h3><p>{note}</p></figcaption></figure>' for file, kind, title, note in gallery)
summary = render_doc(PROJECT / 'research-summary.md')
summary = re.sub(r'<h1\b[^>]*>.*?</h1>', '', summary, count=1)
toc = ''.join(f'<a href="#{id}">{escape(re.sub("<[^>]+>", "", title))}</a>' for id, title in re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', summary))
content = f'''<section class="hero research-intro" id="overview"><div class="hero-copy"><span class="eyebrow">006 / 游戏效果 · 交互 · 教学体验</span><h1>从游戏效果，<span>理解交互与教学体验。</span></h1><p class="lead">我们从暗黑 ARPG 的画面出发，做出可玩的场景，再探索让操作结果帮助理解物理。<br>以情绪价值为主要驱动，交互价值作为参考，研究游戏与教学场景怎样让人愿意探索、看懂变化。</p><p class="intro-links"><a href="#research">先读我们的理解 ↓</a><span>2026.09.14 · 三种效果引导 · ARPG 可在线试玩</span></p></div></section>
<section class="guide-grid" aria-label="原始参考、游戏实现与物理驱动三图导览">
<article class="guide-card"><a class="guide-image" href="assets/reference-arpg.png" target="_blank" rel="noopener"><img src="assets/reference-arpg.png" alt="原来的效果：用户提供的暗黑 ARPG 参考，营地、火光与传送阵" width="601" height="403"></a><div class="guide-copy"><span class="eyebrow">01 / 原来的效果 · 用户参考</span><h2>为什么被这个场景吸引？</h2><p>营地构图、冷暖光与探索氛围给出最初的审美方向。截图中的技术描述未经核实。</p><a href="assets/reference-arpg.png" target="_blank" rel="noopener">查看原始参考 ↗</a></div></article>
<article class="guide-card"><a class="guide-image" href="../index.html" target="_blank" rel="noopener"><img src="assets/03-chapter-camp.png" alt="我们实现的游戏效果：ARPG 营地、任务与操作界面的实际截图" width="906" height="898"></a><div class="guide-copy"><span class="eyebrow">02 / 我们实现的效果 · 实际游戏</span><h2>怎样让场景真正可玩？</h2><p>将场景接入移动、战斗、任务、成长与保存。由此认识到，地图和功能数量仍需接受体验检验。</p><a href="game-design.html">了解游戏实现 ↗</a><a href="../index.html" target="_blank" rel="noopener">在线试玩 ARPG ↗</a></div></article>
<article class="guide-card"><a class="guide-image" href="physics-lab.html"><img src="assets/10-lever-lab-comparison.png" alt="物理驱动的实际效果：杠杆实验台 A/B 装置、受力与运动曲线" width="1280" height="800"></a><div class="guide-copy"><span class="eyebrow">03 / 物理驱动 · 实际实验台</span><h2>怎样让操作帮助理解？</h2><p>改变质量或支点，观察、慢放并比较 A/B 结果。以自由探索尝试物理教学，理解效果仍待验证。</p><a href="physics-lab.html">查看物理体验与边界 ↗</a></div></article>
</section><p class="guide-note">三图分别为原始参考、实际浏览器画面与 Godot 原生渲染，呈现研究推进，不作同一场景画质比较。物理实验台是本地 Windows 程序，网页提供介绍与操作指南。</p>
<section class="principle"><span class="eyebrow">我们保留下来的原则</span><p>画面吸引 → 操作反馈<br>→ 探索与理解。</p><div>情绪价值优先，交互价值作为参考。<br>游戏、互动展示与教学体验可继续应用这些认识；<br>杠杆实验台是当前具体实践。</div></section>
<section class="stages" aria-label="三种已实现的样件"><article><span class="stage-number">01 / 保留</span><h2>浏览器 ARPG</h2><p>三地图与完整任务循环，验证场景、战斗、成长与保存的连接。</p><a href="game-design.html">20 项规则检查 · 旧原型 ↗</a></article><article><span class="stage-number">02 / 转向</span><h2>三维教学工坊</h2><p>从概念图片走到真实搬箱、调支点与开门，随后调整任务型体验。</p><a href="notes.html">38 项自动检查 · 历史样件 ↗</a></article><article class="current"><span class="stage-number">03 / 当前</span><h2>自由物理实验台</h2><p>直接改变条件，慢放观察，保存 A 与当前 B 比较，形成自己的解释。</p><a href="app--lever-lab--README.html">23 项自动检查 · 本地样件 ↗</a></article></section>
<section class="section" id="research"><div class="section-heading"><div><span class="eyebrow">01 / 研究脉络与判断</span><h2>做过什么，为什么转向。</h2></div><a class="text-link" href="research-summary.md" download>下载完整摘要 .md ↓</a></div><div class="reading-layout"><aside class="toc" aria-label="研究章节">{toc}</aside><article class="prose">{summary}</article></div></section>
<section class="section" id="archive"><div class="section-heading"><div><span class="eyebrow">02 / 完整研究档案</span><h2>每一份记录，都有出处。</h2></div><label class="search-label">查找文档<input id="doc-search" type="search" placeholder="例如：情绪、操作、验收" autocomplete="off"></label></div><p class="section-note">{len(docs)} 份文档已转换为可阅读网页。旧方案标明阶段，原有事实记录保留。</p><div class="doc-grid">{cards}</div><p id="doc-count" class="result-count" aria-live="polite">共 {len(docs)} 份记录</p></section>
<section class="section" id="gallery"><div class="section-heading"><div><span class="eyebrow">03 / 图像档案</span><h2>看效果，也看证据性质。</h2></div><a class="text-link" href="assets--README.html">完整素材记录 ↗</a></div><div class="gallery-grid">{gallery_html}</div></section>
<section class="section" id="sources"><div class="section-heading"><div><span class="eyebrow">04 / 参考网页</span><h2>对标、工具与教学资料。</h2></div><label class="search-label">查找来源<input id="source-search" type="search" placeholder="例如：Unity、许可、杠杆" autocomplete="off"></label></div><p class="section-note">{len(sources)} 个来源链接。3 个 Unity 费用与资产页面本次复核；其余保留原研究状态，访问受限页面单独标明。外链在新标签打开。</p><div class="filters" aria-label="来源分类"><button type="button" data-filter="全部" aria-pressed="true">全部</button>{''.join(f'<button type="button" data-filter="{group}" aria-pressed="false">{group}</button>' for group in groups)}</div><p id="source-count" class="result-count" aria-live="polite">共 {len(sources)} 个来源</p><div class="source-grid">{source_cards}</div><a class="text-link download" href="research-links.json" download>下载来源清单 .json ↓</a></section>
<section class="closing"><span class="eyebrow">NEXT / 下一步依据</span><h2>先看见真实使用，<br>再决定扩展什么。</h2><p>观察一次“改变条件 → 运行 → 保存对比 → 解释差别”。<br>先改善一个实验，再考虑摆动、碰撞与装置创作。</p><a class="button primary" href="physics-lab.html">查看当前能力与边界 ↗</a></section>'''
(OUT / 'index.html').write_text(shell('从游戏效果到交互与教学体验', content), encoding='utf-8')
# Keep the original Markdown tree available for downloads, with relative links intact.
import shutil
shutil.copytree(PROJECT / 'assets', OUT / 'assets', dirs_exist_ok=True)
for doc in docs:
    target = OUT / doc.relative_to(PROJECT)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(doc, target)
shutil.copyfile(PROJECT / 'research-links.json', OUT / 'research-links.json')
shutil.copyfile(APP / 'research-style.css', OUT / 'research.css')
shutil.copyfile(APP / 'research-ui.js', OUT / 'research.js')
print(f'Research archive: {len(docs)} documents, {len(sources)} source links, {len(gallery)} gallery entries.')
