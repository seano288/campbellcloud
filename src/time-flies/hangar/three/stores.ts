// What hangs under the wings for the Weapons Mods, lathed from real proportions with their fins: Sidewinder (AIM-9),
// AMRAAM (AIM-120), Phoenix (AIM-54), Maverick, Mk 82 and laser-guided bombs, drop tanks, rocket pods, WWII HVAR rockets,
// and the Legendary firework rockets. Each store's top touches y = 0 at its middle, nose toward -x.
import * as THREE from 'three';
import type { Rung } from '../catalog';
import { loftBody, loftSurface, panel, type Section, type Station } from './geometry';
import type { Hardpoint } from './spec';

export type StoreKind = 'aim9' | 'aim120' | 'aim54' | 'maverick' | 'mk82' | 'gbu' | 'tank' | 'pod' | 'hvar' | 'firework';

const std = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, ...o });
const M = {
  white: std(0xeceee8, { roughness: 0.35 }),
  grey: std(0x9ca2a8),
  olive: std(0x4f5a34, { roughness: 0.6 }),
  yellow: std(0xf2c230),
  brown: std(0x7a5233),
  dark: std(0x25282c, { roughness: 0.6 }),
  seeker: new THREE.MeshPhysicalMaterial({ color: 0x1b2430, roughness: 0.05, metalness: 0.4, clearcoat: 1 }),
  fireA: std(0xff2e63, { emissive: 0x550018, roughness: 0.3 }),
  fireB: std(0xfff3f8, { roughness: 0.3 }),
  gold: std(0xffc21a, { metalness: 1, roughness: 0.25, emissive: 0x4a3000 }),
};
export const STORE_MATERIALS = new Set<THREE.Material>(Object.values(M));

/** A round body from (x, radius) pairs: nose first. */
const round = (pts: [number, number][]): Section[] => pts.map(([x, r]) => ({ x, w: r, top: r, bot: r }));

/** Four fins round a body at x (cruciform, turned 45° so none points straight down into the pylon). */
function fins(x: number, root: number, tip: number, span: number, r: number, t = 0.05, sweep = 0.5) {
  const g = new THREE.Group();
  const stations: Station[] = panel({ le: [x, 0, r * 0.8], chord: root, t }, { le: [x + (root - tip) * sweep, 0, r + span], chord: tip, t }, 1);
  const right = loftSurface(stations, 6);
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(right, M.grey);
    m.rotation.x = Math.PI / 4 + (k * Math.PI) / 2;
    g.add(m);
  }
  return g;
}

function body(sections: Section[], mat: THREE.Material, segs = 18) {
  return new THREE.Mesh(loftBody(sections, { segs, rings: Math.max(sections.length * 3, 12) }).skin, mat);
}
const ring = (x: number, len: number, r: number, mat: THREE.Material) => body(round([[x, r * 1.01], [x + len, r * 1.01]]), mat, 18);

