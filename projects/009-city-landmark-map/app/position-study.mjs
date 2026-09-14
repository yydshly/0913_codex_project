import {projection,escapeXML} from './xian-geo.mjs';
export function createPlan(points,anchorId='bell'){
 if(points.length<2||new Set(points.map(p=>p.id)).size!==points.length)throw new Error('需要至少两个不同地点');
 const crs=points[0].coordinateSystem;
 if(!['GCJ-02','WGS-84'].includes(crs)||points.some(p=>p.coordinateSystem!==crs))throw new Error('坐标系不一致或未声明，须先统一');
 if(points.some(p=>!Number.isFinite(p.lon)||!Number.isFinite(p.lat)||Math.abs(p.lon)>180||Math.abs(p.lat)>80||!p.source))throw new Error('坐标或来源不完整');
 if(Math.max(...points.map(p=>p.lon))-Math.min(...points.map(p=>p.lon))>3||Math.max(...points.map(p=>p.lat))-Math.min(...points.map(p=>p.lat))>3)throw new Error('超出本原型的城市范围；应改用适合地域的投影');
 if(!points.some(p=>p.id===anchorId))throw new Error('缺少参照地点');
 const frame={width:1400,height:900},project=projection(points,{x:90,y:155,w:830,h:620});
 const places=points.map((p,i)=>({...p,number:i+1,...project.point(p)}));
 for(const p of places)p.radius=Math.min(34,Math.min(...places.filter(q=>q!==p).map(q=>Math.hypot(q.x-p.x,q.y-p.y)))*.35);
 const relations=[];
 for(let i=0;i<places.length;i++)for(let j=i+1;j<places.length;j++){
  const a=places[i],b=places[j];
  for(const axis of ['x','y'])if(Math.abs(b[axis]-a[axis])>=12)relations.push({a:a.id,b:b.id,axis,sign:Math.sign(b[axis]-a[axis])});
 }
 const crowded=[];
 for(let i=0;i<places.length;i++)for(let j=i+1;j<places.length;j++)if(Math.hypot(places[i].x-places[j].x,places[i].y-places[j].y)<100)crowded.push([places[i].id,places[j].id]);
 return {version:1,kind:'planned-layout',coordinateSystem:crs,projection:'城市范围局部等距圆柱近似；经度按平均纬度修正；统一缩放',frame,anchorId,places,relations,crowded,limits:{axisDeadbandPx:12,artworkTestDiameterPx:100},note:'圆形区域仅约束景观落点，不是景区边界或完整素材尺寸。此文件不是成图观察。'};
}
export function validateArtwork(plan,observation){
 const errors=[],pending=[];
 if(observation.kind!=='artwork-observation')errors.push('需要独立的成图观察，禁止将布局清单当作观察结果');
 if(!/^[a-f0-9]{64}$/i.test(observation.imageSha256||''))pending.push('尚未绑定成图哈希');
 if(observation.width!==plan.frame.width||observation.height!==plan.frame.height)errors.push('画布尺寸不匹配；先恢复相同画框并换算像素');
 const items=observation.places||[],byId=new Map();
 for(const p of items){if(byId.has(p.id))errors.push('重复景区：'+p.id);byId.set(p.id,p);if(!plan.places.some(q=>q.id===p.id))errors.push('未知景区：'+p.id);}
 for(const expected of plan.places){
  const p=byId.get(expected.id);
  if(!p){pending.push('尚未观察：'+expected.id);continue;}
  if(p.status==='missing'){errors.push('成图漏画：'+p.id);continue;}
  if(p.status!=='observed'||!Number.isFinite(p.x)||!Number.isFinite(p.y)){pending.push('落点待确认：'+p.id);continue;}
  if(Math.hypot(p.x-expected.x,p.y-expected.y)>expected.radius)errors.push('景观落点超出区域：'+p.id);
  if(p.identity==='wrong')errors.push('景观身份不符：'+p.id);
  else if(p.identity!=='verified'||!p.reference||!p.reviewNote)pending.push('景观身份待对照资料：'+p.id);
 }
 for(const r of plan.relations){
  const a=byId.get(r.a),b=byId.get(r.b);
  if(a?.status!=='observed'||b?.status!=='observed'||!Number.isFinite(a[r.axis])||!Number.isFinite(b[r.axis]))continue;
  if((b[r.axis]-a[r.axis])*r.sign<=0)errors.push('相对方位倒置或重叠：'+r.a+' / '+r.b+' / '+r.axis);
 }
 return {status:errors.length?'failed':pending.length?'pending':'passed',scope:'仅校验输入的成图观察；不自动识别图片，不证明人工观察真实或审美合格',errors,pending};
}
export function observationTemplate(plan){return {kind:'artwork-observation',imageSha256:null,width:plan.frame.width,height:plan.frame.height,places:plan.places.map(p=>({id:p.id,status:'unreviewed',x:null,y:null,identity:'unreviewed',reference:null,reviewNote:null}))};}
export function renderPlan(plan){
 const esc=escapeXML,txt=(x,y,t,size=18)=>`<text x="${x}" y="${y}" font-size="${size}" fill="#354c40">${esc(t)}</text>`;
 let body='<rect width="1400" height="900" fill="#f5f2e7"/>'+txt(48,62,'西安 · 景区位置实验底稿',32)+txt(48,99,'内部生成依据：真实点位投影；不代表最终插画效果',17);
 body+='<rect x="45" y="125" width="935" height="700" rx="16" fill="#faf9f2" stroke="#d9ddcd"/>';
 for(const p of plan.places)body+=`<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="#e1e9d6" stroke="#6d8563" stroke-dasharray="4 4"/><circle cx="${p.x}" cy="${p.y}" r="4" fill="#355c49"/>`+txt(p.x+8,p.y-8,String(p.number).padStart(2,'0'),14);
 body+=txt(890,160,'北 ↑',20);
 plan.places.forEach((p,i)=>{const y=164+i*75;body+=txt(1010,y,String(p.number).padStart(2,'0')+'  '+p.label,20)+txt(1010,y+25,p.type||'景区参考点',13);});
 body+=txt(48,856,'圆心 = 景观落点；虚线圈 = 位置允许区域；编号对应右侧地点',16);
 body+=txt(48,882,'密集城区尚需放大布局实验；小圆不表示景区真实面积。',14);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900" role="img" aria-label="西安八处景区位置实验底稿" font-family="Microsoft YaHei, sans-serif">${body}</svg>`;
}

