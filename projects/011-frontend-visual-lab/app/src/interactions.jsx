import React, { useLayoutEffect, useRef, useState, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ExtraStudy } from './extra-studies';
import { ShapeStudy } from './shape-studies';
import { MotionStudy } from './motion-studies';
import { SequenceStudy } from './sequence-studies';
import { collectionStudies } from './collection-catalogue';
import { atelierStudies } from './atelier-catalogue';
import { journeyStudies } from './journey-catalogue';
const JourneyStudy = lazy(() => import('./journey-studies').then(module => ({ default: module.JourneyStudy })));
const AtelierStudy = lazy(() => import('./atelier-studies').then(module => ({ default: module.AtelierStudy })));
const CollectionStudy = lazy(() => import('./collection-studies').then(module => ({ default: module.CollectionStudy })));

gsap.registerPlugin(ScrambleTextPlugin, Draggable, MotionPathPlugin);

export const interactions = {
  ...journeyStudies,
  ...atelierStudies,
  ...collectionStudies,
  calendar: { name: '翻页日历', tip: '点击封面，纸页沿顶部翻转，循环显示 14、15、16 日；支持 Enter 与空格。日期仅为演示。' },
  radar: { name: '雷达扫描', tip: '点击封面，光束扫描一周，依次点亮四个标记后停止；支持 Enter、空格与重播。仅为图形演示。' },
  zipper: { name: '拉链开幕', tip: '点击封面，十二排帷幕由上至下向两侧打开，再次点击合上；支持 Enter 与空格。' },
  matrix: { name: '点阵标牌', tip: '点击封面，77 个点在 HI、GO、OK 三组文字间错峰切换；支持 Enter、空格和演示一次。' },
  ribbon: { name: '纸带扭转', tip: '点击封面，18 段纸带沿纵向形成扭转；再次点击摊平。支持 Enter 与空格。' },
  comet: { name: '彗星巡航', tip: '点击封面，光点沿曲线路径巡航，后方跟随渐细的拖尾；完成后淡出。支持 Enter、空格与重播。' },
  draw: { name: '线稿描绘', tip: '点击封面，六组线条依次绘出拱窗，最后加入底色；支持 Enter、空格与重播。' },
  corridor: { name: '透视长廊', tip: '点击封面，九道门框沿纵深向前推进，完成后回到起点；支持 Enter、空格和演示一次。' },
  kaleido: { name: '万花镜', tip: '点击封面，对称花瓣旋转、收缩并变色，在三种图案之间切换；支持 Enter 与空格。' },
  morph: { name: '形状变奏', tip: '点击封面，圆形、星芒与方形平滑变换，颜色随之过渡；支持 Enter、空格和演示一次。' },
  galaxy: { name: '轨道星系', tip: '点击封面，三个小星体沿不同轨道、方向与速度巡游六秒；支持 Enter、空格和重播。' },
  gallery: { name: '手风琴画廊', tip: '点击风景、建筑或色彩画廊，当前内容展开，其他内容收起；Tab 选中后可用 Enter 或空格操作。' },
  daynight: { name: '昼夜切换', tip: '点击封面，在白昼与星夜之间切换；天空、山丘与日月一起过渡。支持 Enter 和空格。' },
  cube: { name: '立体方块', tip: '点击封面，方块旋转到下一面，依次展示四个章节；支持 Enter、空格和演示一次。' },
  equalizer: { name: '声波律动', tip: '点击封面，18 根音柱随预设节奏起伏，结束后恢复静止。仅为视觉演示，不播放或采集音频。' },
  elasticgrid: { name: '弹性网格', tip: '在色块网格上移动鼠标，附近色块被推开；离开后弹回。点击、Enter 或空格可自动演示。' },
  fan: { name: '折扇展开', tip: '点击封面，七张色卡依次展开成扇形；再次点击收拢。支持 Enter、空格和演示一次。' },
  mosaic: { name: '像素拼图', tip: '点击封面，36 块图形散开；再次点击按顺序拼回。支持 Enter 和空格。这是图块动画，不是 HTML 页面破碎。' },
  wipe: { name: '擦除对比', tip: '拖动封面底部滑杆，比较同一构图的线稿与配色；方向键微调，Home / End 查看完整两端。' },
  pulse: { name: '同心波纹', tip: '点击封面任意位置，五圈波纹从落点扩散；Enter / 空格从中心释放。此为 GSAP 图形演示。' },
  orbit: { name: '环形文字', tip: '点击封面，内外两圈文字反向旋转一周；中间花形同步转动。支持 Enter、空格和演示一次。' },
  spotlight: { name: '聚光探索', tip: '移动鼠标，让圆形光束跟随并照亮隐藏画面；方向键移动光束，点击或 Enter 演示巡游。' },
  fold: { name: '立体折页', tip: '点击封面，两扇纸页向外折开，露出里面的日落；再次点击合上。支持 Enter 和空格。' },
  counter: { name: '数字翻牌', tip: '点击封面，三位数字错峰翻转，依次显示 011、128、360；支持 Enter 和空格，数字仅为演示。' },
  shutter: { name: '百叶切换', tip: '点击封面，六条色带依次扫过并切换文字；再次点击返回，支持 Enter 和空格。' },
  path: { name: '路径巡游', tip: '点击封面或“演示一次”，箭头沿曲线路径绕行一周，朝向随路径变化。' },
  deck: { name: '层叠轮播', tip: '点击封面依次浏览三张文字卡片，观察出场、换层和入场的连续动画。' },
  drag: { name: '拖拽回弹', tip: '按住封面拖动，松开后弹回原位。键盘方向键也能推动卡片，Enter 可演示。' },
  press: { name: '弹性按压', tip: '按住绿色封面让它压扁，松开后弹性恢复；也可点击“演示一次”。' },
  iris: { name: '圆形揭幕', tip: '点击封面，从圆形窗口展开新画面；再次点击收回。支持 Enter 和空格键。' },
  magnet: { name: '磁吸按钮', tip: '移动到“阅读本期”按钮上，文字与箭头会跟随鼠标；按钮仍可点击。' },
  tilt: { name: '卡片倾斜', tip: '在绿色封面上移动鼠标，卡片随位置倾斜；点击或按 Enter 可演示一次。' },
  decode: { name: '文字解码', tip: '移入或点击绿色封面，看随机字符逐渐还原为 Ideas in motion。' },
  flip: { name: '点击翻牌', tip: '点击绿色封面查看背面，再次点击返回；也支持 Enter 和空格键。' },
};

