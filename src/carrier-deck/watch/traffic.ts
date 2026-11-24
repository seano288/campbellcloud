// "Watch the deck", as numbers: where each of his aircraft is at time t. Each one comes up on a lift, taxis to a catapult, launches off
// the bow, is away a while, comes back over the stern onto a wire, taxis to a lift and goes below, then round again. Up to six aircraft
// take turns, spaced so only one uses the catapults and one the wires at a time (with more catapults, two launch nearly together). All
// in the carrier's own units, the stern at x = 0 and the deck at y = DECK.
import { TUNING, wireX } from '../mission/sim';

export const CYCLE = 16;
export interface Pose { readonly x: number; readonly y: number; readonly tilt: number; readonly gear: boolean; readonly hook: boolean; readonly seen: boolean }
const D = TUNING.deckAlt + 6;
const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

/** Where an aircraft is, `phase` seconds into its own cycle, on a deck `len` long with lifts at `liftX`. */
export function pose(phase: number, len: number, liftX: number, wire: number): Pose {
  const p = ((phase % CYCLE) + CYCLE) % CYCLE, cat = len * .62, bow = len, land = wireX({ stern: 0 }, wire);
  if (p < 2) return { x: liftX, y: lerp(TUNING.deckAlt - 40, D, p / 2), tilt: 0, gear: true, hook: false, seen: p > .3 };
  if (p < 4) return { x: lerp(liftX, cat, (p - 2) / 2), y: D, tilt: 0, gear: true, hook: false, seen: true };
  if (p < 5.2) { const k = (p - 4) / 1.2; return { x: lerp(cat, bow + 40, k * k), y: D + Math.max(0, k - .85) * 120, tilt: 0, gear: true, hook: false, seen: true }; }
  if (p < 7) { const k = (p - 5.2) / 1.8; return { x: bow + 40 + k * 700, y: D + 18 + k * 260, tilt: -.25, gear: false, hook: false, seen: true }; }
  if (p < 9) return { x: 0, y: 0, tilt: 0, gear: false, hook: false, seen: false };
  if (p < 11.5) { const k = (p - 9) / 2.5; return { x: lerp(-700, land, k), y: lerp(D + 200, D, k), tilt: .08, gear: true, hook: true, seen: true }; }
  if (p < 12.3) { const k = (p - 11.5) / .8; return { x: lerp(land, land + 60, 1 - (1 - k) * (1 - k)), y: D, tilt: 0, gear: true, hook: true, seen: true }; }
  if (p < 14) return { x: lerp(land + 60, liftX, (p - 12.3) / 1.7), y: D, tilt: 0, gear: true, hook: false, seen: true };
  return { x: liftX, y: lerp(D, TUNING.deckAlt - 40, (p - 14) / 2), tilt: 0, gear: true, hook: false, seen: p < 15.7 };
}
/** When each of `n` aircraft starts its cycle: spread evenly, so the catapult and the wires take one at a time. */
export const offsets = (n: number) => Array.from({ length: n }, (_, i) => -i * (CYCLE / Math.max(1, n)));
