// Combat: fists and a pistol, on foot only. Space punches the nearest person
// in front of you; Q swaps to the pistol, Space then fires a shot toward the
// mouse (or your facing) if you have ammo. Hits make noise, scatter nearby
// pedestrians, raise wanted, and drop a little cash from thugs. No auto-aim
// beyond a generous cone — the player aims, the game does not play itself.
import { PLAYER } from './config.js';
import { angleDiff } from './random.js';

export function createCombat(world, police, audio) {
  const bullets = [];
  let weapon = 'fists';
  function toggleWeapon() { weapon = weapon === 'fists' ? 'pistol' : 'fists'; world.toast(weapon === 'pistol' ? 'Pistol drawn — Space to fire, Q to holster' : 'Fists — Space to punch, Q for pistol'); return weapon; }
  function punch(player, peds, officers) {
    if (player.punchCooldown > 0) return false;
    player.punchCooldown = PLAYER.punchCooldown;
    if (audio) audio.punch();
    let hitAny = false;
    const targets = [...peds.peds, ...officers];
    for (const t of targets) {
      if (t.health <= 0) continue;
      const dx = t.x - player.x; const dy = t.y - player.y; const d = Math.hypot(dx, dy);
      if (d < PLAYER.punchRange && Math.abs(angleDiff(player.angle, Math.atan2(dy, dx))) < PLAYER.punchArc) {
        t.health -= PLAYER.punchDamage; hitAny = true;
        t.x += Math.cos(player.angle) * 18; t.y += Math.sin(player.angle) * 18;
        world.addEffect('hit', t.x, t.y - 20, 'WHAM');
        if (t.health <= 0) {
          world.state.kills += 1; world.state.player.cash += 25; world.state.score += 50;
          police.addCrime(1); world.toast('That was a crime — the police are coming.');
        }
      }
    }
    if (!hitAny) world.addEffect('swing', player.x + Math.cos(player.angle) * 30, player.y + Math.sin(player.angle) * 30, '');
    return hitAny;
  }
  function shoot(player, aimAngle) {
    if (weapon !== 'pistol') return false;
    if (player.shotCooldown > 0 || player.ammo <= 0) { if (player.ammo <= 0) world.toast('Out of ammo — find a pickup.'); return false; }
    player.shotCooldown = PLAYER.shotCooldown; player.ammo -= 1;
    if (audio) audio.shot();
    bullets.push({ x: player.x + Math.cos(aimAngle) * 22, y: player.y + Math.sin(aimAngle) * 22, angle: aimAngle, life: 0.6, speed: 900 });
    police.addCrime(1);
    return true;
  }
  function step(dt, peds, officers) {
    for (const b of bullets) {
      b.x += Math.cos(b.angle) * b.speed * dt; b.y += Math.sin(b.angle) * b.speed * dt; b.life -= dt;
      for (const t of [...peds.peds, ...officers]) {
        if (t.health <= 0) continue;
        const dx = t.x - b.x; const dy = t.y - b.y;
        if (dx * dx + dy * dy < 20 * 20) {
          t.health -= PLAYER.shotDamage; b.life = 0;
          world.addEffect('hit', t.x, t.y - 20, 'HIT');
          if (t.health <= 0) { world.state.kills += 1; world.state.score += 50; }
          break;
        }
      }
    }
    for (let i = bullets.length - 1; i >= 0; i -= 1) if (bullets[i].life <= 0) bullets.splice(i, 1);
  }
  return { bullets, toggleWeapon, punch, shoot, step, get weapon() { return weapon; } };
}
