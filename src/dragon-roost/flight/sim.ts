// The Flight, as numbers: no drawing, so the tests can fly it. The dragon flies right by itself, always. A held finger sets the height it
// climbs or sinks to; holding Breathe sends its breath ahead, which lights beacons and pops clouds; a trick button does its trick. It
// cannot be failed: land, castles and peaks bounce it up and over, and every Flight ends at its far end, about a minute in.
//
// What the dragon has changes how it flies (TUNING and FlyWith): its breath (how far and how wide), its saddle and gear (how fast it
// climbs, how far it pulls Flames in, how fast it flies), and the tricks on its buttons. All the numbers are in TUNING.
import type { BreathId } from '../art/dragon';
import { CEILING, groundAt, type Course } from './course';

export const TUNING = {
  /** Units a second it flies by itself, and how far it is from the screen's left edge. */
  speed: 20, dragonAt: .3,
  /** How quickly it climbs or sinks toward the finger (per second), and how high it keeps above the land. */
  climb: 3.2, clearance: 5,
  /** A bump off the land throws it up this fast; it settles back in about a second. */
  bounce: 34,
  /** Breath: how far it reaches and how wide it spreads, by kind of breath. */
  breath: { fire: { reach: 20, spread: .32 }, frost: { reach: 23, spread: .26 }, sparks: { reach: 27, spread: .18 }, bubbles: { reach: 17, spread: .5 }, rainbow: { reach: 24, spread: .36 } } as Record<BreathId, { reach: number; spread: number }>,
  /** Flames come to it from this far (more with a magnet). */
  grab: 6,
  /** A racing bird flies this fast, starting this far ahead when it comes on screen. */
  bird: 23, birdLead: 14, birdLasts: 14,
  /** Each trick: what it does, for how long, and how long until it can go again. */
  trickWait: 2.4,
  /** The longest a Flight can take, whatever happens (it is about a minute). */
  maxTime: 160,
} as const;

/** What a trick does in the Flight. */
export type Effect = 'zoom' | 'ring' | 'blaze' | 'magnet' | 'float' | 'hop';
export const EFFECTS: Record<Effect, { readonly lasts: number }> = { zoom: { lasts: 2 }, ring: { lasts: 1.2 }, blaze: { lasts: 1 }, magnet: { lasts: 3 }, float: { lasts: 2.5 }, hop: { lasts: .6 } };

/** What the dragon brings to a Flight. */
export interface FlyWith {
  readonly breath: BreathId;
  /** Climb and speed from its saddle and gear: 1 is the starter's. */
  readonly climb: number;
  readonly speed: number;
  /** Extra reach for Flames (magnet gear). */
  readonly grab: number;
  /** Extra breath reach (gear). */
  readonly reach: number;
  /** The tricks on its buttons, in order: what each does and how strongly. */
  readonly tricks: readonly TrickUse[];
}
export interface TrickUse { readonly effect: Effect; readonly power: number }
export const STARTER_FLY: FlyWith = { breath: 'fire', climb: 1, speed: 1, grab: 0, reach: 0, tricks: [{ effect: 'hop', power: 1 }] };

export interface Input { readonly target: number | null; readonly breath: boolean; readonly trick: number | null }
export const NO_INPUT: Input = { target: null, breath: false, trick: null };

export interface Sim {
  readonly c: Course;
  readonly w: FlyWith;
  t: number;
  x: number;
  y: number;
  vy: number;
  target: number;
  breathing: boolean;
  lit: boolean[];
  popped: boolean[];
  got: boolean[];
  /** Each racing bird: where it is, and whether it has come on screen, gone, or been beaten. */
  birds: { x: number; y: number; state: 'waiting' | 'racing' | 'beaten' | 'gone'; since: number }[];
  /** Each trick button: what it is doing now (seconds left) and when it can go again. */
  tricks: { effect: Effect; power: number; left: number; wait: number }[];
  bounces: number;
  /** Things that happened this step, for sounds and words. */
  events: SimEvent[];
  done: boolean;
}
export type SimEvent = { kind: 'lit' | 'pop' | 'flame' | 'bounce' | 'bird' | 'beat' | 'trick'; i: number };

