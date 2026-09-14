import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const shapeNames = ['圆形', '星芒', '方形'];
const shapePoints = [0, 1, 2].map(shape => Array.from({ length: 24 }, (_, i) => {
  const angle = i * Math.PI / 12 - Math.PI / 2;
  const c = Math.cos(angle), s = Math.sin(angle);
  const radius = shape === 1 && i % 2 ? 43 : 78;
  const x = shape === 2 ? Math.sign(c) * Math.pow(Math.abs(c), .35) * 68 : c * radius;
  const y = shape === 2 ? Math.sign(s) * Math.pow(Math.abs(s), .35) * 68 : s * radius;
  return `${(110+x).toFixed(3)},${(110+y).toFixed(3)}`;
}).join(' '));
const gallery = [
  ['风景', '把目光交给远方。', 'LANDSCAPE'],
  ['建筑', '在结构里发现秩序。', 'ARCHITECTURE'],
  ['色彩', '让感受先于语言。', 'COLOR STUDY'],
];
const drawingPaths = [
  'M40 180 V84 C40 3 180 3 180 84 V180',
  'M62 180 V85 C62 31 158 31 158 85 V180',
  'M110 44 V180 M62 114 H158',
  'M22 199 H198 M32 189 H188 M40 180 H180',
  'M81 88 C81 62 139 62 139 88 V157 H81 Z',
  'M96 141 L107 127 L121 145 L130 132',
];

