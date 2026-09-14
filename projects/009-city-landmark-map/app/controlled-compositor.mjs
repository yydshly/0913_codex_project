// 受控栅格合成原型。位置依据来自 plan；校验读取实际绘制后的像素归属。
// 不使用人工成图观察，也不把景区编号当作视觉身份真实性证明。
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(bytes){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));}
export async function assetDigest(asset){
 const bytes=new Uint8Array(8+asset.rgba.length),view=new DataView(bytes.buffer);
 view.setUint32(0,asset.width);view.setUint32(4,asset.height);bytes.set(asset.rgba,8);
 return digest(bytes);
}
export async function diagnosticAssets(plan){
 return Promise.all(plan.places.map(async(p,i)=>{
  const width=16,height=16,rgba=new Uint8ClampedArray(width*height*4);
  for(let y=1;y<15;y++)for(let x=1;x<15;x++){
   const n=(y*width+x)*4;rgba[n]=55+i*19;rgba[n+1]=130-i*8;rgba[n+2]=88+i*12;rgba[n+3]=255;
  }
  const a={id:p.id,width,height,rgba,kind:'diagnostic',identityStatus:'not-reviewed',anchor:{u:.5,v:.5}};
  a.sha256=await assetDigest(a);return a;
 }));
}
export function placementCommands(plan){
 return plan.places.map(p=>{
  // 本轮使用小测试色块，保持地理位置；不声称解决真实景观占位问题。
  const size=Math.max(4,Math.floor(Math.min(32,p.radius*1.2)));
  return {placeId:p.id,assetId:p.id,x:Math.round(p.x-size/2),y:Math.round(p.y-size/2),width:size,height:size};
 });
}
export function scenarioCommands(plan,scenario='normal',base=placementCommands(plan)){
 const cmds=base.map(c=>({...c}));
 const a=cmds.find(c=>c.placeId==='louguan'),b=cmds.find(c=>c.placeId==='terracotta');
 if(scenario==='swap'){[a.x,b.x]=[b.x,a.x];[a.y,b.y]=[b.y,a.y];}
 else if(scenario==='missing')cmds.splice(cmds.findIndex(c=>c.placeId==='louguan'),1);
 else if(scenario==='occlusion'){b.x=a.x;b.y=a.y;b.width=a.width;b.height=a.height;cmds.splice(cmds.indexOf(b),1);cmds.push(b);}
 else if(scenario==='asset')a.assetId='terracotta';
 else if(scenario!=='normal')throw new Error('未知实验');
 return cmds;
}
export async function composeAndAudit(plan,assets,commands){
 const {width,height}=plan.frame;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16000000)throw new Error('画幅无效');
 const rgba=new Uint8ClampedArray(width*height*4),owners=new Uint16Array(width*height);
 const issues=[],warnings=[],registry=new Map(),numbers=new Map(plan.places.map((p,i)=>[p.id,i+1]));
 const issue=(code,id,detail)=>issues.push({code,id,detail});
 for(const a of assets){
  if(registry.has(a.id)){issue('duplicate-asset',a.id,'素材编号重复');continue;}
  if(!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<1||a.height<1||a.rgba?.length!==a.width*a.height*4){issue('invalid-asset',a.id,'素材像素尺寸不符');continue;}
  if(!a.anchor||![a.anchor.u,a.anchor.v].every(v=>Number.isFinite(v)&&v>=0&&v<=1)){issue('invalid-anchor',a.id,'素材接地点未声明');continue;}
  if(await assetDigest(a)!==a.sha256){issue('asset-hash',a.id,'素材内容与注册哈希不符');continue;}
  registry.set(a.id,a);
 }
 const attempted=new Map(),counts=new Map(),anchors=new Map();
 for(const c of commands){
  const p=plan.places.find(p=>p.id===c.placeId),a=registry.get(c.assetId);
  if(!p){issue('unknown-place',c.placeId,'未收录的景区');continue;}
  counts.set(c.placeId,(counts.get(c.placeId)||0)+1);
  if(counts.get(c.placeId)>1)issue('duplicate-place',c.placeId,'景区重复合成');
  if(!a){issue('missing-asset',c.placeId,'素材缺失或校验失败');continue;}
  if(c.assetId!==p.id)issue('identity-binding',p.id,'素材编号与景区编号不对应');
  if(![c.x,c.y,c.width,c.height].every(Number.isInteger)||c.width<1||c.height<1||c.width*c.height>16000000){issue('invalid-transform',p.id,'合成变换无效');continue;}
  const anchor={x:c.x+c.width*a.anchor.u,y:c.y+c.height*a.anchor.v};
  anchors.set(p.id,anchor);
  if(Math.hypot(anchor.x-p.x,anchor.y-p.y)>p.radius)issue('anchor-outside',p.id,'实际变换后的素材接地点超出地理区域');
  let expected=0;
  for(let dy=0;dy<c.height;dy++)for(let dx=0;dx<c.width;dx++){
   const sx=Math.floor(dx*a.width/c.width),sy=Math.floor(dy*a.height/c.height),src=(sy*a.width+sx)*4,alpha=a.rgba[src+3]/255;
   if(alpha===0)continue;
   if(alpha>=.5)expected++;
   const x=c.x+dx,y=c.y+dy;
   if(x<0||y<0||x>=width||y>=height)continue;
   const index=y*width+x,dst=index*4,prev=rgba[dst+3]/255,outAlpha=alpha+prev*(1-alpha);
   for(let k=0;k<3;k++)rgba[dst+k]=Math.round((a.rgba[src+k]*alpha+rgba[dst+k]*prev*(1-alpha))/outAlpha);
   rgba[dst+3]=Math.round(outAlpha*255);
   // 半透明装饰不当作稳定身份像素。本原型按alpha>=0.5归属最上层。
   if(alpha>=.5)owners[index]=numbers.get(p.id);
  }
  attempted.set(p.id,(attempted.get(p.id)||0)+expected);
 }
 const observations=plan.places.map(p=>({id:p.id,visiblePixels:0,sumX:0,sumY:0,outsidePixels:0,minX:width,minY:height,maxX:-1,maxY:-1}));
 // 单独扫描最终可见像素归属，不能仅检查 commands 中的计划位置。
 for(let index=0;index<owners.length;index++){
  if(!owners[index])continue;
  const o=observations[owners[index]-1],p=plan.places[owners[index]-1],x=index%width,y=Math.floor(index/width);
  o.visiblePixels++;o.sumX+=x+.5;o.sumY+=y+.5;o.minX=Math.min(o.minX,x);o.maxX=Math.max(o.maxX,x);o.minY=Math.min(o.minY,y);o.maxY=Math.max(o.maxY,y);
  if(Math.hypot(x+.5-p.x,y+.5-p.y)>p.radius)o.outsidePixels++;
 }
 for(const o of observations){
  o.expectedPixels=attempted.get(o.id)||0;
  o.visibleRatio=o.expectedPixels?o.visiblePixels/o.expectedPixels:0;
  o.centroid=o.visiblePixels?{x:o.sumX/o.visiblePixels,y:o.sumY/o.visiblePixels}:null;
  delete o.sumX;delete o.sumY;
  if(!counts.has(o.id))issue('missing-place',o.id,'没有合成该景区');
  else if(!o.visiblePixels)issue('invisible-place',o.id,'没有可见的景观主体像素');
  else if(o.visibleRatio<.9)issue('occluded-or-clipped',o.id,'主体可见像素不足90%，可能遮挡或裁切');
  if(o.outsidePixels)issue('pixels-outside',o.id,'实际可见主体像素超出指定区域');
 }
 for(const r of plan.relations){
  const a=observations.find(o=>o.id===r.a)?.centroid,b=observations.find(o=>o.id===r.b)?.centroid;
  if(a&&b&&(b[r.axis]-a[r.axis])*r.sign<=0)issue('direction-reversed',r.a+' / '+r.b,'可见像素的'+r.axis+'方向顺序错误');
 }
 const diagnostic=assets.some(a=>a.kind==='diagnostic');
 if(diagnostic)warnings.push('使用代码测试色块，仅验证合成与自动检查，不是景区插画');
 if(plan.crowded.length)warnings.push('真实景观放大后仍需解决密集点占位；本次小色块通过不能证明美术容量充足');
 const report={version:1,mode:'controlled-raster-audit',positionStatus:issues.length?'failed':'passed',
  productionStatus:'pending',identityStatus:'unverified',diagnostic,frame:plan.frame,
  observedCount:observations.filter(o=>o.visiblePixels).length,expectedCount:plan.places.length,
  issues,warnings,observations,
  outputSha256:await digest(rgba),ownershipSha256:await digest(new Uint8Array(owners.buffer)),
  scope:'自动扫描本次受控合成的像素归属；不识别任意外部整图，不证明素材画的是正确景区；alpha<0.5的装饰像素不参与归属'}
 return {rgba,owners,report};
}
export async function verifyOutputBytes(rgba,report){
 return rgba.length===report.frame.width*report.frame.height*4&&await digest(rgba)===report.outputSha256;
}
