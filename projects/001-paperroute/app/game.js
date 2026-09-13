import * as THREE from './vendor/three.module.js';
import { createGame, startDay, nextDay, updateGame, throwPaper, setPaused, nearestTarget, reachableTarget, DAYS, ROUTE_LENGTH, clamp } from './game-state.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b6d9d7');
scene.fog = new THREE.Fog('#b6d9d7', 65, 170);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 230);
scene.add(new THREE.HemisphereLight('#e5f5ff', '#81934d', 2.4));
const sun = new THREE.DirectionalLight('#fff0c4', 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 130 });
sun.shadow.normalBias = 0.045;
sun.shadow.bias = -0.0002;
scene.add(sun, sun.target);

const materials = new Map();
const geometries = new Map();
function material(color, extras = {}) {
  const key = color + JSON.stringify(extras);
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extras }));
  return materials.get(key);
}
function geometry(key, make) {
  if (!geometries.has(key)) geometries.set(key, make());
  return geometries.get(key);
}
function mesh(parent, geo, color, x, y, z, extras) {
  const object = new THREE.Mesh(geo, material(color, extras));
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function box(parent, w, h, d, color, x = 0, y = 0, z = 0) {
  const geo = geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d));
  return mesh(parent, geo, color, x, y, z);
}
function sphere(parent, radius, color, x, y, z, detail = 1) {
  const geo = geometry(`sphere:${radius}:${detail}`, () => new THREE.IcosahedronGeometry(radius, detail));
  return mesh(parent, geo, color, x, y, z);
}
function rod(parent, a, b, radius, color) {
  const geo = geometry(`rod:${radius}`, () => new THREE.CylinderGeometry(radius, radius, 1, 8));
  const item = mesh(parent, geo, color, 0, 0, 0);
  poseRod(item, a, b);
  return item;
}
const up = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
function poseRod(object, a, b) {
  tmpA.fromArray(a); tmpB.fromArray(b);
  object.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
  tmpB.sub(tmpA);
  object.scale.y = tmpB.length();
  object.quaternion.setFromUnitVectors(up, tmpB.normalize());
}
function label(text, color = '#31583e', background = '#f9efcc', w = 256, h = 96) {
  const surface = document.createElement('canvas'); surface.width = w; surface.height = h;
  const ctx = surface.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 36px Georgia, sans-serif';
  ctx.fillText(text, w / 2, h / 2, w - 25);
  const texture = new THREE.CanvasTexture(surface); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, toneMapped: false }));
  sprite.scale.set(3.2, 1.2, 1); return sprite;
}

// The street is an original procedural scene; no upstream game models are used.
box(scene, 500, 0.25, 900, '#8ea86c', 0, -0.35, -320);
box(scene, 10.4, 0.12, 760, '#727e79', 0, -0.08, -300);
for (const side of [-1, 1]) {
  box(scene, 1.7, 0.17, 760, '#d6d2b6', side * 6.05, 0, -300);
  box(scene, 0.15, 0.25, 760, '#e6dcc2', side * 5.2, 0, -300);
  box(scene, 0.1, 0.015, 760, '#ded5b0', side * 4.6, 0.01, -300);
}
for (let z = 0; z < 660; z += 9) box(scene, 0.14, 0.012, 3.8, '#e3d397', 0, 0.005, -z);

