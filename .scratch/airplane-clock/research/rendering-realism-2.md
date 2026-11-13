# Time Flies: rendering realism, round 2 (three.js r186, iPad 9)

Builds on `rendering-realism.md` (renderer, IBL, tone mapping, materials, post-processing), `rendering-modeling.md`
(procedural lofting) and `rendering-stage-effects.md` (hangar, flames). Those got the hangar HDRI, Neutral tone mapping,
clear-coated paint, the projected livery atlas and a PCF sun shadow in place. This round asks: with that baseline, what
most raises how *real* the aircraft look on an iPad 9 (A13, 3 GB, Safari, DPR 2), and builds it.

Tags as before: [V] verified in a source or in the r186 code in `node_modules/three`, [M] from experience, [U] unverified.

## 1. What the baseline got wrong (screenshots, 2026-11-13)

- Parts float. Nothing darkens where surfaces meet: wing roots, the gear under the wings, intake mouths and nozzles are
  lit as brightly as the open spine. This is the single biggest "CG" tell.
- Intake mouths are flat dark caps; nozzles are a plain can with a flat dark disc at the exit.
- Landing gear: one white cylinder per leg running straight through the middle of the wheel, and a flat white card
  (the gear door) hanging in mid-air beside it.
- Propeller blades are flat paddles at about 70° pitch, so they look feathered and read as black planks.
- The pilot is a white ball; the visor was on the *back* of the head (three's `SphereGeometry` puts phi = 0 at -x, the
  way the pilot faces, and the old visor was centred on phi = π). [V: three `SphereGeometry` source]
- Canopies have no frames; glass is equally transparent at every angle.
- Paint has perfectly uniform roughness, which reads as plastic in the HDRI reflections.

## 2. Options considered (payoff vs cost on the iPad)

