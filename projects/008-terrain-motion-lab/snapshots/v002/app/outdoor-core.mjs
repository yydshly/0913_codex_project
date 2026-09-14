import {validateOutdoorRecipe} from './outdoor-recipe.mjs';
import {relief,scatterTrees,pineDimensions} from './reuse-core.mjs';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const chapters=[
 {id:'drive',title:'自驾进山',tag:'第一天 · 午后',start:0,end:.36,focus:.12,description:'沿林间土路驶入山谷，在营地入口停车。观察弯道、树影和道路与草地的衔接。',reuse:'复用土路生成、地表混合、松林布置与地面取高；新增车辆和停车点。'},
 {id:'camp',title:'松林露营',tag:'第一天 · 傍晚',start:.36,end:.56,focus:.44,description:'车停在入口，帐篷布置在道路外的平整空地。旋转视角查看营位、桌椅和营灯。',reuse:'复用同一片土地与树林；新增营位整平、帐篷与照明，植物自动让出营位。'},
 {id:'hike',title:'清晨登山',tag:'第二天 · 拂晓',start:.56,end:.88,focus:.68,description:'从营地沿窄步道爬升到观景点。人物和视角随地面起伏，车辆留在停车处。',reuse:'复用地面高度和路径采样；把宽车道换成窄步道，加入步行角色。'},
 {id:'sunrise',title:'山顶看日出',tag:'第二天 · 日出',start:.88,end:1,focus:.88,description:'抵达山脊，面向远山看太阳升起。拖动行程到最后一段，观察天空、晨雾和地表受光变化。',reuse:'复用地形、植被与材质；改变太阳位置、天空和雾，得到新的体验。'}
];
export function journeyAt(progress){if(!Number.isFinite(progress))throw Error('行程进度无效');const p=clamp(progress),chapter=chapters.find(c=>p<c.end)||chapters[3];return{progress:p,chapter,local:clamp((p-chapter.start)/(chapter.end-chapter.start))};}
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
function rounded(points,cornerRadius=.85){const out=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(cornerRadius,ab*.22,bc*.22),entry=[b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab],end=[b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc];out.push(entry);for(let k=1;k<=12;k++){const t=k/12;out.push([(1-t)**2*entry[0]+2*(1-t)*t*b[0]+t*t*end[0],(1-t)**2*entry[1]+2*(1-t)*t*b[1]+t*t*end[1]]);}}out.push(points.at(-1));return out;}
export function pathFrom(input,terrain,cornerRadius=.85){const points=rounded(input,cornerRadius);const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));const length=lengths.at(-1);function sample(t){const d=clamp(t)*length;let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;const a=points[i-1],b=points[i],u=(d-lengths[i-1])/(lengths[i]-lengths[i-1]),x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;return{x,z,y:terrain(x,z),heading:Math.atan2(b[0]-a[0],b[1]-a[1])};}function nearest(x,z){let distance=Infinity,px=x,pz=z,along=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));const candidate=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(candidate<distance){distance=candidate;px=a[0]+dx*t;pz=a[1]+dz*t;along=lengths[i-1]+(lengths[i]-lengths[i-1])*t;}}return{distance,x:px,z:pz,y:terrain(px,pz),t:along/length};}return{length,sample,nearest,points};}
export function makeOutdoor(input={}){
 const recipe=validateOutdoorRecipe(input),camp={x:recipe.campX,z:recipe.campZ,y:.8},summit={x:recipe.summitX,z:recipe.summitZ,y:.8+recipe.ascent};
 const campPoint=(x,z)=>[x+camp.x-7,z+camp.z-10];
 const drivePoints=[[-27,22],[-20,18],[-14,16],[-9,11],[-5,6],[0,6],[0,10]].map(([x,z],i)=>{const t=i/6;return[x+(camp.x-7)*smooth(t),z+(camp.z-10)*smooth(t)+recipe.roadBend*Math.sin(Math.PI*t)**2];});
 // The final parking segment moves rigidly with the campsite, preserving the car-door exit.
 drivePoints[5]=campPoint(0,6);drivePoints[6]=campPoint(0,10);
 const trailPoints=[[10.6,8],[17,5],[20,0],[12,-4],[10,-9],[21,-12],[21,-16],[16,-18]].map(([x,z],i)=>{const t=i/7;return[x+(camp.x-7)*(1-t)+(summit.x-16)*t,z+(camp.z-10)*(1-t)+(summit.z+18)*t];});
 const rawHeight=(x,z)=>.6+(summit.y-.6)*Math.exp(-((x-summit.x)**2/190+(z-summit.z)**2/270))+.8*Math.exp(-((x+18)**2+(z+7)**2)/190)+relief(x,z)*.35;
 const baseTerrain=(x,z)=>{let y=rawHeight(x,z);for(const [site,inner,outer] of [[camp,5.1,6.3],[summit,2.4,4]]){const blend=smooth((Math.hypot(x-site.x,z-site.z)-inner)/(outer-inner));y=site.y*(1-blend)+y*blend;}return y;};
 const roadPlan=pathFrom(drivePoints,()=>0,3.5);
 const trailPlan=pathFrom(trailPoints,()=>0,2);
 // Shape the hillside over several metres before cutting a small, walkable tread.
 // Blended samples keep the field continuous between neighbouring switchbacks.
 const grading=Array.from({length:97},(_,i)=>{const p=trailPlan.sample(i/96);return{...p,delta:camp.y+(summit.y-camp.y)*smooth(i/96)-baseTerrain(p.x,p.z)};});
 const hillside=(x,z)=>{let weight=0,offset=0;for(const p of grading){const r2=(x-p.x)**2+(z-p.z)**2;if(r2>144)continue;const w=Math.exp(-r2/18)/(r2+.16)*(1-smooth((Math.sqrt(r2)-9)/3));weight+=w;offset+=w*p.delta;}let y=baseTerrain(x,z)+offset/Math.max(1,weight);for(const [site,inner,outer] of [[camp,5.1,8],[summit,2.4,5]]){const blend=smooth((Math.hypot(x-site.x,z-site.z)-inner)/(outer-inner));y=site.y*(1-blend)+y*blend;}return y;};
 const terrain=(x,z)=>{const road=roadPlan.nearest(x,z),walk=trailPlan.nearest(x,z);let y=hillside(x,z);const roadMix=smooth((road.distance-1.6)/2.8);y=(.8+.5*(1-road.t))*(1-roadMix)+y*roadMix;const height=camp.y+(summit.y-camp.y)*smooth(walk.t),mix=smooth((walk.distance-.24)/.42);return height*(1-mix)+y*mix;};
 const drive=pathFrom(drivePoints,terrain,3.5);
 const trail=pathFrom(trailPoints,terrain,2);
 const source={...drive,scene:'mountain',width:3.2,terrain};
 const nearest=(x,z)=>({distance:Math.min(drive.nearest(x,z).distance,trail.nearest(x,z).distance*3.2/.95,Math.max(0,Math.hypot(x-camp.x,z-camp.z)-2.5))});
 const isPlantable=(x,z,scale)=>{const radius=pineDimensions.radius*scale,forward=(x-summit.x)*.417-(z-summit.z)*.909,across=Math.abs((x-summit.x)*.909+(z-summit.z)*.417);if(forward>0&&forward<115&&across<1.8+forward*.045+radius)return false;return drive.nearest(x,z).distance>1.9+radius&&trail.nearest(x,z).distance>.65+radius&&Math.hypot(x-camp.x,z-camp.z)>6.5+radius&&Math.hypot(x-summit.x,z-summit.z)>5.3+radius;};
 const trees=scatterTrees(source,{treeDensity:420,treeScale:1,treePattern:'uniform'}).filter(p=>isPlantable(p.x,p.z,p.scale));
 const arrival=pathFrom([[1.4,9],[3,7],[5,6],[7.3,6.3]].map(p=>campPoint(...p)),terrain),departure=pathFrom([[7.3,6.3],[9.4,6.3],[10.6,8]].map(p=>campPoint(...p)),terrain);
 return{recipe,source,terrain,drive,trail,camp,summit,trees,nearest,arrival,departure,isPlantable};
}
export function actorAt(land,j,light=lightAt(j)){const id=j.chapter.id,t=j.local,driveProgress=id==='drive'?smooth(t):1;let route=land.arrival,routeDistance=0,p=land.arrival.sample(0),walkDistance=0,walking=false,action='沿林间道路前行';if(id==='drive'){action=t>.8?'减速，驶入营地入口':'沿林间道路前行';}else if(id==='camp'){if(t<.52){const f=smooth(t/.52);p=land.arrival.sample(f);walkDistance=f*land.arrival.length;walking=t>.015&&t<.50;action=t<.06?'停车，下车':'从停车处步行进入营地';}else if(t<.92){p=land.arrival.sample(1);action=t<.75?'营地休息，等待天色变暗':'营地入夜 · 休息';}else{const f=smooth((t-.92)/.08);p=land.departure.sample(f);walkDistance=land.arrival.length+f*land.departure.length;walking=t<.99;action='清晨出发 · 走向登山口';}}else{const f=id==='hike'?smooth(t):1;p=land.trail.sample(f);walkDistance=land.trail.length*f;walking=id==='hike'&&t>.01&&t<.99;action=id==='sunrise'?(t<.3?'天边泛红 · 等待第一束光':t<.65?'太阳越过山脊 · 晨光初现':'晨光铺开 · 山谷渐渐明亮'):'沿步道缓缓上山';}if(id==='camp'&&t>=.92){route=land.departure;routeDistance=Math.max(0,walkDistance-land.arrival.length);}else if(id==='hike'||id==='sunrise'){route=land.trail;routeDistance=id==='sunrise'?route.length:walkDistance;}else{routeDistance=id==='camp'&&t>=.52?route.length:walkDistance;}let viewTurn=0;if(id==='sunrise'){const sun=solarDirection(light),heading=Math.atan2(sun.x,sun.z);viewTurn=smooth(t/.12);p={...p,heading:p.heading+Math.atan2(Math.sin(heading-p.heading),Math.cos(heading-p.heading))*viewTurn};if(viewTurn<1)action='登顶站稳 · 转身面向晨光';}return{driveProgress,p,route,routeDistance,walkDistance,walking,viewTurn,watching:id==='sunrise',visible:id!=='drive',action,nightFade:id==='camp'?smooth((t-.76)/.07)*(1-smooth((t-.92)/.08)):0};}
function interpolate(keys,p){for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){const [a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*smooth((p-a)/(b-a));}return keys.at(-1)[1];}
// One illustrative timeline drives the clock, direct light and shadow direction.
const lightTimeline=[[0,900,1,.72],[.25,1020,.85,.34],[.36,1040,.52,.18],[.46,1085,.32,.09],[.515,1380,.08,-.06],[.54,1740,.15,-.06],[.56,1755,.20,-.035],[.88,1780,.20,-.015],[.93,1800,.35,.055],[1,1850,.85,.19]];
export function lightAt(journey,mode='auto'){
 if(!['auto','day','dusk','dawn'].includes(mode))throw Error('未知光照');
 const minute=mode==='day'?750:mode==='dusk'?1085:mode==='dawn'?1810:interpolate(lightTimeline.map(k=>[k[0],k[1]]),journey.progress);
 const brightness=mode==='day'?1:interpolate(lightTimeline.map(k=>[k[1],k[2]]),minute);
 const elevation=mode==='day'?1.43:interpolate(lightTimeline.map(k=>[k[1],k[3]]),minute);
 const duskMix=mode==='day'?.6:1-smooth((minute-1660)/80),day=Math.floor(minute/1440)+1,m=Math.round(minute)%1440;
 return{brightness,elevation,duskMix,isDusk:minute%1440>=1020&&minute%1440<1140,azimuth:interpolate([[750,-1.45],[900,-1.9],[1085,-2.71],[1380,-3.4],[1755,.43-Math.PI*2],[1850,.43-Math.PI*2]],minute),minute,clock:String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),day,dawnMix:smooth((minute-1740)/35)*(1-smooth((minute-1850)/50)),dawnPhase:smooth((minute-1780)/70)};
}
export function shadowAt(light,height=6.4){const d=solarDirection(light),horizontal=Math.hypot(d.x,d.z),visible=d.y>0;return{visible,direction:{x:-d.x/horizontal,z:-d.z/horizontal},flatLength:visible?height/light.elevation:null};}

