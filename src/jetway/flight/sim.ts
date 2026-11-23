// The Flight, as numbers only: no drawing, no sound, so the tests can fly thousands of them. About a minute, in five parts:
//
// 1. Taxi, from above. He leads the plane from its gate with a held finger (it heads for the finger, as Math Bots' robot does). Paved
//    ground is quick and grass slow; it never stops. With no finger it rolls along the taxiway by itself, and after a while a follow-me
//    car leads it whatever he does, so he can't get stuck.
// 2. The take-off roll, from the side. Holding the throttle speeds it up; letting go only speeds it up more slowly. It lifts when it's
//    fast enough. (The helicopter lifts straight up instead.)
// 3. The cruise. A held finger sets how high it flies; stars (or crates) to pick up among the clouds; gusts only wobble it.
// 4. The approach: a line of lights down to the far runway. With no finger the plane drifts onto the line itself. Too high at the
//    runway goes round once, and the second approach lands itself.
// 5. The landing roll, to a stop.
//
// It cannot be failed: nothing collides, the ground can't be hit, and every input (or none) reaches the end. sim.test.ts and
// charter.test.ts fly it with a child who does nothing, a clumsy one and a careful one.
import { CRUISE_ALT, SKY_HIGH, SKY_LOW, type Destination } from '../airport/routes';
import { HOLD_POINT, paved, taxiPath, type Rect } from '../airport/plot';
import type { Ability } from '../airport/catalog';

export const STEP = 1 / 60;
export type Phase = 'taxi' | 'roll' | 'climb' | 'cruise' | 'approach' | 'goaround' | 'rollout' | 'done';

/** Taxi speeds on the plot, a second. */
export const TAXI_PAVED = 150, TAXI_GRASS = 60, TAXI_AUTO = 110;
/** After this long taxiing, the follow-me car leads him to the runway. */
export const FOLLOW_ME_S = 16;
/** The take-off roll: how fast it speeds up with the throttle held and without, and when it lifts. */
export const ACCEL_HELD = 75, ACCEL_IDLE = 20, LIFT_SPEED = 150;
export const CRUISE_SPEED = 260;
export const APPROACH_LEN = 2400, APPROACH_SPEED = 190, APPROACH_TOP = 330;
/** Too high over the runway goes round. */
export const TOO_HIGH = 70;
export const PICK_RADIUS = 46;
/** A Flight never runs past this; long before it, the plane is flying itself. */
export const MAX_S = 150;

export interface FlightSetup {
  readonly dest: Destination;
  readonly ability: Ability;
  /** The plane's cruise speed, 1 the turboprop's. */
  readonly speed: number;
  /** Where the taxi starts (plot units), and which ground is paved. Null: no taxi (the helicopter lifts from its pad). */
  readonly taxi: { readonly from: { x: number; y: number }; readonly owned: (id: string) => boolean } | null;
  /** His own runway, in Flight units: longer is a longer roll before the trees. */
  readonly runway: number;
  /** The approach lights start further out (Approach Lights). */
  readonly approachLights: boolean;
  /** The radar shows the stars ahead (drawn only; the sim doesn't need it). */
  readonly radar?: boolean;
}

export interface Input {
  /** Taxi: where the finger is on the plot, or null. */
  readonly taxiTo?: { x: number; y: number } | null;
  /** Air: the height the finger asks for, or null with no finger. */
  readonly alt?: number | null;
  readonly throttle?: boolean;
  /** The water bomber's drop. */
  readonly drop?: boolean;
}

export type FlightEvent =
  | { t: 'lineup' } | { t: 'lift' } | { t: 'cruise' } | { t: 'star'; i: number } | { t: 'fire'; i: number } | { t: 'approach' }
  | { t: 'light'; i: number } | { t: 'goaround' } | { t: 'autoland' } | { t: 'touchdown'; grade: 1 | 2 | 3 } | { t: 'done' } | { t: 'followme' } | { t: 'grass' } | { t: 'gust' } | { t: 'boom' };

