// Driving the rover on a planet, seen from the side, as a little simulation and a drawing of it. He holds ◀ or ▶ to drive and taps
// ⤴ to jump; the planet's own gravity makes the Moon's jumps slow and floaty. The ground rolls in hills and craters made from the
// planet's seed, so each planet always looks like itself. Five crystals wait along the way, some low and some up high for a jump, and
// the flag spot is at the far end. Nothing can go wrong: lava only bounces him up (and Mushroom World's mushrooms bounce him higher),
// and he can drive back for a crystal he missed. His gadgets change the drive: Big Wheels jump higher, Solar Wings glide, the Jump
// Booster jumps again in the air, the Crystal Magnet pulls crystals in, Turbo Jets go faster, the Robot Arm reaches further and the
// Confetti Cannon fires with every jump.
//
// The world is 600 units tall; height is measured up from the ground's resting line.
import { seeded, type Rng } from '../../game/rng';
import type { GadgetId, Planet } from '../base/planets';
import { CRYSTALS } from '../base/base';
import { drawCrystal, drawGlobe, drawRocket, drawRover, star } from '../art/draw';
import type { Rocket } from '../base/parts';

export const TRACK = 4400, FLAG_AT = TRACK - 160, START_X = 230, VIEW_H = 600, GROUND_Y = 430;
export const TOP_SPEED = 340, JUMP_HEIGHT = 170, PICK_R = 72;
const ROVER_SCALE = .55, CENTER_UP = 46;

export interface Crystal { x: number; y: number; got: boolean }
/** `boost`: a second jump in mid-air (the Jump Booster). */
export type DriveEvent = 'jump' | 'boost' | 'land' | 'crystal' | 'hot' | 'bounce' | 'flag';
/** A bit of the Confetti Cannon's confetti, flying. */
export interface Bit { x: number; y: number; vx: number; vy: number; col: string; life: number }
export interface Drive {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  airJumps: number;
  spin: number;
  facing: 1 | -1;
  crystals: Crystal[];
  got: number;
  atFlag: boolean;
  events: DriveEvent[];
  ground: (x: number) => number;
  lava: readonly (readonly [number, number])[];
  /** Mushroom World's bouncy mushrooms, as stretches of the ground. */
  pads: readonly (readonly [number, number])[];
  bits: Bit[];
  rng: Rng;
  planet: Planet;
  gadgets: readonly GadgetId[];
}

/** The planet's ground: hills from a few waves, craters for the rocky ones, and flat at both ends for the rocket and the flag. */
export function groundOf(p: Planet): (x: number) => number {
  const rng = seeded([...p.id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7));
  const waves = Array.from({ length: 3 }, (_, i) => ({ a: (i === 0 ? 34 : 13) * (.6 + rng()), f: (i === 0 ? 900 : 380 / (i + .5)) * (.8 + rng() * .4), p: rng() * 6 }));
  const craters = p.feature === 'craters' || p.feature === 'dust' ? Array.from({ length: 5 }, () => ({ at: 700 + rng() * (TRACK - 1400), w: 90 + rng() * 60, d: 26 + rng() * 18 })) : [];
  const bumps = Array.from({ length: 4 }, () => ({ at: 800 + rng() * (TRACK - 1500), w: 130 + rng() * 80, hgt: 30 + rng() * 25 }));
  return x => {
    const edge = Math.min(1, Math.max(0, (x - 380) / 300), Math.max(0, (FLAG_AT - 120 - x) / 300));
    let y = waves.reduce((s, w) => s + w.a * Math.sin(x / w.f * Math.PI * 2 + w.p), 0) * edge;
    for (const c of craters) { const d = (x - c.at) / c.w; if (Math.abs(d) < 1) y -= c.d * (1 - d * d) * edge; }
    for (const b of bumps) { const d = (x - b.at) / b.w; if (Math.abs(d) < 1) y += b.hgt * Math.cos(d * Math.PI / 2) ** 2 * edge; }
    return y;
  };
}