export function startSim(c: Course, w: FlyWith = STARTER_FLY): Sim {
  const y = groundAt(c, 0) + 30;
  return {
    c, w, t: 0, x: 0, y, vy: 0, target: y, breathing: false, lit: c.beacons.map(() => false), popped: c.clouds.map(() => false), got: c.flames.map(() => false),
    birds: c.birds.map(b => ({ x: b.x, y: b.y, state: 'waiting' as const, since: 0 })), tricks: w.tricks.map(t => ({ effect: t.effect, power: t.power, left: 0, wait: 0 })),
    bounces: 0, events: [], done: false,
  };
}

/** How strongly a trick of this kind is going now (0: not at all). */
const active = (s: Sim, e: Effect) => s.tricks.reduce((m, t) => (t.effect === e && t.left > 0 ? Math.max(m, t.power) : m), 0);
export const speedOf = (s: Sim) => TUNING.speed * s.w.speed * (1 + active(s, 'zoom')) * (active(s, 'float') ? .65 : 1);
export const reachOf = (s: Sim) => (TUNING.breath[s.w.breath].reach + s.w.reach) * (1 + active(s, 'float') * .3);
/** Is this point in the breath? It spreads wider the further it goes. */
export function inBreath(s: Sim, px: number, py: number, pad = 0): boolean {
  if (!s.breathing && !active(s, 'blaze')) return false;
  const reach = active(s, 'blaze') ? 40 * active(s, 'blaze') : reachOf(s), dx = px - (s.x + 4), spread = TUNING.breath[s.w.breath].spread;
  return dx >= -2 && dx <= reach + pad && Math.abs(py - (s.y + 1)) <= 5.5 + pad + dx * spread;
}

/** One step of `dt` seconds. */
export function step(s: Sim, dt: number, input: Input): Sim {
  if (s.done) return s;
  s.events = [];
  s.t += dt;
  for (const tr of s.tricks) { tr.left = Math.max(0, tr.left - dt); tr.wait = Math.max(0, tr.wait - dt); }
  if (input.trick !== null) {
    const tr = s.tricks[input.trick];
    if (tr && tr.wait <= 0) {
      tr.left = EFFECTS[tr.effect].lasts * (tr.effect === 'zoom' ? 1 : tr.power); tr.wait = TUNING.trickWait;
      s.events.push({ kind: 'trick', i: input.trick });
      if (tr.effect === 'hop') s.vy = TUNING.bounce * .7 * tr.power;
    }
  }
  s.breathing = input.breath;
  if (input.target !== null) s.target = Math.max(0, Math.min(CEILING, input.target));
  // move: forward by itself, toward the finger's height, with a bump's leftover push
  const speed = speedOf(s);
  s.x += speed * dt;
  const wind = s.c.weather === 'wind' ? Math.sin(s.t * 1.3) * 2.2 : 0;
  const k = 1 - Math.exp(-TUNING.climb * s.w.climb * dt);
  s.y += (s.target - s.y) * k + (s.vy + wind) * dt;
  s.vy *= Math.exp(-3 * dt);
  const floor = groundAt(s.c, s.x) + TUNING.clearance;
  if (s.y < floor) {
    if (s.y < floor - .5 || s.vy < 8) { s.bounces++; s.events.push({ kind: 'bounce', i: 0 }); }
    s.y = floor;
    s.vy = Math.max(s.vy, TUNING.bounce * (s.target < floor ? 1 : .5));
    if (s.target < floor) s.target = floor + 6;
  }
  if (s.y > CEILING) { s.y = CEILING; s.vy = Math.min(0, s.vy); }
  // the breath and the tricks light, pop and pull in
  const ring = active(s, 'ring') * 16, magnet = active(s, 'magnet') * 22;
  s.c.beacons.forEach((b, i) => {
    if (s.lit[i]) return;
    if (inBreath(s, b.x, b.y, 1) || (ring && Math.hypot(b.x - s.x, b.y - s.y) < ring)) { s.lit[i] = true; s.events.push({ kind: 'lit', i }); }
  });
  s.c.clouds.forEach((c, i) => {
    if (s.popped[i]) return;
    const d = Math.hypot(c.x - s.x, c.y - s.y);
    if (d < c.r + 3 || inBreath(s, c.x, c.y, c.r) || (ring && d < ring + c.r) || (magnet && d < magnet * .6 + c.r)) { s.popped[i] = true; s.events.push({ kind: 'pop', i }); }
  });
  s.c.flames.forEach((f, i) => {
    if (s.got[i]) return;
    if (Math.hypot(f.x - s.x, f.y - s.y) < TUNING.grab + s.w.grab + magnet + ring) { s.got[i] = true; s.events.push({ kind: 'flame', i }); }
  });
  // a racing bird comes on when it's just ahead, flies a little faster than the dragon, and is beaten if the dragon gets past it
  s.birds.forEach((b, i) => {
    if (b.state === 'waiting' && s.x > b.x - 60) { b.state = 'racing'; b.x = s.x + TUNING.birdLead; b.since = s.t; s.events.push({ kind: 'bird', i }); }
    if (b.state !== 'racing') return;
    b.x += TUNING.bird * dt;
    if (s.x > b.x) { b.state = 'beaten'; s.events.push({ kind: 'beat', i }); }
    else if (s.t - b.since > TUNING.birdLasts) b.state = 'gone';
  });
  if (s.x >= s.c.length || s.t >= TUNING.maxTime) s.done = true;
  return s;
}

