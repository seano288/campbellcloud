// The Mission, as numbers only: no drawing, no sound, so the tests can fly thousands of them. About a minute, from the side:
//
// 1. The catapult. He holds the big button and a gauge fills; letting go launches. Any launch flies: a weak one dips toward the sea and
//    climbs away. If he never presses, the catapult fires by itself. (A helicopter lifts off instead, the same way.)
// 2. The job, with one finger: a held finger sets how high he flies. Rings to fly through, a whale or a ferry to follow, lost boats to
//    find from low down, storm clouds to fly into, crates to drop on islands (the Drop button, or the crate drops itself at the last
//    moment), or a raft to winch up (the aircraft hovers over it by itself; holding the finger low lowers it, and after a while it lowers
//    itself). Gusts only wobble the aircraft.
// 3. Home: the carrier has sailed to meet him. He follows the landing lights down; with no finger the aircraft drifts onto them itself.
//    Crossing the stern, how high he is above the lights picks the wire the hook catches. Too high misses every wire: he goes round and
//    tries again, and the third pass lands itself.
//
// It cannot be failed: nothing collides, the sea can't be reached, and every input (or none) reaches the end. All the tuning is in TUNING.
// sim.test.ts and ship/gen.test.ts fly it with a child who does nothing, a clumsy one and a skilled one.
import { seeded, type Rng } from '../../game/rng';
import type { Job } from '../ship/catalog';
import type { Subject } from '../ship/missions';

export const STEP = 1 / 60;

/** Every number that sets how the Mission plays and how fair the landing feels, in one place, to tune on the iPad 9. */
export const TUNING = {
  /** The flight deck's height above the sea, and one hull section's length of deck. */
  deckAlt: 60, sectionLen: 70, startLen: 360,
  /** The catapult: seconds to fill the gauge, the launch is automatic after `autoLaunch` seconds, and the run to the bow. */
  gaugeFill: 1.1, autoLaunch: 7, catapultTime: .85, launchSpeed: 300,
  /** How high he can fly, how fast the height follows his finger, and the height with no finger. */
  minAlt: 34, maxAlt: 560, cruiseAlt: 260, climbRate: 220, cruiseSpeed: 230,
  /** The job: where it starts after the bow, the space between things to do, how close counts. */
  jobLead: 700, spacing: 640, ringR: 62, lowR: 75, cloudR: 80,
  /** Lost boats are found from below this height; the whale is photographed from below this. */
  lowAlt: 230,
  /** Drops: how fast a crate falls under its parachute and how quickly it slows; an island's half-width and its bull's-eye. */
  fall: 95, drag: 1.3, islandHalf: 80, bull: 34, dropWindow: 720,
  /** Winching: how far the winch reaches, how long a lift takes, and when it lowers itself. */
  winchReach: 150, lift: 1.4, hoverSlow: 380, autoLower: 4,
  /** The way home and the landing: the lights' length and top, the speed, the wires' spacing on deck from the stern, the hook. */
  returnGap: 700, approachLen: 2300, approachTop: 330, approachSpeed: 175, firstWire: 70, wireGap: 34,
  /** How many units of height above the lights, crossing the stern, move the catch one wire along: the size of the landing zone. */
  perWire: 22,
  /** With no finger the aircraft drifts onto the lights, this much high: about one wire long. */
  drift: 14,
  /** The Angled Deck catches this far (in wires) past the last one, before he must go round. */
  angledSpare: .7,
  /** Seconds for a go-round, and for the landing roll. */
  aroundTime: 3.2, trapTime: 2.4,
  /** A Mission never runs past this; long before it the aircraft is flying itself. */
  maxS: 150,
} as const;
const T = TUNING;

export type Phase = 'deck' | 'catapult' | 'climb' | 'job' | 'return' | 'approach' | 'around' | 'trap' | 'done';

