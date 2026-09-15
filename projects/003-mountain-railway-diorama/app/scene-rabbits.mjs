import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,random} from './scene-world.mjs';
import {butterflySites} from './scene-butterflies.mjs';
import {stationLayout,stationOccupies} from './scene-station-layout.mjs';

export function rabbitSafe(world,anchors,x,z){
 if(!world.footprint(x,z)||world.closest(x,z).distance<4||stationOccupies(stationLayout(world),x,z,1.4)||Math.abs(x-world.riverX(z))<world.halfWidth(z)+1.5)return false;
 if(anchors.some(a=>Math.hypot(x-a.x,z-a.z)<1)||(world.animalObstacles||[]).some(a=>Math.hypot(x-a.x,z-a.z)<a.radius+.7))return false;
 const y=world.height(x,z);return Math.abs(world.height(x+.4,z)-y)+Math.abs(world.height(x,z+.4)-y)<.22;
}
export function rabbitHomes(world,anchors){return butterflySites(world,anchors,7851).filter(s=>rabbitSafe(world,anchors,s.x,s.z)).sort((a,b)=>b.z-a.z).slice(0,2);}
export function createRabbitMotion(world,anchors,home,seed){
 const rng=random(seed),m={position:V(home.x,home.y,home.z),yaw:rng()*6.28,state:'嗅闻雪地',wait:1+rng()*3,hop:0,landing:false,landings:0},origin=m.position.clone();let goal=null,desired=m.yaw,duration=0;
 m.update=(dt,active=true)=>{
  m.landing=false;if(dt<=0||!active)return;dt=Math.min(dt,.1);
  if(m.state==='跳跃'){
   m.hop=Math.min(1,m.hop+dt/duration);const t=m.hop;
   m.position.lerpVectors(origin,goal,t);m.position.y=world.height(m.position.x,m.position.z)+Math.sin(Math.PI*t)*.20;
   if(t===1){m.position.copy(goal);m.landing=true;m.landings++;m.wait=rng()<.5?.22+rng()*.4:3+rng()*7;m.state='嗅闻雪地';}
   return;
  }
  if(goal&&m.state==='转身观察'){
   const delta=Math.atan2(Math.sin(desired-m.yaw),Math.cos(desired-m.yaw)),step=THREE.MathUtils.clamp(delta,-1.3*dt,1.3*dt);m.yaw+=step;
   if(Math.abs(delta)<.03){m.yaw=desired;origin.copy(m.position);m.hop=0;duration=.55+origin.distanceTo(goal)*.24;m.state='跳跃';}return;
  }
  m.wait-=dt;if(m.wait>0)return;
  for(let attempt=0;attempt<32;attempt++){
   const angle=m.yaw+(rng()-.5)*(attempt<15?1.8:6.28),distance=.55+rng()*.65,x=m.position.x+Math.sin(angle)*distance,z=m.position.z+Math.cos(angle)*distance;
   if(Math.hypot(x-home.x,z-home.z)>2.8)continue;
   let safe=true;for(let i=0;i<=16;i++){const t=i/16,px=m.position.x+(x-m.position.x)*t,pz=m.position.z+(z-m.position.z)*t;if(!rabbitSafe(world,anchors,px,pz))safe=false;}
   if(!safe)continue;goal=V(x,world.height(x,z),z);desired=angle;m.state='转身观察';return;
  }
  m.wait=2+rng()*4;
 };
 return m;
}

