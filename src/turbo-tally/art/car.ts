// His race car, drawn in code from the parts fitted, from above (the Race, the Garage's top view) and from the side (the Garage, the
// podium, the tiles). The same functions draw it everywhere, so the car in the Garage is the car on the track. Rivals are drawn the
// same way from their own parts. Bodies with a `style` (a pickup, a tank, a flying saucer…) keep the same paint, decal, rims, tyres,
// wing, booster cans, flame and number as any car, and add what makes them that vehicle.
import { partOf, type BodyPart, type BodyShape, type BoosterPart, type Car, type DecalPart, type EnginePart, type FlamePart, type PaintPart, type RimPart, type TyrePart, type WingPart } from '../garage/parts';

const O = '#14161b', TAU = Math.PI * 2, GLASS = '#9fd8ff';
export type Look = Omit<Car, 'number'> & { readonly number?: number };

interface Parts { body: BodyPart; engine: EnginePart; tyres: TyrePart; wing: WingPart; booster: BoosterPart; paint: PaintPart; rims: RimPart; decal: DecalPart; flame: FlamePart }
const partsOf = (car: Look): Parts => ({
  body: partOf(car.body) as BodyPart, engine: partOf(car.engine) as EnginePart, tyres: partOf(car.tyres) as TyrePart, wing: partOf(car.wing) as WingPart,
  booster: partOf(car.booster) as BoosterPart, paint: partOf(car.paint) as PaintPart, rims: partOf(car.rims) as RimPart, decal: partOf(car.decal) as DecalPart,
  flame: partOf(car.flame) as FlamePart,
});

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, points = 5, inner = .45, turn = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) { const a = turn + (i * Math.PI) / points, rr = i % 2 ? r * inner : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
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
/** A four-pointed twinkle. */
function twinkle(c: CanvasRenderingContext2D, x: number, y: number, r: number) { star(c, x, y, r, 4, .3, 0); }
/** Fill what's been traced, then outline it in the chunky black. */
function solid(c: CanvasRenderingContext2D, fill: string, w = 2.5, p?: Path2D) {
  c.fillStyle = fill; c.strokeStyle = O; c.lineWidth = w;
  if (p) { c.fill(p); c.stroke(p); } else { c.fill(); c.stroke(); }
}
function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, lw = 2) { c.beginPath(); c.roundRect(x, y, w, h, r); solid(c, fill, lw); }
function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, lw = 2) { c.beginPath(); c.arc(x, y, r, 0, TAU); solid(c, fill, lw); }
/** A small hash, so scattered things (sprinkles, pixels, spots) land in the same places every frame. */
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** The race number in a white circle. From above it's turned to read across the car. */
function numberDisc(c: CanvasRenderingContext2D, n: number, x: number, y: number, r: number, across: boolean, lw: number) {
  c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = O; c.font = `900 ${r * 1.2}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.translate(x, y); if (across) c.rotate(Math.PI / 2); c.fillText(String(n), 0, 1); c.restore();
}
/** Police and fire lights take turns. */
const flash = (t: number) => Math.sin(t * 14) > 0;

/** The body's outline from above, pointing right, centred on 0,0. */
function bodyPath(b: BodyShape, L: number, W: number): Path2D {
  const c = new Path2D(), x0 = -L / 2, x1 = L / 2, h = W / 2;
  if (b.style === 'ufo') { c.ellipse(0, 0, L / 2, W / 2, 0, 0, TAU); return c; }
  if (b.style === 'bike') {
    c.moveTo(x1 - L * .08, 0); c.quadraticCurveTo(x1 - L * .2, -h, x1 - L * .45, -h); c.lineTo(x0 + L * .2, -h * .75); c.quadraticCurveTo(x0 + L * .06, -h * .6, x0 + L * .06, 0);
    c.quadraticCurveTo(x0 + L * .06, h * .6, x0 + L * .2, h * .75); c.lineTo(x1 - L * .45, h); c.quadraticCurveTo(x1 - L * .2, h, x1 - L * .08, 0); c.closePath(); return c;
  }
  if (b.style === 'tank') { c.roundRect(x0 + 2, -h + 10, L - 4, W - 20, 5); return c; }
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
  return c;
}

/** A decal, drawn inside the body (the caller clips to it). x runs along the car, y across it (or up it, from the side). */
export function drawDecal(c: CanvasRenderingContext2D, d: DecalPart, L: number, W: number, trim: string) {
  const col = d.color, x0 = -L / 2, h = W / 2;
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'butt';
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
    case 'waves': {
      // three rolling sea waves, the bottom one filled in
      c.lineWidth = W * .07; c.lineCap = 'round';
      const wave = (y: number, k: number) => { for (let x = x0; x <= L / 2 + 4; x += 3) c.lineTo(x, y + Math.sin((x / L) * TAU * 3 + k) * W * .06); };
      for (const [y, k] of [[-.28, 0], [-.04, 1.6]] as const) { c.beginPath(); wave(y * W, k); c.stroke(); }
      c.beginPath(); wave(W * .2, 3.2); c.lineTo(L / 2 + 4, h); c.lineTo(x0, h); c.closePath(); c.fill();
      break;
    }
    case 'leopard': {
      // broken rings (rosettes) with a darker middle
      c.lineWidth = Math.max(2, W * .06); c.lineCap = 'round';
      const step = Math.max(12, W * .32);
      for (let x = x0 + step * .5, i = 0; x < L / 2; x += step, i++) for (let y = -h + step * .35 + (i % 2) * step * .45, j = 0; y < h; y += step * .8, j++) {
        const k = hash(i * 7 + j), r = step * (.22 + k * .08), cx = x + (k - .5) * 4;
        c.globalAlpha = .35; c.beginPath(); c.arc(cx, y, r * .6, 0, TAU); c.fill(); c.globalAlpha = 1;
        for (let a = 0; a < 3; a++) { const s = k * 6 + (a * TAU) / 3; c.beginPath(); c.arc(cx, y, r, s, s + 1.3); c.stroke(); }
      }
      break;
    }
    case 'diamonds': {
      // rows of gems, each with a shine
      const dw = Math.max(5, W * .12), dh = Math.max(8, W * .2), step = dw * 2.6;
      for (const [row, off] of [[-.24, 0], [.24, .5]] as const) for (let x = x0 + step * (.5 + off); x < L / 2; x += step) {
        const y = row * W;
        c.fillStyle = col; c.beginPath(); c.moveTo(x, y - dh / 2); c.lineTo(x + dw / 2, y); c.lineTo(x, y + dh / 2); c.lineTo(x - dw / 2, y); c.closePath(); c.fill();
        c.fillStyle = '#9fd8ffaa'; c.beginPath(); c.moveTo(x, y - dh / 2); c.lineTo(x + dw / 2, y); c.lineTo(x, y); c.closePath(); c.fill();
      }
      break;
    }
    case 'pixels': {
      // a chunky video-game pixel band, ragged at the edges
      const s = Math.max(4, W / 8), cols = Math.ceil(L / s);
      for (let i = 0; i < cols; i++) for (let j = 0; j * s < W; j++) {
        const y = -h + j * s, mid = Math.abs(y + s / 2) / h, k = hash(i * 13 + j * 5);
        if (k > .25 + mid * .7) { c.globalAlpha = k > .7 ? 1 : .55; c.fillRect(x0 + i * s, y, s - .5, s - .5); }
      }
      c.globalAlpha = 1;
      break;
    }
    case 'web': {
      // a spider web spun from the front corner
      const cx = L * .18, cy = -h * .2, spokes = 12, R = Math.hypot(L, W);
      c.lineWidth = 1.6;
      for (let i = 0; i < spokes; i++) { const a = (i * TAU) / spokes; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
      for (let r = 7; r < R; r += Math.max(7, W * .2)) {
        c.beginPath();
        for (let i = 0; i <= spokes; i++) {
          const a = (i * TAU) / spokes, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
          if (i === 0) c.moveTo(px, py); else { const m = a - Math.PI / spokes; c.quadraticCurveTo(cx + Math.cos(m) * r * .82, cy + Math.sin(m) * r * .82, px, py); }
        }
        c.stroke();
      }
      break;
    }
    case 'planets': {
      // a ringed planet, a small one with craters, a moon, and stars
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x0 + hash(i) * L, -h + hash(i + 40) * W, 1.3, 0, TAU); c.fill(); }
      const pr = W * .22;
      c.fillStyle = col; c.beginPath(); c.arc(-L * .2, 0, pr, 0, TAU); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1.6, W * .05); c.beginPath(); c.ellipse(-L * .2, 0, pr * 1.7, pr * .45, -.35, 0, TAU); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(-L * .2, 0, pr, Math.PI + .2, TAU - .5); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(L * .18, -W * .18, pr * .6, 0, TAU); c.fill();
      c.fillStyle = '#00000033'; for (const [dx, dy] of [[-.25, -.2], [.25, .2]] as const) { c.beginPath(); c.arc(L * .18 + dx * pr, -W * .18 + dy * pr, pr * .15, 0, TAU); c.fill(); }
      c.fillStyle = col; c.globalAlpha = .75; c.beginPath(); c.arc(L * .32, W * .22, pr * .3, 0, TAU); c.fill(); c.globalAlpha = 1;
      break;
    }
    case 'crowns': {
      for (const [x, y] of [[-.28, -.18], [.02, .2], [.26, -.16]] as const) {
        const cx = x * L, cy = y * W, s = W * .21;
        c.fillStyle = col; c.beginPath(); c.moveTo(cx - s, cy + s * .6); c.lineTo(cx - s, cy - s * .5); c.lineTo(cx - s * .5, cy); c.lineTo(cx, cy - s * .8); c.lineTo(cx + s * .5, cy); c.lineTo(cx + s, cy - s * .5); c.lineTo(cx + s, cy + s * .6); c.closePath(); c.fill();
        for (const dx of [-1, 0, 1]) { c.beginPath(); c.arc(cx + dx * s, cy - (dx ? s * .5 : s * .8), s * .16, 0, TAU); c.fill(); }
        c.fillStyle = '#e63946'; c.beginPath(); c.arc(cx, cy + s * .2, s * .17, 0, TAU); c.fill();
        c.fillStyle = '#3a8dde'; for (const dx of [-.55, .55]) { c.beginPath(); c.arc(cx + dx * s, cy + s * .25, s * .12, 0, TAU); c.fill(); }
      }
      break;
    }
    case 'tally': {
      // tally marks, in fives: four upright strokes and a fifth across them
      const s = Math.max(4, W * .11), hh = W * .22, gw = s * 3, n = Math.max(2, Math.floor((L * .9) / (gw + s * 2.4)));
      c.lineWidth = Math.max(2, W * .065); c.lineCap = 'round';
      for (let g = 0; g < n; g++) {
        const gx = x0 + ((g + .5) * L) / n - gw / 2;
        c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(gx + i * s, -hh); c.lineTo(gx + i * s, hh); } c.stroke();
        c.beginPath(); c.moveTo(gx - s * .6, hh * .7); c.lineTo(gx + gw + s * .6, -hh * .7); c.stroke();
      }
      break;
    }
    case 'sprinkles': {
      const cols = [col, '#ff3c8a', '#ffd23f', '#43b8f0', '#3cb15b', '#ff8a1f', '#8e5bd8'], n = Math.round((L * W) / 70), len = Math.max(3, W * .09);
      c.lineWidth = Math.max(2, W * .055); c.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const x = x0 + hash(i) * L, y = -h + hash(i + 99) * W, a = hash(i + 7) * Math.PI;
        c.strokeStyle = cols[i % cols.length]!; c.beginPath(); c.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
      }
      break;
    }
    case 'question': {
      c.font = `900 ${W * .5}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      for (const [x, y, a] of [[-.32, -.12, -.25], [-.08, .16, .2], [.16, -.14, -.15], [.36, .14, .3]] as const) {
        c.save(); c.translate(x * L, y * W); c.rotate(a); c.lineWidth = 3; c.strokeStyle = O; c.strokeText('?', 0, 0); c.fillText('?', 0, 0); c.restore();
      }
      break;
    }
    default: break;
  }
  c.lineCap = 'butt';
  void trim;
}

