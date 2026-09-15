import * as THREE from './vendor/three.module.js';
import{V,mat,mesh,box}from './scene-world.mjs';
export function windowMaterial(){const m=mat('#8cb8bd',.14,0);m.transparent=true;m.opacity=.18;m.depthWrite=false;m.side=THREE.DoubleSide;m.userData.seasonOwn=true;return m;}
export function sideWindow(parent,glass,frame,side,z,y=2.01,width=.74,height=.84,x=1.003){
 for(const h of[-1,1])box(parent,frame,[.045,.045,width+.045],[side*x,y+h*height/2,z]);
 for(const e of[-1,1])box(parent,frame,[.045,height,.04],[side*x,y,z+e*width/2]);
 const pane=mesh(new THREE.PlaneGeometry(width-.04,height-.045),glass,parent);pane.rotation.y=side*Math.PI/2;pane.position.set(side*(x+.008),y,z);pane.name='通透侧窗';return pane;
}
function rod(parent,material,a,b,r=.035){const m=mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),material,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return m;}
export function createCab(car,{cream,red,roof,steel,glass,signMat,lightMat}){
 const cab=new THREE.Group();cab.name='前端驾驶室';car.add(cab);
 const frontZ=y=>3.78-(y-1.1)*.22;
 function frontPanel(material,x0,x1,y0,y1){const v=[x0,y0,frontZ(y0),x1,y0,frontZ(y0),x1,y1,frontZ(y1),x0,y1,frontZ(y1)],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(g,material,cab);}
 box(cab,steel,[1.85,.15,1.06],[0,.765,3.22]);
 frontPanel(red,-.88,.88,.85,1.42);frontPanel(cream,-.88,.88,1.42,1.65);frontPanel(cream,-.88,.88,2.52,2.78);
 for(const [x0,x1]of[[-.94,-.77],[-.025,.025],[.77,.94]])frontPanel(steel,x0,x1,1.65,2.52);
 for(const [x0,x1]of[[-.77,-.025],[.025,.77]]){const p=frontPanel(glass,x0,x1,1.65,2.52);p.name='驾驶室前挡风玻璃';}
 frontPanel(steel,-.82,.82,1.60,1.65);frontPanel(steel,-.82,.82,2.52,2.56);
 for(const side of[-1,1]){box(cab,red,[.09,.45,1.0],[side*.915,1.07,3.17]);box(cab,cream,[.09,.32,1.0],[side*.915,1.455,3.17]);box(cab,cream,[.09,.25,1.0],[side*.915,2.635,3.17]);sideWindow(cab,glass,steel,side,3.02,2.065,.72,.89,.95);box(cab,cream,[.09,.9,.18],[side*.915,2.05,2.58]);}
 box(cab,roof,[1.94,.14,1.20],[0,2.81,3.15]);box(cab,steel,[1.90,.16,.13],[0,.83,3.79]);
 box(cab,steel,[.20,.16,.42],[0,.67,3.94]);for(const side of[-1,1]){const bezel=mesh(new THREE.CylinderGeometry(.15,.15,.07,16),steel,cab);bezel.rotation.x=Math.PI/2;bezel.position.set(side*.61,1.15,frontZ(1.15)+.02);const lamp=mesh(new THREE.SphereGeometry(.115,12,8),lightMat,cab);lamp.scale.z=.45;lamp.position.set(side*.61,1.15,frontZ(1.15)+.075);}
 const badge=box(cab,signMat,[.75,.16,.022],[0,2.67,frontZ(2.67)+.018]);badge.rotation.x=-.215;
 const wipers=[];for(const x of[-.39,.39]){const pivot=new THREE.Group();cab.add(pivot);pivot.position.set(x,1.69,frontZ(1.69)+.025);pivot.rotation.x=-.215;rod(pivot,steel,V(0,0,0),V(.17,.57,0),.013);rod(pivot,steel,V(.13,.38,0),V(.22,.72,0),.018);wipers.push(pivot);}
 const trim=mat('#3c5051'),seat=mat('#425a58'),uniform=mat('#314d60'),skin=mat('#c79d7c'),hair=mat('#39342f'),gold=mat('#d6b46b');[trim,seat,uniform,skin,hair,gold].forEach(m=>m.userData.seasonOwn=true);
 box(cab,cream,[1.8,.7,.055],[0,1.20,2.40]);box(cab,trim,[.78,.30,.35],[-.32,1.40,3.20]);
 const desk=box(cab,trim,[.81,.065,.40],[-.32,1.57,3.17]);desk.rotation.x=.22;
 const screen=mat('#466a5b',.7);screen.emissive.set('#83bba0');screen.emissiveIntensity=.22;screen.userData.seasonOwn=true;const display=box(cab,screen,[.22,.014,.12],[-.34,1.62,3.15]);display.rotation.x=.22;
 const throttle=new THREE.Group();cab.add(throttle);throttle.position.set(-.57,1.59,3.11);rod(throttle,steel,V(),V(0,.13,0),.02);box(throttle,steel,[.09,.04,.05],[0,.14,0]);
 rod(cab,steel,V(-.03,1.55,3.12),V(-.03,1.72,3.12),.025);
 box(cab,seat,[.46,.10,.39],[-.34,1.36,2.84]);box(cab,seat,[.46,.44,.08],[-.34,1.57,2.64]);rod(cab,steel,V(-.34,.84,2.82),V(-.34,1.31,2.82),.045);
 const driver=new THREE.Group();cab.add(driver);driver.name='司机 · 面向行驶方向';driver.position.set(-.34,1.45,2.85);
 function oval(parent,m,s,p){const o=mesh(new THREE.SphereGeometry(1,12,8),m,parent);o.scale.set(...s);o.position.set(...p);return o;}
 oval(driver,uniform,[.19,.25,.13],[0,.24,0]);const head=new THREE.Group();driver.add(head);head.position.set(0,.64,.025);oval(head,skin,[.125,.16,.12],[0,0,0]);oval(head,hair,[.13,.075,.125],[0,.12,-.01]);oval(head,skin,[.032,.04,.05],[0,-.02,.125]);for(const side of[-1,1])oval(head,hair,[.014,.014,.012],[side*.046,.024,.115]);box(head,uniform,[.28,.06,.25],[0,.16,0]);box(head,uniform,[.25,.02,.10],[0,.135,.16]);box(driver,gold,[.07,.035,.018],[.08,.35,.13]);
 for(const side of[-1,1]){const shoulder=V(side*.18,.39,0),elbow=V(side*.23,.16,.14),hand=V(side*.25,.24,.30);rod(driver,uniform,shoulder,elbow,.055);rod(driver,uniform,elbow,hand,.05);oval(driver,skin,[.045,.055,.04],hand.toArray());const hip=V(side*.10,0,0),knee=V(side*.11,-.32,.27),ankle=V(side*.11,-.53,.35);rod(driver,uniform,hip,knee,.065);rod(driver,uniform,knee,ankle,.054);oval(driver,steel,[.065,.05,.13],[side*.11,-.56,.40]);}
 const eye=V(-.386,2.12,3.02);let lastSpeed=0,brake=0;
 function update(dt,time,{speed=0,paused=false,rain=0,night=0}={}){if(!paused&&dt>0){brake+=((speed<lastSpeed-.0001?1:0)-brake)*(1-Math.exp(-dt*4));throttle.rotation.x+=(Math.min(1,speed/4.8)*.32-throttle.rotation.x)*(1-Math.exp(-dt*3));head.rotation.y=Math.sin(time*.45)*.045;wipers.forEach((p,i)=>p.rotation.z=rain>.1?Math.sin(time*(1+rain*2)+i*.08)*.58:-.40);lastSpeed=speed;}screen.emissiveIntensity=.16+night*.65;driver.userData.activity=paused?'暂停':speed<.05?'停车监控':brake>.4?'制动进站':'驾驶中';}
 return{group:cab,driver,eye,wipers,throttle,update};
}
