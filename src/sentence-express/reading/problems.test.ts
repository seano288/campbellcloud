import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { makesSense } from '../sentences/grammar';
import { capForm, midForm, orderPool, sentence, SENTENCES } from '../sentences/index';
import { matches } from '../sentences/scenes';
import { answerScene, applyFix, isAnswer, isRightAnswer, makeQuestion, piecesOf, rightAnswer, trainKey, type Kind, type Level, type Question } from './problems';

const KINDS: Kind[] = ['order', 'marks', 'mean', 'ask', 'fix'];
const each = (f: (q: Question, kind: Kind, level: Level, stretch: 0 | 1 | 2) => void, seeds = 150) => {
  for (const kind of KINDS) for (const level of [1, 2, 3] as const) for (const stretch of [0, 1, 2] as const) for (let seed = 0; seed < seeds; seed++) f(makeQuestion(kind, level, stretch, seeded(seed * 7 + level * 1000 + stretch * 100)), kind, level, stretch);
};

describe('every question', () => {
  it('has exactly one right answer among its choices, and the right answer is an answer', () => {
    each(q => {
      const right = rightAnswer(q);
      expect(isAnswer(q, right), JSON.stringify(q)).toBe(true);
      expect(isRightAnswer(q, right)).toBe(true);
      if (q.kind === 'marks') { expect(new Set(q.choices).size).toBe(q.choices.length); expect(q.choices.filter(c => isRightAnswer(q, c))).toHaveLength(1); }
      if (q.kind === 'mean' || q.kind === 'ask') {
        expect(new Set(q.choices.map(c => c.key)).size).toBe(q.choices.length);
        expect(q.choices.filter(c => isRightAnswer(q, c.key))).toHaveLength(1);
      }
    });
  });
  it('matches its Level', () => {
    each((q, _kind, level, stretch) => {
      const s = sentence(q.s);
      if (q.kind === 'order') {
        expect(orderPool(level).map(x => x.id)).toContain(q.s);
        if (level === 1) expect(s.words.length).toBe(3);
        if (level < 3) expect(s.mark).not.toBe('?');
      }
      if (q.kind === 'marks') {
        expect(q.form).toBe(level === 1 ? 'engine' : level === 2 ? 'caboose' : q.form);
        if (level === 1) expect(q.choices.length).toBe(stretch === 0 ? 2 : q.choices.length);
        if (level === 2) expect(q.choices).not.toContain('!');
      }
      if (q.kind === 'mean') expect(q.choices.length).toBe(level === 1 ? 2 : 3);
      if (q.kind === 'ask') {
        if (level === 1) expect(q.about).toBe('who');
        if (level === 2) expect(q.about).not.toBe('who');
        expect(q.other !== null).toBe(level === 3);
      }
      if (q.kind === 'fix') expect(level === 1 ? ['capital', 'mark'] : level === 2 ? ['swap'] : ['capital', 'mark', 'swap', 'extra']).toContain(q.mistake);
    });
  });
});

describe('Build the Train', () => {
  it('shuffles the sentence\'s own pieces, the engine with its capital and the caboose with its mark', () => {
    each((q, kind) => {
      if (q.kind !== 'order') return;
      const s = sentence(q.s), pieces = piecesOf(s);
      expect([...q.yard].sort()).toEqual([...pieces].sort());
      expect(trainKey(q.yard)).not.toBe(trainKey(pieces));
      expect(pieces[0]).toBe(capForm(s.words[0]!));
      expect(pieces.at(-1)).toBe(s.mark);
      expect(kind).toBe('order');
    }, 60);
  });
});

describe('Engine and Caboose', () => {
  it('a question only takes ?, and ! is only offered beside ? (never beside a telling sentence\'s .)', () => {
    each(q => {
      if (q.kind !== 'marks' || q.form !== 'caboose') return;
      const s = sentence(q.s);
      if (s.mark === '.') expect(q.choices).not.toContain('!');
      if (s.mark === '!') expect(q.choices).not.toContain('.');
      expect(q.answer).toBe(s.mark);
    });
  });
  it('the capital on "I" and on names', () => {
    let seen = 0;
    each((q, _k, level) => {
      if (q.kind !== 'marks' || q.form !== 'capital') return;
      seen++;
      expect(level).toBe(3);
      const w = sentence(q.s).words[q.slot]!;
      expect(q.answer).toBe(w);
      expect(q.choices).toContain(w.toLowerCase());
    });
    expect(seen).toBeGreaterThan(20);
  });
});

describe('What Happened and Who, What, Where', () => {
  it('no wrong picture is also true of the sentence', () => {
    each(q => {
      if (q.kind !== 'mean') return;
      const m = sentence(q.s).m!;
      for (const c of q.choices) expect(matches(m, c.scene)).toBe(c.key === q.answer);
    });
  });
  it('a question has one answer, even with two sentences: the other sentence never also answers it', () => {
    each(q => {
      if (q.kind !== 'ask') return;
      const s = sentence(q.s), right = answerScene(s, q.about);
      for (const c of q.choices) if (c.key !== q.answer) {
        expect(JSON.stringify(c.scene)).not.toBe(JSON.stringify(right));
        if (q.about === 'who') expect(c.scene.who).not.toBe(s.m!.who);
      }
      if (q.other !== null) {
        const o = sentence(q.other);
        expect(o.m!.who).not.toBe(s.m!.who);
        // "Who is on the bed?" is not also answered by the other sentence
        if (q.about === 'who') expect(matches({ ...s.m!, who: o.m!.who }, o.m!)).toBe(false);
      }
    });
  });
});

describe('Fix the Train', () => {
  it('has exactly one mistake, and fixing it gives back the curated sentence', () => {
    each(q => {
      if (q.kind !== 'fix') return;
      const s = sentence(q.s), fixed = applyFix(q, q.answer)!;
      expect(fixed, JSON.stringify(q)).not.toBeNull();
      expect(fixed.cars).toEqual([capForm(s.words[0]!), ...s.words.slice(1).map(midForm)]);
      expect(fixed.caboose).toBe(s.mark);
      // the broken train differs from the sentence in exactly one place (a swap moves one pair)
      const shown = [...q.cars, q.caboose], want = [...fixed.cars, fixed.caboose];
      if (q.mistake === 'extra') expect(shown.length).toBe(want.length + 1);
      else {
        const diff = shown.map((c, i) => (c !== want[i] ? i : -1)).filter(i => i >= 0);
        expect(diff.length, JSON.stringify(q)).toBe(q.mistake === 'swap' ? 2 : 1);
      }
      if (q.mistake === 'swap' || q.mistake === 'extra') expect(makesSense(q.cars.map((c, i) => (i === 0 ? c : c)), s.mark)).toBe(false);
      // tapping a good car is never right; the bad car with the wrong fix isn't either
      for (let i = 0; i < q.cars.length; i++) if (!q.bad.includes(i)) expect(isRightAnswer(q, `${i}`)).toBe(false);
      if (q.mistake === 'mark') for (const f of q.fixes) expect(isRightAnswer(q, `${q.bad[0]}:${f}`)).toBe(f === s.mark);
      // a swap is fixed from either end
      if (q.mistake === 'swap') { expect(isRightAnswer(q, `${q.bad[1]}:${q.bad[0]}`)).toBe(true); }
    });
  });
});

describe('the pools', () => {
  it('every sentence can be asked by some kind', () => {
    const used = new Set<number>();
    each(q => { used.add(q.s); if (q.kind === 'ask' && q.other !== null) used.add(q.other); }, 120);
    expect(used.size / SENTENCES.length).toBeGreaterThan(.9);
  });
});
