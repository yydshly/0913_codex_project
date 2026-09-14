import * as T from './vendor/three.module.js';
import {clamp,smooth} from './outdoor-core.mjs';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0);
function part(parent,geo,color,roughness=.8){const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness}));mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function segment(mesh,a,b){const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(up,d.normalize());}

// Distance-driven anchors remain reproducible when the timeline is scrubbed backwards.
export function footPlacement(motion,sign,ground){
 const {route,routeDistance:d,p}=motion,stride=.88,stance=.60,offset=sign<0?0:.5;
 const at=distance=>{const q=route.sample(clamp(distance/route.length));return{x:q.x+Math.cos(q.heading)*sign*.11,z:q.z-Math.sin(q.heading)*sign*.11,heading:q.heading};};
 let q=at(d),lift=0,planted=true;if(motion.watching){q={x:p.x+Math.cos(p.heading)*sign*.11,z:p.z-Math.sin(p.heading)*sign*.11,heading:p.heading};const turn=motion.viewTurn??1;lift=.055*Math.sin(Math.PI*clamp((turn-(sign<0?0:.5))*2));planted=lift<.001;}
 if(motion.walking){const cycle=d/stride+offset,index=Math.floor(cycle),phase=cycle-index,anchor=(index-offset+stance*.5)*stride,a=at(anchor),b=at(anchor+stride);
  q=a;if(phase>stance){const t=(phase-stance)/(1-stance),u=smooth(t);q={x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,heading:a.heading+Math.atan2(Math.sin(b.heading-a.heading),Math.cos(b.heading-a.heading))*u};lift=Math.sin(Math.PI*t)*.17;planted=false;}
  const edge=smooth(d/.45)*smooth((route.length-d)/.45),rest=at(d);q={x:rest.x+(q.x-rest.x)*edge,z:rest.z+(q.z-rest.z)*edge,heading:rest.heading+Math.atan2(Math.sin(q.heading-rest.heading),Math.cos(q.heading-rest.heading))*edge};lift*=edge;
 }
 const s=Math.sin(q.heading),c=Math.cos(q.heading),height=(x,z)=>ground(q.x+c*x+s*z,q.z-s*x+c*z);
 return{...q,y:height(0,0)+.10+lift,pitch:-Math.atan2(height(0,.12)-height(0,-.12),.24),roll:Math.atan2(height(.07,0)-height(-.07,0),.14),planted};
}

export function addVehicleRig(car,land){
 const wheels=[],brakes=[],headlamps=[];
 for(const side of [-1,1])for(const z of [-1.07,1.06]){
  const pivot=new T.Group,spin=new T.Group;car.add(pivot);pivot.add(spin);pivot.position.set(side*.84,.4,z);
  const tire=new T.CylinderGeometry(.38,.38,.24,24);tire.rotateZ(Math.PI/2);part(spin,tire,'#242926');
  const hub=new T.CylinderGeometry(.20,.20,.255,16);hub.rotateZ(Math.PI/2);part(spin,hub,'#a4aaa3',.38);
  for(let i=0;i<6;i++){const spoke=part(spin,new T.BoxGeometry(.26,.035,.31),'#59645c',.5);spoke.rotation.x=i*Math.PI/3;}
  wheels.push({pivot,spin,front:z>0});
 }
 for(const side of [-1,1]){
  const brake=part(car,new T.BoxGeometry(.24,.13,.055),'#b94630');brake.position.set(side*.57,.84,-1.68);brakes.push(brake.material);
  const lens=part(car,new T.BoxGeometry(.34,.16,.055),'#e8e4ce');lens.position.set(side*.52,.8,1.68);headlamps.push(lens.material);
  const spot=new T.SpotLight('#fff0cd',0,15,Math.PI/7,.6,2);spot.position.copy(lens.position);spot.target.position.set(side*.5,.1,12);car.add(spot,spot.target);headlamps.push(spot);
  part(car,new T.BoxGeometry(.2,.12,.26),'#56675a',.5).position.set(side*.9,1.23,.48);
 }
 return{update(motion,light){const p=land.drive.sample(motion.driveProgress),s=Math.sin(p.heading),c=Math.cos(p.heading),height=(x,z)=>land.terrain(p.x+c*x+s*z,p.z-s*x+c*z);
  const fl=height(-.84,1.06),fr=height(.84,1.06),bl=height(-.84,-1.07),br=height(.84,-1.07);
  const pitch=-Math.atan2((fl+fr-bl-br)/2,2.13),roll=Math.atan2((fr+br-fl-bl)/2,1.68);
  car.position.set(p.x,(fl+fr+bl+br)/4-.02,p.z);car.rotation.set(pitch,p.heading,roll,'YXZ');
  const a=land.drive.sample(Math.max(0,motion.driveProgress-.01)),b=land.drive.sample(Math.min(1,motion.driveProgress+.01)),turn=Math.atan2(Math.sin(b.heading-a.heading),Math.cos(b.heading-a.heading)),steer=motion.driveProgress>=1?0:Math.max(-.48,Math.min(.48,Math.atan(2.13*turn/Math.max(.01,Math.hypot(b.x-a.x,b.z-a.z)))));
  for(const w of wheels){w.pivot.rotation.y=w.front?steer:0;w.spin.rotation.x=motion.driveProgress*land.drive.length/.38;}
  const braking=motion.driveProgress>.83&&motion.driveProgress<1,night=Math.max(0,(.55-light.brightness)/.55);
  for(const m of brakes){m.emissive.set('#e83f22');m.emissiveIntensity=braking?2.4:.08;}
  for(const item of headlamps){if(item.isSpotLight)item.intensity=motion.driveProgress<1?night*22:0;else{item.emissive.set('#ffedc8');item.emissiveIntensity=motion.driveProgress<1?night*1.8:0;}}
  return p;
 }};
}

