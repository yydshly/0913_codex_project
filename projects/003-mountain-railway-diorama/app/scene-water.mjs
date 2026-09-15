import {iceGLSL} from './scene-ice.mjs';
import * as THREE from './vendor/three.module.js';
import {V,mesh,random} from './scene-world.mjs';
import {advanceWaterPhase,waterTravel,waterTravelToZ,poolFoamClusterState,waterLaneShift,foamPatchShape} from './scene-water-modes.mjs';
import {channelStrength,cascadeBedHeight,createCascadeRock,createCascadeSplash} from './scene-cascade.mjs';
import {rockWaterField} from './scene-rocks.mjs';
export function createWater(group,world,shared){
 const style=world.waterStyle;
 if(style.split)createCascadeRock(group,world);
 const geo=createWaterGeometry(world);
 const target=new THREE.WebGLRenderTarget(768,768,{type:THREE.HalfFloatType}),reflectionMatrix=new THREE.Matrix4(),reflectionCamera=new THREE.PerspectiveCamera();
 const phase={value:0};let previousTime=shared.time.value;
 const dividers=(world.riverRocks||[]).filter(r=>r.kind==='divider');
 const dividerCentres=Array.from({length:3},(_,i)=>{const r=dividers[i];return r?new THREE.Vector4(r.x,r.y,r.z,r.rx):new THREE.Vector4();});
 const dividerShapes=Array.from({length:3},(_,i)=>{const r=dividers[i];return r?new THREE.Vector2(r.ry,r.rz):new THREE.Vector2(1,1);});
 const uniforms={uDividerCount:{value:dividers.length},uDividerCentres:{value:dividerCentres},uDividerShapes:{value:dividerShapes},uPhase:phase,uThickness:shared.waterThickness,uFoamAmount:shared.waterFoam,uReflection:shared.waterReflection,uRipple:shared.waterRipple,uPoolZ:{value:style.end+.5},uFallActive:{value:style.splash>0?1:0},uSplit:{value:style.split?1:0},uFoam:{value:style.foam},uFlowScale:{value:style.flowScale},uSeason:shared.season,uTime:shared.time,uWind:shared.wind,uGust:shared.gust,uWindDir:shared.windDir,uRain:shared.rain,uFlow:shared.flow,uReflect:{value:target.texture},uReflectMatrix:{value:reflectionMatrix}};
 const material=new THREE.MeshStandardMaterial({color:'#257b7d',roughness:.24,metalness:.02,side:THREE.DoubleSide,transparent:true,depthWrite:false});
 material.userData.seasonOwn=true;material.customProgramCacheKey=()=> 'wetland-water-v30-shared-ice';
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  const noise=`float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise21(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}`;
  shader.vertexShader=`uniform vec4 uSeason;${iceGLSL}uniform float uPhase;attribute vec3 aFlowNormal,aFlowTangent;attribute float aImpactShift;varying vec3 vFlowTangent;varying float vImpactShift;uniform float uTime,uWind,uGust,uFlow,uRipple;uniform vec2 uWindDir;uniform mat4 uReflectMatrix;attribute float aObstacle,aDeflect,aContactFoam,aFall,aDepth,aChannel,aTravel,aCross;varying vec2 vRiver;varying float vWaterY,vObstacle,vDeflect,vContactFoam,vFall,vDepth,vChannel,vTravel,vCross;varying vec4 vReflect;${noise}\n`+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vFlowTangent=aFlowTangent;vImpactShift=aImpactShift;vObstacle=aObstacle;vDeflect=aDeflect;vContactFoam=aContactFoam;vCross=aCross;vTravel=aTravel;vRiver=uv;vFall=aFall;vDepth=aDepth;vChannel=aChannel;float force=uWind*(.72+.28*sin(uTime*.9+position.x*.09+position.z*.07))*(1.+uGust*.55*sin(uTime*1.7+position.x*.12));
   float frozen=habitatIce(aDepth,aFall,uSeason.w);
   transformed.y+=(1.-frozen)*(noise21(position.xz*1.1-uWindDir*uTime*.36)-.5)*.045*uRipple*2.*(1.+force*2.)*(1.-clamp(aFall,0.,1.))*smoothstep(0.,.35,aDepth)*smoothstep(.1,.35,aObstacle);
   float rillHeight=noise21(vec2(aCross*4.8,(aTravel-uPhase)*1.15))-.5;
   transformed+=(1.-frozen)*aFlowNormal*rillHeight*(.025+.035*clamp(aFall,0.,1.))*uRipple*2.*smoothstep(.04,.3,aDepth)*smoothstep(.1,.35,aObstacle);
   vWaterY=transformed.y;vRiver=transformed.xz;
  `).replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vReflect=uReflectMatrix*modelMatrix*vec4(transformed,1.);
  `);
  shader.fragmentShader=`${iceGLSL}varying vec3 vFlowTangent;varying float vImpactShift;uniform int uDividerCount;uniform vec4 uDividerCentres[3];uniform vec2 uDividerShapes[3];uniform float uPhase,uThickness,uFoamAmount,uReflection,uRipple,uSplit,uFoam,uFlowScale,uPoolZ,uFallActive;uniform vec4 uSeason;uniform float uTime,uWind,uGust,uRain,uFlow;uniform vec2 uWindDir;uniform sampler2D uReflect;varying vec2 vRiver;varying float vWaterY,vObstacle,vDeflect,vContactFoam,vFall,vDepth,vChannel,vTravel,vCross;varying vec4 vReflect;${noise}\n`+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vDepth<=.005||vObstacle<.025)discard;
   // Exact fragment test for lip boulders; water-grid interpolation cannot leak.
   for(int solid=0;solid<3;solid++){
    if(solid>=uDividerCount)break;
    vec4 rock=uDividerCentres[solid];vec2 shape=uDividerShapes[solid];
    float vertical=(vWaterY-rock.y)/shape.x;
    if(abs(vertical)<1.05){float section=sqrt(max(.01,1.-min(.99,vertical*vertical)));vec2 radius=vec2(rock.w,shape.y)*section+.07;if(length((vRiver-rock.xz)/radius)<1.)discard;}
   }
   float flowTime=vTravel-uPhase;
   vec2 drift=vec2((vCross-vDeflect)*1.15,flowTime*2.2);
   vec2 warp=vec2(noise21(drift*.43),noise21(drift*.37+19.))-.5;
   vec2 flowUV=drift+warp*.85;
   float broad=noise21(flowUV*.57+vec2(7.,0.));
   float streak=noise21(flowUV*vec2(2.4,1.))*.56+noise21(flowUV*4.1+17.)*.27+noise21(flowUV*8.3)*.17;
   float cascade=clamp(vFall,0.,1.);
   // Solid bed and ellipsoid masks determine open water, independent of time.
   float bankFade=smoothstep(0.,.16,vDepth);
   float shoreFoam=(1.-smoothstep(.025,.32,vDepth))*smoothstep(.67,.86,noise21(vec2(vCross*2.,flowTime*2.8)))*bankFade;
   float downstream=vRiver.y+vImpactShift-uPoolZ;
   float birth=smoothstep(-.25,.45,downstream);
   float pool=birth*exp(-max(0.,downstream)*.37);
   vec2 poolUV=vec2(vCross/(1.+max(0.,downstream)*.055),flowTime*2.1)+warp*.6;
   float foamNoise=noise21(poolUV*1.7)*.65+noise21(poolUV*4.6+31.)*.35;
   // The impact patch is textured inside the water surface, then fades downstream.
   float impact=pool*uFallActive;
   float churn=impact*smoothstep(.41,.70,foamNoise)*(.42+.58*smoothstep(.22,.65,broad));
   float rills=noise21(vec2((vCross-vDeflect)*5.2+warp.x*.8,flowTime*1.15))*.68+noise21(vec2(vCross*10.5,flowTime*2.6))*.32;
   float falling=smoothstep(.12,.8,vFall)*uFallActive;
   float breaks=noise21(vec2(vCross*11.+warp.x*3.,flowTime*11.+noise21(vec2(vCross*4.,flowTime*.5))*2.));
   float filaments=noise21(vec2((vCross-vDeflect)*18.+warp.x*1.5,flowTime*1.8));
   float threads=smoothstep(.53,.80,rills)*smoothstep(.18,.68,breaks);
   float fineThreads=smoothstep(.50,.79,filaments)*smoothstep(.22,.66,breaks);
   float waterThreads=clamp(threads*.62+fineThreads*.65,0.,1.)*falling*bankFade;
   float foam=(falling*threads*uFoam*.55+shoreFoam*.2+churn*uFoam*1.25+vContactFoam*.22)*uFoamAmount*2.*bankFade;
   diffuseColor.rgb=mix(vec3(.025,.115,.105),vec3(.23,.255,.15),exp(-vDepth*mix(.65,3.2,uThickness)));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.20,.19),falling*.75);
   diffuseColor.rgb*=mix(1.,.78+rills*.44,cascade);
   // Narrow, interrupted highlights describe moving water even with foam off.
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.65,.63),waterThreads*(.38+(1.-uThickness)*.22));
   diffuseColor.rgb*=vec3(1.)+uSeason.x*vec3(.08,.15,.04)+uSeason.z*vec3(.08,.03,-.08)+uSeason.w*vec3(.12,.13,.18);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.64,.77,.72),clamp(foam,0.,.95));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.73,.88,.92),falling*uThickness*.10);
   float ice=habitatIce(vDepth,vFall,uSeason.w);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.57,.76,.81),ice*.94);
  `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float force=uWind*(.72+.28*sin(uTime*.9+vRiver.x*.09+vRiver.y*.07))*(1.+uGust*.55*sin(uTime*1.7+vRiver.x*.12));
   vec2 ripple=vRiver*2.1-uWindDir*uTime*(.35+uWind*.55);
   float nx=noise21(ripple+vec2(.09,0.))-noise21(ripple-vec2(.09,0.));
   float nz=noise21(ripple+vec2(0.,.09))-noise21(ripple-vec2(0.,.09));
   vec3 worldRipple=vec3(nx,0.,nz)*(.23+force*.65)*uRipple*2.;
   normal+=mat3(viewMatrix)*worldRipple*bankFade;
   vec3 flowSide=normalize(mat3(viewMatrix)*vec3(1.,0.,0.)),flowDown=normalize(mat3(viewMatrix)*vFlowTangent);
   float rillCross=noise21(vec2(vCross*5.2+.13,flowTime*1.15))-noise21(vec2(vCross*5.2-.13,flowTime*1.15));
   float rillDown=noise21(vec2(vCross*5.2,flowTime*1.15+.07))-noise21(vec2(vCross*5.2,flowTime*1.15-.07));
   normal+=(flowSide*rillCross*.20+flowDown*rillDown*.10)*cascade*uRipple*2.*smoothstep(.05,.35,vObstacle);
   float spread=max(0.,downstream);
   float wake=sin(length(vec2(vCross*.42,spread))*8.-uPhase*3.)*exp(-spread*.36)*smoothstep(0.,.8,downstream);
   normal+=mat3(viewMatrix)*vec3(0.,0.,wake*.025*uRipple);
   normal.xz*=1.-ice*.85;normal=normalize(normal);
   roughnessFactor=mix(roughnessFactor,.42,falling);
   roughnessFactor=mix(roughnessFactor,.65,clamp(churn*uFoamAmount*2.,0.,1.));
  `).replace('#include <opaque_fragment>',`
   vec2 reflectUV=vReflect.xy/vReflect.w+normal.xz*.009;
   float fresnel=pow(1.-abs(dot(normal,normalize(vViewPosition))),2.);
   vec3 reflected=texture2D(uReflect,clamp(reflectUV,.002,.998)).rgb;
   outgoingLight=mix(outgoingLight,reflected,clamp((.12+fresnel*.46)*uReflection*1.65,0.,.92)*(1.-ice*.7)*(1.-clamp(vFall,0.,1.))*smoothstep(-2.,1.,vRiver.y)*smoothstep(.015,.5,vDepth)*(1.-clamp((churn*uFoam+foam*.45)*uFoamAmount*2.,0.,.9)));
   // Transmission is gradual across all calm water, with no viewing hole or
   // fish-shaped cutout. Depth-tested fish remain behind the tinted surface.
   float clearWater=(1.-clamp(vFall,0.,1.))*(1.-ice)*smoothstep(.18,.6,vDepth)*(1.-smoothstep(1.8,3.5,vDepth));
   float transmission=clearWater*mix(.22,.06,uThickness)*(1.-fresnel*.85)*(1.-uRain*.75)*(1.-uWind*.18)*(1.-uSeason.w*.38);
   diffuseColor.a=1.-clamp(transmission,0.,.7);
   #include <opaque_fragment>`);
 };
 const water=mesh(geo,material,group,false),foamGroup=new THREE.Group();group.add(foamGroup);const rng=random(49);
 water.renderOrder=-1;
 // Still 180 instances in one draw: soft, torn films instead of polygon discs.
 const foamMat=new THREE.MeshBasicMaterial({color:'#b6d4c7',transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}),foam=[],foamOpacity=new THREE.InstancedBufferAttribute(new Float32Array(180),1),foamStyle=new THREE.InstancedBufferAttribute(new Float32Array(180*2),2);
 const foamGeo=new THREE.PlaneGeometry(2,2);foamGeo.setAttribute('aFoamOpacity',foamOpacity);foamGeo.setAttribute('aFoamStyle',foamStyle);foamOpacity.setUsage(THREE.DynamicDrawUsage);foamStyle.setUsage(THREE.DynamicDrawUsage);
 foamMat.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float aFoamOpacity;attribute vec2 aFoamStyle;varying float vFoamOpacity;varying vec2 vFoamUV;varying vec2 vFoamStyle;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFoamOpacity=aFoamOpacity;vFoamUV=uv*2.-1.;vFoamStyle=aFoamStyle;');
  shader.fragmentShader=`varying float vFoamOpacity;varying vec2 vFoamUV;varying vec2 vFoamStyle;
   float foamHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float foamNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(foamHash(i),foamHash(i+vec2(1.,0.)),f.x),mix(foamHash(i+vec2(0.,1.)),foamHash(i+1.),f.x),f.y);}
   `+shader.fragmentShader.replace('#include <opaque_fragment>',`
    vec2 p=vFoamUV;float seed=vFoamStyle.x*57.,age=vFoamStyle.y;
    p.x+=.16*sin(p.y*5.+seed)+.08*sin(p.y*11.-seed);
    float coarse=foamNoise(p*vec2(3.8,3.1)+seed);
    float edge=1.-smoothstep(.43,.84,length(p*vec2(1.,.9))+(coarse-.5)*.42);
    float grain=foamNoise(p*vec2(7.,6.)+seed+age*.65);
    float film=smoothstep(.22+age*.27,.43+age*.25,coarse*.55+grain*.45);
    float margin=1.-smoothstep(.82,1.,max(abs(vFoamUV.x),abs(vFoamUV.y)));
    diffuseColor.a*=vFoamOpacity*edge*film*margin;
    #include <opaque_fragment>`);
 };
 foamMat.customProgramCacheKey=()=> 'river-foam-film-v19';
 const foamMesh=new THREE.InstancedMesh(foamGeo,foamMat,180);foamMesh.frustumCulled=false;foamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);foamGroup.add(foamMesh);
 const foamDummy=new THREE.Object3D(),surfaceNormal=V(),flowAxis=V(),acrossAxis=V(),foamBasis=new THREE.Matrix4();
 for(let i=0;i<180;i++)foam.push({offset:rng(),lateral:(rng()-.5)*1.8,seed:rng(),size:.028+rng()*.07,pool:i<100});
 const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=64;const ctx=mistCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,32);gradient.addColorStop(0,'rgba(226,247,243,.23)');gradient.addColorStop(1,'rgba(226,247,243,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const mistMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(mistCanvas),transparent:true,opacity:.3,depthWrite:false}),mist=[];
 for(let i=0;i<20;i++){const m=new THREE.Sprite(mistMat);m.scale.set(1.2+rng()*1.8,1.1+rng()*1.5,1);foamGroup.add(m);mist.push({m,a:rng()*6.28})}
 const splash=createCascadeSplash(foamGroup,world,shared,true);
 const travelStart=waterTravel(world,-32),travelEnd=waterTravel(world,32);
 const clip=new THREE.Plane(V(0,1,0),-world.waterLevel(10)+.06),look=V(),posCam=V(),up=V();let lastReflection=-Infinity;
 return{water,update(time,night){
  phase.value=advanceWaterPhase(phase.value,Math.min(.1,Math.max(0,time-previousTime)),shared.flow.value*style.flowScale);previousTime=time;
  material.envMapIntensity=shared.waterReflection.value*.5;
  splash.update(time);splash.points.visible=style.splash>0&&shared.flow.value>.001;splash.points.material.uniforms.uVisible.value*=style.splash*shared.waterFoam.value*2.;
  for(let i=0;i<foam.length;i++){
   const f=foam[i],emitter=f.pool?foam[Math.floor(i/4)*4]:f,life=4.5+emitter.seed*2,age=(emitter.offset*life+phase.value)%life;
   let z,x,alpha,size;
   if(f.pool){const patch=poolFoamClusterState(world,age,emitter,f);({z,x}=patch);alpha=patch.opacity*style.foam;size=f.size*patch.scale;}
   else{z=waterTravelToZ(world,travelStart+(f.offset*(travelEnd-travelStart)+phase.value)%(travelEnd-travelStart));x=world.riverX(z)+f.lateral*world.halfWidth(z);alpha=.13;size=f.size*.55;}
   const around=rockWaterField(world.riverRocks||[],x,z,world.waterSurface(x,z));x+=around.deflect*.45;
   const surface=world.waterSurface(x,z),depth=surface-Math.max(world.height(x,z),cascadeBedHeight(world,x,z)),obstacle=rockWaterField(world.riverRocks||[],x,z,surface);
   const shape=foamPatchShape(size,age,emitter.seed,f.pool);
   const dx=(world.waterSurface(x+.04,z)-world.waterSurface(x-.04,z))/.08,dz=(world.waterSurface(x,z+.04)-world.waterSurface(x,z-.04))/.08;
   const bend=(world.riverX(z+.08)-world.riverX(z-.08))/.16;
   surfaceNormal.set(-dx,1,-dz).normalize();flowAxis.set(bend,dx*bend+dz,1).normalize();acrossAxis.crossVectors(flowAxis,surfaceNormal).normalize();foamBasis.makeBasis(acrossAxis,flowAxis,surfaceNormal);
   const valid=depth>.05&&obstacle.clearance>shape.radius+.035&&foamFitsWater(world,x,z,acrossAxis,flowAxis,shape);
   foamDummy.quaternion.setFromRotationMatrix(foamBasis);foamDummy.position.set(x,surface+.04,z);foamDummy.scale.set(shape.width,shape.length,1);foamDummy.updateMatrix();foamMesh.setMatrixAt(i,foamDummy.matrix);
   foamOpacity.setX(i,valid?alpha*Math.min(1,depth*4):0);
   foamStyle.setXY(i,f.seed,f.pool?shape.maturity:.65);
  }
  foamMesh.instanceMatrix.needsUpdate=true;foamOpacity.needsUpdate=true;foamStyle.needsUpdate=true;
  for(let i=0;i<mist.length;i++){const f=mist[i],e=splash.emitters[i%splash.emitters.length];f.m.position.set(e.x+Math.sin(time*.3+f.a)*.45,e.y+.23+Math.cos(time*.5+f.a)*.18,e.z+.3);f.m.scale.set(.55+Math.sin(f.a)**2*.65,.45,1);}
  mistMat.opacity=(.20+world.effectiveDrop*.03)*Math.min(1,shared.flow.value)*style.splash*shared.waterMist.value*2.;mistMat.color.setScalar(1-night*.55);foamMat.opacity=(.38-night*.12)*shared.waterFoam.value*2.;
 },reflect(renderer,scene,camera,now){
  if(shared.waterReflection.value<=.001||now-lastReflection<120)return;lastReflection=now;
  const level=world.waterLevel(10);posCam.copy(camera.position);posCam.y=2*level-posCam.y;camera.getWorldDirection(look);look.add(camera.position);look.y=2*level-look.y;up.copy(camera.up);up.y*=-1;
  reflectionCamera.copy(camera,false);reflectionCamera.position.copy(posCam);reflectionCamera.up.copy(up);reflectionCamera.lookAt(look);reflectionCamera.updateMatrixWorld();
  reflectionMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(reflectionCamera.projectionMatrix).multiply(reflectionCamera.matrixWorldInverse);
  const savedTarget=renderer.getRenderTarget(),savedClips=renderer.clippingPlanes,savedShadow=renderer.shadowMap.autoUpdate;
  water.visible=false;foamGroup.visible=false;renderer.clippingPlanes=[clip];renderer.shadowMap.autoUpdate=false;
  const savedReflectionPass=shared.reflectionPass.value;shared.reflectionPass.value=1;
  try{renderer.setRenderTarget(target);renderer.render(scene,reflectionCamera);}
  finally{renderer.setRenderTarget(savedTarget);renderer.clippingPlanes=savedClips;renderer.shadowMap.autoUpdate=savedShadow;shared.reflectionPass.value=savedReflectionPass;water.visible=true;foamGroup.visible=true;}
 },dispose(){target.dispose()}};
}

