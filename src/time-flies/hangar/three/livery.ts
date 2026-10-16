// Paint for an Aircraft, drawn with Canvas 2D onto one 2048×2048 atlas in four views: from above, from below, and each
// side. The paint material (materials.ts) projects the atlas back onto every part by its position and facing, so a camo
// blob, a stripe, a shark mouth or a tail number lands in the same place on fuselage, wings and fins alike. Marks are
// placed in aircraft terms: x as a fraction of the length, heights in metres.
import type { Fit } from '../catalog';
import type { Station } from './geometry';

export type Mark =
  /** Wavy camouflage blobs over the base, on the upper surfaces and sides. */
  | { kind: 'camo'; colors: string[]; scale?: number; seed?: number; under?: boolean }
  /** Hard-edged angular camouflage. */
  | { kind: 'splinter'; colors: string[]; seed?: number; under?: boolean }
  /** A band right round the aircraft between two fractions of its length. */
  | { kind: 'band'; x0: number; x1: number; color: string }
  /** The very front, up to a fraction of the length (a radome or spinner). */
  | { kind: 'nose'; x1: number; color: string }
  /** The fins, from a fraction of their height up. */
  | { kind: 'fins'; color: string; from?: number }
  /** A stripe along the side at a height (metres from the centre line), optionally between fractions of the length. */
  | { kind: 'stripe'; y: number; h: number; color: string; x0?: number; x1?: number }
  /** A stripe down the spine and the centre of the belly. */
  | { kind: 'spine'; w: number; color: string; x0?: number; x1?: number; under?: boolean }
  /** The outer part of the wings and tailplanes, from a fraction of the half span. */
  | { kind: 'wingtips'; color: string; from: number }
  /** A band along the wings' leading edges, a fraction of the chord wide. */
  | { kind: 'leading'; color: string; w: number; under?: boolean }
  /** A checkerboard band, top and sides. */
  | { kind: 'checker'; x0: number; x1: number; colors: [string, string]; n?: number }
  /** A dark anti-glare panel on top, in front of the canopy. */
  | { kind: 'antiglare'; x0: number; x1: number; color?: string }
  /** Sunburst rays fanning back over the top from the nose (air show schemes). */
  | { kind: 'rays'; colors: string[]; n?: number }
  /** The underside in a second colour (countershading). */
  | { kind: 'belly'; color: string };

export interface Scheme {
  base: string;
  /** Underside colour (default: the base). */
  under?: string;
  finish?: 'matte' | 'satin' | 'gloss' | 'metal';
  marks?: Mark[];
  insignia?: 'star' | 'lowvis' | 'none';
}

/** What the painter needs to know about the shape, from the built Aircraft. */
export interface Shape {
  min: [number, number, number];
  max: [number, number, number];
  length: number;
  /** Wing and tailplane outlines from above (right side). */
  wings: { stations: Station[]; kind: 'wing' | 'tail' | 'strake' }[];
  /** Fins in side view. */
  fins: Station[][];
  /** The main fuselage's centre line height, top and bottom at x (metres). */
  fuselage(x: number): { y: number; top: number; bot: number; w: number };
  cockpit: readonly [number, number, number];
}

export const ATLAS = 2048;
const Q = ATLAS / 2;
type View = 'top' | 'bottom' | 'right' | 'left';
const VIEWS: readonly View[] = ['top', 'bottom', 'right', 'left'];
const ORIGIN: Record<View, [number, number]> = { top: [0, 0], bottom: [Q, 0], right: [0, Q], left: [Q, Q] };

interface Pen {
  g: CanvasRenderingContext2D;
  view: View;
  /** Canvas x for an aircraft x. */
  px(x: number): number;
  /** Canvas y for z (top/bottom views) or y (side views). */
  py(v: number): number;
  /** Pixels per metre along x, and across. */
  kx: number;
  ky: number;
}

