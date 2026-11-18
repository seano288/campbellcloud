// His submarine, drawn in code from what's fitted (dock.ts lookOf): its paint and pattern, glow stripes, the buddy in the big front
// window, and the parts he has bought, each showing as it gets better (a bigger headlight, a bigger sonar dish on the tower, more
// propeller blades, a longer claw, bands on a stronger hull, a camera on top). Drawn about its middle, facing right, about 260 units
// wide. `glow` draws only what shines (the headlight and the glow stripes), for the Dive to lay over the dark.
import type { SubLook } from '../dock/dock';

const INK = '#141414';
type C = CanvasRenderingContext2D;
const BODY = { rx: 104, ry: 48 };

/** A rounded box (CanvasRenderingContext2D.roundRect is too new for an iPad left on iPadOS 15). */
export function rrect(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function body(ctx: C) { ctx.beginPath(); ctx.ellipse(0, 0, BODY.rx, BODY.ry, 0, 0, Math.PI * 2); }

function paintPattern(ctx: C, l: SubLook, t: number) {
  const p = l.pattern, c2 = l.paint2 ?? '#fff';
  ctx.save(); body(ctx); ctx.clip();
  ctx.fillStyle = l.paint; ctx.fillRect(-120, -60, 240, 120);
  if (p === 'stripes') for (let x = -110; x < 110; x += 36) { ctx.fillStyle = c2; ctx.fillRect(x, -60, 14, 120); }
  if (p === 'spots') for (const [x, y, r] of [[-60, -20, 12], [-20, 18, 10], [30, -24, 11], [60, 20, 9], [-80, 24, 8], [0, -6, 7]] as const) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = c2; ctx.fill(); }
  if (p === 'checks') for (let x = -112; x < 112; x += 20) for (let y = -56; y < 56; y += 20) if (((x + 112) / 20 + (y + 56) / 20) % 2 === 0) { ctx.fillStyle = c2; ctx.fillRect(x, y, 20, 20); }
  if (p === 'zigzag') { ctx.beginPath(); for (let x = -110; x <= 110; x += 20) ctx.lineTo(x, (x / 20) % 2 ? -8 : 10); ctx.lineWidth = 12; ctx.strokeStyle = c2; ctx.stroke(); }
  if (p === 'scales') for (let y = -50; y < 50; y += 16) for (let x = -110 + (y % 32 ? 8 : 0); x < 110; x += 16) { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = c2; ctx.stroke(); }
  if (p === 'rainbow') ['#e8323a', '#ff8a1a', '#ffd23f', '#8fe03a', '#3ae0f0', '#9a5aff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-120, -60 + i * 20, 240, 20); });
  if (p === 'galaxy') for (let i = 0; i < 26; i++) { const x = ((i * 73) % 220) - 110, y = ((i * 41) % 100) - 50; ctx.fillStyle = i % 3 ? c2 : '#ff9ae0'; ctx.fillRect(x, y, 3 + (i % 3), 3 + (i % 3)); }
  if (p === 'chrome') { const g = ctx.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, l.paint); g.addColorStop(0.5, c2); g.addColorStop(1, l.paint); ctx.fillStyle = g; ctx.fillRect(-120, -60, 240, 120); }
  if (p === 'shark') { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(10, 30, 100, 26, 0, 0, Math.PI * 2); ctx.fill(); }
  // a soft shine along the top, and the shade underneath
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.ellipse(-10, -28, 74, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0000001c'; ctx.beginPath(); ctx.ellipse(0, 40, 104, 22, 0, 0, Math.PI * 2); ctx.fill();
  // a stronger hull shows its metal bands
  for (let i = 0; i < Math.min(3, l.hull); i++) { const x = -60 + i * 40; ctx.fillStyle = '#00000022'; ctx.fillRect(x - 3, -60, 6, 120); }
  ctx.restore();
  void t;
}

/** The glow stripes: lines along the body that glow in the dark. */
function stripes(ctx: C, l: SubLook, t: number, glow: boolean) {
  const s = l.stripes;
  if (!s) return;
  ctx.save(); body(ctx); ctx.clip();
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

/** The propeller: more blades as the Motor gets better, turning. */
function propeller(ctx: C, l: SubLook, t: number) {
  ctx.save(); ctx.translate(-118, 0);
  ctx.fillStyle = '#5d6670'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.rect(4, -6, 14, 12); ctx.fill(); ctx.stroke();
  const n = 2 + Math.min(4, l.motor), spin = t * (8 + l.motor * 3);
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2, h = Math.cos(a) * 30;
    ctx.beginPath(); ctx.ellipse(0, h / 2, 6, Math.abs(h) / 2 + 2, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8d0d8'; ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** The claw under the belly, longer with each Rung. */
function claw(ctx: C, l: SubLook) {
  const len = 22 + l.claw * 8;
  ctx.save(); ctx.translate(36, 40);
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, len); ctx.stroke();
  ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = 5; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(10, len); ctx.quadraticCurveTo(-4, len + 10, 2, len + 18); ctx.moveTo(10, len); ctx.quadraticCurveTo(24, len + 10, 18, len + 18); ctx.stroke();
  ctx.restore();
}

export function drawSub(ctx: C, l: SubLook, t = 0, glow = false) {
  ctx.save();
  ctx.lineJoin = 'round';
  if (glow) {
    stripes(ctx, l, t, true);
    const r = 14 + l.lights * 2;
    const g = ctx.createRadialGradient(104, -4, 0, 104, -4, r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, l.beam); g.addColorStop(1, l.beam + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(104, -4, r * 2.2, 0, 7); ctx.fill();
    ctx.restore();
    return;
  }
  claw(ctx, l);
  propeller(ctx, l, t);
  // the tail fins
  ctx.fillStyle = l.paint; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-84, s * 10); ctx.lineTo(-112, s * 34); ctx.lineTo(-100, s * 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // the tower, with a periscope, the sonar dish (bigger with each Rung) and, with a flash, the camera
  ctx.beginPath(); rrect(ctx, -34, -84, 64, 44, 12); ctx.fillStyle = l.paint; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -84); ctx.lineTo(-6, -102); ctx.lineTo(14, -102); ctx.lineWidth = 7; ctx.stroke();
  const dish = 8 + l.sonar * 2.2;
  ctx.save(); ctx.translate(22, -88); ctx.rotate(-0.5);
  ctx.beginPath(); ctx.ellipse(0, -dish * 0.4, dish, dish * 0.55, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#d8dee6'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
  if (l.flash > 0) { ctx.beginPath(); rrect(ctx, -30, -100, 22, 16, 4); ctx.fillStyle = '#3a3f47'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.beginPath(); ctx.arc(-19, -92, 4, 0, 7); ctx.fillStyle = '#bfe6ff'; ctx.fill(); }
  // the body
  paintPattern(ctx, l, t);
  body(ctx); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  stripes(ctx, l, t, false);
  if (l.pattern === 'shark') { // a friendly shark face on the nose: an eye and a smile with soft teeth
    ctx.beginPath(); ctx.arc(70, -18, 6, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.moveTo(56, 18); ctx.quadraticCurveTo(78, 30, 96, 14); ctx.lineWidth = 4; ctx.stroke();
  }
  // portholes, and the big front window with his buddy in it
  for (const x of [-62, -28]) { ctx.beginPath(); ctx.arc(x, -6, 12, 0, 7); ctx.fillStyle = '#9fe6ff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(28, -6, 26, 0, 7); ctx.fillStyle = '#bfefff'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(28, -6, 23, 0, 7); ctx.clip();
  ctx.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(l.buddy, 28, -3 + Math.sin(t * 2) * 1.5);
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(18, -18, 9, 5, -0.5, 0, 7); ctx.fill();
  ctx.restore();
  // the headlight on the nose, bigger with better Headlights
  const r = 9 + l.lights * 1.6;
  ctx.beginPath(); ctx.arc(98, -4, r, 0, 7); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(98, -4, r * 0.55, 0, 7); ctx.fillStyle = l.beam; ctx.fill();
  ctx.restore();
}
/** The box the submarine's drawing fills, in its units (the claw and the tower stick out). */
export const SUB_BOX = { w: 300, h: 260, cy: 10 } as const;
