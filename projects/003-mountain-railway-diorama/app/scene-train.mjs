import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,labelTexture} from './scene-world.mjs';
import {createCab,windowMaterial,sideWindow} from './scene-cab.mjs';
import {createService} from './scene-service.mjs';
import {stationLayout,trainDimensions} from './scene-station-layout.mjs';
export function createTrain(scene,world,startU,makeLabel=labelTexture){const group=new THREE.Group();group.name='02 双节观景列车';scene.add(group);const cream=mat('#eadbc2',.5),red=mat('#9a3d34',.48),roof=mat('#506465',.42,.35),steel=mat('#293b3a',.46,.55),glass=windowMaterial();const lightMat=mat('#fff1bc');lightMat.emissive.set('#ffd899');lightMat.emissiveIntensity=2;const signMat=mat('#fff');signMat.map=makeLabel('白鹭线','#162f2b','#eee0ba');const cars=[],bogies=[],wheels=[],doors=[];let cab;
 for(let i=0;i<2;i++){const car=new THREE.Group();group.add(car);cars.push(car);box(car,steel,[1.65,.32,5.45],[0,.58,0]);box(car,steel,[1.85,.15,5.5],[0,.765,0]);for(const side of[-1,1])for(const [z,length]of[[-2.55,.4],[0,3.1],[2.55,.4]]){box(car,red,[.09,.38,length],[side*.915,1.03,z]);if(z===0){box(car,cream,[.09,.28,length],[side*.915,1.45,z]);box(car,cream,[.09,.30,length],[side*.915,2.59,z]);for(const [pz,pw]of[[-1.42,.26],[-.425,.11],[.425,.11],[1.42,.26]])box(car,cream,[.09,.86,pw],[side*.915,2.01,pz]);}else box(car,cream,[.09,1.52,length],[side*.915,1.98,z]);}const roofGeo=new THREE.CylinderGeometry(1,1,5.66,16,1,false,0,Math.PI);roofGeo.rotateZ(Math.PI/2);roofGeo.rotateY(Math.PI/2);const r=mesh(roofGeo,roof,car);r.rotation.z=Math.PI;r.position.y=2.79;r.scale.y=.35;box(car,roof,[2.02,.12,5.65],[0,2.80,0]);for(const side of[-1,1]){
   // Body-side doors establish boarding positions independently of decorative windows.
   for(const z of[-.85,0,.85]){
    sideWindow(car,glass,steel,side,z);
   }
   for(const z of trainDimensions.doorPositions){
    const leaf=new THREE.Group();car.add(leaf);leaf.position.z=z;doors.push({leaf,side,z,car:i});for(const e of[-1,1])box(leaf,steel,[.045,1.90,.05],[side*.986,1.79,e*.335]);
    box(leaf,cream,[.035,.83,.66],[side*1.016,1.255,0]);box(leaf,cream,[.035,.29,.66],[side*1.016,2.595,0]);
    sideWindow(leaf,glass,steel,side,0,2.06,.60,.78,1.034);
    box(leaf,red,[.022,.49,.47],[side*1.037,1.20,0]);
    box(leaf,steel,[.03,.16,.035],[side*1.054,1.53,.19]);
    box(car,steel,[.23,.10,.77],[side*1.09,.60,z]);
    box(car,cream,[.025,.10,.68],[side*1.21,.65,z]);
   }
   box(car,red,[.028,.08,2.7],[side*.983,1.40,0]);
  }
  for(const z of[-.75,.75]){box(car,roof,[.6,.09,.34],[0,3.13,z]);}

 for(const end of[-1,1]){if(i===0&&end===1)continue;box(car,red,[1.92,.55,.08],[0,1.115,end*2.72]);box(car,cream,[1.92,.30,.08],[0,1.54,end*2.72]);box(car,cream,[1.92,.38,.08],[0,2.55,end*2.72]);for(const x of[-.86,.86])box(car,cream,[.20,.68,.08],[x,2.02,end*2.72]);const pane=mesh(new THREE.PlaneGeometry(1.5,.67),glass,car);pane.rotation.y=end<0?Math.PI:0;pane.position.set(0,2.02,end*2.771);box(car,steel,[.2,.15,.6],[0,.67,end*2.91]);if(i===1&&end===-1)for(const side of[-1,1]){const l=mesh(new THREE.SphereGeometry(.08,10,8),red,car);l.position.set(side*.70,1.24,end*2.8);}}
 for(const side of[-1,1])for(const z of[-.65,.65]){box(car,roof,[.42,.10,.64],[side*.52,1.23,z]);box(car,roof,[.08,.45,.64],[side*.74,1.43,z]);}
 if(i===0)cab=createCab(car,{cream,red,roof,steel,glass,signMat,lightMat});
 const carBogies=[];for(const offset of[-trainDimensions.bogieOffset,trainDimensions.bogieOffset]){const b=new THREE.Group();b.position.z=offset;car.add(b);carBogies.push(b);box(b,steel,[1.15,.22,.9],[0,.37,0]);for(const z of[-.3,.3])for(const side of[-1,1]){const w=mesh(new THREE.CylinderGeometry(.3,.3,.17,12),steel,b);w.rotation.z=Math.PI/2;w.position.set(side*.72,.29,z);wheels.push(w);}}bogies.push(carBogies);}
 const head=new THREE.SpotLight('#ffe7ae',0,36,.28,.65,1.2);head.position.set(0,1.3,3.94);head.target.position.set(0,0,20);cars[0].add(head,head.target);const cabin=new THREE.PointLight('#ffd791',0,9,2);cabin.position.set(0,2,0);cars[0].add(cabin);const service=createService(world.length,stationLayout(world).stopDistance,startU*world.length);
 const up=V(0,1,0),a=V(),b=V(),tangent=V(),right=V(),normal=V(),basis=new THREE.Matrix4(),focus=V();
 const sample=s=>world.curve.getPointAt(((s/world.length)%1+1)%1);
 function place(){cars.forEach((car,i)=>{const s=service.distance-i*trainDimensions.spacing;a.copy(sample(s-1.65));b.copy(sample(s+1.65));tangent.copy(b).sub(a).normalize();right.crossVectors(up,tangent).normalize();normal.crossVectors(tangent,right);basis.makeBasis(right,normal,tangent);car.position.copy(a).add(b).multiplyScalar(.5);car.quaternion.setFromRotationMatrix(basis);bogies[i].forEach((bogie,j)=>{const d=s+(j===0?-1.65:1.65),point=sample(d),t=world.curve.getTangentAt(((d/world.length)%1+1)%1);bogie.position.copy(car.worldToLocal(point));const q=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),t);bogie.quaternion.copy(car.quaternion).invert().multiply(q);});});focus.copy(cars[0].position).add(V(0,1.3,0));}
 place();let doorOpen=0;return{group,cars,focus,service,cab,get doorOpen(){return doorOpen},setDoors(value){doorOpen=THREE.MathUtils.clamp(value,0,1);doors.forEach(d=>d.leaf.position.z=d.z+(d.side===-1?-Math.sign(d.z)*doorOpen*.82:0));},update(dt,time,opts){const a=world.curve.getTangentAt((service.progress+.015)%1),b=world.curve.getTangentAt((service.progress-.015+1)%1),angle=Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1));service.update(dt,opts.speed,opts.paused,angle);place();cab.update(dt,time,{...opts,speed:service.speed});head.intensity=opts.night*25;cabin.intensity=opts.night*2.2;wheels.forEach(w=>w.rotation.x=-service.distance/.3);}};
}
