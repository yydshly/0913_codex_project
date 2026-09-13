import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
await mkdir(path.join(output, 'assets'), { recursive: true });
const html = await readFile(path.join(root, 'index.html'), 'utf8');
await writeFile(path.join(output, 'index.html'), html.replaceAll('../assets/', './assets/').replaceAll('../experiments/', './prompts/'));
const extensions = await readFile(path.join(root, 'extensions.html'), 'utf8');
await writeFile(path.join(output, 'extensions.html'), extensions.replaceAll('../assets/', './assets/').replaceAll('../experiments/', './prompts/'));
const caseModule = await readFile(path.join(root, 'studio-cases.mjs'), 'utf8');
await writeFile(path.join(output, 'studio-cases.mjs'), caseModule.replaceAll('../assets/', './assets/'));
const studio = await readFile(path.join(root, 'studio.html'), 'utf8');
await writeFile(path.join(output, 'studio.html'), studio.replaceAll('../assets/', './assets/').replaceAll('../experiments/', './prompts/'));
const products = await readFile(path.join(root, 'products.html'), 'utf8');
await writeFile(path.join(output, 'products.html'), products.replaceAll('../assets/', './assets/'));
for (const file of ['styles.css', 'app.js', 'studio.css', 'studio.mjs', 'studio-layout.mjs', 'OPENMAIC-LICENSE.txt', 'UPSTREAM-LICENSE.txt']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await copyFile(path.join(root, '..', 'assets', 'upstream-dunhuang-panorama.png'), path.join(output, 'assets', 'upstream-dunhuang-panorama.png'));
for (const file of ['redesign-slowlight-v2.png', 'redesign-paperroute-v2.png', 'redesign-openmaic-v2.png', 'case-slowlight-studio.png', 'case-paperroute-gameplay.jpg', 'case-openmaic-classroom.png', 'generated-tea-panorama.png', 'generated-fragrance-portrait.png', 'generated-exhibition-cover.png', 'edited-fragrance-no-ribbon.png', 'extension-light-tea.png', 'extension-mural-packaging.png', 'extension-caisson-poster.png', 'extension-textile-accessories.png', 'extension-tea-interior.png', 'extension-editorial-stationery.png']) {
  await copyFile(path.join(root, '..', 'assets', file), path.join(output, 'assets', file));
}
await mkdir(path.join(output, 'prompts'), { recursive: true });
for (const name of ['redesign-slowlight-v2', 'redesign-paperroute-v2', 'redesign-openmaic-v2', 'tea-panorama', 'fragrance-portrait', 'exhibition-cover', 'fragrance-remove-ribbon', 'extension-light-tea', 'extension-mural-packaging', 'extension-caisson-poster', 'extension-textile-accessories', 'extension-tea-interior', 'extension-editorial-stationery']) {
  await copyFile(path.join(root, '..', 'experiments', name + '.txt'), path.join(output, 'prompts', name + '.txt'));
}
console.log('Dunhuang research demo built: ' + output);
