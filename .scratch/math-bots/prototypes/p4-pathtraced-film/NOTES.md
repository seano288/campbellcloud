# P4: pre-rendered path-traced film

## The technique, in plain language
Nothing is drawn on the iPad. The whole fight was modelled and animated by Python scripts in Blender 5.2.3, then rendered offline on the Mac with Cycles, a physically based path tracer, and compressed to an ordinary H.264 video. The iPad only plays a video, so its GPU does not matter and the image can use everything real-time cannot: true motion blur, depth of field, reflections in steel and polycarbonate, light from the sparks, and a simulated smoke volume.

- **Modelling:** `scripts/bots.py` builds the bots as a fabricator would: extruded plates with real holes, bevelled edges, hex and socket bolts, rippled weld beads, a timing belt, hoses, wiring, batteries behind the rear panel. Everything is real geometry (about 108k vertices before Blender's instancing).
- **Materials:** `scripts/mats.py` is procedural, so close-ups never run out of texture. Edge chips use the Bevel-node trick, corner grime uses ambient occlusion, plus scratches, orange-peel and mill-scale noise. The floor uses a 4096 px damage map painted by numpy (scorch, gouges, tyre rubber, plate seams).
- **Motion:** `scripts/anim.py` poses are functions of fight time. Contact positions are computed from each bot's geometry so steel really meets steel. The torn panel uses a small rigid-body integrator. Drum speed is deliberately far below true rpm, because true speed would alias: it is the fastest rate motion blur still reads.
- **Effects:** sparks are about 6,700 ballistic particles with drag and floor bounces, built each frame as motion streaks (`scripts/fx.py`). Each hit also has a real point light. Smoke is a Mantaflow gas simulation at 128 voxels (`scripts/smoke.py`), loaded as a VDB sequence.
- **Camera:** nine shots with cuts like TV coverage (`scripts/cams.py`): wide and tracking shots from outside the polycarbonate, low floor cameras, operator shake with kicks on impact. Bloom comes from Blender's compositor. Vignette, grain and sharpening are added at encode.

Order of the film: face-off wide, drum spin-up close, tracking, first hit, hammer strike, panel tear, smoke close-up, KO, wide ending.

## Measured numbers
| Item | Value |
|---|---|
| Film | 23.5 s, 1280x720, 24 fps, 564 frames, 9 shots. Short of the ~30 s target; everything in the required beat list is in it |
| `dist/fight.mp4` | 17.1 MB, H.264 High@4.0, CRF 21, 5.8 Mbit/s, keyframe every 0.5 s, faststart |
| `dist/fight.webm` | 12.2 MB, VP9, fallback for non-Safari browsers only; an iPad would not fetch it |
| Total `dist/` | 29 MB with both encodes; 17.1 MB of video for an iPad-only build |
| Samples | 26 spp per frame with adaptive sampling plus OIDN (albedo + normal). Stills in `shots/` are re-rendered at 128 spp, 1600x900, so they are a little cleaner than the film |
| Render time | 145 min of per-frame time for the final 564 frames (15.4 s/frame), M3 MacBook Air 10-core GPU, machine shared with other prototypes. Non-smoke shots 9-12 s/frame, smoke shots 17-25 s/frame, 1600x900 128 spp stills 55-120 s |
| Other time | Smoke bake about 50 min on shared CPU (316 frames, over 1.3 GB cache). Metal kernel compile 6-10 min when features change. Scene rebuild about 15 s |
| Real-time fps | Not applicable: fixed 24 fps video. Draw calls on the device: effectively one video layer |
| Player check | Desktop WebKit via Playwright: H.264 decoded, `?shot=14.4` seeks correctly, FIRE seeks correctly, 0 dropped frames in a 1.5 s headless sample. This says little about an iPad |

Total session was about 4.25 hours, including restarts for look fixes.

## How it would fare on an iPad
**An estimate; not tested on an iPad.** 720p H.264 at under 6 Mbit/s is well inside what every iPad decodes in hardware, so smooth playback and low battery use are the safest prediction in this whole project. The real risks are around the video, not in it:
- Autoplay needs `muted playsinline`, which the page has. Reports say Low Power Mode can stop autoplay, so the Replay button must also start it.
- **Offline PWA:** Safari fetches video with byte-range requests and expects a 206 response. A service worker returning the cached file as a plain 200 is reported to fail, so the worker must build 206 responses from the full cached file. No repo game does this yet, and the sources are old, so test it on a device.
- Seek latency is the unknown for FIRE and branching. A keyframe every 0.5 s helps, but a seek on the device may show a visible hitch.

## How clips could vary and react
The film cannot change once rendered, so variety has to be built from pieces.

1. **Cut-on-impact clip graph (recommended).** Split each fight into beats: approach, hit, recoil, finisher. TV-style cuts hide joins, so clips only need to agree on story, not on exact pose. Two preloaded `<video>` elements swap at the cut. Three or four variants per beat give dozens of different-feeling fights from about 18 clips.
2. **Math-driven outcomes.** A right answer picks the next beat from a "big hit" pool, a wrong answer picks a glancing hit or an ANVIL strike. TORQUE still always wins, since only the length of the path changes. FIRE already works this way in the page: it cuts to just before the next hit, which also shows the limit, as it jumps rather than reacts.
3. **Live overlays.** Anything in HTML or canvas over the video stays dynamic: health bars, the child's bot name, extra sparks, score. Shake the video element on a hit.
4. **Per-bot upgrades.** This is the expensive part, since a visible upgrade means every shot of TORQUE changes.
   - Paint colour: cheap. Render a matte pass and recolour in a small WebGL shader, at about twice the video data for those clips. Unproven here.
   - Parts such as a new weapon: real re-renders. Keep these to a few tiers.
   - Cheap fallback: render upgrades only into a garage turntable and a hero close-up, and keep the fight generic.

### Storage and render estimate for a full game
Based on measured 0.73 MB per second of video and 15.4 s per frame on this shared M3. Example set: 1 arena, 3 opponents, 2 TORQUE looks, 18 clips of about 3 s each per pairing.

| Set | Video | H.264 720p | Render on this Mac |
|---|---|---|---|
| This film | 23.5 s | 17 MB | 2.5 h |
| One pairing, 18 clips | 54 s | 39 MB | 5.5 h |
| Full set (3 x 2 pairings) | 324 s | about 235 MB | 33 h, plus smoke bakes and retakes |

HEVC might cut storage by about a third (my estimate, not measured); 480p would roughly halve it. A full set is far over the ~30 MB brief, so this route means either a much larger offline cache or a far smaller clip set. One pairing at 480p would be about 20 MB. Any change to a bot or arena needs a re-render of everything it appears in.

## Getting to production
1. Decide the clip graph and the storage budget first: they set everything else.
2. Add a range-capable service worker route and test offline playback on a real iPad.
3. Build the two-video player with preloading and cut-on-impact swaps. Measure swap latency on a device.
4. Clean up the look (weak points below), then render at higher samples. An overnight run per pairing is realistic. Fix the seed and watch for denoiser shimmer.
5. Integrate as a reward screen in a game folder, loading video only after the math round so the first paint is not delayed.

## Honest weak points
- **It does not react.** This is the fundamental cost: the child watches rather than plays.
- **Paint scratches** read as repeated short horizontal dashes on the red and blue panels in close-ups. This is the biggest remaining CG tell.
- **Drum** looks a bit like speckled chrome when stopped (`shots/03-closeup.png`); it looks far better spinning.
- **Polycarbonate reflections** are blotchy, and the lamp reflections read as bright white patches in several shots.
- **Lighting is darker and moodier than real TV coverage,** which is usually high-key. The hall above the walls is nearly black.
- **Too clean in places:** TORQUE's UHMW bumper and rear plate are bright and unmarked, and no dents or new damage appear on bots after hits, apart from the torn panel. The panel is out of frame by the end of the tear shot, and there is no flying debris apart from it.
- **Smoke** is 4 cm voxels, so it is soft up close, and the column drifts rather than billows.
- **Timing:** hits have no hit-stop or slow-motion replay, and the wide opening is quiet for three seconds.
- Low sample counts: OIDN softens fine floor detail, and some shimmer in motion is possible. I reviewed frames as contact sheets, not as played-back video, so temporal artifacts are unverified.
- No sound (not required), and sound would carry a lot of the impact.

## Assets and licences
| Asset | Source | Licence |
|---|---|---|
| `assets/src/machine_shop_02_2k.exr`, seen only in reflections | https://polyhaven.com/a/machine_shop_02 | CC0 |
| Everything else in the scene | Generated by `scripts/` | Original |
| Blender 5.2.3 (build tool, output is ours) | https://download.blender.org/release/Blender5.2/ (SHA-256 checked) | GPL, does not apply to rendered output |
| ffmpeg-static (build tool, not shipped) | npm, in `tools/` | GPL |

Lettering uses Blender's built-in font, rendered into the video. Nothing but video and one HTML file ships. Original bots and names only; no real competitor, show or arena branding.

## Reproducing
Blender and intermediates are not in this folder. As of this session they are in the session scratchpad, `/private/tmp/claude-501/-Users-seancampbell--t3-worktrees-campbellcloud-t3-579a7c1d/9b49f1a2-b884-40e3-8742-7c23ac83dcfb/scratchpad/` (`Blender.app`, `p4-work/work/`: frames, smoke cache, blend files, 4.2 GB), and may be cleaned up.

1. `mkdir work`, then `blender -b --factory-startup -P scripts/build.py`, then `blender -b work/fight2.blend -P scripts/smoke.py -- 128`, then build again to load the VDBs.
2. `blender -b work/fight2.blend -P scripts/render.py -- work/film all spp=26`. It skips existing frames, so it can be stopped and resumed.
3. `scripts/encode.sh` writes `dist/` and `shots/clip.webm`.

## Sources
- Cycles sampling: https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html
- Reducing noise: https://docs.blender.org/manual/en/latest/render/cycles/optimizations/reducing_noise.html
- Noise-threshold workflow: https://developer.blender.org/docs/release_notes/3.0/cycles/
- Metal device feedback: https://devtalk.blender.org/t/cycles-apple-metal-device-feedback/21868
- Armour materials: https://www.onlinemetals.com/en/combat-robotics-weapons-and-armor and https://www.onlinemetals.com/en/battlebots-choosing-right-material
- Drum and Hardox build logs: https://sites.google.com/view/andrewsmith924/fighting-robots/active-robots/boop-the-snoot/boop-design and https://blog.astandke.com/netsplit-assembly-and-test/
- Wedges and weapon trade-offs: https://zbotic.in/battle-robot-design-weight-classes-weapons-drive-systems/
- Arena walls, floors, lighting: https://sparc.tools/SPARC_Arena_Construction_Best_Practices_v1.1.pdf
- Safari range requests in service workers: https://dev.to/philnash/service-workers-beware-safaris-range-request-38i7 and https://bugs.webkit.org/show_bug.cgi?id=184447 and https://web.dev/sw-range-requests/
- iOS video policy: https://webkit.org/blog/6784/new-video-policies-for-ios/ and https://developer.apple.com/forums/thread/709821
