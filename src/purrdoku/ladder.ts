// The level ladder: which board each level gets. Levels start small and easy and climb towards big, hard boards,
// with an easier level thrown in now and then. Boards come from a pool of seeds searched out ahead of time (boards.ts).
import { POOL } from './boards';
import { rng } from './puzzle';

/**
 * The steps, easiest first: board size and how hard it is to reason out (see rate). Each step lasts a few levels
 * more than the one before, so the climb slows down as the boards get harder.
 */
export const STEPS: readonly (readonly [size: number, tier: number])[] = [
  [5, 1], [5, 2], [6, 1], [6, 2], [7, 2], [6, 3], [7, 3], [8, 2], [8, 3], [7, 4], [9, 2], [9, 3], [8, 4], [10, 2], [10, 3],
  [9, 4], [10, 4],
];
const stepLength = (step: number) => 3 + step;

/** Which step a level sits on before any easing off. */
function climb(level: number) {
  let step = 0, start = 1;
  while (step < STEPS.length - 1 && level >= start + stepLength(step)) start += stepLength(step++);
  return step;
}

const breather = (level: number) => level > 5 && rng(level * 40503)() < 0.2;

/**
 * The step a level is actually played at. Most levels sit on the ladder or one step either side of it, and about one
 * in five is a breather a good way further down, never two in a row. Past the top the hardest few steps take turns.
 */
export function stepFor(level: number): number {
  const top = STEPS.length - 1, random = rng(level * 2654435761);
  let step = climb(level);
  if (step === top) step = top - Math.floor(random() * 4);
  if (breather(level) && !breather(level - 1)) return Math.max(0, step - 3 - Math.floor(random() * 4));
  const nudge = random();
  if (nudge < 0.15) step--;
  else if (nudge > 0.85) step++;
  return Math.min(top, Math.max(0, step));
}

/**
 * A level's board. Each step works through its pool in a shuffled order; once the pool is used up it goes round again
 * with every board turned or flipped (8 ways), so a board doesn't come back for thousands of levels.
 */
export function levelBoard(level: number): { size: number; seed: number; turn: number } {
  const step = stepFor(level), [size, tier] = STEPS[step]!, seeds = POOL[`${size}/${tier}`]!;
  let used = 0;
  for (let l = 1; l < level; l++) if (stepFor(l) === step) used++;
  const lap = Math.floor(used / seeds.length), order = (used * 7919 + step * 31) % seeds.length;
  return { size, seed: seeds[order]!, turn: lap % 8 };
}
