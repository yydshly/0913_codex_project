import {studyPlaces} from './research-data.mjs';
import {createPlan,renderPlan} from './position-study.mjs';
import {diagnosticAssets,scenarioCommands,composeAndAudit,verifyOutputBytes} from './controlled-compositor.mjs';
import {loadScenicAssets} from './scenic-assets.mjs';
import {createScenicPlan,scenicCommands,renderScenicPlan} from './scenic-layout.mjs';
import {encodeRgbaPng} from './png-export.mjs';
const $=id=>document.getElementById(id);
let plan=createScenicPlan(studyPlaces),svg='',current=null,diagnostic=null,scenic=null,revision=0,canvas=null;
function save(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function gallery(assets){
 $('sprite-gallery').replaceChildren();
 for(const a of assets){const card=document.createElement('article'),c=document.createElement('canvas'),h=document.createElement('h3'),p=document.createElement('p'),link=document.createElement('a');c.width=a.width;c.height=a.height;c.setAttribute('aria-label',a.label+'插画候选');c.getContext('2d').putImageData(new ImageData(a.rgba,a.width,a.height),0,0);h.textContent=a.label;p.textContent=a.description+' · 外形待核实';link.href=a.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='景区资料 ↗';card.append(c,h,p,link);$('sprite-gallery').append(card);}
}
async function run(){
 const rev=++revision;current=null;$('save-png').disabled=true;$('save-auto-report').disabled=true;$('auto-status').textContent='正在读取素材、合成并扫描像素…';
 try{
  const useScenic=$('asset-mode').value==='scenic';
  const nextPlan=useScenic?createScenicPlan(studyPlaces):createPlan(studyPlaces);
  let assets,base;
  if(useScenic){scenic||=await loadScenicAssets('../assets/xian-scenic-sprites-v1.json',nextPlan);assets=scenic.assets;base=scenicCommands(nextPlan);}
  else {diagnostic||=await diagnosticAssets(nextPlan);assets=diagnostic;}
  const result=await composeAndAudit(nextPlan,assets,scenarioCommands(nextPlan,$('auto-scenario').value,base));
  if(rev!==revision)return;
  plan=nextPlan;current=result;svg=useScenic?renderScenicPlan(plan):renderPlan(plan);$('study-plan').innerHTML=svg;
  canvas=document.createElement('canvas');canvas.width=plan.frame.width;canvas.height=plan.frame.height;canvas.setAttribute('aria-label',useScenic?'实际合成景区素材图层':'实际合成测试色块');$('study-plan').append(canvas);canvas.getContext('2d').putImageData(new ImageData(result.rgba,canvas.width,canvas.height),0,0);
  if(scenic&& !$('sprite-gallery').children.length)gallery(scenic.assets);
  $('study-status').textContent=useScenic?'已读取8处生成素材，来源图与分格透明边界已检查。主图与城区图分别保留坐标关系；建筑外形和统一画风尚未通过最终验收。':'使用测试色块，仅验证算法；原始底稿仍有4组密集点。';
  const r=result.report,pass=r.positionStatus==='passed';$('auto-status').closest('section').dataset.state=r.positionStatus;
  $('auto-status').textContent=pass?'位置自动检查通过 · '+r.observedCount+' / '+r.expectedCount+' 处可见':'位置自动检查未通过 · '+r.issues.length+' 项问题，已阻止景观图层导出';
  $('auto-issues').replaceChildren();
  for(const i of r.issues.slice(0,6)){const li=document.createElement('li'),label=i.id.split(' / ').map(id=>plan.places.find(p=>p.id===id)?.label||id).join(' / ');li.textContent=label+'：'+i.detail.replace('x方向','东西方向').replace('y方向','南北方向');$('auto-issues').append(li);}
  if(r.issues.length>6){const li=document.createElement('li');li.textContent='另有 '+(r.issues.length-6)+' 项关联问题，可保存报告查看。';$('auto-issues').append(li);}
  $('save-png').disabled=!pass;$('save-auto-report').disabled=false;
 }catch(e){if(rev!==revision)return;$('auto-status').textContent='无法完成：'+e.message;$('auto-status').closest('section').dataset.state='failed';}
}
$('auto-scenario').addEventListener('change',run);$('asset-mode').addEventListener('change',run);
$('save-plan').onclick=()=>{if(svg)save(svg,'image/svg+xml','xian-layout-research.svg');};
$('save-manifest').onclick=()=>save(JSON.stringify(plan,null,2),'application/json','xian-position-plan.json');
$('save-auto-report').onclick=()=>{if(current)save(JSON.stringify(current.report,null,2),'application/json','xian-auto-position-report.json');};
$('save-png').onclick=async()=>{
 const result=current,rev=revision;if(!result||result.report.positionStatus!=='passed')return;
 if(!await verifyOutputBytes(result.rgba,result.report)){$('auto-status').textContent='合成像素与报告不一致，已阻止导出';$('save-png').disabled=true;return;}
 try{const png=await encodeRgbaPng(result.rgba,result.report.frame.width,result.report.frame.height);if(rev!==revision)return;save(png,'image/png','xian-scenic-composition-layer.png');}catch(e){$('auto-status').textContent='PNG 导出失败：'+e.message;}
};
for(const p of studyPlaces){const tr=document.createElement('tr');for(const value of [p.name,p.coordinateSystem,p.semantics]){const td=document.createElement('td');td.textContent=value;tr.append(td);}const td=document.createElement('td'),a=document.createElement('a');a.href=p.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='坐标来源 ↗';td.append(a);tr.append(td);$('study-sources').append(tr);}
await run();
