import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import {exhibits,SITE} from './exhibits.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));let checked=0;
const require=(condition,message)=>{if(!condition)throw new Error(message);checked++;};
require(exhibits.length===6,'Expected six curated exhibits');require(new Set(exhibits.map(x=>x.id)).size===exhibits.length,'Duplicate exhibit id');
for(const item of exhibits){require(item.position.length===2&&item.position.every(Number.isFinite),'Invalid placement '+item.id);require(item.skills.length>0&&item.try&&item.boundary&&item.source,'Missing exhibit explanation '+item.id);for(const key of ['path','research'])require(new URL(item[key],SITE).origin===new URL(SITE).origin,'Unexpected work origin');if(item.image)require(fs.existsSync(path.join(root,'../assets/exhibits',item.image)),'Missing exhibit image '+item.id);}
for(const file of ['gallery.mjs','hall.mjs','exhibits.mjs','serve.mjs','build.mjs']){execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});checked++;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);require(new Set(ids).size===ids.length,'Duplicate DOM id');
for(const file of ['gallery.mjs','hall.mjs']){const text=fs.readFileSync(path.join(root,file),'utf8');for(const m of text.matchAll(/\$\('([^']+)'\)/g))require(ids.includes(m[1]),'Missing DOM id '+m[1]);for(const m of text.matchAll(/(?:from\s*|import\()['"](\.\/[^'"]+)['"]/g))require(fs.existsSync(path.join(root,m[1])),'Missing module '+m[1]);}
for(const m of html.matchAll(/(?:src|href)="(?!https?:|#)([^"?]+)"/g)){const file=m[1];const absolute=file.startsWith('assets/')?path.join(root,'../assets/exhibits',file.slice(7)):path.join(root,file);require(fs.existsSync(absolute),'Missing HTML asset '+file);}
require(!/https?:\/\/.*(?:unpkg|jsdelivr)/.test(html),'Unpinned CDN dependency');
console.log('PASS: '+checked+' data, DOM, asset and syntax checks. Browser interaction and physical-device performance not tested by this script.');
