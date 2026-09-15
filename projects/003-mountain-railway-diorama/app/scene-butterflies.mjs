import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,random} from './scene-world.mjs';
import {createFlowerGround} from './scene-flower-ground.mjs';
import {stationLayout,stationOccupies} from './scene-station-layout.mjs';

export function butterflySeason(weights,night=0,rain=0,wind=0){
 const abundance=weights[0]+weights[1]*.9+weights[2]*.30;
 return {abundance,flight:abundance*(1-night)*(1-rain)*Math.max(0,1-wind*1.1)};
}
export function butterflySites(world,anchors=[],seed=3521){
 const rng=random(seed),layout=stationLayout(world),sites=[];
 const safe=(x,z)=>world.footprint(x,z)&&!stationOccupies(layout,x,z,1)&&world.closest(x,z).distance>4&&Math.abs(x-world.riverX(z))>world.halfWidth(z)+1.2&&!(world.animalObstacles||[]).some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+.8);
 for(let attempt=0;attempt<600&&sites.length<5;attempt++){
  const x=(rng()-.5)*68,z=(rng()-.5)*44,h=world.height(x,z);
  if(!safe(x,z)||sites.some(s=>Math.hypot(x-s.x,z-s.z)<9))continue;
  if(anchors.some(a=>Math.hypot(x-a.x,z-a.z)<2.3))continue;
  let valid=true;
  for(let r=1;r<=3;r++)for(let k=0;k<16;k++){const px=x+Math.cos(k*Math.PI/8)*r,pz=z+Math.sin(k*Math.PI/8)*r;if(!safe(px,pz)||Math.abs(world.height(px,pz)-h)>.7)valid=false;}
  if(valid)sites.push({x,z,y:h});
 }
 return sites;
}
export function createButterflyMotion(world,perches,seed,anchors=[]){
 const rng=random(seed),position=perches[Math.floor(rng()*perches.length)].clone();
 const b={position,yaw:rng()*Math.PI*2,state:'停栖',timer:0,wait:2+rng()*9,path:null,progress:0,duration:0,visits:0};
 let last=-1;
 b.update=(dt,canFly=true)=>{
  if(dt<=0)return;dt=Math.min(dt,.1);b.timer+=dt;
  if(!b.path){
   b.state=canFly?'停栖':'避风休息';
   if(!canFly||b.timer<b.wait)return;
   const choices=perches.map((p,i)=>({p,i})).filter(({p,i})=>i!==last&&p.distanceTo(position)>.55);if(!choices.length)return;
   const goal=choices[Math.floor(rng()*choices.length)],to=goal.p.clone(),d=to.clone().sub(position),side=V(-d.z,0,d.x).normalize().multiplyScalar((rng()-.5)*.7);
   const a=position.clone().addScaledVector(d,.25).add(side),c=position.clone().addScaledVector(d,.75).add(side);a.y+=.75+rng()*.5;c.y+=.75+rng()*.5;
   const path=new THREE.CubicBezierCurve3(position.clone(),a,c,to);
   for(let k=0;k<=32;k++){const p=path.getPoint(k/32);if(anchors.some(tree=>Math.hypot(p.x-tree.x,p.z-tree.z)<.7)){b.timer=0;b.wait=1+rng()*2;return;}}
   b.path=path;b.duration=3+b.path.getLength()/1.1+rng()*2;b.progress=0;b.timer=0;last=goal.i;
  }
  b.state='访花飞行';b.progress=Math.min(1,b.progress+dt/b.duration);
  const t=b.progress,u=t*t*t*(10+t*(-15+6*t)),p=b.path.getPointAt(u),dir=b.path.getTangentAt(u);
  position.copy(p);const wanted=Math.atan2(dir.x,dir.z),angle=Math.atan2(Math.sin(wanted-b.yaw),Math.cos(wanted-b.yaw));b.yaw+=THREE.MathUtils.clamp(angle,-2.4*dt,2.4*dt);
  if(t===1){b.path=null;b.timer=0;b.wait=5+rng()*15;b.visits++;b.state='停栖';}
 };
 return b;
}
export function createButterflies(parent,world,shared,anchors=[]){
 const group=new THREE.Group();group.name='林间花草与季节蝴蝶';parent.add(group);
 const groundCover=createFlowerGround(group,world,shared,anchors);
 const stemMat=mat('#6c8050',.94),pollen=mat('#d6ad61',.8),bodyMat=mat('#514938',.8),petals=['#d7b9c6','#d7d4a5','#c9c1dd'].map(c=>mat(c,.88));
 for(const m of[stemMat,pollen,bodyMat,...petals])m.userData.seasonOwn=true;
 const sphere=new THREE.SphereGeometry(1,8,5),stemGeo=new THREE.CylinderGeometry(.015,.023,1,5),patches=[],actors=[],stats={patches:0,visible:0,flying:0,resting:0};
 const wingShape=new THREE.Shape();wingShape.moveTo(.018,-.03);wingShape.bezierCurveTo(.05,.25,.27,.32,.30,.12);wingShape.bezierCurveTo(.31,.02,.20,-.02,.20,-.06);wingShape.bezierCurveTo(.28,-.22,.06,-.22,.018,-.03);
 const wingGeo=new THREE.ShapeGeometry(wingShape,8);wingGeo.rotateX(Math.PI/2);
 const spotGeo=new THREE.CircleGeometry(.025,10);spotGeo.rotateX(-Math.PI/2);
 for(let i=0;i<5;i++){
  const root=new THREE.Group();group.add(root);const flowers=[];
  for(let j=0;j<9;j++){
   const flower=new THREE.Group();root.add(flower);const height=.27+(j%3)*.09,stem=mesh(stemGeo,stemMat,flower);stem.scale.y=height;stem.position.y=height/2;
   const head=new THREE.Group();head.position.y=height;flower.add(head);
   const form=(i+j)%3,count=[5,8,6][form],radius=[.068,.062,.05][form];
   head.rotation.y=j*2.39996;
   for(let k=0;k<count;k++){const petal=mesh(sphere,petals[i%3],head),a=k*Math.PI*2/count;petal.scale.set([.063,.028,.043][form],[.021,.016,.03][form],[.09,.092,.073][form]);petal.position.set(Math.sin(a)*radius,form===2?.012:0,Math.cos(a)*radius);petal.rotation.set(form===2?.22:0,a,0);}
   for(let k=0;k<3;k++){const leaf=mesh(sphere,stemMat,flower),a=j*2.39996+k*2.1;leaf.scale.set(.026,.012,.075);leaf.rotation.set(.3,a,0);leaf.position.set(Math.sin(a)*.045,.025+k*.045,Math.cos(a)*.045);}
   const centre=mesh(sphere,pollen,head);centre.scale.set(.04,.028,.04);flowers.push({root:flower,head,height});
  }
  patches.push({root,flowers});
  for(let j=0;j<3;j++){
   const actor=new THREE.Group();group.add(actor);const body=mesh(sphere,bodyMat,actor);body.scale.set(.025,.025,.14);
   const wingMat=mat(['#e4d9a2','#cf994f','#c5cfe0'][(i+j)%3],.83);wingMat.side=THREE.DoubleSide;wingMat.transparent=true;wingMat.userData.seasonOwn=true;
   const wings=[];for(const side of[-1,1]){const pivot=new THREE.Group();actor.add(pivot);const wing=mesh(wingGeo,wingMat,pivot);wing.scale.x=side;const spot=mesh(spotGeo,bodyMat,pivot);spot.position.set(side*.20,.004,-.11);spot.material.side=THREE.DoubleSide;wings.push({pivot,side});}
   actor.scale.setScalar(.8+j*.12);actors.push({root:actor,wings,wingMat,patch:i,index:j,motion:null,phase:i*2+j});
  }
 }
 let sites=[],seed=shared.lifeSeed?.value??3521,previous=shared.time.value;
 function redistribute(value){
  seed=value;sites=butterflySites(world,anchors,seed);groundCover.reset(sites,seed);const rng=random(seed+1);
  patches.forEach((patch,i)=>{
   patch.root.visible=!!sites[i];if(!sites[i])return;const s=sites[i];patch.root.position.set(s.x,s.y,s.z);patch.perches=[];
   patch.flowers.forEach((f,j)=>{let x=s.x,z=s.z;for(let tries=0;tries<40;tries++){const a=rng()*Math.PI*2,r=.2+Math.sqrt(rng())*1.9;x=s.x+Math.sin(a)*r;z=s.z+Math.cos(a)*r;if(!anchors.some(t=>Math.hypot(x-t.x,z-t.z)<.8))break;x=s.x;z=s.z;}const y=world.height(x,z);f.root.position.set(x-s.x,y-s.y,z-s.z);patch.perches.push(V(x,y+f.height+.035,z));});
  });
  actors.forEach((a,i)=>{a.motion=sites[a.patch]?createButterflyMotion(world,patches[a.patch].perches,seed+193*i+17,anchors):null;if(a.motion)a.root.position.copy(a.motion.position);a.root.visible=!!a.motion;});
 }
 redistribute(seed);
 function update(time,night){
  const dt=Math.max(0,Math.min(.1,time-previous));previous=time;const env=butterflySeason(shared.season.value.toArray(),night,shared.rain.value,shared.wind.value);
  groundCover.update();
  stats.visible=stats.flying=stats.resting=0;stats.patches=sites.length;
  patches.forEach((p,i)=>{p.root.visible=!!sites[i]&&env.abundance>.03;const bloom=Math.max(.05,Math.min(1,env.abundance*1.2));for(const f of p.flowers)f.head.scale.setScalar(.55+bloom*.45);});
  actors.forEach((a,i)=>{
   if(!a.motion){a.root.visible=false;return;}const threshold=(a.index*5+a.patch)/17,opacity=THREE.MathUtils.smoothstep(env.abundance,threshold,threshold+.13);a.root.visible=opacity>.01;a.wingMat.opacity=opacity;if(!a.root.visible)return;
   const canFly=env.flight>.13+(i%3)*.045;a.motion.update(dt,canFly);a.root.position.copy(a.motion.position);a.root.rotation.y=a.motion.yaw;
   const flying=!!a.motion.path;for(const w of a.wings)w.pivot.rotation.z=w.side*(flying?.3+Math.sin(time*42+a.phase)*.85:1.25+Math.sin(time*1.5+a.phase)*.08);
   stats.visible++;if(flying)stats.flying++;else stats.resting++;
  });
 }
 update(shared.time.value,shared.night.value);
 return{group,patches,actors,stats,groundCover,update,redistribute,get sites(){return sites},get target(){const s=sites[0];return s?V(s.x,s.y+.65,s.z):V(0,5,0)}};
}
