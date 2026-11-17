// What Dino Dig asks and when: the kinds open in order, Levels rise on Mastery and never fall, Patterns are met before they are asked
// and keep a strength, and every Round mixes the kinds he has opened.
import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { infoOf, PATTERN_IDS, type PatternId } from './words/list';
import {
  FAST_PUSHED, FAST_RULE, freshLearning, MODE_IDS, PATTERN_GAP, patternDue, readLearning, recordSolved, ruleFor, SLOW_RULE, type Asked, type LearningState, type ModeId,
} from './learning';
import { isRight, mixedSession, type Problem } from './mix';
import { check, sceneKey, type Question } from './reading/problems';
import { chunksOf, patternSounds, rightSpeech } from './reading/teach';
import { PHRASES } from './phrases';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean', pattern: PatternId = 'cvc') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true, pattern }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1, patterns: PatternId[] = ['cvc']): LearningState => ({
  ...s, patterns, strength: Object.fromEntries(patterns.map(p => [p, 3])),
  modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1 }])) as LearningState['modes'],
});
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };
const right = (q: Question) => (q.kind === 'sentence' ? sceneKey(q.scene) : q.kind === 'swap' ? `${q.box}=${q.answer}` : q.word);

describe('unlocking', () => {
  it('starts with Read It and Hear It', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['read', 'hear']));
  it('opens Sound Swap at Hear It Level 2, Real or Silly at Read It Level 2, and Read and Find once both are', () => {
    const h = run(freshLearning(), 'hear', 6);
    expect(h.state.modes.hear.level).toBe(2);
    expect(h.changes).toContainEqual({ kind: 'open', mode: 'swap' });
    expect(h.state.modes.sentence.opened).toBe(false);
    const r = run(h.state, 'read', 6);
    expect(r.changes).toContainEqual({ kind: 'open', mode: 'real' });
    expect(r.changes).toContainEqual({ kind: 'open', mode: 'sentence' });
  });
  it('opens what a save has earned when it is read, and reads a broken save as fresh', () => {
    const s = readLearning({ modes: { read: { level: 2, opened: true }, hear: { level: 2, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
    expect(readLearning('nonsense')).toEqual(freshLearning());
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20 or 10 in a row', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'read', 5).state.modes.read.level).toBe(1);
    expect(run(freshLearning(), 'read', 6).state.modes.read.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'hear', 6).state, 'hear', 6).state;
    expect(s.modes.hear.level).toBe(3);
    s = run(s, 'hear', 12, 'missed').state;
    expect(s.modes.hear.level).toBe(3);
    expect(run(s, 'hear', 10).changes).toContainEqual({ kind: 'star', mode: 'hear' });
  });
  it('gives an easier question or a replayed miss no credit', () => expect(solve(freshLearning(), { mode: 'read', push: false, pattern: 'cvc' }).state.modes.read.window).toEqual([]));
});

describe('Patterns', () => {
  it('meets each Pattern before it is asked, in the list\'s order', () => {
    const first = asked(freshLearning(), 1, 1)[0]!;
    expect(first.mode).toBe('meet');
    expect(first.q).toMatchObject({ kind: 'meet', pattern: 'cvc' });
    const met = solve(freshLearning(), { meet: 'cvc' }).state;
    expect(met.patterns).toEqual(['cvc']);
    expect(patternDue(met)).toBe(false);
    let s = met;
    for (let i = 0; i < PATTERN_GAP; i++) s = solve(s, { mode: 'read', push: false, pattern: 'cvc' }).state;
    expect(patternDue(s)).toBe(true);
    expect(patternDue({ ...s, strength: { cvc: 1 } })).toBe(false);
    expect(asked(s, 2, 1)[0]!.q).toMatchObject({ kind: 'meet', pattern: 'digraph' });
  });
  it('asks the next question about a word of the Pattern just met', () => {
    const s = { ...open(freshLearning(), ['read', 'hear'], 1, ['cvc']), sinceMeet: PATTERN_GAP };
    for (let seed = 1; seed <= 40; seed++) {
      const ps = asked(s, seed, 2);
      expect(ps[0]!.mode).toBe('meet');
      const p = ps[1]!;
      if (p.mode === 'meet') throw new Error('two meetings');
      expect(infoOf(p.q.word).pattern).toBe('digraph');
    }
  });
  it('only ever asks words from Patterns he has met', () => {
    for (let k = 1; k <= PATTERN_IDS.length; k++) {
      const met = PATTERN_IDS.slice(0, k) as PatternId[], s = open(freshLearning(), MODE_IDS, 2, met);
      for (let seed = 1; seed <= 30; seed++) for (const p of asked(s, seed)) if (p.mode !== 'meet') expect(met).toContain(infoOf(p.q.word).pattern);
    }
  });
  it('keeps each Pattern\'s strength: up on a first try, down on a miss, never past 0 to 5', () => {
    let s = solve(freshLearning(), { meet: 'cvc' }).state;
    for (let i = 0; i < 9; i++) s = solve(s, { mode: 'read', push: true, pattern: 'cvc' }).state;
    expect(s.strength.cvc).toBe(5);
    s = solve(s, { mode: 'read', push: true, pattern: 'cvc' }, 'missed').state;
    expect(s.strength.cvc).toBe(3);
    expect(readLearning({ patterns: ['digraph', 'cvc', 'team'], strength: { cvc: 99 } })).toMatchObject({ patterns: ['cvc', 'digraph'], strength: { cvc: 5, digraph: 0 } });
  });
});

describe('a Round', () => {
  it('mixes the open kinds, never the same kind twice running while there is another', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const ps = asked(open(freshLearning(), ['read', 'hear', 'swap'], 2, ['cvc', 'digraph']), seed, 5).filter(p => p.mode !== 'meet');
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode).not.toBe(ps[i - 1]!.mode);
    }
  });
  it('keeps a new player\'s first Rounds at Level 1, and asks below the Level about one in three when above it', () => {
    for (let seed = 1; seed <= 60; seed++) for (const p of asked(open(freshLearning(), ['read', 'hear']), seed)) expect(p.level).toBe(1);
    let easy = 0, total = 0;
    for (let seed = 1; seed <= 200; seed++) for (const p of asked(open(freshLearning(), MODE_IDS, 3, [...PATTERN_IDS]), seed)) { total++; if (!p.push) { easy++; expect(p.level).toBeLessThan(3); } }
    expect(easy / total).toBeGreaterThan(.2);
    expect(easy / total).toBeLessThan(.45);
  });
  it('follows a miss with an easier question, and a replay is a fresh question of the same kind and Level with no credit', () => {
    const s = open(freshLearning(), MODE_IDS, 3, [...PATTERN_IDS]), rng = seeded(4), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng);
    session.note('missed');
    expect(session.makeProblem(rng).push).toBe(false);
    expect(session.replay(first, rng)).toMatchObject({ push: false, replay: true, mode: first.mode, level: first.level });
  });
  it('rarely asks the same word twice in a Round, and knows a right answer from a wrong one', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 150; seed++) { const ps = asked(open(freshLearning(), MODE_IDS, 2, [...PATTERN_IDS]), seed, 5).filter(p => p.mode !== 'meet'); repeats += ps.length - new Set(ps.map(p => p.q.word)).size; }
    expect(repeats).toBeLessThan(10);
    for (let seed = 1; seed <= 30; seed++) for (const p of asked(open(freshLearning(), MODE_IDS, 2, [...PATTERN_IDS]), seed)) {
      if (p.mode === 'meet') continue;
      expect(isRight(p, right(p.q))).toBe(true);
      if (p.q.kind !== 'swap') expect(isRight(p, 'nothing')).toBe(false);
      else { expect(isRight(p, `${p.q.box}`)).toBe('more'); expect(check(p.q, `${p.q.box}=zz`)).toBe(false); }
    }
  });
  it('lets a kind sit out at a Level it can\'t ask yet, instead of failing', () => {
    for (let seed = 1; seed <= 40; seed++) for (const p of asked(open(freshLearning(), ['swap', 'hear'], 3, ['cvc']), seed)) expect(p.mode === 'swap' && p.level === 3).toBe(false);
  });
});

