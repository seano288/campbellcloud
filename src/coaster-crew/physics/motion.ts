// The one motion model. Every question's scene and the coaster move by these rules, so a question can never say one thing and the
// reward another (questions/scenes.ts and coaster/track.ts both call it; the tests check they agree).
//
// What it gets right, because a wrong idea taught here would stay with him:
// - Down a hill, a cart's speed comes only from how far it has dropped (less a little lost to rubbing). Its weight is not a number
//   here at all: `along()` takes no mass, so a heavy cart and a light one roll down the same hill exactly alike. (Air drag, which does
//   differ, is left out: no question compares weights on a slope, and the coaster's train is the same however many riders it holds.)
// - A cart can't climb higher than it started: it slows, stops and rolls back.
// - On flat ground, the same push gets a light cart going faster than a heavy one (speed = push / mass), and then the ground slows
//   both at the same rate (rolling resistance × g), so the light one goes farther. A heavy cart needs a bigger push to start (the
//   ground holds it with resistance × weight) and is harder to stop (stopping distance = mass × speed² / 2 × stopping force).
// - Rough ground slows a cart faster than smooth ground: the same push goes farther on ice than on sand.
// - Seen from above on a flat table, gravity plays no part: a rolling ball that meets a still one of the same size stops and the
//   still one rolls on; a bouncy ball meeting a wall comes back the mirror way; a push from the side adds to the way it was going.
// - A magnet pulls iron and steel, not wood, plastic, paper, glass or rubber; it pulls through paper; it pulls harder when near.

export const G = 9.8;
/** Below this speed (m/s) a cart going uphill is said to have stopped. */
export const STOPPED = 0.15;

// ---------- flat ground ----------

/** Speed straight after a push (an impulse, N·s) on a cart of this mass (kg). */
export const speedAfterPush = (impulse: number, mass: number) => impulse / mass;
/** How far (m) and how long (s) a cart rolling at `v` goes before the ground stops it. Mass doesn't enter: the ground's rub grows with
 *  weight exactly as fast as the weight resists slowing. */
export const coastDistance = (v: number, resistance: number) => (v * v) / (2 * resistance * G);
export const coastTime = (v: number, resistance: number) => v / (resistance * G);
/** Where a coasting cart is `t` seconds after it was going `v`. */
export function coastAt(v: number, resistance: number, t: number): number {
  const stop = coastTime(v, resistance);
  const s = Math.min(t, stop);
  return v * s - 0.5 * resistance * G * s * s;
}
/** Does a steady push (N) get a resting cart moving? The ground holds it with (starting) resistance × weight. */
export const pushStarts = (force: number, mass: number, startResistance: number) => force > startResistance * mass * G;
/** How far a cart rolling at `v` goes while a hand pushes back on it with `force` (N): more mass, harder to stop. */
export const stoppingDistance = (mass: number, v: number, force: number) => (mass * v * v) / (2 * force);

// ---------- along a track: hills, and the coaster ----------

/** A track drawn from the side: points (x, y) in metres, y up. A zone can change what happens on part of it. */
export interface Profile {
  readonly pts: readonly (readonly [number, number])[];
  /** Cumulative length at each point. */
  readonly len: readonly number[];
  /** Rolling resistance (a share of g) on the plain track. */
  readonly resistance: number;
  readonly zones: readonly Zone[];
}
export type Zone =
  /** A chain pulls the car up at a steady speed. */
  | { readonly kind: 'chain'; readonly from: number; readonly to: number; readonly speed: number }
  /** Wheels push it up to at least this speed. */
  | { readonly kind: 'boost'; readonly from: number; readonly to: number; readonly speed: number }
  /** Brakes slow it to at most this speed. */
  | { readonly kind: 'brake'; readonly from: number; readonly to: number; readonly speed: number }
  /** Extra rubbing: water in a splash pool, a tight turn. */
  | { readonly kind: 'drag'; readonly from: number; readonly to: number; readonly resistance: number };

export function profile(pts: readonly (readonly [number, number])[], resistance: number, zones: readonly Zone[] = []): Profile {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  return { pts, len, resistance, zones };
}
export const lengthOf = (p: Profile) => p.len[p.len.length - 1]!;

/** The point at distance `s` along the track, and its slope (dy/ds) and direction. */
export function pointAt(p: Profile, s: number): { x: number; y: number; slope: number; angle: number; i: number } {
  const L = lengthOf(p), d = Math.max(0, Math.min(L, s));
  let lo = 0, hi = p.len.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (p.len[mid]! <= d) lo = mid; else hi = mid; }
  const a = p.pts[lo]!, b = p.pts[hi]!, seg = p.len[hi]! - p.len[lo]! || 1, k = (d - p.len[lo]!) / seg;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return { x: a[0] + dx * k, y: a[1] + dy * k, slope: dy / seg, angle: Math.atan2(dy, dx), i: lo };
}

export interface Rolling { s: number; v: number }
/** One small step of a car rolling along the track. There is no mass in it: gravity along the slope and the track's rub are the same
 *  for any weight. Zones (chain, booster, brakes, water) act where the car is. */
