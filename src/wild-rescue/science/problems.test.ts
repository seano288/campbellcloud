// Every generated question, for every kind, Level and Stretch over many seeds: exactly one right answer among its choices, every
// wrong choice plainly wrong by the facts tables, and the form its Level asks for.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { animal, arguable, poleOf } from '../facts/animals';
import { BABIES, DIFFERENT_TRUE, SAME_ALWAYS, SAME_DIFFERENT } from '../facts/babies';
import { VERY_DIFFERENT } from '../facts/habitats';
import { LIVING, NEED_ASKS, NOT_LIVING, SCENES } from '../facts/living';
import { ALSO_USES, DIAGRAMS, WHYS } from '../facts/parts';
import { BEFORE, SUN_WHEN, WEAR } from '../facts/sky';
import { isAnswer, KINDS, makeQuestion, needsAnswer, OPPOSITE, rightAnswer, type Kind, type Level, type Question } from './problems';

const SEEDS = 200;
function* every(kind: Kind) {
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as Stretch[]) for (let seed = 1; seed <= SEEDS; seed++) {
    yield { level, stretch, q: makeQuestion(kind, level, stretch, seeded(seed * 7919 + level * 31 + stretch)) };
  }
}
const choicesOf = (q: Question) => ('choices' in q ? (q.choices as readonly string[]) : []);

describe('every question', () => {
  it('has distinct choices with its answer among them, and the answer is an answer', () => {
    for (const kind of KINDS) for (const { q } of every(kind)) {
      const c = choicesOf(q);
      expect(new Set(c).size, JSON.stringify(q)).toBe(c.length);
      if (!(q.kind === 'parts' && q.form === 'tap') && !(q.kind === 'alive' && q.form === 'needs')) expect(c).toContain(q.answer);
      expect(isAnswer(q, rightAnswer(q))).toBe(true);
    }
  });
});

describe('Where It Lives', () => {
  it('asks Level 1 with two very different habitats, Level 2 with three or four, Level 3 "which also lives here"', () => {
    for (const { level, stretch, q } of every('home')) {
      if (q.kind !== 'home') throw new Error();
      if (level === 3) { expect(q.form).toBe('also'); continue; }
      if (q.form !== 'where') throw new Error('form');
      const a = animal(q.animal);
      expect(q.answer).toBe(a.home);
      expect(q.choices.length).toBe(level === 1 ? 2 : stretch === 2 ? 4 : 3);
      // every other habitat offered is plainly wrong for it
      for (const h of q.choices) if (h !== q.answer) { expect(arguable(a, h), `${a.id} ${h}`).toBe(false); if (level === 1) expect(VERY_DIFFERENT[a.home!]).toContain(h); }
    }
  });
  it('offers exactly one animal that also lives there, never a penguin with a polar bear, and wrong ones that plainly do not', () => {
    for (const { q } of every('home')) {
      if (q.kind !== 'home' || q.form !== 'also') continue;
      const subject = animal(q.subject);
      expect(q.choices).toHaveLength(3);
      expect(q.choices).not.toContain(q.subject);
      const right = animal(q.answer);
      expect(right.home).toBe(q.habitat);
      expect(poleOf(right)).toBe(poleOf(subject));
      for (const id of q.choices) if (id !== q.answer) expect(arguable(animal(id), q.habitat), `${id} in ${q.habitat}`).toBe(false);
      expect(['penguin', 'polarbear'].every(x => [q.subject, ...q.choices].includes(x as never))).toBe(false);
    }
  });
});

describe('Animal Parts', () => {
  it('taps a part on the drawing at Level 1, asks why at Level 2 and which animal also at Level 3', () => {
    for (const { level, q } of every('parts')) {
      if (q.kind !== 'parts') throw new Error();
      expect(q.form).toBe(level === 1 ? 'tap' : level === 2 ? 'why' : 'also');
      if (q.form === 'tap') expect(DIAGRAMS[q.diagram]!.parts as readonly string[]).toContain(q.answer);
      if (q.form === 'why') { const w = WHYS[q.why]!; expect(q.choices).toHaveLength(3); for (const c of q.choices) if (c !== w.right) expect(w.wrong as readonly string[]).toContain(c); }
      if (q.form === 'also') { const u = ALSO_USES[q.item]!; expect(q.choices).toHaveLength(3); for (const c of q.choices) if (c !== u.right) expect(u.wrong as readonly string[]).toContain(c); }
    }
  });
});

