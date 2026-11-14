// The Voyage at sea, as a little simulation (drawn by draw.ts). Seen from above, the ship sails north up the screen. He steers by
// touching where he wants to go: the ship's bow turns toward his finger (it never jumps there), and the water pushes it about a little.
// Barrels float by to pick up (a Bolt each, three at most). Rocks only bump him aside. Now and then a sea monster's tentacles rise out of
// the water; the cannon button fires at them and they splash away. Nothing is lost and the ship always arrives: after about 25 seconds
// the island comes into view and the ship sails in.
//
// The world is 1000 units tall and as wide as the screen's shape makes it, so it plays the same in portrait and landscape.
import { int, type Rng } from '../../game/rng';
import { BARRELS } from '../fleet/fleet';

export const SAIL_S = 25, ARRIVE_S = 2.6;
export const SHIP_Y = 730, SHIP_R = 50, BARREL_R = 34, ROCK_MIN = 38;
/** When the barrels float by, in seconds of sailing: always three, spread out. */
export const BARREL_TIMES = [3.5, 9.5, 16] as const;
/** When a tentacle rises. */
export const TENTACLE_TIMES = [6.5, 13, 19.5] as const;
const MAX_TURN = 1.05, TURN_RATE = 2.8, SPEED = 400, SCROLL = 250, BALL_SPEED = 1100;

export interface Floater { kind: 'barrel' | 'rock'; x: number; y: number; r: number; spin: number; gone: boolean }
/** A tentacle: it rises, waves, and sinks again on its own if he doesn't splash it first. */
export interface Tentacle { x: number; y: number; age: number; splashed: number | null; gone: boolean }
export interface Ball { x: number; y: number; vx: number; vy: number; age: number; target: Tentacle | null }
export interface Splash { x: number; y: number; age: number; big: boolean }
export type SailEvent = 'start' | 'barrel' | 'first-barrel' | 'bonk' | 'first-rock' | 'tentacle' | 'fire' | 'splash' | 'land-ho' | 'done';

export interface Sail {
  t: number;
  width: number;
  x: number;
  heading: number;
  kick: number;
  wobble: number;
  floaters: Floater[];
  tentacles: Tentacle[];
  balls: Ball[];
  splashes: Splash[];
  barrels: number;
  splashed: number;
  bumps: number;
  sentBarrels: number;
  sentTentacles: number;
  sentRocks: number;
  nextRock: number;
  reload: number;
  /** Shots per tap: more with better cannons. */
  guns: number;
  scroll: number;
  started: boolean;
  done: boolean;
  events: SailEvent[];
  rng: Rng;
}

export const widthFor = (aspect: number) => Math.max(560, 1000 * aspect);
export function createSail(aspect: number, guns: number, rng: Rng): Sail {
  const width = widthFor(aspect);
  return {
    t: 0, width, x: width / 2, heading: 0, kick: 0, wobble: 0, floaters: [], tentacles: [], balls: [], splashes: [], barrels: 0, splashed: 0, bumps: 0,
    sentBarrels: 0, sentTentacles: 0, sentRocks: 0, nextRock: 2.5, reload: 0, guns: Math.max(1, Math.min(3, guns)), scroll: 0, started: false, done: false, events: [], rng,
  };
}
export const resizeSail = (s: Sail, aspect: number) => {
  const w = widthFor(aspect), k = w / s.width;
  s.width = w; s.x *= k;
  for (const f of s.floaters) f.x *= k;
  for (const t of s.tentacles) t.x *= k;
};
/** The water's own push, sideways, changing slowly. */
export const current = (t: number) => Math.sin(t * .45) * 55 + Math.sin(t * 1.3 + 1) * 20;
const live = (t: Tentacle) => !t.gone && t.splashed === null;

/** He tapped the cannon: a shot (or two, or three) flies at the nearest tentacle that's up, or straight ahead if there's none. */
export function fire(s: Sail) {
  if (!s.started || s.done || s.reload > 0) return false;
  s.reload = .45;
  const up = s.tentacles.filter(t => live(t) && t.y < SHIP_Y && t.age > .3).sort((a, b) => Math.hypot(a.x - s.x, a.y - SHIP_Y) - Math.hypot(b.x - s.x, b.y - SHIP_Y));
  for (let i = 0; i < s.guns; i++) {
    const target = up[i % Math.max(1, up.length)] ?? null, from = { x: s.x + (i - (s.guns - 1) / 2) * 26, y: SHIP_Y - 60 };
    const ang = target ? Math.atan2(target.x - from.x, from.y - target.y) : s.heading + (i - (s.guns - 1) / 2) * .12;
    s.balls.push({ ...from, vx: Math.sin(ang) * BALL_SPEED, vy: -Math.cos(ang) * BALL_SPEED, age: 0, target });
  }
  s.events.push('fire');
  return true;
}

