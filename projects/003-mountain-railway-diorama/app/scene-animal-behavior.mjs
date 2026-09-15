import {frozenShore,iceCoverage} from './scene-ice.mjs';
import * as THREE from './vendor/three.module.js';
import {V,random} from './scene-world.mjs';
const clamp=THREE.MathUtils.clamp,TAU=Math.PI*2;
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const ease=x=>x*x*(3-2*x);
export function steerHeading(body,heading,dt,maxRate=.6,acceleration=1){
 const turn=angleDelta(heading,body.yaw),wanted=clamp(turn*1.8,-maxRate,maxRate);
 body.angularVelocity=(body.angularVelocity||0)+clamp(wanted-(body.angularVelocity||0),-acceleration*dt,acceleration*dt);
 body.yaw+=body.angularVelocity*dt;return turn;
}


export function shoreHabitats(world){
 const sites=[],obstacles=world.animalObstacles||[];
 const clear=(x,z,margin)=>world.footprint(x,z)&&world.closest(x,z).distance>3.5+margin&&
  !(world.riverRocks||[]).some(r=>r.kind!=='bank'&&Math.hypot(x-r.x,z-r.z)<Math.max(r.rx,r.rz)+margin)&&
  !(world.groundTrees||[]).some(t=>Math.hypot(x-t.x,z-t.z)<margin+1)&&
  !obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+margin)&&
  !(Math.abs(z-15)<3.3&&Math.abs(x-(world.riverX(15)-world.halfWidth(15)-1))<2);
 for(let z=3.5;z<20;z+=.3)for(const side of[1,-1]){
  const path=[];let safe=true;
  for(let i=0;i<=28;i++){
   const f=i/28,pz=z-2+4*f,half=world.halfWidth(pz),x=world.riverX(pz)+side*(half*.35+(half*.65+.95)*f),y=world.height(x,pz),water=world.waterSurface(x,pz);
   const p=V(x,Math.max(water,y+.28),pz);if(!clear(x,pz,.68))safe=false;
   if(path.length){const prev=path.at(-1);if(Math.abs(p.y-prev.y)/Math.max(.01,Math.hypot(p.x-prev.x,p.z-prev.z))>.75)safe=false;}
   path.push(p);
  }
  const home=path.at(-1).clone();home.y=world.height(home.x,home.z);
  if(home.y<world.waterSurface(home.x,home.z)+.1||!clear(home.x,home.z,.85)||path[0].z<world.waterStyle.end+3)safe=false;
  if(!safe||sites.some(s=>s.home.distanceTo(home)<3.2))continue;
  // Short dry steps beside the entry, selected only where the feet have ground.
  const walks=[home];for(const dz of[-.9,.9]){const z=home.z+dz,x=world.riverX(z)+side*(world.halfWidth(z)+.95),y=world.height(x,z);if(clear(x,z,.7)&&y>world.waterSurface(x,z)+.1&&Math.abs(y-home.y)<.45)walks.push(V(x,y,z));}
  const birdHome=[[side*.95,-.6],[side*.35,-1.5],[side*.35,1.5],[-side*.2,-1.5]].map(([dx,dz])=>{const p=home.clone().add(V(dx,0,dz));p.y=world.height(p.x,p.z);return p;}).find(p=>clear(p.x,p.z,.9)&&p.y>world.waterSurface(p.x,p.z)+.1);
  if(!birdHome)continue;
  sites.push({side,path,home,birdHome,walks,z:path[0].z});if(sites.length===3)return sites;
 }
 return sites;
}
export function pointOnShore(world,site,t){
 const f=clamp(t,0,1)*(site.path.length-1),i=Math.min(site.path.length-2,Math.floor(f)),p=site.path[i].clone().lerp(site.path[i+1],f-i);
 p.y=Math.max(world.waterSurface(p.x,p.z)+.015,world.height(p.x,p.z)+.28);return p;
}
export function reserveAnimalShore(rocks,sites){
 return rocks.filter(r=>r.kind!=='bank'||!sites.some(s=>[...s.path,...s.walks,s.birdHome].some(p=>Math.hypot(p.x-r.x,p.z-r.z)<Math.max(r.rx,r.rz)+.95)));
}
export function createDuckBehavior(world,sites,index){
 const rand=random(2901+index*277),site=sites[index%sites.length];if(!site)return null;
 const start=index===0?.75:index===1?0:1;
 const b={site,position:pointOnShore(world,site,start),yaw:site.side*Math.PI/2,speed:0,angularVelocity:0,land:0,gait:0,state:index===0?'上岸':index===1?'游泳':'岸边休息',timer:0,duration:6+rand()*5,progress:start,target:null,rand};
 const endState=s=>{b.state=s;b.timer=0;b.duration=4+rand()*8;b.target=null;};
 function update(dt,environment,others=[]){
  if(dt<=0)return;b.timer+=dt;b.steered=false;const {night=0,rain=0,winter=0}=environment;
  const frozen=frozenShore(world,site,winter);b.iceBlocked=frozen;
  if(frozen&&b.land<.5&&b.state==='上岸'){b.state='下水';b.target=null;}
  if(frozen&&b.land>.8&&b.state==='下水'){endState('岸边休息');}
  if(frozen&&b.state==='靠岸')endState('水中停留');
  if(b.state==='岸边休息'){
   b.speed*=Math.exp(-dt*6);
   if(b.timer>b.duration){if(night>.65||rain>.7||frozen){b.timer=0;b.duration=8+rand()*12;}else endState(rand()<.55&&site.walks.length>1?'行走':'下水');}
  }else if(b.state==='行走'){
   if(!b.target){const choices=site.walks.filter(p=>Math.hypot(p.x-b.position.x,p.z-b.position.z)>.35);b.target=(choices[Math.floor(rand()*choices.length)]||site.home).clone();}
   if(moveTo(b.target,.22*(1-winter*.3),dt,others)){endState('岸边休息');}
  }else if(b.state==='上岸'||b.state==='下水'){
   const direction=b.state==='上岸'?1:-1;
   const target=pointOnShore(world,site,clamp(b.progress+direction*.08,0,1));
   if(moveTo(target,b.land>.5?.26:.48,dt,others))b.progress=clamp(b.progress+direction*.08,0,1);
   if((direction>0&&b.progress>=1)||(direction<0&&b.progress<=0))endState(direction>0?'岸边休息':'游泳');
  }else if(b.state==='水中停留'){
   b.speed*=Math.exp(-dt*5);if(b.timer>b.duration)endState(!frozen&&(night>.65||rain>.7||rand()<.6)?'靠岸':'游泳');
  }else if(b.state==='靠岸'){
   if(moveTo(site.path[0],.38,dt,others)){b.progress=0;endState('上岸');}
  }else{
   if(!b.target){const z=site.z+(rand()-.5)*1.6,x=world.riverX(z)+site.side*world.halfWidth(z)*(.2+rand()*.18);b.target=V(x,world.waterSurface(x,z),z);}
   if(moveTo(b.target,.38*(1-winter*.35)*(1-night*.65),dt,others))endState('水中停留');
   if(!frozen&&(night>.7||rain>.7||b.timer>18))endState('靠岸');
  }
  if(!b.steered)steerHeading(b,b.yaw,dt,.7,.8);
  const ground=world.height(b.position.x,b.position.z),water=world.waterSurface(b.position.x,b.position.z);
  b.land=clamp((ground+.28-water)/.3,0,1);b.position.y=Math.max(water+.015,ground+.28);
  b.gait+=b.speed*dt*12;
 }
 function moveTo(target,pace,dt,others){
  const dx=target.x-b.position.x,dz=target.z-b.position.z,d=Math.hypot(dx,dz);if(d<.09){b.speed=0;return true;}
  const turn=steerHeading(b,Math.atan2(dx,dz),dt,b.land>.5?.7:.2+b.speed/1.2,.8);b.steered=true;
  const desired=pace*(b.land>.5?Math.max(0,Math.cos(turn)):.25+.75*Math.max(0,Math.cos(turn)))*Math.min(1,d/.5);b.speed+=(desired-b.speed)*(1-Math.exp(-dt*3));
  const next=b.position.clone().add(V(Math.sin(b.yaw),0,Math.cos(b.yaw)).multiplyScalar(Math.min(d,b.speed*dt)));
  if(others.some(o=>o!==b&&Math.hypot(next.x-o.position.x,next.z-o.position.z)<1.2)){b.speed=0;return false;}
  const iceAhead=b.iceBlocked&&b.state!=='下水'&&b.land<.5&&iceCoverage(world,next.x,next.z,1)>.22;
  const blocked=iceAhead||(world.riverRocks||[]).some(r=>Math.hypot(next.x-r.x,next.z-r.z)<Math.max(r.rx,r.rz)+.6)||(world.animalObstacles||[]).some(r=>Math.hypot(next.x-r.x,next.z-r.z)<r.radius+.55);
  if(blocked||world.closest(next.x,next.z).distance<3.1||!world.footprint(next.x,next.z)){b.speed=0;return false;}
  b.position.copy(next);return false;
 }
 return Object.assign(b,{update});
}