describe('Alive or Not', () => {
  it('shows exactly one living thing at Level 1, two to four in all', () => {
    for (const { level, stretch, q } of every('alive')) {
      if (q.kind !== 'alive') throw new Error();
      expect(q.form).toBe(level === 1 ? 'living' : level === 2 ? 'needs' : 'missing');
      if (q.form !== 'living') continue;
      expect(q.choices).toHaveLength(stretch + 2);
      expect(q.choices.filter(c => LIVING.some(t => t.id === c))).toEqual([q.answer]);
      expect(q.choices.filter(c => NOT_LIVING.some(t => t.id === c))).toHaveLength(stretch + 1);
    }
  });
  it('wants every need and nothing else at Level 2, and one missing need at Level 3', () => {
    for (const { q } of every('alive')) {
      if (q.kind !== 'alive') throw new Error();
      if (q.form === 'needs') {
        const ask = NEED_ASKS[q.subject];
        expect(q.answer).toBe(needsAnswer(ask.right));
        for (const r of ask.right) expect(q.choices).toContain(r);
        expect(q.choices.length).toBeGreaterThan(ask.right.length);
        // a set short of one need, or with one extra, is not the answer
        expect(needsAnswer(ask.right.slice(1))).not.toBe(q.answer);
      }
      if (q.form === 'missing') { const s = SCENES[q.scene]!; expect([...q.choices].sort()).toEqual([s.right, ...s.wrong].sort()); }
    }
  });
});

describe('Babies', () => {
  it('matches babies that look alike at Level 1, ones that look different at Level 2, and compares at Level 3', () => {
    for (const { level, q } of every('baby')) {
      if (q.kind !== 'baby') throw new Error();
      if (level < 3) {
        if (q.form !== 'grow') throw new Error('form');
        const b = BABIES[q.baby]!;
        expect(b.alike).toBe(level === 1);
        expect(q.choices.filter(c => c === b.parent)).toHaveLength(1);
        for (const c of q.choices) if (c !== b.parent) expect(b.wrong as readonly string[]).toContain(c);
      } else {
        if (q.form === 'grow') throw new Error('form');
        const p = SAME_DIFFERENT[q.pair]!, trueOnes: string[] = q.form === 'same' ? [SAME_ALWAYS, ...p.alsoTrue] : [...DIFFERENT_TRUE];
        expect(q.choices.filter(c => trueOnes.includes(c))).toEqual([q.answer]);
      }
    }
  });
});

describe('Sky and Seasons', () => {
  it('asks day or night and the weather at Level 1, seasons and clothes at Level 2, the year and the sun at Level 3', () => {
    const forms = new Map<Level, Set<string>>();
    for (const { level, stretch, q } of every('sky')) {
      if (q.kind !== 'sky') throw new Error();
      forms.set(level, (forms.get(level) ?? new Set()).add(q.form));
      if (q.form === 'weather') { expect(q.choices).toHaveLength(stretch + 2); expect(q.answer).not.toBe('cloudy'); }
      if (q.form === 'season' && stretch === 0) expect(q.choices).toEqual(expect.arrayContaining([q.answer, OPPOSITE[q.answer]]));
      if (q.form === 'after') { expect(q.choices).not.toContain(BEFORE[q.answer]); expect(q.choices).toHaveLength(3); }
      if (q.form === 'wear') { const w = WEAR[q.day]; expect(q.choices.filter(c => (w.right as readonly string[]).includes(c))).toEqual([q.answer]); }
      if (q.form === 'noon') expect(q.choices.filter(c => c === 'high')).toHaveLength(1);
      if (q.form === 'sunwhen') expect(q.answer).toBe(SUN_WHEN[q.which].right);
    }
    expect([...forms.get(1)!].sort()).toEqual(['daynight', 'weather']);
    expect([...forms.get(2)!].sort()).toEqual(['season', 'wear']);
    expect([...forms.get(3)!].sort()).toEqual(['after', 'noon', 'sunwhen']);
  });
});
