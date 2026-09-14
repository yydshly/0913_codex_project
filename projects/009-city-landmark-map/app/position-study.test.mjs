import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,validateArtwork,observationTemplate} from './position-study.mjs';
import {studyPlaces} from './research-data.mjs';
const plan=createPlan(studyPlaces);
// 以下观察是合成测试数据，不是实际成图验收证据。
const synthetic=()=>({kind:'artwork-observation',imageSha256:'a'.repeat(64),...plan.frame,places:plan.places.map(p=>({id:p.id,x:p.x,y:p.y,status:'observed',identity:'verified',reference:p.source,reviewNote:'仅测试夹具'}))});
test('同源坐标保留明确的东西与南北顺序',()=>{
 const p=id=>plan.places.find(p=>p.id===id);
 assert.ok(p('louguan').x<p('bell').x&&p('louguan').y>p('bell').y);
 assert.ok(p('terracotta').x>p('huaqing').x&&p('terracotta').y<p('huaqing').y);
 assert.ok(p('cuihua').y>p('pagoda').y);
 assert.ok(plan.crowded.length>0);
});
test('混用坐标系、坐标缺失与来源缺失均拒绝',()=>{
 for(const change of [{coordinateSystem:'WGS-84'},{lat:NaN},{source:null}]){
  assert.throws(()=>createPlan(studyPlaces.map((p,i)=>i? p:{...p,...change})));
 }
});
test('空观察模板只能待验收，底稿不可以冒充成图观察',()=>{
 assert.equal(validateArtwork(plan,observationTemplate(plan)).status,'pending');
 assert.equal(validateArtwork(plan,plan).status,'failed');
});
test('合成正确观察可以通过；身份未核实不能通过',()=>{
 const o=synthetic();assert.equal(validateArtwork(plan,o).status,'passed');
 o.places[0].identity='unreviewed';assert.equal(validateArtwork(plan,o).status,'pending');
});
test('交换古楼观与兵马俑景观即失败，即使标签留在原地',()=>{
 const o=synthetic(),a=o.places.find(p=>p.id==='louguan'),b=o.places.find(p=>p.id==='terracotta');
 a.labelPosition={x:a.x,y:a.y};b.labelPosition={x:b.x,y:b.y};
 [a.x,b.x]=[b.x,a.x];[a.y,b.y]=[b.y,a.y];
 const r=validateArtwork(plan,o);assert.equal(r.status,'failed');
 assert.ok(r.errors.some(e=>e.includes('相对方位倒置')));
});
test('重复、漏画、未知地点、错误画布均不能通过',()=>{
 for(const mutate of [o=>o.places.push(o.places[0]),o=>o.places[0].status='missing',o=>o.places.push({id:'invented'}),o=>o.width=100]){
  const o=synthetic();mutate(o);assert.equal(validateArtwork(plan,o).status,'failed');
 }
});
