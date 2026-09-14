// Short-lived droplets with linear drag. Units are metres and seconds.
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function spraySample(kind,age,seed){
 const a=hash(seed+1),b=hash(seed+2),c=hash(seed+3),earth=kind==='earth';
 const v=earth?.08+b*.12:kind==='water'?.22+b*.28:.28+b*.40;
 const life=Math.min(.17,2*v/9.81+.008),k=5,drag=(1-Math.exp(-k*Math.max(0,age)))/k;
 const y=(v+9.81/k)*drag-9.81*Math.max(0,age)/k;
 const side=(earth?.04:.1)+c*(earth?.08:.24),angle=a*Math.PI*2,decay=Math.exp(-k*Math.max(0,age));
 const alive=age>0&&age<life&&y>0&&hash(seed+4)>(earth?.55:kind==='water'?.4:.12);
 const alpha=alive?Math.min(1,age/.005)*Math.pow(Math.max(0,1-age/life),1.5)*(earth?.32:.7):0;
 return{alive,x:Math.cos(angle)*side*drag,y:Math.max(0,y),z:Math.sin(angle)*side*drag,vx:Math.cos(angle)*side*decay,vy:(v+9.81/k)*decay-9.81/k,vz:Math.sin(angle)*side*decay,diameter:.0014+c*.0018,alpha};
}
