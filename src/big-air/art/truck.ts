// His truck, drawn in code from what he has fitted: the body's shape, big tires, springs, the booster, exhaust stacks, roof lights and a
// flag, and its paint made from four parts (a colour, a pattern, a decal and a trim), with his driver in the window. The same drawing is
// the Jump's truck, the Home tiles and every shop tile (cached as an image per look).
import { itemOf, type BodyItem, type ColourItem, type DecalItem, type DriverItem, type PartItem, type PatternItem, type TrimItem } from '../arena/catalog';
import type { TruckLook } from '../arena/arena';

const look = <T,>(id: string) => itemOf(id) as unknown as T;
/** Local units: the truck is about 120 long; (0, 0) is the ground under its middle. */
export const TRUCK_LEN = 120;

function pattern(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, w: number, h: number, hex: string, t: number) {
  const dark = 'rgba(0,0,0,.28)', light = 'rgba(255,255,255,.45)';
  ctx.save();
  if (kind === 1) { ctx.fillStyle = light; ctx.fillRect(x, y + h * .35, w, h * .12); ctx.fillRect(x, y + h * .55, w, h * .12); }
  if (kind === 2) { // flames from the front
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(x + w, y + h * .3);
    for (let i = 0; i < 5; i++) { const fx = x + w - (i + 1) * w * .14; ctx.quadraticCurveTo(fx + w * .07, y + h * (i % 2 ? .2 : .45), fx, y + h * (i % 2 ? .5 : .3)); }
    ctx.lineTo(x + w * .2, y + h * .7); ctx.lineTo(x + w, y + h * .8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4d1a'; ctx.fillRect(x + w * .55, y + h * .5, w * .45, h * .18);
  }
  if (kind === 3) { const s = h / 4; ctx.fillStyle = dark; for (let i = 0; i * s < w; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ctx.fillRect(x + i * s, y + j * s, s, s); }
  if (kind === 4) { ctx.fillStyle = light; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(x + ((i * 37) % 100) / 100 * w, y + ((i * 53) % 100) / 100 * h, h * .12, 0, 7); ctx.fill(); } }
  if (kind === 5) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = h * .1; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(x + (i / 8) * w, y + h * (i % 2 ? .35 : .65)); ctx.stroke(); }
  if (kind === 6) { ctx.fillStyle = 'rgba(0,0,0,.55)'; for (let i = 0; i < 6; i++) { const sx = x + (i + .3) * w / 6; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + w * .05, y + h * .6); ctx.lineTo(sx + w * .09, y); ctx.fill(); } }
  if (kind === 7) { ctx.fillStyle = '#fff'; ctx.font = `${h * .35}px sans-serif`; ctx.textAlign = 'center'; for (let i = 0; i < 4; i++) ctx.fillText('★', x + (i + .5) * w / 4, y + h * (i % 2 ? .45 : .8)); }
  if (kind === 8) { const cs = ['#3e5c2a', '#7a8a3a', '#2a3a1e']; for (let i = 0; i < 9; i++) { ctx.fillStyle = cs[i % 3]!; ctx.beginPath(); ctx.ellipse(x + ((i * 41) % 100) / 100 * w, y + ((i * 29) % 100) / 100 * h, w * .1, h * .22, i, 0, 7); ctx.fill(); } }
  if (kind === 9) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; const s = h / 3; for (let j = 0; j < 4; j++) for (let i = 0; i * s < w + s; i++) { ctx.beginPath(); ctx.arc(x + i * s + (j % 2) * s / 2, y + j * s * .8, s / 2, 0, Math.PI); ctx.stroke(); } }
  void hex; void t;
  ctx.restore();
}

/** Draws the truck with the ground under its middle at (x, y), `s` pixels a local unit, tilted by
 *  `pitch` degrees (nose up positive). `squash` (0 to 1) flattens the springs on a landing; `t` animates the lights. */
