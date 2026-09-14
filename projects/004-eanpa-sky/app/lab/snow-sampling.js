import {gardenTrees,roofHeightAt,snowGroundAt} from './surface-state.js';

// Same analytic crowns as sceneSurfaceAt; compute moving ellipsoid coefficients
// once per frame, instead of once per flake. No height grid or stale collision data.
export function makeSnowSurfaceSampler(){
 const trees=gardenTrees.map(([x,z,h,seed])=>({x,z,h,seed,ix:1/(h*.43)**2,iy:1/(h*.25)**2,iz:1/(h*.4)**2,
  crowns:Array.from({length:4},(_,j)=>({lx:Math.cos(j*2.3+seed)*.65,ly:j*.28,z:z+Math.sin(j*2.3+seed)*.6}))}));
 let cover=0;
 return{
  prepare(time,wind,snow){
   cover=snow>.01?snow*.045:0;
   for(const t of trees){
    const theta=Math.sin(time*.6+t.seed)*Math.min(.04,wind*.004),s=Math.sin(theta),c=Math.cos(theta);
    t.A=s*s*t.ix+c*c*t.iy;t.B=2*s*c*(t.ix-t.iy);t.C=c*c*t.ix+s*s*t.iy;
    for(const q of t.crowns){q.x=t.x+q.lx*c-q.ly*s;q.y=.4+t.h*.67+q.lx*s+q.ly*c;}
   }
  },
  heightAt(x,z){
   const roof=roofHeightAt(x,z);let top=roof===null?snowGroundAt(x,z)+cover:Math.max(snowGroundAt(x,z),roof+cover);
   for(const t of trees){
    if(Math.abs(x-t.x)>t.h*.48+.8||Math.abs(z-t.z)>t.h*.4+.65)continue;
    for(const q of t.crowns){
     const dx=x-q.x,dz=z-q.z,B=dx*t.B,C=dx*dx*t.C+dz*dz*t.iz-1,D=B*B-4*t.A*C;
     if(D>=0)top=Math.max(top,q.y+(-B+Math.sqrt(D))/(2*t.A)+cover);
    }
   }
   return top;
  }
 };
}
