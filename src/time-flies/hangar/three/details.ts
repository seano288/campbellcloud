// The small parts every Aircraft shares, built the same way on each from its spec: landing gear (oleo struts with
// torque links, drag braces, wheels with hubs, gear doors), intake ducts with the engine's fan deep inside, nozzles with
// petals and a liner, twisted propeller blades, the pilot, and canopy frames. Each returns plain geometry with the
// material it wants ('paint' for the livery), so the builder can place it, bake its occlusion and dress it.
import * as THREE from 'three';
import { creased, loftBody, loftSurface, naca, pipe, ringPoint, ringSkin, sectionAt, type Section, type V3 } from './geometry';
import { DETAIL, FIXED, HUB, RUBBER } from './materials';
import type { BodyPart, Leg, Nozzle } from './spec';

export type Part = { geo: THREE.BufferGeometry; mat: THREE.Material | 'paint' };

const round = (x: number, r: number): Section => ({ x, w: r, top: r, bot: r });

// ---------- landing gear ----------

/** A wheel with its axle along z: a tyre with square-ish shoulders and a hub with a flat face and a centre cap. */
export function wheel(leg: Leg) {
  const g = new THREE.Group(), r = leg.r, w = r * 0.75;
  const tire = loftBody([round(-w / 2, r * 0.6), round(-w * 0.47, r * 0.84), round(-w * 0.36, r * 0.97), round(0, r), round(w * 0.36, r * 0.97), round(w * 0.47, r * 0.84), round(w / 2, r * 0.6)], { segs: 28, rings: 13 }).skin;
  const hub = loftBody([round(-w * 0.55, r * 0.16), round(-w * 0.51, r * 0.26), round(-w * 0.48, r * 0.6), round(w * 0.48, r * 0.6), round(w * 0.51, r * 0.26), round(w * 0.55, r * 0.16)], { segs: 20, rings: 12 }).skin;
  g.add(new THREE.Mesh(tire, RUBBER), new THREE.Mesh(creased(hub, 40), HUB));
  g.rotation.y = Math.PI / 2; // axle along z
  return g;
}

/**
 * One landing gear leg: an oleo strut (a painted cylinder over a chrome piston) with its torque links, a drag brace up
 * into the airframe, the wheel or wheels (on a fork when single on the centre line, on a stub axle beside the strut
 * otherwise), and the doors, painted to match the underside. The group is tagged so Take Off can retract it.
 */
