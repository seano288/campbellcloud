// The level ladder: which board each level gets. Levels start small and easy and climb towards big, hard boards,
// with an easier level thrown in now and then, and every tenth level is a big 12×12 bonus round. Boards come from pools
// searched out ahead of time: seeds for the ladder (boards.ts), whole boards for the bonus rounds (bonus.ts).
// How far up the ladder a level sits is its rung. Each solved level climbs one rung, or more at a faster pace.
import { BONUS } from './bonus';
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

/** Rungs climbed per solved level, from the pace slider: 1 is the usual climb, 4 the steepest. */
export const PACES = [1, 2, 3, 4] as const;

/** Which step a rung sits on before any easing off. */
function climb(rung: number) {
  let step = 0, start = 1;
  while (step < STEPS.length - 1 && rung >= start + stepLength(step)) start += stepLength(step++);
  return step;
}

const breather = (rung: number) => rung > 5 && rng(rung * 40503)() < 0.2;

/**
 * The step a rung is actually played at. Most rungs sit on the ladder or one step either side of it, and about one
 * in five is a breather a good way further down, never two in a row. Past the top the hardest few steps take turns.
 */
export function stepFor(rung: number): number {
  const top = STEPS.length - 1, random = rng(rung * 2654435761);
  let step = climb(rung);
  if (step === top) step = top - Math.floor(random() * 4);
  if (breather(rung) && !breather(rung - 1)) return Math.max(0, step - 3 - Math.floor(random() * 4));
  const nudge = random();
  if (nudge < 0.15) step--;
  else if (nudge > 0.85) step++;
  return Math.min(top, Math.max(0, step));
}

export const BONUS_SIZE = 12, BONUS_EVERY = 10;
/** Bonus boards are tier 2 until the ladder first reaches a tier 3 step, then tier 3. */
export const BONUS_TIERS = [2, 3] as const;
const FIRST_HARD = STEPS.findIndex(([, tier]) => tier >= 3);
export const isBonus = (level: number) => level % BONUS_EVERY === 0;

/** A level's board: a seed to make it from, or for a bonus round the board written out whole (`board`). */
export interface LevelBoard { size: number; seed: number; turn: number; board?: string }

/**
 * A level's board, on the given rung. Each step works through its pool in a shuffled order; once the pool is used up
 * it goes round again with every board turned or flipped (8 ways), so a board doesn't come back for thousands of
 * levels. Rungs only go up, so skipping some at a faster pace never brings a board back either.
 */
export function levelBoard(level: number, rung = level): LevelBoard {
  if (isBonus(level)) {
    const tier = climb(rung) >= FIRST_HARD ? 3 : 2, boards = BONUS[tier]!, k = level / BONUS_EVERY - 1;
    return { size: BONUS_SIZE, seed: 0, turn: Math.floor(k / boards.length) % 8, board: boards[(k * 7919) % boards.length]! };
  }
  const step = stepFor(rung), [size, tier] = STEPS[step]!, seeds = POOL[`${size}/${tier}`]!;
  let used = 0;
  for (let r = 1; r < rung; r++) if (stepFor(r) === step) used++;
  const lap = Math.floor(used / seeds.length), order = (used * 7919 + step * 31) % seeds.length;
  return { size, seed: seeds[order]!, turn: lap % 8 };
}
