// His Rocket Base drawn in code on a 2D canvas, from the side: a launch day by the sea. The sky, the far hills and the sea with the
// recovery ship, then rows of buildings at three depths (big buildings far off, the assembly building, hangars and dishes nearer, the
// things beside the pads), the pads with his rockets standing on them and the tower beside the one that flies next, and the apron in front
// with the vehicles, the stands and the road. Every building he buys appears here, drawn, in its own place; hangars and dishes bought again
// and again add more. At night the windows light up and the floodlights shine on the pad.
//
// It is drawn once whenever the base changes or the box changes size (never every frame), so the Base screen costs nothing while he looks
// at it. The Launch draws it once into a canvas of its own and slides that down the screen as the rocket climbs.
import { drawRocket, rocketSize, type RocketLook } from './rocket';
import { BUILDINGS } from '../base/catalog';
import { canStand, flyingKind, lookOf, myRockets, pads, towerLevel, type BaseState } from '../base/base';

const O = '#14161b';
const WHITE = '#f6f8fb', CONCRETE = '#b8bec6', CONCRETE_2 = '#8a9099', STEEL = '#5b616c', STEEL_DARK = '#3a3f48';
const RED = '#e63946', BLUE = '#2f6fc0', YELLOW = '#ffd23f', ORANGE = '#ff7a00', GREEN = '#2fa84f', GLASS = '#9fd8ff', LIT = '#ffe27a';

export interface BaseScene {
  /** Catalogue ids of what he owns. */
  readonly owned: readonly string[];
  /** The rockets that stand on his pads, the one that flies next first. */
  readonly rockets: readonly RocketLook[];
  readonly pads: number;
  /** 1 to 4. */
  readonly tower: number;
  readonly hangars: number;
  readonly dishes: number;
  readonly night: boolean;
}
export interface BaseDrawOpts {
  /** Pixels per drawing unit; by default the box is 400 units high. */
  readonly u?: number;
  /** Closer in: bigger rockets, less of the base on each side. */
  readonly zoom?: number;
  /** In a short, wide box, come closer so the rockets stay a good size. */
  readonly fit?: boolean;
  /** Leave the rocket that flies next off its pad (the Launch draws it itself). */
  readonly hideFlying?: boolean;
  /** Put the pad of the rocket that flies next in the middle of the box. */
  readonly centerFlying?: boolean;
  /** Where the pads' ground sits, as a share of the box's height (0.775 by default). */
  readonly ground?: number;
  /** Leave out the sky (the Launch paints its own). */
  readonly noSky?: boolean;
}
export interface BaseLayout { readonly padX: number; readonly groundY: number; readonly u: number; readonly rocketH: number }

/** The ground line of each depth, in units below the pads' ground (negative is further away and higher up). */
const ROWS = { far: { y: -46, k: .55 }, back: { y: -22, k: .78 }, mid: { y: 0, k: 1 }, front: { y: 62, k: .92 } } as const;
type Row = keyof typeof ROWS;
type Drawer = (c: Pen) => void;
interface Spec { readonly row: Row; readonly w: number; readonly draw: Drawer }

