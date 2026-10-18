// Builds an Aircraft from its spec: lofted bodies and surfaces, nozzles, propellers and landing gear, then dresses it for
// its Fit: the livery atlas for Paint, Nose Art, Tail Art and the Tail Number; stores for Weapons; flames for Engine;
// tinted glass for Canopy; and lights. It sits parked on its wheels, nose toward -x, centred on the origin.
import * as THREE from 'three';
import { colourById, PROP_JETS, type Fit, type Rung, type SlotId } from '../catalog';
import { flameLook, glow, plume, propDisc } from './effects';
import { creased, loftBody, loftSurface, mirrored, sectionAt, type Section, type V3 } from './geometry';
import { GOLD, paintAtlas, plainScheme, type Scheme, type Shape } from './livery';
import { FIXED, glassMaterial, HUB, paintMaterial, RUBBER } from './materials';
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
  dress(fit: Fit): void;
  update(dt: number, t: number, engine: EngineState): void;
  dispose(): void;
}

const PILOT = {
  suit: new THREE.MeshStandardMaterial({ color: 0x4b5a3c, roughness: 0.85 }),
  helmet: new THREE.MeshPhysicalMaterial({ color: 0xf2f2ee, roughness: 0.3, clearcoat: 1 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x1a1408, metalness: 0.9, roughness: 0.05, iridescence: 0.6, side: THREE.DoubleSide }),
};
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

function wheel(leg: Leg) {
  const g = new THREE.Group(), w = leg.r * 0.75;
  const tire: Section[] = [
    { x: -w / 2, w: leg.r * 0.62, top: leg.r * 0.62, bot: leg.r * 0.62 }, { x: -w * 0.42, w: leg.r * 0.92, top: leg.r * 0.92, bot: leg.r * 0.92 },
    { x: 0, w: leg.r, top: leg.r, bot: leg.r }, { x: w * 0.42, w: leg.r * 0.92, top: leg.r * 0.92, bot: leg.r * 0.92 }, { x: w / 2, w: leg.r * 0.62, top: leg.r * 0.62, bot: leg.r * 0.62 },
  ];
  const t = new THREE.Mesh(loftBody(tire, { segs: 28, rings: 10 }).skin, RUBBER);
  const hub = new THREE.Mesh(loftBody([{ x: -w * 0.52, w: leg.r * 0.58, top: leg.r * 0.58, bot: leg.r * 0.58 }, { x: w * 0.52, w: leg.r * 0.58, top: leg.r * 0.58, bot: leg.r * 0.58 }], { segs: 20, rings: 3 }).skin, HUB);
  g.add(t, hub);
  g.rotation.y = Math.PI / 2; // axle along z
  return g;
}

function gearLeg(leg: Leg, z: number) {
  const g = new THREE.Group(), bottom = leg.y - leg.len;
  g.userData.gear = true; // retracted in flight
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(leg.r * 0.16, 0.04), Math.max(leg.r * 0.16, 0.04), leg.len, 10), FIXED.gear);
  strut.position.set(leg.x, leg.y - leg.len / 2, z);
  g.add(strut);
  const offsets = leg.twin ? [-leg.r * 0.45, leg.r * 0.45] : [0];
  for (const o of offsets) {
    const w = wheel(leg);
    w.position.set(leg.x, bottom, z + o + (leg.twin ? 0 : Math.sign(z) * leg.r * 0.05));
    g.add(w);
  }
  // a gear door beside the strut
  const door = new THREE.Mesh(new THREE.BoxGeometry(leg.r * 1.6, leg.len * 0.45, 0.015), FIXED.gear);
  door.position.set(leg.x, leg.y - leg.len * 0.22, z + (z >= 0 ? 1 : -1) * leg.r * 0.55 + (z === 0 ? leg.r * 0.55 : 0));
  g.add(door);
  return g;
}

