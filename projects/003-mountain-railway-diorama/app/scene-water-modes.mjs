// Extend one registry to add a water presentation; scene geometry and effects read it.
export const waterModes={
 continuous:{name:'连续跌水',note:'无遮挡的完整水面，保留连贯的跌落与倒影。',split:false,dropScale:1,start:-6,end:-2,foam:.86,splash:.4,flowScale:1},
 stream:{name:'浅滩缓流',note:'降低落差、拉长缓坡，水纹轻缓，减少白沫与飞溅。',split:false,dropScale:.22,start:-12,end:2,foam:.16,splash:0,flowScale:.55},
 rocky:{name:'岩间分流',note:'低矮露岩分开上游水面，水从两侧绕行并在下游汇合。',split:true,dropScale:1,start:-6,end:-2,foam:.66,splash:1,flowScale:1}
};
export function getWaterMode(id='continuous'){
 if(!Object.hasOwn(waterModes,id))throw new RangeError('未知水流模式：'+id);
 return waterModes[id];
}

export const waterTuningDefaults={
 continuous:{thickness:.65,foam:.5,mist:.45,reflection:.6,ripple:.4},
 stream:{thickness:.4,foam:.2,mist:0,reflection:.75,ripple:.3},
 rocky:{thickness:.7,foam:.65,mist:.75,reflection:.55,ripple:.5}
};
export function createWaterTuning(){
 const settings=Object.fromEntries(Object.entries(waterTuningDefaults).map(([id,v])=>[id,{...v}]));
 return{get(id){getWaterMode(id);return{...settings[id]};},set(id,key,value){getWaterMode(id);if(!Object.hasOwn(settings[id],key)||!Number.isFinite(value)||value<0||value>1)throw new RangeError('无效水流细节参数');settings[id][key]=value;},reset(id){getWaterMode(id);settings[id]={...waterTuningDefaults[id]};return{...settings[id]};}};
}

// Integrate flow time so changing speed does not jump the texture position.
export function advanceWaterPhase(phase,dt,flow){return phase+Math.max(0,dt)*Math.max(0,flow);}
export const waterLaneShift=cross=>.48*Math.sin(cross*1.17)+.23*Math.sin(cross*2.31);
export const waterImpactZ=(world,cross=0)=>world.waterStyle.end-waterLaneShift(cross)+.25;
export function waterTravel(world,z,cross=0){
 const {start,end}=world.waterStyle,d=end-start,a=z+waterLaneShift(cross)-start,entry=1.15*1.35;
 if(a<=0)return a/1.15-3/1.15*Math.log((1+.35*Math.exp(a/3))/1.35);
 const fallTime=d/entry*Math.log(1+2.2*Math.min(a/d,1))/2.2;
 if(a<=d)return fallTime;
 const tail=a-d,exit=entry*3.2,extra=exit-1.35;
 return fallTime+tail/1.35+3/1.35*Math.log((1.35+extra*Math.exp(-tail/3))/exit);
}

export function waterTravelToZ(world,t,cross=0){
 let lo=-32,hi=32;
 for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(waterTravel(world,mid,cross)<t)lo=mid;else hi=mid;}
 return(lo+hi)/2;
}

// A pool patch is born at the foot, spreads with its age, then dissolves.
export function poolFoamState(world,age,lateral,seed=0){
 const life=4.5+seed*2,a=Math.max(0,Math.min(1,age/life));
 const cross=lateral*.48*world.halfWidth(world.waterStyle.end);
 const z=waterTravelToZ(world,waterTravel(world,waterImpactZ(world,cross),cross)+Math.max(0,age),cross);
 const spread=.48+.36*a;
 const x=world.riverX(z)+Math.max(-.86,Math.min(.86,lateral*spread+Math.sin(a*4+seed*6)*.025*a))*world.halfWidth(z);
 const fadeIn=Math.min(1,a/.12),fadeOut=Math.max(0,1-a);
 return{x,z,opacity:age<0||age>=life?0:fadeIn*fadeIn*(3-2*fadeIn)*fadeOut*fadeOut,scale:.7+a*1.8};
}
