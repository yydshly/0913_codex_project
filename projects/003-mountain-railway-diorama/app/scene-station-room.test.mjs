import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from './vendor/three.module.js';
import {createSpatial} from './scene-world.mjs';import {createStation} from './scene-station.mjs';
const build=composition=>createStation(new THREE.Group(),createSpatial({composition}),()=>new THREE.Texture());
function cast(station,from,direction,far=Infinity){station.group.updateWorldMatrix(true,true);return new THREE.Raycaster(station.group.localToWorld(new THREE.Vector3(...from)),new THREE.Vector3(...direction).transformDirection(station.group.matrixWorld),0,far).intersectObjects(station.group.children,true);}

test('三种构图的站房两门关闭阻挡、打开后通行；背墙保持封闭',()=>{
 for(const c of ['ridge','marsh','classic']){const s=build(c),y=s.layout.top+1;
  const passages=[[[-3,y,0],[-1,0,0],1.6],[[-5.4,y,5],[0,0,-1],1.4]];
  for(const args of passages)assert.ok(cast(s,...args).length>0,c+' closed');
  s.setInspection({doors:true});for(const args of passages)assert.equal(cast(s,...args).length,0,c+' open');
  assert.ok(cast(s,[-9,y,0],[1,0,0],.8).length>0);
  assert.equal(cast(s,[-5.6,y,.5],[0,0,1],1).length,0,'内部通门不能被隔墙填住');
 }
});
test('侧门平台接回站台，室内地板不被旧基础覆盖',()=>{
 for(const c of ['ridge','marsh','classic']){const s=build(c),top=s.layout.top;
  for(const x of[-5.4,-4.8,-4.2,-3.9]){const hits=cast(s,[x,top+1.5,4.8],[0,-1,0]);assert.ok(hits.length);assert.ok(Math.abs(s.group.worldToLocal(hits[0].point).y-top)<.001);}
  const hits=cast(s,[-6.4,top+.4,-.3],[0,-1,0],1);assert.equal(hits[0].object.material.color.getHexString(),'aba58f');
 }
});
test('侧窗射线先遇真实透明玻璃；揭顶保留房间、墙体和灯光',()=>{
 const s=build('ridge'),hits=cast(s,[-3.7,2.15,2.8],[-1,0,0],.8);
 assert.ok(hits.length);assert.equal(hits[0].object.material.transparent,true);
 s.setInspection({cutaway:true,doors:true});assert.equal(s.shelter.visible,false);assert.equal(s.room.shell.visible,true);assert.equal(s.room.interior.visible,true);
 s.update(1);assert.ok(s.room.lights.every(l=>l.intensity>0));s.update(0);assert.ok(s.room.lights.every(l=>l.intensity===0));
 s.setInspection();assert.equal(s.shelter.visible,true);assert.ok(s.room.doors.every(d=>d.rotation.y===0));
});
