// His submarine, drawn in code from what's fitted (dock/dock.ts lookOf): which submarine it is, its nose, tail, fins and top (drawn in
// art/pieces.ts), its paint and pattern, glow stripes, the buddy in the big window, and the parts he has bought, each showing as it
// gets better (a bigger headlight, a bigger sonar dish, more propeller blades, a longer claw, bands on a stronger hull, a camera).
// Drawn about its middle, facing right. `glow` draws only what shines (the headlight, the glow stripes and any glowing piece), for the
// Dive to lay over the dark.
//
// Each submarine is a Frame: its body's outline and the points where every piece joins it, so every nose, tail, fin and top fits every
// submarine. The Explorer Sub is the one he started with, drawn as before.
import type { SubLook } from '../dock/dock';
import type { SubId } from '../dock/subs';
import { drawFins, drawNose, drawTail, drawTop, glowFins, glowNose, glowTail, glowTop, halo, INK, rrect, solid, topDeck, type FinRoot, type P } from './pieces';

export { rrect } from './pieces';
type C = CanvasRenderingContext2D;

interface Frame {
  /** The body's outline (a path, not yet filled). */
  body(ctx: C): void;
  /** Where the paint's patterns go: they are drawn for the Explorer's 104 × 48 body and stretched to this one. */
  readonly box: { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number };
  readonly light: P; readonly nose: P; readonly tail: P; readonly top: P; readonly fin: FinRoot; readonly claw: P;
  readonly window: { readonly x: number; readonly y: number; readonly r: number };
  readonly ports: readonly P[];
  /** What it has of its own, under the body (a shark's fin, a turtle's head) and over it (eyes, a smile, a beak). */
  back?(ctx: C, l: SubLook, t: number): void;
  front?(ctx: C, l: SubLook, t: number): void;
  glow?(ctx: C, l: SubLook, t: number): void;
}

const ellipse = (x: number, y: number, rx: number, ry: number) => (ctx: C) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); };
const eye = (ctx: C, x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.55, 0, 7); ctx.fillStyle = INK; ctx.fill(); };
const smile = (ctx: C, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke(); };

