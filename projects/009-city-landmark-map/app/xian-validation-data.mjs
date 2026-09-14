import {atlasPlaces} from './atlas-data.mjs';
import {newCoordinates} from './xian-new-coordinates.mjs';
import {spatialEvidence} from './xian-spatial-evidence.mjs';
const date='2026-09-14';
const src={forest:'https://lyj.shaanxi.gov.cn/zwxx/lydt/202505/t20250520_3520672.html',mountain:'https://xian.qinfeng.gov.cn/info/1174/30705.htm',village:'https://zhuanti.mct.gov.cn/xcss2024_nlhwzzxc/shanxi1/detail/8174.html',city:'https://www.xa.gov.cn/ztzl/ztzl/lzledc/ywdc/1824366329290301442.html',bailu:'https://www.xa.gov.cn/sq/csgk/qxgk/1955453645970071553.html'};
const newRows=[
 ['zhuque','朱雀国家森林公园','山林','西安·鄠邑','森林、山景与山地地貌','https://lyj.shaanxi.gov.cn/stwh/sxgjgy/202503/P020250310383614567409.pdf'],
 ['taiping','太平国家森林公园','山林','西安·鄠邑','森林、流水与季节植被','https://xaqlbhj.xa.gov.cn/xwdt/qldt/1964864987608932353.html'],
 ['nanwutai','南五台','山林','西安·长安','山景、登临与宗教文化',src.mountain],
 ['wangshun','王顺山','山林','西安·蓝田','峰林与森林景观',src.mountain],
 ['heihe','黑河国家森林公园','山林','西安·周至','森林生态与山地环境',src.forest],
 ['qinling-zoo','西安秦岭野生动物园','动物与自然教育','西安·长安滦镇','动物观察与家庭游园',src.city],
 ['four-treasures','秦岭四宝科学公园','动物与自然教育','西安·周至楼观','秦岭动物保护与自然教育','https://zhuanti.mct.gov.cn/xcszbwg2022/shanxi2/detail/2020.html'],
 ['botanical','秦岭国家植物园','动物与自然教育','西安·周至集贤','植物多样性与自然教育','https://www.qinlingbg.com/post/%E5%9B%AD%E5%8C%BA%E7%AE%80%E4%BB%8B/'],
 ['natural-museum','陕西自然博物馆','动物与自然教育','西安·城区','地质、古生物与自然标本','https://xadfz.xa.gov.cn/xadq/rwxa/6281fe1af8fd1c0bdc97f214.html'],
 ['yuanjia','袁家村','乡村民俗','咸阳·礼泉烟霞镇','关中饮食、传统作坊与乡村民俗',src.village],
 ['mawei','马嵬驿民俗文化体验园','乡村民俗','咸阳·兴平','民俗展示与关中饮食',src.village],
 ['fucha','茯茶镇','乡村民俗','西咸新区·泾河新城','茯茶文化与品茶休闲','https://gjcr.moa.gov.cn/cxcy/202005/t20200519_6344528.htm'],
 ['bailucang','白鹿仓景区','乡村民俗','西安·灞桥','民俗主题街区与家庭休闲',src.bailu],
 ['bailu-film','白鹿原影视城','影视文化','西安·蓝田','文学题材、影视场景与演艺','https://www.sxtourgroup.com/home/Party_building/index.html?catId=188'],
 ['zhouzhi-water','周至水街·烟火巷子','乡村民俗','西安·周至','水街休闲与夜间氛围','https://wlj.xa.gov.cn/xxgk/tzgg/1839203941456883713.html'],
 ['tang-village','长安唐村','乡村民俗','西安·长安','田园与文化休闲','https://wlj.xa.gov.cn/wlxw/gzdt/2079843114999664642.html'],
 ['taibai','太白山','远郊山地','宝鸡方向·具体景区待辨认','山岳景观与垂直自然环境',src.forest],
 ['niubeiliang','牛背梁国家森林公园','远郊山地','商洛·柞水','秦岭南侧森林山地','https://www.snzs.gov.cn/html/zwyw/zhbd/100708.html'],
 ['zhashui-cave','柞水溶洞','远郊地质','商洛·柞水','溶洞地质景观','https://www.snzs.gov.cn/html/zwyw/zhbd/100708.html']
];
const evidence=(url,claim)=>({url,claim,originGroup:new URL(url).hostname,checkedAt:date,review:'既有研究资料迁移；不代表本轮重新核验全部页面',license:'待核实'});
export const xianCase={id:'xian-2026-09-v1',name:'西安与周边',country:'CN',anchorId:'station',centerId:'bell',agreementMeters:500,
 requiredIds:['zhuque','qinling-zoo','yuanjia','bailuyuan-region','bailucang','bailu-film'],
 scope:'以西安站为抵达参照、钟楼为城区参照，向周边扩展；不以西安市行政边界删除目的地。500米为同类参考点初步筛查阈值，不是位置精度承诺。'};
export const xianCandidates=[
 ...atlasPlaces.map(p=>({id:p.id,name:p.name,country:'CN',kind:p.zone==='arrival'?'arrival':'destination',category:p.type,area:p.zone,reason:p.headline,evidence:[evidence(p.introSource,p.description)],reputationStatus:'未单独采集口碑证据',
 coordinates:[{placeId:p.id,providerPlaceId:p.poi,lon:p.lon,lat:p.lat,crs:p.coordinateSystem,pointRole:p.id==='louguan'?'north-gate':'reference-point',pointDescription:p.semantics,originGroup:'amap',url:p.source,checkedAt:p.checkedAt}]})),
 ...newRows.map(([id,name,category,area,reason,url])=>({id,name,category,area,reason,country:'CN',kind:'destination',evidence:[evidence(url,reason)],coordinates:newCoordinates.filter(p=>p.placeId===id),spatialEvidence:spatialEvidence[id],reputationStatus:'未单独采集口碑证据',...(id==='zhuque'?{regionalEvidence:{description:'省生态环境厅公开环评资料提及东经108°26′—108°40′、北纬33°46′—34°01′；仅粗范围，原文坐标系未明确，未当作入口或中心坐标。',source:'https://sthjt.shaanxi.gov.cn/sy/gs/202109/P020241011607122993932.pdf',checkedAt:date,readMethod:'检索可读摘录，全文读取未成功',status:'regional-only'}}:{})})),
 {id:'bailuyuan-region',name:'白鹿原（地域）',country:'CN',kind:'region',category:'地域',area:'西安东部',reason:'组织具体目的地，不虚构一个统一入口',evidence:[evidence(src.bailu,'白鹿原片区与白鹿仓；地域不等于单一景区')],coordinates:[],reputationStatus:'不适用'}
];
