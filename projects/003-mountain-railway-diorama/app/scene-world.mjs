import * as THREE from './vendor/three.module.js';
import {getComposition,landformHeight} from './scene-composition.mjs';
import {groundZones} from './scene-ground.mjs';
import {getWaterMode,waterLaneShift,naturalFallZone} from './scene-water-modes.mjs';
export const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const clamp=THREE.MathUtils.clamp;
export const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
export function random(seed=31){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export const terrainPresets={wetland:{relief:.75,width:8,bend:5,fall:3.6,density:190},canyon:{relief:1.55,width:4,bend:2,fall:6,density:260},islands:{relief:.3,width:11,bend:7,fall:1.8,density:110}};
export function createSpatial(settings={}){
 const config={composition:'classic',waterMode:'continuous',...terrainPresets.wetland,...settings};
 const composition=getComposition(config.composition);
 const waterStyle=getWaterMode(config.waterMode),effectiveDrop=config.fall*waterStyle.dropScale;
 const curve=new THREE.CatmullRomCurve3([V(-30,4,17),V(-13,4.4,24),V(10,5.2,24),V(31,6,17),V(37,7,-2),V(27,8,-19),V(1,7,-25),V(-25,5.5,-18),V(-37,4.2,-1)],true,'catmullrom',.35);
 curve.arcLengthDivisions=1600;curve.updateArcLengths();const length=curve.getLength();
 const samples=Array.from({length:600},(_,i)=>({p:curve.getPointAt(i/600),u:i/600}));
 const closest=(x,z)=>{let best=samples[0],distance=Infinity;for(const item of samples){const d=(item.p.x-x)**2+(item.p.z-z)**2;if(d<distance){distance=d;best=item}}return{...best,distance:Math.sqrt(distance)}};
 const riverX=z=>9+config.bend*Math.sin(z*.075);
 const baseHalfWidth=z=>config.width*(.58+.5*smooth(-5,9,z))*(1+.08*Math.sin(z*.43)+.035*Math.sin(z*.91));
 const fallContext={config};
 const halfWidth=baseHalfWidth;
 const waterLevel=z=>1.05+effectiveDrop*(1-smooth(waterStyle.start,waterStyle.end,z))-.002*Math.max(0,z+2);
 // A staggered rock lip breaks the straight waterfall edge; both water and bed use it.
 const waterSurface=(x,z)=>{const lateral=x-riverX(z),shift=waterLaneShift(lateral,fallContext);return 1.05+effectiveDrop*(1-smooth(waterStyle.start,waterStyle.end,z+shift))-.002*Math.max(0,z+2);};
 const edge=a=>1+.033*Math.sin(3*a)+.018*Math.sin(7*a);
 const footprint=(x,z)=>Math.hypot(x/49,z/35)<edge(Math.atan2(z/35,x/49));
 const bridge=p=>p.x>7&&p.x<30&&p.z>14;
 // A rounded toe opens into a cut slope, then joins the original ridge.
 // Layout heights remain stable so existing tree positions do not reshuffle.
 function height(x,z,layout=false){
  const hills=landformHeight(composition,x,z);
  let h=1.7+config.relief*hills;
  h+=(Math.sin(x*.27+z*.18)*Math.cos(z*.24)+Math.sin(x*.85+z*.2)*.12)*.48*config.relief;
  const lateral=x-riverX(z),d=Math.abs(lateral),side=lateral<0?-1:1;
  const fallZone=layout?0:naturalFallZone(fallContext,z);
  // Opposite banks narrow at different places; leave the central channel open.
  const inlet=.12+.06*Math.sin(z*.65+side*1.7)+.018*Math.sin(z*1.4-side);
  const shore=halfWidth(z)*(1-inlet*fallZone);
  const surface=layout?1.05+effectiveDrop*(1-smooth(waterStyle.start,waterStyle.end,z+waterLaneShift(x-riverX(z))))-.002*Math.max(0,z+2):waterSurface(x,z);
  // The rendered water extends to nominal width + 1.2, even where the inlet
  // narrows. Keep that complete edge inside land before relaxing to low terrain.
  const bank=THREE.MathUtils.lerp(Math.max(h,surface+.38),h,smooth(halfWidth(z)+1.2,Math.max(halfWidth(z)+1.3,shore+5),d));
  h=layout?THREE.MathUtils.lerp(surface-1.15,h,smooth(shore*.88,shore+3.8,d)):THREE.MathUtils.lerp(surface-1.15,bank,smooth(shore*.82,shore+1.2,d));
  const near=closest(x,z);
  if(!layout){
   const bankDistance=d-shore,run=Math.max(0,bankDistance);
   const shoulder=1.05+effectiveDrop*(1-smooth(-10+side*1.3,-1+side*1.3,z));
   // Low, staggered shelves join the lip to the pool instead of a rounded wall.
   // These are continuous terrain heights, so water masks and roots follow them.
   const strata=run+.32*Math.sin(z*.8+side*2)+.16*Math.sin(z*1.6-side);
   const shelves=.32*smooth(.3,1.1,strata)+.48*smooth(2.0,2.9,strata)+.6*smooth(4.0,5.2,strata);
   const terrace=Math.max(surface+.12,THREE.MathUtils.lerp(surface,shoulder,smooth(0,5,run)))+.14+run*.08+shelves;
   const local=naturalFallZone(fallContext,z)*smooth(4.3,8,near.distance)*smooth(-.1,.7,bankDistance)*(1-smooth(3,9,bankDistance));
   h=THREE.MathUtils.lerp(h,Math.min(h,terrace),local);
   // Weather the bank itself, rather than covering a smooth wall with stones.
   // Fade out inside the wet channel, at the outer shoulder and near the rails.
   const weathering=fallZone*smooth(4.3,8,near.distance)*smooth(0,.9,bankDistance)*(1-smooth(3.5,7,bankDistance))*smooth(.16,.5,h-surface);
   const ledge=.24*Math.sin(h*5.5+z*.45+side)+.16*Math.sin(z*1.8+run*.7+side*2);
   h=THREE.MathUtils.lerp(h,Math.max(surface+.16,h+ledge),weathering);
  }
  if(!bridge(near.p)){
   const grade=near.p.y-.3,original=h;
   h=THREE.MathUtils.lerp(grade,h,smooth(1.8,4.3,near.distance));
   if(!layout&&original>grade){
    const run=Math.max(0,near.distance-1.8);
    const inclination=1.7+.18*Math.sin(x*.17+z*.11)+.12*Math.cos(z*.24);
    const cap=grade+inclination*run*run/(run+2.6);
    const join=Math.max(0,1-Math.abs(original-cap)/2.4);
    const graded=Math.max(grade,Math.min(original,cap)-.6*join*join);
    h=THREE.MathUtils.lerp(h,graded,smooth(shore+2,shore+5,d));
   }
  }
  const station=1-smooth(4.5,8,Math.hypot(x+27,z-25));
  return THREE.MathUtils.lerp(h,3.7,station);
 }
 // Keep the planting layout reproducible while refining the narrow water/land contact.
 const layoutHeight=(x,z)=>height(x,z,true);
 const stationU=closest(-29,19).u;
 return{composition,waterStyle,effectiveDrop,curve,length,samples,closest,riverX,halfWidth,waterLevel,waterSurface,edge,footprint,height,layoutHeight,bridge,stationU,config};
}
export function mat(color,roughness=.82,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
export function mesh(geo,material,parent,cast=true){const o=new THREE.Mesh(geo,material);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o}
export function box(parent,material,size,pos){const o=mesh(new THREE.BoxGeometry(...size),material,parent);o.position.set(...pos);return o}
export function beam(parent,material,a,b,width=.18,depth=width){const o=mesh(new THREE.BoxGeometry(width,a.distanceTo(b),depth),material,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o}
export function labelTexture(text,bg='#ede3bd',fg='#173c37'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,160);ctx.fillStyle=fg;ctx.textAlign='center';ctx.font='bold 75px serif';ctx.fillText(text,256,110);return new THREE.CanvasTexture(canvas)}
export function createFoundation(scene,world){
 const group=new THREE.Group();group.name='01 地形与轨道';scene.add(group);const R=120,A=300,positions=[],zones=[],variations=[],slopeRegions=[],fallBanks=[],wetness=[],riverDepth=[],indices=[];
 for(let r=0;r<=R;r++)for(let j=0;j<A;j++){const a=j/A*Math.PI*2,radius=r/R*world.edge(a),x=Math.cos(a)*49*radius,z=Math.sin(a)*35*radius,y=world.height(x,z);positions.push(x,y,z);const slope=Math.hypot(world.height(x+.3,z)-world.height(x-.3,z),world.height(x,z+.3)-world.height(x,z-.3)),shore=Math.abs(x-world.riverX(z))-world.halfWidth(z);const region=groundZones(world,x,z,slope,shore,y);zones.push(...region.weights);variations.push(region.variation);slopeRegions.push(region.slopeRegion);fallBanks.push(region.fallBank);const aboveWater=y-world.waterSurface(x,z),wet=(1-smooth(.02,.95,aboveWater))*(1-smooth(1.2,3,shore));wetness.push(wet);riverDepth.push(shore<1.2?-aboveWater:-1);if(r<R){const k=r*A+j,n=r*A+(j+1)%A;indices.push(k,n,k+A,n,n+A,k+A)}}
 const terrain=new THREE.BufferGeometry();terrain.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrain.setAttribute('aGroundZones',new THREE.Float32BufferAttribute(zones,4));terrain.setAttribute('aGroundVariation',new THREE.Float32BufferAttribute(variations,1));terrain.setAttribute('aSlopeRegion',new THREE.Float32BufferAttribute(slopeRegions,1));terrain.setAttribute('aFallBank',new THREE.Float32BufferAttribute(fallBanks,1));terrain.setAttribute('aBankWet',new THREE.Float32BufferAttribute(wetness,1));terrain.setAttribute('aRiverDepth',new THREE.Float32BufferAttribute(riverDepth,1));terrain.setIndex(indices);terrain.computeVertexNormals();const surface=mat('#ffffff');surface.userData.seasonKind='terrain';mesh(terrain,surface,group);
 const wallPos=[],wallIdx=[];for(let i=0;i<=A;i++){const a=i/A*Math.PI*2,r=world.edge(a),x=Math.cos(a)*49*r,z=Math.sin(a)*35*r;wallPos.push(x,world.height(x,z),z,x,-5.2,z);if(i<A){const k=i*2;wallIdx.push(k,k+2,k+1,k+1,k+2,k+3)}}const wall=new THREE.BufferGeometry();wall.setAttribute('position',new THREE.Float32BufferAttribute(wallPos,3));wall.setIndex(wallIdx);wall.computeVertexNormals();mesh(wall,mat('#4b574f'),group);const bottom=mesh(new THREE.CylinderGeometry(1,1,1,144),mat('#293d3a'),group);bottom.scale.set(49,.65,35);bottom.position.y=-5.5;
 const rail=mat('#b9bbb0',.26,.8),wood=mat('#544735'),ballast=mat('#81857e'),bridgeMat=mat('#b76034',.43,.55);const railCurves=[];
 for(const offset of[-.67,.67]){const pts=Array.from({length:501},(_,i)=>{const u=i/500,p=world.curve.getPointAt(u%1),t=world.curve.getTangentAt(u%1),n=V(t.z,0,-t.x).normalize();return p.addScaledVector(n,offset).add(V(0,.1,0))});railCurves.push(new THREE.CatmullRomCurve3(pts,false));mesh(new THREE.TubeGeometry(railCurves.at(-1),800,.075,5,false),rail,group);}
 const count=Math.floor(world.length/.75),sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(2.05,.16,.24),wood,count),dummy=new THREE.Object3D();for(let i=0;i<count;i++){const u=i/count,p=world.curve.getPointAt(u),t=world.curve.getTangentAt(u);dummy.position.copy(p);dummy.rotation.set(0,Math.atan2(t.x,t.z),0);dummy.updateMatrix();sleepers.setMatrixAt(i,dummy.matrix)}sleepers.castShadow=true;sleepers.receiveShadow=true;group.add(sleepers);
 const bp=[],bi=[];for(let i=0;i<=600;i++){const u=i/600,p=world.curve.getPointAt(u%1),t=world.curve.getTangentAt(u%1),n=V(t.z,0,-t.x).normalize();for(const side of[-1,1]){const q=p.clone().addScaledVector(n,side*1.45);bp.push(q.x,q.y-.18,q.z)}if(i<600&&!world.bridge(p)){const k=i*2;bi.push(k,k+2,k+1,k+1,k+2,k+3)}}const bed=new THREE.BufferGeometry();bed.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bed.setIndex(bi);bed.computeVertexNormals();mesh(bed,ballast,group);
 const bridgePoints=world.samples.filter(s=>world.bridge(s.p));const first=bridgePoints[0].u,last=bridgePoints.at(-1).u;
 const stone=mat('#d6cbb0',.82),archCount=5;
 for(let i=0;i<archCount;i++){
  const u=first+(last-first)*i/archCount,v=first+(last-first)*(i+1)/archCount,a=world.curve.getPointAt(u),b=world.curve.getPointAt(v);
  beam(group,stone,a.clone().add(V(0,-.42,0)),b.clone().add(V(0,-.42,0)),2.7,.4);
  for(const p of[a,b]){const floor=Math.min(world.height(p.x,p.z),world.waterLevel(p.z)-.1);box(group,stone,[.6,p.y-floor-.4,2.65],[p.x,(p.y+floor-.4)/2,p.z]);}
  const normal=V(b.z-a.z,0,a.x-b.x).normalize();
  for(const side of[-1,1])for(let j=0;j<18;j++){
   const f=j/18,g=(j+1)/18,p=a.clone().lerp(b,f),q=a.clone().lerp(b,g);
   p.y-=2.6-Math.sin(f*Math.PI)*2;q.y-=2.6-Math.sin(g*Math.PI)*2;
   p.addScaledVector(normal,side*1.15);q.addScaledVector(normal,side*1.15);beam(group,stone,p,q,.36,.42);
  }
 }
 return{group,bridgeU:(first+last)/2};
}
