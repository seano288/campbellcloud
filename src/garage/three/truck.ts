// Builds the Truck in the "Real" look, all in code: the Body's side profile extruded with rounded corners and
// a clear-coat, one canvas texture for Paint and Decals projected from the side, a tube chassis with 4-link
// suspension and coil-overs, lathe-turned tires with tread that grows per Mod, beadlock rims, and per-Body extras.
// The Legendaries (Rung 4) go a step past the top Rung: gold spiked paddle tires, flaked gold paint, a skull with
// wings, spinning lasers, a roof-top train horn, a gold dragon jaw that chomps, gold stacks that blast a rainbow, a
// spinning Siren and a glowing gold Door Number. The Door Number is on a panel of its own on each side, so it reads
// the right way round on both.
// Ported from the "3D Garage" prototype (prototype/garage-screen @ 9780a65).
import * as THREE from 'three';
import { colourById, type BodyId, type Fit, type Rung, type SlotId } from '../catalog';
import { Exhaust, type Tip } from './exhaust';
import { BODIES, LIFT, parsePath, TIRE_R, TIRE_W, toX, toY, TREAD, U, type BodyShape } from './bodies';
import { BOLT, BOLTS, decalShapes, FLAME1, FLAME2, numberBox, numberSpot, SKULL, WING, type NumberSpot } from './sidePaint';

const V3 = THREE.Vector3, V2 = THREE.Vector2;
type Pt = [number, number];

/** Raised tire lettering, drawn once: the brand twice round, light grey worn into the rubber. */
const sidewallTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 128;
  const g = c.getContext('2d')!;
  g.font = '700 84px "Arial Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(226,226,222,.92)';
  for (const [x, t] of [[256, 'MONSTER'], [768, 'MUDDER  ◆'], [1280, 'MONSTER'], [1792, 'MUDDER  ◆']] as const) g.fillText(t, x, 66, 460);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
})();
// ---------- materials shared by every build ----------
const std = (c: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, ...o });
const M = {
  rubber: std(0x232325, { roughness: 0.9 }),
  letters: std(0xffffff, { map: sidewallTex, transparent: true, roughness: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  dark: std(0x1e2126, { roughness: 0.45, metalness: 0.6 }),
  chrome: std(0xf2f2f2, { roughness: 0.07, metalness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x15222e, roughness: 0.03, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.4 }),
  /** The side windows: tinted, see-through glass with the cab behind it. */
  tint: new THREE.MeshPhysicalMaterial({ color: 0x3d5566, roughness: 0.02, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.3, depthWrite: false, iridescence: 0.15, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], envMapIntensity: 1.6, side: THREE.DoubleSide }),
  cab: std(0x2c2e33, { roughness: 0.85, side: THREE.BackSide }), // the tunnel walls face into the shell
  suit: std(0xd8261c, { roughness: 0.7 }),
  helmet: new THREE.MeshPhysicalMaterial({ color: 0xf2f2ee, roughness: 0.3, clearcoat: 1 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x1a1408, metalness: 0.9, roughness: 0.05, iridescence: 0.6 }),
  shock: std(0xff5a1f, { roughness: 0.3, metalness: 0.5 }),
  frame: std(0x2b62d9, { roughness: 0.35, metalness: 0.4 }),
  liner: std(0x0b0b0c, { roughness: 1 }),
  gold: std(0xffc21a, { roughness: 0.18, metalness: 1, emissive: 0x6a4a00, emissiveIntensity: 0.6 }),
};
const SHARED = new Set<THREE.Material>(Object.values(M));
// Shell: R = corner rounding (profile units), bt/bs = bevel thickness/size
const SH = { R: 9, bt: 0.07, bs: 0.06, seg: 5 };
/** How far the cab runs on below a side window's sill, and the lowest it goes (above the coil-overs' tops), from the shell's base. */
const CAB_DEPTH = 0.3, CAB_FLOOR = 0.36;
/** How far the cab's cut reaches past the windows (profile units): its walls bevel in by about this much, leaving a slim lip. */
const CAB_MARGIN = 5;
const RIM_C = [0xb9c0c8, 0xd8dde3, 0xffcc33, 0xff3df0, 0xffd700] as const;


/** A flat ring from r0 to r1 with its texture wrapped round it: u goes round, v goes out. */
function sidewallRing(r0: number, r1: number, seg = 96) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pos.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0);
    uv.push(1 - i / seg, 0, 1 - i / seg, 1);
    if (i < seg) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

const glowTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!, rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.5, 'rgba(255,255,255,.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();

// ---------- geometry helpers ----------
const shapes = (d: string) => parsePath(d).map(pts => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(toX(x), toY(y)) : s.moveTo(toX(x), toY(y))));
  s.closePath();
  return s;
});
/** The same outline with every corner rounded (rad in profile units). */
function roundShape(pts: Pt[], rad: number) {
  const s = new THREE.Shape(), P = pts.map(([x, y]) => new V2(toX(x), toY(y))), n = P.length;
  for (let i = 0; i < n; i++) {
    const p = P[i]!, a = P[(i - 1 + n) % n]!, b = P[(i + 1) % n]!;
    const p1 = p.clone().add(a.clone().sub(p).setLength(Math.min(rad / U, p.distanceTo(a) * 0.45)));
    const p2 = p.clone().add(b.clone().sub(p).setLength(Math.min(rad / U, p.distanceTo(b) * 0.45)));
    if (i === 0) s.moveTo(p1.x, p1.y); else s.lineTo(p1.x, p1.y);
    s.quadraticCurveTo(p.x, p.y, p2.x, p2.y);
  }
  s.closePath();
  return s;
}
const shellShapes = (d: string, R: number) => (R ? parsePath(d).map(q => roundShape(q, R)) : shapes(d));

/** Smooth normals across edges shallower than deg (extrusions come out flat shaded). */
function creaseNormals(geo: THREE.BufferGeometry, deg: number) {
  const p = geo.attributes.position!, n = geo.attributes.normal!, cos = Math.cos((deg * Math.PI) / 180), groups = new Map<string, number[]>();
  for (let i = 0; i < p.count; i++) {
    const k = `${Math.round(p.getX(i) * 1e4)}_${Math.round(p.getY(i) * 1e4)}_${Math.round(p.getZ(i) * 1e4)}`;
    let g = groups.get(k);
    if (!g) groups.set(k, (g = []));
    g.push(i);
  }
  const out = new Float32Array(p.count * 3), a = new V3(), b = new V3(), sum = new V3();
  for (const g of groups.values()) for (const i of g) {
    a.fromBufferAttribute(n, i); sum.set(0, 0, 0);
    for (const j of g) { b.fromBufferAttribute(n, j); if (a.dot(b) >= cos) sum.add(b); }
    sum.normalize(); out[i * 3] = sum.x; out[i * 3 + 1] = sum.y; out[i * 3 + 2] = sum.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return geo;
}

/** Is p inside the polygon? */
function inside(p: THREE.Vector2, poly: THREE.Vector2[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
/** The convex hull of some points (monotone chain). */
function convexHull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Pt[]) => { const h: Pt[] = []; for (const q of list) { while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop(); h.push(q); } h.pop(); return h; };
  return [...half(p), ...half([...p].reverse())];
}
/** A convex polygon pushed out by d on every side. */
function offsetHull(poly: Pt[], d: number): Pt[] {
  const n = poly.length, area = poly.reduce((a, p, i) => a + p[0] * poly[(i + 1) % n]![1] - poly[(i + 1) % n]![0] * p[1], 0), k = area > 0 ? 1 : -1;
  const normal = (a: Pt, b: Pt) => { const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1; return [(k * ey) / l, (-k * ex) / l] as const; };
  return poly.map((p, i) => {
    const [ax, ay] = normal(poly[(i - 1 + n) % n]!, p), [bx, by] = normal(p, poly[(i + 1) % n]!), m = d / (1 + ax * bx + ay * by);
    return [p[0] + (ax + bx) * m, p[1] + (ay + by) * m];
  });
}
/** Splits a non-indexed geometry's triangles in two: those `pick` (given a triangle's first vertex) leaves, and those it takes. */
function splitTriangles(geo: THREE.BufferGeometry, pick: (vertex: number) => boolean): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const names = ['position', 'normal', 'uv'] as const, out = [names.map(() => [] as number[]), names.map(() => [] as number[])];
  for (let i = 0; i < geo.attributes.position!.count; i += 3) {
    const dst = out[pick(i) ? 1 : 0]!;
    names.forEach((name, k) => { const at = geo.attributes[name]!; for (let v = i; v < i + 3; v++) for (let e = 0; e < at.itemSize; e++) dst[k]!.push(at.array[v * at.itemSize + e]!); });
  }
  return out.map(arrs => {
    const g = new THREE.BufferGeometry();
    names.forEach((name, k) => g.setAttribute(name, new THREE.Float32BufferAttribute(arrs[k]!, name === 'uv' ? 2 : 3)));
    return g;
  }) as [THREE.BufferGeometry, THREE.BufferGeometry];
}

