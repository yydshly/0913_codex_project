import React, { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ArrowDown, ArrowClockwise, BookmarkSimple, Check, Columns, Desktop, DeviceMobile, Flask, SlidersHorizontal, X, Info, ArrowRight } from '@phosphor-icons/react';
import { supportsHtmlInCanvas } from './vendor/Liquid/LiquidVanilla';
import './lab.css';
import { InteractiveCover, interactions, useMagneticButton } from './interactions';
import { journeyStudies } from './journey-catalogue';
import { readLabEntry } from './lab-entry';

const Liquid = lazy(() => import('./vendor/Liquid/Liquid').then(m => ({default:m.Liquid})));
const Blaze = lazy(() => import('./vendor/Blaze/Blaze').then(m => ({default:m.Blaze})));
const Glass = lazy(() => import('./vendor/Glass/Glass').then(m => ({default:m.Glass})));
const Shatter = lazy(() => import('./vendor/Shatter/Shatter').then(m => ({default:m.Shatter})));
const ParticleReveal = lazy(() => import('./vendor/ParticleReveal/ParticleReveal').then(m => ({default:m.ParticleReveal})));
const VHS = lazy(() => import('./vendor/VHS/VHS').then(m => ({default:m.VHS})));
const Ripple = lazy(() => import('./vendor/Ripple/Ripple').then(m => ({default:m.Ripple})));
const Droplets = lazy(() => import('./vendor/Droplets/Droplets').then(m => ({default:m.Droplets})));
const Clouds = lazy(() => import('./vendor/Clouds/Clouds').then(m => ({default:m.Clouds})));
const Laser = lazy(() => import('./vendor/Laser/Laser').then(m => ({default:m.Laser})));
const Bubble = lazy(() => import('./vendor/Bubble/Bubble').then(m => ({default:m.Bubble})));
const ForceField = lazy(() => import('./vendor/ForceField/ForceField').then(m => ({default:m.ForceField})));
const GlyphRain = lazy(() => import('./vendor/GlyphRain/GlyphRain').then(m => ({default:m.GlyphRain})));
const Frost = lazy(() => import('./vendor/Frost/Frost').then(m => ({default:m.Frost})));
const FlameWrap = lazy(() => import('./vendor/FlameWrap/FlameWrap').then(m => ({default:m.FlameWrap})));
const HexFloat = lazy(() => import('./vendor/HexFloat/HexFloat').then(m => ({default:m.HexFloat})));

