// Solmar Bay itself: a 3200x2400 grid city. Roads every 400 px, buildings in
// each block, a park, a marina, a beach along the south edge and the sea beyond.
// Pure data + geometry helpers: no drawing, no browser. Other systems ask it
// "is this point on a road?", "is this point inside a building?" and "where
// is the nearest road?" so traffic, pedestrians and missions all share one map.
import { WORLD, DISTRICTS } from './config.js';
import { pick, range } from './random.js';

export const EVENT_COIN = 2;
export const EVENT_PICKUP = 8;

export function roadCenters() {
  const xs = []; const ys = [];
  for (let x = 200; x < WORLD.width; x += 400) xs.push(x);
  for (let y = 200; y < WORLD.height - 400; y += 400) ys.push(y);
  return { xs, ys };
}
export function isOnRoad(x, y) {
  const { xs, ys } = roadCenters();
  for (const cx of xs) if (Math.abs(x - cx) < WORLD.road / 2) return true;
  for (const cy of ys) if (Math.abs(y - cy) < WORLD.road / 2) return true;
  return false;
}
export function nearestRoadPoint(x, y) {
  const { xs, ys } = roadCenters();
  let bx = xs[0]; let bd = Math.abs(x - bx);
  for (const cx of xs) if (Math.abs(x - cx) < bd) { bd = Math.abs(x - cx); bx = cx; }
  let by = ys[0]; let bd2 = Math.abs(y - by);
  for (const cy of ys) if (Math.abs(y - cy) < bd2) { bd2 = Math.abs(y - cy); by = cy; }
  return bd < bd2 ? { x: bx, y } : { x, y: by };
}
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  return 'Solmar Bay';
}

export function createWorld(random) {
  const buildings = [];
  const trees = [];
  const pickups = [];
  const palette = ['#e8b4a0', '#c9a7d8', '#a8c8e0', '#f0c98a', '#d8e8c8', '#e8a0a0'];
  // One or two buildings per city block, never on a road.
  for (let bx = 0; bx < 8; bx += 1) {
    for (let by = 0; by < 5; by += 1) {
      const ox = bx * 400 + 120; const oy = by * 400 + 120;
      if (oy > 1800) continue; // beach strip stays open sand
      if (bx === 2 && by === 2) continue; // central park
      const n = 1 + Math.floor(random() * 2);
      for (let i = 0; i < n; i += 1) {
        const w = range(random, 90, 170); const h = range(random, 70, 140);
        buildings.push({
          x: ox + i * 90 + range(random, 0, 40), y: oy + (i ? 110 : 0) + range(random, 0, 30),
          w, h, color: pick(random, palette), tall: random() < 0.35, name: pick(random, ['Cafe', 'Hotel', 'Market', 'Garage', 'Flats', 'Office']),
        });
      }
    }
  }
  for (let i = 0; i < 90; i += 1) {
    trees.push({ x: range(random, 60, WORLD.width - 60), y: range(random, 60, WORLD.height - 60), r: range(random, 9, 15) });
  }
  // Cash pickups scattered on sidewalks and the beach.
  const spots = [[620, 340], [1420, 740], [2260, 340], [340, 1140], [1820, 1540], [2620, 1140], [980, 1940], [2100, 2050], [540, 1620], [2980, 1940]];
  for (const [x, y] of spots) pickups.push({ x, y, taken: false, bob: random() * 6 });
  const state = {
    buildings, trees, pickups,
    player: { x: 640, y: 640, angle: 0, health: 100, cash: 120, ammo: 24, onFoot: true, carId: -1, punchCooldown: 0, shotCooldown: 0, invulnerable: 0 },
    wanted: 0, wantedHeat: 0, elapsed: 0, timeOfDay: 9.5, score: 0, kills: 0, carsStolen: 0, missionsDone: 0,
    camera: { x: 640, y: 640 }, effects: [], messages: [], toast: '',
  };
  function pointInBuilding(x, y, pad) {
    for (const b of buildings) if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
    return null;
  }
  function collideCircle(x, y, r) {
    const b = pointInBuilding(x, y, r);
    if (b) return b;
    if (x < r || y < r || x > WORLD.width - r || y > WORLD.height - r) return { edge: true };
    return null;
  }
  function addEffect(kind, x, y, text) { state.effects.push({ kind, x, y, text: text || '', life: 0.9 }); }
  function toast(text) { state.toast = text; state.messages.push({ text, life: 4 }); }
  function reset() {
    state.player.x = 640; state.player.y = 640; state.player.health = 100; state.player.cash = 120;
    state.player.ammo = 24; state.player.onFoot = true; state.player.carId = -1;
    state.wanted = 0; state.wantedHeat = 0; state.elapsed = 0; state.score = 0; state.kills = 0;
    state.carsStolen = 0; state.missionsDone = 0; state.effects.length = 0; state.messages.length = 0;
    for (const p of pickups) p.taken = false;
  }
  reset();
  return { state, buildings, trees, pickups, pointInBuilding, collideCircle, addEffect, toast, reset, districtAt };
}
