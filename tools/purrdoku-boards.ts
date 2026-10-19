// Searches out Purrdoku's boards: for every step of the level ladder, the first POOL seeds whose board has that size and
// difficulty. Only the seeds are written (to src/purrdoku/boards.ts); the game remakes each board from its seed.
// Hard 10×10 boards can take seconds each to find, too slow to hunt for on an iPad between levels. Run:
//   npm run build:purrdoku-boards
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STEPS } from '../src/purrdoku/ladder';
import { generate, rate, turn, type Puzzle } from '../src/purrdoku/puzzle';

const POOL = 500;

/** The same text for a board however it's turned and whatever its patches are numbered, to skip repeats. */
const shape = (board: Puzzle) => [...Array(8).keys()].map(way => {
  const names = new Map<number, number>();
  return turn(board, way).regions.map(r => names.get(r) ?? names.set(r, names.size).get(r)).join(',');
}).sort()[0]!;

const pool: Record<string, number[]> = {};
for (const size of [...new Set(STEPS.map(([s]) => s))]) {
  const wanted = new Set(STEPS.filter(([s]) => s === size).map(([, tier]) => tier));
  const found = new Map([...wanted].map(tier => [tier, [] as number[]])), seen = new Set<string>();
  for (let seed = 1; [...found.values()].some(seeds => seeds.length < POOL); seed++) {
    const board = generate(size, seed), seeds = found.get(rate(board));
    if (!seeds || seeds.length >= POOL) continue;
    const key = shape(board);
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push(seed);
  }
  for (const [tier, seeds] of found) pool[`${size}/${tier}`] = seeds;
  console.log(`${size}×${size}: ${[...found].map(([tier, seeds]) => `tier ${tier} up to seed ${seeds.at(-1)}`).join(', ')}`);
}

const out = resolve(import.meta.dirname, '../src/purrdoku/boards.ts');
writeFileSync(out, `// Made by tools/purrdoku-boards.ts: don't edit by hand. Seeds of boards for each "size/tier" step of the ladder.
export const POOL: Record<string, readonly number[]> = {
${Object.entries(pool).map(([key, seeds]) => `  '${key}': [${seeds.join(',')}],`).join('\n')}
};
`);
