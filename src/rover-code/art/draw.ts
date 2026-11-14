// The reward's pictures, drawn in code on a 2D canvas: his rocket from its parts, whichever rover he drives from the side with every
// gadget he has put on it, and the planets as globes. The Base, the flight and the planet drive all use these, so the rocket he built
// is the one that flies. Family look: thick dark outlines, flat toy colours, one highlight.
import { paintOf, type Rocket } from '../base/parts';
import type { Planet } from '../base/planets';
import type { FeatureId, RoverLook } from '../base/rovers';

const O = '#11131c', TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;

function outline(c: C, w = 6) { c.lineWidth = w; c.strokeStyle = O; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function shine(c: C, x: number, y: number, w: number, h: number) { c.save(); c.globalAlpha = .28; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, TAU); c.fill(); c.restore(); }

/** How tall the rocket is from its nose tip to its nozzles, in its own units, so a view can fit it. */
export const ROCKET_SPAN = { top: -175, bottom: 122, half: 124 };

/**
 * The rocket standing up, nose at the top, centred on 0,0 in its own units (about 280 tall). `flame` 0 to 1 is how hard the engine
 * burns; `t` in seconds flickers it.
 */
export function drawRocket(c: C, r: Rocket, { flame = 0, t = 0 }: { flame?: number; t?: number } = {}) {
  const paint = paintOf(r), main = r.body === 'gold' ? '#f2c14e' : paint.main, trim = paint.trim;
  const long = r.body !== 'can', bw = long ? 46 : 54, top = long ? -78 : -60, bottom = 72;
  // strapped-on Boosters take the place of the Mega Booster's and Hyper Drive's own side boosters
  const straps = strapsOf(r.boosters, bw), strapped = straps.length > 0;
  // flames first, under everything
  if (flame > 0) {
    for (const b of straps) { // each Booster's own flame, a little shorter than the engine's
      const len = (50 + 36 * flame + Math.sin(t * 44 + b.x) * 9) * flame;
      for (const [col, k] of boosterFlame(r.boosters, b.i)) {
        c.beginPath(); c.moveTo(b.x - 10 * k, b.bot + 20); c.quadraticCurveTo(b.x, b.bot + 20 + len * k * 1.2, b.x + 10 * k, b.bot + 20); c.closePath(); c.fillStyle = col; c.fill();
      }
    }
    const nozzles = r.engine === 'twin' ? [-18, 18] : r.engine === 'triple' || r.engine === 'plasma' ? [-26, 0, 26] : r.engine === 'mega' ? (strapped ? [0] : [-50, 0, 50])
      : r.engine === 'quad' ? [-36, -12, 12, 36] : r.engine === 'hyper' ? (strapped ? [0] : [-58, 0, 58]) : [0];
    // the plasma and hyper engines burn blue
    const colours = r.engine === 'plasma' || r.engine === 'hyper' ? [['#6a3dff', 1], ['#3ad0ff', .7], ['#ffffff', .4]] as const : [['#ff5a10', 1], ['#ffb02e', .7], ['#fff6c2', .4]] as const;
    for (const x of nozzles) {
      const big = x === 0 && (r.engine === 'mega' || r.engine === 'hyper') ? (r.engine === 'hyper' ? 1.8 : 1.5) : r.engine === 'plasma' ? 1.15 : 1;
      const len = (70 + 50 * flame + Math.sin(t * 40 + x) * 12) * big * flame;
      for (const [col, k] of colours) {
        c.beginPath(); c.moveTo(x - 15 * big * k, bottom + 40); c.quadraticCurveTo(x, bottom + 40 + len * k * 1.25, x + 15 * big * k, bottom + 40); c.closePath(); c.fillStyle = col; c.fill();
      }
    }
  }
  // engine
  const nozzle = (x: number, w: number, h: number) => { c.beginPath(); c.moveTo(x - w * .6, bottom - 2); c.lineTo(x + w * .6, bottom - 2); c.lineTo(x + w, bottom + h); c.lineTo(x - w, bottom + h); c.closePath(); c.fillStyle = '#5b6170'; c.fill(); outline(c, 5); };
  if (r.engine === 'puff') nozzle(0, 20, 36);
  else if (r.engine === 'twin') { nozzle(-18, 15, 38); nozzle(18, 15, 38); }
  else if (r.engine === 'triple') { nozzle(-26, 13, 38); nozzle(0, 15, 42); nozzle(26, 13, 38); }
  else if (r.engine === 'quad') { nozzle(-36, 11, 36); nozzle(-12, 11, 40); nozzle(12, 11, 40); nozzle(36, 11, 36); }
  else if (r.engine === 'plasma') {
    nozzle(-26, 14, 40); nozzle(0, 17, 46); nozzle(26, 14, 40);
    for (const x of [-26, 0, 26]) { c.beginPath(); c.arc(x, bottom + 14, 6, 0, TAU); c.fillStyle = '#3ad0ff'; c.fill(); outline(c, 3); } // glowing cores
  }
  else if (r.engine === 'hyper') {
    nozzle(0, 30, 48);
    if (!strapped) for (const s of [-1, 1]) { // two big side boosters with glowing rings
      c.beginPath(); c.roundRect(s * 58 - 16, -30, 32, 116, 14); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 5);
      for (const y of [0, 34]) { c.beginPath(); c.roundRect(s * 58 - 16, y, 32, 8, 3); c.fillStyle = '#3ad0ff'; c.fill(); }
      c.beginPath(); c.moveTo(s * 58 - 11, -30); c.lineTo(s * 58, -58); c.lineTo(s * 58 + 11, -30); c.closePath(); c.fillStyle = trim; c.fill(); outline(c, 5);
      nozzle(s * 58, 13, 34);
    }
  }
  else {
    nozzle(0, 26, 46);
    if (!strapped) for (const s of [-1, 1]) { // side boosters
      c.beginPath(); c.roundRect(s * 50 - 14, -10, 28, 96, 12); c.fillStyle = '#e8ebf2'; c.fill(); outline(c, 5);
      c.beginPath(); c.moveTo(s * 50 - 9, -10); c.lineTo(s * 50, -34); c.lineTo(s * 50 + 9, -10); c.closePath(); c.fillStyle = trim; c.fill(); outline(c, 5);
      nozzle(s * 50, 11, 30);
    }
  }
  // fins
  c.fillStyle = trim;
  for (const s of [-1, 1]) {
    c.beginPath();
    if (r.fins === 'little') { c.moveTo(s * bw, 20); c.lineTo(s * (bw + 26), 76); c.lineTo(s * bw, 66); }
    else if (r.fins === 'swept') { c.moveTo(s * bw, 0); c.quadraticCurveTo(s * (bw + 30), 30, s * (bw + 36), 96); c.lineTo(s * bw, 66); }
    else if (r.fins === 'big') { c.moveTo(s * bw, -20); c.lineTo(s * (bw + 44), 70); c.lineTo(s * (bw + 44), 100); c.lineTo(s * bw, 70); }
    else if (r.fins === 'spike') { c.moveTo(s * bw, -24); c.lineTo(s * (bw + 46), 6); c.lineTo(s * (bw + 12), 26); c.lineTo(s * (bw + 58), 58); c.lineTo(s * (bw + 12), 74); c.lineTo(s * (bw + 50), 108); c.lineTo(s * bw, 76); }
    else if (r.fins === 'jet') { c.moveTo(s * bw, -50); c.lineTo(s * (bw + 74), 58); c.lineTo(s * (bw + 74), 96); c.lineTo(s * (bw + 20), 84); c.lineTo(s * bw, 74); }
    else if (r.fins === 'bat') { // a pointed top edge and a scalloped bottom one
      c.fillStyle = '#4a3570';
      c.moveTo(s * bw, -50); c.lineTo(s * (bw + 30), -66); c.lineTo(s * (bw + 78), -34);
      c.quadraticCurveTo(s * (bw + 54), -6, s * (bw + 68), 22); c.quadraticCurveTo(s * (bw + 44), 36, s * (bw + 60), 70); c.quadraticCurveTo(s * (bw + 30), 56, s * bw, 76);
    }
    else if (r.fins === 'butterfly') { // a big round wing on top and a little one under it
      c.moveTo(s * bw, -34); c.bezierCurveTo(s * (bw + 46), -96, s * (bw + 96), -40, s * (bw + 22), 22);
      c.bezierCurveTo(s * (bw + 80), 30, s * (bw + 60), 108, s * bw, 76);
    }
    else if (r.fins === 'eagle') { // feathers along the back edge
      c.fillStyle = '#a0673a';
      c.moveTo(s * bw, -40); c.quadraticCurveTo(s * (bw + 40), -62, s * (bw + 80), -26);
      for (const [x, y] of [[66, -8], [80, 14], [60, 24], [70, 50], [48, 54], [54, 86], [30, 76]] as const) c.lineTo(s * (bw + x), y);
      c.lineTo(s * bw, 76);
    }
    else if (r.fins === 'ice') { // jagged ice crystals
      c.fillStyle = '#9fe8ff';
      for (const [x, y] of [[0, -40], [36, -72], [48, -22], [80, -4], [54, 28], [78, 70], [40, 64], [30, 104], [0, 76]] as const) c.lineTo(s * (bw + x), y);
    }
    else if (r.fins === 'fire') { // flames licking up and out
      c.fillStyle = '#ff5a10';
      c.moveTo(s * bw, 76); c.quadraticCurveTo(s * (bw + 70), 76, s * (bw + 80), 24); c.quadraticCurveTo(s * (bw + 62), 32, s * (bw + 72), -22);
      c.quadraticCurveTo(s * (bw + 48), -4, s * (bw + 46), -64); c.quadraticCurveTo(s * (bw + 26), -24, s * bw, -32);
    }
    else if (r.fins === 'starwing') { c.fillStyle = '#22337a'; c.moveTo(s * bw, -40); c.quadraticCurveTo(s * (bw + 74), -6, s * (bw + 68), 88); c.lineTo(s * (bw + 30), 84); c.lineTo(s * bw, 70); }
    else if (r.fins === 'dragon') {
      c.moveTo(s * bw, -56); c.quadraticCurveTo(s * (bw + 50), -84, s * (bw + 76), -30);
      c.quadraticCurveTo(s * (bw + 52), 0, s * (bw + 76), 30); c.quadraticCurveTo(s * (bw + 50), 50, s * (bw + 70), 90);
      c.quadraticCurveTo(s * (bw + 34), 70, s * bw, 76);
    }
    else { c.moveTo(s * bw, -40); c.quadraticCurveTo(s * (bw + 70), 10, s * (bw + 62), 104); c.lineTo(s * (bw + 30), 92); c.lineTo(s * bw, 70); }
    c.closePath(); c.fill(); outline(c, 6);
    c.fillStyle = trim;
  }
  finTrim(c, r.fins, bw);
  if (r.fins === 'wing' || r.fins === 'dragon') { c.beginPath(); c.roundRect(-7, 30, 14, 82, 6); c.fill(); outline(c, 5); }
  if (r.fins === 'jet') for (const s of [-1, 1]) { c.beginPath(); c.arc(s * (bw + 74), 58, 7, 0, TAU); c.fillStyle = s < 0 ? '#e63946' : '#3ddc84'; c.fill(); outline(c, 3); } // wingtip lights
  if (r.fins === 'dragon') { c.strokeStyle = O; c.lineWidth = 3; for (const s of [-1, 1]) for (const y of [-30, 30]) { c.beginPath(); c.moveTo(s * bw, y + 30); c.lineTo(s * (bw + 66), y); c.stroke(); } } // the wing's bones
  // strapped-on Boosters: the outer ones first, so the inner ones stand in front
  for (const b of [...straps].reverse()) drawBooster(c, r.boosters, b, trim);
  // body
  c.beginPath(); c.roundRect(-bw, top, bw * 2, bottom - top, [18, 18, 14, 14]); c.fillStyle = main; c.fill();
  if (r.body === 'stripe') { c.save(); c.clip(); c.fillStyle = trim; for (const y of [top + 30, 18, 52]) c.fillRect(-bw, y, bw * 2, 12); c.restore(); }
  if (r.body === 'gold') { c.fillStyle = '#b8862b'; for (const y of [top + 18, bottom - 14]) for (const x of [-bw + 12, bw - 12]) { c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); } }
  if (r.body === 'armor') { // bolted plates
    c.strokeStyle = '#00000055'; c.lineWidth = 4; for (const y of [top + 64, 4, 40]) { c.beginPath(); c.moveTo(-bw, y); c.lineTo(bw, y); c.stroke(); }
    c.fillStyle = '#5b6170'; for (const y of [top + 70, 10, 46]) for (const x of [-bw + 10, bw - 10]) { c.beginPath(); c.arc(x, y, 4.5, 0, TAU); c.fill(); }
  }
  if (r.body === 'zap') { // a lightning bolt down the side
    c.beginPath(); c.moveTo(8, top + 68); c.lineTo(-18, 18); c.lineTo(0, 18); c.lineTo(-10, bottom - 6); c.lineTo(22, 4); c.lineTo(4, 4); c.lineTo(18, top + 68); c.closePath();
    c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 3; c.strokeStyle = O; c.stroke();
  }
  if (r.body === 'rainbow') { c.save(); c.clip(); ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cc46b', '#3a8dde', '#8e5bd8'].forEach((col, i) => { c.fillStyle = col; c.fillRect(-bw, top + 62 + i * 13, bw * 2, 13); }); c.restore(); }
  c.beginPath(); c.roundRect(-bw, top, bw * 2, bottom - top, [18, 18, 14, 14]); outline(c, 7);
  shine(c, -bw * .45, (top + bottom) / 2, 8, (bottom - top) * .32);
  // window
  c.beginPath(); c.arc(0, top + 42, 19, 0, TAU); c.fillStyle = '#9fd8ff'; c.fill(); outline(c, 6);
  c.beginPath(); c.arc(-6, top + 36, 6, 0, TAU); c.fillStyle = '#ffffffcc'; c.fill();
  // nose
  c.beginPath();
  if (r.nose === 'bubble') { c.moveTo(-bw, top + 2); c.bezierCurveTo(-bw, top - 70, bw, top - 70, bw, top + 2); }
  else if (r.nose === 'needle') { c.moveTo(-bw, top + 2); c.quadraticCurveTo(-bw * .4, top - 40, 0, top - 92); c.quadraticCurveTo(bw * .4, top - 40, bw, top + 2); }
  else if (r.nose === 'drill') { c.moveTo(-bw, top + 2); c.lineTo(0, top - 88); c.lineTo(bw, top + 2); }
  else if (r.nose === 'shark') { c.moveTo(-bw, top + 2); c.bezierCurveTo(-bw, top - 50, -14, top - 84, 6, top - 84); c.bezierCurveTo(26, top - 84, bw, top - 40, bw, top + 2); }
  else if (r.nose === 'diamond') { c.moveTo(-bw, top + 2); c.lineTo(-bw * .72, top - 48); c.lineTo(0, top - 96); c.lineTo(bw * .72, top - 48); c.lineTo(bw, top + 2); }
  else { c.moveTo(-bw, top + 2); c.quadraticCurveTo(-bw * .5, top - 50, 0, top - 66); c.quadraticCurveTo(bw * .5, top - 50, bw, top + 2); }
  c.closePath();
  c.fillStyle = r.nose === 'bubble' ? '#bfe8ff' : r.nose === 'drill' ? '#aab2bd' : r.nose === 'shark' ? '#7f93ab' : r.nose === 'diamond' ? '#8ff3ff' : trim; c.fill();
  if (r.nose === 'drill') { // the drill's spiral
    c.save(); c.clip(); c.strokeStyle = '#5b6170'; c.lineWidth = 6;
    for (let i = 0; i < 6; i++) { const y = top + 2 - i * 16; c.beginPath(); c.moveTo(-bw, y); c.lineTo(bw, y - 20); c.stroke(); }
    c.restore(); c.beginPath(); c.moveTo(-bw, top + 2); c.lineTo(0, top - 88); c.lineTo(bw, top + 2); c.closePath();
  }
  if (r.nose === 'shark') { // a white jaw full of teeth, and an eye
    c.save(); c.clip(); c.fillStyle = '#f4f6fa'; c.fillRect(-bw, top - 26, bw * 2, 30); c.restore();
    c.beginPath(); c.moveTo(-bw, top + 2); c.bezierCurveTo(-bw, top - 50, -14, top - 84, 6, top - 84); c.bezierCurveTo(26, top - 84, bw, top - 40, bw, top + 2); c.closePath();
  }
  outline(c, 7);
  if (r.nose === 'shark') {
    c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(-bw * .86 + i * bw * .215, top - 22 + (i % 2 ? 12 : 0)); c.lineWidth = 3; c.strokeStyle = O; c.stroke();
    c.beginPath(); c.arc(16, top - 50, 7, 0, TAU); c.fillStyle = O; c.fill();
    c.beginPath(); c.arc(18, top - 52, 2.5, 0, TAU); c.fillStyle = '#fff'; c.fill();
  }
  if (r.nose === 'diamond') { // the facets
    c.beginPath(); c.moveTo(-bw * .72, top - 48); c.lineTo(bw * .72, top - 48); c.moveTo(0, top - 96); c.lineTo(-bw * .3, top - 48); c.lineTo(0, top + 2); c.lineTo(bw * .3, top - 48); c.lineTo(0, top - 96);
    c.lineWidth = 3; c.strokeStyle = '#2a9fb5'; c.stroke(); shine(c, -14, top - 40, 6, 16);
  }
  if (r.nose === 'bubble') shine(c, -14, top - 26, 10, 14);
  if (r.nose === 'star') star(c, 0, top - 74, 20, '#ffd23f');
}

