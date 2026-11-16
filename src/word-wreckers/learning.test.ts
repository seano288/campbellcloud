import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { infoOf, PATTERN_IDS, type PatternId } from '../dino-dig/words/list';
import {
  FAST_PUSHED, FAST_RULE, freshLearning, MODE_IDS, PATTERN_GAP, patternDue, readLearning, recordSolved, ruleFor, SLOW_RULE, type Asked, type LearningState, type ModeId,
} from './learning';
import { isRight, mixedSession, type Problem } from './mix';
import { rightAnswer } from './spelling/problems';
import { pickLesson } from './spelling/teach';

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

describe('unlocking', () => {
  it('starts with Build It and Missing Sound', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['build', 'gap']));
  it('opens Chunks at Build It Level 2, Fix It at Missing Sound Level 2, and Which Looks Right at Chunks Level 2', () => {
    const b = run(freshLearning(), 'build', 6);
    expect(b.state.modes.build.level).toBe(2);
    expect(b.changes).toContainEqual({ kind: 'open', mode: 'chunk' });
    expect(b.state.modes.fix.opened).toBe(false);
    expect(run(b.state, 'gap', 6).changes).toContainEqual({ kind: 'open', mode: 'fix' });
    expect(run(b.state, 'chunk', 6).changes).toContainEqual({ kind: 'open', mode: 'pick' });
  });
  it('opens what a save has earned when it is read, and reads a broken save as fresh', () => {
    const s = readLearning({ modes: { build: { level: 3, opened: true }, gap: { level: 2, opened: true }, chunk: { level: 2, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
    expect(readLearning('nonsense')).toEqual(freshLearning());
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'build', 5).state.modes.build.level).toBe(1);
    expect(run(freshLearning(), 'build', 6).state.modes.build.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'gap', 6).state, 'gap', 6).state;
    expect(s.modes.gap.level).toBe(3);
    s = run(s, 'gap', 12, 'missed').state;
    expect(s.modes.gap.level).toBe(3);
    expect(run(s, 'gap', 10).changes).toContainEqual({ kind: 'star', mode: 'gap' });
  });
  it('gives an easier question or a replayed miss no credit', () => expect(solve(freshLearning(), { mode: 'build', push: false, pattern: 'cvc' }).state.modes.build.window).toEqual([]));
});

describe('Patterns', () => {
  it('meets each Pattern before it is asked, in the list\'s order', () => {
    const first = asked(freshLearning(), 1, 1)[0]!;
    expect(first.mode).toBe('meet');
    expect(first.q).toMatchObject({ kind: 'meet', pattern: 'cvc' });
    const met = solve(freshLearning(), { meet: 'cvc' }).state;
    expect(met.patterns).toEqual(['cvc']);
    expect(patternDue(met)).toBe(false);
    // the next one waits for PATTERN_GAP first-try answers, and while a Pattern he has met is shaky
    let s = met;
    for (let i = 0; i < PATTERN_GAP; i++) s = solve(s, { mode: 'build', push: false, pattern: 'cvc' }).state;
    expect(patternDue(s)).toBe(true);
    expect(patternDue({ ...s, strength: { cvc: 1 } })).toBe(false);
    expect(asked(s, 2, 1)[0]!.q).toMatchObject({ kind: 'meet', pattern: 'digraph' });
  });
  it('asks the next question about a word of the Pattern just met', () => {
    let s = open(freshLearning(), ['build', 'gap'], 1, ['cvc']);
    s = { ...s, sinceMeet: PATTERN_GAP };
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
      for (let seed = 1; seed <= 40; seed++) for (const p of asked(s, seed)) if (p.mode !== 'meet') expect(met).toContain(infoOf(p.q.word).pattern);
    }
  });
  it('keeps each Pattern\'s strength: up on a first try, down on a miss, never past 0 to 5', () => {
    let s = solve(freshLearning(), { meet: 'cvc' }).state;
    for (let i = 0; i < 9; i++) s = solve(s, { mode: 'build', push: true, pattern: 'cvc' }).state;
    expect(s.strength.cvc).toBe(5);
    s = solve(s, { mode: 'build', push: true, pattern: 'cvc' }, 'missed').state;
    expect(s.strength.cvc).toBe(3);
    expect(readLearning({ patterns: ['digraph', 'cvc', 'team'], strength: { cvc: 99 } })).toMatchObject({ patterns: ['cvc', 'digraph'], strength: { cvc: 5, digraph: 0 } });
  });
});

describe('a Round', () => {
  it('mixes the open kinds, never the same kind twice running while there is another', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ps = asked(open(freshLearning(), ['build', 'gap', 'fix'], 2, ['cvc', 'digraph']), seed, 5).filter(p => p.mode !== 'meet');
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode).not.toBe(ps[i - 1]!.mode);
    }
  });
  it('keeps a new player\'s first Rounds at Level 1, and asks below the Level about one in three when above it', () => {
    const fresh = open(freshLearning(), ['build', 'gap']);
    for (let seed = 1; seed <= 100; seed++) for (const p of asked(fresh, seed)) { expect(p.level).toBe(1); }
    let easy = 0, total = 0;
    for (let seed = 1; seed <= 300; seed++) for (const p of asked(open(freshLearning(), MODE_IDS, 3, [...PATTERN_IDS]), seed)) { total++; if (!p.push) { easy++; expect(p.level).toBeLessThan(3); } }
    expect(easy / total).toBeGreaterThan(.2);
    expect(easy / total).toBeLessThan(.45);
  });
  it('follows a miss with an easier question, and a replay is a fresh word of the same kind and Level with no credit', () => {
    const s = open(freshLearning(), MODE_IDS, 3, [...PATTERN_IDS]), rng = seeded(4), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng);
    session.note('missed');
    expect(session.makeProblem(rng).push).toBe(false);
    const again = session.replay(first, rng);
    expect(again).toMatchObject({ push: false, replay: true, mode: first.mode, level: first.level });
  });
  it('rarely asks the same word twice in a Round, and knows a right answer, a wrong one and a tap that is not an answer', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 200; seed++) { const ps = asked(open(freshLearning(), MODE_IDS, 2, [...PATTERN_IDS]), seed, 5).filter(p => p.mode !== 'meet'); repeats += ps.length - new Set(ps.map(p => p.q.word)).size; }
    expect(repeats).toBeLessThan(10);
    const p = asked(open(freshLearning(), ['gap']), 3, 1)[0]!;
    if (p.mode === 'meet') throw new Error('meeting');
    expect(isRight(p, rightAnswer(p.q))).toBe(true);
    expect(isRight(p, 'not-a-tile')).toBeNull();
  });
  it('lets Chunks sit out until there are two-letter sounds to ask about, instead of failing', () => {
    for (let seed = 1; seed <= 50; seed++) for (const p of asked(open(freshLearning(), ['chunk'], 2, ['cvc']), seed)) expect(p.mode).not.toBe('chunk');
  });
});

describe('the lessons', () => {
  it('only says "These letters make one sound." with the box that has two letters for one sound lit', () => {
    expect(pickLesson('cap')).toEqual({ box: null, line: 'Each sound gets a box.' });
    expect(pickLesson('snail')).toEqual({ box: 2, line: 'These letters make one sound.' });
    expect(pickLesson('cake')).toEqual({ box: 1, line: 'These letters make one sound.' });
    expect(pickLesson('duck')).toEqual({ box: 2, line: 'These letters make one sound.' });
  });
});
