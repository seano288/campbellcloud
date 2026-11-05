# P3: scanned assets (real-world captured data)

Run: serve `dist/` from any static server. `?shot=<seconds>` freezes the fight and sets `window.__ready`. Other switches: `?q=low`, `?pr=1`, `?auto=0`, `?cam=x,y,z,lx,ly,lz,fov&rel=T|A`.

## The technique in plain language

The theory: surfaces look photographic when the input is photographic. So nothing important is painted by hand or by a noise function.

- **Lighting and backdrop** come from a real photographed warehouse (a 4K HDRI). At load, a small camera at the arena centre captures the warehouse, the arena and its light panels into one reflection probe, so the metal reflects real surroundings. Three spotlights and an on-camera fill sit on top, as a TV rig would.
- **Surfaces** are real scanned plate. The floor is a scan of worn welded steel sheet. Bare armour is a scan of stained steel sheet. Paint is a scan of chipped blue steel: its hue is removed in the pipeline, leaving paint texture plus a real chip mask, so one scan paints blue, orange, red and black.
- **Geometry** is built by a script, in metres, as real parts: chamfered plates, hex bolts and cap screws, rippled weld beads, roller chains, sprockets, belts, a finned motor, hoses, an air tank behind the armour. UVs are in metres so scans keep a believable scale. Tyres are a real scanned tyre mesh.
- **A layered shader** decides where paint has gone. Each vertex carries baked ambient occlusion (ray-traced in Node with three-mesh-bvh, about 145k unique vertices) plus an edge-wear value. Chips land on plate edges, grime collects in crevices, and paint and livery share the same chip mask, so stencils wear away with the paint.
- **Livery** is logo-free original art in one atlas (TORQUE, ANVIL, 07, 13, hazard stripes), drawn as vectors with no font, applied through the same chip mask.
- **Damage** is live. Hit sites burn through paint in the shader, the armour panel is a real separate part that flies off on a baked rigid-body path, and it reveals modelled internals.
- **Effects**: sparks are about 2,000 stateless GPU streaks with a floor bounce, plus an impact flash light. Smoke is about 220 soft billboards. Both are pure functions of fight time, so `?shot` is exact.
- **Finish**: ACES tone mapping, half-res bloom, a floor reflection of the bots blurred by the scan's own roughness, slight lens fringing, vignette and broadcast-style grain. Cameras are long lens and low, some shooting through the polycarbonate.

## Pipeline (all in `tools/`, runs in Node from my folder)

1. `fetch-ph.mjs`, `fetch-acg.sh`: downloads into `dl/` (git-ignored). Treated as data; nothing in them is executed.
2. `process-hdri.mjs`: parses the Radiance `.hdr` and writes a log-encoded 4K JPEG (0.9 MB), decoded to linear HDR in a shader. Used instead of HDR KTX2, so it needs no HDR texture format support on the device.
3. `process-textures.mjs`: packs scans and encodes KTX2. Colour is ETC1S or UASTC; normal + roughness + AO share one RGBA UASTC texture with RDO and Zstd.
4. `process-maps.mjs`: livery atlas, polycarbonate wear mask, arena-unique floor damage map, tyre mesh.
5. `build-bots.mjs` (uses `geo.mjs`): bots and arena, AO bake, glTF-Transform weld and meshopt.

`gltf-transform`'s own `etc1s`/`uastc` commands need the system `ktx` tool, which the brief forbids installing, so encoding uses the `ktx2-encoder` npm package (Basis Universal compiled to wasm). The transcoder in `dist/basis` is three.js's own, bundled locally.

## Measured

Apple M3 MacBook Air, headed Chromium, Metal ANGLE, three r186, live build served from `/some/sub/path/`, 1600x900 at pixel ratio 1, 4x MSAA. The machine was shared with other prototype builds (load average 17 to 33 during the runs), so fps may read low.

| | Full tier | Low tier (`?q=low`: no floor reflection, one shadow) |
|---|---|---|
| fps, 1 s samples | about 52 average, 42 to 79 over one full loop, one 30 fps dip | about 69 average, 54 to 98 after start-up |
| Draw calls, all passes | 193 to 210 | 79 |
| Triangles, all passes | 1.32M to 1.38M | 0.52M |

