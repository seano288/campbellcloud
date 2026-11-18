import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { makeQuestion } from './econ/problems';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, meetingFor, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, mixedSession, MOST_MEETS, MOST_TOTALS, type Asking, type Problem } from './mix';

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
  it('are the brief\'s six', () => expect(MODE_IDS).toEqual(['need', 'goods', 'job', 'total', 'enough', 'save']));
});

describe('unlocking', () => {
  it('starts with Need or Want, Goods and Services, and Add It Up', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['need', 'goods', 'total']));
  it('opens Jobs at Goods and Services Level 2, Enough? at Add It Up Level 2, and Save Up at Enough? Level 2', () => {
    const g = run(freshLearning(), 'goods', 6);
    expect(g.changes).toContainEqual({ kind: 'open', mode: 'job' });
    const t = run(g.state, 'total', 6);
    expect(t.changes).toContainEqual({ kind: 'open', mode: 'enough' });
    expect(t.state.modes.save.opened).toBe(false);
    expect(run(t.state, 'enough', 6).changes).toContainEqual({ kind: 'open', mode: 'save' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { goods: { level: 2, opened: true }, total: { level: 2, opened: true }, enough: { level: 3, opened: true } } });
    expect(s.modes.job.opened && s.modes.enough.opened && s.modes.save.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20 (or 10 in a row)', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'need', 5).state.modes.need.level).toBe(1);
    expect(run(freshLearning(), 'need', 6).state.modes.need.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'need', 6).state, 'need', 6).state;
    expect(s.modes.need.level).toBe(3);
    s = run(s, 'need', 12, 'missed').state;
    expect(s.modes.need.level).toBe(3);
    expect(run(s, 'need', 6).changes).toContainEqual({ kind: 'star', mode: 'need' });
  });
  it('gives an easier question or a replay no credit', () => expect(solve(freshLearning(), { mode: 'need', push: false }).state.modes.need.window).toEqual([]));
});

describe('Tune-Up (Add It Up only)', () => {
  it('starts Add It Up at Level 2 after three clean probes (opening Enough?), and stops after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'total', push: false, probe: 'total' }).state;
    expect(s.modes.total.level).toBe(2);
    expect(s.modes.enough.opened).toBe(true);
    let t = freshLearning();
    for (let i = 0; i < 2; i++) t = solve(t, { mode: 'total', push: false, probe: 'total' }, 'missed').state;
    expect(t.modes.total.level).toBe(1);
    expect(tuneUpOver(t)).toBe(true);
  });
  it('probes once a Round, at Level 2, never as the first question', () => {
    for (let seed = 1; seed < 50; seed++) {
      const ps = asked({ ...freshLearning(), met: [...MEETINGS] }, seed).filter((p): p is Asking => p.mode !== 'meet');
      const probes = ps.filter(p => p.probe);
      expect(probes).toHaveLength(1);
      expect(ps[0]!.probe).toBeUndefined();
      probes.forEach(p => { expect(p.level).toBe(2); expect(p.push).toBe(false); });
    }
  });
});

describe('a Round', () => {
  it('a new player meets needs and wants first, then gets a Need or Want question', () => {
    const ps = asked(freshLearning(), 3);
    expect(ps[0]).toEqual({ mode: 'meet', meeting: 'needs', push: false });
    expect(ps[1]!.mode).toBe('need');
  });
  it('meets each idea once, before its first question: goods and services, and the money', () => {
    expect(meetingFor(makeQuestion('goods', 1, 0, seeded(1)))).toBe('goods');
    expect(meetingFor(makeQuestion('job', 1, 0, seeded(1)))).toBeNull();
    for (const k of ['total', 'enough', 'save'] as const) expect(meetingFor(makeQuestion(k, 1, 0, seeded(1)))).toBe('money');
    for (let seed = 1; seed < 40; seed++) {
      const ps = asked({ ...past(open(freshLearning(), MODE_IDS, 2)), met: [] }, seed, 8);
      const meets = ps.filter(p => p.mode === 'meet');
      expect(new Set(meets.map(p => (p as { meeting: string }).meeting)).size).toBe(meets.length);
      ps.forEach((p, i) => { if (p.mode !== 'meet' && meetingFor(p.q)) expect(ps.slice(0, i).some(x => x.mode === 'meet' && x.meeting === meetingFor((p as Asking).q))).toBe(true); });
    }
  });
  it('has at most two Meetings a Round, and a missed question coming back never loses the one waiting behind a Meeting', () => {
    for (let seed = 1; seed < 300; seed++) {
      const ps = asked({ ...past(open(freshLearning(), MODE_IDS, 2)), met: [] }, seed, 5);
      expect(ps.filter(p => p.mode === 'meet').length).toBeLessThanOrEqual(MOST_MEETS);
    }
    const s = { ...freshLearning(), met: ['needs' as const] }, rng = seeded(4), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng) as Asking;
    let p = session.makeProblem(rng);
    for (let i = 0; i < 5 && p.mode !== 'meet'; i++) p = session.makeProblem(rng);
    expect(p.mode).toBe('meet');
    session.replay(first, rng); // the missed one comes back between the Meeting and its question
    const after = session.makeProblem(rng) as Asking;
    expect(meetingFor(after.q)).toBe((p as { meeting: string }).meeting);
  });
  it('keeps Add It Up small: at most one a Round', () => {
    expect(MOST_TOTALS).toBe(1);
    for (const s of [past(open(freshLearning(), MODE_IDS, 2)), past(freshLearning()), past(open(freshLearning(), ['total', 'need'], 1))]) for (let seed = 1; seed < 200; seed++) {
      expect(asked(s, seed).filter(p => p.mode === 'total').length).toBeLessThanOrEqual(MOST_TOTALS);
    }
    // when it's all there is, it still fills the Round
    expect(asked(past(open(freshLearning(), ['total'])), 1).every(p => p.mode === 'total')).toBe(true);
  });
  it('never asks the same kind twice running while there is another', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).map(p => p.mode);
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('asks a starred kind about once a Round', () => {
    const s = past(open(freshLearning(), MODE_IDS, 3, ['need']));
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) n += asked(s, seed).filter(p => p.mode === 'need').length;
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
  it('checks an answer: right, wrong, part of a sort, or not an answer at all', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2)), rng = seeded(9), session = mixedSession(() => s, async () => {}, rng);
    for (let i = 0; i < 40; i++) {
      const p = session.makeProblem(rng);
      if (p.mode === 'meet') { expect(isRight(p, 'ok')).toBe(true); continue; }
      expect(session.check(p, p.q.answer).kind).toBe('correct');
      if (p.q.form === 'sort') {
        const [first] = p.q.answer.split(',');
        expect(session.check(p, first!).kind).toBe('not-an-answer');
      } else expect(session.check(p, 'nonsense').kind).toBe('incorrect');
    }
  });
});
