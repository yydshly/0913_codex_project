import {performance} from 'node:perf_hooks';
import {makeSnowSurfaceSampler} from './snow-sampling.js';
import {sceneSurfaceAt} from './surface-state.js';
const points=Array.from({length:1800},(_,i)=>[Math.sin(i*12.7)*24,Math.cos(i*7.1)*23+2]);
const sampler=makeSnowSurfaceSampler();let checksum=0;
function run(batched){
 const start=performance.now();
 for(let f=0;f<120;f++){
  const time=f/60;if(batched)sampler.prepare(time,12,.6);
  for(const [x,z] of points)checksum+=batched?sampler.heightAt(x,z):sceneSurfaceAt(x,z,{time,wind:12,snow:.6}).y;
 }
 return +(performance.now()-start).toFixed(2);
}
run(false);run(true);
const referenceMs=[],batchedMs=[];
for(let i=0;i<7;i++){if(i%2){batchedMs.push(run(true));referenceMs.push(run(false));}else{referenceMs.push(run(false));batchedMs.push(run(true));}}
const median=a=>[...a].sort((a,b)=>a-b)[3];
console.log(JSON.stringify({date:new Date().toISOString(),queriesPerRun:216000,runs:7,referenceMs,batchedMs,referenceMedianMs:median(referenceMs),batchedMedianMs:median(batchedMs),reductionPercent:+((1-median(batchedMs)/median(referenceMs))*100).toFixed(1),checksum,note:'Node CPU collision microbenchmark, includes per-frame preparation; not browser FPS or GPU time.'},null,2));
