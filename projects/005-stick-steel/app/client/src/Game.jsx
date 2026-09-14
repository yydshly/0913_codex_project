import { useEffect, useRef, useState } from 'react';
import { Swords, GraduationCap, RotateCcw, Settings2, CircleHelp, Volume2, VolumeX, X, Play, ChevronRight, Pause, Maximize, ArrowLeft, Shield } from 'lucide-react';
import { WeaponPreview } from './components/weapon-preview';
import { CombatControls } from './components/combat-controls';
import { WEAPON_ASSETS } from '../lib/duel/weapon-assets';

const weapons = [{ id: 'sword', name: '单手剑', note: '轻快 · 均衡' }, { id: 'mace', name: '铁头锤', note: '沉重 · 击倒' }, { id: 'greatsword', name: '双手长剑', note: '长距 · 双持' }];
const controls = [['W A S D / 方向键', '前进、后退与侧绕'], ['鼠标左键 + 拖动', '顺着手势挥动武器'], ['鼠标右键 + 拖动', '调整格挡方向'], ['Space / C', '快速横斩 / 向下劈砍'], ['Shift / F', '突进 / 空手推击'], ['E / 长按 E', '拾取武器 / 起身或攀爬'], ['G', '丢下武器或松开悬边的手'], ['鼠标中键 / 滚轮', '环视 / 缩放'], ['Q / R / Esc', '慢动作 / 重置 / 暂停']];
const stateNames = { Ready: '就绪', Guarding: '格挡', 'Winding up': '蓄力', Striking: '挥击', Recovering: '收招', Staggered: '失衡', Down: '倒下', Unarmed: '空手', Reaching: '拾取中', 'Knocked down': '被击倒', 'Getting up': '起身', 'Holding the edge': '抓住桥边', Climbing: '攀爬', Falling: '坠落', 'Counter ready': '反击时机' };
function stateLabel(s = '') { return s.split(' · ').map(v => v === 'Bleeding' ? '流血' : stateNames[v] || v).join(' · '); }
function Modal({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={ref} className="panel" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) close(); }}><div className="panel-body"><header><h2>{title}</h2><button aria-label="关闭面板" className="icon-button" onClick={close}><X size={20}/></button></header>{children}</div></dialog>;
}
export function Game() {
  const host = useRef(null), api = useRef(null);
  const [engine, setEngine] = useState(null), [status, setStatus] = useState(null), [error, setError] = useState('');
  const [panel, setPanel] = useState(null), [touch, setTouch] = useState(false), [volume, setVolume] = useState(.65);
  useEffect(() => {
    let cancelled = false, instance;
    import('../lib/duel/scene').then(async ({ createDuel }) => {
      if (cancelled || !host.current) return;
      instance = await createDuel(host.current, s => { if (!cancelled) setStatus(s); });
      if (cancelled) { instance.dispose(); return; }
      api.current = instance; setEngine(instance); instance.setVolume('effects', .65); instance.setVolume('crowd', .3);
    }).catch(e => { console.error(e); if (!cancelled) setError('竞技场未能启动。请确认浏览器已开启硬件加速，然后重新加载。'); });
    return () => { cancelled = true; instance?.dispose(); api.current = null; };
  }, []);
  useEffect(() => { const mq = matchMedia('(pointer: coarse)'); const update = () => setTouch(mq.matches); update(); mq.addEventListener('change', update); return () => mq.removeEventListener('change', update); }, []);
  const ready = !!engine, training = status?.tutorial, phase = status?.phase;
  const home = phase === 'ready' && !training;
  const modal = panel || (status?.paused ? 'pause' : null);
  const open = kind => { api.current?.setPaused(true); setPanel(kind); };
  const close = () => { setPanel(null); api.current?.setPaused(false); };
  const reset = () => { setPanel(null); api.current?.exitTutorial(); api.current?.setPractice(false); api.current?.configure({ ledgeDrill: false }); api.current?.setSlow(false); };
  const start = () => { setPanel(null); api.current?.setPaused(false); api.current?.start(); };
  const train = () => { setPanel(null); api.current?.startTutorial(); };
  const selected = status?.options.playerWeapon || 'sword';
  let hint = status?.states[0]?.includes('Holding the edge') ? '抓住了！长按 E 爬上来，G 松手' : status?.states[0]?.includes('Knocked down') ? '长按 E 重新站起来' : status?.weapons[0] === 'Empty hands' ? '靠近地上的武器，按 E 拾取' : status?.states[1]?.includes('Holding the edge') ? '对手悬在桥边：C 向下劈砍' : status?.states[0]?.includes('Counter ready') ? '格挡成功，现在反击！' : status?.slow ? '四分之一速度 · 再按 Q 恢复' : '找好距离，接住对方的剑，再反击。';
  const lesson = training?.step;
  const tutorialCopy = { move: ['先走两步', '依次向四个方向移动，感受脚下的空间。'], swing: ['让剑跟着手走', '按住鼠标左键，上下拖动，完成两次挥剑。'], hit: ['击中木人', '靠近木人，按住左键挥剑，完成两次有效命中。'], parry: ['接住这一剑', '按住鼠标右键，拖动武器迎向木人的攻击。'], great: ['漂亮的格挡！', '碰撞创造机会，下一步就是反击。'], complete: ['准备好决斗了', '你已经学会移动、挥剑与格挡。'] };
  return <main className={'game ' + (home ? 'is-home' : '')}>
    <div ref={host} className="canvas-host"/>
    <div className="topline"><button onClick={() => open('about')} className="project-mark">005 <span>/</span> PLAY STUDIES</button><span className="edition">离线练习版</span></div>
    {home && <><div className="arena-heading"><span>STICK & STEEL</span><h1>纸上决斗</h1><p>THE SPLINTER PIT</p></div><section className="home-panel" aria-label="开始游戏"><span className="eyebrow">一座窄桥，两位剑客。</span><h2>来过两招？</h2><p className="intro">握紧你的剑。胜负，就在一挥之间。</p><button className="primary wide" disabled={!ready} onClick={start}><Swords size={21}/>与机器人对战<ChevronRight size={18}/></button><button className="secondary wide" disabled={!ready} onClick={train}><GraduationCap size={20}/>进入训练场<ChevronRight size={18}/></button><div className="weapon-label"><span>选择你的武器</span><span>01 — 03</span></div><div className="weapons" role="group" aria-label="选择武器">{weapons.map(w => <button key={w.id} className={'weapon-card ' + (selected === w.id ? 'selected' : '')} aria-pressed={selected === w.id} disabled={!ready} onClick={() => api.current.configure({ playerWeapon: w.id })}><WeaponPreview asset={WEAPON_ASSETS[w.id]} name={w.name}/><strong>{w.name}</strong><small>{w.note}</small></button>)}</div><p className="first-tip"><CircleHelp size={14}/>第一次玩？从训练场开始。</p></section></>}
    {!home && status && !training && <><div className="health-row">{['你', '挑战者'].map((name, i) => <section key={name} className={'health ' + (i ? 'rival' : '')} aria-label={name + '状态'}><div><strong>{name}</strong><b>{status.hp[i]}</b></div><progress max="100" value={status.hp[i]} aria-label={name + '生命值'}/><meter min="0" max="100" value={status.stamina[i]} aria-label={name + '体力'}/><span>{stateLabel(status.states[i])}</span></section>)}</div><div className="bout-stats"><span>命中 {status.hits}</span><span>格挡 {status.blocks}</span><span>脱手 {status.disarms}</span></div></>}
    {training && <><div className="training-heading"><span>THE PRACTICE YARD</span><h2>练习庭院</h2><button className="text-button" onClick={() => api.current.exitTutorial()}>返回竞技场</button></div><section className="lesson"><span className="eyebrow">{['move','swing','hit','parry','great','complete'].indexOf(lesson)+1} / 6 · 实战教学</span><h2>{tutorialCopy[lesson]?.[0]}</h2><p>{tutorialCopy[lesson]?.[1]}</p>{lesson === 'move' && <div className="key-progress">{['W','A','S','D'].map((k,i) => <kbd className={training.movement[i]>=1?'done':''} key={k}>{k}</kbd>)}</div>}{lesson === 'swing' && <span>已完成 {training.practiceSwings} / 2 次挥剑</span>}{lesson === 'hit' && <span>已命中 {training.hits} / 2 次</span>}{lesson === 'complete' && <button className="primary" onClick={start}>开始决斗<ChevronRight size={18}/></button>}</section></>}
    {phase === 'fighting' && !training && <div className="context-hint" aria-live="polite">{hint}</div>}
    {phase === 'finished' && status?.resultReady && <section className="result"><span>THE DUEL IS OVER</span><h2>{status.winner === 0 ? '这一局，你赢了。' : '再来一场？'}</h2><p>命中 {status.hits} 次 · 格挡 {status.blocks} 次</p><button className="primary" onClick={() => { api.current.reset(); api.current.start(); }}><RotateCcw size={18}/>再战一局</button><button className="text-button" onClick={reset}>返回武器选择</button></section>}
    {!ready && <div className="loading" role="status"><span>STICK & STEEL</span><h2>{error ? '暂时无法进入' : '正在布置竞技场…'}</h2><p>{error || '准备关节、武器与一场决斗。'}</p>{error && <button className="primary" onClick={() => location.reload()}>重新加载</button>}</div>}
    <footer className="toolbar"><button onClick={() => open('controls')}><CircleHelp size={17}/><span><b>WASD</b> 移动 <i>·</i> 鼠标挥剑与格挡</span></button><div><button aria-label={status?.muted?'开启声音':'静音'} onClick={() => api.current?.setMuted(!status?.muted)}>{status?.muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>{!home && <button aria-pressed={status?.slow || false} onClick={() => api.current?.setSlow(!status?.slow)}><span>¼ 慢动作</span></button>}<button onClick={() => open('settings')}><Settings2 size={17}/><span>菜单</span><kbd>Esc</kbd></button><button aria-label="全屏" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(()=>{}); }}><Maximize size={16}/></button></div></footer>
    {touch && phase === 'fighting' && !modal && <CombatControls api={engine} lesson={lesson === 'move' ? 'move' : lesson === 'parry' ? 'parry' : training ? 'swing' : undefined}/>}
    {!touch && phase === 'fighting' && !modal && !training && <div className="quick-actions" aria-label="快捷战斗操作"><button onClick={() => api.current?.slash()}><Swords size={16}/>挥剑 <kbd>Space</kbd></button><button onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); api.current?.guard(true); }} onPointerUp={() => api.current?.guard(false)} onPointerCancel={() => api.current?.guard(false)} onLostPointerCapture={() => api.current?.guard(false)}><Shield size={16}/>按住格挡</button><button onClick={() => api.current?.setPaused(true)} aria-label="暂停"><Pause size={16}/></button></div>}
    {modal && <Modal title={modal === 'controls' ? '出招之前' : modal === 'about' ? '关于这座竞技场' : '稍作休息'} close={close}>{modal === 'controls' ? <><p>鼠标左键引导剑路，右键调整格挡；碰撞、距离和惯性共同决定结果。</p><dl className="controls-list">{controls.map(([a,b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl><button className="primary wide" onClick={close}><Play size={17}/>回到竞技场</button></> : modal === 'about' ? <><p>005 · Stick & Steel 手绘物理格斗研究。</p><p>基于 Rab Neba 的 MIT 开源物理与渲染模块制作，新增中文离线界面。人物、武器和地形均在浏览器中实时运行。</p><a href="https://github.com/Rabneba/stick-steel" target="_blank" rel="noreferrer">查看原始项目</a><p className="muted">本版提供单机训练与机器人对战。</p></> : <><div className="settings-grid"><label>对战场地<select value={status?.options.arena || 'bridge'} disabled={!!training} onChange={e => { api.current.configure({arena:e.target.value}); api.current.setPaused(true); }}><option value="bridge">断木桥 · 小心边缘</option><option value="yard">练习庭院 · 开阔地面</option></select></label><label>对手武器<select value={status?.options.rivalWeapon || 'sword'} disabled={!!training} onChange={e => { api.current.configure({rivalWeapon:e.target.value}); api.current.setPaused(true); }}>{weapons.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label><label>声音音量 <span>{Math.round(volume*100)}%</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => { const v=+e.target.value; setVolume(v); api.current.setVolume('effects',v); api.current.setVolume('crowd',v*.46); }}/></label></div><button className="secondary wide" onClick={() => { setPanel(null); api.current.exitTutorial(); api.current.ledgeDrill(); api.current.start(); }}>悬边练习<ChevronRight size={18}/></button><button className="secondary wide" onClick={train}><GraduationCap size={17}/>重看教学</button><button className="primary wide" onClick={close}><Play size={17}/>{phase === 'fighting'?'继续决斗':'回到竞技场'}</button><button className="text-button wide" onClick={reset}><ArrowLeft size={16}/>重新选择武器</button></>}</Modal>}
  </main>;
}
