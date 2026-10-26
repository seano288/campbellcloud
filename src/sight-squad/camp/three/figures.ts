// Every figure in the Camp built from primitives, as data: the ten Squads of plastic army men (on their little bases, like
// the real toys) and the wind-up toy robots they play Battle against. A figure is a list of parts; each part hangs on a
// bone (the body, a leg, the wheels, a turret...), so a whole army marches with nothing more than a matrix per part per
// soldier (src/sight-squad/camp/three/army.ts), no skeletons. Sizes are in figure heights: a soldier stands 1 tall and
// faces +z. Research: .scratch/sight-squad/research/army-display.md.
import * as THREE from 'three';
import type { Gear, UnitId } from '../catalog';

/** What a part hangs on. Legs swing from the hip, wheels turn, a turret looks around, a robot's key winds. */
export type Bone = 'root' | 'body' | 'legL' | 'legR' | 'wheel' | 'turret' | 'key' | 'sticks';
/** What it's made of: his army's plastic, white (the medic's cross), the robots' tin, gold, a glow, dark rubber. */
export type Stuff = 'plastic' | 'white' | 'tin' | 'gold' | 'glow' | 'eye' | 'rubber';

export interface Part {
  readonly geo: THREE.BufferGeometry;
  readonly bone: Bone;
  readonly stuff: Stuff;
  readonly local: THREE.Matrix4;
}
export type FigureId = UnitId | 'robot';
export interface Figure {
  readonly parts: readonly Part[];
  /** Pivots: where the legs swing from, where the wheels turn about (all at this height, along x), where the turret turns. */
  readonly hip: number;
  readonly wheels: readonly THREE.Vector3[];
  readonly turret: THREE.Vector3;
  /** How big it is on the mat (for spacing it in formation), and its height (for the camera). */
  readonly size: { w: number; d: number; h: number };
  /** Where its throws start from, in its own space. */
  readonly muzzle: THREE.Vector3;
  readonly walker: boolean;
}

// ---------- shapes, cached so each is made once ----------

