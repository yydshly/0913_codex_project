import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { journeyStudies } from './journey-catalogue';
const stars = Array.from({ length: 72 }, (_, i) => { const a = i * 2.399, r = 12 + Math.sqrt(i / 71) * 78; return [110 + Math.cos(a) * r, 110 + Math.sin(a) * r * .66]; });
const filmNames = ['日出', '山峦', '夜色'];
const count = 48;
function stripFace(i, angle) {
  const points = [], depths = [];
  for (const [u, v] of [[i / count * Math.PI * 2, -17], [(i + 1) / count * Math.PI * 2, -17], [(i + 1) / count * Math.PI * 2, 17], [i / count * Math.PI * 2, 17]]) {
    const x = (63 + v * Math.cos(u / 2)) * Math.cos(u), y = (63 + v * Math.cos(u / 2)) * Math.sin(u), z = v * Math.sin(u / 2);
    const rx = x * Math.cos(angle) + z * Math.sin(angle), rz = -x * Math.sin(angle) + z * Math.cos(angle);
    points.push(`${110 + rx},${110 + y * .58 - rz * .81}`); depths.push(y * .81 + rz * .58);
  }
  return { points: points.join(' '), depth: depths.reduce((a,b) => a+b,0) / 4 };
}

export function JourneyStudy({ mode, demo }) {
  const root = useRef(null), play = useRef(null);
  const [active, setActive] = useState(false), [index, setIndex] = useState(0);
  const uid = useId().replace(/:/g,''), config = journeyStudies[mode];
  useLayoutEffect(() => {
    const element = root.current, all = s => element.querySelectorAll(s), ctx = gsap.context(() => {}, element);
    let animation, opened = false, current = 0, busy = false;
    setActive(false); setIndex(0);
    ctx.add('play', () => {
      if (busy && ['film','shuffle'].includes(mode)) return;
      animation?.kill();
      if (mode === 'foldmap') { opened = !opened; setActive(opened); } else setActive(true);
      const done = () => setActive(false);
      if (mode === 'nebula') {
        const points = all('.nebula-star');
        gsap.set(points, { x: 0, y: 0, scale: 1, opacity: .75, transformOrigin: '50% 50%' });
        gsap.set(all('.nebula-field'), { rotation: 0, svgOrigin: '110 110' });
        animation = gsap.timeline({ onComplete: done }).to(all('.nebula-field'), { rotation: 180, duration: 4.8, ease: 'sine.inOut' }, 0)
          .to(points, { x: i => (110 - stars[i][0]) * .65, y: i => (110 - stars[i][1]) * .65, scale: 1.4, opacity: 1, duration: 1.8, stagger: .008, ease: 'sine.inOut' }, 0)
          .to(points, { x: 0, y: 0, scale: 1, opacity: .75, duration: 1.8, stagger: .008, ease: 'sine.inOut' }, 2.4);
      } else if (mode === 'rainwindow') {
        const rain = all('.window-rain');
        gsap.set(rain, { y: -135, opacity: .65 });
        animation = gsap.timeline({ onComplete: done }).to(rain, { y: 160, duration: 1.5, stagger: .08, repeat: 1, ease: 'none' }).to(rain, { opacity: 0, duration: .35 });
      } else if (mode === 'film') {
        busy = true; const next = (current + 1) % 3;
        animation = gsap.timeline({ onComplete: () => { current = next; setIndex(current); busy = false; done(); } })
          .to(all('.film-track'), { yPercent: -(current + 1) * 25, duration: 1.15, ease: 'power4.inOut' });
        if (next === 0) animation.set(all('.film-track'), { yPercent: 0 });
      } else if (mode === 'foldmap') {
        animation = gsap.to(all('.map-panel'), { rotationY: i => opened ? 0 : [48,-48,48][i], scaleX: opened ? 1 : .9, duration: 1.4, stagger: .1, ease: 'power2.inOut' });
      } else if (mode === 'routes') {
        gsap.set(all('.flight-line'), { strokeDashoffset: 100 });
        gsap.set(all('.route-destination'), { scale: .5, opacity: .3, transformOrigin: '50% 50%' });
        animation = gsap.timeline({ onComplete: done });
        all('.flight-line').forEach((line,i) => animation.to(line, { strokeDashoffset: 0, duration: .95, ease: 'power2.inOut' }, i * .8)
          .to(all('.route-destination')[i], { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2)' }, i * .8 + .8));
      } else if (mode === 'gyroscope') {
        const rings = all('.gyro-ring');
        gsap.set(rings, { rotationX: i => [65,0,45][i], rotationY: i => [0,65,45][i], rotationZ: 0 });
        animation = gsap.timeline({ onComplete: done }).to(rings[0], { rotationX: 425, duration: 4, ease: 'sine.inOut' },0)
          .to(rings[1], { rotationY: 425, duration: 4, ease: 'sine.inOut' },0)
          .to(rings[2], { rotationZ: 360, duration: 4, ease: 'sine.inOut' },0);
      } else if (mode === 'mobius') {
        const state = { angle: 0 }, faces = [...all('.mobius-face')].sort((a,b)=>Number(a.dataset.segment)-Number(b.dataset.segment)), group = element.querySelector('.mobius-mesh');
        const render = () => {
          const layers = faces.map((face,i) => { const data=stripFace(i,state.angle);face.setAttribute('points',data.points);return {face,depth:data.depth}; });
          layers.sort((a,b)=>a.depth-b.depth).forEach(({face})=>group.appendChild(face));
        };
        render(); animation = gsap.to(state, { angle: Math.PI * 2, duration: 4.2, ease: 'sine.inOut', onUpdate: render, onComplete: done });
      } else if (mode === 'marble') {
        gsap.set(all('.marble-ball'), { x: 0, y: 0 });
        animation = gsap.timeline({ onComplete: done });
        [[30,47,46,24],[80,89,94,68],[136,130,151,116]].forEach(([x,y,upX,upY]) => animation.to(all('.marble-ball'), { x,y,duration:.55,ease:'power2.in' }).to(all('.marble-ball'),{x:upX,y:upY,duration:.35,ease:'power2.out'}));
        animation.to(all('.marble-ball'), { x:164,y:155,duration:.4,ease:'bounce.out' });
      } else if (mode === 'shuffle') {
        busy = true; const next = current === 0 ? 1 : 0, letters = all('.shuffle-letter');
        animation = gsap.timeline({ onComplete: () => { current=next;setIndex(next);busy=false;done(); } })
          .to([letters[1],letters[2]], { y: i => i === 0 ? -25 : 25, duration: .3 },0)
          .to(letters[1], { left: next ? '49%' : '26%', duration: .7, ease:'power2.inOut' },.3)
          .to(letters[2], { left: next ? '26%' : '49%', duration: .7, ease:'power2.inOut' },.3)
          .to([letters[1],letters[2]], {y:0,duration:.3},1);
      } else {
        gsap.set(all('.light-border'), { '--light-angle': '0deg' });
        animation = gsap.to(all('.light-border'), { '--light-angle':'720deg',duration:4,ease:'none',onComplete:done });
      }
    });
    play.current = () => ctx.play(); if(demo)ctx.play();
    return () => { play.current=null;animation?.kill();ctx.revert(); };
  },[mode,demo]);
  const status = mode==='foldmap' ? (active?'地图已展开 · 点击收拢':'地图已折叠 · 点击展开') : mode==='film' ? `第 ${index+1} 帧 · ${filmNames[index]}` : mode==='shuffle' ? (index?'FROM':'FORM') : active?'正在播放':'点击播放一次';
  return <div ref={root} className={`cover-stage extra-study interactive-cover mode-${mode}`} role="button" tabIndex={0} aria-label={`${config.name}，${status}`} aria-pressed={mode==='foldmap'?active:undefined}
    onClick={()=>play.current?.()} onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();play.current?.();}}}>
    <div className={`extra-surface journey-surface ${mode}-surface`}><span className="study-kicker">SMALL JOURNEYS / {mode.toUpperCase()}</span><JourneyGraphic mode={mode} uid={uid}/><span className="journey-status">{status}</span><h2>{config.title.split('\n').map((line,i)=><React.Fragment key={line}>{i>0&&<br/>}{line}</React.Fragment>)}</h2><small>点击封面 / Enter / 空格 ↗</small></div>
  </div>;
}

