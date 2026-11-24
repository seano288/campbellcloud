// Every question made from every letter has exactly one right answer, and its choices are what the letter's question says. What Came
// Next's mixed-up sentences are never shown in the right order by chance.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { ORDER_SEP, PASSAGES } from '../mail/index';
import { isAnswer, isRightAnswer, questionFor, rightAnswer } from './problems';

describe('questions made from letters', () => {
  it('every question of every letter, many times over: one right answer among the choices, and it is the letter\'s', () => {
    const rng = seeded(5);
    for (const p of PASSAGES) for (let qi = 0; qi < p.qs.length; qi++) for (let k = 0; k < 20; k++) {
      const q = questionFor(p, qi, rng), qq = p.qs[qi]!;
      expect(isRightAnswer(q, rightAnswer(q))).toBe(true);
      if (qq.form === 'order') {
        expect(rightAnswer(q).split(ORDER_SEP).map(Number)).toEqual(p.lines.map((_, i) => i));
        expect(isAnswer(q, rightAnswer(q))).toBe(true);
        // every other order of the taps is wrong
        const wrong = [...p.lines.keys()].reverse().join(ORDER_SEP);
        expect(isRightAnswer(q, wrong)).toBe(false);
        continue;
      }
      expect(q.choices.filter(c => isRightAnswer(q, c)).length).toBe(1);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      for (const c of q.choices) expect(isAnswer(q, c)).toBe(true);
      expect(q.choices.length).toBe(qq.wrong.length + 1);
    }
  });
  it('What Came Next mixes its sentences at Levels 2 and 3, never in the right order, and its pictures at Level 1', () => {
    const rng = seeded(9);
    for (const p of PASSAGES.filter(x => x.kind === 'order')) for (let k = 0; k < 30; k++) {
      const q = questionFor(p, 0, rng);
      if (p.pics) expect(q.choices.map(Number)).not.toEqual(p.lines.map((_, i) => i));
      else expect([...q.shown]).not.toEqual(p.lines.map((_, i) => i));
    }
  });
  it('every other letter is shown in the order it was written', () => {
    const rng = seeded(2);
    for (const p of PASSAGES.filter(x => x.kind !== 'order')) expect([...questionFor(p, 0, rng).shown]).toEqual(p.lines.map((_, i) => i));
  });
});
