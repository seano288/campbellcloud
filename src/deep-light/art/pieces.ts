// The pieces he builds his submarines from (dock/parts.ts: Noses, Tails, Fins and Tops), drawn in code. Each is drawn at the point its
// submarine gives for it (art/sub.ts, a Frame), facing right, so every piece fits every submarine: a nose grows forward from the front
// tip, a tail back from the back tip, fins back and out from where they join (once above, once below), and a top up from the back.
// Most are drawn before the body, so the body covers where they join. `glow` draws only what shines, for the Dive's dark.
import type { SubLook } from '../dock/dock';

export const INK = '#141414';
type C = CanvasRenderingContext2D;
export interface P { readonly x: number; readonly y: number }

/** A rounded box (CanvasRenderingContext2D.roundRect is too new for an iPad left on iPadOS 15). */
export function rrect(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/** Fills the current path and outlines it in ink. */
export function solid(ctx: C, fill: string | CanvasGradient, lw = 5) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
const poly = (ctx: C, pts: readonly (readonly [number, number])[]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const dot = (ctx: C, x: number, y: number, r: number, fill: string) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); };
/** A soft round glow, for the glow pass. */
export function halo(ctx: C, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, color); g.addColorStop(1, color + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
const STEEL = '#c8d0d8', DARK_STEEL = '#5d6670', RAINBOW = ['#e8323a', '#ff8a1a', '#ffd23f', '#8fe03a', '#3ae0f0', '#9a5aff'];

// ---------- noses ----------

/** Noses drawn over the body (the rest go under it). */
const NOSE_FRONT = new Set(['bumper', 'scoop']);
export function drawNose(ctx: C, l: SubLook, N: P, t: number, front: boolean) {
  const id = l.nose;
  if (NOSE_FRONT.has(id) !== front) return;
  const { x, y } = N;
  if (id === 'bumper') {
    ctx.beginPath(); ctx.arc(x - 16, y, 26, -1.05, 1.05); ctx.lineCap = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#3a3f47'; ctx.stroke();
  } else if (id === 'pointy') {
    poly(ctx, [[x - 16, y - 26], [x + 42, y], [x - 16, y + 26]]); solid(ctx, l.paint);
  } else if (id === 'scoop') {
    ctx.beginPath(); ctx.moveTo(x - 24, y + 16); ctx.lineTo(x + 30, y + 34); ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#c8a060'; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(x + 42, y + 38, 12, 24, 0.2, 0, 7); ctx.fillStyle = '#ffffff55'; ctx.fill(); ctx.clip();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffffcc';
    for (let i = -30; i <= 30; i += 8) { ctx.beginPath(); ctx.moveTo(x + 20, y + 38 + i); ctx.lineTo(x + 64, y + 38 + i + 10); ctx.moveTo(x + 30 + i * 0.4, y + 8); ctx.lineTo(x + 34 + i * 0.4, y + 68); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x + 42, y + 38, 12, 24, 0.2, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  } else if (id === 'drill') {
    const base = x - 14, len = 64, half = 28;
    poly(ctx, [[base, y - half], [base + len, y], [base, y + half]]); solid(ctx, STEEL);
    ctx.save(); ctx.clip(); ctx.lineWidth = 4; ctx.strokeStyle = '#7a8a9a';
    for (let i = 0; i < 5; i++) { const sx = base + ((i * 16 + t * 70) % 80) - 8; ctx.beginPath(); ctx.moveTo(sx, y - half); ctx.lineTo(sx + 16, y + half); ctx.stroke(); }
    ctx.restore();
    poly(ctx, [[base, y - half], [base + len, y], [base, y + half]]); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  } else if (id === 'saw') {
    ctx.beginPath(); rrect(ctx, x - 14, y - 11, 92, 22, 8); solid(ctx, STEEL);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 4 + i * 13, y + s * 11, 5, s < 0 ? Math.PI : 0, s < 0 ? 0 : Math.PI); ctx.fillStyle = '#f4f4f0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  } else if (id === 'narwhal') {
    poly(ctx, [[x - 14, y - 14], [x + 92, y - 34], [x - 10, y + 4]]); solid(ctx, '#f4ecd8', 4);
    ctx.lineWidth = 3; ctx.strokeStyle = '#a89a78';
    for (let i = 1; i < 7; i++) { const f = i / 7, bx = x - 12 + f * 104, by = y - 5 - f * 29, w = 9 * (1 - f); ctx.beginPath(); ctx.moveTo(bx - 4, by - w); ctx.lineTo(bx + 4, by + w); ctx.stroke(); }
  } else if (id === 'hammer') {
    ctx.beginPath(); rrect(ctx, x - 18, y - 13, 34, 26, 6); solid(ctx, l.paint);
    ctx.beginPath(); rrect(ctx, x + 6, y - 50, 28, 100, 13); solid(ctx, l.paint);
    for (const s of [-1, 1]) { dot(ctx, x + 20, y + s * 38, 8, '#ffffff'); dot(ctx, x + 23, y + s * 38, 4, INK); }
  } else if (id === 'rocket') {
    poly(ctx, [[x - 16, y - 28], [x + 46, y], [x - 16, y + 28]]); solid(ctx, '#e8323a');
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 40, 12, 80); ctx.restore();
    poly(ctx, [[x - 16, y - 28], [x + 46, y], [x - 16, y + 28]]); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  } else if (id === 'crystal') {
    poly(ctx, [[x - 12, y], [x + 18, y - 28], [x + 64, y], [x + 18, y + 28]]); solid(ctx, '#9ff3ff');
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 64, y); ctx.moveTo(x + 18, y - 28); ctx.lineTo(x + 30, y); ctx.lineTo(x + 18, y + 28); ctx.lineWidth = 3; ctx.strokeStyle = '#3aa8c8'; ctx.stroke();
  } else if (id === 'icebreaker') {
    poly(ctx, [[x - 18, y - 44], [x + 44, y], [x - 18, y + 44]]); solid(ctx, STEEL);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ffd23f';
    for (let i = -60; i < 60; i += 24) { poly(ctx, [[x - 20, y + i], [x + 50, y + i + 30], [x + 50, y + i + 42], [x - 20, y + i + 12]]); ctx.fill(); }
    ctx.restore();
    poly(ctx, [[x - 18, y - 44], [x + 44, y], [x - 18, y + 44]]); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  } else if (id === 'unicorn') {
    const bx = x - 34, by = y - 26, tx = x + 36, ty = y - 104;
    poly(ctx, [[bx - 13, by + 4], [tx, ty], [bx + 13, by - 4]]);
    ctx.save(); ctx.clip();
    for (let i = 0; i < 6; i++) { const f0 = i / 6, f1 = (i + 1) / 6; poly(ctx, [[bx + (tx - bx) * f0 - 40, by + (ty - by) * f0 + 10], [bx + (tx - bx) * f1 - 40, by + (ty - by) * f1 + 10], [bx + (tx - bx) * f1 + 40, by + (ty - by) * f1 - 10], [bx + (tx - bx) * f0 + 40, by + (ty - by) * f0 - 10]]); ctx.fillStyle = RAINBOW[i]!; ctx.fill(); }
    ctx.restore();
    poly(ctx, [[bx - 13, by + 4], [tx, ty], [bx + 13, by - 4]]); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  }
}
export function glowNose(ctx: C, l: SubLook, N: P, t: number) {
  if (l.nose === 'crystal') halo(ctx, N.x + 24, N.y, 44 + Math.sin(t * 3) * 4, '#7ff7ff');
  if (l.nose === 'unicorn') halo(ctx, N.x + 36, N.y - 104, 18 + Math.sin(t * 4) * 3, '#ffb0f0');
}

