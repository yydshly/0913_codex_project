import {coatWithSnow} from './snow-coating.js';
// Host-side close effects. Eanpa still owns cloud, precipitation and wet history.
export const depressions=[[-3,4.5,1.15,.7],[-4.1,8,.7,1.2],[4.4,4,.85,.55]];
export function earthHeight(x,z){
 let y=.085+.004*Math.sin(x*2.1+z*1.3)+.003*Math.sin(z*2.7-x*1.4);
 for(const [cx,cz,rx,rz] of depressions){const d=Math.hypot((x-cx)/rx,(z-cz)/rz);y-=.038*Math.max(0,1-d*d);}
 return y;
}
export function advanceRoofWater(value,rain,dt){
 const r=Math.max(0,Math.min(1,rain));return r+(value-r)*Math.exp(-Math.max(0,Math.min(.1,dt))/(r>value?3.5:12));
}
export function nearDetailGain(distance){return Math.max(0,1-distance/18)**2;}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

export function makeRainExperience(T,scene,snowCover){
 const landscape=new T.Group();landscape.name='rain-distance';landscape.userData.noRainOcclusion=true;scene.add(landscape);
 const groundMaterial=new T.MeshStandardNodeMaterial({color:0x4c624c,roughness:1});groundMaterial.userData.noWet=true;groundMaterial.userData.environmentOnly=true;coatWithSnow(T,groundMaterial,snowCover);
 const hillHeight=(x,z)=>{const rise=Math.max(0,Math.min(1,(Math.hypot(x,z)-65)/130));return -.5+rise*(23+17*Math.sin(x*.019+z*.008)+11*Math.sin(z*.032-x*.007)+6*Math.sin(x*.047+z*.034));};
 const terrain=new T.PlaneGeometry(1100,1100,112,112);terrain.rotateX(-Math.PI/2);const p=terrain.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),distance=Math.hypot(x,z),rise=Math.max(0,Math.min(1,(distance-65)/130));const hills=(23+17*Math.sin(x*.019+z*.008)+11*Math.sin(z*.032-x*.007)+6*Math.sin(x*.047+z*.034));p.setY(i,-.5+rise*hills);}
 terrain.computeVertexNormals();const land=new T.Mesh(terrain,groundMaterial);land.receiveShadow=true;landscape.add(land);
 // Three overlapping ridge silhouettes, including the porch-facing southern horizon.
 for(let layer=0;layer<3;layer++){
  const mat=new T.MeshStandardNodeMaterial({color:[0x3d554b,0x536668,0x72828a][layer],roughness:1});mat.userData.noWet=true;mat.userData.environmentOnly=true;coatWithSnow(T,mat,snowCover);
  for(let i=0;i<7;i++){const hill=new T.Mesh(new T.IcosahedronGeometry(1,3),mat);hill.position.set((i-3)*(70+layer*28),-12,130+layer*125+Math.sin(i)*22);hill.scale.set(75+layer*25,18+hash(i+layer*7)*18+layer*16,48+layer*19);landscape.add(hill);}
 }
 const treeMat=new T.MeshStandardNodeMaterial({color:0x263e31,roughness:1});treeMat.userData.noWet=true;treeMat.userData.environmentOnly=true;coatWithSnow(T,treeMat,snowCover);
 const treeGeo=new T.ConeGeometry(1,1,8),treeLine=new T.InstancedMesh(treeGeo,treeMat,300),dummy=new T.Object3D();
 for(let i=0;i<100;i++){const x=(hash(i+41)-.5)*225,z=47+hash(i+22)*57,h=3+hash(i)*8,base=Math.max(-.1,hillHeight(x,z));for(let j=0;j<3;j++){dummy.position.set(x,base+h*(.32+j*.20),z);dummy.scale.set(h*(.29-j*.055),h*.50,h*(.29-j*.055));dummy.rotation.set(0,hash(i+5)*6,0);dummy.updateMatrix();treeLine.setMatrixAt(i*3+j,dummy.matrix);}}treeLine.instanceMatrix.needsUpdate=true;landscape.add(treeLine);
 // Gravel and small clods keep earth readable between puddles, using two draw calls.
 const gravelMat=new T.MeshStandardNodeMaterial({color:0x76624c,roughness:.97});gravelMat.userData.noPuddles=true;
 const gravel=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),gravelMat,260);gravel.userData.noRainOcclusion=true;
 for(let i=0;i<260;i++){const x=-5.1+hash(i+201)*3.9,z=1.8+hash(i+410)*10,size=.015+hash(i+87)*.055;dummy.position.set(x,earthHeight(x,z)+size*.2,z);dummy.rotation.set(hash(i),hash(i+2)*6,hash(i+3));dummy.scale.set(size,size*.45,size*.8);dummy.updateMatrix();gravel.setMatrixAt(i,dummy.matrix);}gravel.instanceMatrix.needsUpdate=true;scene.add(gravel);
 const details=new T.Group();details.name='eave-rain-details';details.userData.noRainOcclusion=true;scene.add(details);
 const dropMat=new T.MeshStandardNodeMaterial({color:0xc4d7df,roughness:.18,metalness:.05,transparent:true,opacity:.6,depthWrite:false});dropMat.userData.noWet=true;
 const drops=new T.InstancedMesh(new T.SphereGeometry(1,6,4),dropMat,36);drops.frustumCulled=false;drops.receiveShadow=true;details.add(drops);
 const ringMat=new T.MeshStandardNodeMaterial({color:0x9db7c6,roughness:.3,transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide});ringMat.userData.noWet=true;
 const rings=new T.InstancedMesh(new T.RingGeometry(.91,1,24),ringMat,36);rings.frustumCulled=false;rings.receiveShadow=true;details.add(rings);
 const sites=Array.from({length:36},(_,i)=>({x:-8.65+i*.27,z:.86+(hash(i+18)-.5)*.12,period:1.1+hash(i+41)*1.8,offset:hash(i+73)*3,cycle:-1,threshold:.035+hash(i+95)*.55}));
 let water=0,events=[],enabled=true,lastTime=0,impacts=0;
 const fog=new T.FogExp2(0x8c9fa5,.0018);scene.fog=fog;
 function update({time,dt,rain,globalRain,wind,enabled:active=true}){
  enabled=active;water=advanceRoofWater(water,rain,dt);events=[];const elapsed=time-lastTime;lastTime=time;
  fog.density=.0018+Math.max(0,globalRain)*.0028;
  let visible=0;
  for(let i=0;i<sites.length;i++){
   const site=sites[i],clock=time+site.offset,cycle=Math.floor(clock/site.period),age=clock%site.period,fall=.94,live=enabled&&water>site.threshold;
   const driftX=(wind?.x??0)*.006,driftZ=(wind?.z??0)*.006;
   const x=site.x+driftX,z=site.z+driftZ,landing=x>=-8.5&&x<=.5?.12:earthHeight(x,z);
   if(live&&age<fall){const y=4.47-(4.47-landing)*(age/fall)**2;dummy.position.set(site.x+driftX*(age/fall),y,site.z+driftZ*(age/fall));dummy.scale.set(.012,.026+.07*(age/fall),.012);visible++;}else dummy.scale.setScalar(0);
   dummy.rotation.set(0,0,0);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
   const impactAge=age-fall;
   if(live&&impactAge>=0&&impactAge<.48){dummy.position.set(x,landing+.006,z);dummy.scale.setScalar(.035+impactAge*.33);dummy.rotation.set(-Math.PI/2,0,0);}else dummy.scale.setScalar(0);
   dummy.updateMatrix();rings.setMatrixAt(i,dummy.matrix);
   if(age>=fall&&site.cycle!==cycle){site.cycle=cycle;if(live&&elapsed<.2){impacts++;if(events.length<8)events.push({x,y:landing,z,kind:x>=-8.5&&x<=.5?'stone':'earth',strength:water});}}
  }
  drops.instanceMatrix.needsUpdate=true;rings.instanceMatrix.needsUpdate=true;
  return{roofWater:+water.toFixed(3),activeDrops:visible,impactEvents:impacts,fogDensity:+fog.density.toFixed(4),detailEnabled:enabled};
 }
 return{landscape,gravel,details,update,drainImpacts:()=>events.splice(0),dispose(){for(const root of [landscape,gravel,details]){scene.remove(root);root.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});}}};
}