/** Drawing helpers, in units, with the ground at y = 0 and the lot's left edge at x = 0. */
class Pen {
  constructor(readonly ctx: CanvasRenderingContext2D, readonly lw: number, readonly night: boolean) {}
  box(x: number, y: number, w: number, h: number, fill: string | CanvasGradient) { const c = this.ctx; c.fillStyle = fill; c.fillRect(x, y - h, w, h); c.lineWidth = this.lw; c.strokeStyle = O; c.strokeRect(x, y - h, w, h); }
  poly(pts: readonly number[], fill: string, stroke = true) { const c = this.ctx; c.beginPath(); for (let i = 0; i < pts.length; i += 2) (i ? c.lineTo : c.moveTo).call(c, pts[i]!, pts[i + 1]!); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = this.lw; c.strokeStyle = O; c.stroke(); } }
  circle(x: number, y: number, r: number, fill: string, stroke = true) { const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = this.lw; c.strokeStyle = O; c.stroke(); } }
  line(x0: number, y0: number, x1: number, y1: number, w = this.lw, colour = O) { const c = this.ctx; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.strokeStyle = colour; c.stroke(); }
  /** A grid of windows, lit at night. */
  windows(x: number, y: number, w: number, h: number, cols: number, rows: number, glass = GLASS) {
    const c = this.ctx, gw = w / cols, gh = h / rows;
    c.fillStyle = this.night ? LIT : glass;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) c.fillRect(x + i * gw + gw * .2, y - h + j * gh + gh * .22, gw * .6, gh * .56);
  }
  /** A round sign with an emoji, so a building says what it is. */
  badge(x: number, y: number, glyph: string, r = 9) {
    this.circle(x, y, r, WHITE);
    const c = this.ctx; c.font = `${r * 1.3}px system-ui, "Apple Color Emoji", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = O; c.fillText(glyph, x, y + r * .08);
  }
  wheel(x: number, y: number, r: number) { this.circle(x, y, r, '#2a2d36'); this.circle(x, y, r * .4, '#c9ccd6', false); }
  flag(x: number, y: number, colour: string, h = 10) { this.line(x, y, x, y - h * 4, this.lw * .8); this.poly([x, y - h * 4, x + h * 1.6, y - h * 3.5, x, y - h * 3], colour); }
}

// ---------- each building, drawn ----------

const shed = (w: number, h: number, fill: string, roof: string, glyph = '', cols = 3): Drawer => p => {
  p.box(0, 0, w, h, fill); p.poly([-3, -h, w + 3, -h, w + 3, -h - 6, -3, -h - 6], roof);
  p.windows(4, -6, w - 8, h - 16, cols, 1); if (glyph) p.badge(w / 2, -h - 14, glyph);
};
const dish = (r: number): Drawer => p => {
  const cx = r + 2;
  p.poly([cx - 5, 0, cx + 5, 0, cx + 3, -r * 1.1, cx - 3, -r * 1.1], STEEL);
  p.ctx.save(); p.ctx.translate(cx, -r * 1.25); p.ctx.rotate(-.5);
  p.ctx.beginPath(); p.ctx.ellipse(0, 0, r, r * .45, 0, Math.PI, 0); p.ctx.closePath(); p.ctx.fillStyle = WHITE; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
  p.line(0, 0, 0, -r * .6, p.lw * .8); p.circle(0, -r * .65, r * .08, RED, false);
  p.ctx.restore();
};
const hangar = (fill: string): Drawer => p => {
  const w = 74, h = 46;
  p.ctx.beginPath(); p.ctx.moveTo(0, 0); p.ctx.lineTo(0, -h * .55); p.ctx.quadraticCurveTo(w / 2, -h * 1.25, w, -h * .55); p.ctx.lineTo(w, 0); p.ctx.closePath();
  p.ctx.fillStyle = fill; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
  p.box(w * .22, 0, w * .56, h * .55, p.night ? '#6a5a2a' : '#5b616c');
  for (let i = 1; i < 4; i++) p.line(w * .22 + (w * .56 * i) / 4, 0, w * .22 + (w * .56 * i) / 4, -h * .55, p.lw * .5);
};

/** The hut he starts with, beside the pad. */
const HUT: Spec = { row: 'mid', w: 46, draw: p => { p.box(0, 0, 46, 28, '#d9dde2'); p.poly([-4, -28, 50, -28, 23, -42], '#8a9099'); p.box(17, 0, 12, 18, BLUE); p.windows(2, -8, 12, 12, 1, 1); p.windows(32, -8, 12, 12, 1, 1); } };

const SPECS: Record<string, Spec> = {
  // far off: the big buildings, so they read as a skyline behind the pads
  vab: { row: 'far', w: 120, draw: p => {
    p.box(0, 0, 120, 190, WHITE); p.box(0, -170, 120, 20, '#dfe4ea');
    p.box(44, 0, 32, 160, '#c3cad3'); for (let y = 20; y < 160; y += 20) p.line(44, -y, 76, -y, p.lw * .5);
    p.box(8, -130, 26, 26, BLUE); p.circle(21, -117, 8, WHITE, false); p.box(86, -150, 26, 14, RED);
    p.windows(84, -10, 30, 100, 2, 7);
  } },
  mission: { row: 'far', w: 104, draw: p => {
    p.box(0, 0, 104, 74, '#dfe4ea'); p.windows(6, -8, 92, 56, 6, 3, '#7be0a6'); p.box(36, -74, 32, 16, STEEL);
    p.ctx.save(); p.ctx.translate(38, -74); dish(14)(p); p.ctx.restore();
  } },
  school: { row: 'far', w: 86, draw: p => { shed(86, 62, '#e8814a', '#7a3a1a', '🎓', 4)(p); p.windows(6, -30, 74, 18, 4, 1); p.flag(80, -68, YELLOW, 7); } },
  museum: { row: 'far', w: 96, draw: p => {
    p.box(0, 0, 96, 50, '#efe6d2'); for (let i = 0; i < 6; i++) p.box(8 + i * 15, 0, 6, 40, WHITE);
    p.poly([-4, -50, 100, -50, 48, -76], '#e0d2b0'); p.badge(48, -60, '🚀', 8);
  } },
  observatory: { row: 'far', w: 64, draw: p => {
    p.box(6, 0, 52, 44, WHITE); p.ctx.beginPath(); p.ctx.arc(32, -44, 28, Math.PI, 0); p.ctx.closePath(); p.ctx.fillStyle = '#e8edf2'; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
    p.poly([28, -44, 36, -44, 34, -72, 30, -72], STEEL_DARK); p.windows(10, -6, 44, 20, 3, 1);
  } },
  teststand: { row: 'far', w: 70, draw: p => {
    p.box(0, 0, 70, 22, CONCRETE_2); p.box(22, -22, 26, 70, 'rgba(0,0,0,0)');
    for (let y = 22; y < 92; y += 14) p.line(22, -y, 48, -y - 14, p.lw * .7);
    p.box(26, -40, 18, 34, WHITE); p.circle(56, -12, 10, 'rgba(240,240,245,.9)', false); p.circle(66, -8, 8, 'rgba(240,240,245,.9)', false);
  } },
  spinner: { row: 'far', w: 70, draw: p => {
    p.box(30, 0, 10, 40, STEEL); p.line(4, -44, 66, -36, p.lw * 1.6, STEEL_DARK); p.circle(35, -40, 6, YELLOW);
    p.ctx.save(); p.ctx.translate(64, -36); p.box(-8, 8, 16, 16, RED); p.ctx.restore();
  } },
  factory: { row: 'far', w: 96, draw: p => {
    p.box(0, 0, 96, 50, YELLOW); for (let i = 0; i < 4; i++) p.poly([i * 24, -50, i * 24 + 24, -50, i * 24 + 24, -66], '#e0b13a');
    p.box(8, 0, 30, 30, STEEL); p.windows(46, -10, 44, 22, 3, 1); p.badge(70, -36, '🧩', 8);
  } },
  hangar: { row: 'back', w: 74, draw: hangar('#dfe4ea') },
  // nearer: the working buildings
  control: { row: 'back', w: 74, draw: p => { p.box(0, 0, 74, 44, '#5b8cc0'); p.windows(4, -6, 66, 30, 5, 2); p.box(28, -44, 18, 10, STEEL); p.line(37, -54, 37, -72, p.lw * .8); p.circle(37, -74, 3, RED, false); } },
  cleanroom: { row: 'back', w: 52, draw: p => { p.box(0, 0, 52, 46, WHITE); p.box(18, 0, 16, 26, BLUE); for (let i = 0; i < 3; i++) p.box(6 + i * 15, -46, 10, 8, CONCRETE); p.badge(26, -34, '🧼', 7); } },
  water: { row: 'back', w: 40, draw: p => {
    for (const x of [6, 34]) p.line(x, 0, x + (x < 20 ? 6 : -6), -70, p.lw);
    p.line(9, -30, 31, -50, p.lw * .6); p.line(31, -30, 9, -50, p.lw * .6);
    p.box(2, -70, 36, 30, '#9fb7cc'); p.poly([2, -100, 38, -100, 20, -112], '#7d97ad'); p.badge(20, -85, '💧', 7);
  } },
  weather: { row: 'back', w: 26, draw: p => {
    p.line(13, 0, 13, -110, p.lw * 1.2, STEEL_DARK);
    for (const d of [-1, 1]) { p.line(13, -104, 13 + d * 11, -104, p.lw * .7); p.circle(13 + d * 11, -104, 3.5, WHITE); }
    p.poly([13, -92, 26, -88, 13, -84], ORANGE); p.badge(13, -60, '🌦️', 7);
  } },
  radar: { row: 'back', w: 34, draw: p => {
    p.poly([6, 0, 28, 0, 20, -60, 14, -60], 'rgba(0,0,0,0)'); for (let y = 0; y < 60; y += 12) p.line(8 + y * .1, -y, 26 - y * .1, -y - 12, p.lw * .6);
    p.box(12, -60, 10, 8, STEEL); p.box(0, -72, 34, 8, WHITE);
  } },
  solar: { row: 'back', w: 84, draw: p => { for (let i = 0; i < 4; i++) { p.line(i * 21 + 10, 0, i * 21 + 10, -10, p.lw); p.poly([i * 21, -6, i * 21 + 18, -20, i * 21 + 20, -16, i * 21 + 2, -2], '#2f5fb0'); } } },
  dish1: { row: 'back', w: 40, draw: dish(18) },
  dish2: { row: 'back', w: 56, draw: dish(26) },
  dish3: { row: 'back', w: 78, draw: dish(36) },
  fire: { row: 'back', w: 64, draw: p => { p.box(0, 0, 64, 40, RED); p.box(6, 0, 24, 26, '#7a1a0c'); p.box(34, 0, 24, 26, '#7a1a0c'); p.box(0, -40, 64, 8, WHITE); p.badge(32, -50, '🚒', 8); } },
  pool: { row: 'back', w: 64, draw: p => { p.box(0, 0, 64, 14, '#2fd6e8'); p.line(6, -8, 58, -8, p.lw * .5, WHITE); p.line(56, -14, 56, -30, p.lw); p.line(40, -30, 60, -30, p.lw * 1.2); p.badge(20, -26, '🏊', 7); } },
  // beside the pads
  fuel1: { row: 'mid', w: 38, draw: p => { for (const x of [8, 30]) p.line(x, 0, x, -18, p.lw); p.circle(19, -34, 18, WHITE); p.line(3, -34, 35, -34, p.lw * 2.2, ORANGE); } },
  fuel2: { row: 'mid', w: 54, draw: p => { p.box(6, 0, 8, 12, STEEL); p.box(40, 0, 8, 12, STEEL); p.ctx.beginPath(); p.ctx.roundRect(0, -36, 54, 24, 12); p.ctx.fillStyle = WHITE; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke(); p.box(18, -12, 18, 24, ORANGE); } },
  oxygen: { row: 'mid', w: 34, draw: p => { for (const x of [7, 27]) p.line(x, 0, x, -14, p.lw); p.circle(17, -30, 16, '#bfe6ff'); p.circle(12, -35, 4, WHITE, false); } },
  lights: { row: 'mid', w: 22, draw: p => {
    p.line(11, 0, 11, -128, p.lw * 1.2, STEEL_DARK); p.box(0, -126, 22, 10, STEEL);
    for (let i = 0; i < 3; i++) p.circle(4 + i * 7, -131, 2.6, p.night ? '#fff8c4' : LIT, false);
  } },
  camera: { row: 'mid', w: 22, draw: p => { p.line(11, 0, 11, -80, p.lw * 1.2, STEEL_DARK); p.box(1, -80, 20, 14, '#2a2d36'); p.circle(20, -87, 4, GLASS); } },
  rods: { row: 'mid', w: 30, draw: p => { for (const x of [4, 26]) { p.line(x, 0, x, -150, p.lw * 1.1, STEEL); p.poly([x - 3, -150, x + 3, -150, x, -160], YELLOW); } p.line(4, -150, 26, -150, p.lw * .5); } },
  beacon: { row: 'mid', w: 14, draw: p => { p.line(7, 0, 7, -40, p.lw * 1.1, STEEL_DARK); p.circle(7, -44, 5, RED); } },
  windsock: { row: 'mid', w: 34, draw: p => { p.line(4, 0, 4, -52, p.lw); for (let i = 0; i < 4; i++) p.poly([4 + i * 7, -52 + i * .6, 11 + i * 7, -51 + i * .6, 11 + i * 7, -43 - i * .6, 4 + i * 7, -42 - i * .6], i % 2 ? WHITE : ORANGE); } },
  flags: { row: 'mid', w: 44, draw: p => { p.flag(6, 0, RED, 13); p.flag(20, 0, BLUE, 15); p.flag(34, 0, YELLOW, 13); } },
  // in front, on the apron
  crawler: { row: 'front', w: 80, draw: p => { p.box(0, -2, 80, 14, '#2a2d36'); for (let i = 0; i < 6; i++) p.circle(7 + i * 13.2, -9, 4, STEEL, false); p.box(4, -16, 72, 18, CONCRETE); p.box(8, -34, 18, 14, WHITE); p.windows(9, -36, 16, 8, 2, 1); } },
  bus: { row: 'front', w: 58, draw: p => { p.ctx.beginPath(); p.ctx.roundRect(0, -34, 58, 28, 6); p.ctx.fillStyle = '#e8edf2'; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke(); p.box(0, -14, 58, 4, BLUE); p.windows(4, -18, 50, 12, 4, 1); p.wheel(13, -6, 6); p.wheel(45, -6, 6); } },
  stand: { row: 'front', w: 62, draw: p => { p.poly([0, 0, 62, 0, 62, -30, 0, -8], RED); for (let i = 0; i < 6; i++) p.circle(6 + i * 10, -10 - i * 3.8, 3, [YELLOW, BLUE, GREEN, WHITE][i % 4]!, false); } },
  grandstand: { row: 'front', w: 92, draw: p => { p.poly([0, 0, 92, 0, 92, -40, 0, -12], BLUE); for (let i = 0; i < 9; i++) p.circle(6 + i * 10, -12 - i * 3.3, 3, [YELLOW, RED, WHITE, GREEN][i % 4]!, false); p.poly([0, -48, 96, -56, 96, -60, 0, -52], WHITE); p.line(4, -12, 4, -50, p.lw); p.line(90, -40, 90, -56, p.lw); } },
  cafe: { row: 'front', w: 52, draw: p => { p.box(0, 0, 52, 30, '#fff3d6'); for (let i = 0; i < 5; i++) p.poly([i * 10.4, -30, i * 10.4 + 10.4, -30, i * 10.4 + 10.4, -20, i * 10.4, -20], i % 2 ? WHITE : RED); p.box(18, 0, 14, 16, '#8b5a2b'); p.badge(26, -40, '🍔', 8); } },
  giftshop: { row: 'front', w: 46, draw: p => { p.box(0, 0, 46, 30, '#ff9ad5'); p.box(16, 0, 14, 18, '#7b4bd1'); p.windows(2, -8, 12, 14, 1, 1); p.windows(32, -8, 12, 14, 1, 1); p.badge(23, -40, '🎁', 8); } },
  press: { row: 'front', w: 46, draw: p => { p.box(0, 0, 46, 28, '#dfe4ea'); p.windows(4, -8, 38, 14, 3, 1); p.line(38, -28, 38, -50, p.lw * .8); p.circle(38, -52, 3, RED, false); p.badge(16, -38, '📰', 8); } },
  clock: { row: 'front', w: 56, draw: p => {
    p.line(10, 0, 10, -14, p.lw); p.line(46, 0, 46, -14, p.lw); p.box(0, -14, 56, 26, '#14161b');
    p.ctx.font = '900 20px Nunito, system-ui, sans-serif'; p.ctx.textAlign = 'center'; p.ctx.textBaseline = 'middle'; p.ctx.fillStyle = YELLOW; p.ctx.fillText('10', 28, -27);
  } },
  garden: { row: 'front', w: 66, draw: p => {
    const old = (x: number, h: number, c: string) => { p.box(x, 0, 10, h, c); p.poly([x, -h, x + 10, -h, x + 5, -h - 12], c === WHITE ? RED : WHITE); p.poly([x - 4, 0, x, 0, x, -10], RED); p.poly([x + 14, 0, x + 10, 0, x + 10, -10], RED); };
    old(6, 40, WHITE); old(28, 58, '#e8edf2'); old(50, 32, WHITE);
  } },
  helipad: { row: 'front', w: 56, draw: p => {
    p.ctx.beginPath(); p.ctx.ellipse(28, -3, 28, 6, 0, 0, Math.PI * 2); p.ctx.fillStyle = '#3a3f48'; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
    p.ctx.beginPath(); p.ctx.ellipse(28, -3, 18, 3.4, 0, 0, Math.PI * 2); p.ctx.lineWidth = p.lw * .6; p.ctx.strokeStyle = YELLOW; p.ctx.stroke();
    p.ctx.beginPath(); p.ctx.roundRect(14, -26, 28, 16, 8); p.ctx.fillStyle = RED; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
    p.line(42, -18, 56, -20, p.lw); p.line(4, -30, 52, -30, p.lw * .9); p.line(28, -26, 28, -30, p.lw * .8); p.windows(30, -14, 10, 10, 1, 1);
  } },
  landing: { row: 'front', w: 74, draw: p => {
    p.ctx.beginPath(); p.ctx.ellipse(37, -4, 37, 7, 0, 0, Math.PI * 2); p.ctx.fillStyle = CONCRETE; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke();
    p.ctx.beginPath(); p.ctx.ellipse(37, -4, 24, 4.2, 0, 0, Math.PI * 2); p.ctx.lineWidth = p.lw * .8; p.ctx.strokeStyle = WHITE; p.ctx.stroke();
    p.line(31, -4, 43, -4, p.lw * .8, YELLOW); p.line(37, -6.5, 37, -1.5, p.lw * .8, YELLOW);
  } },
  parking: { row: 'front', w: 78, draw: p => {
    const car = (x: number, c: string) => { p.ctx.beginPath(); p.ctx.roundRect(x, -16, 22, 10, 4); p.ctx.fillStyle = c; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke(); p.box(x + 5, -16, 12, 6, GLASS); p.wheel(x + 5, -5, 3.5); p.wheel(x + 17, -5, 3.5); };
    car(0, RED); car(27, YELLOW); car(54, '#2f8fe8');
  } },
  train: { row: 'front', w: 128, draw: p => {
    p.line(0, -1, 128, -1, p.lw * 1.4, '#5b3a1a');
    p.box(0, -6, 40, 26, ORANGE); p.box(26, -32, 14, 26, ORANGE); p.windows(27, -20, 12, 10, 1, 1); p.box(4, -32, 6, 8, STEEL_DARK);
    p.box(46, -6, 80, 8, STEEL); p.ctx.beginPath(); p.ctx.roundRect(50, -28, 70, 16, 8); p.ctx.fillStyle = WHITE; p.ctx.fill(); p.ctx.lineWidth = p.lw; p.ctx.strokeStyle = O; p.ctx.stroke(); p.box(102, -12, 6, 16, RED);
    for (const x of [8, 32, 56, 82, 112]) p.wheel(x, -5, 5);
  } },
  gate: { row: 'front', w: 56, draw: p => { p.box(0, 0, 10, 34, CONCRETE); p.box(46, 0, 10, 34, CONCRETE); p.box(10, -18, 36, 5, RED); for (let i = 0; i < 4; i++) p.box(12 + i * 9, -18, 4.5, 5, WHITE); p.box(-2, -34, 60, 6, BLUE); } },
  sign: { row: 'front', w: 66, draw: p => {
    p.line(12, 0, 12, -22, p.lw * 1.1); p.line(54, 0, 54, -22, p.lw * 1.1); p.box(0, -22, 66, 36, '#0b1f4d');
    p.circle(18, -40, 11, '#2f7fd6'); p.poly([14, -46, 22, -44, 20, -36, 13, -38], GREEN, false); p.poly([30, -34, 58, -46, 58, -42], WHITE);
    p.ctx.save(); p.ctx.translate(48, -40); p.ctx.rotate(-.4); p.poly([-4, 6, 4, 6, 4, -6, 0, -12, -4, -6], WHITE); p.ctx.restore();
  } },
};

/** Things he owns that the scene draws in place, by catalogue id: every building except the tower, pads and runway (drawn as part of the
 *  pads and the ground) and the recovery ship (on the sea). */
const SPECIAL = new Set(['tower1', 'tower2', 'tower3', 'arm', 'pad2', 'pad3', 'runway', 'ship', 'fence', 'road']);
/** Every building is drawn somewhere: the base test checks no id is missing. */
export const DRAWN_BUILDINGS = BUILDINGS.map(b => b.id.slice(2)).filter(id => SPECIAL.has(id) || id in SPECS);

interface Placed { spec: Spec; x: number }
/** Lays one row's lots across [x0, x1], keeping their order; if they don't fit they overlap evenly (further rows overlap more). */
function spread(specs: readonly Spec[], x0: number, x1: number): Placed[] {
  if (!specs.length) return [];
  const k = ROWS[specs[0]!.row].k, total = specs.reduce((s, x) => s + x.w * k, 0), room = x1 - x0;
  if (total <= room) {
    const gap = (room - total) / (specs.length + 1);
    let x = x0 + gap;
    return specs.map(s => { const at = x; x += s.w * k + gap; return { spec: s, x: at }; });
  }
  const step = specs.length > 1 ? (room - specs[specs.length - 1]!.w * k) / (specs.length - 1) : 0;
  return specs.map((s, i) => ({ spec: s, x: x0 + i * step }));
}

/** Draws the base filling a w×h box (pixels). */
export function drawBase(ctx: CanvasRenderingContext2D, scene: BaseScene, w: number, h: number, o: BaseDrawOpts = {}): BaseLayout {
  const u = (o.u ?? h / 400) * (o.zoom ?? 1) * (o.fit ? Math.max(1, Math.min(1.6, w / h / 2.3)) : 1), W = w / u, H = h / u, G = H * (o.ground ?? .775);
  const has = (id: string) => scene.owned.includes(`b:${id}`);
  const night = scene.night;
  ctx.save();
  ctx.scale(u, u);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = Math.max(1.4, 2.6 * u) / u;
  const p = new Pen(ctx, lw, night);

  // the sky, the sun or the stars, a few clouds
  if (!o.noSky) {
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    if (night) { sky.addColorStop(0, '#040a24'); sky.addColorStop(1, '#1b2f66'); } else { sky.addColorStop(0, '#3d93dc'); sky.addColorStop(.7, '#8fc8f5'); sky.addColorStop(1, '#d4ecff'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, G);
    if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 46; i++) ctx.fillRect((i * 137.5) % W, ((i * 61.8) % 1) * G * .7, i % 6 ? 1.6 : 2.6, i % 6 ? 1.6 : 2.6); ctx.fillStyle = '#f4f1e0'; ctx.beginPath(); ctx.arc(W * .86, G * .2, 16, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(W * .9, G * .16, 20, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      for (const [cx, cy, r] of [[.12, .18, 18], [.42, .1, 14], [.7, .24, 16]] as const) for (const [dx, dy, rr] of [[0, 0, 1], [-.9, .3, .7], [.9, .3, .75]] as const) { ctx.beginPath(); ctx.arc(W * cx + dx * r, G * cy + dy * r, rr * r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // the far land and the sea, with the recovery ship: hills to the left, a strip of sea along the horizon to the right with a beach in
  // front of it, then the grass coming forward to the concrete apron
  const seaX = W * .8, farY = G + ROWS.far.y, seaY = farY - 8, beachY = farY + 12;
  const ground = ctx.createLinearGradient(0, farY, 0, G);
  ground.addColorStop(0, night ? '#1d3524' : '#8fcf6a'); ground.addColorStop(1, night ? '#142a1b' : '#5fa847');
  ctx.fillStyle = night ? '#16301f' : '#7cbf5e';
  ctx.beginPath(); ctx.moveTo(0, farY); for (let x = 0; x <= seaX; x += 20) ctx.lineTo(x, farY - 16 - 12 * Math.sin(x / 47) - 8 * Math.sin(x / 19)); ctx.lineTo(seaX + 10, farY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = night ? '#0d2a55' : '#2f7fd6'; ctx.fillRect(seaX - 10, seaY, W - seaX + 10, beachY - seaY);
  ctx.strokeStyle = night ? '#1d4f8f' : '#8fc8f5'; ctx.lineWidth = lw * .6; for (let y = seaY + 5; y < beachY - 2; y += 6) { ctx.beginPath(); ctx.moveTo(seaX + 8 + (y % 12), y); ctx.lineTo(W - 4, y); ctx.stroke(); }
  ctx.fillStyle = ground; ctx.fillRect(0, farY, seaX - 10, G - farY);
  ctx.beginPath(); ctx.moveTo(seaX - 10, farY); ctx.lineTo(seaX - 10, G); ctx.lineTo(W, G); ctx.lineTo(W, beachY + 6); ctx.quadraticCurveTo(seaX + 30, beachY + 2, seaX - 10, farY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = night ? '#5a5238' : '#ecd9a0'; ctx.beginPath(); ctx.moveTo(seaX - 10, farY); ctx.quadraticCurveTo(seaX + 30, beachY + 2, W, beachY + 6); ctx.lineTo(W, beachY); ctx.lineTo(seaX + 20, beachY); ctx.closePath(); ctx.fill();
  if (has('ship')) {
    ctx.save(); ctx.translate(seaX + Math.min(60, (W - seaX) * .55), seaY + 8); ctx.scale(.6, .6);
    p.poly([-38, -10, 40, -10, 32, 4, -30, 4], '#e8edf2'); p.box(-30, -10, 22, 14, '#e8edf2'); p.windows(-28, -14, 18, 8, 2, 1); p.line(-20, -24, -20, -36, lw); p.circle(18, -15, 9, CONCRETE); p.line(-38, -2, 40, -2, lw * 1.2, RED);
    ctx.restore();
  }
  // the concrete apron
  ctx.fillStyle = night ? '#4a4f58' : CONCRETE; ctx.fillRect(0, G - 2, W, H - G + 2);
  ctx.fillStyle = night ? '#3a3f48' : '#a7adb6'; ctx.fillRect(0, G + 30, W, H - G - 30);
  ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.beginPath(); ctx.moveTo(0, G - 2); ctx.lineTo(W, G - 2); ctx.stroke();

  // what he owns, by row
  const owned = BUILDINGS.filter(b => has(b.id.slice(2)) && !SPECIAL.has(b.id.slice(2)) && SPECS[b.id.slice(2)]).sort((a, b) => a.spot - b.spot).map(b => SPECS[b.id.slice(2)]!);
  owned.unshift(HUT);
  for (let i = 0; i < scene.hangars; i++) owned.push(SPECS.hangar!);
  for (let i = 0; i < scene.dishes; i++) owned.push({ ...SPECS.dish2!, draw: dish(22 + (i % 3) * 5) });
  const row = (r: Row) => owned.filter(s => s.row === r);
  const drawRow = (placed: Placed[], r: Row) => {
    const { y, k } = ROWS[r];
    for (const { spec, x } of placed) { ctx.save(); ctx.translate(x, G + y); ctx.scale(k, k); spec.draw(new Pen(ctx, lw / k, night)); ctx.restore(); }
  };
  drawRow(spread(row('far'), W * .03, seaX - 8), 'far');
  drawRow(spread(row('back'), W * .02, W * .98), 'back');

  // the pads and the rockets on them, the tower beside the first
  const nPads = Math.max(1, scene.pads), shown = Math.min(nPads, 6), padW = Math.min(104, (W * .62) / shown);
  const groupW = shown * padW, flyingAt = o.centerFlying ? W / 2 - padW / 2 : W / 2 - groupW / 2;
  const padX = (i: number) => flyingAt + i * padW;
  const fence = has('fence');
  const rocketH = Math.min(232, G - 46);
  for (let i = 0; i < shown; i++) {
    const x = padX(i) + padW / 2;
    // the flame trench, the slab
    p.box(x - padW * .44, G, padW * .88, 10, night ? '#6b7280' : '#cfd4da'); p.box(x - padW * .16, G + 10, padW * .32, 8, '#2a2d36');
    if (i === 0) {
      const th = [0, 120, 168, 214, 250][scene.tower] ?? 120, tx = x - padW * .44 - 4, tw = 20;
      // the tower: red and white lattice
      ctx.fillStyle = 'rgba(0,0,0,0)';
      for (let y = 0; y < th; y += 16) { p.line(tx, G - y, tx + tw, G - y - 16, lw * .7, '#c0392b'); p.line(tx + tw, G - y, tx, G - y - 16, lw * .7, '#c0392b'); }
      p.line(tx, G, tx, G - th, lw * 1.3, '#c0392b'); p.line(tx + tw, G, tx + tw, G - th, lw * 1.3, '#c0392b');
      p.box(tx - 3, G - th, tw + 6, 8, WHITE);
      if (has('arm')) { p.box(tx + tw, G - th * .72, padW * .28, 6, STEEL); p.box(tx + tw + padW * .2, G - th * .72 + 6, 8, 14, STEEL_DARK); }
      if (has('lights') && night) { const g = ctx.createRadialGradient(x, G - 40, 4, x, G - 40, 140); g.addColorStop(0, 'rgba(255,246,190,.45)'); g.addColorStop(1, 'rgba(255,246,190,0)'); ctx.fillStyle = g; ctx.fillRect(x - 140, G - 200, 280, 200); }
    }
    const look = scene.rockets[i];
    if (look && !(i === 0 && o.hideFlying)) {
      const sz = rocketSize(look), want = i === 0 ? rocketH : rocketH * .74;
      const s = Math.min(want / sz.h, (padW * (i === 0 ? 1.15 : .95)) / sz.w);
      drawRocket(ctx, look, x, G - 1, s);
    } else if (!look) { ctx.fillStyle = night ? '#9aa3ad' : '#5b616c'; ctx.font = '900 16px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', x, G - 12); }
  }
  if (nPads > shown) p.badge(padX(shown) + 14, G - 20, `+${nPads - shown}` as string, 12);
  // things beside the pads, packed outward from them
  const mid = row('mid'), left = mid.filter((_, i) => i % 2 === 0), right = mid.filter((_, i) => i % 2 === 1);
  const towerRoom = 30;
  drawRow(spread(left, W * .01, Math.max(W * .02, padX(0) - towerRoom)), 'mid');
  drawRow(spread(right, Math.min(W * .97, padX(shown) + 6), W * .99), 'mid');
  if (fence) { ctx.strokeStyle = O; ctx.lineWidth = lw * .7; ctx.beginPath(); ctx.moveTo(0, G + 24); ctx.lineTo(W, G + 24); ctx.moveTo(0, G + 16); ctx.lineTo(W, G + 16); ctx.stroke(); for (let x = 6; x < W; x += 18) p.line(x, G + 28, x, G + 12, lw * .8); }

  // the apron: road, runway, then the vehicles and the little buildings
  if (has('road')) { ctx.fillStyle = '#4a4f58'; ctx.fillRect(0, G + 66, W, 22); ctx.strokeStyle = YELLOW; ctx.lineWidth = lw; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(0, G + 77); ctx.lineTo(W, G + 77); ctx.stroke(); ctx.setLineDash([]); }
  if (has('runway')) { ctx.fillStyle = '#2a2d36'; ctx.fillRect(0, H - 14, W, 14); ctx.strokeStyle = WHITE; ctx.lineWidth = lw * 1.2; ctx.setLineDash([22, 16]); ctx.beginPath(); ctx.moveTo(0, H - 7); ctx.lineTo(W, H - 7); ctx.stroke(); ctx.setLineDash([]); }
  drawRow(spread(row('front'), W * .02, W * .98), 'front');
  ctx.restore();
  return { padX: (padX(0) + padW / 2) * u, groundY: G * u, u, rocketH: rocketH * u };
}

/** The base he owns, ready to draw: his rockets that stand (the one that flies next first), on as many pads as he has. */
export function sceneFor(a: BaseState, night = a.night): BaseScene {
  const first = flyingKind(a), n = pads(a);
  const rockets = myRockets(a).filter(k => canStand(a, k)).sort((x, y) => (x === first ? -1 : y === first ? 1 : 0)).slice(0, n).map(k => lookOf(a, k));
  return { owned: a.owned, rockets, pads: n, tower: towerLevel(a), hangars: a.more.hangar, dishes: a.more.dish, night };
}

// ---------- one building by itself, for the Build tab's tiles ----------

const tower = (h: number): Drawer => p => {
  for (let y = 0; y < h; y += 16) { p.line(0, -y, 20, -y - 16, p.lw * .7, '#c0392b'); p.line(20, -y, 0, -y - 16, p.lw * .7, '#c0392b'); }
  p.line(0, 0, 0, -h, p.lw * 1.3, '#c0392b'); p.line(20, 0, 20, -h, p.lw * 1.3, '#c0392b'); p.box(-3, -h, 26, 8, WHITE);
};
const pad: Drawer = p => { p.box(0, 0, 90, 10, '#cfd4da'); p.box(29, 8, 32, 8, '#2a2d36'); };
/** Pictures for what the base draws as part of the scene rather than as a building of its own. */
const ALONE: Record<string, Drawer> = {
  tower1: tower(120), tower2: tower(168), tower3: tower(214),
  arm: p => { tower(120)(p); p.box(20, -86, 34, 6, STEEL); p.box(46, -80, 8, 14, STEEL_DARK); },
  pad2: pad, pad3: pad, pad: pad,
  runway: p => { p.box(0, 0, 150, 14, '#2a2d36'); p.ctx.setLineDash([20, 14]); p.line(4, -7, 146, -7, p.lw * 1.2, WHITE); p.ctx.setLineDash([]); },
  road: p => { p.box(0, 0, 120, 22, '#4a4f58'); p.ctx.setLineDash([16, 12]); p.line(4, -11, 116, -11, p.lw, YELLOW); p.ctx.setLineDash([]); },
  fence: p => { p.line(0, -24, 100, -24, p.lw * .7); p.line(0, -14, 100, -14, p.lw * .7); for (let x = 4; x < 100; x += 18) p.line(x, 0, x, -30, p.lw * .9); },
  ship: p => { p.box(-10, 0, 120, 10, '#2f7fd6'); p.ctx.save(); p.ctx.translate(50, -6); p.poly([-38, -10, 40, -10, 32, 4, -30, 4], '#e8edf2'); p.box(-30, -10, 22, 14, '#e8edf2'); p.windows(-28, -14, 18, 8, 2, 1); p.line(-20, -24, -20, -36, p.lw); p.circle(18, -15, 9, CONCRETE); p.line(-38, -2, 40, -2, p.lw * 1.2, RED); p.ctx.restore(); },
  hut: HUT.draw,
};
const alonePics = new Map<string, string>();
/** A building drawn by itself (its id without "b:", or "pad", "hangar", "dish" for the ones bought again), trimmed and fitted `px`
 *  pixels high, as a picture for a tile. Cached. */
export function buildingPic(id: string, px = 64): string {
  const key = `${id}|${px}`, hit = alonePics.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const draw = ALONE[id] ?? (id === 'dish' ? dish(26) : SPECS[id]?.draw);
  if (!draw) return '';
  const S = 300, c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';
  c.width = S * 1.4; c.height = S;
  // twice: once to find how big it is, then again with outlines that come out the same thickness on every tile
  const paint = (lw: number) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.translate(60, S - 30); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; draw(new Pen(ctx, lw, false)); };
  const bounds = () => {
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0: Math.max(0, x0 - 3), y0: Math.max(0, y0 - 3), w: Math.min(c.width, x1 + 4) - Math.max(0, x0 - 3), h: Math.min(c.height, y1 + 4) - Math.max(0, y0 - 3) };
  };
  paint(3);
  const first = bounds(), dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  const k = Math.min((px * dpr) / Math.max(1, first.h), (px * 2.2 * dpr) / Math.max(1, first.w));
  paint(Math.max(1.5, 2.4 * dpr / k));
  const b = bounds(), out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(b.w * k)); out.height = Math.max(1, Math.round(b.h * k));
  out.getContext('2d')?.drawImage(c, b.x0, b.y0, b.w, b.h, 0, 0, out.width, out.height);
  const url = out.toDataURL();
  alonePics.set(key, url);
  return url;
}
/** Whether a building has a picture of its own for its tile (the base test checks every one does). */
export const hasPicture = (id: string) => id in ALONE || id in SPECS;
