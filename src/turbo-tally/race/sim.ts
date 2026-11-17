// The Race, as numbers: four cars on a track seen from above, three laps. It is stepped at a fixed rate and knows nothing of the
// screen, so tests can drive it with a scripted child (race.test.ts).
//
// His car drives forward by itself. A held finger leads it: the car turns toward the finger's spot, as Math Bots' robot heads for a
// finger on the arena. With no finger it drifts gently along the track, so it always gets round. Parts are real: the Engine sets top
// speed, the Wing and Tyres how fast it turns its speed into a new direction (low grip slides wide), the Tyres suit a surface (the
// wrong one only slides more), and the Booster how many boosts he gets. A wall or another car only bounces him; nothing stops him.
// Rivals follow the track with a little look ahead. Their pace lives in one table (rivals.ts), and they ease off when he is far behind.
import { laid, nearest, pointAhead, type Laid, type Pt, type Surface, type TrackDef } from './tracks';

export const STEP = 1 / 120;
export const LAPS = 3;
/** The race starts after "3, 2, 1, Go!". */
export const COUNT_S = 3.2;
/** However it's going, a race ends by then: he has finished, or he's placed where he is. */
export const MAX_S = 150;
export const CAR_R = 22;
/** How close his finger must be before the car stops turning toward it. */
const NEAR = 36;

export interface CarStats {
  /** The Speed number in the Garage, about 30 to 99. */
  readonly speed: number;
  /** The Grip number, about 20 to 99. */
  readonly grip: number;
  /** Boosts per Race. */
  readonly boosts: number;
  /** How well the tyres suit each surface: 1 is right, less slides wider. */
  readonly suits: Readonly<Record<Surface, number>>;
  /** How strong each boost is: 1 is the starter's. */
  readonly kick?: number;
}

/** Speed number to top speed in track units a second. */
export const topSpeedOf = (speed: number) => 190 + speed * 3.6;
/** Grip number (and the surface) to how quickly the car's motion swings round to where it points, per second. */
export const gripOf = (grip: number, suit: number) => (.7 + grip / 20) * suit;
const SCRUB = 1.6, ACCEL = 300, TURN = 3.4, LAZY_TURN = 1.15, BOOST_S = 1.6, BOOST_TOP = 1.4, BOOST_KICK = 90;

export interface Car {
  x: number; y: number; vx: number; vy: number; heading: number;
  /** Forward speed the engine is driving at. */
  spd: number;
  /** Nearest track point, and laps and distance round. */
  i: number; lap: number; along: number;
  boosts: number; boosting: number;
  finished: number | null;
  readonly stats: CarStats;
  readonly top: number;
  /** A rival's share of its top speed, and the lane it likes. */
  pace: number; lane: number;
  /** When the rival will next use a boost (a distance round the whole race). */
  boostAt: number;
  bumpCd: number;
  readonly player: boolean;
  /** How far the motion points away from where the car does: skids when big. */
  slip: number;
}

export type RaceEvent =
  | { t: 'go' } | { t: 'lap'; car: number; lap: number } | { t: 'boost'; car: number } | { t: 'wall'; car: number; x: number; y: number; hard: number }
  | { t: 'bump'; a: number; b: number; x: number; y: number } | { t: 'pass'; place: number } | { t: 'finish'; car: number; place: number };

export interface Race {
  readonly track: Laid;
  readonly cars: Car[];
  t: number;
  over: boolean;
  /** Car indexes in finishing order, filled as they cross. */
  order: number[];
  events: RaceEvent[];
  /** His place now, 1 to 4. */
  place: number;
  readonly laps: number;
}

export interface Driver { readonly stats: CarStats; readonly pace?: number }

/** Total distance round so far, laps included. */
export const progressOf = (r: Pick<Race, 'track'>, c: Car) => c.lap * r.track.length + c.along;

