// The lessons for a miss say true things about the question they explain, and end on its right answer. Each lesson is run against a
// voice that only writes down what it would say, for thousands of generated questions of every kind, Level and Stretch.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Asking } from '../mix';
import type { VoiceScope } from '../voice';
import { lessonFor, lessonOf } from './teach';
import { KINDS, makeQuestion, ORDINALS, type Level, type Question } from './problems';

type Said = string[];
async function lesson(q: Question, full: boolean, answer = ''): Promise<{ said: Said; hint: string | null; lines: Said[] }> {
  const lines: Said[] = [], controller = new AbortController();
  const v = {
    active: true, signal: controller.signal, cancel() {}, hush() {},
    say: async (...items: unknown[]) => { lines.push(items.map(String)); },
    sayMore: async (...items: unknown[]) => { lines.push(items.map(String)); },
    wait: async () => {},
  } as unknown as VoiceScope;
  const l = lessonFor(controller.signal);
  const p = { mode: q.kind, level: 1, push: true, stretch: 0, q } as unknown as Asking;
  await lessonOf(p, answer, full, v, l);
  return { said: lines.flat(), hint: l.hint.value, lines };
}
function* questions(kind: (typeof KINDS)[number], n = 120) {
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as const) for (let s = 1; s <= n; s++) yield makeQuestion(kind, level, stretch, seeded(s * 101 + level * 17 + stretch));
}
const num = (x: number) => `${x}`;

describe('the full lesson after a second miss', () => {
  it('Podium counts the places off from the front and names the right one', async () => {
    for (const q of questions('place')) {
      if (q.kind !== 'place') continue;
      const { said, hint } = await lesson(q, true);
      const to = Number(q.form === 'tap' ? q.place : q.answer);
      const counted = said.filter(s => /^[A-Z][a-z]+\.$/.test(s));
      expect(counted).toEqual(ORDINALS.slice(0, to).map(o => `${o[0]!.toUpperCase()}${o.slice(1)}.`));
      expect(said.at(-1)).toBe(`${ORDINALS[to - 1]![0]!.toUpperCase()}${ORDINALS[to - 1]!.slice(1)} place!`);
      expect(hint).toBe(q.answer);
      if (q.form === 'passes') expect(said).toContain('It passes one car, so it moves up one.');
      if (q.form === 'passed') expect(said).toContain('One car passes it, so it moves back one.');
    }
  });
  it('Faster Car counts the tens (and the ones when the tens are the same) truly, and ends on the right one', async () => {
    for (const q of questions('more')) {
      if (q.kind !== 'more') continue;
      const { lines, hint } = await lesson(q, true);
      const tens = (x: number) => { const t = Math.floor(x / 10); return t === 0 ? [num(x), 'has', 'no tens.'] : [num(x), 'has', num(t), t === 1 ? 'ten.' : 'tens.']; };
      expect(lines[0]).toEqual(tens(q.a));
      expect(lines[1]).toEqual(tens(q.b));
      const sameTens = Math.floor(q.a / 10) === Math.floor(q.b / 10);
      expect(lines.some(l => l.includes('Same tens. Look at the ones.'))).toBe(sameTens);
      if (sameTens) for (const x of [q.a, q.b]) expect(lines).toContainEqual([num(x), 'has', num(x % 10), x % 10 === 1 ? 'one.' : 'ones.']);
      expect(hint).toBe(q.answer);
      const last = lines.at(-1)!;
      if (q.form === 'sign') {
        const word = q.answer === '<' ? 'is less than' : q.answer === '>' ? 'is more than' : 'is the same as';
        expect(last).toEqual([num(q.a), word, num(q.b)]);
        // the open side means nothing when the two numbers are the same
        expect(lines.flat().includes('The open side faces the bigger number.')).toBe(q.answer !== '=');
      } else if (q.form === 'faster') expect(last).toEqual([num(Math.max(q.a, q.b)), 'is more.', 'The bigger number is faster.']);
      else expect(last).toEqual([num(Math.min(q.a, q.b)), 'is less.', 'The smaller number is slower.']);
    }
  });
  it('Tally Board counts the bundles by fives, then the ones, to the right number', async () => {
    for (const q of questions('tally')) {
      if (q.kind !== 'tally') continue;
      const { lines, hint } = await lesson(q, true, q.form === 'make' ? String(Math.max(1, q.n - 1)) : '');
      const last = lines.at(-1)!;
      expect(last).toEqual(['That makes', num(q.n)]);
      const fives = Math.floor(q.n / 5), tail = lines.slice(lines.findLastIndex(l => l[0] === 'Count the bundles by fives.' || l[0] === 'Make a tally that shows') + 1);
      const counted = tail.filter(l => l.length === 1 && /^\d+$/.test(l[0]!)).map(l => Number(l[0]));
      expect(counted).toEqual([...Array.from({ length: fives }, (_, k) => (k + 1) * 5), ...Array.from({ length: q.n % 5 }, (_, k) => fives * 5 + k + 1)]);
      expect(hint).toBe(q.answer);
    }
  });
  it('Race Chart counts what is asked and ends on the right answer: for "how many more", the ones with no partner', async () => {
    for (const q of questions('chart')) {
      if (q.kind !== 'chart') continue;
      const { lines, hint } = await lesson(q, true);
      expect(hint).toBe(q.answer);
      const last = lines.at(-1)!;
      if (q.form === 'more') {
        const big = q.rows.find(r => r.car === q.car)!.wins, small = q.rows.find(r => r.car === q.other)!.wins;
        expect(big).toBeGreaterThan(small);
        expect(last).toEqual([q.answer, 'more.']);
        expect(Number(q.answer)).toBe(big - small);
      } else if (q.form === 'total') expect(last).toEqual(['That makes', q.answer, 'in all.']);
      else if (q.form === 'each') expect(last).toEqual([`The ${q.car} car won`, q.answer]);
      else expect(last).toEqual([`The ${q.answer} car won the ${q.form}.`]);
    }
  });
  it('Line Up drops the numbers on the line in order, or names the one between', async () => {
    for (const q of questions('order')) {
      if (q.kind !== 'order') continue;
      const { lines, hint } = await lesson(q, true);
      if (q.form === 'between') {
        expect(lines.at(-1)).toEqual([q.answer, 'is between', num(q.lo), 'and', num(q.hi)]);
        expect(Number(q.answer)).toBeGreaterThan(q.lo); expect(Number(q.answer)).toBeLessThan(q.hi);
        expect(hint).toBe(q.answer);
      } else {
        expect(lines.filter(l => l.length === 1 && /^\d+$/.test(l[0]!)).map(l => l[0])).toEqual(q.answer.split(','));
        expect(hint).toBe(q.answer.split(',')[0]);
      }
    }
  });
});

describe('the pointer after a first miss', () => {
  it('is one line, and true for the question', async () => {
    for (const kind of KINDS) for (const q of questions(kind, 40)) {
      const { lines } = await lesson(q, false);
      expect(lines.length).toBe(1);
      const line = lines[0]!.join(' ');
      if (q.kind === 'tally' && q.form !== 'make' && q.n < 5) expect(line).not.toMatch(/bundle/);
      if (q.kind === 'more' && q.answer === '=') expect(line).not.toMatch(/open side/);
    }
  });
});
