import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createSpatial} from './scene-world.mjs';
import {createRiverRocks} from './scene-rocks.mjs';
import {reserveAnimalShore,shoreHabitats,createDuckBehavior,createBirdBehavior,createFishBehavior} from './scene-animal-behavior.mjs';
import {createFish} from './scene-fish.mjs';
const prepare=(settings={})=>{const w=createSpatial(settings);w.riverRocks=createRiverRocks(w);const sites=shoreHabitats(w);w.riverRocks=reserveAnimalShore(w.riverRocks,sites);return{w,sites};};
test('野鸭完整行为链连续、贴地贴水且保留身体间距',()=>{
 const {w,sites}=prepare();assert.equal(sites.length,3);const ducks=sites.map((_,i)=>createDuckBehavior(w,sites,i)),states=new Set();
 for(let i=0;i<6000;i++)for(const d of ducks){const p=d.position.clone();d.update(.05,{},ducks);states.add(d.state);assert.ok(p.distanceTo(d.position)<.055,`jump ${d.state}`);assert.ok(w.closest(d.position.x,d.position.z).distance>3);assert.ok(d.position.y>=w.height(d.position.x,d.position.z)+.27);for(const o of ducks)if(o!==d)assert.ok(Math.hypot(o.position.x-d.position.x,o.position.z-d.position.z)>1.19);}
 for(const state of ['游泳','水中停留','靠岸','上岸','行走','岸边休息','下水'])assert.ok(states.has(state),state);
 for(const d of ducks){const p=d.position.clone();d.update(0,{},ducks);assert.ok(p.equals(d.position));}
});
test('白鹭起落连续，落地后收翼伸腿，夜间先落地再停栖',()=>{
 const {w,sites}=prepare();const b=createBirdBehavior(w,sites,0),states=new Set();
 for(let i=0;i<7200;i++){const p=b.position.clone();b.update(.05,{});states.add(b.state);assert.ok(p.distanceTo(b.position)<.35);assert.ok(b.position.y>w.height(b.position.x,b.position.z)+.49);if(b.state==='停栖'){assert.equal(b.fold,1);assert.equal(b.legs,1);assert.ok(b.position.distanceTo(b.home.clone().add(new THREE.Vector3(0,.66,0)))<1e-8);}}
 for(const s of ['起飞','降落','停栖','飞离河谷','远处飞行','返回河谷'])assert.ok(states.has(s),s);
 for(let i=0;i<6000;i++)b.update(.05,{night:1});assert.equal(b.state,'停栖');const p=b.position.clone();b.update(0,{});assert.ok(p.equals(b.position));
});
test('鱼群三分钟连续转向，水深约束有效，各自有缓游和停留',()=>{
 for(const width of[3,8]){const {w}=prepare({width,waterMode:'rocky'}),a=createFishBehavior(w),states=new Set();
 for(let k=0;k<3600;k++){const before=a.fish.map(f=>f.position.clone());a.update(.05,{});a.fish.forEach((f,i)=>{states.add(f.state);assert.ok(a.valid(f.position));assert.ok(before[i].distanceTo(f.position)<.04);assert.ok(Math.abs(f.pitch)<=.1);});}
 for(const s of ['悬停','缓游','短促游动'])assert.ok(states.has(s));}
});
test('新鱼群运动中的完整鱼身位于水面和河床之间',()=>{
 for(const width of[3,8]){const w=createSpatial({width,waterMode:'rocky'}),shared={time:{value:0},night:{value:0},season:{value:new THREE.Vector4(0,0,0,1)},flow:{value:1}},a=createFish(new THREE.Group(),w,shared),v=new THREE.Vector3();
 for(let frame=1;frame<=600;frame++){a.update(frame*.1,0);if(frame%30)continue;a.group.updateMatrixWorld(true);a.group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(v.y<w.waterSurface(v.x,v.z)-.05,'surface');assert.ok(v.y>w.height(v.x,v.z)+.03,'bed');}});}}
});
test('三构图三水流的岸坡样点避让铁路与岩石；无安全通道时不生成动物',()=>{
 for(const composition of['classic','ridge','marsh'])for(const waterMode of['continuous','stream','rocky'])for(const width of[3,8,11]){const{w,sites}=prepare({composition,waterMode,width});for(const s of sites)for(const p of s.path){assert.ok(w.closest(p.x,p.z).distance>4);for(const r of w.riverRocks)assert.ok(Math.hypot(p.x-r.x,p.z-r.z)>Math.max(r.rx,r.rz)+.6);}}
 const w=createSpatial();w.animalObstacles=[{x:0,z:0,radius:200}];assert.equal(shoreHabitats(w).length,0);assert.equal(createDuckBehavior(w,[],0),null);assert.equal(createBirdBehavior(w,[],0),null);
});

