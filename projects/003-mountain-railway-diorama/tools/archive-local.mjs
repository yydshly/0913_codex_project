// 保存已构建的本地成果；不提交 Git，也不读取环境配置或浏览器方案。
import {mkdir,readdir,readFile,writeFile,copyFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const id=process.argv[2];
if(!/^v\d+-\d{4}-\d{2}-\d{2}$/.test(id||''))throw Error('需要归档标识，例如 v36-2026-09-15');
const destination=path.join(project,'local-archives',id);
await mkdir(path.dirname(destination),{recursive:true});
await mkdir(destination); // 已有快照拒绝覆盖。
await cp(path.join(project,'app/dist'),destination,{recursive:true});
const source=path.join(destination,'source/app');await mkdir(source,{recursive:true});
for(const f of await readdir(path.join(project,'app'))){
 if(/\.(mjs|html|css|md)$/.test(f))await copyFile(path.join(project,'app',f),path.join(source,f));
}
await cp(path.join(project,'app/vendor'),path.join(source,'vendor'),{recursive:true});
await cp(path.join(project,'assets'),path.join(destination,'source/assets'),{recursive:true});
await mkdir(path.join(destination,'source/tools'),{recursive:true});
await copyFile(fileURLToPath(import.meta.url),path.join(destination,'source/tools/archive-local.mjs'));
for(const f of ['README.md','AGENTS.md','notes.md','capabilities.md','next-steps.md','archive.md','development-log.md'])await copyFile(path.join(project,f),path.join(destination,'source',f));
const git=args=>execFileSync('git',args,{cwd:project,encoding:'utf8'}).trim();
const manifest={id,createdAt:new Date().toISOString(),type:'local-working-tree-snapshot',gitHead:git(['rev-parse','HEAD']),gitStatus:git(['status','--short','--','.']),published:false,entry:'scene.html',source:'source/app',excludes:['环境配置和密钥','浏览器私人方案','其他子项目','历史归档目录'],files:[]};
await writeFile(path.join(destination,'README-LOCAL.md'),`# ${id} 本地冻结版\n\n这是当前工作区快照，不是 Git 标签，也未发布到远端。\n\n在本目录运行 python -m http.server 8040，然后打开 http://127.0.0.1:8040/scene.html。研究入口 index.html，开发过程 dev-log.html，源码 source/app。\n\nmanifest.json 记录逐文件 SHA-256；保留文件原样即可核对。本包不含浏览器中尚未导出的私人方案。\n`);
async function inventory(folder){for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const absolute=path.join(folder,entry.name);if(entry.isDirectory())await inventory(absolute);else{const data=await readFile(absolute);manifest.files.push({path:path.relative(destination,absolute).replaceAll('\\','/'),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}}}
await inventory(destination);await writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({destination,files:manifest.files.length,bytes:manifest.files.reduce((n,f)=>n+f.bytes,0),gitHead:manifest.gitHead}));
