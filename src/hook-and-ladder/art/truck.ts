// His fire engine, drawn in code from its parts on a 2D canvas, so the one in the Station is the one at the Call. Drawn in world
// units (a truck is about 4.6 long, the ground is y = 0, y goes up) through `w2s`, which maps a world point to the canvas. The
// Station draws it big on its own canvas; the Call draws it in the scene with its ladder raised and the water coming out.
//
// Three families: trucks park on the street (hose monitor at NOZZLE_AT, ladder turntable at LADDER_PIVOT; the Tower Truck's hose is
// up in its bucket at TOWER_NOZZLE); hover aircraft hang in the air (the caller lifts them by `bounce`) with the monitor at
// NOZZLE_AT and a rope ladder from LADDER_PIVOT; planes fly level round (2.6, 0.7) and drop water from PLANE_DROP.
import { BUDDIES, LIGHTS, PAINTS, TOWER_NOZZLE, kindOf, type BuddyId, type GadgetId, type LightsId, type NozzleId, type PaintId, type TruckId } from '../station/parts';

export interface TruckLook {
  readonly truck: TruckId;
  readonly paint: PaintId;
  readonly lights: LightsId;
  readonly buddy: BuddyId;
  readonly nozzle: NozzleId;
  /** Rungs, which change how it looks a little: a bigger tank, a longer ladder, a thicker hose. */
  readonly ladder: number;
  readonly tank: number;
  readonly hose: number;
  readonly pump: number;
  /** The Engine's Rung: what comes out of the exhaust when it drives. */
  readonly engine: number;
  /** The Gadgets switched on, drawn on the vehicle where they fit. */
  readonly gadgets: readonly GadgetId[];
}

export interface Pose {
  /** The ladder's angle (radians, 0 = lying on the truck) and length in world units. */
  ladderAngle?: number;
  ladderLen?: number;
  /** Seconds, for the flashing lights and the turning rotor; lights flash only when `flash`. */
  t?: number;
  flash?: boolean;
  /** The hose's aim, in radians; null: stowed. */
  aim?: number | null;
  /** How far the truck has bounced on its springs; for an aircraft, how high it flies (the caller lifts it this far). */
  bounce?: number;
  /** A plane flying left is drawn mirrored. */
  facing?: 1 | -1;
  /** Driving: the Engine's exhaust trails behind. */
  exhaust?: boolean;
  /** The Rescue Drone is off rescuing someone, so it isn't drawn on the vehicle. */
  droneAway?: boolean;
}

export type W2S = { k: number; ox: number; oy: number };
export const LADDER_PIVOT = { x: 3.1, y: 1.45 } as const;
export const NOZZLE_AT = { x: 4.6, y: 1.55 } as const;
/** Where a plane's water falls from, in its own units (its belly). */
export const PLANE_DROP = { x: 2.6, y: 0.35 } as const;

type Ctx = CanvasRenderingContext2D;
type At = { readonly x: number; readonly y: number };
const OUT = '#141414';
const STEEL = '#5d6670', CHROME = '#d9dee4', BRASS = '#c9a227', GOLD = '#ffc21a', GOLD_DARK = '#b8860b';
const RAINBOW = ['#ff2a2a', '#ff8c1a', '#ffd23f', '#2bb673', '#2a7bff', '#7d3cff'] as const;
const TREAD = [0.13, 0.09], NODASH: number[] = [];
const paintOf = (id: PaintId) => PAINTS.find(p => p.id === id) ?? PAINTS[0];
const has = (look: TruckLook, g: GadgetId) => !!look.gadgets?.includes(g);
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** The time of the frame being drawn, for the patterns that sparkle. */
let T = 0;

export const lightColor = (id: LightsId, t: number, side: 0 | 1): string => {
  switch (id) {
    case 'redwhite': return side ? '#ffffff' : '#ff2a2a';
    case 'police': return side ? '#ff2a2a' : '#2a7bff';
    case 'rainbow': return `hsl(${((t * 240) + side * 180) % 360} 100% 60%)`;
    case 'disco': return `hsl(${(Math.floor(t * 6) * 77 + side * 140) % 360} 100% 62%)`;
    case 'flicker': return `hsl(30 100% ${Math.round(50 + 17 * Math.sin(t * 31 + side * 2.1) * Math.sin(t * 9.7 + side))}%)`;
    case 'twinkle': { const k = Math.floor(t * 5) + side * 13; return `hsl(${Math.floor(hash(k) * 360)} 100% ${hash(k + 0.5) > 0.3 ? 84 : 62}%)`; }
    case 'fireworks': return `hsl(${(Math.floor(t * 12) * 97 + side * 160) % 360} 100% 60%)`;
  }
  return (LIGHTS.find(x => x.id === id) ?? LIGHTS[0]).color;
};
/** The Golden Fire Engine's lights are always gold. */
const lamp = (look: TruckLook, t: number, side: 0 | 1) => look.truck === 'gold' ? GOLD : lightColor(look.lights, t, side);

/** Draws in world units: everything below goes through this transform (y up). */
function world(ctx: Ctx, m: W2S, x0: number, y0: number) { ctx.setTransform(m.k, 0, 0, -m.k, m.ox + x0 * m.k, m.oy - y0 * m.k); }
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); }
function ink(ctx: Ctx, w = 0.07) { ctx.lineWidth = w; ctx.strokeStyle = OUT; ctx.stroke(); }
function starPath(ctx: Ctx, cx: number, cy: number, r: number, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * inner : r; ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
  ctx.closePath();
}
/** A four-pointed sparkle, for gold and diamonds. */
function glint(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x + r * 0.22, y + r * 0.22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.22, y - r * 0.22);
  ctx.lineTo(x, y - r); ctx.lineTo(x - r * 0.22, y - r * 0.22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.22, y + r * 0.22); ctx.closePath(); ctx.fill();
}
function emoji(ctx: Ctx, m: W2S, ch: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${Math.round(size * m.k)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, m.ox + x * m.k, m.oy - y * m.k);
  ctx.restore();
}

/** The paint's pattern over a shape already traced as the current path (clipped to it). */
function pattern(ctx: Ctx, id: PaintId, x: number, y: number, w: number, h: number) {
  const p = paintOf(id);
  ctx.fillStyle = p.color; ctx.fill();
  if (!('pattern' in p)) return;
  ctx.save(); ctx.clip();
  const pat = p.pattern;
  if (pat === 'stripes') { ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h * 0.42, w, h * 0.14); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + h * 0.36, w, h * 0.05); }
  else if (pat === 'spots') { ctx.fillStyle = '#111'; const n = Math.max(6, Math.round(w * h * 3)); for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(x + w * ((i * 0.37) % 1), y + h * ((i * 0.61) % 1), 0.13, 0.1, i, 0, 7); ctx.fill(); } }
  else if (pat === 'candy') { ctx.fillStyle = '#fff'; for (let i = -4; i < w / 0.45 + 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 0.45, y); ctx.lineTo(x + i * 0.45 + 0.2, y); ctx.lineTo(x + i * 0.45 + 0.2 + h, y + h); ctx.lineTo(x + i * 0.45 + h, y + h); ctx.fill(); } }
  else if (pat === 'tiger' || pat === 'zebra') { ctx.strokeStyle = '#111'; ctx.lineWidth = pat === 'zebra' ? 0.13 : 0.09; const n = Math.max(6, Math.round(w * 3.1)); for (let i = 0; i < n; i++) { const sx = x + i * w / (n - 1); ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.quadraticCurveTo(sx + 0.2, y + h * 0.5, sx - 0.05, y + h * (pat === 'zebra' ? 0 : 0.35)); ctx.stroke(); } }
  else if (pat === 'camo') { const cs = ['#3f5226', '#8a7a4a', '#2c3a1c']; const n = Math.max(8, Math.round(w * h * 4.5)); for (let i = 0; i < n; i++) { ctx.fillStyle = cs[i % 3]!; ctx.beginPath(); ctx.ellipse(x + w * ((i * 0.29) % 1), y + h * ((i * 0.53) % 1), 0.3, 0.16, i, 0, 7); ctx.fill(); } }
  else if (pat === 'flames') {
    const blue = id === 'blueflames';
    ctx.fillStyle = blue ? '#2a7bff' : '#ff7a00'; ctx.beginPath(); ctx.moveTo(x + w, y); for (let i = 0; i <= 6; i++) ctx.lineTo(x + w - 0.6 - i * 0.35 - (i % 2) * 0.5, y + h * (i / 6)); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = blue ? '#9ff0ff' : '#ffd23f'; ctx.beginPath(); ctx.moveTo(x + w, y + h * 0.1); for (let i = 0; i <= 4; i++) ctx.lineTo(x + w - 0.3 - i * 0.22 - (i % 2) * 0.3, y + h * (0.1 + i * 0.2)); ctx.lineTo(x + w, y + h * 0.9); ctx.fill();
  }
  else if (pat === 'rainbow') { RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + h - (i + 1) * h / 6, w, h / 6 + 0.01); }); }
  else if (pat === 'galaxy') { ctx.fillStyle = '#5b2fa8'; ctx.beginPath(); ctx.ellipse(x + w * 0.4, y + h * 0.5, w * 0.35, h * 0.3, 0.2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; for (let i = 0; i < 16; i++) ctx.fillRect(x + w * ((i * 0.37) % 1), y + h * ((i * 0.71) % 1), 0.05, 0.05); }
  else if (pat === 'glow') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffd23f'); g.addColorStop(0.5, '#ff4a1a'); g.addColorStop(1, '#a3150a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  else if (pat === 'checker') { const s = 0.24; ctx.fillStyle = '#141414'; for (let i = 0; i * s < w; i++) for (let j = 0; j * s < h; j++) if ((i + j) % 2) ctx.fillRect(x + i * s, y + j * s, s, s); }
  else if (pat === 'stars') {
    const gold = id === 'goldstar', n = Math.max(4, Math.round(w * h * (gold ? 2.6 : 5)));
    for (let i = 0; i < n; i++) {
      const sx = x + w * ((i * 0.37 + 0.1) % 1), sy = y + h * ((i * 0.61 + 0.25) % 1);
      ctx.fillStyle = gold ? '#ffd23f' : i % 3 ? '#fff6b0' : '#ffffff';
      starPath(ctx, sx, sy, gold ? 0.17 : i % 3 ? 0.08 : 0.12); ctx.fill();
    }
  }
  else if (pat === 'lightning') {
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 0.03;
    const n = Math.max(1, Math.floor(w / 1.1));
    for (let i = 0; i < n; i++) {
      const bx = x + w * (i + 0.5) / n, s = Math.min(h, 1.2);
      ctx.beginPath(); ctx.moveTo(bx + 0.12, y + h * 0.5 + s * 0.5); ctx.lineTo(bx - 0.2, y + h * 0.5 - s * 0.02); ctx.lineTo(bx + 0.02, y + h * 0.5 - s * 0.02);
      ctx.lineTo(bx - 0.14, y + h * 0.5 - s * 0.5); ctx.lineTo(bx + 0.24, y + h * 0.5 + s * 0.1); ctx.lineTo(bx + 0.03, y + h * 0.5 + s * 0.1); ctx.lineTo(bx + 0.3, y + h * 0.5 + s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  else if (pat === 'polka') { ctx.fillStyle = '#ffffff'; const s = 0.36; for (let j = 0; j * s * 0.8 < h + s; j++) for (let i = 0; i * s < w + s; i++) { circle(ctx, x + i * s + (j % 2) * s / 2, y + j * s * 0.8, 0.09); ctx.fill(); } }
  else if (pat === 'leopard') {
    const n = Math.max(6, Math.round(w * h * 5));
    ctx.lineWidth = 0.045; ctx.strokeStyle = '#3a2414';
    for (let i = 0; i < n; i++) {
      const cx = x + w * ((i * 0.37 + 0.05) % 1), cy = y + h * ((i * 0.57 + 0.15) % 1);
      ctx.fillStyle = '#b8742a'; circle(ctx, cx, cy, 0.07); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 0.1, i, i + 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 0.1, i + 2.6, i + 4.6); ctx.stroke();
    }
  }
  else if (pat === 'waves') {
    ctx.fillStyle = '#0c6e66'; ctx.fillRect(x, y, w, h * 0.3);
    ctx.strokeStyle = '#ffffffd0'; ctx.lineWidth = 0.06;
    for (let j = 0; j < 3; j++) {
      const wy = y + h * (0.3 + j * 0.25);
      ctx.beginPath(); for (let sx = x; sx <= x + w + 0.1; sx += 0.08) ctx.lineTo(sx, wy + Math.sin((sx + j * 0.4) * 7) * 0.06); ctx.stroke();
    }
  }
  else if (pat === 'diamond') {
    const s = 0.42, cs = ['#e6fbff', '#a9e6f5', '#d2f6ff', '#8fd8ec', '#ffffff'];
    for (let j = 0; j * s * 0.5 < h + s; j++) for (let i = -1; i * s < w + s; i++) {
      const cx = x + i * s + (j % 2) * s / 2, cy = y + j * s * 0.5;
      ctx.fillStyle = cs[Math.floor(hash(i * 7 + j * 3) * 5)]!;
      ctx.beginPath(); ctx.moveTo(cx, cy + s / 2); ctx.lineTo(cx + s / 2, cy); ctx.lineTo(cx, cy - s / 2); ctx.lineTo(cx - s / 2, cy); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { const k = (Math.sin(T * 3 + i * 1.7) + 1) / 2; glint(ctx, x + w * ((i * 0.31 + 0.15) % 1), y + h * ((i * 0.53 + 0.3) % 1), 0.06 + 0.12 * k); }
  }
  ctx.restore();
}

function wheel(ctx: Ctx, x: number, r = 0.42, big = false, hub = '#b9c2cc') {
  ctx.fillStyle = '#1c1c1e'; ctx.beginPath(); ctx.arc(x, r, r * (big ? 1.2 : 1), 0, 7); ctx.fill();
  ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(x, r, r * 0.45, 0, 7); ctx.fill();
  ctx.fillStyle = '#5d6670'; ctx.beginPath(); ctx.arc(x, r, r * 0.16, 0, 7); ctx.fill();
}
/** An old-time wooden wheel: a thin black tyre, spokes, a brass hub. */
function spoked(ctx: Ctx, x: number, cy: number, r: number, spoke: string) {
  ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 0.1; circle(ctx, x, cy, r - 0.05); ctx.stroke();
  ctx.strokeStyle = spoke; ctx.lineWidth = 0.05; circle(ctx, x, cy, r - 0.12); ctx.stroke();
  ctx.lineWidth = 0.045; ctx.beginPath();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(a) * (r - 0.12), cy + Math.sin(a) * (r - 0.12)); }
  ctx.stroke();
  ctx.fillStyle = BRASS; circle(ctx, x, cy, r * 0.2); ctx.fill(); ink(ctx, 0.03);
}
/** A monster truck's huge knobbly tyre. */
function monsterWheel(ctx: Ctx, x: number, r: number) {
  ctx.fillStyle = '#1c1c1e'; circle(ctx, x, r, r); ctx.fill();
  ctx.strokeStyle = '#3d3d45'; ctx.lineWidth = 0.13; ctx.setLineDash(TREAD); circle(ctx, x, r, r - 0.07); ctx.stroke(); ctx.setLineDash(NODASH);
  ctx.strokeStyle = '#2c2c30'; ctx.lineWidth = 0.05; circle(ctx, x, r, r * 0.7); ctx.stroke();
  ctx.fillStyle = '#b9c2cc'; circle(ctx, x, r, r * 0.46); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = STEEL; circle(ctx, x, r, r * 0.17); ctx.fill();
  ctx.fillStyle = '#2c2c30'; for (let i = 0; i < 5; i++) { const a = i * 1.2566; circle(ctx, x + Math.cos(a) * r * 0.32, r + Math.sin(a) * r * 0.32, 0.03); ctx.fill(); }
}

/** His buddy, in a cape when the Hero Cape is on. `bx` is where the face goes on screen (a mirrored plane passes its own). */
function crew(ctx: Ctx, m: W2S, look: TruckLook, x: number, y: number, size: number, bx = x) {
  if (has(look, 'cape')) {
    const s = size, wave = Math.sin(T * 7) * 0.05;
    ctx.fillStyle = '#e01b24'; ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.05); ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.1 + wave, x - s * 0.85, y - s * 0.62 + wave);
    ctx.lineTo(x - s * 0.15, y - s * 0.55); ctx.closePath(); ctx.fill(); ink(ctx, 0.03);
  }
  buddy(ctx, m, look.buddy, bx, y, size);
}

