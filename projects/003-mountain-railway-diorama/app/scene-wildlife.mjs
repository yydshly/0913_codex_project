import {createWanderer,stepWanderers} from './scene-motion.mjs';
import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,beam} from './scene-world.mjs';
import {windResponse} from './scene-vegetation.mjs';

const TAU=Math.PI*2,clamp=THREE.MathUtils.clamp;
// Shared environmental inputs, with deliberately bounded artistic behaviour.
export function animalActivity(season,night,rain,wind){
 const winter=season[3],spring=season[0];
 return {flight:clamp((1-night*1.3)*(1-rain*.95)*(1-winter*.6)*(1-Math.max(0,wind-.7)),0,1),
  swim:clamp((1-night*.87)*(1-rain*.65)*(1-winter*.48),.035,1),wing:1+spring*.08};
}
export function duckPoint(world,phase){
 const z=9.3+2.4*Math.sin(phase),x=world.riverX(z)+Math.min(1.9,world.halfWidth(z)*.24)*Math.cos(phase);
 return V(x,world.waterSurface(x,z),z);
}
export function birdPoint(height,phase,index=0){return V(-10+13*Math.cos(phase),height+index*.75+.5*Math.sin(phase*2),4+8*Math.sin(phase));}
export function flightResponse(time,point,tangent,strength,direction,gust){
 const force=windResponse(time,point.x,point.z,strength,gust),along=tangent.x*direction.x+tangent.z*direction.y;
 const cross=tangent.x*direction.y-tangent.z*direction.x;
 return {force,speed:clamp(3.2+force*along*1.5,1.4,5.1),crab:cross*force*.32,bank:-.17+cross*force*.16,
  wingRate:2.5+force*(.7-along*.5)};
}
export function wildlifeHabitat(world){
 let height=11;
 for(let i=0;i<80;i++){
  const p=birdPoint(0,i/80*TAU);height=Math.max(height,world.height(p.x,p.z)+5);
  for(const tree of world.groundTrees||[])if(Math.hypot(p.x-tree.x,p.z-tree.z)<6)height=Math.max(height,tree.y+tree.height+4);
 }
 // Validate the entire route once after terrain edits, never turn per-frame
 // collision checks into hundreds of terrain/rail searches.
 let waterSafe=true;
 for(let i=0;i<96;i++){
  const p=duckPoint(world,i/96*TAU);
  if(!world.footprint(p.x,p.z)||world.closest(p.x,p.z).distance<3||world.height(p.x,p.z)>p.y-.3)waterSafe=false;
  for(const r of world.riverRocks||[])if(Math.hypot(p.x-r.x,p.z-r.z)<Math.max(r.rx,r.rz)+.85)waterSafe=false;
 }
 return {height,waterSafe,waterTarget:V(world.riverX(9.3),world.waterLevel(9.3),9.3),birdTarget:V(-10,height,4)};
}

