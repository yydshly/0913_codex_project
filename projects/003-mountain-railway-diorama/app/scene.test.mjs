import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createSpatial,createFoundation,terrainPresets} from './scene-world.mjs';import {createService,stageDefinitions} from './scene-service.mjs';
import {windResponse} from './scene-vegetation.mjs';
const world=createSpatial();

test('同组白沫在同一实际落点出生，逐渐散开并在寿命边界归零',async()=>{
 const {poolFoamClusterState,poolFoamState}=await import('./scene-water-modes.mjs');
 const emitter={lateral:.4,seed:.35},members=[{lateral:-.9,seed:0},{lateral:.9,seed:1}],life=4.5+emitter.seed*2;
 for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({waterMode}),birth=poolFoamState(w,0,emitter.lateral,emitter.seed);
  for(const member of members){
   assert.deepEqual(poolFoamClusterState(w,0,emitter,member),birth);
   assert.equal(poolFoamClusterState(w,life,emitter,member).opacity,0);
   assert.equal(poolFoamClusterState(w,-.1,emitter,member).opacity,0);
   let z=birth.z;
   for(let age=.1;age<life;age+=.1){const p=poolFoamClusterState(w,age,emitter,member);assert.ok(p.z>z);assert.ok(p.opacity>0&&p.opacity<=1);z=p.z;}
  }
  const separation=age=>{const a=poolFoamClusterState(w,age,emitter,members[0]),b=poolFoamClusterState(w,age,emitter,members[1]);return Math.hypot(a.x-b.x,a.z-b.z);};
  assert.ok(separation(3)>separation(.5)*4);
 }
});

test('白沫拉伸随年龄增长，整片包围半径覆盖所有朝向的四角',async()=>{
 const {foamPatchShape}=await import('./scene-water-modes.mjs');
 for(const seed of [0,.5,1])for(const pool of [true,false])for(const size of [.02,.1,.25]){
  const first=foamPatchShape(size,0,seed,pool),last=foamPatchShape(size,8,seed,pool);
  assert.equal(first.maturity,0);assert.equal(last.maturity,1);assert.ok(last.length>=first.length);assert.ok(first.length>first.width);
  for(const age of [0,1,3,7]){
   const shape=foamPatchShape(size,age,seed,pool);
   for(let angle=0;angle<6.3;angle+=.31)for(const a of [-1,1])for(const b of [-1,1]){
    const x=a*shape.width*Math.cos(angle)-b*shape.length*Math.sin(angle),z=a*shape.width*Math.sin(angle)+b*shape.length*Math.cos(angle);
    assert.ok(Math.hypot(x,z)<=shape.radius+1e-12,'避石检查必须覆盖拉伸后的四角');
   }
  }
 }
});

