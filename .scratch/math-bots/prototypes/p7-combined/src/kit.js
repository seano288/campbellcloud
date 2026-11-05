// Hard-surface geometry kit. Everything a bot is made of is merged per material, with a
// vec3 `aux` attribute: x = edge wear weight (1 on bevels, fading over an inset ring),
// y = per-part random, z = grime weight. UVs are in metres so every texture has real scale.
import * as THREE from 'three/webgpu';
import { GB, plate as p1Plate, weld as p1Weld, mul, T as Tr } from './geo.ts';

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V(1, 1, 1));

export class Kit {
  constructor(seed = 7) { this.b = new Map(); this.r = rng(seed); this.gbs = new Map(); this.anchor = null; }
  bucket(k) { if (!this.b.has(k)) this.b.set(k, { p: [], n: [], u: [], a: [], o: [] }); return this.b.get(k); }
  /** P1-style indexed geometry for the same material bucket. */
  gb(k) { this.bucket(k); if (!this.gbs.has(k)) this.gbs.set(k, []); const g = new GB(); this.gbs.get(k).push({ g, anchor: this.anchor }); return g; }

  // push a triangle: a,b,c = {p,n,uv,e}
  tri(bk, m, nm, a, b, c, rnd, grime) {
    for (const v of [a, b, c]) {
      const p = v.p.clone().applyMatrix4(m), n = v.n.clone().applyMatrix3(nm).normalize();
      bk.p.push(p.x, p.y, p.z); bk.n.push(n.x, n.y, n.z); bk.u.push(v.uv[0], v.uv[1]); bk.a.push(v.e, rnd, grime); bk.o.push(this.anchor ? this.anchor[0] : p.x, this.anchor ? this.anchor[1] : p.y);
    }
  }
  quad(bk, m, nm, a, b, c, d, rnd, g) { this.tri(bk, m, nm, a, b, c, rnd, g); this.tri(bk, m, nm, a, c, d, rnd, g); }

