// Draws the Call on a 2D canvas, from the side: the sky, the scene (cached once per size, since it doesn't move), then each frame the
// fires, the smoke, the people waiting and saved, his truck with its ladder, the water and the splashes. Work per frame is bounded:
// the drops are a fixed pool drawn as one path, the smoke is worked out from the clock rather than kept, and splashes are capped.
import { drawTruck, NOZZLE_AT, type TruckLook, type W2S } from '../art/truck';
import type { Block, Prop, SceneDef, Who } from './scenes';
import { FIRE_HP, MAX_DROPS, type CallState } from './sim';

export const TRUCK_X = 0;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
export const WHO: Record<Who, string> = { person: '🧑', cat: '🐱', dog: '🐶', kid: '🧒', king: '🤴', sailor: '👨‍✈️', pilot: '🧑‍✈️', keeper: '👴', astronaut: '🧑‍🚀', grandma: '👵' };

/** Where the world sits on a canvas of this size: everything up to the scene's right edge and top floor fits. */
export function viewOf(scene: SceneDef, w: number, h: number): W2S & { worldW: number; worldH: number } {
  const worldW = Math.max(scene.right + 0.4, 13), worldH = scene.top + 0.9;
  const k = Math.min(w / worldW, h / (worldH + 0.5));
  // on a tall screen (a phone upright) the scene sits below the middle, with the street, a hedge and the lawn carried on underneath
  return { k, ox: (w - worldW * k) / 2, oy: h - 0.5 * k - Math.max(0, (h - (worldH + 0.5) * k) * 0.3), worldW, worldH };
}
export const toWorld = (m: W2S, sx: number, sy: number) => ({ x: (sx - m.ox) / m.k, y: (m.oy - sy) / m.k });

function world(ctx: CanvasRenderingContext2D, m: W2S) { ctx.setTransform(m.k, 0, 0, -m.k, m.ox, m.oy); }
function emoji(ctx: CanvasRenderingContext2D, m: W2S, ch: string, x: number, y: number, size: number) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${Math.round(size * m.k)}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, m.ox + x * m.k, m.oy - y * m.k);
  ctx.restore();
}

const BLOCK_COLORS: Record<string, [string, string]> = {
  house: ['#f4d58d', '#b5651d'], barn: ['#c0392b', '#7b241c'], shop: ['#f7c6d9', '#8e4b65'], school: ['#c8553d', '#7a2e20'],
  treehouse: ['#a0703c', '#5b3a1a'], ship: ['#f4f4f0', '#3a4a5a'], flats: ['#8fa6bf', '#46586e'], castle: ['#a7a9ac', '#5d6066'],
  airport: ['#dfe6ec', '#6b7a88'], lighthouse: ['#f4f4f0', '#c0392b'], hotel: ['#e8c07a', '#8a5a1a'], tower: ['#5b8fc7', '#24476e'], rocket: ['#9aa3ad', '#3a3f47'],
};

