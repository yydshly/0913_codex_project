import * as THREE from './vendor/three.module.js';
import {groundShader,groundLinear,groundTextureShader,groundTextureColour} from './scene-ground.mjs';

export const seasons={
 spring:{name:'春 · 花溪',note:'花树与嫩叶、湿润河岸、轻柔晨光',weights:[1,0,0,0],mode:'day',wet:.4,wind:.22,flow:1.25,sky:'#bbcdd0',sun:'#fff0d4',power:3.0,ambient:1.45,fog:.0030,sunPosition:[-38,49,35]},
 summer:{name:'夏 · 浓荫',note:'浓密绿叶、深色溪水、通透日影',weights:[0,1,0,0],mode:'day',wind:.3,flow:1.1,sky:'#a7c6d6',sun:'#fff3db',power:3.7,ambient:1.35,fog:.0015,sunPosition:[-30,78,25]},
 autumn:{name:'秋 · 金岸',note:'红黄绿错落、金色草岸、低角度暖光',weights:[0,0,1,0],mode:'evening',wind:.4,flow:.8,sky:'#bec8ca',sun:'#ffe1b2',power:2.8,ambient:1.32,fog:.0017,sunPosition:[-55,34,34]},
 winter:{name:'冬 · 初雪',note:'裸枝、覆雪河岸、岸边薄冰与缓落雪花',weights:[0,0,0,1],mode:'day',wind:.2,flow:.45,sky:'#bacbd8',sun:'#e5f0ff',power:2.25,ambient:1.35,fog:.0038,sunPosition:[-38,40,28]}
};
export function blendSeason(current,target,dt){const k=1-Math.exp(-Math.max(0,dt)*2);return current.map((v,i)=>v+(target[i]-v)*k)}

// Shared seasonal shading on ground, rock, buildings and the upward-facing surfaces.
export function bindSeasonSurface(material,shared){
 if(material.userData.seasonOwn)return;
 const original=material.onBeforeCompile,key=material.customProgramCacheKey(),terrain=material.userData.seasonKind==='terrain';
 material.customProgramCacheKey=()=>key+`-season-surface-v20-upland-${terrain}`;
 material.onBeforeCompile=function(shader,...args){
  original.call(this,shader,...args);shader.uniforms.uSeason=shared.season;if(terrain){shader.uniforms.uReflectPass=shared.reflectionPass;shader.uniforms.uGroundWet=shared.wet||{value:0};}
  shader.vertexShader=(terrain?'attribute float aBankWet,aRiverDepth,aGroundVariation,aSlopeRegion;attribute vec4 aGroundZones;varying vec4 vGroundZones;varying float vGroundVariation,vBankWet,vRiverDepth,vSlopeRegion;\n':'')+'varying vec3 vSeasonWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 seasonalPosition=vec4(transformed,1.);
   #ifdef USE_INSTANCING
   seasonalPosition=instanceMatrix*seasonalPosition;
   #endif
   vSeasonWorld=(modelMatrix*seasonalPosition).xyz;${terrain?'vBankWet=aBankWet;vRiverDepth=aRiverDepth;vGroundZones=aGroundZones;vGroundVariation=aGroundVariation;vSlopeRegion=aSlopeRegion;':''}
  `);
  shader.fragmentShader=(terrain?'uniform float uReflectPass,uGroundWet;varying vec4 vGroundZones;varying float vGroundVariation,vBankWet,vRiverDepth,vSlopeRegion;\n':'')+'uniform vec4 uSeason;varying vec3 vSeasonWorld;\n'+(terrain?groundTextureShader:'')+shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float grain=${terrain?'sin(vSeasonWorld.x*.65+vSeasonWorld.z*.47)*sin(vSeasonWorld.z*.51-vSeasonWorld.x*.34)':'sin(vSeasonWorld.x*12.3+vSeasonWorld.z*7.7)*sin(vSeasonWorld.z*13.1-vSeasonWorld.x*9.4)'};
   float upward=clamp(inverseTransformDirection(normal,viewMatrix).y,0.,1.);
   ${terrain?`if(uReflectPass>.5 && vRiverDepth>0.)discard;
   ${groundShader}
   ${groundTextureColour}
   diffuseColor.rgb*=1.-uGroundWet*.12;
   diffuseColor.rgb*=mix(vec3(1.),vec3(.80,.86,.83),vBankWet);
   roughnessFactor=mix(roughnessFactor,.46,vBankWet);`:''}
   float snowCover=smoothstep(.24,.72,upward+grain*.08)*uSeason.w;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.81,.87,.92)*(1.+grain*.025),snowCover*.98);
   roughnessFactor=mix(roughnessFactor,.94,snowCover);
  `);
 };
}

