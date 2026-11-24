// The Launch, as numbers only: no drawing and no sound, so the tests can fly thousands. From the side, about a minute:
//
// 1. The countdown, spoken from ten. Nothing to do but watch the steam.
// 2. The climb. He holds a finger on the screen to burn, and where his finger is, left or right of the rocket, tilts it, to keep it in a
//    wide path that curves gently up through the clouds. Out of the path the rocket only wobbles and climbs more slowly. With no finger it
//    burns gently and steers back toward the path by itself, so a child who does nothing still gets to orbit.
// 3. Staging. When the boosters are empty a button asks him to drop them, then the main stage; each drops by itself after a few seconds
//    if he doesn't tap.
// 4. Orbit: the sky is black, and the Launch is done.
//
// It cannot be failed: nothing collides, the rocket can't fall, and every input (or none) reaches orbit. All the tuning is in TUNING.
// sim.test.ts flies it with a child who does nothing, a clumsy one and a skilled one.
import { seeded, type Rng } from '../../game/rng';

export const STEP = 1 / 60;

/** Every number that sets how the Launch plays, in one place, to tune on the iPad 9. */
export const TUNING = {
  /** Seconds of countdown (spoken from ten). */
  countdown: 10.5,
  /** Height of orbit, in units; the clouds' band; where the sky turns black. */
  orbit: 1000, cloudLow: 170, cloudHigh: 380, space: 720,
  /** How far right the path has leaned by orbit, and its half-width (wide: it's a guide, not a tightrope). */
  lean: 520, halfWidth: 95,
  /** Climb speeds, units a second: burning in the path, burning out of it, and the gentle burn with no finger. */
  climb: 24, offPath: 13, idle: 10,
  /** How fast the rocket turns toward his finger, and leans back to the path with none (radians a second); the most it can tilt. */
  turn: 1.3, selfSteer: .55, maxTilt: .9,
  /** Seconds from a stage running dry to it dropping by itself. */
  autoDrop: 3.5,
  /** Burning with no finger starts after this many seconds of the climb. */
  idleAfter: 3,
  /** The climb never runs past this; long before it the rocket is flying itself. */
  maxS: 140,
} as const;
const T = TUNING;

export type Phase = 'count' | 'climb' | 'orbit';
export type Stage = 'boosters' | 'main' | 'upper';

export interface LaunchSetup {
  /** Does the rocket have side boosters? (Then it drops them, then the main stage.) */
  readonly boosters: boolean;
  /** Does it have an upper stage? A sounding rocket has none: it drops nothing. */
  readonly upper: boolean;
  /** Heavier payloads for the rocket's lift climb a little slower (0 easy, 1 at its limit); never stuck. */
  readonly load: number;
  /** The Weather Mast halves the clouds' wobble. */
  readonly calm: boolean;
  readonly seed: number;
}

export interface Input {
  /** A finger is on the screen: burn. */
  readonly burn?: boolean;
  /** Where the finger is, as a lean: -1 hard left to 1 hard right, relative to the rocket. Null with no finger. */
  readonly steer?: number | null;
  /** The Drop button was tapped. */
  readonly drop?: boolean;
}

export type LaunchEvent =
  | { t: 'tick'; n: number } | { t: 'liftoff' } | { t: 'hold' } | { t: 'clouds' } | { t: 'bump' }
  | { t: 'empty'; stage: Stage } | { t: 'drop'; stage: Stage; auto: boolean } | { t: 'space' } | { t: 'orbit' } | { t: 'path'; inside: boolean };

export interface Sim {
  readonly setup: LaunchSetup;
  phase: Phase;
  t: number;
  /** Seconds in this phase. */
  pt: number;
  /** Height and sideways position, in units; the tilt (radians, right positive). */
  alt: number; x: number; tilt: number;
  /** The wobble from a cloud bump, fading. */
  wobble: number;
  /** The stages still on, bottom first; and the one waiting to be dropped (empty), if any, and for how long. */
  stages: Stage[]; empty: Stage | null; emptyT: number;
  /** Seconds he flew it himself (a finger on the screen) in the path and out of it, and seconds it flew itself, for his smoothest Launch. */
  inside: number; outside: number; idle: number;
  wasInside: boolean; seenClouds: boolean; seenSpace: boolean; lastTick: number;
  readonly clouds: { alt: number; x: number; r: number; hit: boolean }[];
  readonly rng: Rng;
  events: LaunchEvent[];
}

