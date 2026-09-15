import * as THREE from './vendor/three.module.js';
import {V,mat,box,mesh} from './scene-world.mjs';
const clamp=THREE.MathUtils.clamp;
export function createBoarding(train,cast,layout){
 const passenger=cast.people[1],guard=cast.people[2],actors=[passenger,guard];
 const uniform=mat('#294955'),gold=mat('#dfbc72'),bag=mat('#74513a');for(const m of[uniform,gold,bag])m.userData.seasonOwn=true;
 guard.root.name='列车员';passenger.root.name='乘客';guard.torso.material=uniform;guard.arms.forEach(a=>a.upper.material=a.lower.material=uniform);
 box(guard.head,uniform,[.29,.09,.27],[0,.18,0]);box(guard.head,uniform,[.27,.025,.12],[0,.14,.16]);box(guard.root,gold,[.08,.045,.02],[.09,.43,.143]);
 box(passenger.root,bag,[.17,.26,.21],[.28,-.20,0]);const handle=mesh(new THREE.TorusGeometry(.055,.009,5,10),bag,passenger.root);handle.position.set(.28,-.045,0);
 let stage='行驶中',phase=0,seen=-1,motion=null,sequence=[],passengerAboard=false,guardAboard=true,completed=0;
 train.service.hold(false);train.setDoors(0);
 function door(z,x=-1.02,y=.84){train.group.updateMatrixWorld(true);return V(...Object.values(layout.toLocal(train.cars[0].localToWorld(V(x,y,z)))));}
 // Points use actual car transforms, never assumed station/door alignment.
 function route(z){const inner=door(z,-.28),threshold=door(z,-1.02),step=door(z,-1.19,.65),edge=door(z,-1.45,layout.top),queue=door(z,-2.15,layout.top);return[queue,edge,step,threshold,inner];}
 function resetFeet(p){const b=p.behavior,c=Math.cos(b.yaw),s=Math.sin(b.yaw);p.legs.forEach(l=>{l.point.set(b.position.x+c*l.side*.1,b.position.y+.05,b.position.z-s*l.side*.1);l.phase=1;l.planted=true;});p.hipY=b.position.y+.90;}
 function carry(p,z){const b=p.behavior;b.riding=true;b.position.copy(door(z,-.28));b.yaw=Math.atan2(train.cars[0].matrixWorld.elements[8],train.cars[0].matrixWorld.elements[10])-layout.angle;b.speed=0;b.angularVelocity=0;b.state=p===guard?'随车值乘':'车内乘车';b.height=()=>b.position.y;resetFeet(p);}
 actors.forEach(p=>{p.behavior.external=true;p.behavior.sit=0;p.behavior.signal=false;});
 passenger.behavior.state='等候上车';passenger.behavior.height=()=>layout.top;carry(guard,-1.95);actors.forEach(resetFeet);
 function startMove(p,points,label,done){
  const b=p.behavior;b.riding=false;b.state=label;b.speed=0;b.signal=false;
  motion={p,points:[b.position.clone(),...points.map(p=>p.clone())],at:1,done};
  b.height=(x,z)=>{let nearest=Infinity,y=layout.top;for(let i=1;i<motion?.points.length;i++){const a=motion.points[i-1],c=motion.points[i],dx=c.x-a.x,dz=c.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(d<nearest){nearest=d;y=a.y+(c.y-a.y)*t;}}return y;};
 }
 function walk(dt){const m=motion,b=m.p.behavior,target=m.points[m.at],dx=target.x-b.position.x,dz=target.z-b.position.z,d=Math.hypot(dx,dz);if(d<.025){b.position.copy(target);b.speed=0;m.at++;if(m.at===m.points.length){motion=null;b.height=()=>b.position.y;m.done();}return;}
  const to=Math.atan2(dx,dz),a=Math.atan2(Math.sin(to-b.yaw),Math.cos(to-b.yaw));b.angularVelocity+=clamp(clamp(a*2.5,-1.4,1.4)-b.angularVelocity,-2*dt,2*dt);b.yaw+=b.angularVelocity*dt;
  const goal=Math.abs(a)>.28?0:Math.min(.65,Math.sqrt(1.0*d));b.speed+=clamp(goal-b.speed,-.9*dt,.6*dt);const step=Math.min(d,b.speed*dt);b.position.x+=Math.sin(b.yaw)*step;b.position.z+=Math.cos(b.yaw)*step;b.position.y=b.height(b.position.x,b.position.z);b.travel+=step;
 }
 function exchange(){
  const g=route(-1.95),p=route(1.95);sequence=[()=>{guardAboard=false;startMove(guard,g.slice(0,-1).reverse(),'下车巡视',()=>{guard.behavior.state='看护上下客';guard.behavior.signal=true;});}];
  if(passengerAboard)sequence.push(()=>{passengerAboard=false;startMove(passenger,p.slice(0,-1).reverse(),'下车离开门区',()=>{passenger.behavior.state='等候上车';});});
  sequence.push(()=>startMove(passenger,p,'上车',()=>{passengerAboard=true;carry(passenger,1.95);resetFeet(passenger);}));
  sequence.push(()=>{stage='确认发车';phase=0;guard.behavior.signal=true;});
 }
 function update(dt,enabled=true){
  if(!enabled){train.service.hold(false);train.setDoors(0);stage='行驶中';motion=null;sequence=[];guardAboard=true;passengerAboard=true;seen=-1;return;}
  if(guardAboard)carry(guard,-1.95);if(passengerAboard)carry(passenger,1.95);
  if(dt<=0)return;
  if(train.service.dwell>0&&train.service.stops!==seen){seen=train.service.stops;stage='开门';phase=0;train.service.hold(true);}
  if(stage==='开门'){phase=Math.min(1,phase+dt/1.25);train.setDoors(phase);if(phase===1){stage='上下客';exchange();}}
  else if(stage==='上下客'){if(motion)walk(dt);else if(sequence.length)sequence.shift()();}
  else if(stage==='确认发车'){phase+=dt;if(phase>2){guard.behavior.signal=false;stage='列车员回车';startMove(guard,route(-1.95),'回车',()=>{guardAboard=true;carry(guard,-1.95);resetFeet(guard);stage='关门';phase=1;});}}
  else if(stage==='列车员回车')walk(dt);
  else if(stage==='关门'){phase=Math.max(0,phase-dt/1.25);train.setDoors(phase);if(phase===0){completed++;stage='行驶中';train.service.hold(false);}}
 }
 return{update,get stage(){return stage},get completed(){return completed},get passengerAboard(){return passengerAboard},get guardAboard(){return guardAboard},get moving(){return !!motion}};
}
