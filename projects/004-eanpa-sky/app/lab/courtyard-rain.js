import {waterLevel,waterAt,shoreCoverage,retreatMemory} from './shoreline.js';
import {advanceGround} from './weather-response.js';
import {groundSurfaceAt as groundAt} from './surface-state.js';
// Focused host-side rain in the unobstructed courtyard. Not a whole-scene fluid solver.
import {makeWaveField} from './water-waves.js';
import {spraySample} from './splash-motion.js';
import {earthHeight,depressions} from './rain-experience.js';
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export {groundSurfaceAt as groundAt} from './surface-state.js';
export function advancePuddles(value,rain,dt){const r=Math.max(0,Math.min(1,rain));return r+(value-r)*Math.exp(-Math.max(0,Math.min(.1,dt))/(r>value?18:100));}
export function makeCourtyardRain(T,scene){
 const group=new T.Group();group.name='courtyard-rain-contact';group.userData.noRainOcclusion=true;scene.add(group);
 const N=480,day=T.uniform(1),tea=T.uniform(0),path=T.uniform(0);
 // A cheap local scattering approximation keeps small drops readable near lamps without lighting the horizon.
 const range=(x,y,z,r)=>T.max(0,T.float(1).sub(T.distance(T.positionWorld,T.vec3(x,y,z)).div(r))).pow(2);
 const lit=range(-4,3,-2,9).mul(tea).add(range(-1,1.1,5,6).add(range(3,1.1,10,6)).mul(path));
 const mat=new T.MeshStandardNodeMaterial({color:0xc3d6df,roughness:.22,transparent:true,opacity:.55,depthWrite:false});mat.userData.noWet=true;
 mat.opacityNode=T.sin(T.uv().y.mul(Math.PI)).mul(.55);
 mat.emissiveNode=T.color(0xadc4d7).mul(day.mul(.12)).add(T.color(0xffd2a1).mul(lit.mul(.65)));
 const streaks=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,4),mat,N);streaks.frustumCulled=false;group.add(streaks);
 const ringMat=mat.clone();ringMat.opacity=.42;ringMat.side=T.DoubleSide;
 const ringGeo=new T.RingGeometry(.94,1,32),impactAlpha=new T.InstancedBufferAttribute(new Float32Array(N),1);ringGeo.setAttribute('impactAlpha',impactAlpha);ringMat.opacityNode=T.attribute('impactAlpha').mul(.3);
 const rings=new T.InstancedMesh(ringGeo,ringMat,N);rings.frustumCulled=false;group.add(rings);
 const sprayGeo=new T.PlaneGeometry(1,1),sprayAlpha=new T.InstancedBufferAttribute(new Float32Array(N*3),1);sprayGeo.setAttribute('sprayAlpha',sprayAlpha);
 const sprayMat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});sprayMat.userData.noWet=true;
 const q=T.uv().sub(.5).mul(2);sprayMat.opacityNode=T.exp(T.dot(q,q).mul(-3.5)).mul(T.attribute('sprayAlpha'));
 sprayMat.colorNode=T.color(0xa7bdce).mul(day.mul(.6).add(.015)).add(T.color(0xffd2a1).mul(lit.mul(.7)));
 const spray=new T.InstancedMesh(sprayGeo,sprayMat,N*3);spray.frustumCulled=false;group.add(spray);
 const level=T.uniform(waterLevel(0));
 const pools=depressions.map(([x,z,rx,rz])=>{
  const field=makeWaveField({rx,rz}),material=new T.MeshStandardNodeMaterial({color:0x596e76,roughness:.15,metalness:.3,transparent:true,depthWrite:false,alphaTest:.015});material.userData.noWet=true;
  material.opacityNode=T.float(1).sub(T.smoothstep(.97,1,T.length(T.uv().sub(.5).mul(2)))).mul(T.smoothstep(.001,.006,level.sub(T.attribute('bedHeight')))).mul(.78);
  const geometry=new T.PlaneGeometry(2,2,63,63),mesh=new T.Mesh(geometry,material);geometry.attributes.position.setUsage(T.DynamicDrawUsage);geometry.attributes.normal.setUsage(T.DynamicDrawUsage);
  const bed=new Float32Array(4096);for(let i=0;i<bed.length;i++)bed[i]=earthHeight(x+geometry.attributes.position.getX(i)*rx,z-geometry.attributes.position.getY(i)*rz);geometry.setAttribute('bedHeight',new T.BufferAttribute(bed,1));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.075,z);mesh.scale.set(rx,rz,1);mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);return{mesh,field,x,z,rx,rz,bed,coverage:0};
 });
 const upload=pool=>{const p=pool.mesh.geometry.attributes.position,n=pool.mesh.geometry.attributes.normal;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=y*64+x,f=(63-y)*64+x;p.setZ(i,pool.field.sample(x,63-y)*shoreCoverage(level.value-pool.bed[i]));n.setXYZ(i,pool.field.normals[f*3],pool.field.normals[f*3+1],pool.field.normals[f*3+2]);}p.needsUpdate=true;n.needsUpdate=true;
 };
 let wavesWereEnabled=true,nextShoreStats=0;
 const disturb=()=>{if(waterAt(pools[0].x,pools[0].z,wet).coverage<=.08)return false;return pools[0].field.impulse(.5,.5,.005);};
 const sites=Array.from({length:N},(_,i)=>({x:i%8===0?4.4+(hash(i+13)-.5)*1.5:-5.15+hash(i+13)*7.3,z:i%8===0?4+(hash(i+203)-.5)*.85:1.7+hash(i+203)*9.8,period:.65+hash(i+72)*.8,offset:hash(i+917)*3,threshold:hash(i+721)*.95,cycle:-1}));
 const obj=new T.Object3D(),direction=new T.Vector3(),up=new T.Vector3(0,1,0),right=new T.Vector3(),cameraUp=new T.Vector3();let wet=0,total=0,wetReach=0,groundMemory={puddle:0,moisture:0};
 let meltwaterReceived=0;
 function update({time,dt,rain,wind,hours,lights={},camera,viewportHeight=900,wavesEnabled=true,cloud=0,meltwater=0}){
  const r=Math.max(0,Math.min(1,rain));groundMemory=advanceGround(groundMemory,r,dt,{hours,wind:wind?.length?.()??0,cloud,meltwater});wet=groundMemory.puddle;meltwaterReceived+=groundMemory.meltInput;
  day.value=Math.max(0,Math.min(1,(6-Math.abs(hours-12))/2));tea.value=lights.tea??0;path.value=lights.path??0;
  wetReach=retreatMemory(wetReach,wet,dt);level.value=waterLevel(wet);pools.forEach(pool=>{pool.mesh.visible=wet>.001;pool.mesh.position.y=level.value;if(!wavesEnabled&&wavesWereEnabled){pool.field.reset();upload(pool);}});wavesWereEnabled=wavesEnabled;
  camera.updateMatrixWorld();right.setFromMatrixColumn(camera.matrixWorld,0);cameraUp.setFromMatrixColumn(camera.matrixWorld,1);
  let falling=0,contacts=0,activeSpray=0;const wx=(wind?.x??0)*.035,wz=(wind?.z??0)*.035;
  direction.set(-wx,-6,-wz).normalize();
  for(let i=0;i<N;i++){
   const s=sites[i],age=(time+s.offset)%s.period,cycle=Math.floor((time+s.offset)/s.period),fall=.42,active=r>s.threshold,ground=groundAt(s.x,s.z,wet);
   obj.rotation.set(0,0,0);obj.quaternion.setFromUnitVectors(up,direction);
   if(active&&age<fall){const f=age/fall;obj.position.set(s.x+wx*(1-f),ground.y+6*(1-f)+.1,s.z+wz*(1-f));obj.scale.set(.009,.18+hash(i)*.20,.009);falling++;}else obj.scale.setScalar(0);
   obj.updateMatrix();streaks.setMatrixAt(i,obj.matrix);
   const a=age-fall,contact=active&&a>=0&&a<.48;
   impactAlpha.setX(i,contact?(1-a/.48)**2:0);
   if(contact&&ground.kind==='stone'){const radius=.025+a*.4;obj.position.set(s.x,ground.y+.013,s.z);obj.rotation.set(-Math.PI/2,0,0);obj.scale.setScalar(radius);contacts++;}else obj.scale.setScalar(0);
   obj.updateMatrix();rings.setMatrixAt(i,obj.matrix);
   for(let j=0;j<3;j++){
    const index=i*3+j,p=contact?spraySample(ground.kind,a,i*17+j*137+cycle*4099):null;
    if(p?.alive){
     const x=s.x+p.x,y=ground.y+.002+p.y,z=s.z+p.z;
     obj.position.set(x,y,z);obj.quaternion.copy(camera.quaternion);
     const vx=p.vx*right.x+p.vy*right.y+p.vz*right.z,vy=p.vx*cameraUp.x+p.vy*cameraUp.y+p.vz*cameraUp.z;
     obj.rotateZ(Math.atan2(vy,vx)-Math.PI/2);
     const distance=obj.position.distanceTo(camera.position),pixel=2*Math.tan(camera.fov*Math.PI/360)*distance/viewportHeight;
     const width=Math.max(p.diameter,pixel*.7),length=Math.max(width,p.diameter+Math.hypot(vx,vy)/180);
     obj.scale.set(width,length,1);sprayAlpha.setX(index,p.alpha*Math.min(1,p.diameter/width));activeSpray++;
    }else{obj.scale.setScalar(0);sprayAlpha.setX(index,0);}
    obj.updateMatrix();spray.setMatrixAt(index,obj.matrix);
   }
   if(age>=fall&&cycle!==s.cycle){s.cycle=cycle;if(active&&dt>0){total++;if(wavesEnabled&&ground.kind==='water')for(const pool of pools){const u=.5+(s.x-pool.x)/(2*pool.rx),v=.5-(s.z-pool.z)/(2*pool.rz);pool.field.impulse(u,v,.0012+r*.001);}}}
  }
  impactAlpha.needsUpdate=true;streaks.instanceMatrix.needsUpdate=true;rings.instanceMatrix.needsUpdate=true;spray.instanceMatrix.needsUpdate=true;sprayAlpha.needsUpdate=true;
  if(wavesEnabled)for(const pool of pools)if(pool.field.advance(dt))upload(pool);
  if(time>=nextShoreStats){nextShoreStats=time+.25;for(const pool of pools){let covered=0;for(let i=0;i<pool.bed.length;i++){const x=2*(i%64)/63-1,z=2*Math.floor(i/64)/63-1;if(Math.hypot(x,z)<.98)covered+=shoreCoverage(level.value-pool.bed[i]);}pool.coverage=covered/pool.bed.length;}}
  return{meltwaterReceived:+meltwaterReceived.toFixed(5),meltInput:groundMemory.meltInput,meltOverflow:groundMemory.meltOverflow,wetReach:+wetReach.toFixed(4),waterLevel:+level.value.toFixed(4),waterCoverage:pools.map(p=>+p.coverage.toFixed(4)),wavesEnabled,waves:pools.map(p=>p.field.snapshot()),rain:+r.toFixed(3),falling,contacts,activeSpray,puddleFill:+wet.toFixed(3),soilMoisture:+groundMemory.moisture.toFixed(3),dryingRate:+groundMemory.drying.toFixed(3),impacts:total,region:'open courtyard plus east puddle at x 4.4, z 4'};
 }
 return{update,disturb,dispose(){scene.remove(group);const gs=new Set(),ms=new Set();group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}};
}