test('白沫完整薄片拒绝越岸与岛外，实际三水流河心仍保留可见区域',async()=>{
 const {foamFitsWater}=await import('./scene-water.mjs');
 const {foamPatchShape}=await import('./scene-water-modes.mjs');
 const shape=foamPatchShape(.2,2,.5),across=new THREE.Vector3(1,0,0),flow=new THREE.Vector3(0,0,1);
 // The center itself is wet; a stretched corner reaches the dry bank.
 const bounded={...world,footprint:(x,z)=>Math.abs(x)<2&&Math.abs(z)<2,height:(x,z)=>Math.abs(x)>1?1:-1,waterSurface:()=>0};
 assert.equal(foamFitsWater(bounded,0,0,across,flow,shape),true);
 assert.equal(foamFitsWater(bounded,.95,0,across,flow,shape),false);
 assert.equal(foamFitsWater(bounded,0,1.9,across,flow,shape),false);
 for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({waterMode});let wet=0;
  for(let z=3;z<18;z+=.5)if(foamFitsWater(w,w.riverX(z),z,across,flow,shape))wet++;
  assert.ok(wet>20,'保守边界不能把正常河心水片全部裁掉');
 }
});
test('水纹行程连续递增，跌落加速后下游减速，调速和暂停不跳位',async()=>{
 const {waterTravel,advanceWaterPhase}=await import('./scene-water-modes.mjs');
 for(const waterMode of['continuous','stream','rocky']){const w=createSpatial({waterMode});let prev=-Infinity;for(let z=-32;z<=32;z+=.03){const t=waterTravel(w,z);assert.ok(Number.isFinite(t)&&t>prev);prev=t;}const{start,end}=w.waterStyle,speed=z=>.001/(waterTravel(w,z+.001)-waterTravel(w,z));assert.ok(speed(end-.1)>speed(start+.1)*2);assert.ok(speed(end+9)<speed(end+.1));assert.ok(Math.abs(waterTravel(w,end-.000001)-waterTravel(w,end+.000001))<.00001);}
 assert.equal(advanceWaterPhase(7,0,3),7);assert.equal(advanceWaterPhase(7,.1,0),7);assert.equal(advanceWaterPhase(7,.1,2),7.2);
});
test('水流参数各模式独立保存，恢复默认只影响当前模式，拒绝非法值',async()=>{
 const {createWaterTuning,waterTuningDefaults}=await import('./scene-water-modes.mjs');const t=createWaterTuning();t.set('continuous','foam',0);t.set('rocky','reflection',1);assert.equal(t.get('continuous').foam,0);t.reset('rocky');assert.equal(t.get('continuous').foam,0);assert.deepEqual(t.get('rocky'),waterTuningDefaults.rocky);const copy=t.get('stream');copy.mist=1;assert.equal(t.get('stream').mist,0);assert.throws(()=>t.set('continuous','foam',NaN),RangeError);assert.throws(()=>t.set('continuous','unknown',.5),RangeError);
});
test('水流模式改变有效落差与坡段，保持轨道和河宽，默认不分束',()=>{
 const base=createSpatial(),stream=createSpatial({waterMode:'stream'}),rocky=createSpatial({waterMode:'rocky'});
 assert.equal(base.config.waterMode,'continuous');assert.equal(base.waterStyle.split,false);assert.equal(stream.waterStyle.split,false);assert.equal(rocky.waterStyle.split,true);
 assert.ok(base.waterLevel(-15)-base.waterLevel(5)>3);assert.ok(stream.waterLevel(-15)-stream.waterLevel(5)<1);assert.ok(stream.waterStyle.end-stream.waterStyle.start>base.waterStyle.end-base.waterStyle.start);
 for(const w of[stream,rocky])for(let i=0;i<100;i++){const p=base.curve.getPointAt(i/100);assert.ok(p.distanceTo(w.curve.getPointAt(i/100))<1e-9);assert.equal(w.halfWidth(i/2-25),base.halfWidth(i/2-25));if(!w.bridge(p))assert.ok(w.height(p.x,p.z)<p.y-.08);}
 assert.throws(()=>createSpatial({waterMode:'unknown'}),RangeError);
});
test('分段跌水保留露岩间隙，岩壁与落点适配三种地形',async()=>{
 const {channelStrength,cascadeEmitters,createCascadeRock}=await import('./scene-cascade.mjs');
 for(const config of Object.values(terrainPresets)){
  const w=createSpatial({...config,waterMode:'rocky'});let exposed=0,stream=0;
  for(let i=0;i<201;i++){const x=w.riverX(-4)+(i/100-1)*w.halfWidth(-4),s=channelStrength(w,x,-4);assert.ok(s>=0&&s<=1);if(s<.16)exposed++;if(s>.6)stream++;}
  assert.ok(exposed>40&&stream>40,'水束与露岩必须同时存在');
  for(const e of cascadeEmitters(w)){assert.ok(Math.abs(e.x-w.riverX(e.z))<w.halfWidth(e.z));assert.ok(e.y>w.waterLevel(e.z));}
  const g=new THREE.Group(),rock=createCascadeRock(g,w),p=rock.geometry.attributes.position,n=rock.geometry.attributes.normal;
  let dry=0,wet=0;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getY(i)));const depth=w.waterSurface(p.getX(i),p.getZ(i))-p.getY(i);if(depth>0)wet++;else dry++;assert.ok(n.getY(i)>0);}assert.equal(dry,0,'承托底面保持在水下，不能制造伪分流岩带');assert.ok(wet>0);
  rock.geometry.dispose();rock.material.dispose();
 }
});
test('飞沫随场景时间暂停，流速为零时隐藏，极端参数仍有界',async()=>{
 const {createCascadeSplash}=await import('./scene-cascade.mjs');const shared={flow:{value:3},night:{value:0},wind:{value:1},windDir:{value:new THREE.Vector2(1,0)}};
 const s=createCascadeSplash(new THREE.Group(),createSpatial(terrainPresets.canyon),shared);s.update(5);const first=Array.from(s.points.geometry.attributes.position.array);s.update(5);assert.deepEqual(Array.from(s.points.geometry.attributes.position.array),first);
 for(const v of first)assert.ok(Number.isFinite(v)&&Math.abs(v)<100);
 shared.flow.value=0;s.update(6);assert.equal(s.points.visible,false);shared.flow.value=.8;s.update(7);assert.equal(s.points.visible,true);s.points.geometry.dispose();s.points.material.dispose();
});
test('错落跌水高程连续，河床保持在水面下，适配三种地形',()=>{
 for(const config of Object.values(terrainPresets)){
  const w=createSpatial(config);let min=Infinity,max=-Infinity;
  for(let z=-7;z<1;z+=.17)for(let u=-.7;u<=.7;u+=.14){const x=w.riverX(z)+u*w.halfWidth(z),y=w.waterSurface(x,z);assert.ok(Number.isFinite(y));assert.ok(Math.abs(w.waterSurface(x,z+.001)-y)<.01);if(w.closest(x,z).distance>4.3)assert.ok(w.height(x,z)<y);}
  for(let u=-.7;u<=.7;u+=.1){const y=w.waterSurface(w.riverX(-4)+u*w.halfWidth(-4),-4);min=Math.min(min,y);max=Math.max(max,y)}assert.ok(max-min>.15);
  assert.equal(w.waterSurface(10,10),w.waterLevel(10));
 }
});
test('新线路闭合、位于场景内，非桥面地形与轨道保持高差',()=>{assert.ok(world.curve.getPointAt(0).distanceTo(world.curve.getPointAt(1))<1e-6);for(let i=0;i<500;i++){const p=world.curve.getPointAt(i/500);assert.ok(world.footprint(p.x,p.z));assert.ok(Number.isFinite(world.height(p.x,p.z)));if(!world.bridge(p))assert.ok(world.height(p.x,p.z)<p.y-.08,'地形侵入轨道');}assert.ok(world.waterLevel(-6)-world.waterLevel(3)>3);});
test('基础场景网格有限，地表三角形正面朝上',()=>{const scene=new THREE.Scene(),f=createFoundation(scene,world);assert.ok(f.bridgeU>0&&f.bridgeU<1);let count=0;scene.traverse(o=>{if(o.isMesh){count++;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));}});assert.ok(count>50);const normal=f.group.children[0].geometry.attributes.normal;let positive=0;for(let i=0;i<normal.count;i++)if(normal.getY(i)>0)positive++;assert.ok(positive/normal.count>.97,'地表绕序错误');});
test('真实场景列车服务连续绕行、停车再出发，暂停不移动',()=>{for(const dt of[1/30,1/60]){const s=createService(world.length,world.stationU*world.length,world.length*.15);for(let t=0;t<250;t+=dt){s.update(dt,1,false,.1);assert.ok(s.speed>=0&&s.progress>=0&&s.progress<1)}assert.ok(s.stops>=3);const before=s.distance,stops=s.stops;s.update(1,1,true);assert.equal(s.distance,before);assert.equal(s.stops,stops);}});
test('五阶段按依赖累加，不把天气和镜头列为基础场景',()=>{assert.equal(stageDefinitions.length,5);assert.match(stageDefinitions[0].added,/钢轨/);assert.match(stageDefinitions[1].added,/列车/);assert.match(stageDefinitions[2].added,/瀑布/);assert.match(stageDefinitions[3].added,/车灯/);assert.match(stageDefinitions[4].added,/镜头/);});

