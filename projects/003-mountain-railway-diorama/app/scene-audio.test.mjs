import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneAudio} from './scene-audio.mjs';

test('播报每站各一次，暂停和分类关闭停止声音，重新停站才再播放',async t=>{
 const clips=[];
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 const node=()=>({gain:param(),pan:param(),frequency:param(),connect(next){return next},disconnect(){},start(){},stop(){}});
 class AudioContext{
  sampleRate=32;currentTime=0;state='suspended';destination=node();
  createGain=node;createStereoPanner=node;createBiquadFilter=node;createDynamicsCompressor=node;createOscillator=node;
  createAnalyser(){return {...node(),getFloatTimeDomainData(a){a.fill(.1)}};}
  createBuffer(){return {getChannelData:()=>new Float32Array(96)}}
  createBufferSource(){const n=node();n.start=()=>{if(!n.loop)clips.push(n)};n.stop=()=>n.stopped=true;return n;}
  async decodeAudioData(data){return {data}}
  async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){this.state='closed'}
 }
 t.mock.method(globalThis,'fetch',async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)}));
 const old=globalThis.AudioContext;globalThis.AudioContext=AudioContext;t.after(()=>{if(old===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=old;});
 const audio=createSceneAudio();await audio.setEnabled(true);assert.equal(audio.voiceStatus,'MiniMax 播报已加载');
 const base={distance:8,waterDistance:20,wind:.4,rain:0,flow:1,speed:0,stops:1,stage:5,boarding:'开门',dwell:10};
 audio.update(base);audio.update({...base,boarding:'上下客'});assert.equal(clips.length,1);assert.equal(audio.voicePlaying,true);
 audio.update({...base,boarding:'确认发车'});assert.equal(clips.length,2);assert.equal(clips[0].stopped,true);
 audio.update({...base,boarding:'确认发车',paused:true});assert.equal(audio.voicePlaying,false);
 audio.update({...base,boarding:'确认发车'});assert.equal(clips.length,2);
 audio.setCategory('voice',false);audio.update({...base,stops:2});assert.equal(clips.length,2);
 audio.setCategory('voice',true);audio.update({...base,stops:2});assert.equal(clips.length,3);
 audio.update({...base,stops:2,hidden:true});assert.equal(audio.voicePlaying,false);
 await audio.setEnabled(false);assert.equal(audio.status,'suspended');await audio.dispose();
});