/** The extra bits on the newer wings: the butterfly's spots, the ice's shine, the fire's yellow middle and the stars on the Star Wings. */
function finTrim(c: C, fins: string, bw: number) {
  for (const s of [-1, 1]) {
    if (fins === 'butterfly') for (const [x, y, rr, col] of [[38, -30, 11, '#ffd23f'], [58, -48, 7, '#f4f6fa'], [34, 50, 9, '#ff7ac8']] as const) { c.beginPath(); c.arc(s * (bw + x), y, rr, 0, TAU); c.fillStyle = col; c.fill(); outline(c, 3); }
    if (fins === 'ice') { c.beginPath(); c.moveTo(s * (bw + 8), -20); c.lineTo(s * (bw + 46), -14); c.moveTo(s * (bw + 10), 30); c.lineTo(s * (bw + 52), 30); c.lineWidth = 3; c.strokeStyle = '#ffffffcc'; c.stroke(); }
    if (fins === 'fire') {
      c.beginPath(); c.moveTo(s * bw, 70); c.quadraticCurveTo(s * (bw + 46), 68, s * (bw + 54), 30); c.quadraticCurveTo(s * (bw + 40), 34, s * (bw + 44), 0);
      c.quadraticCurveTo(s * (bw + 28), 10, s * (bw + 28), -26); c.quadraticCurveTo(s * (bw + 14), 0, s * bw, -4); c.closePath(); c.fillStyle = '#ffd23f'; c.fill();
    }
    if (fins === 'starwing') { star(c, s * (bw + 66), 86, 15, '#ffd23f', 4); star(c, s * (bw + 34), 20, 9, '#ffd23f', 3); star(c, s * (bw + 52), -2, 6, '#f4f6fa', 2.5); }
  }
}

