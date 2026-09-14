import {environments} from './environment-core.mjs';
export const outdoorDefaults=Object.freeze({campX:7,campZ:10,summitX:16,summitZ:-18,ascent:11,roadBend:0,environment:'forest'});
export const outdoorLimits=Object.freeze({campX:[4,10],campZ:[8,12],summitX:[12,20],summitZ:[-22,-16],ascent:[8,14],roadBend:[-3,3]});
export const outdoorPresets=Object.freeze({original:{...outdoorDefaults},ridge:{environment:'forest',campX:4,campZ:12,summitX:20,summitZ:-22,ascent:13,roadBend:-3},valley:{environment:'forest',campX:10,campZ:8,summitX:12,summitZ:-16,ascent:8,roadBend:3}});
export function validateOutdoorRecipe(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('方案格式无效');
 for(const key of Object.keys(input))if(!Object.hasOwn(outdoorDefaults,key))throw Error('方案包含未知参数：'+key);
 const recipe={...outdoorDefaults,...input};for(const [key,[min,max]] of Object.entries(outdoorLimits))if(!Number.isFinite(recipe[key])||recipe[key]<min||recipe[key]>max)throw Error(key+' 需在 '+min+'～'+max+' 之间');
 if(!Object.hasOwn(environments,recipe.environment))throw Error('未知自然环境');
 return recipe;
}
export function encodeOutdoorRecipe(recipe){return JSON.stringify({kind:'songlan-outdoor',version:2,recipe:validateOutdoorRecipe(recipe)},null,2);}
export function decodeOutdoorRecipe(text){
 if(typeof text!=='string'||text.length>16384)throw Error('方案文件过大或格式无效');
 let data;try{data=JSON.parse(text);}catch{throw Error('无法读取方案，请选择有效的 JSON 文件');}
 if(data?.kind!=='songlan-outdoor'||![1,2].includes(data?.version))throw Error('这不是支持的松岚场景方案');
 if(!data.recipe||Object.keys(outdoorDefaults).filter(k=>data.version===2||k!=='environment').some(k=>!Object.hasOwn(data.recipe,k)))throw Error('方案缺少场景参数');
 return validateOutdoorRecipe(data.recipe);
}
