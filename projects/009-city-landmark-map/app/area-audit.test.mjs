import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import transform from 'coordtransform';
import {spatialEvidence} from './xian-spatial-evidence.mjs';
import {checkAreaEvidence} from './area-audit.mjs';
import {auditDestinations} from './destination-audit.mjs';
import {xianCase,xianCandidates} from './xian-validation-data.mjs';
test('真实动物园坐标落在OSM园区内；影视城落点距边界过近不强行通过',()=>{
 assert.equal(checkAreaEvidence('qinling-zoo',spatialEvidence['qinling-zoo']).status,'inside');
 const film=checkAreaEvidence('bailu-film',spatialEvidence['bailu-film']);assert.equal(film.status,'edge-uncertain');assert.equal(film.inside,true);
});
test('已保存原始OSM节点、版本、哈希和转换可复算，不用边界中心代替真实点',async()=>{
 for(const e of Object.values(spatialEvidence)){
  const raw=await readFile(new URL('../assets/location-evidence/'+e.area.rawFile,import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'),e.area.rawSha256);
  const elements=JSON.parse(raw).elements,way=elements.find(p=>p.type==='way'),nodes=new Map(elements.filter(p=>p.type==='node').map(p=>[p.id,[p.lon,p.lat]]));
  assert.equal(e.area.version,way.version);assert.deepEqual(e.area.ring,way.nodes.map(id=>nodes.get(id)));
  const original=e.point.original;assert.deepEqual([e.point.lon,e.point.lat],transform.gcj02towgs84(original.lon,original.lat));
 }
});
test('将动物园移到袁家村方向、串用边界、同源及未转换坐标均不可获得区域支持',()=>{
 let e=structuredClone(spatialEvidence['qinling-zoo']);e.point.lon=108.538698;e.point.lat=34.590240;assert.equal(checkAreaEvidence('qinling-zoo',e).status,'outside');
 for(const mutate of [e=>e.area.placeId='bailu-film',e=>e.area.originGroup='amap',e=>e.point.crs='GCJ-02',e=>e.area.ring.pop()]){
  e=structuredClone(spatialEvidence['qinling-zoo']);mutate(e);assert.equal(checkAreaEvidence('qinling-zoo',e).status,'pending');
 }
});
test('当前坐标变更使旧区域证据失效',()=>{
 const places=structuredClone(xianCandidates);places.find(p=>p.id==='qinling-zoo').coordinates[0].lon=109.5;
 assert.equal(auditDestinations(xianCase,places).rows.find(p=>p.id==='qinling-zoo').areaCheck.status,'pending');
});
test('白鹿仓东门保留点位含义，朱雀粗范围不被转成虚构中心',()=>{
 assert.equal(xianCandidates.find(p=>p.id==='bailucang').coordinates[0].pointRole,'east-gate');
 const z=xianCandidates.find(p=>p.id==='zhuque');assert.equal(z.coordinates.length,0);assert.equal(z.regionalEvidence.status,'regional-only');
});
