// What he hears is what he sees: every sentence of every story is said from recorded pieces, its numbers are the numbers on the card,
// and the question about the graph names the bars it asks about. A line the voice can't say would be silence on the iPad.
import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Stretch } from '../modes/progress';
import { PHRASES } from './phrases';
import { KINDS, makeQuestion, type Level } from './stories/problems';
import { speechOf } from './stories/teach';
import { boardSpeech, boardText } from './views';

const phrases = new Set<string>(PHRASES);
function* every(per = 120) {
  const rng = seeded(31);
  for (const kind of KINDS) for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as Stretch[]) for (let i = 0; i < per; i++) yield makeQuestion(kind, level, stretch, rng);
}

describe('every spoken line', () => {
  it('is made of recorded pieces, and says the numbers shown, in order', () => {
    for (const q of every()) {
      if (q.kind === 'board') {
        for (const p of boardSpeech(q)) expect(phrases.has(p as string), p as string).toBe(true);
        for (const i of q.asked) expect(boardText(q)).toContain(`${q.squads[i]} Squadron`);
        continue;
      }
      const sentences = q.kind === 'two' ? [...q.story.sentences, q.story.middleQuestion] : q.story.sentences;
      for (const s of sentences) {
        const speech = speechOf(s);
        for (const p of speech) expect(phrases.has(p as string), `${p} in "${s.text}"`).toBe(true);
        expect(speech.filter(p => /^\d+$/.test(p as string)).map(Number)).toEqual((s.text.match(/\d+/g) ?? []).map(Number));
      }
    }
  });
});
