# p5: physics and broadcast

**Route:** realism from how things move and how they are filmed, not from pixels. The fight is a real rigid-body simulation, so no two fights match. It is shot by simulated camera operators and passed through a broadcast image chain. Materials are solid PBR, not the focus.

**My honest score: 6.5/10 overall.** In motion and on impact frames it reads as TV footage at a glance, about 7.5. Held close-ups read as a good game asset from about 2015, about 4.5 (`shots/03-closeup.png`).

Run: serve `dist/` from anywhere. Params: `?seed=` (fight), `?shot=<seconds>` (freeze; seed defaults to 6), `?cam=wide|lowA|lowB|jib|bot|anvilbot` (force camera), `?zoom=` (fov multiplier), `?q=low|med|high`, `?bench=1` (physics only). Each still has its seed, time and camera printed bottom left.

## How it works

**Physics, fixed 120 Hz (`src/sim.ts`, no rendering code, also runs in Node).** Rapier 0.21 WASM.
- **Drive:** hand-written. Each wheel casts a ray, gets a spring-damper load, then a combined-slip tyre force at the contact. Each wheel has its own angular velocity, torque-speed curve and inertia, so wheelspin and skid-steer scrub are real outputs. Tyre smoke is triggered by measured slip.
- **Drum:** simulated as a state, not a rigid body: 0.42 kg m², 400 rad/s, about 34 kJ. Spinning 3.3 rad per step would defeat the solver. Its collider is real. Motor reaction torque and gyroscopic torque (`L x Omega`, scaled 0.85 for stability) are applied to the chassis, so turning hard really does lean the bot.
- **Hits:** triggered by real Rapier contacts at real contact points. Tooth bite depth comes from pre-solve closing speed. The impulse comes from effective masses at the contact, is applied to ANVIL at that point, and is reacted through the drum axle. The drum loses matching angular momentum.
- **Hammer:** a real body on a real revolute joint with limits, driven by equal and opposite torque, so swings throw ANVIL's chassis around.
- **Damage:** panels go from bolted, to hanging on a real hinge joint, to free rigid bodies. Wheels shear off and roll away. 26 pooled shards are real bodies. Sliding-steel sparks spawn at contact points along the slip direction.
- **AI:** both bots are behaviours. ANVIL steers on a 0.2 s old view of TORQUE and fires when TORQUE is in its strike box.

**TORQUE always wins, on purpose. This is the bias list:**
- Early strikes are capped (235, 300, 360, 420 N s), the finisher is 520 to 760.
- ANVIL's damage is scripted by that schedule, not structural.
- ANVIL cannot fire until TORQUE has landed first, slows down late on, and TORQUE's driver deliberately parks in the hammer zone once or twice so the hammer beat happens.
- Both bots get an invisible self-righting torque. The strike direction is blended towards a horizontal shove so knockback reads.
- Backstop: at 26 s a "breaker" KO fires whatever has happened.

**Soak, 60 seeds in Node: TORQUE won 60/60.** KO times span about 16 to 26 s. 56 were drum KOs and 4 used the breaker backstop. **In 9 of 60 the hammer never connected**, so that required beat is not guaranteed. Fix before shipping by keeping a vetted seed list. Seeds are deterministic: seed 3 gave the same KO time in Node, Chromium and WebKit. Rapier's docs claim cross-platform determinism for WASM, but my own code uses `Math.sin` and friends, so a real iPad could diverge from these results. That would change the fight, not the winner.

**Time-stateless replay.** Physics runs 1.15 s ahead of the picture and records poses. That lets the director see hits coming and makes replay and `?shot=` cheap. Sparks and smoke are closed-form functions of time in the vertex shader, so they rewind and go slow-mo without stored state.

**Broadcast (`src/director.ts`, `src/post.ts`).** Every operator is a control system, not a look-at: second-order pan/tilt with acceleration limits and under-damping (real overshoot), slew-limited zoom with punch-ins on impact, trailing focus that hunts after cuts and hits, and 1/f hand noise. Cameras: truss wide, two low cams behind the polycarbonate, a crane-style jib, rubber-mounted on-bot cams on both bots (barrel distortion, jello, RF drop-outs on hits). Rule-based cuts anticipate hits. Slow-mo replay of the biggest drum hit from a low tele chosen side-on to the hit line, then a winner shot. Image chain: 1/120 s shutter blur (object velocity pass plus depth reprojection, computed from a fixed previous pose so it is frame-rate independent), a circle-of-confusion blur from the operator's focus distance, rolling-shutter skew from pan rate, bloom with lens dirt, video tone curve, edge sharpening, Rec.709-style grade and sensor noise. Replay uses a shorter shutter, like a high-speed camera.

## Researched
- Rapier determinism: https://rapier.rs/docs/user_guides/javascript/determinism
- Gyroscopic effects on vertical spinners and design around them: https://runamok.tech/insanity/gyroscopiceffect.html , https://physicsforums.com/threads/contemplating-gyroscopic-forces-for-fighting-robot-weaponry.1050721
- Weapon energy and mass distribution: https://runamok.tech/AskAaron/weapon2.html
- Robot types and classes: https://makezine.com/article/technology/robotics/know-your-combat-robots-a-field-guide-to-competition-weight-classes-and-weapons/ , https://grabcad.com/tutorials/types-of-combat-bots
- Camera inertia in virtual cameras: https://sites.google.com/altarcreative.com/marketingcamera/foundational-features/interpolation-modifiers