/** A copy of a flat geometry facing the other way. */
function flipped(geo: THREE.BufferGeometry) {
  const g = geo.clone(), idx = g.index!.array, n = g.attributes.normal!;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]!; idx[i + 1] = idx[i + 2]!; idx[i + 2] = t; }
  for (let i = 0; i < n.count; i++) n.setZ(i, -n.getZ(i));
  return g;
}

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- the build ----------
export interface TruckAnim {
  /** Mega Spikes and Monster Treads wheels turn slowly. */
  spin: THREE.Object3D[];
  /** Laser Show beams sweep round. */
  lasers: THREE.Object3D | null;
  /** Glow Under pulses. */
  glow: { m: THREE.MeshBasicMaterial; l: THREE.PointLight } | null;
  /** Rainbow Chrome paint shimmers and Gold Flake twinkles, so its canvas is redrawn each frame. */
  repaint: ((t: number) => void) | null;
  /** Dragon Jaw: the lower jaw swings on its hinge and the fire inside flickers. */
  jaw: { hinge: THREE.Object3D; fire: THREE.MeshStandardMaterial } | null;
  /** Antenna Flag: the flag waves. */
  wave: ((t: number) => void) | null;
  /** Siren: the lamps spin round and flash red and blue. */
  siren: { rotor: THREE.Object3D; lamps: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial]; light: THREE.PointLight } | null;
  /** Glowing Gold: the Door Number's glow pulses. */
  goldNumber: THREE.MeshStandardMaterial | null;
}

export interface BuiltTruck {
  group: THREE.Group;
  anim: TruckAnim;
  /** The Exhaust's puffs. They live in the turntable's space, not the Truck's, so the stage adds them there. */
  exhaust: Exhaust;
  /** Paint a new number on the door, without rebuilding the Truck (he turns the wheels fast). */
  setDoorNumber(n: number): void;
  /** Hotspot anchors in the Truck's space; the side ones are mirrored to whichever side the camera is on. */
  anchors(side: 1 | -1): Record<SlotId, { p: THREE.Vector3; n: THREE.Vector3 | null; min: number }>;
  dispose(): void;
}

class Builder {
  readonly B: BodyShape;
  readonly r: number;
  readonly tw: number;
  readonly ch: number;
  readonly W: number;
  readonly own: THREE.Material[] = [];
  readonly truck = new THREE.Group();
  readonly body = new THREE.Group();
  readonly anim: TruckAnim = { spin: [], lasers: null, glow: null, repaint: null, jaw: null, wave: null, siren: null, goldNumber: null };

  constructor(readonly bodyId: BodyId, readonly f: Fit) {
    this.B = BODIES[bodyId];
    this.r = TIRE_R[f.tires] / U;
    this.tw = TIRE_W[f.tires];
    this.ch = this.r * LIFT + 0.08;
    this.W = this.B.W;
    this.body.position.y = this.ch;
    this.truck.add(this.body);
  }

