import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {exhibits} from './exhibits.mjs';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const palette={floor:0xc8c4ad,wall:0xe8e8de,ink:0x263f35,brass:0xb7a16d,stone:0xb5bba3};
const geometryCache=new Map(), materialCache=new Map();
function mat(color,roughness=.85){const key=color+':'+roughness;if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness}));return materialCache.get(key);}
function box(parent,x,y,z,w,h,d,color){const key=[w,h,d].join(',');if(!geometryCache.has(key))geometryCache.set(key,new THREE.BoxGeometry(w,h,d));const mesh=new THREE.Mesh(geometryCache.get(key),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function cylinder(parent,x,y,z,rt,rb,h,color,n=20){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function line(parent,points,color,radius=.025,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*8),radius,5,closed),mat(color));parent.add(mesh);return curve;}
function plaque(parent,text,x,y,z,w,h,color='#263f35',bg='#e8e8de',size=42){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${size}px "Microsoft YaHei", sans-serif`;ctx.fillText(text,c.width/2,c.height/2,c.width-60);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function pine(parent,x,z,height=1.5,color=0x476744,base=1.25){cylinder(parent,x,base+height*.36,z,.07,.1,height*.72,0x735b40,8);for(let i=0;i<3;i++){const mesh=new THREE.Mesh(new THREE.ConeGeometry(height*(.29-i*.045),height*.64,7),mat(color));mesh.position.set(x,base+height*(.48+i*.2),z);mesh.castShadow=true;parent.add(mesh);}}
function treePot(parent,x,z){cylinder(parent,x,.35,z,.34,.26,.7,0xa3ab95,20);for(let i=0;i<4;i++){const a=i*2.4;pine(parent,x+Math.cos(a)*.16,z+Math.sin(a)*.16,1.25,0x56694c,.65);}}
function ridge(parent,x,z,height,color=0x798b68){const mesh=new THREE.Mesh(new THREE.ConeGeometry(height*.65,height,6),mat(color));mesh.position.set(x,1.27+height/2,z);mesh.scale.z=.7;mesh.castShadow=true;parent.add(mesh);const peak=new THREE.Mesh(new THREE.ConeGeometry(height*.17,height*.26,6),mat(0xdfdfca));peak.position.set(x,1.28+height*.88,z);peak.scale.z=.7;parent.add(peak);}
function wheel(parent,x,y,z){const m=cylinder(parent,x,y,z,.13,.13,.1,0x263531,12);m.rotation.x=Math.PI/2;}
function miniTrain(parent){const g=new THREE.Group();parent.add(g);box(g,0,.22,0,.75,.22,.35,0x2d5745);box(g,.17,.44,0,.28,.25,.37,0xe8d8ad);cylinder(g,-.18,.46,0,.06,.07,.26,0x253e31);for(const x of [-.23,.23])for(const z of [-.2,.2])wheel(g,x,.12,z);for(let i=1;i<3;i++){const c=box(g,-.84*i,.3,0,.66,.42,.34,i===1?0xd1ae73:0x759b78);for(const z of [-.18,.18])for(const x of [-.84*i-.2,-.84*i,-.84*i+.2])box(g,x,.38,z,.1,.15,.016,0xecebd8);for(const x of [-.84*i-.22,-.84*i+.22])for(const z of [-.2,.2])wheel(g,x,.12,z);}return g;}

function makePod(item,scene,animations,clickables,textureJobs){const g=new THREE.Group();g.position.set(item.position[0],0,item.position[1]);scene.add(g);
 const dark=0x34473e;const accent=new THREE.Color(item.color);const base=box(g,0,.48,0,7.5,.95,5.7,dark);base.userData.id=item.id;clickables.push(base);box(g,0,1.02,0,7.66,.15,5.83,0xb29b70);box(g,0,1.16,0,7.5,.16,5.65,0xc2c8a9);box(g,0,.1,0,7.2,.2,5.3,0x203329);
 plaque(g,item.project+'  /  '+item.title,0,.56,2.861,6.6,.38,'#eadfc6','#34473e',37);
 const board=box(g,0,4.35,-2.45,6.98,3.8,.16,0x2d4036);board.userData.id=item.id;clickables.push(board);
 const picture=new THREE.Mesh(new THREE.PlaneGeometry(6.66,3.48),new THREE.MeshBasicMaterial({color:0xe6ead9}));picture.position.set(0,4.35,-2.35);g.add(picture);picture.userData.id=item.id;clickables.push(picture);
 if(item.image){textureJobs.push(new Promise(resolve=>new THREE.TextureLoader().load('assets/'+item.image,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;const imageRatio=texture.image.width/texture.image.height,ratio=6.66/3.48;if(imageRatio>ratio){texture.repeat.x=ratio/imageRatio;texture.offset.x=(1-texture.repeat.x)/2;}else{texture.repeat.y=imageRatio/ratio;texture.offset.y=(1-texture.repeat.y)/2;}picture.material.map=texture;picture.material.color.set(0xffffff);picture.material.needsUpdate=true;resolve(true);},undefined,()=>{resolve(false);})));}
 else{picture.visible=false;plaque(g,'010  /  松脊驾驶练习',0,4.55,-2.34,6.65,1.7,'#f0e6d3','#34463e',56);plaque(g,'选择路线 · 自由驾驶 · 即时反馈',0,3.55,-2.33,6.65,.68,'#d2b181','#34463e',37);}
 box(g,-3.1,2,-2.5,.07,1.9,.07,0x9e895f);box(g,3.1,2,-2.5,.07,1.9,.07,0x9e895f);box(g,0,6.4,-2.65,7.4,.16,.6,0x34473e);const strip=box(g,0,6.29,-2.42,6.7,.035,.15,0xffedc4);strip.material=new THREE.MeshBasicMaterial({color:0xffefd3});
 const ring=new THREE.Mesh(new THREE.RingGeometry(4.55,4.63,64),new THREE.MeshBasicMaterial({color:accent,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.scale.y=.74;ring.position.y=.061;g.add(ring);ring.visible=false;g.userData.ring=ring;
 if(item.id==='railway'){
  box(g,0,1.28,0,6.9,.12,4.6,0x8f9d68);ridge(g,-1.5,-.7,1.65);ridge(g,-.35,-.85,1.05);for(let i=0;i<8;i++)pine(g,-2.8+(i%4)*1.35,-.8+Math.floor(i/4)*1.6,.8+(i%3)*.19);
  const points=Array.from({length:24},(_,i)=>[3.05*Math.cos(i/24*Math.PI*2),1.47,1.7*Math.sin(i/24*Math.PI*2)]);line(g,points,0x647165,.1,true);const curve=line(g,points,0xddc799,.025,true);const train=miniTrain(g);train.scale.setScalar(.55);animations.push(t=>{const p=curve.getPointAt(t*.029%1),d=curve.getTangentAt(t*.029%1);train.position.copy(p);train.rotation.y=-Math.atan2(d.z,d.x);});
  box(g,1.1,1.55,.1,.8,.5,.6,0xe0ccaa);const roof=box(g,1.1,1.86,.1,.99,.13,.83,0x506551);roof.rotation.z=.12;
 }else if(item.id==='weather'){
  box(g,0,1.31,.2,6.6,.12,4.5,0x93a79d);box(g,-.7,1.75,-.2,2.7,.85,1.7,0xe0d5b3);const roof=box(g,-.7,2.29,-.2,3.18,.28,2.3,0x536c66);roof.rotation.z=.045;for(const x of [-1.8,.2])box(g,x,1.81,.666,.55,.5,.03,0xc6decb);for(let i=0;i<5;i++)box(g,1.75,1.42,1.8-i*.65,.8,.055,.4,0xd3d4bb);
  for(const x of [-2.45,2.55])pine(g,x,-.7,1.3,0x3d695f);const drops=new Float32Array(90*3);for(let i=0;i<90;i++){drops[i*3]=Math.sin(i*43.3)*3;drops[i*3+1]=1.5+(i%19)/19*2.8;drops[i*3+2]=Math.cos(i*17.8)*1.9;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(drops,3));const rain=new THREE.Points(geo,new THREE.PointsMaterial({color:0xc0e7e9,size:.037,transparent:true,opacity:.8}));g.add(rain);animations.push((t,dt)=>{const p=geo.attributes.position;for(let i=0;i<90;i++){p.array[i*3+1]-=dt*1.4;if(p.array[i*3+1]<1.4)p.array[i*3+1]=4.2;}p.needsUpdate=true;});
 }else if(item.id==='nature'){
  box(g,0,1.3,.1,6.7,.15,4.6,0x879565);const p=[[-3,1.43,1.6],[-1.5,1.43,1],[0,1.43,.6],[1.4,1.43,-.1],[3,1.43,-1.2]];line(g,p,0xb7a47a,.29);for(let i=0;i<13;i++){const x=-2.8+(i%7)*.88,z=i<7?-1.25:1.75;pine(g,x,z,.8+(i%4)*.27,0x476a43);}for(let i=0;i<5;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.19+(i%2)*.1,0),mat(0x9e9c86));rock.position.set(-2+i,1.55,Math.sin(i)*.8);g.add(rock);}
 }else if(item.id==='motion'){
  box(g,0,1.3,0,6.9,.1,4.7,0x939b6a);const p=Array.from({length:28},(_,i)=>[2.65*Math.cos(i/28*Math.PI*2),1.42,1.43*Math.sin(i/28*Math.PI*2)]);const curve=line(g,p,0xbea17a,.3,true);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;box(g,3.2*Math.cos(a),1.6,1.92*Math.sin(a),.33,.32,.16,i%2?0xdad9bd:0xb77150);}
  const car=new THREE.Group();box(car,0,.15,0,.42,.2,.22,0xc96c4b);for(const x of [-.16,.16])for(const z of [-.15,.15])wheel(car,x,.1,z);g.add(car);animations.push(t=>{const p=curve.getPointAt(t*.042%1),d=curve.getTangentAt(t*.042%1);car.position.copy(p);car.rotation.y=-Math.atan2(d.z,d.x);});pine(g,0,0,1.2);
 }else if(item.id==='city'){
  box(g,0,1.3,0,6.9,.12,4.5,0xd8cca1);for(let i=0;i<9;i++){const x=-2.6+(i%3)*2.1,z=-1.1+Math.floor(i/3)*1.2;const h=.3+(i%4)*.21;box(g,x,1.4+h/2,z,.7,h,.6,i%2?0xbc9d69:0xa2ad87);const r=box(g,x,1.4+h+.08,z,.92,.14,.79,0x557169);r.rotation.z=.08;}line(g,[[-3,1.39,.8],[-1,1.39,.65],[1.3,1.39,.7],[3,1.39,-1.1]],0x88aaa5,.15);
 }else{
  box(g,0,1.3,0,6.8,.12,4.4,0xc5c2cd);for(let i=0;i<3;i++){const pane=box(g,-2.1+i*2.1,2.05,-.4+i*.35,1.65,1.2,.14,i===0?0x697f6c:i===1?0x8ba2ba:0xa58caa);pane.rotation.y=-.12+i*.12;box(g,-2.1+i*2.1,1.5,.65+i*.35,1.8,.12,.9,0xebe8dc);}for(let i=0;i<4;i++)cylinder(g,-2.6+i*1.7,1.52,1.6,.17,.17,.2,0x7a857f);
 }
 return g;
}

export async function createHall(host,labelHost,onSelect){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xe3e6dc);scene.fog=new THREE.Fog(0xe3e6dc,58,125);
 const camera=new THREE.PerspectiveCamera(40,1,.1,160);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','三维作品展馆，拖动旋转，滚轮缩放。也可用作品目录选择展品。');
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.12;controls.minDistance=7;controls.maxDistance=85;controls.enablePan=true;controls.screenSpacePanning=false;controls.target.set(0,0,3);
 scene.add(new THREE.HemisphereLight(0xfff8e4,0x82958b,2.5));const sun=new THREE.DirectionalLight(0xfff0cc,3.2);sun.position.set(-18,35,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:32,bottom:-32,near:1,far:100});sun.shadow.bias=-.0008;sun.shadow.normalBias=.035;scene.add(sun);const fill=new THREE.DirectionalLight(0xc3ddeb,.9);fill.position.set(25,12,-14);scene.add(fill);
 box(scene,0,-.3,2,35,.55,48,0xadb29c);box(scene,0,-.05,2,34.4,.12,47.4,palette.floor);
 const tileGeom=new THREE.BoxGeometry(2.7,.018,2.85),tileMat=mat(0xd7d5c1);const tiles=new THREE.InstancedMesh(tileGeom,tileMat,11*16);const dummy=new THREE.Object3D();let n=0;for(let x=0;x<11;x++)for(let z=0;z<16;z++){dummy.position.set(-14.5+x*2.9,.027,-20.6+z*2.9);dummy.updateMatrix();tiles.setMatrixAt(n,dummy.matrix);tiles.setColorAt(n,new THREE.Color().setHSL(.14,.15,.71+((x*7+z*3)%5)*.016));n++;}tiles.receiveShadow=true;scene.add(tiles);
 box(scene,0,.055,2,5.7,.035,47,0x9aa78f);for(const x of [-2.94,2.94])box(scene,x,.08,2,.045,.04,47,0xd4c498);
 box(scene,0,2.5,-21.5,34,5,.38,palette.wall);box(scene,-17,1,2,.35,2,47,palette.wall);box(scene,17,1,2,.35,2,47,palette.wall);
 for(const x of [-16,-11.3,-5.6,0,5.6,11.3,16]){box(scene,x,2.6,-21.2,.38,5.2,.5,0xbcc5b2);box(scene,x,5.3,-21.2,.8,.18,.8,palette.wall);}
 plaque(scene,'我们的作品馆',0,3.7,-20.97,10,1.1,'#344d3d','#e8e8de',68);plaque(scene,'FIELD NOTES     /     COLLECTION 01',0,2.75,-20.95,10,.5,'#7c896e','#e8e8de',31);
 for(const z of [-17, -5,7,20]){for(const x of [-15.3,15.3]){treePot(scene,x,z);}}
 for(const z of [-5.4,6.6,20.5]){box(scene,0,.4,z,3.7,.17,.85,0x917c58);for(const x of [-1.45,1.45])box(scene,x,.2,z,.12,.4,.7,0x405446);}
 for(const [title,z]of [['山水与天气',-9],['地形与运动',3],['图鉴与界面',15]]){const p=plaque(scene,title,0,.115,z,4.6,.9,'#e9e7d4','#657961',75);p.rotation.x=-Math.PI/2;}
 const animations=[],clickables=[],textureJobs=[];const pods=new Map();const labels=[];
 for(const item of exhibits){const pod=makePod(item,scene,animations,clickables,textureJobs);pods.set(item.id,pod);const button=document.createElement('button');button.className='exhibit-label';button.innerHTML=`<span class="number">${item.project}</span>${item.title}`;button.setAttribute('aria-label','近看'+item.title+'展台');button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>onSelect(item.id));labelHost.append(button);labels.push({button,position:new THREE.Vector3(item.position[0],.3,item.position[1]+4)});}
 let active=true,disposed=false,tween=null,last=0,elapsed=0,selected=null;const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let down=null;
 const overviewPosition=()=>host.clientWidth<600?new THREE.Vector3(36,49,62):new THREE.Vector3(32,35,48);
 function go(position,target){tween={position,target};if(reduced){camera.position.copy(position);controls.target.copy(target);tween=null;controls.update();}}
 camera.position.copy(overviewPosition());controls.update();
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6){down=null;return;}down=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(clickables,false)[0];if(hit)onSelect(hit.object.userData.id);});
 controls.addEventListener('start',()=>{tween=null;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;document.querySelector('#fallback').hidden=false;labelHost.hidden=true;});
 function frame(now){if(disposed)return;requestAnimationFrame(frame);if(!active||document.hidden){last=now;return;}if(now-last<1000/40)return;const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 if(tween){const a=1-Math.exp(-dt*4.4);camera.position.lerp(tween.position,a);controls.target.lerp(tween.target,a);if(camera.position.distanceTo(tween.position)<.03)tween=null;}controls.update();
 if(!reduced)for(const update of animations)update(elapsed,dt);
 renderer.render(scene,camera);for(const label of labels){const p=label.position.clone().project(camera);const show=p.z<1&&p.z>-1&&Math.abs(p.x)<1.08&&Math.abs(p.y)<.95;label.button.hidden=!show;if(show){label.button.style.left=(p.x*.5+.5)*host.clientWidth+'px';label.button.style.top=(-p.y*.5+.5)*host.clientHeight+'px';}}
 }
 requestAnimationFrame(frame);
 const api={select(id,move=true){selected=id;for(const [key,pod]of pods)pod.userData.ring.visible=key===id;labels.forEach((v,i)=>v.button.setAttribute('aria-pressed',String(exhibits[i].id===id)));if(move){const item=exhibits.find(x=>x.id===id);go(new THREE.Vector3(item.position[0]+9,10,item.position[1]+12),new THREE.Vector3(item.position[0],2.3,item.position[1]));}},overview(){go(overviewPosition(),new THREE.Vector3(0,.5,2));},setActive(value){active=value;last=performance.now();},dispose(){disposed=true;observer.disconnect();controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();labelHost.replaceChildren();}};
 renderer.render(scene,camera);
 // Missing artwork does not prevent navigation or opening the actual work.
 Promise.all(textureJobs).then(results=>{if(results.some(x=>!x))document.querySelector('#hall-caption').textContent='部分图片未载入，仍可选择展台进入作品。';});
 return api;
}
