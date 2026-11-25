// Hills scenes on the one motion model: each lane is a slope `start` metres high, let go from the top, then (maybe) a hill to climb. The
// car is rolled along it by physics/motion.ts, which has no weight in it, so these scenes can never say a heavier cart goes faster.
import { pointAt, profile, roll, type Profile, type Rolling } from '../physics/motion';

/** A little rub on the scene's track: enough that a cart can't get over a hill as high as where it started, small enough that a hill a
 *  quarter lower is always got over. */
export const HILL_RESISTANCE = 0.01;
const N = 24;
/** Where the cart is let go: just over the edge of the top, with a nudge. */
export const HILL_START: Rolling = { s: 1.1, v: 0.3 };

export interface HillLane { readonly start: number; readonly hill?: number }
export interface HillTrack { readonly profile: Profile; readonly bottom: number; readonly peak: number | null }

const cache = new Map<string, HillTrack>();
/** The track of one lane, in metres from where the cart is let go. */
export function hillTrack(lane: HillLane): HillTrack {
  const key = `${lane.start}|${lane.hill ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pts: [number, number][] = [[0, lane.start], [0.8, lane.start]];
  const run = lane.start * 1.1 + 1;
  for (let i = 1; i <= N; i++) { const u = i / N; pts.push([0.8 + run * u, lane.start * (1 + Math.cos(Math.PI * u)) / 2]); }
  let x = 0.8 + run + 1.2;
  pts.push([x, 0]);
  const bottom = x;
  let peak: number | null = null;
  if (lane.hill !== undefined) {
    const h = lane.hill, w = h * 2.2 + 1.6;
    for (let i = 1; i <= N * 2; i++) { const u = i / (N * 2); pts.push([x + w * u, h * (1 - Math.cos(2 * Math.PI * u)) / 2]); }
    peak = x + w / 2; x += w;
  }
  pts.push([x + 3, 0]);
  const p = profile(pts, HILL_RESISTANCE);
  // distances along the track, not x: find where the bottom and the peak are
  const sAtX = (want: number) => { let lo = 0, hi = p.len[p.len.length - 1]!; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (pointAt(p, mid).x < want) lo = mid; else hi = mid; } return lo; };
  const t: HillTrack = { profile: p, bottom: sAtX(bottom), peak: peak === null ? null : sAtX(peak) };
  cache.set(key, t);
  return t;
}

/** `bottomT`: when (s) the cart passes the bottom of its slope. A cart let go lower gets there first, though slower, so the scene shows
 *  each cart's speed there on a sign (art/scene.ts): "faster at the bottom" is never judged by who arrives first. */
export interface HillRun { readonly frames: readonly Rolling[]; readonly over: boolean; readonly speedAtBottom: number; readonly bottomT: number }
const runs = new Map<string, HillRun>();
/** The cart let go from the top, rolled until it stops or rolls off the end. */
export function hillRun(lane: HillLane): HillRun {
  const key = `${lane.start}|${lane.hill ?? ''}`;
  const hit = runs.get(key);
  if (hit) return hit;
  const t = hillTrack(lane), r = roll(t.profile, HILL_START, { maxT: 30 });
  let speedAtBottom = 0;
  for (const f of r.frames) if (f.s <= t.bottom + 0.5) speedAtBottom = Math.max(speedAtBottom, f.v);
  const at = r.frames.findIndex(f => f.s >= t.bottom), bottomT = (at < 0 ? r.frames.length : at) / 60;
  const out = { frames: r.frames, over: t.peak === null || r.frames.some(f => f.s > t.peak! + 0.3), speedAtBottom, bottomT };
  runs.set(key, out);
  return out;
}

/** Which choice the hills scene shows: yes or no for one lane with a hill; else the one fastest at the bottom, or the only one over. */
export function hillOutcome(lanes: readonly (HillLane & { readonly cart: string })[], choices: readonly string[]): string {
  if (choices.includes('yes')) return hillRun(lanes[0]!).over ? 'yes' : 'no';
  if (lanes.every(l => l.hill === undefined)) return lanes.reduce((a, b) => (hillRun(b).speedAtBottom > hillRun(a).speedAtBottom ? b : a)).cart;
  const over = lanes.filter(l => hillRun(l).over);
  return over.length === 1 ? over[0]!.cart : 'none';
}
