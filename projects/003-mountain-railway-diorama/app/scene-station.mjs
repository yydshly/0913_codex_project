import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,beam,labelTexture} from './scene-world.mjs';
import {stationLayout} from './scene-station-layout.mjs';

// A closed slab with a sampled buried lower edge; no fixed-height floating bases.
export function groundedSlabGeometry(layout,outline,top){
 const points=outline.map(([x,z])=>new THREE.Vector2(x,z)),faces=THREE.ShapeUtils.triangulateShape(points,[]),positions=[];
 const vertex=(i,bottom=false)=>{const[x,z]=outline[i];return[x,bottom?Math.min(top-.12,layout.ground(x,z)-.18):top,z];};
 const tri=(a,b,c)=>positions.push(...a,...b,...c);
 for(const[a,b,c]of faces){tri(vertex(c),vertex(b),vertex(a));tri(vertex(a,true),vertex(b,true),vertex(c,true));}
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;tri(vertex(i),vertex(j),vertex(i,true));tri(vertex(j),vertex(j,true),vertex(i,true));}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
 // Triangulation winding may vary with outline order; top faces always point up.
 const p=geometry.attributes.position,n=geometry.attributes.normal;
 for(let i=0;i<p.count;i+=3)if(p.getY(i)===top&&p.getY(i+1)===top&&p.getY(i+2)===top&&n.getY(i)<0){const b=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,...b);}
 geometry.computeVertexNormals();return geometry;
}
const rectangle=(x0,x1,z0,z1,segments=8)=>{
 const p=[];for(let i=0;i<segments;i++)p.push([x0+(x1-x0)*i/segments,z0]);
 for(let i=0;i<segments;i++)p.push([x1,z0+(z1-z0)*i/segments]);
 for(let i=0;i<segments;i++)p.push([x1-(x1-x0)*i/segments,z1]);
 for(let i=0;i<segments;i++)p.push([x0,z1-(z1-z0)*i/segments]);return p;
};
export function createStation(parent,world,makeLabel=labelTexture){
 const layout=stationLayout(world),group=new THREE.Group();group.name='白鹭河站 · 曲线站台与接地入口';group.position.copy(layout.origin);group.rotation.y=layout.angle;parent.add(group);
 const stone=mat('#858e83',.95),coping=mat('#c5bca6',.83),plaster=mat('#dfd3b6',.92),wood=mat('#625740',.86),trim=mat('#b9ac8e',.86),roof=mat('#365c54',.75),metal=mat('#364c43',.65,.2),interior=mat('#233936',.95),glass=mat('#557268',.34,.08),windowGlow=mat('#8e987b',.48);
 windowGlow.emissive.set('#efc78a');glass.emissive.set('#cfad79');
 const slab=(outline,top,material=stone)=>mesh(groundedSlabGeometry(layout,outline,top),material,group);
 const front=layout.rows.map(p=>[p.x,p.z]),back=layout.rows.map(p=>[layout.back,p.z]).reverse();
 slab([...front,...back],layout.top-.07);
 const cap=groundedSlabGeometry(layout,[...front,...back],layout.top),cp=cap.attributes.position;
 for(let i=0;i<cp.count;i++)if(cp.getY(i)<layout.top-.02)cp.setY(i,layout.top-.07);cap.computeVertexNormals();mesh(cap,coping,group);
 slab(rectangle(-8.65,-4.15,-4.25,4.25),layout.top+.02);
 // Rail-side coping follows the track instead of opening a gap at the platform ends.
 for(let i=0;i<layout.rows.length-1;i++){
  const a=layout.rows[i],b=layout.rows[i+1];beam(group,trim,V(a.x-.12,layout.top+.015,a.z),V(b.x-.12,layout.top+.015,b.z),.055,.23);
 }
 for(const step of layout.steps)slab(rectangle(step.x-step.width/2,step.x+step.width/2,layout.entry.z-.775,layout.entry.z+.775,2),step.height,coping);
 // Ground-following forecourt joins the lowest tread to the surrounding grass.
 const forecourt=rectangle(-8.6,-6.7,4.6,7.5,8),fg=groundedSlabGeometry(layout,forecourt,layout.landing);
 const fp=fg.attributes.position;for(let i=0;i<fp.count;i++)if(Math.abs(fp.getY(i)-layout.landing)<.001)fp.setY(i,layout.ground(fp.getX(i),fp.getZ(i))+.04);fg.computeVertexNormals();mesh(fg,coping,group);
 for(const z of[layout.entry.z-.9,layout.entry.z+.9]){
  const a=V(layout.entry.x-.06,layout.top+.82,z),b=V(layout.entry.x-layout.entry.run,layout.landing+.82,z);
  beam(group,metal,a,b,.055);for(const q of[a,b])beam(group,metal,V(q.x,q.y-.82,q.z),q,.065);
 }
 box(group,plaster,[4.2,2.85,8],[-6.4,layout.top+1.425,0]);
 box(group,trim,[4.32,.26,8.08],[-6.4,layout.top+.13,0]);
 for(const x of[-8.52,-4.28])for(const z of[-3.95,3.95])box(group,trim,[.16,2.66,.15],[x,1.98,z]);
 // Recessed dark openings, separate warm inner panes and muntins add depth.
 function window(x,z,angle,width=1.22,height=1.12,y=2.03){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;group.add(g);
  box(g,interior,[width+.18,height+.18,.07],[0,0,0]);
  box(g,glass,[width,height,.04],[0,0,.047]);
  box(g,windowGlow,[width*.42,height*.86,.025],[width*.24,0,.071]);
  for(const side of[-1,1]){box(g,wood,[.065,height+.2,.11],[side*(width+.1)/2,0,.09]);box(g,trim,[width+.25,.065,.16],[0,side*(height+.1)/2,.09]);}
  box(g,wood,[.055,height,.09],[0,0,.09]);box(g,wood,[width,.045,.08],[0,.02,.09]);box(g,coping,[width+.35,.09,.23],[0,-height/2-.11,.1]);
 }
 for(const z of[-2.55,2.55])window(-4.28,z,Math.PI/2,1.36);
 for(const z of[-2.2,2.2])window(-8.52,z,-Math.PI/2);
 for(const z of[-4.025,4.025]){window(-6.4,z,z<0?Math.PI:0,1.42,1.15);window(-6.4,z,z<0?Math.PI:0,.48,.42,3.65);}
 // Platform door and a rear service door both have a legible threshold.
 for(const[x,angle]of[[-4.275,Math.PI/2],[-8.525,-Math.PI/2]]){
  const door=new THREE.Group();door.position.set(x,layout.top,0);door.rotation.y=angle;group.add(door);
  box(door,wood,[1.05,2.25,.10],[0,1.125,0]);box(door,glass,[.72,.77,.045],[0,1.62,.077]);
  box(door,trim,[.78,.68,.05],[0,.62,.08]);box(door,metal,[.06,.2,.08],[.37,1.04,.1]);
  for(const side of[-1,1])box(door,trim,[.1,2.35,.12],[side*.57,1.175,.03]);box(door,trim,[1.24,.1,.14],[0,2.36,.04]);
 }
 // A narrow paved apron reaches the rear door; its edge is a retaining foundation.
 slab(rectangle(-9.1,-8.45,-.8,4.6),layout.top,coping);
 const rearLanding=layout.ground(-8.6,6.2)+.04,rearCount=Math.max(1,Math.ceil((layout.top-rearLanding)/.17));
 for(let i=0;i<rearCount;i++)slab(rectangle(-9.1,-8.25,4.6+i*1.6/rearCount,4.6+(i+1)*1.6/rearCount,2),layout.top-(i+1)*(layout.top-rearLanding)/rearCount,coping);
 const gable=new THREE.Shape();gable.moveTo(-2.1,0);gable.lineTo(0,1.08);gable.lineTo(2.1,0);gable.closePath();
 const attic=new THREE.ExtrudeGeometry(gable,{depth:8,bevelEnabled:false});attic.translate(-6.4,3.39,-4);mesh(attic,plaster,group);
 const roofShape=new THREE.Shape();roofShape.moveTo(-2.65,0);roofShape.lineTo(0,1.35);roofShape.lineTo(2.65,0);roofShape.lineTo(2.65,-.13);roofShape.lineTo(0,1.18);roofShape.lineTo(-2.65,-.13);roofShape.closePath();
 const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:8.95,bevelEnabled:false});roofGeometry.translate(-6.4,3.4,-4.475);mesh(roofGeometry,roof,group);
 for(const z of[-4.49,4.49]){beam(group,wood,V(-9.03,3.37,z),V(-6.4,4.72,z),.11);beam(group,wood,V(-6.4,4.72,z),V(-3.77,3.37,z),.11);}
 beam(group,metal,V(-6.4,4.76,-4.52),V(-6.4,4.76,4.52),.11,.17);
 for(const z of[-3.7,-1.85,0,1.85,3.7])for(const side of[-1,1])beam(group,metal,V(-6.4+side*.02,4.76,z),V(-6.4+side*2.58,3.45,z),.025,.035);
 for(const x of[-8.98,-3.82]){beam(group,metal,V(x,3.34,-4.5),V(x,3.34,4.5),.08,.10);box(group,metal,[.085,2.8,.085],[x,1.95,3.9]);}
 for(const z of[-3.5,0,3.5]){beam(group,wood,V(-3.35,layout.top,z),V(-3.35,3.04,z),.10);beam(group,wood,V(-3.35,2.45,z),V(-3.85,2.94,z),.08);}
 box(group,roof,[1.85,.13,8.1],[-3.48,3.02,0]);box(group,trim,[.11,.19,8.1],[-2.55,2.96,0]);
 const sign=mat('#fff');sign.map=makeLabel('白鹭河站');
 const board=mesh(new THREE.PlaneGeometry(2.5,.6),sign,group);board.rotation.y=Math.PI/2;board.position.set(-2.47,2.7,0);
 // Gable sign remains visible from the original station camera.
 for(const z of[-4.12,4.12]){const board=mesh(new THREE.PlaneGeometry(2.15,.48),sign,group);board.rotation.y=z<0?Math.PI:0;board.position.set(-6.4,2.99,z);}
 for(const z of[-5.3,4.55]){box(group,wood,[.60,.12,1.6],[-3.45,.99,z]);for(const dz of[-.54,.54])box(group,metal,[.09,.45,.09],[-3.45,.75,z+dz]);box(group,wood,[.09,.38,1.6],[-3.72,1.19,z]);}
 const lamp=mat('#ffdfa1',.4);lamp.emissive.set('#ffc46b');const lights=[];
 for(const z of[-7.4,7.5]){
  box(group,metal,[.11,2.85,.11],[-3.65,layout.top+1.425,z]);box(group,metal,[.4,.08,.4],[-3.65,3.44,z]);
  box(group,lamp,[.24,.34,.24],[-3.65,3.21,z]);const light=new THREE.PointLight('#ffd09b',0,10,2);light.position.set(-3.65,3.1,z);group.add(light);lights.push(light);
 }
 const canopyLight=new THREE.PointLight('#ffd09b',0,6,2);canopyLight.position.set(-3.05,2.68,0);group.add(canopyLight);lights.push(canopyLight);
 return{group,layout,lights,target:group.localToWorld(V(-3,1,0)),update(night){glass.emissiveIntensity=.015+night*.24;windowGlow.emissiveIntensity=.025+night*.85;lamp.emissiveIntensity=.05+night*2;lights.forEach((l,i)=>l.intensity=night*(i===2?2:3.2));}};
}
