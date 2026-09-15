export function createService(length,station,start){let s=start,v=2.7,dwell=0,stops=0,status='沿山谷行驶',next=station,held=false;while(next<=s+1)next+=length;
 return{hold(value){held=!!value;},get held(){return held},get distance(){return s},get speed(){return v},get dwell(){return dwell},get stops(){return stops},get status(){return status},get progress(){return((s/length)%1+1)%1},park(){if(dwell<=0){s=next;stops++;}v=0;dwell=5.5;status='白鹭河站 · 停靠中';},update(dt,multiplier=1,paused=false,curvature=0){if(paused)return;const steps=Math.max(1,Math.ceil(dt/.025));for(let i=0;i<steps;i++){const d=dt/steps;if(dwell>0){if(held){v=0;status='白鹭河站 · 上下客';continue;}dwell=Math.max(0,dwell-d);v=0;status='白鹭河站 · 停靠中';if(dwell===0){next+=length;status='离开白鹭河站'}continue}const ahead=next-s,cruise=4.8*multiplier*Math.max(.55,1-curvature),target=Math.min(cruise,Math.sqrt(Math.max(0,2*.68*(ahead-.04))));v+=Math.max(-.85*d,Math.min(.45*d,target-v));v=Math.max(0,v);s+=v*d;if(ahead<.1&&v<.3){s=next;v=0;dwell=5.5;stops++;status='白鹭河站 · 停靠中'}else status=ahead<15?'正在进站':'沿山谷行驶';}}};}
export const stageDefinitions=[
{title:'地形与轨道',short:'空间骨架',description:'统一地形高度、闭合线路和峡谷桥，形成可运行的空间基础。',added:'山体 · 河谷 · 钢轨 · 枕木 · 峡谷桥'},
{title:'列车开始运行',short:'列车运行',description:'两节列车沿同一条线路运行，转向架随弯道转动；到站减速并停留。',added:'两节列车 · 路径跟随 · 进站制动 · 驻站'},
{title:'河岸有了生命',short:'植被与水流',description:'加入茶站、林木、河流和瀑布。树木避开铁路，水面沿河谷持续流动。',added:'白鹭河站 · 实例化林木 · 河流 · 瀑布与水雾'},
{title:'环境产生气氛',short:'天气与灯光',description:'切换昼夜雨景，观察天空、材质、车窗和灯光一起变化；风雨作用于实际场景。',added:'昼夜预设 · 风雨 · 湿润表面 · 车灯与光晕'},
{title:'成为观景体验',short:'镜头与展示',description:'从全景进入茶站、峡谷桥和瀑布，也可以跟随列车，或开启自动观景。',added:'观景视角 · 跟车镜头 · 自动运镜 · 手动接管'}
];
