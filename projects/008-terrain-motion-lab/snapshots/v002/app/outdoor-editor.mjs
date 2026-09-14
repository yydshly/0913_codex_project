import {environments} from './environment-core.mjs';
import {makeOutdoor,inspectOutdoorLayout,clamp} from './outdoor-core.mjs';
import {outdoorDefaults,outdoorLimits,outdoorPresets,validateOutdoorRecipe,encodeOutdoorRecipe,decodeOutdoorRecipe} from './outdoor-recipe.mjs';

const fields=[['campX','营地 · 西 ↔ 东'],['campZ','营地 · 北 ↔ 南'],['summitX','山顶 · 西 ↔ 东'],['summitZ','山顶 · 北 ↔ 南'],['ascent','登山爬升'],['roadBend','车道弯曲偏移']];
const storageKey='songlan-snapshot-v002-layout';
export function mountOutdoorEditor({getLand,getTrees,apply}){
 const $=id=>document.getElementById(id),canvas=$('layout-plan'),ctx=canvas.getContext('2d');
 let draft={...getLand().recipe},preview=getLand(),report=inspectOutdoorLayout(preview),busy=false,lastChange=null,drag=null;
 $('layout-fields').innerHTML=fields.map(([key,label])=>`<label for="layout-${key}"><span>${label}<output id="layout-${key}-value"></output></span><input id="layout-${key}" data-layout-field="${key}" type="range" min="${outdoorLimits[key][0]}" max="${outdoorLimits[key][1]}" step="1" value="${draft[key]}"></label>`).join('');
 const to=p=>[28+(p.x+31)*7.3,22+(p.z+28)*4.6],from=(x,y)=>({x:(x-28)/7.3-31,z:(y-22)/4.6-28});
 function drawRoute(route,color,dashed=false){ctx.strokeStyle=color;ctx.lineWidth=dashed?1.5:3;ctx.setLineDash(dashed?[5,5]:[]);ctx.beginPath();for(let i=0;i<=120;i++){const [x,z]=to(route.sample(i/120));i?ctx.lineTo(x,z):ctx.moveTo(x,z);}ctx.stroke();ctx.setLineDash([]);}
 function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#e8eee2';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#d4dfcb';ctx.lineWidth=1;
  for(let x=-30;x<=30;x+=5){const [px]=to({x,z:0});ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,canvas.height);ctx.stroke();}for(let z=-25;z<=25;z+=5){const [,py]=to({x:0,z});ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(canvas.width,py);ctx.stroke();}
  const current=getLand();for(const route of [current.drive,current.trail])drawRoute(route,'#849485',true);
  drawRoute(preview.drive,'#b57432');drawRoute(preview.trail,'#30867d');drawRoute(preview.arrival,'#849477');drawRoute(preview.departure,'#849477');
  for(const [point,label,color,radius] of [[preview.camp,'营地','#486b4b',6.5],[preview.summit,'山顶 +'+draft.ascent+'m','#9b763a',5.3]]){const [x,y]=to(point);ctx.fillStyle=color+'22';ctx.beginPath();ctx.ellipse(x,y,radius*7.3,radius*4.6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.font='bold 13px sans-serif';ctx.fillText(label,x+14,y-9);}
  const [px,py]=to(preview.drive.sample(1));ctx.fillStyle='#354e3e';ctx.fillRect(px-5,py-5,10,10);ctx.font='12px sans-serif';ctx.fillText('停车',px-32,py+22);ctx.fillText('北 ↑',18,22);ctx.fillText('格线间距 5m · 场景平面示意',18,canvas.height-12);
 }
 function update(){
  preview=makeOutdoor(draft);report=inspectOutdoorLayout(preview);const current=getLand(),currentReport=inspectOutdoorLayout(current),dirty=JSON.stringify(draft)!==JSON.stringify(current.recipe);
  const baseline=!dirty&&lastChange?lastChange.before:currentReport;$('layout-compare-label').textContent=!dirty&&lastChange?'上次生成前 → 当前场景':'当前场景 → 待生成预览';
  for(const [key] of fields){$('layout-'+key).value=draft[key];$('layout-'+key+'-value').textContent=draft[key]+' m';}
  $('layout-draft-state').textContent=dirty?'待生成 · 下面是新布局预览':'当前布局 · 与三维场景一致';
  $('layout-comparison').innerHTML=[['自驾长度',baseline.driveLength,report.driveLength,'m'],['步道长度',baseline.trailLength,report.trailLength,'m'],['登山爬升',baseline.ascent,report.ascent,'m']].map(([label,a,b,unit])=>`<div><span>${label}</span><strong>${a.toFixed(1)} <i>→</i> ${b.toFixed(1)} ${unit}</strong></div>`).join('');
  $('layout-comparison').insertAdjacentHTML('beforeend',`<div><span>松树数量</span><strong>${!dirty&&lastChange?lastChange.before.trees:getTrees()} <i>→</i> ${dirty?'生成时计算':getTrees()}</strong></div>`);
  $('layout-rules').textContent=report.valid?'车行与步行分离 · 最近间距 '+report.separation.toFixed(1)+'m；'+(dirty?'生成时会更新营位整平、植物避让和观看朝向。':'营位、植物避让与观看位置已按当前方案布置。'):report.errors.join('；');
  $('layout-apply').disabled=busy||!report.valid||!dirty;
  for(const button of document.querySelectorAll('[data-layout-preset]'))button.setAttribute('aria-pressed',String(fields.every(([key])=>outdoorPresets[button.dataset.layoutPreset][key]===draft[key])));
  $('layout-environment').value=draft.environment;
  $('environment-summary').textContent=environments[draft.environment].summary+(dirty?'；生成后应用。':'；已应用。');
  draw();
 }
 function message(text,error=false){$('layout-status').textContent=text;$('layout-status').dataset.error=String(error);}
 function setDraft(input){draft=validateOutdoorRecipe(input);update();return state();}
 function state(){return{busy,draft:{...draft},applied:{...getLand().recipe},dirty:JSON.stringify(draft)!==JSON.stringify(getLand().recipe),report,lastChange};}
 async function generate(){
  if(busy)throw Error('正在生成，请稍候');const before={...inspectOutdoorLayout(getLand()),trees:getTrees()};busy=true;$('layout-workbench').setAttribute('aria-busy','true');for(const el of $('layout-workbench').querySelectorAll('button,input,select'))el.disabled=true;message('正在更新山坡、路线、营地、人物与树林…');
  try{const result=await apply(draft);lastChange={before,after:result};message('已生成：车道 '+before.driveLength.toFixed(1)+' → '+result.driveLength.toFixed(1)+'m，步道 '+before.trailLength.toFixed(1)+' → '+result.trailLength.toFixed(1)+'m，松树 '+before.trees+' → '+result.trees+' 棵。可切换四段行程检查新布局。');$('stage').scrollIntoView({behavior:'smooth',block:'center'});}
  finally{busy=false;$('layout-workbench').setAttribute('aria-busy','false');for(const el of $('layout-workbench').querySelectorAll('button,input,select'))el.disabled=false;update();}
  return state();
 }
 async function operate(p){
  if(busy)throw Error('正在生成，请稍候');
  if(p.action==='preview'){setDraft({...draft,...p.recipe});message('预览已调整，点击“生成并查看”更新三维场景。');}
  else if(p.action==='preset'){if(!Object.hasOwn(outdoorPresets,p.preset))throw Error('未知布局');setDraft({...outdoorPresets[p.preset],environment:draft.environment});message('已选布局，点击“生成并查看”。');}
  else if(p.action==='apply'){if(p.recipe)setDraft({...draft,...p.recipe});await generate();}
  else if(p.action==='save'){try{localStorage.setItem(storageKey,encodeOutdoorRecipe(getLand().recipe));}catch{throw Error('浏览器无法保存，请使用“下载方案”');}message('已保存当前三维场景方案到本机；未生成的预览不会覆盖它。');}
  else if(p.action==='restore'){let text;try{text=localStorage.getItem(storageKey);}catch{throw Error('浏览器无法读取本机方案');}if(!text)throw Error('还没有保存的方案');setDraft(decodeOutdoorRecipe(text));await generate();}
  else if(p.action==='reset'){setDraft(outdoorDefaults);await generate();}
  else throw Error('未知布局操作');return state();
 }
 $('layout-environment').addEventListener('change',e=>{if(busy)return;setDraft({...draft,environment:e.target.value});message('自然环境已选，点击“生成并查看”。路线坐标保持当前预览。');});
 const handle=fn=>async()=>{try{await fn();}catch(error){message(error.message,true);}};
 for(const [key] of fields)$('layout-'+key).addEventListener('input',e=>{if(busy)return;draft={...draft,[key]:Number(e.target.value)};update();});
 for(const button of document.querySelectorAll('[data-layout-preset]'))button.addEventListener('click',handle(()=>operate({action:'preset',preset:button.dataset.layoutPreset})));
 for(const [id,action] of [['layout-apply','apply'],['layout-save','save'],['layout-restore','restore'],['layout-reset','reset']])$(id).addEventListener('click',handle(()=>operate({action})));
 $('layout-download').addEventListener('click',handle(()=>{const blob=new Blob([encodeOutdoorRecipe(getLand().recipe)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='songlan-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('已下载当前场景方案，可在这里重新导入。');}));
 $('layout-import').addEventListener('change',handle(async()=>{const file=$('layout-import').files[0];if(!file)return;if(file.size>16384)throw Error('方案文件不能超过 16 KB');setDraft(decodeOutdoorRecipe(await file.text()));message('已读取方案预览；点击“生成并查看”应用。');$('layout-import').value='';}));
 function pointer(e){const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height];}
 canvas.addEventListener('pointerdown',e=>{if(busy)return;const [x,y]=pointer(e);for(const key of ['camp','summit']){const [px,py]=to(preview[key]);if(Math.hypot(x-px,y-py)<20){drag=key;canvas.setPointerCapture(e.pointerId);break;}}});
 canvas.addEventListener('pointermove',e=>{if(!drag||busy)return;const p=from(...pointer(e)),x=drag+'X',z=drag+'Z';draft={...draft,[x]:Math.round(clamp(p.x,...outdoorLimits[x])),[z]:Math.round(clamp(p.z,...outdoorLimits[z]))};update();});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>{drag=null;});
 update();return{state,operate};
}
