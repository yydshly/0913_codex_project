import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {studyPlaces} from './research-data.mjs';
import {createScenicPlan,scenicCommands} from './scenic-layout.mjs';
import {assetDigest,digest,composeAndAudit,scenarioCommands} from './controlled-compositor.mjs';
import {encodeRgbaPng,crc32} from './png-export.mjs';
const plan=createScenicPlan(studyPlaces);
test('城区独立投影保留其方向，跨图幅不比较画布方位',()=>{
 const p=id=>plan.places.find(p=>p.id===id);
 assert.ok(p('daming').y<p('bell').y&&p('bell').y<p('pagoda').y);
 assert.ok(p('louguan').geoAnchor.x<p('bell').geoAnchor.x);
 assert.ok(plan.relations.every(r=>p(r.a).panel===p(r.b).panel));
});
test('PNG 编码能无损保存透明与半透明像素',async()=>{
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 const pixels=new Uint8Array([231,2,99,0,4,88,179,127,255,3,1,255,14,75,91,9]);
 const png=await encodeRgbaPng(pixels,2,2),chunks=[];let offset=8;
 while(offset<png.length){const view=new DataView(png.buffer,png.byteOffset+offset),n=view.getUint32(0),type=new TextDecoder().decode(png.subarray(offset+4,offset+8));if(type==='IDAT')chunks.push(png.subarray(offset+8,offset+8+n));offset+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks));
 assert.deepEqual([...raw.subarray(1,9),...raw.subarray(10,18)],[...pixels]);
});
// 此项使用实际生成图解码缓存，不把合成夹具冒充真实素材。运行前先执行register-sprite-sheet.py。
test('实际生成素材完整登记、8处合成通过；互换位置和漏画被拦截',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../assets/xian-scenic-sprites-v1.json',import.meta.url),'utf8'));
 const source=await readFile(new URL('../assets/xian-scenic-sprites-v1.png',import.meta.url));
 assert.equal(await digest(source),manifest.sha256);
 const assets=await Promise.all(manifest.places.map(async p=>{const rgba=new Uint8ClampedArray(await readFile(new URL('./node_modules/.cache/scenic-rgba/'+p.id+'.rgba',import.meta.url)));const a={...p,width:p.crop.width,height:p.crop.height,rgba,sha256:p.decodedSha256};assert.equal(await assetDigest(a),a.sha256);return a;}));
 assert.ok(manifest.places.every(p=>p.solidBoundaryPixels===0));
 const base=scenicCommands(plan),normal=await composeAndAudit(plan,assets,base);
 assert.equal(normal.report.positionStatus,'passed');assert.equal(normal.report.observedCount,8);
 assert.equal(normal.report.diagnostic,false);assert.equal(normal.report.productionStatus,'pending');
 for(const scenario of ['swap','missing'])assert.equal((await composeAndAudit(plan,assets,scenarioCommands(plan,scenario,base))).report.positionStatus,'failed');
});
