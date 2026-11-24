// The lessons: every line they say is recorded; Read the Mail's lesson lights and reads the sentence that holds the answer; What Came
// Next's says the story in order with first, next, then and last; Big Idea's lights every sentence about the idea; Clue Finder's lights
// each clue.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { PASSAGES } from '../mail/index';
import { PHRASES } from '../phrases';
import type { Asking } from '../mix';
import { questionFor } from './problems';
import { lessonClips, shortLesson } from './teach';

const all = (): Asking[] => {
  const rng = seeded(1);
  return PASSAGES.flatMap(p => p.qs.map((_, qi) => ({ mode: p.kind, level: p.level, push: true, q: questionFor(p, qi, rng) }) as Asking));
};
const recorded = new Set<string>(PHRASES);

describe('teaching a miss', () => {
  it('every line a lesson says is recorded', () => {
    const missing = new Set<string>();
    for (const a of all()) for (const c of lessonClips(a)) if (!recorded.has(c)) missing.add(c);
    expect([...missing]).toEqual([]);
  });
  it('Read the Mail and the Fact File light and read the sentence that holds the answer, then say the answer', () => {
    for (const a of all().filter(a => a.mode === 'ask' || (a.mode === 'fact' && a.level < 3))) {
      const p = PASSAGES.find(x => x.id === a.q.pid)!, qq = p.qs[a.q.qi]!, steps = shortLesson(a);
      for (const i of qq.at) expect(steps.some(s => s.say.includes('It says:') && s.say.includes(p.lines[i]! as never) && s.lit?.includes(i))).toBe(true);
      expect(steps.at(-1)!.hint).toBe(qq.right);
    }
  });
  it('What Came Next says the story in order, first to last', () => {
    for (const a of all().filter(a => a.mode === 'order')) {
      const p = PASSAGES.find(x => x.id === a.q.pid)!, said = shortLesson(a).flatMap(s => s.say).filter(x => p.lines.includes(x));
      expect(said).toEqual(p.lines);
      // each line is said with its word once: "First," then the line, or a line that already starts "First, ..." on its own
      const steps = shortLesson(a).filter(s => s.lit), words = ['First,', 'Next,', 'Then,', 'Last,'];
      for (const s of steps) {
        const spoken = s.say.join(' ');
        expect(words.some(w => spoken.startsWith(w)), spoken).toBe(true);
        expect(words.filter(w => spoken.split(' ').includes(w)).length, spoken).toBe(1);
      }
      expect(steps[0]!.say.join(' ').startsWith('First,')).toBe(true);
      expect(steps.at(-1)!.say.join(' ').startsWith('Last,')).toBe(true);
    }
  });
  it('Big Idea points every sentence about the idea at it, and the odd one out says it is not', () => {
    for (const a of all().filter(a => a.mode === 'main' && a.q.qi === 0)) {
      const p = PASSAGES.find(x => x.id === a.q.pid)!, steps = shortLesson(a);
      expect(steps.some(s => s.say.includes(p.topic! as never))).toBe(true);
      if (p.odd !== undefined) expect(steps.at(-1)!.lit).toEqual([p.odd]);
    }
  });
  it('Clue Finder lights each clue in turn, then says the thinking', () => {
    for (const a of all().filter(a => a.mode === 'infer' && a.q.qi === 0)) {
      const p = PASSAGES.find(x => x.id === a.q.pid)!, qq = p.qs[0]!, steps = shortLesson(a);
      expect(steps.filter(s => s.clue).map(s => s.clue)).toEqual(qq.clues);
      expect(steps.at(-1)!.say).toEqual([qq.think]);
    }
  });
});
