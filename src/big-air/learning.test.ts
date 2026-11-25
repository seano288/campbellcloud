import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeQuestion } from './questions/problems';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, meetingFor, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, mixedSession, type Problem } from './mix';

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
  it('are Ruler, Best Guess, How Much Longer, Jump Line, Length Stories and Two Units', () => expect(MODE_IDS).toEqual(['ruler', 'guess', 'longer', 'line', 'story', 'units']));
  it('starts with Ruler and Best Guess', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['ruler', 'guess']));
  it('opens How Much Longer and Jump Line at Ruler Level 2, Two Units at Best Guess Level 2, Length Stories at How Much Longer Level 2', () => {
    const a = run(freshLearning(), 'ruler', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'longer' });
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'line' });
    expect(a.state.modes.units.opened).toBe(false);
    expect(a.state.modes.story.opened).toBe(false);
    const b = run(a.state, 'guess', 6);
    expect(b.changes).toContainEqual({ kind: 'open', mode: 'units' });
    const c = run(b.state, 'longer', 6);
    expect(c.changes).toContainEqual({ kind: 'open', mode: 'story' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { ruler: { level: 2, opened: true }, guess: { level: 3, opened: true }, longer: { level: 2, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
  });
});

describe('Mastery', () => {
  it("is quick for a kind's first questions, then asks for 16 of 20", () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'ruler', 5).state.modes.ruler.level).toBe(1);
    expect(run(freshLearning(), 'ruler', 6).state.modes.ruler.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'guess', 6).state, 'guess', 6).state;
    expect(s.modes.guess.level).toBe(3);
    s = run(s, 'guess', 12, 'missed').state;
    expect(s.modes.guess.level).toBe(3);
    expect(run(s, 'guess', 6).changes).toContainEqual({ kind: 'star', mode: 'guess' });
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'ruler', push: false, probe: 'ruler' }).state;
    expect(s.modes.ruler.level).toBe(2);
    expect(s.modes.longer.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'guess', push: false, probe: 'guess' }, 'missed').state;
    expect(s.modes.guess.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
});

describe('a Round', () => {
  it('meets the ruler, centimetres and feet before the first question that needs each, and only once', () => {
    const q = makeQuestion('ruler', 1, 0, seeded(3));
    expect(meetingFor(q, [])).toBe(q.needs[0]);
    expect(meetingFor(q, [...MEETINGS])).toBeNull();
    const s = open({ ...freshLearning(), tuneUp: past(freshLearning()).tuneUp }, MODE_IDS, 2);
    for (let seed = 1; seed < 80; seed++) {
      const ps = asked(s, seed, 8), seen = new Set<string>();
      for (const p of ps) {
        if (p.mode === 'meet') { expect(seen.has(p.meeting)).toBe(false); seen.add(p.meeting); continue; }
        for (const n of p.q.needs) expect(seen.has(n), `${p.q.kind} needs ${n}`).toBe(true);
      }
    }
  });
  it('mixes every open kind, never the same kind twice running while there is another', () => {
    const s = open(past(freshLearning()), MODE_IDS, 2);
    for (let seed = 1; seed < 40; seed++) {
      const ps = asked(s, seed, 5).filter(p => p.mode !== 'meet');
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode).not.toBe(ps[i - 1]!.mode);
    }
  });
  it('asks the Tune-Up probes first, at Level 2', () => {
    const ps = asked(freshLearning(), 2, 6).filter(p => p.mode !== 'meet');
    expect(ps.slice(0, 2).every(p => 'probe' in p && p.probe && p.level === 2)).toBe(true);
  });
  it('checks an answer: right, wrong, or not an answer at all', () => {
    const s = open(past(freshLearning()), MODE_IDS, 1);
    for (const p of asked(s, 5, 10)) {
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      expect(isRight(p, p.q.answer)).toBe(true);
      expect(isRight(p, '')).toBeNull(); expect(isRight(p, 'nope')).toBe(false);
    }
  });
});