export function solarDirection(light){const azimuth=light.azimuth??(.43-light.duskMix*Math.PI),elevation=Math.atan(light.elevation);return{x:Math.sin(azimuth)*Math.cos(elevation),y:Math.sin(elevation),z:-Math.cos(azimuth)*Math.cos(elevation)};}

export function inspectOutdoorLayout(land){
 let separation=Infinity,campClearance=Infinity,maxTrailGrade=0;let previous=land.trail.sample(0);
 for(let i=0;i<=200;i++){const d=land.drive.sample(i/200),w=land.trail.sample(i/200);separation=Math.min(separation,land.trail.nearest(d.x,d.z).distance);campClearance=Math.min(campClearance,Math.hypot(d.x-land.camp.x,d.z-land.camp.z));if(i)maxTrailGrade=Math.max(maxTrailGrade,Math.abs(w.y-previous.y)/Math.hypot(w.x-previous.x,w.z-previous.z));previous=w;}
 const errors=[];if(separation<2.5)errors.push('车道与步道过近，请把山顶向东或向北移动');if(campClearance<6.3)errors.push('道路过于接近营位，请减少车道弯曲或移动营地');
 return{valid:errors.length===0,errors,separation,campClearance,maxTrailGrade,driveLength:land.drive.length,trailLength:land.trail.length,ascent:land.summit.y-land.camp.y};
}
