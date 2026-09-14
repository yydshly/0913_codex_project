import {writeFile} from 'node:fs/promises';
import {studyPlaces} from './research-data.mjs';
import {createPlan} from './position-study.mjs';
import {diagnosticAssets,scenarioCommands,composeAndAudit} from './controlled-compositor.mjs';
const plan=createPlan(studyPlaces),assets=await diagnosticAssets(plan),results={};
for(const scenario of ['normal','swap','missing','occlusion','asset']){
 const {report}=await composeAndAudit(plan,assets,scenarioCommands(plan,scenario));results[scenario]=report;
}
await writeFile(new URL('../assets/xian-auto-audit-report.json',import.meta.url),JSON.stringify({date:'2026-09-14',description:'代码测试素材的受控栅格合成自检；不是真实景观准确性验收',scenarios:results},null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,{position:v.positionStatus,production:v.productionStatus,issues:v.issues.length}]))));
