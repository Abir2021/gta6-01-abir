// The Solmar Bay Police Department: wanted stars 0–5, heat that decays when
// you stay out of trouble, patrol cars that spawn at the map edge and chase,
// and officers on foot who try to bust you. One star: a patrol car follows.
// Three: two cars and foot officers. Five: the whole department. Getting
// busted on foot (officer close for a second) or wrecking your car at high
// wanted costs cash and drops you at the precinct with the heat cleared.
import { WANTED, WORLD } from './config.js';
import { clamp, angleDiff } from './random.js';
import { nearestRoadPoint } from './world.js';

export function createPolice(random, world, vehicles) {
  const officers = [];
  let spawnTimer = 0; let sirenTimer = 0;
  function addCrime(level) {
    world.state.wantedHeat = clamp(world.state.wantedHeat + level, 0, WANTED.max);
    world.state.wanted = Math.ceil(world.state.wantedHeat);
  }
  function spawnPatrol() {
    const edge = Math.floor(random() * 4);
    const x = edge === 0 ? 200 : edge === 1 ? WORLD.width - 200 : 400 + random() * (WORLD.width - 800);
    const y = edge === 2 ? 200 : edge === 3 ? WORLD.height - 600 : 400 + random() * (WORLD.height - 1000);
    const car = vehicles.spawnCar(x, y, 0, true);
    car.speed = 260; car.driver = true; return car;
  }
  function spawnOfficer(x, y) {
    officers.push({ x, y, angle: 0, speed: 170, bust: 0, health: 60 });
    if (officers.length > 8) officers.shift();
  }
  function step(dt, player, playerCar, audio) {
    const s = world.state;
    if (s.wanted > 0) {
      s.wantedHeat = Math.max(0, s.wantedHeat - WANTED.decay * dt);
      s.wanted = Math.ceil(s.wantedHeat);
    }
    sirenTimer -= dt;
    if (s.wanted > 0 && sirenTimer <= 0) { sirenTimer = 1.4; if (audio) audio.siren(); }
    const wantCars = s.wanted >= 4 ? 3 : s.wanted >= 2 ? 2 : s.wanted >= 1 ? 1 : 0;
    const patrols = vehicles.cars.filter((c) => c.police);
    spawnTimer -= dt;
    if (patrols.length < wantCars && spawnTimer <= 0) { spawnPatrol(); spawnTimer = 3; }
    if (s.wanted >= 3 && officers.length < 2 && spawnTimer <= 0) { spawnOfficer(player.x + 220, player.y - 160); spawnTimer = 4; }
    const tx = playerCar ? playerCar.x : player.x; const ty = playerCar ? playerCar.y : player.y;
    for (const car of patrols) {
      if (car === playerCar) continue;
      const ang = Math.atan2(ty - car.y, tx - car.x);
      car.angle += clamp(angleDiff(car.angle, ang), -2.4 * dt, 2.4 * dt);
      car.speed = clamp(car.speed + (s.wanted > 0 ? 180 : -300) * dt, 0, 300 + s.wanted * 40);
      const nx = car.x + Math.cos(car.angle) * car.speed * dt;
      const ny = car.y + Math.sin(car.angle) * car.speed * dt;
      if (!world.collideCircle(nx, ny, 22)) { car.x = clamp(nx, 30, WORLD.width - 30); car.y = clamp(ny, 30, WORLD.height - 30); }
      const dx = car.x - tx; const dy = car.y - ty;
      if (dx * dx + dy * dy < 50 * 50 && Math.abs(car.speed) > 120) {
        if (playerCar) { playerCar.health -= 18; playerCar.speed *= 0.4; }
        else { player.health -= 12; }
        car.speed *= 0.3;
      }
    }
    let busted = false;
    for (const o of officers) {
      const ang = Math.atan2(player.y - o.y, player.x - o.x);
      o.angle = ang;
      const d = Math.hypot(player.x - o.x, player.y - o.y);
      if (d > 12) { o.x += Math.cos(ang) * o.speed * dt; o.y += Math.sin(ang) * o.speed * dt; }
      if (d < WANTED.bustRadius && player.onFoot) { o.bust += dt; if (o.bust > 1.0) busted = true; }
      else o.bust = Math.max(0, o.bust - dt);
    }
    return { busted };
  }
  function clearWanted() { world.state.wanted = 0; world.state.wantedHeat = 0; officers.length = 0; }
  return { officers, addCrime, spawnPatrol, spawnOfficer, step, clearWanted };
}
