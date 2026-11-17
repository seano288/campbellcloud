// Every generated question has exactly one right answer and matches its Level, and the content rules the brief names hold: Podium cars
// never carry a number and are never level; Faster Car never shows equal numbers unless it's the = question; Race Chart Level 1 has a
// clear winner and loser by two or more, "how many more" is never zero, and every graph has three cars; tally marks come in bundles
// of five; number choices don't put the right one in the middle every time.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { bundlesOf, CAR_COLOURS, isRightAnswer, KINDS, makeChart, makeMore, makeOrder, makePlace, makeQuestion, makeTally, numberChoices, placeText, possibleAnswers, TALLY_MOST, type Level, type Question } from './problems';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2], N = 400;
function* all(kind: (typeof KINDS)[number]) {
  for (const level of LEVELS) for (const stretch of STRETCHES) for (let seed = 1; seed <= N; seed++) yield { level, stretch, q: makeQuestion(kind, level, stretch, seeded(seed * 31 + level * 7 + stretch)) };
}
const right = (q: Question) => possibleAnswers(q).filter(a => isRightAnswer(q, a) === true);

describe('every kind', () => {
  for (const kind of KINDS) {
    it(`${kind}: exactly one right answer among everything he could tap`, () => {
      for (const { q } of all(kind)) {
        expect(right(q), JSON.stringify(q)).toHaveLength(1);
        expect(right(q)[0]).toBe(q.answer);
      }
    });
  }
  it('choices are never repeated', () => {
    for (const kind of KINDS) for (const { q } of all(kind)) { const a = possibleAnswers(q); expect(new Set(a).size).toBe(a.length); }
  });
  it('the right number is not always in the middle of the choices', () => {
    for (const kind of ['place', 'tally', 'chart'] as const) {
      const at = new Set<number>();
      for (const { q } of all(kind)) if ('choices' in q && q.choices.length === 3 && !(q.kind === 'tally' && q.form === 'pick')) at.add(q.choices.indexOf(Number(q.answer)));
      expect([...at].sort(), kind).toEqual([0, 1, 2]);
    }
    const mid = Array.from({ length: 300 }, (_, i) => numberChoices(seeded(i), 10, [9, 11], 2, 0, 20).indexOf(10));
    expect(mid.filter(i => i === 1).length / 300).toBeLessThan(.6);
  });
  it('answers that are not answers are not counted', () => {
    expect(isRightAnswer(makePlace(1, 0, seeded(1)), 'nobody')).toBeNull();
    expect(isRightAnswer(makeMore(1, 0, seeded(1)), 'c')).toBeNull();
    expect(isRightAnswer(makeOrder(1, 0, seeded(1)), '3')).toBeNull();
    expect(isRightAnswer(makeTally(1, 0, seeded(1)), '')).toBeNull();
  });
});

describe('Podium', () => {
  it('Level 1: 3 to 5 cars, tap a place from first to fifth', () => {
    for (const { level, stretch, q } of all('place')) if (level === 1) {
      expect(q.kind === 'place' && q.form).toBe('tap');
      if (q.kind !== 'place') continue;
      expect(q.cars).toHaveLength(3 + stretch);
      expect(q.place).toBeGreaterThanOrEqual(1);
      expect(q.place).toBeLessThanOrEqual(Math.min(5, q.cars.length));
    }
  });
  it('Level 2: up to ten cars, what place, three written choices', () => {
    for (const { level, q } of all('place')) if (level === 2 && q.kind === 'place') {
      expect(q.form).toBe('which');
      expect(q.cars.length).toBeLessThanOrEqual(10);
      expect(q.choices).toHaveLength(3);
      expect(q.cars[q.place - 1]).toBe(q.target);
    }
  });
  it('Level 3: a pass moves the car up one, being passed moves it back one, and the new place is on the track', () => {
    for (const { level, q } of all('place')) if (level === 3 && q.kind === 'place') {
      expect(['passes', 'passed']).toContain(q.form);
      const now = Number(q.answer);
      expect(now).toBe(q.form === 'passes' ? q.place - 1 : q.place + 1);
      expect(now).toBeGreaterThanOrEqual(1);
      expect(now).toBeLessThanOrEqual(q.cars.length);
    }
  });
  it('cars are told apart by colour, never a number, and no two are the same car (so none are level)', () => {
    for (const { q } of all('place')) if (q.kind === 'place') {
      expect(new Set(q.cars).size).toBe(q.cars.length);
      q.cars.forEach(c => expect(CAR_COLOURS).toContain(c));
    }
  });
  it('writes places as 1st, 2nd, 3rd', () => expect([1, 2, 3, 4, 10].map(placeText)).toEqual(['1st', '2nd', '3rd', '4th', '10th']));
});

