import test from 'node:test';
import assert from 'node:assert/strict';
import {studyPlaces} from './research-data.mjs';
import {createPlan} from './position-study.mjs';
import {diagnosticAssets,scenarioCommands,composeAndAudit,verifyOutputBytes} from './controlled-compositor.mjs';
const plan=createPlan(studyPlaces),assets=await diagnosticAssets(plan);
test('无需人工观察，正常合成自动检查8点，但不放行真实景观',async()=>{
 const r=await composeAndAudit(plan,assets,scenarioCommands(plan));
 assert.equal(r.report.positionStatus,'passed');assert.equal(r.report.observedCount,8);
 assert.equal(r.report.productionStatus,'pending');assert.equal(r.report.diagnostic,true);
 assert.ok(await verifyOutputBytes(r.rgba,r.report));
});
test('西南与东北素材互换从最终可见像素发现',async()=>{
 const {report}=await composeAndAudit(plan,assets,scenarioCommands(plan,'swap'));
 assert.equal(report.positionStatus,'failed');assert.ok(report.issues.some(i=>i.code==='direction-reversed'));
});
test('漏画与实际遮挡可自动发现',async()=>{
 for(const [scenario,code]of [['missing','missing-place'],['occlusion','invisible-place']]){
 const {report}=await composeAndAudit(plan,assets,scenarioCommands(plan,scenario));
 assert.equal(report.positionStatus,'failed');assert.ok(report.issues.some(i=>i.code===code));}
});
test('位置不变但素材编号串用会失败',async()=>{
 const {report}=await composeAndAudit(plan,assets,scenarioCommands(plan,'asset'));
 assert.ok(report.issues.some(i=>i.code==='identity-binding'));
});
test('重复绘制、边缘裁切不能通过',async()=>{
 const cmds=scenarioCommands(plan);cmds.push({...cmds[0]});
 assert.equal((await composeAndAudit(plan,assets,cmds)).report.positionStatus,'failed');
 cmds.pop();cmds[0].x=-8;
 assert.ok((await composeAndAudit(plan,assets,cmds)).report.issues.some(i=>i.code==='occluded-or-clipped'));
});
test('素材被改动和输出像素被改动均被拒绝',async()=>{
 const corrupt=assets.map(a=>({...a,rgba:new Uint8ClampedArray(a.rgba)}));corrupt[0].rgba[0]^=255;
 assert.ok((await composeAndAudit(plan,corrupt,scenarioCommands(plan))).report.issues.some(i=>i.code==='asset-hash'));
 const r=await composeAndAudit(plan,assets,scenarioCommands(plan));r.rgba[0]^=255;
 assert.equal(await verifyOutputBytes(r.rgba,r.report),false);
});