const FRAMES: Record<SubId, Frame> = {
  explorer: {
    body: ellipse(0, 0, 104, 48), box: { x: 0, y: 0, rx: 104, ry: 48 },
    light: { x: 98, y: -4 }, nose: { x: 104, y: 0 }, tail: { x: -100, y: 0 }, top: { x: -2, y: -40 }, fin: { x: -84, up: -10, down: 10 }, claw: { x: 36, y: 40 },
    window: { x: 28, y: -6, r: 26 }, ports: [{ x: -62, y: -6 }, { x: -28, y: -6 }],
  },
  mini: {
    body: ellipse(0, 0, 80, 44), box: { x: 0, y: 0, rx: 80, ry: 44 },
    light: { x: 74, y: -2 }, nose: { x: 80, y: 0 }, tail: { x: -76, y: 0 }, top: { x: -6, y: -36 }, fin: { x: -62, up: -8, down: 8 }, claw: { x: 26, y: 36 },
    window: { x: 16, y: -4, r: 24 }, ports: [{ x: -40, y: -4 }],
  },
  duck: {
    body(ctx) { ctx.beginPath(); ctx.ellipse(-6, 14, 102, 40, 0, 0, Math.PI * 2); ctx.moveTo(98, -38); ctx.arc(66, -38, 32, 0, Math.PI * 2); },
    box: { x: -6, y: 10, rx: 102, ry: 46 },
    light: { x: 88, y: 20 }, nose: { x: 96, y: 18 }, tail: { x: -106, y: 14 }, top: { x: -34, y: -22 }, fin: { x: -82, up: -4, down: 34 }, claw: { x: 30, y: 52 },
    window: { x: 14, y: 12, r: 24 }, ports: [{ x: -50, y: 14 }],
    back(ctx, l) { ctx.beginPath(); ctx.moveTo(-92, -6); ctx.lineTo(-126, -40); ctx.lineTo(-114, -6); ctx.lineTo(-104, 6); ctx.closePath(); solid(ctx, l.paint, 6); },
    front(ctx) {
      ctx.beginPath(); ctx.moveTo(94, -46); ctx.quadraticCurveTo(130, -44, 128, -32); ctx.quadraticCurveTo(120, -22, 94, -28); ctx.closePath(); solid(ctx, '#ff8a1a', 5);
      eye(ctx, 72, -48, 7);
    },
  },
  bubble: {
    body: ellipse(0, 0, 66, 66), box: { x: 0, y: 0, rx: 70, ry: 66 },
    light: { x: 58, y: 24 }, nose: { x: 66, y: 0 }, tail: { x: -64, y: 0 }, top: { x: 0, y: -60 }, fin: { x: -46, up: -34, down: 34 }, claw: { x: 20, y: 60 },
    window: { x: 6, y: -8, r: 36 }, ports: [],
    front(ctx) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ctx.beginPath(); ctx.arc(6 + Math.cos(a) * 44, -8 + Math.sin(a) * 44, 3.5, 0, 7); ctx.fillStyle = '#3a3f47'; ctx.fill(); } },
  },
  torpedo: {
    body(ctx) {
      ctx.beginPath(); ctx.moveTo(-112, -34); ctx.lineTo(70, -34); ctx.quadraticCurveTo(128, -30, 140, 0); ctx.quadraticCurveTo(128, 30, 70, 34);
      ctx.lineTo(-112, 34); ctx.quadraticCurveTo(-130, 34, -130, 0); ctx.quadraticCurveTo(-130, -34, -112, -34); ctx.closePath();
    },
    box: { x: 5, y: 0, rx: 135, ry: 36 },
    light: { x: 124, y: -2 }, nose: { x: 140, y: 0 }, tail: { x: -128, y: 0 }, top: { x: -20, y: -28 }, fin: { x: -108, up: -8, down: 8 }, claw: { x: 40, y: 30 },
    window: { x: 58, y: -4, r: 22 }, ports: [{ x: -80, y: -4 }, { x: -48, y: -4 }, { x: -16, y: -4 }],
  },
  turtle: {
    body(ctx) { ctx.beginPath(); ctx.ellipse(0, 14, 96, 34, 0, 0, Math.PI * 2); ctx.moveTo(-84, 10); ctx.bezierCurveTo(-72, -66, 58, -66, 78, 10); ctx.closePath(); },
    box: { x: 0, y: -6, rx: 98, ry: 56 },
    light: { x: 112, y: 4 }, nose: { x: 122, y: 4 }, tail: { x: -96, y: 14 }, top: { x: -4, y: -46 }, fin: { x: -74, up: -6, down: 34 }, claw: { x: 14, y: 46 },
    window: { x: 40, y: 22, r: 18 }, ports: [{ x: -34, y: 24 }, { x: -4, y: 24 }],
    back(ctx) {
      for (const [x, a] of [[56, 0.5], [-58, -0.4]] as const) { ctx.beginPath(); ctx.ellipse(x, 48, 30, 12, a, 0, 7); solid(ctx, '#8acb6a', 5); }
      ctx.beginPath(); ctx.arc(100, 2, 24, 0, 7); solid(ctx, '#8acb6a', 6);
      eye(ctx, 106, -6, 6); smile(ctx, 104, 12, 114, 18, 122, 10);
    },
    front(ctx) { // the shell's plates
      ctx.save(); ctx.beginPath(); ctx.moveTo(-84, 10); ctx.bezierCurveTo(-72, -66, 58, -66, 78, 10); ctx.closePath(); ctx.clip();
      ctx.lineWidth = 3; ctx.strokeStyle = '#00000044';
      for (const [x, y] of [[-46, -18], [-4, -30], [38, -18], [-26, 4], [18, 4]] as const) { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 14); } ctx.stroke(); }
      ctx.restore();
    },
  },
  manta: {
    body: ellipse(0, 0, 108, 30), box: { x: 0, y: 0, rx: 108, ry: 32 },
    light: { x: 102, y: 0 }, nose: { x: 108, y: 0 }, tail: { x: -106, y: 0 }, top: { x: 36, y: -24 }, fin: { x: -90, up: -6, down: 6 }, claw: { x: 44, y: 26 },
    window: { x: 62, y: -2, r: 18 }, ports: [{ x: -36, y: -2 }, { x: -8, y: -2 }],
    back(ctx, l, t) {
      const flap = 1 + Math.sin(t * 2.4) * 0.12;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(24, s * 22); ctx.quadraticCurveTo(-14, s * 70 * flap, -74, s * 96 * flap); ctx.quadraticCurveTo(-46, s * 46, -62, s * 20); ctx.closePath(); solid(ctx, l.paint, 6);
        ctx.beginPath(); ctx.ellipse(108, s * 16, 16, 7, s * 0.5, 0, 7); solid(ctx, l.paint, 4);
      }
    },
  },
  whale: {
    body(ctx) {
      ctx.beginPath(); ctx.moveTo(110, -6); ctx.bezierCurveTo(110, -50, 60, -58, 0, -54); ctx.bezierCurveTo(-60, -50, -100, -24, -116, -6); ctx.lineTo(-116, 6);
      ctx.bezierCurveTo(-90, 30, -40, 50, 20, 50); ctx.bezierCurveTo(80, 50, 110, 34, 110, -6); ctx.closePath();
    },
    box: { x: 0, y: 0, rx: 112, ry: 54 },
    light: { x: 104, y: 2 }, nose: { x: 110, y: 0 }, tail: { x: -114, y: 0 }, top: { x: -6, y: -48 }, fin: { x: -92, up: -12, down: 14 }, claw: { x: 30, y: 46 },
    window: { x: 30, y: -14, r: 24 }, ports: [{ x: -38, y: -10 }],
    front(ctx) { eye(ctx, 78, -22, 6); smile(ctx, 106, 18, 84, 32, 54, 26); },
  },
  shark: {
    body(ctx) {
      ctx.beginPath(); ctx.moveTo(136, 6); ctx.quadraticCurveTo(110, -40, 30, -44); ctx.quadraticCurveTo(-60, -46, -118, -6); ctx.lineTo(-118, 6);
      ctx.quadraticCurveTo(-60, 40, 30, 42); ctx.quadraticCurveTo(110, 42, 136, 6); ctx.closePath();
    },
    box: { x: 6, y: 0, rx: 126, ry: 44 },
    light: { x: 126, y: 4 }, nose: { x: 134, y: 6 }, tail: { x: -116, y: 0 }, top: { x: -80, y: -26 }, fin: { x: -98, up: -10, down: 10 }, claw: { x: 40, y: 40 },
    window: { x: 38, y: -8, r: 24 }, ports: [{ x: -14, y: -6 }],
    back(ctx, l) { ctx.beginPath(); ctx.moveTo(-26, -40); ctx.quadraticCurveTo(-30, -76, -52, -104); ctx.quadraticCurveTo(8, -74, 26, -42); ctx.closePath(); solid(ctx, l.paint, 6); },
    front(ctx) {
      eye(ctx, 98, -14, 6);
      ctx.beginPath(); for (const x of [68, 78, 88]) { ctx.moveTo(x, -16); ctx.quadraticCurveTo(x - 6, 0, x, 16); } ctx.lineWidth = 3; ctx.strokeStyle = '#00000066'; ctx.stroke();
      smile(ctx, 128, 18, 116, 28, 100, 22);
    },
  },
  angler: {
    body: ellipse(0, 0, 92, 64), box: { x: 0, y: 0, rx: 92, ry: 64 },
    light: { x: 86, y: -10 }, nose: { x: 92, y: -4 }, tail: { x: -90, y: 0 }, top: { x: -30, y: -56 }, fin: { x: -74, up: -26, down: 26 }, claw: { x: 20, y: 60 },
    window: { x: 6, y: -14, r: 28 }, ports: [{ x: -50, y: -8 }],
    back(ctx, _l, t) {
      const bx = 124 + Math.sin(t * 2) * 4, by = -96 + Math.cos(t * 2) * 3;
      ctx.beginPath(); ctx.moveTo(34, -56); ctx.quadraticCurveTo(84, -134, bx, by); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by + 8, 11, 0, 7); solid(ctx, '#fff6a8', 4);
    },
    front(ctx) {
      ctx.beginPath(); ctx.moveTo(90, 14); ctx.quadraticCurveTo(70, 44, 34, 40); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
      for (const [x, y] of [[80, 26], [66, 35], [50, 39]] as const) { ctx.beginPath(); ctx.moveTo(x - 5, y - 2); ctx.lineTo(x, y + 7); ctx.lineTo(x + 5, y - 1); ctx.closePath(); solid(ctx, '#ffffff', 2); }
      eye(ctx, 60, -34, 9);
    },
    glow(ctx, _l, t) { halo(ctx, 124 + Math.sin(t * 2) * 4, -88 + Math.cos(t * 2) * 3, 34 + Math.sin(t * 3) * 4, '#fff27a'); },
  },
  octo: {
    body: ellipse(0, -10, 88, 56), box: { x: 0, y: -10, rx: 88, ry: 56 },
    light: { x: 84, y: -10 }, nose: { x: 88, y: -10 }, tail: { x: -86, y: -10 }, top: { x: -8, y: -62 }, fin: { x: -70, up: -36, down: 14 }, claw: { x: 44, y: 38 },
    window: { x: 16, y: -18, r: 28 }, ports: [{ x: -44, y: -18 }],
    back(ctx, l, t) {
      for (let i = 0; i < 6; i++) {
        const x = -64 + i * 24, w = Math.sin(t * 3 + i) * 12;
        ctx.beginPath(); ctx.moveTo(x, 26); ctx.bezierCurveTo(x - 4, 60, x + w, 72, x - 12 + w, 92);
        ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = l.paint; ctx.stroke();
      }
    },
  },
  dragon: {
    body(ctx) { ctx.beginPath(); ctx.ellipse(-6, 0, 104, 40, 0, 0, Math.PI * 2); ctx.moveTo(80, -24); ctx.quadraticCurveTo(140, -20, 140, 4); ctx.quadraticCurveTo(136, 26, 84, 24); ctx.closePath(); },
    box: { x: 4, y: 0, rx: 114, ry: 42 },
    light: { x: 132, y: 6 }, nose: { x: 140, y: 4 }, tail: { x: -108, y: 0 }, top: { x: -24, y: -34 }, fin: { x: -92, up: -10, down: 10 }, claw: { x: 30, y: 38 },
    window: { x: 26, y: -4, r: 24 }, ports: [{ x: -44, y: -2 }],
    back(ctx, l) {
      const c = l.paint2 ?? '#ffd23f';
      for (const x of [-96, -78, -60, 6, 24, 42, 60]) { const y = -40 * Math.sqrt(Math.max(0, 1 - ((x + 6) / 104) ** 2)); ctx.beginPath(); ctx.moveTo(x - 9, y + 6); ctx.lineTo(x, y - 20); ctx.lineTo(x + 9, y + 6); ctx.closePath(); solid(ctx, c, 4); }
      for (const dx of [0, 14]) { ctx.beginPath(); ctx.moveTo(88 + dx, -22); ctx.quadraticCurveTo(80 + dx, -40, 70 + dx, -52); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#f4ecd8'; ctx.stroke(); }
    },
    front(ctx) { eye(ctx, 104, -12, 7); ctx.beginPath(); ctx.arc(132, -6, 3, 0, 7); ctx.fillStyle = INK; ctx.fill(); smile(ctx, 136, 14, 120, 22, 100, 16); },
  },
};
export const frameOf = (l: SubLook): Frame => FRAMES[l.kind] ?? FRAMES.explorer;

