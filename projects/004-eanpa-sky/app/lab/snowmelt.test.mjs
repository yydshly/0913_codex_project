import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceSnowCover,snowmeltSequencePhase,snowmeltSequenceStatus} from './snowmelt.js';
import {advanceGround} from './weather-response.js';
import {appendBounded} from './runtime-history.js';
test('thaw loss equals water input; pause and ongoing snowfall do not invent melt',()=>{
 const before=.8,next=advanceSnowCover(before,{dt:.1,hours:12,cloud:0});
 assert.ok(next.cover<before);assert.ok(Math.abs(before-next.cover-next.meltwaterDelta)<1e-12);
 assert.equal(advanceSnowCover(before,{dt:0}).meltwaterDelta,0);
 const snow=advanceSnowCover(before,{dt:.1,snowing:true,intensity:.1});assert.ok(snow.cover>=before);assert.equal(snow.meltwaterDelta,0);
 assert.equal(advanceSnowCover(0,{dt:.1}).meltwaterDelta,0);
});
test('sunny thaw outpaces night and feeds dry ground without rainfall',()=>{
 let day=.8,night=.8,ground={puddle:0,moisture:0},melt=0;
 for(let i=0;i<900;i++){
  const next=advanceSnowCover(day,{dt:.1,hours:12,cloud:0});day=next.cover;melt+=next.meltwaterDelta;
  night=advanceSnowCover(night,{dt:.1,hours:0,cloud:0}).cover;
  ground=advanceGround(ground,0,.1,{hours:12,meltwater:next.meltwaterDelta});
 }
 assert.ok(day<night*.25);assert.ok(ground.moisture>.1&&ground.puddle>.05);
 assert.ok(Math.abs(melt+day-.8)<1e-10);
 const paused=advanceGround(ground,0,0,{meltwater:1});assert.equal(paused.moisture,ground.moisture);assert.equal(paused.puddle,ground.puddle);assert.equal(paused.meltInput,0);
});
test('melt allocation accounts for overflow and stays bounded under repeated cycles',()=>{
 let cover=0,ground={puddle:0,moisture:0};
 for(let i=0;i<18000;i++){
  const snowing=Math.floor(i/450)%2===0,snow=advanceSnowCover(cover,{dt:.1,snowing,intensity:1,hours:12});cover=snow.cover;
  ground=advanceGround(ground,snowing?0:.7,.1,{meltwater:snow.meltwaterDelta,hours:12});
  for(const value of [cover,ground.moisture,ground.puddle])assert.ok(Number.isFinite(value)&&value>=0&&value<=1);
  assert.ok(Math.abs(ground.meltInput-ground.meltSoil-ground.meltPool-ground.meltOverflow)<1e-12);
 }
 const saturated=advanceGround({puddle:1,moisture:1},1,.1,{meltwater:.2});assert.equal(saturated.meltOverflow,.2);
});
test('step sizes produce consistent melt transfer and demo boundaries are finite',()=>{
 const run=dt=>{let s=.8,g={puddle:0,moisture:0},water=0;for(let i=0;i<60/dt;i++){const n=advanceSnowCover(s,{dt,hours:12});s=n.cover;water+=n.meltwaterDelta;g=advanceGround(g,0,dt,{hours:12,meltwater:n.meltwaterDelta});}return{s,g,water};};
 const a=run(1/30),b=run(1/60);assert.ok(Math.abs(a.s-b.s)<1e-10);assert.ok(Math.abs(a.g.puddle-b.g.puddle)<.0001);assert.ok(Math.abs(a.water-b.water)<1e-10);
 assert.deepEqual([0,44.9,45,134.9,135].map(snowmeltSequencePhase),['snow','snow','melt','melt','complete']);
 assert.equal(snowmeltSequenceStatus(135).remaining,0);assert.equal(snowmeltSequenceStatus(135).progress,1);
});
test('event and runtime histories retain newest records with explicit discard counts',()=>{
 const events=[],samples=[];let dropped=0;
 for(let i=0;i<10000;i++)dropped+=appendBounded(events,{i},600);
 for(let i=0;i<2000;i++)appendBounded(samples,i,120);
 assert.equal(events.length,600);assert.equal(events[0].i,9400);assert.equal(dropped,9400);assert.equal(samples.length,120);assert.equal(samples[0],1880);
});