export function gearLeg(leg: Leg, z: number, painted: THREE.Mesh[]) {
  const g = new THREE.Group(), r = leg.r, w = r * 0.75, sr = Math.max(r * 0.16, 0.04);
  const top = leg.y, axle = leg.y - leg.len, side = z > 0 ? 1 : z < 0 ? -1 : 0, x = leg.x;
  g.userData.gear = true; // retracted in flight
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | 'paint') => {
    const m = new THREE.Mesh(geo, mat === 'paint' ? undefined : mat);
    if (mat === 'paint') painted.push(m);
    g.add(m);
    return m;
  };
  const cyl = (r0: number, r1: number, y0: number, y1: number, zc: number, segs = 12) =>
    new THREE.CylinderGeometry(r0, r1, Math.max(y1 - y0, 0.01), segs).translate(x, (y0 + y1) / 2, zc);
  const fork = !side && !leg.twin;
  // where the strut ends: at the axle, or above the tyre for a fork
  const bottom = fork ? Math.min(axle + r + 0.05, top - 0.12) : axle;
  const knee = bottom + (top - bottom) * 0.45; // the oleo's outer cylinder ends here and the piston shows below
  add(cyl(sr * 1.12, sr * 1.12, knee, top + 0.05, z), FIXED.gear);
  add(cyl(sr * 1.22, sr * 1.22, knee - 0.02, knee + 0.05, z), FIXED.gear); // the gland nut
  add(cyl(sr * 0.72, sr * 0.72, bottom, knee, z), DETAIL.chrome);
  // torque links: a scissor in front of the piston
  const lr = Math.max(sr * 0.22, 0.014), out = sr + Math.max(0.07, r * 0.25), mid = (knee + bottom) / 2;
  add(pipe([[x - sr * 0.9, knee + 0.01, z], [x - out, mid, z]], lr, 5), FIXED.gear);
  add(pipe([[x - out, mid, z], [x - sr * 0.6, bottom + 0.03, z]], lr, 5), FIXED.gear);
  if (side || leg.twin) { // a drag brace up and aft into the airframe
    add(pipe([[x + sr * 0.5, top - leg.len * 0.32, z], [x + leg.len * 0.42, top + 0.04, z]], sr * 0.42, 6), FIXED.gear);
  }
  // the wheels
  const wheelZ = leg.twin ? [z - (w / 2 + sr * 1.1), z + (w / 2 + sr * 1.1)] : side ? [z + side * (w / 2 + sr * 1.25)] : [z];
  for (const wz of wheelZ) { const wh = wheel(leg); wh.position.set(x, axle, wz); g.add(wh); }
  if (fork) { // a crown across the top of the tyre and an arm down each side to the axle
    const span = w / 2 + sr * 0.55;
    add(new THREE.BoxGeometry(sr * 1.7, sr * 0.9, span * 2 + sr * 0.6).translate(x, bottom, z), FIXED.gear);
    for (const s of [-1, 1]) add(pipe([[x, bottom, z + s * span], [x - r * 0.12, axle, z + s * span]], sr * 0.42, 6), FIXED.gear);
    add(new THREE.CylinderGeometry(sr * 0.4, sr * 0.4, span * 2 + sr * 0.5, 10).rotateX(Math.PI / 2).translate(x - r * 0.12, axle, z), FIXED.gear);
    g.children.filter(c => c instanceof THREE.Group).forEach(c => c.position.x = x - r * 0.12);
  } else { // an axle from the strut through the wheel(s)
    const z0 = Math.min(z, ...wheelZ), z1 = Math.max(z, ...wheelZ);
    add(new THREE.CylinderGeometry(sr * 0.5, sr * 0.5, z1 - z0 + w * 0.6, 10).rotateX(Math.PI / 2).translate(x, axle, (z0 + z1) / 2), FIXED.gear);
  }
  // doors: thin rounded panels, painted outside like the underside
  const tyreTop = axle + r + 0.06;
  const door = (le: number, chord: number, zTop: number, zBot: number, drop: number) => {
    const y1 = Math.max(top - drop, Math.min(tyreTop, top - 0.12));
    return loftSurface([{ le: [le, top + 0.03, zTop], chord, t: Math.min(0.03 / chord, 0.08) }, { le: [le + chord * 0.04, y1, zBot], chord: chord * 0.92, t: Math.min(0.03 / chord, 0.08) }], 6);
  };
  if (side) { // a strut-mounted door on the outboard side of the leg, canted out a little
    const zd = z + side * (leg.twin ? w + sr * 1.6 : sr * 1.5);
    const dz = leg.twin || wheelZ.some(wz => Math.abs(wz - zd) < w / 2 + 0.03) ? side * 0.03 : side * 0.06;
    add(door(x - r * 0.95, r * 1.9, zd, zd + dz, leg.len * 0.55), 'paint');
  } else { // two long doors either side of the well on the centre line
    const zd = w / 2 + sr + 0.07;
    for (const s of [-1, 1]) add(door(x - r * 1.5, r * 2.6, z + s * zd, z + s * (zd + 0.05), leg.len * 0.34), 'paint');
  }
  return g;
}

// ---------- intakes ----------

/**
 * The inside of an open-fronted body: a duct running back from the mouth (light grey, darkening with depth once
 * occlusion is baked) to the engine's fan face, with a spinner; small scoops (radiators, gun muzzles) just end dark.
 */
