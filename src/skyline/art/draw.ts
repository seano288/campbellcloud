// Everything in the City drawn in code, on a 2D canvas, from its parts: walls, a floor at a time of windows in rows, a roof, a sign.
// The City is seen from above and a little to the south, so every building shows its roof and its front, and a tower with more
// floors stands taller: his skyline is made of arrays he can count. The same drawing makes the side view (the Skyline) and the
// pictures in the questions, so the building he bought is the one he counts.
//
// Buildings are drawn once into a Block's own image (city/paint.ts) and only redrawn when that Block changes, so the City and the
// Job draw a few images a frame, not thousands of windows.
import type { Look, RoofStyle, Special, Vehicle, WindowStyle } from '../city/catalog';

export const O = '#14161b';
export const FLOOR_PX = 9, GROUND_PX = 8;
/** How tall a building's front is, in world units. */
export const faceHeight = (floors: number) => (floors <= 0 ? 0 : GROUND_PX + floors * FLOOR_PX);
type C = CanvasRenderingContext2D;

export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `#${((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1)}`;
}
const rand = (seed: number) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function box(c: C, x: number, y: number, w: number, h: number, fill: string, line = 2) {
  c.fillStyle = fill; c.fillRect(x, y, w, h);
  if (line) { c.lineWidth = line; c.strokeStyle = O; c.strokeRect(x, y, w, h); }
}
export function emoji(c: C, e: string, x: number, y: number, size: number) {
  c.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, x, y);
}

/** The windows of one floor: `cols` of them across a front `w` wide. Lit at night, by a seed so the same ones stay lit. */
export function windowRow(c: C, style: WindowStyle, x: number, y: number, w: number, h: number, cols: number, night: boolean, seed: number, trim: string) {
  const r = rand(seed), gap = w / cols, ww = Math.max(4, gap * (style === 'wide' || style === 'band' ? .8 : style === 'tall' ? .45 : .55)), wh = h * (style === 'tall' ? .8 : .62);
  if (style === 'band') {
    c.fillStyle = night ? '#ffe9a0' : '#a8dcff'; c.fillRect(x + 2, y + h * .2, w - 4, h * .6);
    c.strokeStyle = O; c.lineWidth = 1; c.strokeRect(x + 2, y + h * .2, w - 4, h * .6);
    return;
  }
  for (let i = 0; i < cols; i++) {
    const cx = x + gap * (i + .5), cy = y + h / 2, lit = night ? r() < .72 : false;
    c.fillStyle = night ? (lit ? '#ffe27a' : '#2b3550') : '#a8dcff';
    c.strokeStyle = O; c.lineWidth = 1.2;
    c.beginPath();
    if (style === 'round' || style === 'porthole') c.arc(cx, cy, Math.min(ww, wh) / 2, 0, Math.PI * 2);
    else if (style === 'arched') { c.moveTo(cx - ww / 2, cy + wh / 2); c.lineTo(cx - ww / 2, cy - wh / 4); c.arc(cx, cy - wh / 4, ww / 2, Math.PI, 0); c.lineTo(cx + ww / 2, cy + wh / 2); c.closePath(); }
    else if (style === 'diamond') { c.moveTo(cx, cy - wh / 2); c.lineTo(cx + ww / 2, cy); c.lineTo(cx, cy + wh / 2); c.lineTo(cx - ww / 2, cy); c.closePath(); }
    else if (style === 'star') { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? wh * .22 : wh * .5; c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } c.closePath(); }
    else c.rect(cx - ww / 2, cy - wh / 2, ww, wh);
    c.fill(); c.stroke();
    if (style === 'shutter') { c.fillStyle = trim; c.fillRect(cx - ww / 2 - 3, cy - wh / 2, 3, wh); c.fillRect(cx + ww / 2, cy - wh / 2, 3, wh); }
    if (style === 'lattice' || style === 'grid') { c.beginPath(); c.moveTo(cx, cy - wh / 2); c.lineTo(cx, cy + wh / 2); c.moveTo(cx - ww / 2, cy); c.lineTo(cx + ww / 2, cy); c.lineWidth = .8; c.stroke(); }
  }
}

