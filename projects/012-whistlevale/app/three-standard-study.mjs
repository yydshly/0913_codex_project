import {modelMatrices} from './renderer-scene.mjs';
// A configured built-in-material example, not the quality ceiling of Three.js.
// No custom surface GLSL. It supplies textures, bump, environment, and lights.
export function createStandardStudy({THREE,renderer,data,geometry,sign,own}){
 const scene=new THREE.Scene();
 function texture(kind){
  const size=256,bytes=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=x/size,v=y/size;let value;
   if(kind==='wood')value=.85+.10*Math.sin(v*78+Math.sin(u*6.28+Math.sin(v*19))*3)+.025*Math.sin(v*590+u*7);
   else{const row=Math.floor(u*9),px=(v*5+(row%2)*.5)%1,py=(u*9)%1;value=px<.06||py<.09?.55:.88+.10*Math.sin(row*12.17+Math.floor(v*5+(row%2)*.5)*4.61);}
   const offset=(y*size+x)*4,c=Math.round(value*255);bytes.set([c,c,c,255],offset);
  }
  const t=own(new THREE.DataTexture(bytes,size,size));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
 }
 const wood=texture('wood'),brick=texture('brick');
 const materials=Array.from({length:12},(_,id)=>{
  const metal=id===6?.86:id===8?.08:id===2?.2:id===3?.18:0;
  const m=own(new THREE.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:id===3?.08:id===1?.49:id===2?.47:.85,metalness:metal}));
  if(id===1||id===11){m.map=wood;m.bumpMap=wood;m.bumpScale=.006;}
  if(id===4){m.map=brick;m.bumpMap=brick;m.bumpScale=.02;}
  if(id===9)m.map=sign;
  if(id===7){m.emissive.setRGB(1,.58,.17);m.emissiveIntensity=.45;}
  return m;
 });
 const geos=Object.fromEntries(['world','car','wheel'].map(name=>[name,geometry(data[name],true)]));
 const objects=modelMatrices(0).map(([name])=>{const m=new THREE.Mesh(geos[name],materials);m.matrixAutoUpdate=false;m.frustumCulled=false;m.castShadow=m.receiveShadow=true;scene.add(m);return m;});
 const sun=new THREE.DirectionalLight(0xffffff,Math.PI);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,bottom:-8,top:8,near:1,far:35});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00065;sun.shadow.normalBias=.014;sun.shadow.radius=2;scene.add(sun,sun.target);
 const ambient=new THREE.HemisphereLight(0xffffff,0xffffff,1);scene.add(ambient);
 own({dispose(){sun.shadow.dispose();}});
 const lamp=new THREE.PointLight(0xffba66,0,8,2);lamp.position.set(1.6,2.38,.45);scene.add(lamp);
 // An actual environment map is provided; metallic materials are not deprived of it.
 const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;const ctx=envCanvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#c4d7dd');gradient.addColorStop(.48,'#aab6ae');gradient.addColorStop(.53,'#8c846e');gradient.addColorStop(1,'#625943');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
 const env=own(new THREE.CanvasTexture(envCanvas));env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;const pmrem=new THREE.PMREMGenerator(renderer),envTarget=own(pmrem.fromEquirectangular(env));pmrem.dispose();scene.environment=envTarget.texture;
 renderer.shadowMap.type=THREE.PCFShadowMap;
 const lerp=(a,b,t)=>a+(b-a)*t;
 function render(state,frame,camera){
  modelMatrices(frame.x).forEach(([,matrix],i)=>objects[i].matrix.fromArray(matrix));
  const night=state.night;sun.position.fromArray(frame.light.map(v=>v*16));sun.color.setRGB(lerp(1.85,.16,night),lerp(1.64,.21,night),lerp(1.24,.32,night));
  ambient.color.setRGB(lerp(.34,.05,night),lerp(.43,.085,night),lerp(.49,.165,night));ambient.groundColor.setRGB(lerp(.22,.025,night),lerp(.23,.027,night),lerp(.20,.035,night));
  lamp.intensity=night*5;scene.environmentIntensity=lerp(.42,.08,night);materials[7].emissiveIntensity=lerp(.45,3,night);
  for(const id of[6,8])materials[id].roughness=state.roughness;
  renderer.render(scene,camera);
 }
 return{render};
}
