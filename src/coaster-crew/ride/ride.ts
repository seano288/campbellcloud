// The Ride, as a simulation the screen draws (ride/RideScreen.tsx) and the tests drive with scripted children. The car is on rails and
// moves by the one motion model (physics/motion.ts) along the track built from his pieces (coaster/track.ts). It cannot be failed:
// - at the top of the lift the car waits for him to pull the lever (it lets itself go after a few seconds);
// - holding a finger down leans the riders in with their hands up; stars along the track are caught only with hands up, and a drop with
//   hands down only makes the riders squeal;
// - at the big drop a camera comes up: a tap takes the photo (it snaps anyway as the car goes by, just without the extra Token).
import { lengthOf, pointAt, step, type Rolling } from '../physics/motion';
import { build, START, type Built } from '../coaster/track';
import { pieceOf } from '../coaster/pieces';

export const TUNING = {
  /** Seconds the car waits at the top of the lift before it goes by itself. */
  autoLever: 5,
  /** The camera comes up this far (m) before the top of the big drop and goes this far after. */
  cameraBefore: 14, cameraAfter: 10,
  /** A star is caught within this distance (m) along the track, hands up. */
  catchR: 4,
  /** Never more than this many seconds: the car is helped along if it somehow crawls. */
  maxT: 150,
};

export type Phase = 'out' | 'lift' | 'hold' | 'run' | 'home' | 'done';
export interface Star { readonly s: number; caught: boolean; missed: boolean }
export interface RideState {
  readonly built: Built;
  car: Rolling;
  phase: Phase;
  t: number;
  held: number;
  hands: boolean;
  stars: Star[];
  /** The big drop: where the camera is, and whether the photo was tapped (or snapped by itself). */
  readonly camera: { readonly s: number } | null;
  photo: 'none' | 'tapped' | 'auto';
  /** Squeals (a drop with hands down) and cheers (hands up), for the sounds. */
  squeals: number; cheers: number;
  topSpeed: number;
  events: RideEvent[];
}
export type RideEvent = 'lever' | 'star' | 'squeal' | 'cheer' | 'camera' | 'photo' | 'home';

/** Stars over the track: at the bottom of each drop and the top of each hill, loop and roll he built. */
function starsFor(b: Built): Star[] {
  const out: Star[] = [];
  for (const sp of b.spans) {
    if (sp.index < 0) continue;
    const g = sp.geo.g, mid = (sp.from + sp.to) / 2;
    if (g === 'drop') out.push({ s: sp.to - (sp.to - sp.from) * .2, caught: false, missed: false });
    if (g === 'hump' || g === 'loop' || g === 'twist' || g === 'dip' || g === 'splash') out.push({ s: mid, caught: false, missed: false });
  }
  return out;
}
/** The tallest drop he built: where it starts. */
function bigDrop(b: Built): number | null {
  let best: { s: number; d: number } | null = null;
  for (const sp of b.spans) if (sp.index >= 0 && sp.geo.g === 'drop' && (!best || sp.geo.d > best.d)) best = { s: sp.from, d: sp.geo.d };
  return best?.s ?? null;
}

export function startRide(pieces: readonly string[]): RideState {
  const built = build(pieces), cam = bigDrop(built);
  return {
    built, car: { ...START }, phase: 'out', t: 0, held: 0, hands: false, stars: starsFor(built), camera: cam === null ? null : { s: cam },
    photo: 'none', squeals: 0, cheers: 0, topSpeed: 0, events: [],
  };
}

/** What he is doing: a finger held down (hands up), a lever pulled, the camera tapped. */
export interface Input { readonly hold: boolean; readonly lever: boolean; readonly snap: boolean }
export const cameraUp = (st: RideState) => !!st.camera && st.phase === 'run' && st.photo === 'none' && st.car.s > st.camera.s - TUNING.cameraBefore && st.car.s < st.camera.s + TUNING.cameraAfter;

/** One frame of the Ride. */
export function tick(st: RideState, input: Input, dt: number): RideState {
  if (st.phase === 'done') return st;
  st.t += dt; st.hands = input.hold; st.events = [];
  const p = st.built.profile, L = lengthOf(p);
  const top = st.built.liftTop;
  if (st.phase === 'hold') {
    st.held += dt;
    if (input.lever || st.held >= TUNING.autoLever) { st.phase = 'run'; st.events.push('lever'); }
    return st;
  }
  const before = st.car.s;
  for (let k = 0; k < 4; k++) st.car = step(p, st.car, dt / 4);
  // never stuck: a crawl that would roll back (it can't, the builder checked) is nudged on
  if (st.car.v < 0.8 && st.phase === 'run' && pointAt(p, st.car.s).slope >= 0) st.car = { s: st.car.s + 0.8 * dt, v: 0.8 };
  if (st.t > TUNING.maxT) st.car = { s: st.car.s + 8 * dt, v: 8 };
  st.topSpeed = Math.max(st.topSpeed, st.car.v);
  if (st.phase === 'out' && st.car.s > 1) st.phase = top !== null ? 'lift' : 'run';
  if (st.phase === 'lift' && top !== null && st.car.s >= top) { st.car = { s: top, v: 0 }; st.phase = 'hold'; return st; }
  // stars caught with hands up; a drop with hands down is a squeal
  for (const star of st.stars) {
    if (star.caught || star.missed) continue;
    if (Math.abs(st.car.s - star.s) < TUNING.catchR && input.hold) { star.caught = true; st.events.push('star'); }
    else if (st.car.s > star.s + TUNING.catchR) star.missed = true;
  }
  const slope = pointAt(p, st.car.s).slope;
  if (slope < -0.5 && pointAt(p, before).slope >= -0.5 && st.phase === 'run') { if (input.hold) { st.cheers++; st.events.push('cheer'); } else { st.squeals++; st.events.push('squeal'); } }
  if (st.camera && st.photo === 'none') {
    if (cameraUp(st) && input.snap) { st.photo = 'tapped'; st.events.push('photo'); }
    else if (st.car.s >= st.camera.s + TUNING.cameraAfter) { st.photo = 'auto'; st.events.push('photo'); }
  }
  const brakes = st.built.spans.find(s => s.id === 'home-brakes')!;
  if (st.phase === 'run' && st.car.s >= brakes.from) { st.phase = 'home'; st.events.push('home'); }
  // into the station: the Ride is over
  if (st.car.s >= Math.min(L - 0.5, brakes.to)) st.phase = 'done';
  return st;
}

/** Plays a whole Ride with a scripted child: 'nothing' never touches the screen; 'clumsy' holds now and then and taps late; 'skilled'
 *  pulls the lever at once, holds through every star and snaps the photo. Returns the end state. */
export function rideWith(pieces: readonly string[], child: 'nothing' | 'clumsy' | 'skilled', seed = 1): RideState {
  let st = startRide(pieces), r = seed;
  const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < 60 * 200 && st.phase !== 'done'; i++) {
    const nearStar = st.stars.some(s => !s.caught && !s.missed && Math.abs(st.car.s - s.s) < TUNING.catchR + 2);
    const input: Input = child === 'nothing' ? { hold: false, lever: false, snap: false }
      : child === 'skilled' ? { hold: nearStar || pointAt(st.built.profile, st.car.s).slope < -0.3, lever: true, snap: cameraUp(st) }
      : { hold: (Math.floor(st.t / 1.5) + seed) % 3 === 0, lever: st.held > 2.5, snap: cameraUp(st) && rnd() < .02 };
    st = tick(st, input, 1 / 60);
  }
  return st;
}
export const isDrop = (id: string) => pieceOf(id).geo.g === 'drop';
