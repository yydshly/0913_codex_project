// UI adaptation only. Upstream control IDs/values and rendering modules stay intact.
const $ = id => document.getElementById(id);
const preferenceKey = 'eanpa-research-language';
let lang = 'zh';
try { lang = localStorage.getItem(preferenceKey) === 'en' ? 'en' : 'zh'; } catch {}
const options = {
  skybox: ['地球', '轨道环世界 / Halo', '护盾世界（红巨星）'],
  'cloud-type': ['晴空', '积云', '层云', '高空卷云'],
  weather: ['无天气', '晴间多云', '太阳雨', '阴天', '降雨', '雷暴', '气旋', '暗黑风暴'],
  quality: ['高画质 — 目标 30+ 帧/秒', '均衡 — 目标 60+ 帧/秒', '性能优先 — 目标 120+ 帧/秒'],
  cyclespeed: ['60 秒', '120 秒', '300 秒'],
};
const originalOptions = Object.fromEntries(Object.keys(options).map(id => [id, [...$(id).options].map(o => o.textContent)]));
const staticPairs = {
  'Skybox':'天空环境', 'Cloud Type':'云层类型', 'Weather':'天气',
  'Time of day:':'时间：', 'h':'时', 'day/night cycle':'昼夜循环',
  'Quality':'画质', 'WebGPU N8AO':'环境遮蔽（N8AO）',
  'fps':'帧/秒',
};
const textNodes = [];
for (const element of [...$('panel').querySelectorAll('label'), $('meter')]) {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && staticPairs[node.textContent.trim()]) {
      textNodes.push({node,en:node.textContent,zh:` ${staticPairs[node.textContent.trim()]} `});
    }
  }
}
for (const id of ['skybox','cloud-type','weather','quality','tod']) {
  const label = $(id).previousElementSibling;
  if (label?.tagName === 'LABEL') label.htmlFor = id;
}
const originalControls = [...$('controls').childNodes].find(n=>n.nodeType===Node.TEXT_NODE && n.textContent.includes('WASD'));
const controlsEN = originalControls.textContent;
const controlsZH = 'WASD 移动 · Shift 奔跑 · 空格 跳跃 · 单击锁定视角 · Esc 释放 · 滚轮缩放 · F 手电筒 · ';
const pairs = [
  ['initializing WebGPU…','正在初始化 WebGPU…'],
  ['rigging Aletheia explorer hands…','正在准备第一人称角色…'],
  ['building the alluvial valley…','正在构建河谷地形…'],
  ['assembling the Eidoverse compound…','正在搭建建筑群…'],
  ['dressing rock, scree, and desert scrub…','正在布置岩石、碎石与灌木…'],
  ['planting SeedThree desert LODs…','正在加载沙漠植被…'],
  ['building skybox…','正在构建天空环境…'],
  ['loading weather engine…','正在加载天气引擎…'],
  ['preparing rain and cloud shadows…','正在准备降雨与云影…'],
  ['preparing sky reflections…','正在准备天空反射…'],
  ['preparing clouds…','正在准备云层…'],
  ['preparing distant sky geometry…','正在准备远景天体…'],
  ['preparing local reflections…','正在准备局部反射…'],
  ['preparing surface lighting and weather…','正在准备地表光照与天气…'],
  ['finishing lighting and the first frame…','正在完成光照与首帧渲染…'],
  ['⚡ test lightning strike','⚡ 测试闪电'],
  ['⚡ strike incoming ahead…','⚡ 前方即将落雷…'],
  ['⚡ needs stormy weather','⚡ 请先切换到雷暴天气'],
  ['flashlight off','手电筒已关闭'],['flashlight on','手电筒已开启'],
];
const weatherNames = ['None','Fair','Sunshower','Overcast','Rain','Storm','Cyclone','Dark Storm'];
const weatherZH = options.weather;
function translateDynamic(text, id) {
  let canonical = text;
  const pair = pairs.find(([en,zh]) => text === en || text === zh);
  if (pair) return pair[lang === 'zh' ? 1 : 0];
  if (id === 'weather-status') {
    for (let i=weatherNames.length-1;i>=0;i--) {
      if (canonical === weatherZH[i] || canonical.startsWith(weatherZH[i]+' ')) {
        canonical = weatherNames[i]+canonical.slice(weatherZH[i].length); break;
      }
    }
    canonical=canonical.replace(/(\d+) 秒$/, '$1s');
    if (lang==='en') return canonical;
    for (let i=weatherNames.length-1;i>=0;i--) {
      if (canonical===weatherNames[i] || canonical.startsWith(weatherNames[i]+' ')) {
        return (weatherZH[i]+canonical.slice(weatherNames[i].length)).replace(/(\d+)s$/, '$1 秒');
      }
    }
  }
  if (id==='stage') {
    const quality=$('quality').value;
    const names={high:['High / Insane','高画质'],balanced:['Balanced','均衡'],performance:['Performance','性能优先']};
    const fps={high:30,balanced:60,performance:120}[quality];
    return lang==='zh' ? `${names[quality][1]}：目标 ${fps}+ 帧/秒` : `${names[quality][0]}: ${fps}+ FPS target`;
  }
  if (id==='ms') return lang==='zh' ? text.replace(' ms',' 毫秒') : text.replace(' 毫秒',' ms');
  for(const [en,zh] of [['boot failed: ','启动失败：'],['skybox build failed: ','天空构建失败：']]) {
    if(text.startsWith(en)||text.startsWith(zh)) return (lang==='zh'?zh:en)+text.slice(text.startsWith(en)?en.length:zh.length);
  }
  return text;
}
const tools=document.createElement('div');
tools.className='research-tools';
tools.innerHTML='<button id="open-practice" type="button">实践与原理</button><select id="research-language" aria-label="界面语言 / Language"><option value="zh">中文</option><option value="en">English</option></select>';
$('panel').querySelector('h1').after(tools);
const labLink=document.createElement('a');labLink.id='open-lab';labLink.href='/lab/';labLink.textContent='进入轻量能力演示 ↗';labLink.style.cssText='display:block;margin:8px 0;color:#a8d9ee;font-size:12px';tools.after(labLink);
const dialog=document.createElement('dialog');
dialog.id='practice-dialog';
dialog.setAttribute('aria-labelledby','practice-dialog-title');
dialog.innerHTML='<header><strong id="practice-dialog-title">004 · 实践记录与原理</strong><button id="close-practice" type="button">返回演示</button></header><iframe id="practice-frame" title="实践记录"></iframe>';
document.body.append(dialog);
$('open-practice').addEventListener('click',()=>{
  const frame=$('practice-frame');
  if(!frame.src) frame.src=`/practice/?embedded=1&lang=${lang}`;
  else frame.contentWindow.postMessage({type:'eanpa-language',lang},location.origin);
  dialog.showModal();
});
$('close-practice').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{ if(event.target===dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); } });
const dynamicIDs=['boot','weather-status','stage','strike-test','flashlight-status','ms'];
function updateDynamic(id) {
  const element=$(id); if(!element) return;
  const translated=translateDynamic(element.textContent,id);
  if(element.textContent!==translated)element.textContent=translated;
}
function applyLanguage(next) {
  lang=next==='en'?'en':'zh'; document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  $('research-language').value=lang;
  for(const {node,en,zh} of textNodes)node.textContent=lang==='zh'?zh:en;
  for(const id of Object.keys(options)) [...$(id).options].forEach((o,i)=>{o.textContent=lang==='zh'?options[id][i]:originalOptions[id][i];});
  originalControls.textContent=lang==='zh'?controlsZH:controlsEN;
  $('controls').setAttribute('aria-label',lang==='zh'?'角色操作':'Player controls');
  $('open-practice').textContent=lang==='zh'?'实践与原理':'Practice & principles';
  $('open-lab').textContent=lang==='zh'?'进入轻量能力演示 ↗':'Open lightweight effects demo ↗';
  $('practice-dialog-title').textContent=lang==='zh'?'004 · 实践记录与原理':'004 · Practice & principles';
  $('close-practice').textContent=lang==='zh'?'返回演示':'Back to demo';
  $('practice-frame').title=lang==='zh'?'实践记录':'Practice journal';
  dynamicIDs.forEach(updateDynamic);
  if($('practice-frame').src)$('practice-frame').contentWindow.postMessage({type:'eanpa-language',lang},location.origin);
  try{localStorage.setItem(preferenceKey,lang);}catch{}
}
$('research-language').addEventListener('change',event=>applyLanguage(event.target.value));
for(const id of dynamicIDs)if($(id))new MutationObserver(()=>updateDynamic(id)).observe($(id),{childList:true,characterData:true,subtree:true});
applyLanguage(lang);