export function createWaterGeometry(world){
 const pos=[],uv=[],fall=[],shore=[],channels=[],travel=[],cross=[],obstacles=[],deflections=[],contactFoam=[],surfaceNormals=[],flowTangents=[],impactOffsets=[],indices=[],rows=300,cols=96;
 for(let i=0;i<=rows;i++){
  const z=-32+i/rows*64,y=world.waterLevel(z);
  for(let j=0;j<=cols;j++){
   const u=j/cols,x=world.riverX(z)+(u-.5)*(world.halfWidth(z)+1.2)*2;
   const surface=world.waterSurface(x,z);pos.push(x,surface+.025,z);uv.push(x,z);fall.push(Math.abs(world.waterSurface(x,z+.12)-world.waterSurface(x,z-.12))*4);shore.push(surface-Math.max(world.height(x,z),cascadeBedHeight(world,x,z)));const obstacle=rockWaterField(world.riverRocks||[],x,z,surface);obstacles.push(obstacle.clearance);deflections.push(obstacle.deflect);contactFoam.push(obstacle.foam);cross.push(x-world.riverX(z));channels.push(channelStrength(world,x,z));const lane=x-world.riverX(z);travel.push(waterTravel(world,z,lane));impactOffsets.push(waterLaneShift(lane,world));
   const dx=(world.waterSurface(x+.04,z)-world.waterSurface(x-.04,z))/.08,dz=(world.waterSurface(x,z+.04)-world.waterSurface(x,z-.04))/.08;
   surfaceNormals.push(...V(-dx,1,-dz).normalize().toArray());flowTangents.push(...V(0,dz,1).normalize().toArray());
   if(i<rows&&j<cols&&world.footprint(x,z)){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1)}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('aFall',new THREE.Float32BufferAttribute(fall,1));geo.setAttribute('aDepth',new THREE.Float32BufferAttribute(shore,1));geo.setAttribute('aChannel',new THREE.Float32BufferAttribute(channels,1));geo.setAttribute('aTravel',new THREE.Float32BufferAttribute(travel,1));geo.setAttribute('aCross',new THREE.Float32BufferAttribute(cross,1));geo.setAttribute('aObstacle',new THREE.Float32BufferAttribute(obstacles,1));geo.setAttribute('aDeflect',new THREE.Float32BufferAttribute(deflections,1));geo.setAttribute('aContactFoam',new THREE.Float32BufferAttribute(contactFoam,1));geo.setAttribute('aFlowNormal',new THREE.Float32BufferAttribute(surfaceNormals,3));geo.setAttribute('aFlowTangent',new THREE.Float32BufferAttribute(flowTangents,3));geo.setAttribute('aImpactShift',new THREE.Float32BufferAttribute(impactOffsets,1));geo.setIndex(indices);geo.computeVertexNormals();
 return geo;
}

// Check the stretched footprint at all four corners, including shore and island
// bounds. Near rocks the caller uses the full quad's circumscribed radius.
export function foamFitsWater(world,x,z,across,flow,shape){
 for(const a of [-1,1])for(const b of [-1,1]){
  const px=x+across.x*shape.width*a+flow.x*shape.length*b,pz=z+across.z*shape.width*a+flow.z*shape.length*b;
  if(!world.footprint(px,pz)||world.waterSurface(px,pz)-Math.max(world.height(px,pz),cascadeBedHeight(world,px,pz))<=.05)return false;
 }
 return true;
}
