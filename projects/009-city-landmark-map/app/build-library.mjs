import {readdir,readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('./',import.meta.url)),root=path.resolve(app,'..'),out=path.join(app,'archive-files');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const labels={
 '01-xian-demo.png':['实际演示截图 · 图稿查看','2026-09-14浏览器真实截图，页面中的西安图为用户样稿。'],
 '02-version-gallery.png':['实际演示截图 · 版本对比','2026-09-14浏览器真实截图，回看V1/V2/V3和素材实验。'],
 'source-city-map-reference.png':['原始效果参考 · 腾冲／丽江','用户提供的最初截图，作为效果标准；不是本项目生成。'],
 'tengchong-art.png':['腾冲 · 生成底图','内置生图，无文字底图；地理与外形未逐项验收。'],
 'tengchong-poster.png':['腾冲 · 排版海报','基于生成底图的代码排版输出。'],
 'lijiang-art.png':['丽江 · 生成底图','内置生图，无文字底图；地理与外形未逐项验收。'],
 'lijiang-poster.png':['丽江 · 排版海报','基于生成底图的代码排版输出。'],
 'xian-illustrated-atlas.png':['西安 · 城区竖版样稿','用户上传，以西安站为抵达参照。'],
 'xian-macro-user-v1.png':['西安宏观 V1 · 用户样稿','全景与密集建筑版本，保留作历史对照。'],
 'xian-macro-user-v2.png':['西安宏观 V2 · 用户样稿','景区单元更突出，仍有地理及文字问题。'],
 'xian-scenic-user-v3.png':['西安景区 V3 · 用户样稿','目前样稿首页使用的版本；若干景区方位待修正。'],
 'xian-scenic-sprites-v1.png':['西安 · 8处生成素材','透明景观候选素材，外形未验收。'],
 'xian-scenic-layer-v1.png':['西安 · 透明合成图层','仅景观图层，不含背景和标签，不是完整海报。'],
 'xian-overview.png':['西安 · 宏观位置底稿','代码绘制的地理关系图，不是AI景观效果图。'],
 'xian-center.png':['西安 · 城区位置底稿','代码绘制的城区展开图，不是AI景观效果图。']
};
async function walk(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())result.push(...await walk(p));else result.push(p);}return result;}
const assetFiles=await walk(path.join(root,'assets'));
const visuals=assetFiles.filter(p=>['.png','.svg'].includes(path.extname(p))).sort((a,b)=>{
 const order=Object.keys(labels);const ai=order.indexOf(path.basename(a)),bi=order.indexOf(path.basename(b));return (ai<0?100:ai)-(bi<0?100:bi)||a.localeCompare(b);
});
const rootFiles=(await readdir(root,{withFileTypes:true})).filter(e=>e.isFile()&&['.md','.json'].includes(path.extname(e.name))).map(e=>path.join(root,e.name));
const info=[...rootFiles,...assetFiles.filter(p=>['.md','.json','.txt'].includes(path.extname(p))),...await walk(path.join(root,'data')),...(await walk(path.join(root,'skills'))).filter(p=>['.md','.txt','.json','.yaml'].includes(path.extname(p))),path.join(app,'README.md'),path.join(root,'backups/README.md'),path.join(root,'archive/README-before-pause-20260914.txt')].sort();
const manifest={scope:'项目现有assets中的全部PNG/SVG，以及研究文档、提示词、来源、数据与冻结技能说明；应用源码及依赖见压缩备份',visuals:[],information:[]};
let gallery='',docs='',records='';
for(const p of visuals){const rel=path.relative(root,p).replaceAll('\\','/'),name=path.basename(p),[title,note]=labels[name]||[name,'历史SVG位置或布局底稿，非景观成品。'],url='../'+rel,raw=await readFile(p);manifest.visuals.push({path:rel,title,sha256:createHash('sha256').update(raw).digest('hex')});gallery+=`<article class="library-card"><a href="${esc(url)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(url)}" alt="${esc(title)}"></a><h3>${esc(title)}</h3><p>${esc(note)}</p><a href="${esc(url)}" target="_blank" rel="noopener">查看原尺寸 ↗</a> · <a href="${esc(url)}" download>保存文件 ↓</a></article>`;}
for(const p of info){const rel=path.relative(root,p).replaceAll('\\','/'),raw=await readFile(p),text=raw.toString('utf8'),isDoc=p.endsWith('.md'),destRel=rel+(['.json','.txt'].includes(path.extname(p))?'':'.txt'),dest=path.join(out,destRel);await mkdir(path.dirname(dest),{recursive:true});await copyFile(p,dest);const url='./archive-files/'+destRel,title=isDoc?(text.match(/^#\s+(.+)$/m)?.[1]||rel):rel;
 manifest.information.push({path:rel,url,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
 const entry=`<details><summary>${esc(title)}</summary><p class="file-path">${esc(rel)} · <a href="${esc(url)}" target="_blank" rel="noopener">单独查看</a> · <a href="${esc(url)}" download>保存</a></p><pre>${esc(text)}</pre></details>`;
 if(isDoc)docs+=entry;else records+=entry;
}
await mkdir(out,{recursive:true});await writeFile(path.join(out,'catalog.json'),JSON.stringify(manifest,null,2)+'\n');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全部图稿与资料 · 城景工坊</title><link rel="stylesheet" href="./illustration.css"><style>.library-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}.library-card{padding:18px;background:#fffdf7;border:1px solid #dce0d0;border-radius:12px}.library-card img{width:100%;height:250px;object-fit:contain;background:repeating-conic-gradient(#e7e7dc 0% 25%,#f9f7ef 0% 50%) 0 / 20px 20px}.library-card p{line-height:1.7}details{margin:12px 0;padding:16px;border:1px solid #dce0d0;border-radius:8px}summary{cursor:pointer;font-weight:600}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;line-height:1.8;max-height:65vh;overflow:auto}.file-path{overflow-wrap:anywhere;font-size:13px}h2{margin-top:40px}.library-links{display:flex;gap:20px;flex-wrap:wrap;margin:24px 0}</style></head><body><header><a class="brand" href="./archive.html"><span>城</span>城景工坊</a><nav aria-label="资料导航"><a href="./archive.html">项目介绍</a><a href="./library.html" aria-current="page">全部图稿与资料</a><a href="./research.html">历史实验</a></nav></header><main><section class="heading"><div><p class="eyebrow">COMPLETE RESEARCH COLLECTION</p><h1>所有图稿与研究资料，在这里回看。</h1></div></section><p>城市景点汇总 Skill：收集城市及周边值得去的景点，以景区图鉴的方式展示景点特色、简要介绍和大体位置，帮助用户直观了解与探索城市。 当前为研究原型，后期需要优化实现。以原始腾冲／丽江图为效果参考；资料原文保留各历史阶段的记录。</p><p id="catalog-count">${visuals.filter(p=>p.endsWith('.png')).length}张PNG图稿 · ${visuals.filter(p=>p.endsWith('.svg')).length}份SVG底稿 · ${info.filter(p=>p.endsWith('.md')).length}份说明文档 · ${info.filter(p=>!p.endsWith('.md')).length}份提示词、数据与来源文件</p><nav class="library-links" aria-label="页面目录"><a href="#images">全部图稿</a><a href="#documents">研究与方向</a><a href="#records">提示词、来源与数据</a><a href="./archive-files/catalog.json">收录清单</a></nav><h2 id="images">全部图稿</h2><div class="library-grid">${gallery}</div><h2 id="documents">研究与方向 · 展开阅读原文</h2>${docs}<h2 id="records">提示词、来源与数据 · 展开查看</h2><p>提示词文件不代表每次生成成功；失败记录与用户上传来源分别保留。OSM数据 © OpenStreetMap contributors，按<a href="https://www.openstreetmap.org/copyright">ODbL</a>记录。</p>${records}</main><footer>阶段资料汇总 · 不新增生成结果</footer></body></html>`;
await writeFile(path.join(app,'library.html'),html);console.log(JSON.stringify({visuals:visuals.length,documents:info.filter(p=>p.endsWith('.md')).length,records:info.filter(p=>!p.endsWith('.md')).length}));
