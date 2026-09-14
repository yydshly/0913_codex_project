import {sceneSurfaceAt} from './surface-state.js';
import {advanceSnow} from './snow-weather.js';
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const hailSurfaceAt=(x,z,waterOrQuery=0)=>sceneSurfaceAt(x,z,typeof waterOrQuery==='object'?waterOrQuery:{water:waterOrQuery});
export const restitution={stone:.29,roof:.22,earth:.065,water:0,snow:.035,foliage:.025};
// Moving canopy proxies and growing snow can leave a particle outside the sampled tops.
// Bound every cycle so escaped particles cannot live forever after a weather change.
export const hailExpired=p=>p.age>8||p.y<-2||!Number.isFinite(p.y);
// Fixed small substeps limit penetration; energy and rebound count are bounded.
export function stepHail(p,dt,surfaceAt){
 const events=[],elapsed=Math.max(0,Math.min(.1,dt));
 if(p.rest!==undefined){p.rest+=elapsed;return events;}
 const steps=Math.ceil(elapsed*120);if(!steps)return events;const h=elapsed/steps;
 for(let i=0;i<steps;i++){
  const previous={x:p.x,y:p.y,z:p.z};
  p.vy-=9.81*h;p.vx*=Math.exp(-.15*h);p.vz*=Math.exp(-.15*h);
  p.x+=p.vx*h;p.z+=p.vz*h;p.y+=p.vy*h;
  const ceiling=previous.y-p.radius;
  const surface=surfaceAt(p.x,p.z,{ceiling});
  if(surface&&p.vy<0&&ceiling>=surface.y-1e-6&&p.y-p.radius<=surface.y){
   const fraction=Math.max(0,Math.min(1,(ceiling-surface.y)/(previous.y-p.y)));
   const x=previous.x+(p.x-previous.x)*fraction,z=previous.z+(p.z-previous.z)*fraction;
   const contact=surfaceAt(x,z,{ceiling});
   if(!contact||Math.abs(contact.y-surface.y)>.06)continue;
   p.x=x;p.z=z;
   const speed=-p.vy;p.y=surface.y+p.radius;
   events.push({x:p.x,y:surface.y,z:p.z,kind:'hail-'+surface.kind,strength:Math.min(1,speed/12),speed});
   p.bounces++;p.vy=speed*(restitution[surface.kind]??.06);p.vx*=.55;p.vz*=.55;
   if(p.bounces>=3||p.vy<.65){p.vy=0;p.rest=0;break;}
  }
 }
 return events;
}
export function makeHailWeather(T,scene){
 const count=420,group=new T.Group();group.name='host-hail';group.userData.noRainOcclusion=true;scene.add(group);
 const day=T.uniform(1),tea=T.uniform(0),path=T.uniform(0);
 const range=(x,y,z,r)=>T.max(0,T.float(1).sub(T.distance(T.positionWorld,T.vec3(x,y,z)).div(r))).pow(2);
 const lit=range(-4,3,-2,9).mul(tea).add(range(-1,1.1,5,6).add(range(3,1.1,10,6)).mul(path));
 const material=new T.MeshBasicNodeMaterial({color:0xd9e6ed});
 material.colorNode=T.color(0xcbdde9).mul(day.mul(.8).add(.018)).add(T.color(0xffd6aa).mul(lit));material.userData.noWet=true;
 const mesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material,count);mesh.frustumCulled=false;mesh.userData.noRainOcclusion=true;group.add(mesh);
 const particles=Array.from({length:count},(_,i)=>({id:i,cycle:0,wait:hash(i)*3})),dummy=new T.Object3D();
 let intensity=0,events=[],total=0,activeCount=0;const bySurface={roof:0,stone:0,earth:0,water:0,snow:0,foliage:0};
 function update({time=0,dt,enabled,rain=0,wind,hours,lights={},water=0,snow=0,camera}){
  intensity=advanceSnow(intensity,enabled?1-Math.min(1,rain):0,dt,enabled?2:1.5);events=[];
  if(intensity<.002&&activeCount===0){group.visible=false;return{intensity:0,falling:0,bouncing:0,resting:0,impacts:total,bySurface:{...bySurface},capacity:count};}
  day.value=Math.max(0,Math.min(1,Math.sin((hours-6)/12*Math.PI)*1.8));tea.value=lights.tea??0;path.value=lights.path??0;
  let falling=0,bouncing=0,resting=0;
  const surfaceAt=(x,z,query={})=>sceneSurfaceAt(x,z,{...query,water,snow,time,wind:wind.length?.()??Math.hypot(wind.x,wind.z)});
  for(const p of particles){
   if(p.wait!==undefined){
    p.wait-=dt;
    if(p.wait<=0&&hash(p.id+11)<intensity){
     const seed=p.id*17+(p.cycle++)*937,roof=hash(seed+3)<.24;
     p.x=roof?-8+hash(seed)*8:-10+hash(seed)*24;p.z=roof?-8+hash(seed+1)*8:1+hash(seed+1)*13;
     p.radius=.012+hash(seed+2)*.017;p.y=(surfaceAt(p.x,p.z)?.y??0)+5+hash(seed+4)*7;p.vx=wind.x*.2+(hash(seed+5)-.5);p.vz=wind.z*.2+(hash(seed+6)-.5);p.vy=-8-hash(seed+7)*4;p.bounces=0;p.age=0;delete p.wait;delete p.rest;
    }
   }
   if(p.wait===undefined){
    p.age+=dt;const hits=stepHail(p,dt,surfaceAt);total+=hits.length;
    for(const e of hits){bySurface[e.kind.slice(5)]++;events.push(e);}
    if(p.rest>.9||hailExpired(p)){p.wait=.15+hash(p.id+p.cycle)*.8;}
    if(p.wait===undefined){
     dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.id+p.cycle,p.y*2,p.z);dummy.scale.setScalar(p.radius*(p.rest===undefined?1:Math.max(0,1-p.rest/.9)));
     if(p.rest!==undefined)resting++;else if(p.bounces)bouncing++;else falling++;
    }else dummy.scale.setScalar(0);
   }else dummy.scale.setScalar(0);
   dummy.updateMatrix();mesh.setMatrixAt(p.id,dummy.matrix);
  }
  // Prefer nearby collisions when several happen in one frame; audio has its own voice budget.
  events.sort((a,b)=>Math.hypot(a.x-camera.position.x,a.y-camera.position.y,a.z-camera.position.z)-Math.hypot(b.x-camera.position.x,b.y-camera.position.y,b.z-camera.position.z));
  events=events.slice(0,8);mesh.instanceMatrix.needsUpdate=true;activeCount=falling+bouncing+resting;group.visible=activeCount>0;
  return{intensity:+intensity.toFixed(3),falling,bouncing,resting,impacts:total,bySurface:{...bySurface},capacity:count,model:'bounded rebound, authored surface heights; no fracture or persistent hail piles'};
 }
 return{update,drainImpacts:()=>events.splice(0),dispose(){scene.remove(group);mesh.geometry.dispose();material.dispose();}};
}
