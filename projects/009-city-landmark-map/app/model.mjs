export const THEMES = {paper:{paper:'#f5f0e6',ink:'#254837',accent:'#a56a36'},forest:{paper:'#173e36',ink:'#f5f0e6',accent:'#d9bd7b'},ink:{paper:'#253041',ink:'#f5f0e6',accent:'#c5af87'}};
const tc='https://www.tengchong.gov.cn/info/16031/5029153.htm';
const lj='https://mzzj.yn.gov.cn/html/2023/lvyoucujingeminzujiaowangjiaoliujiaorong_0314/47745.html';
const snow='https://nync.yn.gov.cn/html/2021/yunnongkuanxun-new_0422/377973.html';
export const CITIES={
tengchong:{name:'腾冲',english:'TENGCHONG',subtitle:'火山与热海之间',caption:'在山水之间，收藏一座城的记忆。',image:'tengchong-art.png',landmarks:[
['火山地质公园','自然','圆形火山口与植被构成鲜明的地貌特征。图中火山为艺术化表达。',29,33,tc],
['北海湿地','自然','水面、草甸与栈道组成湿地主题；形状与位置未经测绘。',76,35,tc],
['和顺古镇','人文','以白墙灰瓦、街巷与院落表现侨乡古镇。建筑细节为生成式诠释。',29,56,tc],
['叠水河瀑布','自然','将瀑布落差、岩壁和水流作为主体；图中桥梁为艺术构图。',76,61,tc],
['热海景区','自然','以温泉水面、岩石和白色水汽表现地热景观。',30,83,tc],
['来凤山文笔塔','人文','腾冲来凤山的地标建筑。插画未精确还原塔层数与比例。',77,87,'https://www.tengchong.gov.cn/info/25681/5682833.htm']
]},
lijiang:{name:'丽江',english:'LIJIANG',subtitle:'雪山脚下的古城时光',caption:'沿着水巷，把日子过得慢一些。',image:'lijiang-art.png',landmarks:[
['玉龙雪山','自然','以雪峰与森林表现雪山主题，山体轮廓为艺术概括。',45,24,snow],
['蓝月谷','自然','以蓝绿色水面与叠层瀑布表现山谷景观。',76,35,snow],
['黑龙潭','人文','湖面、石桥和亭阁形成公园主题，建筑与位置为艺术重排。',27,51,lj],
['大研古城','人文','以灰瓦屋顶、水巷和街区表现古城肌理。',74,62,lj],
['狮子山万古楼','人文','以多层木构楼阁和林木表现狮子山主题，造型未逐项复核。',24,75,'https://mz.yn.gov.cn/html/2024/difangdongtai_1014/4056137.html'],
['木府','人文','以层叠院落与传统建筑表达木府，不作为建筑测绘依据。',72,87,lj]
]}};
export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const limited=(value,max,label)=>{if(typeof value!=='string'||value.length>max)throw new Error(label+'格式不正确');return value;};
export function createState(city='tengchong'){
 if(!Object.hasOwn(CITIES,city))throw new Error('不支持的城市');
 const c=CITIES[city];return {version:1,city,title:c.name,subtitle:c.subtitle,caption:c.caption,theme:'paper',labelStyle:'full',selected:0,landmarks:c.landmarks.map((l,i)=>({id:i,name:l[0],x:l[3],y:l[4],visible:true}))};
}
export function validateState(raw){
 if(!raw||raw.version!==1||!Object.hasOwn(CITIES,raw.city))throw new Error('无法识别工程版本或城市');
 const s=createState(raw.city);
 s.title=limited(raw.title,14,'标题');s.subtitle=limited(raw.subtitle,40,'副标题');s.caption=limited(raw.caption,48,'寄语');
 if(!Object.hasOwn(THEMES,raw.theme)||!['full','number','none'].includes(raw.labelStyle))throw new Error('版式设置无效');
 s.theme=raw.theme;s.labelStyle=raw.labelStyle;
 if(!Array.isArray(raw.landmarks)||raw.landmarks.length!==6)throw new Error('工程必须包含六个地标');
 s.landmarks=raw.landmarks.map((m,i)=>{if(!m||m.id!==i||typeof m.visible!=='boolean'||!Number.isFinite(m.x)||!Number.isFinite(m.y))throw new Error('地标数据无效');return {id:i,name:limited(m.name,18,'地标名称'),x:clamp(m.x,10,90),y:clamp(m.y,18,87),visible:m.visible};});
 s.selected=Number.isInteger(raw.selected)?clamp(raw.selected,0,5):0;return s;
}
export function moveLandmark(state,index,x,y){if(!Number.isInteger(index)||!state.landmarks[index]||!Number.isFinite(x)||!Number.isFinite(y))throw new Error('位置无效');state.landmarks[index].x=clamp(x,10,90);state.landmarks[index].y=clamp(y,18,87);}
export function makePrompt(city,landmarks,mood='miniature'){
 const name=String(city).trim();if(!name||name.length>30)throw new Error('请填写 1–30 字的城市名称');
 const spots=String(landmarks).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(spots.length<1||spots.length>12||spots.some(x=>x.length>60))throw new Error('请填写 1–12 个地标，每个不超过 60 字');
 const styles={miniature:'斜俯视的精细微缩模型，真实材质与柔和日光',watercolor:'精致水彩旅行插画，保留地标辨识度与纸张纹理',papercut:'分层纸雕艺术，清晰的景物轮廓与自然投影'};
 if(!Object.hasOwn(styles,mood))throw new Error('画面风格无效');
 return ['为“'+name+'”制作一张城市地标插画地图。','用途：城市印象与旅行纪念，艺术示意，不用于导航。','先核实以下地标的城市归属与代表性外形；对无法核实的项目说明不确定性，不补造事实。','地标：'+spots.join('、')+'。','画面：'+styles[mood]+'。采用 3:4 竖版，主景完整，地标大小有层次，四周保留少量留白。','用简化街巷、植被和水面组织画面，允许明确的艺术化重排，不提供比例尺或导航承诺。','仅生成无文字插画底图：不要城市标题、标签、编号、图例、水印或界面元素。中文名称与标题在后期独立排版，便于校正。','避免地标遗漏、重复、凭空增加标志建筑，避免高楼等与主题无关的元素。','保存原始提示词、模型版本、完整输出和人工修改记录；这份说明不是已经生成的图像。'].join('\n\n');
}
