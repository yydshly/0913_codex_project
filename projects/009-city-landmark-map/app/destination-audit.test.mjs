import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDestinations,distanceMeters} from './destination-audit.mjs';
import {xianCase,xianCandidates} from './xian-validation-data.mjs';
const clone=x=>structuredClone(x);
function fixture(){
 const p=clone(xianCandidates.find(p=>p.id==='station'));
 p.coordinates.push({...p.coordinates[0],originGroup:'independent-test-fixture',url:'https://example.org/synthetic',lon:p.coordinates[0].lon+.0001});
 return p;
}
const config={...xianCase,requiredIds:[]};
const codes=p=>auditDestinations(config,[p]).rows[0].issues.map(i=>i.code);
test('西安覆盖40条记录：24点有坐标，点位一致性与区域证据分开统计',()=>{
 const r=auditDestinations(xianCase,xianCandidates);
 assert.deepEqual(r.counts,{total:40,destinations:35,arrival:4,regions:1,withCoordinates:24,consistent:0});
 assert.deepEqual(r.areaEvidenceCounts,{inside:1,edgeUncertain:1,outside:0});
 assert.deepEqual(r.missingRequired,[]);assert.equal(r.positionEvidenceStatus,'pending');assert.equal(r.productionStatus,'pending');
});
test('同源多个网址不冒充独立证据',()=>{
 const p=fixture();p.coordinates[1].originGroup='amap';assert.ok(codes(p).includes('single-origin'));
});
test('合成输入的独立同类坐标接近时仅放行一致性，不放行成品',()=>{
 const r=auditDestinations(config,[fixture()]);assert.equal(r.positionEvidenceStatus,'consistent');assert.equal(r.productionStatus,'pending');
});
test('西安经纬颠倒、明显错位、异坐标系和不同入口语义均被拦截',()=>{
 for(const [field,value,code] of [['lat',108.962723,'invalid-coordinate'],['lon',109.9,'coordinate-conflict'],['crs','WGS-84','mixed-crs'],['pointRole','south-gate','semantic-conflict'],['placeId','north-station','identity-mismatch']]){
  const p=fixture();p.coordinates[1][field]=value;assert.ok(codes(p).includes(code),code);
 }
});
test('删去用户必选地点、重复ID与错误国家不可通过',()=>{
 assert.ok(auditDestinations(xianCase,xianCandidates.filter(p=>p.id!=='yuanjia')).missingRequired.includes('yuanjia'));
 const p=fixture();p.country='US';assert.ok(codes(p).includes('country-mismatch'));
 assert.ok(auditDestinations(config,[p,p]).rows[0].issues.some(i=>i.code==='duplicate-id'));
});
test('白鹿原保留地域，不编造入口；球面距离支持跨日期变更线',()=>{
 const r=auditDestinations(xianCase,xianCandidates);assert.equal(r.rows.find(p=>p.id==='bailuyuan-region').status,'region');
 assert.ok(Math.abs(distanceMeters({lat:0,lon:179.9},{lat:0,lon:-179.9})-22239)<5);
});
