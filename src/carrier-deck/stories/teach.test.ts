// Every lesson runs to its end on thousands of questions: the fuller one waits on the arrow and ends with the right answer glowing, the
// deck acts a story out with the story's own numbers, and the bar picture and number sentence it ends on find the answer.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import type { Asking } from '../mix';
import type { VoiceScope } from '../voice';
import { KINDS, makeQuestion, solve, type Level } from './problems';
import { barsOf, deckSteps, findEq, lessonFor, lessonOf } from './teach';

/** A voice that says everything at once, and a child who taps the arrow as soon as it shows. */
function quiet(): VoiceScope {
  const c = new AbortController();
  return { active: true, signal: c.signal, say: async () => {}, sayMore: async () => {}, wait: async () => {}, cancel: () => c.abort() } as unknown as VoiceScope;
}
async function run(p: Asking, full: boolean) {
  const life = new AbortController(), lesson = lessonFor(life.signal), v = quiet();
  let taps = 0;
  const stop = lesson.waiting.subscribe(w => { if (w) { taps++; queueMicrotask(() => lesson.advance()); } });
  await lessonOf(p, '', full, v, lesson);
  stop();
  return { lesson, taps };
}

describe('the lessons', () => {
  it('the fuller lesson waits on the arrow and ends with the right answer glowing, for every kind, Level and Stretch', async () => {
    const rng = seeded(8);
    for (const kind of KINDS) for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as Stretch[]) for (let i = 0; i < 25; i++) {
      const q = makeQuestion(kind, level, stretch, rng), p = { mode: kind, level, push: true, stretch, q } as Asking;
      const full = await run(p, true);
      expect(full.lesson.hint.value, JSON.stringify(q)).toBe(q.answer);
      if (kind !== 'board' || q.kind !== 'board' || q.form !== 'read') expect(full.taps, kind).toBeGreaterThan(0);
      await run(p, false); // the first-miss lesson runs to its end too
    }
  });
  it('acts a one-step story out with its own numbers, and its bar picture and number sentence find the answer', () => {
    const rng = seeded(12);
    for (const kind of ['one', 'compare'] as const) for (const level of [1, 2, 3] as Level[]) for (let i = 0; i < 200; i++) {
      const q = makeQuestion(kind, level, 2, rng);
      if (q.kind !== 'one' && q.kind !== 'compare') continue;
      const s = q.story;
      expect(solve(findEq(s)), JSON.stringify(s)).toBe(s.answer);
      const b = barsOf(s), unknown = [b.whole, b.parts[0].n, b.parts[1].n].filter(x => x === null).length;
      expect(unknown).toBe(1);
      if (s.shape !== 'cmp') {
        const steps = deckSteps(s), last = steps.at(-1)!;
        expect(steps.length).toBeGreaterThan(0);
        // the deck at the end holds the story's whole: what was there and what came, or what's left and what went
        const shown = last.groups.reduce((n, g) => n + g.n, 0), whole = s.shape === 'join' ? s.nums['#e']! : s.shape === 'sep' ? s.nums['#s']! : s.nums['#w']!;
        expect(shown, JSON.stringify(s)).toBe(whole);
      }
    }
  });
});
