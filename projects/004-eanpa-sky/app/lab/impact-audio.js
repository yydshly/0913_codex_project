// Short stochastic contact sounds, with six reproducible timbre variants per surface.
export function impactSamples(kind,sampleRate,variant=0){
 const hail=kind.startsWith('hail-'),soft=/earth|snow|foliage/.test(kind),water=kind.includes('water');
 const frequency=(kind.includes('stone')?hail?2300:1350:kind.includes('roof')?hail?830:510:water?390:210)*( .82+variant*.065);
 const duration=soft?.11:.16,output=new Float32Array(Math.ceil(sampleRate*duration));let seed=1973+variant*104729+kind.length*37,low=0;
 const decay=soft?.013:water?.028:.021+variant*.0015;
 for(let i=0;i<output.length;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1,t=i/sampleRate;
  low+=Math.min(1,2*Math.PI*(soft?650:2300)/sampleRate)*(noise-low);
  const resonance=Math.sin(2*Math.PI*frequency*t)*.035+Math.sin(2*Math.PI*frequency*1.63*t)*.018;
  output[i]=((soft?low:noise*.55+low*.45)*.23+resonance)*Math.min(1,t/.0015)*Math.exp(-t/decay)*Math.min(1,(duration-t)/.008);
 }
 return output;
}
export const detailCutoff=distance=>Math.max(600,7500/(1+Math.max(0,distance)/7));
