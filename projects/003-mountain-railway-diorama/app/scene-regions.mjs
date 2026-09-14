import {treeCoverAt} from './scene-ground.mjs';
// Views and habitat placement cover the whole island, independently of camera.
export function regionViews(world){
 const peak=world.layoutHeight(-23,-13);let clearing={x:-6,y:world.height(-6,10),z:10},best=Infinity;
 for(let x=-28;x<=-2;x+=2)for(let z=4;z<=18;z+=2){
  const p=sampleRegion(world,x,z,.8);if(!p||p.slope>.6)continue;
  const score=(world.groundTrees||[]).reduce((n,t)=>n+Math.max(0,1-Math.hypot(x-t.x,z-t.z)/6),0)+Math.hypot(x+8,z-12)*.012;
  if(score<best){best=score;clearing=p;}
 }
 return {back:{position:[-58,Math.max(36,peak+26),-64],target:[-14,Math.max(3,peak*.4),-10]},meadow:{position:[clearing.x,clearing.y+26,clearing.z+26],target:[clearing.x,clearing.y+1,clearing.z]}};
}

export function sampleRegion(world,x,z,margin=.7){
 if(![[0,0],[margin,0],[-margin,0],[0,margin],[0,-margin]].every(([dx,dz])=>world.footprint(x+dx,z+dz)))return null;
 if(world.closest(x,z).distance<2.8+margin||Math.hypot(x+30,z-24)<10+margin)return null;
 const y=world.height(x,z),shore=Math.abs(x-world.riverX(z))-world.halfWidth(z);
 if(shore<3+margin||y<world.waterSurface(x,z)+.4)return null;
 const dx=(world.height(x+.35,z)-world.height(x-.35,z))/.7,dz=(world.height(x,z+.35)-world.height(x,z-.35))/.7;
 const length=Math.hypot(dx,1,dz);
 return {x,y,z,slope:Math.hypot(dx,dz),normal:[-dx/length,1/length,-dz/length],cover:treeCoverAt(world.groundTrees||[],x,z)};
}

export function createRegionDetails(world){
 let seed=4019;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rocks=[],shrubs=[],grass=[],logs=[],centres=[];
 for(let i=0;i<7000&&centres.length<20;i++){
  const p=sampleRegion(world,(rand()-.5)*90,(rand()-.5)*62,2);
  if(!p||p.slope<.48||p.slope>3.4||p.cover>.68||centres.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<5))continue;
  centres.push(p);
  for(let j=0;j<9;j++){
   const a=j>4?Math.atan2(p.normal[2],p.normal[0])+(rand()-.5)*1.1:rand()*6.283,r=j?rand()*2.5:0,scale=j>4?.12+rand()*.19:j?.25+rand()*.35:.75+rand()*.45;
   const q=sampleRegion(world,p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,Math.max(.65,scale*1.2));
   if(q&&q.slope<3.6)rocks.push({...q,scale,angle:rand()*6.283});
  }
 }
 for(let i=0;i<12000&&(shrubs.length<95||grass.length<480);i++){
  const p=sampleRegion(world,(rand()-.5)*92,(rand()-.5)*64,.65);
  if(!p||p.cover>.65||p.slope>2.2)continue;
  const patch=Math.sin(p.x*.27+Math.sin(p.z*.21)*2)+Math.cos(p.z*.32-p.x*.12);
  if(patch<.35||rocks.some(r=>Math.hypot(r.x-p.x,r.z-p.z)<r.scale+.45))continue;
  if(shrubs.length<95&&p.slope<1.9&&!shrubs.some(s=>Math.hypot(s.x-p.x,s.z-p.z)<2.6))shrubs.push({...p,height:.45+rand()*.72,angle:rand()*6.283,flowering:p.slope<.45&&p.z>0});
  if(grass.length<480&&p.slope>.5&&p.slope<1.9)grass.push({...p,height:.15+rand()*.33,angle:rand()*6.283});
 }
 for(const root of world.groundTrees||[]){
  if(logs.length>=7)break;if(rand()>.35)continue;
  const a=rand()*6.283,length=1.1+rand()*1.1,x=root.x+Math.cos(a)*2.4,z=root.z+Math.sin(a)*2.4;
  const p=sampleRegion(world,x,z,length*.6);
  if(!p||p.slope>.55||p.cover<.1)continue;
  const ends=[-1,1].map(sign=>{const xx=x+sign*Math.cos(a)*length*.5,zz=z+sign*Math.sin(a)*length*.5;return [xx,world.height(xx,zz)+.09,zz];});
  logs.push({...p,ends,radius:.09+rand()*.06});
 }
 return {rocks,shrubs,grass,logs};
}