export function step(p: Profile, c: Rolling, dt: number): Rolling {
  const here = pointAt(p, c.s);
  const zone = p.zones.find(z => c.s >= z.from && c.s < z.to);
  if (zone?.kind === 'chain') return { s: c.s + zone.speed * dt, v: zone.speed };
  const rub = (zone?.kind === 'drag' ? zone.resistance : p.resistance) * G * Math.sqrt(Math.max(0, 1 - here.slope * here.slope));
  const pull = -G * here.slope;
  let v: number;
  if (Math.abs(c.v) < 1e-9) {
    // at rest: it stays where the ground can hold it, else it starts to roll downhill
    v = Math.abs(pull) <= rub ? 0 : (pull - Math.sign(pull) * rub) * dt;
  } else {
    v = c.v + (pull - Math.sign(c.v) * rub) * dt;
    // the rub can stop it but never push it back the other way
    if (Math.sign(v) !== Math.sign(c.v) && Math.abs(pull) <= rub) v = 0;
  }
  if (zone?.kind === 'boost' && v < zone.speed) v = Math.min(zone.speed, Math.max(v, 0) + 9 * dt);
  if (zone?.kind === 'brake' && v > zone.speed) v = Math.max(zone.speed, v - 7 * dt);
  return { s: c.s + v * dt, v };
}

/** Rolls a car from `start` until it reaches the end of the track or comes to rest. Records where it is at each frame (60 a second). */
export function roll(p: Profile, start: Rolling, opts: { maxT?: number } = {}): { frames: Rolling[]; end: 'through' | 'rest'; rolledBack: boolean; topSpeed: number } {
  const dt = 1 / 60, maxT = opts.maxT ?? 60, L = lengthOf(p), sub = 4;
  const frames: Rolling[] = [start];
  let c = start, rolledBack = false, still = 0, topSpeed = Math.abs(start.v);
  for (let t = 0; t < maxT; t += dt) {
    for (let k = 0; k < sub; k++) c = step(p, c, dt / sub);
    if (c.v < -STOPPED) rolledBack = true;
    topSpeed = Math.max(topSpeed, Math.abs(c.v));
    if (c.s >= L) { frames.push({ s: L, v: c.v }); return { frames, end: 'through', rolledBack, topSpeed }; }
    if (c.s < 0) c = { s: 0, v: 0 };
    frames.push(c);
    still = Math.abs(c.v) < 0.05 ? still + 1 : 0;
    if (still > 30) return { frames, end: 'rest', rolledBack, topSpeed };
  }
  return { frames, end: 'rest', rolledBack, topSpeed };
}

/** The first place (distance along the track) where a car going forward would slow below `min` m/s somewhere a chain or a booster
 *  isn't carrying it (so it would crawl to a stop and roll back), or null if it gets to the end. The builder and the Guest Coasters
 *  use this; the Ride is never opened on a track where it isn't null. Reaching `finish` counts as getting to the end. */
export function rollsBackAt(p: Profile, start: Rolling, min = STOPPED, finish = lengthOf(p)): number | null {
  const dt = 1 / 120, L = Math.min(lengthOf(p), finish);
  let c = start;
  for (let t = 0; t < 900; t += dt) {
    c = step(p, c, dt);
    if (c.s >= L) return null;
    const carried = p.zones.some(z => (z.kind === 'chain' || z.kind === 'boost') && c.s >= z.from && c.s < z.to);
    if (!carried && c.v < min) return c.s;
  }
  return c.s;
}

/** Speed at the bottom of a drop from `h` metres, from the height alone (less nothing: the ideal case the lessons say aloud). */
export const speedFromDrop = (h: number) => Math.sqrt(2 * G * Math.max(0, h));

// ---------- seen from above: balls on a table ----------

export interface Vec { readonly x: number; readonly y: number }
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const angleOf = (a: Vec) => Math.atan2(a.y, a.x);

/** Two balls of the same size and weight meet head on, one still: the moving one stops and the still one goes on at its speed. */
export function headOn(moving: Vec): { mover: Vec; struck: Vec } {
  return { mover: { x: 0, y: 0 }, struck: moving };
}
/** A bouncy ball meets a wall whose surface points along `normal` (unit): it comes back the mirror way, a little slower. */
export function offWall(v: Vec, normal: Vec, bounce = 0.85): Vec {
  const n = v.x * normal.x + v.y * normal.y;
  return { x: (v.x - (1 + bounce) * n * normal.x), y: (v.y - (1 + bounce) * n * normal.y) };
}
/** A push from the side on a moving ball: the push adds to the way it was going, so it goes off between the two. */
export const sidePush = (v: Vec, impulse: Vec, mass: number): Vec => add(v, scale(impulse, 1 / mass));

// ---------- magnets ----------

/** How near (m) a small magnet must be to pull a paper clip across a table. */
export const MAGNET_REACH = 0.12;
/** Does the magnet pull this thing to it? Only if it is iron or steel and near enough; paper, cloth or thin plastic between doesn't stop it. */
export const magnetPulls = (magnetic: boolean, distance: number) => magnetic && distance <= MAGNET_REACH;
/** How hard it pulls, by distance: much harder near (it falls off quickly with distance). Relative, 1 at the reach. */
export const pullStrength = (distance: number) => (MAGNET_REACH / Math.max(0.01, distance)) ** 3;
/** Two magnets: ends that are different (N and S) pull together; ends that are the same push apart. */
export const polesPull = (a: 'N' | 'S', b: 'N' | 'S') => a !== b;
