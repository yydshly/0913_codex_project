import {createRequire} from 'node:module';
import {writeFile,readFile} from 'node:fs/promises';
import {createState} from './model.mjs';
import {paint} from './render.mjs';
const packagePath=process.argv[2];if(!packagePath)throw new Error('需要传入 @napi-rs/canvas 的绝对模块路径；仅验证工具使用。');
const {createCanvas,loadImage,GlobalFonts}=createRequire(import.meta.url)(packagePath);
GlobalFonts.registerFromPath('C:/Windows/Fonts/msyh.ttc','Microsoft YaHei');GlobalFonts.registerFromPath('C:/Windows/Fonts/simsun.ttc','SimSun');
for(const city of ['tengchong','lijiang']){
 const img=await loadImage(new URL('../assets/'+city+'-art.png',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,''));
 const canvas=createCanvas(1800,2400),state=createState(city);const boxes=paint(canvas.getContext('2d'),state,img);
 const buf=await canvas.encode('png');await writeFile(new URL('../assets/'+city+'-poster.png',import.meta.url),buf);
 const check=await loadImage(buf);if(check.width!==1800||check.height!==2400||boxes.length!==6)throw new Error('导出校验失败');
 console.log(city+': 底图 '+img.width+' × '+img.height+'；海报 '+check.width+' × '+check.height+'，'+boxes.length+' 个标注；'+buf.length+' 字节');
}