test('地形参数改变真实高程、河道与落差，同时保护铁路净空',()=>{
 const low=createSpatial(terrainPresets.islands),high=createSpatial(terrainPresets.canyon);
 assert.ok(high.height(-22,-10)>low.height(-22,-10)+3);
 assert.ok(low.halfWidth(15)>high.halfWidth(15)*2);
 assert.ok(high.waterLevel(-10)-high.waterLevel(5)>low.waterLevel(-10)-low.waterLevel(5));
 for(const config of Object.values(terrainPresets)){const w=createSpatial(config);for(let i=0;i<400;i++){const p=w.curve.getPointAt(i/400);assert.ok(Number.isFinite(w.height(p.x,p.z)));if(!w.bridge(p))assert.ok(w.height(p.x,p.z)<p.y-.08);}}
});
test('无风时静止，阵风变化有界且按风力同比响应',()=>{
 for(let t=0;t<12;t+=.13){assert.equal(windResponse(t,0,0,0,1),0);const a=windResponse(t,5,3,.5,.8),b=windResponse(t,5,3,1,.8);assert.ok(Math.abs(b-2*a)<1e-9);assert.ok(b>=0&&b<=1.6);}
 assert.notEqual(windResponse(1,0,0,1,0),windResponse(1,0,0,1,1));
});


test('连续切换四季时权重有界、总量稳定，并保留零时间状态',async()=>{
 const {seasons,blendSeason}=await import('./scene-seasons.mjs');let weights=[0,0,1,0];
 assert.deepEqual(blendSeason(weights,seasons.winter.weights,0),weights);
 for(const name of['winter','spring','autumn','summer','winter']){for(let i=0;i<240;i++){weights=blendSeason(weights,seasons[name].weights,1/60);assert.ok(weights.every(v=>v>=0&&v<=1));assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-9);}assert.ok(weights[seasons[name].weights.indexOf(1)]>.999);}
});