// Animate the button contents while keeping its clickable area stationary.
export function useMagneticButton(rootRef, enabled, demo) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const button = rootRef.current.querySelector('.read-button');
    const inner = button.querySelector('.magnetic-content');
    const ctx = gsap.context(() => {}, button);
    let move, leave;
    ctx.add(() => {
      const x = gsap.quickTo(inner, 'x', { duration: .3, ease: 'power3.out' });
      const y = gsap.quickTo(inner, 'y', { duration: .3, ease: 'power3.out' });
      move = e => {
        if (e.pointerType === 'touch') return;
        const r = button.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .18);
        y((e.clientY - r.top - r.height / 2) * .25);
      };
      leave = () => { x(0); y(0); };
      if (demo) gsap.timeline().to(inner, { x: 14, y: -4, duration: .35 })
        .to(inner, { x: -14, y: 4, duration: .5 }).to(inner, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1,.4)' });
    });
    button.addEventListener('pointermove', move);
    button.addEventListener('pointerleave', leave);
    button.addEventListener('blur', leave);
    return () => {
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerleave', leave);
      button.removeEventListener('blur', leave);
      ctx.revert();
    };
  }, [enabled, demo, rootRef]);
}

export function InteractiveCover(props) {
  if (journeyStudies[props.mode]) return <Suspense fallback={<OriginalCover mode="none"/>}><JourneyStudy key={props.mode} {...props}/></Suspense>;
  if (atelierStudies[props.mode]) return <Suspense fallback={<OriginalCover mode="none"/>}><AtelierStudy key={props.mode} {...props}/></Suspense>;
  if (collectionStudies[props.mode]) return <Suspense fallback={<OriginalCover mode="none"/>}><CollectionStudy key={props.mode} {...props}/></Suspense>;
  if (['calendar','radar','zipper'].includes(props.mode)) return <SequenceStudy key={props.mode} {...props}/>;
  if (['matrix','ribbon','comet'].includes(props.mode)) return <MotionStudy key={props.mode} {...props}/>;
  if (['morph','galaxy','gallery','draw','corridor','kaleido'].includes(props.mode)) return <ShapeStudy key={props.mode} {...props}/>;
  return ['wipe','pulse','orbit','elasticgrid','fan','mosaic','daynight','cube','equalizer'].includes(props.mode) ? <ExtraStudy key={props.mode} {...props}/> : <OriginalCover {...props}/>;
}