function buddy(ctx: Ctx, m: W2S, id: BuddyId, x: number, y: number, size: number) {
  const b = BUDDIES.find(b => b.id === id) ?? BUDDIES[0];
  if ('emoji' in b) { emoji(ctx, m, b.emoji, x, y, size); return; }
  // the dalmatian: a white head with black spots, a black ear and nose
  ctx.save(); ctx.setTransform(m.k, 0, 0, -m.k, m.ox, m.oy);
  const r = size * 0.42;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.035;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(x - r * 0.85, y + r * 0.1, r * 0.3, r * 0.6, 0.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.25, r * 0.16, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.45, r * 0.13, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.05, y + r * 0.2, r * 0.09, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.25, r * 0.08, 0, 7); ctx.fill();
  ctx.restore();
}

/** The cab at the front (on the right: he drives toward the fire), from y0 up to h, with his buddy in the window. */
function cab(ctx: Ctx, m: W2S, look: TruckLook, x: number, w: number, h: number, y0 = 0.4, boxy = false, bumper = CHROME) {
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, h);
  if (boxy) ctx.lineTo(x + w, h); else { ctx.lineTo(x + w - 0.35, h); ctx.lineTo(x + w, h - 0.45); }
  ctx.lineTo(x + w, y0); ctx.closePath();
  pattern(ctx, look.paint, x, y0, w, h - y0);
  ink(ctx);
  // the window, with his buddy in it
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(x + 0.15, h - 0.1);
  if (boxy) { ctx.lineTo(x + w - 0.15, h - 0.1); ctx.lineTo(x + w - 0.15, h - 0.5); } else { ctx.lineTo(x + w - 0.4, h - 0.1); ctx.lineTo(x + w - 0.12, h - 0.5); }
  ctx.lineTo(x + 0.15, h - 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  crew(ctx, m, look, x + w * 0.42, h - 0.33, 0.44);
  // the bumper and the headlight
  ctx.fillStyle = bumper; rr(ctx, x + w - 0.1, y0 - 0.05, 0.2, 0.22, 0.05); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6b0'; rr(ctx, x + w - 0.12, y0 + 0.22, 0.12, 0.16, 0.04); ctx.fill();
}