gsap.registerPlugin(ScrollTrigger);
const stages = [
  { title: '基础页面', sub: '内容与默认排版', note: '先看没有设计调整、动画和特效时，同一份内容的样子。' },
  { title: '设计调整', sub: '层级 · 字体 · 留白', note: '只改变排版、比例和颜色。这是本次设计实践，不是插件效果的盲测。' },
  { title: '加入 GSAP', sub: '入场 · 滚动 · 连续转场', note: '文字错峰入场；向下滚动预览，观察固定段落里的连续转场。' },
  { title: '叠加 Canvas UI', sub: '真实组件 · 即时调节', note: '在同一页面叠加原版特效，移动鼠标并点击收藏，观察画面与交互。' },
];
const effects = {
 glyphrain:{name:'字符雨',en:'Glyph Rain',slug:'glyph-rain',mark:'GR',group:'latest',C:GlyphRain,tip:'观察绿色字符连续下落，移动鼠标扰动字符雨。',limited:'当前显示字符雨叠加，不能给文字添加真实浮雕光照。',controls:[['density','字符密度',0.05,0.7,0.05,0.3],['speed','下落速度',0.05,1,0.05,0.25]],props:{color:[0.3,1,0.55],headColor:[0.8,1,0.85],dim:0,cell:17,layers:2,glow:1.4,trail:0.8}},
 frost:{name:'冰霜融化',en:'Frost',mark:'FR',group:'latest',C:Frost,tip:'把鼠标移入预览融开冰霜；离开后霜层会重新生长。',limited:'当前显示可融化的霜层，不能折射或模糊底下的文字。',controls:[['opacity','霜层浓度',0.1,0.9,0.05,0.6],['meltRadius','融化半径',0.05,0.5,0.05,0.2]],props:{strength:0.7,introDuration:1.5,refreeze:1.2,shimmer:0.15,quality:0.5}},
 flamewrap:{name:'火焰边框',en:'Flame Wrap',slug:'flame-wrap',mark:'FW',group:'latest',C:FlameWrap,tip:'观察样页边框上的蓝色火苗、火星与光晕。',limited:'当前显示边缘燃烧叠加，不会烧蚀或扭曲页面内容。',controls:[['intensity','火苗亮度',0.1,2,0.1,0.8],['speed','燃烧速度',0.1,1.5,0.1,0.4]],props:{height:65,spread:12,radius:8,sparks:1.2,smoke:0.6,scorch:0}},
 hexfloat:{name:'悬浮蜂窝',en:'Hex Float',slug:'hex-float',mark:'HF',group:'latest',C:HexFloat,tip:'观察六边形表面的起伏与边缘高光，移动鼠标拨开轨迹。',limited:'当前显示蜂窝边缘和高光，不能把页面切成悬浮六边形。',controls:[['float','起伏幅度',0,1,0.05,0.4],['size','蜂窝尺寸',40,180,10,90]],props:{tilt:10,shine:1.1,iridescence:1.3,radius:150,flow:1,trail:0.7,grain:0.05,bloom:0.2}},
 ripple:{name:'水波',en:'Ripple',mark:'RP',group:'atmosphere',C:Ripple,tip:'点击预览激起水波；静止时也会自动泛起涟漪。',limited:'当前显示水波高光，页面内容不会随波折射。',controls:[['amplitude','波纹强度',0.1,2,0.1,0.9],['rings','波纹圈数',1,8,1,3]],props:{interval:1.8,trigger:'click',shine:1.2,speed:0.65}},
 droplets:{name:'雨滴',en:'Droplets',mark:'DR',group:'atmosphere',C:Droplets,tip:'观察雨滴沿画面滑落，移动鼠标扰动雨水。',limited:'当前显示雨滴叠加，不能透过雨水折射文字。',controls:[['intensity','雨量',0.1,1.2,0.1,0.8],['fallSpeed','滑落速度',0.2,2.5,0.1,1]],props:{scale:0.4,staticDrops:0.4,interactive:true}},
 clouds:{name:'云雾',en:'Clouds',mark:'CL',group:'atmosphere',C:Clouds,tip:'观察云层缓慢漂移，移动鼠标拨动云雾。',limited:'当前显示云雾叠加，不能改变页面清晰度。',controls:[['opacity','云雾浓度',0.1,1,0.05,0.65],['speed','漂移速度',0.1,1.5,0.1,0.6]],props:{cover:0.2,density:2.5,color:[0.85,0.9,0.95],quality:0.75}},
 laser:{name:'激光',en:'Laser',mark:'LA',group:'atmosphere',C:Laser,tip:'观察蓝色光束的闪烁与光晕，调节高度改变光束位置。',limited:'当前显示光束与光晕，不能折射光束附近的文字。',controls:[['glow','光晕强度',0,3,0.1,2],['offset','离底高度',30,280,10,120]],props:{color:[0.25,0.5,1],width:0.8,thickness:4}},
 bubble:{name:'气泡',en:'Bubble',mark:'BU',group:'atmosphere',C:Bubble,tip:'在预览中连续移动鼠标，观察彩色气泡拖尾与融合。',limited:'当前显示气泡高光与彩边，不能折射气泡内的文字。',controls:[['size','气泡大小',10,70,5,35],['trail','拖尾数量',4,24,1,16]],props:{shine:0.5,colorA:[0.4,0.6,1],colorB:[0.8,0.4,0.75]}},
 forcefield:{name:'能量护盾',en:'Force Field',slug:'force-field',mark:'FF',group:'atmosphere',C:ForceField,tip:'移动鼠标点亮六边形网格；点击预览释放冲击波。',limited:'当前显示护盾网格和冲击波，页面内容不会变形。',controls:[['rippleIntensity','冲击波强度',0,5,0.1,2],['cellScale','网格密度',8,40,1,18]],props:{gridReveal:'both',hoverGlow:0.7,hoverCharge:0.8,clickRipples:true,opacity:0.8,gridOpacity:0.12,dim:0}},
 liquid:{mark:'LI',group:'classic',name:'流体',en:'Liquid',C:Liquid,tip:'在预览中移动鼠标，留下流动的彩色轨迹。',limited:'当前只能显示流体叠加，不能扭曲文字。',controls:[['intensity','色彩强度',0.2,6,0.1,2.5],['radius','扩散半径',0.05,0.8,0.05,0.3]],props:{rainbow:true,force:1.4,dyeResolution:512,simResolution:128}},
 blaze:{mark:'BL',group:'classic',name:'火焰',en:'Blaze',C:Blaze,tip:'观察底部升起的火星、烟雾和热浪。',limited:'当前显示火星、烟雾叠加，不能扭曲文字。',controls:[['sparks','火星亮度',0,2,0.1,1.2],['speed','升腾速度',0.1,2,0.1,0.7]],props:{glow:1.7,smoke:0.6,height:0.97}},
 glass:{mark:'GL',group:'classic',name:'玻璃',en:'Glass',C:Glass,tip:'把鼠标移到文字上，观察镜片的折射边缘。',limited:'当前仅显示镜片高光，不能折射页面内容。',controls:[['size','镜片尺寸',50,220,5,120],['ior','折射率',1,2,0.05,1.5]],props:{shine:0.7,reflection:1.2}},
 particles:{mark:'PR',group:'classic',name:'粒子',en:'Particle Reveal',slug:'particle-reveal',C:ParticleReveal,tip:'鼠标周围的粒子聚拢，还原为清晰内容。',limited:'当前浏览器无法显示 HTML 粒子重组，保留普通页面。',controls:[['radius','显现半径',70,450,10,200],['scatter','粒子散布',0,100,5,35]],props:{background:'#151715',size:2,fade:0.9}},
 vhs:{mark:'VH',group:'classic',name:'复古录像',en:'VHS',C:VHS,tip:'观察扫描线、噪点，以及文字的色散和波动。',limited:'当前显示扫描线与噪点叠加，不能完整扭曲内容。',controls:[['grain','噪点强度',0,0.5,0.01,0.13],['wave','画面波动',0,3,0.1,1]],props:{scanlines:0.2,aberration:3,speed:0.5}},
 shatter:{mark:'SH',group:'classic',name:'3D 破碎',en:'Shatter',C:Shatter,tip:'移动鼠标，观察页面碎片抬升、翻转和折射。',limited:'当前浏览器无法显示 HTML 碎片，保留普通页面。',controls:[['lift','碎片抬升',0,100,5,40],['tileSize','碎片尺寸',40,180,10,90]],props:{baseStrength:0.1,radius:0.45}},
};
function detectGPU(){const c=document.createElement('canvas');const gl=c.getContext('webgl2');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}
function useReducedMotion(){const [v,set]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const f=()=>set(m.matches);m.addEventListener('change',f);return()=>m.removeEventListener('change',f);},[]);return v;}

