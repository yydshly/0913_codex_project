import {gardenTrees} from './surface-state.js';
import {coatWithSnow} from './snow-coating.js';
import {lightTargets,fadeLight} from './lighting.js';
import {depressions,earthHeight} from './rain-experience.js';
// Listening Garden: original procedural architecture and landscape; no imported models.
export function makeCourtyard(T,scene,snowCover,soilMoisture=T.uniform(0),wetReach=T.uniform(0)){
 const group=new T.Group();group.name='listening-garden';scene.add(group);
 const material=(color,roughness=.8,metalness=0)=>new T.MeshStandardNodeMaterial({color,roughness,metalness});
 const stone=material(0x626c65),plaster=material(0x999586),wood=material(0x493729),roofMat=material(0x273334),soil=material(0x252d22),grass=material(0x435441),metal=material(0x6a5a43,.34,.6);
 const tile=T.positionWorld.xz.mul(.4),edge=T.min(T.fract(tile.x),T.fract(tile.y));stone.colorNode=T.mix(T.color(0x303d38),T.color(0x7c8579),T.smoothstep(.008,.025,edge));stone.userData.wetPorosity=.7;
 const windowMat=new T.MeshStandardNodeMaterial({color:0x5e5844,roughness:.25,metalness:.15,emissive:0xffc57e,emissiveIntensity:.1});
 const teaWindowMat=windowMat.clone();
 const mesh=(geo,mat,pos,parent=group)=>{const m=new T.Mesh(geo,mat);m.position.fromArray(pos);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const box=(size,mat,pos,parent)=>mesh(new T.BoxGeometry(...size),mat,pos,parent);
 box([240,.4,240],grass,[0,-.3,0]);
 // Rural earth courtyard: authored shallow relief and cavity mask, not fluid simulation.
 const mud=material(0x64523f,.98);mud.userData.wetPorosity=.8;mud.userData.noWet=true;mud.userData.environmentOnly=true;grass.userData.environmentOnly=true;
 const broad=T.sin(T.positionWorld.x.mul(.83).add(T.sin(T.positionWorld.z.mul(1.7)))).mul(T.sin(T.positionWorld.z.mul(.69))).mul(.5).add(.5);
 const grain=T.fract(T.sin(T.dot(T.floor(T.positionWorld.xz.mul(70)),T.vec2(12.9898,78.233))).mul(43758.5453));
 mud.colorNode=T.mix(T.color(0x493d2f),T.color(0x806b50),broad).mul(grain.mul(.14).add(.93)).mul(T.float(1).sub(soilMoisture.mul(.38)));
 const oldShore=T.float(1).sub(T.smoothstep(.001,.009,T.positionWorld.y.sub(wetReach.mul(.04).add(.044))));mud.colorNode=mud.colorNode.mul(T.float(1).sub(oldShore.mul(wetReach).mul(.18)));
 mud.roughnessNode=T.float(.98).sub(soilMoisture.mul(.17));
 let cavity=T.float(0);for(const [cx,cz,rx,rz] of depressions){const d=T.length(T.positionWorld.xz.sub(T.vec2(cx,cz)).div(T.vec2(rx,rz)));cavity=T.max(cavity,T.float(1).sub(T.smoothstep(.2,1,d)));}mud.userData.puddleMaskNode=cavity;
 const earthGeo=new T.PlaneGeometry(27,24,180,180);earthGeo.rotateX(-Math.PI/2);const earthPos=earthGeo.attributes.position;
 for(let i=0;i<earthPos.count;i++)earthPos.setY(i,earthHeight(earthPos.getX(i),earthPos.getZ(i)+2));earthGeo.computeVertexNormals();const earth=mesh(earthGeo,mud,[0,0,2]);earth.userData.wetnessFactor=.8;
 // Narrow stone paths contrast with the porous earth and keep the guest route readable.
 box([3,.16,23],stone,[.7,.06,2]);box([26,.16,2.3],stone,[0,.06,-8.6]);
 for(let i=0;i<7;i++)box([1.7,.14,1.1],stone,[2+i*1.6,.06,11.5]);
 coatWithSnow(T,grass,snowCover);
 grass.userData.noPuddles=true;grass.userData.noWet=true;soil.userData.noPuddles=true;wood.userData.noPuddles=true;

 // Roofed reading pavilion with solid walls and warm windows.
 box([9,.35,8],stone,[-4,.175,-4]);
 box([10,.36,9],roofMat,[-4,4.9,-4]);box([10.5,.12,9.5],wood,[-4,4.68,-4]);
 box([9,.0+4.5,.32],plaster,[-4,2.5,-7.8]);box([.32,4.5,8],plaster,[-8.35,2.5,-4]);
 for(const x of [-7.8,-.2])for(const z of [-7.2,-.8])box([.28,4.35,.28],wood,[x,2.55,z]);
 for(const x of [-6.3,-2.7]){box([2.5,2.35,.1],teaWindowMat,[x,2.7,-7.59]);for(const dx of [-1.25,0,1.25])box([.075,2.5,.12],wood,[x+dx,2.7,-7.5]);box([2.6,.08,.13],wood,[x,2.7,-7.49]);}
 for(let i=0;i<8;i++)box([.11,.25,8.8],wood,[-8.4+i*1.25,4.48,-4]);
 box([5,.2,.9],wood,[-4,.75,-6.1]);for(const x of [-6,-2])box([.22,.5,.6],metal,[x,.43,-6.1]);box([5,.58,.12],wood,[-4,1.15,-6.5]);
 const table=mesh(new T.CylinderGeometry(.9,.9,.12,40),wood,[-4,1.15,-3.6]);box([.17,1,.17],metal,[-4,.61,-3.6]);
 mesh(new T.CylinderGeometry(.16,.12,.24,20),plaster,[-4,1.32,-3.6]);
 const ceramic=material(0x9b967d,.32);ceramic.userData.noPuddles=true;
 box([1.3,.04,.8],wood,[-4,1.24,-3.7]);mesh(new T.SphereGeometry(.22,16,10),ceramic,[-4.2,1.47,-3.7]);
 mesh(new T.CylinderGeometry(.12,.18,.07,16),ceramic,[-4.2,1.68,-3.7]);const handle=mesh(new T.TorusGeometry(.19,.035,6,18),wood,[-4.2,1.69,-3.7]);
 const cup=mesh(new T.CylinderGeometry(.11,.075,.14,20),ceramic,[-3.65,1.34,-3.5]);mesh(new T.TorusGeometry(.106,.012,6,18),ceramic,[-3.65,1.415,-3.5]).rotation.x=Math.PI/2;
 // Slim tiled battens and a darker wet fascia make the eave edge legible.
 for(let i=0;i<30;i++)box([.12,.05,9],roofMat,[-8.8+i*.33,5.11,-4]);box([10.3,.16,.12],wood,[-4,4.48,.74]);

 for(let i=0;i<3;i++)box([9-.35*i,.12,1],stone,[-4,.06+i*.1,.85-i*.7]);
 // Paths and low planting beds make dry/wet surfaces readable at human scale.
 const beds=[[-8,6,5,7],[7,-5,8,7],[8,8,6,5]];
 for(const [x,z,w,d] of beds){box([w,.4,d],roofMat,[x,.12,z]);box([w-.3,.12,d-.3],soil,[x,.36,z]);}
 const foliage=[material(0x4e6b44),material(0x638052),material(0x344e37)];foliage.forEach(m=>{m.userData.noPuddles=true;coatWithSnow(T,m,snowCover);});const trees=[];
 function tree(x,z,height,seed){const root=new T.Group();root.position.set(x,.4,z);group.add(root);mesh(new T.CylinderGeometry(.10,.22,height,8),wood,[0,height/2,0],root);const crown=new T.Group();root.add(crown);crown.position.y=height*.67;for(let j=0;j<4;j++){const a=j*2.3+seed;const leaf=mesh(new T.IcosahedronGeometry(1,1),foliage[j%3],[Math.cos(a)*.65,j*.28,Math.sin(a)*.6],crown);leaf.scale.set(height*.43,height*.25,height*.4);}trees.push({crown,seed});}
 for(const spec of gardenTrees)tree(...spec);
 for(let i=0;i<18;i++){const bed=beds[i%3],a=i*2.399,x=bed[0]+Math.cos(a)*bed[2]*.27,z=bed[1]+Math.sin(a)*bed[3]*.27;const shrub=mesh(new T.IcosahedronGeometry(.55,1),foliage[i%3],[x,.8,z]);shrub.scale.set(1,.6,1);}
 for(let i=0;i<7;i++){const rock=mesh(new T.IcosahedronGeometry(.48,0),stone,[-11+i*.8,.5,10+Math.sin(i)*.5]);rock.scale.set(1.3,.7,.9);rock.rotation.y=i;}
 // Garden walls, a slatted screen and low path lighting.
 box([32,1.5,.35],plaster,[0,.65,-17]);box([.35,1.5,30],plaster,[-16,.65,-2]);
 // Three guest rooms behind the garden, with a roofed approach.
 box([12.4,.25,7],stone,[8,.1,-13]);box([12.8,.3,7.5],roofMat,[8,3.7,-13]);
 box([12,.2,1.2],wood,[8,3.35,-9.5]);box([12,3.4,.3],plaster,[8,1.85,-16]);
 for(const x of [2,6,10,14])box([.22,3.4,6],plaster,[x,1.85,-13]);
 for(const x of [4,8,12]){box([3.8,3.4,.25],plaster,[x,1.85,-10]);box([.95,2.3,.08],wood,[x-.95,1.35,-9.83]);box([1.6,1.6,.08],windowMat,[x+.55,2,-9.82]);box([.07,1.65,.12],wood,[x+.55,2,-9.73]);box([1.65,.07,.12],wood,[x+.55,2,-9.73]);}
 // Entry gate and stepping stones establish the guest route.
 for(const x of [11,16])box([.25,3.5,.25],wood,[x,1.7,15]);box([5.5,.3,.8],roofMat,[13.5,3.55,15]);
 for(let i=0;i<5;i++)box([2,.09,.7],stone,[13.5,.02,15+i*1.2]);

 const lensMat=material(0xede0c9,.3);lensMat.emissive=new T.Color(0xffca87);lensMat.emissiveIntensity=0;lensMat.userData.noWet=true;
 const teaLens=lensMat.clone();
 const lights=[];for(const [x,z] of [[-1,5],[3,10],[11,1]]){box([.16,.75,.16],metal,[x,.5,z]);const lens=box([.35,.18,.35],lensMat,[x,.93,z]);lens.castShadow=false;const light=new T.PointLight(0xffc68a,0,9,2);light.position.set(x,1.1,z);scene.add(light);lights.push(light);}
 // One downward-facing fixture lights the table and eaves without filling the horizon.
 box([.55,.09,.55],metal,[-4,4.29,-2]);const diffuser=box([.44,.04,.44],teaLens,[-4,4.225,-2]);diffuser.castShadow=false;
 const lamp=new T.SpotLight(0xffd1a0,0,17,Math.PI*.40,.8,2);lamp.position.set(-4,4.15,-2);lamp.target.position.set(-3.5,.1,1.5);lamp.castShadow=false;lamp.shadow.mapSize.set(512,512);lamp.shadow.bias=-.0003;lamp.shadow.normalBias=.025;scene.add(lamp,lamp.target);
 // A low-power interior fill approximates warm bounce on the camera-facing tea set.
 const teaFill=new T.PointLight(0xffd0a0,0,7,2);teaFill.position.set(-5,3.15,-5);scene.add(teaFill);
 // Small exterior window spill lights; these approximate warm room light, not an indoor simulation.
 const roomLights=[];for(const x of [4,8,12]){const l=new T.PointLight(0xffc185,0,4.5,2);l.position.set(x+.55,2.15,-9.5);scene.add(l);roomLights.push(l);}
 const level={tea:0,path:0,rooms:0};
 return{group,lamp,rainOccluders:[group],update(time,hours,wind,options={},dt=1/60){
  const target=lightTargets(hours,options);for(const key of Object.keys(level))level[key]=fadeLight(level[key],target[key],dt);
  lamp.intensity=level.tea*85;teaFill.intensity=level.tea*10;lights.forEach(l=>l.intensity=level.path*14);roomLights.forEach(l=>l.intensity=level.rooms*7);
  teaWindowMat.emissiveIntensity=level.tea*.55;windowMat.emissiveIntensity=level.rooms*.8;teaLens.emissiveIntensity=level.tea*2;lensMat.emissiveIntensity=level.path*2;
  for(const {crown,seed} of trees)crown.rotation.z=Math.sin(time*.6+seed)*Math.min(.04,wind*.004);
  return{mode:options.mode??'auto',brightness:options.brightness??.7,targets:target,levels:{...level},teaIntensity:lamp.intensity,pathIntensity:lights[0].intensity,roomIntensity:roomLights[0].intensity,shadowLights:0};
 }};
}
export const views={
 rainporch:{position:[-5.5,1.95,-6.25],target:[-.5,1.5,36]},
 distance:{position:[-5,3,-1.2],target:[-2,7,48]},
 eaves:{position:[-7.4,1.6,-1.6],target:[-5.3,2,.9]},
 puddle:{position:[-3.8,1.45,10.5],target:[-3,.08,4.5]},
 rural:{position:[-3,1.2,12],target:[-3,.35,1]},
 lightning:{position:[14,2.8,18],target:[-8,8,-24]},
 entrance:{position:[19,5,24],target:[1,1,-3]},
 rooms:{position:[.8,2.2,-5.5],target:[8,1.8,-12]},
 overview:{position:[24,14,29],target:[-1,1,-2]},
 sky:{position:[13,3,20],target:[-4,20,-40]},
 shelter:{position:[-5,1.8,-2],target:[5,1.2,7]},
 surface:{position:[6,2.2,13],target:[-2,.25,2]},
};
