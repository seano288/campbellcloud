// Draws the Call on a 2D canvas, from the side: the sky, the scene (cached once per size, since it doesn't move), then each frame the
// fires, the smoke, the people waiting and saved, his truck with its ladder, the water and the splashes. Work per frame is bounded:
// the drops are a fixed pool drawn as one path, the smoke is worked out from the clock rather than kept, and splashes are capped.
import { drawTruck, NOZZLE_AT, type TruckLook, type W2S } from '../art/truck';
import { kindOf } from '../station/parts';
import type { Block, Prop, SceneDef, Who } from './scenes';
import { CROWD_X, FIRE_HP, MAX_DROPS, type CallState } from './sim';

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
export const WHO: Record<Who, string> = {
  person: '🧑', cat: '🐱', dog: '🐶', kid: '🧒', king: '🤴', sailor: '👨‍✈️', pilot: '🧑‍✈️', keeper: '👴', astronaut: '🧑‍🚀', grandma: '👵',
  chef: '🧑‍🍳', teddy: '🧸', monkey: '🐵', penguin: '🐧', chick: '🐥', doctor: '🧑‍⚕️', baby: '👶', clown: '🤡', bear: '🐻', parrot: '🦜', bunny: '🐰',
};

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
  pizza: ['#f6e3b4', '#2f8f3a'], toystore: ['#ffd23f', '#7d3cff'], library: ['#e8dcc4', '#7a5a3a'], zoo: ['#c9a66b', '#3c7a32'], station: ['#c8553d', '#4a2c14'],
  windmill: ['#f4f4f0', '#8a5a1a'], cabin: ['#a0703c', '#5b3a1a'], hospital: ['#f4f4f0', '#c0392b'], museum: ['#e0d6c2', '#8a7a5a'], stadium: ['#9aa3ad', '#3a3f47'],
  giant: ['#5b7fc7', '#24476e'], volcano: ['#d9b26b', '#9a7a2a'],
};
/** Looks drawn like a shop front (a striped awning over the ground floor), with the awning's two colours. */
const AWNING: Partial<Record<string, [string, string]>> = { shop: ['#fff', '#e63946'], pizza: ['#fff', '#2f8f3a'], toystore: ['#ff6fb5', '#2a7bff'] };

