import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const app=path.resolve(fileURLToPath(new URL('./',import.meta.url))),root=path.resolve(app,'..');
const port=Number(process.env.PORT||4309);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const asset=requestPath.startsWith('/assets/');const base=asset?root:app;const rel=asset?requestPath.slice(1):requestPath==='/'?'index.html':requestPath.slice(1);const target=path.resolve(base,rel);
 if(!target.startsWith(base+path.sep)||!['.html','.css','.mjs','.png','.json','.txt'].includes(path.extname(target)))throw new Error('not found');
 const info=await stat(target);if(!info.isFile())throw new Error('not found');const data=await readFile(target);
 res.writeHead(200,{'Content-Type':mime[path.extname(target)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('城景工坊：http://127.0.0.1:'+port));
