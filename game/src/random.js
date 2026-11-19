// Seeded RNG (mulberry32) plus small helpers. Same seed, same Solmar Bay:
// buildings, traffic colours and pedestrian clothes repeat exactly, which
// makes screenshot scenes and save-free replays deterministic.
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pick(random, list) { return list[Math.floor(random() * list.length)]; }
export function range(random, min, max) { return min + random() * (max - min); }
export function intRange(random, min, max) { return min + Math.floor(random() * (max - min + 1)); }
export function clamp(value, min, max) { return value < min ? min : value > max ? max : value; }
export function dist2(ax, ay, bx, by) { const dx = ax - bx; const dy = ay - by; return dx * dx + dy * dy; }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function angleDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
