// Habitat recipes are independent of route layout. Dimensions are in scene metres.
export const environments=Object.freeze({
 forest:{name:'林间公路',summary:'连续松林 · 林下草丛与灌木 · 土路保持通畅',rock:.06,slopeStart:.65,slopeGain:.38,patchGain:.12,grass:.62,shrub:.052,stone:.026,grassHeight:.34},
 meadow:{name:'草甸营地',summary:'开阔草甸 · 林带退到外围 · 营位与通道留空',rock:.015,slopeStart:.85,slopeGain:.3,patchGain:.1,grass:.92,shrub:.022,stone:.014,grassHeight:.48},
 alpine:{name:'岩石山脊',summary:'坡面露岩 · 碎石成簇 · 山腰疏林与低草',rock:.58,slopeStart:.24,slopeGain:.7,patchGain:.4,grass:.32,shrub:.012,stone:.12,grassHeight:.21}
});
export const random=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const clamp=v=>Math.max(0,Math.min(1,v));
export function habitatAt(kind,x,z,slope=0){
 const e=environments[kind]??environments.forest;
 const patch=.5+.26*Math.sin(x*.19+Math.sin(z*.14)*1.6)+.24*Math.cos(z*.23-x*.08);
 return {patch,rock:clamp(e.rock+Math.max(0,slope-e.slopeStart)*e.slopeGain+(patch-.5)*e.patchGain)};
}
export function keepHabitatTree(land,p){
 const kind=land.recipe.environment??'forest';if(kind==='forest')return true;
 const n=Math.abs(Math.sin(p.x*39.47+p.z*17.19)*13758.54)%1;
 const nearCamp=Math.hypot(p.x-land.camp.x,p.z-land.camp.z)<31;
 return n<(kind==='meadow'?(nearCamp?.12:.53):(p.y>land.camp.y+4?.16:.54));
}
export function groundClearance(land,x,z,radius){
 return land.drive.nearest(x,z).distance>1.8+radius && land.trail.nearest(x,z).distance>.7+radius
  && land.arrival.nearest(x,z).distance>.6+radius && land.departure.nearest(x,z).distance>.6+radius
  && Math.hypot(x-land.camp.x,z-land.camp.z)>5.2+radius
  && Math.hypot(x-land.summit.x,z-land.summit.z)>3.8+radius;
}
export function scatterGroundCover(land,height){
 const kind=land.recipe.environment??'forest',e=environments[kind],rng=random(20519),grass=[],shrubs=[],rocks=[];
 // Fine plants around the journey; sparse clumps continue into the wider landscape.
 for(let i=0;i<24000;i++){
  const inner=i<19500,range=inner?64:216,x=(rng()-.5)*range,z=(rng()-.5)*range;
  if(!inner&&Math.max(Math.abs(x),Math.abs(z))<32)continue;
  const roll=rng(),scale=.65+rng()*.65,angle=rng()*Math.PI*2;
  if(!groundClearance(land,x,z,.3))continue;
  const y=height(x,z),slope=Math.hypot(height(x+.3,z)-height(x-.3,z),height(x,z+.3)-height(x,z-.3))/.6;
  const h=habitatAt(kind,x,z,slope),p={x,y,z,scale,angle};
  if(roll<e.stone*(.3+h.patch*1.4)&&groundClearance(land,x,z,.9)){const size=.08+Math.pow(rng(),kind==='alpine'?3:2)*(kind==='alpine'?1.08:.42);if(groundClearance(land,x,z,size*1.2))rocks.push({...p,scale:size});}
  else if(roll<e.stone+e.shrub&&slope<.8&&groundClearance(land,x,z,.8))shrubs.push(p);
  else if(roll<e.stone+e.shrub+e.grass*(.4+h.patch*.7)*(1-h.rock*.85)&&slope<1.05)grass.push(p);
 }
 return {grass,shrubs,rocks,environment:kind};
}
