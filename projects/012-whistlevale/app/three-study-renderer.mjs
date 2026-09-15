import * as THREE from './vendor/three.module.js';
import {STRIDE,createStudyGeometry} from './webgl-geometry.mjs';
import {sceneVertex,sceneFragment,depthVertex,depthFragment,screenVertex,screenFragment} from './webgl-shaders.mjs';
import {makeSignCanvas,studyFrame,modelMatrices} from './renderer-scene.mjs';
import {createStandardStudy} from './three-standard-study.mjs';

// This renderer uses Three.js for geometry uploads, materials, render targets,
// scene traversal and draw submission. Only the optional pixel inspection reads GL.
export function createThreeRenderer(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.autoClear=false;renderer.sortObjects=false;renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.info.autoReset=false;
 const owned=[],own=obj=>(owned.push(obj),obj);let width=0,height=0,shadowKey='',disposed=false,shaderError='';
 renderer.debug.onShaderError=(gl,program,vs,fs)=>{shaderError=[gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs),gl.getProgramInfoLog(program)].filter(Boolean).join('\n');};
 const dispose=()=>{if(disposed)return;disposed=true;for(const item of owned)item.dispose?.();renderer.dispose();};
 try{
 const data=createStudyGeometry(true);
 function geometry(d,grouped=false){
  const g=own(new THREE.BufferGeometry()),buffer=new THREE.InterleavedBuffer(d.vertices,STRIDE);
  for(const [name,size,offset] of[['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aMaterial',1,9],['aUV',2,10]])g.setAttribute(name,new THREE.InterleavedBufferAttribute(buffer,size,offset));
  for(const [alias,name] of[['position','aPosition'],['normal','aNormal'],['color','aColor'],['uv','aUV']])g.setAttribute(alias,g.getAttribute(name));
  if(grouped){const buckets=Array.from({length:12},()=>[]);for(let i=0;i<d.indices.length;i+=3){const material=Math.round(d.vertices[d.indices[i]*STRIDE+9]);buckets[material].push(d.indices[i],d.indices[i+1],d.indices[i+2]);}let start=0;const indices=[];buckets.forEach((ids,index)=>{if(ids.length){g.addGroup(start,ids.length,index);indices.push(...ids);start+=ids.length;}});g.setIndex(new THREE.BufferAttribute(new Uint32Array(indices),1));}
  else g.setIndex(new THREE.BufferAttribute(d.indices,1));
  return g;
 }
 const clean=source=>source.replace(/^#version 300 es\s*/,''),u=value=>({value});
 function material(vertex,fragment,uniforms,extra={}){return own(new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:clean(vertex),fragmentShader:clean(fragment),uniforms,toneMapped:false,...extra}));}
 const sign=own(new THREE.CanvasTexture(makeSignCanvas()));sign.colorSpace=THREE.SRGBColorSpace;sign.generateMipmaps=false;sign.minFilter=sign.magFilter=THREE.LinearFilter;
 const hdr=renderer.extensions.has('EXT_color_buffer_float');
 function target(w,h,{shadow=false}={}){
  const depth=own(new THREE.DepthTexture(w,h,THREE.UnsignedIntType));depth.format=THREE.DepthFormat;depth.minFilter=depth.magFilter=THREE.NearestFilter;
  return own(new THREE.WebGLRenderTarget(w,h,{type:shadow?THREE.UnsignedByteType:hdr?THREE.HalfFloatType:THREE.UnsignedByteType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthTexture:depth,depthBuffer:true,stencilBuffer:false,generateMipmaps:false,samples:0}));
 }
 const shadow=target(1024,1024,{shadow:true}),color=target(1,1);
 const uniforms={uModel:u(new THREE.Matrix4()),uViewProjection:u(new THREE.Matrix4()),uLightProjection:u(new THREE.Matrix4()),uEye:u(new THREE.Vector3()),uLight:u(new THREE.Vector3()),uNight:u(0),uRoughness:u(.28),uStage:u(6),uNormals:u(0),uLinearOutput:u(1),uMaterialDetail:u(1),uLightDetail:u(1),uShadow:u(shadow.depthTexture),uSign:u(sign)};
 const surface=material(sceneVertex,sceneFragment,uniforms),depth=material(depthVertex,depthFragment,{uModel:u(new THREE.Matrix4()),uLightProjection:uniforms.uLightProjection},{colorWrite:false});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.matrixAutoUpdate=false;camera.matrixWorldAutoUpdate=false;
 const geometries=Object.fromEntries(['world','car','wheel'].map(name=>[name,geometry(data[name])]));
 const objects=modelMatrices(0).map(([name])=>{const mesh=new THREE.Mesh(geometries[name],surface);mesh.frustumCulled=false;mesh.matrixAutoUpdate=false;mesh.userData.studyModel=new THREE.Matrix4();mesh.onBeforeRender=(r,s,c,g,m)=>{m.uniforms.uModel.value.copy(mesh.userData.studyModel);m.uniformsNeedUpdate=true;};scene.add(mesh);return mesh;});
 const postUniforms={uColor:u(color.texture),uDepth:u(color.depthTexture),uShadow:u(shadow.depthTexture),uResolution:u(new THREE.Vector2()),uFocus:u(9),uLens:u(0),uExposure:u(1.1),uDepthView:u(0)};
 const post=material(screenVertex,screenFragment,postUniforms,{depthTest:false,depthWrite:false,side:THREE.DoubleSide});
 const quadGeometry=own(new THREE.BufferGeometry());quadGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const quad=new THREE.Mesh(quadGeometry,post);quad.frustumCulled=false;const postScene=new THREE.Scene();postScene.add(quad);
 let standard;
 function render(state,profile='custom'){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);color.setSize(w,h);postUniforms.uResolution.value.set(w,h);}
  if(profile==='standard'&&!standard)standard=createStandardStudy({THREE,renderer,data,geometry,sign,own});
  const frame=studyFrame(state,width,height);renderer.info.reset();
  camera.projectionMatrix.fromArray(frame.projection);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.matrixWorldInverse.fromArray(frame.view);camera.matrixWorld.copy(camera.matrixWorldInverse).invert();camera.matrix.copy(camera.matrixWorld);
  modelMatrices(frame.x).forEach(([,matrix],i)=>objects[i].userData.studyModel.fromArray(matrix));
  uniforms.uViewProjection.value.fromArray(frame.vp);uniforms.uLightProjection.value.fromArray(frame.lp);uniforms.uEye.value.fromArray(frame.eye);uniforms.uLight.value.fromArray(frame.light);
  uniforms.uNight.value=state.night;uniforms.uRoughness.value=state.roughness;uniforms.uMaterialDetail.value=state.detail.materials?1:0;uniforms.uLightDetail.value=state.detail.lighting?1:0;uniforms.uNormals.value=state.view==='normals'?1:0;
  const key=state.sun+':'+frame.x;let shadowDrawn=false;
  renderer.shadowMap.enabled=profile==='standard';
  if(profile==='custom'&&key!==shadowKey){renderer.setRenderTarget(shadow);renderer.clear(false,true,false);scene.overrideMaterial=depth;renderer.render(scene,camera);scene.overrideMaterial=null;shadowKey=key;shadowDrawn=true;}
  renderer.setRenderTarget(color);renderer.setClearColor(new THREE.Color().setRGB(.44-.40*state.night,.49-.43*state.night,.45-.35*state.night),1);renderer.clear(true,true,false);
  if(profile==='standard')standard.render(state,frame,camera);
  else renderer.render(scene,camera);
  postUniforms.uFocus.value=frame.focus;postUniforms.uLens.value=state.lens;postUniforms.uExposure.value=state.exposure;postUniforms.uDepthView.value=0;
  renderer.setRenderTarget(null);renderer.render(postScene,camera);
  if(shaderError)throw new Error('Three.js 着色器编译失败：'+shaderError);
  const gl=renderer.getContext(),error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('Three.js 绘制错误：0x'+error.toString(16));
  return{width,height,hdr,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,modelTriangles:data.world.triangles+data.car.triangles+4*data.wheel.triangles,shadowDrawn,profile};
 }
 function readPixels(){const gl=renderer.getContext(),pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;}
 return{render,readPixels,dispose};
 }catch(error){dispose();throw error;}
}
