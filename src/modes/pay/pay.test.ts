import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Level } from '../ids';
import { makePay, SHOP_ITEMS } from './pay';
import { checkPay, helpPayCoins } from '../../money/payment';

const many = (level: Level, n = 400) => { const rng = seeded(level * 7); return Array.from({ length: n }, () => makePay(level, rng)); };

describe('Pay the Shop prices', () => {
  it('Level 1: 5¢ to 25¢', () => {
    const ps = many(1).map(p => p.price);
    expect(Math.min(...ps)).toBe(5);
    expect(Math.max(...ps)).toBe(25);
  });

  it('Level 2: 10¢ to 60¢', () => {
    const ps = many(2).map(p => p.price);
    expect(Math.min(...ps)).toBe(10);
    expect(Math.max(...ps)).toBe(60);
  });

  it('Level 3: $1 to $3 plus some cents', () => {
    for (const { price } of many(3)) {
      expect(price).toBeGreaterThan(100);
      expect(price).toBeLessThan(400);
      expect(price % 100).toBeGreaterThan(0);
    }
  });

  it('asks for one of the six shop items', () => {
    expect(SHOP_ITEMS.map(i => i.name)).toEqual(['Fuel', 'Snack', 'Car Wash', 'Oil', 'Juice', 'Battery']);
    expect(new Set(many(1).map(p => p.item.name)).size).toBe(6);
  });

  it('pays with the money of the Level, without $5 bills', () => {
    expect(makePay(1, seeded(1)).bank).toEqual(['d', 'n', 'p']);
    expect(makePay(2, seeded(1)).bank).toEqual(['q', 'd', 'n', 'p']);
    expect(makePay(3, seeded(1)).bank).toEqual(['b1', 'q', 'd', 'n', 'p']);
  });
});

describe('Help me pay', () => {
  it('picks the coins biggest first', () => {
    expect(helpPayCoins(37, ['q', 'd', 'n', 'p'])).toEqual(['q', 'd', 'p', 'p']);
    expect(helpPayCoins(40, ['d', 'n', 'p'])).toEqual(['d', 'd', 'd', 'd']);
    expect(helpPayCoins(215, ['b1', 'q', 'd', 'n', 'p'])).toEqual(['b1', 'b1', 'd', 'n']);
  });

  it('always pays the exact price', () => {
    for (const level of [1, 2, 3] as const) for (const p of many(level, 100)) expect(checkPay(p, helpPayCoins(p.price, p.bank))).toEqual({ kind: 'paid' });
  });
});

describe('checking the tray', () => {
  const p = makePay(1, seeded(3));
  it('says how much more is needed, or how much to take back', () => {
    expect(checkPay({ ...p, price: 25 }, ['d'])).toEqual({ kind: 'short', by: 15 });
    expect(checkPay({ ...p, price: 25 }, ['d', 'd', 'd'])).toEqual({ kind: 'over', by: 5 });
    expect(checkPay({ ...p, price: 25 }, [])).toEqual({ kind: 'empty' });
  });
});
