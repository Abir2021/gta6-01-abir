// Vehicles: traffic cars that follow the road grid, parked cars to steal,
// and the player's driven car. Traffic picks a road, drives along it, turns
// at intersections and slows for the car ahead; it never leaves the roads.
// Stealing a parked or traffic car (E nearby) raises the wanted level —
// that is the crime loop, not a free taxi service.
import { CAR, CAR_COLORS, CAR_NAMES, WORLD } from './config.js';
import { pick, range, clamp, angleDiff } from './random.js';
import { roadCenters } from './world.js';

export function createVehicles(random, world) {
  const { xs, ys } = roadCenters();
  const cars = [];
  function spawnCar(x, y, angle, police) {
    const car = {
      id: cars.length, x, y, angle, speed: 0, color: police ? '#2b6cb0' : pick(random, CAR_COLORS),
      name: police ? 'Patrol Interceptor' : pick(random, CAR_NAMES), police: !!police,
      health: CAR.health, parked: false, driver: !police && random() < 0.7, target: null, wait: 0,
    };
    cars.push(car); return car;
  }
  for (let i = 0; i < 16; i += 1) {
    const vertical = random() < 0.5;
    const x = vertical ? pick(random, xs) + (random() < 0.5 ? -22 : 22) : range(random, 200, WORLD.width - 200);
    const y = vertical ? range(random, 200, WORLD.height - 600) : pick(random, ys) + (random() < 0.5 ? -22 : 22);
    const angle = vertical ? (x % 400 < 200 ? Math.PI / 2 : -Math.PI / 2) : (y % 400 < 200 ? 0 : Math.PI);
    const car = spawnCar(x, y, angle, false); car.speed = range(random, 120, 220); car.target = null;
  }
  // Parked cars on side streets, ready to steal.
  const parkedSpots = [[700, 580], [1100, 980], [1900, 580], [2500, 980], [500, 1380], [1500, 1380], [2300, 1580], [900, 1780]];
  for (const [x, y] of parkedSpots) { const c = spawnCar(x, y, pick(random, [0, Math.PI / 2, Math.PI, -Math.PI / 2]), false); c.parked = true; c.driver = false; c.speed = 0; }
  function nearestCar(x, y, maxDist) {
    let best = null; let bd = maxDist * maxDist;
    for (const c of cars) { const dx = c.x - x; const dy = c.y - y; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function drivePlayer(car, steer, throttle, dt) {
    const forward = throttle > 0 ? CAR.accel * throttle : throttle < 0 ? -CAR.reverse : 0;
    car.speed += forward * dt;
    if (throttle === 0) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 240 * dt);
    car.speed = clamp(car.speed, -CAR.maxReverse, CAR.maxSpeed);
    car.angle += steer * CAR.turn * dt * clamp(Math.abs(car.speed) / 120, 0, 1) * (car.speed < 0 ? -1 : 1);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    const hit = world.collideCircle(nx, ny, 22);
    if (hit) { car.speed *= -0.25; return true; }
    car.x = clamp(nx, 30, WORLD.width - 30); car.y = clamp(ny, 30, WORLD.height - 30);
    return false;
  }
  function stepTraffic(dt, playerCar) {
    for (const car of cars) {
      if (car.police || car === playerCar || car.parked) continue;
      if (!car.driver) continue;
      // Follow current heading; at an intersection, sometimes turn.
      const onX = Math.abs(car.x - Math.round(car.x / 400) * 400) < 60;
      if (car.wait > 0) { car.wait -= dt; car.speed = Math.max(0, car.speed - 300 * dt); continue; }
      let ahead = null; let bd = 90 * 90;
      for (const o of cars) { if (o === car) continue; const dx = o.x - car.x; const dy = o.y - car.y; if (dx * dx + dy * dy < bd && Math.cos(car.angle) * dx + Math.sin(car.angle) * dy > 0) { bd = dx * dx + dy * dy; ahead = o; } }
      // Slow for the car ahead, cruise otherwise — traffic that reads the road.
      const cruise = ahead ? 50 : 170;
      car.speed += clamp(cruise - car.speed, -260 * dt, 200 * dt);
      const nearX = xs.reduce((a, b) => Math.abs(b - car.x) < Math.abs(a - car.x) ? b : a, xs[0]);
      const nearY = ys.reduce((a, b) => Math.abs(b - car.y) < Math.abs(a - car.y) ? b : a, ys[0]);
      const atIntersection = Math.abs(car.x - nearX) < 46 && Math.abs(car.y - nearY) < 46;
      if (atIntersection && random() < dt * 0.5) {
        car.angle += pick(random, [0, Math.PI / 2, -Math.PI / 2]);
        car.x = nearX; car.y = nearY;
      }
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      car.x = clamp(car.x, 40, WORLD.width - 40); car.y = clamp(car.y, 40, WORLD.height - 160);
      void onX;
    }
  }
  return { cars, spawnCar, nearestCar, drivePlayer, stepTraffic };
}