/** Columns of windows a front this wide holds. */
export const colsFor = (w: number) => Math.max(1, Math.floor((w - 6) / 15));

function roofTop(c: C, style: RoofStyle, x: number, y: number, w: number, h: number, wall: string, trim: string) {
  const top = shade(wall, -.25);
  switch (style) {
    case 'peak': {
      c.fillStyle = shade(trim, -.05); c.fillRect(x, y, w, h / 2); c.fillStyle = shade(trim, -.3); c.fillRect(x, y + h / 2, w, h / 2);
      c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
      return;
    }
    case 'garden': box(c, x, y, w, h, '#6cbf4a'); emoji(c, '🌳', x + w * .3, y + h * .45, Math.min(18, h * .7)); emoji(c, '🌼', x + w * .72, y + h * .55, Math.min(12, h * .5)); return;
    case 'solar': box(c, x, y, w, h, '#2b3550'); c.strokeStyle = '#7fb6ff'; c.lineWidth = 1; for (let i = x + 6; i < x + w - 2; i += 8) { c.beginPath(); c.moveTo(i, y + 3); c.lineTo(i, y + h - 3); c.stroke(); } return;
    case 'pool': box(c, x, y, w, h, '#e9e2d0'); box(c, x + w * .18, y + h * .2, w * .64, h * .6, '#5ec8f0', 1.5); return;
    case 'helipad': box(c, x, y, w, h, '#4a4f5c'); c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) * .36, 0, Math.PI * 2); c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff'; c.font = `900 ${Math.min(w, h) * .4}px Nunito,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', x + w / 2, y + h / 2 + 1); return;
    case 'sawtooth': box(c, x, y, w, h, top); c.fillStyle = shade(top, -.25); for (let i = x; i < x + w - 4; i += 12) c.fillRect(i, y, 6, h); c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(x, y, w, h); return;
    case 'mansard': box(c, x, y, w, h, '#4a4f5c'); box(c, x + 4, y + 3, w - 8, h - 6, top, 1); return;
    default: box(c, x, y, w, h, top);
      if (style === 'flat' || style === 'antenna') { box(c, x + w * .62, y + h * .25, Math.min(10, w * .2), Math.min(8, h * .4), '#c3cad3', 1.5); }
  }
}

