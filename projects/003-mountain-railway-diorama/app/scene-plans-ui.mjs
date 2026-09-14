import {validatePlan,parsePlan,readLibrary,savePlan} from './scene-plans.mjs';
export function mountPlans({capture,apply,lock}){
 const $=s=>document.querySelector(s);let library=[],storage,storageOK=true,baseline=capture('V17 原始基准'),draft=null;
 const report=t=>$('#plan-status').textContent=t;
 try{storage=window.localStorage;library=readLibrary(storage)}catch{storageOK=false;report('本地方案库无法读取。可导入、导出文件；为保留原数据，暂停写入。')}
 function list(){const select=$('#plan-list');select.replaceChildren();const add=(value,name)=>{const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o)};add('base','V17 原始基准');library.forEach((p,i)=>add(String(i),(i+1)+' · '+p.name));$('#plan-save').disabled=!storageOK;}
 const selected=()=>$('#plan-list').value==='base'?captureBase:library[Number($('#plan-list').value)];
 const captureBase=structuredClone(baseline);
 const named=()=>capture($('#plan-name').value.trim()||'未命名方案');
 function act(fn){try{fn()}catch(e){report(e.message||'操作未完成，请导出备份后重试。')}}
 $('#plan-save').onclick=()=>act(()=>{const p=validatePlan(named());library=savePlan(storage,readLibrary(storage),p);list();$('#plan-list').value=String(library.length-1);report('已保存「'+p.name+'」。刷新后可从列表恢复。')});
 $('#plan-load').onclick=()=>act(()=>{const p=selected();apply(p);$('#plan-name').value=p.name;report('已恢复「'+p.name+'」及全部构图、环境、水流与镜头设置。')});
 $('#plan-pin').onclick=()=>act(()=>{baseline=validatePlan(named());report('已将当前画面设为比较基准。修改后点“查看基准”比较。')});
 $('#plan-compare').onclick=()=>act(()=>{
  if(!draft){const current=validatePlan(named()),p=structuredClone(baseline);p.camera=current.camera;p.observation={...p.observation,view:'free',auto:false,paused:true};apply(p,{sameCamera:true});draft=current;lock(true);$('#plan-compare').textContent='返回修改';$('#plan-compare').setAttribute('aria-pressed','true');report('正在查看「'+baseline.name+'」基准：沿用修改时镜头，暂停动画；返回后继续编辑。')}
  else{const p=draft;apply(p);draft=null;lock(false);$('#plan-compare').textContent='查看基准';$('#plan-compare').setAttribute('aria-pressed','false');report('已回到修改方案。比较不改变保存的方案；动画时刻不保证相同。')}
 });
 $('#plan-export').onclick=()=>act(()=>{const p=validatePlan(named()),json=JSON.stringify(p,null,2);$('#plan-json').value=json;$('#plan-transfer').open=true;const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=p.name.replace(/[^\p{L}\p{N}_-]/gu,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);report('已生成方案文件。若下载受限，可复制下方文件内容。')});
 function loadText(text){if(draft)throw new Error('请先返回修改，再导入方案。');const p=parsePlan(text);apply(p);$('#plan-name').value=p.name;$('#plan-json').value=JSON.stringify(p,null,2);report('已导入「'+p.name+'」。点“另存方案”可保留在此浏览器。')}
 $('#plan-import-text').onclick=()=>act(()=>loadText($('#plan-json').value));
 $('#plan-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>262144)throw new Error('文件过大，最大支持 256 KB。');loadText(await f.text())}catch(error){report(error.message)}finally{e.target.value=''}};
 list();return {comparing:()=>!!draft};
}