export function intake(b: BodyPart, z: number, fan: boolean): Part[] {
  const s = [...b.sections].sort((p, q) => p.x - q.x), at = sectionAt(s), x0 = s[0]!.x, L = s[s.length - 1]!.x - x0;
  const f = at(x0), size = Math.max(f.w, (f.top + f.bot) / 2), depth = Math.min(L * 0.6, size * 3.2), segs = b.segs ?? 40;
  const rings: V3[][] = [];
  const steps: [number, number][] = [[0, 1], [0.04, 0.93], [0.3, 0.9], [0.65, 0.86], [1, 0.82]];
  for (const [k, sc] of steps) {
    const x = x0 + k * depth, q = at(x);
    // never wider than the mouth (so it stays inside the skin), shrinking a little as it goes in
    const ring = { ...q, w: Math.min(q.w, f.w) * sc, top: Math.min(q.top, f.top) * sc, bot: Math.min(q.bot, f.bot) * sc };
    if (k > 0) { const mid = q.y + (q.top - q.bot) / 2; ring.y = mid - (ring.top - ring.bot) / 2; }
    rings.push(Array.from({ length: segs }, (_, j) => ringPoint(ring, (2 * Math.PI * j) / segs, z)));
  }
  const dark = b.finish && b.finish !== 'paint' && b.finish !== 'glass';
  const parts: Part[] = [{ geo: ringSkin(rings, { inward: true }), mat: dark ? FIXED[b.finish as keyof typeof FIXED] : DETAIL.duct }];
  const end = rings[rings.length - 1]!, xe = x0 + depth;
  const c = end.reduce((a, p) => [a[0] + p[0] / segs, a[1] + p[1] / segs, a[2] + p[2] / segs] as V3, [0, 0, 0] as V3);
  const shrink = (k: number) => end.map(p => [xe, c[1] + (p[1] - c[1]) * k, c[2] + (p[2] - c[2]) * k] as V3);
  parts.push({ geo: ringSkin([end, shrink(0.35), shrink(0.02)], { inside: [xe + 50, c[1], c[2]] }), mat: fan ? DETAIL.fan : FIXED.black });
  if (fan) { // the fan's spinner, pointing at the mouth
    const hr = Math.min(f.w, (f.top + f.bot) / 2) * 0.82 * 0.3;
    const cone: V3[][] = ([[1, 0], [0.8, 0.4], [0.4, 0.8], [0.03, 1]] as const).map(([k, along]) =>
      Array.from({ length: 16 }, (_, j) => { const a = (j / 16) * Math.PI * 2; return [xe - 0.02 - along * hr * 1.2, c[1] + Math.cos(a) * hr * k, c[2] + Math.sin(a) * hr * k] as V3; }));
    parts.push({ geo: ringSkin(cone), mat: DETAIL.fan });
  }
  return parts;
}

// ---------- nozzles ----------

/**
 * A nozzle at `at`: the outer can (round ones with overlapping petals toward the exit), a lip, a liner running in to
 * the turbine (it glows when the engine runs) with a flameholder ring, and the turbine face with its tail cone.
 */
export function nozzleParts(n: Nozzle, at: V3, liner: THREE.Material): Part[] {
  const w = n.flat ? n.flat.w : n.r, h = n.flat ? n.flat.h : n.r, e = n.flat ? 4 : 2, petals = n.flat ? 0 : 16, segs = n.flat ? 40 : 64;
  const ring = (x: number, k: number, petal = 0): V3[] => {
    const s: Required<Section> = { x, w: w * k, top: h * k, bot: h * k, y: at[1], n: e, nb: e };
    return Array.from({ length: segs }, (_, j) => {
      const phi = (2 * Math.PI * j) / segs, p = ringPoint(s, phi, at[2]);
      if (!petal || !petals) return p;
      const saw = ((phi * petals) / (2 * Math.PI)) % 1, bump = 1 + petal * (saw - 0.5); // each petal overlaps the next
      return [p[0], at[1] + (p[1] - at[1]) * bump, at[2] + (p[2] - at[2]) * bump] as V3;
    });
  };
  const x1 = at[0], L = n.len, depth = Math.min(L * 0.85, Math.min(w, h) * 1.5 + 0.2);
  const outer = ringSkin([ring(x1 - L, 1.08), ring(x1 - L * 0.6, 1.05), ring(x1 - L * 0.35, 1.02, 0.01), ring(x1 - L * 0.12, 0.97, 0.035), ring(x1, 0.92, 0.05)]);
  const lip = ringSkin([ring(x1, 0.92, 0.05), ring(x1 + 0.005, 0.88, 0.02), ring(x1 - 0.03, 0.85)], { inside: [x1 - 50, at[1], at[2]] });
  const inner = ringSkin([ring(x1 - 0.03, 0.85), ring(x1 - depth * 0.5, 0.83), ring(x1 - depth, 0.8)], { inward: true });
  const fh = ringSkin([ring(x1 - depth * 0.55, 0.8), ring(x1 - depth * 0.58, 0.62), ring(x1 - depth * 0.61, 0.8)], { inward: true });
  const face = ringSkin([ring(x1 - depth, 0.8), ring(x1 - depth, 0.34), ring(x1 - depth, 0.02)], { inside: [x1 - 50, at[1], at[2]] });
  const cone = ringSkin([ring(x1 - depth, 0.34), ring(x1 - depth * 0.78, 0.25), ring(x1 - depth * 0.6, 0.1), ring(x1 - depth * 0.55, 0.01)]);
  return [{ geo: creased(outer, 25), mat: FIXED.nozzle }, { geo: lip, mat: FIXED.nozzle }, { geo: inner, mat: liner }, { geo: fh, mat: liner }, { geo: face, mat: DETAIL.fan }, { geo: cone, mat: DETAIL.fan }];
}

