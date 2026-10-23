// Builds a Helicopter from its spec with Time Flies' primitives (lofted bodies and surfaces, the livery atlas, the paint
// and glass materials, the stores): fuselage, stub wings and fins, then what makes it a helicopter: main rotors on their
// masts, tail rotors (bare, canted, scissored or in a duct), pusher propellers, and skids or wheels. Rotors spin with the
// throttle and blur into a disc, and the Rotor Mods paint their tips so the spinning disc shows a ring. It sits on the
// ground, nose toward -x, centred on the origin.
import * as THREE from 'three';
import { glow } from '../../../time-flies/hangar/three/effects';
import { creased, loftBody, loftSurface, mirrored, sectionAt, type Section, type V3 } from '../../../time-flies/hangar/three/geometry';
import { GOLD, paintAtlas, plainScheme, type Scheme, type Shape } from '../../../time-flies/hangar/three/livery';
import { FIXED, glassMaterial, HUB, paintMaterial, RUBBER } from '../../../time-flies/hangar/three/materials';
import type { Leg } from '../../../time-flies/hangar/three/spec';
import { loadout, STORE_MATERIALS, type Loadout } from '../../../time-flies/hangar/three/stores';
import { colourById, type Fit, type Rung, type SlotId } from '../catalog';
import type { HeliSpec, Rotor } from './spec';

export interface EngineState {
  /** 0 stopped, 1 flying: how fast the rotors turn. */
  throttle: number;
}

export interface BuiltHeli {
  root: THREE.Group;
  airframe: THREE.Group;
  anchors: Record<SlotId, THREE.Object3D>;
  /** Where smoke comes out: left side, tail, right side (airframe coordinates). */
  smokeFrom: [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  /** The gun's muzzle, where Lift Off's tracers start. */
  guns: THREE.Object3D[];
  /** The stores fitted now that can be fired (not drop tanks), each tagged by stores.ts. */
  firable(): THREE.Object3D[];
  size: { length: number; span: number; height: number };
  dress(fit: Fit): void;
  update(dt: number, t: number, engine: EngineState): void;
  dispose(): void;
}

const PILOT = {
  suit: new THREE.MeshStandardMaterial({ color: 0x4b5a3c, roughness: 0.85 }),
  helmet: new THREE.MeshPhysicalMaterial({ color: 0x2d3a2a, roughness: 0.4, clearcoat: 1 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x1a1408, metalness: 0.9, roughness: 0.05, iridescence: 0.6, side: THREE.DoubleSide }),
};
const BLADE = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide });
const SHARED = new Set<THREE.Material>([...Object.values(FIXED), RUBBER, HUB, BLADE, ...Object.values(PILOT)]);

export function schemeFor(spec: HeliSpec, fit: Fit): Scheme {
  switch (fit.paint) {
    case 0: return fit.colour === 'factory' ? spec.livery.factory : plainScheme(colourById(fit.colour).hex);
    case 1: return spec.livery.camo;
    case 2: return spec.livery.squadron;
    case 3: return spec.livery.airshow;
    case 4: return GOLD;
  }
}

/** The Rotor Mods: the tips' colour, whether they glow, and the ring the spinning tips draw. */
export function tipLook(rung: Rung, t: number): { color: THREE.Color; glow: boolean; ring: number } {
  switch (rung) {
    case 0: return { color: new THREE.Color(0x2a2d31), glow: false, ring: 0 };
    case 1: return { color: new THREE.Color(0xf2c230), glow: false, ring: 0.35 };
    case 2: return { color: new THREE.Color(0x3cf0ff), glow: true, ring: 0.8 };
    case 3: return { color: new THREE.Color().setHSL(0.06 + Math.sin(t * 9) * 0.02, 1, 0.55), glow: true, ring: 1 };
    case 4: return { color: new THREE.Color().setHSL((t * 0.35) % 1, 1, 0.6), glow: true, ring: 1 };
  }
}

/** A cylinder from a to b (struts, cross tubes, masts). */
function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  m.castShadow = true;
  return m;
}

