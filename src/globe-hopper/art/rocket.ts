// A rocket drawn in code on a 2D canvas, from the parts in its slots: its kind (the shape: thin sounding rocket, two-stage launcher, crew
// rocket, heavy lifter with side cores, spaceplane, flyback booster), nose, capsule, upper stage, main stage, boosters, engines, fins,
// paint, decal and flame. White rockets with bold stripes, thick dark outlines, like the family's art. Used on the pad, in the Launch,
// in the Rocket tab and on the photo wall's patches. No image files.
import { itemOf, ROCKET_KINDS, type FlameItem, type PaintItem, type PartItem, type RocketKind } from '../base/catalog';
import type { Stage } from '../launch/sim';

export interface RocketLook {
  readonly kind: RocketKind;
  readonly nose: string; readonly capsule: string; readonly upper: string; readonly main: string;
  readonly boosters: string; readonly engines: string; readonly fins: string;
  readonly paint: string; readonly decal: string; readonly flame: string;
}

const O = '#14161b';
const lookOf = (id: string) => (itemOf(id) as PartItem).look;
export interface Drawn { readonly w: number; readonly h: number }

/** How tall and wide the rocket is, in drawing units (bottom of the engines to the tip). */
export function rocketSize(l: RocketLook): Drawn {
  const k = ROCKET_KINDS[l.kind], m = lookOf(l.main), u = lookOf(l.upper);
  const mainH = k.mainH * (m === 1 || m === 7 ? 1.15 : 1), upperH = k.upperH * (u === 1 || u === 4 || u === 7 ? 1.2 : 1);
  const top = l.kind === 'spaceplane' ? 52 : (lookOf(l.capsule) ? 30 : 0) + noseH(lookOf(l.nose));
  return { w: k.w * (m === 4 ? 1.25 : 1) + (lookOf(l.boosters) || l.kind === 'heavy' ? 30 : 0) + 24, h: 16 + mainH + upperH + top };
}
const noseH = (n: number) => [26, 34, 52, 36, 28, 40, 36, 30, 34][n] ?? 30;

function paintFill(ctx: CanvasRenderingContext2D, p: PaintItem, x: number, y: number, h: number): string | CanvasGradient {
  if (p.hex !== 'rainbow') return p.hex;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1'].forEach((c, i) => g.addColorStop(i / 5, c));
  return g;
}
function flameFill(ctx: CanvasRenderingContext2D, f: FlameItem, x: number, y: number, h: number): string | CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  if (f.hex === 'rainbow') ['#ffffff', '#ffd23f', '#ff7a00', '#e63946', '#7b4bd1', 'rgba(47,143,232,0)'].forEach((c, i) => g.addColorStop(i / 5, c));
  else { g.addColorStop(0, f.core); g.addColorStop(.35, f.hex); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  return g;
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, lw: number) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.strokeRect(x, y, w, h);
}

