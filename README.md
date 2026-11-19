[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Abir2021/gta6-01-abir/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/Abir2021/gta6-01-abir/reward.svg)](https://make.fun/bounty/gta6-01)

# Solmar Bay — an open-world crime game

A complete, original open-world crime game in the spirit of GTA 6, built for
the [gta6-01 bounty on make.fun](https://make.fun/bounty/gta6-01). No Rockstar
names, characters, map or art — this is our own sun-soaked coastal city,
**Solmar Bay**, with its own hero, story and streets.

You are **Luz Marín**, an ex-courier back in town because the city owes her.
Explore Solmar Bay on foot and by car, steal cars, run four story missions,
dodge the Solmar Bay police as your wanted level climbs, fight with fists
and a pistol, collect street cash, and take the city back from Vargas.

## How to play

Serve `game/` with any static server — `node serve.ts`, then open
http://localhost:8080 — and play in a desktop browser. No build step, no
network requests, no accounts.

- **WASD / arrows** — move on foot, drive a car (W accelerate, S brake/reverse, A/D steer)
- **Shift** — run
- **E** — steal / enter a car, exit a car
- **Space** — punch, or fire the pistol (mouse aims)
- **Q** — swap fists / pistol
- **M** — mute sound (all sound is generated WebAudio, no files)
- **P / Esc** — pause

## The world

- A 3200×2400 city: Marina, Old Town, Downtown, Palm Heights, Harbor and Solmar Beach, with roads, traffic, pedestrians, a park, a marina and the sea
- **4 story missions** — First Run, Repo Run, Harbor Lights, Kingpin of Solmar — with gold waypoint markers, distance readout and cash payouts
- **Wanted level 0–5 stars** — crime brings patrol cars and foot officers; getting busted costs cash
- **Traffic and pedestrians** who drive the road grid, stroll the sidewalks and flee from trouble
- **HUD with a live minimap** — roads, traffic, police flashes, mission diamond, cash, health, stars, clock and district name
- **Progression** — cash, score, mission saves in localStorage; continue restores your save

## Structure

Source is split into files with one clear job each under `game/src/`:
`config.js` tuning, `random.js` seeded RNG, `world.js` city geometry,
`vehicles.js` traffic and driving, `pedestrians.js` walkers, `police.js`
wanted level and pursuit, `missions.js` story, `combat.js` fists and pistol,
`audio.js` generated sound, `hud.js` HUD and minimap, `input.js` keyboard
and mouse, `render.js` drawing, `main.js` loop and save, `shots.js`
screenshot scenes.

## License

MIT — see [LICENSE](LICENSE).