function wheelTop(c: CanvasRenderingContext2D, x: number, y: number, t: TyrePart, rim: RimPart, s: number, sy = s) {
  const w = 16 * s, h = 9 * sy;
  c.fillStyle = t.tread === 'gold' ? '#b8901c' : '#1d1f24'; c.strokeStyle = O; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 3); c.fill(); c.stroke();
  // tread: knobbly blocks, paddles, studs
  c.fillStyle = t.tread === 'studded' ? '#dfe5ea' : '#3a3d46';
  if (t.tread === 'knobbly' || t.tread === 'all') for (let i = -1; i <= 1; i++) c.fillRect(x + i * w * .3 - 1.5, y - h / 2, 3, h);
  if (t.tread === 'paddle') for (let i = -1; i <= 1; i++) c.fillRect(x + i * w * .3 - 1, y - h / 2 - 1, 2, h + 2);
  if (t.tread === 'studded') for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(x + i * w * .3, y, 1.4, 0, TAU); c.fill(); }
  c.fillStyle = rim.rainbow ? '#ff7ac8' : rim.color; c.fillRect(x - w * .15, y - h / 2 + 1.5, w * .3, h - 3);
}
const tyreColor = (t: TyrePart) => t.tread === 'gold' ? '#b8901c' : '#1d1f24';
const rimColor = (r: RimPart) => r.rainbow ? '#ff7ac8' : r.color;

/** A tank's track from above: a long belt with cleats that roll by. */
function trackTop(c: CanvasRenderingContext2D, x0: number, y: number, len: number, wid: number, p: Parts, t: number) {
  rrect(c, x0, y - wid / 2, len, wid, 4, tyreColor(p.tyres));
  c.save(); c.beginPath(); c.roundRect(x0, y - wid / 2, len, wid, 4); c.clip();
  c.fillStyle = p.tyres.tread === 'studded' ? '#dfe5ea' : '#4a4e58';
  const roll = (t * 60) % 6;
  for (let x = x0 - 6 + roll; x < x0 + len; x += 6) c.fillRect(x, y - wid / 2, 2.5, wid);
  c.restore();
  c.fillStyle = rimColor(p.rims); c.fillRect(x0 + 3, y - 1.5, len - 6, 3);
}

export interface DrawOpts { boosting?: boolean; t?: number; glow?: string | null; shadow?: boolean }

