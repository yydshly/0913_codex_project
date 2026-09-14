import {ease} from '../story/script';

export type CharacterId='lin'|'zhou'|'tang'|'chen';
export type Appearance={color:string;hair:string;style:'bob'|'crop'|'curls'|'receding';coat:'jacket'|'vest'|'cardigan';glasses:boolean;bag:boolean;shoulder:number};
export const characters=[
  {id:'lin',name:'林乔',age:'32 岁 · 建筑师',tag:'利落，也有点心急',color:'#9c5545',appearance:{color:'#9c5545',hair:'#454640',style:'bob',coat:'jacket',glasses:false,bag:true,shoulder:.22},look:'短发、短外套、斜挎包。轮廓紧凑，保留细线四肢。',motion:'快步进门，先抬手回应；坐下时动作干脆，随后才转头看人。',relation:'熟悉的人在等她。她不用确认自己是否受欢迎，但容易把节奏带得太快。',beats:['步子大、摆臂快，身体先向前。','手先抬起来，视线稍后才跟上。','迅速落座，再把注意力转向对方。'],next:'忙碌后的重逢、伴侣的节奏差异、工作与生活的切换。'},
  {id:'zhou',name:'周岚',age:'68 岁 · 退休教师',tag:'克制，做事有分寸',color:'#526e79',appearance:{color:'#526e79',hair:'#b9bbb3',style:'crop',coat:'vest',glasses:true,bag:false,shoulder:.21},look:'银色短发、圆框眼镜、整齐的马甲。站姿挺直，年龄不靠弯腰表达。',motion:'走到门内先站稳，看清对方再点头；坐下前把手收拢。',relation:'她习惯先认真听别人。回应很小，但视线一直落在对方身上。',beats:['走稳后停一下，先观察。','看向对方，以一个小点头回应。','双手收拢，平稳落座，保持端正。'],next:'退休后的新关系、与成年孩子相处、想帮助却学着放手。'},
  {id:'tang',name:'唐悦',age:'72 岁 · 退休裁缝',tag:'热情，总想靠近一点',color:'#7c8059',appearance:{color:'#7c8059',hair:'#bbb8aa',style:'curls',coat:'cardigan',glasses:false,bag:false,shoulder:.24},look:'蓬松卷发、宽松开衫、圆润衣摆。与周岚同为老年女性，轮廓和习惯不同。',motion:'小步走近，反复招手；坐下后又把椅子向对方挪近一点。',relation:'她主动缩短距离。热情来自个人性格，不是年龄的统一动作。',beats:['小步但不迟疑，走着就开始招手。','手势幅度大，身体跟着回应。','坐下还不够，再往对方身边挪一点。'],next:'邻里重逢、学着独处、过分热心之后理解别人的边界。'},
  {id:'chen',name:'陈远',age:'58 岁 · 配送司机',tag:'疲惫，但愿意回应',color:'#827160',appearance:{color:'#827160',hair:'#66645c',style:'receding',coat:'jacket',glasses:false,bag:false,shoulder:.26},look:'后移的发际线、深色夹克、略宽的肩。疲惫通过姿态呈现。',motion:'进门后垂着肩停一会儿；抬眼回应，坐下时手扶大腿。',relation:'等他的人让他放松下来。落座后，他抬起头，身体慢慢朝对方靠近。',beats:['脚步拖慢，肩头下沉，停在门内。','先抬眼，迟一点才抬手。','缓缓坐下，扶腿，再向对方靠近。'],next:'一天结束后的陪伴、不善言辞的关心、亲人看见彼此的辛苦。'},
] as const satisfies readonly {id:CharacterId;name:string;age:string;tag:string;color:string;appearance:Appearance;look:string;motion:string;relation:string;beats:readonly string[];next:string}[];
export const duration=24;
export type PerformancePose={x:number;walk:number;phase:number;sit:number;lean:number;gaze:number;bow:number;wave:number;hands:number;smile:number;chair:number};
export function characterFrame(id:CharacterId,time:number):PerformancePose{
  const t=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0));
  const configs={lin:[.2,4.8,14,15.6,4.9,.95],zhou:[1.2,7,15,18.5,3.1,.55],tang:[.5,6.5,17,20,4,.48],chen:[2.7,8,15.2,20.5,2.5,.4]};
  const [start,stop,down,end,tempo,stride]=configs[id];
  const entry=ease(t,start,stop),sit=ease(t,down,end),envelope=Math.sin(Math.PI*entry),scoot=id==='tang'?.33*ease(t,21,23):0;
  let lean=0,gaze=.6*ease(t,8,10),bow=0,wave=0,hands=0,smile=.4;
  if(id==='lin'){lean=-.11*envelope;wave=Math.sin(Math.PI*ease(t,5,9))*.9;gaze=.75*ease(t,9,11);hands=.3*sit;}
  if(id==='zhou'){bow=.15*Math.sin(Math.PI*ease(t,9,12));wave=.12*Math.sin(Math.PI*ease(t,10,13));hands=ease(t,13,15);smile=.25;}
  if(id==='tang'){wave=(.75+.2*Math.sin(t*7))*Math.sin(Math.PI*ease(t,3,13));lean=.09*Math.sin(Math.PI*ease(t,8,14))+.06*sit;hands=.4*sit;smile=.9;}
  if(id==='chen'){lean=-.13*(1-ease(t,20,24))+.12*ease(t,20,24);bow=.2*(1-ease(t,8,12));gaze=.65*ease(t,10,13);wave=.3*Math.sin(Math.PI*ease(t,11,14));hands=ease(t,14,16);smile=.15+.45*ease(t,20,24);}
  return {x:-1.85+entry*1.9+scoot,walk:stride*envelope,phase:t*tempo,sit,lean,gaze,bow,wave,hands,smile,chair:.05+scoot};
}
export function performanceBeat(time:number){return time<8?0:time<14?1:2;}
