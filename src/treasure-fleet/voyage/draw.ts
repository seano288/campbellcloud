// Drawing the Voyage on a canvas: the sea from above with his ship (built from his parts, so the ship he built is the one that sails),
// barrels, rocks, tentacles and splashes; then the island from the side with his pirate, the crabs, the X and the chest.
import { colourOf, GUN_METAL, rungOf, type Ship } from '../fleet/parts';
import type { IslandDef } from '../fleet/islands';
import { ARRIVE_S, SAIL_S, SHIP_Y, type Sail } from './sail';
import { BEACH, dune, GROUND_Y, START_X, VIEW_H, X_AT, type Walk } from './island';

const O = '#1d140c';
const outline = (c: CanvasRenderingContext2D, w = 5) => { c.lineWidth = w; c.strokeStyle = O; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
/** Hull wood by Rung, as in the Shipyard (art/ShipView.tsx). */
const WOOD = ['#a8743c', '#9b5f2e', '#7e4a24', '#5e3218', '#2f4f7a', '#3a1f12', '#5f8f88'] as const;
const RAINBOW = ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cd07a', '#4aa8ff', '#9a6bff'] as const;
/** The sail cloth by Rung; Rainbow Sails (5) take a colour per mast. */
const clothOf = (sails: number, mast: number) => (sails === 0 ? '#f4f6fa' : sails === 5 ? RAINBOW[(mast * 2) % RAINBOW.length]! : sails === 6 ? '#8a1c2b' : sails >= 3 ? '#fff6dc' : sails === 2 ? '#f4f1e8' : '#e8dcc0');
const FIGURE = ['', '#ffffff', '#3ec7b2', '#3fa34d', '#8a9aa8', '#fbf7ff', '#e8573a'] as const;
/** Bigger hulls grow less past the galleon, so the ship stays clear of the barrels' lane on a phone. */
const grow = (rung: number, a: number, b: number) => Math.min(rung, 3) * a + Math.max(0, rung - 3) * b;

// ---------- the sea, from above ----------

/** His ship from above, bow up, centred on 0,0. A rowing boat is short with one mast; a galleon is long with three. */
export function drawShipTop(c: CanvasRenderingContext2D, ship: Ship, t: number) {
  const hull = rungOf(ship, 'hull'), sails = rungOf(ship, 'sails'), guns = rungOf(ship, 'cannons'), fig = rungOf(ship, 'figurehead');
  const len = 120 + grow(hull, 32, 10), half = 30 + grow(hull, 7, 2), wood = WOOD[hull]!;
  if (hull === 6) { c.beginPath(); c.ellipse(0, 0, half * 1.4, len * .58, 0, 0, Math.PI * 2); c.fillStyle = '#b8ffe633'; c.fill(); }
  // wake
  c.fillStyle = '#ffffff55';
  c.beginPath(); c.moveTo(-half * .7, len * .45); c.lineTo(-half * 1.6, len * .9 + Math.sin(t * 6) * 6); c.lineTo(half * 1.6, len * .9 + Math.cos(t * 6) * 6); c.lineTo(half * .7, len * .45); c.closePath(); c.fill();
  // cannons out of the sides
  for (let i = 0; i <= Math.min(guns, 4); i++) for (const side of [-1, 1]) {
    const y = -len * .2 + i * len * (guns > 3 ? .13 : .16);
    c.fillStyle = GUN_METAL[guns]!; c.beginPath(); c.roundRect(side * half - (side > 0 ? 0 : 16), y - 5, 16, 10, 4); c.fill(); outline(c, 3);
  }
  // hull
  c.beginPath();
  c.moveTo(0, -len / 2);
  c.quadraticCurveTo(half * 1.15, -len * .2, half, len * .35);
  c.quadraticCurveTo(half * .8, len / 2, 0, len / 2);
  c.quadraticCurveTo(-half * .8, len / 2, -half, len * .35);
  c.quadraticCurveTo(-half * 1.15, -len * .2, 0, -len / 2);
  c.fillStyle = wood; c.fill(); outline(c);
  c.beginPath(); c.ellipse(0, len * .02, half * .7, len * .38, 0, 0, Math.PI * 2); c.fillStyle = '#c99a5e'; c.fill();
  c.strokeStyle = '#00000022'; c.lineWidth = 2; for (let y = -len * .3; y < len * .38; y += 12) { c.beginPath(); c.moveTo(-half * .6, y); c.lineTo(half * .6, y); c.stroke(); }
  // masts and sails, seen from above: a yard across each mast with the sail billowing forward
  const masts = hull === 0 ? [0] : hull === 1 ? [-.05] : hull === 2 ? [-.2, .18] : [-.27, 0, .26];
  masts.forEach((m, i) => {
    const y = m * len, s3 = Math.min(sails, 3) + (sails > 3 ? .6 : 0), span = (half * 1.2 + s3 * 10) * (i === Math.floor(masts.length / 2) ? 1 : .85);
    c.beginPath(); c.moveTo(-span, y + 6); c.quadraticCurveTo(0, y - 22 - s3 * 4, span, y + 6); c.quadraticCurveTo(0, y - 6, -span, y + 6); c.fillStyle = clothOf(sails, i); c.fill(); outline(c, 4);
    if (sails === 0) { c.strokeStyle = '#7fb3e6'; c.lineWidth = 4; c.beginPath(); c.moveTo(-span * .6, y - 2); c.quadraticCurveTo(0, y - 14, span * .6, y - 2); c.stroke(); }
    if (sails === 3) { c.strokeStyle = '#c81d25'; c.lineWidth = 5; c.beginPath(); c.moveTo(-span * .7, y - 4); c.quadraticCurveTo(0, y - 18, span * .7, y - 4); c.stroke(); }
    if (sails === 4) { c.strokeStyle = '#d62828'; c.lineWidth = 6; c.beginPath(); for (const k of [-.5, 0, .5]) { c.moveTo(span * k, y + 2); c.lineTo(span * k, y - 14 + Math.abs(k) * 10); } c.stroke(); }
    if (sails === 6) { c.strokeStyle = '#f2c79b'; c.lineWidth = 3; c.beginPath(); for (const k of [-.7, -.3, .3, .7]) { c.moveTo(0, y - 6); c.lineTo(span * k, y + 2); } c.stroke(); }
    c.beginPath(); c.arc(0, y + 4, 7, 0, Math.PI * 2); c.fillStyle = '#8a5a2b'; c.fill(); outline(c, 3);
  });
  // his flag, streaming back from the main mast
  const main = masts[Math.floor(masts.length / 2)]! * len, col = colourOf(ship.colour);
  c.beginPath(); c.moveTo(0, main + 4); c.quadraticCurveTo(14 + Math.sin(t * 8) * 5, main + 26, 4, main + 46); c.lineTo(-10, main + 30); c.closePath(); c.fillStyle = col.cloth; c.fill(); outline(c, 3);
  // figurehead at the bow
  if (fig > 0) {
    c.beginPath(); c.arc(0, -len / 2 - 6, 8 + Math.min(fig, 4), 0, Math.PI * 2); c.fillStyle = FIGURE[fig]!; c.fill(); outline(c, 3);
    if (fig === 5) { c.beginPath(); c.moveTo(-3, -len / 2 - 14); c.lineTo(0, -len / 2 - 34); c.lineTo(3, -len / 2 - 14); c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); outline(c, 2); }
    if (fig === 6) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 8, -len / 2 - 6); c.quadraticCurveTo(sd * 30, -len / 2 - 20, sd * 22, -len / 2 + 8); c.closePath(); c.fillStyle = '#ffb02e'; c.fill(); outline(c, 2); }
    if (fig === 4) { c.beginPath(); c.moveTo(0, -len / 2 - 2); c.lineTo(0, -len / 2 - 26); c.lineTo(10, -len / 2 - 6); c.closePath(); c.fillStyle = '#8a9aa8'; c.fill(); outline(c, 2); }
  }
}