/** One strapped-on Booster: where it stands (`i` counts out from the body on one side). */
interface Strap { x: number; top: number; bot: number; w: number; i: number }
const STRAPS: Record<string, number> = { two: 1, four: 2, fire: 2, six: 3, ice: 3, gold: 3, eight: 4, rainbow: 4 };
/** The Boosters, two to eight of them, half on each side: each one further out stands a little higher, so they look bundled round. */
function strapsOf(kind: string, bw: number): Strap[] {
  const n = STRAPS[kind] ?? 0, out: Strap[] = [];
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) out.push({ x: s * (bw + 8 + i * 17), top: -26 + i * 12, bot: 86 - i * 4, w: n > 2 ? 22 : 26, i });
  return out;
}
const RAINBOW = ['#ff5a5a', '#ffb02e', '#4cc46b', '#3a8dde'];
function boosterFlame(kind: string, i: number): readonly (readonly [string, number])[] {
  if (kind === 'ice') return [['#3a8dde', 1], ['#9fe8ff', .65], ['#ffffff', .35]];
  if (kind === 'rainbow') return [[RAINBOW[i % 4]!, 1], ['#ffe14d', .6], ['#ffffff', .3]];
  if (kind === 'gold') return [['#ff8a1f', 1], ['#ffe14d', .7], ['#ffffff', .35]];
  return [['#ff5a10', 1], ['#ffb02e', .7], ['#fff6c2', .4]];
}
function drawBooster(c: C, kind: string, b: Strap, trim: string) {
  const { x, top, bot, w } = b, col = kind === 'fire' ? '#e63946' : kind === 'ice' ? '#bff0ff' : kind === 'gold' ? '#f2c14e' : kind === 'rainbow' ? RAINBOW[b.i % 4]! : '#e8ebf2';
  c.beginPath(); c.moveTo(x - 7, bot - 2); c.lineTo(x + 7, bot - 2); c.lineTo(x + 10, bot + 20); c.lineTo(x - 10, bot + 20); c.closePath(); c.fillStyle = '#5b6170'; c.fill(); outline(c, 4);
  c.beginPath(); c.roundRect(x - w / 2, top, w, bot - top, 10); c.fillStyle = col; c.fill();
  c.save(); c.clip();
  if (kind === 'fire') { // yellow flames up from the bottom
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - w / 2, bot); c.lineTo(x - w / 2, bot - 30); c.lineTo(x - 4, bot - 16); c.lineTo(x, bot - 44); c.lineTo(x + 4, bot - 16); c.lineTo(x + w / 2, bot - 30); c.lineTo(x + w / 2, bot); c.closePath(); c.fill();
  }
  if (kind === 'ice' || kind === 'gold') { c.fillStyle = kind === 'ice' ? '#3a8dde' : '#b8862b'; for (const y of [top + 22, bot - 26]) c.fillRect(x - w / 2, y, w, 7); }
  if (kind === 'eight' || kind === 'six' || kind === 'four' || kind === 'two') { c.fillStyle = trim; c.fillRect(x - w / 2, bot - 22, w, 8); }
  c.restore();
  c.beginPath(); c.roundRect(x - w / 2, top, w, bot - top, 10); outline(c, 5);
  shine(c, x - w * .2, (top + bot) / 2, 3, (bot - top) * .3);
  c.beginPath(); c.moveTo(x - w / 2 + 3, top + 2); c.lineTo(x, top - 22); c.lineTo(x + w / 2 - 3, top + 2); c.closePath();
  c.fillStyle = kind === 'gold' ? '#ffe14d' : kind === 'ice' ? '#3a8dde' : kind === 'rainbow' ? '#f4f6fa' : kind === 'fire' ? '#ffd23f' : trim; c.fill(); outline(c, 4);
}

export function star(c: C, x: number, y: number, r: number, fill: string, lw = 5) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = fill; c.fill(); outline(c, lw);
}

/** Room the Scout takes round its middle, so a view can fit it; roverSpan() is taller for the tall rovers. */
export const ROVER_SPAN = { left: -95, right: 95, top: -130, bottom: 52 };

/**
 * Where things go on a rover, so every gadget fits every kind: its body (`l` back to `r` front, `top` to `bottom`), the roof of its
 * cab, the cab's middle, its camera mast (standing at `mast`,`mastY`, `mastH` tall) and the top of the camera head.
 */
interface Frame {
  l: number; r: number; top: number; bottom: number;
  roof: number; cab: number;
  mast: number; mastY: number; mastH: number; headY: number;
  /** The body's outline as a path, for filling and for clipping the stripes and flames to it. */
  hull: (c: C) => void;
  colour: string;
  /** The window the driver looks out of (an Alien Pal sits in it), or null for an open seat. */
  window: readonly [number, number, number, number] | null;
  /** The window's corners, when it isn't a plain rounded box: a canopy or a dome. */
  winR?: number | readonly number[];
}
const box = (x: number, y: number, w: number, h: number, rad: number) => (c: C) => { c.roundRect(x, y, w, h, rad); };
const frame = (f: Omit<Frame, 'headY'>): Frame => ({ ...f, headY: f.mastY - f.mastH - 22 });
/** Wheel radius (or tread wheel, foot or hover pad size): bigger with Big Wheels. */
const wheelR = (look: RoverLook) => {
  const big = look.kit.includes('wheels');
  switch (look.kind) {
    case 'monster': return big ? 38 : 30;
    case 'buggy': return big ? 25 : 19;
    case 'tank': case 'digger': return big ? 18 : 14;
    case 'bike': return big ? 30 : 24;
    case 'pogo': return big ? 26 : 20;
    case 'dog': return big ? 20 : 16;
    default: return big ? 24 : 17;
  }
};
/** How high the Hover Rover floats, bobbing. */
const floatOf = (t: number) => 34 + Math.sin(t * 3) * 4;

