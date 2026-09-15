const $=id=>document.getElementById(id),frame=$('scene');
const stops={
 station:{kicker:'01 / 河谷车站',title:'屋顶下，藏着车站的另一面。',text:'站台朝向铁路线，候车室与值班室位于站房内。沿着檐口看过去，可以辨认入口、窗户和站台上的人物。',detail:'试着揭开屋顶，再合上。观察内部的隔间如何对应外面的门窗。人物目前不会进入站房。',view:'station'},
 bridge:{kicker:'02 / 跨河拱桥',title:'一段弯道，把两岸连在一起。',text:'铁路沿地形延伸，在河道上方由拱桥承托。近看桥墩与桥面，再沿轨道看向两岸，理解这条线路怎样穿过河谷。',detail:'这是风格化的场景结构展示，没有进行真实桥梁的工程验算。可继续场景，观察列车沿轨道运动。',view:'bridge'},
 river:{kicker:'03 / 层叠河岸',title:'从林间的水面，看到落差与岸线。',text:'水面经过连续的高低落差，在树木和岩岸之间形成层次。近处看水纹和跌水，远处看河道与铁路的关系。',detail:'可在同一机位比较春日与秋日。植被和光线随季节变化；这里没有模拟真实流域的水文过程。',view:'waterfall'}
};
let doc,ready=false,observer,timer,active='overview',opened=false;
function revealScene(){const stage=document.querySelector('.stage');if(stage.getBoundingClientRect().top < -40)stage.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
const click=id=>{const control=doc?.getElementById(id);if(!control)throw Error('场景接口缺失：'+id);control.click();};
function check(id,value){const control=doc.getElementById(id);control.checked=value;control.dispatchEvent(new Event('change',{bubbles:true}));}
function camera(name){const control=doc.getElementById('camera-view');control.value=name;control.dispatchEvent(new Event('change',{bubbles:true}));}
function sync(){if(!ready)return;opened=doc.getElementById('station-cutaway').checked;$('roof').setAttribute('aria-pressed',String(opened));$('roof').innerHTML=opened?'合上屋顶，看看外观 <span>↙</span>':'揭开屋顶，看看站房 <span>↗</span>';const paused=doc.getElementById('pause').getAttribute('aria-pressed')==='true';$('pause').textContent=paused?'继续':'暂停';$('pause').setAttribute('aria-pressed',String(paused));}
function selected(id){active=id;document.querySelectorAll('[data-stop]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stop===id)));}
function story(id){const stop=stops[id];selected(id);$('story-kicker').textContent=stop.kicker;$('story-title').textContent=stop.title;$('story-text').textContent=stop.text;$('story-detail').textContent=stop.detail;}
function go(id){story(id);if(!ready){$('status').textContent='可先阅读看点；场景就绪后即可近看。';return;}check('station-cutaway',false);if(id==='station')click('inspect-station');else camera(stops[id].view);sync();revealScene();$('status').textContent='正在近看'+stops[id].kicker.split('/ ')[1]+'。可拖动自由观察，或返回全景。';}
function overview(){selected('overview');$('story-kicker').textContent='先认识整体';$('story-title').textContent='山、水与铁路，围绕车站展开。';$('story-text').textContent='先看看整片河谷，再选择一个看点。铁路沿河岸转弯，经过拱桥和车站；树木与水面之间留出了活动空间。';$('story-detail').textContent='这是可以自由观察的实时场景。三个看点会带你到不同的位置，随时可以回到全景。';if(ready){check('station-cutaway',false);click('reset-view');sync();$('status').textContent='已返回全景。';}}
document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>go(b.dataset.stop));
$('overview').onclick=overview;$('pause').onclick=()=>{click('pause');sync();$('status').textContent=$('pause').textContent==='继续'?'场景已暂停，仍可环顾。':'场景继续运行。';};
$('roof').onclick=()=>{if(!ready)return;if(opened){check('station-cutaway',false);$('status').textContent='屋顶已合上，保持当前机位比较外观。';}else{story('station');if(doc.getElementById('pause').getAttribute('aria-pressed')!=='true')click('pause');click('station-room-focus');$('status').textContent='屋顶已揭开，场景暂停：观察候车室与值班室。';}sync();revealScene();};
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{if(!ready)return;doc.getElementById('season-fixed-view').checked=false;doc.getElementById('season-lighting').checked=true;doc.querySelector('[data-season="'+b.dataset.season+'"]').click();document.querySelectorAll('[data-season]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));revealScene();$('status').textContent='正在切换至'+b.textContent+'，保留当前机位，稍候观察植被与光线。';});
function fail(message){ready=false;clearTimeout(timer);observer?.disconnect();$('loading').hidden=true;$('failure').hidden=false;$('failure-note').textContent=message;for(const b of document.querySelectorAll('.view-tools button,.interaction button'))b.disabled=true;$('status').textContent='场景未就绪，文字看点仍可阅读。';}
function connect(){try{doc=frame.contentDocument;if(!doc?.getElementById('world'))return fail('没有找到场景文件。请重新准备本地场景后重试。');
 const inspect=()=>{if(doc.getElementById('error')&&!doc.getElementById('error').hidden)return fail('三维场景启动失败。可重试或查看场景图片。');if(doc.documentElement.dataset.ready!=='true')return;observer?.disconnect();clearTimeout(timer);ready=true;doc.getElementById('season-fixed-view').checked=false;doc.getElementById('season-lighting').checked=true;doc.querySelector('[data-season="spring"]').click();$('loading').hidden=true;$('failure').hidden=true;for(const b of document.querySelectorAll('.view-tools button,.interaction button'))b.disabled=false;sync();$('status').textContent='河谷已展开。选择一个看点，或先自由环顾。';if(active!=='overview')go(active);};
 observer=new MutationObserver(inspect);observer.observe(doc.documentElement,{attributes:true,subtree:true,attributeFilter:['data-ready','hidden']});inspect();
 }catch{fail('无法连接本地场景，请从本地服务器打开。');}}
frame.addEventListener('load',connect);
function timeout(){clearTimeout(timer);timer=setTimeout(()=>{if(!ready)fail('场景准备时间较长。可重新打开，或先查看图片与看点说明。');},60000);}
$('retry').onclick=()=>{ready=false;observer?.disconnect();$('failure').hidden=true;$('loading').hidden=false;timeout();frame.src='valley-runtime/scene.html';};timeout();
if(frame.contentDocument?.documentElement.dataset.ready==='true')connect();
window.addEventListener('pagehide',()=>{clearTimeout(timer);observer?.disconnect();frame.remove();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