/** Grid: his car at the back, rivals ahead of it in two lanes, all pointing round the track. */
export function createRace(def: TrackDef, you: Driver, rivals: readonly Driver[], laps = LAPS): Race {
  const track = laid(def), n = track.pts.length;
  const cars: Car[] = [you, ...rivals].map((d, k) => {
    const back = (rivals.length - k) * 70 + 60; // he starts last, a car's length behind the one in front
    const i = (n - Math.round(back / 18) + n) % n, p = pointAhead(track, i, 0, k % 2 ? -46 : 46), dir = track.dir[i]!;
    const top = topSpeedOf(d.stats.speed);
    return {
      x: p.x, y: p.y, vx: 0, vy: 0, heading: Math.atan2(dir.y, dir.x), spd: 0, i, lap: -1, along: track.at[i]!,
      boosts: d.stats.boosts, boosting: 0, finished: null, stats: d.stats, top, pace: d.pace ?? 1, lane: k === 0 ? 0 : (k % 2 ? -1 : 1) * (26 + k * 6),
      boostAt: k === 0 ? Infinity : track.length * (.55 + k * .4), bumpCd: 0, player: k === 0, slip: 0,
    };
  });
  const r: Race = { track, cars, t: 0, over: false, order: [], events: [], place: cars.length, laps };
  r.place = placeOf(r, 0);
  return r;
}

/** Place of car k right now: finished cars by when they crossed, the rest by how far round they are. */
export function placeOf(r: Race, k: number): number {
  const done = r.order.indexOf(k);
  if (done >= 0) return done + 1;
  const mine = progressOf(r, r.cars[k]!);
  return r.order.length + 1 + r.cars.filter((c, j) => j !== k && c.finished === null && progressOf(r, c) > mine).length;
}
/** Every car in place order. */
export const standings = (r: Race) => r.cars.map((_, k) => k).sort((a, b) => placeOf(r, a) - placeOf(r, b));

export interface Input {
  /** Where his finger is on the track, or null. */
  readonly target: Pt | null;
  /** A press of the Boost button (one press is one boost). */
  readonly boost: boolean;
}

const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const surfaceOf = (r: Race): Surface => r.track.def.surface;

/** A rival's ease-off: far ahead of him, it lifts. */
export const EASE = { gap: 500, far: 1100, near: .86, farPace: .74 } as const;

function steer(r: Race, c: Car, input: Input | null, dt: number) {
  let want: number | null = null, rate = TURN;
  if (c.player) {
    if (input?.target) {
      const dx = input.target.x - c.x, dy = input.target.y - c.y;
      if (Math.hypot(dx, dy) > NEAR) want = Math.atan2(dy, dx);
    } else { // hands off: drift along the track, lazily
      const p = pointAhead(r.track, c.i, 150);
      want = Math.atan2(p.y - c.y, p.x - c.x);
      rate = LAZY_TURN;
    }
  } else {
    const p = pointAhead(r.track, c.i, 120 + c.spd * .3, c.lane);
    want = Math.atan2(p.y - c.y, p.x - c.x);
  }
  if (want !== null) {
    const d = wrap(want - c.heading), most = rate * dt;
    c.heading = wrap(c.heading + Math.max(-most, Math.min(most, d)));
  }
}

function drive(r: Race, c: Car, k: number, input: Input | null, you: Car, dt: number) {
  if (r.t < COUNT_S) return;
  steer(r, c, input, dt);
  let pace = c.pace;
  if (!c.player && c.finished === null && you.finished === null) {
    const ahead = progressOf(r, c) - progressOf(r, you);
    if (ahead > EASE.far) pace *= EASE.farPace; else if (ahead > EASE.gap) pace *= EASE.near;
  }
  // a boost: press for him, at a set distance for a rival
  const boostNow = c.player ? !!input?.boost : progressOf(r, c) >= c.boostAt;
  if (boostNow && c.boosts > 0 && c.boosting <= 0 && c.finished === null) {
    c.boosts--; c.boosting = BOOST_S * (c.stats.kick ?? 1); c.spd += BOOST_KICK * (c.stats.kick ?? 1);
    if (!c.player) c.boostAt = progressOf(r, c) + r.track.length * .9;
    r.events.push({ t: 'boost', car: k });
  }
  if (!c.player && c.boosts <= 0) c.boostAt = Infinity;
  const top = c.top * pace * (c.boosting > 0 ? BOOST_TOP : 1) * (c.finished !== null ? .5 : 1);
  c.boosting = Math.max(0, c.boosting - dt);
  c.spd = c.spd < top ? Math.min(top, c.spd + ACCEL * (c.boosting > 0 ? 1.8 : 1) * dt) : Math.max(top, c.spd - ACCEL * .8 * dt);
  // motion swings round toward where the car points, as fast as its grip allows: low grip slides wide
  const g = gripOf(c.stats.grip, c.stats.suits[surfaceOf(r)]), hx = Math.cos(c.heading) * c.spd, hy = Math.sin(c.heading) * c.spd;
  const k2 = Math.min(1, g * dt);
  c.vx += (hx - c.vx) * k2; c.vy += (hy - c.vy) * k2;
  const v = Math.hypot(c.vx, c.vy);
  c.slip = v > 40 ? Math.abs(wrap(Math.atan2(c.vy, c.vx) - c.heading)) : 0;
  c.spd -= c.spd * Math.min(.6, c.slip) * SCRUB * dt; // sliding scrubs speed off: grip pays in the corners
  c.x += c.vx * dt; c.y += c.vy * dt;
}