function frameOf(look: RoverLook, t: number): Frame {
  const wr = wheelR(look);
  switch (look.kind) {
    case 'buggy': { // low and wedge-shaped, with a roll cage over an open seat
      const bottom = -wr - 4, top = bottom - 28, l = -72, r = 70;
      return frame({ l, r, top, bottom, roof: top - 44, cab: -14, mast: 18, mastY: top - 44, mastH: 4, colour: '#e63946', window: null,
        hull: c => { c.moveTo(l + 8, top); c.lineTo(r - 36, top); c.lineTo(r, top + 14); c.lineTo(r, bottom - 6); c.quadraticCurveTo(r, bottom, r - 8, bottom); c.lineTo(l + 6, bottom); c.quadraticCurveTo(l, bottom, l, bottom - 6); c.lineTo(l, top + 8); c.quadraticCurveTo(l, top, l + 8, top); c.closePath(); } });
    }
    case 'monster': { // a truck body up high on huge wheels, with a cab on top
      const bottom = -2 * wr - 6, top = bottom - 34, l = -78, r = 76;
      return frame({ l, r, top, bottom, roof: top - 30, cab: 1, mast: 54, mastY: top, mastH: 8, colour: '#4cc46b', window: [-26, top - 24, 54, 18], hull: box(l, top, r - l, bottom - top, 12) });
    }
    case 'tank': { // on two long treads, with a sloped cab
      const tread = 2 * wr + 12, bottom = -tread + 2, top = bottom - 32, l = -60, r = 60;
      return frame({ l, r, top, bottom, roof: top - 24, cab: -12, mast: 38, mastY: top, mastH: 22, colour: '#ff8a1f', window: [-34, top - 19, 40, 14], hull: box(l, top, r - l, bottom - top, 10) });
    }
    case 'spider': { // a round body on six walking legs
      const bottom = -70, top = -120, l = -58, r = 56;
      return frame({ l, r, top, bottom, roof: top, cab: -8, mast: 26, mastY: top + 2, mastH: 8, colour: '#8e5bd8', window: [-38, top + 12, 50, 22], hull: box(l, top, r - l, bottom - top, 25) });
    }
    case 'hover': { // a floating pill with glowing pads underneath
      const bottom = -floatOf(t), top = bottom - 38, l = -78, r = 78;
      return frame({ l, r, top, bottom, roof: top, cab: -20, mast: 40, mastY: top + 2, mastH: 14, colour: '#eef2f7', window: [-56, top + 9, 64, 18], hull: box(l, top, r - l, bottom - top, 19) });
    }
    case 'bike': { // a slim body between two big wheels, with handlebars and an open seat
      const bottom = -2 * wr + 4, top = bottom - 30, l = -54, r = 44;
      return frame({ l, r, top, bottom, roof: top, cab: -6, mast: 22, mastY: top, mastH: 10, colour: '#3a8dde', window: null, hull: box(l, top, r - l, bottom - top, 15) });
    }
    case 'digger': { // on short treads, with a tall cab at the back and a scoop on an arm in front
      const tread = 2 * wr + 12, bottom = -tread + 2, top = bottom - 30, l = -60, r = 36;
      return frame({ l, r, top, bottom, roof: top - 46, cab: -28, mast: -22, mastY: top - 46, mastH: 6, colour: '#ffb02e', window: [l + 14, top - 38, 34, 22], hull: box(l, top, r - l, bottom - top, 10) });
    }
    case 'pogo': { // a round body bouncing on a big spring over one wheel
      const bottom = -2 * wr - 50, top = bottom - 50, l = -46, r = 46;
      return frame({ l, r, top, bottom, roof: top, cab: -8, mast: 24, mastY: top, mastH: 6, colour: '#ff7ac8', window: [-34, top + 10, 52, 20], hull: box(l, top, r - l, bottom - top, 22) });
    }
    case 'rocketcar': { // long and low with a pointed nose, a glass canopy and a rocket on the back
      const bottom = -wr - 2, top = bottom - 24, l = -72, r = 74;
      return frame({ l, r, top, bottom, roof: top - 20, cab: -7, mast: 34, mastY: top, mastH: 4, colour: '#2fb3a6', window: [-30, top - 20, 46, 22], winR: [16, 16, 0, 0],
        hull: c => { c.moveTo(l + 8, top); c.lineTo(r - 50, top); c.lineTo(r, top + 16); c.lineTo(r, bottom - 5); c.quadraticCurveTo(r, bottom, r - 6, bottom); c.lineTo(l + 6, bottom); c.quadraticCurveTo(l, bottom, l, bottom - 6); c.lineTo(l, top + 8); c.quadraticCurveTo(l, top, l + 8, top); c.closePath(); } });
    }
    case 'dog': { // a robot dog on four walking legs, with its head up in front and a wagging tail
      const bottom = -66, top = -98, l = -54, r = 34;
      return frame({ l, r, top, bottom, roof: top, cab: -10, mast: -40, mastY: top, mastH: 8, colour: '#7fb2e0', window: null, hull: box(l, top, r - l, bottom - top, 16) });
    }
    case 'ufo': { // a flying saucer with a glass dome, floating on a beam
      const bottom = -floatOf(t) - 4, top = bottom - 28, l = -84, r = 84, mid = (top + bottom) / 2;
      return frame({ l, r, top, bottom, roof: top - 26, cab: 0, mast: 46, mastY: top + 4, mastH: 6, colour: '#c9ccd6', window: [-30, top - 26, 60, 32], winR: [30, 30, 0, 0],
        hull: c => { c.ellipse(0, mid, r, (bottom - top) / 2, 0, 0, TAU); } });
    }
    default: { // the Scout: a box on six wheels, with the camera on a mast
      const axle = -wr, top = axle - 58, bottom = axle - 12;
      return frame({ l: -64, r: 64, top, bottom, roof: top, cab: -25, mast: 30, mastY: top, mastH: 34, colour: '#ffd23f', window: [-52, top + 10, 54, 24], hull: box(-64, top, 128, bottom - top, 14) });
    }
  }
}

/** Room a rover takes, so a view can fit it: the Scout's, with more on top for a tall one or a Disco Ball. */
export function roverSpan(look: RoverLook) {
  const f = frameOf(look, 0), extra = look.kit.includes('disco') ? 34 : 0;
  return { ...ROVER_SPAN, top: Math.min(ROVER_SPAN.top, f.headY - extra - 2, f.roof - (look.kit.includes('antenna') ? 60 : 0)) };
}

function wheel(c: C, x: number, axle: number, wr: number, spin: number, gold: boolean) {
  c.beginPath(); c.arc(x, axle, wr, 0, TAU); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 5);
  if (gold) { c.beginPath(); c.arc(x, axle, wr * .72, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#ffd23f'; c.stroke(); }
  c.beginPath(); c.arc(x, axle, wr * .45, 0, TAU); c.fillStyle = gold ? '#ffd23f' : '#c9ccd6'; c.fill(); outline(c, 3);
  c.save(); c.translate(x, axle); c.rotate(spin); c.strokeStyle = O; c.lineWidth = 3;
  for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(wr * .5, 0); c.lineTo(wr * .9, 0); c.stroke(); }
  c.restore();
}
/** A strut or bar: a dark outline with a grey middle. */
function bar(c: C, pts: readonly (readonly [number, number])[], w: number, col = '#9aa3ad') {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); outline(c, w + 4); c.strokeStyle = col; c.lineWidth = w; c.stroke();
}

/**
 * The Spider Walker's legs on one side, behind its body: the front and back ones bend up to a knee outside the body and down to the
 * ground, like a spider's. The `far` side is darker and steps the other way. Each leg steps in turn as it walks.
 */
function legs(c: C, f: Frame, foot: number, spin: number, far: boolean, gold: boolean) {
  const hy = (f.top + f.bottom) / 2;
  [-30, 0, 30].forEach((hip, i) => {
    const p = spin * .5 + i * 2.1 + (far ? Math.PI : 0), shift = far ? -10 : 0;
    const fx = hip * 2.1 + shift + Math.sin(p) * 14, lift = Math.max(0, Math.cos(p)) * 14, kx = hip * 2.5 + shift, ky = f.top + 2 - lift * .5;
    bar(c, [[hip + shift, hy], [kx, ky], [fx, -lift - 4]], 8, far ? '#5a3a8f' : '#b48cf0');
    c.beginPath(); c.arc(kx, ky, 5, 0, TAU); c.fillStyle = far ? '#3d2766' : '#ffd23f'; c.fill(); outline(c, 3);
    c.beginPath(); c.arc(fx, -lift - 4, foot, 0, TAU); c.fillStyle = gold ? '#ffd23f' : far ? '#5b6170' : '#c9ccd6'; c.fill(); outline(c, 4);
  });
}

