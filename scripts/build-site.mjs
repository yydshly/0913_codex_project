import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.join(root, 'projects');
const projects = (await readdir(projectRoot, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && /^\d{3}-/.test(entry.name))
  .map(entry => entry.name).sort();
let count = 0;
for (const name of projects) {
  const app = path.join(projectRoot, name, 'app');
  const build = path.join(app, 'build.mjs');
  try { await stat(build); } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  execFileSync(process.execPath, [build], { cwd: app, stdio: 'inherit' });
  const output = path.join(app, 'dist', name === '011-frontend-visual-lab' ? 'client' : '');
  await stat(path.join(output, 'index.html'));
  const destination = path.join(root, 'site', name);
  await mkdir(destination, { recursive: true });
  await cp(output, destination, { recursive: true });
  count++;
}
if (!count) throw new Error('No runnable project was built.');
await import('./build-003-archive.mjs');
console.log(`Pages site prepared with ${count} project(s).`);