/** Decoration on a stage body: plain, stripes, bands, checks, ribs, chrome or a gold band, by the part's look. */
function bodyMarks(ctx: CanvasRenderingContext2D, look: number, x: number, y: number, w: number, h: number, stripe: string, lw: number) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = stripe;
  if (look === 1) ctx.fillRect(x, y + h * .12, w, h * .08);
  if (look === 2) { ctx.fillRect(x, y + h * .2, w, h * .1); ctx.fillRect(x, y + h * .62, w, h * .1); }
  if (look === 3) { const s = w / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ctx.fillRect(x + i * s, y + h * .08 + j * s, s, s); }
  if (look === 4) { ctx.fillRect(x + w * .42, y, w * .16, h); }
  if (look === 5) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = lw * .6; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + (i * w) / 5, y); ctx.lineTo(x + (i * w) / 5, y + h); ctx.stroke(); } }
  if (look === 6) { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.35, 'rgba(255,255,255,.7)'); g.addColorStop(.6, 'rgba(120,130,140,.3)'); g.addColorStop(1, 'rgba(0,0,0,.15)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  if (look === 7) { ctx.fillStyle = '#e0b13a'; ctx.fillRect(x, y + h * .1, w, h * .14); ctx.fillRect(x, y + h * .7, w, h * .06); }
  // a soft shade down one side, so it reads as round
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(0,0,0,.18)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export interface DrawOpts {
  /** The stages still on (all of them on the pad). */
  readonly stages?: readonly Stage[];
  /** How hard the engines burn, 0 (off) to 1; flicker comes from `t`. */
  readonly burn?: number;
  readonly t?: number;
  /** Draw only this dropped piece (a stage falling away). */
  readonly only?: Stage;
}

/** Draws the rocket standing with the bottom of its engines at (x, y), `s` pixels to a drawing unit. */
export function drawRocket(ctx: CanvasRenderingContext2D, l: RocketLook, x: number, y: number, s: number, o: DrawOpts = {}) {
  const k = ROCKET_KINDS[l.kind], stages = o.stages ?? ['boosters', 'main', 'upper'], burn = o.burn ?? 0, t = o.t ?? 0;
  const paint = itemOf(l.paint) as PaintItem, flame = itemOf(l.flame) as FlameItem;
  const m = lookOf(l.main), u = lookOf(l.upper), e = lookOf(l.engines), bo = lookOf(l.boosters), fi = lookOf(l.fins), ca = lookOf(l.capsule), no = lookOf(l.nose);
  const only = o.only;
  const hasMain = only ? only === 'main' || only === 'boosters' : stages.includes('main');
  const hasBoosters = (only ? only === 'boosters' : stages.includes('boosters')) && (bo > 0 || l.kind === 'heavy');
  const body = only !== 'boosters';
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = 3;
  const w = k.w * (m === 4 ? 1.25 : 1), mainH = k.mainH * (m === 1 || m === 7 ? 1.15 : 1), upperH = k.upperH * (u === 1 || u === 4 || u === 7 ? 1.2 : 1);
  let base = 0; // y of the bottom of what's drawn next (up is negative)

  // the flame, under whichever stage is burning
  const flameAt = (fw: number) => {
    if (burn <= 0) return;
    const fl = (40 + 50 * burn) * (1 + .12 * Math.sin(t * 40) + .08 * Math.sin(t * 23));
    ctx.fillStyle = flameFill(ctx, flame, 0, base, fl);
    ctx.beginPath(); ctx.moveTo(-fw / 2, base); ctx.quadraticCurveTo(-fw * .4, base + fl * .6, 0, base + fl); ctx.quadraticCurveTo(fw * .4, base + fl * .6, fw / 2, base); ctx.closePath(); ctx.fill();
  };
  // engines: one bell per engine shown, up to five
  const bells = (count: number, bw: number) => {
    const n = Math.max(1, count), gap = bw / n;
    for (let i = 0; i < n; i++) {
      const cx = -bw / 2 + gap * (i + .5), bwid = Math.min(14, gap * .9) * (e === 3 ? 1.5 : 1);
      ctx.fillStyle = e === 6 ? '#2f6fc0' : e >= 7 ? '#3a3f48' : '#5b616c';
      ctx.beginPath(); ctx.moveTo(cx - bwid * .3, base - 14); ctx.lineTo(cx + bwid * .3, base - 14); ctx.lineTo(cx + bwid / 2, base); ctx.lineTo(cx - bwid / 2, base); ctx.closePath(); ctx.fill();
      ctx.lineWidth = lw * .8; ctx.strokeStyle = O; ctx.stroke();
    }
  };
  const engineCount = [1, 2, 3, 1, 3, 3, 3, 4, 4, 5][e] ?? 1;

  if (hasMain) {
    if (body) { flameAt(w * .9); bells(engineCount, w * .9); }
    base -= 14;
    // side cores of the heavy lifter, and boosters
    const side = (bx: number, bw: number, bh: number, ink: string) => {
      if (burn > 0) { const sb = base; ctx.save(); ctx.translate(bx + bw / 2, 0); base = sb + 14; flameAt(bw * .8); base = sb; ctx.restore(); }
      box(ctx, bx, base - bh, bw, bh, ink, lw);
      ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(bx, base - bh); ctx.lineTo(bx + bw / 2, base - bh - bw * 1.1); ctx.lineTo(bx + bw, base - bh); ctx.closePath(); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
      ctx.fillStyle = paint.stripe; ctx.fillRect(bx + 1.5, base - bh * .35, bw - 3, bh * .08);
    };
    if (hasBoosters) {
      const big = bo >= 4, bw = big ? 15 : 11, bh = mainH * (big ? .72 : .55);
      const four = bo === 3 || bo === 5 || bo === 6 || bo === 7;
      if (l.kind === 'heavy') { side(-w / 2 - w * .85, w * .85, mainH * .95, paintFill(ctx, paint, 0, base - mainH, 1) as string); side(w / 2, w * .85, mainH * .95, paintFill(ctx, paint, 0, base - mainH, 1) as string); }
      if (bo > 0) {
        const off = l.kind === 'heavy' ? w * .85 : 0;
        side(-w / 2 - off - bw, bw, bh, '#f6f8fb'); side(w / 2 + off, bw, bh, '#f6f8fb');
        if (four) { side(-w / 2 - off - bw * 2 + 3, bw, bh * .85, '#e8edf2'); side(w / 2 + off + bw - 3, bw, bh * .85, '#e8edf2'); }
      }
    }
    if (!body) { ctx.restore(); return; }
    box(ctx, -w / 2, base - mainH, w, mainH, paintFill(ctx, paint, -w / 2, base - mainH, mainH), lw);
    bodyMarks(ctx, m, -w / 2, base - mainH, w, mainH, paint.stripe, lw);
    // the decal on the main stage
    const glyph = (itemOf(l.decal) as { glyph: string }).glyph;
    if (glyph) { ctx.font = `${w * .62}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, 0, base - mainH * .45); }
    ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.strokeRect(-w / 2, base - mainH, w, mainH);
    // fins at the bottom, grid fins and legs on the flyback booster
    if (fi > 0) {
      const fh = [0, 24, 30, 38, 34, 0, 34, 32, 36][fi]!, fw = [0, 12, 16, 22, 26, 0, 18, 20, 20][fi]!;
      ctx.fillStyle = fi === 8 ? '#e0b13a' : fi === 6 ? '#4a5563' : paint.stripe;
      for (const d of [-1, 1]) {
        ctx.beginPath();
        if (fi === 5) { ctx.rect(d * (w / 2) + (d < 0 ? -12 : 0), base - mainH + 8, 12, 12); }
        else if (fi === 7) { const cx = d * (w / 2 + fw * .45), cy = base - fh * .5; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? fw * .25 : fw * .55; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); }
        else { ctx.moveTo(d * w / 2, base - fh); ctx.lineTo(d * (w / 2 + fw), base - (fi === 2 || fi === 6 ? 0 : fh * .2)); ctx.lineTo(d * (w / 2 + fw), base + (fi === 4 ? 4 : 0)); ctx.lineTo(d * w / 2, base); ctx.closePath(); }
        ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
      }
    }
    if (l.kind === 'flyback') {
      ctx.strokeStyle = O; ctx.lineWidth = lw;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * w / 2, base - 26); ctx.lineTo(d * (w / 2 + 12), base + 2); ctx.stroke(); }
      ctx.fillStyle = '#5b616c';
      for (const d of [-1, 1]) { ctx.fillRect(d * (w / 2) + (d < 0 ? -10 : 0), base - mainH + 6, 10, 10); ctx.strokeRect(d * (w / 2) + (d < 0 ? -10 : 0), base - mainH + 6, 10, 10); }
    }
    base -= mainH;
    if (only) { ctx.restore(); return; }
  }

  // the upper stage
  const uw = k.upper ? w * .86 : w;
  if (k.upper && stages.includes('upper')) {
    if (!hasMain) { flameAt(uw * .7); bells(1, uw * .7); base -= 14; }
    else { // the interstage, a short dark band
      box(ctx, -uw / 2, base - 8, uw, 8, '#3a3f48', lw); base -= 8;
    }
    box(ctx, -uw / 2, base - upperH, uw, upperH, paintFill(ctx, paint, -uw / 2, base - upperH, upperH), lw);
    bodyMarks(ctx, u, -uw / 2, base - upperH, uw, upperH, paint.stripe, lw);
    ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.strokeRect(-uw / 2, base - upperH, uw, upperH);
    base -= upperH;
  }

  // the top: a spaceplane, or a capsule and a nose
  const tw = uw;
  if (l.kind === 'spaceplane') {
    ctx.fillStyle = paintFill(ctx, paint, -tw, base - 52, 52);
    ctx.beginPath(); ctx.moveTo(-tw * .35, base); ctx.lineTo(-tw * .35, base - 30); ctx.quadraticCurveTo(0, base - 64, tw * .35, base - 30); ctx.lineTo(tw * .35, base); ctx.closePath(); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-tw * .35, base - 4); ctx.lineTo(-tw * 1.05, base + 2); ctx.lineTo(-tw * .35, base - 30); ctx.closePath(); ctx.moveTo(tw * .35, base - 4); ctx.lineTo(tw * 1.05, base + 2); ctx.lineTo(tw * .35, base - 30); ctx.closePath();
    ctx.fillStyle = paint.stripe; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b2a44'; ctx.beginPath(); ctx.ellipse(0, base - 40, tw * .16, 6, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    if (ca > 0) {
      const cb = tw * (ca === 4 ? 1.05 : .95), ct = tw * .5, ch = 30;
      ctx.fillStyle = ca === 7 ? '#e0b13a' : ca === 6 ? '#bfe6ff' : '#e8edf2';
      ctx.beginPath(); ctx.moveTo(-cb / 2, base); ctx.lineTo(-ct / 2, base - ch); ctx.lineTo(ct / 2, base - ch); ctx.lineTo(cb / 2, base); ctx.closePath(); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
      const windows = ca === 2 ? 1 : ca === 3 || ca === 5 ? 3 : ca === 4 ? 2 : ca === 6 ? 0 : 0;
      ctx.fillStyle = '#1b2a44';
      for (let i = 0; i < windows; i++) { ctx.beginPath(); ctx.arc((i - (windows - 1) / 2) * 8, base - ch * .45, 3, 0, Math.PI * 2); ctx.fill(); }
      if (ca === 6) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, base - ch * .5, ct * .4, ch * .3, 0, 0, Math.PI * 2); ctx.fill(); }
      base -= ch;
      if (ca === 5) { ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-ct * .4, base); ctx.lineTo(0, base - 26); ctx.lineTo(ct * .4, base); ctx.moveTo(0, base - 26); ctx.lineTo(0, base - 36); ctx.stroke(); }
    }
    const nw = ca > 0 ? tw * .5 : tw, nh = noseH(no);
    ctx.fillStyle = no === 8 ? '#e0b13a' : no === 5 ? paintFill(ctx, paint, -nw, base - nh, nh) : paint.stripe === '#ffffff' ? paintFill(ctx, paint, -nw, base - nh, nh) : paint.stripe;
    ctx.beginPath();
    if (no === 0 || no === 7) { ctx.moveTo(-nw / 2, base); ctx.quadraticCurveTo(-nw / 2, base - nh, 0, base - nh); ctx.quadraticCurveTo(nw / 2, base - nh, nw / 2, base); }
    else if (no === 4) { ctx.arc(0, base - nh * .45, nw * .55, 0, Math.PI * 2); }
    else if (no === 5) { const fw = nw * 1.15; ctx.moveTo(-nw / 2, base); ctx.lineTo(-fw / 2, base - nh * .4); ctx.quadraticCurveTo(-fw / 2, base - nh, 0, base - nh); ctx.quadraticCurveTo(fw / 2, base - nh, fw / 2, base - nh * .4); ctx.lineTo(nw / 2, base); }
    else if (no === 3) { ctx.moveTo(-nw / 2, base); ctx.bezierCurveTo(-nw / 2, base - nh * .7, -nw * .15, base - nh, 0, base - nh); ctx.bezierCurveTo(nw * .15, base - nh, nw / 2, base - nh * .7, nw / 2, base); }
    else { ctx.moveTo(-nw / 2, base); ctx.lineTo(0, base - nh); ctx.lineTo(nw / 2, base); }
    ctx.closePath(); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = O; ctx.stroke();
    if (no === 6) { ctx.font = `${nw * .7}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐', 0, base - nh * .35); }
    if (no === 7) { ctx.beginPath(); ctx.moveTo(0, base - nh); ctx.lineTo(0, base - nh - 16); ctx.stroke(); ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(0, base - nh - 18, 3.5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/** A rocket as a picture (a data URL), for the Base's buttons and lists. Cached by look and size. */
const pics = new Map<string, string>();
export function rocketPic(l: RocketLook, h = 160): string {
  const key = `${JSON.stringify(l)}|${h}`;
  const hit = pics.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const size = rocketSize(l), s = (h * .94) / size.h, w = Math.ceil(Math.max(size.w, 70) * s) + 8;
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);
  drawRocket(ctx, l, w / 2, h - 3, s);
  const url = c.toDataURL();
  if (pics.size > 60) pics.clear();
  pics.set(key, url);
  return url;
}
