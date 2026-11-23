// The brief's "Rules the tests must enforce", on thousands of generated questions of every kind, Level and Stretch:
// - each Level's sums match its row: a Level 1 sum never carries or borrows, a Level 2 sum always does, and only Level 3 passes 100;
// - no answer is below zero and nothing passes 999;
// - where there are choices exactly one is right, the wrong ones are real mistakes, and the right one is not always in the middle;
// - about one sum in four is written with the answer on the left, and sums are written across.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import {
  borrows, carries, digitsOf, isRightAnswer, KINDS, makeAdd, makeGap, makeHop, makeHundreds, makeQuestion, makeTake, numberChoices, zeroChoices,
  onWheels, possibleAnswers, sumText, TOP, type Kind, type Level, type Question,
} from './problems';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2], N = 300;
function* all(kind: Kind) {
  for (const level of LEVELS) for (const stretch of STRETCHES) for (let seed = 1; seed <= N; seed++) yield { level, stretch, q: makeQuestion(kind, level, stretch, seeded(seed * 31 + level * 7 + stretch)) };
}
/** Every number a question shows, asks for or offers. */
function numbersIn(q: Question): number[] {
  const out = [Number(q.answer.split(',')[0]), Number(q.answer.split(',').at(-1))].filter(Number.isFinite);
  if (q.kind === 'add' || q.kind === 'take') out.push(q.a, q.b);
  if (q.kind === 'gap') out.push(q.a, q.target);
  if (q.kind === 'hundreds') {
    if (q.form === 'more' || q.form === 'sign') out.push(q.a, q.b); else out.push(q.n);
    if ('choices' in q) out.push(...q.choices);
  }
  if (q.kind === 'hop') {
    if (q.form === 'step') out.push(q.n, ...q.choices); else out.push(q.a, q.b, q.first, q.second, ...q.firstChoices, ...q.secondChoices);
  }
  return out;
}

describe('every kind', () => {
  for (const kind of KINDS) {
    it(`${kind}: exactly one right answer among everything he could give`, () => {
      for (const { q } of all(kind)) {
        const right = possibleAnswers(q).filter(a => isRightAnswer(q, a) === true);
        expect(right, JSON.stringify(q)).toHaveLength(1);
        expect(Number(right[0]!.split(',').at(-1))).toBe(Number(q.answer.split(',').at(-1)));
      }
    });
    it(`${kind}: no answer below zero, nothing past 999`, () => {
      for (const { q } of all(kind)) for (const n of numbersIn(q)) { expect(n, JSON.stringify(q)).toBeGreaterThanOrEqual(0); expect(n, JSON.stringify(q)).toBeLessThanOrEqual(TOP); }
    });
  }
  it('choices are never repeated, and the right one is not always in the middle', () => {
    const at = new Set<number>();
    for (const kind of ['hundreds', 'hop'] as const) for (const { q } of all(kind)) {
      const a = possibleAnswers(q);
      expect(new Set(a).size).toBe(a.length);
      if ('choices' in q) { expect(q.choices).toHaveLength(3); at.add(q.choices.indexOf(Number(q.answer))); expect([...q.choices]).toEqual([...q.choices].sort((x, y) => x - y)); }
    }
    expect([...at].sort()).toEqual([0, 1, 2]);
    const mid = Array.from({ length: 300 }, (_, i) => numberChoices(seeded(i), 50, [40, 60], 2, 0, 99).indexOf(50));
    expect(mid.filter(i => i === 1).length / 300).toBeLessThan(.6);
  });
  it('in every kind, Level and form with number choices, the right one stands first, in the middle and last, and not mostly in the middle', () => {
    // pass 2 found Jumbo's numbers with a zero (306 among 36 and 360) with the right one in the middle 6 times in 10, hidden by a check
    // that pooled every kind together
    const at = new Map<string, number[]>();
    for (const kind of ['hundreds', 'hop'] as const) for (const { level, q } of all(kind)) {
      const lists: [string, readonly number[], number][] = [];
      if ('choices' in q) lists.push([`${kind} L${level} ${q.form}`, q.choices, Number(q.answer)]);
      if (q.kind === 'hop' && q.form === 'two') lists.push([`hop L${level} first`, q.firstChoices, q.first], [`hop L${level} second`, q.secondChoices, q.second]);
      for (const [key, choices, right] of lists) { const c = at.get(key) ?? [0, 0, 0]; c[choices.indexOf(right)]!++; at.set(key, c); }
    }
    for (const [key, [first, mid, last]] of at) {
      const total = first! + mid! + last!;
      expect(first! / total, key).toBeGreaterThan(.15);
      expect(last! / total, key).toBeGreaterThan(.15);
      expect(mid! / total, key).toBeLessThan(.5);
    }
  });
  it('things that are not answers are not counted', () => {
    expect(isRightAnswer(makeAdd(1, 0, seeded(1)), 'x')).toBeNull();
    expect(isRightAnswer(makeHundreds(3, 0, seeded(1)), 'c')).toBeNull();
    expect(isRightAnswer(makeHop(1, 0, seeded(1)), '1234')).toBeNull();
  });
  it('about one sum in four has the answer on the left, and every sum is written across', () => {
    for (const kind of ['add', 'take', 'gap'] as const) {
      let flipped = 0, n = 0;
      for (const { q } of all(kind)) {
        if (!onWheels(q)) continue;
        n++; if (q.flip) flipped++;
        const text = sumText(q);
        expect(text).not.toContain('\n');
        expect(text.startsWith('?') || text.startsWith(String(q.kind === 'gap' ? q.target : '?'))).toBe(q.flip);
      }
      expect(flipped / n).toBeGreaterThan(.18);
      expect(flipped / n).toBeLessThan(.32);
    }
  });
});

