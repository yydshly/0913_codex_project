import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const app=path.dirname(fileURLToPath(import.meta.url)), project=path.dirname(app), out=path.join(app,'dist');
const lock=JSON.parse((await readFile(path.join(app,'upstream-lock.json'),'utf8')).replace(/^\uFEFF/,''));
const cache=process.env.EANPA_BUILD_CACHE || path.join(app,'.cache',lock.commit);
const sizes={}, included=new Map();
await mkdir(out,{recursive:true});
async function put(name,bytes){const dest=path.join(out,name);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);sizes[name]=Buffer.byteLength(bytes);}
async function upstream(name){
 if(included.has(name))return;
 const expected=lock.files[name];if(!expected)throw Error(`Unpinned dependency: ${name}`);
 included.set(name,expected);
 let bytes;try{bytes=await readFile(path.join(cache,name));}catch{}
 const valid=b=>b&&b.length===expected.size&&createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')===expected.sha;
 if(!valid(bytes)){
  let error;for(let attempt=0;attempt<3;attempt++)try{
   const response=await fetch(`https://raw.githubusercontent.com/SkyeShark/Eanpa-Sky/${lock.commit}/${name}`,{signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw Error(`${response.status}: ${name}`);bytes=Buffer.from(await response.arrayBuffer());
   if(!valid(bytes))throw Error(`Git blob mismatch: ${name}`);error=null;break;
  }catch(e){error=e;}
  if(error)throw error;
  await mkdir(path.dirname(path.join(cache,name)),{recursive:true});await writeFile(path.join(cache,name),bytes);
 }
 await put(name,bytes);
 if(name.endsWith('.js')){
  const source=bytes.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  const imports=[...source.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)].map(m=>m[1]);
  for(const ref of imports){
   let target;
   if(ref.startsWith('.'))target=path.posix.normalize(path.posix.join(path.posix.dirname(name),ref));
   else if(ref.startsWith('three/addons/'))target=ref.replace('three/addons/','vendor/three/addons/');
   else if(ref==='three'||ref==='three/webgpu')target='vendor/three/three.webgpu.js';
   else if(ref==='three/tsl')target='vendor/three/three.tsl.js';
   else throw Error(`Unsupported dependency ${ref} in ${name}`);
   await upstream(target);
  }
 }
}
// Only the courtyard runtime dependency closure is published. Full upstream worlds stay external.
for(const name of ['engine/quality_presets.js','engine/sky_system.js','engine/weather_system.js','src/weathersky.js','src/cloudspatial.js','src/native_reflection_pipeline.js','src/reflection_environment.js','vendor/three/three.webgpu.js','vendor/three/three.tsl.js','vendor/three/addons/controls/OrbitControls.js','vendor/three/addons/tsl/display/FXAANode.js','assets/weather/cirrus_ice_trails.png','assets/weather/cirrus_ice_trails.json','assets/weather/rain_streak.png','assets/weather/trace_06.png','assets/starmap_tycho_4k.jpg','assets/moon_color_4k.jpg','LICENSE','vendor/three/LICENSE','vendor/three/EANPA_PATCHES.md','assets/weather/README.md'])await upstream(name);
for(const entry of await readdir(path.join(app,'lab'),{withFileTypes:true})){
 if(!entry.isFile()||/\.test\.|\.bench\./.test(entry.name)||! /\.(js|css|html|txt)$/.test(entry.name))continue;
 let content=await readFile(path.join(app,'lab',entry.name),'utf8');
 if(entry.name==='index.html')content=content.replace('<base href="/">','').replace('href="/"','href="https://skyeshark.github.io/Eanpa-Sky/" target="_blank" rel="noopener"').replace('href="/practice/"','href="../index.html#practice"').replaceAll('="/','="../').replaceAll('":"/vendor/','":"../vendor/');
 if(entry.name==='main.js'){
  content=content.replaceAll("from '/","from '../").replaceAll("import('/engine/","import('../engine/").replace("fetch('/lab/resource-sizes.json')","fetch('./resource-sizes.json')").replace("new Set(['/lab/',","new Set([location.pathname,");
  content=content.replace('sizes=await(await fetch', 'sizes=await(await fetch').replace("startupMark('Resource index');","sizes=Object.fromEntries(Object.entries(sizes).map(([key,value])=>[new URL('../'+key,import.meta.url).pathname,value]));sizes[location.pathname]=sizes[new URL('./index.html',import.meta.url).pathname];startupMark('Resource index');");
  content=content.replace("loadEngine:name=>import('../engine/'+name)","loadEngine:name=>({'sky_system.js':()=>import('../engine/sky_system.js'),'weather_system.js':()=>import('../engine/weather_system.js')}[name]())");
  content=content.replace('const response=await fetch(url);','const response=await fetch(new URL(url,new URL(\'../\',import.meta.url)));');
 }
 if(entry.name==='soundscape.js')content=content.replace('fetch(`/lab-audio/','fetch(`../lab-audio/');
 await put('lab/'+entry.name,content);
}
await cp(path.join(project,'assets'),path.join(out,'research-assets'),{recursive:true});
for(const name of ['rain-garden.ogg','thunder-natural.ogg'])await put('lab-audio/'+name,await readFile(path.join(project,'assets/audio',name)));
await put('index.html',await readFile(path.join(app,'research.html')));
await put('research.css',await readFile(path.join(app,'research.css')));
await put('lab/resource-sizes.json',JSON.stringify(sizes));
await put('runtime-manifest.json',JSON.stringify({repository:lock.repository,commit:lock.commit,files:Object.fromEntries(included)},null,2));
console.log(`Built 004 research + live courtyard: ${included.size} verified upstream runtime files (${[...included.values()].reduce((n,f)=>n+f.size,0)} bytes); no full upstream world.`);
