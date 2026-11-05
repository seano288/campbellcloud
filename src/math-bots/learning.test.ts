import { describe, expect, it } from 'vitest';
import type { Outcome, SolvedProblem } from '../learning/session';
import { factKey, factsPool, FAST_PUSHED, freshLearning, MODE_IDS, opensAt, OPENS_AFTER, readLearning, recordSolved, ruleFor, FAST_RULE, SLOW_RULE, stepFact, tuneUpOver, ANCHORS, type LearningState, type ModeId, type Asked } from './learning';
import { factsFor } from './numbers/problems';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}

describe('unlocking', () => {
  it('starts with the three the spec names', () => {
    const open = MODE_IDS.filter(m => freshLearning().modes[m].opened);
    expect(open).toEqual(['ten', 'on', 'story']);
  });
  it('opens the kinds behind each parent at Level 2', () => {
    const { state, changes } = run(freshLearning(), 'ten', 6);
    expect(state.modes.ten.level).toBe(2);
    expect(changes).toContainEqual({ kind: 'open', mode: 'facts' });
    expect(changes).toContainEqual({ kind: 'open', mode: 'tens' });
    expect(state.modes.over.opened).toBe(false);
    const on = run(state, 'on', 6).state;
    expect(on.modes.part.opened && on.modes.skip.opened).toBe(true);
    expect(run(on, 'part', 6).state.modes.scale.opened).toBe(true);
  });
  it('holds Over Ten until both parents reach their own Levels, in either order', () => {
    expect(OPENS_AFTER.over).toEqual(['ten', 'tens']);
    expect(opensAt('over', 'ten')).toBe(3);
    expect(opensAt('over', 'tens')).toBe(2);
    let s = run(freshLearning(), 'ten', 6).state;
    s = run(s, 'tens', 6).state;
    expect(s.modes.over.opened).toBe(false);
    const last = run(s, 'ten', 6);
    expect(last.state.modes.over.opened).toBe(true);
    expect(last.changes).toContainEqual({ kind: 'open', mode: 'over' });
    let t = run(run(freshLearning(), 'ten', 6).state, 'ten', 6).state;
    expect(t.modes.over.opened).toBe(false);
    t = run(t, 'tens', 6).state;
    expect(t.modes.over.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is fast for the first 30 pushed questions, then the slower rule', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED - 1)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(run(freshLearning(), 'ten', 5).state.modes.ten.level).toBe(1);
    expect(run(freshLearning(), 'ten', 6).state.modes.ten.level).toBe(2);
    let s = freshLearning();
    s = { ...s, pushed: { ...s.pushed, on: FAST_PUSHED } };
    expect(run(s, 'on', 6).state.modes.on.level).toBe(1);
    expect(run(s, 'on', 10).state.modes.on.level).toBe(2);
  });
  it('gives a replay or an easier question no credit', () => {
    const s = solve(freshLearning(), { mode: 'ten', push: false }).state;
    expect(s.modes.ten.window).toEqual([]);
    expect(s.pushed.ten).toBe(0);
  });
  it('stars the top Level and never lowers one', () => {
    let s = freshLearning();
    s = { ...s, modes: { ...s.modes, ten: { ...s.modes.ten, level: 3 } } };
    const r = run(s, 'ten', 6);
    expect(r.state.modes.ten.starred).toBe(true);
    expect(r.changes).toContainEqual({ kind: 'star', mode: 'ten' });
    expect(run(r.state, 'ten', 10, 'missed').state.modes.ten.level).toBe(3);
  });
});

describe('placement', () => {
  const probe = (s: LearningState, a: (typeof ANCHORS)[number], outcome: Outcome, misses?: number) =>
    recordSolved(s, { mode: a, push: false, probe: a }, fact(outcome, misses));
  it('places at Level 2 only after three clean probes, and opens what that opens', () => {
    let s = freshLearning();
    s = probe(s, 'ten', 'clean').state;
    s = probe(s, 'ten', 'clean').state;
    expect(s.modes.ten.level).toBe(1);
    const r = probe(s, 'ten', 'clean');
    expect(r.state.modes.ten.level).toBe(2);
    expect(r.state.modes.facts.opened).toBe(true);
    expect(r.changes).toContainEqual({ kind: 'levelUp', mode: 'ten', level: 2 });
  });
  it('stops a row after two misses, leaving him where he was', () => {
    let s = freshLearning();
    s = probe(s, 'story', 'missed').state;
    s = probe(s, 'story', 'missed').state;
    expect(s.tuneUp.story.misses).toBe(2);
    expect(s.modes.story.level).toBe(1);
  });
  it('opens Tens and Ones on three clean teens, without touching Over Ten', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = probe(s, 'tens', 'clean').state;
    expect(s.modes.tens).toMatchObject({ level: 2, opened: true });
    expect(s.modes.over.opened).toBe(false);
  });
  it('never places past Bot Stories Level 2, Weigh-In Level 1 or Skip Count Level 1', () => {
    let s = freshLearning();
    for (const a of ANCHORS) for (let i = 0; i < 3; i++) s = probe(s, a, 'clean').state;
    expect(tuneUpOver(s)).toBe(true);
    expect(s.modes.story.level).toBe(2);
    expect(s.modes.scale).toMatchObject({ level: 1, opened: false });
    expect(s.modes.skip).toMatchObject({ level: 1, opened: true });
    expect(MODE_IDS.every(m => s.modes[m].level <= 2)).toBe(true);
  });
  it('gives a probe no Mastery credit', () => {
    const s = probe(freshLearning(), 'on', 'clean').state;
    expect(s.modes.on.window).toEqual([]);
  });
});

