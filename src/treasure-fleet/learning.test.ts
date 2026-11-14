import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { at, makeClue, makeGrid, makeKey, makeWhere, rightAnswer } from './map/problems';
import { FAST_PUSHED, FAST_RULE, freshLearning, MEETINGS, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, type Asked, type LearningState, type ModeId } from './learning';
import { isRight, meetingsFor, mixedSession, type Asking, type Problem } from './mix';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const met = (s: LearningState): LearningState => ({ ...s, met: [...MEETINGS] });
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1, starred: readonly ModeId[] = []): LearningState =>
  ({ ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1, starred: starred.includes(m) }])) as LearningState['modes'] });
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('unlocking', () => {
  it('starts with Where Is It and Map Key', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['where', 'key']));
  it('opens Grid Square at Where Is It Level 2, From Above at Map Key Level 2, and Follow the Clues once both are there', () => {
    const w = run(freshLearning(), 'where', 6);
    expect(w.state.modes.where.level).toBe(2);
    expect(w.changes).toContainEqual({ kind: 'open', mode: 'grid' });
    expect(w.state.modes.clue.opened).toBe(false);
    const k = run(w.state, 'key', 6);
    expect(k.changes).toContainEqual({ kind: 'open', mode: 'above' });
    expect(k.changes).toContainEqual({ kind: 'open', mode: 'clue' });
  });
  it('opens what a save has earned when it is read', () => {
    const s = readLearning({ modes: { where: { level: 2, opened: true }, key: { level: 3, opened: true } } });
    expect(s.modes.grid.opened && s.modes.clue.opened && s.modes.above.opened).toBe(true);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'where', 5).state.modes.where.level).toBe(1);
    expect(run(freshLearning(), 'where', 6).state.modes.where.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'key', 6).state, 'key', 6).state;
    expect(s.modes.key.level).toBe(3);
    s = run(s, 'key', 12, 'missed').state;
    expect(s.modes.key.level).toBe(3);
    expect(run(s, 'key', 10).changes).toContainEqual({ kind: 'star', mode: 'key' });
  });
  it('gives an easier question or a replayed miss no credit', () => expect(solve(freshLearning(), { mode: 'where', push: false }).state.modes.where.window).toEqual([]));
  it('has no Tune-Up: a new player\'s first Rounds stay at Level 1, on left, right, above and below', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const p of asked(met(freshLearning()), seed)) {
        if (p.mode === 'meet') continue;
        expect(p.level).toBe(1);
        if (p.q.kind === 'where') expect(p.q.rose).toBe('none');
      }
    }
  });
});

describe('a Round', () => {
  it('meets the map key before the first Map Key question, and nothing else at Level 1', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) for (const p of asked(freshLearning(), seed)) if (p.mode === 'meet') seen.add(p.meeting);
    expect([...seen]).toEqual(['key']);
  });
  it('meets the compass rose (with its rhyme) before the first question that uses it, once', () => {
    const s = { ...open(freshLearning(), ['where'], 2), met: ['key' as const, 'grid' as const] };
    const ps = asked(s, 3);
    expect(ps[0]).toEqual({ mode: 'meet', meeting: 'compass', push: false });
    expect(ps.filter(p => p.mode === 'meet')).toHaveLength(1);
  });
  it('knows which questions need the compass, the key or the grid', () => {
    expect(meetingsFor(makeWhere(1, 0, seeded(1)))).toEqual([]);
    expect(meetingsFor(makeWhere(2, 0, seeded(1)))).toEqual(['compass']);
    expect(meetingsFor(makeKey(1, 0, seeded(1)))).toEqual(['key']);
    expect(meetingsFor(makeGrid(1, 0, seeded(1)))).toEqual(['grid']);
    expect(meetingsFor(makeClue(1, 0, seeded(1)))).toEqual(['compass']);
  });
  it('never asks the same kind twice running while there is another', () => {
    const s = met(open(freshLearning(), MODE_IDS, 2));
    for (let seed = 1; seed < 200; seed++) {
      const k = asked(s, seed).map(p => p.mode);
      k.forEach((m, i) => { if (i) expect(m).not.toBe(k[i - 1]); });
    }
  });
  it('mixes every open kind across Rounds', () => {
    const s = met(open(freshLearning(), MODE_IDS, 3)), kinds = new Set<string>();
    for (let seed = 1; seed < 50; seed++) asked(s, seed).forEach(p => kinds.add(p.mode));
    expect([...kinds].sort()).toEqual([...MODE_IDS].sort());
  });
  it('asks a starred kind about once a Round', () => {
    const s = met(open(freshLearning(), MODE_IDS, 3, ['where']));
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) n += asked(s, seed).filter(p => p.mode === 'where').length;
    expect(n / 300).toBeGreaterThan(.7);
    expect(n / 300).toBeLessThan(1.4);
  });
  it('brings a miss back as a new map of the same kind and Level, with no credit', () => {
    const s = met(open(freshLearning(), MODE_IDS, 2)), rng = seeded(9), session = mixedSession(() => s, async () => {}, rng);
    const first = session.makeProblem(rng) as Asking, again = session.replay(first, rng) as Asking;
    expect(again.mode).toBe(first.mode);
    expect(again.level).toBe(first.level);
    expect(again.push).toBe(false);
    expect(again.replay).toBe(true);
    expect(JSON.stringify(again.q)).not.toBe(JSON.stringify(first.q));
  });
});

describe('checking an answer', () => {
  const ask = (q: Asking['q']): Asking => ({ mode: q.kind, level: 2, push: true, stretch: 0, q });
  it('takes the one right thing, marks another thing wrong, and ignores a tap on empty land', () => {
    const q = makeWhere(1, 1, seeded(4)), p = ask(q);
    expect(isRight(p, rightAnswer(q))).toBe(true);
    const other = q.map.things.find(t => t !== q.answer)!;
    expect(isRight(p, at(other))).toBe(false);
    const empty = Array.from({ length: q.map.w * q.map.h }, (_, i) => ({ x: i % q.map.w, y: Math.floor(i / q.map.w) })).find(c => !q.map.things.some(t => t.x === c.x && t.y === c.y))!;
    expect(isRight(p, at(empty))).toBeNull();
    expect(isRight(p, 'nonsense')).toBeNull();
  });
  it('takes any square in Grid Square and Follow the Clues, right or wrong', () => {
    const g = makeGrid(2, 0, seeded(2)), c = makeClue(2, 0, seeded(2));
    if (g.form !== 'tap') throw new Error('Level 2 taps');
    expect(isRight(ask(g), rightAnswer(g))).toBe(true);
    expect(isRight(ask(g), at({ x: (g.target.x + 1) % 5, y: g.target.y }))).toBe(false);
    expect(isRight(ask(c), rightAnswer(c))).toBe(true);
    expect(isRight(ask(c), at(c.start))).toBe(false);
    expect(isRight(ask(c), at({ x: 40, y: 1 }))).toBeNull();
  });
});
