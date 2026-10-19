import { describe, expect, it } from 'vitest';
import { countSolutions, generate, rate, turn } from './puzzle';

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
    expect(generate(8, 20261019)).toEqual(generate(8, 20261019));
  });

  it('rates a board by the hardest reasoning it needs', () => {
    for (const size of [5, 8]) for (let seed = 1; seed <= 20; seed++) {
      const tier = rate(generate(size, seed));
      expect(tier).toBeGreaterThanOrEqual(1);
      expect(tier).toBeLessThanOrEqual(4);
    }
  });

  it('turning or flipping a board keeps its one answer and its difficulty', () => {
    const board = generate(7, 3);
    for (let way = 0; way < 8; way++) {
      const turned = turn(board, way);
      expect(countSolutions(7, turned.regions)).toBe(1);
      turned.cats.forEach((col, row) => expect(turned.regions[row * 7 + col]).toBeDefined());
      expect(new Set(turned.cats.map((col, row) => turned.regions[row * 7 + col])).size).toBe(7);
      expect(rate(turned)).toBe(rate(board));
    }
    expect(turn(board, 0)).toEqual(board);
  });
});