const roofGeo = (() => {
  const shape = new THREE.Shape(); shape.moveTo(-4.25, 0); shape.lineTo(0, 2.45); shape.lineTo(4.25, 0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 7.2, bevelEnabled: false }); geo.translate(0, 0, -3.6); return geo;
})();
const lots = [];
function house(side, index) {
  const group = new THREE.Group();
  const tint = ['#ddd09c', '#b8cbbc', '#dcb7a2', '#afc5cb', '#e0d2b8'][index % 5];
  const roof = ['#a56550', '#626e70', '#817869'][index % 3];
  box(group, 8, 3.8, 6.4, tint, 0, 2.3, 0);
  box(group, 8.25, 0.5, 6.7, '#b8b9a0', 0, 0.38, 0);
  const roofMesh = new THREE.Mesh(roofGeo, material(roof)); roofMesh.position.y = 4.18; roofMesh.castShadow = true; group.add(roofMesh);
  box(group, 8.6, 0.17, 7.2, '#eee3c6', 0, 4.16, 0);
  box(group, 0.8, 2.5, 0.8, '#a58571', -2.15, 5.4, -1.5);
  box(group, 1.35, 2.55, 0.15, '#456754', 0, 1.75, 3.28);
  box(group, 1.6, 0.12, 0.22, '#f1e2bf', 0, 3.1, 3.4);
  sphere(group, 0.05, '#e4c070', 0.4, 1.7, 3.4, 0);
  for (const x of [-2.5, 2.5]) {
    box(group, 1.9, 1.75, 0.18, '#f3e9ce', x, 2.3, 3.26);
    box(group, 1.6, 1.46, 0.19, '#719fa9', x, 2.3, 3.3);
    box(group, 0.075, 1.6, 0.06, '#ece6cb', x, 2.3, 3.43);
    box(group, 1.65, 0.08, 0.06, '#ece6cb', x, 2.3, 3.43);
    for (const sign of [-1, 1]) box(group, 0.38, 1.75, 0.1, '#53796a', x + sign * 1.12, 2.3, 3.31);
    box(group, 2, 0.3, 0.5, '#9c6d49', x, 1.35, 3.55);
    for (let k = 0; k < 4; k++) sphere(group, 0.15, ['#db876d', '#e8c662'][index % 2], x - 0.6 + k * 0.4, 1.6, 3.58, 0);
  }
  box(group, 3, 0.2, 2.05, '#ceceb1', 0, 0.38, 4.2);
  box(group, 2.7, 0.16, 1, '#b5bba3', 0, 0.2, 5.45);
  box(group, 2.25, 0.05, 3.2, '#c4c6a6', 0, 0.09, 6.4);
  if (index % 2 === 0) {
    box(group, 3.2, 0.22, 2.05, '#727e68', 0, 3.7, 4.1);
    for (const x of [-1.25, 1.25]) box(group, 0.16, 3.3, 0.16, '#e9e1c9', x, 2, 4.95);
  }
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      box(group, 0.17, 0.88, 0.13, '#eee7c9', dir * (1.9 + i * 0.62), 0.58, 6.2);
    }
    box(group, 3.1, 0.12, 0.15, '#e2dcc0', dir * 3.15, 0.85, 6.22);
    box(group, 3.1, 0.1, 0.15, '#e2dcc0', dir * 3.15, 0.4, 6.22);
    sphere(group, 1.1, '#708c50', dir * 4.8, 0.78, 2.3, 1).scale.set(1, 0.75, 1.2);
  }
  const number = label(String(10 + index * 2 + (side > 0 ? 1 : 0))); number.scale.set(0.62, 0.23, 1); number.position.set(0, 3.4, 3.5); group.add(number);
  group.position.set(side * (13 + (index % 3) * 0.6), 0, -32 - index * 27);
  group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(group); lots.push(group);
}
function tree(x, z, index) {
  const group = new THREE.Group();
  rod(group, [0, 0, 0], [0.15, 4.6, 0], 0.25, '#8d7851');
  rod(group, [0, 3, 0], [-1.3, 4.8, 0.3], 0.14, '#8d7851');
  const palette = ['#628b50', '#7e9d54', '#94aa61'];
  sphere(group, 2.4, palette[index % 3], 0, 5.6, 0, 1).scale.set(1, 1.1, 0.9);
  sphere(group, 1.8, palette[(index + 1) % 3], -1.6, 4.8, 0.2, 1);
  sphere(group, 1.75, palette[(index + 2) % 3], 1.4, 5, 0.4, 1);
  group.position.set(x, 0, z); scene.add(group); lots.push(group);
}
for (let index = 0; index < 21; index++) for (const side of [-1, 1]) {
  house(side, index);
  tree(side * 9.6, -18 - index * 27, index + (side > 0 ? 1 : 0));
  if (index % 4 === 0) {
    const lamp = new THREE.Group(); rod(lamp, [0, 0, 0], [0, 5.3, 0], 0.09, '#4f665d');
    rod(lamp, [0, 5.3, 0], [-side * 0.6, 5.3, 0], 0.07, '#4f665d');
    box(lamp, 0.6, 0.3, 0.5, '#e5ddb4', -side * 0.6, 5.2, 0);
    lamp.position.set(side * 6.8, 0, -10 - index * 27); scene.add(lamp); lots.push(lamp);
  }
}
const sign = label('CEDAR LANE'); sign.position.set(-8.3, 2.6, -10); scene.add(sign);
rod(scene, [-8.3, 0, -10], [-8.3, 2.5, -10], 0.065, '#4f6a56');
const finishSign = label('FINISH', '#f4edd9', '#395e45'); finishSign.scale.set(7.5, 2.8, 1); finishSign.position.set(0, 6, -ROUTE_LENGTH); scene.add(finishSign);
for (const x of [-5, 5]) rod(scene, [x, 0, -ROUTE_LENGTH], [x, 7, -ROUTE_LENGTH], 0.13, '#d9dab8');
for (let i = 0; i < 12; i++) {
  const cloud = sphere(scene, 5, '#edf1db', -75 + i * 16, 38 + i % 4 * 7, -100 - (i % 5) * 85, 1);
  cloud.scale.set(2.5, 0.55, 1); cloud.castShadow = false;
}

