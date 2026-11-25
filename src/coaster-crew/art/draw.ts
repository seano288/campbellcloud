// Drawing pieces shared by the question scenes, the choice pictures, the builder and the Ride: carts, hands and people, arrows, grounds,
// magnets and the things a magnet is tried on. The family look: thick black outlines, solid colours, a little shine.
import { cartColour } from '../questions/tables';

export type Ctx = CanvasRenderingContext2D;
export const INK = '#14161b';

export function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function outline(ctx: Ctx, lw: number) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }

/** A little cart from the side, its middle-bottom at (x, y), turned by `angle`. `bags` sandbags (0 to 5) piled in it. */
export function drawCart(ctx: Ctx, x: number, y: number, angle: number, colour: string, s: number, bags = 0, riders = false) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  const w = s, h = s * .42, lw = Math.max(2, s * .06);
  // load first, so the cart's side covers its bottom
  for (let i = 0; i < bags; i++) {
    const row = i < 3 ? 0 : 1, col = row === 0 ? i : i - 3, bx = -w * .32 + col * w * .3 + row * w * .15, by = -h - s * .1 - row * s * .16;
    ctx.beginPath(); ctx.ellipse(bx, by, s * .15, s * .1, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8a46a'; ctx.fill(); outline(ctx, lw * .7);
    ctx.beginPath(); ctx.moveTo(bx - s * .05, by - s * .02); ctx.lineTo(bx + s * .05, by - s * .02); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = lw * .5; ctx.stroke();
  }
  if (riders) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(-w * .2 + i * w * .38, -h - s * .14, s * .13, 0, Math.PI * 2); ctx.fillStyle = '#ffd7a8'; ctx.fill(); outline(ctx, lw * .7); }
  rounded(ctx, -w / 2, -h - s * .1, w, h, s * .1);
  ctx.fillStyle = colour; ctx.fill(); outline(ctx, lw);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-w / 2 + s * .08, -h - s * .04, w - s * .16, s * .06);
  for (const wx of [-w * .3, w * .3]) {
    ctx.beginPath(); ctx.arc(wx, -s * .1, s * .12, 0, Math.PI * 2); ctx.fillStyle = '#3a3f48'; ctx.fill(); outline(ctx, lw * .8);
    ctx.beginPath(); ctx.arc(wx, -s * .1, s * .04, 0, Math.PI * 2); ctx.fillStyle = '#c9d1da'; ctx.fill();
  }
  ctx.restore();
}
export const cartFill = (id: string) => cartColour(id);

/** An arrow from (x1, y1) to (x2, y2). */
export function drawArrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, colour: string, width: number) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const head = Math.min(len * .55, width * 2.6);
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, -width / 2); ctx.lineTo(len - head, -width / 2); ctx.lineTo(len - head, -width * 1.25); ctx.lineTo(len, 0);
  ctx.lineTo(len - head, width * 1.25); ctx.lineTo(len - head, width / 2); ctx.lineTo(0, width / 2); ctx.closePath();
  ctx.fillStyle = colour; ctx.fill(); outline(ctx, Math.max(2, width * .28));
  ctx.restore();
}

/** A mitten hand at (x, y). */
export function drawHand(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath(); ctx.ellipse(x, y, s * .5, s * .42, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffcf9e'; ctx.fill(); outline(ctx, Math.max(2, s * .1));
  ctx.beginPath(); ctx.ellipse(x - s * .1, y - s * .38, s * .16, s * .22, -.5, 0, Math.PI * 2); ctx.fillStyle = '#ffcf9e'; ctx.fill(); outline(ctx, Math.max(2, s * .08));
}
/** A person standing on the ground at x, reaching one arm to (hx, hy). */
export function drawPerson(ctx: Ctx, x: number, ground: number, s: number, hx: number, hy: number, shirt = '#2f80ed') {
  const lw = Math.max(2, s * .06), hip = ground - s * .9, neck = ground - s * 1.65;
  ctx.strokeStyle = INK; ctx.lineWidth = lw * 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, hip); ctx.lineTo(x - s * .22, ground); ctx.moveTo(x, hip); ctx.lineTo(x + s * .22, ground); ctx.stroke();
  rounded(ctx, x - s * .25, neck, s * .5, hip - neck + s * .05, s * .15); ctx.fillStyle = shirt; ctx.fill(); outline(ctx, lw);
  ctx.beginPath(); ctx.moveTo(x, neck + s * .2); ctx.lineTo(hx, hy); ctx.strokeStyle = INK; ctx.lineWidth = lw * 3.4; ctx.stroke();
  ctx.strokeStyle = shirt; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, neck - s * .3, s * .3, 0, Math.PI * 2); ctx.fillStyle = '#ffcf9e'; ctx.fill(); outline(ctx, lw);
  ctx.beginPath(); ctx.arc(x + s * .1, neck - s * .34, s * .04, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  drawHand(ctx, hx, hy, s * .32);
}

