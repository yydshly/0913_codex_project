import {places,centralIds,views,groups,metadata} from './xian-data.mjs';
const rad = Math.PI/180, R = 6371.0088;
export const escapeXML = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function distanceKm(a,b){
 const dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
 return 2*R*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
export function projection(points,rect){
 if(!points.length||points.some(p=>!Number.isFinite(p.lon)||!Number.isFinite(p.lat)))throw new Error('坐标缺失，不可绘制');
 const lat0=points.reduce((s,p)=>s+p.lat,0)/points.length,lon0=points.reduce((s,p)=>s+p.lon,0)/points.length;
 const kmx=R*rad*Math.cos(lat0*rad),kmy=R*rad;
 const xs=points.map(p=>(p.lon-lon0)*kmx),ys=points.map(p=>(p.lat-lat0)*kmy);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const scale=Math.min(rect.w/Math.max(xmax-xmin,.4),rect.h/Math.max(ymax-ymin,.4));
 const centerX=(xmin+xmax)/2,centerY=(ymin+ymax)/2;
 return {scale,point:p=>({x:rect.x+rect.w/2+((p.lon-lon0)*kmx-centerX)*scale,y:rect.y+rect.h/2-((p.lat-lat0)*kmy-centerY)*scale})};
}
const intersects=(a,b)=>a.x<b.x+b.w+5&&a.x+a.w+5>b.x&&a.y<b.y+b.h+5&&a.y+a.h+5>b.y;
function crossesBox(a,b,r){
 let t0=0,t1=1;
 for(const [start,end,min,max] of [[a.x,b.x,r.x-2,r.x+r.w+2],[a.y,b.y,r.y-2,r.y+r.h+2]]){
  const d=end-start;if(Math.abs(d)<1e-9){if(start<min||start>max)return false;continue;}
  const near=(min-start)/d,far=(max-start)/d;t0=Math.max(t0,Math.min(near,far));t1=Math.min(t1,Math.max(near,far));if(t0>t1)return false;
 }return true;
}
const leaderEnd=(a,l)=>({x:Math.max(l.x,Math.min(a.x,l.x+l.w)),y:Math.max(l.y,Math.min(a.y,l.y+l.h))});
// 只移动名称框。连线末端与圆点始终绑定投影后的地点坐标。
export function layoutLabels(points,project,box){
 const used=[],lines=[];
 return points.map(p=>{
  const anchor=project.point(p),w=p.label.length*15+37,h=30,candidates=[];
  for(const dy of [-h/2,-52,28,-90,65,-128,103,-166,141])for(const dx of [18,-w-18])candidates.push({x:anchor.x+dx,y:anchor.y+dy,w,h});
  for(let y=box.y;y+h<=box.y+box.h;y+=36)for(const x of [box.x,box.x+box.w-w])candidates.push({x,y,w,h});
  const valid=candidates.filter(c=>c.x>=box.x&&c.y>=box.y&&c.x+c.w<=box.x+box.w&&c.y+c.h<=box.y+box.h);
  valid.sort((a,b)=>Math.hypot(a.x+a.w/2-anchor.x,a.y+a.h/2-anchor.y)-Math.hypot(b.x+b.w/2-anchor.x,b.y+b.h/2-anchor.y));
  const label=valid.find(c=>!used.some(b=>intersects(c,b)||crossesBox(anchor,leaderEnd(anchor,c),b))&&!lines.some(([a,b])=>crossesBox(a,b,c))&&!points.some(q=>{const z=project.point(q);return z.x>c.x-7&&z.x<c.x+c.w+7&&z.y>c.y-7&&z.y<c.y+c.h+7;}));
  if(!label)throw new Error('标签空间不足，请扩大图幅');
  used.push(label);lines.push([anchor,leaderEnd(anchor,label)]);return {place:p,anchor,label};
 });
}
const txt=(x,y,t,size=16,color='#253b36',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escapeXML(t)}</text>`;
function panel(points,box,{title,sub,selected,labels=points,centralBox=false}={}){
 const inner={x:box.x+85,y:box.y+108,w:box.w-170,h:box.h-230},p=projection(points,inner);
 let s=`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="20" fill="#fbfaf4" stroke="#d9dfd4"/>`;
 s+=txt(box.x+25,box.y+36,title,20,'#234a3b','font-weight="700"')+txt(box.x+25,box.y+62,sub,13,'#647469');
 // 方格只表示绘图纸背景，不代表道路；不画未经核实的地物。
 for(let x=box.x+25;x<box.x+box.w-20;x+=40)s+=`<path d="M ${x} ${box.y+85} V ${box.y+box.h-58}" stroke="#edf0e7"/>`;
 for(let y=box.y+85;y<box.y+box.h-55;y+=40)s+=`<path d="M ${box.x+25} ${y} H ${box.x+box.w-25}" stroke="#edf0e7"/>`;
 if(centralBox){
  const cs=places.filter(v=>centralIds.includes(v.id)).map(v=>p.point(v));
  const x=Math.min(...cs.map(v=>v.x))-10,y=Math.min(...cs.map(v=>v.y))-10,w=Math.max(...cs.map(v=>v.x))-x+10,h=Math.max(...cs.map(v=>v.y))-y+10;
  s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" stroke="#8a9d88" stroke-dasharray="4 4" fill="#e8eedf" fill-opacity=".5"/>`;
  s+=txt(x+w+12,y+h/2,'城区 → 右图展开',14,'#536b4e');
 }
 for(const v of points){const q=p.point(v);s+=`<circle cx="${q.x}" cy="${q.y}" r="${v.id===selected?10:5}" fill="${groups[v.group].color}" opacity="${labels.includes(v)?1:.5}"/>`;}
 const arranged=layoutLabels(labels,p,{x:box.x+22,y:box.y+83,w:box.w-44,h:box.h-145});
 for(const {place:v,anchor:a,label:l} of arranged){
  const active=v.id===selected,c=groups[v.group].color,endX=Math.max(l.x,Math.min(a.x,l.x+l.w)),endY=Math.max(l.y,Math.min(a.y,l.y+l.h));
  s+=`<g data-place="${v.id}" role="button" tabindex="0" aria-label="查看${escapeXML(v.name)}的地理依据" style="cursor:pointer"><title>${escapeXML(v.name+' · '+v.semantics)}</title><path d="M ${a.x} ${a.y} L ${endX} ${endY}" stroke="${c}" stroke-width="1.1" opacity=".6"/><circle cx="${a.x}" cy="${a.y}" r="${active?9:6}" fill="${c}" stroke="#fff" stroke-width="2"/><rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="7" fill="${active?c:'#fffef9'}" stroke="${active?c:'#dfe3da'}"/>${txt(l.x+9,l.y+20,String(v.number).padStart(2,'0'),12,active?'#fff':c)}${txt(l.x+32,l.y+21,v.label,15,active?'#fff':'#253b36')}</g>`;
 }
 const nice=[.1,.2,.5,1,2,5,10,20,50].filter(k=>k*p.scale<=120).at(-1)||.1,len=nice*p.scale,sx=box.x+26,sy=box.y+box.h-28;
 s+=`<path d="M ${sx} ${sy-6} V ${sy} H ${sx+len} V ${sy-6}" fill="none" stroke="#445d50" stroke-width="2"/>`+txt(sx,sy-13,`约 ${nice} km`,12,'#556a5d');
 s+=txt(box.x+box.w-78,box.y+box.h-25,'北 ↑',15,'#445d50');
 return s;
}
export function renderMap(view='overview',selected='bell'){
 if(!views[view])throw new Error('未知视图');
 const points=places.filter(p=>views[view].ids.includes(p.id));
 let body=`<rect width="1280" height="860" fill="#f1f3e9"/>`+txt(36,40,'CITY READING / XI’AN · 001',13,'#67775f','letter-spacing="2"')+txt(36,86,'西安 · 先认识位置，再安排探索',32,'#203f32','font-weight="700"')+txt(36,116,views[view].subtitle,16,'#66745e');
 if(view==='overview'){
  body+=panel(places,{x:28,y:146,w:730,h:600},{title:'01 / 城市与周边',sub:'真实点位等比投影 · 虚线框仅标出右图地点范围',selected,labels:places.filter(p=>!centralIds.includes(p.id)),centralBox:true});
  body+=panel(places.filter(p=>centralIds.includes(p.id)),{x:778,y:146,w:474,h:600},{title:'02 / 中心城区放大',sub:'独立比例尺 · 左图位置关系保持不变',selected});
 }else body+=panel(points,{x:28,y:146,w:1224,h:600},{title:views[view].title,sub:'点是地理参考位置，细线只连接标签与地点',selected});
 body+=txt(36,784,'阅读提示：同一幅图内保留方位和距离比例；不同图幅请分别看比例尺。',16,'#415944');
 body+=txt(36,813,'地点来源：高德公开地点页 · GCJ-02 · 2026-09-14 核对 · 点位通常不是入口',13,'#68755f');
 body+=txt(36,838,'本版为精选地点关系示意，未绘制道路、行政边界或完整景区范围；不提供导航及车程。',13,'#68755f');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="860" viewBox="0 0 1280 860" role="group" aria-labelledby="map-title map-desc" font-family="Microsoft YaHei, PingFang SC, sans-serif"><title id="map-title">${escapeXML(views[view].title+' · 西安旅游理解图')}</title><desc id="map-desc">根据13个高德地点坐标绘制，北方朝上。所有名称细线是标签引线，不是道路。完整坐标和来源可在网页地点列表查看。</desc>${body}</svg>`;
}
export function exportDataset(){return {metadata,places,views,notes:['点位未经实地测量，作为空间理解参考','直线距离是同坐标系的球面近似计算，不是路线距离','完整路线、入口、营业与预约信息待核实']};}