const cache = new Map<string, THREE.BufferGeometry>();
const once = (key: string, make: () => THREE.BufferGeometry) => { let g = cache.get(key); if (!g) { g = make(); cache.set(key, g); } return g; };
const box = (w: number, h: number, d: number) => once(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const ball = (r: number, half = false) => once(`s${r}${half}`, () => new THREE.SphereGeometry(r, 14, half ? 6 : 10, 0, Math.PI * 2, 0, half ? Math.PI / 2 : Math.PI));
const rod = (r: number, len: number, r2 = r, seg = 12) => once(`c${r},${len},${r2},${seg}`, () => new THREE.CylinderGeometry(r2, r, len, seg));
const pill = (r: number, len: number) => once(`p${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 4, 10));
const cone = (r: number, h: number) => once(`k${r},${h}`, () => new THREE.ConeGeometry(r, h, 10));
const ring = (r: number, t: number) => once(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 6, 16));
/** A flat star, for the Star Helmet and the robots' chests. */
const star = (r: number) => once(`star${r}`, () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, k = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * k, -Math.sin(a) * k) : s.moveTo(Math.cos(a) * k, -Math.sin(a) * k); }
  return new THREE.ExtrudeGeometry(s, { depth: r * 0.25, bevelEnabled: false });
});
/** A wing: a bat-like dragon wing in one flat piece, along +x from the shoulder. */
const wing = () => once('wing', () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(0.25, 0.32, 0.55, 0.3); s.lineTo(0.48, 0.12); s.lineTo(0.4, 0.16); s.lineTo(0.33, 0.0); s.lineTo(0.24, 0.06); s.lineTo(0.16, -0.08); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: false });
});

const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const part = (geo: THREE.BufferGeometry, bone: Bone, local: THREE.Matrix4, stuff: Stuff = 'plastic'): Part => ({ geo, bone, stuff, local });

// ---------- the plastic army man ----------

const HIP = 0.5;
/** The base he stands on, his legs, body and head: every soldier starts from this. */
function soldierBody(): Part[] {
  return [
    part(rod(0.2, 0.035), 'root', M(0, 0.0175, 0)),
    part(pill(0.06, 0.34), 'legL', M(-0.075, HIP - 0.26, 0)),
    part(pill(0.06, 0.34), 'legR', M(0.075, HIP - 0.26, 0)),
    part(box(0.1, 0.05, 0.16), 'legL', M(-0.075, 0.06, 0.03)),
    part(box(0.1, 0.05, 0.16), 'legR', M(0.075, 0.06, 0.03)),
    part(pill(0.12, 0.18), 'body', M(0, 0.66, 0, 0, 0, 0, 1.15, 1, 0.8)),
    part(box(0.27, 0.05, 0.2), 'body', M(0, 0.53, 0)), // belt
    part(ball(0.095), 'body', M(0, 0.93, 0)),
  ];
}
/** An arm from the shoulder, pointing along (pitch, yaw) from hanging straight down: pitch -π/2 is straight ahead. */
function arm(side: -1 | 1, pitch: number, inward = 0, roll = 0): Part {
  const sh = new THREE.Vector3(side * 0.165, 0.79, 0);
  const rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pitch, side * -inward, side * roll, 'YXZ'));
  return part(pill(0.045, 0.22), 'body', new THREE.Matrix4().makeTranslation(sh.x, sh.y, sh.z).multiply(rot).multiply(M(0, -0.155, 0)));
}

/** What he wears on his head, by Helmet Mod. */
function helmet(rung: number): Part[] {
  const dome = (s = 1) => part(ball(0.125, true), 'body', M(0, 0.95, 0, 0, 0, 0, s, 0.85 * s, s));
  const brim = part(rod(0.14, 0.018), 'body', M(0, 0.955, 0));
  switch (rung) {
    case 0: return [part(ball(0.105, true), 'body', M(0, 0.96, 0, 0, 0, 0, 1, 0.75, 1)), part(box(0.15, 0.015, 0.09), 'body', M(0, 0.965, 0.1))];
    case 1: return [dome(), brim];
    case 2: return [dome(), brim, part(star(0.05), 'body', M(0, 1.0, 0.105, -0.25), 'gold')];
    case 3: return [dome(), brim, part(cone(0.035, 0.22), 'body', M(0, 1.14, -0.02, -0.3), 'white'), part(ball(0.04), 'body', M(0, 1.06, 0), 'gold')];
    default: return [dome(1.04), brim, part(cone(0.035, 0.2), 'body', M(-0.15, 1.08, 0, 0, 0, 0.9), 'white'), part(cone(0.035, 0.2), 'body', M(0.15, 1.08, 0, 0, 0, -0.9), 'white')];
  }
}
/** What he carries on his back, by Pack Mod. */
function pack(rung: number): Part[] {
  switch (rung) {
    case 0: return [];
    case 1: return [part(box(0.2, 0.22, 0.09), 'body', M(0, 0.69, -0.13)), part(box(0.22, 0.06, 0.1), 'body', M(0, 0.57, -0.14))];
    case 2: return [part(box(0.21, 0.26, 0.1), 'body', M(0, 0.7, -0.14)), part(rod(0.008, 0.45), 'body', M(0.07, 1.0, -0.15)), part(ball(0.02), 'body', M(0.07, 1.23, -0.15))];
    case 3: return [
      part(rod(0.055, 0.28), 'body', M(-0.07, 0.68, -0.15)), part(rod(0.055, 0.28), 'body', M(0.07, 0.68, -0.15)),
      part(cone(0.055, 0.08), 'body', M(-0.07, 0.86, -0.15)), part(cone(0.055, 0.08), 'body', M(0.07, 0.86, -0.15)),
      part(cone(0.04, 0.16), 'body', M(-0.07, 0.46, -0.15, Math.PI), 'glow'), part(cone(0.04, 0.16), 'body', M(0.07, 0.46, -0.15, Math.PI), 'glow'),
    ];
    default: return [
      part(wing(), 'body', M(0.05, 0.72, -0.14, 0, 0.35, 0.15, 1.2)), part(wing(), 'body', M(-0.05, 0.72, -0.14, 0, Math.PI - 0.35, 0.15, 1.2)),
    ];
  }
}

function soldier(unit: UnitId, gear: Gear): Part[] {
  const head = [...helmet(gear.helmet), ...(unit === 'para' ? [] : pack(gear.pack))];
  const base = [...soldierBody(), ...head];
  switch (unit) {
    case 'rifleman': return [...base, arm(1, -1.25, 0.45), arm(-1, -1.45, 0.7),
      part(box(0.035, 0.05, 0.62), 'body', M(0.03, 0.78, 0.22, 0.08)), part(box(0.05, 0.1, 0.16), 'body', M(0.03, 0.74, 0.02, 0.08))];
    case 'scout': return [...base, arm(1, -2.5, 0.6), arm(-1, -2.5, 0.6),
      part(rod(0.03, 0.09), 'body', M(-0.035, 0.94, 0.12, Math.PI / 2)), part(rod(0.03, 0.09), 'body', M(0.035, 0.94, 0.12, Math.PI / 2))];
    case 'drummer': return [...base, arm(1, -0.9, 0.3), arm(-1, -0.9, 0.3),
      part(rod(0.13, 0.14, 0.13, 16), 'body', M(0, 0.55, 0.18)), part(ring(0.13, 0.012), 'body', M(0, 0.62, 0.18, Math.PI / 2), 'white'),
      part(rod(0.01, 0.2), 'sticks', M(-0.1, 0.68, 0.24, 1.0)), part(rod(0.01, 0.2), 'sticks', M(0.1, 0.68, 0.24, 1.0))];
    case 'medic': return [...base, arm(1, -0.25, 0.05), arm(-1, -0.6, 0.2),
      part(box(0.16, 0.14, 0.08), 'body', M(0.2, 0.5, 0.05)), part(box(0.1, 0.03, 0.01), 'body', M(0.2, 0.5, 0.095), 'white'), part(box(0.03, 0.1, 0.01), 'body', M(0.2, 0.5, 0.095), 'white'),
      part(box(0.07, 0.07, 0.01), 'body', M(0, 1.0, 0.115), 'white')];
    case 'rocket': return [...base, arm(1, -1.4, 0.2), arm(-1, -1.5, 0.6),
      part(rod(0.06, 0.6), 'body', M(0.12, 0.9, 0.08, Math.PI / 2)), part(rod(0.075, 0.08), 'body', M(0.12, 0.9, 0.4, Math.PI / 2))];
    case 'para': return [...base, arm(1, -2.8, 0.25), arm(-1, -2.8, 0.25),
      part(box(0.22, 0.26, 0.12), 'body', M(0, 0.7, -0.14)), part(box(0.18, 0.08, 0.06), 'body', M(0, 0.6, 0.12))];
    default: return base;
  }
}

// ---------- the dog, the jeep, the cannon, the tank ----------

function dog(): Part[] {
  const leg = (x: number, z: number, bone: Bone) => part(pill(0.045, 0.2), bone, M(x, 0.18, z));
  return [
    part(box(0.36, 0.035, 0.7), 'root', M(0, 0.0175, 0)),
    part(pill(0.11, 0.34), 'body', M(0, 0.4, 0, Math.PI / 2)),
    part(ball(0.11), 'body', M(0, 0.55, 0.3)), part(box(0.1, 0.08, 0.14), 'body', M(0, 0.52, 0.42)), part(ball(0.025), 'body', M(0, 0.55, 0.49), 'rubber'),
    part(cone(0.04, 0.1), 'body', M(-0.06, 0.66, 0.27)), part(cone(0.04, 0.1), 'body', M(0.06, 0.66, 0.27)),
    part(pill(0.025, 0.18), 'body', M(0, 0.5, -0.32, -0.7)),
    leg(-0.07, 0.18, 'legL'), leg(0.07, 0.18, 'legR'), leg(-0.07, -0.18, 'legR'), leg(0.07, -0.18, 'legL'),
  ];
}

const WHEEL_Y = 0.17;
function jeep(): Part[] {
  const wheel = (x: number, z: number) => part(rod(0.17, 0.12, 0.17, 16), 'wheel', M(x, WHEEL_Y, z, 0, 0, Math.PI / 2), 'rubber');
  return [
    part(box(0.62, 0.22, 1.2), 'body', M(0, 0.34, 0)), part(box(0.6, 0.12, 0.42), 'body', M(0, 0.49, 0.36)),
    part(box(0.56, 0.3, 0.025), 'body', M(0, 0.66, 0.16, -0.2)),
    part(box(0.5, 0.14, 0.22), 'body', M(0, 0.52, -0.2)), part(box(0.5, 0.26, 0.05), 'body', M(0, 0.6, -0.33)),
    part(rod(0.07, 0.04, 0.07, 16), 'body', M(-0.14, 0.62, 0.05, 1.0)),
    part(rod(0.15, 0.08, 0.15, 16), 'body', M(0, 0.5, -0.65, Math.PI / 2), 'rubber'),
    part(pill(0.1, 0.12), 'body', M(-0.14, 0.72, -0.08)), part(ball(0.075), 'body', M(-0.14, 0.92, -0.08)), part(ball(0.085, true), 'body', M(-0.14, 0.94, -0.08, 0, 0, 0, 1, 0.8, 1)),
    wheel(-0.32, 0.38), wheel(0.32, 0.38), wheel(-0.32, -0.38), wheel(0.32, -0.38),
  ];
}
function cannon(): Part[] {
  const wheel = (x: number) => part(rod(0.24, 0.06, 0.24, 18), 'wheel', M(x, 0.24, 0, 0, 0, Math.PI / 2));
  return [
    wheel(-0.26), wheel(0.26), part(rod(0.03, 0.56), 'body', M(0, 0.24, 0, 0, 0, Math.PI / 2)),
    part(box(0.16, 0.08, 0.8), 'body', M(0, 0.16, -0.32, 0.28)),
    part(rod(0.07, 0.9, 0.1, 14), 'turret', M(0, 0.36, 0.18, Math.PI / 2 - 0.35)), part(ball(0.1), 'turret', M(0, 0.22, -0.22)),
    part(ring(0.075, 0.02), 'turret', M(0, 0.5, 0.6, -0.35)),
  ];
}
function tank(): Part[] {
  const wheels: Part[] = [];
  for (const x of [-0.42, 0.42]) for (const z of [-0.5, -0.25, 0, 0.25, 0.5]) wheels.push(part(rod(0.1, 0.1, 0.1, 12), 'wheel', M(x, 0.16, z, 0, 0, Math.PI / 2), 'rubber'));
  return [
    part(box(0.2, 0.3, 1.45), 'root', M(-0.42, 0.17, 0)), part(box(0.2, 0.3, 1.45), 'root', M(0.42, 0.17, 0)),
    ...wheels,
    part(box(0.68, 0.24, 1.3), 'body', M(0, 0.36, 0)), part(box(0.66, 0.08, 0.3), 'body', M(0, 0.44, 0.6, -0.4)),
    part(rod(0.3, 0.2, 0.34, 18), 'turret', M(0, 0.58, -0.05)), part(rod(0.045, 0.9), 'turret', M(0, 0.6, 0.6, Math.PI / 2)),
    part(rod(0.07, 0.08), 'turret', M(0.12, 0.72, -0.12)),
  ];
}

// ---------- the wind-up toy robot ----------

function robot(): Part[] {
  return [
    part(rod(0.2, 0.035), 'root', M(0, 0.0175, 0), 'tin'),
    part(box(0.11, 0.36, 0.13), 'legL', M(-0.09, HIP - 0.26, 0), 'tin'), part(box(0.11, 0.36, 0.13), 'legR', M(0.09, HIP - 0.26, 0), 'tin'),
    part(box(0.14, 0.06, 0.2), 'legL', M(-0.09, 0.06, 0.03), 'tin'), part(box(0.14, 0.06, 0.2), 'legR', M(0.09, 0.06, 0.03), 'tin'),
    part(box(0.36, 0.34, 0.24), 'body', M(0, 0.67, 0), 'tin'), part(star(0.07), 'body', M(0, 0.68, 0.12), 'gold'),
    part(box(0.07, 0.3, 0.07), 'body', M(-0.23, 0.68, 0.04, -0.6), 'tin'), part(box(0.07, 0.3, 0.07), 'body', M(0.23, 0.68, 0.04, -0.6), 'tin'),
    part(box(0.26, 0.2, 0.22), 'body', M(0, 0.96, 0), 'tin'),
    part(ball(0.035), 'body', M(-0.06, 0.98, 0.115), 'eye'), part(ball(0.035), 'body', M(0.06, 0.98, 0.115), 'eye'),
    part(box(0.12, 0.025, 0.01), 'body', M(0, 0.91, 0.115), 'rubber'),
    part(rod(0.01, 0.14), 'body', M(0, 1.13, 0), 'tin'), part(ball(0.03), 'body', M(0, 1.21, 0), 'glow'),
    part(rod(0.015, 0.12), 'key', M(0, 0, -0.06, Math.PI / 2), 'gold'), part(box(0.16, 0.08, 0.015), 'key', M(0, 0, -0.12), 'gold'),
  ];
}

// ---------- each figure, put together ----------

export function buildFigure(id: FigureId, gear: Gear): Figure {
  const walker = id !== 'jeep' && id !== 'cannon' && id !== 'tank';
  const parts = id === 'robot' ? robot() : id === 'dog' ? dog() : id === 'jeep' ? jeep() : id === 'cannon' ? cannon() : id === 'tank' ? tank() : soldier(id, gear);
  const size = id === 'jeep' ? { w: 0.75, d: 1.35, h: 1 } : id === 'tank' ? { w: 1.05, d: 1.5, h: 0.85 } : id === 'cannon' ? { w: 0.7, d: 1.2, h: 0.75 }
    : id === 'dog' ? { w: 0.45, d: 0.8, h: 0.7 } : { w: 0.5, d: 0.5, h: 1.05 };
  const wheels = id === 'jeep' ? [new THREE.Vector3(0, WHEEL_Y, 0)] : id === 'cannon' ? [new THREE.Vector3(0, 0.24, 0)] : id === 'tank' ? [new THREE.Vector3(0, 0.16, 0)] : [];
  const muzzle = id === 'tank' ? new THREE.Vector3(0, 0.6, 1.05) : id === 'cannon' ? new THREE.Vector3(0, 0.55, 0.6) : id === 'rocket' ? new THREE.Vector3(0.12, 0.9, 0.45)
    : id === 'jeep' ? new THREE.Vector3(-0.14, 0.9, 0) : new THREE.Vector3(0.05, 0.85, 0.3);
  return { parts, hip: id === 'dog' ? 0.3 : HIP, wheels, turret: id === 'cannon' ? new THREE.Vector3(0, 0.24, 0) : new THREE.Vector3(0, 0.58, -0.05), size, muzzle, walker };
}

/** The robot's key turns about this point on its back. */
export const KEY_AT = new THREE.Vector3(0, 0.7, -0.14);
