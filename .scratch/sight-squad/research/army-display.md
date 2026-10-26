# Displaying an army on an iPad (three.js r186)

Goal: 50 to 200 visible toy units (10 to 14 types, each with helmet, shield, flag and colour upgrades), shown in formation, marching in a parade, and in a playful toy battle, running at a steady frame rate on an iPad, offline as a PWA.

Tags: [src] = a source URL (section 9); [repo] = a file in this repo; (est.) = my judgement, not measured.

## 1. What the existing code gives us

Reuse (the hangar pattern is the family's way of building things in code):

- `docs/adr/0003-aircraft-built-in-code.md`: the decision to build vehicles from data in code, with no downloaded models. The army should follow it: unit specs as data, a builder that lofts or assembles them. [repo]
- Stage shell, `src/chop-chop/hangar/three/stage.ts` (`HelipadStage`) and `src/time-flies/hangar/three/stage.ts` (`Stage`):
  - Renderer: `new WebGLRenderer({ antialias, powerPreference:'high-performance' })`, `setPixelRatio(Math.min(devicePixelRatio, 2))`, `NeutralToneMapping` (keeps paint colours), `PCFShadowMap` (PCFSoftShadowMap is gone in r186, as the repo comment notes).
  - Environment: `HDRLoader` for `./env/hangar-1k.hdr`, then `PMREMGenerator.fromEquirectangular`, and `GroundedSkybox` for the backdrop. Both are cached assets, so they work offline. [repo]
  - Camera and controls: `OrbitControls` with damping, `enablePan=false`, `minPolarAngle 0.25`, `maxPolarAngle 1.5`. `focus(slot)` tweens the camera with a `THREE.Spherical` lerp, taking the shorter way round. Reuse this for "tap a unit / zoom to a squad".
  - Loop: `loop()` clamps dt to 50 ms, skips when `document.hidden`, and goes to rest after 1.5 s idle (`hotFrame % 30`). Reuse exactly this idle logic, which saves the iPad battery.
  - Resize: `ResizeObserver` on the host, and a widened FOV on narrow screens (`NARROW = 0.9`). Reuse for iPhone.
  - Hotspots: `onHotspots` projects anchors to screen space each frame, and `spreadHotspots()` (exported, chop-chop stage) pushes overlapping buttons apart. Reuse for squad labels.
  - Shadow fit: the sun's shadow camera is sized from the model's bounds (`sh.left = sh.bottom = -big*0.75` ...). Reuse with the army's bounding box.
  - `dispose()` pattern: cancel the rAF, disconnect the observer, dispose controls, geometries, materials and renderer.
- Mounting: `src/chop-chop/hangar/HelipadScreen.tsx`. The canvas sits in `.garage-stage`. The stage is created in a `useEffect` with `[]`, `setStage(st)` makes it available, and `st.dispose()` runs on unmount. Props go in with `stage?.setHeli(...)` in an effect keyed on the data. Hotspot buttons are absolutely positioned with `transform: translate(...)` from `onHotspots`. The army screen should follow this exactly: Preact owns the DOM and the stage is imperative.
- "Lift Off" moment: `src/chop-chop/hangar/LiftOff.tsx`. It is an overlay (`.show-overlay`) that calls `stage.fly(true)`, listens to `stage.onFlight` events, handles taps with a 12 px move threshold and `stage.hitsHeli()` raycast, and calls `stage.fly(false)` on cleanup. A Parade or Battle screen is the same shape: a `show-overlay` that starts a sequence of stage events, with a close button.
- Lofting and surfaces: `src/time-flies/hangar/three/geometry.ts`, exports `loftBody` (superellipse sections), `loftSurface`, `creased(geo, deg)` (crease normals at 32 degrees, which keeps edges crisp), `mirrored`. Use `loftBody` for shields and helmets, and `creased` for crisp rims. The `Section` shape is in `geometry.ts`.
- Tubes and gear: `tube(a, b, r, mat)` in `src/chop-chop/hangar/three/heli.ts` (a cylinder between two points, for spears, lances and poles).
- Glow and smoke: `glow()`, `Smoke` pool and `smokeColors` in `src/time-flies/hangar/three/effects.ts`. `Smoke` is good for dust in the battle. `glow()` is a sprite for the fireworks/banner. The `Smoke` class uses pooled points, so it costs one draw.
- Projectiles: `src/time-flies/hangar/three/weapons.ts` (`Weapons`, with `shoot`, `firework`, `onBoom`) can be reused for catapult stones, with the same pooling.
- Materials: `src/time-flies/hangar/three/materials.ts` has `paintMaterial` (a clear-coat physical material with an `onBeforeCompile` patch, which is the pattern to copy for animation) and `FIXED`/`RUBBER`/`HUB` shared materials. Add the army's materials to a `SHARED` set so `dispose()` skips them, as the existing code does.
- Motion: `src/ui/motion.ts` exports `reducedMotion()`. Garage and Time Flies each have their own copy (`src/time-flies/motion.ts`). Use the shared one.
- Repo precedent for test hooks: `HelipadStage.orbit(az, el)` exists "for the preview's screenshots". A deterministic `step(dt)` for tests follows that precedent.

Not relevant (do not reuse):
- `airfield.ts` (sky, grass and runway), `FuelLock`, the rotor and tail code in `heli.ts`, `stores.ts`, and the livery atlas in `livery.ts`. The army's colour is per instance, not projected from an atlas. The private `canvasTexture` helper in `airfield.ts` is not exported, so copy it if needed.
- `truck.ts` (extrusion and decals are far too heavy for 200 units).

## 2. Options for many units

Each army type is a set of parts (body, head, helmet, shield, flag, legs), and each part is shared by every unit of that type.

| Option | Draw calls for 200 units x 10 parts | Per-unit colour | Per-unit animation | Notes |
|---|---|---|---|---|
| Plain `Mesh` per unit | 2,000 | yes | yes | The baseline to beat. CPU-bound on iPad. (est.) |
| `InstancedMesh` per part per type | about 120 (12 types x 10 parts) | `instanceColor` | per-instance matrix, and per-instance attributes via `InstancedBufferAttribute` | Best fit. One matrix per part per unit. [src] |
| `BatchedMesh` (one material, many geometries) | about 1 to 4 | `setColorAt` | matrix only; custom per-instance vertex data is awkward | Good when many different geometries share one material. The army's units share a few part shapes, so the gain is small. The docs say the limits are fixed at construction and that `optimize()` is needed after deletes. [src] Introduced around r159 (est.). |
| Merged geometry (`mergeGeometries`) | 1 per type | baked vertex colours | none (rebuild per frame is too costly) | Only for static formations or a fixed parade float. [src] (est.) |
| Sprites / billboards | 1 per type | `SpriteMaterial.color` | cheap (texture frames) | Fallback for a very low tier. Loses 3D and the orbit view. (est.) |
| 2D canvas/SVG isometric | none (CSS/canvas) | yes | yes | Fine for a flat parade, but gives up the 3D toy look and the orbit. (est.) |

Recommendation: `InstancedMesh` per part per unit type, with `instanceMatrix` for placement, `instanceColor` for the surcoat or helmet colour, and a shader patch for limb motion. The draw count is about 120 for 12 types, or about 240 with outlines (section 3), and it does not grow with the number of units. This matches the evidence: the instancing example's own discussions report mixed gains on desktop browsers, and the forum advice is to measure on a real device with rising counts [src]. Expect the gain to be in CPU time, not frame rate, on an iPad (est.).

Hardware notes:
- The WebGL limits quoted in older forums are historical: an old iPad reported 4096 max texture size and 128 vertex uniform vectors, and WebKit once reported WebGL limits below the native ones [src]. Do not rely on a table. Read `renderer.capabilities` and `gl.getParameter` at start-up. Keep per-instance data in attributes and matrices (not a uniform array), so the vertex uniform budget does not limit the count.
- Uniform arrays of per-unit data (for example 200 `vec4`s) would hit the vertex uniform limit on older devices (est.). Attributes do not.

## 3. Building a stylised unit procedurally

A "toy figure" from primitives, one part per instanced set:

- Proportions for a 6-year-old's toy (est.): head-to-body ratio about 1:3, a big helmet dome, short chunky legs, a box torso with rounded shoulders, shield and flag held as flat plates. The shapes must read at a small screen size, so the silhouette matters more than the detail.
- Parts and primitives (est. triangle counts at 12 to 16 radial segments):
  - Head: `SphereGeometry(0.11, 12, 8)` or a lathe (`LatheGeometry`) for a smooth face. About 150 tris.
  - Helmet: a lathe dome plus a brim, using `loftBody` (superellipse sections) for knight and tank helmets. About 200 tris.
  - Torso: `CapsuleGeometry(0.14, 0.2, 4, 12)`. About 200 tris.
  - Legs: two `CapsuleGeometry(0.05, 0.16, 3, 8)` pieces, hip pivot at local origin for the marching patch.
  - Arms: capsules, with optional spear (`tube`) or flag pole.
  - Shield: `loftBody` or an extruded superellipse (`ExtrudeGeometry` with a small bevel). About 100 tris.
  - Flag: a thin plane with a wave in the vertex shader (see section 4).
  - Catapult, tank and horse: a box body and a few cylinders or capsules. A horse is a body capsule plus four leg capsules, and uses the same leg patch.
- Budget: about 600 to 1,200 triangles per unit (est.). 200 units is about 120k to 240k triangles per frame, which is comfortable on a recent iPad (est.). Drop to 8 radial segments above 120 units.

Materials (plastic toy look):
- Base: `MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2 })`. The white base lets `instanceColor` multiply to the paint colour. This is the satin finish the Time Flies paint uses (`materials.ts` "satin": roughness 0.42, clearcoat 0.45) (est. for the exact numbers).
- Lighting: `RoomEnvironment` from `three/addons/environments/RoomEnvironment.js` (a procedural environment, no download, already imported by `src/garage/three/stage.ts`) for a toy-shop look, or the hangar HDRI for the hangar-style scene. [repo]
- Helmets and metal: `MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.3 })` with `instanceColor` as a tint. Metal under a bright environment reads well.

Outlines (the family's 4 px black outline style, see DESIGN.md):
- Inverted hull: a second `InstancedMesh` per part, `side: BackSide`, `MeshBasicMaterial` in black, with the vertices pushed out along their normals in the vertex shader (scaled by a thickness). The copy shares the same `instanceMatrix` attribute object as the main mesh, so it costs no extra per-unit CPU. It does double the draw calls (about 240) and the vertex work. Hard edges need `creased` normals, or the hull splits at corners. [src] (drei's `Outlines` helper uses this technique; the noggi write-up explains the inverted-normal approach) (est. for the cost).
- Toon alternative: `MeshToonMaterial` with a three-step gradient map gives the cartoon look with no extra draws, but no outline. Cheaper, weaker.
- Post-process outline (depth/normal edge pass): one full-screen pass, works for any shape, costs a few ms on an iPad (est.). Good only if the frame budget allows.
- Recommendation: the inverted hull on every part (about 240 draws, fine), with a thickness in metres tuned so it reads at the default camera distance. Drop the hull for the low tier if frame time is high. Do not use the hull on the flag (a thin plane gives gaps) (est.).

## 4. Animation without skeletal rigs

Three kinds of motion, each cheap:

1. Per-unit transform (CPU): position, yaw and slot. One `Matrix4` per part per unit per frame. Only moving units need writing.
2. Limb and body motion (GPU): the leg swing, the body bob and the flag wave are computed in the vertex shader from a time uniform and per-instance attributes. Nothing extra is written per frame except the marching flag.
3. Events (CPU, few): falling over, bouncing back, cheering hops. These are per-unit state in JS, applied as a tilt in the unit's matrix.

Per-instance data:
- `aPhase` (float, per instance): a constant, from the unit index (for example `fract(i * 0.618) * 2π`), so the army does not march in lockstep.
- `aMarch` (float, per instance, eased 0 to 1): 1 while the unit is moving.
- Attributes are `InstancedBufferAttribute`s on a geometry clone per part set (memory only).

Shader patch (the `onBeforeCompile` pattern from `src/time-flies/hangar/three/materials.ts`):

```ts
// Sketch: leg swing and body bob, applied in local space before the instance matrix.
export function marchPatch(mat: THREE.MeshPhysicalMaterial, time: { value: number }, legs: boolean) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aPhase;
attribute float aMarch;
uniform float uTime;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
float stride = sin(uTime * 8.0 + aPhase) * aMarch;
${legs
  ? 'float a = stride * 0.45; transformed.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * transformed.yz;'
  : 'transformed.y += abs(stride) * 0.035;'}`);
  };
  mat.customProgramCacheKey = () => (legs ? 'march-legs' : 'march-body');
}
```

Flags: `transformed.z += sin(uTime*5.0 + position.y*6.0 + aPhase) * 0.03 * position.x` in a flag patch. Keep the flag's geometry dense along its length.

Sketch of a marching army with formations (TypeScript, three r186; not compiled):

```ts
// src/army/hangar/three/crowd.ts (sketch)
import * as THREE from 'three';