/** A strip of ground, textured: ice shines, the floor has boards, carpet has pile, grass has blades, sand has grains. */
export function drawGround(ctx: Ctx, id: string, x: number, y: number, w: number, h: number, colour: string) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = colour; ctx.fill(); ctx.clip();
  const k = Math.max(1, h / 30);
  if (id === 'ice') { ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 2 * k; for (let i = 0; i < w; i += 70 * k) { ctx.beginPath(); ctx.moveTo(x + i, y + h * .7); ctx.lineTo(x + i + 30 * k, y + h * .3); ctx.stroke(); } }
  if (id === 'floor') { ctx.strokeStyle = '#a8763c'; ctx.lineWidth = 2; for (let i = 0; i < w; i += 60 * k) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke(); } }
  if (id === 'carpet') { ctx.fillStyle = '#9e2f42'; for (let i = 0; i < w; i += 7 * k) for (let j = 2; j < h; j += 7 * k) ctx.fillRect(x + i + ((j / 7) % 2) * 3, y + j, 2.5 * k, 2.5 * k); }
  if (id === 'grass') { ctx.strokeStyle = '#3f8f2e'; ctx.lineWidth = 2 * k; for (let i = 0; i < w; i += 9 * k) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + 3 * k, y - 1); ctx.stroke(); } }
  if (id === 'sand') { ctx.fillStyle = '#c9a850'; for (let i = 0; i < w; i += 6 * k) for (let j = 2; j < h; j += 6 * k) { ctx.beginPath(); ctx.arc(x + i + ((i * 7 + j * 3) % 5), y + j, 1.6 * k, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); outline(ctx, 3);
}

/** A horseshoe magnet, its open end facing right (or left), the face at (x, y). */
export function drawMagnet(ctx: Ctx, x: number, y: number, s: number, facing: 1 | -1 = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(facing, 1);
  const lw = Math.max(2, s * .07), t = s * .32;
  ctx.beginPath();
  ctx.moveTo(0, -s * .5); ctx.lineTo(-s * .45, -s * .5); ctx.arc(-s * .45, 0, s * .5, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(0, s * .5);
  ctx.lineTo(0, s * .5 - t); ctx.lineTo(-s * .45, s * .5 - t); ctx.arc(-s * .45, 0, s * .5 - t, Math.PI / 2, -Math.PI / 2, false); ctx.lineTo(0, -s * .5 + t); ctx.closePath();
  ctx.fillStyle = '#e63946'; ctx.fill(); outline(ctx, lw);
  for (const sy of [-s * .5, s * .5 - t]) { ctx.beginPath(); ctx.rect(-s * .18, sy, s * .18, t); ctx.fillStyle = '#d7dde4'; ctx.fill(); outline(ctx, lw); }
  ctx.restore();
}
/** A bar magnet, N end red and S end blue, its middle at (x, y); `left` is the letter on its left end. */
export function drawBarMagnet(ctx: Ctx, x: number, y: number, w: number, h: number, left: 'N' | 'S') {
  const colours = { N: '#e63946', S: '#2f80ed' }, right = left === 'N' ? 'S' : 'N';
  ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w / 2, h); ctx.fillStyle = colours[left]; ctx.fill();
  ctx.beginPath(); ctx.rect(x, y - h / 2, w / 2, h); ctx.fillStyle = colours[right]; ctx.fill();
  rounded(ctx, x - w / 2, y - h / 2, w, h, 4); outline(ctx, Math.max(2, h * .08));
  ctx.fillStyle = '#fff'; ctx.font = `900 ${h * .62}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(left, x - w / 4, y + 1); ctx.fillText(right, x + w / 4, y + 1);
}

const EMOJI: Record<string, string> = { clip: '📎', cup: '🥤', paper: '📄', sock: '🧦', feather: '🪶', crayon: '🖍️' };
/** A thing a magnet is tried on, centred at (x, y), about s across. */
export function drawThing(ctx: Ctx, id: string, x: number, y: number, s: number) {
  const lw = Math.max(1.5, s * .06);
  if (EMOJI[id]) { emoji(ctx, EMOJI[id]!, x, y, s); return; }
  if (id === 'nail') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.5);
    ctx.beginPath(); ctx.rect(-s * .42, -s * .05, s * .72, s * .1); ctx.fillStyle = '#8a929c'; ctx.fill(); outline(ctx, lw);
    ctx.beginPath(); ctx.moveTo(s * .3, -s * .05); ctx.lineTo(s * .46, 0); ctx.lineTo(s * .3, s * .05); ctx.closePath(); ctx.fillStyle = '#8a929c'; ctx.fill(); outline(ctx, lw);
    ctx.beginPath(); ctx.rect(-s * .48, -s * .16, s * .08, s * .32); ctx.fillStyle = '#6b737c'; ctx.fill(); outline(ctx, lw);
    ctx.restore(); return;
  }
  if (id === 'ball') { ball(ctx, x, y, s * .36, '#b8c0c8', '#ffffff'); return; }
  if (id === 'marble') { ctx.globalAlpha = .85; ball(ctx, x, y, s * .3, '#7fd0f0', '#ffffff'); ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(x - s * .15, y + s * .05); ctx.quadraticCurveTo(x, y - s * .15, x + s * .15, y + s * .05); ctx.strokeStyle = '#2f80ed'; ctx.lineWidth = lw; ctx.stroke(); return; }
  if (id === 'rubber') { ball(ctx, x, y, s * .36, '#e63946', '#ff9aa2'); return; }
  if (id === 'block') {
    ctx.beginPath(); ctx.rect(x - s * .34, y - s * .3, s * .68, s * .6); ctx.fillStyle = '#c8955a'; ctx.fill(); outline(ctx, lw);
    ctx.strokeStyle = '#8a6238'; ctx.lineWidth = lw * .7; for (const k of [-.12, .08]) { ctx.beginPath(); ctx.moveTo(x - s * .3, y + s * k); ctx.quadraticCurveTo(x, y + s * (k - .06), x + s * .3, y + s * k); ctx.stroke(); }
    return;
  }
  emoji(ctx, '❓', x, y, s);
}
export function ball(ctx: Ctx, x: number, y: number, r: number, colour: string, shine: string) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = colour; ctx.fill(); outline(ctx, Math.max(2, r * .16));
  ctx.beginPath(); ctx.arc(x - r * .35, y - r * .35, r * .25, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();
}
export function emoji(ctx: Ctx, e: string, x: number, y: number, s: number) {
  ctx.font = `${Math.round(s)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e, x, y + s * .05);
}
