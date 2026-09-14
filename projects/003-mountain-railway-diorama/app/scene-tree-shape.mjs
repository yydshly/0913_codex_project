// Reproducible local tree skeleton; independent of season and placement sampling.
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function treeIdentity(x,z,willow=false){
 const h=Math.sin(x*12.9898+z*78.233)*43758.5453,seed=h-Math.floor(h);
 return {seed:Math.floor(seed*2147483647),species:willow?0:seed>.68?2:1,tone:Math.max(0,Math.min(1,.5+.25*Math.sin(x*.09+z*.055)+.18*(seed-.5)))};
}
export function buildTreeShape({height,seed,species=1}){
 if(!Number.isFinite(height)||height<=0)throw new RangeError('树高必须为正数');
 let state=seed>>>0;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const willow=species===0,slender=species===2,branches=[],crowns=[],trunk=[[0,0,0]],lean=[(rng()-.5)*height*.14,(rng()-.5)*height*.14];
 const radius=height*(slender?.019:.026);
 const add=(a,b,r,end)=>branches.push({a,b,radius:r,tipRadius:end});
 for(let i=1;i<=5;i++){
  const t=i/5,p=[lean[0]*t+Math.sin(t*4+seed%9)*height*.018*t,height*t*.93,lean[1]*t+Math.sin(t*3)*height*.025];
  add(trunk.at(-1),p,radius*(1-(i-1)/5*.85),radius*(1-t*.85));trunk.push(p);
 }
 const limbs=8+Math.floor(rng()*4),spread=height*(willow?.34:slender?.25:.32);
 function crown(p,size,exposure){size*=willow?1.4:slender?1.5:1.6;crowns.push({p,scale:[size*(willow?.85:1.08),size*(willow?1.25:.87),size],rotation:[(rng()-.5)*.8,rng()*6.28,(rng()-.5)*.6],exposure});}
 for(let j=0;j<limbs;j++){
  const f=.23+(j+.3+rng()*.5)/limbs*.56,index=Math.floor(f*5),a=lerp(trunk[index],trunk[index+1],f*5-index);
  const angle=j*2.39996+rng()*.65,reach=spread*(.65+rng()*.3)*Math.sin((f*.7+.1)*Math.PI);
  const mid=[a[0]+Math.cos(angle)*reach*.46,a[1]+height*(.1+rng()*.055),a[2]+Math.sin(angle)*reach*.46];
  const end=[a[0]+Math.cos(angle)*reach,mid[1]+height*(willow?-.018:.045),a[2]+Math.sin(angle)*reach];
  const r=radius*(.42-f*.17);add(a,mid,r,r*.6);add(mid,end,r*.6,r*.32);
  crown(end,height*(.09+rng()*.04),.7+f*.3);
  for(let k=0;k<3;k++){
   const start=k===0?mid:end,fa=angle+(k-1)*(.5+rng()*.25),length=height*(.08+rng()*.07);
   const joint=[start[0]+Math.cos(fa)*length*.6,start[1]+height*(.045+rng()*.04),start[2]+Math.sin(fa)*length*.6];
   const tip=[start[0]+Math.cos(fa)*length,joint[1]+height*(willow?-.12-rng()*.035:.025+rng()*.035),start[2]+Math.sin(fa)*length];
   add(start,joint,r*.33,r*.18);add(joint,tip,r*.18,r*.055);
   crown(lerp(joint,tip,.55),height*(.072+rng()*.035),.66+rng()*.34);
  }
 }
 for(let i=3;i<6;i++)crown(trunk[i],height*(.10+rng()*.02),.45+i*.09);
 return{branches,crowns};
}
export function plantRetention(weights,species){return Math.max(0,Math.min(1,1-weights[0]*(species===2?.12:.24)-weights[2]*(species===0?.06:species===2?.23:.13)-weights[3]));}