export interface MissionSetup {
  readonly job: Job;
  readonly subject: Subject;
  readonly count: number;
  readonly wind: number;
  readonly seed: number;
  /** The aircraft: speed (1 the trainer's) and whether it hovers (a helicopter lifts off; and can winch). */
  readonly speed: number;
  readonly hover: boolean;
  /** His ship: deck length in units, landing wires (2 to 4), the Angled Deck, the Ski Jump, the Weather Station. */
  readonly deckLen: number;
  readonly wires: number;
  readonly angled: boolean;
  readonly skiJump: boolean;
  readonly calm: boolean;
}

export interface Input {
  /** The height his finger asks for, or null with no finger. */
  readonly alt?: number | null;
  /** The catapult (or lift) button is held. */
  readonly hold?: boolean;
  /** The Drop button was tapped. */
  readonly drop?: boolean;
}

export interface Target { readonly x: number; readonly alt: number; readonly r: number; got: boolean; passed: boolean }
export interface Island { readonly x: number; dropped: boolean; landed: number | null; score: 0 | 1 | 2 }
export interface Crate { x: number; alt: number; vx: number; island: number }
export interface Raft { readonly x: number; rescued: boolean; quick: boolean }

export type MissionEvent =
  | { t: 'launch'; power: number; auto: boolean } | { t: 'climb' } | { t: 'job' } | { t: 'target'; i: number } | { t: 'drop'; i: number }
  | { t: 'crate'; i: number; score: 0 | 1 | 2 } | { t: 'hover'; i: number } | { t: 'lowering'; i: number } | { t: 'rescued'; i: number }
  | { t: 'return' } | { t: 'approach' } | { t: 'light'; i: number } | { t: 'bolter'; pass: number } | { t: 'auto' }
  | { t: 'trap'; wire: number; grade: 1 | 2 | 3 } | { t: 'gust' } | { t: 'done' };

export interface Sim {
  readonly setup: MissionSetup;
  phase: Phase;
  t: number;
  /** Seconds in this phase. */
  pt: number;
  x: number; alt: number; vx: number; valt: number;
  /** The gauge, 0 to 1, and the launch it gave. */
  gauge: number; power: number; held: boolean;
  /** Where his finger last asked to fly (kept when he lets go, so the aircraft holds its height). */
  aim: number;
  readonly bow: number;
  readonly targets: Target[];
  readonly islands: Island[];
  readonly crates: Crate[];
  readonly rafts: Raft[];
  /** The raft he is over now, and how long he has hovered, and how far the winch has come down (0 to 1). */
  hovering: number | null; hoverT: number; winch: number; lifting: number;
  readonly jobEnd: number;
  /** The carrier's stern when he comes home. */
  readonly stern: number;
  readonly lights: { x: number; on: boolean }[];
  pass: number;
  wire: number; grade: 0 | 1 | 2 | 3;
  /** Where the trap started and where it stops. */
  trapFrom: { x: number; alt: number } | null;
  gust: number;
  readonly rng: Rng;
  events: MissionEvent[];
}

export const wireX = (s: Pick<Sim, 'stern'>, k: number) => s.stern + T.firstWire + (k - 1) * T.wireGap;
/** The wire to aim for: the first, or the second of four. Wires past it are spare room for coming in high, so each wire he
 *  adds makes the landing zone longer, and drifting a little high still catches one. */
export const targetWire = (wires: number) => (wires >= 4 ? 2 : 1);
/** Where the lights end, crossing the stern: just above the deck. */
export const LIGHTS_END = TUNING.deckAlt + 30;
/** The landing lights' height at x. */
export const pathAlt = (s: Pick<Sim, 'stern'>, x: number) => LIGHTS_END + Math.max(0, Math.min(1, (s.stern - x) / T.approachLen)) * (T.approachTop - LIGHTS_END);
export const deckLength = (sections: number) => T.startLen + sections * T.sectionLen;