function JourneyGraphic({mode,uid}) {
  if(mode==='film')return <div className="journey-graphic film-scene" aria-hidden="true"><div className="film-window"><div className="film-track">{[0,1,2,0].map((i,j)=><div className={`film-frame film-frame-${i}`} key={j}><i/><b/><span>0{i+1} / {filmNames[i]}</span></div>)}</div></div></div>;
  if(mode==='foldmap')return <div className="journey-graphic map-scene" aria-hidden="true">{[0,1,2].map(i=><div className={`map-panel map-panel-${i}`} key={i} style={{transform:`rotateY(${[48,-48,48][i]}deg) scaleX(.9)`}}><i/><b/><span>{['START','WANDER','ARRIVE'][i]}</span></div>)}</div>;
  if(mode==='gyroscope')return <div className="journey-graphic gyro-scene" aria-hidden="true"><div className="gyro-core"/>{[0,1,2].map(i=><i className={`gyro-ring gyro-ring-${i}`} key={i}/>)}</div>;
  if(mode==='shuffle')return <div className="journey-graphic shuffle-scene" aria-hidden="true">{'FORM'.split('').map((letter,i)=><span className="shuffle-letter" key={i} style={{left:`${3+i*23}%`}}>{letter}</span>)}<i/><small>THE SAME LETTERS / A NEW MEANING</small></div>;
  if(mode==='glowborder')return <div className="journey-graphic glow-scene"><div className="light-border"><div className="light-note"><span>A NOTE FOR YOU</span><strong>与你共鸣</strong><small>让好想法被看见</small></div></div></div>;
  return <svg className="journey-graphic" viewBox="0 0 220 220" aria-hidden="true">
    <defs><clipPath id={`${uid}-window`}><rect x="28" y="25" width="164" height="171" rx="55"/></clipPath></defs>
    {mode==='nebula'&&<><ellipse cx="110" cy="110" rx="91" ry="60" fill="none" stroke="#9c9eba" strokeOpacity=".2"/><g className="nebula-field">{stars.map(([x,y],i)=><circle key={i} className="nebula-star" cx={x} cy={y} r={i%7===0?2.2:1.2} fill={i%3?'#d4bdd3':'#e7cba2'} opacity=".75"/>)}</g><circle cx="110" cy="110" r="5" fill="#eed5a8"/></>}
    {mode==='rainwindow'&&<><g clipPath={`url(#${uid}-window)`}><rect x="28" y="25" width="164" height="171" fill="#627b88"/><circle cx="154" cy="63" r="19" fill="#d6c9a6"/>{[0,1,2,3,4].map(i=><rect key={i} x={27+i*35} y={93+(i*19)%47} width="28" height="110" fill={i%2?'#3d555e':'#49666d'}/>)}{Array.from({length:20},(_,i)=><path key={i} className="window-rain" d={`M${34+(i*37)%152} ${20+(i*29)%100}l-5 29`} stroke="#c0d4d1" strokeWidth={i%3?1:2} opacity="0"/>)}</g><rect x="28" y="25" width="164" height="171" rx="55" fill="none" stroke="#abb5ad" strokeWidth="3"/><path d="M110 25V196M28 120H192" stroke="#a7b1a5" strokeWidth="3"/></>}
    {mode==='routes'&&<><path d="M22 62L58 48L74 72L66 102L89 121L67 178L42 161L47 119L24 104ZM110 42L140 35L157 53L189 58L198 98L163 118L152 155L121 171L111 137L123 103L101 88Z" fill="#6e8f88" opacity=".4"/>{['M49 137Q61 39 145 68','M49 137Q133 192 174 123','M49 137Q37 85 68 73'].map((d,i)=><path className="flight-line" key={i} d={d} pathLength="100" strokeDasharray="100" strokeDashoffset="100" fill="none" stroke={['#eed1a2','#c7bdcc','#9dc8b5'][i]} strokeWidth="2"/>)}{[[145,68],[174,123],[68,73]].map(([x,y],i)=><circle className="route-destination" key={i} cx={x} cy={y} r="5" fill="#e7cba4" opacity=".3"/>)}<circle cx="49" cy="137" r="6" fill="#f1dba9"/></>}
    {mode==='mobius'&&<g className="mobius-mesh">{Array.from({length:count},(_,i)=><polygon key={i} className="mobius-face" data-segment={i} points={stripFace(i,0).points} fill={`hsl(${175+i*1.2} 24% ${48+Math.sin(i/count*Math.PI*2)*15}%)`} stroke="#bbc8b2" strokeWidth=".25"/>)}</g>}
    {mode==='marble'&&<><path d="M40 91H80M91 133H135M145 174H181M12 200H208" stroke="#aca3b9" strokeWidth="5" strokeLinecap="round"/><path d="M57 94V199M113 136V199M167 177V199" stroke="#71677e" strokeWidth="2"/><circle className="marble-ball" cx="22" cy="35" r="9" fill="#ddbb95"/></>}
  </svg>;
}
