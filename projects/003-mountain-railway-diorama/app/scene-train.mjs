import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,labelTexture} from './scene-world.mjs';
import {createService} from './scene-service.mjs';
import {stationLayout,trainDimensions} from './scene-station-layout.mjs';
export function createTrain(scene,world,startU,makeLabel=labelTexture){const group=new THREE.Group();group.name='02 双节观景列车';scene.add(group);const cream=mat('#eadbc2',.5),red=mat('#9a3d34',.48),roof=mat('#506465',.42,.35),steel=mat('#293b3a',.46,.55),glass=mat('#5c8e95',.23,.2);glass.emissive.set('#ffce7d');const lightMat=mat('#fff1bc');lightMat.emissive.set('#ffd899');lightMat.emissiveIntensity=2;const signMat=mat('#fff');signMat.map=makeLabel('白鹭线','#162f2b','#eee0ba');const cars=[],bogies=[],wheels=[];
 for(let i=0;i<2;i++){const car=new THREE.Group();group.add(car);cars.push(car);box(car,steel,[1.65,.32,5.45],[0,.58,0]);box(car,red,[1.92,.68,5.5],[0,1.02,0]);box(car,cream,[1.92,1.12,5.5],[0,1.77,0]);const roofGeo=new THREE.CylinderGeometry(1,1,5.66,16,1,false,0,Math.PI);roofGeo.rotateZ(Math.PI/2);roofGeo.rotateY(Math.PI/2);const r=mesh(roofGeo,roof,car);r.rotation.z=Math.PI;r.position.y=2.35;r.scale.y=.35;box(car,roof,[2.02,.12,5.65],[0,2.36,0]);for(const side of[-1,1]){
   // Body-side doors establish boarding positions independently of decorative windows.
   for(const z of[-.85,0,.85]){
    box(car,steel,[.045,.78,.74],[side*.984,1.85,z]);
    box(car,glass,[.032,.62,.58],[side*1.012,1.87,z]);
    box(car,cream,[.045,.68,.035],[side*1.035,1.87,z]);
   }
   for(const z of trainDimensions.doorPositions){
    box(car,steel,[.045,1.49,.72],[side*.986,1.59,z]);
    box(car,cream,[.028,1.39,.59],[side*1.016,1.59,z]);
    box(car,glass,[.022,.56,.43],[side*1.038,1.96,z]);
    box(car,red,[.022,.49,.47],[side*1.037,1.20,z]);
    box(car,steel,[.03,.16,.035],[side*1.054,1.53,z+.19]);
    box(car,steel,[.23,.10,.77],[side*1.09,.60,z]);
    box(car,cream,[.025,.10,.68],[side*1.21,.65,z]);
   }
   box(car,red,[.028,.08,2.7],[side*.983,1.40,0]);
  }
  for(const z of[-.75,.75]){box(car,roof,[.6,.09,.34],[0,2.69,z]);}

 for(const end of[-1,1]){box(car,glass,[1.45,.66,.03],[0,1.94,end*2.766]);box(car,signMat,[.9,.28,.035],[0,2.42,end*2.78]);box(car,steel,[.2,.15,.6],[0,.67,end*2.91]);for(const side of[-1,1]){const l=mesh(new THREE.SphereGeometry(.115,10,8),i===0&&end===1?lightMat:red,car);l.position.set(side*.61,1.22,end*2.8)}}
 const carBogies=[];for(const offset of[-trainDimensions.bogieOffset,trainDimensions.bogieOffset]){const b=new THREE.Group();b.position.z=offset;car.add(b);carBogies.push(b);box(b,steel,[1.15,.22,.9],[0,.37,0]);for(const z of[-.3,.3])for(const side of[-1,1]){const w=mesh(new THREE.CylinderGeometry(.3,.3,.17,12),steel,b);w.rotation.z=Math.PI/2;w.position.set(side*.72,.29,z);wheels.push(w);}}bogies.push(carBogies);}
 const head=new THREE.SpotLight('#ffe7ae',0,36,.28,.65,1.2);head.position.set(0,1.3,2.9);head.target.position.set(0,0,20);cars[0].add(head,head.target);const cabin=new THREE.PointLight('#ffd791',0,9,2);cabin.position.set(0,2,0);cars[0].add(cabin);const service=createService(world.length,stationLayout(world).stopDistance,startU*world.length);
 const up=V(0,1,0),a=V(),b=V(),tangent=V(),right=V(),normal=V(),basis=new THREE.Matrix4(),focus=V();
 const sample=s=>world.curve.getPointAt(((s/world.length)%1+1)%1);
 function place(){cars.forEach((car,i)=>{const s=service.distance-i*trainDimensions.spacing;a.copy(sample(s-1.65));b.copy(sample(s+1.65));tangent.copy(b).sub(a).normalize();right.crossVectors(up,tangent).normalize();normal.crossVectors(tangent,right);basis.makeBasis(right,normal,tangent);car.position.copy(a).add(b).multiplyScalar(.5);car.quaternion.setFromRotationMatrix(basis);bogies[i].forEach((bogie,j)=>{const d=s+(j===0?-1.65:1.65),point=sample(d),t=world.curve.getTangentAt(((d/world.length)%1+1)%1);bogie.position.copy(car.worldToLocal(point));const q=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),t);bogie.quaternion.copy(car.quaternion).invert().multiply(q);});});focus.copy(cars[0].position).add(V(0,1.3,0));}
 place();return{group,cars,focus,service,update(dt,time,opts){const a=world.curve.getTangentAt((service.progress+.015)%1),b=world.curve.getTangentAt((service.progress-.015+1)%1),angle=Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1));service.update(dt,opts.speed,opts.paused,angle);place();glass.emissiveIntensity=.015+opts.night*.72;head.intensity=opts.night*25;cabin.intensity=opts.night*2.2;wheels.forEach(w=>w.rotation.x=-service.distance/.3);}};
}
