import {identity} from './webgl-math.mjs';
import {STRIDE,createStudyGeometry} from './webgl-geometry.mjs';
import {sceneVertex,sceneFragment,depthVertex,depthFragment,screenVertex,screenFragment} from './webgl-shaders.mjs';
import {comparisonViews} from './webgl-comparison.mjs';
import {makeSignCanvas,studyFrame,modelMatrices} from './renderer-scene.mjs';

export function createRenderer(canvas){
 const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});
 if(!gl)throw new Error('当前浏览器未能建立 WebGL 2 画面。下方的步骤、源码与研究说明仍可阅读。');
 const resources={program:[],buffer:[],vao:[],texture:[],framebuffer:[]};
 const own=(type,value)=>{if(!value)throw new Error('无法分配绘图资源');resources[type].push(value);return value;};
 let destroyed=false;
 function dispose(){if(destroyed)return;destroyed=true;for(const [kind,fn] of Object.entries({program:'deleteProgram',buffer:'deleteBuffer',vao:'deleteVertexArray',texture:'deleteTexture',framebuffer:'deleteFramebuffer'}))for(const obj of resources[kind])gl[fn](obj);}
 try{
 function program(vertex,fragment){
  const shaders=[];let p;
  try{
   for(const [type,source]of[[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const s=gl.createShader(type);if(!s)throw new Error('无法创建着色器');shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('着色器编译失败：'+gl.getShaderInfoLog(s));
   }
   p=own('program',gl.createProgram());for(const s of shaders)gl.attachShader(p,s);gl.linkProgram(p);
   if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('着色器连接失败：'+gl.getProgramInfoLog(p));
   const locations=new Map();return {p,u(name){if(!locations.has(name))locations.set(name,gl.getUniformLocation(p,name));return locations.get(name);}};
  }finally{for(const s of shaders)gl.deleteShader(s);}
 }
 const scene=program(sceneVertex,sceneFragment),depth=program(depthVertex,depthFragment),post=program(screenVertex,screenFragment);
 function upload(data){
  const vao=own('vao',gl.createVertexArray());gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,own('buffer',gl.createBuffer()));gl.bufferData(gl.ARRAY_BUFFER,data.vertices,gl.STATIC_DRAW);
  for(const [index,size,offset]of[[0,3,0],[1,3,3],[2,3,6],[3,1,9],[4,2,10]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,STRIDE*4,offset*4);}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,own('buffer',gl.createBuffer()));gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);
  return{vao,count:data.indices.length,triangles:data.triangles};
 }
 const meshes=Object.fromEntries(Object.entries(createStudyGeometry()).map(([k,v])=>[k,upload(v)]));
 const fineMeshes=Object.fromEntries(Object.entries(createStudyGeometry(true)).filter(([k])=>k!=='triangle').map(([k,v])=>[k,upload(v)]));
 const screenVAO=own('vao',gl.createVertexArray());
 function texture(filter){const t=own('texture',gl.createTexture());gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
 const signCanvas=makeSignCanvas();
 const signTexture=texture(gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,signCanvas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 const shadowSize=1024,shadowTexture=texture(gl.NEAREST);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowSize,shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 const shadowFBO=own('framebuffer',gl.createFramebuffer());gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFBO);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTexture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('阴影缓冲区不完整');
 let hdr=Boolean(gl.getExtension('EXT_color_buffer_float'));
 const colorTexture=texture(gl.LINEAR),depthTexture=texture(gl.NEAREST),sceneFBO=own('framebuffer',gl.createFramebuffer());
 let width=0,height=0,shadowKey='',lastCheck='';
 function resize(){
  const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));
  if(w===width&&h===height)return;
  width=w;height=h;canvas.width=w;canvas.height=h;
  gl.bindTexture(gl.TEXTURE_2D,depthTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,sceneFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTexture,0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,colorTexture,0);gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  const allocate=()=>{gl.bindTexture(gl.TEXTURE_2D,colorTexture);gl.texImage2D(gl.TEXTURE_2D,0,hdr?gl.RGBA16F:gl.RGBA8,w,h,0,gl.RGBA,hdr?gl.HALF_FLOAT:gl.UNSIGNED_BYTE,null);};
  allocate();if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE&&hdr){hdr=false;allocate();}
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('画面缓冲区不完整');
 }
 const setTexture=(unit,t)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);};
 let calls=0,triangles=0;
 function draw(mesh,model,prog){gl.uniformMatrix4fv(prog.u('uModel'),false,model);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_INT,0);calls++;triangles+=mesh.triangles;}
 function drawWorld(prog,x,detailed){
  const group=detailed?fineMeshes:meshes;
  for(const [name,matrix] of modelMatrices(x))draw(group[name],matrix,prog);
 }
 function renderView(state,{features,clip,name}){
  gl.disable(gl.SCISSOR_TEST);
  const startCalls=calls,startTriangles=triangles;
  const {step,light,lp,x,eye,vp,focus}=studyFrame(state,width,height);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.depthMask(true);
  const wantsShadow=step>=4,debug=state.view==='shadow'&&wantsShadow,normals=state.view==='normals'&&step>0;
  const key=state.sun+':'+x+':'+features.geometry;
  let shadowDrawn=false;
  if(wantsShadow&&key!==shadowKey){
   gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFBO);gl.viewport(0,0,shadowSize,shadowSize);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(depth.p);gl.uniformMatrix4fv(depth.u('uLightProjection'),false,lp);drawWorld(depth,x,features.geometry);shadowKey=key;shadowDrawn=true;
  }
  const composed=step>=6&&!normals;
  gl.bindFramebuffer(gl.FRAMEBUFFER,composed?sceneFBO:null);gl.viewport(0,0,width,height);
  const clipScreen=()=>{if(clip>0){const left=Math.round(width*clip);gl.enable(gl.SCISSOR_TEST);gl.scissor(left,0,width-left,height);}else gl.disable(gl.SCISSOR_TEST);};
  if(!composed)clipScreen();
  // Background values are linear only when the final color conversion follows.
  const sky=state.night*(step>=2?1:0),bg=composed?[.44-.40*sky,.49-.43*sky,.45-.35*sky]:[.72-.60*sky,.75-.60*sky,.70-.48*sky];
  gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(scene.p);
  gl.uniformMatrix4fv(scene.u('uViewProjection'),false,vp);gl.uniformMatrix4fv(scene.u('uLightProjection'),false,lp);
  gl.uniform3fv(scene.u('uEye'),eye);gl.uniform3fv(scene.u('uLight'),light);gl.uniform1f(scene.u('uNight'),sky);gl.uniform1f(scene.u('uRoughness'),state.roughness);
  gl.uniform1i(scene.u('uStage'),step);gl.uniform1i(scene.u('uNormals'),normals?1:0);gl.uniform1i(scene.u('uLinearOutput'),composed?1:0);
  gl.uniform1i(scene.u('uMaterialDetail'),features.materials?1:0);gl.uniform1i(scene.u('uLightDetail'),features.lighting?1:0);
  setTexture(0,shadowTexture);gl.uniform1i(scene.u('uShadow'),0);
  setTexture(3,signTexture);gl.uniform1i(scene.u('uSign'),3);
  if(step===0)draw(meshes.triangle,identity(),scene);else drawWorld(scene,x,features.geometry);
  if(composed||debug){
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(post.p);
   clipScreen();
   setTexture(0,shadowTexture);setTexture(1,colorTexture);setTexture(2,depthTexture);
   gl.uniform1i(post.u('uShadow'),0);gl.uniform1i(post.u('uColor'),1);gl.uniform1i(post.u('uDepth'),2);gl.uniform1i(post.u('uDepthView'),debug?1:0);
   gl.uniform2f(post.u('uResolution'),width,height);gl.uniform1f(post.u('uLens'),state.lens);gl.uniform1f(post.u('uExposure'),state.exposure);
   gl.uniform1f(post.u('uFocus'),focus);
   gl.bindVertexArray(screenVAO);gl.drawArrays(gl.TRIANGLES,0,3);calls++;triangles++;
  }
  gl.bindVertexArray(null);
  const checkKey=step+':'+state.view+':'+width+':'+height+':'+JSON.stringify(features)+':'+clip;
  if(checkKey!==lastCheck){const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('WebGL 绘制错误：0x'+error.toString(16));lastCheck=checkKey;}
  gl.disable(gl.SCISSOR_TEST);
  return{step,calls:calls-startCalls,triangles:triangles-startTriangles,hdr,shadowDrawn,width,height,name,stageLabel:debug?'光源深度图':normals?'表面朝向':composed?'颜色 + 深度 → 摄影处理':'直接绘制'};
 }
 function render(state){
  if(destroyed||gl.isContextLost())return null;
  resize();calls=0;triangles=0;
  const views=comparisonViews(state).map(view=>renderView(state,view));
  const modelTriangles=group=>group.world.triangles+group.car.triangles+group.wheel.triangles*4;
  return{...views.at(-1),calls,triangles,views,baseModel:modelTriangles(meshes),fineModel:modelTriangles(state.mode==='detail'&&state.detail.geometry?fineMeshes:meshes)};
 }
 // Read immediately after render; no persistent drawing buffer or timed benchmark.
 function readPixels(){const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;}
 return {render,dispose,readPixels};
 }catch(error){dispose();throw error;}
}