function paintPattern(ctx: C, l: SubLook, F: Frame, t: number) {
  const p = l.pattern, c2 = l.paint2 ?? '#fff';
  ctx.save(); F.body(ctx); ctx.clip();
  ctx.fillStyle = l.paint; ctx.fillRect(-200, -200, 400, 400);
  ctx.save(); ctx.translate(F.box.x, F.box.y); ctx.scale(F.box.rx / 104, F.box.ry / 48);
  const spot = (x: number, y: number, r: number, c: string) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = c; ctx.fill(); };
  if (p === 'stripes') for (let x = -110; x < 110; x += 36) { ctx.fillStyle = c2; ctx.fillRect(x, -60, 14, 120); }
  if (p === 'spots') for (const [x, y, r] of [[-60, -20, 12], [-20, 18, 10], [30, -24, 11], [60, 20, 9], [-80, 24, 8], [0, -6, 7]] as const) spot(x, y, r, c2);
  if (p === 'checks') for (let x = -112; x < 112; x += 20) for (let y = -56; y < 56; y += 20) if (((x + 112) / 20 + (y + 56) / 20) % 2 === 0) { ctx.fillStyle = c2; ctx.fillRect(x, y, 20, 20); }
  if (p === 'zigzag') { ctx.beginPath(); for (let x = -110; x <= 110; x += 20) ctx.lineTo(x, (x / 20) % 2 ? -8 : 10); ctx.lineWidth = 12; ctx.strokeStyle = c2; ctx.stroke(); }
  if (p === 'scales') for (let y = -50; y < 50; y += 16) for (let x = -110 + (y % 32 ? 8 : 0); x < 110; x += 16) { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = c2; ctx.stroke(); }
  if (p === 'rainbow') ['#e8323a', '#ff8a1a', '#ffd23f', '#8fe03a', '#3ae0f0', '#9a5aff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-120, -60 + i * 20, 240, 20); });
  if (p === 'galaxy') for (let i = 0; i < 26; i++) { const x = ((i * 73) % 220) - 110, y = ((i * 41) % 100) - 50; ctx.fillStyle = i % 3 ? c2 : '#ff9ae0'; ctx.fillRect(x, y, 3 + (i % 3), 3 + (i % 3)); }
  if (p === 'chrome') { const g = ctx.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, l.paint); g.addColorStop(0.5, c2); g.addColorStop(1, l.paint); ctx.fillStyle = g; ctx.fillRect(-120, -60, 240, 120); }
  if (p === 'shark') { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(10, 30, 100, 26, 0, 0, Math.PI * 2); ctx.fill(); }
  if (p === 'belly') { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(10, 34, 104, 24, 0, 0, Math.PI * 2); ctx.fill(); }
  if (p === 'grooves') { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(10, 34, 104, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#00000030'; ctx.lineWidth = 3; for (let y = 18; y < 50; y += 8) { ctx.beginPath(); ctx.moveTo(-40, y); ctx.lineTo(90, y - 6); ctx.stroke(); } }
  if (p === 'nosecone') { ctx.fillStyle = c2; ctx.fillRect(74, -60, 60, 120); ctx.fillStyle = '#ffffff'; ctx.fillRect(66, -60, 8, 120); }
  if (p === 'polka') for (let y = -44; y <= 44; y += 22) for (let x = -100 + (y % 44 ? 11 : 0); x <= 100; x += 22) spot(x, y, 6, c2);
  if (p === 'camo') for (const [x, y, rx, ry] of [[-70, -20, 26, 14], [-20, 20, 30, 12], [30, -26, 24, 12], [70, 16, 22, 14], [-90, 28, 18, 10], [0, -6, 14, 8], [50, 40, 20, 8]] as const) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, x * 0.01, 0, 7); ctx.fillStyle = (x / 10) % 2 ? c2 : '#8a7a4a'; ctx.fill(); }
  if (p === 'tiger') { ctx.fillStyle = c2; for (let x = -100; x <= 100; x += 28) { ctx.beginPath(); ctx.moveTo(x - 6, -60); ctx.quadraticCurveTo(x + 10, -20, x - 2, 0); ctx.quadraticCurveTo(x + 6, -20, x + 6, -60); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 8, 60); ctx.quadraticCurveTo(x - 6, 26, x + 6, 12); ctx.quadraticCurveTo(x + 2, 30, x + 18, 60); ctx.fill(); } }
  if (p === 'candy') { ctx.fillStyle = c2; for (let x = -160; x < 140; x += 36) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x + 16, 60); ctx.lineTo(x + 76, -60); ctx.lineTo(x + 60, -60); ctx.closePath(); ctx.fill(); } }
  if (p === 'flames') { ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(110, -60); ctx.lineTo(110, 60); for (let i = 0; i <= 6; i++) { const y = 50 - i * 17; ctx.lineTo(-10 - (i % 2 ? 50 : 10) - Math.sin(t * 6 + i) * 4, y); ctx.lineTo(20, y - 8); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(60, 0, 40, 26, 0, 0, 7); ctx.fill(); }
  if (p === 'sunset') { const g = ctx.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#ffd23f'); g.addColorStop(0.5, l.paint); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(-120, -60, 240, 120); }
  if (p === 'starry') { for (let i = 0; i < 18; i++) { const x = ((i * 67) % 210) - 105, y = ((i * 37) % 96) - 48; spot(x, y, 1.5 + (i % 3), c2); } spot(-50, -22, 12, c2); spot(-44, -26, 11, l.paint); }
  if (p === 'lava') { ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.shadowColor = c2; ctx.shadowBlur = 8; ctx.beginPath(); for (const [x0, y0, x1, y1, x2, y2] of [[-100, -30, -50, -10, -20, -40], [-60, 30, -10, 10, 30, 36], [0, -40, 40, -10, 90, -30], [50, 40, 70, 10, 100, 20]] as const) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); } ctx.stroke(); ctx.shadowBlur = 0; }
  if (p === 'diamond') for (let x = -120; x < 120; x += 30) for (let y = -60; y < 60; y += 30) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 30); ctx.lineTo(x, y + 30); ctx.closePath(); ctx.fillStyle = ((x + y) / 30) % 2 ? '#ffffffaa' : '#9fd8ff88'; ctx.fill(); }
  ctx.restore();
  // a soft shine along the top, and the shade underneath
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.ellipse(F.box.x - 10, F.box.y - F.box.ry * 0.58, F.box.rx * 0.7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0000001c'; ctx.beginPath(); ctx.ellipse(F.box.x, F.box.y + F.box.ry * 0.85, F.box.rx, F.box.ry * 0.46, 0, 0, Math.PI * 2); ctx.fill();
  // a stronger hull shows its metal bands
  for (let i = 0; i < Math.min(3, l.hull); i++) { const x = F.box.x - F.box.rx * 0.58 + i * F.box.rx * 0.38; ctx.fillStyle = '#00000022'; ctx.fillRect(x - 3, -200, 6, 400); }
  ctx.restore();
}

