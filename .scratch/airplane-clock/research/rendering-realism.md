# Rendering a realistic fighter jet in three.js r186 on iPad Safari

Research note for the airplane game (hangar, paint, weapons, afterburner). Baseline is the Monster Truck garage.

Legend: **[V]** verified against a fetched source (URL given). **[S]** secondary source or search snippet only. **[M]** from memory / general PBR practice, not fetched in this session. **[U]** could not verify.

---

## 0. Baseline: what the current code does

Source: `/Users/seancampbell/campbellcloud/src/garage/three/stage.ts`, `truck.ts`.

| Area | Current | Realism note |
|---|---|---|
| Renderer | `new THREE.WebGLRenderer({ canvas, antialias: true })` (stage.ts:72) | Fine. MSAA via `antialias` only (no post). |
| Pixel ratio | `Math.min(devicePixelRatio, 2)` (stage.ts:73) | Reasonable for iPad. |
| Shadows | `PCFSoftShadowMap`, 2048 sun map, frustum ±4 (stage.ts:74,84-85) | **Must change for r186**, see section 6. |
| Tone map | `ACESFilmicToneMapping` (stage.ts:75) | Shifts hues; see section 3. |
| Environment | `RoomEnvironment` procedural PMREM, `environmentIntensity 0.9` (stage.ts:79-82) | Generic grey room. The biggest realism lever is replacing this with a real HDRI. |
| Lights | hemi 0.6 + sun 2.6 + rim 1.3 + spot (stage.ts:83-89) | Direct lights are doing the job the IBL should do. |
| Ground | `MeshStandardMaterial` circle + turntable cylinder (stage.ts:92-97) | Hard-edged floor, no contact shadow. |
| Render loop | `renderer.render` every rAF, unconditionally (stage.ts:298) | Wasteful on iPad when idle. See section 9. |
| Paint/metal | Mostly `MeshStandardMaterial`; only `glass` is `MeshPhysicalMaterial` with clearcoat (truck.ts:19-29) | Good base; the clearcoat pattern carries over. |
| Surface detail | Canvas texture projected from side, no normal/roughness maps (per truck.ts header) | Panel lines and rivets are the second lever. |

Summary: the existing stack is sound. Realism gains come mostly from (a) a real HDRI environment, (b) physically plausible material values with clearcoat and a roughness map, (c) a ground that grounds the object, (d) a tone curve that keeps paint colours honest, and (e) surface detail via canvas maps. Renderer choice is a much smaller lever.

---

## 1. Renderer choice: WebGLRenderer vs WebGPURenderer (r186)

### Facts

