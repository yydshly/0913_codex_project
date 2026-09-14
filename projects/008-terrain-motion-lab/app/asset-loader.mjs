// Bound simultaneous downloads and reject stalled requests instead of waiting forever.
export function resilientTextureLoader(loader, {concurrency=3, attempts=3, timeoutMs=20000, onProgress=()=>{}}={}) {
  let active=0, completed=0, stopped=false;
  const queue=[];
  function attempt(url) {
    return new Promise((resolve,reject)=>{
      let settled=false;
      const timer=setTimeout(()=>{settled=true;reject(new Error('下载超时'));},timeoutMs);
      Promise.resolve().then(()=>loader.loadAsync(url)).then(texture=>{
        if(settled){texture.dispose?.();return;}
        settled=true;clearTimeout(timer);resolve(texture);
      },error=>{if(!settled){settled=true;clearTimeout(timer);reject(error);}});
    });
  }
  async function run(job) {
    let lastError;
    for(let n=1;n<=attempts&&!stopped;n++) {
      onProgress({completed,file:job.url.split('/').pop(),attempt:n});
      try {
        const texture=await attempt(job.url);
        if(stopped){texture.dispose?.();throw new Error('加载已停止');}
        completed++;onProgress({completed,file:job.url.split('/').pop(),attempt:n});
        job.resolve(texture);return;
      } catch(error){lastError=error;}
    }
    stopped=true;
    const error=new Error(`素材 ${job.url.split('/').pop()} 加载失败（${lastError?.message||'下载中断'}）`);
    job.reject(error);
    for(const waiting of queue.splice(0))waiting.reject(error);
  }
  function pump(){while(!stopped&&active<concurrency&&queue.length){active++;run(queue.shift()).finally(()=>{active--;pump();});}}
  return {loadAsync(url){return new Promise((resolve,reject)=>{
    if(stopped){reject(new Error('加载已停止'));return;}
    queue.push({url,resolve,reject});pump();
  });}};
}
