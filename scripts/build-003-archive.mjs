import { cp, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 固定 Git 对象；不能以当前工作区或可移动的 main 代替归档源码。
const revision = '9948ae93a61ef9d38eeacb6183f8521b9f9d141c';
const project = '003-mountain-railway-diorama';
const root = fileURLToPath(new URL('../', import.meta.url));
const scratchRoot = path.resolve(root, '.tmp');
const destination = path.join(root, 'site', project, 'archives', 'v23');
await mkdir(scratchRoot, { recursive: true });
const scratch = await mkdtemp(path.join(scratchRoot, '003-fixed-archive-'));
try {
  try { execFileSync('git', ['cat-file', '-e', `${revision}^{commit}`], { cwd: root, stdio: 'pipe' }); }
  catch { throw new Error(`Missing fixed V23 commit ${revision}. Fetch repository history before building archives.`); }
  const archive = path.join(scratch, 'source.tar');
  execFileSync('git', ['archive', '--format=tar', `--output=${archive}`, `${revision}:projects/${project}`], { cwd: root });
  const source = path.join(scratch, 'source');
  await mkdir(source);
  execFileSync('tar', ['-xf', archive, '-C', source]);
  const manifest = JSON.parse(await readFile(path.join(source, 'archive-manifest.json'), 'utf8'));
  let verified = 0;
  for (const [file, expected] of Object.entries(manifest.runtimeHashes)) {
    // Git archive may apply platform EOL conversion; compare canonical Git text.
    const text = (await readFile(path.join(source, file), 'utf8')).replaceAll('\r\n', '\n');
    if (createHash('sha256').update(text).digest('hex') !== expected) throw new Error(`V23 integrity mismatch: ${file}`);
    verified++;
  }
  execFileSync(process.execPath, [path.join(source, 'app', 'build.mjs')], { cwd: source, stdio: 'inherit' });
  await mkdir(destination, { recursive: true });
  await cp(path.join(source, 'app', 'dist'), destination, { recursive: true });
  // 发布外壳只补版本标记和返回入口，不改变场景模块、材质或参数。
  const sceneFile = path.join(destination, 'scene.html');
  let scene = await readFile(sceneFile, 'utf8');
  scene = scene.replace('<title>白鹭河谷 · 四季微缩景观</title>', '<title>V23 固定归档 · 白鹭河谷</title>')
    .replace('一座河谷，四季风景', 'V23 固定归档 · 2026.09.14')
    .replace('<a href="index.html">原理分析 ↗</a>', '<a href="../../archive.html">归档入口 ↗</a>');
  await writeFile(sceneFile, scene);
  const infoFile = path.join(destination, 'archive.html');
  const info = (await readFile(infoFile, 'utf8')).replaceAll('dev-log.html#b2', 'dev-log.html');
  await writeFile(infoFile, info);
  await writeFile(path.join(destination, 'archive-version.json'), JSON.stringify({
    sceneVersion: 'V23', archiveTag: manifest.archiveTag, sourceCommit: revision,
    runtimeBaselineCommit: manifest.runtimeBaselineCommit, verifiedRuntimeModules: verified,
    presentationChanges: ['HTML version label and return navigation', 'Static-compatible development log link'],
    runtimeHashes: manifest.runtimeHashes
  }, null, 2));
  console.log(`Fixed V23 online archive built from ${revision}; ${verified} runtime hashes verified.`);
} finally {
  const resolved = path.resolve(scratch);
  if (path.dirname(resolved) !== scratchRoot || !path.basename(resolved).startsWith('003-fixed-archive-')) {
    throw new Error('Refusing cleanup outside the verified archive scratch directory.');
  }
  await rm(resolved, { recursive: true, force: true });
}
