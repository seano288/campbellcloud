// Learn the Coins: names, values, and which is worth more or less, using the money of the Level. Levels 4 and 5 show a
// pile and ask which one piece is worth the same: piles of one kind of coin first, then mixed piles.
import { pick, shuffle, type Rng } from '../../game/rng';
import { biggestFirst, LEVEL_MONEY, MONEY, MONEY_KEYS, total, type MoneyKey } from '../../money/money';
import type { Level } from '../ids';
import type { Stretch } from '../progress';

export type LearnProblem =
  | { kind: 'find'; target: MoneyKey; options: MoneyKey[] } // tap the named coin among up to 4
  | { kind: 'name' | 'value'; target: MoneyKey; choices: MoneyKey[] } // one coin shown, pick its name or value
  | { kind: 'more' | 'less'; target: MoneyKey; options: MoneyKey[] } // two coins, tap the one worth more or less
  | { kind: 'same'; target: MoneyKey; group: MoneyKey[]; options: MoneyKey[] }; // a pile, tap the one piece worth the same

const times = (n: number, k: MoneyKey): MoneyKey[] => Array(n).fill(k);
/** Level 4: piles of one kind of money that trade for one bigger piece. */
const PLAIN_PILES: readonly MoneyKey[][] = [
  times(5, 'p'), times(2, 'n'), times(10, 'p'), times(5, 'n'), times(4, 'q'), times(10, 'd'), times(5, 'b1'),
];
/** Level 5: mixed piles. */
const MIXED_PILES: readonly MoneyKey[][] = [
  ['n', ...times(5, 'p')], ['d', 'd', 'n'], ['d', 'n', 'n', 'n'], ['d', 'd', ...times(5, 'p')], [...times(4, 'n'), ...times(5, 'p')],
  ['q', 'q', 'q', 'd', 'd', 'n'], ['q', 'q', ...times(5, 'd')], [...times(4, 'b1'), ...times(4, 'q')], ['b1', 'b1', 'b1', 'q', 'q', 'q', 'q', 'b1'],
];
const pieceWorth = (cents: number) => MONEY_KEYS.find(k => MONEY[k].cents === cents)!;

/** How many to choose from: fewer while he's finding his feet on the Level (src/modes/progress.ts). */
const OPTIONS: Record<Stretch, number> = { 0: 2, 1: 3, 2: 4 };

function makeSame(level: 4 | 5, rng: Rng, stretch: Stretch): LearnProblem {
  const group = [...pick(rng, level === 4 ? PLAIN_PILES : MIXED_PILES)].sort(biggestFirst);
  const target = pieceWorth(total(group));
  const others = shuffle(rng, MONEY_KEYS.filter(k => k !== target)).slice(0, OPTIONS[stretch] - 1);
  return { kind: 'same', target, group, options: shuffle(rng, [target, ...others]) };
}

/** `stretch` sets how many answers there are to pick from (2 to 4) within the Level; 2 is the most. */
export function makeLearn(level: Level, rng: Rng, stretch: Stretch = 2): LearnProblem {
  if (level >= 4 && rng() < 0.7) return makeSame(level as 4 | 5, rng, stretch);
  const pool = LEVEL_MONEY[level];
  const target = pick(rng, pool);
  const withOthers = (t: MoneyKey) => shuffle(rng, [t, ...shuffle(rng, pool.filter(k => k !== t)).slice(0, OPTIONS[stretch] - 1)]);
  const kind = pick(rng, stretch === 0 ? ['find', 'find', 'find', 'name', 'value'] as const : ['find', 'find', 'name', 'value', 'compare'] as const);
  if (kind === 'find') return { kind, target, options: withOthers(target) };
  if (kind !== 'compare') return { kind, target, choices: withOthers(target) };
  const [a, b] = shuffle(rng, pool) as [MoneyKey, MoneyKey];
  const more = rng() < 0.6;
  return { kind: more ? 'more' : 'less', target: MONEY[a].cents > MONEY[b].cents === more ? a : b, options: [a, b] };
}

/** The same question again with its coins or answers in a new order. */
export const replayLearn = (p: LearnProblem, rng: Rng): LearnProblem =>
  'choices' in p ? { ...p, choices: shuffle(rng, p.choices) } : { ...p, options: shuffle(rng, p.options) };

export const checkLearn = (p: LearnProblem, answer: MoneyKey) => answer === p.target;

/** The penny or nickel mixed up with the dime: say that the small dime is worth more. */
export const dimeTip = (a: MoneyKey, b: MoneyKey) => (a === 'd' && (b === 'p' || b === 'n')) || (b === 'd' && (a === 'p' || a === 'n'));
