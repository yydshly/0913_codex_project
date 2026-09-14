import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import { collectionStudies } from './collection-catalogue';

const toggles = ['bloom', 'eclipse', 'book', 'stairs'];
const finite = ['cradle', 'hourglass', 'spring', 'flag', 'scan'];
const verses = ['山间有风', '林间有光', '心间有你'];
const directions = ['北', '东', '南', '西'];
const focusNames = ['前景', '中景', '远景'];

export function CollectionStudy({ mode, demo }) {
  const root = useRef(null), play = useRef(null);
  const [index, setIndex] = useState(0), [active, setActive] = useState(false);
  const config = collectionStudies[mode];
  useLayoutEffect(() => {
    const element = root.current, ctx = gsap.context(() => {}, element);
    const all = selector => element.querySelectorAll(selector);
    let animation, current = 0, opened = false, busy = false;
    setIndex(0); setActive(false);
    ctx.add(() => {
      if (mode === 'bloom') gsap.set(all('.bloom-petal'), { scale: .45, svgOrigin: '110 110', opacity: .6 });
      if (mode === 'hourglass') gsap.set(all('.sand-bottom'), { scaleY: .02, svgOrigin: '110 176' });
      if (mode === 'focus') gsap.set(all('.focus-layer'), { filter: i => i === 0 ? 'blur(0px)' : 'blur(4px)', opacity: i => i === 0 ? 1 : .4 });
    });
    ctx.add('play', () => {
      if (mode === 'verse' && busy) return;
      animation?.kill();
      if (toggles.includes(mode)) { opened = !opened; setActive(opened); }
      if (finite.includes(mode)) setActive(true);
      const done = () => setActive(false);
      if (mode === 'bloom') {
        animation = gsap.to(all('.bloom-petal'), { scale: opened ? 1 : .45, opacity: opened ? 1 : .6, duration: 1, stagger: .055, ease: 'back.out(1.3)', svgOrigin: '110 110' });
      } else if (mode === 'cradle') {
        const balls = all('.cradle-ball');
        gsap.set(balls, { rotation: 0 });
        animation = gsap.timeline({ onComplete: done });
        [36, 29, 22, 14].forEach(angle => {
          animation.to(balls[0], { rotation: angle, svgOrigin: '62 38', duration: .35, ease: 'sine.out' })
            .to(balls[0], { rotation: 0, duration: .35, ease: 'sine.in' })
            .to(balls[4], { rotation: -angle, svgOrigin: '158 38', duration: .35, ease: 'sine.out' })
            .to(balls[4], { rotation: 0, duration: .35, ease: 'sine.in' });
        });
      } else if (mode === 'hourglass') {
        gsap.set(all('.sand-top'), { scaleY: 1, svgOrigin: '110 108' });
        gsap.set(all('.sand-bottom'), { scaleY: .02, svgOrigin: '110 176' });
        gsap.set(all('.sand-stream'), { opacity: 1, strokeDashoffset: 0 });
        animation = gsap.timeline({ onComplete: done })
          .to(all('.sand-top'), { scaleY: 0, duration: 4, ease: 'none' }, 0)
          .to(all('.sand-bottom'), { scaleY: 1, duration: 4, ease: 'none' }, 0)
          .to(all('.sand-stream'), { strokeDashoffset: -64, duration: 4, ease: 'none' }, 0)
          .set(all('.sand-stream'), { opacity: 0 });
      } else if (mode === 'spring') {
        gsap.set(all('.spring-coil'), { scaleY: 1, svgOrigin: '110 35' });
        gsap.set(all('.spring-weight'), { y: 0 });
        animation = gsap.timeline({ onComplete: done })
          .to(all('.spring-coil'), { scaleY: 1.35, duration: .55 }, 0)
          .to(all('.spring-weight'), { y: 35, duration: .55 }, 0)
          .to(all('.spring-coil'), { scaleY: 1, duration: 2.5, ease: 'elastic.out(1,.3)' }, .55)
          .to(all('.spring-weight'), { y: 0, duration: 2.5, ease: 'elastic.out(1,.3)' }, .55);
      } else if (mode === 'flag') {
        const strips = all('.flag-strip');
        gsap.set(strips, { y: 0 });
        animation = gsap.timeline({ onComplete: done });
        for (let pass = 0; pass < 3; pass++) animation.to(strips, { y: i => Math.sin(i * .32 + pass * 2) * 15, duration: .65, stagger: .022, ease: 'sine.inOut' });
        animation.to(strips, { y: 0, duration: .6, stagger: .015, ease: 'sine.out' });
      } else if (mode === 'eclipse') {
        animation = gsap.timeline()
          .to(all('.eclipse-moon'), { x: opened ? 0 : 86, duration: 1.7, ease: 'power2.inOut' }, 0)
          .to(all('.eclipse-corona'), { opacity: opened ? 1 : .15, scale: opened ? 1.08 : 1, svgOrigin: '110 110', duration: 1.7 }, 0);
      } else if (mode === 'focus') {
        current = (current + 1) % 3; setIndex(current);
        animation = gsap.to(all('.focus-layer'), { filter: i => i === current ? 'blur(0px)' : 'blur(4px)', opacity: i => i === current ? 1 : .4, scale: i => i === current ? 1.05 : 1, transformOrigin: '50% 50%', duration: .9 });
      } else if (mode === 'verse') {
        busy = true;
        const next = (current + 1) % 3;
        animation = gsap.timeline({ onComplete: () => { current = next; setIndex(current); busy = false; } })
          .to(all('.verse-track'), { yPercent: -(current + 1) * 25, duration: 1, ease: 'power3.inOut' });
        if (next === 0) animation.set(all('.verse-track'), { yPercent: 0 });
      } else if (mode === 'book') {
        animation = gsap.to(all('.study-book-cover'), { rotationY: opened ? -155 : 0, duration: 1.4, ease: 'power2.inOut' });
      } else if (mode === 'stairs') {
        animation = gsap.to(all('.iso-step'), { y: i => 132 + i * 4 - (opened ? i * 13 : 0), duration: .9, stagger: .09, ease: 'power3.inOut' });
      } else if (mode === 'scan') {
        gsap.set(all('.scan-color'), { clipPath: 'inset(0 0 100% 0)' });
        gsap.set(all('.scan-line'), { y: 0, opacity: 1 });
        animation = gsap.timeline({ onComplete: done })
          .to(all('.scan-color'), { clipPath: 'inset(0 0 0% 0)', duration: 2.8, ease: 'none' }, 0)
          .to(all('.scan-line'), { y: 176, duration: 2.8, ease: 'none' }, 0)
          .to(all('.scan-line'), { opacity: 0, duration: .3 });
      } else if (mode === 'compass') {
        current++; setIndex(current % 4);
        animation = gsap.to(all('.compass-needle'), { rotation: current * 90, svgOrigin: '110 110', duration: 1.2, ease: 'back.out(1.6)' });
      }
    });
    play.current = () => ctx.play();
    if (demo) ctx.play();
    return () => { play.current = null; animation?.kill(); ctx.revert(); };
  }, [mode, demo]);
  const toggleText = { bloom: ['等待绽放 · 点击展开', '已经绽放 · 点击收拢'], eclipse: ['月影已移开 · 点击对齐', '光环已显现 · 点击移开'], book: ['书本已合上 · 点击翻开', '书本已翻开 · 点击合上'], stairs: ['台阶已放平 · 点击抬升', '阶梯已抬升 · 点击放平'] };
  const status = toggles.includes(mode) ? toggleText[mode][active ? 1 : 0] : mode === 'focus' ? `当前对焦：${focusNames[index]}` : mode === 'verse' ? verses[index] : mode === 'compass' ? `当前方向：${directions[index]}` : active ? '正在播放' : '点击播放一次';
  return <div ref={root} className={`cover-stage extra-study interactive-cover mode-${mode}`} role="button" tabIndex={0} aria-label={`${config.name}，${status}`} aria-pressed={toggles.includes(mode) ? active : undefined}
    onClick={() => play.current?.()} onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); play.current?.(); } }}>
    <div className={`extra-surface collection-surface ${mode}-surface`}>
      <span className="study-kicker">{config.tag}</span>
      <CollectionGraphic mode={mode} active={active}/>
      <span className="collection-status">{status}</span>
      <h2>{config.title.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br/>}{line}</React.Fragment>)}</h2>
      <small>点击封面 / Enter / 空格 ↗</small>
    </div>
  </div>;
}