- Numbers were taken just before two small fixes (tank orientation, drum core material), which do not change the counts.
- First-frame hitch: the low-tier run logged a 0.4 fps first sample, which is shader compile on first play.
- Geometry: TORQUE about 120k triangles before the two shadow passes and the reflection pass, ANVIL about 70k, arena about 150k.
- **Total download: 24.9 MB** across 24 files, so within the 30 MB budget. Textures 17.4 MB, GLB 4.6 MB, HDRI 0.9 MB, JS and transcoder 2.0 MB. About 0.6 MB of that is a duplicate transcoder that vite also copied into `dist/assets`.
- `shots/clip.webm`: the full 30 s loop at 1280x720, 24 fps, stepped frame by frame, so it shows the look but not live smoothness.
- No runtime network: `dist` loads everything by relative path. I confirmed it loads at a deep sub-path; I did not run it offline as an installed PWA.

## iPad estimate (not tested on a device)

Based only on the M3 numbers above and the frame's composition.

- A recent iPad with an M-series chip should hold 30 fps at about 1.3x pixel ratio in the full tier. That is an inference from about 52 fps on a loaded M3 at 1440k pixels, with no thermal evidence.
- An A-series iPad is the risk. 1.35M triangles a frame with four lights and a layered shader is heavy. I expect the low tier at about 0.8 to 1.0 pixel ratio. The app steps resolution down then drops to the low tier by itself, but that governor has only been exercised through its code path, not on a slow device.
- Texture memory should be about 46 MB if transcoded to ASTC 4x4 (calculated, not measured), plus about 8 MB for the decoded HDRI target, which could be freed after load.
- Known hazard from three.js discussion: alpha textures on older iPad GPUs can fall back badly with ETC1S. The atlas uses UASTC for this reason.
- The first shader compile will be a visible stall on iPad; it needs a loading screen that waits for it.

## What it would take to reach production

- Reduce triangles: plate tessellation is mostly there to carry baked AO, and hubs, chains and truss could be simplified or LOD'd. Halving the shadow caster mesh is the cheapest win.
- Add real per-object motion blur or at least a better drum: this is the largest gap in motion.
- Replace the drum-at-speed stand-in, add more bot-side damage states, and give TORQUE its own scars on the drum.
- Tune on a real iPad, then fix quality tiers by device rather than by fps.
- Integration: move `src/*` into a game folder as a `robot-combat` stage module taking a fight script and an `onDone` callback. Add `dist` assets to the service worker precache (25 MB is much more than existing games). Run `tools/` as a manual asset step, committing only outputs.
- Add KTX2 and GLB MIME types where the host needs them. Handle `webglcontextlost`, which this prototype does not.

## Honest weak points

- **My judgment: about 6.5/10 real.** The impact frames and the floor can pass as footage for a moment at video size. They do not pass as a photo when paused.
- **Bots read as a careful CG model, more than the arena does.** Paint is too even and too saturated, and panels are too flat. A real bot has dents and bent plate; scans give surface, not deformation. This is the route's main limit: every plate is still perfectly straight.
- **Drum at speed is a stand-in**: a plain turned cylinder with bands, visibly CG in `04-ko.png`.
- **No motion blur** except on sparks. Moving wheels and bots are too crisp, which is the main giveaway in the clip.
- **Damage scars are soft-edged**, closer to burns than tears, and impact on hubs can overexpose from the flash light.
- **Flat lighting on vertical faces**: the on-camera fill is a cheat and shows on close shots.
- **The backdrop is dim and static**, and the HDRI is at infinity, so parallax is slightly wrong on long moves.
- **Choreography is keyframed**, with no contact solver. Bots briefly clip, and ANVIL's KO landing is scripted. Tyres do not deform.
- **Close-up texture limit**: at 2K, scans go soft under about 20 cm framing. ETC1S blocks show on the floor at extreme close range.
- **Only one scanned prop was used** (the tyre). I looked at Poly Haven's tool cart, welding cart and lamps, but left them out: the background stayed dark enough that they would have spent budget for little gain.
- **Not every map is a real scan.** See the table: the ambientCG masks are procedural or approximated. The HDRI and all four main Poly Haven surfaces are real captures per their listings, except I did not separately confirm capture method for each one.