const bike = new THREE.Group(); scene.add(bike);
const wheels = [];
for (const z of [-0.92, 0.92]) {
  const group = new THREE.Group(); group.position.set(0, 0.56, z);
  const tire = mesh(group, geometry('tire', () => new THREE.TorusGeometry(0.49, 0.065, 6, 20)), '#2b3835', 0, 0, 0); tire.rotation.y = Math.PI / 2;
  const rim = mesh(group, geometry('rim', () => new THREE.TorusGeometry(0.425, 0.022, 4, 20)), '#cfcec0', 0, 0, 0); rim.rotation.y = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rod(group, [0, 0, 0], [0, Math.sin(a) * 0.43, Math.cos(a) * 0.43], 0.009, '#c5cbbd'); }
  bike.add(group); wheels.push(group);
}
const framePoints = [[0, 0.58, 0.9], [0, 0.9, 0], [0, 1.48, 0.3], [0, 1.48, -0.7], [0, 0.56, -0.92]];
for (const [a, b] of [[0,1],[0,2],[1,2],[2,3],[1,3],[3,4]]) rod(bike, framePoints[a], framePoints[b], 0.052, '#ba493a');
rod(bike, [0, 1.48, -0.7], [0, 1.72, -0.85], 0.035, '#4c5752');
rod(bike, [-0.48, 1.72, -0.87], [0.48, 1.72, -0.87], 0.035, '#3e4c44');
box(bike, 0.45, 0.09, 0.45, '#534735', 0, 1.5, 0.33);
box(bike, 0.68, 0.37, 0.5, '#bfa375', 0, 1.35, -1.05);
for (let i=0;i<4;i++) box(bike, 0.075, 0.25, 0.55, '#e6dbb5', -0.23 + i * 0.15, 1.4, -1.1);
const body = new THREE.Group(); bike.add(body);
const torso = sphere(body, 0.42, '#467c94', 0, 2.08, 0.05, 1); torso.scale.set(0.88, 1.15, 0.62); torso.rotation.x = -0.15;
box(body, 0.58, 0.32, 0.4, '#d2b18b', 0, 1.63, 0.18);
rod(body, [0, 2.43, -0.07], [0, 2.65, -0.14], 0.12, '#dcb18b');
sphere(body, 0.3, '#e7bd96', 0, 2.79, -0.17, 2).scale.set(0.86, 1.07, 1);
sphere(body, 0.085, '#dba986', 0, 2.8, -0.44, 1);
for (const x of [-0.1,0.1]) sphere(body, 0.026, '#423e31', x, 2.87, -0.427, 1);
const cap = mesh(body, geometry('cap', () => new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), '#b74e3b', 0, 2.91, -0.17); cap.scale.set(1, 0.8, 1);
box(body, 0.46, 0.045, 0.33, '#a84232', 0, 2.93, -0.42);
box(body, 0.63, 0.54, 0.31, '#c8a765', 0, 2.09, 0.47);
rod(body, [-0.28,2.42,0.03],[-0.23,1.8,0.52],0.042,'#897647');
const arm = rod(body, [-0.3,2.29,-0.04],[-0.47,1.72,-0.87],0.083,'#dfb38c');
rod(body, [0.3,2.29,-0.04],[0.47,1.72,-0.87],0.083,'#dfb38c');
const legs = [];
for (const side of [-1, 1]) {
  const upper = rod(body, [side*.18,1.6,.2],[side*.23,1.1,-.25],.105,'#d2b18b');
  const lower = rod(body, [side*.23,1.1,-.25],[side*.25,.7,0],.073,'#e2b890');
  const shoe = box(body,.18,.12,.33,'#f0e4c8',side*.25,.7,0);
  legs.push({upper,lower,shoe,side});
}