/** A block of windows. `lit`: the Town at night, every window warm with light but a few. */
function block(ctx: CanvasRenderingContext2D, look: string, b: Block, lit = false) {
  const [fill, edge] = BLOCK_COLORS[look] ?? ['#ccc', '#666'], y0 = b.base ?? 0, h = b.floors;
  ctx.fillStyle = fill; ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.07;
  if (look === 'lighthouse') {
    ctx.beginPath(); ctx.moveTo(b.x - 0.25, y0); ctx.lineTo(b.x + 0.15, y0 + h); ctx.lineTo(b.x + b.w - 0.15, y0 + h); ctx.lineTo(b.x + b.w + 0.25, y0); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = edge; for (let f = 0; f < h; f += 2) ctx.fillRect(b.x - 1, y0 + f + 1, b.w + 2, 1); ctx.restore();
    ctx.stroke();
    ctx.fillStyle = '#3a3f47'; ctx.fillRect(b.x + 0.1, y0 + h, b.w - 0.2, 0.15);
    ctx.fillStyle = '#fff6b0'; ctx.fillRect(b.x + 0.3, y0 + h + 0.15, b.w - 0.6, 0.55); ctx.strokeRect(b.x + 0.3, y0 + h + 0.15, b.w - 0.6, 0.55);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(b.x + 0.15, y0 + h + 0.7); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.2); ctx.lineTo(b.x + b.w - 0.15, y0 + h + 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    return;
  }
  if (look === 'ship') {
    // the hull under the cabin, at the dock
    ctx.fillStyle = '#2c3e66'; ctx.beginPath(); ctx.moveTo(7.6, 1.1); ctx.lineTo(13.6, 1.1); ctx.lineTo(13.0, 0.05); ctx.lineTo(8.1, 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.fillRect(8.0, 0.05, 5.4, 0.2);
    ctx.fillStyle = '#3a3f47'; ctx.fillRect(12.3, y0 + h, 0.35, 1.1); ctx.strokeRect(12.3, y0 + h, 0.35, 1.1);
    ctx.fillStyle = fill;
  }
  ctx.fillRect(b.x, y0, b.w, h); ctx.strokeRect(b.x, y0, b.w, h);
  // the roof
  ctx.fillStyle = edge;
  if (look === 'house' || look === 'treehouse') { ctx.beginPath(); ctx.moveTo(b.x - 0.3, y0 + h); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.1); ctx.lineTo(b.x + b.w + 0.3, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (look === 'barn') { ctx.beginPath(); ctx.moveTo(b.x - 0.3, y0 + h); ctx.lineTo(b.x + 0.4, y0 + h + 0.9); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.4); ctx.lineTo(b.x + b.w - 0.4, y0 + h + 0.9); ctx.lineTo(b.x + b.w + 0.3, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (look === 'castle') { for (let x = b.x; x < b.x + b.w - 0.1; x += 0.6) { ctx.fillStyle = fill; ctx.fillRect(x, y0 + h, 0.35, 0.4); ctx.strokeRect(x, y0 + h, 0.35, 0.4); } ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, y0 + h + 0.4); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.5); ctx.lineTo(b.x + b.w / 2 + 0.6, y0 + h + 1.3); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.1); ctx.fill(); ctx.stroke(); }
  else if (look === 'shop') { const stripes = 8; for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e63946'; ctx.fillRect(b.x + i * b.w / stripes, y0 + 1, b.w / stripes, 0.25); } ctx.fillStyle = edge; ctx.fillRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.2); }
  else if (look === 'airport') { ctx.fillStyle = '#7fd3ff'; ctx.fillRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.6); ctx.strokeRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.6); }
  else if (look === 'rocket') { ctx.strokeStyle = edge; ctx.lineWidth = 0.05; for (let f = 0; f < h; f++) { ctx.beginPath(); ctx.moveTo(b.x, y0 + f); ctx.lineTo(b.x + b.w, y0 + f + 1); ctx.moveTo(b.x + b.w, y0 + f); ctx.lineTo(b.x, y0 + f + 1); ctx.stroke(); } }
  else { ctx.fillRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); ctx.strokeRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); }
  // the windows, and a door on the ground floor
  ctx.lineWidth = 0.05;
  for (let f = 0; f < h; f++) for (let c = 0; c < b.cols; c++) {
    const cx = b.x + (c + 0.5) * b.w / b.cols, cy = y0 + f + 0.5;
    if (f === 0 && y0 === 0 && c === Math.floor(b.cols / 2) && look !== 'rocket' && b.cols > 1) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 0.28, 0, 0.56, 0.8); ctx.strokeRect(cx - 0.28, 0, 0.56, 0.8); continue; }
    ctx.fillStyle = lit ? ((f * 5 + c * 3 + Math.round(b.x)) % 7 === 3 ? '#2a3a52' : '#ffcf7a') : look === 'tower' ? '#9fd0ff' : '#2a3a52';
    ctx.fillRect(cx - 0.3, cy - 0.3, 0.6, 0.6); ctx.strokeStyle = '#141414'; ctx.strokeRect(cx - 0.3, cy - 0.3, 0.6, 0.6);
  }
  if (look === 'barn') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.08; ctx.strokeRect(b.x + b.w / 2 - 0.6, 0.02, 1.2, 1.1); ctx.beginPath(); ctx.moveTo(b.x + b.w / 2 - 0.6, 0.02); ctx.lineTo(b.x + b.w / 2 + 0.6, 1.12); ctx.moveTo(b.x + b.w / 2 + 0.6, 0.02); ctx.lineTo(b.x + b.w / 2 - 0.6, 1.12); ctx.stroke(); }
}

