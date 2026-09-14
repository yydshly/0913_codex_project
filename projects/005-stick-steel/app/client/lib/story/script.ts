export type StoryId = 'father' | 'dinner' | 'newcomer';
export const stories = [
  {id:'father', number:'01', title:'父亲慢下来了', category:'亲情 · 时间', duration:72, intro:'同一条路，后来换我等你。', cast:'赭红是父亲，蓝色是孩子。', chapters:[['小时候',0,'那时，他总走在前面。'],['长大以后',24,'我们渐渐有了不同的步速。'],['再后来',48,'这一次，换我牵着你。']], note:'用身高、步速与牵手方向的变化，表现照顾关系的转移。'},
  {id:'dinner', number:'02', title:'吵架后的晚饭', category:'伴侣 · 和解', duration:36, intro:'有些话，先放在一只碗里。', cast:'两个人，一张桌子，一顿迟迟没开始的晚饭。', chapters:[['沉默',0,'谁也没有先开口。'],['试探',12,'把你爱吃的，推近一点。'],['回应',24,'碗递过来，话就有了开头。']], note:'用视线的回避、递菜时的停顿和伸手回应，表现关系的松动。'},
  {id:'newcomer', number:'03', title:'新来的同事', category:'日常 · 接纳', duration:36, intro:'融入，有时只需要半步。', cast:'蓝色是新同事。其他人正在茶水间聊天。', chapters:[['站在外面',0,'他不知道该站在哪里。'],['被看见',12,'有人注意到了他的停顿。'],['留个位置',24,'往旁边挪一点，圈子就打开了。']], note:'用站位、转头与留出的空间，表现一个人从局外走向被接纳。'},
] as const;
export type ActorPose = {x:number;z?:number;scale?:number;walk?:number;phase?:number;lean?:number;gaze?:number;tilt?:number;sit?:boolean;left?:number[];right?:number[];wave?:number;bow?:number};
export const ease = (t:number,a:number,b:number) => {const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
export function chapterAt(id:StoryId,time:number) {const s=stories.find(s=>s.id===id)!;return Math.min(2,Math.floor(Math.max(0,time)/(s.duration/3)));}
export function storyFrame(id:StoryId,time:number) {
  const duration=stories.find(s=>s.id===id)!.duration;
  const t=Math.max(0,Math.min(duration,time));
  const chapter=chapterAt(id,t), u=t-chapter*(duration/3);
  let actors:ActorPose[]=[], subtitle='', dish=0, bowl=.53, light=0, joined=false;
  if(id==='father') {
    light=chapter*.22;
    if(chapter===0){
      const x=-2.6+u*.16;
      actors=[{x:x+.55,walk:1,phase:u*3.8,gaze:-.22},{x:x-.35,scale:.60,walk:1,phase:u*5.1,gaze:.4}];
      const h=[x+.03,.98,0];actors[0].left=h;actors[1].right=h;joined=true;
      subtitle=u<7?'小时候，我总要小跑，才能跟上他。':u<16?'“慢一点，爸。”':'他没说什么，只把我的手握紧了些。';
    } else if(chapter===1){
      actors=[{x:-2.5+u*.105,walk:.65,phase:u*3,gaze:.4,lean:.03},{x:-1.7+u*.155,scale:1.04,walk:1,phase:u*4,gaze:u>17?-.7:.6}];
      actors[0].right=[actors[0].x+.4,1.08+.12*Math.sin(Math.PI*ease(u,8,16)),0];
      subtitle=u<9?'长大以后，我开始走在前面。':u<18?'聊着自己的事，很少回头。':'偶尔回头，才发现他落在了后面。';
    } else {
      const turn=ease(u,5,10), meet=ease(u,10,15), walk=ease(u,18,23);
      const dad=-2+Math.min(u,10)*.045+walk*.50;
      const child=.3+ease(u,0,4)*.65-meet*1.57+walk*.50;
      actors=[{x:dad,scale:.93,walk:u<10?.28:walk*.3,phase:u*2,lean:.19,gaze:.3,bow:.03},
        {x:child,scale:1.04,walk:u<4?.8:u>10&&u<15?-.6:walk*.3,phase:u*3.4,gaze:.4-turn*1.15,tilt:turn*.09}];
      if(u>14){const blend=ease(u,14,17),h=[dad+.45,1.03,0];actors[0].right=h;actors[1].left=[child+(-.4)*blend,1.03,0];if(u>=17)actors[1].left=h;joined=u>=17;}
      subtitle=u<6?'再后来，他走得越来越慢。':u<12?'我停了下来。':u<18?'“不急，我们一起走。”':'同一条路，这次换我等你。';
    }
  } else if(id==='dinner'){
    const push=ease(t,14,21), answer=ease(t,26,32);
    dish=-.35+push*.53;bowl=.45-answer*.60;
    actors=[{x:-.9,sit:true,lean:.18*push,gaze:-.55+ease(t,9,15)*1.1,tilt:.05,bow:.1-ease(t,29,34)*.07},
      {x:.9,sit:true,lean:-.18*answer,gaze:.55-answer*1.1,tilt:-.05,bow:.13-answer*.09}];
    actors[0].right=t>12&&t<24?[dish-.12,1.12,.15]:[-.62,1.07,.15];
    actors[1].left=t>25?[bowl+.15,1.15,.12]:[.66,.98,.12];
    subtitle=t<8?'那天的晚饭，比平时安静。':t<14?'她看着桌上的菜。':t<24?'他把那盘菜，慢慢推了过去。':t<30?'过了一会儿，她把碗递了回来。':'“再给我盛一点吧。”';
  }else{
    const notice=ease(t,12,17), space=ease(t,20,26), join=ease(t,26,33);
    actors=[{x:-.5-space*.58,z:-.1,gaze:-.1+notice*.9,wave:Math.sin(Math.PI*ease(t,17,23))*.8},
      {x:2.8-join*2.15,z:.55,walk:t>26&&t<33?-.55:0,phase:t*3.5,gaze:-.6,bow:.1*(1-join)},
      {x:.75+space*.7,z:-.18,gaze:-.45+space*.9},
      {x:.13-space*.16,z:-.8,scale:.98,gaze:.1+space*.65}];
    subtitle=t<9?'第一天，他端着杯子，站在聊天声外面。':t<17?'想说些什么，又怕打断别人。':t<25?'“你也刚搬来？过来一起聊。”':t<32?'有人侧了侧身，留出了一个位置。':'半步的空隙，刚好容得下一个人。';
  }
  return {actors,chapter,subtitle,dish,bowl,light,joined,time:t};
}
