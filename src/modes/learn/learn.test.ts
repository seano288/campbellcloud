import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { LEVEL_MONEY, MONEY, total } from '../../money/money';
import type { Level } from '../ids';
import { makeLearn } from './learn';

const many = (level: Level, stretch: 0 | 1 | 2 = 2, n = 400) => { const rng = seeded(level * 31 + stretch); return Array.from({ length: n }, () => makeLearn(level, rng, stretch)); };

describe('Learn the Coins problems', () => {
  it('Levels 1 to 3 ask only about the Level\'s money', () => {
    for (const level of [1, 2, 3] as const) for (const p of many(level)) {
      expect(p.kind).not.toBe('same');
      expect(LEVEL_MONEY[level]).toContain(p.target);
    }
  });

  it('Levels 4 and 5 mostly show a pile and ask which one piece is worth the same', () => {
    for (const level of [4, 5] as const) {
      const same = many(level).filter(p => p.kind === 'same');
      expect(same.length).toBeGreaterThan(200);
      for (const p of same) {
        expect(MONEY[p.target].cents).toBe(total(p.group));
        expect(p.options).toContain(p.target);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.group.length).toBeLessThanOrEqual(10);
      }
    }
  });

  it('Level 4 piles are one kind of money, Level 5 piles are mixed', () => {
    for (const p of many(4)) if (p.kind === 'same') expect(new Set(p.group).size).toBe(1);
    for (const p of many(5)) if (p.kind === 'same') expect(new Set(p.group).size).toBeGreaterThan(1);
  });

  it('offers fewer answers while he finds his feet on a Level', () => {
    const count = (p: ReturnType<typeof makeLearn>) => ('choices' in p ? p.choices : p.options).length;
    expect(Math.max(...many(2, 0).map(count))).toBe(2);
    expect(Math.max(...many(2, 1).map(count))).toBe(3);
    expect(Math.max(...many(2, 2).map(count))).toBe(4);
  });
});
