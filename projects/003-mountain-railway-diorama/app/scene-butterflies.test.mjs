import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from './vendor/three.module.js';
import {createSpatial,V}from './scene-world.mjs';import{stationLayout,stationOccupies}from './scene-station-layout.mjs';
import{butterflySites,butterflySeason,createButterflies,createButterflyMotion}from './scene-butterflies.mjs';
const shared=()=>({time:{value:0},season:{value:new THREE.Vector4(1,0,0,0)},night:{value:0},rain:{value:0},wind:{value:.4},lifeSeed:{value:3521}});
test('花丛随机分布可复现、重新分布有效，并避开铁路站房水面',()=>{
 for(const composition of ['ridge','marsh','classic']){const w=createSpatial({composition}),l=stationLayout(w),a=butterflySites(w,[],3521);assert.ok(a.length>=3);assert.deepEqual(a,butterflySites(w,[],3521));assert.notDeepEqual(a,butterflySites(w,[],11440));
  for(const s of a)for(let i=0;i<24;i++){const x=s.x+3*Math.cos(i*Math.PI/12),z=s.z+3*Math.sin(i*Math.PI/12);assert.ok(w.footprint(x,z));assert.ok(!stationOccupies(l,x,z,1));assert.ok(w.closest(x,z).distance>3.7);assert.ok(Math.abs(x-w.riverX(z))>w.halfWidth(z)+1);}
 }
});
test('春夏活动多于秋季，冬季隐藏，夜雨强风抑制飞行',()=>{
 assert.ok(butterflySeason([1,0,0,0]).abundance>butterflySeason([0,0,1,0]).abundance);
 assert.equal(butterflySeason([0,0,0,1]).abundance,0);
 for(const [night,rain,wind]of[[1,0,0],[0,1,0],[0,0,1]])assert.equal(butterflySeason([0,1,0,0],night,rain,wind).flight,0);
});
test('实际蝶群连续访花不穿地、不急转；暂停冻结，雨天落花休息',()=>{
 const w=createSpatial({composition:'ridge'}),s=shared(),b=createButterflies(new THREE.Group(),w,s);let sawFlight=false;
 for(let k=1;k<=1800;k++){const previous=b.actors.map(a=>({p:a.motion.position.clone(),yaw:a.motion.yaw}));b.update(k*.05,0);
  b.actors.forEach((a,i)=>{const m=a.motion,p=m.position;assert.ok(p.y>=w.height(p.x,p.z)+.15);assert.ok(p.distanceTo(previous[i].p)<.17);const angle=Math.atan2(Math.sin(m.yaw-previous[i].yaw),Math.cos(m.yaw-previous[i].yaw));assert.ok(Math.abs(angle)<.121);});sawFlight ||=b.stats.flying>0;
 }
 const blocked=createButterflyMotion(w,[V(-1,4,0),V(1,4,0)],9,[{x:0,z:0}]);for(let k=0;k<600;k++)blocked.update(.1,true);assert.equal(blocked.visits,0,'不应强行穿过树干');assert.ok(sawFlight);assert.ok(b.actors.every(a=>a.motion.visits>0));
 const positions=b.actors.map(a=>a.root.position.clone()),wing=b.actors[0].wings[0].pivot.rotation.z;b.update(90,0);b.actors.forEach((a,i)=>assert.ok(a.root.position.equals(positions[i])));assert.equal(b.actors[0].wings[0].pivot.rotation.z,wing);
 s.rain.value=1;for(let k=1;k<=500;k++)b.update(90+k*.05,0);assert.equal(b.stats.flying,0);assert.equal(b.stats.resting,b.stats.visible);
 s.season.value.set(0,0,0,1);b.update(116,0);assert.equal(b.stats.visible,0);assert.ok(b.patches.every(p=>!p.root.visible));
 b.redistribute(777);assert.ok(b.actors.every(a=>!a.motion||a.root.position.toArray().every(Number.isFinite)));
});
