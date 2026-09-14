import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {V,createSpatial,createFoundation,mat,terrainPresets} from './scene-world.mjs';
import {createTrain} from './scene-train.mjs';
import {createLandscape} from './scene-landscape.mjs';
import {createRain,createGlow} from './scene-atmosphere.mjs';
import {windResponse} from './scene-vegetation.mjs';
import {seasons,blendSeason,bindSeasonSurface} from './scene-seasons.mjs';
import {createSeasonDetails,detailVisibility} from './scene-details.mjs';
import {stageDefinitions} from './scene-service.mjs';
import {regionViews} from './scene-regions.mjs';
import {compositions,createCompositionSettings,lightingModes,resolveLighting} from './scene-composition.mjs';
import {waterModes,createWaterTuning} from './scene-water-modes.mjs';
import {validatePlan} from './scene-plans.mjs';
import {mountPlans} from './scene-plans-ui.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
async function start(){
 let planManager;
 const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.NoToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#a7baab');scene.fog=new THREE.FogExp2('#a7baab',.0026);const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.2,700);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=10;controls.maxDistance=300;controls.maxPolarAngle=Math.PI*.49;controls.panSpeed=.6;controls.zoomSpeed=.75;
 const sun=new THREE.DirectionalLight('#ffe1aa',3.1);sun.position.set(-38,65,32);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:55,bottom:-55,near:1,far:200});sun.shadow.normalBias=.11;sun.shadow.bias=-.00008;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;
 const hemi=new THREE.HemisphereLight('#d8e5e6','#435944',1.75);scene.add(sun,hemi);const groundMaterial=mat('#a7baab',1),ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-5.91;ground.receiveShadow=true;scene.add(ground);
 const waterTuning=createWaterTuning(),compositionSettings=createCompositionSettings(),terrainConfig=compositionSettings.get('ridge');let rebuildTimer;
 const shared={reflectionPass:{value:0},waterThickness:{value:.65},waterFoam:{value:.5},waterMist:{value:.45},waterReflection:{value:.6},waterRipple:{value:.4},time:{value:0},wind:{value:.45},windDir:{value:new THREE.Vector2(1,0)},gust:{value:.6},flow:{value:1},rain:{value:0},night:{value:0},wet:{value:0},season:{value:new THREE.Vector4(0,0,1,0)},detailAmount:{value:.6},litter:{value:.6}};
 await new Promise(requestAnimationFrame);let world=createSpatial(terrainConfig),landscape=createLandscape(scene,world,shared),foundation=createFoundation(scene,world);const train=createTrain(scene,world,foundation.bridgeU-.025),rain=createRain(scene,shared),glow=createGlow(renderer),seasonDetails=createSeasonDetails(scene,shared,world,landscape.anchors);
 const surfaceMaterials=new WeakSet();function wetMaterials(root){root.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.isMeshStandardMaterial&&!surfaceMaterials.has(m)){surfaceMaterials.add(m);const original=m.onBeforeCompile,baseKey=m.customProgramCacheKey();m.customProgramCacheKey=()=>baseKey+'-scene-wet-v1';m.onBeforeCompile=function(shader,...args){original.call(this,shader,...args);shader.uniforms.uSceneWet=shared.wet;shader.fragmentShader='uniform float uSceneWet;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,max(.19,roughnessFactor*.45),uSceneWet*.75);').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.-uSceneWet*.12;');};bindSeasonSurface(m,shared);}}}});}wetMaterials(scene);
 const modes=lightingModes;
 const state={fog:1,season:'autumn',stage:5,mode:'evening',speed:1,wind:.45,rain:0,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,auto:false,view:'overview',wireframe:false,wildlife:true,fish:true};let elapsed=0,last=performance.now(),tween=null,lastAuto=0,autoShot='',lastShadow=0,lastReport=0,frames=0;
 const presets={overview:{position:V(...world.composition.camera.position),target:V(...world.composition.camera.target)},bridge:{position:world.curve.getPointAt(foundation.bridgeU).add(V(12,10,28)),target:world.curve.getPointAt(foundation.bridgeU).add(V(0,1,0))},station:{position:landscape.stationTarget.clone().add(V(19,9,15)),target:landscape.stationTarget.clone()},waterfall:{position:V(world.riverX(-3)+1,world.waterLevel(-3)+7.3,18),target:V(world.riverX(-3),world.waterLevel(-3),-3)},wind:{position:V(world.riverX(10)+2,7.5,13),target:V(world.riverX(10)+world.halfWidth(10)+3,3.4,8)}};
 function regionPresets(){const h=landscape.wildlife.habitat;presets.fish={target:landscape.fish.habitat.target.clone(),position:landscape.fish.habitat.target.clone().add(V(1,10,4))};presets.wildlife={target:h.waterTarget.clone(),position:h.waterTarget.clone().add(V(3,8,7))};presets.birds={target:h.birdTarget.clone(),position:h.birdTarget.clone().add(V(24,10,29))};for(const [name,shot] of Object.entries(regionViews(world)))presets[name]={position:V(...shot.position),target:V(...shot.target)};}regionPresets();
 function fitted(shot){const target=shot.target.clone(),position=target.clone().add(shot.position.clone().sub(target).multiplyScalar(Math.max(1,1.07/camera.aspect)));return{position,target}}
 function viewport(){camera.aspect=innerWidth/innerHeight;camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.12,innerWidth,innerHeight);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
 function goView(name,instant=false){state.view=name;$('#camera-view').value=name;if(name==='train'||name==='free'){tween=null;return}const shot=fitted(presets[name]);if(instant){camera.position.copy(shot.position);controls.target.copy(shot.target);controls.update();tween=null;return}let lift=0;for(let i=1;i<32;i++){const f=i/32,p=camera.position.clone().lerp(shot.position,f);if(world.footprint(p.x,p.z))lift=Math.max(lift,(world.height(p.x,p.z)+3-p.y)/Math.pow(Math.sin(Math.PI*f),.5));}tween={from:camera.position.clone(),fromTarget:controls.target.clone(),to:shot.position,target:shot.target,at:performance.now(),lift:Math.max(0,lift),duration:2800};}
 function mode(name){document.documentElement.dataset.environmentReady='false';state.mode=name;$('#lighting-note').textContent=seasons[state.season].name+' / '+modes[name].name+($('#season-lighting').checked?' · 随季节推荐':' · 手动光线');state.rain=modes[name].rain;$('#rain').value=state.rain*100;$('#rain-value').value=Math.round(state.rain*100)+'%';$$('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===name)))}
 function setStage(value){const n=Math.max(1,Math.min(5,Number(value)));state.stage=n;train.group.visible=n>=2;landscape.group.visible=n>=3;rain.group.visible=n>=4;if(n<5){state.auto=false;$('#auto-camera').checked=false;goView('overview',true)}const d=stageDefinitions[n-1];$('#step-count').textContent=`STEP 0${n} / 05`;$('#step-title').textContent=d.title;$('#step-description').textContent=d.description;$('#step-added').textContent='当前新增：'+d.added;$('#environment-controls').disabled=n<4;$('#train-speed').disabled=n<2;$('#wind').disabled=n<3;$('#rain').disabled=n<4;$('#camera-controls').disabled=n<5;$('#previous').disabled=n===1;$('#next').disabled=n===5;$('#next').textContent=n===5?'已完成搭建':'下一步 →';$('#show-complete').hidden=n===5;$('#stages').innerHTML=stageDefinitions.map((s,i)=>`<button data-stage="${i+1}" aria-current="${n===i+1?'step':'false'}" class="${i+1<n?'complete':''}"><span>0${i+1}</span>${s.short}</button>`).join('');$('#control-note').textContent=n<4?'按步骤加入下一层，控制项会随实际能力启用。':'参数直接作用于当前三维场景。拖动可以接管镜头。';document.documentElement.dataset.stage=String(n);sun.shadow.needsUpdate=true;}
 $('#stages').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(b)setStage(b.dataset.stage)});$('#next').onclick=()=>setStage(state.stage+1);$('#previous').onclick=()=>setStage(state.stage-1);$('#show-complete').onclick=()=>setStage(5);$$('button[data-mode]').forEach(b=>b.onclick=()=>{$('#season-lighting').checked=false;mode(b.dataset.mode)});$('#train-speed').oninput=e=>{state.speed=+e.target.value;$('#speed-value').value=state.speed+'×'};$('#wind').oninput=e=>{state.wind=+e.target.value/100;$('#wind-value').value=e.target.value+'%'};$('#rain').oninput=e=>{state.rain=+e.target.value/100;$('#rain-value').value=e.target.value+'%'};
 function pause(){state.paused=!state.paused;$('#pause').setAttribute('aria-pressed',String(state.paused));$('#pause').textContent=state.paused?'继续场景':'暂停场景'}$('#pause').onclick=pause;$('#inspect-station').onclick=()=>{train.service.park();if(!state.paused)pause();state.auto=false;$('#auto-camera').checked=false;if(state.stage<3)setStage(5);goView('station');};if(state.paused){state.paused=false;pause()}
 $('#wireframe').onchange=e=>{state.wireframe=e.target.checked;scene.traverse(o=>{if(o.isMesh&&o!==ground){for(const m of Array.isArray(o.material)?o.material:[o.material]){if('wireframe'in m)m.wireframe=state.wireframe}}});sun.shadow.needsUpdate=true};$('#reset-view').onclick=()=>{state.auto=false;$('#auto-camera').checked=false;goView('overview')};$('#camera-view').onchange=e=>{state.auto=false;$('#auto-camera').checked=false;goView(e.target.value)};$('#auto-camera').onchange=e=>{state.auto=e.target.checked;lastAuto=-Infinity};controls.addEventListener('start',()=>{state.auto=false;$('#auto-camera').checked=false;tween=null;state.view='free';$('#camera-view').value='free'});
 $('#toggle-controls').onclick=()=>{const narrow=innerWidth<=560;const open=narrow?document.body.classList.toggle('controls-open'):!document.body.classList.toggle('controls-hidden');$('#toggle-controls').setAttribute('aria-expanded',String(open))};
 addEventListener('keydown',e=>{if(planManager?.comparing())return;if(e.target.matches('input,select,button,textarea'))return;if(e.code==='Space'){e.preventDefault();pause()}});addEventListener('resize',()=>{viewport();if(state.view==='overview')goView('overview',true)});viewport();goView('overview',true);
 const tempColor=new THREE.Color();function lighting(dt){const theme=seasons[state.season],m=resolveLighting(world.config.composition,theme,state.stage>=4?state.mode:'day'),k=1-Math.exp(-dt*1.6);shared.season.value.fromArray(blendSeason(shared.season.value.toArray(),theme.weights,dt));seasonDetails.group.visible=state.stage>=3;seasonDetails.update();shared.night.value=THREE.MathUtils.lerp(shared.night.value,state.stage>=4?m.night:0,k);shared.rain.value=THREE.MathUtils.lerp(shared.rain.value,state.stage>=4?state.rain:0,k);shared.wind.value=state.stage>=3?state.wind:0;shared.wet.value=THREE.MathUtils.lerp(shared.wet.value,state.stage>=4?Math.max(m.wet,state.rain,theme.wet||0):0,k*.45);scene.background.lerp(tempColor.set(m.sky),k);scene.fog.color.copy(scene.background);scene.fog.density=THREE.MathUtils.lerp(scene.fog.density,m.fog*state.fog/Math.max(1,1.07/camera.aspect),k);groundMaterial.color.copy(scene.background).multiplyScalar(.86);sun.color.lerp(tempColor.set(m.sun),k);sun.intensity=THREE.MathUtils.lerp(sun.intensity,m.power,k);sun.position.lerp(V(...m.pos),k);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,m.ambient,k);}


 function release(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [...(Array.isArray(o.material)?o.material:o.material?[o.material]:[]),o.customDepthMaterial].filter(Boolean)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}});root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 function rebuild(){document.documentElement.dataset.environmentReady='false';
  const oldFoundation=foundation,oldLandscape=landscape;
  world=createSpatial(terrainConfig);landscape=createLandscape(scene,world,shared);foundation=createFoundation(scene,world);wetMaterials(foundation.group);wetMaterials(landscape.group);
  seasonDetails.setWorld(world,landscape.anchors);oldLandscape.dispose();release(oldFoundation.group);release(oldLandscape.group);
  foundation.group.visible=true;landscape.group.visible=state.stage>=3;landscape.wildlife.group.visible=state.wildlife;landscape.fish.group.visible=state.fish;
  if(state.wireframe){for(const root of[foundation.group,landscape.group])root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&'wireframe'in m)m.wireframe=true})}
  regionPresets();presets.overview.position.set(...world.composition.camera.position);presets.overview.target.set(...world.composition.camera.target);
  presets.waterfall.target.set(world.riverX(-3),world.waterLevel(-3),-3);presets.waterfall.position.copy(presets.waterfall.target).add(V(1,7.3,21));
  presets.wind.position.set(world.riverX(10)+2,7.5,13);presets.wind.target.set(world.riverX(10)+world.halfWidth(10)+3,3.4,8);
  $('#effective-drop').value=world.effectiveDrop.toFixed(1)+' m';
  sun.shadow.needsUpdate=true;$('#terrain-feedback').textContent=`已更新 · ${landscape.trees} 棵树 / ${landscape.reeds} 丛苇叶`;document.documentElement.dataset.rebuild=String(+(document.documentElement.dataset.rebuild||0)+1);
 }
 const terrainFields={relief:'terrain-height',width:'river-width',bend:'river-bend',fall:'water-drop',density:'tree-density'};
 function syncTerrain(){for(const[key,id]of Object.entries(terrainFields)){$('#'+id).value=terrainConfig[key];$('#'+id+'-value').value=terrainConfig[key]+(key==='density'?' 棵':key==='relief'?'×':' m')}}
 for(const[key,id]of Object.entries(terrainFields))$('#'+id).oninput=e=>{terrainConfig[key]=+e.target.value;syncTerrain();$('#terrain-preset').value='custom';$('#terrain-feedback').textContent='正在调整地形…';clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuild,220)};
 const tuningFields={thickness:'waterThickness',foam:'waterFoam',mist:'waterMist',reflection:'waterReflection',ripple:'waterRipple'};
 function syncWaterTuning(){const values=waterTuning.get(terrainConfig.waterMode);for(const [key,uniform] of Object.entries(tuningFields)){shared[uniform].value=values[key];$('#water-'+key).value=Math.round(values[key]*100);$('#water-'+key+'-value').value=Math.round(values[key]*100)+'%';}}
 for(const [key,uniform] of Object.entries(tuningFields))$('#water-'+key).oninput=e=>{const v=+e.target.value/100;waterTuning.set(terrainConfig.waterMode,key,v);shared[uniform].value=v;$('#water-'+key+'-value').value=e.target.value+'%';};
 $('#reset-water-tuning').onclick=()=>{waterTuning.reset(terrainConfig.waterMode);syncWaterTuning();$('#water-tuning-status').textContent='已恢复当前模式默认值。';};syncWaterTuning();
 $$('button[data-water-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.waterMode===terrainConfig.waterMode)return;terrainConfig.waterMode=b.dataset.waterMode;syncWaterTuning();$('#water-tuning-status').textContent='各模式分别记住本次打开页面后的调节值。';state.auto=false;$('#auto-camera').checked=false;tween=null;clearTimeout(rebuildTimer);rebuild();$$('button[data-water-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#water-mode-note').textContent=waterModes[terrainConfig.waterMode].note;});
 function syncCompositionWater(){syncWaterTuning();$$('button[data-water-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.waterMode===terrainConfig.waterMode)));$('#water-mode-note').textContent=waterModes[terrainConfig.waterMode].note;}
 $('#composition').onchange=e=>{
  compositionSettings.save(terrainConfig.composition,terrainConfig);Object.assign(terrainConfig,compositionSettings.get(e.target.value));
  syncTerrain();syncCompositionWater();$('#terrain-preset').value='custom';$('#composition-note').textContent=compositions[e.target.value].note;
  state.auto=false;$('#auto-camera').checked=false;clearTimeout(rebuildTimer);rebuild();goView('overview',true);
 };
 $('#season-lighting').onchange=e=>{if(e.target.checked)mode(seasons[state.season].mode);else $('#lighting-note').textContent=seasons[state.season].name+' / '+modes[state.mode].name+' · 手动光线';};
 $('#water-mode-focus').onclick=()=>{if(state.stage<3)setStage(3);goView('waterfall')};
 $('#terrain-preset').onchange=e=>{Object.assign(terrainConfig,terrainPresets[e.target.value]);syncTerrain();clearTimeout(rebuildTimer);rebuild()};syncTerrain();syncCompositionWater();$('#terrain-preset').value='custom';$('#effective-drop').value=world.effectiveDrop.toFixed(1)+' m';
 $('#wind-direction').oninput=e=>{const a=+e.target.value*Math.PI/180;shared.windDir.value.set(Math.cos(a),Math.sin(a));$('#wind-direction-value').value=e.target.value+'°'};
 $('#gust').oninput=e=>{shared.gust.value=+e.target.value/100;$('#gust-value').value=e.target.value+'%'};
 $('#water-flow').oninput=e=>{shared.flow.value=+e.target.value;$('#water-flow-value').value=e.target.value+'×'};
 $$('button[data-quality-view]').forEach(b=>b.onclick=()=>{if(state.stage<5)setStage(5);state.auto=false;$('#auto-camera').checked=false;goView(b.dataset.qualityView)});
 $('#fish-enabled').onchange=e=>{state.fish=e.target.checked;landscape.fish.group.visible=state.fish;};
 $('#wildlife-enabled').onchange=e=>{state.wildlife=e.target.checked;landscape.wildlife.group.visible=state.wildlife;};
 $$('button[data-animal-view]').forEach(b=>b.onclick=()=>{if(b.dataset.animalView==='fish'){state.fish=true;$('#fish-enabled').checked=true;landscape.fish.group.visible=true;}else{state.wildlife=true;$('#wildlife-enabled').checked=true;landscape.wildlife.group.visible=true;}if(state.stage<5)setStage(5);state.auto=false;$('#auto-camera').checked=false;goView(b.dataset.animalView);});
 $('#wind-focus').onclick=()=>{if(state.stage<3)setStage(3);goView('wind')};
 $('#toggle-steps').onclick=()=>{const open=document.body.classList.toggle('steps-expanded');$('#toggle-steps').textContent=open?'收起步骤':'展开五步搭建';$('#toggle-steps').setAttribute('aria-expanded',String(open))};
 const envScene=new THREE.Scene(),skyGeo=new THREE.SphereGeometry(100,32,16),skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vDirection;void main(){vec3 d=normalize(vDirection);vec3 c=mix(vec3(.82,.91,1.),vec3(.16,.38,.63),smoothstep(0.,.9,d.y));c=mix(vec3(.18,.23,.16),c,smoothstep(-.15,.08,d.y));c+=vec3(5.,4.5,3.6)*pow(max(0.,dot(d,normalize(vec3(-.4,.8,.3)))),700.);gl_FragColor=vec4(c,1.);}'});
 envScene.add(new THREE.Mesh(skyGeo,skyMat));const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene);scene.environment=environment.texture;scene.environmentIntensity=.27;skyGeo.dispose();skyMat.dispose();pmrem.dispose();


 function chooseSeason(name){
  const theme=seasons[name];if(!theme)return;document.documentElement.dataset.environmentReady='false';state.season=name;if($('#season-lighting').checked)mode(theme.mode);else $('#lighting-note').textContent=theme.name+' / '+modes[state.mode].name+' · 手动光线';state.wind=theme.wind;shared.flow.value=theme.flow;
  $('#wind').value=state.wind*100;$('#wind-value').value=Math.round(state.wind*100)+'%';$('#water-flow').value=theme.flow;$('#water-flow-value').value=theme.flow+'×';
  $$('button[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.season===name)));$('#season-note').textContent=theme.note;
  document.documentElement.dataset.season=name;
  if($('#season-fixed-view').checked){state.auto=false;$('#auto-camera').checked=false;goView('overview',true)}
  sun.shadow.needsUpdate=true;
 }
 $$('button[data-season]').forEach(b=>b.onclick=()=>chooseSeason(b.dataset.season));
 $('#detail-amount').oninput=e=>{shared.detailAmount.value=+e.target.value/100;$('#detail-amount-value').value=e.target.value+'%'};
 $('#ground-litter').oninput=e=>{shared.litter.value=+e.target.value/100;$('#ground-litter-value').value=e.target.value+'%'};
 $('#fog-amount').oninput=e=>{state.fog=+e.target.value/100;$('#fog-amount-value').value=e.target.value+'%'};
 $('#summer-night').onclick=()=>{chooseSeason('summer');$('#season-lighting').checked=false;mode('night');$('#season-note').textContent='夏夜河岸 · 闪烁萤火、冷色水面与沿岸灯光';goView('waterfall')};
 $('#detail-focus').onclick=()=>goView('wind');



 function capturePlan(name){
  compositionSettings.save(terrainConfig.composition,terrainConfig);
  return validatePlan({kind:'egret-scene',schemaVersion:1,name,composition:terrainConfig.composition,
   compositions:Object.fromEntries(Object.keys(compositions).map(id=>[id,compositionSettings.get(id)])),
   waterTuning:Object.fromEntries(Object.keys(waterModes).map(id=>[id,waterTuning.get(id)])),
   environment:{season:state.season,mode:state.mode,recommendedLight:$('#season-lighting').checked,fixedSeasonView:$('#season-fixed-view').checked,wind:state.wind,direction:+$('#wind-direction').value,gust:shared.gust.value,flow:shared.flow.value,rain:state.rain,fog:state.fog,detail:shared.detailAmount.value,litter:shared.litter.value,wildlife:state.wildlife,fish:state.fish},
   observation:{stage:state.stage,speed:state.speed,paused:state.paused,auto:state.auto,wireframe:state.wireframe,view:state.view},camera:{position:camera.position.toArray(),target:controls.target.toArray()}});
 }
 function applyPlanData(p){
  clearTimeout(rebuildTimer);tween=null;
  for(const[id,c]of Object.entries(p.compositions))compositionSettings.save(id,c);
  for(const[id,values]of Object.entries(p.waterTuning))for(const[k,v]of Object.entries(values))waterTuning.set(id,k,v);
  Object.assign(terrainConfig,p.compositions[p.composition]);const e=p.environment,o=p.observation;
  Object.assign(state,{season:e.season,mode:e.mode,wind:e.wind,rain:e.rain,fog:e.fog,wildlife:e.wildlife??true,fish:e.fish??true,...o});
  $('#wildlife-enabled').checked=state.wildlife;$('#fish-enabled').checked=state.fish;
  shared.gust.value=e.gust;shared.flow.value=e.flow;shared.detailAmount.value=e.detail;shared.litter.value=e.litter;
  shared.windDir.value.set(Math.cos(e.direction*Math.PI/180),Math.sin(e.direction*Math.PI/180));
  $('#composition').value=p.composition;$('#composition-note').textContent=compositions[p.composition].note;$('#terrain-preset').value='custom';
  $('#season-lighting').checked=e.recommendedLight;$('#season-fixed-view').checked=e.fixedSeasonView;
  $$('button[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.season===e.season)));
  $$('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===e.mode)));
  $('#season-note').textContent=seasons[e.season].note;$('#lighting-note').textContent=seasons[e.season].name+' / '+modes[e.mode].name+(e.recommendedLight?' · 随季节推荐':' · 手动光线');
  for(const[id,value,suffix,output]of [['wind',e.wind*100,'%','wind-value'],['wind-direction',e.direction,'°','wind-direction-value'],['gust',e.gust*100,'%','gust-value'],['water-flow',e.flow,'×','water-flow-value'],['rain',e.rain*100,'%','rain-value'],['fog-amount',e.fog*100,'%','fog-amount-value'],['detail-amount',e.detail*100,'%','detail-amount-value'],['ground-litter',e.litter*100,'%','ground-litter-value'],['train-speed',o.speed,'×','speed-value']]){$('#'+id).step='any';$('#'+id).value=value;$('#'+output).value=Number(value.toFixed(3))+suffix;}
  for(const input of $$('.scene-controls input[type=range]'))input.step='any';
  syncTerrain();syncCompositionWater();rebuild();setStage(o.stage);
  $('#wireframe').checked=o.wireframe;$('#wireframe').onchange({target:$('#wireframe')});
  state.auto=o.auto;$('#auto-camera').checked=o.auto;lastAuto=elapsed;autoShot='';
  state.view=o.view;$('#camera-view').value=o.view;tween=null;
  // Clear residual orbit damping before restoring the exact saved pose.
  const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
  camera.position.fromArray(p.camera.position);controls.target.fromArray(p.camera.target);controls.update();controls.enableDamping=damping;
  $('#pause').setAttribute('aria-pressed',String(o.paused));$('#pause').textContent=o.paused?'继续场景':'暂停场景';
  lighting(50);sun.shadow.needsUpdate=true;document.documentElement.dataset.planApplied=String(+(document.documentElement.dataset.planApplied||0)+1);
 }
 function applyPlan(input,{sameCamera=false}={}){const p=validatePlan(input);if(sameCamera){const checkWorld=createSpatial(p.compositions[p.composition]),[x,y,z]=p.camera.position;if(checkWorld.footprint(x,z)&&y<checkWorld.height(x,z)+2.5)throw new Error('当前近景会进入基准地形，请先切换全景再比较。');}const previous=capturePlan('恢复前');try{applyPlanData(p)}catch(error){console.error("方案应用失败",error);try{applyPlanData(previous)}catch(rollbackError){console.error("方案回退失败",rollbackError);throw new Error('场景恢复遇到错误，请刷新后从已保存方案重试。')}throw new Error('方案未能应用，已恢复修改前设置：'+error.message)}}
 const disabledBefore=new Map();
 function lockPlanPreview(locked){
  controls.enabled=!locked;
  for(const child of $('#scene-control-panel').children)if(child.id!=='plan-panel')child.inert=locked;
  $('.build-panel').inert=locked;
  for(const input of $$('#plan-panel input,#plan-panel select,#plan-panel textarea,#plan-panel button'))if(input.id!=='plan-compare'){if(locked){disabledBefore.set(input,input.disabled);input.disabled=true}else input.disabled=disabledBefore.get(input)??false;}
  document.documentElement.dataset.planPreview=String(locked);
 }

 await renderer.compileAsync(scene,camera);setStage(5);chooseSeason('autumn');lighting(50);planManager=mountPlans({capture:capturePlan,apply:applyPlan,lock:lockPlanPreview});$('#loading').hidden=true;document.documentElement.dataset.ready='true';last=performance.now();
 function animate(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!state.paused)elapsed+=dt;shared.time.value=elapsed;lighting(dt);train.update(dt,elapsed,{speed:state.speed,paused:state.paused||state.stage<2,night:state.stage>=4?shared.night.value:0});landscape.update(elapsed,state.stage>=4?shared.night.value:0);rain.update();
 if(state.stage>=5&&state.auto&&!state.paused){const p=train.cars[0].position,desired=train.service.status.includes('站')?'station':world.bridge(p)?'bridge':train.service.progress>.28&&train.service.progress<.55?'waterfall':'overview';if(desired!==autoShot&&elapsed-lastAuto>8){goView(desired);autoShot=desired;lastAuto=elapsed}}
 if(tween){const t=Math.min(1,(now-tween.at)/tween.duration),e=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,e);camera.position.y+=Math.sin(Math.PI*e)**.5*tween.lift;controls.target.lerpVectors(tween.fromTarget,tween.target,e);if(t===1)tween=null;}else if(state.stage>=5&&state.view==='train'){const outward=V(train.focus.x,0,train.focus.z).normalize().multiplyScalar(20),tangent=world.curve.getTangentAt(train.service.progress).multiplyScalar(-7);camera.position.lerp(train.focus.clone().add(outward).add(tangent).add(V(0,14,0)),1-Math.exp(-dt*2));controls.target.lerp(train.focus,1-Math.exp(-dt*3));}
 if(world.footprint(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,world.height(camera.position.x,camera.position.z)+2.5);controls.update();if(now-lastShadow>80){sun.shadow.needsUpdate=true;lastShadow=now}if(state.stage>=3)landscape.reflect(renderer,scene,camera,now);glow.render(scene,camera,shared.night.value,state.stage>=4);frames++;
 if(now-lastReport>500){$('#journey').textContent=state.stage<2?'地形与轨道已建立':state.paused?'场景已暂停':world.bridge(train.cars[0].position)?'正在经过峡谷桥':train.service.status;Object.assign(document.documentElement.dataset,{environmentReady:shared.season.value.toArray().every((v,i)=>Math.abs(v-seasons[state.season].weights[i])<.003)&&Math.abs(sun.intensity-resolveLighting(world.config.composition,seasons[state.season],state.stage>=4?state.mode:'day').power)<.01,composition:world.config.composition,seasonLighting:$('#season-lighting').checked,lightPower:sun.intensity.toFixed(3),ambientPower:hemi.intensity.toFixed(3),waterThickness:shared.waterThickness.value,waterFoam:shared.waterFoam.value,waterMist:shared.waterMist.value,waterReflection:shared.waterReflection.value,waterRipple:shared.waterRipple.value,waterMode:world.config.waterMode,effectiveDrop:world.effectiveDrop,season:state.season,winterCover:shared.season.value.w.toFixed(3),detailAmount:shared.detailAmount.value,groundLitter:shared.litter.value,fogAmount:state.fog,detailParticles:seasonDetails.stats.particles,groundLeaves:seasonDetails.stats.groundLeaves,fireflies:detailVisibility(shared.season.value.toArray(),shared.night.value).fireflies.toFixed(3),mode:state.mode,progress:train.service.progress.toFixed(5),speed:train.service.speed.toFixed(3),stops:train.service.stops,night:shared.night.value.toFixed(3),rain:shared.rain.value.toFixed(3),shrubs:landscape.shrubs,grass:landscape.grass,trees:landscape.trees,reeds:landscape.reeds,relief:world.config.relief,riverWidth:world.config.width,wind:shared.wind.value.toFixed(2),windDirection:$('#wind-direction').value,gust:shared.gust.value,wildlife:state.wildlife,birds:landscape.wildlife.stats.birds,ducks:landscape.wildlife.stats.ducks,animalSpeed:landscape.wildlife.stats.flightSpeed.toFixed(2),fishEnabled:state.fish,fish:landscape.fish.stats.count,flow:shared.flow.value,fps:(frames*1000/Math.max(1,now-lastReport)).toFixed(1),view:state.view});$('#wind-feedback').textContent=`当前阵风 ${(windResponse(elapsed,0,0,state.wind,shared.gust.value)*100).toFixed(0)}% · 柳树弯曲强于乔木 · 芦苇最明显`;$('#fish-feedback').textContent=state.fish?`${landscape.fish.stats.count} 条水下鱼 · ${landscape.fish.stats.activity} · 水层越厚、反光越强，越难看清`:'鱼群已隐藏';const a=landscape.wildlife.stats;$('#wildlife-feedback').textContent=state.wildlife?`${a.birds} 只白鹭盘旋 · ${a.ducks} 只野鸭 · ${a.activity}${a.birds?' · 飞行约 '+a.flightSpeed.toFixed(1)+' m/s':''}`:'动物已隐藏';frames=0;lastReport=now;}requestAnimationFrame(animate)}requestAnimationFrame(animate);
}
start().catch(error=>{$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent='场景暂时无法启动：'+error.message+'。请使用支持 WebGL 2 的浏览器，或刷新重试。';console.error(error)});