function drawBarrel(c: CanvasRenderingContext2D, r: number, spin: number) {
  c.save(); c.rotate(Math.sin(spin * 2) * .3);
  c.beginPath(); c.ellipse(0, 0, r, r * .78, 0, 0, Math.PI * 2); c.fillStyle = '#b5773a'; c.fill(); outline(c);
  c.strokeStyle = '#5e3218'; c.lineWidth = 5; for (const k of [-.45, .45]) { c.beginPath(); c.moveTo(r * k, -r * .7); c.lineTo(r * k, r * .7); c.stroke(); }
  c.beginPath(); c.arc(0, 0, r * .28, 0, Math.PI * 2); c.fillStyle = '#ffd23f'; c.fill(); outline(c, 3);
  c.restore();
}

function drawRock(c: CanvasRenderingContext2D, r: number, spin: number, t: number) {
  c.beginPath(); c.ellipse(0, 0, r * 1.35 + Math.sin(t * 3) * 3, r * 1.15, 0, 0, Math.PI * 2); c.fillStyle = '#ffffff66'; c.fill();
  c.save(); c.rotate(spin);
  c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = r * (.8 + ((i * 37) % 7) / 28); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = '#7d7b80'; c.fill(); outline(c);
  c.beginPath(); c.arc(-r * .25, -r * .25, r * .25, 0, Math.PI * 2); c.fillStyle = '#a3a1a6'; c.fill();
  c.restore();
}

