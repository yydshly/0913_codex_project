import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { atelierStudies } from './atelier-catalogue';
gsap.registerPlugin(MotionPathPlugin);
const cells = [];
for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.abs(q + r) <= 2) cells.push([110 + Math.sqrt(3) * 18 * (q + r / 2), 110 + 27 * r]);
const hex = Array.from({ length: 6 }, (_, i) => `${18 * Math.cos((i * 60 + 30) * Math.PI / 180)},${18 * Math.sin((i * 60 + 30) * Math.PI / 180)}`).join(' ');
const menus = ['阅读', '灵感', '收藏'];
const toggleModes = ['honeycomb', 'metaball', 'aperture', 'arcmenu'];
const ribbonPath = (i, phase) => `M${15 + i * 29} 205 C${-15 + i * 26 + phase} 140 ${75 + i * 15 - phase} 90 ${45 + i * 27} 16`;

export function AtelierStudy({ mode, demo }) {
  const root = useRef(null), play = useRef(null);
  const [active, setActive] = useState(false), [choice, setChoice] = useState('');
  const uid = useId().replace(/:/g, ''), config = atelierStudies[mode];
  useLayoutEffect(() => {
    const element = root.current, ctx = gsap.context(() => {}, element), all = s => element.querySelectorAll(s);
    let animation, opened = false;
    setActive(false); setChoice('');
    ctx.add(() => {
      if (mode === 'aperture') gsap.set(all('.aperture-blade'), { svgOrigin: '110 110', smoothOrigin: false, rotation: 0, x: 0, y: 0 });
      if (mode === 'honeycomb') gsap.set(all('.honey-cell'), { x: i => cells[i][0] + Math.sin(i * 5) * 25, y: i => cells[i][1] + Math.cos(i * 3) * 25, scale: .3, opacity: .5 });
    });
    ctx.add('play', () => {
      animation?.kill();
      if (toggleModes.includes(mode)) { opened = !opened; setActive(opened); } else setActive(true);
      const done = () => setActive(false);
      if (mode === 'aurora') {
        const ribbons = all('.aurora-band');
        gsap.set(ribbons, { attr: { d: i => ribbonPath(i, 0) } });
        animation = gsap.timeline({ onComplete: done }).to(ribbons, { attr: { d: i => ribbonPath(i, 45) }, duration: 2, stagger: .07, ease: 'sine.inOut' })
          .to(ribbons, { attr: { d: i => ribbonPath(i, -30) }, duration: 1.5, stagger: .07, ease: 'sine.inOut' })
          .to(ribbons, { attr: { d: i => ribbonPath(i, 0) }, duration: 1.45, stagger: .07, ease: 'sine.inOut' });
      } else if (mode === 'honeycomb') {
        animation = gsap.to(all('.honey-cell'), { x: i => cells[i][0] + (opened ? 0 : Math.sin(i * 5) * 25), y: i => cells[i][1] + (opened ? 0 : Math.cos(i * 3) * 25), scale: opened ? 1 : .3, opacity: opened ? 1 : .5, duration: 1, stagger: .035, ease: 'back.out(1.2)' });
      } else if (mode === 'sparks') {
        const dots = all('.spark-dot');
        gsap.set(dots, { x: 0, y: 0, scale: 1, opacity: 1, svgOrigin: '110 110' });
        animation = gsap.timeline({ onComplete: done }).to(dots, { x: i => Math.cos(i * 2.399) * (55 + i % 5 * 8), y: i => Math.sin(i * 2.399) * (55 + i % 5 * 8), duration: 1.3, stagger: .008, ease: 'power3.out' }, 0)
          .to(dots, { scale: 0, opacity: 0, duration: .9, stagger: .008, ease: 'power1.in' }, .45);
      } else if (mode === 'metaball') {
        animation = gsap.to(all('.goo-drop'), { x: i => opened ? (i === 0 ? 23 : -23) : 0, duration: 1.6, ease: 'elastic.out(.8,.6)' });
      } else if (mode === 'gears') {
        const gears = all('.gear-wheel');
        gsap.set(gears, { rotation: 0 });
        animation = gsap.timeline({ onComplete: done }).to(gears[0], { rotation: 360, svgOrigin: '77 105', duration: 4, ease: 'none' }, 0)
          .to(gears[1], { rotation: -540, svgOrigin: '151 123', duration: 4, ease: 'none' }, 0);
      } else if (mode === 'plane') {
        const plane = all('.paper-plane'), path = element.querySelector('.plane-route');
        gsap.set(plane, { motionPath: { path, align: path, alignOrigin: [.5, .5], autoRotate: true, start: 0, end: 0 } });
        animation = gsap.to(plane, { motionPath: { path, align: path, alignOrigin: [.5, .5], autoRotate: true }, duration: 3.5, ease: 'power1.inOut', onComplete: done });
      } else if (mode === 'aperture') {
        animation = gsap.to(all('.aperture-blade'), { rotation: opened ? 16 : 0, x: 0, y: opened ? -28 : 0, duration: 1.2, stagger: .035, ease: 'power2.inOut' });
      } else {
        animation = gsap.to(all('.arc-option'), { xPercent: i => opened ? 0 : (1 - i) * 100, y: i => opened ? (i === 1 ? -92 : -61) : 0, opacity: opened ? 1 : 0, scale: opened ? 1 : .5, duration: .6, stagger: .06, ease: 'back.out(1.5)' });
      }
    });
    play.current = () => ctx.play();
    if (demo) ctx.play();
    return () => { play.current = null; animation?.kill(); ctx.revert(); };
  }, [mode, demo]);
  const toggleText = { honeycomb: ['已散开 · 点击拼合', '已拼合 · 点击散开'], metaball: ['已分离 · 点击融合', '已融合 · 点击分离'], aperture: ['光圈已收小 · 点击打开', '光圈已打开 · 点击收小'], arcmenu: ['点击加号展开', '选择菜单或点击收起'] };
  const status = toggleModes.includes(mode) ? toggleText[mode][active ? 1 : 0] : active ? '正在播放' : '点击播放一次';
  return <div ref={root} className={`cover-stage extra-study interactive-cover mode-${mode}`} role={mode === 'arcmenu' ? 'group' : 'button'} tabIndex={mode === 'arcmenu' ? undefined : 0} aria-label={`${config.name}，${status}`} aria-pressed={mode !== 'arcmenu' && toggleModes.includes(mode) ? active : undefined}
    onClick={mode === 'arcmenu' ? undefined : () => play.current?.()} onKeyDown={mode === 'arcmenu' ? undefined : e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); play.current?.(); } }}>
    <div className={`extra-surface atelier-surface ${mode}-surface`}><span className="study-kicker">THE MOTION ATELIER / {mode.toUpperCase()}</span>
      {mode === 'arcmenu' ? <div className="atelier-graphic arc-stage"><div className="arc-options" inert={!active}>{menus.map((label, i) => <button className="arc-option" key={label} tabIndex={active ? 0 : -1} aria-pressed={choice === label} onClick={() => setChoice(label)}>{label}</button>)}</div><button className="arc-toggle" aria-label={active ? '收起弧形菜单' : '展开弧形菜单'} aria-expanded={active} onClick={() => play.current?.()}>{active ? '−' : '+'}</button><span className="arc-feedback" role="status">{choice ? `已选择：${choice}` : '选择一个方向'}</span></div> : <svg className="atelier-graphic" viewBox="0 0 220 220" aria-hidden="true">
        <defs><clipPath id={`${uid}-lens`}><circle cx="110" cy="110" r="91"/></clipPath><linearGradient id={`${uid}-aurora`} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#9ecb97"/><stop offset=".5" stopColor="#6cc6bc"/><stop offset="1" stopColor="#a790c7"/></linearGradient><filter id={`${uid}-goo`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/><feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></defs>
        {mode === 'aurora' && <>{Array.from({ length: 6 }, (_, i) => <path className="aurora-band" key={i} d={ribbonPath(i, 0)} fill="none" stroke={`url(#${uid}-aurora)`} strokeWidth="16" opacity={.23 + i * .065}/>)}<path d="M0 208L55 179L106 205L171 184L220 201V220H0Z" fill="#192b33"/></>}
        {mode === 'honeycomb' && cells.map(([x, y], i) => <g className="honey-cell" key={i} transform={`translate(${x} ${y})`}><polygon points={hex} fill={['#a9bdac', '#d9c498', '#8a9e9b'][i % 3]} stroke="#324a43" strokeWidth="2"/></g>)}
        {mode === 'sparks' && <><circle cx="110" cy="110" r="5" fill="#f0d5a6"/>{Array.from({ length: 28 }, (_, i) => <circle className="spark-dot" key={i} cx="110" cy="110" r={i % 3 ? 2 : 3.5} fill={i % 2 ? '#e7b891' : '#b7a0c7'} opacity="0"/>)}</>}
        {mode === 'metaball' && <g filter={`url(#${uid}-goo)`}><circle className="goo-drop" cx="67" cy="110" r="32" fill="#89bcaa"/><circle className="goo-drop" cx="153" cy="110" r="32" fill="#89bcaa"/></g>}
        {mode === 'gears' && [[77, 105, 42, 12], [151, 123, 29, 8]].map(([x, y, radius, teeth], n) => <g className="gear-wheel" key={n}>{Array.from({ length: teeth }, (_, i) => <rect key={i} x={x - 6} y={y - radius - 3} width="12" height="14" rx="2" transform={`rotate(${i * 360 / teeth} ${x} ${y})`} fill={n ? '#c6a48a' : '#95aca4'}/>)}<circle cx={x} cy={y} r={radius - 6} fill={n ? '#c6a48a' : '#95aca4'}/><circle cx={x} cy={y} r={radius * .42} fill="#343c45"/><circle cx={x} cy={y} r="4" fill="#e6d3b2"/></g>)}
        {mode === 'plane' && <><path className="plane-route" d="M26 173C27 41 177 20 174 91S59 167 89 97S161 51 196 38" fill="none" stroke="#a8b7ad" strokeDasharray="3 5" strokeWidth="1"/><g className="paper-plane"><path d="M-13 -10L17 0L-13 10L-7 0Z" fill="#ecd5ab"/><path d="M-7 0H17" stroke="#a78e71"/></g></>}
        {mode === 'aperture' && <><circle cx="110" cy="110" r="91" fill="#d4b78d"/><circle cx="127" cy="78" r="21" fill="#f3dba1"/><path d="M25 157L82 100L144 176L185 117L201 174A91 91 0 0 1 25 157" fill="#7a9b8a" clipPath={`url(#${uid}-lens)`}/><g clipPath={`url(#${uid}-lens)`}>{Array.from({ length: 8 }, (_, i) => <g key={i} transform={`rotate(${i * 45} 110 110)`}><path className="aperture-blade" d="M110 18L191 56L136 99L112 102L88 62Z" fill={i % 2 ? '#69717d' : '#505b68'} stroke="#92969b" strokeWidth="1"/></g>)}</g><circle cx="110" cy="110" r="94" fill="none" stroke="#b3aaa0" strokeWidth="7"/></>}
      </svg>}
      <span className="atelier-status">{mode === 'arcmenu' ? '三个真实按钮 · 仅演示选择' : status}</span><h2>{config.title.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br/>}{line}</React.Fragment>)}</h2><small>{mode === 'arcmenu' ? '点击 + 或使用 Tab 选择 ↗' : '点击封面 / Enter / 空格 ↗'}</small>
    </div>
  </div>;
}