export function drawTruck(ctx: CanvasRenderingContext2D, l: TruckLook, x: number, y: number, s: number, pitch = 0, t = 0, squash = 0) {
  const body = look<BodyItem>(l.body), tires = look<PartItem>(l.tires), springs = look<PartItem>(l.springs), booster = look<PartItem>(l.booster);
  const exhaust = look<PartItem>(l.exhaust), lights = look<PartItem>(l.lights), flag = look<PartItem>(l.flag);
  const paint = look<ColourItem>(l.colour).hex, pat = look<PatternItem>(l.pattern).look, decal = look<DecalItem>(l.decal).glyph, trim = look<TrimItem>(l.trim).hex;
  const driver = look<DriverItem>(l.driver);
  const r = 17 + tires.look * 1.3, lift = 10 + springs.look * 1.2 - squash * 8, L = TRUCK_LEN * body.long, H = 34 * body.tall, base = -(r * 2 + lift * .4);
  const v = body.look;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s); ctx.rotate((-pitch * Math.PI) / 180);
  ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = '#111';
  // springs: coils between axle and body
  for (const wx of [-L * .3, L * .3]) {
    ctx.strokeStyle = '#c9d1da'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 6; i++) ctx.lineTo(wx + (i % 2 ? 4 : -4), -r - (i / 6) * (lift + 4));
    ctx.stroke();
  }
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3.2;
  // the body
  const top = base - H, cabX = v === 4 || v === 6 ? -L * .1 : L * .05, cabW = v === 5 ? L * .9 : L * .38, cabH = v === 5 ? H * .2 : H * .7;
  ctx.fillStyle = paint;
  ctx.beginPath();
  if (v === 2) { ctx.moveTo(-L / 2, base); ctx.lineTo(-L / 2 + 6, top + H * .45); ctx.lineTo(L / 2 - 4, top + H * .55); ctx.lineTo(L / 2, base); }
  else if (v === 4 || v === 6) { ctx.moveTo(-L / 2, base); ctx.lineTo(-L / 2, top + H * .3); ctx.lineTo(L * .2, top + H * .4); ctx.lineTo(L / 2, top + H * .75); ctx.lineTo(L / 2, base); }
  else if (v === 11) { ctx.moveTo(-L / 2, base); ctx.lineTo(-L / 2, top + H * .25); ctx.lineTo(L * .25, top + H * .25); ctx.quadraticCurveTo(L * .6, top + H * .5, L / 2 + 10, base - H * .2); ctx.lineTo(L / 2, base); }
  else { ctx.moveTo(-L / 2, base); ctx.lineTo(-L / 2, top + H * .25); ctx.lineTo(L / 2 - 6, top + H * .3); ctx.lineTo(L / 2, top + H * .45); ctx.lineTo(L / 2, base); }
  ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); pattern(ctx, pat, -L / 2, top, L, H, paint, t); ctx.restore();
  ctx.stroke();
  // the cab
  if (v !== 2) {
    ctx.fillStyle = paint;
    ctx.beginPath(); ctx.moveTo(cabX - cabW / 2, top + H * .28); ctx.lineTo(cabX - cabW / 2 + 4, top + H * .28 - cabH); ctx.lineTo(cabX + cabW / 2 - 8, top + H * .28 - cabH); ctx.lineTo(cabX + cabW / 2, top + H * .3); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // the window, with the driver
    ctx.fillStyle = '#bfe6ff';
    const wx = cabX + cabW * .05, wy = top + H * .28 - cabH * .85;
    ctx.beginPath(); ctx.rect(wx - cabW * .25, wy, cabW * .55, cabH * .62); ctx.fill(); ctx.strokeStyle = trim; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = driver.helmet; ctx.beginPath(); ctx.arc(wx, wy + cabH * .38, cabH * .26, 0, 7); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `${cabH * .34}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(driver.face, wx, wy + cabH * .42);
  } else {
    // a buggy's roll cage and its driver in the open
    ctx.strokeStyle = trim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-L * .2, top + H * .5); ctx.lineTo(-L * .1, top - H * .4); ctx.lineTo(L * .2, top - H * .4); ctx.lineTo(L * .28, top + H * .55); ctx.stroke();
    ctx.fillStyle = driver.helmet; ctx.beginPath(); ctx.arc(L * .05, top + H * .05, H * .3, 0, 7); ctx.fill();
    ctx.font = `${H * .36}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(driver.face, L * .05, top + H * .08);
  }
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3.2;
  // trims: a bumper at each end and a stripe along the bottom
  ctx.fillStyle = trim;
  ctx.fillRect(-L / 2 - 5, base - 9, 9, 10); ctx.fillRect(L / 2 - 4, base - 9, 9, 10); ctx.fillRect(-L / 2, base - 4, L, 4);
  // the body's own extras
  ctx.fillStyle = paint;
  if (v === 9) { ctx.beginPath(); ctx.moveTo(-L * .15, top + H * .25); ctx.lineTo(-L * .05, top - H * .55); ctx.lineTo(L * .08, top + H * .26); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(L / 2 - 4 - i * 7, base - H * .25); ctx.lineTo(L / 2 - 7 - i * 7, base - H * .05); ctx.lineTo(L / 2 - 10 - i * 7, base - H * .25); ctx.fill(); } }
  if (v === 10 || v === 13) { ctx.fillStyle = v === 13 ? '#7b4bd1' : '#2fa84f'; for (let i = 0; i < 5; i++) { const sx = -L * .45 + i * L * .12; ctx.beginPath(); ctx.moveTo(sx, top + H * .27); ctx.lineTo(sx + L * .05, top - H * .1); ctx.lineTo(sx + L * .1, top + H * .27); ctx.fill(); ctx.stroke(); } }
  if (v === 8) { ctx.strokeStyle = '#c9d1da'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-L * .45, top + H * .1); ctx.lineTo(L * .2, top - H * .15); ctx.moveTo(-L * .45, top - H * .05); ctx.lineTo(L * .2, top - H * .3); for (let i = 0; i < 6; i++) { const lx = -L * .42 + i * L * .11; ctx.moveTo(lx, top + H * .08 - i * 3); ctx.lineTo(lx, top - H * .08 - i * 3); } ctx.stroke(); }
  if (v === 12) { ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(cabX, top + H * .28 - cabH); ctx.lineTo(cabX, top - cabH - 10); ctx.stroke(); ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(cabX, top - cabH - 12, 4, 0, 7); ctx.fill(); }
  if (v === 13) { ctx.fillStyle = 'rgba(123,75,209,.8)'; ctx.beginPath(); ctx.moveTo(-L * .1, top + H * .2); ctx.lineTo(-L * .45, top - H * .9); ctx.lineTo(-L * .25, top + H * .2); ctx.fill(); ctx.stroke(); }
  if (v === 14 || v === 15) { ctx.strokeStyle = v === 14 ? '#fff6c4' : '#e8edf2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-L * .4, top + H * .45); ctx.lineTo(L * .4, top + H * .5); ctx.stroke(); }
  // the decal on the door
  if (decal) { ctx.font = `${H * .5}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(decal, -L * .18, base - H * .42); }
  // exhaust stacks behind the cab
  if (exhaust.look > 0) {
    const n = exhaust.look >= 2 ? 2 : 1, tall = 18 + exhaust.look * 3, col = exhaust.look === 7 ? '#e0b13a' : exhaust.look === 3 ? '#e8edf2' : '#6b7280';
    for (let i = 0; i < n; i++) { ctx.fillStyle = col; ctx.fillRect(cabX - cabW / 2 - 9 - i * 8, top + H * .2 - tall, 6, tall); ctx.strokeRect(cabX - cabW / 2 - 9 - i * 8, top + H * .2 - tall, 6, tall); }
    if (exhaust.look === 4 || exhaust.look === 6) { ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(cabX - cabW / 2 - 6, top + H * .2 - tall - 5, 5 + Math.sin(t * 20) * 1.5, 0, 7); ctx.fill(); }
  } else { ctx.fillStyle = '#6b7280'; ctx.fillRect(-L / 2 - 8, base - 12, 10, 5); }
  // roof lights
  if (lights.look > 0) {
    const n = lights.look === 2 ? 1 : lights.look === 3 ? 4 : 2, roof = v === 2 ? top - H * .42 : top + H * .28 - cabH - 6;
    for (let i = 0; i < n; i++) {
      const lx = cabX - (n - 1) * 7 + i * 14, on = lights.look === 4 || lights.look === 5 ? (Math.floor(t * 6) + i) % 2 === 0 : true;
      ctx.fillStyle = lights.look === 4 ? (i % 2 ? '#2f8fe8' : '#e63946') : lights.look === 5 ? ['#ff5fa2', '#5fd3f3', '#ffd23f', '#7dff6b'][(i + Math.floor(t * 4)) % 4]! : lights.look === 7 ? '#7dff6b' : '#fff6c4';
      if (lights.look === 2) { ctx.fillRect(lx - 16, roof, 32, 6); ctx.strokeRect(lx - 16, roof, 32, 6); continue; }
      ctx.globalAlpha = on ? 1 : .35; ctx.beginPath(); ctx.arc(lx, roof + 2, 5, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  // the flag on a pole at the back
  if (flag.look > 0) {
    const px = -L / 2 + 6, py = top + H * .25;
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 46); ctx.stroke();
    const wave = Math.sin(t * 8) * 3;
    ctx.fillStyle = ['', '#fff', '#e63946', '#1b1e24', '#ff7a00', '#2f8fe8', '#ff4d1a', '#e0b13a'][flag.look]!;
    ctx.beginPath(); ctx.moveTo(px, py - 46); ctx.lineTo(px - 24, py - 40 + wave); ctx.lineTo(px, py - 32); ctx.fill(); ctx.stroke();
    if (flag.look === 1) { ctx.fillStyle = '#111'; ctx.fillRect(px - 10, py - 42, 5, 4); ctx.fillRect(px - 5, py - 38, 5, 4); }
  }
  // the booster under the back
  if (booster.look > 0) {
    ctx.fillStyle = '#c9d1da'; ctx.fillRect(-L / 2 - 14, base - 20, 22, 10); ctx.strokeRect(-L / 2 - 14, base - 20, 22, 10);
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(-L / 2 - 14, base - 20); ctx.lineTo(-L / 2 - 20, base - 15); ctx.lineTo(-L / 2 - 14, base - 10); ctx.fill();
  }
  // the wheels
  ctx.strokeStyle = '#111';
  for (const wx of [-L * .3, L * .3]) {
    ctx.fillStyle = '#1b1e24'; ctx.beginPath(); ctx.arc(wx, -r, r, 0, 7); ctx.fill();
    ctx.strokeStyle = tires.look === 9 ? '#3a3f47' : '#2a2f36'; ctx.lineWidth = 3;
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + t * 4; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * r * .8, -r + Math.sin(a) * r * .8); ctx.lineTo(wx + Math.cos(a) * r, -r + Math.sin(a) * r); ctx.stroke(); }
    ctx.fillStyle = tires.look === 7 ? '#e8edf2' : tires.look === 8 ? '#ff4d1a' : '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, -r, r * .42, 0, 7); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

/** A picture of a truck, as an image URL, cached by look and size (shop tiles, Home). */
const cache = new Map<string, string>();
export function truckPic(l: TruckLook, size = 160, pitch = 0): string {
  const key = `${JSON.stringify(l)}|${size}|${pitch}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'), dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  c.width = size * dpr; c.height = size * .8 * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);
  drawTruck(ctx, l, size / 2, size * .74, size / 190, pitch);
  const url = c.toDataURL();
  if (cache.size > 300) cache.clear();
  cache.set(key, url);
  return url;
}