export interface PartSet {
  mesh: THREE.InstancedMesh;     // one part of one unit type
  geo: THREE.BufferGeometry;     // a clone that carries aPhase and aMarch
  local: THREE.Matrix4;          // the part's offset inside the unit
}

export interface Unit {
  pos: THREE.Vector3; yaw: number; target: THREE.Vector3; targetYaw: number; marching: number;
}

const SPEED = 0.9;                       // m/s, a toy's march
const Y = new THREE.Vector3(0, 1, 0);
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Pairs units with slots without much crossing: sort both by angle round their centres (circles, blobs), or by x (lines, blocks). */
function assign(from: THREE.Vector3[], to: THREE.Vector3[]): number[] { /* see section 5 */ return from.map((_, i) => i); }

export class Crowd {
  readonly units: Unit[] = [];
  private m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), d = new THREE.Vector3();
  constructor(private parts: PartSet[], private time: { value: number }) {
    parts.forEach(part => {
      const attr = part.geo.getAttribute('aPhase') as THREE.InstancedBufferAttribute, cap = attr.count;
      for (let i = 0; i < cap; i++) attr.setX(i, ((i * 0.618) % 1) * Math.PI * 2);
    });
  }

  /** Units keep their index, so their colour and phase stay with them as the army reforms. */
  setFormation(slots: THREE.Vector3[], yaw: number) {
    const order = assign(this.units.map(u => u.pos), slots);
    this.units.forEach((u, i) => { u.target.copy(slots[order[i]!]!); u.targetYaw = yaw; });
  }

  update(dt: number) {
    const ease = Math.min(1, dt * 8);
    for (const u of this.units) {
      this.d.subVectors(u.target, u.pos);
      const dist = this.d.length();
      if (dist > 1e-3) u.pos.addScaledVector(this.d, Math.min(dist, SPEED * dt) / dist);
      const moving = dist > 0.05;
      u.marching += ((moving ? 1 : 0) - u.marching) * ease;
      u.yaw += angleDiff(moving ? Math.atan2(this.d.x, this.d.z) : u.targetYaw, u.yaw) * ease;
    }
    this.parts.forEach(part => {
      const march = part.geo.getAttribute('aMarch') as THREE.InstancedBufferAttribute;
      this.units.forEach((u, i) => {
        this.q.setFromAxisAngle(Y, u.yaw);
        this.p.copy(u.pos);
        this.m.compose(this.p, this.q, this.s).multiply(part.local);
        part.mesh.setMatrixAt(i, this.m);
        march.setX(i, u.marching);
      });
      part.mesh.instanceMatrix.needsUpdate = true;
      march.needsUpdate = true;
    });
  }
}
```

Costs (est.): 200 units x 10 parts = 2,000 compose-and-multiply calls per frame, roughly 0.1 to 0.3 ms of JS on an iPad, plus about 128 KB uploaded for `instanceMatrix` per frame (2,000 x 64 bytes). Fine at 60 fps. Two easy wins: skip the rewrite for still units (write only when `u.marching` or the position changed), and keep the per-frame allocation at zero (the sketch already reuses `m`, `q`, `p`). If the frame budget is tight, update matrices at 30 Hz and interpolate in the shader; not needed first.

Why not put the whole placement in the shader: it would need per-unit positions as attributes (fine) and would move the matrix build to the GPU. That is only worth it for 500+ units (est.).

Falling over and bouncing back (the toy battle): give each unit a `fall` value (0 to 1). Its matrix gets an extra rotation about the local x axis (`fall * π/2`) and a spring back toward 0 with damping, in JS. Five or six extra float operations per unit per frame; no per-part work beyond the same matrix write. A knocked-out unit can set `aMarch` to 0 and `scale` to 0 for the dead.

Cheering: a hop is `pos.y = abs(sin(t*6+aPhase))*0.15` in the matrix, for the units in the cheering squad only.

## 5. Formations

Each formation is a function that returns slot positions (x, z) for n units, centred on the origin:

- Line: `x = (i - (n-1)/2) * spacing`, `z = 0`. Spacing 0.5 m (toy shoulder width, est.).
- Block / square: `cols = ceil(sqrt(n))`, rows fill left to right, centred. Ranks are `z = row * depth`.
- Wedge: rank r has `2r+1` slots, centred on the axis; stop when the count is reached.
- Circle: `r = spacing * n / (2π)`, `angle = i/n * 2π`. For big counts use concentric rings with the ring circumference filling `ceil(2πr/spacing)` slots.
- Parade column: a set of lines stacked in depth, each band of 8 to 10 units, with a gap between bands for a band leader.
- Spell a word: section below.

Assignment (who goes where): the Hungarian algorithm is optimal but O(n^3). For n = 200 that is about 8 million operations, which is tens of milliseconds on an iPad once per formation change (est.). That is acceptable for a button press, but a simpler rule is enough: sort the current positions and the slot positions by the same key, then pair them in order. Key = angle around the centroid (circle, wedge, blob), or x then z (line, block, letters). The paired units travel straight, and they rarely cross.

Letter-to-points algorithm (for "spell a word"):

1. Wait for the font: `await document.fonts.load('900 200px Bungee')`. Without this, the canvas draws in a fallback font. Check the font is in the offline precache (est.).
2. Rasterise the word into an offscreen canvas (one line, auto-shrunk to fit a width of about 92% of the canvas), with `fillText` and `textAlign='center'`.
3. Read pixels with `getImageData`. A pixel is "ink" when alpha > 127.
4. Sample a grid of step `g` over the ink: points at `(x, y)` that are ink.
5. Binary search `g` in [2 px, 200 px] for the largest step whose count is at least `n`. Each step halves the search range, so 20 iterations is plenty (cost: about 126k pixel tests at the smallest step, a few ms (est.)).
6. If the count is above `n`, drop random points with a seeded RNG (the same word always looks the same). If it is below `n`, put the spare units in a block behind the word.
7. Convert pixels to metres: `x = (px - W/2) * metresPerPx`, `z = (py - H/2) * metresPerPx`. Lay out the word in the x-z plane facing the camera, or stand the text on a play-mat.
8. Letter index: measure each prefix with `measureText`, and tag each point with the letter whose x-range it falls in. Use the tag for colour groups, or to have each letter march in as a unit.

```ts
// Sketch: word -> slot positions (not compiled)
export function wordSlots(word: string, n: number, font = '900 200px Bungee, sans-serif') {
  const W = 1200, H = 420, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const fit = Math.min(1, (W * 0.92) / g.measureText(word).width);
  g.font = font.replace(/(\d+)px/, (_, px) => `${Math.floor(+px * fit)}px`);
  g.fillText(word, W / 2, H / 2);
  const px = g.getImageData(0, 0, W, H).data;
  const ink = (x: number, y: number) => px[(y * W + x) * 4 + 3]! > 127;
  const grid = (step: number) => {
    const out: { x: number; y: number }[] = [];
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) if (ink(x | 0, y | 0)) out.push({ x, y });
    return out;
  };
  let lo = 2, hi = 200;
  for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (grid(mid).length >= n) lo = mid; else hi = mid; }
  let pts = grid(lo);
  const rng = seeded(7);
  while (pts.length > n) pts.splice(Math.floor(rng() * pts.length), 1);   // drop evenly-ish; seeded so it repeats
  const metresPerPx = 0.6 / lo;   // toy spacing of about 0.6 m per grid cell (est.)
  return pts.map(p => new THREE.Vector3((p.x - W / 2) * metresPerPx, 0, (p.y - H / 2) * metresPerPx));
}
```

Note: `fit` shrinks the font so the word fits, but the `font.replace` only rewrites a leading size; check the Bungee string form when implementing. Random removal is the simplest; removing a point whose nearest neighbour is closest keeps spacing better (est.).

Units for the word: metresPerPx depends on the grid step `lo`, so a bigger `lo` means a bigger word on the ground. It is cleaner to fix the spacing (0.6 m) and let the canvas pixels follow: pick `lo` for the spacing, then scale. The sketch does that: spacing is fixed in metres, and `lo` is in pixels.

## 6. Camera and scene

Scene options:
- Tabletop / play-mat diorama (recommended for the parade and battle): a felt or grass play-mat (a canvas texture on a plane, drawn once at start-up, one draw) with a few painted features (road, river, castle lines). Toys sit on it. The mat is a small world, so the camera can frame it all, and it reads as a toy rather than a battlefield. Lights: `RoomEnvironment` plus one directional light. (est.)
- Field: a big plane with a horizon. Good for the battle, but the army is small in the frame and the orbit goes a long way. Use only for a "far" view.

Framing a growing army:
- Compute the army's bounding box in the x-z plane (min and max of the positions, plus a 1 m margin) and its height (about 0.5 m for a figure). Then the camera distance is `frameDistance(halfW, halfH, fovY, aspect) = max(halfH / tan(fovY/2), halfW / (tan(fovY/2) * aspect)) * 1.15`. Tween to it with the same `ease` and `Spherical` code as `focus()` in the hangar stage.
- Refit on each formation change, not every frame.
- Lock the target to the centroid. Minimum and maximum distance from the bounding box, so a single unit can still be zoomed into.

Controls (small hands):
- `OrbitControls` with `enablePan = false` (as the hangar does). Azimuth is free, polar angle limited to 0.35 to 1.35 rad (no view from straight above, no view from under the mat), and a `maxDistance` equal to about 2.5 times the fit distance.
- One finger rotates, two fingers pinch to zoom (OrbitControls default on touch). Add a double-tap to refit (est.), because a small hand loses its place.
- Big tap targets on the squad labels, not on the 3D units (an iPad tap on 1 cm figures is error-prone) (est.).
- Hit-testing: do not raycast 200 instanced units per tap. Project each unit's position to the screen, and pick the nearest within 40 px. This is cheaper and more forgiving. (est.) The `InstancedMesh` raycast works (it returns `instanceId`), but it tests every instance and depends on bounding spheres you must recompute (docs) [src].

Reduce Motion (`src/ui/motion.ts`):
- Skip the marching bob, the flag wave, the cheering hops and the falling spring. Keep the formation change but make it instant (`dur: 1`), as `src/time-flies/hangar/three/stage.ts` does for camera tweens (`reducedMotion() ? 1 : 900`). The toy battle can still show a result, just without the tumble. Note the marching patch uses a uniform, so set `uTime` to a constant for reduced motion, and the flag and legs stop moving.

## 7. Performance budget

Draw calls (est.): 12 types x 10 parts = 120 instanced draws; plus 120 hull draws for outlines; plus about 4 for the mat, blobs and the effects pools. Total about 250 draws, or about 370 with a shadow pass. This does not grow with the army size.

Triangles (est.): 1,000 per unit x 200 = 200k per frame, doubled by the hull (vertices, not triangles, are the main GPU cost of the hull). Target: 60 fps on iPad Air or Pro class, 30 fps floor on an older iPad. Use fewer segments above 120 units.

Pixel ratio: `Math.min(devicePixelRatio, 2)` as elsewhere in the repo. Above 120 units, cap at 1.5 on iPad (est.) (iPhone at 2 is fine at fewer units).

Shadows: prefer blob shadows. One `InstancedMesh` of flat quads with a radial-gradient texture under each unit (one draw, a soft dark circle, no shadow pass). A single shadow-casting directional light is an option for the hero view only, with a 1024 or 2048 shadow map sized to the army's bounds (the same fit as `HelipadStage.setHeli`). Shadow casting on 200 instanced units doubles the draw cost (est.). Turn shadows off on iPhone.

Memory: vertex data for 12 types at about 1,000 tris each is a few MB; no textures beyond the mat, a blob and a glow.

Idle and visibility: the `loop()` idle rest and the `document.hidden` check from the hangar stage carry over unchanged. The army does not need a 60 fps loop when nothing moves.

Battery: keep the rAF loop only while units move, or at 30 Hz when standing still (est.).

Testing (Playwright with SwiftShader runs at about 1 fps, so frame rate is untestable there):
- Test state, not frames. Expose a `snapshot()` (like the `orbit()` precedent) returning the unit count per type, each unit's position, target and `marching`, and whether every unit has reached its target within a tolerance.
- Drive time deterministically: `step(dt)` advances the army without rAF, so a test can call `step(1/60)` 300 times and assert "all units within 0.05 m of their slots", no rAF needed.
- Check the word: `wordSlots('HI', 40)` returns exactly 40 points, all within the word's bounds, and the same output for the same seed. Unit-test it with vitest like `src/time-flies/hangar/three/weapons.test.ts` does.
- Check the Reduce Motion path by setting the media query in the test and asserting the formation change is instant.
- Visual checks at iPad and iPhone sizes: take screenshots only to confirm layout, not performance.

## 8. Recommendation

Architecture (one per bullet, to build in this order):

- Data first: `src/army/hangar/units/*.ts`, one spec per type (name, parts, colour slots, upgrade slots), like the `src/chop-chop/hangar/helis/*.ts` specs. Upgrades (helmet, shield, flag) are part toggles, not new meshes.
- Unit builder: `src/army/hangar/three/unit.ts` builds each type's parts as `PartSet`s (one `InstancedMesh` per part per type, capacity = max units), and the outline hull copies. It reuses `loftBody`, `creased` and `tube` from the existing code.
- Upgrades without extra draws: a helmet or shield is a separate part set, and a unit without it is written with scale 0 in its matrix (not hidden), so the count stays fixed.
- Colour: `instanceColor` from the unit's surcoat colour. A white base material so the colour is the paint.
- Materials: `src/army/hangar/three/materials.ts`, a satin `MeshPhysicalMaterial` with `marchPatch` (section 4) on the body and legs, a flag patch, and a shared set for `dispose()`.
- Crowd: `src/army/hangar/three/crowd.ts`, the `Crowd` class from section 4, with `setFormation`, `update(dt)` and a per-unit `fall` spring for the battle.
- Formations: `src/army/hangar/three/formation.ts`, pure functions (line, block, wedge, circle, column, `wordSlots`), with a test file beside it.
- Stage: `src/army/hangar/three/stage.ts`, modelled on `HelipadStage`: renderer, idle-rest loop, `ResizeObserver`, orbit controls with the limits in section 6, a fit-to-bounds camera, blob shadows, `reducedMotion()`, `step(dt)` for tests, `dispose()`.
- Environment: `RoomEnvironment` for the toy-shop look, plus a play-mat canvas texture. No new downloads, so it works offline.
- Screens: `src/army/hangar/ArmyScreen.tsx` (the Formation builder and parade set-up) mounts the stage the way `HelipadScreen.tsx` does, with squad labels from `spreadHotspots`. `src/army/hangar/Parade.tsx` and `Battle.tsx` are `show-overlay` components, the same shape as `LiftOff.tsx`, that run a sequence of `setFormation` calls and stage events.
- Picking: project-to-screen nearest unit, not raycast (section 6).
- Quality tiers: pick the segment count, the hull, the pixel ratio and the shadow mode from unit count and `devicePixelRatio`, and fall back to no hull first if frame time is high.
- Tests: `step(dt)` and `snapshot()` for state; vitest for the formation and word functions.
- Keep the army data pure (no three.js import) so the same specs can drive a 2D fallback later.

Biggest risks, in order:
1. Frame rate on an older iPad with 200 units and outlines (est.): mitigate with segment LOD, a hull-off tier, and the pixel-ratio cap. Measure on a real iPad with the counts ramping (50, 100, 200) before building the battle.
2. Word-shaped formations depend on the font loading and the canvas rasteriser on iOS (est.): await `document.fonts.load`, check the Bungee file is precached, and fall back to a block if the word rasterises empty.
3. Reformation cost and crossing paths when many units change slots at once (est.): the sort-based assignment is fast but imperfect; run it on the change, not every frame, and accept some crossing.

## 9. Sources

- [src] three.js BatchedMesh docs: https://threejs.org/docs/pages/BatchedMesh.html
- [src] three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- [src] drei Outlines helper (inverted-hull outline, React Three Fiber): https://drei.docs.pmnd.rs/abstractions/outlines
- [src] Inverted hull outlines, noggi (write-up on the inverted-normal method): https://noggi3d.notion.site/Line-Art-36a2ccea40b18002a370ca9655169cd0
- [src] three.js forum, InstancedMesh draw-call gains not visible in the example (r120): https://discourse.threejs.org/t/the-drawcall-once-advantage-of-instancedmesh-does-not-seem-to-be-reflected/18278
- [src] three.js forum, "Is it strange? webgl_instancing_performance" (mixed results across browsers): https://discourse.threejs.org/t/is-it-strange-threejs-showcase-webgl-instancing-performance/40903
- [src] three.js forum, "InstancedMesh for simple geometries?" (merging vs instancing, memory): https://discourse.threejs.org/t/instancedmesh-for-simple-geometries/28658
- [src] WebGL cross-platform issues (spec minimums and device limits): https://webglfundamentals.org/webgl/lessons/webgl-cross-platform-issues.html
- [src] WebKit bug 133636 (iOS WebGL limits reported below native): https://bugs.webkit.org/show_bug.cgi?id=133636
- [repo] `docs/adr/0003-aircraft-built-in-code.md`, `src/chop-chop/hangar/three/stage.ts`, `heli.ts`, `src/chop-chop/hangar/HelipadScreen.tsx`, `LiftOff.tsx`, `src/time-flies/hangar/three/geometry.ts`, `materials.ts`, `effects.ts`, `weapons.ts`, `src/garage/three/stage.ts` (RoomEnvironment import), `src/ui/motion.ts`, `DESIGN.md`.
- (est.) Triangle, draw-call, frame-time and battery figures are estimates from the architecture, not measurements. Nothing here has been run on an iPad. The BatchedMesh introduction version (around r159) is from memory, not from the fetched page.
