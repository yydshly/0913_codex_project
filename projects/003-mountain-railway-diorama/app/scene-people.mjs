import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,random} from './scene-world.mjs';
const clamp=THREE.MathUtils.clamp,ease=t=>t*t*(3-2*t),angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function stationWalkHeight(layout,x,z){
 if(Math.abs(z-layout.entry.z)<layout.entry.width/2&&x<layout.entry.x&&x>=layout.entry.x-layout.entry.run){const step=layout.steps.find(s=>x>=s.x-s.width/2-1e-6&&x<=s.x+s.width/2+1e-6);if(step)return step.height;}
 if(x<layout.entry.x-layout.entry.run)return layout.ground(x,z)+.04;
 return layout.top;
}
export function stationPeopleRoutes(layout){
 const steps=[...layout.steps].reverse().map(s=>[s.x,layout.entry.z]);
 return [
  {name:'蓝衣旅客',color:'#4e7280',seat:[-3.43,-5.3],front:[-2.9,-5.3],tour:[[-2.65,-5.3],[-2.65,-3.55]],seated:true},
  {name:'赭衣旅客',color:'#ae7951',seat:[-3.43,4.55],front:[-2.9,4.55],tour:[[-2.58,4.55],[-2.58,3.0]],seated:false},
  {name:'候车旅客',color:'#6e7862',front:[-2.72,-1.5],tour:[[-2.72,-1.5],[-2.72,1.0]],seated:false},
  {name:'进站旅客',color:'#805f6a',front:[-7.3,layout.entry.z],tour:[...steps,[-3.95,layout.entry.z],[-2.65,layout.entry.z],[-2.65,7.25]],seated:false}
 ];
}
export function createPersonBehavior(layout,profile,index){
 const rand=random(31001+index*97),height=(x,z)=>stationWalkHeight(layout,x,z),front=V(profile.front[0],0,profile.front[1]);front.y=height(front.x,front.z);
 const b={profile,position:front.clone(),yaw:Math.PI/2,angularVelocity:0,speed:0,state:profile.seated?'坐着休息':'候车',timer:0,duration:index===3?1:3+rand()*5,sit:profile.seated?1:0,route:[],cursor:0,next:'候车',returning:false,distance:0,travel:0};
 const seated=()=>V(profile.seat[0],height(...profile.front),profile.seat[1]);if(profile.seated)b.position.copy(seated());
 const wait=()=>{b.state='候车';b.timer=0;b.duration=6+rand()*9;b.speed=0;};
 const startRoute=(points,next)=>{b.route=points.map(([x,z])=>V(x,height(x,z),z));b.cursor=0;b.next=next;b.state='行走';b.timer=0;};
 function update(dt,{night=0,rain=0,winter=0}={},others=[]){
  if(dt<=0||b.external)return;b.timer+=dt;
  if(b.state==='坐着休息'){if(b.timer>b.duration*(1+night*2+winter*.6)) {b.state='起身';b.timer=0;}return;}
  if(b.state==='坐下'||b.state==='起身'){
   const t=ease(clamp(b.timer/1.7,0,1));b.sit=b.state==='坐下'?t:1-t;b.position.copy(front).lerp(seated(),b.sit);b.yaw=Math.PI/2;b.angularVelocity=0;b.speed=0;
   if(t===1){if(b.state==='坐下'){b.state='坐着休息';b.duration=14+rand()*18;b.timer=0;}else startRoute(profile.tour,'候车');}return;
  }
  if(b.state==='候车'){
   b.speed=0;turn(Math.PI/2,dt);
   if(b.timer>b.duration*(1+night+rain*.5)){
    if(profile.seat&&!b.returning&&b.position.distanceTo(front)<.12){b.state='对齐长椅';b.timer=0;}
    else if(b.returning){b.returning=false;if(profile.seat){b.state='对齐长椅';b.timer=0;}else startRoute(profile.tour,'候车');}
    else{b.returning=true;const back=[...profile.tour].reverse().concat([profile.front]);startRoute(back,'候车');}
   }return;
  }
  if(b.state==='对齐长椅'){b.speed=0;turn(Math.PI/2,dt);if(Math.abs(angle(Math.PI/2,b.yaw))<.012&&Math.abs(b.angularVelocity)<.04){b.state='坐下';b.timer=0;}return;}
  const target=b.route[b.cursor];if(!target){wait();return;}
  const dx=target.x-b.position.x,dz=target.z-b.position.z,d=Math.hypot(dx,dz);
  if(d<.025){b.cursor++;b.speed=0;if(b.cursor>=b.route.length)wait();return;}
  const heading=Math.atan2(dx,dz),delta=turn(heading,dt),pace=(index===3?.46:.40)*(1-winter*.22)*(1-rain*.12);
  const goal=Math.abs(delta)>.35?0:Math.min(pace,Math.sqrt(2*.65*d));b.speed+=clamp(goal-b.speed,-dt*.8,dt*.65);
  const next=b.position.clone().add(V(Math.sin(b.yaw),0,Math.cos(b.yaw)).multiplyScalar(Math.min(d,b.speed*dt)));
  if(others.some(o=>o!==b&&Math.hypot(next.x-o.position.x,next.z-o.position.z)<.58)){b.speed=Math.max(0,b.speed-dt*.8);return;}
  next.y=height(next.x,next.z);b.travel+=Math.hypot(next.x-b.position.x,next.z-b.position.z);b.position.copy(next);
 }
 function turn(to,dt){const d=angle(to,b.yaw),desired=clamp(d*2,-1,1);b.angularVelocity+=clamp(desired-b.angularVelocity,-dt*1.8,dt*1.8);b.yaw+=b.angularVelocity*dt;return d;}
 // Start the standing travellers on their outward route, without synchronized loops.
 if(index===2||index===3){b.state='行走';startRoute(profile.tour,'候车');}
 return Object.assign(b,{update,height});
}
export function legKnee(hip,ankle,forward,length=.47){
 const line=ankle.clone().sub(hip),d=Math.max(.001,line.length()),mid=hip.clone().lerp(ankle,.5),axis=line.multiplyScalar(1/d);
 const bend=forward.clone().addScaledVector(axis,-forward.dot(axis)).normalize();return mid.addScaledVector(bend,Math.sqrt(Math.max(0,length*length-d*d/4)));
}
export function planFootStep(layout,from,target,height=(x,z)=>stationWalkHeight(layout,x,z)){
 // Land in the middle of a tread. Sample the risers before starting the swing,
 // so clearance is a smooth arc rather than a frame-by-frame vertical correction.
 if(Math.abs(target.z-layout.entry.z)<layout.entry.width/2){const step=layout.steps.find(s=>Math.abs(target.x-s.x)<s.width/2);if(step)target.x=step.x;}
 target.y=height(target.x,target.z)+.05;
 let lift=.10+Math.abs(target.y-from.y)*.6;
 for(let i=1;i<80;i++){const t=i/80,q=from.clone().lerp(target,ease(t));lift=Math.max(lift,(height(q.x,q.z)+.052-q.y)/Math.sin(Math.PI*t));}
 return lift+.02;
}
export function createPeople(station,shared){
 const layout=station.layout,group=new THREE.Group();group.name='车站生活 · 四位旅客';station.group.add(group);
 const profiles=stationPeopleRoutes(layout),sphere=new THREE.SphereGeometry(1,12,8),cylinder=new THREE.CylinderGeometry(1,1,1,8);
 const skin=mat('#c79d7c',.92),hair=mat('#3d3831',.96),trousers=mat('#424b4b',.95),shoe=mat('#3d3c35',.9),scarf=mat('#c39b66',.95),umbrellaMat=mat('#697e75',.9);
 const owned=m=>{m.userData.seasonOwn=true;return m;};[skin,hair,trousers,shoe,scarf,umbrellaMat].forEach(owned);
 function ellipsoid(parent,material,scale,pos){const o=mesh(sphere,material,parent);o.scale.set(...scale);o.position.set(...pos);return o;}
 function bone(parent,material,r){const o=mesh(cylinder,material,parent);o.userData.radius=r;return o;}
 function segment(o,a,b){o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(o.userData.radius,a.distanceTo(b),o.userData.radius);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}
 const people=profiles.map((p,i)=>{
  const behavior=createPersonBehavior(layout,p,i),root=new THREE.Group();group.add(root);root.name=p.name;const cloth=owned(mat(p.color,.95));
  const pelvis=ellipsoid(root,trousers,[.17,.12,.13],[0,0,0]),torso=ellipsoid(root,cloth,[.205,.30,.145],[0,.29,0]);
  ellipsoid(root,skin,[.07,.10,.07],[0,.58,0]);const head=new THREE.Group();root.add(head);head.position.y=.70;
  ellipsoid(head,skin,[.13,.17,.13],[0,0,0]);ellipsoid(head,hair,[.136,.10,.137],[0,.105,-.013]);ellipsoid(head,skin,[.037,.043,.045],[0,-.015,.13]);
  for(const side of[-1,1])ellipsoid(head,hair,[.013,.014,.012],[side*.048,.03,.12]);
  const wrap=ellipsoid(root,scarf,[.105,.065,.11],[0,.57,0]);
  const arms=[-1,1].map(side=>({side,upper:bone(root,cloth,.065),lower:bone(root,cloth,.053),hand:ellipsoid(root,skin,[.05,.07,.04],[side*.22,-.1,0])}));
  const legs=[-1,1].map(side=>({side,upper:bone(root,trousers,.075),lower:bone(root,trousers,.058),foot:ellipsoid(root,shoe,[.065,.045,.14],[0,0,0]),point:V(),from:V(),target:V(),phase:1,planted:true}));
  const canopy=new THREE.Group();root.add(canopy);const cover=mesh(new THREE.SphereGeometry(.49,12,5,0,Math.PI*2,0,Math.PI/2),umbrellaMat,canopy);cover.scale.y=.4;cover.position.set(.20,1.06,0);const handle=bone(canopy,hair,.012);segment(handle,V(.20,.3,0),V(.20,1.1,0));canopy.visible=false;
  const person={root,head,torso,pelvis,arms,legs,wrap,canopy,behavior,clock:0,nextLeg:0,hipY:0};
  legs.forEach(l=>{const c=Math.cos(behavior.yaw),s=Math.sin(behavior.yaw),x=behavior.position.x+c*l.side*.10,z=behavior.position.z-s*l.side*.10;if(behavior.sit>0){l.point.set(-2.92,layout.top+.05,z);}else l.point.set(x,stationWalkHeight(layout,x,z)+.05,z);});return person;
 });
 let previous=shared.time.value;const stats={count:people.length,states:''};
 function update(time,night){
  const dt=clamp(time-previous,0,.1);previous=time;const env={night,rain:shared.rain.value,winter:shared.season.value.w},bodies=people.map(p=>p.behavior);
  bodies.forEach(b=>b.update(dt,env,bodies.filter(x=>!x.external)));
  people.forEach(p=>{
   const b=p.behavior,c=Math.cos(b.yaw),s=Math.sin(b.yaw),needsUmbrella=!b.external&&env.rain>.35&&(Math.abs(b.position.z)>4.05||b.position.x< -4.4||b.position.x> -2.55);p.clock+=dt;
   const settling=b.sit===0&&!['起身','坐下'].includes(b.state)&&p.legs.some(l=>Math.hypot(l.point.x-b.position.x-c*l.side*.10,l.point.z-b.position.z+s*l.side*.10)>.13);
   const stepping=!b.riding&&(b.speed>.035||Math.abs(b.angularVelocity)>.08||settling);
   if(stepping&&p.clock>.40&&!p.legs.some(l=>l.phase<1)&&b.sit===0){const l=p.legs[p.nextLeg];p.nextLeg=1-p.nextLeg;p.clock=0;l.from.copy(l.point);const stride=b.speed>.035?.21:0,x=b.position.x+c*l.side*.10+s*stride,z=b.position.z-s*l.side*.10+c*stride;l.target.set(x,0,z);l.lift=planFootStep(layout,l.from,l.target,b.height);l.phase=0;l.planted=false;}
   p.legs.forEach(l=>{if(l.phase<1){l.phase=Math.min(1,l.phase+dt/.38);l.point.copy(l.from).lerp(l.target,ease(l.phase));l.point.y+=Math.sin(Math.PI*l.phase)*l.lift;l.planted=l.phase===1;}});
   let y=b.position.y+(b.external?.90:.95);
   if(b.sit>0)y=THREE.MathUtils.lerp(y,1.14,b.sit);
   // Keep both leg chains reachable on stairs, without pulling feet through treads.
   if(b.sit===0)for(const l of p.legs){const horizontal=Math.hypot(b.position.x+c*l.side*.10-l.point.x,b.position.z-s*l.side*.10-l.point.z);y=Math.min(y,l.point.y+Math.sqrt(Math.max(.1,.92*.92-horizontal*horizontal)));}
   p.hipY=p.hipY===0?y:p.hipY+(y-p.hipY)*(1-Math.exp(-dt*12));p.root.position.set(b.position.x,p.hipY,b.position.z);p.root.rotation.y=b.yaw;
   const local=point=>{const d=point.clone().sub(p.root.position);return V(d.x*c-d.z*s,d.y,d.x*s+d.z*c);};
   p.legs.forEach(l=>{const a=V(l.side*.10,0,0),end=local(l.point),k=legKnee(a,end,V(0,0,1));segment(l.upper,a,k);segment(l.lower,k,end);l.foot.position.copy(end);});
   p.arms.forEach(a=>{const swing=Math.sin(b.travel*13+(a.side>0?Math.PI:0))*.22*Math.min(1,b.speed/.35)*(1-b.sit),shoulder=V(a.side*.20,.45,0),elbow=V(a.side*.23,.20,.04+swing),hand=V(a.side*.21,-.025,.04+swing*.8);if(b.sit>.1){elbow.z+=b.sit*.13;hand.z+=b.sit*.27;hand.y+=b.sit*.12;}if(b.signal&&a.side===1){elbow.set(.28,.55,.10);hand.set(.34,.82,.12);}if(needsUmbrella&&a.side===1){elbow.set(.32,.23,.1);hand.set(.20,.46,0);}segment(a.upper,shoulder,elbow);segment(a.lower,elbow,hand);a.hand.position.copy(hand);});
   p.torso.rotation.x=b.sit*.12;p.head.rotation.y=Math.sin(time*.32+people.indexOf(p))*.10;p.wrap.visible=env.winter>.25;p.canopy.visible=needsUmbrella;
  });
  stats.states=people.map(p=>p.behavior.state).join(' / ');
 }
 update(shared.time.value,shared.night.value);
 return{group,people,stats,update};
}
