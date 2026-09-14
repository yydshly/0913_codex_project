import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,beam,random,labelTexture,smooth} from './scene-world.mjs';
import {createVegetation} from './scene-vegetation.mjs';
import {createRiverRocks} from './scene-rocks.mjs';
import {createWater} from './scene-water.mjs';
import {createWildlife} from './scene-wildlife.mjs';
import {createAquatic} from './scene-aquatic.mjs';
import {createFish} from './scene-fish.mjs';
import {createStation} from './scene-station.mjs';
export function createLandscape(scene,world,shared){
 const group=new THREE.Group();group.name='03 湿地与河岸';scene.add(group);const rand=random(73),wood=mat('#695b43'),dummy=new THREE.Object3D(),vegetation=createVegetation(group,world,shared);
 const rockGeo=new THREE.DodecahedronGeometry(1,1),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),f=1+.12*Math.sin(x*8+z*5)*Math.cos(y*7);rp.setXYZ(i,x*f,y*f,z*f)}rockGeo.computeVertexNormals();
 const rockMat=mat('#777c6a',.92);rockMat.customProgramCacheKey=()=> 'river-stratified-rock-v1';
 rockMat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRockLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRockLocal=position;');
  shader.fragmentShader='varying vec3 vRockLocal;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float strata=sin(vRockLocal.y*26.+sin(vRockLocal.x*8.)*.6)*.06;
   diffuseColor.rgb*=.88+strata+vRockLocal.y*.15;
   float moss=smoothstep(.15,.7,vRockLocal.y)*smoothstep(-.3,.5,sin(vRockLocal.x*9.)*cos(vRockLocal.z*7.));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.57,.73,.32),moss*.5);
  `);
 };
 world.riverRocks=createRiverRocks(world);
 const riverGeo=new THREE.SphereGeometry(1,12,8);
 const rocks=new THREE.InstancedMesh(riverGeo,rockMat,world.riverRocks.length);
 world.riverRocks.forEach((r,i)=>{
  dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,r.angle,0);dummy.scale.set(r.rx,r.ry,r.rz);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
 });rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
 // Upland rock groups stay outside the river and railway clearance.
 const upland=mesh(createUplandRockGeometry(world,vegetation.regionDetails.rocks,rockGeo),mat('#65715f',.96),group);
 upland.material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vUplandPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvUplandPoint=position;');
  shader.fragmentShader='varying vec3 vUplandPoint;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat uplandGrain=sin(vUplandPoint.x*8.+sin(vUplandPoint.z*5.))*cos(vUplandPoint.z*7.+vUplandPoint.y*4.);diffuseColor.rgb*=.88+uplandGrain*.1;');
 };
 upland.material.customProgramCacheKey=()=> 'upland-contact-v15';
 const deadwood=mat('#655746',.97);
 for(const log of vegetation.regionDetails.logs){
  const a=V(...log.ends[0]),b=V(...log.ends[1]);
  const trunk=mesh(new THREE.CylinderGeometry(log.radius*.65,log.radius,a.distanceTo(b),7),deadwood,group);
  trunk.position.copy(a).add(b).multiplyScalar(.5);trunk.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());
 }
 const station=createStation(group,world),lights=station.lights;
 const waterSystem=createWater(group,world,shared);
 const stationTarget=station.target;
 const wildlife=createWildlife(group,world,shared);
 const fish=createFish(group,world,shared),aquatic=createAquatic(group,world,shared);
 // A waterside observation deck gives the station a different destination.
 const deck=V(world.riverX(15)-world.halfWidth(15)-1,world.waterLevel(15)+.65,15);
 for(let i=0;i<25;i++)box(group,wood,[3,.12,.19],[deck.x,deck.y,deck.z+i*.22-2.7]);
 for(const z of[-2.6,2.6])for(const x of[-1.3,1.3]){box(group,wood,[.14,2,.14],[deck.x+x,deck.y-.5,deck.z+z]);}
 return{group,wildlife,fish,aquatic,...vegetation,stationTarget,lights,reflect:waterSystem.reflect,dispose:waterSystem.dispose,update(time,night){station.update(night);waterSystem.update(time,night);wildlife.update(time,night);fish.update(time,night);aquatic.update(time,night);}};
}

// Project each outcrop onto the terrain so its lower shell is buried.
// Shared world heights keep the rock/soil contact valid after terrain edits.
export function createUplandRockGeometry(world,rocks,source){
 const positions=[],p=source.attributes.position;
 for(const r of rocks){
  const c=Math.cos(r.angle),s=Math.sin(r.angle);
  for(let i=0;i<p.count;i++){
   const u=p.getX(i)*r.scale*1.15,v=p.getZ(i)*r.scale*.8;
   const x=r.x+u*c-v*s,z=r.z+u*s+v*c;
   positions.push(x,world.height(x,z)+r.scale*(p.getY(i)*.3-.12),z);
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
