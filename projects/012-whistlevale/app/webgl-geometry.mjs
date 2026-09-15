import {sub,cross,normalize,dot} from './webgl-math.mjs';
import {addStudyDetails} from './webgl-detail-geometry.mjs';

// Independent teaching geometry. No models or mesh data copied from Whistlevale.
// Vertex layout: position.xyz / normal.xyz / linear color.rgb / material id / UV.
export const STRIDE=12;
const rgb=hex=>[1,3,5].map(i=>{const c=parseInt(hex.slice(i,i+2),16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
const faceUV=(a,b,d)=>{const x=Math.hypot(...sub(b,a)),y=Math.hypot(...sub(d,a));return x>=y?[[0,0],[x,0],[x,y],[0,y]]:[[0,0],[0,x],[y,x],[y,0]];};
export class Builder{
 constructor(){this.vertices=[];this.indices=[];}
 triangle(a,b,c,color,material=0,uv=[[0,0],[1,0],[0,1]]){const n=normalize(cross(sub(b,a),sub(c,a))),base=this.vertices.length/STRIDE,col=rgb(color);for(const [i,p] of[a,b,c].entries())this.vertices.push(...p,...n,...col,material,...uv[i]);this.indices.push(base,base+1,base+2);}
 quad(a,b,c,d,color,material=0,uv=null){uv??=faceUV(a,b,d);this.triangle(a,b,c,color,material,uv.slice(0,3));this.triangle(a,c,d,color,material,[uv[0],uv[2],uv[3]]);}
 surface(points,outward,color,material=0){if(dot(cross(sub(points[1],points[0]),sub(points[2],points[0])),outward)<0)points=[...points].reverse();if(points.length===4){this.quad(...points,color,material);return;}for(let i=1;i<points.length-1;i++)this.triangle(points[0],points[i],points[i+1],color,material);}
 beveledBox(center,size,color,material=0,r=.02){
  const h=size.map(v=>v/2);r=Math.min(r,...h.map(v=>v*.4));
  const point=p=>p.map((v,i)=>v+center[i]);
  // Six inset faces, twelve edge strips, eight corner triangles.
  for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;for(const sign of[-1,1]){const n=[0,0,0];n[axis]=sign;const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const q=[0,0,0];q[axis]=sign*h[axis];q[u]=a*(h[u]-r);q[v]=b*(h[v]-r);return point(q);});this.surface(p,n,color,material);}}
  for(let free=0;free<3;free++){const a=(free+1)%3,b=(free+2)%3;for(const sa of[-1,1])for(const sb of[-1,1]){const n=[0,0,0];n[a]=sa;n[b]=sb;const ps=[];for(const [end,face]of[[-1,0],[1,0],[1,1],[-1,1]]){const q=[0,0,0];q[free]=end*(h[free]-r);q[a]=sa*(h[a]-(face?r:0));q[b]=sb*(h[b]-(face?0:r));ps.push(point(q));}this.surface(ps,n,color,material);}}
  for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1]){const signs=[x,y,z],ps=[0,1,2].map(axis=>point(h.map((v,i)=>signs[i]*(v-(i===axis?0:r)))));this.surface(ps,signs,color,material);}
 }
 beam(a,b,r,color,material=6,segments=8){const axis=normalize(sub(b,a)),u=normalize(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);const ring=(p,angle)=>p.map((q,i)=>q+r*(u[i]*Math.cos(angle)+v[i]*Math.sin(angle)));for(let i=0;i<segments;i++){const t=i*Math.PI*2/segments,s=(i+1)*Math.PI*2/segments,aa=ring(a,t),ab=ring(a,s),ba=ring(b,t),bb=ring(b,s);this.surface([aa,ab,bb,ba],sub(aa,a),color,material);this.surface([a,ab,aa],axis.map(x=>-x),color,material);this.surface([b,ba,bb],axis,color,material);}}
 box(center,size,color,material=0){const [x,y,z]=center,[w,h,d]=size.map(v=>v/2),p=(a,b,c)=>[x+a*w,y+b*h,z+c*d];for(const face of[
  [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]],
  [[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]],
  [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]],
  [[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]],
  [[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]],
  [[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]
 ])this.quad(...face.map(q=>p(...q)),color,material);}
 cylinder(center,r,h,color,material=0,segments=24,axis='y'){
  const p=(a,v)=>axis==='y'?[center[0]+r*Math.cos(a),center[1]+v,center[2]+r*Math.sin(a)]:[center[0]+r*Math.cos(a),center[1]+r*Math.sin(a),center[2]+v];
  const top=axis==='y'?[center[0],center[1]+h/2,center[2]]:[center[0],center[1],center[2]+h/2];
  const bottom=axis==='y'?[center[0],center[1]-h/2,center[2]]:[center[0],center[1],center[2]-h/2];
  for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments,aa=p(a,-h/2),bb=p(b,-h/2),cc=p(b,h/2),dd=p(a,h/2);
   if(axis==='y'){this.quad(aa,dd,cc,bb,color,material);this.triangle(top,cc,dd,color,material);this.triangle(bottom,aa,bb,color,material);}
   else{this.quad(aa,bb,cc,dd,color,material);this.triangle(top,dd,cc,color,material);this.triangle(bottom,bb,aa,color,material);}
  }
 }
 sphere(center,r,color,material=0){const p=(a,b)=>[center[0]+r*Math.sin(a)*Math.cos(b),center[1]+r*Math.cos(a),center[2]+r*Math.sin(a)*Math.sin(b)];const rings=7,sides=12;for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*Math.PI/rings,b=(i+1)*Math.PI/rings,c=j*2*Math.PI/sides,d=(j+1)*2*Math.PI/sides;if(i>0)this.triangle(p(a,c),p(a,d),p(b,c),color,material);if(i<rings-1)this.triangle(p(a,d),p(b,d),p(b,c),color,material);}}
 data(){return{vertices:new Float32Array(this.vertices),indices:new Uint32Array(this.indices),triangles:this.indices.length/3};}
}

