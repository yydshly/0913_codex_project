import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {renderMap,exportDataset} from './xian-geo.mjs';
const packagePath=process.argv[2];if(!packagePath)throw new Error('仅图件检查使用，请提供 @napi-rs/canvas 模块绝对路径');
const {loadImage,createCanvas,GlobalFonts}=createRequire(import.meta.url)(packagePath);
GlobalFonts.registerFromPath('C:/Windows/Fonts/msyh.ttc','Microsoft YaHei');
await writeFile(new URL('../data/xian-places.json',import.meta.url),JSON.stringify(exportDataset(),null,2)+'\n');
for(const view of ['overview','center']){
 const svg=renderMap(view,'bell');await writeFile(new URL(`../assets/xian-${view}.svg`,import.meta.url),svg);
 const image=await loadImage(Buffer.from(svg));const canvas=createCanvas(1280,860);canvas.getContext('2d').drawImage(image,0,0);
 const png=await canvas.encode('png');await writeFile(new URL(`../assets/xian-${view}.png`,import.meta.url),png);
 console.log(`西安 ${view}：1280 × 860，SVG 与 PNG 已输出，${png.length} 字节。`);
}
