import {CITIES,THEMES} from './model.mjs';
export const WIDTH=1800,HEIGHT=2400;
function fitText(ctx,text,maxWidth,size,min=24,font='sans-serif'){while(size>min){ctx.font=size+'px '+font;if(ctx.measureText(text).width<=maxWidth)break;size--;}return size;}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
export function paint(ctx,state,image,{selection=false}={}){
 const {paper,ink,accent}=THEMES[state.theme];ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.fillStyle=paper;ctx.fillRect(0,0,WIDTH,HEIGHT);
 ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.strokeRect(29,29,1742,2342);
 ctx.fillStyle=ink;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 fitText(ctx,state.title||CITIES[state.city].name,1000,107,45,'"Songti SC","SimSun",serif');ctx.fillText(state.title||CITIES[state.city].name,90,147);
 ctx.font='26px "Microsoft YaHei",sans-serif';ctx.fillText(state.subtitle,96,193);
 ctx.textAlign='right';ctx.font='24px Georgia,serif';ctx.fillText(CITIES[state.city].english,1704,101);
 ctx.font='18px "Microsoft YaHei",sans-serif';ctx.fillText('CITY IMPRESSIONS  /  009',1704,146);
 ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(95,218);ctx.lineTo(1705,218);ctx.stroke();
 if(image){const factor=Math.min(1680/image.width,2060/image.height);const w=image.width*factor,h=image.height*factor;ctx.drawImage(image,(WIDTH-w)/2,230+(2060-h)/2,w,h);}
 const boxes=[];if(state.labelStyle!=='none'){
 for(const m of state.landmarks){if(!m.visible)continue;const text=state.labelStyle==='number'?String(m.id+1).padStart(2,'0'):String(m.id+1).padStart(2,'0')+'  '+(m.name||'未命名');
 const size=fitText(ctx,text,540,33,24,'"Microsoft YaHei",sans-serif');const w=ctx.measureText(text).width+42,h=68;let x=m.x/100*WIDTH-w/2;const y=m.y/100*HEIGHT-h/2;x=Math.max(48,Math.min(WIDTH-w-48,x));
 ctx.save();ctx.shadowColor='#163b2528';ctx.shadowBlur=16;ctx.shadowOffsetY=5;rounded(ctx,x,y,w,h,5);ctx.fillStyle='#fffdf5f2';ctx.fill();ctx.restore();
 ctx.strokeStyle=selection&&m.id===state.selected?'#a56a36':'#d0d4bd';ctx.lineWidth=selection&&m.id===state.selected?4:1.2;rounded(ctx,x,y,w,h,5);ctx.stroke();
 ctx.fillStyle='#254837';ctx.font=size+'px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+w/2,y+h/2+1);boxes.push({id:m.id,x,y,w,h});
 }}
 ctx.textBaseline='alphabetic';ctx.fillStyle=ink;ctx.textAlign='center';fitText(ctx,state.caption,1500,30,22,'"Songti SC","SimSun",serif');ctx.fillText(state.caption,900,2315);
 ctx.font='18px "Microsoft YaHei",sans-serif';ctx.fillStyle=ink;ctx.globalAlpha=.72;ctx.fillText('原创 AI 插画 · 艺术示意，非导航地图',900,2350);ctx.globalAlpha=1;return boxes;
}
export function hitTest(boxes,x,y){return [...boxes].reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)?.id??-1;}
