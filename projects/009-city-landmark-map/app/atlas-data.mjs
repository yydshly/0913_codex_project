import {places as base} from './xian-data.mjs';
export const CHECKED='2026-09-14';
export const zones={old:{name:'古城与城墙',color:'#a15d43',intro:'以钟楼认识城内方向，再通过城墙、碑林和博物院了解古城。'},qujiang:{name:'雁塔与曲江',color:'#587347',intro:'从博物馆、佛塔到唐风园林与夜间街区，认识城南。'},palace:{name:'大明宫',color:'#967740',intro:'在西安站以北，理解唐代宫城的遗址格局。'},lintong:{name:'临潼 · 秦唐历史',color:'#8a5f40',intro:'兵马俑与华清宫位于城区东北侧，先看区域关系，再查到达方式。'},north:{name:'北部 · 汉阳陵',color:'#7a708d',intro:'以汉代陵墓遗址补充秦唐之外的历史视角。'},qinling:{name:'秦岭山前',color:'#397b66',intro:'从翠华山到楼观一带，城市南部转向山地自然与文化景观。'},far:{name:'更远周边 · 华山',color:'#4d7593',intro:'位于渭南华阴，属于更大范围的延伸目的地，单独查看距离尺度。'},arrival:{name:'抵达参照',color:'#416a88',intro:'西安站、西安北站与机场航站楼是不同地点，按实际行程区分。'}};
const src={city:'https://www.xa.gov.cn/ztzl/ztzl/lzledc/ywdc/1824366329290301442.html',bell:'https://en.xa.gov.cn/CultureTravel/Attractions/1691691501245550594.html',pagoda:'https://xadfz.xa.gov.cn/xadq/rwxa/1802954373708996609.html',wall:'https://qjxq.xa.gov.cn/zjqj/gyqj/tsqj/5df21c5565cbd81235fc1efa.html',history:'https://www.sxhm.com/guide.html',terracotta:'https://www.bmy.com.cn/index.htm',huaqing:'https://www.hqc.cn/about/',daming:'https://qjxq.xa.gov.cn/zjqj/gyqj/tsqj/5df21c62fd8508098d284f14.html',cuihua:'https://qjxq.xa.gov.cn/xwzx/tpxw/2044354510126653442.html',louguan:'https://qjxq.xa.gov.cn/zjqj/index.html',night:'https://qjxq.xa.gov.cn/xwzx/xwdt/1897583146133217281.html'};
const profiles={
 bell:['old','城市地标','从古城中心建立方向感','明代楼阁与台基是西安的城市标志，也是理解东西南北大街的直观参照。','先辨认钟楼，再看西侧鼓楼和南侧永宁门。',src.bell],
 drum:['old','传统建筑','与钟楼相望的古城地标','长方形楼阁与钟楼形成一组容易记住的城市标志，可比较两者建筑形制与位置。','与钟楼一起理解古城核心区域。',src.bell],
 'south-gate':['old','城墙景观','从南门认识城墙内外','永宁门是古城南缘的识别点。城门、城楼和城墙有助于理解老城空间。','图中点位代表城门，不保证特定登城入口开放。',src.wall],
 'xian-museum':['old','博物馆','补充西安历史与园林体验','西安博物院与小雁塔片区提供另一种认识古城的角度，适合加入文博主题的地点清单。','与陕西历史博物馆是不同场馆。',src.city],
 history:['qujiang','博物馆','以文物了解陕西历史','这里指小寨东路的陕西历史博物馆本馆，适合把城市中分散的历史线索放到更大的背景中理解。','本馆与秦汉馆不同，出行前核对场馆与预约信息。',src.history],
 pagoda:['qujiang','历史建筑','识别城南的七层砖塔','大雁塔位于大慈恩寺内，是认识雁塔一带的核心标志；朴素的砖塔形态与周围唐风建筑不同。','地点指塔体，同名地铁站和景区入口需分别核对。',src.pagoda],
 garden:['qujiang','园林景观','感受唐风建筑与水景','大唐芙蓉园位于大雁塔东南一带，可通过园林、水面与唐风建筑认识曲江的文化景观。','园区参考点不等于入口，具体演出与开放信息另查。',src.city],
 huaqing:['lintong','历史园林','认识骊山脚下的宫苑景观','华清宫把温泉宫苑、唐文化与骊山景观联系在一起，是理解临潼历史层次的重要地点。','与兵马俑都在临潼，实际交通和参观安排仍需单独查询。',src.huaqing],
 terracotta:['lintong','考古遗址','看秦代军阵与考古展示','兵马俑博物馆的俑坑与军阵展示，提供认识秦代历史和考古现场的直接入口。','这里标兵马俑馆区，不代表秦始皇帝陵全部园区。',src.terracotta],
 'north-station':['arrival','铁路枢纽','认清更靠北的抵达点','西安北站与西安站相距明显，先确认车票上的站名，再判断住宿和景区的大方向。','地图参考点不是具体出站口。',null],
 station:['arrival','铁路枢纽','从抵达开始认识这座城','西安站是本项目的默认抵达参照，位于钟楼东北方向，可先认识它与古城、大明宫的关系。','与西安北站分别标注，参考点不是具体出站口。',null],
 'airport-t3':['arrival','机场航站楼','西北方向的航空抵达点','西安咸阳国际机场 T3 航站楼位于中心城区西北方向，属咸阳区域。','按实际航班核对航站楼，不能用图上直线估算换乘时间。',null],
 'airport-t5':['arrival','机场航站楼','与 T3 分开辨认','T5 是另一处航站楼参考点。宏观上先看机场与城区关系，进一步抵达信息以实际航班为准。','T3 与 T5 分开保存来源，缩小时可能合并为机场标签。',null]
};
const extra=[
 ['daming','大明宫国家遗址公园','大明宫',108.963530,34.292586,'B001D0ZYYD','palace','唐代遗址','从遗址读懂唐代宫城','以宫殿遗址与历史格局展示为核心，可沿丹凤门及宫城轴线理解唐代大明宫。','它是遗址公园，不是一座完整保存至今的唐代宫殿。',src.daming],
 ['hanyang','汉景帝阳陵博物院','汉阳陵',108.949302,34.442318,'B0FFMHW98M','north','汉代遗址','把历史视角延伸到汉代','汉景帝阳陵博物院位于城区北部的更大范围，是在秦唐主题之外加入汉代陵墓与文博内容的地点。','与机场同处城区北部大范围，但不是相邻步行景点。',src.city],
 ['cuihua','翠华山景区','翠华山',109.009545,33.967491,'B001D08PIN','qinling','山地自然','看天池与山崩奇石','翠华山以天池、山崩地貌与山间景观提供自然主题体验，和城内建筑文博形成互补。','山地行程需要另查天气、开放范围和实际路线。',src.cuihua],
 ['louguan','终南山古楼观历史文化景区','古楼观',108.328991,34.072514,'B0FFHCVB2G','qinling','文化景观','向西南认识楼观一带','楼观一带以道文化展示与秦岭山前环境为特色，是理解西安西南周边的另一种文化视角。','使用已核对的北门位置作参照，不等同于整个景区中心。',src.louguan],
 ['huashan','华山风景名胜区','华山',110.070978,34.493336,'B0391003ON','far','山地延伸','放到更大范围看山岳景观','华山位于渭南华阴，属于从西安向东延伸的山岳目的地，应与城区和近郊分开理解尺度。','单独查看到达、索道或登山方式；不能按城区散步安排。','https://ditu.amap.com/place/B0391003ON'],
 ['night','大唐不夜城','大唐不夜城',108.964046,34.213866,'B001D0VWAX','qujiang','夜间街区','感受唐文化主题的夜间街景','大唐不夜城以唐文化主题、街区夜景和文化商业体验形成城南的另一种游览氛围。','此处为街区参考点，不是同名地铁站；节目与营业信息另查。',src.night],
 ['beilin','西安碑林博物馆','碑林博物馆',108.952860,34.254497,'B001D06484','old','碑刻文博','把书法与石刻加入古城探索','以碑刻与石刻文化为主题，为古城建筑之外增加文字、书法与文博的观察角度。','场馆入口及具体展陈安排出行前另查。','https://www.amap.com/place/B001D06484']
];
export const atlasPlaces=Object.freeze([
 ...base.map(p=>{const [zone,type,headline,description,tip,introSource]=profiles[p.id];return Object.freeze({...p,zone,type,headline,description,tip,introSource:introSource||p.source,reach:'near'});}),
 ...extra.map(([id,name,label,lon,lat,poi,zone,type,headline,description,tip,introSource])=>Object.freeze({id,name,label,lon,lat,poi,zone,type,headline,description,tip,introSource,source:`https://${id==='beilin'?'www':'ditu'}.amap.com/place/${poi}`,coordinateSystem:'GCJ-02',checkedAt:CHECKED,semantics:id==='louguan'?'北门参考点':'景区或街区参考点；非精确入口',reach:zone==='far'?'far':'near'}))
]);
export const coreIds=atlasPlaces.filter(p=>['old','qujiang','palace'].includes(p.zone)).map(p=>p.id);
export const scopes={near:{label:'西安与近郊',intro:'先看城区、临潼、北部文博与秦岭山前，认清车站和机场。'},core:{label:'城区展开',intro:'展开城区地点，再切换插画认识建筑形象。'},far:{label:'更远周边',intro:'加入华山，展示更大的距离尺度；不意味着它是近郊景点。'}};
export function visiblePlaces(scope,zone='all'){return atlasPlaces.filter(p=>(scope==='far'||p.reach!=='far')&&(scope!=='core'||coreIds.includes(p.id)||p.id==='station')&&(zone==='all'||p.zone===zone));}
export function mapCoordinate(p,convert){if(p.coordinateSystem!=='GCJ-02'||!Number.isFinite(p.lon)||!Number.isFinite(p.lat))throw new Error('无可转换的地点坐标');const [lon,lat]=convert(p.lon,p.lat);return [lat,lon];}
export function directionFrom(a,b){const dx=(b.lon-a.lon)*Math.cos(a.lat*Math.PI/180),dy=b.lat-a.lat;if(Math.hypot(dx,dy)<.00001)return '同一地点';const bearing=(Math.atan2(dx,dy)*180/Math.PI+360)%360;return ['北','北偏东','东北','东偏北','东','东偏南','东南','南偏东','南','南偏西','西南','西偏南','西','西偏北','西北','北偏西'][Math.round(bearing/22.5)%16]+'方向';}
