import * as T from './vendor/three.module.js';
import {environments,random,scatterGroundCover} from './environment-core.mjs';

function plantGeometry(shrub=false){
 const rng=random(shrub?943:112),p=[],colors=[],c=new T.Color;
 const tri=(a,b,d,t)=>{p.push(...a,...b,...d);for(const y of [a[1],b[1],d[1]]){c.set(shrub?'#52623a':'#85845c');c.multiplyScalar(.72+Math.min(1,y/(shrub?.65:.45))*.28+t*.08);colors.push(c.r,c.g,c.b);}};
 if(!shrub){
  for(let i=0;i<9;i++){const angle=rng()*6.283,x=(rng()-.5)*.34,z=(rng()-.5)*.34,h=.15+rng()*.25,w=.009+rng()*.012,bend=.08+rng()*.15,dx=Math.cos(angle),dz=Math.sin(angle);
   const rows=[0,.38,.74,1].map(t=>{const width=w*(1-t),cx=x+dx*bend*t*t,cz=z+dz*bend*t*t;return [[cx-dz*width,h*t,cz+dx*width],[cx+dz*width,h*t,cz-dx*width]];});
   for(let j=0;j<3;j++){tri(rows[j][0],rows[j][1],rows[j+1][0],i/9);if(j<2)tri(rows[j][1],rows[j+1][1],rows[j+1][0],i/9);}
  }
 }else{
  // Leaves have a raised midrib and asymmetric canopy, not intersecting flat shrub cards.
  for(let i=0;i<74;i++){const angle=rng()*6.283,r=Math.sqrt(rng())*.55,x=Math.cos(angle)*r,z=Math.sin(angle)*r,y=.16+(1-r/.75)*(.2+rng()*.45),a=rng()*6.283,l=.09+rng()*.1,w=l*.43,dx=Math.cos(a),dz=Math.sin(a);
   const base=[x-dx*l,y-.025,z-dz*l],tip=[x+dx*l,y+.04,z+dz*l],left=[x-dz*w,y,z+dx*w],right=[x+dz*w,y,z-dx*w],mid=[x,y+.04,z];
   tri(base,left,mid,0);tri(left,tip,mid,.6);tri(tip,right,mid,.7);tri(right,base,mid,0);
  }
 }
 const g=new T.BufferGeometry;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function rockGeometry(){
 const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.12*Math.sin(x*7+z*5)+.07*Math.sin(y*11-x*4);p.setXYZ(i,x*r,Math.max(-.48,y*r*.63),z*r*.83);}
 g.computeVertexNormals();return g;
}
export function addEnvironmentCover(world,land,height,rockMaps){
 const places=scatterGroundCover(land,height),e=environments[places.environment],o=new T.Object3D;
 function instances(geometry,material,points,type){const m=new T.InstancedMesh(geometry,material,points.length);m.castShadow=type!=='grass';m.receiveShadow=true;
  points.forEach((p,i)=>{o.position.set(p.x,p.y-(type==='rock'?.08:.025),p.z);o.rotation.set(0,p.angle,0);const s=p.scale;o.scale.set(s,type==='grass'?s*e.grassHeight/.36:s,s);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.computeBoundingSphere();world.add(m);
 }
 instances(plantGeometry(),new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}),places.grass,'grass');
 instances(plantGeometry(true),new T.MeshStandardMaterial({vertexColors:true,roughness:.94,side:T.DoubleSide}),places.shrubs,'shrub');
 instances(rockGeometry(),new T.MeshStandardMaterial({map:rockMaps.diff,normalMap:rockMaps.nor_gl,roughnessMap:rockMaps.rough,normalScale:new T.Vector2(.65,.65),color:'#c3bcb0',roughness:1}),places.rocks,'rock');
 return {environment:places.environment,grassClumps:places.grass.length,shrubs:places.shrubs.length,rocks:places.rocks.length,extent:216};
}
