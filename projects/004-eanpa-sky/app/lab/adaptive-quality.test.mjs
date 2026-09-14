import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAdaptiveQuality} from './adaptive-quality.js';
function driver(q){let now=0;return{run(seconds,fps,ms){const events=[];for(let i=0;i<seconds*fps;i++){now+=1000/fps;const event=q.sample(now,ms);if(event)events.push(event);}return events;},gap(ms){now+=ms;}};}
test('sustained load steps down, bounds the tier and obeys cooldown',()=>{
 const q=makeAdaptiveQuality(),d=driver(q);assert.equal(d.run(6,30,35).length,0);
 assert.equal(d.run(6,30,35).length,1);assert.equal(q.snapshot().level,1);
 assert.equal(d.run(15,30,35).length,0);d.run(60,30,35);assert.equal(q.snapshot().level,2);
});
test('recovery requires sustained headroom and moves one tier at a time',()=>{
 const q=makeAdaptiveQuality(),d=driver(q);d.run(70,30,35);assert.equal(q.snapshot().level,2);
 assert.equal(d.run(10,60,10).length,0);const events=d.run(100,60,10);
 assert.deepEqual(events.map(e=>e.level),[1,0]);
});
test('pause gaps and explicit interaction resets discard partial evidence',()=>{
 const q=makeAdaptiveQuality(),d=driver(q);d.run(6,30,35);d.gap(60000);
 assert.equal(d.run(6,30,35).length,0);q.resetWindow();assert.equal(d.run(6,30,35).length,0);
 q.reset();assert.equal(q.snapshot().level,0);assert.equal(q.sample(NaN,30),null);
});
test('one spike and borderline fps do not cause quality oscillation',()=>{
 const q=makeAdaptiveQuality(),d=driver(q);d.run(1,60,200);d.run(20,60,10);assert.equal(q.snapshot().level,0);
 d.run(60,48,20);assert.equal(q.snapshot().level,0);
});