/** Two long treads from `a` to `b`, rolling round their wheels. */
function treads(c: C, a: number, b: number, wheels: readonly number[], wr: number, spin: number, gold: boolean) {
  const h = 2 * wr + 12;
  c.beginPath(); c.roundRect(a, -h, b - a, h, h / 2); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 5);
  c.save(); c.beginPath(); c.roundRect(a + 4, -h + 4, b - a - 8, h - 8, h / 2 - 4); c.setLineDash([7, 7]); c.lineDashOffset = -spin * wr; c.lineWidth = 5; c.strokeStyle = '#7d8794'; c.stroke(); c.restore();
  for (const x of wheels) wheel(c, x, -h / 2, wr, spin, gold);
}

/** The Robo Dog's legs on one side, a back one and a front one, trotting: the `far` side is darker and steps the other way. */
function dogLegs(c: C, f: Frame, foot: number, spin: number, far: boolean, gold: boolean) {
  [-36, 18].forEach((hip, i) => {
    const p = spin * .5 + i * Math.PI + (far ? Math.PI / 2 : 0), shift = far ? -8 : 0;
    const fx = hip + shift + Math.sin(p) * 14, lift = Math.max(0, Math.cos(p)) * 12, kx = hip + shift + 8, ky = -36 - lift * .5;
    bar(c, [[hip + shift, f.bottom - 6], [kx, ky], [fx, -lift - 4]], 8, far ? '#4a6a8f' : '#b8d4f0');
    c.beginPath(); c.arc(kx, ky, 5, 0, TAU); c.fillStyle = far ? '#2a3d55' : '#ffd23f'; c.fill(); outline(c, 3);
    c.beginPath(); c.arc(fx, -lift - 4, foot, 0, TAU); c.fillStyle = gold ? '#ffd23f' : far ? '#5b6170' : '#c9ccd6'; c.fill(); outline(c, 4);
  });
}

function alien(c: C, x: number, y: number, s: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2) * .12);
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * s * .4, -s * .8); c.lineTo(sx * s * .7, -s * 1.6); outline(c, 3); c.beginPath(); c.arc(sx * s * .7, -s * 1.6, s * .22, 0, TAU); c.fillStyle = '#ffd23f'; c.fill(); outline(c, 2); }
  c.beginPath(); c.ellipse(0, 0, s, s * .9, 0, 0, TAU); c.fillStyle = '#7ee05a'; c.fill(); outline(c, 3);
  for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * s * .38, -s * .1, s * .26, s * .34, sx * .3, 0, TAU); c.fillStyle = O; c.fill(); c.beginPath(); c.arc(sx * s * .38 - s * .08, -s * .22, s * .09, 0, TAU); c.fillStyle = '#fff'; c.fill(); }
  c.beginPath(); c.arc(0, s * .28, s * .3, .2, Math.PI - .2); c.lineWidth = 2; c.strokeStyle = O; c.stroke();
  c.restore();
}

/**
 * A rover from the side, facing right, standing on y = 0. `look` is which rover and what it wears. `spin` turns the wheels (and walks
 * the Spider's legs), `t` blinks the siren, turns the Star Shield and the Disco Ball and bobs the Hover Rover, `go` (0 to 1, how fast
 * it's driving) lights the Turbo Jets, and `chute` opens the Parachute.
 */
