import {places,groups} from './xian-data.mjs';
import {atlasPlaces,zones} from './atlas-data.mjs';
const $=id=>document.getElementById(id);
const scenic=document.body.dataset.art==='scenic',collection=scenic?atlasPlaces:places;
for(const id of scenic?['bell','pagoda','garden','daming','hanyang','huaqing','terracotta','cuihua']:['station','bell','drum','south-gate','pagoda','garden']){const p=collection.find(v=>v.id===id);const b=document.createElement('button');b.type='button';b.dataset.place=p.id;b.textContent=p.label;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(p.id));$('place-list').append(b);}
function select(id){const p=collection.find(v=>v.id===id);if(!p)return;for(const b of $('place-list').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.place===id));$('place-category').textContent=scenic?zones[p.zone].name:groups[p.group].name;$('place-title').textContent=p.name;$('place-description').textContent=scenic?p.description:`${p.note} ${p.semantics}。`;$('place-link').href=p.source;}
function zoom(detail){const stage=$('art-stage');stage.classList.toggle('zoomed',detail);$('fit').setAttribute('aria-pressed',String(!detail));$('detail').setAttribute('aria-pressed',String(detail));if(!detail)stage.scrollTo({top:0,left:0});else requestAnimationFrame(()=>stage.scrollTo({top:0,left:Math.max(0,(stage.scrollWidth-stage.clientWidth)*.6)}));$('art-status').textContent=detail?'已放大，可滚动画面查看建筑细节。':'';}
$('fit').addEventListener('click',()=>zoom(false));$('detail').addEventListener('click',()=>zoom(true));$('art-image').addEventListener('error',()=>{$('art-status').textContent='插画加载失败，请刷新页面或通过“保存原图”查看文件。';});
select(scenic?'bell':'station');