function lightBar(ctx: Ctx, look: TruckLook, x: number, y: number, pose: Pose) {
  const t = pose.t ?? 0, on = pose.flash ? Math.floor(t * 5) % 2 : -1, fw = look.lights === 'fireworks' && look.truck !== 'gold';
  for (const side of [0, 1] as const) {
    const lit = on === -1 || on === side || fw, c = lit ? lamp(look, t, side) : '#5a2222';
    ctx.fillStyle = c;
    rr(ctx, x + side * 0.32, y, 0.28, 0.16, 0.06); ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke();
    if (lit && pose.flash) {
      // a small flash round the lit lamp (a big one read as a pink blob over the ladder)
      const cx = x + side * 0.32 + 0.14, cy = y + 0.08;
      ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = c;
      circle(ctx, cx, cy, fw ? 0.5 : look.lights === 'star' || look.lights === 'sparkle' ? 0.36 : 0.26); ctx.fill();
      if (fw) {
        // fireworks: sparks bursting out of the lamp
        ctx.globalAlpha = 0.9; ctx.strokeStyle = lamp(look, t + 0.3, side ? 0 : 1); ctx.lineWidth = 0.035;
        const k = (t * 3 + side * 0.5) % 1, r0 = 0.12 + k * 0.35, r1 = r0 + 0.1;
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047 + side; ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); } ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function ladderArt(ctx: Ctx, look: TruckLook, pose: Pose, rope: boolean) {
  const a = pose.ladderAngle ?? 0, len = pose.ladderLen ?? 2.4 + look.ladder * 0.08;
  if (rope) {
    // the aircraft's rope ladder hangs to wherever it's going
    ctx.strokeStyle = '#a8742f'; ctx.lineWidth = 0.05;
    const ex = LADDER_PIVOT.x + Math.cos(a) * len, ey = LADDER_PIVOT.y + Math.sin(a) * len;
    for (const off of [-0.12, 0.12]) line(ctx, LADDER_PIVOT.x + off, LADDER_PIVOT.y, ex + off, ey);
    const n = Math.max(2, Math.floor(len / 0.3));
    ctx.beginPath();
    for (let i = 1; i <= n; i++) { const f = i / n, x = LADDER_PIVOT.x + (ex - LADDER_PIVOT.x) * f, y = LADDER_PIVOT.y + (ey - LADDER_PIVOT.y) * f; ctx.moveTo(x - 0.12, y); ctx.lineTo(x + 0.12, y); }
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.translate(LADDER_PIVOT.x, LADDER_PIVOT.y);
  ctx.rotate(a);
  const rail = look.truck === 'gold' ? GOLD : look.ladder >= 4 ? '#ffd23f' : CHROME;
  ctx.fillStyle = rail; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  rr(ctx, 0, -0.02, len, 0.1, 0.03); ctx.fill(); ctx.stroke();
  rr(ctx, 0, 0.26, len, 0.1, 0.03); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = rail; ctx.lineWidth = 0.05;
  ctx.beginPath(); for (let x = 0.2; x < len - 0.05; x += 0.26) { ctx.moveTo(x, 0.06); ctx.lineTo(x, 0.28); } ctx.stroke();
  if (has(look, 'turbo')) {
    // the Turbo Ladder: a lightning zigzag down both rails
    ctx.strokeStyle = rail === CHROME ? '#ff9f1a' : '#2a7bff'; ctx.lineWidth = 0.035;
    for (const ry of [0.03, 0.31]) { ctx.beginPath(); for (let x = 0.05, i = 0; x < len - 0.05; x += 0.13, i++) ctx.lineTo(x, ry + (i % 2 ? 0.03 : -0.03)); ctx.stroke(); }
  }
  // the basket at the tip
  ctx.fillStyle = look.truck === 'gold' ? GOLD : '#ffd23f'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  rr(ctx, len - 0.05, -0.05, 0.32, 0.42, 0.05); ctx.fill(); ctx.stroke();
  ctx.restore();
  // the turntable
  ctx.fillStyle = STEEL; circle(ctx, LADDER_PIVOT.x, LADDER_PIVOT.y, 0.22); ctx.fill(); ink(ctx, 0.05);
}

/** The hose monitor at `at`, aimed at `pose.aim`, looking like his Nozzle. */
function monitor(ctx: Ctx, look: TruckLook, pose: Pose, at: At = NOZZLE_AT) {
  const a = pose.aim ?? 0.5, nz = look.nozzle, cannon = nz === 'cannon', thick = (cannon ? 0.2 : 0.1) + look.hose * 0.018;
  ctx.save(); ctx.translate(at.x, at.y);
  ctx.fillStyle = STEEL; circle(ctx, 0, -0.08, cannon ? 0.2 : 0.16); ctx.fill();
  ctx.rotate(a);
  const gold = nz === 'golden', brass = gold ? GOLD : look.pump >= 3 ? '#ffd23f' : BRASS;
  ctx.fillStyle = brass; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  if (nz === 'triple') {
    for (const r of [-0.42, 0.42]) { ctx.save(); ctx.rotate(r); rr(ctx, -0.02, -thick * 0.45, 0.5, thick * 0.9, 0.04); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  if (cannon) {
    // the Water Cannon: a big fat barrel with a muzzle ring
    rr(ctx, -0.12, -thick / 2, 0.62, thick, 0.07); ctx.fill(); ctx.stroke();
    ctx.fillStyle = STEEL; rr(ctx, 0.46, -thick * 0.62, 0.12, thick * 1.24, 0.04); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff88'; ctx.fillRect(-0.05, thick * 0.12, 0.45, thick * 0.18);
  } else {
    rr(ctx, -0.05, -thick / 2, 0.5, thick, 0.04); ctx.fill(); ctx.stroke();
  }
  if (nz === 'twin') { rr(ctx, -0.05, thick / 2, 0.42, thick * 0.8, 0.04); ctx.fill(); ctx.stroke(); }
  if (nz === 'fan') { ctx.beginPath(); ctx.moveTo(0.42, -thick); ctx.lineTo(0.56, -thick * 1.6); ctx.lineTo(0.56, thick * 1.6); ctx.lineTo(0.42, thick); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (nz === 'sprinkler') {
    // a watering-can rose on the end
    ctx.beginPath(); ctx.moveTo(0.4, -thick * 0.5); ctx.lineTo(0.52, -0.16); ctx.lineTo(0.52, 0.16); ctx.lineTo(0.4, thick * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.54, 0, 0.05, 0.17, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; for (let i = -2; i <= 2; i++) { circle(ctx, 0.55, i * 0.055, 0.014); ctx.fill(); }
  }
  if (gold) {
    // the Golden Nozzle: a glint that runs along the barrel
    ctx.fillStyle = '#fffbe0'; const k = ((pose.t ?? 0) * 0.8) % 1; glint(ctx, -0.02 + k * 0.5, thick * 0.15, 0.07 + Math.sin(k * Math.PI) * 0.06);
  }
  ctx.restore();
}

/** Where the gadgets go on a vehicle: its back end and the top there, and its cab. */
interface Spots { back: number; top: number; cabX: number; cabW: number; cabH: number; front: number; bellY?: number }

/** Draws the whole vehicle with its back wheel at world x0 (it faces right). */
export function drawTruck(ctx: Ctx, m: W2S, look: TruckLook, x0: number, pose: Pose = {}) {
  const yb = pose.bounce ?? 0;
  T = pose.t ?? 0;
  ctx.save();
  world(ctx, m, x0, yb);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const mm: W2S = { k: m.k, ox: m.ox + x0 * m.k, oy: m.oy - yb * m.k }, fam = kindOf(look.truck);
  if (fam === 'plane') plane(ctx, mm, look, pose);
  else if (fam === 'hover') hover(ctx, mm, look, pose);
  else ground(ctx, mm, look, pose);
  ctx.restore();
}

// ——— trucks ———

function ground(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose) {
  const kind = look.truck;
  if (pose.exhaust) exhaust(ctx, look, pose.t ?? 0, kind === 'mini' ? 1.15 : kind === 'train' ? -0.05 : 0.2, 0.5);
  if (has(look, 'trailer')) trailer(ctx, look);
  const s = kind === 'boat' ? boat(ctx, m, look, pose)
    : kind === 'steam' ? steam(ctx, m, look, pose)
    : kind === 'monster' ? monster(ctx, m, look, pose)
    : kind === 'jet' ? jetTruck(ctx, m, look, pose)
    : kind === 'train' ? train(ctx, m, look, pose)
    : standard(ctx, m, look, pose);
  gadgets(ctx, look, pose, s);
}

function standard(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  const kind = look.truck, tankBig = 0.04 * look.tank, gold = kind === 'gold', robot = kind === 'robot';
  const big = kind === 'crash' || kind === 'ladder' || kind === 'quint' || kind === 'tower' || gold;
  const bx = kind === 'mini' ? 1.3 : 0.35, bw = kind === 'brush' ? 3.0 : kind === 'mini' ? 2.55 : 3.55;
  const bh = kind === 'rescue' ? 1.5 : kind === 'crash' || robot ? 1.45 : kind === 'quint' || kind === 'tower' || gold ? 1.4 : 1.3;
  let top = bh;
  // the body
  if (kind === 'tanker') {
    ctx.fillStyle = STEEL; rr(ctx, 0.35, 0.4, 3.6, 0.2, 0.05); ctx.fill();
    ctx.beginPath(); ctx.roundRect(0.35, 0.58, 3.55, 0.86 + tankBig, 0.42); pattern(ctx, look.paint, 0.35, 0.58, 3.55, 0.86); ink(ctx);
    ctx.fillStyle = '#ffffff99'; ctx.fillRect(0.6, 1.1, 3.0, 0.07);
    top = 1.44 + tankBig;
  } else {
    ctx.beginPath(); ctx.roundRect(bx, 0.4, bw, bh - 0.4 + (kind === 'pumper' || kind === 'mini' ? tankBig : 0), kind === 'mini' ? 0.16 : 0.08);
    pattern(ctx, look.paint, bx, 0.4, bw, bh - 0.4);
    ink(ctx);
    // compartment doors, a white stripe (gold on the Golden Fire Engine)
    ctx.fillStyle = gold ? GOLD : '#ffffff'; ctx.fillRect(bx + 0.05, 0.86, bw - 0.1, gold ? 0.1 : 0.07);
    ctx.strokeStyle = '#00000055'; ctx.lineWidth = 0.035;
    const doors = kind === 'mini' ? 3 : 4;
    ctx.beginPath(); for (let i = 1; i < doors; i++) { ctx.moveTo(bx + i * bw / doors, 0.45); ctx.lineTo(bx + i * bw / doors, bh - 0.08); } ctx.stroke();
    if (kind === 'rescue') { ctx.fillStyle = CHROME; rr(ctx, 0.6, 1.0, 1.0, 0.3, 0.04); ctx.fill(); ctx.fillStyle = '#e63946'; ctx.fillRect(1.0, 1.08, 0.2, 0.14); ctx.fillRect(0.94, 1.12, 0.32, 0.06); }
    if (kind === 'brush') { ctx.fillStyle = CHROME; rr(ctx, 0.5, bh, 1.6, 0.35 + tankBig, 0.12); ctx.fill(); ink(ctx, 0.05); top = bh + 0.35; }
    if (kind === 'quint') {
      // a big round water tank on top, and spare ladders racked down the side
      ctx.fillStyle = CHROME; rr(ctx, 0.45, bh - 0.04, 2.25, 0.42 + tankBig, 0.2); ctx.fill(); ink(ctx, 0.05);
      ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 0.035; ctx.beginPath(); for (const x of [0.95, 1.55, 2.15]) { ctx.moveTo(x, bh); ctx.lineTo(x, bh + 0.34 + tankBig); } ctx.stroke();
      ctx.fillStyle = '#7fd3ff'; rr(ctx, 0.62, bh + 0.12, 0.22, 0.14, 0.04); ctx.fill();
      rack(ctx, 0.5, 3.75, 1.0);
      top = bh + 0.38 + tankBig;
    }
    if (gold) {
      // gold beading along the top, a big gold star on the side, a little sparkle
      ctx.strokeStyle = GOLD; ctx.lineWidth = 0.06; line(ctx, bx + 0.06, bh - 0.05, bx + bw - 0.06, bh - 0.05);
      ctx.fillStyle = GOLD; starPath(ctx, 2.0, 0.9, 0.34); ctx.fill(); ink(ctx, 0.04);
      ctx.fillStyle = '#fffbe0'; for (let i = 0; i < 3; i++) { const k = (Math.sin(T * 3 + i * 2.1) + 1) / 2; glint(ctx, [0.8, 2.85, 3.4][i]!, [1.15, 0.6, 1.2][i]!, 0.04 + k * 0.1); }
    }
    if (kind === 'mini') { ctx.fillStyle = '#ffd23f'; rr(ctx, bx - 0.08, 0.42, 0.12, 0.3, 0.04); ctx.fill(); ink(ctx, 0.03); }
  }
  // the hose reel
  ctx.fillStyle = gold ? GOLD : '#ffd23f'; circle(ctx, bx + 0.65, 0.68, 0.17 + look.hose * 0.015); ctx.fill(); ink(ctx, 0.04);
  // the cab
  const cabX = bx + bw - 0.02, cabW = kind === 'crash' ? 1.4 : 1.15, cabH = kind === 'crash' ? 1.75 : kind === 'brush' ? 1.55 : robot ? 1.7 : 1.65;
  cab(ctx, m, look, cabX, cabW, cabH, 0.4, robot, gold ? GOLD : CHROME);
  // wheels
  const hub = gold ? GOLD : undefined;
  if (kind === 'brush') { wheel(ctx, 0.95, 0.5, true); wheel(ctx, cabX + 0.6, 0.5, true); }
  else if (kind === 'crash') { wheel(ctx, 0.85, 0.46); wheel(ctx, 1.85, 0.46); wheel(ctx, cabX + 0.75, 0.46); }
  else if (big) { wheel(ctx, 0.8, 0.42, false, hub); wheel(ctx, 1.65, 0.42, false, hub); wheel(ctx, cabX + 0.6, 0.42, false, hub); }
  else if (kind === 'mini') { wheel(ctx, 2.0); wheel(ctx, cabX + 0.6); }
  else { wheel(ctx, 1.05); wheel(ctx, cabX + 0.6); }
  if (robot) robotBits(ctx, pose, cabX, cabW, cabH);
  if (kind === 'tower') { if (pose.aim != null) outriggers(ctx); towerBoom(ctx, look, pose); }
  ladderArt(ctx, look, pose, false);
  lightBar(ctx, look, cabX + 0.15, cabH, pose);
  if (kind !== 'tower') monitor(ctx, look, pose);
  return { back: bx, top, cabX, cabW, cabH, front: cabX + cabW };
}

/** A ground ladder racked along a body's side. */
function rack(ctx: Ctx, x0: number, x1: number, y: number) {
  ctx.fillStyle = CHROME; ctx.strokeStyle = OUT; ctx.lineWidth = 0.03;
  rr(ctx, x0, y, x1 - x0, 0.06, 0.02); ctx.fill(); ctx.stroke();
  rr(ctx, x0, y + 0.2, x1 - x0, 0.06, 0.02); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = CHROME; ctx.lineWidth = 0.04; ctx.beginPath(); for (let x = x0 + 0.12; x < x1 - 0.05; x += 0.2) { ctx.moveTo(x, y + 0.05); ctx.lineTo(x, y + 0.21); } ctx.stroke();
}

/** The Robot Truck: a friendly face on the cab, an antenna, and a robot arm holding the nozzle. */
function robotBits(ctx: Ctx, pose: Pose, cabX: number, cabW: number, cabH: number) {
  const t = pose.t ?? 0;
  // the face: two glowing eyes and a grille smile, under the window
  const ey = cabH - 0.78, blink = Math.sin(t * 1.3) > 0.97 ? 0.02 : 0.11;
  for (const ex of [cabX + 0.33, cabX + 0.8]) {
    ctx.fillStyle = '#e8f6ff'; circle(ctx, ex, ey, 0.13); ctx.fill(); ink(ctx, 0.04);
    ctx.fillStyle = '#20c4ff'; ctx.beginPath(); ctx.ellipse(ex + 0.02, ey, 0.08, blink * 0.8, 0, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#2a2a30'; rr(ctx, cabX + 0.3, 0.5, 0.55, 0.16, 0.05); ctx.fill();
  ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 0.025; ctx.beginPath(); for (let i = 1; i < 6; i++) { ctx.moveTo(cabX + 0.3 + i * 0.09, 0.52); ctx.lineTo(cabX + 0.3 + i * 0.09, 0.64); } ctx.stroke();
  // the antenna, its tip blinking
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.04; line(ctx, cabX + cabW - 0.2, cabH, cabX + cabW - 0.2, cabH + 0.42);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff2a2a' : '#ffd23f'; circle(ctx, cabX + cabW - 0.2, cabH + 0.45, 0.06); ctx.fill(); ink(ctx, 0.03);
  // the arm: a shoulder on the body, up to an elbow, down to a hand that holds the monitor
  const sh = { x: 2.1, y: 1.72 }, el = { x: 3.45, y: 2.4 }, hd = { x: NOZZLE_AT.x - 0.12, y: NOZZLE_AT.y + 0.08 };
  ctx.fillStyle = STEEL; rr(ctx, 1.8, 1.42, 0.6, 0.2, 0.05); ctx.fill(); ink(ctx, 0.04);
  ctx.strokeStyle = OUT; ctx.lineWidth = 0.22; line(ctx, sh.x, sh.y, el.x, el.y); line(ctx, el.x, el.y, hd.x, hd.y);
  ctx.strokeStyle = '#b9c2cc'; ctx.lineWidth = 0.15; line(ctx, sh.x, sh.y, el.x, el.y); line(ctx, el.x, el.y, hd.x, hd.y);
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 0.04; line(ctx, sh.x + 0.3, sh.y + 0.15, el.x - 0.3, el.y - 0.15);
  for (const j of [sh, el]) { ctx.fillStyle = STEEL; circle(ctx, j.x, j.y, 0.14); ctx.fill(); ink(ctx, 0.04); ctx.fillStyle = '#ffd23f'; circle(ctx, j.x, j.y, 0.05); ctx.fill(); }
  ctx.fillStyle = STEEL; rr(ctx, sh.x - 0.12, 1.55, 0.24, 0.2, 0.04); ctx.fill();
  // the gripper's two fingers round the nozzle
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.06;
  ctx.beginPath(); ctx.moveTo(hd.x, hd.y); ctx.quadraticCurveTo(hd.x + 0.2, hd.y + 0.2, hd.x + 0.28, hd.y + 0.05); ctx.moveTo(hd.x, hd.y); ctx.quadraticCurveTo(hd.x + 0.05, hd.y - 0.25, hd.x + 0.25, hd.y - 0.22); ctx.stroke();
}

/** The Tower Truck's boom: raised to its bucket at TOWER_NOZZLE at the Call, folded down over the truck in a picture. */
function towerBoom(ctx: Ctx, look: TruckLook, pose: Pose) {
  const up = pose.aim != null, base = { x: 1.15, y: 1.55 };
  const elbow = up ? { x: 1.75, y: 3.3 } : { x: 2.35, y: 2.25 };
  const bucket = up ? TOWER_NOZZLE : { x: 4.3, y: 2.25 };
  const tip = { x: bucket.x - 0.28, y: bucket.y - 0.22 };
  // the turret it turns on
  ctx.fillStyle = STEEL; rr(ctx, 0.8, 1.36, 0.7, 0.22, 0.05); ctx.fill(); ink(ctx, 0.04);
  const arm = (a: At, b: At, w: number) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = w + 0.08; line(ctx, a.x, a.y, b.x, b.y);
    ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = w; line(ctx, a.x, a.y, b.x, b.y);
    ctx.strokeStyle = '#d7262e'; ctx.lineWidth = w * 0.25; line(ctx, a.x, a.y, b.x, b.y);
  };
  arm(base, elbow, 0.2); arm(elbow, tip, 0.16);
  // the lifting rams
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.07;
  line(ctx, base.x + 0.35, base.y - 0.05, base.x + (elbow.x - base.x) * 0.55 + 0.05, base.y + (elbow.y - base.y) * 0.55);
  for (const j of [base, elbow]) { ctx.fillStyle = STEEL; circle(ctx, j.x, j.y, 0.13); ctx.fill(); ink(ctx, 0.04); }
  // the bucket, with the monitor on its rail
  ctx.fillStyle = '#ffd23f'; rr(ctx, bucket.x - 0.48, bucket.y - 0.48, 0.56, 0.42, 0.05); ctx.fill(); ink(ctx, 0.05);
  ctx.strokeStyle = OUT; ctx.lineWidth = 0.035; line(ctx, bucket.x - 0.48, bucket.y - 0.3, bucket.x + 0.08, bucket.y - 0.3);
  monitor(ctx, look, pose, bucket);
}
function outriggers(ctx: Ctx) {
  ctx.fillStyle = STEEL; ctx.strokeStyle = OUT; ctx.lineWidth = 0.035;
  for (const x of [0.45, 3.55]) { rr(ctx, x - 0.05, 0.08, 0.1, 0.5, 0.02); ctx.fill(); ctx.stroke(); rr(ctx, x - 0.16, 0.0, 0.32, 0.09, 0.02); ctx.fill(); ctx.stroke(); }
}

function boat(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  // the Fireboat on its trailer: a hull on wheels
  ctx.fillStyle = STEEL; rr(ctx, 0.5, 0.55, 3.9, 0.14, 0.05); ctx.fill();
  wheel(ctx, 1.1, 0.34); wheel(ctx, 1.85, 0.34); wheel(ctx, 4.15, 0.36);
  ctx.beginPath(); ctx.moveTo(0.4, 1.45); ctx.lineTo(4.9, 1.45); ctx.quadraticCurveTo(5.0, 0.95, 4.2, 0.7); ctx.lineTo(0.9, 0.7); ctx.closePath();
  pattern(ctx, look.paint, 0.4, 0.7, 4.6, 0.75); ink(ctx);
  ctx.fillStyle = '#fff'; ctx.fillRect(0.5, 1.12, 4.2, 0.08);
  ctx.fillStyle = '#f4f4f0'; rr(ctx, 3.3, 1.45, 1.0, 0.6, 0.08); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bfe6ff'; rr(ctx, 3.45, 1.62, 0.7, 0.3, 0.05); ctx.fill(); ctx.stroke();
  crew(ctx, m, look, 3.8, 1.77, 0.4);
  lightBar(ctx, look, 3.5, 2.05, pose);
  ladderArt(ctx, look, pose, false); monitor(ctx, look, pose);
  return { back: 0.4, top: 1.45, cabX: 3.3, cabW: 1.0, cabH: 2.05, front: 4.9, bellY: 1.4 };
}

/** The Steam Engine: an old brass steam pumper with big spoked wheels, the driver up front. */
function steam(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  const t = pose.t ?? 0;
  // steam puffing out of the stack, drifting back
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.7 + i / 4) % 1;
    ctx.fillStyle = `rgba(245,245,250,${(0.85 * (1 - k)).toFixed(2)})`;
    circle(ctx, 0.85 - k * 0.9 + Math.sin(t * 2 + i) * 0.05, 2.55 + k * 0.5, 0.12 + k * 0.22); ctx.fill();
  }
  // the frame
  ctx.beginPath(); ctx.moveTo(0.3, 0.82); ctx.lineTo(4.75, 0.82); ctx.lineTo(4.75, 1.08); ctx.lineTo(0.3, 1.08); ctx.closePath();
  pattern(ctx, look.paint, 0.3, 0.82, 4.45, 0.26); ink(ctx, 0.06);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 0.035; line(ctx, 0.4, 0.95, 4.65, 0.95);
  // the boiler: a shiny brass upright drum with bands, a smokestack on top
  const g = ctx.createLinearGradient(0.5, 0, 1.3, 0); g.addColorStop(0, '#a87a12'); g.addColorStop(0.35, '#ffe27a'); g.addColorStop(1, '#b8860b');
  ctx.fillStyle = g; rr(ctx, 0.5, 1.05, 0.8, 1.05, 0.12); ctx.fill(); ink(ctx, 0.06);
  ctx.strokeStyle = '#8a6410'; ctx.lineWidth = 0.05; ctx.beginPath(); for (const y of [1.3, 1.6, 1.88]) { ctx.moveTo(0.52, y); ctx.lineTo(1.28, y); } ctx.stroke();
  ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(0.78, 2.08); ctx.lineTo(0.72, 2.38); ctx.lineTo(0.62, 2.5); ctx.lineTo(1.08, 2.5); ctx.lineTo(0.98, 2.38); ctx.lineTo(1.02, 2.08); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = GOLD; rr(ctx, 0.6, 2.46, 0.5, 0.07, 0.03); ctx.fill();
  // the pump: a tall brass air dome
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(2.0, 1.08); ctx.lineTo(2.0, 1.55); ctx.quadraticCurveTo(2.25, 1.95, 2.5, 1.55); ctx.lineTo(2.5, 1.08); ctx.closePath(); ctx.fill(); ink(ctx, 0.05);
  ctx.fillStyle = GOLD; circle(ctx, 2.25, 1.86, 0.06); ctx.fill();
  // the ladder sits on a post behind the driver
  ctx.fillStyle = STEEL; rr(ctx, 3.0, 1.08, 0.2, 0.35, 0.03); ctx.fill();
  ladderArt(ctx, look, pose, false);
  // the driver's seat up front, high, with his buddy holding the reins
  ctx.beginPath(); ctx.moveTo(3.55, 1.08); ctx.lineTo(3.55, 1.38); ctx.lineTo(4.45, 1.38); ctx.lineTo(4.55, 1.08); ctx.closePath();
  pattern(ctx, look.paint, 3.55, 1.08, 1.0, 0.3); ink(ctx, 0.05);
  ctx.fillStyle = '#5a3a1e'; rr(ctx, 3.58, 1.36, 0.12, 0.55, 0.04); ctx.fill(); ink(ctx, 0.03); rr(ctx, 3.62, 1.36, 0.72, 0.09, 0.03); ctx.fill();
  crew(ctx, m, look, 4.0, 1.68, 0.5);
  lightBar(ctx, look, 3.42, 1.92, pose);
  // the monitor on a brass post at the very front
  ctx.fillStyle = BRASS; rr(ctx, 4.53, 1.08, 0.14, 0.38, 0.03); ctx.fill(); ink(ctx, 0.03);
  monitor(ctx, look, pose);
  // the big spoked wheels
  const sp = paintOf(look.paint).color;
  spoked(ctx, 1.0, 0.62, 0.62, sp); spoked(ctx, 3.95, 0.47, 0.47, sp);
  return { back: 0.3, top: 1.08, cabX: 3.42, cabW: 1.0, cabH: 2.1, front: 4.75, bellY: 1.32 };
}

/** The Monster Fire Truck: huge wheels, raised springs, a second monitor on the roof. */
function monster(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  const R = 0.64, by = 1.05, bh = 1.85;
  // the springs and shocks up from the axles
  for (const x of [1.05, 3.9]) {
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.08; line(ctx, x - 0.2, R, x - 0.2, by + 0.05); line(ctx, x + 0.2, R, x + 0.2, by + 0.05);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 0.05; ctx.beginPath();
    for (let i = 0; i <= 6; i++) ctx.lineTo(x + (i % 2 ? 0.12 : -0.12), R + 0.1 + i * (by - R - 0.1) / 6); ctx.stroke();
  }
  ctx.fillStyle = '#3a3f47'; rr(ctx, 0.7, by - 0.1, 3.6, 0.14, 0.05); ctx.fill();
  // the body, high up
  ctx.beginPath(); ctx.roundRect(0.4, by, 3.05, bh - by, 0.1); pattern(ctx, look.paint, 0.4, by, 3.05, bh - by); ink(ctx);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0.45, by + 0.32, 2.95, 0.07);
  ctx.strokeStyle = '#00000055'; ctx.lineWidth = 0.035; ctx.beginPath(); for (const x of [1.2, 2.0, 2.75]) { ctx.moveTo(x, by + 0.05); ctx.lineTo(x, bh - 0.06); } ctx.stroke();
  ctx.fillStyle = '#ffd23f'; circle(ctx, 0.85, by + 0.55, 0.17 + look.hose * 0.015); ctx.fill(); ink(ctx, 0.04);
  const cabX = 3.42, cabW = 1.1, cabH = 2.25;
  cab(ctx, m, look, cabX, cabW, cabH, by);
  // a chunky bull bar at the front holding the main monitor
  ctx.fillStyle = '#3a3f47'; rr(ctx, cabX + cabW - 0.05, by - 0.05, 0.22, 0.42, 0.05); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = STEEL; rr(ctx, NOZZLE_AT.x - 0.06, by + 0.3, 0.12, NOZZLE_AT.y - by - 0.32, 0.03); ctx.fill();
  // the roof monitor on its post
  const roof = { x: cabX + 0.88, y: cabH + 0.24 };
  ctx.fillStyle = STEEL; rr(ctx, roof.x - 0.05, cabH - 0.02, 0.1, 0.2, 0.02); ctx.fill();
  monsterWheel(ctx, 1.05, R); monsterWheel(ctx, 3.9, R);
  ladderArt(ctx, look, pose, false);
  lightBar(ctx, look, cabX + 0.08, cabH, pose);
  monitor(ctx, look, pose, roof);
  monitor(ctx, look, pose);
  return { back: 0.4, top: bh, cabX, cabW, cabH: cabH + 0.1, front: cabX + cabW, bellY: 1.7 };
}

/** The Jet Truck: a low truck carrying two big jet engines, the nozzle between their mouths. */
function jetTruck(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  const t = pose.t ?? 0;
  // the flat bed
  ctx.beginPath(); ctx.roundRect(0.35, 0.4, 3.6, 0.45, 0.08); pattern(ctx, look.paint, 0.35, 0.4, 3.6, 0.45); ink(ctx);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0.4, 0.6, 3.5, 0.06);
  // the frame the engines sit in
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.08; ctx.beginPath();
  for (const x of [1.0, 2.9]) { ctx.moveTo(x, 0.85); ctx.lineTo(x, 1.8); } ctx.stroke();
  const engine = (cy: number, r: number, x0: number, x1: number) => {
    // the hot tail, glowing
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(x0 + 0.05, cy + r * 0.85); ctx.lineTo(x0 - 0.3, cy + r * 0.55); ctx.lineTo(x0 - 0.3, cy - r * 0.55); ctx.lineTo(x0 + 0.05, cy - r * 0.85); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
    ctx.fillStyle = `rgba(255,${120 + Math.round(60 * Math.sin(t * 20))},40,0.9)`; ctx.beginPath(); ctx.ellipse(x0 - 0.3, cy, 0.06, r * 0.45, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#7a838d'); g.addColorStop(0.65, '#e8edf2'); g.addColorStop(1, '#9aa3ad');
    ctx.fillStyle = g; rr(ctx, x0, cy - r, x1 - x0, r * 2, r * 0.5); ctx.fill(); ink(ctx, 0.05);
    // a painted band, and the round mouth at the front
    ctx.beginPath(); ctx.rect(x0 + (x1 - x0) * 0.55, cy - r, 0.3, r * 2); pattern(ctx, look.paint, x0, cy - r, x1 - x0, r * 2); ink(ctx, 0.03);
    ctx.fillStyle = '#d9dee4'; ctx.beginPath(); ctx.ellipse(x1, cy, 0.13, r * 1.02, 0, 0, 7); ctx.fill(); ink(ctx, 0.05);
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x1 + 0.02, cy, 0.08, r * 0.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = STEEL; circle(ctx, x1 + 0.04, cy, 0.06); ctx.fill();
  };
  engine(1.2, 0.3, 0.75, 3.55);
  engine(2.0, 0.33, 0.95, 3.95);
  const cabX = 3.88, cabW = 1.15, cabH = 1.32;
  cab(ctx, m, look, cabX, cabW, cabH);
  lightBar(ctx, look, cabX + 0.12, cabH, pose);
  // the nozzle on a mast between the two engines' mouths
  ctx.fillStyle = STEEL; rr(ctx, NOZZLE_AT.x - 0.05, cabH - 0.02, 0.1, NOZZLE_AT.y - cabH - 0.04, 0.02); ctx.fill();
  wheel(ctx, 0.95); wheel(ctx, 1.8); wheel(ctx, cabX + 0.6);
  ladderArt(ctx, look, pose, false);
  monitor(ctx, look, pose);
  return { back: 0.35, top: 0.85, cabX, cabW, cabH, front: cabX + cabW };
}

/** The Fire Train: a little steam locomotive pulling a water tank car, on its rails. */
function train(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose): Spots {
  const t = pose.t ?? 0;
  // the track: sleepers and a rail
  ctx.fillStyle = '#7a4a2a'; for (let x = -0.3; x < 5.7; x += 0.36) ctx.fillRect(x, -0.02, 0.2, 0.07);
  ctx.fillStyle = '#8a929c'; ctx.fillRect(-0.4, 0.05, 6.2, 0.06); ctx.fillStyle = OUT; ctx.fillRect(-0.4, 0.04, 6.2, 0.015);
  // steam from the stack
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    ctx.fillStyle = `rgba(245,245,250,${(0.85 * (1 - k)).toFixed(2)})`;
    circle(ctx, 4.2 - k * 1.0, 2.15 + k * 0.4, 0.1 + k * 0.2); ctx.fill();
  }
  // the tank car, three tanks' worth (three hatches on top)
  ctx.fillStyle = '#3a3f47'; rr(ctx, 0.05, 0.36, 1.95, 0.14, 0.04); ctx.fill();
  ctx.beginPath(); ctx.roundRect(0.1, 0.5, 1.85, 0.8, 0.36); pattern(ctx, look.paint, 0.1, 0.5, 1.85, 0.8); ink(ctx);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0.2, 0.86, 1.65, 0.07);
  for (const x of [0.45, 1.02, 1.6]) { ctx.fillStyle = CHROME; rr(ctx, x - 0.12, 1.26, 0.24, 0.12, 0.04); ctx.fill(); ink(ctx, 0.03); }
  ctx.fillStyle = '#2f9bff'; ctx.beginPath(); ctx.moveTo(1.02, 1.2); ctx.quadraticCurveTo(0.9, 1.0, 1.02, 0.98); ctx.quadraticCurveTo(1.14, 1.0, 1.02, 1.2); ctx.fill();
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.06; line(ctx, 1.98, 0.44, 2.2, 0.44);
  // the locomotive: a cab at the back, a long boiler, a smokestack, a cowcatcher
  ctx.fillStyle = '#3a3f47'; rr(ctx, 2.15, 0.38, 2.85, 0.16, 0.04); ctx.fill();
  ctx.beginPath(); ctx.roundRect(2.95, 0.55, 1.95, 0.8, [0.05, 0.38, 0.38, 0.05]); pattern(ctx, look.paint, 2.95, 0.55, 1.95, 0.8); ink(ctx);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 0.05; ctx.beginPath(); for (const x of [3.45, 3.95, 4.45]) { ctx.moveTo(x, 0.57); ctx.lineTo(x, 1.33); } ctx.stroke();
  ctx.fillStyle = '#2a2a30'; circle(ctx, 4.9, 0.95, 0.06); ctx.fill();
  ctx.fillStyle = '#fff6b0'; rr(ctx, 4.82, 1.05, 0.14, 0.16, 0.04); ctx.fill(); ink(ctx, 0.03);
  // the cowcatcher
  ctx.fillStyle = '#3a3f47'; ctx.beginPath(); ctx.moveTo(4.85, 0.55); ctx.lineTo(5.35, 0.14); ctx.lineTo(4.85, 0.14); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 0.03; ctx.beginPath(); for (const f of [0.3, 0.55, 0.8]) { ctx.moveTo(4.87, 0.15 + f * 0.38); ctx.lineTo(4.87 + (1 - f) * 0.48, 0.15); } ctx.stroke();
  ctx.fillStyle = BRASS; ctx.beginPath(); ctx.moveTo(3.55, 1.33); ctx.quadraticCurveTo(3.7, 1.62, 3.85, 1.33); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  // the cab
  ctx.beginPath(); ctx.rect(2.15, 0.55, 0.85, 1.4); pattern(ctx, look.paint, 2.15, 0.55, 0.85, 1.4); ink(ctx);
  ctx.fillStyle = '#2a2a30'; rr(ctx, 2.05, 1.92, 1.05, 0.1, 0.04); ctx.fill();
  ctx.fillStyle = '#bfe6ff'; rr(ctx, 2.28, 1.35, 0.6, 0.45, 0.05); ctx.fill(); ink(ctx, 0.05);
  crew(ctx, m, look, 2.58, 1.55, 0.42);
  lightBar(ctx, look, 2.26, 2.02, pose);
  ladderArt(ctx, look, pose, false);
  // the stack stands in front of the stowed ladder
  ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(4.08, 1.3); ctx.lineTo(4.02, 1.78); ctx.lineTo(3.9, 1.98); ctx.lineTo(4.5, 1.98); ctx.lineTo(4.38, 1.78); ctx.lineTo(4.32, 1.3); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = GOLD; rr(ctx, 3.88, 1.95, 0.64, 0.07, 0.03); ctx.fill();
  ctx.fillStyle = STEEL; rr(ctx, NOZZLE_AT.x - 0.05, 1.3, 0.1, 0.2, 0.02); ctx.fill();
  monitor(ctx, look, pose);
  // the wheels: three big driving wheels with a rod, little ones on the car
  for (const x of [2.55, 3.3, 4.05]) spoked(ctx, x, 0.41, 0.3, paintOf(look.paint).color);
  ctx.fillStyle = CHROME; rr(ctx, 2.45, 0.34, 1.7, 0.07, 0.03); ctx.fill(); ink(ctx, 0.03);
  for (const x of [0.5, 1.55]) { ctx.fillStyle = '#1c1c1e'; circle(ctx, x, 0.3, 0.2); ctx.fill(); ctx.fillStyle = '#b9c2cc'; circle(ctx, x, 0.3, 0.08); ctx.fill(); }
  return { back: 0.1, top: 1.3, cabX: 2.15, cabW: 0.85, cabH: 2.02, front: 5.3, bellY: 1.2 };
}

/** The Gadgets on a truck, each where it fits. */
function gadgets(ctx: Ctx, look: TruckLook, pose: Pose, s: Spots) {
  const t = pose.t ?? 0;
  if (has(look, 'flag')) {
    const px = s.back + 0.1, py = s.top;
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.04; line(ctx, px, py, px, py + 0.85);
    ctx.fillStyle = '#e01b24'; ctx.beginPath(); ctx.moveTo(px, py + 0.85);
    for (let i = 1; i <= 4; i++) ctx.lineTo(px - i * 0.12, py + 0.85 + Math.sin(t * 8 - i) * 0.04 * i / 2);
    for (let i = 4; i >= 1; i--) ctx.lineTo(px - i * 0.12, py + 0.55 + Math.sin(t * 8 - i) * 0.04 * i / 2);
    ctx.lineTo(px, py + 0.55); ctx.closePath(); ctx.fill(); ink(ctx, 0.025);
  }
  if (has(look, 'fan')) {
    const fx = s.back + 0.55, fy = s.top + 0.3;
    ctx.fillStyle = '#3a3f47'; rr(ctx, fx - 0.05, s.top - 0.02, 0.1, 0.1, 0.02); ctx.fill();
    ctx.fillStyle = '#2a2a30'; circle(ctx, fx, fy, 0.28); ctx.fill(); ink(ctx, 0.04);
    ctx.fillStyle = '#9ff0ff'; for (let i = 0; i < 3; i++) { const a = t * 14 + i * 2.094; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 0.12, fy + Math.sin(a) * 0.12, 0.12, 0.05, a, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#b9c2cc'; ctx.lineWidth = 0.025; circle(ctx, fx, fy, 0.26); ctx.stroke(); line(ctx, fx - 0.26, fy, fx + 0.26, fy); line(ctx, fx, fy - 0.26, fx, fy + 0.26);
  }
  if (has(look, 'bell')) {
    const bx = s.cabX + 0.16, by = s.bellY ?? s.cabH - 0.55;
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.035; line(ctx, bx, by + 0.02, bx, by + 0.14);
    ctx.fillStyle = '#e0a82a'; ctx.beginPath(); ctx.moveTo(bx - 0.08, by); ctx.quadraticCurveTo(bx - 0.08, by - 0.2, bx - 0.15, by - 0.24); ctx.lineTo(bx + 0.15, by - 0.24); ctx.quadraticCurveTo(bx + 0.08, by - 0.2, bx + 0.08, by); ctx.closePath(); ctx.fill(); ink(ctx, 0.03);
    ctx.fillStyle = '#fff3c0'; ctx.fillRect(bx - 0.05, by - 0.16, 0.03, 0.12);
    ctx.fillStyle = '#8a6410'; circle(ctx, bx + Math.sin(t * 6) * 0.03, by - 0.27, 0.035); ctx.fill();
  }
  if (has(look, 'spotlight')) {
    const lx = s.cabX + s.cabW - 0.32, ly = s.cabH;
    ctx.fillStyle = '#3a3f47'; rr(ctx, lx - 0.03, ly - 0.02, 0.06, 0.12, 0.02); ctx.fill();
    ctx.save(); ctx.translate(lx, ly + 0.17); ctx.rotate(0.25);
    ctx.fillStyle = '#fff6b055'; ctx.beginPath(); ctx.moveTo(0.1, 0.07); ctx.lineTo(0.75, 0.2); ctx.lineTo(0.75, -0.14); ctx.lineTo(0.1, -0.07); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2a30'; rr(ctx, -0.14, -0.09, 0.24, 0.18, 0.04); ctx.fill(); ink(ctx, 0.03);
    ctx.fillStyle = '#fff6b0'; rr(ctx, 0.08, -0.08, 0.05, 0.16, 0.02); ctx.fill();
    ctx.restore();
  }
  if (has(look, 'cannon')) {
    const at = { x: s.cabX + 0.3, y: s.cabH + 0.32 };
    ctx.fillStyle = STEEL; rr(ctx, at.x - 0.05, s.cabH + 0.1, 0.1, 0.18, 0.02); ctx.fill();
    monitor(ctx, look, pose, at);
  }
  if (has(look, 'drone') && !pose.droneAway) miniDrone(ctx, s.back + 1.35, Math.max(s.top, 1.45) + 0.55 + Math.sin(t * 3) * 0.06, t);
  if (has(look, 'hydrant')) {
    // the hose from the hydrant to the front of the truck, then the hydrant
    ctx.strokeStyle = '#e8c27a'; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(5.3, 0.3); ctx.quadraticCurveTo(5.05, -0.02, Math.min(s.front, 5.0) - 0.05, 0.42); ctx.stroke();
    ctx.fillStyle = '#e01b24'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.035;
    rr(ctx, 5.27, 0.05, 0.26, 0.42, 0.04); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(5.4, 0.47, 0.13, 0, Math.PI); ctx.fill(); ctx.stroke();
    rr(ctx, 5.21, 0.24, 0.38, 0.1, 0.03); ctx.fill(); ctx.stroke();
    rr(ctx, 5.22, 0.0, 0.36, 0.07, 0.02); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; circle(ctx, 5.4, 0.62, 0.035); ctx.fill();
  }
}

/** A Rescue Drone: a little body with two spinning rotors. */
function miniDrone(ctx: Ctx, x: number, y: number, t: number) {
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.04; line(ctx, x - 0.32, y + 0.08, x + 0.32, y + 0.08);
  ctx.fillStyle = '#f4f4f0'; rr(ctx, x - 0.18, y - 0.08, 0.36, 0.16, 0.06); ctx.fill(); ink(ctx, 0.03);
  ctx.fillStyle = '#e01b24'; ctx.fillRect(x - 0.03, y - 0.06, 0.06, 0.12); ctx.fillRect(x - 0.07, y - 0.02, 0.14, 0.04);
  ctx.fillStyle = '#2a2a30';
  for (const dx of [-0.32, 0.32]) { const sp = 0.34 * Math.abs(Math.cos(t * 35 + dx * 4)); rr(ctx, x + dx - sp / 2 - 0.02, y + 0.12, sp + 0.04, 0.035, 0.015); ctx.fill(); }
  ctx.fillStyle = '#ff2a2a'; circle(ctx, x + 0.17, y - 0.1, 0.025); ctx.fill();
}

/** The Water Trailer: a round tank on one wheel, hitched behind. */
function trailer(ctx: Ctx, look: TruckLook) {
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.07; line(ctx, -0.05, 0.42, 0.4, 0.45);
  ctx.beginPath(); ctx.roundRect(-1.3, 0.38, 1.3, 0.72, 0.34); pattern(ctx, look.paint, -1.3, 0.38, 1.3, 0.72); ink(ctx, 0.06);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.18, 0.7, 1.06, 0.06);
  ctx.fillStyle = CHROME; rr(ctx, -0.75, 1.06, 0.22, 0.09, 0.03); ctx.fill(); ink(ctx, 0.03);
  wheel(ctx, -0.65, 0.3);
}

// ——— the exhaust ———

/** What comes out behind him when he drives, by the Engine's Rung: from (ex, ey), trailing left. */
function exhaust(ctx: Ctx, look: TruckLook, t: number, ex: number, ey: number) {
  const e = look.engine ?? 0;
  ctx.save();
  if (e <= 1 || e === 3) {
    const n = e === 0 ? 3 : 4, grey = e === 1 ? '60,60,66' : '170,172,178', rows = e === 3 ? [0.1, -0.1] : [0];
    if (e === 3) {
      // twin chrome pipes
      ctx.fillStyle = '#eef2f6'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.03;
      for (const dy of rows) { rr(ctx, ex - 0.12, ey + dy - 0.045, 0.32, 0.09, 0.04); ctx.fill(); ctx.stroke(); }
    }
    for (const dy of rows) for (let i = 0; i < n; i++) {
      const k = (t * (e === 1 ? 1.6 : 2.2) + i / n + dy) % 1;
      ctx.fillStyle = `rgba(${e === 3 ? '200,204,212' : grey},${((e === 1 ? 0.75 : 0.6) * (1 - k)).toFixed(2)})`;
      circle(ctx, ex - 0.15 - k * (e === 1 ? 1.3 : 1.0), ey + dy + k * 0.3 + Math.sin(i * 2 + t * 3) * 0.04, (e === 1 ? 0.12 : 0.07) + k * (e === 1 ? 0.28 : 0.16)); ctx.fill();
    }
  } else if (e === 2 || e === 4 || e === 5) {
    const L = (e === 2 ? 0.8 : e === 4 ? 1.6 : 2.0) * (1 + 0.12 * Math.sin(t * 40)), W = e === 2 ? 0.12 : e === 4 ? 0.16 : 0.24;
    const cs = e === 2 ? ['#2a7bff', '#9ff0ff'] : e === 4 ? ['#ff7a00', '#ffe27a'] : ['#ff3a1a', '#ffd23f'];
    for (let j = 0; j < 2; j++) {
      const l = L * (j ? 0.6 : 1), w = W * (j ? 0.55 : 1);
      ctx.fillStyle = cs[j]!; ctx.beginPath(); ctx.moveTo(ex + 0.05, ey + w);
      ctx.quadraticCurveTo(ex - l * 0.4, ey + w * 1.1, ex - l, ey + Math.sin(t * 30) * 0.03); ctx.quadraticCurveTo(ex - l * 0.4, ey - w * 1.1, ex + 0.05, ey - w); ctx.closePath(); ctx.fill();
    }
    if (e === 5) {
      ctx.fillStyle = '#ffe27a';
      for (let i = 0; i < 7; i++) { const k = (t * 1.8 + i * 0.143) % 1; ctx.fillRect(ex - 0.4 - k * 2.2, ey + Math.sin(i * 12.9 + t * 5) * (0.1 + k * 0.35), 0.06, 0.06); }
    }
  } else {
    // the Rainbow Engine: a wavy rainbow trail
    ctx.lineWidth = 0.075; ctx.lineCap = 'butt';
    for (let b = 0; b < 6; b++) {
      ctx.strokeStyle = RAINBOW[b]!; ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const x = ex + 0.05 - i * 0.2; ctx.lineTo(x, ey + 0.19 - b * 0.075 + Math.sin(t * 8 - i * 0.7) * 0.025 * i); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ——— hovering aircraft ———

function hover(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose) {
  const kind = look.truck, t = pose.t ?? 0;
  if (pose.exhaust) {
    const [ex, ey] = kind === 'drone' ? [2.65, 1.45] : kind === 'blimp' ? [0.1, 1.95] : kind === 'jetpack' ? [2.95, 1.2] : kind === 'twin' ? [0.35, 1.4] : kind === 'skycrane' ? [0.1, 1.65] : [0.05, 1.15];
    exhaust(ctx, look, t, ex, ey);
  }
  if (kind === 'drone') bigger(ctx, m, 3.6, 1.45, 1.15, mb => drone(ctx, mb, look, pose, t));
  else if (kind === 'blimp') blimp(ctx, m, look, pose, t);
  else if (kind === 'jetpack') bigger(ctx, m, 3.75, 0.05, 1.22, mb => jetpack(ctx, mb, look, pose, t, 3.75, 0.05, 1.22));
  else if (kind === 'twin') twinRotor(ctx, m, look, pose, t);
  else if (kind === 'skycrane') skyCrane(ctx, m, look, pose, t);
  else heli(ctx, m, look, pose, t);
  ladderArt(ctx, look, { ...pose, ladderAngle: pose.ladderAngle ?? -Math.PI / 2, ladderLen: pose.ladderLen ?? 0.3 }, true);
  monitor(ctx, look, pose);
}

/** Draws `draw` scaled by s about (cx, cy), with a matching W2S for the emoji in it. */
function bigger(ctx: Ctx, m: W2S, cx: number, cy: number, s: number, draw: (m: W2S) => void) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  draw({ k: m.k * s, ox: m.ox + cx * m.k * (1 - s), oy: m.oy - cy * m.k * (1 - s) });
  ctx.restore();
}

/** A rotor seen from the side: a blade whose length turns with t, and a faint disc. */
function rotor(ctx: Ctx, x: number, y: number, span: number, t: number, speed = 30, phase = 0) {
  ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x, y + 0.04, span / 2, 0.06, 0, 0, 7); ctx.fill(); ctx.restore();
  const s = span * Math.abs(Math.cos(t * speed + phase));
  ctx.fillStyle = '#2a2a30'; rr(ctx, x - s / 2 - 0.05, y, Math.max(0.1, s + 0.1), 0.08, 0.04); ctx.fill();
}

function heli(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number) {
  // the skids
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.08;
  ctx.beginPath(); ctx.moveTo(1.2, 0.12); ctx.lineTo(4.2, 0.12); ctx.moveTo(1.8, 0.12); ctx.lineTo(1.9, 0.55); ctx.moveTo(3.6, 0.12); ctx.lineTo(3.5, 0.55); ctx.stroke();
  // the tail
  ctx.beginPath(); ctx.moveTo(0.1, 1.25); ctx.lineTo(2.0, 1.1); ctx.lineTo(2.0, 0.85); ctx.lineTo(0.1, 1.05); ctx.closePath();
  pattern(ctx, look.paint, 0.1, 0.85, 1.9, 0.4); ink(ctx, 0.06);
  ctx.fillStyle = STEEL; circle(ctx, 0.2, 1.15, 0.28); ctx.fill();
  // the body
  ctx.beginPath(); ctx.ellipse(3.0, 1.05, 1.5, 0.62, 0, 0, 7);
  pattern(ctx, look.paint, 1.5, 0.43, 3.0, 1.24); ink(ctx);
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(3.8, 1.2, 0.6, 0.36, 0, 0, 7); ctx.fill(); ctx.stroke();
  crew(ctx, m, look, 3.85, 1.2, 0.42);
  // the water bucket hanging under it
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.03; line(ctx, 2.6, 0.45, 2.6, 0.3);
  // the rotor, turning
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(2.9, 1.65, 0.2, 0.25);
  const span = 2.4 * Math.abs(Math.cos(t * 30));
  ctx.fillStyle = '#2a2a30'; rr(ctx, 3.0 - span / 2, 1.9, Math.max(0.1, span), 0.08, 0.04); ctx.fill();
  lightBar(ctx, look, 2.0, 1.55, pose);
}

/** The Fire Drone: a little quad-copter, four rotors, a camera bubble and a basket. */
function drone(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number) {
  // the far arms and rotors first (higher up, a little grey)
  ctx.strokeStyle = '#6b737d'; ctx.lineWidth = 0.08;
  line(ctx, 3.2, 1.65, 2.75, 1.98); line(ctx, 3.9, 1.65, 4.35, 1.98);
  for (const x of [2.75, 4.35]) { ctx.fillStyle = '#6b737d'; rr(ctx, x - 0.08, 1.95, 0.16, 0.14, 0.03); ctx.fill(); rotor(ctx, x, 2.1, 0.95, t, 40, x); }
  // the basket on its lines
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.025; line(ctx, 3.55, 1.2, 3.5, 0.72); line(ctx, 3.95, 1.2, 4.0, 0.72);
  ctx.fillStyle = '#c98a2a'; ctx.beginPath(); ctx.moveTo(3.45, 0.72); ctx.lineTo(4.05, 0.72); ctx.lineTo(3.97, 0.42); ctx.lineTo(3.53, 0.42); ctx.closePath(); ctx.fill(); ink(ctx, 0.035);
  ctx.strokeStyle = '#8a5a1a'; ctx.lineWidth = 0.025; line(ctx, 3.5, 0.6, 4.0, 0.6); line(ctx, 3.75, 0.43, 3.75, 0.71);
  // legs
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.06; line(ctx, 3.1, 1.22, 2.9, 0.92); line(ctx, 4.1, 1.22, 4.3, 0.92); line(ctx, 2.78, 0.92, 3.02, 0.92); line(ctx, 4.18, 0.92, 4.42, 0.92);
  // the body
  ctx.beginPath(); ctx.roundRect(2.85, 1.2, 1.5, 0.5, 0.22); pattern(ctx, look.paint, 2.85, 1.2, 1.5, 0.5); ink(ctx, 0.06);
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(3.95, 1.45, 0.3, 0.2, 0, 0, 7); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 3.97, 1.45, 0.32);
  // the nozzle arm
  ctx.fillStyle = STEEL; rr(ctx, 4.3, 1.42, 0.3, 0.08, 0.03); ctx.fill();
  // the near arms and rotors
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.1;
  line(ctx, 3.0, 1.62, 2.35, 1.86); line(ctx, 4.2, 1.62, 4.85, 1.86);
  for (const x of [2.35, 4.85]) { ctx.fillStyle = '#3a3f47'; rr(ctx, x - 0.09, 1.82, 0.18, 0.16, 0.03); ctx.fill(); rotor(ctx, x, 1.98, 1.05, t, 40, x * 2); }
  lightBar(ctx, look, 3.0, 1.7, pose);
}

/** The Fire Blimp: a big painted envelope with fins and a gondola underneath. */
function blimp(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number) {
  const cx = 2.5, cy = 1.98, rx = 2.35, ry = 0.66;
  // fins behind
  ctx.beginPath(); ctx.moveTo(0.85, 2.4); ctx.lineTo(0.3, 2.78); ctx.lineTo(0.02, 2.78); ctx.lineTo(0.22, 2.2); ctx.closePath(); pattern(ctx, look.paint, 0, 2.2, 0.9, 0.6); ink(ctx, 0.05);
  ctx.beginPath(); ctx.moveTo(0.85, 1.56); ctx.lineTo(0.3, 1.18); ctx.lineTo(0.02, 1.18); ctx.lineTo(0.22, 1.76); ctx.closePath(); pattern(ctx, look.paint, 0, 1.18, 0.9, 0.6); ink(ctx, 0.05);
  // struts and the gondola
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.035; line(ctx, 2.8, 1.42, 2.65, 1.42 + 0.0); line(ctx, 2.75, 1.4, 2.6, 1.55); line(ctx, 3.85, 1.4, 4.0, 1.6);
  // the envelope
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); pattern(ctx, look.paint, cx - rx, cy - ry, rx * 2, ry * 2); ink(ctx);
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.clip();
  ctx.strokeStyle = '#00000030'; ctx.lineWidth = 0.03; ctx.beginPath(); for (const k of [0.45, 0.8]) { ctx.ellipse(cx, cy, rx * k, ry, 0, 0, 7); } ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - rx, cy - 0.06, rx * 2, 0.12);
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(cx + 0.2, cy + 0.38, rx * 0.7, 0.12, 0, 0, 7); ctx.fill();
  ctx.restore();
  // a big emblem: a water drop in a white ring
  ctx.fillStyle = '#ffffff'; circle(ctx, 2.9, cy, 0.3); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = '#2f9bff'; ctx.beginPath(); ctx.moveTo(2.9, cy + 0.2); ctx.quadraticCurveTo(2.73, cy - 0.06, 2.9, cy - 0.17); ctx.quadraticCurveTo(3.07, cy - 0.06, 2.9, cy + 0.2); ctx.fill();
  // side fin
  ctx.beginPath(); ctx.moveTo(0.75, cy + 0.02); ctx.lineTo(0.05, cy + 0.12); ctx.lineTo(0.05, cy - 0.12); ctx.lineTo(0.75, cy - 0.1); ctx.closePath(); pattern(ctx, look.paint, 0, cy - 0.12, 0.8, 0.24); ink(ctx, 0.04);
  // the gondola, his buddy in the window, a pusher prop at its back
  ctx.fillStyle = '#f4f4f0'; rr(ctx, 2.6, 0.92, 1.45, 0.5, 0.2); ctx.fill(); ink(ctx, 0.06);
  ctx.fillStyle = '#bfe6ff'; rr(ctx, 2.85, 1.02, 1.0, 0.28, 0.08); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 3.55, 1.15, 0.34);
  ctx.fillStyle = STEEL; rr(ctx, 2.35, 1.1, 0.3, 0.12, 0.04); ctx.fill();
  const ps = 0.5 * Math.abs(Math.cos(t * 30));
  ctx.fillStyle = '#2a2a30'; rr(ctx, 2.3, 1.16 - ps / 2, 0.07, Math.max(0.06, ps), 0.03); ctx.fill();
  // the hose out to the monitor
  ctx.strokeStyle = STEEL; ctx.lineWidth = 0.08; line(ctx, 4.0, 1.25, NOZZLE_AT.x - 0.05, NOZZLE_AT.y - 0.1);
  lightBar(ctx, look, 2.95, 0.76, pose);
}

