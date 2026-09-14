import {mkdir,readFile,writeFile,copyFile,cp} from 'node:fs/promises';
import './build-library.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const app=fileURLToPath(new URL('./',import.meta.url)),out=path.join(app,'dist');await mkdir(path.join(out,'assets'),{recursive:true});
for(const file of ['archive.html','map.html','city.html','atlas.css','atlas.mjs','atlas-data.mjs','atlas-config.mjs','index.html','illustration.css','illustration.mjs','geography.html','studio.html','style.css','app.mjs','model.mjs','render.mjs','xian.css','xian.mjs','xian-data.mjs','xian-geo.mjs']){const content=await readFile(path.join(app,file),'utf8');await writeFile(path.join(out,file),content.replaceAll('../assets/','./assets/'));}
for(const file of ['tengchong-art.png','lijiang-art.png','source-city-map-reference.png','xian-illustrated-atlas.png'])await copyFile(path.join(app,'../assets',file),path.join(out,'assets',file));
console.log('009 已构建到 app/dist，全部资源为相对路径。');

for(const file of ['research.html','research.mjs','research-data.mjs','position-study.mjs','controlled-compositor.mjs','scenic-layout.mjs','scenic-assets.mjs','png-export.mjs','destination-panel.mjs','destination-audit.mjs','xian-validation-data.mjs','xian-new-coordinates.mjs','xian-spatial-evidence.mjs','area-audit.mjs']){const body=await readFile(path.join(app,file),'utf8');await writeFile(path.join(out,file),body.replaceAll('../assets/','./assets/'));}
for(const file of ['xian-scenic-sprites-v1.png','xian-scenic-sprites-v1.json'])await copyFile(path.join(app,'../assets',file),path.join(out,'assets',file));
await copyFile(path.join(app,'../assets/xian-scenic-user-v3.png'),path.join(out,'assets/xian-scenic-user-v3.png'));

await cp(path.join(app,'vendor'),path.join(out,'vendor'),{recursive:true});
await cp(path.join(app,'../assets'),path.join(out,'assets'),{recursive:true});
await cp(path.join(app,'archive-files'),path.join(out,'archive-files'),{recursive:true});
await writeFile(path.join(out,'library.html'),(await readFile(path.join(app,'library.html'),'utf8')).replaceAll('../assets/','./assets/'));