## Assets and licences

Licence checked on each asset's source page on 2026-11-04.

| Asset | Used for | Author | Licence | Source |
|---|---|---|---|---|
| Empty Warehouse 01 (HDRI, 4K) | Backdrop, image-based light | Sergej Majboroda | CC0 | https://polyhaven.com/a/empty_warehouse_01 |
| Metal Plate 02 (2K) | Arena floor | Rob Tuytel | CC0 | https://polyhaven.com/a/metal_plate_02 |
| Blue Metal Plate (2K) | Paint layer and chip mask, all liveries | Rob Tuytel | CC0 | https://polyhaven.com/a/blue_metal_plate |
| Rusty Metal Sheet (2K) | Bare steel | Amal Kumar | CC0 | https://polyhaven.com/a/rusty_metal_sheet |
| Hangar Concrete Floor (1K) | Floor outside the arena | Dimitrios Savva | CC0 | https://polyhaven.com/a/hangar_concrete_floor |
| Old Tyre (model, 2K) | All tyres, plus rubber texture for hoses and belts | MP | CC0 | https://polyhaven.com/a/old_tyre |
| Scratches001, Scratches002 | Fine scratch masks. Page lists technique as procedural, not a scan | ambientCG | CC0 | https://ambientcg.com/a/Scratches001, https://ambientcg.com/a/Scratches002 |
| Smear007 | Polycarbonate haze. Page lists technique as approximation | ambientCG | CC0 | https://ambientcg.com/a/Smear007 |

Site-wide: Poly Haven https://polyhaven.com/license, ambientCG https://docs.ambientcg.com/license/.

Things to check before shipping:

- Poly Haven's CC0 covers the assets, not its site. Its site terms restrict scraping, and its two API documents conflict on terms (https://polyhaven.com/our-api against https://github.com/Poly-Haven/Public-API). I made a small number of catalogue and download requests with an identifying User-Agent to fetch these files. The game uses no Poly Haven API at runtime.
- The tyre texture has a small, faint moulded sidewall fragment. It is mirrored and unreadable in renders, and the page names no brand, but check it at full resolution before production.
- Code: three.js MIT; `ktx2-encoder`, `three-mesh-bvh` MIT (pipeline only). Basis transcoder ships with three.js.

Livery, geometry, floor damage map and particle textures are original work for this prototype. No real competitor's robot, show name, logo or arena branding is used.

## Research

Prior repo notes in `.scratch/airplane-clock/research/rendering-*.md` were used for r186 specifics (PCFSoftShadowMap removal, PMREM, budget figures) and not repeated here.

- Materials: AR500 as the usual heavyweight armour and weapon steel, Grade 5 titanium, UHMW cheeks beside drums. https://www.onlinemetals.com/en/combat-robotics-weapons-and-armor, https://www.interstateplastics.com/combat-robotics-utilize-uhmw-to-shield-internal-systems-from-damage
- Drum construction: https://bshin100.github.io/Beetleweight-Combat-Robot, https://makezine.com/article/technology/robotics/know-your-combat-robots-a-field-guide-to-competition-weight-classes-and-weapons/
- Arena construction: welded steel floors and polycarbonate walls, 1 inch plus for heavier events. https://sparc.tools/SPARC_Arena_Construction_Best_Practices_v1.1.pdf
- KTX2 on iOS: UASTC transcodes more safely than ETC1S with alpha on some devices. https://github.com/mrdoob/three.js/pull/19846, https://discourse.threejs.org/t/basis-textures-with-alpha-appearing-fully-black-and-white-on-some-ipads-and-older-mobile-devices-when-rgb-pvrtc-4bppv1-format-is-used/22575
- Gap: I found no primary source on weld practice, heavyweight chain layouts or the TV lighting setup on real shows. Those details are my own judgment, not sourced.
- Encoder: https://github.com/gz65555/ktx2-encoder
