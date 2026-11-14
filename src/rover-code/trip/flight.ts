// The flight, as a little simulation and a drawing of it. He presses the big button, the countdown runs (3, 2, 1, Blast off!), and the
// rocket climbs out of the blue sky into space. He steers by moving his finger anywhere on the screen (or the arrow keys): three Bolts
// float down to catch, and asteroids to dodge. A bump only wobbles the rocket and knocks it aside; nothing is lost and the rocket
// always arrives, because the flight is the treat, not a test. Then the planet rises up and the rocket goes in to land.
//
// The world is 1000 units tall and as wide as the screen's shape makes it, so it plays the same in portrait and landscape.
import { int, type Rng } from '../../game/rng';
import type { Planet } from '../base/planets';
import type { Rocket } from '../base/parts';
import { drawBolt, drawGlobe, drawRocket } from '../art/draw';

export const COUNT_S = 3.4, CLIMB_S = 22, LAND_S = 2.4;
export const ROCKET_Y = 720, ROCKET_R = 58, BOLT_R = 36;
/** When the Bolts come down, in seconds of climbing: always three, spread out. */
export const BOLT_TIMES = [4, 9.5, 15] as const;

export interface Thing { kind: 'bolt' | 'rock'; x: number; y: number; vy: number; r: number; spin: number; gone: boolean }
export type FlightEvent = 'blast' | 'catch' | 'bonk' | 'first-bolt' | 'first-rock' | 'arrive' | 'done';
export interface Flight {
  t: number;
  width: number;
  x: number;
  vx: number;
  wobble: number;
  things: Thing[];
  caught: number;
  bumps: number;
  nextRock: number;
  boltsSent: number;
  rocksSent: number;
  started: boolean;
  done: boolean;
  events: FlightEvent[];
  rng: Rng;
}

export const createFlight = (aspect: number, rng: Rng): Flight => {
  const width = Math.max(560, 1000 * aspect);
  return { t: 0, width, x: width / 2, vx: 0, wobble: 0, things: [], caught: 0, bumps: 0, nextRock: 6, boltsSent: 0, rocksSent: 0, started: false, done: false, events: [], rng };
};
/** Seconds of climbing so far (negative during the countdown). */
export const climb = (f: Pick<Flight, 't'>) => f.t - COUNT_S;
export const resize = (f: Flight, aspect: number) => { const w = Math.max(560, 1000 * aspect), k = w / f.width; f.width = w; f.x *= k; for (const s of f.things) s.x *= k; };

