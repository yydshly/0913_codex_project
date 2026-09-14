import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeOutdoor} from './outdoor-core.mjs';
import {outdoorPresets,encodeOutdoorRecipe,decodeOutdoorRecipe} from './outdoor-recipe.mjs';
import {environments,scatterGroundCover} from './environment-core.mjs';
import {expandForest,forestHeight} from './forest-core.mjs';

test('environment changes keep the same journey and restore exactly from a saved recipe',()=>{
 const baseline=makeOutdoor(outdoorPresets.valley),counts={};
 for(const environment of Object.keys(environments)){
  const land=makeOutdoor({...outdoorPresets.valley,environment});
  assert.equal(land.drive.length,baseline.drive.length);assert.equal(land.trail.length,baseline.trail.length);
  assert.deepEqual(land.camp,baseline.camp);assert.deepEqual(land.summit,baseline.summit);
  assert.deepEqual(decodeOutdoorRecipe(encodeOutdoorRecipe(land.recipe)),land.recipe);
  const cover=scatterGroundCover(land,(x,z)=>forestHeight(land,x,z));
  assert.deepEqual(scatterGroundCover(land,(x,z)=>forestHeight(land,x,z)),cover);
  for(const [kind,points] of Object.entries(cover).filter(([k])=>k!=='environment')){
   assert.ok(points.some(p=>Math.max(Math.abs(p.x),Math.abs(p.z))>64),kind+' extends into the wider landscape');
   for(const p of points){
    const r=kind==='rocks'?p.scale*1.2:kind==='shrubs'?p.scale*.56:p.scale*.28;
    assert.ok(land.drive.nearest(p.x,p.z).distance>1.6+r,'cover must leave driveable road clear');
    assert.ok(land.trail.nearest(p.x,p.z).distance>.475+r,'cover must leave trail clear');
    assert.ok(Math.hypot(p.x-land.camp.x,p.z-land.camp.z)>5.1+r,'cover must leave camp clear');
    assert.equal(p.y,forestHeight(land,p.x,p.z));
   }
  }
  counts[environment]={trees:expandForest(land).trees.length,grass:cover.grass.length,rocks:cover.rocks.length};
 }
 assert.ok(counts.forest.trees>counts.meadow.trees*1.5);assert.ok(counts.meadow.grass>counts.forest.grass);assert.ok(counts.alpine.rocks>counts.forest.rocks*2);
});

test('version 1 layouts migrate without changing coordinates; version 2 requires environment',()=>{
 const {environment,...old}=outdoorPresets.ridge;
 assert.deepEqual(decodeOutdoorRecipe(JSON.stringify({kind:'songlan-outdoor',version:1,recipe:old})),{...old,environment:'forest'});
 assert.throws(()=>decodeOutdoorRecipe(JSON.stringify({kind:'songlan-outdoor',version:2,recipe:old})));
 assert.throws(()=>makeOutdoor({environment:'constructor'}));
});
