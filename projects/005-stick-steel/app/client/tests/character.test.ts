import test from 'node:test';
import assert from 'node:assert/strict';
import {characters,characterFrame,duration} from '../lib/character/script';

test('character performance can seek backwards, clamps time and stays continuous',()=>{
  for(const c of characters){
    const sample=characterFrame(c.id,17.25);characterFrame(c.id,duration);assert.deepEqual(characterFrame(c.id,17.25),sample);
    assert.deepEqual(characterFrame(c.id,-10),characterFrame(c.id,0));assert.deepEqual(characterFrame(c.id,Infinity),characterFrame(c.id,0));
    assert.deepEqual(characterFrame(c.id,100),characterFrame(c.id,duration));
    for(let t=0;t<duration;t+=.025){const a=characterFrame(c.id,t),b=characterFrame(c.id,t+.025);for(const [key,value] of Object.entries(a)){assert.ok(Number.isFinite(value));if(key!=='phase')assert.ok(Math.abs(value-b[key as keyof typeof b])<.065,`${c.id} ${key} jumps at ${t}`);}}
  }
});
test('all characters reach the chair before sitting and remain supported when scooting',()=>{
  for(const c of characters)for(let t=0;t<=duration;t+=.1){const p=characterFrame(c.id,t);assert.ok(p.sit>=0&&p.sit<=1);if(p.sit>0){assert.ok(Math.abs(p.x-p.chair)<1e-6);assert.ok(Math.abs(p.walk)<1e-6);}}
  assert.ok(characterFrame('tang',24).chair>characterFrame('tang',20).chair+.3);
});
test('the same event preserves distinct response and seating rhythms',()=>{
  assert.ok(characterFrame('tang',6).wave>characterFrame('zhou',6).wave+.3);
  assert.ok(characterFrame('lin',16).sit>characterFrame('chen',16).sit+.8);
  assert.ok(characterFrame('chen',6).bow>characterFrame('zhou',6).bow+.15);
  assert.ok(Math.abs(characterFrame('zhou',20).lean)<.01);
  assert.ok(characterFrame('chen',24).gaze>.6);
});
