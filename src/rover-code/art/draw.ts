// The reward's pictures, drawn in code on a 2D canvas: his rocket from its parts, his rover from the side with every gadget it has
// won, and the planets as globes. The Base, the flight and the planet drive all use these, so the rocket he built is the one that
// flies. Family look: thick dark outlines, flat toy colours, one highlight.
import { paintOf, type Rocket } from '../base/parts';
import type { GadgetId, Planet } from '../base/planets';

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
  // flames first, under everything
  if (flame > 0) {
    const nozzles = r.engine === 'twin' ? [-18, 18] : r.engine === 'triple' || r.engine === 'plasma' ? [-26, 0, 26] : r.engine === 'mega' ? [-50, 0, 50]
      : r.engine === 'quad' ? [-36, -12, 12, 36] : r.engine === 'hyper' ? [-58, 0, 58] : [0];
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
    for (const s of [-1, 1]) { // two big side boosters with glowing rings
      c.beginPath(); c.roundRect(s * 58 - 16, -30, 32, 116, 14); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 5);
      for (const y of [0, 34]) { c.beginPath(); c.roundRect(s * 58 - 16, y, 32, 8, 3); c.fillStyle = '#3ad0ff'; c.fill(); }
      c.beginPath(); c.moveTo(s * 58 - 11, -30); c.lineTo(s * 58, -58); c.lineTo(s * 58 + 11, -30); c.closePath(); c.fillStyle = trim; c.fill(); outline(c, 5);
      nozzle(s * 58, 13, 34);
    }
  }
  else {
    nozzle(0, 26, 46);
    for (const s of [-1, 1]) { // side boosters
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
    else if (r.fins === 'dragon') {
      c.moveTo(s * bw, -56); c.quadraticCurveTo(s * (bw + 50), -84, s * (bw + 76), -30);
      c.quadraticCurveTo(s * (bw + 52), 0, s * (bw + 76), 30); c.quadraticCurveTo(s * (bw + 50), 50, s * (bw + 70), 90);
      c.quadraticCurveTo(s * (bw + 34), 70, s * bw, 76);
    }
    else { c.moveTo(s * bw, -40); c.quadraticCurveTo(s * (bw + 70), 10, s * (bw + 62), 104); c.lineTo(s * (bw + 30), 92); c.lineTo(s * bw, 70); }
    c.closePath(); c.fill(); outline(c, 6);
  }
  if (r.fins === 'wing' || r.fins === 'dragon') { c.beginPath(); c.roundRect(-7, 30, 14, 82, 6); c.fill(); outline(c, 5); }
  if (r.fins === 'jet') for (const s of [-1, 1]) { c.beginPath(); c.arc(s * (bw + 74), 58, 7, 0, TAU); c.fillStyle = s < 0 ? '#e63946' : '#3ddc84'; c.fill(); outline(c, 3); } // wingtip lights
  if (r.fins === 'dragon') { c.strokeStyle = O; c.lineWidth = 3; for (const s of [-1, 1]) for (const y of [-30, 30]) { c.beginPath(); c.moveTo(s * bw, y + 30); c.lineTo(s * (bw + 66), y); c.stroke(); } } // the wing's bones
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

export function star(c: C, x: number, y: number, r: number, fill: string, lw = 5) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = fill; c.fill(); outline(c, lw);
}

/** Room the rover takes round its middle, so a view can fit it. */
export const ROVER_SPAN = { left: -95, right: 95, top: -130, bottom: 52 };

/**
 * The rover from the side, facing right, standing on y = 0 at its wheels' bottoms. `spin` turns the wheels, `t` blinks the siren and
 * turns the Star Shield, `go` (0 to 1, how fast it's driving) lights the Turbo Jets. It wears every gadget it has.
 */
