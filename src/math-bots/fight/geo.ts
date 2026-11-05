// @ts-nocheck: ported from the P7 prototype. Its TSL node graphs and terse maths don't fit the strict compiler flags, so the typed edge is stage.ts.
// Hard-surface geometry kit. Everything is built from "bevelled" primitives whose normals are
// continuous across the bevel and flat on the faces (the mid-poly / weighted-normal workflow),
// so a 3 mm chamfer catches a real highlight. Each vertex also carries aWear:
//   x = edge (1 on bevels, falling to 0 over a band on the face), y = cavity, z = per-part random.
import * as THREE from 'three';

export type V2 = [number, number];
export type V3 = [number, number, number];
export const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);

export class Rng {
  s: number;
  constructor(s = 1) { this.s = s >>> 0 || 1; }
  f() { // mulberry32
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  r(a: number, b: number) { return a + (b - a) * this.f(); }
}
const rng = new Rng(7);

/** Geometry accumulator. */
export class GB {
  pos: number[] = []; nor: number[] = []; uv: number[] = []; wear: number[] = []; idx: number[] = [];
  get n() { return this.pos.length / 3; }
  v(p: THREE.Vector3, n: THREE.Vector3, u: number, v: number, e: number, c: number, r: number) {
    this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.uv.push(u, v); this.wear.push(e, c, r);
    return this.n - 1;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aWear', new THREE.Float32BufferAttribute(this.wear, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

/** Frame whose +Z is the outward face normal: plate polygons are drawn in (u, v). */
export function fr(o: V3, u: V3, v: V3) {
  const U = v3(u).normalize(), V = v3(v).normalize();
  const W = new THREE.Vector3().crossVectors(U, V).normalize();
  V.crossVectors(W, U).normalize();
  return new THREE.Matrix4().makeBasis(U, V, W).setPosition(o[0], o[1], o[2]);
}
export const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
export const RX = (a: number) => new THREE.Matrix4().makeRotationX(a);
export const RY = (a: number) => new THREE.Matrix4().makeRotationY(a);
export const RZ = (a: number) => new THREE.Matrix4().makeRotationZ(a);
export const mul = (...m: THREE.Matrix4[]) => m.reduce((a, b) => a.clone().multiply(b));

type Contour = { p: V2[]; n: V2[]; c: V2[]; r: number[]; sharp: V2[]; bis: V2[]; };

function contour(poly: V2[], cr: number, hole: boolean, segs = 2): Contour {
  // Rounds every corner; returns points with exact outward (from the material) normals.
  const out: Contour = { p: [], n: [], c: [], r: [], sharp: [], bis: [] };
  const N = poly.length;
  for (let i = 0; i < N; i++) {
    const a = poly[(i + N - 1) % N], b = poly[i], c = poly[(i + 1) % N];
    let ux = b[0] - a[0], uy = b[1] - a[1]; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    let vx = c[0] - b[0], vy = c[1] - b[1]; const vl = Math.hypot(vx, vy); vx /= vl; vy /= vl;
    const cross = ux * vy - uy * vx; const dot = ux * vx + uy * vy;
    const ang = Math.atan2(Math.abs(cross), dot);
    const na: V2 = [uy, -ux], nb: V2 = [vy, -vx];
    const bl = Math.hypot(na[0] + nb[0], na[1] + nb[1]) || 1; const bis: V2 = [(na[0] + nb[0]) / bl, (na[1] + nb[1]) / bl];
    const sharpFactor = 1 / Math.max(0.25, Math.cos(ang / 2));
    if (ang < 0.03 || cr <= 0) { // straight enough: one vertex
      out.p.push(b); out.n.push(bis); out.c.push(b); out.r.push(0); out.sharp.push(b); out.bis.push([bis[0] * sharpFactor, bis[1] * sharpFactor]);
      continue;
    }
    const r = Math.min(cr, Math.min(ul, vl) * 0.45 / Math.max(0.05, Math.tan(ang / 2)));
    const d = r * Math.tan(ang / 2);
    const convex = cross > 0;
    const sign = convex ? -1 : 1;
    const start: V2 = [b[0] - ux * d, b[1] - uy * d];
    const cen: V2 = [start[0] + sign * na[0] * r, start[1] + sign * na[1] * r];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs; const th = Math.atan2(na[1], na[0]) + (convex ? 1 : -1) * ang * t * (1);
      const nx = Math.cos(th), ny = Math.sin(th);
      out.p.push([cen[0] - sign * nx * r, cen[1] - sign * ny * r]); out.n.push([nx, ny]);
      out.c.push(cen); out.r.push(convex ? r : -r); out.sharp.push(b); out.bis.push([bis[0] * sharpFactor, bis[1] * sharpFactor]);
    }
  }
  return out;
}

function inset(c: Contour, i: number, d: number): V2 {
  // Position pushed `d` into the material without folding over small corner radii.
  const r = c.r[i];
  if (r > 0 && d > r * 0.9) return [c.sharp[i][0] - c.bis[i][0] * d, c.sharp[i][1] - c.bis[i][1] * d];
  return [c.p[i][0] - c.n[i][0] * d, c.p[i][1] - c.n[i][1] * d];
}

export type PlateOpt = {
  poly: V2[]; t?: number; b?: number; cr?: number; band?: number; M?: THREE.Matrix4;
  holes?: { c: V2; r: number; n?: number }[]; cav?: number; wear?: number; bevelSegs?: number; lean?: boolean;
};

/** A laser-cut plate: rounded corners, real chamfer, wear band, optional round holes. +Z is the top face. */
export function plate(g: GB, o: PlateOpt) {
  const i0 = g.idx.length; plateInner(g, o); fixWinding(g, i0, o.M);
}
function fixWinding(g: GB, i0: number, M?: THREE.Matrix4) {
  if (!M || M.determinant() >= 0) return;
  for (let i = i0; i < g.idx.length; i += 3) { const t = g.idx[i + 1]; g.idx[i + 1] = g.idx[i + 2]; g.idx[i + 2] = t; }
}
function plateInner(g: GB, o: PlateOpt) {
  let poly = o.poly.slice();
  if (THREE.ShapeUtils.area(poly.map(([x, y]) => new THREE.Vector2(x, y))) < 0) poly.reverse();
  const t = o.t ?? 0.012, b = Math.min(o.b ?? 0.0035, t * 0.45), cr = o.cr ?? 0.006;
  const M = o.M ?? new THREE.Matrix4();
  const nm = new THREE.Matrix3().getNormalMatrix(M);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const minDim = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const band = o.lean ? 0.0006 : Math.min(o.band ?? 0.025, minDim * 0.22);
  const wear = o.wear ?? 1, cav = o.cav ?? 0;
  const rnd = rng.f();
  const uo = rng.r(0, 9), vo = rng.r(0, 9), rot = rng.r(0, 6.28), cs = Math.cos(rot), sn = Math.sin(rot);
  const uvT = (x: number, y: number): V2 => [cs * x - sn * y + uo, sn * x + cs * y + vo];

  const contours: Contour[] = [contour(poly, cr, false, o.lean ? 1 : 2)];
  for (const h of o.holes ?? []) {
    const n = h.n ?? 16; const pts: V2[] = [];
    for (let i = 0; i < n; i++) { const a = -(i / n) * Math.PI * 2; pts.push([h.c[0] + Math.cos(a) * h.r, h.c[1] + Math.sin(a) * h.r]); }
    contours.push(contour(pts, 0, true));
  }
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  const caps: { top: number[]; bot: number[] }[] = [];
  const bevelSegs = o.lean ? 1 : o.bevelSegs ?? 2;

  for (const c of contours) {
    const n = c.p.length;
    const rings: { idx: number[]; join: boolean }[] = [];
    const emit = (fn: (i: number) => { x: number; y: number; z: number; nx: number; ny: number; nz: number; u: number; v: number; e: number }, join: boolean) => {
      const idx: number[] = [];
      for (let i = 0; i < n; i++) {
        const q = fn(i);
        P.set(q.x, q.y, q.z).applyMatrix4(M); N.set(q.nx, q.ny, q.nz).applyMatrix3(nm).normalize();
        idx.push(g.v(P, N, q.u, q.v, q.e * wear, cav, rnd));
      }
      rings.push({ idx, join });
    };
    // perimeter coordinate
    const sv: number[] = [0]; for (let i = 1; i <= n; i++) { const a = c.p[i - 1], d = c.p[i % n]; sv.push(sv[i - 1] + Math.hypot(d[0] - a[0], d[1] - a[1])); }

    const topRing = (d: number, e: number, join: boolean) => emit((i) => {
      const q = inset(c, i, d); const uv = uvT(q[0], q[1]);
      return { x: q[0], y: q[1], z: 0, nx: 0, ny: 0, nz: 1, u: uv[0], v: uv[1], e };
    }, join);
    topRing(b + band, 0, false);
    if (!o.lean) topRing(b + band * 0.45, 0.42, true);
    topRing(b, 1, true);
    for (let k = 1; k <= bevelSegs; k++) {
      const a = (k / bevelSegs) * Math.PI / 2, sa = Math.sin(a), ca = Math.cos(a);
      emit((i) => {
        const d = b * (1 - sa); const q = inset(c, i, d); const uv = uvT(q[0] + c.n[i][0] * b * sa, q[1] + c.n[i][1] * b * sa);
        return { x: q[0], y: q[1], z: -b * (1 - ca), nx: c.n[i][0] * sa, ny: c.n[i][1] * sa, nz: ca, u: uv[0], v: uv[1], e: 1 };
      }, true);
    }
    // side wall gets its own UV: duplicate the ring
    const side = (z: number, join: boolean) => emit((i) => ({ x: c.p[i][0], y: c.p[i][1], z, nx: c.n[i][0], ny: c.n[i][1], nz: 0, u: sv[i] + uo, v: z + vo, e: 1 }), join);
    side(-b, false); side(-(t - b), true);
    // bottom bevel
    emit((i) => {
      const uv = uvT(c.p[i][0], c.p[i][1]);
      return { x: c.p[i][0], y: c.p[i][1], z: -(t - b), nx: c.n[i][0], ny: c.n[i][1], nz: 0, u: uv[0], v: uv[1], e: 1 };
    }, false);
    emit((i) => {
      const q = inset(c, i, b); const uv = uvT(q[0], q[1]);
      return { x: q[0], y: q[1], z: -t, nx: 0, ny: 0, nz: -1, u: uv[0], v: uv[1], e: 0.8 };
    }, true);
    for (let r = 1; r < rings.length; r++) {
      if (!rings[r].join) continue;
      const a = rings[r - 1].idx, d = rings[r].idx;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        g.idx.push(a[i], d[i], d[j], a[i], d[j], a[j]);
      }
    }
    caps.push({ top: rings[0].idx, bot: rings[rings.length - 1].idx });
  }
  // caps (earcut with holes)
  const cap = (pick: 'top' | 'bot', ins: number, flip: boolean) => {
    const outer = contours[0]; const to2 = (cc: Contour, i: number) => { const q = inset(cc, i, ins); return new THREE.Vector2(q[0], q[1]); };
    const contourV = outer.p.map((_, i) => to2(outer, i));
    const holesV = contours.slice(1).map((cc) => cc.p.map((_, i) => to2(cc, i)));
    const tris = THREE.ShapeUtils.triangulateShape(contourV, holesV);
    const map: number[] = [...caps[0][pick]]; for (let h = 1; h < caps.length; h++) map.push(...caps[h][pick]);
    for (const [a, b2, c] of tris) flip ? g.idx.push(map[a], map[c], map[b2]) : g.idx.push(map[a], map[b2], map[c]);
  };
  cap('top', b + band, false);
  cap('bot', b, true);
}

export type ProfPt = [number, number] | [number, number, number];

/** Lathe with automatic chamfers + wear bands. Profile runs so the outward side is on the right of travel in (r,y). */
export function revolve(g: GB, prof: ProfPt[], o: { M?: THREE.Matrix4; segs?: number; b?: number; band?: number; wear?: number; a0?: number; a1?: number; smooth?: boolean; eFn?: (r: number, y: number) => [number, number] } = {}) {
  const M = o.M ?? new THREE.Matrix4(); const nm = new THREE.Matrix3().getNormalMatrix(M);
  const b = o.b ?? 0.002, band = o.band ?? 0.012, segs = o.segs ?? 32, wear = o.wear ?? 1;
  const a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2;
  type Q = { r: number; y: number; nr: number; ny: number; e: number; c: number; brk?: boolean };
  const Qs: Q[] = [];
  const nSeg = prof.length - 1;
  const seg = (i: number) => {
    const A = prof[i], B = prof[i + 1]; const dx = B[0] - A[0], dy = B[1] - A[1]; const l = Math.hypot(dx, dy) || 1e-6;
    return { dx: dx / l, dy: dy / l, l, nr: dy / l, ny: -dx / l };
  };
  for (let i = 0; i < nSeg; i++) {
    const A = prof[i], B = prof[i + 1], s = seg(i);
    const prev = i > 0 ? seg(i - 1) : null, next = i < nSeg - 1 ? seg(i + 1) : null;
    const turnA = prev ? prev.dx * s.dy - prev.dy * s.dx : 0, turnB = next ? s.dx * next.dy - s.dy * next.dx : 0;
    const dotA = prev ? prev.dx * s.dx + prev.dy * s.dy : 1, dotB = next ? s.dx * next.dx + s.dy * next.dy : 1;
    const softA = !!prev && (dotA > 0.97 || o.smooth), softB = !!next && (dotB > 0.97 || o.smooth);
    const bev = Math.min(b, s.l * 0.3), bd = Math.min(band, s.l * 0.3);
    const cvxA = turnA > 0, cvxB = turnB > 0; // right-hand outward: left turn = convex
    if (prev && !softA) {
      // arc from previous normal to this normal, centred on the corner
      for (let k = 1; k <= 2; k++) {
        const t = k / 3; const nr = prev.nr * (1 - t) + s.nr * t, ny = prev.ny * (1 - t) + s.ny * t; const l = Math.hypot(nr, ny);
        const f = bev; Qs.push({ r: A[0] - prev.dx * f * (1 - t) + s.dx * f * t, y: A[1] - prev.dy * f * (1 - t) + s.dy * f * t, nr: nr / l, ny: ny / l, e: cvxA ? 1 : 0, c: cvxA ? 0 : 1 });
      }
    }
    const eA = !prev || softA ? 0 : cvxA ? 1 : 0, cA = prev && !softA && !cvxA ? 1 : 0;
    const eB = !next || softB ? 0 : cvxB ? 1 : 0, cB = next && !softB && !cvxB ? 1 : 0;
    const nrA = softA ? (prev!.nr + s.nr) : s.nr, nyA = softA ? (prev!.ny + s.ny) : s.ny, la = Math.hypot(nrA, nyA);
    const nrB = softB ? (next!.nr + s.nr) : s.nr, nyB = softB ? (next!.ny + s.ny) : s.ny, lb = Math.hypot(nrB, nyB);
    const startF = prev && !softA ? bev : 0, endF = next && !softB ? bev : 0;
    if (!(softA && i > 0)) Qs.push({ r: A[0] + s.dx * startF, y: A[1] + s.dy * startF, nr: nrA / la, ny: nyA / la, e: eA, c: cA });
    else Qs.push({ r: A[0], y: A[1], nr: nrA / la, ny: nyA / la, e: 0, c: 0 });
    if (eA || cA) Qs.push({ r: A[0] + s.dx * (startF + bd), y: A[1] + s.dy * (startF + bd), nr: s.nr, ny: s.ny, e: 0, c: 0 });
    if (eB || cB) Qs.push({ r: B[0] - s.dx * (endF + bd), y: B[1] - s.dy * (endF + bd), nr: s.nr, ny: s.ny, e: 0, c: 0 });
    if (!softB) Qs.push({ r: B[0] - s.dx * endF, y: B[1] - s.dy * endF, nr: nrB / lb, ny: nyB / lb, e: eB, c: cB });
  }
  const rnd = rng.f(), uo = rng.r(0, 9), vo = rng.r(0, 9);
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  const base = g.n, i0 = g.idx.length;
  let s = 0; const rAvg = Math.max(...prof.map((q) => q[0]));
  for (let j = 0; j < Qs.length; j++) {
    const q = Qs[j]; if (j) s += Math.hypot(q.r - Qs[j - 1].r, q.y - Qs[j - 1].y);
    if (o.eFn) { const f = o.eFn(q.r, q.y); q.e = f[0]; q.c = f[1]; }
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (a1 - a0) * (i / segs), c = Math.cos(a), sn = Math.sin(a);
      P.set(q.r * c, q.y, q.r * sn).applyMatrix4(M);
      N.set(q.nr * c, q.ny, q.nr * sn).applyMatrix3(nm).normalize();
      g.v(P, N, a * rAvg + uo, s + vo, q.e * wear, q.c, rnd);
    }
  }
  const W = segs + 1;
  for (let j = 0; j < Qs.length - 1; j++) for (let i = 0; i < segs; i++) {
    const a = base + j * W + i, b2 = a + W;
    g.idx.push(a, b2, b2 + 1, a, b2 + 1, a + 1);
  }
  fixWinding(g, i0, M);
}

