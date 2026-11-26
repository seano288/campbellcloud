// Drawing the Jump, flat from the side, on a 2D canvas: the night arena (tiered stands full of his crowd with camera flashes, floodlight
// towers, his arena pieces), the dirt, his ramp (run-up, kicker, landing ramp), the Row, his truck, and after the landing the yellow tape
// pulled out of its case at the ramp's lip, black numbers, zero at the lip, to the red mark where his back wheels touched (the truck
// stops on the mark, so the number, the mark, the tape's end and the truck agree).
//
// The same scene, held still, is the Jump card's plan of the jump (`view: 'card'`: the ramp, the Row and a tape under it) and the Arena's
// picture of what he has built (`view: 'arena'`: his truck big in front of his stands).
//
// Kept light for an iPad 9: the stands, the crowd and every arena piece in them are drawn once into a strip and scrolled; per frame there
// are only a few flashes, the beams, the Row (six things at most), the truck and up to a dozen dust puffs.
import { OBSTACLES, itemOf, type ArenaItem, type ObstacleKind } from '../arena/catalog';
import type { TruckLook } from '../arena/arena';
import { drawTruck, TRUCK_LEN } from '../art/truck';
import { groundAt, kickerLen, startX, windOf, type Sim } from './sim';

export interface SceneOpts {
  look: TruckLook;
  night: boolean;
  /** People in the stands, and his arena pieces (ids). */
  crowd: number;
  arena: readonly string[];
  /** The Row, laid out from the lip. */
  parts: readonly (readonly [ObstacleKind, number])[];
  rowFeet: number;
  /** The landing ramp's length (0: none). */
  landing: number;
  reduced: boolean;
}
/** `jump`: the camera follows the truck. `card`: the whole jump held still, a tape under the Row. `arena`: his truck big in his arena. */
export type View = 'jump' | 'card' | 'arena';
export interface Frame { tape: number | null; crunched: number | null; squash: number; flashes: boolean; view?: View }

/** The truck is this many feet long in the world. */
const TRUCK_FT = 15;
/** Where each thing in the Row stands: [kind, from, to] in feet from the lip. */
export function layRow(parts: SceneOpts['parts']): { kind: ObstacleKind; from: number; to: number }[] {
  const out: { kind: ObstacleKind; from: number; to: number }[] = [];
  let x = 1;
  for (const [k, n] of parts) for (let i = 0; i < n; i++) { const len = OBSTACLES[k].len; out.push({ kind: k, from: x, to: x + len }); x += len + 1; }
  return out;
}

const INK = '#111';
const CROWD = ['#e63946', '#ffd23f', '#2f8fe8', '#2fa84f', '#ff7aa8', '#f6f8fb', '#ff7a00', '#9be22d'];
/** A rival's monster truck, for the Rows of rival trucks. */
const RIVAL = (l: TruckLook): TruckLook => ({ ...l, body: 'body:jeep', colour: 'colour:purple', pattern: 'pattern:zigzag', decal: 'decal:none', trim: 'trim:black', driver: 'driver:robot', flag: 'part:flag:none', lights: 'part:lights:none', exhaust: 'part:exhaust:pipe', booster: 'part:booster:none' });

// ---------- the Row ----------

