# Airplane Clock: stage and effects research (three.js r186, iPad Safari)

Scope: the 3D hangar where a 6-year-old builds a fighter jet as a reward. Companion to the truck garage in
`src/garage/three/stage.ts` and `src/garage/three/exhaust.ts`. Research date 2026-10-16.

Verification key used below:
- **[V]** verified by fetching the URL or the raw three.js r186 source in this session.
- **[G]** general graphics or physics knowledge, not fetched. Check before relying on it.
- **[U]** unverified or contradicted by what I could fetch. Treat as a question, not a fact.

---

## 0. What the existing garage already gives us

- `stage.ts` builds a `WebGLRenderer` with `ACESFilmicToneMapping`, a `PCFSoftShadowMap` sun (2048 shadow map),
  a `SpotLight` with a fake volumetric beam cone (additive `ConeGeometry`, opacity 0.07), a `CircleGeometry` floor,
  and `RoomEnvironment` through `PMREMGenerator` for IBL. [code, read this session]
- The Show Off moment is a state flag (`showing`): lights dimmed (`hemi 0.06`, `sun 0.25`), spot on, turntable
  rotated by `dt * 0.0003`, plus a camera tween. The same pattern carries over to a take-off moment.
- `exhaust.ts` is a fixed pool of `CAP = 96` `THREE.Points` particles in one draw call, with a custom
  `ShaderMaterial` (point size from `POINT_SCALE`, soft circle alpha, optional additive blending for flames).
  This is the right base for contrails, flare bursts and smoke. Reuse it, do not write a second particle system.
- Pitfall to keep in mind: `POINT_SCALE` is recomputed from canvas height and FOV in `resize()`. Any new
  screen-space effect (sprites, Line2 widths) needs the same resize hook.

---

## 1. The stage

### 1.1 Options compared

| Option | Look | Cost on iPad | Verdict |
|---|---|---|---|
| Procedural hangar: arched trusses, concrete floor, strip lights, env map from a real hangar-like HDRI | Strong, reads as "hangar" instantly | Low: a few hundred instanced boxes, one env map (PMREM) | **Recommended** |
| Airfield apron at sunset (GroundedSkybox over a ground-projected HDRI) | Warm, cinematic, good for take-off | Low to medium | Second stage, for the fly-out |
| Aircraft carrier deck | Dramatic, but ship geometry plus sea | Medium, sea needs its own shader | Later, optional |
| HDRI only (no 3D set) | Fast to ship, but flat: no floor contact, no markings | Lowest | Use only as the env map, never alone |

### 1.2 HDRI candidates (Poly Haven, all CC0)