/** Things that stick up above a roof: a spire, a dome, an aerial, the flag on his tallest tower. */
function roofTopper(c: C, style: RoofStyle, x: number, y: number, w: number, h: number, trim: string) {
  const cx = x + w / 2, cy = y + h / 2;
  c.strokeStyle = O; c.lineWidth = 2;
  if (style === 'spire') { c.fillStyle = trim; c.beginPath(); c.moveTo(cx - w * .25, cy); c.lineTo(cx, cy - 34); c.lineTo(cx + w * .25, cy); c.closePath(); c.fill(); c.stroke(); }
  if (style === 'dome' || style === 'onion') {
    c.fillStyle = style === 'onion' ? '#e85d9a' : shade(trim, .1); c.beginPath();
    if (style === 'onion') { c.moveTo(cx - w * .22, cy); c.quadraticCurveTo(cx - w * .3, cy - 16, cx, cy - 26); c.quadraticCurveTo(cx + w * .3, cy - 16, cx + w * .22, cy); c.closePath(); }
    else c.arc(cx, cy, Math.min(w, h * 1.6) * .32, Math.PI, 0);
    c.fill(); c.stroke();
  }
  if (style === 'antenna') { c.beginPath(); c.moveTo(cx - w * .2, cy); c.lineTo(cx - w * .2, cy - 26); c.stroke(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(cx - w * .2, cy - 27, 3, 0, Math.PI * 2); c.fill(); }
  if (style === 'pagoda') { c.fillStyle = '#d62828'; c.beginPath(); c.moveTo(x - 4, cy + 2); c.lineTo(cx, cy - 16); c.lineTo(x + w + 4, cy + 2); c.closePath(); c.fill(); c.stroke(); }
  if (style === 'crown') { c.fillStyle = '#e0b12f'; for (let i = 0; i < 4; i++) { const px = x + 3 + i * (w - 6) / 3.2; c.fillRect(px, y - 8, (w - 6) / 7, 9); c.strokeRect(px, y - 8, (w - 6) / 7, 9); } }
}

export interface DrawOpts { night: boolean; seed: number; flag?: boolean; front?: boolean }

/**
 * A building on its footprint (x, y, w, d: the ground it stands on). Its front rises up the screen from the footprint's south edge,
 * one row of windows per floor, and the roof sits on top. With `front`, only the front is drawn (the Skyline and the questions).
 */
export function drawBuilding(c: C, look: Look, floors: number, x: number, y: number, w: number, d: number, o: DrawOpts) {
  if (look.special) { drawSpecial(c, look.special, look, floors, x, y, w, d, o); return; }
  const H = faceHeight(floors), roofD = o.front ? Math.min(10, d * .25) : d * .62, baseY = y + d;
  const wall = o.night ? shade(look.wall, -.45) : look.wall;
  // shadow on the ground behind it
  if (!o.front) { c.fillStyle = '#00000026'; c.fillRect(x + 6, y + 4, w, d); }
  // the front
  const fy = baseY - H;
  box(c, x, fy, w, H, wall, 2.5);
  c.fillStyle = o.night ? shade(look.trim, -.4) : look.trim; c.fillRect(x, baseY - GROUND_PX, w, 3);
  const cols = colsFor(w), r = rand(o.seed);
  for (let f = 0; f < floors; f++) windowRow(c, look.window, x + 2, fy + f * FLOOR_PX + 1, w - 4, FLOOR_PX, cols, o.night, Math.floor(r() * 1e9), look.trim);
  // the door
  c.fillStyle = shade(look.trim, -.2); c.fillRect(x + w / 2 - 4, baseY - GROUND_PX + 2, 8, GROUND_PX - 2);
  if (look.sign) { box(c, x + w / 2 - 11, fy + Math.min(H - 20, 2), 22, 16, '#fff', 1.5); emoji(c, look.sign, x + w / 2, fy + Math.min(H - 20, 2) + 8.5, 12); }
  // the roof
  roofTop(c, look.roof, x, fy - roofD, w, roofD, look.wall, look.trim);
  roofTopper(c, look.roof, x, fy - roofD, w, roofD, look.trim);
  if (o.flag) {
    const px = x + w - 6, py = fy - roofD + 4;
    c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 30); c.stroke();
    c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(px, py - 30); c.lineTo(px + 18, py - 24); c.lineTo(px, py - 18); c.closePath(); c.fill(); c.stroke();
  }
}