export function drawRover(c: C, look: RoverLook, { spin = 0, t = 0, go = 0, chute = false }: { spin?: number; t?: number; go?: number; chute?: boolean } = {}) {
  const has = (g: FeatureId) => look.kit.includes(g), f = frameOf(look, t), wr = wheelR(look), gold = has('gold'), kind = look.kind;
  const { l, r, top, bottom } = f, mid = (l + r) / 2, lightY = top + Math.min(22, (bottom - top) / 2);
  if (has('chute') && chute) { // the Parachute, open above it
    const cx = mid - 6, cy = f.roof - 120, w = 82;
    for (const [x, y] of [[l + 22, top], [mid, f.roof], [r - 22, top]] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(cx + (x - mid) * 2.2, cy); c.lineWidth = 2.5; c.strokeStyle = O; c.stroke(); }
    c.beginPath(); c.arc(cx, cy, w, Math.PI, 0); for (let i = 4; i >= 0; i--) c.quadraticCurveTo(cx - w + (i + .5) * w * .4, cy + 14, cx - w + i * w * .4, cy); c.closePath();
    c.fillStyle = '#e63946'; c.fill(); c.save(); c.clip(); c.fillStyle = '#f4f6fa'; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(cx, cy - w); c.lineTo(cx + k * w * .5, cy + 20); c.lineTo(cx + k * w * .15, cy + 20); c.closePath(); c.fill(); } c.restore();
    c.beginPath(); c.arc(cx, cy, w, Math.PI, 0); outline(c, 5);
  }
  if (has('turbo')) { // two chrome pipes low on the back, burning when it goes fast
    for (const y of [bottom - 9, bottom + 1]) {
      if (go > .15) { const len = 18 + 26 * go + Math.sin(t * 50 + y) * 5; c.beginPath(); c.moveTo(l - 24, y - 4); c.lineTo(l - 24 - len, y + 3); c.lineTo(l - 24, y + 9); c.closePath(); c.fillStyle = '#3ad0ff'; c.fill(); }
      c.beginPath(); c.roundRect(l - 26, y - 4, 34, 11, 4); c.fillStyle = '#d7dce4'; c.fill(); outline(c, 4);
    }
  }
  if (has('booster')) { // a jet on the back
    c.beginPath(); c.roundRect(l - 18, top + 6, 26, 30, 8); c.fillStyle = '#7d8794'; c.fill(); outline(c, 5);
    c.beginPath(); c.moveTo(l - 18, top + 14); c.lineTo(l - 32, top + 8); c.lineTo(l - 32, top + 34); c.lineTo(l - 18, top + 28); c.closePath(); c.fillStyle = '#ff7a00'; c.fill(); outline(c, 4);
  }
  if (has('bubbles')) { // a bubble wand off the back corner
    bar(c, [[l + 4, top + 4], [l - 14, top - 12]], 4);
    c.beginPath(); c.arc(l - 21, top - 18, 9, 0, TAU); c.lineWidth = 8; c.strokeStyle = O; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#ff7ac8'; c.stroke();
  }
  if (has('cannon')) { // the Confetti Cannon, on the back, pointing up
    c.save(); c.translate(l + 10, top + 6); c.rotate(-2.3);
    c.beginPath(); c.roundRect(-4, -12, 46, 24, 7); c.fillStyle = '#8e5bd8'; c.fill(); outline(c, 5);
    for (const [x, col] of [[10, '#ffd23f'], [24, '#4cc46b']] as const) { c.fillStyle = col; c.fillRect(x, -12, 6, 24); }
    c.beginPath(); c.roundRect(-4, -12, 46, 24, 7); outline(c, 5);
    c.restore();
  }
  if (has('spoiler')) { // a racing wing on the back
    bar(c, [[l + 14, top + 2], [l + 10, top - 20]], 5, '#2a2d36');
    c.beginPath(); c.roundRect(l - 16, top - 30, 52, 11, 4); c.fillStyle = '#e63946'; c.fill(); outline(c, 4);
  }
  // what stands behind the body
  if (kind === 'spider') { legs(c, f, wr * .45, spin, true, gold); legs(c, f, wr * .5, spin, false, gold); }
  if (kind === 'hover') for (const x of [-44, 44]) { // the pads' glow down to the ground
    c.save(); c.globalAlpha = .22 + .08 * Math.sin(t * 6 + x); c.beginPath(); c.moveTo(x - 18, bottom + 4); c.lineTo(x + 18, bottom + 4); c.lineTo(x + 30, 0); c.lineTo(x - 30, 0); c.closePath(); c.fillStyle = '#3ad0ff'; c.fill();
    c.globalAlpha = .5; c.beginPath(); c.ellipse(x, -2, 32, 6, 0, 0, TAU); c.fill(); c.restore();
  }
  if (kind === 'monster') for (const s of [-1, 1]) bar(c, [[s * 22, bottom - 2], [s * 50, -wr]], 6); // the struts down to the wheels
  if (kind === 'bike') for (const [a, b] of [[-28, -48], [24, 46]] as const) bar(c, [[a, bottom - 6], [b, -wr]], 6); // the forks down to the wheels
  if (kind === 'pogo') { // the spring, and a fork down to the wheel
    bar(c, [[0, -2 * wr + 2], [0, -wr]], 6);
    const y0 = bottom + 2, y1 = -2 * wr + 2, n = 7;
    c.beginPath(); for (let i = 0; i <= n; i++) c.lineTo(i === 0 || i === n ? 0 : (i % 2 ? -16 : 16), y0 + ((y1 - y0) * i) / n);
    outline(c, 10); c.strokeStyle = '#d7dce4'; c.lineWidth = 5; c.stroke();
  }
  if (kind === 'rocketcar') { // the rocket on its back, burning when it goes fast
    if (go > .1) { const len = 26 + 50 * go + Math.sin(t * 50) * 6; c.beginPath(); c.moveTo(l - 20, top - 16); c.lineTo(l - 20 - len, top - 8); c.lineTo(l - 20, top); c.closePath(); c.fillStyle = '#ff8a1f'; c.fill(); c.beginPath(); c.moveTo(l - 20, top - 12); c.lineTo(l - 20 - len * .55, top - 8); c.lineTo(l - 20, top - 4); c.closePath(); c.fillStyle = '#ffe14d'; c.fill(); }
    c.beginPath(); c.moveTo(l - 10, top - 18); c.lineTo(l - 22, top - 22); c.lineTo(l - 22, top + 2); c.lineTo(l - 10, top - 2); c.closePath(); c.fillStyle = '#5b6170'; c.fill(); outline(c, 4);
    c.beginPath(); c.roundRect(l - 12, top - 20, 62, 20, 10); c.fillStyle = '#f4f6fa'; c.fill(); outline(c, 5);
    c.fillStyle = '#e63946'; c.fillRect(l + 30, top - 18, 6, 16);
    c.beginPath(); c.moveTo(l + 4, top - 18); c.lineTo(l - 4, top - 36); c.lineTo(l + 18, top - 18); c.closePath(); c.fillStyle = '#e63946'; c.fill(); outline(c, 4);
  }
  if (kind === 'dog') { // its tail, wagging, and its far legs
    bar(c, [[l + 4, top + 8], [l - 14, top - 10 + Math.sin(t * 12) * 7]], 6, f.colour);
    dogLegs(c, f, wr * .5, spin, true, gold);
  }
  if (kind === 'ufo') { // the beam down to the ground
    c.save(); c.globalAlpha = .2 + .08 * Math.sin(t * 6); c.beginPath(); c.moveTo(-26, bottom); c.lineTo(26, bottom); c.lineTo(52, 0); c.lineTo(-52, 0); c.closePath(); c.fillStyle = '#7ef0c8'; c.fill();
    c.globalAlpha = .45; c.beginPath(); c.ellipse(0, -2, 54, 7, 0, 0, TAU); c.fill(); c.restore();
  }
  if (kind === 'buggy') { // the roll cage, behind the seat
    c.beginPath(); c.roundRect(l + 32, top - 26, 18, 28, 6); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 4);
  }
  // the body
  c.beginPath(); f.hull(c); c.fillStyle = f.colour; c.fill();
  if (has('stripes') || has('flames')) {
    c.save(); c.beginPath(); f.hull(c); c.clip();
    if (has('flames')) {
      const h = bottom - top, W = (r - l) * .7, ym = top + h * .62;
      for (const [len, yc, th, col] of [[W, ym, h * .46, '#ff5a10'], [W * .7, ym - h * .2, h * .3, '#ff5a10'], [W * .62, ym, h * .24, '#ffd23f']] as const) {
        c.beginPath(); c.moveTo(r + 2, yc - th / 2); c.quadraticCurveTo(r - len * .5, yc - th * .9, r - len, yc - th * .1); c.quadraticCurveTo(r - len * .5, yc + th * .7, r + 2, yc + th / 2); c.closePath(); c.fillStyle = col; c.fill();
        c.lineWidth = 2.5; c.strokeStyle = O; c.stroke();
      }
    }
    if (has('stripes')) { c.fillStyle = '#e63946'; c.fillRect(l, bottom - 18, r - l, 8); c.fillStyle = '#f4f6fa'; c.fillRect(l, bottom - 10, r - l, 4); c.fillRect(l, bottom - 22, r - l, 4); }
    c.restore();
  }
  c.beginPath(); f.hull(c); outline(c, 6);
  shine(c, mid - 20, top + 8, (r - l) * .23, 4);
  // its cab
  if (kind === 'monster') { c.beginPath(); c.roundRect(-34, f.roof, 70, top - f.roof + 4, [12, 12, 0, 0]); c.fillStyle = f.colour; c.fill(); outline(c, 6); }
  if (kind === 'digger') { c.beginPath(); c.roundRect(l + 6, f.roof, 52, top - f.roof + 4, [10, 10, 0, 0]); c.fillStyle = f.colour; c.fill(); outline(c, 6); }
  if (kind === 'bike') { c.beginPath(); c.roundRect(l + 12, top - 9, 42, 11, 5); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 4); } // the seat
  if (kind === 'tank') { c.beginPath(); c.moveTo(l + 14, top + 2); c.lineTo(l + 22, f.roof); c.lineTo(r - 50, f.roof); c.lineTo(r - 38, top + 2); c.closePath(); c.fillStyle = f.colour; c.fill(); outline(c, 6); }
  if (f.window) {
    const [x, y, w, h] = f.window;
    const rad = f.winR ?? 6;
    c.beginPath(); c.roundRect(x, y, w, h, rad); c.fillStyle = kind === 'hover' ? '#3ad0ff' : kind === 'ufo' ? '#7ef0c8' : '#2f6fd6'; c.fill();
    if (has('alien')) { c.save(); c.clip(); alien(c, x + w / 2, y + h * .78, h * .42, t); c.restore(); }
    c.beginPath(); c.roundRect(x, y, w, h, rad); outline(c, 4);
    if (f.winR) shine(c, x + w * .3, y + h * .35, 5, h * .2);
  } else if (has('alien')) alien(c, l + 46, top - 16, 11, t); // in the buggy's seat
  if (kind === 'buggy') bar(c, [[l + 18, top + 1], [l + 28, f.roof], [f.mast, f.roof], [r - 38, top + 2]], 5, '#d7dce4');
  if (kind === 'hover') { c.fillStyle = '#3ad0ff'; c.fillRect(l + 10, bottom - 12, r - l - 20, 5); }
  if (kind === 'bike') bar(c, [[r - 8, top + 2], [r + 6, top - 20], [r - 6, top - 26]], 5, '#d7dce4'); // the handlebars
  if (kind === 'ufo') for (let i = 0; i < 5; i++) { // lights round the rim, blinking in turn
    const on = Math.floor(t * 5) % 5 === i;
    c.beginPath(); c.arc(-56 + i * 28, (top + bottom) / 2 + 2, 6, 0, TAU); c.fillStyle = on ? '#ffe14d' : ['#e63946', '#3a8dde', '#4cc46b', '#ff7ac8', '#ff8a1f'][i]!; c.fill(); outline(c, 3);
  }
  if (kind === 'dog') { // its head, up in front, with an ear, an eye and a nose
    c.beginPath(); c.moveTo(r + 4, top - 22); c.lineTo(r + 10, top - 46); c.lineTo(r + 20, top - 24); c.closePath(); c.fillStyle = '#5a7fa8'; c.fill(); outline(c, 4);
    c.beginPath(); c.roundRect(r - 6, top - 28, 44, 32, 11); c.fillStyle = f.colour; c.fill(); outline(c, 5);
    c.beginPath(); c.arc(r + 18, top - 14, 5, 0, TAU); c.fillStyle = O; c.fill(); c.beginPath(); c.arc(r + 19, top - 16, 1.8, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); c.arc(r + 37, top - 10, 5, 0, TAU); c.fillStyle = O; c.fill();
  }
  if (has('dome')) { // a glass bubble over the cab
    c.beginPath(); c.arc(f.cab, f.roof + 2, 32, Math.PI, 0); c.closePath(); c.save(); c.globalAlpha = .45; c.fillStyle = '#bfe8ff'; c.fill(); c.restore(); outline(c, 4);
    shine(c, f.cab - 13, f.roof - 14, 6, 10);
  }
  if (has('fireworks')) { // three little rockets in a box on the back
    for (const [x, col] of [[l + 30, '#e63946'], [l + 39, '#ffd23f'], [l + 48, '#3a8dde']] as const) {
      c.beginPath(); c.moveTo(x - 4, top - 6); c.lineTo(x - 4, top - 18); c.lineTo(x, top - 26); c.lineTo(x + 4, top - 18); c.lineTo(x + 4, top - 6); c.closePath(); c.fillStyle = col; c.fill(); outline(c, 3);
    }
    c.beginPath(); c.roundRect(l + 24, top - 10, 30, 12, 3); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 4);
  }
  // mast and camera head
  const hy = f.headY;
  if (f.mastH > 0) { c.beginPath(); c.moveTo(f.mast, f.mastY); c.lineTo(f.mast, f.mastY - f.mastH); outline(c, 9); c.strokeStyle = '#d7dce4'; c.lineWidth = 4; c.stroke(); }
  c.beginPath(); c.roundRect(f.mast - 16, hy, 44, 26, 9); c.fillStyle = '#f4f6fa'; c.fill(); outline(c, 5);
  c.beginPath(); c.arc(f.mast + 16, hy + 13, 7, 0, TAU); c.fillStyle = O; c.fill();
  c.beginPath(); c.arc(f.mast + 18, hy + 11, 2.5, 0, TAU); c.fillStyle = '#fff'; c.fill();
  if (has('dish')) { // a satellite dish on an arm off the mast
    c.beginPath(); c.moveTo(f.mast, Math.min(hy + 38, f.mastY)); c.lineTo(f.mast - 22, hy + 30); outline(c, 6); c.strokeStyle = '#d7dce4'; c.lineWidth = 2.5; c.stroke();
    c.save(); c.translate(f.mast - 26, hy + 26); c.rotate(-.5);
    c.beginPath(); c.arc(0, 0, 17, Math.PI, 0); c.closePath(); c.fillStyle = '#f4f6fa'; c.fill(); outline(c, 4);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -14); c.lineWidth = 3; c.strokeStyle = O; c.stroke(); c.beginPath(); c.arc(0, -16, 3.5, 0, TAU); c.fillStyle = '#e63946'; c.fill();
    c.restore();
  }
  if (has('disco')) { // a mirror ball on the camera, turning and throwing sparkles
    const bx = f.mast + 6, by = hy - 20;
    bar(c, [[bx, hy], [bx, by + 10]], 3);
    c.beginPath(); c.arc(bx, by, 13, 0, TAU); c.fillStyle = '#c9ccd6'; c.fill();
    c.save(); c.clip(); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { c.fillStyle = ['#ffffff', '#9fd8ff', '#ff9ad5', '#ffe14d'][(i + j + Math.floor(t * 6)) % 4]!; c.fillRect(bx - 13 + i * 5 + ((t * 20) % 5), by - 13 + j * 7, 4, 6); } c.restore();
    c.beginPath(); c.arc(bx, by, 13, 0, TAU); outline(c, 4);
    for (let i = 0; i < 4; i++) { const a = t * 3 + (i * TAU) / 4; c.save(); c.globalAlpha = .7; star(c, bx + Math.cos(a) * 26, by + Math.sin(a) * 12, 4.5, ['#ff7ac8', '#3ad0ff', '#ffe14d', '#4cc46b'][i]!, 1.5); c.restore(); }
  }
  if (has('antenna')) {
    c.beginPath(); c.moveTo(l + 20, top); c.lineTo(l + 8, top - 46); outline(c, 6); c.strokeStyle = '#d7dce4'; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.arc(l + 8, top - 50, 7, 0, TAU); c.fillStyle = '#e63946'; c.fill(); outline(c, 4);
  }
  if (has('chute') && !chute) { // the Parachute, packed
    c.beginPath(); c.roundRect(f.mast + 2, f.roof - 16, 24, 17, 6); c.fillStyle = '#e63946'; c.fill(); outline(c, 4);
    c.fillStyle = '#f4f6fa'; c.fillRect(f.mast + 12, f.roof - 14, 4, 13);
  }
  if (has('wings')) for (const s of [-1, 1]) {
    c.save(); c.translate(mid - 10, f.roof - 6); c.rotate(s * .32);
    c.beginPath(); c.roundRect(s > 0 ? 0 : -70, -10, 70, 18, 4); c.fillStyle = '#2f6fd6'; c.fill(); outline(c, 4);
    c.restore();
  }
  if (has('siren')) { // on top of the Bubble Dome when it has one
    const on = Math.floor(t * 4) % 2 === 0, sy = has('dome') ? f.roof - 42 : f.roof - 14, sx = has('dome') ? f.cab - 20 : f.cab - 5;
    c.beginPath(); c.roundRect(sx, sy, 40, 14, 6); c.fillStyle = on ? '#e63946' : '#3a8dde'; c.fill(); outline(c, 4);
    if (on) { c.save(); c.globalAlpha = .35; c.beginPath(); c.arc(sx + 20, sy + 6, 34, 0, TAU); c.fillStyle = '#ff5a5a'; c.fill(); c.restore(); }
  }
  if (has('arm')) { // a robot arm folded on the front, with a claw
    bar(c, [[r - 14, top + 6], [r + 6, top - 22], [r + 22, top - 2]], 6);
    for (const [x, y] of [[r - 14, top + 6], [r + 6, top - 22]] as const) { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fillStyle = '#ff8a1f'; c.fill(); outline(c, 3); }
    c.beginPath(); c.moveTo(r + 16, top + 4); c.lineTo(r + 20, top + 14); c.moveTo(r + 28, top + 2); c.lineTo(r + 28, top + 13); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
  }
  if (has('lights')) {
    c.save(); c.globalAlpha = .3; c.beginPath(); c.moveTo(r + 2, lightY); c.lineTo(r + 136, lightY - 40); c.lineTo(r + 136, lightY + 42); c.closePath(); c.fillStyle = '#fff6c2'; c.fill(); c.restore();
    c.beginPath(); c.arc(r, lightY, 8, 0, TAU); c.fillStyle = '#fff6c2'; c.fill(); outline(c, 4);
  }
  if (has('magnet')) {
    bar(c, [[r - 4, bottom - 12], [r + 20, bottom - 12]], 4);
    c.beginPath(); c.arc(r + 28, bottom - 12, 11, -Math.PI / 2, Math.PI / 2); c.lineWidth = 12; c.strokeStyle = O; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#e63946'; c.stroke();
  }
  if (has('plow')) { // a snow plow blade low on the front
    const y1 = bottom - 6, y2 = Math.max(bottom + 8, -4), x = r + 6;
    bar(c, [[r - 6, bottom - 4], [x + 4, (y1 + y2) / 2]], 4, '#5b6170');
    c.beginPath(); c.moveTo(x, y1 - 6); c.lineTo(x + 14, y1 - 10); c.quadraticCurveTo(x + 8, (y1 + y2) / 2, x + 24, y2); c.lineTo(x + 4, y2); c.quadraticCurveTo(x - 2, (y1 + y2) / 2, x, y1 - 6); c.closePath();
    c.fillStyle = '#ffb02e'; c.fill(); c.save(); c.clip(); c.strokeStyle = O; c.lineWidth = 4; for (let k = -2; k < 5; k++) { c.beginPath(); c.moveTo(x - 6, y1 + k * 12); c.lineTo(x + 30, y1 + k * 12 - 14); c.stroke(); } c.restore();
    c.beginPath(); c.moveTo(x, y1 - 6); c.lineTo(x + 14, y1 - 10); c.quadraticCurveTo(x + 8, (y1 + y2) / 2, x + 24, y2); c.lineTo(x + 4, y2); c.quadraticCurveTo(x - 2, (y1 + y2) / 2, x, y1 - 6); c.closePath(); outline(c, 4);
  }
  if (kind === 'digger') { // the scoop on its arm
    bar(c, [[r - 10, top + 8], [r + 20, top - 34], [r + 44, bottom - 4]], 7);
    for (const [x, y] of [[r - 10, top + 8], [r + 20, top - 34]] as const) { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fillStyle = '#5b6170'; c.fill(); outline(c, 3); }
    c.beginPath(); c.moveTo(r + 32, bottom - 14); c.lineTo(r + 58, bottom - 16); c.lineTo(r + 56, bottom + 12); c.quadraticCurveTo(r + 38, bottom + 16, r + 32, bottom - 14); c.closePath();
    c.fillStyle = f.colour; c.fill(); outline(c, 5);
    c.beginPath(); for (let i = 0; i < 3; i++) { c.moveTo(r + 40 + i * 6, bottom + 13); c.lineTo(r + 43 + i * 6, bottom + 19); c.lineTo(r + 46 + i * 6, bottom + 13); } c.fillStyle = '#d7dce4'; c.fill(); c.lineWidth = 2; c.strokeStyle = O; c.stroke();
  }
  // what it stands on
  if (kind === 'scout') {
    bar(c, [[-46, -wr], [-10, bottom + 4], [46, -wr]], 4);
    for (const x of [-46, 0, 46]) wheel(c, x, -wr, wr, spin, gold);
  }
  if (kind === 'buggy') for (const x of [-50, 48]) wheel(c, x, -wr, wr, spin, gold);
  if (kind === 'monster') for (const x of [-50, 50]) wheel(c, x, -wr, wr, spin, gold);
  if (kind === 'tank') treads(c, -70, 70, [-46, -16, 16, 46], wr, spin, gold);
  if (kind === 'digger') treads(c, -66, 46, [-44, -10, 24], wr, spin, gold);
  if (kind === 'bike') for (const x of [-48, 46]) wheel(c, x, -wr, wr, spin, gold);
  if (kind === 'pogo') wheel(c, 0, -wr, wr, spin, gold);
  if (kind === 'rocketcar') for (const x of [-48, 50]) wheel(c, x, -wr, wr, spin, gold);
  if (kind === 'dog') dogLegs(c, f, wr * .5, spin, false, gold);
  if (kind === 'hover') for (const x of [-44, 44]) {
    const w = wr > 17 ? 56 : 42;
    c.beginPath(); c.roundRect(x - w / 2, bottom - 4, w, 13, 6); c.fillStyle = gold ? '#ffd23f' : '#7d8794'; c.fill(); outline(c, 4);
    c.beginPath(); c.roundRect(x - w / 2 + 6, bottom + 5, w - 12, 4, 2); c.fillStyle = '#3ad0ff'; c.fill();
  }
  if (has('shield')) for (let i = 0; i < 3; i++) { // three stars going round it
    const a = t * 2.2 + (i * TAU) / 3;
    c.save(); c.globalAlpha = Math.sin(a) < 0 ? .55 : 1; star(c, mid + Math.cos(a) * 84, top + 4 + Math.sin(a) * 26, 10, '#ffe14d', 3); c.restore();
  }
}

