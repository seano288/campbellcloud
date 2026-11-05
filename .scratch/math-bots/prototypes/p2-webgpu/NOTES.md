# P2: next-generation real-time rendering (three.js r186 WebGPU)

**Verdict:** realistic stills and motion at real-time rates on an M3 MacBook Air. Honest realism score: **7/10** (impact and KO frames about 7.5, the close-up about 6.5). It reads as footage of a real machine in dim TV light, until you study the models, which are still clean cut plate with no dents.
**Not tested on an iPad.** Every iPad statement below is an estimate unless it says otherwise.

## Technique, in plain language
Everything is generated in code at load: geometry, the fight and the floor wear. The only assets are 11 CC0 texture scans.

- **Bots:** built from individual bevelled plates, about 400 socket-head bolts, rippled weld beads, chain links, hoses and cables, merged per material. Each vertex stores how "edge-like" it is, and that drives wear.
- **Materials:** bare steel is dark mill scale with bright metal only where a scanned wear mask, scratches or a struck edge exposes it. This was the biggest single realism gain. Powder coat is paint, a primer halo, then bare steel in the chips, with grease on top.
- **Floor:** plates with seams, plus a 12 x 12 m wear map baked at load (scorch, tyre rubber, gouges, derived normals).
- **Fight:** a pure function of time, so `?shot=` is reproducible and fps cannot change the outcome. 30 s, 10 TV-style camera shots with handheld noise and impact shake. TORQUE always wins.
- **Frame:** a G-buffer pass, then SSGI or GTAO, SSR on the steel, raymarched volumetric light and smoke at low resolution, TRAA, sharpen, per-object motion blur, depth of field, compute sparks, bloom, then a grade in display space.
- **Sparks:** a WebGPU compute shader with gravity, drag, and floor and wall bounces, drawn as streaks over one shutter interval. Capacity 60k (cinema) or 30k (ipad); about 39k are emitted across the fight (calculated, peak alive not measured).

URL parameters: `?q=cinema|ipad|lite|webgl`, `?off=ssgi,ssr,vol,dof,mb,traa,bloom,sparks`, `?pr=`, `?shot=<seconds>`, `?record`, `?bench`. iPads select `ipad` automatically; a browser without WebGPU falls to `webgl`.

## Quality tiers: what was cut to hold 30 fps
| | cinema | ipad | lite (A-series) | webgl (fallback) |
|---|---|---|---|---|
| Internal res (at 1180x820 CSS) | 1600x900 test view | 1280x889 | 1003x697 | 1280x889 |
| Indirect light | SSGI | GTAO half-res | GTAO half-res | GTAO half-res |
| SSR | half-res, q .55 | .4-res, q .3 | off | off |
| Volumetrics | 20 steps, 1/3 res | 10 steps, 1/4 res | 8 steps, 1/5 res | off |
| TRAA + sharpen | yes | yes | yes | yes |
| Motion blur | 12 samples | 8 samples | off | off |
| Depth of field | yes | off | off | off |
| Shadow lights | 4 @ 2048 | 2 @ 1024 | 1 @ 1024 | 2 @ 1024 |
| Sparks | 60k GPU | 30k GPU | 12k GPU | 2.5k CPU |

**WebGL2 fallback:** the same scene, materials and fight, but CPU sparks, and no SSGI, SSR, volumetrics, motion blur or DoF. So there is no smoke and there are no light shafts. Measured working; close-ups hold up well.

## Measured numbers
Hardware: Apple M3 MacBook Air, headed Chromium, Metal, served statically from `dist/` on a sub-path. Display is 60 Hz, so a 16.7 ms median means "capped by vsync" and hides the true cost.

| Run | Resolution | avg fps | median ms | p95 ms | draws | tris |
|---|---|---|---|---|---|---|
| ipad, **sustained 3 min** | 1280x889 | **53.7** | 16.7 (cap) | 39.3 | 255 | 742k |
| ipad, 28 s | 1280x889 | 55.9 | 16.7 (cap) | 23.5 | 255 | 742k |
| webgl | 1280x889 | 52.5 | 18.1 | 24.3 | 298 | 711k |
| lite | 1003x697 | 44.1 | 19.6 | 32.3 | 209 | 513k |
| ipad at iPad native | 2360x1640 | 28.6 | 34.9 | 47.1 | 273 | 735k |
| cinema | 1600x900 | 21 to 26 | 37 to 46 | 60 to 69 | 465 | 1.32M |
| cinema, SSGI off | 1600x900 | 31.2 | 31.9 | 39.1 | 465 | 1.32M |

Draw and triangle counts include shadow passes, so unique scene geometry is lower. Peak counts during the fight reach about 503 draws and 1.41M triangles.