/** The middle of the path at a height: straight up off the pad, then leaning right more and more. */
export const pathX = (alt: number) => T.lean * Math.pow(Math.max(0, Math.min(1, alt / T.orbit)), 1.8);
/** The path's direction at a height, as a tilt. */
export const pathTilt = (alt: number) => Math.atan2(pathX(alt + 10) - pathX(alt - 10), 20);
/** Each stage burns until this share of the way to orbit (with boosters: boosters, then main; without: main). */
export const stageEnds = (s: Pick<LaunchSetup, 'boosters' | 'upper'>): Partial<Record<Stage, number>> =>
  !s.upper ? { boosters: .35 } : s.boosters ? { boosters: .3, main: .65 } : { main: .55 };

export function createSim(setup: LaunchSetup): Sim {
  const rng = seeded(setup.seed);
  const stages: Stage[] = [...(setup.boosters ? ['boosters' as const] : []), 'main', ...(setup.upper ? ['upper' as const] : [])];
  // clouds sit off to the sides of the path, so a steady hand passes between them
  const clouds = Array.from({ length: 7 }, (_, i) => {
    const alt = T.cloudLow + (i + .5) * ((T.cloudHigh - T.cloudLow) / 7), side = i % 2 ? 1 : -1;
    return { alt, x: pathX(alt) + side * (T.halfWidth + 50 + rng() * 60), r: 55 + rng() * 25, hit: false };
  });
  return {
    setup, phase: 'count', t: 0, pt: 0, alt: 0, x: 0, tilt: 0, wobble: 0, stages, empty: null, emptyT: 0, inside: 0, outside: 0, idle: 0,
    wasInside: true, seenClouds: false, seenSpace: false, lastTick: 11, clouds, rng, events: [],
  };
}

const to = (s: Sim, p: Phase) => { s.phase = p; s.pt = 0; };
export const inPath = (s: Pick<Sim, 'alt' | 'x'>) => Math.abs(s.x - pathX(s.alt)) <= T.halfWidth;
/** How smooth the Launch was, 0 to 1: the share of the time he flew it himself that he kept it in the path. Time it flew itself (no finger)
 *  counts for nothing, so doing nothing is never his smoothest Launch; flying most of the climb (SELF_SHARE) is all it asks. */
export const SELF_SHARE = .6;
export function smoothness(s: Pick<Sim, 'inside' | 'outside' | 'idle'>): number {
  const hand = s.inside + s.outside, all = hand + s.idle;
  return all ? s.inside / Math.max(hand, all * SELF_SHARE) : 1;
}
/** Stars for the Launch, by how smooth it was. */
export const starsFor = (smooth: number): 1 | 2 | 3 => (smooth >= .85 ? 3 : smooth >= .6 ? 2 : 1);

function drop(s: Sim, auto: boolean) {
  const stage = s.empty!;
  s.stages = s.stages.filter(x => x !== stage);
  s.empty = null; s.emptyT = 0;
  s.events.push({ t: 'drop', stage, auto });
}