function rng(seed: number) {
  let s = seed | 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function pens(g: CanvasRenderingContext2D, s: Shape): Record<View, Pen> {
  const [x0, y0, z0] = s.min, [x1, y1, z1] = s.max;
  const kx = Q / (x1 - x0), kz = Q / (z1 - z0), ky = Q / (y1 - y0);
  const make = (view: View): Pen => {
    const [ox, oy] = ORIGIN[view], side = view === 'right' || view === 'left';
    return {
      g, view, kx, ky: side ? ky : kz,
      px: x => ox + (x - x0) * kx,
      py: side ? (y => oy + (y1 - y) * ky) : (z => oy + (z - z0) * kz),
    };
  };
  return { top: make('top'), bottom: make('bottom'), right: make('right'), left: make('left') };
}

function inView(p: Pen, draw: () => void) {
  const [ox, oy] = ORIGIN[p.view];
  p.g.save();
  p.g.beginPath(); p.g.rect(ox, oy, Q, Q); p.g.clip();
  draw();
  p.g.restore();
}

/** A wing's outline from above, right side then mirrored. */
function planform(p: Pen, stations: Station[], mirror: 1 | -1) {
  const g = p.g;
  g.beginPath();
  stations.forEach((s, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(s.le[0]), p.py(mirror * s.le[2])));
  [...stations].reverse().forEach(s => g.lineTo(p.px(s.le[0] + s.chord), p.py(mirror * s.le[2])));
  g.closePath();
}
function finOutline(p: Pen, stations: Station[]) {
  const g = p.g;
  g.beginPath();
  stations.forEach((s, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(s.le[0]), p.py(s.le[1])));
  [...stations].reverse().forEach(s => g.lineTo(p.px(s.le[0] + s.chord), p.py(s.le[1])));
  g.closePath();
}
const finBox = (f: Station[]) => {
  const xs = f.flatMap(s => [s.le[0], s.le[0] + s.chord]), ys = f.map(s => s.le[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

/** Wavy blobs, as on a sprayed camouflage scheme. */
function blobs(p: Pen, colors: string[], scale: number, seed: number) {
  const r = rng(seed + VIEWS.indexOf(p.view) * 977), g = p.g, [ox, oy] = ORIGIN[p.view];
  const size = scale * Q * 0.11;
  for (const c of colors) {
    g.fillStyle = c;
    for (let i = 0; i < 26; i++) {
      const cx = ox + r() * Q, cy = oy + r() * Q, n = 9, rad = size * (0.6 + r() * 0.9), stretch = 1.4 + r();
      g.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * Math.PI * 2, w = rad * (0.65 + r() * 0.5);
        const x = cx + Math.cos(a) * w * stretch, y = cy + Math.sin(a) * w;
        if (k === 0) g.moveTo(x, y); else g.quadraticCurveTo(cx + Math.cos(a - 0.35) * w * 1.25 * stretch, cy + Math.sin(a - 0.35) * w * 1.25, x, y);
      }
      g.fill();
    }
  }
}
function splinters(p: Pen, colors: string[], seed: number) {
  const r = rng(seed + VIEWS.indexOf(p.view) * 131), g = p.g, [ox, oy] = ORIGIN[p.view];
  for (const c of colors) {
    g.fillStyle = c;
    for (let i = 0; i < 16; i++) {
      const cx = ox + r() * Q, cy = oy + r() * Q, s = Q * (0.06 + r() * 0.1);
      g.beginPath();
      g.moveTo(cx - s * 1.6, cy - s * 0.3);
      g.lineTo(cx + s * (0.2 + r()), cy - s * (0.6 + r() * 0.4));
      g.lineTo(cx + s * 1.8, cy + s * 0.2);
      g.lineTo(cx - s * (0.2 + r() * 0.5), cy + s * (0.5 + r() * 0.5));
      g.closePath();
      g.fill();
    }
  }
}

/** The US star-and-bar insignia, centred at (cx, cy) with radius r in pixels. */
function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, lowvis: boolean, rx = r) {
  g.save();
  g.translate(cx, cy);
  g.scale(rx / r, 1);
  const ink = lowvis ? '#5b636c' : '#1d3f8f';
  const bar = (fill: string, h: number, w: number) => { g.fillStyle = fill; g.fillRect(-r * w, -h / 2, r * 2 * w, h); };
  if (!lowvis) { bar(ink, r * 0.62, 1.9); bar('#ffffff', r * 0.42, 1.8); bar('#c8202f', r * 0.16, 1.75); }
  else { g.strokeStyle = ink; g.lineWidth = r * 0.07; g.strokeRect(-r * 1.9, -r * 0.31, r * 3.8, r * 0.62); }
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
  if (lowvis) { g.strokeStyle = ink; g.lineWidth = r * 0.07; g.stroke(); } else { g.fillStyle = ink; g.fill(); }
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.38 : r * 0.95;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  if (lowvis) { g.strokeStyle = ink; g.lineWidth = r * 0.07; g.stroke(); } else { g.fillStyle = '#ffffff'; g.fill(); }
  g.restore();
}

function textOnSide(p: Pen, cx: number, cy: number, height: number, style: (g: CanvasRenderingContext2D) => void) {
  const g = p.g;
  g.save();
  g.translate(cx, cy);
  if (p.view === 'left') g.scale(-1, 1); // seen from the left the aircraft faces the other way, so the text is mirrored to read right
  g.scale(p.kx / p.ky, 1);
  g.font = `900 ${height}px "Arial Black", Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  style(g);
  g.restore();
}

// ---------- the Mods painted on: Nose Art, Tail Art and the Tail Number ----------

function noseArt(p: Pen, s: Shape, rung: number) {
  const g = p.g, L = s.length, nose = s.min[0];
  const at = (f: number) => s.fuselage(nose + f * L);
  const X = (f: number) => p.px(nose + f * L);
  if (rung === 1) { // a lightning bolt along the nose
    const f0 = 0.06, f1 = 0.28, a = at(f0), b = at(f1);
    g.fillStyle = '#ffd400'; g.strokeStyle = '#000'; g.lineWidth = 3;
    const y = (f: number, k: number) => { const q = at(f); return p.py(q.y + k * q.top); };
    g.beginPath();
    g.moveTo(X(f0), y(f0, 0.1)); g.lineTo(X(0.13), y(0.13, -0.05)); g.lineTo(X(0.12), y(0.12, 0.35)); g.lineTo(X(0.21), y(0.21, 0.05));
    g.lineTo(X(0.2), y(0.2, 0.4)); g.lineTo(X(f1), y(f1, 0)); g.lineTo(X(0.19), y(0.19, -0.25)); g.lineTo(X(0.2), y(0.2, -0.05));
    g.lineTo(X(0.11), y(0.11, -0.3)); g.lineTo(X(0.12), y(0.12, -0.55)); g.closePath();
    g.fill(); g.stroke();
    void a; void b;
    return;
  }
  // a mouth along the underside of the nose, open toward the front
  const m0 = rung === 4 ? 0.02 : 0.035, m1 = rung === 4 ? 0.24 : 0.17;
  const lip = (f: number) => { const q = at(f); return p.py(q.y - q.bot * 0.15); };
  const jaw = (f: number, open: number) => { const q = at(f); return p.py(q.y - q.bot * (0.15 + open)); };
  const top = (f: number) => p.py(at(f).y + at(f).top * 0.05);
  if (rung === 4) { // fire dragon: flames licking back from the nose
    const grad = g.createLinearGradient(X(m0), 0, X(0.42), 0);
    grad.addColorStop(0, '#fff3a0'); grad.addColorStop(0.3, '#ffb000'); grad.addColorStop(0.7, '#ff4a00'); grad.addColorStop(1, '#b00000');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(X(m0), lip(m0));
    for (let k = 0; k <= 8; k++) { const f = m0 + (k / 8) * (0.42 - m0), q = at(f); g.lineTo(X(f), p.py(q.y + q.top * (k % 2 ? 0.75 : 0.25))); }
    for (let k = 8; k >= 0; k--) { const f = m0 + (k / 8) * (0.42 - m0), q = at(f); g.lineTo(X(f), p.py(q.y - q.bot * (k % 2 ? 0.8 : 0.4))); }
    g.closePath(); g.fill();
  }
  // the mouth
  g.fillStyle = rung === 3 ? '#7a0010' : '#b0101a';
  g.beginPath(); g.moveTo(X(m0), lip(m0));
  for (let k = 0; k <= 10; k++) { const f = m0 + ((m1 - m0) * k) / 10; g.lineTo(X(f), lip(f) - Math.sin((k / 10) * Math.PI) * p.ky * 0.12); }
  for (let k = 10; k >= 0; k--) { const f = m0 + ((m1 - m0) * k) / 10; g.lineTo(X(f), jaw(f, 0.25 * Math.sin((k / 10) * Math.PI * 0.9 + 0.1))); }
  g.closePath(); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
  // teeth
  g.fillStyle = '#ffffff';
  const teeth = rung === 3 ? 7 : 9;
  for (let k = 0; k < teeth; k++) {
    const f = m0 + ((m1 - m0) * (k + 0.5)) / teeth, w = ((m1 - m0) * L * p.kx) / teeth / 2;
    const upper = lip(f) - Math.sin(((k + 0.5) / teeth) * Math.PI) * p.ky * 0.12, lower = jaw(f, 0.25 * Math.sin(((k + 0.5) / teeth) * Math.PI * 0.9 + 0.1));
    const len = (lower - upper) * (rung === 3 ? 0.62 : 0.45);
    g.beginPath(); g.moveTo(X(f) - w, upper); g.lineTo(X(f), upper + len); g.lineTo(X(f) + w, upper); g.fill();
    g.beginPath(); g.moveTo(X(f) - w, lower); g.lineTo(X(f), lower - len * 0.8); g.lineTo(X(f) + w, lower); g.fill();
  }
  // an eye above the corner of the mouth
  const ef = m1 * 0.9, eq = at(ef), ex = X(ef), ey = top(ef) - eq.top * p.ky * 0.15, er = Math.max(eq.top * p.ky * 0.18, 6);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, er * 1.4 * (p.ky / p.kx) * (p.kx / p.ky), er, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
  g.fillStyle = rung === 3 ? '#e8a000' : '#000'; g.beginPath(); g.arc(ex + er * 0.3, ey, er * 0.55, 0, Math.PI * 2); g.fill();
  if (rung === 3) { // tiger stripes behind the mouth
    g.fillStyle = '#111';
    for (let k = 0; k < 5; k++) {
      const f = m1 + 0.015 + k * 0.022, q = at(f);
      g.beginPath(); g.moveTo(X(f), p.py(q.y + q.top * 0.9)); g.lineTo(X(f + 0.012), p.py(q.y)); g.lineTo(X(f), p.py(q.y - q.bot * 0.9)); g.lineTo(X(f - 0.006), p.py(q.y)); g.closePath(); g.fill();
    }
  }
}

function tailArt(p: Pen, s: Shape, rung: number) {
  const g = p.g;
  for (const f of s.fins) {
    const b = finBox(f), h = b.y1 - b.y0;
    g.save(); finOutline(p, f); g.clip();
    if (rung === 1) { // stripes across the fin
      for (const [k, c] of [[0.55, '#c8202f'], [0.68, '#ffffff'], [0.81, '#1d3f8f']] as const) { g.fillStyle = c; g.fillRect(p.px(b.x0 - 1), p.py(b.y0 + h * (k + 0.11)), (b.x1 - b.x0 + 2) * p.kx, h * 0.11 * p.ky); }
    } else if (rung === 2) { // a field of stars
      g.fillStyle = '#1d3f8f'; g.fillRect(p.px(b.x0 - 1), p.py(b.y1 + 1), (b.x1 - b.x0 + 2) * p.kx, (h * 0.55 + 1) * p.ky);
      const r = rng(7);
      for (let k = 0; k < 14; k++) starShape(g, p.px(b.x0 + (b.x1 - b.x0) * (0.3 + r() * 0.65)), p.py(b.y0 + h * (0.5 + r() * 0.45)), h * p.ky * 0.06, '#fff');
    } else if (rung === 3) { // checkers
      const n = 6, cw = (b.x1 - b.x0) / n, ch = h / 6;
      for (let i = 0; i < n; i++) for (let j = 0; j < 6; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#ffd400'; g.fillRect(p.px(b.x0 + i * cw), p.py(b.y0 + (j + 1) * ch), cw * p.kx + 1, ch * p.ky + 1); }
    } else if (rung === 4) { // a golden eagle
      const grad = g.createLinearGradient(0, p.py(b.y1), 0, p.py(b.y0));
      grad.addColorStop(0, '#fff3b0'); grad.addColorStop(0.5, '#ffc21a'); grad.addColorStop(1, '#a86c00');
      eagle(g, p.px(b.x0 + (b.x1 - b.x0) * 0.6), p.py(b.y0 + h * 0.6), h * 0.6, p.kx, p.ky, grad);
    }
    g.restore();
  }
}
function starShape(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  g.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.4 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = fill; g.fill();
}
/** A golden eagle `s` metres tall, wings up, facing the nose; kx, ky are pixels per metre. */
function eagle(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, kx: number, ky: number, fill: CanvasGradient) {
  g.save(); g.translate(cx, cy); g.scale((kx * s) / 200, (ky * s) / 200);
  g.fillStyle = fill; g.strokeStyle = '#5a3a00'; g.lineWidth = 5;
  g.beginPath(); // wings spread up, head facing forward (toward the nose, -x)
  g.moveTo(-30, -10); g.quadraticCurveTo(-60, -40, -95, -95); g.quadraticCurveTo(-50, -70, -10, -55); g.quadraticCurveTo(10, -85, 60, -100);
  g.quadraticCurveTo(45, -45, 25, -15); g.lineTo(55, 30); g.lineTo(25, 22); g.lineTo(30, 60); g.lineTo(10, 30); g.lineTo(-10, 58); g.lineTo(-8, 18);
  g.quadraticCurveTo(-45, 15, -55, -5); g.lineTo(-80, 0); g.lineTo(-58, -14); g.closePath();
  g.fill(); g.stroke();
  g.restore();
}

function tailNumber(p: Pen, s: Shape, fit: Fit) {
  const style = fit.number;
  if (!style) return;
  const text = String(fit.tailNumber).padStart(2, '0');
  for (const f of s.fins) {
    const b = finBox(f), h = b.y1 - b.y0;
    const cx = p.px(b.x0 + (b.x1 - b.x0) * 0.55), cy = p.py(b.y0 + h * 0.32), size = h * p.ky * 0.26;
    textOnSide(p, cx, cy, size, g => {
      if (style === 3) { // flaming: a fire gradient with flames behind
        const grad = g.createLinearGradient(0, -size / 2, 0, size / 2);
        grad.addColorStop(0, '#ffe066'); grad.addColorStop(0.5, '#ff7a00'); grad.addColorStop(1, '#c81e00');
        g.fillStyle = grad;
      } else if (style === 4) {
        const grad = g.createLinearGradient(0, -size / 2, 0, size / 2);
        grad.addColorStop(0, '#fff6c0'); grad.addColorStop(0.5, '#ffc21a'); grad.addColorStop(1, '#a46a00');
        g.shadowColor = '#ffd23f'; g.shadowBlur = size * 0.3; g.fillStyle = grad;
      } else g.fillStyle = '#f2f2f2';
      if (style >= 2) { g.lineWidth = size * 0.12; g.strokeStyle = style === 2 ? '#111' : '#3a1800'; g.lineJoin = 'round'; g.strokeText(text, 0, 0); }
      g.fillText(text, 0, 0);
      if (style === 1) { g.lineWidth = 2; g.strokeStyle = '#0006'; g.strokeText(text, 0, 0); }
    });
  }
}

// ---------- painting a whole scheme ----------

/** Dark seams between panels and a few rows of rivets, the same on every scheme. */
function panelLines(p: Pen, s: Shape) {
  const g = p.g, L = s.length, x0 = s.min[0];
  g.save();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.6;
  if (p.view === 'right' || p.view === 'left') {
    for (let f = 0.12; f < 0.97; f += 0.07 + ((f * 13) % 0.03)) { g.beginPath(); g.moveTo(p.px(x0 + f * L), p.py(s.max[1])); g.lineTo(p.px(x0 + f * L), p.py(s.min[1])); g.stroke(); }
    g.beginPath();
    for (let f = 0.02; f <= 1; f += 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(p.px(x0 + f * L), p.py(q.y + q.top * 0.45)); }
    g.stroke();
    for (const fin of s.fins) { // rudder hinge
      g.beginPath(); fin.forEach((st, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(st.le[0] + st.chord * 0.7), p.py(st.le[1]))); g.stroke();
    }
  } else {
    for (const w of s.wings) for (const m of [1, -1] as const) {
      for (const k of [0.25, 0.68]) { g.beginPath(); w.stations.forEach((st, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(st.le[0] + st.chord * k), p.py(m * st.le[2]))); g.stroke(); }
      if (w.kind === 'wing') { // flaps and ailerons
        g.beginPath(); w.stations.forEach((st, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(st.le[0] + st.chord * 0.78), p.py(m * st.le[2]))); g.stroke();
      }
    }
    for (let f = 0.12; f < 0.97; f += 0.08) { const q = s.fuselage(x0 + f * L); g.beginPath(); g.moveTo(p.px(x0 + f * L), p.py(-q.w)); g.lineTo(p.px(x0 + f * L), p.py(q.w)); g.stroke(); }
  }
  g.fillStyle = 'rgba(0,0,0,0.16)';
  if (p.view !== 'bottom') for (let f = 0.15; f < 0.9; f += 0.006) { const q = s.fuselage(x0 + f * L); if (p.view === 'top') { g.fillRect(p.px(x0 + f * L), p.py(q.w * 0.5), 1.4, 1.4); g.fillRect(p.px(x0 + f * L), p.py(-q.w * 0.5), 1.4, 1.4); } else g.fillRect(p.px(x0 + f * L), p.py(q.y + q.top * 0.45) + 4, 1.4, 1.4); }
  g.restore();
}

/** A soft wash of grime and sheen variation, so big flat colours don't look like plastic. */
function weather(p: Pen, seed: number, amount: number) {
  const g = p.g, r = rng(seed + VIEWS.indexOf(p.view)), [ox, oy] = ORIGIN[p.view];
  for (let i = 0; i < 90; i++) {
    const x = ox + r() * Q, y = oy + r() * Q, rad = 30 + r() * 140, grad = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.6;
    grad.addColorStop(0, dark ? `rgba(0,0,0,${0.05 * amount})` : `rgba(255,255,255,${0.04 * amount})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  if (p.view === 'right' || p.view === 'left') { // streaks running aft
    g.strokeStyle = `rgba(30,25,20,${0.05 * amount})`; g.lineWidth = 2;
    for (let i = 0; i < 60; i++) { const x = ox + r() * Q, y = oy + r() * Q; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 120, y + (r() - 0.5) * 6); g.stroke(); }
  }
}

function mark(p: Pen, s: Shape, m: Mark) {
  const g = p.g, L = s.length, x0 = s.min[0], X = (f: number) => p.px(x0 + f * L), [ox, oy] = ORIGIN[p.view];
  const side = p.view === 'right' || p.view === 'left', under = p.view === 'bottom';
  switch (m.kind) {
    case 'camo': if (!under || m.under) blobs(p, m.colors, m.scale ?? 1, m.seed ?? 1); break;
    case 'splinter': if (!under || m.under) splinters(p, m.colors, m.seed ?? 1); break;
    case 'band': g.fillStyle = m.color; g.fillRect(X(m.x0), oy, (m.x1 - m.x0) * L * p.kx, Q); break;
    case 'nose': g.fillStyle = m.color; g.fillRect(ox, oy, X(m.x1) - ox, Q); break;
    case 'fins': if (side) for (const f of s.fins) {
      const b = finBox(f);
      g.save(); finOutline(p, f); g.clip(); g.fillStyle = m.color;
      g.fillRect(p.px(b.x0 - 1), p.py(b.y1 + 1), (b.x1 - b.x0 + 2) * p.kx, (b.y1 + 1 - (b.y0 + (b.y1 - b.y0) * (m.from ?? 0))) * p.ky);
      g.restore();
    } break;
    case 'stripe': if (side) { g.fillStyle = m.color; g.fillRect(X(m.x0 ?? 0), p.py(m.y + m.h / 2), ((m.x1 ?? 1) - (m.x0 ?? 0)) * L * p.kx, m.h * p.ky); } break;
    case 'spine': if (p.view === 'top' || (under && m.under)) { g.fillStyle = m.color; g.fillRect(X(m.x0 ?? 0), p.py(-m.w / 2), ((m.x1 ?? 1) - (m.x0 ?? 0)) * L * p.kx, m.w * p.ky); } break;
    case 'wingtips': if (!side) for (const w of s.wings) for (const sgn of [1, -1] as const) {
      const span = Math.max(...w.stations.map(st => st.le[2]));
      g.save(); planform(p, w.stations, sgn); g.clip(); g.fillStyle = m.color;
      const zc = sgn * span * m.from, zEdge = sgn * span * 1.05;
      g.fillRect(ox, Math.min(p.py(zc), p.py(zEdge)), Q, Math.abs(p.py(zEdge) - p.py(zc)));
      g.restore();
    } break;
    case 'leading': if (p.view === 'top' || (under && m.under)) for (const w of s.wings.filter(w => w.kind === 'wing')) for (const sgn of [1, -1] as const) {
      g.fillStyle = m.color; g.beginPath();
      w.stations.forEach((st, i) => (i ? g.lineTo : g.moveTo).call(g, p.px(st.le[0]), p.py(sgn * st.le[2])));
      [...w.stations].reverse().forEach(st => g.lineTo(p.px(st.le[0] + st.chord * m.w), p.py(sgn * st.le[2])));
      g.closePath(); g.fill();
    } break;
    case 'checker': if (!under) {
      const n = m.n ?? 6, w = ((m.x1 - m.x0) * L * p.kx) / n, rows = Math.ceil(Q / w);
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { g.fillStyle = m.colors[(i + j) % 2]!; g.fillRect(X(m.x0) + i * w, oy + j * w, w + 0.5, w + 0.5); }
    } break;
    case 'antiglare': if (p.view === 'top') {
      g.fillStyle = m.color ?? '#20242a'; g.beginPath();
      for (let f = m.x0; f <= m.x1 + 0.001; f += 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(X(f), p.py(-q.w * 0.55)); }
      for (let f = m.x1; f >= m.x0 - 0.001; f -= 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(X(f), p.py(q.w * 0.55)); }
      g.closePath(); g.fill();
    } else if (side) {
      g.fillStyle = m.color ?? '#20242a'; g.beginPath();
      for (let f = m.x0; f <= m.x1 + 0.001; f += 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(X(f), p.py(q.y + q.top * 0.78)); }
      for (let f = m.x1; f >= m.x0 - 0.001; f -= 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(X(f), p.py(q.y + q.top * 1.3)); }
      g.closePath(); g.fill();
    } break;
    case 'rays': if (!under) {
      const n = m.n ?? 10, cx = X(0.02), cy = side ? p.py(s.fuselage(x0 + 0.02 * L).y) : oy + Q / 2;
      for (let k = 0; k < n; k++) {
        const a0 = -Math.PI / 2 + (k / n) * Math.PI, a1 = a0 + Math.PI / n;
        g.fillStyle = m.colors[k % m.colors.length]!; g.beginPath(); g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a0) * Q * 2, cy + Math.sin(a0) * Q * 2); g.lineTo(cx + Math.cos(a1) * Q * 2, cy + Math.sin(a1) * Q * 2); g.closePath(); g.fill();
      }
    } break;
    case 'belly': if (under) { g.fillStyle = m.color; g.fillRect(ox, oy, Q, Q); }
      else if (side) { g.fillStyle = m.color; g.beginPath(); for (let f = 0; f <= 1.0001; f += 0.01) { const q = s.fuselage(x0 + f * L); g.lineTo(X(f), p.py(q.y - q.bot * 0.15)); } g.lineTo(X(1), oy + Q); g.lineTo(X(0), oy + Q); g.closePath(); g.fill(); }
      break;
  }
}

