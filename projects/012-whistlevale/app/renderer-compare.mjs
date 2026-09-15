import {createRenderer} from './webgl-renderer.mjs';
import {createThreeRenderer} from './three-study-renderer.mjs';
import {comparePixels} from './renderer-scene.mjs';
const $=id=>document.getElementById(id),stage=$('compare-stage'),nativeCanvas=$('native-canvas'),threeCanvas=$('three-canvas');
const defaults=()=>({mode:'detail',edition:'fine',detail:{geometry:true,materials:true,lighting:true},step:6,compare:false,split:50,time:Math.asin(2.3/2.7)/.44,sun:135,night:0,roughness:.28,lens:0,exposure:1.1,view:'final',yaw:.25,pitch:.32,distance:9.5,target:[-1,1.35,.15]});
let state=defaults(),profile='custom',display='split',preset='station',native,three,raf=0,measure=false,drag=null,failed=false,disposed=false;
const presets={
 station:{title:'先看几何是否丢失',text:'观察窗框倒角、屋面接缝、站牌与铆钉。两侧使用同一组精细模型，不减少 Three.js 一侧的零件。',pose:{yaw:.25,pitch:.32,distance:9.5,target:[-1,1.35,.15],night:0,lens:0}},
 wood:{title:'材料差异来自哪里？',text:'关注木纹方向、烟囱砖缝和窗边。① 使用颜色与凹凸贴图；② 使用与原生版相同的连续程序纹理。两种做法都在 Three.js 中实际运行。',pose:{yaw:.05,pitch:.18,distance:6.3,target:[-1.1,2.05,.05],night:0,lens:0}},
 train:{title:'金属反光也能做到吗？',text:'看车漆、轮子、扶手与屋顶通风口。调粗糙度或拖动视角；① 的物理材质与②的手工反光近似不一定呈现相同风格。',pose:{yaw:.48,pitch:.26,distance:5.5,target:[2.3,1.0,2.5],night:0,lens:0}},
 night:{title:'检查灯光与暗部层次',text:'两边固定同一夜色。① 用半球光、方向光、局部点光与环境贴图；② 精确接入原生版的补光和阴影公式。',pose:{yaw:.35,pitch:.32,distance:9.5,target:[-.6,1.3,.3],night:1,lens:0}},
 lens:{title:'摄影效果需要额外处理',text:'两边都先保存颜色和深度，再运行同一套景深、色调与显示颜色转换。这个效果可以通过 Three.js 的渲染目标和后处理实现。',pose:{yaw:.55,pitch:.63,distance:15,target:[-.2,.35,0],night:0,lens:1.5}}
};
function invalidate(){stage.dataset.measured='false';$('pixel-result').textContent='参数已更新。点击“检查当前帧差异”重新比较；数值不代表性能。';if(!raf&&!failed&&!document.hidden)raf=requestAnimationFrame(draw);}
function refresh(){
 for(const b of document.querySelectorAll('button[data-profile]'))b.setAttribute('aria-pressed',String(b.dataset.profile===profile));
 for(const b of document.querySelectorAll('button[data-display]'))b.setAttribute('aria-pressed',String(b.dataset.display===display));
 for(const b of document.querySelectorAll('button[data-preset]'))b.setAttribute('aria-pressed',String(b.dataset.preset===preset));
 $('profile-note').textContent=profile==='custom'?'② 同算法对照：模型、表面着色、阴影公式和摄影处理相同。检验 Three.js 能否承载这些精细效果。':'① 内置配置对照：同一精细模型，已配置贴图、凹凸、环境反光和灯光；表面与阴影算法不同。它展示配置差异，不代表 Three.js 的能力上限。';
 $('three-label').textContent=profile==='custom'?'Three.js · 同算法自定义':'Three.js · 内置材质配置';
 const split=display==='three'?100:display==='native'?0:state.split;
 nativeCanvas.style.clipPath=`inset(0 0 0 ${split}%)`;$('engine-divider').style.left=split+'%';$('engine-divider').hidden=display!=='split';$('engine-split').disabled=display!=='split';$('engine-split').value=state.split;$('split-output').textContent=state.split+'%';
 $('three-label').hidden=display==='native';document.querySelector('.engine-label.right').hidden=display==='three';
 $('observation-title').textContent=presets[preset].title;$('observation').textContent=presets[preset].text;
 for(const [id,key] of[['sun','sun'],['night','night'],['rough','roughness'],['lens','lens'],['exposure','exposure']]){$('compare-'+id).value=state[key];$('compare-'+id+'-value').textContent=id==='sun'?state[key]+'°':id==='night'?(state[key]===0?'白天':state[key]===1?'夜间':Math.round(state[key]*100)+'% 夜色'):state[key].toFixed(id==='rough'?2:1);}
 invalidate();
}
function error(e){failed=true;stage.dataset.ready='false';$('compare-error').hidden=false;$('compare-error').textContent='画面未能完成：'+e.message;$('compare-status').textContent='比较未完成，不能据此判断画质。';console.error(e);}
function draw(){
 raf=0;if(!native||!three||failed)return;
 try{
  const ni=native.render(state),np=measure?native.readPixels():null;
  const ti=three.render(state,profile),tp=measure?three.readPixels():null;
  if(ni.width!==ti.width||ni.height!==ti.height)throw new Error('两侧输出尺寸不一致');
  stage.dataset.ready='true';stage.dataset.profile=profile;stage.dataset.preset=preset;stage.dataset.models=ti.modelTriangles;stage.dataset.frame=JSON.stringify({sun:state.sun,night:state.night,lens:state.lens,roughness:state.roughness,exposure:state.exposure,yaw:state.yaw,pitch:state.pitch,distance:state.distance,target:state.target,time:state.time});
  $('compare-status').textContent='两侧画面已就绪 · 同模型 '+ti.modelTriangles.toLocaleString()+' 个三角形 · 拖动环顾 / 滚轮缩放';
  $('three-work').textContent=ti.calls+' / '+ti.triangles.toLocaleString();$('native-work').textContent=ni.calls+' / '+ni.triangles.toLocaleString();$('compare-size').textContent=ni.width+' × '+ni.height;$('compare-format').textContent=(ti.hdr?'RGBA16F':'RGBA8')+' / '+(ni.hdr?'RGBA16F':'RGBA8');
  if(measure){
   const result=comparePixels(np,tp);stage.dataset.measured='true';stage.dataset.pixelDifference=JSON.stringify(result);
   $('pixel-result').textContent=`当前帧：RGB 平均差 ${result.mean.toFixed(4)} / 255；最大差 ${result.peak}；差值超过 2 的像素占 ${result.overTwoPercent.toFixed(3)}%。`+(profile==='standard'?' 此模式的算法不同，差值不能解释为框架画质损失。':' 相同算法仍可能有边缘、采样与精度差异；这是当前机位的实测结果。');
   measure=false;
  }
 }catch(e){measure=false;error(e);}
}
for(const b of document.querySelectorAll('button[data-profile]'))b.onclick=()=>{profile=b.dataset.profile;refresh();};
for(const b of document.querySelectorAll('button[data-display]'))b.onclick=()=>{display=b.dataset.display;refresh();};
for(const b of document.querySelectorAll('button[data-preset]'))b.onclick=()=>{preset=b.dataset.preset;Object.assign(state,presets[preset].pose);refresh();};
for(const [id,key] of[['sun','sun'],['night','night'],['rough','roughness'],['lens','lens'],['exposure','exposure']])$('compare-'+id).oninput=e=>{state[key]=Number(e.target.value);refresh();};
$('engine-split').oninput=e=>{state.split=Number(e.target.value);refresh();};
$('measure-pixels').onclick=()=>{measure=true;invalidate();};
$('compare-reset').onclick=()=>{state=defaults();profile='custom';display='split';preset='station';refresh();};
stage.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,split:!!e.target.closest('#engine-divider')};stage.setPointerCapture(e.pointerId);};
stage.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;if(!(e.buttons&1)){drag=null;return;}if(drag.split){const r=stage.getBoundingClientRect();state.split=Math.max(0,Math.min(100,Math.round((e.clientX-r.left)/r.width*100)));refresh();}else{state.yaw-=(e.clientX-drag.x)*.008;state.pitch=Math.max(.12,Math.min(1.35,state.pitch+(e.clientY-drag.y)*.006));invalidate();}drag.x=e.clientX;drag.y=e.clientY;};
for(const name of['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,()=>{drag=null;});
stage.addEventListener('wheel',e=>{e.preventDefault();state.distance=Math.max(3.5,Math.min(24,state.distance*Math.exp(Math.sign(e.deltaY)*.065)));invalidate();},{passive:false});
stage.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')state.yaw-=.15;if(e.key==='ArrowRight')state.yaw+=.15;if(e.key==='ArrowUp')state.pitch=Math.min(1.35,state.pitch+.1);if(e.key==='ArrowDown')state.pitch=Math.max(.12,state.pitch-.1);if(e.key==='+')state.distance=Math.max(3.5,state.distance*.9);if(e.key==='-')state.distance=Math.min(24,state.distance*1.1);invalidate();};
const observer=new ResizeObserver(invalidate);observer.observe(stage);
function init(){try{native=createRenderer(nativeCanvas);three=createThreeRenderer(threeCanvas);failed=false;disposed=false;$('compare-error').hidden=true;refresh();}catch(e){native?.dispose();three?.dispose();error(e);}}
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);raf=0;native?.dispose();three?.dispose();native=three=null;}
for(const canvas of[nativeCanvas,threeCanvas]){canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();error(new Error('绘图连接中断，请刷新此页面重新比较。'));});}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else invalidate();});
addEventListener('pagehide',dispose);addEventListener('pageshow',e=>{if(e.persisted)init();});
init();
