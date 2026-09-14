import test from 'node:test';
import assert from 'node:assert/strict';
import {storyFrame,stories,type ActorPose} from '../lib/story/script';
import {solveTwoBone,vec} from '../lib/rig/ik';

function wrist(p:ActorPose,side:'left'|'right'){
  const scale=p.scale??1,bob=Math.abs(Math.sin(p.phase??0))*Math.abs(p.walk??0)*.023;
  const shoulder=vec([(p.lean??0)+(side==='left'?-.21:.21),(p.sit?.62:.92+bob)+.6,-.02]);
  const root=vec([p.x,0,p.z??0]);
  return solveTwoBone(shoulder,vec(p[side]!).sub(root).divideScalar(scale),vec([side==='left'?-.6:.6,-.4,.3]),.31,.31).end.multiplyScalar(scale).add(root);
}
test('seeking back reconstructs the same performance without replaying elapsed frames',()=>{
  for(const s of stories){const first=storyFrame(s.id,6.75);storyFrame(s.id,s.duration);assert.deepEqual(storyFrame(s.id,6.75),first);assert.equal(storyFrame(s.id,-1).time,0);assert.equal(storyFrame(s.id,s.duration+8).time,s.duration);}
});
test('the father and child actually reach the same hand point in both generations',()=>{
  for(const t of [0,8,18,65,68,71]){const f=storyFrame('father',t);assert.ok(f.joined);const [dad,child]=f.actors;const early=t<24;assert.ok(wrist(dad,early?'left':'right').distanceTo(wrist(child,early?'right':'left'))<.035,`hands must meet at ${t}s`);}
  assert.ok(storyFrame('father',3).actors[1].scale!<storyFrame('father',65).actors[0].scale!);
  assert.ok(storyFrame('father',30).actors[1].x>storyFrame('father',30).actors[0].x);
});
test('dish and bowl stay within the performing hands reach during their movement',()=>{
  for(let t=14;t<=23;t+=.5){const p=storyFrame('dinner',t).actors[0];assert.ok(wrist(p,'right').distanceTo(vec(p.right!))<.02);}
  for(let t=26;t<=35;t+=.5){const p=storyFrame('dinner',t).actors[1];assert.ok(wrist(p,'left').distanceTo(vec(p.left!))<.02);}
});
test('the group makes room before the newcomer joins, with continuous positions',()=>{
  const before=storyFrame('newcomer',12),space=storyFrame('newcomer',26),after=storyFrame('newcomer',35);
  assert.ok(space.actors[0].x<before.actors[0].x-.4);
  assert.equal(space.actors[1].x,before.actors[1].x);
  assert.ok(after.actors[1].x<space.actors[1].x-1);
  for(let t=0;t<35;t+=.1){const a=storyFrame('newcomer',t),b=storyFrame('newcomer',t+.1);for(let i=0;i<a.actors.length;i++)assert.ok(Math.abs(a.actors[i].x-b.actors[i].x)<.06);}
});
