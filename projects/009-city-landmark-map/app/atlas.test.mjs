import test from 'node:test';
import assert from 'node:assert/strict';
import transform from 'coordtransform';
import {atlasPlaces,visiblePlaces,mapCoordinate,directionFrom,coreIds} from './atlas-data.mjs';
test('宏观地点具有唯一身份、原始坐标和可追溯来源',()=>{assert.equal(atlasPlaces.length,20);assert.equal(new Set(atlasPlaces.map(p=>p.id)).size,20);for(const p of atlasPlaces){assert.equal(p.coordinateSystem,'GCJ-02');assert.ok(p.lon>108&&p.lon<111&&p.lat>33&&p.lat<35);assert.ok(p.source.startsWith('https://'));assert.ok(p.introSource.startsWith('https://'));assert.ok(p.description&&p.tip);}});
test('华山仅进入更远周边，城区仍包含西安站',()=>{assert.equal(visiblePlaces('near').length,19);assert.equal(visiblePlaces('far').length,20);assert.ok(!visiblePlaces('core').some(p=>p.id==='huashan'));assert.ok(visiblePlaces('core').some(p=>p.id==='station'));assert.equal(coreIds.length,10);});
test('底图转换顺序正确，所有地点可近似往返',()=>{for(const p of atlasPlaces){const [lat,lon]=mapCoordinate(p,transform.gcj02towgs84);assert.ok(Math.abs(lon-p.lon)>.001);const [backLon,backLat]=transform.wgs84togcj02(lon,lat);assert.ok(Math.abs(backLon-p.lon)<.00005);assert.ok(Math.abs(backLat-p.lat)<.00005);}assert.throws(()=>mapCoordinate({lon:108,lat:34,coordinateSystem:'unknown'},transform.gcj02towgs84));});
test('主要方向与真实地点关系一致',()=>{const p=id=>atlasPlaces.find(p=>p.id===id);assert.equal(directionFrom(p('bell'),p('station')),'东北方向');assert.equal(directionFrom(p('bell'),p('pagoda')),'南偏东方向');assert.equal(directionFrom(p('station'),p('station')),'同一地点');});