License: **[V]** Poly Haven states "Our assets are all licensed as CC0", commercial use allowed, attribution
not required (https://polyhaven.com/license). Assets are downloadable from `dl.polyhaven.org` and can be bundled
and precached.

Files and sizes below come from `https://api.polyhaven.com/files/<slug>` **[V]**.

| Slug | Use | Sizes (HDR / EXR) | Notes |
|---|---|---|---|
| `empty_warehouse_01` | **Hangar env + background** | 1k HDR 1.67 MB; 2k HDR 6.58 MB; 4k HDR 25.7 MB | Indoor warehouse, verified to exist. Best match for a hangar interior. |
| `aircraft_workshop_01` | Hangar env, alternative | Listed in API, max 17000x8500 **[V listing]**; file sizes not fetched **[U]** | Name suggests an aircraft shop, which is ideal. Check it visually before committing. |
| `industrial_sunset_02_puresky` | Apron at sunset | 1k HDR 1.08 MB; 2k HDR 4.13 MB | Verified existing and sized. Name says `puresky`, which usually means **sky only with no ground**. Check whether the ground survives before using it with `GroundedSkybox` **[U]**. |
| `kloofendal_48d_partly_cloudy_puresky` | Outdoor sky reference | 1k HDR 1.43 MB; 2k HDR 5.45 MB | Verified. Nature scene, not an airfield, but a good sky-only fallback. |
| `abandoned_hall_01`, `abandoned_workshop_02`, `burnt_warehouse` | Gritty alternatives | Listed only **[V listing]** | Not suitable for a shiny toy hangar. Mentioned for completeness. |

Not found: a verified Poly Haven airfield, runway or apron HDRI. I searched and checked the category page. The
category page did not render its grid, so I used the JSON API instead (`api.polyhaven.com/assets?t=hdris`). The
API listing was truncated at 100k characters and at the first 98 `indoor` entries, so there may be
unlisted candidates **[U]**.

Sizing advice: the PMREM bake shrinks any HDRI to a small cube, so 1k is enough for reflections. Use the **1k
HDR** (about 1.7 MB) for both env and background. Use 2k only if the backdrop must be sharp.

### 1.3 Building the hangar (recipe)

Stage geometry (all cheap):
- **Roof trusses**: 16 to 24 arched ribs, one `InstancedMesh` of a `BoxGeometry` placed on a semicircle. One
  draw call. Use `MeshStandardMaterial` with `roughness 0.6`, `metalness 0.8`, dark grey.
- **Floor**: `PlaneGeometry` 60x60, `MeshStandardMaterial` `color 0x9a9a98`, `roughness 0.28`, `metalness 0`. A
  shared radial alpha or "dirt" texture can be multiplied in as `roughnessMap` to break up the sheen. Gloss comes
  from the env map, not a live reflection (see 1.4).
- **Floor markings**: `CanvasTexture` of yellow taxi lines, `planeGeometry` with `transparent: true` and
  `polygonOffset` set to avoid z-fighting. One texture, one draw call.
- **Wheel chocks and a crew ladder**: `ExtrudeGeometry` or box groups. Put them on a separate group so they can
  be tweened out at take-off.
- **Strip lights**: `MeshBasicMaterial` emissive planes at the truss tips. Do not cast shadows.
- **Walls**: the HDRI background carries the hangar walls. Do not model them.

Lighting budget on iPad: one shadow-casting `DirectionalLight` (sun from the open hangar door, 1024 or 2048 map),
no more than two non-shadow point lights, `environmentIntensity` as the main fill. Matches `stage.ts`.

Code sketch:

```ts
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Bundle /public/hdr/empty_warehouse_01_1k.hdr and precache it in the service worker.
const hdr = await new RGBELoader().loadAsync('/hdr/empty_warehouse_01_1k.hdr'); // path not fetched [U]
hdr.mapping = THREE.EquirectangularReflectionMapping;
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromEquirectangular(hdr).texture;   // IBL for the jet and floor
scene.background = hdr;                                    // visible hangar walls (or dim it: scene.backgroundIntensity)
hdr.dispose(); pm.dispose();
```

`PMREMGenerator.fromEquirectangular` and `scene.environment` are standard three.js API **[G]**.
`RGBELoader` lives under `three/addons/loaders/` **[G]**; not fetched.

### 1.4 Floor reflections: the options and their cost

Live reflections are expensive. Pick by budget:

1. **Env-map gloss only (default, cheapest).** A `roughness` around 0.25 on the floor already reflects the
   hangar HDRI. Zero extra passes. Good enough for a 6-year-old.
2. **`Reflector`** (`three/addons/objects/Reflector.js`). **[V]** Renders the whole scene a second time into a
   render target. Defaults: `textureWidth`/`textureHeight` 512, `multisample` 4, `HalfFloatType` render target,
   `WebGLRenderer` only (use `ReflectorNode` on WebGPU). Source: https://threejs.org/docs/pages/Reflector.html
   and https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/Reflector.js.
   Cost: a second full draw of the scene. Set `multisample: 0`, texture 512 or half the canvas, and only
   enable it on iPad Pro-class devices or after a frame-time check.
3. **SSR**: not recommended on iPad. Heavy post-processing and unreliable on Safari. **[G]**

```ts
import { Reflector } from 'three/addons/objects/Reflector.js';
const floorRefl = new Reflector(new THREE.PlaneGeometry(60, 60), {
  textureWidth: 512, textureHeight: 512, multisample: 0, clipBias: 0.003, color: 0x6a6a6a,
});
floorRefl.rotateX(-Math.PI / 2);
scene.add(floorRefl);
```

Note: `Reflector` takes a `shader` option, and its default shader is the reflection shader **[V]**. A
blurred-edge reflection would need a custom shader **[G]**.

### 1.5 Sunset apron and the sky

Sky options:

- **`Sky` addon** (`three/addons/objects/Sky.js`) **[V]**. Analytic Preetham daylight in a fragment shader on a
  unit box with `BackSide`. Has a built-in procedural cloud layer. Uniforms (defaults from the r186 source):
  `turbidity 2`, `rayleigh 1`, `mieCoefficient 0.005`, `mieDirectionalG 0.8`, `sunPosition (0,0,0)`,
  `cloudScale 0.0002`, `cloudSpeed 0.00002`, `cloudCoverage 0.4`, `cloudDensity 0.4`, `cloudElevation 0.5`,
  `showSunDisc 1`. There is **no `setSunPosition` method**: set `sky.material.uniforms.sunPosition.value`
  directly. Source: https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/Sky.js and
  https://threejs.org/docs/pages/Sky.html.
  Cost: a full-screen per-pixel fBm noise pass when clouds are on. Its real cost on iPad is **[U]**, since I
  found no benchmark. Test it.
- **Cheap gradient sky**: a sphere with a `ShaderMaterial` that mixes three colours by `normalize(vWorldPos).y`,
  plus about 15 cloud sprites from one generated `CanvasTexture`. Near zero cost. Recommended as default.
- **Volumetric clouds**: not affordable on iPad. **[G]**

Clouds: use the `Sky` shader's clouds if it benchmarks well, otherwise 12 to 20 `Sprite`s with one soft
`CanvasTexture`, slow drift in `update()`. Put them in one group.

`GroundedSkybox` (`three/addons/objects/GroundedSkybox.js`) **[V]**: projects an equirect HDRI onto a ground plane
under the camera. Constructor `new GroundedSkybox(map, height, radius, resolution = 128)`. Set
`skybox.position.y = height`. Source: https://threejs.org/docs/pages/GroundedSkybox.html. Only use it with an
HDRI that has ground in it, not a `puresky` one **[U]**.

### 1.6 Apron details (sunset stage)

Chocks, yellow lines, a crew ladder and a tiny baggage cart are all cheap box groups. Put chocks on their own
group so they can be tweened out at take-off. Put the aircraft's shadow on the apron with a `ShadowMaterial`
plane, not a live shadow map, if the sun is low (low-angle shadows are long and need a bigger shadow frustum).

---

## 2. The "Show Off" equivalent: a take-off or fly-by

Structure it as a short scripted timeline (not a physics sim). Stages:

1. **Taxi and chocks**: wheels spin (`wheel.rotation.x -= speed * dt`), chocks tween out, crew ladder slides away.
2. **Throttle up**: afterburner light-up (section 3), audio whine rises, screen shake (camera offset, 3 to 5 px).
3. **Roll and rotate**: aircraft moves along a line, nose rotates up by about 12 degrees, nose wheel lifts.
4. **Climb-out fly-by**: camera follows along a `CatmullRomCurve3` (exported from `three`, no addon needed)
   that passes beside the aircraft low, then pulls up. Use `curve.getPointAt(t)` with an eased `t`.
5. **Sonic boom (optional)**: a faint cone behind the nose (section 2.3).
6. **Barrel roll**: rotate a `pivot` group around the aircraft's own X axis. The camera stays on the curve but
   looks at the pivot. Then rotate back.
7. **Celebration**: smoke or flares in the sky, then a 2-second hold on a hero angle, then the Show Off light
   state returns (existing `show(on)` pattern).

Camera choreography, cheap:

```ts
import { CatmullRomCurve3, Vector3 } from 'three';
const path = new CatmullRomCurve3([
  new Vector3(-6, 1.2, 9), new Vector3(0, 1.0, 5), new Vector3(7, 2.5, 0), new Vector3(3, 6, -7),
]);
function flyCam(k: number) {               // k in 0..1, eased outside
  camera.position.copy(path.getPointAt(k));
  camera.lookAt(jetPivot.position);
}
```

Keep the fly-by under about 4 seconds. A 6-year-old drops attention after that. Do the same timeline on
double-tap, so it can be replayed.

### 2.1 Sky with clouds, trails and smoke

- **Contrails and smoke ribbon**: use a ring-buffer ribbon, or `Line2` (`three/addons/lines/Line2.js`).
  **[V]** `Line2` draws fat lines from `LineGeometry` + `LineMaterial` and supports per-vertex colours through
  `vertexColors`. Source: https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/lines/Line2.js.
  `LineMaterial` needs `resolution` set on resize (width in pixels unless `worldUnits`). Line2 is convenient
  but allocates per update: for a moving trail, update a fixed-size `Float32Array` and call
  `geometry.setPositions()` only when a point is added.
- **Recommended trail**: reuse `exhaust.ts`'s `Points` pool, with a fast-fade, high-alpha style, rather than a
  ribbon. It is already tested and already fits the iPad budget.
- **Flare bursts for celebration**: `exhaust.ts` STYLES entry 3 (flame) and 4 (rainbow) already produce bursts.
  Add an `'airshow'` style with a long life and rainbow colours. No new system needed.
- **Missile or target**: not recommended for the target audience. If a "target" is wanted, use a balloon or a
  cloud cluster that bursts into confetti (`Points` again).

### 2.2 Wingtip vortices

Two short `Line2` or `Points` streams from the wingtips, faint and white, active only at high angle of attack
(a visual cue for "lift"). **[G]** Cheap and reads well. Keep the opacity below 0.4.

### 2.3 Sonic boom cone (Prandtl-Glauert)

Physics: a supersonic body produces a Mach cone with half-angle `mu = asin(1/M)`. Prandtl-Glauert scaling
`1/sqrt(1 - M^2)` applies to subsonic pressure fields. **[G]** Both are textbook; I did not fetch a source.

Visual: a cone mesh behind the nose, shaded with a fresnel term, additive blending, opacity fading with
distance. Fake the expansion by scaling along Z. A flat white-blue ring is also enough.

```glsl
// fragment: a faint, fading cone shell
float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 3.0);
float a = fres * uOpacity * (1.0 - vUv.y);   // fade toward the tail
gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), a);
```

Keep it optional. Behind the jet at 300 px wide it is a pleasant touch, not a feature.

---

## 3. Engine effects

### 3.1 Afterburner plume with shock diamonds

Technique: a cone mesh (`CylinderGeometry` open-ended, or `ConeGeometry`) from the nozzle, `ShaderMaterial` with
`AdditiveBlending`, `depthWrite: false`, `side: DoubleSide`. The shock diamonds are bright bands at intervals
along the axis, fading with distance. **[G]** The diamonds are a real effect of an underexpanded jet; this is
the standard approach.

```glsl
// fragment (uv.y: 0 at nozzle, 1 at tail; uTime, uThrottle uniforms)
float along = vUv.y;
float band = 0.5 + 0.5 * sin(along * 40.0 - uTime * 18.0);      // diamond spacing
float diamonds = pow(band, 6.0) * (1.0 - along);                 // sharp, fading
vec3 core = mix(vec3(1.0, 0.55, 0.15), vec3(0.6, 0.8, 1.0), 1.0 - along); // orange to blue-white
float a = (0.35 + 0.65 * uThrottle) * (0.25 + diamonds) * (1.0 - along);
gl_FragColor = vec4(core * (1.0 + diamonds * 2.0), a);           // HDR-ish; ACES will tone-map
```

Flicker: add `sin(uTime * 37.0) * 0.05` to `uThrottle`.

Glow:
- **Preferred on iPad**: additive sprite with a radial `CanvasTexture` at the nozzle. Cost: one quad.
- **UnrealBloomPass** (`three/addons/postprocessing/UnrealBloomPass.js`) **[V]**: constructor is
  `(resolution, strength, radius, threshold)`, and `resolution` defaults to 256x256 if omitted.
  Source: https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/postprocessing/UnrealBloomPass.js.
  Bloom needs an extra render target and several mip-chain passes. On iPad it is the single most expensive
  item in this list. **[G]** Use it only at half resolution, or skip it and use sprites.

### 3.2 Nozzle glow and light

A `PointLight` at the nozzle, intensity scaled by throttle, `distance 4`, no shadow. Good for lighting the
hangar floor and the tail. The existing `glow` pulse in `stage.ts` (`opacity` and `light.intensity` driven by
`sin(now)`) is the pattern to copy.

### 3.3 Heat shimmer

Cheapest acceptable option: an additive transparent plane behind the flame with a noise texture scrolled over
time (a faint wobble, no refraction). Real refraction needs a copy of the framebuffer per frame (a
`transmission` or custom post pass). That is an extra full-screen pass and is not worth it on iPad. **[G]**

### 3.4 Propeller blur disc (prop planes: P-51, Corsair, P-38; V-22 proprotors)

Technique: above a rotation speed threshold, hide the real blades and show a transparent disc with a radial
alpha texture (a soft blur ring, with a faint tip-edge highlight). Below the threshold, show the real blades.
This is a standard trick **[G]**.

```ts
const disc = new THREE.Mesh(
  new THREE.CircleGeometry(propRadius, 48),
  new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, opacity: 0.55, depthWrite: false }),
);
// blurTex: CanvasTexture, radial gradient, alpha 0.0 at centre-to-edge curve, 0.6 at the rim.
function setProp(k: number) {          // k: 0..1 throttle
  const blades = k < 0.6;
  bladeGroup.visible = blades; disc.visible = !blades;
  bladeGroup.rotation.z += k * 0.6;     // rotate every frame
}
```

Proprotor (V-22): the same disc with a `pivot` group, so it tilts with the nacelle (section 4).

### 3.5 Spool-up

Drive a single `spool` number (0 to 1) with a first-order lag toward the throttle target:
`spool += (target - spool) * (1 - Math.exp(-dt * 2.5))`. Use it for afterburner intensity, prop speed,
audio pitch and nozzle glow, so everything rises together.

---

## 4. Moving parts: pivot groups

Rule: every moving part is a child of a `Group` whose origin sits on the hinge. Rotate the group, never the mesh
itself. The mesh is offset inside the group so its pivot is correct.

```ts
function hinge(mesh: THREE.Object3D, pivotWorld: THREE.Vector3, parent: THREE.Object3D) {
  const pivot = new THREE.Group();
  pivot.position.copy(pivotWorld);
  parent.add(pivot);
  pivot.attach(mesh);          // keeps world transform, reparents under the pivot
  return pivot;
}
```

`Object3D.attach` reparents while keeping world transform **[G]**.

Animation: a critically damped spring per part (smooth and cheap, reacts to taps):

```ts
class Spring {
  x = 0; v = 0;
  constructor(public target = 0, public k = 120, public c = 16) {}
  step(dt: number) {
    const a = -this.k * (this.x - this.target) - this.c * this.v;
    this.v += a * dt; this.x += this.v * dt; return this.x;
  }
}
```

Per-part uses:
- **Swing wings (F-14 style)**: spring on `pivot.rotation.y`, target `0.1` (swept) or `-0.5` (spread); tap the
  wing to toggle. Look at a sweep over about 1 s.
- **V-22 nacelle tilt**: spring on the nacelle pivot `rotation.z` from 0 (helicopter) to `-Math.PI/2`
  (aeroplane), with the prop disc attached to the same pivot.
- **Weapon bay doors**: two-part door, one spring each, opening 90 degrees, staggered by 80 ms.
- **Canopy**: rear hinge, spring on `rotation.x`, open as a tap reward.
- **Landing gear retract**: strut rotates on a hinge, wheel group rotates too; the wheel pivot is a child of the
  strut pivot, so it follows automatically. Good for a "gear up" moment after take-off.
- **Control surfaces wiggle on tap**: a spring with a small target offset (`0.2` rad) and a fast `c` so it
  wobbles and settles in about 0.4 s. Ailerons and elevators can share one spring with opposite signs.

Use one `update(dt)` loop that steps every spring. Do not create per-part `requestAnimationFrame`.

---

## 5. Audio

### 5.1 Current code, and what to change

Read `src/audio/sfx.ts` and `src/audio/context.ts`:

- `context.ts` makes one `AudioContext`, resumes it only when `state === 'suspended'`, and plays a silent buffer
  inside `unlockAudio()` (called from the tap-to-start button). This is the right unlock idea. It does not
  handle the `interrupted` state, see 5.3.
- `sfx.ts` has `tone()` (oscillator with exponential decay), `noise()` (a fresh random buffer on **every call**),
  and `soundFor()` / `ownSound()` (cancels sounds when a signal aborts). The engine mods (V8, Jet Turbine) already
  use this vocabulary: sawtooth and square plus bandpass noise.

Concrete issues to fix before adding jets:
1. `noise()` allocates and fills `dur * sampleRate` floats each call. For a 1.6 s roar that is about 70k random
   numbers. **Cache one 2 s noise buffer** and start `AudioBufferSourceNode`s from it with `loop = true`. That
   removes the allocation and gives continuous noise for free.
2. `audio()` only resumes when `suspended`. Add an `'interrupted'` check (see 5.3).

### 5.2 Continuous voices

Jet whine, afterburner and prop drone are continuous, not one-shot. They need a voice object with
`setThrottle(k)` that ramps `AudioParam`s with `setTargetAtTime`, so there are no clicks.

```ts
import { audio } from './context';

export class JetVoice {
  private osc = audio().createOscillator();
  private noiseSrc: AudioBufferSourceNode;
  private filt = audio().createBiquadFilter();
  private gain = audio().createGain();
  private noiseGain = audio().createGain();

  constructor(noiseBuf: AudioBuffer) {
    const c = audio();
    this.osc.type = 'sawtooth'; this.osc.frequency.value = 180;
    this.noiseSrc = c.createBufferSource(); this.noiseSrc.buffer = noiseBuf; this.noiseSrc.loop = true;
    this.filt.type = 'bandpass'; this.filt.frequency.value = 900; this.filt.Q.value = 0.8;
    this.gain.gain.value = 0; this.noiseGain.gain.value = 0;
    this.osc.connect(this.gain); this.noiseSrc.connect(this.filt).connect(this.noiseGain).connect(this.gain);
    this.gain.connect(c.destination);
    this.osc.start(); this.noiseSrc.start();
  }

  setThrottle(k: number) {                       // 0 idle .. 1 full
    const t = audio().currentTime, tc = 0.12;     // time constant, seconds
    this.osc.frequency.setTargetAtTime(180 + 620 * k * k, t, tc);   // whine climbs with spool
    this.filt.frequency.setTargetAtTime(900 + 2400 * k, t, tc);     // hiss opens up
    this.gain.gain.setTargetAtTime(0.05 + 0.12 * k, t, tc);
    this.noiseGain.gain.setTargetAtTime(0.1 + 0.35 * k, t, tc);
  }

  stop() { this.gain.gain.setTargetAtTime(0, audio().currentTime, 0.05); this.osc.stop(audio().currentTime + 0.5); this.noiseSrc.stop(audio().currentTime + 0.5); }
}
```

Afterburner light-up: a one-shot noise with a rising bandpass (the existing `ENGINES[4]` whoosh) plus a
low-frequency thump, layered over the voice. The roar is `noise()` with `f2` ramping upward, already in sfx.

Prop drone: a fundamental at `bladePassHz = rpm / 60 * bladeCount`, with 3 harmonics at decreasing gain,
amplitude-modulated at the blade pass rate by a slow `LFO` (an oscillator into a `GainNode.gain`). Pitch follows
spool. **[G]** Standard synthesis approach, not sampled from a real recording.

Sonic boom: one 0.15 s highpass noise "crack" plus a 0.6 s low sine thump, pitch dropping 80 to 40 Hz. Not
loud. Play it when the fly-by passes the camera.

### 5.3 iOS Safari audio unlock caveats

- **[V]** The spec says an `AudioContext` moves from `suspended` to `running` only if the user agent allows it,
  and the user agent may block that unless the context's global object has sticky activation
  (https://webaudio.github.io/web-audio-api/#dom-audiocontext-resume, first 100k characters).
- **[G]** Create or resume the context inside a tap handler, and do the silent-buffer play in that same tap.
  The existing `unlockAudio()` does this. Keep it on the first tap of the start button.
- **[G]** Safari can put the context into `'interrupted'` (phone call, switching apps, lock screen). The spec
  defines `interrupted`. In that state the context does not process audio until it is resumed. **[U]** I did
  not confirm the iOS-specific behaviour from a source. Handle it defensively:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
});
```

  And in `audio()`, change the check to `if (ctx.state !== 'running') ctx.resume().catch(() => {});`. Calling
  `resume()` outside a gesture may fail on iOS; the `catch` is necessary, and the next tap should retry **[G]**.
- **[U]** The iPad ring/silent switch: whether Web Audio is muted by the mute switch on iOS. I believe it is
  for some configurations; test on a real iPad before promising sound.
- **[G]** Keep `AudioContext` count at one (already done). Do not create voices before the unlock.

---

## 6. Recipe, ordered by wow per cost

Each step can ship alone and is roughly a day's work. Costs are relative to the existing garage.

### Step 1. The hangar (stage, lights, env)
Highest wow for least cost. One env HDRI (1k), instanced trusses, emissive strip lights, chocks, yellow lines.
Reuse `stage.ts`'s light and show-off structure. Bundle `empty_warehouse_01_1k.hdr` and precache it.

```ts
const hdr = await new RGBELoader().loadAsync('/hdr/empty_warehouse_01_1k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = pmrem.fromEquirectangular(hdr).texture;
scene.background = hdr;
```

### Step 2. Afterburner with shock diamonds and sprite glow
Cone mesh, additive, the shader above, plus a radial `CanvasTexture` sprite at the nozzle. No bloom. Driven by the
spool value.

### Step 3. Take-off timeline with a camera curve
The state machine in section 2 (taxi, throttle, rotate, fly-by, celebration). `CatmullRomCurve3` path. Reuse the
existing tween and `show(on)` pattern. Biggest single moment; ship with step 2.

### Step 4. Smoke trail and flare bursts with `exhaust.ts`
Add 2 styles to the existing `STYLES` table: a long-life white trail and a rainbow airshow burst. No new
system. Trails are emitted from the wingtips or nozzle each frame during the fly-by.

### Step 5. Audio: cached noise buffer and a `JetVoice`
Fix `noise()` to use a cached buffer, add the voice with `setTargetAtTime`, and tie it to spool. Sonic boom crack.
Keep the interrupted-state handler.

### Step 6. Moving parts with springs
Pivot groups and the `Spring` class. Start with control-surface wiggle on tap (cheapest, most fun), then canopy,
then gear, then swing wings or nacelle tilt, which are per-airframe work.

### Step 7. Sky with clouds
Cheap gradient dome plus cloud sprites by default. Try the `Sky` addon behind a quality flag and benchmark on a
real iPad before enabling it. Do not ship it on by default without a measurement.

### Step 8. Floor reflection (only if the budget allows)
Default is env-map gloss. Add `Reflector` (512, `multisample: 0`) behind a quality flag, enabled only after a
frame-time check.

### Step 9. Prop disc and proprotor
Only if the chosen airframe has a prop or proprotor. Disc swap above a spool threshold.

### Step 10. Bloom and heat shimmer
Last, if at all. `UnrealBloomPass` at half resolution behind a quality flag. Heat shimmer as a faint scrolling
additive plane only.

### Budget check (rough, to verify on device)
- Draw calls: hangar about 10, aircraft 60 to 120 depending on parts, effects 6 to 10 (each `Points` pool and
  each cone is one call). Keep under about 200 total.
- Full-screen passes: sky (if the `Sky` addon is on), optional reflector (second scene draw), optional bloom.
  Default should have zero extra full-screen passes.
- Textures: one 1k HDR (about 1.7 MB file, PMREM bake small), a few 512 canvas textures. Keep under about 10 MB
  GPU memory for the stage.
- Frame-time gate: if the frame time exceeds about 22 ms for 2 seconds, drop the quality flags in reverse order
  (bloom, reflector, Sky addon).

---

## 7. Open questions and things to test on device

1. **[U]** Does `industrial_sunset_02_puresky` include ground? If not, the apron needs a ground plane or a
   different HDRI.
2. **[U]** `aircraft_workshop_01`: look at it. It might be a better hangar than `empty_warehouse_01`.
3. **[U]** Real iPad frame cost of the `Sky` addon with clouds, versus the gradient dome.
4. **[U]** Whether Safari sends the context to `interrupted` on the ring/silent switch or only on calls and
   backgrounding.
5. **[U]** Exact paths for `three/addons/lines/LineGeometry.js` and `LineMaterial.js`, and
   `three/addons/loaders/RGBELoader.js`. I checked the Line2 path and Reflector, Sky, Lensflare, UnrealBloomPass
   and GroundedSkybox paths, but not these two.
6. **[U]** Whether there are more hangar-type HDRIs in the Poly Haven API beyond the first 98 `indoor` entries
   (the listing was truncated).
7. **[G]** Accuracy of the shock-diamond spacing and the Mach-cone angle. Good enough for a visual, not for
   aerodynamics. This is fine for a 6-year-old audience.

---

## 8. Sources

- Poly Haven licence: https://polyhaven.com/license
- Poly Haven asset API (listing): https://api.polyhaven.com/assets?t=hdris
- Poly Haven asset API (indoor): https://api.polyhaven.com/assets?t=hdris&c=indoor
- Poly Haven asset file record, empty_warehouse_01: https://api.polyhaven.com/files/empty_warehouse_01
- Poly Haven asset file record, industrial_sunset_02_puresky: https://api.polyhaven.com/files/industrial_sunset_02_puresky
- Poly Haven asset file record, kloofendal_48d_partly_cloudy_puresky: https://api.polyhaven.com/files/kloofendal_48d_partly_cloudy_puresky
- Poly Haven HDRI category page (grid did not load): https://polyhaven.com/hdris?c=urban
- three.js Sky docs: https://threejs.org/docs/pages/Sky.html
- three.js Sky source (r186): https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/Sky.js
- three.js Reflector docs: https://threejs.org/docs/pages/Reflector.html
- three.js Reflector source (r186): https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/Reflector.js
- three.js GroundedSkybox docs: https://threejs.org/docs/pages/GroundedSkybox.html
- three.js Line2 source (r186): https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/lines/Line2.js
- three.js Lensflare source (r186): https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/Lensflare.js
- three.js UnrealBloomPass source (r186): https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/postprocessing/UnrealBloomPass.js
- Web Audio API, AudioContext.resume and autoplay: https://webaudio.github.io/web-audio-api/#dom-audiocontext-resume

Lensflare was verified but not recommended: it is a screen-space flare that reads as a 2000s effect and adds
draw cost for little gain on this audience.
