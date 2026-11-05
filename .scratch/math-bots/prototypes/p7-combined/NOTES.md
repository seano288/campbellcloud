# P7: combined prototype

**Route:** P5's Rapier fight and broadcast direction, on P2's WebGPU frame, with P3's CC0 scans in KTX2 and P1's modelling methods, plus new structural armour damage.

**Honest realism score: 8/10 overall (my own judgement from stills).** Moving footage and impact or knockout frames are about 8, and the opening (`shots/01-faceoff.png`) is now about 8. Held still-frame close-ups of damage (`shots/03-closeup.png`, `06-axe-dent.png`, `11-torn-metal.png`) are about 7.5: heavy and dry rather than wet, but still soft at the edges of chips and gouges.

**Not tested on an iPad.** Every iPad statement here is an estimate.

Run: serve `dist/` from any static server. Params: `?seed=`, `?aim=x,y,z` (inspect camera aim, bot local), `?shot=<programme seconds>`, `?q=ipad|lite|webgl|cinema` (default `ipad`), `?off=mb,sparks,smoke,vol,ssr`, `?pr=`, `?cam=wide|lowA|lowB|jib|bot|anvilbot`, `?inspect=T|A,azimuth,elevation,distance,fov` (fixed camera on a bot), `?record`, `?bench`.

Shots use seed 7, except `06-axe-dent.png` (seed 28, chosen because the axe lands mid-deck). `03`, `06`, `07` and `11` use the inspect camera, and `03`, `06` and `11` turn effects off to judge the surface (`06` now also drops motion blur), so they are not what a viewer sees in the programme.

## What was combined

| Requirement | Result |
|---|---|
| Renderer (P2) | WebGPU lighting, volumetrics, per-object motion blur, SSR floor reflections, 30k compute sparks. Default is P2's `ipad` tier on every device. |
| Opening (new) | 0 to 1.7 s: low lens over TORQUE's shoulder, pushing in, so the bots stack in depth. TV-style overhead lights, with haze reduced to match. |
| Fight (P5) | Rapier at 120 Hz, AI ANVIL, seeded variation, simulated operators, cuts, slow-mo replay. Physics runs 1.15 s ahead of the picture. |
| Look (P3) | CC0 warehouse HDRI as backdrop and in the reflection probe. Scans in KTX2. |
| Modelling (P1) | P1's rounded, chamfered plates replace P2's plate builder across both bots. P1's weld beads, chevron tyres and toothed belt. TORQUE: blue `#0A3FB8` paint, orange `#FF6508`. |
| Damage (new) | See below. |
| Drum (new) | See below. |

**WebGL2 fallback** (no WebGPU, or `?q=webgl`): same fight, cameras, models, armour damage, drum and billboard smoke, 2.5k CPU sparks with the floor-mirror layer. It loses SSR, volumetric light and motion blur. `shots/08-webgl-fallback.png` shows it. Without motion blur, the picture reads as sharper and more game-like in motion.

## Armour damage: how it works

The biggest upgrade. All six earlier prototypes painted damage on or swapped to a pre-bent mesh.