function wheel(ctx: CanvasRenderingContext2D, cx: number, gy: number, r: number) {
  ctx.fillStyle = '#1b1e24'; ctx.beginPath(); ctx.arc(cx, gy - r, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9d1da'; ctx.beginPath(); ctx.arc(cx, gy - r, r * .45, 0, 7); ctx.fill();
}
/** A thing in the Row, from x0 to x1 on the ground at gy, `ft` pixels a foot. `flat`: crunched. */
function obstacle(ctx: CanvasRenderingContext2D, kind: ObstacleKind, x0: number, x1: number, gy: number, ft: number, flat: boolean, look: TruckLook, t: number) {
  const o = OBSTACLES[kind], w = x1 - x0, h = (flat ? Math.min(1.6, o.h * .3) : o.h) * ft, y = gy - h, lw = Math.max(1.5, ft * .22), mid = (x0 + x1) / 2;
  ctx.save();
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.fillStyle = o.colour; ctx.lineJoin = 'round';
  if (kind === 'pool' || kind === 'mud') {
    ctx.fillRect(x0, gy - ft * .3, w, ft * 1.6); ctx.strokeRect(x0, gy - ft * .3, w, ft * 1.6);
    ctx.fillStyle = kind === 'pool' ? '#bfe6ff' : '#4a2c17';
    for (let i = 0; i < w / (ft * 3); i++) { ctx.beginPath(); ctx.ellipse(x0 + ft * 1.5 + i * ft * 3, gy - ft * .3, ft * .9, ft * .25, 0, 0, 7); ctx.fill(); }
    if (kind === 'pool') { ctx.font = `${ft * 3}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🦆', mid, gy - ft * .1); }
    ctx.restore(); return;
  }
  if (kind === 'ring') {
    const cy = gy - h / 2 - ft, rx = ft * 2.2, ry = h / 2;
    ctx.fillStyle = '#6b7280'; ctx.fillRect(mid - ft * .35, cy + ry * .8, ft * .7, gy - cy - ry * .8); ctx.strokeRect(mid - ft * .35, cy + ry * .8, ft * .7, gy - cy - ry * .8);
    ctx.strokeStyle = INK; ctx.lineWidth = ft * 1.3; ctx.beginPath(); ctx.ellipse(mid, cy, rx, ry, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#ff4d1a'; ctx.lineWidth = ft * .8; ctx.stroke();
    // flames all round it, flickering
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, fx = mid + Math.cos(a) * rx, fy = cy + Math.sin(a) * ry, f = ft * (1 + .3 * Math.sin(t * 14 + i * 2));
      ctx.fillStyle = i % 2 ? '#ffd23f' : '#ff7a00'; ctx.beginPath(); ctx.moveTo(fx - f * .5, fy); ctx.quadraticCurveTo(fx, fy - f * 2.2, fx + f * .5, fy); ctx.fill();
    }
    ctx.restore(); return;
  }
  if (kind === 'cone') {
    ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(mid - w * .12, y); ctx.lineTo(mid + w * .12, y); ctx.lineTo(x1, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(x0 + w * .28, gy - h * .55, w * .44, h * .16);
    ctx.restore(); return;
  }
  if (kind === 'hay') {
    ctx.beginPath(); ctx.roundRect(x0, y, w, h, ft * .5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#b08d2a'; ctx.lineWidth = lw * .7;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + ft * .3, y + (h * i) / 4); ctx.lineTo(x1 - ft * .3, y + (h * i) / 4); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0 + w * .3, y); ctx.lineTo(x0 + w * .3, gy); ctx.moveTo(x0 + w * .7, y); ctx.lineTo(x0 + w * .7, gy); ctx.stroke();
    ctx.restore(); return;
  }
  if (kind === 'rival') {
    // a rival's monster truck, drawn as his is, facing him
    const sc = (o.len * ft) / (TRUCK_LEN * 1.25);
    if (flat) { ctx.translate(mid, gy); ctx.scale(1, .35); ctx.translate(-mid, -gy); }
    ctx.translate(mid, gy); ctx.scale(-1, 1); drawTruck(ctx, RIVAL(look), 0, 0, sc, 0, 0, flat ? 1 : 0);
    ctx.restore(); return;
  }
  if (kind === 'plane') {
    ctx.beginPath(); ctx.moveTo(x0 + w * .06, gy - h * .55); ctx.lineTo(x0, gy - h); ctx.lineTo(x0 + w * .16, gy - h * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + w * .04, gy - h * .25); ctx.lineTo(x1 - w * .12, gy - h * .25); ctx.quadraticCurveTo(x1, gy - h * .25, x1, gy - h * .45); ctx.quadraticCurveTo(x1, gy - h * .62, x1 - w * .12, gy - h * .62); ctx.lineTo(x0 + w * .04, gy - h * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f8fe8'; ctx.fillRect(x0 + w * .05, gy - h * .42, w * .85, h * .05);
    ctx.fillStyle = '#1b3a68'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(x0 + w * (.2 + i * .065), gy - h * .5, h * .035, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x1 - w * .1, gy - h * .58); ctx.lineTo(x1 - w * .03, gy - h * .5); ctx.lineTo(x1 - w * .1, gy - h * .5); ctx.fill();
    ctx.fillStyle = '#c9d1da'; ctx.beginPath(); ctx.moveTo(x0 + w * .42, gy - h * .32); ctx.lineTo(x0 + w * .5, gy - h * .06); ctx.lineTo(x0 + w * .6, gy - h * .06); ctx.lineTo(x0 + w * .58, gy - h * .32); ctx.fill(); ctx.stroke();
    ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0 + w * .3, gy - h * .25); ctx.lineTo(x0 + w * .3, gy); ctx.moveTo(x1 - w * .15, gy - h * .25); ctx.lineTo(x1 - w * .15, gy); ctx.stroke();
    wheel(ctx, x0 + w * .3, gy, ft * .9); wheel(ctx, x1 - w * .15, gy, ft * .9);
    ctx.restore(); return;
  }
  if (kind === 'heli') {
    ctx.beginPath(); ctx.ellipse(x1 - w * .3, gy - h * .4, w * .28, h * .3, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(x0, gy - h * .5, w * .45, h * .12); ctx.strokeRect(x0, gy - h * .5, w * .45, h * .12);
    ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(x1 - w * .15, gy - h * .45, w * .1, h * .16, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 - w * .3, gy - h * .7); ctx.lineTo(x1 - w * .3, gy - h * .85); ctx.stroke();
    const spin = Math.cos(t * 9);
    ctx.lineWidth = ft * .5; ctx.beginPath(); ctx.moveTo(x1 - w * .3 - w * .45 * spin, gy - h * .86); ctx.lineTo(x1 - w * .3 + w * .45 * spin, gy - h * .86); ctx.stroke();
    ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1 - w * .5, gy - h * .02); ctx.lineTo(x1 - w * .08, gy - h * .02); ctx.moveTo(x1 - w * .45, gy - h * .02); ctx.lineTo(x1 - w * .4, gy - h * .12); ctx.moveTo(x1 - w * .15, gy - h * .02); ctx.lineTo(x1 - w * .2, gy - h * .12); ctx.stroke();
    ctx.restore(); return;
  }
  if (kind === 'rocket') {
    ctx.beginPath(); ctx.moveTo(x0 + w * .08, gy - h * .9); ctx.lineTo(x1 - w * .15, gy - h * .9); ctx.quadraticCurveTo(x1, gy - h * .55, x1 - w * .15, gy - h * .2); ctx.lineTo(x0 + w * .08, gy - h * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(x0 + w * .08, gy - h * .9); ctx.lineTo(x0, gy - h); ctx.lineTo(x0 + w * .22, gy - h * .9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + w * .08, gy - h * .2); ctx.lineTo(x0, gy); ctx.lineTo(x0 + w * .22, gy - h * .2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5fd3f3'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x0 + w * (.4 + i * .15), gy - h * .55, h * .14, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore(); return;
  }
  if (kind === 'whale') {
    ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = lw * .6; ctx.beginPath(); ctx.moveTo(mid, gy - h * .1); ctx.lineTo(mid, gy); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(mid + w * .05, gy - h * .55, w * .42, h * .4, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + w * .15, gy - h * .55); ctx.lineTo(x0, gy - h * .85); ctx.lineTo(x0 + w * .02, gy - h * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x1 - w * .22, gy - h * .62, h * .08, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x1 - w * .21, gy - h * .62, h * .04, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  if (kind === 'dino') {
    ctx.beginPath(); ctx.moveTo(x0, gy - h * .3); ctx.quadraticCurveTo(x0 + w * .3, gy - h, x0 + w * .55, gy - h * .55); ctx.lineTo(x1, gy - h * .9); ctx.lineTo(x1, gy - h * .6); ctx.lineTo(x0 + w * .75, gy - h * .3); ctx.lineTo(x0 + w * .7, gy); ctx.lineTo(x0 + w * .3, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x1 - w * .06, gy - h * .8, h * .04, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  if (kind === 'crane') {
    ctx.fillRect(x0, gy - h * .3, w * .5, h * .3); ctx.strokeRect(x0, gy - h * .3, w * .5, h * .3);
    ctx.beginPath(); ctx.moveTo(x0 + w * .2, gy - h * .3); ctx.lineTo(x1, gy - h); ctx.lineWidth = ft * .9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = ft * .5; ctx.strokeStyle = o.colour; ctx.stroke();
    ctx.lineWidth = lw * .6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x1, gy - h); ctx.lineTo(x1, gy - h * .55); ctx.stroke();
    wheel(ctx, x0 + w * .1, gy, ft * 1.2); wheel(ctx, x0 + w * .4, gy, ft * 1.2);
    ctx.restore(); return;
  }
  // wheeled things: a car has a body and a roof, a bus or truck is a long box; windows, a stripe, lights and wheels
  const r = Math.min(h * .2, ft * 1.7), long = w > ft * 22 || o.h >= 9, bodyTop = long ? y : gy - h * .62, bottom = gy - r * .9;
  if (!long) {
    ctx.beginPath(); ctx.moveTo(x0 + w * .22, bodyTop); ctx.lineTo(x0 + w * .32, y); ctx.lineTo(x0 + w * .68, y); ctx.lineTo(x0 + w * .8, bodyTop); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flat) { ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(x0 + w * .3, bodyTop - ft * .2); ctx.lineTo(x0 + w * .36, y + ft * .6); ctx.lineTo(x0 + w * .64, y + ft * .6); ctx.lineTo(x0 + w * .72, bodyTop - ft * .2); ctx.closePath(); ctx.fill(); ctx.fillStyle = o.colour; ctx.fillRect(mid - ft * .3, y + ft * .5, ft * .6, bodyTop - y); }
  }
  ctx.fillStyle = o.colour; ctx.beginPath(); ctx.roundRect(x0, bodyTop, w, bottom - bodyTop, ft * .7); ctx.fill(); ctx.stroke();
  if (!flat) {
    if (long) {
      ctx.fillStyle = '#bfe6ff'; const n = Math.max(2, Math.floor(w / (ft * 4.5)));
      for (let i = 0; i < n; i++) { const wx = x0 + ft * 1.2 + (i * (w - ft * 2.4)) / n; ctx.fillRect(wx, y + h * .12, (w - ft * 2.4) / n - ft * .6, h * .26); ctx.strokeRect(wx, y + h * .12, (w - ft * 2.4) / n - ft * .6, h * .26); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x0 + ft * .5, y + h * .5, w - ft, h * .08);
    }
    ctx.fillStyle = '#fff6c4'; ctx.fillRect(x1 - ft * .7, bottom - (bottom - bodyTop) * .7, ft * .5, ft * .7);
    ctx.fillStyle = '#ff2d3d'; ctx.fillRect(x0 + ft * .2, bottom - (bottom - bodyTop) * .7, ft * .5, ft * .7);
    if (kind === 'police' || kind === 'fire') { ctx.fillStyle = Math.floor(t * 4) % 2 ? '#2f8fe8' : '#ff2d3d'; ctx.fillRect(mid - ft, y - ft * .8, ft * 2, ft * .8); ctx.strokeRect(mid - ft, y - ft * .8, ft * 2, ft * .8); }
    if (kind === 'taxi') { ctx.fillStyle = '#111'; for (let i = 0; i < 6; i++) ctx.fillRect(x0 + w * .1 + i * w * .13, bottom - (bottom - bodyTop) * .45, w * .065, ft * .5); }
  }
  for (const wx of long ? [x0 + w * .15, x1 - w * .15, x1 - w * .15 - r * 2.3] : [x0 + w * .2, x1 - w * .2]) wheel(ctx, wx, gy, r);
  ctx.restore();
}

// ---------- the stands, drawn once ----------

/** Where an arena piece goes: up in the sky, along the top of the stands, or on the floor in front of the wall. */
type Place = 'sky' | 'top' | 'floor';
const PLACE: Record<string, Place> = {
  'arena:blimp': 'sky', 'arena:balloons': 'top', 'arena:flags': 'top', 'arena:banner': 'top', 'arena:sign': 'top', 'arena:screen': 'top', 'arena:speed': 'top', 'arena:booth': 'top',
  'arena:lights': 'floor', 'arena:windsock': 'top', 'arena:trophycase': 'floor', 'arena:fireworks': 'top', 'arena:floodlights': 'top', 'arena:spot': 'top', 'arena:lasers': 'top',
};
const TILE = 1100;

/** The stands as one strip TILE wide that repeats: the sky margin (`pad` px) with the top pieces, tiered seats with his crowd, the
 *  padded wall and the floor pieces in front of it. Rebuilt only when the screen's size changes. */
function buildStands(standH: number, pad: number, crowd: number, arena: readonly ArenaItem[], dpr: number) {
  const c = document.createElement('canvas'), H = standH + pad;
  c.width = TILE * dpr; c.height = Math.ceil(H * dpr);
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const wallH = Math.max(14, standH * .12), seatsH = standH - wallH, top = pad;
  // floodlight towers, always: a night arena is lit from them
  for (const tx of [TILE * .18, TILE * .68]) {
    const by = top - pad * .92, bw = 74, bh = 30;
    const glow = ctx.createRadialGradient(tx, by + bh / 2, 4, tx, by + bh / 2, 70); glow.addColorStop(0, 'rgba(255,246,196,.45)'); glow.addColorStop(1, 'rgba(255,246,196,0)');
    ctx.fillStyle = glow; ctx.fillRect(tx - 80, by - 50, 160, 140);
    ctx.fillStyle = '#3b424c'; ctx.fillRect(tx - 4, by + bh, 8, pad * .92 - bh + seatsH * .3);
    ctx.fillStyle = '#1c2027'; ctx.beginPath(); ctx.roundRect(tx - bw / 2, by, bw, bh, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(tx - 28 + i * 14, by + 8 + j * 14, 5, 0, 7); ctx.fill(); }
  }
  // tiers: darker high up, each with a light edge
  const tiers = Math.max(3, Math.round(seatsH / 26)), tierH = seatsH / tiers;
  for (let i = 0; i < tiers; i++) {
    const y = top + i * tierH, k = i / tiers;
    ctx.fillStyle = `rgb(${24 + k * 18},${22 + k * 16},${36 + k * 18})`; ctx.fillRect(0, y, TILE, tierH);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, y, TILE, 2);
  }
  // aisles
  ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 140; x < TILE; x += 275) ctx.fillRect(x, top, 10, seatsH);
  // the crowd: a head and shoulders a seat, filling more of the seats as it grows
  const fill = .45 + Math.min(.55, (crowd - 200) / 3000), seat = Math.max(10, Math.min(15, tierH * .55));
  let n = 0;
  for (let i = 0; i < tiers; i++) {
    const y = top + i * tierH + tierH * .72;
    for (let x = seat / 2 + (i % 2) * seat * .5; x < TILE; x += seat) {
      if (Math.abs(((x - 140) % 275) - 5) < 9) continue;
      const seed = ((Math.floor(x) * 73 + i * 37) % 101) / 101;
      if (seed > fill) continue;
      const col = CROWD[(Math.floor(x) * 7 + i * 3) % CROWD.length]!;
      ctx.fillStyle = col; ctx.globalAlpha = .75 - (i / tiers) * .25;
      ctx.beginPath(); ctx.roundRect(x - seat * .38, y - seat * .2, seat * .76, seat * .55, seat * .2); ctx.fill();
      ctx.fillStyle = ['#f1c7a0', '#c68a5e', '#8d5a3b', '#f6d7b8'][(Math.floor(x) + i) % 4]!; ctx.beginPath(); ctx.arc(x, y - seat * .42, seat * .26, 0, 7); ctx.fill();
      if (seed < fill * .2) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + seat * .3, y - seat * .1); ctx.lineTo(x + seat * .45, y - seat * .75); ctx.stroke(); }
      n++;
    }
  }
  ctx.globalAlpha = 1;
  // the wall: padded panels, yellow and black like the tape
  const wy = top + seatsH;
  for (let x = 0; x < TILE; x += 50) { ctx.fillStyle = (x / 50) % 2 ? '#ffd23f' : '#1b1e24'; ctx.fillRect(x, wy, 50, wallH); }
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(0, wy - 3, TILE, 3);
  // his arena pieces, each at its own spot
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const a of arena) {
    if (a.id === 'arena:floodlights') continue; // the beams are drawn live
    const place = PLACE[a.id] ?? 'floor', x = 40 + ((a.spot * 263) % (TILE - 80));
    const size = place === 'sky' ? Math.min(54, pad * .7) : place === 'top' ? Math.min(40, pad * .6) : Math.min(46, Math.max(24, standH * .28));
    ctx.font = `${size}px sans-serif`;
    if (a.id === 'arena:screen') {
      // the Big Screen: a frame on legs with his truck's best on it
      const sw = 120, sh = Math.min(70, pad * .9);
      ctx.fillStyle = '#1b1e24'; ctx.fillRect(x - sw / 2, top - sh - 4, sw, sh); ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 3; ctx.strokeRect(x - sw / 2, top - sh - 4, sw, sh);
      ctx.fillStyle = '#2f8fe8'; ctx.fillRect(x - sw / 2 + 6, top - sh + 2, sw - 12, sh - 16); ctx.font = `${sh * .45}px sans-serif`; ctx.fillText('🛻', x, top - 14);
      continue;
    }
    if (a.id === 'arena:flags') { for (let i = 0; i < 9; i++) { ctx.font = `${size * .7}px sans-serif`; ctx.fillText('🚩', x - 160 + i * 40, top + 2); } continue; }
    if (a.id === 'arena:banner') { ctx.fillStyle = '#e63946'; ctx.fillRect(x - 90, top + seatsH * .1, 180, Math.min(34, seatsH * .22)); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.min(24, seatsH * .17)}px Nunito, sans-serif`; ctx.fillText('BIG AIR!', x, top + seatsH * .1 + Math.min(26, seatsH * .18)); continue; }
    const y = place === 'sky' ? top - pad * .35 : place === 'top' ? top + 2 : wy + wallH;
    ctx.fillText(a.icon, x, y);
  }
  return { canvas: c, n };
}

// ---------- the scene ----------

export function createScene(canvas: HTMLCanvasElement, o: SceneOpts) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1;
  const row = layRow(o.parts), arena = o.arena.map(id => itemOf(id) as ArenaItem).filter(i => i.cat === 'arena');
  const has = (does: string) => arena.some(a => a.does === does), owns = (id: string) => arena.some(a => a.id === `arena:${id}`);
  const seen = { camX: 0, scale: 0 };
  let stands: { canvas: HTMLCanvasElement; h: number; pad: number } | null = null;
  const dust: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  let landedAt = -1;
  const resize = () => {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    stands = null;
  };
  resize();

  function frame(s: Sim, t: number, f: Frame) {
    if (!W) return;
    const view = f.view ?? 'jump', still = view !== 'jump';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = s.setup, k = kickerLen(S);
    const gy = view === 'arena' ? H * .8 : H * (H > W ? .68 : .8);
    // after the landing the truck sits on its mark: the back wheels where they touched, rounded as the distance is
    const land = s.landed;
    const tx = land ? land.x + (s.feet - land.x) * Math.min(1, s.settleT / .25) : s.x;
    if (land && landedAt < 0) { landedAt = t; if (!o.reduced) for (let i = 0; i < 12; i++) dust.push({ x: land.x + (i % 2 ? 2 : -1), y: .5, vx: (i % 2 ? 1 : -1) * (2 + (i * 7) % 9), vy: 3 + (i * 5) % 6, life: 1 }); }
    // the camera
    let ft: number;
    if (view === 'card') {
      const from = -k - 20, to = Math.max(o.rowFeet + o.landing, 20) + 8, tall = Math.max(S.lip, ...row.map(r => OBSTACLES[r.kind].h)) + 8;
      ft = Math.min(W / (to - from), (gy - H * .08) / tall); seen.scale = ft; seen.camX = from + ((to - from) - W / ft) / 2;
    } else if (view === 'arena') {
      ft = Math.min((W * .42) / TRUCK_FT, (gy * .45) / 9); seen.scale = ft; seen.camX = -k - W * .6 / ft;
    } else {
      const tapeFit = f.tape !== null ? Math.max(2, Math.min(W / 46, H / 22, (W * .84) / (s.feet + 12))) : 0;
      const want = f.tape !== null ? tapeFit : Math.min(W / 70, (gy - 30) / Math.max(18, s.y + 14), H / 26);
      ft = seen.scale ? seen.scale + (want - seen.scale) * .08 : want;
      seen.scale = ft;
      const focus = f.tape !== null ? -6 - (W * .08) / ft : tx - W * .35 / ft;
      seen.camX = seen.camX ? seen.camX + (focus - seen.camX) * (f.tape !== null ? .1 : .25) : focus;
    }
    const X = (x: number) => (x - seen.camX) * ft, Y = (y: number) => gy - y * ft;
    const night = o.night;
    // the sky: a night arena always; a Night Show (or night jumps) is darker still, with more stars
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    if (night) { sky.addColorStop(0, '#020208'); sky.addColorStop(1, '#141230'); } else { sky.addColorStop(0, '#070a1c'); sky.addColorStop(1, '#2a2552'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < (night ? 70 : 34); i++) { const sz = i % 5 ? 1.5 : 2.5; ctx.fillRect(((i * 97.3 - seen.camX * ft * .05) % W + W) % W, (i * 41.7) % (gy * .45), sz, sz); }
    // the stands: taller on an upright screen, growing with the crowd
    const grow = Math.min(1, Math.sqrt(Math.max(0, o.crowd - 200)) / 90);
    const standH = Math.round(gy * (view === 'arena' ? .5 + grow * .2 : (H > W ? .5 : .4) + grow * (H > W ? .2 : .16))), pad = Math.round(Math.min(90, standH * .45));
    if (!stands || stands.h !== standH) stands = { ...buildStands(standH, pad, o.crowd, arena, dpr), h: standH, pad };
    const standTop = gy - standH, par = (seen.camX * ft * .4) % TILE;
    for (let sx = -((par % TILE) + TILE) % TILE; sx < W; sx += TILE) ctx.drawImage(stands.canvas, sx, standTop - pad, TILE, standH + pad);
    // camera flashes in the crowd: little white stars, more with the Camera Crew, a burst after the landing
    const nFlash = (has('flashes') ? 9 : 4) + (f.flashes ? 6 : 0);
    for (let i = 0; i < nFlash; i++) {
      const seed = Math.floor(t * 6) * 13 + i * 31;
      if (seed % 3) continue;
      const fx = (seed * 47) % W, fy = standTop + 6 + (seed * 13) % Math.max(10, standH * .8), r = 3 + (seed % 4);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(fx - r * 1.8, fy); ctx.lineTo(fx, fy - r * .4); ctx.lineTo(fx + r * 1.8, fy); ctx.lineTo(fx, fy + r * .4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx, fy - r * 1.8); ctx.lineTo(fx + r * .4, fy); ctx.lineTo(fx, fy + r * 1.8); ctx.lineTo(fx - r * .4, fy); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // the Floodlights' beams, the Spotlights sweeping and the Laser Show
    if (has('night')) {
      for (const at of [.18, .68]) {
        const lx = ((at * TILE - par) % TILE + TILE) % TILE, ly = standTop - pad * .8;
        for (const bx of [lx, lx + TILE, lx - TILE]) {
          if (bx < -300 || bx > W + 300) continue;
          const g = ctx.createLinearGradient(bx, ly, bx, gy); g.addColorStop(0, 'rgba(255,246,196,.4)'); g.addColorStop(1, 'rgba(255,246,196,.06)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 20, ly); ctx.lineTo(bx + 20, ly); ctx.lineTo(bx + 240, gy); ctx.lineTo(bx + 40, gy); ctx.closePath(); ctx.fill();
        }
      }
    }
    if (owns('spot') && !o.reduced) for (let i = 0; i < 2; i++) {
      const sx = W * (.25 + i * .5), aim = W * (.5 + .4 * Math.sin(t * .8 + i * 2));
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(sx - 6, 0); ctx.lineTo(sx + 6, 0); ctx.lineTo(aim + 60, gy); ctx.lineTo(aim - 60, gy); ctx.closePath(); ctx.fill();
    }
    if (owns('lasers')) {
      ctx.lineWidth = 3; ['#ff2d9b', '#3ddcff', '#7dff6b'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(W * (.1 + i * .4), standTop - pad); ctx.lineTo(W * (.5 + .45 * Math.sin(t * (o.reduced ? 0 : .9) + i * 2.1)), gy * .2); ctx.stroke(); });
      ctx.globalAlpha = 1;
    }
    // the dirt: the track's edge, tire ruts, and a pool of light under the floodlights
    ctx.fillStyle = '#6b4226'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, gy, W, Math.max(4, ft * .5));
    ctx.fillStyle = '#5a361d'; for (let i = 0; i < 26; i++) { const x = ((i * 113 - seen.camX * ft) % W + W) % W; ctx.fillRect(x, gy + 10 + (i % 5) * 9, 14 + (i % 3) * 6, 3); }
    if (has('night')) { const g = ctx.createLinearGradient(0, gy, 0, H); g.addColorStop(0, 'rgba(255,246,196,.18)'); g.addColorStop(1, 'rgba(255,246,196,0)'); ctx.fillStyle = g; ctx.fillRect(0, gy, W, H - gy); }
    if (owns('smoke')) { const g = ctx.createLinearGradient(0, gy - ft * 6, 0, gy); g.addColorStop(0, 'rgba(220,220,235,0)'); g.addColorStop(1, 'rgba(220,220,235,.22)'); ctx.fillStyle = g; ctx.fillRect(0, gy - ft * 6, W, ft * 6); }
    // the run-up: a dirt lane with a chequered start line
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(X(startX(S)), gy - 2, S.runUp * ft, Math.max(4, ft * .4));
    const sq = Math.max(3, ft * .5);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.fillRect(X(startX(S)) + j * sq, gy - (i + 1) * sq, sq, sq); }
    // the kicker: a steel frame faced with dirt-brown planks, the lip edged in yellow
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, ft * .3); ctx.lineJoin = 'round';
    ctx.fillStyle = '#3b424c'; ctx.beginPath(); ctx.moveTo(X(-k * .55), Y(0)); ctx.lineTo(X(0), Y(S.lip)); ctx.lineTo(X(0), Y(0)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = Math.max(1.5, ft * .2); ctx.beginPath();
    for (let i = 1; i < 4; i++) { const x = -k * .55 + (k * .55 * i) / 4; ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(groundAt(S, x))); }
    ctx.stroke();
    ctx.fillStyle = '#c46a2f'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, ft * .3);
    const deck = Math.max(.6, S.lip * .12);
    ctx.beginPath(); ctx.moveTo(X(-k), Y(0)); ctx.lineTo(X(0), Y(S.lip)); ctx.lineTo(X(0), Y(S.lip - deck)); ctx.lineTo(X(-k + k * deck / S.lip), Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(X(-k * .06), Y(S.lip * .94)); ctx.lineTo(X(0), Y(S.lip)); ctx.lineTo(X(0), Y(S.lip - deck)); ctx.lineTo(X(-k * .06), Y(S.lip * .94 - deck)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(-k * .55), Y(0)); ctx.lineTo(X(0), Y(S.lip - deck)); ctx.moveTo(X(0), Y(S.lip - deck)); ctx.lineTo(X(0), Y(0)); ctx.stroke();
    // the Row
    row.forEach((r, i) => obstacle(ctx, r.kind, X(r.from), X(r.to), gy, ft, f.crunched !== null && i === f.crunched, o.look, o.reduced ? 0 : t));
    // the landing ramp past the Row
    if (o.landing > 0 && view !== 'arena') {
      ctx.fillStyle = '#c46a2f'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, ft * .3);
      ctx.beginPath(); ctx.moveTo(X(o.rowFeet + 1), Y(Math.min(6, o.landing / 6))); ctx.lineTo(X(o.rowFeet + 1 + o.landing), Y(0)); ctx.lineTo(X(o.rowFeet + 1), Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // the end of the Row: a green flag on the ground, so he can see how far he must go
    if (o.rowFeet > 0 && view !== 'arena') {
      const fx = X(o.rowFeet), fh = Math.max(30, ft * 4.5);
      ctx.fillStyle = '#f6f8fb'; ctx.fillRect(fx - 1.5, gy - fh, 3, fh);
      ctx.fillStyle = '#2fa84f'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx + 1.5, gy - fh); ctx.lineTo(fx + fh * .55, gy - fh * .82); ctx.lineTo(fx + 1.5, gy - fh * .64); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // the tape: on the card it measures the Row; after a jump it rolls out of its case at the lip to his mark
    const tapeTo = view === 'card' ? o.rowFeet : f.tape;
    if (tapeTo !== null && tapeTo > 0 && view !== 'arena') tape(ctx, X, gy, ft, tapeTo, W, view === 'card' || (land !== null && f.tape! >= s.feet));
    // the mark where his back wheels touched, from the landing on: a red line down through the dirt (and the tape, when it comes) to a
    // red pin under it, so "where he landed" shows below the wheel that sits on it
    if (land && view === 'jump') {
      const mx = X(s.feet), th = Math.max(26, Math.min(44, ft * 2.4)), pinY = gy + Math.max(8, ft * .6) + th + 4, ph = Math.max(18, th * .7);
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx, pinY); ctx.stroke();
      ctx.fillStyle = '#e63946'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(mx, pinY); ctx.lineTo(mx - ph * .5, pinY + ph); ctx.lineTo(mx + ph * .5, pinY + ph); ctx.closePath(); ctx.fill(); ctx.stroke();
      // once the tape reaches it, the distance is written beside the pin
      if (f.tape !== null && f.tape >= s.feet) {
        const fs = Math.round(Math.max(20, Math.min(34, th * .8))), label = `${s.feet} ft`;
        ctx.font = `900 ${fs}px Nunito, sans-serif`; const w = ctx.measureText(label).width + fs * .8, lx = Math.min(W - w - 8, mx + ph * .7);
        ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(lx, pinY + ph * .5 - fs * .75, w, fs * 1.5, fs * .4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx + w / 2, pinY + ph * .5 + 1); ctx.textBaseline = 'alphabetic';
      }
    }
    // the wind he feels
    const wind = windOf(S) + (S.help > 0 ? 1 : 0);
    if (view === 'jump' && ((has('windsock') && S.wind) || S.help > 0)) {
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`💨 ${wind > 0 ? '→'.repeat(Math.min(5, S.help + (S.wind > 0 ? 1 : 0))) : '←'.repeat(Math.min(3, Math.ceil(-S.wind / 2)))}`, 14, H - 20);
    }
    // the truck (its x is its back wheels' place on the tape; its middle is half a truck ahead)
    const sc = (TRUCK_FT * ft) / TRUCK_LEN, back = TRUCK_LEN * .3 * sc;
    if (still) {
      const at = view === 'card' ? -k - 13 : -k - 5;
      drawTruck(ctx, o.look, X(at) + back, gy, sc, 0, o.reduced ? 0 : t * .3, 0);
    } else {
      const pitch = s.phase === 'run' && s.x > -k ? S.angle : s.pitch, rad = (pitch * Math.PI) / 180;
      const bounce = land && !o.reduced ? Math.max(0, Math.sin(s.settleT * 9) * Math.exp(-s.settleT * 4)) * 1.2 : 0;
      const ty = land ? bounce : s.y;
      drawTruck(ctx, o.look, X(tx) + Math.cos(rad) * back, Y(ty) - Math.sin(rad) * back, sc, pitch, o.reduced ? 0 : t * (s.phase === 'run' ? 1 + s.v / 20 : land ? .2 : .5), f.squash);
    }
    // dust from the landing
    if (dust.length) {
      const dt = 1 / 60;
      ctx.fillStyle = '#c9a27a';
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i]!; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 12 * dt; p.life -= dt * 1.1;
        if (p.life <= 0 || p.y < 0) { dust.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * .8; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), ft * (1.6 - p.life), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  return { frame, resize, layRow: () => row, scale: () => seen.scale };
}