// ---------- propellers ----------

const CHORD: [number, number][] = [[0.1, 0.4], [0.2, 0.62], [0.32, 0.88], [0.45, 1], [0.6, 0.98], [0.75, 0.88], [0.86, 0.74], [0.93, 0.58], [0.97, 0.42], [1, 0.2]];
const at1 = (table: [number, number][], f: number) => {
  for (let i = 1; i < table.length; i++) if (f <= table[i]![0]) { const [a, va] = table[i - 1]!, [b, vb] = table[i]!; return va + ((f - a) / (b - a)) * (vb - va); }
  return table[table.length - 1]![1];
};

/**
 * One propeller blade along +z from f0 to f1 of the radius R: a round shank widening to a paddle and a rounded tip, each
 * station an airfoil twisted from steep at the root to shallow at the tip, as a fixed blade pitch wants. `dir` is the way
 * it turns (the leading edge leads).
 */
export function bladeGeometry(R: number, chord: number, f0: number, f1: number, dir: 1 | -1) {
  const fs = [f0, ...[0.14, 0.2, 0.28, 0.36, 0.45, 0.55, 0.65, 0.75, 0.84, 0.9, 0.94, 0.97, 0.99, 1].filter(f => f > f0 + 0.005 && f < f1 - 0.005), f1];
  const P = 9, xc = Array.from({ length: P }, (_, i) => 0.5 - 0.5 * Math.cos((Math.PI * i) / (P - 1)));
  const tan75 = Math.tan((24 * Math.PI) / 180) * 0.75;
  const rings = fs.map(f => {
    const c = chord * at1(CHORD, f), t = f < 0.3 ? 0.36 - (f - 0.1) * 1.2 : Math.max(0.12 - (f - 0.3) * 0.08, 0.06);
    const beta = Math.atan(tan75 / Math.max(f, 0.18)), C = [Math.sin(beta), dir * Math.cos(beta)], T = [Math.cos(beta), -dir * Math.sin(beta)];
    const pt = (u: number, side: 1 | -1): V3 => {
      const cu = (u - 0.35) * c, ct = side * Math.max(naca(u, Math.max(t, 0.06)), 0.002) * c + 0.025 * c * Math.sin(Math.PI * u); // a little camber
      return [cu * C[0]! + ct * T[0]!, cu * C[1]! + ct * T[1]!, f * R];
    };
    return [...xc.map(u => pt(u, 1)), ...xc.slice(1, -1).reverse().map(u => pt(u, -1))];
  });
  return ringSkin(rings, { capStart: true, capEnd: true });
}

// ---------- the pilot ----------

export const PILOT = {
  suit: new THREE.MeshStandardMaterial({ color: 0x55603f, roughness: 0.88 }),
  vest: new THREE.MeshStandardMaterial({ color: 0x3b4030, roughness: 0.8 }),
  helmet: new THREE.MeshPhysicalMaterial({ color: 0xdcdedb, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  /** A WWII pilot's leather flying helmet. */
  leather: new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 0.7 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x2a1c06, metalness: 0.9, roughness: 0.06, iridescence: 0.6, side: THREE.DoubleSide }),
  mask: new THREE.MeshStandardMaterial({ color: 0x3a3d3a, roughness: 0.6 }),
  hud: new THREE.MeshBasicMaterial({ color: 0x9dffb8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }),
};

/** A seat and its pilot at a crew position: the tub, an ejection seat with its headbox, a flight-suited body, a helmet
 * with its visor down, an oxygen mask, the instrument panel, and (on a jet) the HUD's glass. */
