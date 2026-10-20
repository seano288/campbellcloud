// Searches out Purrdoku's boards: for every step of the level ladder, the first POOL seeds whose board has that size and
// difficulty. Only the seeds are written (to src/purrdoku/boards.ts); the game remakes each board from its seed.
// Hard 10×10 boards can take seconds each to find, too slow to hunt for on an iPad between levels.
// The 12×12 bonus boards can take seconds just to make from their seed, so those are written out whole (bonus.ts).
// Run (add `-- bonus` to remake only the bonus boards):
//   npm run build:purrdoku-boards
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BONUS_SIZE, BONUS_TIERS, STEPS } from '../src/purrdoku/ladder';
import { encode, generate, rate, turn, type Puzzle } from '../src/purrdoku/puzzle';

const POOL = 500, BONUS_POOL = 60;

/** The same text for a board however it's turned and whatever its patches are numbered, to skip repeats. */
const shape = (board: Puzzle) => [...Array(8).keys()].map(way => {
  const names = new Map<number, number>();
  return turn(board, way).regions.map(r => names.get(r) ?? names.set(r, names.size).get(r)).join(',');
}).sort()[0]!;

/** For each wanted tier, the first `count` different boards of that size and tier, with the seeds that made them. */
function hunt(size: number, wanted: readonly number[], count: number) {
  const found = new Map(wanted.map(tier => [tier, [] as { seed: number; board: Puzzle }[]])), seen = new Set<string>();
  for (let seed = 1; [...found.values()].some(boards => boards.length < count); seed++) {
    const board = generate(size, seed), boards = found.get(rate(board));
    if (!boards || boards.length >= count) continue;
    const key = shape(board);
    if (seen.has(key)) continue;
    seen.add(key);
    boards.push({ seed, board });
  }
  console.log(`${size}×${size}: ${[...found].map(([tier, boards]) => `tier ${tier} up to seed ${boards.at(-1)!.seed}`).join(', ')}`);
  return found;
}

if (!process.argv.includes('bonus')) {
  const pool: Record<string, number[]> = {};
  for (const size of [...new Set(STEPS.map(([s]) => s))]) {
    const wanted = [...new Set(STEPS.filter(([s]) => s === size).map(([, tier]) => tier))];
    for (const [tier, boards] of hunt(size, wanted, POOL)) pool[`${size}/${tier}`] = boards.map(b => b.seed);
  }
  writeFileSync(resolve(import.meta.dirname, '../src/purrdoku/boards.ts'), `// Made by tools/purrdoku-boards.ts: don't edit by hand. Seeds of boards for each "size/tier" step of the ladder.
export const POOL: Record<string, readonly number[]> = {
${Object.entries(pool).map(([key, seeds]) => `  '${key}': [${seeds.join(',')}],`).join('\n')}
};
`);
}

const bonus = hunt(BONUS_SIZE, BONUS_TIERS, BONUS_POOL);
writeFileSync(resolve(import.meta.dirname, '../src/purrdoku/bonus.ts'), `// Made by tools/purrdoku-boards.ts: don't edit by hand. The ${BONUS_SIZE}×${BONUS_SIZE} bonus boards for each tier,
// written out whole (see encode in puzzle.ts) because they're slow to make from a seed.
export const BONUS: Record<number, readonly string[]> = {
${[...bonus].map(([tier, boards]) => `  ${tier}: [\n${boards.map(b => `    '${encode(b.board)}',`).join('\n')}\n  ],`).join('\n')}
};
`);
