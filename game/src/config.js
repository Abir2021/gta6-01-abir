// Solmar Bay — tuning, palette and constants. One place for every number the
// open world balances on, so a fix here retunes the whole game at once.
export const WORLD = { width: 3200, height: 2400, road: 96, block: 304 };
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SAVE_KEY = 'solmar-bay.save.v1';
export const BEST_KEY = 'solmar-bay.best.v1';
export const PLAYER = {
  radius: 14, walkSpeed: 210, runSpeed: 330, health: 100,
  punchDamage: 34, punchRange: 46, punchArc: 1.1, punchCooldown: 0.38,
  shotDamage: 26, shotRange: 420, shotCooldown: 0.28, ammoStart: 24,
};
export const CAR = {
  accel: 520, brake: 760, reverse: 260, maxSpeed: 560, maxReverse: 180,
  turn: 2.6, grip: 3.2, length: 54, width: 26, health: 100,
};
export const WANTED = { decay: 0.045, perCrime: 1, max: 5, bustRadius: 26 };
export const ECONOMY = { startCash: 120, missionPay: [450, 700, 1100, 1800], farePay: 90, pickupPay: 60 };
export const PALETTE = {
  sky: '#ffd9a0', sea: '#2e8fa8', sand: '#f2d8a0', grass: '#7fb069',
  park: '#6da85e', road: '#3a3f4a', roadLine: '#e8d44d', sidewalk: '#b9b3a4',
  building: '#e8b4a0', building2: '#c9a7d8', building3: '#a8c8e0', building4: '#f0c98a',
  roof: '#8a5a44', marina: '#4a7a96', text: '#fff7e8', muted: '#ffe9c4',
  panel: 'rgba(16,20,32,0.82)', accent: '#ffb703', danger: '#ef476f',
  police: '#2b6cb0', player: '#ff6b35', hudBg: 'rgba(10,14,24,0.72)',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const DISTRICTS = [
  { name: 'Marina', x: 0, y: 0, w: 800, h: 600, color: '#4a7a96' },
  { name: 'Old Town', x: 800, y: 0, w: 800, h: 600, color: '#e8b4a0' },
  { name: 'Downtown', x: 1600, y: 0, w: 1600, h: 1200, color: '#a8c8e0' },
  { name: 'Palm Heights', x: 0, y: 600, w: 800, h: 1200, color: '#f0c98a' },
  { name: 'Harbor', x: 800, y: 1200, w: 1600, h: 600, color: '#7fb069' },
  { name: 'Solmar Beach', x: 0, y: 1800, w: 3200, h: 600, color: '#f2d8a0' },
];
export const CAR_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#9b5de5', '#e8e8e8', '#222831'];
export const CAR_NAMES = ['Comet', 'Sunrunner', 'Marlin GT', 'Palm Cruiser', 'Harbor Van', 'Dune Buggy', 'Taxi Sol', 'Patrol Interceptor'];