/** The Jet Pack: a firefighter with a jet pack on, flying on its flames and holding the hose. */
function jetpack(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number, cx: number, cy: number, s: number) {
  // drawn scaled up about (cx, cy): the hand still has to reach the real nozzle
  const hx = cx + (NOZZLE_AT.x - 0.2 - cx) / s, hy = cy + (NOZZLE_AT.y - 0.04 - cy) / s;
  // the flames under the pack
  for (const x of [3.13, 3.42]) {
    const L = 0.6 + 0.12 * Math.sin(t * 40 + x * 9);
    ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.moveTo(x - 0.09, 0.82); ctx.quadraticCurveTo(x - 0.1, 0.82 - L * 0.5, x, 0.82 - L); ctx.quadraticCurveTo(x + 0.1, 0.82 - L * 0.5, x + 0.09, 0.82); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(x - 0.05, 0.82); ctx.quadraticCurveTo(x - 0.05, 0.82 - L * 0.3, x, 0.82 - L * 0.6); ctx.quadraticCurveTo(x + 0.05, 0.82 - L * 0.3, x + 0.05, 0.82); ctx.closePath(); ctx.fill();
  }
  // legs and boots
  ctx.fillStyle = '#2a3550'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  ctx.save(); ctx.translate(3.72, 0.95); ctx.rotate(-0.25); rr(ctx, -0.1, -0.62, 0.2, 0.66, 0.06); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#141414'; rr(ctx, -0.12, -0.72, 0.3, 0.14, 0.05); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#2a3550';
  ctx.save(); ctx.translate(3.98, 0.95); ctx.rotate(-0.1); rr(ctx, -0.1, -0.6, 0.2, 0.64, 0.06); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#141414'; rr(ctx, -0.12, -0.7, 0.3, 0.14, 0.05); ctx.fill(); ctx.restore();
  // the pack: two tanks in his paint
  ctx.fillStyle = '#2a2a30'; for (const x of [3.05, 3.34]) { ctx.beginPath(); ctx.moveTo(x, 0.98); ctx.lineTo(x + 0.02, 0.82); ctx.lineTo(x + 0.14, 0.82); ctx.lineTo(x + 0.16, 0.98); ctx.closePath(); ctx.fill(); }
  for (const x of [2.98, 3.28]) { ctx.beginPath(); ctx.roundRect(x, 0.95, 0.3, 0.95, 0.14); pattern(ctx, look.paint, x, 0.95, 0.3, 0.95); ink(ctx, 0.05); }
  ctx.fillStyle = CHROME; rr(ctx, 3.0, 1.38, 0.56, 0.08, 0.03); ctx.fill(); ink(ctx, 0.03);
  // the coat, with shiny stripes
  ctx.fillStyle = '#e8b04a'; rr(ctx, 3.52, 0.88, 0.66, 0.82, 0.14); ctx.fill(); ink(ctx, 0.05);
  ctx.fillStyle = '#fff6b0'; ctx.fillRect(3.55, 1.05, 0.6, 0.07); ctx.fillStyle = '#d9dee4'; ctx.fillRect(3.55, 1.12, 0.6, 0.04);
  // the arm out to the hose
  ctx.strokeStyle = OUT; ctx.lineWidth = 0.2; line(ctx, 3.95, 1.5, hx, hy);
  ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 0.14; line(ctx, 3.95, 1.5, hx, hy);
  ctx.fillStyle = '#141414'; circle(ctx, hx + 0.03, hy - 0.02, 0.09); ctx.fill();
  // his head, helmet on
  emoji(ctx, m, '🧑‍🚒', 3.85, 1.98, 0.72);
  // the lights on the pack, his buddy riding on top
  lightBar(ctx, look, 2.97, 1.6, pose);
  crew(ctx, m, look, 3.22, 2.12, 0.36);
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.05; line(ctx, 3.3, 1.0, 3.6, 1.0);
}