test('实际植被布局中的栖息点可完成起落和岸边活动',async()=>{
 const {createVegetation}=await import('./scene-vegetation.mjs'),{compositions}=await import('./scene-composition.mjs');
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 try{for(const [composition,preset]of Object.entries(compositions)){
  const w=createSpatial({composition,...preset.terrain}),group=new THREE.Group(),v=createVegetation(group,w,{});w.riverRocks=createRiverRocks(w);w.animalObstacles=[...v.regionDetails.rocks.map(r=>({x:r.x,z:r.z,radius:r.scale*1.5})),...v.regionDetails.shrubs.map(r=>({x:r.x,z:r.z,radius:.7}))];const sites=shoreHabitats(w);assert.ok(sites.length>0,composition);
  w.riverRocks=reserveAnimalShore(w.riverRocks,sites);
  const birds=sites.map((_,i)=>createBirdBehavior(w,sites,i)),ducks=sites.map((_,i)=>createDuckBehavior(w,sites,i)),bs=new Set(),ds=new Set();
  for(let k=0;k<4800;k++){for(const b of birds){b.update(.05,{});bs.add(b.state);for(const t of w.groundTrees)if(Math.hypot(b.position.x-t.x,b.position.z-t.z)<1.8)assert.ok(b.position.y>t.y+t.height+.9);}
   for(const d of ducks){d.update(.05,{},ducks);ds.add(d.state);for(const r of w.riverRocks)assert.ok(Math.hypot(d.position.x-r.x,d.position.z-r.z)>Math.max(r.rx,r.rz)+.59);}}
  for(const s of ['起飞','降落','停栖','飞离河谷','远处飞行','返回河谷'])assert.ok(bs.has(s),composition+s);for(const s of['上岸','游泳','行走'])assert.ok(ds.has(s),composition+s);
  group.traverse(o=>{o.geometry?.dispose();});
 }}finally{globalThis.document=previous;}
});

test('完整航程每段切向一致，白鹭实际飞出岛屿再连续返回',async()=>{
 const {createBirdJourney}=await import('./scene-animal-behavior.mjs');const{w,sites}=prepare();const journey=createBirdJourney(w,sites[0]);assert.ok(journey);
 const segments=journey.route.curves;for(let i=1;i<segments.length;i++){assert.ok(segments[i-1].getPoint(1).distanceTo(segments[i].getPoint(0))<1e-7);assert.ok(segments[i-1].getTangent(1).dot(segments[i].getTangent(0))>.9999);}
 const b=createBirdBehavior(w,sites,1);let maxDistance=0,away=false,returned=false,oldState=b.state;
 for(let i=0;i<7200;i++){const p=b.position.clone(),yaw=b.yaw;b.update(.05,{});const step=p.distanceTo(b.position),turn=Math.atan2(Math.sin(b.yaw-yaw),Math.cos(b.yaw-yaw));assert.ok(step<.23);if(!['停栖','准备起飞'].includes(b.state))assert.ok(Math.abs(turn)<.065,`turn ${turn} ${b.state}`);maxDistance=Math.max(maxDistance,Math.hypot(b.position.x,b.position.z));away ||= b.away;if(away&&b.state==='停栖'&&oldState!=='停栖')returned=true;oldState=b.state;}
 assert.ok(maxDistance>100);assert.ok(returned);
});
test('鱼鸭转向有角速度和角加速度上限，受阻不会附加强制偏转',()=>{
 const{w,sites}=prepare();const d=createDuckBehavior(w,sites,1),fish=createFishBehavior(w);let duckRate=0;const rates=fish.fish.map(()=>0);
 for(let k=0;k<3000;k++){let yaw=d.yaw;d.update(.05,{},[d]);const rate=(d.yaw-yaw)/.05;assert.ok(Math.abs(rate-duckRate)<=.8*.05+1e-8);assert.ok(Math.abs(rate)<.71);duckRate=rate;
 const before=fish.fish.map(f=>f.yaw);fish.update(.05,{});fish.fish.forEach((f,i)=>{const r=(f.yaw-before[i])/.05;assert.ok(Math.abs(r-rates[i])<=.65*.05+1e-8);assert.ok(Math.abs(r)<.76);rates[i]=r;});}
});
test('薄冰只覆盖冬季浅缓岸边，鸭子在冬季稳定状态避开冰区',async()=>{
 const{iceCoverage,frozenShore}=await import('./scene-ice.mjs');const{w,sites}=prepare();const site=sites[0];let maximum=0;
 for(const p of site.path){assert.equal(iceCoverage(w,p.x,p.z,0),0);maximum=Math.max(maximum,iceCoverage(w,p.x,p.z,1));}assert.ok(maximum>.7);assert.ok(frozenShore(w,site,1));assert.equal(iceCoverage(w,w.riverX(9),9,1),0);
 const ducks=sites.map((_,i)=>createDuckBehavior(w,sites,i));for(let k=0;k<4800;k++)ducks.forEach(d=>d.update(.05,{winter:1},ducks));
 for(const d of ducks){assert.ok(d.land>.8||iceCoverage(w,d.position.x,d.position.z,1)<.23,`${d.state} ${d.land}`);if(d.land>.8)assert.equal(d.state,'岸边休息');else assert.ok(['游泳','水中停留','下水'].includes(d.state));}
});
