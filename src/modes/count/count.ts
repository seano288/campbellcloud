// Count the Cash: a pile of money; how much is it? Levels 1 to 3 sort the pile biggest first, Level 4 brings bigger
// piles up to $9.99 in a jumble, and Level 5 asks how much change comes back from paying for something.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { biggestFirst, total, type MoneyKey } from '../../money/money';
import type { Stretch } from '../progress';
import type { Level } from '../ids';
import { SHOP_ITEMS, type ShopItem } from '../pay/pay';

export interface CountRule {
  money: readonly MoneyKey[];
  /** Most pieces in the pile, at each stretch. */
  maxPieces: readonly [number, number, number];
  /** Most the pile adds up to (a $5 bill at Level 3 goes over it). */
  cap: number;
  /** How far the wrong choices are from the right one. */
  deltas: readonly number[];
}

export const COUNT_LEVELS: Record<1 | 2 | 3 | 4, CountRule> = {
  1: { money: ['d', 'n', 'p'], maxPieces: [3, 4, 5], cap: 30, deltas: [1, 5, 10] },
  2: { money: ['q', 'd', 'n', 'p'], maxPieces: [4, 5, 6], cap: 75, deltas: [1, 5, 10, 25] },
  3: { money: ['b1', 'q', 'd', 'n', 'p'], maxPieces: [4, 5, 6], cap: 300, deltas: [5, 10, 25, 100] },
  4: { money: ['b5', 'b1', 'q', 'd', 'n', 'p'], maxPieces: [5, 6, 8], cap: 999, deltas: [1, 5, 10, 25, 100] },
};
const FIVE_CHANCE = 0.15; // a $5 bill now and then at Level 3

/** Level 5: what he pays with, and the change that comes back, in steps that get finer as he stretches. */
const PAID_WITH: readonly (readonly MoneyKey[])[] = [['b1'], ['q', 'q', 'q', 'q'], ['b1', 'b1'], ['b5'], ['b1', 'q', 'q']];
const CHANGE_STEP: Record<Stretch, number> = { 0: 25, 1: 5, 2: 1 };

/** `change`: a Level 5 problem, where the pile is what he pays for `item` and `total` is the change he gets back. */
export interface CountProblem { pile: MoneyKey[]; total: number; choices: number[]; change?: { item: ShopItem; price: number } }

function choicesAround(answer: number, deltas: readonly number[], rng: Rng) {
  const choices = new Set([answer]);
  while (choices.size < 4) {
    const c = answer + pick(rng, deltas) * pick(rng, [-1, 1]);
    if (c > 0 && c < 1000) choices.add(c);
  }
  return shuffle(rng, [...choices]);
}

function makeChange(rng: Rng, stretch: Stretch): CountProblem {
  const pile = [...pick(rng, PAID_WITH)], paid = total(pile), step = CHANGE_STEP[stretch];
  // change under a dollar, and the price at least 5¢
  const change = step * int(rng, 1, Math.floor((Math.min(paid - 5, 99)) / step));
  return { pile, total: change, choices: choicesAround(change, step === 1 ? [1, 5, 10] : [5, 10, 25], rng), change: { item: pick(rng, SHOP_ITEMS), price: paid - change } };
}

/** `stretch` sets the size of the pile within the Level (src/modes/progress.ts); 2 is the biggest. */
export function makeCount(level: Level, rng: Rng, stretch: Stretch = 2): CountProblem {
  if (level === 5) return makeChange(rng, stretch);
  const rule = COUNT_LEVELS[level];
  for (;;) {
    const pile = Array.from({ length: int(rng, 2, rule.maxPieces[stretch]) }, () => pick(rng, rule.money));
    if (level === 3) {
      if (!pile.some(k => k === 'b1')) pile[0] = 'b1';
      if (rng() < FIVE_CHANCE) pile[0] = 'b5';
    }
    if (level === 4 && !pile.some(k => k === 'b1' || k === 'b5')) pile[0] = pick(rng, ['b1', 'b5'] as const);
    const sum = total(pile);
    if (sum > rule.cap + (level === 3 && pile.includes('b5') ? 500 : 0)) continue;
    // a jumbled pile at Level 4: sorting it in his head is part of the counting
    if (level < 4) pile.sort(biggestFirst);
    else if (pile.every((k, i) => i === 0 || biggestFirst(pile[i - 1]!, k) <= 0)) pile.reverse();
    return { pile, total: sum, choices: choicesAround(sum, rule.deltas, rng) };
  }
}

/** The same pile again with its choices in a new order. */
export const replayCount = (p: CountProblem, rng: Rng): CountProblem => ({ ...p, choices: shuffle(rng, p.choices) });

export const checkCount = (p: CountProblem, answer: number) => answer === p.total;
