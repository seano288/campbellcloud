// Builds an Aircraft from its spec: lofted bodies and surfaces, nozzles, propellers and landing gear, then dresses it for
// its Fit: the livery atlas for Paint, Nose Art, Tail Art and the Tail Number; stores for Weapons; flames for Engine;
// tinted glass for Canopy; and lights. It sits parked on its wheels, nose toward -x, centred on the origin.
// Once built, its ambient occlusion is baked into every vertex and the soft contact shadow under it is drawn (ao.ts).
import * as THREE from 'three';
import { colourById, PROP_JETS, type Fit, type Rung, type SlotId } from '../catalog';
import { AO_SHARED, bakeAO, contactShadow, withAO } from './ao';
import { bladeGeometry, canopyFrame, crew, gearLeg, intake, nozzleParts, PILOT } from './details';
import { flameLook, glow, plume, propDisc } from './effects';
import { creased, loftBody, loftSurface, mirrored, sectionAt, type V3 } from './geometry';
import { GOLD, paintAtlas, plainScheme, type Scheme, type Shape } from './livery';
import { DETAIL, FIXED, glassMaterial, linerMaterial, paintMaterial, SHARED } from './materials';
import type { JetSpec, Leg } from './spec';
import { loadout, STORE_MATERIALS, type Loadout } from './stores';

export interface EngineState {
  /** 0 off, 1 running: flames grow and props spin up. */
  throttle: number;
}

export interface BuiltJet {
  root: THREE.Group;
  airframe: THREE.Group;
  anchors: Record<SlotId, THREE.Object3D>;
  pivots: Map<string, THREE.Object3D>;
  /** Where smoke comes out: left wingtip, tail, right wingtip (airframe coordinates). */
  smokeFrom: [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  /** Gun muzzles, where Take Off's tracers start (airframe coordinates). */
  guns: THREE.Object3D[];
  /** The stores fitted now that can be fired or dropped (not drop tanks), each tagged by stores.ts. */
  firable(): THREE.Object3D[];
  size: { length: number; span: number; height: number };
  /** The soft shadow on the floor right under it (y = 0, in the root's coordinates); the stage places and fades it. */
  contact: THREE.Mesh;
  /** How long the build took, and the occlusion bake within it (ms). */
  timing: { build: number; ao: number };
  dress(fit: Fit): void;
  update(dt: number, t: number, engine: EngineState): void;
  dispose(): void;
}

const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);

export function schemeFor(spec: JetSpec, fit: Fit): Scheme {
  switch (fit.paint) {
    case 0: return fit.colour === 'factory' ? spec.livery.factory : plainScheme(colourById(fit.colour).hex);
    case 1: return spec.livery.camo;
    case 2: return spec.livery.squadron;
    case 3: return spec.livery.airshow;
    case 4: return GOLD;
  }
}

/** One-piece canopies, with no windscreen bow. */
const FRAMELESS = new Set(['f16', 'f22', 'f35']);

