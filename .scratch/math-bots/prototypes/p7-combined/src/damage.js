// Armour damage. Every plate on a bot has its own rectangle in two atlases:
//   disp (half float): metres of displacement in plate space, read in the vertex shader, so dents are real geometry
//   surf (rgba8): R paint gone, G scored bright metal, B scorch, A torn (above .5 the plate has a hole)
// A scar from the fight is stamped at its real plate position. It is CPU work done only on the frame a hit lands.
// The atlases are a pure function of the scar list, so replay rewinds by rebuilding.
import * as THREE from 'three/webgpu';

const fract = x => x - Math.floor(x), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
// Stamps touch a few hundred thousand texels on the frame a hit lands, so noise is a tileable table, not per-texel sines.
const NT = 512, TP = 16, TBL = new Float32Array(NT * NT);
{ const v = (x, y, p) => { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), w = g * g * (3 - 2 * g), h = (a, b) => hash(((a % p) + p) % p, ((b % p) + p) % p);
    return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), w); };
  for (let j = 0; j < NT; j++) for (let i = 0; i < NT; i++) { const x = i / NT * TP, y = j / NT * TP; TBL[j * NT + i] = v(x, y, TP) * .55 + v(x * 2 + 3, y * 2 + 7, TP * 2) * .3 + v(x * 4 + 9, y * 4 + 1, TP * 4) * .15; } }
const fbm = (x, y) => { const m = NT / TP, fx = (x % TP + TP) % TP * m, fy = (y % TP + TP) % TP * m, ix = fx | 0, iy = fy | 0, a = fx - ix, b = fy - iy, x1 = (ix + 1) % NT, y0 = iy * NT, y1 = ((iy + 1) % NT) * NT;
  return (TBL[y0 + ix] * (1 - a) + TBL[y0 + x1] * a) * (1 - b) + (TBL[y1 + ix] * (1 - a) + TBL[y1 + x1] * a) * b; };
const vnoise = fbm;

