// His aircraft, drawn in code from the side: a jet, a propeller plane, a helicopter, a twin-rotor, a tiltrotor, a drone or a floatplane,
// each in its paint, with its tail art and its number. Facing right, centred on (0, 0) with the wheels at y = 0, about `len` units long.
// The same drawing is the aircraft on the deck, in the Mission and on the shop's tiles (aircraftPic), so the one he flies is the one he
// sees parked.
import { AIRCRAFT, itemOf, TAILS, type Model, type PaintItem, type TailItem } from '../ship/catalog';

export interface AirLook { readonly model: Model; readonly paint: string; readonly trim: string; readonly glyph: string; readonly tailBg: string; readonly num: number }
const RAINBOW = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1'];
export const OUTLINE = '#14161b';

/** How an aircraft looks from what it wears. */
export function airLook(model: Model, look: { paint: string; tail: string; num: number }): AirLook {
  const p = itemOf(look.paint) as PaintItem, t = (TAILS as readonly TailItem[]).find(x => x.id === look.tail) ?? TAILS[0]!;
  const hex = p.hex === 'rainbow' ? 'rainbow' : p.hex;
  return { model, paint: hex, trim: model === 'rescue' ? '#e63946' : '#ffd23f', glyph: t.glyph, tailBg: t.bg, num: look.num };
}

function fill(ctx: CanvasRenderingContext2D, hex: string, x0: number, x1: number) {
  if (hex !== 'rainbow') return hex;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
  return g;
}
function shape(ctx: CanvasRenderingContext2D, pts: readonly [number, number][], color: string | CanvasGradient, lw = 3) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string | CanvasGradient, lw = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
function tailArt(ctx: CanvasRenderingContext2D, l: AirLook, x: number, y: number, size: number) {
  if (!l.glyph) return;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, size * .62, 0, Math.PI * 2); ctx.fillStyle = l.tailBg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE; ctx.stroke();
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(l.glyph, x, y + size * .06);
  ctx.restore();
}
function number(ctx: CanvasRenderingContext2D, n: number, x: number, y: number, size: number) {
  ctx.save();
  ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.strokeText(String(n), x, y); ctx.fillStyle = '#fff'; ctx.fillText(String(n), x, y);
  ctx.restore();
}
function wheels(ctx: CanvasRenderingContext2D, xs: readonly number[], gear: boolean) {
  if (!gear) return;
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
  for (const x of xs) { ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x, -4); ctx.stroke(); ctx.beginPath(); ctx.arc(x, -4, 4, 0, Math.PI * 2); ctx.fillStyle = OUTLINE; ctx.fill(); }
}
function rotor(ctx: CanvasRenderingContext2D, x: number, y: number, span: number, t: number) {
  const k = Math.abs(Math.cos(t * 30));
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y); ctx.stroke();
  ctx.fillStyle = 'rgba(30,34,40,.55)';
  ctx.beginPath(); ctx.ellipse(x, y, span * (.35 + .65 * k), 3, 0, 0, Math.PI * 2); ctx.fill();
}
function prop(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  const k = Math.abs(Math.sin(t * 40));
  ctx.fillStyle = 'rgba(30,34,40,.5)';
  ctx.beginPath(); ctx.ellipse(x, y, 2.5, r * (.4 + .6 * k), 0, 0, Math.PI * 2); ctx.fill();
}

