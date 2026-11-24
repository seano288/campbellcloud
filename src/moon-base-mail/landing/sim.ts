// The Landing, as numbers: the supply ship comes down over the Moon's hills to the pad. He holds the engine to slow the fall (or rise),
// and a held finger slides the ship toward it, left or right. Low gravity makes it slow and floaty.
//
// It cannot be failed. Touching down hard only bounces the ship on its legs. Landing off the pad, it waits a moment and then hops across
// toward the pad by itself, hop after hop, until it is on it. It has all the fuel it needs, and nothing can break. A child who does
// nothing at all still lands: the ship drifts down, then hops to the pad (sim.test.ts plays thousands of Landings that way).
//
// Fixed steps of STEP seconds, so it plays the same at any frame rate. Units are metres, more or less: x along, y up.
import type { LanderSpec } from '../base/catalog';
import { groundAt, landingLength, type LandingPlan } from '../base/gen';

export const STEP = 1 / 60;
/** The Moon's pull, slowed down to suit a six-year-old's hands. */
export const GRAVITY = 6;
/** The fastest it falls with the engine off: floaty, never a plunge. */
export const MAX_FALL = 26;
/** Below this it settles on its legs; above it, it bounces. */
export const SETTLE_SPEED = 5;
/** How long it rests off the pad before it hops on. */
export const HOP_WAIT = 0.7;
export const HOP_UP = 9;
/** The legs: how far below its middle the ship stands. */
export const LEGS = 6;
/** How high it may go above the starting height (a ceiling, so he can't fly away from the pad for ever). */
export const CEILING = 60;
/** After this long it is guided to the pad whatever he does, so a Landing always ends. */
export const GUIDE_AFTER = 45;

export interface Input { engine: boolean; /** Where his finger wants the ship to go (world x), or null. */ to: number | null }
export type SimEvent =
  | { t: 'touch'; speed: number; onPad: boolean }
  | { t: 'bounce'; speed: number }
  | { t: 'hop' }
  | { t: 'padTouch'; speed: number }
  | { t: 'landed'; soft: number; close: number }
  | { t: 'idle' };

export interface Sim {
  plan: LandingPlan;
  spec: LanderSpec;
  x: number; y: number; vx: number; vy: number;
  t: number;
  /** On the ground and still, and for how long. */
  resting: number;
  onGround: boolean;
  engine: boolean;
  /** How fast it first touched the pad, and whether it has come to rest on it. */
  firstPadTouch: number | null;
  done: boolean;
  result: { soft: number; close: number } | null;
  idleFor: number;
  events: SimEvent[];
}

export function createSim(plan: LandingPlan, spec: LanderSpec): Sim {
  return {
    plan, spec, x: plan.startX, y: plan.startY, vx: 0, vy: 0, t: 0, resting: 0, onGround: false, engine: false,
    firstPadTouch: null, done: false, result: null, idleFor: 0, events: [],
  };
}

export const padTop = (s: Pick<Sim, 'plan'>) => groundAt(s.plan, s.plan.padX);
export const onPad = (s: Pick<Sim, 'plan' | 'x'>) => Math.abs(s.x - s.plan.padX) <= s.plan.padW / 2;
const floorAt = (s: Sim, x: number) => groundAt(s.plan, x) + LEGS;

