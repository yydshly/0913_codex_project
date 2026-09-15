import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from './vendor/three.module.js';
import{createSpatial}from'./scene-world.mjs';import{stationLayout}from'./scene-station-layout.mjs';import{compositions}from'./scene-composition.mjs';import{createPersonBehavior,stationPeopleRoutes,stationWalkHeight,createPeople}from'./scene-people.mjs';
test('四位旅客完整循环包含候车、坐下、起身和入口往返，始终避开铁路与站房',()=>{
 for(const[composition,preset]of Object.entries(compositions)){const w=createSpatial({composition,...preset.terrain}),l=stationLayout(w),people=stationPeopleRoutes(l).map((p,i)=>createPersonBehavior(l,p,i)),states=new Set();let entry=false,platform=false;
 for(let k=0;k<6000;k++)for(const p of people){const before=p.position.clone();p.update(.05,{},people);states.add(p.state);assert.ok(Math.hypot(p.position.x-before.x,p.position.z-before.z)<.04);const q=l.toWorld(p.position.x,p.position.y,p.position.z);assert.ok(w.closest(q.x,q.z).distance>1.8);assert.ok(!(p.position.x<-4.15&&Math.abs(p.position.z)<4.3));for(const o of people)if(o!==p)assert.ok(Math.hypot(o.position.x-p.position.x,o.position.z-p.position.z)>.57);if(p===people[3]){entry ||=p.position.x<-7;platform ||=p.position.x>-3;}}
 for(const s of ['行走','候车','坐下','起身','坐着休息'])assert.ok(states.has(s),s);assert.ok(entry&&platform,composition);
 }
});
test('三种构图中人物支撑脚锁定落点并贴合站台与台阶，关节数值有效',()=>{
 for(const[composition,preset]of Object.entries(compositions)){
 const l=stationLayout(createSpatial({composition,...preset.terrain})),shared={time:{value:0},night:{value:0},rain:{value:0},season:{value:new THREE.Vector4(0,1,0,0)}},a=createPeople({layout:l,group:new THREE.Group()},shared);
 for(let k=1;k<6000;k++){const old=a.people.map(p=>p.legs.map(f=>({phase:f.phase,p:f.point.clone()})));a.update(k*.05,0);
 for(const[pidx,p]of a.people.entries())for(const[i,f]of p.legs.entries()){assert.ok(f.point.toArray().every(Number.isFinite));assert.ok(f.point.y>=stationWalkHeight(l,f.point.x,f.point.z)+.045,`foot ${composition} ${pidx} ${f.phase} ${f.point.toArray()}`);for(const m of[f.upper,f.lower,f.foot])assert.ok([...m.position.toArray(),...m.scale.toArray(),...m.quaternion.toArray()].every(Number.isFinite));if(f.phase===1&&old[pidx][i].phase===1)assert.ok(f.point.equals(old[pidx][i].p));}
 }
 }
});
test('暂停保留人物位置与脚步，冬季围巾和雨伞正常切换',()=>{
 const shared={time:{value:0},night:{value:0},rain:{value:0},season:{value:new THREE.Vector4(0,1,0,0)}},a=createPeople({layout:stationLayout(createSpatial()),group:new THREE.Group()},shared);for(let k=0;k<80;k++)a.update(k*.05,0);
 const p=a.people.map(p=>({pos:p.root.position.clone(),feet:p.legs.map(l=>l.point.clone())}));a.update(3.95,0);a.people.forEach((x,i)=>{assert.ok(x.root.position.equals(p[i].pos));x.legs.forEach((l,j)=>assert.ok(l.point.equals(p[i].feet[j])));});shared.season.value.set(0,0,0,1);shared.rain.value=.7;a.update(4,0);a.people.forEach(p=>{assert.ok(p.wrap.visible);assert.equal(p.canopy.visible,p!==a.people[2]);p.root.traverse(o=>{if(o.material)assert.ok(o.material.userData.seasonOwn);});});
});
