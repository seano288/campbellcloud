// Where everything in a question's scene is at time t, from the one motion model. The canvas (art/scene.ts) only draws what this says,
// and scenes.test.ts plays each scene to its end and checks that what happens is the question's answer.
//
// A scene has lanes: the carts in a race, the grounds side by side, the things a magnet is tried on. Each lane keeps its own clock, so the
// whole scene can play at once (after he answers), or one lane at a time when he taps it (the second miss's hands-on lesson).
import { coastAt, coastDistance, coastTime, headOn, magnetPulls, MAGNET_REACH, offWall, polesPull, pushStarts, sidePush, speedAfterPush, stoppingDistance, G, type Vec } from '../physics/motion';
import { hillRun, hillTrack } from './hills';
import { pointAt } from '../physics/motion';
import { CART_FLOOR, DIR_VEC, EMPTY_CART, GROUND_PUSH, LOAD_PUSH, START_HOLD, START_PUSH, STOP_FORCE, STOP_SPEED, THROUGH_D, type Scene } from './problems';
import { groundOf, thingOf, ACTIONS } from './tables';

export function lanesOf(sc: Scene): number {
  switch (sc.type) {
    case 'pushes': case 'hills': case 'loads': case 'grounds': return sc.lanes.length;
    case 'magnet': return sc.things.length;
    default: return 1;
  }
}

/** How long lane i takes to play out, in seconds. */
export function laneDuration(sc: Scene, i: number): number {
  switch (sc.type) {
    case 'act': return ACT_T;
    case 'way': return WAY_PUSH_T + coastTime(WAY_SPEED, CART_FLOOR) * (sc.by === 'push' ? 1 : 0) + (sc.by === 'pull' ? WAY_PULL_T : 0);
    case 'pushes': return PUSH_T + coastTime(speedAfterPush(sc.lanes[i]!.impulse, EMPTY_CART), CART_FLOOR);
    case 'hills': return Math.min(HILL_MAX_T, hillRun(sc.lanes[i]!).frames.length / 60);
    case 'loads': {
      const m = sc.lanes[i]!.mass;
      if (sc.mode === 'far') return PUSH_T + coastTime(speedAfterPush(LOAD_PUSH, m), CART_FLOOR);
      if (sc.mode === 'start') return START_T + (pushStarts(START_PUSH, m, START_HOLD) ? coastTime(startSpeed(m), CART_FLOOR) : 0.6);
      return STOP_LINE / STOP_SPEED + STOP_SPEED / (STOP_FORCE / m) + 0.3;
    }
    case 'grounds': return PUSH_T + coastTime(GROUND_PUSH, groundOf(sc.lanes[i]!.ground).resistance);
    case 'bump': return BUMP_T;
    case 'magnet': return MAG_T;
    case 'poles': return MAG_T;
    case 'near': return MAG_T;
    case 'through': return MAG_T;
  }
}
export const sceneDuration = (sc: Scene) => Math.max(...Array.from({ length: lanesOf(sc) }, (_, i) => laneDuration(sc, i)));

// ---------- Push or Pull ----------

export const ACT_T = 2.2;
/** The thing in an everyday action: how far it has gone (0 to 1) from where it starts, toward or away from the person. */
export function actAt(t: number): number {
  // the hand moves it for the first 0.6 s, then it coasts on (a push) or stops with the hand (a pull)
  const k = Math.max(0, Math.min(1, t / 0.6));
  return Math.min(1, k * 0.45 + (t > 0.6 ? coastAt(1.4, 0.05, t - 0.6) / coastDistance(1.4, 0.05) * 0.55 : 0));
}
export const actIs = (act: string) => ACTIONS.find(a => a.id === act)!.is;

export const WAY_PUSH_T = 0.5, WAY_PULL_T = 1.6, WAY_SPEED = 1.6;
/** How far (m) the box has moved along its way. */
export function wayAt(sc: Extract<Scene, { type: 'way' }>, t: number): number {
  if (sc.by === 'pull') return Math.min(1.6, Math.max(0, t) * 1.0); // the rope pulls it steadily, then stops
  const push = Math.min(t, WAY_PUSH_T) * WAY_SPEED / 2;
  return t <= WAY_PUSH_T ? push : push + coastAt(WAY_SPEED, CART_FLOOR, t - WAY_PUSH_T);
}
export const wayVec = (sc: Extract<Scene, { type: 'way' }>): Vec => DIR_VEC[sc.dir];

