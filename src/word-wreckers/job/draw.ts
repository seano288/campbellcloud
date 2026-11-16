// Draws a Job on a 2D canvas: the demolition (sky, the street behind, the lot, the old building's bricks, his machine as an image with
// its ball or arm drawn on top, dust and Bolts popping out), the haul (a dump truck carries the rubble off) and the build (the crane's
// jib, the hook and the new building going up piece by piece). Pieces are few and simple, for an iPad 9 at 60 fps.
import { piecesOf, pieceSvg, PIECE_PAD } from '../art/buildings';
import { ballOf, GROUND, machineSvg, RIGS, VIEW, type Look } from '../art/machines';
import { paintOf, type BuildingId, type MachineId, type Tier } from '../yard/shop';
import { B_GROUND, B_HALF_W, B_SCALE, B_VIEW_H, carrying, hangY, HOOK_Y, pieceH, pieceW, type Build } from './build';
import { armBase, armReach, ballPos, BH, BUILDING_X, BW, GROUND_Y, M_SCALE, tipOf, VIEW_H, WORLD_W, type Wreck } from './wreck';

const images = new Map<string, HTMLImageElement>();
/** An SVG string as an image, made once. Until it has loaded nothing is drawn for it. */
export function image(svg: string): HTMLImageElement | null {
  let img = images.get(svg);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    images.set(svg, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * An SVG image rasterised once at about the size it's drawn (in device pixels, in quarter-octave steps so a camera closing in doesn't
 * make a new one every frame), and drawn as a bitmap from then on: an SVG image drawn straight onto a canvas is re-rasterised every
 * frame, which is what an iPad 9 can't afford.
 */
const bitmaps = new Map<string, HTMLCanvasElement>();
export function drawSvg(c: CanvasRenderingContext2D, svg: string, x: number, y: number, w: number, h: number) {
  const img = image(svg);
  if (!img) return;
  const k = Math.abs(c.getTransform().a) || 1, step = 2 ** (Math.round(Math.log2(k) * 4) / 4);
  const W = Math.max(1, Math.round(w * step)), H = Math.max(1, Math.round(h * step)), key = `${W}x${H}:${svg}`;
  let b = bitmaps.get(key);
  if (!b) {
    if (bitmaps.size > 160) bitmaps.clear();
    b = document.createElement('canvas'); b.width = W; b.height = H;
    b.getContext('2d')!.drawImage(img, 0, 0, W, H);
    bitmaps.set(key, b);
  }
  c.drawImage(b, x, y, w, h);
}

const MATERIAL = {
  1: { fill: '#c8955a', line: '#8a5a2a', sky: ['#9fd8f5', '#e8f6fc'] },
  2: { fill: '#c4553a', line: '#7a2a1a', sky: ['#9fd0f0', '#e6f2fa'] },
  3: { fill: '#a9adb2', line: '#6a6f75', sky: ['#a9c9e0', '#e2ecf3'] },
  4: { fill: '#6f8aa0', line: '#3a4a5a', sky: ['#8fb0d0', '#dfe8f0'] },
} as const satisfies Record<Tier, { fill: string; line: string; sky: readonly string[] }>;

/**
 * Fits the world from `left` to `right` (and VIEW_H tall) into the canvas, whichever way it's held: the world's bottom stays at the
 * canvas's bottom, extra width shows more street and extra height more sky. Returns how to turn a canvas point into a world point.
 */
export function fit(c: CanvasRenderingContext2D, w: number, h: number, viewH: number, left: number, right: number, ground?: { y: number; below: number }) {
  const s = Math.min(h / viewH, w / (right - left)), vw = w / s, x0 = (left + right) / 2 - vw / 2;
  // with room to spare (a phone held upright), the ground sits above the controls rather than under them
  const ty = ground ? Math.min(h - viewH * s, Math.max(0, h - ground.below - ground.y * s)) : h - viewH * s;
  c.setTransform(s, 0, 0, s, -x0 * s, ty);
  return { s, x0, top: -ty / s, vw, toWorld: (px: number, py: number) => ({ x: px / s + x0, y: (py - ty) / s }) };
}

function sky(c: CanvasRenderingContext2D, x0: number, w: number, top: number, h: number, colors: readonly string[]) {
  const g = c.createLinearGradient(0, top, 0, h);
  g.addColorStop(0, colors[0]!); g.addColorStop(1, colors[1]!);
  c.fillStyle = g;
  c.fillRect(x0 - 10, top - 10, w + 20, h - top + 20);
}

/** The street behind: a row of plain grey buildings, far off. */
function skyline(c: CanvasRenderingContext2D, x0: number, w: number, ground: number) {
  c.fillStyle = '#c9d3dc';
  for (let x = Math.floor(x0 / 90) * 90 - 90; x < x0 + w + 90; x += 90) {
    const hh = 90 + ((x * 37) % 140 + 140) % 140;
    c.fillRect(x, ground - 60 - hh, 76, hh + 60);
  }
}

function groundBand(c: CanvasRenderingContext2D, x0: number, w: number, ground: number, viewH: number) {
  c.fillStyle = '#8a7a5a'; c.fillRect(x0 - 10, ground, w + 20, viewH - ground + 2000);
  c.fillStyle = '#6a5a3a'; c.fillRect(x0 - 10, ground, w + 20, 8);
  c.strokeStyle = '#1d1d1f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 - 10, ground); c.lineTo(x0 + w + 10, ground); c.stroke();
}

export function drawMachine(c: CanvasRenderingContext2D, m: MachineId, look: Look, x: number, ground: number, scale: number, tool = false, flip = false) {
  c.save();
  c.translate(x, ground);
  if (flip) { c.translate(240 * scale, 0); c.scale(-1, 1); }
  drawSvg(c, machineSvg(m, look, tool), VIEW.x * scale, (VIEW.y - GROUND) * scale, VIEW.w * scale, VIEW.h * scale);
  c.restore();
}

function brick(c: CanvasRenderingContext2D, x: number, y: number, a: number, tier: Tier) {
  const m = MATERIAL[tier];
  c.save();
  c.translate(x, y);
  if (a) c.rotate(a);
  c.fillStyle = m.fill; c.strokeStyle = '#1d1d1f'; c.lineWidth = 2.5;
  c.fillRect(-BW / 2 + 1, -BH / 2 + 1, BW - 2, BH - 2);
  c.strokeRect(-BW / 2 + 1, -BH / 2 + 1, BW - 2, BH - 2);
  c.strokeStyle = m.line; c.lineWidth = 2;
  c.beginPath();
  if (tier === 1) { c.moveTo(-BW / 2 + 4, 0); c.lineTo(BW / 2 - 4, 0); }
  else if (tier === 4) { c.arc(-BW / 2 + 7, -BH / 2 + 6, 1.8, 0, 7); c.moveTo(BW / 2 - 5, BH / 2 - 6); c.arc(BW / 2 - 7, BH / 2 - 6, 1.8, 0, 7); }
  else if (tier === 2) { c.moveTo(0, -BH / 2 + 2); c.lineTo(0, BH / 2 - 2); }
  c.stroke();
  c.restore();
}

export function drawBolt(c: CanvasRenderingContext2D, x: number, y: number, r = 14) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#ffd23f'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#c99a00'; c.beginPath(); c.arc(0, 0, r * .4, 0, 7); c.fill(); c.stroke();
  c.restore();
}