export function createDrive(p: Planet, gadgets: readonly GadgetId[], seed: number): Drive {
  const ground = groundOf(p), rng = seeded(seed);
  const crystals = Array.from({ length: CRYSTALS }, (_, i) => {
    const x = TRACK * (.16 + i * .17) + (rng() - .5) * 160, high = i % 2 === 1;
    return { x, y: ground(x) + (high ? 165 : 62), got: false };
  });
  const lava = p.feature === 'lava' ? [[1500, 1640], [2900, 3060]] as const : [];
  const pads = p.feature === 'mushrooms' ? [[1260, 1370], [2380, 2490], [3460, 3570]] as const : [];
  return { t: 0, x: START_X, y: ground(START_X), vx: 0, vy: 0, grounded: true, airJumps: 0, spin: 0, facing: 1, crystals, got: 0, atFlag: false, events: [], ground, lava, pads, bits: [], rng, planet: p, gadgets };
}

const jumpSpeed = (d: Drive) => Math.sqrt(2 * d.planet.gravity * JUMP_HEIGHT * (d.gadgets.includes('wheels') ? 1.4 : 1));
/** How fast it goes flat out: Turbo Jets add a third. */
export const topSpeed = (gadgets: readonly GadgetId[]) => TOP_SPEED * (gadgets.includes('turbo') ? 1.3 : 1);
const CONFETTI = ['#ff5a5a', '#ffd23f', '#4cc46b', '#3a8dde', '#ff7ac8', '#ffffff'];

