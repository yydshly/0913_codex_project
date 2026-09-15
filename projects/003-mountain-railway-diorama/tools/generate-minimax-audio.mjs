import fs from 'node:fs/promises';import path from 'node:path';import{fileURLToPath}from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const envPath=process.argv[2];if(!envPath)throw Error('请指定本机 .env.minimax 路径；不要将密钥放入 app/。');
const settings={};for(const line of(await fs.readFile(envPath,'utf8')).split(/\r?\n/)){const m=line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m)settings[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}
if(!settings.MINIMAX_API_KEY)throw Error('指定文件缺少 MINIMAX_API_KEY');
const endpoint=new URL(settings.MINIMAX_API_BASE||'https://api.minimax.cn');
if(endpoint.protocol!=='https:'||!['api.minimax.cn','api.minimax.io','api.minimaxi.com','api-bj.minimaxi.com'].includes(endpoint.hostname))throw Error('请使用 MiniMax 官方 HTTPS API 地址');
endpoint.pathname='/v1/t2a_v2';endpoint.search='';
const output=path.join(root,'assets','audio');await fs.mkdir(output,{recursive:true});
const clips=[{id:'arrival',text:'白鹭河站到了。列车已停稳，请先下后上，留意脚下的台阶。'},{id:'departure',text:'车门即将关闭，请站在安全线内。祝您旅途愉快。'}];
const manifest={provider:'MiniMax',model:'speech-2.8-hd',voice:'male-qn-qingse',generatedAt:new Date().toISOString(),source:'https://platform.minimax.cn/docs/api-reference/speech-t2a-http',clips:[]};
for(const clip of clips){const target=path.join(output,clip.id+'.mp3');try{await fs.access(target);throw Error('文件已存在，避免重复计费：'+clip.id);}catch(e){if(e.code!=='ENOENT')throw e;}
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+settings.MINIMAX_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:manifest.model,text:clip.text,stream:false,voice_setting:{voice_id:manifest.voice,speed:.94,vol:1,pitch:-1},audio_setting:{sample_rate:32000,bitrate:128000,format:'mp3',channel:1},output_format:'hex'}),signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw Error('MiniMax 请求失败 HTTP '+response.status);const result=await response.json();if(result.base_resp?.status_code!==0)throw Error('MiniMax 生成失败，状态码 '+result.base_resp?.status_code);const hex=result.data?.audio;if(!hex||!/^[a-f0-9]+$/i.test(hex)||hex.length%2)throw Error('返回音频无效');const data=Buffer.from(hex,'hex');if(data.length<1000)throw Error('音频过短');await fs.writeFile(target,data);manifest.clips.push({...clip,file:clip.id+'.mp3',bytes:data.length,durationMs:result.extra_info?.audio_length});console.log(clip.id+': '+data.length+' bytes');
 await fs.writeFile(path.join(output,'minimax-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
