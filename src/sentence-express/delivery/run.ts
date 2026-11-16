// A Delivery, as a little simulation on his own Layout (drawn by draw.ts). He slides the throttle; the train runs along his track,
// taking each set of points the way it's set (he taps them to switch). It picks up the cargo at one station and takes it to Toy
// Town. Nothing can go wrong: arriving at the station stops the train by itself, whatever the speed; going fast round a corner only
// makes it lean and squeal; points set the wrong way only send it round again, and after a while the right way lights up and then
// sets itself.
//
// Distances are in squares. The train is the engine and its cars, each a fixed distance behind the one in front along the track.
import { deliverable, exitOf, hasPoints, isCurve, isStraight, opposite, routes, step, type Dir, type Layout } from '../layout/track';

export const SPACING = .92;
export const CURVE_LEN = Math.PI / 4;
export const U_R = .28, U_LEN = 2 * Math.PI * U_R;
/** Faster than this round a corner and the train leans and squeals. */
export const BEND_SPEED = 1.9;
/** After this long on one leg, the points it needs light up; after HELP_S they set themselves. */
export const HINT_S = 6, HELP_S = 26;

export interface Seg { readonly cell: number; readonly from: Dir; readonly to: Dir }
export const segLen = (s: Seg) => (s.from === s.to ? U_LEN : opposite(s.from) === s.to ? 1 : CURVE_LEN);

const MID: Record<Dir, [number, number]> = { 1: [.5, 0], 2: [1, .5], 4: [.5, 1], 8: [0, .5] };
const INWARD: Record<Dir, [number, number]> = { 1: [0, 1], 2: [-1, 0], 4: [0, -1], 8: [1, 0] };

/** Where along a square's track `t` (0 to its length) is, in squares from the table's corner, and which way it's facing. */
export function pointOn(l: Pick<Layout, 'w'>, s: Seg, t: number): { x: number; y: number; a: number } {
  const cx = s.cell % l.w, cy = Math.floor(s.cell / l.w), [fx, fy] = MID[s.from], [tx, ty] = MID[s.to];
  if (s.from === s.to) {
    // the turnaround: round a little loop and back out
    const [ix, iy] = INWARD[s.from], ox = fx + ix * U_R, oy = fy + iy * U_R, a0 = Math.atan2(fy - oy, fx - ox), a = a0 + (t / U_R);
    return { x: cx + ox + Math.cos(a) * U_R, y: cy + oy + Math.sin(a) * U_R, a: a + Math.PI / 2 };
  }
  if (opposite(s.from) === s.to) {
    const k = t;
    return { x: cx + fx + (tx - fx) * k, y: cy + fy + (ty - fy) * k, a: Math.atan2(ty - fy, tx - fx) };
  }
  // round the corner the two sides share
  const kx = (fx === .5 ? tx : fx), ky = (fy === .5 ? ty : fy);
  const a0 = Math.atan2(fy - ky, fx - kx), a1 = Math.atan2(ty - ky, tx - kx);
  let d = a1 - a0;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  const a = a0 + d * (t / CURVE_LEN);
  return { x: cx + kx + Math.cos(a) * .5, y: cy + ky + Math.sin(a) * .5, a: a + Math.sign(d) * Math.PI / 2 };
}

export type Leg = 'pickup' | 'loading' | 'dropoff' | 'unloading' | 'done';
export type RunEvent = 'squeal' | 'arrive' | 'loaded' | 'delivered' | 'points' | 'helped' | 'clack';

export interface Run {
  layout: Layout;
  segs: Seg[];
  /** How far into the last seg the engine is. */
  head: number;
  speed: number;
  /** 0 to 1, from the slider. */
  throttle: number;
  top: number;
  cars: number;
  leg: Leg;
  /** Squares of the station he's going to now, and Toy Town. */
  pickup: number;
  town: number;
  legT: number;
  wait: number;
  lean: number;
  /** The points that need switching for the way there, lit after a while. */
  hint: number | null;
  events: RunEvent[];
  t: number;
}

/** The track in the square before `cell` that leads out by side `to`, for laying the train out behind the engine. */
function behind(l: Layout, cell: number, to: Dir): Seg {
  const m = l.cells[cell]!;
  for (const from of [1, 2, 4, 8] as Dir[]) if (from !== to && m & from && (exitOf(m, from, 0) === to || exitOf(m, from, 1) === to)) return { cell, from, to };
  return { cell, from: to, to };
}

/** The engine at the middle of a straight square, facing out by `to`, its cars behind it along the track. */
export function trainAt(l: Layout, cell: number, to: Dir, cars: number): { segs: Seg[]; head: number } {
  const segs: Seg[] = [{ cell, from: opposite(to), to }];
  let len = .5;
  for (let guard = 0; len < (cars + 1) * SPACING + 1 && guard < 40; guard++) {
    const first = segs[0]!, prev = step(l, first.cell, first.from);
    if (prev < 0 || !(l.cells[prev]! & opposite(first.from))) break;
    const s = behind(l, prev, opposite(first.from));
    segs.unshift(s);
    len += segLen(s);
  }
  return { segs, head: .5 };
}

/** The next square's track, the way the points are set now. */
function nextSeg(l: Layout, s: Seg): Seg {
  const n = step(l, s.cell, s.to), from = opposite(s.to);
  if (n < 0 || !(l.cells[n]! & from)) return { cell: s.cell, from: s.to, to: s.to };
  return { cell: n, from, to: exitOf(l.cells[n]!, from, l.points[n] ?? 0) };
}

