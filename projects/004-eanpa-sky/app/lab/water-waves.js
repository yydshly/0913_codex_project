// Damped 2D wave equation, fixed step, elliptical absorbing boundary.
export function makeWaveField({size=64,rx=1,rz=1}={}){
 const count=size*size,step=1/90,dx=2*rx/(size-1),dz=2*rz/(size-1),speed=.65;
 const cx=(speed*step/dx)**2,cz=(speed*step/dz)**2;
 if(cx+cz>1)throw new Error('Unstable water wave grid');
 let current=new Float32Array(count),previous=new Float32Array(count),next=new Float32Array(count),acc=0,impulses=0,ticks=0;
 const absorb=new Float32Array(count),normals=new Float32Array(count*3);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const d=Math.hypot(2*x/(size-1)-1,2*y/(size-1)-1);absorb[y*size+x]=Math.max(0,Math.min(1,(1-d)/.15));}
 function encode(){for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,gx=x>0&&x<size-1?(current[i+1]-current[i-1])/(2*dx):0,gz=y>0&&y<size-1?(current[i+size]-current[i-size])/(2*dz):0;
  const nx=-gx*rx,ny=-gz*rz,length=Math.hypot(nx,ny,1);normals[i*3]=nx/length;normals[i*3+1]=ny/length;normals[i*3+2]=1/length;
 }}
 function impulse(u,v,strength=.002){
  if(u<=0||u>=1||v<=0||v>=1||Math.hypot(2*u-1,2*v-1)>.94)return false;
  const px=u*(size-1),py=v*(size-1);
  for(let y=Math.max(1,Math.floor(py)-4);y<=Math.min(size-2,Math.ceil(py)+4);y++)for(let x=Math.max(1,Math.floor(px)-4);x<=Math.min(size-2,Math.ceil(px)+4);x++){
   const i=y*size+x,bump=Math.exp(-((x-px)**2+(y-py)**2)/3)*Math.max(-.006,Math.min(.006,strength))*absorb[i];
   current[i]=Math.max(-.012,Math.min(.012,current[i]-bump));previous[i]=Math.max(-.012,Math.min(.012,previous[i]-bump));
  }impulses++;return true;
 }
 function advance(dt){
  acc+=Math.max(0,Math.min(1/15,dt));let steps=0;
  while(acc+1e-9>=step&&steps<6){
   next.fill(0);
   for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
    const i=y*size+x,h=current[i],value=1.96*h-.96*previous[i]+cx*(current[i-1]+current[i+1]-2*h)+cz*(current[i-size]+current[i+size]-2*h);
    next[i]=value*absorb[i];
   }
   const old=previous;previous=current;current=next;next=old;steps++;ticks++;acc-=step;
  }
  if(steps)encode();return steps>0;
 }
 function reset(){current.fill(0);previous.fill(0);next.fill(0);acc=0;encode();}
 function snapshot(){let peak=0,energy=0;for(const h of current){peak=Math.max(peak,Math.abs(h));energy+=h*h;}return{impulses,ticks,peak:+peak.toFixed(6),energy:+energy.toFixed(9),size};}
 encode();return{normals,impulse,advance,reset,snapshot,sample:(x,y)=>current[y*size+x]};
}
