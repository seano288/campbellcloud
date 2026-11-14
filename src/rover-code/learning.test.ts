import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { encodeProgram } from './code/grid';
import { makeBug, makeDrive, makeLoop, makePattern } from './code/problems';
import { ANCHORS, FAST_PUSHED, FAST_RULE, freshLearning, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, tuneUpOver, type Asked, type LearningState, type ModeId } from './learning';
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

describe('unlocking', () => {
  it('starts with Drive It and Patterns', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['drive', 'pattern']));
  it('opens Bug Hunt at Drive It Level 2, and Loops only once Patterns is there too', () => {
    const d = run(freshLearning(), 'drive', 6);
    expect(d.state.modes.drive.level).toBe(2);
    expect(d.changes).toContainEqual({ kind: 'open', mode: 'bug' });
    expect(d.state.modes.loop.opened).toBe(false);
    const p = run(d.state, 'pattern', 6);
    expect(p.changes).toContainEqual({ kind: 'open', mode: 'loop' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { drive: { level: 2, opened: true }, pattern: { level: 3, opened: true } } });
    expect(s.modes.bug.opened && s.modes.loop.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(run(freshLearning(), 'drive', 5).state.modes.drive.level).toBe(1);
    expect(run(freshLearning(), 'drive', 6).state.modes.drive.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'pattern', 6).state, 'pattern', 6).state;
    expect(s.modes.pattern.level).toBe(3);
    s = run(s, 'pattern', 12, 'missed').state;
    expect(s.modes.pattern.level).toBe(3);
    const star = run(s, 'pattern', 6);
    expect(star.changes).toContainEqual({ kind: 'star', mode: 'pattern' });
  });
  it('gives an easier question or a replay no credit', () => expect(solve(freshLearning(), { mode: 'drive', push: false }).state.modes.drive.window).toEqual([]));
});

describe('Tune-Up', () => {
  it('starts a kind at Level 2 after three clean probes, and stops a row after two misses', () => {
    let s = freshLearning();
    for (let i = 0; i < 3; i++) s = solve(s, { mode: 'drive', push: false, probe: 'drive' }).state;
    expect(s.modes.drive.level).toBe(2);
    expect(s.modes.bug.opened).toBe(true);
    for (let i = 0; i < 2; i++) s = solve(s, { mode: 'pattern', push: false, probe: 'pattern' }, 'missed').state;
    expect(s.modes.pattern.level).toBe(1);
    expect(tuneUpOver(s)).toBe(true);
  });
  it('probes each open row once a Round, at Level 2', () => {
    const ps = asked(freshLearning()).filter((p): p is Asking => p.mode !== 'meet');
    expect(ps.filter(p => p.probe).map(p => p.probe).sort()).toEqual(['drive', 'pattern']);
    ps.filter(p => p.probe).forEach(p => { expect(p.level).toBe(2); expect(p.push).toBe(false); });
  });
});

describe('a Round', () => {
  it('meets the program bar before the first Drive It, once', () => {
    const s = { ...freshLearning(), tuneUp: past(freshLearning()).tuneUp }, ps = asked(open(s, ['drive']), 2);
    expect(ps[0]).toEqual({ mode: 'meet', meeting: 'program', push: false });
    expect(ps.filter(p => p.mode === 'meet')).toHaveLength(1);
  });
  it('never asks the same kind twice running while there is another', () => {
    const s = past(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).map(p => p.mode);
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('asks a starred kind about once a Round', () => {
    const s = past(open(freshLearning(), MODE_IDS, 3, ['drive']));
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) n += asked(s, seed).filter(p => p.mode === 'drive').length;
    expect(n / 300).toBeGreaterThan(.7);
    expect(n / 300).toBeLessThan(1.4);
  });
});

describe('checking an answer', () => {
  const ask = (q: Asking['q'], mode: ModeId): Asking => ({ mode, level: 2, push: true, stretch: 0, q });
  it('takes any program that ends on the flag, and none that does not', () => {
    const q = makeDrive(2, 1, seeded(7)), p = ask(q, 'drive');
    expect(isRight(p, encodeProgram(q.path))).toBe(true);
    expect(isRight(p, encodeProgram(q.path.slice(0, -1)))).toBe(false);
    expect(isRight(p, '')).toBeNull();
  });
  it('finds the bug first, then the arrow that fixes it (at Level 1 finding it is enough)', () => {
    const q = makeBug(2, 1, seeded(3)), p = ask(q, 'bug'), other = q.bug === 0 ? 1 : 0;
    expect(isRight(p, `step:${q.bug}`)).toBe('more');
    expect(isRight(p, `step:${other}`)).toBe(false);
    expect(isRight(p, `fix:${q.bug}:${q.path[q.bug]}`)).toBe(true);
    expect(isRight(p, `fix:${q.bug}:${q.program[q.bug]}`)).toBe(false);
    const l1 = makeBug(1, 0, seeded(3));
    expect(isRight({ ...ask(l1, 'bug'), level: 1 }, `step:${l1.bug}`)).toBe(true);
  });
  it('checks a pattern by what goes in the gap, and a loop by where it drives', () => {
    const pat = makePattern(2, 0, seeded(2));
    expect(isRight(ask(pat, 'pattern'), pat.answer)).toBe(true);
    expect(isRight(ask(pat, 'pattern'), pat.choices.find(c => c !== pat.answer)!)).toBe(false);
    const loop = makeLoop(1, 1, seeded(4)), d = loop.blocks[0]!.steps[0]!, n = loop.blocks[0]!.times;
    expect(isRight(ask(loop, 'loop'), `${d}${n}`)).toBe(true);
    expect(isRight(ask(loop, 'loop'), `${d}${n + 1}`)).toBe(false);
  });
});
