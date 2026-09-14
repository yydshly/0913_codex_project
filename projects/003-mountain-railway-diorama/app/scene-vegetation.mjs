import {stationLayout,stationOccupies} from './scene-station-layout.mjs';
import * as THREE from './vendor/three.module.js';
import {V,mat,random} from './scene-world.mjs';
import {createRegionDetails} from './scene-regions.mjs';
import {createMeadowClumps} from './scene-ground-cover.mjs';
import {buildTreeShape,treeIdentity} from './scene-tree-shape.mjs';
import {forestWeight} from './scene-composition.mjs';
import {bindSeasonPlant} from './scene-seasons.mjs';

// One wind field drives trunk bending, leaf flutter, reeds, water and rain.
export function windResponse(time,x,z,strength,gust=0.6){return strength*(.72+.28*Math.sin(time*.9+x*.09+z*.07))*(1+gust*.55*Math.sin(time*1.7+x*.12));}
export function bindWind(material,shared,flutter=0){
 material.customProgramCacheKey=()=>`wetland-wind-v3-${flutter}-${!!material.userData.treeWood}`;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uTime:shared.time,uWind:shared.wind,uWindDir:shared.windDir,uGust:shared.gust});
  shader.vertexShader=`uniform float uTime,uWind,uGust;uniform vec2 uWindDir;attribute vec4 aAnchor;attribute float aFlex,aTaper;\n`+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   ${material.userData.treeWood?'transformed.xz*=mix(1.,aTaper,clamp(position.y+.5,0.,1.));':''}
   vec3 wp=(instanceMatrix*vec4(transformed,1.)).xyz;
   float h=max(0.,wp.y-aAnchor.y),ratio=clamp(h/aAnchor.w,0.,1.25);
   float force=uWind*(.72+.28*sin(uTime*.9+aAnchor.x*.09+aAnchor.z*.07))*(1.+uGust*.55*sin(uTime*1.7+aAnchor.x*.12));
   vec2 bend=uWindDir*force*ratio*ratio*aAnchor.w*.20*aFlex;
   bend+=vec2(-uWindDir.y,uWindDir.x)*sin(uTime*2.1+aAnchor.z*.4)*uWind*.025*h;
   vec3 delta=vec3(bend.x,-length(bend)*.09,bend.y);
   delta.xz+=vec2(sin(uTime*7.+wp.x*3.),cos(uTime*6.+wp.z*4.))*uWind*${flutter.toFixed(3)}*ratio;
   transformed+=vec3(dot(delta,instanceMatrix[0].xyz)/dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(delta,instanceMatrix[1].xyz)/dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(delta,instanceMatrix[2].xyz)/dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
  #endif`);
 };
}
function foliageTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),r=random(106);
 for(let i=0;i<210;i++){const a=r()*Math.PI*2,rad=Math.sqrt(r())*(44+8*Math.sin(a*5)),x=64+Math.cos(a)*rad,y=64+Math.sin(a)*rad;ctx.save();ctx.translate(x,y);ctx.rotate(r()*6.28);ctx.fillStyle=`rgb(${175+r()*65},${190+r()*60},${160+r()*75})`;ctx.beginPath();ctx.ellipse(0,0,3+r()*3,1.7+r()*1.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function createVegetation(group,world,shared){
 const placementHeight=world.layoutHeight||world.height;
 const rng=random(73),trees=[],woodData=[],leafData=[],reedData=[],grassData=[];
 for(let attempt=0;attempt<6000&&trees.length<world.config.density;attempt++){
  const x=(rng()-.5)*92,z=(rng()-.5)*64,y=placementHeight(x,z),shore=Math.abs(x-world.riverX(z))-world.halfWidth(z);
  if(!world.footprint(x,z)||world.closest(x,z).distance<4.8||shore<1.5||Math.hypot(x+30,z-25)<10||y<world.waterLevel(z)+.15||y>25||Math.abs(placementHeight(x+.7,z)-y)>1.5)continue;
  const patchSeed=Math.sin(x*12.9898+z*78.233)*43758.5453;if(patchSeed-Math.floor(patchSeed)>forestWeight(world.config.composition,x,z))continue;
  // Keep a clear meadow in front and concentrate riparian trees near the shore.
  if(z>6&&x<-9&&rng()>.25)continue;
  if(trees.some(t=>Math.hypot(x-t.root.x,z-t.root.z)<2.7))continue;
  const willow=shore<6.5,h=willow?4.8+rng()*3.1:3.1+rng()*5.2,root=V(x,world.height(x,z),z),flex=willow?1:.5;
  const tree={root,h,flex,willow};trees.push(tree);
  Object.assign(tree,treeIdentity(x,z,willow));
  const shape=buildTreeShape({height:h,seed:tree.seed,species:tree.species});
  for(const b of shape.branches)woodData.push({a:root.clone().add(V(...b.a)),b:root.clone().add(V(...b.b)),r:b.radius,tip:b.tipRadius,tree});
  for(const c of shape.crowns)leafData.push({p:root.clone().add(V(...c.p)),size:c.scale,rotation:c.rotation,exposure:c.exposure,tree});

 }
 for(let i=0;i<850;i++){
  const z=-29+rng()*60,side=rng()>.5?1:-1,x=world.riverX(z)+side*(world.halfWidth(z)+.25+rng()*2.7),y=placementHeight(x,z);
  if(!world.footprint(x,z)||world.closest(x,z).distance<2.7||y<world.waterLevel(z)-.08||y>world.waterLevel(z)+1.4)continue;
  const tree={root:V(x,world.height(x,z),z),h:1+rng()*1.4,flex:1.9};for(let j=0;j<4;j++)reedData.push({tree,a:rng()*6.28});
 }
 // Understorey follows dry banks and woodland edges, leaving railway clearance.
 const shrubRoots=[],stationArea=stationLayout(world);
 for(let i=0;i<1100;i++){
  const x=(rng()-.5)*88,z=(rng()-.5)*62,y=placementHeight(x,z),bank=Math.abs(x-world.riverX(z))-world.halfWidth(z);
  if(!world.footprint(x,z)||world.closest(x,z).distance<3.2||y<world.waterLevel(z)+.08||bank<.6||Math.abs(placementHeight(x+.4,z)-y)>.7)continue;
  if(Math.sin(x*.43+z*.21)+Math.cos(z*.49)<.2)continue;
  const shrub={...treeIdentity(x,z),root:V(x,world.height(x,z),z),h:.45+rng()*.9,flex:1.25,willow:false};
  if(rng()<.3){shrubRoots.push(shrub);for(let j=0;j<8;j++)leafData.push({p:shrub.root.clone().add(V((rng()-.5)*1.25,shrub.h*(.35+rng()*.6),(rng()-.5)*1.25)),s:.3+rng()*.35,tree:shrub,a:rng()*6.28});}
  for(let j=0;j<9;j++)grassData.push({tree:{...shrub,root:shrub.root.clone().add(V((rng()-.5)*1.4,0,(rng()-.5)*1.4)),h:.16+rng()*.48},a:rng()*6.28});
 }
 // Anchor both the forest floor and short grass to the actual tree layout.
 for(let i=trees.length-1;i>=0;i--)if(stationOccupies(stationArea,trees[i].root.x,trees[i].root.z,1.4))trees.splice(i,1);
 world.groundTrees=trees.map(t=>({x:t.root.x,y:t.root.y,z:t.root.z,height:t.h}));
 for(const d of grassData)d.tree.root.y=world.height(d.tree.root.x,d.tree.root.z);
 for(const c of createMeadowClumps(world))for(let blade=0;blade<6;blade++){
  const a=c.angle+blade*2.399,spread=.055+.055*(blade%3),x=c.x+Math.cos(a)*spread,z=c.z+Math.sin(a)*spread;
  grassData.push({tree:{root:V(x,world.height(x,z),z),h:c.height*(.6+.12*blade),flex:1.45},a});
 }
 // Whole-island scrub and slope grass, including the unseen rear face.
 const regionDetails=createRegionDetails(world);
 for(const shrub of regionDetails.shrubs){
  const tree={root:V(shrub.x,shrub.y,shrub.z),h:shrub.height,flex:1.15,...treeIdentity(shrub.x,shrub.z)};
  tree.species=shrub.flowering?2:1;shrubRoots.push(tree);
  for(let branch=0;branch<5;branch++){
   const a=shrub.angle+branch*2.399,start=tree.root.clone(),tip=start.clone().add(V(Math.cos(a)*tree.h*.38,tree.h*(.6+branch*.08),Math.sin(a)*tree.h*.38));
   woodData.push({a:start,b:tip,r:.017,tip:.005,tree});
   leafData.push({p:tip,size:[tree.h*.42,tree.h*.33,tree.h*.42],rotation:[.1,a,.15],exposure:.65,tree});
  }
 }
 for(const c of regionDetails.grass)for(let blade=0;blade<6;blade++){
  const a=c.angle+blade*2.399,x=c.x+Math.cos(a)*.1,z=c.z+Math.sin(a)*.1;
  grassData.push({tree:{root:V(x,world.height(x,z),z),h:c.height*(.7+blade*.09),flex:1.4},a});
 }
 // Filter after placement so clearing the station does not reshuffle distant plants.
 for(const data of[woodData,leafData,grassData])for(let i=data.length-1;i>=0;i--){const r=data[i].tree.root;if(stationOccupies(stationArea,r.x,r.z,1.4))data.splice(i,1);}
 for(let i=shrubRoots.length-1;i>=0;i--){const r=shrubRoots[i].root;if(stationOccupies(stationArea,r.x,r.z,1.4))shrubRoots.splice(i,1);}
 const texture=foliageTexture(),leafMat=new THREE.MeshStandardMaterial({map:texture,alphaTest:.34,alphaToCoverage:true,side:THREE.DoubleSide,roughness:.88,color:'#ffffff'}),woodMat=mat('#5d5846'),reedMat=mat('#8d9d4a');
 const gm=mat('#74834d');gm.side=THREE.DoubleSide;
 const dummy=new THREE.Object3D(),up=V(0,1,0);
 function instances(geometry,material,data,place,flutter=0){
  const anchors=[],flex=[],plantTone=[],tapers=[];for(const d of data){anchors.push(...d.tree.root.toArray(),d.tree.h);flex.push(d.tree.flex);plantTone.push(d.tree.species??1,d.tree.tone??.5,d.exposure??.65);tapers.push(d.tip?d.tip/d.r:.65)}
  geometry.setAttribute('aAnchor',new THREE.InstancedBufferAttribute(new Float32Array(anchors),4));geometry.setAttribute('aFlex',new THREE.InstancedBufferAttribute(new Float32Array(flex),1));geometry.setAttribute('aPlantTone',new THREE.InstancedBufferAttribute(new Float32Array(plantTone),3));geometry.setAttribute('aTaper',new THREE.InstancedBufferAttribute(new Float32Array(tapers),1));
  const m=new THREE.InstancedMesh(geometry,material,data.length);data.forEach((d,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);place(d,i);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);const c=new THREE.Color();c.setHSL(d.tree.willow?.24:.27,.25+rng()*.22,.55+rng()*.2);if(material===leafMat)m.setColorAt(i,new THREE.Color().setScalar(.82+rng()*.18))});
  material.userData.treeWood=material===woodMat;bindWind(material,shared,flutter);const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:material.map,alphaTest:material.alphaTest,side:THREE.DoubleSide});depth.userData.treeWood=material===woodMat;bindWind(depth,shared,flutter);const kind=material===leafMat?'leaf':material===gm?'grass':material===reedMat?'reed':'wood';bindSeasonPlant(material,shared,kind);bindSeasonPlant(depth,shared,kind,true);m.customDepthMaterial=depth;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;group.add(m);return m;
 }
 instances(new THREE.CylinderGeometry(1,1,1,7),woodMat,woodData,d=>{dummy.position.copy(d.a).add(d.b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.b.clone().sub(d.a).normalize());dummy.scale.set(d.r,d.a.distanceTo(d.b),d.r)});
 instances(createCrownGeometry(),leafMat,leafData,d=>{dummy.position.copy(d.p);dummy.rotation.set(...(d.rotation||[.1,d.a,0]));dummy.scale.set(...(d.size||[d.s*.8,d.s*.65,d.s*.8]))},.045);
 const rg=new THREE.PlaneGeometry(.10,1,1,5);rg.translate(0,.5,0);const rp=rg.attributes.position;for(let i=0;i<rp.count;i++){const y=rp.getY(i);rp.setX(i,rp.getX(i)*(1-y*.85)+y*y*.25)}rg.computeVertexNormals();reedMat.side=THREE.DoubleSide;
 instances(rg,reedMat,reedData,d=>{dummy.position.copy(d.tree.root);dummy.rotation.y=d.a;dummy.scale.set(1,d.tree.h,1)},.025);
 const gg=rg.clone();
 instances(gg,gm,grassData,d=>{dummy.position.copy(d.tree.root);dummy.rotation.y=d.a;dummy.scale.set(.7,d.tree.h,1)},.02);
 return{regionDetails,shrubs:shrubRoots.length,grass:grassData.length,anchors:trees.map(t=>({x:t.root.x,y:t.root.y,z:t.root.z,height:t.h})),trees:trees.length,reeds:reedData.length,leafClusters:leafData.length};
}


// Three curved leaf sheets, with outward canopy normals instead of flat-card lighting.
export function createCrownGeometry(){
 const p=[],uv=[],n=[],idx=[];
 for(let sheet=0;sheet<3;sheet++){
  const angle=sheet*Math.PI/3,c=Math.cos(angle),s=Math.sin(angle),base=p.length/3;
  for(let y=0;y<=3;y++)for(let x=0;x<=3;x++){
   const u=x/3,v=y/3,px=(u-.5)*2,py=(v-.5)*2,bow=.48*(1-px*px)*(1-py*py),wx=px*c+bow*s,wz=-px*s+bow*c;
   p.push(wx,py,wz);uv.push(u,v);const normal=V(wx,py*.65,wz);if(normal.lengthSq()<.001)normal.set(s,0,c);normal.normalize();n.push(...normal.toArray());
   if(x<3&&y<3){const a=base+y*4+x;idx.push(a,a+1,a+4,a+1,a+5,a+4);}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));geo.setIndex(idx);return geo;
}