// A whole excursion is planned before takeoff. Shared endpoint tangents and
// arc-length sampling preserve direction and speed across the entire journey.
export function createBirdJourney(world,site,rand=random(5931)){
 const home=site.birdHome.clone().add(V(0,.66,0)),side=site.side;
 let high=Math.max(13,home.y+8);for(const t of world.groundTrees||[])high=Math.max(high,t.y+t.height+3);
 const spread=rand()*12,far=95+rand()*20;
 for(let attempt=0;attempt<5;attempt++){
  const lift=attempt*3;
  const points=[home,home.clone().add(V(-side*5,7+lift,4)),V(world.riverX(20)-side*4,high,26),V(-side*(38+spread),high+4,75),V(-side*far,high+7,96),V(-side*(far+32),high+8,15),V(-side*far,high+6,-77),V(-side*25,high+3,-72),V(world.riverX(site.z)-side*5,high,site.z-12),home.clone().add(V(-side*5,7+lift,-4)),home.clone()];
  const tangents=points.map((p,i)=>i===0?points[1].clone().sub(p).normalize():i===points.length-1?p.clone().sub(points[i-1]).normalize():points[i+1].clone().sub(points[i-1]).normalize());
  const route=new THREE.CurvePath();
  for(let i=0;i<points.length-1;i++){
   const length=points[i].distanceTo(points[i+1]),before=i?points[i].distanceTo(points[i-1]):length,after=i+2<points.length?points[i+1].distanceTo(points[i+2]):length;
   const a=points[i].clone().addScaledVector(tangents[i],Math.min(length,before)*.32),b=points[i+1].clone().addScaledVector(tangents[i+1],-Math.min(length,after)*.32);
   const segment=new THREE.CubicBezierCurve3(points[i],a,b,points[i+1]);segment.arcLengthDivisions=180;route.add(segment);
  }
  let safe=true;
  for(const segment of route.curves)for(let k=0;k<=80;k++){
   const p=segment.getPoint(k/80);if(!world.footprint(p.x,p.z))continue;
   if(p.y<world.height(p.x,p.z)+.48||(world.groundTrees||[]).some(t=>Math.hypot(p.x-t.x,p.z-t.z)<1.8&&p.y<t.y+t.height+1))safe=false;
  }
  if(safe)return{route,length:route.getLength(),points};
 }
 return null;
}
export function createBirdBehavior(world,sites,index){
 const site=sites[index%sites.length];if(!site)return null;
 const rand=random(5931+index*89),home=site.birdHome.clone(),floor=home.y+.66;
 const b={site,home,position:V(home.x,floor,home.z),yaw:-site.side*Math.PI/2,angularVelocity:0,state:'停栖',timer:0,duration:9+rand()*14,fold:1,legs:1,speed:0,flap:index,bank:0,journey:null,distance:0,away:false};
 const rest=()=>{b.state='停栖';b.timer=0;b.duration=12+rand()*25;b.speed=0;b.fold=1;b.legs=1;b.away=false;};
 function plan(){b.journey=createBirdJourney(world,site,rand);b.distance=0;if(!b.journey){b.timer=0;b.duration=15;return false;}return true;}
 function pose(){
  const {route,length}=b.journey,u=clamp(b.distance/length,0,1),remaining=length-b.distance;
  b.position.copy(route.getPoint(u));const t=route.getTangent(Math.min(.99999,u));
  b.fold=remaining<5?ease(clamp(1-remaining/5,0,1)):1-ease(clamp(b.distance/3,0,1));
  b.legs=remaining<11?ease(clamp(1-remaining/11,0,1)):1-ease(clamp(b.distance/5,0,1));
  b.away=Math.hypot(b.position.x,b.position.z)>72;
  b.state=b.distance<13?'起飞':remaining<20?'降落':b.away?'远处飞行':u>.6?'返回河谷':'飞离河谷';
  return t;
 }
 if(index===0&&plan()){b.distance=b.journey.length-15;const t=pose();b.yaw=Math.atan2(t.x,t.z);b.speed=2;}
 else if(index===2&&plan()){b.distance=35;const t=pose();b.yaw=Math.atan2(t.x,t.z);b.speed=3.2;}
 function update(dt,{night=0,rain=0,wind=0,winter=0,windAlong=0,wingRate=2.1}){
  if(dt<=0)return;b.timer+=dt;
  if(b.state==='停栖'){
   b.bank*=Math.exp(-dt*5);b.angularVelocity=0;
   if(b.timer>b.duration*(1+winter*1.4)&&night<.55&&rain<.55&&wind<.85&&plan()){b.state='准备起飞';b.timer=0;}
   return;
  }
  if(b.state==='准备起飞'){
   if(night>.6||rain>.6){rest();return;}
   const t=b.journey.route.getTangent(0),heading=Math.atan2(t.x,t.z);steerHeading(b,heading,dt,.7,1.2);
   if(Math.abs(angleDelta(heading,b.yaw))<.015&&Math.abs(b.angularVelocity)<.08){b.state='起飞';b.timer=0;}
   return;
  }
  const remaining=b.journey.length-b.distance,cruise=3.6*clamp(1+windAlong*.16,.78,1.18);
  const desired=Math.min(cruise,.35+remaining*.48);b.speed+=(desired-b.speed)*(1-Math.exp(-dt*1.2));
  b.distance=Math.min(b.journey.length,b.distance+b.speed*dt);
  const oldYaw=b.yaw,t=pose();b.yaw=Math.atan2(t.x,t.z);b.angularVelocity=angleDelta(b.yaw,oldYaw)/dt;
  b.bank+=(clamp(-Math.atan(b.speed*b.angularVelocity/9.81),-.48,.48)-b.bank)*(1-Math.exp(-dt*3));
  b.flap+=dt*(b.state==='起飞'?3.4:b.state==='降落'?2.8:wingRate);
  if(b.distance>=b.journey.length){b.position.set(home.x,floor,home.z);rest();}
 }
 return Object.assign(b,{update});
}