export function createSim(setup: MissionSetup): Sim {
  const rng = seeded(setup.seed), bow = setup.deckLen, start = bow + T.jobLead;
  const job = setup.job === 'winch' && !setup.hover ? 'drop' : setup.job;
  const targets: Target[] = [], islands: Island[] = [], rafts: Raft[] = [];
  for (let i = 0; i < setup.count; i++) {
    const x = start + i * T.spacing + (rng() - .5) * 120;
    if (job === 'rings') targets.push({ x, alt: 140 + rng() * 300, r: T.ringR, got: false, passed: false });
    if (job === 'follow') targets.push({ x, alt: 90 + rng() * 90, r: T.lowR, got: false, passed: false });
    if (job === 'search') targets.push({ x, alt: 70 + rng() * 100, r: T.lowR, got: false, passed: false });
    if (job === 'storm') targets.push({ x, alt: 330 + rng() * 170, r: T.cloudR, got: false, passed: false });
  }
  // drops and rescues are fewer and further apart: each one takes longer
  const few = Math.max(2, Math.min(4, Math.round(setup.count / 2)));
  if (job === 'drop') for (let i = 0; i < few; i++) islands.push({ x: start + 200 + i * T.spacing * 1.6, dropped: false, landed: null, score: 0 });
  if (job === 'winch') for (let i = 0; i < few; i++) rafts.push({ x: start + 200 + i * T.spacing * 1.5, rescued: false, quick: false });
  const last = Math.max(...targets.map(t => t.x), ...islands.map(i => i.x), ...rafts.map(r => r.x));
  const jobEnd = last + 420, stern = jobEnd + T.returnGap + T.approachLen;
  const lights = Array.from({ length: 12 }, (_, i) => ({ x: stern - T.approachLen + (i + .5) * (T.approachLen / 12), on: false }));
  const catX = Math.max(80, bow * .3);
  return {
    setup: { ...setup, job }, phase: 'deck', t: 0, pt: 0, x: catX, alt: T.deckAlt + 10, vx: 0, valt: 0, gauge: 0, power: 0, held: false, aim: T.cruiseAlt,
    bow, targets, islands, crates: [], rafts, hovering: null, hoverT: 0, winch: 0, lifting: 0, jobEnd, stern, lights, pass: 1, wire: 0, grade: 0,
    trapFrom: null, gust: 0, rng, events: [],
  };
}

const to = (s: Sim, p: Phase) => { s.phase = p; s.pt = 0; };
const clampAlt = (a: number) => Math.max(T.minAlt, Math.min(T.maxAlt, a));
const cruise = (s: Sim) => T.cruiseSpeed * s.setup.speed;
/** Height follows what is asked, no faster than climbRate. */
function steer(s: Sim, want: number, dt: number, rate: number = T.climbRate) {
  const d = want - s.alt, v = Math.max(-rate, Math.min(rate, d * 3));
  s.valt = v;
  s.alt = clampAlt(s.alt + v * dt);
}

function launch(s: Sim, power: number, auto: boolean) {
  s.power = Math.max(.3, Math.min(1, power + (s.setup.skiJump ? .2 : 0)));
  s.events.push({ t: 'launch', power: s.power, auto });
  to(s, 'catapult');
}

