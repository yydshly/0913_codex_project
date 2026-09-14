import * as THREE from './vendor/three.module.js';
import {waterImpactZ} from './scene-water-modes.mjs';
import {mat,mesh,random,smooth} from './scene-world.mjs';

// One layout drives the gaps in the water, exposed rock and splash origins.
export const cascadeChannels=[{center:-.79,width:.10},{center:-.43,width:.15},{center:.02,width:.20},{center:.46,width:.09},{center:.79,width:.12}];
export function channelStrength(world,x,z){
 const u=(x-world.riverX(z))/world.halfWidth(z);
 let strength=0;
 for(const c of cascadeChannels){const bend=.025*Math.sin(z*1.8+c.center*7);strength=Math.max(strength,1-smooth(c.width*.65,c.width,Math.abs(u-c.center-bend)));}
 return strength;
}
export function cascadeEmitters(world){return cascadeChannels.map(c=>{const z=-1.5+.22*Math.sin(c.center*8);return{x:world.riverX(z)+c.center*world.halfWidth(z),y:world.waterLevel(z)+.06,z,width:c.width*world.halfWidth(z)};});}

export function cascadeBedHeight(world,x,z){
 if(!world.waterStyle.split||z<world.waterStyle.start-1.15||z>world.waterStyle.end+1.15)return -Infinity;
 const ch=channelStrength(world,x,z),strata=Math.sin(z*7+x*.7)*.015+Math.sin(x*8+z*3)*.012;
 return world.waterSurface(x,z)-.18-ch*.06+strata;
}
export function createCascadeRock(group,world){
 const positions=[],colors=[],indices=[],rows=56,cols=96;
 const dry=new THREE.Color('#686454'),wet=new THREE.Color('#394b45');
 for(let i=0;i<=rows;i++){
  const z=world.waterStyle.start-1.15+i/rows*(world.waterStyle.end-world.waterStyle.start+2.3);
  for(let j=0;j<=cols;j++){
   const u=j/cols*2-1,x=world.riverX(z)+u*world.halfWidth(z)*1.04;
   const ch=channelStrength(world,x,z),strata=Math.sin(z*7+x*.7)*.028+Math.sin(x*8+z*3)*.025;
   // The supporting bed stays submerged; only solid outcrops split the water.
   const y=cascadeBedHeight(world,x,z);
   positions.push(x,y,z);
   const c=dry.clone().lerp(wet,.25+ch*.6).multiplyScalar(.86+.13*Math.sin(x*2.7+z*5));colors.push(c.r,c.g,c.b);
   if(i<rows&&j<cols){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=mat('#ffffff',.93);material.vertexColors=true;material.customProgramCacheKey=()=> 'cascade-rock-v6';
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vCliff;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCliff=position;');
  shader.fragmentShader='varying vec3 vCliff;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float layers=pow(.5+.5*sin(vCliff.y*20.+sin(vCliff.x*3.)*.8+sin(vCliff.x*7.+vCliff.z*4.)*.7),10.);
   float mottling=sin(vCliff.x*9.+vCliff.z*5.)*sin(vCliff.z*13.-vCliff.x*6.);
   diffuseColor.rgb*=.95-layers*.12+mottling*.07;
  `);
 };
 const rock=mesh(geometry,material,group);rock.name='连续承托岩壁';return rock;
}

export function splashPosition(emitter,seed,time,flow,drop,windX=0,windZ=0){
 const t=(seed+time*.83)%1,energy=Math.min(1.7,Math.sqrt(Math.max(0,flow)*drop/3.6));
 const a=seed*83.7,r=t*(.45+seed*.7)*energy;
 return [emitter.x+Math.cos(a)*r+windX*t*t*.13,emitter.y+4*t*(1-t)*(.18+seed*.52)*energy,emitter.z+Math.sin(a)*r*.6+t*.42+windZ*t*t*.13];
}
export function createCascadeSplash(group,world,shared,distributed=false){
 const emitters=distributed?Array.from({length:9},(_,i)=>{const cross=(i/8*1.7-.85)*world.halfWidth(world.waterStyle.end),z=waterImpactZ(world,cross),x=world.riverX(z)+cross;return{x,y:world.waterSurface(x,z)+.06,z,width:.5};}):cascadeEmitters(world),rng=random(916),seeds=[],positions=[],count=360;
 for(let i=0;i<count;i++){seeds.push(rng());positions.push(0,0,0);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uVisible:{value:1},uNight:shared.night},vertexShader:'attribute float aSeed;varying float vSeed;void main(){vSeed=aSeed;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp((1.4+aSeed*1.5)*40./max(1.,-mv.z),1.,5.);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform float uVisible,uNight;varying float vSeed;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(.68,.83,.81)*(1.-uNight*.55),(1.-smoothstep(.08,.5,d))*.55*uVisible);}'});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.name='水束落点飞沫';group.add(points);
 let lastTime=0,phase=0;
 return{emitters,points,update(time){
  phase+=Math.max(0,time-lastTime)*shared.flow.value;lastTime=time;
  points.visible=shared.flow.value>.001;material.uniforms.uVisible.value=Math.min(1,shared.flow.value);
  const p=geometry.attributes.position;
  for(let i=0;i<count;i++){const q=splashPosition(emitters[i%emitters.length],seeds[i],phase,shared.flow.value,world.config.fall,shared.windDir.value.x*shared.wind.value,shared.windDir.value.y*shared.wind.value);p.setXYZ(i,...q);}p.needsUpdate=true;
 }};
}