**How far to trust these:**
- **Drift is large.** The same cinema config measured 37 ms, then 46 ms four minutes later, on a machine that was mostly idle. Other prototypes were not running, so a fanless laptop throttling is my suspicion, not a finding: `pmset` recorded no thermal warnings, which does not prove there were none.
- **Only SSGI has a trustworthy cost:** about 12 to 15 ms at 1600x900 in every session, about a third of the frame. It is the one cut that clearly matters.
- **All smaller per-effect numbers were discarded.** Runs showed removing motion blur, TRAA or GTAO getting *slower*, and `lite` measuring slower than `ipad`, which is noise. SSR, volumetrics, DoF, motion blur, bloom and sparks each cost less than the drift (under about 5 ms), but I cannot rank them.
- **GPU timestamps were tried and rejected.** They returned an impossible 703 ms per frame, because they aggregate unresolved frames.
- **Earlier runs on a loaded machine** (load average above 100) gave ipad 51.7 fps and cinema 27.4 fps.

**Download:** `dist/` 13 MB total. JS 1.0 MB (285 KB gzipped), textures 12.4 MB. Well under the 30 MB budget. `shots/clip.webm` (14 MB, VP9, deterministic 30 fps) is a review artifact and not part of the build.

## WebGPU on iPad: current state
- **Shipping:** WebKit's own notes say WebGPU ships in Safari 26 for iOS, iPadOS, macOS and visionOS. A WebKit Bugzilla comment says `navigator.gpu` requires OS 26 or later, so this is gated by OS. I found no chip list. **Older iPadOS gets WebGL2**, so check the actual iPad's version.
- **Safari 27** adds WGSL `clip_distances`. The notes list no iPad-specific WebGPU limits, but I read only the first 100k of 147k characters of that post.
- **Playwright WebKit (tested):** Version/26.6 on macOS exposes `navigator.gpu`, and the full cinema tier rendered with no errors, matching Chromium's look. Reported limits: `maxColorAttachmentBytesPerSample` 64, `maxStorageBuffersPerShaderStage` 44, `maxSampledTexturesPerShaderStage` 44, `maxTextureDimension2D` 16384, `maxBufferSize` about 2 GB. **These are this Mac's values, not an iPad's.** fps was not measured under WebKit.
- **G-buffer limit hit in practice:** WebGPU's default attachment budget is 32 bytes per sample, and five RGBA targets cost 40 and failed pipeline creation. This prototype uses `rg16float` velocity and `rg8unorm` metal/roughness (30 bytes), so it needs no raised limit. The cost figures come from Dawn's error and from what passed; I could not reach that table in the spec text.
- **web3dsurvey** suggests iOS reports at least 8 storage buffers, with some at 44. Sample size is not given and it is not tied to an OS version. This prototype uses few.
- **Known risk, secondary source:** a Babylon.js forum report describes green and black dots from NaN values when SSR and TAA run together on iPad Safari and Android, not on desktop. Different engine, same effect pair. Test this first on a real iPad. `ssr` can be turned off without losing much.

## How it would fare on an iPad (estimate)
Basis: iPad Air and Pro with M-series chips have a GPU of the same class as this M3; A-series iPads have about half the GPU cores. That comes from memory: Geekbench's pages returned 403, so I have no verified scores. Safari may also perform differently from Chromium.

- **M-series iPad, `ipad` tier:** likely a sustained 30 fps or better. The M3 holds about 54 fps at the same resolution. The uncapped 35 ms at 2360x1640 scales to roughly 12 to 17 ms here, which leaves margin for Safari and thermals.
- **A16 or A14 iPad:** `ipad` tier about 25 to 40 ms, so borderline. Use `lite`. Note `lite` is untuned and its measured number above is noise.
- **Native 2360x1640:** do not use it. This M3 only just reaches 28.6 fps.
- **Memory (calculated, not measured):** about 66 MB of uncompressed textures plus the G-buffer and post targets. Safari's real limit on an iPad is unknown.
- **First-run shader compile:** took tens of seconds at worst on a loaded desktop, and one page load exceeded 30 s. On an iPad this needs a loading screen and will be a real risk.

## Reaching production
1. Run on the real iPad first: confirm WebGPU, fps, thermals over 10 minutes, memory, compile time and SSR+TRAA artifacts.
2. Add automatic tier selection plus a downshift when fps stays under 28. Tiers currently need a reload.
3. Convert textures to KTX2/ASTC. WebGPU's ASTC feature is present on this WebKit.
4. Add dents, torn metal, and real damage states. Replace some procedural parts with authored models. Add the FIRE button, which is not built.
5. Move this into `src/<game>/` behind the existing stage interface, keep three.js as WebGPU only in that game's chunk, precache `dist` in the service worker, and pause rendering when hidden.
6. Consider baking the fight with the `cinema` tier as a fallback video for devices that cannot run it. The deterministic recorder already exists.

