// The Balance Lock's puzzle: two pans that have to come out the same, a Weigh-In he solves to open a Legendary. As hard as his own
// Weigh-In, as the Password Lock is as hard as his Build It. He can reach a top Rung before Weigh-In opens, so with no Level to go on
// he gets its easiest form, with counters on the pans: `left` is one number, and = isn't needed.
import { int, pick, type Rng } from '../../game/rng';
import { numberChoices } from '../numbers/choices';
import type { Level } from '../numbers/problems';

/** a + b = c + ?, with b 0 at the easiest. */
export interface LockPuzzle { readonly a: number; readonly b: number; readonly c: number; readonly x: number; readonly choices: readonly number[] }
export const lockTotal = (p: LockPuzzle) => p.a + p.b;

/** `level`: his Weigh-In Level, or null while Weigh-In is still locked. */
export function makeLock(level: Level | null, rng: Rng): LockPuzzle {
  const easy = level === null || level === 1, total = easy ? int(rng, 4, 10) : level === 2 ? int(rng, 5, 10) : int(rng, 9, 20);
  const a = easy ? total : int(rng, Math.max(2, total - 10), Math.min(10, total - 2)), b = total - a;
  // nothing he could just copy across: neither the number he's after nor what's left beside it is already on the other pan
  const every = Array.from({ length: total - 1 }, (_, i) => i + 1), fair = every.filter(n => n !== a && n !== b && total - n !== a && total - n !== b);
  const x = pick(rng, easy || !fair.length ? every : fair);
  const c = total - x;
  return { a, b, c, x, choices: numberChoices(rng, x, [total, a, b, c].filter(n => n > 0), 2, 0, 20) };
}
