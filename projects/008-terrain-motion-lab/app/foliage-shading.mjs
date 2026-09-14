import * as T from './vendor/three.module.js';

// Treat small twig cards as a foliage volume. Flat card normals produce alternating
// bright/dark speckles; the softened normals keep the crown's lighting continuous.
export function softenCrownNormals(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,v=new T.Vector3;
 for(let i=0;i<p.count;i++){v.set(p.getX(i)*.24,.85,p.getZ(i)*.24).normalize();n.setXYZ(i,v.x,v.y,v.z);}
 n.needsUpdate=true;
}
export function shadeFoliage(material,{billboard=false}={}){
 material.roughness=1;
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);');
  // Needle cards are thin: reduce white grazing highlights while retaining diffuse sun.
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.specularColor*=.12;');
  // A crossed shadow proxy must not black out its own billboard. Distant foliage
  // uses scene hemisphere + direct light; its fixed proxy still casts onto the ground.
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=vec3(.72,1.0,.7);float leafLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(.09/max(.02,leafLuma),1.0,2.6);');
 };
 material.customProgramCacheKey=()=> 'foliage-volume-v1-'+billboard;
}

// Extend needle colour into transparent texels before the GPU creates mipmaps.
// The alpha mask remains unchanged, so this removes dark filtering fringes without
// changing the twig silhouette or the original source files.
export function padTwigColour(diffuse,alpha){
 const canvas=document.createElement('canvas');canvas.width=diffuse.image.width;canvas.height=diffuse.image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(diffuse.image,0,0);const colour=ctx.getImageData(0,0,canvas.width,canvas.height);
 const maskCanvas=document.createElement('canvas');maskCanvas.width=canvas.width;maskCanvas.height=canvas.height;
 const maskCtx=maskCanvas.getContext('2d');maskCtx.drawImage(alpha.image,0,0);const mask=maskCtx.getImageData(0,0,canvas.width,canvas.height).data;
 const x0=Math.floor(canvas.width*.006),x1=Math.ceil(canvas.width*.207),y0=Math.floor(canvas.height*.041),y1=Math.ceil(canvas.height*.446),width=x1-x0,height=y1-y0;
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=((y+y0)*canvas.width+x+x0)*4,i=y*width+x;if(mask[at+1]>200){seen[i]=1;queue[tail++]=i;}}
 while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width),from=((y+y0)*canvas.width+x+x0)*4;
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const ni=ny*width+nx;if(seen[ni])continue;seen[ni]=1;queue[tail++]=ni;const to=((ny+y0)*canvas.width+nx+x0)*4;for(let c=0;c<3;c++)colour.data[to+c]=colour.data[from+c];}
 }
 ctx.putImageData(colour,0,0);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=diffuse.anisotropy;diffuse.dispose();return texture;
}
