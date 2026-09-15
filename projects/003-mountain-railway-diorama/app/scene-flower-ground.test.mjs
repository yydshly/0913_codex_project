import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from './vendor/three.module.js';
import {createSpatial} from './scene-world.mjs';import{stationLayout,stationOccupies}from './scene-station-layout.mjs';
import{flowerGroundPoints,createFlowerGround}from './scene-flower-ground.mjs';import{butterflySites}from './scene-butterflies.mjs';
test('花丛外围疏草复现并避开三类构图中的水面、轨道、站房和树石',()=>{
 for(const composition of ['ridge','marsh','classic']){const w=createSpatial({composition}),sites=butterflySites(w),anchors=sites.map(s=>({x:s.x+1,z:s.z}));w.animalObstacles=[{x:sites[0].x-1,z:sites[0].z,radius:.8}];const points=flowerGroundPoints(w,sites,anchors,3521);assert.deepEqual(points,flowerGroundPoints(w,sites,anchors,3521));assert.ok(points.grass.length>30&&points.grass.length<=1300);
 for(const p of [...points.grass,...points.soil]){assert.ok(w.footprint(p.x,p.z));assert.ok(w.closest(p.x,p.z).distance>=3.6);assert.ok(!stationOccupies(stationLayout(w),p.x,p.z,1));assert.ok(Math.abs(p.x-w.riverX(p.z))>=w.halfWidth(p.z)+1.2);assert.ok(anchors.every(a=>Math.hypot(a.x-p.x,a.z-p.z)>=.65));assert.ok(w.animalObstacles.every(a=>Math.hypot(a.x-p.x,a.z-p.z)>=a.radius+.5));}
 }
});
test('土色网格朝上贴地，冬季收起且换季恢复，重复分布复用节点',()=>{
 const w=createSpatial({composition:'ridge'}),shared={time:{value:0},wind:{value:.4},season:{value:new THREE.Vector4(1,0,0,0)}},cover=createFlowerGround(new THREE.Group(),w,shared,[]),sites=butterflySites(w);cover.reset(sites,3521);cover.update();const ground=cover.group.children[1],n=ground.geometry.attributes.normal;assert.ok(n.count>0);for(let i=0;i<n.count;i++)assert.ok(n.getY(i)>0);
 const initial=cover.group.children.length;shared.season.value.set(0,0,0,1);cover.update();assert.ok(cover.group.children.every(c=>!c.visible));shared.season.value.set(0,1,0,0);cover.update();assert.ok(cover.group.children.every(c=>c.visible));for(let i=0;i<10;i++)cover.reset(sites,i*7919);assert.equal(cover.group.children.length,initial);assert.ok(cover.group.children[0].count<=1300);cover.reset([],7);assert.equal(cover.group.children[0].count,0);assert.equal(ground.geometry.attributes.position.count,0);
});