/** The Twin Rotor Helicopter: a long body with a rotor at each end, two buckets hanging under it. */
function twinRotor(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number) {
  // the buckets on their cables
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.03;
  for (const x of [1.75, 3.05]) {
    line(ctx, x, 0.72, x, 0.38); line(ctx, x, 0.5, x - 0.18, 0.32); line(ctx, x, 0.5, x + 0.18, 0.32);
    ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.moveTo(x - 0.22, 0.32); ctx.lineTo(x + 0.22, 0.32); ctx.lineTo(x + 0.16, 0.0); ctx.lineTo(x - 0.16, 0.0); ctx.closePath(); ctx.fill(); ink(ctx, 0.035);
    ctx.fillStyle = '#7fd3ff'; ctx.beginPath(); ctx.ellipse(x, 0.31, 0.2, 0.04, 0, 0, 7); ctx.fill();
  }
  // the back tower that lifts the rear rotor
  ctx.beginPath(); ctx.moveTo(0.3, 1.4); ctx.lineTo(0.55, 2.05); ctx.lineTo(1.5, 2.05); ctx.lineTo(1.75, 1.55); ctx.closePath(); pattern(ctx, look.paint, 0.3, 1.4, 1.45, 0.65); ink(ctx, 0.06);
  // the long body
  ctx.beginPath(); ctx.moveTo(0.3, 1.55); ctx.lineTo(4.2, 1.62); ctx.quadraticCurveTo(4.95, 1.6, 5.05, 1.1); ctx.quadraticCurveTo(5.05, 0.72, 4.5, 0.7); ctx.lineTo(1.0, 0.72); ctx.lineTo(0.3, 1.15); ctx.closePath();
  pattern(ctx, look.paint, 0.3, 0.7, 4.75, 0.92); ink(ctx);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0.6, 0.98, 3.75, 0.07);
  // the fuel pods along its belly
  ctx.fillStyle = '#3a3f47'; rr(ctx, 1.45, 0.62, 2.1, 0.22, 0.1); ctx.fill(); ink(ctx, 0.035);
  // round windows, the cockpit with his buddy
  ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.03;
  for (let x = 1.25; x < 3.9; x += 0.42) { circle(ctx, x, 1.27, 0.09); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(4.25, 1.5); ctx.lineTo(4.65, 1.5); ctx.quadraticCurveTo(4.95, 1.4, 4.98, 1.1); ctx.lineTo(4.25, 1.1); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 4.5, 1.28, 0.34);
  // little wheels
  for (const x of [1.15, 4.15]) { ctx.fillStyle = '#1c1c1e'; circle(ctx, x, 0.6, 0.12); ctx.fill(); }
  lightBar(ctx, look, 2.3, 1.6, pose);
  // the two rotors on their masts
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(0.95, 2.03, 0.14, 0.18); ctx.fillRect(4.0, 1.6, 0.14, 0.28);
  rotor(ctx, 1.02, 2.2, 2.5, t, 28, 0);
  rotor(ctx, 4.07, 1.88, 2.5, t, 28, 1.3);
}

