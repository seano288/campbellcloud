import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { MONEY_KEYS, total, type MoneyKey } from '../../money/money';
import type { Level } from '../ids';
import { makeCount } from './count';

const many = (level: Level, n = 400) => { const rng = seeded(level * 101); return Array.from({ length: n }, () => makeCount(level, rng)); };
const sortedBiggestFirst = (pile: MoneyKey[]) => pile.every((k, i) => i === 0 || MONEY_KEYS.indexOf(pile[i - 1]!) <= MONEY_KEYS.indexOf(k));

describe('Count the Cash problems', () => {
  it('Level 1: at most 5 pennies, nickels and dimes, up to 30¢', () => {
    for (const p of many(1)) {
      expect(p.pile.length).toBeGreaterThanOrEqual(2);
      expect(p.pile.length).toBeLessThanOrEqual(5);
      expect(p.pile.every(k => ['d', 'n', 'p'].includes(k))).toBe(true);
      expect(p.total).toBeLessThanOrEqual(30);
    }
  });

  it('Level 2: at most 6 pieces with quarters, up to 75¢', () => {
    const ps = many(2);
    for (const p of ps) {
      expect(p.pile.length).toBeLessThanOrEqual(6);
      expect(p.pile.every(k => ['q', 'd', 'n', 'p'].includes(k))).toBe(true);
      expect(p.total).toBeLessThanOrEqual(75);
    }
    expect(ps.some(p => p.pile.includes('q'))).toBe(true);
  });

  it('Level 3: at most 6 pieces up to $3 with $1 bills, and a $5 bill now and then', () => {
    const ps = many(3);
    for (const p of ps) {
      expect(p.pile.length).toBeLessThanOrEqual(6);
      expect(p.pile.some(k => k === 'b1' || k === 'b5')).toBe(true);
      if (!p.pile.includes('b5')) expect(p.total).toBeLessThanOrEqual(300);
    }
    const fives = ps.filter(p => p.pile.includes('b5')).length;
    expect(fives).toBeGreaterThan(0);
    expect(fives).toBeLessThan(ps.length / 3);
  });

  it('Level 4: up to 8 pieces with a bill, up to $9.99, jumbled', () => {
    const ps = many(4);
    for (const p of ps) {
      expect(p.pile.length).toBeLessThanOrEqual(8);
      expect(p.pile.some(k => k === 'b1' || k === 'b5')).toBe(true);
      expect(p.total).toBe(total(p.pile));
      expect(p.total).toBeLessThan(1000);
      expect(p.change).toBeUndefined();
    }
    expect(ps.filter(p => !sortedBiggestFirst(p.pile)).length).toBeGreaterThan(ps.length * 0.9);
  });

  it('Level 5: the change from paying, under a dollar, for a price of at least 5¢', () => {
    for (const p of many(5)) {
      expect(p.change).toBeDefined();
      expect(p.total).toBeGreaterThan(0);
      expect(p.total).toBeLessThan(100);
      expect(p.change!.price).toBeGreaterThanOrEqual(5);
      expect(p.change!.price + p.total).toBe(total(p.pile));
      expect(p.choices).toContain(p.total);
    }
  });

  it('grows the pile, or makes the change finer, as he stretches', () => {
    const at = (level: Level, stretch: 0 | 1 | 2) => { const rng = seeded(stretch + 1); return Array.from({ length: 200 }, () => makeCount(level, rng, stretch)); };
    expect(Math.max(...at(1, 0).map(p => p.pile.length))).toBe(3);
    expect(Math.max(...at(1, 2).map(p => p.pile.length))).toBe(5);
    expect(at(5, 0).every(p => p.total % 25 === 0)).toBe(true);
    expect(at(5, 1).every(p => p.total % 5 === 0)).toBe(true);
    expect(at(5, 2).some(p => p.total % 5 !== 0)).toBe(true);
  });

  it('sorts the pile biggest first and adds it up', () => {
    for (const level of [1, 2, 3] as const) for (const p of many(level, 100)) {
      expect(sortedBiggestFirst(p.pile)).toBe(true);
      expect(p.total).toBe(total(p.pile));
    }
  });

  it('offers 4 different amounts, one of them right, all of them sayable', () => {
    for (const level of [1, 2, 3, 4, 5] as const) for (const p of many(level, 100)) {
      expect(p.choices).toHaveLength(4);
      expect(new Set(p.choices).size).toBe(4);
      expect(p.choices).toContain(p.total);
      expect(p.choices.every(c => c > 0 && c < 1000)).toBe(true);
    }
  });
});
