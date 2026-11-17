// His fire engine, drawn in code from its parts on a 2D canvas, so the one in the Station is the one at the Call. Drawn in world
// units (a truck is about 4.6 long, the ground is y = 0, y goes up) through `w2s`, which maps a world point to the canvas. The
// Station draws it big on its own canvas; the Call draws it in the scene with its ladder raised and the water coming out.
import { BUDDIES, LIGHTS, PAINTS, type BuddyId, type LightsId, type NozzleId, type PaintId, type TruckId } from '../station/parts';

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
  /** How far the truck has bounced on its springs. */
  bounce?: number;
}

export type W2S = { k: number; ox: number; oy: number };
export const LADDER_PIVOT = { x: 3.1, y: 1.45 } as const;
export const NOZZLE_AT = { x: 4.6, y: 1.55 } as const;

const OUT = '#141414';
const paintOf = (id: PaintId) => PAINTS.find(p => p.id === id) ?? PAINTS[0];
export const lightColor = (id: LightsId, t: number, side: 0 | 1): string => {
  const l = LIGHTS.find(x => x.id === id) ?? LIGHTS[0];
  if (id === 'redwhite') return side ? '#ffffff' : '#ff2a2a';
  if (id === 'rainbow') return `hsl(${((t * 240) + side * 180) % 360} 100% 60%)`;
  if (id === 'disco') return `hsl(${(Math.floor(t * 6) * 77 + side * 140) % 360} 100% 62%)`;
  return l.color;
};


/** Draws in world units: everything below goes through this transform (y up). */
function world(ctx: CanvasRenderingContext2D, m: W2S, x0: number, y0: number) { ctx.setTransform(m.k, 0, 0, -m.k, m.ox + x0 * m.k, m.oy - y0 * m.k); }
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function emoji(ctx: CanvasRenderingContext2D, m: W2S, ch: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${Math.round(size * m.k)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, m.ox + x * m.k, m.oy - y * m.k);
  ctx.restore();
}

