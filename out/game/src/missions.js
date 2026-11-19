// Story missions for Luz Marín. Four chapters, each with a go-to waypoint,
// an action, and a payoff. Missions run in order; finishing one unlocks the
// next, pays cash, and saves. Between missions the city is free roam: cash
// pickups, taxi fares and joyriding. A mission marker is a gold diamond on
// the map and on the minimap, with a distance readout on the HUD.
import { ECONOMY } from './config.js';

export const MISSIONS = [
  {
    id: 1, title: 'First Run', giver: 'Rosa at the Marina',
    brief: 'Rosa needs a parcel across town before the tide turns. Grab any car, drive to the gold marker in Downtown, and do not attract the police.',
    target: { x: 2200, y: 400, label: 'Downtown drop-off' }, pay: ECONOMY.missionPay[0], needsCar: true,
  },
  {
    id: 2, title: 'Repo Run', giver: 'Tomas the mechanic',
    brief: 'A debtor skipped town in a Sunrunner parked in Palm Heights. Steal it back — E next to the car — and bring it to Tomas in the Harbor.',
    target: { x: 1400, y: 1500, label: 'Tomas garage, Harbor' }, pay: ECONOMY.missionPay[1], needsCar: true,
  },
  {
    id: 3, title: 'Harbor Lights', giver: 'Captain Ilya',
    brief: 'Smugglers watch the Harbor. Slip in on foot, punch or scare off the two lookouts by the crates, then reach the lighthouse marker.',
    target: { x: 2600, y: 1500, label: 'Harbor lighthouse' }, pay: ECONOMY.missionPay[2], needsCar: false,
  },
  {
    id: 4, title: 'Kingpin of Solmar', giver: 'Luz herself',
    brief: 'Vargas, the man who framed Luz, waits at the Downtown tower with his crew. Fight through, reach the tower roof marker, and take Solmar Bay back.',
    target: { x: 2800, y: 800, label: 'Vargas tower, Downtown' }, pay: ECONOMY.missionPay[3], needsCar: false,
  },
];

export function createMissions(world) {
  let index = 0; let active = null; let done = 0; let lookoutDown = 0;
  function current() { return index < MISSIONS.length ? MISSIONS[index] : null; }
  function start() { active = current(); lookoutDown = 0; if (active) world.toast(`Mission ${active.id}: ${active.title} — ${active.giver}`); return active; }
  function complete() {
    if (!active) return 0;
    const pay = active.pay; world.state.player.cash += pay; world.state.missionsDone += 1; done += 1;
    world.toast(`Mission complete: ${active.title} — +$${pay}`);
    world.addEffect('cash', world.state.player.x, world.state.player.y - 30, `+$${pay}`);
    index += 1; active = current(); lookoutDown = 0;
    if (active) world.toast(`New mission: ${active.title} — ${active.giver}`);
    return pay;
  }
  function check(player, playerCar) {
    if (!active) return null;
    const px = playerCar ? playerCar.x : player.x; const py = playerCar ? playerCar.y : player.y;
    const dx = px - active.target.x; const dy = py - active.target.y;
    if (dx * dx + dy * dy < 90 * 90) {
      if (active.id === 3 && lookoutDown < 2) return 'lookouts';
      return 'done';
    }
    return null;
  }
  function markLookoutDown() { lookoutDown += 1; }
  // Restore a save: advance past finished missions without paying again.
  function skipTo(savedIndex) {
    index = Math.min(savedIndex, MISSIONS.length); done = index; active = current(); lookoutDown = 0;
    if (active) world.toast(`Mission ${active.id}: ${active.title} — ${active.giver}`);
  }
  return { current, start, complete, check, markLookoutDown, skipTo, get index() { return index; }, get done() { return done; }, get active() { return active; }, get lookoutDown() { return lookoutDown; } };
}
