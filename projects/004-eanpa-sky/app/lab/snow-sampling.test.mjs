import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSnowSurfaceSampler} from './snow-sampling.js';
import {sceneSurfaceAt} from './surface-state.js';
test('batched snow collision matches roof, ground and moving canopy reference',()=>{
 const sampler=makeSnowSurfaceSampler();
 for(const [time,wind,snow] of [[0,0,0],[3.7,4,.01],[19,12,.6],[99,30,1]]){
  sampler.prepare(time,wind,snow);
  for(let x=-24;x<=24;x+=.47)for(let z=-21;z<=25;z+=.53){
   const expected=sceneSurfaceAt(x,z,{time,wind,snow}).y;
   assert.ok(Math.abs(sampler.heightAt(x,z)-expected)<1e-10,`surface mismatch at ${x},${z}`);
  }
 }
});