/** A tentacle seen from above, curling out of the water. `rise` 0 to 1. */
function drawTentacle(c: CanvasRenderingContext2D, rise: number, t: number) {
  c.beginPath(); c.ellipse(0, 10, 54 * rise + 10, 26 * rise + 6, 0, 0, Math.PI * 2); c.fillStyle = '#ffffff77'; c.fill();
  c.save(); c.scale(rise, rise);
  const sway = Math.sin(t * 3) * 14;
  c.beginPath(); c.moveTo(-20, 14); c.quadraticCurveTo(-30 + sway, -40, 6 + sway, -70); c.quadraticCurveTo(34 + sway, -84, 26 + sway, -56); c.quadraticCurveTo(10 + sway, -44, 20, 14); c.closePath();
  c.fillStyle = '#8e4fc9'; c.fill(); outline(c);
  c.fillStyle = '#f0c8ff'; for (const [x, y] of [[-6, -6], [-6 + sway * .5, -28], [4 + sway, -50]] as const) { c.beginPath(); c.arc(x + 6, y, 5, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

/** The island ahead, from above, coming into view. */
function drawIslandTop(c: CanvasRenderingContext2D, isle: IslandDef, r: number) {
  c.beginPath(); c.ellipse(0, 0, r * 1.25, r * .7, 0, 0, Math.PI * 2); c.fillStyle = '#ffffff55'; c.fill();
  c.beginPath(); c.ellipse(0, 0, r * 1.1, r * .6, 0, 0, Math.PI * 2); c.fillStyle = isle.sand; c.fill(); outline(c, 6);
  c.beginPath(); c.ellipse(-r * .1, -r * .05, r * .7, r * .36, 0, 0, Math.PI * 2); c.fillStyle = isle.green; c.fill();
  for (const [x, y] of [[-.4, -.1], [.2, -.2], [.05, .1]] as const) {
    c.save(); c.translate(x * r, y * r);
    for (let i = 0; i < 5; i++) { c.save(); c.rotate((i / 5) * Math.PI * 2); c.beginPath(); c.ellipse(0, -r * .09, r * .05, r * .1, 0, 0, Math.PI * 2); c.fillStyle = '#3fa34d'; c.fill(); outline(c, 2); c.restore(); }
    c.restore();
  }
  c.strokeStyle = '#c81d25'; c.lineWidth = r * .06; c.beginPath(); c.moveTo(r * .35, r * .05); c.lineTo(r * .55, r * .25); c.moveTo(r * .55, r * .05); c.lineTo(r * .35, r * .25); c.stroke();
}

export function drawSail(c: CanvasRenderingContext2D, s: Sail, w: number, h: number, ship: Ship, isle: IslandDef, reduced: boolean, finger: { x: number; y: number } | null) {
  const k = h / 1000, W = s.width;
  c.save();
  const shake = reduced ? 0 : s.wobble * 6;
  c.translate((Math.random() - .5) * shake * k, (Math.random() - .5) * shake * k);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, isle.sea); g.addColorStop(1, '#0b4f86');
  c.fillStyle = g; c.fillRect(-20, -20, w + 40, h + 40);
  c.scale(k, k);
  // waves drifting down as he sails up
  c.strokeStyle = '#ffffff40'; c.lineWidth = 5; c.lineCap = 'round';
  const frac = (v: number) => v - Math.floor(v);
  for (let i = 0; i < 26; i++) {
    const x = frac(Math.sin(i * 12.9898) * 43758.5453) * W, y = ((frac(Math.sin(i * 78.233) * 12345.678) * 1100 + s.scroll * (1 + (i % 3) * .1)) % 1100) - 50;
    c.beginPath(); c.moveTo(x - 30, y); c.quadraticCurveTo(x - 15, y - 10, x, y); c.quadraticCurveTo(x + 15, y + 10, x + 30, y); c.stroke();
  }
  // the island, rising over the top
  if (s.t > SAIL_S - 4) {
    const k2 = Math.min(1, (s.t - (SAIL_S - 4)) / (4 + ARRIVE_S));
    c.save(); c.translate(W / 2, -260 + k2 * 520); drawIslandTop(c, isle, 160 + k2 * 260); c.restore();
  }
  // barrels glow with a ring, not shadowBlur: that's slow on an iPad
  for (const f of s.floaters) { c.save(); c.translate(f.x, f.y); if (f.kind === 'barrel') { c.beginPath(); c.arc(0, 0, f.r * 1.5, 0, Math.PI * 2); c.fillStyle = '#ffd23f55'; c.fill(); drawBarrel(c, f.r, f.spin); } else drawRock(c, f.r, f.spin, s.t); c.restore(); }
  for (const tt of s.tentacles) {
    if (tt.splashed !== null) continue;
    const rise = Math.min(1, tt.age / .8) * (tt.age > 4.4 ? Math.max(0, 1 - (tt.age - 4.4) / .6) : 1);
    c.save(); c.translate(tt.x, tt.y); drawTentacle(c, rise, s.t + tt.x); c.restore();
  }
  for (const sp of s.splashes) {
    c.save(); c.translate(sp.x, sp.y); c.fillStyle = `rgba(255,255,255,${1 - sp.age})`;
    const n = sp.big ? 10 : 6;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, d = 20 + sp.age * (sp.big ? 120 : 60); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * .7, (sp.big ? 18 : 10) * (1 - sp.age * .6), 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  for (const b of s.balls) { c.beginPath(); c.arc(b.x, b.y, 12, 0, Math.PI * 2); c.fillStyle = '#222'; c.fill(); outline(c, 3); }
  // where his finger is
  if (finger && s.t < SAIL_S) { c.beginPath(); c.arc(finger.x, finger.y, 30, 0, Math.PI * 2); c.lineWidth = 6; c.strokeStyle = '#ffffffaa'; c.stroke(); }
  // the ship, shrinking as it sails in to the island
  const arrive = s.t > SAIL_S ? Math.min(1, (s.t - SAIL_S) / ARRIVE_S) : 0;
  c.save(); c.translate(s.x, SHIP_Y - arrive * 260); c.rotate(s.heading + Math.sin(s.t * 30) * s.wobble * .12); c.scale(.95 - arrive * .4, .95 - arrive * .4);
  drawShipTop(c, ship, s.t);
  c.restore();
  c.restore();
}

// ---------- the island, from the side ----------

/** His ship from the side, small, at anchor: hull, masts, sails and flag in his colours. */
function drawShipSide(c: CanvasRenderingContext2D, ship: Ship, t: number) {
  const hull = rungOf(ship, 'hull'), sails = rungOf(ship, 'sails'), half = 80 + grow(hull, 24, 6), masts = hull === 0 ? [0] : hull === 1 ? [0] : hull === 2 ? [-.35, .3] : [-.5, 0, .45];
  c.rotate(Math.sin(t * 1.6) * .03);
  masts.forEach((m, i) => {
    const x = m * half, top = -110 - grow(hull, 20, 4) - (i === Math.floor(masts.length / 2) ? 20 : 0);
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, top); c.lineWidth = 8; c.strokeStyle = O; c.stroke();
    const sw = 30 + Math.min(sails, 3) * 8 + (sails > 3 ? 4 : 0);
    c.beginPath(); c.moveTo(x - sw, top + 16); c.quadraticCurveTo(x + 6, top + 6, x + sw, top + 16); c.lineTo(x + sw, top + 90); c.quadraticCurveTo(x + 6, top + 82, x - sw, top + 90); c.closePath();
    c.fillStyle = sails === 0 ? '#f4f6fa' : sails >= 4 ? clothOf(sails, i) : '#f4f1e8'; c.fill(); outline(c, 4);
    if (sails === 4) { c.fillStyle = '#d62828'; for (const k of [-.5, .1]) c.fillRect(x + sw * k, top + 14, sw * .3, 74); }
    if (i === Math.floor(masts.length / 2)) { c.beginPath(); c.moveTo(x, top); c.lineTo(x + 44, top + 8 + Math.sin(t * 6) * 3); c.lineTo(x, top + 24); c.closePath(); c.fillStyle = colourOf(ship.colour).cloth; c.fill(); outline(c, 3); }
  });
  c.beginPath(); c.moveTo(-half, -18); c.lineTo(-half + 14, 30); c.quadraticCurveTo(0, 40, half - 20, 30); c.lineTo(half + 12, -22); c.closePath();
  c.fillStyle = WOOD[hull]!; c.fill(); outline(c);
}

function drawPirate(c: CanvasRenderingContext2D, ship: Ship, t: number, moving: boolean, digging: number) {
  const step = moving ? Math.sin(t * 14) : 0, band = colourOf(ship.colour).cloth;
  // legs
  c.strokeStyle = O; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-8, -40); c.lineTo(-10 + step * 10, 0); c.moveTo(8, -40); c.lineTo(10 - step * 10, 0); c.stroke();
  // body: a striped shirt
  c.beginPath(); c.roundRect(-20, -86, 40, 50, 10); c.fillStyle = '#f4f1e8'; c.fill(); outline(c, 4);
  c.fillStyle = '#d62828'; for (const y of [-76, -60]) c.fillRect(-18, y, 36, 7);
  // arms (and the spade while digging)
  const dig = digging > 0 ? Math.sin(digging * Math.PI) : 0;
  c.strokeStyle = O; c.lineWidth = 8;
  c.beginPath(); c.moveTo(16, -78); c.lineTo(32 + dig * 6, -58 + dig * 20); c.stroke();
  if (digging >= 0) {
    c.save(); c.translate(32 + dig * 6, -58 + dig * 20); c.rotate(.5 + dig * .6);
    c.strokeStyle = '#8a5a2b'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 40); c.stroke();
    c.beginPath(); c.moveTo(-12, 40); c.lineTo(12, 40); c.lineTo(8, 60); c.lineTo(-8, 60); c.closePath(); c.fillStyle = '#9aa3ad'; c.fill(); outline(c, 3);
    c.restore();
  }
  // head, bandana in his flag's colour, eye patch
  c.beginPath(); c.arc(0, -104, 20, 0, Math.PI * 2); c.fillStyle = '#f2c79b'; c.fill(); outline(c, 4);
  c.beginPath(); c.arc(0, -108, 21, Math.PI, 0); c.lineTo(22, -104); c.lineTo(-22, -104); c.closePath(); c.fillStyle = band; c.fill(); outline(c, 4);
  c.beginPath(); c.moveTo(-20, -108); c.lineTo(-34, -96 + Math.sin(t * 6) * 3); c.lineTo(-30, -112); c.closePath(); c.fillStyle = band; c.fill(); outline(c, 3);
  c.beginPath(); c.arc(9, -100, 6, 0, Math.PI * 2); c.fillStyle = O; c.fill();
  c.beginPath(); c.moveTo(-16, -112); c.lineTo(18, -96); c.lineWidth = 3; c.strokeStyle = O; c.stroke();
  c.beginPath(); c.arc(-4, -98, 3, 0, Math.PI * 2); c.fillStyle = O; c.fill();
  c.beginPath(); c.arc(2, -92, 6, .2, Math.PI - .2); c.lineWidth = 3; c.stroke();
}