/** `target`: where his finger is, in world units, or null; `steer`: -1, 0 or 1 from the arrow keys. */
export function stepSail(s: Sail, dt: number, target: { x: number; y: number } | null, steer = 0) {
  s.events = [];
  if (!s.started || s.done) return;
  const before = s.t;
  if (before === 0) s.events.push('start');
  s.t += dt;
  const t = s.t, sailing = t < SAIL_S;
  // steering: the bow turns toward his finger, never past a broad reach, and drifts back to north when he lets go
  let want = 0;
  if (!sailing) want = Math.max(-.6, Math.min(.6, (s.width / 2 - s.x) / 300)); // sailing in to the island
  else if (target) want = Math.atan2(target.x - s.x, Math.max(80, SHIP_Y - target.y));
  else if (steer) want = steer * MAX_TURN;
  want = Math.max(-MAX_TURN, Math.min(MAX_TURN, want));
  const rate = target || steer || !sailing ? TURN_RATE : TURN_RATE * .4;
  s.heading += Math.max(-rate * dt, Math.min(rate * dt, want - s.heading));
  s.kick *= Math.exp(-dt * 3);
  s.wobble = Math.max(0, s.wobble - dt * 1.5);
  const vx = Math.sin(s.heading) * SPEED + (sailing ? current(t) : 0) + s.kick;
  const margin = 70;
  s.x = Math.max(margin, Math.min(s.width - margin, s.x + vx * dt));
  const scroll = SCROLL * (.7 + .3 * Math.cos(s.heading)) * (sailing ? 1 : Math.max(0, 1 - (t - SAIL_S) / ARRIVE_S));
  s.scroll += scroll * dt;
  s.reload = Math.max(0, s.reload - dt);
  // what floats by
  if (s.sentBarrels < BARREL_TIMES.length && t >= BARREL_TIMES[s.sentBarrels]!) {
    s.floaters.push({ kind: 'barrel', x: int(s.rng, Math.round(s.width * .18), Math.round(s.width * .82)), y: -60, r: BARREL_R, spin: 0, gone: false });
    if (s.sentBarrels === 0) s.events.push('first-barrel');
    s.sentBarrels++;
  }
  if (t >= s.nextRock && t < SAIL_S - 4) {
    const barrel = s.floaters.find(f => f.kind === 'barrel' && !f.gone && f.y < 320);
    let x = int(s.rng, 60, Math.round(s.width - 60));
    if (barrel && Math.abs(x - barrel.x) < 200) x = barrel.x > s.width / 2 ? barrel.x - 260 : barrel.x + 260; // never on a barrel
    s.floaters.push({ kind: 'rock', x, y: -80, r: ROCK_MIN + s.rng() * 26, spin: s.rng() * 6, gone: false });
    if (s.sentRocks++ === 0) s.events.push('first-rock');
    s.nextRock = t + 2 + s.rng() * 1.2;
  }
  if (s.sentTentacles < TENTACLE_TIMES.length && t >= TENTACLE_TIMES[s.sentTentacles]!) {
    const x = Math.max(80, Math.min(s.width - 80, s.x + (s.rng() < .5 ? -1 : 1) * (120 + s.rng() * 120)));
    s.tentacles.push({ x, y: 230 + s.rng() * 80, age: 0, splashed: null, gone: false });
    s.sentTentacles++;
    s.events.push('tentacle');
  }
  for (const f of s.floaters) {
    if (f.gone) continue;
    f.y += scroll * dt; f.x += current(t) * .3 * dt; f.spin += dt;
    if (f.y > 1150) { f.gone = true; continue; }
    if (Math.hypot(f.x - s.x, f.y - SHIP_Y) < f.r + SHIP_R) {
      if (f.kind === 'barrel') { f.gone = true; if (s.barrels < BARRELS) s.barrels++; s.events.push('barrel'); }
      else { f.gone = true; s.bumps++; s.wobble = 1; s.kick = (s.x < f.x ? -1 : 1) * 700; s.events.push('bonk'); }
    }
  }
  for (const tt of s.tentacles) {
    if (tt.gone) continue;
    tt.age += dt; tt.y += scroll * dt;
    if (tt.splashed !== null && t - tt.splashed > .6) tt.gone = true;
    if (live(tt) && (tt.age > 5 || tt.y > 1100)) tt.gone = true; // sinks back on its own
    if (live(tt) && tt.age > .3 && Math.hypot(tt.x - s.x, tt.y - SHIP_Y) < 46 + SHIP_R) { s.wobble = 1; s.kick = (s.x < tt.x ? -1 : 1) * 500; tt.splashed = t; s.splashes.push({ x: tt.x, y: tt.y, age: 0, big: false }); s.events.push('bonk'); }
  }
  for (const b of s.balls) {
    b.age += dt;
    if (b.target && live(b.target)) { // a shot always finds the tentacle it was fired at
      const dx = b.target.x - b.x, dy = b.target.y - b.y, d = Math.hypot(dx, dy) || 1;
      b.vx = dx / d * BALL_SPEED; b.vy = dy / d * BALL_SPEED;
    }
    b.x += b.vx * dt; b.y += b.vy * dt + scroll * dt * .2;
    const hit = s.tentacles.find(tt => live(tt) && Math.hypot(tt.x - b.x, tt.y - b.y) < 56);
    if (hit) { hit.splashed = t; b.age = 99; s.splashed++; s.splashes.push({ x: hit.x, y: hit.y, age: 0, big: true }); s.events.push('splash'); }
  }
  s.balls = s.balls.filter(b => b.age < 1.4);
  for (const sp of s.splashes) { sp.age += dt; sp.y += scroll * dt; }
  s.splashes = s.splashes.filter(sp => sp.age < 1);
  s.floaters = s.floaters.filter(f => !f.gone);
  s.tentacles = s.tentacles.filter(tt => !tt.gone);
  if (before < SAIL_S - 4 && t >= SAIL_S - 4) s.events.push('land-ho');
  if (t >= SAIL_S + ARRIVE_S) { s.done = true; s.events.push('done'); }
}
