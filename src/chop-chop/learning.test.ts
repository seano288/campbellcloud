import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { seeded } from '../game/rng';
import { DENS, FRAC_WORDS, isEqual, key, parseKey, same, WORD_ORDER, type SaidFrac } from './fractions/fraction';
import {
  BIGGER_PAIRS, biggerAnswer, COLOR_TARGETS, COOKIES, FIND_TARGETS, FUEL_TARGETS, makeFair, makeFind, makeName, makeShare, piecesFor, problemPhrases, SAME,
} from './fractions/problems';
import { freshLearning, MODE_IDS, readLearning, recordSolved, WORD_GAP, wordsFor, type LearningState, type ModeId } from './learning';
import { isRight, makeProblem, mixedSession, pickNext, wordsIn, type Problem } from './mix';

const clean: SolvedProblem = { index: 1, outcome: 'clean', misses: 0, helped: false, replay: false };
const push = (mode: ModeId) => ({ mode, push: true });
const at = (s: LearningState, levels: Partial<Record<ModeId, 1 | 2 | 3>>): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: true, level: levels[m] ?? 1 }])) as LearningState['modes'] });
const every = [...DENS];
const noExplain = async () => {};
const explainers = { fair: noExplain, name: noExplain, bigger: noExplain, find: noExplain, color: noExplain, share: noExplain };

describe('kinds of question', () => {
  it('opens Fair Shares, Find the Part and Share It at first', () => {
    const s = freshLearning();
    expect(MODE_IDS.filter(m => s.modes[m].opened)).toEqual(['fair', 'find', 'share']);
  });
  it('raises a Level after 16 of 20, opening the next kind at Level 2', () => {
    let s = freshLearning();
    const missed: SolvedProblem = { ...clean, outcome: 'missed' };
    for (let i = 0; i < 4; i++) s = recordSolved(s, push('fair'), missed).state;
    for (let i = 0; i < 15; i++) s = recordSolved(s, push('fair'), i % 5 === 4 ? missed : clean).state;
    expect(s.modes.fair.level).toBe(1);
    const changes = [];
    for (let i = 0; i < 6; i++) { const r = recordSolved(s, push('fair'), clean); s = r.state; changes.push(...r.changes); }
    expect(s.modes.fair.level).toBe(2);
    expect(s.modes.name).toMatchObject({ opened: true, fresh: true });
    expect(changes).toContainEqual({ kind: 'open', mode: 'name' });
    expect(s.modes.bigger.opened).toBe(false); // Bigger Piece waits on Name the Piece
  });
  it('raises a Level after 10 in a row, when he clearly has it', () => {
    let s = freshLearning();
    for (let i = 0; i < 10; i++) s = recordSolved(s, push('find'), clean).state;
    expect(s.modes.find.level).toBe(2);
    expect(s.modes.color.opened).toBe(true);
  });
  it('counts only questions asked at his Level', () => {
    let s = at(freshLearning(), { share: 2 });
    for (let i = 0; i < 30; i++) s = recordSolved(s, { mode: 'share', push: false }, clean).state;
    expect(s.modes.share).toMatchObject({ level: 2, window: [] });
  });
  it('reads a damaged save, keeping what is valid', () => {
    expect(readLearning(null)).toEqual(freshLearning());
    const s = readLearning({ modes: { color: { level: 3, opened: true, window: ['clean', 'nonsense'] } } });
    expect(s.modes.color).toMatchObject({ level: 3, opened: true, window: ['clean'] });
    expect(s.modes.fair).toMatchObject({ level: 1, opened: true });
  });
});

describe('the mix', () => {
  it('only asks kinds he has opened, never the same kind twice in a row, and something easier after a miss', () => {
    const rng = seeded(1), s = at(freshLearning(), { fair: 3, find: 2 });
    let last: ModeId | undefined;
    for (let i = 0; i < 200; i++) {
      const next = pickNext(s, rng, last && { mode: last, missed: true });
      expect(next.mode).not.toBe(last);
      if (s.modes[next.mode].level > 1) expect(next.push).toBe(false);
      last = next.mode;
    }
  });
  it('makes questions whose right answer checks right, at every Level', () => {
    const rng = seeded(7);
    for (const mode of MODE_IDS) for (const level of [1, 2, 3] as const) for (let i = 0; i < 40; i++) {
      const p = makeProblem({ mode, level, push: true }, rng, every)!;
      const right = (() => {
        switch (p.mode) {
          case 'fair': return String(p.q.answer);
          case 'name': return `1/${p.q.d}`;
          case 'find': return key(p.q.target);
          case 'color': return `${piecesFor(p.q)}/${p.q.d}`;
          case 'bigger': return biggerAnswer(p.q);
          case 'share': return String(p.q.answer);
          case 'meet': return '0';
        }
      })();
      expect(isRight(p, right)).toBe(true);
      expect(mixedSession(() => freshLearning(), explainers).check(p, right).kind).toBe('correct');
    }
  });
  it('turns away things that are not answers', () => {
    const p = makeProblem({ mode: 'color', level: 1, push: true }, seeded(2), every)!;
    expect(isRight(p, 'banana')).toBe(null);
    expect(isRight(p, '1/7')).toBe(null);
  });
});