export function crew(seat: V3, jet: boolean) {
  const [x, y, z] = seat, out: THREE.Mesh[] = [];
  const m = (geo: THREE.BufferGeometry, mat: THREE.Material) => { const mesh = new THREE.Mesh(geo, mat); out.push(mesh); return mesh; };
  m(loftBody([{ x: x - 0.9, w: 0.3, top: 0.05, bot: 0.25, y: y - 0.3 }, { x: x + 0.7, w: 0.32, top: 0.05, bot: 0.25, y: y - 0.3 }], { segs: 16, rings: 4, z }).skin, FIXED.black);
  const back = m(new THREE.BoxGeometry(0.12, 0.62, 0.46), FIXED.dark); back.position.set(x + 0.32, y - 0.12, z); back.rotation.z = -0.22;
  const head = m(new THREE.BoxGeometry(0.13, 0.22, 0.28), FIXED.dark); head.position.set(x + 0.3, y + 0.24, z); head.rotation.z = -0.22; // the headbox
  if (jet) { const handle = m(new THREE.TorusGeometry(0.06, 0.012, 6, 14, Math.PI), DETAIL.tip); handle.position.set(x + 0.26, y + 0.38, z); handle.rotation.y = Math.PI / 2; }
  const body = m(new THREE.CapsuleGeometry(0.15, 0.22, 4, 12), PILOT.suit); body.scale.set(0.85, 1, 1.25); body.position.set(x + 0.12, y - 0.15, z); body.rotation.z = -0.2;
  const vest = m(new THREE.CapsuleGeometry(0.155, 0.12, 4, 12), PILOT.vest); vest.scale.set(0.88, 1, 1.28); vest.position.set(x + 0.1, y - 0.06, z); vest.rotation.z = -0.2;
  const hy = y + 0.2, hx = x + 0.08;
  const helmet = m(new THREE.SphereGeometry(0.14, 20, 14), jet ? PILOT.helmet : PILOT.leather); helmet.scale.set(1.08, 1, 0.94); helmet.position.set(hx, hy, z);
  // the visor: a dark shell over the face (in three's spheres phi = 0 faces -x, the way the pilot looks)
  // a jet pilot's visor down over the face; goggles pushed up on a WWII leather helmet
  const visor = jet ? m(new THREE.SphereGeometry(0.152, 20, 10, -Math.PI * 0.36, Math.PI * 0.72, Math.PI * 0.3, Math.PI * 0.27), PILOT.visor) : m(new THREE.SphereGeometry(0.146, 20, 6, -Math.PI * 0.3, Math.PI * 0.6, Math.PI * 0.16, Math.PI * 0.1), PILOT.visor);
  visor.scale.set(1.08, 1, 0.94); visor.position.set(hx, hy, z);
  const mask = m(new THREE.CylinderGeometry(0.035, 0.055, 0.1, 10).rotateZ(Math.PI / 2 + 0.5), PILOT.mask); mask.position.set(hx - 0.13, hy - 0.08, z);
  const panel = m(new THREE.BoxGeometry(0.1, 0.2, 0.5), FIXED.dark); panel.position.set(x - 0.7, y - 0.2, z);
  if (jet) { const hud = m(new THREE.PlaneGeometry(0.15, 0.13), PILOT.hud); hud.position.set(x - 0.68, y - 0.02, z); hud.rotation.y = Math.PI / 2; hud.rotation.x = 0; hud.rotation.z = 0.35; }
  return out;
}

// ---------- canopy frames ----------

/** A canopy's frame: a sill rail down each side, and bows across it at the given fractions of its length. */
export function canopyFrame(b: BodyPart, z: number, bows: readonly number[]) {
  const s = [...b.sections].sort((p, q) => p.x - q.x), at = sectionAt(s), x0 = s[0]!.x, L = s[s.length - 1]!.x - x0;
  const geos: THREE.BufferGeometry[] = [], size = Math.max(...s.map(q => q.w));
  const rail = Math.max(0.018, size * 0.045);
  for (const side of [1, -1]) {
    const path: V3[] = [];
    for (let k = 0; k <= 16; k++) {
      const x = x0 + L * (0.02 + 0.96 * (k / 16)), q = at(x);
      if (q.w > rail * 1.5) path.push([x, q.y, z + side * (q.w + rail * 0.4)]);
    }
    if (path.length > 2) geos.push(pipe(path, rail, 6));
  }
  for (const f of bows) {
    const x = x0 + L * f, q = at(x), path: V3[] = [];
    for (let k = 0; k <= 14; k++) {
      const phi = -Math.PI / 2 + (Math.PI * k) / 14, p = ringPoint(q, phi, z), dy = p[1] - q.y, dz = p[2] - z, d = Math.hypot(dy, dz) || 1;
      path.push([x, p[1] + (dy / d) * rail * 0.5, p[2] + (dz / d) * rail * 0.5]);
    }
    geos.push(pipe(path, rail * 1.5, 6));
  }
  return geos;
}
