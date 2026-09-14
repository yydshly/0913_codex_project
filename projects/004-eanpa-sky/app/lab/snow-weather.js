import {roofHeightAt,snowGroundAt} from './surface-state.js';
import {makeSnowSurfaceSampler} from './snow-sampling.js';
import {advanceSnowCover} from './snowmelt.js';
export {roofHeightAt,snowGroundAt} from './surface-state.js';
// Host extension: overcast sky from Eanpa, snowfall and snow cover owned here.
// No textures or additional shadow maps; accumulation uses accelerated visual time.
const clamp=v=>Math.max(0,Math.min(1,v));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const engineWeatherFor=weather=>['snow','hail'].includes(weather)?'overcast':weather;
export function advanceSnow(value,target,dt,seconds){return clamp(target+(value-target)*Math.exp(-Math.max(0,Math.min(.1,dt))/seconds));}
export function makeSnowWeather(T,scene,sharedCover){
 const group=new T.Group();group.name='host-snow-weather';scene.add(group);
 const N=1800,day=T.uniform(1),tea=T.uniform(0),path=T.uniform(0),rooms=T.uniform(0),cover=sharedCover??T.uniform(0);
 const range=(x,y,z,r)=>T.max(0,T.float(1).sub(T.distance(T.positionWorld,T.vec3(x,y,z)).div(r))).pow(2);
 const lamps=range(-4,3,-2,9).mul(tea).add(range(-1,1.1,5,6).add(range(3,1.1,10,6)).mul(path)).add(range(8,2,-9.5,8).mul(rooms));
 const flakeGeo=new T.PlaneGeometry(1,1),alpha=new T.InstancedBufferAttribute(new Float32Array(N),1);flakeGeo.setAttribute('snowAlpha',alpha);
 const flakeMat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});flakeMat.userData.noWet=true;
 const q=T.uv().sub(.5).mul(2),edge=T.float(1).sub(T.smoothstep(.2,1,T.length(q)));
 flakeMat.opacityNode=edge.mul(T.attribute('snowAlpha'));
 flakeMat.colorNode=T.color(0xdce8ee).mul(day.mul(.82).add(.016)).add(T.color(0xffdcad).mul(lamps.mul(.9)));
 const flakes=new T.InstancedMesh(flakeGeo,flakeMat,N);flakes.frustumCulled=false;group.add(flakes);
 const snowMat=new T.MeshStandardNodeMaterial({color:0xdce5e9,roughness:.95,transparent:true,alphaTest:.03});snowMat.userData.noWet=true;snowMat.userData.environmentOnly=true;
 const p=T.positionWorld,patch=T.mx_noise_float(p.mul(.62)).mul(.27).add(T.mx_noise_float(p.mul(3.1)).mul(.13)).add(.5);
 snowMat.opacityNode=T.smoothstep(patch.sub(.2),patch.add(.2),cover.mul(1.15)).mul(.8).add(cover.mul(.2));
 const surfaces=[];
 // Omit sheltered cells entirely, so snow cannot paint the pavilion's dry floor.
 function surface(cx,cz,w,d,height,excludeRoof=false){
  const nx=Math.ceil(w*4),nz=Math.ceil(d*4),positions=[],indices=[];
  for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){
   const x=cx-w/2+w*ix/nx,z=cz-d/2+d*iz/nz;
   positions.push(x,height===null?snowGroundAt(x,z)+.012:height,z);
  }
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
   const x=cx-w/2+w*(ix+.5)/nx,z=cz-d/2+d*(iz+.5)/nz;
   if(excludeRoof&&roofHeightAt(x,z)!==null)continue;
   const a=iz*(nx+1)+ix,b=a+1,c=a+nx+1,last=c+1;indices.push(a,c,b,b,c,last);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,snowMat);mesh.receiveShadow=true;group.add(mesh);surfaces.push(mesh);
 }
 surface(0,2,27,24,null,true);surface(-4,-4,10,9,5.15);surface(8,-13,12.8,7.5,3.87);
 group.traverse(o=>{o.userData.noRainOcclusion=true;});
 const seeds=Array.from({length:N},(_,i)=>({x:hash(i*7)*48-24,z:hash(i*7+1)*46-21,phase:hash(i*7+2)*20,speed:.5+hash(i*7+3)*.75,size:.023+hash(i*7+4)*.035,rank:hash(i*7+5),width:.65+hash(i),opacity:.45+hash(i+45)*.4}));
 const sampler=makeSnowSurfaceSampler(),obj=new T.Object3D();let intensity=0,accumulation=0,meltwaterTotal=0;
 function update({dt,time,enabled,rain=0,wind,hours,cloud=0,lights={},camera}){
  // Let outgoing rain subside before reaching full snow density.
  intensity=advanceSnow(intensity,enabled?1-clamp(rain):0,dt,enabled?3:2);
  const thaw=advanceSnowCover(accumulation,{dt,snowing:enabled,intensity,hours,cloud,rain});accumulation=thaw.cover;cover.value=accumulation;meltwaterTotal+=thaw.meltwaterDelta;
  const melt={meltwaterDelta:thaw.meltwaterDelta,meltwaterTotal:+meltwaterTotal.toFixed(5),meltSeconds:+thaw.meltSeconds.toFixed(1)};
  day.value=clamp(Math.sin((hours-6)/12*Math.PI)*1.8);tea.value=lights.tea??0;path.value=lights.path??0;rooms.value=lights.rooms??0;
  group.visible=intensity>.002||accumulation>.004;let visibleFlakes=0;
  if(!group.visible)return{...melt,engineWeather:enabled?'overcast':null,intensity:0,accumulation:0,visibleFlakes:0,capacity:N,shelteredFloorExcluded:true};
  flakes.visible=intensity>.002;
  if(flakes.visible){
  sampler.prepare(time,wind.length?.()??Math.hypot(wind.x,wind.z),accumulation);
  const driftX=Math.sin(time*.12)*Math.min(2,wind.x*.3),driftZ=Math.sin(time*.1)*Math.min(2,wind.z*.3);
  for(let i=0;i<N;i++){
   const s=seeds[i];if(s.rank>=intensity)continue;
   const y=20-((time*s.speed+s.phase)%20),x=s.x+Math.sin(time*.65+i)*.36+driftX,z=s.z+Math.cos(time*.47+i)*.28+driftZ;
   const hit=sampler.heightAt(x,z);
   if(y>hit){
    obj.position.set(x,y,z);obj.quaternion.copy(camera.quaternion);obj.rotateZ(time*.35+i);
    obj.scale.set(s.size*s.width,s.size,1);alpha.setX(visibleFlakes,Math.min(1,(y-hit)*4)*s.opacity);
    obj.updateMatrix();flakes.setMatrixAt(visibleFlakes++,obj.matrix);
   }
  }
  flakes.instanceMatrix.needsUpdate=true;alpha.needsUpdate=true;
  }
  flakes.count=visibleFlakes;
  surfaces.forEach(m=>{m.position.y=accumulation*.045;m.visible=accumulation>.004;});
  return{...melt,engineWeather:enabled?'overcast':null,intensity:+intensity.toFixed(3),accumulation:+accumulation.toFixed(3),visibleFlakes,capacity:N,coveredSurfaces:['pavilion roof','guestroom roof','exposed courtyard','tree and shrub upper faces','grass','distant terrain and forest upper faces'],shelteredFloorExcluded:true,model:'accelerated normalized snow reservoir; melt feeds host soil and pools; no temperature or physical runoff solver'};
 }
 return{update,dispose(){scene.remove(group);flakeGeo.dispose();flakeMat.dispose();snowMat.dispose();surfaces.forEach(m=>m.geometry.dispose());}};
}
