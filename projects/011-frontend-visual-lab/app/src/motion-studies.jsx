import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);
const letters = {
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  G: ['01110','10001','10000','10111','10001','10001','01110'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
};
const words = ['HI','GO','OK'];
const masks = words.map(word => letters[word[0]].map((row,i)=>row+'0'+letters[word[1]][i]).join(''));
const colors = ['#a5ded0','#e8bc85','#c3b4e1'];

export function MotionStudy({ mode, demo }) {
  const root = useRef(null), play = useRef(null);
  const [index,setIndex] = useState(0), [active,setActive] = useState(false);
  useLayoutEffect(()=>{
    const element=root.current, ctx=gsap.context(()=>{},element);
    let animation, current=0, twisted=false;
    setIndex(0); setActive(false);
    ctx.add(()=>{
      if(mode==='matrix') gsap.set(element.querySelectorAll('.matrix-dot'),{
        backgroundColor:i=>masks[0][i]==='1'?colors[0]:'#667574',scale:i=>masks[0][i]==='1'?1:.6,opacity:i=>masks[0][i]==='1'?1:.3,
      });
    });
    ctx.add('play',()=>{
      animation?.kill();
      if(mode==='matrix'){
        current=(current+1)%3; setIndex(current);
        animation=gsap.to(element.querySelectorAll('.matrix-dot'),{
          backgroundColor:i=>masks[current][i]==='1'?colors[current]:'#667574',
          opacity:i=>masks[current][i]==='1'?1:.3,scale:i=>masks[current][i]==='1'?1:.6,
          duration:.55,stagger:{each:.006,from:'center'},ease:'power2.inOut',overwrite:true,
        });
      }else if(mode==='ribbon'){
        twisted=!twisted; setActive(twisted);
        animation=gsap.to(element.querySelectorAll('.ribbon-strip'),{
          rotationY:i=>twisted?Math.sin(i*.31-.9)*68:0,
          x:i=>twisted?Math.sin(i*.31-.9)*14:0,z:i=>twisted?Math.cos(i*.31-.9)*20:0,
          duration:1.3,stagger:.028,ease:'power3.inOut',overwrite:true,
        });
      }else{
        setActive(true);
        const path=element.querySelector('.comet-route');
        const dots=element.querySelectorAll('.comet-dot');
        gsap.set(dots,{opacity:0,motionPath:{path,align:path,alignOrigin:[.5,.5],start:0,end:0}});
        animation=gsap.timeline({onComplete:()=>setActive(false)});
        dots.forEach((dot,i)=>{
          const delay=i*.045;
          animation.to(dot,{opacity:1-i*.06,duration:.08},delay)
            .to(dot,{motionPath:{path,align:path,alignOrigin:[.5,.5]},duration:3.6,ease:'none'},delay)
            .to(dot,{opacity:0,duration:.35},delay+3.25);
        });
      }
    });
    play.current=()=>ctx.play();
    if(demo) ctx.play();
    return()=>{play.current=null;animation?.kill();ctx.revert();};
  },[mode,demo]);
  const label=mode==='matrix'?`切换点阵标牌，当前 ${words[index]}`:mode==='ribbon'?(active?'摊平纸带':'扭转纸带'):'播放彗星巡航';
  return <div ref={root} className={`cover-stage extra-study interactive-cover mode-${mode}`} role="button" tabIndex={0}
    aria-label={label} aria-pressed={mode==='ribbon'?active:undefined} onClick={()=>play.current?.()}
    onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();play.current?.();}}}>
    <div className={`extra-surface ${mode}-surface`}>
      {mode==='matrix'&&<><span className="study-kicker">SMALL DOTS / CLEAR WORDS</span><div className="matrix-display" aria-hidden="true">{Array.from({length:77},(_,i)=><i className="matrix-dot" key={i}/>)}</div><div className="matrix-labels">{words.map((word,i)=><span className={index===i?'active':''} key={word}>{word}</span>)}</div><h2>一点一点，<br/>传达心意。</h2><small>点击切换三组点阵文字 ↗</small></>}
      {mode==='ribbon'&&<><span className="study-kicker">PAPER / ANOTHER DIMENSION</span><div className="ribbon-window" aria-hidden="true"><div className="ribbon-strips">{Array.from({length:18},(_,i)=><i className="ribbon-strip" key={i} style={{background:`linear-gradient(90deg,hsl(${164+i*2} 23% 43%),hsl(${164+i*2} 32% 76%) 48%,hsl(${164+i*2} 25% 49%))`}}/>)}</div></div><h2>轻轻一转，<br/>平面有了深度。</h2><small>{active?'点击摊平纸带 ↗':'点击让纸带扭转 ↗'}</small></>}
      {mode==='comet'&&<><span className="study-kicker">LEAVE A LITTLE LIGHT</span><svg className="comet-graphic" viewBox="0 0 220 220" aria-hidden="true">{Array.from({length:23},(_,i)=><circle key={i} cx={12+(i*47+i*i*3)%196} cy={12+(i*31+i*i*7)%196} r={i%5===0?1.1:.6} fill="#b0b3ce" opacity=".55"/>)}<path className="comet-route" d="M25 178 C5 55 208 12 198 107 S44 206 67 91 C78 46 135 37 164 60" fill="none" stroke="#b9abc0" strokeOpacity=".24" strokeWidth=".7" strokeDasharray="2 4"/>{Array.from({length:14},(_,i)=><circle className="comet-dot" key={i} r={5.5-i*.3} fill={i<3?'#ffedbd':'#c9b8e1'} opacity="0"/>)}</svg><span className="study-play-status">{active?'正在星图中巡航':'等待下一束光'}</span><h2>掠过之后，<br/>仍有微光。</h2><small>点击重播光点与拖尾 ↗</small></>}
    </div>
  </div>;
}
