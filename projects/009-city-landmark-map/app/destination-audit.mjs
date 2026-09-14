// Evidence checks are provider-independent. They establish consistency, not source truth.
import {checkAreaEvidence} from './area-audit.mjs';
const crsSet=new Set(['WGS-84','GCJ-02']);
const webURL=s=>{try{return ['http:','https:'].includes(new URL(s).protocol);}catch{return false;}};
export function distanceMeters(a,b){
 const rad=Math.PI/180,dl=(b.lat-a.lat)*rad,dn=(b.lon-a.lon)*rad;
 const h=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dn/2)**2;
 return 12742000*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
export function auditDestinations(config,places){
 if(!Number.isFinite(config.agreementMeters)||config.agreementMeters<=0)throw new Error('需要明确的坐标一致性阈值');
 const counts=new Map();for(const p of places)counts.set(p.id,(counts.get(p.id)||0)+1);
 const rows=places.map(p=>{
  const issues=[],add=(code,detail)=>issues.push({code,detail});
  if(!p.id||counts.get(p.id)!==1)add('duplicate-id','地点编号缺失或重复');
  if(!p.name||!p.reason||!p.evidence?.some(e=>webURL(e.url)&&e.claim&&e.originGroup&&e.checkedAt))add('content-evidence','缺少名称、收录理由或可追溯内容证据');
  if(p.country!==config.country)add('country-mismatch','地点国家与本轮范围不一致');
  if(p.kind==='region')return {id:p.id,name:p.name,status:'region',issues,coordinateCount:0,positionReady:false};
  const samples=p.coordinates||[];
  if(!samples.length)add('missing-coordinate','尚未取得具名地点坐标');
  for(const s of samples){
   if(!Number.isFinite(s.lon)||!Number.isFinite(s.lat)||Math.abs(s.lon)>180||Math.abs(s.lat)>90)add('invalid-coordinate','经纬度缺失、越界或次序错误');
   if(!crsSet.has(s.crs))add('unknown-crs','坐标体系未明确');
   if(s.placeId!==p.id||!s.providerPlaceId)add('identity-mismatch','坐标没有绑定该地点的提供方编号');
   if(!s.pointRole||s.pointRole==='unresolved')add('point-role','尚未分清入口、馆区、地标或地域');
   if(!s.originGroup||!webURL(s.url)||!s.checkedAt)add('coordinate-provenance','缺少坐标来源或采集日期');
  }
  const groups=new Set(samples.map(s=>s.originGroup).filter(Boolean));
  if(samples.length&&groups.size<2)add('single-origin','只有一个坐标来源体系，尚未独立交叉核对');
  if(new Set(samples.map(s=>s.crs)).size>1)add('mixed-crs','不同坐标系不可直接比较，需保留转换依据后再核对');
  if(new Set(samples.map(s=>s.pointRole)).size>1)add('semantic-conflict','来源指向不同类型参考点，不能直接平均坐标');
  let maxDifferenceMeters=null;
  if(samples.length>1&&!issues.some(i=>['invalid-coordinate','unknown-crs','mixed-crs','semantic-conflict'].includes(i.code))){
   maxDifferenceMeters=0;
   for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++)maxDifferenceMeters=Math.max(maxDifferenceMeters,distanceMeters(samples[i],samples[j]));
   if(maxDifferenceMeters>config.agreementMeters)add('coordinate-conflict','同类参考点坐标差异超过本轮阈值');
  }
  const original=p.spatialEvidence?.point?.original;
  const matchesOriginal=original&&samples.some(s=>['lon','lat','crs','providerPlaceId','placeId','url'].every(k=>s[k]===original[k]));
  const areaCheck=p.spatialEvidence&&!matchesOriginal?{status:'pending',detail:'当前坐标与边界检查的原始输入不一致，需重新计算'}:checkAreaEvidence(p.id,p.spatialEvidence);
  return {id:p.id,name:p.name,status:issues.length?'pending':'consistent',issues,coordinateCount:samples.length,maxDifferenceMeters,positionReady:!issues.length,areaCheck};
 });
 const missingRequired=config.requiredIds.filter(id=>!places.some(p=>p.id===id));
 const anchor=places.find(p=>p.id===config.anchorId),anchorReady=rows.find(r=>r.id===config.anchorId)?.positionReady===true;
 return {schemaVersion:1,caseId:config.id,anchorId:config.anchorId,anchorName:anchor?.name||null,agreementMeters:config.agreementMeters,
  counts:{total:rows.length,destinations:places.filter(p=>p.kind==='destination').length,arrival:places.filter(p=>p.kind==='arrival').length,regions:places.filter(p=>p.kind==='region').length,withCoordinates:rows.filter(r=>r.coordinateCount>0).length,consistent:rows.filter(r=>r.positionReady).length},
  areaEvidenceCounts:{inside:rows.filter(r=>r.areaCheck?.status==='inside').length,edgeUncertain:rows.filter(r=>r.areaCheck?.status==='edge-uncertain').length,outside:rows.filter(r=>r.areaCheck?.status==='outside').length},
  missingRequired,anchorReady,contentCoverage:missingRequired.length?'missing-required':'required-listed',
  positionEvidenceStatus:anchorReady&&!missingRequired.length&&rows.every(r=>(r.status==='region'&&!r.issues.length)||r.positionReady)?'consistent':'pending',
  productionStatus:'pending',rows,
  boundary:'来源分组及地点身份需有采集证据支撑；数值一致不证明上游真实。地域无单点坐标；未检查当前开放、全城穷尽、口碑排序、素材外形或成图。'};
}