export function createStudyGeometry(detailed=false){
 const b=new Builder(),wood='#936846',cream='#e3d3ad',green='#45675b',metal='#687772',brick='#9d6450';
 b.box([0,-.34,0],[10.6,.6,7.2],wood,1);
 b.box([0,-.005,0],[10.3,.07,6.9],'#93a37a',5);
 b.box([-1,.18,-.25],[5.4,.35,4.2],'#b9b4a3',0);
 b.box([-1,1.4,-.75],[3.7,2.1,2.5],cream,0);
 // Roof ridge runs along x. End triangles and sloped faces have outward normals.
 const l=-3.05,r=1.05,z=-.75,a=[l,2.45,z-1.55],c=[l,2.45,z+1.55],peak=[l,3.45,z];
 const ar=[r,a[1],a[2]],cr=[r,c[1],c[2]],pr=[r,peak[1],peak[2]];
 b.quad(a,peak,pr,ar,green,2);b.quad(peak,c,cr,pr,green,2);
 b.triangle(a,c,peak,cream,0);b.triangle(ar,pr,cr,cream,0);
 b.box([-.7,3.34,-1.35],[.44,1.05,.46],brick,4);b.box([-.7,3.89,-1.35],[.58,.12,.6],'#534e44',0);
 // Front doors and windows: glass, frames, sills and shared canopy posts.
 b.box([-.55,1.04,.512],[.8,1.42,.04],wood,1);b.box([-.55,1.32,.55],[.58,.57,.035],'#a3c3bd',3);
 for(const x of[-2.18,.28]){
  b.box([x,1.52,.54],[.78,.82,.055],'#9bbcb5',3);
  for(const dx of[-.43,0,.43])b.box([x+dx,1.52,.585],[.045,.96,.075],wood,1);
  for(const y of[1.04,1.53,2])b.box([x,y,.585],[.92,.045,.075],wood,1);
  b.box([x,1,.6],[1,.10,.20],cream,0);
 }
 b.box([-.55,1,.601],[.055,.13,.06],'#c3a05d',6);
 b.box([-1,2.40,.94],[4.25,.13,1.35],green,2);
 for(const x of[-2.98,1]){b.box([x,1.35,1.44],[.095,2,.095],wood,1);b.box([x,.4,1.44],[.2,.15,.2],metal,6);}
 for(let i=0;i<3;i++)b.box([-3.28,.11+i*.085,1.55-i*.27],[.82,.15,.76-i*.16],'#c4beb0',0);
 // Slatted bench and a warm station lamp.
 for(let i=0;i<5;i++)b.box([-2,.66,1.03+i*.072],[1.05,.055,.045],wood,1);
 for(let i=0;i<3;i++)b.box([-2,.83+i*.10,1.03],[1.05,.045,.045],wood,1);
 for(const x of[-2.4,-1.6])b.box([x,.5,1.17],[.05,.35,.28],metal,6);
 b.cylinder([1.6,1.3,.45],.04,2.6,metal,6,12);
 b.box([1.6,2.58,.45],[.30,.08,.30],metal,6);if(!detailed)b.box([1.6,2.38,.45],[.19,.32,.19],'#ffda8a',7);
 b.box([1.6,2.2,.45],[.28,.07,.28],metal,6);
 // One straight teaching track; it is not a route or a railway simulator.
 b.box([0,.12,2.5],[10,.23,1.28],'#777e72',0);
 for(let x=-4.8;x<=4.81;x+=.27)b.box([x,.265,2.5],[.13,.09,1.16],'#706354',1);
 for(const zz of[2.11,2.89]){b.box([0,.36,zz],[10,.14,.048],metal,6);b.box([0,.3,zz],[10,.035,.10],metal,6);}
 for(const [x,zz,h] of[[3,-1.7,1.7],[4.15,-.7,1.3],[3.8,-2.6,1.5],[-4.15,-2,1.2]]){
  b.cylinder([x,h*.48,zz],.075,h,wood,1,10);b.sphere([x,h+.2,zz],.65,'#718d60',5);b.sphere([x+.22,h+.65,zz],.48,'#819763',5);
 }
 const car=new Builder();
 car.box([0,.7,0],[1.85,.65,.97],'#af5143',8);car.box([0,1.31,0],[1.78,.61,.94],cream,0);
 car.box([0,1.66,0],[1.97,.16,1.1],green,6);car.box([0,.44,0],[1.77,.14,.83],'#3e4947',6);
 for(const side of[-1,1])for(const x of[-.59,0,.59]){car.box([x,1.34,side*.477],[.45,.38,.025],'#9cbeba',3);for(const dx of[-.25,.25])car.box([x+dx,1.34,side*.50],[.03,.48,.035],green,6);}
 car.box([.942,1.30,0],[.04,.43,.74],'#9cbeba',3);
 for(const s of[-1,1])car.box([.96,.86,s*.31],[.035,.16,.16],'#ffdd98',7);
 const wheel=new Builder();wheel.cylinder([0,0,0],.235,.12,'#394441',6,24,'z');wheel.cylinder([0,0,.07],.10,.025,'#bcac82',6,18,'z');wheel.box([0,0,.09],[.34,.035,.025],'#d1c29b',6);
 const tri=new Builder();tri.triangle([-1.3,-.75,0],[1.3,-.75,0],[0,1.25,0],'#c28750',0);
 if(detailed)addStudyDetails(b,car,wheel);
 return{world:b.data(),car:car.data(),wheel:wheel.data(),triangle:tri.data()};
}
