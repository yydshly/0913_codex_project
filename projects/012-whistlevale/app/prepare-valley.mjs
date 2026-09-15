import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(root,'../../003-mountain-railway-diorama/app');
const output=path.join(root,'valley-runtime');

// Capture only the existing scene's dependency graph. Never mutate project 003.
export async function prepareValley(){
 const files=new Map(),queue=['scene.mjs','scene.css','scene.html'];
 while(queue.length){
  const name=queue.shift();if(files.has(name))continue;
  const absolute=path.resolve(source,name);if(!absolute.startsWith(source+path.sep))throw Error('Scene dependency outside app: '+name);
  const bytes=await readFile(absolute);files.set(name,bytes);
  if(/\.(mjs|js)$/.test(name))for(const match of bytes.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])));
 }
 const html=files.get('scene.html').toString();
 for(const id of ['world','loading','error','camera-view','inspect-station','station-room-focus','station-cutaway','season-fixed-view','season-lighting','pause','reset-view'])if(!html.includes('id="'+id+'"'))throw Error('Source scene control changed: '+id);
 for(const season of ['spring','autumn'])if(!html.includes('data-season="'+season+'"'))throw Error('Source scene season missing: '+season);
 const manifest=[];
 for(const [name,bytes]of files){
  let out=bytes,transform=null;
  if(name==='scene.html'){
   out=Buffer.from(bytes.toString().replace('</head>','<style>.scene-header,.scene-controls,.scene-status,.build-panel{display:none!important}body{margin:0;overflow:hidden}#world{position:fixed;inset:0;width:100%;height:100%}</style></head>'));
   out=Buffer.from(out.toString().replace(/href="(dev-log|guide)\.html"/g,'href="https://yydshly.github.io/0913_codex_project/003-mountain-railway-diorama/$1.html"'));
   transform='Hide editing and legacy overlays; retain canvas, loading and error UI; point source documentation to published project 003.';
  }
  if(name==='scene.mjs'){
   const target='camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.12,innerWidth,innerHeight);';
   if(!bytes.toString().includes(target))throw Error('Scene camera adapter anchor changed; review before rebuilding.');
   out=Buffer.from(bytes.toString().replace(target,'camera.clearViewOffset();').replace('duration:2800','duration:matchMedia("(prefers-reduced-motion: reduce)").matches?1:2800'));
   transform='Center camera in dedicated viewing area and use immediate camera movement for reduced-motion visitors.';
  }
  await mkdir(path.dirname(path.join(output,name)),{recursive:true});await writeFile(path.join(output,name),out);
  manifest.push({file:name,sourceSha256:createHash('sha256').update(bytes).digest('hex'),outputSha256:createHash('sha256').update(out).digest('hex'),transform});
 }
 for(const [from,to]of [['vendor/THREE-LICENSE.txt','THREE-LICENSE.txt'],['../assets/upstream-LICENSE.txt','UPSTREAM-LICENSE.txt']])await copyFile(path.join(source,from),path.join(output,to));
 await writeFile(path.join(output,'source-manifest.json'),JSON.stringify({source:'projects/003-mountain-railway-diorama/app',version:'working-tree snapshot; hashes identify exact files',purpose:'012 visitor exhibit; audio not enabled',files:manifest},null,2)+'\n');
 return output;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await prepareValley();console.log('Valley visitor runtime prepared.');}