/** Draws the aircraft. `gear`: wheels down. `t`: seconds, for the spinning rotors and props. `hook`: the tail hook down for landing. */
export function drawAircraft(ctx: CanvasRenderingContext2D, l: AirLook, x: number, y: number, scale: number, t = 0, opts: { gear?: boolean; hook?: boolean; tilt?: number } = {}) {
  const spec = AIRCRAFT[l.model], L = spec.len, h = L * .5, gear = opts.gear ?? true;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(opts.tilt ?? 0);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const body = fill(ctx, l.paint, -h, h);
  if (opts.hook) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-h * .7, -10); ctx.lineTo(-h * .95, -1); ctx.stroke(); }
  switch (spec.look) {
    case 'jet': {
      wheels(ctx, [-h * .35, h * .45], gear);
      shape(ctx, [[-h * .75, -14], [-h * .98, -40], [-h * .7, -40], [-h * .42, -16]], body); // the fin
      shape(ctx, [[-h, -12], [h * .55, -16], [h, -11], [h * .55, -6], [-h * .85, -6]], body);
      ctx.fillStyle = '#2a4a6a'; ctx.beginPath(); ctx.ellipse(h * .45, -16, h * .22, 5, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5; ctx.stroke();
      shape(ctx, [[-h * .15, -10], [-h * .45, 4], [-h * .2, 4], [h * .22, -10]], l.trim, 2.5); // the wing
      tailArt(ctx, l, -h * .78, -30, 13);
      number(ctx, l.num, h * .05, -10, 9);
      break;
    }
    case 'prop': case 'float': {
      if (spec.look === 'float') { shape(ctx, [[-h * .4, -2], [h * .6, -2], [h * .7, -6], [-h * .3, -6]], '#e6eaef', 2.5); ctx.strokeStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(-h * .05, -6); ctx.lineTo(-h * .05, -12); ctx.moveTo(h * .4, -6); ctx.lineTo(h * .4, -12); ctx.stroke(); }
      else wheels(ctx, [-h * .3, h * .45], gear);
      shape(ctx, [[-h * .78, -16], [-h * .96, -44], [-h * .68, -44], [-h * .45, -18]], body);
      round(ctx, -h, -24, L * .97, 14, 7, body);
      ctx.fillStyle = '#2a4a6a'; ctx.fillRect(h * .48, -22, h * .28, 6);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#2a4a6a'; ctx.fillRect(-h * .3 + i * h * .18, -21, 5, 5); }
      if (l.model === 'radar') { round(ctx, -h * .45, -40, h * .9, 8, 4, '#f4f6fa', 2.5); ctx.strokeStyle = OUTLINE; ctx.beginPath(); ctx.moveTo(-h * .1, -32); ctx.lineTo(-h * .1, -24); ctx.stroke(); }
      shape(ctx, [[-h * .05, -26], [h * .25, -26], [h * .12, -30], [-h * .1, -30]], l.trim, 2.5); // the high wing
      prop(ctx, h * .97, -17, 12, t);
      if (L > 75) prop(ctx, h * .2, -30, 9, t);
      tailArt(ctx, l, -h * .78, -34, 13);
      number(ctx, l.num, -h * .45, -17, 8);
      if (l.model === 'water') { ctx.fillStyle = '#2f8fe8'; ctx.fillRect(-h * .1, -12, h * .4, 3); }
      break;
    }
    case 'heli': case 'twin': {
      wheels(ctx, [-h * .2, h * .35], gear);
      const twin = spec.look === 'twin';
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-h * .2, -18); ctx.lineTo(-h, -24); ctx.stroke();
      ctx.strokeStyle = typeof body === 'string' ? body : '#888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-h * .2, -18); ctx.lineTo(-h, -24); ctx.stroke();
      if (!twin) { shape(ctx, [[-h, -24], [-h * 1.05, -36], [-h * .88, -30]], body, 2.5); rotor(ctx, -h, -26, 9, t + .3); }
      round(ctx, twin ? -h * .95 : -h * .35, -30, twin ? L * .95 : h * 1.2, 22, 11, body);
      ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.ellipse(twin ? h * .78 : h * .6, -21, 8, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = l.trim; ctx.fillRect(twin ? -h * .9 : -h * .3, -14, twin ? L * .85 : h * 1.05, 3);
      if (twin) { rotor(ctx, -h * .7, -34, h * .8, t); rotor(ctx, h * .7, -34, h * .8, t + .4); }
      else rotor(ctx, h * .1, -34, h * 1.1, t);
      tailArt(ctx, l, twin ? -h * .55 : -h * .65, twin ? -22 : -28, 11);
      number(ctx, l.num, twin ? 0 : h * .05, -20, 8);
      if (l.model === 'rescue') { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-h * .2, -30); ctx.lineTo(-h * .35, -36); ctx.stroke(); }
      break;
    }
    case 'tilt': {
      wheels(ctx, [-h * .3, h * .45], gear);
      shape(ctx, [[-h * .75, -14], [-h * .95, -38], [-h * .68, -38], [-h * .45, -16]], body);
      round(ctx, -h, -24, L * .95, 14, 7, body);
      ctx.fillStyle = '#2a4a6a'; ctx.fillRect(h * .5, -22, h * .28, 6);
      round(ctx, -h * .05, -32, 12, 18, 4, l.trim, 2.5);
      rotor(ctx, h * .02, -36, h * .7, t);
      tailArt(ctx, l, -h * .76, -30, 12);
      number(ctx, l.num, -h * .4, -17, 8);
      break;
    }
    case 'drone': {
      wheels(ctx, [-h * .4, h * .4], gear);
      round(ctx, -h * .7, -18, L * .7, 10, 5, body);
      shape(ctx, [[-h * .2, -14], [-h * .5, -2], [h * .1, -14]], l.trim, 2.5);
      ctx.fillStyle = '#2a4a6a'; ctx.beginPath(); ctx.arc(h * .55, -13, 5, 0, Math.PI * 2); ctx.fill();
      prop(ctx, -h * .72, -13, 9, t);
      rotor(ctx, 0, -22, h * .5, t);
      break;
    }
  }
  ctx.restore();
}

const pics = new Map<string, string>();
/** The aircraft as a small picture, for the shop's tiles and the end of a Round. Cached. */
export function aircraftPic(l: AirLook, w = 160, h = 90): string {
  if (typeof document === 'undefined') return '';
  const key = JSON.stringify([l, w, h]);
  const hit = pics.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(2, 2);
  const L = AIRCRAFT[l.model].len, k = Math.min((w * .86) / L, (h * .8) / 50);
  drawAircraft(ctx, l, w / 2, h * .82, k, .1);
  const url = c.toDataURL();
  pics.set(key, url);
  return url;
}
