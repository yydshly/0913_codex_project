import {atlasPlaces,zones,scopes,coreIds,visiblePlaces,mapCoordinate,directionFrom} from './atlas-data.mjs';
import {distanceKm} from './xian-geo.mjs';
import {basemap} from './atlas-config.mjs';
const $=id=>document.getElementById(id),L=window.L;
let scope='near',zone='all',anchor='station',selected='station',map,markers,tileLoaded=0,tileErrors=0;
const place=id=>atlasPlaces.find(p=>p.id===id),coord=p=>mapCoordinate(p,window.coordtransform.gcj02towgs84);
function relation(p){const ref=place(anchor);return p.id===anchor?'当前参照点':`距${ref.label}约 ${distanceKm(ref,p).toFixed(1)} km · ${directionFrom(ref,p)}（直线）`;}
function showDetail(id){selected=id;const p=place(id);$('place-type').textContent=`${zones[p.zone].name} / ${p.type}`;$('place-name').textContent=p.name;$('place-relation').textContent=relation(p);$('place-headline').textContent=p.headline;$('place-description').textContent=p.description;$('place-tip').textContent=p.tip;$('place-source').href=p.source;$('intro-source').href=p.introSource;document.querySelectorAll('.place-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));}
function choose(id,focus=true){showDetail(id);if(map&&focus)map.setView(coord(place(id)),14);if(map)drawMarkers();}
function renderControls(){
 $('scopes').replaceChildren(...Object.entries(scopes).map(([id,s])=>{const b=document.createElement('button');b.textContent=s.label;b.type='button';b.setAttribute('aria-pressed',String(scope===id));b.onclick=()=>{scope=id;zone='all';showDetail(anchor);renderControls();renderList();fit();};return b;}));
 $('zones').replaceChildren(...[['all',{name:'全部地点'}],...Object.entries(zones).filter(([id])=>visiblePlaces(scope,id).length)].map(([id,z])=>{const b=document.createElement('button');b.type='button';b.textContent=z.name;b.setAttribute('aria-pressed',String(zone===id));b.onclick=()=>{zone=id;showDetail(visiblePlaces(scope,zone)[0].id);renderControls();renderList();fit();};return b;}));
 $('scope-description').textContent=scopes[scope].intro;
}
function renderList(){const points=visiblePlaces(scope,zone);$('count').textContent=`${points.length} 个地点 · 当前清单 · 点击查看介绍`;
 $('place-list').replaceChildren(...points.map(p=>{const b=document.createElement('button');b.type='button';b.className='place-card';b.dataset.id=p.id;b.style.setProperty('--zone',zones[p.zone].color);b.setAttribute('aria-pressed',String(selected===p.id));for(const [tag,text] of [['small',`${zones[p.zone].name} / ${p.type}`],['h3',p.label],['p',p.headline],['span',relation(p)]]){const e=document.createElement(tag);e.textContent=text;b.append(e);}b.onclick=()=>{choose(p.id);$('map').scrollIntoView({behavior:'smooth',block:'center'});};return b;}));
}
function fit(){if(!map)return;const points=visiblePlaces(scope,zone),ref=place(anchor);map.fitBounds(L.latLngBounds([...points,ref].map(coord)),{padding:[50,55],maxZoom:14});drawMarkers();}
function addCluster(points,label){const ll=points.map(coord),center=[ll.reduce((n,p)=>n+p[0],0)/ll.length,ll.reduce((n,p)=>n+p[1],0)/ll.length];L.marker(center,{icon:L.divIcon({className:'cluster-icon',html:`<span>${label} · ${points.length}处 ＋</span>`,iconSize:[145,36],iconAnchor:[72,18]}),title:`展开${label}`,keyboard:true}).on('click',()=>map.fitBounds(L.latLngBounds(ll),{padding:[70,70],maxZoom:14})).addTo(markers);}
function drawMarkers(){markers.clearLayers();let points=visiblePlaces(scope,zone);if(!points.some(p=>p.id===anchor))points=[...points,place(anchor)];const grouped=new Set();
 if(map.getZoom()<12){for(const [ids,label] of [[coreIds,'中心城区'],[['airport-t3','airport-t5'],'咸阳机场']]){const group=points.filter(p=>ids.includes(p.id)&&p.id!==anchor);if(group.length>1){addCluster(group,label);group.forEach(p=>grouped.add(p.id));}}}
 points.filter(p=>!grouped.has(p.id)).forEach(p=>{const active=p.id===anchor,chosen=p.id===selected,c=zones[p.zone].color;const marker=L.circleMarker(coord(p),{radius:active?10:chosen?8:6,color:active?'#183f61':'#fffdf0',weight:active?4:2,fillColor:c,fillOpacity:1}).addTo(markers);marker.bindTooltip(`${active?'◎ ':''}${p.label}`,{permanent:map.getZoom()<12||active||chosen,direction:active?'top':'right',offset:active?[0,-12]:[9,0],className:'poi-label'});marker.on('click',()=>choose(p.id,false));});
}
renderControls();renderList();showDetail(selected);
$('anchor').onchange=()=>{anchor=$('anchor').value;showDetail(selected);renderList();fit();};$('reset').onclick=fit;
try{if(!L||!window.coordtransform)throw new Error('地图组件未加载');map=L.map('map',{scrollWheelZoom:false});markers=L.layerGroup().addTo(map);const tiles=L.tileLayer(basemap.url,{attribution:basemap.attribution,maxZoom:basemap.maxZoom,keepBuffer:0,updateWhenIdle:true});tiles.on('tileload',()=>{tileLoaded++;$('map-status').textContent=tileErrors?'部分底图未能加载，地点介绍仍可阅读。':'底图已加载 · 可拖动、用 + / − 缩放；密集地点点击展开。';});tiles.on('tileerror',()=>{tileErrors++;$('map-status').textContent=tileLoaded?'部分底图未能加载，地点介绍仍可阅读。':'底图暂不可用，请检查网络后刷新；地点介绍仍可阅读。';});tiles.addTo(map);L.control.scale({imperial:false}).addTo(map);map.on('zoomend',drawMarkers);fit();}catch(e){$('map-status').textContent='地图暂不可用；下方仍可查看全部地点介绍和资料来源。';console.error(e);}