/** Cylinder along the frame's Y axis with chamfered ends. */
export function cyl(g: GB, r: number, h: number, o: { M?: THREE.Matrix4; segs?: number; b?: number; r2?: number; wear?: number; band?: number } = {}) {
  revolve(g, [[0, -h / 2], [r, -h / 2], [o.r2 ?? r, h / 2], [0, h / 2]], { b: Math.min(0.0025, r * 0.2), segs: o.segs ?? 20, band: Math.min(0.01, r * 0.4), ...o });
}

/** Rod between two points. */
export function rod(g: GB, a: V3, b: V3, r: number, o: { segs?: number; wear?: number } = {}) {
  const A = v3(a), B = v3(b); const d = B.clone().sub(A); const l = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const M = new THREE.Matrix4().compose(A.clone().addScaledVector(d, 0.5), q, new THREE.Vector3(1, 1, 1));
  cyl(g, r, l, { M, segs: o.segs ?? 12, wear: o.wear });
}

/** Button-head socket screw. M places the head with +Y out of the surface. */
export function bolt(g: GB, r: number, M: THREE.Matrix4, washer = true) {
  const w = washer ? r * 0.16 : 0, h = r * 0.6 + w, hexR = r * 0.42;
  const eFn = (q: number, y: number): [number, number] => [q > r * 0.55 ? 1 : 0.3, q < hexR * 1.02 ? 1 : 0];
  const prof: ProfPt[] = washer
    ? [[r * 1.45, 0], [r * 1.45, w], [r, w], [r * 0.92, h * 0.72], [r * 0.62, h], [hexR, h], [hexR * 0.8, h * 0.4], [0, h * 0.4]]
    : [[r, 0], [r * 0.92, h * 0.7], [r * 0.62, h], [hexR, h], [hexR * 0.8, h * 0.4], [0, h * 0.4]];
  revolve(g, prof, { M, segs: 8, smooth: true, eFn });
}