export function createRabbits(parent,world,shared,anchors=[]){
 const group=new THREE.Group();group.name='冬季兔子与落脚雪印';parent.add(group);
 const homes=rabbitHomes(world,anchors),actors=[],stats={count:0,prints:0,states:''},sphere=new THREE.SphereGeometry(1,12,8);
 const fur=mat('#b9b4a4',.95),light=mat('#dedbd1',.98),ear=mat('#9b857e',.95),dark=mat('#393e36',.9);
 const materials=[fur,light,ear,dark];for(const m of materials){m.userData.seasonOwn=true;m.transparent=true;}
 homes.forEach((home,i)=>{
  const root=new THREE.Group();group.add(root);const body=new THREE.Group();root.add(body);
  const part=(parent,material,scale,position)=>{const o=mesh(sphere,material,parent);o.scale.set(...scale);o.position.set(...position);o.castShadow=true;return o;};
  part(body,fur,[.23,.25,.38],[0,.3,-.06]);part(body,light,[.18,.19,.20],[0,.43,.28]);part(body,light,[.10,.10,.10],[0,.34,-.43]);
  const ears=[];for(const side of[-1,1]){const e=new THREE.Group();e.position.set(side*.09,.54,.26);body.add(e);part(e,fur,[.055,.25,.055],[0,.16,0]);part(e,ear,[.029,.18,.019],[0,.17,.043]);e.rotation.z=side*.13;ears.push(e);part(body,dark,[.025,.026,.019],[side*.112,.48,.435]);}
  part(body,ear,[.032,.025,.025],[0,.405,.473]);const paws=[];
  for(const hind of [false,true])for(const side of[-1,1]){const paw=part(root,light,[hind?.085:.052,.052,hind?.14:.082],[side*(hind?.16:.115),.052,hind?-.23:.22]);paws.push({mesh:paw,hind});}
  actors.push({root,body,ears,paws,motion:createRabbitMotion(world,anchors,home,892+i*173)});
 });
 const capacity=256,prints=[],dummy=new THREE.Object3D(),up=V(0,1,0);
 const printMat=new THREE.MeshBasicMaterial({color:'#73818a',transparent:true,opacity:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});printMat.userData.seasonOwn=true;
 printMat.onBeforeCompile=shader=>{shader.vertexShader='attribute float aPrintOpacity;varying float vPrintOpacity;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPrintOpacity=aPrintOpacity;');shader.fragmentShader='varying float vPrintOpacity;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vPrintOpacity;');};printMat.customProgramCacheKey=()=> 'rabbit-snow-prints-v38';
 const g=new THREE.CircleGeometry(1,12);g.rotateX(-Math.PI/2);const opacity=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1);g.setAttribute('aPrintOpacity',opacity);const tracks=new THREE.InstancedMesh(g,printMat,capacity);tracks.count=0;tracks.frustumCulled=false;group.add(tracks);let cursor=0,previous=shared.time.value;
 function stamp(actor,time){actor.root.updateMatrixWorld(true);for(const paw of actor.paws){const p=paw.mesh.getWorldPosition(V());prints[cursor]={x:p.x,z:p.z,yaw:actor.motion.yaw,hind:paw.hind,born:time};cursor=(cursor+1)%capacity;}}
 function update(time){const dt=Math.max(0,Math.min(.1,time-previous));previous=time;const snow=THREE.MathUtils.smoothstep(shared.season.value.w,.35,.85);for(const m of materials)m.opacity=snow;stats.count=snow>.01?actors.length:0;
  actors.forEach(a=>{a.root.visible=snow>.01;a.motion.update(dt,snow>.85);const m=a.motion;a.root.position.copy(m.position);a.root.rotation.y=m.yaw;const jumping=m.state==='跳跃';a.body.rotation.x=jumping?Math.sin(m.hop*Math.PI*2)*.13:0;a.body.scale.y=jumping?1+Math.sin(m.hop*Math.PI)*.08:1;for(let j=0;j<a.ears.length;j++)a.ears[j].rotation.x=jumping?-.23:Math.sin(time*.8+j+a.motion.yaw)*.08;
   if(m.landing&&snow>.85)stamp(a,time);
  });
  if(snow===0){prints.length=0;cursor=0;}
  stats.prints=0;tracks.count=prints.length;
  prints.forEach((p,i)=>{const fade=Math.max(0,1-(time-p.born)/75);opacity.setX(i,fade*fade*.36*snow);if(fade>0&&snow>.01)stats.prints++;
   const y=world.height(p.x,p.z),normal=V(world.height(p.x-.1,p.z)-world.height(p.x+.1,p.z),.2,world.height(p.x,p.z-.1)-world.height(p.x,p.z+.1)).normalize();dummy.position.set(p.x,y+.045,p.z);dummy.quaternion.setFromUnitVectors(up,normal);dummy.rotateY(p.yaw);dummy.scale.set(p.hind?.080:.048,1,p.hind?.135:.078);dummy.updateMatrix();tracks.setMatrixAt(i,dummy.matrix);
  });tracks.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;stats.states=actors.map(a=>a.motion.state).join(' / ');
 }
 update(shared.time.value);
 return{group,actors,homes,stats,update,get prints(){return prints},get target(){const h=homes[0];return h?V(h.x,h.y+.3,h.z):V(0,5,0)}};
}