/** Where a car is: `back` squares behind the engine along the track. */
export function carAt(r: Pick<Run, 'layout' | 'segs' | 'head'>, back: number) {
  let i = r.segs.length - 1, t = r.head - back;
  while (t < 0 && i > 0) { i--; t += segLen(r.segs[i]!); }
  return pointOn(r.layout, r.segs[i]!, Math.max(0, t));
}

export function createRun(layout: Layout, pickup: number, town: number, cars: number, top = 2.8): Run | null {
  if (!isStraight(layout.cells[town]!) || !isStraight(layout.cells[pickup]!)) return null;
  const to = deliverable(layout, town, pickup);
  if (to === null) return null;
  const { segs, head } = trainAt(layout, town, to, cars);
  return { layout, segs, head, speed: 0, throttle: 0, top, cars, leg: 'pickup', pickup, town, legT: 0, wait: 0, lean: 0, hint: null, events: [], t: 0 };
}

const target = (r: Run) => (r.leg === 'pickup' || r.leg === 'loading' ? r.pickup : r.town);

/** How far the engine is from the middle of the target square along the track ahead, looking a few squares on. */
function aheadTo(r: Run, cell: number): number | null {
  let s = r.segs.at(-1)!, d = -r.head;
  for (let k = 0; k < 4; k++) {
    if (s.cell === cell) { const left = d + segLen(s) / 2; if (left >= -1e-6) return left; }
    d += segLen(s);
    s = nextSeg(r.layout, s);
  }
  return null;
}

/** The points still to switch on the way to the target, and the first of them. */
function pointsNeeded(r: Run): { cell: number; set: number }[] {
  const s = r.segs.at(-1)!, n = step(r.layout, s.cell, s.to);
  if (n < 0) return [];
  const way = routes(r.layout, { cell: n, from: opposite(s.to) }).get(target(r)) ?? [];
  return way.filter(p => (r.layout.points[p.cell] ?? 0) !== p.set);
}

/** Moves the world on by dt seconds. */
export function stepRun(r: Run, dt: number) {
  r.events = [];
  r.t += dt;
  if (r.leg === 'done') { r.speed = 0; return; }
  if (r.leg === 'loading' || r.leg === 'unloading') {
    r.speed = 0;
    r.wait -= dt;
    if (r.wait <= 0) {
      if (r.leg === 'loading') { r.leg = 'dropoff'; r.legT = 0; r.events.push('loaded'); r.throttle = 0; }
      else { r.leg = 'done'; r.events.push('delivered'); }
    }
    return;
  }
  r.legT += dt;
  const want = r.throttle * r.top, goal = target(r);
  r.speed += (want - r.speed) * Math.min(1, dt * (want > r.speed ? 1.6 : 3));
  // the station stops the train by itself: it slows as it comes in, whatever he does
  const left = aheadTo(r, goal);
  if (left !== null && r.speed > .2) r.speed = Math.min(r.speed, Math.max(.35, left * 2.2));
  let move = r.speed * dt;
  if (left !== null && move >= left) move = left;
  // along the track, square by square
  r.head += move;
  while (r.head >= segLen(r.segs.at(-1)!) - 1e-9) {
    r.head -= segLen(r.segs.at(-1)!);
    const next = nextSeg(r.layout, r.segs.at(-1)!);
    r.segs.push(next);
    if (r.segs.length > r.cars + 12) r.segs.splice(0, r.segs.length - (r.cars + 12));
    r.events.push('clack');
    if (isCurve(r.layout.cells[next.cell]!) && r.speed > BEND_SPEED) r.events.push('squeal');
    if (hasPoints(r.layout.cells[next.cell]!)) r.events.push('points');
  }
  const cur = r.segs.at(-1)!;
  const bend = cur.from !== cur.to && opposite(cur.from) !== cur.to;
  r.lean += ((bend ? Math.max(0, r.speed - BEND_SPEED) * .35 : 0) - r.lean) * Math.min(1, dt * 6);
  if (left !== null && Math.abs(left - move) < 1e-6) {
    r.speed = 0;
    r.throttle = 0;
    r.leg = r.leg === 'pickup' ? 'loading' : 'unloading';
    r.wait = 1.6;
    r.events.push('arrive');
    r.hint = null;
    return;
  }
  // points: lit after a while if they're set the wrong way, set by themselves after a longer while
  const need = pointsNeeded(r);
  r.hint = r.legT > HINT_S && need.length ? need[0]!.cell : null;
  if (r.legT > HELP_S && need.length) {
    const points = [...r.layout.points];
    for (const p of need) points[p.cell] = p.set;
    r.layout = { ...r.layout, points };
    r.events.push('helped');
    r.legT = HINT_S;
  }
}

/** He tapped a square: if it has points, they switch (not under the train). */
export function tapPoints(r: Run, cell: number): boolean {
  if (!hasPoints(r.layout.cells[cell]!)) return false;
  if (r.segs.slice(-1).some(s => s.cell === cell) && r.head > 0.05) return false;
  const points = [...r.layout.points];
  points[cell] = points[cell] ? 0 : 1;
  r.layout = { ...r.layout, points };
  return true;
}

/** How much a Delivery pays: more for a longer train, at most 6. */
export const PAY_MAX = 6;
export const payFor = (cars: number) => Math.min(PAY_MAX, 2 + cars);
