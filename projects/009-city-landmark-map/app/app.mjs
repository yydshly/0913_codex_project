import {CITIES,THEMES,createState,validateState,moveLandmark,makePrompt} from './model.mjs';
import {paint,hitTest,WIDTH,HEIGHT} from './render.mjs';
const $=id=>document.getElementById(id),key='city-atlas-studio-v1',canvas=$('poster'),ctx=canvas.getContext('2d');
let drafts={},state=createState(),image=null,boxes=[],imageRequest=0,toastTimer,drag=null,saveTimer;
const cache=new Map();
try{const raw=JSON.parse(localStorage.getItem(key)||'{}');for(const city of Object.keys(CITIES)){if(raw[city]){try{drafts[city]=validateState(raw[city]);}catch{}}}if(drafts.tengchong)state=structuredClone(drafts.tengchong);}catch{}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function save(){drafts[state.city]=structuredClone(state);clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(key,JSON.stringify(drafts));$('save-status').textContent='已保存到本机';}catch{$('save-status').textContent='本机存储不可用，请保存工程';}},200);}
function draw(){boxes=paint(ctx,state,image,{selection:true});}
function details(){
 const m=state.landmarks[state.selected],source=CITIES[state.city].landmarks[m.id];
 $('landmark-name').value=m.name;$('visible').checked=m.visible;$('pos-x').value=m.x;$('pos-y').value=m.y;
 $('x-value').value=m.x.toFixed(1)+'%';$('y-value').value=m.y.toFixed(1)+'%';
 $('landmark-category').textContent=source[1]+'景观';$('landmark-description').textContent=source[2];$('landmark-source').href=source[5];
 $('source-note').textContent=m.name!==source[0]?'名称已编辑；链接仍是原地标资料，新名称需自行核实。':'资料确认地标归属，插画外形与位置为艺术化表达。';
 document.querySelectorAll('.landmark-row').forEach((b,i)=>{b.classList.toggle('active',i===state.selected);b.classList.toggle('dim',!state.landmarks[i].visible);b.setAttribute('aria-pressed',String(i===state.selected));b.querySelector('.landmark-text').textContent=state.landmarks[i].name||'未命名';});
}
function list(){
 $('landmark-list').replaceChildren();
 state.landmarks.forEach((m,i)=>{const b=document.createElement('button');b.className='landmark-row';b.type='button';b.setAttribute('aria-label','编辑地标 '+(i+1));
 const n=document.createElement('span');n.className='num';n.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.className='landmark-text';name.textContent=m.name;const kind=document.createElement('span');kind.className='kind';kind.textContent=CITIES[state.city].landmarks[i][1];b.append(n,name,kind);b.addEventListener('click',()=>{state.selected=i;details();draw();save();});$('landmark-list').append(b);});details();
}
function controls(){
 for(const k of ['title','subtitle','caption'])$(k).value=state[k];$('label-style').value=state.labelStyle;$('current-city').textContent=CITIES[state.city].name;
 document.querySelectorAll('[data-city]').forEach(b=>{b.classList.toggle('active',b.dataset.city===state.city);b.setAttribute('aria-pressed',String(b.dataset.city===state.city));});
 document.querySelectorAll('[data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===state.theme);b.setAttribute('aria-pressed',String(b.dataset.theme===state.theme));});list();
}
async function loadImage(){
 const id=++imageRequest,city=state.city;image=null;$('image-status').hidden=false;$('image-status').textContent='正在载入城市插画…';$('export').disabled=true;draw();
 try{
 let img=cache.get(city);if(!img){img=new Image();img.src=new URL('../assets/'+CITIES[city].image,import.meta.url).href;await img.decode();cache.set(city,img);}
 if(id!==imageRequest)return;image=img;draw();$('image-status').hidden=true;$('export').disabled=false;
 }catch{if(id===imageRequest){$('image-status').textContent='插画加载失败，请刷新页面重试。';toast('插画未能载入');}}
}
async function switchCity(city){if(!Object.hasOwn(CITIES,city))throw new Error('不支持的城市');drafts[state.city]=structuredClone(state);state=drafts[city]?structuredClone(drafts[city]):createState(city);controls();save();await loadImage();}
for(const k of ['title','subtitle','caption'])$(k).addEventListener('input',e=>{state[k]=e.target.value;draw();save();});
document.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.city!==state.city)void switchCity(b.dataset.city);}));
document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{state.theme=b.dataset.theme;controls();draw();save();}));
$('label-style').addEventListener('change',e=>{state.labelStyle=e.target.value;draw();save();});
$('landmark-name').addEventListener('input',e=>{state.landmarks[state.selected].name=e.target.value;details();draw();save();});
$('visible').addEventListener('change',e=>{state.landmarks[state.selected].visible=e.target.checked;details();draw();save();});
for(const axis of ['x','y'])$('pos-'+axis).addEventListener('input',e=>{const m=state.landmarks[state.selected];moveLandmark(state,m.id,axis==='x'?Number(e.target.value):m.x,axis==='y'?Number(e.target.value):m.y);details();draw();save();});
function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*WIDTH,y:(e.clientY-r.top)/r.height*HEIGHT};}
canvas.addEventListener('pointerdown',e=>{const p=point(e),id=hitTest(boxes,p.x,p.y);if(id<0)return;state.selected=id;const m=state.landmarks[id];drag={id,dx:p.x-m.x/100*WIDTH,dy:p.y-m.y/100*HEIGHT};canvas.setPointerCapture(e.pointerId);details();draw();});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);moveLandmark(state,drag.id,(p.x-drag.dx)/WIDTH*100,(p.y-drag.dy)/HEIGHT*100);details();draw();});
function endDrag(){if(drag){drag=null;save();}}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
canvas.addEventListener('keydown',e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();const m=state.landmarks[state.selected],step=e.shiftKey?2:.5;moveLandmark(state,m.id,m.x+delta[0]*step,m.y+delta[1]*step);details();draw();save();});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function filename(s){return s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,50)||'城市地图';}
async function exportPoster(){if(!image)throw new Error('请等待插画载入');const out=document.createElement('canvas');out.width=WIDTH;out.height=HEIGHT;paint(out.getContext('2d'),structuredClone(state),image);const blob=await new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('导出失败')),'image/png'));download(blob,filename(state.title)+'-城市印象.png');return {width:WIDTH,height:HEIGHT};}
$('export').addEventListener('click',async()=>{try{$('export').disabled=true;await exportPoster();toast('海报已交给浏览器下载');}catch(e){toast(e.message);}finally{$('export').disabled=!image;}});
$('save-draft').addEventListener('click',()=>{download(new Blob([JSON.stringify(validateState(state),null,2)],{type:'application/json'}),filename(state.title)+'-地图工程.json');toast('工程已交给浏览器下载');});
$('import-draft').addEventListener('click',()=>$('draft-file').click());
$('draft-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>100000)throw new Error('工程文件过大');const next=validateState(JSON.parse(await file.text()));drafts[state.city]=structuredClone(state);state=next;controls();save();await loadImage();toast('工程已载入');}catch(error){toast('导入失败：'+error.message);}finally{e.target.value='';}});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('research-open').addEventListener('click',()=>$('research-dialog').showModal());
$('reset').addEventListener('click',()=>$('reset-dialog').showModal());
$('confirm-reset').addEventListener('click',()=>{state=createState(state.city);controls();draw();save();$('reset-dialog').close();toast('已恢复当前城市的初始版式');});
$('prompt-open').addEventListener('click',()=>{$('prompt-city').value=CITIES[state.city].name;$('prompt-landmarks').value=state.landmarks.map(m=>m.name).join('\n');updatePrompt();$('prompt-dialog').showModal();});
function updatePrompt(){try{$('prompt-result').value=makePrompt($('prompt-city').value,$('prompt-landmarks').value,$('prompt-mood').value);return true;}catch(e){$('prompt-result').value='';toast(e.message);return false;}}
$('make-prompt').addEventListener('click',updatePrompt);
for(const id of ['prompt-city','prompt-landmarks','prompt-mood'])$(id).addEventListener('input',()=>{$('prompt-result').value='';});
$('copy-prompt').addEventListener('click',async()=>{if(!updatePrompt())return;try{await navigator.clipboard.writeText($('prompt-result').value);toast('提示词已复制');}catch{$('prompt-result').focus();$('prompt-result').select();toast('请按 Ctrl+C 复制已选中的提示词');}});
$('download-prompt').addEventListener('click',()=>{if(updatePrompt())download(new Blob([$ ('prompt-result').value],{type:'text/plain;charset=utf-8'}),filename($('prompt-city').value)+'-绘图提示词.txt');});
window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);drafts[state.city]=structuredClone(state);try{localStorage.setItem(key,JSON.stringify(drafts));}catch{}});
controls();await document.fonts.ready;await loadImage();
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const tools=[
 {name:'read_city_map',title:'读取城市地图',description:'读取当前海报文字、标注和图片加载状态。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({state:structuredClone(state),imageReady:!!image})},
 {name:'configure_city_map',title:'设置城市地图',description:'切换腾冲或丽江样例，编辑标题与装裱配色；不会生成新图。',inputSchema:{type:'object',properties:{city:{type:'string',enum:Object.keys(CITIES)},title:{type:'string',maxLength:14},theme:{type:'string',enum:Object.keys(THEMES)}},additionalProperties:false},execute:async(input)=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['city','title','theme'].includes(k)))throw new Error('参数无效');if(input.city!==undefined&&!Object.hasOwn(CITIES,input.city))throw new Error('城市无效');if(input.theme!==undefined&&!Object.hasOwn(THEMES,input.theme))throw new Error('配色无效');if(input.title!==undefined&&(typeof input.title!=='string'||input.title.length>14))throw new Error('标题无效');if(input.city&&input.city!==state.city)await switchCity(input.city);if(input.title!==undefined)state.title=input.title;if(input.theme)state.theme=input.theme;controls();draw();save();return {city:state.city,title:state.title,theme:state.theme};}}
 ];
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}

