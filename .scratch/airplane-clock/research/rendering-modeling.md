# Airplane Clock: how to model 14 aircraft (research)

Status: research note, not a decision record. Dates: 2026-10-16.
Verification key: **[V]** = fetched or confirmed in a source this session. **[S]** = seen only in a search snippet, not fetched. **[U]** = unverified, from general knowledge or inference. Not legal advice; licence points need a human check before shipping.

---

## 0. Summary

- Recommend **Option A: procedural in code, driven by per-aircraft data specs and a shared builder** (see section 6). Same family of techniques as `src/garage/three/truck.ts` (extruded profiles, lathe-turned parts, canvas texture projected onto the shell).
- Reason in one line: it is the only option that is licence-clean by construction, consistent across 14 aircraft, small in download size, animatable, and agent-maintainable. Its weak point is fine surface detail, which a six-year-old will not judge.
- Pre-made glTF from third parties: viable only for CC0 sources, and even then you get 14 different scales, node trees, UV layouts and quality levels. Use only as reference, not as shipped assets.
- OpenVSP: its licence (NOSA 1.3) is fine for a build step **[V]**, but the Hangar's community models have no blanket licence I could verify **[V for the lack of a blanket licence; the Hangar page 404'd]**. OpenVSP is a good **geometry-reference tool**, not a shipped-asset pipeline, and I could not confirm glTF export.

---

## 1. Procedural in code: techniques

### 1.1 Fuselage loft (the core primitive)

Model the fuselage as **stations along the X axis**. Each station has a cross-section described by width `w`, height `h`, a superellipse exponent `n`, and a vertical centre `zc`. Each station is sampled as a ring of N points.

Superellipse ring at parameter t in [0, 2π):

```
x = station.x
y = zc + (h/2) * sgn(cos t) * |cos t|^(2/n)
z = (w/2)  * sgn(sin t) * |sin t|^(2/n)
```

- `n = 2` gives an ellipse. `n` around 2.5-3 gives a rounder-square fighter section. `n` above 4 gives a box-like intake or a flat-bottomed belly.
- Connect adjacent rings with two triangles per quad. Cap the nose and tail with a fan to a single vertex (or a tiny ring). Use an **indexed** BufferGeometry, then `computeVertexNormals()`. Duplicate the seam vertex (t = 0 and t = 2π) if you need crisp UVs; otherwise normals show a seam.
- **UVs come for free from the loft**: `u = ring index / N` (around the body), `v = station.x normalised to length` (along the body). This gives you a livery texture space that tiles cleanly. See section 5.
- Splines: keep the station table as data (about 15-30 stations per fuselage). Interpolate `w`, `h`, `zc` with a monotone cubic or Catmull-Rom between stations for a smoother curve than linear. Do not interpolate the superellipse exponent; step it at stations.
- Non-circular cross-sections (SR-71 chines, F-117 faceted body, A-10 flat belly) are better as separate **lofted panels** or as a small set of extra lofts that share stations. The F-117 is faceted, so a smooth loft will look wrong: for that one, build flat triangulated facets from the planform.

Estimate: the loft routine is about 80-120 lines of TypeScript. Each fuselage spec is about 20-40 lines of data.

### 1.2 Airfoil wings