/** A block of windows. `lit`: the Town at night, every window warm with light but a few. */
function block(ctx: CanvasRenderingContext2D, look: string, b: Block, lit = false) {
  const [fill, edge] = BLOCK_COLORS[look] ?? ['#ccc', '#666'], y0 = b.base ?? 0, h = b.floors;
  ctx.fillStyle = fill; ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.07;
  if (look === 'windmill') {
    ctx.beginPath(); ctx.moveTo(b.x - 0.35, y0); ctx.lineTo(b.x + 0.2, y0 + h); ctx.lineTo(b.x + b.w - 0.2, y0 + h); ctx.lineTo(b.x + b.w + 0.35, y0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = edge; ctx.beginPath(); ctx.moveTo(b.x, y0 + h); ctx.quadraticCurveTo(b.x + b.w / 2, y0 + h + 1.3, b.x + b.w, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(b.x + b.w / 2 - 0.3, 0, 0.6, 0.8); ctx.strokeRect(b.x + b.w / 2 - 0.3, 0, 0.6, 0.8);
    windows(ctx, look, b, lit, true);
    return;
  }
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
  if (look === 'cabin') {
    // a log cabin on its rock: logs across, and a steep roof
    ctx.strokeStyle = '#00000040'; ctx.lineWidth = 0.04; for (let f = 0.25; f < h; f += 0.25) { ctx.beginPath(); ctx.moveTo(b.x, y0 + f); ctx.lineTo(b.x + b.w, y0 + f); ctx.stroke(); }
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.07; ctx.fillStyle = edge;
  }
  if (look === 'house' || look === 'treehouse' || look === 'cabin' || look === 'zoo') { ctx.beginPath(); ctx.moveTo(b.x - 0.3, y0 + h); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.1); ctx.lineTo(b.x + b.w + 0.3, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (look === 'barn') { ctx.beginPath(); ctx.moveTo(b.x - 0.3, y0 + h); ctx.lineTo(b.x + 0.4, y0 + h + 0.9); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.4); ctx.lineTo(b.x + b.w - 0.4, y0 + h + 0.9); ctx.lineTo(b.x + b.w + 0.3, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (look === 'castle') { for (let x = b.x; x < b.x + b.w - 0.1; x += 0.6) { ctx.fillStyle = fill; ctx.fillRect(x, y0 + h, 0.35, 0.4); ctx.strokeRect(x, y0 + h, 0.35, 0.4); } ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, y0 + h + 0.4); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.5); ctx.lineTo(b.x + b.w / 2 + 0.6, y0 + h + 1.3); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.1); ctx.fill(); ctx.stroke(); }
  else if (AWNING[look]) { const [a, c] = AWNING[look]!, stripes = 8; for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? a : c; ctx.fillRect(b.x + i * b.w / stripes, y0 + 1, b.w / stripes, 0.25); } ctx.fillStyle = edge; ctx.fillRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.2); ctx.strokeRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.2); }
  else if (look === 'library' || look === 'museum') {
    // a grand front: a pediment on top and columns between the windows
    ctx.beginPath(); ctx.moveTo(b.x - 0.25, y0 + h); ctx.lineTo(b.x + b.w / 2, y0 + h + 0.9); ctx.lineTo(b.x + b.w + 0.25, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff8e8'; for (let c = 0; c <= b.cols; c++) { const x = b.x + c * b.w / b.cols - 0.08; ctx.fillRect(Math.max(b.x, Math.min(b.x + b.w - 0.16, x)), y0, 0.16, h); }
    ctx.fillStyle = edge; ctx.fillRect(b.x - 0.15, y0, b.w + 0.3, 0.12);
  }
  else if (look === 'hospital') { ctx.fillRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); ctx.strokeRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); ctx.fillStyle = '#e63946'; ctx.fillRect(b.x + b.w / 2 - 0.12, y0 + h + 0.25, 0.24, 0.7); ctx.fillRect(b.x + b.w / 2 - 0.35, y0 + h + 0.48, 0.7, 0.24); }
  else if (look === 'stadium') { ctx.beginPath(); ctx.moveTo(b.x - 0.2, y0 + h); ctx.quadraticCurveTo(b.x + b.w / 2, y0 + h + 1.2, b.x + b.w + 0.2, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (look === 'giant') { ctx.fillRect(b.x + 0.3, y0 + h, b.w - 0.6, 0.4); ctx.strokeRect(b.x + 0.3, y0 + h, b.w - 0.6, 0.4); ctx.fillStyle = '#3a3f47'; ctx.fillRect(b.x + b.w / 2 - 0.05, y0 + h + 0.4, 0.1, 1.2); ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, y0 + h + 1.6, 0.12, 0, 7); ctx.fill(); }
  else if (look === 'volcano') { ctx.fillStyle = '#e8c56a'; ctx.beginPath(); ctx.moveTo(b.x - 0.45, y0 + h); ctx.lineTo(b.x + b.w / 2, y0 + h + 1.2); ctx.lineTo(b.x + b.w + 0.45, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#9a7a2a'; ctx.lineWidth = 0.04; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, y0 + h + 1.2); ctx.lineTo(b.x - 0.45 + i * (b.w + 0.9) / 6, y0 + h); ctx.stroke(); } }
  else if (look === 'station') { ctx.fillRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.25); ctx.strokeRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.25); ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, y0 + h + 0.7, 0.38, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, y0 + h + 0.7); ctx.lineTo(b.x + b.w / 2, y0 + h + 0.95); ctx.moveTo(b.x + b.w / 2, y0 + h + 0.7); ctx.lineTo(b.x + b.w / 2 + 0.18, y0 + h + 0.7); ctx.stroke(); ctx.fillStyle = edge; ctx.fillRect(b.x - 0.1, y0 + h + 0.25, 0.01, 0.01); }
  else if (look === 'airport') { ctx.fillStyle = '#7fd3ff'; ctx.fillRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.6); ctx.strokeRect(b.x - 0.3, y0 + h, b.w + 0.6, 0.6); }
  else if (look === 'rocket') { ctx.strokeStyle = edge; ctx.lineWidth = 0.05; for (let f = 0; f < h; f++) { ctx.beginPath(); ctx.moveTo(b.x, y0 + f); ctx.lineTo(b.x + b.w, y0 + f + 1); ctx.moveTo(b.x + b.w, y0 + f); ctx.lineTo(b.x, y0 + f + 1); ctx.stroke(); } }
  else { ctx.fillRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); ctx.strokeRect(b.x - 0.1, y0 + h, b.w + 0.2, 0.18); }
  windows(ctx, look, b, lit, false);
  if (look === 'barn') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.08; ctx.strokeRect(b.x + b.w / 2 - 0.6, 0.02, 1.2, 1.1); ctx.beginPath(); ctx.moveTo(b.x + b.w / 2 - 0.6, 0.02); ctx.lineTo(b.x + b.w / 2 + 0.6, 1.12); ctx.moveTo(b.x + b.w / 2 + 0.6, 0.02); ctx.lineTo(b.x + b.w / 2 - 0.6, 1.12); ctx.stroke(); }
}