const routeObjects = new THREE.Group(); scene.add(routeObjects);
const targetMeshes = new Map(); const hazardMeshes = new Map();
const flightGeometry = new THREE.CylinderGeometry(0.085, 0.085, 0.66, 7);
const flights = [];
const particles = [];
function disposeRoute() {
  for (const child of routeObjects.children) child.traverse(item => { if (item.isSprite) { item.material.map?.dispose(); item.material.dispose(); } });
  routeObjects.clear(); targetMeshes.clear(); hazardMeshes.clear();
  flights.forEach(f=>scene.remove(f.object)); flights.length=0;
  particles.forEach(p=>scene.remove(p.object)); particles.length=0;
}
function buildRoute(game) {
  disposeRoute();
  for (const target of game.targets) {
    const group = new THREE.Group(); group.position.set(target.side*7.4,0,-target.z);
    rod(group,[0,0,0],[0,1.4,0],.09,'#51684f');
    box(group,.74,.47,.62,'#426d58',0,1.6,0);
    const lid=box(group,.08,.42,.62,'#e8d6aa',-target.side*.38,1.6,0);
    const flag=box(group,.05,.8,.08,'#ce6541',target.side*.39,1.95,0); box(flag,.04,.2,.3,'#df8154',0,.28,.12);
    const halo=mesh(group,geometry('halo',()=>new THREE.TorusGeometry(.95,.04,5,32)),'#edc963',0,.08,0,{emissive:'#dab243',emissiveIntensity:.4}); halo.rotation.x=Math.PI/2;
    const marker=label(String(target.id+1).padStart(2,'0'),'#315b3e','#f6e5a2'); marker.scale.set(.9,.34,1); marker.position.y=2.8; group.add(marker);
    routeObjects.add(group); targetMeshes.set(target.id,{group,halo,flag,lid,marker});
  }
  for (const hazard of game.hazards) {
    const group=new THREE.Group();
    if(hazard.kind==='car') {
      const color=['#d29c57','#a45849','#719599'][hazard.id%3];
      box(group,1.7,.68,3.35,color,0,.64,0); box(group,1.46,.6,1.65,color,0,1.26,-.15);
      box(group,1.3,.46,.045,'#88aab0',0,1.3,.7);
      for(const side of [-1,1]) {
        box(group,.045,.42,1.4,'#85a8af',side*.74,1.28,-.15);
        for(const z of [-1.02,1.04]){const wheel=mesh(group,geometry('carwheel',()=>new THREE.CylinderGeometry(.36,.36,.22,12)),'#344038',side*.86,.38,z);wheel.rotation.z=Math.PI/2;}
        box(group,.32,.2,.045,'#f6e6b3',side*.5,.77,1.7);
      }
      box(group,1.5,.13,.08,'#c6cabb',0,.5,1.72);
    } else if(hazard.kind==='pothole') {
      const pit=mesh(group,geometry('pit',()=>new THREE.CylinderGeometry(1,1,.025,9)),'#475850',0,.045,0);pit.scale.z=.7;
      const inner=mesh(group,geometry('pitinner',()=>new THREE.CylinderGeometry(.7,.7,.028,9)),'#34483e',.1,.06,0);inner.scale.z=.68;
      for(let i=0;i<5;i++)sphere(group,.13,'#8c957b',Math.cos(i*1.25)*.85,.1,Math.sin(i*1.25)*.62,0);
    } else {
      sphere(group,.37,'#a4794a',0,.66,0,1).scale.set(.7,.8,1.5);
      sphere(group,.29,'#aa8050',0,.94,-.42,1); sphere(group,.17,'#694f36',0,.91,-.66,1).scale.set(.8,.7,1);
      for(const side of [-1,1]) {
        sphere(group,.15,'#6c553c',side*.22,1.06,-.36,0).scale.y=1.5;
        for(const z of [-.28,.3])rod(group,[side*.18,.6,z],[side*.2,.12,z],.065,'#8c693e');
      }
      rod(group,[0,.75,.5],[0,1.1,.82],.05,'#805f3c');
    }
    group.position.set(hazard.x,0,-hazard.z); routeObjects.add(group); hazardMeshes.set(hazard.id,group);
  }
}

