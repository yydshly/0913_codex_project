const clamp=v=>Math.max(0,Math.min(1,v));
// Accelerated, normalized visual reservoir, not measured snow depth or temperature.
// Snow mode represents cold deposition; after snowfall, daylight/rain speed thaw.
export function advanceSnowCover(cover,{dt,snowing=false,intensity=0,hours=15.5,cloud=0,rain=0}){
 const step=Math.max(0,Math.min(.1,dt)),before=clamp(cover);
 const sun=Math.max(0,Math.sin((hours-6)*Math.PI/12))*(1-clamp(cloud));
 const tau=75/(.2+sun*1.5+clamp(rain)*.45);
 const next=snowing?before+(1-before)*clamp(intensity)*(1-Math.exp(-step/28)):before*Math.exp(-step/tau);
 return{cover:next,meltwaterDelta:snowing?0:before-next,added:snowing?next-before:0,meltSeconds:tau};
}
export const snowmeltSequencePhase=t=>t<45?'snow':t<135?'melt':'complete';
export function snowmeltSequenceStatus(elapsed){
 const t=Math.max(0,Math.min(135,elapsed));
 return{stage:t<45?'snowing':t<57?'thawingSky':t<135?'melting':'complete',remaining:Math.ceil(135-t),stageRemaining:Math.ceil((t<45?45:t<57?57:135)-t),progress:t/135};
}
