// Spatial art direction is independent of season, weather and water shaders.
export const compositions={
 classic:{name:'原有河谷',note:'保留第九版布局，便于比较。',terrain:{relief:.75,width:8,bend:5,fall:3.6,density:190,waterMode:'continuous'},hills:[[-27,-14,15,145,135],[29,-22,9,95,90]],palette:['#5b8047','#c7b886','#a4a392'],bankWidth:4.5,light:{power:1,ambient:1,fog:1},camera:{position:[68,65,91],target:[0,2,0]}},
 ridge:{name:'层峦溪谷',note:'西侧叠岭、林间留白与窄溪跌水；拱桥作为前景焦点。',terrain:{relief:1.05,width:6,bend:4,fall:3.6,density:190,waterMode:'continuous'},hills:[[-23,-13,19,120,85],[-8,-19,13,85,45],[-32,-2,11,65,90],[28,-19,3.5,100,110]],palette:['#526f43','#a5a47a','#858b7e'],bankWidth:2.5,light:{power:1.08,ambient:.8,fog:.88},camera:{position:[64,51,86],target:[-1,4,-3]}},
 marsh:{name:'疏林浅湾',note:'低缓地形、宽水面与成组疏林；适合浅滩、倒影和四季河岸。',terrain:{relief:.25,width:10.5,bend:6.5,fall:1.4,density:90,waterMode:'stream'},hills:[[-27,-12,8,220,155],[-8,-20,3,180,100],[28,-19,5,170,130]],palette:['#718753','#aca981','#979a88'],bankWidth:1.9,light:{power:1,ambient:.9,fog:.8},camera:{position:[65,56,88],target:[1,1.5,0]}}
};
export function getComposition(id='classic'){if(!Object.hasOwn(compositions,id))throw new RangeError('未知景观构图：'+id);return compositions[id];}
export function landformHeight(profile,x,z){return profile.hills.reduce((h,[cx,cz,peak,sx,sz])=>h+peak*Math.exp(-((x-cx)**2/sx+(z-cz)**2/sz)),0);}
export function forestWeight(id,x,z){
 if(id==='classic')return 1;
 const blobs=id==='ridge'?[[-24,-10,17,13],[-17,8,10,9],[28,9,9,12]]:[[-28,-9,11,12],[27,12,8,10]];
 return .035+.965*Math.max(...blobs.map(([cx,cz,sx,sz])=>Math.exp(-((x-cx)**2/sx**2+(z-cz)**2/sz**2))));
}
export const lightingModes={
 day:{name:'白天',sky:'#b3cede',sun:'#fff4de',power:3.8,ambient:1.65,night:0,rain:0,wet:0,fog:.0023,pos:[-30,75,25]},
 evening:{name:'黄昏',sky:'#b9c5cc',sun:'#ffcf91',power:3.5,ambient:1.35,night:.15,rain:0,wet:0,fog:.0029,pos:[-55,40,25]},
 rain:{name:'雨景',sky:'#677f85',sun:'#b8d0d6',power:.7,ambient:.7,night:.7,rain:.7,wet:1,fog:.0055,pos:[-35,55,20]},
 night:{name:'夜间',sky:'#102634',sun:'#a8c9ee',power:.9,ambient:.7,night:1,rain:0,wet:.35,fog:.004,pos:[-30,48,-40]}
};
function tint(a,b,k){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');}
export function resolveLighting(composition,theme,mode){
 const profile=getComposition(composition),base=lightingModes[mode];if(!base)throw new RangeError('未知光线：'+mode);
 const m=mode===theme.mode?{...base,sky:theme.sky,sun:theme.sun,power:theme.power,ambient:theme.ambient,fog:theme.fog,pos:[...theme.sunPosition]}:{...base,pos:[...base.pos]};
 if(composition!=='classic'){
  if(mode!==theme.mode){const amount=mode==='day'?.38:mode==='evening'?.18:.06;m.sky=tint(m.sky,theme.sky,amount);m.sun=tint(m.sun,theme.sun,amount);}
  m.power*=profile.light.power;m.ambient*=profile.light.ambient;m.fog*=profile.light.fog;
 }
 return m;
}

// Keep edited terrain and water mode for each composition during this page visit.
export function createCompositionSettings(){
 const values=Object.fromEntries(Object.entries(compositions).map(([id,p])=>[id,{...p.terrain,composition:id}]));
 return{get(id){getComposition(id);return{...values[id]};},save(id,config){getComposition(id);values[id]={...config,composition:id};}};
}
