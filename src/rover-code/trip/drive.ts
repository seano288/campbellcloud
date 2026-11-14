// Driving the rover on a planet, seen from the side, as a little simulation and a drawing of it. He holds ◀ or ▶ to drive and taps
// ⤴ to jump; the planet's own gravity makes the Moon's jumps slow and floaty. The ground rolls in hills and craters made from the
// planet's seed, so each planet always looks like itself. Five crystals wait along the way, some low and some up high for a jump, and
// the flag spot is at the far end. Nothing can go wrong: lava only bounces him up, and he can drive back for a crystal he missed.
// His gadgets change the drive: Big Wheels jump higher, Solar Wings glide, the Jump Booster jumps again in the air, the Crystal Magnet
// pulls crystals in.
//
// The world is 600 units tall; height is measured up from the ground's resting line.
import { seeded } from '../../game/rng';
import type { GadgetId, Planet } from '../base/planets';
import { CRYSTALS } from '../base/base';
import { drawCrystal, drawGlobe, drawRocket, drawRover, star } from '../art/draw';
import type { Rocket } from '../base/parts';

export const TRACK = 4400, FLAG_AT = TRACK - 160, START_X = 230, VIEW_H = 600, GROUND_Y = 430;
export const TOP_SPEED = 340, JUMP_HEIGHT = 170, PICK_R = 72;
const ROVER_SCALE = .55, CENTER_UP = 46;

export interface Crystal { x: number; y: number; got: boolean }
export type DriveEvent = 'jump' | 'land' | 'crystal' | 'hot' | 'flag';
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
  return { t: 0, x: START_X, y: ground(START_X), vx: 0, vy: 0, grounded: true, airJumps: 0, spin: 0, facing: 1, crystals, got: 0, atFlag: false, events: [], ground, lava, planet: p, gadgets };
}

const jumpSpeed = (d: Drive) => Math.sqrt(2 * d.planet.gravity * JUMP_HEIGHT * (d.gadgets.includes('wheels') ? 1.4 : 1));

/** `dir`: -1, 0 or 1 from the arrows; `jump`: he pressed jump this step. */
export function stepDrive(d: Drive, dt: number, dir: number, jump: boolean) {
  d.events = [];
  d.t += dt;
  if (d.atFlag) { d.vx = 0; return; }
  const icy = d.planet.feature === 'ice', has = (g: GadgetId) => d.gadgets.includes(g);
  if (dir) { d.vx += dir * (icy ? 420 : 760) * dt; d.facing = dir > 0 ? 1 : -1; }
  else { const slow = (icy ? 220 : 900) * dt; d.vx = Math.abs(d.vx) <= slow ? 0 : d.vx - Math.sign(d.vx) * slow; }
  d.vx = Math.max(-TOP_SPEED, Math.min(TOP_SPEED, d.vx));
  if (jump && (d.grounded || d.airJumps > 0)) {
    if (!d.grounded) d.airJumps--;
    d.vy = jumpSpeed(d) * (d.grounded ? 1 : .8);
    d.grounded = false;
    d.events.push('jump');
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
  // crystals: a touch picks one up; the Magnet pulls them in from further away
  const reach = has('magnet') ? PICK_R * 2.6 : PICK_R, cy = d.y + CENTER_UP;
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
  // far hills, slower than the ground
  c.fillStyle = p.ground[1]; c.globalAlpha = .55;
  c.beginPath(); c.moveTo(0, VIEW_H);
  for (let sx = 0; sx <= viewW + 20; sx += 20) { const wx = sx + cam * .45; c.lineTo(sx, GROUND_Y - 70 - 50 * Math.sin(wx / 330) - 30 * Math.sin(wx / 120)); }
  c.lineTo(viewW + 20, VIEW_H); c.closePath(); c.fill(); c.globalAlpha = 1;
  c.translate(-cam, 0);
  // the planet's things behind the road
  for (let x = Math.floor(cam / 260) * 260; x < cam + viewW + 260; x += 260) {
    const gy = sy(d.ground(x)), r = ((x / 260) * 7919) % 5;
    if (p.feature === 'ice') { c.fillStyle = '#d9f2ff'; c.beginPath(); c.moveTo(x - 30, gy + 10); c.lineTo(x, gy - 70 - r * 12); c.lineTo(x + 30, gy + 10); c.closePath(); c.fill(); c.lineWidth = 4; c.strokeStyle = '#11131c'; c.stroke(); }
    if (p.feature === 'crystals' && r > 1) { c.save(); c.translate(x, gy - 30); drawCrystal(c, 30 + r * 6); c.restore(); }
    if (p.feature === 'jungle') { c.strokeStyle = '#1d4a1b'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, gy + 10); c.quadraticCurveTo(x + 20, gy - 70, x - 10, gy - 120 - r * 10); c.stroke(); c.fillStyle = '#4cc46b'; c.beginPath(); c.ellipse(x - 10, gy - 124 - r * 10, 34, 16, -.4, 0, Math.PI * 2); c.fill(); c.lineWidth = 4; c.strokeStyle = '#11131c'; c.stroke(); }
    if (p.feature === 'lava' && r > 2) { c.fillStyle = '#2a1a1a'; c.beginPath(); c.moveTo(x - 90, gy + 10); c.lineTo(x - 20, gy - 110); c.lineTo(x + 20, gy - 110); c.lineTo(x + 90, gy + 10); c.closePath(); c.fill(); c.fillStyle = '#ff5a10'; c.fillRect(x - 20, gy - 114, 40, 8); }
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
  drawRover(c, d.gadgets, { spin: d.spin, t: d.t });
  c.restore();
  c.restore();
}

/** How far along to the flag, 0 to 1, for the bar at the top. */
export const progress = (d: Pick<Drive, 'x'>) => Math.max(0, Math.min(1, (d.x - START_X) / (FLAG_AT - 60 - START_X)));
