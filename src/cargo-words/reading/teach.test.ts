// The lessons for a miss, run against a voice that only writes down what it would say, for thousands of generated questions of every
// kind, Level and Stretch: the short lesson says the brief's lines and lights the right answer; the fuller one waits for him to tap each
// container in turn (the test taps the one that pulses) and then does the same. Read It's 🔎 before he answers never says the word.
import { describe, expect, it } from 'vitest';
import { effect } from '@preact/signals';
import { seeded } from '../../game/rng';
import type { Asking } from '../mix';
import { PHRASES, syl } from '../phrases';
import type { VoiceScope } from '../voice';
import { KINDS, makeQuestion, rightAnswer, type Level, type Question } from './problems';
import { lessonFor, lessonOf } from './teach';

async function lesson(q: Question, full: boolean, answered = true) {
  const lines: string[] = [], controller = new AbortController();
  const v = {
    active: true, signal: controller.signal, cancel() {}, hush() {},
    say: async (...items: unknown[]) => { lines.push(...items.map(String)); },
    sayMore: async (...items: unknown[]) => { lines.push(...items.map(String)); },
    wait: async () => {},
  } as unknown as VoiceScope;
  const l = lessonFor(controller.signal);
  let taps = 0;
  const stop = effect(() => { const i = l.tapNext.value; if (i !== null) { taps++; queueMicrotask(() => l.tapped(i)); } });
  await lessonOf({ mode: q.kind, level: 1, push: true, stretch: 0, q } as unknown as Asking, '', full, v, l, answered);
  stop();
  return { said: lines, hint: l.hint.value, taps, row: l.row.value };
}
function* questions(kind: (typeof KINDS)[number], n = 40) {
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as const) for (let s = 1; s <= n; s++) yield makeQuestion(kind, level, stretch, seeded(s * 101 + level * 17 + stretch));
}
const recorded = new Set<string>(PHRASES);

describe('the lessons', () => {
  for (const kind of KINDS) {
    it(`${kind}: the short lesson lights the answer and says only recorded lines; the fuller one waits for a tap on each container`, async () => {
      for (const q of questions(kind)) {
        const short = await lesson(q, false);
        for (const s of short.said) expect(recorded.has(s), s).toBe(true);
        const right = rightAnswer(q);
        expect(short.hint === right || (q.kind === 'build' || (q.kind === 'r' && q.form === 'build') ? short.hint === q.syls[0] : false), `${q.kind} ${q.word}`).toBe(true);
        const full = await lesson(q, true);
        expect(full.taps, q.word).toBe(q.syls.length);
        expect(full.said).toContain('Tap each container to hear it.');
        // (pass 2: the fuller lesson's lines weren't checked, and Add-Ons' base word was said as a syllable clip that doesn't exist, "(happy)")
        for (const s of full.said) expect(recorded.has(s), `${q.word}: ${s}`).toBe(true);
        for (const s of q.syls) expect(full.said).toContain(q.kind === 'addon' && s === q.add.base ? s : syl(s));
      }
    });
  }
  it('How Many Containers says each beat then the number ("Rab. Bit. Two.")', async () => {
    for (const q of questions('count', 10)) {
      const { said } = await lesson(q, false);
      expect(said.slice(-1 - 1)).toContain(['One.', 'Two.', 'Three.', 'Four.'][q.syls.length - 1]);
    }
  });
  it('Split It says the reason for its break, then gives the word back to cut (found in the browser tour)', async () => {
    for (const q of questions('split', 10)) if (q.kind === 'split') {
      const { said, row } = await lesson(q, false);
      expect(row).toBeNull();
      expect(said.some(s => /Split|takes the letter|Keep the next letter|stays with it/.test(s))).toBe(true);
    }
  });
  it('Bossy R lights the vowel and its r as one sound', async () => {
    for (const q of questions('r', 10)) { const { said } = await lesson(q, false); expect(said.some(s => / and r say /.test(s))).toBe(true); }
  });
  it('Add-Ons say what the add-on means ("Un means not.") and what the word means', async () => {
    for (const q of questions('addon', 10)) if (q.kind === 'addon') {
      const { said } = await lesson(q, false);
      expect(said.some(s => / means /.test(s))).toBe(true);
    }
  });
  it('🔎 on Read It before he answers never says the word', async () => {
    for (const q of [...questions('read', 10), ...questions('r', 10)]) if (q.kind === 'read' || (q.kind === 'r' && q.form === 'read')) {
      const { said, hint } = await lesson(q, true, false);
      expect(said, q.word).not.toContain(q.word);
      expect(hint).toBeNull();
    }
  });
});
