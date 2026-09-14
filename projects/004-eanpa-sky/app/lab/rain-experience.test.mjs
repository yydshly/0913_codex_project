import assert from 'node:assert/strict';
import {advanceRoofWater,earthHeight,depressions,nearDetailGain} from './rain-experience.js';
let water=0;
for(let i=0;i<100;i++)water=advanceRoofWater(water,1,.1);
assert(water>.9&&water<1,'Roof becomes wet during sustained rain');
const before=water;water=advanceRoofWater(water,0,.1);
assert(water>0&&water<before,'Roof drains gradually instead of disappearing');
for(let i=0;i<900;i++)water=advanceRoofWater(water,0,.1);
assert(water<.001,'Runoff eventually stops');
assert.equal(advanceRoofWater(.4,0,0),.4,'Paused simulation retains stored water');
for(const [x,z,rx,rz] of depressions){assert(earthHeight(x,z)<earthHeight(x+rx*1.5,z+rz*1.5),'Authored puddles lie below their surroundings');}
assert.equal(nearDetailGain(18),0);assert.equal(nearDetailGain(100),0);assert(nearDetailGain(2)>nearDetailGain(9));
console.log('Rain detail checks passed: accumulation, drainage, pause, depressed ground, distance attenuation.');