function OriginalCover({ mode = 'none', demo = 0 }) {
  const root = useRef(null), actions = useRef({});
  const [flipped, setFlipped] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);
  const canInteract = Boolean(interactions[mode]) && mode !== 'magnet';
  const coverWords = mode === 'deck' ? [['Ideas','in','motion.'],['Form','meets','function.'],['Less','but','better.']][deckIndex]
    : mode === 'shutter' && flipped ? ['Different','by','design.'] : ['Ideas','in','motion.'];
  useLayoutEffect(() => {
    const element = root.current;
    const turn = element.querySelector('.cover-turn');
    const words = [...element.querySelectorAll('.decode-word')];
    const iris = element.querySelector('.cover-iris');
    const initialRootStyle = element.getAttribute('style');
    const initialTurnStyle = turn.getAttribute('style');
    let draggable, activeDemo;
    let isBack = false;
    let index = 0;
    let lightX = 50, lightY = 50;
    setFlipped(false);
    setDeckIndex(0);
    const ctx = gsap.context(() => {}, element);
    ctx.add('release', () => {
      activeDemo?.kill();
      gsap.to(turn, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 1.15, ease: 'elastic.out(1,.35)', overwrite: true });
    });
    ctx.add('press', () => {
      activeDemo?.kill();
      gsap.to(turn, { scaleX: 1.06, scaleY: .84, rotation: -2, duration: .18, overwrite: true });
    });
    ctx.add('activate', () => {
      if (mode === 'spotlight') {
        activeDemo?.kill();
        const light = element.querySelector('.spotlight-reveal');
        activeDemo = gsap.timeline().to(light, { '--light-x': '24%', '--light-y': '28%', duration: .65, overwrite: true })
          .to(light, { '--light-x': '76%', '--light-y': '65%', duration: 1.1, ease: 'sine.inOut' })
          .to(light, { '--light-x': '50%', '--light-y': '50%', duration: .75, ease: 'power2.out' });
        lightX = 50; lightY = 50;
      } else if (mode === 'fold') {
        isBack = !isBack;
        setFlipped(isBack);
        gsap.to(element.querySelector('.fold-left'), { rotationY: isBack ? -115 : 0, duration: 1.1, ease: 'power3.inOut', overwrite: true });
        gsap.to(element.querySelector('.fold-right'), { rotationY: isBack ? 115 : 0, duration: 1.1, delay: .08, ease: 'power3.inOut', overwrite: true });
      } else if (mode === 'counter') {
        if (activeDemo?.isActive()) return;
        index = (index + 1) % 3;
        const digits = element.querySelectorAll('.counter-digit');
        activeDemo = gsap.timeline().to(digits, { rotationX: 90, duration: .32, stagger: .09, ease: 'power2.in' })
          .call(() => setDeckIndex(index)).set(digits, { rotationX: -90 })
          .to(digits, { rotationX: 0, duration: .5, stagger: .09, ease: 'back.out(1.3)' });
      } else if (mode === 'shutter') {
        if (activeDemo?.isActive()) return;
        const slats = element.querySelectorAll('.shutter-slat');
        isBack = !isBack;
        activeDemo = gsap.timeline().set(slats, { transformOrigin: 'left center' })
          .to(slats, { scaleX: 1, duration: .38, stagger: .055, ease: 'power2.inOut' })
          .call(() => setFlipped(isBack)).set(slats, { transformOrigin: 'right center' })
          .to(slats, { scaleX: 0, duration: .45, stagger: .055, ease: 'power2.inOut' });
      } else if (mode === 'path') {
        activeDemo?.kill();
        const path = element.querySelector('.motion-route');
        const traveler = element.querySelector('.path-traveler');
        gsap.set(traveler, { motionPath: { path, align: path, alignOrigin: [.5,.5], autoRotate: true, start: 0, end: 0 } });
        activeDemo = gsap.to(traveler, { duration: 5, ease: 'none', motionPath: { path, align: path, alignOrigin: [.5,.5], autoRotate: true } });
      } else if (mode === 'deck') {
        if (activeDemo?.isActive()) return;
        const front = element.querySelector('.cover-front');
        index = (index + 1) % 3;
        activeDemo = gsap.timeline().to(front, { xPercent: -115, rotation: -8, autoAlpha: 0, duration: .4, ease: 'power2.in' })
          .call(() => setDeckIndex(index)).set(front, { xPercent: 115, rotation: 8 })
          .to(front, { xPercent: 0, rotation: 0, autoAlpha: 1, duration: .6, ease: 'power3.out' });
      } else if (mode === 'flip') {
        isBack = !isBack;
        setFlipped(isBack);
        gsap.to(turn, { rotationY: isBack ? 180 : 0, duration: .85, ease: 'power3.inOut', overwrite: true });
      } else if (mode === 'iris') {
        isBack = !isBack;
        setFlipped(isBack);
        gsap.to(iris, { clipPath: `circle(${isBack ? 150 : 0}% at 50% 50%)`, duration: 1.25, ease: 'power3.inOut', overwrite: true });
      } else if (mode === 'press') {
        activeDemo?.kill();
        activeDemo = gsap.timeline().to(turn, { scaleX: 1.06, scaleY: .84, rotation: -2, duration: .2, overwrite: true })
          .to(turn, { scaleX: 1, scaleY: 1, rotation: 0, delay: .25, duration: 1.15, ease: 'elastic.out(1,.35)' });
      } else if (mode === 'drag') {
        activeDemo?.kill();
        activeDemo = gsap.timeline().to(turn, { x: -18, y: 14, duration: .35, overwrite: true })
          .to(turn, { x: 18, y: -14, duration: .6 }).to(turn, { x: 0, y: 0, duration: 1.15, ease: 'elastic.out(1,.35)' });
      } else if (mode === 'decode') {
        words.forEach((word, i) => gsap.to(word, {
          duration: 1.8, delay: i * .1, overwrite: true,
          scrambleText: { text: word.dataset.word, chars: '01#*+-', revealDelay: .3, speed: .4 },
        }));
      } else if (mode === 'tilt') {
        gsap.timeline().to(turn, { rotationY: 14, rotationX: -9, duration: .4 })
          .to(turn, { rotationY: -14, rotationX: 9, duration: .6 })
          .to(turn, { rotationY: 0, rotationX: 0, duration: .6, ease: 'power3.out' });
      }
    });
    ctx.add(() => {
      if (mode === 'spotlight') {
        const light = element.querySelector('.spotlight-reveal');
        ctx.add('lightTo', (x, y) => {
          activeDemo?.kill();
          lightX = Math.max(10, Math.min(90, x)); lightY = Math.max(10, Math.min(90, y));
          gsap.to(light, { '--light-x': `${lightX}%`, '--light-y': `${lightY}%`, duration: .28, ease: 'power2.out', overwrite: true });
        });
        actions.current.move = e => {
          if (e.pointerType === 'touch') return;
          const r = element.getBoundingClientRect();
          ctx.lightTo((e.clientX-r.left)/r.width*100, (e.clientY-r.top)/r.height*100);
        };
        actions.current.leave = () => ctx.lightTo(50, 50);
        actions.current.nudge = key => ctx.lightTo(lightX+(key==='ArrowRight'?12:key==='ArrowLeft'?-12:0),lightY+(key==='ArrowDown'?12:key==='ArrowUp'?-12:0));
      }
      if (mode === 'shutter') gsap.set(element.querySelectorAll('.shutter-slat'), { scaleX: 0 });
      if (mode === 'path') {
        const path = element.querySelector('.motion-route');
        gsap.set(element.querySelector('.path-traveler'), { motionPath: { path, align: path, alignOrigin: [.5,.5], autoRotate: true, start: 0, end: 0 } });
      }
      if (mode === 'drag') {
        [draggable] = Draggable.create(turn, {
          type: 'x,y', trigger: element, bounds: { minX: -18, maxX: 18, minY: -22, maxY: 22 },
          edgeResistance: 1, cursor: 'grab', activeCursor: 'grabbing', dragClickables: true,
          onPress: () => { activeDemo?.kill(); gsap.killTweensOf(turn); },
          onDragEnd: () => ctx.release(),
        });
        ctx.add('nudge', key => {
          activeDemo?.kill();
          activeDemo = gsap.timeline().to(turn, { x: key==='ArrowLeft'?-18:key==='ArrowRight'?18:0,
            y: key==='ArrowUp'?-22:key==='ArrowDown'?22:0, duration: .25, overwrite: true })
            .to(turn, { x: 0, y: 0, delay: .2, duration: 1.15, ease: 'elastic.out(1,.35)' });
        });
        actions.current.nudge = key => ctx.nudge(key);
      }
      if (mode === 'press') {
        actions.current.down = () => ctx.press();
        actions.current.up = () => ctx.release();
        actions.current.leave = () => ctx.release();
      }
      if (mode === 'tilt') {
        const x = gsap.quickTo(turn, 'rotationX', { duration: .4, ease: 'power3.out' });
        const y = gsap.quickTo(turn, 'rotationY', { duration: .4, ease: 'power3.out' });
        actions.current.move = e => {
          if (e.pointerType === 'touch') return;
          const r = element.getBoundingClientRect();
          x(-(e.clientY - r.top - r.height / 2) / r.height * 24);
          y((e.clientX - r.left - r.width / 2) / r.width * 30);
        };
        actions.current.leave = () => { x(0); y(0); };
      }
    });
    actions.current.activate = () => ctx.activate();
    if (demo && canInteract) ctx.activate();
    return () => {
      actions.current = {};
      activeDemo?.kill();
      draggable?.kill();
      ctx.revert();
      if (initialTurnStyle === null) turn.removeAttribute('style');
      else turn.setAttribute('style', initialTurnStyle);
      if (initialRootStyle === null) element.removeAttribute('style');
      else element.setAttribute('style', initialRootStyle);
      words.forEach(word => { word.textContent = word.dataset.word; });
    };
  }, [mode, demo]);

  const label = mode === 'flip' ? (flipped ? '翻回封面正面' : '翻看封面背面')
    : mode === 'spotlight' ? '探索聚光封面，方向键移动光束' : mode === 'fold' ? (flipped ? '合上立体折页' : '打开立体折页')
    : mode === 'counter' ? `切换数字翻牌，当前 ${['011','128','360'][deckIndex]}`
    : mode === 'shutter' ? '切换百叶封面' : mode === 'path' ? '播放路径巡游' : mode === 'deck' ? `切换层叠卡片，当前第 ${deckIndex+1} 张`
    : mode === 'iris' ? (flipped ? '收回圆形揭幕' : '展开圆形揭幕')
    : mode === 'drag' ? '拖动封面或用方向键推动' : mode === 'press' ? '按压封面并回弹'
    : mode === 'decode' ? '播放封面文字解码' : mode === 'tilt' ? '演示封面倾斜' : 'Ideas in motion 文字封面';
  return <div ref={root} className={`cover-stage mode-${mode} ${canInteract ? 'interactive-cover' : ''}`}
    role={canInteract ? 'button' : undefined} tabIndex={canInteract ? 0 : undefined}
    aria-label={label} aria-pressed={['flip','iris','shutter','fold'].includes(mode) ? flipped : undefined}
    onClick={e => { if (!['drag','press'].includes(mode) || e.detail===0) actions.current.activate?.(); }}
    onKeyDown={e => {
      if (['drag','spotlight'].includes(mode) && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); actions.current.nudge?.(e.key); }
      if (canInteract && ['Enter', ' '].includes(e.key)) { e.preventDefault(); actions.current.activate?.(); }
    }}
    onPointerDown={e => { if (mode==='press') { e.currentTarget.setPointerCapture(e.pointerId); actions.current.down?.(); } }}
    onPointerUp={() => actions.current.up?.()} onPointerCancel={() => actions.current.up?.()}
    onPointerEnter={() => { if (mode === 'decode') actions.current.activate?.(); }}
    onPointerMove={e => actions.current.move?.(e)} onPointerLeave={() => actions.current.leave?.()} onBlur={() => actions.current.leave?.()}>
    <div className="cover-turn">
      {mode === 'deck' && <><div className="deck-ghost ghost-a" aria-hidden="true"/><div className="deck-ghost ghost-b" aria-hidden="true"/></>}
      <div className={`type-cover cover-front ${mode==='shutter'&&flipped?'alternate-front':''} ${mode==='deck'?`deck-${deckIndex}`:''}`} aria-hidden={['spotlight','fold','counter'].includes(mode)||(flipped&&['flip','iris'].includes(mode))}>
        <span className="cover-top hero-reveal">THE VISUAL ISSUE</span>
        <div className="cover-title hero-reveal" aria-label={coverWords.join(' ')}>
          <span className="decode-word" data-word={coverWords[0]} aria-hidden="true">{coverWords[0]}</span><br/>
          <em className="decode-word" data-word={coverWords[1]} aria-hidden="true">{coverWords[1]}</em><br/>
          <span className="decode-word" data-word={coverWords[2]} aria-hidden="true">{coverWords[2]}</span>
        </div>
        <div className="cover-bottom hero-reveal"><span>形式随内容而生</span><span>2026 — 09</span></div>
        {canInteract && <span className="cover-cue">{mode==='deck'?`${deckIndex+1} / 3 · 点击下一张 ↗`:mode==='path'?'点击沿路径运动 ↗':mode==='shutter'?'点击百叶切换 ↗':mode === 'drag' ? '拖动 · 松开回弹 ↗' : mode === 'press' ? '按住 · 松开回弹 ↗' : mode === 'iris' ? '点击揭幕 ↗' : mode === 'flip' ? '点击翻面 ↗' : mode === 'decode' ? '点击解码 ↗' : '移动鼠标 · 点击演示 ↗'}</span>}
      </div>
      {mode === 'spotlight' && <div className="study-surface spotlight-surface" aria-hidden="true">
        <span className="study-kicker">LIGHT / REVEAL</span><h2>Keep<br/><em>looking.</em></h2><div className="spotlight-reveal"><div className="light-orbits"/><strong>好奇，<br/>让细节发光。</strong></div><small>移动鼠标 · 方向键探索 ↗</small>
      </div>}
      {mode === 'fold' && <div className="study-surface fold-surface" aria-hidden="true">
        <div className="fold-inside"><span className="study-kicker">A NEW HORIZON</span><div className="paper-sun"/><div className="paper-hill"/><h2>展开，<br/>才有发现。</h2><small>再次点击，合上纸页 ↗</small></div>
        <div className="fold-door fold-left"><span>OPEN</span><strong>向</strong><small>点击</small></div><div className="fold-door fold-right"><span>YOUR MIND</span><strong>内</strong><small>探索 ↗</small></div>
      </div>}
      {mode === 'counter' && <div className="study-surface counter-surface" aria-hidden="true">
        <span className="study-kicker">THE NEXT CHAPTER</span><p>每一步，<br/>都有新的可能。</p><div className="counter-display">{['011','128','360'][deckIndex].split('').map((digit,i)=><div className="counter-slot" key={i}><span className="counter-digit">{digit}</span></div>)}</div><div className="counter-steps">{['011','128','360'].map((n,i)=><span className={deckIndex===i?'active':''} key={n}>{n}</span>)}</div><small>点击翻向下一组数字 ↗</small>
      </div>}
      {mode === 'shutter' && <div className="shutter-overlay" aria-hidden="true">{Array.from({length:6},(_,i)=><div className="shutter-slat" key={i}/>)}</div>}
      {mode === 'path' && <svg className="path-overlay" viewBox="0 0 240 360" preserveAspectRatio="none" aria-hidden="true">
        <path className="motion-route" d="M24 52 C24 12 216 12 216 52 L216 292 C216 346 24 346 24 292 Z" fill="none" stroke="#667641" strokeWidth="1" strokeDasharray="4 5"/>
        <g className="path-traveler"><circle r="10" fill="#763df0"/><path d="M-4 -4 L4 0 L-4 4" fill="none" stroke="white" strokeWidth="2"/></g>
      </svg>}
      {mode === 'flip' && <div className="cover-reverse" aria-hidden={!flipped}>
        <span className="cover-top">BEHIND THE DESIGN</span><span className="reverse-number">011</span>
        <h2>好看之外，<br/>还有回应。</h2><p>每一次点击，都让页面<br/>从画面变成体验。</p>
        <span className="cover-cue">再次点击，返回正面 ↗</span>
      </div>}
      {mode === 'iris' && <div className="cover-iris" aria-hidden={!flipped}>
        <span>ANOTHER PERSPECTIVE</span><div className="iris-orbit" aria-hidden="true"/>
        <h2>换个角度，<br/>看见可能。</h2><p>一个圆，打开另一种视角。</p><small>再次点击，收回画面 ↗</small>
      </div>}
    </div>
  </div>;
}