export interface Puff { x: number; y: number; t: number; bolt?: boolean }

/** The demolition, and (with `haul` from 0 to 1) the dump truck carrying the rubble off. */
export function drawWreck(c: CanvasRenderingContext2D, w: Wreck, cw: number, ch: number, tier: Tier, look: Look, puffs: readonly Puff[], haul: { t: number; look: Look } | null) {
  const cols = Math.max(...w.bricks.map(b => b.col)) + 1;
  // the camera keeps the machine and the whole building in view, closing in as the machine does
  const below = ch > cw * 1.2 ? ch * .2 : 0;
  const v = fit(c, cw, ch, VIEW_H, Math.min(w.mx - 30, BUILDING_X - 380), BUILDING_X + cols * BW + 50, { y: GROUND_Y, below }), vw = v.vw;
  sky(c, v.x0, vw, v.top, VIEW_H, MATERIAL[tier].sky);
  skyline(c, v.x0, vw, GROUND_Y);
  groundBand(c, v.x0, vw, GROUND_Y, VIEW_H);
  // the lot's hazard tape
  c.fillStyle = '#ffd23f'; c.fillRect(BUILDING_X - 30, GROUND_Y + 14, 420, 10);
  for (const b of w.bricks) if (b.state !== 'rest' || !haul) brick(c, b.x, b.y, b.a, tier);
  // rubble rides away in the truck's bed
  const truckX = haul ? -300 + haul.t * (WORLD_W + 400) : 0;
  if (haul) {
    const loaded = haul.t > .45;
    for (const b of w.bricks) if (b.state === 'rest' && !loaded) brick(c, b.x, b.y, b.a, tier);
    drawMachine(c, 'dump', haul.look, truckX, GROUND_Y, 1.4);
    if (loaded) for (let i = 0; i < 6; i++) brick(c, truckX + 60 + (i % 3) * 40, GROUND_Y - 150 - Math.floor(i / 3) * 20, 0, tier);
  }
  if (!haul) {
    drawMachine(c, w.machine, look, w.mx, GROUND_Y, M_SCALE);
    if (w.action === 'swing') {
      const tip = tipOf(w), p = ballPos(w), b = ballOf(w.machine as 'crane' | 'mega', look);
      c.strokeStyle = '#1d1d1f'; c.lineWidth = 5; c.beginPath(); c.moveTo(tip.x, tip.y); c.lineTo(p.x, p.y); c.stroke();
      c.strokeStyle = b.chain === 'rainbow' ? '#e63946' : '#8a929b'; c.lineWidth = 2.5; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      if (b.spiky) { c.fillStyle = '#c9d1d9'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + w.ball.theta; c.beginPath(); c.moveTo(p.x + Math.cos(a - .25) * w.ball.r, p.y + Math.sin(a - .25) * w.ball.r); c.lineTo(p.x + Math.cos(a) * (w.ball.r + 11), p.y + Math.sin(a) * (w.ball.r + 11)); c.lineTo(p.x + Math.cos(a + .25) * w.ball.r, p.y + Math.sin(a + .25) * w.ball.r); c.fill(); c.stroke(); } }
      c.fillStyle = b.fill; c.lineWidth = 4; c.strokeStyle = '#1d1d1f';
      c.beginPath(); c.arc(p.x, p.y, w.ball.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(p.x - w.ball.r * .35, p.y - w.ball.r * .35, w.ball.r * .22, 0, 7); c.fill();
      if (w.ball.held) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(p.x, p.y, w.ball.r + 10, 0, 7); c.stroke(); }
    } else if (w.action === 'bite') {
      drawArm(c, w, look);
    }
  }
  for (const p of puffs) {
    if (p.bolt) { drawBolt(c, p.x, p.y - p.t * 90, 16); continue; }
    c.fillStyle = `rgba(230,220,200,${Math.max(0, .8 - p.t)})`;
    c.beginPath(); c.arc(p.x, p.y, 14 + p.t * 50, 0, 7); c.fill();
  }
  return v;
}