- Import path changes for WebGPU: `import * as THREE from 'three/webgpu'`, TSL from `'three/tsl'`. Import map entries shown in the manual. [V] https://threejs.org/manual/en/webgpurenderer.html
- WebGPURenderer falls back to a WebGL 2 backend automatically when WebGPU is unavailable. `forceWebGL: true` forces WebGL 2. [V] https://threejs.org/docs/pages/WebGPURenderer.html
- WebGPU init is asynchronous. Use `renderer.setAnimationLoop(render)` (it waits for init) or `await renderer.init()`. [V] https://threejs.org/manual/en/webgpurenderer.html
- r183: `PostProcessing` was renamed to `RenderPipeline` under WebGPURenderer (#32789). Also added TSL `RenderPipeline`. [V] https://github.com/mrdoob/three.js/releases/tag/r183
- r183 also renamed `Nodes` to `NodeManager`, and `shadowMap.color` to `shadowMap.colored`, then to `shadowMap.transmitted`. Churn is real. [V] same URL
- r186 WebGPU: `DirectRenderPipeline` added, async `renderer.dispose()`, MSAA for WebXR. [V] https://github.com/mrdoob/three.js/releases/tag/r186
- r186 WebGL: `SunLight` with cascaded shadow maps added (then moved to addons, reduced to 2 cascades). Sun-like `DirectionalLight`s in examples were replaced with it. [V] https://github.com/mrdoob/three.js/releases/tag/r186
- r186 WebGL: `PCFSoftShadowMap` code removed; using it now warns. [V] https://github.com/mrdoob/three.js/releases/tag/r186
- Manual says WebGPURenderer has a "new post-processing stack with built-in MRT support"; `EffectComposer` and its passes are **not** supported on WebGPU. [V] https://threejs.org/manual/en/webgpurenderer.html
- Safari: WebGPU shipped in Safari 26.0 (Sept 2025) on iOS 26, iPadOS 26 and macOS. [S] https://www.utsubo.com/blog/webgpu-threejs-migration-guide and search snippets citing Apple's announcement (https://discuss.privacyguides.net/t/news-from-wwdc25-webkit-in-safari-26-beta/28226). Not verified against Apple's own release notes.
- WebKit 26.1 WebGPU fixes: SVG `copyExternalImageToTexture`, WebCodecs black screen, WebGPU video textures in Three.js panoramas. [V] https://webkit.org/blog/17541/webkit-features-for-safari-26-1/
- WebKit Safari 27.0 notes (dated 17 Sept 2026): WGSL `clip_distances` built-in. No iPad-specific WebGPU limits listed. [V] https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- A third-party article claims a Metal buffer limit of 256 MB on older iPhones, up to ~993 MB on iPad Pro. Old, AI-focused, [U] for current Safari.
- Shader compile hitches on first use: `renderer.compileAsync(scene, camera)` behind a loading screen. [S] https://www.utsubo.com/blog/webgpu-threejs-migration-guide. r184 made `compileAsync()` non-blocking [V] (release page).

### Assessment

- WebGPU on iPad is now plausibly available, but the target device's Safari version is unknown, and this is a single hero object. The realism gain comes from materials, IBL, tone mapping and ground contact, all of which work in WebGL 2.
- Post-processing is the real divergence. WebGL has the mature `EffectComposer` addon chain. WebGPU has `RenderPipeline` and TSL, still churning across r183-r186.
- The offline PWA constraint matters: any WebGPU path must still fall back cleanly. WebGPURenderer does this automatically, which is a point in its favour, but its rename churn means code written against r183 may not match r186.
- Bundle size: WebGPU build is larger than the WebGL build. [U] No number verified. Measure with the Vite build before deciding.

### Recommendation

**Stay on `WebGLRenderer` for r186.** Keep the renderer behind a small interface (a `GarageStage`-like class) so a WebGPU backend can be swapped in later. Revisit once you have run the game on the actual iPad with the target iPadOS, and only if you need TSL effects (e.g. custom afterburner shading) that are awkward in GLSL. Do not introduce `three/webgpu` in the same change as the realism work; it multiplies risk.

---

## 2. Image-based lighting (IBL)

### Environment map source

- The Poly Haven FAQ says all assets are CC0, including commercial use. [S] https://docs.polyhaven.com/en/faq (search snippet). Also "HDRIs come in 16k+ resolution" [S]; not confirmed on the HDRI page itself.
- Relevant Poly Haven assets from the API (type=hdris):
  - `aircraft_workshop_01` (Interiors / Industrial Workshops). Best candidate for the hangar interior. [V] https://api.polyhaven.com/assets?t=hdris
  - `aviation_museum` (Parks / outdoor) and `aviation_museum_hill` (Grassland hilltop, outdoor, sky). Candidates for an airfield-style exterior. [V] same
  - `aristea_wreck_puresky`, `autumn_field_puresky`, `belfast_sunset_puresky`: Pure Sky (sky only, ground removed). Useful as background with a separate ground. [V] same
  - "Derelict Airfield 01" was mentioned as a featured HDRI (Oct 2025), slug not confirmed. [S] https://renderplus.com/?p=25743
  - Not verified: whether any "carrier deck" or "runway" HDRI exists. Check `https://api.polyhaven.com/assets?t=hdris` (the full list is about 1 MB of JSON) and filter for `airfield`, `runway`, `carrier`, `hangar`.
- Resolution and file size: [U] not verified from Poly Haven. Practical guidance: IBL only needs a 1k–2k equirect for diffuse and blurred specular. The PMREM step bakes it down anyway. Only use 4k+ if the sky is visible in the background. Estimated sizes (from format math, not fetched): 2k `.hdr` RGBE is several MB before compression, so pre-convert.
- Format choice: pre-process to a single 1k–2k `.hdr` (RGBE) or half-float `.exr` at build time, store the PMREM output as a cube/equirect KTX2 or an UltraHDR JPG if you want a smaller download. Do not ship 16k sources to the iPad. [M]

### Loading

- `UltraHDRLoader` exists: r183 changelog mentions "Add support for ISO 21496-1 gainmap metadata" [V] https://github.com/mrdoob/three.js/releases/tag/r183. Import path `three/addons/loaders/UltraHDRLoader.js` [M], not fetched. Its docs page was not retrievable in this session.
- `RGBELoader` / `EXRLoader` in `three/addons/loaders/` [M]. Widely used; verify in r186 examples before relying.

### PMREM

```ts
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; // [M] path

const hdr = await new RGBELoader().loadAsync('/env/aircraft_workshop_1k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromEquirectangular(hdr).texture; // [M] method name
hdr.dispose(); pm.dispose();
```

- r186 replaces the separable blur with a spiral blur in PMREMGenerator [V] (release page). Init cost is slightly different but not a concern at one-time load.
- r184 fixed envMap and background rotation [V]. Use `scene.environmentRotation` if you need to align the hangar lights with the aircraft (verify property name in docs).
- `scene.environmentIntensity` is already used in stage.ts:82. Start at 1.0 with the HDRI; the RoomEnvironment value of 0.9 was tuned for a grey room.

### Background: HDRI vs ground-projected skybox

- `GroundedSkybox` exists: `import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js'`. Constructor `(map, height, radius, resolution = 128)`. Set `skybox.position.y = height` so the ground sits at the origin. [V] https://threejs.org/docs/pages/GroundedSkybox.html
- Use it when the camera can orbit low and you want the horizon and ground to look like a real airfield. Keep `radius` larger than the camera distance (`maxDistance` in stage.ts is 15; radius 100 is safe).
- Alternative: keep the current flat disc ground and set `scene.background` to a dark gradient. Cheaper, but the object will look floating.
- Recommended: use the hangar HDRI for **lighting only** (`scene.environment`) and a separate `scene.background` colour or a dark `GroundedSkybox` for the backdrop. Avoid showing the full interior HDRI as background unless it looks right.

---

## 3. Tone mapping and colour

- Options: `NoToneMapping`, `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `AgXToneMapping`, `NeutralToneMapping`, `CustomToneMapping`. [M] constant names; the manual tone-mapping page was not retrievable (returned navigation only). Verify in `src/renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js` at r186.
- `NeutralToneMapping` is the one to use for accurate product colour: the three.js editor switched default to Neutral in r183 [V] (commit ceda42c in the r183 release notes). That is a strong signal the maintainers consider it the accurate default.
- `AgXToneMapping` gives softer highlight roll-off and desaturates bright colours toward white. Good for sun glare on a gloss paint, but it shifts saturated paint (e.g. a bright red livery) more than Neutral. [M]
- `ACESFilmicToneMapping` (current stage.ts) adds a warm/contrast shift and is known to push saturated colours toward orange and cyan. This is why a kid's chosen bright paint may look wrong. [M]
- Exposure: `renderer.toneMappingExposure`. Set once after choosing the curve, then tune the HDRI intensity, not the exposure.
- sRGB: colour textures and `MeshStandardMaterial.color` are interpreted as sRGB by three.js (set `texture.colorSpace = THREE.SRGBColorSpace` for canvas textures). Environment HDRs are linear. Forgetting `colorSpace` on canvas paint textures is the most common washed-out / over-bright bug. [M]

### Recommendation

```ts
r.toneMapping = THREE.NeutralToneMapping; // [M] constant name
r.toneMappingExposure = 1.0;
```

Then compare against AgX on a real iPad with a bright livery and pick. Set it once, not per-material.

---

## 4. Materials

All values below are **[M]**: standard PBR reference ranges, not fetched from a source. Tune on the device.

Use `MeshPhysicalMaterial` for anything with clearcoat or iridescence, `MeshStandardMaterial` for everything else (cheaper). Add `roughnessMap` and `normalMap` from canvas (section 5).

| Surface | Material | metalness | roughness | Extras |
|---|---|---|---|---|
| Matte military grey (FS-grey) | Physical | 0 | 0.55–0.7 | no clearcoat; slight `roughnessMap` variation |
| Satin / semi-gloss paint | Physical | 0 | 0.35–0.45 | `clearcoat 0.6`, `clearcoatRoughness 0.2` |
| Gloss demo-team paint | Physical | 0 | 0.15–0.25 | `clearcoat 1`, `clearcoatRoughness 0.03–0.08` |
| Flaked / metallic paint | Physical | 0.6–0.9 (with flake map) | 0.3–0.5 | clearcoat 1; use a sparkle normal map, not a flat metal |
| Bare aluminium / raw metal | Standard | 1 | 0.25–0.4 | slightly darker colour than chrome; roughness map for wear |
| Titanium (burned nozzle) | Physical | 1 | 0.35–0.5 | `iridescence 0.6–1`, `iridescenceIOR ~1.3`, thickness range for heat tint |
| Gloss black radome / intake | Physical | 0 | 0.1 | clearcoat 1 |
| Glass canopy (gold-tinted) | Physical | 0 | 0.02–0.05 | `color` a gold tint, `metalness 0`, `iridescence 0.2–0.4` for thin-film sheen; avoid `transmission` (see below) |
| Rubber tyres | Standard | 0 | 0.85–0.95 | sidewall text via roughness map |
| Gunmetal / steel stations | Standard | 0.9 | 0.45 | `roughnessMap` for scratches |

Notes:

- `transmission` on `MeshPhysicalMaterial` forces an extra opaque-scene render pass. On iPad this is a real cost for one hero object plus hangar. Fake the gold canopy with colour, low roughness, reflections from the HDRI and `iridescence`. [M]
- Clearcoat is cheap enough on one object. The truck already uses it on glass only (truck.ts:24). Extend it to the paint.
- r186 added retroreflective materials (MeshPhysicalMaterial retroreflectivity; environment lighting support) [V] (release page). Useful for runway markings or high-vis stripes; not needed for the core jet.
- Emissive: keep afterburner emissive values in the shader (section 8), not in the material, to avoid bloom-everywhere artefacts.

---

## 5. Surface detail without downloading internet textures

All generated at runtime from canvas (no extra bytes to bundle, works offline).

### Panel lines, rivets, stencils

- Draw on a 2048×2048 (or 1024×1024) canvas: panel lines with `strokeStyle` at low alpha, rivet rows as `arc()` fills, stencil text with `fillText`.
- Use the same canvas as a **roughness map** (grey values: paint 0.4 vs panel lines 0.7) and a **bump/normal map** derived from it. Canvas-to-normal: compute height from luminance with a Sobel filter in JS; or use a pre-written shader on a `ShaderMaterial` (more code). [M]
- Keep roughness and colour maps separate: `map` (colour, sRGB) vs `roughnessMap` (linear, read the green channel) vs `normalMap` (linear). Set `colorSpace = SRGBColorSpace` only on `map`. [M]
- Use `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` (capped to 4 on iPad) for panel lines at grazing angles. [M]

### Weathering and roughness variation

- A low-frequency noise canvas (value noise, 512×512, tiled) multiplied into the roughness map gives subtle paint variation; this is far more convincing than uniform roughness.
- Add a grime/dust gradient in the lower third (darker, rougher) as a second map multiplied into `map`.

### Decals

- Option A: `DecalGeometry` from `three/addons/geometries/DecalGeometry.js` (exists in addons; [M] not verified in r186). Projects a mesh onto a target surface. Best for stencils on curved fuselage.
- Option B: project a UV canvas. Keep your existing side-projection approach from truck.ts (the header says "one canvas texture for Paint and Decals projected from the side") and extend it to the top and belly. Cheaper and already proven in this codebase.
- Recommendation: Option B for the livery (one texture), Option A only for a few stencils that need to wrap.

### AO

- Realistic AO for a static hero: bake it. Options:
  - Vertex AO: compute ambient occlusion per vertex by raycasting from each vertex against the mesh (done once at build time). Cheap at runtime, good for the wheel wells and intake.
  - Baked AO map: generate a canvas/texture per part from a simple cavity heuristic (darken concave areas). Lower quality, zero runtime cost.
- Runtime AO passes (SSAO/GTAO) are covered in section 7; avoid them on iPad unless the baked approach fails.

---

## 6. Shadows and grounding

### Shadow type in r186

- `PCFSoftShadowMap` is removed in r186 and now warns [V] (release notes). stage.ts:74 must change. Use `THREE.PCFShadowMap` (3×3 PCF) for a soft-enough edge; `VSMShadowMap` gives softer edges but light bleeding on the wing/fuselage join [M].
- r186 `SunLight` with cascaded shadow maps [V] (release page). Use it instead of the existing `DirectionalLight` sun if the hangar/airfield needs a sun over a long object. Import path [U] not verified; check `three/addons/lights/SunLight.js` in the r186 examples.

### Shadow budget (iPad)

- A single 2048×2048 directional shadow map is affordable. Keep frustum tight around the jet (current ±4 is about right for the truck; a jet is ~15 m long, so widen to ±8 and use 2048 or 3072 at most).
- Set `sun.shadow.normalBias` (about 0.02) and `bias` (about −0.0005) to avoid acne on the fuselage; tune on device.
- Spot shadows: 1024 max. The current spot uses 1024 (stage.ts:89).

### Contact shadow / baked shadow under the aircraft

- The three.js contact-shadow example does not use a ContactShadows class; it renders the occluders from below with an orthographic camera into a `WebGLRenderTarget`, blurs it with `HorizontalBlurShader` and `VerticalBlurShader` from `three/addons/shaders/`, and projects it onto a transparent plane. [V] (technique and imports) https://threejs.org/examples/webgl_shadow_contact.html
- For a jet on a hangar floor: the blurred contact shadow is the best grounding cue and is cheap. Re-render only when the jet changes (not per frame) because the jet is static.
- Simplest version: bake the contact shadow into a canvas radial gradient under the aircraft, stretched to the wheel footprint. Zero runtime cost. [M]
- Do not stack the contact shadow on top of a live shadow map from the same light; keep one of them.

---

## 7. Post-processing

### Path choice

- **WebGLRenderer + `EffectComposer`** (three addons): mature; the path to take. Import paths from memory [M]: `three/addons/postprocessing/EffectComposer.js`, `RenderPass.js`, `OutputPass.js`, `UnrealBloomPass.js`, `SMAAPass.js`, `GTAOPass.js`. Verify in the r186 `examples/jsm/postprocessing/` folder.
- **pmndrs `postprocessing`** library: [U] not fetched this session. It is a common alternative for WebGL with a tighter pass-merging model. Consider only if the three addons get expensive.
- **WebGPU `RenderPipeline`**: renamed from `PostProcessing` in r183 [V]. Manual says EffectComposer is not supported under WebGPU [V]. Not needed if you stay on WebGL.

### Which effects, and cost on an iPad

| Effect | Worth it? | Notes / cost estimate [M] |
|---|---|---|
| MSAA (`antialias: true` or render-target `samples: 4`) | Yes | Cheapest real AA. With composer, use a `WebGLRenderTarget` with `samples: 4`. |
| SMAA | Yes (if composer) | Good quality, post-pass only; cheaper than MSAA on the composer path. |
| FXAA | Fallback only | Blurry; skip if SMAA is used. |
| Bloom (UnrealBloomPass) | Yes, for afterburner | Keep threshold high so only emissive flames bloom. Use half resolution. Several passes; moderate cost. |
| SSAO / GTAO | Probably not | Full-screen depth pass; noticeable on iPad. Use baked AO (section 5). |
| Depth of field | Optional | Only for a "cinematic" photo mode. Medium cost. |
| Vignette / colour grade | Yes, cheap | One pass, or fold into `OutputPass`. |
| Film grain / chromatic aberration | No | Dated look; costs a pass. |

### Pixel ratio and dynamic resolution

- Current: `min(devicePixelRatio, 2)` (stage.ts:73). Keep it.
- Add a frame-time governor: if average frame time > 22 ms for 1 s, step the render scale down (1.0 → 0.85 → 0.7), and back up when stable. Apply via `renderer.setPixelRatio` or `composer.setPixelRatio`. [M]
- Do not render the composer at full DPR and the scene at half: keep them the same to avoid blur mismatch.

---

## 8. Effects that are cheap

### Afterburner flame

- Cone mesh (`ConeGeometry`, open-ended, 32–48 segments) with a `ShaderMaterial` or `MeshBasicMaterial` + `AdditiveBlending`, `depthWrite: false`, `side: DoubleSide`. stage.ts:90 already uses this pattern for the spotlight beam. [V] (repo pattern)
- Fragment shader: radial falloff from the axis, a time-based noise for flicker, and a diamond pattern (shock diamonds) from `sin(z * k)` modulated by radius. Colour ramp from white-blue at the nozzle to orange-red at the tail. [M]
- Bloom picks up the emissive peak; no separate light needed. Optional point light at the nozzle with low intensity for lighting the aft fuselage. [M]
- Cost: one draw call, one fragment shader; negligible on iPad.

### Heat haze

- Screen-space distortion by a noise texture behind the flame. Requires rendering the scene to a texture first (extra full-screen pass). Medium cost. Skip unless the flame is the hero moment; a fake with a distorted, low-alpha cone is cheaper. [M]

### Propeller motion blur disc

- For a prop aircraft (P-51) only: a transparent disc with a radial gradient canvas texture, rotated in the render loop; hide the blades when spinning. One draw call. Not relevant to a jet.

### Missile / smoke trails

- Ribbon geometry with a fading vertex alpha, updated per frame from a small ring buffer of positions. Cheap. Use instancing for puffs (section 9).
- Fade in opacity over ~1 s, shrink and drift; additive is too bright, normal blending with low alpha is better for smoke. [M]

### Vapour / contrail

- Same ribbon technique with a white-blue gradient. Behind the wingtips at high-g turns only, toggled by a flag.

---

## 9. Performance budget and iPad specifics

### Known constraints

- iPad Safari WebGL 2 is fully supported. WebGPU is available on iPadOS 26+ per secondary sources [S] (section 1).
- Safari WebGL context loss under memory pressure is a known behaviour when many large textures or render targets are live. [M] Keep total GPU memory small: aim for < 200 MB of textures and render targets for the whole scene, though this number is an estimate [U].
- Handle context loss: listen for `webglcontextlost` on the canvas, `preventDefault()`, and recreate renderer resources on `webglcontextrestored`. [M]

### Draw calls and triangles

- Target: under ~150 draw calls and under ~300k triangles for the jet plus hangar. These are [M] practical figures for a mid-range mobile GPU, not measured on this device.
- Merge static parts: `BufferGeometryUtils.mergeGeometries` (in `three/addons/utils/BufferGeometryUtils.js`) per material. Keep rivets and panel lines in the texture, not as geometry.
- Instancing: `InstancedMesh` for repeated parts (rivets if geometric, missiles on pylons, flares). [M]

### Shader compile hitches

- Call `renderer.compile(scene, camera)` (WebGL) before the first visible frame; r186 lets `compile()` accept Node Materials and honour clipping [V] (release page). Show a loading screen until it returns.
- WebGPU equivalent `compileAsync` (non-blocking since r184) [V].

### Frame-on-demand rendering

- The current loop renders every frame (stage.ts:298). For a hero object on a static stage, render only when something changes: a camera tween, a control `change`, an animation tick, or a resize. Otherwise skip `renderer.render`.
- Continuous animation (afterburner flicker) should keep the loop running only while the jet is shown and an effect is active.
- Implementation: keep `requestAnimationFrame` but gate `renderer.render` on a `dirty` flag; set `dirty = true` from `OrbitControls` `change`, from the afterburner tick, and from any tween.

### Instancing and memory

- Use texture atlases for decal and stencil maps (one 2048 canvas, not many). Each texture costs memory and a bind.
- Dispose old textures and geometry on re-paint. The current truck code already does this via `dispose()`.

---

## 10. Concrete recipe (ordered by realism gain per cost)

Assumes staying on WebGLRenderer. Paths and names marked [M] must be verified in the r186 source before use.

1. **Fix the r186 break first.** `stage.ts:74`: change `THREE.PCFSoftShadowMap` to `THREE.PCFShadowMap`. Otherwise r186 warns and falls back. [V]

2. **Replace RoomEnvironment with a real HDRI (lighting only).**
   ```ts
   import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; // [M]
   const hdr = await new RGBELoader().loadAsync('/env/aircraft_workshop_1k.hdr');
   hdr.mapping = THREE.EquirectangularReflectionMapping;
   scene.environment = pm.fromEquirectangular(hdr).texture; // [M]
   hdr.dispose();
   ```
   Pre-convert to a 1k–2k file and precache for offline (service worker). Remove the `RoomEnvironment` import.

3. **Switch tone mapping to Neutral.**
   ```ts
   r.toneMapping = THREE.NeutralToneMapping; // [M]
   r.toneMappingExposure = 1.0;
   ```
   Re-tune the sun and hemi intensities down (the HDRI now lights the scene). Expect the stage to look darker before it looks better.

4. **Paint and metal materials.** Replace the paint `MeshStandardMaterial` with `MeshPhysicalMaterial` (`clearcoat: 1`, `clearcoatRoughness` 0.05–0.2, `roughness` 0.2–0.5 depending on the finish). Canopy: physical, `roughness` 0.03, gold `color`, `iridescence` 0.3, no transmission.

5. **Ground and contact shadow.** Replace the flat circle with `GroundedSkybox` (background) plus a baked radial contact-shadow canvas under the jet. Keep one shadow method.

6. **Panel lines, rivets, stencil maps.** Canvas `roughnessMap` and `normalMap` from a single procedural source, plus a low-frequency noise multiply for paint variation. Use `colorSpace = SRGBColorSpace` on `map` only.

7. **Shadows.** Widen the sun frustum to fit the jet (±8), keep 2048, set `normalBias` ~0.02. Consider `SunLight` (r186) if you want cascades for a large hangar scene [U import path].

8. **Afterburner.** Additive cone with a shock-diamond fragment shader. Bloom only on that object.

9. **Bloom and SMAA (composer).** Add `EffectComposer` with `RenderPass`, `UnrealBloomPass` (half resolution, high threshold), `SMAAPass`, `OutputPass`. Only if the frame budget allows; test on device first.

10. **Frame-on-demand + compile.** Gate `renderer.render` on a `dirty` flag. Call `renderer.compile` before the first visible frame. Add `webglcontextlost` handling.

11. **Optional, later.** Vertex AO bake for wheel wells; decals with `DecalGeometry` for wrapped stencils; WebGPU backend behind the renderer interface once tested on the iPad.

---

## 11. Open questions and things I could not verify

- **[U]** Exact Poly Haven resolutions, file sizes and licence text on the HDRI page. The HDRI page fetch returned navigation only. The API JSON was fetched, but no file sizes.
- **[U]** Whether a true "airfield" or "carrier deck" HDRI exists. The API list is partial (first ~1 MB only). Filter the full list locally with `curl` and `jq`.
- **[U]** UltraHDRLoader import path and usage; docs page not retrievable.
- **[U]** `NeutralToneMapping` / `AgXToneMapping` docs text; the manual tone-mapping page returned only navigation. Behaviour descriptions are [M].
- **[U]** GroundedSkybox example source for the exact `map` input format (equirect vs PMREM).
- **[U]** `SunLight` import path and parameters.
- **[U]** Current `EffectComposer` addon names and r186 status; checked only via memory.
- **[U]** The iPad's Safari and iPadOS version; WebGPU on-by-default for iPadOS 26 comes from secondary sources [S].
- **[U]** Safari Metal buffer limits on current iPad hardware; the 256 MB / 993 MB figures are from an old article.
- **[U]** Real frame-time numbers. Everything in section 9 is an estimate and must be measured on the iPad (Safari Web Inspector timeline or a `performance.now()` overlay).
- **[U]** Bundle size difference between `three` and `three/webgpu` builds.
- **[U]** Whether PMREM output needs `scene.environmentRotation` for hangar lights to line up with the jet.

---

## 12. Sources

- three.js WebGPURenderer manual (import paths, fallback, init): https://threejs.org/manual/en/webgpurenderer.html
- three.js WebGPURenderer docs page (fallback, forceWebGL): https://threejs.org/docs/pages/WebGPURenderer.html
- three.js GroundedSkybox docs: https://threejs.org/docs/pages/GroundedSkybox.html
- three.js contact shadow example (technique): https://threejs.org/examples/webgl_shadow_contact.html
- three.js releases: r183 https://github.com/mrdoob/three.js/releases/tag/r183, r186 https://github.com/mrdoob/three.js/releases/tag/r186 (also r184, r185 via the release index https://github.com/mrdoob/three.js/releases)
- WebKit Safari 26.1 features (WebGPU fixes): https://webkit.org/blog/17541/webkit-features-for-safari-26-1/
- WebKit Safari 27.0 features (WebGPU clip_distances): https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- Safari 26 WebGPU shipping news (secondary): https://discuss.privacyguides.net/t/news-from-wwdc25-webkit-in-safari-26-beta/28226
- WebGPU + three.js migration guide (secondary, 2026): https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- Poly Haven FAQ (CC0): https://docs.polyhaven.com/en/faq
- Poly Haven HDRI API (asset list): https://api.polyhaven.com/assets?t=hdris
- Poly Haven "Derelict Airfield 01" mention (secondary): https://renderplus.com/?p=25743

Not fetched successfully: `https://polyhaven.com/a/aircraft_hangar` (404), `https://threejs.org/manual/#en/tone-mapping` (navigation only), `https://threejs.org/examples/webgpu_postprocessing_ao.html` (no code returned; the example is `webgpu_ambient_occlusion` per the fetch result).
