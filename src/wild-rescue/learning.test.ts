import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { FAST_PUSHED, FAST_RULE, freshLearning, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, mixedSession, topicOf, type Problem } from './mix';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1, starred: readonly ModeId[] = []): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1, starred: starred.includes(m) }])) as LearningState['modes'] });
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('unlocking', () => {
  it('starts with Where It Lives and Animal Parts', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['home', 'parts']));
  it('opens Alive or Not and Sky and Seasons at Where It Lives Level 2, and Babies at Animal Parts Level 2', () => {
    const h = run(freshLearning(), 'home', 6);
    expect(h.state.modes.home.level).toBe(2);
    expect(h.changes).toContainEqual({ kind: 'open', mode: 'alive' });
    expect(h.changes).toContainEqual({ kind: 'open', mode: 'sky' });
    expect(h.state.modes.baby.opened).toBe(false);
    expect(run(h.state, 'parts', 6).changes).toContainEqual({ kind: 'open', mode: 'baby' });
  });
  it('opens what a save has earned when it is read, and reads a broken save as fresh', () => {
    const s = readLearning({ modes: { home: { level: 2, opened: true }, parts: { level: 3, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
    expect(readLearning('nonsense')).toEqual(freshLearning());
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'home', 5).state.modes.home.level).toBe(1);
    expect(run(freshLearning(), 'home', 6).state.modes.home.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'parts', 6).state, 'parts', 6).state;
    expect(s.modes.parts.level).toBe(3);
    s = run(s, 'parts', 12, 'missed').state;
    expect(s.modes.parts.level).toBe(3);
    expect(run(s, 'parts', 10).changes).toContainEqual({ kind: 'star', mode: 'parts' });
  });
  it('gives an easier question or a replayed miss no credit', () => expect(solve(freshLearning(), { mode: 'home', push: false }).state.modes.home.window).toEqual([]));
});

describe('a Round', () => {
  it('mixes the open kinds, never the same kind twice running while there is another', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ps = asked(open(freshLearning(), ['home', 'parts', 'alive']), seed, 5);
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode).not.toBe(ps[i - 1]!.mode);
      for (const p of ps) expect(['home', 'parts', 'alive']).toContain(p.mode);
    }
  });
  it('keeps a new player\'s first Rounds at Level 1, and asks below the Level about one in three when above it', () => {
    for (let seed = 1; seed <= 100; seed++) for (const p of asked(freshLearning(), seed)) { expect(p.level).toBe(1); expect(p.push).toBe(true); }
    let easy = 0, total = 0;
    for (let seed = 1; seed <= 300; seed++) for (const p of asked(open(freshLearning(), MODE_IDS, 3), seed)) { total++; if (!p.push) { easy++; expect(p.level).toBeLessThan(3); } }
    expect(easy / total).toBeGreaterThan(.2);
    expect(easy / total).toBeLessThan(.45);
  });
  it('follows a miss with an easier question, and a replay is a fresh question with no credit', () => {
    const s = open(freshLearning(), MODE_IDS, 3), rng = seeded(4), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng);
    session.note('missed');
    const next = session.makeProblem(rng);
    expect(next.push).toBe(false);
    const again = session.replay(first, rng);
    expect(again.push).toBe(false);
    expect(again.replay).toBe(true);
    expect(again.mode).toBe(first.mode);
    expect(again.level).toBe(first.level);
  });
  it('rarely asks about the same thing twice in a Round', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 200; seed++) { const ps = asked(open(freshLearning(), MODE_IDS, 2), seed, 5); repeats += ps.length - new Set(ps.map(p => topicOf(p.q))).size; }
    expect(repeats).toBeLessThan(10);
  });
  it('knows a right answer, a wrong one and a tap that is not an answer', () => {
    const p = asked(freshLearning(), 3, 1)[0]!;
    expect(isRight(p, p.q.answer as string)).toBe(true);
    expect(isRight(p, 'not-a-thing')).toBeNull();
  });
});
