// The lessons for a miss, run against a voice that only writes down what it would say: every question of every kind and Level, missed
// with every wrong answer it has, then the fuller lesson. Everything said is a recorded line, the right answer is lit, and a lesson never
// tells him the word he tapped is the right kind (pass 2: the word clips were cut to the ones a lesson can say, so this is what keeps a
// word he hears from going silent).
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { MODE_IDS } from '../learning';
import { PHRASES } from '../phrases';
import type { VoiceScope } from '../voice';
import { isRightAnswer, makeQuestion, possibleAnswers, type Level, type Question } from './problems';
import { fuller, lessonFor, lessonOf } from './teach';
import { TERMS } from '../words/terms';

function voice() {
  const said: string[] = [], controller = new AbortController();
  const v = {
    active: true, signal: controller.signal, cancel() {}, hush() {},
    say: async (...items: unknown[]) => { said.push(...items.map(String)); },
    sayMore: async (...items: unknown[]) => { said.push(...items.map(String)); },
    wait: async () => {},
  } as unknown as VoiceScope;
  return { v, said, signal: controller.signal };
}
async function lesson(q: Question, answer: string, full: boolean) {
  const { v, said, signal } = voice(), l = lessonFor(signal);
  await lessonOf(q, answer, l, v);
  const hint = l.hint.value;
  if (full) await fuller(q, l, v);
  return { said, hint };
}
const recorded = new Set<string>(PHRASES);
const questions = function* (kind: (typeof MODE_IDS)[number], level: Level, n = 150) {
  const rng = seeded(kind.length * 53 + level * 7);
  for (let i = 0; i < n; i++) yield makeQuestion(kind, level, rng);
};

describe('the lessons', () => {
  for (const kind of MODE_IDS) for (const level of [1, 2, 3] as Level[]) {
    it(`${kind} Level ${level}: every miss says only recorded lines and lights the right answer`, async () => {
      for (const q of questions(kind, level)) {
        const wrongs = possibleAnswers(q).filter(a => !isRightAnswer(q, a));
        for (const answer of wrongs.length ? wrongs : ['']) {
          const { said, hint } = await lesson(q, answer, true);
          for (const s of said) expect(recorded.has(s), `${q.topic} (${answer}): "${s}"`).toBe(true);
          expect(said.length, q.topic).toBeGreaterThan(0);
          // Big Letters Level 3 lights each word in turn and ends on the second; everything else lights its answer
          if (q.answer !== 'done') expect(hint, q.topic).toBe(q.answer);
        }
      }
    });
  }
  it('a wrong word is never called the kind he was asked for', async () => {
    for (const kind of ['noun', 'verb', 'adj'] as const) for (const level of [1, 2] as Level[]) for (const q of questions(kind, level, 80)) {
      for (const answer of possibleAnswers(q).filter(a => !isRightAnswer(q, a))) {
        const { said } = await lesson(q, answer, false);
        // "So it is a noun." comes once, after the right word
        expect(said.filter(s => s === TERMS[kind].so), q.topic).toHaveLength(1);
      }
    }
  });
  it('a Squeeze lesson says the apostrophe line, except for won\'t, which does not just drop letters', async () => {
    for (const level of [1, 2, 3] as Level[]) for (const q of questions('squeeze', level, 60)) {
      const { said } = await lesson(q, possibleAnswers(q).find(a => !isRightAnswer(q, a)) ?? '', false);
      const wont = /won't/i.test(q.answer) || (q.stage.type === 'apostrophe' && q.stage.word === "won't") || (q.stage.type === 'squeeze' && q.stage.show === "won't");
      expect(said.includes("Will not squeezes into won't."), q.topic).toBe(wont);
      expect(said.includes('The apostrophe goes where the letters came out.'), q.topic).toBe(!wont);
    }
  });
});
