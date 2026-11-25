// The Jump, as numbers. Everything is in feet and seconds, stepped 60 times a second with nothing random, so the same truck, the same
// ramp, the same Show and the same inputs always give the same distance (the Record Board means something, and "Watch it" replays a jump
// exactly from its inputs).
//
// 1. The start: three lights, then GO.
// 2. The run-up: he holds the pedal and the truck speeds up toward its top speed (speed builds quickly at first, then more slowly). Off
//    the pedal it rolls on at a crawl, so even a child who does nothing reaches the ramp.
// 3. The air: off the lip at the kicker's angle. Holding a finger left of the truck lifts its nose, right of it dips it; with no finger it
//    slowly noses down by itself. A booster, if he has one, gives one push forward when he taps Boost (sooner is farther).
// 4. The landing: wheels down within the springs' window is a clean landing. Nose first or tail first only bounces it back onto its
//    wheels. Landing on the row crunches it; it still counts.
// 5. The distance: from the ramp's lip to where the back wheels touched, in whole feet.
//
// Wind (a Show's) and help (the wind that grows each time he falls short of the same row, the mercy step) push the truck in the air.

export const STEP = 1 / 60;
export const G = 32;

export interface Setup {
  /** Top speed on the run-up, ft/s (engine and its tuning). */
  readonly top: number;
  /** How fast speed builds, ft/s² at a standstill (tires and engine). */
  readonly accel: number;
  /** The run-up from the start line to the foot of the kicker, ft. */
  readonly runUp: number;
  /** The kicker: its angle (degrees) and the height of its lip (ft). */
  readonly angle: number;
  readonly lip: number;
  /** The booster's push, ft/s (0: no booster). */
  readonly boost: number;
  /** A clean landing is within this many degrees of level (springs and the landing ramp). */
  readonly window: number;
  /** How fast his finger tilts the truck, degrees a second (the body). */
  readonly tilt: number;
  /** The Show's wind, ft/s (tail wind positive). */
  readonly wind: number;
  /** Tries he has already fallen short of this row: each adds a tail wind of HELP_PER of his speed (the mercy step). */
  readonly help: number;
  /** How long the row is, ft from the lip. 0: nothing to jump. */
  readonly row: number;
}

/** The tuning, in one place. */
export const TUNING = {
  /** Seconds of start lights. */
  lights: 2.4,
  /** Off the pedal the truck rolls toward this share of its top speed. */
  crawl: .32,
  /** How quickly it slows to a crawl when he lets go, ft/s². */
  coast: 6,
  /** How fast the nose drops by itself in the air, degrees a second, and how it eases toward level near the ground. */
  droop: 6,
  /** Tail wind for each try he has fallen short of the same row, as a share of his speed through the air. */
  helpPer: .45,
  /** The most help: past this the wind stops growing. */
  helpMost: 8,
  /** Seconds the truck takes to settle and roll to a stop after landing. */
  settle: 1.6,
  /** Longest a jump can take, so nothing ever hangs (seconds after GO). */
  maxS: 40,
} as const;
export const HELP_PER = TUNING.helpPer;

export type Phase = 'lights' | 'run' | 'air' | 'land' | 'done';
export interface Input { readonly pedal: boolean; readonly tilt: -1 | 0 | 1; readonly boost: boolean }
export const NO_INPUT: Input = { pedal: false, tilt: 0, boost: false };

export type SimEvent =
  | { t: 'light'; n: 3 | 2 | 1 }
  | { t: 'go' }
  | { t: 'pedal'; on: boolean }
  | { t: 'lip'; speed: number }
  | { t: 'boost' }
  | { t: 'land'; clean: boolean; how: 'clean' | 'nose' | 'tail' | 'flat'; onRow: boolean }
  | { t: 'stop'; feet: number; cleared: boolean };

export interface Sim {
  readonly setup: Setup;
  phase: Phase;
  /** Seconds since the sim began, and steps taken. */
  t: number;
  steps: number;
  /** Where the truck is: x in feet from the lip (the run-up is negative), y its height; its speed along the ground on the run-up. */
  x: number; y: number; v: number;
  vx: number; vy: number;
  /** Nose up is positive, degrees. */
  pitch: number;
  boosted: boolean;
  /** When the booster fired, seconds after leaving the lip; -1 if not. */
  boostAt: number;
  airT: number;
  /** The distance, once it has landed. */
  feet: number;
  landed: null | { clean: boolean; how: 'clean' | 'nose' | 'tail' | 'flat'; onRow: boolean; x: number };
  /** Share of the run-up he held the pedal. */
  held: number; runSteps: number;
  /** Top speed reached at the lip. */
  lipSpeed: number;
  settleT: number;
  events: SimEvent[];
  lastPedal: boolean;
}