export interface FlightResult {
  readonly lit: number;
  readonly beacons: number;
  readonly popped: number;
  readonly flames: number;
  readonly birds: number;
  readonly bounces: number;
  readonly time: number;
  /** His score on this Flight, for his best: beacons and clouds and birds. */
  readonly lights: number;
}
export function resultOf(s: Sim): FlightResult {
  const lit = s.lit.filter(Boolean).length, popped = s.popped.filter(Boolean).length, birds = s.birds.filter(b => b.state === 'beaten').length;
  return { lit, beacons: s.lit.length, popped, flames: s.got.filter(Boolean).length, birds, bounces: s.bounces, time: Math.round(s.t), lights: lit + popped + birds };
}

// ---------- scripted children, for the tests and the tour ----------

export type Child = 'nothing' | 'clumsy' | 'skilled';
/** What a child does at this moment: nothing at all; a clumsy one wanders and breathes at random; a skilled one flies to the next beacon,
 *  breathes on it, flies through the clouds and zooms past a bird. */
export function childInput(s: Sim, child: Child, rng: () => number): Input {
  if (child === 'nothing') return NO_INPUT;
  if (child === 'clumsy') {
    const trick = rng() < .01 && s.tricks.length ? Math.floor(rng() * s.tricks.length) : null;
    return { target: rng() < .05 ? rng() * 90 : null, breath: rng() < .45, trick };
  }
  const nextBeacon = s.c.beacons.findIndex((b, i) => !s.lit[i] && b.x > s.x - 2);
  const b = nextBeacon >= 0 ? s.c.beacons[nextBeacon]! : null;
  const cloud = s.c.clouds.find((c, i) => !s.popped[i] && c.x > s.x && c.x - s.x < 40);
  let target = 50;
  if (b && b.x - s.x < 70) target = b.y + 1;
  else if (cloud) target = cloud.y;
  const zoom = s.tricks.findIndex(t => t.effect === 'zoom' && t.wait <= 0);
  const racing = s.birds.some(x => x.state === 'racing');
  // zoom past a bird, but not with a beacon coming up: too fast to aim
  const clear = !b || b.x - s.x > 130;
  return { target, breath: !!b && b.x - s.x < reachOf(s) + 2, trick: racing && clear && zoom >= 0 ? zoom : null };
}

/** Flies a whole Flight with a scripted child. */
export function flyWith(c: Course, child: Child, w: FlyWith = STARTER_FLY, seed = 1, dt = 1 / 30): Sim {
  let r = seed >>> 0 || 1;
  const rng = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296);
  const s = startSim(c, w);
  while (!s.done) step(s, dt, childInput(s, child, rng));
  return s;
}