- **NACA 4-digit thickness** (symmetric base): for chord fraction x in [0, 1],

  ```
  yt = 5 t [0.2969 √x − 0.1260 x − 0.3516 x² + 0.2843 x³ − 0.1015 x⁴]   (t = thickness/chord)
  ```

  The -0.1015 coefficient gives an open trailing edge. Use -0.1036 for a closed one. Add camber from the 2-digit (m, p) parameters for the cambered mean line if you want a real airfoil shape (e.g. the P-51's laminar section). For a stylised toy, the symmetric base is enough.
- Build each **wing section** as a closed 2D loop (upper surface then lower surface, sharing LE and TE points), then loft between spanwise stations.
- Planform parameters per wing: root chord, tip chord, span (or half-span), leading-edge sweep angle (or sweep at 25% chord), dihedral angle, incidence and twist (added per station), thickness-to-chord ratio at root and tip.
- Taper, sweep and dihedral are all computed per station from the planform, so a variable-sweep F-14 wing is just the same wing rebuilt at a different sweep, or driven as a pivot (section 4).
- **Rounded tips**: close the tip with a half-ellipse cap (a few rings of decreasing chord) rather than a flat face. Flat tips look wrong at toy-level viewing distance.
- Mirror the wing about the fuselage centreline for the second side. Keep one half in the data, and mirror in code (set `mirrored: true`), so there is no asymmetric typo.

Estimate: the airfoil plus loft code is about 120-180 lines. Each wing spec is about 10-15 lines.

### 1.3 Tails

- Horizontal stabiliser: same planform loft as a wing, with its own sweep and dihedral. Twin-tail jets (F-14, F-15, F/A-18, F-22) are two mirrored instances. The F-4 and F-14 tails are often anhedral or "canted": use `dihedral` (negative).
- Vertical fin: a planform loft in the vertical plane. Use a `plane: 'vertical'` option so the same builder works.
- Ventral fins, strakes and canards: same builder, smaller spec.
- The A-10 and F-14 tails are special: twin fins and a pronounced shape. Expressing these as several small planform specs is cleaner than adding special cases.

### 1.4 Intakes

- Pod or "D-shape" intakes (F-16, F-35, F/A-18 side intakes, F-117 faceted ones): use a **fuselage-style loft** whose stations are a short run with `n = 3-5` and a closed-ellipse-to-rounded-rectangle transition. The easy trick is a superellipse with a large exponent for the front lip.
- Side intakes on the F/A-18: build as a short loft attached to the body, with a dark "duct" disk at the mouth (a `CircleGeometry` in `MeshStandardMaterial` black).
- Keep the intake's inner mouth dark with a separate small mesh, not a true inner duct. Nobody will look inside at 6 years old on an iPad.

### 1.5 Canopies

- Preferred: a **partial ellipsoid** from `SphereGeometry(1, 32, 16, phiStart, phiLength, thetaStart, thetaLength)`, scaled to the canopy's length/width/height and rotated so the pointed end meets the fuselage. A glass material (`MeshPhysicalMaterial` with a low-roughness, slightly tinted colour) is cheap.
- Canopy frame: a thin ring or bar drawn by a `TubeGeometry` along the frame path (optional).
- The SR-71 and F-14 have two cockpits (F-14 has two seats side by side, SR-71 has two in tandem): model these as two ellipsoids on one spec.

### 1.6 Engine nacelles and exhausts

- `LatheGeometry(points, segments)` is the natural tool. The profile is a list of `Vector2` points (x = radius, y = height along the axis, with three.js lathing around the Y axis). Rotate the result to align with the aircraft's X axis. Points should be ordered consistently; reversing them flips the normals **[U - the LatheGeometry docs page did not load, so the signature is from memory: `new LatheGeometry(points, segments = 12, phiStart = 0, phiLength = 2π)`]**.
- Afterburner nozzle: lathe a short flared profile, with an emissive orange-to-white `MeshBasicMaterial` inside for the afterburner "glow". Use a `MeshBasicMaterial` with `toneMapped: false` for a bright look.
- Prop spinner and engine cowl: lathe.
- The F4U's and P-51's radial and inline engines: a lathe for the cowl and a few cylinders for the cylinder heads.

### 1.7 Propellers

- Blade: a planform loft of an airfoil section, with twist (pitch increases towards the root). Two to four blades around the hub.
- Spinning disc: a `CircleGeometry` in a semi-transparent material, shown while the prop is "spinning" (a toy effect, not a physical one).
- Hub: lathe.

### 1.8 Existing references and libraries

- **three.js itself**: `LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, `SphereGeometry` (with the `phi`/`theta` range) are the building blocks. Docs navigation was reachable [V] but the detail pages did not load, so signatures are from memory [U].
- **PierreEVEN/ThreeFlightSimulator** (GitHub) [S]: a three.js flight simulator with a quickly modelled cockpit. Not a lofted-fuselage example. Not useful as a reference for aircraft geometry.
- **CodePen NewKrok/pen/VYjeYQE** [S]: a primitive-based airplane generator (separate body, wing and propeller meshes). Shows the simplest possible approach, not a realistic one.
- **three.js discourse "modified lathe geometry"** [S]: a thread on lathing from a path, which is close to lofting along a spine.
- No maintained three.js library for procedural aircraft was found in this research [U - searches were not exhaustive].

### 1.9 How realistic can it look?

- Good enough for a recognisable silhouette at iPad size if the planform, fuselage stations and tail placement are taken from published dimensions. The eye reads silhouette and proportion first.
- Not photoreal. Expect no rivet detail, no panel lines unless you add them via a normal or decal texture, and simplified intakes and nozzles. For a six-year-old this is a feature, not a bug.
- Smooth normals on the fuselage and wings (`computeVertexNormals` on the indexed mesh, plus the seam fix) give a clean look. Use `flatShading: false` everywhere except the F-117 facets.
- Code per aircraft: about 150-300 lines of data (spec only), since the builder is shared. Shared builder: roughly 600-1,000 lines in total across loft, wing, nacelle, hardpoint, and part-pivot code. These are estimates [U].

---

## 2. OpenVSP pipeline

### 2.1 What OpenVSP is

- NASA's open-source parametric aircraft geometry tool. Licence: **NASA Open Source Agreement (NOSA) version 1.3** [V - openvsp.org/license.shtml]. The page states the software is "released under the terms and conditions of the NASA Open Source Agreement (NOSA)" and that the agreement says it does not endorse "results, resulting designs" [V]. A Wikipedia snippet also names NOSA 1.3 [S - en.wikipedia.org/wiki/OpenVSP].
- OSI-approved status of NOSA is not stated on the page [V - not stated]. Treat it as a permissive, licence-reviewed tool, and check with a human before relying on that claim.
- Source is on GitHub [V - openvsp.org home page]. Mesh exports include **STL, OBJ and TRI** [S - vspu.larc.nasa.gov training content, via search]. The scripting API exposes an export function with a file-type enum that includes STL, IGES, SVG and others [S - openvsp.org/api_docs/latest].
- **glTF export: not found** [U - no source in this session lists glTF as an OpenVSP export format]. Plan to export OBJ or STL and convert with a separate tool (Blender or `gltf-transform` cannot convert OBJ on its own; use Blender `--background` or a separate converter).

### 2.2 The VSP Hangar and Airshow

- The original VSP Hangar page returned 404 [V - openvsp.org/hangar.shtml]. The search result says the VSP Hangar was a database of community-contributed models, and that the successor is **VSP Airshow** (airshow.openvsp.org), with all previous models migrated [S].
- The Airshow page fetched only as a title with no content [V - empty fetch]. Its description in the search snippet says it is "free to use" and that users can upload, download and comment on models [S].
- **Licence per model: not found.** The search found no blanket licence for community models [S]. One HAW Hamburg dataset of an A320 is CC BY-NC-SA 4.0 [S] - that is a single dataset, not the Hangar.
- I could **not** confirm whether the Hangar or Airshow contains models of the 14 aircraft in the list. **[U - unverified; needs a manual browse of airshow.openvsp.org]**.

### 2.3 Viability of a build-time pipeline (OpenVSP -> STL/OBJ -> committed GLB)

Viable in principle, with these caveats:

1. The model's licence must be checked **per upload**. Without a verified licence, nothing can be committed.
2. OpenVSP output is a tessellated mesh (STL/OBJ), with no UVs and no named parts, so you need extra work for livery texturing and moving parts. Moving parts would need separate exports per part (the OpenVSP "component" system helps, but this is not verified here).
3. Scripting makes it repeatable: an OpenVSP `.vsp3` model plus a `vspscript` (or the API) export step can run in a build, but this is unverified in this session.
4. Mesh resolution follows workspace tessellation settings [S], so file size needs checking.

**Verdict:** OpenVSP is a useful **design reference** (open a Hangar model, read its planform and sections, and copy the numbers into your data spec). It is not a clean asset pipeline for this project. Keep it out of the shipped build.

---

## 3. Pre-made glTF models

### 3.1 Sources and licences

| Source | Licence (checked) | Aircraft models? | Notes |
|---|---|---|---|
| **Kenney** (kenney.nl) | CC0. "all game assets on the asset pages are public domain licensed (CC0)". Attribution not required, but "Do not use our logo." [V - kenney.nl/support] | No fighters seen; first page had roads, cave, dungeon, forest [V] | Best licence, weak aircraft coverage. |
| **Quaternius** (quaternius.com) | Licence not shown on the fetched page; the site has a "License" link [V - licence unseen] | Vehicle and ship packs; no fighter jets listed [V] | Licence **unverified** on the page. Check the License page before use. |
| **Poly Pizza** (poly.pizza) | Not shown on the fetched page. A "Terms" link exists [V - licence unseen] | Not seen [V] | Licence per model must be read on each model page. |
| **Sketchfab** | Per model: CC0, CC BY, CC BY-SA, CC BY-ND, CC BY-NC, or Sketchfab "Standard" [S - help.sketchfab.com search snippets]. CC BY-NC blocks commercial use; CC BY-ND blocks modification (retopology, repaint, conversion) [S]. | Many aircraft exist [U - not searched individually] | Licence is set per upload. Read each model's licence field. Standard licence may not need credit but may restrict use [S]. |
| **Smithsonian Open Access** | CC0 for 3D (2020 Sketchfab launch) [S - sketchfab.com/blogs/community/sketchfab-launches-public-domain-dedication-for-3d-cultural-heritage]. The Smithsonian page itself returned 403 [V]. | Not checked. Mainly cultural objects, not aircraft as far as I know [U] | Current licence status **unverified**. |
| **NASA 3D Resources** (science.nasa.gov/3d-resources) | "All of these assets are free to download and use." Refers to NASA Images and Media Usage Guidelines, which were not fetched [V]. Public domain status and the NASA logo restriction are **unverified** [U]. | No aircraft seen on the first page [V]. Format filter lists glb, stl, openvsp, etc. [V] | Filter has an "Aircraft" category; not checked further [U]. |
| **CC0 general** | Creative Commons CC0 1.0: no attribution required; you should not imply endorsement [V - creativecommons.org]. | - | Safest licence type. |

### 3.2 Attribution and "NC/ND" rules for this project

- **CC0**: safe. No attribution needed (but credit anyway, it is good practice).
- **CC BY**: safe if you attribute. Put the credit in an in-app credits screen and in the repo's README. Attribution must name the author, the licence and a link.
- **CC BY-SA**: share-alike applies to derivative works, which a re-painted or re-shaped model is. Your game code is not a derivative of the model, but the model file in the bundle is. Usually workable, but check with a human.
- **CC BY-NC / NC-anything**: not usable on a public site that is free but may have ads or donations later. Treat as unusable.
- **CC BY-ND / ND-anything**: not usable for the modding system, because the game repaints and rebuilds parts. Unusable.
- **Sketchfab "Standard"**: read its terms; not verified here.
- Also: public domain does not clear trademarks or insignia. Real unit badges, service roundels and manufacturer logos may be trademarked [U - general principle, not checked]. Use generic markings.

### 3.3 Consistency problems across 14 authors

Expect each of these to differ per model, and budget work for each:

- **Scale and units**: metres, feet, arbitrary. Normalise with a per-model scale and an origin correction.
- **Orientation**: some point down -Z, some +Z, some use Y-up, some Z-up. Apply a fixed rotation per source.
- **Node names and hierarchy**: wings may be merged into the fuselage, or split into 40 meshes. Parts such as "left wing" are not reliably named.
- **UVs**: unwrapped differently, often with overlapping islands, which breaks any canvas livery.
- **Materials**: PBR vs. legacy, texture sizes from 512 to 8192, baked lighting.
- **Quality and polycount**: from 5k to 500k triangles. Decimation needed.
- **Moving parts**: almost never rigged in a way you can use. Usually hinge pivots are wrong or absent.
- **Hardpoints**: none. Attach points must be added by hand per model.

### 3.4 Re-colouring liveries on arbitrary UVs

- Works only if UVs are non-overlapping and the texture is an albedo you can replace. Otherwise you must bake a new texture or use a triplanar shader (section 5.4).
- Typical workaround: replace the whole albedo map with your own canvas, painted in the UV space of the model. Needs per-model UV inspection.
- Tail numbers and shark mouths need placement by UV coordinates, found by hand per model.

### 3.5 File size and optimisation

- `gltf-transform` CLI [V - gltf-transform.dev/cli]: `gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp` runs the common steps in one command. Other useful commands: `draco`, `meshopt`, `quantize`, `simplify`, `weld`, `prune`, `dedup`, `resize`, `etc1s`/`uastc` (KTX2/Basis), `webp`.
- Draco vs. meshopt: meshopt is faster to decode and works well with the browser pipeline. Draco gives smaller files but needs a decoder. Choose one per project and test on iPad Safari [U].
- Textures are the main size cost: 2048 px PNG per model is 2-6 MB; WebP or KTX2 cuts this a lot [U - rough estimates].
- Realistic budget for 14 real-world models after optimisation: 1-3 MB each, so 15-40 MB total, which is heavy for an offline PWA on iPad [U]. Procedural meshes are a few KB of code each.

### 3.6 Verdict on pre-made models

Pre-made glTF is viable **only** for a small set of CC0 models with matching orientation, UVs and part structure. It is not viable as the main approach for 14 aircraft with mods. Use it as a reference for real proportions and as a fallback for objects the procedural builder cannot easily make (e.g. a detailed F-35 canopy frame).

---

## 4. Hybrid options

Three realistic hybrids:

- **H1 - Procedural base, authored small parts**: procedural fuselage, wings and tails; a few small hand-made glTF parts (e.g. the F-35's canopy frame, a tail hook, a radome). Keeps licence risk to a few small files. Needs an extra asset-licence check per part.
- **H2 - Spec-as-data, shared builder (recommended)**: an agent writes a JSON or TS spec (stations, planforms, nacelle profiles, hardpoints, moving parts). A single builder turns the spec into meshes. Agents only write data, not geometry code. See section 6.
- **H3 - Procedural weapons, procedural aircraft, offline reference models**: same as H2, plus OpenVSP or CC0 models used as reference for numbers only, never shipped.

**Weapons** (AIM-9, AIM-120, Mk-82, JDAM, drop tank, Maverick, rocket pod) are a good fit for procedural. Typical shape is a lathe body plus 4 extruded fins (`ExtrudeGeometry` of a fin outline), plus a seeker nose if needed. Each weapon is about 15-30 lines of spec. Rocket pods are a lathe with a grid of 19 or 7 tubes (InstancedMesh or cylinders). Drop tanks are a lathe with a pylon.

---

## 5. Liveries on procedural meshes

### 5.1 UVs from the lofted fuselage

- Fuselage loft gives `u = around the ring`, `v = along the length` for free. Map a single 2048 x 1024 (or 4096 x 2048 if needed) canvas to the fuselage.
- Left and right sides get the same u-range (it's a symmetric loft). A decal that is placed on one side appears mirrored on the other. Fix: for the left side, mirror u (`u' = 1 - u`) when painting, or have the builder emit separate u-ranges for left and right halves.
- The top and bottom of the fuselage are at the ends of u (around the ring), so camo that spans the top needs both halves of the texture.

### 5.2 UVs for wings and tails

- Planar projection, not loft UVs: for a wing, use `u = chord fraction`, `v = span fraction`, which lays out the wing top surface as a rectangle. Use a separate canvas (or a second region of the same atlas) per wing.
- Tails: project from the side (`u = x`, `v = y`) for the fins; project from the top for the stabilisers.

### 5.3 Atlas strategy

- One atlas per aircraft is simplest: fuselage top half, fuselage bottom half, wing upper, wing lower, fin side, fin other side, stabiliser, etc. Each part has a rectangle in the atlas. Rectangles are data in the spec (`uvRect: [u0, v0, u1, v1]`).
- Paint in code with the Canvas 2D API, the same way `truck.ts` uses canvas textures for its side paint. Build the atlas once per paint change.
- Tail numbers, shark mouth, roundels and stripes are drawn into the canvas at the atlas rectangle of the relevant part, using the spec's coordinates.
- Camo: procedural blob patterns (noise or Voronoi-ish blobs) drawn in the canvas. Keep blob shapes deterministic (seeded) so the same paint looks the same each time.

### 5.4 Triplanar mapping as an alternative

- A custom `onBeforeCompile` shader on a `MeshStandardMaterial` that samples the livery texture three times (x, y, z projection) and blends by normal. Removes the UV problem entirely, at the cost of a shader patch, and decals still need a 3D position.
- Triplanar can smear on long fuselages at the seams between projections. It looks wrong on a clean fighter fuselage with a sharp tail number. **Not recommended for decals.** Good for camo only.

### 5.5 Recommended: atlas UVs from the loft/planform, with canvas paint

- Simpler to reason about, deterministic, fast, and the same mechanism for all 14 aircraft.
- Decal placement uses the same coordinates as the spec (station x, ring angle).

---

## 6. Recommendation

**Pick: H2. Procedural builder driven by per-aircraft data specs, with a small library of shared builders, and canvas-atlas livery.** Not pre-made glTF for the main models.

### 6.1 Why

| Criterion | Procedural + spec (H2) | Pre-made glTF | OpenVSP pipeline |
|---|---|---|---|
| Realism (silhouette) | Good with real dimensions | Varies: from good to poor | Good (real geometry), but mesh only |
| Consistency across 14 | Strong: one builder | Weak: 14 authors | Medium: one tool, many user models |
| Licence safety | Clean by construction; only the dimensions are facts (not copyrightable in general, [U]) | Depends per model; NC/ND ruled out; attribution management | NOSA tool is fine; per-model licence unknown |
| Offline size | Tiny: code and data only | 15-40 MB estimated [U] | Similar to pre-made, per export |
| Animate parts | Built-in: pivot groups | Needs rigging per model | Needs per-part export |
| Attach mods (hardpoints, paint) | Built-in: spec data | Manual per model | Manual per model |
| Agent maintainability | High: agents edit data specs | Low: binary assets, no diffs | Medium: tool chain, binary files |

### 6.2 Trade-offs accepted

- Lower fine detail than the best CC0 models. Acceptable for a 6-year-old.
- Upfront builder work (roughly 1-2 weeks of focused work [U]). Paid back across 14 aircraft.
- Dimensions must be sourced. Use public published fact sheets (manufacturer and government data). Record the source per aircraft in the spec's comment field. Facts are not copyrightable, but expression (e.g. copied drawings or photos) is, so do not copy images or 3D meshes.

### 6.3 Recommended next steps

1. Build the shared loft, planform, lathe and atlas-paint primitives with unit tests (pure functions, no WebGL) in `src/garage/three/airplane/`.
2. Build one aircraft end to end (F-16 is a good first choice: simple planform, one intake, one canopy, one fin).
3. Add the paint atlas and check mirror and seam issues on an iPad.
4. Add moving parts (F-14 sweep first, since it needs a pivot only).
5. Add hardpoints and weapon specs.
6. Write the other 13 as data specs, using the same builder.

---

## 7. TypeScript data model (sketch)

All dimensions in metres. Y is up, X is forward (nose at +X), Z is to the right (the builder mirrors wings and tails where `mirrored: true`). These are sketches, not final.

```ts
// src/garage/three/airplane/spec.ts  (sketch)

export type Vec3 = [number, number, number];

/** One station along the fuselage. Shape is a superellipse, not a fixed template. */
export interface Station {
  x: number;          // position along the fuselage (nose at +x, so larger x is further forward)
  w: number;          // width (full)
  h: number;          // height (full)
  zc?: number;        // vertical centre offset (default 0)
  n?: number;         // superellipse exponent (default 2.5)
  yc?: number;        // lateral centre offset (default 0), for asymmetry
}

export interface Fuselage {
  stations: Station[];         // ordered nose to tail (any order is fine if the builder sorts)
  ringSegments?: number;       // default 48
  /** Optional separate loft for a sub-part sharing stations (e.g. a belly or chine). */
  extras?: { name: string; stationRange: [number, number]; offset: Vec3; scale: Vec3 }[];
}

/** A wing or tail surface, defined by planform, sections and dihedral. */
export interface Surface {
  id: string;                  // e.g. "wing", "htail", "vtail"
  root: Vec3;                  // root leading-edge point on the fuselage
  rootChord: number;
  tipChord: number;
  span: number;                // half-span for a wing; full height for a vtail
  sweepLE: number;             // leading-edge sweep in degrees
  dihedral?: number;           // degrees (negative = anhedral)
  incidence?: number;          // degrees, applied to all stations
  twist?: number;              // degrees, tip relative to root
  thicknessRoot: number;       // t/c, 0.03-0.12 typical
  thicknessTip: number;
  camber?: { m: number; p: number }; // NACA 2-digit camber, optional
  tipRound?: boolean;          // default true: half-ellipse cap
  mirrored?: boolean;          // default true for wings and htails
  plane?: 'horizontal' | 'vertical'; // default horizontal
  /** Named section sets for paint atlas; each entry maps a surface side to an atlas rect. */
  uvRects?: Partial<Record<'upper' | 'lower' | 'side', [number, number, number, number]>>;
  /** Moving part (e.g. F-14 sweep) */
  pivot?: { axis: Vec3; at: Vec3; min: number; max: number; default: number };
}

export interface Nacelle {
  id: string;
  at: Vec3;
  axis: Vec3;                  // direction of flow (from intake to nozzle)
  profile: Vec2Profile;        // lathe profile, see below
  segments?: number;
  afterburner?: { length: number; radius: number };
}

/** Lathe profile: points (r, along), r >= 0. Built into LatheGeometry. */
export type Vec2Profile = [number, number][];

export interface Intake {
  id: string;
  at: Vec3;
  axis: Vec3;
  stations: Station[];         // a short loft, same format as Fuselage
  mouth?: { w: number; h: number; dark: true };
}

export interface Canopy {
  id: string;
  at: Vec3;
  length: number;
  width: number;
  height: number;
  seats?: 1 | 2;               // two-seat canopies (F-14, SR-71)
  frameWidth?: number;         // optional tube frame
}

export interface Propeller {
  id: string;
  at: Vec3;
  axis: Vec3;
  blades: number;
  diameter: number;
  hubRadius: number;
  bladeProfile: { chord: number; thickness: number; twistRoot: number; twistTip: number };
}

export interface Hardpoint {
  id: string;                  // "wingL_1", "centerline", etc.
  at: Vec3;                    // attach point in airframe space
  orientation: Vec3;           // Euler (or axis) of mounted stores
  allowed: ('missile' | 'bomb' | 'pod' | 'tank' | 'flare' | 'none')[];
  /** Named sizes allowed (e.g. "AIM-9" only on wingtip rails). */
  sizeLimit?: number;
}

export interface MovingPart {
  id: string;                  // "wingSweep", "nacelleTilt", "bayDoor", "foldWing"
  kind: 'rotate' | 'translate';
  pivot: Vec3;
  axis: Vec3;
  range: [number, number];     // radians or metres
  default: number;
  /** Which mesh ids this part moves (from the built groups). */
  targets: string[];
}

export interface Livery {
  base: string;                // hex colour
  stripes?: { y: number; h: number; colour: string }[];
  camo?: { seed: number; colours: string[] };
  tailNumber?: { text: string; colour: string; surface: 'fin' | 'side' };
  sharkMouth?: boolean;
  roundel?: boolean;
  tailArt?: { id: string; scale: number };
}

export interface AircraftSpec {
  id: 'sr71' | 'f4' | 'f4u' | 'p51' | 'p38' | 'f14' | 'f15' | 'f16' | 'fa18' | 'f22' | 'f35' | 'a10' | 'v22' | 'f117';
  name: string;
  /** Source for the dimensions. Facts only. */
  dimensionSource: string;
  fuselage: Fuselage;
  surfaces: Surface[];
  intakes?: Intake[];
  canopy?: Canopy;
  nacelles?: Nacelle[];
  propellers?: Propeller[];
  hardpoints: Hardpoint[];
  movingParts?: MovingPart[];
  atlasSize: [number, number];
  defaultLivery: Livery;
}
```

### 7.1 Shared builder functions

Each returns a `THREE.BufferGeometry` or a `THREE.Group`. Pure functions, no WebGL context needed, so they can be unit-tested in Node.

```ts
// src/garage/three/airplane/builders.ts  (sketch)

buildFuselage(f: Fuselage): BufferGeometry          // superellipse loft; sets uv (u around, v along)
buildSurface(s: Surface): BufferGeometry            // planform + NACA sections; mirrors if needed
buildTipCap(section: Section): BufferGeometry       // half-ellipse cap at tips
buildNacaSection(t: number, m?: number, p?: number, n: number): Vec2[]  // closed loop
buildIntake(i: Intake): BufferGeometry             // reuses buildFuselage
buildCanopy(c: Canopy): BufferGeometry             // partial ellipsoid, glass material
buildNacelle(n: Nacelle): BufferGeometry           // LatheGeometry wrapper
buildPropeller(p: Propeller): Group                // blades + hub + disc
buildWeapon(kind: 'missile' | 'bomb' | 'pod' | 'tank', size): Group  // lathe body + fins
buildPylon(h: Hardpoint): BufferGeometry           // small box/extrude
buildMovingGroup(parts: MovingPart[], meshes: Map<string, Object3D>): Map<string, Object3D>  // pivot hierarchy
applyAtlasUv(geo: BufferGeometry, rect: [number, number, number, number], mode: 'loft' | 'planar-x-y' | 'planar-x-z'): void
paintAtlas(spec: AircraftSpec, livery: Livery, atlas: HTMLCanvasElement): void  // Canvas 2D: base, stripes, camo, tail number
buildAircraft(spec: AircraftSpec, livery: Livery): { root: Group; moving: Map<string, Object3D>; hardpoints: Map<string, Object3D> }
```

Notes on the functions:

- `buildFuselage` and `buildIntake` share one loft routine.
- `buildSurface` mirrors when `mirrored` is true; never author both sides in data.
- `applyAtlasUv` with `mode: 'loft'` uses ring index and station index; the planar modes project from the named axis pair and then map into the `uvRect`.
- `paintAtlas` is the only function that touches the DOM, so tests can stub it.

Code estimate: the builders above are 600-1,000 lines of TS plus about 200 lines of tests [U]. Each aircraft spec is 150-300 lines of data [U].

### 7.2 Example spec fragment (F-16, partial, illustrative)

```ts
// Illustrative only: numbers are NOT verified against a source.
const f16: Partial<AircraftSpec> = {
  id: 'f16',
  fuselage: {
    stations: [
      { x: 0.0, w: 0.0, h: 0.0, n: 2 },   // nose point
      { x: 1.2, w: 0.6, h: 0.5, n: 2.5 },
      { x: 4.0, w: 1.0, h: 1.0, n: 2.6 },
      { x: 9.0, w: 1.0, h: 1.2, n: 2.5 },
      { x: 14.0, w: 0.9, h: 1.0, n: 2.6 },
      { x: 15.0, w: 0.0, h: 0.0, n: 2 },  // tail point
    ],
  },
  surfaces: [
    { id: 'wing', root: [7.0, 0, 0.6], rootChord: 4.5, tipChord: 1.2, span: 4.5,
      sweepLE: 40, dihedral: 0, thicknessRoot: 0.035, thicknessTip: 0.03 },
  ],
};
```

Note: the F-16 values above are placeholders. Replace with dimensions from a published fact sheet, with the source recorded in `dimensionSource`.

---

## 8. Moving parts and mods (how they fit the model)

- Each moving part is a `THREE.Group` pivot. The mesh is parented to the pivot; the pivot is placed at the spec's `pivot.at` and rotated about `pivot.axis`.
- **F-14 wing sweep**: pivot at each wing root, axis along the span (Z), range 20-68 degrees (to be verified against a fact sheet [U]). The fuselage is not split; the wing mesh is rebuilt at the new sweep, or simply rotated about the pivot.
- **V-22 nacelle tilt**: pivot at the wing tip nacelle, axis along the span, range 0-90 degrees. Nacelle mesh moves; the prop disc moves with it.
- **Bay doors** (F-35 weapons bay, F-22): a child mesh with a pivot at its hinge line. Two states (open/closed) plus an in-between.
- **Folding wings** (F/A-18, F-14 carrier fold, A-10?): pivot at the fold line, axis along the chord. Note that the A-10 does not fold; leave it out.
- **Paint and camo** are data: `Livery` changes call `paintAtlas` and update the texture. No geometry rebuild.
- **Hardpoints** are `Object3D` anchors. Weapons are built by `buildWeapon` and attached at the hardpoint's transform. The spec's `allowed` list controls the UI.
- **Engines**: `Nacelle.afterburner` toggles an emissive material; the prop `blades` or disc toggles between blades and disc for "spinning".

---

## 9. Open questions and unverified items

- [U] Whether OpenVSP exports glTF directly (not found; assumed no).
- [U] Whether the VSP Airshow hosts models of the 14 aircraft, and their licences (Airshow content did not load).
- [U] Smithsonian's current 3D licence (its page returned 403).
- [U] Quaternius and Poly Pizza licences (page did not show the licence text).
- [U] Sketchfab licence on any specific aircraft (not searched per model).
- [U] NASA 3D Resources public-domain status and NASA logo rule (linked guidelines not fetched).
- [U] three.js `LatheGeometry` signature (docs detail page did not load; from memory).
- [U] Dimension values for all 14 aircraft (not researched; need published fact sheets).
- [U] Performance and file-size estimates (rough, not measured).
- [U] NOSA's OSI status (not stated on the licence page).
- [U] Trademark and insignia rules for real aircraft markings (general principle only; not checked).
- Not legal advice. A human should review licence choices before any model file is committed.

---

## 10. Sources

Verified by fetch [V]:
- https://openvsp.org/license.shtml (NOSA 1.3)
- https://openvsp.org/ (licence link, GitHub source)
- https://science.nasa.gov/3d-resources/ (fetched via redirect from nasa3d.arc.nasa.gov)
- https://kenney.nl/support (CC0, attribution optional, do not use logo)
- https://creativecommons.org/publicdomain/zero/1.0/ (CC0 summary)
- https://quaternius.com/ (licence not shown; no aircraft packs)
- https://poly.pizza/ (licence not shown)
- https://www.kenney.nl/assets (no licence line; no aircraft)
- https://gltf-transform.dev/cli (command list)

Seen in search results [S] (not fetched or partially fetched):
- https://en.wikipedia.org/wiki/OpenVSP (NOSA 1.3 mention)
- https://vspu.larc.nasa.gov/training-content/chapter-4-import-and-export-capabilities/exporting-models/triangulation-exports/ (STL, TRI, OBJ)
- https://openvsp.org/api_docs/latest/group___file_i_o.html (export function, file-type enum)
- https://sketchfab.com/blogs/community/sketchfab-launches-public-domain-dedication-for-3d-cultural-heritage (Smithsonian CC0, 2020)
- https://help.sketchfab.com/en/articles/16152217 (Sketchfab licence descriptions)
- https://sketchfab.com/blogs/community/an-introduction-to-creative-commons-licenses
- https://airshow.openvsp.org (Airshow, free to use; page content not loaded)
- https://github.com/PierreEVEN/ThreeFlightSimulator
- https://codepen.io/NewKrok/pen/VYjeYQE
- https://discourse.threejs.org/t/modified-lathe-geometry/9234

Failed or blocked (not used for claims):
- https://openvsp.org/hangar.shtml (404)
- https://openvsp.org/wiki/doku.php?id=openvsp_vsp_hangar (placeholder page, no content)
- https://www.si.edu/openaccess, https://www.si.edu/openaccess/faq, https://www.si.edu/termsofuse (403)
- https://threejs.org/docs/#api/en/geometries/LatheGeometry (navigation only)
