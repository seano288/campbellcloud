// His aircraft from above, for the top view of the deck: the same paint, trim, tail art and number as from the side, so the one on the
// deck from above is plainly the one he flies. Nose to the right, centred on (0, 0), about `len` units long (the side drawing's length).
// Rotors spin with `t`.
import { AIRCRAFT } from '../ship/catalog';
import { OUTLINE, type AirLook } from './aircraft';

const RAINBOW = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1'];
function paint(ctx: CanvasRenderingContext2D, hex: string, w: number): string | CanvasGradient {
  if (hex !== 'rainbow') return hex;
  const g = ctx.createLinearGradient(0, -w, 0, w);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
  return g;
}
function poly(ctx: CanvasRenderingContext2D, pts: readonly [number, number][], fill: string | CanvasGradient, lw = 2.5) {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
/** Both halves of a wing or tail, mirrored across the body's line. */
function pair(ctx: CanvasRenderingContext2D, half: readonly [number, number][], fill: string | CanvasGradient, lw = 2.5) {
  poly(ctx, [...half, ...[...half].reverse().map(([x, y]) => [x, -y] as [number, number])], fill, lw);
}
function body(ctx: CanvasRenderingContext2D, x0: number, x1: number, w: number, fill: string | CanvasGradient, nose = .5) {
  ctx.beginPath();
  ctx.moveTo(x0, -w * .7); ctx.lineTo(x1 - w * nose * 2, -w); ctx.quadraticCurveTo(x1, -w, x1, 0); ctx.quadraticCurveTo(x1, w, x1 - w * nose * 2, w); ctx.lineTo(x0, w * .7); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
function canopy(ctx: CanvasRenderingContext2D, x: number, rx: number, ry: number) {
  ctx.beginPath(); ctx.ellipse(x, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = '#9fd0ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE; ctx.stroke();
  ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.ellipse(x + rx * .25, -ry * .35, rx * .35, ry * .3, 0, 0, Math.PI * 2); ctx.fill();
}
function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.fillStyle = 'rgba(30,34,40,.22)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20,22,27,.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) { const a = t * 9 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
  ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
}
function num(ctx: CanvasRenderingContext2D, n: number, x: number, y: number, size: number) {
  ctx.save(); ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.strokeText(String(n), x, y); ctx.fillStyle = '#fff'; ctx.fillText(String(n), x, y); ctx.restore();
}
function glyph(ctx: CanvasRenderingContext2D, l: AirLook, x: number, y: number, size: number) {
  if (!l.glyph) return;
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, size * .62, 0, Math.PI * 2); ctx.fillStyle = l.tailBg; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l.glyph, x, y + size * .06); ctx.restore();
}

/** Draws the aircraft from above at (x, y), nose along `angle` (radians, 0 is to the right). */
export function drawAircraftTop(ctx: CanvasRenderingContext2D, l: AirLook, x: number, y: number, scale: number, t = 0, angle = 0) {
  const spec = AIRCRAFT[l.model], L = spec.len, h = L / 2, fill = paint(ctx, l.paint, L * .4);
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.lineJoin = 'round';
  switch (spec.look) {
    case 'jet': {
      pair(ctx, [[-h * .98, 0], [-h * .98, -h * .34], [-h * .78, -h * .34], [-h * .58, -h * .08]], fill); // the tailplane
      pair(ctx, [[-h * .4, 0], [-h * .3, -h * .78], [-h * .1, -h * .78], [h * .32, -h * .1]], l.trim); // the swept wing
      body(ctx, -h * .95, h, h * .13, fill, .9);
      canopy(ctx, h * .45, h * .2, h * .08);
      num(ctx, l.num, -h * .2, -h * .45, 9);
      glyph(ctx, l, -h * .2, h * .45, 9);
      break;
    }
    case 'prop': case 'float': case 'tilt': {
      const tilt = spec.look === 'tilt', span = L > 75 ? h * 1.25 : h * 1.05;
      pair(ctx, [[-h * .98, 0], [-h * .98, -h * .3], [-h * .82, -h * .3], [-h * .7, -h * .06]], fill);
      if (spec.look === 'float') { ctx.fillStyle = '#e6eaef'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(-h * .45, s * h * .32 - 4, h * 1.1, 8, 4); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE; ctx.stroke(); } }
      body(ctx, -h, h, h * .14, fill, .7);
      pair(ctx, [[-h * .12, 0], [-h * .12, -span], [h * .14, -span], [h * .14, 0]], l.trim);
      if (l.model === 'radar') { ctx.beginPath(); ctx.arc(-h * .3, 0, h * .3, 0, Math.PI * 2); ctx.fillStyle = '#f4f6fa'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke(); ctx.fillStyle = OUTLINE; ctx.fillRect(-h * .55, -1.5, h * .5, 3); }
      canopy(ctx, h * .62, h * .14, h * .07);
      if (tilt) { disc(ctx, 0, -span, h * .42, t); disc(ctx, 0, span, h * .42, t + .4); }
      else {
        const props = L > 75 ? [-span * .55, span * .55] : [0];
        for (const py of props) { ctx.strokeStyle = 'rgba(20,22,27,.7)'; ctx.lineWidth = 3; const k = Math.abs(Math.sin(t * 30)) * h * .22 + 4; ctx.beginPath(); ctx.moveTo(py === 0 ? h + 2 : h * .3, py - k); ctx.lineTo(py === 0 ? h + 2 : h * .3, py + k); ctx.stroke(); }
      }
      num(ctx, l.num, h * .01, -span * .55, 8);
      glyph(ctx, l, -h * .55, 0, 8);
      break;
    }
    case 'heli': case 'twin': {
      const twin = spec.look === 'twin';
      if (!twin) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-h * .98, 0); ctx.stroke(); ctx.strokeStyle = typeof fill === 'string' ? fill : '#999'; ctx.lineWidth = 3.5; ctx.stroke(); pair(ctx, [[-h * .98, 0], [-h * .98, -h * .16], [-h * .85, -h * .16], [-h * .85, 0]], fill, 2); }
      ctx.beginPath(); ctx.roundRect(twin ? -h * .9 : -h * .32, -h * .2, twin ? L * .9 : h * 1.15, h * .4, h * .2);
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
      ctx.fillStyle = l.trim; ctx.fillRect(twin ? -h * .6 : -h * .1, -h * .2 + 1.5, h * .14, h * .4 - 3);
      canopy(ctx, twin ? h * .72 : h * .58, h * .16, h * .13);
      glyph(ctx, l, twin ? -h * .45 : -h * .2, 0, 8);
      num(ctx, l.num, twin ? h * .2 : h * .25, 0, 8);
      if (twin) { disc(ctx, -h * .62, 0, h * .55, t); disc(ctx, h * .62, 0, h * .55, t + .5); } else disc(ctx, h * .12, 0, h * .9, t);
      break;
    }
    case 'drone': {
      body(ctx, -h * .8, h * .7, h * .12, fill, .8);
      pair(ctx, [[-h * .1, 0], [-h * .05, -h * 1.4], [h * .12, -h * 1.4], [h * .2, 0]], l.trim, 2);
      pair(ctx, [[-h * .8, 0], [-h * .85, -h * .3], [-h * .65, -h * .3], [-h * .55, 0]], fill, 2);
      disc(ctx, -h * .85, 0, h * .2, t);
      break;
    }
  }
  ctx.restore();
}
