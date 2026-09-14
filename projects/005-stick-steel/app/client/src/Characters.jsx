import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Play,Pause,RotateCcw,Users,UserRound,ScanLine,Eye} from 'lucide-react';
import {characters,duration,performanceBeat} from '../lib/character/script';
import './stories.css';
import './characters.css';

export function Characters(){
  const initial=location.hash.slice(1);
  const [id,setId]=useState(characters.some(c=>c.id===initial)?initial:'zhou');
  const [compare,setCompare]=useState(false),[simple,setSimple]=useState(false),[time,setTime]=useState(9.5),[playing,setPlaying]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[speed,setSpeed]=useState(1),[started,setStarted]=useState(false);
  const host=useRef(null),engine=useRef(null),position=useRef(9.5),running=useRef(false),rate=useRef(1);
  const selected=characters.find(c=>c.id===id),beat=performanceBeat(time);
  const options=useRef({id,compare,simple});options.current={id,compare,simple};rate.current=speed;
  const pause=()=>{running.current=false;setPlaying(false);};
  const seek=t=>{position.current=Math.max(0,Math.min(duration,t));engine.current?.render(position.current);setTime(position.current);setStarted(true);if(position.current>=duration)pause();};
  const toggle=()=>{if(!ready)return;if(!started||position.current>=duration)seek(0);running.current=!running.current;setPlaying(running.current);setStarted(true);};
  useEffect(()=>{
    let disposed=false,scene,raf,last=performance.now(),lastUI=0;
    import('../lib/character/scene').then(({createCharacterScene})=>{
      if(disposed)return;scene=createCharacterScene(host.current);engine.current=scene;
      const o=options.current;scene.configure(o.id,o.compare,o.simple);scene.render(position.current);setReady(true);
      const tick=now=>{const dt=Math.min(.1,(now-last)/1000);last=now;if(running.current){position.current=Math.min(duration,position.current+dt*rate.current);scene.render(position.current);if(position.current===duration){running.current=false;setPlaying(false);}if(now-lastUI>65||!running.current){setTime(position.current);lastUI=now;}}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
    }).catch(e=>{console.error(e);if(!disposed)setError('画面未能加载，请刷新后重试。');});
    const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;cancelAnimationFrame(raf);scene?.dispose();engine.current=null;document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{engine.current?.configure(id,compare,simple);},[id,compare,simple]);
  useEffect(()=>{document.title='让人物有自己的样子 · 人物表演 · 005';const onHash=()=>{const next=location.hash.slice(1);if(characters.some(c=>c.id===next))setId(next);};addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash);},[]);
  const choose=next=>{setId(next);history.replaceState(null,'','#'+next);};
  return <main className="stories-page characters-page">
    <header className="stories-header"><a href="?view=capabilities" className="stories-brand"><span>005</span><i>/</i> STICK & STEEL</a><nav><a href="?view=stories">观看人物故事<ArrowUpRight size={14}/></a><a href="?view=capabilities">可复用能力<ArrowUpRight size={14}/></a></nav></header>
    <section className="stories-intro"><div><p>CHARACTER STUDIES / 01</p><h1>让人物有自己的样子。</h1></div><p>同一扇门，同一个等候的人。<br/>四种进入生活的方式。</p></section>
    <nav className="character-nav" aria-label="选择人物">{characters.map((c,i)=><button key={c.id} style={{'--character-color':c.color}} aria-pressed={id===c.id} onClick={()=>choose(c.id)}><span>0{i+1}</span><div><strong>{c.name}</strong><small>{c.age}</small><em>{c.tag}</em></div></button>)}</nav>
    <div className="character-toolbar"><p><b>表演题目</b> 进门 → 回应 → 坐到对方身边 <span>24 秒</span></p><div><button disabled={!ready} aria-pressed={compare} onClick={()=>setCompare(!compare)}>{compare?<UserRound size={15}/>:<Users size={15}/>} {compare?'单人细看':'四人同步对照'}</button><button disabled={!ready} aria-pressed={simple} onClick={()=>setSimple(!simple)}>{simple?<Eye size={15}/>:<ScanLine size={15}/>} {simple?'恢复完整形象':'去掉外形，只看动作'}</button></div></div>
    <section className={'character-workbench'+(compare?' is-comparing':'')}>
      <div className="character-stage" tabIndex={0} aria-label="人物表演播放器" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.code==='ArrowRight'){e.preventDefault();seek(position.current+1);}if(e.code==='ArrowLeft'){e.preventDefault();seek(position.current-1);}}}>
        <div className="character-canvas" ref={host}/>
        {!ready&&<div className="story-cover">{error||'正在准备人物表演…'}</div>}
        {compare?<div className="character-panel-labels">{characters.map(c=><div key={c.id}><b>{c.name}</b><span>{c.tag}</span></div>)}</div>:<><div className="character-scene-label"><span>{simple?'动作对照':'人物表演'}</span><strong>{selected.name}<small>{selected.age}</small></strong></div><span className="character-guest">浅灰色人物 · 正在等你的人</span></>}
        <div className="character-scene-bottom"><span>{simple?'外形已统一 · 动作保持原样':'原创人物 · 实时三维表演'}</span><b>{time>=duration?'表演结束':playing?'正在播放':'已暂停'} · {time.toFixed(1)}s</b></div>
      </div>
      <aside className="character-notes" style={{'--character-color':selected.color}}><p>人物小传 / {selected.name}</p><h2>{selected.tag}</h2><dl><dt>一眼识别</dt><dd>{selected.look}</dd><dt>动作习惯</dt><dd>{selected.motion}</dd><dt>与人相处</dt><dd>{selected.relation}</dd></dl><div className="character-live-note"><span>此刻看哪里 · 0{beat+1}</span><p>{selected.beats[beat]}</p></div></aside>
    </section>
    <div className="story-playback character-playback"><button className="story-play" aria-label={playing?'暂停人物表演':'播放人物表演'} disabled={!ready} onClick={toggle}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button disabled={!ready} aria-label="人物表演从头开始" onClick={()=>{seek(0);pause();}}><RotateCcw size={17}/></button><span className="story-time">{Math.floor(time).toString().padStart(2,'0')}<i>/ 24 秒</i></span><input aria-label="人物表演进度（秒）" type="range" min="0" max={duration} step=".1" value={time} disabled={!ready} onChange={e=>seek(Number(e.target.value))} style={{'--progress':`${time/duration*100}%`}}/><label><span className="sr-only">人物表演速度</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value=".5">0.5× 慢看</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label></div>
    <div className="character-observe"><p><b>{simple?'现在只看动作。':'先看形象，再看动作。'}</b> {simple?'发型、眼镜、衣服、包与角色颜色已去掉；切换人物，比较同一时刻的姿态。':'点击“四人同步对照”一起播放，再去掉外形，观察停顿、招手和落座的差别。'}</p></div>
    <div className="story-chapters character-chapters">{['走进来','回应对方','落座以后'].map((title,i)=><button key={title} disabled={!ready} aria-current={beat===i?'step':undefined} onClick={()=>{seek([3,10,21.5][i]);pause();}}><span>0{i+1}<i>{['00–08 秒','08–14 秒','14–24 秒'][i]}</i></span><strong>{title}</strong><p>{compare?['比较起步前的等待、步幅与摆臂。','比较先看、先点头，还是先招手。','比较落座速度，以及还会不会靠近。'][i]:selected.beats[i]}</p></button>)}</div>
    <section className="character-meaning"><div><span>为什么这样刻画</span><h2>年龄与性别是背景，<br/>习惯让人物成为自己。</h2></div><div><p>周岚与唐悦都是老年女性：一个端正克制，一个热情主动。女性形象不必统一用裙子，老年形象也不必统一用驼背或拐杖。这四位是具体的虚构人物，并不代表某一类人。</p><p><b>{selected.name}还可以走进的故事：</b>{selected.next}</p></div></section>
    <footer className="stories-footer"><span>人物表演实验 · 第二辑</span><p>本页以无声表演观察形象与动作；已有故事保留 MiniMax 配音。</p><details><summary>可复用的部分与边界</summary><p>四份外形配置、可拖动的动作时间轴、视线与姿态控制、同屏对照，可用于后续系列故事。复用既有关节 IK 与手部几何，人物造型与动作编排为本项目新增。当前没有自动生成角色、服装物理或口型同步。</p></details></footer>
  </main>;
}
