// The Port drawn on a canvas, from the front: the sky and the far hills, the concrete land with his buildings along the back, the yard with
// its stacks, the rail line and the gate in the middle, the quay with his cranes along the front, and his ships at their berths in the
// water. Every piece has a fixed place (port/plot.ts) and its own drawing. "Watch it run" draws the same port and moves things on it.
//
// It is drawn in two layers, so a busy port stays cheap on an iPad 9: `drawPortStatic` (everything that never moves) is drawn once into a
// cache when the port or the screen changes (port/PortView.tsx), and `drawPortLive` (the waves, the lighthouse beam, the wind turbine, the
// radar, the train and the lorries, the cranes and the ships) is drawn over it every frame. At most DRAW_MOST of each again-and-again thing
// is drawn; the rest are counted, not drawn.
import { pick, seeded } from '../../game/rng';
import { BOX_COLOURS, DECOR, PIECES, SHIP_SHAPES } from '../port/catalog';
import { boxLooks, craneLook, fleetKinds, has, shipLook, type PortState } from '../port/port';
import { CRATES, SPECIALS } from '../port/sea';
import { BERTH_X, DECOR_STEP, DECOR_X0, DECOR_Y, DRAW_MOST, LAND_Y, PLACES, PLOT_W, QUAY_Y, SEA_Y, type Place } from '../port/plot';
import { drawBox, shade, type BoxLook } from './container';
import { drawCraneSide } from './crane';
import { drawShip, type ShipLook } from './ship';

export interface Moving {
  /** Ships coming in or going out: which berth, how far out (0 moored, 1 off screen) and its look. */
  ships: { berth: number; out: number; look: ShipLook; boxes: number }[];
  /** The train's place along the rail (0 to 1, or null) and the lorries' (each 0 to 1). */
  train: number | null;
  lorries: number[];
  /** Each crane's trolley place along its boom, 0 to 1. */
  trolleys: number[];
}

const INK = '#141414', SKY_TOP = '#5fb6e8', SKY_LOW = '#d6f0fb', SEA = '#1f9a8a', SEA_DEEP = '#11695f', CONCRETE = '#c5cacd', QUAY_FACE = '#7b838a';
const WALL = 3;
const own = (p: PortState, id: string) => has(p, id);

// ---------- small drawing helpers ----------
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, line = WALL) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (line) { ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.strokeRect(x, y, w, h); }
}
function poly(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: string, line = WALL) {
  ctx.beginPath(); ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, line = WALL) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.stroke(); }
}
function windows(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rows: number, cols: number, glass = '#2a5276') {
  const gw = w / cols, gh = h / rows;
  ctx.fillStyle = glass;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.fillRect(x + c * gw + gw * 0.22, y + r * gh + gh * 0.2, gw * 0.56, gh * 0.55);
}
function line(ctx: CanvasRenderingContext2D, pts: readonly number[], colour = INK, width = WALL) {
  ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.stroke();
}
/** A roller door with its stripes. */
function rollerDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, '#8d969e', 2);
  ctx.fillStyle = '#6b737b'; for (let yy = y + 4; yy < y + h; yy += 5) ctx.fillRect(x + 1, yy, w - 2, 1.5);
}
/** A gabled building: walls, a pitched roof, and whatever goes on its front. */
function gabled(ctx: CanvasRenderingContext2D, pl: Place, wall: string, roof: string, pitch = 0.3) {
  const rh = pl.h * pitch;
  rect(ctx, pl.x, pl.y + rh, pl.w, pl.h - rh, wall);
  poly(ctx, [pl.x - 4, pl.y + rh, pl.x + pl.w / 2, pl.y, pl.x + pl.w + 4, pl.y + rh], roof);
}
function flatRoofed(ctx: CanvasRenderingContext2D, pl: Place, wall: string, roof = '#5b636b') {
  rect(ctx, pl.x, pl.y + 5, pl.w, pl.h - 5, wall);
  rect(ctx, pl.x - 3, pl.y, pl.w + 6, 7, roof);
}
function door(ctx: CanvasRenderingContext2D, x: number, bottom: number, w = 12, h = 18, fill = '#3a5f86') { rect(ctx, x, bottom - h, w, h, fill, 2); }
function sign(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) { rect(ctx, x, y, w, h, fill, 2); }