1. **Real hit locations.** The sim transforms each Rapier contact point into plate coordinates and logs a scar: plate, position, strike direction, energy. Nothing is scripted to a spot. Note that the strength of each hit is still capped by the bias list below.
2. **Plates are tessellated meshes** at about 14 mm pitch, one posed group per plate, on a rigid body once loose. Bolts ride the plate through an anchor coordinate, and a bolt in a hole disappears with the metal.
3. **Two atlases per bot.** A half-float displacement atlas read in the vertex shader, so dents change the silhouette. An RGBA8 surface atlas holds paint loss, scored metal, scorch and holes.
4. **Stamps.** Drum strike: a broad smooth dish with up to three long straight folds, a shallow smooth trough and a score under each of the three tooth rows, spaced 13.5 cm as on the drum. Axe: chopped slot and dished crater. There is no small-scale noise in the height any more. Dented paint goes matte (roughness toward .8) with no film over it. Bright steel appears only in the gouges, which carry ploughed lines along the strike. Paint chips only in broken dashes along folds and at the crater lip. Strikes landing near earlier ones break through and tear, so damage accumulates where hits really fall.
5. **Stages.** A plate dents first. A second strike levers it off its bolts on the edge farthest from the blow, kinked, on a real hinge joint. The next rips it away with bolt holes pulled through its edges. Holes reveal modelled bays, batteries and cabling.
6. **Tears are still alpha cuts, not new topology,** but now read as torn: a petal-shaped jagged outline with cracks running from the two ends, a band of fresh bright steel at the edge (the alpha ramps wider than the cut and the shader lights that band), and tongues displaced with the strike, curling out downstream and folding in upstream. A ripped-off panel gets slots from each bolt hole out to the plate edge. Curl is vertex displacement on the 14 mm grid, so it is coarse.

**Cost and a bug worth knowing.** My first version stalled the main thread on every hit: up to 185 ms per stamp and 705 ms to rewind for replay, which fps averages hid. Now noise is a lookup table, and stamps are computed in slices of about 3 ms per frame during the 1.15 s lookahead, stored as small patches and copied in on the frame they land. Measured on the M3: worst slice 2 ms, rewind 0.2 ms, 4.1 MB of patches for one fight.

## The drum at speed

At 400 rad/s and 1/120 s shutter, the drum turns more than half a revolution per exposure, so no renderer can show it by rotating a mesh. P2 strobed, and P2's translucent shell read as glass. Here a shell marches the view ray through the tooth rows and computes the exact fraction of the shutter a tooth covers each point (tooth width convolved with shutter arc). The core is deterministic. Only the see-through rim is dithered, and TRAA resolves that. As the drum slows, the same maths narrows the smear into visible passing teeth, with no swap until the sharp mesh takes over below 42 rad/s. The drum material is now dark, rough turned steel with fine lathe rings and soft tooth bands, because the brighter lights turned the old one chalk white. The replay uses a 1/500 s shutter. The chassis also buzzes slightly with the out-of-balance drum.

This is an original derivation. I found no source for it, and I have no reference footage to check it against, only general shutter behaviour.

## The fight

**60 seeds, in Node, final build.** `sim.ts` was not touched in the look pass, and all figures re-ran identical:

| | Tuned on, seeds 1-60 | Held out, seeds 101-160 | P5 baseline, seeds 1-60 |
|---|---|---|---|
| TORQUE wins | 60/60 | 60/60 | 60/60 |
| Won by drum, no fallback | **60** | **60** | 56 |
| Needed the time-limit fallback | **0** | **0** | 4 |
| Count-out rule used | 0 | 0 | n/a |
| Fights with no hammer hit | 2 | 4 | 9 |
| Hammer swings that connected | 108/121 (89%) | 103/128 (80%) | not measured |
| KO time range | 15.0 to 27.1 s | 15.4 to 26.8 s | 16.3 to 26.0 s |

The held-out column is the fairer figure, because I tuned on seeds 1-60. An earlier iteration did hit the fallback once in the held-out set, and later changes removed it, so that column is no longer truly unseen. The fallback still exists at 29 s. The hammer beat is not guaranteed: 4 of 60 held-out fights have none. A vetted seed list would close that.

Seed 7 gave the same KO time (16.71 s) in Node and Chromium. WebKit was not compared for KO time on this build.

**Why the hammer missed before:** the swing's reaction torque was pitching the 97 kg box onto its back, so the arm was thrown off target. Also the fire check was fooled while ANVIL was airborne.