export function createFishBehavior(world,count=7){
 const rand=random(8192),fish=[];
 const valid=p=>world.footprint(p.x,p.z)&&p.z>world.waterStyle.end+3&&world.closest(p.x,p.z).distance>3&&
  Math.abs(p.x-world.riverX(p.z))<world.halfWidth(p.z)*.63&&world.waterSurface(p.x,p.z)-p.y>.43&&p.y-world.height(p.x,p.z)>.36&&
  !(world.riverRocks||[]).some(r=>Math.hypot(p.x-r.x,p.z-r.z)<Math.max(r.rx,r.rz)+.7);
 const target=()=>{for(let k=0;k<80;k++){const z=5.5+rand()*8.5,x=world.riverX(z)+(rand()-.5)*world.halfWidth(z)*1.1,p=V(x,world.waterSurface(x,z)-.5-rand()*.13,z);if(valid(p))return p;}return V(world.riverX(9),world.waterLevel(9)-.5,9);};
 for(let i=0;i<count;i++){let p=target();for(let k=0;k<80&&fish.some(f=>Math.hypot(f.position.x-p.x,f.position.z-p.z)<1.05);k++)p=target();fish.push({position:p,yaw:rand()*TAU,angularVelocity:0,speed:.12,velocity:V(),target:target(),timer:rand()*6,duration:4+rand()*7,state:'缓游',beat:rand()*TAU,pitch:0,avoidTime:0});}
 function update(dt,{winter=0,night=0}){
  if(dt<=0)return;const snapshot=fish.map(f=>({p:f.position.clone(),v:f.velocity.clone()}));
  fish.forEach((f,i)=>{
   f.timer+=dt;f.avoidTime=Math.max(0,f.avoidTime-dt);if(f.timer>f.duration||f.position.distanceTo(f.target)<.4){f.timer=0;f.duration=4+rand()*9;f.target=target();f.state=rand()<.28?'悬停':rand()<.18?'短促游动':'缓游';}
   const desired=f.target.clone().sub(f.position).normalize();let neighbors=0,alignment=V(),centre=V();
   snapshot.forEach((o,j)=>{if(j===i)return;const offset=f.position.clone().sub(o.p);offset.y=0;const d=offset.length();if(d<1.8&&d>.001)desired.addScaledVector(offset.normalize(),(1-d/1.8)*4);if(d<2.4){neighbors++;alignment.add(o.v);centre.add(o.p);}});
   if(neighbors&&f.state==='缓游'){desired.addScaledVector(alignment.normalize(),.3);desired.addScaledVector(centre.multiplyScalar(1/neighbors).sub(f.position).normalize(),.12);}
   const turn=steerHeading(f,Math.atan2(desired.x,desired.z),dt,.16+f.speed/1.1,.65);
   const pace=(f.state==='悬停'?.035:f.state==='短促游动'?.65:.26)*(1-winter*.55)*(1-night*.4),speed=pace*(.28+.72*Math.max(0,Math.cos(turn)));f.speed+=(speed-f.speed)*(1-Math.exp(-dt*2.4));
   const depthTarget=Math.min(world.waterSurface(f.position.x,f.position.z)-.47,f.target.y-winter*.07),dy=clamp(depthTarget-f.position.y,-.06,.06)*dt;
   const step=V(Math.sin(f.yaw)*f.speed*dt,dy,Math.cos(f.yaw)*f.speed*dt),next=f.position.clone().add(step);
   if(valid(next)&&!snapshot.some((o,j)=>j!==i&&Math.hypot(o.p.x-next.x,o.p.z-next.z)<1)){f.position.copy(next);f.velocity.copy(step).multiplyScalar(1/dt);}else{f.speed*=.8;if(f.avoidTime<=0){f.target=target();f.avoidTime=2;}f.velocity.set(0,0,0);}
   f.pitch=clamp(-Math.atan2(f.velocity.y,Math.max(.1,f.speed)),-.1,.1);f.beat+=dt*(1+f.speed*12);
  });
 }
 return {fish,update,valid};
}
