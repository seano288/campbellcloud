import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeBoard, makeOne } from './stories/problems';
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
  it('are Deck Log, Which Sum, How Many More, Two Steps and Mission Board', () => expect(MODE_IDS).toEqual(['one', 'pick', 'compare', 'two', 'board']));
  it('starts with Deck Log and Which Sum', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['one', 'pick']));
  it('opens How Many More at Deck Log Level 2, Two Steps at Which Sum Level 2, and Mission Board at How Many More Level 2', () => {
    const a = run(freshLearning(), 'one', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'compare' });
    expect(a.state.modes.two.opened).toBe(false);
    const h = run(a.state, 'pick', 6);
    expect(h.changes).toContainEqual({ kind: 'open', mode: 'two' });
    expect(h.state.modes.board.opened).toBe(false);
    const t = run(h.state, 'compare', 6);
    expect(t.changes).toContainEqual({ kind: 'open', mode: 'board' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { one: { level: 2, opened: true }, compare: { level: 2, opened: true }, pick: { level: 3, opened: true } } });
    expect(s.modes.compare.opened && s.modes.two.opened && s.modes.board.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'one', 5).state.modes.one.level).toBe(1);
    expect(run(freshLearning(), 'one', 6).state.modes.one.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'pick', 6).state, 'pick', 6).state;
    expect(s.modes.pick.level).toBe(3);
    s = run(s, 'pick', 12, 'missed').state;
    expect(s.modes.pick.level).toBe(3);
    expect(run(s, 'pick', 6).changes).toContainEqual({ kind: 'star', mode: 'pick' });
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'one', push: false, probe: 'one' }).state;
    expect(s.modes.one.level).toBe(2);
    expect(s.modes.compare.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'pick', push: false, probe: 'pick' }, 'missed').state;
    expect(s.modes.pick.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
});

describe('a Round', () => {
  it('meets the bar graph before the first Mission Board question, and the scale before the first that counts by twos, fives or tens', () => {
    expect(meetingFor(makeBoard(1, 0, seeded(1)))).toBe('graph');
    expect(meetingFor(makeBoard(2, 0, seeded(1)))).toBe('scale');
    expect(meetingFor(makeBoard(3, 1, seeded(1)))).toBe('scale');
    expect(meetingFor(makeOne(2, 1, seeded(1)))).toBeNull();
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
