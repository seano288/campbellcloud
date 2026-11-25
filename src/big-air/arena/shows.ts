// The endless layer: Shows, generated from their number. Once he has cleared the first five Rows a Show is always on offer, taking turns
// with the Rows while there are Rows left and then on every Jump. Show n is the same every time: what is in its row, how long the row is
// in feet, the wind and whether it is at night. Each is a little longer than the last (fast at first, then slowly, without end), and the
// gen test checks every one can be cleared with a truck he could own by then. Every fifth Show gives a Show Cup, numbered, never sold.
import { int, pick, seeded } from '../../game/rng';
import { OBSTACLES, ROW_GAP, type ObstacleKind } from './catalog';

export interface Cup { readonly n: number; readonly glyph: string; readonly bg: string; readonly rim: string }
export interface Show {
  readonly n: number;
  /** What stands in the row, in order from the ramp, with the length of the row in feet (the tape reads it). */
  readonly parts: readonly (readonly [ObstacleKind, number])[];
  readonly feet: number;
  /** ft/s: tail wind positive, head wind negative. */
  readonly wind: number;
  readonly night: boolean;
  readonly cup: Cup | null;
}

/** How long Show n's row is, in feet. It follows what a child who buys the cheapest new thing first can jump by the time he reaches each
 *  Show (measured by the economy test: under 20 feet at the first Show, about 65 by the 200th, 240 by the 800th), a little under it so the
 *  wind decides about one in three, and after the table it keeps growing by a few feet each time the Show number doubles, more slowly
 *  than tuning grows his jump, without end. It never goes down. */
export const SHOW_FEET: readonly (readonly [number, number])[] = [
  [1, 17], [5, 17], [10, 17], [20, 20], [50, 25], [100, 38], [200, 59], [400, 108], [800, 236], [1200, 270], [1600, 284], [2000, 294], [2500, 302],
];
export const SHOW_TAIL = 9;
export function showFeet(n: number): number {
  const t = SHOW_FEET, last = t[t.length - 1]!;
  if (n >= last[0]) return Math.round(last[1] + SHOW_TAIL * Math.log2(n / last[0]));
  let i = 0;
  while (i < t.length - 2 && n > t[i + 1]![0]) i++;
  const [n0, f0] = t[i]!, [n1, f1] = t[i + 1]!;
  return Math.round(f0 + ((Math.max(n, n0) - n0) / (n1 - n0)) * (f1 - f0));
}

export const CUP_EVERY = 5;
const GLYPHS = ['🏆', '⭐', '🔥', '⚡', '🛻', '🚀', '🎆', '👑', '💎', '🦖', '🐉', '🦅', '🌟', '🎯', '🏁', '💥'];
const COLOURS = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1', '#ff5fa2', '#14a3a3', '#1f3a68', '#c46a2f', '#e0b13a', '#1b1e24'];
/** The Show Cup that Show n gives, or null: every fifth Show, without end. */
export function cupFor(n: number): Cup | null {
  if (n < 1 || n % CUP_EVERY) return null;
  const k = n / CUP_EVERY;
  return { n: k, glyph: GLYPHS[(k * 7) % GLYPHS.length]!, bg: COLOURS[(k * 5 + Math.floor(k / GLYPHS.length)) % COLOURS.length]!, rim: COLOURS[(k * 3 + 4) % COLOURS.length]! };
}

/** The things a Show's row is built from: by length, so a long row uses big things. */
const SMALL: readonly ObstacleKind[] = ['car', 'taxi', 'police', 'van', 'pickup', 'icecream', 'tractor', 'mini', 'ring', 'mud'];
const BIG: readonly ObstacleKind[] = ['schoolbus', 'bus', 'fire', 'tanker', 'train', 'heli', 'plane', 'dino', 'crane', 'logs', 'whale', 'rocket', 'camper', 'limo', 'dump', 'boat', 'rival', 'pool'];
export const WINDS = [-3, -2, 0, 0, 2, 3, 4] as const;

export function show(n: number): Show {
  const rng = seeded(0x5b1a ^ Math.imul(n, 2654435761));
  const feet = showFeet(n), parts: [ObstacleKind, number][] = [];
  // fill the row with one or two kinds of thing, then pad with cones so it is exactly as long as it says
  let left = feet - 2;
  const kinds = feet > 70 ? [pick(rng, BIG), pick(rng, [...BIG, ...SMALL])] : [pick(rng, SMALL), pick(rng, SMALL)];
  for (const k of kinds) {
    const each = OBSTACLES[k].len + ROW_GAP, most = Math.floor(left / each);
    if (most < 1) continue;
    const count = k === kinds[0] ? Math.max(1, Math.min(most, int(rng, 1, Math.max(1, Math.ceil(most * .7))))) : most;
    parts.push([k, count]);
    left -= count * each;
  }
  const cones = Math.floor(left / (OBSTACLES.cone.len + ROW_GAP));
  if (cones > 0) parts.push(['cone', cones]);
  return { n, parts, feet, wind: pick(rng, WINDS), night: rng() < .4, cup: cupFor(n) };
}