/** Row of bolts on a plate: pts are in plate (u,v); M is the plate frame. */
export function bolts(g: GB, pts: V2[], r: number, M: THREE.Matrix4, washer = true) {
  for (const p of pts) {
    const yaw = rng.r(0, 6.28);
    bolt(g, r, mul(M, T(p[0], p[1], 0), RX(Math.PI / 2), RY(yaw)), washer);
  }
}

/** Evenly spaced points on a segment, in 2D. */
export function line2(a: V2, b: V2, n: number): V2[] {
  const o: V2[] = []; for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } return o;
}
export const rect = (x0: number, y0: number, x1: number, y1: number): V2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export const chamf = (x0: number, y0: number, x1: number, y1: number, c: number): V2[] => [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];
export function circle(c: V2, r: number, n: number): V2[] { const o: V2[] = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; }

/** Bar with a rectangular section between two points, bevelled. `up` picks the roll. */
export function bar(g: GB, a: V3, b: V3, w: number, h: number, up: V3 = [0, 1, 0], o: { b?: number; wear?: number } = {}) {
  const A = v3(a), B = v3(b); const d = B.clone().sub(A); const l = d.length(); const X = d.clone().normalize();
  const Y = v3(up).sub(X.clone().multiplyScalar(v3(up).dot(X))).normalize();
  const Z = new THREE.Vector3().crossVectors(X, Y);
  const m = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(A.x, A.y, A.z);
  plate(g, { poly: rect(0, -h / 2, l, h / 2), t: w, b: o.b ?? 0.003, M: mul(m, T(0, 0, w / 2)), cr: 0.003, wear: o.wear });
}