Searches found nothing useful on tuning overshoot, focus hunting or rolling shutter, so those values are my own judgement from memory, not sourced. Drum figures are also my estimates, not from a real 250 lb build.

## Assets and licences
| Asset | Source | Licence |
|---|---|---|
| Floor colour, normal, rough, 2k (`metal_plate_02`) | https://polyhaven.com/a/metal_plate_02 | CC0 |
| Paint colour, normal, rough, 1k (`blue_metal_plate`), re-inked at load for each colour | https://polyhaven.com/a/blue_metal_plate | CC0 |
| Steel, polycarbonate wear, decals, smoke, lens dirt, tyre | generated at load | original |
| Rapier 3D compat 0.21.0 | npm `@dimforge/rapier3d-compat` | Apache-2.0 |
| three.js r186 | repo | MIT |

Bots, logos and arena are original. No real competitor or show branding.

## Measured (Apple M3 MacBook Air, Metal, machine shared with other prototype builds, so fps may read low)
| Metric | Value |
|---|---|
| fps, 1280x720, 4x MSAA, full fight, uncapped | 125 avg, p95 frame 15 ms, p99 23 ms, worst 96 ms |
| fps, 1600x900 (`q=med` caps at 810p) | 83 avg, p95 frame 26 ms, worst 665 ms (cause not found) |
| Draw calls | about 140 to 260 (includes shadow and velocity passes) |
| Triangles | about 245k to 325k per frame, same inclusion |
| Total download | 14 MB: JS 5.0 MB (1.83 MB gzipped), textures 8.6 MB |
| Rapier alone | 3.1 MB WASM, 4.3 MB when inlined as base64 in the compat build |
| Memory for fight recording | about 8.6 MB for 62 s |

## Physics CPU cost
Whole `step()` for seed 3, 30 s, physics only: Rapier plus my tyres, AI, contacts and recording.

| Engine | ms per step | p99 | init |
|---|---|---|---|
| Chromium, M3 | 0.14 | 0.4 | 47 ms |
| Chromium, 4x CPU throttle | 0.54 | 2.9 | 174 ms |
| **WebKit (Playwright), M3** | **0.36** | **2.0** | **109 ms** |

During the real, loaded, rendering run Chromium measured about 0.6 ms per step.

**iPad estimate, not measured.** WebKit on the M3 is the closest evidence: it is the Safari engine family, but desktop Playwright WebKit may differ from iPad Safari, including its WASM tiers. Assuming a recent iPad core is 0.6 to 0.8 of an M3 core and an older A12 about 0.4 (my recollection of benchmarks, not sourced), a step costs roughly 0.5 ms on a recent iPad and 1 ms on an old one. At 120 Hz that is about 6 to 12% of one core, or 1 to 2 ms of a 33 ms frame, with spikes to perhaps 5 ms on big hits. **Physics is viable on iPad and is not the bottleneck.** It runs on the main thread here. Moving it to a Worker would be easy, because the renderer only reads the recording.

## iPad rendering estimate, not measured
Rendering is the risk. Half-float 4x MSAA, a velocity pass and a 14-tap composite are all heavy on tile GPUs. I would guess 30 fps or better on a recent iPad at 720p with `q=low` (no MSAA), and that high quality will not hold 30. Expect some heat over a long session. WebGL half-float render targets and depth textures on Safari were not tested on a device.

## To production
- Test on an iPad first, then fix the worst pass. The likely wins are dropping MSAA, a half-res composite, or skipping the velocity pass.
- Move physics to a Worker. Add a vetted seed list. Precache the WASM and textures in the service worker.
- Integrate as a reward scene: a mount/dispose function, with `sim.ts` kept separate from rendering. Add a proper loading state. Bundle size matters less than memory on older iPads.
- Spend real modelling time on both bots, ideally with authored meshes. Rapier adds 1.8 MB gzipped to one game only if it is code-split.

## Weak points
- **Close-ups.** The bots are primitive-built, TORQUE's drum in particular reads as a banded roller, and fork faces blow out. Use real models if anyone will look closely.
- **Hit strength is half physics.** Contact timing, point and direction are real; magnitudes are capped by the bias list. Damage on TORQUE is only marks and smoke, with no bending or denting.
- Hammer connects in 85% of seeds, and 7% end on the breaker, which is an anticlimax.
- Smoke is faint against the dark walls. Floor marks can look like stripes up close. Stills can over-bloom sparks in tight shots.
- FIRE works, but with about 1 s of lag because of the lookahead, and it only triggers when TORQUE is circling with a charged drum.
- `shots/clip.webm` is the raw canvas, so it has no score bug, REPLAY tag or win caption. It was recorded while the machine was loaded (last reading about 31 fps). One 665 ms hitch at 900p is unexplained.
- A few low-camera angles can still clip a post.

## Files
`src/` sim, director, post, fx, bots, arena, textures, main. `tools/` soak (seed test), bench, fps, clip, shoot, verify. Verified from a sub-path with no external requests.
