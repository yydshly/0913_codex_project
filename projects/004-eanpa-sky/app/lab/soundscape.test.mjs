import assert from 'node:assert/strict';
import {shelterAt,thunderParameters,mixLevels} from './soundscape.js';
// Sound must follow the camera's real location, including manual orbiting.
assert.equal(shelterAt({x:-3,y:1.8,z:-5.5}),1);
assert.equal(shelterAt({x:9,y:2.1,z:12}),0);
assert.equal(shelterAt({x:-3,y:6,z:-5.5}),0);
assert.equal(shelterAt({x:-8.4,y:2,z:-4}),.5);
const listener={x:0,y:0,z:0},right={x:1,z:0};
const near=thunderParameters({x:343,y:0,z:0},listener,right);
const far=thunderParameters({x:3430,y:0,z:0},listener,right);
assert.equal(near.delay,1);assert.equal(far.delay,10);
assert.equal(near.pan,.85);assert.ok(far.gain<near.gain);assert.ok(far.cutoff<near.cutoff);
assert.equal(thunderParameters({x:-343,y:0,z:0},listener,right).pan,-.85);
assert.equal(thunderParameters(listener,listener,right).delay,0);
const dry=mixLevels(0,0,0),wet=mixLevels(1,8,0),covered=mixLevels(1,8,1);
assert.equal(dry.rain,0);assert.equal(dry.roof,0);assert.ok(covered.rain<wet.rain);assert.ok(covered.cutoff<wet.cutoff);assert.ok(covered.roof>wet.roof);
assert.equal(mixLevels(1,8,0,'rain').wind,0);assert.equal(mixLevels(1,8,1,'wind').roof,0);assert.equal(mixLevels(1,8,0,'thunder').rain,0);assert.equal(mixLevels(1,8,0,'thunder').wind,0);
console.log('Sound checks passed: dry silence, shelter attenuation, layer isolation, distance, direction and fallback roof bounds. Actual garden shelter uses GPU exposure, with geometry fallback.');
