// 来源页按纬度、经度显示；此处统一按 lon、lat 保存。不要混入 GPS/WGS-84 坐标。
export const metadata = Object.freeze({city:'西安',date:'2026-09-14',coordinateSystem:'GCJ-02',source:'高德公开地点页',coordinateReference:'https://lbs.amap.com/api/javascript-api-v2/guide/abc/basetype',license:'地点数据再分发与商业使用许可待核实',scope:'13 个精选地点的空间理解样本，非完整城市地图'});
export const groups = Object.freeze({old:{name:'钟鼓楼与南门一带',color:'#a55036'},south:{name:'雁塔一带',color:'#376b59'},east:{name:'临潼景区',color:'#8b6732'},arrival:{name:'抵达西安',color:'#486b8b'}});
const rows = [
 ['bell','西安钟楼','钟楼','old',108.947030,34.259430,'B001D09TAA','钟楼与四条大街的交汇是认识中心城区的参考。','地标参考点'],
 ['drum','西安鼓楼','鼓楼','old',108.943512,34.260206,'B001D07CMS','在钟楼西侧，可先认识钟鼓楼的相对位置。','地标参考点'],
 ['south-gate','西安城墙（永宁门）','永宁门','old',108.947029,34.250660,'B0FFHNKLSK','位于钟楼南侧，是认识古城南缘的参考点。开放入口须另行核实。','城门地点；开放入口待核实'],
 ['xian-museum','西安博物院','西安博物院','old',108.941673,34.238589,'B001D06AOS','位于永宁门西南侧。不要与陕西历史博物馆混淆。','院区参考点；非入口'],
 ['history','陕西历史博物馆（本馆）','陕历博·本馆','south',108.955044,34.224199,'B001D03PEX','小寨东路本馆，位于大雁塔西北侧；不是秦汉馆。','馆区参考点；非入口'],
 ['pagoda','大雁塔','大雁塔','south',108.964176,34.218229,'B001D023F0','大慈恩寺内的塔，与同名地铁站是不同地点。','塔体参考点；非景区入口'],
 ['garden','大唐芙蓉园','大唐芙蓉园','south',108.974360,34.212717,'B001D092BB','位于大雁塔东南侧。图中点位代表园区，不表示入口或园区范围。','园区参考点；非入口'],
 ['huaqing','华清宫','华清宫','east',109.215759,34.356728,'B001D006F1','在中心城区东北方向的临潼一带，位于兵马俑西南侧。','景区参考点；非入口'],
 ['terracotta','秦始皇兵马俑博物馆','兵马俑博物馆','east',109.281960,34.386214,'B0FFGXMLTU','临潼区的兵马俑参观点；不代表秦始皇帝陵全部园区。','馆区参考点；非入口'],
 ['north-station','西安北站','西安北站','arrival',108.938757,34.376660,'B001D09TZP','位于钟楼北侧；与西安站分开标注。具体出入口须另查。','铁路车站参考点；非地铁站'],
 ['station','西安站','西安站','arrival',108.962723,34.278498,'B001D08UZ3','位于钟楼东北侧；不要与位置更靠北的西安北站混淆。','铁路车站参考点；非地铁站'],
 ['airport-t3','西安咸阳国际机场 T3 航站楼','机场 T3','arrival',108.761401,34.435045,'B038E0OI0C','在中心城区西北方向，属咸阳市。按实际航班确认航站楼。','T3 航站楼参考点；非到达口'],
 ['airport-t5','西安咸阳国际机场 T5 航站楼','机场 T5','arrival',108.782060,34.452254,'B0IUJUK824','与 T3 分开标注；图上的两点距离不是机场内换乘路线。','T5 航站楼参考点；非到达口']
];
export const places = Object.freeze(rows.map(([id,name,label,group,lon,lat,poi,note,semantics],i)=>Object.freeze({id,name,label,group,lon,lat,poi,note,semantics,number:i+1,source:`https://ditu.amap.com/place/${poi}`,checkedAt:metadata.date,coordinateSystem:metadata.coordinateSystem})));
export const centralIds = Object.freeze(places.filter(p=>!['east'].includes(p.group)&&!['north-station','airport-t3','airport-t5'].includes(p.id)).map(p=>p.id));
export const views = Object.freeze({overview:{title:'先看整体位置',subtitle:'机场在西北，临潼在东北；中心城区另图展开。',ids:places.map(p=>p.id)},center:{title:'展开中心城区',subtitle:'以钟楼作参考，从钟鼓楼、永宁门向南认识雁塔一带。',ids:centralIds},south:{title:'雁塔一带',subtitle:'先分清本馆、大雁塔与芙蓉园的相对位置。',ids:places.filter(p=>p.group==='south').map(p=>p.id)},east:{title:'临潼景区',subtitle:'华清宫与兵马俑在中心城区之外，空间接近不等于步行方便。',ids:places.filter(p=>p.group==='east').map(p=>p.id)}});