**TORQUE always wins, on purpose. The bias list:**
- Early strikes are capped (235, 300, 360, 420 N s). The finisher is 520 to 760.
- ANVIL's chassis takes only 42% of the swing reaction torque, and the arm is 9 kg.
- ANVIL gets one swing per drum hit TORQUE lands, plus a spare while TORQUE is in the zone.
- ANVIL's hammer fires only when the blade's projected landing point is on TORQUE's footprint.
- TORQUE's driver parks in the hammer zone to give ANVIL its beat.
- Both bots have invisible self-righting torque.
- The finale cannot begin before 15 s, which sets the minimum fight length.

## Measured

**Look pass (damage, lights, opening, drum), same machine, seed 7, about 28 s runs:**

| | Before | After |
|---|---|---|
| ipad 1180x820 viewport (1280x889) avg fps | 59.5 | 59.7 |
| ipad at iPad native viewport (2560x1779) avg fps / median ms | 45.9 / 21.6 | 45.1 / 22.1 |
| `01-faceoff` mean luma (0-255) | 32.9 | 76.3 |
| `02-impact` pixels with a channel at 250+ | 0.14% | 0% |
| `02-impact` mean luma | 70 | 62.2 |
| `dist/` | 24.8 MB | 24.8 MB (24,760 KB) |

The `worst ms` column in `bench.mjs` rose to 160 to 240 ms. Timestamping every frame of one fight showed that is the first frame at load. No frame during that fight took over 40 ms. Stamps also skip texels outside the tear ellipse early. The table below is the older build and was not re-measured, except for what is listed here. WebKit (Version/26.6 desktop) and the WebGL2 fallback were re-run with no errors.

Apple M3 MacBook Air, headed Chromium, Metal, load average 2 to 3, served from a sub-path. Display is 60 Hz, so a 16.7 ms median is the vsync cap and hides true cost. Draws and triangles include shadow passes and vary with the camera.

| Tier | Resolution | avg fps | median ms | p99 ms | worst ms | frames > 50 ms | draws | tris |
|---|---|---|---|---|---|---|---|---|
| **ipad, sustained 3 min** | 1280x889 | **59.9** | 16.7 (cap) | 18.5 | 100 | 4 of 10,816 | 324 | 1.5M |
| lite | 1003x697 | 59.5 | 16.7 (cap) | 18.5 | 88 | 3 | 170 | 0.8M |
| webgl fallback | 1280x889 | 58.6 | 16.7 (cap) | 18.4 | 272 | 4 | 245 | 1.1M |
| cinema | 1600x900 | 40.0 | 24.8 | 29.3 | 249 | 2 | 369 | 2.1M |
| ipad at iPad native | 2360x1640 | 45.6 | 22.3 | 27.6 | 107 | 4 | 318 | 1.5M |

- All but the 3-minute row are short runs of about 25 s. One earlier `lite` run measured 39.5 fps on an older build, then 56.6, so treat single short runs as noisy. P2 also reported large drift on this laptop.
- Physics plus programme: about 0.35 to 0.5 ms per rendered frame, Chromium.
- Load to first frame: about 0.9 to 1.2 s on the M3 with shaders cached in this session. A cold first run was not measured separately and P2 saw tens of seconds at worst.
- **WebKit (Playwright, Version/26.6 on macOS):** rendered the full WebGPU `ipad` tier with no errors (`shots/09-webkit-check.png`). fps not measured. This is desktop WebKit, not an iPad.
- `dist/` makes no off-host requests, checked from a sub-path. Offline PWA install was not tested.

**Download: 24.8 MB total, 17 files, under the 30 MB budget.** Textures 17.3 MB, JS 5.4 MB (2.0 MB gzipped; Rapier is most of it), HDRI 0.9 MB, transcoder 0.6 MB. Another 0.6 MB is a duplicate transcoder that vite also copied into `dist/assets`; removing it is a small saving. `shots/clip.webm` (11.3 MB, 29 s, stepped at 30 fps so it shows the look, not live smoothness) is a review artifact, not part of the build.

## How it would fare on an iPad (estimate)

Basis: the M3 numbers above and P2's reasoning, not a device.

