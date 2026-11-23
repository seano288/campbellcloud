import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeQuestion } from './math/problems';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, meetingsFor, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
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
  it('are six, in the order he meets them', () => expect(MODE_IDS).toEqual(['groups', 'array', 'pair', 'count', 'share', 'times']));
});

describe('unlocking', () => {
  it('starts with Equal Groups and Windows', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['groups', 'array']));
  it('opens Odd or Even and Share It at Equal Groups Level 2, and Count By at Windows Level 2', () => {
    const g = run(freshLearning(), 'groups', 6);
    expect(g.state.modes.groups.level).toBe(2);
    expect(g.changes).toContainEqual({ kind: 'open', mode: 'pair' });
    expect(g.changes).toContainEqual({ kind: 'open', mode: 'share' });
    expect(g.state.modes.count.opened).toBe(false);
    const a = run(g.state, 'array', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'count' });
    expect(a.state.modes.times.opened).toBe(false);
  });
  it('opens Times only once both Windows and Equal Groups reach Level 3: the × sign comes last', () => {
    let s = run(run(freshLearning(), 'groups', 6).state, 'groups', 6).state;
    expect(s.modes.groups.level).toBe(3);
    expect(s.modes.times.opened).toBe(false);
    s = run(s, 'array', 6).state;
    expect(s.modes.times.opened).toBe(false);
    const r = run(s, 'array', 6);
    expect(r.changes).toContainEqual({ kind: 'open', mode: 'times' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { groups: { level: 3, opened: true }, array: { level: 3, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
  });
  it('reads a broken save as fresh, never as a higher Level', () => {
    const s = readLearning({ modes: { groups: { level: 7, opened: 'yes', window: ['clean', 'bogus'] } }, pushed: { groups: -3 } });
    expect(s.modes.groups.level).toBe(1);
    expect(s.modes.groups.window).toEqual(['clean']);
    expect(s.pushed.groups).toBe(0);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'groups', 5).state.modes.groups.level).toBe(1);
    expect(run(freshLearning(), 'groups', 6).state.modes.groups.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'array', 6).state, 'array', 6).state;
    expect(s.modes.array.level).toBe(3);
    s = run(s, 'array', 12, 'missed').state;
    expect(s.modes.array.level).toBe(3);
    expect(run(s, 'array', 6).changes).toContainEqual({ kind: 'star', mode: 'array' });
  });
  it('gives an easier question or a replay no credit', () => expect(solve(freshLearning(), { mode: 'groups', push: false }).state.modes.groups.window).toEqual([]));
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'groups', push: false, probe: 'groups' }).state;
    expect(s.modes.groups.level).toBe(2);
    expect(s.modes.pair.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'array', push: false, probe: 'array' }, 'missed').state;
    expect(s.modes.array.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
  it('probes each open row once a Round, at Level 2', () => {
    const ps = asked(freshLearning()).filter((p): p is Asking => p.mode !== 'meet');
    expect(ps.filter(p => p.probe).map(p => p.probe).sort()).toEqual(['array', 'groups']);
    ps.filter(p => p.probe).forEach(p => { expect(p.level).toBe(2); expect(p.push).toBe(false); });
  });
});

describe('the × sign is met before it is asked', () => {
  it('every Times question needs the sign first; a written fact from Level 2 needs its name, "times", too', () => {
    const rng = seeded(3);
    for (let i = 0; i < 300; i++) {
      expect(meetingsFor(makeQuestion('times', 1, 2, rng), 1)).toEqual(['sign']);
      const q2 = makeQuestion('times', 2, 0, rng);
      expect(meetingsFor(q2, 2)).toEqual(['sign', 'word']);
      expect(meetingsFor(makeQuestion('groups', 3, 2, rng), 3)).toEqual([]);
    }
  });
  it('the first Times question of all comes after the Meetings, in order, once each', () => {
    const s = past(open(freshLearning(), ['times'], 2));
    for (let seed = 1; seed < 40; seed++) {
      const ps = asked({ ...s, met: [] }, seed, 6);
      const firstTimes = ps.findIndex(p => p.mode === 'times');
      const meets = ps.filter(p => p.mode === 'meet').map(p => (p as { meeting: string }).meeting);
      expect(meets.slice(0, 1)).toEqual(['sign']);
      expect(new Set(meets).size).toBe(meets.length);
      expect(ps.slice(0, firstTimes).filter(p => p.mode === 'meet').length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('a Round', () => {
  it('never asks the same kind twice running while there is another', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).filter(p => p.mode !== 'meet').map(p => p.mode);
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('asks a starred kind about once a Round', () => {
    const s = past(open(freshLearning(), MODE_IDS, 3, ['groups']));
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) n += asked(s, seed).filter(p => p.mode === 'groups').length;
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
    for (let i = 0; i < 60; i++) {
      const p = session.makeProblem(rng);
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      const right = p.q.kind === 'share' && p.q.form === 'deal' ? Array.from({ length: p.q.trucks }, () => p.q.kind === 'share' && p.q.form === 'deal' ? p.q.total / p.q.trucks : 0).join(',') : p.q.answer;
      expect(session.check(p, right).kind).toBe('correct');
      expect(session.check(p, 'nonsense').kind).toBe('not-an-answer');
    }
  });
});
