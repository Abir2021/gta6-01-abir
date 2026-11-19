// HUD and minimap: cash, health bar, wanted stars, mission objective with
// distance, speed when driving, clock, district name, and a live minimap in
// the top-right corner — roads, the player arrow, traffic dots, police
// flashes and the gold mission diamond. All canvas, no DOM, no network.
import { PALETTE, FONT, WORLD, VIEW } from './config.js';

export function createHud() {
  const fonts = new Map();
  function text(ctx, value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    ctx.font = fonts.get(size); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
    ctx.fillText(value, x, y);
  }
  function drawMinimap(ctx, state, vehicles, peds, missions, camera) {
    const size = 208; const x0 = VIEW.width - size - 16; const y0 = 16;
    const sx = size / WORLD.width; const sy = size / WORLD.height;
    ctx.fillStyle = PALETTE.hudBg; ctx.fillRect(x0 - 6, y0 - 6, size + 12, size + 12);
    ctx.fillStyle = '#2c4a5a'; ctx.fillRect(x0, y0, size, size);
    ctx.fillStyle = '#3a3f4a';
    for (let x = 200; x < WORLD.width; x += 400) ctx.fillRect(x0 + x * sx - 2, y0, 4, size);
    for (let y = 200; y < WORLD.height - 400; y += 400) ctx.fillRect(x0, y0 + y * sy, size, 4);
    ctx.fillStyle = '#f2d8a0'; ctx.fillRect(x0, y0 + 1800 * sy, size, size - 1800 * sy);
    const mission = missions.active;
    if (mission) {
      ctx.fillStyle = '#ffb703';
      const mx = x0 + mission.target.x * sx; const my = y0 + mission.target.y * sy;
      ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 7); ctx.lineTo(mx - 6, my); ctx.closePath(); ctx.fill();
    }
    for (const car of vehicles.cars) {
      ctx.fillStyle = car.police ? (Math.floor(state.elapsed * 4) % 2 ? '#ff4040' : '#4080ff') : '#e8e8e8';
      ctx.fillRect(x0 + car.x * sx - 1.5, y0 + car.y * sy - 1.5, 3, 3);
    }
    const px = state.player.x; const py = state.player.y;
    ctx.fillStyle = '#ff6b35'; ctx.beginPath(); ctx.arc(x0 + px * sx, y0 + py * sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    // Viewport rectangle so the player can tell where the camera is.
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(x0 + camera.x * sx, y0 + camera.y * sy, VIEW.width * sx, VIEW.height * sy);
  }
  function draw(ctx, state, vehicles, peds, missions, playerCar, camera, district) {
    const p = state.player;
    // Top-left: cash, health, wanted.
    ctx.fillStyle = PALETTE.hudBg; ctx.fillRect(12, 12, 250, 108);
    text(ctx, `$${p.cash}`, 24, 20, 28, '#7CFC00', 'left');
    text(ctx, `AMMO ${p.ammo}`, 150, 26, 16, PALETTE.muted, 'left');
    ctx.fillStyle = '#333'; ctx.fillRect(24, 56, 180, 14);
    ctx.fillStyle = p.health > 50 ? '#06d6a0' : p.health > 25 ? '#ffb703' : '#ef476f';
    ctx.fillRect(24, 56, 180 * Math.max(0, p.health) / 100, 14);
    text(ctx, `HP ${Math.max(0, Math.round(p.health))}`, 212, 54, 15, PALETTE.text, 'left');
    let stars = '';
    for (let i = 0; i < 5; i += 1) stars += i < state.wanted ? '★' : '☆';
    text(ctx, stars, 24, 78, 24, state.wanted ? '#ffd166' : '#888888', 'left');
    text(ctx, district, 24, 108, 13, PALETTE.muted, 'left');
    // Mission objective, bottom-left.
    const mission = missions.active;
    if (mission) {
      const tx = playerCar ? playerCar.x : p.x; const ty = playerCar ? playerCar.y : p.y;
      const dist = Math.round(Math.hypot(mission.target.x - tx, mission.target.y - ty));
      ctx.fillStyle = PALETTE.hudBg; ctx.fillRect(12, VIEW.height - 92, 560, 80);
      text(ctx, `MISSION ${mission.id}: ${mission.title}`, 24, VIEW.height - 84, 18, '#ffb703', 'left');
      text(ctx, mission.target.label, 24, VIEW.height - 58, 15, PALETTE.text, 'left');
      text(ctx, `${dist}m  •  $${mission.pay}`, 24, VIEW.height - 36, 15, PALETTE.muted, 'left');
    } else {
      ctx.fillStyle = PALETTE.hudBg; ctx.fillRect(12, VIEW.height - 62, 480, 50);
      text(ctx, 'All missions complete — free roam Solmar Bay!', 24, VIEW.height - 48, 16, '#7CFC00', 'left');
    }
    if (playerCar) {
      text(ctx, `${Math.round(Math.abs(playerCar.speed) * 0.18)} km/h  •  ${playerCar.name}`, VIEW.width - 240, VIEW.height - 60, 18, PALETTE.text, 'right');
      text(ctx, 'E exit car', VIEW.width - 240, VIEW.height - 36, 14, PALETTE.muted, 'right');
    } else {
      text(ctx, 'WASD move  •  E steal car  •  Space fight  •  Q weapon', VIEW.width - 16, VIEW.height - 36, 14, PALETTE.muted, 'right');
    }
    const hour = Math.floor(state.timeOfDay) % 24; const min = Math.floor((state.timeOfDay % 1) * 60);
    text(ctx, `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}  •  Score ${state.score}`, VIEW.width - 240, 236, 15, PALETTE.text, 'right');
    if (state.toast) text(ctx, state.toast, VIEW.width / 2, 16, 18, '#ffb703', 'center');
    drawMinimap(ctx, state, vehicles, peds, missions, camera);
  }
  return { draw, drawMinimap };
}
