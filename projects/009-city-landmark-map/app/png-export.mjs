// PNG RGBA8 编码：直接导出已校验字节，避免 Canvas 半透明预乘导致回读舍入差异。
const encoder=new TextEncoder();
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
function chunk(type,data){const name=encoder.encode(type),out=new Uint8Array(data.length+12),v=new DataView(out.buffer);v.setUint32(0,data.length);out.set(name,4);out.set(data,8);v.setUint32(out.length-4,crc32(out.subarray(4,out.length-4)));return out;}
export async function encodeRgbaPng(rgba,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||rgba.length!==width*height*4)throw new Error('PNG像素尺寸不符');
 const stride=width*4,raw=new Uint8Array((stride+1)*height);
 for(let y=0;y<height;y++)raw.set(rgba.subarray(y*stride,(y+1)*stride),y*(stride+1)+1);
 const compressed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
 const ihdr=new Uint8Array(13),v=new DataView(ihdr.buffer);v.setUint32(0,width);v.setUint32(4,height);ihdr[8]=8;ihdr[9]=6;
 return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);
}

