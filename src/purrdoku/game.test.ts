import { beforeEach, describe, expect, it } from 'vitest';
import { CAT, CROSS, EMPTY, game, hint, LIVES, paint, placeCat, puzzle, restart, save, shownHint, start } from './game';
import { STEPS, stepFor } from './ladder';
import { rate } from './puzzle';

const answer = () => puzzle.value!.cats.map((col, row) => row * puzzle.value!.size + col);
const wrongCell = (n = 0) => {
  const right = new Set(answer());
  return [...Array(puzzle.value!.size ** 2).keys()].filter(i => !right.has(i))[n]!;
};

describe('playing Purrdoku', () => {
  beforeEach(() => { save.value = { v: 2, level: 1, solved: 0 }; start(); });

  it('crosses out a wrong cat and costs a fish; three wrong loses the board', () => {
    expect(placeCat(wrongCell(0))).toBe('wrong');
    expect(game.value!.marks[wrongCell(0)]).toBe(CROSS);
    expect(placeCat(wrongCell(1))).toBe('wrong');
    expect(placeCat(wrongCell(2))).toBe('lost');
    expect(game.value!.strikes).toBe(LIVES);
    expect(placeCat(answer()[0]!)).toBeUndefined();
    restart();
    expect(game.value!.status).toBe('playing');
    expect(game.value!.strikes).toBe(0);
  });

  it('a right cat crosses nothing else out', () => {
    expect(placeCat(answer()[0]!)).toBe('cat');
    expect(game.value!.marks.filter(m => m !== EMPTY)).toEqual([CAT]);
  });

  it('solving a board moves on a level', () => {
    const cells = answer();
    cells.slice(0, -1).forEach(cell => expect(placeCat(cell)).toBe('cat'));
    expect(placeCat(cells.at(-1)!)).toBe('won');
    expect(save.value.level).toBe(2);
    expect(save.value.solved).toBe(1);
    start();
    expect(game.value!.level).toBe(2);
    expect(game.value!.status).toBe('playing');
  });
});

describe('Purrdoku hints', () => {
  it('following hints alone solves a board without a wrong cat or a wrong ✕', () => {
    for (const level of [1, 30, 90, 200]) {
      save.value = { v: 2, level, solved: 0 };
      start();
      const right = new Set(answer());
      for (let asked = 0; game.value!.status === 'playing'; asked++) {
        expect(asked).toBeLessThan(500);
        hint();
        const shown = shownHint.value!;
        expect(shown.why).toBeTruthy();
        if (shown.kind === 'cat') expect(['cat', 'won']).toContain(placeCat(shown.cells[0]!));
        else {
          expect(shown.cells.some(cell => right.has(cell))).toBe(false);
          paint(shown.cells, CROSS);
        }
        expect(shownHint.value).toBeNull();
      }
      expect(game.value!.status).toBe('won');
      expect(game.value!.hints).toBeGreaterThan(0);
    }
  });

  it('points out a ✕ that hides a cat first', () => {
    save.value = { v: 2, level: 1, solved: 0 };
    start();
    paint([wrongCell(0), answer()[2]!], CROSS);
    hint();
    expect(shownHint.value).toMatchObject({ kind: 'cat', cells: [answer()[2]] });
    hint(); // a second tap hides it
    expect(shownHint.value).toBeNull();
  });
});

describe('the level ladder', () => {
  it('starts easy and gets harder, with easier levels mixed in', () => {
    const steps = Array.from({ length: 400 }, (_, i) => stepFor(i + 1));
    expect(Math.max(...steps.slice(0, 5))).toBeLessThanOrEqual(1);
    const avg = (from: number, to: number) => steps.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);
    expect(avg(0, 30)).toBeLessThan(avg(60, 100));
    expect(avg(60, 100)).toBeLessThan(avg(300, 400));
    expect(steps.slice(200).filter(s => s <= STEPS.length - 6).length).toBeGreaterThan(10); // breathers up top
  });

  it("gives each level a board of its step's size and difficulty", () => {
    for (const level of [1, 7, 40, 120, 250]) {
      save.value = { v: 2, level, solved: 0 };
      start();
      const [size, tier] = STEPS[stepFor(level)]!;
      expect(puzzle.value!.size).toBe(size);
      expect(rate(puzzle.value!)).toBe(tier);
    }
  });
});