test('季节动态按季节和昼夜出现，夏季白天没有萤火',async()=>{
 const {detailVisibility}=await import('./scene-details.mjs');
 assert.equal(detailVisibility([0,1,0,0],0).fireflies,0);
 assert.equal(detailVisibility([0,1,0,0],1).fireflies,1);
 assert.equal(detailVisibility([1,0,0,0],1).fireflies,0);
 assert.deepEqual(detailVisibility([0,0,0,1],0),{petals:0,leaves:0,fireflies:0,snow:1});
});
test('地形更新后动态细节重建并释放旧几何，无树木时不生成落叶',async()=>{
 const {createSeasonDetails}=await import('./scene-details.mjs');const shared={time:{value:0},wind:{value:.4},windDir:{value:new THREE.Vector2(1,0)},season:{value:new THREE.Vector4(0,0,1,0)},night:{value:0},detailAmount:{value:.6},litter:{value:.6}};
 const scene=new THREE.Scene(),details=createSeasonDetails(scene,shared,world,[{x:-22,z:8,height:5}]);
 assert.ok(details.stats.groundLeaves>0);let disposed=0;for(const o of details.group.children){o.geometry.addEventListener('dispose',()=>disposed++);for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}
 const before=details.stats.particles;details.setWorld(createSpatial(terrainPresets.islands),[]);assert.equal(disposed,2);assert.equal(details.stats.groundLeaves,0);assert.ok(details.stats.particles<before);
});


test('河床横断面从深水过渡至露出岸缘，湿润属性有界',()=>{
 for(const config of Object.values(terrainPresets))for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...config,waterMode});let checked=0;
  for(const z of [-10,-4,3,10])for(const side of [-1,1]){
   const center=w.riverX(z),width=w.halfWidth(z),inside=center+side*width*.7,outside=center+side*(width+1.2);
   if(w.closest(inside,z).distance<4.3||w.closest(outside,z).distance<4.3)continue;
   assert.ok(w.height(inside,z)<w.waterSurface(inside,z));
   assert.ok(w.height(outside,z)>w.waterSurface(outside,z),'水面边界需进入岸缘');checked++;
  }
  assert.ok(checked>0);
 }
 const f=createFoundation(new THREE.Scene(),world),wet=f.group.children[0].geometry.attributes.aBankWet;
 assert.ok(wet.count>0);let damp=0,dry=0;for(const v of wet.array){assert.ok(v>=0&&v<=1);if(v>.1)damp++;if(v===0)dry++;}assert.ok(damp>0&&dry>0);
 f.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});

test('入潭泡沫出生和消失连续，沿下游运动且不会横向越岸',async()=>{
 const {poolFoamState,waterTravel,waterTravelToZ}=await import('./scene-water-modes.mjs');
 for(const config of Object.values(terrainPresets))for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...config,waterMode});
  for(const seed of [0,.5,1])for(const lateral of [-.9,0,.9]){
   const life=4.5+seed*2;assert.equal(poolFoamState(w,0,lateral,seed).opacity,0);assert.equal(poolFoamState(w,life,lateral,seed).opacity,0);
   assert.ok(poolFoamState(w,life-.001,lateral,seed).opacity<1e-6);
   let previous=-Infinity;for(let age=0;age<life;age+=.1){const f=poolFoamState(w,age,lateral,seed);assert.ok(f.z>=previous);previous=f.z;assert.ok(f.opacity>=0&&f.opacity<=1);assert.ok(Math.abs(f.x-w.riverX(f.z))<=w.halfWidth(f.z)*.86+1e-6);assert.ok(Number.isFinite(f.scale));}
  }
  for(const z of [-20,-6,-2,0,15])assert.ok(Math.abs(waterTravelToZ(w,waterTravel(w,z))-z)<.009);
 }
});


test('构图、三种地形基底与水流模式可组合，保留轨道净空和水面河床关系',async()=>{
 const {compositions}=await import('./scene-composition.mjs');
 for(const [composition,p] of Object.entries(compositions))for(const terrain of [p.terrain,...Object.values(terrainPresets)])for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...terrain,composition,waterMode});
  for(let i=0;i<240;i++){const v=w.curve.getPointAt(i/240);assert.ok(w.footprint(v.x,v.z));assert.ok(Number.isFinite(w.height(v.x,v.z)));if(!w.bridge(v))assert.ok(w.height(v.x,v.z)<v.y-.08);}
  for(const z of [-12,-4,0,12]){const x=w.riverX(z);assert.ok(w.halfWidth(z)>0);if(w.closest(x,z).distance>4.3)assert.ok(w.height(x,z)<w.waterSurface(x,z));}
 }
 const ridge=createSpatial({...compositions.ridge.terrain,composition:'ridge'}),marsh=createSpatial({...compositions.marsh.terrain,composition:'marsh'});
 assert.ok(ridge.height(-22,-11)>marsh.height(-22,-11)+8);assert.ok(marsh.halfWidth(10)>ridge.halfWidth(10)*1.5);assert.ok(ridge.effectiveDrop>marsh.effectiveDrop*5);
});