function Sample({designed,motion,pace,replay,saved,setSaved,baseline=false,interaction='none',demo=0}){
 const scrollRef=useRef(null),pinRef=useRef(null);
 useMagneticButton(scrollRef, motion && interaction==='magnet', demo);
 useLayoutEffect(()=>{scrollRef.current.scrollTop=0;},[demo]);
 const [progress,setProgress]=useState(0),[layoutWidth,setLayoutWidth]=useState(0);
 useLayoutEffect(()=>{
   const scroller=scrollRef.current;
   const observer=new ResizeObserver(()=>setLayoutWidth(scroller.clientWidth));
   observer.observe(scroller);
   return()=>observer.disconnect();
 },[]);
 useLayoutEffect(()=>{
   const scroller=scrollRef.current;scroller.scrollTop=0;setProgress(0);if(!motion)return;
   const ctx=gsap.context(()=>{
     gsap.timeline({defaults:{ease:'power3.out',duration:0.9/pace}}).from('.hero-reveal',{y:35,autoAlpha:0,stagger:0.14/pace});
     gsap.from('.feature-row',{scrollTrigger:{trigger:'.feature-row',scroller,start:'top 95%'},y:30,autoAlpha:0,duration:.7});
     const panels=gsap.utils.toArray('.story-panel');gsap.set(panels.slice(1),{yPercent:110,autoAlpha:0});
     gsap.timeline({scrollTrigger:{trigger:pinRef.current,scroller,start:'top top',end:'+=900',pin:true,scrub:.6,onUpdate:s=>setProgress(Math.round(s.progress*100))}})
       .to(panels[0],{yPercent:-35,autoAlpha:0,duration:1}).to(panels[1],{yPercent:0,autoAlpha:1,duration:1},0)
       .to(panels[1],{yPercent:-35,autoAlpha:0,duration:1}).to(panels[2],{yPercent:0,autoAlpha:1,duration:1},1);
   },scroller);
   const r=requestAnimationFrame(()=>ScrollTrigger.refresh());
   return()=>{cancelAnimationFrame(r);ctx.revert();};
 },[motion,pace,replay,designed,layoutWidth]);
 function read(){const s=scrollRef.current;const y=s.querySelector('.feature-row').offsetTop;s.scrollTo({top:y,behavior:motion?'smooth':'instant'});}
 return <div ref={scrollRef} className={`sample-scroll ${designed?'designed':'plain'} ${motion?'with-motion':''}`} aria-label={baseline?'基础页面预览':'效果页面预览'}><div className="sample-inner">
   <header className="sample-nav"><span className="sample-brand">FIELD<span>NOTES</span></span><span className="sample-edition">独立设计周刊 / VOL. 011</span><button className="sample-save" onClick={()=>setSaved(!saved)} aria-label={saved?'取消收藏':'收藏本期'}><BookmarkSimple weight={saved?'fill':'regular'} size={19}/><span>{saved?'已收藏':'收藏本期'}</span></button></header>
   <section className="sample-hero"><div className="hero-copy"><div className="eyebrow hero-reveal">关于设计、节奏与感知</div><h1 className="hero-reveal">让想法<br/><em>有形。</em></h1><p className="hero-description hero-reveal">好的页面，先让内容被看见，<br/>再让变化被感知。</p><button className="read-button hero-reveal" onClick={read}><span className="magnetic-content">阅读本期 <ArrowUpRight size={20}/></span></button></div><InteractiveCover mode={motion?interaction:'none'} demo={demo}/></section>
   <div className="hero-foot"><span>01 / 观察视觉的变化</span><span>向下滚动 <ArrowDown size={16}/></span></div>
   <section className="feature-row">{[['DESIGN','让重点更清楚','通过字号、间距与比例，让目光自然找到重要内容。'],['MOTION','让过程有节奏','让元素按顺序出现，让滚动与信息的展开保持一致。'],['EFFECT','让细节有记忆','把特效用在值得强调的时刻，保留清晰阅读与操作。']].map(([tag,h,p],i)=><article key={tag}><span>0{i+1} — {tag}</span><h2>{h}</h2><p>{p}</p></article>)}</section>
   <section ref={pinRef} className="scroll-story" aria-label="滚动叙事实验"><div className="story-top"><span>SCROLL STUDY</span><span>{motion?`${progress}% / 滚动驱动`:'静态阅读'}</span></div><div className="story-panels">{[['01','先看清，','再心动。','布局建立秩序，留白给内容呼吸。'],['02','让变化，','有来由。','动画引导注意，节奏连接信息。'],['03','有记忆，','也好用。','点击收藏，验证特效之下的真实交互。']].map(([n,a,b,c])=><article className="story-panel" key={n}><span className="story-number">{n}</span><h2>{a}<br/><em>{b}</em></h2><p>{c}</p></article>)}</div></section>
   <footer className="sample-footer"><h2>把这一刻留下。</h2><button onClick={()=>setSaved(!saved)}><BookmarkSimple size={18} weight={saved?'fill':'regular'}/>{saved?'已收藏本期':'收藏本期'}</button><p role="status">{saved?'收藏成功。特效之下，按钮依然可以操作。':'收藏仅用于本次页面交互演示，不会发送或保存个人信息。'}</p></footer>
 </div></div>;
}
function ResearchDialog({dialog}){return <dialog ref={dialog} className="research-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current.close();}}><button className="dialog-close" aria-label="关闭说明" onClick={()=>dialog.current.close()}><X size={22}/></button><span className="section-kicker">011 / 实验说明</span><h2>能做出效果，<br/>不等于自动变好看。</h2><p>本页使用同一份演示内容，分离版式、动画和特效，方便观察每一步的变化。</p><dl>
 <dt>Product Design · 设计流程</dt><dd>本次沿用 Canvas UI Playground 的控制台结构，再设计周刊样页。设计对照是人为编排的示例；未进行同模型、有无插件的盲测，不能据此量化插件或 Astra 的提升。</dd>
 <dt>GSAP · 实际接入</dt><dd>入场时间线、错峰出现、ScrollTrigger 固定区段与滚动连续转场，均在本地运行。另有 {Object.keys(interactions).length} 种可操作交互，可通过新增、全部、收藏列表和关键词搜索逐项体验；这是本项目用 GSAP 编写的演示，不计入 Canvas UI 组件数。</dd>
 <dt>Canvas UI · 实际接入</dt><dd>使用 David Haz 的十六个 React / WebGL 原版组件，固定上游 commit 44de378。完整 HTML 变形依赖实验性 html-in-canvas；官网有域名试用授权，本地不会继承。</dd>
 <dt>浏览器限制</dt><dd>没有完整能力时，十四种组件可显示部分叠加，包括字符雨、冰霜、火焰边框与蜂窝高光；粒子重组和破碎的完整页面效果不可用。左侧显示检测结果，可通过官方入口对照。未自动修改浏览器实验设置。</dd></dl><div className="source-links"><a href="https://openai.com/business/plugins/product-design/" target="_blank" rel="noreferrer">Product Design <ArrowUpRight/></a><a href="https://gsap.com/scroll/" target="_blank" rel="noreferrer">GSAP 示例 <ArrowUpRight/></a><a href="https://canvasui.dev/docs/installation" target="_blank" rel="noreferrer">Canvas UI 兼容性 <ArrowUpRight/></a></div><p className="muted">研究日期：2026-09-14；最近补充：2026-09-15。文案为本项目编写，不代表实际出版物。Canvas UI 使用 MIT + Commons Clause，具体许可随源码保留。</p></dialog>;}