## Honest weak points
- **Models are cleaner than the materials.** No dents, bent plate or torn edges; the hammer strike leaves no mark on TORQUE, and TORQUE takes no visible damage.
- **Motion is keyframed, not simulated.** Reactions are springs, and TORQUE pitches up more than 250 lb should.
- **Drum spin strobes.** It rotates below real speed. A translucent blur shell looked like a glass barrel, so it is switched off, but the mesh is still in the code.
- **Smoke only adds light**, so it cannot darken what is behind it. Thick black smoke is not possible with this model.
- **SSR is screen-space:** reflections vanish at frame edges and sparks are not reflected.
- **SSGI is cinema only,** so the headline WebGPU feature is cut on the iPad. The `ipad` tier looks close to cinema anyway, and the WebGL2 close-up is close too. WebGPU's real advantage here is volumetrics, SSR and motion blur.
- **More sparks looked worse.** 16,000 in a burst was a white-out; about 2,000 plus a sustained fountain looks far better. "Tens of thousands" is not the benefit, and the compute ceiling was not stress-tested.
- **API churn:** `three/webgpu` is still described by its own manual as experimental, and post nodes have changed across recent releases.
- **Faceoff frame is sparse:** the truss is only faint behind the lamps, and shafts are subtle. `04-ko` has a slightly soft ANVIL.
- **Polycarbonate walls** are subtle, and only one camera shoots through them.

## Assets and licences (all CC0, 11 JPGs, 12.4 MB)
| File | Source | Licence |
|---|---|---|
| `steel_color/rough/normal` | ambientCG Metal009 https://ambientcg.com/a/Metal009 | CC0 |
| `chip_mask`, `chip_normal` | ambientCG PaintedMetal004 https://ambientcg.com/a/PaintedMetal004 | CC0 |
| `rubber_normal` | ambientCG Rubber004 https://ambientcg.com/a/Rubber004 | CC0 |
| `scratches` | ambientCG Scratches001 https://ambientcg.com/a/Scratches001 | CC0 |
| `smear` | ambientCG Smear007 https://ambientcg.com/a/Smear007 | CC0 |
| `floor_color/rough/normal` | Poly Haven metal_plate_02 https://polyhaven.com/a/metal_plate_02 | CC0 |

Downscaled and re-encoded with `sips`. Licences are from the sites' general CC0 policies; I did not open each asset's page. No third-party code beyond three.js r186 (MIT). Bots, names and stencils are original.

## Sources
Fetched and read:
- WebKit, Safari 27.0 features: https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- WebGPU spec (default storage buffers = 8): https://www.w3.org/TR/webgpu/
- web3dsurvey, iOS limits: https://web3dsurvey.com/webgpu/limits/maxStorageBuffersPerShaderStage/platform/iOS
- three.js r186 example sources (`webgpu_postprocessing_ssgi`, `_ssr`, `_motion_blur`, `_dof`, `webgpu_volume_lighting`, `webgpu_compute_particles`): https://github.com/mrdoob/three.js/tree/r186/examples
- three.js r186 source in `node_modules`, including `VelocityNode.js`, `VolumetricLightingModel.js`, `SSGINode.js`, `SSRNode.js`
- Repo: `.scratch/airplane-clock/research/rendering-realism.md`

Search summaries only, not opened:
- WebKit Bugzilla on OS requirement: https://bugs.webkit.org/show_bug.cgi?id=299237
- three.js WebGPU manual: https://threejs.org/manual/en/webgpurenderer.html
- Babylon.js SSR/TAA mobile report: https://forum.babylonjs.com/t/ssr-webgpu-on-mobile-nan-inf-artifacts-accumulate-in-taa-history-over-time-analysis-working-workaround-no-playground-yet/62975
- Apple Metal tables: https://developer.apple.com/metal/capabilities/
- Combat robot materials (AR500, titanium, UHMW): https://www.onlinemetals.com/en/combat-robotics-weapons-and-armor , https://www.onlinemetals.com/en/battlebots-choosing-right-material , https://news.sparkfun.com/2763 , https://www.interstateplastics.com/combat-robotics-utilize-uhmw-to-shield-internal-systems-from-damage

Mill-scale appearance and TV lighting choices come from general knowledge, not a cited source. I did not gather reference photos.

## Bugs worth keeping for any WebGPU port
- `VelocityNode` advances its previous camera only per animation frame. Rendering in a `setTimeout` loop gives huge false motion blur; wait a real rAF.
- Velocity is NDC, Y up: multiply by `(.5, -.5)` for UV offsets.
- Blur must be zeroed on a camera cut frame.
- In `SharpenNode`, 0 is maximum sharpening and 2 is none.
- An all-metal floor shows almost no shadows, because metal has no diffuse response. Oxide at about 0.6 metalness grounds the bots.
- Playwright's bundled ffmpeg reads only `pipe:0` and encodes VP9, not VP8.

## Reproduce
From this folder, with the repo root installed:
`../../../../node_modules/.bin/vite build --config vite.config.mjs`, then `node scripts/serve.mjs .. 5192`. Use `BASE=http://localhost:5192/p2-webgpu/dist/` with `scripts/shot.mjs`, `scripts/bench.mjs` or `scripts/clip.mjs`. `scripts/webkit.mjs` expects the dev server on the root path.