let game = createGame(); startDay(game); game.phase = 'ready'; buildRoute(game);
const keys=new Set();
const input={targetX:-4.3,brake:false,sprint:false};
let pedal=0, last=performance.now(), hudClock=0, toastTime=0, throwPose=0, sound=false, audioContext=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function beep(type) {
  if(!sound)return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type=type==='collision'?'sawtooth':'sine';
    const frequency=type==='delivery'?660:type==='throw'?260:100;
    osc.frequency.setValueAtTime(frequency,audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type==='delivery'?1040:70,audioContext.currentTime+.15);
    gain.gain.setValueAtTime(.075,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.22);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.24);
  } catch { sound=false; $('#sound-button').textContent='音效：不可用'; }
}
function notify(text,bad=false) {
  $('#toast').textContent=text;$('#toast').className='toast show'+(bad?' bad':'');toastTime=2;
}
function hideLayers() { for(const id of ['start','pause','result'])$('#'+id+'-layer').hidden=true; }
function begin(fresh=true) {
  keys.clear();input.targetX=-4.3;input.brake=false;input.sprint=false;
  if(fresh){game=createGame();startDay(game);}else nextDay(game);
  buildRoute(game);hideLayers();$('#controls').hidden=false;$('#target-hint').hidden=false;$('#riding-help').hidden=false;
  $('#pause-button').disabled=false;$('#pause-button').textContent='暂停 P';
  $('#brake-button').classList.remove('active');$('#sprint-button').classList.remove('active');
  $('#brake-button').setAttribute('aria-pressed','false');$('#sprint-button').setAttribute('aria-pressed','false');
  $('#toast').className='toast';toastTime=0;renderHUD();canvas.focus({preventScroll:true});
}
function pause(paused=true) {
  if(!setPaused(game,paused))return;
  keys.clear();$('#pause-layer').hidden=!paused;$('#pause-button').textContent=paused?'继续 P':'暂停 P';
  if(paused)$('#resume-button').focus({preventScroll:true});else canvas.focus({preventScroll:true});
}
function showResult() {
  const result=game.result;const over=game.phase==='gameOver', won=game.phase==='weekEnd';
  $('#result-layer').hidden=false;$('#controls').hidden=true;$('#target-hint').hidden=true;$('#riding-help').hidden=true;$('#pause-button').disabled=true;
  $('#result-title').textContent=over?'这周的路线结束了。':won?'七个清晨，顺利送达。':result.perfect?'完美投递，街坊都收到了。':'明天，又是一条路线。';
  $('#result-day').textContent=DAYS[result.day];$('#result-grade').textContent=result.grade;
  $('#result-delivered').textContent=result.delivered;$('#result-missed').textContent=result.missed;$('#result-score').textContent=game.score;
  $('#result-copy').textContent=over?(result.crashed?'生命耗尽。下次放慢一点，留意路上的车和小狗。':'订户全部流失。靠近有旗子的信箱，在提示变绿时投报。'):won?`本周完成 ${game.totalDelivered} 次投递，最终得分 ${game.score}。再试一次，挑战更长的连击。`:result.perfect?`奖励 2,500 分，恢复 1 条生命（最多 3 条）。明天有 ${result.nextSubscribers} 位订户。`:`今天错过 ${result.missed} 位订户。明天继续为 ${result.nextSubscribers} 位街坊送报。`;
  $('#next-button').hidden=over||won;$('#restart-button').className=(over||won)?'primary':'secondary';
  (over||won?$('#restart-button'):$('#next-button')).focus({preventScroll:true});
}
function launchPaper(event) {
  const object=mesh(scene,flightGeometry,'#f8efce',event.x,1.9,-event.z);object.rotation.z=Math.PI/2;
  flights.push({object,start:new THREE.Vector3(event.x,1.9,-event.z),end:new THREE.Vector3(event.endX,1.65,-event.endZ),age:0,hit:event.targetId!==null});
  throwPose=.5;beep('throw');
}
function deliver(){throwPaper(game);processEvents();renderHUD();}
function processEvents(){
  for(const event of game.events.splice(0)) {
    if(event.type==='throw')launchPaper(event);
    if(event.type==='delivery'){notify(`送达 +${event.points}${event.streak>1?' · '+event.streak+' 连击':''}`);beep('delivery');}
    if(event.type==='emptyThrow')notify('没有送达 · 靠近同侧信箱再投递',true);
    if(event.type==='missed')notify('错过一位订户',true);
    if(event.type==='collision'){notify('撞到了！失去 1 条生命',true);beep('collision');}
    if(event.type==='result')showResult();
  }
}
function renderHUD(){
  $('#delivery-value').textContent=`${game.delivered} / ${game.subscribers}`;$('#score-value').textContent=String(game.score).padStart(5,'0');
  $('#lives-value').textContent='♥'.repeat(Math.max(0,game.lives))+'♡'.repeat(3-Math.max(0,game.lives));$('#lives-value').setAttribute('aria-label',game.lives+' 条生命');
  $('#day-value').textContent=`${DAYS[game.day]} · 第 ${game.day+1} / 7 天`;
  $('#paper-value').textContent=`报纸 ${game.papers} 份`;$('#speed-value').textContent=Math.round(game.speed*3.6)+' km/h';
  const progress=Math.round(game.distance/ROUTE_LENGTH*100);$('#route-progress').style.width=progress+'%';$('.route-track').setAttribute('aria-valuenow',progress);
  const next=nearestTarget(game), canReach=reachableTarget(game);
  $('#next-stop').textContent=next?`${next.side<0?'← 左侧':'右侧 →'} · 信箱 ${Math.max(0,Math.round(next.z-game.distance))} m`:'沿街前进，抵达终点';
  $('#target-hint').className='target-hint'+(canReach?' reachable':'');
  $('#target-hint').textContent=game.papers===0?'报纸用完了，继续骑向终点':canReach?'现在投递！按空格 / 点击投报纸':next?`驶向${next.side<0?'左':'右'}侧，靠近有旗子的信箱`:'投递完成，继续骑向终点';
}