/** The car from above, pointing right (+x), centred on 0,0, about `len` long at scale 1. */
export function drawCarTop(c: CanvasRenderingContext2D, car: Look, o: DrawOpts = {}) {
  const p = partsOf(car), b = p.body.shape, s = b.style, L = b.len, W = b.wid, h = W / 2, t = o.t ?? 0, x0 = -L / 2, x1 = L / 2;
  const cx = x0 + L * b.cab, main = p.paint.main, trim = p.paint.trim, body = bodyPath(b, L, W);
  if (o.shadow !== false) { c.fillStyle = '#0000003a'; c.beginPath(); c.ellipse(3, 5, L * .55, W * (s === 'ufo' ? .55 : .62), 0, 0, TAU); c.fill(); }
  // the boost flame, behind
  if (o.boosting) drawFlame(c, p.flame, x0 - (s === 'bike' ? 10 : 4), 0, 1, t);
  // wheels (or tracks, or none)
  if (s === 'bike') { wheelTop(c, x1 - 4, 0, p.tyres, p.rims, 1.15, .8); wheelTop(c, x0 + 4, 0, p.tyres, p.rims, 1.15, .9); }
  else if (s === 'tank') for (const y of [-h + 6, h - 6]) trackTop(c, x0 - 3, y, L + 6, 12, p, t);
  else if (s !== 'ufo') {
    const big = s === 'monster', wx = L * (big ? .3 : .32), wy = W / 2 + (b.open ? 5 : big ? 4 : -1), k = b.open ? 1.05 : big ? 1.45 : .95;
    for (const [x, y] of [[wx, -wy], [wx, wy], [-wx, -wy], [-wx, wy]] as const) wheelTop(c, x, y, p.tyres, p.rims, k, big ? 1.35 : k);
  }
  // things that stick out under the body: wings, fins, star points
  if (s === 'jet') {
    for (const k of [-1, 1]) {
      c.beginPath(); c.moveTo(L * .1, k * h * .5); c.lineTo(-L * .26, k * W * .95); c.lineTo(-L * .36, k * W * .95); c.lineTo(-L * .26, k * h * .5); c.closePath(); solid(c, main);
      c.beginPath(); c.moveTo(-L * .3, k * W * .92); c.lineTo(-L * .36, k * W * .92); c.lineTo(-L * .34, k * W * .75); c.lineTo(-L * .28, k * W * .75); c.closePath(); solid(c, trim, 1.5);
      c.beginPath(); c.moveTo(-L * .36, k * h * .5); c.lineTo(x0 - 2, k * W * .52); c.lineTo(x0 - 2, k * h * .3); c.closePath(); solid(c, main);
    }
  } else if (s === 'dragon') {
    for (const k of [-1, 1]) {
      c.beginPath(); c.moveTo(L * .06, k * h * .6); c.quadraticCurveTo(-L * .02, k * W * .95, -L * .14, k * W * .98);
      c.quadraticCurveTo(-L * .14, k * W * .78, -L * .2, k * W * .72); c.quadraticCurveTo(-L * .2, k * W * .6, -L * .26, k * h * .9); c.lineTo(-L * .2, k * h * .5); c.closePath(); solid(c, trim);
      c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L * .02, k * h * .7); c.lineTo(-L * .14, k * W * .95); c.moveTo(L * .02, k * h * .7); c.lineTo(-L * .2, k * W * .72); c.stroke();
    }
  } else if (s === 'star') {
    star(c, -L * .06, 0, W * .95, 5, .4, 0); solid(c, trim);
  }
  // booster cans on the back (behind a jeep's spare tyre)
  const cansX = x0 - 10 - (s === 'jeep' ? 8 : s === 'tank' ? 2 : 0);
  c.fillStyle = '#9aa3ad'; c.strokeStyle = O; c.lineWidth = 2;
  for (let i = 0; i < p.booster.cans; i++) { const y = (i - (p.booster.cans - 1) / 2) * 9; c.beginPath(); c.roundRect(cansX, y - 3.5, 12, 7, 3); c.fill(); c.stroke(); }
  // body
  c.fillStyle = main; c.fill(body);
  c.save(); c.clip(body); drawDecal(c, p.decal, L, s === 'tank' ? W - 20 : W, trim);
  if (s === 'taxi') { // checker strips down both sides
    const q = 4; for (const y0 of [-h + 1, h - 1 - q * 2]) for (let x = x0 - 4, i = 0; x < x1; x += q, i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? O : '#fff'; c.fillRect(x, y0 + j * q, q, q); }
  }
  c.restore();
  c.lineWidth = 3; c.strokeStyle = O; c.stroke(body);
  // engine pipes, at the back
  c.fillStyle = '#5b6170';
  if (s !== 'ufo') for (let i = 0; i < p.engine.pipes; i++) { const y = (i - (p.engine.pipes - 1) / 2) * (s === 'bike' ? 4 : 7); c.beginPath(); c.arc(x0 + (s === 'bike' ? 10 : 6), y, s === 'bike' ? 2 : 2.6, 0, TAU); c.fill(); }
  // the cockpit, and what makes each vehicle that vehicle
  let num: [number, number, number] | null = [cx + L * .22, 0, W * .22];
  const cockpit = (x = cx, rx = L * .13, ry = W * .3) => {
    c.beginPath(); c.ellipse(x, 0, rx, ry, 0, 0, TAU); solid(c, GLASS);
    c.fillStyle = '#ffffff99'; c.beginPath(); c.ellipse(x + 2, -ry * .33, rx * .38, ry * .27, 0, 0, TAU); c.fill();
  };
  const windscreen = (x: number, half: number, deep = 7) => { c.beginPath(); c.moveTo(x, -half); c.lineTo(x + deep, -half * .8); c.lineTo(x + deep, half * .8); c.lineTo(x, half); c.closePath(); solid(c, GLASS, 2); };
  switch (s) {
    case 'pickup': {
      const bedEnd = cx - L * .15;
      rrect(c, x0 + 2, -h + 5, bedEnd - x0 - 2, W - 10, 3, '#00000040', 2);
      c.fillStyle = '#00000026'; for (const y of [-h * .45, 0, h * .45]) c.fillRect(x0 + 5, y - 1.2, bedEnd - x0 - 6, 2.4);
      rrect(c, cx - L * .14, -W * .38, L * .22, W * .76, 5, main, 2.5);
      c.fillStyle = '#ffffff33'; c.fillRect(cx - L * .12, -W * .3, L * .17, W * .6);
      windscreen(cx + L * .08, W * .36, 6);
      c.fillStyle = GLASS; c.fillRect(cx - L * .135, -W * .28, 3, W * .56);
      break;
    }
    case 'jeep': {
      rrect(c, cx - L * .27, -h + 5, L * .38, W - 10, 4, '#2a2d36', 2);
      for (const y of [-1, 1]) { rrect(c, cx - L * .08, y * W * .2 - 5, 10, 10, 3, '#5b6170', 1.5); rrect(c, cx - L * .24, y * W * .2 - 5, 8, 10, 3, '#5b6170', 1.5); }
      disc(c, cx - L * .03, -W * .2, 6, trim); c.fillStyle = '#1d1f24'; c.beginPath(); c.roundRect(cx - L * .03 + 1.5, -W * .2 - 4, 4, 8, 2); c.fill();
      rrect(c, cx - L * .14, -h - 1, 5, W + 2, 2.5, trim, 2);
      rrect(c, cx + L * .12, -h + 3, 4, W - 6, 2, GLASS, 2);
      // the spare tyre on the back
      rrect(c, x0 - 9, -11, 8, 22, 3, tyreColor(p.tyres)); c.fillStyle = rimColor(p.rims); c.fillRect(x0 - 7, -5, 4, 10);
      num = [cx + L * .3, 0, W * .2];
      break;
    }
    case 'taxi': {
      cockpit();
      rrect(c, cx - 4, -W * .3, 9, W * .6, 2, '#ffd23f', 2);
      for (let i = 0; i < 5; i++) { c.fillStyle = O; c.fillRect(cx - 2.5 + (i % 2) * 3, -W * .24 + i * W * .1, 3, W * .05); }
      break;
    }
    case 'icecream': {
      const boxEnd = cx - L * .12;
      rrect(c, x0 + 2, -h + 3, boxEnd - x0 - 2, W - 6, 4, '#ffffffd0', 2.5);
      for (let i = 0, x = x0 + 4; x < boxEnd - 4; x += 5, i++) { c.fillStyle = i % 2 ? '#fff' : '#ff7ac8'; c.fillRect(x, h - 3 - 6, 5, 6); }
      c.strokeStyle = O; c.lineWidth = 1.5; c.strokeRect(x0 + 4, h - 9, boxEnd - x0 - 8, 6);
      // the scoop on the roof, with sprinkles and a cherry
      const sx = x0 + L * .32;
      for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; disc(c, sx + Math.cos(a) * W * .2, Math.sin(a) * W * .2, W * .09, '#ffc4e8', 2); }
      disc(c, sx, 0, W * .22, '#ff9ed2', 2.5);
      for (let i = 0; i < 7; i++) { const a = i * 2.1, r = W * (.08 + (i % 3) * .04); c.strokeStyle = ['#3a8dde', '#ffd23f', '#3cb15b', '#fff'][i % 4]!; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx + Math.cos(a) * r, Math.sin(a) * r); c.lineTo(sx + Math.cos(a) * r + 2.5, Math.sin(a) * r + 1); c.stroke(); }
      c.lineCap = 'butt';
      disc(c, sx, 0, 4, '#e63946', 2); c.fillStyle = '#ffffffcc'; c.beginPath(); c.arc(sx + 1, -1.3, 1.2, 0, TAU); c.fill();
      windscreen(cx + L * .04, W * .38, 7);
      num = [x0 + L * .08, 0, W * .17];
      break;
    }
    case 'police': {
      cockpit();
      const on = flash(t);
      if (on) { c.fillStyle = '#ff3b3b66'; c.beginPath(); c.arc(cx - 1, -W * .18, 10, 0, TAU); c.fill(); } else { c.fillStyle = '#3b8bff66'; c.beginPath(); c.arc(cx - 1, W * .18, 10, 0, TAU); c.fill(); }
      rrect(c, cx - 4, -W * .34, 7, W * .34, 2, on ? '#ff3b3b' : '#a3132a', 2); rrect(c, cx - 4, 0, 7, W * .34, 2, on ? '#1f4fa8' : '#3b8bff', 2);
      star(c, x0 + L * .25, 0, W * .17); solid(c, '#ffd23f', 1.5);
      break;
    }
    case 'fire': {
      const cabBack = cx - L * .1;
      windscreen(cx + L * .08, W * .38, 7);
      // the ladder, lying along the top
      const lx0 = x0 - 6, lx1 = cabBack - 2, ly = 7;
      c.strokeStyle = O; c.lineWidth = 5; c.beginPath(); for (let x = lx0 + 4; x < lx1; x += 6) { c.moveTo(x, -ly); c.lineTo(x, ly); } c.stroke();
      c.strokeStyle = '#e6e9ef'; c.lineWidth = 2.4; c.stroke();
      for (const y of [-ly, ly]) rrect(c, lx0, y - 2.5, lx1 - lx0, 5, 2, '#e6e9ef', 2);
      // a hose reel and a locker
      disc(c, x0 + L * .2, -h + 6.5, 4.5, '#ffd23f', 1.5); disc(c, x0 + L * .2, -h + 6.5, 1.6, O, 0);
      rrect(c, x0 + L * .14, h - 9, L * .14, 5, 2, '#c9ccd6', 1.5);
      // the lights on the cab roof, and the number
      const on = flash(t);
      if (on) { c.fillStyle = '#ff3b3b66'; c.beginPath(); c.arc(cabBack + 4, 0, 11, 0, TAU); c.fill(); }
      rrect(c, cabBack + 1, -W * .3, 6, W * .6, 2, on ? '#ff3b3b' : '#a3132a', 2);
      num = [cx + L * .01, 0, W * .17];
      break;
    }
    case 'monster': {
      cockpit(cx, L * .12, W * .28);
      break;
    }
    case 'limo': {
      windscreen(cx + L * .02, W * .38, 8);
      rrect(c, x0 + L * .1, -W * .36, cx - x0 - L * .1, W * .72, 6, main, 2.5);
      c.fillStyle = '#00000018'; c.fillRect(x0 + L * .1 + 2, -W * .34, cx - x0 - L * .1 - 4, W * .68);
      for (const y of [-1, 1]) { c.fillStyle = GLASS; c.fillRect(x0 + L * .13, y * W * .3 - 2, cx - x0 - L * .16, 4); }
      rrect(c, x0 + L * .3, -W * .14, L * .16, W * .28, 3, GLASS, 1.5);
      c.fillStyle = '#ffffff99'; c.fillRect(x0 + L * .32, -W * .1, L * .05, W * .07);
      num = [cx + L * .2, 0, W * .2];
      break;
    }
    case 'bike': {
      // handlebars, the rider's shoulders, arms and helmet
      const hx = cx + L * .17;
      c.strokeStyle = O; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, -W * .62); c.lineTo(hx, W * .62); c.stroke();
      c.strokeStyle = '#9aa3ad'; c.lineWidth = 2; c.stroke(); c.lineCap = 'butt';
      for (const y of [-1, 1]) rrect(c, hx - 2.5, y * W * .62 - 2.5, 5, 5, 2, '#1d1f24', 1.5);
      c.strokeStyle = O; c.lineWidth = 5.5; c.lineCap = 'round'; c.beginPath(); for (const y of [-1, 1]) { c.moveTo(cx - 2, y * W * .4); c.lineTo(hx, y * W * .55); } c.stroke();
      c.strokeStyle = '#2a2d36'; c.lineWidth = 3; c.stroke(); c.lineCap = 'butt';
      c.beginPath(); c.ellipse(cx - 3, 0, 6, W * .5, 0, 0, TAU); solid(c, '#2a2d36', 2);
      disc(c, cx + 1, 0, 7.5, trim, 2.5);
      c.fillStyle = '#1d1f24'; c.beginPath(); c.arc(cx + 1, 0, 7.5, -1, 1); c.lineTo(cx + 4, 0); c.closePath(); c.fill();
      c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(cx - 1, -3, 2, 0, TAU); c.fill();
      num = [x0 + L * .2, 0, W * .3];
      break;
    }
    case 'tank': {
      // the turret and its (toy) barrel
      rrect(c, cx + 4, -3.5, x1 + 8 - cx - 4, 7, 3, '#5b6170', 2);
      rrect(c, x1 + 4, -4.5, 6, 9, 2.5, trim, 2);
      disc(c, cx, 0, W * .28, main, 3);
      c.strokeStyle = trim; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, 0, W * .28 - 3.5, 0, TAU); c.stroke();
      disc(c, cx - W * .12, -W * .12, 3.5, '#5b6170', 1.5);
      num = [cx + 1, 2, W * .14];
      break;
    }
    case 'jet': {
      cockpit(cx, L * .17, W * .22);
      rrect(c, x0 - 6, -6, 9, 12, 3, '#5b6170', 2); c.fillStyle = '#1d1f24'; c.fillRect(x0 - 6, -3.5, 3, 7);
      rrect(c, x0 + 2, -2, L * .2, 4, 2, trim, 1.5); // the tail fin, edge-on
      num = [cx + L * .24, 0, W * .2];
      break;
    }
    case 'ufo': {
      const R = W / 2, cols = [trim, '#ffd23f', '#39ff88', '#ff7ac8'];
      c.strokeStyle = '#00000055'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, L / 2 * .66, R * .66, 0, 0, TAU); c.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12, lit = (i + Math.floor(t * 8)) % 3 === 0, x = Math.cos(a) * L / 2 * .84, y = Math.sin(a) * R * .84;
        if (lit) { c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill(); }
        disc(c, x, y, 3, cols[i % cols.length]!, 1.5);
      }
      disc(c, 0, 0, R * .42, GLASS, 2.5);
      disc(c, -2, 0, R * .2, '#7be36b', 2); // the pilot
      c.fillStyle = O; for (const y of [-2.2, 2.2]) { c.beginPath(); c.arc(1, y, 1.6, 0, TAU); c.fill(); }
      c.fillStyle = '#ffffff99'; c.beginPath(); c.ellipse(R * .14, -R * .2, R * .1, R * .06, -.5, 0, TAU); c.fill();
      num = [L / 2 * .62, 0, R * .2];
      break;
    }
    case 'dragon': {
      cockpit();
      // spikes down the spine (round the number), eyes, horns and nostrils on the snout
      const nx = x0 + L * .16;
      for (let x = cx - L * .17; x > x0 + 4; x -= 8) { if (Math.abs(x - nx) < W * .2 + 3) continue; c.beginPath(); c.moveTo(x + 5, 0); c.lineTo(x, -3.5); c.lineTo(x - 5, 0); c.lineTo(x, 3.5); c.closePath(); solid(c, trim, 1.5); }
      const ex = x1 - L * .2;
      for (const k of [-1, 1]) {
        c.beginPath(); c.moveTo(ex - 2, k * W * .24); c.lineTo(ex - 14, k * W * .44); c.lineTo(ex - 4, k * W * .32); c.closePath(); solid(c, '#fff6c2', 1.5);
        disc(c, ex, k * W * .17, 4.2, '#fff', 1.5); c.fillStyle = O; c.beginPath(); c.arc(ex + 1.5, k * W * .17, 2, 0, TAU); c.fill();
        c.beginPath(); c.arc(x1 - 5, k * 2.5, 1.4, 0, TAU); c.fill();
      }
      num = [nx, 0, W * .2];
      break;
    }
    case 'star': {
      cockpit();
      for (let i = 0; i < 5; i++) { const k = (Math.sin(t * 6 + i * 1.7) + 1) / 2, a = i * 1.26 + 1; twinkle(c, -L * .08 + Math.cos(a) * W * .6, Math.sin(a) * W * .3, 2.5 + k * 3); solid(c, '#fff6c2', 1.2); }
      break;
    }
    default: cockpit(); break;
  }
  // the race number in a circle on the bonnet
  if (car.number !== undefined && num) {
    const [nx, ny, nr] = num;
    if (s || nx < x1 - 8) numberDisc(c, car.number, nx, ny, nr, true, 1.5);
  }
  // the wing, across the back
  if (p.wing.size > 0) {
    const ww = W * (.9 + p.wing.size * .35), x = x0 + 2;
    c.fillStyle = trim; c.strokeStyle = O; c.lineWidth = 2.5;
    const bar = (dx: number) => { c.beginPath(); c.roundRect(x + dx - 3, -ww / 2, 7, ww, 3); c.fill(); c.stroke(); };
    bar(0); if (p.wing.twin) bar(9);
    if (p.wing.fin) { c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(cx, -1.5); c.lineTo(cx, 1.5); c.closePath(); c.fill(); c.stroke(); }
  }
  if (o.glow) { c.lineWidth = 4; c.strokeStyle = o.glow; c.stroke(bodyPath(b.style === 'tank' ? { ...b, style: undefined, nose: 'square' } : b, L + 10, W + 10)); }
}

