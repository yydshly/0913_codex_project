// Runs before the WebGPU module graph. Illustration only; no GPU/assets required.
(()=>{
 const boot=document.getElementById('boot'),elapsed=document.getElementById('boot-elapsed');
 let lang='zh';try{lang=localStorage.getItem('eanpa-research-language')==='en'?'en':'zh';}catch{}
 document.documentElement.lang=lang==='en'?'en':'zh-CN';
 document.querySelectorAll('[data-zh]').forEach(el=>el.textContent=el.dataset[lang]);
 document.getElementById('language').value=lang;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{boot.dataset.previewVisibleMs=performance.now().toFixed(1);}));
 const updateElapsed=()=>{
  const seconds=Math.floor(performance.now()/1000);
  elapsed.textContent=document.documentElement.lang==='en'?`Elapsed ${seconds}s`:`已等待 ${seconds} 秒`;
 };
 updateElapsed();
 const timer=setInterval(()=>{if(boot.hidden)clearInterval(timer);else updateElapsed();},1000);
})();
