import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createSnapshot,verifySnapshot} from './snapshot.mjs';
test('sealed version rejects overwrite before reading a new capture',async()=>{
 const original=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../snapshots/v001');
 const before=await verifySnapshot(original);await assert.rejects(createSnapshot('v001','does-not-exist.json'),/禁止覆盖/);assert.deepEqual(await verifySnapshot(original),before);
 await assert.rejects(createSnapshot('../v001',''),/版本号格式/);
});
test('snapshot verifier detects modified content and unexpected files',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'songlan-snapshot-test-')),content='frozen scene';
 try{
  await writeFile(path.join(folder,'scene.html'),content);
  await writeFile(path.join(folder,'manifest.json'),JSON.stringify({id:'test',files:{'scene.html':{bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')}}}));
  assert.equal((await verifySnapshot(folder)).files,1);
  await writeFile(path.join(folder,'scene.html'),'changed');await assert.rejects(verifySnapshot(folder),/历史文件已改变/);
  await writeFile(path.join(folder,'extra.txt'),'extra');await assert.rejects(verifySnapshot(folder),/文件清单不一致/);await unlink(path.join(folder,'extra.txt'));
 }finally{await unlink(path.join(folder,'scene.html'));await unlink(path.join(folder,'manifest.json'));await rmdir(folder);}
});
