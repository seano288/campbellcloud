// The toy train, drawn in code: one module draws every engine, car and caboose, so the word cars in a question and his own train in
// the Shed are plainly the same wooden toy (the same bodies, wheels, couplers, outlines and paint). Side view (the questions, the
// Shed, Home and the icon) is an SVG string; top view (his Layout and the Delivery) draws the same bodies, paint and loads on a
// canvas (drawTop).
//
// A side-view piece is `w` wide and 100 high: the body between y 18 and 80, wheels at y 84, the rail at y 98. The engine faces left,
// so a train reads left to right like a sentence: engine (the first word), cars, caboose (the end mark).
import { CARS, ENGINES, PAINTS, type CarRow, type EngineRow, type PaintRow } from '../shed/catalogue';

export const O = '#1d1d1f';
export const PIECE_H = 100;
const SW = 4;
let uid = 0;

export type Paint = Pick<PaintRow, 'body' | 'trim'> & { pattern?: PaintRow['pattern'] };
export const paintOf = (id: string): Paint => PAINTS.find(p => p.id === id) ?? PAINTS[0];
export const engineOf = (id: string): EngineRow => ENGINES.find(e => e.id === id) ?? ENGINES[0];
export const carOf = (id: string): CarRow => CARS.find(c => c.id === id) ?? CARS[0];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The pattern a paint lays over a body, clipped to it. */
function pattern(p: Paint, clip: string, x: number, y: number, w: number, h: number): string {
  if (!p.pattern) return '';
  const t = p.trim, inner = (() => {
    switch (p.pattern) {
      case 'stripes': return Array.from({ length: Math.ceil(w / 16) + 4 }, (_, i) => `<path d="M${x + i * 16 - 30} ${y + h} L${x + i * 16} ${y}" stroke="${t}" stroke-width="7"/>`).join('');
      case 'dots': case 'spots': return Array.from({ length: Math.ceil(w / 18) * 3 }, (_, i) => `<circle cx="${x + 9 + (i % Math.ceil(w / 18)) * 18 + (Math.floor(i / Math.ceil(w / 18)) % 2) * 9}" cy="${y + 10 + Math.floor(i / Math.ceil(w / 18)) * 18}" r="${p.pattern === 'dots' ? 4.5 : 6}" fill="${t}"/>`).join('');
      case 'checks': return Array.from({ length: Math.ceil(w / 12) * Math.ceil(h / 12) }, (_, i) => { const cx = i % Math.ceil(w / 12), cy = Math.floor(i / Math.ceil(w / 12)); return (cx + cy) % 2 ? `<rect x="${x + cx * 12}" y="${y + cy * 12}" width="12" height="12" fill="${t}"/>` : ''; }).join('');
      case 'stars': return Array.from({ length: Math.ceil(w / 22) * 2 }, (_, i) => `<circle cx="${x + 8 + (i % Math.ceil(w / 22)) * 22}" cy="${y + 12 + Math.floor(i / Math.ceil(w / 22)) * 24}" r="3" fill="${t}"/>`).join('');
      case 'flames': return Array.from({ length: Math.ceil(w / 26) }, (_, i) => `<path d="M${x + i * 26} ${y + h} q 6 -28 13 -14 q 4 -20 13 0 z" fill="${t}"/>`).join('');
      case 'rainbow': return ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#2f7fd8', '#7a4fd8'].map((c, i) => `<rect x="${x}" y="${y + (i * h) / 6}" width="${w}" height="${h / 6 + .5}" fill="${c}"/>`).join('');
    }
  })();
  return `<g clip-path="url(#${clip})">${inner}</g>`;
}