test('三种构图与四季四种光线的48个组合有效，夜雨状态不会被季节吞掉',async()=>{
 const {compositions,resolveLighting,lightingModes}=await import('./scene-composition.mjs');const {seasons}=await import('./scene-seasons.mjs');
 for(const id of Object.keys(compositions))for(const theme of Object.values(seasons))for(const mode of Object.keys(lightingModes)){
  const m=resolveLighting(id,theme,mode);for(const k of ['power','ambient','fog','night','wet','rain'])assert.ok(Number.isFinite(m[k])&&m[k]>=0);assert.ok(m.pos.every(Number.isFinite));assert.match(m.sky,/^#[0-9a-f]{6}$/i);assert.match(m.sun,/^#[0-9a-f]{6}$/i);
  assert.equal(m.night,lightingModes[mode].night);assert.equal(m.rain,lightingModes[mode].rain);
 }
 assert.notDeepEqual(resolveLighting('ridge',seasons.winter,'day'),resolveLighting('ridge',seasons.summer,'day'));
 assert.equal(lightingModes.day.power,3.8,'组合不能修改基础光线配置');
});

test('构图缓存隔离且植物分组有开阔区，未知构图拒绝',async()=>{
 const {createCompositionSettings,getComposition,forestWeight}=await import('./scene-composition.mjs');const settings=createCompositionSettings(),marsh=settings.get('marsh');
 settings.save('ridge',{...settings.get('ridge'),width:7,waterMode:'rocky'});assert.equal(settings.get('ridge').width,7);assert.deepEqual(settings.get('marsh'),marsh);const copy=settings.get('ridge');copy.width=3;assert.equal(settings.get('ridge').width,7);
 assert.ok(forestWeight('ridge',-24,-10)>forestWeight('ridge',-3,10)*2);assert.ok(forestWeight('marsh',-28,-9)>forestWeight('marsh',0,10)*3);
 assert.throws(()=>getComposition('missing'),RangeError);
});


test('树形可复现、枝条连续且逐级变细，不同树型产生不同冠形',async()=>{
 const {buildTreeShape}=await import('./scene-tree-shape.mjs');
 const distance=(p,a,b)=>{const v=new THREE.Vector3(...p),x=new THREE.Vector3(...a),d=new THREE.Vector3(...b).sub(x),t=THREE.MathUtils.clamp(v.clone().sub(x).dot(d)/d.lengthSq(),0,1);return v.distanceTo(x.addScaledVector(d,t));};
 for(const species of [0,1,2])for(const seed of [1,31,9123]){
  const shape=buildTreeShape({height:6,seed,species});assert.deepEqual(shape,buildTreeShape({height:6,seed,species}));
  const previous=[];for(const b of shape.branches){assert.ok(b.radius>=b.tipRadius&&b.tipRadius>0);assert.ok(new THREE.Vector3(...b.a).distanceTo(new THREE.Vector3(...b.b))>.001);assert.ok(b.a.concat(b.b).every(Number.isFinite));assert.ok(b.a.every(v=>v===0)||previous.some(parent=>distance(b.a,parent.a,parent.b)<1e-6),'枝条脱离骨架');previous.push(b);}
  for(const c of shape.crowns){assert.ok(c.p.every(Number.isFinite));assert.ok(c.p[1]>0&&c.p[1]<6*1.35);assert.ok(c.scale.every(v=>v>0&&v<3));}
 }
 assert.notDeepEqual(buildTreeShape({height:6,seed:12,species:0}),buildTreeShape({height:6,seed:12,species:2}));
 assert.throws(()=>buildTreeShape({height:0,seed:1}),RangeError);
});

test('树冠几何具有三维厚度，法线有效且纹理坐标有界',async()=>{
 const {createCrownGeometry}=await import('./scene-vegetation.mjs');const g=createCrownGeometry();g.computeBoundingBox();assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>1);
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);
 for(const v of g.attributes.uv.array)assert.ok(v>=0&&v<=1);g.dispose();
});

test('植物区域色调连续，四季叶量有界，冬季完全落叶',async()=>{
 const {treeIdentity,plantRetention}=await import('./scene-tree-shape.mjs');const {seasons,blendSeason}=await import('./scene-seasons.mjs');
 for(const species of [0,1,2]){assert.equal(plantRetention(seasons.winter.weights,species),0);assert.equal(plantRetention(seasons.summer.weights,species),1);let w=[0,1,0,0];for(let i=0;i<500;i++){w=blendSeason(w,seasons.winter.weights,.02);const n=plantRetention(w,species);assert.ok(n>=0&&n<=1);}}
 for(let x=-30;x<30;x+=.7){const t=treeIdentity(x,8);assert.ok(t.tone>=0&&t.tone<=1);assert.ok(Math.abs(t.tone-treeIdentity(x+.2,8).tone)<.2);assert.equal(treeIdentity(x,8,true).species,0);}
});

