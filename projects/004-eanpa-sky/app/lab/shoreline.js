import {earthHeight,depressions} from './rain-experience.js';
const clamp=v=>Math.max(0,Math.min(1,v));
export const waterLevel=fill=>.044+clamp(fill)*.04;
export const shoreCoverage=depth=>{const t=clamp((depth-.001)/.005);return t*t*(3-2*t);};
export function waterAt(x,z,fill){
 const level=waterLevel(fill),depth=level-earthHeight(x,z);
 const inside=depressions.some(([cx,cz,rx,rz])=>Math.hypot((x-cx)/rx,(z-cz)/rz)<.98);
 return{level,depth,coverage:inside&&fill>.001?shoreCoverage(depth):0};
}
export function retreatMemory(previous,fill,dt){return Math.max(fill,previous*Math.exp(-Math.max(0,Math.min(.1,dt))/180));}
