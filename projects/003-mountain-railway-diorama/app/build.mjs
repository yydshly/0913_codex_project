import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {developmentRecords} from './development-records.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),dist=path.join(root,'dist');
await mkdir(path.join(dist,'assets'),{recursive:true});
const sources=['guide.html','train-station.html','archive.html','index.html','styles.css','app.mjs','model.mjs','scene.html','scene.css','scene.mjs','scene-plans.mjs','scene-plans-ui.mjs','scene-world.mjs','scene-service.mjs','scene-train.mjs','scene-cab.mjs','scene-station.mjs','scene-station-room.mjs','scene-station-layout.mjs','scene-landscape.mjs','scene-wildlife.mjs','scene-fish.mjs','scene-motion.mjs','scene-animal-behavior.mjs','scene-ice.mjs','scene-people.mjs','scene-boarding.mjs','scene-audio.mjs','scene-aquatic.mjs','scene-butterflies.mjs','scene-rabbits.mjs','scene-flower-ground.mjs','scene-atmosphere.mjs','scene-vegetation.mjs','scene-foliage-pattern.mjs','scene-water.mjs','scene-seasons.mjs','scene-details.mjs','scene-cascade.mjs','scene-water-modes.mjs','scene-composition.mjs','scene-tree-shape.mjs','scene-ground.mjs','scene-ground-cover.mjs','scene-regions.mjs','scene-rocks.mjs','dev-log.html','dev-log.css','dev-log.mjs','development-records.mjs'];
for(const file of sources){
 const text=await readFile(path.join(root,file),'utf8');
 await writeFile(path.join(dist,file),text.replaceAll('../assets/','./assets/'));
}
await mkdir(path.join(dist,'assets','audio'),{recursive:true});
for(const file of ['arrival.mp3','departure.mp3','minimax-manifest.json'])await copyFile(path.join(root,'..','assets','audio',file),path.join(dist,'assets','audio',file));
for(const file of ['01-evening-hero.jpg','02-night-hero.jpg','upstream-LICENSE.txt'])await copyFile(path.join(root,'..','assets',file),path.join(dist,'assets',file));
await mkdir(path.join(dist,'vendor'),{recursive:true});
for(const file of ['three.module.js','three.core.js','OrbitControls.js','THREE-LICENSE.txt'])await copyFile(path.join(root,'vendor',file),path.join(dist,'vendor',file));
for(const file of new Set(developmentRecords.flatMap(r=>[r.image,r.beforeImage,...(r.gallery||[]).map(item=>item.image)]).filter(Boolean)))await copyFile(path.join(root,'..','assets',file),path.join(dist,'assets',file));
const recordLines=['# 白鹭河谷 · 开发与优化记录','','> 本文由 app/development-records.mjs 在构建时生成；后续在该内容源新增条目，网页与本文同步更新。','','历史条目依据已有 notes.md 与实景截图回填；没有记录的操作与验证不补造。版本号属于本研究迭代，与上游版本无关。','','[研究总览](README.md) · [技术证据](notes.md) · [记录网页源码](app/dev-log.html)','','## 持续记录约定','','每一轮保留目标、原因、实现步骤、发现的问题、实际验证和当前边界。代码完成后先标记“验证中”；检查通过并记录证据后再改为“已验证”。旧记录追加更正，不抹去曾经存在的问题。',''];
for(const r of developmentRecords){recordLines.push(`## ${r.id.toUpperCase()} · ${r.title}`,'',`${r.date} · ${r.status} · ${r.tags.join(' / ')}`,'',r.goal,'',`**为什么这样改：** ${r.reason}`,'');for(const[key,label]of[['steps','实现过程'],['fixes','问题与修正'],['validation','实际验证'],['limits','当前边界']])recordLines.push(`### ${label}`,'',...r[key].map((s,i)=>key==='steps'?`${i+1}. ${s}`:`- ${s}`),'');recordLines.push('对应实现：'+r.files.map(f=>`[${f}](app/${f})`).join(' · '),'');if(r.gallery)recordLines.push((r.galleryTitle||'四季与光线实景')+'：'+r.gallery.map(item=>`[${item.label}](assets/${item.image})`).join(' · '),'');if(r.beforeImage)recordLines.push(`![修改前同机位实际画面](assets/${r.beforeImage})`,'');if(r.image)recordLines.push(`![${r.title}实际画面](assets/${r.image})`,'');}
await writeFile(path.join(root,'..','development-log.md'),recordLines.join('\n'));
console.log(`Railway analysis and live scene built: ${sources.length} source files, 4 vendor files, 2 reference screenshots and upstream license.`);