test('地表分区归一且连续，陡坡露岩、近岸露土，无树布局不生成林地色',async()=>{
 const {groundZones}=await import('./scene-ground.mjs');
 for(const composition of ['classic','ridge','marsh']){
  const w=createSpatial({composition});
  for(let x=-40;x<40;x+=2.3)for(let z=-30;z<30;z+=3.7){
   const sample=groundZones(w,x,z,.3,8),near=groundZones(w,x+.01,z,.3,8);
   assert.ok(sample.weights.every(v=>v>=0&&v<=1));assert.ok(Math.abs(sample.weights.reduce((a,b)=>a+b,0)-1)<1e-12);
   assert.ok(sample.variation>=.96&&sample.variation<=1.04);
   assert.ok(sample.weights.every((v,i)=>Math.abs(v-near.weights[i])<.01));
  }
  assert.ok(groundZones(w,0,0,2,8).weights[3]>.7);
  assert.ok(groundZones(w,0,0,0,0).weights[2]>.8);
  assert.equal(groundZones(createSpatial({composition,density:0}),-24,-10,0,8).weights[1],0);
 }
});

test('四季地表颜色有界，秋季保留区域残绿，冬季未覆雪底色不再是夏绿',async()=>{
 const {groundColour}=await import('./scene-ground.mjs');
 for(const zones of [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],[.4,.3,.2,.1]]){
  for(let a=0;a<=1;a+=.05){const c=groundColour([a,0,1-a,0],zones,1.02);assert.ok(c.every(v=>v>0&&v<1));}
 }
 const summer=groundColour([0,1,0,0],[1,0,0,0]),winter=groundColour([0,0,0,1],[1,0,0,0]);
 assert.ok(summer[1]>summer[0]);assert.ok(winter[0]>winter[1]);
 const dry=groundColour([0,0,1,0],[1,0,0,0],.96),green=groundColour([0,0,1,0],[1,0,0,0],1.04);
 assert.ok(green[1]/green[0]>dry[1]/dry[0]);
});

test('林地覆盖跟随实际树木移动，空树列表清除覆盖且岸缘仍保留裸土',async()=>{
 const {treeCoverAt,groundZones}=await import('./scene-ground.mjs');
 const w=createSpatial({composition:'ridge'});w.groundTrees=[{x:0,z:0,height:6}];
 assert.equal(treeCoverAt(w.groundTrees,0,0),1);assert.equal(treeCoverAt(w.groundTrees,8,0),0);
 assert.ok(groundZones(w,0,0,0,5).weights[1]>.8);
 w.groundTrees=[{x:10,z:0,height:6}];assert.equal(groundZones(w,0,0,0,5).weights[1],0);
 w.groundTrees=[];assert.equal(groundZones(w,-24,-10,0,5).weights[1],0);
 w.groundTrees=[{x:0,z:0,height:6}];
 for(let shore=0;shore<8;shore+=.13)for(const slope of [0,.5,1,2]){const z=groundZones(w,0,0,slope,shore);assert.ok(z.weights.every(x=>x>=0));assert.ok(Math.abs(z.weights.reduce((a,b)=>a+b)-1)<1e-10);}
 assert.ok(groundZones(w,0,0,0,0).weights[2]>.8);
});

test('短草布点可复现、贴地并避开铁路水域车站和树干',async()=>{
 const {createMeadowClumps}=await import('./scene-ground-cover.mjs');
 for(const composition of ['ridge','marsh']){
  const w=createSpatial({composition});w.groundTrees=[{x:-20,z:3,height:7}];
  const clumps=createMeadowClumps(w,180);assert.equal(clumps.length,180);assert.deepEqual(clumps,createMeadowClumps(w,180));
  for(const c of clumps){assert.ok(w.footprint(c.x,c.z));assert.equal(c.y,w.height(c.x,c.z));assert.ok(w.closest(c.x,c.z).distance>=3);assert.ok(c.y>w.waterSurface(c.x,c.z)+.17);assert.ok(Math.hypot(c.x+27,c.z-25)>=7);assert.ok(Math.hypot(c.x+20,c.z-3)>=.5);assert.ok(c.height>=.18&&c.height<=.52);}
 }
});

test('全域细节可复现且覆盖后坡，保留水域轨道与边缘净空',async()=>{
 const {createRegionDetails}=await import('./scene-regions.mjs');
 const {compositions}=await import('./scene-composition.mjs');
 for(const composition of ['ridge','marsh','classic']){
  const w=createSpatial({...compositions[composition].terrain,composition});w.groundTrees=[];
  const details=createRegionDetails(w);assert.deepEqual(details,createRegionDetails(w));
  assert.ok(details.shrubs.length>30);if(composition!=='marsh')assert.ok(details.rocks.length>10);else assert.ok(details.rocks.length<20,'低缓浅湾不强行放置露岩');
  assert.ok(details.shrubs.some(p=>p.z<-12),'后方不能没有灌木');
  if(composition==='ridge')assert.ok(details.rocks.filter(p=>p.z<-10).length>5);
  for(const p of [...details.rocks,...details.shrubs,...details.grass]){
   assert.ok(w.footprint(p.x,p.z));assert.equal(p.y,w.height(p.x,p.z));assert.ok(w.closest(p.x,p.z).distance>3.4);
   assert.ok(Math.abs(p.x-w.riverX(p.z))-w.halfWidth(p.z)>3.4);
   assert.ok(Math.abs(Math.hypot(...p.normal)-1)<1e-9);assert.ok(p.normal[1]>0);
  }
 }
});

