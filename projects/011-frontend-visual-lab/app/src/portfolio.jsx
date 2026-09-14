import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, BookmarkSimple, Check, X, ArrowDown, Sparkle, SlidersHorizontal, MagnifyingGlass, Flask } from '@phosphor-icons/react';
import { projects } from './portfolio-data';
import './portfolio.css';
import { usePortfolioMotion } from './portfolio-motion';
import { PortfolioAtmosphere, supportsPortfolioAtmosphere } from './portfolio-atmosphere';
import './portfolio-immersive.css';
import { usePortfolioDetail } from './portfolio-detail-motion';
import { PortfolioWeatherStory } from './portfolio-weather-story';

export default function Portfolio() {
  const root=useRef(null),dialog=useRef(null),detailBody=useRef(null),lastTrigger=useRef(null),detailSource=useRef(null);
  const [motion,setMotion]=useState(true),[reduced,setReduced]=useState(false),[category,setCategory]=useState('全部作品'),[query,setQuery]=useState(''),[onlySaved,setOnlySaved]=useState(false),[saved,setSaved]=useState([]),[featured,setFeatured]=useState(0),[detail,setDetail]=useState(null),[toast,setToast]=useState(''),[explain,setExplain]=useState(false);
  const [replay,setReplay]=useState(0);
  const [atmosphere,setAtmosphere]=useState(true),[gpu,setGpu]=useState(supportsPortfolioAtmosphere);
  const [frost,setFrost]=useState(true);
  const cloudsOn=atmosphere&&motion&&!reduced&&gpu&&featured===0;
  const frostOn=frost&&motion&&!reduced&&gpu&&featured===1;
  const animate=motion&&!reduced, selected=projects[featured];
  usePortfolioMotion(root, animate, replay, featured, `${category}|${query}|${onlySaved}|${saved.join()}`);
  const visible=projects.filter(p=>(category==='全部作品'||p.category===category)&&(!onlySaved||saved.includes(p.id))&&`${p.name} ${p.summary} ${p.features.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(()=>{document.title='项目手记 · 你的创作与实验';const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(timer);},[toast]);
  const close=usePortfolioDetail({detail,animate,dialog,body:detailBody,trigger:lastTrigger,source:detailSource,onClosed:()=>setDetail(null)});
  function save(id){const exists=saved.includes(id);setSaved(s=>exists?s.filter(x=>x!==id):[...s,id]);setToast(`${exists?'已移出清单':'已加入清单'} · ${projects.find(p=>p.id===id).name}`);}
  function open(p,e){
    if(detail)return;
    lastTrigger.current=e.currentTarget;
    let image=e.currentTarget.closest('.pf-project')?.querySelector('.pf-card-image img') || root.current.querySelector('.pf-feature-image img');
    const expected=new URL(`./portfolio/${p.image}`,location.href).href;
    if(image?.src!==expected) image=[...root.current.querySelectorAll('.pf-feature-pager img')].find(item=>item.src===expected);
    detailSource.current=image;
    setDetail(p);
  }
  function browse(){document.getElementById('pf-library').scrollIntoView({behavior:animate?'smooth':'instant',block:'start'});}
  return <div ref={root} className={`pf-page ${animate?'pf-motion':''}`}>
    <div className="pf-reading-progress" aria-hidden="true"/><header className="pf-nav"><a className="pf-brand" href="?view=portfolio"><Flask weight="fill" size={23}/><span>项目手记<small>FIELD NOTES / PERSONAL WORK</small></span></a><nav aria-label="主导航"><button onClick={browse}>作品集</button><a href="./research.html">理解与导览</a><a href="./">效果实验室 <ArrowUpRight/></a></nav><button className="pf-motion-toggle" aria-pressed={motion} onClick={()=>setMotion(!motion)}><Sparkle size={17}/>{animate?'动效已开启':reduced?'系统减少动态':'动效已关闭'}</button></header>
    <main>
      <section className="pf-hero" aria-label="精选作品">
        <div className={`pf-stage pf-stage-${selected.id}`}>
          <div className="pf-feature-image" key={selected.id}>
            {featured===1 ? <div className="pf-weather-frame"><div className="pf-weather-pane"><img src={`./portfolio/${selected.image}`} alt={`${selected.name}项目实际运行截图`}/><PortfolioAtmosphere variant="frost" enabled={frostOn} onUnavailable={()=>setGpu(false)}/>{featured===1&&<p className="pf-frost-hint" role="status">{frostOn?'轻触或移动鼠标，融开霜层；离开后慢慢凝结。':'原始雪景 · 开启冰霜可体验融化效果。'}</p>}</div></div> : <img src={`./portfolio/${featured===0?'immersive-cover.png':selected.image}`} alt={featured===0?'白鹭河谷封面视觉演绎，原始截图见项目详情':`${selected.name}项目实际运行截图`}/>}
          </div>
          {featured===0&&<PortfolioAtmosphere enabled={cloudsOn} onUnavailable={()=>setGpu(false)}/>}
          <div className="pf-intro"><span className="pf-eyebrow">独立创作档案 · 2026 / VOL. 01</span><h1 aria-label="在屏幕里，造一个小世界。"><span className="pf-title-line" aria-hidden="true"><span>在屏幕里，</span></span><span className="pf-title-line" aria-hidden="true"><span>造一个<em>小世界。</em></span></span></h1><p>从一列山间火车，到一场山居落雪。<br/>用代码记录好奇，让想法拥有可以探索的形状。</p><div className="pf-hero-actions"><button className="pf-primary" onClick={browse}>探索我的作品 <ArrowRight size={21}/></button></div></div>
          <p className="pf-stage-note">微小的场景，<br/>也能容纳辽阔的想象。</p>
          <span className="pf-stage-caption">{selected.en}</span>
          <div className="pf-stage-tools"><button className="pf-atmosphere-toggle" aria-pressed={featured===1?frost:atmosphere} disabled={!gpu||reduced||!motion||featured===2} onClick={()=>featured===1?setFrost(v=>!v):setAtmosphere(v=>!v)}><Sparkle size={16}/>{!gpu?'当前显示静态场景':!animate?'动态效果已暂停':featured===2?'人物原始画面':featured===1?(frost?'冰霜已开启':'冰霜已关闭'):atmosphere?'云雾已开启':'云雾已关闭'}</button><button className="pf-replay" disabled={!animate} onClick={()=>setReplay(n=>n+1)}>重播首屏 ↻</button></div>
        </div>
        <div className="pf-feature"><div className="pf-feature-copy"><div className="pf-feature-name"><span>0{featured+1} / 03</span><h2>{selected.name}</h2></div><p>{selected.summary}<small>{featured===0?'封面为视觉演绎 · 详情保留原始截图':'项目实际运行截图'}</small></p><button className="pf-primary" onClick={e=>open(selected,e)}>走进这个项目 <ArrowRight size={21}/></button></div><div className="pf-feature-pager" aria-label="精选作品切换">{projects.slice(0,3).map((p,i)=><button key={p.id} aria-label={`精选${p.name}`} aria-pressed={featured===i} onClick={()=>setFeatured(i)}><img src={`./portfolio/${p.image}`} alt=""/><span>{p.name}<small>0{i+1}</small></span></button>)}</div></div>
      </section>
      <section className="pf-library" id="pf-library" aria-labelledby="pf-library-title"><div className="pf-section-title"><div><span className="pf-eyebrow">THE COLLECTION / 作品收藏集</span><h2 id="pf-library-title">正在生长的作品。</h2></div><span className="pf-result-count" role="status">{visible.length} 个作品</span></div>
        <div className="pf-filters"><div className="pf-tabs" role="group" aria-label="作品分类">{['全部作品','自然场景','交互体验','信息探索'].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="pf-search"><MagnifyingGlass size={17}/><input type="search" aria-label="搜索作品" placeholder="搜索作品或能力" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="pf-saved-filter" aria-pressed={onlySaved} onClick={()=>setOnlySaved(!onlySaved)}><BookmarkSimple weight={onlySaved?'fill':'regular'}/>我的清单 {saved.length}</button></div>
        <div className="pf-grid" data-count={visible.length}>{visible.map(p=><article className="pf-project" key={p.id} data-project={p.id}><button className="pf-card-image" onClick={e=>open(p,e)} aria-label={`查看${p.name}`}><img src={`./portfolio/${p.image}`} alt={`${p.name}项目截图`} loading="lazy"/><span className="pf-card-peek">查看项目 <ArrowUpRight size={18}/></span></button><div className="pf-card-meta"><span>{p.id} / {p.category}</span><span>{p.status}</span></div><div className="pf-card-heading"><button onClick={e=>open(p,e)}><h3>{p.name}</h3></button><button className="pf-save" aria-label={`${saved.includes(p.id)?'取消收藏':'收藏'}${p.name}`} aria-pressed={saved.includes(p.id)} onClick={()=>save(p.id)}><BookmarkSimple size={21} weight={saved.includes(p.id)?'fill':'regular'}/></button></div><p>{p.summary}</p><div className="pf-project-tags">{p.features.slice(0,2).map(f=><span key={f}>{f}</span>)}</div></article>)}</div>
        {!visible.length&&<div className="pf-empty"><MagnifyingGlass size={32}/><h3>{onlySaved&&!saved.length?'先把感兴趣的作品加入清单':'没有找到匹配的作品'}</h3><p>点击作品旁的书签即可收藏；清单仅在本次页面中保留。</p><button onClick={()=>{setQuery('');setCategory('全部作品');setOnlySaved(false);}}>查看全部作品 <ArrowRight/></button></div>}
      </section>
      <section className="pf-about"><span className="pf-eyebrow">THE PRACTICE / 我的创作方法</span><h2>保持好奇。<br/>也认真打磨。</h2><p>把一次次研究留成作品，也把每个作品当作下一次探索的起点。</p><div className="pf-methods"><article><span>01 / OBSERVE</span><h3>观察与拆解</h3><p>从开源项目与真实体验中，找到值得追问的细节。</p></article><article><span>02 / BUILD</span><h3>动手构建</h3><p>把场景、声音、动作和信息，变成可以操作的原型。</p></article><article><span>03 / REFINE</span><h3>验证与打磨</h3><p>保留实际截图，记录能力边界，让每次修改都有据可循。</p></article></div><button onClick={()=>setExplain(!explain)} aria-expanded={explain}><SlidersHorizontal size={18}/>{explain?'收起效果说明':'这页的效果用在哪里？'}</button>{explain&&<div className="pf-explanation"><p><strong>入场与筛选：</strong>标题逐行揭示；作品卡片在滚入视野时显现，鼠标移动带来轻微倾斜。</p><p><strong>精选切换：</strong>场景淡入显现，标题与说明依次跟进。</p><p><strong>详情与收藏：</strong>作品图片连贯移入详情，说明随后出现；关闭时图片回到原位置。详情期间固定背景阅读位置，书签状态和提示确认操作结果。</p><p>本轮 V4.3 保留选定的 Product Design 深色设计。白鹭河谷实际使用 Canvas UI 原版 Clouds 云雾，听雨山居使用原版 Frost 冰霜：移动鼠标或轻触图片融开霜层，离开后重新凝结。两种效果各有独立开关，均为实时叠加，不声称实现 HTML 折射。关闭效果、离开首屏或切换后台时释放渲染。GSAP 负责标题、切换和卡片动效。首屏铁路封面是 AI 视觉演绎，缩略图及详情保留真实截图。顶部关闭动效后仍可使用所有功能；收藏仅保留在本次页面。</p></div>}</section>
    </main>
    <footer className="pf-footer"><span>项目手记 / 作品展览 V4.3</span><a href="./">回到视觉实验室 <ArrowUpRight size={16}/></a><small>内容来自本仓库项目档案 · 2026.09</small></footer>
    <div className="pf-toast" role="status" aria-live="polite">{toast&&<span><Check size={18}/>{toast}</span>}</div>
    {detail&&<dialog ref={dialog} className={`pf-dialog ${detail.id === '004' ? 'pf-weather-dialog' : ''}`} aria-labelledby="pf-detail-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><div ref={detailBody}><button className="pf-dialog-close" aria-label="关闭项目详情" autoFocus onClick={close}><X size={23}/></button>{detail.id === '004' ? <PortfolioWeatherStory project={detail} animate={animate} gpu={gpu} onUnavailable={()=>setGpu(false)} saved={saved.includes(detail.id)} onSave={()=>save(detail.id)}/> : <><img className="pf-detail-image" src={`./portfolio/${detail.image}`} alt={`${detail.name}实际运行截图`}/><div className="pf-detail-copy"><span className="pf-eyebrow">{detail.id} / {detail.category} / {detail.status}</span><h2 id="pf-detail-title">{detail.name}</h2><p>{detail.description}</p><h3>这个作品能做什么</h3><ul>{detail.features.map(f=><li key={f}><Check size={17}/>{f}</li>)}</ul><div className="pf-limit"><strong>当前边界</strong><p>{detail.limit}</p></div><div className="pf-detail-actions">{detail.url?<a className="pf-primary" href={detail.url} target={detail.url==='./'?undefined:'_blank'} rel="noreferrer">{detail.url==='./'?'进入实验室':'打开项目资料'} <ArrowUpRight size={19}/></a>:<span>当前可在本地项目档案查看</span>}<button className="pf-detail-save" onClick={()=>save(detail.id)}><BookmarkSimple weight={saved.includes(detail.id)?'fill':'regular'}/>{saved.includes(detail.id)?'移出清单':'加入我的清单'}</button></div></div></>}</div></dialog>}
  </div>;
}