- **M-series iPad:** likely a sustained 30 fps or better on `ipad` at about 1280x889. The M3 sits at the 60 Hz cap there, and at native resolution has 22 ms median, which leaves margin. Safari and thermals are unknown.
- **A-series iPad:** use `lite`. I would guess about 30 fps, with risk. 1.5M triangles a frame is about twice P2's count and a real concern on a smaller GPU. Halving the plate grid and leaving bolts out of shadows are the cheapest cuts.
- **Native 2360x1640:** do not use it on an iPad.
- **Memory (calculated, not measured):** about 46 MB of textures if transcoded to ASTC (P3's figure), about 11 MB of damage atlases, about 10 MB of livery with mips, plus G-buffer and post targets.
- **Stamping** costs about 3 ms per frame on the M3 only in the second before a hit, and would be slower on an iPad. The 1.15 s lookahead leaves room for that, but it is untested there.
- **First-run shader compile** is the biggest unknown. It needs a real loading screen that waits for it.
- Known risk from P2: a report of NaN dots with SSR plus TAA on iPad Safari in another engine. Test first. `?off=ssr` removes it.

## Reaching production

1. Run on the real iPad first: WebGPU availability, fps, thermals over 10 minutes, memory, cold compile time, SSR with TRAA.
2. Add automatic tier selection and a downshift. Tiers currently need a reload, and every device defaults to `ipad`.
3. Keep a vetted seed list, so each fight has a hammer hit.
4. Move the sim to a Worker. It already keeps no rendering state.
5. Tune the FIRE button. It works but has about 1 s of lag from the lookahead, and only acts when TORQUE is circling with a charged drum.
6. Integrate as a `robot-combat` stage in a game folder, with a mount and dispose function and `onDone`. Add `dist` to the service worker precache: at 25 MB this is far larger than the existing games.
7. Add `webglcontextlost` and WebGPU device-lost handling. Neither exists yet.
8. Add sound. None exists.

## Honest weak points

- **Dent close-ups are dry and heavy now but soft.** Folds can look a little like cloth, chip edges are blurry at the 2 mm atlas, and gouges are smooth grey strips rather than ploughed metal up close.
- **Tears read as torn in stills, but with limits.** The plate has no real thickness at a tear edge, curl is coarse, and part of a hole outline can still look smooth. A bright interior surface behind the hole on ANVIL shows flat grey.
- **Direct overhead light lifts ANVIL's red toward orange-pink** on up-facing plates in inspect close-ups. It stays deep red in programme shots.
- **TORQUE's deck goes lavender at grazing angles** in the bot cam (`02-impact.png`), a sheen from the overhead rig. Blue and orange are clear everywhere else.
- **Displaced plates can pass through what is behind them.** Inward dents are clamped to 5 cm, but the bays behind plates are not uniformly that deep, and hanging panels have simple box colliders that do not match the bent shape.
- **Hit strength is still half physics.** Timing, location and direction are real; magnitudes follow the bias list.
- **Plates only.** Frames, wheels, the drum and ANVIL's hammer take no structural damage. TORQUE's side slabs do not dent. Wheels only shear off at the finisher.
- **Drum:** better, but close up it is still a soft banded cylinder, with no visible teeth at speed and faint dither at the rim (`07-drum-speed.png`).
- **The belt does not run:** it is static geometry, even with the drum at full speed.
- **Smoke** is modest. Billboards can look like soft puffs in a still, and the plume is faint against the dark hall.
- **Floor** still shows some cloud-like patches of reflection in wide shots, and a few gouges are too clean.
- **Bot cam** is very wide. The impact flash no longer clips the deck, because it now sits 0.5 m above the hit, is about half as strong, and spark and grade highlights were lowered. ANVIL's top plate still flares hard.
- **Floor reflections** show a few bright SSR dots between the bots in the opening shot.
- **Polycarbonate walls** are subtle, and only the wide and jib cameras shoot through them. P5's low cameras had to move inside the wall, because P2's taller kick plate and posts blocked them.
- **The backdrop is a photo at infinity**, so parallax is slightly wrong, and it shows a bright window on some low angles.
- **Motion-blur heavy pans** can smear the whole frame, as a long lens does. `shots` at 18 s in seed 7 are soft.
- **Bolts on TORQUE's fork inner face and some body parts** do not ride dents.
- **Paint on ANVIL still reads a little too clean and saturated** before the fight starts.

## Assets and licences

All listed sources are CC0. Licence status is carried over from P3's records, which say each asset's source page was checked on 2026-11-04. I did not recheck them for this build.

| Asset | Used for | Author | Source |
|---|---|---|---|
| Empty Warehouse 01 (HDRI) | Backdrop, reflection probe | Sergej Majboroda | https://polyhaven.com/a/empty_warehouse_01 |
| Metal Plate 02 | Arena floor | Rob Tuytel | https://polyhaven.com/a/metal_plate_02 |
| Blue Metal Plate | Paint detail and chip mask | Rob Tuytel | https://polyhaven.com/a/blue_metal_plate |
| Rusty Metal Sheet | Bare steel, stripped metal in damage | Amal Kumar | https://polyhaven.com/a/rusty_metal_sheet |
| Old Tyre (normal map only) | Rubber micro-detail | MP | https://polyhaven.com/a/old_tyre |
| Scratches001, Scratches002 | Scratch masks | ambientCG | https://ambientcg.com/a/Scratches001, https://ambientcg.com/a/Scratches002 |
| Smear007 | Grime and haze | ambientCG | https://ambientcg.com/a/Smear007 |

Site-wide terms: https://polyhaven.com/license, https://docs.ambientcg.com/license/. P3's caution stands: the tyre texture has a faint moulded sidewall fragment, so check it before production. Only the normal map ships here.

Code: three.js r186 (MIT), Rapier 3D compat 0.21.0 (Apache-2.0), Basis transcoder bundled with three.js. Geometry, livery, damage and particle textures are original. Bots, names and numbers are original, with no real competitor or show branding.

## Research

Searches this session gave little on the two new topics, so most damage and drum decisions are my own judgement:

- Armour: general material facts only. No source described typical dent or gouge patterns. https://www.onlinemetals.com/en/combat-robotics-weapons-and-armor , https://runamok.tech/AskAaron/weapon.html , https://www.trine.edu/news/2024/combat-robot.aspx (armour fracture under perpendicular force)
- Shutter and rotation: frame timing causes the wagon-wheel effect, and shutter speed mainly sets blur. https://www.sciencebuddies.org/science-fair-projects/project-ideas/Photo_p026/photography-video/filming-the-wagon-wheel-effect
- TSL displacement: third-party pages only. It was confirmed by this build working on Metal in Chromium and WebKit. https://threejs.org/docs/
- three.js r186 source in `node_modules` for `KTX2Loader`, `TRAANode`, `NodeMaterial`.
- P1, P2, P3 and P5 notes and source.

I gathered no reference photos or footage.

## Files

`src/`: `sim.ts` (fight), `director.ts` (cameras), `damage.js` (atlases, stamps, patches), `drum.js`, `bots.js`, `kit.js`, `geo.ts`, `materials.js`, `arena.js`, `fx.js`, `sparks.js`, `post.js`, `main.js`.
`scripts/`: `soak.ts` (seed test), `scars.ts` (lists scars per seed), `trace.ts`, `bench.mjs`, `shot.mjs`, `clip.mjs`, `verify.mjs`, `check.mjs`, `live.mjs`, `b.sh`.

## Reproduce

From this folder: `npm install`, then `../../../../node_modules/.bin/vite build --config vite.config.mjs`. Soak: `../../../../node_modules/.bin/tsx scripts/soak.ts 60 1 q`. Serve with `node ../serve.mjs 5198`, then set `BASE=http://localhost:5198/p7-combined/dist/` for the scripts. `verify.mjs` and `live.mjs` hard-code port 5197, so change that first.