/** The windows, and a door on the ground floor. */
function windows(ctx: CanvasRenderingContext2D, look: string, b: Block, lit: boolean, noDoor: boolean) {
  const y0 = b.base ?? 0;
  ctx.lineWidth = 0.05;
  for (let f = 0; f < b.floors; f++) for (let c = 0; c < b.cols; c++) {
    const cx = b.x + (c + 0.5) * b.w / b.cols, cy = y0 + f + 0.5;
    if (!noDoor && f === 0 && y0 === 0 && c === Math.floor(b.cols / 2) && look !== 'rocket' && b.cols > 1) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 0.28, 0, 0.56, 0.8); ctx.strokeStyle = '#141414'; ctx.strokeRect(cx - 0.28, 0, 0.56, 0.8); continue; }
    if (noDoor && f === 0) continue;
    ctx.fillStyle = lit ? ((f * 5 + c * 3 + Math.round(b.x)) % 7 === 3 ? '#2a3a52' : '#ffcf7a') : look === 'tower' || look === 'giant' ? '#9fd0ff' : '#2a3a52';
    ctx.fillRect(cx - 0.3, cy - 0.3, 0.6, 0.6); ctx.strokeStyle = '#141414'; ctx.strokeRect(cx - 0.3, cy - 0.3, 0.6, 0.6);
  }
}