/** The Sky Crane: a skeleton helicopter with a big water tank slung under it and a snorkel hose hanging down. */
function skyCrane(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number) {
  // the snorkel hose dangling from the tank
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.moveTo(2.5, 0.55); ctx.quadraticCurveTo(2.35 + Math.sin(t * 2) * 0.05, 0.25, 2.2, 0.06); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; rr(ctx, 2.08, -0.04, 0.24, 0.12, 0.04); ctx.fill(); ink(ctx, 0.03);
  // the long spindly legs
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.07;
  line(ctx, 1.65, 1.5, 1.2, 0.45); line(ctx, 3.55, 1.5, 3.95, 0.45); line(ctx, 4.25, 1.05, 4.45, 0.45);
  for (const x of [1.2, 3.95, 4.45]) { ctx.fillStyle = '#1c1c1e'; circle(ctx, x, 0.38, 0.11); ctx.fill(); }
  // the tail boom: a thin spine with a tall fin and a tail rotor
  ctx.beginPath(); ctx.moveTo(0.15, 1.72); ctx.lineTo(3.95, 1.95); ctx.lineTo(3.95, 1.5); ctx.lineTo(0.25, 1.55); ctx.closePath();
  pattern(ctx, look.paint, 0.15, 1.5, 3.8, 0.45); ink(ctx, 0.06);
  ctx.beginPath(); ctx.moveTo(0.1, 1.55); ctx.lineTo(0.05, 2.35); ctx.lineTo(0.4, 2.35); ctx.lineTo(0.55, 1.7); ctx.closePath(); pattern(ctx, look.paint, 0.05, 1.55, 0.5, 0.8); ink(ctx, 0.05);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#2a2a30'; circle(ctx, 0.3, 2.0, 0.28); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#2a2a30'; const ts = 0.5 * Math.abs(Math.cos(t * 40)); rr(ctx, 0.27, 2.0 - ts / 2, 0.06, Math.max(0.06, ts), 0.03); ctx.fill();
  // the engines' hump on top
  ctx.fillStyle = '#9aa3ad'; rr(ctx, 2.1, 1.9, 1.6, 0.28, 0.12); ctx.fill(); ink(ctx, 0.05);
  // the big water tank slung underneath
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.05; line(ctx, 2.1, 1.5, 2.2, 1.18); line(ctx, 3.3, 1.5, 3.2, 1.18);
  ctx.fillStyle = CHROME; rr(ctx, 1.75, 0.55, 1.85, 0.66, 0.26); ctx.fill(); ink(ctx, 0.06);
  ctx.fillStyle = '#2f9bff'; rr(ctx, 1.95, 0.68, 1.45, 0.2, 0.08); ctx.fill();
  ctx.fillStyle = '#ffffff99'; ctx.fillRect(1.95, 1.0, 1.45, 0.06);
  // the cockpit at the front
  ctx.beginPath(); ctx.moveTo(3.85, 2.0); ctx.lineTo(4.35, 2.0); ctx.quadraticCurveTo(5.05, 1.95, 5.0, 1.35); ctx.quadraticCurveTo(4.95, 0.98, 4.35, 0.95); ctx.lineTo(3.85, 1.05); ctx.closePath();
  pattern(ctx, look.paint, 3.85, 0.95, 1.2, 1.05); ink(ctx);
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(4.2, 1.42); ctx.lineTo(4.9, 1.42); ctx.quadraticCurveTo(4.92, 1.1, 4.6, 1.05); ctx.lineTo(4.2, 1.05); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 4.5, 1.22, 0.34);
  lightBar(ctx, look, 3.75, 2.0, pose);
  // the main rotor
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(2.83, 2.16, 0.14, 0.2);
  rotor(ctx, 2.9, 2.36, 3.1, t, 28, 0);
}

