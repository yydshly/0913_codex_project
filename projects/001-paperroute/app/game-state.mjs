export const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
export const ROUTE_LENGTH = 560;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createGame() {
  return { phase: 'ready', day: 0, score: 0, lives: 3, subscribers: 10, x: -4.3, distance: 0,
    speed: 0, time: 0, delivered: 0, missed: 0, streak: 0, papers: 16, invincible: 0,
    cooldown: 0, targets: [], hazards: [], events: [], result: null, totalDelivered: 0 };
}

export function startDay(game) {
  if (!['ready', 'dayEnd'].includes(game.phase)) return false;
  Object.assign(game, { phase: 'riding', x: -4.3, distance: 0, speed: 0, time: 0,
    delivered: 0, missed: 0, streak: 0, papers: game.subscribers + 6, invincible: 0,
    cooldown: 0, events: [], result: null });
  game.targets = Array.from({ length: game.subscribers }, (_, index) => ({
    id: index, z: 55 + index * (450 / Math.max(1, game.subscribers - 1)),
    side: (index + game.day) % 2 ? 1 : -1, status: 'waiting'
  }));
  game.hazards = Array.from({ length: 6 + game.day * 2 }, (_, i) => ({
    id: i, kind: ['car', 'pothole', 'dog'][i % 3],
    z: 135 + i * (360 / (5 + game.day * 2)),
    x: [1.8, -3.1, 6.5, -1.7, 3.4, -6.5][(i + game.day) % 6],
    hit: false, active: false, originX: 0
  }));
  game.hazards.forEach(h => { if (h.kind === 'car') h.x = clamp(h.x, -3.4, 3.4); h.originX = h.x; });
  return true;
}

export function nearestTarget(game) {
  return game.targets.find(t => t.status === 'waiting') || null;
}

export function reachableTarget(game) {
  return game.targets.filter(t => t.status === 'waiting' && Math.abs(t.z - game.distance) <= 13 && game.x * t.side > 1.2)
    .sort((a, b) => Math.abs(a.z - game.distance) - Math.abs(b.z - game.distance))[0] || null;
}

export function throwPaper(game) {
  if (game.phase !== 'riding' || game.cooldown > 0 || game.papers < 1) return null;
  game.papers--;
  game.cooldown = 0.4;
  const target = reachableTarget(game);
  const event = { type: 'throw', x: game.x, z: game.distance, targetId: target?.id ?? null,
    endX: target ? target.side * 7.4 : (game.x < 0 ? -9 : 9), endZ: target?.z ?? game.distance + 12 };
  game.events.push(event);
  if (target) {
    target.status = 'delivered';
    game.delivered++;
    game.totalDelivered++;
    game.streak++;
    const points = 100 * Math.min(5, game.streak);
    game.score += points;
    game.events.push({ type: 'delivery', targetId: target.id, points, streak: game.streak });
  } else {
    game.streak = 0;
    game.events.push({ type: 'emptyThrow' });
  }
  return event;
}

export function setPaused(game, paused) {
  if (paused && game.phase === 'riding') { game.phase = 'paused'; return true; }
  if (!paused && game.phase === 'paused') { game.phase = 'riding'; return true; }
  return false;
}

export function finishDay(game, crashed = false) {
  if (game.phase !== 'riding') return;
  for (const target of game.targets) {
    if (target.status === 'waiting') { target.status = 'missed'; game.missed++; }
  }
  const perfect = !crashed && game.delivered === game.subscribers;
  const grade = perfect ? 'S' : game.delivered / game.subscribers >= 0.8 ? 'A' : game.delivered / game.subscribers >= 0.5 ? 'B' : 'C';
  if (perfect) { game.score += 2500; game.lives = Math.min(3, game.lives + 1); }
  const nextSubscribers = clamp(game.subscribers - game.missed + (perfect ? 1 : 0), 0, 16);
  game.result = { perfect, grade, delivered: game.delivered, missed: game.missed,
    subscribers: game.subscribers, nextSubscribers, day: game.day, crashed, time: game.time };
  game.phase = crashed || nextSubscribers === 0 ? 'gameOver' : game.day === 6 ? 'weekEnd' : 'dayEnd';
  game.speed = 0;
  game.events.push({ type: 'result', result: game.result });
}

export function nextDay(game) {
  if (game.phase !== 'dayEnd') return false;
  game.subscribers = game.result.nextSubscribers;
  game.day++;
  return startDay(game);
}

export function updateGame(game, dt, input = {}) {
  if (game.phase !== 'riding') return;
  dt = clamp(dt, 0, 0.05);
  game.time += dt;
  game.cooldown = Math.max(0, game.cooldown - dt);
  game.invincible = Math.max(0, game.invincible - dt);
  const targetSpeed = input.brake ? 5 : input.sprint ? 23 + game.day : 12.5 + game.day * 0.5;
  game.speed += (targetSpeed - game.speed) * Math.min(1, dt * 2.3);
  const direction = Number(!!input.right) - Number(!!input.left);
  if (direction) game.x += direction * 7.7 * dt;
  else if (Number.isFinite(input.targetX)) game.x += clamp(input.targetX - game.x, -7.7 * dt, 7.7 * dt);
  game.x = clamp(game.x, -6.1, 6.1);
  game.distance = Math.min(ROUTE_LENGTH, game.distance + game.speed * dt);
  for (const target of game.targets) {
    if (target.status === 'waiting' && game.distance > target.z + 14) {
      target.status = 'missed'; game.missed++; game.streak = 0;
      game.events.push({ type: 'missed', targetId: target.id });
    }
  }
  for (const hazard of game.hazards) {
    if (hazard.hit) continue;
    if (hazard.kind === 'car' && hazard.z - game.distance < 95) hazard.z -= (3.8 + game.day * 0.3) * dt;
    if (hazard.kind === 'dog' && hazard.z - game.distance < 32 && hazard.z > game.distance - 5) {
      hazard.active = true;
      hazard.x += clamp(game.x - hazard.x, -3.1 * dt, 3.1 * dt);
      hazard.z -= dt;
    }
    const radius = hazard.kind === 'car' ? 1.3 : hazard.kind === 'pothole' ? 0.85 : 0.65;
    if (game.invincible === 0 && Math.abs(hazard.z - game.distance) < (hazard.kind === 'car' ? 2.2 : 1.2) && Math.abs(hazard.x - game.x) < radius) {
      hazard.hit = true; game.lives--; game.streak = 0; game.speed *= 0.3; game.invincible = 2.5;
      game.events.push({ type: 'collision', kind: hazard.kind });
      if (game.lives <= 0) { finishDay(game, true); return; }
    }
  }
  if (game.distance >= ROUTE_LENGTH) finishDay(game);
}