  mat<T extends THREE.Material>(m: T): T { this.own.push(m); return m; }
  glow(c: number, i = 2.5) { return this.mat(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i })); }
  box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o;
  }
  cyl(rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, axis?: 'x' | 'z', seg = 24) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (axis === 'z') g.rotateX(Math.PI / 2);
    if (axis === 'x') g.rotateZ(Math.PI / 2);
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o;
  }
  link(a: THREE.Vector3, b: THREE.Vector3, rad: number, m: THREE.Material, geoFn?: (L: number) => THREE.BufferGeometry) {
    const d = b.clone().sub(a), L = d.length(), o = new THREE.Mesh(geoFn ? geoFn(L) : new THREE.CylinderGeometry(rad, rad, L, 12), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
    return o;
  }
  pane([[x1, y1], [x2, y2]]: [Pt, Pt], off: number) {
    const a = new V2(toX(x1), toY(y1)), b = new V2(toX(x2), toY(y2)), d = b.clone().sub(a);
    const n = new V2(-d.y, d.x).normalize(); if (n.y < 0) n.negate();
    const mid = a.clone().add(b).multiplyScalar(0.5).add(n.multiplyScalar(off));
    const o = this.box(d.length() * 0.8, 0.02, this.W * 0.82, M.glass, mid.x, mid.y, 0); o.rotation.z = Math.atan2(d.y, d.x); return o;
  }

  // --- wheels ---
  rimMat(rung: number) { const c = RIM_C[rung as 0]; return rung === 4 ? M.gold : rung === 3 ? this.glow(c, 1.4) : this.mat(std(c, { metalness: 0.9, roughness: 0.22 })); }
  spikes(g: THREE.Group, r: number, w: number, n: number, size: number, m: THREE.Material = M.chrome) {
    for (let i = 0; i < n; i++) for (const zz of [-w / 4, w / 4]) {
      const a = ((i + (zz > 0 ? 0.5 : 0)) / n) * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(size * 0.3, size, 6), m);
      c.position.set(Math.cos(a) * (r + size * 0.5), Math.sin(a) * (r + size * 0.5), zz); c.rotation.z = a - Math.PI / 2; g.add(c);
    }
  }
  /** Tire cross-section turned on a lathe: sidewall, rounded shoulders (k), flat tread. */
  tireGeo(r: number, w: number, rimR: number, k: number, seg = 48) {
    const hw = w / 2, p = [new V2(rimR, -hw * 0.97)], N = 6;
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI / 2; p.push(new V2(r - k + Math.sin(a) * k, -hw + k - Math.cos(a) * k)); }
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI / 2; p.push(new V2(r - k + Math.cos(a) * k, hw - k + Math.sin(a) * k)); }
    p.push(new V2(rimR, hw * 0.97));
    return new THREE.LatheGeometry(p, seg).rotateX(Math.PI / 2);
  }
  wheel(rung: Rung, r: number, w: number) {
    const g = new THREE.Group(), rimR = r * 0.6, n = [30, 20, 16, 16, 12][rung]!, h = TREAD[rung] / U;
    const k = Math.min(0.09, w * 0.3);
    g.add(new THREE.Mesh(this.tireGeo(r - 0.01, w, rimR, k), M.rubber));
    if (sidewallTex) { // raised white lettering round both sidewalls
      const ring = sidewallRing(rimR * 1.04, r - 0.01 - k * 0.9);
      for (const s of [-1, 1]) { const o = new THREE.Mesh(ring, M.letters); o.position.z = s * (w / 2 + 0.002); if (s < 0) o.rotation.y = Math.PI; g.add(o); }
    }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = r + h / 2 - 0.015;
      if (rung === 0) {
        for (const zz of [-w / 4, w / 4]) { const aa = a + (zz > 0 ? Math.PI / n : 0), l = this.box(h, 0.07, w * 0.3, M.rubber, Math.cos(aa) * rr, Math.sin(aa) * rr, zz); l.rotation.z = aa; g.add(l); }
      } else for (const sd of [-1, 1]) { // chevron lugs
        const l = this.box(h, [0, 0.08, 0.1, 0.11, 0.15][rung]!, w * 0.52, M.rubber, Math.cos(a) * rr, Math.sin(a) * rr, sd * w * 0.23); l.rotation.set(sd * 0.5, 0, a, 'ZYX'); g.add(l);
      }
    }
    if (rung === 3) this.spikes(g, r + h, w, 16, 0.14);
    if (rung === 4) { // Monster Treads: gold paddles across the tread and big gold spikes
      for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI * 2, p = this.box(h * 0.7, 0.05, w * 0.96, M.gold, Math.cos(a) * (r + h * 0.35), Math.sin(a) * (r + h * 0.35), 0); p.rotation.z = a; g.add(p); }
      this.spikes(g, r + h, w, 12, 0.2, M.gold);
    }
    const rm = this.rimMat(rung);
    g.add(this.cyl(rimR, rimR, w * 0.86, rm, 0, 0, 0, 'z', 32));
    for (const s of [-1, 1]) {
      const z = s * w * 0.43;
      g.add(this.cyl(rimR * 0.86, rimR * 0.86, 0.02, M.dark, 0, 0, z, 'z', 32));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rimR * 0.93, 0.03, 8, 40), M.chrome); ring.position.z = z; g.add(ring); // beadlock
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(this.cyl(0.014, 0.014, 0.03, M.chrome, Math.cos(a) * rimR * 0.93, Math.sin(a) * rimR * 0.93, z + s * 0.03, 'z', 6)); }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, sp = this.box(rimR * 0.72, 0.07, 0.03, rm, Math.cos(a) * rimR * 0.46, Math.sin(a) * rimR * 0.46, z + s * 0.012); sp.rotation.z = a; g.add(sp); }
      g.add(this.cyl(r * 0.17, r * 0.2, 0.07, M.chrome, 0, 0, z + s * 0.035, 'z'));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(this.cyl(0.013, 0.013, 0.1, M.dark, Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12, z + s * 0.05, 'z', 6)); }
    }
    return g;
  }

  // --- shell ---
  /** The shell, hollowed out for the cab: one cut right through it round all the side windows and down below their sills.
   *  The cut's walls are the cab, dark inside, and a skin painted like the shell covers each side but for the windows. */
  shell(cv: HTMLCanvasElement) {
    const { B, W, f } = this;
    const outer = shellShapes(B.path, SH.R), wins = shellShapes(B.win, SH.R * 0.4), winPts = parsePath(B.win).flat();
    const floor = -U * Math.max(CAB_FLOOR, -Math.max(...winPts.map(p => p[1])) / U - CAB_DEPTH);
    const hull = offsetHull(convexHull([...winPts, ...winPts.map(([x]): Pt => [x, floor])]), CAB_MARGIN), cut = roundShape(hull, 4), cutPts = cut.getPoints(4);
    const opts = { depth: W, bevelEnabled: true, bevelThickness: SH.bt, bevelSize: SH.bs, bevelSegments: SH.seg, curveSegments: 6 };
    const k = Math.max(0, outer.findIndex(o => inside(cutPts[0]!, o.getPoints(6))));
    // each shape extrudes as its lids then its walls, the outline's walls before the cut's: an uncut copy says where the cut's start
    const uncut = new THREE.ExtrudeGeometry(outer[k]!, opts), outlineWalls = uncut.groups[1]!.count;
    uncut.dispose();
    outer[k]!.holes.push(cut);
    const solid = new THREE.ExtrudeGeometry(outer, opts), walls = solid.groups[2 * k + 1]!, from = walls.start + outlineWalls, to = walls.start + walls.count;
    solid.translate(0, 0, -W / 2);
    const [geo, cab] = splitTriangles(solid, i => i >= from && i < to);
    solid.dispose();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!, pos = geo.attributes.position!, uv = geo.attributes.uv!; // UVs = side projection, so the paint canvas wraps the whole shell
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    uv.needsUpdate = true;
    creaseNormals(geo, 40);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const chrome = f.paint === 3, gold = f.paint === 4;
    const paint = this.mat(new THREE.MeshPhysicalMaterial({ map: tex, roughness: gold ? 0.2 : chrome ? 0.15 : 0.32, metalness: gold ? 0.85 : chrome ? 0.7 : 0, clearcoat: 1, clearcoatRoughness: 0.06 }));
    this.body.add(new THREE.Mesh(geo, paint));
    this.body.add(new THREE.Mesh(cab, M.cab));
    const pane = new THREE.ShapeGeometry(wins, 4), skinShape = roundShape(hull, 4);
    skinShape.holes.push(...wins);
    const skin = new THREE.ShapeGeometry(skinShape, 4), sp = skin.attributes.position!, suv = skin.attributes.uv!;
    for (let i = 0; i < sp.count; i++) suv.setXY(i, (sp.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (sp.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    for (const s of [1, -1]) {
      const face = s * (W / 2 + SH.bt), o = new THREE.Mesh(s > 0 ? skin : flipped(skin), paint), g = new THREE.Mesh(pane, M.tint);
      o.position.z = face + s * 0.001; g.position.z = face - s * 0.006; // the glass sits just inside the skin
      this.body.add(o, g);
    }
    this.driver();
    for (const seg of [B.shield, B.rear]) if (seg) this.body.add(this.pane(seg, SH.bs + 0.015));
    return { tex, bb };
  }

  /** The driver, in a firesuit and a helmet, belted in the middle of the cab behind the front-most side window. */
  driver() {
    const win = parsePath(this.B.win).map(q => ({ x0: Math.min(...q.map(p => p[0])), x1: Math.max(...q.map(p => p[0])), top: Math.min(...q.map(p => p[1])), bot: Math.max(...q.map(p => p[1])) }))
      .sort((a, b) => b.x1 - a.x1)[0];
    if (!win) return;
    const clear = (win.bot - win.top - 2 * SH.bs * U) / U, r = Math.min(0.14, Math.max(0.08, clear * 0.62));
    const x = toX((win.x0 + win.x1) / 2), y = toY((win.top + win.bot) / 2) + r * 0.25, d = new THREE.Group();
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M.helmet);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 24, 12, Math.PI * 0.68, Math.PI * 0.64, Math.PI * 0.3, Math.PI * 0.3), M.visor); // facing forward
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(r * 1.05, r * 1.4, 6, 12), M.suit); torso.position.set(-r * 0.25, -r * 2.2, 0);
    const seat = this.box(0.06, r * 4.5, r * 2.8, M.cab, -r * 1.35, -r * 1.6, 0);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, r * 0.12, 8, 24), M.dark); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0; wheel.rotation.z = 0.5; wheel.position.set(r * 1.6, -r * 1.6, 0);
    d.add(helmet, visor, torso, seat, wheel);
    d.position.set(x, y, 0);
    this.body.add(d);
  }

  // --- chassis and details ---
  chassis(w0: number, w1: number, zW: number) {
    const { r, tw, ch, W, truck } = this, y = ch - 0.1, zr = W * 0.3, mid = (w0 + w1) / 2, P = (x: number, y: number, z: number) => new V3(x, y, z);
    for (const s of [-1, 1]) truck.add(this.link(P(w0 - 0.5, y, s * zr), P(w1 + 0.5, y, s * zr), 0.045, M.frame));
    for (const x of [w0 - 0.45, w0 + 0.35, mid, w1 - 0.35, w1 + 0.45]) truck.add(this.link(P(x, y, -zr), P(x, y, zr), 0.035, M.frame));
    truck.add(this.box(0.5, 0.22, 0.36, M.dark, mid - 0.2, y - 0.12, 0)); // transmission
    truck.add(this.link(P(w0 + 0.15, r + 0.04, 0), P(mid - 0.45, y - 0.12, 0), 0.035, M.chrome), this.link(P(mid + 0.05, y - 0.12, 0), P(w1 - 0.15, r + 0.04, 0), 0.035, M.chrome));
    for (const wx of [w0, w1]) {
      const k = wx < mid ? 1 : -1;
      truck.add(this.link(P(wx, r, -(zW - tw / 2)), P(wx, r, zW - tw / 2), 0.065, M.dark));
      const diff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), M.dark); diff.position.set(wx, r, 0); diff.scale.z = 0.8; truck.add(diff);
      for (const s of [-1, 1]) {
        truck.add(this.link(P(wx, r - 0.06, s * zr), P(wx + k * 0.8, y, s * zr), 0.028, M.chrome), this.link(P(wx, r + 0.1, s * 0.14), P(wx + k * 0.6, y, s * 0.1), 0.028, M.chrome)); // 4-link
        for (const j of [-1, 1]) { // coil-overs
          const a = P(wx + j * 0.13, r + 0.03, s * (W / 2 - 0.06)), b = P(wx + j * 0.36, ch + 0.3, s * (W / 2 - 0.2));
          truck.add(this.link(a, b, 0.035, M.chrome), this.link(a, b, 0, M.shock, L => new THREE.TubeGeometry(new Helix(L * 0.5, 0.065, 7), 90, 0.013, 6).translate(0, L * 0.1, 0)));
        }
      }
    }
  }
  details(fx: number, headY: number) {
    const { B, W, ch, body, bodyId } = this, bw = toX(B.back) - SH.bs, fw = fx + 0.05, ext = W / 2 + SH.bt;
    if (!this.mouth) body.add(this.cyl(0.065, 0.065, W + 0.28, M.chrome, fw + 0.06, 0.08, 0, 'z')); // tube bumpers; a mouth takes the front one's place
    body.add(this.cyl(0.065, 0.065, W + 0.28, M.chrome, bw - 0.06, 0.08, 0, 'z'));
    const [mx, my] = B.shield[1];
    const tail = this.glow(0xff1a1a, 2.2);
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.018, 8, 28), M.chrome); t.rotation.y = Math.PI / 2; t.position.set(fx + 0.1, headY, s * W * 0.32); body.add(t);
      body.add(this.box(0.03, 0.08, 0.2, tail, bw - 0.012, 0.28, s * W * 0.36)); // tail lights
      body.add(this.box(0.04, 0.03, 0.12, M.dark, toX(mx) - 0.04, toY(my) + 0.05, s * (ext + 0.05)), this.box(0.05, 0.12, 0.09, M.dark, toX(mx) - 0.04, toY(my) + 0.08, s * (ext + 0.13))); // mirrors
    }
    if (bodyId !== 'dragster' && bodyId !== 'racecar' && this.f.topper !== 1) { // antenna; an Antenna Flag takes its place
      const { x: ax, y: ay, z } = this.antennaAt();
      body.add(this.cyl(0.006, 0.006, 0.6, M.dark, ax, ay + 0.3, z));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), M.dark); tip.position.set(ax, ay + 0.6, z); body.add(tip);
    }
    if (bodyId === 'pickup') body.add(this.box(toX(150) - toX(60) - 0.1, 0.01, W * 0.84, M.liner, (toX(60) + toX(150)) / 2, 0.45 + SH.bs + 0.006, 0)); // bed liner
    if (bodyId === 'bigfoot') {
      for (const s of [-1, 1]) body.add(this.box(1.1, 0.04, 0.16, M.dark, toX(200), 0.02, s * (ext + 0.08))); // side steps
      const sp = this.wheel(0, 0.28, 0.2); sp.rotation.y = Math.PI / 2; sp.position.set(bw - 0.1, 0.42, 0); body.add(sp); // spare wheel
    }
    if (bodyId === 'firetruck') { // ladder on the roof of the box
      const top = toY(-98) + SH.bs + 0.05, x0 = toX(50), x1 = toX(250);
      for (const s of [-1, 1]) body.add(this.link(new V3(x0, top, s * W * 0.28), new V3(x1, top, s * W * 0.28), 0.03, M.chrome));
      for (let x = x0 + 0.1; x < x1; x += 0.22) body.add(this.cyl(0.018, 0.018, W * 0.56, M.chrome, x, top, 0, 'z', 8));
      for (const s of [-1, 1]) body.add(this.cyl(0.04, 0.04, 0.12, M.dark, x0 + 0.1, top - 0.08, s * W * 0.28), this.cyl(0.04, 0.04, 0.12, M.dark, x1 - 0.1, top - 0.08, s * W * 0.28));
    }
    if (bodyId === 'schoolbus') { // stop sign arm on the driver's side
      const sign = this.cyl(0.14, 0.14, 0.025, this.glow(0xd90000, 0.6), toX(300), 0.72, -(ext + 0.07), 'z', 8); sign.rotation.z = Math.PI / 8; body.add(sign);
      body.add(this.box(0.1, 0.05, 0.05, M.dark, toX(300) + 0.12, 0.72, -(ext + 0.03)));
    }
    if (bodyId === 'jeep') {
      const sp = this.wheel(1, 0.3, 0.22); sp.rotation.y = Math.PI / 2; sp.position.set(bw - 0.14, 0.55, 0); body.add(sp); // spare on the tailgate
      for (const s of [-1, 1]) body.add(this.box(0.9, 0.04, 0.14, M.dark, toX(170), 0.02, s * (ext + 0.07))); // side steps
    }
    if (bodyId === 'towtruck') body.add(this.box(0.14, 0.18, W * 0.28, M.dark, toX(70), toY(-44) + SH.bs + 0.09, 0)); // winch on the bed (the boom is a later ticket)
    if (bodyId === 'police') { // red and blue light bar at the back of the roof
      const x = toX(118), y = toY(-116) + SH.bs + 0.05;
      body.add(this.box(0.16, 0.06, W * 0.7, M.dark, x, y - 0.02, 0));
      for (const s of [-1, 1]) body.add(this.box(0.14, 0.08, W * 0.3, this.glow(s < 0 ? 0xff1a1a : 0x1a6bff, 3.5), x, y + 0.04, s * W * 0.17));
    }
    if (bodyId === 'icecream') { // a giant cone on the roof
      const x = toX(80), y = toY(-124) + SH.bs;
      body.add(this.cyl(0.13, 0.02, 0.34, this.mat(std(0xd9a066, { roughness: 0.8 })), x, y + 0.17, 0, undefined, 16));
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), this.mat(std(0xffb3d1, { roughness: 0.6 }))); scoop.position.set(x, y + 0.4, 0); body.add(scoop);
    }
    if (bodyId === 'dragster') {
      body.add(this.box(0.3, 0.16, 0.34, M.chrome, toX(292), 0.32 + SH.bs + 0.08, 0), this.box(0.22, 0.12, 0.3, M.dark, toX(296), 0.32 + SH.bs + 0.22, 0)); // blower + scoop
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) { const p = this.cyl(0.028, 0.028, 0.22, M.chrome, toX(272 + i * 16), 0.24, s * (ext + 0.03)); p.rotation.x = s * 0.5; body.add(p); } // headers
        body.add(this.link(new V3(bw, 0.05, s * 0.22), new V3(bw - 0.75, -ch + 0.1, s * 0.22), 0.02, M.dark), this.cyl(0.06, 0.06, 0.04, M.rubber, bw - 0.78, -ch + 0.06, s * 0.22, 'z')); // wheelie bar
      }
    }
  }

  // --- Lights Mods ---
  lights(fx: number, headY: number, w0: number, w1: number) {
    const { B, W, ch, body } = this, rung = this.f.lights, e = SH.bs - 0.05, hm = this.glow(0xfff2c0, 3);
    for (const s of [-1, 1]) body.add(this.cyl(0.085, 0.085, 0.05, hm, fx + 0.07, headY, s * W * 0.32, 'x'));
    if (rung >= 1) { // Fog Lights
      const am = this.glow(0xffa000, 3);
      for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), am); o.position.set(fx + 0.17, 0.12, s * W * 0.28); body.add(o); }
      const bm = this.mat(new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      for (const s of [-1, 1]) { const cg = new THREE.ConeGeometry(0.55, 2.2, 24, 1, true); cg.rotateZ(Math.PI / 2); cg.translate(1.1, 0, 0); const b = new THREE.Mesh(cg, bm); b.position.set(fx + 0.1, headY, s * W * 0.32); body.add(b); }
      const sp = new THREE.SpotLight(0xfff0c0, 12, 7, 0.55, 0.6); sp.position.set(fx + 0.1, headY, 0); sp.target.position.set(fx + 3, -ch, 0); body.add(sp, sp.target);
    }
    if (rung >= 2) { // Roof Bar
      const bx = toX(B.roof[1]) - 0.18, by = toY(B.roof[2]) + 0.1 + e, cols = rung === 4 ? [0xff2d55, 0x3dff8b, 0x3dc8ff, 0xc04dff, 0xffd23f] : [rung === 3 ? 0x7ff9ff : 0xfff27a];
      body.add(this.box(0.16, 0.1, W * 0.8, M.dark, bx, by, 0));
      for (let i = 0; i < 5; i++) body.add(this.box(0.03, 0.07, W * 0.12, this.glow(cols[i % cols.length]!, 3.5), bx + 0.085, by, (i - 2) * W * 0.16));
      if (rung === 4) { // Laser Show: coloured beams fanning out from a turret on the bar, sweeping round
        const turret = new THREE.Group(); turret.position.set(bx, by + 0.1, 0); body.add(turret);
        turret.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), M.chrome));
        for (let i = 0; i < 8; i++) {
          const bm = this.mat(new THREE.MeshBasicMaterial({ color: [0xff2d55, 0x3dff8b, 0x3dc8ff, 0xc04dff][i % 4], transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
          const a = (i / 8) * Math.PI * 2, beam = this.link(new V3(0, 0, 0), new V3(Math.cos(a) * 3.2, 1.1 + (i % 2) * 0.6, Math.sin(a) * 3.2), 0.012, bm);
          beam.castShadow = false; turret.add(beam);
        }
        this.anim.lasers = turret;
      }
    }
    if (rung >= 3 && glowTex) { // Glow Under
      const gm = this.mat(new THREE.MeshBasicMaterial({ map: glowTex, color: rung === 4 ? 0xc04dff : 0x2ef2ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w1 - w0 + 1.8, W + 1.6), gm); pl.rotation.x = -Math.PI / 2; pl.position.set((w0 + w1) / 2, -ch + 0.02, 0); body.add(pl);
      const p = new THREE.PointLight(rung === 4 ? 0xc04dff : 0x2ef2ff, 4, 3); p.position.set((w0 + w1) / 2, -ch + 0.3, 0); body.add(p);
      this.anim.glow = { m: gm, l: p };
    }
  }

  // --- Grille Mods, on the front edge between the headlights ---
  /** Shark Teeth and Dragon Jaw are mouths: they take the front tube bumper's place. */
  get mouth() { return this.f.grille >= 3; }
  /** The front face a Grille Mod above Plain fills: bottom and top y, and half its width. Chrome Bars and Bull Bar sit
   *  above the tube bumper, standing proud of a short nose; a mouth has no bumper and goes lower. */
  grilleBox(headY: number) {
    const top = toY(Math.min(...parsePath(this.B.path)[0]!.filter(([x]) => x === this.B.front).map(([, y]) => y)));
    const y0 = Math.max(this.mouth ? 0.05 : 0.15, headY - 0.16);
    return { y0, y1: Math.max(y0 + 0.13, Math.min(top - 0.03, headY + 0.14)), hw: this.W * 0.32 - 0.12 };
  }
  grille(fx: number, headY: number) {
    const { body } = this, rung = this.f.grille, fw = fx + 0.05;
    if (rung === 0) { // Plain: thin slats on a dark panel
      body.add(this.box(0.03, 0.19, this.W * 0.38, M.dark, fw + 0.012, headY, 0));
      for (let i = 0; i < 7; i++) body.add(this.box(0.02, 0.17, 0.016, M.chrome, fw + 0.03, headY, (i - 3) * this.W * 0.052));
      return;
    }
    const { y0, y1, hw } = this.grilleBox(headY), H = y1 - y0, yc = (y0 + y1) / 2;
    const frame = (m: THREE.Material, t: number) => {
      for (const y of [y0 - t / 2, y1 + t / 2]) body.add(this.box(0.05, t, 2 * hw + 2 * t, m, fw + 0.025, y, 0));
      for (const s of [-1, 1]) body.add(this.box(0.05, H, t, m, fw + 0.025, yc, s * (hw + t / 2)));
    };
    const teeth = (m: THREE.Material, x: number, y: number, dir: 1 | -1, size: number, into: THREE.Object3D = body) => {
      const n = Math.max(4, Math.round((2 * hw) / (size * 0.9)));
      for (let i = 0; i < n; i++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(size * 0.42, size, 4), m);
        c.position.set(x, y + (dir * size) / 2, -hw + ((i + 0.5) / n) * 2 * hw); if (dir < 0) c.rotation.x = Math.PI; into.add(c);
      }
    };
    if (rung <= 2) { // Chrome Bars: a chrome surround and thick chrome bars
      body.add(this.box(0.03, H, 2 * hw, M.dark, fw + 0.012, yc, 0));
      frame(M.chrome, 0.04);
      const n = Math.max(3, Math.round(H / 0.06));
      for (let i = 0; i < n; i++) body.add(this.cyl(0.019, 0.019, 2 * hw, M.chrome, fw + 0.04, y0 + ((i + 0.5) / n) * H, 0, 'z', 12));
    }
    if (rung === 2) { // Bull Bar: a chrome push bar out in front
      const bx = fw + 0.24, bz = hw * 0.7, yt = y1 + 0.06, yb = -0.04, P = (x: number, y: number, z: number) => new V3(x, y, z);
      for (const s of [-1, 1]) {
        body.add(this.link(P(bx, yb, s * bz), P(bx, yt, s * bz), 0.036, M.chrome), this.link(P(bx, y1 - 0.04, s * bz), P(fw, y1 - 0.04, s * bz), 0.026, M.chrome));
        const j = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), M.chrome); j.position.set(bx, yt, s * bz); body.add(j);
      }
      for (const y of [yt, yc, 0.06]) body.add(this.cyl(0.03, 0.03, 2 * bz, M.chrome, bx, y, 0, 'z', 12));
    }
    if (rung === 3) { // Shark Teeth: a gunmetal-lipped mouth, dark red inside, full of white teeth
      body.add(this.box(0.03, H, 2 * hw, this.glow(0x5a0010, 0.5), fw + 0.012, yc, 0));
      frame(this.mat(std(0x2c323c, { roughness: 0.3, metalness: 0.6 })), 0.06);
      const tooth = this.mat(std(0xffffff, { roughness: 0.25 }));
      teeth(tooth, fw + 0.05, y1, -1, Math.min(0.1, H * 0.42)); teeth(tooth, fw + 0.05, y0, 1, Math.min(0.1, H * 0.42));
    }
    if (rung === 4) { // Dragon Jaw: a gold jaw with fire inside, gold horns, and a lower jaw that chomps
      const fire = this.glow(0xff2200, 0.9), ivory = this.mat(std(0xfff4d0, { roughness: 0.3 })), sz = Math.min(0.11, H * 0.45);
      body.add(this.box(0.03, H, 2 * hw, fire, fw + 0.012, yc, 0), this.box(0.032, H * 0.22, hw * 0.9, this.glow(0xffa000, 1.4), fw + 0.02, yc, 0));
      body.add(this.box(0.08, 0.06, 2 * hw + 0.12, M.gold, fw + 0.04, y1 + 0.03, 0));
      for (const s of [-1, 1]) {
        body.add(this.box(0.08, H + 0.06, 0.06, M.gold, fw + 0.04, yc + 0.03, s * (hw + 0.03)));
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 12), M.gold);
        horn.position.set(fw + 0.02, y1 + 0.14, s * (hw + 0.02)); horn.rotation.set(s * 0.55, 0, 0.35); body.add(horn);
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.03, sz * 1.5, 6), ivory); fang.rotation.x = Math.PI; fang.position.set(fw + 0.08, y1 - sz * 0.75, s * (hw - 0.04)); body.add(fang);
      }
      teeth(ivory, fw + 0.07, y1, -1, sz);
      const hinge = new THREE.Group(); hinge.position.set(fw, y0, 0); body.add(hinge);
      hinge.add(this.box(0.2, 0.07, 2 * hw + 0.12, M.gold, 0.1, -0.035, 0));
      teeth(ivory, 0.13, 0, 1, sz, hinge);
      this.anim.jaw = { hinge, fire };
    }
  }

  // --- Exhaust Mods: a tailpipe at the rear, then twin stacks behind the cab that grow, catch fire and turn gold ---
  /** Where the stacks stand: x, the shell's top there (base), their tops, and how far out to each side. */
  stackAt() {
    const { B, W } = this, x = B.stack, base = toY(Math.min(...parsePath(B.path).flatMap(q => q.flatMap((a, i) => {
      const b = q[(i + 1) % q.length]!;
      return (a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0] ? [a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])] : [];
    })))) + SH.bs - 0.02;
    return { x: toX(x), base, top: Math.max(base + 0.45, toY(B.roof[2]) + 0.3), z: W * 0.38 };
  }
  /** The Tailpipe: a short pipe out of the back, low down on the left. A Tractor's is one stack up through its hood. */
  tailpipe(stack: ReturnType<Builder['stackAt']>): Tip {
    const { B, W, body, ch } = this;
    if (this.bodyId === 'tractor') {
      const { x, base } = stack, z = W * 0.2;
      body.add(this.cyl(0.04, 0.04, 0.6, M.chrome, x, base + 0.3, z), this.cyl(0.05, 0.04, 0.08, M.dark, x, base + 0.62, z));
      return { p: new V3(x, ch + base + 0.68, z), dir: new V3(0, 1, 0) };
    }
    const bx = toX(B.back) - SH.bs, y = 0.2, z = -W * 0.22;
    body.add(this.cyl(0.05, 0.05, 0.32, M.chrome, bx, y, z, 'x', 16), this.cyl(0.06, 0.06, 0.05, M.dark, bx - 0.16, y, z, 'x', 16));
    return { p: new V3(bx - 0.2, ch + y, z), dir: new V3(-1, 0.15, 0).normalize() };
  }
  exhaust(stack: ReturnType<Builder['stackAt']>): Tip[] {
    const rung = this.f.exhaust;
    if (rung === 0) return [this.tailpipe(stack)];
    const { body, ch } = this, { x, base, top, z } = stack, L = top - base;
    const r = [0, 0.045, 0.06, 0.055, 0.06][rung]!, pipe = rung === 4 ? M.gold : M.chrome, tips: Tip[] = [];
    for (const s of [-1, 1]) {
      const zz = s * z;
      body.add(this.cyl(r, r, L, pipe, x, base + L / 2, zz, undefined, 16));
      if (rung === 1) body.add(this.cyl(r + 0.007, r, 0.08, M.dark, x, top + 0.04, zz, undefined, 16)); // Twin Stacks: rain caps
      if (rung >= 2) { // a flared mouth, and a black heat shield halfway up
        body.add(this.cyl(r * 1.45, r, 0.1, pipe, x, top + 0.05, zz, undefined, 16));
        body.add(this.cyl(r + 0.012, r + 0.012, L * 0.35, M.dark, x, base + L * 0.45, zz, undefined, 16));
      }
      if (rung >= 3) body.add(this.cyl(r * 1.5, r * 1.5, 0.025, this.glow(rung === 4 ? 0xff3df0 : 0xff5a00, 2.5), x, top + 0.1, zz, undefined, 16)); // a red-hot rim
      tips.push({ p: new V3(x, ch + top + 0.1, zz), dir: new V3(0, 1, 0) });
    }
    return tips;
  }

  // --- Horn Mods: only the Train Horn shows, as three chrome trumpets on the roof ---
  horn() {
    if (this.f.horn !== 4) return;
    const { B, W, body } = this, [x0, x1, ry] = B.roof, x = toX((x0 + x1) / 2), y = toY(ry) + SH.bs + 0.09;
    body.add(this.box(0.5, 0.04, 0.3, M.dark, x, y - 0.05, 0));
    [0.34, 0.44, 0.54].forEach((L, i) => {
      const t = this.cyl(0.035, 0.085, L, M.chrome, x + 0.05, y + 0.02, (i - 1) * W * 0.12, 'x', 20);
      t.position.x += L / 2 - 0.2; body.add(t);
    });
  }

  // --- Roof Topper Mods, on the back of the roof, behind any Roof Bar ---
  /** Where the antenna (or an Antenna Flag) stands: at the back corner of the roof. */
  antennaAt() { return { x: toX(this.B.roof[0]) + 0.06, y: toY(this.B.roof[2]) + SH.bs, z: this.W * 0.42 }; }
  /** Where a Roof Topper sits: x, and the roof's top. */
  topperAt() { return { x: toX(this.B.topper), y: toY(this.B.roof[2]) + SH.bs }; }
  topper() {
    const rung = this.f.topper;
    if (!rung) return;
    const { W, body } = this, { x, y } = this.topperAt();
    if (rung === 1) { // Antenna Flag: a tall whip where the antenna is, flying a checkered flag that waves
      const { x: ax, z } = this.antennaAt(), H = 0.95, fw = 0.36, fh = 0.22;
      body.add(this.cyl(0.008, 0.012, H, M.dark, ax, y + H / 2, z, undefined, 8));
      const geo = new THREE.PlaneGeometry(fw, fh, 8, 5).translate(-fw / 2, 0, 0).toNonIndexed(), pos = geo.attributes.position!, col: number[] = [];
      for (let i = 0; i < pos.count; i += 3) { // each triangle takes the colour of its square
        const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
        const k = (Math.floor((-cx / fw) * 8) + Math.floor(((cy + fh / 2) / fh) * 5)) % 2 ? 0.05 : 1;
        for (let j = 0; j < 3; j++) col.push(k, k, k);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const flag = new THREE.Mesh(geo, this.mat(std(0xffffff, { vertexColors: true, roughness: 0.7, side: THREE.DoubleSide })));
      flag.position.set(ax, y + H - fh / 2 - 0.02, z); body.add(flag);
      const x0 = Float32Array.from({ length: pos.count }, (_, i) => pos.getX(i));
      this.anim.wave = t => {
        for (let i = 0; i < pos.count; i++) { const d = -x0[i]!; pos.setZ(i, Math.sin(d * 18 - t / 110) * 0.05 * (d / fw)); }
        pos.needsUpdate = true; geo.computeVertexNormals();
      };
    }
    if (rung === 2) { // Spoiler: a red wing on two struts across the back of the roof, with end plates
      const wing = this.mat(std(0xe63946, { roughness: 0.25, metalness: 0.3 }));
      for (const s of [-1, 1]) body.add(this.box(0.05, 0.2, 0.03, M.dark, x, y + 0.1, s * W * 0.3), this.box(0.3, 0.14, 0.02, M.dark, x - 0.02, y + 0.21, s * W * 0.47));
      const w = this.box(0.26, 0.035, W * 0.93, wing, x - 0.02, y + 0.21, 0); w.rotation.z = -0.15; body.add(w);
    }
    if (rung === 3) { // Bull Horns: a big pair of longhorns on a plate, curving out and up to black tips
      const ivory = this.mat(std(0xfff4d0, { roughness: 0.35 }));
      body.add(this.box(0.22, 0.04, 0.3, M.dark, x, y + 0.02, 0));
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), M.dark); boss.position.set(x, y + 0.05, 0); boss.scale.y = 0.6; body.add(boss);
      for (const s of [-1, 1]) {
        const c = new THREE.QuadraticBezierCurve3(new V3(x, y + 0.07, s * 0.06), new V3(x, y + 0.04, s * W * 0.42), new V3(x + 0.08, y + 0.42, s * W * 0.48)), N = 8;
        const pts = c.getPoints(N), rad = (i: number) => 0.085 - (0.075 * i) / N;
        for (let i = 0; i < N; i++) {
          body.add(this.link(pts[i]!, pts[i + 1]!, 0, i === N - 1 ? M.dark : ivory, L => new THREE.CylinderGeometry(rad(i + 1), rad(i), L, 12)));
          const j = new THREE.Mesh(new THREE.SphereGeometry(rad(i), 12, 8), ivory); j.position.copy(pts[i]!); body.add(j);
        }
      }
    }
    if (rung === 4) { // Siren: a gold base under a clear dome, with red and blue lamps inside that spin and flash
      body.add(this.cyl(0.19, 0.21, 0.08, M.gold, x, y + 0.04, 0, undefined, 24));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat(std(0xffffff, { transparent: true, opacity: 0.3, roughness: 0.05 })));
      dome.position.set(x, y + 0.08, 0); dome.scale.y = 1.5; body.add(dome);
      const rotor = new THREE.Group(); rotor.position.set(x, y + 0.18, 0); body.add(rotor);
      const red = this.glow(0xff1a1a, 3), blue = this.glow(0x1a6bff, 3);
      rotor.add(this.cyl(0.025, 0.025, 0.18, M.chrome, 0, 0, 0, undefined, 8));
      [red, blue].forEach((m, i) => {
        const s = i ? -1 : 1, beam = this.mat(new THREE.MeshBasicMaterial({ color: i ? 0x1a6bff : 0xff1a1a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        rotor.add(this.box(0.04, 0.13, 0.16, m, s * 0.07, 0, 0));
        const cg = new THREE.ConeGeometry(0.3, 1.4, 20, 1, true); cg.rotateZ(s * Math.PI / 2); cg.translate(s * 0.75, 0, 0); rotor.add(new THREE.Mesh(cg, beam));
      });
      const light = new THREE.PointLight(0xff1a1a, 3, 3); light.position.set(x, y + 0.4, 0); body.add(light);
      this.anim.siren = { rotor, lamps: [red, blue], light };
    }
  }

  // --- Door Number: a panel on each side of the shell, just off its flat face ---
  doorNumber(spot: NumberSpot) {
    const { f } = this, box = numberBox(spot), w = box.x1 - box.x0, h = box.y1 - box.y0;
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round((512 * h) / w);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    let n = f.doorNumber;
    const draw = () => { drawNumber(cv, f.number, n, spot); tex.needsUpdate = true; };
    draw();
    if (typeof document.fonts?.load === 'function' && !document.fonts.check('100px Bungee')) void document.fonts.load('100px Bungee').then(draw, () => {});
    const gold = f.number === 4;
    const m = this.mat(std(0xffffff, { map: tex, transparent: true, roughness: 0.3, metalness: gold ? 0.5 : 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...(gold ? { emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.8 } : {}) }));
    if (gold) this.anim.goldNumber = m;
    const geo = new THREE.PlaneGeometry(w / U, h / U), z = this.W / 2 + SH.bt + 0.004;
    for (const side of [1, -1]) {
      const o = new THREE.Mesh(geo, m); o.position.set(toX((box.x0 + box.x1) / 2), toY((box.y0 + box.y1) / 2), side * z);
      if (side < 0) o.rotation.y = Math.PI;
      this.body.add(o);
    }
    return { tex, set: (to: number) => { n = to; draw(); } };
  }

  build(): BuiltTruck {
    const { B, f, r, tw, W } = this;
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
    const { tex, bb } = this.shell(cv), spot = numberSpot(this.bodyId, f.decals, f.tires), fitted = f.number ? spot : null;
    const draw = (t: number) => { drawPaint(cv, bb, B, f, this.bodyId, fitted, t); tex.needsUpdate = true; };
    draw(performance.now());
    if (f.paint >= 3) this.anim.repaint = draw;
    const fx = toX(B.front) + SH.bs - 0.05, headY = toY(B.head[1]), [w0, w1] = B.wheels.map(toX) as [number, number], zW = W / 2 + tw / 2 + 0.04;
    this.details(fx, headY);
    this.chassis(w0, w1, zW);
    for (const wx of [w0, w1]) for (const s of [-1, 1]) {
      const wh = this.wheel(f.tires, r, tw); wh.position.set(wx, r, s * zW); this.truck.add(wh);
      if (f.tires >= 3) this.anim.spin.push(wh);
    }
    this.grille(fx, headY);
    this.lights(fx, headY, w0, w1);
    this.horn();
    this.topper();
    const num = fitted && this.doorNumber(fitted);
    const roofTop = this.topperAt(), flagAt = this.antennaAt(), stack = this.stackAt(), exhaust = new Exhaust(f.exhaust, this.exhaust(stack)), tip = exhaust.tips[0]!.p;
    this.truck.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = !(o.material as THREE.Material).transparent; });
    const ch = this.ch;
    return {
      group: this.truck,
      anim: this.anim,
      exhaust,
      setDoorNumber: n => num?.set(n),
      anchors: side => {
        const sideAt = ([x, y]: Pt) => ({ p: new V3(toX(x), ch + toY(y), side * (W / 2 + 0.1)), n: new V3(0, 0, side), min: 0.2 });
        return {
          tires: { p: new V3(toX(B.wheels[0]), r, side * (zW + tw / 2 + 0.03)), n: new V3(0, 0, side), min: 0.2 },
          paint: sideAt(B.hot.paint),
          decals: sideAt(B.hot.decals),
          number: sideAt([spot.x, spot.y]),
          lights: { p: new V3(toX(B.front) + 0.14, ch + toY(B.head[1]), 0), n: new V3(1, 0, 0), min: -0.15 },
          horn: { p: new V3(toX(B.hot.horn[0]), ch + toY(B.hot.horn[1]), 0), n: null, min: 0 },
          engine: { p: new V3(toX(B.hot.engine[0]), ch + toY(B.hot.engine[1]), 0), n: null, min: 0 },
          grille: { p: new V3(toX(B.front) + 0.14, ch + Math.max(0.05, headY - 0.16), 0), n: new V3(1, 0, 0), min: -0.15 }, // below Lights, the same for every Rung
          exhaust: f.exhaust ? { p: new V3(stack.x, ch + stack.top, side * stack.z), n: null, min: 0 } // on a stack
            : this.bodyId === 'tractor' ? { p: tip.clone(), n: null, min: 0 } : { p: tip.clone(), n: new V3(-1, 0, 0), min: -0.15 }, // on the Tailpipe
          topper: f.topper === 1 ? { p: new V3(flagAt.x - 0.18, ch + flagAt.y + 0.85, side * flagAt.z), n: null, min: 0 } // on the flag
            : { p: new V3(roofTop.x, ch + roofTop.y + 0.35, 0), n: null, min: 0 }, // over the back of the roof
        };
      },
      dispose: () => {
        this.truck.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
        for (const m of this.own) if (!SHARED.has(m)) m.dispose();
        tex.dispose(); num?.tex.dispose();
        exhaust.dispose();
      },
    };
  }
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(readonly L: number, readonly R: number, readonly turns: number) { super(); }
  override getPoint(t: number, v = new V3()) { const a = t * this.turns * Math.PI * 2; return v.set(Math.cos(a) * this.R, (t - 0.5) * this.L, Math.sin(a) * this.R); }
}