describe('fact Strength', () => {
  const key = factKey([3, 5]);
  it('treats a family as one fact', () => expect(factKey([5, 3])).toBe(factKey([3, 5])));
  it('goes up on a clean answer and down on a miss', () => {
    let f = stepFact({ strength: {}, since: 0 }, key, 'clean', true);
    expect(f.strength[key]).toBe(1);
    f = stepFact(f, key, 'missed', true);
    expect(f.strength[key]).toBe(0);
  });
  it('needs a quick answer for the top, and never drops for a slow one', () => {
    let f = { strength: { [key]: 4 }, since: 0 };
    f = stepFact(f, key, 'clean', false);
    expect(f.strength[key]).toBe(4);
    f = stepFact(f, key, 'clean', true);
    expect(f.strength[key]).toBe(5);
    expect(stepFact(f, key, 'clean', false).strength[key]).toBe(5);
  });
  it('adds a family only after clean answers, and holds it while too many are shaky', () => {
    const all = factsFor(1), four = all.slice(0, 4).map(factKey);
    const strong = Object.fromEntries(four.map(k => [k, 3]));
    expect(factsPool({ strength: {}, since: 0 }, 1)).toHaveLength(4);
    expect(factsPool({ strength: strong, since: 2 }, 1)).toHaveLength(4);
    expect(factsPool({ strength: strong, since: 3 }, 1)).toHaveLength(5);
    expect(factsPool({ strength: Object.fromEntries(four.map(k => [k, 1])), since: 9 }, 1)).toHaveLength(4);
  });
  it('is kept through a save', () => {
    const r = solve(freshLearning(), { mode: 'facts', push: true, fact: key, quick: true });
    expect(readLearning(JSON.parse(JSON.stringify(r.state))).facts.strength[key]).toBe(1);
  });
});

describe('saves', () => {
  it('round-trips and survives rubbish', () => {
    let s = run(freshLearning(), 'ten', 8).state;
    s = solve(s, { meet: 'frame' }).state;
    expect(readLearning(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(readLearning({ modes: 3, met: 'x', tuneUp: [] })).toEqual(freshLearning());
  });
});
