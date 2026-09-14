import {treeCoverAt} from './scene-ground.mjs';

// Scattered clumps leave open soil between them. Independent seed keeps tree
// placement and existing vegetation colours stable when ground cover changes.
export function createMeadowClumps(world,limit=1500){
 let seed=934;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const clumps=[];
 for(let attempt=0;attempt<16000&&clumps.length<limit;attempt++){
  const x=(rand()-.5)*94,z=(rand()-.5)*66;
  if(!world.footprint(x,z)||world.closest(x,z).distance<3||Math.hypot(x+27,z-25)<7)continue;
  const y=world.height(x,z),shore=Math.abs(x-world.riverX(z))-world.halfWidth(z);
  if(shore<.8||y<world.waterSurface(x,z)+.18)continue;
  const slope=Math.hypot(world.height(x+.35,z)-world.height(x-.35,z),world.height(x,z+.35)-world.height(x,z-.35));
  if(slope>.65)continue;
  const cover=treeCoverAt(world.groundTrees||[],x,z);
  const patch=.5+.25*Math.sin(x*.43+Math.sin(z*.32)*2)+.25*Math.cos(z*.57-x*.18);
  if(rand()>patch*(1-cover*.7))continue;
  if((world.groundTrees||[]).some(t=>(x-t.x)**2+(z-t.z)**2<.25))continue;
  clumps.push({x,y,z,height:.18+rand()*.34,angle:rand()*Math.PI*2,cover});
 }
 return clumps;
}