/** The boost flame (or sparks, bubbles, lightning, hearts, confetti, a ribbon, a comet) coming out of the back, pointing left from (x, y). */
export function drawFlame(c: CanvasRenderingContext2D, f: FlamePart, x: number, y: number, k: number, t: number) {
  const flick = 1 + Math.sin(t * 40) * .12, len = 34 * k * flick;
  /** Where along the trail each of `n` things is, 0 at the car to 1 at the end, drifting back over time. */
  const along = (i: number, n: number, speed = 2.2) => (i / n + t * speed) % 1;
  if (f.kind === 'flame') {
    f.colors.forEach((col, i) => {
      const s = 1 - i / f.colors.length;
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 9 * s * k); c.quadraticCurveTo(x - len * s, y - 4 * s, x - len * s * 1.2, y); c.quadraticCurveTo(x - len * s, y + 4 * s, x, y + 9 * s * k); c.fill();
    });
  } else if (f.kind === 'stars') {
    f.colors.forEach((col, i) => { c.fillStyle = col; star(c, x - 10 - i * 12 * k, y + Math.sin(t * 20 + i) * 6, 6 * k); c.fill(); });
  } else if (f.kind === 'bubbles') {
    c.lineWidth = 2; f.colors.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(x - 8 - i * 11 * k, y + Math.sin(t * 14 + i * 2) * 7, (4 + i) * k, 0, TAU); c.stroke(); });
  } else if (f.kind === 'hearts') {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u = along(i, n), r = (3.5 + u * 4.5) * k;
      c.globalAlpha = 1 - u * .5; heart(c, x - 4 * k - u * len * 1.4, y + Math.sin(u * 8 + i * 2) * 7 * k, r);
      c.fillStyle = f.colors[i % f.colors.length]!; c.fill();
    }
    c.globalAlpha = 1;
  } else if (f.kind === 'confetti') {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const u = along(i, n, 1.8), px = x - 3 * k - u * len * 1.6, py = y + (hash(i) - .5) * (6 + u * 30) * k, a = t * 9 + i * 1.3;
      c.save(); c.translate(px, py); c.rotate(a); c.globalAlpha = 1 - u * .6; c.fillStyle = f.colors[i % f.colors.length]!;
      if (i % 2) c.fillRect(-2.5 * k, -2.5 * k, 5 * k, 5 * k); else c.fillRect(-4 * k, -1.2 * k, 8 * k, 2.4 * k);
      c.restore();
    }
    c.globalAlpha = 1;
  } else if (f.kind === 'ribbon') {
    // rainbow bands, one above the other, waving more the further back they go
    const n = f.colors.length, band = 2.6 * k, span = len * 1.9, seg = 3 * k;
    for (let d = 0; d < span; d += seg) {
      const u = d / span, wave = (q: number) => y + Math.sin(q * .14 / k - t * 14) * 6 * k * (q / span + .15);
      c.globalAlpha = 1 - u * .85;
      f.colors.forEach((col, i) => {
        const off = (i - (n - 1) / 2) * band * (1 - u * .3);
        c.fillStyle = col; c.beginPath(); c.moveTo(x - d, wave(d) + off - band / 2); c.lineTo(x - d - seg - .6, wave(d + seg) + off - band / 2); c.lineTo(x - d - seg - .6, wave(d + seg) + off + band / 2); c.lineTo(x - d, wave(d) + off + band / 2); c.closePath(); c.fill();
      });
    }
    c.globalAlpha = 1;
  } else if (f.kind === 'comet') {
    // a big glowing tail, brightest at the head, with sparkles in it
    const tail = len * 2.1, [c0, c1, c2] = [f.colors[0]!, f.colors[1] ?? '#fff', f.colors[2] ?? '#fff'];
    const cone = (w: number, l: number, col: string, a: number) => {
      const g = c.createLinearGradient(x, y, x - l, y); g.addColorStop(0, col); g.addColorStop(1, col + '00');
      c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.moveTo(x + 2 * k, y - w * .6); c.quadraticCurveTo(x - l * .3, y - w, x - l, y); c.quadraticCurveTo(x - l * .3, y + w, x + 2 * k, y + w * .6); c.fill();
    };
    cone(14 * k, tail, c0, .55); cone(9 * k, tail * .75, c1, .85); cone(4.5 * k, tail * .5, c2, 1);
    c.globalAlpha = 1;
    const g = c.createRadialGradient(x, y, 0, x, y, 12 * k); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, c1); g.addColorStop(1, c0 + '00');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 12 * k, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) { const u = along(i, 6, 1.5), tw = (Math.sin(t * 25 + i * 2) + 1) / 2; twinkle(c, x - u * tail * .85, y + (hash(i + 3) - .5) * 16 * k * (1 - u * .5), (1.5 + tw * 2.5) * k); c.fill(); }
  } else {
    c.lineWidth = 3; c.strokeStyle = f.colors[0]!; c.beginPath(); c.moveTo(x, y);
    for (let i = 1; i <= 5; i++) c.lineTo(x - i * 8 * k, y + ((i + Math.floor(t * 20)) % 2 ? 7 : -7)); c.stroke();
    c.strokeStyle = f.colors[1]!; c.lineWidth = 1.5; c.stroke();
  }
}

