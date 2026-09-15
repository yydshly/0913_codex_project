import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from './vendor/three.module.js';
import{foliagePattern,foliageTile,bindFoliageAtlas}from './scene-foliage-pattern.mjs';
test('叶簇图集可复现，枝叶不越界污染相邻图块，树种映射固定',()=>{
 for(let i=0;i<4;i++){const p=foliagePattern(i);assert.deepEqual(p,foliagePattern(i));assert.notDeepEqual(p,foliagePattern((i+1)%4));assert.equal(p.leaves.length,144);for(const l of p.leaves){assert.ok(l.x-l.rx>=8-1e-6&&l.x+l.rx<=120+1e-6);assert.ok(l.y-l.rx>=8-1e-6&&l.y+l.rx<=120+1e-6);assert.ok(l.rx>l.ry);}}
 assert.equal(foliageTile(0,55),0);assert.equal(foliageTile(2,55),2);assert.equal(foliageTile(1,0),1);assert.equal(foliageTile(1,1),3);
});
test('可见材质与阴影材质使用相同图集坐标并保留原有风动绑定',()=>{
 const shaders=[];for(const material of [new THREE.MeshStandardMaterial(),new THREE.MeshDepthMaterial()]){let originalCalled=false;material.onBeforeCompile=()=>{originalCalled=true};bindFoliageAtlas(material);const shader={vertexShader:'#include <uv_vertex>\n#include <begin_vertex>'};material.onBeforeCompile(shader);assert.ok(originalCalled);assert.ok(material.customProgramCacheKey().includes('foliage-atlas-v37'));assert.ok(shader.vertexShader.includes('#include <begin_vertex>'));shaders.push(shader.vertexShader);}assert.equal(shaders[0],shaders[1]);
});