/** Swept tube: hoses, cables, roll bars. */
export function tube(g: GB, path: THREE.Vector3[], r: number, o: { sides?: number; samples?: number; closed?: boolean; flat?: number; wear?: number } = {}) {
  const curve = new THREE.CatmullRomCurve3(path, !!o.closed, 'catmullrom', 0.5);
  const S = o.samples ?? Math.max(6, path.length * 6), sides = o.sides ?? 7;
  const frames = curve.computeFrenetFrames(S, !!o.closed);
  const P = new THREE.Vector3(), N = new THREE.Vector3(), base = g.n, rnd = rng.f();
  const len = curve.getLength();
  for (let i = 0; i <= S; i++) {
    const c = curve.getPointAt(i / S), n = frames.normals[i], b = frames.binormals[i];
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      N.copy(n).multiplyScalar(ca).addScaledVector(b, sa).normalize(); P.copy(c).addScaledVector(N, r);
      g.v(P, N, (i / S) * len, a * r, 0, 0, rnd);
    }
  }
  const W = sides + 1;
  for (let i = 0; i < S; i++) for (let k = 0; k < sides; k++) { const a = base + i * W + k, b2 = a + W; g.idx.push(a, a + 1, b2 + 1, a, b2 + 1, b2); }
}

/** Weld bead: half-ellipse swept along a polyline, with wander. n = surface normal. UV = (along, across -1..1). */
export function weld(g: GB, pts: V3[], n: V3, w = 0.0065, h = 0.004) {
  const P: THREE.Vector3[] = []; const seed = rng.r(0, 50);
  for (let i = 0; i < pts.length - 1; i++) {
    const A = v3(pts[i]), B = v3(pts[i + 1]); const l = A.distanceTo(B); const k = Math.max(2, Math.ceil(l / 0.02));
    for (let j = 0; j < k; j++) P.push(A.clone().lerp(B, j / k));
  }
  P.push(v3(pts[pts.length - 1]));
  const N = v3(n).normalize(); const base = g.n; const sides = 6; let s = 0; const Q = new THREE.Vector3(), Nn = new THREE.Vector3();
  const rnd = rng.f();
  for (let i = 0; i < P.length; i++) {
    const nx = P[Math.min(i + 1, P.length - 1)], pr = P[Math.max(i - 1, 0)]; const dir = nx.clone().sub(pr).normalize();
    const side = new THREE.Vector3().crossVectors(N, dir).normalize();
    if (i) s += P[i].distanceTo(P[i - 1]);
    const wob = 1 + 0.22 * Math.sin(s * 53 + seed) * Math.sin(s * 17 + seed * 2), hw = w * wob, off = 0.0012 * Math.sin(s * 31 + seed);
    const end = Math.min(1, Math.min(i, P.length - 1 - i) / 1.5);
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI, ca = -Math.cos(a), sa = Math.sin(a);
      Q.copy(P[i]).addScaledVector(side, ca * hw + off).addScaledVector(N, sa * h * (0.3 + 0.7 * end));
      Nn.copy(side).multiplyScalar(ca / hw).addScaledVector(N, sa / h).normalize();
      g.v(Q, Nn, s, ca, 0.2, 0.25, rnd);
    }
  }
  const W = sides + 1;
  for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * W + k, b2 = a + W; g.idx.push(a, b2, b2 + 1, a, b2 + 1, a + 1); }
}