/** A planet seen from space, centred on 0,0, radius r. */
export function drawGlobe(c: C, p: Pick<Planet, 'globe' | 'feature'>, r: number, lw = Math.max(3, r * .07)) {
  if (p.feature === 'rings') { c.save(); c.beginPath(); c.ellipse(0, 0, r * 1.7, r * .42, -.3, Math.PI, TAU); c.lineWidth = r * .16; c.strokeStyle = '#f5e2a8'; c.stroke(); c.restore(); }
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = p.globe; c.fill();
  c.save(); c.clip();
  c.fillStyle = '#00000026'; c.beginPath(); c.arc(r * .35, r * .35, r * 1.05, 0, TAU); c.fill(); // the night side
  const spot = (x: number, y: number, s: number, col: string) => { c.beginPath(); c.arc(x * r, y * r, s * r, 0, TAU); c.fillStyle = col; c.fill(); };
  if (p.feature === 'craters') { spot(-.3, -.2, .2, '#00000022'); spot(.25, .3, .14, '#00000022'); spot(.3, -.4, .1, '#00000022'); }
  if (p.feature === 'dust') { c.fillStyle = '#ffffff22'; c.fillRect(-r, -r * .2, r * 2, r * .18); c.fillRect(-r, r * .3, r * 2, r * .1); }
  if (p.feature === 'ice') { spot(0, -.85, .5, '#ffffffcc'); spot(0, .9, .4, '#ffffffaa'); }
  if (p.feature === 'lava') { c.strokeStyle = '#ffd23f'; c.lineWidth = r * .07; c.beginPath(); c.moveTo(-r * .8, -r * .2); c.lineTo(-r * .1, r * .1); c.lineTo(r * .3, -r * .4); c.moveTo(-r * .3, r * .6); c.lineTo(r * .5, r * .3); c.stroke(); }
  if (p.feature === 'crystals') { spot(-.3, .1, .16, '#c7fff6'); spot(.3, -.3, .12, '#c7fff6'); spot(.2, .45, .1, '#8e5bd8'); }
  if (p.feature === 'jungle') { spot(-.35, -.25, .3, '#2a6b27'); spot(.35, .3, .28, '#2a6b27'); }
  if (p.feature === 'rainbow') ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cc46b', '#3a8dde'].forEach((col, i) => { c.fillStyle = col; c.fillRect(-r, -r + i * r * .4, r * 2, r * .4); });
  if (p.feature === 'candy') { c.strokeStyle = '#ffffffcc'; c.lineWidth = r * .16; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * r * .55 - r, -r); c.lineTo(i * r * .55 + r, r); c.stroke(); } }
  if (p.feature === 'bubbles') { c.strokeStyle = '#ffffffdd'; c.lineWidth = Math.max(1.5, r * .06); for (const [x, y, s] of [[-.35, -.2, .22], [.3, .25, .17], [.1, -.5, .12], [-.2, .5, .1]]) { c.beginPath(); c.arc(x! * r, y! * r, s! * r, 0, TAU); c.stroke(); } }
  if (p.feature === 'ocean') { spot(-.35, -.25, .3, '#4cc46b'); spot(.4, .3, .22, '#4cc46b'); spot(.2, -.55, .12, '#f2d68a'); }
  if (p.feature === 'cactus') { c.fillStyle = '#c4782a'; for (const y of [-.5, .05, .55]) c.fillRect(-r, y * r, r * 2, r * .16); }
  if (p.feature === 'mushrooms') { spot(-.3, -.3, .16, '#ffffffdd'); spot(.3, -.1, .13, '#ffffffdd'); spot(-.05, .4, .15, '#ffffffdd'); }
  if (p.feature === 'storm') { c.fillStyle = '#9aa3b8'; c.fillRect(-r, -r * .3, r * 2, r * .2); c.strokeStyle = '#ffe14d'; c.lineWidth = r * .08; c.beginPath(); c.moveTo(r * .1, -r * .7); c.lineTo(-r * .15, 0); c.lineTo(r * .12, 0); c.lineTo(-r * .1, r * .6); c.stroke(); }
  if (p.feature === 'robot') { c.strokeStyle = '#5b6170'; c.lineWidth = Math.max(1.5, r * .06); for (const k of [-.5, 0, .5]) { c.beginPath(); c.moveTo(-r, k * r); c.lineTo(r, k * r); c.moveTo(k * r, -r); c.lineTo(k * r, r); c.stroke(); } }
  if (p.feature === 'stars') { for (const [x, y, s] of [[-.35, -.25, .2], [.3, .3, .16], [.25, -.45, .1]]) star(c, x! * r, y! * r, s! * r, '#fff6c2', Math.max(1, r * .03)); }
  c.restore();
  shine(c, -r * .35, -r * .4, r * .25, r * .16);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); outline(c, lw);
  if (p.feature === 'rings') { c.save(); c.beginPath(); c.ellipse(0, 0, r * 1.7, r * .42, -.3, 0, Math.PI); c.lineWidth = r * .16; c.strokeStyle = '#f5e2a8'; c.stroke(); c.restore(); }
}

