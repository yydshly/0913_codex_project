import {cascadeBedHeight} from './scene-cascade.mjs';
import {clamp,smooth} from './scene-world.mjs';
// Initial-winter art model: shallow still margins freeze, moving/deep water stays open.
// Shared thresholds keep animal decisions and the water shader consistent.
export const iceDepth={solid:.25,open:1.05};
export const iceGLSL=`float habitatIce(float depth,float slope,float winter){return clamp(winter,0.,1.)*(1.-smoothstep(${iceDepth.solid.toFixed(2)},${iceDepth.open.toFixed(2)},depth))*(1.-clamp(slope,0.,1.));}`;
export function iceCoverage(world,x,z,winter=0){
 const depth=world.waterSurface(x,z)-Math.max(world.height(x,z),cascadeBedHeight(world,x,z));
 if(depth<=0)return 0;
 const slope=Math.abs(world.waterSurface(x,z+.12)-world.waterSurface(x,z-.12))*4;
 return clamp(winter,0,1)*(1-smooth(iceDepth.solid,iceDepth.open,depth))*(1-clamp(slope,0,1));
}
export function frozenShore(world,site,winter){return winter>.25&&site.path.some(p=>iceCoverage(world,p.x,p.z,winter)>.22);}
