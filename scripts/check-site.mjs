import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const failures = [];
let checked = 0;
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}
async function checkReference(source, reference) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) return;
  checked++;
  if (reference.startsWith('/')) {
    failures.push(`${path.relative(root, source)}: root-absolute URL breaks the Pages subpath: ${reference}`);
    return;
  }
  const [urlPath, fragment] = reference.split('#');
  let target = urlPath ? path.resolve(path.dirname(source), decodeURIComponent(urlPath.split('?')[0])) : source;
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    failures.push(`${path.relative(root, source)}: reference leaves site: ${reference}`);
    return;
  }
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
    if (fragment && target.endsWith('.html')) {
      const body = await readFile(target, 'utf8');
      const ids = [...body.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
      if (!ids.includes(decodeURIComponent(fragment))) throw new Error('Missing anchor');
    }
  } catch (error) { failures.push(`${path.relative(root, source)}: ${reference} (${error.code || error.message})`); }
}

await stat(path.join(root, 'index.html'));
for (const file of await walk(root)) {
  if (!/\.(html|css|js|mjs)$/.test(file)) continue;
  const body = await readFile(file, 'utf8');
  if (file.endsWith('.html')) {
    const ids = [...body.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) failures.push(`${file}: duplicate HTML ids`);
    for (const tag of body.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt=["'][^"']+["']/.test(tag[0])) failures.push(`${file}: image missing descriptive alt`);
    }
    for (const match of body.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) await checkReference(file, match[1]);
  }
  for (const match of body.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
    await checkReference(file, match[1]);
  }
  if (file.endsWith('.css')) {
    for (const match of body.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) await checkReference(file, match[1]);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Pages resources verified: ${checked} local references, no missing files or anchors.`);
