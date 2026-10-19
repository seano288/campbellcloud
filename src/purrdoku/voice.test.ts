import { describe, expect, it } from 'vitest';
import { CHEERS, OOPS, STREAKS, WINS } from './phrases';
import { deck, narrator, STREAK } from './voice';

describe('dealing lines', () => {
  it('says every line once before any comes round again, never the same one twice running', () => {
    const next = deck(['a', 'b', 'c', 'd']);
    let previous = '';
    for (let round = 0; round < 50; round++) {
      const dealt = Array.from({ length: 4 }, () => next());
      expect(new Set(dealt).size).toBe(4);
      expect(dealt[0]).not.toBe(previous);
      previous = dealt[3]!;
    }
  });
});

describe('the narrator', () => {
  it('cheers a right cat, teases a wrong one and gives the last cat a board line', () => {
    const say = narrator();
    expect(CHEERS).toContain(say.line('cat'));
    expect(OOPS).toContain(say.line('wrong'));
    expect(OOPS).toContain(say.line('lost'));
    expect(WINS).toContain(say.line('won'));
  });

  it('calls a streak on every third right cat in a row, starting again after a mistake or a new board', () => {
    const say = narrator();
    const run = (n: number) => Array.from({ length: n }, () => STREAKS.includes(say.line('cat') as never));
    expect(run(STREAK * 2)).toEqual([false, false, true, false, false, true]);
    say.line('cat');
    say.line('wrong');
    expect(run(STREAK)).toEqual([false, false, true]);
    say.line('cat');
    say.reset();
    expect(run(STREAK)).toEqual([false, false, true]);
  });
});
