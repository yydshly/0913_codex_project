import {random} from './scene-world.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createWanderer(seed){
 const rand=random(seed),point=()=>{const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.82;return{x:Math.cos(a)*r,z:Math.sin(a)*r};};
 const p=point();return {...p,vx:0,vz:0,yaw:rand()*Math.PI*2,target:point(),rest:rand()*2,pace:.72+rand()*.5,rand,point,speed:0};
}
// Local elliptical coordinates preserve the validated habitat. Acceleration,
// pauses and separation vary independently; there is no shared lap phase.
export function stepWanderers(agents,dt,speed,rx,rz,separation){
 if(dt<=0)return;dt=Math.min(dt,.1);
 const previous=agents.map(a=>({x:a.x,z:a.z}));
 agents.forEach((a,i)=>{
  a.rest=Math.max(0,a.rest-dt);
  let dx=(a.target.x-a.x)*rx,dz=(a.target.z-a.z)*rz,distance=Math.hypot(dx,dz);
  if(distance<.18&&a.rest===0){a.target=a.point();a.rest=.7+a.rand()*3.7;}
  let vx=0,vz=0;
  if(a.rest===0&&distance>.001){const pace=speed*a.pace*Math.min(1,distance/.7);vx=dx/distance*pace;vz=dz/distance*pace;}
  for(let j=0;j<previous.length;j++)if(i!==j){const x=(a.x-previous[j].x)*rx,z=(a.z-previous[j].z)*rz,d=Math.hypot(x,z);if(d<separation&&d>.001){const force=(1-d/separation)*speed*3;vx+=x/d*force;vz+=z/d*force;}}
  const blend=1-Math.exp(-dt*1.8);a.vx+=(vx-a.vx)*blend;a.vz+=(vz-a.vz)*blend;
  const v=Math.hypot(a.vx,a.vz),limit=speed*1.35;if(v>limit){a.vx*=limit/v;a.vz*=limit/v;}
  a.speed=Math.hypot(a.vx,a.vz);
  if(a.speed>.018){const desired=Math.atan2(a.vx,a.vz),delta=Math.atan2(Math.sin(desired-a.yaw),Math.cos(desired-a.yaw));a.yaw+=clamp(delta,-dt*1.6,dt*1.6);a.vx=Math.sin(a.yaw)*a.speed;a.vz=Math.cos(a.yaw)*a.speed;}
  a.x+=a.vx/rx*dt;a.z+=a.vz/rz*dt;
  const radius=Math.hypot(a.x,a.z);if(radius>.94){a.x*=.94/radius;a.z*=.94/radius;const outward=a.vx*a.x/rx+a.vz*a.z/rz;if(outward>0){a.vx*=.3;a.vz*=.3;}a.target={x:0,z:0};}
 });
 // A short positional constraint prevents bodies interpenetrating while the
 // softer steering above anticipates encounters. Projection remains local.
 for(let pass=0;pass<4;pass++){
  for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++){
   const a=agents[i],b=agents[j],dx=(a.x-b.x)*rx,dz=(a.z-b.z)*rz,d=Math.hypot(dx,dz),minimum=separation*.75;
   if(d<minimum&&d>.0001){const push=(minimum-d)*.5;a.x+=dx/d*push/rx;a.z+=dz/d*push/rz;b.x-=dx/d*push/rx;b.z-=dz/d*push/rz;}
  }
  for(const a of agents){const r=Math.hypot(a.x,a.z);if(r>.94){a.x*=.94/r;a.z*=.94/r;}}
 }
}
