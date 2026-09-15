import {random} from './scene-world.mjs';

// Four deterministic clusters share an atlas; placement and tree identity stay unchanged.
export function foliagePattern(variant){
 const rng=random(106+variant*197),leaves=[],twigs=[];
 for(let b=0;b<12;b++){
  const a=b*2.39996+(rng()-.5)*.6,length=34+rng()*17,start={x:64+(rng()-.5)*15,y:64+(rng()-.5)*15};
  const end={x:start.x+Math.cos(a)*length,y:start.y+Math.sin(a)*length};twigs.push({start,end});
  for(let j=1;j<=6;j++)for(const side of [-1,1]){
   const t=(j-.25+rng()*.3)/6,cx=start.x+(end.x-start.x)*t,cy=start.y+(end.y-start.y)*t,angle=a+side*(.55+rng()*.35),reach=3+rng()*2;
   const rx=(variant===0?5.6:variant===2?4.1:4.8)*( .8+rng()*.35),ry=variant===0?1.55:variant===2?2.7:2.25;
   const margin=8+rx;leaves.push({x:Math.max(margin,Math.min(128-margin,cx+Math.cos(angle)*reach)),y:Math.max(margin,Math.min(128-margin,cy+Math.sin(angle)*reach)),angle,rx,ry,tone:.82+rng()*.18});
  }
 }
 return{leaves,twigs};
}
export function foliageTile(species,index){return species===0?0:species===2?2:1+(index%2)*2;}

export function bindFoliageAtlas(material){
 const original=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.customProgramCacheKey=()=>key+'-foliage-atlas-v37';
 material.onBeforeCompile=function(shader,...args){
  original.call(this,shader,...args);
  shader.vertexShader='attribute float aFoliageTile;\n'+shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   #ifdef USE_MAP
    vMapUv=(vMapUv+vec2(mod(aFoliageTile,2.),floor(aFoliageTile/2.)))*.5;
   #endif
  `);
 };
}