/** How far before the lip the kicker begins: its slope, drawn to its height and angle. */
export const kickerLen = (s: Pick<Setup, 'angle' | 'lip'>) => s.lip / Math.tan((s.angle * Math.PI) / 180);
/** Where the run-up starts. */
export const startX = (s: Setup) => -(s.runUp + kickerLen(s));
/** Height of the ramp under x (the run-up is flat, then the kicker rises to the lip). */
export function groundAt(s: Setup, x: number): number {
  const k = kickerLen(s);
  if (x < -k) return 0;
  if (x <= 0) return ((x + k) / k) * s.lip;
  return 0;
}

export function createSim(setup: Setup): Sim {
  return {
    setup, phase: 'lights', t: 0, steps: 0, x: startX(setup), y: 0, v: 0, vx: 0, vy: 0, pitch: 0, boosted: false, boostAt: -1, airT: 0, feet: 0, landed: null,
    held: 0, runSteps: 0, lipSpeed: 0, settleT: 0, events: [], lastPedal: false,
  };
}
export function takeEvents(s: Sim): SimEvent[] { const e = s.events; s.events = []; return e; }

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function stepSim(s: Sim, input: Input): void {
  if (s.phase === 'done') return;
  const S = s.setup, dt = STEP;
  s.t += dt; s.steps++;
  if (s.phase === 'lights') {
    const left = TUNING.lights - s.t, before = left + dt;
    // a light at 2.4, 1.6 and 0.8 seconds left, GO at 0
    for (const n of [3, 2, 1] as const) { const at = (n * TUNING.lights) / 3; if (before >= at && left < at) s.events.push({ t: 'light', n }); }
    if (left <= 0) { s.phase = 'run'; s.events.push({ t: 'go' }); }
    return;
  }
  if (s.phase === 'run') {
    s.runSteps++;
    if (input.pedal) s.held++;
    if (input.pedal !== s.lastPedal) { s.lastPedal = input.pedal; s.events.push({ t: 'pedal', on: input.pedal }); }
    if (input.pedal) s.v += S.accel * (1 - s.v / S.top) * dt;
    else {
      const crawl = S.top * TUNING.crawl;
      if (s.v < crawl) s.v = Math.min(crawl, s.v + S.accel * .5 * dt);
      else s.v = Math.max(crawl, s.v - TUNING.coast * dt);
    }
    s.x += s.v * dt;
    s.y = groundAt(S, s.x);
    s.pitch = s.x > -kickerLen(S) ? S.angle : 0;
    if (s.x >= 0) {
      // off the lip
      s.lipSpeed = s.v;
      s.vx = s.v * Math.cos(rad(S.angle)); s.vy = s.v * Math.sin(rad(S.angle));
      s.x = 0; s.y = S.lip; s.pitch = S.angle; s.phase = 'air'; s.airT = 0;
      s.events.push({ t: 'lip', speed: s.v });
    }
    if (s.t > TUNING.maxS) { s.x = 0; s.v = Math.max(s.v, 1); }
    return;
  }
  if (s.phase === 'air') {
    s.airT += dt;
    if (input.boost && S.boost > 0 && !s.boosted) { s.boosted = true; s.boostAt = s.airT; s.vx += S.boost; s.events.push({ t: 'boost' }); }
    const push = windOf(S) + helpWind(S, s.vx);
    const x0 = s.x, y0 = s.y;
    s.x += (s.vx + push) * dt;
    s.vy -= G * dt;
    s.y += s.vy * dt;
    // the nose drops by itself; his finger lifts or dips it
    s.pitch += (input.tilt * S.tilt - TUNING.droop) * dt;
    s.pitch = Math.max(-80, Math.min(80, s.pitch));
    if (s.y <= 0) {
      // where exactly the wheels touched, between the last two steps
      s.x = x0 + (s.x - x0) * (y0 / Math.max(1e-9, y0 - s.y));
      s.y = 0;
      s.feet = Math.max(0, Math.round(s.x));
      const p = s.pitch, clean = Math.abs(p) <= S.window, how = clean ? 'clean' : p < 0 ? 'nose' : 'tail';
      const onRow = S.row > 0 && s.x < S.row;
      s.landed = { clean, how, onRow, x: s.x };
      s.phase = 'land'; s.settleT = 0;
      s.v = Math.hypot(s.vx + push, 0) * .55;
      s.events.push({ t: 'land', clean, how, onRow });
    }
    if (s.t > TUNING.maxS) { s.y = 0; }
    return;
  }
  if (s.phase === 'land') {
    s.settleT += dt;
    // back onto its wheels, then it rolls to a stop
    s.pitch *= Math.pow(.02, dt / .6);
    s.v = Math.max(0, s.v - 30 * dt);
    s.x += s.v * dt;
    if (s.settleT >= TUNING.settle) {
      s.pitch = 0; s.phase = 'done';
      s.events.push({ t: 'stop', feet: s.feet, cleared: s.setup.row > 0 && s.feet >= s.setup.row });
    }
  }
}
/** The mercy wind: a share of his speed through the air for each try he has fallen short of the same row. */
export const helpWind = (S: Pick<Setup, 'help'>, vx: number) => Math.min(TUNING.helpMost, S.help) * TUNING.helpPer * vx;
/** The wind he feels: the Show's, except that once he has fallen short the head wind drops (the wind turns his way). */
export const windOf = (S: Pick<Setup, 'help' | 'wind'>) => (S.help > 0 ? Math.max(0, S.wind) : S.wind);
/** Did it clear the row? */
export const cleared = (s: Sim) => s.phase === 'done' && s.setup.row > 0 && s.feet >= s.setup.row;

