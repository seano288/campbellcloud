// The shapes every Aircraft is built from, in aircraft coordinates (metres): x runs from the nose (0) aft, y is up and z
// is to the right. Two primitives cover nearly everything:
//  - loftBody: a body skinned through cross-sections, each a superellipse with its own width, height above and depth below
//    a centre line (n = 2 is an ellipse, 4 a rounded box, 1.4 a sharp chine). Fuselages, intakes, booms, nacelles,
//    canopies, drop tanks, missiles and spinners are all lofted bodies.
//  - loftSurface: a wing, tail, fin or blade skinned through airfoil stations (NACA 4-digit symmetric thickness).
// Geometry is pure data in a BufferGeometry, so it can be tested without WebGL.
import * as THREE from 'three';

export type V3 = readonly [number, number, number];

export interface Section {
  x: number;
  /** Half-width. */
  w: number;
  /** Height above the centre line, and depth below it. */
  top: number;
  bot: number;
  /** Centre line height (default 0). */
  y?: number;
  /** Superellipse exponent for the upper and lower halves (default 2: an ellipse). */
  n?: number;
  nb?: number;
}

export interface Station {
  /** Leading-edge point. The chord runs aft along +x from here. */
  le: V3;
  chord: number;
  /** Thickness as a fraction of the chord (default 0.06). */
  t?: number;
}

// ---------- interpolation ----------

/** Monotone cubic (PCHIP) interpolation: smooth like a spline, but never overshoots between sections. */
export function pchip(xs: readonly number[], ys: readonly number[]) {
  const n = xs.length;
  if (n === 1) return () => ys[0]!;
  const h = xs.slice(1).map((x, i) => x - xs[i]!), d = h.map((hi, i) => (ys[i + 1]! - ys[i]!) / hi);
  const m = xs.map((_, i) => {
    if (i === 0) return d[0]!;
    if (i === n - 1) return d[n - 2]!;
    const a = d[i - 1]!, b = d[i]!;
    if (a * b <= 0) return 0;
    const w1 = 2 * h[i]! + h[i - 1]!, w2 = h[i]! + 2 * h[i - 1]!;
    return (w1 + w2) / (w1 / a + w2 / b);
  });
  return (x: number) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let i = 0;
    while (x > xs[i + 1]!) i++;
    const t = (x - xs[i]!) / h[i]!, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i]! + (t3 - 2 * t2 + t) * h[i]! * m[i]! + (-2 * t3 + 3 * t2) * ys[i + 1]! + (t3 - t2) * h[i]! * m[i + 1]!;
  };
}

const lerp = (xs: readonly number[], ys: readonly number[]) => (x: number) => {
  if (x <= xs[0]!) return ys[0]!;
  for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]!) { const t = (x - xs[i]!) / (xs[i + 1]! - xs[i]!); return ys[i]! + t * (ys[i + 1]! - ys[i]!); }
  return ys[ys.length - 1]!;
};

/** A body's section at any x, interpolated smoothly between the given ones. */
export function sectionAt(sections: readonly Section[]) {
  const s = [...sections].sort((a, b) => a.x - b.x), xs = s.map(q => q.x);
  const w = pchip(xs, s.map(q => q.w)), top = pchip(xs, s.map(q => q.top)), bot = pchip(xs, s.map(q => q.bot));
  const y = pchip(xs, s.map(q => q.y ?? 0)), n = lerp(xs, s.map(q => q.n ?? 2)), nb = lerp(xs, s.map(q => q.nb ?? q.n ?? 2));
  return (x: number): Required<Section> => ({ x, w: w(x), top: top(x), bot: bot(x), y: y(x), n: n(x), nb: nb(x) });
}

/** A point round a section: phi 0 is the top, PI/2 the right side (+z), PI the bottom. */
export function ringPoint(s: Required<Section>, phi: number, z0 = 0): [number, number, number] {
  const c = Math.cos(phi), sn = Math.sin(phi), up = c >= 0, e = up ? s.n : s.nb;
  const p = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / e);
  return [s.x, s.y + p(c) * (up ? s.top : s.bot), z0 + p(sn) * s.w];
}

// ---------- building ----------