/** `target`: where his finger is across the screen, or null; `dx`: arrow keys. */
export function stepFlight(f: Flight, dt: number, target: number | null, dx: number) {
  f.events = [];
  if (!f.started || f.done) return;
  const before = climb(f);
  f.t += dt;
  const ct = climb(f);
  if (before < 0 && ct >= 0) f.events.push('blast');
  if (ct < 0) return;
  // steering: the rocket glides toward his finger, quick but never a jump
  const margin = 70;
  if (ct < CLIMB_S) {
    const want = target !== null ? target : f.x + dx * 400;
    const pull = Math.max(-1, Math.min(1, (want - f.x) / 160));
    f.vx += (pull * 1500 - f.vx) * Math.min(1, dt * 8);
  } else f.vx += ((f.width / 2 - f.x) * 3 - f.vx) * Math.min(1, dt * 4); // lining up to land
  f.x = Math.max(margin, Math.min(f.width - margin, f.x + f.vx * dt));
  f.wobble = Math.max(0, f.wobble - dt * 1.6);
  // what comes down
  if (f.boltsSent < BOLT_TIMES.length && ct >= BOLT_TIMES[f.boltsSent]!) {
    f.things.push({ kind: 'bolt', x: int(f.rng, Math.round(f.width * .2), Math.round(f.width * .8)), y: -60, vy: 250, r: BOLT_R, spin: 0, gone: false });
    if (f.boltsSent === 0) f.events.push('first-bolt');
    f.boltsSent++;
  }
  if (ct >= f.nextRock && ct < CLIMB_S - 3) {
    const bolt = f.things.find(s => s.kind === 'bolt' && !s.gone && s.y < 300);
    let x = int(f.rng, 60, Math.round(f.width - 60));
    if (bolt && Math.abs(x - bolt.x) < 180) x = bolt.x > f.width / 2 ? bolt.x - 240 : bolt.x + 240; // never sit on a Bolt
    f.things.push({ kind: 'rock', x, y: -80, vy: 280 + f.rng() * 120, r: 40 + f.rng() * 30, spin: f.rng() * 6, gone: false });
    if (f.rocksSent === 0) f.events.push('first-rock');
    f.rocksSent++;
    f.nextRock = ct + 1.3 + f.rng() * .9;
  }
  for (const s of f.things) {
    if (s.gone) continue;
    s.y += s.vy * dt; s.spin += dt * (s.kind === 'rock' ? 1.2 : 2);
    if (s.y > 1150) { s.gone = true; continue; }
    const d = Math.hypot(s.x - f.x, s.y - (ROCKET_Y - 30));
    if (d < s.r + ROCKET_R) {
      s.gone = true;
      if (s.kind === 'bolt') { f.caught++; f.events.push('catch'); }
      else { f.bumps++; f.wobble = 1; f.vx = (f.x < s.x ? -1 : 1) * 900; f.events.push('bonk'); }
    }
  }
  f.things = f.things.filter(s => !s.gone || s.y < 1150);
  if (before < CLIMB_S && ct >= CLIMB_S) f.events.push('arrive');
  if (ct >= CLIMB_S + LAND_S) { f.done = true; f.events.push('done'); }
}