/** The paint's pattern over a shape already traced as the current path (clipped to it). */
function pattern(ctx: CanvasRenderingContext2D, id: PaintId, x: number, y: number, w: number, h: number) {
  const p = paintOf(id);
  ctx.fillStyle = p.color; ctx.fill();
  if (!('pattern' in p)) return;
  ctx.save(); ctx.clip();
  const pat = p.pattern;
  if (pat === 'stripes') { ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h * 0.42, w, h * 0.14); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + h * 0.36, w, h * 0.05); }
  else if (pat === 'spots') { ctx.fillStyle = '#111'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(x + w * ((i * 0.37) % 1), y + h * ((i * 0.61) % 1), 0.13, 0.1, i, 0, 7); ctx.fill(); } }
  else if (pat === 'candy') { ctx.fillStyle = '#fff'; for (let i = -4; i < 12; i++) { ctx.beginPath(); ctx.moveTo(x + i * 0.45, y); ctx.lineTo(x + i * 0.45 + 0.2, y); ctx.lineTo(x + i * 0.45 + 0.2 + h, y + h); ctx.lineTo(x + i * 0.45 + h, y + h); ctx.fill(); } }
  else if (pat === 'tiger' || pat === 'zebra') { ctx.strokeStyle = '#111'; ctx.lineWidth = pat === 'zebra' ? 0.13 : 0.09; for (let i = 0; i < 12; i++) { const sx = x + i * w / 11; ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.quadraticCurveTo(sx + 0.2, y + h * 0.5, sx - 0.05, y + h * (pat === 'zebra' ? 0 : 0.35)); ctx.stroke(); } }
  else if (pat === 'camo') { const cs = ['#3f5226', '#8a7a4a', '#2c3a1c']; for (let i = 0; i < 14; i++) { ctx.fillStyle = cs[i % 3]!; ctx.beginPath(); ctx.ellipse(x + w * ((i * 0.29) % 1), y + h * ((i * 0.53) % 1), 0.3, 0.16, i, 0, 7); ctx.fill(); } }
  else if (pat === 'flames') { ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.moveTo(x + w, y); for (let i = 0; i <= 6; i++) ctx.lineTo(x + w - 0.6 - i * 0.35 - (i % 2) * 0.5, y + h * (i / 6)); ctx.lineTo(x + w, y + h); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x + w, y + h * 0.1); for (let i = 0; i <= 4; i++) ctx.lineTo(x + w - 0.3 - i * 0.22 - (i % 2) * 0.3, y + h * (0.1 + i * 0.2)); ctx.lineTo(x + w, y + h * 0.9); ctx.fill(); }
  else if (pat === 'rainbow') { const cs = ['#ff2a2a', '#ff8c1a', '#ffd23f', '#2bb673', '#2a7bff', '#7d3cff']; cs.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + h - (i + 1) * h / 6, w, h / 6 + 0.01); }); }
  else if (pat === 'galaxy') { ctx.fillStyle = '#5b2fa8'; ctx.beginPath(); ctx.ellipse(x + w * 0.4, y + h * 0.5, w * 0.35, h * 0.3, 0.2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; for (let i = 0; i < 16; i++) ctx.fillRect(x + w * ((i * 0.37) % 1), y + h * ((i * 0.71) % 1), 0.05, 0.05); }
  else if (pat === 'glow') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffd23f'); g.addColorStop(0.5, '#ff4a1a'); g.addColorStop(1, '#a3150a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}

function wheel(ctx: CanvasRenderingContext2D, x: number, r = 0.42, big = false) {
  ctx.fillStyle = '#1c1c1e'; ctx.beginPath(); ctx.arc(x, r, r * (big ? 1.2 : 1), 0, 7); ctx.fill();
  ctx.fillStyle = '#b9c2cc'; ctx.beginPath(); ctx.arc(x, r, r * 0.45, 0, 7); ctx.fill();
  ctx.fillStyle = '#5d6670'; ctx.beginPath(); ctx.arc(x, r, r * 0.16, 0, 7); ctx.fill();
}

function cab(ctx: CanvasRenderingContext2D, look: TruckLook, x: number, w: number, h: number, m: W2S, ox: number) {
  // the cab at the front (on the right: he drives toward the fire)
  ctx.beginPath(); ctx.moveTo(x, 0.4); ctx.lineTo(x, h); ctx.lineTo(x + w - 0.35, h); ctx.lineTo(x + w, h - 0.45); ctx.lineTo(x + w, 0.4); ctx.closePath();
  pattern(ctx, look.paint, x, 0.4, w, h - 0.4);
  ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
  // the window, with his buddy in it
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(x + 0.15, h - 0.1); ctx.lineTo(x + w - 0.4, h - 0.1); ctx.lineTo(x + w - 0.12, h - 0.5); ctx.lineTo(x + 0.15, h - 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  buddy(ctx, m, look.buddy, ox + x + w * 0.42, h - 0.33, 0.44);
  // the bumper and the headlight
  ctx.fillStyle = '#d9dee4'; rr(ctx, x + w - 0.1, 0.35, 0.2, 0.22, 0.05); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6b0'; rr(ctx, x + w - 0.12, 0.62, 0.12, 0.16, 0.04); ctx.fill();
}

function buddy(ctx: CanvasRenderingContext2D, m: W2S, id: BuddyId, x: number, y: number, size: number) {
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

function lightBar(ctx: CanvasRenderingContext2D, look: TruckLook, x: number, y: number, pose: Pose) {
  const t = pose.t ?? 0, on = pose.flash ? Math.floor(t * 5) % 2 : -1;
  for (const side of [0, 1] as const) {
    const lit = on === -1 || on === side;
    ctx.fillStyle = lit ? lightColor(look.lights, t, side) : '#5a2222';
    rr(ctx, x + side * 0.32, y, 0.28, 0.16, 0.06); ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = OUT; ctx.stroke();
    if (lit && pose.flash) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = lightColor(look.lights, t, side);
      ctx.beginPath(); ctx.arc(x + side * 0.32 + 0.14, y + 0.08, look.lights === 'star' || look.lights === 'sparkle' ? 0.55 : 0.4, 0, 7); ctx.fill(); ctx.restore();
    }
  }
}

function ladderArt(ctx: CanvasRenderingContext2D, look: TruckLook, pose: Pose, rope: boolean) {
  const a = pose.ladderAngle ?? 0, len = pose.ladderLen ?? 2.4 + look.ladder * 0.08;
  ctx.save();
  ctx.translate(LADDER_PIVOT.x, LADDER_PIVOT.y);
  ctx.rotate(rope ? -Math.PI / 2 + 0 : a);
  if (rope) {
    // the Fire Helicopter's rope ladder hangs to wherever it's going
    ctx.restore(); ctx.save();
    ctx.strokeStyle = '#a8742f'; ctx.lineWidth = 0.05;
    const ex = LADDER_PIVOT.x + Math.cos(a) * len, ey = LADDER_PIVOT.y + Math.sin(a) * len;
    for (const off of [-0.12, 0.12]) { ctx.beginPath(); ctx.moveTo(LADDER_PIVOT.x + off, LADDER_PIVOT.y); ctx.lineTo(ex + off, ey); ctx.stroke(); }
    const n = Math.max(2, Math.floor(len / 0.3));
    for (let i = 1; i <= n; i++) { const f = i / n, x = LADDER_PIVOT.x + (ex - LADDER_PIVOT.x) * f, y = LADDER_PIVOT.y + (ey - LADDER_PIVOT.y) * f; ctx.beginPath(); ctx.moveTo(x - 0.12, y); ctx.lineTo(x + 0.12, y); ctx.stroke(); }
    ctx.restore();
    return;
  }
  const rail = look.ladder >= 4 ? '#ffd23f' : '#d9dee4';
  ctx.fillStyle = rail; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  rr(ctx, 0, -0.02, len, 0.1, 0.03); ctx.fill(); ctx.stroke();
  rr(ctx, 0, 0.26, len, 0.1, 0.03); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = rail; ctx.lineWidth = 0.05;
  for (let x = 0.2; x < len - 0.05; x += 0.26) { ctx.beginPath(); ctx.moveTo(x, 0.06); ctx.lineTo(x, 0.28); ctx.stroke(); }
  // the basket at the tip
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  rr(ctx, len - 0.05, -0.05, 0.32, 0.42, 0.05); ctx.fill(); ctx.stroke();
  ctx.restore();
  // the turntable
  ctx.fillStyle = '#5d6670'; ctx.beginPath(); ctx.arc(LADDER_PIVOT.x, LADDER_PIVOT.y, 0.22, 0, 7); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke();
}

function monitor(ctx: CanvasRenderingContext2D, look: TruckLook, pose: Pose) {
  const a = pose.aim ?? 0.5, thick = 0.1 + look.hose * 0.018;
  ctx.save(); ctx.translate(NOZZLE_AT.x, NOZZLE_AT.y);
  ctx.fillStyle = '#5d6670'; ctx.beginPath(); ctx.arc(0, -0.08, 0.16, 0, 7); ctx.fill();
  ctx.rotate(a);
  const brass = look.pump >= 3 ? '#ffd23f' : '#c9a227';
  ctx.fillStyle = brass; ctx.strokeStyle = OUT; ctx.lineWidth = 0.04;
  rr(ctx, -0.05, -thick / 2, 0.5, thick, 0.04); ctx.fill(); ctx.stroke();
  if (look.nozzle === 'twin') { rr(ctx, -0.05, thick / 2, 0.42, thick * 0.8, 0.04); ctx.fill(); ctx.stroke(); }
  if (look.nozzle === 'fan') { ctx.beginPath(); ctx.moveTo(0.42, -thick); ctx.lineTo(0.56, -thick * 1.6); ctx.lineTo(0.56, thick * 1.6); ctx.lineTo(0.42, thick); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

/** Draws the whole truck with its back wheel at world x0 (it faces right). */
export function drawTruck(ctx: CanvasRenderingContext2D, m: W2S, look: TruckLook, x0: number, pose: Pose = {}) {
  const yb = pose.bounce ?? 0;
  ctx.save();
  world(ctx, m, x0, yb);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const kind = look.truck, mm: W2S = { k: m.k, ox: m.ox + x0 * m.k, oy: m.oy - yb * m.k };
  if (kind === 'heli') { heli(ctx, mm, look, pose); ctx.restore(); return; }
  const tankBig = 0.04 * look.tank;
  // ladder-type trucks carry the ladder above the body; the rest carry it shorter, folded on the side
  if (kind === 'boat') {
    // the Fireboat on its trailer: a hull on wheels
    ctx.fillStyle = '#5d6670'; rr(ctx, 0.5, 0.55, 3.9, 0.14, 0.05); ctx.fill();
    wheel(ctx, 1.1, 0.34); wheel(ctx, 1.85, 0.34); wheel(ctx, 4.15, 0.36);
    ctx.beginPath(); ctx.moveTo(0.4, 1.45); ctx.lineTo(4.9, 1.45); ctx.quadraticCurveTo(5.0, 0.95, 4.2, 0.7); ctx.lineTo(0.9, 0.7); ctx.closePath();
    pattern(ctx, look.paint, 0.4, 0.7, 4.6, 0.75); ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(0.5, 1.12, 4.2, 0.08);
    ctx.fillStyle = '#f4f4f0'; rr(ctx, 3.3, 1.45, 1.0, 0.6, 0.08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe6ff'; rr(ctx, 3.45, 1.62, 0.7, 0.3, 0.05); ctx.fill(); ctx.stroke();
    buddy(ctx, mm, look.buddy, 3.8, 1.77, 0.4);
    lightBar(ctx, look, 3.5, 2.05, pose);
    ladderArt(ctx, look, pose, false); monitor(ctx, look, pose);
    ctx.restore(); return;
  }
  const big = kind === 'crash' || kind === 'ladder';
  const body = { x: 0.35, w: kind === 'brush' ? 3.0 : 3.55, h: kind === 'rescue' ? 1.5 : kind === 'crash' ? 1.45 : 1.3 };
  // the body
  if (kind === 'tanker') {
    ctx.fillStyle = '#5d6670'; rr(ctx, 0.35, 0.4, 3.6, 0.2, 0.05); ctx.fill();
    ctx.beginPath(); ctx.roundRect(0.35, 0.58, 3.55, 0.86 + tankBig, 0.42); pattern(ctx, look.paint, 0.35, 0.58, 3.55, 0.86); ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = '#ffffff99'; ctx.fillRect(0.6, 1.1, 3.0, 0.07);
  } else {
    ctx.beginPath(); ctx.roundRect(body.x, 0.4, body.w, body.h - 0.4 + (kind === 'pumper' ? tankBig : 0), 0.08);
    pattern(ctx, look.paint, body.x, 0.4, body.w, body.h - 0.4);
    ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
    // compartment doors, a white stripe
    ctx.fillStyle = '#ffffff'; ctx.fillRect(body.x + 0.05, 0.86, body.w - 0.1, 0.07);
    ctx.strokeStyle = '#00000055'; ctx.lineWidth = 0.035;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(body.x + i * body.w / 4, 0.45); ctx.lineTo(body.x + i * body.w / 4, body.h - 0.08); ctx.stroke(); }
    if (kind === 'rescue') { ctx.fillStyle = '#d9dee4'; rr(ctx, 0.6, 1.0, 1.0, 0.3, 0.04); ctx.fill(); ctx.fillStyle = '#e63946'; ctx.fillRect(1.0, 1.08, 0.2, 0.14); ctx.fillRect(0.94, 1.12, 0.32, 0.06); }
    if (kind === 'brush') { ctx.fillStyle = '#d9dee4'; rr(ctx, 0.5, body.h, 1.6, 0.35 + tankBig, 0.12); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.05; ctx.stroke(); }
  }
  // the hose reel
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(1.0, 0.68, 0.17 + look.hose * 0.015, 0, 7); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.04; ctx.stroke();
  // the cab
  const cabX = body.x + body.w - 0.02;
  cab(ctx, look, cabX, kind === 'crash' ? 1.4 : 1.15, kind === 'crash' ? 1.75 : kind === 'brush' ? 1.55 : 1.65, mm, 0);
  lightBar(ctx, look, cabX + 0.15, kind === 'crash' ? 1.75 : kind === 'brush' ? 1.55 : 1.65, pose);
  // wheels
  if (kind === 'brush') { wheel(ctx, 0.95, 0.5, true); wheel(ctx, cabX + 0.6, 0.5, true); }
  else if (kind === 'crash') { wheel(ctx, 0.85, 0.46); wheel(ctx, 1.85, 0.46); wheel(ctx, cabX + 0.75, 0.46); }
  else if (big) { wheel(ctx, 0.8); wheel(ctx, 1.65); wheel(ctx, cabX + 0.6); }
  else { wheel(ctx, 1.05); wheel(ctx, cabX + 0.6); }
  ladderArt(ctx, look, pose, false);
  monitor(ctx, look, pose);
  ctx.restore();
}

function heli(ctx: CanvasRenderingContext2D, m: W2S, look: TruckLook, pose: Pose) {
  const t = pose.t ?? 0;
  // the skids
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.08;
  ctx.beginPath(); ctx.moveTo(1.2, 0.12); ctx.lineTo(4.2, 0.12); ctx.moveTo(1.8, 0.12); ctx.lineTo(1.9, 0.55); ctx.moveTo(3.6, 0.12); ctx.lineTo(3.5, 0.55); ctx.stroke();
  // the tail
  ctx.beginPath(); ctx.moveTo(0.1, 1.25); ctx.lineTo(2.0, 1.1); ctx.lineTo(2.0, 0.85); ctx.lineTo(0.1, 1.05); ctx.closePath();
  pattern(ctx, look.paint, 0.1, 0.85, 1.9, 0.4); ctx.lineWidth = 0.06; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#5d6670'; ctx.beginPath(); ctx.arc(0.2, 1.15, 0.28, 0, 7); ctx.fill();
  // the body
  ctx.beginPath(); ctx.ellipse(3.0, 1.05, 1.5, 0.62, 0, 0, 7);
  pattern(ctx, look.paint, 1.5, 0.43, 3.0, 1.24); ctx.lineWidth = 0.07; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(3.8, 1.2, 0.6, 0.36, 0, 0, 7); ctx.fill(); ctx.stroke();
  buddy(ctx, m, look.buddy, 3.85, 1.2, 0.42);
  // the water bucket hanging under it
  ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(2.6, 0.45); ctx.lineTo(2.6, 0.3); ctx.stroke();
  // the rotor, turning
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(2.9, 1.65, 0.2, 0.25);
  const span = 2.4 * Math.abs(Math.cos(t * 30));
  ctx.fillStyle = '#2a2a30'; rr(ctx, 3.0 - span / 2, 1.9, Math.max(0.1, span), 0.08, 0.04); ctx.fill();
  lightBar(ctx, look, 2.0, 1.55, pose);
  ladderArt(ctx, look, { ...pose, ladderAngle: pose.ladderAngle ?? -Math.PI / 2, ladderLen: pose.ladderLen ?? 0.3 }, true);
  monitor(ctx, look, pose);
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
  const k = Math.min(w / 6.4, h / 2.6);
  drawTruck(ctx, { k, ox: (w - 5.6 * k) / 2 - 0.2 * k, oy: h - 0.1 * k }, look, 0);
  url = c.toDataURL();
  pics.set(key, url);
  return url;
}
