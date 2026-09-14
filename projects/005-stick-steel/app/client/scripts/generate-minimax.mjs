import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {parseEnv} from 'node:util';
import {narration,voices} from './minimax-cues.mjs';
import {buildWav,balancePcm,sampleRate} from './minimax-wav.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const config={...process.env};
for(const path of [resolve(root,'.env.local'),process.env.MINIMAX_ENV_FILE].filter(Boolean)){
 try{const values=parseEnv(await readFile(path,'utf8'));if(values.MINIMAX_API_BASE?.trim()&&!values.MINIMAX_TTS_URL?.trim())delete config.MINIMAX_TTS_URL;for(const [name,value] of Object.entries(values))if(name.startsWith('MINIMAX_')&&value.trim())config[name]=value.trim();}catch(e){if(e.code!=='ENOENT'||path===process.env.MINIMAX_ENV_FILE)throw new Error('无法读取指定的 MiniMax 配置文件。');}
}
const dry=process.argv.includes('--dry-run');
const model=config.MINIMAX_MODEL||'speech-2.8-hd';
const base=config.MINIMAX_API_BASE?.replace(/\/$/,'');
const endpoint=config.MINIMAX_TTS_URL||(base?(base.endsWith('/v1')?base+'/t2a_v2':base+'/v1/t2a_v2'):'https://api.minimax.cn/v1/t2a_v2');
const url=new URL(endpoint);
if(url.protocol!=='https:'||!['api.minimax.cn','api.minimaxi.com','api.minimax.io','api-bj.minimaxi.com','api-uw.minimax.io'].includes(url.hostname)||url.pathname!=='/v1/t2a_v2'||url.search||url.username||url.password)throw new Error('只允许 MiniMax 官方 HTTPS 语音端点。');
const key=config.MINIMAX_API_KEY;
const summary={provider:'MiniMax',model,stories:Object.entries(narration).map(([id,s])=>({id,duration:s.duration,lines:s.cues.length,characters:s.cues.reduce((n,c)=>n+c.text.length,0)}))};
console.log(JSON.stringify(summary,null,2));
if(dry){console.log('仅检查配音计划，未调用服务。');process.exit(0);}
if(!key){console.error('尚未配置 MINIMAX_API_KEY。请在本项目 .env.local 中设置；密钥不会发送到浏览器。');process.exit(2);}
const cache=resolve(root,'.cache/minimax'),out=resolve(root,'public/audio/stories');await mkdir(cache,{recursive:true});await mkdir(out,{recursive:true});
let manifest={provider:'MiniMax',status:'pending',stories:{}};
try{manifest=JSON.parse(await readFile(resolve(out,'manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
 for(const [id,story] of Object.entries(narration)){
  const clips=[],records=[];
  for(const [index,cue] of story.cues.entries()){
   const voice=config[`MINIMAX_VOICE_${cue.role.toUpperCase()}`]||voices[cue.role];
   let speed=Math.max(.96,Math.min(1.35,Number((cue.text.length/((cue.end-cue.start-.2)*4.8)).toFixed(2))));
   let audio,payload,digest;
   // At most one faster retry per overlong line. Cached successes avoid repeat billing.
   for(let attempt=0;attempt<2;attempt++){
    payload={model,text:cue.text,stream:false,language_boost:'Chinese',voice_setting:{voice_id:voice,speed,vol:1,pitch:0,emotion:'calm'},audio_setting:{sample_rate:sampleRate,format:'pcm',channel:1},output_format:'hex'};
    digest=hash(JSON.stringify(payload));const cached=resolve(cache,digest+'.pcm');
    try{audio=await readFile(cached);}catch(e){if(e.code!=='ENOENT')throw e;
     const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(90000)});
     if(!response.ok)throw new Error(`MiniMax HTTP ${response.status}，已停止；请检查额度、权限和端点地区。`);
     const result=await response.json();
     if(result.base_resp?.status_code!==0)throw new Error(`MiniMax 返回错误码 ${result.base_resp?.status_code??'unknown'}，已停止。`);
     const hex=result.data?.audio;
     if(typeof hex!=='string'||!hex.length||hex.length%4||!/^[0-9a-f]+$/i.test(hex))throw new Error('MiniMax 未返回有效 PCM 音频。');
     if(result.extra_info?.audio_sample_rate&&result.extra_info.audio_sample_rate!==sampleRate)throw new Error('返回采样率与请求不符。');
     audio=Buffer.from(hex,'hex');await writeFile(cached,audio);
    }
    const seconds=audio.length/2/sampleRate;
    if(seconds<=cue.end-cue.start-.08)break;
    if(attempt===1)throw new Error(`${id} 第 ${index+1} 句超出时段，未截断语音；请调整句子或时段。`);
    speed=Math.min(2,Number((speed*seconds/(cue.end-cue.start-.25)*1.05).toFixed(2)));
   }
   const balanced=balancePcm(audio);
   clips.push({start:cue.start,limit:cue.end,audio:balanced.audio});records.push({...cue,voice,speed,gain:balanced.gain,seconds:audio.length/2/sampleRate,sha256:digest});
   console.log(`${id} ${index+1}/${story.cues.length} 完成`);
  }
  const wav=buildWav(story.duration,clips),digest=hash(wav),file=`${id}.${digest.slice(0,12)}.wav`;
  await writeFile(resolve(out,file),wav);
  manifest.stories[id]={file,duration:story.duration,bytes:wav.length,sha256:digest,model,generatedAt:new Date().toISOString(),cues:records};
  manifest.status=Object.keys(narration).every(id=>manifest.stories[id])?'ready':'partial';
  const temp=resolve(out,'manifest.pending.json');await writeFile(temp,JSON.stringify(manifest,null,2)+'\n');
  const {rename}=await import('node:fs/promises');await rename(temp,resolve(out,'manifest.json'));
  console.log(`${id}：已写入与故事等长的配音文件。`);
 }
}catch(error){console.error(error instanceof Error?error.message:'生成失败');process.exitCode=1;}
