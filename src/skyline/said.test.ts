// What he hears is what he sees: every question's spoken line names the numbers in its picture, and the right answer is the one
// those numbers make. A question that said "3 buses, 5 on each" over a picture of 4 buses, or whose answer didn't follow from what
// was said, would teach the wrong thing however many right answers the problem tests count. Also: wherever "times" is said, "rows
// of" or "groups of" is said with it (the brief: the × sign is always said that way, "times" only added from Times Level 2).
import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Stretch } from '../modes/progress';
import { makeQuestion, timesCard, type Kind, type Level, type Question } from './math/problems';
import { promptOf } from './views';

const KINDS: Kind[] = ['groups', 'array', 'pair', 'count', 'share', 'times'];
function* every(per = 300) {
  const rng = seeded(97);
  for (const kind of KINDS) for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as Stretch[]) for (let i = 0; i < per; i++) yield { q: makeQuestion(kind, level, stretch, rng), level };
}
/** The numbers said, in order. */
const numbersSaid = (q: Question) => (promptOf(q).speech as string[]).filter(p => /^\d+$/.test(p)).map(Number);

describe('the spoken question matches the picture and the answer', () => {
  it('every kind and form', () => {
    for (const { q } of every()) {
      const said = numbersSaid(q), at = JSON.stringify(q);
      switch (q.kind) {
        case 'groups':
          if (q.form === 'same') { expect(said, at).toEqual([]); expect(q.answer).toBe(q.buses.every(b => b === q.buses[0]) ? 'yes' : 'no'); }
          else if (q.form === 'buses' || q.form === 'each') { expect(said, at).toEqual([]); expect(Number(q.answer)).toBe(q.form === 'buses' ? q.groups : q.each); }
          else if (q.form === 'pick') {
            expect(said, at).toEqual([q.groups, q.each]);
            expect(q.pictures[Number(q.answer)]).toEqual(Array.from({ length: q.groups }, () => q.each));
          } else { expect(said, at).toEqual([q.groups, q.each]); expect(Number(q.answer)).toBe(q.groups * q.each); }
          break;
        case 'array':
          if (q.form === 'turn') {
            expect(said, at).toEqual([q.rows, q.cols, q.other.rows, q.other.cols]);
            expect(q.answer).toBe(q.rows * q.cols === q.other.rows * q.other.cols ? 'yes' : 'no');
          } else {
            expect(said, at).toEqual([]);
            const want = q.form === 'rows' ? String(q.rows) : q.form === 'cols' ? String(q.cols) : q.form === 'total' ? String(q.rows * q.cols) : Array.from({ length: q.rows }, () => q.cols).join(' + ');
            expect(q.answer, at).toBe(want);
          }
          break;
        case 'pair':
          if (q.form === 'partner') { expect(said).toEqual([]); expect(q.answer).toBe(q.n % 2 ? 'no' : 'yes'); }
          else if (q.form === 'oddEven') { expect(said, at).toEqual(q.picture ? [] : [q.n]); expect(q.answer).toBe(q.n % 2 ? 'odd' : 'even'); }
          else if (q.form === 'which') { expect(said).toEqual([]); expect(Number(q.answer) % 2).toBe(q.want === 'even' ? 0 : 1); }
          else { expect(said, at).toEqual([q.n]); expect(Number(q.answer) * 2).toBe(q.n); }
          break;
        case 'count': {
          expect(said, at).toEqual([]);
          const all = q.shown.map(x => x ?? Number(q.answer));
          for (let i = 1; i < all.length; i++) expect(all[i]! - all[i - 1]!, at).toBe(q.step);
          expect(promptOf(q).speech[0], at).toBe({ 100: 'Count by hundreds.', 10: 'Count by tens.', 5: 'Count by fives.', 3: 'Count by threes.', 4: 'Count by fours.' }[q.step]);
          expect(promptOf(q).speech[1]).toBe(q.shown.at(-1) === null ? 'What number comes next?' : 'What number is missing?');
          break;
        }
        case 'share':
          if (q.form === 'trucks') { expect(said, at).toEqual([q.total, q.each]); expect(Number(q.answer) * q.each).toBe(q.total); }
          else { expect(said, at).toEqual([q.total, q.trucks]); expect(Number(q.answer) * q.trucks).toBe(q.total); }
          break;
        case 'times':
          if (q.form === 'match') { expect(said, at).toEqual([q.rows, q.cols]); expect(q.pictures[Number(q.answer)]).toEqual({ rows: q.rows, cols: q.cols }); }
          else if (q.form === 'write') { expect(said).toEqual([]); expect(q.answer).toBe(timesCard(q.rows, q.cols)); }
          else if (q.form === 'fact') { expect(said, at).toEqual([q.a, q.b, q.a, q.b]); expect(Number(q.answer)).toBe(q.a * q.b); }
          else { expect(said.slice(0, 2), at).toEqual([q.a, q.b]); expect(q.answer).toBe(timesCard(q.b, q.a)); }
          break;
      }
    }
  });
  it('"times" is never said without "rows of" or "groups of", and never below Times Level 2', () => {
    for (const { q, level } of every(200)) {
      const said = promptOf(q).speech as string[];
      if (!said.includes('times')) continue;
      expect(q.kind).toBe('times');
      expect(level).toBeGreaterThanOrEqual(2);
      expect(said.includes('rows of') || said.includes('groups of'), JSON.stringify(q)).toBe(true);
    }
  });
});