test('新机位随地形更新且有限，枯木端点沿地表落置',async()=>{
 const {regionViews,createRegionDetails}=await import('./scene-regions.mjs');
 for(const settings of Object.values(terrainPresets)){
  const w=createSpatial({...settings,composition:'ridge'}),views=regionViews(w);
  assert.ok(Object.values(views).every(v=>[...v.position,...v.target].every(Number.isFinite)));
  assert.ok(views.back.position[1]>w.height(-23,-13)+15);assert.ok(views.meadow.position[1]>views.meadow.target[1]+15);
  w.groundTrees=Array.from({length:30},(_,i)=>({x:-30+(i%6)*4,z:-8+Math.floor(i/6)*4,height:7}));
  for(const log of createRegionDetails(w).logs)for(const [x,y,z] of log.ends)assert.ok(Math.abs(y-w.height(x,z)-.09)<1e-9);
 }
});


test('山后切坡降缓，坡脚连续且轨道平台保持平整',async()=>{
 const {compositions}=await import('./scene-composition.mjs');
 const w=createSpatial({...compositions.ridge.terrain,composition:'ridge'});
 let before=0,after=0;
 for(let x=-34;x<-6;x+=.5)for(let z=-24;z<-7;z+=.5){
  const distance=w.closest(x,z).distance;if(distance<2||distance>8)continue;
  const slope=f=>Math.hypot(f(x+.05,z)-f(x-.05,z),f(x,z+.05)-f(x,z-.05))/.1;
  before=Math.max(before,slope(w.layoutHeight));after=Math.max(after,slope(w.height));
 }
 assert.ok(before>8);assert.ok(after<2.1,'山后不再保留近乎直立的整平切面');
 for(let i=0;i<200;i++){
  const p=w.curve.getPointAt(i/200);if(w.bridge(p))continue;
  const t=w.curve.getTangentAt(i/200),n=new THREE.Vector3(t.z,0,-t.x).normalize();
  for(const side of [-1,1]){const q=p.clone().addScaledVector(n,side*1.2);assert.ok(w.height(q.x,q.z)<p.y-.08);}
 }
 // The dry-upland change does not create a jump where grading starts.
 for(let x=-34;x<-8;x+=1.3)for(let z=-24;z<-8;z+=1.7)assert.ok(Math.abs(w.height(x+.001,z)-w.height(x,z))<.01);
});

test('贴坡露岩的完整顶点留在岛内并避开轨道，埋入底壳且保留低矮凸起',async()=>{
 const {createUplandRockGeometry}=await import('./scene-landscape.mjs');
 const {createRegionDetails}=await import('./scene-regions.mjs');
 const {compositions}=await import('./scene-composition.mjs');
 const source=new THREE.DodecahedronGeometry(1,1),p=source.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=1+.12*Math.sin(x*8+z*5)*Math.cos(y*7);p.setXYZ(i,x*f,y*f,z*f);}
 for(const composition of ['ridge','classic','marsh']){
  const w=createSpatial({...compositions[composition].terrain,composition});w.groundTrees=[];
  const sites=createRegionDetails(w).rocks,g=createUplandRockGeometry(w,sites,source),v=g.attributes.position;
  let buried=0,exposed=0;
  for(let i=0;i<v.count;i++){
   const x=v.getX(i),y=v.getY(i),z=v.getZ(i),delta=y-w.height(x,z);
   assert.ok(w.footprint(x,z));assert.ok(w.closest(x,z).distance>2.5);
   assert.ok(Number.isFinite(y)&&delta<.4&&delta>-.7);
   if(delta<0)buried++;else exposed++;
  }
  if(sites.length){assert.ok(buried>0&&exposed>0);}
  g.dispose();
 }
 source.dispose();
});


test('岸石与分流石完整体积避让铁路，三种构图基底与水流模式可重建',async()=>{
 const {createRiverRocks}=await import('./scene-rocks.mjs');
 const {compositions}=await import('./scene-composition.mjs');
 const sphere=new THREE.SphereGeometry(1,12,8).attributes.position;
 for(const composition of Object.keys(compositions))for(const settings of [compositions[composition].terrain,...Object.values(terrainPresets)])for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...settings,composition,waterMode}),rocks=createRiverRocks(w);assert.deepEqual(rocks,createRiverRocks(w));
  assert.ok(rocks.length>20);
  assert.equal(rocks.some(r=>r.kind==='divider'),waterMode==='rocky');
  for(const r of rocks)for(let i=0;i<sphere.count;i++){
   const a=sphere.getX(i)*r.rx,b=sphere.getZ(i)*r.rz,c=Math.cos(r.angle),s=Math.sin(r.angle),x=r.x+a*c-b*s,z=r.z+a*s+b*c;
   assert.ok(w.closest(x,z).distance>2.2,'石块侵入铁路保护带');assert.ok(w.footprint(x,z),'石块越出岛体');
  }
 }
});