export function stepSim(s: Sim, input: Input = {}) {
  const dt = STEP;
  s.t += dt; s.pt += dt;
  s.wobble *= 1 - dt * 2.5;
  if (s.phase === 'count') {
    const n = Math.ceil(T.countdown - 0.5 - s.pt);
    if (n < s.lastTick && n >= 1 && n <= 10) { s.lastTick = n; s.events.push({ t: 'tick', n }); }
    if (s.pt >= T.countdown) { to(s, 'climb'); s.events.push({ t: 'liftoff' }); }
    return;
  }
  if (s.phase === 'orbit') return;

  // ---- the climb ----
  const late = s.pt > T.maxS * .6;
  const finger = input.steer !== undefined && input.steer !== null;
  const burning = !!input.burn || late;
  if (s.pt > T.idleAfter && !burning && s.pt < T.idleAfter + dt * 1.5) s.events.push({ t: 'hold' });
  // steering: toward his finger, or back toward the path by itself
  const want = finger && !late ? Math.max(-T.maxTilt, Math.min(T.maxTilt, input.steer! * T.maxTilt)) : pathTilt(s.alt) + Math.max(-.5, Math.min(.5, (pathX(s.alt) - s.x) / 160));
  const rate = finger && !late ? T.turn : T.selfSteer * (late ? 3 : 1);
  s.tilt += Math.max(-rate * dt, Math.min(rate * dt, want - s.tilt));
  const inside = inPath(s);
  if (inside !== s.wasInside) { s.wasInside = inside; s.events.push({ t: 'path', inside }); }
  // how fast it climbs: burning in the path is quickest; heavy loads are a little slower; it can't stop
  const heavy = 1 - .2 * Math.max(0, Math.min(1, s.setup.load));
  const waiting = s.empty ? .75 : 1; // an empty stage still on is dead weight until he drops it
  const v = (burning ? (inside ? T.climb : T.offPath) : s.pt > T.idleAfter ? T.idle : T.idle * .5) * heavy * waiting;
  s.alt = Math.min(T.orbit, s.alt + v * Math.cos(s.tilt) * dt * (1 - Math.min(.6, s.wobble * .4)));
  s.x += v * Math.sin(s.tilt) * dt * 1.6 + s.wobble * Math.sin(s.t * 14) * 8 * dt;
  if (input.burn) { if (inside) s.inside += dt; else s.outside += dt; } else if (burning || s.pt > T.idleAfter) s.idle += dt;
  // clouds only wobble it
  if (s.alt > T.cloudLow - 40 && !s.seenClouds) { s.seenClouds = true; s.events.push({ t: 'clouds' }); }
  for (const c of s.clouds) {
    if (!c.hit && Math.hypot(s.x - c.x, s.alt - c.alt) < c.r) { c.hit = true; s.wobble = s.setup.calm ? .6 : 1.2; s.events.push({ t: 'bump' }); }
  }
  // staging
  const ends = stageEnds(s.setup), share = s.alt / T.orbit, bottom = s.stages[0]!;
  if (!s.empty && bottom !== 'upper' && s.stages.length > 1 && share >= (ends[bottom] ?? 2)) { s.empty = bottom; s.emptyT = 0; s.events.push({ t: 'empty', stage: bottom }); }
  if (s.empty) {
    s.emptyT += dt;
    if (input.drop) drop(s, false);
    else if (s.emptyT >= T.autoDrop) drop(s, true);
  }
  if (s.alt >= T.space && !s.seenSpace) { s.seenSpace = true; s.events.push({ t: 'space' }); }
  if (s.alt >= T.orbit) {
    if (s.empty) drop(s, true);
    to(s, 'orbit'); s.events.push({ t: 'orbit' });
  }
}

export function takeEvents(s: Sim): LaunchEvent[] { const e = s.events; s.events = []; return e; }

/** The scripted children the tests fly. Nothing: no finger at all. Clumsy: burns in bursts, steers late and wide, never taps Drop.
 *  Skilled: keeps the rocket on the path and drops each stage at once. */
export type Child = 'nothing' | 'clumsy' | 'skilled';
export function inputFor(s: Sim, child: Child, rng: Rng): Input {
  if (child === 'nothing') return {};
  const off = pathX(s.alt + 40) - s.x;
  if (child === 'skilled') return { burn: true, steer: Math.max(-1, Math.min(1, off / 60 + pathTilt(s.alt) / T.maxTilt)), drop: !!s.empty };
  const burst = Math.sin(s.t * 1.3) > -.3;
  return { burn: burst, steer: burst ? Math.sin(s.t * .6 + rng() * .2) * .9 + off / 400 : null, drop: false };
}
export function flyWith(setup: LaunchSetup, child: Child, seed = 1): Sim {
  const s = createSim(setup), rng = seeded(seed * 97 + 3);
  for (let i = 0; i < (T.countdown + T.maxS + 10) / STEP && s.phase !== 'orbit'; i++) stepSim(s, inputFor(s, child, rng));
  return s;
}