export function drawRover(c: C, gadgets: readonly GadgetId[], { spin = 0, t = 0, go = 0 }: { spin?: number; t?: number; go?: number } = {}) {
  const has = (g: GadgetId) => gadgets.includes(g), wr = has('wheels') ? 24 : 17, axle = -wr;
  if (has('turbo')) { // two chrome pipes low on the back, burning when it goes fast
    for (const y of [axle - 21, axle - 11]) {
      if (go > .15) { const len = 18 + 26 * go + Math.sin(t * 50 + y) * 5; c.beginPath(); c.moveTo(-88, y - 4); c.lineTo(-88 - len, y + 3); c.lineTo(-88, y + 9); c.closePath(); c.fillStyle = '#3ad0ff'; c.fill(); }
      c.beginPath(); c.roundRect(-90, y - 4, 34, 11, 4); c.fillStyle = '#d7dce4'; c.fill(); outline(c, 4);
    }
  }
  if (has('booster')) { // a jet on the back
    c.beginPath(); c.roundRect(-82, axle - 52, 26, 30, 8); c.fillStyle = '#7d8794'; c.fill(); outline(c, 5);
    c.beginPath(); c.moveTo(-82, axle - 44); c.lineTo(-96, axle - 50); c.lineTo(-96, axle - 24); c.lineTo(-82, axle - 30); c.closePath(); c.fillStyle = '#ff7a00'; c.fill(); outline(c, 4);
  }
  const bodyTop = axle - 58, bodyBottom = axle - 12;
  if (has('cannon')) { // the Confetti Cannon, on the back, pointing up
    c.save(); c.translate(-54, bodyTop + 6); c.rotate(-2.3);
    c.beginPath(); c.roundRect(-4, -12, 46, 24, 7); c.fillStyle = '#8e5bd8'; c.fill(); outline(c, 5);
    for (const [x, col] of [[10, '#ffd23f'], [24, '#4cc46b']] as const) { c.fillStyle = col; c.fillRect(x, -12, 6, 24); }
    c.beginPath(); c.roundRect(-4, -12, 46, 24, 7); outline(c, 5);
    c.restore();
  }
  // body
  c.beginPath(); c.roundRect(-64, bodyTop, 128, bodyBottom - bodyTop, 14); c.fillStyle = '#ffd23f'; c.fill();
  if (has('stripes')) { c.save(); c.clip(); c.fillStyle = '#e63946'; c.fillRect(-64, bodyBottom - 18, 128, 8); c.fillStyle = '#f4f6fa'; c.fillRect(-64, bodyBottom - 10, 128, 4); c.fillRect(-64, bodyBottom - 22, 128, 4); c.restore(); }
  c.beginPath(); c.roundRect(-64, bodyTop, 128, bodyBottom - bodyTop, 14); outline(c, 6);
  c.beginPath(); c.roundRect(-52, bodyTop + 10, 54, 24, 6); c.fillStyle = '#2f6fd6'; c.fill(); outline(c, 4);
  shine(c, -20, bodyTop + 8, 30, 4);
  if (has('dome')) { // a glass bubble over the cab
    c.beginPath(); c.arc(-25, bodyTop + 2, 32, Math.PI, 0); c.closePath(); c.save(); c.globalAlpha = .45; c.fillStyle = '#bfe8ff'; c.fill(); c.restore(); outline(c, 4);
    shine(c, -38, bodyTop - 14, 6, 10);
  }
  // mast and camera head
  c.beginPath(); c.moveTo(30, bodyTop); c.lineTo(30, bodyTop - 34); outline(c, 9); c.strokeStyle = '#d7dce4'; c.lineWidth = 4; c.stroke();
  c.beginPath(); c.roundRect(14, bodyTop - 56, 44, 26, 9); c.fillStyle = '#f4f6fa'; c.fill(); outline(c, 5);
  c.beginPath(); c.arc(46, bodyTop - 43, 7, 0, TAU); c.fillStyle = O; c.fill();
  c.beginPath(); c.arc(48, bodyTop - 45, 2.5, 0, TAU); c.fillStyle = '#fff'; c.fill();
  if (has('dish')) { // a satellite dish on an arm off the mast
    c.beginPath(); c.moveTo(30, bodyTop - 18); c.lineTo(8, bodyTop - 26); outline(c, 6); c.strokeStyle = '#d7dce4'; c.lineWidth = 2.5; c.stroke();
    c.save(); c.translate(4, bodyTop - 30); c.rotate(-.5);
    c.beginPath(); c.arc(0, 0, 17, Math.PI, 0); c.closePath(); c.fillStyle = '#f4f6fa'; c.fill(); outline(c, 4);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -14); c.lineWidth = 3; c.strokeStyle = O; c.stroke(); c.beginPath(); c.arc(0, -16, 3.5, 0, TAU); c.fillStyle = '#e63946'; c.fill();
    c.restore();
  }
  if (has('antenna')) {
    c.beginPath(); c.moveTo(-44, bodyTop); c.lineTo(-56, bodyTop - 46); outline(c, 6); c.strokeStyle = '#d7dce4'; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.arc(-56, bodyTop - 50, 7, 0, TAU); c.fillStyle = '#e63946'; c.fill(); outline(c, 4);
  }
  if (has('wings')) for (const s of [-1, 1]) {
    c.save(); c.translate(-10, bodyTop - 6); c.rotate(s * .32);
    c.beginPath(); c.roundRect(s > 0 ? 0 : -70, -10, 70, 18, 4); c.fillStyle = '#2f6fd6'; c.fill(); outline(c, 4);
    c.restore();
  }
  if (has('siren')) { // on top of the Bubble Dome when it has one
    const on = Math.floor(t * 4) % 2 === 0, sy = has('dome') ? bodyTop - 42 : bodyTop - 14, sx = has('dome') ? -45 : -30;
    c.beginPath(); c.roundRect(sx, sy, 40, 14, 6); c.fillStyle = on ? '#e63946' : '#3a8dde'; c.fill(); outline(c, 4);
    if (on) { c.save(); c.globalAlpha = .35; c.beginPath(); c.arc(sx + 20, sy + 6, 34, 0, TAU); c.fillStyle = '#ff5a5a'; c.fill(); c.restore(); }
  }
  if (has('arm')) { // a robot arm folded on the front, with a claw
    c.beginPath(); c.moveTo(50, bodyTop + 6); c.lineTo(70, bodyTop - 22); c.lineTo(86, bodyTop - 2); outline(c, 11); c.strokeStyle = '#9aa3ad'; c.lineWidth = 6; c.stroke();
    for (const [x, y] of [[50, bodyTop + 6], [70, bodyTop - 22]] as const) { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fillStyle = '#ff8a1f'; c.fill(); outline(c, 3); }
    c.beginPath(); c.moveTo(80, bodyTop + 4); c.lineTo(84, bodyTop + 14); c.moveTo(92, bodyTop + 2); c.lineTo(92, bodyTop + 13); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
  }
  if (has('lights')) {
    c.save(); c.globalAlpha = .3; c.beginPath(); c.moveTo(66, axle - 36); c.lineTo(200, axle - 76); c.lineTo(200, axle + 6); c.closePath(); c.fillStyle = '#fff6c2'; c.fill(); c.restore();
    c.beginPath(); c.arc(64, axle - 36, 8, 0, TAU); c.fillStyle = '#fff6c2'; c.fill(); outline(c, 4);
  }
  if (has('magnet')) {
    c.beginPath(); c.moveTo(60, axle - 24); c.lineTo(84, axle - 24); outline(c, 8); c.strokeStyle = '#9aa3ad'; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.arc(92, axle - 24, 11, -Math.PI / 2, Math.PI / 2); c.lineWidth = 12; c.strokeStyle = O; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#e63946'; c.stroke();
  }
  // wheels on rocker arms
  c.beginPath(); c.moveTo(-46, axle); c.lineTo(-10, bodyBottom + 4); c.lineTo(46, axle); outline(c, 8); c.strokeStyle = '#9aa3ad'; c.lineWidth = 4; c.stroke();
  const gold = has('gold');
  for (const x of [-46, 0, 46]) {
    c.beginPath(); c.arc(x, axle, wr, 0, TAU); c.fillStyle = '#2a2d36'; c.fill(); outline(c, 5);
    if (gold) { c.beginPath(); c.arc(x, axle, wr * .72, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#ffd23f'; c.stroke(); }
    c.beginPath(); c.arc(x, axle, wr * .45, 0, TAU); c.fillStyle = gold ? '#ffd23f' : '#c9ccd6'; c.fill(); outline(c, 3);
    c.save(); c.translate(x, axle); c.rotate(spin); c.strokeStyle = O; c.lineWidth = 3;
    for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(wr * .5, 0); c.lineTo(wr * .9, 0); c.stroke(); }
    c.restore();
  }
  if (has('shield')) for (let i = 0; i < 3; i++) { // three stars going round it
    const a = t * 2.2 + (i * TAU) / 3;
    c.save(); c.globalAlpha = Math.sin(a) < 0 ? .55 : 1; star(c, Math.cos(a) * 84, bodyTop + 4 + Math.sin(a) * 26, 10, '#ffe14d', 3); c.restore();
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
