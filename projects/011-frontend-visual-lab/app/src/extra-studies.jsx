import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export function ExtraStudy({ mode, demo }) {
  const root = useRef(null), actions = useRef({});
  const [wipe, setWipe] = useState(50);
  const [opened, setOpened] = useState(false);
  const [chapter, setChapter] = useState(0);
  const id = useId().replace(/:/g, '');
  useLayoutEffect(() => {
    const element = root.current;
    let animation;
    let expanded = false;
    let chapterStep = 0;
    const ctx = gsap.context(() => {}, element);
    const surface = element.querySelector('.extra-surface');
    setWipe(50);
    setOpened(false);
    setChapter(0);
    let gridSetters = [];
    ctx.add(() => {
      if (mode === 'elasticgrid') gridSetters = [...element.querySelectorAll('.elastic-cell')].map(cell => ({
        x: gsap.quickTo(cell, 'x', { duration: .8, ease: 'elastic.out(1,.5)' }),
        y: gsap.quickTo(cell, 'y', { duration: .8, ease: 'elastic.out(1,.5)' }),
      }));
    });
    ctx.add('wipeTo', value => {
      animation?.kill();
      gsap.killTweensOf(surface);
      setWipe(value);
      gsap.to(surface, { '--wipe': `${value}%`, duration: .18, overwrite: true });
    });
    ctx.add('play', event => {
      animation?.kill();
      if (mode === 'daynight') {
        expanded = !expanded; setOpened(expanded);
        animation = gsap.timeline().to(surface, {
          '--sky': expanded?'#28334d':'#9cbfca', '--land': expanded?'#465674':'#7d9e84',
          '--near': expanded?'#303f5c':'#59796c', backgroundColor:expanded?'#1c253c':'#efe1c7',
          color:expanded?'#e3e5d0':'#4d594d', duration: 1.2, ease: 'power2.inOut' },0)
          .to(element.querySelector('.sky-sun'),{backgroundColor:expanded?'#f4ecca':'#f5cb78',y:expanded?10:0,duration:1.2},0)
          .to(element.querySelector('.moon-shadow'),{xPercent:expanded?26:120,yPercent:expanded?-18:-90,opacity:expanded?1:0,duration:1.2,ease:'power2.inOut'},0)
          .to(element.querySelectorAll('.sky-star'),{opacity:expanded?1:0,scale:expanded?1:.3,duration:.6,stagger:.025},.35);
      } else if (mode === 'cube') {
        chapterStep++; setChapter(chapterStep%4);
        animation = gsap.to(element.querySelector('.chapter-cube'),{rotationY:-chapterStep*90,duration:1.05,ease:'power3.inOut',overwrite:true});
      } else if (mode === 'equalizer') {
        const bars = element.querySelectorAll('.sound-bar');
        setOpened(true);
        animation = gsap.timeline({onComplete:()=>setOpened(false)});
        for(let beat=0;beat<8;beat++) animation.to(bars,{scaleY:i=>.18+Math.abs(Math.sin(i*.85+beat*1.35))*.82,duration:.3,stagger:{each:.009,from:beat%2?'end':'start'},ease:'sine.inOut'});
        animation.to(bars,{scaleY:.12,duration:.65,stagger:.01,ease:'power2.out'});
      } else if (mode === 'fan') {
        expanded = !expanded; setOpened(expanded);
        animation = gsap.to(element.querySelectorAll('.fan-paper'), { rotation: i => expanded ? (i-3)*13 : 0,
          y: i => expanded ? -Math.abs(i-3)*2 : 0, duration: 1.1, stagger: .07, ease: 'back.out(1.2)', overwrite: true });
      } else if (mode === 'mosaic') {
        expanded = !expanded; setOpened(expanded);
        animation = gsap.to(element.querySelectorAll('.mosaic-tile'), {
          xPercent: i => expanded ? ((i*17)%7-3)*65 : 0,
          yPercent: i => expanded ? ((i*11)%9-4)*50 : 0,
          rotation: i => expanded ? ((i*7)%9-4)*13 : 0,
          scale: expanded ? .65 : 1, opacity: expanded ? .55 : 1,
          duration: 1.1, stagger: { each: .015, from: 'center' }, ease: 'power3.inOut', overwrite: true });
      } else if (mode === 'elasticgrid') {
        const wave = { amount: 0 };
        animation = gsap.timeline({ onUpdate: () => gridSetters.forEach((cell,i) => {
          cell.x(Math.sin(i*1.7)*18*wave.amount); cell.y(Math.cos(i*.8)*22*wave.amount);
        }) }).to(wave, { amount: 1, duration: .7, ease: 'power2.out' })
          .to(wave, { amount: 0, delay: .5, duration: .7, ease: 'power2.inOut' });
      } else if (mode === 'wipe') {
        gsap.killTweensOf(surface);
        animation = gsap.timeline({ onUpdate: () => setWipe(Math.round(parseFloat(gsap.getProperty(surface, '--wipe')))) })
          .to(surface, { '--wipe': '15%', duration: .7, ease: 'power2.inOut' })
          .to(surface, { '--wipe': '85%', duration: 1.2, ease: 'power2.inOut' })
          .to(surface, { '--wipe': '50%', duration: .7, ease: 'power2.inOut' });
      } else if (mode === 'pulse') {
        const r = element.getBoundingClientRect();
        const x = event?.detail ? (event.clientX-r.left)/r.width*100 : 50;
        const y = event?.detail ? (event.clientY-r.top)/r.height*100 : 50;
        gsap.set(surface, { '--pulse-x': `${x}%`, '--pulse-y': `${y}%` });
        const rings = element.querySelectorAll('.pulse-ring');
        animation = gsap.timeline().fromTo(rings, { scale: 0, opacity: .9 },
          { scale: 3.5, opacity: 0, duration: 2.1, stagger: .18, ease: 'power2.out' });
      } else if (mode === 'orbit') {
        const outer = element.querySelector('.orbit-outer'), inner = element.querySelector('.orbit-inner');
        const emblem = element.querySelector('.orbit-emblem');
        animation = gsap.timeline().to(outer, { rotation: '+=360', svgOrigin: '110 110', duration: 4, ease: 'power2.inOut' }, 0)
          .to(inner, { rotation: '-=360', svgOrigin: '110 110', duration: 4, ease: 'power2.inOut' }, 0)
          .to(emblem, { rotation: '+=180', svgOrigin: '110 110', duration: 4, ease: 'power2.inOut' }, 0);
      }
    });
    actions.current = { play: event => ctx.play(event), wipe: value => ctx.wipeTo(value),
      move: e => {
        if (mode!=='elasticgrid' || e.pointerType==='touch') return;
        animation?.kill();
        const r = element.querySelector('.elastic-grid').getBoundingClientRect();
        const px = (e.clientX-r.left)/r.width, py = (e.clientY-r.top)/r.height;
        gridSetters.forEach((cell,i) => {
          const dx = (i%5+.5)/5-px, dy = (Math.floor(i/5)+.5)/5-py;
          const d = Math.hypot(dx,dy), force = Math.max(0,1-d/.5)*23;
          cell.x(dx/Math.max(.05,d)*force); cell.y(dy/Math.max(.05,d)*force);
        });
      },
      leave: () => { if(mode==='elasticgrid') { animation?.kill(); gridSetters.forEach(cell=>{cell.x(0);cell.y(0);}); } },
    };
    if (demo) ctx.play();
    return () => { actions.current = {}; animation?.kill(); ctx.revert(); };
  }, [mode, demo]);

  const isWipe = mode === 'wipe';
  return <div ref={root} className={`cover-stage extra-study mode-${mode} ${isWipe?'':'interactive-cover'}`}
    role={isWipe ? undefined : 'button'} tabIndex={isWipe ? undefined : 0}
    aria-label={isWipe ? '线稿与色彩擦除对比' : mode==='daynight' ? (opened?'切换为白昼':'切换为星夜') : mode==='cube' ? `旋转立体方块，当前第 ${chapter+1} 面` : mode==='equalizer' ? '播放声波律动，无音频' : mode==='elasticgrid' ? '演示弹性网格' : mode==='fan' ? (opened?'收拢折扇':'展开折扇') : mode==='mosaic' ? (opened?'重组像素拼图':'散开像素拼图') : mode==='pulse' ? '点击释放同心波纹' : '播放环形文字旋转'}
    aria-pressed={['fan','mosaic','daynight'].includes(mode)?opened:undefined}
    onPointerMove={e=>actions.current.move?.(e)} onPointerLeave={()=>actions.current.leave?.()} onBlur={()=>actions.current.leave?.()}
    onClick={e => { if (!isWipe) actions.current.play?.(e); }}
    onKeyDown={e => { if (!isWipe && ['Enter',' '].includes(e.key)) { e.preventDefault(); actions.current.play?.(); } }}>
    <div className={`extra-surface ${mode}-surface`}>
      {mode==='daynight' && <><span className="study-kicker">SAME PLACE / ANOTHER HOUR</span><div className="sky-window" aria-hidden="true">{Array.from({length:14},(_,i)=><i className="sky-star" key={i} style={{left:`${8+((i*37+i*i*11)%83)}%`,top:`${8+((i*19+i*i*7)%49)}%`}}/>)}<div className="sky-sun"><i className="moon-shadow"/></div><div className="sky-hill far-hill"/><div className="sky-hill near-hill"/></div><h2>{opened?<>夜色降临，<br/>星光接力。</>:<>光线流转，<br/>风景依然。</>}</h2><small>{opened?'点击迎接白昼 ↗':'点击进入星夜 ↗'}</small></>}
      {mode==='cube' && <><span className="study-kicker">FOUR SIDES / ONE STORY</span><div className="cube-scene" aria-hidden="true"><div className="chapter-cube">{[['01','观察'],['02','构想'],['03','尝试'],['04','呈现']].map(([n,title],i)=><div className={`cube-face cube-face-${i}`} key={n}><small>{n} / FIELDNOTES</small><strong>{title}</strong><span>↗</span></div>)}<div className="cube-cap cube-top"/><div className="cube-cap cube-bottom"/></div></div><h2>转个面，<br/>继续故事。</h2><small>0{chapter+1} / 04 · 点击下一面 ↗</small></>}
      {mode==='equalizer' && <><span className="study-kicker">A RHYTHM YOU CAN SEE</span><div className="sound-stage" aria-hidden="true">{Array.from({length:18},(_,i)=><i className="sound-bar" key={i} style={{background:`hsl(${22+i*3} 63% ${62+i%3*5}%)`}}/>)}</div><div className="sound-caption"><i className={opened?'playing':''}/>{opened?'节奏播放中':'等待下一次节奏'}</div><h2>让节奏，<br/>被看见。</h2><small>点击播放视觉节奏 · 无音频 ↗</small></>}
      {mode==='elasticgrid' && <><span className="study-kicker">ORDER / PLAY</span><div className="elastic-grid" aria-hidden="true">{Array.from({length:25},(_,i)=><i className="elastic-cell" key={i} style={{'--cell-hue':`${190+(i%5)*15}`}}/>)}</div><h2>秩序之间，<br/>留一点弹性。</h2><small>移动鼠标 · 离开后回弹 ↗</small></>}
      {mode==='fan' && <><span className="study-kicker">A SPECTRUM OF IDEAS</span><div className="fan-stage" aria-hidden="true">{['#4e6260','#788b75','#9b9d79','#d0b889','#d79574','#b87573','#827990'].map((color,i)=><div className="fan-paper" key={color} style={{background:color}}><span>0{i+1}</span><i/></div>)}<b className="fan-pin"/></div><h2>展开，<br/>更多可能。</h2><small>{opened?'再次点击，收拢色卡 ↗':'点击展开七张色卡 ↗'}</small></>}
      {mode==='mosaic' && <><span className="study-kicker">PIECES / TOGETHER</span><div className="mosaic-frame" aria-hidden="true"><div className="mosaic-grid">{Array.from({length:36},(_,i)=><i className="mosaic-tile" key={i} style={{backgroundPosition:`${i%6*20}% ${Math.floor(i/6)*20}%`}}/>)}</div></div><h2>散开的，<br/>也能再成形。</h2><small>{opened?'再次点击，拼回画面 ↗':'点击散开 36 个图块 ↗'}</small></>}
      {isWipe && <>
        <div className="wipe-art wire-art" aria-hidden="true"><span>01 / OUTLINE</span><div className="wipe-sun"/><div className="wipe-arch"/><h2>Same form.<br/><em>New feeling.</em></h2></div>
        <div className="wipe-art color-art" aria-hidden="true"><span>02 / COLOR</span><div className="wipe-sun"/><div className="wipe-arch"/><h2>Same form.<br/><em>New feeling.</em></h2></div>
        <div className="wipe-divider" aria-hidden="true"><span>↔</span></div>
        <label className="wipe-control"><span>线稿 ↔ 色彩 <output>{wipe}%</output></span><input type="range" aria-label="色彩显示比例" min="0" max="100" step="1" value={wipe} onChange={e=>actions.current.wipe?.(Number(e.target.value))}/></label>
      </>}
      {mode==='pulse' && <><span className="study-kicker">EVERY TOUCH / AN ECHO</span><div className="pulse-grid" aria-hidden="true"/><div className="pulse-origin" aria-hidden="true">{Array.from({length:5},(_,i)=><i className="pulse-ring" key={i}/>)}<b/></div><h2>一触，<br/>层层回应。</h2><small>点击任意位置，释放波纹 ↗</small></>}
      {mode==='orbit' && <><span className="study-kicker">WORDS IN ORBIT</span><svg className="orbit-graphic" viewBox="0 0 220 220" aria-hidden="true"><defs><path id={`${id}-outer`} d="M110 25 a85 85 0 1 1 -0.01 0"/><path id={`${id}-inner`} d="M110 51 a59 59 0 1 1 -0.01 0"/></defs><circle cx="110" cy="110" r="99" fill="none" stroke="currentColor" strokeWidth=".5"/><g className="orbit-outer"><text fontSize="12" textLength="525" lengthAdjust="spacing"><textPath href={`#${id}-outer`}>FORM · MOTION · FEELING · FORM · MOTION · FEELING · </textPath></text></g><g className="orbit-inner"><text fontSize="9" textLength="360" lengthAdjust="spacing"><textPath href={`#${id}-inner`}>把文字交给节奏 · 把节奏留给感受 · </textPath></text></g><g className="orbit-emblem">{Array.from({length:8},(_,i)=><ellipse cx="110" cy="93" rx="7" ry="21" transform={`rotate(${i*45} 110 110)`} key={i}/>)}<circle cx="110" cy="110" r="9" fill="#e7e7b1"/></g></svg><h2>字有轨迹，<br/>阅读有节奏。</h2><small>点击双环旋转一周 ↗</small></>}
    </div>
  </div>;
}