function wheel(leg: Leg) {
  const g = new THREE.Group(), w = leg.r * 0.75;
  const ring = (x: number, k: number): Section => ({ x, w: leg.r * k, top: leg.r * k, bot: leg.r * k });
  g.add(new THREE.Mesh(loftBody([ring(-w / 2, 0.62), ring(-w * 0.42, 0.92), ring(0, 1), ring(w * 0.42, 0.92), ring(w / 2, 0.62)], { segs: 28, rings: 10 }).skin, RUBBER));
  g.add(new THREE.Mesh(loftBody([ring(-w * 0.52, 0.58), ring(w * 0.52, 0.58)], { segs: 20, rings: 3 }).skin, HUB));
  g.rotation.y = Math.PI / 2; // axle along z
  return g;
}
function gearLeg(leg: Leg, z: number) {
  const g = new THREE.Group(), bottom = leg.y - leg.len;
  g.userData.gear = true;
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(leg.r * 0.16, 0.04), Math.max(leg.r * 0.16, 0.04), leg.len, 10), FIXED.gear);
  strut.position.set(leg.x, leg.y - leg.len / 2, z);
  g.add(strut);
  for (const o of leg.twin ? [-leg.r * 0.45, leg.r * 0.45] : [0]) {
    const w = wheel(leg);
    w.position.set(leg.x, bottom, z + o);
    g.add(w);
  }
  return g;
}

interface BuiltRotor { spin: THREE.Group; blades: THREE.Group; disc: THREE.Mesh; ring: THREE.Mesh; tips: THREE.Mesh[]; tipGlows: THREE.Sprite[]; spec: Rotor }

/** A rotor in its own frame: blades in the x-z plane, turning about y. The caller turns the frame to the rotor's axis. */
function buildRotor(r: Rotor, painted: THREE.Mesh[]): BuiltRotor {
  const frame = new THREE.Group(), spin = new THREE.Group(), blades = new THREE.Group();
  frame.position.set(...r.at);
  if (r.axis === 'z') frame.rotation.x = -Math.PI / 2; // a tail rotor on the side: its y axis points out to the right
  if (r.axis === 'x') frame.rotation.z = -Math.PI / 2; // a pusher: its y axis points aft
  const [fwd, side] = r.tilt ?? [0, 0];
  frame.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), fwd);
  frame.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), side);
  const main = r.kind === 'main', root = r.r * (main ? 0.1 : 0.18), c = r.chord;
  const tips: THREE.Mesh[] = [], tipGlows: THREE.Sprite[] = [];
  const angles = r.scissor
    ? [0, (r.scissor * Math.PI) / 180, Math.PI, Math.PI + (r.scissor * Math.PI) / 180]
    : Array.from({ length: r.blades }, (_, k) => (k * Math.PI * 2) / r.blades);
  for (const a of angles) {
    const g = new THREE.Group();
    const stations = [0, 0.5, 1].map(f => ({ le: [-c * 0.35, 0, root + (r.r * 0.86 - root) * f] as V3, chord: c * (f === 0 ? 0.8 : 1), t: 0.1 })); // the tip carries on from 0.86 r
    const blade = new THREE.Mesh(loftSurface(stations, 6), BLADE);
    const tip = new THREE.Mesh(loftSurface([{ le: [-c * 0.35, 0, r.r * 0.86], chord: c, t: 0.1 }, { le: [-c * 0.2, 0, r.r], chord: c * 0.7, t: 0.08 }], 6), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5 }));
    blade.rotation.z = main ? 0 : 0.25; // tail rotor blades are pitched to push sideways
    tip.rotation.z = blade.rotation.z;
    blade.castShadow = tip.castShadow = true;
    g.add(blade, tip);
    if (main) { const gl = glow(0xffffff, c * 3); gl.position.set(0, 0, r.r * 0.97); gl.visible = false; g.add(gl); tipGlows.push(gl); }
    tips.push(tip);
    g.rotation.y = a;
    blades.add(g);
  }
  // the hub, and on a main rotor the mast down to the fuselage
  const hub = Math.min(r.r * (main ? 0.035 : 0.09), main ? 0.32 : 0.14);
  const cap = new THREE.Mesh(loftBody([{ x: -hub * 0.7, w: hub * 0.6, top: hub * 0.6, bot: hub * 0.6 }, { x: 0, w: hub, top: hub, bot: hub }, { x: hub * 0.9, w: hub * 0.4, top: hub * 0.4, bot: hub * 0.4 }], { segs: 20, rings: 6 }).skin, HUB);
  cap.rotation.z = Math.PI / 2; // along the spin axis
  spin.add(blades, cap);
  frame.add(spin);
  if (main) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(hub * 0.45, hub * 0.6, r.mast ?? 0.5, 14), FIXED.metal);
    mast.position.y = -(r.mast ?? 0.5) / 2;
    frame.add(mast);
  }
  if (r.duct) { // the fan's shroud, painted like the fin it sits in
    const shroud = new THREE.Mesh(new THREE.TorusGeometry(r.r + r.duct * 0.5, r.duct * 0.5, 10, 40).rotateX(Math.PI / 2).scale(1, 1.6, 1), undefined);
    painted.push(shroud);
    frame.add(shroud);
  }
  // fast: a blurred disc, and a ring where the tips are
  const discTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d')!, grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, 'rgba(20,22,25,0)'); grad.addColorStop(0.15, 'rgba(20,22,25,.28)'); grad.addColorStop(0.92, 'rgba(20,22,25,.16)'); grad.addColorStop(1, 'rgba(20,22,25,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  })();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r.r, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  disc.visible = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(r.r * 0.87, r.r, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }));
  ring.visible = false;
  frame.add(disc, ring);
  return { spin: frame, blades: spin, disc, ring, tips, tipGlows, spec: r };
}

