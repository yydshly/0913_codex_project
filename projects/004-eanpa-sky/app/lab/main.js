import {snowmeltSequencePhase,snowmeltSequenceStatus} from './snowmelt.js';
import {appendBounded} from './runtime-history.js';
import {makeAtmosphereTransition,rainSequencePhase,sequenceStatus} from './weather-response.js';
import {makeHailWeather} from './hail-weather.js';
import * as GPU from 'three';
import * as TSL from 'three/tsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {fxaa} from 'three/addons/tsl/display/FXAANode.js';
import {skyQualityPresets} from '/engine/quality_presets.js';
import {makeWeatherSky} from '/src/weathersky.js';
import {makeSpatialCloudPass} from '/src/cloudspatial.js';
import {makeNativeReflectionPipeline} from '/src/native_reflection_pipeline.js';
import {makeReflectionEnvironment} from '/src/reflection_environment.js';
import {makeCourtyard,views} from './courtyard.js';
import {createSoundscape} from './soundscape.js';
import {scenarios,conditions} from './scenarios.js';
import {stayStops,stayResponse} from './stay.js';
import {makeCourtyardRain} from './courtyard-rain.js';
import {makeRainExperience} from './rain-experience.js';
import {makeSnowWeather,engineWeatherFor} from './snow-weather.js';
import {makeMatteEnvironment} from './reflection-budget.js';
import {makeAdaptiveQuality,qualityLevels} from './adaptive-quality.js';

