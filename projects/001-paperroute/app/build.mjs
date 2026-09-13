import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
await mkdir(path.join(output, 'assets'), { recursive: true });
await mkdir(path.join(output, 'vendor'), { recursive: true });
for (const file of ['index.html', 'research.html']) {
  const html = await readFile(path.join(root, file), 'utf8');
  await writeFile(path.join(output, file), html.replaceAll('../assets/', './assets/'));
}
for (const file of ['styles.css', 'app.js', 'game.css', 'game.js', 'game-state.mjs']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
for (const file of ['three.module.js', 'three.core.js']) {
  await copyFile(path.join(root, 'node_modules', 'three', 'build', file), path.join(output, 'vendor', file));
}
await copyFile(path.join(root, 'node_modules', 'three', 'LICENSE'), path.join(output, 'vendor', 'THREE-LICENSE.txt'));
for (const file of ['01-homepage.jpg', '02-player-entry.jpg', '03-devlog.jpg', '04-official-gallery.jpg']) {
  await copyFile(path.join(root, '..', 'assets', file), path.join(output, 'assets', file));
}
console.log('Game and research showcase ready: ' + output);