function build(kind: StoreKind): { group: THREE.Group; r: number; len: number } {
  const g = new THREE.Group();
  const add = (...o: THREE.Object3D[]) => g.add(...o);
  switch (kind) {
    case 'aim9': {
      const r = 0.064, L = 2.87;
      add(body(round([[0, 0.02], [0.08, 0.045], [0.2, r], [L - 0.02, r], [L, 0.045]]), M.white));
      add(body(round([[-0.02, 0.001], [0.03, 0.03], [0.08, 0.045]]), M.seeker, 12));
      add(ring(0.25, 0.12, r, M.yellow), fins(0.35, 0.22, 0.08, 0.1, r, 0.05, 0.9), fins(L - 0.32, 0.3, 0.16, 0.19, r));
      return { group: g, r, len: L };
    }
    case 'aim120': {
      const r = 0.089, L = 3.65;
      add(body(round([[0, 0.002], [0.25, 0.07], [0.5, r], [L, r]]), M.white));
      add(ring(0.6, 0.1, r, M.yellow), fins(1.3, 0.35, 0.12, 0.17, r, 0.04, 0.8), fins(L - 0.32, 0.3, 0.18, 0.2, r));
      return { group: g, r, len: L };
    }
    case 'aim54': {
      const r = 0.19, L = 4.0;
      add(body(round([[0, 0.002], [0.45, 0.15], [0.9, r], [L, r]]), M.white));
      add(ring(1.0, 0.12, r, M.yellow), ring(1.25, 0.12, r, M.brown), fins(1.6, 0.9, 0.3, 0.22, r, 0.04, 0.9), fins(L - 0.55, 0.5, 0.28, 0.32, r));
      return { group: g, r, len: L };
    }
    case 'maverick': {
      const r = 0.15, L = 2.49;
      add(body(round([[0.05, 0.13], [0.15, r], [L, r]]), M.olive));
      add(body(round([[-0.05, 0.002], [0.0, 0.08], [0.05, 0.13], [0.1, 0.14]]), M.seeker, 16));
      add(ring(0.35, 0.08, r, M.yellow), fins(0.8, 1.1, 0.5, 0.22, r, 0.03, 0.9), fins(L - 0.35, 0.3, 0.2, 0.15, r));
      return { group: g, r, len: L };
    }
    case 'mk82': {
      const r = 0.137, L = 2.22;
      add(body(round([[0, 0.02], [0.25, 0.1], [0.6, r], [1.5, r], [L - 0.35, 0.09], [L, 0.06]]), M.olive));
      add(ring(0.18, 0.06, 0.09, M.yellow), fins(L - 0.5, 0.45, 0.35, 0.12, 0.09, 0.03, 0.2));
      return { group: g, r, len: L };
    }
    case 'gbu': {
      const r = 0.137, L = 3.3;
      add(body(round([[0, 0.002], [0.12, 0.08], [0.55, 0.08], [0.7, 0.11], [1.0, r], [2.3, r], [L - 0.3, 0.1], [L, 0.07]]), M.olive));
      add(body(round([[-0.03, 0.001], [0.02, 0.05], [0.12, 0.08]]), M.seeker, 12), fins(0.3, 0.22, 0.1, 0.1, 0.08, 0.04, 0.9), fins(L - 0.75, 0.6, 0.4, 0.22, 0.1, 0.03, 0.4));
      add(ring(1.0, 0.06, r, M.yellow));
      return { group: g, r, len: L };
    }
    case 'tank': {
      const r = 0.3, L = 4.6;
      add(body(round([[0, 0.01], [0.6, 0.2], [1.5, r], [3.0, r], [L - 0.4, 0.16], [L, 0.02]]), M.grey));
      add(fins(L - 0.9, 0.5, 0.25, 0.1, 0.18, 0.04, 0.6));
      return { group: g, r, len: L };
    }
    case 'pod': {
      const r = 0.2, L = 2.4;
      add(body(round([[0, 0.17], [0.1, r], [L - 0.15, r], [L, 0.15]]), M.olive));
      const front = new THREE.Mesh(new THREE.CircleGeometry(0.17, 18), M.dark);
      front.rotation.y = -Math.PI / 2; front.position.x = -0.002;
      add(front);
      return { group: g, r, len: L };
    }
    case 'hvar': {
      const r = 0.064, L = 1.73;
      add(body(round([[0, 0.002], [0.12, 0.05], [0.25, r], [L, r]]), M.olive), ring(0.28, 0.08, r, M.yellow), fins(L - 0.32, 0.3, 0.3, 0.12, 0.05, 0.03, 0));
      return { group: g, r, len: L };
    }
    case 'firework': {
      const r = 0.11, L = 2.4;
      add(body(round([[0, 0.002], [0.3, r * 0.9], [0.45, r], [L, r]]), M.fireB));
      for (let k = 0; k < 6; k++) add(ring(0.5 + k * 0.3, 0.13, r, k % 2 ? M.gold : M.fireA));
      add(body(round([[-0.01, 0.001], [0.12, 0.06], [0.3, r * 0.9]]), M.gold, 12), fins(L - 0.5, 0.45, 0.2, 0.2, r, 0.04, 0.6));
      return { group: g, r, len: L };
    }
  }
}

