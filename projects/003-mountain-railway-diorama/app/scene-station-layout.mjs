// Shared railway dimensions and local coordinates: placement and checks use one model.
export const trainDimensions=Object.freeze({spacing:6.2,bogieOffset:1.65,doorPositions:[-1.95,1.95],doorFloor:.84});
export function stationLayout(world){
 const origin=world.curve.getPointAt(world.stationU),t=world.curve.getTangentAt(world.stationU);
 const angle=Math.atan2(t.x,t.z),c=Math.cos(angle),s=Math.sin(angle),top=.54;
 const toWorld=(x,y,z)=>origin.clone().set(origin.x+x*c+z*s,origin.y+y,origin.z-x*s+z*c);
 const toLocal=p=>({x:(p.x-origin.x)*c-(p.z-origin.z)*s,y:p.y-origin.y,z:(p.x-origin.x)*s+(p.z-origin.z)*c});
 const ground=(x,z)=>{const p=toWorld(x,0,z);return world.height(p.x,p.z)-origin.y;};
 const edge=(distance,offset=1.32)=>{
  const u=((world.stationU+distance/world.length)%1+1)%1,p=world.curve.getPointAt(u),t=world.curve.getTangentAt(u),n=Math.hypot(t.x,t.z);
  p.x-=t.z/n*offset;p.z+=t.x/n*offset;
  return toLocal(p);
 };
 const rows=Array.from({length:45},(_,i)=>edge(-8.8+i*.4));
 const entry={x:-4.2,z:6.1,width:1.55,run:2.6};
 const landing=ground(entry.x-entry.run,entry.z)+.04;
 const stepCount=Math.max(1,Math.ceil((top-landing)/.17));
 const steps=Array.from({length:stepCount},(_,i)=>({x:entry.x-(i+.5)*entry.run/stepCount,z:entry.z,width:entry.run/stepCount,height:top-(i+1)*(top-landing)/stepCount}));
 return{origin,angle,toWorld,toLocal,ground,edge,rows,top,back:-4.25,entry,landing,steps,stopDistance:world.stationU*world.length+trainDimensions.spacing/2};
}

// Keep plants and their complete crowns clear of the built station and access.
export function stationOccupies(layout,x,z,margin=0){
 const p=layout.toLocal({x,y:layout.origin.y,z});
 return p.x>-9-margin&&p.x<1.5+margin&&p.z>-9.5-margin&&p.z<9.5+margin;
}
