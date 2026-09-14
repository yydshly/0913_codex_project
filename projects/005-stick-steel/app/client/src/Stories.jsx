import {useEffect,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,ArrowUpRight,ChevronRight,Maximize2,Minimize2,Subtitles,Volume2,VolumeX} from 'lucide-react';
import {stories,storyFrame} from '../lib/story/script';
import './stories.css';
import {useStoryAudio} from './useStoryAudio';
const clock=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
function Theater({story}){
  const host=useRef(null),engine=useRef(null),timeline=useRef(0),run=useRef(false);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[started,setStarted]=useState(false),[close,setClose]=useState(false),[captions,setCaptions]=useState(true),[speed,setSpeed]=useState(1);
  const speedRef=useRef(1);speedRef.current=speed;
  const voice=useStoryAudio(story.id),voiceRef=useRef(voice);voiceRef.current=voice;
  const [audioError,setAudioError]=useState(false);
  const playable=ready&&voice.state!=='loading';
  const frame=storyFrame(story.id,time),ended=time>=story.duration;
  const play=value=>{run.current=value;setPlaying(value);setAudioError(false);if(value){const pending=voice.start(timeline.current,speedRef.current);pending?.catch(e=>{if(run.current&&e.name!=='AbortError'){run.current=false;setPlaying(false);setAudioError(true);}});}else {voice.pause();if(voice.available.current){const t=Math.min(story.duration,voice.position());timeline.current=t;engine.current?.render(t);setTime(t);}}};
  const seek=value=>{const t=Math.max(0,Math.min(story.duration,value));timeline.current=t;voice.seek(t);engine.current?.render(t);setTime(t);setStarted(true);if(t===story.duration)play(false);};
  const toggle=()=>{if(!playable)return;if(ended)seek(0);setStarted(true);play(!run.current);};
  useEffect(()=>{
    let disposed=false,scene,raf,last=performance.now(),lastUI=0;
    const init=async()=>{try{const {createStoryScene}=await import('../lib/story/scene');if(disposed)return;scene=createStoryScene(host.current,story.id);engine.current=scene;setReady(true);
      const tick=now=>{if(disposed)return;const delta=Math.min((now-last)/1000,.1);last=now;if(run.current&&!document.hidden){timeline.current=Math.min(story.duration,voiceRef.current.available.current?voiceRef.current.position():timeline.current+delta*speedRef.current);scene.render(timeline.current);if(timeline.current>=story.duration){run.current=false;voiceRef.current.pause();setPlaying(false);}if(now-lastUI>80||!run.current){setTime(timeline.current);lastUI=now;}}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
    }catch(e){console.error(e);if(!disposed)setError('画面未能加载，请重新加载页面。');}};
    init();const visibility=()=>{if(document.hidden){run.current=false;voiceRef.current.pause();setPlaying(false);}};document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;run.current=false;voiceRef.current.pause();cancelAnimationFrame(raf);scene?.dispose();engine.current=null;document.removeEventListener('visibilitychange',visibility);};
  },[story.id]);
  const chapter=story.chapters[frame.chapter];
  return <>
    <div className="story-theater" aria-label={story.title+'故事播放器'} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.code==='ArrowRight')seek(time+5);if(e.code==='ArrowLeft')seek(time-5);}} tabIndex={0}>
      <div className="story-canvas" ref={host}/>
      <div className="story-scene-heading"><span>{story.category}</span><div><i/>{String(frame.chapter+1).padStart(2,'0')}<b>/</b>{chapter[0]}</div></div>
      <div className="story-cast"><span className="red-dot"/>{story.id==='father'?'父亲':story.id==='dinner'?'他':'同事'}<span className="blue-dot"/>{story.id==='father'?'孩子':story.id==='dinner'?'她':'新同事'}</div>
      {!ready&&<div className="story-cover"><p>{error||'正在布置故事里的那一天…'}</p></div>}
      {playable&&!started&&<button className="story-start" onClick={toggle}><Play size={20} fill="currentColor"/><span>开始观看<small>{story.duration} 秒 · {voice.state==='ready'?'MiniMax 配音':'字幕短剧'}</small></span></button>}
      {ready&&ended&&<div className="story-end"><span>故事停在这里，生活继续。</span><button onClick={()=>{seek(0);play(true);}}><RotateCcw size={15}/>再看一遍</button></div>}
      {captions&&started&&!ended&&<p className="story-caption" aria-live={playing?'off':'polite'}>{frame.subtitle}</p>}
      {!started&&ready&&<p className="story-opening">{story.intro}</p>}
      <span className="story-scene-number">STORIES OF US / {story.number}</span>
    </div>
    <div className="story-player">
      <div className="story-playback"><button className="story-play" aria-label={playing?'暂停故事':ended?'重新播放故事':'播放故事'} disabled={!playable} onClick={toggle}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button aria-label="从头开始" disabled={!ready} onClick={()=>{seek(0);play(false);}}><RotateCcw size={16}/></button><span className="story-time">{clock(time)}<i>/ {clock(story.duration)}</i></span><input aria-label="故事进度（秒）" type="range" min="0" max={story.duration} step=".1" value={time} disabled={!ready} onChange={e=>seek(Number(e.target.value))} style={{'--progress':`${time/story.duration*100}%`}}/><label className="story-speed"><span className="sr-only">播放速度</span><select value={speed} onChange={e=>{const rate=Number(e.target.value);setSpeed(rate);voice.rate(rate);}}><option value=".5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><button aria-label={captions?'隐藏字幕':'显示字幕'} aria-pressed={captions} onClick={()=>setCaptions(!captions)}><Subtitles size={18}/></button><button aria-label={close?'恢复全景':'拉近镜头'} aria-pressed={close} disabled={!ready} onClick={()=>{setClose(!close);engine.current?.setClose(!close);}}>{close?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div>
      <div className="story-sound"><span>{audioError?'声音未能启动，请再次点击播放。':voice.state==='ready'?'MiniMax · 旁白与人物对白':voice.state==='loading'?'正在准备声音…':voice.state==='pending'?'MiniMax 配音尚未生成':'配音加载失败，请刷新页面重试。'}</span><button disabled={voice.state!=='ready'} aria-label={voice.muted?'开启配音':'静音配音'} aria-pressed={!voice.muted&&voice.state==='ready'} onClick={()=>voice.setMuted(!voice.muted)}>{voice.muted||voice.state!=='ready'?<VolumeX size={16}/>:<Volume2 size={16}/>}</button><input aria-label="配音音量" type="range" min="0" max="1" step=".05" disabled={voice.state!=='ready'} value={voice.volume} onChange={e=>voice.setVolume(Number(e.target.value))}/></div>
      <div className="story-chapters">{story.chapters.map(([title,at,desc],i)=><button key={title} disabled={!ready} aria-current={frame.chapter===i?'step':undefined} onClick={()=>seek(at)}><span>0{i+1}<i>{clock(at)}</i></span><strong>{title}<ChevronRight size={14}/></strong><p>{desc}</p></button>)}</div>
    </div>
    <div className="story-footnote"><p>{story.note}</p><span>可暂停、拖动时间轴，或点击章节观看。</span></div>
  </>;
}
export function Stories(){
  const initial=location.hash.slice(1);const [id,setId]=useState(stories.some(s=>s.id===initial)?initial:'father');
  const story=stories.find(s=>s.id===id);
  useEffect(()=>{document.title=story.title+' · 人物故事 · 005';},[id]);
  useEffect(()=>{const change=()=>{const next=location.hash.slice(1);if(stories.some(s=>s.id===next))setId(next);};addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  return <main className="stories-page">
    <header className="stories-header"><a href="?view=stories" className="stories-brand"><span>005</span><i>/</i> STICK & STEEL</a><a href="?view=characters">人物怎么刻画？看表演对照<ArrowUpRight size={14}/></a></header>
    <section className="stories-intro"><div><p>STORIES OF US</p><h1>那些没说出口的话。</h1></div><p>用一个停顿、一次回头、半步的距离，<br/>讲一段关于我们的故事。</p></section>
    <nav className="stories-nav" aria-label="人物故事选择">{stories.map(s=><button key={s.id} aria-pressed={s.id===id} onClick={()=>{setId(s.id);history.replaceState(null,'','#'+s.id);}}><span>{s.number}</span><div><strong>{s.title}</strong><small>{s.category} <i>·</i> {s.duration} 秒</small></div><ArrowUpRight size={17}/></button>)}</nav>
    <Theater key={story.id} story={story}/>
    <footer className="stories-footer"><span>人物表演实验 · 第一辑</span><p>三个原创生活片段 · 实时三维演出</p><details><summary>关于这次尝试</summary><p>复用关节 IK 与手部几何，新增人物动作编排、视线、年龄比例和叙事时间轴。这里的表演按预设节奏运行，可以重复观看；尚未提供自由输入故事或视频导出。</p></details></footer>{import.meta.env.PROD&&<p style={{fontSize:12,padding:'12px 0'}}><a href="../" style={{color:'#875146'}}>← 研究摘要、效果导览与扩展路线</a></p>}
  </main>;
}
