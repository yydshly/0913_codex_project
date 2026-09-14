import test from 'node:test';import assert from 'node:assert/strict';import {newRide,stepRide,guideInput,road,nearest,surfaceAt,recover,length,readRideInput} from './ride-model.mjs';
import {PerspectiveCamera,Vector3} from './vendor/three.module.js';
test('keyboard and touch steering agree with rider left and right in the follow camera',()=>{
 for(const heading of [0,Math.PI/2,Math.PI])for(const [control,right,touch] of [['a',false,false],['arrowleft',false,false],['left',false,true],['d',true,false],['arrowright',true,false],['right',true,true]]){
  const r={...newRide(),heading,velocityHeading:heading,speed:5,status:'running',started:true},origin={x:r.x,z:r.z};
  const camera=new PerspectiveCamera(52,1,.1,350);camera.position.set(r.x-Math.sin(heading)*8,5.6,r.z-Math.cos(heading)*8);camera.lookAt(r.x+Math.sin(heading)*5,1.2,r.z+Math.cos(heading)*5);camera.updateMatrixWorld();
  const input=readRideInput(new Set(touch?[]:[control]),new Map(touch?[[1,control]]:[]));
  for(let i=0;i<60;i++)stepRide(r,1/120,input);
  const screen=new Vector3(r.x,.02,r.z).project(camera),center=new Vector3(origin.x,.02,origin.z).project(camera);
  assert.ok(right?screen.x>center.x+.01:screen.x<center.x-.01,`${control} reversed at heading ${heading}`);
 }
 assert.equal(readRideInput(new Set(['a','d']),new Map()).steer,0);
});
test('no steering does not secretly follow the curve',()=>{const r=newRide();for(let i=0;i<900&&!r.contacts;i++){assert.ok(Math.abs(r.x)<.01);assert.ok(Math.abs(r.heading)<.01);stepRide(r,1/120,{throttle:1})}assert.ok(r.gate<3);assert.ok(r.offroadTime>0||r.contacts>0)});
test('manual steering changes heading and world position independently of road',()=>{const r=newRide();for(let i=0;i<180;i++)stepRide(r,1/120,{throttle:1,steer:.4});assert.ok(r.x>.2);assert.ok(Math.abs(r.heading)>.1)});
test('two demonstrations use the same physics and finish with different line exposure',()=>{const results={};for(const mode of ['inner','outer']){const r=newRide();for(let i=0;i<120*90&&r.status!=='finished';i++)stepRide(r,1/120,guideInput(r,mode));assert.equal(r.status,'finished',`${mode} failed: ${JSON.stringify(r)}`);assert.equal(r.contacts,0);results[mode]=r}assert.ok(results.inner.mudTime>results.outer.mudTime+2);assert.ok(results.inner.distance<results.outer.distance);assert.ok(results.inner.time>results.outer.time);console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,r])=>[k,{time:r.time,distance:r.distance,mud:r.mudTime,grass:r.offroadTime}]))))});
test('mud creates larger heading-velocity separation than hard soil at the same speed',()=>{function run(lane){const p=road(60,lane),r={...newRide(),x:p.x,z:p.z,heading:p.heading,velocityHeading:p.heading,speed:11,status:'running',started:true};for(let i=0;i<30;i++)stepRide(r,1/120,{steer:1});return Math.abs(r.slip)}assert.ok(run(3)>run(-3))});
test('barrier catches high-speed escape and penalizes impact, recovery keeps progress',()=>{const r={...newRide(),x:8.9,z:-18,heading:Math.PI/2,velocityHeading:Math.PI/2,speed:18,status:'running',started:true,gate:1};stepRide(r,1/120,{});assert.ok(nearest(r.x,r.z).distance<=9);assert.ok(r.speed<8);assert.equal(r.contacts,1);recover(r);assert.equal(r.gate,1);assert.equal(r.penalty,5);assert.equal(r.speed,0)});
test('finish cannot be reached by skipping ordered checkpoints',()=>{const p=road(length-4),r={...newRide(),x:p.x,z:p.z,heading:p.heading,velocityHeading:p.heading,speed:5,status:'running',started:true};for(let i=0;i<50;i++)stepRide(r,1/120,{throttle:1});assert.notEqual(r.status,'finished');assert.equal(r.gate,0)});
test('braking stops the bike and invalid update durations are rejected',()=>{const r={...newRide(),speed:8,status:'running',started:true};for(let i=0;i<300;i++)stepRide(r,1/120,{brake:1});assert.equal(r.speed,0);assert.throws(()=>stepRide(r,.5,{}));assert.throws(()=>stepRide(r,NaN,{}))});
