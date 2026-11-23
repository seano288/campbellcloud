import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeAdd, makeHundreds } from './sums/problems';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, meetingFor, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, mixedSession, type Asking, type Problem } from './mix';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const past = (s: LearningState): LearningState => ({ ...s, met: [...MEETINGS], tuneUp: Object.fromEntries(ANCHORS.map(a => [a, { asked: 3, clean: 0, misses: 0 }])) as LearningState['tuneUp'] });
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1, starred: readonly ModeId[] = []): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1, starred: starred.includes(m) }])) as LearningState['modes'] });
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('the kinds and unlocking', () => {
  it('are Boarding, Jumbo, Unload, Ten Hops and Missing Bags', () => expect(MODE_IDS).toEqual(['add', 'hundreds', 'take', 'hop', 'gap']));
  it('starts with Boarding and Jumbo', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['add', 'hundreds']));
  it('opens Unload at Boarding Level 2, Ten Hops at Jumbo Level 2, and Missing Bags at Unload Level 2', () => {
    const a = run(freshLearning(), 'add', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'take' });
    expect(a.state.modes.hop.opened).toBe(false);
    const h = run(a.state, 'hundreds', 6);
    expect(h.changes).toContainEqual({ kind: 'open', mode: 'hop' });
    expect(h.state.modes.gap.opened).toBe(false);
    const t = run(h.state, 'take', 6);
    expect(t.changes).toContainEqual({ kind: 'open', mode: 'gap' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { add: { level: 2, opened: true }, take: { level: 2, opened: true }, hundreds: { level: 3, opened: true } } });
    expect(s.modes.take.opened && s.modes.hop.opened && s.modes.gap.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'add', 5).state.modes.add.level).toBe(1);
    expect(run(freshLearning(), 'add', 6).state.modes.add.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'hundreds', 6).state, 'hundreds', 6).state;
    expect(s.modes.hundreds.level).toBe(3);
    s = run(s, 'hundreds', 12, 'missed').state;
    expect(s.modes.hundreds.level).toBe(3);
    expect(run(s, 'hundreds', 6).changes).toContainEqual({ kind: 'star', mode: 'hundreds' });
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'add', push: false, probe: 'add' }).state;
    expect(s.modes.add.level).toBe(2);
    expect(s.modes.take.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'hundreds', push: false, probe: 'hundreds' }, 'missed').state;
    expect(s.modes.hundreds.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
});

describe('a Round', () => {
  it('meets the seat blocks before the first Jumbo question, and the signs before the first sign question', () => {
    expect(meetingFor(makeHundreds(1, 0, seeded(1)))).toBe('blocks');
    let sign = makeHundreds(3, 2, seeded(1));
    for (let s = 2; sign.form !== 'sign'; s++) sign = makeHundreds(3, 2, seeded(s));
    expect(meetingFor(sign)).toBe('signs');
    expect(meetingFor(makeAdd(2, 1, seeded(1)))).toBeNull();
  });
  it('never asks the same kind twice running while there is another', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).map(p => p.mode).filter(m => m !== 'meet');
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('a replayed miss is a new question of the same kind and Level, with no credit', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2)), rng = seeded(5), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng) as Asking, again = session.replay(first, rng) as Asking;
    expect(again.mode).toBe(first.mode);
    expect(again.level).toBe(first.level);
    expect(again.push).toBe(false);
    expect(again.replay).toBe(true);
  });
  it('checks an answer: right, wrong, or not an answer at all', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2)), rng = seeded(9), session = mixedSession(() => s, async () => {}, rng);
    for (let i = 0; i < 40; i++) {
      const p = session.makeProblem(rng);
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      expect(session.check(p, p.q.answer).kind).toBe('correct');
      expect(session.check(p, 'nonsense').kind).toBe('not-an-answer');
    }
  });
});
