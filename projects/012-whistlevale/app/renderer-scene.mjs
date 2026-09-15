// Inputs shared by the two genuinely separate renderers. No drawing API here.
import {identity,multiply,translation,rotationZ,perspective,orthographic,lookAt,normalize,sub,dot} from './webgl-math.mjs';
export function makeSignCanvas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
 const ink=canvas.getContext('2d');if(!ink)throw new Error('无法生成站牌文字');
 ink.fillStyle='#23473b';ink.fillRect(0,0,1024,128);ink.strokeStyle='#ceb988';ink.lineWidth=3;ink.strokeRect(8,8,1008,112);
 ink.fillStyle='#f0dfb2';ink.textAlign='center';ink.font='600 65px Georgia, serif';ink.fillText('VALLEY STATION',512,80);ink.font='18px sans-serif';ink.fillText('012  ·  RAILWAY STUDY',512,108);
 return canvas;
}
export function studyFrame(state,width,height){
 const step=state.mode==='detail'?6:state.compare?Math.max(0,state.step-1):state.step;
 const angle=state.sun*Math.PI/180,light=normalize([Math.cos(angle)*.9,1.35,Math.sin(angle)*.9]);
 const lp=multiply(orthographic(-8,8,-8,8,1,35),lookAt(light.map(v=>v*16),[0,0,0]));
 const x=Math.sin(state.time*.44)*2.7,r=state.distance*Math.max(1,(state.mode==='detail'?1:1.3)/(width/height)),t=state.target;
 let eye=[t[0]+Math.sin(state.yaw)*Math.cos(state.pitch)*r,t[1]+Math.sin(state.pitch)*r,t[2]+Math.cos(state.yaw)*Math.cos(state.pitch)*r];
 if(step===0)eye=[0,0,5];
 const view=lookAt(eye,step===0?[0,0,0]:t),projection=perspective(.72,width/height,.1,80),vp=multiply(projection,view);
 const focus=dot(sub([-1,1.5,-.3],eye),normalize(sub(t,eye)));
 return{step,light,lp,x,eye,view,projection,vp,focus};
}
export function modelMatrices(x){
 const car=translation(x,.235,2.5),models=[['world',identity()],['car',car]];
 for(const xx of[-.58,.58])for(const zz of[-.51,.51])models.push(['wheel',multiply(car,multiply(translation(xx,.43,zz),rotationZ(-x/.235)))]);
 return models;
}
export function comparePixels(a,b){
 if(a.length!==b.length||a.length%4)throw new Error('像素尺寸不一致');
 let total=0,peak=0,changed=0;
 for(let i=0;i<a.length;i+=4){let pixelPeak=0;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);total+=d;peak=Math.max(peak,d);pixelPeak=Math.max(pixelPeak,d);}if(pixelPeak>2)changed++;}
 return{pixels:a.length/4,mean:total/(a.length/4*3),peak,overTwoPercent:changed/(a.length/4)*100};
}
