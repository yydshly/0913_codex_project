import test from 'node:test';
import assert from 'node:assert/strict';
import {resilientTextureLoader} from './asset-loader.mjs';

test('transient errors retry while downloads remain bounded',async()=>{
  let active=0,peak=0;const calls=new Map(),progress=[];
  const loader=resilientTextureLoader({async loadAsync(url){
    active++;peak=Math.max(peak,active);calls.set(url,(calls.get(url)||0)+1);
    await new Promise(resolve=>setTimeout(resolve,2));active--;
    if(url==='a'&&calls.get(url)===1)throw Error('503');return {url};
  }},{concurrency:2,onProgress:p=>progress.push(p)});
  const result=await Promise.all(['a','b','c','d'].map(url=>loader.loadAsync(url)));
  assert.equal(result.length,4);assert.equal(peak,2);assert.equal(calls.get('a'),2);
  assert.equal(progress.at(-1).completed,4);
});

test('stalled download rejects, stops queued downloads and disposes late textures',async()=>{
  let finish,disposed=0,requests=0;
  const loader=resilientTextureLoader({loadAsync(){requests++;return new Promise(resolve=>{finish=resolve;});}},
    {concurrency:1,attempts:1,timeoutMs:8});
  const results=await Promise.allSettled([loader.loadAsync('stalled.jpg'),loader.loadAsync('queued.jpg')]);
  assert.ok(results.every(r=>r.status==='rejected'));assert.match(results[0].reason.message,/stalled.jpg.*超时/);
  assert.equal(requests,1);finish({dispose(){disposed++;}});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(disposed,1);
});

test('permanent download error ends after three attempts and reports its filename',async()=>{
  let calls=0;const loader=resilientTextureLoader({async loadAsync(){calls++;throw Error('404');}});
  await assert.rejects(loader.loadAsync('/assets/absent.jpg'),/absent.jpg.*404/);assert.equal(calls,3);
});
