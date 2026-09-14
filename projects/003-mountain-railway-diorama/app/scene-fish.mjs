import {createWanderer,stepWanderers} from './scene-motion.mjs';
import * as THREE from './vendor/three.module.js';
import {V,mat,mesh} from './scene-world.mjs';

export function fishPoint(world,phase,index=0,winter=0){
 const z=7.8+1.7*Math.sin(phase),x=world.riverX(z)+Math.min(2.1,world.halfWidth(z)*.28)*Math.cos(phase);
 const depth=.48+(index%3)*.085+winter*.1+.035*Math.sin(phase*2+index);
 return V(x,world.waterSurface(x,z)-depth,z);
}
export function fishActivity(winter,night,flow){return (.9-winter*.48)*(1-night*.35)*(.8+Math.min(3,Math.max(0,flow))*.16);}
export function fishHabitat(world){
 let safe=true,minClearance=Infinity;
 for(let i=0;i<96;i++)for(const winter of[0,1]){
  const p=fishPoint(world,i/96*Math.PI*2,2,winter),floor=world.height(p.x,p.z),clearance=p.y-floor;
  minClearance=Math.min(minClearance,clearance);
  if(clearance<.23||!world.footprint(p.x,p.z)||world.closest(p.x,p.z).distance<3||p.z<world.waterStyle.end+3)safe=false;
  for(const r of world.riverRocks||[])if(Math.hypot(p.x-r.x,p.z-r.z)<Math.max(r.rx,r.rz)+.8)safe=false;
 }
 return {safe,minClearance,target:V(world.riverX(7.8),world.waterLevel(7.8)-.4,7.8)};
}
// Real opaque meshes below the surface; the water's transparent pass supplies
// occlusion/tint. Fish never disable depth testing or render on top of water.
export function createFish(parent,world,shared){
 const group=new THREE.Group();group.name='缓水区水下鱼群';parent.add(group);
 const habitat=fishHabitat(world),bodyGeo=new THREE.SphereGeometry(1,16,10);
 const palettes=['#af9c70','#8dafa0','#b5b3a0'].map(c=>mat(c,.53,.08)),dark=mat('#263c38');
 const finMaterial=mat('#788d7c',.72);finMaterial.side=THREE.DoubleSide;
 [...palettes,dark,finMaterial].forEach(m=>{m.userData.seasonOwn=true;});
 function fin(points){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();return geo;}
 const tailGeo=fin([0,0,0,0,.24,-.3,0,0,-.21,0,0,0,0,0,-.21,0,-.24,-.3]);
 const dorsalGeo=fin([0,.1,.15,0,.28,-.05,0,.1,-.3]);
 const sideGeo=fin([0,0,0,.22,-.03,-.18,0,0,-.2]);
 const fish=[];
 for(let i=0;i<7;i++){
  const root=new THREE.Group();group.add(root);const body=mesh(bodyGeo,palettes[i%3],root);body.scale.set(.14,.15,.49);
  const rear=new THREE.Group();rear.position.z=-.37;root.add(rear);
  const stem=mesh(bodyGeo,palettes[i%3],rear);stem.scale.set(.073,.075,.19);stem.position.z=-.08;
  const tail=mesh(tailGeo,finMaterial,rear);tail.position.z=-.22;
  mesh(dorsalGeo,finMaterial,root);
  const fins=[];for(const side of[-1,1]){const f=mesh(sideGeo,finMaterial,root);f.position.set(side*.08,-.03,.15);f.scale.x=side;fins.push(f);
   const eye=mesh(bodyGeo,dark,root);eye.scale.set(.024,.029,.032);eye.position.set(side*.106,.035,.31);
  }
  root.scale.setScalar(.8+(i%3)*.12);fish.push({root,rear,fins,phase:i*Math.PI*2/7,beat:i,motion:createWanderer(280+i*79)});
 }
 let previousTime=shared.time.value;const stats={count:habitat.safe?7:0,activity:'缓水巡游'};
 function update(time,night){
  const dt=Math.min(.1,Math.max(0,time-previousTime));previousTime=time;
  const winter=shared.season.value.w,activity=fishActivity(winter,night,shared.flow.value);
  const rx=Math.min(2.1,world.halfWidth(7.8)*.28);stepWanderers(fish.map(f=>f.motion),dt,.42*activity,rx,1.7,.6);
  stats.activity=winter>.6?'冬季慢游':night>.85?'夜间慢游':'缓水巡游';
  for(let i=0;i<fish.length;i++){
   const f=fish[i];f.root.visible=habitat.safe;if(!habitat.safe)continue;
   const m=f.motion;f.beat+=dt*(1.3+m.speed*9);
   const z=7.8+m.z*1.7,x=world.riverX(z)+m.x*Math.min(2.1,world.halfWidth(z)*.28),depth=.48+(i%3)*.085+winter*.1;
   f.root.position.set(x,world.waterSurface(x,z)-depth,z);f.root.rotation.set(0,m.yaw,.02*Math.sin(f.beat),'YXZ');
   f.rear.rotation.y=Math.sin(f.beat)*.32;f.fins.forEach((fin,j)=>fin.rotation.z=(j?1:-1)*Math.sin(f.beat*.55)*.18);
  }
 }
 update(shared.time.value,shared.night.value);
 return {group,fish,habitat,stats,update};
}
