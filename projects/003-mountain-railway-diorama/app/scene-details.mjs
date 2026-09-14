import * as THREE from './vendor/three.module.js';
import {random} from './scene-world.mjs';

export function detailVisibility(weights,night){return{petals:weights[0],leaves:weights[2],fireflies:weights[1]*Math.max(0,Math.min(1,(night-.1)/.7)),snow:weights[3]}}

export function createSeasonDetails(scene,shared,world,anchors){
 const group=new THREE.Group();group.name='四季动态细节';scene.add(group);
 let points,litter,stats={};
 const uniforms={uTime:shared.time,uWind:shared.wind,uDirection:shared.windDir,uSeason:shared.season,uNight:shared.night,uAmount:shared.detailAmount,uLitter:shared.litter};
 const pointMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`
  uniform float uTime,uWind,uNight,uAmount;uniform vec2 uDirection;uniform vec4 uSeason;
  attribute float aSeed,aKind,aHeight;varying float vAlpha,vKind,vSeed;
  void main(){
   vec3 p=position;float t=uTime;vKind=aKind;vSeed=aSeed;
   float cycle=fract(aSeed+t*(aKind<.5?.035:.105));
   if(aKind<2.5){p.y+=(1.-cycle)*aHeight;p.xz+=uDirection*uWind*cycle*2.1+vec2(sin(t*1.3+aSeed*41.),cos(t*.8+aSeed*19.))*(aKind<.5?.55:.32);}
   else{p.y+=.6+sin(t*1.2+aSeed*31.)*.45;p.xz+=vec2(sin(t*.6+aSeed*71.),cos(t*.48+aSeed*61.))*.7;}
   float seasonalVisibility=aKind<.5?uSeason.w:aKind<1.5?uSeason.x:aKind<2.5?uSeason.z:uSeason.y*smoothstep(.1,.8,uNight);
   vAlpha=seasonalVisibility*(1.-smoothstep(uAmount-.05,uAmount,aSeed))*(aKind>2.5?.3+.7*pow(.5+.5*sin(t*2.+aSeed*80.),2.):.85);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp((aKind>2.5?140.:aKind<.5?90.:160.)/-mv.z,1.5,aKind>2.5?7.:9.);
  }
 `,fragmentShader:`
  varying float vAlpha,vKind,vSeed;
  void main(){
   vec2 p=gl_PointCoord-.5;float alpha;vec3 c;
   if(vKind>2.5){float r=length(p);alpha=exp(-r*r*18.)*(1.-smoothstep(.35,.5,r));c=vec3(2.5,2.8,.8);}
   else if(vKind<.5){float r=length(p);alpha=1.-smoothstep(.25,.5,r);c=vec3(.91,.96,1.);}
   else{float a=vSeed*6.283;vec2 q=mat2(cos(a),-sin(a),sin(a),cos(a))*p;float r=length(q*vec2(1.25,2.));alpha=1.-smoothstep(.36,.5,r);c=vKind<1.5?mix(vec3(1.,.61,.72),vec3(1.,.9,.91),vSeed):mix(vec3(.62,.19,.025),vec3(.95,.61,.09),vSeed);}
   if(alpha*vAlpha<.015)discard;gl_FragColor=vec4(c,alpha*vAlpha);
  }
 `});
 const litterMaterial=new THREE.MeshStandardMaterial({roughness:.96,side:THREE.DoubleSide});
 litterMaterial.userData.seasonOwn=true;
 litterMaterial.onBeforeCompile=shader=>{
  shader.uniforms.uSeason=shared.season;shader.uniforms.uLitter=shared.litter;
  shader.vertexShader='attribute float aSeed;varying float vSeed;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSeed=aSeed;');
  shader.fragmentShader='uniform vec4 uSeason;uniform float uLitter;varying float vSeed;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float amount=uLitter*(uSeason.x*.35+uSeason.z);if(vSeed>amount)discard;
   vec3 autumn=mix(vec3(.12,.065,.026),vec3(.34,.20,.07),vSeed);vec3 spring=vec3(.72,.36,.43);
   diffuseColor.rgb=mix(autumn,spring,uSeason.x);
  `);
 };
 function setWorld(w,roots){
  if(points){points.geometry.dispose();points.removeFromParent()}if(litter){litter.geometry.dispose();litter.removeFromParent()}
  const rng=random(612),p=[],seed=[],kind=[],height=[];
  const push=(x,y,z,k,h)=>{p.push(x,y,z);seed.push(rng());kind.push(k);height.push(h)};
  for(let i=0;i<1400;i++){const x=(rng()-.5)*96,z=(rng()-.5)*66;push(x,w.height(x,z),z,0,25)}
  for(const k of[1,2])for(let i=0;i<420&&roots.length;i++){const root=roots[Math.floor(rng()*roots.length)],a=rng()*6.28,r=rng()*1.7,x=root.x+Math.cos(a)*r,z=root.z+Math.sin(a)*r;push(x,w.height(x,z)+.08,z,k,root.height)}
  for(let i=0;i<180;i++){const z=-24+rng()*50,x=w.riverX(z)+(rng()>.5?1:-1)*(w.halfWidth(z)+1+rng()*2);if(w.footprint(x,z))push(x,w.height(x,z)+.4,z,3,1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('aSeed',new THREE.Float32BufferAttribute(seed,1));geo.setAttribute('aKind',new THREE.Float32BufferAttribute(kind,1));geo.setAttribute('aHeight',new THREE.Float32BufferAttribute(height,1));points=new THREE.Points(geo,pointMaterial);points.frustumCulled=false;group.add(points);
  const lp=[],ls=[];let leaves=0;
  for(const root of roots)for(let i=0;i<70;i++){
   const a=rng()*6.28,r=Math.sqrt(rng())*(1.5+root.height*.25),x=root.x+Math.cos(a)*r,z=root.z+Math.sin(a)*r,y=w.height(x,z)+.035;
   if(!w.footprint(x,z)||y<w.waterLevel(z)+.08||w.closest(x,z).distance<1.35)continue;
   const size=.055+rng()*.10,angle=rng()*6.28,id=rng(),verts=[[-1,0],[0,.45],[1,0],[-1,0],[1,0],[0,-.45]];
   for(const[u,v]of verts){const vx=x+(u*Math.cos(angle)-v*Math.sin(angle))*size,vz=z+(u*Math.sin(angle)+v*Math.cos(angle))*size;lp.push(vx,w.height(vx,vz)+.018,vz);ls.push(id)}leaves++;
  }
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));lg.setAttribute('aSeed',new THREE.Float32BufferAttribute(ls,1));lg.computeVertexNormals();litter=new THREE.Mesh(lg,litterMaterial);litter.receiveShadow=true;group.add(litter);stats={particles:seed.length,groundLeaves:leaves};
 }
 setWorld(world,anchors);
 return{group,setWorld,get stats(){return stats},update(){const v=detailVisibility(shared.season.value.toArray(),shared.night.value);points.visible=shared.detailAmount.value>0&&Object.values(v).some(x=>x>.01);litter.visible=shared.litter.value>0&&(shared.season.value.x+shared.season.value.z)>.01;}};
}
