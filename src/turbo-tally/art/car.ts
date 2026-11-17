// His race car, drawn in code from the parts fitted, from above (the Race, the Garage's top view) and from the side (the Garage, the
// podium, the tiles). The same functions draw it everywhere, so the car in the Garage is the car on the track. Rivals are drawn the
// same way from their own parts.
import { partOf, type BodyPart, type BoosterPart, type Car, type DecalPart, type EnginePart, type FlamePart, type PaintPart, type RimPart, type TyrePart, type WingPart } from '../garage/parts';

const O = '#14161b', TAU = Math.PI * 2;
export type Look = Omit<Car, 'number'> & { readonly number?: number };

interface Parts { body: BodyPart; engine: EnginePart; tyres: TyrePart; wing: WingPart; booster: BoosterPart; paint: PaintPart; rims: RimPart; decal: DecalPart; flame: FlamePart }
const partsOf = (car: Look): Parts => ({
  body: partOf(car.body) as BodyPart, engine: partOf(car.engine) as EnginePart, tyres: partOf(car.tyres) as TyrePart, wing: partOf(car.wing) as WingPart,
  booster: partOf(car.booster) as BoosterPart, paint: partOf(car.paint) as PaintPart, rims: partOf(car.rims) as RimPart, decal: partOf(car.decal) as DecalPart,
  flame: partOf(car.flame) as FlamePart,
});

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, points = 5) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / points, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}
function heart(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath(); c.moveTo(x, y + r * .8);
  c.bezierCurveTo(x - r * 1.4, y - r * .2, x - r * .6, y - r * 1.2, x, y - r * .4);
  c.bezierCurveTo(x + r * .6, y - r * 1.2, x + r * 1.4, y - r * .2, x, y + r * .8); c.closePath();
}
function bolt(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath(); c.moveTo(x + r * .2, y - r); c.lineTo(x - r * .5, y + r * .1); c.lineTo(x, y + r * .1); c.lineTo(x - r * .2, y + r); c.lineTo(x + r * .5, y - r * .1); c.lineTo(x, y - r * .1); c.closePath();
}

/** The body's outline, pointing right, centred on 0,0. */
function bodyPath(c: CanvasRenderingContext2D, b: BodyPart['shape'], L: number, W: number) {
  const x0 = -L / 2, x1 = L / 2, h = W / 2;
  c.beginPath();
  if (b.nose === 'point') {
    c.moveTo(x0, -h * .8); c.lineTo(x1 - L * .3, -h); c.lineTo(x1, -h * .2); c.lineTo(x1, h * .2); c.lineTo(x1 - L * .3, h); c.lineTo(x0, h * .8);
  } else if (b.nose === 'wedge') {
    c.moveTo(x0, -h); c.lineTo(x1 - L * .15, -h); c.lineTo(x1, -h * .55); c.lineTo(x1, h * .55); c.lineTo(x1 - L * .15, h); c.lineTo(x0, h);
  } else if (b.nose === 'square') {
    c.moveTo(x0, -h); c.lineTo(x1 - 4, -h); c.quadraticCurveTo(x1, -h, x1, -h + 4); c.lineTo(x1, h - 4); c.quadraticCurveTo(x1, h, x1 - 4, h); c.lineTo(x0, h);
  } else {
    c.moveTo(x0, -h); c.lineTo(x1 - h, -h); c.arc(x1 - h, 0, h, -Math.PI / 2, Math.PI / 2); c.lineTo(x0, h);
  }
  c.quadraticCurveTo(x0 - 4, h, x0 - 4, h - 4); c.lineTo(x0 - 4, -h + 4); c.quadraticCurveTo(x0 - 4, -h, x0, -h);
  c.closePath();
}