// ---------- each piece's drawing ----------
type Drawer = (ctx: CanvasRenderingContext2D, pl: Place, p: PortState) => void;
const PIECE_ART: Record<string, Drawer> = {
  'piece:office': (c, pl) => { flatRoofed(c, pl, '#efe6cf'); windows(c, pl.x + 4, pl.y + 10, pl.w - 8, pl.h - 30, 2, 4); sign(c, pl.x + 8, pl.y + pl.h - 26, pl.w - 16, 8, '#2f6fe0'); door(c, pl.x + pl.w / 2 - 7, pl.y + pl.h, 14, 16); },
  'piece:clock': (c, pl) => {
    rect(c, pl.x, pl.y + 24, pl.w, pl.h - 24, '#d9c9a3'); poly(c, [pl.x - 3, pl.y + 26, pl.x + pl.w / 2, pl.y, pl.x + pl.w + 3, pl.y + 26], '#9b2a22');
    disc(c, pl.x + pl.w / 2, pl.y + 42, 12, '#fffdf2', 2.5); line(c, [pl.x + pl.w / 2, pl.y + 42, pl.x + pl.w / 2, pl.y + 34], INK, 2.5); line(c, [pl.x + pl.w / 2, pl.y + 42, pl.x + pl.w / 2 + 6, pl.y + 42], INK, 2.5);
    windows(c, pl.x + 6, pl.y + 62, pl.w - 12, 36, 2, 1); door(c, pl.x + pl.w / 2 - 6, pl.y + pl.h, 12, 14);
  },
  'piece:customs': (c, pl) => {
    rect(c, pl.x, pl.y + 22, pl.w, pl.h - 22, '#e4e2ea'); poly(c, [pl.x - 4, pl.y + 24, pl.x + pl.w / 2, pl.y, pl.x + pl.w + 4, pl.y + 24], '#b9b6c6');
    for (let i = 0; i < 4; i++) rect(c, pl.x + 7 + i * ((pl.w - 20) / 3), pl.y + 28, 6, pl.h - 36, '#ffffff', 2);
    rect(c, pl.x - 3, pl.y + pl.h - 6, pl.w + 6, 6, '#a9a6b6', 2);
  },
  'piece:canteen': (c, pl) => {
    rect(c, pl.x, pl.y + 8, pl.w, pl.h - 8, '#f4c7a1'); windows(c, pl.x + 4, pl.y + 22, pl.w - 22, 18, 1, 2);
    for (let i = 0; i < 6; i++) poly(c, [pl.x - 2 + i * (pl.w + 4) / 6, pl.y + 8, pl.x - 2 + (i + 1) * (pl.w + 4) / 6, pl.y + 8, pl.x - 2 + (i + 1) * (pl.w + 4) / 6, pl.y + 18, pl.x - 2 + i * (pl.w + 4) / 6, pl.y + 18], i % 2 ? '#ffffff' : '#e63946', 1.5);
    door(c, pl.x + pl.w - 16, pl.y + pl.h, 11, 16);
  },
  'piece:watertower': (c, pl) => {
    line(c, [pl.x + 6, pl.y + pl.h, pl.x + 10, pl.y + 46, pl.x + pl.w - 10, pl.y + 46, pl.x + pl.w - 6, pl.y + pl.h], INK, 4);
    line(c, [pl.x + 8, pl.y + 75, pl.x + pl.w - 8, pl.y + 75], INK, 2.5);
    rect(c, pl.x, pl.y + 14, pl.w, 34, '#a7b6c4'); poly(c, [pl.x - 2, pl.y + 14, pl.x + pl.w / 2, pl.y, pl.x + pl.w + 2, pl.y + 14], '#6b7a8f');
  },
  'piece:weather': (c, pl) => {
    rect(c, pl.x, pl.y + 26, pl.w, pl.h - 26, '#ffffff'); c.fillStyle = '#c9ced3'; for (let y = pl.y + 30; y < pl.y + pl.h - 2; y += 5) c.fillRect(pl.x + 2, y, pl.w - 4, 2);
    line(c, [pl.x + pl.w / 2, pl.y + 26, pl.x + pl.w / 2, pl.y + 4], INK, 2.5);
    poly(c, [pl.x + pl.w / 2, pl.y + 4, pl.x + pl.w + 8, pl.y + 7, pl.x + pl.w / 2, pl.y + 12], '#ff7a00', 2);
  },
  'piece:signal': (c, pl) => {
    const mx = pl.x + pl.w / 2;
    line(c, [mx, pl.y + pl.h, mx, pl.y], INK, 5); line(c, [mx - 14, pl.y + 16, mx + 14, pl.y + 16], INK, 3);
    poly(c, [mx - 12, pl.y + 18, mx - 2, pl.y + 26, mx - 12, pl.y + 34], '#e63946', 2); poly(c, [mx + 12, pl.y + 18, mx + 2, pl.y + 26, mx + 12, pl.y + 34], '#ffcc00', 2);
    rect(c, mx - 8, pl.y + 40, 16, 12, '#2f6fe0', 2);
  },
  'piece:radar': (c, pl) => {
    const mx = pl.x + pl.w / 2;
    poly(c, [mx - 14, pl.y + pl.h, mx - 4, pl.y + 22, mx + 4, pl.y + 22, mx + 14, pl.y + pl.h], '#c0c8d0');
    line(c, [mx - 10, pl.y + 80, mx + 8, pl.y + 56, mx - 6, pl.y + 38, mx + 4, pl.y + 26], '#6b737b', 2);
    rect(c, mx - 7, pl.y + 14, 14, 10, '#e9ecef', 2);
  },
  'piece:shed': (c, pl) => { gabled(c, pl, '#c98a58', '#8a4b2a', 0.32); rollerDoor(c, pl.x + 12, pl.y + pl.h - 34, 34, 34); rollerDoor(c, pl.x + 58, pl.y + pl.h - 34, 34, 34); },
  'piece:bigshed': (c, pl) => {
    rect(c, pl.x, pl.y + 18, pl.w, pl.h - 18, '#a77b55');
    for (let i = 0; i < 4; i++) { const x = pl.x + i * (pl.w / 4); poly(c, [x, pl.y + 18, x + pl.w / 4, pl.y + 18, x + pl.w / 4, pl.y], '#6b4b3a'); c.fillStyle = '#9fd6f2'; c.fillRect(x + pl.w / 4 - 5, pl.y + 4, 3, 13); }
    rollerDoor(c, pl.x + 14, pl.y + pl.h - 40, 46, 40); rollerDoor(c, pl.x + 80, pl.y + pl.h - 40, 46, 40);
  },
  'piece:coldstore': (c, pl) => {
    flatRoofed(c, pl, '#eef8ff', '#8fb8d6'); rect(c, pl.x, pl.y + 20, pl.w, 8, '#3da5ff', 2);
    for (let i = 0; i < 3; i++) disc(c, pl.x + 14 + i * 24, pl.y - 4, 7, '#c9ced3', 2);
    rollerDoor(c, pl.x + pl.w / 2 - 16, pl.y + pl.h - 26, 32, 26);
  },
  'piece:solar': (c, pl) => { rect(c, pl.x, pl.y, pl.w, pl.h, '#243f73', 2); c.fillStyle = '#5d86c7'; for (let x = pl.x + 6; x < pl.x + pl.w; x += 12) c.fillRect(x, pl.y + 1, 1.5, pl.h - 2); },
  'piece:silo': (c, pl) => {
    for (const [dx, w] of [[0, 24], [22, 24]] as const) { rect(c, pl.x + dx, pl.y + 14, w, pl.h - 14, '#e2c98a'); c.beginPath(); c.ellipse(pl.x + dx + w / 2, pl.y + 14, w / 2, 12, 0, Math.PI, 0); c.fillStyle = '#c9a85e'; c.fill(); c.strokeStyle = INK; c.lineWidth = WALL; c.stroke(); }
    line(c, [pl.x + 2, pl.y + 60, pl.x + pl.w - 2, pl.y + 60], '#a98848', 2); line(c, [pl.x + 2, pl.y + 90, pl.x + pl.w - 2, pl.y + 90], '#a98848', 2);
  },
  'piece:oiltanks': (c, pl) => {
    for (const [dx, w, h] of [[0, 34, 44], [30, 30, 58], [58, 32, 40]] as const) { rect(c, pl.x + dx, pl.y + pl.h - h, w, h, '#e1e3e6'); rect(c, pl.x + dx, pl.y + pl.h - h, w, 6, '#e63946', 2); }
  },
  'piece:wind': (c, pl) => { poly(c, [pl.x + pl.w / 2 - 6, pl.y + pl.h, pl.x + pl.w / 2 - 2, pl.y + 24, pl.x + pl.w / 2 + 2, pl.y + 24, pl.x + pl.w / 2 + 6, pl.y + pl.h], '#f4f4f4'); },
  'piece:pilot': (c, pl) => {
    rect(c, pl.x, pl.y + 22, pl.w, pl.h - 22, '#f2f2f2'); windows(c, pl.x + 4, pl.y + 28, pl.w - 8, 10, 1, 3); door(c, pl.x + 6, pl.y + pl.h, 11, 12);
    rect(c, pl.x + pl.w - 24, pl.y + 2, 20, 20, '#2f6fe0'); c.fillStyle = '#bfe7f5'; c.fillRect(pl.x + pl.w - 21, pl.y + 6, 14, 8);
  },
  'piece:coastguard': (c, pl) => {
    flatRoofed(c, pl, '#ffffff'); poly(c, [pl.x, pl.y + pl.h - 10, pl.x + pl.w * 0.55, pl.y + 10, pl.x + pl.w * 0.75, pl.y + 10, pl.x + pl.w * 0.2, pl.y + pl.h - 10], '#ff7a00', 0);
    poly(c, [pl.x + pl.w * 0.25, pl.y + pl.h - 10, pl.x + pl.w * 0.8, pl.y + 10, pl.x + pl.w * 0.88, pl.y + 10, pl.x + pl.w * 0.36, pl.y + pl.h - 10], '#2f6fe0', 0);
    c.strokeStyle = INK; c.lineWidth = WALL; c.strokeRect(pl.x, pl.y + 5, pl.w, pl.h - 5); door(c, pl.x + pl.w - 16, pl.y + pl.h, 12, 16);
  },
  'piece:rescue': (c, pl) => { gabled(c, pl, '#e63946', '#8b1e24', 0.35); disc(c, pl.x + pl.w / 2, pl.y + pl.h * 0.62, 9, '#ffffff', 2.5); disc(c, pl.x + pl.w / 2, pl.y + pl.h * 0.62, 4, '#e63946', 2); },
  'piece:lighthouse': (c, pl) => {
    const cx = pl.x + pl.w / 2;
    poly(c, [pl.x + 2, pl.y + pl.h, cx - 9, pl.y + 34, cx + 9, pl.y + 34, pl.x + pl.w - 2, pl.y + pl.h], '#ffffff');
    c.save(); c.beginPath(); c.moveTo(pl.x + 2, pl.y + pl.h); c.lineTo(cx - 9, pl.y + 34); c.lineTo(cx + 9, pl.y + 34); c.lineTo(pl.x + pl.w - 2, pl.y + pl.h); c.closePath(); c.clip();
    c.fillStyle = '#e63946'; for (let y = pl.y + 50; y < pl.y + pl.h; y += 36) c.fillRect(pl.x - 4, y, pl.w + 8, 16);
    c.restore(); c.strokeStyle = INK; c.lineWidth = WALL; c.beginPath(); c.moveTo(pl.x + 2, pl.y + pl.h); c.lineTo(cx - 9, pl.y + 34); c.lineTo(cx + 9, pl.y + 34); c.lineTo(pl.x + pl.w - 2, pl.y + pl.h); c.stroke();
    rect(c, cx - 13, pl.y + 30, 26, 5, '#3a3f44', 2); rect(c, cx - 8, pl.y + 14, 16, 16, '#fff4a8', 2); poly(c, [cx - 11, pl.y + 14, cx, pl.y + 2, cx + 11, pl.y + 14], '#e63946', 2);
  },
  'piece:harbourlights': (c, pl) => { for (const dx of [2, 14]) { line(c, [pl.x + dx + 2, pl.y + pl.h, pl.x + dx + 2, pl.y + 8], INK, 3); } },
  'piece:yard': (c, pl) => yardFloor(c, pl), 'piece:bigyard': (c, pl) => yardFloor(c, pl),
  'piece:reefer': (c, pl) => { for (let x = pl.x + 6; x < pl.x + pl.w; x += 22) { rect(c, x, pl.y, 8, pl.h + 2, '#3da5ff', 2); } },
  'piece:straddle': (c, pl) => {
    const x = pl.x, y = pl.y;
    drawBox(c, x + 9, y + 26, 32, 16, { hex: '#2f6fe0', stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    for (const lx of [x + 4, x + pl.w - 10]) rect(c, lx, y + 8, 6, pl.h - 14, '#ffcc00', 2);
    rect(c, x, y + 4, pl.w, 8, '#ffcc00', 2); rect(c, x + pl.w - 16, y - 6, 14, 12, '#ffcc00', 2); c.fillStyle = '#9fd6f2'; c.fillRect(x + pl.w - 13, y - 3, 8, 5);
    disc(c, x + 7, y + pl.h - 4, 5, '#222', 2); disc(c, x + pl.w - 7, y + pl.h - 4, 5, '#222', 2);
  },
  'piece:stacker': (c, pl) => {
    const x = pl.x, y = pl.y;
    rect(c, x + 2, y + 26, pl.w - 6, 12, '#ff7a00'); rect(c, x + 6, y + 14, 14, 12, '#ff7a00'); c.fillStyle = '#9fd6f2'; c.fillRect(x + 9, y + 17, 8, 6);
    line(c, [x + 20, y + 28, x + pl.w + 4, y + 2], INK, 8); line(c, [x + 20, y + 28, x + pl.w + 4, y + 2], '#ffb347', 5);
    drawBox(c, x + pl.w - 18, y - 12, 30, 15, { hex: '#c8452f', stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    disc(c, x + 10, y + pl.h - 6, 6, '#222', 2); disc(c, x + pl.w - 12, y + pl.h - 6, 6, '#222', 2);
  },
  'piece:repair': (c, pl) => {
    rect(c, pl.x, pl.y + 10, pl.w, pl.h - 10, '#6b7a8f'); rect(c, pl.x + 6, pl.y + 20, pl.w - 12, pl.h - 20, '#30363d', 2);
    drawBox(c, pl.x + 9, pl.y + pl.h - 18, pl.w - 18, 18, { hex: '#2f9a55', stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    rect(c, pl.x - 2, pl.y + 4, pl.w + 4, 8, '#ffcc00', 2);
  },
  'piece:paintshop': (c, pl) => {
    rect(c, pl.x, pl.y + 10, pl.w, pl.h - 10, '#fbe3f0'); rollerDoor(c, pl.x + 10, pl.y + pl.h - 28, pl.w - 20, 28);
    const cols = ['#e63946', '#ffcc00', '#2f6fe0', '#2fa84f', '#ff6fb5'];
    cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(pl.x + i * (pl.w / 5), pl.y + 4, pl.w / 5, 10); c.beginPath(); c.arc(pl.x + i * (pl.w / 5) + pl.w / 10, pl.y + 14, 3, 0, 7); c.fill(); });
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(pl.x, pl.y + 4, pl.w, 10);
  },
  'piece:rail': (c, pl) => {
    c.fillStyle = '#7d6a5a'; c.fillRect(pl.x, pl.y + 3, pl.w, pl.h - 3);
    c.fillStyle = '#5a4637'; for (let x = pl.x + 2; x < pl.x + pl.w; x += 12) c.fillRect(x, pl.y + 3, 6, pl.h - 3);
    c.fillStyle = '#c9ced3'; c.fillRect(pl.x, pl.y + 2, pl.w, 3); c.fillStyle = INK; c.fillRect(pl.x, pl.y + 5, pl.w, 1);
  },
  'piece:gate': (c, pl) => {
    rect(c, pl.x, pl.y + 10, 24, pl.h - 10, '#ffcc00'); c.fillStyle = '#9fd6f2'; c.fillRect(pl.x + 4, pl.y + 16, 16, 10);
    rect(c, pl.x - 3, pl.y + 6, 30, 6, '#3a3f44', 2);
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e63946'; c.fillRect(pl.x + 24 + i * 9, pl.y + 30, 9, 5); }
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(pl.x + 24, pl.y + 30, 45, 5);
  },
  'piece:weigh': (c, pl) => { rect(c, pl.x + pl.w - 14, pl.y - 6, 12, pl.h + 6, '#3a3f44', 2); c.fillStyle = '#7dff6a'; c.fillRect(pl.x + pl.w - 12, pl.y - 3, 8, 5); },
  'piece:carpark': (c, pl) => {
    rect(c, pl.x, pl.y + 10, pl.w, pl.h - 10, '#7e858c', 2);
    c.fillStyle = '#ffffff'; for (let x = pl.x + 4; x < pl.x + pl.w; x += 22) c.fillRect(x, pl.y + 14, 2, pl.h - 18);
    const cars = ['#e63946', '#2f6fe0', '#ffcc00', '#ffffff', '#2fa84f'];
    cars.forEach((col, i) => { const x = pl.x + 7 + i * 22; rect(c, x, pl.y + 30, 15, 10, col, 2); rect(c, x + 3, pl.y + 24, 9, 7, col, 2); });
    rect(c, pl.x + 4, pl.y - 10, 18, 18, '#2f6fe0', 2); c.fillStyle = '#ffffff'; c.font = '900 14px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', pl.x + 13, pl.y);
  },
  'piece:busstop': (c, pl) => { rect(c, pl.x + 4, pl.y + 10, pl.w - 4, 4, '#3a3f44', 2); rect(c, pl.x + 6, pl.y + 14, pl.w - 8, pl.h - 14, '#bfe7f588', 2); line(c, [pl.x + 2, pl.y + pl.h, pl.x + 2, pl.y - 6], INK, 3); disc(c, pl.x + 2, pl.y - 8, 6, '#2f6fe0', 2); },
  'piece:shipyard': (c, pl) => {
    poly(c, [pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h - 8, pl.x, pl.y + pl.h - 22], '#8d969e');
    for (let i = 0; i < 7; i++) { const x = pl.x + 16 + i * 10; line(c, [x, pl.y + pl.h - 18 + i * 0.8, x, pl.y + 36 + Math.abs(i - 3) * 3], '#8a4b2a', 3); }
    line(c, [pl.x + 14, pl.y + 38, pl.x + 86, pl.y + 38], '#8a4b2a', 3);
    line(c, [pl.x + pl.w - 6, pl.y + pl.h, pl.x + pl.w - 6, pl.y + 4, pl.x + 20, pl.y + 4], INK, 5); line(c, [pl.x + pl.w - 6, pl.y + pl.h, pl.x + pl.w - 6, pl.y + 4, pl.x + 20, pl.y + 4], '#ffcc00', 3);
  },
  'piece:fishmarket': (c, pl) => {
    rect(c, pl.x, pl.y + 22, pl.w, pl.h - 22, '#ffffff');
    for (let i = 0; i < 5; i++) poly(c, [pl.x - 2 + i * (pl.w + 4) / 5, pl.y + 10, pl.x - 2 + (i + 1) * (pl.w + 4) / 5, pl.y + 10, pl.x - 2 + (i + 1) * (pl.w + 4) / 5, pl.y + 24, pl.x - 2 + i * (pl.w + 4) / 5, pl.y + 24], i % 2 ? '#ffffff' : '#2f6fe0', 1.5);
    c.beginPath(); c.ellipse(pl.x + pl.w / 2 - 2, pl.y + 44, 13, 7, 0, 0, 7); c.fillStyle = '#68c3f5'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    poly(c, [pl.x + pl.w / 2 + 10, pl.y + 44, pl.x + pl.w / 2 + 18, pl.y + 38, pl.x + pl.w / 2 + 18, pl.y + 50], '#68c3f5', 2);
  },
  'piece:ice': (c, pl) => { flatRoofed(c, pl, '#eef8ff', '#8fb8d6'); for (let i = 0; i < 3; i++) rect(c, pl.x + 6 + i * 15, pl.y + pl.h - 12, 12, 12, '#bfe7ff', 2); },
  'piece:tugshed': (c, pl) => {
    gabled(c, pl, '#b57a45', '#6b4b3a', 0.36);
    c.beginPath(); c.moveTo(pl.x + 14, pl.y + pl.h); c.lineTo(pl.x + 14, pl.y + 30); c.arc(pl.x + pl.w / 2, pl.y + 30, pl.w / 2 - 14, Math.PI, 0); c.lineTo(pl.x + pl.w - 14, pl.y + pl.h); c.fillStyle = '#3a2a1a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  },
  'piece:ferrypier': (c, pl) => {
    rect(c, pl.x, pl.y + 14, pl.w, pl.h - 14, '#bfe7f5'); c.fillStyle = '#6aa9c9'; for (let x = pl.x + 10; x < pl.x + pl.w; x += 12) c.fillRect(x, pl.y + 16, 2, pl.h - 18);
    c.beginPath(); c.moveTo(pl.x - 4, pl.y + 16); c.quadraticCurveTo(pl.x + pl.w / 4, pl.y, pl.x + pl.w / 2, pl.y + 10); c.quadraticCurveTo(pl.x + pl.w * 0.75, pl.y + 20, pl.x + pl.w + 4, pl.y + 6); c.lineTo(pl.x + pl.w + 4, pl.y + 16); c.closePath();
    c.fillStyle = '#f4f4f0'; c.fill(); c.strokeStyle = INK; c.lineWidth = WALL; c.stroke();
    c.strokeRect(pl.x, pl.y + 14, pl.w, pl.h - 14);
  },
  'piece:longquay': (c, pl) => { c.fillStyle = '#b3b9bd'; c.fillRect(pl.x, pl.y, pl.w, pl.h); },
  'piece:deepquay': (c, pl) => { c.fillStyle = '#5b636b'; c.fillRect(pl.x, pl.y, pl.w, pl.h); c.fillStyle = '#ffcc00'; c.fillRect(pl.x, pl.y, pl.w, 2); },
  'piece:rails': (c, pl) => { c.fillStyle = '#3a3f44'; c.fillRect(pl.x, pl.y, pl.w, 2.5); c.fillRect(pl.x, pl.y + 5, pl.w, 2.5); },
  'piece:bollards': (c, pl) => { for (let x = pl.x + 10; x < pl.x + pl.w; x += 48) { rect(c, x, pl.y, 7, pl.h + 4, '#2b2b2b', 0); c.fillStyle = '#2b2b2b'; c.fillRect(x - 2, pl.y - 2, 11, 3); } },
  'piece:fenders': (c, pl) => { for (let x = pl.x + 16; x < pl.x + pl.w; x += 56) rect(c, x, pl.y, 10, pl.h + 6, '#1b1b1b', 0); },
  'piece:floodlights': (c, pl) => { line(c, [pl.x + pl.w / 2, pl.y + pl.h, pl.x + pl.w / 2, pl.y + 8], INK, 4); rect(c, pl.x + 2, pl.y, pl.w - 4, 10, '#3a3f44', 2); c.fillStyle = '#fff6b0'; for (let i = 0; i < 3; i++) c.fillRect(pl.x + 5 + i * 7, pl.y + 3, 5, 5); },
  'piece:fuel': (c, pl) => {
    rect(c, pl.x, pl.y + 12, 34, pl.h - 12, '#ffcc00'); c.fillStyle = '#9fd6f2'; c.fillRect(pl.x + 5, pl.y + 17, 24, 8);
    for (const dx of [42, 56]) { rect(c, pl.x + dx, pl.y + 18, 10, pl.h - 18, '#e63946', 2); }
    line(c, [pl.x + 61, pl.y + 24, pl.x + pl.w + 6, pl.y + pl.h + 8], INK, 2.5);
  },
  'piece:drydock': (c, pl) => {
    rect(c, pl.x, pl.y + 10, pl.w, pl.h - 10, '#5b636b');
    for (let i = 0; i < 3; i++) { c.fillStyle = shade('#5b636b', -0.15 * (i + 1)); c.fillRect(pl.x + 6 + i * 6, pl.y + 14 + i * 7, pl.w - 12 - i * 12, pl.h - 18 - i * 7); }
    c.beginPath(); c.moveTo(pl.x + 30, pl.y + 24); c.lineTo(pl.x + 96, pl.y + 24); c.quadraticCurveTo(pl.x + 104, pl.y + 32, pl.x + 92, pl.y + 42); c.lineTo(pl.x + 36, pl.y + 42); c.closePath();
    c.fillStyle = '#a3322a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.strokeRect(pl.x, pl.y + 10, pl.w, pl.h - 10);
  },
  'piece:ramp': (c, pl) => {
    poly(c, [pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, pl.x + pl.w, pl.y + 16], '#c9b38a');
    c.beginPath(); c.moveTo(pl.x + 14, pl.y + 18); c.lineTo(pl.x + 42, pl.y + 18); c.quadraticCurveTo(pl.x + 40, pl.y + 28, pl.x + 30, pl.y + 28); c.lineTo(pl.x + 18, pl.y + 28); c.closePath();
    c.fillStyle = '#e63946'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  },
  'piece:breakwater': (c, pl) => {
    const rocks = [[10, 14, 16], [34, 10, 18], [60, 16, 15], [86, 9, 19], [112, 14, 16], [136, 12, 14]] as const;
    for (const [dx, dy, r] of rocks) { c.beginPath(); c.ellipse(pl.x + dx, pl.y + dy + 8, r, r * 0.75, 0, 0, 7); c.fillStyle = '#8d969e'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); }
    rect(c, pl.x + pl.w - 24, pl.y - 26, 10, 28, '#e63946', 2); c.fillStyle = '#ffffff'; c.fillRect(pl.x + pl.w - 23, pl.y - 14, 8, 6);
  },
  'piece:foghorn': (c, pl) => { line(c, [pl.x + 10, pl.y + pl.h, pl.x + 10, pl.y + 14], INK, 4); poly(c, [pl.x + 4, pl.y + 10, pl.x + 16, pl.y + 4, pl.x + 16, pl.y + 22, pl.x + 4, pl.y + 16], '#e63946', 2); },
};
function yardFloor(c: CanvasRenderingContext2D, pl: Place) {
  c.fillStyle = '#b2b8bd'; c.fillRect(pl.x, pl.y, pl.w, pl.h);
  c.fillStyle = '#ffcc00'; for (let x = pl.x + 4; x < pl.x + pl.w; x += 30) c.fillRect(x, pl.y + pl.h - 6, 22, 2);
  c.strokeStyle = '#8d969e'; c.lineWidth = 2; c.strokeRect(pl.x, pl.y, pl.w, pl.h);
}

/** The sky, the sea and the far hills, wide enough to fill any screen the port is drawn on (drawn each frame behind the cached port). */
export function drawPortBackdrop(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  const sky = ctx.createLinearGradient(0, -200, 0, LAND_Y);
  sky.addColorStop(0, SKY_TOP); sky.addColorStop(1, SKY_LOW);
  ctx.fillStyle = sky; ctx.fillRect(x0, y0, x1 - x0, LAND_Y - y0 + 1);
  const sea = ctx.createLinearGradient(0, QUAY_Y, 0, QUAY_Y + 260);
  sea.addColorStop(0, SEA); sea.addColorStop(1, SEA_DEEP);
  ctx.fillStyle = sea; ctx.fillRect(x0, QUAY_Y, x1 - x0, y1 - QUAY_Y);
  // clouds in the open sky above the port
  ctx.fillStyle = '#ffffffd0';
  for (let i = 0; i < 8; i++) {
    const cx = x0 + ((i * 397) % 1000) / 1000 * (x1 - x0), cy = Math.max(y0 + 30, -40) + ((i * 173) % 90) + (i % 2) * 40;
    if (cy > LAND_Y - 70) continue;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.arc(cx + 20, cy - 8, 20, 0, 7); ctx.arc(cx + 42, cy, 15, 0, 7); ctx.fill();
  }
  // the far hills
  ctx.fillStyle = '#93b8ad';
  ctx.beginPath(); ctx.moveTo(x0, LAND_Y);
  for (let x = Math.floor(x0 / 60) * 60; x <= x1 + 60; x += 60) ctx.lineTo(x, LAND_Y - 34 - 16 * Math.sin(x * 0.011) - 10 * Math.sin(x * 0.027));
  ctx.lineTo(x1, LAND_Y); ctx.fill();
  ctx.fillStyle = CONCRETE; ctx.fillRect(x0, LAND_Y, x1 - x0, QUAY_Y - LAND_Y);
  // the quay's edge: the cap with its yellow safety line, then the quay wall down into the water, and the sea in its shadow
  ctx.fillStyle = '#9aa1a8'; ctx.fillRect(x0, QUAY_Y - 20, x1 - x0, 20);
  ctx.fillStyle = '#ffcc00'; ctx.fillRect(x0, QUAY_Y - 6, x1 - x0, 3);
  ctx.fillStyle = QUAY_FACE; ctx.fillRect(x0, QUAY_Y, x1 - x0, 14);
  ctx.fillStyle = '#0f5c5755'; ctx.fillRect(x0, QUAY_Y + 15, x1 - x0, 10);
  line(ctx, [x0, LAND_Y, x1, LAND_Y], INK, 3); line(ctx, [x0, QUAY_Y - 20, x1, QUAY_Y - 20], INK, 3); line(ctx, [x0, QUAY_Y, x1, QUAY_Y], INK, 3); line(ctx, [x0, QUAY_Y + 14, x1, QUAY_Y + 14], INK, 3);
}

/** Everything in the port that doesn't move, in plot units. */
export function drawPortStatic(ctx: CanvasRenderingContext2D, p: PortState) {
  // more warehouses, behind the back row
  for (let i = 0; i < Math.min(DRAW_MOST.shed, p.more.shed); i++) gabled(ctx, { x: 440 + i * 112, y: LAND_Y - 52, w: 100, h: 52, colour: '' }, shade('#c98a58', -0.1), '#6b4b3a', 0.3);
  // slab joints and painted lanes on the land
  ctx.fillStyle = '#b6bbbf'; for (let x = 0; x < PLOT_W; x += 80) ctx.fillRect(x, LAND_Y, 1.5, QUAY_Y - LAND_Y - 20);
  ctx.fillRect(0, 176, PLOT_W, 1.5); ctx.fillRect(0, 282, PLOT_W, 1.5);
  ctx.fillStyle = '#ffffffaa'; for (let x = 10; x < PLOT_W; x += 44) ctx.fillRect(x, 318, 24, 3);
  ctx.fillStyle = '#ffffff22'; for (let x = 0; x < PLOT_W; x += 40) ctx.fillRect(x, QUAY_Y + 2, 1.5, 10);
  // the wooden pier is always there; each berth he has built is a concrete jetty with its number on a yellow board
  const pier = BERTH_X[0];
  ctx.fillStyle = '#6b4226'; for (let x = pier + 6; x < pier + 104; x += 24) ctx.fillRect(x, QUAY_Y + 4, 6, 30);
  rect(ctx, pier, QUAY_Y - 6, 110, 12, '#a0703f', 2.5);
  const built = PIECES.filter(x => x.does === 'berth' && own(p, x.id)).length + p.more.berth;
  for (let i = 1; i <= Math.min(BERTH_X.length - 1, built); i++) {
    const bx = BERTH_X[i]!;
    rect(ctx, bx, QUAY_Y - 6, 110, 12, '#8d969e', 2.5);
    rect(ctx, bx + 44, QUAY_Y - 26, 22, 18, '#ffcc00', 2);
    ctx.fillStyle = INK; ctx.font = '900 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), bx + 55, QUAY_Y - 16);
  }
  // pieces in their places, in the order of the catalogue so stages draw over their base
  for (const piece of PIECES) {
    if (!own(p, piece.id)) continue;
    const pl = PLACES[piece.id];
    if (!pl) continue;
    const art = PIECE_ART[piece.id];
    if (art) { art(ctx, pl, p); continue; }
    if (piece.id === 'piece:engine' || piece.id === 'piece:longtrain' || piece.id === 'piece:lorry' || piece.id === 'piece:biglorry') continue;
    rect(ctx, pl.x, pl.y, pl.w, pl.h, pl.colour);
    ctx.font = `${Math.min(34, pl.h * 0.6, pl.w * 0.7)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(piece.icon, pl.x + pl.w / 2, pl.y + pl.h / 2);
  }
  // the yard's stacks, from the container looks he owns; more yard blocks drawn up to a few
  const looks = boxLooks(p), rng = seeded(7);
  const yardBoxes = (own(p, 'piece:yard') ? 12 : 0) + (own(p, 'piece:bigyard') ? 12 : 0) + Math.min(DRAW_MOST.block, p.more.block) * 4;
  for (let i = 0; i < yardBoxes; i++) {
    const look: BoxLook = { hex: pick(rng, looks.colours.length ? looks.colours : ['#c8452f']), stripe: 'none', stripeHex: '#ffffff', mark: '' };
    const col = i % 14, tier = Math.floor(i / 14) % 3;
    drawBox(ctx, 26 + col * 30, 236 - tier * 16, 28, 16, look, null);
  }
  if (p.more.rail > 0 && own(p, 'piece:rail')) PIECE_ART['piece:rail']!(ctx, { x: 760, y: 262, w: Math.min(DRAW_MOST.rail, p.more.rail) * 70, h: 14, colour: '' }, p);
  // decorations along the front of the land, each with its shadow
  let dx = DECOR_X0;
  ctx.font = '30px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const decor = (icon: string) => { ctx.fillStyle = '#0002'; ctx.beginPath(); ctx.ellipse(dx, DECOR_Y + 14, 14, 4, 0, 0, 7); ctx.fill(); ctx.fillText(icon, dx, DECOR_Y); dx += DECOR_STEP; };
  for (const d of DECOR) if (own(p, d.id)) decor(d.icon);
  for (const id of p.owned) if (id.startsWith('crate:') || id.startsWith('special:')) { const icon = CRATE_ICONS[id]; if (icon && dx < PLOT_W - 20) decor(icon); }
}

/** What moves, drawn over the cached port each frame. */
export function drawPortLive(ctx: CanvasRenderingContext2D, p: PortState, t: number, moving: Moving | null, x0 = 0, x1 = PLOT_W) {
  // waves on the sea
  ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const yy = SEA_Y + 24 + i * 24, off = (t * 18 + i * 40) % 90; for (let x = x0 - off; x < x1; x += 90) { ctx.moveTo(x, yy); ctx.lineTo(x + 32, yy); } }
  ctx.stroke();
  // what turns, sweeps and blinks
  if (own(p, 'piece:lighthouse')) {
    const pl = PLACES['piece:lighthouse']!, a = 0.3 + 0.25 * Math.sin(t * 1.6);
    ctx.fillStyle = `rgba(255,240,140,${a})`; ctx.beginPath(); ctx.moveTo(pl.x + pl.w / 2, pl.y + 22); ctx.lineTo(pl.x - 150, pl.y - 6); ctx.lineTo(pl.x - 150, pl.y + 52); ctx.fill();
  }
  if (own(p, 'piece:wind')) {
    const pl = PLACES['piece:wind']!, hx = pl.x + pl.w / 2, hy = pl.y + 24;
    for (let i = 0; i < 3; i++) { const a = t * 1.4 + (i * Math.PI * 2) / 3; line(ctx, [hx, hy, hx + Math.cos(a) * 26, hy + Math.sin(a) * 26], INK, 6); line(ctx, [hx, hy, hx + Math.cos(a) * 25, hy + Math.sin(a) * 25], '#ffffff', 3.5); }
    disc(ctx, hx, hy, 4, '#f4f4f4', 2);
  }
  if (own(p, 'piece:radar')) { const pl = PLACES['piece:radar']!, w = 22 * Math.cos(t * 2.2); rect(ctx, pl.x + pl.w / 2 - Math.abs(w), pl.y + 6, Math.max(2, Math.abs(w) * 2), 6, '#3a3f44', 2); }
  if (own(p, 'piece:harbourlights')) { const pl = PLACES['piece:harbourlights']!, on = Math.floor(t * 1.5) % 2 === 0; disc(ctx, pl.x + 4, pl.y + 6, 4, on ? '#ff3b3b' : '#6b1a1a', 2); disc(ctx, pl.x + 16, pl.y + 6, 4, on ? '#1d5f2b' : '#3dff6e', 2); }
  // the train and the lorries
  if (own(p, 'piece:engine')) {
    const x = moving?.train !== null && moving?.train !== undefined ? -200 + moving.train * (PLOT_W + 400) : 600;
    const cars = (own(p, 'piece:longtrain') ? 4 : 1) + Math.min(DRAW_MOST.rail, p.more.rail);
    for (let i = 0; i < cars; i++) {
      const cx = x - 68 - i * 64;
      if (cx > x1 || cx + 64 < x0) continue;
      rect(ctx, cx, 254, 62, 6, '#3a3f44', 2); disc(ctx, cx + 12, 262, 4, '#222', 1.5); disc(ctx, cx + 50, 262, 4, '#222', 1.5);
      drawBox(ctx, cx + 2, 236, 58, 18, { hex: BOX_COLOURS[i % BOX_COLOURS.length]!.hex, stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    }
    rect(ctx, x - 4, 236, 56, 22, '#2f8a3f'); rect(ctx, x + 26, 226, 22, 12, '#2f8a3f'); ctx.fillStyle = '#9fd6f2'; ctx.fillRect(x + 30, 229, 14, 7);
    rect(ctx, x - 4, 240, 56, 4, '#ffcc00', 0); disc(ctx, x + 8, 262, 5, '#222', 2); disc(ctx, x + 38, 262, 5, '#222', 2);
  }
  const lorries = (own(p, 'piece:lorry') ? 1 : 0) + (own(p, 'piece:biglorry') ? 1 : 0);
  for (let i = 0; i < lorries; i++) {
    const x = moving ? 780 + (moving.lorries[i] ?? 0) * 500 : 860 + i * 66;
    rect(ctx, x + 40, 248, 18, 18, i ? '#e63946' : '#2f6fe0'); ctx.fillStyle = '#9fd6f2'; ctx.fillRect(x + 48, 252, 7, 6);
    rect(ctx, x, 262, 58, 5, '#3a3f44', 2);
    drawBox(ctx, x + 1, 246, 38, 16, { hex: i ? '#2f6fe0' : '#c8452f', stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    disc(ctx, x + 10, 270, 5, '#222', 2); disc(ctx, x + 48, 270, 5, '#222', 2);
  }
  // his cranes on the quay
  const cl = craneLook(p), cranes = 1 + Math.min(DRAW_MOST.crane, p.more.crane);
  for (let i = 0; i < cranes; i++) {
    const x = 70 + i * 160;
    if (x > x1 + 60 || x + 240 < x0) continue;
    drawCraneSide(ctx, cl.kind, cl.paint, x, QUAY_Y - (cl.kind === 'floating' ? -26 : 20), cl.kind === 'giant' ? 3.7 : cl.kind === 'tall' ? 4.2 : 4.8, moving?.trolleys[i] ?? 0.55, cl.lights, moving ? t : 0);
  }
  // his ships at their berths (and moving ones)
  const kinds = fleetKinds(p);
  const ships = moving ? moving.ships : kinds.slice(0, BERTH_X.length).map((k, i) => ({ berth: i, out: 0, look: shipLook(p, k), boxes: 0 }));
  const looks = boxLooks(p), u = 3.5, waterY = SEA_Y + 26;
  for (const s of ships) {
    const x = BERTH_X[s.berth]! + s.out * 900;
    if (x > x1 + 20 || x + 150 < x0) continue;
    const cols = Math.min(5, SHIP_SHAPES[s.look.kind].cols), deckW = cols * 2.8 * u, deckX = x + 4 * u, deckY = waterY - 2.6 * u;
    drawShip(ctx, s.look, deckX, deckW, deckY, waterY + Math.sin(t * 1.2 + s.berth) * 0.8, u, t);
    for (let b = 0; b < Math.min(s.boxes, cols * 2); b++) {
      drawBox(ctx, deckX + (b % cols) * 2.8 * u + 0.1 * u, deckY - 2.4 * u - Math.floor(b / cols) * 2.4 * u, 2.6 * u, 2.4 * u, { hex: pick(seeded(b + s.berth * 13), looks.colours.length ? looks.colours : ['#c8452f']), stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    }
  }
}

/** The crates and special prizes that are decorations show along the front of the land. */
const CRATE_ICONS: Readonly<Record<string, string>> = Object.fromEntries([...CRATES, ...SPECIALS].filter(c => c.kind === 'decor').map(c => [c.id, c.icon]));