export function ShapeStudy({ mode, demo }) {
  const root = useRef(null), actions = useRef({});
  const [selected, setSelected] = useState(0), [running, setRunning] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    const element = root.current;
    const ctx = gsap.context(() => {}, element);
    let animation, index = 0;
    setSelected(0); setRunning(false);
    ctx.add('select', next => {
      animation?.kill();
      index = next; setSelected(next);
      const panels = element.querySelectorAll('.gallery-panel');
      animation = gsap.timeline().to(panels, { flexGrow: i => i === next ? 4 : 1, duration: .7, ease: 'power3.inOut', overwrite: true }, 0)
        .fromTo(panels[next].querySelector('.gallery-detail'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, .25);
    });
    ctx.add('play', () => {
      animation?.kill();
      if (mode === 'draw') {
        setRunning(true);
        animation = gsap.timeline({onComplete:()=>setRunning(false)})
          .fromTo(element.querySelectorAll('.drawing-stroke'), {strokeDashoffset:100},
            {strokeDashoffset:0,duration:1.3,stagger:.24,ease:'power2.inOut'},0)
          .fromTo(element.querySelector('.drawing-wash'),{opacity:0},{opacity:.55,duration:1},1.5);
      } else if (mode === 'corridor') {
        setRunning(true);
        const frames = element.querySelectorAll('.corridor-frame');
        animation = gsap.timeline({onComplete:()=>setRunning(false)})
          .fromTo(frames,{z:i=>-i*85,opacity:1},{z:i=>260-i*85,duration:2.5,ease:'power2.in'},0)
          .to(frames,{opacity:0,duration:.25},2.25)
          .set(frames,{z:i=>-i*85})
          .to(frames,{opacity:1,duration:.5,ease:'power2.out'});
      } else if (mode === 'kaleido') {
        index=(index+1)%3; setSelected(index);
        animation=gsap.timeline()
          .to(element.querySelector('.kaleido-outer'),{rotation:index*40,svgOrigin:'110 110',duration:1.8,ease:'power3.inOut'},0)
          .to(element.querySelector('.kaleido-inner'),{rotation:-index*60,scale:[1,.7,1.2][index],svgOrigin:'110 110',duration:1.8,ease:'power3.inOut'},0)
          .to(element.querySelectorAll('.kaleido-petal'),{scaleY:[1,.65,.88][index],svgOrigin:'110 110',fill:['#c48799','#ccab76','#89b7ae'][index],duration:1.8,ease:'power3.inOut'},0);
      } else if (mode === 'morph') {
        index = (index+1)%3; setSelected(index);
        animation = gsap.to(element.querySelector('.morph-shape'), { attr: { points: shapePoints[index] },
          fill: ['#837fa9', '#cb8968', '#6b9383'][index], duration: 1.25, ease: 'power3.inOut', overwrite: true });
      } else if (mode === 'galaxy') {
        setRunning(true);
        animation = gsap.timeline({ onComplete: () => setRunning(false) });
        element.querySelectorAll('.satellite-orbit').forEach((orbit, i) => {
          animation.fromTo(orbit, { rotation: i*110, svgOrigin: '110 110' },
            { rotation: i*110+[720,-540,360][i], duration: 6, ease: 'sine.inOut', svgOrigin: '110 110' }, 0);
        });
      } else ctx.select((index+1)%3);
    });
    ctx.add(() => {
      if (mode === 'corridor') gsap.set(element.querySelectorAll('.corridor-frame'),{z:i=>-i*85});
      if (mode === 'gallery') gsap.set(element.querySelectorAll('.gallery-panel'), { flexGrow: i => i===0?4:1 });
      if (mode === 'galaxy') gsap.set(element.querySelectorAll('.satellite-orbit'), { rotation: i=>i*110, svgOrigin: '110 110' });
    });
    actions.current = { play: () => ctx.play(), select: next => ctx.select(next) };
    if (demo) ctx.play();
    return () => { actions.current={}; animation?.kill(); ctx.revert(); };
  }, [mode, demo]);
  const isGallery = mode === 'gallery';
  return <div ref={root} className={`cover-stage extra-study ${isGallery?'':'interactive-cover'} mode-${mode}`}
    role={isGallery?undefined:'button'} tabIndex={isGallery?undefined:0}
    aria-label={isGallery?'手风琴画廊':mode==='draw'?'重绘拱窗线稿':mode==='corridor'?'播放透视长廊':mode==='kaleido'?`切换万花镜，当前第 ${selected+1} 种图案`:mode==='morph'?`切换形状，当前${shapeNames[selected]}`:'播放轨道星系'}
    onClick={() => { if (!isGallery) actions.current.play?.(); }}
    onKeyDown={e => { if (!isGallery && ['Enter',' '].includes(e.key)) { e.preventDefault(); actions.current.play?.(); } }}>
    <div className={`extra-surface ${mode}-surface`}>
      {mode==='draw' && <><span className="study-kicker">FROM A LINE / TO AN IDEA</span><svg className="drawing-graphic" viewBox="0 0 220 220" aria-hidden="true"><path className="drawing-wash" d="M62 180 V85 C62 31 158 31 158 85 V180Z" fill="#7996a2" opacity=".55"/>{drawingPaths.map((d,i)=><path className="drawing-stroke" d={d} pathLength="100" strokeDasharray="100" strokeDashoffset="0" fill="none" stroke={i===5?'#eab982':'#dbe4d6'} strokeWidth={i===0?2:1.2} strokeLinecap="round" key={d}/>)}</svg><span className="study-play-status">{running?'线条正在生长':'每条线，都有起点'}</span><h2>一笔一划，<br/>构想成形。</h2><small>点击重新描绘六组线条 ↗</small></>}
      {mode==='corridor' && <><span className="study-kicker">A LITTLE FURTHER IN</span><div className="corridor-window" aria-hidden="true"><div className="corridor-glow"/>{Array.from({length:9},(_,i)=><i className="corridor-frame" key={i} style={{borderColor:`hsl(${210+i*9} 31% ${76-i*3}%)`}}/>)}</div><span className="study-play-status">{running?'向纵深，继续前进':'九道门，一段旅程'}</span><h2>向前一步，<br/>空间延伸。</h2><small>点击穿过透视长廊 ↗</small></>}
      {mode==='kaleido' && <><span className="study-kicker">SYMMETRY / POSSIBILITY</span><svg className="kaleido-graphic" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="99" fill="none" stroke="#8e879c" strokeWidth=".6"/><g className="kaleido-outer">{Array.from({length:12},(_,i)=><g key={i} transform={`rotate(${i*30} 110 110)`}><path className="kaleido-petal" d="M110 110 Q73 70 110 18 Q147 70 110 110Z" fill="#c48799" fillOpacity=".65" stroke="#e5c9a8" strokeWidth=".4"/></g>)}</g><g className="kaleido-inner">{Array.from({length:8},(_,i)=><path key={i} transform={`rotate(${i*45} 110 110)`} d="M110 110 L93 78 L110 54 L127 78Z" fill="#bcbddf" fillOpacity=".72"/>)}</g><circle cx="110" cy="110" r="11" fill="#e8c386"/></svg><div className="shape-labels">{['绽放','交错','聚合'].map((name,i)=><span className={selected===i?'active':''} key={name}>{name}</span>)}</div><h2>转动之间，<br/>看见万象。</h2><small>点击切换三种对称图案 ↗</small></>}
      {mode==='morph' && <><span className="study-kicker">FORM IS A POSSIBILITY</span><svg className="morph-graphic" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="97" fill="none" stroke="#bcb29c" strokeDasharray="2 5"/><polygon className="morph-shape" points={shapePoints[0]} fill="#837fa9" strokeLinejoin="round"/></svg><div className="shape-labels">{shapeNames.map((name,i)=><span className={selected===i?'active':''} key={name}>{name}</span>)}</div><h2>形状变化，<br/>想法流动。</h2><small>点击在三种形状间变奏 ↗</small></>}
      {mode==='galaxy' && <><span className="study-kicker">SMALL WORLDS / IN MOTION</span><svg className="galaxy-graphic" viewBox="0 0 220 220" aria-hidden="true">{[37,64,93].map(r=><circle key={r} cx="110" cy="110" r={r} stroke="#789697" strokeWidth=".6" fill="none"/>)}<circle cx="110" cy="110" r="17" fill="#e8bc79"/><circle cx="110" cy="110" r="23" fill="none" stroke="#e8bc7944"/>{[37,64,93].map((r,i)=><g className="satellite-orbit" key={r}><circle cx={110+r} cy="110" r={5+i*2} fill={['#d7d6ac','#8db7ad','#af9ec3'][i]}/>{i===2&&<ellipse cx={110+r} cy="110" rx="15" ry="4" fill="none" stroke="#d2bed8" transform={`rotate(-25 ${110+r} 110)`}/>}</g>)}</svg><span className="galaxy-status">{running?'沿着各自的轨道巡游':'等待下一次巡游'}</span><h2>各有轨迹，<br/>彼此相连。</h2><small>点击播放六秒轨道运动 ↗</small></>}
      {isGallery && <><span className="study-kicker">ROOM FOR A CLOSER LOOK</span><div className="accordion-gallery">{gallery.map(([title,detail,en],i)=><button className={`gallery-panel gallery-panel-${i} ${selected===i?'active':''}`} key={title} aria-label={`展开${title}画廊`} aria-expanded={selected===i} aria-describedby={selected===i?`${id}-${i}`:undefined} onClick={()=>actions.current.select?.(i)}><span className="gallery-motif" aria-hidden="true"/><span className="gallery-heading"><small>0{i+1}</small><strong>{title}</strong><span aria-hidden="true">{selected===i?'−':'+'}</span></span><span className="gallery-detail" id={`${id}-${i}`} hidden={selected!==i}><b>{en}</b>{detail}</span></button>)}</div><h2>多看一点，<br/>发现更多。</h2><small>点击任一画廊展开 ↗</small></>}
    </div>
  </div>;
}