describe('Faster Car', () => {
  it('Level 1: numbers to 20, far apart at first', () => {
    for (const { level, stretch, q } of all('more')) if (level === 1 && q.kind === 'more') {
      expect(Math.max(q.a, q.b)).toBeLessThanOrEqual(20);
      if (stretch === 0) expect(Math.abs(q.a - q.b)).toBeGreaterThanOrEqual(6);
    }
  });
  it('Level 2: two-digit numbers, different tens, then the same tens', () => {
    for (const { level, stretch, q } of all('more')) if (level === 2 && q.kind === 'more') {
      expect(q.a).toBeGreaterThanOrEqual(10); expect(q.b).toBeGreaterThanOrEqual(10);
      const same = Math.floor(q.a / 10) === Math.floor(q.b / 10);
      expect(same).toBe(stretch === 2);
    }
  });
  it('Level 3: swapped digits first, then the signs', () => {
    for (const { level, stretch, q } of all('more')) if (level === 3 && q.kind === 'more') {
      if (stretch === 0) { expect(q.form).not.toBe('sign'); expect(q.b).toBe((q.a % 10) * 10 + Math.floor(q.a / 10)); }
      else expect(q.form).toBe('sign');
    }
  });
  it('never shows equal numbers unless it asks for the = sign', () => {
    let equals = 0;
    for (const { q } of all('more')) if (q.kind === 'more' && q.a === q.b) { expect(q.form).toBe('sign'); expect(q.answer).toBe('='); equals++; }
    expect(equals).toBeGreaterThan(0);
  });
});

describe('Tally Board', () => {
  it('reads to 10 at Level 1 and to 30 at Level 2; makes or picks at Level 3', () => {
    for (const { level, q } of all('tally')) if (q.kind === 'tally') {
      expect(q.n).toBeGreaterThanOrEqual(1);
      expect(q.n).toBeLessThanOrEqual(level === 1 ? 10 : TALLY_MOST);
      if (level < 3) expect(q.form).toBe('read'); else expect(['make', 'pick']).toContain(q.form);
      if (q.form !== 'make') expect(q.choices).toHaveLength(3);
    }
  });
  it('bundles marks in fives', () => {
    expect(bundlesOf(17)).toEqual({ fives: 3, ones: 2 });
    expect(bundlesOf(5)).toEqual({ fives: 1, ones: 0 });
    for (let n = 0; n <= 30; n++) { const b = bundlesOf(n); expect(b.fives * 5 + b.ones).toBe(n); expect(b.ones).toBeLessThan(5); }
  });
});

describe('Race Chart', () => {
  it('every graph has exactly three cars, all different', () => {
    for (const { q } of all('chart')) if (q.kind === 'chart') { expect(q.rows).toHaveLength(3); expect(new Set(q.rows.map(r => r.car)).size).toBe(3); }
  });
  it('Level 1 is a picture graph with a clear winner and a clear loser, each by at least two', () => {
    for (const { level, q } of all('chart')) if (level === 1 && q.kind === 'chart') {
      expect(q.graph).toBe('picture');
      const w = q.rows.map(r => r.wins).sort((a, b) => a - b);
      expect(w[1]! - w[0]!).toBeGreaterThanOrEqual(2);
      expect(w[2]! - w[1]!).toBeGreaterThanOrEqual(2);
    }
  });
  it('Level 2 reads one bar on a graph with numbers up the side', () => {
    for (const { level, q } of all('chart')) if (level === 2 && q.kind === 'chart') { expect(q.graph).toBe('bar'); expect(q.form).toBe('each'); }
  });
  it('"how many more" is never zero, and "in all" is never over 20', () => {
    for (const { level, q } of all('chart')) if (level === 3 && q.kind === 'chart') {
      if (q.form === 'more') { expect(Number(q.answer)).toBeGreaterThan(0); expect(q.car).not.toBe(q.other); }
      else { expect(q.form).toBe('total'); expect(Number(q.answer)).toBeLessThanOrEqual(20); }
    }
  });
});

describe('Line Up', () => {
  it('Level 1 uses numbers to 20, smallest to biggest; Level 2 two-digit numbers, both ways', () => {
    const forms = new Set<string>();
    for (const { level, q } of all('order')) if (q.kind === 'order' && level < 3) {
      expect(new Set(q.nums).size).toBe(3);
      if (level === 1) { expect(Math.max(...q.nums)).toBeLessThanOrEqual(20); expect(q.form).toBe('up'); }
      else { expect(Math.min(...q.nums)).toBeGreaterThanOrEqual(10); forms.add(q.form); }
      expect(q.answer).not.toBe(q.nums.join(',')); // never already in order
    }
    expect([...forms].sort()).toEqual(['down', 'up']);
  });
  it('Level 3: exactly one choice goes between', () => {
    for (const { level, q } of all('order')) if (level === 3 && q.kind === 'order') {
      expect(q.form).toBe('between');
      expect(q.nums.filter(n => n > q.lo && n < q.hi)).toEqual([Number(q.answer)]);
    }
  });
});

describe('making questions is quick', () => {
  it('ten thousand of each kind in a second or so each', () => {
    for (const kind of KINDS) { const t = performance.now(); for (let i = 0; i < 10000; i++) makeQuestion(kind, 3, 2, seeded(i)); expect(performance.now() - t).toBeLessThan(3000); }
  });
  it('makeChart Level 1 terminates with the tightest Stretch', () => { for (let i = 0; i < 1000; i++) makeChart(1, 0, seeded(i)); });
});
