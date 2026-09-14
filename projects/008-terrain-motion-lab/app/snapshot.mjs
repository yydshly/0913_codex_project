import {mkdir,readFile,writeFile,cp,readdir,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateOutdoorRecipe} from './outdoor-recipe.mjs';
import {site as campSite,record as campRecord,plans as campPlans} from './camp-plan-core.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function files(root,prefix=''){const result=[];for(const item of await readdir(path.join(root,prefix),{withFileTypes:true})){const name=path.posix.join(prefix,item.name);if(item.isSymbolicLink())throw Error('快照不能依赖外部符号链接：'+name);if(item.isDirectory())result.push(...await files(root,name));else result.push(name);}return result.sort();}
export async function verifySnapshot(folder){
 const manifest=JSON.parse(await readFile(path.join(folder,'manifest.json'),'utf8')),actual=(await files(folder)).filter(n=>n!=='manifest.json');
 if(JSON.stringify(actual)!==JSON.stringify(Object.keys(manifest.files).sort()))throw Error('快照文件清单不一致');
 for(const name of actual){const data=await readFile(path.join(folder,name));if(hash(data)!==manifest.files[name].sha256||data.length!==manifest.files[name].bytes)throw Error('历史文件已改变：'+name);}
 return {id:manifest.id,files:actual.length,bytes:Object.values(manifest.files).reduce((n,f)=>n+f.bytes,0)};
}
export async function createSnapshot(id,stateFile){
 if(!/^v\d{3}$/.test(id))throw Error('版本号格式应为 v001');
 const parent=path.join(project,'snapshots'),target=path.join(parent,id),staging=path.join(parent,'.'+id+'-pending');
 await mkdir(parent,{recursive:true});
 for(const p of [target,staging]){try{await stat(p);}catch(e){if(e.code==='ENOENT')continue;throw e;}throw Error('版本或待处理目录已存在，禁止覆盖：'+p);}
 const state=JSON.parse(await readFile(stateFile,'utf8')),isCamp=state.siteId===campSite.id;
 if(isCamp){campRecord(state.planId,state.brief);if(!state.ready||state.error||state.walking||state.progress!==0||!['overview','top','arrival','pitch'].includes(state.view)||!Number.isInteger(state.hour)||state.hour<9||state.hour>17||!campPlans[state.planId].pitches.some(p=>p.id===state.pitchId))throw Error('营地快照需加载完成、重置到路线起点并选择固定观察位置');}
 else{state.recipe=validateOutdoorRecipe(state.recipe);
 if(!state.ready||state.renderError||!Number.isFinite(state.progress)||state.progress<0||state.progress>1||!['follow','overview','layout','eyes'].includes(state.camera)||!['auto','day','dusk','dawn'].includes(state.light))throw Error('请提供已加载、暂停且使用固定观察方式的页面状态');
 if(state.playing)throw Error('先暂停画面再保存');}
 await mkdir(staging);await mkdir(path.join(staging,'app'));
 for(const item of await readdir(path.join(project,'app'),{withFileTypes:true})){if(['dist','node_modules'].includes(item.name)||item.name.startsWith('.'))continue;await cp(path.join(project,'app',item.name),path.join(staging,'app',item.name),{recursive:true});}
 await cp(path.join(project,'assets'),path.join(staging,'assets'),{recursive:true});
 for(const item of await readdir(project))if(item.endsWith('.md'))await cp(path.join(project,item),path.join(staging,item));
 const entryName=isCamp?'camp-planner.html':'outdoor.html',entry=path.join(staging,'app',isCamp?'camp-planner.mjs':'outdoor.mjs'),original=await readFile(entry,'utf8');let runtime;
 if(isCamp){const token="let planId='B',brief={groups:4,gap:4},pitchId='west-back',hour=15,view='overview'";if(!original.includes(token)||!original.includes("setView('overview')"))throw Error('营地入口已改变，需要更新快照适配逻辑');runtime=original.replace(token,`let planId=${JSON.stringify(state.planId)},brief=${JSON.stringify(state.brief)},pitchId=${JSON.stringify(state.pitchId)},hour=${state.hour},view=${JSON.stringify(state.view)}`).replace("setView('overview')",`setView(${JSON.stringify(state.view)})`).replace("key='songlan-camp-review-v1'",`key='songlan-snapshot-${id}-camp-review'`);}
 else{runtime=original.replace('let land=makeOutdoor(),',`let land=makeOutdoor(${JSON.stringify(state.recipe)}),`).replace('let land=makeOutdoor(entryLayout),',`let land=makeOutdoor(${JSON.stringify(state.recipe)}),`).replace(/progress=(?:0|entryParams\.get\('view'\)==='sunrise'\?\.97:0),playing=false,cameraMode='follow',lightMode='auto'/,`progress=${state.progress},playing=false,cameraMode=${JSON.stringify(state.camera)},lightMode=${JSON.stringify(state.light)}`);
 if(runtime===original||runtime.includes('let land=makeOutdoor(),')||runtime.includes('let land=makeOutdoor(entryLayout),'))throw Error('入口已改变，需要更新快照适配逻辑');}
 await writeFile(entry,runtime);
 const editor=path.join(staging,'app/outdoor-editor.mjs');await writeFile(editor,(await readFile(editor,'utf8')).replace("const storageKey='songlan-outdoor-layout-v1'",`const storageKey='songlan-snapshot-${id}-layout'`));
 const html=path.join(staging,'app',entryName);await writeFile(html,(await readFile(html,'utf8')).replace('<title>','<title>'+id.toUpperCase()+' 历史版 · ').replace('<main>',`<main><p style="padding:12px;background:#efe0b8;color:#44391f">${id.toUpperCase()} 固定历史版 · 可播放和观察；刷新恢复归档场景。本机保存使用独立存档。</p>`));
 await writeFile(path.join(staging,'app/versions.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${id.toUpperCase()} 历史归档</title><h1>${id.toUpperCase()} 固定历史版</h1><p>此目录是独立归档，包含当时全部运行文件。</p><a href="${entryName}">打开当时场景</a></html>`);
 await writeFile(path.join(staging,'replay.json'),JSON.stringify(state,null,2));
 await writeFile(path.join(staging,'SNAPSHOT.md'),`# ${id.toUpperCase()} 可运行快照\n\n入口：app/${entryName}。完整依赖和素材均在本目录。\n\n独立运行：在 app 目录选择空闲端口，例如设置 PORT=4388 后运行 node serve.mjs，访问 http://127.0.0.1:4388/app/${entryName}。需要支持 WebGL 的浏览器。\n\n保存时的场景和观察条件见 replay.json；编辑器未应用草稿另行留档，不作为初始场景。入口仅替换初始配置、回放位置，存档键隔离，并增加历史版提示；渲染实现和素材未改变。\n\n历史目录不再修改。验证：开发版执行 node snapshot.mjs verify ${id}。旧文件如需修复，创建新版本并说明原因，禁止覆盖。\n`);
 let gitHead='待核实';try{gitHead=execFileSync('git',['rev-parse','HEAD'],{cwd:project,encoding:'utf8'}).trim();}catch{}
 const replay=isCamp?{siteId:state.siteId,planId:state.planId,brief:state.brief,pitchId:state.pitchId,hour:state.hour,view:state.view}:{recipe:state.recipe,progress:state.progress,camera:state.camera,light:state.light};
 const manifest={id,createdAt:new Date().toISOString(),status:'sealed',gitHead,gitNote:'工作区归档，包含未提交实现；Git HEAD 不是本快照的完整源码版本',entry:'app/'+entryName,entrySourceSha256:hash(Buffer.from(original)),replay,files:{}};
 for(const name of await files(staging)){const data=await readFile(path.join(staging,name));manifest.files[name]={bytes:data.length,sha256:hash(data)};}
 await writeFile(path.join(staging,'manifest.json'),JSON.stringify(manifest,null,2));await verifySnapshot(staging);await rename(staging,target);return verifySnapshot(target);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [action,id,stateFile]=process.argv.slice(2);
 if(action==='create')console.log(await createSnapshot(id,path.resolve(stateFile)));
 else if(action==='verify'){if(!/^v\d{3}$/.test(id))throw Error('版本号无效');console.log(await verifySnapshot(path.join(project,'snapshots',id)));}
 else throw Error('用法：node snapshot.mjs create v001 状态文件 / verify v001');
}
