import assert from 'node:assert/strict';
import {spraySample} from './splash-motion.js';
for(const kind of ['earth','stone','water']){
 let peak=0,active=0;
 for(let seed=0;seed<100;seed++)for(let frame=0;frame<50;frame++){
  const p=spraySample(kind,frame*.005,seed);assert(p.diameter<=.0032);assert(p.alpha>=0&&p.alpha<=.7);if(p.alive){peak=Math.max(peak,p.y);active++;}
 }
 assert(active>0);assert(peak<(kind==='earth'?.003:.024),kind+' splash should stay near surface');
 assert.equal(spraySample(kind,1,4).alive,false);
}
assert.notDeepEqual(spraySample('stone',.025,1),spraySample('stone',.025,4100));
assert.equal(spraySample('stone',0,1).alpha,0);
console.log('Splash checks passed: millimetre diameter, low trajectories, per-event variation, fade and no rebound.');
