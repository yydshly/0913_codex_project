import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {studyPlaces} from './research-data.mjs';
import {createPlan,renderPlan,observationTemplate,validateArtwork} from './position-study.mjs';
const plan=createPlan(studyPlaces),template=observationTemplate(plan),assets=new URL('../assets/',import.meta.url);
for(const [name,content] of Object.entries({'xian-position-study.svg':renderPlan(plan),'xian-position-plan.json':JSON.stringify(plan,null,2),'xian-artwork-observation-template.json':JSON.stringify(template,null,2),'xian-position-study-report.json':JSON.stringify({layout:{count:plan.places.length,relations:plan.relations.length,crowded:plan.crowded},artwork:validateArtwork(plan,template)},null,2)}))await writeFile(new URL(name,assets),content);
const bytes=await readFile(new URL('xian-scenic-user-v3.png',assets));
await writeFile(new URL('xian-scenic-user-v3-source.json',assets),JSON.stringify({date:'2026-09-14',source:'用户上传 codex-clipboard-f891c480-c34c-4010-8712-1af0b8b12ecf.png；原样复制',model:'待核实',prompt:'待核实',license:'待核实',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:createHash('sha256').update(bytes).digest('hex'),status:'仅画风参考，袁家村/楼观台/汉城湖方位存在问题；未通过地理验收',builtinGeneration:false},null,2));
console.log(JSON.stringify({points:plan.places.length,relations:plan.relations.length,crowdedPairs:plan.crowded.length,artwork:validateArtwork(plan,template).status}));