/** `dir`: -1, 0 or 1 from the arrows; `jump`: he pressed jump this step. */
export function stepDrive(d: Drive, dt: number, dir: number, jump: boolean) {
  d.events = [];
  d.t += dt;
  if (d.atFlag) { d.vx = 0; return; }
  const icy = d.planet.feature === 'ice', has = (g: GadgetId) => d.gadgets.includes(g);
  const top = topSpeed(d.gadgets);
  if (dir) { d.vx += dir * (icy ? 420 : 760) * (has('turbo') ? 1.25 : 1) * dt; d.facing = dir > 0 ? 1 : -1; }
  else { const slow = (icy ? 220 : 900) * dt; d.vx = Math.abs(d.vx) <= slow ? 0 : d.vx - Math.sign(d.vx) * slow; }
  d.vx = Math.max(-top, Math.min(top, d.vx));
  if (jump && (d.grounded || d.airJumps > 0)) {
    const air = !d.grounded;
    if (air) d.airJumps--;
    d.vy = jumpSpeed(d) * (air ? .8 : 1);
    d.grounded = false;
    d.events.push(air ? 'boost' : 'jump');
    if (has('cannon')) for (let i = 0; i < 16; i++) { // a puff of confetti out of the back, up and away
      const v = 280 + d.rng() * 260, back = .2 + d.rng() * .6;
      d.bits.push({ x: d.x - d.facing * 40, y: d.y + 75, vx: -d.facing * v * back + d.vx * .3, vy: v, col: CONFETTI[i % CONFETTI.length]!, life: 1.4 + d.rng() * .6 });
    }
  }
  const nx = Math.max(60, Math.min(TRACK - 40, d.x + d.vx * dt)), floor = d.ground(nx);
  if (d.grounded) {
    const ahead = d.y + d.vy * dt;
    if (floor < ahead - 3 && Math.abs(d.vx) > 120) { d.grounded = false; } // over a crest fast: it leaves the ground
    else { d.vy = (floor - d.y) / Math.max(dt, 1e-3); d.y = floor; }
  }
  d.x = nx;
  if (!d.grounded) {
    const glide = has('wings') && d.vy < 0 ? .45 : 1;
    d.vy -= d.planet.gravity * glide * dt;
    d.y += d.vy * dt;
    if (d.y <= floor) { d.y = floor; d.vy = 0; d.grounded = true; d.airJumps = has('booster') ? 1 : 0; d.events.push('land'); }
  } else d.airJumps = has('booster') ? 1 : 0;
  d.spin += d.vx * dt / 14;
  for (const [a, b] of d.lava) if (d.grounded && d.x > a && d.x < b) { d.vy = jumpSpeed(d) * .75; d.grounded = false; d.events.push('hot'); }
  for (const [a, b] of d.pads) if (d.grounded && d.x > a && d.x < b) { d.vy = jumpSpeed(d) * 1.3; d.grounded = false; d.events.push('bounce'); }
  for (const b of d.bits) { b.vy -= 500 * dt; b.vx *= 1 - dt * 1.5; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
  if (d.bits.length) d.bits = d.bits.filter(b => b.life > 0);
  // crystals: a touch picks one up; the Magnet pulls them in from further away, and the Robot Arm reaches a little further
  const reach = has('magnet') ? PICK_R * 2.6 : has('arm') ? PICK_R * 1.4 : PICK_R, cy = d.y + CENTER_UP;
  for (const c of d.crystals) {
    if (c.got) continue;
    const dist = Math.hypot(c.x - d.x, c.y - cy);
    if (has('magnet') && dist < reach * 1.5) { c.x += (d.x - c.x) * Math.min(1, dt * 4); c.y += (cy - c.y) * Math.min(1, dt * 4); }
    if (dist < reach) { c.got = true; d.got++; d.events.push('crystal'); }
  }
  if (d.x >= FLAG_AT - 60 && d.grounded) { d.atFlag = true; d.vx = 0; d.events.push('flag'); }
}

// ---------- drawing ----------

export function drawDrive(c: CanvasRenderingContext2D, d: Drive, w: number, h: number, rocket: Rocket, planted: number, reduced: boolean) {
  const k = h / VIEW_H, viewW = w / k, p = d.planet;
  const cam = Math.max(0, Math.min(TRACK - viewW + 80, d.x - viewW * .36));
  const sy = (y: number) => GROUND_Y - y;
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(1, p.sky[1]);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  c.save(); c.scale(k, k);
  // the far sky: stars, home, and the planet's own sight
  c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { c.globalAlpha = .35 + (i % 3) * .2; c.fillRect(((i * 211 - cam * .05) % viewW + viewW) % viewW, (i * 97) % 260, 2.5, 2.5); }
  c.globalAlpha = 1;
  c.save(); c.translate(viewW * .82 - cam * .02, 90); drawGlobe(c, { globe: '#3a8dde', feature: 'jungle' }, 26, 4); c.restore(); // home, far away
  if (p.feature === 'rings') { c.save(); c.translate(viewW * .3 - cam * .03, 130); drawGlobe(c, { globe: '#c287e6', feature: 'rings' }, 70, 6); c.restore(); }
  if (p.feature === 'rainbow') { const cx = viewW * .5 - cam * .04; ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cc46b', '#3a8dde', '#8e5bd8'].forEach((col, i) => { c.beginPath(); c.arc(cx, GROUND_Y + 40, 380 - i * 22, Math.PI, 0); c.lineWidth = 22; c.strokeStyle = col; c.globalAlpha = .55; c.stroke(); }); c.globalAlpha = 1; }
  drawFarSky(c, d, viewW, cam, reduced);
  // far hills, slower than the ground (the sea instead, on Ocean World)
  if (p.feature === 'ocean') {
    c.fillStyle = '#2f7fe0'; c.fillRect(0, GROUND_Y - 110, viewW, VIEW_H);
    c.strokeStyle = '#bfe8ff'; c.lineWidth = 5; c.lineCap = 'round';
    for (let row = 0; row < 3; row++) { c.beginPath(); for (let sx = 0; sx <= viewW + 20; sx += 20) { const wx = sx + cam * (.2 + row * .1) + (reduced ? 0 : d.t * 30); c.lineTo(sx, GROUND_Y - 96 + row * 34 + 6 * Math.sin(wx / 40)); } c.stroke(); }
  } else {
    c.fillStyle = p.ground[1]; c.globalAlpha = .55;
    c.beginPath(); c.moveTo(0, VIEW_H);
    for (let sx = 0; sx <= viewW + 20; sx += 20) { const wx = sx + cam * .45; c.lineTo(sx, GROUND_Y - 70 - 50 * Math.sin(wx / 330) - 30 * Math.sin(wx / 120)); }
    c.lineTo(viewW + 20, VIEW_H); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  c.translate(-cam, 0);
  // the planet's things behind the road
  for (let x = Math.floor(cam / 260) * 260; x < cam + viewW + 260; x += 260) {
    const gy = sy(d.ground(x)), r = ((x / 260) * 7919) % 5;
    if (p.feature === 'ice') { c.fillStyle = '#d9f2ff'; c.beginPath(); c.moveTo(x - 30, gy + 10); c.lineTo(x, gy - 70 - r * 12); c.lineTo(x + 30, gy + 10); c.closePath(); c.fill(); c.lineWidth = 4; c.strokeStyle = '#11131c'; c.stroke(); }
    if (p.feature === 'crystals' && r > 1) { c.save(); c.translate(x, gy - 30); drawCrystal(c, 30 + r * 6); c.restore(); }
    if (p.feature === 'jungle') { c.strokeStyle = '#1d4a1b'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, gy + 10); c.quadraticCurveTo(x + 20, gy - 70, x - 10, gy - 120 - r * 10); c.stroke(); c.fillStyle = '#4cc46b'; c.beginPath(); c.ellipse(x - 10, gy - 124 - r * 10, 34, 16, -.4, 0, Math.PI * 2); c.fill(); c.lineWidth = 4; c.strokeStyle = '#11131c'; c.stroke(); }
    if (p.feature === 'lava' && r > 2) { c.fillStyle = '#2a1a1a'; c.beginPath(); c.moveTo(x - 90, gy + 10); c.lineTo(x - 20, gy - 110); c.lineTo(x + 20, gy - 110); c.lineTo(x + 90, gy + 10); c.closePath(); c.fill(); c.fillStyle = '#ff5a10'; c.fillRect(x - 20, gy - 114, 40, 8); }
    drawScenery(c, p, x, gy, r, d.t, reduced);
  }
  // the rocket he came in, at the start
  c.save(); c.translate(140, sy(d.ground(140)) - 122 * .42); c.scale(.42, .42); drawRocket(c, rocket); c.restore();
  // the ground
  const top = c.createLinearGradient(0, GROUND_Y - 80, 0, VIEW_H);
  top.addColorStop(0, p.ground[0]); top.addColorStop(1, p.ground[1]);
  c.beginPath(); c.moveTo(cam - 20, VIEW_H + 10);
  for (let x = cam - 20; x <= cam + viewW + 20; x += 14) c.lineTo(x, sy(d.ground(x)));
  c.lineTo(cam + viewW + 20, VIEW_H + 10); c.closePath(); c.fillStyle = top; c.fill();
  c.lineWidth = 7; c.strokeStyle = '#11131c'; c.lineJoin = 'round'; c.stroke();
  if (p.feature === 'rainbow') { c.save(); c.clip(); ['#ff9ad5', '#ffe14d', '#9fe3ff'].forEach((col, i) => { c.fillStyle = col; c.globalAlpha = .45; c.fillRect(cam - 20, GROUND_Y + 30 + i * 40, viewW + 40, 18); }); c.restore(); }
  if (p.feature === 'candy') { c.save(); c.clip(); for (let x = Math.floor(cam / 40) * 40; x < cam + viewW + 40; x += 40) { const k = Math.abs(Math.round(x / 40)) % 5; c.fillStyle = ['#ffffff', '#ffe14d', '#7fd3ff', '#4cc46b', '#8e5bd8'][k]!; c.save(); c.translate(x, sy(d.ground(x)) + 26 + (k * 13) % 40); c.rotate(k); c.fillRect(-8, -3, 16, 6); c.restore(); } c.restore(); }
  if (p.feature === 'robot') { c.save(); c.clip(); c.strokeStyle = '#00000040'; c.lineWidth = 4; c.fillStyle = '#5b6170'; for (let x = Math.floor(cam / 160) * 160; x < cam + viewW + 160; x += 160) { const gy = sy(d.ground(x)); c.beginPath(); c.moveTo(x, gy); c.lineTo(x, VIEW_H); c.stroke(); for (const k of [22, 60]) { c.beginPath(); c.arc(x + 14, gy + k, 4, 0, Math.PI * 2); c.fill(); } } c.restore(); }
  for (const [a, b] of d.pads) { // a big bouncy mushroom
    if (b < cam - 60 || a > cam + viewW + 60) continue;
    const mid = (a + b) / 2, gy = sy(d.ground(mid));
    c.beginPath(); c.moveTo(a - 14, gy + 6); c.quadraticCurveTo(mid, gy - 52, b + 14, gy + 6); c.closePath(); c.fillStyle = '#e63946'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#11131c'; c.stroke();
    for (const [dx, dy, rr] of [[-30, -6, 8], [8, -18, 9], [38, -4, 7]] as const) { c.beginPath(); c.arc(mid + dx, gy + dy, rr, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); }
  }
  for (const [a, b] of d.lava) {
    if (b < cam - 20 || a > cam + viewW + 20) continue;
    c.beginPath(); c.moveTo(a, sy(d.ground(a)) + 2);
    for (let x = a; x <= b; x += 10) c.lineTo(x, sy(d.ground(x)) + 2 - 6 * Math.sin(x / 20 + d.t * 4));
    c.lineTo(b, sy(d.ground(b)) + 30); c.lineTo(a, sy(d.ground(a)) + 30); c.closePath();
    c.fillStyle = '#ff7a1a'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#11131c'; c.stroke();
  }
  // crystals, bobbing
  for (const cr of d.crystals) {
    if (cr.got || cr.x < cam - 60 || cr.x > cam + viewW + 60) continue;
    c.save(); c.translate(cr.x, sy(cr.y) + Math.sin(d.t * 3 + cr.x) * (reduced ? 0 : 6));
    c.shadowColor = '#7ef0ff'; c.shadowBlur = reduced ? 0 : 20; drawCrystal(c, 26, d.t);
    c.restore();
  }
  // the flag spot: a ring on the ground, and his flag once he plants it
  const fy = sy(d.ground(FLAG_AT));
  c.beginPath(); c.ellipse(FLAG_AT, fy, 70, 14, 0, 0, Math.PI * 2); c.fillStyle = '#3ddc8455'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3ddc84'; c.stroke();
  if (planted > 0) {
    const up = Math.min(1, planted), pole = 150 * up;
    c.lineWidth = 9; c.strokeStyle = '#11131c'; c.beginPath(); c.moveTo(FLAG_AT, fy); c.lineTo(FLAG_AT, fy - pole); c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#e6e9ef'; c.stroke();
    c.save(); c.translate(FLAG_AT, fy - pole); c.beginPath(); c.moveTo(0, 0); c.lineTo(78, 18 + Math.sin(d.t * 5) * 4); c.lineTo(0, 46); c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#11131c'; c.stroke();
    star(c, 26, 22, 12, '#e63946', 3); c.restore();
  } else if (!reduced) { c.globalAlpha = .5 + .5 * Math.sin(d.t * 4); star(c, FLAG_AT, fy - 60, 18, '#3ddc84'); c.globalAlpha = 1; }
  // the rainbow trail
  if (d.gadgets.includes('trail') && Math.abs(d.vx) > 40) ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cc46b', '#3a8dde'].forEach((col, i) => { c.fillStyle = col; c.fillRect(d.x - d.facing * (60 + 70), sy(d.y) - 26 + i * 6, d.facing * 70, 6); });
  // the rover, tilted with the ground under it
  const slope = Math.atan2(d.ground(d.x + 20) - d.ground(d.x - 20), 40);
  c.save(); c.translate(d.x, sy(d.y)); c.rotate(d.grounded ? -slope : Math.max(-.5, Math.min(.5, -d.vy / 1600))); c.scale(d.facing * ROVER_SCALE, ROVER_SCALE);
  drawRover(c, d.gadgets, { spin: d.spin, t: d.t, go: Math.min(1, Math.abs(d.vx) / TOP_SPEED) });
  c.restore();
  // the Confetti Cannon's confetti
  for (const b of d.bits) { c.save(); c.globalAlpha = Math.min(1, b.life * 2); c.translate(b.x, sy(b.y)); c.rotate(b.life * 9 + b.x); c.fillStyle = b.col; c.fillRect(-6, -3, 12, 6); c.restore(); }
  c.restore();
}

/** What hangs in each new planet's sky: bubbles drifting up, storm clouds and lightning, big twinkly stars, a desert sun. */
function drawFarSky(c: CanvasRenderingContext2D, d: Drive, viewW: number, cam: number, reduced: boolean) {
  const f = d.planet.feature, t = reduced ? 0 : d.t;
  if (f === 'bubbles') {
    c.lineWidth = 4; c.strokeStyle = '#ffffffbb';
    for (let i = 0; i < 14; i++) {
      const x = (((i * 173 - cam * .08) % viewW) + viewW) % viewW, y = GROUND_Y - 20 - ((t * 26 * (1 + (i % 3)) + i * 97) % 480), r = 10 + (i % 4) * 8;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#ffffff99'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .2, 0, Math.PI * 2); c.fill();
    }
  }
  if (f === 'storm') {
    const n = Math.floor((t + 1.3) / 3.7), flash = !reduced && (t + 1.3) % 3.7 < .2;
    if (flash) { // a bolt of lightning far away, and the sky lights up a little
      c.fillStyle = '#ffffff1f'; c.fillRect(0, 0, viewW, VIEW_H);
      const x = viewW * (.15 + ((n * .37) % .7));
      c.beginPath(); c.moveTo(x, 70); c.lineTo(x - 24, 150); c.lineTo(x + 6, 150); c.lineTo(x - 20, 250); c.lineWidth = 8; c.strokeStyle = '#11131c'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#ffe14d'; c.stroke();
    }
    c.fillStyle = '#2a2e40';
    for (let i = 0; i < 6; i++) { const x = (((i * 260 - cam * .1) % (viewW + 300)) + viewW + 300) % (viewW + 300) - 150; c.beginPath(); c.ellipse(x, 60 + (i % 2) * 24, 120, 40, 0, 0, Math.PI * 2); c.ellipse(x + 70, 44 + (i % 2) * 24, 70, 34, 0, 0, Math.PI * 2); c.fill(); }
  }
  if (f === 'stars') for (let i = 0; i < 8; i++) {
    c.globalAlpha = .6 + .4 * Math.sin(t * 3 + i * 1.7);
    star(c, (((i * 241 - cam * .06) % viewW) + viewW) % viewW, 50 + (i * 67) % 220, 12 + (i % 3) * 8, '#fff6c2', 3);
    c.globalAlpha = 1;
  }
  if (f === 'cactus') { c.beginPath(); c.arc(viewW * .7 - cam * .02, 130, 64, 0, Math.PI * 2); c.fillStyle = '#ffe14d'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#11131c'; c.stroke(); }
}

/** The new planets' things behind the road, one at each spot along it (`r` 0 to 4 picks which). */
function drawScenery(c: CanvasRenderingContext2D, p: Planet, x: number, gy: number, r: number, t: number, reduced: boolean) {
  const O = '#11131c';
  const line = (w: number) => { c.lineWidth = w; c.strokeStyle = O; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  if (p.feature === 'candy') {
    if (r > 2) { // a lollipop
      c.beginPath(); c.moveTo(x, gy + 10); c.lineTo(x, gy - 110); line(9); c.strokeStyle = '#f4f6fa'; c.lineWidth = 5; c.stroke();
      c.beginPath(); c.arc(x, gy - 140, 34, 0, Math.PI * 2); c.fillStyle = '#ff5a8a'; c.fill(); line(5);
      c.beginPath(); for (let a = 0; a < 12; a += .3) c.lineTo(x + Math.cos(a) * a * 2.6, gy - 140 + Math.sin(a) * a * 2.6); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
    } else if (r > 0) { // a candy cane
      c.beginPath(); c.moveTo(x, gy + 10); c.lineTo(x, gy - 80); c.arc(x + 22, gy - 80, 22, Math.PI, 0); line(16);
      c.beginPath(); c.moveTo(x, gy + 10); c.lineTo(x, gy - 80); c.arc(x + 22, gy - 80, 22, Math.PI, 0); c.lineWidth = 10; c.strokeStyle = '#fff'; c.stroke();
      c.setLineDash([10, 10]); c.strokeStyle = '#e63946'; c.stroke(); c.setLineDash([]);
    }
  }
  if (p.feature === 'cactus' && r !== 2) { // a cactus with arms
    c.fillStyle = '#4c9a3a';
    const h = 80 + r * 14;
    c.beginPath(); c.roundRect(x - 13, gy - h, 26, h + 12, 13); c.fill(); line(5);
    c.beginPath(); c.roundRect(x - 40, gy - h * .7, 14, 40, 7); c.roundRect(x - 40, gy - h * .7 + 26, 30, 14, 7); c.fill(); line(4);
    c.beginPath(); c.roundRect(x + 26, gy - h * .85, 14, 46, 7); c.roundRect(x + 10, gy - h * .85 + 32, 30, 14, 7); c.fill(); line(4);
  }
  if (p.feature === 'ocean' && r > 1) { // a palm tree
    c.beginPath(); c.moveTo(x, gy + 10); c.quadraticCurveTo(x + 24, gy - 70, x + 6, gy - 140); line(14); c.strokeStyle = '#a0703a'; c.lineWidth = 9; c.stroke();
    for (let i = 0; i < 5; i++) { const a = -Math.PI * .95 + i * Math.PI * .22; c.beginPath(); c.moveTo(x + 6, gy - 140); c.quadraticCurveTo(x + 6 + Math.cos(a) * 40, gy - 160 + Math.sin(a) * 30, x + 6 + Math.cos(a) * 70, gy - 120 + Math.sin(a) * 36); line(13); c.strokeStyle = '#3e8f3a'; c.lineWidth = 8; c.stroke(); }
  }
  if (p.feature === 'mushrooms' && r > 0) { // a tall mushroom
    const h = 70 + r * 20, col = ['#ff9ad5', '#ffd23f', '#7fd3ff', '#ff8a1f'][r - 1]!;
    c.beginPath(); c.roundRect(x - 12, gy - h, 24, h + 12, 8); c.fillStyle = '#f4e6d0'; c.fill(); line(5);
    c.beginPath(); c.ellipse(x, gy - h, 50 + r * 6, 32, 0, Math.PI, 0); c.closePath(); c.fillStyle = col; c.fill(); line(5);
    for (const dx of [-22, 4, 26]) { c.beginPath(); c.arc(x + dx, gy - h - 14 + (dx % 3) * 3, 6, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); }
  }
  if (p.feature === 'robot' && r > 1) { // a big turning gear on a post
    c.beginPath(); c.moveTo(x, gy + 10); c.lineTo(x, gy - 90); line(12); c.strokeStyle = '#9aa3ad'; c.lineWidth = 7; c.stroke();
    c.save(); c.translate(x, gy - 110); c.rotate((reduced ? 0 : t) * (r % 2 ? .8 : -.8));
    c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? 30 : 40; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
    c.fillStyle = r > 3 ? '#ffb02e' : '#c9ccd6'; c.fill(); line(5);
    c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.fillStyle = '#5b6170'; c.fill(); line(4);
    c.restore();
  }
  if (p.feature === 'storm' && r > 2) { // a dark rock spire
    c.beginPath(); c.moveTo(x - 50, gy + 10); c.lineTo(x - 12, gy - 100 - r * 10); c.lineTo(x + 20, gy - 70); c.lineTo(x + 50, gy + 10); c.closePath(); c.fillStyle = '#2a2e40'; c.fill(); line(5);
  }
  if (p.feature === 'bubbles' && r > 1) { // a bubble resting on the ground
    c.beginPath(); c.arc(x, gy - 40 - r * 6, 40 + r * 6, 0, Math.PI * 2); c.fillStyle = '#ffffff30'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#ffffffcc'; c.stroke();
    c.beginPath(); c.arc(x - 16, gy - 62 - r * 6, 9, 0, Math.PI * 2); c.fillStyle = '#ffffffcc'; c.fill();
  }
  if (p.feature === 'stars' && r > 1) { // a fallen star, glowing
    c.save(); c.shadowColor = '#fff6c2'; c.shadowBlur = reduced ? 0 : 18; star(c, x, gy - 40, 30 + r * 4, '#ffd23f'); c.restore();
  }
}

/** How far along to the flag, 0 to 1, for the bar at the top. */
export const progress = (d: Pick<Drive, 'x'>) => Math.max(0, Math.min(1, (d.x - START_X) / (FLAG_AT - 60 - START_X)));