| Technique | Payoff | Per-frame cost | Build cost | Verdict |
|---|---|---|---|---|
| Screen-space AO (SSAO/GTAO/N8AO pass) | high | a full-screen depth + normal pass and a blur at DPR 2 (~3 M px): several ms on A13 [M] | none | **no**: the aircraft is static, so baking is strictly better |
| Baked per-vertex AO, CPU raytracing | high | ~0 | needs a BVH (three-mesh-bvh isn't a dependency); 64 rays × ~15k unique vertices ≈ 1 M ray casts: seconds in JS [M] | no |
| **Baked per-vertex AO from depth maps** (rasterise the airframe along N directions like shadow maps, test each vertex) [V: Zachmann 2004; Sloan et al. 2013] | high | one varying + a few ALU ops | ~40–100 ms (measured, §4) | **chosen** |
| Baked AO texture (lightmap) | high | one texture fetch | needs a UV unwrap, which these meshes don't have (the livery is projected) | no |
| **Contact shadow** under the aircraft: three's `webgl_shadow_contact` renders depth from below and blurs it every frame [V: three example, via forum quotes] | high (grounding) | that example re-renders per frame; we rasterise once on the CPU and draw one textured quad | ~5 ms | **chosen, baked** |
| Panel lines as bump/normal detail | low at viewing distance: seams are 1–2 px on screen, and screen-space derivatives of a projected texture shimmer | an extra map and derivatives | a second atlas canvas | **not now**; the painted seams already read |
| **Roughness / clear-coat variation** in the paint | medium: breaks up the plastic reflections | 2 value-noise lookups per fragment | none | **chosen** (procedural, in aircraft metres, no texture) |
| **Exhaust soot** (piston stacks, jet nozzles) painted into the livery atlas | medium, iconic on the Mustang/Corsair | none | a few canvas gradients | **chosen** |
| Specular anti-aliasing | — | — | — | already in r186: `lights_physical_fragment` adds `geometryRoughness` from normal derivatives [V] |
| **Fresnel canopy** (more reflective and opaque at grazing angles) | medium: the canopy's shape reads | a few ALU ops | none | **chosen**; still no `transmission` (an extra scene pass) |
| **Modelled detail**: oleo struts, torque links, drag braces, forks/axles, real doors, hub faces, intake ducts with fan faces, nozzle petals/liner/turbine face, twisted prop blades, pilot with helmet/visor/mask/headbox, canopy bows and sill rails | high close up (the Slot views zoom right in) | +~3–8k triangles per aircraft | ~10–20 ms | **chosen** |
| Bloom / tone tweaks | — | a pass | — | left alone: exposure and Neutral tone mapping already balance well in the hangar |

## 3. What was built

All in `src/time-flies/hangar/three/` (spec changes purely additive).

### 3.1 Baked ambient occlusion (`ao.ts`)
- After the aircraft is assembled and sat on its wheels, every solid mesh is a receiver. Occluders are the same minus
  anything that moves (propellers, the F-14's wings, the V-22's nacelles) and minus glass.
- 20 axes spread over a hemisphere (Fibonacci spiral). For each axis the occluders' triangles are projected and
  rasterised in software into a 160×160 depth map storing **both** the max and min depth, so one pass serves the axis
  and its opposite: 40 directions for the price of 20 rasterisations. Triangles smaller than ~1 texel just splat their
  corners (most of them at this resolution).
- Each distinct vertex position (the creased meshes repeat each corner per triangle) is lifted along its normal by about
  a texel (more at grazing angles, the shadow-map bias trick), then tested against a bilinear 2×2 of texels; directions
  are cosine-weighted. The result, 0 open to 1 buried, goes in a float `aoOcc` vertex attribute.
- Shading: `patchAO` replaces `<aomap_fragment>`'s slot: it scales indirect diffuse, clear-coat indirect and (via
  three's own `computeSpecularOcclusion`) indirect specular by `1 − 0.9·smoothstep(0, 0.85, occ)`, and direct diffuse by
  a third of that (deep ducts and wells that the 2048 sun shadow map can't resolve). The shared materials get cached
  AO copies (`withAO`), so Chop Chop's helicopters, which use the originals and have no `aoOcc`, are untouched;
  `paintMaterial(…, { ao: true })` is opt-in for the same reason.
- Stores (rebuilt on every Weapons change) aren't baked; they keep their own materials.

### 3.2 Contact shadow
The same rasteriser looks up from under the floor at 256², keeps the lowest point per texel, and turns height into
darkness twice (a tight term for tyres, a broad soft term for fuselage and wings), each blurred with three box passes.
It's an alpha-mapped black quad on the floor (`BuiltJet.contact`), placed by the stage: on the hangar floor or the
runway, fading out by 5 m of altitude and hidden with the gear up.

### 3.3 Paint, glass, soot
- Paint roughness ±0.07 and clear-coat roughness ×0.55–1.45 from two octaves of 3D value noise in aircraft metres.
- Canopy alpha rises toward 1 with `(1 − |N·V|)³`, and the env reflection gets a Fresnel boost: every Canopy Mod still
  reads as its tint, but the glass now has an edge.
- `Shape.exhausts` (optional): piston stacks trail a sooty plume aft along their own side; jet nozzles get a scorched
  band on the last metre or two of skin. Softer on gloss, much softer on Gold Chrome.

### 3.4 Modelled detail (`details.ts`)
- **Gear**: a painted oleo cylinder with a gland nut over a chrome piston; a torque-link scissor; a drag brace up into
  the airframe; single centre-line wheels on a fork with a trailing axle, single side wheels on a stub axle beside the
  strut, twins either side of it; strut-mounted or well doors as thin rounded panels, painted like the underside (they
  take the livery projection), all retracting with the leg.
- **Wheels**: tyres with squarer shoulders; hubs with a flat face and a centre cap.
- **Intakes**: a duct lofted from the mouth's own ring (so it's seamless) back ~3 mouth-sizes, light grey inside, to a
  dark fan face with a spinner; small scoops and gun muzzles just end dark.
- **Nozzles**: a petalled outer can (16 overlapping petals toward the exit), a lip, a liner to the turbine with a
  flameholder ring, a turbine face and tail cone. The liner glows orange with the throttle and Engine rung.
- **Propellers**: blades lofted from twisted airfoil stations: round shank, paddle at 45%, rounded tip; pitch from
  ~58° at the root to ~19° at the tip (a fixed `tan β · r` law), with a little camber, the leading edge leading in the
  direction it spins.
- **Pilot**: suit and survival vest, helmet with the visor down over the face, oxygen mask, ejection-seat headbox with a
  yellow handle (jets), a HUD combiner (jets).
- **Canopy frames**: a sill rail down each side, plus a windscreen bow at 30% (none on the F-16, F-22 and F-35's
  one-piece canopies); `BodyPart.frames` can override per aircraft.

## 4. Measured cost

Node, Apple-silicon Mac under heavy load (load average ~50 from other agents' shots), best of 3 per aircraft, livery
painting excluded (fake canvas):

| | mean build (18 aircraft) | of which AO bake | triangles (aircraft, no stores) |
|---|---|---|---|
| before | ~20–25 ms | — | mean 19.1k (7.7k F-117 … 35.5k SR-71) |
| after | ~70–77 ms | ~35–50 ms | mean 25.7k (12.0k … 44.2k): +6.6k, +34% |

(Triangles: both builders on the same committed specs.) In Chromium on the same machine (SwiftShader, page busy):
builds of 100–220 ms with the bake 50–125 ms. An A13 runs JS
roughly 2–3× slower than this machine unloaded [M], so expect ~150–250 ms per build on the iPad: within the 0.5 s
budget, and it happens only when an aircraft is chosen. The bake scales with occluder triangles × axes and vertex
count × axes; `BakeOptions` (`dirs`, `res`) can trade quality for time if the device disagrees.

Per frame: one extra varying and ~10 ALU ops on every lit fragment, two value-noise evaluations on paint fragments, a
Fresnel term on glass, one alpha-blended 256² quad. No extra passes, render targets or textures besides the 256²
contact map (256 KB).

## 5. Not done, and why

- Panel-line bump from a second atlas: low payoff at this viewing distance (§2); revisit if the Slot close-ups want it.
- Baking AO for stores: they change with every Weapons rung; a per-store bake (or a shared "store" AO) would work later.
- Moving parts get occlusion from the fixed airframe only; they cast none (so a swept F-14 wing leaves no ghost).
- Real-device timing: everything above is measured on a Mac; the iPad figure is an estimate. Check in Safari's Web
  Inspector: `stage.jet.timing` holds `{ build, ao }` ms.

## 6. Sources

- Zachmann et al., per-vertex visibility from depth maps rendered along many directions (VMV 2004):
  https://www.cs.uni-bremen.de/~zach/papers/vmv04_print.pdf
- Sloan, Tranchida, Chen, Kavan, "Ambient Obscurance Baking on the GPU" (2013):
  https://users.cs.utah.edu/~ladislav/sloan13ambient/sloan13ambient.pdf
- A vertex occlusion baking guide (sampling, welding per-vertex values): https://www.gamedev.net/blogs/entry/2260551-a-vertex-occlusion-baking-guide/
- Delt06/vertex-ao, a per-vertex AO bake into vertex colours: https://github.com/Delt06/vertex-ao
- Cesium, baking AO in the glTF pipeline: https://cesium.com/blog/2016/08/08/ambient-occlusion
- three.js contact shadows (render from below, blur), discussed: https://discourse.threejs.org/t/shadow-contact-threejs/29505
- Jimenez et al., "Practical Realtime Strategies for Accurate Indirect Occlusion" (GTAO, specular occlusion):
  https://www.iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf
- Lagarde & de Rousiers, "Moving Frostbite to Physically Based Rendering 3.0" (specular occlusion, §4.10):
  https://blog.selfshadow.com/publications/s2014-shading-course/frostbite/s2014_pbs_frostbite_slides.pdf
- three r186 source (`node_modules/three`): `aomap_fragment`, `lights_physical_pars_fragment`
  (`computeSpecularOcclusion`), `lights_physical_fragment` (`geometryRoughness`), `SphereGeometry`. [V]