$('#start-button').addEventListener('click',()=>begin());
$('#next-button').addEventListener('click',()=>begin(false));
$('#restart-button').addEventListener('click',()=>begin());
$('#restart-pause').addEventListener('click',()=>begin());
$('#pause-button').addEventListener('click',()=>pause(game.phase!=='paused'));
$('#resume-button').addEventListener('click',()=>pause(false));
$('#sound-button').addEventListener('click',()=>{sound=!sound;$('#sound-button').textContent='音效：'+(sound?'开':'关');$('#sound-button').setAttribute('aria-pressed',String(sound));if(sound)beep('delivery');});
$('#throw-button').addEventListener('click',deliver);
$('#left-button').addEventListener('click',()=>{input.targetX=-4.8;});
$('#right-button').addEventListener('click',()=>{input.targetX=4.8;});
for(const mode of ['brake','sprint'])$('#'+mode+'-button').addEventListener('click',()=>{
  input[mode]=!input[mode];const other=mode==='brake'?'sprint':'brake';input[other]=false;
  for(const name of [mode,other]){$('#'+name+'-button').classList.toggle('active',input[name]);$('#'+name+'-button').setAttribute('aria-pressed',String(input[name]));}
});
const gameKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyP','Escape'];
window.addEventListener('keydown',event=>{
  if(!gameKeys.includes(event.code)||event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.code==='KeyP'||event.code==='Escape'){if(!event.repeat)pause(game.phase!=='paused');event.preventDefault();return;}
  if(game.phase!=='riding')return;
  if(event.code==='Space'&&event.target.closest('button,a'))return;
  event.preventDefault();keys.add(event.code);
  if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code))input.targetX=undefined;
  if(event.code==='Space'&&!event.repeat)deliver();
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>pause(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
let dragging=false;
canvas.addEventListener('pointerdown',event=>{if(game.phase!=='riding')return;dragging=true;canvas.setPointerCapture(event.pointerId);input.targetX=(event.clientX/innerWidth*2-1)*6.1;});
canvas.addEventListener('pointermove',event=>{if(dragging)input.targetX=(event.clientX/innerWidth*2-1)*6.1;});
canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause(true);$('#pause-layer').hidden=true;$('#error-layer').hidden=false;$('#error-copy').textContent='图形上下文已丢失。请重新加载游戏。';});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<600?66:55;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();