// ---------- tails ----------

function propeller(ctx: C, x: number, y: number, size: number, l: SubLook, t: number) {
  ctx.fillStyle = DARK_STEEL; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.rect(x + 4, y - 6, 16, 12); ctx.fill(); ctx.stroke();
  const n = 2 + Math.min(4, l.motor), spin = t * (8 + l.motor * 3);
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2, h = Math.cos(a) * size;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2, 6, Math.abs(h) / 2 + 2, 0, 0, Math.PI * 2); ctx.fillStyle = STEEL; ctx.fill(); ctx.stroke();
  }
}
function flame(ctx: C, x: number, y: number, len: number, half: number, t: number, outer: string, inner: string) {
  const f = len * (0.85 + Math.sin(t * 23 + y) * 0.15);
  poly(ctx, [[x, y - half], [x - f, y], [x, y + half]]); ctx.fillStyle = outer; ctx.fill();
  poly(ctx, [[x, y - half * 0.5], [x - f * 0.6, y], [x, y + half * 0.5]]); ctx.fillStyle = inner; ctx.fill();
}
export function drawTail(ctx: C, l: SubLook, T: P, t: number) {
  const id = l.tail, { x, y } = T;
  if (id === 'prop') propeller(ctx, x - 18, y, 30, l, t);
  else if (id === 'twin') { propeller(ctx, x - 16, y - 18, 20, l, t); propeller(ctx, x - 16, y + 18, 20, l, t); }
  else if (id === 'ring') {
    propeller(ctx, x - 22, y, 28, l, t);
    ctx.beginPath(); ctx.ellipse(x - 22, y, 11, 38, 0, 0, 7); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = DARK_STEEL; ctx.stroke();
  } else if (id === 'fish' || id === 'mermaid') {
    const mer = id === 'mermaid', c = mer ? '#3ad0c0' : l.paint;
    ctx.save(); ctx.translate(x + 4, y); ctx.rotate(Math.sin(t * 6) * 0.16);
    ctx.beginPath(); ctx.moveTo(6, -14);
    if (mer) { ctx.lineTo(-30, -10); ctx.quadraticCurveTo(-56, -44, -70, -40); ctx.quadraticCurveTo(-54, 0, -70, 40); ctx.quadraticCurveTo(-56, 44, -30, 10); }
    else { ctx.lineTo(-44, -40); ctx.quadraticCurveTo(-30, 0, -44, 40); }
    ctx.lineTo(6, 14); ctx.closePath(); solid(ctx, c);
    if (mer) { ctx.save(); ctx.clip(); ctx.lineWidth = 2; ctx.strokeStyle = '#9ffff0'; for (let sx = -2; sx > -40; sx -= 10) for (let sy = -12; sy <= 12; sy += 10) { ctx.beginPath(); ctx.arc(sx, sy, 6, 0.5 * Math.PI, 1.5 * Math.PI); ctx.stroke(); } ctx.restore(); }
    ctx.restore();
  } else if (id === 'whale') {
    ctx.save(); ctx.translate(x + 4, y); ctx.rotate(Math.sin(t * 3) * 0.2);
    ctx.beginPath(); ctx.moveTo(4, -8); ctx.quadraticCurveTo(-30, -6, -54, -36); ctx.quadraticCurveTo(-38, 0, -54, 36); ctx.quadraticCurveTo(-30, 6, 4, 8); ctx.closePath(); solid(ctx, l.paint);
    ctx.restore();
  } else if (id === 'jet' || id === 'rainbowjet') {
    const hue = `hsl(${(t * 140) % 360} 100% 60%)`, hue2 = `hsl(${(t * 140 + 60) % 360} 100% 75%)`;
    flame(ctx, x - 32, y, 46, 13, t, id === 'jet' ? '#ff8a1a' : hue, id === 'jet' ? '#ffe95a' : hue2);
    poly(ctx, [[x + 4, y - 22], [x - 34, y - 15], [x - 34, y + 15], [x + 4, y + 22]]); solid(ctx, DARK_STEEL);
    ctx.beginPath(); ctx.ellipse(x - 34, y, 5, 15, 0, 0, 7); solid(ctx, '#3a3f47', 3);
  } else if (id === 'paddle') {
    const cx = x - 34, a0 = t * 2;
    ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(cx, y); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = a0 + (i / 6) * Math.PI * 2, px = cx + Math.cos(a) * 30, py = y + Math.sin(a) * 30;
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(px, py); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.beginPath(); rrect(ctx, -4, -10, 14, 20, 3); solid(ctx, '#e8323a', 3); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, y, 9, 0, 7); solid(ctx, '#ffd23f', 4);
  } else if (id === 'bubblejets') {
    for (const dy of [-18, 0, 18]) { ctx.beginPath(); rrect(ctx, x - 26, y + dy - 6, 32, 12, 4); solid(ctx, DARK_STEEL, 4); }
    for (let i = 0; i < 9; i++) {
      const f = ((t * 0.9 + i * 0.37) % 1), bx = x - 30 - f * 46, by = y + [-18, 0, 18][i % 3]! - f * 10;
      ctx.beginPath(); ctx.arc(bx, by, 3 + f * 6, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = '#cfefff'; ctx.stroke();
    }
  } else if (id === 'boosters') {
    for (const dy of [-24, 24]) {
      flame(ctx, x - 44, y + dy, 34, 9, t + dy, '#ff8a1a', '#ffe95a');
      ctx.beginPath(); rrect(ctx, x - 46, y + dy - 11, 60, 22, 9); solid(ctx, '#f4f4f0', 4);
      ctx.fillStyle = '#e8323a'; ctx.fillRect(x - 20, y + dy - 9, 10, 18);
    }
  }
}
export function glowTail(ctx: C, l: SubLook, T: P, t: number) {
  const { x, y } = T;
  if (l.tail === 'jet') halo(ctx, x - 56, y, 36 + Math.sin(t * 20) * 4, '#ff8a1a');
  if (l.tail === 'rainbowjet') halo(ctx, x - 56, y, 40, '#ff9ae0');
  if (l.tail === 'boosters') for (const dy of [-24, 24]) halo(ctx, x - 62, y + dy, 30 + Math.sin(t * 20 + dy) * 4, '#ff8a1a');
}