// ---------- drawing ----------

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i]!, k))).join(',')})`;
}

/** The far stars, fixed per flight. */
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: ((i * 7919) % 1000) / 1000, y: ((i * 104729) % 1000) / 1000, s: 1 + (i % 3) }));

export function drawFlight(c: CanvasRenderingContext2D, f: Flight, w: number, h: number, rocket: Rocket, planet: Planet, reduced: boolean, pointer: number | null) {
  const k = h / 1000, ct = climb(f);
  const shakeAmt = reduced ? 0 : ct < 0 && ct > -1.2 ? 6 : ct >= 0 && ct < .8 ? 10 * (1 - ct / .8) : f.wobble * 8;
  c.save();
  c.translate((Math.random() - .5) * shakeAmt * k, (Math.random() - .5) * shakeAmt * k);
  // the sky, from blue to black as he climbs
  const dark = Math.max(0, Math.min(1, ct / 5));
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mix('#3d93dc', '#03040c', dark)); g.addColorStop(1, mix('#cfe9fb', '#141a3a', dark));
  c.fillStyle = g; c.fillRect(-20, -20, w + 40, h + 40);
  c.scale(k, k);
  const W = f.width;
  if (dark > .15) {
    c.fillStyle = '#fff';
    for (const s of STARS) { c.globalAlpha = (dark - .15) * (.5 + .5 * Math.sin(f.t * 2 + s.x * 20)); const y = ((s.y * 1000 + Math.max(0, ct) * 60 * s.s) % 1000); c.fillRect(s.x * W, y, s.s * 2.2, s.s * 2.2); }
    c.globalAlpha = 1;
    // speed streaks
    if (ct > 0 && ct < CLIMB_S && !reduced) { c.strokeStyle = '#ffffff33'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const x = ((i * 137 + 50) % 1000) / 1000 * W, y = ((f.t * 900 + i * 260) % 1300) - 150; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 90); c.stroke(); } }
  }
  // the ground and the launch tower, falling away as he climbs
  const drop = ct > 0 ? ct * ct * 260 : 0;
  if (drop < 600) {
    c.save(); c.translate(0, drop);
    for (let i = 0; i < 3; i++) { // clouds go past on the way up
      const cy = 300 - i * 260, cx = ((i * 0.37 + .2) % 1) * W;
      c.fillStyle = '#ffffffd9'; c.beginPath(); c.ellipse(cx, cy, 120, 40, 0, 0, Math.PI * 2); c.ellipse(cx + 70, cy - 20, 80, 40, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#4cc46b'; c.beginPath(); c.moveTo(0, 870); c.quadraticCurveTo(W / 2, 820, W, 870); c.lineTo(W, 1100); c.lineTo(0, 1100); c.closePath(); c.fill();
    c.lineWidth = 6; c.strokeStyle = '#11131c'; c.stroke();
    c.fillStyle = '#5b6170'; c.fillRect(W / 2 - 110, 832, 220, 30); c.strokeRect(W / 2 - 110, 832, 220, 30);
    // the tower
    c.strokeStyle = '#e63946'; c.lineWidth = 10; c.beginPath(); c.moveTo(W / 2 - 150, 835); c.lineTo(W / 2 - 150, 520); c.stroke();
    c.lineWidth = 6; for (let y = 540; y < 830; y += 50) { c.beginPath(); c.moveTo(W / 2 - 150, y); c.lineTo(W / 2 - 100, y + 25); c.stroke(); }
    c.restore();
  }
  // the planet, rising to meet him
  if (ct > CLIMB_S - 3.5) {
    const k2 = Math.min(1, (ct - (CLIMB_S - 3.5)) / (3.5 + LAND_S));
    c.save(); c.translate(W / 2, lerp(-260, 420, k2)); drawGlobe(c, planet, lerp(90, 520, k2 * k2), 8); c.restore();
  }
  // what comes down
  for (const s of f.things) {
    if (s.gone) continue;
    c.save(); c.translate(s.x, s.y);
    if (s.kind === 'bolt') { c.rotate(s.spin); c.shadowColor = '#ffd23f'; c.shadowBlur = reduced ? 0 : 24; drawBolt(c, s.r * .8); }
    else {
      c.rotate(s.spin);
      c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = s.r * (.82 + ((i * 37) % 7) / 30); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.fillStyle = '#8a7a6e'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#11131c'; c.stroke();
      c.beginPath(); c.arc(-s.r * .25, -s.r * .2, s.r * .22, 0, Math.PI * 2); c.fillStyle = '#6d5f55'; c.fill();
    }
    c.restore();
  }
  // where his finger is
  if (pointer !== null && ct >= 0 && ct < CLIMB_S) { c.beginPath(); c.arc(pointer, ROCKET_Y + 160, 26, 0, Math.PI * 2); c.lineWidth = 6; c.strokeStyle = '#ffffff88'; c.stroke(); }
  // the rocket: on the pad, then climbing, then going in to land and shrinking into the planet
  let ry = ct < 0 ? 760 : Math.max(ROCKET_Y, 760 - ct * 160), scale = .62;
  if (ct > CLIMB_S) { const k3 = Math.min(1, (ct - CLIMB_S) / LAND_S); ry = lerp(ROCKET_Y, 380, k3); scale = lerp(.62, .12, k3); }
  const flame = ct < -1.2 ? (f.started ? .25 : 0) : ct < 0 ? .7 : 1;
  c.save(); c.translate(f.x, ry); c.rotate(Math.sin(f.t * 30) * f.wobble * .18 + f.vx / 9000); c.scale(scale, scale);
  drawRocket(c, rocket, { flame, t: f.t });
  c.restore();
  // smoke at blast off
  if (ct > -1.4 && ct < 1.5 && !reduced) {
    c.fillStyle = '#ffffffcc';
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI, spread = 90 + Math.max(0, ct + 1.4) * 140; c.beginPath(); c.arc(W / 2 + Math.cos(a) * spread * (i % 2 ? 1 : -1), 860 + drop + Math.sin(a) * 20, 40 + i * 4, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}
