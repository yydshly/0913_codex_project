import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,random} from './scene-world.mjs';
import {duckPoint} from './scene-wildlife.mjs';
import {fishPoint} from './scene-fish.mjs';
import {windResponse} from './scene-vegetation.mjs';

// Rooted patches occupy sheltered downstream margins. Reject a whole leaf's
// footprint when it touches land, stone or a reserved animal swimming route.
export function aquaticSites(world){
 const rand=random(271),sites=[];
 const ducks=Array.from({length:96},(_,i)=>duckPoint(world,i*Math.PI/48));
 const fish=Array.from({length:96},(_,i)=>fishPoint(world,i*Math.PI/48));
 for(let cluster=0;cluster<12;cluster++){
  const side=cluster%2?1:-1,cz=5.5+Math.floor(cluster/2)*2.05+(side>0?.6:0);
  for(let j=0;j<6;j++){
   const a=rand()*Math.PI*2,z=cz+Math.sin(a)*(.25+j*.12),r=.24+rand()*.2;
   const x=world.riverX(z)+side*world.halfWidth(z)*(.66+rand()*.13)+Math.cos(a)*.5;
   if(z-r<world.waterStyle.end+3)continue;
   if(sites.some(p=>Math.hypot(x-p.x,z-p.z)<r+p.r+.08))continue;
   if(ducks.some(p=>Math.hypot(x-p.x,z-p.z)<r+.95)||fish.some(p=>Math.hypot(x-p.x,z-p.z)<r+.65))continue;
   if((world.riverRocks||[]).some(p=>Math.hypot(x-p.x,z-p.z)<Math.max(p.rx,p.rz)+r+.25))continue;
   let safe=true;
   for(let k=0;k<12;k++){
    const px=x+Math.cos(k*Math.PI/6)*(r+.08),pz=z+Math.sin(k*Math.PI/6)*(r+.08);
    if(!world.footprint(px,pz)||world.closest(px,pz).distance<3||world.waterSurface(px,pz)-world.height(px,pz)<.18)safe=false;
   }
   if(safe)sites.push({x,z,r,angle:rand()*Math.PI*2,cluster,flower:j===0});
  }
 }
 return sites;
}
export function aquaticSeason(season,night,rain,wind){
 const [spring,summer,autumn,winter]=season;
 return {growth:Math.max(0,1-winter),bloom:(spring*.55+summer)*(1-night*.7)*(1-rain*.3),
  insects:(spring*.7+summer+autumn*.25)*(1-night)*(1-rain)*(1-Math.min(1,wind)*.8)};
}
export function createAquatic(parent,world,shared){
 const group=new THREE.Group();group.name='岸边睡莲与蜻蜓';parent.add(group);
 const sites=aquaticSites(world),leafMat=mat('#627846',.76),veinMat=mat('#899358',.85),petalMat=mat('#e6ccc0',.57),gold=mat('#c4a059',.75),bodyMat=mat('#517c79',.6);
 const wingMat=mat('#c5d6c5',.42);wingMat.transparent=true;wingMat.opacity=.48;wingMat.depthWrite=false;
 [leafMat,veinMat,petalMat,gold,bodyMat,wingMat].forEach(m=>{m.userData.seasonOwn=true;m.side=THREE.DoubleSide;});
 const shape=new THREE.Shape();shape.moveTo(0,0);
 for(let i=0;i<=44;i++){const a=.19+i/44*(Math.PI*2-.38),r=1+.023*Math.sin(a*9);shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
 shape.closePath();const leafGeo=new THREE.ShapeGeometry(shape);leafGeo.rotateX(-Math.PI/2);
 const sphere=new THREE.SphereGeometry(1,10,6),leaves=[];
 for(let i=0;i<sites.length;i++){
  const p=sites[i],root=new THREE.Group();group.add(root);root.rotation.y=p.angle;
  const leaf=mesh(leafGeo,leafMat,root);leaf.scale.set(p.r,1,p.r*.9);
  // Subtle raised veins provide scale without adding painted dots to the water.
  for(let j=0;j<5;j++){const a=.5+j*1.13,v=mesh(sphere,veinMat,root);v.scale.set(.006,.002,p.r*.35);v.position.set(Math.sin(a)*p.r*.38,.005,Math.cos(a)*p.r*.38);v.rotation.y=a;}
  let flower=null,petals=[];
  if(p.flower){flower=new THREE.Group();flower.position.set(-p.r*.22,.045,p.r*.18);root.add(flower);
   for(let j=0;j<15;j++){const inner=j>=8,a=(inner?j-8:j)/(inner?7:8)*Math.PI*2,pivot=new THREE.Group();pivot.rotation.y=a;flower.add(pivot);const petal=mesh(sphere,petalMat,pivot);petal.scale.set(inner?.04:.055,.026,inner?.12:.16);petal.position.set(0,.035,inner?.07:.11);petals.push({pivot,inner});}
   const centre=mesh(sphere,gold,flower);centre.scale.set(.063,.036,.063);centre.position.y=.05;
  }
  leaves.push({root,p,flower,petals});
 }
 const insects=[];
 for(let i=0;i<Math.min(2,sites.length);i++){
  const site=sites[Math.floor(i*sites.length/2)],root=new THREE.Group();group.add(root);
  const body=mesh(sphere,bodyMat,root);body.scale.set(.024,.027,.23);
  const head=mesh(sphere,gold,root);head.scale.set(.043,.036,.04);head.position.z=.18;
  const wings=[];for(const side of[-1,1])for(const z of[-.06,.07]){const pivot=new THREE.Group();pivot.position.z=z;root.add(pivot);const wing=mesh(sphere,wingMat,pivot);wing.position.x=side*.17;wing.scale.set(.2,.006,.047);wings.push({pivot,side});}
  insects.push({root,site,wings});
 }
 const stats={leaves:0,flowers:0,insects:0};
 const springColor=new THREE.Color('#748a53'),summerColor=new THREE.Color('#5e7545'),autumnColor=new THREE.Color('#8b8050');
 function update(time,night){
  const weights=shared.season.value.toArray(),s=aquaticSeason(weights,night,shared.rain.value,shared.wind.value);
  // Blend palettes in linear color space, keeping leaves free of terrain snow.
  leafMat.color.setRGB(springColor.r*weights[0]+summerColor.r*weights[1]+autumnColor.r*(weights[2]+weights[3]),springColor.g*weights[0]+summerColor.g*weights[1]+autumnColor.g*(weights[2]+weights[3]),springColor.b*weights[0]+summerColor.b*weights[1]+autumnColor.b*(weights[2]+weights[3]));
  stats.leaves=0;stats.flowers=0;stats.insects=0;
  leaves.forEach((l,i)=>{
   const growth=s.growth*(1-weights[2]*.2);l.root.visible=growth>.08;if(!l.root.visible)return;stats.leaves++;
   const force=windResponse(time,l.p.x,l.p.z,shared.wind.value,shared.gust.value),wave=Math.sin(time*1.6+l.p.x*.2+l.p.z*.3);
   l.root.scale.setScalar(growth);l.root.position.set(l.p.x,world.waterSurface(l.p.x,l.p.z)+.045+wave*(.006+force*.009),l.p.z);
   l.root.rotation.x=wave*.012*force;l.root.rotation.z=Math.cos(time*1.3+i)*.014*force;
   if(l.flower){l.flower.visible=s.bloom>.06;if(l.flower.visible){stats.flowers++;l.flower.scale.setScalar(.5+s.bloom*.5);l.petals.forEach(p=>p.pivot.rotation.x=-(p.inner?.65:.25)-(1-s.bloom)*.7);}}
  });
  insects.forEach((insect,i)=>{
   insect.root.visible=s.insects>(i?.4:.12)&&s.growth>.1;if(!insect.root.visible)return;stats.insects++;
   const phase=time*(.8+i*.13)+i*2,p=insect.site;
   insect.root.position.set(p.x+Math.sin(phase)*.45,world.waterSurface(p.x,p.z)+.7+Math.sin(phase*2)*.16,p.z+Math.cos(phase)*.4);
   insect.root.rotation.y=Math.atan2(Math.cos(phase),-Math.sin(phase));
   insect.wings.forEach(w=>w.pivot.rotation.z=w.side*Math.sin(time*36+i)*.32);
  });
 }
 update(shared.time.value,shared.night.value);
 const focus=sites.find(p=>p.flower)||sites[0],target=focus?V(focus.x,world.waterSurface(focus.x,focus.z),focus.z):V(world.riverX(10),world.waterLevel(10),10);
 return {group,sites,leaves,insects,stats,target,update};
}
