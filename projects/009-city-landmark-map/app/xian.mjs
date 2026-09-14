import {places,groups,views,metadata} from './xian-data.mjs';
import {renderMap,distanceKm,exportDataset} from './xian-geo.mjs';
const $=id=>document.getElementById(id);
let selected='bell',view='overview',comparison='terracotta';
const groupList=$('point-groups');
for(const [key,group] of Object.entries(groups)){
 const section=document.createElement('section');section.className='point-group';
 const h=document.createElement('h3');h.textContent=group.name;h.style.color=group.color;section.append(h);
 for(const p of places.filter(p=>p.group===key)){
  const b=document.createElement('button');b.type='button';b.className='place-button';b.dataset.place=p.id;
  const n=document.createElement('span');n.textContent=String(p.number).padStart(2,'0');b.append(n,document.createTextNode(p.label));section.append(b);
 }
 groupList.append(section);
}
for(const p of places){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('compare').append(o);}
$('compare').value=comparison;
function updateDistance(){
 const p=places.find(v=>v.id===selected),other=places.find(v=>v.id===comparison),d=distanceKm(p,other);
 $('distance-value').textContent=selected===comparison?'同一地点':`约 ${d.toFixed(1)}`;
 $('distance-unit').textContent=selected===comparison?'':'km';
 $('distance-description').textContent=`从${p.label}到${other.label}的参考点直线距离。未查询可通行路线及所需时间。`;
}
function render(){
 $('map').innerHTML=renderMap(view,selected);
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
 for(const b of document.querySelectorAll('.place-button'))b.setAttribute('aria-pressed',String(b.dataset.place===selected));
 const p=places.find(v=>v.id===selected);
 $('place-name').textContent=p.name;$('place-note').textContent=p.note;$('place-group').textContent=groups[p.group].name;
 $('longitude').textContent=p.lon.toFixed(6);$('latitude').textContent=p.lat.toFixed(6);$('semantics').textContent=p.semantics;
 $('source').href=p.source;$('source-date').textContent=`坐标：${metadata.coordinateSystem} · 核对：${p.checkedAt}`;
 $('view-caption').textContent=view==='overview'?'两幅图比例不同，请分别看比例尺。':`本图展示 ${views[view].ids.length} 个地点；可从下方列表切换。`;
 updateDistance();
}
function pick(id){
 if(!places.some(p=>p.id===id))return;
 selected=id;if(!views[view].ids.includes(id))view='overview';render();
 $('status').textContent=`已选择${places.find(p=>p.id===id).name}，右侧可查看坐标与来源。`;
}
document.addEventListener('click',e=>{const p=e.target.closest('[data-place]');if(p)pick(p.dataset.place);const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;if(!views[view].ids.includes(selected))selected=views[view].ids[0];render();}});
$('map').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const p=e.target.closest('[data-place]');if(p){e.preventDefault();const id=p.dataset.place;pick(id);$('map').querySelector(`[data-place="${id}"]`)?.focus();}}});
$('compare').addEventListener('change',e=>{comparison=e.target.value;updateDistance();});
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-svg').addEventListener('click',()=>{download(renderMap(view,selected),'image/svg+xml;charset=utf-8',`西安旅游理解图-${view}.svg`);$('status').textContent='已准备图件下载，图内含来源、日期与比例说明。';});
$('export-data').addEventListener('click',()=>{download(JSON.stringify(exportDataset(),null,2),'application/json;charset=utf-8','西安地点依据-2026-09-14.json');$('status').textContent='已准备地点依据下载，包含坐标、来源链接与核对日期。';});
render();
