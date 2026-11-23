// The Fleet, drawn in code on a canvas: every plane from the side (the Flight, the Fleet tray, the end of a Round) and from above (the
// taxi, the airport plot, "Watch it run"), wearing its livery: a body colour, a stripe, a trim colour, a tail art and the airline's
// mark. The same functions draw every view, so the plane at the gate is the plane he flies.
import { MARKS, paintHex, PLANE_SPECS, STRIPES, TAILS, type MarkShape, type PlaneModel, type StripePattern } from '../airport/catalog';
import { prizeById } from '../airport/charter';
import type { Livery } from '../airport/airport';

export interface Look {
  readonly model: PlaneModel;
  readonly base: string; readonly trim: string; readonly stripe: StripePattern;
  readonly tail: { readonly glyph: string; readonly bg: string | null };
  readonly mark: MarkShape;
}
export function lookOf(model: PlaneModel, l: Livery, mark = 'mark:none'): Look {
  const tailItem = TAILS.find(t => t.id === l.tail), prize = tailItem ? null : prizeById(l.tail);
  return {
    model, base: paintHex(l.base), trim: paintHex(l.trim),
    stripe: STRIPES.find(s => s.id === l.stripe)?.pattern ?? 'none',
    tail: tailItem ? { glyph: tailItem.glyph, bg: null } : prize && 'glyph' in prize ? { glyph: prize.glyph, bg: 'bg' in prize ? prize.bg : null } : { glyph: '', bg: null },
    mark: MARKS.find(m => m.id === mark)?.shape ?? 'none',
  };
}