export function step(s: Sim, input: Input) {
  if (s.done) return;
  s.t += STEP;
  const guided = s.t > GUIDE_AFTER;
  const engine = input.engine && !guided;
  s.engine = engine;
  if (!input.engine && input.to === null) s.idleFor += STEP; else s.idleFor = 0;
  if (s.idleFor > 12) { s.idleFor = 0; s.events.push({ t: 'idle' }); }

  // sliding: toward his finger at the lander's speed, else easing to a stop (in the air), or held (on the ground)
  const target = guided ? s.plan.padX : input.to;
  if (target !== null && (!s.onGround || engine)) {
    const want = Math.max(-s.spec.slide, Math.min(s.spec.slide, (target - s.x) * 1.6));
    s.vx += Math.max(-40 * STEP, Math.min(40 * STEP, want - s.vx));
  } else if (!s.onGround) s.vx *= 1 - 0.6 * STEP;

  // up and down
  if (engine) s.vy += (s.spec.thrust - GRAVITY) * STEP;
  else s.vy -= GRAVITY * STEP;
  if (guided && !s.onGround) s.vy = Math.max(s.vy, -8);
  s.vy = Math.max(-MAX_FALL, Math.min(40, s.vy));
  if (s.onGround && !engine && s.vy <= 0) { s.vy = 0; s.vx = 0; }

  s.x = Math.max(10, Math.min(landingLength(s.plan) - 10, s.x + s.vx * STEP));
  s.y = Math.min(s.plan.startY + CEILING, s.y + s.vy * STEP);
  if (s.y >= s.plan.startY + CEILING && s.vy > 0) s.vy = 0;

  const floor = floorAt(s, s.x);
  // going up a slope faster than it rises: it rides up the ground, still in the air
  if (s.y <= floor && s.vy > 0) s.y = floor;
  else if (s.y <= floor) {
    s.y = floor;
    const speed = -s.vy, pad = onPad(s);
    if (!s.onGround && speed > 0.5) {
      s.events.push({ t: 'touch', speed, onPad: pad });
      if (pad && s.firstPadTouch === null) { s.firstPadTouch = speed; s.events.push({ t: 'padTouch', speed }); }
    }
    if (speed > SETTLE_SPEED) {
      // a hard landing only bounces it on its legs
      s.vy = speed * s.spec.bounce;
      s.vx *= 0.5;
      s.onGround = false;
      s.events.push({ t: 'bounce', speed });
    } else {
      s.vy = 0;
      s.vx = 0;
      s.onGround = true;
    }
  } else if (s.y > floor + 0.5) s.onGround = false;

  if (s.onGround) {
    s.resting += STEP;
    if (onPad(s)) {
      if (s.resting > 0.6) {
        if (s.firstPadTouch === null) s.firstPadTouch = 0;
        s.done = true;
        s.result = { soft: Math.round(s.firstPadTouch * 10) / 10, close: Math.round(Math.abs(s.x - s.plan.padX) * 10) / 10 };
        s.events.push({ t: 'landed', ...s.result });
      }
    } else if (s.resting > HOP_WAIT && !engine) {
      // off the pad: it hops across toward it by itself
      // high enough to clear whatever is in the way, and as far as a hop of that height carries it (it lands short and hops again)
      const dx = s.plan.padX - s.x, dir = Math.sign(dx), reach = Math.min(Math.abs(dx), 170 * s.spec.hop);
      let top = s.y;
      for (let d = 0; d <= reach + 20; d += 5) top = Math.max(top, floorAt(s, s.x + dir * d) + 4);
      const vy = Math.max(HOP_UP * Math.max(1, s.spec.hop * 0.9), Math.sqrt(2 * GRAVITY * (top - s.y + 2)));
      const air = vy / GRAVITY + Math.sqrt(Math.max(0, 2 * (top - s.y)) / GRAVITY) + 0.2;
      s.vy = vy;
      s.vx = dir * Math.min(reach / air, 60 * s.spec.hop);
      s.onGround = false;
      s.resting = 0;
      s.events.push({ t: 'hop' });
    }
  } else s.resting = 0;
}

export function takeEvents(s: Sim): SimEvent[] { const e = s.events; s.events = []; return e; }

/** The words for how soft it was, and how close (said and shown at the end). */
export const softWord = (speed: number) => (speed <= 3 ? 'Soft as a feather!' : speed <= 8 ? 'Nice and soft!' : speed <= 15 ? 'Bump!' : 'Big bounce!');
export const closeWord = (d: number) => (d <= 2 ? 'Right in the middle!' : d <= 10 ? 'Close to the middle!' : 'On the pad!');