// The same leaf-removal rule is applied to the visible material and shadow material.
export function bindSeasonPlant(material,shared,kind,depth=false){
 const original=material.onBeforeCompile,key=material.customProgramCacheKey();material.userData.seasonOwn=true;
 material.customProgramCacheKey=()=>key+`-plant-season-v4-${kind}-${depth}`;
 material.onBeforeCompile=function(shader,...args){
  original.call(this,shader,...args);shader.uniforms.uSeason=shared.season;
  shader.vertexShader='attribute vec3 aPlantTone;varying vec3 vPlantTone;varying float vTreeSeed,vClusterSeed;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vPlantTone=aPlantTone;vTreeSeed=fract(sin(dot(aAnchor.xz,vec2(12.9898,78.233)))*43758.5453);
   vClusterSeed=fract(sin(dot(instanceMatrix[3].xyz,vec3(7.17,31.8,15.11)))*21831.31);
  `);
  shader.fragmentShader='uniform vec4 uSeason;varying vec3 vPlantTone;varying float vTreeSeed,vClusterSeed;\n'+shader.fragmentShader;
  if(kind==='leaf')shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
   float springLoss=mix(.24,.12,step(1.5,vPlantTone.x));
   float autumnLoss=mix(mix(.13,.06,1.-step(.5,vPlantTone.x)),.23,step(1.5,vPlantTone.x));
   float leafRetention=clamp(1.-uSeason.w-uSeason.z*autumnLoss-uSeason.x*springLoss,0.,1.);
   if(leafRetention<=0. || vClusterSeed>=leafRetention)discard;
   #include <alphatest_fragment>`);
  if(depth)return;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${kind==='leaf'?`
    float flowering=step(1.5,vPlantTone.x),willow=1.-step(.5,vPlantTone.x);
    vec3 spring=mix(vec3(.23,.40,.075),vec3(.64,.40,.43),flowering*smoothstep(.2,.7,vClusterSeed)*.82);
    vec3 summer=mix(vec3(.055,.19,.045),vec3(.16,.31,.07),vPlantTone.y);
    vec3 autumnGold=mix(vec3(.52,.15,.028),vec3(.67,.38,.065),flowering*.65+willow*.35);
    vec3 autumn=mix(vec3(.11,.25,.055),autumnGold,clamp(vPlantTone.y*.85+.30-willow*.24,0.,1.));
    vec3 winter=vec3(.31,.22,.12);
    diffuseColor.rgb=(spring*uSeason.x+summer*uSeason.y+autumn*uSeason.z+winter*uSeason.w)*(.70+vPlantTone.z*.30)*(.9+vClusterSeed*.16)*mix(vec3(.8),vec3(1.08),diffuseColor.rgb);
   `:kind==='wood'?`diffuseColor.rgb*=mix(vec3(.78,.74,.67),vec3(1.16,1.12,1.02),step(1.5,vPlantTone.x));`:kind==='grass'?`diffuseColor.rgb=(${groundLinear.map((row,i)=>'vec3('+row[0].map(v=>v.toFixed(6)).join(',')+')*uSeason['+i+']').join('+')})*(.80+vClusterSeed*.22);`:kind==='reed'?`diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.30,.10),uSeason.z*.8+uSeason.w);`:''}
  `);
 };
}