/** The places that aren't boxes with windows. */
function drawSpecial(c: C, sp: Special, look: Look, floors: number, x: number, y: number, w: number, d: number, o: DrawOpts) {
  const cx = x + w / 2, baseY = y + d, night = o.night, wall = night ? shade(look.wall, -.4) : look.wall, trim = look.trim;
  c.lineJoin = 'round';
  const ground = (fill: string) => { if (!o.front) box(c, x, y, w, d, night ? shade(fill, -.4) : fill, 2); };
  switch (sp) {
    case 'park': ground('#7cc35a'); c.strokeStyle = '#e8d6a8'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 4, baseY - 6); c.quadraticCurveTo(cx, y + d * .3, x + w - 4, y + 8); c.stroke();
      for (const [fx, fy, e] of [[.25, .3, '🌳'], [.7, .65, '🌳'], [.75, .28, '🌲'], [.3, .75, '🌷'], [.5, .5, '⛲']] as const) emoji(c, e, x + w * fx, y + d * fy, 22); return;
    case 'pond': ground('#8fd16a'); c.fillStyle = night ? '#1e4f7a' : '#4fb3ea'; c.beginPath(); c.ellipse(cx, y + d / 2, w * .38, d * .32, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke(); if (look.sign) emoji(c, look.sign, cx + 6, y + d / 2, 16); return;
    case 'carpark': ground('#9aa3ad'); { const rows = 2, cols = 5, cw = (w - 12) / cols, ch = (d - 12) / rows, colours = ['#e63946', '#4aa3ec', '#ffd23f', '#2bb673', '#f6f6f6'];
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const px = x + 6 + j * cw, py = y + 6 + i * ch; c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(px, py, cw, ch); if ((i * 7 + j * 3 + o.seed) % 4 !== 0) { rr(c, px + 4, py + 3, cw - 8, ch - 6, 3); c.fillStyle = colours[(i + j * 2) % 5]!; c.fill(); c.strokeStyle = O; c.stroke(); } } }
      return;
    case 'bridge': ground('#7cc35a'); c.fillStyle = night ? '#1e4f7a' : '#4fb3ea'; c.fillRect(x, y + d * .2, w, d * .6); c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(x, y + d * .2, w, d * .6);
      c.fillStyle = trim; c.beginPath(); c.moveTo(x + 4, y + d * .8); c.quadraticCurveTo(cx, y - 10, x + w - 4, y + d * .8); c.lineTo(x + w - 14, y + d * .8); c.quadraticCurveTo(cx, y + 8, x + 14, y + d * .8); c.closePath(); c.fill(); c.stroke(); return;
    case 'pier': ground('#4fb3ea'); box(c, x + w * .35, y - 4, w * .3, d + 2, '#a9785a'); if (look.sign) emoji(c, look.sign, cx, y + d * .35, 26); return;
    case 'golf': ground('#7cc35a'); for (const [fx, fy] of [[.2, .3], [.5, .7], [.8, .35]] as const) { c.fillStyle = '#9be37a'; c.beginPath(); c.arc(x + w * fx, y + d * fy, 12, 0, Math.PI * 2); c.fill(); emoji(c, '⛳', x + w * fx, y + d * fy - 6, 14); } return;
    case 'farm': ground('#c9a86a'); c.strokeStyle = '#8a6a3a'; c.lineWidth = 2; for (let i = y + 8; i < baseY - 4; i += 9) { c.beginPath(); c.moveTo(x + w * .5, i); c.lineTo(x + w - 6, i); c.stroke(); }
      drawBuilding(c, { ...look, special: undefined, floors: 2, roof: 'peak', window: 'shutter' }, 2, x + 6, y + d * .35, w * .42, d * .6, o); emoji(c, '🐄', x + w * .75, y + d * .7, 18); return;
    case 'pool': ground('#e9e2d0'); c.fillStyle = night ? '#1e4f7a' : '#5ec8f0'; rr(c, x + 8, y + 10, w * .55, d - 20, 10); c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#e85d9a'; c.lineWidth = 7; c.beginPath(); c.moveTo(x + w - 14, y + 10); c.bezierCurveTo(x + w, y + d * .6, x + w * .5, y + d * .3, x + w * .5, baseY - 18); c.stroke(); return;
    case 'stadium': {
      ground('#7cc35a'); const H = faceHeight(floors);
      c.fillStyle = wall; c.beginPath(); c.ellipse(cx, baseY - d * .45 - H * .4, w * .48, d * .45, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = O; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = night ? '#3f7a3a' : '#5cb85c'; c.beginPath(); c.ellipse(cx, baseY - d * .45 - H * .4, w * .32, d * .27, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, baseY - d * .72 - H * .4); c.lineTo(cx, baseY - d * .18 - H * .4); c.stroke();
      if (night) for (const fx of [-.45, .45]) { c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(cx + w * fx, y - H * .4, 5, 0, Math.PI * 2); c.fill(); }
      return;
    }
    case 'ferris': {
      ground('#f0dc9f'); const R = Math.min(w, d * 2) * .42, hy = baseY - 10 - R;
      c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - R * .6, baseY - 4); c.lineTo(cx, hy); c.lineTo(cx + R * .6, baseY - 4); c.stroke();
      c.strokeStyle = trim; c.lineWidth = 4; c.beginPath(); c.arc(cx, hy, R, 0, Math.PI * 2); c.stroke();
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + o.seed * .01; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, hy); c.lineTo(cx + Math.cos(a) * R, hy + Math.sin(a) * R); c.stroke();
        c.fillStyle = ['#e63946', '#4aa3ec', '#ffd23f', '#2bb673'][k % 4]!; c.beginPath(); c.arc(cx + Math.cos(a) * R, hy + Math.sin(a) * R, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
      return;
    }
    case 'coaster': {
      ground('#f0dc9f'); c.strokeStyle = trim; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 4, baseY - 8);
      c.bezierCurveTo(x + w * .2, y - 50, x + w * .4, y - 50, x + w * .5, baseY - 20); c.bezierCurveTo(x + w * .6, y + 10, x + w * .7, y - 30, x + w * .85, y - 20); c.lineTo(x + w - 4, baseY - 8); c.stroke();
      c.strokeStyle = O; c.lineWidth = 1.5; for (let i = 1; i < 8; i++) { const px = x + (w * i) / 8; c.beginPath(); c.moveTo(px, baseY - 4); c.lineTo(px, y - 10 - Math.sin(i) * 20); c.stroke(); }
      emoji(c, '🎢', cx, baseY - 14, 18); return;
    }
    case 'castle': {
      ground('#8fbf6a'); const H = faceHeight(floors), fy = baseY - H;
      box(c, x + 10, fy + 10, w - 20, H - 10, wall, 2.5);
      for (const tx of [x + 2, x + w - 22]) { box(c, tx, fy - 16, 20, H + 16, shade(wall, -.1), 2.5); c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(tx - 2, fy - 16); c.lineTo(tx + 10, fy - 38); c.lineTo(tx + 22, fy - 16); c.closePath(); c.fill(); c.stroke(); }
      for (let i = x + 14; i < x + w - 20; i += 12) box(c, i, fy + 2, 7, 8, wall, 1.5);
      c.fillStyle = '#5a3e2b'; c.beginPath(); c.arc(cx, baseY, 10, Math.PI, 0); c.fill(); c.stroke();
      windowRow(c, 'arched', x + 24, fy + 20, w - 48, FLOOR_PX + 2, 4, night, o.seed, trim); return;
    }
    case 'clock': case 'needle': case 'lighthouse': case 'mast': case 'water-tower': case 'crane': case 'windmill': case 'observatory': {
      const H = faceHeight(floors), tw = sp === 'mast' || sp === 'needle' ? 14 : Math.min(w * .5, 30), tx = cx - tw / 2, fy = baseY - H;
      if (sp === 'water-tower') {
        c.strokeStyle = O; c.lineWidth = 3; for (const lx of [-1, 1]) { c.beginPath(); c.moveTo(cx + lx * 14, baseY - 2); c.lineTo(cx + lx * 6, fy + 18); c.stroke(); }
        c.fillStyle = wall; rr(c, cx - 18, fy - 4, 36, 26, 8); c.fill(); c.lineWidth = 2.5; c.stroke(); return;
      }
      if (sp === 'crane') {
        c.strokeStyle = O; c.fillStyle = '#ffd23f'; c.lineWidth = 2; c.fillRect(cx - 5, fy, 10, H); c.strokeRect(cx - 5, fy, 10, H);
        c.fillRect(cx - 40, fy - 6, 70, 8); c.strokeRect(cx - 40, fy - 6, 70, 8); c.beginPath(); c.moveTo(cx - 34, fy + 2); c.lineTo(cx - 34, fy + H * .5); c.stroke(); box(c, cx - 42, fy + H * .5, 16, 10, '#4aa3ec', 1.5); return;
      }
      if (sp === 'mast') {
        c.strokeStyle = O; c.lineWidth = 2;
        for (let i = 0; i < floors; i++) { c.fillStyle = i % 2 ? '#fff' : '#e63946'; c.fillRect(tx, fy + i * FLOOR_PX, tw, FLOOR_PX); }
        c.strokeRect(tx, fy, tw, H); c.fillStyle = night ? '#ff4d4d' : '#e63946'; c.beginPath(); c.arc(cx, fy - 4, 4, 0, Math.PI * 2); c.fill(); return;
      }
      box(c, tx, fy, tw, H, sp === 'lighthouse' ? '#fff' : wall, 2.5);
      if (sp === 'lighthouse') for (let i = 1; i < floors; i += 2) { c.fillStyle = '#e63946'; c.fillRect(tx, fy + i * FLOOR_PX, tw, FLOOR_PX); }
      else for (let f = 0; f < floors; f++) windowRow(c, look.window, tx + 2, fy + f * FLOOR_PX + 1, tw - 4, FLOOR_PX, 1, night, o.seed + f, trim);
      c.strokeStyle = O; c.lineWidth = 2.5; c.strokeRect(tx, fy, tw, H);
      if (sp === 'clock') { c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, fy + 12, 9, 0, Math.PI * 2); c.fill(); c.stroke(); c.beginPath(); c.moveTo(cx, fy + 12); c.lineTo(cx, fy + 6); c.moveTo(cx, fy + 12); c.lineTo(cx + 5, fy + 12); c.lineWidth = 1.5; c.stroke(); roofTopper(c, 'spire', tx, fy - 2, tw, 4, trim); }
      if (sp === 'needle') { c.fillStyle = '#dfe7ef'; c.beginPath(); c.ellipse(cx, fy + 6, 22, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = night ? '#ffe27a' : '#7fc8f8'; c.fillRect(cx - 18, fy + 3, 36, 4); c.beginPath(); c.moveTo(cx, fy - 2); c.lineTo(cx, fy - 34); c.stroke(); }
      if (sp === 'lighthouse') { box(c, tx - 3, fy - 12, tw + 6, 12, night ? '#ffe27a' : '#bfe8ff', 2); roofTopper(c, 'dome', tx, fy - 12, tw, 2, '#e63946'); if (night) { c.fillStyle = '#ffe27a55'; c.beginPath(); c.moveTo(cx, fy - 6); c.lineTo(cx + 80, fy - 30); c.lineTo(cx + 80, fy + 14); c.closePath(); c.fill(); } }
      if (sp === 'observatory') { c.fillStyle = '#e9eef3'; c.beginPath(); c.arc(cx, fy, tw * .7, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = O; c.fillRect(cx - 2, fy - tw * .7, 4, tw * .6); }
      if (sp === 'windmill') { roofTopper(c, 'peak' as RoofStyle, tx, fy, tw, 1, trim); c.save(); c.translate(cx, fy + 4); c.rotate(o.seed % 7); c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillRect(-3, 0, 6, 30); c.strokeRect(-3, 0, 6, 30); } c.restore(); c.fillStyle = trim; c.beginPath(); c.moveTo(tx - 4, fy); c.lineTo(cx, fy - 16); c.lineTo(tx + tw + 4, fy); c.closePath(); c.fill(); c.stroke(); }
      return;
    }
  }
}

