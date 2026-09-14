import test from 'node:test';
import assert from 'node:assert/strict';
import {hailSurfaceAt,stepHail,restitution,hailExpired} from './hail-weather.js';
import {detailAllowed,farHailGain} from './soundscape.js';
import {sceneSurfaceAt,canopyHeightAt,groundSurfaceAt} from './surface-state.js';
import {engineWeatherFor} from './snow-weather.js';
const particle=()=>({x:0,y:2,z:0,vx:1,vz:0,vy:-10,radius:.02,bounces:0});
test('stone rebounds more than roof, earth, snow or water',()=>{
 assert.ok(restitution.stone>restitution.roof&&restitution.roof>restitution.earth&&restitution.earth>restitution.snow);
 for(const kind of Object.keys(restitution)){
  const p=particle();let impacts=[];
  for(let i=0;i<1200&&p.rest===undefined;i++)impacts.push(...stepHail(p,1/120,()=>({y:0,kind})));
  assert.ok(p.rest!==undefined,kind+' settles');assert.ok(p.bounces<=3);
  assert.ok(impacts.length>=1);assert.equal(impacts[0].kind,'hail-'+kind);
  assert.ok(p.y>=p.radius-1e-9);assert.equal(p.vy,0);
  for(let i=1;i<impacts.length;i++)assert.ok(impacts[i].speed<impacts[i-1].speed);
 }
});
test('collision catches fast drops, pause does not advance physics, frame rates agree',()=>{
 const p=particle();p.y=.3;p.vy=-100;assert.ok(stepHail(p,.1,()=>({y:0,kind:'stone'})).length>0);assert.ok(p.y>=p.radius);
 const a=particle(),b=particle(),before={...a};stepHail(a,0,()=>({y:0,kind:'stone'}));assert.deepEqual(a,before);
 for(let i=0;i<30;i++)stepHail(a,1/30,()=>({y:0,kind:'stone'}));
 for(let i=0;i<120;i++)stepHail(b,1/120,()=>({y:0,kind:'stone'}));
 assert.ok(Math.abs(a.y-b.y)<.01);assert.equal(a.bounces,b.bounces);
});
test('authored roof, path, earth and water surfaces stay distinct',()=>{
 assert.equal(hailSurfaceAt(-4,-4).kind,'roof');assert.equal(hailSurfaceAt(8,-13).y,3.87);
 assert.equal(hailSurfaceAt(.7,4).kind,'stone');assert.equal(hailSurfaceAt(-6,4).kind,'earth');
 assert.equal(hailSurfaceAt(-3,4.5,1).kind,'water');assert.equal(engineWeatherFor('hail'),'overcast');
});
test('hail sound comes from hail impacts and does not leak into rain-only or wind-only',()=>{
 for(const focus of ['all','details','hail'])assert.ok(detailAllowed(focus,'hail-stone'));
 for(const focus of ['rain','wind','thunder'])assert.equal(detailAllowed(focus,'hail-stone'),false);
 assert.equal(detailAllowed('hail','roof'),false);assert.equal(detailAllowed('rain','roof'),true);
});

test('sideways entry below a roof cannot teleport hail onto its top',()=>{
 const p={...particle(),x:1.27,y:1,z:0,vx:-1,vy:-1};
 const hits=stepHail(p,.05,hailSurfaceAt);
 assert.equal(hits.length,0);assert.ok(p.y<1);assert.ok(p.x<1.25);
 for(let i=0;i<120&&p.rest===undefined;i++)hits.push(...stepHail(p,1/120,hailSurfaceAt));
 assert.ok(hits.length>0);assert.ok(hits.every(e=>e.kind!=='hail-roof'));assert.ok(p.y<1);
 const above={...particle(),x:-4,z:-4,y:5.4};
 assert.equal(stepHail(above,.05,hailSurfaceAt)[0]?.kind,'hail-roof');
});

test('layered surfaces preserve sheltered floors, canopy contacts and finite paths',()=>{
 assert.equal(sceneSurfaceAt(-4,-4,{ceiling:1,snow:1}).y,.35);
 assert.equal(sceneSurfaceAt(-4,-4,{ceiling:1,snow:1}).kind,'stone');
 assert.equal(sceneSurfaceAt(-4,-4,{ceiling:.1}),null);
 assert.ok(canopyHeightAt(-8,6)>3);assert.equal(sceneSurfaceAt(-8,6).kind,'foliage');
 assert.equal(sceneSurfaceAt(-8,6,{ceiling:1}).y,.43);
 assert.equal(groundSurfaceAt(.7,40).kind,'earth');
 const p={...particle(),x:-8,z:6,y:7,vy:-20},hits=[];
 for(let i=0;i<90&&p.rest===undefined;i++)hits.push(...stepHail(p,1/120,hailSurfaceAt));
 assert.equal(hits[0]?.kind,'hail-foliage');assert.ok(p.y>3);
});

test('far hail bed bridges overview distance while staying absent close up and outside range',()=>{
 assert.equal(farHailGain(0),0);assert.equal(farHailGain(8),0);
 for(const distance of [22,35,50])assert.ok(farHailGain(distance)>.1);
 assert.equal(farHailGain(110),0);assert.equal(farHailGain(200),0);
});

test('escaped or overlong hail cycles are reclaimed after moving surfaces and weather changes',()=>{
 assert.equal(hailExpired({y:3,age:2}),false);
 assert.equal(hailExpired({y:-3,age:2}),true);
 assert.equal(hailExpired({y:3,age:8.1}),true);
 assert.equal(hailExpired({y:NaN,age:1}),true);
});