function drawCrab(c: CanvasRenderingContext2D, t: number, hidden: number) {
  const sink = hidden > 0 ? Math.min(1, hidden > 1.9 ? (2.2 - hidden) / .3 : hidden > .3 ? 1 : hidden / .3) : 0;
  c.save(); c.translate(0, sink * 30);
  c.strokeStyle = O; c.lineWidth = 4;
  for (const s of [-1, 1]) for (const k of [0, 1, 2]) { c.beginPath(); c.moveTo(s * 14, -10); c.lineTo(s * (26 + k * 6), 2 + Math.sin(t * 16 + k) * 3); c.stroke(); }
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 30, -30 + Math.sin(t * 5) * 3, 10, 0, Math.PI * 2); c.fillStyle = '#e8573a'; c.fill(); outline(c, 3); }
  c.beginPath(); c.ellipse(0, -14, 26, 16, 0, 0, Math.PI * 2); c.fillStyle = '#e8573a'; c.fill(); outline(c, 4);
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 8, -34, 5, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); outline(c, 2); c.beginPath(); c.arc(s * 8, -34, 2, 0, Math.PI * 2); c.fillStyle = O; c.fill(); }
  c.restore();
  if (sink > .5) { c.beginPath(); c.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2); c.fillStyle = '#c9a76a'; c.fill(); }
}

