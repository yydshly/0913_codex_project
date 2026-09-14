import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';
const site=fileURLToPath(new URL('../../../site/005-stick-steel/',import.meta.url));
const guide=await readFile(path.join(site,'index.html'),'utf8');
for(const view of ['characters','stories','capabilities','duel'])assert.ok(guide.includes(`demo/?view=${view}`),`missing route ${view}`);
for(const text of ['MP4','Skill','MiniMax','视频创作','游戏与交互展示'])assert.ok(guide.includes(text));
const manifest=JSON.parse(await readFile(path.join(site,'demo/audio/stories/manifest.json'),'utf8'));
for(const id of ['father','dinner','newcomer']){
  const entry=manifest.stories[id];assert.ok(entry&&/^[a-z]+\.[a-f0-9]{12}\.wav$/.test(entry.file));
  const bytes=await readFile(path.join(site,'demo/audio/stories',entry.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  assert.equal(bytes.readUInt32LE(24),32000);
  assert.equal((bytes.length-44)/64000,id==='father'?72:36);
}
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){assert.ok(!/^\.env|^node_modules$|^\.cache$|^\.git$/.test(e.name),`private material in output: ${e.name}`);if(e.isDirectory())await walk(path.join(dir,e.name));}}
await walk(site);
await stat(path.join(site,'demo/index.html'));
console.log('005 publication checked: four demo routes, summary and roadmap, three audio hashes/durations, no local configuration or caches.');
