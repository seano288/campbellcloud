// Pay the Shop: buy a shop item by tapping money into a tray until it adds up to the price. Level 4 brings prices up
// to $9.75 and the $5 bill, and Level 5 asks him to pay with as few pieces as he can.
import { int, pick, type Rng } from '../../game/rng';
import { LEVEL_MONEY } from '../../money/money';
import type { MoneyPayment } from '../../money/payment';
import type { Level } from '../ids';
import type { Stretch } from '../progress';

/** Shop items that aren't Mods. */
export const SHOP_ITEMS = [
  { name: 'Fuel', icon: '⛽' }, { name: 'Snack', icon: '🍿' }, { name: 'Car Wash', icon: '🧽' },
  { name: 'Oil', icon: '🛢️' }, { name: 'Juice', icon: '🧃' }, { name: 'Battery', icon: '🔋' },
] as const;
export type ShopItem = (typeof SHOP_ITEMS)[number];

/** `fewest`: Level 5, where the exact price only counts with the fewest pieces it can be paid with. */
export interface PayProblem extends MoneyPayment { item: ShopItem; fewest?: boolean }

const L3_CENTS = [5, 10, 15, 25, 30, 50, 75];
/** The highest price at each stretch, in cents (or dollars, from Level 3). */
const TOPS: Record<Level, readonly [number, number, number]> = {
  1: [10, 18, 25],
  2: [30, 45, 60],
  3: [1, 2, 3],
  4: [4, 6, 9],
  5: [0, 2, 7],
};

/** `stretch` sets how high the price can go within the Level (src/modes/progress.ts); 2 is the highest. */
export function makePrice(level: Level, rng: Rng, stretch: Stretch = 2) {
  const top = TOPS[level][stretch];
  if (level === 1) return int(rng, 5, top);
  if (level === 2) return int(rng, 10, top);
  if (level === 5) return int(rng, 0, top) * 100 + 5 * int(rng, 1, 19);
  return int(rng, level === 4 ? 2 : 1, top) * 100 + pick(rng, L3_CENTS);
}

export function makePay(level: Level, rng: Rng, stretch: Stretch = 2): PayProblem {
  // the $5 bill joins the bank once prices can need it
  const bank = level < 4 ? LEVEL_MONEY[level].filter(k => k !== 'b5') : LEVEL_MONEY[level];
  return { item: pick(rng, SHOP_ITEMS), price: makePrice(level, rng, stretch), bank, ...(level === 5 ? { fewest: true } : {}) };
}