export function createWildlife(parent,world,shared){
 const group=new THREE.Group();group.name='林缘白鹭与缓水野鸭';parent.add(group);
 const habitat=wildlifeHabitat(world),sphere=new THREE.SphereGeometry(1,12,8);
 const palette={ivory:mat('#e5e2d3'),wing:mat('#c3c7be'),dark:mat('#343b35'),bill:mat('#c9a34b'),
  brown:mat('#887054'),flank:mat('#aeab95'),green:mat('#345a4b'),chest:mat('#705044')};
 // Feathers are living surfaces: do not apply the terrain's snow coating.
 Object.values(palette).forEach(m=>m.userData.seasonOwn=true);
 const egg=(root,m,scale,pos)=>{const o=mesh(sphere,m,root);o.scale.set(...scale);o.position.set(...pos);return o;};
 function egret(){
  const root=new THREE.Group();group.add(root);
  egg(root,palette.ivory,[.17,.22,.57],[0,0,0]);
  egg(root,palette.ivory,[.105,.21,.23],[0,.14,.38]);
  egg(root,palette.ivory,[.1,.105,.18],[0,.26,.6]);
  const bill=mesh(new THREE.ConeGeometry(.052,.38,6),palette.bill,root);bill.rotation.x=Math.PI/2;bill.position.set(0,.24,.91);
  for(const s of[-1,1]){
   egg(root,palette.dark,[.022,.024,.025],[s*.093,.28,.68]);
   beam(root,palette.dark,V(s*.065,-.06,-.35),V(s*.08,-.07,-1),.022);
  }
  const wings=[];
  for(const side of[-1,1]){
   const pivot=new THREE.Group();pivot.position.set(side*.1,.07,.07);root.add(pivot);
   egg(pivot,palette.ivory,[.65,.055,.33],[side*.53,0,-.06]);
   for(let i=0;i<5;i++){
    const feather=egg(pivot,i%2?palette.ivory:palette.wing,[.27,.024,.095],[side*(1+i*.075),0,-.01-i*.12]);
    feather.rotation.y=side*(.08+i*.1);
   }
   wings.push({pivot,side});
  }
  return {root,wings,phase:0,flap:0};
 }
 function duck(index){
  const root=new THREE.Group();group.add(root);const male=index===0;
  egg(root,male?palette.flank:palette.brown,[.33,.25,.55],[0,.18,0]);
  egg(root,palette.chest,[.25,.22,.23],[0,.24,.3]);
  const head=new THREE.Group();head.position.set(0,.43,.38);root.add(head);
  egg(head,male?palette.green:palette.brown,[.15,.19,.19],[0,.05,.035]);
  if(male)egg(root,palette.ivory,[.165,.028,.16],[0,.38,.36]);
  egg(head,palette.bill,[.09,.035,.16],[0,0,.29]);
  for(const side of[-1,1]){
   egg(head,palette.dark,[.024,.024,.028],[side*.139,.095,.11]);
   const wing=egg(root,male?palette.flank:palette.chest,[.055,.14,.36],[side*.29,.25,-.05]);wing.rotation.x=.12;
   egg(root,palette.green,[.027,.065,.12],[side*.331,.27,-.2]);
  }
  const tail=egg(root,palette.dark,[.13,.08,.22],[0,.27,-.54]);tail.rotation.x=-.35;
  root.scale.setScalar(.95);
  return {root,head,phase:index*TAU/3,motion:createWanderer(719+index*181),trail:[],lastTrail:-Infinity};
 }
 const birds=Array.from({length:4},(_,i)=>{const b=egret();b.phase=[.2,2.8,4.7,1.4][i];return b;}),ducks=Array.from({length:3},(_,i)=>duck(i));
 ducks.forEach((d,i)=>{d.motion.x=[-.55,.55,-.15][i];d.motion.z=[-.6,0,.65][i];});
 const wakeMaterial=new THREE.MeshBasicMaterial({color:'#c5d9ce',transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
 for(const [index,d] of ducks.entries()){
  // Two narrow ribbons sampled from actual past positions, not a rigid V card.
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(24*2*2*3),3));
  const colors=new Float32Array(24*2*2*3);geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const indices=[];for(let s=0;s<2;s++)for(let i=0;i<23;i++){const k=s*48+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}geo.setIndex(indices);
  d.wake=new THREE.Mesh(geo,index===0?wakeMaterial:wakeMaterial.clone());d.wake.material.vertexColors=true;d.wake.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#ifdef USE_COLOR\ndiffuseColor.a*=vColor.r;\n#endif');};d.wake.frustumCulled=false;group.add(d.wake);
 }
 let lastTime=null;const stats={birds:4,ducks:habitat.waterSafe?3:0,flightSpeed:0,activity:'日间活动'};
 function update(time,night){
  const dt=lastTime===null?0:clamp(time-lastTime,0,.1);lastTime=time;
  const wind=shared.wind.value,activity=animalActivity(shared.season.value.toArray(),night,shared.rain.value,wind);
  stats.birds=0;stats.flightSpeed=0;stats.activity=shared.rain.value>.4?'雨中慢游':night>.85?'夜间休息':shared.season.value.w>.6?'冬季慢游':'缓水游弋';
  birds.forEach((b,i)=>{
   const p=birdPoint(habitat.height,b.phase,i),t=V(-13*Math.sin(b.phase),0,8*Math.cos(b.phase)).normalize();
   const response=flightResponse(time,p,t,wind,shared.windDir.value,shared.gust.value);
   b.phase+=dt*response.speed/Math.hypot(13*Math.sin(b.phase),8*Math.cos(b.phase));b.flap+=dt*response.wingRate*activity.wing;
   const alpha=clamp(activity.flight*4-i,0,1);b.root.visible=alpha>.015;b.root.scale.setScalar(alpha);
   if(alpha>.5){stats.birds++;stats.flightSpeed+=response.speed;}
   b.root.position.copy(birdPoint(habitat.height,b.phase,i));b.root.rotation.set(.035*Math.sin(b.flap),Math.atan2(t.x,t.z)-response.crab,response.bank,'YXZ');
   const glide=(Math.sin(b.flap*.27+i)+1)*.5,beat=Math.sin(b.flap*TAU)*(.18+.42*glide);
   b.wings.forEach(({pivot,side})=>pivot.rotation.z=side*(.14+beat));
  });
  stats.flightSpeed/=Math.max(1,stats.birds);
  stepWanderers(ducks.map(d=>d.motion),dt,.34*activity.swim,Math.min(1.9,world.halfWidth(9.3)*.24),2.4,1.8);
  ducks.forEach((d,i)=>{
   d.root.visible=habitat.waterSafe;d.wake.visible=habitat.waterSafe;if(!habitat.waterSafe)return;
   const m=d.motion,z=9.3+m.z*2.4,x=world.riverX(z)+m.x*Math.min(1.9,world.halfWidth(z)*.24),p=V(x,world.waterSurface(x,z),z),heading=m.yaw,force=windResponse(time,p.x,p.z,wind,shared.gust.value);
   d.root.position.copy(p);d.root.position.y+=.015+Math.sin(time*3+i)*force*.035;
   d.root.rotation.set(Math.sin(time*2+i)*force*.04,heading,Math.sin(time*2.3+i)*force*.055,'YXZ');
   d.head.rotation.x=.08*Math.sin(time*.8+i)+(activity.swim<.25?.45:0);
   if(time-d.lastTrail>.1){d.trail.unshift({p:p.clone(),heading,time});d.trail.length=Math.min(d.trail.length,24);d.lastTrail=time;}
   const positions=d.wake.geometry.attributes.position,colors=d.wake.geometry.attributes.color;
   for(let side=0;side<2;side++)for(let j=0;j<24;j++){
    const sample=d.trail[Math.min(j,d.trail.length-1)]||{p,heading,time},age=time-sample.time;
    const span=.24+age*.13,thickness=.025+age*.003,sign=side?1:-1;
    for(let edge=0;edge<2;edge++){
     const x=sample.p.x+Math.cos(sample.heading)*(sign*span+(edge?thickness:-thickness)),z=sample.p.z-Math.sin(sample.heading)*(sign*span+(edge?thickness:-thickness));
     const index=side*48+j*2+edge;positions.setXYZ(index,x,world.waterSurface(x,z)+.105,z);
     const fade=Math.max(0,1-age/2.5);colors.setXYZ(index,fade,fade,fade);
    }
   }
   positions.needsUpdate=true;colors.needsUpdate=true;d.wake.material.opacity=.32*Math.min(1,d.motion.speed/.32)*(1-night*.7);
  });
 }
 update(shared.time.value,shared.night.value);
 return {group,habitat,stats,birds,ducks,update};
}