/** The free Colour paints the Aircraft's real scheme; any other Colour paints it plainly in that colour. */
export function plainScheme(hex: string): Scheme {
  return { base: hex, finish: 'gloss', insignia: 'star', marks: [{ kind: 'belly', color: shade(hex, 1.18) }] };
}
export const GOLD: Scheme = { base: '#d7a531', finish: 'metal', insignia: 'none', marks: [{ kind: 'spine', w: 0.25, color: '#fff1b0' }] };

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16), c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Paints the scheme and the painted Mods onto the atlas canvas. */
export function paintAtlas(canvas: HTMLCanvasElement | OffscreenCanvas, s: Shape, scheme: Scheme, fit: Fit) {
  canvas.width = canvas.height = ATLAS;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  const all = pens(g, s);
  for (const view of VIEWS) {
    const p = all[view], [ox, oy] = ORIGIN[view];
    inView(p, () => {
      g.fillStyle = view === 'bottom' && scheme.under ? scheme.under : scheme.base;
      g.fillRect(ox, oy, Q, Q);
      if (view !== 'bottom' && scheme.under) mark(p, s, { kind: 'belly', color: scheme.under });
      for (const m of scheme.marks ?? []) mark(p, s, m);
      panelLines(p, s);
      weather(p, 11, scheme.finish === 'gloss' ? 0.5 : scheme.finish === 'metal' ? 0.6 : 1);
      const insignia = scheme.insignia ?? 'lowvis';
      if (insignia !== 'none') {
        const lowvis = insignia === 'lowvis';
        if (view === 'right' || view === 'left') {
          const x = s.min[0] + s.length * 0.62, q = s.fuselage(x), r = Math.min(q.top + q.bot, 1.6) * 0.32 * p.ky;
          star(g, p.px(x), p.py(q.y), r, lowvis, r * p.kx / p.ky);
        } else {
          const w = s.wings.find(w => w.kind === 'wing');
          if (w) {
            const tip = w.stations[w.stations.length - 1]!, z = tip.le[2] * 0.68, st = w.stations.reduce((a, b) => (Math.abs(b.le[2] - z) < Math.abs(a.le[2] - z) ? b : a));
            const x = st.le[0] + st.chord * 0.45, r = Math.min(st.chord * 0.3, 0.9) * p.ky;
            star(g, p.px(x), p.py(view === 'top' ? -z : z), r, lowvis, r * p.kx / p.ky);
          }
        }
      }
      if (view === 'right' || view === 'left') {
        if (fit.nose) noseArt(p, s, fit.nose);
        if (fit.tail) tailArt(p, s, fit.tail);
        tailNumber(p, s, fit);
      }
    });
  }
}