type Ctx = CanvasRenderingContext2D;
const RAINBOW = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1'];
/** A fill for a colour, where "rainbow" is bands along the length. */
function fillFor(ctx: Ctx, hex: string, x0: number, x1: number): string | CanvasGradient {
  if (hex !== 'rainbow') return hex;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  RAINBOW.forEach((c, i) => { g.addColorStop(i / RAINBOW.length, c); g.addColorStop((i + 1) / RAINBOW.length - .001, c); });
  return g;
}
const darker = (hex: string) => (hex === 'rainbow' ? '#444' : shade(hex, -.35));
export function shade(hex: string, k: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const v = parseInt(m[1]!, 16), f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `#${[(v >> 16) & 255, (v >> 8) & 255, v & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Each model's shape from the side, in units where the turboprop is 120 long. */
const SIDE: Record<PlaneModel, { len: number; h: number; nose: 'round' | 'point' | 'blunt'; fin: number; windows: number; prop: boolean; highWing: boolean; deck?: boolean; delta?: boolean; floats?: boolean; rotor?: boolean; tank?: boolean; cargoNose?: boolean }> = {
  twoseater: { len: 70, h: 16, nose: 'round', fin: 18, windows: 1, prop: true, highWing: true },
  duster: { len: 72, h: 15, nose: 'round', fin: 18, windows: 1, prop: true, highWing: false },
  float: { len: 82, h: 17, nose: 'round', fin: 20, windows: 3, prop: true, highWing: true, floats: true },
  heli: { len: 74, h: 26, nose: 'round', fin: 16, windows: 2, prop: false, highWing: false, rotor: true },
  turboprop: { len: 120, h: 20, nose: 'round', fin: 26, windows: 9, prop: false, highWing: true },
  regional: { len: 135, h: 21, nose: 'point', fin: 30, windows: 12, prop: false, highWing: false },
  private: { len: 105, h: 18, nose: 'point', fin: 28, windows: 5, prop: false, highWing: false },
  cargo: { len: 150, h: 30, nose: 'blunt', fin: 36, windows: 2, prop: false, highWing: true, cargoNose: true },
  bomber: { len: 118, h: 24, nose: 'round', fin: 28, windows: 4, prop: false, highWing: true, tank: true },
  jumbo: { len: 175, h: 30, nose: 'round', fin: 42, windows: 20, prop: false, highWing: false, deck: true },
  double: { len: 182, h: 38, nose: 'round', fin: 44, windows: 22, prop: false, highWing: false },
  super: { len: 165, h: 18, nose: 'point', fin: 40, windows: 14, prop: false, highWing: false, delta: true },
};

function fuselagePath(ctx: Ctx, L: number, H: number, nose: 'round' | 'point' | 'blunt', deck: boolean) {
  const x0 = -L / 2, x1 = L / 2, t = -H / 2, b = H / 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, t + 2);
  if (deck) { ctx.lineTo(x1 - L * .45, t); ctx.quadraticCurveTo(x1 - L * .22, t - H * .5, x1 - L * .08, t + H * .1); }
  else ctx.lineTo(x1 - H * .9, t);
  if (nose === 'point') ctx.quadraticCurveTo(x1 + H * .2, t + H * .4, x1 + H * .35, b - H * .25);
  else if (nose === 'blunt') { ctx.quadraticCurveTo(x1, t, x1, t + H * .5); }
  else ctx.quadraticCurveTo(x1 + H * .25, t + H * .1, x1, b - H * .3);
  ctx.quadraticCurveTo(x1 - H * .2, b, x1 - H * .9, b);
  ctx.lineTo(x0 + L * .18, b);
  ctx.quadraticCurveTo(x0 + 2, b - 2, x0, t + H * .25);
  ctx.closePath();
}

function stripeSide(ctx: Ctx, p: StripePattern, L: number, H: number, colour: string, t: number) {
  const x0 = -L / 2, top = -H / 2;
  ctx.fillStyle = colour; ctx.strokeStyle = colour;
  switch (p) {
    case 'none': return;
    case 'cheat': ctx.fillRect(x0, top + H * .45, L * 1.2, H * .14); return;
    case 'twin': ctx.fillRect(x0, top + H * .62, L * 1.2, H * .1); ctx.fillRect(x0, top + H * .78, L * 1.2, H * .1); return;
    case 'belly': ctx.fillRect(x0, top + H * .7, L * 1.2, H * .4); return;
    case 'tailband': ctx.fillRect(x0, top - H, L * .3, H * 3); return;
    case 'racing': ctx.fillRect(x0, top, L * 1.2, H * .12); ctx.fillRect(x0, top + H * .2, L * 1.2, H * .08); return;
    case 'swoosh': ctx.beginPath(); ctx.moveTo(x0, top + H); ctx.quadraticCurveTo(0, top + H * .2, L / 2, top + H * .9); ctx.lineTo(L / 2, top + H * 1.2); ctx.quadraticCurveTo(0, top + H * .6, x0, top + H * 1.3); ctx.fill(); return;
    case 'zigzag': ctx.lineWidth = H * .12; ctx.beginPath(); for (let i = 0; i <= 14; i++) ctx.lineTo(x0 + (L / 14) * i, top + H * (i % 2 ? .55 : .8)); ctx.stroke(); return;
    case 'waves': ctx.lineWidth = H * .14; ctx.beginPath(); for (let i = 0; i <= 40; i++) ctx.lineTo(x0 + (L / 40) * i, top + H * .7 + Math.sin(i * .9 + t) * H * .1); ctx.stroke(); return;
    case 'chequer': { const s = H * .22; for (let i = 0; i < L / s; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ctx.fillRect(x0 + i * s, top + H * .6 + j * s, s, s); return; }
    case 'dots': for (let i = 0; i < L / (H * .5); i++) { ctx.beginPath(); ctx.arc(x0 + H * .3 + i * H * .5, top + H * (i % 2 ? .62 : .82), H * .1, 0, 7); ctx.fill(); } return;
    case 'stars': ctx.font = `${H * .4}px sans-serif`; ctx.textAlign = 'center'; for (let i = 0; i < 6; i++) ctx.fillText('★', x0 + L * (.15 + i * .13), top + H * (.75 - i * .06)); return;
    case 'flames': ctx.beginPath(); ctx.moveTo(L / 2, top + H * .4); for (let i = 0; i < 6; i++) { ctx.lineTo(L / 2 - L * (.08 + i * .07), top + H * (i % 2 ? .25 : .55)); } ctx.lineTo(L * .02, top + H * .8); ctx.lineTo(L / 2, top + H); ctx.fill(); return;
  }
}

export function drawMark(ctx: Ctx, shape: MarkShape, x: number, y: number, r: number, colour: string) {
  if (shape === 'none') return;
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = r * .25; ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineJoin = 'round';
  const star = (rr: number) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? rr * .45 : rr; ctx.lineTo(Math.cos(a) * k, Math.sin(a) * k); } ctx.closePath(); ctx.fill(); };
  switch (shape) {
    case 'ring': ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, 7); ctx.stroke(); break;
    case 'wings': ctx.beginPath(); ctx.moveTo(-r, -r * .2); ctx.lineTo(0, r * .3); ctx.lineTo(r, -r * .2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, r * .2, r * .25, 0, 7); ctx.fill(); break;
    case 'globe': ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, 7); ctx.moveTo(-r * .8, 0); ctx.lineTo(r * .8, 0); ctx.ellipse(0, 0, r * .35, r * .8, 0, 0, 7); ctx.stroke(); break;
    case 'arrow': ctx.beginPath(); ctx.moveTo(-r, r * .3); ctx.lineTo(r * .6, r * .3); ctx.lineTo(r * .6, r * .7); ctx.lineTo(r, 0); ctx.lineTo(r * .6, -r * .7); ctx.lineTo(r * .6, -r * .3); ctx.lineTo(-r, -r * .3); ctx.fill(); break;
    case 'triangle': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * .9, r * .7); ctx.lineTo(-r * .9, r * .7); ctx.closePath(); ctx.fill(); break;
    case 'shield': ctx.beginPath(); ctx.moveTo(-r * .7, -r * .8); ctx.lineTo(r * .7, -r * .8); ctx.lineTo(r * .7, 0); ctx.quadraticCurveTo(r * .6, r * .7, 0, r); ctx.quadraticCurveTo(-r * .6, r * .7, -r * .7, 0); ctx.closePath(); ctx.fill(); break;
    case 'compass': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * .25, 0); ctx.lineTo(0, r); ctx.lineTo(-r * .25, 0); ctx.closePath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * .25); ctx.lineTo(r, 0); ctx.lineTo(0, r * .25); ctx.closePath(); ctx.fill(); break;
    case 'propeller': for (let i = 0; i < 3; i++) { ctx.rotate((Math.PI * 2) / 3); ctx.beginPath(); ctx.ellipse(0, -r * .5, r * .2, r * .5, 0, 0, 7); ctx.fill(); } break;
    case 'swirl': ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * .35, k = (i / 40) * r; ctx.lineTo(Math.cos(a) * k, Math.sin(a) * k); } ctx.stroke(); break;
    case 'diamond': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * .7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * .7, 0); ctx.closePath(); ctx.fill(); break;
    case 'starring': ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, 7); ctx.stroke(); star(r * .55); break;
    case 'bolt': ctx.beginPath(); ctx.moveTo(r * .2, -r); ctx.lineTo(-r * .5, r * .1); ctx.lineTo(0, r * .1); ctx.lineTo(-r * .2, r); ctx.lineTo(r * .5, -r * .1); ctx.lineTo(0, -r * .1); ctx.closePath(); ctx.fill(); break;
  }
  ctx.restore();
}

/** A plane from the side, facing right, centred at (x, y). `t` turns the propellers and rotors; `gear` puts the wheels down. */
export function drawPlaneSide(ctx: Ctx, look: Look, x: number, y: number, scale: number, opts: { t?: number; gear?: boolean; tilt?: number } = {}) {
  const s = SIDE[look.model], L = s.len, H = s.h, t = opts.t ?? 0;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(opts.tilt ?? 0);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ink = '#111', lw = 2.6;
  // far wing (behind)
  ctx.fillStyle = darker(look.trim === '#f4f6fa' ? '#b8c2cc' : look.trim);
  // tail fin
  const fx = -L / 2;
  ctx.beginPath();
  if (look.model === 'heli') { ctx.moveTo(fx - 26, -6); ctx.lineTo(fx + 4, -4); ctx.lineTo(fx + 4, 4); ctx.lineTo(fx - 26, 2); ctx.closePath(); }
  else { ctx.moveTo(fx + 4, -H / 2 + 2); ctx.lineTo(fx - 4, -H / 2 - s.fin); ctx.lineTo(fx + s.fin * .7, -H / 2 - s.fin); ctx.lineTo(fx + s.fin * 1.5, -H / 2 + 2); ctx.closePath(); }
  ctx.fillStyle = look.tail.bg ?? fillFor(ctx, look.base, -L / 2, L / 2); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
  if (look.model === 'heli') { ctx.beginPath(); ctx.arc(fx - 26, -4, 7, 0, 7); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke(); }
  else if (look.tail.glyph) { ctx.font = `${s.fin * .7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(look.tail.glyph, fx + s.fin * .35, -H / 2 - s.fin * .5); }
  else if (look.mark !== 'none') drawMark(ctx, look.mark, fx + s.fin * .35, -H / 2 - s.fin * .5, s.fin * .32, look.trim === look.base ? '#111' : look.trim);
  // floats and skids
  if (s.floats) { ctx.fillStyle = look.trim; ctx.beginPath(); ctx.ellipse(4, H / 2 + 12, L * .38, 5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, H / 2); ctx.lineTo(-12, H / 2 + 8); ctx.moveTo(16, H / 2); ctx.lineTo(18, H / 2 + 8); ctx.stroke(); }
  if (s.rotor) { ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-L * .3, H / 2 + 8); ctx.lineTo(L * .3, H / 2 + 8); ctx.moveTo(-8, H / 2); ctx.lineTo(-10, H / 2 + 8); ctx.moveTo(10, H / 2); ctx.lineTo(12, H / 2 + 8); ctx.stroke(); }
  // gear
  if (opts.gear && !s.floats && !s.rotor) {
    ctx.fillStyle = '#222';
    for (const gx of [L * .3, -L * .1]) { ctx.beginPath(); ctx.moveTo(gx, H / 2 - 2); ctx.lineTo(gx, H / 2 + 6); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(gx, H / 2 + 8, 4.5, 0, 7); ctx.fill(); }
  }
  // the body
  fuselagePath(ctx, L, H, s.nose, !!s.deck);
  ctx.fillStyle = fillFor(ctx, look.base, -L / 2, L / 2); ctx.fill();
  ctx.save(); ctx.clip();
  stripeSide(ctx, look.stripe, L, H, look.trim === look.base ? darker(look.base) : look.trim, t);
  // a darker belly for shape
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-L / 2, H * .2, L * 1.2, H);
  ctx.restore();
  fuselagePath(ctx, L, H, s.nose, !!s.deck); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
  // windows and the cockpit
  ctx.fillStyle = '#9fd8ff';
  const wy = -H / 2 + H * .3, n = s.windows;
  for (let i = 0; i < n; i++) { const wx = -L / 2 + L * .22 + i * ((L * .5) / Math.max(1, n - 1 || 1)); ctx.beginPath(); ctx.arc(n === 1 ? L * .05 : wx, wy, Math.max(2, H * .12), 0, 7); ctx.fill(); }
  if (s.deck) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(L * .12 + i * 9, -H / 2 - 4, 2.2, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(L / 2 - H * .9, -H / 2 + 3); ctx.lineTo(L / 2 - H * .25, -H / 2 + 3 + H * .1); ctx.lineTo(L / 2 - H * .5, -H / 2 + H * .45); ctx.lineTo(L / 2 - H * .95, -H / 2 + H * .45); ctx.closePath();
  ctx.fillStyle = '#2a4a6a'; ctx.fill();
  if (s.rotor) { ctx.beginPath(); ctx.ellipse(L * .2, -2, H * .38, H * .32, 0, 0, 7); ctx.fillStyle = '#9fd8ff'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke(); }
  // the mark on the body, behind the cockpit
  if (look.mark !== 'none' && look.tail.glyph) drawMark(ctx, look.mark, L * .12, H * .12, H * .22, look.trim === look.base ? darker(look.base) : look.trim);
  // near wing
  ctx.fillStyle = look.trim === look.base ? darker(look.base) : look.trim;
  ctx.beginPath();
  if (s.delta) { ctx.moveTo(L * .2, H * .2); ctx.lineTo(-L * .42, H * .35); ctx.lineTo(-L * .25, H * .1); ctx.closePath(); }
  else if (!s.rotor) { const wy2 = s.highWing ? -H / 2 + 2 : H * .18; ctx.moveTo(L * .12, wy2); ctx.lineTo(-L * .22, wy2 + 2); ctx.lineTo(-L * .16, wy2 + 6); ctx.lineTo(L * .1, wy2 + 5); ctx.closePath(); }
  ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
  // engines
  const spec = PLANE_SPECS[look.model];
  if (spec.jet && !s.delta) { ctx.fillStyle = '#c9d1da'; ctx.beginPath(); ctx.ellipse(-L * .02, (s.highWing ? -H / 2 : H * .18) + 9, H * .32, H * .17, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  if (s.delta) { ctx.fillStyle = '#c9d1da'; ctx.fillRect(-L * .3, H * .3, L * .2, 6); ctx.strokeRect(-L * .3, H * .3, L * .2, 6); }
  if (look.model === 'turboprop' || look.model === 'cargo' || look.model === 'bomber') {
    const ex = L * .05, ey = -H / 2 + 6;
    ctx.fillStyle = '#c9d1da'; ctx.beginPath(); ctx.ellipse(ex, ey, 12, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(ex + 13, ey); ctx.scale(1, Math.abs(Math.sin(t * 30)) + .1); ctx.fillStyle = 'rgba(40,40,40,.55)'; ctx.fillRect(-1.5, -14, 3, 28); ctx.restore();
  }
  if (s.tank) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(0, H / 2 + 3, L * .16, 4, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  if (s.prop) { ctx.save(); ctx.translate(L / 2 + 3, 0); ctx.scale(1, Math.abs(Math.sin(t * 30)) + .1); ctx.fillStyle = 'rgba(40,40,40,.6)'; ctx.fillRect(-2, -H * .9, 4, H * 1.8); ctx.restore(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(L / 2 + 2, 0, 3, 0, 7); ctx.fill(); }
  if (s.rotor) { ctx.fillStyle = '#333'; ctx.fillRect(-3, -H / 2 - 8, 6, 8); const w = L * .55 * (Math.abs(Math.cos(t * 12)) * .6 + .4); ctx.fillRect(-w, -H / 2 - 10, w * 2, 3.5); }
  ctx.restore();
}

/** A plane from above, its nose along `heading` (radians, 0 = right). */
export function drawPlaneTop(ctx: Ctx, look: Look, x: number, y: number, heading: number, scale: number, t = 0) {
  const s = SIDE[look.model], L = s.len * .8, W = s.h * .55;
  ctx.save(); ctx.translate(x, y); ctx.rotate(heading); ctx.scale(scale, scale);
  ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
  const wingC = look.trim === look.base ? darker(look.base) : look.trim;
  if (s.rotor) {
    ctx.fillStyle = fillFor(ctx, look.base, -L / 2, L / 2); ctx.beginPath(); ctx.ellipse(4, 0, L * .3, W * .9, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(-L * .55, -2, L * .4, 4);
    ctx.save(); ctx.rotate(t * 14); ctx.fillStyle = 'rgba(30,30,30,.55)'; ctx.fillRect(-L * .55, -2.5, L * 1.1, 5); ctx.fillRect(-2.5, -L * .55, 5, L * 1.1); ctx.restore();
    ctx.restore(); return;
  }
  // wings
  ctx.fillStyle = wingC; ctx.beginPath();
  if (s.delta) { ctx.moveTo(L * .2, 0); ctx.lineTo(-L * .4, L * .32); ctx.lineTo(-L * .4, -L * .32); ctx.closePath(); }
  else { const span = L * .55, sweep = PLANE_SPECS[look.model].jet ? L * .14 : 0; ctx.moveTo(L * .08, 0); ctx.lineTo(L * .08 - sweep - 6, span); ctx.lineTo(-sweep - 6 - 10, span); ctx.lineTo(-10, 0); ctx.lineTo(-sweep - 16, -span); ctx.lineTo(L * .08 - sweep - 6, -span); ctx.closePath(); }
  ctx.fill(); ctx.stroke();
  // tail plane
  ctx.beginPath(); ctx.moveTo(-L * .38, 0); ctx.lineTo(-L * .5, L * .2); ctx.lineTo(-L * .55, L * .2); ctx.lineTo(-L * .5, 0); ctx.lineTo(-L * .55, -L * .2); ctx.lineTo(-L * .5, -L * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
  // engines
  const e = PLANE_SPECS[look.model].engines;
  if (e >= 2 && !s.delta) { ctx.fillStyle = '#c9d1da'; for (const k of e === 4 ? [.25, .45] : [.3]) for (const side of [1, -1]) { ctx.beginPath(); ctx.ellipse(L * .05, side * L * k, 7, 4, 0, 0, 7); ctx.fill(); ctx.stroke(); } }
  // body
  ctx.fillStyle = fillFor(ctx, look.base, -L / 2, L / 2); ctx.beginPath(); ctx.ellipse(0, 0, L / 2, W / 2 + 2, 0, 0, 7); ctx.fill(); ctx.stroke();
  if (look.stripe !== 'none') { ctx.fillStyle = wingC; ctx.fillRect(-L * .42, -1.5, L * .84, 3); }
  ctx.fillStyle = '#2a4a6a'; ctx.beginPath(); ctx.ellipse(L * .36, 0, 5, W * .3 + 1, 0, 0, 7); ctx.fill();
  if (s.prop || look.model === 'turboprop') { ctx.save(); ctx.translate(L / 2 + 2, 0); ctx.fillStyle = 'rgba(40,40,40,.5)'; ctx.fillRect(-1.5, -10 * (Math.abs(Math.sin(t * 30)) + .3), 3, 20 * (Math.abs(Math.sin(t * 30)) + .3)); ctx.restore(); }
  if (s.floats) { ctx.fillStyle = look.trim; for (const side of [1, -1]) { ctx.beginPath(); ctx.ellipse(2, side * W, L * .35, 3, 0, 0, 7); ctx.fill(); ctx.stroke(); } }
  ctx.restore();
}

// ---------- pictures for the DOM ----------

const pics = new Map<string, string>();
/** A side view as an image URL, for buttons and tiles (cached by look). */
export function planePic(look: Look, w = 240, h = 120): string {
  const key = JSON.stringify([look, w, h]);
  const got = pics.get(key);
  if (got) return got;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'), dpr = 2;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);
  const s = SIDE[look.model], k = Math.min((w * .8) / (s.len + 20), (h * .7) / (s.h + s.fin + 20));
  drawPlaneSide(ctx, look, w / 2 + 4, h / 2 + (s.fin * k) / 3, k, { gear: true, t: .3 });
  const url = c.toDataURL('image/png');
  pics.set(key, url);
  return url;
}