/** The glow stripes: lines along the body that glow in the dark. */
function stripes(ctx: C, l: SubLook, F: Frame, t: number, glow: boolean) {
  const s = l.stripes;
  if (!s) return;
  ctx.save(); F.body(ctx); ctx.clip();
  ctx.translate(F.box.x, F.box.y); ctx.scale(F.box.rx / 104, F.box.ry / 48);
  const c = s.pattern === 'rainbow' ? `hsl(${(t * 90) % 360} 100% 65%)` : s.color;
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round'; ctx.lineWidth = glow ? 9 : 6;
  if (glow) { ctx.shadowColor = c; ctx.shadowBlur = 16; }
  const p = s.pattern;
  ctx.beginPath();
  if (p === 'band' || p === 'rainbow' || p === 'aurora') { ctx.moveTo(-100, 20); ctx.lineTo(100, 20); }
  if (p === 'double') { ctx.moveTo(-100, 14); ctx.lineTo(100, 14); ctx.moveTo(-100, 28); ctx.lineTo(100, 28); }
  if (p === 'wave') for (let x = -100; x <= 100; x += 5) ctx.lineTo(x, 22 + Math.sin(x / 12 + t * 2) * 7);
  if (p === 'zigzag') for (let x = -100; x <= 100; x += 16) ctx.lineTo(x, (x / 16) % 2 ? 14 : 30);
  if (p === 'bolt') { ctx.moveTo(-80, 26); ctx.lineTo(-20, 10); ctx.lineTo(-10, 28); ctx.lineTo(60, 12); }
  ctx.stroke();
  if (p === 'aurora') { ctx.beginPath(); for (let x = -100; x <= 100; x += 5) ctx.lineTo(x, 32 + Math.sin(x / 18 + t) * 5); ctx.strokeStyle = '#9a5aff'; ctx.stroke(); }
  const spot = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  if (p === 'dots' || p === 'portholes') for (let x = -84; x <= 84; x += 24) spot(x, 24, p === 'portholes' ? 6 : 5);
  if (p === 'sparkle') for (let i = 0; i < 9; i++) spot(-90 + i * 22, 18 + Math.sin(t * 5 + i) * 8, 3 + (Math.sin(t * 7 + i * 2) + 1) * 1.5);
  if (p === 'stars' || p === 'hearts') for (let x = -80; x <= 80; x += 32) { ctx.font = `900 ${glow ? 22 : 20}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p === 'stars' ? '★' : '♥', x, 24); }
  ctx.restore();
}

/** The claw under the belly, longer with each Rung. */
function claw(ctx: C, l: SubLook, at: P) {
  const len = 22 + l.claw * 8;
  ctx.save(); ctx.translate(at.x, at.y);
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, len); ctx.stroke();
  ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = 5; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(10, len); ctx.quadraticCurveTo(-4, len + 10, 2, len + 18); ctx.moveTo(10, len); ctx.quadraticCurveTo(24, len + 10, 18, len + 18); ctx.stroke();
  ctx.restore();
}

/** The sonar dish (bigger with each Rung) and, with a flash, the camera: on top of a tower, or on the body beside the top. */
function dishAndCamera(ctx: C, l: SubLook, F: Frame) {
  const deck = topDeck(l.top), P = F.top;
  const dish = deck !== null ? { x: P.x + 24, y: P.y - deck - 4 } : { x: P.x + 46, y: P.y - 4 };
  const cam = deck !== null ? { x: P.x - 28, y: P.y - deck - 16 } : { x: P.x - 58, y: P.y - 20 };
  const r = 8 + l.sonar * 2.2;
  ctx.save(); ctx.translate(dish.x, dish.y); ctx.rotate(-0.5); ctx.strokeStyle = INK;
  if (deck === null) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.lineWidth = 6; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -r * 0.4, r, r * 0.55, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#d8dee6'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
  if (l.flash > 0) {
    ctx.beginPath(); rrect(ctx, cam.x, cam.y, 22, deck !== null ? 16 : 24, 4); ctx.fillStyle = '#3a3f47'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(cam.x + 11, cam.y + 8, 4, 0, 7); ctx.fillStyle = '#bfe6ff'; ctx.fill();
  }
}

export function drawSub(ctx: C, l: SubLook, t = 0, glow = false) {
  const F = frameOf(l);
  ctx.save();
  ctx.lineJoin = 'round';
  if (glow) {
    stripes(ctx, l, F, t, true);
    const r = 14 + l.lights * 2;
    const g = ctx.createRadialGradient(F.light.x + 6, F.light.y, 0, F.light.x + 6, F.light.y, r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, l.beam); g.addColorStop(1, l.beam + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(F.light.x + 6, F.light.y, r * 2.2, 0, 7); ctx.fill();
    F.glow?.(ctx, l, t); glowNose(ctx, l, F.nose, t); glowTail(ctx, l, F.tail, t); glowFins(ctx, l, F.fin, t); glowTop(ctx, l, F.top, t);
    ctx.restore();
    return;
  }
  claw(ctx, l, F.claw);
  F.back?.(ctx, l, t);
  drawFins(ctx, l, F.fin, t);
  drawTail(ctx, l, F.tail, t);
  // the sonar dish and camera sit on top of a tower, and behind any other top
  const deck = topDeck(l.top) !== null;
  if (!deck) dishAndCamera(ctx, l, F);
  drawTop(ctx, l, F.top, t);
  if (deck) dishAndCamera(ctx, l, F);
  drawNose(ctx, l, F.nose, t, false);
  // the body
  paintPattern(ctx, l, F, t);
  F.body(ctx); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  stripes(ctx, l, F, t, false);
  if (l.pattern === 'shark' && l.kind === 'explorer') { // a friendly shark face on the nose: an eye and a smile with soft teeth
    ctx.beginPath(); ctx.arc(70, -18, 6, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.moveTo(56, 18); ctx.quadraticCurveTo(78, 30, 96, 14); ctx.lineWidth = 4; ctx.stroke();
  }
  F.front?.(ctx, l, t);
  // portholes, and the big window with his buddy in it
  for (const p of F.ports) { ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 7); ctx.fillStyle = '#9fe6ff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  const w = F.window;
  ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 7); ctx.fillStyle = '#bfefff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(w.x, w.y, w.r - 3, 0, 7); ctx.clip();
  ctx.font = `${Math.round(w.r * 1.15)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(l.buddy, w.x, w.y + 3 + Math.sin(t * 2) * 1.5);
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(w.x - w.r * 0.38, w.y - w.r * 0.46, w.r * 0.35, w.r * 0.2, -0.5, 0, 7); ctx.fill();
  ctx.restore();
  drawNose(ctx, l, F.nose, t, true);
  // the headlight, bigger with better Headlights
  const r = 9 + l.lights * 1.6;
  ctx.beginPath(); ctx.arc(F.light.x, F.light.y, r, 0, 7); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(F.light.x, F.light.y, r * 0.55, 0, 7); ctx.fillStyle = l.beam; ctx.fill();
  ctx.restore();
}