function CollectionGraphic({ mode, active }) {
  if (mode === 'book') return <div className="collection-graphic book-scene"><div className="study-book"><div className="study-book-page" aria-hidden={!active}><span>CHAPTER 01</span><b>看见<br/>不一样</b><i/><i/><i/></div><div className="study-book-cover"><div className="book-cover-front" aria-hidden={active}><span>FIELD<br/>NOTES</span><b>01</b></div><div className="book-cover-back" aria-hidden="true"><i/></div></div></div></div>;
  if (mode === 'verse') return <div className="collection-graphic verse-scene"><span>此刻的风景</span><div className="verse-window" aria-hidden="true"><div className="verse-track">{[...verses, verses[0]].map((verse, i) => <div key={i}>{verse}</div>)}</div></div><div className="verse-rules"><i/><i/><i/></div></div>;
  if (mode === 'scan') return <div className="collection-graphic scan-scene" aria-hidden="true"><div className="scan-art scan-outline"/><div className="scan-art scan-color"/><i className="scan-line"/></div>;
  return <svg className="collection-graphic" viewBox="0 0 220 220" aria-hidden="true">
    {mode === 'bloom' && <>{Array.from({ length: 12 }, (_, i) => <g key={i} transform={`rotate(${i * 30} 110 110)`}><ellipse className="bloom-petal" cx="110" cy="70" rx="18" ry="46" fill={i % 2 ? '#c18b8b' : '#e3b49b'} stroke="#edccb1" strokeWidth=".6"/></g>)}<circle cx="110" cy="110" r="17" fill="#ecd39a"/></>}
    {mode === 'cradle' && <><path d="M22 185V38H198V185M12 185H208" fill="none" stroke="#b9aa8e" strokeWidth="4"/>{Array.from({ length: 5 }, (_, i) => <g className="cradle-ball" key={i}><line x1={62 + i * 24} y1="38" x2={62 + i * 24} y2="132" stroke="#c5baa1"/><circle cx={62 + i * 24} cy="144" r="12" fill={i % 2 ? '#b8cabc' : '#e1c3a0'}/></g>)}</>}
    {mode === 'hourglass' && <><path d="M55 38H165C165 90 120 94 116 110C120 126 165 131 165 182H55C55 131 100 126 104 110C100 94 55 90 55 38Z" fill="#e5dac612" stroke="#b4b9af" strokeWidth="2"/><path className="sand-top" d="M65 58H155L110 108Z" fill="#e3bd7d"/><path className="sand-bottom" d="M63 176L110 130L157 176Z" fill="#d6a970"/><path className="sand-stream" d="M110 110V170" stroke="#edd098" strokeWidth="2" strokeDasharray="2 4" opacity="0"/><path d="M48 34H172M48 186H172" stroke="#98785c" strokeWidth="8" strokeLinecap="round"/></>}
    {mode === 'spring' && <><path d="M65 30H155" stroke="#8b829a" strokeWidth="5"/><polyline className="spring-coil" points="110,35 110,43 88,49 132,57 88,65 132,73 88,81 132,89 88,97 132,105 88,113 132,121 110,129 110,135" fill="none" stroke="#c4b5d2" strokeWidth="3" strokeLinejoin="round"/><g className="spring-weight"><rect x="84" y="135" width="52" height="43" rx="9" fill="#d2ae94"/><circle cx="110" cy="154" r="6" fill="#886d76"/></g></>}
    {mode === 'flag' && <><path d="M24 30V191" stroke="#d5c8a7" strokeWidth="3"/>{Array.from({ length: 24 }, (_, i) => <rect key={i} className="flag-strip" x={26 + i * 7} y="56" width="7.5" height="96" fill={i < 8 ? '#739e94' : i < 16 ? '#e8cf9f' : '#c08a77'}/>)}<path d="M12 194H39" stroke="#d5c8a7" strokeWidth="4"/></>}
    {mode === 'eclipse' && <><circle className="eclipse-corona" cx="110" cy="110" r="57" fill="none" stroke="#f2d8a6" strokeWidth="9" opacity=".15"/><circle cx="110" cy="110" r="53" fill="#e9b973"/><circle className="eclipse-moon" cx="110" cy="110" r="51" fill="#292b40" transform="translate(86 0)"/></>}
    {mode === 'focus' && <>{[0, 1, 2].map((i) => <g className="focus-layer" key={i}><rect x={26 + i * 45} y={89 - i * 24} width="74" height={91 + i * 4} rx={i === 1 ? 37 : 3} fill={['#d5ac88', '#869cac', '#b6ad8b'][i]}/><circle cx={63 + i * 45} cy={119 - i * 24} r="12" fill="#f1dfb8"/><path d={`M${43 + i * 45} ${151 - i * 24}h40`} stroke="#343b40" strokeWidth="2"/></g>)}</>}
    {mode === 'stairs' && <>{Array.from({ length: 7 }, (_, i) => <g key={i} className="iso-step" transform={`translate(${18 + i * 24} ${132 + i * 4})`}><path d="M0 0L21 -11L43 0L22 11Z" fill="#d9c5a4"/><path d="M0 0L22 11V26L0 15Z" fill="#8c8992"/><path d="M22 11L43 0V15L22 26Z" fill="#af9a8e"/></g>)}</>}
    {mode === 'compass' && <><circle cx="110" cy="110" r="80" fill="#343e40" stroke="#a9b4a1"/>{Array.from({ length: 32 }, (_, i) => <path key={i} d={`M110 36V${i % 8 ? 41 : 47}`} transform={`rotate(${i * 11.25} 110 110)`} stroke="#afbea8" strokeWidth={i % 8 ? 1 : 2}/>)}{['N', 'E', 'S', 'W'].map((d, i) => <text key={d} x={[110, 167, 110, 53][i]} y={[58, 115, 170, 115][i]} fill="#dccda9" fontSize="12" textAnchor="middle">{d}</text>)}<g className="compass-needle"><path d="M110 64L122 110H98Z" fill="#d3997c"/><path d="M110 156L122 110H98Z" fill="#bcc7b5"/></g><circle cx="110" cy="110" r="6" fill="#e5d6b5"/></>}
  </svg>;
}
