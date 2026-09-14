import test from 'node:test';
import assert from 'node:assert/strict';
import {places,views} from './xian-data.mjs';
import {distanceKm,projection,renderMap,exportDataset} from './xian-geo.mjs';
test('来源链完整，所有点位使用相同坐标系且身份唯一',()=>{
 assert.equal(places.length,13);assert.equal(new Set(places.map(p=>p.id)).size,13);assert.equal(new Set(places.map(p=>p.poi)).size,13);
 for(const p of places){assert.equal(p.coordinateSystem,'GCJ-02');assert.match(p.source,/^https:\/\/ditu.amap.com\/place\/[A-Z0-9]+$/);assert.ok(p.lon>108&&p.lon<110&&p.lat>34&&p.lat<35);assert.ok(p.checkedAt&&p.semantics);}
});
test('向东坐标向右、向北向上；投影在图框内且距离近似等比',()=>{
 const box={x:10,y:20,w:1000,h:500},pr=projection(places,box);
 for(const a of places){const q=pr.point(a);assert.ok(q.x>=9.99&&q.x<=1010.01&&q.y>=19.99&&q.y<=520.01);for(const b of places){const z=pr.point(b);if(a.lon<b.lon)assert.ok(q.x<z.x);if(a.lat<b.lat)assert.ok(q.y>z.y);if(a!==b)assert.ok(Math.abs(Math.hypot(z.x-q.x,z.y-q.y)/pr.scale/distanceKm(a,b)-1)<.003);}}
});
test('关键旅游关系及距离数量级正确，直线距离对称',()=>{
 const by=id=>places.find(p=>p.id===id),bell=by('bell');
 assert.ok(by('drum').lon<bell.lon);assert.ok(by('pagoda').lat<bell.lat);assert.ok(by('terracotta').lon>bell.lon&&by('terracotta').lat>bell.lat);assert.ok(by('airport-t5').lon<bell.lon&&by('airport-t5').lat>bell.lat);
 assert.ok(distanceKm(bell,by('terracotta'))>30&&distanceKm(bell,by('terracotta'))<40);
 assert.ok(distanceKm(bell,by('drum'))<.5);assert.equal(distanceKm(bell,bell),0);
 assert.ok(Math.abs(distanceKm(bell,by('terracotta'))-distanceKm(by('terracotta'),bell))<1e-10);
});
test('每幅图在每个选中状态都能安排标签，全部可见地点拥有可访问标签',()=>{
 for(const [key,v] of Object.entries(views))for(const selected of v.ids){const svg=renderMap(key,selected);for(const id of v.ids)assert.ok(svg.includes(`data-place="${id}"`));assert.ok(svg.includes('比例尺'));assert.ok(!/NaN|undefined/.test(svg));}
});
test('导出依据保留13条来源，拒绝缺失坐标与未知视图',()=>{
 assert.equal(JSON.parse(JSON.stringify(exportDataset())).places.length,13);
 assert.throws(()=>projection([{lat:34}],{x:0,y:0,w:100,h:100}));assert.throws(()=>renderMap('unknown'));
});
