export const MAPS={
 overworld:{name:'余火边境',spawn:{x:-4,z:2},color:'#142222',level:'营地 · 林地 · 采场',bounds:27},
 crypt:{name:'沉钟墓穴 · 上层',spawn:{x:0,z:18},color:'#09131d',level:'探索 · 双机关 · 救援',bounds:26,rooms:[{x:0,z:17,w:12,d:10},{x:0,z:8,w:5,d:14},{x:0,z:0,w:13,d:13},{x:-9,z:0,w:12,d:5},{x:9,z:0,w:12,d:5},{x:-17,z:0,w:12,d:12},{x:17,z:0,w:12,d:12},{x:0,z:-9,w:5,d:12},{x:0,z:-18,w:14,d:10}],solids:[{x:-3,z:1,w:1.2,d:1.2},{x:3,z:1,w:1.2,d:1.2},{x:-20,z:-3,w:1.2,d:1.2},{x:20,z:-3,w:1.2,d:1.2}]},
 depths:{name:'熔心圣所 · 下层',spawn:{x:0,z:18},color:'#1b1012',level:'熔火陷阱 · 裂隙领主',bounds:26,rooms:[{x:0,z:18,w:12,d:9},{x:0,z:11,w:5,d:12},{x:0,z:4,w:22,d:12},{x:0,z:-5,w:7,d:12},{x:0,z:-15,w:25,d:15},{x:-15,z:4,w:13,d:4},{x:-20,z:4,w:8,d:10}],solids:[{x:-7,z:5,w:1.4,d:1.4},{x:7,z:5,w:1.4,d:1.4},{x:-9,z:-15,w:1.5,d:1.5},{x:9,z:-15,w:1.5,d:1.5}]}
};
export const DUNGEON_POINTS=[
 {id:'crypt-exit',name:'阶梯 · 返回边境',type:'travel',area:'crypt',to:'overworld',x:0,z:20},
 {id:'crypt-rest',name:'旧守望者篝火',type:'rest',area:'crypt',x:3,z:17},
 {id:'lever-west',name:'西侧共鸣机关',type:'lever',area:'crypt',x:-18,z:-1},
 {id:'lever-east',name:'东侧共鸣机关',type:'lever',area:'crypt',x:18,z:-1},
 {id:'scout',name:'被困的斥候',type:'rescue',area:'crypt',x:-19,z:3},
 {id:'crypt-chest',name:'守望者遗物箱',type:'chest',area:'crypt',x:19,z:3},
 {id:'descent',name:'封印门 · 进入下层',type:'travel',area:'crypt',to:'depths',x:0,z:-20},
 {id:'depths-exit',name:'阶梯 · 返回上层',type:'travel',area:'depths',to:'crypt',x:0,z:20},
 {id:'depths-rest',name:'远征者余火',type:'rest',area:'depths',x:3,z:18},
 {id:'depths-chest',name:'熔火秘藏',type:'chest',area:'depths',x:-21,z:5},
 {id:'ritual',name:'熔心王座',type:'boss',area:'depths',x:0,z:-13},
 {id:'rift-home',name:'回城裂隙',type:'travel',area:'depths',to:'overworld',x:0,z:-20}
];
export const TRAPS=[{id:'fire-west',area:'depths',x:-3,z:5,r:1.7,offset:0},{id:'fire-east',area:'depths',x:3,z:2,r:1.7,offset:2}];
export function onFloor(x,z,r,area){const rooms=MAPS[area]?.rooms;if(!rooms)return true;return rooms.some(q=>Math.abs(x-q.x)<=q.w/2-r&&Math.abs(z-q.z)<=q.d/2-r);}