const BACK_PROPS = new Set<Prop['kind']>(['water', 'plane', 'rocket', 'volcano', 'rock', 'bigtop', 'train', 'blades']);

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
  else if (p.kind === 'tent') {
    ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(p.x - 1.0, 0); ctx.lineTo(p.x, 1.5); ctx.lineTo(p.x + 1.0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(p.x - 0.3, 0); ctx.lineTo(p.x, 0.75); ctx.lineTo(p.x + 0.3, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (p.kind === 'campfire') {
    ctx.fillStyle = '#7a4a2a'; ctx.save(); ctx.translate(p.x, 0.12); for (const a of [0.35, -0.35]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-0.5, -0.07, 1.0, 0.14); ctx.strokeRect(-0.5, -0.07, 1.0, 0.14); ctx.restore(); } ctx.restore();
    ctx.fillStyle = '#9aa3ad'; for (const dx of [-0.6, -0.3, 0.3, 0.6]) { ctx.beginPath(); ctx.arc(p.x + dx, 0.08, 0.1, 0, 7); ctx.fill(); ctx.stroke(); }
  } else if (p.kind === 'hay') {
    const n = p.h ?? 1;
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
      const x = p.x + (j - (n - i - 1) / 2) * 1.05, y = 0.5 + i * 0.95;
      ctx.fillStyle = '#e8c044'; ctx.beginPath(); ctx.arc(x, y, 0.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#b8901a'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.arc(x, y, 0.3, 0, 7); ctx.arc(x, y, 0.12, 0, 7); ctx.stroke(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.06;
    }
  } else if (p.kind === 'tractor') {
    ctx.fillStyle = '#2f8f3a'; ctx.beginPath(); ctx.roundRect(p.x - 0.9, 0.45, 1.6, 0.55, 0.08); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(p.x - 0.75, 0.95, 0.7, 0.75, 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe6ff'; ctx.fillRect(p.x - 0.65, 1.15, 0.5, 0.4); ctx.strokeRect(p.x - 0.65, 1.15, 0.5, 0.4);
    ctx.fillStyle = '#3a3f47'; ctx.fillRect(p.x + 0.35, 1.0, 0.1, 0.45);
    ctx.fillStyle = '#1c1c1e'; ctx.beginPath(); ctx.arc(p.x - 0.5, 0.45, 0.45, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + 0.55, 0.28, 0.28, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(p.x - 0.5, 0.45, 0.18, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + 0.55, 0.28, 0.1, 0, 7); ctx.fill();
  } else if (p.kind === 'train') {
    const w = p.w ?? 4.6, x0 = p.x;
    ctx.fillStyle = '#5d6670'; ctx.fillRect(x0 - 0.3, 0, w + 0.6, 0.08);
    // the engine at the front (right), then two cars
    const cars = [{ x: x0, w: (w - 0.3) * 0.32, c: '#2a7bff' }, { x: x0 + (w - 0.3) * 0.34, w: (w - 0.3) * 0.32, c: '#ffd23f' }];
    for (const c of cars) { ctx.fillStyle = c.c; ctx.beginPath(); ctx.roundRect(c.x, 0.3, c.w, 1.0, 0.08); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#bfe6ff'; ctx.fillRect(c.x + 0.2, 0.8, c.w - 0.4, 0.3); ctx.strokeRect(c.x + 0.2, 0.8, c.w - 0.4, 0.3); }
    const ex = x0 + (w - 0.3) * 0.68, ew = w - (ex - x0);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(ex, 0.3, ew, 0.8, 0.1); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(ex, 1.05, ew * 0.45, 0.65, 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3f47'; ctx.fillRect(ex + ew * 0.72, 1.1, 0.2, 0.5); ctx.strokeRect(ex + ew * 0.72, 1.1, 0.2, 0.5);
    ctx.fillStyle = '#1c1c1e'; for (let x = x0 + 0.3; x < x0 + w; x += 0.62) { ctx.beginPath(); ctx.arc(x, 0.22, 0.18, 0, 7); ctx.fill(); }
  } else if (p.kind === 'blades') {
    const cy = p.h ?? 4;
    ctx.save(); ctx.translate(p.x, cy); ctx.fillStyle = '#f4f1e8';
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(0.4 + i * Math.PI / 2); ctx.fillRect(0.15, -0.16, 1.9, 0.32); ctx.strokeRect(0.15, -0.16, 1.9, 0.32); ctx.strokeStyle = '#8a5a1a'; ctx.lineWidth = 0.03; for (let k = 0.4; k < 2; k += 0.3) { ctx.beginPath(); ctx.moveTo(k, -0.16); ctx.lineTo(k, 0.16); ctx.stroke(); } ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.06; ctx.restore(); }
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(0, 0, 0.2, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  } else if (p.kind === 'rock') {
    const w = p.w ?? 4, h = p.h ?? 1.5;
    ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.moveTo(p.x - 0.4, 0); ctx.quadraticCurveTo(p.x - 0.2, h * 1.05, p.x + 0.6, h); ctx.lineTo(p.x + w - 0.6, h); ctx.quadraticCurveTo(p.x + w + 0.2, h * 1.05, p.x + w + 0.4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b707a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(p.x + 0.4 + i * (w - 0.8) / 4, h * (0.3 + (i % 2) * 0.3), 0.3, 0.15, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#4f8f3a'; ctx.fillRect(p.x + 0.4, h - 0.08, w - 0.8, 0.12);
  } else if (p.kind === 'bigtop') {
    const w = p.w ?? 5.6, h = p.h ?? 4.4, x0 = p.x - w / 2, wall = h * 0.4;
    ctx.save(); ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, wall); ctx.lineTo(p.x, h); ctx.lineTo(x0 + w, wall); ctx.lineTo(x0 + w, 0); ctx.closePath(); ctx.fillStyle = '#f4f4f0'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#e63946'; for (let i = 0; i < 8; i += 2) { ctx.beginPath(); ctx.moveTo(p.x, h); ctx.lineTo(x0 + i * w / 8, 0); ctx.lineTo(x0 + (i + 1) * w / 8, 0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, wall); ctx.lineTo(p.x, h); ctx.lineTo(x0 + w, wall); ctx.lineTo(x0 + w, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x0, wall); for (let i = 0; i <= 8; i++) ctx.lineTo(x0 + i * w / 8, wall - (i % 2 ? 0.3 : 0)); ctx.lineTo(x0 + w, wall - 0.15); ctx.lineTo(x0, wall - 0.15); ctx.fill();
    ctx.fillStyle = '#3a3f47'; ctx.fillRect(p.x - 0.03, h, 0.06, 0.6); ctx.fillStyle = '#2a7bff'; ctx.beginPath(); ctx.moveTo(p.x, h + 0.6); ctx.lineTo(p.x + 0.5, h + 0.45); ctx.lineTo(p.x, h + 0.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(p.x - 0.4, 0); ctx.lineTo(p.x, 1.1); ctx.lineTo(p.x + 0.4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (p.kind === 'pole') {
    const h = p.h ?? 3;
    ctx.fillStyle = '#d9dee4'; ctx.fillRect(p.x - 0.07, 0, 0.14, h); ctx.strokeRect(p.x - 0.07, 0, 0.14, h);
    ctx.fillStyle = '#e63946'; ctx.fillRect(p.x - 0.6, h, 1.2, 0.14); ctx.strokeRect(p.x - 0.6, h, 1.2, 0.14);
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(p.x - 0.07, h - 0.6); ctx.lineTo(p.x - 1.4, 0); ctx.moveTo(p.x + 0.07, h - 0.6); ctx.lineTo(p.x + 1.4, 0); ctx.stroke();
  } else if (p.kind === 'volcano') {
    const h = p.h ?? 6, half = h * 0.75;
    ctx.fillStyle = '#5b4a3a'; ctx.beginPath(); ctx.moveTo(p.x - half, 0); ctx.lineTo(p.x - 0.7, h); ctx.lineTo(p.x + 0.7, h); ctx.lineTo(p.x + half, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.moveTo(p.x - 0.7, h); ctx.lineTo(p.x - 0.9, h - 0.9); ctx.lineTo(p.x - 0.5, h - 0.5); ctx.lineTo(p.x - 0.3, h - 1.6); ctx.lineTo(p.x, h - 0.6); ctx.lineTo(p.x + 0.35, h - 1.2); ctx.lineTo(p.x + 0.7, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(p.x, h, 0.65, 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6a6a72'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x - 0.3 + i * 0.4, h + 0.5 + i * 0.35, 0.35 + i * 0.12, 0, 7); ctx.fill(); }
  } else if (p.kind === 'palm') {
    const h = p.h ?? 3;
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.moveTo(p.x - 0.2, 0); ctx.quadraticCurveTo(p.x - 0.35, h * 0.5, p.x, h); ctx.stroke();
    ctx.fillStyle = '#2f8f3a'; ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.05;
    for (let i = 0; i < 5; i++) { const a = -0.3 + i * (Math.PI + 0.6) / 4; ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * 0.6, h + Math.sin(a) * 0.3, 0.7, 0.18, a, 0, 7); ctx.fill(); ctx.stroke(); }
  }
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
  for (const p of scene.props) if (BACK_PROPS.has(p.kind)) prop(ctx, m, p);
  for (const b of scene.blocks) block(ctx, scene.look, b, lit);
  for (const p of scene.props) if (!BACK_PROPS.has(p.kind)) prop(ctx, m, p);
  if (scene.look === 'shop') emoji(ctx, m, '🥐', scene.blocks[0]!.x + scene.blocks[0]!.w / 2, 2.55, 0.6);
  if (scene.sign && scene.blocks[0]) { const b = scene.blocks[0], roof = scene.look === 'library' || scene.look === 'museum' ? 1.25 : scene.look === 'hospital' ? 1.35 : scene.look === 'stadium' ? 1.1 : 0.62; emoji(ctx, m, scene.sign, b.x + b.w / 2, (b.base ?? 0) + b.floors + roof, scene.look === 'museum' ? 0.85 : 0.65); }
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
  const fan = look.gadgets.includes('fan');
  // a spotlight on the night: a soft beam from his vehicle to where the water's going (or the scene)
  if (s.scene.night && look.gadgets.includes('spotlight')) {
    const from = { x: s.place.origin.x - 0.6, y: s.place.origin.y + 0.5 }, to = s.aim ?? s.auto ?? { x: (s.scene.right + 8) / 2, y: s.scene.top * 0.5 };
    const a = Math.atan2(to.y - from.y, to.x - from.x), len = Math.hypot(to.x - from.x, to.y - from.y) + 1.5, wid = 0.25 + len * 0.12;
    ctx.save(); ctx.translate(from.x, from.y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,248,200,0.16)'; ctx.beginPath(); ctx.moveTo(0, -0.1); ctx.lineTo(len, -wid); ctx.lineTo(len, wid); ctx.lineTo(0, 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // fires: a glow in the window, flames that shrink as the water puts them out, and smoke (unless his Smoke Fan blows it away);
  // a fire that will flare up again glows red under its ash
  for (const f of s.fires) {
    const left = f.out ? 0 : Math.max(0.25, f.hp / FIRE_HP);
    if (!f.out) {
      if (f.kind === 'window') { ctx.fillStyle = '#ffb03a'; ctx.fillRect(f.x - 0.3, f.y - 0.3, 0.6, 0.6); }
      if (!fan) for (let i = 0; i < 3; i++) {
        const k = (t * 0.45 + i / 3) % 1;
        ctx.fillStyle = `rgba(70,70,80,${0.45 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(f.x + Math.sin(t + i * 2) * 0.2 + k * 0.4, f.y + 0.6 + k * 2.2, 0.25 + k * 0.45, 0, 7); ctx.fill();
      }
      flame(ctx, f.x, f.y, left * (f.kind === 'bush' ? 1.15 : 0.95), t, f.x * 3.1);
    } else {
      if (f.kind === 'window') { ctx.fillStyle = '#3a3a40'; ctx.fillRect(f.x - 0.3, f.y - 0.3, 0.6, 0.6); }
      if (f.back > 0) { ctx.fillStyle = `rgba(255,${90 + Math.round(60 * Math.sin(t * 10))},20,${0.5 + 0.3 * Math.sin(t * 7)})`; ctx.beginPath(); ctx.arc(f.x, f.y - 0.15, 0.14 + (1 - f.back / 2.5) * 0.12, 0, 7); ctx.fill(); }
    }
  }
  // people waiting at windows (bobbing and waving), riding the ladder, floating down under a parachute, carried by the drone, or safe
  // in the crowd
  const base = s.place.ladderBase, tip = { x: base.x + Math.cos(s.ladder.angle) * s.ladder.len, y: base.y + Math.sin(s.ladder.angle) * s.ladder.len };
  let crowd = 0;
  for (const r of s.rescues) {
    if (r.state === 'waiting' || r.state === 'climbing') {
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(r.x - 0.3, r.y - 0.3, 0.6, 0.6);
      emoji(ctx, m, WHO[r.who], r.x, r.y + 0.04 + Math.abs(Math.sin(t * 4 + r.x)) * 0.08, 0.55);
      if (r.state === 'waiting' && Math.sin(t * 2 + r.x) > 0.3) emoji(ctx, m, '👋', r.x + 0.4, r.y + 0.35, 0.3);
    } else if (r.state === 'riding') emoji(ctx, m, WHO[r.who], tip.x + 0.1, tip.y + (s.stats.kind === 'hover' ? -0.25 : 0.35), 0.55);
    else if (r.state === 'chute') { emoji(ctx, m, '🪂', r.x + Math.sin(t * 2 + r.floor) * 0.08, r.y + 0.65, 0.8); emoji(ctx, m, WHO[r.who], r.x, r.y, 0.5); }
    else if (r.state === 'flying') emoji(ctx, m, WHO[r.who], r.x, r.y, 0.5);
    else { crowd++; emoji(ctx, m, WHO[r.who], CROWD_X - 0.5 + crowd * 0.55, 0.3 + (r.t < 1.2 ? Math.abs(Math.sin(r.t * 8)) * 0.25 : 0), 0.5); }
  }
  // his vehicle, its ladder where the sim has it, its hose aimed where the water goes: a truck on the street, an aircraft up in the
  // air (bobbing a little), a plane where it's flying
  const droneAway = !!s.drone && s.drone.phase !== 'home';
  if (s.plane) drawTruck(ctx, m, look, s.plane.x - 2.6, { t, flash, bounce: s.place.y + Math.sin(t * 1.7) * 0.05, facing: s.plane.facing, droneAway });
  else drawTruck(ctx, m, look, s.place.x, { ladderAngle: s.ladder.angle, ladderLen: s.ladder.len, t, flash, aim: s.angle, bounce: s.place.y ? s.place.y + Math.sin(t * 2) * 0.05 : 0, droneAway });
  world(ctx, m);
  if (s.drone && droneAway) drone(ctx, s.drone.x, s.drone.y, t);
  // the water: one path of short streaks, or dots, hearts, stars or confetti for the nozzles that spray those
  const d = s.drops, n = MAX_DROPS, F = d.length / n, nz = look.nozzle;
  const color = nz === 'foam' ? '#ffffff' : nz === 'glitter' || nz === 'golden' ? '#ffd23f' : nz === 'snow' ? '#ffffff' : nz === 'slime' ? '#7be03a' : nz === 'chocolate' ? '#7a4a2a' : '#7fd3ff';
  const each = (f: (x: number, y: number, vx: number, vy: number) => void, from = 0, by = 1) => { for (let i = from; i < n; i += by) { const o = i * F; if (d[o + 4]! > 0) f(d[o]!, d[o + 1]!, d[o + 2]!, d[o + 3]!); } };
  if (nz === 'bubbles' || nz === 'snow' || nz === 'glitter') {
    ctx.fillStyle = color; ctx.strokeStyle = nz === 'bubbles' ? '#2f7fd8' : color; ctx.lineWidth = 0.025;
    ctx.beginPath();
    each((x, y) => { ctx.moveTo(x + 0.07, y); ctx.arc(x, y, nz === 'bubbles' ? 0.08 : 0.05, 0, 6.3); });
    if (nz === 'bubbles') ctx.stroke(); else ctx.fill();
  } else if (nz === 'hearts') {
    ctx.fillStyle = '#ff4d8d'; ctx.beginPath();
    each((x, y) => { ctx.moveTo(x, y - 0.08); ctx.lineTo(x - 0.075, y + 0.005); ctx.arc(x - 0.04, y + 0.02, 0.042, Math.PI * 1.2, Math.PI * 0.1, true); ctx.arc(x + 0.04, y + 0.02, 0.042, Math.PI * 0.9, -Math.PI * 0.2, true); ctx.closePath(); });
    ctx.fill();
  } else if (nz === 'stars' || nz === 'golden') {
    ctx.fillStyle = nz === 'golden' ? '#ffd23f' : '#fff27a'; ctx.beginPath();
    each((x, y) => { const r = 0.085, q = 0.03; ctx.moveTo(x, y + r); ctx.lineTo(x + q, y + q); ctx.lineTo(x + r, y); ctx.lineTo(x + q, y - q); ctx.lineTo(x, y - r); ctx.lineTo(x - q, y - q); ctx.lineTo(x - r, y); ctx.lineTo(x - q, y + q); ctx.closePath(); });
    ctx.fill();
    if (nz === 'golden') { ctx.strokeStyle = '#ffd23f88'; ctx.lineWidth = 0.05; ctx.beginPath(); each((x, y, vx, vy) => { ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.03, y - vy * 0.03); }); ctx.stroke(); }
  } else if (nz === 'rainbow' || nz === 'confetti') {
    const bands = ['#ff2a2a', '#ff8c1a', '#ffd23f', '#2bb673', '#2a7bff', '#7d3cff'];
    ctx.lineWidth = 0.09; ctx.lineCap = 'round';
    for (let band = 0; band < 6; band++) {
      if (nz === 'confetti') { ctx.fillStyle = bands[band]!; ctx.beginPath(); each((x, y) => { ctx.rect(x - 0.05, y - 0.03, 0.1, 0.06); }, band, 6); ctx.fill(); continue; }
      ctx.strokeStyle = bands[band]!;
      ctx.beginPath();
      each((x, y, vx, vy) => { ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.025, y - vy * 0.025); }, band, 6);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = (0.09 + look.hose * 0.01) * (nz === 'slime' || nz === 'chocolate' || nz === 'cannon' ? 1.4 : 1); ctx.lineCap = 'round';
    ctx.beginPath();
    each((x, y, vx, vy) => { ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.03, y - vy * 0.03); });
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

/** The Rescue Drone out on a job: a little body and four spinning rotors. */
function drone(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.strokeStyle = '#141414'; ctx.lineWidth = 0.04;
  ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.roundRect(x - 0.28, y - 0.1, 0.56, 0.2, 0.06); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#3a3f47'; ctx.beginPath(); ctx.moveTo(x - 0.45, y + 0.1); ctx.lineTo(x + 0.45, y + 0.1); ctx.stroke();
  ctx.fillStyle = '#2a2a30'; for (const dx of [-0.45, 0.45]) { const sp = 0.3 * Math.abs(Math.cos(t * 28 + dx)); ctx.fillRect(x + dx - sp, y + 0.12, Math.max(0.04, sp * 2), 0.04); }
  ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x + 0.2, y - 0.02, 0.05, 0, 7); ctx.fill();
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
  // an aircraft flies along above the street; a truck rolls on it
  const air = kindOf(look.truck) !== 'truck';
  drawTruck(ctx, m, look, Math.min(worldW * 0.08, -5 + t * 6), { t, flash: siren > 0 || true, exhaust: true, bounce: air ? 1.6 * tall + Math.sin(t * 2) * 0.12 : Math.abs(Math.sin(t * 13)) * 0.04 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export { NOZZLE_AT };
