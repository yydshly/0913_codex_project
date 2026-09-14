import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, BookmarkSimple, Sun, CloudRain, Snowflake } from '@phosphor-icons/react';
import { PortfolioAtmosphere } from './portfolio-atmosphere';
import './portfolio-weather-story.css';

const scenes = [
  { id: 'clear', label: '晴天', icon: Sun, image: 'weather-clear.jpg', ratio: '841 / 898', number: '01', title: '光线，让远山有了层次。', caption: '晴空与远山 · 天空观察机位', text: '从明亮的天空到层层山色，观察天气如何改变空间的明暗与远处能见度。', observation: '看远处：山体轮廓、天空颜色与明暗层次。', source: '2026.09.14 · 天空连续性研究' },
  { id: 'rain', label: '雨天', icon: CloudRain, image: 'weather-rain.jpg', ratio: '16 / 9', number: '02', title: '坐到檐下，听一场雨。', caption: '檐下茶席 · 雨中庭院', text: '视线从茶席越过屋檐，落到湿润的石径和院落。进入实时场景，还可以观察雨滴与地面积水，并手动开启环境声音。', observation: '看近处：屋檐边缘、雨丝与石径上的湿润反光。', source: '2026.09.14 · 檐下雨景研究' },
  { id: 'snow', label: '雪景', icon: Snowflake, image: 'weather.jpg', ratio: '861 / 898', number: '03', title: '一场雪，重新描绘庭院。', caption: '庭院全景 · 积雪与暖光', text: '白雪覆盖地表与远山，屋内暖光留下空间的温度。移过照片可以融开额外的冰霜层，再关闭冰霜，比较原始画面。', observation: '看覆盖：庭院、树冠和远山的白色表面，以及灯光的冷暖对照。', source: '2026.09.14 · 本地雪景记录' },
];

export function PortfolioWeatherStory({ project, animate, gpu, onUnavailable, saved, onSave }) {
  const [selected, setSelected] = useState(2);
  const [ice, setIce] = useState(true);
  const [loaded, setLoaded] = useState('');
  const [failed, setFailed] = useState(false);
  const copy = useRef(null), image = useRef(null), tabs = useRef([]);
  const previous = useRef(selected);
  const scene = scenes[selected];
  useEffect(() => {
    if (previous.current === selected) return;
    previous.current = selected;
    if (!animate) return;
    const element = copy.current;
    const tween = gsap.fromTo(element, { opacity: .35 }, { opacity: 1, duration: .35, clearProps: 'opacity' });
    return () => { tween.kill(); gsap.set(element, { clearProps: 'opacity' }); };
  }, [selected, animate]);
  useEffect(() => {
    if (!loaded || !animate) return;
    const element = image.current;
    const tween = gsap.fromTo(element, { opacity: .25 }, { opacity: 1, duration: .4, clearProps: 'opacity' });
    return () => { tween.kill(); gsap.set(element, { clearProps: 'opacity' }); };
  }, [loaded, animate]);
  function select(index) { if (index === selected) return; setFailed(false); setSelected(index); }
  function keys(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % scenes.length;
    if (event.key === 'ArrowLeft') next = (index + scenes.length - 1) % scenes.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = scenes.length - 1;
    if (next === undefined) return;
    event.preventDefault(); select(next); tabs.current[next].focus();
  }
  return <>
    <section className="pf-weather-gallery" aria-label="听雨山居场景展示">
      <div className="pf-weather-gallery-head"><span>WEATHER STUDIES / 场景手记</span><span>{scene.number} / 03</span></div>
      <div className="pf-weather-tabs" role="tablist" aria-label="选择天气画面">
        {scenes.map((item, index) => <button key={item.id} ref={el => { tabs.current[index] = el; }} id={`weather-tab-${item.id}`} role="tab" aria-selected={selected === index} aria-controls="weather-panel" tabIndex={selected === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => keys(event, index)}><item.icon size={18}/>{item.label}</button>)}
      </div>
      <div id="weather-panel" role="tabpanel" aria-labelledby={`weather-tab-${scene.id}`}>
        <div className="pf-weather-visual">
          <div className="pf-weather-photo" style={{ '--scene-ratio': scene.ratio }}>
            <img ref={image} className="pf-detail-image" src={`./portfolio/${scene.image}`} alt={`听雨山居真实截图：${scene.caption}`} onLoad={() => setLoaded(scene.image)} onError={() => setFailed(true)}/>
            {scene.id === 'snow' && <PortfolioAtmosphere variant="frost" enabled={ice && animate && gpu && loaded === scene.image && !failed} onUnavailable={onUnavailable}/>}
          </div>
          {failed && <p className="pf-weather-error" role="alert">图片暂未载入，请关闭详情后重试。</p>}
        </div>
        <div className="pf-weather-caption"><span>{scene.caption}</span>{scene.id === 'snow' && <button aria-pressed={ice} disabled={!animate || !gpu} onClick={() => setIce(value => !value)}>{!gpu ? '静态画面' : !animate ? '冰霜已暂停' : ice ? '冰霜已开启' : '冰霜已关闭'}</button>}</div>
      </div>
      <p className="pf-weather-provenance">真实截图 · 不同机位与研究阶段<br/>此处切换展示素材；实时天气与声音请进入场景体验。</p>
    </section>
    <div className="pf-detail-copy pf-weather-story">
      <span className="pf-eyebrow">004 / 自然场景 / 可体验原型</span>
      <h2 id="pf-detail-title">听雨山居</h2>
      <p className="pf-weather-lead">同一座山居，三种天气的感受。</p>
      <div ref={copy} className="pf-weather-chapter" aria-live="polite">
        <span className="pf-eyebrow">场景 {scene.number}</span>
        <h3>{scene.title}</h3><p>{scene.text}</p>
        <p className="pf-weather-observation">{scene.observation}</p>
      </div>
      <div className="pf-weather-next"><span className="pf-eyebrow">亲自体验</span><p>进入场景后选择天气与机位；声音由你手动开启。</p></div>
      <div className="pf-detail-actions"><a className="pf-primary" href={`${project.url}lab/`} target="_blank" rel="noreferrer">进入实时场景 <ArrowUpRight size={18}/></a><button className="pf-detail-save" onClick={onSave}><BookmarkSimple size={18} weight={saved ? 'fill' : 'regular'}/>{saved ? '移出清单' : '加入我的清单'}</button></div>
      <a className="pf-weather-research" href={project.url} target="_blank" rel="noreferrer">查看研究记录 <ArrowUpRight size={14}/></a>
      <p className="pf-weather-footnote">{scene.source}<br/>冰霜为照片上的交互叠加；不是天气预报或结冰物理模拟。</p>
    </div>
  </>;
}
