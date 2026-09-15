import {createRenderer} from './webgl-renderer.mjs';
import {lessons} from './webgl-lessons.mjs';
import {DETAIL_TOPICS} from './webgl-comparison.mjs';
const $=id=>document.getElementById(id),canvas=$('webgl-canvas');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const defaults=(mode='detail')=>({mode,edition:'split',split:50,topic:'structure',detail:{geometry:true,materials:true,lighting:true},step:6,compare:false,sun:135,night:0,roughness:.28,lens:mode==='detail'?0:.8,exposure:1.1,view:'final',paused:mode==='detail'||reduceMotion.matches,time:mode==='detail'?Math.asin(2.3/2.7)/.44:0,yaw:mode==='detail'?.25:.55,pitch:mode==='detail'?.32:.63,distance:mode==='detail'?9.5:17,target:mode==='detail'?[-1,1.35,.15]:[-.2,.35,0]});
let state=defaults(),renderer,frameId=0,last=0,drag=null,lastHUD=0,failed=false;
const hashMatch=location.hash.match(/^#step-([0-6])$/);if(hashMatch){state=defaults('intro');state.step=Number(hashMatch[1]);}
const active=()=>(state.mode==='detail'?state.edition!=='split':state.step>=5&&!state.compare)&&!state.paused&&!document.hidden;
function requestDraw(){if(!frameId&&renderer&&!document.hidden&&!failed)frameId=requestAnimationFrame(frame);}
function showError(error){failed=true;cancelAnimationFrame(frameId);frameId=0;$('error').hidden=false;$('error-message').textContent=error.message;$('render-status').textContent='画面未就绪；可继续阅读下方说明';canvas.dataset.ready='false';console.error(error);}
function updateHUD(info){
 $('draw-calls').textContent=String(info.calls);$('triangles').textContent=info.triangles.toLocaleString('zh-CN');$('pixels').textContent=info.width+' × '+info.height;
 $('buffer-format').textContent=info.hdr?'RGBA16F · 浮点颜色':'RGBA8 · 亮部范围有限';$('shadow-status').textContent=info.step<4?'此步未使用':info.shadowDrawn?'重新绘制':'复用已有深度图';
 $('render-status').textContent='原生 WebGL 2 · '+info.stageLabel;
 $('view-label').textContent=state.mode==='detail'?(state.edition==='split'?'同机位滑动对照':state.edition==='base'?'基础版':'当前精细版'):(state.compare?'对照 · ':'')+String(info.step+1).padStart(2,'0')+' / '+(state.view==='final'?lessons[info.step].short:info.stageLabel);
 $('model-count').textContent='模型三角形 '+info.baseModel.toLocaleString()+' → '+info.fineModel.toLocaleString();
 canvas.dataset.mode=state.mode;canvas.dataset.edition=state.edition;canvas.dataset.baseModel=info.baseModel;canvas.dataset.fineModel=info.fineModel;canvas.dataset.features=JSON.stringify(state.detail);canvas.dataset.split=state.split;
 canvas.dataset.ready='true';canvas.dataset.step=String(info.step);canvas.dataset.drawCalls=String(info.calls);canvas.dataset.triangles=String(info.triangles);
}
function frame(now){frameId=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(active())state.time+=dt;try{const info=renderer.render(state);if(info&&(now-lastHUD>350||!active())){updateHUD(info);lastHUD=now;}}catch(e){showError(e);return;}if(active())requestDraw();}
function refresh(){
 const detail=state.mode==='detail',lesson=detail?DETAIL_TOPICS[state.topic]:lessons[state.step],effective=detail?6:state.compare?Math.max(0,state.step-1):state.step;
 document.body.dataset.mode=state.mode;
 for(const button of document.querySelectorAll('[data-mode]'))if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
 for(const button of document.querySelectorAll('[data-edition]'))button.setAttribute('aria-pressed',String(button.dataset.edition===state.edition));
 for(const button of document.querySelectorAll('[data-topic]'))button.setAttribute('aria-pressed',String(button.dataset.topic===state.topic));
 $('intro-steps').hidden=detail;for(const id of['detail-toolbar','detail-controls'])$(id).hidden=!detail;
 $('split-overlay').hidden=$('split-control').hidden=!detail||state.edition!=='split';
 $('split-line').style.left=state.split+'%';$('split').value=state.split;
 for(const key of['geometry','materials','lighting'])$('detail-'+key).checked=state.detail[key];
 $('isolate').textContent='只比较'+({structure:'结构',materials:'材料',lighting:'光线'}[state.topic]);
 $('compare').hidden=$('compare-note').hidden=detail;
 for(const button of document.querySelectorAll('[data-step]'))button.setAttribute('aria-pressed',String(Number(button.dataset.step)===state.step));
 $('step-title').textContent=lesson.title;$('step-number').textContent=detail?'细节研究':String(state.step+1).padStart(2,'0')+' / 07';
 for(const key of['see','change','try','three','native'])$(key).textContent=lesson[key];
 $('code').textContent=detail?({structure:'倒角 + 收边 + 连接件 → 新增顶点与三角形\n几何法线 → 亮边、遮挡与小阴影',materials:'面内 UV → 顺着构件生成纹理\n程序高度变化 → 扰动表面法线\n粗糙度 + 视角 → 反光近似',lighting:'阴影深度比较：9 次 → 25 次采样\n表面朝向 → 天空 / 地面补光\n同一曝光与色调处理'}[state.topic]):lesson.code;
 $('upstream').href=detail?'https://github.com/nickfromlater/whistlevale/blob/f3d769e8ea54d2f5a47d12f27773541b484c6302/'+lesson.source:lesson.source;$('source-file').href=detail?lesson.file:state.step===1?'webgl-geometry.mjs':[2,3,6].includes(state.step)?'webgl-shaders.mjs':'webgl-renderer.mjs';
 $('compare').disabled=state.step===0;$('compare').setAttribute('aria-pressed',String(state.compare));$('compare').textContent=state.compare?'恢复本步效果':'去掉本步，对照';
 $('compare-note').textContent=state.compare?'正在显示「'+lessons[effective].short+'」。小车时间暂时停止，避免干扰比较。':'保留当前机位与参数，观察上一步的结果。';
 for(const id of['sun','night','roughness','lens','exposure']){ $(id).value=state[id];$(id).disabled=effective<({sun:2,night:2,roughness:3,lens:6,exposure:6}[id]);}
 $('sun-output').textContent=state.sun+'°';$('night-output').textContent=state.night===0?'白天':state.night===1?'夜间':Math.round(state.night*100)+'% 夜色';$('roughness-output').textContent=state.roughness.toFixed(2);$('lens-output').textContent=state.lens.toFixed(1);$('exposure-output').textContent=state.exposure.toFixed(1);
 if(effective<4&&state.view==='shadow')state.view='final';if(effective===0)state.view='final';
 $('diagnostic').value=state.view;$('diagnostic').disabled=effective===0;$('diagnostic').querySelector('option[value="shadow"]').disabled=effective<4;
 $('pause').disabled=detail?state.edition==='split':state.step<5||state.compare;$('pause').textContent=detail&&state.edition==='split'?'对照时固定小车':state.paused?'继续小车':'暂停小车';$('pause').setAttribute('aria-pressed',String(state.paused));
 for(const id of['overview','closeup','left','right','zoom-in','zoom-out'])$(id).disabled=effective===0;
 lastHUD=0;requestDraw();
}
function init(){try{renderer?.dispose();renderer=createRenderer(canvas);failed=false;$('error').hidden=true;last=0;refresh();}catch(e){showError(e);}}
for(const button of document.querySelectorAll('button[data-mode]'))button.onclick=()=>{state=defaults(button.dataset.mode);history.replaceState(null,'',state.mode==='detail'?'#detail':'#step-6');refresh();};
for(const button of document.querySelectorAll('[data-edition]'))button.onclick=()=>{state.edition=button.dataset.edition;refresh();};
for(const button of document.querySelectorAll('[data-topic]'))button.onclick=()=>{state.topic=button.dataset.topic;refresh();};
for(const key of['geometry','materials','lighting'])$('detail-'+key).onchange=e=>{state.detail[key]=e.target.checked;refresh();};
$('isolate').onclick=()=>{const selected=state.topic==='structure'?'geometry':state.topic;for(const key of Object.keys(state.detail))state.detail[key]=key===selected;state.edition='split';refresh();};
$('split').oninput=e=>{state.split=Number(e.target.value);refresh();};
let splitPointer=null;
$('split-line').onpointerdown=e=>{splitPointer=e.pointerId;$('split-line').setPointerCapture(e.pointerId);e.preventDefault();};
$('split-line').onpointermove=e=>{if(e.pointerId!==splitPointer)return;const box=canvas.getBoundingClientRect();state.split=Math.max(0,Math.min(100,Math.round((e.clientX-box.left)/box.width*100)));refresh();};
for(const event of['pointerup','pointercancel','lostpointercapture'])$('split-line').addEventListener(event,()=>{splitPointer=null;});
for(const button of document.querySelectorAll('[data-step]'))button.addEventListener('click',()=>{state.step=Number(button.dataset.step);state.compare=false;state.view='final';history.replaceState(null,'','#step-'+state.step);refresh();});
for(const id of['sun','night','roughness','lens','exposure'])$(id).addEventListener('input',e=>{state[id]=Number(e.target.value);refresh();});
$('compare').onclick=()=>{state.compare=!state.compare;refresh();};$('pause').onclick=()=>{state.paused=!state.paused;refresh();};
$('diagnostic').onchange=e=>{state.view=e.target.value;refresh();};
$('overview').onclick=()=>{Object.assign(state,{yaw:.55,pitch:.63,distance:17,target:[-.2,.35,0]});requestDraw();};
$('closeup').onclick=()=>{Object.assign(state,{yaw:.36,pitch:.34,distance:9.5,target:[-1,1.35,.15]});requestDraw();};
$('left').onclick=()=>{state.yaw-=.2;requestDraw();};$('right').onclick=()=>{state.yaw+=.2;requestDraw();};
function zoom(factor){state.distance=Math.max(5,Math.min(23,state.distance*factor));requestDraw();}
$('zoom-in').onclick=()=>zoom(.88);$('zoom-out').onclick=()=>zoom(1.13);
$('reset').onclick=()=>{state=defaults(state.mode);history.replaceState(null,'',state.mode==='detail'?'#detail':'#step-6');refresh();};$('retry').onclick=init;
canvas.addEventListener('pointerdown',e=>{if(state.step===0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;state.yaw-=(e.clientX-drag.x)*.008;state.pitch=Math.max(.15,Math.min(1.35,state.pitch+(e.clientY-drag.y)*.006));drag.x=e.clientX;drag.y=e.clientY;requestDraw();});
for(const event of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
canvas.addEventListener('wheel',e=>{if(state.step===0)return;e.preventDefault();zoom(Math.exp(Math.sign(e.deltaY)*.065));},{passive:false});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(state.step===0)return;if(e.key==='ArrowLeft')state.yaw-=.15;if(e.key==='ArrowRight')state.yaw+=.15;if(e.key==='ArrowUp')state.pitch=Math.min(1.35,state.pitch+.1);if(e.key==='ArrowDown')state.pitch=Math.max(.15,state.pitch-.1);if(e.key==='+')zoom(.9);if(e.key==='-')zoom(1.1);requestDraw();});
new ResizeObserver(requestDraw).observe(canvas);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;last=0;}else requestDraw();});
reduceMotion.addEventListener('change',e=>{if(e.matches){state.paused=true;refresh();}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();showError(new Error('绘图连接暂时中断；浏览器恢复连接后会重新建立画面。'));});
canvas.addEventListener('webglcontextrestored',init);
addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);frameId=0;renderer?.dispose();renderer=null;});
addEventListener('pageshow',e=>{if(e.persisted)init();});
refresh();init();
