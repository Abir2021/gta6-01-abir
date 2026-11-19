// Keyboard + mouse input for Solmar Bay. WASD / arrows move and drive, Shift
// runs, E enters or steals a car, Space punches or fires, Q swaps weapon,
// M mutes, P / Esc pauses, Enter confirms. Held keys are a live set; one-shot
// presses are queued as flags and taken once, so a press between frames is
// never lost or counted twice. Mouse aim: the pointer steers the player's
// facing on foot and the shot direction.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_ATTACK = 8;
export const ACTION_WEAPON = 16;
export const ACTION_MUTE = 32;

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let mouseX = 0; let mouseY = 0;
  const oneShot = new Map([
    ['Space', ACTION_ATTACK], ['Enter', ACTION_CONFIRM], ['KeyE', ACTION_ENTER],
    ['KeyQ', ACTION_WEAPON], ['KeyM', ACTION_MUTE], ['KeyP', ACTION_PAUSE], ['Escape', ACTION_PAUSE],
  ]);
  window.addEventListener('keydown', (event) => {
    if (oneShot.has(event.code)) { if (!event.repeat) actions |= oneShot.get(event.code); event.preventDefault(); return; }
    held.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => { held.delete(event.code); });
  window.addEventListener('blur', () => { held.clear(); });
  canvas.addEventListener('pointermove', (event) => { const r = canvas.getBoundingClientRect(); mouseX = event.clientX - r.left; mouseY = event.clientY - r.top; });
  canvas.addEventListener('pointerdown', (event) => {
    const r = canvas.getBoundingClientRect(); mouseX = event.clientX - r.left; mouseY = event.clientY - r.top;
    actions |= ACTION_ATTACK;
  });
  function axis(neg, pos) { return (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0); }
  return {
    moveX() { return axis('ArrowLeft', 'ArrowRight') || axis('KeyA', 'KeyD'); },
    moveY() { return axis('ArrowUp', 'ArrowDown') || axis('KeyW', 'KeyS'); },
    driveX() { return axis('ArrowLeft', 'ArrowRight') || axis('KeyA', 'KeyD'); },
    driveY() { return axis('ArrowUp', 'ArrowDown') || axis('KeyW', 'KeyS'); },
    running() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    mouse() { return { x: mouseX, y: mouseY }; },
    takeActions() { const taken = actions; actions = 0; return taken; },
  };
}
