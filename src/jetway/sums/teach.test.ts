// The lessons for a miss say true things about the question they explain, show the regrouping on the mat, wait for the arrow at each
// step of the fuller walk-through, and end on the right answer. Each lesson runs against a voice that only writes down what it would say,
// for thousands of generated questions of every kind, Level and Stretch; the arrow is tapped by the test as soon as it's waited on.
import { describe, expect, it } from 'vitest';
import { effect } from '@preact/signals';
import { seeded } from '../../game/rng';
import type { Asking } from '../mix';
import type { VoiceScope } from '../voice';
import { sayNum } from '../phrases';
import { lessonFor, lessonOf, type Mat } from './teach';
import { carries, digitsOf, KINDS, makeQuestion, type Level, type Question } from './problems';

async function lesson(q: Question, full: boolean, answer = '') {
  const lines: string[][] = [], controller = new AbortController(), mats: Mat[] = [];
  const v = {
    active: true, signal: controller.signal, cancel() {}, hush() {},
    say: async (...items: unknown[]) => { lines.push(items.map(String)); },
    sayMore: async (...items: unknown[]) => { lines.push(items.map(String)); },
    wait: async () => {},
  } as unknown as VoiceScope;
  const l = lessonFor(controller.signal);
  let steps = 0;
  const stop = effect(() => { if (l.waiting.value) { steps++; queueMicrotask(() => l.advance()); } });
  const stopMats = effect(() => { if (l.mat.value) mats.push(l.mat.value); });
  const p = { mode: q.kind, level: 1, push: true, stretch: 0, q } as unknown as Asking;
  await lessonOf(p, answer, full, v, l);
  stop(); stopMats();
  return { said: lines.flat(), hint: l.hint.value, steps, mats };
}
function* questions(kind: (typeof KINDS)[number], n = 60) {
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as const) for (let s = 1; s <= n; s++) yield makeQuestion(kind, level, stretch, seeded(s * 101 + level * 17 + stretch));
}
const count = (m: Mat) => m.h.filter(p => !p.gone).length * 100 + m.t.filter(p => !p.gone).length * 10 + m.o.filter(p => !p.gone).length;

describe('the fuller lesson after a second miss', () => {
  for (const kind of KINDS) {
    it(`${kind}: walks through step by step, waiting on the arrow, and ends on the right answer`, async () => {
      for (const q of questions(kind)) {
        const { hint, steps } = await lesson(q, true);
        expect(hint, JSON.stringify(q)).toBe(q.kind === 'hop' && q.form === 'two' ? q.answer : q.answer);
        if (!(q.kind === 'gap' && Number(q.answer) < 10 && q.target === Math.ceil(q.a / 10) * 10)) expect(steps, JSON.stringify(q)).toBeGreaterThan(0);
      }
    });
  }
  it('Boarding: the ones go together, ten of them make a new ten that moves to the tens, and the mat ends on the sum', async () => {
    for (const q of questions('add')) {
      if (q.kind !== 'add') continue;
      const { said, mats } = await lesson(q, true);
      expect(said).toContain('Add the ones first.');
      if (carries(q.a, q.b)) { expect(said).toContain('Ten ones make a new ten.'); expect(said).toContain('The new ten goes with the tens.'); }
      else expect(said).not.toContain('Ten ones make a new ten.');
      const last = mats.at(-1)!;
      expect(count(last)).toBe(q.a + q.b);
      expect(last.o.length).toBeLessThan(10);
      expect(last.t.length).toBeLessThan(10);
      const d = digitsOf(q.a + q.b);
      expect(last.digits?.o).toBe(d.o); expect(last.digits?.t).toBe(d.t);
    }
  });
  it('Unload: breaks a ten when there are not enough ones (and a hundred when it must), and what is left is the answer', async () => {
    for (const q of questions('take')) {
      if (q.kind !== 'take') continue;
      const { said, mats } = await lesson(q, true);
      if (q.a % 10 < q.b % 10) expect(said).toContain('Break a ten.'); else expect(said).not.toContain('Break a ten.');
      expect(count(mats.at(-1)!)).toBe(q.a - q.b);
    }
  });
  it('Missing Bags: hops to the next ten, then to the target, and adds the hops', async () => {
    for (const q of questions('gap')) {
      if (q.kind !== 'gap') continue;
      const { said } = await lesson(q, true);
      expect(said[0]).toBe('Hop to the next ten.');
      expect(said.at(-1)).toBe(q.answer);
    }
  });
  it('Jumbo builds the number hundreds first, and says each place', async () => {
    for (const q of questions('hundreds')) {
      if (q.kind !== 'hundreds' || q.form !== 'read') continue;
      const { said } = await lesson(q, true);
      const d = digitsOf(q.n);
      expect(said.indexOf(d.h === 1 ? 'hundred.' : 'hundreds.')).toBeLessThan(said.indexOf(d.t === 1 ? 'ten.' : d.t === 0 ? 'No tens, so the tens digit is zero.' : 'tens.'));
    }
  });
});

