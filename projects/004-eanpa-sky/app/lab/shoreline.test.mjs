import test from 'node:test';
import assert from 'node:assert/strict';
import {waterAt,waterLevel,retreatMemory} from './shoreline.js';
import {groundSurfaceAt} from './surface-state.js';
import {makeAtmosphereTransition,sequenceStatus} from './weather-response.js';
test('shoreline expands with water height and retreats on the same terrain',()=>{
 const areas=[.1,.4,.8].map(fill=>{let sum=0;for(let z=3.8;z<5.2;z+=.025)for(let x=-4.15;x<-1.85;x+=.025)sum+=waterAt(x,z,fill).coverage;return sum;});
 assert.ok(areas[0]<areas[1]&&areas[1]<areas[2]);assert.equal(waterAt(-3,4.5,0).coverage,0);
 assert.equal(waterAt(0,0,1).coverage,0);assert.ok(waterLevel(.4)<waterLevel(.8));
 for(let x=-4.1;x<-1.9;x+=.05){const w=waterAt(x,4.5,.6);assert.equal(groundSurfaceAt(x,4.5,.6).kind==='water',w.coverage>.08);}
});
test('damp shoreline outlasts retreat and remains frozen on pause',()=>{
 let reach=.8;for(let i=0;i<600;i++)reach=retreatMemory(reach,.2,.1);
 assert.ok(reach>.2&&reach<.8);assert.equal(retreatMemory(reach,.2,0),reach);assert.equal(retreatMemory(reach,.9,.1),.9);
});
test('atmosphere follows engine easing and interruption continues from its current value',()=>{
 const blend=makeAtmosphereTransition(),t=p=>({active:true,target:'rain',rawProgress:p,easedProgress:p});
 const start=blend('rain',.016,t(0));assert.equal(start.clock,'engine');
 const half=blend('rain',.016,t(.5));assert.equal(half.progress,.5);assert.ok(Math.abs(half.fog-.0034)<1e-8);
 const reverse=blend('clear',.016,{active:true,target:'clear',rawProgress:0,easedProgress:0});assert.equal(reverse.fog,half.fog);
 const end=blend('clear',.016,{active:false,target:'clear',rawProgress:1,easedProgress:1});assert.ok(Math.abs(end.fog-.0009)<1e-12);
});
test('progress describes four stages and clamps countdown at completion',()=>{
 assert.deepEqual([0,12,40,52,110].map(t=>sequenceStatus(t).stage),['gathering','raining','clearing','drying','complete']);
 assert.equal(sequenceStatus(52).remaining,58);assert.equal(sequenceStatus(200).remaining,0);assert.equal(sequenceStatus(-1).progress,0);
});

test('restarting the same weather does not rewind fog to the previous weather',()=>{
 const blend=makeAtmosphereTransition();blend('rain',.016,{active:true,target:'rain',rawProgress:0,easedProgress:0});
 const settled=blend('rain',.016,{active:false,target:'rain',rawProgress:1,easedProgress:1});
 const restarted=blend('rain',.016,{active:true,target:'rain',rawProgress:0,easedProgress:0});assert.equal(restarted.fog,settled.fog);
});

test('a weather command dispatched on the next frame adopts the engine clock',()=>{
 const blend=makeAtmosphereTransition();blend('rain',.016,{active:false,target:'none',rawProgress:1,easedProgress:1});
 const next=blend('rain',.016,{active:true,target:'rain',rawProgress:0,easedProgress:0});assert.equal(next.clock,'engine');
 const later=blend('rain',.016,{active:true,target:'rain',rawProgress:.4,easedProgress:.352});assert.equal(later.progress,.352);
});
