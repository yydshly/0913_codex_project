import {mkdir,copyFile,readFile,writeFile,readdir} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {prepareValley} from './prepare-valley.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),dist=path.join(root,'dist');
await mkdir(path.join(dist,'assets'),{recursive:true});await mkdir(path.join(dist,'vendor'),{recursive:true});
const files=['index.html','gallery.css','gallery.mjs','hall.mjs','exhibits.mjs','valley.html','valley.css','valley.mjs','webgl-lab.html','webgl-lab.css','webgl-lab.mjs','webgl-math.mjs','webgl-geometry.mjs','webgl-renderer.mjs','webgl-shaders.mjs','webgl-lessons.mjs'];
files.push('webgl-comparison.mjs','webgl-detail-geometry.mjs','renderer-scene.mjs','three-study-renderer.mjs','three-standard-study.mjs','renderer-compare.html','renderer-compare.css','renderer-compare.mjs');
files.push('research.html','research.css');
for(const file of files)await copyFile(path.join(root,file),path.join(dist,file));
await mkdir(path.join(dist,'guide-assets'),{recursive:true});
for(const [source,target] of [['01-alder-valley-overview.jpg','original-alder-valley.jpg'],['renderer-comparison-v1/01-custom-station.jpg','our-renderer-comparison.jpg']]){await copyFile(path.resolve(root,'../assets',source),path.join(dist,'guide-assets',target));files.push('guide-assets/'+target);}
for(const file of ['three.module.js','three.core.js','OrbitControls.js','THREE-LICENSE.txt']){await copyFile(path.join(root,'vendor',file),path.join(dist,'vendor',file));files.push('vendor/'+file);}
const assets=path.resolve(root,'../assets/exhibits');for(const file of await readdir(assets)){if(!/\.(png|jpg|json|txt)$/.test(file))continue;await copyFile(path.join(assets,file),path.join(dist,'assets',file));files.push('assets/'+file);}
const runtime=await prepareValley();
async function copyRuntime(dir,relative='valley-runtime'){await mkdir(path.join(dist,relative),{recursive:true});for(const entry of await readdir(dir,{withFileTypes:true})){const name=relative+'/'+entry.name;if(entry.isDirectory())await copyRuntime(path.join(dir,entry.name),name);else{await copyFile(path.join(dir,entry.name),path.join(dist,name));files.push(name);}}}
await copyRuntime(runtime);
const hashes=[];for(const file of files.sort()){const b=await readFile(path.join(dist,file));hashes.push({file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(path.join(dist,'build-manifest.json'),JSON.stringify({project:'012-whistlevale',entry:'index.html',kind:'independent-gallery',files:hashes},null,2)+'\n');
console.log('012 gallery built: '+files.length+' files.');