export function createWalker(parent,land){
 const root=new T.Group,upper=new T.Group;parent.add(root);root.add(upper);
 part(upper,new T.CapsuleGeometry(.18,.35,6,12),'#bb773c').position.y=1.14;
 const head=new T.Group;head.position.y=1.52;upper.add(head);part(head,new T.SphereGeometry(.145,14,10),'#c9aa89').position.y=.09;
 const cap=part(head,new T.SphereGeometry(.154,12,8,0,Math.PI*2,0,Math.PI/2),'#3b5748');cap.position.y=.14;
 part(head,new T.BoxGeometry(.24,.025,.16),'#3b5748').position.set(0,.15,.13);
 const lamp=part(head,new T.BoxGeometry(.10,.06,.05),'#dadbcb');lamp.position.set(0,.16,.18);lamp.material.emissive.set('#fff0cb');
 const beam=new T.SpotLight('#fff2d8',0,9,.48,.65,2);beam.position.set(0,1.65,.2);beam.castShadow=true;beam.shadow.mapSize.set(512,512);beam.shadow.bias=-.001;root.add(beam,beam.target);
 part(upper,new T.BoxGeometry(.33,.45,.20),'#334f42').position.set(0,1.16,-.24);
 for(const x of [-.13,.13])part(upper,new T.BoxGeometry(.035,.4,.035),'#c1ad7e').position.set(x,1.18,.18);
 const legs=[],arms=[];
 for(const sign of [-1,1]){
  const thigh=part(root,new T.CylinderGeometry(.067,.06,1,9),'#394b42'),shin=part(root,new T.CylinderGeometry(.055,.047,1,9),'#455247'),boot=part(root,new T.BoxGeometry(.14,.12,.25),'#302f27');
  legs.push({sign,thigh,shin,boot});
  const arm=new T.Group;arm.position.set(sign*.24,1.35,0);upper.add(arm);const sleeve=part(arm,new T.CapsuleGeometry(.052,.38,4,8),'#bb773c');sleeve.position.y=-.24;part(arm,new T.SphereGeometry(.058,8,6),'#c9aa89').position.set(0,-.5,.04);
  const pole=part(root,new T.CylinderGeometry(.011,.011,1,6),'#9caaa0');arms.push({arm,pole,sign});
 }
 function ground(x,z){const y=land.terrain(x,z),site=land.summit;return y+(Math.abs(x-site.x)<1.65&&Math.abs(z-site.z)<1.4?.17:0);}
 return{root,update(motion,light={brightness:1}){const p=motion.p,walking=motion.walking,phase=motion.routeDistance/.88*Math.PI*2,s=Math.sin(p.heading),c=Math.cos(p.heading),base=ground(p.x,p.z);
  root.visible=motion.visible;root.position.set(p.x,base,p.z);root.rotation.y=p.heading;head.rotation.x=motion.watching?-Math.atan(light.elevation??0)*(motion.viewTurn??1):0;
  const sample=(x,z)=>ground(p.x+c*x+s*z,p.z-s*x+c*z)-base;
  const lampPower=walking?Math.max(0,(.55-light.brightness)/.55):0;beam.intensity=lampPower*24;beam.target.position.set(0,sample(0,3)+.08,3);lamp.material.emissiveIntensity=lampPower*2;
  const grade=(sample(0,.35)-sample(0,-.35))/.7;
  upper.rotation.x=walking?Math.max(-.18,Math.min(.18,grade*.2)):0;
  const feet=legs.map(leg=>footPlacement(motion,leg.sign,ground));
  const weight=walking?.025*Math.sin(motion.routeDistance/.88*Math.PI*2):0,pelvis=walking?-.035+.02*Math.cos(motion.routeDistance/.44*Math.PI*2):0;
  upper.position.set(weight,pelvis,0);upper.rotation.z=-weight*.7;
  for(let i=0;i<2;i++){
   const leg=legs[i],a=phase+i*Math.PI,x=leg.sign*.11,anchor=feet[i],dx=anchor.x-p.x,dz=anchor.z-p.z;
   const hip=V(x+weight,.86+pelvis,0),foot=V(c*dx-s*dz,anchor.y-base,s*dx+c*dz),d=foot.clone().sub(hip),distance=Math.max(.05,Math.min(.895,d.length())),mid=hip.clone().add(foot).multiplyScalar(.5),bend=Math.sqrt(Math.max(0,.45**2-(distance/2)**2)),side=V(0,-d.z,d.y).normalize().multiplyScalar(-bend),knee=mid.add(side);
   segment(leg.thigh,hip,knee);segment(leg.shin,knee,foot);leg.boot.position.copy(foot).add(V(0,-.025,0));leg.boot.rotation.set(anchor.pitch,anchor.heading-p.heading,anchor.roll,'YXZ');leg.boot.userData.planted=anchor.planted;
   const arm=arms[i];arm.arm.rotation.x=walking?-.18-Math.cos(a)*.28:-.08;arm.pole.visible=walking&&motion.poles!==false;
   if(walking){const hand=V(arm.sign*.3,.88,.15+Math.cos(a)*.14),tip=V(arm.sign*.38,sample(arm.sign*.38,.4)+.015,.4);segment(arm.pole,hand,tip);}
  }
 }};
}
