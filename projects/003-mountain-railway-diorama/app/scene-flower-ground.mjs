import * as THREE from './vendor/three.module.js';
import {mat,random,mesh} from './scene-world.mjs';
import {stationLayout,stationOccupies} from './scene-station-layout.mjs';

export function flowerGroundPoints(world,sites,anchors=[],seed=3521){
 const rng=random(seed+6901),layout=stationLayout(world),grass=[],soil=[];
 for(const site of sites)for(let i=0;i<260;i++){
  const angle=rng()*Math.PI*2,r=Math.sqrt(rng())*5.1,x=site.x+Math.cos(angle)*r,z=site.z+Math.sin(angle)*r*.82;
  const falloff=Math.max(0,1-r/5.1),patch=.58+.26*Math.sin(x*2.1+Math.cos(z*1.3));
  if(rng()>falloff*patch+.07)continue;
  if(!world.footprint(x,z)||stationOccupies(layout,x,z,1)||world.closest(x,z).distance<3.6||Math.abs(x-world.riverX(z))<world.halfWidth(z)+1.2)continue;
  if(anchors.some(a=>Math.hypot(a.x-x,a.z-z)<.65)||(world.animalObstacles||[]).some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+.5))continue;
  const y=world.height(x,z);if(Math.abs(world.height(x+.3,z)-y)+Math.abs(world.height(x,z+.3)-y)>.42)continue;
  grass.push({x,y,z,height:.11+rng()*.21,angle:rng()*Math.PI*2,tone:.85+rng()*.3});
  if(r<2.8&&rng()<.13)soil.push({x,y,z,radius:.17+rng()*.25,angle:rng()*Math.PI*2});
 }
 return{grass,soil};
}
export function createFlowerGround(parent,world,shared,anchors){
 const group=new THREE.Group();group.name='花丛疏草与细碎土色过渡';parent.add(group);
 const green=mat('#788553',.96);green.side=THREE.DoubleSide;green.userData.seasonOwn=true;
 green.onBeforeCompile=shader=>{shader.uniforms.uFlowerTime=shared.time;shader.uniforms.uFlowerWind=shared.wind;shader.uniforms.uFlowerDirection=shared.windDir||{value:new THREE.Vector2(1,0)};
  shader.vertexShader='uniform float uFlowerTime;uniform float uFlowerWind;uniform vec2 uFlowerDirection;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float sway=sin(uFlowerTime*1.7+instanceMatrix[3].x*.6+instanceMatrix[3].z*.4)*uFlowerWind*position.y*position.y*.16;
   vec3 direction=vec3(dot(instanceMatrix[0].xyz,vec3(uFlowerDirection.x,0.,uFlowerDirection.y)),0.,dot(instanceMatrix[2].xyz,vec3(uFlowerDirection.x,0.,uFlowerDirection.y)));
   transformed+=direction*sway;
  `);};green.customProgramCacheKey=()=> 'flower-ground-wind-v36';
 const vertices=[];
 for(let i=0;i<5;i++){const a=i*2.4,c=Math.cos(a),s=Math.sin(a),height=.65+(i%3)*.15;vertices.push(-.07*c,0,-.07*s,.07*c,0,.07*s,.26*c,height,.26*s);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
 const tufts=new THREE.InstancedMesh(geometry,green,1300);tufts.frustumCulled=false;tufts.receiveShadow=true;group.add(tufts);
 const earth=mat('#82735a',1);earth.transparent=true;earth.opacity=.19;earth.depthWrite=false;earth.userData.seasonOwn=true;
 earth.onBeforeCompile=shader=>{shader.vertexShader='attribute float aFade;varying float vFade;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFade=aFade;');shader.fragmentShader='varying float vFade;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFade;');};earth.customProgramCacheKey=()=> 'flower-soil-feather-v36';
 const soilMesh=mesh(new THREE.BufferGeometry(),earth,group);soilMesh.receiveShadow=true;const dummy=new THREE.Object3D();let points={grass:[],soil:[]};
 function reset(sites,seed){
  points=flowerGroundPoints(world,sites,anchors,seed);tufts.count=points.grass.length;
  points.grass.forEach((p,i)=>{dummy.position.set(p.x,p.y-.015,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(.55,p.height,.55);dummy.updateMatrix();tufts.setMatrixAt(i,dummy.matrix);tufts.setColorAt(i,new THREE.Color().setScalar(p.tone));});tufts.instanceMatrix.needsUpdate=true;if(tufts.instanceColor)tufts.instanceColor.needsUpdate=true;
  const pos=[],fade=[];for(const p of points.soil)for(let i=0;i<10;i++){for(const k of[-1,i+1,i]){const a=k/10*Math.PI*2+p.angle,r=k<0?0:p.radius*(.82+.18*Math.sin(k*4.3));const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r*.62;pos.push(x,world.height(x,z)+.018,z);fade.push(k<0?1:0);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aFade',new THREE.Float32BufferAttribute(fade,1));g.computeVertexNormals();soilMesh.geometry.dispose();soilMesh.geometry=g;
 }
 const colors=['#809462','#738551','#99906b','#b3afa0'].map(c=>new THREE.Color(c));
 function update(){const w=shared.season.value.toArray();green.color.setRGB(...['r','g','b'].map(k=>colors.reduce((sum,c,i)=>sum+c[k]*w[i],0)));earth.opacity=.19*(1-w[3]);soilMesh.visible=w[3]<.97;tufts.visible=w[3]<.97;}
 return{reset,update,group,get points(){return points}};
}