const cameraTarget = new THREE.Vector3();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  const wasRiding=game.phase==='riding';
  if(wasRiding){
    updateGame(game,dt,{...input,left:keys.has('ArrowLeft')||keys.has('KeyA'),right:keys.has('ArrowRight')||keys.has('KeyD'),brake:input.brake||keys.has('ArrowDown')||keys.has('KeyS'),sprint:input.sprint||keys.has('ArrowUp')||keys.has('KeyW')});
    processEvents();pedal+=game.speed*dt*1.7;
  }
  const visualDt=wasRiding?dt:0;
  toastTime-=dt;if(toastTime<0)$('#toast').classList.remove('show');
  throwPose=Math.max(0,throwPose-visualDt);
  const steer=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
  bike.position.set(game.x,wasRiding&&!reducedMotion?Math.sin(pedal*2)*.015:0,-game.distance);
  bike.rotation.z=THREE.MathUtils.lerp(bike.rotation.z,-steer*.14,dt*8);
  bike.rotation.y=THREE.MathUtils.lerp(bike.rotation.y,-steer*.1,dt*8);
  bike.visible=game.invincible<=0||Math.sin(now*.018)>-.5;
  for(const wheel of wheels)wheel.rotation.x=-pedal*.65;
  for(const leg of legs){const a=pedal+(leg.side<0?Math.PI:0),foot=[leg.side*.23,.88+Math.cos(a)*.26,Math.sin(a)*.26];const knee=[leg.side*.24,1.19+Math.cos(a)*.12,-.34+Math.sin(a)*.12];poseRod(leg.upper,[leg.side*.18,1.61,.22],knee);poseRod(leg.lower,knee,foot);leg.shoe.position.fromArray(foot);}
  poseRod(arm,[-.3,2.29,-.04],throwPose>0?[-1,2.45,-.5]:[-.47,1.72,-.87]);
  for(const target of game.targets){
    const item=targetMeshes.get(target.id);const isNext=target===nearestTarget(game);
    item.group.visible=Math.abs(target.z-game.distance)<125;
    item.flag.rotation.z=target.status==='waiting'?0:Math.PI/2;
    item.halo.visible=target.status==='waiting';
    item.halo.scale.setScalar(!reducedMotion&&isNext?1+Math.sin(now*.005)*.13:1);
    item.marker.visible=target.status==='waiting';
    item.lid.material=material(target.status==='delivered'?'#68aa71':target.status==='missed'?'#a66651':'#eed7a1');
  }
  for(const hazard of game.hazards){const object=hazardMeshes.get(hazard.id);object.position.set(hazard.x,0,-hazard.z);object.visible=Math.abs(hazard.z-game.distance)<120;if(hazard.kind==='dog'&&hazard.active){object.rotation.y=Math.atan2(game.x-hazard.x,-(game.distance-hazard.z));object.position.y=wasRiding?Math.abs(Math.sin(now*.018))*.12:0;}}
  for(let i=flights.length-1;i>=0;i--){const f=flights[i];f.age+=visualDt;const t=Math.min(1,f.age/.52);f.object.position.lerpVectors(f.start,f.end,t);f.object.position.y+=Math.sin(t*Math.PI)*2.5;f.object.rotation.x+=visualDt*12;f.object.rotation.z+=visualDt*5;if(t>=1){scene.remove(f.object);flights.splice(i,1);}}
  $('#hit-flash').classList.toggle('show',game.invincible>2.1);
  for(const lot of lots)lot.visible=Math.abs(-lot.position.z-game.distance)<125;
  const narrow=innerWidth<600;
  camera.position.set(game.x*.35+(narrow?2.4:3.7),narrow?8.3:7,-game.distance+(narrow?17.5:15));
  cameraTarget.set(game.x*.28,1.35,-game.distance-(narrow?9:12));camera.lookAt(cameraTarget);
  sun.position.set(-25,45,-game.distance+10);sun.target.position.set(0,0,-game.distance-22);
  hudClock+=dt;if(hudClock>.08){renderHUD();hudClock=0;}
  renderer.render(scene,camera);
}
renderHUD();requestAnimationFrame(animate);
$('#start-button').disabled=false;$('#start-button').textContent='开始送报 →';