/** The excavator's arm from its base to the bucket, the elbow bent upward (as armSvg draws it in the Yard), straight onto the canvas. */
function drawArm(c: CanvasRenderingContext2D, w: Wreck, look: Look) {
  const m = w.machine as 'digger' | 'robot' | 'giant', base = armBase(w), bx = w.arm.x, by = w.arm.y, seg = armReach(w) * .55;
  const dx = bx - base.x, dy = by - base.y, d = Math.max(1, Math.hypot(dx, dy)), lift = Math.sqrt(Math.max(0, seg * seg - (d / 2) ** 2));
  const ex = base.x + dx / 2 + (dy / d) * lift * (dx >= 0 ? 1 : -1), ey = base.y + dy / 2 - (Math.abs(dx) / d) * lift;
  const width = (m === 'giant' ? 18 : 14) * M_SCALE, bk = RIGS[m].bucket * M_SCALE * (look.ups.includes('up:digger:bucket') ? 1.3 : 1);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#1d1d1f'; c.lineWidth = width + 8;
  c.beginPath(); c.moveTo(base.x, base.y); c.lineTo(ex, ey); c.lineTo(bx, by - bk * .3); c.stroke();
  c.strokeStyle = paintBody(look); c.lineWidth = width;
  c.stroke();
  c.fillStyle = '#c9d1d9'; c.lineWidth = 3; c.strokeStyle = '#1d1d1f';
  c.beginPath(); c.arc(ex, ey, 6, 0, 7); c.fill(); c.stroke();
  const claw = m === 'robot' || look.ups.includes('up:digger:claw');
  c.fillStyle = claw ? '#8a929b' : paintBody(look); c.lineWidth = 4;
  c.beginPath();
  if (claw) { c.moveTo(bx - bk * .7, by - bk * .5); c.lineTo(bx - bk * .2, by + bk * .7); c.lineTo(bx, by + bk * .1); c.lineTo(bx + bk * .2, by + bk * .7); c.lineTo(bx + bk * .7, by - bk * .5); }
  else { c.moveTo(bx - bk * .6, by - bk * .6); c.lineTo(bx + bk * .7, by - bk * .5); c.lineTo(bx + bk * .6, by + bk * .6); c.quadraticCurveTo(bx - bk * .2, by + bk * .8, bx - bk * .6, by - bk * .6); }
  c.closePath(); c.fill(); c.stroke();
}
const paintBody = (look: Look) => { const p = paintOf(look.paint); return p.pattern ? p.trim === '#1d1d1f' ? p.body : p.trim : p.body; };