describe('the sums match their Level', () => {
  it('Boarding: Level 1 never carries, Level 2 always carries under 100, only Level 3 passes 100', () => {
    for (const { level, q } of all('add')) if (q.kind === 'add') {
      expect(q.a).toBeGreaterThanOrEqual(10); expect(q.b).toBeGreaterThanOrEqual(10); // two two-digit numbers, past Big Jumps' 28 + 5
      if (level === 1) { expect(carries(q.a, q.b)).toBe(false); expect(q.a + q.b).toBeLessThan(100); }
      if (level === 2) { expect(carries(q.a, q.b)).toBe(true); expect(q.a + q.b).toBeLessThan(100); }
      if (level === 3) expect(q.a + q.b).toBeGreaterThan(100);
      expect(q.wheels).toBe(level === 3 ? 3 : 2); // three wheels only when the total can pass 100
    }
  });
  it('Boarding traps are the real mistakes: the ten not carried (38 + 25 = 53), both columns written (513)', () => {
    const q = { ...makeAdd(2, 1, seeded(3)) };
    for (const { q: p } of all('add')) if (p.kind === 'add' && p.a === 38 && p.b === 25) { expect(p.traps.noCarry).toBe(53); expect(p.traps.columns).toBe(513); }
    expect(q.traps.noCarry).toBe(Number(q.answer) - 10);
  });
  it('Unload: Level 1 never borrows, Level 2 always does, only Level 3 starts at 100 or past it', () => {
    for (const { level, stretch, q } of all('take')) if (q.kind === 'take') {
      expect(q.a - q.b).toBeGreaterThan(0);
      if (level === 1) { expect(borrows(q.a, q.b)).toBe(false); expect(q.a).toBeLessThan(100); }
      if (level === 2) { expect(borrows(q.a, q.b)).toBe(true); expect(q.a).toBeLessThan(100); }
      if (level === 3 && stretch === 0) expect(q.a % 10).toBe(0); // from a round number
      if (level === 3 && stretch === 2) expect(q.a).toBeGreaterThan(100);
      expect(q.wheels).toBe(q.a > 100 ? 3 : 2);
    }
    // the smaller digit from the bigger in each column: 62 - 17 = 55
    for (const { q } of all('take')) if (q.kind === 'take' && q.a === 62 && q.b === 17) expect(q.traps.smallFromBig).toBe(55);
  });
  it('Missing Bags: to the next ten, to a later ten, then any two numbers; never past 99', () => {
    for (const { level, q } of all('gap')) if (q.kind === 'gap') {
      const next = Math.ceil(q.a / 10) * 10;
      expect(Number(q.answer)).toBeGreaterThan(0);
      expect(q.target).toBeLessThan(100);
      if (level === 1) expect(q.target).toBe(next);
      if (level === 2) { expect(q.target % 10).toBe(0); expect(q.target).toBeGreaterThan(next); }
      if (level === 3) expect(q.target % 10).not.toBe(0);
    }
  });
  it('Jumbo: reads to 199 then 999, a digit in a place with all digits different, zeros, then comparing', () => {
    for (const { level, stretch, q } of all('hundreds')) if (q.kind === 'hundreds') {
      if (level === 1) { expect(q.form).toBe('read'); if (q.form === 'read' && stretch === 0) expect(q.n).toBeLessThan(200); }
      if (level === 2) expect(['digit', 'read', 'expanded']).toContain(q.form);
      if (q.form === 'digit') { const d = digitsOf(q.n); expect(new Set([d.h, d.t, d.o]).size).toBe(3); }
      if (level === 3) expect(['more', 'sign']).toContain(q.form);
      if (q.form === 'sign' && q.answer !== '=') expect(q.a).not.toBe(q.b);
      if (q.form === 'more') expect(q.a).not.toBe(q.b);
    }
  });
  it('Jumbo Level 2 numbers with a zero always offer the zero left out or put in the wrong place (306: 36 or 360)', () => {
    let zeros = 0;
    for (const { level, q } of all('hundreds')) if (level === 2 && q.kind === 'hundreds' && q.form === 'read') {
      zeros++;
      const { h, t, o } = digitsOf(q.n), x = t || o;
      expect(q.choices, String(q.n)).toHaveLength(3);
      expect(q.choices.some(c => c === h * 10 + x || c === (t ? h * 100 + x : h * 100 + x * 10)), `${q.n}: ${q.choices}`).toBe(true);
    }
    expect(zeros).toBeGreaterThan(200);
    for (let s = 0; s < 200; s++) { const c = zeroChoices(seeded(s), 306); expect(c).toContain(306); expect(c.includes(36) || c.includes(360)).toBe(true); }
  });
  it('Ten Hops: ten more and less to 200, a hundred more and less to 999, then two hops: the tens, then the ones', () => {
    for (const { level, q } of all('hop')) if (q.kind === 'hop') {
      if (level === 1) { expect(q.form).toBe('step'); if (q.form === 'step') { expect(Math.abs(q.step)).toBe(10); expect(Number(q.answer)).toBeLessThanOrEqual(200); } }
      if (level === 2 && q.form === 'step') expect(q.n + q.step).toBe(Number(q.answer));
      if (level === 3) {
        expect(q.form).toBe('two');
        if (q.form === 'two') {
          const s = q.op === '+' ? 1 : -1;
          expect(q.first).toBe(q.a + s * Math.floor(q.b / 10) * 10);
          expect(q.second).toBe(q.a + s * q.b);
          expect(q.firstChoices).toContain(q.first); expect(q.secondChoices).toContain(q.second);
        }
      }
    }
  });
  it('the Level 1 sums begin past Math Bots\' Big Jumps (28 + 5, 46 + 20): both numbers have two digits', () => {
    for (let s = 0; s < 500; s++) { const q = makeAdd(1, 0, seeded(s)); expect(q.b).toBeGreaterThan(9); }
    for (let s = 0; s < 500; s++) { const q = makeTake(1, 0, seeded(s)); expect(q.b).toBeGreaterThan(9); }
    for (let s = 0; s < 500; s++) { const q = makeGap(3, 2, seeded(s)); expect(Number(q.answer)).toBeGreaterThan(10); }
  });
});
