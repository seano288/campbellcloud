// The six pieces of US money in the game, biggest value first.

export const MONEY_KEYS = ['b5', 'b1', 'q', 'd', 'n', 'p'] as const;
export type MoneyKey = (typeof MONEY_KEYS)[number];

export const MONEY_NAMES = ['Penny', 'Nickel', 'Dime', 'Quarter', '$1 Bill', '$5 Bill'] as const;
export type MoneyName = (typeof MONEY_NAMES)[number];
export const MONEY_VALUES = ['1¢', '5¢', '10¢', '25¢', '$1', '$5'] as const;
export type MoneyValue = (typeof MONEY_VALUES)[number];

export interface Money {
  cents: number;
  name: MoneyName;
  value: MoneyValue;
  bill: boolean;
  size: number; // coin diameter in px at scale 1 (real US proportions: the dime is smallest)
}

export const MONEY: Record<MoneyKey, Money> = {
  b5: { cents: 500, name: '$5 Bill', value: '$5', bill: true, size: 0 },
  b1: { cents: 100, name: '$1 Bill', value: '$1', bill: true, size: 0 },
  q: { cents: 25, name: 'Quarter', value: '25¢', bill: false, size: 81 },
  d: { cents: 10, name: 'Dime', value: '10¢', bill: false, size: 60 },
  n: { cents: 5, name: 'Nickel', value: '5¢', bill: false, size: 71 },
  p: { cents: 1, name: 'Penny', value: '1¢', bill: false, size: 64 },
};

export const biggestFirst = (a: MoneyKey, b: MoneyKey) => MONEY_KEYS.indexOf(a) - MONEY_KEYS.indexOf(b);
export const total = (keys: readonly MoneyKey[]) => keys.reduce((s, k) => s + MONEY[k].cents, 0);
export const fmt = (cents: number) => (cents < 100 ? `${cents}¢` : `$${(cents / 100).toFixed(2)}`);

/**
 * The money each Level uses: Level 1 pennies, nickels and dimes; Level 2 adds quarters; Level 3 adds $1 and $5 bills.
 * Levels 4 and 5 bring no new money, just harder things to do with all of it.
 */
export const LEVEL_MONEY: Record<1 | 2 | 3 | 4 | 5, readonly MoneyKey[]> = {
  1: ['d', 'n', 'p'],
  2: ['q', 'd', 'n', 'p'],
  3: ['b5', 'b1', 'q', 'd', 'n', 'p'],
  4: ['b5', 'b1', 'q', 'd', 'n', 'p'],
  5: ['b5', 'b1', 'q', 'd', 'n', 'p'],
};
