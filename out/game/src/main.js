// Solmar Bay — boot and the one loop. Luz Marin, ex-courier, back in a
// sun-soaked coastal city she never meant to return to. Fixed 1/60 s steps,
// camera follows player or car, screens: title, play, paused, busted, win.
// ?seed=N fixes the city. ?shot=chase|street|mission|title stages a scene
// and sets window.__shotReady. Save: localStorage on mission complete and
// on busted; Continue restores cash, missions and position.
import { STEP, SAVE_KEY, BEST_KEY, VIEW, WORLD, PLAYER, ECONOMY } from './config.js';
import { createRandom, clamp } from './random.js';
import { createWorld } from './world.js';
import { createVehicles } from './vehicles.js';
import { createPedestrians } from './pedestrians.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createCombat } from './combat.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_ATTACK, ACTION_WEAPON, ACTION_MUTE } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261119;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const vehicles = createVehicles(random, world);
const peds = createPedestrians(random, world);
const police = createPolice(random, world, vehicles);
const missions = createMissions(world);
const audio = createAudio();
const combat = createCombat(world, police, audio);
const hud = createHud();
const renderer = createRenderer(canvas, hud);
const game = { world, vehicles, peds, police, missions, combat, audio };

function readSave() {
  try { return JSON.parse(window.localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
}
function writeSave() {
  try {
    const p = world.state.player;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: p.cash, missionsDone: world.state.missionsDone, missionIndex: missions.index, x: p.x, y: p.y, score: world.state.score, kills: world.state.kills }));
  } catch { /* storage off: play on without saving */ }
}
function readBest() { try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; } }
function saveBest(v) { try { window.localStorage.setItem(BEST_KEY, String(v)); } catch { /* ignore */ } }