// ---------- the scripted children ----------

export type Child = 'nothing' | 'clumsy' | 'skilled';
/** What a scripted child does this step. The skilled child holds the pedal all the way, boosts at once and levels the truck for the
 *  landing; the clumsy child lets go of the pedal for a stretch in the middle, boosts late and tilts the wrong way for a while; the child
 *  who does nothing touches nothing. */
export function inputFor(s: Sim, child: Child): Input {
  if (child === 'nothing') return NO_INPUT;
  const S = s.setup;
  if (s.phase === 'run') {
    const along = (s.x - startX(S)) / (S.runUp + kickerLen(S));
    return { pedal: child === 'skilled' || along < .4 || along > .7, tilt: 0, boost: false };
  }
  if (s.phase === 'air') {
    const boost = child === 'skilled' ? s.airT > .05 : s.airT > .7;
    // when will it land, roughly, and where will the nose be by then?
    const tLand = (s.vy + Math.sqrt(Math.max(0, s.vy * s.vy + 2 * G * s.y))) / G;
    const want = s.pitch - TUNING.droop * tLand;
    let tilt: -1 | 0 | 1 = 0;
    if (child === 'skilled') tilt = want < -2 ? 1 : want > 2 ? -1 : 0;
    else tilt = s.airT < .5 ? -1 : 0; // dips the nose early, then lets go
    return { pedal: false, tilt, boost };
  }
  return NO_INPUT;
}
/** Runs a whole jump with a scripted child. */
export function jumpWith(setup: Setup, child: Child): Sim {
  const s = createSim(setup);
  while (s.phase !== 'done' && s.t < TUNING.maxS + 10) stepSim(s, inputFor(s, child));
  return s;
}

// ---------- recording a jump, to watch it again ----------

/** His inputs as runs: each entry is [step, pedal, tilt, boost] whenever any of them changed. */
export type Tape = readonly (readonly [number, 0 | 1, -1 | 0 | 1, 0 | 1])[];
export function recorder() {
  const runs: [number, 0 | 1, -1 | 0 | 1, 0 | 1][] = [];
  let last = '';
  return {
    note(step: number, i: Input) {
      const key = `${+i.pedal}${i.tilt}${+i.boost}`;
      if (key !== last) { last = key; runs.push([step, i.pedal ? 1 : 0, i.tilt, i.boost ? 1 : 0]); }
    },
    tape: (): Tape => runs.map(r => [...r] as const),
  };
}
/** The input a tape gives at a step. */
export function fromTape(tape: Tape, step: number): Input {
  let cur: Input = NO_INPUT;
  for (const [at, p, t, b] of tape) { if (at > step) break; cur = { pedal: p === 1, tilt: t, boost: b === 1 }; }
  return cur;
}
/** Replays a tape to its end. */
export function replay(setup: Setup, tape: Tape): Sim {
  const s = createSim(setup);
  while (s.phase !== 'done' && s.t < TUNING.maxS + 10) stepSim(s, fromTape(tape, s.steps + 1));
  return s;
}
export { deg };
