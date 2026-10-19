import { describe, expect, it } from 'vitest';
import { emptyStats, hardModeProblem, keyMarks, pickAnswer, recordResult, score, shareText, status } from './game';
import { ANSWERS, isAllowed } from './words';

const marks = (guess: string, answer: string) => score(guess, answer).map(m => m[0]).join('');

describe('score', () => {
  it('marks exact, misplaced and missing letters', () => {
    expect(marks('crane', 'crane')).toBe('ccccc');
    expect(marks('slate', 'crane')).toBe('aacac');
    expect(marks('nacre', 'crane')).toBe('ppppc');
  });

  it('never gives a doubled letter more yellows than the answer has spare', () => {
    expect(marks('speed', 'abide')).toBe('aapap');
    expect(marks('eerie', 'crane')).toBe('aapac');
    expect(marks('geese', 'those')).toBe('aaacc');
    expect(marks('llama', 'hello')).toBe('ppaaa');
  });
});

describe('keyMarks', () => {
  it('keeps the best mark a letter has earned', () => {
    const keys = keyMarks(['nacre', 'crane'], 'crane');
    expect(keys.get('c')).toBe('correct');
    expect(keyMarks(['slate'], 'crane').get('s')).toBe('absent');
  });
});

describe('hardModeProblem', () => {
  it('requires greens to stay put and yellows to be reused', () => {
    expect(hardModeProblem('slate', ['crane'], 'crate')).toBe('1st letter must be C');
    expect(hardModeProblem('cramp', ['oaths'], 'trace')).toBe('Guess must contain T');
    expect(hardModeProblem('crave', ['crane'], 'crate')).toBeNull();
  });
});

describe('status and stats', () => {
  it('ends on a right guess or after six', () => {
    expect(status(['crane'], 'crane')).toBe('won');
    expect(status(['slate'], 'crane')).toBe('playing');
    expect(status(Array(6).fill('slate'), 'crane')).toBe('lost');
  });

  it('tracks streaks and the guess distribution', () => {
    let stats = recordResult(emptyStats(), true, 3);
    stats = recordResult(stats, true, 4);
    expect(stats).toMatchObject({ played: 2, won: 2, streak: 2, bestStreak: 2, distribution: [0, 0, 1, 1, 0, 0] });
    stats = recordResult(stats, false, 6);
    expect(stats).toMatchObject({ played: 3, won: 2, streak: 0, bestStreak: 2 });
  });

  it('shares an emoji grid', () => {
    expect(shareText(['slate', 'crane'], 'crane', false)).toBe('Hunch 2/6\n\n⬛⬛🟩⬛🟩\n🟩🟩🟩🟩🟩');
  });
});

describe('words', () => {
  it('uses the full answer list and accepts both answers and other allowed guesses', () => {
    expect(ANSWERS).toHaveLength(2315);
    expect(isAllowed('crane')).toBe(true);
    expect(isAllowed('aahed')).toBe(true);
    expect(isAllowed('zzzzz')).toBe(false);
  });

  it('picks an answer it has not used recently', () => {
    expect(pickAnswer(['aback', 'abase'], ['aback'], () => 0.99)).toBe('abase');
    expect(pickAnswer(['aback'], ['aback'], () => 0)).toBe('aback');
  });
});
