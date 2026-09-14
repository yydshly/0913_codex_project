import * as T from './vendor/three.module.js';

// Local texture synthesis keeps the playable scene independent of image CDNs.
let seed=9827;
const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const textures=new Map();
export function surface(kind='stone'){
 if(textures.has(kind))return textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const i=(y*256+x)*4;
  const grain=kind==='wood'?Math.sin(x*.37+Math.sin(y*.04)*1.6)*24+Math.sin(x*.94+y*.009)*12:Math.sin(x*.08+Math.sin(y*.07)*2)*9+Math.cos(y*.18+x*.07)*7;
  const n=175+grain+(rng()-.5)*65;im.data[i]=n;im.data[i+1]=n;im.data[i+2]=n;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);
 if(kind==='stone'){for(let i=0;i<18;i++){ctx.strokeStyle=`rgba(20,23,24,${.08+rng()*.13})`;ctx.lineWidth=.5+rng();ctx.beginPath();let x=rng()*256,y=rng()*256;ctx.moveTo(x,y);for(let k=0;k<5;k++){x+=(rng()-.45)*28;y+=rng()*19;ctx.lineTo(x,y);}ctx.stroke();}}
 if(kind==='wood'){for(let i=0;i<12;i++){ctx.strokeStyle='#251c1438';ctx.lineWidth=1+rng()*2;ctx.beginPath();const x=rng()*256;ctx.moveTo(x,0);ctx.bezierCurveTo(x+10,60,x-8,180,x+3,256);ctx.stroke();}}
 const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.set(kind,texture);return texture;
}
export function glowTexture(){if(textures.has('glow'))return textures.get('glow');const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.1,'rgba(255,255,255,.9)');g.addColorStop(.3,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);textures.set('glow',t);return t;}
function glow(scene,x,y,z,color,size,opacity=.7){const m=new T.Sprite(new T.SpriteMaterial({map:glowTexture(),color,blending:T.AdditiveBlending,transparent:true,opacity,depthWrite:false,toneMapped:false}));m.position.set(x,y,z);m.scale.set(size,size,1);scene.add(m);return m;}
function line(points,color,parent){const m=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color,transparent:true,opacity:.8}));parent.add(m);return m;}
export function enrichWorld({scene,box,cylinder,sphere,mat,portal,PORTAL,OBSTACLES,flames,lights}){
 const animated=[];
 // Soft emission remains visible at distance; only a few light sources shade the world.
 lights.forEach(l=>{l.userData.baseIntensity=l.intensity*7;l.distance*=1.5;glow(scene,l.position.x,l.position.y-.1,l.position.z,'#ff8a30',3.5,.55);});
 for(const f of flames)f.mesh.visible=false;
 for(const l of lights){const flame=new T.Mesh(new T.PlaneGeometry(1.1,1.65),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time:{value:rng()*10}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){float y=vUv.y;float wav=sin(y*11.-time*8.)*.05*y+sin(y*21.-time*6.)*.025;float x=abs(vUv.x-.5+wav);float width=.28*pow(1.-y,.8);float a=smoothstep(width,width-.1,x)*smoothstep(0.,.12,y)*(1.-smoothstep(.75,1.,y));float core=pow(max(0.,1.-x/.22),3.)*(1.-y);vec3 c=mix(vec3(1.,.17,.015),vec3(1.,.89,.35),core);gl_FragColor=vec4(c,a*.95);}'}));flame.position.copy(l.position);flame.position.y-=.4;flame.rotation.y=Math.PI/4;scene.add(flame);animated.push({type:'flame',mesh:flame});}
 glow(scene,PORTAL.x,.65,PORTAL.z,'#46dfff',5,.5);
 const runeRing=new T.Group();runeRing.position.copy(portal.position);scene.add(runeRing);
 for(const radius of [1.03,1.22,1.58]){const pts=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;pts.push([Math.cos(a)*radius,.22,Math.sin(a)*radius]);}line(pts,'#a3f8ff',runeRing);}
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;line([[Math.cos(a)*.45,.24,Math.sin(a)*.45],[Math.cos(a+.8)*1.1,.24,Math.sin(a+.8)*1.1]],'#dcfcff',runeRing);}
 animated.push({type:'runes',mesh:runeRing});
 // Dusty translucent shafts, rather than a flat opaque disk.
 const beam=new T.Mesh(new T.CylinderGeometry(.75,1.24,3.7,40,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform float time; void main(){float streak=pow(.5+.5*sin(vUv.x*100.+time*.7),14.);float fade=pow(1.-vUv.y,3.);gl_FragColor=vec4(.12,.65,.85,fade*(.055+streak*.12));}'}));beam.position.set(PORTAL.x,1.98,PORTAL.z);scene.add(beam);animated.push({type:'beam',mesh:beam});
 // Shingled roofs, wall seams, chimneys and cloth awnings add a lived-in scale.
 for(const [idx,o]of OBSTACLES.slice(0,3).entries()){
  const{x,z,w,d}=o;
  for(let side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<Math.ceil((d+.8)/.43);col++){
   const dx=.18+row*w*.115;const tile=box(x+side*dx,4.56-dx*.52,z-d/2-.29+col*.43+(row%2)*.03,w*.15,.065,.41,['#53595a','#454e52','#656768','#343e42'][Math.floor(rng()*4)]);tile.rotation.z=-side*.48;
  }
  for(let row=0;row<5;row++)for(let j=0;j<Math.ceil(d/.75);j++)for(let side of [-1,1]){const stone=box(x+side*(w/2+.025),.58+row*.53,z-d/2+.4+j*.75,.12,.43,.68,'#8c8570');stone.material=mat(['#8c8570','#747566','#9b9178'][Math.floor(rng()*3)]);}
  box(x-w*.26,4.38,z-d*.25,.65,1.75,.67,'#74786c');box(x-w*.26,5.28,z-d*.25,.8,.15,.8,'#898574');box(x-w*.26,5.36,z-d*.25,.49,.015,.49,'#242b29');
  const awning=box(x,2.43,z+d/2+.86,w*.75,.06,1.3,idx===1?'#75463b':'#695c44');awning.rotation.x=.16;
  for(const dx of [-w*.37,w*.37]){box(x+dx,1.15,z+d/2+1.5,.09,2.3,.09,'#65503b');box(x+dx,2.35,z+d/2+.9,.1,.1,1.55,'#6d573e');}
  for(let k=0;k<5;k++)box(x-w*.35+k*w*.14,2.29,z+d/2+1.52,w*.13,.16,.03,idx===1?'#784737':'#6b5a40');
  for(let j=0;j<3;j++)box(x-w*.4,.2+j*.18,z+d/2+.4+j*.23,.65,.18,.24,'#747a6e');
  const warmth=new T.PointLight('#ffa94a',30,5,2);warmth.position.set(x,1.5,z+d/2+1);scene.add(warmth);
 }
 // A half-broken cart on the edge of camp; its details do not block the combat lanes.
 const cart=new T.Group();cart.position.set(-12,.25,6);cart.rotation.y=.45;scene.add(cart);
 for(let i=0;i<6;i++)box((i-2.5)*.24,.45,0,.22,.14,1.6,'#756348',cart);
 for(const side of [-1,1]){for(let j=0;j<3;j++)box(side*.77,.65+j*.23,0,.1,.18,1.7,'#67573f',cart);const wheel=new T.Mesh(new T.TorusGeometry(.58,.075,6,16),mat('#4b4232'));wheel.rotation.y=Math.PI/2;wheel.position.set(side*.88,.2,0);cart.add(wheel);for(let j=0;j<6;j++){const spoke=box(side*.88,.2,0,.05,1.1,.055,'#8f7850',cart);spoke.rotation.x=j*Math.PI/3;}}
 box(-.56,.36,1.55,.1,.1,2,'#786449',cart);box(.56,.36,1.55,.1,.1,2,'#786449',cart);
 // Patches of wet ground, broken flagstones and leaf litter remove the perfect-grid feel.
 const puddleMat=new T.MeshStandardMaterial({color:'#385353',roughness:.2,metalness:.75,transparent:true,opacity:.62});
 for(const [x,z,sx,sz]of [[3,3,1.5,.6],[-2,6,1.1,.5],[6,-2,.9,.5],[-8,-2,1.2,.45],[9,9,1.6,.5]]){const m=new T.Mesh(new T.CircleGeometry(1,15),puddleMat);m.rotation.x=-Math.PI/2;m.scale.set(sx,sz,1);m.position.set(x,.155,z);scene.add(m);}
 for(let i=0;i<220;i++){const x=(rng()-.5)*33,z=(rng()-.5)*33;if(Math.hypot(x,z)<2)continue;const m=sphere(x,.08,z,.05+rng()*.12,['#95876c','#716a53','#3f5843'][Math.floor(rng()*3)]);m.scale.set(1.8,.15,.65);m.rotation.y=rng()*6;}
 for(let i=0;i<32;i++){const a=rng()*6.28,r=12+rng()*6;const x=Math.sin(a)*r,z=Math.cos(a)*r;sphere(x,.13,z,.3+rng()*.4,'#737b70').scale.set(1,.7,1);}
 // Bare twisted branches contrast with the conifer silhouettes.
 function branch(x,y,z,length,angle,depth,parent){const g=new T.Group();g.position.set(x,y,z);g.rotation.z=angle;parent.add(g);cylinder(0,length/2,0,.035+depth*.025,.06+depth*.04,length,'#625f4d',6,g);if(depth>0){branch(0,length*.85,0,length*.69,.45,depth-1,g);branch(0,length*.65,0,length*.58,-.6,depth-1,g);}}
 for(const[x,z]of [[-15,-5],[15,4],[-14,12]]){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rng()*6;scene.add(g);branch(0,0,0,2.7,.12,3,g);}
 // Lamp pools and low cloud wisps give depth without covering every object in fog.
 const dustGeo=new T.BufferGeometry(),dust=[];for(let i=0;i<150;i++)dust.push((rng()-.5)*34,rng()*4+.1,(rng()-.5)*34);dustGeo.setAttribute('position',new T.Float32BufferAttribute(dust,3));const dustPoints=new T.Points(dustGeo,new T.PointsMaterial({color:'#cfb98c',size:.045,transparent:true,opacity:.6,depthWrite:false}));scene.add(dustPoints);animated.push({type:'dust',mesh:dustPoints});
 return time=>{for(const a of animated){if(a.type==='runes')a.mesh.rotation.y=time*.00006;if(a.type==='beam'||a.type==='flame')a.mesh.material.uniforms.time.value=time*.001;if(a.type==='dust')a.mesh.position.y=Math.sin(time*.0004)*.25;}};
}

export function detailedActor(scene,enemy=false,boss=false){
 const g=new T.Group(),metal=new T.MeshStandardMaterial({color:enemy?'#514e48':'#82959b',roughness:.36,metalness:.72}),dark=new T.MeshStandardMaterial({color:'#292a28',roughness:.82}),leather=new T.MeshStandardMaterial({color:enemy?'#615c4d':'#655140',map:surface('wood'),roughness:.8}),bone=new T.MeshStandardMaterial({color:'#b7af92',roughness:.8}),red=new T.MeshStandardMaterial({color:enemy?'#51433a':'#8c3034',roughness:.9,side:T.DoubleSide});
 const boxGeo=new T.BoxGeometry(1,1,1);
 const mesh=(geo,material,x,y,z,sx=1,sy=1,sz=1,parent=g)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const segment=(rt,rb,h,material,x,y,z,parent=g)=>mesh(new T.CylinderGeometry(rt,rb,h,8),material,x,y,z,1,1,1,parent);
 segment(.3,.24,.58,metal,0,1.24,0);segment(.24,.3,.24,leather,0,.91,0);mesh(boxGeo,metal,0,1.36,.2,.39,.38,.09);
 for(let i=0;i<3;i++)segment(.255+i*.009,.27,.045,metal,0,1.01+i*.08,0);
 const legs=[];for(const x of [-.155,.155]){const leg=new T.Group();leg.position.set(x,.85,0);g.add(leg);segment(.11,.095,.39,leather,0,-.2,0,leg);mesh(new T.IcosahedronGeometry(.12,1),metal,0,-.4,.04,1,1.2,1,leg);segment(.10,.13,.32,metal,0,-.57,0,leg);mesh(boxGeo,dark,0,-.76,.08,.23,.18,.4,leg);legs.push(leg);}
 segment(.085,.10,.14,bone,0,1.61,0);mesh(new T.SphereGeometry(.225,12,10),enemy?bone:metal,0,1.83,0,1,1.12,.94);mesh(boxGeo,dark,0,1.82,.195,.34,.075,.035);
 if(!enemy){mesh(boxGeo,metal,0,1.82,.225,.047,.25,.04);for(const x of[-.18,.18])mesh(boxGeo,metal,x,1.76,.12,.085,.24,.13);mesh(new T.ConeGeometry(.14,.25,5),red,0,2.12,-.02,1,1,.55);}else{const eyeMat=new T.MeshBasicMaterial({color:boss?'#ff5b26':'#f8b765',toneMapped:false});for(const x of[-.08,.08])mesh(new T.SphereGeometry(.035,6,5),eyeMat,x,1.84,.21);}
 const hand=new T.Group();hand.position.set(.38,1.43,0);g.add(hand);mesh(new T.SphereGeometry(.22,8,6),metal,.04,0,0,1.25,.7,1.25,hand);segment(.09,.08,.35,leather,.06,-.24,0,hand);segment(.085,.07,.24,metal,.06,-.5,.04,hand);mesh(new T.SphereGeometry(.085,6,5),leather,.06,-.65,.07,1,1,1,hand);
 const blade=new T.Shape();blade.moveTo(-.055,0);blade.lineTo(-.09,.7);blade.lineTo(0,1.02);blade.lineTo(.09,.7);blade.lineTo(.055,0);blade.closePath();const sword=mesh(new T.ExtrudeGeometry(blade,{depth:.035,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:1,steps:1}),new T.MeshStandardMaterial({color:'#d3e4e7',metalness:.9,roughness:.18}),.06,-.65,.24,1,1,1,hand);sword.rotation.x=Math.PI/2;mesh(boxGeo,metal,.06,-.65,.24,.42,.07,.07,hand);segment(.045,.045,.24,leather,.06,-.65,.11,hand).rotation.x=Math.PI/2;
 const left=new T.Group();left.position.set(-.38,1.4,0);g.add(left);mesh(new T.SphereGeometry(.2,8,6),metal,0,0,0,1.2,.7,1.2,left);segment(.09,.075,.53,leather,0,-.3,0,left);
 const shieldShape=new T.Shape();shieldShape.moveTo(-.28,.3);shieldShape.lineTo(.28,.3);shieldShape.lineTo(.26,-.1);shieldShape.lineTo(0,-.4);shieldShape.lineTo(-.26,-.1);shieldShape.closePath();mesh(new T.ExtrudeGeometry(shieldShape,{depth:.07,bevelEnabled:true,bevelSize:.025,bevelThickness:.015,bevelSegments:1,steps:1}),metal,-.08,-.3,.21,1,1,1,left);mesh(boxGeo,red,-.08,-.28,.3,.11,.47,.015,left);
 const capeGeo=new T.PlaneGeometry(.62,1.1,7,8);const positions=capeGeo.attributes.position;for(let i=0;i<positions.count;i++){const yy=positions.getY(i);positions.setZ(i,Math.sin(positions.getX(i)*14)*.035-(.55-yy)*.2);}capeGeo.computeVertexNormals();const cape=mesh(capeGeo,red,0,1.05,-.24);cape.rotation.x=-.12;
 if(boss){for(const side of[-1,1]){const horn=mesh(new T.ConeGeometry(.1,.65,7),bone,side*.22,2.12,0);horn.rotation.z=-side*.5;}g.scale.setScalar(1.85);}else g.scale.setScalar(enemy?1.05:1.22);
 const health=new T.Group();health.position.y=boss?2.6:2.35;const healthBg=mesh(new T.PlaneGeometry(.9,.085),new T.MeshBasicMaterial({color:'#111713',depthTest:false}),0,0,0,1,1,1,health);const healthFill=mesh(new T.PlaneGeometry(.85,.047),new T.MeshBasicMaterial({color:boss?'#eb6e45':'#b94c3e',depthTest:false}),0,0,.01,1,1,1,health);g.add(health);health.visible=false;
 scene.add(g);return{g,legs,hand,cape,health,healthFill,baseScale:boss?1.85:enemy?1.05:1.22};
}