export function buildJet(spec: JetSpec, fit: Fit): BuiltJet {
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

  const painted: THREE.Mesh[] = [], glass: THREE.Mesh[] = [];
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
      const built = loftBody(b.sections, { z, segs: b.segs ?? 40, openFront: b.openFront, openBack: b.openBack });
      place(built.skin, b.finish, b.part, z < 0 && !!b.mirror);
      if (built.front) place(built.front, 'dark', b.part, z < 0 && !!b.mirror);
      if (built.back) place(built.back, 'dark', b.part, z < 0 && !!b.mirror);
    }
  }
  for (const s of spec.surfaces) {
    const geo = loftSurface(s.stations, s.chordPts ?? (s.kind === 'blade' ? 8 : 12));
    place(geo, s.finish, s.part, false, s.flat);
    if (s.mirror !== false) place(mirrored(geo), s.finish, s.part, true, s.flat);
  }

  // in the cockpit: a dark tub, an ejection seat and a pilot in a white helmet with a dark visor
  for (const seat of spec.seats ?? [spec.cockpit]) {
    const [x, y, z] = seat;
    const tub = new THREE.Mesh(loftBody([{ x: x - 0.9, w: 0.3, top: 0.05, bot: 0.25, y: y - 0.3 }, { x: x + 0.7, w: 0.32, top: 0.05, bot: 0.25, y: y - 0.3 }], { segs: 16, rings: 4, z }).skin, FIXED.black);
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.46), FIXED.dark);
    seatBack.position.set(x + 0.3, y - 0.15, z); seatBack.rotation.z = -0.25;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), PILOT.suit);
    body.scale.set(0.8, 1.1, 1.15); body.position.set(x + 0.1, y - 0.12, z);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), PILOT.helmet);
    helmet.position.set(x + 0.05, y + 0.22, z);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.152, 20, 12, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.32, Math.PI * 0.3), PILOT.visor);
    visor.position.copy(helmet.position);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.5), FIXED.dark);
    panel.position.set(x - 0.7, y - 0.2, z);
    airframe.add(tub, seatBack, body, helmet, visor, panel);
  }

  // nozzles, and a flame at each one
  const flames: THREE.Mesh[] = [], nozzleGlows: THREE.Sprite[] = [];
  for (const n of spec.nozzles) for (const side of n.mirror && n.at[2] ? [1, -1] : [1]) {
    const at = [n.at[0], n.at[1], n.at[2] * side] as const;
    const w = n.flat ? n.flat.w : n.r, h = n.flat ? n.flat.h : n.r, e = n.flat ? 4 : 2;
    const sections: Section[] = [
      { x: at[0] - n.len, w: w * 1.08, top: h * 1.08, bot: h * 1.08, y: at[1], n: e }, { x: at[0] - n.len * 0.35, w: w * 1.02, top: h * 1.02, bot: h * 1.02, y: at[1], n: e },
      { x: at[0], w: w * 0.92, top: h * 0.92, bot: h * 0.92, y: at[1], n: e },
    ];
    const built = loftBody(sections, { z: at[2], segs: 32, rings: 8, openBack: true });
    place(built.skin, 'nozzle', n.part, side < 0);
    place(built.back!, 'dark', n.part, side < 0);
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
  const props: { spin: THREE.Group; disc: THREE.Mesh; blades: THREE.Group; dir: number }[] = [];
  for (const p of spec.props ?? []) for (const side of p.mirror && p.at[2] ? [1, -1] : [1]) {
    const at = new THREE.Vector3(p.at[0], p.at[1], p.at[2] * side), hub = p.r * 0.16;
    const spin = new THREE.Group();
    spin.position.copy(at);
    const spinner = loftBody([{ x: -p.spinner, w: 0.01, top: 0.01, bot: 0.01 }, { x: -p.spinner * 0.6, w: hub * 0.75, top: hub * 0.75, bot: hub * 0.75 }, { x: 0, w: hub, top: hub, bot: hub }], { segs: 28, rings: 10 }).skin;
    const sm = new THREE.Mesh(spinner, undefined);
    painted.push(sm);
    const blades = new THREE.Group();
    for (let k = 0; k < p.blades; k++) {
      const c = p.chord ?? 0.3, stations = [0.15, 0.4, 0.7, 0.9, 1].map(f => ({ le: [-c * 0.6 + 0.05 * f, 0, f * p.r] as V3, chord: c * (0.8 * (1 - 0.45 * f * f) + 0.2), t: 0.1 - 0.05 * f }));
      const blade = new THREE.Mesh(loftSurface(stations, 6), FIXED.black);
      const tip = new THREE.Mesh(loftSurface([{ le: [-c * 0.45, 0, p.r * 0.88], chord: c * 0.55, t: 0.06 }, { le: [-c * 0.45, 0, p.r * 1.005], chord: c * 0.35, t: 0.05 }], 6), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 }));
      const bladeGroup = new THREE.Group();
      bladeGroup.add(blade, tip);
      bladeGroup.rotation.x = (k * Math.PI * 2) / p.blades;
      bladeGroup.children.forEach(c => { c.rotation.z = 0.35; }); // blade pitch
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
  }

  // landing gear, then sit it on its wheels
  const legs = [spec.gear.nose, spec.gear.tail].filter((l): l is Leg => !!l);
  for (const l of legs) airframe.add(gearLeg(l, l.z ?? 0));
  const m = spec.gear.main;
  airframe.add(gearLeg(m, m.z ?? 0), gearLeg(m, -(m.z ?? 0)));
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

  let fitted: Fit | null = null, engineRung: Rung = 0, smokeRung: Rung = 0, lightRung: Rung = 0;
  const prop = PROP_JETS.includes(spec.id);
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
        paint = paintMaterial(atlas, min, max, finish);
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
        for (const mt of mats) if (mt && !STORE_MATERIALS.has(mt) && !Object.values(FIXED).includes(mt) && !Object.values(PILOT).includes(mt as never) && mt !== RUBBER && mt !== HUB) mt.dispose();
      }
    });
    atlas.dispose();
  }

  dress(fit);
  const firable = () => {
    const out: THREE.Object3D[] = [];
    stores.traverse(o => { if (o.userData.store && o.userData.store.kind !== 'tank') out.push(o); });
    return out;
  };
  return { root, airframe, anchors, pivots, smokeFrom, guns, firable, size, dress, update, dispose };
}
