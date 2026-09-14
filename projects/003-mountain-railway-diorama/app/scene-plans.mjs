// Portable user configuration; no renderer objects or animation clocks.
export const PLAN_KEY='egret.scene-plans.v1';
const ids=['classic','ridge','marsh'],modes=['continuous','stream','rocky'];
const fail=()=>{throw new Error('方案内容不完整或参数超出范围，当前场景未更改。')};
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:fail();
const num=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b?x:fail();
const bool=x=>typeof x==='boolean'?x:fail();
const choice=(x,a)=>a.includes(x)?x:fail();
const vector=x=>Array.isArray(x)&&x.length===3?x.map(v=>num(v,-1000,1000)):fail();
export function validatePlan(input){
 const p=obj(input);if(p.schemaVersion!==1||p.kind!=='egret-scene')throw new Error('不支持的方案版本，请使用白鹭河谷版本 1 的方案文件。');
 if(typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>60)throw new Error('方案名称需为 1—60 个字符。');
 const configs=obj(p.compositions),tuning=obj(p.waterTuning),e=obj(p.environment),o=obj(p.observation),c=obj(p.camera);
 const compositions=Object.fromEntries(ids.map(id=>{const v=obj(configs[id]);return[id,{composition:id,relief:num(v.relief,.15,1.8),width:num(v.width,3,11),bend:num(v.bend,0,7),fall:num(v.fall,1,6),density:num(v.density,40,300),waterMode:choice(v.waterMode,modes)}]}));
 const waterTuning=Object.fromEntries(modes.map(id=>{const v=obj(tuning[id]);return[id,Object.fromEntries(['thickness','foam','mist','reflection','ripple'].map(k=>[k,num(v[k],0,1)]))]}));
 const environment={season:choice(e.season,['spring','summer','autumn','winter']),mode:choice(e.mode,['day','evening','rain','night']),recommendedLight:bool(e.recommendedLight),fixedSeasonView:bool(e.fixedSeasonView),wind:num(e.wind,0,1),direction:num(e.direction,0,360),gust:num(e.gust,0,1),flow:num(e.flow,0,3),rain:num(e.rain,0,1),fog:num(e.fog,0,2),detail:num(e.detail,0,1),litter:num(e.litter,0,1)};
 if(e.wildlife!==undefined)environment.wildlife=bool(e.wildlife);
 if(e.fish!==undefined)environment.fish=bool(e.fish);
 if(e.aquatic!==undefined)environment.aquatic=bool(e.aquatic);
 const observation={stage:num(o.stage,1,5),speed:num(o.speed,.4,2),paused:bool(o.paused),auto:bool(o.auto),wireframe:bool(o.wireframe),view:choice(o.view,['overview','free','bridge','station','waterfall','wind','meadow','back','train','birds','wildlife','fish','aquatic'])};
 if(!Number.isInteger(observation.stage))fail();
 const camera={position:vector(c.position),target:vector(c.target)};const distance=Math.hypot(...camera.position.map((v,i)=>v-camera.target[i]));if(distance<10-.001||distance>300.001)fail();
 return{kind:'egret-scene',schemaVersion:1,name:p.name.trim(),composition:choice(p.composition,ids),compositions,waterTuning,environment,observation,camera};
}
export function parsePlan(text){if(typeof text!=='string'||text.length>262144)throw new Error('方案文件过大，最大支持 256 KB。');let p;try{p=JSON.parse(text)}catch{throw new Error('方案不是有效的 JSON 文件。')}return validatePlan(p)}
export function readLibrary(storage){const raw=storage.getItem(PLAN_KEY);if(!raw)return[];const lib=JSON.parse(raw);if(lib.version!==1||!Array.isArray(lib.plans)||lib.plans.length>40)throw new Error('本地方案库格式不支持');return lib.plans.map(validatePlan)}
export function savePlan(storage,plans,plan){const next=[...plans,validatePlan(plan)];if(next.length>40)throw new Error('最多保存 40 个方案，请先导出备份。');try{storage.setItem(PLAN_KEY,JSON.stringify({version:1,plans:next}))}catch{throw new Error('本地保存失败，原方案仍保留。请导出文件备份，或检查浏览器存储空间。')}return next;}