  // Laser-cut plate from P1: rounded corners, real chamfer, flat faces, a wear band. Centred on its thickness.
  plate(key, pts, t, m = M(), { bevel = 0.0035, ring = 0.03, wear = 1, grime = 0.5 } = {}) {
    p1Plate(this.gb(key), { poly: pts, t, b: bevel, band: ring, cr: Math.min(.006, t), wear, M: mul(m, Tr(0, 0, t / 2)) });
  }
  /**
   * Tessellated armour plate, so a dent is real geometry. Local XY = plate, +Z outward, thickness behind the
   * plate centre plane. Grid vertices outside the convex outline are pulled on to it. pitch in metres.
   */
  grid(key, poly, t, { pitch = .014, bevel = .003, band = .035, wear = 1, grime = .5 } = {}) {
    const bk = this.bucket(key), rnd = this.r(), n = poly.length, hz = t / 2, I = M(), nm = new THREE.Matrix3();
    let area = 0; for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const P = area > 0 ? poly : [...poly].reverse();
    const edges = P.map((a, i) => { const b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return { a, b, dx: dx / l, dy: dy / l, l, nx: dy / l, ny: -dx / l }; });
    const dist = (x, y) => { let d = 1e9, e0 = edges[0]; for (const e of edges) { const q = (e.a[0] - x) * e.nx + (e.a[1] - y) * e.ny; if (q < d) { d = q; e0 = e; } } return [d, e0]; };
    const clampIn = (x, y, ins) => { for (let k = 0; k < 4; k++) { const [d, e] = dist(x, y); if (d >= ins) break; x -= e.nx * (ins - d); y -= e.ny * (ins - d); } return [x, y]; };
    const xs = P.map(q => q[0]), ys = P.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const nx = Math.ceil((x1 - x0) / pitch), ny = Math.ceil((y1 - y0) / pitch), uo = this.r() * 5, vo = this.r() * 5;
    const vtx = (x, y, z, N, e) => ({ p: V(x, y, z), n: N, uv: [x + uo, y + vo], e });
    const up = V(0, 0, 1), dn = V(0, 0, -1);
    for (const [z, N, ins] of [[hz, up, bevel], [-hz, dn, bevel]]) {
      const g = [];
      for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) {
        const [x, y] = clampIn(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny, ins), d = dist(x, y)[0], e = THREE.MathUtils.clamp(1 - (d - ins) / band, 0, 1);
        row.push(vtx(x, y, z, N, e * e * wear));
      } g.push(row); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = g[j][i], b = g[j][i + 1], c = g[j + 1][i + 1], d = g[j + 1][i];
        if (a.p.distanceToSquared(c.p) < 1e-9 && b.p.distanceToSquared(d.p) < 1e-9) continue;
        if (z > 0) this.quad(bk, I, nm, a, b, c, d, rnd, grime); else this.quad(bk, I, nm, a, d, c, b, rnd, grime);
      }
    }
    // rim: bevel, wall, bevel, walked around the outline at grid pitch so it bends with the face
    for (const e of edges) {
      const c = Math.max(1, Math.ceil(e.l / pitch)), N = V(e.nx, e.ny, 0), Nt = V(e.nx, e.ny, 1).normalize(), Nb = V(e.nx, e.ny, -1).normalize();
      for (let i = 0; i < c; i++) {
        const A = [e.a[0] + e.dx * e.l * i / c, e.a[1] + e.dy * e.l * i / c], B = [e.a[0] + e.dx * e.l * (i + 1) / c, e.a[1] + e.dy * e.l * (i + 1) / c];
        const ai = clampIn(A[0], A[1], bevel), bi = clampIn(B[0], B[1], bevel), w = (q, z, nn) => ({ p: V(q[0], q[1], z), n: nn, uv: [q[0] + q[1] + uo, z * 2 + vo], e: wear });
        this.quad(bk, I, nm, w(ai, hz, Nt), w(A, hz - bevel, Nt), w(B, hz - bevel, Nt), w(bi, hz, Nt), rnd, grime);
        this.quad(bk, I, nm, w(A, hz - bevel, N), w(A, -hz + bevel, N), w(B, -hz + bevel, N), w(B, hz - bevel, N), rnd, grime);
        this.quad(bk, I, nm, w(A, -hz + bevel, Nb), w(ai, -hz, Nb), w(bi, -hz, Nb), w(B, -hz + bevel, Nb), rnd, grime);
      }
    }
  }
  // Rectangular block: centre c, size s, euler e. Plate thickness runs along the smallest
  // dimension so big faces are never flagged as worn edges.
  box(key, c, s, e = [0, 0, 0], o = {}) {
    const [sx, sy, sz] = s, min = Math.min(sx, sy, sz);
    let w, d, t, basis;
    if (min === sy) { w = sx; d = sz; t = sy; basis = M(0, 0, 0, -Math.PI / 2); }
    else if (min === sx) { w = sz; d = sy; t = sx; basis = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0)); }
    else { w = sx; d = sy; t = sz; basis = M(); }
    const hw = w / 2, hd = d / 2, ch = o.chamfer ?? 0;
    const pts = ch > 0
      ? [[-hw + ch, -hd], [hw - ch, -hd], [hw, -hd + ch], [hw, hd - ch], [hw - ch, hd], [-hw + ch, hd], [-hw, hd - ch], [-hw, -hd + ch]]
      : [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
    this.plate(key, pts, t, M(c[0], c[1], c[2], e[0], e[1], e[2]).multiply(basis), o);
  }
  // Side-profile plate: convex (z,y) outline, thickness along X, centred on x.
  side(key, x, t, prof, o = {}) {
    // local XY = (z,y) with local Z = -X
    const m = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0)).setPosition(x, 0, 0);
    this.plate(key, prof, t, m, o);
  }
  // Lathe around local Y from [r,y] rows. Hard edge between rows unless `smooth`.
  lathe(key, prof, seg, m = M(), { smooth = false, wear = 0.6, grime = 0.4, u = 1 } = {}) {
    const bk = this.bucket(key), nm = new THREE.Matrix3().getNormalMatrix(m), rnd = this.r();
    let vAcc = 0;
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
      const dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1e-6;
      const nr = dy / l, ny = -dr / l;
      const isEdge = l < 0.012 ? wear : 0;
      for (let s = 0; s < seg; s++) {
        const a0 = s / seg * Math.PI * 2, a1 = (s + 1) / seg * Math.PI * 2;
        const v = (a, r, y, vv) => ({ p: V(Math.cos(a) * r, y, Math.sin(a) * r), n: V(Math.cos(a) * nr, ny, Math.sin(a) * nr),
          uv: [a * Math.max(r0, r1, 0.02) * u, vv], e: isEdge });
        this.quad(bk, m, nm, v(a0, r0, y0, vAcc), v(a0, r1, y1, vAcc + l), v(a1, r1, y1, vAcc + l), v(a1, r0, y0, vAcc), rnd, grime);
      }
      vAcc += l;
    }
  }
  // Socket-head cap screw + washer. pos, outward normal.
  bolt(p, n = [0, 1, 0], r = 0.011, key = 'bolt', washer = true) {
    const nrm = V(...n).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), nrm);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), this.r() * 6.28));
    const m = new THREE.Matrix4().compose(V(...p), q, V(1, 1, 1));
    const was = this.anchor; if (this.plateMode) this.anchor = [p[0], p[1]];
    const h = r * 1.0;
    const prof = washer ? [[r * 1.75, 0], [r * 1.75, r * .22], [r * 1.05, r * .24]] : [[r * 1.05, 0]];
    this.lathe(key, [...prof, [r, h * .85], [r * .86, h], [r * .56, h], [r * .5, h * .35], [0.0001, h * .35]], 14, m, { wear: 1 });
    this.anchor = was;
  }
  boltRow(a, b, count, n, r, key) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? .5 : i / (count - 1);
      this.bolt([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], n, r, key);
    }
  }
  // Generic tube along a curve; `ripple` makes a weld bead (stacked-dimes profile).
  tube(key, pts, r, { seg = 6, step = 0.03, ripple = 0, flat = 1, closed = false, grime = .5, wobble = 0 } = {}) {
    const bk = this.bucket(key), m = M(), nm = new THREE.Matrix3(), rnd = this.r();
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V(...p)), closed, 'centripetal');
    const len = curve.getLength(), rings = Math.max(2, Math.ceil(len / step));
    const frames = curve.computeFrenetFrames(rings, closed);
    const ringAt = i => {
      const t = i / rings, c = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i], s = t * len;
      const k = r * (1 + (ripple ? ripple * Math.sin(s / 0.0052 * Math.PI) + (this.r() - .5) * ripple * .6 : 0) + wobble * (this.r() - .5));
      const o = [];
      for (let j = 0; j <= seg; j++) {
        const a = j / seg * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        const nrm = N.clone().multiplyScalar(cs).addScaledVector(B, sn);
        o.push({ p: c.clone().addScaledVector(N, cs * k).addScaledVector(B, sn * k * flat), n: nrm, uv: [j / seg * r * 6.28, s], e: 0 });
      }
      return o;
    };
    let prev = ringAt(0);
    for (let i = 1; i <= rings; i++) {
      const cur = ringAt(i);
      for (let j = 0; j < seg; j++) this.quad(bk, m, nm, prev[j], prev[j + 1], cur[j + 1], cur[j], rnd, grime);
      prev = cur;
    }
  }
  // P1's half-ellipse bead with wander. n = the surface it sits on.
  weld(pts, r = 0.0055, n = [0, 1, 0]) { p1Weld(this.gb('weld'), pts, n, r * 1.25, r * .8); }

  build(mats, { plateAtlasUV = null } = {}) {
    const g = new THREE.Group();
    for (const [k, b] of this.b) {
      for (const { g: gb, anchor } of this.gbs.get(k) ?? []) {
        // P1 geometry: expand into this bucket. aWear = edge, cavity, random -> aux = edge, random, grime
        for (const i of gb.idx) {
          b.p.push(gb.pos[i * 3], gb.pos[i * 3 + 1], gb.pos[i * 3 + 2]); b.n.push(gb.nor[i * 3], gb.nor[i * 3 + 1], gb.nor[i * 3 + 2]);
          b.u.push(gb.uv[i * 2], gb.uv[i * 2 + 1]); b.a.push(gb.wear[i * 3], gb.wear[i * 3 + 2], .45 + gb.wear[i * 3 + 1] * .55);
          b.o.push(anchor ? anchor[0] : gb.pos[i * 3], anchor ? anchor[1] : gb.pos[i * 3 + 1]);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      geo.setAttribute('aux', new THREE.Float32BufferAttribute(b.a, 3));
      if (plateAtlasUV) { const o = new Float32Array(b.o.length); for (let i = 0; i < b.o.length; i += 2) { const q = plateAtlasUV(b.o[i], b.o[i + 1]); o[i] = q[0]; o[i + 1] = q[1]; } geo.setAttribute('auv', new THREE.BufferAttribute(o, 2)); }
      if (!mats[k]) throw new Error('missing material ' + k);
      const mesh = new THREE.Mesh(geo, mats[k]);
      mesh.castShadow = mesh.receiveShadow = true; mesh.name = k;
      g.add(mesh);
    }
    return g;
  }
}