describe('the lessons', () => {
  it('mark the sounds a Pattern is about', () => {
    expect(patternSounds('digraph', ['sh', 'i', 'p'])).toEqual([true, false, false]);
    expect(patternSounds('magic-e', ['c', 'a_e', 'k'])).toEqual([false, true, false]);
    expect(patternSounds('blend', ['f', 'r', 'o', 'g'])).toEqual([true, true, false, false]);
    expect(patternSounds('r', ['c', 'ar'])).toEqual([false, true]);
  });
  it('read a sentence in pieces that light its words, every piece a recorded phrase', () => {
    expect(chunksOf({ a: 'fox', rel: 'in', b: 'box' })).toEqual([{ say: 'A fox', words: [0, 1] }, { say: 'in a', words: [2, 3] }, { say: 'box', words: [4] }]);
    expect(chunksOf({ a: 'pig', size: 'big' })).toEqual([{ say: 'A big', words: [0, 1] }, { say: 'pig', words: [2] }]);
    expect(chunksOf({ a: 'cat', see: true, size: 'little' }).map(c => c.say)).toEqual(['I see a little', 'cat']);
    for (let seed = 1; seed <= 60; seed++) for (const p of asked(open(freshLearning(), MODE_IDS, 2, [...PATTERN_IDS]), seed)) {
      if (p.mode === 'meet') continue;
      for (const line of rightSpeech(p.q)) expect(PHRASES as readonly string[]).toContain(line);
      if (p.q.kind === 'sentence') for (const c of p.q.choices) for (const k of chunksOf(c)) expect(PHRASES as readonly string[]).toContain(k.say);
    }
  });
});