/** The tape measure: its yellow case at the lip, the tape out to `end` feet with black ticks and numbers, and its metal hook at the end
 *  (`hooked`: the tape has reached the end). */
function tape(ctx: CanvasRenderingContext2D, X: (x: number) => number, gy: number, ft: number, end: number, W: number, hooked: boolean) {
  const th = Math.max(26, Math.min(44, ft * 2.4)), ty = gy + Math.max(8, ft * .6), x0 = X(0), x1 = X(end);
  // the case, at zero
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x0 - th * 1.25, ty - th * .3, th * 1.3, th * 1.6, th * .3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1b1e24'; ctx.beginPath(); ctx.arc(x0 - th * .6, ty + th * .5, th * .38, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x0 - th * .6, ty + th * .5, th * .14, 0, 7); ctx.fill();
  // the tape
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x0, ty, x1 - x0, th);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(x0, ty, x1 - x0, th);
  const tick = ft >= 7 ? 1 : ft >= 3 ? 5 : 10, label = ft * 5 >= 34 ? 5 : 10;
  const fs = Math.round(Math.max(15, Math.min(26, th * .58)));
  ctx.fillStyle = INK; ctx.font = `900 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (let n = 0; n <= end; n += tick) {
    const x = X(n);
    if (x < -30 || x > W + 30) continue;
    const big = n % label === 0;
    ctx.fillRect(x - 1.25, ty, 2.5, big ? th * .42 : th * .24);
    if (big && (n === 0 || x1 - x > fs * .9)) ctx.fillText(String(n), x, ty + th - 3);
    else if (big && n === end && hooked) { ctx.textAlign = 'right'; ctx.fillText(String(n), x - 6, ty + th - 3); ctx.textAlign = 'center'; }
  }
  // the hook at its end
  ctx.fillStyle = '#9aa3ad'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillRect(x1 - 2, ty - (hooked ? th * .25 : 0), 5, th + (hooked ? th * .25 : 0)); ctx.strokeRect(x1 - 2, ty - (hooked ? th * .25 : 0), 5, th + (hooked ? th * .25 : 0));
}
