import {createPlan} from './position-study.mjs';
import {projection,escapeXML} from './xian-geo.mjs';
const coreIds=['bell','pagoda','daming'];
export function createScenicPlan(points){
 const validated=createPlan(points),core=points.filter(p=>coreIds.includes(p.id));
 if(core.length!==3)throw new Error('城区放大实验需要钟楼、大雁塔和大明宫');
 const main=projection(points,{x:150,y:240,w:1510,h:1040}),detail=projection(core,{x:1920,y:300,w:410,h:930});
 const places=validated.places.map(p=>({...p,panel:coreIds.includes(p.id)?'core':'main',geoAnchor:main.point(p),...(coreIds.includes(p.id)?detail:main).point(p)}));
 for(const p of places){
  const near=places.filter(q=>q!==p&&q.panel===p.panel).map(q=>Math.hypot(q.x-p.x,q.y-p.y));
  p.radius=Math.min(p.panel==='core'?155:135,Math.min(...near)*.42);
 }
 const relations=[];
 for(let i=0;i<places.length;i++)for(let j=i+1;j<places.length;j++){
  const a=places[i],b=places[j];if(a.panel!==b.panel)continue;
  for(const axis of ['x','y'])if(Math.abs(b[axis]-a[axis])>=12)relations.push({a:a.id,b:b.id,axis,sign:Math.sign(b[axis]-a[axis])});
 }
 return {...validated,version:2,frame:{width:2600,height:1550},places,relations,crowded:[],
  panels:[{id:'main',label:'西安与周边',scale:main.scale},{id:'core',label:'城区独立放大',scale:detail.scale}],
  originalCrowded:validated.crowded,
  note:'主图与城区放大使用各自等比投影；跨图幅不比较画布距离。geoAnchor保留每处在主图的真实投影位置；允许圆形区域是景观占位规则，不是景区范围。'};
}
export function scenicCommands(plan){
 return plan.places.map(p=>{const size=Math.floor(p.radius*1.30);return {placeId:p.id,assetId:p.id,x:Math.round(p.x-size/2),y:Math.round(p.y-size/2),width:size,height:size};});
}
export function renderScenicPlan(plan){
 const esc=escapeXML,txt=(x,y,t,size=26,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="#334c3b" ${extra}>${esc(t)}</text>`;
 let s='<rect width="2600" height="1550" fill="#f6f1e3"/>'+txt(80,102,'西安与周边 · 景区合成实验',52)+txt(82,155,'位置由坐标确定 · 城区另幅放大 · 景区外形仍待核实',25);
 s+='<rect x="50" y="190" width="1710" height="1240" rx="30" fill="#eef0df" stroke="#d0d8c2"/><rect x="1810" y="190" width="740" height="1240" rx="30" fill="#fdfaf0" stroke="#d0d8c2"/>';
 s+=txt(1860,252,'城区放大 · 不同比例',28)+txt(1580,246,'北 ↑',25);
 const core=plan.places.filter(p=>p.panel==='core'),xs=core.map(p=>p.geoAnchor.x),ys=core.map(p=>p.geoAnchor.y);
 const cx=Math.min(...xs)-22,cy=Math.min(...ys)-24,cw=Math.max(...xs)-cx+22,ch=Math.max(...ys)-cy+24;
 s+=`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="10" fill="#dce6cc" stroke="#7c9270" stroke-dasharray="7 7"/>`+txt(cx-20,cy-22,'城区 → 右图展开',25);
 for(const p of plan.places){
  s+=`<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="#e1e8d0" fill-opacity=".5"/>`;
  s+=txt(p.x,p.id==='terracotta'?p.y-p.radius-28:p.y+p.radius+32,p.label,27,'text-anchor="middle"');
 }
 s+=txt(80,1493,'候选素材的受控合成，不是地理或建筑精度已经验收的最终旅游图。',24);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="2600" height="1550" viewBox="0 0 2600 1550" font-family="Microsoft YaHei, sans-serif" role="img" aria-label="西安景区受控合成，右侧为城区独立放大">${s}</svg>`;
}
