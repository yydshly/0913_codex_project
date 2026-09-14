export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const wrap=(x,n=1)=>((x%n)+n)%n;
// Conservative ground footprints include the cabin's porch, steps and roof.
// Shared by placement, route validation and the movement guard.
// A 3 m radius also encloses the normal vehicle body while pitching/rolling.
export const landmarks=Object.freeze([
 {id:'cabin',label:'巡游站',x:-46,z:18,angle:-.4,halfX:4.1,minZ:-2.7,maxZ:4},
 {id:'lookout',label:'观景台',x:15,z:-11,angle:0,halfX:3.1,minZ:-2.1,maxZ:2.1},
 {id:'windmill',label:'风车基座',x:-39,z:-20,angle:0,halfX:.5,minZ:-.5,maxZ:.5}
].map(Object.freeze));
export const vehicleRadius=3.0, laneLimit=1.7;
export function footprintDistance(x,z,o){const dx=x-o.x,dz=z-o.z,c=Math.cos(o.angle),s=Math.sin(o.angle),lx=c*dx-s*dz,lz=s*dx+c*dz;return Math.hypot(Math.max(0,Math.abs(lx)-o.halfX),Math.max(0,o.minZ-lz,lz-o.maxZ));}
export function routeClearances(track){return track.obstacles.map(o=>{let distance=Infinity;for(let s=0;s<track.length;s+=.1){const p=track.sample(s);distance=Math.min(distance,footprintDistance(p.x,p.z,o))}return{id:o.id,label:o.label,margin:distance-laneLimit-vehicleRadius-.1};});}
export function movementObstacle(track,s,lane,travel,nextLane){const steps=Math.max(1,Math.ceil((travel+Math.abs(nextLane-lane))/.08));for(let i=0;i<=steps;i++){const p=track.sample(s+travel*i/steps,mix(lane,nextLane,i/steps));for(const o of track.obstacles){if(footprintDistance(p.x,p.z,o)<vehicleRadius+.15)return o;}}return null;}
export const assemblyDefaults=()=>({showTerrain:true,showRoad:true,showBuildings:true,showNature:true,showVehicles:true,textures:true,lighting:true,bounds:false,leadStopped:false});
export const defaults=()=>({...assemblyDefaults(),lift:0,wet:0,cruise:24,profile:'balanced',layer:0,camera:'overview',mode:'auto',paused:false,material:'full',normal:1,roughness:.85,repeat:1,shadows:true,motion:true,explode:0});
export function createTrack(lift=0){
 const N=480,pts=[],lengths=[0];
 for(let i=0;i<=N;i++){const u=i/N,t=u*Math.PI*2;pts.push({x:36*Math.cos(t)+6*Math.sin(2*t),z:25*Math.sin(t)+3*Math.cos(3*t),u});if(i)lengths.push(lengths[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));}
 const length=lengths[N];
 const height=u=>{const t=u*Math.PI*2,d=Math.min(Math.abs(u-.17),1-Math.abs(u-.17));return 4+1.6*Math.cos(t+.4)+1.15*Math.sin(t*2)+lift*Math.exp(-((d/.053)**2))};
 pts.forEach((p,i)=>{p.u=lengths[i]/length;p.y=height(p.u)});
 function point(distance){const s=wrap(distance,length);let lo=0,hi=N;while(hi-lo>1){const m=(lo+hi)>>1;if(lengths[m]>s)hi=m;else lo=m}const t=(s-lengths[lo])/(lengths[hi]-lengths[lo]);return{x:mix(pts[lo].x,pts[hi].x,t),z:mix(pts[lo].z,pts[hi].z,t),y:mix(pts[lo].y,pts[hi].y,t),u:mix(pts[lo].u,pts[hi].u,t)}}
 function sample(distance,lane=0){const p=point(distance),a=point(distance-.45),b=point(distance+.45),dx=b.x-a.x,dz=b.z-a.z,dl=Math.hypot(dx,dz),forward={x:dx/dl,z:dz/dl};const c=point(distance-1.5),d=point(distance+1.5),ax=p.x-c.x,az=p.z-c.z,bx=d.x-p.x,bz=d.z-p.z;const cross=ax*bz-az*bx;const curvature=2*cross/(Math.max(.001,Math.hypot(ax,az)*Math.hypot(bx,bz)*Math.hypot(d.x-c.x,d.z-c.z)));return{...p,x:p.x+forward.z*lane,z:p.z-forward.x*lane,forward,grade:(b.y-a.y)/dl,curvature,distance:wrap(distance,length)}}
 function nearest(x,z){let best=0,dd=Infinity;for(let i=0;i<N;i++){const d=(pts[i].x-x)**2+(pts[i].z-z)**2;if(d<dd){dd=d;best=i}}return{...pts[best],distance:Math.sqrt(dd),s:lengths[best]}}
 const lakeRadius=(x,z)=>Math.hypot((x+6)/13,(z+1)/10);
 function terrain(x,z){const near=nearest(x,z);let h=3.1+12*Math.exp(-((x-27)**2/250+(z+26)**2/85))+10*Math.exp(-((x+27)**2/130+(z+29)**2/170))+6*Math.exp(-((x-43)**2/170+(z-13)**2/180));h+=(Math.sin(x*.21)*Math.cos(z*.23)+.24*Math.sin(x*.76+z*.34))*.9;h=mix(.85,h,smooth(.87,1.35,lakeRadius(x,z)));return mix(near.y-.07,h,smooth(3.15,8.7,near.distance))}
 return{pts,lengths,length,point,sample,nearest,terrain,lakeRadius,lift,obstacles:landmarks};
}
export const profiles={balanced:{label:'均衡驾驶',power:2.25,corner:.82},climb:{label:'爬坡优先',power:3.15,corner:.68},gentle:{label:'舒适优先',power:1.65,corner:.7}};
export function grip(wet){return .82-.5*clamp(wet,0,1)}
export function brakingDistance(kmh,wet){const v=Math.max(0,kmh)/3.6;return v*v/(2*grip(wet)*9.81)}
export function limits(track,s,config){const p=track.sample(s),profile=profiles[config.profile]||profiles.balanced;let bend=0;for(let d=0;d<=22;d+=2)bend=Math.max(bend,Math.abs(track.sample(s+d).curvature));const curve=Math.sqrt(grip(config.wet)*9.81*profile.corner/Math.max(.012,bend));const grade=Math.max(p.grade,track.sample(s+6).grade);const hill=Math.max(1.5,config.cruise/3.6-Math.max(0,grade)*13/profile.power);const target=Math.min(config.cruise/3.6,curve,hill);return{target,curve,hill,grade,reason:target===hill&&grade>.05?'上坡减速':target===curve?'弯前减速':'平稳巡游',mu:grip(config.wet)}}
export function createVehicle(s=0){return{s,v:4,lane:0,steer:0,throttle:0,brake:0,accel:0,bodyPitch:0,bodyRoll:0,pitchVel:0,rollVel:0,distance:0,lap:0};}
export function stepVehicle(v,dt,track,cfg,input={}){
 const l=limits(track,v.s,cfg),p=track.sample(v.s),profile=profiles[cfg.profile]||profiles.balanced,manual=cfg.mode==='manual';
 if(!manual&&Number.isFinite(input.leadGap)&&input.leadGap<18){l.target=Math.min(l.target,Math.max(0,input.leadSpeed+(input.leadGap-11)*.7));l.reason='保持车距'}
 const throttle=manual?clamp(input.throttle||0,0,1):clamp((l.target-v.v)*1.3,0,1),brake=manual?clamp(input.brake||0,0,1):clamp((v.v-l.target)*.75,0,1);
 const acceleration=throttle*profile.power-brake*l.mu*9.81-.14-.014*v.v*v.v-9.81*p.grade;
 v.accel=clamp(acceleration,-9,4);v.v=clamp(v.v+v.accel*dt,0,13);v.throttle=throttle;v.brake=brake;
 const steer=manual?clamp(input.steer||0,-1,1):0;v.steer=mix(v.steer,steer,1-Math.exp(-6*dt));
 let lane=clamp(v.lane+v.steer*v.v*.28*dt,-laneLimit,laneLimit);if(!manual)lane*=Math.exp(-dt*1.8);
 const travel=v.v*dt,obstacle=movementObstacle(track,v.s,v.lane,travel,lane);v.blockedBy=obstacle?.id||null;
 if(obstacle){v.v=0;v.accel=0;v.throttle=0;v.brake=1;l.target=0;l.reason=obstacle.label+'前停车';}
 else{v.s=wrap(v.s+travel,track.length);v.distance+=travel;v.lane=lane;}
 v.lap=Math.floor(v.distance/track.length);
 const pitch=Math.atan(p.grade)+v.accel*.014,roll=clamp(-p.curvature*v.v*v.v*.024-v.steer*.06,-.16,.16);v.pitchVel+=(36*(pitch-v.bodyPitch)-10*v.pitchVel)*dt;v.bodyPitch+=v.pitchVel*dt;v.rollVel+=(36*(roll-v.bodyRoll)-10*v.rollVel)*dt;v.bodyRoll+=v.rollVel*dt;return l;
}
export function simulateBraking(kmh,wet,dt=1/120){let v=kmh/3.6,d=0,time=0;const a=grip(wet)*9.81;while(v>0&&time<30){const h=Math.min(dt,v/a);d+=v*h-.5*a*h*h;v=Math.max(0,v-a*h);time+=h}return{distance:d,time};}
export function validateConfig(patch){if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('需要参数对象');const ranges={lift:[-2,4],wet:[0,1],cruise:[12,36],layer:[0,4],normal:[0,2],roughness:[.05,1],repeat:[.5,3],explode:[0,1]};const enums={profile:Object.keys(profiles),camera:['overview','follow','driver','detail'],mode:['auto','manual'],material:['full','clay','wire','color','normal']};for(const [k,v]of Object.entries(patch)){if(k in ranges){if(typeof v!=='number'||!Number.isFinite(v)||v<ranges[k][0]||v>ranges[k][1]||(k==='layer'&&!Number.isInteger(v)))throw Error('参数超出范围：'+k)}else if(k in enums){if(!enums[k].includes(v))throw Error('无效选项：'+k)}else if(['paused','shadows','motion',...Object.keys(assemblyDefaults())].includes(k)){if(typeof v!=='boolean')throw Error('需要开关值：'+k)}else throw Error('未知参数：'+k)}return patch;}
export function encodeSnapshot(cfg){const config={lift:cfg.lift,wet:cfg.wet,cruise:cfg.cruise,profile:cfg.profile};validateConfig(config);return JSON.stringify({version:1,config})}
export const scenarioPresets={
 tour:{title:'景区线路讲解',config:{lift:0,wet:0,cruise:24,profile:'gentle',layer:0,camera:'follow'},question:'观光车经过哪些坡弯，乘客从车上会看到什么？',result:'观察同一线路的全景与乘客视角，比较舒适策略下的目标车速。',next:'接入真实地形、站点和讲解内容，可扩展成景区导览与路线沟通工具。'},
 rain:{title:'雨后运行演示',config:{lift:0,wet:.65,cruise:18,profile:'gentle',layer:2,camera:'follow'},question:'降低巡游上限后，湿滑造成的变化能否被看见？',result:'比较同初速的模型制动距离，再运行双车制动，分清湿滑与初速的影响。',next:'补充实测抓地、司机反应、载荷与制动数据，可扩展为驾驶培训中的情境演示。'},
 works:{title:'坡道改造讨论',config:{lift:3,wet:0,cruise:24,profile:'climb',layer:1,camera:'follow'},question:'局部抬高 3 米，哪里变陡，车辆为何减速？',result:'对照原路线与改造路线的最大上坡，并在试验段观察车身姿态。',next:'接入测绘高程、道路宽度、排水和工程约束，可扩展为方案评审的交互表达。'}
};
export function summarizeScenario(cfg){validateConfig({lift:cfg.lift,wet:cfg.wet,cruise:cfg.cruise,profile:cfg.profile});const track=createTrack(cfg.lift);let maxGrade=0,minTarget=Infinity;for(let s=0;s<track.length;s+=.25){maxGrade=Math.max(maxGrade,track.sample(s).grade);minTarget=Math.min(minTarget,limits(track,s,cfg).target)}return{maxUphillPercent:maxGrade*100,minTargetKmh:minTarget*3.6,brakingAt24m:brakingDistance(24,cfg.wet),brakingAtLimitM:brakingDistance(cfg.cruise,cfg.wet)};}
export function decodeSnapshot(raw){const data=JSON.parse(raw);if(!data||data.version!==1||!data.config||Array.isArray(data.config))throw Error('不兼容的存档');const keys=Object.keys(data.config);if(keys.length!==4||keys.some(k=>!['lift','wet','cruise','profile'].includes(k)))throw Error('存档缺少必要字段');return validateConfig(data.config)}

