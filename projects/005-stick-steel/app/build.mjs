import {mkdir,cp,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const app=path.dirname(fileURLToPath(import.meta.url));
const client=path.join(app,'client'),dist=path.join(app,'dist');
// Publish only static client assets. No environment files, source credentials,
// local PCM cache or optional Sites Worker are copied into GitHub Pages.
execFileSync(process.execPath,[path.join(client,'node_modules/vite/bin/vite.js'),'build'],{cwd:client,stdio:'inherit'});
await mkdir(path.join(dist,'guide-assets'),{recursive:true});
await cp(path.join(client,'dist/client'),path.join(dist,'demo'),{recursive:true});
await copyFile(path.join(app,'research.html'),path.join(dist,'index.html'));
await copyFile(path.join(app,'research.css'),path.join(dist,'research.css'));
for(const name of ['24-character-comparison.png','20-story-overview.jpg','14-capabilities-overview.jpg'])
  await copyFile(path.join(app,'../assets',name),path.join(dist,'guide-assets',name));
await copyFile(path.join(client,'THIRD_PARTY_LICENSES/Stick-Steel-MIT.txt'),path.join(dist,'guide-assets/Stick-Steel-MIT.txt'));
console.log('005 Pages: research guide, screenshots, interactive demo and cached story audio prepared.');
