import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, LETTER_GAP, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, meetingFor, mixedSession, type Asking, type Problem } from './mix';
import { needs, rightAnswer } from './reading/problems';
import { passageById } from './mail/index';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: outcome === 'helped', replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const past = (s: LearningState): LearningState => ({ ...s, met: [...MEETINGS], tuneUp: Object.fromEntries(ANCHORS.map(a => [a, { asked: 3, clean: 0, misses: 0 }])) as LearningState['tuneUp'] });
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1 }])) as LearningState['modes'] });

describe('the kinds and unlocking', () => {
  it('are Read the Mail, What Came Next, Big Idea, Clue Finder and Fact File', () => expect(MODE_IDS).toEqual(['ask', 'order', 'main', 'infer', 'fact']));
  it('starts with Read the Mail and What Came Next', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['ask', 'order']));
  it('opens Big Idea and Clue Finder at Read the Mail Level 2, and Fact File at What Came Next Level 2', () => {
    const a = run(freshLearning(), 'ask', 6);
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'main' });
    expect(a.changes).toContainEqual({ kind: 'open', mode: 'infer' });
    expect(a.state.modes.fact.opened).toBe(false);
    expect(run(a.state, 'order', 6).changes).toContainEqual({ kind: 'open', mode: 'fact' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { ask: { level: 2, opened: true }, order: { level: 3, opened: true } } });
    expect(s.modes.main.opened && s.modes.infer.opened && s.modes.fact.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'ask', 5).state.modes.ask.level).toBe(1);
    expect(run(freshLearning(), 'ask', 6).state.modes.ask.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'order', 6).state, 'order', 6).state;
    expect(s.modes.order.level).toBe(3);
    s = run(s, 'order', 12, 'missed').state;
    expect(s.modes.order.level).toBe(3);
    expect(run(s, 'order', 6).changes).toContainEqual({ kind: 'star', mode: 'order' });
  });
  it('an answer he had read to him (the speaker) earns no Mastery credit, as in Sentence Express: a child who listens to every letter does not rise', () => {
    const s = run(freshLearning(), 'ask', 40, 'helped').state;
    expect(s.modes.ask.level).toBe(1);
  });
  it('counts what he had read to him, for the parent', () => {
    let s = freshLearning();
    s = solve(s, { mode: 'ask', push: true, letter: 'ask1-01', qi: 0, listened: true }, 'helped').state;
    s = solve(s, { mode: 'ask', push: true, letter: 'ask1-02', qi: 0, listened: false }).state;
    expect(s.heard).toMatchObject({ answered: 2, helped: 1 });
    expect(readLearning(JSON.parse(JSON.stringify(s))).heard).toEqual(s.heard);
  });
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'ask', push: false, probe: 'ask' }).state;
    expect(s.modes.ask.level).toBe(2);
    expect(s.modes.main.opened).toBe(true);
    let t = freshLearning();
    t = recordSolved(t, { mode: 'order', push: false, probe: 'order' }, { ...fact('missed'), misses: 2 }).state;
    expect(t.tuneUp.order.misses).toBe(2);
    expect(tuneUpOver({ ...t, tuneUp: { ...t.tuneUp, ask: { asked: 3, clean: 1, misses: 0 } } })).toBe(true);
  });
});

/** A whole run of Rounds by a child who gets everything right first try: every question, every Meeting, every kind. */
function playRounds(start: LearningState, rounds: number, seed = 1) {
  let s = start;
  const asked: Problem[] = [], rng = seeded(seed);
  for (let r = 0; r < rounds; r++) {
    const session = mixedSession(() => s, async () => {}, rng);
    for (let i = 0; i < 5; i++) {
      const p = session.makeProblem(rng);
      asked.push(p);
      expect(isRight(p, p.mode === 'meet' ? 'ok' : rightAnswer((p as Asking).q))).toBe(true);
      const a: Asked = p.mode === 'meet' ? { meet: p.meeting } : { mode: p.mode, push: p.push, ...(p.probe && { probe: p.probe }), letter: p.q.pid, qi: p.q.qi };
      s = solve(s, a).state;
      session.note('clean');
    }
  }
  return { state: s, asked };
}

describe('a Round', () => {
  it('never asks the same kind twice running while there is another, and never a letter twice', () => {
    const { asked } = playRounds(past(open(freshLearning(), MODE_IDS, 2)), 30, 3);
    for (let r = 0; r < 30; r++) {
      const round = asked.slice(r * 5, r * 5 + 5).filter((p): p is Asking => p.mode !== 'meet');
      for (let i = 1; i < round.length; i++) expect(round[i]!.mode).not.toBe(round[i - 1]!.mode);
      expect(new Set(round.map(p => p.q.pid)).size).toBe(round.length);
    }
  });
  it('meets a base word before the first letter that uses it, and never asks one he hasn\'t met', () => {
    const { asked } = playRounds(freshLearning(), 40, 7);
    const met = new Set<string>();
    for (const p of asked) {
      if (p.mode === 'meet') { met.add(p.meeting); continue; }
      for (const g of needs(p.q)) expect(met.has(g), `${p.q.pid} needs ${g}`).toBe(true);
    }
    expect(meetingFor({ ...asked.find((p): p is Asking => p.mode !== 'meet')!.q }, [...MEETINGS])).toBeNull();
  });
  it('a letter is not asked again until at least twenty others have been, nor with the same question twice running', () => {
    for (const [start, label] of [[freshLearning(), 'new'], [past(open(freshLearning(), MODE_IDS, 2)), 'L2'], [past(open(freshLearning(), MODE_IDS, 3)), 'L3'], [past(open(freshLearning(), ['ask', 'order'], 2)), 'two kinds at L2']] as const) {
      const { asked } = playRounds(start, 150, 11);
      const letters = asked.filter((p): p is Asking => p.mode !== 'meet');
      let short = 0;
      const lastAt = new Map<string, number>(), lastQ = new Map<string, number>();
      letters.forEach((p, i) => {
        const was = lastAt.get(p.q.pid);
        if (was !== undefined && i - was <= LETTER_GAP) short++;
        if (was !== undefined) expect(p.q.qi, `${label}: ${p.q.pid} asked the same way twice running`).not.toBe(lastQ.get(p.q.pid));
        lastAt.set(p.q.pid, i); lastQ.set(p.q.pid, p.q.qi);
      });
      expect(short, `${label}: letters back within twenty`).toBe(0);
    }
  });
  it('every letter in a save that is gone reads away', () => {
    const s = readLearning({ recent: ['ask1-01', 'nope-99'], lastQ: { 'ask1-01': 1, 'nope-99': 0 } }, id => !!passageById(id));
    expect(s.recent).toEqual(['ask1-01']);
    expect(s.lastQ).toEqual({ 'ask1-01': 1 });
  });
});
