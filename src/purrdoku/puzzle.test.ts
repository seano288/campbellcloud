import { describe, expect, it } from 'vitest';
import { countSolutions, daySeed, generate } from './puzzle';

describe('Purrdoku boards', () => {
  for (const size of [5, 7, 8, 10]) it(`makes ${size}×${size} boards with exactly one answer`, () => {
    for (let seed = 1; seed <= 8; seed++) {
      const { regions, cats } = generate(size, seed);
      expect(countSolutions(size, regions)).toBe(1);
      expect(new Set(regions).size).toBe(size);
      expect(new Set(cats).size).toBe(size);
      cats.forEach((col, row) => {
        if (row > 0) expect(Math.abs(cats[row - 1]! - col)).toBeGreaterThan(1);
      });
      expect(new Set(cats.map((col, row) => regions[row * size + col])).size).toBe(size);
    }
  });

  it('makes the same board from the same seed', () => {
    expect(generate(8, daySeed(new Date(2026, 9, 19)))).toEqual(generate(8, 20261019));
  });
});
