// The five cranes from the side, drawn in code for the Port, "Watch it run" and the shop's tiles: the Dock Crane (a portal crane with a
// cab and a raised jib), the Tall Crane (a tower crane with its counterweight), the Gantry Crane (a quay crane on rails, its boom out over
// the water), the Floating Crane (a sheerleg on a pontoon) and the Giant Gantry (the same as the gantry, much bigger, with its machinery
// house on top). Steel in his crane paint with lattice bracing, thick dark outlines. The Crane game draws its own crane to fit the go
// (crane/render.ts) in the same paint and with the same parts.
import { shade } from './container';

export type CraneKind = 'dock' | 'tall' | 'gantry' | 'floating' | 'giant';
const INK = '#141414';

/** How big each crane is in its own units: its width (from the left leg to the boom's tip) and height. */
export const CRANE_SIZE: Record<CraneKind, { w: number; h: number; left: number }> = {
  dock: { w: 31, h: 29, left: 1 }, tall: { w: 34, h: 40, left: 10 }, gantry: { w: 34, h: 30, left: 8 },
  floating: { w: 31, h: 32, left: 1 }, giant: { w: 44, h: 42, left: 10 },
};

/** A steel beam from (x0, y0) to (x1, y1), `w` thick, outlined, with lattice bracing when it's thick enough to show. */
export function beam(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number, paint: string, lattice = true) {
  const line = Math.max(1.5, w * 0.22);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + line * 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = paint; ctx.lineWidth = w; ctx.stroke();
  if (lattice && w >= 5) {
    const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len, step = w * 1.1, half = w * 0.32;
    ctx.strokeStyle = shade(paint, -0.45); ctx.lineWidth = Math.max(1, w * 0.12); ctx.beginPath();
    for (let d = step / 2, s = 1; d < len - step / 2; d += step, s = -s) {
      const px = x0 + ((x1 - x0) / len) * d, py = y0 + ((y1 - y0) / len) * d;
      ctx.lineTo(px + nx * half * s, py + ny * half * s);
    }
    ctx.stroke();
  }
}

/** The spreader that grabs containers: safety yellow, with its twistlock feet. */
export function spreader(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - w / 2, y, w, h);
  ctx.fillStyle = INK; ctx.fillRect(cx - w / 2, y + h, w * 0.08, h * 0.5); ctx.fillRect(cx + w / 2 - w * 0.08, y + h, w * 0.08, h * 0.5);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, h * 0.3); ctx.strokeRect(cx - w / 2, y, w, h);
}

/** Draws a crane with its left leg standing at (x, groundY), `s` pixels per unit. `trolley` (0 to 1) is where the trolley is along the
 *  boom; `lights` rings the boom with lamps of that colour. */
