import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWav,balancePcm,sampleRate} from '../scripts/minimax-wav.mjs';
import {narration,voices} from '../scripts/minimax-cues.mjs';

test('all narration slots are ordered, non-overlapping and inside their story',()=>{
  for(const story of Object.values(narration)){let end=0;for(const cue of story.cues){assert.ok(cue.start>=end);assert.ok(cue.end>cue.start);assert.ok(cue.end<=story.duration);assert.ok(voices[cue.role]);assert.ok(cue.text.length);end=cue.end;}}
  assert.equal(Object.values(narration).reduce((n,s)=>n+s.cues.length,0),20);
});
test('WAV preserves exact story duration and silence between dialogue clips',()=>{
  const speech=Buffer.alloc(sampleRate*2);speech.writeInt16LE(12345,0);
  const wav=buildWav(3,[{start:1,limit:2,audio:speech}]);
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),sampleRate);
  assert.equal(wav.readUInt32LE(40),3*sampleRate*2);assert.equal(wav.readUInt16LE(22),1);
  assert.ok(wav.subarray(44,44+sampleRate*2).every(v=>v===0));
  assert.equal(wav.readInt16LE(44+sampleRate*2),12345);
});
test('overlong or overlapping speech is rejected rather than cut off',()=>{
  assert.throws(()=>buildWav(2,[{start:1,limit:2,audio:Buffer.alloc(sampleRate*4)}]),/超出/);
  assert.throws(()=>buildWav(3,[{start:0,limit:2,audio:Buffer.alloc(sampleRate*4)},{start:1,limit:3,audio:Buffer.alloc(4)}]),/超出/);
});
test('invalid PCM cannot be published as a successful voice track',()=>{
  assert.throws(()=>buildWav(1,[{start:0,limit:1,audio:Buffer.alloc(3)}]),/PCM/);
  assert.throws(()=>buildWav(1,[{start:0,limit:1,audio:Buffer.alloc(0)}]),/PCM/);
});
test('voice balancing raises quiet dialogue without clipping peaks or changing duration',()=>{
  const input=Buffer.alloc(1000);for(let i=0;i<input.length;i+=2)input.writeInt16LE(i===0?15000:700,i);
  const output=balancePcm(input);assert.ok(output.gain>1);assert.equal(output.audio.length,input.length);assert.ok(output.audio.readInt16LE(0)<=30000);
  assert.throws(()=>balancePcm(Buffer.alloc(100)),/静音/);
});