/** How far above its footprint a design reaches, for knowing what to redraw and how much room to leave. */
export function reachAbove(look: Look, floors: number): number {
  if (look.special === 'ferris' || look.special === 'coaster') return 60;
  return faceHeight(floors) + 44;
}

// ---------- vehicles and people, from above ----------

/** How long and wide a vehicle is drawn, from above (a helicopter: its rotor's reach). */
export function vehicleSize(v: Pick<Vehicle, 'shape' | 'radius'>): { L: number; W: number } {
  if (v.shape === 'heli') return { L: 72, W: 64 };
  const L = v.shape === 'bendy' ? v.radius * 3.4 : v.shape === 'bus' || v.shape === 'double' || v.shape === 'open' || v.shape === 'tram' ? v.radius * 2.6 : v.shape === 'lorry' || v.shape === 'truck' ? v.radius * 2.4 : v.shape === 'bike' ? v.radius * 1.8 : v.radius * 2;
  return { L, W: v.shape === 'bike' ? v.radius * .9 : v.radius * 1.3 };
}

export function drawVehicle(c: C, v: Pick<Vehicle, 'shape' | 'radius'>, colour: string, x: number, y: number, angle: number, t: number, wobble = 0) {
  const { L, W } = vehicleSize(v);
  c.save(); c.translate(x, y); c.rotate(angle + Math.sin(t * 30) * wobble * .15);
  c.lineWidth = 2.5; c.strokeStyle = O; c.lineJoin = 'round';
  if (v.shape === 'heli') {
    c.fillStyle = '#00000033'; c.beginPath(); c.ellipse(10, 14, 22, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = colour; c.beginPath(); c.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillRect(-36, -3, 20, 6); c.strokeRect(-36, -3, 20, 6);
    c.fillStyle = '#a8dcff'; c.beginPath(); c.ellipse(9, 0, 8, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.rotate(t * 25); c.strokeStyle = '#14161bcc'; c.lineWidth = 4; c.beginPath(); c.moveTo(-32, 0); c.lineTo(32, 0); c.moveTo(0, -32); c.lineTo(0, 32); c.stroke();
    c.restore(); return;
  }
  c.fillStyle = '#0000002e'; rr(c, -L / 2 + 3, -W / 2 + 4, L, W, 6); c.fill();
  c.fillStyle = colour; rr(c, -L / 2, -W / 2, L, W, v.shape === 'car' ? 8 : 5); c.fill(); c.stroke();
  if (v.shape === 'bendy') { c.beginPath(); c.moveTo(0, -W / 2); c.lineTo(0, W / 2); c.stroke(); }
  // the windscreen at the front, windows down the sides
  c.fillStyle = '#a8dcff'; c.fillRect(L / 2 - 8, -W / 2 + 3, 5, W - 6); c.strokeRect(L / 2 - 8, -W / 2 + 3, 5, W - 6);
  if (v.shape === 'bus' || v.shape === 'double' || v.shape === 'bendy' || v.shape === 'tram' || v.shape === 'open') {
    c.fillStyle = v.shape === 'open' ? '#ffffffcc' : '#ffffff55'; c.fillRect(-L / 2 + 5, -W / 2 + 4, L - 16, W - 8);
    if (v.shape === 'double') { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(-L / 2 + 5, -W / 2 + 4, L - 16, W - 8); }
    if (v.shape === 'tram') { c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.stroke(); }
  }
  if (v.shape === 'car') { c.fillStyle = '#a8dcff'; rr(c, -L * .25, -W / 2 + 3, L * .45, W - 6, 4); c.fill(); c.stroke(); }
  if (v.shape === 'truck') { c.fillStyle = '#d9dde3'; c.fillRect(-L / 2 + 4, -3, L * .7, 6); c.strokeRect(-L / 2 + 4, -3, L * .7, 6); }
  if (v.shape === 'sweeper') { c.fillStyle = '#c3cad3'; for (const sy of [-1, 1]) { c.beginPath(); c.arc(L / 2 - 2, sy * W / 2, 6, 0, Math.PI * 2); c.fill(); c.stroke(); } }
  if (v.shape === 'lorry' || v.shape === 'van') { c.fillStyle = shade(colour, -.2); c.fillRect(-L / 2 + 3, -W / 2 + 3, L * .62, W - 6); }
  c.restore();
}

export function drawPerson(c: C, x: number, y: number, hue: number, step: number) {
  c.fillStyle = `hsl(${hue} 70% 55%)`; c.strokeStyle = O; c.lineWidth = 1.5;
  c.beginPath(); c.ellipse(x, y + 2, 4.5, 6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#f2c79b'; c.beginPath(); c.arc(x, y - 6 + Math.sin(step) * .8, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
}

export function drawLittleCar(c: C, x: number, y: number, dir: number, hue: number) {
  c.save(); c.translate(x, y); c.rotate((dir * Math.PI) / 2);
  c.fillStyle = `hsl(${hue} 65% 52%)`; c.strokeStyle = O; c.lineWidth = 2; rr(c, -12, -7, 24, 14, 5); c.fill(); c.stroke();
  c.fillStyle = '#a8dcff'; c.fillRect(2, -5, 5, 10); c.restore();
}
