import * as T from './vendor/three.module.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
export function roundedBox(w,h,d,r=.06){const shape=new T.Shape(),x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(shape,{depth:Math.max(.01,d-r*2),bevelEnabled:true,bevelSize:r/2,bevelThickness:r,bevelSegments:2,steps:1,curveSegments:3});g.translate(0,0,-d/2+r);return g;}
function add(parent,g,color){const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.88,side:T.DoubleSide}));m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function cord(parent,points,color='#c9b791',radius=.012){return add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),20,radius,5,false),color);}
export function tentFabric(parent,color){for(const sign of [-1,1]){const g=new T.PlaneGeometry(1,1,14,18),p=g.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=p.getY(i)+.5;p.setXYZ(i,sign*1.3*u,1.65*(1-u)-.1*Math.sin(Math.PI*u)*Math.sin(Math.PI*v),-1.5+3*v);}g.computeVertexNormals();add(parent,g,color);for(const z of [-1.5,1.5]){cord(parent,[[0,1.67,z],[sign*.65,.79,z],[sign*1.31,.02,z]],'#d5c8a7',.018);cord(parent,[[sign*.66,.83,z],[sign*1.95,.015,z*1.2]],'#d3cbb2',.01);const stake=add(parent,new T.CylinderGeometry(.02,.02,.2,6),'#7c8175');stake.position.set(sign*1.95,.02,z*1.2);stake.rotation.z=sign*.3;}}cord(parent,[[0,1.67,-1.5],[0,1.67,0],[0,1.67,1.5]],'#c7b694',.02);
 const mat=add(parent,roundedBox(1.65,.025,.65,.008),'#827650');mat.position.set(0,.024,1.85);for(const x of [-.4,.4]){const boot=add(parent,roundedBox(.18,.13,.32,.025),'#424e43');boot.position.set(x,.10,1.85);}
}
export function addCampDetails(world,land){const g=new T.Group;g.position.set(land.camp.x+.3,land.camp.y,land.camp.z-2.3);world.add(g);const pot=add(g,new T.SphereGeometry(.14,16,12),'#84948e');pot.scale.y=.7;pot.position.set(-.42,.9,.05);const handle=add(g,new T.TorusGeometry(.105,.015,6,16,Math.PI),'#4b574e');handle.position.set(-.42,1,.05);const spout=add(g,new T.CylinderGeometry(.025,.045,.17,8),'#84948e');spout.position.set(-.25,.93,.05);spout.rotation.z=-.6;for(const x of [.38,.64]){const cup=add(g,new T.CylinderGeometry(.055,.05,.11,12),'#d8c9a0');cup.position.set(x,.85,.03);}
 const bag=add(world,roundedBox(.48,.55,.3,.06),'#7e7152');bag.position.set(land.camp.x+1.3,land.camp.y+.28,land.camp.z-1.3);cord(world,[[land.camp.x+1.15,land.camp.y+.5,land.camp.z-1.45],[land.camp.x+1.13,land.camp.y+.72,land.camp.z-1.35],[land.camp.x+1.4,land.camp.y+.5,land.camp.z-1.45]],'#414d41',.025);
 // Modest route markers explain where the narrow walking trail goes.
 for(const t of [.08,.32,.6,.82]){const p=land.trail.sample(t),x=p.x+Math.cos(p.heading)*.76,z=p.z-Math.sin(p.heading)*.76,y=land.terrain(x,z);const marker=add(world,new T.CylinderGeometry(.035,.045,.65,6),'#847b5b');marker.position.set(x,y+.325,z);const cap=add(world,new T.CylinderGeometry(.038,.038,.12,6),'#d9ad65');cap.position.set(x,y+.62,z);}
 // A low timber edge defines parking without blocking the arrival path.
 for(const z of [land.camp.z-1.3,land.camp.z,land.camp.z+1.3]){const post=add(world,new T.CylinderGeometry(.055,.06,.55,7),'#7b7258');post.position.set(land.camp.x-12,land.terrain(land.camp.x-12,z)+.275,z);}
}

export function addRouteDetails(world,land){
 let seed=1729;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),stones=[];
 for(const [route,width,count] of [[land.drive,1.6,110],[land.trail,.48,150]])for(let i=0;i<count;i++){
  const t=(i+random())/count;if(t<.025||t>.97||random()<.28)continue;
  const p=route.sample(t),offset=(random()<.5?-1:1)*(width+.07+random()*.40),x=p.x+Math.cos(p.heading)*offset,z=p.z-Math.sin(p.heading)*offset;
  if(Math.hypot(x-land.camp.x,z-land.camp.z)<5.2||Math.hypot(x-land.summit.x,z-land.summit.z)<2.5)continue;
  stones.push({x,z,y:land.terrain(x,z),size:.035+random()*.075,turn:random()*6.28,tint:random()});
 }
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#b0a38a',roughness:1}),stones.length),dummy=new T.Object3D;
 stones.forEach((p,i)=>{dummy.position.set(p.x,p.y+.012,p.z);dummy.scale.set(p.size,p.size*.45,p.size*.8);dummy.rotation.set(.12,p.turn,.18);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);rocks.setColorAt(i,new T.Color('#7c796b').lerp(new T.Color('#d8c9aa'),p.tint));});rocks.castShadow=rocks.receiveShadow=true;world.add(rocks);
}