test('实际露岩截面阻止水面穿石，边缘允许绕行，水石布局随模式变化',async()=>{
 const {createRiverRocks,rockWaterField}=await import('./scene-rocks.mjs');
 const {cascadeBedHeight,channelStrength}=await import('./scene-cascade.mjs');
 const {compositions}=await import('./scene-composition.mjs');
 for(const composition of Object.keys(compositions)){
  const w=createSpatial({...compositions[composition].terrain,composition,waterMode:'rocky'}),rocks=createRiverRocks(w);
  for(const r of rocks.filter(r=>r.kind==='divider')){
   assert.ok(rockWaterField(rocks,r.x,r.z,w.waterSurface(r.x,r.z)).clearance<0);
   const left=rockWaterField([r],r.x-r.rx-.2,r.z,r.y),right=rockWaterField([r],r.x+r.rx+.2,r.z,r.y);
   assert.ok(left.clearance>0&&right.clearance>0);assert.ok(left.deflect<0&&right.deflect>0);

  }
  for(let z=-6.8;z<-1;z+=.3)for(let u=-.95;u<.95;u+=.03){const x=w.riverX(z)+u*w.halfWidth(z),ch=channelStrength(w,x,z),depth=w.waterSurface(x,z)-cascadeBedHeight(w,x,z);assert.ok(depth>0,'水面缺口只能由实际石块决定');}
 }
});


test('流纹在上游加速且跨越跌水边界连续，各横向水线可逆',async()=>{
 const {waterTravel,waterTravelToZ,waterLaneShift}=await import('./scene-water-modes.mjs');
 for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({waterMode});
  for(const lane of [-8,-3,0,3,8]){
   const shift=waterLaneShift(lane),start=w.waterStyle.start-shift,end=w.waterStyle.end-shift;
   const speed=z=>.0002/(waterTravel(w,z+.0001,lane)-waterTravel(w,z-.0001,lane));
   assert.ok(speed(start-.1)>speed(start-8)*1.2);
   assert.ok(speed(end-.1)>speed(start+.1)*2);
   for(const edge of [start,end]){const left=(waterTravel(w,edge,lane)-waterTravel(w,edge-.0001,lane))/.0001,right=(waterTravel(w,edge+.0001,lane)-waterTravel(w,edge,lane))/.0001;assert.ok(Math.abs(left-right)<.001);}
   for(let z=-31;z<31;z+=1.2)assert.ok(Math.abs(waterTravelToZ(w,waterTravel(w,z,lane),lane)-z)<.009);
  }
 }
});

test('各横向落点、白沫出生和飞沫入口对应同一跌落边缘',async()=>{
 const {waterImpactZ,waterLaneShift,poolFoamState}=await import('./scene-water-modes.mjs');
 for(const config of Object.values(terrainPresets))for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...config,waterMode});
  for(const lateral of [-.8,-.3,0,.4,.8]){
   const cross=lateral*.48*w.halfWidth(w.waterStyle.end),impact=waterImpactZ(w,cross),p=poolFoamState(w,0,lateral,.4);
   assert.ok(Math.abs(impact+waterLaneShift(cross)-w.waterStyle.end-.25)<1e-9);assert.ok(Math.abs(p.z-impact)<.009);assert.equal(p.opacity,0);
   assert.ok(poolFoamState(w,.5,lateral,.4).z>p.z);
  }
 }
});

test('实际水面网格保持有限法线与固体避让属性，三种模式及极端基底有效',async()=>{
 const {createWaterGeometry}=await import('./scene-water.mjs');
 const {createRiverRocks}=await import('./scene-rocks.mjs');
 for(const config of [terrainPresets.canyon,terrainPresets.islands])for(const waterMode of ['continuous','stream','rocky']){
  const w=createSpatial({...config,composition:'ridge',waterMode});w.riverRocks=createRiverRocks(w);const g=createWaterGeometry(w),a=g.attributes;
  for(const attribute of Object.values(a))for(const v of attribute.array)assert.ok(Number.isFinite(v));
  for(let i=0;i<a.position.count;i+=13){assert.ok(Math.abs(Math.hypot(a.aFlowNormal.getX(i),a.aFlowNormal.getY(i),a.aFlowNormal.getZ(i))-1)<1e-5);assert.ok(a.aFlowNormal.getY(i)>0);assert.ok(a.aObstacle.getX(i)<=4);}
  for(const r of w.riverRocks.filter(r=>r.kind==='divider')){
   let masked=0;for(let i=0;i<a.position.count;i++){if(Math.hypot(a.position.getX(i)-r.x,a.position.getZ(i)-r.z)<r.rx&&a.aObstacle.getX(i)<0)masked++;}
   assert.ok(masked>0,'分流石必须在实际水网格留下阻挡属性');
  }
  g.dispose();
 }
});