/** A quad for decals: placed just above a surface. rectUV is atlas rect (0..1). */
export function decal(g: GB, M: THREE.Matrix4, w: number, h: number, uv: [number, number, number, number]) {
  const nm = new THREE.Matrix3().getNormalMatrix(M); const N = new THREE.Vector3(0, 0, 1).applyMatrix3(nm).normalize();
  const b = g.n, P = new THREE.Vector3(), r = rng.f(), i0 = g.idx.length;
  if (M.determinant() < 0) uv = [uv[2], uv[1], uv[0], uv[3]];
  [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]].forEach(([x, y, u, v]) => {
    P.set(x * w / 2, y * h / 2, 0.0007).applyMatrix4(M);
    g.v(P, N, u, v, 0.5, 0, r);
  });
  g.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  fixWinding(g, i0, M);
}

/** Bend a built geometry in place: used for the torn armour panel. */
export function bendGeometry(geo: THREE.BufferGeometry, fn: (p: THREE.Vector3) => void) {
  const p = geo.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
}

/** Flat prism without bevels, for parts that repeat hundreds of times (chain plates). */
export function extrude(g: GB, poly: V2[], z0: number, z1: number, M: THREE.Matrix4) {
  const nm = new THREE.Matrix3().getNormalMatrix(M), P = new THREE.Vector3(), N = new THREE.Vector3();
  const r = rng.f();
  const tri = THREE.ShapeUtils.triangulateShape(poly.map(([x, y]) => new THREE.Vector2(x, y)), []);
  for (const [z, nz] of [[z1, 1], [z0, -1]] as const) {
    const b = g.n; N.set(0, 0, nz).applyMatrix3(nm).normalize();
    for (const p of poly) { P.set(p[0], p[1], z).applyMatrix4(M); g.v(P, N, p[0], p[1], 0.3, 0, r); }
    for (const [a, c, d] of tri) nz > 0 ? g.idx.push(b + a, b + c, b + d) : g.idx.push(b + a, b + d, b + c);
  }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], c = poly[(i + 1) % poly.length]; const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
    N.set(dy / l, -dx / l, 0).applyMatrix3(nm).normalize(); const b = g.n;
    for (const [q, z] of [[a, z1], [c, z1], [c, z0], [a, z0]] as const) { P.set(q[0], q[1], z).applyMatrix4(M); g.v(P, N, q[0], z, 1, 0, r); }
    g.idx.push(b, b + 3, b + 2, b, b + 2, b + 1);
  }
}

