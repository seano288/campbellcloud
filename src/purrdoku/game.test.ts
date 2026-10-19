import { beforeEach, describe, expect, it } from 'vitest';
import { CAT, CROSS, game, LIVES, open, placeCat, puzzle, restart, save, streak, today } from './game';

const answer = () => puzzle.value!.cats.map((col, row) => row * puzzle.value!.size + col);
const wrongCell = (n = 0) => {
  const right = new Set(answer());
  return [...Array(puzzle.value!.size ** 2).keys()].filter(i => !right.has(i))[n]!;
};

describe('playing Purrdoku', () => {
  beforeEach(() => { save.value = { ...save.value, games: {}, levels: { easy: 1, medium: 1, hard: 1, extreme: 1 }, best: {}, solved: {} }; });

  it('crosses out a wrong cat and costs a fish; three wrong loses the board', () => {
    open('easy');
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

  it('solving a board records the time and moves on a level', () => {
    open('easy');
    const cells = answer();
    cells.slice(0, -1).forEach(cell => expect(placeCat(cell)).toBe('cat'));
    expect(placeCat(cells.at(-1)!)).toBe('won');
    expect(game.value!.marks.filter(m => m === CAT)).toHaveLength(5);
    expect(save.value.levels.easy).toBe(2);
    expect(save.value.solved.easy).toBe(1);
    expect(save.value.best.easy).toBe(0);
    open('easy');
    expect(game.value!.level).toBe(2);
  });

  it("solving today's board starts the streak", () => {
    save.value = { ...save.value, daily: { last: 0, streak: 0 } };
    open('daily');
    expect(game.value!.level).toBe(today());
    for (const cell of answer()) placeCat(cell);
    expect(game.value!.status).toBe('won');
    expect(streak()).toBe(1);
  });
});
