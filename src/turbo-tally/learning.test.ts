import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeMore, makeTally } from './tally/problems';
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

describe('the kinds', () => {
  it('are five, and Three Laps is not one of them (Math Bots teaches adding three numbers)', () => {
    expect(MODE_IDS).toEqual(['place', 'more', 'tally', 'chart', 'order']);
  });
});

describe('unlocking', () => {
  it('starts with Podium and Faster Car', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['place', 'more']));
  it('opens Tally Board at Podium Level 2, and Race Chart and Line Up at Faster Car Level 2', () => {
    const p = run(freshLearning(), 'place', 6);
    expect(p.state.modes.place.level).toBe(2);
    expect(p.changes).toContainEqual({ kind: 'open', mode: 'tally' });
    expect(p.state.modes.chart.opened).toBe(false);
    const m = run(p.state, 'more', 6);
    expect(m.changes).toContainEqual({ kind: 'open', mode: 'chart' });
    expect(m.changes).toContainEqual({ kind: 'open', mode: 'order' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { place: { level: 2, opened: true }, more: { level: 3, opened: true } } });
    expect(s.modes.tally.opened && s.modes.chart.opened && s.modes.order.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'place', 5).state.modes.place.level).toBe(1);
    expect(run(freshLearning(), 'place', 6).state.modes.place.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'more', 6).state, 'more', 6).state;
    expect(s.modes.more.level).toBe(3);
    s = run(s, 'more', 12, 'missed').state;
    expect(s.modes.more.level).toBe(3);
    expect(run(s, 'more', 6).changes).toContainEqual({ kind: 'star', mode: 'more' });
  });
  it('gives an easier question or a replay no credit', () => expect(solve(freshLearning(), { mode: 'place', push: false }).state.modes.place.window).toEqual([]));
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'place', push: false, probe: 'place' }).state;
    expect(s.modes.place.level).toBe(2);
    expect(s.modes.tally.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'more', push: false, probe: 'more' }, 'missed').state;
    expect(s.modes.more.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
  it('probes each open row once a Round, at Level 2', () => {
    const ps = asked(freshLearning()).filter((p): p is Asking => p.mode !== 'meet');
    expect(ps.filter(p => p.probe).map(p => p.probe).sort()).toEqual(['more', 'place']);
    ps.filter(p => p.probe).forEach(p => { expect(p.level).toBe(2); expect(p.push).toBe(false); });
  });
});

describe('a Round', () => {
  it('meets tally marks before the first Tally Board question, once', () => {
    const s = past(open(freshLearning(), ['tally'])), ps = asked({ ...s, met: [] }, 2);
    expect(ps[0]).toEqual({ mode: 'meet', meeting: 'tally', push: false });
    expect(ps.filter(p => p.mode === 'meet')).toHaveLength(1);
  });
  it('meets the signs before the first sign question, and not before a plain Faster Car', () => {
    expect(meetingFor(makeMore(3, 1, seeded(1)))).toBe('signs');
    expect(meetingFor(makeMore(2, 1, seeded(1)))).toBeNull();
    expect(meetingFor(makeTally(1, 0, seeded(1)))).toBe('tally');
  });
  it('never asks the same kind twice running while there is another', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).map(p => p.mode);
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('asks a starred kind about once a Round', () => {
    const s = past(open(freshLearning(), MODE_IDS, 3, ['place']));
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) n += asked(s, seed).filter(p => p.mode === 'place').length;
    expect(n / 300).toBeGreaterThan(.7);
    expect(n / 300).toBeLessThan(1.4);
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
    for (let i = 0; i < 30; i++) {
      const p = session.makeProblem(rng);
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      expect(session.check(p, p.q.answer).kind).toBe('correct');
      expect(session.check(p, 'nonsense').kind).toBe('not-an-answer');
    }
  });
});
