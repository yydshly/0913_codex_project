import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../dist/client/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('release-manifest.json', root), 'utf8'));
assert.equal(manifest.counts.gsapInteractions, 64);
assert.equal(manifest.counts.canvasComponents, 16);
assert.ok(manifest.counts.screenshots >= 132);
const names = new Set(manifest.files.map(file => file.path));
for (const required of ['index.html', 'research.html', 'records.html', 'research.css', 'portfolio/weather-clear.jpg', 'portfolio/weather-rain.jpg', 'portfolio/immersive-cover.png', 'licenses/Canvas-UI.md', 'licenses/THIRD-PARTY.md', 'records/portfolio-v43-validation.md']) assert.ok(names.has(required), 'Missing release entry: ' + required);
for (const module of ['Liquid', 'Blaze', 'Glass', 'Shatter', 'ParticleReveal', 'VHS', 'Ripple', 'Droplets', 'Clouds', 'Laser', 'Bubble', 'ForceField', 'GlyphRain', 'Frost', 'FlameWrap', 'HexFloat']) assert.ok([...names].some(name => name.startsWith('assets/' + module + '-') && name.endsWith('.js')), 'Missing lazy component: ' + module);
for (const file of manifest.files) {
  const bytes = await readFile(new URL(file.path, root));
  assert.equal(bytes.length, file.bytes, file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
}
for (const name of ['research.html', 'records.html', 'index.html']) {
  const html = await readFile(new URL(name, root), 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|#)/.test(ref) || ref === '../') continue;
    const target = ref.split(/[?#]/)[0] || './';
    await stat(new URL(target, root));
  }
}
console.log('011 release verified: ' + manifest.files.length + ' files; all 16 lazy components, images, documents, license files and entry links present.');
