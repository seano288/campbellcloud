import { describe, expect, it } from 'vitest';
import type { Outcome, SolvedProblem } from '../learning/session';
import { factKey, factsPool, FAST_PUSHED, freshLearning, MODE_IDS, opensAt, OPENS_AFTER, readLearning, recordSolved, ruleFor, startPractice, FAST_RULE, SLOW_RULE, stepFact, tuneUpOver, ANCHORS, type LearningState, type ModeId, type Asked } from './learning';
import { crossingFacts, factsFor } from './numbers/problems';

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

describe('saves from before the four later kinds', () => {
  /** A version 2 save exactly as the old game wrote it: nine kinds, six Meetings. */
  const oldLearning = (levels: Partial<Record<string, 1 | 2 | 3>>, opened: string[], extra: object = {}) => {
    const nine = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'scale', 'over'];
    return {
      modes: Object.fromEntries(nine.map(m => [m, { level: levels[m] ?? 1, window: ['clean', 'missed'], opened: opened.includes(m), starred: false, introPending: false, fresh: false }])),
      pushed: Object.fromEntries(nine.map(m => [m, 12])), facts: { strength: { '3+2': 4 }, since: 2 }, met: ['frame', 'path'],
      tuneUp: Object.fromEntries(ANCHORS.map(a => [a, { asked: 3, clean: 1, misses: 1 }])), ...extra,
    };
  };
  it('keeps everything it had', () => {
    const s = readLearning(oldLearning({ ten: 2, on: 3 }, ['ten', 'on', 'story', 'facts', 'tens']));
    expect(s.modes.on).toMatchObject({ level: 3, window: ['clean', 'missed'], opened: true });
    expect(s.pushed.on).toBe(12);
    expect(s.facts).toEqual({ strength: { '3+2': 4 }, since: 2 });
    expect(s.met).toEqual(['frame', 'path']);
    expect(s.tuneUp.ten).toEqual({ asked: 3, clean: 1, misses: 1 });
  });
  it('opens the new kinds he has already earned, and says so', () => {
    const s = readLearning(oldLearning({ ten: 3, on: 2, story: 2, facts: 2, tens: 3 }, ['ten', 'on', 'story', 'facts', 'tens']));
    expect([s.modes.chart.opened, s.modes.measure.opened, s.modes.shape.opened]).toEqual([true, true, true]);
    expect(s.modes.chart).toMatchObject({ level: 1, fresh: true, starred: false });
    expect(s.modes.jump.opened).toBe(false); // needs Number Chart at Level 2
  });
  it('leaves the others locked', () => {
    const s = readLearning(oldLearning({}, ['ten', 'on', 'story']));
    expect(MODE_IDS.filter(m => s.modes[m].opened)).toEqual(['ten', 'on', 'story']);
  });
  it('holds Shapes back while Tune-Up has placed Facts but Facts is still locked', () => {
    const s = readLearning(oldLearning({ facts: 2 }, ['ten', 'on', 'story']));
    expect(s.modes.shape.opened).toBe(false);
    const opened = run(s, 'ten', 6);
    expect(opened.state.modes.facts.opened).toBe(true);
    expect(opened.state.modes.shape.opened).toBe(true);
  });
  it('opens the chart for clean teens, as if the row had finished today', () => {
    const rows = { tuneUp: { ...Object.fromEntries(ANCHORS.map(a => [a, { asked: 1, clean: 0, misses: 0 }])), tens: { asked: 3, clean: 3, misses: 0 } } };
    const s = readLearning(oldLearning({ tens: 2 }, ['ten', 'on', 'story', 'tens'], rows));
    expect(s.modes.chart.opened).toBe(true);
    expect(tuneUpOver(s)).toBe(false); // the other rows carry on where they were
    expect(s.tuneUp.ten).toEqual({ asked: 1, clean: 0, misses: 0 });
  });
  it('announces a newly opened kind once only', () => {
    const once = readLearning(oldLearning({ on: 2 }, ['ten', 'on', 'story']));
    const twice = readLearning(JSON.parse(JSON.stringify(startPractice(once))));
    expect(twice.modes.chart).toMatchObject({ opened: true, fresh: false });
  });
});

describe('the later kinds', () => {
  it('open where the spec says', () => {
    expect(OPENS_AFTER.chart).toEqual(['on']);
    expect(OPENS_AFTER.measure).toEqual(['story']);
    expect(OPENS_AFTER.shape).toEqual(['facts']);
    expect(OPENS_AFTER.jump).toEqual(['tens', 'chart']);
    expect(opensAt('jump', 'tens')).toBe(3);
    expect(opensAt('jump', 'chart')).toBe(2);
  });
  it('hold Big Jumps until both parents reach their own Levels', () => {
    const level = (s: LearningState, m: ModeId, l: 2 | 3, opened = true): LearningState => ({ ...s, modes: { ...s.modes, [m]: { ...s.modes[m], level: l, opened } } });
    let s = level(level(freshLearning(), 'tens', 2), 'chart', 1 as 2);
    s = run(s, 'tens', 6).state;
    expect(s.modes.tens.level).toBe(3);
    expect(s.modes.jump.opened).toBe(false);
    const last = run(s, 'chart', 6);
    expect(last.state.modes.jump.opened).toBe(true);
    expect(last.changes).toContainEqual({ kind: 'open', mode: 'jump' });
  });
  it('three clean teens open the chart with Tens and Ones', () => {
    let s = freshLearning();
    const changes = [];
    for (let i = 0; i < 3; i++) { const r = solve(s, { mode: 'tens', push: false, probe: 'tens' }); s = r.state; changes.push(...r.changes); }
    expect(changes).toContainEqual({ kind: 'open', mode: 'chart' });
    expect(s.modes.chart.opened && s.modes.tens.opened).toBe(true);
  });
  it('let the facts that cross ten into Level 3 only once Over Ten is far enough', () => {
    const everything = { strength: Object.fromEntries(factsFor(3).map(p => [factKey(p), 5])), since: 9 };
    const crossing = crossingFacts().map(factKey);
    expect(factsPool(everything, 3).map(factKey).some(k => crossing.includes(k))).toBe(false);
    expect(factsPool(everything, 3, true).map(factKey).some(k => crossing.includes(k))).toBe(true);
    expect(factsPool(everything, 2, true).map(factKey).some(k => crossing.includes(k))).toBe(false);
  });
});
