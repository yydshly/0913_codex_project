import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box,beam,labelTexture} from './scene-world.mjs';
import {stationLayout} from './scene-station-layout.mjs';
import {createStationRoom} from './scene-station-room.mjs';

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
 const stone=mat('#858e83',.95),coping=mat('#c5bca6',.83),plaster=mat('#dfd3b6',.92),wood=mat('#625740',.86),trim=mat('#b9ac8e',.86),roof=mat('#365c54',.75),metal=mat('#364c43',.65,.2);
 const slab=(outline,top,material=stone)=>mesh(groundedSlabGeometry(layout,outline,top),material,group);
 const front=layout.rows.map(p=>[p.x,p.z]),back=layout.rows.map(p=>[layout.back,p.z]).reverse();
 slab([...front,...back],layout.top-.07);
 const cap=groundedSlabGeometry(layout,[...front,...back],layout.top),cp=cap.attributes.position;
 for(let i=0;i<cp.count;i++)if(cp.getY(i)<layout.top-.02)cp.setY(i,layout.top-.07);cap.computeVertexNormals();mesh(cap,coping,group);
 slab(rectangle(-8.65,-4.15,-4.25,4.25),layout.top-.10);
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
 const room=createStationRoom(group,layout,{plaster,wood,trim,metal,coping},makeLabel);
 // Side exit joins the existing entrance platform, away from the narrow cliff-side strip.
 slab(rectangle(-6.15,-4.10,4.03,5.0),layout.top,coping);
 // Guard the exposed porch edges while leaving the platform connection clear.
 for(const [a,b]of[[V(-6.15,layout.top+.86,4.24),V(-6.15,layout.top+.86,4.98)],[V(-6.15,layout.top+.86,4.98),V(-4.42,layout.top+.86,4.98)]]){beam(group,metal,a,b,.055);const count=Math.ceil(a.distanceTo(b)/.6);for(let i=0;i<=count;i++){const q=a.clone().lerp(b,i/count);beam(group,metal,V(q.x,layout.top,q.z),q,.05);}}
 const shelter=new THREE.Group();shelter.name='站房屋顶与阁楼';group.add(shelter);
 const gable=new THREE.Shape();gable.moveTo(-2.1,0);gable.lineTo(0,1.08);gable.lineTo(2.1,0);gable.closePath();
 const attic=new THREE.ExtrudeGeometry(gable,{depth:8,bevelEnabled:false});attic.translate(-6.4,3.39,-4);mesh(attic,plaster,shelter);
 const roofShape=new THREE.Shape();roofShape.moveTo(-2.65,0);roofShape.lineTo(0,1.35);roofShape.lineTo(2.65,0);roofShape.lineTo(2.65,-.13);roofShape.lineTo(0,1.18);roofShape.lineTo(-2.65,-.13);roofShape.closePath();
 const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:8.95,bevelEnabled:false});roofGeometry.translate(-6.4,3.4,-4.475);mesh(roofGeometry,roof,shelter);
 for(const z of[-4.49,4.49]){beam(shelter,wood,V(-9.03,3.37,z),V(-6.4,4.72,z),.11);beam(shelter,wood,V(-6.4,4.72,z),V(-3.77,3.37,z),.11);}
 beam(shelter,metal,V(-6.4,4.76,-4.52),V(-6.4,4.76,4.52),.11,.17);
 for(const z of[-3.7,-1.85,0,1.85,3.7])for(const side of[-1,1])beam(shelter,metal,V(-6.4+side*.02,4.76,z),V(-6.4+side*2.58,3.45,z),.025,.035);
 for(const x of[-8.98,-3.82]){beam(shelter,metal,V(x,3.34,-4.5),V(x,3.34,4.5),.08,.10);box(shelter,metal,[.085,2.8,.085],[x,1.95,3.9]);}
 for(const z of[-3.5,-1.25,1.25,3.5]){beam(group,wood,V(-3.35,layout.top,z),V(-3.35,3.04,z),.10);beam(group,wood,V(-3.35,2.45,z),V(-3.85,2.94,z),.08);}
 box(group,roof,[1.85,.13,8.1],[-3.48,3.02,0]);box(group,trim,[.11,.19,8.1],[-2.55,2.96,0]);
 const sign=mat('#fff');sign.map=makeLabel('白鹭河站');
 const board=mesh(new THREE.PlaneGeometry(2.5,.6),sign,group);board.rotation.y=Math.PI/2;board.position.set(-2.47,2.7,0);
 // Gable sign remains visible from the original station camera.
 for(const z of[-4.12,4.12]){const board=mesh(new THREE.PlaneGeometry(1.75,.40),sign,shelter);board.rotation.y=z<0?Math.PI:0;board.position.set(-6.4,3.67,z);}
 for(const z of[-5.3,4.55]){box(group,wood,[.60,.12,1.6],[-3.45,.99,z]);for(const dz of[-.54,.54])box(group,metal,[.09,.45,.09],[-3.45,.75,z+dz]);box(group,wood,[.09,.38,1.6],[-3.72,1.19,z]);}
 const lamp=mat('#ffdfa1',.4);lamp.emissive.set('#ffc46b');const lights=[];
 for(const z of[-7.4,7.5]){
  box(group,metal,[.11,2.85,.11],[-3.65,layout.top+1.425,z]);box(group,metal,[.4,.08,.4],[-3.65,3.44,z]);
  box(group,lamp,[.24,.34,.24],[-3.65,3.21,z]);const light=new THREE.PointLight('#ffd09b',0,10,2);light.position.set(-3.65,3.1,z);group.add(light);lights.push(light);
 }
 const canopyLight=new THREE.PointLight('#ffd09b',0,6,2);canopyLight.position.set(-3.05,2.68,0);group.add(canopyLight);lights.push(canopyLight);
 lights.push(...room.lights);
 return{group,layout,lights,room,shelter,setInspection({cutaway=false,doors=false}={}){shelter.visible=!cutaway;room.setDoors(doors);},target:group.localToWorld(V(-3,1,0)),update(night){lamp.emissiveIntensity=.05+night*2;lights.forEach((l,i)=>l.intensity=night*(i===2?2:3.2));room.update(night);}};
}