describe('fraction questions', () => {
  it('draws one fair picture and two clearly unfair ones', () => {
    const rng = seeded(3);
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const p = makeFair(level, rng);
      expect(p.pictures.filter(isEqual)).toEqual([p.pictures[p.answer]]);
      for (const pic of p.pictures) expect(pic.pieces.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    }
  });
  it('never offers two pictures showing the same amount', () => {
    const rng = seeded(4);
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 60; i++) {
      const p = makeFind(level, rng, every)!;
      expect(p.choices).toHaveLength(3);
      for (const a of p.choices) expect(p.choices.filter(b => same(a, b))).toHaveLength(1);
    }
  });
  it('shares cookies into whole numbers', () => {
    for (const l of [2, 3] as const) for (const [total, d] of COOKIES[l]) expect(Number.isInteger(total / d)).toBe(true);
    const p = makeShare(1, seeded(5), [])!;
    expect('friends' in p && p.choices).toContain(p.answer);
  });
  it('colours and fills only parts that are a whole number of pieces', () => {
    for (const l of [1, 2, 3] as const) for (const [t, d] of [...COLOR_TARGETS[l], ...FUEL_TARGETS[l]]) expect(Number.isInteger(piecesFor({ target: parseKey(t)!, d }))).toBe(true);
  });
  it('says every part it asks about, and says "the same" when they are', () => {
    for (const l of [1, 2, 3] as const) {
      for (const t of FIND_TARGETS[l]) expect(t in FRAC_WORDS).toBe(true);
      for (const [x, y] of BIGGER_PAIRS[l]) {
        const p = { a: parseKey(x as SaidFrac)!, b: parseKey(y as SaidFrac)! };
        expect(biggerAnswer(p) === SAME).toBe(same(p.a, p.b));
      }
    }
    const phrases = problemPhrases();
    expect(phrases).toContain('Which is bigger, two quarters or one half?');
    expect(phrases).toContain('One half of four pieces is two pieces.');
    expect(phrases).toContain('There are eight cookies. You get one quarter of them. How many cookies do you get?');
  });
});

describe('meeting the words', () => {
  const clean1: SolvedProblem = { ...clean };
  it('meets one half before the first question that says it, then asks that question', () => {
    const s = freshLearning(), session = mixedSession(() => s, explainers), rng = seeded(11);
    const seen: Problem[] = [];
    for (let i = 0; i < 30; i++) seen.push(session.makeProblem(rng));
    const first = seen.findIndex(p => wordsIn(p).length);
    expect(seen[first]).toMatchObject({ mode: 'meet', q: { d: 2 } });
    expect(wordsIn(seen[first + 1]!)).toContain(2);
    for (const p of seen) for (const d of wordsIn(p)) expect(d).toBe(2); // only half, until he's met it and practised
    expect(seen.filter(p => p.mode === 'meet')).toHaveLength(1);
  });
  it('lets the next word come only after enough right answers, in order: half, quarter, third, eighth, sixth', () => {
    let s = freshLearning();
    expect(wordsFor(s)).toEqual([2]);
    for (const d of WORD_ORDER) {
      expect(wordsFor(s).at(-1)).toBe(d);
      s = recordSolved(s, { meet: d }, clean1).state;
      expect(wordsFor(s)).toEqual(s.words);
      for (let i = 0; i < WORD_GAP; i++) s = recordSolved(s, { mode: 'fair', push: false }, clean1).state;
    }
    expect(s.words).toEqual([...WORD_ORDER]);
    expect(readLearning(JSON.parse(JSON.stringify(s)))).toMatchObject({ words: s.words, sinceWord: WORD_GAP });
  });
  it('never asks a word he may not hear', () => {
    const rng = seeded(12);
    for (const level of [1, 2, 3] as const) for (const words of [[2], [2, 4], [2, 4, 3]] as const) for (const mode of MODE_IDS) for (let i = 0; i < 20; i++) {
      const p = makeProblem({ mode, level, push: true }, rng, words);
      if (p) for (const d of wordsIn(p)) expect(words).toContain(d);
    }
  });
  it('waits to name pieces until he knows two words, and finds one half against the whole and nothing', () => {
    expect(makeName(1, seeded(1), [2])).toBe(null);
    expect(makeName(1, seeded(1), [2, 4])!.choices).toEqual([2, 4]);
    const p = makeFind(1, seeded(3), [2])!;
    expect(p.target).toEqual({ n: 1, d: 2 });
    expect(p.choices.map(key).sort()).toEqual(['0/2', '1/2', '2/2']);
  });
  it('takes any one piece as right when meeting a word', () => {
    const p: Problem = { mode: 'meet', level: 1, push: false, q: { kind: 'meet', food: 'pizza', d: 4 } };
    expect(isRight(p, '3')).toBe(true);
    expect(isRight(p, '4')).toBe(null);
  });
});