function drawChest(c: CanvasRenderingContext2D, rise: number, open: number, art: string, glow: string) {
  c.save(); c.translate(0, (1 - rise) * 60);
  if (open > 0) { c.save(); c.globalAlpha = open * .5; c.fillStyle = glow; c.beginPath(); c.arc(0, -70, 70 * open, 0, Math.PI * 2); c.fill(); c.globalAlpha = open; c.beginPath(); c.arc(0, -70, 46 * open, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.beginPath(); c.roundRect(-46, -48, 92, 48, 6); c.fillStyle = '#8a5a2b'; c.fill(); outline(c);
  c.fillStyle = '#ffd23f'; c.fillRect(-46, -30, 92, 8); c.fillRect(-6, -40, 12, 18);
  c.save(); c.translate(-46, -48); c.rotate(-open * 1.6);
  c.beginPath(); c.roundRect(0, -26, 92, 26, [14, 14, 2, 2]); c.fillStyle = '#9b6a35'; c.fill(); outline(c);
  c.restore();
  if (open > .3) { c.font = `${Math.round(70 * open)}px system-ui, sans-serif`; c.textAlign = 'center'; c.fillText(art, 0, -60 - open * 30); }
  c.restore();
}

/** The beach: the sea and his ship at anchor behind, palms, crabs, the X, his pirate. The camera follows him. */
export function drawIsland(c: CanvasRenderingContext2D, wk: Walk, w: number, h: number, ship: Ship, isle: IslandDef, digT: number, openT: number) {
  const k = h / VIEW_H, viewW = w / k, cam = Math.max(0, Math.min(BEACH - viewW, wk.x - viewW * .35));
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, isle.sky); sky.addColorStop(1, '#d6f0ff');
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  c.save(); c.scale(k, k);
  // sun and far sea
  c.beginPath(); c.arc(viewW - 90, 80, 40, 0, Math.PI * 2); c.fillStyle = '#ffd23f'; c.fill(); outline(c, 4);
  c.fillStyle = isle.sea; c.fillRect(0, GROUND_Y - 120, viewW, 120);
  c.translate(-cam, 0);
  // his ship at anchor, off the start of the beach
  c.save(); c.translate(90, GROUND_Y - 62); c.scale(.5, .5); drawShipSide(c, ship, wk.t); c.restore();
  // palms behind
  for (let x = 520; x < BEACH; x += 430) {
    const gy = GROUND_Y - dune(x) - 4;
    c.save(); c.translate(x, gy);
    c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-14, -90, 10, -170); c.lineTo(20, -168); c.quadraticCurveTo(4, -90, 10, 0); c.closePath(); c.fillStyle = '#9b6a35'; c.fill(); outline(c, 4);
    for (const a of [-2.6, -2, -1.2, -.6, 0]) { c.save(); c.translate(14, -170); c.rotate(a); c.beginPath(); c.ellipse(36, 0, 40, 11, 0, 0, Math.PI * 2); c.fillStyle = isle.green; c.fill(); outline(c, 3); c.restore(); }
    c.restore();
  }
  // the sand
  c.beginPath(); c.moveTo(-40, VIEW_H + 10);
  for (let x = -40; x <= BEACH + 40; x += 20) c.lineTo(x, GROUND_Y - dune(x));
  c.lineTo(BEACH + 40, VIEW_H + 10); c.closePath(); c.fillStyle = isle.sand; c.fill(); outline(c, 6);
  // the sea's edge where he landed
  c.beginPath(); c.moveTo(-40, GROUND_Y + 4); c.quadraticCurveTo(START_X - 120, GROUND_Y + 30, START_X - 70, VIEW_H + 10); c.lineTo(-40, VIEW_H + 10); c.closePath(); c.fillStyle = isle.sea; c.fill();
  // the X, then the hole and the chest
  c.save(); c.translate(X_AT + 50, GROUND_Y + 28);
  if (!wk.open) { c.strokeStyle = '#c81d25'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(-26, -14); c.lineTo(26, 14); c.moveTo(26, -14); c.lineTo(-26, 14); c.stroke(); }
  if (wk.dug > 0) { c.beginPath(); c.ellipse(0, 0, 30 + wk.dug * 10, 10 + wk.dug * 3, 0, 0, Math.PI * 2); c.fillStyle = '#8a6a3a'; c.fill(); c.beginPath(); c.ellipse(70, -6, 18 + wk.dug * 8, 10 + wk.dug * 6, 0, Math.PI, 0); c.fillStyle = '#c9a76a'; c.fill(); outline(c, 3); }
  if (wk.open) drawChest(c, Math.min(1, openT / .8), Math.max(0, Math.min(1, (openT - .8) / .7)), isle.art, isle.glow);
  c.restore();
  for (const cr of wk.crabs) { c.save(); c.translate(cr.x, GROUND_Y - dune(cr.x) + 4); drawCrab(c, wk.t, cr.hidden); c.restore(); }
  // his pirate
  c.save(); c.translate(wk.x, GROUND_Y - dune(wk.x) - wk.y + 2);
  if (wk.bump > 0) c.rotate(-.15);
  drawPirate(c, ship, wk.t, Math.abs(wk.vx) > 20 && wk.y === 0, wk.atX ? digT : -1);
  c.restore();
  c.restore();
}
