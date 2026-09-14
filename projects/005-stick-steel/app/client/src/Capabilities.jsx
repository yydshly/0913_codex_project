import { useEffect, useRef, useState } from 'react';
import { Move, Activity, Hand, Swords, ArrowUpFromLine, ScanEye, ArrowUpRight, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, BookOpen, Check, Volume2, VolumeX } from 'lucide-react';
import { capabilities } from './capabilities-data';
import './capabilities.css';
const icons = {Move,Activity,Hand,Swords,ArrowUpFromLine,ScanEye};
const catchLabels = { idle:'等待接球', reaching:'伸手接球', incoming:'来球途中', holding:'已握住', windup:'准备投出', throwing:'释放中', released:'已投出', missed:'未接住' };
const bodyLabels = {'Ready':'就绪','Guarding':'格挡','Winding up':'蓄力','Striking':'挥动','Recovering':'收招','Staggered':'失衡','Down':'倒下','Unarmed':'空手','Reaching':'拾取中','Knocked down':'倒地','Getting up':'起身','Holding the edge':'悬挂','Climbing':'攀爬中','Falling':'坠落','Counter ready':'反击时机','Bleeding':'流血'};
const bodyLabel = value => (value || '').split(' · ').map(v => bodyLabels[v] || v).join(' · ');
const isHeld = value => value && value !== 'Empty hands';
function HoldButton({children, down, up, disabled}) {
  return <button disabled={disabled} onPointerDown={e => {e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);down();}} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onKeyDown={e=>{if([' ','Enter'].includes(e.key)&&!e.repeat){e.preventDefault();down();}}} onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();up();}}} onBlur={up}>{children}</button>;
}
function Demo({item}) {
  const host=useRef(null), api=useRef(null);
  const [status,setStatus]=useState(null), [ready,setReady]=useState(false),[error,setError]=useState('');
  const [strength,setStrength]=useState(.85), [power,setPower]=useState(11), [weapon,setWeapon]=useState('sword');
  const [actionNote,setActionNote]=useState('');
  const isRig=item.engine==='rig';
  function preset(instance) {
    if(isRig) {instance.setPaused(false);instance.setSlow(false);instance.setStrength(.85);instance.setPower(11);instance.reset();instance.setMode(item.id==='pose'?'pose':item.id==='camera'?'view':'throw');}
    else {instance.exitTutorial();instance.setPractice(true);instance.configure({arena:item.id==='ledge'?'bridge':'yard',playerWeapon:'sword',rivalWeapon:'sword'});if(item.id==='ledge')instance.ledgeDrill();instance.setMuted(true);instance.start();instance.setSlow(false);if(item.id==='ledge')instance.setPaused(true);}
  }
  useEffect(()=>{
    let cancelled=false,instance;
    const initialize=async()=>{
      const module=await (isRig?import('../lib/rig/scene'):import('../lib/duel/scene'));
      if(cancelled||!host.current)return;
      const update=s=>{if(!cancelled)setStatus(s);};
      instance=await (isRig?module.createPlayground(host.current,update,{seedBalls:false}):module.createDuel(host.current,update,{capturePointer:false,showcase:true}));
      if(cancelled){instance.dispose();return;}api.current=instance;preset(instance);setReady(true);
    };
    initialize().catch(e=>{console.error(e);if(!cancelled)setError('演示未能启动，请重新加载页面。');});
    return()=>{cancelled=true;instance?.dispose();api.current=null;};
  },[item.id]);
  const reset=()=>{if(!api.current)return;preset(api.current);setStrength(.85);setPower(11);setWeapon('sword');setActionNote('场景已重置，可以重复观察。');};
  const act=(fn,note)=>{if(!ready)return;fn(api.current);setActionNote(note);};
  const blocked=!ready||status?.paused;
  const paused=status?.paused||false, slow=status?.slow||false;
  const metrics=isRig
    ? item.id==='catch'?[['交互状态',catchLabels[status?.catchPhase]||'准备中'],['实际接触',status?.hits??'—'],['场内球数',status?.balls??'—']]
    :[['控制状态',status?(status.ragdoll?'自由倒下':'姿态驱动'):'准备中'],['实际接触',status?.hits??'—'],['躯干高度',status?status.height.toFixed(2)+' m':'—']]
    :item.id==='ledge'?[['蓝方状态',bodyLabel(status?.states[1])||'准备中'],['蓝方体力',status?status.stamina[1]+'%':'—'],['速度',slow?'¼ 倍速':'正常']]
    :[['手中物体',status?(isHeld(status.weapons[0])?'已握持':'空手'):'准备中'],['实际命中',status?.hits??'—'],['实际格挡',status?.blocks??'—']];
  return <div className="cap-demo">
    <div className="cap-stage">
      <div ref={host} className="cap-canvas"/>
      <div className="cap-stage-top"><span className="cap-live"><i/>实时交互</span><span>{item.number} / 06</span></div>
      <div className="cap-stage-tools"><button disabled={!ready} aria-label={paused?'继续演示':'暂停演示'} onClick={()=>api.current.setPaused(!paused)}>{paused?<Play size={17}/>:<Pause size={17}/>}</button><button disabled={!ready} aria-label="重置演示" onClick={reset}><RotateCcw size={17}/></button></div>
      {(!ready||error)&&<div className="cap-loading" role="status"><span>{error||'正在准备交互场景…'}</span></div>}
      {paused&&ready&&<button className="cap-resume" onClick={()=>api.current.setPaused(false)}><Play size={17}/>继续演示</button>}
      <div className="cap-metrics">{metrics.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    </div>
    <div className="cap-controls">
      <div className="cap-actions">
        {item.id==='pose'&&<>{[['ready','站立'],['reach','抬手'],['guard','防守']].map(([pose,label])=><button key={pose} disabled={blocked} aria-pressed={status?.pose===pose} onClick={()=>act(a=>a.setPose(pose),'拖动蓝色圆环，还可以继续调整手脚的位置。')}>{label}</button>)}</>}
        {item.id==='impact'&&<><button disabled={blocked} className="cap-action-main" onClick={()=>act(a=>a.hitArm(),'球已发出，请观察手臂接触与摆动。')}>冲击手臂</button><button disabled={blocked} onClick={()=>act(a=>a.hitBody(),'球已发出，请观察躯干反应。')}>冲击躯干</button><button disabled={blocked} onClick={()=>act(a=>a.setRagdoll(!status.ragdoll),status?.ragdoll?'姿态与平衡控制已恢复。':'姿态控制已关闭，关节约束仍然生效。')}>{status?.ragdoll?'恢复控制':'释放身体'}</button></>}
        {item.id==='catch'&&<><button className="cap-action-main" disabled={blocked||['reaching','incoming','holding','windup','throwing'].includes(status?.catchPhase)} onClick={()=>act(a=>{a.reset();a.setStrength(strength);a.catchPass();},'等待手掌与来球实际接触。')}>开始接球</button><button disabled={blocked||status?.catchPhase!=='holding'} onClick={()=>act(a=>a.throwHeld(),'释放动作已开始，球将脱离握持连接。')}>投出手中球</button></>}
        {item.id==='weapon'&&<><HoldButton disabled={blocked} down={()=>api.current.move(0,.65)} up={()=>api.current?.move(0,0)}>按住向前靠近</HoldButton><button className="cap-action-main" disabled={blocked} onClick={()=>act(a=>a.slash(),'横斩已发出；只有接触才会产生命中或格挡。')}>横斩</button><button disabled={blocked||!isHeld(status?.weapons[0])} onClick={()=>act(a=>a.drop(),'握持已解除，物体保持物理运动。')}>放下武器</button><HoldButton disabled={blocked||isHeld(status?.weapons[0])} down={()=>api.current.interact(true)} up={()=>api.current?.interact(false)}>按住拾取</HoldButton></>}
        {item.id==='ledge'&&<><button className="cap-action-main" disabled={!ready} onClick={reset}>重新演示</button><button disabled={blocked} onClick={()=>act(a=>a.chop(),'下劈已发出，命中由实际碰撞决定。')}>向下劈砍</button></>}
        {item.id==='camera'&&<><button className="cap-action-main" disabled={blocked} onClick={()=>act(a=>a.dropBalls(),'球已释放；可切换慢动作或暂停观察。')}>落球演示</button><button disabled={!ready} onClick={()=>act(a=>a.resetView(),'观察视角已复位。')}>复位视角</button></>}
        <button className="cap-slow" disabled={!ready} aria-pressed={slow} onClick={()=>api.current.setSlow(!slow)}>¼ 慢动作</button>
        {!isRig&&<button disabled={!ready} aria-label={status?.muted?'开启声音':'关闭声音'} onClick={()=>api.current.setMuted(!status?.muted)}>{status?.muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>}
      </div>
      {['pose','impact','catch'].includes(item.id)&&<div className="cap-sliders"><label>姿态驱动 <strong>{Math.round(strength*100)}%</strong><input aria-label="姿态驱动强度" type="range" min="0.1" max="1" step="0.05" disabled={!ready} value={strength} onChange={e=>{const v=Number(e.target.value);setStrength(v);api.current.setStrength(v);}}/></label>{item.id==='impact'&&<label>投球速度 <strong>{power} m/s</strong><input aria-label="投球速度" type="range" min="4" max="18" step="1" disabled={!ready} value={power} onChange={e=>{const v=Number(e.target.value);setPower(v);api.current.setPower(v);}}/></label>}</div>}
      {item.id==='weapon'&&<label className="cap-weapon-select">当前物体<select value={weapon} disabled={!ready} onChange={e=>{const v=e.target.value;setWeapon(v);api.current.configure({arena:'yard',playerWeapon:v});api.current.start();}}><option value="sword">单手剑 · 均衡</option><option value="mace">铁头锤 · 重量集中</option><option value="greatsword">长剑 · 双手握持</option></select></label>}
      <p className="cap-action-note" aria-live="polite">{actionNote||item.hint}</p>
    </div>
  </div>;
}
export function Capabilities(){
  const hash=location.hash.slice(1);
  const [active,setActive]=useState(capabilities.some(c=>c.id===hash)?hash:'pose');
  const current=capabilities.find(c=>c.id===active), index=capabilities.indexOf(current), Icon=icons[current.icon];
  const select=id=>{setActive(id);history.replaceState(null,'','#'+id);};
  useEffect(()=>{document.title='可复用能力 · Stick & Steel · 005';const change=()=>{const id=location.hash.slice(1);if(capabilities.some(c=>c.id===id))setActive(id);};addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  return <main className="cap-page">
    <header className="cap-header"><a href="?view=capabilities" className="cap-brand"><span>005</span><i>/</i> STICK & STEEL</a><div><a href="?view=characters">人物刻画<ArrowUpRight size={15}/></a><a href="?view=stories">人物故事<ArrowUpRight size={15}/></a><a href="?view=duel">完整对战<ArrowUpRight size={15}/></a></div></header>
    <section className="cap-intro"><div><span className="cap-eyebrow">PLAYABLE CAPABILITIES</span><h1>把交互能力，拆开来看。</h1></div><p>先理解它能做什么，再亲手触发效果。<br/>六组实时演示，来自同一套物理与角色模块。</p></section>
    <nav className="cap-tabs" aria-label="可复用能力">{capabilities.map(item=>{const ItemIcon=icons[item.icon];return <button key={item.id} aria-pressed={item.id===active} onClick={()=>select(item.id)}><span>{item.number}</span><ItemIcon size={18}/><strong>{item.title}</strong></button>;})}</nav>
    <section className="cap-workspace" aria-label={current.title+'能力展示'}>
      <Demo key={current.id} item={current}/>
      <aside className="cap-description"><div className="cap-section-label"><Icon size={18}/><span>能力 {current.number}</span><span>{current.level}</span></div><h2>{current.short}</h2><p className="cap-summary">{current.summary}</p><h3>这样看效果</h3><ol>{current.steps.map((step,i)=><li key={step}><span>{i+1}</span><p>{step}</p></li>)}</ol><div className="cap-reuse"><h3><Check size={16}/>可以复用什么</h3><p>{current.reuse}</p><div>{current.uses.map(use=><span key={use}>{use}</span>)}</div></div><div className="cap-boundary"><h3>使用边界</h3><p>{current.boundary}</p></div><details><summary><BookOpen size={14}/>对应源码模块</summary>{current.modules.map(module=><code key={module}>{module}</code>)}</details></aside>
    </section>
    <footer className="cap-footer"><p>基于 Rab Neba 的开源模块 · 真实模拟，无预录动画<br/><span>展示数据为当前模型内状态，暂停与慢动作可重复观察。</span></p><div><button disabled={index===0} onClick={()=>select(capabilities[index-1].id)} aria-label="上一项能力"><ChevronLeft size={17}/></button><span>{current.number} / 06</span><button disabled={index===5} onClick={()=>select(capabilities[index+1].id)} aria-label="下一项能力"><ChevronRight size={17}/></button></div></footer>{import.meta.env.PROD&&<p style={{fontSize:12,padding:'12px 0'}}><a href="../" style={{color:'#875146'}}>← 研究摘要、效果导览与扩展路线</a></p>}
  </main>;
}
