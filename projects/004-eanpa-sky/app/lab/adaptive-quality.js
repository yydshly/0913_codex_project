export const qualityLevels=[
 {name:'standard',divisor:2,ao:true,reflectionMultiplier:1},
 {name:'smooth',divisor:3,ao:true,reflectionMultiplier:2},
 {name:'light',divisor:4,ao:false,reflectionMultiplier:3}
];
// Five-second active windows, asymmetric thresholds and a cooldown prevent
// transient shader compilation, pauses or a single slow frame from oscillating quality.
export function makeAdaptiveQuality(){
 let level=0,start=null,last=null,times=[],slow=0,fast=0,cooldownUntil=0,decisions=0,lastWindow=null;
 function resetWindow(){start=null;last=null;times=[];slow=fast=0;}
 return{
  resetWindow,
  reset(){level=0;cooldownUntil=0;lastWindow=null;resetWindow();},
  sample(now,ms){
   if(!Number.isFinite(now)||!Number.isFinite(ms)||ms<0)return null;
   if(last!==null&&(now-last>1000||now<last))resetWindow();
   last=now;if(start===null){start=now;return null;}times.push(ms);
   if(now-start<5000)return null;
   const sorted=[...times].sort((a,b)=>a-b),fps=times.length*1000/(now-start),p95=sorted[Math.floor((sorted.length-1)*.95)];
   lastWindow={fps:+fps.toFixed(1),p95Ms:+p95.toFixed(2),samples:times.length};start=now;times=[];
   if(now<cooldownUntil){slow=fast=0;return null;}
   slow=fps<42||p95>28?slow+1:0;fast=fps>=57&&p95<15?fast+1:0;
   let reason=null;
   if(slow>=2&&level<2){level++;reason='sustained-load';}
   else if(fast>=6&&level>0){level--;reason='sustained-headroom';}
   if(!reason)return null;
   slow=fast=0;cooldownUntil=now+20000;decisions++;
   return{level,reason,...lastWindow};
  },
  snapshot(){return{level,...qualityLevels[level],decisions,lastWindow,windowSeconds:5,cooldownSeconds:20};}
 };
}