export function stepSim(s: Sim, input: Input = {}) {
  const dt = STEP;
  s.t += dt; s.pt += dt;
  if (input.alt !== undefined && input.alt !== null) s.aim = clampAlt(input.alt);
  // gusts wobble the aircraft a little in the air, never more (the Weather Station halves them)
  const windy = s.setup.wind * (s.setup.calm ? .5 : 1);
  if (s.phase === 'job' || s.phase === 'return') {
    if (s.rng() < windy * dt * .5) { s.gust = (s.rng() - .5) * 60 * windy; s.events.push({ t: 'gust' }); }
    s.gust *= 1 - dt * 1.5;
  } else s.gust *= 1 - dt * 4;

  switch (s.phase) {
    case 'deck': {
      if (input.hold) { s.held = true; s.gauge = Math.min(1, s.gauge + dt / T.gaugeFill); }
      else if (s.held && s.gauge > .05) { launch(s, s.gauge, false); break; }
      else s.held = false;
      if (s.pt >= T.autoLaunch && !input.hold) launch(s, Math.max(.6, s.gauge), true);
      // a long hold launches at full, so holding forever never gets stuck
      if (s.gauge >= 1 && s.pt >= T.autoLaunch + 3) launch(s, 1, false);
      break;
    }
    case 'catapult': {
      if (s.setup.hover) { // a helicopter lifts straight up, then tips forward
        s.alt += (60 + 90 * s.power) * dt;
        s.vx = Math.min(cruise(s) * .6, s.vx + 120 * dt);
        s.x += s.vx * dt;
        if (s.pt >= T.catapultTime * 1.4) { to(s, 'climb'); s.valt = 40; s.events.push({ t: 'climb' }); }
        break;
      }
      const speed = T.launchSpeed * (.7 + .3 * s.power);
      s.vx = Math.min(speed, s.vx + (speed / T.catapultTime) * dt * 1.3);
      s.x += s.vx * dt;
      if (s.x >= s.bow) { to(s, 'climb'); s.valt = (s.power - .55) * 200; s.events.push({ t: 'climb' }); }
      break;
    }
    case 'climb': {
      s.vx += (cruise(s) - s.vx) * dt;
      s.valt = Math.min(T.climbRate * .8, s.valt + 260 * dt);
      s.alt = clampAlt(s.alt + s.valt * dt);
      s.x += s.vx * dt;
      if (s.alt >= 180 || s.pt > 4) { s.aim = Math.max(s.aim, 200); to(s, 'job'); s.events.push({ t: 'job' }); }
      break;
    }
    case 'job': stepJob(s, input, dt); break;
    case 'return': {
      s.vx += (cruise(s) - s.vx) * dt;
      s.x += s.vx * dt;
      steer(s, (input.alt ?? null) !== null ? s.aim : Math.max(s.aim, T.approachTop), dt);
      s.alt = clampAlt(s.alt + s.gust * dt);
      if (s.x >= s.stern - T.approachLen) { to(s, 'approach'); s.events.push({ t: 'approach' }); }
      break;
    }
    case 'approach': {
      s.vx += (T.approachSpeed - s.vx) * dt * 1.5;
      s.x += s.vx * dt;
      const path = pathAlt(s, s.x);
      if (s.pass >= 3) s.alt = path; // the third pass lands itself
      else if (input.alt !== undefined && input.alt !== null) steer(s, input.alt, dt, 150);
      else steer(s, path + T.drift, dt, 120); // no finger: it drifts onto the lights, a little high
      // never below the deck before the stern: the ship is never hit (coming in low only catches a wire early)
      s.alt = Math.max(s.alt, T.deckAlt + 8);
      s.lights.forEach((l, i) => { if (!l.on && s.x >= l.x) { l.on = Math.abs(s.alt - pathAlt(s, l.x)) < 40; if (l.on) s.events.push({ t: 'light', i }); } });
      if (s.x >= s.stern) arrive(s);
      break;
    }
    case 'around': {
      s.x += s.vx * dt;
      s.alt = clampAlt(s.alt + 90 * dt);
      if (s.pt >= T.aroundTime) {
        s.pass++;
        s.x = s.stern - T.approachLen; s.alt = T.approachTop; s.vx = T.approachSpeed;
        s.lights.forEach(l => { l.on = false; });
        if (s.pass >= 3) s.events.push({ t: 'auto' });
        to(s, 'approach'); s.events.push({ t: 'approach' });
      }
      break;
    }
    case 'trap': {
      const from = s.trapFrom!, end = wireX(s, s.wire) + 60, k = Math.min(1, s.pt / (T.trapTime * .5));
      s.x = from.x + (end - from.x) * (1 - (1 - k) * (1 - k));
      s.alt = from.alt + (T.deckAlt + 8 - from.alt) * Math.min(1, s.pt / .35);
      s.vx = (1 - k) * T.approachSpeed;
      if (s.pt >= T.trapTime) { to(s, 'done'); s.events.push({ t: 'done' }); }
      break;
    }
    case 'done': break;
  }
  // a Mission never runs on: past the time limit it is home whatever happens
  if (s.t > T.maxS - 20 && s.phase !== 'trap' && s.phase !== 'done') { s.pass = 3; if (s.phase !== 'approach') { s.x = s.stern - 200; s.alt = pathAlt(s, s.x); to(s, 'approach'); } }
}

