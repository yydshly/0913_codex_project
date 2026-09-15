import * as THREE from './vendor/three.module.js';
import {V,mat,mesh,box} from './scene-world.mjs';

// Wall cells are omitted at openings, leaving real jamb thickness and clear passages.
export function openingWall(parent,material,width,height,thickness,openings){
 const xs=[-width/2,width/2,...openings.flatMap(o=>[o.x-o.width/2,o.x+o.width/2])].sort((a,b)=>a-b);
 const ys=[0,height,...openings.flatMap(o=>[o.bottom,o.bottom+o.height])].sort((a,b)=>a-b);
 const pieces=[];
 for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){
  const x=(xs[i-1]+xs[i])/2,y=(ys[j-1]+ys[j])/2,w=xs[i]-xs[i-1],h=ys[j]-ys[j-1];
  if(w<1e-6||h<1e-6||openings.some(o=>Math.abs(x-o.x)<o.width/2&&y>o.bottom&&y<o.bottom+o.height))continue;
  pieces.push(box(parent,material,[w,h,thickness],[x,y,0]));
 }
 return pieces;
}

export function createStationRoom(parent,layout,{plaster,wood,trim,metal,coping},makeLabel){
 const shell=new THREE.Group();shell.name='站房 · 实际墙体与门窗';parent.add(shell);
 const interior=new THREE.Group();interior.name='候车室与值班室';parent.add(interior);
 const glass=mat('#a1bbb4',.2);glass.transparent=true;glass.opacity=.22;glass.depthWrite=false;glass.side=THREE.DoubleSide;glass.userData.seasonOwn=true;
 const floorMat=mat('#aba58f',.94),seatMat=mat('#78694e',.83),deskMat=mat('#616b5d',.9);
 for(const m of[floorMat,seatMat,deskMat])m.userData.seasonOwn=true;
 box(interior,floorMat,[3.98,.10,7.80],[-6.4,layout.top-.05,0]);
 const panes=[],doors=[];
 function wall(name,x,z,angle,width,openings){
  const g=new THREE.Group();g.name=name;g.position.set(x,layout.top,z);g.rotation.y=angle;shell.add(g);
  openingWall(g,plaster,width,2.85,.18,openings);
  for(const o of openings){
   if(o.door){
    const pivot=new THREE.Group();pivot.name=o.name;pivot.position.set(o.x-o.width/2,0,0);g.add(pivot);
    openingWall(pivot,wood,o.width-.04,o.height-.04,.075,[{x:0,width:.72,bottom:1.16,height:.77}]);
    // openingWall is centered at zero; shift its leaf components to the hinge.
    for(const child of pivot.children)child.position.x+=o.width/2;
    const pane=mesh(new THREE.PlaneGeometry(.72,.77),glass,pivot);pane.position.set(o.width/2,1.545,.04);panes.push(pane);
    for(const side of[-1,1])box(pivot,metal,[.055,.18,.06],[o.width-.15,1.03,side*.075]);
    for(const side of[-1,1])box(g,trim,[.09,o.height+.06,.23],[o.x+side*(o.width/2+.035),o.height/2,0]);
    box(g,trim,[o.width+.20,.10,.23],[o.x,o.height+.025,0]);
    box(g,coping,[o.width+.12,.045,.38],[o.x,.002,0]);
    doors.push(pivot);
   }else{
    const y=o.bottom+o.height/2;
    const pane=mesh(new THREE.PlaneGeometry(o.width,o.height),glass,g);pane.name='站房通透玻璃';pane.position.set(o.x,y,.015);panes.push(pane);
    for(const sign of[-1,1]){box(g,wood,[.065,o.height,.15],[o.x+sign*(o.width/2-.035),y,0]);box(g,trim,[o.width+.14,.07,.23],[o.x,o.bottom+(sign+1)*o.height/2,0]);}
    box(g,wood,[.055,o.height,.12],[o.x,y,0]);box(g,wood,[o.width,.045,.12],[o.x,y,0]);box(g,coping,[o.width+.2,.08,.30],[o.x,o.bottom-.07,.045]);
   }
  }
  return g;
 }
 const win=(x,width=1.25)=>({x,width,bottom:.91,height:1.12});
 const entry={x:0,width:1.18,bottom:0,height:2.30,door:true,name:'候车室入口门'};
 wall('站台侧外墙',-4.3,0,Math.PI/2,8,[win(-2.55,1.36),entry,win(2.55,1.36)]);
 wall('背侧外墙 · 无临崖出入口',-8.5,0,-Math.PI/2,8,[win(-2.2),win(2.2)]);
 wall('远端山墙',-6.4,-3.99,Math.PI,4.2,[win(0,1.42)]);
 wall('入口侧山墙',-6.4,3.99,0,4.2,[win(-.85,1.08),{...entry,x:1,name:'值班室侧门'}]);
 // Waiting room and staff room connect through an unobstructed internal doorway.
 const partition=new THREE.Group();partition.position.set(-6.4,layout.top,1);interior.add(partition);
 openingWall(partition,plaster,3.98,2.55,.12,[{x:.80,width:1.10,bottom:0,height:2.25}]);
 for(const x of[-7.45,-5.4]){
  box(interior,seatMat,[.70,.10,1.65],[x,layout.top+.45,-2.45]);
  box(interior,seatMat,[.10,.54,1.65],[x+(x<-6?.3:-.3),layout.top+.71,-2.45]);
  for(const z of[-3,-1.9])box(interior,metal,[.44,.40,.08],[x,layout.top+.20,z]);
 }
 box(interior,deskMat,[1.1,.09,.72],[-7.5,layout.top+.77,2.85]);
 for(const x of[-7.95,-7.05])for(const z of[2.58,3.12])box(interior,wood,[.065,.73,.065],[x,layout.top+.365,z]);
 box(interior,seatMat,[.46,.08,.46],[-7.45,layout.top+.44,1.85]);
 for(const x of[-7.62,-7.28])for(const z of[1.68,2.02])box(interior,wood,[.055,.40,.055],[x,layout.top+.20,z]);
 box(interior,seatMat,[.46,.48,.07],[-7.45,layout.top+.68,1.64]);
 const paper=mat('#e7ddbd');paper.userData.seasonOwn=true;box(interior,paper,[.35,.012,.26],[-7.5,layout.top+.825,2.85]);
 for(const [text,x,z,angle]of[['候车室',-4.18,0,Math.PI/2],['值班室',-5.4,4.1,0]]){
  const m=mat('#fff');m.map=makeLabel(text);const sign=mesh(new THREE.PlaneGeometry(.78,.18),m,parent);sign.position.set(x,layout.top+2.52,z);sign.rotation.y=angle;
 }
 const lights=[];
 for(const z of[-1.3,2.5]){const light=new THREE.PointLight('#ffdc9d',0,5,2);light.position.set(-6.4,2.95,z);parent.add(light);lights.push(light);}
 return{shell,interior,doors,panes,lights,setDoors(open){doors.forEach(d=>d.rotation.y=open?Math.PI*.43:0)},update(night){lights.forEach(l=>l.intensity=night*1.8)}};
}
