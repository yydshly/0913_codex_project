import {writeFile} from 'node:fs/promises';
import {auditDestinations} from './destination-audit.mjs';
import {xianCase,xianCandidates} from './xian-validation-data.mjs';
const report=auditDestinations(xianCase,xianCandidates);
await writeFile(new URL('../assets/xian-destination-validation-v1.json',import.meta.url),JSON.stringify({config:xianCase,places:xianCandidates,report},null,2)+'\n');
console.log(JSON.stringify({counts:report.counts,positionEvidenceStatus:report.positionEvidenceStatus,missingRequired:report.missingRequired}));
