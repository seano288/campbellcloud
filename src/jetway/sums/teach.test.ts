// The lessons for a miss say true things about the question they explain, show the regrouping on the mat, wait for the arrow at each
// step of the fuller walk-through, and end on the right answer. Each lesson runs against a voice that only writes down what it would say,
// for thousands of generated questions of every kind, Level and Stretch; the arrow is tapped by the test as soon as it's waited on.
import { describe, expect, it } from 'vitest';
import { effect } from '@preact/signals';
import { seeded } from '../../game/rng';
import type { Asking } from '../mix';
import type { VoiceScope } from '../voice';
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
    for (const kind of KINDS) for (const q of questions(kind, 10)) { const r = await lesson(q, false); expect(r.steps).toBe(0); expect(r.said.length).toBe(1); }
  });
});
