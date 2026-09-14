export const voices={narrator:'Chinese (Mandarin)_Gentleman',child:'cute_boy',woman:'Chinese (Mandarin)_Warm_Bestie',colleague:'Chinese (Mandarin)_Sincere_Adult'};
const cue=(start,end,text,role='narrator')=>({start,end,text,role});
export const narration={
  father:{duration:72,cues:[
    cue(.5,7,'小时候，我总要小跑，才能跟上他。'),cue(7.5,16,'慢一点，爸。','child'),cue(16.5,24,'他没说什么，只把我的手握紧了些。'),
    cue(24.5,33,'长大以后，我开始走在前面。'),cue(33.5,42,'聊着自己的事，很少回头。'),cue(42.3,48,'偶尔回头，才发现他落在了后面。'),
    cue(48.3,54,'再后来，他走得越来越慢。'),cue(54.5,60,'我停了下来。'),cue(60.5,66,'不急，我们一起走。'),cue(66.3,72,'同一条路，这次换我等你。')
  ]},
  dinner:{duration:36,cues:[cue(.5,8,'那天的晚饭，比平时安静。'),cue(8.3,14,'她看着桌上的菜。'),cue(14.3,24,'他把那盘菜，慢慢推了过去。'),cue(24.3,30,'过了一会儿，她把碗递了回来。'),cue(30.3,36,'再给我盛一点吧。','woman')]},
  newcomer:{duration:36,cues:[cue(.5,9,'第一天，他端着杯子，站在聊天声外面。'),cue(9.3,17,'想说些什么，又怕打断别人。'),cue(17.3,25,'你也刚搬来？过来一起聊。','colleague'),cue(25.2,32,'有人侧了侧身，留出了一个位置。'),cue(32.1,36,'半步的空隙，刚好容得下一个人。')]}
};