/** Crossing the stern: the height above the lights picks the wire. Too high misses them all, unless it's the third pass. */
function arrive(s: Sim) {
  const wires = s.setup.wires, target = targetWire(wires);
  const dev = s.alt - LIGHTS_END;
  const along = s.pass >= 3 ? target : target + dev / T.perWire;
  if (along > wires + .5 + (s.setup.angled ? T.angledSpare : 0) && s.pass < 3) {
    s.events.push({ t: 'bolter', pass: s.pass });
    s.vx = T.approachSpeed * 1.2;
    to(s, 'around');
    return;
  }
  const wire = Math.max(1, Math.min(wires, Math.round(along)));
  const grade: 1 | 2 | 3 = s.pass >= 3 ? 1 : wire === target ? 3 : Math.abs(wire - target) === 1 ? 2 : 1;
  s.wire = wire; s.grade = grade; s.trapFrom = { x: s.x, alt: s.alt };
  s.events.push({ t: 'trap', wire, grade });
  to(s, 'trap');
}

function stepJob(s: Sim, input: Input, dt: number) {
  const fingered = input.alt !== undefined && input.alt !== null;
  const job = s.setup.job;
  // winching: slow to a hover over the next raft, then lower
  const raftI = s.rafts.findIndex(r => !r.rescued);
  const raft = raftI >= 0 ? s.rafts[raftI]! : null;
  let want = cruise(s);
  if (job === 'winch' && raft) {
    const gap = raft.x - s.x;
    if (gap < T.hoverSlow) want = Math.max(50, cruise(s) * (gap / T.hoverSlow));
    if (gap < 6 && s.hovering === null) { s.hovering = raftI; s.hoverT = 0; s.x = raft.x; s.events.push({ t: 'hover', i: raftI }); }
  }
  if (s.hovering !== null) {
    const r = s.rafts[s.hovering]!;
    s.vx = 0; s.x = r.x;
    s.hoverT += dt;
    const lower = s.hoverT >= T.autoLower;
    if (lower && s.hoverT - dt < T.autoLower) s.events.push({ t: 'lowering', i: s.hovering });
    steer(s, lower ? T.winchReach * .7 : fingered ? s.aim : Math.max(s.alt, s.aim), dt, 140);
    const reach = s.alt <= T.winchReach + 10;
    s.winch = Math.min(1, Math.max(0, s.winch + (reach ? dt : -dt) * 1.6));
    if (s.winch >= 1) s.lifting += dt;
    if (s.lifting >= T.lift) {
      r.rescued = true; r.quick = s.hoverT < T.autoLower + .01;
      s.events.push({ t: 'rescued', i: s.hovering });
      s.hovering = null; s.winch = 0; s.lifting = 0; s.aim = Math.max(s.aim, 240);
    }
  } else {
    s.vx += (want - s.vx) * Math.min(1, dt * 2.5);
    const before = s.x;
    s.x += s.vx * dt;
    steer(s, s.aim, dt);
    s.alt = clampAlt(s.alt + s.gust * dt);
    for (const [i, tg] of s.targets.entries()) {
      if (tg.passed || before > tg.x || s.x < tg.x) continue;
      tg.passed = true;
      const near = job === 'search' || job === 'follow' ? s.alt <= T.lowAlt && Math.abs(s.alt - tg.alt) <= tg.r * 1.6 : Math.abs(s.alt - tg.alt) <= tg.r;
      if (near) { tg.got = true; s.events.push({ t: 'target', i }); }
    }
    // drops: tapped in the window, or the crate drops itself at the window's end, a little long
    for (const [i, is] of s.islands.entries()) {
      if (is.dropped) continue;
      const inWindow = s.x >= is.x - T.dropWindow && s.x <= is.x + 40;
      const auto = s.x >= is.x - s.vx / T.drag + 60 && s.x <= is.x + 40;
      if ((inWindow && input.drop) || auto || s.x > is.x + 40) {
        is.dropped = true;
        s.crates.push({ x: s.x, alt: s.alt - 8, vx: s.vx, island: i });
        s.events.push({ t: 'drop', i });
        break;
      }
    }
  }
  for (const c of s.crates) {
    if (c.alt <= 0) continue;
    c.vx *= 1 - Math.min(1, T.drag * dt);
    c.x += c.vx * dt;
    c.alt -= T.fall * dt;
    if (c.alt <= 0) {
      c.alt = 0;
      const is = s.islands[c.island]!, off = Math.abs(c.x - is.x);
      is.landed = c.x;
      is.score = off <= T.bull ? 2 : off <= T.islandHalf ? 1 : 0;
      s.events.push({ t: 'crate', i: c.island, score: is.score });
    }
  }
  const settled = s.crates.every(c => c.alt <= 0) && s.islands.every(i => i.dropped) && s.rafts.every(r => r.rescued);
  if (s.x >= s.jobEnd && settled && s.hovering === null) { to(s, 'return'); s.events.push({ t: 'return' }); }
}