/** Triangles, each with a point inside the shape: a triangle facing that point is flipped, so every normal points out. */
class Mesh {
  pos: number[] = [];
  idx: number[] = [];
  add(...p: number[]) { const i = this.pos.length / 3; this.pos.push(...p); return i; }
  tri(a: number, b: number, c: number, inside: readonly number[]) {
    if (a === b || b === c || a === c) return;
    const P = this.pos, v = (i: number) => [P[i * 3]!, P[i * 3 + 1]!, P[i * 3 + 2]!];
    const A = v(a), B = v(b), C = v(c);
    const u = [B[0]! - A[0]!, B[1]! - A[1]!, B[2]! - A[2]!], w = [C[0]! - A[0]!, C[1]! - A[1]!, C[2]! - A[2]!];
    const n = [u[1]! * w[2]! - u[2]! * w[1]!, u[2]! * w[0]! - u[0]! * w[2]!, u[0]! * w[1]! - u[1]! * w[0]!];
    const out = [0, 1, 2].map(k => (A[k]! + B[k]! + C[k]!) / 3 - inside[k]!);
    if (n[0]! * out[0]! + n[1]! * out[1]! + n[2]! * out[2]! < 0) this.idx.push(a, c, b);
    else this.idx.push(a, b, c);
  }
  geometry(indices = this.idx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
}

export interface BodyOptions {
  /** Lateral offset of the body's centre line. */
  z?: number;
  /** Points round each ring (default 40). */
  segs?: number;
  /** Rings along the body (default: about every 25 cm, at least 3 per section). */
  rings?: number;
  /** Leave the front open (an intake mouth): its face comes back separately so it can be dark. */
  openFront?: boolean;
  /** Same at the back (a nozzle exit). */
  openBack?: boolean;
}

/** A body lofted through sections. Returns the skin, plus the front and back faces when they are open. */
export function loftBody(sections: readonly Section[], o: BodyOptions = {}) {
  const at = sectionAt(sections), xs = sections.map(s => s.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const segs = o.segs ?? 40, rings = o.rings ?? Math.max(sections.length * 3, Math.ceil((x1 - x0) / 0.25) + 1, 4);
  const z0 = o.z ?? 0, m = new Mesh();
  // rings closer together near the ends, where the shape changes fastest
  const xAt = (i: number) => x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos((Math.PI * i) / (rings - 1)));
  const centres: number[][] = [];
  for (let i = 0; i < rings; i++) {
    const s = at(xAt(i));
    s.w = Math.max(s.w, 0.002); s.top = Math.max(s.top, 0.002); s.bot = Math.max(s.bot, 0.002);
    centres.push([s.x, s.y + (s.top - s.bot) / 2, z0]);
    for (let j = 0; j < segs; j++) m.add(...ringPoint(s, (2 * Math.PI * j) / segs, z0));
  }
  for (let i = 0; i < rings - 1; i++) {
    const c = centres[i]!.map((v, k) => (v + centres[i + 1]![k]!) / 2);
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs);
      m.tri(a, a + segs, b, c); m.tri(b, a + segs, b + segs, c);
    }
  }
  const cap = (ring: number, inner: number) => {
    const start = m.idx.length, centre = m.add(...centres[ring]!), first = ring * segs;
    for (let j = 0; j < segs; j++) m.tri(centre, first + j, first + ((j + 1) % segs), centres[inner]!);
    return m.idx.splice(start);
  };
  const front = cap(0, 1), back = cap(rings - 1, rings - 2);
  const skin = m.geometry([...m.idx, ...(o.openFront ? [] : front), ...(o.openBack ? [] : back)]);
  return { skin, front: o.openFront ? m.geometry(front) : null, back: o.openBack ? m.geometry(back) : null };
}

/** Half-thickness of a NACA 4-digit symmetric section at chord fraction xc (closed trailing edge). */
export const naca = (xc: number, t: number) => 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1036 * xc ** 4);

/** A surface lofted through airfoil stations, root first. */
export function loftSurface(stations: readonly Station[], chordPts = 12) {
  const m = new Mesh(), X = new THREE.Vector3(1, 0, 0);
  const xc = Array.from({ length: chordPts }, (_, i) => 0.5 - 0.5 * Math.cos((Math.PI * i) / (chordPts - 1))); // 0..1, dense at the edges
  const upper: number[][] = [], lower: number[][] = [], mid: THREE.Vector3[][] = [];
  stations.forEach((s, i) => {
    const prev = stations[Math.max(i - 1, 0)]!, next = stations[Math.min(i + 1, stations.length - 1)]!;
    const span = new THREE.Vector3(next.le[0] - prev.le[0], next.le[1] - prev.le[1], next.le[2] - prev.le[2]).normalize();
    const thick = new THREE.Vector3().crossVectors(span, X);
    if (thick.lengthSq() < 0.25) thick.set(0, 1, 0);
    thick.normalize();
    const t = s.t ?? 0.06, le = new THREE.Vector3(...s.le);
    const on = (f: number) => le.clone().addScaledVector(X, f * s.chord);
    const point = (f: number, side: 1 | -1) => on(f).addScaledVector(thick, side * Math.max(naca(f, t), 0.0012) * s.chord);
    mid.push(xc.map(on));
    upper.push(xc.map((f, k) => (k === 0 || k === chordPts - 1 ? m.add(...on(f).toArray()) : m.add(...point(f, 1).toArray()))));
    lower.push(xc.map((f, k) => (k === 0 || k === chordPts - 1 ? upper[i]![k]! : m.add(...point(f, -1).toArray()))));
  });
  for (let i = 0; i < stations.length - 1; i++) for (let k = 0; k < chordPts - 1; k++) {
    const c = mid[i]![k]!.clone().add(mid[i + 1]![k + 1]!).multiplyScalar(0.5).toArray();
    for (const side of [upper, lower]) {
      const a = side[i]![k]!, b = side[i]![k + 1]!, d = side[i + 1]![k]!, e = side[i + 1]![k + 1]!;
      m.tri(a, d, b, c); m.tri(b, d, e, c);
    }
  }
  for (const [ring, inner] of [[0, 1], [stations.length - 1, stations.length - 2]] as const) {
    const c = mid[inner]![Math.floor(chordPts / 2)]!.toArray();
    for (let k = 0; k < chordPts - 1; k++) {
      const u0 = upper[ring]![k]!, u1 = upper[ring]![k + 1]!, l0 = lower[ring]![k]!, l1 = lower[ring]![k + 1]!;
      m.tri(u0, u1, l1, c); m.tri(u0, l1, l0, c);
    }
  }
  return m.geometry();
}