/** A decal, drawn inside the body (the caller clips to it). x runs along the car, y across it (or up it, from the side). */
export function drawDecal(c: CanvasRenderingContext2D, d: DecalPart, L: number, W: number, trim: string) {
  const col = d.color, x0 = -L / 2, h = W / 2;
  c.fillStyle = col; c.strokeStyle = col;
  switch (d.pattern) {
    case 'side': c.fillRect(x0, -h * .62, L, W * .1); c.fillRect(x0, h * .52, L, W * .1); break;
    case 'stripes': c.fillRect(x0, -W * .16, L, W * .1); c.fillRect(x0, W * .06, L, W * .1); break;
    case 'dots': for (let x = x0 + 8; x < L / 2; x += 13) for (let y = -h + 7; y < h; y += 12) { c.beginPath(); c.arc(x + ((y / 12) % 2) * 5, y, 3, 0, TAU); c.fill(); } break;
    case 'stars': for (const [x, y] of [[-.3, -.25], [0, .25], [.25, -.3], [-.05, -.05]]) { star(c, x! * L, y! * W, W * .14); c.fill(); } break;
    case 'hearts': for (const [x, y] of [[-.25, -.22], [.05, .22], [.25, -.2]]) { heart(c, x! * L, y! * W, W * .13); c.fill(); } break;
    case 'zigzag': c.lineWidth = W * .08; c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(x0 + (i * L) / 8, i % 2 ? -W * .18 : W * .18); c.stroke(); break;
    case 'bolts': for (const x of [-.25, .1]) { bolt(c, x * L, 0, W * .3); c.fill(); } break;
    case 'flames': {
      c.fillStyle = col;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(L * .3, s * h * .2); for (let i = 0; i < 5; i++) { c.quadraticCurveTo(L * (.2 - i * .1), s * h * (.9 - (i % 2) * .5), L * (.15 - i * .1), s * h * .3); } c.lineTo(L * .3, s * h * .2); c.fill(); }
      c.fillStyle = '#ffd23f'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(L * .12, s * h * .35, L * .14, h * .18, 0, 0, TAU); c.fill(); }
      break;
    }
    case 'checkers': { const s = W / 6; for (let x = x0, i = 0; x < L / 2; x += s, i++) for (let y = -h, j = 0; y < h; y += s, j++) if ((i + j) % 2) c.fillRect(x, y, s, s); break; }
    case 'bubbles': c.lineWidth = 2; for (const [x, y, r] of [[-.3, -.2, .12], [-.05, .2, .09], [.2, -.15, .14], [.05, -.25, .06]]) { c.beginPath(); c.arc(x! * L, y! * W, r! * W, 0, TAU); c.stroke(); } break;
    case 'paws': for (const [x, y] of [[-.28, -.2], [-.05, .18], [.2, -.18]]) { c.beginPath(); c.arc(x! * L, y! * W, W * .08, 0, TAU); c.fill(); for (const a of [-.9, -.3, .3, .9]) { c.beginPath(); c.arc(x! * L + Math.cos(a - Math.PI / 2) * W * .13, y! * W + Math.sin(a - Math.PI / 2) * W * .13, W * .035, 0, TAU); c.fill(); } } break;
    case 'swirls': c.lineWidth = 2.5; for (const x of [-.25, .15]) { c.beginPath(); for (let a = 0; a < TAU * 2; a += .2) c.lineTo(x * L + Math.cos(a) * a * 1.6, Math.sin(a) * a * 1.6); c.stroke(); } break;
    case 'tiger': c.lineWidth = W * .07; for (let x = x0 + 6; x < L / 2; x += 11) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x + 5, -h * .3); c.moveTo(x + 2, h); c.lineTo(x + 7, h * .3); c.stroke(); } break;
    case 'shark': c.fillStyle = '#ffffff'; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { c.beginPath(); const x = L * .18 + i * L * .07; c.moveTo(x, s * h * .15); c.lineTo(x + L * .035, s * h * .55); c.lineTo(x + L * .07, s * h * .15); c.fill(); } break;
    case 'rainbow': ['#e63946', '#ff8a1f', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'].forEach((k, i) => { c.fillStyle = k; c.fillRect(x0, -W * .3 + i * W * .1, L, W * .1); }); break;
    case 'dragon': c.lineWidth = 2; for (let x = x0 + 6; x < L / 2 - 6; x += 9) for (let y = -h + 5; y < h; y += 9) { c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI); c.stroke(); } break;
    case 'comet': c.beginPath(); c.moveTo(L * .3, 0); c.lineTo(-L * .4, -W * .25); c.lineTo(-L * .35, 0); c.lineTo(-L * .4, W * .25); c.closePath(); c.globalAlpha = .7; c.fill(); c.globalAlpha = 1; star(c, L * .3, 0, W * .2); c.fillStyle = '#fff'; c.fill(); break;
    case 'galaxy': c.fillStyle = '#2a1650'; c.fillRect(x0, -h, L, W); c.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(x0 + ((i * 37) % L), -h + ((i * 23) % W), 1.4, 0, TAU); c.fill(); } c.fillStyle = col; c.globalAlpha = .5; c.beginPath(); c.ellipse(0, 0, L * .3, W * .2, .4, 0, TAU); c.fill(); c.globalAlpha = 1; break;
    case 'goldtrim': c.lineWidth = W * .1; c.strokeStyle = col; c.strokeRect(x0 + 2, -h + 2, L - 4, W - 4); break;
    case 'splash': c.globalAlpha = .85; for (const [x, y, r] of [[-.3, -.25, .14], [-.1, .2, .1], [.15, -.2, .12], [.3, .25, .08], [-.35, .3, .07]]) { c.beginPath(); c.arc(x! * L, y! * W, r! * W, 0, TAU); c.fill(); } c.globalAlpha = 1; break;
    case 'snow': c.lineWidth = 1.8; for (const [x, y] of [[-.3, -.2], [0, .22], [.25, -.15]]) { for (let a = 0; a < 3; a++) { const k = (a * Math.PI) / 3; c.beginPath(); c.moveTo(x! * L - Math.cos(k) * W * .14, y! * W - Math.sin(k) * W * .14); c.lineTo(x! * L + Math.cos(k) * W * .14, y! * W + Math.sin(k) * W * .14); c.stroke(); } } break;
    default: break;
  }
  void trim;
}

