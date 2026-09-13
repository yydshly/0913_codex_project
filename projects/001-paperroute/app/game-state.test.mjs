import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startDay, nextDay, updateGame, throwPaper, setPaused, reachableTarget, ROUTE_LENGTH } from './game-state.mjs';

function riding() { const game = createGame(); startDay(game); return game; }

test('same-side delivery, cooldown, duplicate prevention and wrong-side miss', () => {
  const game = riding(), first = game.targets[0];
  game.distance = first.z; game.x = -4;
  throwPaper(game);
  assert.equal(game.delivered, 1); assert.equal(game.score, 100); assert.equal(game.papers, 15);
  assert.equal(throwPaper(game), null); assert.equal(game.papers, 15);
  game.cooldown = 0; throwPaper(game);
  assert.equal(game.delivered, 1); assert.equal(game.papers, 14);
  game.cooldown = 0; game.distance = game.targets[1].z; game.x = -4;
  assert.equal(reachableTarget(game), null);
  throwPaper(game); assert.equal(game.delivered, 1);
});

test('paused state does not advance or accept throws; running resumes', () => {
  const game = riding(); updateGame(game, .05, {}); setPaused(game, true);
  const frozen = structuredClone(game);
  for(let i=0;i<50;i++) updateGame(game, .05, {sprint:true,right:true});
  assert.equal(throwPaper(game), null); assert.deepEqual(game, frozen);
  setPaused(game, false); updateGame(game, .05, {}); assert.ok(game.distance > frozen.distance);
});

test('collision removes a life once; final collision ends the week', () => {
  const game = riding(); game.hazards = [{id:0, kind:'pothole', x:-4.3, z:0, hit:false}];
  updateGame(game,.01,{}); assert.equal(game.lives,2);
  updateGame(game,.01,{}); assert.equal(game.lives,2);
  game.invincible=0;game.lives=1;game.hazards[0].hit=false;
  updateGame(game,.01,{}); assert.equal(game.phase,'gameOver'); assert.equal(game.lives,0);
});

test('missed customers leave next day and replay preserves week score', () => {
  const game = riding(); game.distance=game.targets[0].z;game.x=-4.3;throwPaper(game);
  game.distance=ROUTE_LENGTH;updateGame(game,.01,{});
  assert.equal(game.phase,'dayEnd');assert.equal(game.result.missed,9);assert.equal(game.result.nextSubscribers,1);
  assert.equal(nextDay(game),true);assert.equal(game.day,1);assert.equal(game.targets.length,1);assert.equal(game.score,100);
});

test('obstacle-free continuous simulation verifies seven-day progression and perfect-day rewards', () => {
  const game = riding();
  for(let day=0;day<7;day++) {
    // Collision damage is verified separately; isolate delivery and day transitions here.
    game.hazards=[];
    let frames=0;
    while(game.phase==='riding' && frames++<30000) {
      const next=game.targets.find(t=>t.status==='waiting');
      const input={targetX:next?next.side*4.8:4.8,brake:true};
      updateGame(game,1/60,input);
      if(reachableTarget(game))throwPaper(game);
      game.events.length=0;
    }
    assert.ok(frames<30000,'route must terminate');
    assert.ok(game.result.perfect,'all reachable targets can be delivered');assert.equal(game.result.grade,'S');
    assert.equal(game.result.delivered,10+day);
    if(day<6){assert.equal(game.phase,'dayEnd');assert.equal(nextDay(game),true);}
  }
  assert.equal(game.phase,'weekEnd');assert.equal(game.totalDelivered,91);assert.ok(game.score>=17500);
});

test('exhausted paper inventory cannot go negative; missing all subscribers ends run', () => {
  const game=riding();game.papers=0;assert.equal(throwPaper(game),null);assert.equal(game.papers,0);
  game.distance=ROUTE_LENGTH;updateGame(game,.01,{});assert.equal(game.phase,'gameOver');assert.equal(game.result.nextSubscribers,0);
});
