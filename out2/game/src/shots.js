// Screenshot scenes behind ?shot=chase|street|mission|title. Each stages a
// real game state (not a mock): a wanted chase with police, a street drive,
// a mission waypoint, and the title screen — then the renderer paints it
// twice and sets window.__shotReady. Same seed, same frame, every time.
import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, game) {
  const { world, vehicles, peds, police, missions } = game;
  const s = world.state;
  world.reset(); missions.start();
  if (name === 'title') return { screen: SCREEN_TITLE, best: 0 };
  if (name === 'mission') {
    // Luz on foot near the Harbor lighthouse marker, pedestrians around.
    s.player.x = 2450; s.player.y = 1420; s.player.angle = 0.6; s.player.cash = 860;
    s.camera.x = 2050; s.camera.y = 1060;
    missions.start();
    return { screen: SCREEN_PLAY, best: 860 };
  }
  if (name === 'street') {
    // Luz driving a Sunrunner down a Downtown avenue with traffic.
    const car = vehicles.cars.find((c) => c.name === 'Sunrunner' && !c.police) || vehicles.cars[2];
    car.parked = false; car.driver = true; car.speed = 320; car.angle = 0; car.x = 1400; car.y = 400;
    s.player.onFoot = false; s.player.carId = car.id; s.player.cash = 540;
    s.camera.x = 1000; s.camera.y = 80;
    return { screen: SCREEN_PLAY, best: 540 };
  }
  // Default: chase — wanted 3 stars, two patrol cars closing in, mission live.
  police.addCrime(3);
  const car = vehicles.cars.find((c) => c.name === 'Marlin GT' && !c.police) || vehicles.cars[0];
  car.parked = false; car.driver = true; car.speed = 420; car.angle = 0; car.x = 1300; car.y = 600;
  s.player.onFoot = false; s.player.carId = car.id; s.player.cash = 1240; s.player.health = 82;
  const p1 = vehicles.spawnCar(1050, 600, 0, true); p1.speed = 380;
  const p2 = vehicles.spawnCar(1650, 520, Math.PI, true); p2.speed = 360;
  s.camera.x = 900; s.camera.y = 260;
  for (let i = 0; i < 30; i += 1) { vehicles.stepTraffic(STEP, car); peds.step(STEP, s.player, false); }
  return { screen: SCREEN_PLAY, best: 1240 };
}
