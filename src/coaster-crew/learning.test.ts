import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, mixedSession, type Problem } from './mix';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const past = (s: LearningState): LearningState => ({ ...s, tuneUp: Object.fromEntries(ANCHORS.map(a => [a, { asked: 3, clean: 0, misses: 0 }])) as LearningState['tuneUp'] });
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1 }])) as LearningState['modes'] });
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('the kinds and unlocking', () => {
  it('are Push or Pull, Hills, Heavy and Light, Rough and Smooth, Bump and Magnets', () => expect(MODE_IDS).toEqual(['push', 'hill', 'heavy', 'rough', 'bump', 'magnet']));
  it('starts with Push or Pull and Hills', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['push', 'hill']));
  it('opens Heavy and Light at Push or Pull Level 2, Rough and Smooth at Hills Level 2, Bump at Rough and Smooth Level 2, Magnets at Heavy and Light Level 2', () => {
    const a = run(freshLearning(), 'push', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'heavy' });
    expect(a.state.modes.rough.opened).toBe(false);
    const b = run(a.state, 'hill', 6);
    expect(b.changes).toContainEqual({ kind: 'open', mode: 'rough' });
    const c = run(b.state, 'rough', 6);
    expect(c.changes).toContainEqual({ kind: 'open', mode: 'bump' });
    expect(c.state.modes.magnet.opened).toBe(false);
    expect(run(c.state, 'heavy', 6).changes).toContainEqual({ kind: 'open', mode: 'magnet' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { push: { level: 2, opened: true }, hill: { level: 3, opened: true }, heavy: { level: 2, opened: true }, rough: { level: 2, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
  });
});

describe('Mastery', () => {
  it("is quick for a kind's first questions, then asks for 16 of 20", () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'push', 5).state.modes.push.level).toBe(1);
    expect(run(freshLearning(), 'push', 6).state.modes.push.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'hill', 6).state, 'hill', 6).state;
    expect(s.modes.hill.level).toBe(3);
    s = run(s, 'hill', 12, 'missed').state;
    expect(s.modes.hill.level).toBe(3);
    expect(run(s, 'hill', 6).changes).toContainEqual({ kind: 'star', mode: 'hill' });
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'push', push: false, probe: 'push' }).state;
    expect(s.modes.push.level).toBe(2);
    expect(s.modes.heavy.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'hill', push: false, probe: 'hill' }, 'missed').state;
    expect(s.modes.hill.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
});

describe('a Round', () => {
  it('mixes every open kind, never the same kind twice running while there is another', () => {
    const s = open(past(freshLearning()), MODE_IDS, 2);
    for (let seed = 1; seed < 60; seed++) {
      const ps = asked(s, seed, 5);
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode).not.toBe(ps[i - 1]!.mode);
      expect(new Set(ps.map(p => p.mode)).size).toBeGreaterThanOrEqual(3);
    }
  });
  it('asks the Tune-Up probes first, at Level 2', () => {
    const ps = asked(freshLearning(), 2, 6);
    expect(ps.slice(0, 2).every(p => p.probe && p.level === 2)).toBe(true);
  });
  it('asks mostly at his Level, which counts, and some easier ones, which do not', () => {
    const s = open(past(freshLearning()), MODE_IDS, 3), ps = Array.from({ length: 60 }, (_, i) => asked(s, i + 1, 5)).flat();
    const easy = ps.filter(p => p.level < 3);
    expect(easy.length).toBeGreaterThan(ps.length * .15);
    expect(easy.every(p => !p.push)).toBe(true);
    expect(ps.filter(p => p.level === 3).some(p => p.push)).toBe(true);
  });
  it('checks an answer: right, wrong, or not an answer at all', () => {
    const s = open(past(freshLearning()), MODE_IDS, 1);
    for (const p of asked(s, 5, 10)) {
      expect(isRight(p, p.q.answer)).toBe(true);
      expect(isRight(p, '???')).toBeNull();
      for (const c of p.q.choices) if (c !== p.q.answer) expect(isRight(p, c)).toBe(false);
    }
  });
});