/** Closed path around two circles (belt or chain). Circles in XY. */
export function loopPath(c1: V2, r1: number, c2: V2, r2: number) {
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy), th = Math.atan2(dy, dx), ph = Math.acos((r1 - r2) / d);
  const a1 = th + ph, a2 = th - ph; // upper and lower tangent angles
  const P = (c: V2, r: number, a: number): V2 => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  const t1 = P(c1, r1, a1), t2 = P(c2, r2, a1), t3 = P(c2, r2, a2), t4 = P(c1, r1, a2);
  const L1 = Math.hypot(t2[0] - t1[0], t2[1] - t1[1]);
  const arc2 = (a1 - a2) * r2, arc1 = (Math.PI * 2 - (a1 - a2)) * r1;
  const total = 2 * L1 + arc1 + arc2;
  return { total, at(s: number): { p: V2; a: number } {
    s = ((s % total) + total) % total;
    if (s < L1) { const k = s / L1; return { p: [t1[0] + (t2[0] - t1[0]) * k, t1[1] + (t2[1] - t1[1]) * k], a: Math.atan2(t2[1] - t1[1], t2[0] - t1[0]) }; }
    s -= L1;
    if (s < arc2) { const a = a1 - s / r2; return { p: P(c2, r2, a), a: a - Math.PI / 2 }; }
    s -= arc2;
    if (s < L1) { const k = s / L1; return { p: [t3[0] + (t4[0] - t3[0]) * k, t3[1] + (t4[1] - t3[1]) * k], a: Math.atan2(t4[1] - t3[1], t4[0] - t3[0]) }; }
    s -= L1;
    const a = a2 - s / r1; return { p: P(c1, r1, a), a: a - Math.PI / 2 };
  } };
}
