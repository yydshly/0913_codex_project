import {auditDestinations} from './destination-audit.mjs';
import {xianCase,xianCandidates} from './xian-validation-data.mjs';
const $=id=>document.getElementById(id),report=auditDestinations(xianCase,xianCandidates),c=report.counts;
$('destination-summary').textContent=`已归集 ${c.destinations} 个目的地、${c.arrival} 个抵达参照和 ${c.regions} 个地域；${c.withCoordinates} 处已有坐标，${c.consistent} 处完成独立坐标证据一致性检查。`;
const missing=report.rows.filter(r=>r.status!=='region'&&!r.coordinateCount).length;
$('destination-next').textContent=`本轮补入动物园、袁家村、白鹿仓东门和影视城坐标。${report.areaEvidenceCounts.inside}处获得另一来源景区边界的区域支持，${report.areaEvidenceCounts.edgeUncertain}处靠近边界暂不判断。尚有${missing}个目的地缺坐标；朱雀已找到粗范围资料。区域支持不等于入口精度或成品验收。`;
function render(){
 const filter=$('destination-filter').value;$('destination-rows').replaceChildren();
 for(const p of xianCandidates){
  const row=report.rows.find(r=>r.id===p.id);
  if(filter==='required'&&!xianCase.requiredIds.includes(p.id)||filter==='missing'&&(row.coordinateCount||p.kind==='region')||filter==='single'&&!row.issues.some(i=>i.code==='single-origin'))continue;
  const tr=document.createElement('tr');
  const positionText=row.status==='region'?'地域，不设唯一入口':p.spatialEvidence?row.areaCheck.detail:row.issues.length?row.issues.map(i=>i.detail).join('；'):'独立来源坐标一致（不代表最终准确）';
  const values=[p.name+' · '+p.category,p.reason,positionText+(p.id==='bailucang'?'；当前用具名东门作参照':'')+(p.regionalEvidence?'；已有粗范围资料，未设落点':'')];
  for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}
  const td=document.createElement('td');
  for(const [label,url] of [['资料',p.evidence[0].url],['坐标',p.coordinates?.[0]?.url],['边界',p.spatialEvidence?.area.source],['范围',p.regionalEvidence?.source]]){if(!url)continue;const a=document.createElement('a');a.href=url;a.textContent=label+' ↗ ';a.target='_blank';a.rel='noopener noreferrer';td.append(a);}
  tr.append(td);$('destination-rows').append(tr);
 }
}
$('destination-filter').addEventListener('change',render);
$('save-destinations').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({config:xianCase,places:xianCandidates,report},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='xian-destination-validation-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