// ---------- Paint and Decals: one canvas, drawn in profile units and projected from the side ----------
/** `num` is where a fitted Door Number is: the Stripes break round it. */
function drawPaint(cv: HTMLCanvasElement, bb: THREE.Box3, B: BodyShape, f: Fit, bodyId: BodyId, num: NumberSpot | null, t: number) {
  const c = cv.getContext('2d')!, CW = cv.width, CH = cv.height, dx = bb.max.x - bb.min.x, dy = bb.max.y - bb.min.y;
  c.setTransform(CW / (U * dx), 0, 0, CH / (U * dy), (-2 - bb.min.x) * CW / dx, CH + (bb.min.y * CH) / dy);
  let fill: string | CanvasGradient;
  const colour = colourById(f.colour); // Plain is the Colour, and Fire Fade burns back into its deep shade
  if (f.paint === 0) fill = colour.hex;
  else if (f.paint === 1) fill = '#1e7bff';
  else if (f.paint === 2) { fill = c.createLinearGradient(B.front, 0, B.back, 0); fill.addColorStop(0, '#ffe14d'); fill.addColorStop(0.45, '#ff6a00'); fill.addColorStop(1, colour.deep); }
  else if (f.paint === 4) { fill = c.createLinearGradient(0, -130, 0, 0); fill.addColorStop(0, '#fff1a8'); fill.addColorStop(0.45, '#e0a800'); fill.addColorStop(1, '#8a6100'); }
  else {
    const off = (t * 0.08) % 200, cols = ['#ff3b3b', '#ffb800', '#f4ff5a', '#3dff8b', '#3dc8ff', '#c04dff'];
    fill = c.createLinearGradient(-400 + off, 0, 800 + off, 0);
    for (let k = 0; k <= 36; k++) fill.addColorStop(k / 36, cols[k % 6]!);
  }
  c.fillStyle = fill; c.fillRect(-100, -200, 600, 300);
  const sh = c.createLinearGradient(0, -120, 0, 5); sh.addColorStop(0, 'rgba(255,255,255,.14)'); sh.addColorStop(1, 'rgba(0,0,0,.28)');
  c.fillStyle = sh; c.fillRect(-100, -200, 600, 300);
  if (f.paint === 4) { // Gold Flake: flakes that catch the light in turn
    const rn = seeded(11);
    for (let i = 0; i < 260; i++) {
      const x = B.back + rn() * (B.front - B.back), y = -rn() * 130, k = 0.5 + 0.5 * Math.sin(t * 0.004 + i * 1.7);
      c.fillStyle = `rgba(255,255,230,${(0.15 + 0.85 * k * k).toFixed(2)})`; c.fillRect(x, y, 1.6 + rn() * 1.6, 1.6 + rn() * 1.6);
    }
  }
  c.save(); c.clip(new Path2D(B.path));
  if (f.decals === 1) { c.fillStyle = '#fff'; for (const p of decalShapes(B, 1, num)) { c.beginPath(); p.forEach(([x, y]) => c.lineTo(x, y)); c.fill(); } }
  if (f.decals === 2) { c.save(); c.translate(B.front, 0); c.fillStyle = '#ff7a00'; c.fill(new Path2D(FLAME1)); c.fillStyle = '#ffe14d'; c.fill(new Path2D(FLAME2)); c.restore(); }
  if (f.decals === 3) {
    const b = new Path2D(BOLT); c.lineWidth = 2.5; c.strokeStyle = '#111'; c.fillStyle = '#fff23a'; c.lineJoin = 'round';
    for (const [dx, k] of BOLTS) { c.save(); c.translate(B.mid + dx, 0); c.scale(k, k); c.fill(b); c.stroke(b); c.restore(); }
  }
  if (f.decals === 4) { // Skull & Wings
    c.save(); c.translate(B.mid, 0); c.lineWidth = 2.5; c.strokeStyle = '#111'; c.lineJoin = 'round';
    const wing = new Path2D(WING); c.fillStyle = '#f2f2f2';
    for (const sx of [1, -1]) { c.save(); c.scale(sx, 1); c.fill(wing); c.stroke(wing); c.restore(); }
    c.beginPath(); c.arc(...SKULL.head, 0, Math.PI * 2); c.rect(...SKULL.jaw); c.fill(); c.stroke();
    c.fillStyle = '#111'; c.beginPath(); c.arc(-6, -38, 4.5, 0, Math.PI * 2); c.arc(6, -38, 4.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(0, -33); c.lineTo(-2.5, -29); c.lineTo(2.5, -29); c.fill();
    for (const x of [-4.5, 0, 4.5]) { c.beginPath(); c.moveTo(x, -26); c.lineTo(x, -17); c.stroke(); }
    c.restore();
  }
  realPaint(c, B, bodyId);
  c.restore();
}

/** Window seals, door seam and handle, tailgate, and mud up the lower panels. */
function realPaint(c: CanvasRenderingContext2D, B: BodyShape, bodyId: BodyId) {
  c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = '#16181c'; c.stroke(new Path2D(B.win));
  if (bodyId === 'schoolbus') { c.fillStyle = '#16181c'; c.fillRect(B.back, -66, B.front - B.back, 4); c.fillRect(B.back, -46, B.front - B.back, 4); }
  if (bodyId === 'firetruck') { c.lineWidth = 1.6; c.strokeStyle = 'rgba(0,0,0,.55)'; for (let x = 44; x < 240; x += 66) { c.beginPath(); c.roundRect(x, -90, 58, 80, 5); c.stroke(); } }
  if (bodyId === 'dumptruck') { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.4)'; for (let x = 62; x < 232; x += 42) { c.beginPath(); c.moveTo(x, -114); c.lineTo(x, -8); c.stroke(); } }
  if (bodyId === 'icecream') { c.fillStyle = '#ff8fc0'; for (let x = 90; x < 200; x += 22) { c.beginPath(); c.moveTo(x, -104); c.lineTo(x + 11, -116); c.lineTo(x + 22, -104); c.fill(); } } // awning over the serving window
  if (bodyId !== 'dragster' && bodyId !== 'schoolbus' && bodyId !== 'icecream') {
    const [x0, x1, ry] = B.roof, dw = (x1 - x0) * 0.72, wy = Math.max(...parsePath(B.win).flat().map(p => p[1]));
    c.lineWidth = 1.6; c.strokeStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.roundRect(x0 + 4, ry + 3, dw, -ry - 9, 6); c.stroke();
    c.fillStyle = '#24272c'; c.beginPath(); c.roundRect(x0 + dw - 22, wy + 9, 16, 4, 2); c.fill();
  }
  if (bodyId === 'pickup') { c.lineWidth = 1.6; c.beginPath(); c.moveTo(B.back + 7, -39); c.lineTo(B.back + 7, -5); c.moveTo(150, -44); c.lineTo(150, -5); c.stroke(); }
  const mud = c.createLinearGradient(0, -30, 0, 0); mud.addColorStop(0, 'rgba(92,64,38,0)'); mud.addColorStop(1, 'rgba(92,64,38,.65)'); c.fillStyle = mud; c.fillRect(-100, -30, 600, 30);
  const rn = seeded(7); c.fillStyle = 'rgba(84,58,34,.6)';
  for (let i = 0; i < 110; i++) { const x = B.back + rn() * (B.front - B.back), y = -(rn() ** 2) * 44, r = 0.8 + rn() * 3.2; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
}

// ---------- Door Number: its own canvas, the number's box from numberBox ----------
const FLAME_UP = 'M0,0 C-10,-8 -8,-22 0,-36 C4,-24 14,-18 10,-4 C16,-10 18,-18 18,-24 C26,-12 24,0 18,6 Z';

/** Plain white, white Outlined in black and red, Flaming with fire off the top, or Glowing Gold; on a plate when it covers a Decal. */
function drawNumber(cv: HTMLCanvasElement, style: Rung, n: number, spot: NumberSpot) {
  const c = cv.getContext('2d')!, W = cv.width, H = cv.height, k = W / (1.6 * spot.h); // canvas px per profile unit
  const cx = W / 2, cy = 0.8 * spot.h * k, dh = spot.h * k, text = String(n);
  c.clearRect(0, 0, W, H);
  if (spot.plate) { c.fillStyle = '#16181c'; c.strokeStyle = '#f2f2f2'; c.lineWidth = 12; c.beginPath(); c.roundRect(8, 8, W - 16, H - 16, 40); c.fill(); c.stroke(); }
  c.font = `400 ${dh}px Bungee, "Arial Black", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  const m = c.measureText(text), size = dh * Math.min(dh / Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), (W * 0.84) / Math.max(1, m.width));
  c.font = `400 ${size}px Bungee, "Arial Black", sans-serif`;
  const mm = c.measureText(text), base = cy + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) / 2, top = base - mm.actualBoundingBoxAscent;
  const maxW = W * 0.84, outline = (w: number, col: string) => { c.lineWidth = w; c.strokeStyle = col; c.strokeText(text, cx, base, maxW); };
  if (style === 1) { outline(dh * 0.06, '#16181c'); c.fillStyle = '#fff'; }
  if (style === 2) { outline(dh * 0.24, '#e63946'); outline(dh * 0.13, '#111'); c.fillStyle = '#fff'; }
  if (style === 3) {
    const fl = new Path2D(FLAME_UP), half = mm.width / 2;
    for (let i = 0; i < 5; i++) {
      const x = cx - half + (mm.width * (i + 0.5)) / 5, s = (dh / 60) * (i % 2 ? 0.8 : 1.05);
      c.save(); c.translate(x, top + dh * 0.12); c.scale(s, s); c.fillStyle = '#ff6a00'; c.fill(fl); c.scale(0.6, 0.6); c.fillStyle = '#ffe14d'; c.fill(fl); c.restore();
    }
    outline(dh * 0.15, '#111');
    const g = c.createLinearGradient(0, top, 0, base); g.addColorStop(0, '#ffe14d'); g.addColorStop(0.5, '#ff8a00'); g.addColorStop(1, '#d42000'); c.fillStyle = g;
  }
  if (style === 4) {
    c.save(); c.shadowColor = '#ffd23f'; c.shadowBlur = dh * 0.25; outline(dh * 0.16, '#3a2600'); c.restore();
    const g = c.createLinearGradient(0, top, 0, base); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.45, '#ffc21a'); g.addColorStop(1, '#9a6a00'); c.fillStyle = g;
  }
  c.fillText(text, cx, base, maxW);
}

export const buildTruck = (body: BodyId, fit: Fit): BuiltTruck => new Builder(body, fit).build();
