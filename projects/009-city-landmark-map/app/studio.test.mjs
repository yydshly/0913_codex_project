import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIES,createState,validateState,moveLandmark,makePrompt} from './model.mjs';
import {paint,hitTest} from './render.mjs';
test('城市工程 JSON 往返保留用户修改且独立于预设',()=>{const a=createState('lijiang');a.title='我的丽江';a.landmarks[0].name='雪山记忆';a.landmarks[2].visible=false;moveLandmark(a,0,65,45);const b=validateState(JSON.parse(JSON.stringify(a)));assert.deepEqual(a,b);assert.equal(CITIES.lijiang.landmarks[0][0],'玉龙雪山');});
test('损坏工程、未知城市、无效坐标和超长文本被拒绝',()=>{for(const change of [s=>s.version=2,s=>s.city='__proto__',s=>s.landmarks[0].x='20',s=>s.landmarks.pop(),s=>s.title='长'.repeat(15),s=>s.theme='bad',s=>s.landmarks[0].visible=1]){const s=createState();change(s);assert.throws(()=>validateState(s));}});
test('导入不接受外部图片路径，地标位置限制在可编辑区',()=>{const s=createState();s.image='https://evil.invalid/a';s.landmarks[0].x=900;s.landmarks[0].y=-40;const b=validateState(s);assert.equal(b.image,undefined);assert.equal(b.landmarks[0].x,90);assert.equal(b.landmarks[0].y,18);});
test('地标移动约束防止离开海报且拒绝非有限数值',()=>{const s=createState();moveLandmark(s,2,-100,200);assert.deepEqual([s.landmarks[2].x,s.landmarks[2].y],[10,87]);assert.throws(()=>moveLandmark(s,2,NaN,20));});
test('新城市提示词覆盖用户输入与事实核实边界',()=>{const p=makePrompt('杭州','西湖\n 雷峰塔\n\n灵隐寺','watercolor');assert.match(p,/杭州/);assert.match(p,/西湖、雷峰塔、灵隐寺/);assert.match(p,/水彩/);assert.match(p,/不用于导航/);assert.match(p,/无文字/);assert.throws(()=>makePrompt('','西湖'));assert.throws(()=>makePrompt('杭州',''));assert.throws(()=>makePrompt('杭州','西湖','missing'));});
test('标签命中按最上层优先，无标签时不命中',()=>{const boxes=[{id:0,x:10,y:10,w:100,h:30},{id:1,x:20,y:10,w:100,h:30}];assert.equal(hitTest(boxes,25,20),1);assert.equal(hitTest(boxes,0,0),-1);assert.equal(hitTest([],25,20),-1);});
function fakeContext(){return new Proxy({font:'',measureText(t){return {width:t.length*30};}},{get(o,k){return k in o?o[k]:(()=>{});},set(o,k,v){o[k]=v;return true;}});}
test('隐藏单个标注和隐藏全部标注影响绘制与命中，不移除底图',()=>{const s=createState(),ctx=fakeContext();assert.equal(paint(ctx,s,null).length,6);s.landmarks[2].visible=false;assert.equal(paint(ctx,s,null).length,5);s.labelStyle='none';assert.deepEqual(paint(ctx,s,null),[]);});
test('长中文标签保持在海报边界内，显示与导出命中几何一致',()=>{const s=createState();s.landmarks[0].name='一个很长的中文景点名称用于布局检查';s.landmarks[0].x=90;const a=paint(fakeContext(),s,null,{selection:true}),b=paint(fakeContext(),s,null);assert.deepEqual(a,b);for(const r of a){assert.ok(r.x>=48);assert.ok(r.x+r.w<=1752);}});

