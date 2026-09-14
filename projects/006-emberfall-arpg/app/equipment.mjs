export const ITEMS={
 iron:{name:'旧铁长剑',slot:'weapon',rarity:'普通',attack:5,defense:0,spell:0,value:14},
 fang:{name:'林卫之牙',slot:'weapon',rarity:'稀有',attack:12,defense:0,spell:0,value:32},
 moon:{name:'沉钟月刃',slot:'weapon',rarity:'稀有',attack:17,defense:0,spell:3,value:42},
 ember:{name:'熔心誓约',slot:'weapon',rarity:'史诗',attack:24,defense:0,spell:8,value:70},
 hide:{name:'旅人皮甲',slot:'armor',rarity:'普通',attack:0,defense:2,spell:0,value:14},
 guard:{name:'守望者胸甲',slot:'armor',rarity:'稀有',attack:0,defense:5,spell:0,value:34},
 ash:{name:'灰烬护符',slot:'charm',rarity:'普通',attack:0,defense:0,spell:7,value:18},
 scout:{name:'斥候的信物',slot:'charm',rarity:'稀有',attack:3,defense:2,spell:12,value:40}
};
export const TALENTS={blade:{name:'剑术精修',description:'每级斩击伤害 +5',max:3},arcane:{name:'星陨回响',description:'每级星陨伤害 +10，命中附带减速',max:3},vigor:{name:'余火体魄',description:'每级生命上限 +18',max:3}};
export const CAPACITY=16;
export function makeItem(key,id,cycle=0){const base=ITEMS[key];if(!base)throw Error('Unknown item');return{...base,key,id,attack:base.attack+(base.attack?cycle*2:0),defense:base.defense+(base.defense?cycle:0),spell:base.spell+(base.spell?cycle*2:0),value:base.value+cycle*6};}
export function equipmentStats(s){const sum={attack:0,defense:0,spell:0};for(const id of Object.values(s.equipped||{})){const item=s.inventory?.find(i=>i.id===id);if(item)for(const k of Object.keys(sum))sum[k]+=item[k];}return sum;}
export function combatStats(s){const g=equipmentStats(s);return{attack:24+s.level*5+s.weapon*10+g.attack+(s.talents?.blade||0)*5,defense:s.armor*3+g.defense,spell:54+s.level*6+s.weapon*5+g.spell+(s.talents?.arcane||0)*10};}
export function equip(s,id){const item=s.inventory.find(i=>i.id===id);if(!item)return false;s.equipped[item.slot]=item.id;return true;}
export function learn(s,key){if(!TALENTS[key]||s.skillPoints<1||s.talents[key]>=TALENTS[key].max)return false;s.skillPoints--;s.talents[key]++;if(key==='vigor'){s.player.maxHp+=18;s.player.hp=Math.min(s.player.maxHp,s.player.hp+18);}return true;}
