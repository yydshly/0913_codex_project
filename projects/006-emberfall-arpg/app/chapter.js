import * as T from './vendor/three.module.js';
import {surface} from './art.js';
import {combatStats} from './equipment.mjs';
import {POINTS,objective,distance} from './game-state.mjs';

export function buildChapter({scene,box,cylinder,sphere,mat,actor,tree,onPoint}){
 const world=new T.Group();scene.add(world);const markers=new Map(),hazards=new Map(),arrows=new Map(),shrines=new Map(),chests=new Map();
 const layer=document.createElement('div');layer.className='world-labels';document.querySelector('#game').appendChild(layer);
 const maskCanvas=document.createElement('canvas');maskCanvas.width=maskCanvas.height=128;const maskContext=maskCanvas.getContext('2d');const gradient=maskContext.createRadialGradient(64,64,20,64,64,64);gradient.addColorStop(0,'white');gradient.addColorStop(.65,'#ddd');gradient.addColorStop(1,'black');maskContext.fillStyle=gradient;maskContext.fillRect(0,0,128,128);const mask=new T.CanvasTexture(maskCanvas);
 for(const[x,z,color,w,d]of[[-19,8,'#444a30',16,18],[20,0,'#777563',17,18],[0,-21,'#343e43',17,13]]){const tex=surface('stone').clone();tex.repeat.set(7,7);tex.needsUpdate=true;const patch=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color,map:tex,bumpMap:tex,bumpScale:.1,alphaMap:mask,transparent:true,opacity:.95,depthWrite:false,roughness:.92}));patch.rotation.x=-Math.PI/2;patch.position.set(x,.145,z);scene.add(patch);}
 for(const p of POINTS){const el=document.createElement('button');el.className='world-label '+p.type;el.textContent=p.name;el.onclick=()=>onPoint(p.id);el.title='点击前往，靠近后交互';layer.appendChild(el);markers.set(p.id,el);}
 // Make the three objectives read as different places within one traversable map.
 for(const[x,z]of [[16,-1],[22,5],[24,7],[18,-6],[25,-3]]){const rock=sphere(x,.65,z,.9,'#777d79');rock.scale.set(1.5,1.5,1);sphere(x+.5,1.25,z,.45,'#8b958b');}
 for(let i=0;i<7;i++){box(15+i*1.45,.12,-5,.13,.12,4,'#696052');}box(19.5,.13,-6.1,10,.1,.1,'#aaa38b');box(19.5,.13,-3.9,10,.1,.1,'#aaa38b');
 for(const[x,z]of [[-2,-23],[3,-23]]){cylinder(x,1.4,z,.7,.8,2.8,'#666f6b',6);box(x,2.8,z,1.5,.3,1.5,'#89948a');sphere(x,3.18,z,.2,'#be7d51');}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;box(Math.cos(a)*4,.15,-21+Math.sin(a)*4,.8,.25,.7,'#5a6464');}
 const altar=box(0,.36,-20,2.2,.6,1.6,'#62666b');const core=sphere(0,1.25,-20,.45,'#ac665d');core.material=new T.MeshStandardMaterial({color:'#bb776b',emissive:'#d64e31',emissiveIntensity:2});
 for(const id of ['west','east']){const p=POINTS.find(p=>p.id===id);cylinder(p.x,.2,p.z,1,1.15,.35,'#697b73',8);const stone=box(p.x,1,p.z,.7,1.5,.4,'#7b887c');stone.rotation.z=.06;const rune=box(p.x,1.13,p.z+.23,.1,.7,.03,'#a3d1bd');rune.material=new T.MeshStandardMaterial({color:'#b3e1d1',emissive:'#4a9c8c',emissiveIntensity:1.4});shrines.set(id,rune);}
 for(const p of POINTS.filter(p=>p.type==='chest'&&!p.area)){const g=new T.Group();g.position.set(p.x,0,p.z);scene.add(g);box(0,.37,0,.95,.65,.63,'#756142',g);const lid=box(0,.75,0,1.02,.16,.68,'#98805c',g);for(const x of[-.35,.35])box(x,.4,.33,.1,.7,.04,'#b5a178',g);box(0,.5,.36,.15,.2,.05,'#d0ae5d',g);chests.set(p.id,{g,lid});}
 const npc=actor();npc.g.position.set(-4,0,4);npc.g.rotation.y=.8;npc.g.scale.setScalar(1.05);npc.cape.material.color.set('#34575c');npc.hand.visible=false;
 box(-10,.7,-4,1.4,.18,.85,'#625140');for(const x of[-10.55,-9.45])box(x,.3,-4,.14,.65,.6,'#66513b');const anvil=box(-10,1,-4,.8,.42,.43,'#84908c');anvil.material=new T.MeshStandardMaterial({color:'#7d8787',metalness:.8,roughness:.4});box(-10.5,1.22,-4,.5,.1,.3,'#959d9b');
 const guide=new T.Mesh(new T.TorusGeometry(.5,.045,6,32),new T.MeshBasicMaterial({color:'#ead592',transparent:true,opacity:.85}));guide.rotation.x=Math.PI/2;scene.add(guide);
 let latest={};
 function update(s,camera,time){const goal=objective(s).target;const dest=POINTS.find(p=>p.id===goal);guide.position.set(dest.x,.23,dest.z);guide.scale.setScalar(1+Math.sin(time*.003)*.15);
  for(const p of POINTS){const el=markers.get(p.id),d=distance(s.player,p),pos=new T.Vector3(p.x,p.type==='npc'?2.65:1.9,p.z).project(camera);const used=s.opened.includes(p.id)||s.seals.includes(p.id);el.style.display=(p.area||'overworld')===s.area&&d<15&&pos.z<1&&!used&&!(p.id==='scout'&&s.scoutRescued)&&!(p.id==='rift-home'&&!s.bossDead)?'block':'none';el.style.left=(pos.x*.5+.5)*innerWidth+'px';el.style.top=(-pos.y*.5+.5)*innerHeight+'px';el.classList.toggle('target',p.id===goal);el.classList.toggle('near',d<2.7);}
  for(const[id,rune]of shrines){rune.material.emissive.set(s.seals.includes(id)?'#e1ae43':'#408e89');rune.material.emissiveIntensity=s.seals.includes(id)?.25:1.5;}
  for(const[id,c]of chests){c.lid.rotation.x=s.opened.includes(id)?-.9:0;c.lid.position.z=s.opened.includes(id)?-.2:0;}
  core.visible=!s.bossDead;core.rotation.y=time*.001;core.position.y=1.2+Math.sin(time*.002)*.15;altar.material=mat(s.seals.length===2?'#9a7966':'#62666b');
  for(const h of s.hazards){let m=hazards.get(h.id);if(!m){m=new T.Group();const ring=new T.Mesh(new T.RingGeometry(.87,1,48),new T.MeshBasicMaterial({color:h.type==='arrow'?'#ffc77c':'#ff6144',side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=-Math.PI/2;m.add(ring);const fill=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:'#ee4937',side:T.DoubleSide,transparent:true,opacity:.2,depthWrite:false}));fill.rotation.x=-Math.PI/2;fill.position.y=.015;m.add(fill);scene.add(m);hazards.set(h.id,m);}m.position.set(h.x,.19,h.z);m.scale.setScalar(h.r);m.children[1].scale.setScalar(Math.max(.05,1-h.left/h.total));}
  for(const[id,m]of hazards)if(!s.hazards.some(h=>h.id===id)){scene.remove(m);m.traverse(c=>{c.geometry?.dispose();c.material?.dispose();});hazards.delete(id);}
  for(const a of s.projectiles){let m=arrows.get(a.id);if(!m){m=new T.Mesh(new T.ConeGeometry(.08,.8,5),new T.MeshBasicMaterial({color:'#f7ae75'}));m.rotation.x=Math.PI/2;scene.add(m);arrows.set(a.id,m);}m.position.set(a.x,1,a.z);m.rotation.z=-Math.atan2(a.dx,a.dz);}
  for(const[id,m]of arrows)if(!s.projectiles.some(a=>a.id===id)){scene.remove(m);m.geometry.dispose();m.material.dispose();arrows.delete(id);}
  latest=s;
 }
 return {update,guide};
}

export function journal(s){const q=objective(s),stats=combatStats(s);return `<div class="journal-grid"><div><small>武器</small><strong>旅人长剑 +${s.weapon}</strong><p>斩击 ${stats.attack} · 星陨 ${stats.spell}</p></div><div><small>护甲</small><strong>游侠护甲 +${s.armor}</strong><p>每次受击减伤 ${stats.defense}</p></div><div><small>余烬</small><strong>${s.gold}</strong><p>强化装备或购买药剂</p></div><div><small>补给</small><strong>药剂 ${s.potions} / 9</strong><p>每瓶恢复 65 生命</p></div></div><div class="journal-quest"><h3>${q.title}</h3><p>${q.detail}</p><p>${s.seals.includes('west')?'◆':'◇'} 朽木封印　${s.seals.includes('east')?'◆':'◇'} 沉石封印　${s.bossDead?'◆':'◇'} 星门核心</p></div>`;}