// ---------- carts on flat ground ----------

/** The hand's push lasts this long before the cart is on its own. */
export const PUSH_T = 0.35;
function pushedX(v: number, t: number): number {
  if (t <= 0) return 0;
  if (t < PUSH_T) return (v / 2) * (t * t) / PUSH_T; // speeding up under the hand
  return (v * PUSH_T) / 2 + coastAt(v, CART_FLOOR, t - PUSH_T);
}
export const pushesX = (impulse: number, t: number) => pushedX(speedAfterPush(impulse, EMPTY_CART), t);
/** The starting push is a steady push for this long. A cart gets going only if the push is more than the ground's hold on it, and then
 *  speeds up by what's left over (push − hold) ÷ mass. */
export const START_T = 1;
const startAccel = (m: number) => Math.max(0, (START_PUSH - START_HOLD * m * G) / m);
export const startSpeed = (m: number) => startAccel(m) * START_T;
export const STOP_LINE = 1.2;
/** Where a loaded cart is (m), and whether it is moving. */
export function loadsX(mode: 'far' | 'start' | 'stop', m: number, t: number): number {
  if (mode === 'far') return pushedX(speedAfterPush(LOAD_PUSH, m), t);
  if (mode === 'start') {
    if (!pushStarts(START_PUSH, m, START_HOLD) || t <= 0) return 0;
    const a = startAccel(m), tp = Math.min(t, START_T);
    return a * tp * tp / 2 + (t > START_T ? coastAt(startSpeed(m), CART_FLOOR, t - START_T) : 0);
  }
  // rolling in at the same speed; from the line a hand pushes back on it
  const reach = STOP_LINE / STOP_SPEED;
  if (t <= reach) return t * STOP_SPEED;
  const a = STOP_FORCE / m, dt = Math.min(t - reach, STOP_SPEED / a);
  return STOP_LINE + STOP_SPEED * dt - a * dt * dt / 2;
}
/** Where a loaded cart ends up (m). */
export const loadsEnd = (mode: 'far' | 'start' | 'stop', m: number) =>
  mode === 'far' ? pushedX(speedAfterPush(LOAD_PUSH, m), 99) : mode === 'start' ? loadsX('start', m, 99) : STOP_LINE + stoppingDistance(m, STOP_SPEED, STOP_FORCE);
export const groundsX = (ground: string, t: number) => {
  const r = groundOf(ground as never).resistance;
  if (t <= 0) return 0;
  return t < PUSH_T ? (GROUND_PUSH / 2) * (t * t) / PUSH_T : (GROUND_PUSH * PUSH_T) / 2 + coastAt(GROUND_PUSH, r, t - PUSH_T);
};

// ---------- hills ----------

export const HILL_MAX_T = 7;
export function hillAt(lane: { start: number; hill?: number }, t: number) {
  const run = hillRun(lane), f = run.frames[Math.max(0, Math.min(run.frames.length - 1, Math.round(t * 60)))]!;
  const p = pointAt(hillTrack(lane).profile, f.s);
  return { x: p.x, y: p.y, angle: p.angle, v: f.v };
}

// ---------- Bump, from above ----------