export function buildHeli(spec: HeliSpec, fit: Fit): BuiltHeli {
  const loads: Loadout = spec.loads ?? HELI_LOADS;
  const root = new THREE.Group(), airframe = new THREE.Group();
  root.add(airframe);

  const painted: THREE.Mesh[] = [], glass: THREE.Mesh[] = [];
  const place = (geo: THREE.BufferGeometry, finish: string | undefined, flat?: boolean) => {
    const g = flat ? geo.toNonIndexed() : finish === 'glass' ? geo : creased(geo);
    if (flat) g.computeVertexNormals();
    const m = new THREE.Mesh(g, finish && finish !== 'paint' && finish !== 'glass' ? FIXED[finish as keyof typeof FIXED] : undefined);
    m.castShadow = true; m.receiveShadow = true;
    if (!finish || finish === 'paint') painted.push(m);
    if (finish === 'glass') { glass.push(m); m.castShadow = false; }
    airframe.add(m);
    return m;
  };
  for (const b of spec.bodies) for (const z of b.mirror && b.z ? [b.z, -b.z] : [b.z ?? 0]) {
    const built = loftBody(b.sections, { z, segs: b.segs ?? 40, openFront: b.openFront, openBack: b.openBack });
    place(built.skin, b.finish, b.flat);
    if (built.front) place(built.front, 'dark');
    if (built.back) place(built.back, 'dark');
  }
  for (const s of spec.surfaces) {
    const geo = loftSurface(s.stations, s.chordPts ?? 12);
    place(geo, s.finish, s.flat);
    if (s.mirror !== false) place(mirrored(geo), s.finish, s.flat);
  }

  // the crew: a dark seat and a pilot in a helmet and a dark visor
  for (const [x, y, z] of spec.seats ?? [spec.cockpit]) {
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.5), FIXED.dark);
    seatBack.position.set(x + 0.32, y - 0.2, z); seatBack.rotation.z = -0.15;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), PILOT.suit);
    body.scale.set(0.8, 1.1, 1.15); body.position.set(x + 0.1, y - 0.15, z);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), PILOT.helmet);
    helmet.position.set(x + 0.05, y + 0.2, z);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.152, 20, 12, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.32, Math.PI * 0.3), PILOT.visor);
    visor.position.copy(helmet.position);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.55), FIXED.dark);
    panel.position.set(x - 0.6, y - 0.2, z);
    airframe.add(seatBack, body, helmet, visor, panel);
  }

  // rotors
  const rotors = spec.rotors.map(r => buildRotor(r, painted));
  for (const r of rotors) airframe.add(r.spin);

  // skids or wheels
  if (spec.skids) {
    const s = spec.skids;
    for (const side of [1, -1]) {
      const z = s.z * side, up = s.r * 3.5, sections: Section[] = [
        { x: s.x0 - 0.25, w: s.r * 0.8, top: s.r * 0.8, bot: s.r * 0.8, y: s.r + up }, { x: s.x0, w: s.r, top: s.r, bot: s.r, y: s.r + up * 0.25 },
        { x: s.x0 + 0.35, w: s.r, top: s.r, bot: s.r, y: s.r }, { x: s.x1, w: s.r, top: s.r, bot: s.r, y: s.r },
      ];
      const skid = new THREE.Mesh(loftBody(sections, { z, segs: 12 }).skin, FIXED.gear);
      skid.castShadow = true;
      airframe.add(skid);
      for (const st of s.struts) airframe.add(tube(new THREE.Vector3(st.x, s.r, z), new THREE.Vector3(st.x, st.y, st.z * side), s.r * 0.85, FIXED.gear));
    }
  }
  if (spec.gear) {
    const g = spec.gear;
    for (const l of [g.nose, g.tail].filter((l): l is Leg => !!l)) airframe.add(gearLeg(l, l.z ?? 0));
    airframe.add(gearLeg(g.main, g.main.z ?? 0), gearLeg(g.main, -(g.main.z ?? 0)));
  }

  airframe.updateMatrixWorld(true);
  const all = new THREE.Box3().setFromObject(airframe);

  // the paint, and the shape the painter works from (the livery is projected from each mesh's own coordinates)
  const box = new THREE.Box3();
  for (const p of painted) { p.geometry.computeBoundingBox(); if (p.parent === airframe) box.union(p.geometry.boundingBox!); }
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

  let stores = new THREE.Group();
  airframe.add(stores);

  // lights: red and green on the sides (the stub wing tips when there are some), white on the tail
  const wingTip = (() => {
    let best: V3 | null = null, bestZ = -1;
    for (const s of spec.surfaces.filter(s => s.kind === 'wing')) for (const st of s.stations) if (st.le[2] > bestZ) { bestZ = st.le[2]; best = [st.le[0] + st.chord * 0.5, st.le[1], st.le[2]]; }
    if (best) return best;
    const x = spec.cockpit[0] + 2, q = at(x);
    return [x, q.y, q.w + 0.05] as V3;
  })();
  const fin = spec.surfaces.find(s => s.kind === 'fin');
  const finTop: V3 = fin ? (() => { const st = fin.stations[fin.stations.length - 1]!; return [st.le[0] + st.chord * 0.5, st.le[1], st.le[2]]; })() : [max.x - 0.5, max.y * 0.7, 0];
  const lights = new THREE.Group();
  airframe.add(lights);
  const navR = glow(0xff2030, 0.5), navG = glow(0x20ff60, 0.5), navW = glow(0xffffff, 0.35);
  navR.position.set(wingTip[0], wingTip[1], -wingTip[2]); navG.position.set(...wingTip); navW.position.set(max.x, finTop[1] * 0.6, 0);
  const strobes = [glow(0xff3030, 1.4), glow(0xffffff, 1.6)];
  strobes[0]!.position.set(spec.rotors[0]!.at[0] + 1.5, at(spec.rotors[0]!.at[0] + 1.5).y + at(spec.rotors[0]!.at[0] + 1.5).top + 0.05, 0);
  strobes[1]!.position.set(finTop[0], finTop[1] + 0.1, finTop[2]);
  // the searchlight under the nose, shining down and ahead
  const search = new THREE.Group();
  const noseX = min.x + (max.x - min.x) * 0.12, nq = at(noseX);
  const beamGeo = new THREE.ConeGeometry(2.6, 16, 28, 1, true).translate(0, -8, 0);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.rotation.z = -0.55;
  const lamp = glow(0xfff6d8, 1.3);
  search.position.set(noseX, nq.y - nq.bot - 0.05, 0);
  search.add(beam, lamp);
  const spot = new THREE.SpotLight(0xfff2d0, 0, 40, 0.35, 0.5, 1.2);
  spot.position.copy(search.position);
  spot.target.position.set(noseX - 8, -10, 0);
  const under = new THREE.PointLight(0x00e5ff, 0, 9, 1.4);
  under.position.set((min.x + max.x) / 2, min.y + 0.1, 0);
  const underGlow = glow(0x00e5ff, Math.max(max.x - min.x, 4) * 0.9);
  underGlow.position.copy(under.position);
  underGlow.scale.y *= 0.25;
  const lasers = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 30, 6, 1, true).translate(0, 15, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(k / 6, 1, 0.55), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    b.position.set(wingTip[0], wingTip[1], (k % 2 ? -1 : 1) * wingTip[2]);
    lasers.add(b);
  }
  lights.add(navR, navG, navW, ...strobes, search, spot, spot.target, under, underGlow, lasers);

  // anchors for the hotspots
  const anchor = (p: V3) => { const o = new THREE.Object3D(); o.position.set(...p); airframe.add(o); return o; };
  const fusAt = (f: number) => { const x = min.x + f * (max.x - min.x), q = at(x); return [x, q.y + q.top * 0.6, q.w * 0.9] as V3; };
  const firstStore = spec.hardpoints.find(h => h.kind !== 'belly') ?? spec.hardpoints[0];
  const mainHub = spec.rotors[0]!.at;
  const anchors: Record<SlotId, THREE.Object3D> = {
    paint: anchor(fusAt(0.35)), nose: anchor(fusAt(0.06)), tail: anchor([finTop[0] - 0.3, finTop[1] * 0.85, finTop[2] + 0.15]),
    weapons: anchor(firstStore ? [firstStore.at[0], firstStore.at[1] - 0.35, firstStore.at[2]] : wingTip),
    rotor: anchor([mainHub[0], mainHub[1] + 0.3, mainHub[2]]), smoke: anchor([max.x, (min.y + max.y) * 0.45, 0]),
    canopy: anchor([spec.cockpit[0], spec.cockpit[1] + 0.35, spec.cockpit[2]]), lights: anchor(wingTip),
    number: anchor([finTop[0] - 0.5, finTop[1] * 0.6, finTop[2] + 0.15]),
  };
  const smokeFrom: [THREE.Object3D, THREE.Object3D, THREE.Object3D] = [anchor([wingTip[0] + 0.5, wingTip[1], -wingTip[2]]), anchor([max.x + 0.3, finTop[1] * 0.5, 0]), anchor([wingTip[0] + 0.5, wingTip[1], wingTip[2]])];
  const guns = [anchor(spec.gun)];

  // centre it (measured before lights and stores are added): on the ground, middle of its length at the origin
  airframe.position.set(-(all.min.x + all.max.x) / 2, -all.min.y, -(all.min.z + all.max.z) / 2);
  const size = { length: all.max.x - all.min.x, span: all.max.z - all.min.z, height: all.max.y - all.min.y };

  let fitted: Fit | null = null, rotorRung: Rung = 0, lightRung: Rung = 0;
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
      stores = loadout(spec.hardpoints, f.weapons, false, loads);
      stores.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      airframe.add(stores);
    }
    rotorRung = f.rotor; lightRung = f.lights;
  }

  const angles = rotors.map(() => Math.random() * Math.PI);
  function update(dt: number, t: number, engine: EngineState) {
    const th = engine.throttle, look = tipLook(rotorRung, t);
    rotors.forEach((r, i) => {
      const main = r.spec.kind === 'main', rate = main ? 1 + th * 30 : 2 + th * 90;
      angles[i] = angles[i]! + dt * rate * r.spec.dir;
      r.blades.rotation.y = angles[i]!;
      const fast = th > 0.45;
      r.blades.children[0]!.visible = th < 0.6; // the blades blur into the disc
      r.disc.visible = fast;
      (r.disc.material as THREE.MeshBasicMaterial).opacity = Math.min(1, (th - 0.4) * 3);
      if (main) {
        for (const tip of r.tips) {
          const m = tip.material as THREE.MeshStandardMaterial;
          m.color.copy(look.color);
          m.emissive.copy(look.glow ? look.color : new THREE.Color(0));
        }
        for (const g of r.tipGlows) { g.visible = look.glow && !fast; g.material.color.copy(look.color); }
        const ringMat = r.ring.material as THREE.MeshBasicMaterial;
        r.ring.visible = fast && look.ring > 0;
        ringMat.color.copy(look.color);
        ringMat.blending = look.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
        ringMat.opacity = look.ring * Math.min(1, (th - 0.4) * 3) * (look.glow ? 0.85 : 0.5);
      }
    });
    // lights
    const blink = (t * 1.1) % 1 < 0.08;
    strobes.forEach((s, k) => { s.visible = lightRung >= 1 && (k ? blink : (t * 1.1 + 0.5) % 1 < 0.08); });
    search.visible = lightRung >= 2;
    spot.intensity = lightRung >= 2 ? 60 : 0;
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
        for (const mt of mats) if (mt && !STORE_MATERIALS.has(mt) && !SHARED.has(mt)) { (mt as THREE.MeshBasicMaterial).map?.dispose(); mt.dispose(); }
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
  return { root, airframe, anchors, smokeFrom, guns, firable, size, dress, update, dispose };
}

/** What hangs under the stub wings by Weapons Rung: rocket pods, then Hellfire-sized missiles, then everything, then fireworks. */
export const HELI_LOADS: Loadout = {
  1: { tip: null, outer: 'pod', inner: 'pod', belly: null },
  2: { tip: 'aim9', outer: 'maverick', inner: 'maverick', belly: null },
  3: { tip: 'aim9', outer: 'maverick', inner: 'pod', belly: 'tank' },
  4: { tip: 'firework', outer: 'firework', inner: 'firework', belly: 'firework' },
};
