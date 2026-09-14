import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceGround,advanceAtmosphere,rainSequencePhase} from './weather-response.js';
import {impactSamples,detailCutoff} from './impact-audio.js';
test('rain builds moisture, clearing preserves it, pools recede before porous soil dries',()=>{
 let g={puddle:0,moisture:0};for(let i=0;i<400;i++)g=advanceGround(g,.7,.1,{cloud:1});
 assert.ok(g.puddle>.6&&g.moisture>.65);
 const wet={...g};g=advanceGround(g,0,0);assert.equal(g.puddle,wet.puddle);assert.equal(g.moisture,wet.moisture);
 for(let i=0;i<600;i++)g=advanceGround(g,0,.1,{hours:13,wind:4,cloud:0});
 assert.ok(g.moisture>g.puddle);assert.ok(g.puddle<wet.puddle*.5);assert.ok(g.moisture>.3);
});
test('sunshine and wind accelerate drying, night and cloud retain moisture',()=>{
 let day={puddle:.8,moisture:.9},night={...day};
 for(let i=0;i<600;i++){day=advanceGround(day,0,.1,{hours:12,wind:6,cloud:0});night=advanceGround(night,0,.1,{hours:0,wind:0,cloud:1});}
 assert.ok(day.puddle<night.puddle&&day.moisture<night.moisture);
});
test('atmosphere transitions continuously and the demonstration has bounded phases',()=>{
 const clear={fog:.0009,cloud:.02},start=advanceAtmosphere(clear,'storm',0);assert.deepEqual(start,clear);
 const first=advanceAtmosphere(clear,'storm',.1);assert.ok(first.fog>clear.fog&&first.fog<.008);
 let a=first;for(let i=0;i<400;i++)a=advanceAtmosphere(a,'storm',.1);assert.ok(a.fog>.0079);
 assert.deepEqual([0,39.9,40,109.9,110].map(rainSequencePhase),['rain','rain','drying','drying','complete']);
});
test('contact variants stay finite, fade out, differ in timbre and attenuate high frequencies with distance',()=>{
 for(const kind of ['earth','stone','roof','hail-foliage','hail-water','hail-stone']){
  const bank=Array.from({length:6},(_,i)=>impactSamples(kind,48000,i));
  for(const a of bank){assert.ok(a.every(Number.isFinite));assert.ok(a.some(v=>Math.abs(v)>.001));assert.ok(a.every(v=>Math.abs(v)<.4));assert.ok(Math.abs(a.at(-1))<.0001);}
  for(let i=1;i<6;i++)assert.notDeepEqual(bank[i],bank[i-1]);
 }
 assert.ok(detailCutoff(2)>detailCutoff(15));assert.ok(detailCutoff(200)>=600);
});
