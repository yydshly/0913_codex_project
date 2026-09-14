import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMatteEnvironment} from './reflection-budget.js';
test('only authored matte materials bypass SSR and follow environment replacement',()=>{
 const matte={userData:{environmentOnly:true}},wet={userData:{}},glass={userData:{}},root={traverse(fn){[{material:matte},{material:[matte,wet,glass]},{}].forEach(fn);}};
 const binding=makeMatteEnvironment(root),a={},b={};assert.equal(binding.count,1);
 binding.setEnvironment(a);assert.equal(matte.envMap,a);assert.equal(matte.userData.noSSR,true);
 assert.equal(wet.userData.noSSR,undefined);assert.equal(glass.envMap,undefined);
 matte.needsUpdate=false;binding.setEnvironment(a);assert.equal(matte.needsUpdate,false);
 binding.setEnvironment(b);assert.equal(matte.envMap,b);assert.equal(matte.needsUpdate,true);
});
