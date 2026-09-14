import {assetDigest,digest} from './controlled-compositor.mjs';
export async function loadScenicAssets(manifestUrl,plan){
 const response=await fetch(manifestUrl);if(!response.ok)throw new Error('素材登记文件无法读取');
 const manifest=await response.json();
 if(manifest.places.length!==plan.places.length||new Set(manifest.places.map(p=>p.id)).size!==plan.places.length||manifest.places.some(p=>!plan.places.some(q=>q.id===p.id)))throw new Error('素材名单与景区清单不一致');
 const url=new URL(manifest.sheet,response.url),res=await fetch(url);if(!res.ok)throw new Error('景区素材图无法读取');
 const bytes=await res.arrayBuffer();
 if(await digest(bytes)!==manifest.sha256)throw new Error('景区素材图哈希与登记不符');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}),{colorSpaceConversion:'none'});
 try{
  if(bitmap.width!==manifest.width||bitmap.height!==manifest.height)throw new Error('素材图尺寸与登记不符');
  const assets=[];
  for(const p of manifest.places){
   const c=p.crop;
   if(![c.x,c.y,c.width,c.height].every(Number.isInteger)||c.x<0||c.y<0||c.width<1||c.height<1||c.x+c.width>bitmap.width||c.y+c.height>bitmap.height)throw new Error('素材分格越界：'+p.id);
   const canvas=document.createElement('canvas');canvas.width=c.width;canvas.height=c.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,c.x,c.y,c.width,c.height,0,0,c.width,c.height);
   const rgba=ctx.getImageData(0,0,c.width,c.height).data;
   let visible=0,border=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(rgba[(y*c.width+x)*4+3]>=128){visible++;if(x===0||y===0||x===c.width-1||y===c.height-1)border++;}
   if(!visible||border)throw new Error('素材为空或主体触及分格边界：'+p.id);
   const asset={...p,width:c.width,height:c.height,rgba,sourceSha256:manifest.sha256};
   asset.sha256=await assetDigest(asset);assets.push(asset);
  }
  return {manifest,assets};
 }finally{bitmap.close();}
}
