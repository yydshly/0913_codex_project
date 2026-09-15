import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createTrain} from './scene-train.mjs';
import {createSpatial} from './scene-world.mjs';

test('三种构图的司机视线穿过挡风玻璃，客窗后没有实心侧壁',()=>{
 for(const composition of ['ridge','marsh','classic']){
  const train=createTrain(new THREE.Group(),createSpatial({composition}),0,()=>new THREE.Texture()),car=train.cars[0];
  car.updateWorldMatrix(true,true);
  const cast=(origin,direction)=>new THREE.Raycaster(car.localToWorld(origin.clone()),direction.clone().transformDirection(car.matrixWorld)).intersectObjects(car.children,true);
  const forward=cast(train.cab.eye,new THREE.Vector3(0,0,1));
  assert.equal(forward[0].object.name,'驾驶室前挡风玻璃',composition);
  assert.equal(forward[0].object.material.transparent,true);
  const side=cast(new THREE.Vector3(-3,2.01,0),new THREE.Vector3(1,0,0));
  assert.ok(side.length>=2);
  assert.ok(side.every(hit=>hit.object.material.transparent),composition);
  assert.equal(train.cab.driver.parent,train.cab.group);
 }
});

test('停靠后同步车体位置，司机和雨刷随运行更新，暂停冻结',()=>{
 const world=createSpatial(),train=createTrain(new THREE.Group(),world,.2,()=>new THREE.Texture());
 const before=train.cars[0].position.clone();train.service.park();train.update(0,0,{paused:true,night:0});
 assert.ok(before.distanceTo(train.cars[0].position)>1);
 const u=train.service.progress,a=world.curve.getPointAt((u-1.65/world.length+1)%1),b=world.curve.getPointAt((u+1.65/world.length)%1);
 assert.ok(train.cars[0].position.distanceTo(a.add(b).multiplyScalar(.5))<1e-5);
 const cab=train.cab;cab.update(.1,1,{speed:3,rain:.9});const w=cab.wipers[0].rotation.z,t=cab.throttle.rotation.x;
 cab.update(.1,8,{speed:0,rain:.9,paused:true});assert.equal(cab.wipers[0].rotation.z,w);assert.equal(cab.throttle.rotation.x,t);
 cab.update(.1,8,{speed:3,rain:.9});assert.notEqual(cab.wipers[0].rotation.z,w);assert.equal(cab.driver.userData.activity,'驾驶中');
});