/** A painted body box with its pattern and outline. */
function body(p: Paint, x: number, y: number, w: number, h: number, r = 8): string {
  const clip = `sx${++uid}`;
  return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${p.body}"/>${pattern(p, clip, x, y, w, h)}`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${O}" stroke-width="${SW}"/>`;
}
const wheel = (cx: number, r = 12) => `<circle cx="${cx}" cy="${96 - r}" r="${r}" fill="#3a3f47" stroke="${O}" stroke-width="${SW}"/><circle cx="${cx}" cy="${96 - r}" r="${r * .35}" fill="#c9d1d9"/>`;
const coupler = (x0: number, x1: number) => `<rect x="${Math.min(x0, x1)}" y="70" width="${Math.abs(x1 - x0)}" height="7" rx="3" fill="#5a4a3a" stroke="${O}" stroke-width="3"/>`;
const chassis = (x: number, w: number) => `<rect x="${x}" y="74" width="${w}" height="8" rx="3" fill="#3a3f47" stroke="${O}" stroke-width="3"/>`;

/** The white plate a word is written on, sized to it. */
export function plate(cx: number, cy: number, text: string, size = 38, dim = false): string {
  const w = Math.max(48, textWidth(text, size) + 22), h = size + 14;
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="9" fill="${dim ? '#f1ece0' : '#fff'}" stroke="${O}" stroke-width="3"/>`
    + `<text x="${cx}" y="${cy + size * .34}" text-anchor="middle" font-family="Andika, Nunito, sans-serif" font-weight="700" font-size="${size}" fill="${O}">${esc(text)}</text>`;
}
/** Roughly how wide a word is in Andika: wide letters, narrow letters. */
export function textWidth(s: string, size: number): number {
  let n = 0;
  for (const ch of s) n += /[mwMW]/.test(ch) ? .86 : /[ilj.!,'I]/.test(ch) ? .3 : /[ftr]/.test(ch) ? .42 : /[A-Z]/.test(ch) ? .68 : .56;
  return n * size;
}
/** How wide a word car (or the engine, or the caboose) must be for its word. */
export const pieceWidth = (role: 'engine' | 'car' | 'caboose', text: string) =>
  role === 'caboose' ? 108 : role === 'engine' ? Math.max(170, textWidth(text, 38) + 112) : Math.max(110, textWidth(text, 38) + 46);

// ---------- engines ----------

/** An engine, facing left, `w` wide. `word`: a word on its side (in a question). */
export function engineSvg(e: Pick<EngineRow, 'kind'> & Partial<EngineRow>, p: Paint, w = 170, word?: string, dim = false): string {
  const trim = e.trim ?? p.trim, big = !!e.big;
  const parts: string[] = [coupler(w - 10, w + 2)];
  const cab = Math.min(70, w * .36), cabX = w - cab - 6;
  if (e.kind === 'tank' || e.kind === 'steam') {
    const by = big ? 30 : 34;
    // boiler and smokebox, the chimney at the front, a dome, the cab at the back
    parts.push(`<rect x="${big ? 10 : 18}" y="${by - 26}" width="16" height="${big ? 28 : 24}" rx="3" fill="${O}"/><rect x="${big ? 6 : 14}" y="${by - 30}" width="24" height="8" rx="3" fill="${O}"/>`);
    parts.push(`<path d="M${w * .42} ${by + 2} q 9 -18 18 0 z" fill="${trim}" stroke="${O}" stroke-width="3"/>`);
    parts.push(body(p, 6, by, cabX - 2, 42, 14));
    parts.push(body(p, cabX, 14, cab, 64, 8));
    parts.push(`<rect x="${cabX + 10}" y="22" width="${cab - 20}" height="18" rx="4" fill="#bfe3ff" stroke="${O}" stroke-width="3"/><rect x="${cabX - 6}" y="10" width="${cab + 12}" height="9" rx="4" fill="${trim}" stroke="${O}" stroke-width="3"/>`);
    parts.push(`<rect x="2" y="${by + 6}" width="8" height="30" rx="3" fill="${trim}" stroke="${O}" stroke-width="3"/>`);
    if (big || e.plow) parts.push(`<path d="M6 76 L-10 90 L22 90 Z" fill="${trim}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`);
    parts.push(chassis(6, w - 12));
    const n = big ? 3 : Math.max(2, Math.floor(w / 70));
    for (let i = 0; i < n; i++) parts.push(wheel(26 + i * ((w - 52) / Math.max(1, n - 1)), big ? 14 : 12));
  } else if (e.kind === 'shunter' || e.kind === 'diesel') {
    parts.push(body(p, 8, 34, cabX, 42, 8));
    parts.push(body(p, cabX, 14, cab, 62, 8));
    parts.push(`<rect x="${cabX + 9}" y="22" width="${cab - 18}" height="18" rx="4" fill="#bfe3ff" stroke="${O}" stroke-width="3"/>`);
    parts.push(`<rect x="12" y="40" width="${cabX - 16}" height="6" rx="2" fill="${trim}"/><rect x="12" y="62" width="${cabX - 16}" height="6" rx="2" fill="${trim}"/>`);
    parts.push(`<circle cx="14" cy="44" r="5" fill="#ffd23f" stroke="${O}" stroke-width="2"/>`);
    if (e.plow) parts.push(`<path d="M10 54 L-12 90 L30 90 Z" fill="#ffd23f" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`);
    parts.push(chassis(6, w - 12));
    parts.push(wheel(30), wheel(58), wheel(w - 58), wheel(w - 30));
  } else if (e.kind === 'electric' || e.kind === 'tram') {
    parts.push(`<path d="M${w * .3} 14 L${w * .42} 2 L${w * .56} 14" fill="none" stroke="${O}" stroke-width="4"/><rect x="${w * .38}" y="0" width="${w * .12}" height="4" fill="${O}"/>`);
    parts.push(body(p, 6, 14, w - 12, 62, e.kind === 'tram' ? 16 : 10));
    const wins = Math.max(2, Math.floor((w - 30) / 40));
    for (let i = 0; i < wins; i++) parts.push(`<rect x="${14 + i * ((w - 28) / wins)}" y="22" width="${(w - 28) / wins - 8}" height="${word ? 14 : 20}" rx="4" fill="#bfe3ff" stroke="${O}" stroke-width="3"/>`);
    parts.push(`<rect x="10" y="${word ? 40 : 50}" width="${w - 20}" height="5" fill="${trim}"/>`);
    parts.push(chassis(6, w - 12));
    parts.push(wheel(28), wheel(52), wheel(w - 52), wheel(w - 28));
  } else {
    // the bullet train: a long smooth nose
    parts.push(`<path d="M${w - 6} 16 L${w * .45} 16 Q 4 22 4 70 L${w - 6} 76 Z" fill="${p.body}" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>`);
    parts.push(`<path d="M${w * .5} 22 L${w * .3} 24 Q 18 30 14 44 L${w * .5} 44 Z" fill="#bfe3ff" stroke="${O}" stroke-width="3"/>`);
    parts.push(`<path d="M8 58 L${w - 6} 58" stroke="${trim}" stroke-width="7"/>`);
    parts.push(chassis(10, w - 16));
    parts.push(wheel(40), wheel(64), wheel(w - 52), wheel(w - 28));
  }
  if (word !== undefined) parts.push(plate(e.kind === 'tank' || e.kind === 'steam' ? (cabX + 8) / 2 + 4 : e.kind === 'bullet' ? w * .62 : (cabX + 8) / 2, 56, word, 34, dim));
  return parts.join('');
}

// ---------- cars ----------

/** A load riding on a car: coal, rocks, blocks, a crane, or an emoji. */
function load(l: string | undefined, x: number, w: number, top: number): string {
  if (!l) return '';
  if (l === 'coal' || l === 'rocks') {
    const c = l === 'coal' ? '#2a2d33' : '#9aa3ad';
    return Array.from({ length: Math.floor(w / 18) }, (_, i) => `<circle cx="${x + 12 + i * 18}" cy="${top}" r="11" fill="${c}" stroke="${O}" stroke-width="3"/>`).join('');
  }
  if (l === 'blocks') return ['#e63946', '#2f7fd8', '#ffd23f'].map((c, i) => `<rect x="${x + 10 + i * ((w - 20) / 3)}" y="${top - 26}" width="${(w - 20) / 3 - 4}" height="${(w - 20) / 3 - 4}" fill="${c}" stroke="${O}" stroke-width="3"/>`).join('');
  if (l === 'crane') return `<path d="M${x + w * .3} ${top + 4} L${x + w * .3} ${top - 34} L${x + w * .9} ${top - 22}" fill="none" stroke="#ffd23f" stroke-width="8"/><path d="M${x + w * .3} ${top + 4} L${x + w * .3} ${top - 34} L${x + w * .9} ${top - 22}" fill="none" stroke="${O}" stroke-width="2"/><path d="M${x + w * .85} ${top - 22} v 16" stroke="${O}" stroke-width="3"/>`;
  return `<text x="${x + w / 2}" y="${top + 8}" text-anchor="middle" font-size="40" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${l}</text>`;
}

/** A car, `w` wide. With a `word` it's a word car: the word on its side, as in the questions. */
export function carSvg(c: Pick<CarRow, 'shape'> & Partial<CarRow>, p: Paint, w = 130, word?: string, dim = false): string {
  const own: Paint = c.color ? { body: c.color, trim: p.trim } : p, parts: string[] = [coupler(-2, 10), coupler(w - 10, w + 2)];
  const sideY = word !== undefined ? 50 : 50;
  switch (c.shape) {
    case 'open': parts.push(load(c.load, 10, w - 20, 36), body(own, 6, 34, w - 12, 44, 6)); break;
    case 'hopper': parts.push(load(c.load, 10, w - 20, 34), `<path d="M6 32 L${w - 6} 32 L${w - 22} 78 L22 78 Z" fill="${own.body}" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>`); break;
    case 'flat': parts.push(load(c.load, 8, w - 16, 54), body(own, 4, 58, w - 8, 18, 4)); break;
    case 'tank': parts.push(`<rect x="8" y="26" width="${w - 16}" height="46" rx="23" fill="${own.body}" stroke="${O}" stroke-width="${SW}"/><rect x="${w / 2 - 8}" y="16" width="16" height="12" rx="3" fill="${own.trim}" stroke="${O}" stroke-width="3"/>`); if (c.load) parts.push(load(c.load, w * .25, w * .5, 52)); break;
    case 'box': parts.push(body(own, 6, 16, w - 12, 62, 6), `<rect x="${w / 2 - 20}" y="24" width="40" height="46" rx="3" fill="none" stroke="${O}" stroke-width="3"/>`); if (c.load) parts.push(load(c.load, w / 2 - 20, 40, 52)); break;
    case 'coach': parts.push(`<rect x="2" y="10" width="${w - 4}" height="12" rx="6" fill="${own.trim}" stroke="${O}" stroke-width="3"/>`, body(own, 6, 18, w - 12, 60, 8));
      for (let i = 0; i < Math.max(2, Math.floor((w - 20) / 34)); i++) parts.push(`<rect x="${14 + i * 34}" y="26" width="24" height="20" rx="4" fill="#bfe3ff" stroke="${O}" stroke-width="3"/>`);
      if (c.load) parts.push(load(c.load, w - 46, 40, 66).replace('font-size="40"', 'font-size="22"')); break;
    case 'caboose': parts.push(`<rect x="${w * .3}" y="2" width="${w * .4}" height="18" rx="4" fill="${own.body}" stroke="${O}" stroke-width="3"/><rect x="${w * .36}" y="6" width="${w * .28}" height="9" rx="2" fill="#bfe3ff" stroke="${O}" stroke-width="2"/>`, body(own, 6, 18, w - 12, 60, 8), `<rect x="0" y="12" width="${w}" height="9" rx="4" fill="${own.trim}" stroke="${O}" stroke-width="3"/>`); break;
  }
  parts.push(chassis(6, w - 12), wheel(26), wheel(w - 26));
  if (word !== undefined) parts.push(plate(w / 2, sideY, word, 38, dim));
  return parts.join('');
}

/** The caboose that carries a sentence's end mark: the mark big on a round sign, or the sign empty when it's missing. */
export function markCabooseSvg(p: Paint, w: number, mark: string | null, dim = false): string {
  const parts = [carSvg({ shape: 'caboose' }, p, w)];
  parts.push(`<circle cx="${w / 2}" cy="50" r="24" fill="${dim ? '#f1ece0' : '#fff'}" stroke="${O}" stroke-width="3" ${mark ? '' : 'stroke-dasharray="6 5"'}/>`);
  if (mark) parts.push(`<text x="${w / 2}" y="${mark === '.' ? 58 : 64}" text-anchor="middle" font-family="Andika, Nunito, sans-serif" font-weight="700" font-size="${mark === '.' ? 64 : 48}" fill="${O}">${esc(mark)}</text>`);
  return parts.join('');
}

/** A whole SVG for one piece. */
export const pieceSvg = (inner: string, w: number, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -4 ${w + 28} ${PIECE_H + 8}" ${extra}>${inner}</svg>`;

/** His whole train, side on, as one row: the engine then each car. */
export function trainSvg(t: { engine: string; cars: readonly string[]; paint: string }, opts: { gap?: number; max?: number } = {}): { svg: string; w: number } {
  const p = paintOf(t.paint), gap = opts.gap ?? 4, e = engineOf(t.engine), ew = e.kind === 'bullet' ? 200 : e.big ? 190 : 160;
  let x = 0;
  const parts = [`<g>${engineSvg(e, p, ew)}</g>`];
  x += ew + gap;
  for (const id of t.cars.slice(0, opts.max ?? 99)) { parts.push(`<g transform="translate(${x} 0)">${carSvg(carOf(id), p, 128)}</g>`); x += 128 + gap; }
  const w = x - gap;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -6 ${w + 32} ${PIECE_H + 12}"><path d="M-16 98 H${w + 16}" stroke="${O}" stroke-width="5"/>${parts.join('')}</svg>`, w };
}

// ---------- top view, for the Layout and the Delivery ----------

/** Draws one piece of the train from above at the origin, facing +x, `len` long. The same paint, outline and loads as the side view. */
export function drawTop(c: CanvasRenderingContext2D, what: { engine: EngineRow } | { car: CarRow }, p: Paint, len: number, cargo?: string) {
  const w = len * .58, r = w * .28;
  const round = (x: number, y: number, ww: number, hh: number, rr: number) => roundRect(c, x, y, ww, hh, rr);
  c.lineWidth = len * .07;
  c.strokeStyle = O;
  if ('engine' in what) {
    const e = what.engine;
    c.fillStyle = p.body;
    if (e.kind === 'bullet') { c.beginPath(); c.moveTo(-len / 2, -w / 2); c.lineTo(len * .1, -w / 2); c.quadraticCurveTo(len / 2, -w / 2, len / 2, 0); c.quadraticCurveTo(len / 2, w / 2, len * .1, w / 2); c.lineTo(-len / 2, w / 2); c.closePath(); }
    else round(-len / 2, -w / 2, len, w, r);
    c.fill(); c.stroke();
    // the cab at the back, the chimney at the front
    c.fillStyle = e.trim ?? p.trim;
    round(-len / 2 + len * .06, -w / 2 + w * .12, len * .32, w * .76, r * .6); c.fill(); c.stroke();
    if (e.kind === 'tank' || e.kind === 'steam') { c.fillStyle = O; c.beginPath(); c.arc(len * .3, 0, w * .2, 0, Math.PI * 2); c.fill(); }
    else { c.fillStyle = '#bfe3ff'; round(len * .22, -w * .32, len * .16, w * .64, 3); c.fill(); c.stroke(); }
  } else {
    const car = what.car, own = car.color ?? p.body;
    c.fillStyle = car.shape === 'flat' ? '#7a5a3a' : own;
    round(-len / 2, -w / 2, len, w, car.shape === 'tank' ? w / 2 : r * .6); c.fill(); c.stroke();
    if (car.shape === 'open' || car.shape === 'hopper') { c.fillStyle = car.load === 'coal' ? '#2a2d33' : car.load === 'rocks' ? '#9aa3ad' : '#00000033'; round(-len * .4, -w * .32, len * .8, w * .64, 4); c.fill(); }
    if (car.shape === 'caboose') { c.fillStyle = p.trim; round(-len * .15, -w * .3, len * .3, w * .6, 3); c.fill(); c.stroke(); }
    const show = cargo ?? (car.load && car.load.length <= 2 ? car.load : car.load && /\p{Extended_Pictographic}/u.test(car.load) ? car.load : undefined);
    // emoji at a sensible font size: drawn a hundred times bigger and scaled down, as tiny font sizes don't draw everywhere
    if (show) { c.save(); c.rotate(Math.PI / 2); c.scale(.01, .01); c.font = `${w * 80}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(show, 0, 0); c.restore(); }
  }
}

/** A rounded rectangle path (by hand: older iPad Safari has no roundRect). */
export function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + k, y);
  c.arcTo(x + w, y, x + w, y + h, k);
  c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k);
  c.arcTo(x, y, x + w, y, k);
  c.closePath();
}