export function Lab(){
 const [entry]=useState(()=>readLabEntry(location.search,effects,interactions));
 const [stage,setStage]=useState(entry.stage),[effect,setEffect]=useState(entry.effect),[values,setValues]=useState({}),[compare,setCompare]=useState(false),[narrow,setNarrow]=useState(false),[motionOn,setMotionOn]=useState(true),[effectOn,setEffectOn]=useState(true),[pace,setPace]=useState(1),[replay,setReplay]=useState(0),[saved,setSaved]=useState(false),[panel,setPanel]=useState(false);
 const [interactionScope,setInteractionScope]=useState(entry.scope);
 const [favorites,setFavorites]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('visual-lab-favorites')||'[]');return Array.isArray(saved)?[...new Set(saved.filter(key=>typeof key==='string'&&Object.hasOwn(interactions,key)))]:[];}catch{return [];}});
 useEffect(()=>{try{localStorage.setItem('visual-lab-favorites',JSON.stringify(favorites));}catch{}},[favorites]);
 const [interaction,setInteraction]=useState(entry.interaction),[demo,setDemo]=useState(0),[query,setQuery]=useState('');
 const [effectGroup,setEffectGroup]=useState(entry.effectGroup);
 const [caps]=useState(()=>({html:supportsHtmlInCanvas(),gpu:detectGPU()}));const reduced=useReducedMotion();const dialog=useRef(null);const fx=effects[effect];
 const animation=stage>=2&&motionOn&&!reduced;const activeFx=stage===3&&effectOn&&caps.gpu&&!reduced&&(caps.html||!['particles','shatter'].includes(effect));const Fx=fx.C;
 const options=Object.fromEntries(fx.controls.map(([key,,,,,def])=>[key,values[effect]?.[key]??def]));
 const sample=<Sample key={`${stage}-${replay}-${activeFx}`} designed={stage>0} motion={animation} pace={pace} replay={replay} saved={saved} setSaved={setSaved} interaction={interaction} demo={demo}/>;
 function chooseStage(n){setStage(n);setReplay(x=>x+1);}
 function chooseInteraction(key){if(interactionScope==='latest'&&!journeyStudies[key]||interactionScope==='favorites'&&!favorites.includes(key))setInteractionScope('all');setInteraction(key);setStage(2);setMotionOn(true);setDemo(n=>n+1);}
 function resetLab(){setInteractionScope('latest');setStage(2);setEffect('glyphrain');setValues({});setCompare(false);setNarrow(false);setMotionOn(true);setEffectOn(true);setPace(1);setSaved(false);setPanel(false);setInteraction('nebula');setDemo(0);setEffectGroup('latest');setQuery('');setReplay(n=>n+1);}
 const visibleInteractions=Object.entries(interactions).filter(([key])=>interactionScope==='all'||(interactionScope==='favorites'?favorites.includes(key):journeyStudies[key]));
 const currentPosition=visibleInteractions.findIndex(([key])=>key===interaction);
 function stepInteraction(direction){if(!visibleInteractions.length)return;const next=currentPosition<0?(direction>0?0:visibleInteractions.length-1):(currentPosition+direction+visibleInteractions.length)%visibleInteractions.length;chooseInteraction(visibleInteractions[next][0]);}
 function toggleFavorite(){if(!interactions[interaction])return;setFavorites(list=>list.includes(interaction)?list.filter(key=>key!==interaction):[...list,interaction]);}
 const searchTerm=query.trim().toLowerCase();
 const searchResults=searchTerm?[...Object.entries(effects).map(([key,item])=>({key,...item,kind:'Canvas UI'})),...Object.entries(interactions).map(([key,item])=>({key,...item,kind:'GSAP'}))].filter(item=>`${item.name} ${item.en||''} ${item.key} ${item.tip}`.toLowerCase().includes(searchTerm)):[];
 const status=!caps.gpu?'WebGL2 不可用':caps.html?'支持 HTML 实时特效':'部分效果可用';
 const effectNote=reduced?'系统已开启减少动态效果，当前保留静态页面。':!effectOn?'特效已关闭，可打开左侧开关对比。':!caps.gpu?'WebGL2 不可用，当前保留普通页面。':caps.html?fx.tip:`${fx.tip} ${fx.limited}`;
 return <div className="lab-shell">
 <header className="lab-header"><a href="./" className="lab-logo" aria-label="视觉实验室首页"><Flask weight="fill" size={25}/><span>视觉实验室<small>VISUAL LAB / 011</small></span></a><div className="header-center">设计 × 动效 × 特效</div><a className="text-button" href="./research.html">理解与导览 ↗</a><a className="text-button" href="?view=portfolio">实际场景 ↗</a><button className="text-button" onClick={resetLab}><ArrowClockwise size={18}/>重置实验</button><button className="text-button" onClick={()=>dialog.current.showModal()}><Info size={18}/>实验说明</button><button className="mobile-controls" onClick={()=>setPanel(!panel)} aria-label="展开或收起控制面板"><SlidersHorizontal size={22}/></button></header>
 <aside className={`sidebar ${panel?'expanded':''}`}><div className="sidebar-heading"><span className="section-kicker">一步一步，看见变化</span><h2>前端的三层表达</h2></div><nav className="stage-list" aria-label="展示阶段">{stages.map((s,i)=><button className={`stage-button ${stage===i?'selected':''}`} key={s.title} onClick={()=>chooseStage(i)} aria-pressed={stage===i}><span className="step-index">0{i}</span><span><strong>{s.title}</strong><small>{s.sub}</small></span>{stage===i&&<ArrowRight size={17}/>}</button>)}</nav>
 <div className="effect-search"><label htmlFor="effect-search">搜索全部效果 <small>{Object.keys(effects).length + Object.keys(interactions).length} 项</small></label><div className="search-input"><input id="effect-search" type="search" placeholder="名称或关键词，如水波、path" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="清空搜索" onClick={()=>setQuery('')}><X size={16}/></button>}</div>{searchTerm&&<div className="search-results"><p role="status">{searchResults.length?`找到 ${searchResults.length} 项`:'没有匹配效果，试试其他关键词。'}</p>{searchResults.map(item=><button key={`${item.kind}-${item.key}`} onClick={()=>{if(item.kind==='GSAP')chooseInteraction(item.key);else{setEffect(item.key);setEffectGroup(item.group);setStage(3);setEffectOn(true);}}}><span>{item.name}</span><small>{item.kind}</small></button>)}</div>}</div>
 <div className="divider"/><div className="control-heading"><h3>特效组件</h3><label className="switch-label"><input type="checkbox" aria-label="启用特效" checked={effectOn&&stage===3} onChange={e=>{setStage(3);setEffectOn(e.target.checked);}}/><span className="switch-track"/></label></div>
 <div className="effect-tabs" role="group" aria-label="特效分组">{[['latest','新增'],['atmosphere','氛围'],['classic','经典']].map(([key,label])=><button key={key} aria-pressed={effectGroup===key} onClick={()=>setEffectGroup(key)}>{label} · {Object.values(effects).filter(f=>f.group===key).length}</button>)}</div>
 <div className={`effect-grid ${effectGroup==='latest'?'four-effects':''}`}>{Object.entries(effects).filter(([,f])=>f.group===effectGroup).map(([key,f])=><button key={key} className={`effect-choice ${effect===key&&stage===3?'active':''}`} aria-pressed={effect===key&&stage===3} onClick={()=>{setEffect(key);setStage(3);setEffectOn(true);}}><span className="effect-mark">{f.mark}</span><span>{f.name}</span></button>)}</div>
 <div className="parameter-panel"><div className="parameter-title"><span>{fx.en}</span><button aria-label="重置特效参数" onClick={()=>setValues(v=>({...v,[effect]:{}}))}><ArrowClockwise size={16}/></button></div>{fx.controls.map(([key,label,min,max,step])=><label className="range-control" key={key}><span>{label}<output>{Number(options[key]).toFixed(step<1?2:0)}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={options[key]} disabled={stage!==3||!effectOn} onChange={e=>setValues(v=>({...v,[effect]:{...v[effect],[key]:Number(e.target.value)}}))}/></label>)}</div>
 <div className="divider"/><div className="control-heading"><h3>GSAP 动画</h3><label className="switch-label"><input type="checkbox" aria-label="启用 GSAP 动画" checked={motionOn&&stage>=2} disabled={reduced} onChange={e=>{if(stage<2)setStage(2);setMotionOn(e.target.checked);}}/><span className="switch-track"/></label></div><label className="range-control pace-control"><span>入场速度<output>{pace.toFixed(1)}×</output></span><input type="range" aria-label="入场速度" min="0.5" max="2" step="0.1" value={pace} disabled={!animation} onChange={e=>setPace(Number(e.target.value))}/></label>
 <div className={`capability ${caps.html?'supported':''}`}><div><Info size={17}/><strong>Canvas UI · {status}</strong></div><p>{!caps.gpu?'浏览器无法创建 WebGL2，预览保留普通页面。':caps.html?'检测到 html-in-canvas。请实际操作确认当前组件表现。':fx.limited}</p>{reduced&&<p>系统已开启“减少动态效果”，本页遵循此设置。</p>}<a href={`https://canvasui.dev/playground?c=${fx.slug||effect}`} target="_blank" rel="noreferrer">体验官方完整效果 <ArrowUpRight size={15}/></a></div><div className="sidebar-bottom">真实库接入 / 非录屏演示</div></aside>
 <main className={`workspace ${stage>=2?'has-interactions':''}`}><div className="workspace-title"><div><span className="section-kicker">LIVE EXPERIMENT</span><h1>{stages[stage].title}<span>{stage===3?fx.en:'同一内容，分步比较'}</span></h1></div><button className={`compare-button ${compare?'on':''}`} disabled={stage===0} onClick={()=>setCompare(!compare)} aria-pressed={compare}><Columns size={19}/>{compare?'退出对照':'前后对照'}</button></div>
 {stage>=2&&<><div className="interaction-tools" aria-label="交互浏览工具"><div className="interaction-scopes" role="group" aria-label="交互筛选">{[['latest',`本轮新增 · ${Object.keys(journeyStudies).length}`],['all',`全部交互 · ${Object.keys(interactions).length}`],['favorites',`我的收藏 · ${favorites.length}`]].map(([key,label])=><button key={key} aria-pressed={interactionScope===key} onClick={()=>setInteractionScope(key)}>{label}</button>)}</div><button aria-label={favorites.includes(interaction)?'取消收藏当前效果':'收藏当前效果'} aria-pressed={favorites.includes(interaction)} disabled={!interactions[interaction]} onClick={toggleFavorite}><BookmarkSimple size={14} weight={favorites.includes(interaction)?'fill':'regular'}/>{favorites.includes(interaction)?'已收藏效果':'收藏效果'}</button></div><div className="interaction-bar" role="group" aria-label="GSAP 交互实验">{visibleInteractions.map(([key,item])=><button key={key} aria-pressed={interaction===key&&animation} onClick={()=>chooseInteraction(key)}>{item.name}</button>)}{!visibleInteractions.length&&<p className="favorite-empty">还没有收藏效果。选择喜欢的效果后，点击“收藏效果”。</p>}<button aria-pressed={interaction==='none'} onClick={()=>setInteraction('none')}>关闭交互</button><button className="demo-interaction" disabled={!animation||interaction==='none'} onClick={()=>setDemo(n=>n+1)}><ArrowClockwise size={15}/>演示一次</button></div><div className="interaction-pager"><button aria-label="上一种效果" disabled={visibleInteractions.length<2} onClick={()=>stepInteraction(-1)}>← 上一种</button><span aria-live="polite">{interactions[interaction]?.name||'交互已关闭'}{currentPosition>=0?` · ${currentPosition+1} / ${visibleInteractions.length}`:''}</span><button aria-label="下一种效果" disabled={visibleInteractions.length<2} onClick={()=>stepInteraction(1)}>下一种 →</button></div></>}

 <div className="preview-toolbar"><span className="preview-location">FIELD NOTES <span>/ 演示样页</span></span><div className="toolbar-actions"><button className={!narrow?'chosen':''} onClick={()=>setNarrow(false)} aria-label="宽屏预览" aria-pressed={!narrow}><Desktop size={18}/></button><button className={narrow?'chosen':''} onClick={()=>setNarrow(true)} aria-label="窄屏预览" aria-pressed={narrow}><DeviceMobile size={18}/></button><span className="toolbar-separator"/><button className="replay-button" onClick={()=>setReplay(x=>x+1)}><ArrowClockwise size={17}/><span>重播入场</span></button></div></div>
 <div className={`preview-area ${compare&&stage>0?'comparing':''} ${narrow?'narrow':''}`}>{compare&&stage>0&&<div className="preview-pane baseline-pane"><div className="pane-label">BEFORE <span>基础页面</span></div><Sample designed={false} motion={false} pace={1} replay={replay} saved={saved} setSaved={setSaved} baseline/></div>}<div className={`preview-pane active-pane ${effect==='flamewrap'&&activeFx?'framed-effect':''}`}>{compare&&stage>0&&<div className="pane-label">AFTER <span>{stages[stage].title}</span></div>}{activeFx?<Suspense fallback={sample}><Fx {...fx.props} {...options} className="canvas-effect" style={{height:'100%'}}>{sample}</Fx></Suspense>:sample}</div></div>
 <div className="observation-strip"><div><span className="observation-number">0{stage}</span><p>{stage===3?effectNote:stage===2&&!animation?(reduced?'系统已开启减少动态效果，当前保留静态内容。':'GSAP 动画已关闭，当前保留静态内容。'):stage===2&&interaction!=='none'?interactions[interaction].tip:stages[stage].note}</p></div><span className="interaction-status" aria-live="polite"><BookmarkSimple size={16} weight={saved?'fill':'regular'}/>{saved?'收藏已响应':'试试页面里的按钮'}</span></div><div className="experiment-notes"><span><Check size={16}/>同一份页面内容</span><span><Check size={16}/>真实可操作按钮</span><button onClick={()=>dialog.current.showModal()}>这能证明什么？<ArrowUpRight size={15}/></button></div></main><ResearchDialog dialog={dialog}/></div>;
}