// Single-lane no-overtaking constraint: retain 9 m route separation even under manual throttle.
// At this route's tightest bends and full lateral offsets this exceeds both 3 m envelopes.
export const fleetGap=9;
export function stepFleet(states,dt,track,cfg,input={}){
 const [a,b]=states,before=states.map(v=>({...v})),gapA=wrap(b.s-a.s,track.length),gapB=track.length-gapA;
 const result=stepVehicle(a,dt,track,cfg,{...input,leadGap:gapA,leadSpeed:b.v});
 if(cfg.leadStopped){b.v=0;b.accel=0;b.throttle=0;b.brake=1;b.blockedBy='parked';}
 else stepVehicle(b,dt,track,{...cfg,mode:'auto',profile:'gentle',cruise:cfg.cruise*.91},{leadGap:gapB,leadSpeed:before[0].v});
 const travel=states.map((v,i)=>Math.max(0,v.distance-before[i].distance));
 // Solve both limits against the same tick's proposed motion, independent of update order.
 for(let k=0;k<3;k++){
  travel[0]=Math.min(travel[0],Math.max(0,gapA+travel[1]-fleetGap));
  travel[1]=Math.min(travel[1],Math.max(0,gapB+travel[0]-fleetGap));
 }
 states.forEach((v,i)=>{const proposed=v.distance-before[i].distance;if(travel[i]<proposed-1e-9){v.s=wrap(before[i].s+travel[i],track.length);v.distance=before[i].distance+travel[i];v.lap=Math.floor(v.distance/track.length);v.v=Math.min(v.v,states[1-i].v);v.accel=0;v.throttle=0;v.brake=1;v.blockedBy='vehicle';if(i===0){result.target=0;result.reason='前车保护 · 禁止穿越';}}});
 return result;
}