const T=globalThis.THREE={...GPU,...TSL};globalThis.EANPA_NO_MRT=true;
const $=id=>document.getElementById(id),started=performance.now();
let lang='zh';try{lang=localStorage.getItem('eanpa-research-language')==='en'?'en':'zh';}catch{}
const tr=(zh,en)=>lang==='zh'?zh:en;
const startupMarks=[{stage:'Module dependencies ready',at:started}],frameTimes=[];let measuredFrames=0,totalFrameMs=0,longFrames=0;
const startupMark=stage=>{startupMarks.push({stage,at:performance.now()});const step={'WebGPU initialization':1,'Reflection pipeline setup':2,'Cloud pass compilation':3,'Reflection and material compilation':4,'Three warmup frames and GPU completion':5}[stage];if(step)$('boot-progress').value=step;};
function acceptanceMetrics(){const times=[...frameTimes].sort((a,b)=>a-b);return{startup:startupMarks.map((m,i)=>({stage:m.stage,elapsedMs:+m.at.toFixed(1),durationMs:+(m.at-(startupMarks[i-1]?.at??0)).toFixed(1)})),previewVisibleMs:Number($('boot').dataset.previewVisibleMs)||null,previewTimingNote:'Second animation-frame callback after illustration markup; approximate visibility marker, not interactive scene readiness.',navigationToReadyMs:state.navigationToReadyMs,renderWork:{measuredFrames,meanMs:measuredFrames?+(totalFrameMs/measuredFrames).toFixed(2):0,recentSamples:times.length,p50Ms:times.length?times[Math.floor((times.length-1)*.5)]:null,p95Ms:times.length?times[Math.floor((times.length-1)*.95)]:null,over100ms:longFrames,note:'Wall-clock time awaiting frame submission; excludes paused/hidden intervals, not GPU execution time or display FPS.'}};}
const state={ready:false,paused:false,hours:15.5,weather:'none',cloud:'cumulus',camera:null,sequence:null,atmosphere:{fog:.0013,cloud:.2},budget:'auto',view:'overview',scenario:'free',stay:'arrival',lighting:{mode:'auto',brightness:.7,tea:true,path:true,rooms:true},lightOutput:{},layers:{},time:0,frames:0,fps:0,readyMs:null,eventLog:{limit:600,total:0,dropped:0},runtime:{sampleLimit:120,totalSamples:0,droppedSamples:0,samples:[],note:"Renderer-tracked resources and estimated bytes, not process VRAM; JS heap is optional browser telemetry."},events:[],errors:[]};
const adaptive=makeAdaptiveQuality();
try{const saved=localStorage.getItem('eanpa-render-budget');if(['auto','balanced','eco'].includes(saved))state.budget=saved;}catch{}
$('budget').value=state.budget;state.quality={mode:state.budget,...qualityLevels[0]};
const sound=createSoundscape((action,detail)=>record(action,detail));let soundError=false;
let sizes={},payload={bytes:0,files:[]},transitionEnd=0,lightningDemoAt=null,stage=['准备资源…','Preparing resources…'];
function record(action,detail){state.eventLog.total++;state.eventLog.dropped+=appendBounded(state.events,{at:new Date().toISOString(),simulationSeconds:+state.time.toFixed(2),action,detail},state.eventLog.limit);}
function translate(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';$('language').value=lang;
 document.querySelectorAll('[data-zh]').forEach(el=>el.textContent=el.dataset[lang]);
 document.title=tr('听雨山居 · 入住体验','Rain Garden Stay · Guest experience');
 updateText();
}
function updateText(){
 document.querySelectorAll('[data-condition]').forEach(b=>{const preset=conditions[b.dataset.condition];b.setAttribute('aria-pressed',String(state.weather===preset.weather));});
 document.querySelectorAll('[data-hour]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(state.hours-Number(b.dataset.hour))<.05)));
 document.querySelectorAll('[data-light-mode]').forEach(b=>b.setAttribute('aria-pressed',String(state.lighting.mode===b.dataset.lightMode)));
 $('light-brightness-value').textContent=`${Math.round(state.lighting.brightness*100)}%`;
 $('light-status').textContent=tr('灯光独立于天气和时段；自动模式随天色渐亮。','Lights are independent of weather and time; Auto follows dusk and dawn.');
 $('scenario-description').textContent=scenarios[state.scenario].description[lang==='zh'?0:1];
 const stop=stayStops[state.stay],response=stayResponse(state.weather,state.hours),li=lang==='zh'?0:1;
 $('stay-description').textContent=stop.description[li];$('stay-response').textContent=response.title[li];$('stay-detail').textContent=response.description[li];$('stay-action').textContent=response.action[li];
 document.querySelectorAll('[data-stop]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stop===state.stay)));
 $('stay-next').textContent=state.stay==='evening'?tr('重新体验','Start again'):tr('下一组导览 →','Next guided preset →');
 $('panel-toggle').textContent=$('environment-panel').hidden?tr('展开参数','Show controls'):tr('收起参数','Hide controls');
 $('panel-toggle').setAttribute('aria-expanded',String(!$('environment-panel').hidden));
 sound.setBlocked(!state.ready||state.paused||document.hidden||$('journal').open);
 const audio=sound.snapshot();
 $('sound-toggle').textContent=audio.enabled?tr('静音','Mute'):tr('开启声音','Enable sound');
 $('sound-toggle').setAttribute('aria-pressed',String(audio.enabled));
 $('detail-volume-value').textContent=`${Math.round(audio.detailVolume*100)}%`;
 $('cinema-toggle').textContent=document.body.classList.contains('cinema')?tr('显示界面 · Esc','Show controls · Esc'):tr('隐藏界面','Hide controls');
 $('volume-value').textContent=`${Math.round(audio.volume*100)}%`;
 $('sound-level').value=audio.rms;
 $('sound-status').textContent=soundError?tr('声音加载失败，点击重试','Audio loading failed; retry'):audio.loading?tr('正在准备自然雨声…','Loading natural rain…'):!audio.enabled?tr('点击开启风雨声','Click to hear the weather'):audio.blocked?tr('声音随场景暂停','Audio paused with scene'):audio.volume===0?tr('音量为零','Volume is zero'):audio.context!=='running'?tr('等待浏览器播放声音','Waiting for browser audio'):audio.focus==='thunder'?(audio.activeThunder?tr('仅雷声 · 正在播放','Thunder only · playing'):tr('仅雷声 · 等待闪电','Thunder only · awaiting lightning')):audio.focus==='wind'?tr('仅风声','Wind only'):audio.focus==='hail'?(audio.hail>.05?tr('仅冰雹 · 随落点敲击','Hail only · impact sounds'):tr('仅冰雹 · 当前无冰雹','Hail only · no hail')):audio.focus==='details'?tr('仅细节声 · 檐口、屋顶与冰雹落点','Details only · eaves, roof and hail impacts'):audio.focus==='all'&&audio.hail>.05?tr('冰雹 · 风声与落点敲击','Hail · wind and surface impacts'):audio.rain>.02?(audio.shelter>.5?tr('遮挡处 · 柔和雨声','Sheltered · softened rain'):tr('露天 · 自然雨声','Outdoors · natural rain')):audio.focus==='rain'?tr('仅雨声 · 当前无局部降雨','Rain only · no local rainfall'):audio.snow>.05?tr('降雪 · 轻柔风声','Snowfall · soft wind'):tr('无局部降雨 · 轻微环境风','No local rain · light ambient wind');
 $('boot-stage').textContent=stage[lang==='zh'?0:1];
 const qualityNames={standard:['标准','Standard'],smooth:['流畅','Smooth'],light:['轻量','Light'],eco:['省电','Eco']};$('quality-status').textContent=(state.budget==='auto'?tr('自动画质 · ','Auto quality · '):tr('手动画质 · ','Manual quality · '))+qualityNames[state.quality.name][lang==='zh'?0:1];
 $('pause').textContent=$('pause-main').textContent=state.paused?tr('继续播放','Resume'):tr('暂停','Pause');
 $('controls-toggle').textContent=document.body.classList.contains('controls-collapsed')?tr('天气与设置','Weather & settings'):tr('收起设置','Close settings');
 $('controls-toggle').setAttribute('aria-expanded',String(!document.body.classList.contains('controls-collapsed')));
 $('view-status').textContent=state.view==='free'?tr('自由视角','Free view'):tr('预设视角','Preset view');
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
 const minutes=Math.round(state.hours*60)%1440;$('time-value').textContent=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
 const thawDemo=state.sequence?.kind==='snowmelt';const flow=state.sequence?(thawDemo?snowmeltSequenceStatus:sequenceStatus)(state.time-state.sequence.started):null;const flowLabels={snowing:['积雪累积','Snow accumulation'],thawingSky:['放晴升温示意','Clearing for thaw'],melting:['融雪与补水','Thaw and replenishment'],gathering:['云层聚拢','Clouds gathering'],raining:['降雨积水','Rain and pooling'],clearing:['雨停放晴','Rain easing'],drying:['退水与湿痕','Retreat and damp traces'],complete:['完成','Complete']};$('sequence-hud').hidden=!flow;if(flow){$('sequence-stage').textContent=flowLabels[flow.stage][li];$('sequence-time').textContent=tr(`${state.paused?'已暂停 · ':''}本阶段 ${flow.stageRemaining} 秒 · 全程剩余 ${flow.remaining} 秒`,`${state.paused?'Paused · ':''}Stage ${flow.stageRemaining}s · Total ${flow.remaining}s left`);$('sequence-progress').value=flow.progress;}
 $('thaw-sequence').textContent=thawDemo?tr('停止融雪演示','Stop thaw demo'):tr('日间积雪 → 融雪','Daytime snow → thaw');
 $('rain-sequence').textContent=state.sequence&&!thawDemo?tr('停止雨停演示','Stop rain cycle'):tr('演示雨起 → 雨停','Play rain → clearing');
 const g=state.layers.groundRain; $('surface-status').textContent=tr(`泥土含水 ${Math.round((g?.soilMoisture??0)*100)}% · 浅洼水量 ${Math.round((g?.puddleFill??0)*100)}%${state.sequence?' · '+(thawDemo?'积雪与融雪演示':state.sequence.phase==='rain'?'降雨累积中':'雨停后逐渐干燥'):''}`,`Soil ${Math.round((g?.soilMoisture??0)*100)}% · Pools ${Math.round((g?.puddleFill??0)*100)}%${state.sequence?' · '+(thawDemo?'Snow and thaw demo':state.sequence.phase==='rain'?'Raining':'Drying after rain'):''}`);
 $('snow-status').textContent=state.weather==='hail'?tr('冰雹快速落下，硬地短促反弹；可切到泥地水迹或檐下对照。','Hail falls fast and rebounds on hard ground; compare Earth & puddles and Porch.'):state.weather==='snow'?tr(`飘雪与积雪渐变 · 覆盖进度 ${Math.round((state.layers.snow?.accumulation??0)*100)}%（演示加速）`,`Snow settles gradually · ${Math.round((state.layers.snow?.accumulation??0)*100)}% cover (accelerated demo)`):(state.layers.snow?.accumulation??0)>.01?tr('停雪后融水补入泥土与浅洼；白天较快，夜间较慢（演示近似）','After snow, melt feeds soil and pools; faster by day, slower at night (visual approximation)'):tr('同一机位依次切换晴朗、阴天、降雨、降雪，比较天空与地表。','Keep this view and compare Clear, Overcast, Rain and Snow.');
 const remaining=Math.max(0,transitionEnd-state.time);
 $('weather-state').textContent=!state.ready?tr('等待启动','Starting'):remaining>0?tr(`过渡中 · ${remaining.toFixed(0)} 秒`,`Transition · ${remaining.toFixed(0)}s`):tr('已就绪','Ready');
 $('scenario-status').textContent=state.paused?tr('已暂停；调整场景参数会继续播放','Paused; changing scene controls resumes playback'):`${$('weather').selectedOptions[0].textContent} · ${$('time-value').textContent} · ${$('weather-state').textContent}`;
 $('fps').textContent=(state.paused||document.hidden||$('journal').open)?tr('渲染已暂停','Rendering paused'):`${state.fps} ${tr('帧/秒','fps')}`;
 $('load-metric').textContent=state.readyMs===null?'—':tr(`本次启动 ${(state.readyMs/1000).toFixed(1)} 秒`,`Startup ${(state.readyMs/1000).toFixed(1)}s`);
 $('payload').textContent=tr(`资源内容 ${(payload.bytes/1048576).toFixed(1)} MiB`,`Resource content ${(payload.bytes/1048576).toFixed(1)} MiB`);
}
function report(){return{project:'004-eanpa-sky / listening-garden',upstreamCommit:'a197d3dc42577e9b870b471a39d6b1710c5b5633',date:new Date().toISOString(),...state,acceptance:acceptanceMetrics(),audio:sound.snapshot(),resourceContentBytes:payload.bytes,loadedResources:payload.files,measurementNote:'Content bytes from loaded paths and pinned file sizes; not network transfer or VRAM. Startup includes this navigation only. FPS counts completed frames.',events:state.events.slice()};}
function showReport(){
 $('session-report').textContent=JSON.stringify({startupSeconds:state.readyMs===null?null:+(state.readyMs/1000).toFixed(2),resourceMiB:+(payload.bytes/1048576).toFixed(2),resourceFiles:payload.files.length,completedFrames:state.frames,lastFPS:state.fps,paused:state.paused,eventLog:state.eventLog,runtime:{...state.runtime,samples:state.runtime.samples.slice(-3)},acceptance:acceptanceMetrics(),weather:state.weather,time:state.hours,viewport:{width:innerWidth,height:innerHeight},budget:state.budget,quality:state.quality,adaptive:adaptive.snapshot(),reflectionBudget:state.reflectionBudget,stay:state.stay,view:state.view,camera:state.camera,sequence:state.sequence,atmosphere:state.atmosphere,lighting:state.lighting,lightOutput:state.lightOutput,layers:state.layers,audio:sound.snapshot(),errors:state.errors,observations:state.events.slice(-12)},null,2);
}
async function measure(){
 const paths=new Set(['/lab/',...performance.getEntriesByType('resource').map(r=>new URL(r.name).pathname)]);
 payload.files=[...paths].filter(p=>Object.hasOwn(sizes,p)).sort();payload.bytes=payload.files.reduce((sum,p)=>sum+sizes[p],0);updateText();
}
function fail(error){const message=String(error?.stack??error?.message??error);state.errors.push(message);state.paused=true;stage=[`启动或渲染失败：${message}`,`Startup or rendering failed: ${message}`];$('boot').hidden=false;$('boot').querySelector('.spinner').hidden=true;updateText();fetch('/__log',{method:'POST',body:JSON.stringify({source:'courtyard',error:message})}).catch(()=>{});console.error(error);}
addEventListener('error',e=>fail(e.error??e.message));addEventListener('unhandledrejection',e=>fail(e.reason));
function progress(zh,en){stage=[zh,en];updateText();}
translate();
$('sequence-stop').onclick=()=>{const kind=state.sequence?.kind??'rain';state.sequence=null;record(kind+'-sequence','stopped from HUD');updateText();};
$('controls-toggle').onclick=()=>{document.body.classList.toggle('controls-collapsed');updateText();};
$('panel-toggle').onclick=()=>{$('environment-panel').hidden=!$('environment-panel').hidden;updateText();};
$('applications-open').onclick=()=>{$('journal').showModal();updateText();showReport();$('applications').scrollIntoView({block:'start'});record('applications','opened');};
$('sound-toggle').onclick=async()=>{try{soundError=false;if(sound.snapshot().enabled)sound.mute();else{const starting=sound.enable();updateText();await starting;}record('audio',sound.snapshot().enabled);}catch(error){soundError=true;record('audio-error',String(error));}updateText();};
$('sound-volume').oninput=()=>{sound.setVolume(Number($('sound-volume').value)/100);updateText();};
$('sound-volume').onchange=()=>record('volume',Number($('sound-volume').value));
$('detail-volume').oninput=()=>{sound.setDetailVolume(Number($('detail-volume').value)/100);updateText();};
$('cinema-toggle').onclick=()=>{document.body.classList.toggle('cinema');updateText();};
addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('cinema');updateText();}});
$('sound-focus').onchange=()=>{sound.setFocus($('sound-focus').value);updateText();};
addEventListener('visibilitychange',updateText);addEventListener('pagehide',event=>{if(!event.persisted)sound.dispose();});
$('language').addEventListener('change',()=>{lang=$('language').value;try{localStorage.setItem('eanpa-research-language',lang);}catch{}translate();record('language',lang);});
$('journal-open').onclick=()=>{$('journal').showModal();record('journal','opened; rendering suspended');showReport();updateText();};
$('journal-close').onclick=()=>$('journal').close();$('journal').addEventListener('close',updateText);
$('export').onclick=()=>{record('export','session JSON');const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`eanpa-courtyard-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);showReport();};

const textures=new Map();globalThis.loadImageTexture=async(url,{srgb=false,mipmaps=false}={})=>{
 const key=url+srgb+mipmaps;if(textures.has(key))return textures.get(key);
 const promise=(async()=>{const response=await fetch(url);if(!response.ok)throw new Error(`Texture ${response.status}: ${url}`);const bitmap=await createImageBitmap(await response.blob());
  const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
  const {data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);bitmap.close();const bytes=new Uint8Array(data.length),row=width*4;
  for(let y=0;y<height;y++)bytes.set(data.subarray((height-1-y)*row,(height-y)*row),y*row);
  const texture=new T.DataTexture(bytes,width,height);texture.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;texture.generateMipmaps=mipmaps;texture.minFilter=mipmaps?T.LinearMipmapLinearFilter:T.LinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
 })();textures.set(key,promise);return promise;
};

try{
 sizes=await(await fetch('/lab/resource-sizes.json')).json();startupMark('Resource index');
 progress('初始化 WebGPU…','Initializing WebGPU…');
 const renderer=new T.WebGPURenderer({antialias:false,powerPreference:'high-performance'});await renderer.init();startupMark('WebGPU initialization');renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;
 $('scene').appendChild(renderer.domElement);renderer.backend.device.addEventListener('uncapturederror',e=>fail(e.error));
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.18,60000);scene.add(camera);
 const sun=new T.DirectionalLight(0xffffff,3),hemi=new T.HemisphereLight(0xa6c8ef,0x655447,1);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:300});scene.add(sun,sun.target,hemi);
 const wetReach=T.uniform(0),atmosphereTransition=makeAtmosphereTransition(state.atmosphere),soilMoisture=T.uniform(0),snowCover=T.uniform(0),courtyard=makeCourtyard(T,scene,snowCover,soilMoisture,wetReach),rainExperience=makeRainExperience(T,scene,snowCover),courtyardRain=makeCourtyardRain(T,scene),snowWeather=makeSnowWeather(T,scene,snowCover),hailWeather=makeHailWeather(T,scene),controls=new OrbitControls(camera,renderer.domElement);controls.maxDistance=100;controls.minDistance=1;controls.maxPolarAngle=Math.PI*.49;controls.target.fromArray(views.overview.target);camera.position.fromArray(views.overview.position);controls.update();
 addEventListener('pagehide',event=>{if(event.persisted)return;rainExperience.dispose();courtyardRain.dispose();snowWeather.dispose();hailWeather.dispose();});
 const quality=skyQualityPresets().balanced;quality.cloudShadowResolution=256;quality.weather={rainCount:5000,splashCount:350,rainRadius:28,rainHeight:20,transitionSeconds:12,surfaceResolution:512,surfaceRefreshHz:8};
 startupMark('Courtyard and host effects');
 progress('准备体积云与天气…','Preparing volumetric clouds and weather…');
 const active=await makeWeatherSky({scene,camera,sun,hemi,loadEngine:name=>import('/engine/'+name),quality,hours:state.hours,worldRayDir:true,cloudPreset:state.cloud,weatherState:'none',weatherOptions:{strikeTargets:()=>[courtyard.group],strikeHeightAt:null,onLocalStrike:()=>{record('lightning','local impact');$('action-note').textContent=tr('已观测到真实落雷；开启声音可听到延迟雷声','Actual strike observed; enable sound for delayed thunder');}}});
 startupMark('Sky creation and assets');
 await active.preloadWeather();startupMark('Weather assets');const sky=active.sky,weather=globalThis.__eanpaWeatherByScene.get(scene);for(const [name,values] of Object.entries({overcast:{sunDim:.38,hemiDim:.78,cloudRadiance:.88,greyTint:[.94,.98,1.02]},rain:{sunDim:.25,hemiDim:.61,cloudRadiance:.62,greyTint:[.83,.91,1]},storm:{sunDim:.12,hemiDim:.43,cloudRadiance:.38,greyTint:[.78,.85,.96]}}))Object.assign(weather.WEATHER[name],values);weather.wrapScene({budget:Infinity});active.update(0);sky.wrapCloudShadows(scene);
 startupMark('Material wrapping');
 const spatial=makeSpatialCloudPass(T,renderer,camera,{div:quality.cloudDiv});spatial.attach(scene,sky);
 const environment=makeReflectionEnvironment(T,renderer);const initial=environment.update(await sky.bakeEnv(renderer,{...quality.reflectionBake,assign:false}));
 startupMark('Initial sky environment bake');
 const matteEnvironment=makeMatteEnvironment(scene);matteEnvironment.setEnvironment(initial);
 const pipeline=makeNativeReflectionPipeline(T,renderer,scene,camera,sky,quality,fxaa,initial);pipeline.setEnvironment(initial);pipeline.localProbe?.configure({sampleGroundHeight:()=>0});
 state.reflectionBudget={environmentOnlyMaterials:matteEnvironment.count,policy:'Authored matte landscape/earth/snow use native sky lighting; wet paths, water and windows retain local-probe and screen-space reflections.'};
 startupMark('Reflection pipeline setup');
 let reflectionMultiplier=1,nextRuntimeSample=0;
 let nextEnvironment=quality.cloudReflectionRefreshSeconds,refreshEnvironment=false,resizePending=false,cameraMove=null,nextShelter=0,sheltered=0;
 const applyQuality=(mode,level=0)=>{const profile=mode==='eco'?{name:'eco',divisor:3,ao:false,reflectionMultiplier:2}:qualityLevels[level];spatial.setDivisor(profile.divisor);pipeline.setAOEnabled(profile.ao);pipeline.invalidateHistory();reflectionMultiplier=profile.reflectionMultiplier;nextEnvironment=Math.min(nextEnvironment,state.time+quality.cloudReflectionRefreshSeconds*reflectionMultiplier);state.quality={mode,...profile,frameCap:mode==='eco'?30:60};updateText();};
 applyQuality(state.budget);
 const rainRay=new T.Raycaster(),rainDirection=new T.Vector3();rainRay.far=64;
 const cameraSnapshot=()=>({position:camera.position.toArray().map(n=>+n.toFixed(4)),target:controls.target.toArray().map(n=>+n.toFixed(4))});
 const resumeForChange=()=>{if(state.paused){state.paused=false;record('resume','scene-control');updateText();}};
 let manualView=false,manualStart='';
 controls.addEventListener('start',()=>{cameraMove=null;manualView=true;manualStart=JSON.stringify(cameraSnapshot());resumeForChange();});
 controls.addEventListener('change',()=>{state.camera=cameraSnapshot();if(manualView&&state.view!=='free'&&JSON.stringify(state.camera)!==manualStart){state.view='free';updateText();}});
 controls.addEventListener('end',()=>{if(manualView&&state.view==='free')record('free-view',cameraSnapshot());manualView=false;});
 const pending=[];
 const queueLatest=(key,action)=>{for(let i=pending.length-1;i>=0;i--)if(pending[i].key===key)pending.splice(i,1);action.key=key;pending.push(action);};
 async function frame(dt){
  if(resizePending){resizePending=false;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);spatial.resize();pipeline.resize(innerWidth,innerHeight);}
  state.time+=dt;if($('cycle').checked){state.hours=(state.hours+dt*.2)%24;$('time').value=state.hours;active.setTime(state.hours);}
  if(cameraMove){cameraMove.elapsed+=dt;const t=Math.min(1,cameraMove.elapsed/1.1),smooth=t*t*(3-2*t);camera.position.lerpVectors(cameraMove.from,cameraMove.to,smooth);controls.target.lerpVectors(cameraMove.lookFrom,cameraMove.lookTo,smooth);controls.update();if(t===1)cameraMove=null;}
  if(lightningDemoAt!==null&&state.weather!=='storm')lightningDemoAt=null;
  if(lightningDemoAt!==null&&state.time>=lightningDemoAt){lightningDemoAt=null;const fired=weather.debugForceLocalStrike?.()??false;record('guided-lightning-trigger',fired);$('action-note').textContent=fired?tr('闪电已排队，请看前方天空','Strike queued; watch the sky ahead'):tr('雷暴尚未就绪，请再试一次','Storm not ready; try again');}
  if(state.sequence){const thaw=state.sequence.kind==='snowmelt',phase=(thaw?snowmeltSequencePhase:rainSequencePhase)(state.time-state.sequence.started);if(phase!==state.sequence.phase){if(phase==='complete'){record(thaw?'snowmelt-sequence':'rain-sequence','complete');state.sequence=null;}else{state.sequence.phase=phase;changeWeather('clear',true);if(thaw)chooseView('puddle');record(thaw?'snowmelt-sequence':'rain-sequence',thaw?'melting':'drying');}}}
  for(const action of pending.splice(0))await action();
  active.update(state.time);state.atmosphere=atmosphereTransition(state.weather,dt,weather.diagnostics?.transition);state.lightOutput=courtyard.update(state.time,state.hours,weather.uniforms.windVec.value.length(),state.lighting,dt);
  const listener=weather.listener?.stats;
  if(listener?.ready)sheltered=1-listener.exposure;
  else if(state.time>=nextShelter){nextShelter=state.time+.12;courtyard.group.updateMatrixWorld(true);const w=weather.uniforms.windVec.value;rainDirection.set(-w.x,Math.max(1,weather.uniforms.fallSpeed.value*weather.uniforms.fallMul.value),-w.z).normalize();rainRay.set(camera.position,rainDirection);sheltered=rainRay.intersectObjects(courtyard.rainOccluders,true).length?1:0;}
  // Listener readback can retain a quantized tail after rain stops. Bound it by current global rainfall.
  const localRain=Math.min(weather.uniforms.rainK.value,listener?.ready?listener.rain*listener.cell:weather.uniforms.rainK.value);
  rainExperience.landscape.visible=$('distance-enabled').checked;
  state.layers=rainExperience.update({time:state.time,dt,rain:localRain,globalRain:weather.uniforms.rainK.value,wind:weather.uniforms.windVec.value,enabled:$('eaves-enabled').checked});
  state.layers.snow=snowWeather.update({time:state.time,dt,cloud:state.atmosphere.cloud,enabled:state.weather==='snow',rain:weather.uniforms.rainK.value,wind:weather.uniforms.windVec.value,hours:state.hours,lights:state.lightOutput.levels,camera});
  state.layers.groundRain=courtyardRain.update({time:state.time,dt,meltwater:state.layers.snow.meltwaterDelta,cloud:state.atmosphere.cloud,rain:weather.uniforms.rainK.value,wind:weather.uniforms.windVec.value,hours:state.hours,lights:state.lightOutput.levels,camera,viewportHeight:innerHeight,wavesEnabled:$('waves-enabled').checked});
  state.layers.hail=hailWeather.update({time:state.time,dt,enabled:state.weather==='hail',rain:weather.uniforms.rainK.value,wind:weather.uniforms.windVec.value,hours:state.hours,lights:state.lightOutput.levels,water:state.layers.groundRain.puddleFill,snow:state.layers.snow.accumulation,camera});
  soilMoisture.value=state.layers.groundRain.soilMoisture;wetReach.value=state.layers.groundRain.wetReach;scene.fog.density=state.atmosphere.fog;state.layers.fogDensity=+scene.fog.density.toFixed(5);state.atmosphere.sunIntensity=+sun.intensity.toFixed(3);state.atmosphere.skyLightIntensity=+hemi.intensity.toFixed(3);
  state.layers.weatherTransition={...weather.diagnostics?.transition};
  state.layers.distanceEnabled=$('distance-enabled').checked;
  camera.updateMatrixWorld();
  sound.update({time:state.time,snow:state.layers.snow.intensity,hail:state.layers.hail.intensity,rain:localRain,wind:weather.uniforms.windVec.value.length(),camera:camera.position,right:{x:camera.matrixWorld.elements[0],z:camera.matrixWorld.elements[2]},strike:weather.diagnostics?.lightning?.lastStrike,sheltered,listenerSource:listener?.ready?'GPU rain cell and surface exposure':'geometry fallback',detailEvents:[...hailWeather.drainImpacts(),...rainExperience.drainImpacts()]});
  if(refreshEnvironment||state.time>=nextEnvironment){refreshEnvironment=false;const env=environment.update(await sky.bakeEnv(renderer,{...quality.reflectionBake,assign:false}));pipeline.setEnvironment(env);matteEnvironment.setEnvironment(env);nextEnvironment=state.time+quality.cloudReflectionRefreshSeconds*reflectionMultiplier;}
  scene.updateMatrixWorld(true);await weather.prepareFrame(renderer,camera);await sky.prepareCloudShadows(renderer,camera);await spatial.render();await pipeline.render();state.camera=cameraSnapshot();state.frames++;
  if(state.ready&&state.time>=nextRuntimeSample){nextRuntimeSample=state.time+5;state.runtime.totalSamples++;const heap=performance.memory;state.runtime.droppedSamples+=appendBounded(state.runtime.samples,{elapsedSeconds:+((performance.now()-state.runtime.startedAt)/1000).toFixed(1),simulationSeconds:+state.time.toFixed(2),frames:state.frames,weather:state.weather,quality:state.quality.name,memory:{...renderer.info.memory},jsHeapUsedBytes:heap?.usedJSHeapSize??null},state.runtime.sampleLimit);state.runtime.wallSeconds=+((performance.now()-state.runtime.startedAt)/1000).toFixed(1);}

 }
 progress('准备天空与云层 · 2 / 5 已完成','Preparing sky and clouds · 2 / 5 complete');
 const warm=active.weatherWarmupObjects(),visibility=warm.map(o=>o.visible);warm.forEach(o=>o.visible=true);await spatial.compileAsync();startupMark('Cloud pass compilation');progress('准备光线、雨滴与地面反光 · 3 / 5 已完成','Preparing lighting, rain and reflections · 3 / 5 complete');await pipeline.compileAsync(message=>{const labels={'preparing distant sky geometry…':['准备远景光线','Preparing distant lighting'],'preparing local reflections…':['准备院落反光','Preparing courtyard reflections'],'preparing surface lighting and weather…':['准备地表光照与天气','Preparing surface lighting and weather']};if(labels[message])progress(...labels[message]);});startupMark('Reflection and material compilation');progress('呈现第一帧并检查天气 · 4 / 5 已完成','Presenting the first frame and checking weather · 4 / 5 complete');await pipeline.render();startupMark('First pipeline render');
 for(let i=0;i<3;i++)await frame(1/60);warm.forEach((o,i)=>o.visible=visibility[i]);await renderer.backend.device.queue.onSubmittedWorkDone();startupMark('Three warmup frames and GPU completion');state.navigationToReadyMs=+performance.now().toFixed(1);
 state.runtime.startedAt=performance.now();state.ready=true;state.readyMs=performance.now()-started;record('ready','live weather engine; procedural courtyard');$('boot').hidden=true;$('environment-controls').disabled=false;$('scenario').disabled=false;await measure();
 const chooseView=name=>{resumeForChange();manualView=false;state.view=name;const view=views[name];if(matchMedia('(prefers-reduced-motion: reduce)').matches){cameraMove=null;camera.position.fromArray(view.position);controls.target.fromArray(view.target);controls.update();}else cameraMove={from:camera.position.clone(),to:new T.Vector3(...view.position),lookFrom:controls.target.clone(),lookTo:new T.Vector3(...view.target),elapsed:0};document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));record('view',name);};
 const freeMode=(keepSequence=false)=>{if(!keepSequence)state.sequence=null;state.scenario='free';$('scenario').value='free';};
 const changeTime=value=>{resumeForChange();state.hours=Number(value);$('time').value=state.hours;queueLatest('time',()=>{active.setTime(state.hours);refreshEnvironment=true;});updateText();};
 const chooseStop=name=>{document.body.classList.remove('inspect');const stop=stayStops[name];state.stay=name;freeMode();state.paused=false;transitionEnd=state.time+12;$('cycle').checked=false;state.weather=stop.weather;$('weather').value=stop.weather;changeTime(stop.hours);chooseView(stop.view);queueLatest('weather',async()=>{await active.setWeather(stop.weather);transitionEnd=state.time+12;});$('environment-panel').hidden=true;record('guest-stop',name);updateText();};
 document.querySelectorAll('[data-stop]').forEach(b=>{b.disabled=false;b.onclick=()=>chooseStop(b.dataset.stop);});
 $('stay-next').disabled=false;$('stay-next').onclick=()=>{const names=Object.keys(stayStops);chooseStop(names[(names.indexOf(state.stay)+1)%names.length]);};
 $('stay-action').disabled=false;$('stay-action').onclick=()=>{const response=stayResponse(state.weather,state.hours);chooseView(response.view);record('guest-weather-action',response.key);};
 $('coverage-open').onclick=()=>{$('journal').showModal();updateText();showReport();$('coverage').scrollIntoView({block:'start'});record('coverage','opened');};
 chooseStop('tea');changeTime(15.5);chooseView('rainporch');document.body.classList.add('inspect','controls-collapsed');
 document.querySelectorAll('[data-light-mode]').forEach(button=>{button.disabled=false;button.onclick=()=>{resumeForChange();state.lighting.mode=button.dataset.lightMode;refreshEnvironment=true;record('lighting-mode',state.lighting.mode);updateText();};});
 $('ripple-test').disabled=false;$('ripple-test').onclick=()=>{if(!$('waves-enabled').checked)$('waves-enabled').checked=true;const sent=courtyardRain.disturb();if(sent){state.paused=false;chooseView('puddle');}$('action-note').textContent=sent?tr('已在近处水洼投下一滴，观察波纹传播','A drop disturbed the near puddle; watch the wave spread'):tr('浅洼尚未蓄水，请先下雨一会儿','Let rain fill the puddle first');record('test-water-wave',sent);};
 $('light-brightness').oninput=()=>{state.lighting.brightness=Number($('light-brightness').value)/100;refreshEnvironment=true;updateText();};
 for(const zone of ['tea','path','rooms'])$('light-'+zone).onchange=()=>{state.lighting[zone]=$('light-'+zone).checked;refreshEnvironment=true;record('lighting-zone',{zone,on:state.lighting[zone]});updateText();};
 const changeWeather=(selected,fromSequence=false)=>{resumeForChange();freeMode(fromSequence);state.weather=selected;$('weather').value=selected;transitionEnd=state.time+12;lightningDemoAt=null;$('action-note').textContent='';queueLatest('weather',async()=>{await active.setWeather(engineWeatherFor(selected));transitionEnd=state.time+12;});record('weather',selected);updateText();};
 document.querySelectorAll('[data-condition]').forEach(button=>{button.disabled=false;button.onclick=()=>changeWeather(conditions[button.dataset.condition].weather);});
 const inspectRain=withLightning=>{document.body.classList.add('inspect');if(withLightning&&state.weather==='storm'&&state.time>=transitionEnd){state.paused=false;chooseView('lightning');lightningDemoAt=state.time+1.3;$('action-note').textContent=tr('请看前方天空，即将再次触发闪电','Watch ahead; another strike is about to trigger');record('rain-inspection','repeat-lightning');updateText();return;}freeMode();state.paused=false;$('cycle').checked=false;state.weather=withLightning?'storm':'rain';$('weather').value=state.weather;transitionEnd=state.time+12;chooseView(withLightning?'lightning':'rural');$('environment-panel').hidden=true;lightningDemoAt=null;$('action-note').textContent=withLightning?tr('准备雷暴，过渡后自动触发一次真实闪电','Preparing storm; a real strike follows the transition'):tr('观察泥地湿色、石径水花；浅洼水迹随降雨累积','Observe darker earth and stone splashes; water accumulates with rain');const selected=state.weather;queueLatest('weather',async()=>{await active.setWeather(engineWeatherFor(selected));transitionEnd=state.time+12;if(withLightning&&state.weather===selected)lightningDemoAt=state.time+12.7;});record('rain-inspection',withLightning?'lightning':'earth');updateText();};
 $('rain-complete').disabled=false;$('rain-complete').onclick=()=>{inspectRain(false);chooseView('rainporch');$('distance-enabled').checked=true;$('eaves-enabled').checked=true;$('action-note').textContent=tr('远山、院落雨幕、泥地与檐口滴水共同呈现；点击开启声音','Mountains, courtyard rain, earth and eave drops together; enable sound');};
 $('rain-inspect').disabled=false;$('rain-inspect').onclick=()=>inspectRain(false);
 $('lightning-inspect').disabled=false;$('lightning-inspect').onclick=()=>inspectRain(true);
 $('time').oninput=()=>{freeMode();$('cycle').checked=false;changeTime($('time').value);};$('time').onchange=()=>record('time',state.hours);
 document.querySelectorAll('[data-hour]').forEach(button=>{button.disabled=false;button.onclick=()=>{freeMode();$('cycle').checked=false;changeTime(button.dataset.hour);record('time',state.hours);};});
 $('sky-inspect').disabled=false;$('sky-inspect').onclick=()=>chooseView('sky');
 $('rain-sequence').disabled=false;$('rain-sequence').onclick=()=>{if(state.sequence&&state.sequence.kind!=='snowmelt'){state.sequence=null;record('rain-sequence','stopped');updateText();return;}changeWeather('rain');$('cycle').checked=false;chooseView('rural');state.sequence={started:state.time,phase:'rain'};record('rain-sequence','started; 40s rain then 70s clearing; time preserved');updateText();};
 $('thaw-sequence').disabled=false;$('thaw-sequence').onclick=()=>{if(state.sequence?.kind==='snowmelt'){state.sequence=null;record('snowmelt-sequence','stopped');updateText();return;}changeWeather('snow');$('cycle').checked=false;changeTime(12.5);chooseView('overview');state.sequence={kind:'snowmelt',started:state.time,phase:'snow'};record('snowmelt-sequence','45s snow then 90s clearing at 12:30; no water prefill');updateText();};
 $('weather').onchange=()=>changeWeather($('weather').value);
 $('cloud').onchange=()=>{freeMode();state.cloud=$('cloud').value;state.weather='none';$('weather').value='none';const selected=state.cloud;pending.push(async()=>{await active.setCloudPreset(selected);transitionEnd=state.time+12;});record('cloud',selected);updateText();};
 $('cycle').onchange=()=>{freeMode();record('cycle',$('cycle').checked);updateText();};
 $('scenario').onchange=()=>{state.sequence=null;state.scenario=$('scenario').value;const preset=scenarios[state.scenario];if(!preset.view){updateText();return;}state.paused=false;$('cycle').checked=false;state.weather=preset.weather;state.cloud='cumulus';$('weather').value=preset.weather;$('cloud').value='cumulus';changeTime(preset.hours);chooseView(preset.view);pending.push(async()=>{if(preset.weather==='none')await active.setCloudPreset('cumulus');else await active.setWeather(preset.weather);transitionEnd=state.time+12;});$('environment-panel').hidden=true;record('scenario',state.scenario);updateText();};
 $('budget').onchange=()=>{state.budget=$('budget').value;adaptive.reset();try{localStorage.setItem('eanpa-render-budget',state.budget);}catch{}queueLatest('quality',()=>applyQuality(state.budget));record('budget',state.budget);};
 $('pause-main').disabled=false;
 for(const id of ['environment-panel','light-brightness','light-tea','light-path','light-rooms'])for(const event of ['input','change'])$(id).addEventListener(event,resumeForChange,true);
 $('pause-main').onclick=$('pause').onclick=()=>{state.paused=!state.paused;record('pause',state.paused);updateText();};
 $('lightning').onclick=()=>{pending.push(()=>{const fired=weather.debugForceLocalStrike?.()??false;$('action-note').textContent=fired?tr('闪电已触发，请观察场景','Strike triggered; watch the scene'):tr('请先切换雷暴并等待过渡完成','Select Storm and wait for the transition');record('test-lightning',fired);});};
 document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>chooseView(button.dataset.view));
 addEventListener('resize',()=>{resizePending=true;});
 let busy=false,lastFrame=performance.now(),fpsAt=lastFrame,fpsFrames=state.frames;
 function loop(now){requestAnimationFrame(loop);
  if(state.paused||document.hidden||$('journal').open){adaptive.resetWindow();lastFrame=now;fpsAt=now;fpsFrames=state.frames;return;}
  if(busy||now-lastFrame<1000/(state.budget==='eco'?30:60)-1)return;
  const elapsed=Math.min((now-lastFrame)/1000,.1);lastFrame=now;busy=true;
  const frameStart=performance.now();frame(elapsed).catch(fail).finally(()=>{const ms=performance.now()-frameStart;measuredFrames++;totalFrameMs+=ms;if(ms>100)longFrames++;frameTimes.push(+ms.toFixed(2));if(frameTimes.length>300)frameTimes.shift();if(state.budget==='auto'&&!state.paused&&!document.hidden&&!$('journal').open&&state.time>=transitionEnd&&!cameraMove&&!manualView&&!resizePending){const decision=adaptive.sample(performance.now(),ms);if(decision){queueLatest('quality',()=>applyQuality(state.budget,decision.level));record('auto-quality',decision);}}else adaptive.resetWindow();busy=false;});
  if(now-fpsAt>=1000){state.fps=Math.round((state.frames-fpsFrames)*1000/(now-fpsAt));fpsAt=now;fpsFrames=state.frames;updateText();}
 }
 requestAnimationFrame(loop);setInterval(()=>{measure();if($('journal').open)showReport();},3000);
}catch(error){fail(error);}
