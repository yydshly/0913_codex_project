import {waterAt} from './shoreline.js';
import {earthHeight,depressions} from './rain-experience.js';
export const gardenTrees=[[-8,6,4.2,1],[8,-5,5.3,3],[8,8,3.8,5],[-12,-12,6,6],[15,-12,7,8],[-16,10,5.5,11]];
const inside=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<=w/2&&Math.abs(z-cz)<=d/2;
export function roofHeightAt(x,z){
 if(inside(x,z,-4,-4,10.5,9.5))return 5.15;
 if(inside(x,z,8,-13,12.8,7.5))return 3.87;
 return null;
}
export function groundSurfaceAt(x,z,water=0){
 if(inside(x,z,-4,-4,9,8))return{y:.35,kind:'stone'};
 if(inside(x,z,8,-13,12.4,7))return{y:.225,kind:'stone'};
 for(let i=2;i>=0;i--)if(inside(x,z,-4,.85-i*.7,9-.35*i,1))return{y:.12+i*.1,kind:'stone'};
 if(inside(x,z,.7,2,3,23)||inside(x,z,0,-8.6,26,2.3))return{y:.14,kind:'stone'};
 for(const [cx,cz,w,d] of [[-8,6,5,7],[7,-5,8,7],[8,8,6,5]])if(inside(x,z,cx,cz,w,d))return{y:.43,kind:'earth'};
 for(let i=0;i<7;i++)if(inside(x,z,2+i*1.6,11.5,1.7,1.1))return{y:.13,kind:'stone'};
 const y=earthHeight(x,z),sample=waterAt(x,z,water),level=sample.level;
 if(sample.coverage>.08)return{y:level,kind:'water'};
 return{y,kind:'earth'};
}
export const snowGroundAt=(x,z)=>groundSurfaceAt(x,z).y;
// Analytic ellipsoids follow the same tree layout and crown rotation as the visible model.
// This is a canopy proxy, not branch-by-branch triangle collision.
export function canopyHeightAt(x,z,time=0,wind=0,ceiling=Infinity){
 let top=-Infinity;
 for(const [tx,tz,h,seed] of gardenTrees){
  if(Math.abs(x-tx)>h*.48+.8||Math.abs(z-tz)>h*.4+.65)continue;
  const theta=Math.sin(time*.6+seed)*Math.min(.04,wind*.004),s=Math.sin(theta),c=Math.cos(theta),ix=1/(h*.43)**2,iy=1/(h*.25)**2;
  for(let j=0;j<4;j++){
   const a=j*2.3+seed,lx=Math.cos(a)*.65,ly=j*.28;
   const dx=x-(tx+lx*c-ly*s),dz=z-(tz+Math.sin(a)*.6),cy=.4+h*.67+lx*s+ly*c;
   const A=s*s*ix+c*c*iy,B=2*dx*s*c*(ix-iy),C=dx*dx*(c*c*ix+s*s*iy)+dz*dz/(h*.4)**2-1,D=B*B-4*A*C;
   if(D<0)continue;const y=cy+(-B+Math.sqrt(D))/(2*A);
   if(y<=ceiling&&y>top)top=y;
  }
 }
 return Number.isFinite(top)?top:null;
}
export function sceneSurfaceAt(x,z,{water=0,snow=0,ceiling=Infinity,time=0,wind=0}={}){
 const base=groundSurfaceAt(x,z,water),roof=roofHeightAt(x,z);
 const candidates=[base];if(roof!==null)candidates.push({y:roof,kind:'roof'});
 const canopy=canopyHeightAt(x,z,time,wind,ceiling);if(canopy!==null)candidates.push({y:canopy,kind:'foliage'});
 // Sheltered ground must not inherit the global snow cover.
 const layers=candidates.map(s=>{const exposed=s.kind==='roof'||s.kind==='foliage'||roof===null;return exposed&&snow>.01?{...s,y:s.y+snow*.045,kind:snow>.55?'snow':s.kind}:s;});
 return layers.filter(s=>s.y<=ceiling+1e-6).sort((a,b)=>b.y-a.y)[0]??null;
}
