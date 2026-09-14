// Lighting is independent of weather and never changes the simulation clock.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export function lightTargets(hours,{mode='auto',brightness=.7,tea=true,path=true,rooms=true}={}){
 const h=((hours%24)+24)%24;
 const night=1-smooth((h-5)/2.5)+smooth((h-16.5)/2.5);
 const level=(mode==='off'?0:mode==='on'?1:night)*clamp(brightness);
 return{tea:tea?level:0,path:path?level:0,rooms:rooms?level:0};
}
export function fadeLight(current,target,dt){return target+(current-target)*Math.exp(-Math.max(0,Math.min(.1,dt))/.25);}