// ---------- fins ----------

export interface FinRoot { readonly x: number; readonly up: number; readonly down: number }
/** One fin at (x, y), s -1 above, 1 below. */
function fin(ctx: C, l: SubLook, x: number, y: number, s: number, t: number) {
  const id = l.fins, at = (dx: number, dy: number) => [x + dx, y + s * dy] as const;
  if (id === 'little') { poly(ctx, [at(0, 0), at(-28, 24), at(-16, -4)]); solid(ctx, l.paint, 6); }
  else if (id === 'big' || id === 'gold' || id === 'glow') {
    poly(ctx, [at(4, 0), at(-46, 46), at(-56, 44), at(-30, -6)]);
    if (id === 'gold') { const g = ctx.createLinearGradient(x, y, x - 50, y + s * 46); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#c8960a'); solid(ctx, g, 6); }
    else solid(ctx, id === 'glow' ? '#123a4a' : l.paint, 6);
    if (id === 'glow') { ctx.lineWidth = 3; ctx.strokeStyle = '#7ff7ff'; ctx.stroke(); }
  } else if (id === 'round') { ctx.beginPath(); ctx.ellipse(x - 16, y + s * 18, 24, 13, s * 0.7, 0, 7); solid(ctx, l.paint, 6); }
  else if (id === 'wing') { poly(ctx, [at(8, 0), at(-48, 30), at(-64, 30), at(-36, -4)]); solid(ctx, l.paint, 6); }
  else if (id === 'spiky') { poly(ctx, [at(2, 0), at(-10, 32), at(-18, 18), at(-28, 40), at(-34, 22), at(-46, 38), at(-36, -4)]); solid(ctx, l.paint, 5); }
  else if (id === 'shark') {
    const k = s < 0 ? 1 : 0.55;
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.quadraticCurveTo(x - 4 * k, y + s * 50 * k, x - 34 * k, y + s * 68 * k); ctx.quadraticCurveTo(x - 22 * k, y + s * 26 * k, x - 30, y); ctx.closePath(); solid(ctx, l.paint, 6);
  } else if (id === 'ray') {
    const flap = Math.sin(t * 3) * 8;
    ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.quadraticCurveTo(x - 8, y + s * (58 + flap), x - 64, y + s * (52 + flap)); ctx.quadraticCurveTo(x - 38, y + s * 18, x - 34, y); ctx.closePath(); solid(ctx, l.paint, 6);
  } else if (id === 'butterfly') {
    const flap = 1 + Math.sin(t * 5) * 0.08;
    const lobes: readonly (readonly [number, number, number, number, number, string])[] = [[-38, 22, 13, 18, -0.9, '#9a5aff'], [-14, 28, 17, 26, -0.4, '#ff6fb5']];
    for (const [dx, dy, rx, ry, a, c] of lobes) {
      ctx.beginPath(); ctx.ellipse(x + dx, y + s * dy * flap, rx, ry, s * a, 0, 7); solid(ctx, c, 5);
      dot(ctx, x + dx, y + s * dy * flap, 4, '#ffffff');
    }
  } else if (id === 'dragon') {
    ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x - 14, y + s * 76);
    ctx.quadraticCurveTo(x - 22, y + s * 48, x - 36, y + s * 56); ctx.quadraticCurveTo(x - 40, y + s * 34, x - 56, y + s * 36); ctx.quadraticCurveTo(x - 50, y + s * 14, x - 34, y);
    ctx.closePath(); solid(ctx, l.paint2 ?? l.paint, 5);
    ctx.beginPath(); for (const [dx, dy] of [[-36, 56], [-56, 36]] as const) { ctx.moveTo(x - 6, y + s * 6); ctx.lineTo(x + dx, y + s * dy); } ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
}
export function drawFins(ctx: C, l: SubLook, F: FinRoot, t: number) { fin(ctx, l, F.x, F.up, -1, t); fin(ctx, l, F.x, F.down, 1, t); }
export function glowFins(ctx: C, l: SubLook, F: FinRoot, t: number) {
  if (l.fins !== 'glow') return;
  ctx.save(); ctx.shadowColor = '#7ff7ff'; ctx.shadowBlur = 14; ctx.lineWidth = 5; ctx.strokeStyle = `rgba(127,247,255,${(0.75 + Math.sin(t * 3) * 0.25).toFixed(2)})`;
  for (const [y, s] of [[F.up, -1], [F.down, 1]] as const) { const at = (dx: number, dy: number) => [F.x + dx, y + s * dy] as const; poly(ctx, [at(4, 0), at(-46, 46), at(-56, 44), at(-30, -6)]); ctx.stroke(); }
  ctx.restore();
}

// ---------- tops ----------

/** Where the sonar dish and the camera go: on top of a top that has room for them (`deck`, its height), else on the body beside it. */
export function topDeck(id: string): number | null {
  return ({ tower: 44, tall: 76, flag: 44, antenna: 44, castle: 50 } as Record<string, number>)[id] ?? null;
}
function tower(ctx: C, l: SubLook, x: number, y: number, h: number, w = 64) {
  ctx.beginPath(); rrect(ctx, x - w / 2, y - h, w, h + 12, 12); solid(ctx, l.paint, 6);
  ctx.beginPath(); ctx.moveTo(x - 4, y - h); ctx.lineTo(x - 4, y - h - 18); ctx.lineTo(x + 16, y - h - 18); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
}
export function drawTop(ctx: C, l: SubLook, P: P, t: number) {
  const id = l.top, { x, y } = P;
  if (id === 'tower') tower(ctx, l, x, y, 44);
  else if (id === 'tall') { tower(ctx, l, x, y, 76, 54); ctx.beginPath(); ctx.moveTo(x - 18, y - 76); ctx.lineTo(x - 18, y - 92); ctx.lineTo(x - 32, y - 92); ctx.lineWidth = 6; ctx.stroke(); }
  else if (id === 'hatch') {
    ctx.beginPath(); ctx.ellipse(x, y, 24, 20, 0, Math.PI, 0); ctx.closePath(); solid(ctx, l.paint, 5);
    ctx.beginPath(); ctx.moveTo(x - 2, y - 20); ctx.lineTo(x - 2, y - 40); ctx.lineTo(x + 14, y - 40); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  } else if (id === 'dome') {
    ctx.beginPath(); ctx.arc(x, y + 6, 32, Math.PI, 0); ctx.closePath(); solid(ctx, '#bfefffdd', 5);
    ctx.beginPath(); ctx.arc(x - 8, y - 8, 14, Math.PI * 1.1, Math.PI * 1.5); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffffcc'; ctx.stroke();
  } else if (id === 'flag') {
    tower(ctx, l, x, y, 44);
    ctx.beginPath(); ctx.moveTo(x + 2, y - 44); ctx.lineTo(x + 2, y - 104); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y - 104);
    for (let i = 0; i <= 6; i++) ctx.lineTo(x + 2 + i * 7, y - 104 + Math.sin(t * 6 + i) * 3);
    for (let i = 6; i >= 0; i--) ctx.lineTo(x + 2 + i * 7, y - 80 + Math.sin(t * 6 + i) * 3);
    ctx.closePath(); solid(ctx, '#e8323a', 4);
  } else if (id === 'nest') {
    ctx.beginPath(); rrect(ctx, x - 24, y - 22, 48, 34, 10); solid(ctx, l.paint, 5);
    ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 96); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#a8703a'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 24, y - 96); ctx.lineTo(x + 24, y - 96); ctx.lineTo(x + 18, y - 76); ctx.lineTo(x - 18, y - 76); ctx.closePath(); solid(ctx, '#a8703a', 5);
    ctx.beginPath(); for (let i = -12; i <= 12; i += 8) { ctx.moveTo(x + i, y - 95); ctx.lineTo(x + i * 0.8, y - 77); } ctx.lineWidth = 2; ctx.stroke();
  } else if (id === 'antenna') {
    tower(ctx, l, x, y, 44);
    ctx.beginPath(); ctx.moveTo(x + 6, y - 44); ctx.lineTo(x + 6, y - 112); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (const h of [70, 88]) { ctx.beginPath(); ctx.moveTo(x - 8, y - h); ctx.lineTo(x + 20, y - h); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x + 6, y - 116, 7, 0, 7); solid(ctx, Math.sin(t * 5) > 0 ? '#ff4a4a' : '#8a2020', 3);
  } else if (id === 'castle') {
    ctx.beginPath(); ctx.moveTo(x - 34, y + 10); ctx.lineTo(x - 34, y - 62);
    for (let i = 0; i < 4; i++) { const bx = x - 34 + i * 20; ctx.lineTo(bx + 10, y - 62); ctx.lineTo(bx + 10, y - 50); ctx.lineTo(bx + 20, y - 50); ctx.lineTo(bx + 20, y - 62); }
    ctx.lineTo(x + 34, y - 62); ctx.lineTo(x + 34, y + 10); ctx.closePath(); solid(ctx, '#b9c2cc', 5);
    ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 10, y - 22); ctx.arc(x, y - 22, 10, Math.PI, 0); ctx.lineTo(x + 10, y - 4); solid(ctx, '#5a3a24', 4);
    ctx.lineWidth = 2; ctx.strokeStyle = '#7a8692'; ctx.beginPath(); ctx.moveTo(x - 34, y - 34); ctx.lineTo(x + 34, y - 34); ctx.stroke();
  } else if (id === 'lighthouse') {
    ctx.beginPath(); ctx.moveTo(x - 22, y + 10); ctx.lineTo(x - 15, y - 64); ctx.lineTo(x + 15, y - 64); ctx.lineTo(x + 22, y + 10); ctx.closePath();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 30, y - 70, 60, 90); ctx.fillStyle = '#e8323a'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 30, y - 60 + i * 20, 60, 10); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); rrect(ctx, x - 14, y - 86, 28, 22, 4); solid(ctx, '#fff6a8', 4);
    poly(ctx, [[x - 18, y - 86], [x, y - 104], [x + 18, y - 86]]); solid(ctx, '#e8323a', 4);
  } else if (id === 'party') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.12);
    poly(ctx, [[-26, 8], [0, -74], [26, 8]]); solid(ctx, '#ff6fb5', 5);
    ctx.save(); ctx.clip(); for (const [dx, dy, c] of [[-8, -10, '#ffd23f'], [8, -28, '#3ae0f0'], [-2, -50, '#8fe03a'], [12, -2, '#9a5aff']] as const) dot(ctx, dx, dy, 6, c); ctx.restore();
    ctx.beginPath(); ctx.arc(0, -78, 10, 0, 7); solid(ctx, '#ffd23f', 4);
    ctx.restore();
  } else if (id === 'crown') {
    poly(ctx, [[x - 36, y + 8], [x - 36, y - 40], [x - 18, y - 20], [x, y - 52], [x + 18, y - 20], [x + 36, y - 40], [x + 36, y + 8]]); solid(ctx, '#ffd23f', 5);
    for (const [dx, dy, c] of [[-36, -40, '#e8323a'], [0, -52, '#2a6bff'], [36, -40, '#8fe03a'], [-14, -6, '#e8323a'], [14, -6, '#2a6bff']] as const) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 5, 0, 7); solid(ctx, c, 2); }
  }
}
export function glowTop(ctx: C, l: SubLook, P: P, t: number) {
  const { x, y } = P;
  if (l.top === 'antenna' && Math.sin(t * 5) > 0) halo(ctx, x + 6, y - 116, 26, '#ff4a4a');
  if (l.top === 'lighthouse') {
    halo(ctx, x, y - 75, 30, '#fff6a8');
    const a = t * 2, len = 130, w = 0.18; // the lamp's beam going round
    if (Math.cos(a) > -0.2) { ctx.beginPath(); ctx.moveTo(x, y - 75); ctx.lineTo(x + Math.cos(a) * len * Math.sign(Math.cos(a) || 1), y - 75 - len * w); ctx.lineTo(x + Math.cos(a) * len * Math.sign(Math.cos(a) || 1), y - 75 + len * w); ctx.closePath(); ctx.fillStyle = 'rgba(255,246,168,0.35)'; ctx.fill(); }
  }
}
