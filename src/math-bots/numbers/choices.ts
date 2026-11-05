// Number choices for a question. Wrong answers come from real mistakes (`traps`), topped up with near misses. Where the right
// answer sits among the sorted choices is picked first, so it isn't always in the middle (sorted near misses would put it there).
import { int, shuffle, type Rng } from '../../game/rng';

const uniq = (xs: readonly number[]) => [...new Set(xs)];

export function numberChoices(rng: Rng, target: number, traps: readonly number[], wrong: number, lo: number, hi: number): number[] {
  const usable = traps.filter(t => t !== target && t >= lo && t <= hi);
  const near = (side: 1 | -1) => [1, 2, 3, 4, 5].map(d => target + side * d).filter(x => x >= lo && x <= hi);
  const below = uniq([...shuffle(rng, usable.filter(t => t < target)), ...near(-1)]);
  const above = uniq([...shuffle(rng, usable.filter(t => t > target)), ...near(1)]);
  let under = int(rng, 0, wrong); // how many wrong answers sit below the target
  if (below.length < under) under = below.length; // near the edge: borrow from the other side
  if (above.length < wrong - under) under = wrong - above.length;
  return [...below.slice(0, under), target, ...above.slice(0, wrong - under)].sort((a, b) => a - b);
}
