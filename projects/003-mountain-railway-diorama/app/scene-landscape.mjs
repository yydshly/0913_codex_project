import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,beam,random,labelTexture,smooth} from './scene-world.mjs';
import {createVegetation} from './scene-vegetation.mjs';
import {createRiverRocks} from './scene-rocks.mjs';
import {createWater} from './scene-water.mjs';
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
 const station=new THREE.Group(),p=world.curve.getPointAt(world.stationU),t=world.curve.getTangentAt(world.stationU);station.position.copy(p);station.rotation.y=Math.atan2(t.x,t.z);group.add(station);const plaster=mat('#e4d6b3'),roof=mat('#31584f',.7),foundation=mat('#899188'),window=mat('#59786c',.35);window.emissive.set('#ffd295');
 box(station,foundation,[2.5,.6,17],[-2.65,.03,0]);box(station,foundation,[5,1.8,9],[-6,-.5,0]);box(station,plaster,[4.2,2.9,8],[-6,1.75,0]);for(const z of[-2.6,0,2.6])box(station,window,[.04,1.15,1.55],[-3.88,1.9,z]);box(station,wood,[.08,2.6,.9],[-3.82,1.7,0]);
 const roofShape=new THREE.Shape();roofShape.moveTo(-2.8,0);roofShape.lineTo(0,1.45);roofShape.lineTo(2.8,0);roofShape.lineTo(2.65,-.18);roofShape.lineTo(0,1.22);roofShape.lineTo(-2.65,-.18);roofShape.closePath();const g=new THREE.ExtrudeGeometry(roofShape,{depth:9,bevelEnabled:false});g.translate(-6,3.15,-4.5);mesh(g,roof,station);for(const z of[-4,-2,0,2,4])beam(station,wood,V(-3.6,.3,z),V(-3.6,3.05,z),.12);box(station,roof,[2.3,.16,9.4],[-3.45,3.02,0]);
 const sign=mat('#ffffff');sign.map=labelTexture('白鹭河站');const signBoard=mesh(new THREE.PlaneGeometry(3.5,.95),sign,station);signBoard.rotation.y=Math.PI/2;signBoard.position.set(-3.85,2.55,0);for(const z of[-5.4,5.4]){box(station,wood,[.7,.14,2.2],[-2.6,.88,z]);for(const dz of[-.7,.7])box(station,wood,[.15,.58,.15],[-2.6,.54,z+dz]);box(station,wood,[.15,.55,2.2],[-3,.99,z]);}
 const lanternMat=mat('#ffdfa1',.4);lanternMat.emissive.set('#ffc46b');const lights=[];for(const z of[-7,-3.5,3.5,7]){box(station,wood,[.11,3.4,.11],[-1.58,1.6,z]);const lantern=mesh(new THREE.SphereGeometry(.26,10,8),lanternMat,station);lantern.position.set(-1.58,3.23,z);const light=new THREE.PointLight('#ffc784',0,11,2);light.position.copy(lantern.position);station.add(light);lights.push(light)}
 const waterSystem=createWater(group,world,shared);
 const stationTarget=station.localToWorld(V(-3,1,0));
 // A waterside observation deck gives the station a different destination.
 const deck=V(world.riverX(15)-world.halfWidth(15)-1,world.waterLevel(15)+.65,15);
 for(let i=0;i<25;i++)box(group,wood,[3,.12,.19],[deck.x,deck.y,deck.z+i*.22-2.7]);
 for(const z of[-2.6,2.6])for(const x of[-1.3,1.3]){box(group,wood,[.14,2,.14],[deck.x+x,deck.y-.5,deck.z+z]);}
 return{group,...vegetation,stationTarget,lights,reflect:waterSystem.reflect,dispose:waterSystem.dispose,update(time,night){window.emissiveIntensity=.04+night*1.4;lanternMat.emissiveIntensity=.05+night*3;lights.forEach(l=>l.intensity=night*4.3);waterSystem.update(time,night);}};
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
