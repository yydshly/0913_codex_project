import { build } from 'vite';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app = fileURLToPath(new URL('./', import.meta.url));
const project = path.resolve(app, '..');
const output = path.join(app, 'dist/client');
await build({ root: app });
await import('./scripts/prepare-sites-build.mjs');
await cp(path.join(project, 'assets'), path.join(output, 'research-assets'), { recursive: true });
await mkdir(path.join(output, 'records'), { recursive: true });
const documents = (await readdir(project)).filter(name => name.endsWith('.md')).sort();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sections = [];
for (const name of documents) {
  const body = await readFile(path.join(project, name), 'utf8');
  await cp(path.join(project, name), path.join(output, 'records', name));
  sections.push('<details><summary>' + escape(name) + '</summary><p><a href="./records/' + name + '">下载原始记录</a></p><pre>' + escape(body) + '</pre></details>');
}
const screenshots = (await readdir(path.join(project, 'assets'))).filter(name => /\.(png|jpe?g|webp)$/i.test(name)).sort();
const images = screenshots.map(name => '<figure><a href="./research-assets/' + name + '"><img loading="lazy" src="./research-assets/' + name + '" alt="研究档案 ' + escape(name) + '，性质与阶段以资产说明为准"></a><figcaption>' + escape(name) + '</figcaption></figure>');
await writeFile(path.join(output, 'records.html'), '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>011 · 完整研究档案</title><link rel="stylesheet" href="./research.css"></head><body><header><a class="brand" href="./research.html">前端视觉实验室 / 研究档案</a><a href="./">进入实验室 ↗</a></header><main class="records"><section><h1>理解、过程与实际证据。</h1><p>保留各阶段原始记录。历史文档中的“本地”“未部署”对应当时状态；当前发布结果见 publishing.md。96–98为生成设计概念，99为生成封面，其余图片性质以图片说明为准；不把概念当作运行结果。</p><p><a href="./research-assets/README.md">查看图片来源与阶段说明</a> · <a href="https://github.com/yydshly/0913_codex_project/tree/main/projects/011-frontend-visual-lab/archive">历次局部源码归档（非独立运行版）</a></p>' + sections.join('') + '</section><section><h2>全部图片档案</h2><div class="record-images">' + images.join('') + '</div></section></main></body></html>');
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(file)); else result.push(file);
  }
  return result;
}
const manifest = [];
for (const file of (await files(output)).sort()) {
  const bytes = await readFile(file);
  manifest.push({ path: path.relative(output, file).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(path.join(output, 'release-manifest.json'), JSON.stringify({ project: '011-frontend-visual-lab', portfolio: 'V4.3', counts: { gsapInteractions: 64, canvasComponents: 16, screenshots: screenshots.length, documents: documents.length }, files: manifest }, null, 2));
console.log('011 Pages prepared: ' + manifest.length + ' files, ' + screenshots.length + ' images, ' + documents.length + ' research documents.');