function wheelSide(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: TyrePart, rim: RimPart, spin: number) {
  c.fillStyle = tyreColor(t); c.strokeStyle = O; c.lineWidth = 3;
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

/** A race car's side: a cabin bump (or an open top) and the nose. */
function plainSide(b: BodyShape, x0: number, x1: number, L: number, top: number, bb: number, roof = 20) {
  const q = new Path2D();
  q.moveTo(x0, bb); q.lineTo(x0, top + 6);
  if (b.open) { q.lineTo(x0 + L * .2, top + 4); q.lineTo(x0 + L * (b.cab - .05), top); q.lineTo(x0 + L * (b.cab + .2), top + 6); }
  else { q.lineTo(x0 + L * (b.cab - .2), top + 4); q.quadraticCurveTo(x0 + L * (b.cab - .1), top - roof * .9, x0 + L * b.cab, top - roof); q.quadraticCurveTo(x0 + L * (b.cab + .15), top - roof * .9, x0 + L * (b.cab + .22), top + 4); }
  if (b.nose === 'point') q.lineTo(x1, bb - 4);
  else if (b.nose === 'wedge') { q.lineTo(x1 - 6, top + (bb - top) * .55); q.lineTo(x1, bb - 2); }
  else if (b.nose === 'square') { q.lineTo(x1, top + 4); q.lineTo(x1, bb); }
  else q.quadraticCurveTo(x1 + 4, top + 6, x1, bb);
  q.closePath();
  return q;
}

/** The car from the side, facing right, standing on y = 0, centred on x = 0. About 2 × its length wide, and always inside SIDE_SPAN. */
export function drawCarSide(c: CanvasRenderingContext2D, car: Look, o: DrawOpts = {}) {
  const p = partsOf(car), b = p.body.shape, s = b.style, t = o.t ?? 0, spin = t * 6, main = p.paint.main, trim = p.paint.trim;
  const L = Math.min(b.len * 2.2, 180), x0 = -L / 2, x1 = L / 2;
  let r = b.open ? 21 : 18, H = 26 + (b.open ? 0 : 10), lift = b.open ? 2 : 6;
  if (s === 'monster') { r = 29; H = 28; lift = 16; }
  else if (s === 'jet') { r = 16; H = 28; }
  else if (s === 'limo') H = 32;
  else if (s === 'jeep') H = 30;
  else if (s === 'bike') r = 19;
  const axle = -r, bb = axle - lift, top = bb - H, hover = Math.sin(t * 3) * 3;
  // each vehicle's outline, the band its decal fills, where its wheels go, its number, its wing and its flame
  let body: Path2D, dTop = top, dBot = bb, wheels = [x0 + L * .2, x1 - L * .2], num: [number, number, number] | null = [x0 + L * (b.cab + .02), (top + bb) / 2 + 2, Math.min(H * .38, 13)];
  let wingX = x0 + 4, wingBase = top + 2, flame: [number, number] = [x0 - 8, bb - H * .35], cans: [number, number] = [x0 - 16, top + 4], pipes = true;
  const ufoY = -44 + hover;
  switch (s) {
    case 'pickup': {
      const q = new Path2D(), back = x0 + L * .42, front = x0 + L * .68;
      q.moveTo(x0, bb); q.lineTo(x0, top + 10); q.lineTo(back, top + 10); q.lineTo(back, top - 20); q.quadraticCurveTo(back, top - 24, back + 5, top - 24);
      q.lineTo(front - 14, top - 24); q.lineTo(front, top + 2); q.lineTo(x1 - 3, top + 4); q.quadraticCurveTo(x1, top + 4, x1, top + 8); q.lineTo(x1, bb); q.closePath();
      body = q; dTop = top + 10; cans = [x0 - 16, top + 12]; wingBase = top + 12;
      break;
    }
    case 'jeep': {
      const q = new Path2D(); q.moveTo(x0, bb); q.lineTo(x0, top + 3); q.quadraticCurveTo(x0, top, x0 + 3, top); q.lineTo(x1 - 4, top + 3); q.quadraticCurveTo(x1, top + 3, x1, top + 7); q.lineTo(x1, bb); q.closePath();
      body = q; cans = [x0 - 24, top + 2]; num = [x0 + L * .45, (top + bb) / 2 + 2, 11];
      break;
    }
    case 'icecream': {
      const q = new Path2D(), boxEnd = x0 + L * .64, boxTop = bb - 42;
      q.moveTo(x0, bb); q.lineTo(x0, boxTop + 4); q.quadraticCurveTo(x0, boxTop, x0 + 4, boxTop); q.lineTo(boxEnd, boxTop); q.lineTo(x0 + L * .8, top + 14); q.lineTo(x1 - 3, top + 18);
      q.quadraticCurveTo(x1, top + 18, x1, top + 22); q.lineTo(x1, bb); q.closePath();
      body = q; dTop = boxTop; wingBase = boxTop + 2; cans = [x0 - 16, boxTop + 10]; num = [x0 + L * .075, boxTop + 24, 10];
      break;
    }
    case 'fire': {
      const q = new Path2D(), cab = x0 + L * .68, boxTop = bb - 40;
      q.moveTo(x0, bb); q.lineTo(x0, boxTop); q.lineTo(cab, boxTop); q.lineTo(cab, boxTop - 4); q.lineTo(x1 - 8, boxTop - 4); q.lineTo(x1, boxTop + 14); q.lineTo(x1, bb); q.closePath();
      body = q; dTop = boxTop - 4; wingBase = boxTop + 2; wheels = [x0 + L * .14, x0 + L * .3, x1 - L * .12]; num = [x0 + L * .78, boxTop + 23, 8.5]; cans = [x0 - 16, boxTop + 8];
      break;
    }
    case 'limo': {
      const q = new Path2D(), rb = x0 + L * .14, rf = x0 + L * .74;
      q.moveTo(x0, bb); q.lineTo(x0, top + 6); q.lineTo(rb - 10, top + 3); q.quadraticCurveTo(rb, top - 17, rb + 12, top - 17); q.lineTo(rf, top - 17); q.quadraticCurveTo(rf + 10, top - 15, x0 + L * .84, top + 4);
      q.lineTo(x1 - 3, top + 7); q.quadraticCurveTo(x1, top + 7, x1, top + 11); q.lineTo(x1, bb); q.closePath();
      body = q; wheels = [x0 + L * .16, x1 - L * .16]; num = [x0 + L * .66, (top + bb) / 2 + 3, 11];
      break;
    }
    case 'bike': {
      const q = new Path2D(), a = axle;
      q.moveTo(x0 + L * .04, a - 26); q.lineTo(x0 + L * .3, a - 27); q.quadraticCurveTo(x0 + L * .42, a - 40, x0 + L * .56, a - 36);
      q.lineTo(x0 + L * .72, a - 44); q.quadraticCurveTo(x1 - L * .06, a - 30, x1 - L * .04, a - 16); q.lineTo(x0 + L * .7, a - 8); q.lineTo(x0 + L * .5, a - 2);
      q.lineTo(x0 + L * .34, a - 6); q.lineTo(x0 + L * .2, a - 16); q.quadraticCurveTo(x0 + L * .04, a - 18, x0 + L * .04, a - 26); q.closePath();
      body = q; dTop = a - 44; dBot = a; wheels = [x0 + L * .14, x1 - L * .14]; num = [x0 + L * .82, a - 26, 9];
      wingX = x0 + L * .02; wingBase = a - 25; flame = [x0 + L * .02, a - 14]; cans = [x0 - 10, a - 34]; pipes = false;
      break;
    }
    case 'tank': {
      const q = new Path2D(), hullTop = -50, hb = -27, tx0 = x0 + L * .28, tx1 = x0 + L * .66;
      q.moveTo(x0 + 2, hb); q.lineTo(x0, hullTop + 6); q.lineTo(x0 + 6, hullTop); q.lineTo(x1 - 26, hullTop); q.lineTo(x1, hullTop + 12); q.lineTo(x1 - 6, hb); q.closePath();
      q.moveTo(tx0, hullTop); q.lineTo(tx0 + 6, hullTop - 18); q.quadraticCurveTo(tx0 + 10, hullTop - 22, tx0 + 18, hullTop - 22); q.lineTo(tx1 - 10, hullTop - 22); q.quadraticCurveTo(tx1, hullTop - 20, tx1, hullTop); q.closePath();
      body = q; dTop = hullTop - 22; dBot = hb; num = [x0 + L * .4, hullTop - 10, 9]; wingBase = hullTop + 2; cans = [x0 - 16, hullTop + 2]; flame = [x0 - 8, hb - 10]; wheels = [];
      break;
    }
    case 'jet': {
      const q = new Path2D(), cp = x0 + L * b.cab;
      q.moveTo(x0, bb); q.lineTo(x0, top + 4); q.lineTo(cp - L * .16, top + 2); q.quadraticCurveTo(cp - L * .06, top - 16, cp + L * .04, top - 14);
      q.quadraticCurveTo(cp + L * .14, top - 10, cp + L * .2, top + 8); q.quadraticCurveTo(x1 - L * .05, top + H * .45, x1, bb - H * .3); q.quadraticCurveTo(x1 - L * .1, bb, x1 - L * .2, bb); q.closePath();
      body = q; flame = [x0 - 14, bb - H * .45]; cans = [x0 - 16, top - 6]; pipes = false; num = [x0 + L * .44, (top + bb) / 2 + 2, 10];
      break;
    }
    case 'ufo': {
      const q = new Path2D(); q.ellipse(0, ufoY, L / 2, 13, 0, 0, TAU);
      body = q; dTop = ufoY - 13; dBot = ufoY + 13; wheels = []; num = [-L * .28, ufoY + 1, 8.5]; wingX = x0 + 12; wingBase = ufoY - 8; flame = [x0 - 2, ufoY]; cans = [x0 - 10, ufoY - 4]; pipes = false;
      break;
    }
    case 'dragon': {
      body = plainSide({ ...b, nose: 'wedge' }, x0, x1 - 18, L - 18, top, bb);
      dTop = top; num = [x0 + L * (b.cab - .02), (top + bb) / 2 + 2, 12];
      break;
    }
    default: body = plainSide(b, x0, x1, L, top, bb, s === 'monster' ? 18 : 20);
  }
  if (o.shadow !== false) { c.fillStyle = '#00000033'; c.beginPath(); c.ellipse(0, 2, L * (s === 'ufo' ? .4 + hover * .01 : .55), 6, 0, 0, TAU); c.fill(); }
  if (s === 'ufo') { // the tractor beam's glow under it
    const g = c.createLinearGradient(0, ufoY, 0, 0); g.addColorStop(0, '#fff6c2aa'); g.addColorStop(1, '#fff6c200');
    c.fillStyle = g; c.beginPath(); c.moveTo(-L * .16, ufoY + 8); c.lineTo(L * .16, ufoY + 8); c.lineTo(L * .3, 0); c.lineTo(-L * .3, 0); c.closePath(); c.fill();
  }
  if (o.boosting) drawFlame(c, p.flame, flame[0], flame[1], 1.4, t);
  // booster cans on the back
  c.fillStyle = '#9aa3ad'; c.strokeStyle = O; c.lineWidth = 2.5;
  for (let i = 0; i < Math.min(2, p.booster.cans); i++) { c.beginPath(); c.roundRect(cans[0], cans[1] + i * 11, 22, 9, 4); c.fill(); c.stroke(); }
  // behind the body: a monster truck's springs, a jet's tail fin, a dragon's wing, a star's points, a bike's frame and rider's far leg
  if (s === 'monster') {
    for (const x of wheels) {
      c.strokeStyle = O; c.lineWidth = 7; c.beginPath(); c.moveTo(x, axle); c.lineTo(x + (x < 0 ? 10 : -10), bb + 2); c.stroke();
      c.strokeStyle = '#e6e9ef'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 6; i++) { const u = i / 6; c.lineTo(x + (x < 0 ? 10 : -10) * u + (i % 2 ? 4 : -4), axle + (bb + 2 - axle) * u); } c.stroke();
    }
  } else if (s === 'jet') {
    c.beginPath(); c.moveTo(x0 + 2, top + 4); c.lineTo(x0 + 4, top - 30); c.lineTo(x0 + L * .13, top - 30); c.lineTo(x0 + L * .3, top + 4); c.closePath(); solid(c, main, 3);
    c.fillStyle = trim; c.fillRect(x0 + 6, top - 26, L * .1, 5);
  } else if (s === 'dragon') {
    const wx = x0 + L * .4;
    c.beginPath(); c.moveTo(wx, top + 2); c.quadraticCurveTo(wx - 10, top - 26, wx - 34, top - 34); c.quadraticCurveTo(wx - 34, top - 22, wx - 44, top - 18);
    c.quadraticCurveTo(wx - 40, top - 8, wx - 50, top - 2); c.quadraticCurveTo(wx - 30, top - 4, wx - 20, top + 4); c.closePath(); solid(c, trim, 2.5);
    c.strokeStyle = O; c.lineWidth = 1.8; c.beginPath(); c.moveTo(wx - 4, top - 6); c.lineTo(wx - 34, top - 33); c.moveTo(wx - 4, top - 6); c.lineTo(wx - 44, top - 18); c.moveTo(wx - 4, top - 6); c.lineTo(wx - 49, top - 2); c.stroke();
  } else if (s === 'star') {
    star(c, x0 + L * .1, top - 8, 16, 5, .45); solid(c, trim, 2.5);
  } else if (s === 'bike') {
    c.strokeStyle = O; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(wheels[0]!, axle); c.lineTo(x0 + L * .42, axle - 10); c.moveTo(wheels[1]!, axle); c.lineTo(x0 + L * .74, axle - 38); c.stroke();
    c.strokeStyle = '#9aa3ad'; c.lineWidth = 3.5; c.stroke();
    // the exhaust, silver, from the engine to under the tail
    c.strokeStyle = O; c.lineWidth = 7; c.beginPath(); c.moveTo(x0 + L * .46, axle - 2); c.lineTo(x0 + L * .2, axle - 12); c.lineTo(x0 + L * .02, axle - 15); c.stroke();
    c.strokeStyle = p.engine.pipes > 2 ? '#e8b923' : '#c9ccd6'; c.lineWidth = 3.5; c.stroke(); c.lineCap = 'butt';
  }
  // the body, its decal and its outline
  c.fillStyle = main; c.fill(body);
  c.save(); c.clip(body); c.translate(0, (dTop + dBot) / 2); drawDecal(c, p.decal, L, dBot - dTop, trim); c.translate(0, -(dTop + dBot) / 2);
  if (s === 'taxi') { const q = 4.5; for (let x = x0, i = 0; x < x1; x += q, i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? O : '#fff'; c.fillRect(x, bb - 15 + j * q, q, q); } }
  if (s === 'fire') { c.fillStyle = '#ffffff'; c.fillRect(x0, bb - 12, L, 4); }
  if (s === 'police') { c.fillStyle = '#ffffff'; c.fillRect(x0 + L * .28, top + 8, L * .38, H - 12); }
  c.restore();
  c.lineWidth = 3.5; c.strokeStyle = O; c.lineJoin = 'round'; c.stroke(body); c.lineJoin = 'miter';
  // windows, and what makes each vehicle that vehicle
  const sideWindow = (q: [number, number][]) => { c.beginPath(); for (const [x, y] of q) c.lineTo(x, y); c.closePath(); solid(c, GLASS, 2.5); };
  const helmet = (x: number, y: number, rr = 11) => { disc(c, x, y, rr, trim, 2.5); c.fillStyle = '#1d1f24'; c.beginPath(); c.roundRect(x + 1, y - 4, rr * .82, rr * .55, 2); c.fill(); };
  switch (s) {
    case 'pickup': {
      const back = x0 + L * .42, front = x0 + L * .68;
      sideWindow([[back + 7, top - 18], [front - 16, top - 18], [front - 5, top], [back + 7, top]]);
      rrect(c, x0 - 1, top + 7, back - x0 + 2, 5, 2, trim, 2); // the bed's rail
      c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 5, top + 14); c.lineTo(x0 + 5, bb - 4); c.stroke(); // tailgate
      rrect(c, x1 - 4, bb - 12, 7, 8, 2, '#c9ccd6', 2);
      break;
    }
    case 'jeep': {
      const ws = x0 + L * (b.cab + .2), rb = x0 + L * (b.cab - .16);
      helmet(x0 + L * b.cab, top - 7);
      c.strokeStyle = O; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(rb - 8, top + 1); c.lineTo(rb - 6, top - 26); c.lineTo(rb + 10, top - 26); c.lineTo(rb + 12, top + 1); c.stroke();
      c.strokeStyle = trim; c.lineWidth = 4; c.stroke(); c.lineCap = 'butt';
      c.beginPath(); c.moveTo(ws, top + 1); c.lineTo(ws - 6, top - 22); c.lineTo(ws - 2, top - 22); c.lineTo(ws + 4, top + 1); c.closePath(); solid(c, GLASS, 2.5);
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x1 - 3, top + 9, 4, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke(); // headlight
      for (let i = 0; i < 3; i++) { c.fillStyle = '#00000033'; c.fillRect(x0 + L * .15 + i * 10, top + 7, 6, 3); }
      // the spare tyre on the back
      c.beginPath(); c.ellipse(x0 - 4, (top + bb) / 2, 7, 16, 0, 0, TAU); solid(c, tyreColor(p.tyres), 2.5);
      c.beginPath(); c.ellipse(x0 - 4, (top + bb) / 2, 3, 8, 0, 0, TAU); solid(c, rimColor(p.rims), 1.5);
      break;
    }
    case 'taxi': {
      const roofX = x0 + L * b.cab;
      sideWindow([[x0 + L * (b.cab - .14), top + 3], [x0 + L * (b.cab - .12), top - 10], [roofX, top - 14], [x0 + L * (b.cab + .14), top + 3]]);
      rrect(c, roofX - 15, top - 31, 30, 12, 3, '#ffd23f', 2.5);
      c.fillStyle = O; c.font = '900 9px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', roofX, top - 24.5);
      c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(roofX - 8, top - 19); c.lineTo(roofX - 8, top - 17); c.moveTo(roofX + 8, top - 19); c.lineTo(roofX + 8, top - 17); c.stroke();
      break;
    }
    case 'icecream': {
      const boxTop = bb - 42, cx = x0 + L * .3;
      sideWindow([[x0 + L * .67, boxTop + 8], [x0 + L * .74, boxTop + 8], [x0 + L * .79, top + 15], [x0 + L * .67, top + 15]]);
      // the serving window, its counter and a striped awning
      rrect(c, x0 + L * .16, boxTop + 13, L * .4, 20, 3, '#bfe8ff', 2.5);
      c.fillStyle = '#ffffff99'; c.fillRect(x0 + L * .19, boxTop + 16, 6, 14);
      rrect(c, x0 + L * .14, boxTop + 32, L * .44, 5, 2, trim, 2);
      c.beginPath(); c.moveTo(x0 + L * .13, boxTop + 5); c.lineTo(x0 + L * .59, boxTop + 5);
      for (let i = 7; i >= 0; i--) { const x = x0 + L * .13 + (i + .5) * L * .46 / 8; c.arc(x, boxTop + 14, L * .46 / 16, 0, Math.PI); }
      c.closePath(); c.save(); c.clip();
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff7ac8'; c.fillRect(x0 + L * .13 + i * L * .46 / 8, boxTop, L * .46 / 8 + .5, 20); }
      c.restore(); c.lineWidth = 2.5; c.strokeStyle = O; c.stroke();
      // the big cone on the roof: the scoop, then the cone over its bottom, sprinkles and a cherry
      disc(c, cx, boxTop - 19, 9.5, '#ff9ed2', 2.5);
      for (const [dx, dy, k] of [[-5, -23, '#3a8dde'], [2, -25, '#ffd23f'], [-1, -19, '#3cb15b'], [4, -20, '#fff']] as const) { c.fillStyle = k; c.fillRect(cx + dx, boxTop + dy, 3, 1.6); }
      c.beginPath(); c.moveTo(cx, boxTop + 1); c.lineTo(cx - 10, boxTop - 13); c.quadraticCurveTo(cx, boxTop - 10, cx + 10, boxTop - 13); c.closePath(); solid(c, '#e0a458', 2.5);
      c.strokeStyle = '#a8702f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - 5, boxTop - 10); c.lineTo(cx + 2, boxTop - 2); c.moveTo(cx + 5, boxTop - 10); c.lineTo(cx - 2, boxTop - 2); c.stroke();
      disc(c, cx + 1, boxTop - 29, 3.2, '#e63946', 2);
      break;
    }
    case 'police': {
      const roofX = x0 + L * b.cab, on = flash(t);
      sideWindow([[x0 + L * (b.cab - .14), top + 3], [x0 + L * (b.cab - .12), top - 10], [roofX, top - 14], [x0 + L * (b.cab + .14), top + 3]]);
      c.globalAlpha = .45; c.fillStyle = on ? '#ff3b3b' : '#3b8bff'; c.beginPath(); c.arc(roofX + (on ? -7 : 7), top - 23, 13, 0, TAU); c.fill(); c.globalAlpha = 1;
      rrect(c, roofX - 15, top - 27, 15, 7, 2, on ? '#ff3b3b' : '#a3132a', 2.5); rrect(c, roofX, top - 27, 15, 7, 2, on ? '#1f4fa8' : '#3b8bff', 2.5);
      star(c, x0 + L * (b.cab - .2), (top + bb) / 2 + 2, 9); solid(c, '#ffd23f', 2);
      c.strokeStyle = O; c.lineWidth = 5; c.beginPath(); c.moveTo(x1 + 3, top + 10); c.lineTo(x1 + 3, bb - 2); c.stroke(); // push bar
      break;
    }
    case 'fire': {
      const cab = x0 + L * .68, boxTop = bb - 40, on = flash(t);
      sideWindow([[cab + 6, boxTop + 1], [x1 - 11, boxTop + 1], [x1 - 4, boxTop + 15], [cab + 6, boxTop + 15]]);
      c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cab, boxTop); c.lineTo(cab, bb); c.stroke();
      for (let i = 0; i < 3; i++) { const lx = x0 + 6 + i * L * .2; rrect(c, lx, boxTop + 6, L * .17, 18, 3, '#00000022', 2); c.strokeStyle = '#00000033'; c.lineWidth = 1.5; c.beginPath(); for (let y = boxTop + 10; y < boxTop + 23; y += 4) { c.moveTo(lx + 3, y); c.lineTo(lx + L * .17 - 3, y); } c.stroke(); }
      // the ladder on top, rising a little to the back, and its stand
      const lf = cab - 4, ly = boxTop - 6;
      c.strokeStyle = O; c.lineWidth = 4; c.beginPath(); c.moveTo(lf - 10, boxTop); c.lineTo(lf - 10, ly + 2); c.stroke();
      const rail = (dy: number) => { c.beginPath(); c.moveTo(lf, ly + dy); c.lineTo(x0 - 6, ly - 8 + dy); };
      c.strokeStyle = O; c.lineWidth = 6; rail(0); c.stroke(); rail(-8); c.stroke();
      c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, x = lf + (x0 - 6 - lf) * u, y = ly - 8 * u; c.moveTo(x, y); c.lineTo(x, y - 8); } c.stroke();
      c.strokeStyle = '#e6e9ef'; c.lineWidth = 2.2; c.stroke(); c.lineWidth = 3; rail(0); c.stroke(); rail(-8); c.stroke();
      if (on) { c.fillStyle = '#ff3b3b66'; c.beginPath(); c.arc(cab + 16, boxTop - 9, 11, 0, TAU); c.fill(); }
      c.beginPath(); c.arc(cab + 16, boxTop - 4, 6, Math.PI, 0); c.closePath(); solid(c, on ? '#ff3b3b' : '#a3132a', 2.5);
      break;
    }
    case 'monster': {
      sideWindow([[x0 + L * (b.cab - .13), top + 3], [x0 + L * (b.cab - .11), top - 9], [x0 + L * b.cab, top - 12], [x0 + L * (b.cab + .13), top + 3]]);
      break;
    }
    case 'limo': {
      const rb = x0 + L * .14, rf = x0 + L * .74, n = 4, gap = 4, ww = (rf - rb - 10 - gap * (n - 1)) / n;
      for (let i = 0; i < n; i++) rrect(c, rb + 8 + i * (ww + gap), top - 13, ww, 13, 3, GLASS, 2);
      sideWindow([[rf + 2, top - 13], [rf + 6, top - 13], [x0 + L * .82, top + 2], [rf + 2, top + 2]]);
      c.fillStyle = '#c9ccd6'; c.fillRect(x0 + 4, top + 12, L - 8, 3); // chrome strip
      rrect(c, x1 - 5, bb - 10, 7, 7, 2, '#c9ccd6', 2);
      break;
    }
    case 'bike': {
      const a = axle, hip = [x0 + L * .38, a - 32] as const, sh = [x0 + L * .6, a - 52] as const, head = [x0 + L * .68, a - 60] as const, bar = [x0 + L * .74, a - 42] as const;
      // the windscreen on the fairing
      c.beginPath(); c.moveTo(x0 + L * .7, a - 43); c.quadraticCurveTo(x0 + L * .74, a - 54, x0 + L * .8, a - 50); c.lineTo(x0 + L * .8, a - 38); c.closePath(); solid(c, GLASS, 2);
      // the seat
      rrect(c, x0 + L * .22, a - 32, L * .2, 6, 3, '#2a2d36', 2);
      // the rider: leg, body, arm, helmet
      const limb = (pts: readonly (readonly [number, number])[], w: number) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = O; c.lineWidth = w + 4; c.beginPath(); for (const [x, y] of pts) c.lineTo(x, y); c.stroke(); c.strokeStyle = '#2a2d36'; c.lineWidth = w; c.stroke(); c.lineCap = 'butt'; c.lineJoin = 'miter'; };
      limb([hip, [x0 + L * .52, a - 22], [x0 + L * .46, a - 6]], 7);
      limb([hip, sh], 11);
      c.strokeStyle = trim; c.lineWidth = 3; c.beginPath(); c.moveTo(hip[0] + 2, hip[1] - 4); c.lineTo(sh[0] - 1, sh[1] + 4); c.stroke();
      limb([sh, [x0 + L * .68, a - 42], bar], 5.5);
      helmet(head[0], head[1], 10.5);
      break;
    }
    case 'tank': {
      // the track, its road wheels, and the turret's toy barrel
      const ty = -27, th = 26, tx0 = x0 + 4, tx1 = x1 - 4;
      c.beginPath(); c.roundRect(tx0, ty, tx1 - tx0, th, th / 2); solid(c, tyreColor(p.tyres), 3);
      c.save(); c.beginPath(); c.roundRect(tx0, ty, tx1 - tx0, th, th / 2); c.clip();
      c.fillStyle = p.tyres.tread === 'studded' ? '#dfe5ea' : '#4a4e58'; const roll = (t * 60) % 9;
      for (let x = tx0 - 9 + roll; x < tx1; x += 9) { c.fillRect(x, ty, 4, 4); c.fillRect(x - roll * 2 + 9, ty + th - 4, 4, 4); }
      c.restore();
      const n = 5; for (let i = 0; i < n; i++) { const x = tx0 + 14 + (i * (tx1 - tx0 - 28)) / (n - 1), rr = i === 0 || i === n - 1 ? 9 : 8; disc(c, x, ty + th / 2, rr, rimColor(p.rims), 2); disc(c, x, ty + th / 2, 2.5, O, 0); }
      const hullTop = -50, tx1T = x0 + L * .66;
      rrect(c, tx1T - 2, hullTop - 15, x1 + 6 - tx1T, 7, 3, '#5b6170', 2.5);
      rrect(c, x1 + 2, hullTop - 16.5, 7, 10, 3, trim, 2.5);
      rrect(c, x0 + L * .36, hullTop - 27, 16, 6, 3, '#5b6170', 2);
      c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + L * .32, hullTop - 22); c.lineTo(x0 + L * .27, hullTop - 44); c.stroke();
      c.beginPath(); c.moveTo(x0 + L * .27, hullTop - 44); c.lineTo(x0 + L * .27 + 13, hullTop - 40); c.lineTo(x0 + L * .27 + 1, hullTop - 35); c.closePath(); solid(c, trim, 1.5);
      break;
    }
    case 'jet': {
      const cp = x0 + L * b.cab;
      c.beginPath(); c.moveTo(cp - L * .14, top + 2); c.quadraticCurveTo(cp - L * .05, top - 13, cp + L * .04, top - 11); c.quadraticCurveTo(cp + L * .12, top - 8, cp + L * .17, top + 5); c.closePath(); solid(c, GLASS, 2.5);
      c.fillStyle = '#ffffff99'; c.beginPath(); c.ellipse(cp - L * .02, top - 6, 8, 2.5, -.15, 0, TAU); c.fill();
      // the near wing, swept back, and the nozzle
      c.beginPath(); c.moveTo(x0 + L * .62, bb - H * .45); c.lineTo(x0 + L * .3, bb - H * .45); c.lineTo(x0 + L * .14, bb + 2); c.lineTo(x0 + L * .28, bb + 2); c.closePath(); solid(c, trim, 2.5);
      rrect(c, x0 - 12, top + 7, 14, H - 12, 4, '#5b6170', 3); c.fillStyle = '#1d1f24'; c.fillRect(x0 - 12, top + 11, 4, H - 20);
      break;
    }
    case 'ufo': {
      const R = L / 2, cols = [trim, '#ffd23f', '#39ff88', '#ff7ac8'];
      c.beginPath(); c.ellipse(0, ufoY + 12, R * .42, 7, 0, 0, Math.PI); c.closePath(); solid(c, rimColor(p.rims), 2.5);
      for (const x of [-R * .25, 0, R * .25]) { c.beginPath(); c.ellipse(x, ufoY + 18, 4, 3, 0, 0, TAU); solid(c, tyreColor(p.tyres), 1.5); }
      c.beginPath(); c.ellipse(0, ufoY - 9, R * .42, 24, 0, Math.PI, TAU); c.closePath(); solid(c, GLASS, 3);
      disc(c, 4, ufoY - 18, 8, '#7be36b', 2); c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(1, ufoY - 25); c.lineTo(-3, ufoY - 32); c.moveTo(8, ufoY - 25); c.lineTo(10, ufoY - 32); c.stroke();
      disc(c, -3, ufoY - 32, 2.2, '#ffd23f', 1.5); disc(c, 10, ufoY - 32, 2.2, '#ffd23f', 1.5);
      c.fillStyle = O; for (const dx of [5, 10]) { c.beginPath(); c.arc(dx, ufoY - 19, 1.8, 0, TAU); c.fill(); }
      c.fillStyle = '#ffffff99'; c.beginPath(); c.ellipse(-R * .2, ufoY - 22, 6, 3, -.6, 0, TAU); c.fill();
      for (let i = 0; i < 7; i++) {
        const x = -R * .82 + i * R * .27, lit = (i + Math.floor(t * 8)) % 3 === 0; if (Math.abs(x - num![0]) < 10) continue;
        if (lit) { c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(x, ufoY + 3, 7, 0, TAU); c.fill(); }
        disc(c, x, ufoY + 3, 3.5, cols[i % cols.length]!, 1.5);
      }
      break;
    }
    case 'dragon': {
      const cxw = x0 + L * b.cab, nose = x1 - 18;
      sideWindow([[x0 + L * (b.cab - .14), top + 3], [x0 + L * (b.cab - .12), top - 10], [cxw, top - 14], [x0 + L * (b.cab + .14), top + 3]]);
      // spikes down the back
      for (let x = x0 + 4; x < x0 + L * (b.cab - .2); x += 11) { c.beginPath(); c.moveTo(x, top + 1); c.lineTo(x + 5, top - 10); c.lineTo(x + 10, top + 1); c.closePath(); solid(c, trim, 2); }
      for (let x = x0 + L * (b.cab + .23); x < nose - 30; x += 11) { const y = top + 4 + (x - x0 - L * (b.cab + .22)) * .25; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5, y - 9); c.lineTo(x + 10, y + 2); c.closePath(); solid(c, trim, 2); }
      // the head: snout, jaw, eye, horn, nostril, teeth
      const hy = top + H * .5;
      c.beginPath(); c.moveTo(nose - 28, top + 8); c.quadraticCurveTo(nose - 14, top - 2, nose + 2, top + 10); c.quadraticCurveTo(x1 + 4, top + 14, x1 + 2, hy - 2); c.lineTo(nose - 6, hy - 2);
      c.lineTo(nose - 6, hy + 2); c.lineTo(x1, hy + 4); c.quadraticCurveTo(x1, bb - 4, nose - 6, bb - 2); c.lineTo(nose - 30, bb); c.closePath(); solid(c, main, 3);
      c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const x = nose - 2 + i * 6; c.beginPath(); c.moveTo(x, hy - 2); c.lineTo(x + 2.5, hy + 3); c.lineTo(x + 5, hy - 2); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(nose - 22, top + 6); c.lineTo(nose - 36, top - 10); c.lineTo(nose - 14, top + 2); c.closePath(); solid(c, '#fff6c2', 2);
      disc(c, nose - 10, top + 8, 5.5, '#fff', 2); c.fillStyle = O; c.beginPath(); c.arc(nose - 8, top + 8, 2.6, 0, TAU); c.fill();
      c.beginPath(); c.arc(x1 - 1, top + 15, 1.6, 0, TAU); c.fill();
      break;
    }
    case 'star': {
      sideWindow([[x0 + L * (b.cab - .14), top + 3], [x0 + L * (b.cab - .12), top - 10], [x0 + L * b.cab, top - 14], [x0 + L * (b.cab + .14), top + 3]]);
      star(c, x1 - L * .2, (top + bb) / 2 + 4, 8); solid(c, trim, 2);
      for (let i = 0; i < 5; i++) { const k = (Math.sin(t * 6 + i * 1.9) + 1) / 2; twinkle(c, x0 + L * (.24 + i * .14), i % 2 ? bb - 8 : top + 9, 3 + k * 3.5); solid(c, '#fff6c2', 1.2); }
      break;
    }
    default:
      if (!b.open) sideWindow([[x0 + L * (b.cab - .14), top + 3], [x0 + L * (b.cab - .12), top - 10], [x0 + L * b.cab, top - 14], [x0 + L * (b.cab + .14), top + 3]]);
      else helmet(x0 + L * b.cab, top - 6);
  }
  // engine on the back, with its pipes
  if (pipes) {
    const py = s === 'pickup' ? top + 2 : s === 'icecream' ? bb - 54 : s === 'fire' ? bb - 48 : s === 'tank' ? -58 : top - 8;
    c.fillStyle = '#5b6170'; c.strokeStyle = O; c.lineWidth = 2;
    for (let i = 0; i < Math.min(4, p.engine.pipes); i++) { c.beginPath(); c.roundRect(x0 + 4 + i * 7 + (s === 'tank' ? 8 : 0), py, 5, 12, 2); c.fill(); c.stroke(); }
  }
  // the race number on the door
  if (car.number !== undefined && num) numberDisc(c, car.number, num[0], num[1], num[2], false, 2);
  // the wing on its posts, kept inside SIDE_SPAN
  if (p.wing.size > 0) {
    const wx = wingX, wh = Math.min(16 + p.wing.size * 16, wingBase - SIDE_SPAN.top - 12), ww = 26 + p.wing.size * 14;
    c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + 8, wingBase); c.lineTo(wx + 8, wingBase - 2 - wh); c.stroke();
    const wt = wingBase - 2 - wh;
    c.fillStyle = trim; c.beginPath(); c.roundRect(wx - 6, wt - 7, ww, 8, 3); c.fill(); c.stroke();
    if (p.wing.twin) { c.beginPath(); c.roundRect(wx - 4, wt + 5, ww - 6, 6, 3); c.fill(); c.stroke(); }
    if (p.wing.fin) { c.fillStyle = main; c.beginPath(); c.moveTo(wx + 2, wingBase); c.lineTo(wx + 8, wingBase - wh * .7); c.lineTo(wx + 26, wingBase); c.closePath(); c.fill(); c.stroke(); }
  }
  // wheels
  for (const x of wheels) wheelSide(c, x, axle, r, p.tyres, p.rims, spin);
  if (s === 'jeep' || s === 'monster') for (const x of wheels) { // fenders over the wheels
    c.beginPath(); c.arc(x, axle, r + 7, Math.PI * 1.08, Math.PI * 1.92); c.arc(x, axle, r + 2, Math.PI * 1.92, Math.PI * 1.08, true); c.closePath(); solid(c, s === 'monster' ? trim : main, 2.5);
  }
  if (o.glow) { c.strokeStyle = o.glow; c.lineWidth = 5; c.strokeRect(x0 - 6, top - 26, L + 12, -top + 30); }
}
/** How much room the side view takes, for fitting it in a box. */
export const SIDE_SPAN = { left: -110, right: 110, top: -100, bottom: 10 };