function wheelTop(c: CanvasRenderingContext2D, x: number, y: number, t: TyrePart, rim: RimPart, s: number) {
  const w = 16 * s, h = 9 * s;
  c.fillStyle = t.tread === 'gold' ? '#b8901c' : '#1d1f24'; c.strokeStyle = O; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 3); c.fill(); c.stroke();
  // tread: knobbly blocks, paddles, studs
  c.fillStyle = t.tread === 'studded' ? '#dfe5ea' : '#3a3d46';
  if (t.tread === 'knobbly' || t.tread === 'all') for (let i = -1; i <= 1; i++) c.fillRect(x + i * w * .3 - 1.5, y - h / 2, 3, h);
  if (t.tread === 'paddle') for (let i = -1; i <= 1; i++) c.fillRect(x + i * w * .3 - 1, y - h / 2 - 1, 2, h + 2);
  if (t.tread === 'studded') for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(x + i * w * .3, y, 1.4, 0, TAU); c.fill(); }
  c.fillStyle = rim.rainbow ? '#ff7ac8' : rim.color; c.fillRect(x - w * .15, y - h / 2 + 1.5, w * .3, h - 3);
}

export interface DrawOpts { boosting?: boolean; t?: number; glow?: string | null; shadow?: boolean }

/** The car from above, pointing right (+x), centred on 0,0, about `len` long at scale 1. */
export function drawCarTop(c: CanvasRenderingContext2D, car: Look, o: DrawOpts = {}) {
  const p = partsOf(car), b = p.body.shape, L = b.len, W = b.wid, t = o.t ?? 0;
  if (o.shadow !== false) { c.fillStyle = '#0000003a'; c.beginPath(); c.ellipse(3, 5, L * .55, W * .62, 0, 0, TAU); c.fill(); }
  // the boost flame, behind
  if (o.boosting) drawFlame(c, p.flame, -L / 2 - 4, 0, 1, t);
  // wheels
  const wx = L * .32, wy = W / 2 + (b.open ? 5 : -1);
  for (const [x, y] of [[wx, -wy], [wx, wy], [-wx, -wy], [-wx, wy]] as const) wheelTop(c, x, y, p.tyres, p.rims, b.open ? 1.05 : .95);
  // booster cans on the back
  c.fillStyle = '#9aa3ad'; c.strokeStyle = O; c.lineWidth = 2;
  for (let i = 0; i < p.booster.cans; i++) { const y = (i - (p.booster.cans - 1) / 2) * 9; c.beginPath(); c.roundRect(-L / 2 - 10, y - 3.5, 12, 7, 3); c.fill(); c.stroke(); }
  // body
  bodyPath(c, b, L, W);
  c.fillStyle = p.paint.main; c.fill();
  c.save(); bodyPath(c, b, L, W); c.clip(); drawDecal(c, p.decal, L, W, p.paint.trim); c.restore();
  bodyPath(c, b, L, W); c.lineWidth = 3; c.strokeStyle = O; c.stroke();
  // engine pipes, at the back
  c.fillStyle = '#5b6170';
  for (let i = 0; i < p.engine.pipes; i++) { const y = (i - (p.engine.pipes - 1) / 2) * 7; c.beginPath(); c.arc(-L / 2 + 6, y, 2.6, 0, TAU); c.fill(); }
  // cockpit
  const cx = -L / 2 + L * b.cab;
  c.fillStyle = '#9fd8ff'; c.strokeStyle = O; c.lineWidth = 2.5;
  c.beginPath(); c.ellipse(cx, 0, L * .13, W * .3, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#ffffff99'; c.beginPath(); c.ellipse(cx + 2, -W * .1, L * .05, W * .08, 0, 0, TAU); c.fill();
  // the race number in a circle on the bonnet
  if (car.number !== undefined) {
    const nx = cx + L * .22;
    if (nx < L / 2 - 8) {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(nx, 0, W * .22, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke();
      c.fillStyle = O; c.font = `900 ${W * .26}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.save(); c.translate(nx, 0); c.rotate(Math.PI / 2); c.fillText(String(car.number), 0, 1); c.restore();
    }
  }
  // the wing, across the back
  if (p.wing.size > 0) {
    const ww = W * (.9 + p.wing.size * .35), x = -L / 2 + 2;
    c.fillStyle = p.paint.trim; c.strokeStyle = O; c.lineWidth = 2.5;
    const bar = (dx: number) => { c.beginPath(); c.roundRect(x + dx - 3, -ww / 2, 7, ww, 3); c.fill(); c.stroke(); };
    bar(0); if (p.wing.twin) bar(9);
    if (p.wing.fin) { c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(cx, -1.5); c.lineTo(cx, 1.5); c.closePath(); c.fill(); c.stroke(); }
  }
  if (o.glow) { bodyPath(c, b, L + 10, W + 10); c.lineWidth = 4; c.strokeStyle = o.glow; c.stroke(); }
}

/** The boost flame (or sparks, bubbles, lightning) coming out of the back, pointing left from (x, y). */
export function drawFlame(c: CanvasRenderingContext2D, f: FlamePart, x: number, y: number, k: number, t: number) {
  const flick = 1 + Math.sin(t * 40) * .12, len = 34 * k * flick;
  if (f.kind === 'flame') {
    f.colors.forEach((col, i) => {
      const s = 1 - i / f.colors.length;
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 9 * s * k); c.quadraticCurveTo(x - len * s, y - 4 * s, x - len * s * 1.2, y); c.quadraticCurveTo(x - len * s, y + 4 * s, x, y + 9 * s * k); c.fill();
    });
  } else if (f.kind === 'stars') {
    f.colors.forEach((col, i) => { c.fillStyle = col; star(c, x - 10 - i * 12 * k, y + Math.sin(t * 20 + i) * 6, 6 * k); c.fill(); });
  } else if (f.kind === 'bubbles') {
    c.lineWidth = 2; f.colors.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(x - 8 - i * 11 * k, y + Math.sin(t * 14 + i * 2) * 7, (4 + i) * k, 0, TAU); c.stroke(); });
  } else {
    c.lineWidth = 3; c.strokeStyle = f.colors[0]!; c.beginPath(); c.moveTo(x, y);
    for (let i = 1; i <= 5; i++) c.lineTo(x - i * 8 * k, y + ((i + Math.floor(t * 20)) % 2 ? 7 : -7)); c.stroke();
    c.strokeStyle = f.colors[1]!; c.lineWidth = 1.5; c.stroke();
  }
}

function wheelSide(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: TyrePart, rim: RimPart, spin: number) {
  c.fillStyle = t.tread === 'gold' ? '#b8901c' : '#1d1f24'; c.strokeStyle = O; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
  // tread round the edge
  c.fillStyle = t.tread === 'studded' ? '#dfe5ea' : '#3a3d46';
  const knobs = t.tread === 'knobbly' || t.tread === 'all' ? 12 : t.tread === 'paddle' ? 8 : t.tread === 'studded' ? 14 : 0;
  for (let i = 0; i < knobs; i++) { const a = spin + (i * TAU) / knobs; c.beginPath(); c.arc(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9, t.tread === 'paddle' ? r * .16 : r * .1, 0, TAU); c.fill(); }
  const rr = r * .55;
  if (rim.rainbow) { ['#e63946', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'].forEach((k, i) => { c.fillStyle = k; c.beginPath(); c.moveTo(x, y); c.arc(x, y, rr, spin + (i * TAU) / 5, spin + ((i + 1) * TAU) / 5); c.fill(); }); }
  else { c.fillStyle = rim.color; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
  c.lineWidth = 2; c.strokeStyle = O; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke();
  if (rim.star) { c.fillStyle = '#ffffffcc'; star(c, x, y, rr * .7, Math.max(4, rim.spokes || 5)); c.fill(); }
  else for (let i = 0; i < rim.spokes; i++) { const a = spin + (i * TAU) / rim.spokes; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); c.stroke(); }
  c.fillStyle = O; c.beginPath(); c.arc(x, y, r * .12, 0, TAU); c.fill();
}

/** The car from the side, facing right, standing on y = 0, centred on x = 0. About 2 × its length wide. */
export function drawCarSide(c: CanvasRenderingContext2D, car: Look, o: DrawOpts = {}) {
  const p = partsOf(car), b = p.body.shape, t = o.t ?? 0, spin = t * 6;
  const L = b.len * 2.2, H = 26 + (b.open ? 0 : 10), r = b.open ? 21 : 18, ground = 0, axle = ground - r;
  const x0 = -L / 2, x1 = L / 2, bodyBottom = axle - (b.open ? 2 : 6), top = bodyBottom - H;
  if (o.shadow !== false) { c.fillStyle = '#00000033'; c.beginPath(); c.ellipse(0, 2, L * .55, 6, 0, 0, TAU); c.fill(); }
  if (o.boosting) drawFlame(c, p.flame, x0 - 8, bodyBottom - H * .35, 1.4, t);
  // booster cans on the back
  c.fillStyle = '#9aa3ad'; c.strokeStyle = O; c.lineWidth = 2.5;
  for (let i = 0; i < Math.min(2, p.booster.cans); i++) { c.beginPath(); c.roundRect(x0 - 16, top + 4 + i * 11, 22, 9, 4); c.fill(); c.stroke(); }
  // body silhouette
  c.beginPath();
  const nose = b.nose;
  c.moveTo(x0, bodyBottom);
  c.lineTo(x0, top + 6);
  if (b.open) { c.lineTo(x0 + L * .2, top + 4); c.lineTo(x0 + L * (b.cab - .05), top); c.lineTo(x0 + L * (b.cab + .2), top + 6); }
  else { c.lineTo(x0 + L * (b.cab - .2), top + 4); c.quadraticCurveTo(x0 + L * (b.cab - .1), top - 18, x0 + L * b.cab, top - 20); c.quadraticCurveTo(x0 + L * (b.cab + .15), top - 18, x0 + L * (b.cab + .22), top + 4); }
  if (nose === 'point') { c.lineTo(x1, bodyBottom - 4); }
  else if (nose === 'wedge') { c.lineTo(x1 - 6, top + H * .55); c.lineTo(x1, bodyBottom - 2); }
  else if (nose === 'square') { c.lineTo(x1, top + 4); c.lineTo(x1, bodyBottom); }
  else { c.quadraticCurveTo(x1 + 4, top + 6, x1, bodyBottom); }
  c.closePath();
  c.fillStyle = p.paint.main; c.fill();
  c.save(); c.clip(); c.translate(0, (top + bodyBottom) / 2); drawDecal(c, p.decal, L, H, p.paint.trim); c.restore();
  c.lineWidth = 3.5; c.strokeStyle = O; c.stroke();
  // window
  if (!b.open) {
    c.fillStyle = '#9fd8ff'; c.beginPath(); c.moveTo(x0 + L * (b.cab - .14), top + 3); c.quadraticCurveTo(x0 + L * (b.cab - .06), top - 13, x0 + L * b.cab, top - 14); c.lineTo(x0 + L * (b.cab + .14), top + 3); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
  } else {
    // a driver's helmet
    c.fillStyle = p.paint.trim; c.beginPath(); c.arc(x0 + L * b.cab, top - 6, 11, 0, TAU); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#1d1f24'; c.beginPath(); c.roundRect(x0 + L * b.cab + 1, top - 10, 9, 6, 2); c.fill();
  }
  // engine on the back of open cars, with its pipes
  c.fillStyle = '#5b6170'; c.strokeStyle = O; c.lineWidth = 2;
  for (let i = 0; i < Math.min(4, p.engine.pipes); i++) { c.beginPath(); c.roundRect(x0 + 4 + i * 7, top - 8, 5, 12, 2); c.fill(); c.stroke(); }
  // the race number on the door
  if (car.number !== undefined) {
    const nx = x0 + L * (b.cab + .02), ny = (top + bodyBottom) / 2 + 2, nr = Math.min(H * .38, 13);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(nx, ny, nr, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = O; c.font = `900 ${nr * 1.2}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(car.number), nx, ny + 1);
  }
  // the wing on its posts
  if (p.wing.size > 0) {
    const wx = x0 + 4, wh = 16 + p.wing.size * 16, ww = 26 + p.wing.size * 14;
    c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + 8, top + 2); c.lineTo(wx + 8, top - wh); c.stroke();
    c.fillStyle = p.paint.trim; c.beginPath(); c.roundRect(wx - 6, top - wh - 7, ww, 8, 3); c.fill(); c.stroke();
    if (p.wing.twin) { c.beginPath(); c.roundRect(wx - 4, top - wh + 5, ww - 6, 6, 3); c.fill(); c.stroke(); }
    if (p.wing.fin) { c.fillStyle = p.paint.main; c.beginPath(); c.moveTo(wx + 2, top + 2); c.lineTo(wx + 8, top - wh * .7); c.lineTo(wx + 26, top + 2); c.closePath(); c.fill(); c.stroke(); }
  }
  // wheels
  for (const x of [x0 + L * .2, x1 - L * .2]) wheelSide(c, x, axle, r, p.tyres, p.rims, spin);
  if (o.glow) { c.strokeStyle = o.glow; c.lineWidth = 5; c.strokeRect(x0 - 6, top - 26, L + 12, -top + 30); }
}
/** How much room the side view takes, for fitting it in a box. */
export const SIDE_SPAN = { left: -110, right: 110, top: -100, bottom: 10 };