function runShot(name) {
  const scene = stageShot(name, game);
  let painted = 0;
  function paint() { renderer.draw(world.state, scene.screen, scene.best, game); painted += 1; if (painted < 2) requestAnimationFrame(paint); else window.__shotReady = true; }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0; let last = performance.now();
  let save = readSave();
  function announce(m) { status.textContent = m; }
  function startGame(fresh) {
    world.reset(); police.clearWanted(); missions.start();
    if (!fresh && save) {
      world.state.player.cash = save.cash; world.state.player.x = save.x; world.state.player.y = save.y;
      world.state.score = save.score || 0; world.state.missionsDone = save.missionsDone || 0;
      missions.skipTo(save.missionIndex || 0);
      announce('Continuing your Solmar Bay save.');
    }
    accumulator = 0; screen = SCREEN_PLAY; audio.unlock();
    announce('Playing Solmar Bay. WASD move, E steal a car, Space fight.');
  }
  function bustPlayer() {
    screen = SCREEN_OVER; audio.busted(); audio.stopEngine();
    const lost = Math.min(200, world.state.player.cash);
    world.state.player.cash -= lost; world.state.player.health = 100; police.clearWanted();
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    writeSave(); announce(`Busted. Lost $${lost}.`);
  }
  function winGame() { screen = SCREEN_WIN; audio.mission(); if (world.state.score > best) { best = world.state.score; saveBest(best); } writeSave(); }
  function updateCamera() {
    const p = world.state.player;
    const car = p.onFoot ? null : vehicles.cars[p.carId];
    const tx = car ? car.x : p.x; const ty = car ? car.y : p.y;
    world.state.camera.x = clamp(tx - VIEW.width / 2, 0, WORLD.width - VIEW.width);
    world.state.camera.y = clamp(ty - VIEW.height / 2, 0, WORLD.height - VIEW.height);
  }
  function step(dt) {
    const s = world.state; const p = s.player;
    s.elapsed += dt; s.timeOfDay = (9.5 + s.elapsed / 120) % 24;
    p.punchCooldown = Math.max(0, p.punchCooldown - dt); p.shotCooldown = Math.max(0, p.shotCooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    for (const e of s.effects) e.life -= dt;
    s.effects = s.effects.filter((e) => e.life > 0);
    for (const m of s.messages) m.life -= dt;
    s.messages = s.messages.filter((m) => m.life > 0);
    if (s.messages.length) s.toast = s.messages[0].text; else s.toast = '';
    const car = p.onFoot ? null : vehicles.cars[p.carId];
    // Aim: mouse direction on screen -> world angle.
    const mouse = input.mouse();
    const scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    const ox = (canvas.width - VIEW.width * scale) / 2; const oy = (canvas.height - VIEW.height * scale) / 2;
    const worldMouseX = s.camera.x + (mouse.x - ox) / scale; const worldMouseY = s.camera.y + (mouse.y - oy) / scale;
    if (p.onFoot) p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
    if (p.onFoot) {
      const mx = input.moveX(); const my = input.moveY();
      const len = Math.hypot(mx, my) || 1;
      const speed = input.running() ? PLAYER.runSpeed : PLAYER.walkSpeed;
      const nx = p.x + (mx / len) * speed * dt * (mx || my ? 1 : 0);
      const ny = p.y + (my / len) * speed * dt * (mx || my ? 1 : 0);
      if (!world.collideCircle(nx, p.y, PLAYER.radius)) p.x = clamp(nx, 20, WORLD.width - 20);
      if (!world.collideCircle(p.x, ny, PLAYER.radius)) p.y = clamp(ny, 20, WORLD.height - 20);
      p.health = Math.min(100, p.health + 1.2 * dt);
    } else if (car) {
      const crashed = vehicles.drivePlayer(car, input.driveX(), input.driveY(), dt);
      if (crashed) { audio.crash(); car.health -= 8; if (car.health <= 0) { p.onFoot = true; p.x = car.x + 40; p.y = car.y; police.addCrime(1); } }
      audio.startEngine(car.speed);
      // Running over a pedestrian at speed is a crime.
      const near = peds.nearest(car.x, car.y, 34);
      if (near && Math.abs(car.speed) > 200) { near.health = 0; police.addCrime(1); world.addEffect('hit', near.x, near.y - 20, 'CRASH'); audio.crash(); }
    }
    vehicles.stepTraffic(dt, car);
    const danger = combat.bullets.length > 0;
    peds.step(dt, p, danger);
    combat.step(dt, peds, police.officers);
    const result = police.step(dt, p, car, audio);
    if (result.busted) { bustPlayer(); return; }
    // Cash pickups.
    for (const pk of world.pickups) {
      if (pk.taken) continue;
      const dx = pk.x - p.x; const dy = pk.y - p.y;
      if (dx * dx + dy * dy < 36 * 36) { pk.taken = true; p.cash += ECONOMY.pickupPay; s.score += 25; audio.coin(); world.toast(`Found $${ECONOMY.pickupPay} on the street.`); }
    }
    // Missions.
    const check = missions.check(p, car);
    if (check === 'done') { const pay = missions.complete(); audio.mission(); writeSave(); if (!missions.active) winGame(); }
    else if (check === 'lookouts') { world.toast('Deal with the two lookouts first — Space to punch.'); }
    if (p.health <= 0) { bustPlayer(); return; }
    updateCamera();
  }
  function handleActions() {
    const actions = input.takeActions();
    const p = world.state.player;
    if (actions & ACTION_MUTE) { const m = audio.toggleMute(); world.toast(m ? 'Sound off (M to turn on)' : 'Sound on'); }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) startGame(screen === SCREEN_OVER);
      return;
    }
    if (actions & ACTION_PAUSE) { screen = SCREEN_PAUSED; announce('Paused.'); return; }
    if (screen === SCREEN_PAUSED) { if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) { screen = SCREEN_PLAY; announce('Playing.'); } return; }
    if (actions & ACTION_WEAPON) combat.toggleWeapon();
    if (actions & ACTION_ATTACK) {
      if (p.onFoot) {
        if (combat.weapon === 'pistol') combat.shoot(p, p.angle);
        else if (combat.punch(p, peds, police.officers)) { const m = missions.active; if (m && m.id === 3) missions.markLookoutDown(); }
      }
    }
    if (actions & ACTION_ENTER) {
      if (p.onFoot) {
        const car = vehicles.nearestCar(p.x, p.y, 70);
        if (car) {
          p.onFoot = false; p.carId = car.id; car.parked = false; car.driver = true;
          if (!car.police) { world.state.carsStolen += 1; police.addCrime(1); world.toast(`Stole a ${car.name} — the police noticed.`); audio.startEngine(0); }
        }
      } else {
        const car = vehicles.cars[p.carId];
        p.onFoot = true; p.x = car.x + 42; p.y = car.y; p.carId = -1; car.speed = 0; audio.stopEngine();
      }
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME); last = now;
    handleActions();
    if (screen === SCREEN_PLAY) { while (accumulator >= STEP) { step(STEP); accumulator -= STEP; if (screen !== SCREEN_PLAY) break; } }
    else accumulator = 0;
    renderer.draw(world.state, screen, best, game);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); } });
  announce('Solmar Bay. Press Space or click to start. Continue restores your save.');
  requestAnimationFrame(frame);
}
if (shot) runShot(shot); else runGame();