// ——— planes ———

function plane(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose) {
  const t = pose.t ?? 0, f = pose.facing ?? 1;
  ctx.save();
  if (f === -1) { ctx.translate(2 * PLANE_DROP.x, 0); ctx.scale(-1, 1); }
  const mir = (x: number) => f === -1 ? 2 * PLANE_DROP.x - x : x;
  if (pose.exhaust) exhaust(ctx, look, t, 0.2, look.truck === 'scooper' ? 1.0 : 0.72);
  if (look.truck === 'scooper') scooper(ctx, m, look, pose, t, mir);
  else if (look.truck === 'airtanker') airTanker(ctx, m, look, pose, t, mir);
  else superJet(ctx, m, look, pose, t, mir);
  ctx.restore();
}

/** The Water Bomber: a high-winged amphibious plane, two propellers, floats, a water hatch in its boat belly. */
function scooper(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number, mir: (x: number) => number) {
  const yellowish = /^#(ff[d-f]|e2b|fff)/i.test(paintOf(look.paint).color), band = yellowish ? '#d7262e' : '#ffd23f';
  // the tail: a tall fin with the tailplane up high
  ctx.beginPath(); ctx.moveTo(0.3, 0.95); ctx.lineTo(0.18, 1.82); ctx.lineTo(0.62, 1.82); ctx.lineTo(1.15, 1.02); ctx.closePath(); pattern(ctx, look.paint, 0.18, 0.95, 1.0, 0.9); ink(ctx, 0.06);
  ctx.fillStyle = band; rr(ctx, -0.05, 1.5, 0.95, 0.1, 0.04); ctx.fill(); ink(ctx, 0.04);
  // the far engine (a little higher and greyer)
  ctx.fillStyle = '#9aa3ad'; rr(ctx, 3.05, 1.3, 0.75, 0.2, 0.09); ctx.fill(); ink(ctx, 0.04);
  // the boat-bottomed body
  ctx.beginPath(); ctx.moveTo(0.3, 1.02); ctx.lineTo(3.9, 1.13); ctx.quadraticCurveTo(4.8, 1.12, 5.0, 0.78); ctx.quadraticCurveTo(5.0, 0.4, 4.4, 0.32); ctx.lineTo(2.95, 0.3); ctx.lineTo(2.85, 0.36); ctx.lineTo(1.3, 0.55); ctx.lineTo(0.3, 0.86); ctx.closePath();
  pattern(ctx, look.paint, 0.3, 0.3, 4.7, 0.83);
  // the bright hull band, like the yellow water bombers
  ctx.save(); ctx.clip(); ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(0, 0.62); ctx.lineTo(1.3, 0.62); ctx.lineTo(5.2, 0.5); ctx.lineTo(5.2, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(0.3, 1.02); ctx.lineTo(3.9, 1.13); ctx.quadraticCurveTo(4.8, 1.12, 5.0, 0.78); ctx.quadraticCurveTo(5.0, 0.4, 4.4, 0.32); ctx.lineTo(2.95, 0.3); ctx.lineTo(2.85, 0.36); ctx.lineTo(1.3, 0.55); ctx.lineTo(0.3, 0.86); ctx.closePath(); ink(ctx);
  // cockpit and a side window with his buddy
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(4.3, 1.08); ctx.lineTo(4.62, 1.06); ctx.lineTo(4.85, 0.86); ctx.lineTo(4.3, 0.86); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  rr(ctx, 3.55, 0.7, 0.42, 0.3, 0.08); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 3.76, 0.85, 0.32, mir(3.76));
  // the water hatch in its belly
  ctx.fillStyle = '#2a2a30'; rr(ctx, 2.32, 0.34, 0.56, 0.1, 0.03); ctx.fill();
  ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 0.025; line(ctx, 2.6, 0.35, 2.6, 0.43);
  // the floats under it
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.05; line(ctx, 3.3, 0.33, 3.25, 0.18); line(ctx, 3.8, 0.33, 3.85, 0.18);
  ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.moveTo(3.0, 0.16); ctx.lineTo(3.95, 0.16); ctx.quadraticCurveTo(4.15, 0.1, 3.95, 0.04); ctx.lineTo(3.05, 0.04); ctx.closePath(); ctx.fill(); ink(ctx, 0.035);
  // the high wing on top, the near engine and both propellers
  ctx.fillStyle = paintOf(look.paint).color; rr(ctx, 2.35, 1.12, 1.7, 0.13, 0.06); ctx.fill(); ink(ctx, 0.05);
  ctx.fillStyle = band; rr(ctx, 2.9, 1.15, 0.85, 0.24, 0.1); ctx.fill(); ink(ctx, 0.045);
  const prop = (x: number, y: number, ph: number, c: string) => {
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x, y, 0.05, 0.4, 0, 0, 7); ctx.fill(); ctx.restore();
    const s = 0.8 * Math.abs(Math.cos(t * 30 + ph));
    ctx.fillStyle = c; rr(ctx, x - 0.035, y - s / 2 - 0.03, 0.07, s + 0.06, 0.03); ctx.fill();
    ctx.fillStyle = band; circle(ctx, x, y, 0.06); ctx.fill(); ink(ctx, 0.025);
  };
  prop(3.88, 1.4, 1, '#55555e');
  prop(3.8, 1.27, 0, '#2a2a30');
  lightBar(ctx, look, 1.9, 1.08, pose);
}