/** Interpolates the stations of a straight panel (or several), so long surfaces bend their normals smoothly. */
export function panel(root: Station, tip: Station, steps = 2): Station[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const f = i / steps;
    return {
      le: [root.le[0] + (tip.le[0] - root.le[0]) * f, root.le[1] + (tip.le[1] - root.le[1]) * f, root.le[2] + (tip.le[2] - root.le[2]) * f] as V3,
      chord: root.chord + (tip.chord - root.chord) * f, t: (root.t ?? 0.06) + ((tip.t ?? 0.06) - (root.t ?? 0.06)) * f,
    };
  });
}

/** An elliptical tip: extra stations whose chord shrinks round to the tip, centred on the quarter chord. */
export function roundTip(last: Station, outward: V3, length: number, steps = 4): Station[] {
  const qc = last.le[0] + last.chord * 0.3;
  return Array.from({ length: steps }, (_, i) => {
    const a = ((i + 1) / steps) * (Math.PI / 2), k = Math.cos(a), d = Math.sin(a) * length;
    const chord = Math.max(last.chord * k, 0.04);
    return { le: [qc - chord * 0.3, last.le[1] + outward[1] * d, last.le[2] + outward[2] * d] as V3, chord, t: last.t };
  });
}

/** A copy mirrored to the left side (z → -z), with its winding fixed. */
export function mirrored(g: THREE.BufferGeometry) {
  const m = g.clone();
  m.scale(1, 1, -1);
  const ix = m.index;
  if (ix) for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); }
  m.computeVertexNormals();
  return m;
}

/** The signed volume of a closed mesh: positive when its normals point outward. */
export function signedVolume(g: THREE.BufferGeometry) {
  const p = g.attributes.position!, idx = g.index!;
  let vol = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i)); b.fromBufferAttribute(p, idx.getX(i + 1)); c.fromBufferAttribute(p, idx.getX(i + 2));
    vol += a.dot(b.clone().cross(c)) / 6;
  }
  return vol;
}

/**
 * Normals that stay smooth across gentle curves but break at sharp edges (chines, trailing edges, tip caps, intake
 * lips), so those read crisp instead of smudged. Returns a non-indexed copy.
 */
export function creased(g: THREE.BufferGeometry, deg = 32) {
  const flat = g.index ? g.toNonIndexed() : g.clone();
  flat.computeVertexNormals(); // per-face normals on a non-indexed mesh
  const p = flat.attributes.position!, n = flat.attributes.normal!, cos = Math.cos((deg * Math.PI) / 180);
  const groups = new Map<string, number[]>();
  for (let i = 0; i < p.count; i++) {
    const k = `${Math.round(p.getX(i) * 1e4)}_${Math.round(p.getY(i) * 1e4)}_${Math.round(p.getZ(i) * 1e4)}`;
    let list = groups.get(k);
    if (!list) groups.set(k, (list = []));
    list.push(i);
  }
  const out = new Float32Array(p.count * 3), a = new THREE.Vector3(), b = new THREE.Vector3(), sum = new THREE.Vector3();
  for (const list of groups.values()) for (const i of list) {
    a.fromBufferAttribute(n, i); sum.set(0, 0, 0);
    for (const j of list) { b.fromBufferAttribute(n, j); if (a.dot(b) >= cos) sum.add(b); }
    sum.normalize();
    out.set([sum.x, sum.y, sum.z], i * 3);
  }
  flat.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return flat;
}
