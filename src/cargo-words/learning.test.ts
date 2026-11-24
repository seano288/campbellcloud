import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeQuestion, rightAnswer } from './reading/problems';
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
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1 }])) as LearningState['modes'] });
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('the kinds and unlocking', () => {
  it('are How Many Containers, Load the Ship, Split It, Read It, Bossy R and Add-Ons', () => expect(MODE_IDS).toEqual(['count', 'build', 'split', 'read', 'r', 'addon']));
  it('starts with How Many Containers and Load the Ship', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['count', 'build']));
  it('opens Split It at How Many Containers Level 2, Read It and Bossy R at Load the Ship Level 2, Add-Ons at Split It Level 2', () => {
    const a = run(freshLearning(), 'count', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'split' });
    expect(a.state.modes.read.opened).toBe(false);
    const b = run(a.state, 'build', 6);
    expect(b.changes).toContainEqual({ kind: 'open', mode: 'read' });
    expect(b.changes).toContainEqual({ kind: 'open', mode: 'r' });
    expect(b.state.modes.addon.opened).toBe(false);
    expect(run(b.state, 'split', 6).changes).toContainEqual({ kind: 'open', mode: 'addon' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { count: { level: 2, opened: true }, build: { level: 3, opened: true }, split: { level: 2, opened: true } } });
    expect(s.modes.split.opened && s.modes.read.opened && s.modes.r.opened && s.modes.addon.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'count', 5).state.modes.count.level).toBe(1);
    expect(run(freshLearning(), 'count', 6).state.modes.count.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'build', 6).state, 'build', 6).state;
    expect(s.modes.build.level).toBe(3);
    s = run(s, 'build', 12, 'missed').state;
    expect(s.modes.build.level).toBe(3);
    expect(run(s, 'build', 6).changes).toContainEqual({ kind: 'star', mode: 'build' });
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'count', push: false, probe: 'count' }).state;
    expect(s.modes.count.level).toBe(2);
    expect(s.modes.split.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'build', push: false, probe: 'build' }, 'missed').state;
    expect(s.modes.build.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
});

describe('a Round', () => {
  it('meets each new syllable type before the first question that needs it, and only once', () => {
    let q = makeQuestion('split', 3, 0, seeded(1));
    for (let s = 2; !q.needs.includes('open'); s++) q = makeQuestion('split', 3, 0, seeded(s));
    expect(meetingFor(q, [])).toBe(q.needs[0]);
    expect(meetingFor(q, [...MEETINGS])).toBeNull();
    const s = open({ ...freshLearning(), tuneUp: past(freshLearning()).tuneUp }, MODE_IDS, 3);
    for (let seed = 1; seed < 60; seed++) {
      const ps = asked(s, seed, 8), seen = new Set<string>();
      for (const [i, p] of ps.entries()) {
        if (p.mode === 'meet') { expect(seen.has(p.meeting)).toBe(false); seen.add(p.meeting); continue; }
        for (const n of p.q.needs) expect(seen.has(n), `${p.q.word} needs ${n} (question ${i})`).toBe(true);
      }
    }
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
    let first = session.makeProblem(rng);
    while (first.mode === 'meet') first = session.makeProblem(rng);
    const again = session.replay(first, rng) as Asking;
    expect(again.mode).toBe(first.mode);
    expect(again.level).toBe((first as Asking).level);
    expect(again.push).toBe(false);
    expect(again.replay).toBe(true);
  });
  it('checks an answer: right or wrong', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2)), rng = seeded(9), session = mixedSession(() => s, async () => {}, rng);
    for (let i = 0; i < 60; i++) {
      const p = session.makeProblem(rng);
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      expect(session.check(p, rightAnswer(p.q)).kind).toBe('correct');
      expect(session.check(p, 'nonsense').kind).toBe('incorrect');
    }
  });
});
