import {readFile,access,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const app=path.dirname(fileURLToPath(import.meta.url)),out=path.join(app,'dist');
let count=0;
for(const name of ['controlled-compositor.mjs','scenic-layout.mjs','scenic-assets.mjs','png-export.mjs','assets/xian-scenic-sprites-v1.png','assets/xian-scenic-sprites-v1.json'])await access(path.join(out,name));
for(const file of ['destination-panel.mjs','destination-audit.mjs','xian-validation-data.mjs','xian-new-coordinates.mjs','xian-spatial-evidence.mjs','area-audit.mjs','library.html','archive.html','research.html','research.mjs','research-data.mjs','position-study.mjs','map.html','city.html','atlas.mjs','atlas-data.mjs','atlas-config.mjs','index.html','geography.html','studio.html','app.mjs','model.mjs','render.mjs','xian.mjs','xian-data.mjs','xian-geo.mjs','illustration.mjs']){
 const s=await readFile(path.join(out,file),'utf8');
 if(s.includes('../assets/'))throw new Error('构建仍包含父目录素材引用：'+file);
 const matches=file.endsWith('.html')?[...s.matchAll(/(?:src|href)="([^"]+)"/g)]:[...s.matchAll(/from '([^']+)'/g)];
 for(const m of matches){if(!m[1].startsWith('./'))continue;await access(path.join(out,m[1].split(/[?#]/)[0]));count++;}
}
let controls=0;
for(const [page,script] of [['research.html','destination-panel.mjs'],['research.html','research.mjs'],['studio.html','app.mjs'],['geography.html','xian.mjs'],['city.html','illustration.mjs'],['index.html','illustration.mjs'],['map.html','atlas.mjs']]){
const html=await readFile(path.join(app,page),'utf8'),js=await readFile(path.join(app,script),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw new Error('重复 HTML ID');
for(const m of js.matchAll(/\$\s*\('([^']+)'\)/g)){if(!ids.includes(m[1]))throw new Error('缺少界面控件：'+m[1]);}
controls+=ids.length;
}
for(const file of await readdir(app)){if(!file.endsWith('.mjs'))continue;const r=spawnSync(process.execPath,['--check',path.join(app,file)],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);}
console.log('构建 '+count+' 处静态引用、'+controls+' 个控件、脚本语法检查通过。');