// ---------- the build ----------

export function drawBuild(c: CanvasRenderingContext2D, b: Build, cw: number, ch: number, id: BuildingId, gold: boolean, crane: { look: Look; tower: boolean }) {
  const v = fit(c, cw, ch, B_VIEW_H, -B_HALF_W, B_HALF_W, { y: B_GROUND, below: ch * .12 }), half = v.vw / 2;
  sky(c, -half, half * 2, v.top, B_VIEW_H, ['#9fd8f5', '#e8f6fc']);
  skyline(c, -half, half * 2, B_GROUND);
  groundBand(c, -half, half * 2, B_GROUND, B_VIEW_H);
  const pieces = piecesOf(id, gold);
  // the stack so far
  let y = B_GROUND;
  for (let k = 0; k < b.k; k++) { const p = pieces[k]!; y -= pieceH(p); drawPiece(c, p, 0, y); }
  // the crane: a tall mast at the side and a jib across the top, the trolley over the hook
  const paint = paintBody(crane.look), jibY = HOOK_Y - 40, mastX = -half + 50;
  c.lineWidth = 10; c.strokeStyle = '#1d1d1f';
  c.beginPath(); c.moveTo(mastX, B_GROUND); c.lineTo(mastX, jibY - 30); c.moveTo(mastX - 30, jibY); c.lineTo(half - 20, jibY); c.stroke();
  c.lineWidth = 5; c.strokeStyle = paint;
  c.beginPath(); c.moveTo(mastX, B_GROUND); c.lineTo(mastX, jibY - 30); c.moveTo(mastX - 30, jibY); c.lineTo(half - 20, jibY); c.stroke();
  if (crane.tower) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(half - 24, jibY, 6, 0, 7); c.fill(); }
  c.fillStyle = paint; c.strokeStyle = '#1d1d1f'; c.lineWidth = 3;
  c.fillRect(b.hookX - 22, jibY - 6, 44, 14); c.strokeRect(b.hookX - 22, jibY - 6, 44, 14);
  const p = pieces[b.k];
  if (p && carrying(b)) {
    c.lineWidth = 3; c.beginPath(); c.moveTo(b.hookX, jibY + 8); c.lineTo(b.hookX, hangY()); c.stroke();
    // where it will land: a soft shadow on the stack
    c.fillStyle = '#0002'; c.fillRect(-pieceW(p) / 2, y - 6, pieceW(p), 6);
    drawPiece(c, p, b.hookX, hangY());
  } else if (b.drop && p) {
    c.lineWidth = 3; c.beginPath(); c.moveTo(b.hookX, jibY + 8); c.lineTo(b.hookX, hangY() - 10); c.stroke();
    drawPiece(c, p, b.drop.x, b.drop.y);
  }
  return v;
}

function drawPiece(c: CanvasRenderingContext2D, p: { w: number; h: number; svg: string }, cx: number, top: number) {
  drawSvg(c, pieceSvg(p), cx - (p.w / 2 + PIECE_PAD.x) * B_SCALE, top - PIECE_PAD.top * B_SCALE, (p.w + PIECE_PAD.x * 2) * B_SCALE, (p.h + PIECE_PAD.h) * B_SCALE);
}
