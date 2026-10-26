import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { SolvedProblem } from '../learning/session';
import { freshLearning, readLearning, recordSolved, shaky, SHAKY_MAX, strengthOf, WORD_RULE, wordsFor, type LearningState } from './learning';
import { isRight, mixedSession, type Problem } from './mix';
import { huntTargets, sentenceOf } from './words/problems';
import { WORDS } from './words/list';

const solved = (outcome: SolvedProblem['outcome']): SolvedProblem => ({ index: 1, outcome, misses: outcome === 'missed' ? 1 : 0, helped: false, replay: false });
const explain = async () => {};
const EXPLAIN = { hear: explain, hunt: explain, spell: explain, read: explain, sentence: explain, fill: explain };

/** The right answer to any question, the way its view would submit it. */
function answer(p: Problem): string {
  switch (p.mode) {
    case 'hear': case 'read': case 'fill': return String(p.q.choices.indexOf(p.q.target));
    case 'sentence': return String(sentenceOf(p.q.sentence).tokens.findIndex(t => t.word === p.q.target));
    case 'hunt': return huntTargets(p.q).join(',');
    case 'spell': return p.q.target.toLowerCase();
    case 'meet': return '0';
  }
}

/** Plays `n` questions with a learner who gets `right(p)` of them right on the first try. */
function play(n: number, right: (p: Problem, k: number) => boolean = () => true, seed = 3) {
  let state = freshLearning();
  const rng = seeded(seed), session = mixedSession(() => state, EXPLAIN), asked: Problem[] = [], shakyAtMeet: number[] = [];
  for (let k = 0; k < n; k++) {
    const p = session.makeProblem(rng);
    asked.push(p);
    if (p.mode === 'meet' && state.words.length) shakyAtMeet.push(shaky(state).length);
    const known = p.mode === 'meet' ? [...state.words, p.q.target] : state.words;
    expect(known, `${p.mode} asked about ${p.q.target} before he met it`).toContain(p.q.target);
    expect(isRight(p, answer(p))).toBe(true);
    const outcome = p.mode === 'meet' || right(p, k) ? 'clean' : 'missed';
    session.note(outcome);
    state = recordSolved(state, p.mode === 'meet' ? { meet: p.q.target } : { mode: p.mode, push: p.push, word: p.q.target }, solved(outcome)).state;
  }
  return { state, asked, shakyAtMeet };
}

describe('meeting the words', () => {
  it('starts by meeting I, and asks about it straight after', () => {
    const { asked } = play(2);
    expect(asked[0]).toMatchObject({ mode: 'meet', q: { target: 'I' } });
    expect(asked[1]!.q.target).toBe('I');
  });
  it('meets the words in order, one at a time, and never asks one he has not met', () => {
    const { state, asked } = play(400);
    const met = asked.filter(p => p.mode === 'meet').map(p => p.q.target);
    expect(met).toEqual(WORDS.slice(0, met.length));
    expect(met.length).toBeGreaterThan(25);
    expect(state.words).toEqual(met);
  });
  it('waits for the next word while he is still shaky on several', () => {
    const { state, shakyAtMeet } = play(300, (_, k) => k % 2 === 0);
    expect(Math.max(...shakyAtMeet)).toBeLessThanOrEqual(SHAKY_MAX);
    const allRight = play(300).state.words.length;
    expect(state.words.length).toBeLessThan(allRight);
  });
  it('makes a word stronger when he gets it, weaker when he misses it', () => {
    let s: LearningState = { ...freshLearning(), words: ['I'], strength: { I: 2 } };
    s = recordSolved(s, { mode: 'hear', push: true, word: 'I' }, solved('clean')).state;
    expect(strengthOf(s, 'I')).toBe(3);
    s = recordSolved(s, { mode: 'hear', push: true, word: 'I' }, solved('missed')).state;
    expect(strengthOf(s, 'I')).toBe(1);
  });
  it('lets the next word in only after enough answers right on the first try', () => {
    expect(wordsFor({ words: [], sinceWord: 0, strength: {} })).toEqual(['I']);
    expect(wordsFor({ words: ['I'], sinceWord: 1, strength: { I: 3 } })).toEqual(['I']);
    expect(wordsFor({ words: ['I'], sinceWord: 3, strength: { I: 3 } })).toEqual(['I', 'a']);
  });
});

describe('the kinds of question', () => {
  it('opens Read It once Find It reaches Level 2', () => {
    let s = freshLearning();
    s = { ...s, words: WORDS.slice(0, 10) };
    let opened = false;
    for (let k = 0; k < WORD_RULE.streak!; k++) {
      const r = recordSolved(s, { mode: 'hear', push: true, word: 'see' }, solved('clean'));
      s = r.state;
      if (r.changes.some(c => c.kind === 'open' && c.mode === 'read')) opened = true;
    }
    expect(s.modes.hear.level).toBe(2);
    expect(opened).toBe(true);
    expect(s.modes.read.opened).toBe(true);
  });
  it('asks every open kind, never the same one twice in a row when there is a choice', () => {
    let state: LearningState = { ...freshLearning(), words: WORDS.slice(0, 40), sinceWord: 0 };
    state = { ...state, modes: Object.fromEntries(Object.entries(state.modes).map(([k, m]) => [k, { ...m, opened: true, level: 2 }])) as LearningState['modes'] };
    const strong = Object.fromEntries(state.words.map(w => [w, 1]));
    state = { ...state, strength: strong };
    const session = mixedSession(() => state, EXPLAIN), rng = seeded(11), kinds = new Set<string>();
    let last = '';
    for (let k = 0; k < 120; k++) {
      const p = session.makeProblem(rng);
      kinds.add(p.mode);
      expect(p.mode).not.toBe(last);
      last = p.mode;
      session.note('clean');
    }
    expect([...kinds].sort()).toEqual(['fill', 'hear', 'hunt', 'read', 'sentence', 'spell']);
  });
  it('tells a part of a Word Hunt or a word being built from a finished one', () => {
    const p: Problem = { mode: 'spell', level: 1, push: true, q: { target: 'said', tiles: ['d', 'a', 's', 'i'], ghost: true } };
    expect(isRight(p, 's')).toBe('more');
    expect(isRight(p, 'sa')).toBe('more');
    expect(isRight(p, 'sd')).toBe(false);
    expect(isRight(p, 'said')).toBe(true);
  });
});

describe('reading a save', () => {
  it('keeps only words on the list, and strengths for words he has met', () => {
    const s = readLearning({ words: ['I', 'a', 'zzz', 'I'], strength: { I: 9, a: 2, see: 4 }, sinceWord: 2 });
    expect(s.words).toEqual(['I', 'a']);
    expect(s.strength).toEqual({ I: 5, a: 2 });
    expect(s.sinceWord).toBe(2);
  });
});