/** A loose store with nothing to hang from: the rockets a pod fires. Its nose is at x = 0, pointing toward -x. */
export const storeModel = (kind: StoreKind) => build(kind);

/** A store hanging from a hardpoint (with a pylon down from the wing), or on a wingtip rail. */
export function mount(kind: StoreKind, point: Hardpoint, scale = 1) {
  const { group, r, len } = build(kind), out = new THREE.Group();
  const drop = point.kind === 'tip' ? 0 : Math.max(0.14, r * 0.6);
  group.scale.setScalar(scale);
  group.userData.store = { kind, len: len * scale, r: r * scale, point: point.kind }; // launched in Take Off
  group.position.set(point.at[0] - (len * scale) / 2, point.at[1] - drop - r * scale, point.at[2]);
  out.add(group);
  if (point.kind !== 'tip') { // a swept pylon from the wing down to the store
    const pyl = loftSurface(panel({ le: [point.at[0] - len * scale * 0.18, point.at[1] + 0.05, point.at[2]], chord: len * scale * 0.42, t: 0.09 },
      { le: [point.at[0] - len * scale * 0.24, point.at[1] - drop - 0.02, point.at[2]], chord: len * scale * 0.48, t: 0.09 }, 1), 6);
    out.add(new THREE.Mesh(pyl, M.grey));
  } else { // a launch rail on the tip
    const rail = body(round([[point.at[0] - len * 0.35, 0.03], [point.at[0] + len * 0.35, 0.03]]).map(q => ({ ...q, y: point.at[1], top: 0.05, bot: 0.04 })), M.grey, 8);
    rail.position.z = point.at[2];
    out.add(rail);
  }
  return out;
}

const PROP_LOADS: Record<1 | 2 | 3 | 4, Partial<Record<Hardpoint['kind'], StoreKind>>> = {
  1: { outer: 'hvar', inner: 'hvar' },
  2: { outer: 'hvar', inner: 'mk82', belly: 'mk82' },
  3: { outer: 'hvar', inner: 'tank', belly: 'mk82' },
  4: { tip: 'firework', outer: 'firework', inner: 'firework', belly: 'firework' },
};
const JET_LOADS: Record<1 | 2 | 3 | 4, Partial<Record<Hardpoint['kind'], StoreKind>>> = {
  1: { tip: 'aim9', outer: 'aim9', inner: 'aim120' },
  2: { tip: 'aim9', outer: 'mk82', inner: 'gbu', belly: 'mk82' },
  3: { tip: 'aim9', outer: 'aim120', inner: 'tank', belly: 'aim120' },
  4: { tip: 'firework', outer: 'firework', inner: 'firework', belly: 'firework' },
};

export type Loadout = Partial<Record<1 | 2 | 3 | 4, Partial<Record<Hardpoint['kind'], StoreKind | null>>>>;

/** The stores on every hardpoint (both sides) for a Weapons Rung. */
export function loadout(points: readonly Hardpoint[], rung: Rung, prop: boolean, overrides: Loadout = {}) {
  const g = new THREE.Group();
  if (!rung) return g;
  const base = (prop ? PROP_LOADS : JET_LOADS)[rung], table = { ...base, ...overrides[rung] };
  for (const p of points) {
    const kind = table[p.kind];
    if (!kind) continue;
    g.add(mount(kind, p));
    if (p.mirror !== false && p.at[2] !== 0) g.add(mount(kind, { ...p, at: [p.at[0], p.at[1], -p.at[2]] }));
  }
  return g;
}