/** The Air Tanker: a big four-engine jet with a long row of windows and a water tank under its belly. */
function airTanker(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number, mir: (x: number) => number) {
  const jet = (x: number, y: number, far: boolean) => {
    ctx.fillStyle = far ? '#9aa3ad' : '#d9dee4'; rr(ctx, x, y, 0.62, 0.2, 0.09); ctx.fill(); ink(ctx, 0.04);
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(x + 0.62, y + 0.1, 0.04, 0.09, 0, 0, 7); ctx.fill();
    if (!far) { ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.05; line(ctx, x + 0.3, y + 0.2, x + 0.2, y + 0.3); }
  };
  // the far wing's engines peek out under the body
  jet(3.5, 0.3, true); jet(2.2, 0.36, true);
  // the tail
  ctx.beginPath(); ctx.moveTo(0.4, 1.0); ctx.lineTo(0.15, 1.85); ctx.lineTo(0.55, 1.85); ctx.lineTo(1.3, 1.02); ctx.closePath(); pattern(ctx, look.paint, 0.15, 1.0, 1.15, 0.85); ink(ctx, 0.06);
  // the long body
  ctx.beginPath(); ctx.moveTo(0.3, 1.0); ctx.lineTo(4.3, 1.06); ctx.quadraticCurveTo(4.95, 1.04, 5.02, 0.72); ctx.quadraticCurveTo(4.95, 0.44, 4.3, 0.42); ctx.lineTo(1.3, 0.42); ctx.lineTo(0.3, 0.82); ctx.closePath();
  pattern(ctx, look.paint, 0.3, 0.42, 4.72, 0.64); ink(ctx);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0.55, 0.66, 4.3, 0.07);
  ctx.fillStyle = '#bfe6ff'; for (let x = 1.4; x < 4.2; x += 0.2) { rr(ctx, x, 0.8, 0.09, 0.1, 0.03); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(4.5, 0.9); ctx.lineTo(4.78, 0.9); ctx.lineTo(4.9, 0.8); ctx.lineTo(4.5, 0.8); ctx.closePath(); ctx.fill(); ink(ctx, 0.03);
  crew(ctx, m, look, 4.15, 0.86, 0.28, mir(4.15));
  // the tailplane
  ctx.fillStyle = paintOf(look.paint).color; ctx.beginPath(); ctx.moveTo(1.1, 0.9); ctx.lineTo(0.35, 0.68); ctx.lineTo(0.15, 0.7); ctx.lineTo(0.5, 0.92); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  // the water tank and its doors, under the belly
  ctx.fillStyle = '#e01b24'; rr(ctx, 2.15, 0.33, 0.9, 0.14, 0.06); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(2.4, 0.33, 0.4, 0.04);
  // the near wing, swept back, with its two engines
  ctx.fillStyle = '#b9c2cc'; ctx.beginPath(); ctx.moveTo(3.4, 0.5); ctx.lineTo(2.5, 0.48); ctx.lineTo(1.35, 0.16); ctx.lineTo(1.7, 0.14); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  jet(3.1, 0.16, false); jet(1.95, 0.0, false);
  lightBar(ctx, look, 2.3, 1.03, pose);
  ctx.fillStyle = `rgba(255,60,60,${0.5 + 0.5 * Math.sin(t * 6)})`; circle(ctx, 1.42, 0.15, 0.05); ctx.fill();
}

/** The Super Jet: a sleek golden jet with a rainbow stripe and a glowing tail. */
function superJet(ctx: Ctx, m: W2S, look: TruckLook, pose: Pose, t: number, mir: (x: number) => number) {
  // the far wing
  ctx.fillStyle = GOLD_DARK; ctx.beginPath(); ctx.moveTo(3.2, 0.74); ctx.lineTo(1.9, 0.76); ctx.lineTo(1.35, 1.05); ctx.lineTo(1.75, 1.05); ctx.closePath(); ctx.fill(); ink(ctx, 0.035);
  // the tail fin
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(1.5, 0.92); ctx.lineTo(0.62, 1.7); ctx.lineTo(0.3, 1.7); ctx.lineTo(0.45, 0.9); ctx.closePath(); ctx.fill(); ink(ctx, 0.05);
  ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 0.05; line(ctx, 0.5, 1.2, 1.15, 1.15); ctx.strokeStyle = '#2a7bff'; line(ctx, 0.46, 1.32, 1.0, 1.28);
  // the glowing nozzle at the back
  const k = 0.5 + 0.5 * Math.sin(t * 25);
  ctx.fillStyle = `rgba(255,${150 + Math.round(80 * k)},60,0.9)`; ctx.beginPath(); ctx.ellipse(0.22, 0.71, 0.08, 0.14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a3f47'; rr(ctx, 0.22, 0.56, 0.2, 0.31, 0.05); ctx.fill(); ink(ctx, 0.04);
  // the body: long, slim and pointed
  const body = () => { ctx.beginPath(); ctx.moveTo(5.1, 0.7); ctx.quadraticCurveTo(4.4, 0.98, 3.6, 0.95); ctx.lineTo(1.0, 0.92); ctx.lineTo(0.4, 0.86); ctx.lineTo(0.4, 0.56); ctx.lineTo(1.2, 0.5); ctx.lineTo(3.6, 0.5); ctx.quadraticCurveTo(4.4, 0.5, 5.1, 0.7); ctx.closePath(); };
  body(); pattern(ctx, look.paint, 0.4, 0.5, 4.7, 0.48);
  ctx.save(); ctx.clip();
  for (let b = 0; b < 6; b++) { ctx.fillStyle = RAINBOW[b]!; ctx.beginPath(); ctx.moveTo(0.4, 0.78 - b * 0.035); ctx.lineTo(4.3, 0.74 - b * 0.03); ctx.lineTo(4.3, 0.715 - b * 0.03); ctx.lineTo(0.4, 0.745 - b * 0.035); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  body(); ctx.lineWidth = 0.1; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 0.05; ctx.strokeStyle = GOLD; ctx.stroke();
  // gold nose cone
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(5.1, 0.7); ctx.quadraticCurveTo(4.85, 0.82, 4.55, 0.83); ctx.lineTo(4.55, 0.55); ctx.quadraticCurveTo(4.85, 0.57, 5.1, 0.7); ctx.closePath(); ctx.fill(); ink(ctx, 0.04);
  // the bubble canopy with his buddy
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(3.75, 0.95, 0.55, 0.2, 0, 0, Math.PI); ctx.fill(); ink(ctx, 0.04);
  crew(ctx, m, look, 3.7, 1.03, 0.28, mir(3.7));
  // the water pod under its belly
  ctx.fillStyle = GOLD; rr(ctx, 2.25, 0.36, 0.7, 0.16, 0.07); ctx.fill(); ink(ctx, 0.04);
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(2.45, 0.36, 0.3, 0.035);
  // the near wing, swept, gold
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(3.4, 0.6); ctx.lineTo(2.0, 0.6); ctx.lineTo(1.25, 0.18); ctx.lineTo(1.8, 0.18); ctx.closePath(); ctx.fill(); ink(ctx, 0.045);
  ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 0.04; line(ctx, 3.0, 0.57, 1.9, 0.24);
  lightBar(ctx, look, 2.1, 0.93, pose);
  // sparkles along it
  ctx.fillStyle = '#fffbe0'; for (let i = 0; i < 3; i++) { const s = (Math.sin(t * 4 + i * 2.1) + 1) / 2; glint(ctx, [1.6, 2.9, 4.5][i]!, [0.3, 0.99, 0.76][i]!, 0.04 + 0.1 * s); }
}

/** A picture of the truck for a tile: drawn once per look and kept. */
const pics = new Map<string, string>();
export function truckPic(look: TruckLook, w = 240, h = 150): string {
  const key = JSON.stringify(look) + w + h;
  let url = pics.get(key);
  if (url) return url;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  // a Water Trailer hitched behind needs more room on the left
  const a = has(look, 'trailer') && kindOf(look.truck) === 'truck' ? -1.45 : -0.2, b = 6.2;
  const k = Math.min(w / (b - a), h / 2.6);
  drawTruck(ctx, { k, ox: (w - (b - a) * k) / 2 - a * k, oy: h - 0.1 * k }, look, 0);
  url = c.toDataURL();
  pics.set(key, url);
  return url;
}