export function drawCraneSide(ctx: CanvasRenderingContext2D, kind: CraneKind, paint: string, x: number, groundY: number, s: number, trolley = 0.6, lights: string | null = null, t = 0) {
  const X = (ux: number) => x + ux * s, Y = (uy: number) => groundY - uy * s;
  const cab = (cx: number, cy: number, w: number, h: number) => {
    ctx.fillStyle = shade(paint, -0.1); ctx.fillRect(X(cx), Y(cy + h), w * s, h * s);
    ctx.fillStyle = '#9fd6f2'; ctx.fillRect(X(cx + w * 0.55), Y(cy + h * 0.85), w * 0.35 * s, h * 0.45 * s);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.strokeRect(X(cx), Y(cy + h), w * s, h * s);
  };
  const hook = (hx: number, topY: number, drop: number) => {
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1, s * 0.18);
    ctx.beginPath(); ctx.moveTo(X(hx - 0.6), Y(topY)); ctx.lineTo(X(hx - 0.6), Y(topY - drop)); ctx.moveTo(X(hx + 0.6), Y(topY)); ctx.lineTo(X(hx + 0.6), Y(topY - drop)); ctx.stroke();
    spreader(ctx, X(hx), Y(topY - drop), 6 * s, 0.9 * s);
  };
  const bogies = (lx: number) => { ctx.fillStyle = '#333'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(X(lx + d * 0.9), Y(0.6), 0.7 * s, 0, 7); ctx.fill(); } };
  const lamps = (x0: number, x1: number, y: number) => {
    if (!lights) return;
    for (let i = 0; i <= 6; i++) { ctx.fillStyle = (Math.floor(t * 3) + i) % 3 === 0 ? '#ffffff' : lights; ctx.beginPath(); ctx.arc(X(x0 + ((x1 - x0) / 6) * i), Y(y) + 1.2 * s, 0.5 * s, 0, 7); ctx.fill(); }
  };
  const W = (u: number) => u * s;
  if (kind === 'dock') {
    // a portal on two legs, a turning cab on top with its counterweight, and a jib raised toward the water
    beam(ctx, X(0), Y(0), X(2), Y(8), W(1.2), paint, false); beam(ctx, X(10), Y(0), X(8), Y(8), W(1.2), paint, false);
    beam(ctx, X(-0.5), Y(8), X(10.5), Y(8), W(1.4), paint, false);
    ctx.fillStyle = '#3a3f44'; ctx.fillRect(X(0.5), Y(11.5), W(3), W(3)); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.strokeRect(X(0.5), Y(11.5), W(3), W(3));
    cab(3, 8, 6, 5);
    const tipX = 26, tipY = 26;
    beam(ctx, X(6), Y(11), X(tipX), Y(tipY), W(1.5), paint);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.2); ctx.beginPath(); ctx.moveTo(X(5), Y(13)); ctx.lineTo(X(tipX), Y(tipY)); ctx.stroke();
    hook(tipX, tipY, 10 + 4 * Math.sin(t * 0.8 + trolley * 3));
  } else if (kind === 'tall') {
    // a lattice tower, the jib out to the right, the counter-jib and its weights to the left, the cab under the jib
    beam(ctx, X(4), Y(0), X(4), Y(34), W(2.4), paint);
    beam(ctx, X(-10), Y(34), X(24), Y(34), W(1.6), paint);
    beam(ctx, X(4), Y(34), X(4), Y(39), W(1), paint, false);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.2); ctx.beginPath(); ctx.moveTo(X(-9), Y(34.5)); ctx.lineTo(X(4), Y(39)); ctx.lineTo(X(23), Y(34.5)); ctx.stroke();
    ctx.fillStyle = '#6b737b'; ctx.fillRect(X(-9.5), Y(33), W(4), W(3.4)); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.strokeRect(X(-9.5), Y(33), W(4), W(3.4));
    cab(5.5, 29.5, 3.5, 3.5);
    const tx = 8 + 15 * trolley;
    ctx.fillStyle = '#3a3f44'; ctx.fillRect(X(tx - 1.2), Y(33.6), W(2.4), W(1));
    hook(tx, 33, 16);
    lamps(-10, 24, 34);
    ctx.fillStyle = '#5b636b'; ctx.fillRect(X(1), Y(1.5), W(6), W(1.5)); ctx.strokeRect(X(1), Y(1.5), W(6), W(1.5));
  } else if (kind === 'gantry' || kind === 'giant') {
    // a quay crane: two legs on rail bogies, the boom out over the water, an A-frame with its stays, and the machinery house
    const big = kind === 'giant', legB = big ? 16 : 12, legH = big ? 26 : 18, reach = big ? 34 : 26, back = big ? -10 : -8, apex = big ? 9 : 6;
    beam(ctx, X(0), Y(0), X(0), Y(legH), W(big ? 2 : 1.6), paint, false); beam(ctx, X(legB), Y(0), X(legB), Y(legH), W(big ? 2 : 1.6), paint, false);
    beam(ctx, X(0), Y(legH * 0.45), X(legB), Y(legH * 0.45), W(1.1), paint, false);
    bogies(0); bogies(legB);
    beam(ctx, X(back), Y(legH), X(reach), Y(legH), W(big ? 2.2 : 1.7), paint);
    beam(ctx, X(legB * 0.15), Y(legH), X(legB * 0.35), Y(legH + apex), W(1), paint, false); beam(ctx, X(legB * 0.55), Y(legH), X(legB * 0.35), Y(legH + apex), W(1), paint, false);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.22); ctx.beginPath(); ctx.moveTo(X(back + 1), Y(legH + 0.5)); ctx.lineTo(X(legB * 0.35), Y(legH + apex)); ctx.lineTo(X(reach - 1), Y(legH + 0.5)); ctx.stroke();
    // the machinery house behind the legs, on the back-reach
    ctx.fillStyle = shade(paint, 0.25); ctx.fillRect(X(back + 0.5), Y(legH + 3.4), W(big ? 7 : 5), W(3.4)); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.strokeRect(X(back + 0.5), Y(legH + 3.4), W(big ? 7 : 5), W(3.4));
    const tx = legB * 0.4 + (reach - 2 - legB * 0.4) * trolley;
    ctx.fillStyle = '#3a3f44'; ctx.fillRect(X(tx - 1.4), Y(legH - 0.8), W(2.8), W(1.4)); cab(tx - 1.2, legH - 3.4, 2.4, 2.4);
    hook(tx, legH - 3.4, (big ? 14 : 9) + 3 * Math.sin(t * 0.9 + trolley * 4));
    lamps(back, reach, legH);
  } else {
    // a pontoon in the water, its sheerleg jib leaning out
    ctx.fillStyle = '#5b636b'; ctx.fillRect(X(-1), Y(1.5), W(22), W(4)); ctx.fillStyle = '#ffcc00'; ctx.fillRect(X(-1), Y(1.5), W(22), W(0.8));
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.strokeRect(X(-1), Y(1.5), W(22), W(4));
    cab(1, 1.5, 7, 6);
    beam(ctx, X(9), Y(1.5), X(26), Y(30), W(1.8), paint);
    beam(ctx, X(14), Y(1.5), X(26), Y(30), W(1), paint, false);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.2); ctx.beginPath(); ctx.moveTo(X(2), Y(7.5)); ctx.lineTo(X(26), Y(30)); ctx.stroke();
    hook(28, 29, 12 + 3 * Math.sin(t * 0.7));
  }
}

/** Draws a crane to fit a box w by h, standing on a strip of quay: for the shop's tiles. */
export function drawCraneFitted(ctx: CanvasRenderingContext2D, kind: CraneKind, paint: string, w: number, h: number, lights: string | null = null) {
  const sz = CRANE_SIZE[kind], ground = h * 0.86, s = Math.min((w * 0.92) / sz.w, (ground - 4) / sz.h);
  ctx.fillStyle = kind === 'floating' ? '#1f9a8a' : '#9aa1a8'; ctx.fillRect(0, ground, w, h - ground);
  ctx.fillStyle = '#141414'; ctx.fillRect(0, ground, w, Math.max(2, h * 0.02));
  drawCraneSide(ctx, kind, paint, (w - sz.w * s) / 2 + sz.left * s, ground, s, 0.55, lights);
}
