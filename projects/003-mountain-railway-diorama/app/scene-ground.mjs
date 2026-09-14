import * as THREE from './vendor/three.module.js';
import {forestWeight} from './scene-composition.mjs';

// Meadow, woodland floor, exposed soil, rock. Hex colours are converted to
// linear working space once; seasons blend albedo rather than tinting green.
export const groundPalette={
 spring:['#819d60','#677651','#a39578','#91968c'],
 summer:['#608451','#52664c','#a29379','#8b938b'],
 autumn:['#92956c','#695f4e','#aa9479','#92938a'],
 winter:['#8e856f','#776f5f','#978c7b','#92958f']
};
export const groundLinear=Object.values(groundPalette).map(row=>row.map(hex=>new THREE.Color(hex).toArray()));
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function treeCoverAt(trees,x,z){
 let cover=0;
 for(const tree of trees){const radius=1.5+tree.height*.25,d2=(x-tree.x)**2+(z-tree.z)**2;if(d2<radius*radius)cover=Math.max(cover,1-smooth(.05,1,d2/(radius*radius)));}
 return cover;
}
export const groundTextureShader=`
 float floorHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float floorNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(floorHash(i),floorHash(i+vec2(1,0)),f.x),mix(floorHash(i+vec2(0,1)),floorHash(i+vec2(1,1)),f.x),f.y);}
`;
export function groundZones(world,x,z,slope,shore){
 const broad=.5+.25*Math.sin(x*.14+Math.sin(z*.11)*1.5)+.25*Math.cos(z*.17-x*.06);
 const rock=smooth(.4,1.55,slope)*.78*(.82+.18*broad);
 const bank=1-smooth(.2,world.composition.bankWidth+1.5,shore);
 const soil=clamp(bank*.85+smooth(.63,.9,broad)*.16)*(1-rock);
 // Actual tree roots drive the forest floor when the scene supplies them.
 const clearing=1-.75*smooth(4,9,z)*(1-smooth(-12,-6,x));
 const forest=world.groundTrees?treeCoverAt(world.groundTrees,x,z):forestWeight(world.config.composition,x,z)*clamp(world.config.density/190)*clearing;
 const floorCover=forest*smooth(.3,2,shore);
 const wood=floorCover*.9*(1-rock);
 const soilAvailable=Math.min(soil*(1-floorCover*.85),Math.max(0,1-rock-wood));
 const meadow=Math.max(0,1-rock-soilAvailable-wood);
 return {weights:[meadow,wood,soilAvailable,rock],variation:.96+broad*.08};
}
export function groundColour(seasonWeights,zones,variation=1){
 const residual=smooth(.972,1.028,variation)*.42;
 return [0,1,2].map(channel=>{const base=groundLinear.reduce((sum,row,s)=>sum+seasonWeights[s]*row.reduce((v,c,i)=>v+c[channel]*zones[i],0),0);return (base+seasonWeights[2]*zones[0]*residual*(groundLinear[1][0][channel]-groundLinear[2][0][channel]))*variation;});
}
// Constants generated from the same palette used by CPU validation.
export const groundShader=groundLinear.map((row,s)=>`vec3 ground${s}=`+row.map((c,i)=>`vec3(${c.map(v=>v.toFixed(6)).join(',')})*vGroundZones[${i}]`).join('+')+';').join('\n')+
 `\nground2+=(vec3(${groundLinear[1][0].map(v=>v.toFixed(6)).join(',')})-vec3(${groundLinear[2][0].map(v=>v.toFixed(6)).join(',')}))*vGroundZones.x*smoothstep(.972,1.028,vGroundVariation)*.42;`+
 '\ndiffuseColor.rgb=(ground0*uSeason.x+ground1*uSeason.y+ground2*uSeason.z+ground3*uSeason.w)*vGroundVariation;';

export const groundTextureColour=`
 float floorFine=floorNoise(vSeasonWorld.xz*7.);
 float floorPatch=floorNoise(vSeasonWorld.xz*.72);
 float rockBand=floorNoise(vSeasonWorld.xz*.65+vec2(vSeasonWorld.y*.13,-vSeasonWorld.y*.21));
 float rockCracks=smoothstep(.63,.82,floorNoise(vSeasonWorld.xz*1.3+vSeasonWorld.y*.45));
 diffuseColor.rgb*=mix(1.,.78+rockBand*.28-rockCracks*.14,vGroundZones.w);
 float floorAmount=vGroundZones.x*.5+vGroundZones.y*.9+vGroundZones.z*.55;
 diffuseColor.rgb*=mix(1.,.79+floorFine*.23+floorPatch*.13,floorAmount);
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.70,.65),smoothstep(.54,.76,floorPatch)*vGroundZones.y*.35);
`;