export const BUMP_T = 3.2, BALL_R = 0.04, TABLE_RUB = 0.03;
/** The table is 1.6 m by 1 m, the middle at (0.8, 0.5). */
export const TABLE = { w: 1.6, h: 1 };
export interface BumpState { a: Vec; b: Vec | null; hit: boolean; after: Vec }
/** Speed of the rolling ball in a Bump scene (m/s): slow enough to watch. */
const BUMP_SPEED = 0.5;
export function bumpAt(sc: Extract<Scene, { type: 'bump' }>, t: number): BumpState {
  const dir = norm(sc.v), v = scaled(dir, BUMP_SPEED);
  const centre = { x: TABLE.w / 2, y: TABLE.h / 2 };
  if (sc.mode === 'ball') {
    // the still ball in the middle; the rolling one meets it after 1 s
    const start = { x: centre.x - v.x * 1 - dir.x * 2 * BALL_R, y: centre.y };
    if (t < 1) return { a: { x: start.x + v.x * t, y: start.y }, b: centre, hit: false, after: v };
    const out = headOn(v), dt = t - 1, go = travel(out.struck, dt);
    return { a: { x: start.x + v.x, y: start.y }, b: { x: centre.x + go.x, y: centre.y + go.y }, hit: true, after: out.struck };
  }
  if (sc.mode === 'wall') {
    const wallX = TABLE.w - 0.12, hitAt = { x: wallX - BALL_R, y: centre.y }, start = { x: hitAt.x - v.x * 1.2, y: hitAt.y - v.y * 1.2 };
    if (t < 1.2) return { a: { x: start.x + v.x * t, y: start.y + v.y * t }, b: null, hit: false, after: v };
    const after = offWall(v, sc.wall!), go = travel(after, t - 1.2);
    return { a: { x: hitAt.x + go.x, y: hitAt.y + go.y }, b: null, hit: true, after };
  }
  // a push from the side when it reaches the middle
  const start = { x: centre.x - v.x * 1.1, y: centre.y };
  if (t < 1.1) return { a: { x: start.x + v.x * t, y: start.y }, b: null, hit: false, after: v };
  const after = sidePush(v, scaled(norm(sc.push!), BUMP_SPEED), 1), go = travel(after, t - 1.1);
  return { a: { x: centre.x + go.x, y: centre.y + go.y }, b: null, hit: true, after };
}
function travel(v: Vec, dt: number): Vec { const s = Math.hypot(v.x, v.y); if (!s) return { x: 0, y: 0 }; const d = coastAt(s, TABLE_RUB, dt); return { x: v.x / s * d, y: v.y / s * d }; }
const norm = (v: Vec): Vec => { const s = Math.hypot(v.x, v.y) || 1; return { x: v.x / s, y: v.y / s }; };
const scaled = (v: Vec, k: number): Vec => ({ x: v.x * k, y: v.y * k });

// ---------- Magnets ----------

export const MAG_T = 2.6;
/** A magnet slides toward a thing; a thing it pulls jumps to it. Distances in metres from the magnet's face. */
export interface MagnetState { magnet: number; thing: number; jumped: boolean }
/** One magnet tried on one thing: it slides in to half its reach; an iron or steel thing jumps to it. */
export function magnetTry(magnetic: boolean, t: number): MagnetState {
  const startGap = MAGNET_REACH * 2.5, endGap = MAGNET_REACH * 0.5, slide = Math.min(1, Math.max(0, t / 1.2));
  const magnet = (startGap - endGap) * (slide * slide * (3 - 2 * slide));
  const gap = startGap - magnet;
  if (!magnetPulls(magnetic, gap)) return { magnet, thing: startGap, jumped: false };
  // it jumps the rest of the way, quicker as it gets nearer
  const since = t - 1.2 * crossing(), k = Math.min(1, Math.max(0, since / 0.25));
  return { magnet, thing: startGap - (startGap - magnet) * k * k, jumped: k >= 1 };
}
/** When (a share of the slide) the magnet first comes within reach. */
const crossing = () => { const startGap = MAGNET_REACH * 2.5; const want = (startGap - MAGNET_REACH) / (startGap - MAGNET_REACH * 0.5); let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (m * m * (3 - 2 * m) < want) lo = m; else hi = m; } return lo; };
export const magnetThing = (id: string) => thingOf(id as never);

/** Two magnets on a table, ends facing: they slide together or apart. Gap (m) between their ends. */
export function polesGap(ends: readonly ['N' | 'S', 'N' | 'S'], t: number): number {
  const g0 = MAGNET_REACH * 0.8, k = Math.min(1, Math.max(0, (t - 0.5) / 0.8));
  return polesPull(ends[0], ends[1]) ? g0 * (1 - k * k) : g0 + MAGNET_REACH * 1.5 * (1 - (1 - k) * (1 - k));
}
/** Near and far clips: each clip's distance from the magnet at t (the near one jumps; the far one is out of reach). */
export function nearAt(d: number, t: number): number {
  if (!magnetPulls(true, d)) return d;
  const k = Math.min(1, Math.max(0, (t - 0.6) / 0.35));
  return d * (1 - k * k);
}
/** Through a sheet: the magnet slides up to the sheet; an iron or steel thing behind it jumps to the sheet. */
export function throughAt(magnetic: boolean, t: number): { magnet: number; thing: number } {
  const slide = Math.min(1, Math.max(0, t / 1)), m = slide * slide * (3 - 2 * slide);
  if (!magnetPulls(magnetic, THROUGH_D) || t < 1.1) return { magnet: m, thing: 0 };
  const k = Math.min(1, (t - 1.1) / 0.3);
  return { magnet: m, thing: k * k };
}