export interface Flight {
  readonly setup: FlightSetup;
  phase: Phase;
  t: number;
  /** Seconds in this phase. */
  pt: number;
  // the taxi, on the plot
  tx: number; ty: number; heading: number; onGrass: boolean; followMe: boolean; pathAt: number;
  // the air, from the side: x from the start of his runway, alt above the ground
  x: number; alt: number; vx: number; valt: number;
  /** Where the far runway's threshold is, and the start of the approach. */
  readonly cruiseEnd: number; readonly threshold: number;
  stars: boolean[];
  fires: boolean[];
  lights: boolean[];
  /** The lights on the approach, x and the height on the line. */
  readonly lightAt: readonly { x: number; alt: number }[];
  goArounds: number;
  autoland: boolean;
  grade: 0 | 1 | 2 | 3;
  gust: number;
  events: FlightEvent[];
}

/** The line of lights: from the top of the approach down to the far runway's threshold. */
export const glideAlt = (f: Pick<Flight, 'threshold'>, x: number) => Math.max(0, Math.min(APPROACH_TOP, (f.threshold - x) * (APPROACH_TOP / APPROACH_LEN)));

export function createFlight(setup: FlightSetup): Flight {
  const cruiseEnd = setup.runway + 600 + setup.dest.distance, threshold = cruiseEnd + APPROACH_LEN;
  const n = setup.approachLights ? 12 : 8, first = setup.approachLights ? threshold - APPROACH_LEN * .95 : threshold - APPROACH_LEN * .62;
  const lightAt = Array.from({ length: n }, (_, i) => { const x = first + ((threshold - 60 - first) * i) / (n - 1); return { x, alt: glideAlt({ threshold }, x) }; });
  const start = setup.taxi?.from ?? HOLD_POINT;
  return {
    setup, phase: setup.taxi ? 'taxi' : 'roll', t: 0, pt: 0,
    tx: start.x, ty: start.y, heading: Math.PI / 2, onGrass: false, followMe: false, pathAt: 1,
    x: 0, alt: 0, vx: 0, valt: 0, cruiseEnd, threshold,
    stars: setup.dest.stars.map(() => false), fires: setup.dest.fires.map(() => false), lights: lightAt.map(() => false), lightAt,
    goArounds: 0, autoland: false, grade: 0, gust: 0, events: [],
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toward = (v: number, target: number, rate: number) => (v < target ? Math.min(target, v + rate) : Math.max(target, v - rate));
const go = (f: Flight, phase: Phase) => { f.phase = phase; f.pt = 0; };

function stepTaxi(f: Flight, input: Input, dt: number) {
  const taxi = f.setup.taxi!, path = taxiPath(taxi.from);
  if (!f.followMe && f.pt > FOLLOW_ME_S) { f.followMe = true; f.events.push({ t: 'followme' }); }
  // the next point on the path he hasn't passed: the autopilot, and the follow-me car, head for it
  while (f.pathAt < path.length - 1 && Math.hypot(path[f.pathAt]!.x - f.tx, path[f.pathAt]!.y - f.ty) < 14) f.pathAt++;
  const finger = f.followMe ? null : input.taxiTo ?? null;
  const goal = finger ?? path[f.pathAt]!;
  const dx = goal.x - f.tx, dy = goal.y - f.ty, d = Math.hypot(dx, dy);
  const grass = !paved(taxi.owned, f.tx, f.ty);
  if (grass && !f.onGrass) f.events.push({ t: 'grass' });
  f.onGrass = grass;
  const speed = grass ? TAXI_GRASS : finger ? TAXI_PAVED : f.followMe ? TAXI_PAVED : TAXI_AUTO;
  if (d > 6) {
    const want = Math.atan2(dy, dx);
    let turn = want - f.heading;
    while (turn > Math.PI) turn -= 2 * Math.PI;
    while (turn < -Math.PI) turn += 2 * Math.PI;
    f.heading += clamp(turn, -4 * dt, 4 * dt);
    const ahead = Math.max(.25, Math.cos(turn)); // it slows to turn, so a finger behind it turns it round rather than reversing
    const step = Math.min(d, speed * ahead * dt);
    f.tx += Math.cos(f.heading) * step; f.ty += Math.sin(f.heading) * step;
  }
  // a finger off the plot only takes it to the edge
  f.tx = clamp(f.tx, 10, 1290); f.ty = clamp(f.ty, 10, 770);
  if (Math.hypot(f.tx - HOLD_POINT.x, f.ty - HOLD_POINT.y) < 40) { f.events.push({ t: 'lineup' }); go(f, 'roll'); }
}

/** Where the cruise starts, in x: the stars and fires are placed from here. */
export const cruiseStart = (f: Pick<Flight, 'cruiseEnd' | 'setup'>) => f.cruiseEnd - f.setup.dest.distance;

/** The height the plane heads for in the air: the finger's, else where it is (cruise) or the line of lights (approach). */
function airTarget(f: Flight, input: Input): number {
  if (f.phase === 'approach') {
    const line = glideAlt(f, f.x + 120);
    if (f.autoland || input.alt == null) return line;
    return clamp(input.alt, Math.max(0, line - 60), SKY_HIGH);
  }
  return input.alt == null ? clamp(f.alt, SKY_LOW, SKY_HIGH) : clamp(input.alt, SKY_LOW, SKY_HIGH);
}

export function stepFlight(f: Flight, input: Input, dt = STEP) {
  if (f.phase === 'done') return;
  f.t += dt; f.pt += dt;
  // a Flight that has run long flies itself the rest of the way
  if (f.t > MAX_S * .7 && f.phase !== 'taxi') { if (!f.autoland) { f.autoland = true; f.events.push({ t: 'autoland' }); } input = { throttle: true }; }
  const heli = f.setup.ability === 'heli';
  switch (f.phase) {
    case 'taxi':
      stepTaxi(f, input, dt);
      if (f.t > MAX_S * .5) { f.events.push({ t: 'lineup' }); go(f, 'roll'); }
      return;
    case 'roll': {
      f.vx += (input.throttle ? ACCEL_HELD : ACCEL_IDLE) * dt * (heli ? .6 : 1);
      f.x += f.vx * dt;
      if (heli) {
        // the helicopter lifts straight up, faster with the throttle held
        f.alt += (input.throttle ? 70 : 25) * dt;
        f.vx = Math.min(f.vx, 60);
        if (f.alt >= 110) { f.events.push({ t: 'lift' }); go(f, 'climb'); }
      } else if (f.vx >= LIFT_SPEED) { f.events.push({ t: 'lift' }); go(f, 'climb'); }
      return;
    }
    case 'climb':
      f.vx = toward(f.vx, CRUISE_SPEED * f.setup.speed, 120 * dt);
      f.x += f.vx * dt;
      f.alt = toward(f.alt, CRUISE_ALT, 110 * dt);
      if (f.alt >= CRUISE_ALT - 1 || f.pt > 4) { f.events.push({ t: 'cruise' }); go(f, 'cruise'); if (f.setup.ability === 'boom') f.events.push({ t: 'boom' }); }
      return;
    case 'cruise':
    case 'approach': {
      const speed = f.phase === 'approach' ? APPROACH_SPEED : CRUISE_SPEED * f.setup.speed;
      f.vx = toward(f.vx, speed, 90 * dt);
      f.x += f.vx * dt;
      const target = airTarget(f, input);
      f.valt = clamp((target - f.alt) * 2.4, -170, 170);
      // a gust only wobbles it, and never in the last bit of the approach
      const wind = f.setup.dest.wind, near = f.phase === 'approach' && f.threshold - f.x < 500;
      f.gust = near ? 0 : Math.sin(f.t * 1.3) * Math.sin(f.t * .37 + 1) * wind * 55;
      if (!near && Math.abs(f.gust) > 40 && f.events.at(-1)?.t !== 'gust' && Math.round(f.t * 60) % 120 === 0) f.events.push({ t: 'gust' });
      f.alt += (f.valt + f.gust) * dt;
      if (f.phase === 'cruise') {
        f.alt = clamp(f.alt, SKY_LOW - 20, SKY_HIGH + 20);
        const at = f.x - cruiseStart(f);
        f.setup.dest.stars.forEach((s, i) => {
          if (!f.stars[i] && Math.abs(s.x - at) < PICK_RADIUS && Math.abs(s.alt - f.alt) < PICK_RADIUS) { f.stars[i] = true; f.events.push({ t: 'star', i }); }
        });
        if (f.setup.ability === 'water' && input.drop) f.setup.dest.fires.forEach((x, i) => {
          if (!f.fires[i] && at > x - 260 && at < x + 40 && f.alt < 360) { f.fires[i] = true; f.events.push({ t: 'fire', i }); }
        });
        if (f.x >= f.cruiseEnd) { f.events.push({ t: 'approach' }); go(f, 'approach'); }
      } else {
        // never below the line by much, so he can't land short
        f.alt = clamp(f.alt, Math.max(0, glideAlt(f, f.x) - 60), SKY_HIGH);
        f.lightAt.forEach((l, i) => { if (!f.lights[i] && f.x >= l.x) { if (Math.abs(f.alt - l.alt) < 48) { f.lights[i] = true; f.events.push({ t: 'light', i }); } } });
        if (f.x >= f.threshold - 10 && f.alt <= TOO_HIGH && !f.autoland) f.autoland = true; // low enough: it's landing now
        if (f.x >= f.threshold - 10 && f.alt > TOO_HIGH && !f.autoland) {
          f.goArounds++;
          f.events.push({ t: 'goaround' });
          go(f, 'goaround');
        } else if (f.x >= f.threshold - 200 && f.alt <= 2) {
          f.alt = 0;
          const hit = f.lights.filter(Boolean).length / f.lights.length;
          f.grade = f.goArounds ? (hit >= .5 ? 2 : 1) : hit >= .7 ? 3 : hit >= .4 ? 2 : 1;
          f.events.push({ t: 'touchdown', grade: f.grade });
          go(f, 'rollout');
        } else if (f.x >= f.threshold + 300) {
          // past the threshold and still coming down: it settles onto the runway
          f.alt = Math.max(0, f.alt - 120 * dt);
        }
      }
      return;
    }
    case 'goaround':
      // up and round, then onto the line again, and this time it lands itself
      f.alt = toward(f.alt, APPROACH_TOP, 130 * dt);
      f.x += f.vx * dt;
      if (f.pt > 2.6) {
        f.x = f.threshold - APPROACH_LEN * .8; f.alt = glideAlt(f, f.x) + 40;
        f.lights = f.lights.map(() => false);
        f.autoland = true;
        f.events.push({ t: 'autoland' });
        go(f, 'approach');
      }
      return;
    case 'rollout':
      f.vx = Math.max(0, f.vx - (heli ? 400 : 110) * dt);
      f.x += f.vx * dt;
      f.alt = 0;
      if (f.vx <= 0 || f.pt > 4) { f.events.push({ t: 'done' }); go(f, 'done'); }
      return;
  }
}

export function takeEvents(f: Flight): FlightEvent[] { const e = f.events; f.events = []; return e; }
export const starsGot = (f: Pick<Flight, 'stars'>) => f.stars.filter(Boolean).length;
export const firesOut = (f: Pick<Flight, 'fires'>) => f.fires.filter(Boolean).length;

// ---------- scripted children, for the tests ----------

export type Child = (f: Flight, rng: () => number) => Input;
/** Does nothing at all. */
export const idleChild: Child = () => ({});
/** Holds a finger in odd places, lets go, holds the throttle on and off. */
export const clumsyChild: Child = (f, rng) => {
  const r = rng();
  if (f.phase === 'taxi') return { taxiTo: r < .5 ? { x: rng() * 1300, y: rng() * 780 } : null };
  return { throttle: r < .5, alt: r < .6 ? rng() * 700 - 50 : null, drop: rng() < .1 };
};
/** Leads the plane along the taxiway, holds the throttle, flies to each star, follows the lights, drops on fires. */
export const skilledChild: Child = f => {
  if (f.phase === 'taxi') { const p = taxiPath(f.setup.taxi!.from); return { taxiTo: p[Math.min(p.length - 1, f.pathAt)]! }; }
  if (f.phase === 'approach') return { alt: glideAlt(f, f.x + 120) };
  const at = f.x - cruiseStart(f), next = f.setup.dest.stars.find((s, i) => !f.stars[i] && s.x > at - 20);
  return { throttle: true, alt: next ? next.alt : CRUISE_ALT, drop: true };
};

/** Flies a whole Flight with a child, as fast as it can. Returns the Flight at its end. */
export function flyWith(setup: FlightSetup, child: Child, rng: () => number = Math.random, dt = STEP * 2): Flight {
  const f = createFlight(setup);
  while (f.phase !== 'done' && f.t < MAX_S + 5) { stepFlight(f, child(f, rng), dt); f.events.length = 0; }
  return f;
}
export type { Rect };
