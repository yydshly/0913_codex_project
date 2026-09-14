export const sampleRate=32000;
export function balancePcm(audio){
  let sum=0,peak=0;for(let i=0;i<audio.length;i+=2){const x=audio.readInt16LE(i);sum+=x*x;peak=Math.max(peak,Math.abs(x));}
  const rms=Math.sqrt(sum/(audio.length/2));
  if(!Number.isFinite(rms)||rms<10)throw new Error('配音为空或接近静音。');
  const gain=Math.min(1800/rms,30000/peak,2.5),result=Buffer.alloc(audio.length);
  for(let i=0;i<audio.length;i+=2)result.writeInt16LE(Math.round(audio.readInt16LE(i)*gain),i);
  return {audio:result,gain};
}
export function buildWav(duration,clips){
  const pcm=Buffer.alloc(Math.round(duration*sampleRate)*2);let end=0;
  for(const {start,limit,audio} of clips){
    if(!Buffer.isBuffer(audio)||audio.length%2||!audio.length)throw new Error('音频必须是非空 16-bit PCM。');
    const offset=Math.round(start*sampleRate)*2,slotEnd=Math.round(limit*sampleRate)*2;
    if(offset<end||offset<0||slotEnd>pcm.length||offset+audio.length>slotEnd)throw new Error('配音超出分配时段；请提高对应句子的语速后重新生成。');
    audio.copy(pcm,offset);end=offset+audio.length;
  }
  const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(pcm.length+36,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(sampleRate,24);h.writeUInt32LE(sampleRate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
  return Buffer.concat([h,pcm]);
}