/** The crystal he collects on a planet, centred on 0,0. */
export function drawCrystal(c: C, size: number, t = 0) {
  c.save(); c.rotate(Math.sin(t * 2) * .12);
  c.beginPath(); c.moveTo(0, -size); c.lineTo(size * .6, -size * .2); c.lineTo(0, size); c.lineTo(-size * .6, -size * .2); c.closePath();
  c.fillStyle = '#7ef0ff'; c.fill(); outline(c, 4);
  c.beginPath(); c.moveTo(0, -size); c.lineTo(0, size); c.moveTo(-size * .6, -size * .2); c.lineTo(size * .6, -size * .2); c.lineWidth = 2; c.strokeStyle = '#ffffffaa'; c.stroke();
  c.restore();
}

/** A Bolt floating in space: the family's hex bolt. */
export function drawBolt(c: C, size: number) {
  c.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * TAU) / 6; c.lineTo(Math.cos(a) * size, Math.sin(a) * size); }
  c.closePath(); c.fillStyle = '#ffc21a'; c.fill(); c.lineWidth = Math.max(3, size * .16); c.strokeStyle = '#7a5200'; c.stroke();
  c.beginPath(); c.arc(0, 0, size * .38, 0, TAU); c.fillStyle = '#e0a000'; c.fill(); c.lineWidth = Math.max(2, size * .12); c.stroke();
}
