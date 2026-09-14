const clamp=v=>Math.max(0,Math.min(1,v));
const approach=(a,b,dt,tau)=>dt<=0?a:b+(a-b)*Math.exp(-Math.min(.1,dt)/tau);
export const atmosphereProfiles={clear:{fog:.0009,cloud:.02},none:{fog:.0013,cloud:.2},fair:{fog:.0015,cloud:.3},sunshower:{fog:.002,cloud:.35},overcast:{fog:.0032,cloud:.8},rain:{fog:.0055,cloud:.9},storm:{fog:.008,cloud:1},darkstorm:{fog:.011,cloud:1},snow:{fog:.0048,cloud:.8},hail:{fog:.006,cloud:.9}};
export function advanceAtmosphere(current,weather,dt){const goal=atmosphereProfiles[weather]??atmosphereProfiles.none;return{fog:approach(current.fog,goal.fog,dt,4),cloud:approach(current.cloud,goal.cloud,dt,4)};}
export function advanceGround(current,rain,dt,{hours=15.5,wind=0,cloud=0,meltwater=0}={}){
 const r=clamp(rain),sun=Math.max(0,Math.sin((hours-6)*Math.PI/12))*(1-clamp(cloud));
 const drying=.45+sun*.9+Math.min(12,Math.max(0,wind))*.04;
 const puddle=approach(current.puddle,r,dt,r>current.puddle?18:85/drying);
 // Water in porous earth outlasts the visible surface pool; no reset on weather changes.
 const moisture=approach(current.moisture,Math.max(r,puddle*.8),dt,r>current.moisture?6:190/drying);
 // This frame's snow loss is an amount, not a rain rate. Consume it once.
 // Soil receives 65%; excess and the remaining 35% reach the pool. Overflow
 // is accounted for, rather than manufacturing water beyond the reservoirs.
 const meltInput=dt>0?clamp(meltwater):0,soilInput=Math.min(1-moisture,meltInput*.65),poolInput=Math.min(1-puddle,meltInput-soilInput);
 return{puddle:clamp(puddle+poolInput),moisture:clamp(moisture+soilInput),drying,meltInput,meltSoil:soilInput,meltPool:poolInput,meltOverflow:Math.max(0,meltInput-soilInput-poolInput)};
}
export function rainSequencePhase(elapsed){return elapsed<40?'rain':elapsed<110?'drying':'complete';}
export function sequenceStatus(elapsed){
 const t=Math.max(0,Math.min(110,elapsed));
 return{stage:t<12?'gathering':t<40?'raining':t<52?'clearing':t<110?'drying':'complete',remaining:Math.ceil(110-t),stageRemaining:Math.ceil((t<12?12:t<40?40:t<52?52:110)-t),progress:t/110};
}
export function makeAtmosphereTransition(initial={fog:.0013,cloud:.2}){
 let current={...initial},from={...initial},selected='none',elapsed=12,engine=false,previousProgress=1;
 return(weather,dt,transition)=>{
  const target=atmosphereProfiles[weather]??atmosphereProfiles.none,engineName=['snow','hail'].includes(weather)?'overcast':weather;
  if(weather!==selected||(engine&&transition?.active&&transition.target===engineName&&transition.easedProgress<previousProgress-1e-6)){selected=weather;from={fog:current.fog,cloud:current.cloud};elapsed=0;engine=transition?.active&&transition.target===engineName&&(transition.rawProgress??1)<.1;}
  if(!engine&&elapsed<.2&&transition?.active&&transition.target===engineName&&(transition.rawProgress??1)<.1){from={fog:current.fog,cloud:current.cloud};elapsed=0;engine=true;}
  elapsed+=Math.max(0,Math.min(.1,dt));
  const raw=Math.min(1,elapsed/12),progress=engine?(transition?.target===engineName?(transition.active?clamp(transition.easedProgress):1):raw):raw*raw*(3-2*raw);
  current={fog:from.fog+(target.fog-from.fog)*progress,cloud:from.cloud+(target.cloud-from.cloud)*progress,progress,clock:engine?'engine':'host-12s'};
  previousProgress=progress;return{...current};
 };
}