export function buildJet(spec: JetSpec, fit: Fit): BuiltJet {
  const t0 = performance.now();
  const loads: Loadout = spec.loads ?? {};
  const root = new THREE.Group(), airframe = new THREE.Group();
  root.add(airframe);
  const pivots = new Map<string, THREE.Object3D>();
  const holder = (part?: string, left = false) => {
    if (!part) return airframe;
    const key = left ? `${part}:L` : part;
    let h = pivots.get(key);
    if (!h) {
      const p = spec.pivots?.find(q => q.part === part);
      const at = p ? v3(p.at) : new THREE.Vector3();
      if (left) at.z = -at.z;
      const pivot = new THREE.Group();
      pivot.position.copy(at);
      const inner = new THREE.Group();
      inner.position.copy(at).negate();
      pivot.add(inner);
      airframe.add(pivot);
      pivot.userData.axis = p ? (left ? new THREE.Vector3(-p.axis[0], -p.axis[1], p.axis[2]) : v3(p.axis)) : new THREE.Vector3(0, 1, 0);
      pivots.set(key, pivot);
      h = pivot;
    }
    return h.children[0]!;
  };

  const painted: THREE.Mesh[] = [], glass: THREE.Mesh[] = [], prop = PROP_JETS.includes(spec.id);
  // small parts: kept out of the livery's bounds (they hang in a group of their own)
  const details = new THREE.Group();
  airframe.add(details);
  const detailHolders = new Map<string, THREE.Group>();
  const detail = (geo: THREE.BufferGeometry, mat: THREE.Material | 'paint', part?: string, left = false) => {
    let h: THREE.Object3D = details;
    if (part) {
      const key = left ? `${part}:L` : part;
      let g = detailHolders.get(key);
      if (!g) { g = new THREE.Group(); holder(part, left).add(g); detailHolders.set(key, g); }
      h = g;
    }
    const m = new THREE.Mesh(geo, mat === 'paint' ? undefined : mat);
    m.castShadow = true; m.receiveShadow = true;
    if (mat === 'paint') painted.push(m);
    h.add(m);
    return m;
  };
  const place = (geo: THREE.BufferGeometry, finish: string | undefined, part: string | undefined, left: boolean, flat?: boolean) => {
    // faceted parts (the F-117) shade every face flat; the rest keep smooth curves but crisp edges
    const g = flat ? geo.toNonIndexed() : finish === 'glass' ? geo : creased(geo);
    if (flat) g.computeVertexNormals();
    const m = new THREE.Mesh(g, finish && finish !== 'paint' && finish !== 'glass' ? FIXED[finish as keyof typeof FIXED] : undefined);
    m.castShadow = true; m.receiveShadow = true;
    if (!finish || finish === 'paint') painted.push(m);
    if (finish === 'glass') { glass.push(m); m.castShadow = false; }
    holder(part, left).add(m);
    return m;
  };

  for (const b of spec.bodies) {
    const sides = b.mirror && b.z ? [b.z, -b.z] : [b.z ?? 0];
    for (const z of sides) {
      const left = z < 0 && !!b.mirror;
      const built = loftBody(b.sections, { z, segs: b.segs ?? 40, openFront: b.openFront, openBack: b.openBack });
      place(built.skin, b.finish, b.part, left, b.flat);
      // an open front is an intake: a duct back to the engine's fan (a scoop or a muzzle just ends dark)
      if (built.front) for (const q of intake(b, z, !prop && !b.finish && Math.min(...b.sections.map(c => c.w)) > 0.18)) detail(q.geo, q.mat, b.part, left);
      if (built.back) place(built.back, 'dark', b.part, left);
      if (b.finish === 'glass' && !b.flat) for (const g of canopyFrame(b, z, b.frames ?? (FRAMELESS.has(spec.id) ? [] : [0.3]))) detail(g, 'paint', b.part, left);
    }
  }
  for (const s of spec.surfaces) {
    const geo = loftSurface(s.stations, s.chordPts ?? (s.kind === 'blade' ? 8 : 12));
    place(geo, s.finish, s.part, false, s.flat);
    if (s.mirror !== false) place(mirrored(geo), s.finish, s.part, true, s.flat);
  }

  // in the cockpit: a tub, an ejection seat and a pilot in a helmet, visor down
  for (const seat of spec.seats ?? [spec.cockpit]) details.add(...crew(seat, !prop));

  // nozzles, and a flame at each one
  const flames: THREE.Mesh[] = [], nozzleGlows: THREE.Sprite[] = [], liner = linerMaterial();
  for (const n of spec.nozzles) for (const side of n.mirror && n.at[2] ? [1, -1] : [1]) {
    const at = [n.at[0], n.at[1], n.at[2] * side] as const;
    const w = n.flat ? n.flat.w : n.r, h = n.flat ? n.flat.h : n.r;
    for (const q of nozzleParts(n, at, liner)) detail(q.geo, q.mat, n.part, side < 0);
    if (spec.flame === 'round' || spec.flame === 'flat') {
      const f = plume(Math.min(w, h) * 0.9, 1);
      f.position.set(at[0] + 0.02, at[1], at[2]);
      if (n.flat) f.scale.set(1, h / Math.max(w, h), w / Math.max(w, h));
      f.userData.r = Math.max(w, h);
      holder(n.part, side < 0).add(f);
      flames.push(f);
      const gl = glow(0xff8a3a, Math.max(w, h) * 2.2);
      gl.position.set(at[0] + 0.05, at[1], at[2]);
      holder(n.part, side < 0).add(gl);
      nozzleGlows.push(gl);
    }
  }
  for (const s of spec.stacks ?? []) for (const side of [1, -1]) { // piston exhaust: short flames from each stack
    const f = plume(0.05, 1);
    f.position.set(s[0], s[1], s[2] * side);
    f.rotation.y = side * 0.5;
    f.userData.r = 0.05;
    airframe.add(f);
    flames.push(f);
  }

  // propellers
  const props: { spin: THREE.Group; disc: THREE.Mesh; blades: THREE.Group; dir: number }[] = [], spinning: THREE.Object3D[] = [];
  for (const p of spec.props ?? []) for (const side of p.mirror && p.at[2] ? [1, -1] : [1]) {
    const at = new THREE.Vector3(p.at[0], p.at[1], p.at[2] * side), hub = p.r * 0.16;
    const spin = new THREE.Group();
    spin.position.copy(at);
    const spinner = loftBody([{ x: -p.spinner, w: 0.01, top: 0.01, bot: 0.01 }, { x: -p.spinner * 0.6, w: hub * 0.75, top: hub * 0.75, bot: hub * 0.75 }, { x: 0, w: hub, top: hub, bot: hub }], { segs: 28, rings: 10 }).skin;
    const sm = new THREE.Mesh(spinner, undefined);
    painted.push(sm);
    const blades = new THREE.Group(), c = (p.chord ?? 0.3) * 1.15, dir = side as 1 | -1;
    // twisted blades, satin black with yellow tips (each blade its own geometry, so each bakes its own occlusion)
    for (let k = 0; k < p.blades; k++) {
      const bladeGroup = new THREE.Group();
      bladeGroup.add(new THREE.Mesh(bladeGeometry(p.r, c, 0.1, 0.9, dir), DETAIL.blade), new THREE.Mesh(bladeGeometry(p.r, c, 0.9, 1, dir), DETAIL.tip));
      bladeGroup.rotation.x = (k * Math.PI * 2) / p.blades;
      blades.add(bladeGroup);
    }
    const disc = propDisc(p.r);
    disc.position.x = -0.12;
    disc.visible = false;
    spin.add(sm, blades);
    const h = holder(p.part, side < 0);
    h.add(spin, disc);
    disc.position.add(at);
    props.push({ spin, disc, blades, dir: side });
    spinning.push(spin);
  }

  // landing gear, then sit it on its wheels
  const legs = [spec.gear.nose, spec.gear.tail].filter((l): l is Leg => !!l);
  for (const l of legs) airframe.add(gearLeg(l, l.z ?? 0, painted));
  const m = spec.gear.main;
  airframe.add(gearLeg(m, m.z ?? 0, painted), gearLeg(m, -(m.z ?? 0), painted));
  const contact = (l: Leg) => l.y - l.len - l.r;
  const other = spec.gear.tail ?? spec.gear.nose;
  const pitch = other ? Math.atan((contact(m) - contact(other)) / (other.x - m.x)) : 0;
  airframe.rotation.z = pitch;
  airframe.updateMatrixWorld(true);
  const all = new THREE.Box3().setFromObject(airframe);

  // the paint, and the shape the painter works from
  // the livery is projected from each mesh's own (aircraft) coordinates, so its bounds are the raw geometry's
  const box = new THREE.Box3();
  for (const p of painted) { p.geometry.computeBoundingBox(); if (p.parent === airframe || p.parent?.parent?.parent === airframe) box.union(p.geometry.boundingBox!); }
  const pad = 0.05, min = box.min.clone().subScalar(pad), max = box.max.clone().addScalar(pad);
  const fus = spec.bodies[spec.fuselage ?? 0]!, at = sectionAt(fus.sections);
  const shape: Shape = {
    min: min.toArray(), max: max.toArray(), length: max.x - min.x,
    wings: spec.surfaces.filter(s => s.kind === 'wing' || s.kind === 'tail' || s.kind === 'strake').map(s => ({ stations: s.stations, kind: s.kind as 'wing' | 'tail' | 'strake' })),
    fins: spec.surfaces.filter(s => s.kind === 'fin').map(s => s.stations),
    fuselage: x => { const q = at(x); return { y: q.y, top: q.top, bot: q.bot, w: q.w }; },
    cockpit: spec.cockpit,
    exhausts: [
      ...(spec.stacks ?? []).flatMap(q => [{ at: q, r: 0.06, kind: 'stack' as const }, { at: [q[0], q[1], -q[2]] as V3, r: 0.06, kind: 'stack' as const }]),
      ...spec.nozzles.filter(n => !n.part).flatMap(n => (n.mirror && n.at[2] ? [n.at, [n.at[0], n.at[1], -n.at[2]] as V3] : [n.at]).map(q => ({ at: q, r: n.flat ? n.flat.h : n.r, kind: 'nozzle' as const }))),
    ],
  };
  const canvas = document.createElement('canvas');
  const atlas = new THREE.CanvasTexture(canvas);
  atlas.flipY = false; atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 4;
  let paint: THREE.MeshPhysicalMaterial | null = null;

  // stores and lights, rebuilt as the Fit changes
  let stores = new THREE.Group();
  airframe.add(stores);
  const wingTip = (() => {
    let best: V3 = [0, 0, 0], bestZ = -1;
    for (const s of spec.surfaces.filter(s => s.kind === 'wing')) for (const st of s.stations) if (st.le[2] > bestZ) { bestZ = st.le[2]; best = [st.le[0] + st.chord * 0.5, st.le[1], st.le[2]]; }
    return best;
  })();
  const finTop = (() => {
    const fin = spec.surfaces.find(s => s.kind === 'fin');
    const st = fin ? fin.stations[fin.stations.length - 1]! : { le: [max.x - 1, max.y, 0] as V3, chord: 1 };
    return [st.le[0] + st.chord * 0.5, st.le[1], st.le[2]] as V3;
  })();
  const lights = new THREE.Group();
  airframe.add(lights);
  const navR = glow(0xff2030, 0.5), navG = glow(0x20ff60, 0.5), navW = glow(0xffffff, 0.35);
  navR.position.set(wingTip[0], wingTip[1], -wingTip[2]); navG.position.set(...wingTip); navW.position.set(finTop[0] + 0.4, finTop[1] - 0.05, finTop[2]);
  const strobes = [glow(0xffffff, 1.6), glow(0xffffff, 1.6)];
  strobes[0]!.position.copy(navR.position); strobes[1]!.position.copy(navG.position);
  const landing = new THREE.Group();
  const beamGeo = new THREE.ConeGeometry(1.4, 9, 24, 1, true);
  beamGeo.rotateZ(Math.PI / 2); beamGeo.translate(-4.5, 0, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const noseLeg = spec.gear.nose ?? m;
  for (const z of [0.25, -0.25]) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(noseLeg.x - 0.2, noseLeg.y - noseLeg.len * 0.5, z);
    beam.rotation.z = 0.12;
    landing.add(beam, glow(0xfff6d8, 0.9).translateX(noseLeg.x - 0.2).translateY(noseLeg.y - noseLeg.len * 0.5).translateZ(z));
  }
  const under = new THREE.PointLight(0x00e5ff, 0, 9, 1.4);
  under.position.set((min.x + max.x) / 2, min.y + 0.1, 0);
  const underGlow = glow(0x00e5ff, Math.max(max.x - min.x, 4) * 0.9);
  underGlow.position.copy(under.position);
  underGlow.scale.y *= 0.25;
  const lasers = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 30, 6, 1, true).translate(0, 15, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(k / 6, 1, 0.55), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    beam.position.set(k % 2 ? navR.position.x : navG.position.x, wingTip[1], (k % 2 ? -1 : 1) * wingTip[2]);
    lasers.add(beam);
  }
  lights.add(navR, navG, navW, ...strobes, landing, under, underGlow, lasers);

  // anchors for the hotspots
  const anchor = (p: V3) => { const o = new THREE.Object3D(); o.position.set(...p); airframe.add(o); return o; };
  const fusAt = (f: number) => { const x = min.x + f * (max.x - min.x), q = at(x); return [x, q.y + q.top * 0.6, q.w * 0.9] as V3; };
  const firstStore = spec.hardpoints.find(h => h.kind !== 'belly') ?? spec.hardpoints[0];
  const engineAt: V3 = spec.nozzles[0] ? [spec.nozzles[0].at[0], spec.nozzles[0].at[1], spec.nozzles[0].at[2]] : spec.props?.[0] ? spec.props[0].at : [min.x, 0, 0];
  const anchors: Record<SlotId, THREE.Object3D> = {
    paint: anchor(fusAt(0.5)), nose: anchor(fusAt(0.08)), tail: anchor([finTop[0] - 0.4, finTop[1] * 0.85, finTop[2] + 0.1]),
    weapons: anchor(firstStore ? [firstStore.at[0], firstStore.at[1] - 0.4, firstStore.at[2]] : wingTip),
    engine: anchor(engineAt), smoke: anchor([max.x, (min.y + max.y) * 0.35, 0]), canopy: anchor([spec.cockpit[0], spec.cockpit[1] + 0.35, spec.cockpit[2]]),
    lights: anchor(wingTip), number: anchor([finTop[0] - 0.8, finTop[1] * 0.55, finTop[2] + 0.1]),
  };
  const smokeFrom: [THREE.Object3D, THREE.Object3D, THREE.Object3D] = [anchor([wingTip[0], wingTip[1], -wingTip[2]]), anchor([max.x + 0.3, engineAt[1], 0]), anchor(wingTip)];
  // guns: in the wings when a propeller fills the nose (the Mustang, the Corsair), otherwise in the nose
  const noseProp = (spec.props ?? []).some(p => !p.at[2]);
  const guns = noseProp
    ? (() => { // the leading edge, two fifths of the way out
      const st = spec.surfaces.find(q => q.kind === 'wing')!.stations, z = wingTip[2] * 0.4;
      const i = Math.max(1, st.findIndex(q => q.le[2] >= z)), p0 = st[i - 1]!, p1 = st[i] ?? p0, k = p1.le[2] > p0.le[2] ? (z - p0.le[2]) / (p1.le[2] - p0.le[2]) : 0;
      return [1, -1].map(side => anchor([p0.le[0] + (p1.le[0] - p0.le[0]) * k, p0.le[1] + (p1.le[1] - p0.le[1]) * k, z * side]));
    })()
    : [anchor((() => { const x = min.x + (max.x - min.x) * 0.04, q = at(x); return [x, q.y, 0] as V3; })())];

  // centre it (measured before lights and stores are added): wheels on the floor, middle of its length at the origin
  airframe.position.set(-(all.min.x + all.max.x) / 2, -all.min.y, -(all.min.z + all.max.z) / 2);
  const size = { length: all.max.x - all.min.x, span: all.max.z - all.min.z, height: all.max.y - all.min.y };

  // bake the ambient occlusion: everything solid receives it; what moves (props, swing wings, tilting nacelles) and
  // the glass don't cast it. Then the shared materials are swapped for the copies that read it.
  root.updateMatrixWorld(true);
  const moving = new Set<THREE.Object3D>();
  for (const o of [...pivots.values(), ...spinning]) o.traverse(q => moving.add(q));
  const receivers: THREE.Mesh[] = [];
  airframe.traverse(o => {
    if (!(o instanceof THREE.Mesh) || glass.includes(o) || o.parent === lights || lights.children.includes(o.parent!)) return;
    if (painted.includes(o) || o.material instanceof THREE.MeshStandardMaterial) receivers.push(o);
  });
  const aoMs = bakeAO(receivers, receivers.filter(o => !moving.has(o)), root);
  for (const o of receivers) if (!painted.includes(o) && o.material !== liner) o.material = withAO(o.material as THREE.Material);
  const ground = contactShadow(receivers.filter(o => !spinning.some(sp => sp === o.parent?.parent?.parent)), root);

  let fitted: Fit | null = null, engineRung: Rung = 0, smokeRung: Rung = 0, lightRung: Rung = 0;
  function dress(f: Fit) {
    const was = fitted;
    fitted = f;
    const scheme = schemeFor(spec, f);
    if (!was || was.paint !== f.paint || was.colour !== f.colour || was.nose !== f.nose || was.tail !== f.tail || was.number !== f.number || was.tailNumber !== f.tailNumber) {
      paintAtlas(canvas, shape, scheme, f);
      atlas.needsUpdate = true;
      const finish = scheme.finish ?? 'satin';
      if (!paint || paint.userData.finish !== finish) {
        paint?.dispose();
        paint = paintMaterial(atlas, min, max, finish, { ao: true });
        paint.userData.finish = finish;
        for (const p of painted) p.material = paint;
      }
    }
    if (!was || was.canopy !== f.canopy) {
      const g = glassMaterial(f.canopy);
      for (const m of glass) { (m.material as THREE.Material | undefined)?.dispose?.(); m.material = g; }
    }
    if (!was || was.weapons !== f.weapons) {
      airframe.remove(stores);
      stores.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      stores = loadout(spec.hardpoints, f.weapons, prop, loads);
      stores.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      airframe.add(stores);
    }
    engineRung = f.engine; smokeRung = f.smoke; lightRung = f.lights;
    void smokeRung;
  }

  let spinAngle = 0;
  function update(dt: number, t: number, engine: EngineState) {
    const look = flameLook(engineRung), th = engine.throttle;
    for (const f of flames) {
      const u = (f.material as THREE.ShaderMaterial).uniforms;
      u.time!.value = t; u.power!.value = look.power * th; u.diamonds!.value = look.diamonds; u.rainbow!.value = look.rainbow;
      (u.core!.value as THREE.Color).setRGB(...(look.core as [number, number, number])); (u.outer!.value as THREE.Color).setRGB(...(look.outer as [number, number, number]));
      const r = f.userData.r as number, stack = r < 0.1, len = Math.max(0.01, (stack ? 6 + engineRung * 3 : look.len) * r * (0.6 + 0.4 * th));
      f.scale.x = len;
      f.visible = th > 0.02;
    }
    for (const gl of nozzleGlows) { gl.material.opacity = 0.25 + 0.75 * th; gl.visible = th > 0.02; }
    liner.emissiveIntensity = flames.length && spec.flame !== 'stacks' ? th * look.power * 1.6 : 0;
    spinAngle += dt * (2 + th * 60);
    for (const p of props) {
      p.spin.rotation.x = spinAngle * p.dir;
      const fast = th > 0.4;
      p.blades.visible = !fast; p.disc.visible = fast;
    }
    // lights
    const blink = (t * 1.3) % 1 < 0.08;
    navR.visible = navG.visible = navW.visible = true;
    strobes.forEach(s => { s.visible = lightRung >= 1 && blink; });
    landing.visible = lightRung >= 2;
    under.intensity = lightRung >= 3 ? 25 : 0;
    underGlow.visible = lightRung >= 3;
    if (lightRung === 4) under.color.setHSL((t * 0.2) % 1, 1, 0.55);
    (underGlow.material as THREE.SpriteMaterial).color.copy(under.color);
    lasers.visible = lightRung === 4;
    lasers.children.forEach((b, k) => { b.rotation.z = Math.sin(t * 1.4 + k) * 0.9 - 0.2; b.rotation.x = Math.cos(t * 1.1 + k * 2) * 0.7; });
  }

  function dispose() {
    root.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mt of mats) if (mt && !STORE_MATERIALS.has(mt) && !SHARED.has(mt) && !AO_SHARED.has(mt) && !Object.values(PILOT).includes(mt as never)) mt.dispose();
      }
    });
    liner.dispose();
    ground.geometry.dispose(); (ground.material as THREE.MeshBasicMaterial).alphaMap?.dispose(); (ground.material as THREE.Material).dispose();
    atlas.dispose();
  }

  dress(fit);
  const firable = () => {
    const out: THREE.Object3D[] = [];
    stores.traverse(o => { if (o.userData.store && o.userData.store.kind !== 'tank') out.push(o); });
    return out;
  };
  const timing = { build: performance.now() - t0, ao: aoMs };
  root.userData.timing = timing;
  return { root, airframe, anchors, pivots, smokeFrom, guns, firable, size, contact: ground, timing, dress, update, dispose };
}
