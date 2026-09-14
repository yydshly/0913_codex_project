import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const dates = ['14', '15', '16'];
const bearings = [55, 135, 230, 310];

export function SequenceStudy({ mode, demo }) {
  const root = useRef(null), play = useRef(null);
  const [day, setDay] = useState(0), [active, setActive] = useState(false);
  useLayoutEffect(() => {
    const element = root.current, ctx = gsap.context(() => {}, element);
    let animation, current = 0, busy = false, opened = false;
    setDay(0); setActive(false);
    ctx.add('play', () => {
      if (mode === 'calendar' && busy) return;
      animation?.kill();
      if (mode === 'calendar') {
        busy = true; setActive(true);
        const page = element.querySelector('.calendar-leaf');
        animation = gsap.timeline({ onComplete: () => { busy = false; setActive(false); } })
          .to(page, { rotationX: -92, opacity: .15, duration: .5, ease: 'power2.in' })
          .call(() => { current = (current + 1) % dates.length; setDay(current); })
          .set(page, { rotationX: 88 })
          .to(page, { rotationX: 0, opacity: 1, duration: .7, ease: 'power3.out' });
      } else if (mode === 'radar') {
        setActive(true);
        const beam = element.querySelector('.radar-beam');
        const blips = element.querySelectorAll('.radar-blip');
        gsap.set(beam, { rotation: 0, opacity: 1 });
        gsap.set(blips, { scale: .45, opacity: .15 });
        animation = gsap.timeline({ onComplete: () => setActive(false) })
          .to(beam, { rotation: 360, duration: 4.5, ease: 'none' }, 0)
          .to(beam, { opacity: .25, duration: .3 }, 4.5);
        blips.forEach((blip, i) => {
          const at = bearings[i] / 360 * 4.5;
          animation.to(blip, { scale: 1.7, opacity: 1, duration: .16 }, at)
            .to(blip, { scale: 1, opacity: .25, duration: .65 }, at + .16);
        });
      } else {
        opened = !opened; setActive(opened);
        animation = gsap.timeline()
          .to(element.querySelectorAll('.zip-left'), { xPercent: opened ? -102 : 0, duration: .65, stagger: .065, ease: 'power3.inOut' }, 0)
          .to(element.querySelectorAll('.zip-right'), { xPercent: opened ? 102 : 0, duration: .65, stagger: .065, ease: 'power3.inOut' }, 0);
      }
    });
    play.current = () => ctx.play();
    if (demo) ctx.play();
    return () => { play.current = null; animation?.kill(); ctx.revert(); };
  }, [mode, demo]);
  const label = mode === 'calendar' ? `翻到下一页，当前 9 月 ${dates[day]} 日` : mode === 'radar' ? '播放雷达扫描' : active ? '合上拉链帷幕' : '拉开拉链帷幕';
  return <div ref={root} className={`cover-stage extra-study interactive-cover mode-${mode}`} role="button" tabIndex={0}
    aria-label={label} aria-pressed={mode === 'zipper' ? active : undefined} onClick={() => play.current?.()}
    onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); play.current?.(); } }}>
    <div className={`extra-surface ${mode}-surface`}>
      {mode === 'calendar' && <><span className="study-kicker">ONE PAGE / ONE POSSIBILITY</span><div className="calendar-scene"><div className="calendar-binding" aria-hidden="true"><i/><i/></div><div className="calendar-leaf"><span>SEPTEMBER</span><strong>{dates[day]}</strong><small>2026 / 九月</small></div></div><span className="study-play-status">{active ? '翻向新的一页' : '演示日期 · 14 / 15 / 16'}</span><h2>把下一页，<br/>留给期待。</h2><small>点击翻页 ↗</small></>}
      {mode === 'radar' && <><span className="study-kicker">LOOK CLOSER / FIND MORE</span><div className="radar-screen" aria-hidden="true"><div className="radar-grid"/><div className="radar-beam"/>{bearings.map((angle, i) => <i key={angle} className="radar-blip" style={{ left: `${50 + Math.sin(angle * Math.PI / 180) * (23 + i * 4)}%`, top: `${50 - Math.cos(angle * Math.PI / 180) * (23 + i * 4)}%` }}/>) }<i className="radar-center"/></div><span className="study-play-status">{active ? '正在扫描四个标记' : '图形演示 · 等待扫描'}</span><h2>每次探索，<br/>都有新发现。</h2><small>点击扫描一周 ↗</small></>}
      {mode === 'zipper' && <><span className="study-kicker">OPEN UP / LET THE LIGHT IN</span><div className="zip-window"><div className="zip-art" aria-hidden={!active}><i/><strong>OPEN</strong><span>给光一点空间</span></div><div className="zip-curtain" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <div className="zip-row" key={i}><i className="zip-left"/><i className="zip-right"/></div>)}</div></div><h2>一点点打开，<br/>另一种可能。</h2><small>{active ? '点击合上帷幕 ↗' : '点击由上至下揭幕 ↗'}</small></>}
    </div>
  </div>;
}