function prop(ctx: CanvasRenderingContext2D, m: W2S, p: Prop) {
  ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.06;
  if (p.kind === 'tree') {
    const h = p.h ?? 2.4;
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(p.x - 0.15, 0, 0.3, h * 0.7); ctx.strokeRect(p.x - 0.15, 0, 0.3, h * 0.7);
    ctx.fillStyle = '#2f8f3a'; ctx.beginPath(); ctx.arc(p.x, h * 0.75, 0.75, 0, 7); ctx.arc(p.x - 0.5, h * 0.6, 0.5, 0, 7); ctx.arc(p.x + 0.5, h * 0.6, 0.5, 0, 7); ctx.fill();
  } else if (p.kind === 'bush') { ctx.fillStyle = '#3c9a46'; ctx.beginPath(); ctx.arc(p.x - 0.3, 0.3, 0.4, 0, 7); ctx.arc(p.x + 0.3, 0.3, 0.4, 0, 7); ctx.arc(p.x, 0.55, 0.45, 0, 7); ctx.fill(); }
  else if (p.kind === 'bin') { ctx.fillStyle = '#3c6e47'; ctx.beginPath(); ctx.moveTo(p.x - 0.4, 0.9); ctx.lineTo(p.x + 0.4, 0.9); ctx.lineTo(p.x + 0.32, 0); ctx.lineTo(p.x - 0.32, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(p.x - 0.46, 0.85, 0.92, 0.1); }
  else if (p.kind === 'lamp') { ctx.fillStyle = '#3a3f47'; ctx.fillRect(p.x - 0.05, 0, 0.1, 2.4); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(p.x, 2.4, 0.18, 0, 7); ctx.fill(); ctx.stroke(); }
  else if (p.kind === 'car') {
    ctx.fillStyle = '#2a7bff'; ctx.beginPath(); ctx.roundRect(p.x - 1.0, 0.25, 2.0, 0.5, 0.15); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(p.x - 0.55, 0.7, 1.1, 0.4, 0.15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1c1c1e'; for (const dx of [-0.6, 0.6]) { ctx.beginPath(); ctx.arc(p.x + dx, 0.22, 0.22, 0, 7); ctx.fill(); }
  } else if (p.kind === 'plane') {
    ctx.fillStyle = '#f4f4f0';
    ctx.beginPath(); ctx.roundRect(p.x - 2.2, 0.6, 4.2, 0.65, 0.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 2.0, 1.2); ctx.lineTo(p.x - 2.4, 2.1); ctx.lineTo(p.x - 1.7, 2.1); ctx.lineTo(p.x - 1.3, 1.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.moveTo(p.x - 0.4, 0.85); ctx.lineTo(p.x + 0.9, 0.85); ctx.lineTo(p.x + 0.2, 0.5); ctx.lineTo(p.x - 0.8, 0.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1c1c1e'; for (const dx of [-1.2, 0.8]) { ctx.beginPath(); ctx.arc(p.x + dx, 0.18, 0.18, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#3a3f47'; ctx.beginPath(); ctx.moveTo(p.x - 1.2, 0.3); ctx.lineTo(p.x - 1.2, 0.6); ctx.moveTo(p.x + 0.8, 0.3); ctx.lineTo(p.x + 0.8, 0.6); ctx.stroke();
    ctx.fillStyle = '#7fd3ff'; for (let i = 0; i < 5; i++) ctx.fillRect(p.x - 1.0 + i * 0.5, 0.95, 0.22, 0.15);
  } else if (p.kind === 'rocket') {
    ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.roundRect(p.x - 0.5, 0.5, 1.0, 6.6, 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(p.x - 0.5, 7.1); ctx.quadraticCurveTo(p.x, 8.8, p.x + 0.5, 7.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 0.5, 0.5); ctx.lineTo(p.x - 1.0, 0.1); ctx.lineTo(p.x - 0.5, 1.6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x + 0.5, 0.5); ctx.lineTo(p.x + 1.0, 0.1); ctx.lineTo(p.x + 0.5, 1.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a3a52'; ctx.beginPath(); ctx.arc(p.x, 5.6, 0.25, 0, 7); ctx.fill(); ctx.stroke();
    emoji(ctx, m, '🚀', p.x, 3.5, 0.0001);
  } else if (p.kind === 'water') { ctx.fillStyle = '#2f7fd8'; ctx.fillRect(p.x, -0.6, 30, 0.6); }
}

/** The part of the picture that doesn't move: sky, far town, street and the scene. Drawn once per size. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, scene: SceneDef, m: W2S, w: number, h: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (scene.night) { sky.addColorStop(0, '#0b1433'); sky.addColorStop(1, '#2b3a6b'); }
  else { sky.addColorStop(0, '#5fb0ef'); sky.addColorStop(1, '#cfe9fb'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  world(ctx, m);
  if (scene.night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) ctx.fillRect(((i * 7.31) % 20) - 1, 3 + ((i * 3.7) % (scene.top)), 0.05, 0.05); ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.arc(2, scene.top - 0.5, 0.45, 0, 7); ctx.fill(); }
  // the far town, in two layers: on a tall screen (a phone or iPad upright) the back one rises to fill the sky over the scene; at
  // night its windows are lit
  const above = m.oy / m.k, back = Math.max(3.5, above * 0.62), left = -m.ox / m.k - 1, right = left + w / m.k + 2;
  ctx.fillStyle = scene.night ? '#16224a' : '#c4def2';
  for (let i = 0, x = left; x < right; i++) {
    const bw = 1.3 + (i % 4) * 0.35, bh = back * (0.45 + ((i * 0.37) % 0.55));
    ctx.fillRect(x, 0, bw, bh);
    if (scene.night) { ctx.fillStyle = '#ffcf7a'; for (let f = 0.6; f < bh - 0.4; f += 0.7) for (let c = 0; c < 2; c++) if ((i * 3 + Math.round(f * 10) + c * 5) % 4 === 0) ctx.fillRect(x + 0.25 + c * 0.55, f, 0.22, 0.28); ctx.fillStyle = '#16224a'; }
    x += bw + 0.15;
  }
  ctx.fillStyle = scene.night ? '#1d2a50' : '#a9cde8';
  for (let i = 0; i < 12; i++) { const bw = 1.1 + (i % 3) * 0.4, bh = 1.5 + ((i * 1.7) % 3); ctx.fillRect(-1 + i * 1.7, 0, bw, bh); }
  // the street and the kerb
  ctx.fillStyle = '#4a4f57'; ctx.fillRect(-2, -0.6, 40, 0.6);
  ctx.fillStyle = '#b9c2cc'; ctx.fillRect(-2, -0.06, 40, 0.06);
  ctx.fillStyle = '#ffd23f'; for (let x = -1; x < 30; x += 1.2) ctx.fillRect(x, -0.32, 0.6, 0.07);
  // the far pavement and the grass below the street, down to the bottom of the screen
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-2, -1.1, 40, 0.5);
  ctx.fillStyle = scene.night ? '#24452a' : '#5f8f3a'; ctx.fillRect(-2, -60, 40, 58.9);
  // a hedge along the far pavement, and the lawn mown in stripes
  ctx.fillStyle = scene.night ? '#1c3820' : '#4f7f30'; for (let y = -1.9; y > -60; y -= 1.6) ctx.fillRect(-2, y, 40, 0.8);
  ctx.fillStyle = scene.night ? '#2f5a34' : '#3f7a32'; ctx.beginPath(); for (let x = -2; x < 40; x += 0.7) { ctx.moveTo(x + 0.45, -1.1); ctx.arc(x + 0.35, -1.1, 0.35, 0, Math.PI, true); } ctx.fill();
  drawSceneBody(ctx, scene, m, false);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The scene itself (its buildings, props and signs) in world units through `m`: the Call's backdrop draws it once per size, and
 *  the Town draws it small on each lot, `lit` with warm windows. */
export function drawSceneBody(ctx: CanvasRenderingContext2D, scene: SceneDef, m: W2S, lit: boolean) {
  world(ctx, m);
  for (const p of scene.props) if (p.kind === 'water' || p.kind === 'plane' || p.kind === 'rocket') prop(ctx, m, p);
  for (const b of scene.blocks) block(ctx, scene.look, b, lit);
  for (const p of scene.props) if (p.kind !== 'water' && p.kind !== 'plane' && p.kind !== 'rocket') prop(ctx, m, p);
  if (scene.look === 'shop') emoji(ctx, m, '🥐', scene.blocks[0]!.x + scene.blocks[0]!.w / 2, 2.55, 0.6);
  if (scene.look === 'hotel') emoji(ctx, m, '🏨', scene.blocks[0]!.x + scene.blocks[0]!.w / 2, scene.blocks[0]!.floors + 0.6, 0.7);
  if (scene.look === 'school') emoji(ctx, m, '🔔', scene.blocks[0]!.x + scene.blocks[0]!.w / 2, scene.blocks[0]!.floors + 0.5, 0.5);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, seed: number) {
  if (s <= 0.02) return;
  const tongues = 4;
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = layer === 0 ? '#e63916' : layer === 1 ? '#ff8c1a' : '#ffd23f';
    const k = s * (1 - layer * 0.28);
    ctx.beginPath(); ctx.moveTo(x - 0.4 * k, y - 0.2 * s);
    for (let i = 0; i <= tongues; i++) {
      const fx = x - 0.4 * k + (0.8 * k * i) / tongues, tip = 0.55 + 0.35 * Math.sin(t * 9 + seed + i * 1.7 + layer);
      ctx.lineTo(fx - 0.07 * k, y - 0.1 * s + tip * k * 0.9);
      ctx.lineTo(fx + 0.05 * k, y - 0.2 * s + 0.1 * k);
    }
    ctx.lineTo(x + 0.4 * k, y - 0.2 * s); ctx.closePath(); ctx.fill();
  }
}

/** One frame of the Call. `look` is his truck; `drops` colours come from the nozzle. */
export function drawCall(ctx: CanvasRenderingContext2D, backdrop: HTMLCanvasElement | null, s: CallState, m: W2S, look: TruckLook, w: number, h: number, flash: boolean) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (backdrop) ctx.drawImage(backdrop, 0, 0, w, h); else { ctx.fillStyle = '#5fb0ef'; ctx.fillRect(0, 0, w, h); }
  const t = s.t;
  world(ctx, m);
  // fires: a glow in the window, flames that shrink as the water puts them out, and smoke
  for (const f of s.fires) {
    const left = f.out ? 0 : Math.max(0.25, f.hp / FIRE_HP);
    if (!f.out) {
      if (f.kind === 'window') { ctx.fillStyle = '#ffb03a'; ctx.fillRect(f.x - 0.3, f.y - 0.3, 0.6, 0.6); }
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.45 + i / 3) % 1;
        ctx.fillStyle = `rgba(70,70,80,${0.45 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(f.x + Math.sin(t + i * 2) * 0.2 + k * 0.4, f.y + 0.6 + k * 2.2, 0.25 + k * 0.45, 0, 7); ctx.fill();
      }
      flame(ctx, f.x, f.y, left * (f.kind === 'bush' ? 1.15 : 0.95), t, f.x * 3.1);
    } else if (f.kind === 'window') { ctx.fillStyle = '#3a3a40'; ctx.fillRect(f.x - 0.3, f.y - 0.3, 0.6, 0.6); }
  }
  // people waiting at windows (bobbing and waving), riding the ladder, or safe in the crowd
  const tip = { x: 3.1 + Math.cos(s.ladder.angle) * s.ladder.len, y: 1.45 + Math.sin(s.ladder.angle) * s.ladder.len };
  let crowd = 0;
  for (const r of s.rescues) {
    if (r.state === 'waiting' || r.state === 'climbing') {
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(r.x - 0.3, r.y - 0.3, 0.6, 0.6);
      emoji(ctx, m, WHO[r.who], r.x, r.y + 0.04 + Math.abs(Math.sin(t * 4 + r.x)) * 0.08, 0.55);
      if (r.state === 'waiting' && Math.sin(t * 2 + r.x) > 0.3) emoji(ctx, m, '👋', r.x + 0.4, r.y + 0.35, 0.3);
    } else if (r.state === 'riding') emoji(ctx, m, WHO[r.who], tip.x + 0.1, tip.y + 0.35, 0.55);
    else { crowd++; emoji(ctx, m, WHO[r.who], 5.9 + crowd * 0.55, 0.3 + (r.t < 1.2 ? Math.abs(Math.sin(r.t * 8)) * 0.25 : 0), 0.5); }
  }
  // his truck, its ladder where the sim has it, its hose aimed where the water goes
  drawTruck(ctx, m, look, TRUCK_X, { ladderAngle: s.ladder.angle, ladderLen: s.ladder.len, t, flash, aim: s.angle });
  world(ctx, m);
  // the water: one path of short streaks, or dots for bubbles and snow
  const d = s.drops, n = MAX_DROPS, F = d.length / n, nz = look.nozzle;
  const color = nz === 'foam' ? '#ffffff' : nz === 'glitter' ? '#ffd23f' : nz === 'snow' ? '#ffffff' : '#7fd3ff';
  if (nz === 'bubbles' || nz === 'snow' || nz === 'glitter') {
    ctx.fillStyle = color; ctx.strokeStyle = nz === 'bubbles' ? '#2f7fd8' : color; ctx.lineWidth = 0.025;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const o = i * F; if (d[o + 4]! <= 0) continue; ctx.moveTo(d[o]! + 0.07, d[o + 1]!); ctx.arc(d[o]!, d[o + 1]!, nz === 'bubbles' ? 0.08 : 0.05, 0, 6.3); }
    if (nz === 'bubbles') ctx.stroke(); else ctx.fill();
  } else if (nz === 'rainbow') {
    ctx.lineWidth = 0.09; ctx.lineCap = 'round';
    for (let band = 0; band < 6; band++) {
      ctx.strokeStyle = ['#ff2a2a', '#ff8c1a', '#ffd23f', '#2bb673', '#2a7bff', '#7d3cff'][band]!;
      ctx.beginPath();
      for (let i = band; i < n; i += 6) { const o = i * F; if (d[o + 4]! <= 0) continue; ctx.moveTo(d[o]!, d[o + 1]!); ctx.lineTo(d[o]! - d[o + 2]! * 0.025, d[o + 1]! - d[o + 3]! * 0.025); }
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = 0.09 + look.hose * 0.01; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const o = i * F; if (d[o + 4]! <= 0) continue; ctx.moveTo(d[o]!, d[o + 1]!); ctx.lineTo(d[o]! - d[o + 2]! * 0.03, d[o + 1]! - d[o + 3]! * 0.03); }
    ctx.stroke();
  }
  // splashes and steam
  for (const p of s.splashes) {
    const k = p.t / (p.steam ? 1.1 : 0.4);
    ctx.fillStyle = p.steam ? `rgba(240,240,245,${0.7 * (1 - k)})` : `rgba(127,211,255,${0.9 * (1 - k)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y + (p.steam ? k * 0.9 : 0), (p.steam ? 0.2 : 0.08) + k * (p.steam ? 0.35 : 0.15), 0, 7); ctx.fill();
  }
  // the helpers finishing what he can't reach yet
  if (s.phase === 'help') emoji(ctx, m, '🚁', 10 + Math.sin(t) * 2, Math.min(s.scene.top - 0.5, 8), 1.1);
  // where the water is going: a ring at his finger
  if (s.aim && s.refill <= 0) { ctx.strokeStyle = s.reaches ? '#ffffffcc' : '#ffd23fcc'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.arc(s.aim.x, s.aim.y, 0.3, 0, 7); ctx.stroke(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The short drive to the Call: his truck rolls along a street that scrolls past, cars pull over when the siren is on. */
export function drawDrive(ctx: CanvasRenderingContext2D, look: TruckLook, w: number, h: number, t: number, siren: number, night: boolean) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, night ? '#0b1433' : '#5fb0ef'); sky.addColorStop(1, night ? '#2b3a6b' : '#cfe9fb');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // his truck is the star: about half the width of the screen, whichever way up it's held
  const k = Math.min(w / 10, h / 6.5), m: W2S = { k, ox: 0, oy: h - 0.9 * k }, worldW = w / k, tall = Math.min(1.9, Math.max(1, (h / k - 1) / 6));
  world(ctx, m);
  const go = t * 7;
  // the town going by, two layers
  for (let layer = 0; layer < 2; layer++) {
    const speed = layer ? 0.5 : 0.25, span = 26;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 2.1 - go * speed) % span + span) % span - 2, bh = (1.8 + ((i * 1.3 + layer) % 3) * (layer ? 1 : 1.4)) * tall;
      ctx.fillStyle = layer ? ['#e8c07a', '#8fa6bf', '#c8553d', '#f4d58d'][i % 4]! : night ? '#1d2a50' : '#a9cde8';
      ctx.fillRect(x, 0, 1.6, bh);
      if (layer) { ctx.fillStyle = night ? '#ffe9a8' : '#2a3a52'; for (let f = 0.5; f < bh - 0.4; f += 0.9) ctx.fillRect(x + 0.35, f, 0.35, 0.4), ctx.fillRect(x + 0.95, f, 0.35, 0.4); }
    }
  }
  ctx.fillStyle = '#4a4f57'; ctx.fillRect(-1, -0.9, worldW + 2, 0.9);
  ctx.fillStyle = '#b9c2cc'; ctx.fillRect(-1, -0.06, worldW + 2, 0.06);
  ctx.fillStyle = '#ffd23f'; for (let x = -((go) % 1.6); x < worldW + 2; x += 1.6) ctx.fillRect(x, -0.5, 0.7, 0.08);
  // cars ahead pull over (down and slower) while the siren sounds
  for (let i = 0; i < 3; i++) {
    const x = ((i * 5 + 9 - go * 0.45) % 15 + 15) % 15 + 2;
    const off = Math.min(1, siren) * 0.35;
    ctx.save(); ctx.translate(x, -off);
    ctx.fillStyle = ['#2a7bff', '#2bb673', '#ffd23f'][i]!; ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.roundRect(-0.8, 0.2, 1.6, 0.42, 0.12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-0.45, 0.58, 0.9, 0.34, 0.12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1c1c1e'; for (const dx of [-0.5, 0.5]) { ctx.beginPath(); ctx.arc(dx, 0.18, 0.18, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  drawTruck(ctx, m, look, Math.min(worldW * 0.08, -5 + t * 6), { t, flash: siren > 0 || true, bounce: Math.abs(Math.sin(t * 13)) * 0.04 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export { NOZZLE_AT };
