import * as T from './vendor/three.module.js';
import {MAPS,DUNGEON_POINTS,TRAPS,onFloor} from './maps.mjs';
import {surface} from './art.js';

// Rooms and collision share the same floor plan; walls frame the actual corridors.
export function buildDungeons({scene,box,cylinder,sphere,mat,actor}){
 const groups={},objects=new Map(),barrels=new Map(),flames=[],traps=[],lavaMaterials=[];
 for(const area of ['crypt','depths']){
  const g=new T.Group();g.visible=false;groups[area]=g;scene.add(g);
  const hot=area==='depths',floorMat=new T.MeshStandardMaterial({color:hot?'#63554b':'#63737a',map:surface('stone'),roughness:.9,bumpMap:surface('stone'),bumpScale:.14});
  const floor=new T.InstancedMesh(new T.BoxGeometry(.98,.28,.98),floorMat,3000),wall=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat(hot?'#53403b':'#3c4c54'),3000);const d=new T.Object3D();let fi=0,wi=0;
  for(let x=-26;x<26;x++)for(let z=-26;z<26;z++){
   if(!onFloor(x+.5,z+.5,0,area))continue;
   d.position.set(x+.5,-.15,z+.5);d.scale.set(1,1,1);d.updateMatrix();floor.setMatrixAt(fi++,d.matrix);
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])if(!onFloor(x+.5+dx,z+.5+dz,0,area)){
    const h=dx===1||dz===1?.65:2.25;
    d.position.set(x+.5+dx*.48,h/2,z+.5+dz*.48);d.scale.set(dx?.25:1,h,dz?.25:1);d.updateMatrix();wall.setMatrixAt(wi++,d.matrix);
   }
  }
  floor.count=fi;wall.count=wi;floor.receiveShadow=true;wall.castShadow=true;wall.receiveShadow=true;g.add(floor,wall);
  for(const o of MAPS[area].solids){box(o.x,1.2,o.z,o.w,2.4,o.d,hot?'#68514a':'#68757b',g);box(o.x,2.4,o.z,o.w+.3,.25,o.d+.3,'#93918a',g);}
  for(const r of MAPS[area].rooms.filter(r=>r.w>8&&r.d>6)){
   for(const side of[-1,1]){
    const x=r.x+side*(r.w/2-1.2),z=r.z-r.d/2+1.3;
    cylinder(x,.35,z,.45,.55,.7,'#544f45',8,g);
    const f=sphere(x,1,z,.2,'#e9b27b',g);f.material=new T.MeshBasicMaterial({color:hot?'#ff9b48':'#82d9ea'});flames.push(f);
    const light=new T.PointLight(hot?'#ff8543':'#88cce6',16,9,2);light.position.set(x,1.5,z);g.add(light);
   }
  }
  // Burial masonry, inlaid aisles, hanging cloth and rubble give each wing a purpose.
  const trim=hot?'#987653':'#77888b';
  for(const r of MAPS[area].rooms.filter(r=>r.w>8&&r.d>6)){
   for(const side of[-1,1]){
    const x=r.x+side*(r.w/2-.65);
    for(let z=r.z-r.d/2+2.5;z<r.z+r.d/2-1;z+=3){box(x,.35,z,.55,.7,1.7,hot?'#634942':'#586870',g);box(x,.75,z,.65,.12,1.9,trim,g);for(const dz of[-.7,.7])box(x,.89,z+dz,.6,.15,.12,trim,g);}
    const cloth=new T.Mesh(new T.PlaneGeometry(.9,1.9),new T.MeshStandardMaterial({color:hot?'#7c3028':'#304e60',side:T.DoubleSide,roughness:1}));cloth.position.set(x,1.3,r.z-r.d/2+.35);g.add(cloth);box(x,2.35,r.z-r.d/2+.35,1.15,.08,.08,'#aa926d',g);
   }
   const seal=new T.Mesh(new T.RingGeometry(1.4,1.45,32),new T.MeshStandardMaterial({color:trim,emissive:hot?'#7b3918':'#285563',emissiveIntensity:.3,side:T.DoubleSide}));seal.rotation.x=-Math.PI/2;seal.position.set(r.x,.012,r.z);g.add(seal);
   for(let i=0;i<8;i++){const a=i*Math.PI/4;const rune=box(r.x+Math.cos(a)*1.6,.025,r.z+Math.sin(a)*1.6,.12,.03,.35,trim,g);rune.rotation.y=-a;}
  }
  for(const r of MAPS[area].rooms.filter(r=>r.w<=7&&r.d>8)){
   for(let z=r.z-r.d/2+1;z<r.z+r.d/2;z+=2){for(const side of[-1,1])box(r.x+side*(r.w/2-.45),.01,z,.08,.04,1.6,trim,g);}
  }
  for(let i=0;i<160;i++){const x=Math.sin(i*73.31)*24,z=Math.cos(i*47.17)*23;if(!onFloor(x,z,.7,area))continue;const rubble=sphere(x,.05,z,.05+(i%4)*.025,hot?'#6d5b4c':'#7b8580',g);rubble.scale.y=.35;}
  // Clustered flame tongues flicker above braziers; they are visible from the isometric camera.
  for(const f of flames.filter(f=>g.getObjectById(f.id))){const tongues=new T.Group();f.add(tongues);for(let i=0;i<3;i++){const m=new T.Mesh(new T.ConeGeometry(.3-i*.05,1.7-i*.3,5),new T.MeshBasicMaterial({color:hot?'#ffd08b':'#c1f5ff',transparent:true,opacity:.7}));m.position.set((i-1)*.2,.5+i*.1,0);tongues.add(m);}}
  // A lower lava surface is visible only around the carved sanctuary floor.
  if(hot){const lava=new T.Mesh(new T.PlaneGeometry(62,62),new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec2 uvL;void main(){uvL=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec2 uvL;uniform float time;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){vec2 p=uvL*27.0;float n=noise(p+time*.035)*.65+noise(p*2.7-time*.023)*.25+noise(p*7.0)*.1;float vein=1.0-smoothstep(.015,.10,abs(n-.5));vec3 coal=vec3(.055,.037,.032);vec3 fire=mix(vec3(.36,.048,.012),vec3(.95,.38,.055),pow(vein,3.0));gl_FragColor=vec4(mix(coal,fire,vein),1);}`}));lava.rotation.x=-Math.PI/2;lava.position.y=-1.5;g.add(lava);lavaMaterials.push(lava.material);}
  for(const p of DUNGEON_POINTS.filter(p=>p.area===area)){
   const o=new T.Group();o.position.set(p.x,0,p.z);g.add(o);objects.set(p.id,o);
   if(p.type==='travel'){
    for(let i=0;i<4;i++)box(0,.08+i*.11,-.9+i*.45,2.7,.17,.5,'#7e8180',o);
    for(const x of[-1.4,1.4])box(x,1.6,0,.35,3.2,.55,'#616a70',o);box(0,3.1,0,3.1,.45,.55,'#8b8a80',o);
    const veil=new T.Mesh(new T.PlaneGeometry(2.3,2.6),new T.MeshBasicMaterial({color:'#65cddc',transparent:true,opacity:.26,side:T.DoubleSide,depthWrite:false}));veil.position.y=1.6;o.add(veil);o.userData.veil=veil;
   }else if(p.type==='lever'){
    cylinder(0,.4,0,.65,.8,.8,'#738182',8,o);const gem=sphere(0,1.1,0,.3,'#b28554',o);gem.material=new T.MeshStandardMaterial({color:'#d19d61',emissive:'#ff863b',emissiveIntensity:1.6});o.userData.gem=gem;
   }else if(p.type==='chest'){
    box(0,.4,0,1.1,.7,.7,'#685539',o);const lid=box(0,.84,0,1.18,.18,.8,'#b69963',o);box(0,.52,.38,.18,.25,.06,'#edcc79',o);o.userData.lid=lid;
   }else if(p.type==='rest'){
    cylinder(0,.18,0,.8,1,.35,'#605d52',8,o);const ember=sphere(0,.7,0,.3,'#eaa46a',o);ember.material=new T.MeshBasicMaterial({color:'#ffb665'});flames.push(ember);const l=new T.PointLight('#ffab65',20,9,2);l.position.y=1.5;o.add(l);
   }else if(p.type==='rescue'){
    const npc=actor();npc.g.removeFromParent();o.add(npc.g);npc.cape.material.color.set('#678b73');npc.hand.visible=false;
    for(const x of[-.8,.8])box(x,1,0,.1,2,.1,'#484e51',o);
   }else if(p.type==='boss'){
    cylinder(0,.2,0,2.2,2.4,.35,'#776258',12,o);box(0,1.1,-1,1.8,2.2,.4,'#635651',o);for(const x of[-1,1])box(x,.7,0,.3,1.4,1.7,'#a07f5d',o);
   }
  }
 }
 for(const t of TRAPS){const m=new T.Mesh(new T.CircleGeometry(t.r,40),new T.MeshBasicMaterial({color:'#e78a3d',transparent:true,opacity:.15,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(t.x,.025,t.z);groups[t.area].add(m);traps.push({m,t});}
 return{setArea(area){for(const[id,g]of Object.entries(groups))g.visible=id===area;},update(s,now){
  for(const m of lavaMaterials)m.uniforms.time.value=now*.001;for(const f of flames){f.scale.y=1+Math.sin(now*.008+f.position.x)*.25;}
  for(const[id,o]of objects){if(o.userData.gem)o.userData.gem.material.emissive.set(s.levers.includes(id)?'#63d9ad':'#ff863b');if(o.userData.lid)o.userData.lid.rotation.x=s.opened.includes(id)?-.8:0;if(o.userData.veil){o.userData.veil.material.opacity=.2+Math.sin(now*.002)*.07;o.userData.veil.material.color.set(id==='descent'&&s.levers.length<2?'#d28256':'#65cddc');}if(id==='scout')o.visible=!s.scoutRescued;if(id==='rift-home')o.visible=s.bossDead;}
  for(const{m,t}of traps){const pulse=(s.time+t.offset)%5;m.material.opacity=pulse>3.8?.85:pulse>2.8?.4:.12;m.material.color.set(pulse>3.8?'#ff6130':'#bd894c');}
  for(const b of s.breakables){if(!barrels.has(b.id)){const g=new T.Group();g.position.set(b.x,0,b.z);cylinder(0,.5,0,.45,.42,1,'#6f563b',8,g);for(const y of[.15,.8])cylinder(0,y,0,.47,.47,.1,'#9a8c73',8,g);groups[s.area]?.add(g);barrels.set(b.id,{g,area:s.area});}}
  for(const[id,b]of barrels){if(b.area===s.area&&!s.breakables.some(v=>v.id===id)){b.g.removeFromParent();barrels.delete(id);}}
 },reset(){for(const b of barrels.values())b.g.removeFromParent();barrels.clear();}};
}