export class DamageAtlas {
  constructor(plates, { dRes = 512, sRes = 1024 } = {}) {
    this.plates = plates; this.dRes = dRes; this.sRes = sRes;
    // shelf-pack the plates at a common scale
    const order = plates.map((p, i) => i).sort((a, b) => plates[b].hh - plates[a].hh), gap = .03;
    for (let m = 1.0; ; m += .05) {
      let x = 0, y = 0, row = 0, ok = true; const rects = [];
      for (const i of order) { const w = plates[i].hw * 2 + gap, h = plates[i].hh * 2 + gap;
        if (x + w > m) { x = 0; y += row; row = 0; } rects[i] = { x, y, w: w - gap, h: h - gap }; x += w; row = Math.max(row, h); if (y + row > m) { ok = false; break; } }
      if (ok) { this.m = m; this.rects = rects; break; }
    }
    // D, S: working state, ahead of the picture. dHalf, view: what the GPU sees, patched on the frame each scar lands.
    this.D = new Float32Array(dRes * dRes * 3); this.S = new Uint8Array(sRes * sRes * 4);
    this.dHalf = new Uint16Array(dRes * dRes * 4); this.view = new Uint8Array(sRes * sRes * 4);
    this.dispTex = new THREE.DataTexture(this.dHalf, dRes, dRes, THREE.RGBAFormat, THREE.HalfFloatType);
    this.dispTex.minFilter = this.dispTex.magFilter = THREE.LinearFilter; this.dispTex.colorSpace = THREE.NoColorSpace; this.dispTex.needsUpdate = true;
    this.surfTex = new THREE.DataTexture(this.view, sRes, sRes, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.surfTex.minFilter = this.surfTex.magFilter = THREE.LinearFilter; this.surfTex.colorSpace = THREE.NoColorSpace; this.surfTex.needsUpdate = true;
    this.clear();
  }
  /** New fight: forget everything. */
  clear() {
    this.D.fill(0); this.S.fill(0); this.dHalf.fill(0); this.view.fill(0); this.log = this.plates.map(() => []); this.n = 0; this.lastT = 0;
    this.queue = []; this.gen = null; this.cur = null; this.patches = []; this.shown = 0; this.dispTex.needsUpdate = this.surfTex.needsUpdate = true;
  }
  /** Scars arrive from the sim about a second before the picture reaches them. */
  add(s) { this.queue.push(s); }
  /** Spend up to ms on stamping. Real time passes in the picture, not here: nothing shows until seek reaches it. */
  pump(ms) {
    const end = performance.now() + ms; let k = 0;
    for (;;) {
      if (!this.gen) { if (!this.queue.length) return; this.cur = this.queue.shift(); this.dR = this.sR = null; this.gen = this.apply(this.cur); }
      if (this.gen.next().done) { this.gen = null; this.patch(); if (performance.now() > end) return; continue; }
      if (++k % 8 === 0 && performance.now() > end) return;
    }
  }
  /** Freeze this scar's result as a small rectangle of final values. */
  patch() {
    const p = { t: this.cur.t, d: null, s: null }, f = THREE.DataUtils.toHalfFloat;
    if (this.dR) { const [x0, y0, x1, y1] = this.dR, w = x1 - x0 + 1, h = y1 - y0 + 1, o = new Uint16Array(w * h * 4); let n = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * this.dRes + x) * 3; o[n++] = f(this.D[i]); o[n++] = f(this.D[i + 1]); o[n++] = f(this.D[i + 2]); n++; }
      p.d = { x0, y0, w, h, o }; }
    if (this.sR) { const [x0, y0, x1, y1] = this.sR, w = x1 - x0 + 1, h = y1 - y0 + 1, o = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) o.set(this.S.subarray(((y + y0) * this.sRes + x0) * 4, ((y + y0) * this.sRes + x1 + 1) * 4), y * w * 4);
      p.s = { x0, y0, w, h, o }; }
    this.patches.push(p);
  }
  /** Show the plate as it was at time t. Going backwards just replays the patches from clean. */
  seek(t) {
    if (t < this.lastT) { this.dHalf.fill(0); this.view.fill(0); this.shown = 0; this.dispTex.needsUpdate = this.surfTex.needsUpdate = true; }
    this.lastT = t;
    while ((this.gen || this.queue.length) && (this.cur && this.gen ? this.cur.t : this.queue[0].t) <= t) this.pump(1e9); // a scar due now that was not ready: finish it
    while (this.shown < this.patches.length && this.patches[this.shown].t <= t) {
      const p = this.patches[this.shown++];
      if (p.d) { const { x0, y0, w, h, o } = p.d; for (let y = 0; y < h; y++) this.dHalf.set(o.subarray(y * w * 4, (y + 1) * w * 4), ((y + y0) * this.dRes + x0) * 4); this.dispTex.needsUpdate = true; }
      if (p.s) { const { x0, y0, w, h, o } = p.s; for (let y = 0; y < h; y++) this.view.set(o.subarray(y * w * 4, (y + 1) * w * 4), ((y + y0) * this.sRes + x0) * 4); this.surfTex.needsUpdate = true; }
    }
  }
  uv(i, u, v) { const r = this.rects[i], p = this.plates[i]; return [(r.x + r.w / 2 + u) / this.m, (r.y + r.h / 2 + v) / this.m]; }

  // Visit texels of plate i inside a metres box. fn(x, y, index). Yields per row, so stamps can be time-sliced.
  *each(res, i, cx, cy, rx, ry, fn) {
    const r = this.rects[i], s = res / this.m;
    const x0 = Math.max(Math.ceil(r.x * s), Math.floor((r.x + r.w / 2 + cx - rx) * s)), x1 = Math.min(Math.floor((r.x + r.w) * s), Math.ceil((r.x + r.w / 2 + cx + rx) * s));
    const y0 = Math.max(Math.ceil(r.y * s), Math.floor((r.y + r.h / 2 + cy - ry) * s)), y1 = Math.min(Math.floor((r.y + r.h) * s), Math.ceil((r.y + r.h / 2 + cy + ry) * s));
    const k = res === this.dRes ? 'dR' : 'sR', d = this[k] ?? [1e9, 1e9, -1, -1];
    this[k] = [Math.min(d[0], x0), Math.min(d[1], y0), Math.max(d[2], x1), Math.max(d[3], y1)];
    for (let y = y0; y <= y1; y++) { for (let x = x0; x <= x1; x++) fn(x / s - r.x - r.w / 2, y / s - r.y - r.h / 2, y * res + x); yield; }
  }
  maxS(i, c, v) { const o = i * 4 + c, q = Math.min(255, v * 255) | 0; if (q > this.S[o]) this.S[o] = q; }

  /** Heavy plate deformation, elongated along (dx,dy): a broad smooth dish and at most a few long straight folds running out of it.
   *  Plate this thick yields in big facets, so there is no small-scale noise in the height. depth in metres, push = drag along the strike. */
  *dent(pl, u, v, dx, dy, depth, sa, sb, push, seed, nFold = 3) {
    const R = Math.max(sa, sb) * 2.6, rays = [];
    for (let k = 0; k < nFold; k++) { const th = (k + .5) / nFold * 6.283 + (hash(k, seed) - .5) * 1.1 + seed; rays.push([Math.cos(th), Math.sin(th), Math.max(sa, sb) * (1.5 + hash(seed, k) * .9), k % 2 ? -1 : 1, .016 + hash(k + 5, seed) * .01]); }
    const fold = (px, py) => { let f = 0, sgn = 0; for (const [c, s, L, g, w] of rays) { const al = px * c + py * s; if (al < 0 || al > L) continue; const q = (-px * s + py * c) / (w * (1 + al / L)), t = Math.exp(-q * q) * sstep(1, .45, al / L); if (t > f) { f = t; sgn = g; } } return f * sgn; };
    yield* this.each(this.dRes, pl, u, v, R, R, (x, y, i) => {
      const px = x - u, py = y - v, a = px * dx + py * dy, b = -px * dy + py * dx, r2 = a * a / (sa * sa) + b * b / (sb * sb), r = Math.sqrt(r2);
      const g = Math.exp(-r2), n = fbm(x * 3.5 + seed, y * 3.5), rim = .1 * Math.exp(-((r - 1.7) ** 2) / .3);
      const h = -depth * (g * (.84 + .3 * n) - rim - .6 * fold(px, py));
      this.D[i * 3] += dx * push * g; this.D[i * 3 + 1] += dy * push * g; this.D[i * 3 + 2] = Math.max(-.05, this.D[i * 3 + 2] + h);
    });
    // Paint cannot stretch: it flakes off along the folds and at the crater lip. Chips only, never a smear.
    if (depth > .012 && nFold) yield* this.each(this.sRes, pl, u, v, R, R, (x, y, i) => {
      const px = x - u, py = y - v, a = px * dx + py * dy, b = -px * dy + py * dx, r2 = a * a / (sa * sa) + b * b / (sb * sb), r = Math.sqrt(r2), th = Math.atan2(b, a);
      const f = Math.abs(fold(px, py)), lip0 = Math.exp(-((r - 1.3) ** 2) / .025); if (f < .5 && lip0 < .2) return;
      const brk = sstep(.46, .6, fbm(th * 1.7 + seed, r * 2.2 + seed)), lip = lip0 * brk, dash = sstep(.42, .56, fbm(x * 9 + seed, y * 9 + seed)), chip = fbm(x * 46 + seed, y * 46), grain = fbm(x * 170 + seed, y * 170), f2 = f * f, f8 = f2 * f2 * f2 * f2;
      const strain = (f8 * dash * 1.5 + lip * .75) * Math.min(1.2, depth / .02);
      this.maxS(i, 0, sstep(.62, .72, strain * (.12 + chip * 1.05 + grain * .5)));
    });
  }
  /** A tooth score: V groove, paint stripped around it, a burr where the tooth left. */
  *score(pl, u, v, dx, dy, len, w, heat, seed) {
    const R = len / 2 + w * 9;
    yield* this.each(this.sRes, pl, u, v, R, R, (x, y, i) => {
      const px = x - u, py = y - v, a = px * dx + py * dy, wob = (vnoise(a * 34 + seed, seed) - .5) * w * 1.6, b = -px * dy + py * dx + wob;
      const t = sstep(len / 2, len * .28, Math.abs(a)), widen = 1 + .45 * sstep(-len / 2, len / 2, a);
      const streak = vnoise(b * 150 + seed, a * 7 + seed); // a tooth ploughs lines along its path, it does not sand an area
      const gr = Math.exp(-((b / (w * widen)) ** 2)) * t * (.45 + streak * .9);
      const flake = fbm(x * 90 + seed, y * 90) * .8, off = Math.exp(-((b / (w * 1.5 * widen)) ** 2)) * t;
      this.maxS(i, 1, gr); this.maxS(i, 0, sstep(.34, .62, off * (.5 + flake)));
      this.maxS(i, 2, Math.exp(-((b / (w * 3)) ** 2)) * t * heat * (.3 + flake * .4));
    });
  }
  /** Torn metal: a hole shaped by petals, tips running out into cracks, tongues between them curled with the blow.
   *  The alpha ramps wider than the cut, so the shader can light a band of freshly torn bright edge. small: a bolt pulled through. */
  *tear(pl, u, v, dx, dy, A, B, seed, small = false) {
    const R = Math.max(A, B) * (small ? 1.7 : 2.3), nP = 7 + Math.floor(seed) % 3, off = hash(seed, 1);
    const petal = th => { const q = (th / 6.28319 + .5 + off) * nP, k = Math.floor(q), e = 1 - Math.abs((q - k) * 2 - 1); return e * (.4 + .8 * hash(k % nP, seed)); }, jag = th => { const q = (th / 6.28319 + off) * 29, e = 1 - Math.abs((q - Math.floor(q)) * 2 - 1); return e - .5; };
    yield* this.each(this.sRes, pl, u, v, R, R, (x, y, i) => {
      const px = x - u, py = y - v, a = px * dx + py * dy, b = -px * dy + py * dx, e2 = a * a / (A * A) + b * b / (B * B); if (e2 > 11) return;
      const th = Math.atan2(b / B, a / A), star = .66 + .74 * petal(th) + jag(th) * .16 + (fbm(x * 24 + seed, y * 24) - .5) * .55 + (fbm(x * 70 + seed, y * 70) - .5) * .22 + (vnoise(x * 170, y * 170) - .5) * .1;
      const f = Math.sqrt(e2) / star, fl = fbm(x * 120 + seed, y * 120);
      let cut = sstep(1.24, .97, f);
      if (!small) for (const s of [-1, 1]) { const q = a * s; if (q > A * .55 && q < A * 2) { const w = B * .17 * (1 - (q - A * .55) / (A * 1.45)), wob = (vnoise(q * 30 + seed + s, seed) - .5) * B * 1.1; cut = Math.max(cut, sstep(w * 1.5, w * .35, Math.abs(b - wob))); } }
      this.maxS(i, 3, cut); this.maxS(i, 0, sstep(.5, .62, (small ? 1.25 - f : 1.42 - f) * (.3 + fl * 1.1))); if (!small) this.maxS(i, 2, sstep(1.9, 1.05, f) * .5);
    });
    yield* this.each(this.dRes, pl, u, v, R * 1.5, R * 1.5, (x, y, i) => {
      const px = x - u, py = y - v, a = px * dx + py * dy, b = -px * dy + py * dx, e2 = a * a / (A * A) + b * b / (B * B); if (e2 > 16) return;
      const th = Math.atan2(b / B, a / A), P = petal(th), f = Math.sqrt(e2) / (.7 + .66 * P), lip = Math.exp(-Math.max(0, f - 1) / .4), tongue = lip * lip * (1 - P * .55);
      // the tooth drags the metal: tongues downstream curl out of the plate, tongues upstream fold into the hole
      const down = sstep(-.6, .8, a / A), lift = (small ? .012 : .056) * (down * 1.25 - .32);
      this.D[i * 3] += dx * .022 * lip; this.D[i * 3 + 1] += dy * .022 * lip; this.D[i * 3 + 2] += tongue * lift;
    });
  }
  /** Plate kinked along its holding edge, so a hanging panel looks levered off. edge: 0 top, 1 +u, 2 -u. */
  *bend(pl, edge, seed) {
    const P = this.plates[pl];
    yield* this.each(this.dRes, pl, 0, 0, P.hw, P.hh, (x, y, i) => {
      const d = edge === 0 ? P.hh - y : edge === 1 ? P.hw - x : P.hw + x, span = edge === 0 ? P.hh * 2 : P.hw * 2, k = d / span;
      const along = edge === 0 ? x : y, n = fbm(along * 2.5 + seed, d * 2.5);
      const free = Math.max(0, d - .05);
      this.D[i * 3 + 2] += (free * free * .34 / span + free * .05) * (.72 + n * .55) + .012 * Math.sin(along * 4.5 + seed) * k;
    });
  }
  /** Panel ripped off: bolt holes pulled through the edges, whole outline waved. */
  *rip(pl, seed) {
    const P = this.plates[pl];
    yield* this.each(this.dRes, pl, 0, 0, P.hw, P.hh, (x, y, i) => {
      const e = Math.min(P.hw - Math.abs(x), P.hh - Math.abs(y)), w = sstep(.1, 0, e);
      this.D[i * 3 + 2] += w * .03 * (fbm(x * 4 + seed, y * 4) - .35);
    });
    for (let k = 0; k < 14; k++) {
      const s = hash(k, seed), side = k % 4, q = hash(k + 3, seed) * 2 - 1;
      const u = side < 2 ? q * P.hw * .92 : (side === 2 ? 1 : -1) * (P.hw - .022), v = side < 2 ? (side === 0 ? 1 : -1) * (P.hh - .022) : q * P.hh * .92;
      // a bolt pulled through the edge: a slot from the hole out to the rim of the plate
      const out = side < 2 ? [0, side === 0 ? 1 : -1] : [side === 2 ? 1 : -1, 0], j = (hash(k, 9) - .5) * .7, ca = Math.cos(j), sa = Math.sin(j);
      yield* this.tear(pl, u, v, out[0] * ca - out[1] * sa, out[0] * sa + out[1] * ca, .03 + s * .02, .013 + s * .009, k + seed, true);
    }
  }
  /** Apply one scar. A strike landing close to an earlier one breaks through: damage accumulates where hits really fall. */
  *apply(s) {
    const i = s.plate, sd = (s.t * 97 + this.n++) % 61, dx = s.du, dy = s.dv, px = -dy, py = dx, P = this.plates[i], e = s.e;
    const near = this.log[i].filter(q => Math.hypot(q.u - s.u, q.v - s.v) < .17 && q.e > .3).reduce((a, q) => a + q.e, 0);
    this.log[i].push(s);
    if (s.kind === 'skim') { yield* this.score(i, s.u, s.v, dx, dy, .05 + e * .1, .0022, .35, sd); return; }
    if (s.kind === 'axe') {
      // Blade chop: a slot across the swing, a dished crater, cracked paint round it
      yield* this.dent(i, s.u, s.v, dx, dy, .05, .085, .12, .012, sd);
      yield* this.dent(i, s.u, s.v, px, py, .018, .1, .04, 0, sd + 3, 0);
      yield* this.score(i, s.u, s.v, px, py, .17, .009, 1, sd);
      yield* this.score(i, s.u + dx * .014, s.v + dy * .014, px, py, .11, .004, .7, sd + 1);
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + sd, r = .07 + hash(k, sd) * .05; yield* this.score(i, s.u + Math.cos(a) * r, s.v + Math.sin(a) * r, Math.cos(a), Math.sin(a), .05 + hash(sd, k) * .06, .0016, .3, sd + k); }
      yield* this.each(this.sRes, i, s.u, s.v, .14, .14, (x, y, o) => { const r = Math.hypot((x - s.u) / .075, (y - s.v) / .05 ), n = fbm(x * 26 + sd, y * 26), n2 = fbm(x * 120, y * 120); this.maxS(o, 0, sstep(.62, .72, (1.5 - r) * (.25 + n * .9) + n2 * .22)); this.maxS(o, 2, sstep(1.7, .3, r) * .7); });
      if (near > .4) yield* this.tear(i, s.u, s.v, px, py, .08, .022, sd);
      return;
    }
    if (s.kind === 'bend') { yield* this.bend(i, s.a ?? 0, sd); return; }
    if (s.kind === 'rip') { yield* this.rip(i, sd); return; }
    // Drum strike: one trough under each tooth row, the rows sit 13.5 cm apart along the drum
    yield* this.dent(i, s.u, s.v, dx, dy, .025 + e * .04, .12, .17, .016 * e, sd);
    for (const k of [-1, 0, 1]) {
      const u = s.u + px * k * .135, v = s.v + py * k * .135, tilt = (hash(k + 2, sd) - .5) * .1, ax = dx + px * tilt, ay = dy + py * tilt;
      if (Math.abs(u) > P.hw + .05 || Math.abs(v) > P.hh + .05) continue;
      const row = (k === 0) === (sd % 2 > 1); // two rows bite on one pass, the third is a half turn behind
      const len = (.09 + e * .22) * (row ? 1 : .7);
      yield* this.dent(i, u, v, dx, dy, .01 + e * .018, len * .7, .05, .02 * e, sd + k, 0);
      yield* this.score(i, u, v, ax, ay, len, .0045 + e * .004, 1, sd + k);
      yield* this.score(i, u + px * .012, v + py * .012, ax, ay, len * .75, .002, .6, sd + k + 4);
    }
    if (s.kind === 'tear' || e + near > 1.05) yield* this.tear(i, s.u, s.v, dx, dy, .085 + e * .1, .035 + e * .035, sd);
  }
}