export const takeEvents = (s: Sim) => { const e = s.events; s.events = []; return e; };

/** How the job went: what he got of what there was, and 1 to 3 stars (every finished job gets at least one). */
export function jobResult(s: Sim): { got: number; of: number; stars: 1 | 2 | 3 } {
  let got = 0, of = 0;
  if (s.targets.length) { of = s.targets.length; got = s.targets.filter(t => t.got).length; }
  else if (s.islands.length) { of = s.islands.length * 2; got = s.islands.reduce((n, i) => n + i.score, 0); }
  else if (s.rafts.length) { of = s.rafts.length; got = s.rafts.filter(r => r.quick).length; }
  const share = of ? got / of : 1;
  return { got, of, stars: share >= .99 ? 3 : share >= .5 ? 2 : 1 };
}

// ---------- the scripted children, for the tests and for the "Watch the deck" autopilot ----------

export type Child = 'nothing' | 'clumsy' | 'skilled';
const clumsy = new WeakMap<Sim, { alt: number | null; until: number; hold: boolean }>();
/** What a child does this step. `nothing` never touches; `clumsy` holds and lets go at random heights; `skilled` aims for each thing. */
export function childInput(s: Sim, child: Child, rng: Rng): Input {
  if (child === 'nothing') return {};
  if (child === 'clumsy') {
    // a finger that comes and goes every second or so, roughly where it should be, often well off
    let c = clumsy.get(s);
    if (!c || s.t >= c.until) {
      const near = s.phase === 'approach' ? pathAlt(s, s.x) : s.targets.find(t => !t.passed)?.alt ?? 250;
      c = { alt: rng() < .25 ? null : near + (rng() - .5) * 160, until: s.t + .4 + rng() * 1.2, hold: rng() < .5 };
      clumsy.set(s, c);
    }
    if (s.phase === 'deck') return { hold: c.hold };
    return { alt: c.alt, drop: rng() < .01 };
  }
  // skilled
  if (s.phase === 'deck') return { hold: s.gauge < 1 };
  if (s.phase === 'job') {
    if (s.hovering !== null) return { alt: 60 };
    const next = s.targets.find(t => !t.passed);
    if (next) return { alt: next.alt };
    const is = s.islands.find(i => !i.dropped);
    if (is) {
      // drop where the crate's slide ends on the bull's-eye
      const slide = s.vx / T.drag;
      return { alt: 200, drop: s.x >= is.x - slide - 6 };
    }
    return { alt: 240 };
  }
  if (s.phase === 'approach') return { alt: pathAlt(s, s.x + s.vx * .25) };
  return { alt: 300 };
}

/** Flies a Mission to its end with a child; returns the sim. */
export function flyWith(setup: MissionSetup, child: Child, seed = 1): Sim {
  const s = createSim(setup), rng = seeded(seed);
  while (s.phase !== 'done' && s.t < T.maxS + 5) { stepSim(s, childInput(s, child, rng)); takeEvents(s); }
  return s;
}
