// Pedestrians of Solmar Bay: walkers on sidewalks and the beach promenade,
// shoppers, joggers and beachgoers. They stroll, pause, turn at corners and
// flee from gunfire or a speeding car. Bumping one at speed is a crime —
// the wanted system watches. They are the city feeling alive, not targets:
// punching one still counts, and the game says so.
import { WORLD } from './config.js';
import { pick, range, clamp } from './random.js';
import { isOnRoad } from './world.js';

const SHIRTS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#9b5de5', '#ffffff', '#ff8fa3'];
const NAMES = ['Ana', 'Bruno', 'Celia', 'Diego', 'Elena', 'Felix', 'Greta', 'Hugo', 'Ines', 'Jorge', 'Kira', 'Leo'];

export function createPedestrians(random, world) {
  const peds = [];
  for (let i = 0; i < 34; i += 1) {
    let x = range(random, 100, WORLD.width - 100); let y = range(random, 100, WORLD.height - 100);
    if (isOnRoad(x, y)) { x += 70; y += 70; }
    peds.push({
      id: i, x, y, angle: range(random, 0, Math.PI * 2), speed: range(random, 28, 62),
      shirt: pick(random, SHIRTS), name: pick(random, NAMES), health: 50,
      state: 'walk', wait: range(random, 0, 3), flee: 0, scared: false,
    });
  }
  function step(dt, player, danger) {
    for (const p of peds) {
      if (p.health <= 0) continue;
      const dx = p.x - player.x; const dy = p.y - player.y; const d2 = dx * dx + dy * dy;
      if (danger || d2 < 120 * 120) { p.flee = 1.2; p.scared = true; }
      if (p.flee > 0) {
        p.flee -= dt; const d = Math.sqrt(d2) || 1;
        p.x += (dx / d) * 150 * dt; p.y += (dy / d) * 150 * dt; p.angle = Math.atan2(dy, dx);
        continue;
      }
      if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) p.angle = range(random, 0, Math.PI * 2); continue; }
      const nx = p.x + Math.cos(p.angle) * p.speed * dt;
      const ny = p.y + Math.sin(p.angle) * p.speed * dt;
      if (world.collideCircle(nx, ny, 10) || isOnRoad(nx, ny) || nx < 40 || ny < 40 || nx > WORLD.width - 40 || ny > WORLD.height - 40) {
        p.angle = range(random, 0, Math.PI * 2); p.wait = range(random, 0.5, 2.5); continue;
      }
      p.x = nx; p.y = ny;
      if (random() < dt * 0.08) p.wait = range(random, 1, 4);
    }
  }
  function nearest(x, y, maxDist) {
    let best = null; let bd = maxDist * maxDist;
    for (const p of peds) { if (p.health <= 0) continue; const dx = p.x - x; const dy = p.y - y; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  function aliveCount() { return peds.filter((p) => p.health > 0).length; }
  return { peds, step, nearest, aliveCount };
}