/** Keeps a car on the track: the wall bounces it back in, turned along the track, a little slower. */
function walls(r: Race, c: Car, k: number) {
  const near = nearest(r.track, c.x, c.y, c.i);
  const prev = c.along;
  c.i = near.i;
  c.along = near.along;
  // a lap: crossing the start line forward (and back, if he reverses over it)
  if (prev > r.track.length * .75 && c.along < r.track.length * .25) {
    c.lap++;
    if (c.lap >= 1 && c.finished === null) r.events.push({ t: 'lap', car: k, lap: c.lap });
  } else if (prev < r.track.length * .25 && c.along > r.track.length * .75) c.lap--;
  const room = r.track.half - CAR_R;
  if (near.d <= room) return;
  const d = r.track.dir[near.i]!, nx = -d.y * Math.sign(near.side), ny = d.x * Math.sign(near.side);
  // back inside
  c.x -= nx * (near.d - room); c.y -= ny * (near.d - room);
  const out = c.vx * nx + c.vy * ny;
  if (out > 0) {
    c.vx -= out * nx * 1.35; c.vy -= out * ny * 1.35;
    const hard = Math.min(1, out / 300);
    c.spd *= 1 - .3 * hard;
    // turned to run along the wall, so a child who keeps pushing still gets round
    const along = Math.atan2(d.y, d.x), off = wrap(along - c.heading);
    c.heading = wrap(c.heading + off * .35);
    if (c.bumpCd <= 0 && hard > .08) { r.events.push({ t: 'wall', car: k, x: c.x, y: c.y, hard }); c.bumpCd = .4; }
  }
}

function clash(r: Race, a: Car, b: Car, ka: number, kb: number) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, gap = CAR_R * 2 - d;
  if (gap <= 0) return;
  const nx = dx / d, ny = dy / d;
  a.x -= nx * gap / 2; a.y -= ny * gap / 2; b.x += nx * gap / 2; b.y += ny * gap / 2;
  const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (closing > 0) {
    const j = closing * .6;
    a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny;
    a.spd *= .96; b.spd *= .96;
    if ((a.player || b.player) && closing > 60 && Math.min(a.bumpCd, b.bumpCd) <= 0) { r.events.push({ t: 'bump', a: ka, b: kb, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); a.bumpCd = b.bumpCd = .4; }
  }
}

export function stepRace(r: Race, input: Input) {
  if (r.over) return;
  const wasBefore = r.t < COUNT_S;
  r.t += STEP;
  if (wasBefore && r.t >= COUNT_S) r.events.push({ t: 'go' });
  const you = r.cars[0]!;
  r.cars.forEach((c, k) => { c.bumpCd = Math.max(0, c.bumpCd - STEP); drive(r, c, k, k === 0 ? input : null, you, STEP); });
  for (let a = 0; a < r.cars.length; a++) for (let b = a + 1; b < r.cars.length; b++) clash(r, r.cars[a]!, r.cars[b]!, a, b);
  r.cars.forEach((c, k) => walls(r, c, k));
  r.cars.forEach((c, k) => {
    if (c.finished === null && c.lap >= r.laps) { c.finished = r.t; r.order.push(k); r.events.push({ t: 'finish', car: k, place: r.order.length }); }
  });
  const place = placeOf(r, 0);
  if (place < r.place && r.t > COUNT_S) r.events.push({ t: 'pass', place });
  r.place = place;
  // he crossed the line: everyone else is placed where they are now. Or it has gone on too long: the same.
  if (you.finished !== null || r.t >= MAX_S) {
    for (const k of standings(r)) if (!r.order.includes(k)) r.order.push(k);
    r.place = placeOf(r, 0);
    r.over = true;
  }
}

/** Takes the events since last asked. */
export const takeEvents = (r: Race) => { const e = r.events; r.events = []; return e; };
