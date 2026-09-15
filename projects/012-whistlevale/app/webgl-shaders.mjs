// GLSL ES 3.00 programs for the independent WebGL 2 teaching scene.
export const sceneVertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColor;
layout(location=3) in float aMaterial;
layout(location=4) in vec2 aUV;
uniform mat4 uModel,uViewProjection,uLightProjection;
out vec3 vWorld,vNormal,vColor;out vec4 vShadow;out vec2 vSurfaceUV;flat out int vMaterial;
void main(){
 vec4 world=uModel*vec4(aPosition,1.0);
 vWorld=world.xyz;
 // Runtime transforms are rigid; dimensions are baked into geometry beforehand.
 vNormal=mat3(uModel)*aNormal;
 vColor=aColor;vMaterial=int(aMaterial+.5);vSurfaceUV=aUV;
 vShadow=uLightProjection*world;
 gl_Position=uViewProjection*world;
}`;
export const sceneFragment=`#version 300 es
precision highp float;
in vec3 vWorld,vNormal,vColor;in vec4 vShadow;in vec2 vSurfaceUV;flat in int vMaterial;
uniform vec3 uEye,uLight;uniform float uNight,uRoughness;
uniform int uStage,uNormals,uLinearOutput,uMaterialDetail,uLightDetail;uniform sampler2D uShadow,uSign;
out vec4 outColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float stripe(float p,float width){float f=abs(fract(p)-.5),aa=max(fwidth(p),.002);return 1.-smoothstep(width-aa,width+aa,f);}
vec3 bumpNormal(vec3 p,vec3 n,float height){
 vec3 dx=dFdx(p),dy=dFdy(p),r1=cross(dy,n),r2=cross(n,dx);
 float det=dot(dx,r1);
 vec3 gradient=sign(det)*(dFdx(height)*r1+dFdy(height)*r2);
 return normalize(max(abs(det),1e-8)*n-gradient);
}
float shadowAmount(vec3 normal){
 vec3 q=vShadow.xyz/vShadow.w*.5+.5;
 if(any(lessThan(q,vec3(0)))||any(greaterThan(q,vec3(1))))return 1.;
 float bias=max(.00065,.0021*(1.-max(dot(normal,uLight),0.))),s=0.;
 vec2 texel=1./vec2(textureSize(uShadow,0));
 float count=0.;
 for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){
  if(uLightDetail==0&&(abs(x)>1||abs(y)>1))continue;
  vec2 offset=vec2(x,y)*texel*(uLightDetail==1?1.8:1.);
  s+=q.z-bias<=texture(uShadow,q.xy+offset).r?1.:0.;count+=1.;
 }
 return s/count;
}
vec3 toSRGB(vec3 c){return mix(12.92*c,1.055*pow(max(c,vec3(0)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
void main(){
 vec3 n=normalize(vNormal),base=vColor;float rough=.83,metal=0.;
 if(uNormals==1){outColor=vec4(n*.5+.5,1);return;}
 if(uStage<2){outColor=vec4(toSRGB(base),1);return;}
 if(uStage>=3){
  if(vMaterial==1){float grain=sin(vWorld.x*48.+noise(vWorld.xz*vec2(.8,9.))*9.);base*=.80+.20*grain;rough=.58;}
  if(vMaterial==2){base*=1.-.26*stripe(vWorld.x*3.,.04);rough=.63;}
  if(vMaterial==4){vec2 uv=vec2(vWorld.x+vWorld.z,vWorld.y)*vec2(4.,7.);uv.x+=mod(floor(uv.y),2.)*.5;float mortar=max(stripe(uv.x,.045),stripe(uv.y,.055));base=mix(base,vec3(.22),mortar*.65);}
  if(vMaterial==5)base*=.9+.15*noise(vWorld.xz*18.);
  if(vMaterial==6){metal=.8;rough=uRoughness;}
  if(vMaterial==8)rough=uRoughness;
  if(vMaterial==3){rough=.12;metal=.25;base=mix(base,vec3(.18,.30,.33),pow(1.-abs(dot(n,normalize(uEye-vWorld))),3.)*.6);}
  if(uMaterialDetail==1){
   base=vColor;float height=0.;vec2 uv=vSurfaceUV;
   if(vMaterial==0){float plaster=noise(vWorld.xy*95.+vWorld.z*13.);base*=.96+.06*plaster;height=plaster*.002;rough=.94;}
   if(vMaterial==1||vMaterial==11){
    float grain=sin(uv.y*78.+noise(uv*vec2(1.6,12.))*6.);
    float fiber=noise(uv*vec2(4.,180.));
    base*=.87+.09*grain+.06*fiber;height=grain*.0009+fiber*.0007;rough=vMaterial==1?.49:.60;
   }
   if(vMaterial==2){float seam=stripe(vWorld.x*3.,.02);base*=.97+.035*noise(vWorld.xz*55.);height=(1.-seam)*.002;rough=.47;metal=.2;}
   if(vMaterial==4){
    vec2 q=vec2(vWorld.x+vWorld.z,vWorld.y)*vec2(5.,9.);q.x+=mod(floor(q.y),2.)*.5;
    float mortar=max(stripe(q.x,.035),stripe(q.y,.055));float variation=hash(floor(q));
    base=mix(base*(.83+.28*variation),vec3(.28,.25,.20),mortar);
    height=(1.-mortar)*.014+noise(vWorld.xy*85.)*.0015;rough=.91;
   }
   if(vMaterial==5){base*=.92+.08*noise(vWorld.xz*12.);rough=.93;}
   if(vMaterial==6){metal=.86;rough=uRoughness;base*=.98+.025*noise(uv*vec2(5.,130.));}
   if(vMaterial==8){metal=.08;rough=uRoughness;float orangePeel=noise(uv*180.);height=orangePeel*.0002;}
   if(vMaterial==10){float stone=noise(vWorld.xz*65.);base*=.95+.08*stone;height=stone*.002;rough=.88;}
   if(vMaterial==3){rough=.08;metal=.18;base=mix(base,vec3(.045,.075,.055),.57);}
   n=bumpNormal(vWorld,n,height);
  }
  if(vMaterial==9){base=texture(uSign,vSurfaceUV).rgb;rough=.5;metal=.15;}
 }
 float visibility=uStage>=4?shadowAmount(n):1.;
 float diffuse=max(dot(n,uLight),0.);
 vec3 ambient=mix(vec3(.22,.27,.30),vec3(.035,.060,.12),uNight)*( .8+.2*n.y );
 vec3 sunColor=mix(vec3(1.85,1.64,1.24),vec3(.16,.21,.32),uNight);
 vec3 light=base*(ambient+sunColor*diffuse*visibility);
 if(uLightDetail==1){
  vec3 sky=mix(vec3(.12,.16,.19),vec3(.015,.025,.045),uNight);
  vec3 ground=mix(vec3(.095,.068,.037),vec3(.012,.009,.004),uNight);
  light+=base*mix(ground,sky,n.y*.5+.5);
 }
 if(uStage>=3){vec3 halfDir=normalize(uLight+normalize(uEye-vWorld));float spec=pow(max(dot(n,halfDir),0.),mix(110.,7.,rough));light+=mix(vec3(.045),base,metal)*spec*sunColor*visibility*(1.-rough)*2.5;}
 if(uMaterialDetail==1&&uStage>=3){
  vec3 view=normalize(uEye-vWorld),reflected=reflect(-view,n),f0=mix(vec3(.04),base,metal);
  vec3 fresnel=f0+(1.-f0)*pow(1.-max(dot(n,view),0.),5.);
  vec3 env=mix(vec3(.12,.105,.075),vec3(.55,.64,.67),smoothstep(-.2,.8,reflected.y));
  light+=env*fresnel*(1.-rough*.75)*mix(.42,.08,uNight);
 }
 if(vMaterial==7)light+=vec3(1.,.58,.17)*mix(.45,3.,uNight);
 // A small local fill from the station lantern, separate from emitted window color.
 if(uNight>0.){vec3 d=vec3(1.6,2.38,.45)-vWorld;float lamp=max(dot(n,normalize(d)),0.)/(1.+dot(d,d)*2.);light+=base*vec3(2.,1.05,.35)*lamp*uNight;}
 outColor=vec4(uLinearOutput==1?light:toSRGB(light),1.);
}`;
export const depthVertex=`#version 300 es
precision highp float;layout(location=0)in vec3 aPosition;uniform mat4 uModel,uLightProjection;
void main(){gl_Position=uLightProjection*uModel*vec4(aPosition,1.);}`;
export const depthFragment=`#version 300 es
precision highp float;void main(){}`;
export const screenVertex=`#version 300 es
precision highp float;out vec2 vUV;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
export const screenFragment=`#version 300 es
precision highp float;in vec2 vUV;out vec4 outColor;
uniform sampler2D uColor,uDepth,uShadow;uniform vec2 uResolution;
uniform float uFocus,uLens,uExposure;uniform int uDepthView;
float linearDepth(float z){float near=.1,far=80.;return 2.*near*far/(far+near-(z*2.-1.)*(far-near));}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 toSRGB(vec3 c){return mix(12.92*c,1.055*pow(max(c,vec3(0)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
void main(){
 if(uDepthView==1){float d=texture(uShadow,vUV).r;outColor=vec4(vec3(d),1);return;}
 float dep=linearDepth(texture(uDepth,vUV).r);
 float blur=clamp(abs(dep-uFocus)/max(dep,1.)*uLens*14.,0.,6.);
 vec3 color=texture(uColor,vUV).rgb;float weight=1.;
 for(int i=0;i<12;i++){
  float angle=float(i)*2.399963;vec2 offset=vec2(cos(angle),sin(angle))*sqrt((float(i)+.5)/12.)*blur/uResolution;
  float sampleDepth=linearDepth(texture(uDepth,vUV+offset).r);
  float w=1.-smoothstep(.6,2.5,dep-sampleDepth);
  color+=texture(uColor,vUV+offset).rgb*w;weight+=w;
 }
 color=aces(color/weight*uExposure);
 outColor=vec4(toSRGB(color),1.);
}`;
