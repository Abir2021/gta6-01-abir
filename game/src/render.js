// Drawing only: the city, the people, the cars, the effects, then the HUD
// and the title / pause / busted / complete panels. The camera follows the
// player (or their car) and the world is drawn in world coordinates, clipped
// to the 1280x720 view. Sun-soaked palette: warm sand, teal sea, pastel
// buildings, long soft shadows.
import { VIEW, WORLD, PALETTE, FONT } from './config.js';
import { districtAt } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas, hud) {
  const ctx = canvas.getContext('2d');
  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    ctx.font = fonts.get(size); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio); canvas.height = Math.round(window.innerHeight * ratio);
  }
  function drawCar(car, cam) {
    ctx.save(); ctx.translate(car.x - cam.x, car.y - cam.y); ctx.rotate(car.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-28, -14, 56, 28);
    ctx.fillStyle = car.color; ctx.fillRect(-27, -13, 54, 26);
    ctx.fillStyle = '#1b2a3a'; ctx.fillRect(-8, -11, 16, 22);
    ctx.fillStyle = car.police ? '#ffffff' : '#d8d8d8'; ctx.fillRect(20, -11, 5, 22);
    if (car.police) { ctx.fillStyle = Math.floor(performance.now() / 300) % 2 ? '#ff4040' : '#4080ff'; ctx.fillRect(-2, -13, 8, 6); }
    ctx.restore();
  }
  function drawWorld(state, vehicles, peds, police, missions, combat, cam) {
    const x0 = cam.x; const y0 = cam.y; const x1 = cam.x + VIEW.width; const y1 = cam.y + VIEW.height;
    // Ground: grass, beach sand south, sea at the very bottom edge.
    ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.sand; ctx.fillRect(Math.max(0, -x0), 1800 - y0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.sea; ctx.fillRect(0, Math.max(0, 2280 - y0), VIEW.width, 200);
    // Park in the centre.
    ctx.fillStyle = PALETTE.park; ctx.fillRect(920 - x0, 920 - y0, 280, 280);
    // Roads.
    ctx.fillStyle = PALETTE.road;
    for (let x = 200; x < WORLD.width; x += 400) ctx.fillRect(x - 48 - x0, -y0, 96, WORLD.height);
    for (let y = 200; y < WORLD.height - 400; y += 400) ctx.fillRect(-x0, y - 48 - y0, WORLD.width, 96);
    ctx.strokeStyle = PALETTE.roadLine; ctx.lineWidth = 3; ctx.setLineDash([24, 24]);
    for (let x = 200; x < WORLD.width; x += 400) { ctx.beginPath(); ctx.moveTo(x - x0, -y0); ctx.lineTo(x - x0, WORLD.height - y0); ctx.stroke(); }
    for (let y = 200; y < WORLD.height - 400; y += 400) { ctx.beginPath(); ctx.moveTo(-x0, y - y0); ctx.lineTo(WORLD.width - x0, y - y0); ctx.stroke(); }
    ctx.setLineDash([]);
    // Buildings in view.
    for (const b of state.buildings) {
      if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(b.x - x0 + 8, b.y - y0 + 10, b.w, b.h);
      ctx.fillStyle = b.color; ctx.fillRect(b.x - x0, b.y - y0, b.w, b.h);
      ctx.fillStyle = PALETTE.roof; ctx.fillRect(b.x - x0, b.y - y0, b.w, 10);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - x0 + 10, b.y - y0 + 22, 14, 12); ctx.fillRect(b.x - x0 + b.w - 24, b.y - y0 + 22, 14, 12);
      if (b.tall) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(b.x - x0 + 8, b.y - y0 + 8, b.w - 16, 6); }
    }
    for (const t of state.trees) {
      if (t.x < x0 || t.x > x1 || t.y < y0 || t.y > y1) continue;
      ctx.fillStyle = '#2f6b2f'; ctx.beginPath(); ctx.arc(t.x - x0, t.y - y0, t.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(t.x - x0 - 2, t.y - y0 - 2, 4, 6);
    }
    // Cash pickups.
    for (const p of state.pickups) {
      if (p.taken) continue;
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(p.x - x0, p.y - y0 + Math.sin(state.elapsed * 3 + p.bob) * 3, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a6d00'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', p.x - x0, p.y - y0 + 4);
    }
    // Mission marker: pulsing gold diamond + beacon.
    const mission = missions.active;
    if (mission) {
      const mx = mission.target.x - x0; const my = mission.target.y - y0;
      ctx.fillStyle = 'rgba(255,183,3,0.25)'; ctx.beginPath(); ctx.arc(mx, my, 46 + Math.sin(state.elapsed * 4) * 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.moveTo(mx, my - 18); ctx.lineTo(mx + 14, my); ctx.lineTo(mx, my + 18); ctx.lineTo(mx - 14, my); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a5200'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', mx, my + 5);
    }
    for (const ped of peds.peds) {
      if (ped.health <= 0 || ped.x < x0 || ped.x > x1 || ped.y < y0 || ped.y > y1) continue;
      ctx.fillStyle = ped.shirt; ctx.beginPath(); ctx.arc(ped.x - x0, ped.y - y0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2c89b'; ctx.beginPath(); ctx.arc(ped.x - x0, ped.y - y0 - 4, 6, 0, Math.PI * 2); ctx.fill();
      if (ped.scared) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', ped.x - x0, ped.y - y0 - 16); }
    }
    for (const car of vehicles.cars) { if (car.x > x0 - 60 && car.x < x1 + 60 && car.y > y0 - 60 && car.y < y1 + 60) drawCar(car, cam); }
    for (const o of police.officers) {
      ctx.fillStyle = '#1e3a5f'; ctx.beginPath(); ctx.arc(o.x - x0, o.y - y0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('P', o.x - x0, o.y - y0 + 4);
    }
    // Player on foot.
    const p = state.player;
    if (p.onFoot) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(p.x - x0 + 4, p.y - y0 + 6, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(p.x - x0, p.y - y0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x - x0 + Math.cos(p.angle) * 6, p.y - y0 + Math.sin(p.angle) * 6 - 4, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - x0, p.y - y0); ctx.lineTo(p.x - x0 + Math.cos(p.angle) * 24, p.y - y0 + Math.sin(p.angle) * 24); ctx.stroke();
    }
    for (const b of combat.bullets) { ctx.fillStyle = '#ffe066'; ctx.fillRect(b.x - x0 - 3, b.y - y0 - 1, 6, 2); }
    for (const e of state.effects) {
      ctx.globalAlpha = Math.max(0, e.life);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.text, e.x - x0, e.y - y0);
      ctx.globalAlpha = 1;
    }
    // Mission beacon: a gold pillar of light above the target, visible across town.
    if (mission) {
      const mx = mission.target.x - x0;
      ctx.fillStyle = 'rgba(255,183,3,0.18)'; ctx.fillRect(mx - 6, 0, 12, VIEW.height);
    }
  }
  function drawPanel(title, lines, prompt) {
    ctx.fillStyle = PALETTE.panel; ctx.fillRect(240, 130, 800, 130 + lines.length * 36 + 70);
    text(title, 640, 210, 52, PALETTE.text, 'center');
    lines.forEach((line, i) => text(line, 640, 270 + i * 36, 21, PALETTE.muted, 'center'));
    text(prompt, 640, 270 + lines.length * 36 + 40, 23, '#ffb703', 'center');
  }
  function draw(state, screen, best, systems) {
    const { vehicles, peds, police, missions, combat } = systems;
    const cam = state.camera;
    const scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0e1420'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - VIEW.width * scale) / 2, (canvas.height - VIEW.height * scale) / 2);
    if (screen === SCREEN_TITLE) {
      drawWorld(state, vehicles, peds, police, missions, combat, { x: 320, y: 320 });
      drawPanel('SOLMAR BAY', ['An open-world crime story. Luz Marin is back in town —', 'and the city owes her. Drive, steal, run missions, dodge the police.', `Best score ${best}  •  Save: localStorage`], 'Press Space or click to start');
      return;
    }
    drawWorld(state, vehicles, peds, police, missions, combat, cam);
    const district = districtAt(state.player.x, state.player.y);
    const playerCar = state.player.onFoot ? null : vehicles.cars[state.player.carId];
    hud.draw(ctx, state, vehicles, peds, missions, playerCar, cam, district);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', ['The city waits. Your save is safe.'], 'Press P to resume');
    else if (screen === SCREEN_OVER) drawPanel('BUSTED', [`The Solmar Bay police caught Luz. Cash lost: $${Math.min(200, state.player.cash)}`, `Missions done: ${state.missionsDone}  •  Score ${state.score}`], 'Press Space to try again');
    else if (screen === SCREEN_WIN) drawPanel('SOLMAR IS YOURS', ['All four missions complete. Luz owns the Bay.', `Final cash $${state.player.cash}  •  Score ${state.score}`], 'Press Space to keep roaming');
  }
  resize(); window.addEventListener('resize', resize);
  return { draw };
}
