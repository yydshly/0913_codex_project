// Shared solid geometry and water obstruction, in world coordinates.
export function createRiverRocks(world){
 let seed=73;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rocks=[];
 const add=r=>{
  const radius=Math.max(r.rx,r.rz);
  if(world.closest(r.x,r.z).distance<2.3+radius+.15)return;
  if(!Array.from({length:16},(_,i)=>i*Math.PI/8).every(a=>world.footprint(r.x+Math.cos(a)*radius,r.z+Math.sin(a)*radius)))return;
  rocks.push(r);
 };
 for(let i=0;i<220;i++){
  const z=-28+rand()*60,side=rand()>.5?1:-1;
  const size=i<65?1:.22+rand()*.18;
  const rx=(.45+rand()*.8)*size,rz=(.45+rand()*.75)*size,ry=(.25+rand()*.45)*size;
  const x=world.riverX(z)+side*(world.halfWidth(z)+.35+rand()*1.1+rx*.5);
  // Keep the cascade face clear: its continuous bed supplies the exposed stone.
  if(z>world.waterStyle.start-1.2&&z<world.waterStyle.end+1)continue;
  const angle=rand()*Math.PI*2;
  // Sample the whole footprint so a bank stone cannot hang off a cut face.
  let floor=world.height(x,z);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;floor=Math.min(floor,world.height(x+Math.cos(a)*rx,z+Math.sin(a)*rz));}
  add({x,y:floor+ry*.18,z,rx,ry,rz,angle,kind:'bank'});
 }
 if(world.waterStyle.split){
  // Low outcrops at the lip: their actual sections define the open water.
  for(const lane of [-.59,-.08,.55]){
   const z=world.waterStyle.start-.12+.18*Math.sin(lane*7),x=world.riverX(z)+lane*world.halfWidth(z);
   const rx=world.halfWidth(z)*(.13+.03*Math.cos(lane*8)),ry=.20+world.effectiveDrop*.022;
   add({x,y:world.waterSurface(x,z)+ry*.12,z,rx,ry,rz:.7+.12*Math.sin(lane*6),angle:0,kind:'divider'});
  }
 }
 return rocks;
}

export function rockWaterField(rocks,x,z,y){
 let clearance=4,deflect=0,foam=0;
 for(const r of rocks){
  const dx=x-r.x,dz=z-r.z,reach=Math.max(r.rx,r.rz)+2.8;
  if(Math.abs(dx)>reach||Math.abs(dz)>reach*1.4)continue;
  const vertical=(y-r.y)/r.ry;if(Math.abs(vertical)>=1.05)continue;
  // Include a small wet-contact margin beyond the low-poly visible shell.
  const section=Math.sqrt(Math.max(.01,1-Math.min(.99,vertical*vertical))),c=Math.cos(r.angle),s=Math.sin(r.angle);
  const a=dx*c+dz*s,b=-dx*s+dz*c;
  const distance=(Math.hypot(a/(r.rx*section+.07),b/(r.rz*section+.07))-1)*Math.min(r.rx,r.rz);
  clearance=Math.min(clearance,distance);
  const influence=Math.exp(-Math.pow(dx/(r.rx+1),2)-Math.pow(dz/(r.rz+1.8),2));
  deflect+=Math.tanh(dx*4)*influence*.55;
  foam=Math.max(foam,Math.exp(-Math.abs(distance)*7)*Math.max(0,-dz/(r.rz+.4)));
 }
 return {clearance,deflect:Math.max(-.8,Math.min(.8,deflect)),foam:Math.min(1,foam)};
}
