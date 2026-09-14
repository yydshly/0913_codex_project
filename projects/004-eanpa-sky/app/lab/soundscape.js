import {impactSamples,detailCutoff} from './impact-audio.js';
import {nearDetailGain} from './rain-experience.js';
// Natural rain/thunder: WuxiaScrub, CC0. See assets/audio/source-and-checks.json.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
export function shelterAt({x,y,z}){return y<4.72?clamp(Math.min(x+8.9,.9-x,z+8.4,.4-z)):0;}
export function thunderParameters(strike,camera,right){
 const dx=strike.x-camera.x,dy=strike.y-camera.y,dz=strike.z-camera.z,distance=Math.hypot(dx,dy,dz);
 return{distance,delay:distance/343,gain:.85/(1+distance/800),pan:clamp((dx*right.x+dz*right.z)/Math.max(1,Math.hypot(dx,dz)),-.85,.85),cutoff:Math.max(250,4200/(1+distance/650))};
}
export function mixLevels(rain,wind,shelter,focus='all'){
 const r=clamp(rain),w=clamp(wind/8),s=clamp(shelter),hasRain=focus==='all'||focus==='rain';
 return{rain:hasRain?r*(.9-.57*s):0,roof:hasRain?r*s*.21:0,wind:(focus==='all'||focus==='wind')?(.008+.085*w)*(1-.75*s):0,cutoff:6800-4900*s};
}
export function farHailGain(distance){const fade=Math.max(0,Math.min(1,(distance-8)/14));return fade*fade*(3-2*fade)*Math.max(0,1-distance/110)**2;}
export function detailAllowed(focus,kind){return focus==='all'||focus==='details'||(kind.startsWith('hail-')?focus==='hail':focus==='rain');}
export function createSoundscape(onEvent=()=>{}){
 let ctx,master,analyser,samples,layers,loadPromise,suspendTimer,enabled=false,blocked=false,disposed=false,volume=.25,focus='all',lastStrike=null,lastUpdate=-1,detailVolume=.55,nextRoofTap=0,lastDetailAt=-1,farHailEnergy=0,farHailTime=0;const detailVoices=new Set();
 let pending=[];const voices=new Set(),abort=new AbortController();
 const stats={enabled:false,context:'uninitialized',loading:false,loaded:false,rain:0,shelter:0,rms:0,thunderScheduled:0,thunderPlayed:0,pending:0,detailPlayed:0,hailFarImpacts:0,hailFarLevel:0,detailByKind:{stone:0,earth:0,roof:0}};
 const buffers={},variants={},lastVariant={};
 function target(param,value,seconds=.18){const now=ctx.currentTime;if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);else param.cancelScheduledValues(now);param.setTargetAtTime(value,now,seconds);}
 function context(){
  if(ctx)return;const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)throw Error('Web Audio unavailable');
  ctx=new Context();master=ctx.createGain();master.gain.value=0;
  const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=8;limiter.ratio.value=6;limiter.attack.value=.005;limiter.release.value=.3;
  analyser=ctx.createAnalyser();analyser.fftSize=2048;samples=new Float32Array(2048);master.connect(limiter).connect(analyser).connect(ctx.destination);
 }
 function layer(buffer,cutoff,offset=0){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=.5;gain.gain.value=0;source.connect(filter).connect(gain).connect(master);source.start(0,offset);return{source,filter,gain};
 }
 async function load(){
  if(loadPromise)return loadPromise;stats.loading=true;
  loadPromise=(async()=>{
   const results=await Promise.all(['rain-garden','thunder-natural'].map(async name=>{const response=await fetch(`/lab-audio/${name}.ogg`,{signal:abort.signal});if(!response.ok)throw Error(`Audio ${response.status}: ${name}`);return ctx.decodeAudioData(await response.arrayBuffer());}));
   if(disposed)return;[buffers.rain,buffers.thunder]=results;
   for(let c=0;c<buffers.rain.numberOfChannels;c++){const d=buffers.rain.getChannelData(c),n=Math.floor(ctx.sampleRate*.015);for(let i=0;i<n;i++){const a=i/n;d[i]*=a;d[d.length-1-i]*=a;}}
   const wind=ctx.createBuffer(2,ctx.sampleRate*8,ctx.sampleRate);for(let c=0;c<2;c++){const d=wind.getChannelData(c);let low=0;for(let i=0;i<d.length;i++){low=.985*low+.015*(Math.random()*2-1);d[i]=low*3;}for(let i=0;i<1000;i++){d[i]*=i/1000;d[d.length-i-1]*=i/1000;}}
   for(const kind of ['stone','earth','roof','hail-stone','hail-earth','hail-roof','hail-water','hail-snow','hail-foliage']){
    variants[kind]=Array.from({length:6},(_,v)=>{const data=impactSamples(kind,ctx.sampleRate,v),b=ctx.createBuffer(1,data.length,ctx.sampleRate);b.copyToChannel(data,0);return b;});buffers[kind]=variants[kind][0];
   }
   const hailBed=ctx.createBuffer(2,ctx.sampleRate*19,ctx.sampleRate);
   for(let c=0;c<2;c++){const out=hailBed.getChannelData(c);for(let n=0;n<300;n++){const tick=variants[n%3?'hail-stone':'hail-roof'][n%6].getChannelData(0),at=Math.floor(Math.random()*(out.length-tick.length)),gain=.25+Math.random()*.45;for(let i=0;i<tick.length;i++)out[at+i]+=tick[i]*gain;}for(let i=0;i<800;i++){out[i]*=i/800;out[out.length-1-i]*=i/800;}}
   layers={rain:layer(buffers.rain,6800),roof:layer(buffers.rain,1700,4.3),leaves:layer(buffers.rain,2900,8.1),wind:layer(wind,550),hailFar:layer(hailBed,950)};layers.leaves.filter.type='bandpass';layers.leaves.filter.Q.value=.65;stats.loaded=true;onEvent('audio-loaded',{source:'CC0 natural rain and thunder',files:2});
  })().catch(error=>{loadPromise=null;throw error;}).finally(()=>{stats.loading=false;});return loadPromise;
 }
 function cancelThunder(){for(const v of detailVoices){try{v.stop(ctx.currentTime+.03);}catch{}}pending=[];stats.pending=0;for(const voice of voices){target(voice.gain.gain,0,.035);try{voice.source.stop(ctx.currentTime+.18);}catch{}}}
 function reconcile(){
  if(!ctx||disposed)return;clearTimeout(suspendTimer);
  if(enabled&&!blocked){void ctx.resume().catch(()=>{});target(master.gain,volume,.06);}
  else{target(master.gain,0,.035);cancelThunder();suspendTimer=setTimeout(()=>{if(!enabled||blocked)void ctx.suspend().catch(()=>{});},220);}
 }
 async function enable(){context();enabled=true;stats.enabled=true;try{await ctx.resume();await load();reconcile();}catch(error){enabled=false;stats.enabled=false;reconcile();throw error;}}
 function mute(){enabled=false;stats.enabled=false;reconcile();}
 function setBlocked(value){if(value!==blocked){blocked=value;reconcile();}}
 function setVolume(value){volume=clamp(value);if(ctx)target(master.gain,enabled&&!blocked?volume:0,.06);}
 function setFocus(value){focus=['all','rain','wind','thunder','details','hail'].includes(value)?value:'all';if(ctx)cancelThunder();lastUpdate=-1;farHailEnergy=0;onEvent('audio-focus',focus);}
 function setDetailVolume(value){detailVolume=clamp(value);}
 function playDetail(event,camera,right){
  if(!buffers[event.kind]||detailVoices.size>=12||ctx.currentTime-lastDetailAt<.055)return;
  const dx=event.x-camera.x,dy=event.y-camera.y,dz=event.z-camera.z,distance=Math.hypot(dx,dy,dz),attenuation=nearDetailGain(distance);
  if(attenuation<.005||detailVolume===0)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner();const bank=variants[event.kind],variant=((lastVariant[event.kind]??0)+1+Math.floor(Math.random()*(bank.length-1)))%bank.length;lastVariant[event.kind]=variant;source.buffer=bank[variant];source.playbackRate.value=.96+Math.random()*.08;gain.gain.value=(event.kind==='hail-roof'?.7:event.kind==='hail-stone'?.8:event.kind.startsWith('hail-')?.28:event.kind==='roof'?.18:.30)*detailVolume*attenuation*clamp(event.strength);pan.pan.value=clamp((dx*right.x+dz*right.z)/Math.max(1,Math.hypot(dx,dz)),-.8,.8);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=detailCutoff(distance);filter.Q.value=.45;source.connect(filter).connect(gain).connect(pan).connect(master);source.onended=()=>{detailVoices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};detailVoices.add(source);source.start();lastDetailAt=ctx.currentTime;stats.detailPlayed++;stats.detailByKind[event.kind]=(stats.detailByKind[event.kind]??0)+1;stats.lastDetail={kind:event.kind,variant,cutoff:Math.round(filter.frequency.value),distance:+distance.toFixed(2),pan:+pan.pan.value.toFixed(2)};
 }
 function playThunder(parameters){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),pan=ctx.createStereoPanner();source.buffer=buffers.thunder;source.playbackRate.value=.98+Math.random()*.04;filter.type='lowpass';filter.frequency.value=parameters.cutoff;pan.pan.value=parameters.pan;gain.gain.value=parameters.gain*(1-.3*stats.shelter);
  source.connect(filter).connect(gain).connect(pan).connect(master);const voice={source,gain};voices.add(voice);source.start();source.onended=()=>{voices.delete(voice);source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};stats.thunderPlayed++;onEvent('thunder-played',{distanceMeters:+parameters.distance.toFixed(1),delaySeconds:+parameters.delay.toFixed(2)});
 }
 function update({time,rain,snow=0,hail=0,wind,camera,right,strike,sheltered,listenerSource,detailEvents=[]}){
  stats.listenerSource=listenerSource??'fallback';stats.snow=+clamp(snow).toFixed(3);stats.hail=+clamp(hail).toFixed(3);
  const r=clamp(rain),s=sheltered===undefined?shelterAt(camera):clamp(sheltered);stats.rain=+r.toFixed(3);stats.shelter=+s.toFixed(3);
  if(strike&&strike.id!==lastStrike){lastStrike=strike.id;if(stats.loaded&&enabled&&!blocked&&(focus==='all'||focus==='thunder')){const parameters=thunderParameters(strike,camera,right);if(pending.length<8){pending.push({at:time+parameters.delay,parameters});stats.thunderScheduled++;onEvent('thunder-scheduled',{distanceMeters:+parameters.distance.toFixed(1),delaySeconds:+parameters.delay.toFixed(2)});}}}
  if(!layers||!enabled||blocked)return;
  farHailEnergy*=Math.exp(-Math.max(0,time-farHailTime)/.45);farHailTime=time;
  for(const event of detailEvents)if(detailAllowed(focus,event.kind)){
   if(event.kind.startsWith('hail-')){const g=farHailGain(Math.hypot(event.x-camera.x,event.y-camera.y,event.z-camera.z));if(g>.001){farHailEnergy=Math.min(1,farHailEnergy+g*clamp(event.strength)*.10);stats.hailFarImpacts++;}}
   playDetail(event,camera,right);
  }
  if(focus==='all'||focus==='rain'||focus==='details'){
   if(time>=nextRoofTap&&r>.04){nextRoofTap=time+.09+Math.min(1.4,-Math.log(Math.max(.001,Math.random()))/(2+r*5));playDetail({x:-4+Math.sin(time)*2,y:4.7,z:-3,kind:'roof',strength:r},camera,right);}
  }

  for(const item of pending.filter(item=>item.at<=time)){if(voices.size<3)playThunder(item.parameters);}pending=pending.filter(item=>item.at>time);stats.pending=pending.length;
  if(time-lastUpdate<.05)return;lastUpdate=time;const levels=mixLevels(r,Math.max(wind,clamp(snow)*2.5),s,focus),gust=.92+.08*Math.sin(time*.33);
  target(layers.rain.gain.gain,levels.rain);target(layers.rain.filter.frequency,levels.cutoff);target(layers.roof.gain.gain,levels.roof*.65);
  const leafDistance=Math.min(...[[-8,6],[8,-5],[8,8],[-12,-12],[15,-12],[-16,10]].map(([x,z])=>Math.hypot(camera.x-x,camera.z-z)));
  const leaves=(focus==='all'||focus==='rain')?r*.065*Math.max(0,1-leafDistance/10)*detailVolume:0;target(layers.leaves.gain.gain,leaves);
  const farLevel=(focus==='all'||focus==='hail'||focus==='details')?farHailEnergy*.24*detailVolume*(1-.25*s):0;target(layers.hailFar.gain.gain,farLevel,.2);stats.hailFarLevel=+farLevel.toFixed(4);
  stats.stems={hailFar:+farLevel.toFixed(4),rain:+levels.rain.toFixed(3),roof:+(levels.roof*.65).toFixed(3),leaves:+leaves.toFixed(3),wind:+levels.wind.toFixed(3)};target(layers.wind.gain.gain,levels.wind*gust);target(layers.wind.filter.frequency,550-clamp(snow)*200);
 }
 function snapshot(){
  stats.context=ctx?.state??'uninitialized';if(analyser&&ctx.state==='running'){analyser.getFloatTimeDomainData(samples);stats.rms=+Math.sqrt(samples.reduce((a,n)=>a+n*n,0)/samples.length).toFixed(5);}else stats.rms=0;
  return{...stats,volume,detailVolume,focus,blocked,activeDetails:detailVoices.size,activeThunder:voices.size,impactVariants:6,source:'CC0 rain/thunder + filtered ambience and varied synthesized contacts'};
 }
 function dispose(){disposed=true;clearTimeout(suspendTimer);abort.abort();if(ctx){for(const l of Object.values(layers??{}))l.source.stop();for(const v of voices)v.source.stop();for(const v of detailVoices)v.stop();void ctx.close();}enabled=false;}
 return{enable,mute,setVolume,setDetailVolume,setFocus,setBlocked,update,snapshot,dispose};
}