describe('the first miss', () => {
  it('points at the real mistake: the ten not carried, or not enough ones', async () => {
    for (const q of questions('add')) if (q.kind === 'add' && q.traps.noCarry !== null) {
      expect((await lesson(q, false, String(q.traps.noCarry))).said).toEqual(["Don't forget the new ten!"]);
    }
    for (const q of questions('take')) if (q.kind === 'take' && q.traps.smallFromBig !== null) {
      expect((await lesson(q, false, String(q.traps.smallFromBig))).said).toEqual(['Not enough ones? Break a ten.']);
    }
  });
  it('never waits on the arrow, and shows the picture', async () => {
    // one line, or two for a hop across a hundred ("Ten more.", "Ten tens make a hundred.")
    for (const kind of KINDS) for (const q of questions(kind, 10)) { const r = await lesson(q, false); expect(r.steps).toBe(0); expect(r.said.length).toBeGreaterThan(0); expect(r.said.length).toBeLessThanOrEqual(2); }
  });
});

// Pass 2: the lessons say true things for the very sum on screen, not only the right answer at the end.
const run = (said: string[], ...seq: string[]) => said.some((_, i) => seq.every((x, k) => said[i + k] === x));
describe('what the lessons say is true for this sum', () => {
  it('Boarding names this sum\'s own ones ("8 and 5 make 13") and only makes a hundred when the tens reach ten', async () => {
    for (const q of questions('add')) if (q.kind === 'add') {
      const { said } = await lesson(q, true), a = digitsOf(q.a), b = digitsOf(q.b), o = a.o + b.o;
      expect(run(said, String(a.o), 'and', String(b.o), 'make', String(o)), `${q.a} + ${q.b}: ${said.join(' ')}`).toBe(true);
      if (o >= 10) expect(run(said, 'That is one ten and', String(o - 10))).toBe(true);
      const tens = a.t + b.t + (o >= 10 ? 1 : 0);
      expect(said.includes('Ten tens make a hundred.')).toBe(tens >= 10);
      expect(said.slice(-sayNum(q.a + q.b).length - 1)).toEqual(['That makes', ...sayNum(q.a + q.b)]);
    }
  });
  it('Unload says how many ones there are and how many to take, breaks a hundred first when there are no tens (100 - 36), and never says "Take away 0"', async () => {
    for (const q of questions('take')) if (q.kind === 'take') {
      const { said } = await lesson(q, true), a = digitsOf(q.a), b = digitsOf(q.b);
      if (a.o < b.o) expect(run(said, 'You need to take', String(b.o), 'and there are only', String(a.o)), `${q.a} - ${q.b}`).toBe(true);
      else expect(said).not.toContain('You need to take');
      if (a.o < b.o && a.t === 0) expect(said.indexOf('Break a hundred.')).toBeLessThan(said.indexOf('Break a ten.'));
      expect(run(said, 'Take away', '0')).toBe(false);
    }
    const hundred = makeQuestion('take', 3, 1, seeded(1));
    const q = { ...hundred, a: 100, b: 36, answer: '64' } as Question;
    const { said } = await lesson(q, true);
    expect(said).toEqual(expect.arrayContaining(['Break a hundred.', 'Break a ten.']));
    expect(said.at(-1)).toBe('64');
  });
  it('Ten Hops never says the tens digit goes up or down one when the hop crosses a hundred (93 + 10, 104 - 10)', async () => {
    for (const q of questions('hop', 120)) if (q.kind === 'hop' && q.form === 'step') {
      const { said } = await lesson(q, true), crosses = Math.floor(q.n / 100) !== Math.floor((q.n + q.step) / 100);
      if (Math.abs(q.step) === 10 && crosses) {
        expect(said.join(' ')).not.toMatch(/tens digit goes (up|down) one/);
        expect(said).toContain(q.step > 0 ? 'Ten tens make a hundred.' : 'No tens, so break a hundred.');
        if (q.step < 0) expect(digitsOf(q.n).t).toBe(0);
        else expect(digitsOf(q.n).t).toBe(9);
      }
      const to = sayNum(q.n + q.step);
      expect(said.slice(-to.length - 1)).toEqual(['That makes', ...to]);
    }
    for (const [n, step] of [[93, 10], [104, -10], [195, 10], [200, -10], [503, -10], [495, 10]] as const) {
      const q = { ...makeQuestion('hop', 1, 1, seeded(1)), form: 'step', n, step, answer: String(n + step) } as Question;
      expect((await lesson(q, true)).said.join(' ')).not.toMatch(/tens digit goes/);
    }
  });
  it('Ten Hops in two hops names this sum\'s tens and ones ("47 plus 30 lands on 77")', async () => {
    for (const q of questions('hop')) if (q.kind === 'hop' && q.form === 'two') {
      const { said } = await lesson(q, true), t = Math.floor(q.b / 10) * 10, w = q.op === '+' ? 'plus' : 'take away';
      expect(run(said, String(q.a), w, String(t), 'lands on', String(q.first)), JSON.stringify(q)).toBe(true);
      expect(run(said, String(q.first), w, String(q.b % 10), 'lands on', String(q.second))).toBe(true);
    }
  });
});
