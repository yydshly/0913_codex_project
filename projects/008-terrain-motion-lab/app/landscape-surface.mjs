import * as T from './vendor/three.module.js';
import {environments} from './environment-core.mjs';

// Low frequency variation survives at valley scale; the original metre-scale maps supply detail.
// Tree shade is approximate canopy occlusion, not a replacement for directional shadows.
export function makeCanopySampler(trees){
 const cells=new Map,size=8;
 for(const p of trees){const key=`${Math.floor(p.x/size)},${Math.floor(p.z/size)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(p);}
 return(x,z)=>{let shade=0;const ix=Math.floor(x/size),iz=Math.floor(z/size);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const p of cells.get(`${ix+dx},${iz+dz}`)||[]){const radius=2.7*p.scale*(p.width??1),d=Math.hypot(x-p.x,z-p.z)/radius;if(d<1)shade=Math.max(shade,(1-d*d)**2);}
  return shade;
 };
}
export function enrichGroundGeometry(geometry,shade){const p=geometry.attributes.position,values=[];for(let i=0;i<p.count;i++)values.push(shade(p.getX(i),p.getZ(i)));geometry.setAttribute('canopyShade',new T.Float32BufferAttribute(values,1));}
export function enrichGroundMaterial(material,rockMaps,environment='forest',hasRoad=false){const previous=material.onBeforeCompile;
 material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps);previous.call(material,s);
  if(rockMaps){s.uniforms.rockMap={value:rockMaps.diff};s.uniforms.rockNormal={value:rockMaps.nor_gl};s.uniforms.rockRough={value:rockMaps.rough};s.uniforms.rockAmount={value:environments[environment].rock};s.uniforms.rockSlope={value:new T.Vector3(environments[environment].slopeStart,environments[environment].slopeGain,environments[environment].patchGain)};}
  s.vertexShader='attribute float canopyShade; varying float vCanopyShade; varying vec3 vLandPoint; varying float vLandSlope;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLandPoint=position;vLandSlope=1.0-abs(normal.y);vCanopyShade=canopyShade;');
  s.fragmentShader='varying float vCanopyShade; varying vec3 vLandPoint; varying float vLandSlope;\n'+s.fragmentShader;
  if(rockMaps){
   s.fragmentShader='uniform sampler2D rockMap;uniform sampler2D rockNormal;uniform sampler2D rockRough;uniform float rockAmount;uniform vec3 rockSlope;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`
    float habitatPatch=.5+.26*sin(vLandPoint.x*.19+sin(vLandPoint.z*.14)*1.6)+.24*cos(vLandPoint.z*.23-vLandPoint.x*.08);
    float grade=sqrt(max(0.0,1.0-pow(1.0-vLandSlope,2.0)))/max(.1,1.0-vLandSlope);
    float rockMix=clamp(rockAmount+max(0.0,grade-rockSlope.x)*rockSlope.y+(habitatPatch-.5)*rockSlope.z,0.0,1.0)${hasRoad?'*(1.0-roadBlend)':''};
    vec2 rockUv=vLandPoint.xz/1.5;
    diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(rockMap,rockUv).rgb,rockMix);
    #include <color_fragment>`);
   s.fragmentShader=s.fragmentShader.replace('mapN.xy *= normalScale;', 'mapN=mix(mapN,texture2D(rockNormal,rockUv).xyz*2.0-1.0,rockMix);\nmapN.xy *= normalScale;');
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,texture2D(rockRough,rockUv).g,rockMix);');
  }
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float broad=sin(vLandPoint.x*.083+sin(vLandPoint.z*.11)*1.8)*sin(vLandPoint.z*.065-vLandPoint.x*.034);
   float detailNoise=sin(vLandPoint.x*.37+sin(vLandPoint.z*.24))*sin(vLandPoint.z*.29);
   vec3 meadow=mix(vec3(.73,.83,.62),vec3(1.02,.98,.83),smoothstep(-.6,.7,broad+detailNoise*.24));
   float rocky=smoothstep(.16,.43,vLandSlope);
   vec3 groundTone=mix(meadow,vec3(.86,.83,.76),rocky);
   diffuseColor.rgb*=groundTone*(1.0-vCanopyShade*.16);
  `);
 };
 material.customProgramCacheKey=()=> 'outdoor-ground-habitat-v3-'+environment+'-'+hasRoad;
}
