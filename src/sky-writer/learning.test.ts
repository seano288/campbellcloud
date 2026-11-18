// What Sky Writer asks and when: the kinds open in order, Levels rise on Mastery and never fall, Families are met before they are asked
// and keep a strength, and every Round mixes the kinds he has opened.
import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import type { Outcome, SolvedProblem } from '../learning/session';
import { FAMILY_GAP, FAST_PUSHED, FAST_RULE, familyDue, freshLearning, MODE_IDS, readLearning, recordSolved, ruleFor, SLOW_RULE, type Asked, type LearningState, type ModeId } from './learning';
import { FAMILY_IDS, letter, metLetters, type FamilyId } from './letters/strokes';
import { mixedSession, type Problem } from './mix';
import { familyOf } from './writing/problems';
import { PHRASES, sayLetter, FAMILY_LINES } from './phrases';

const fact = (outcome: Outcome, misses = outcome === 'clean' ? 0 : 1): SolvedProblem => ({ index: 1, outcome, misses, helped: false, replay: false });
const solve = (s: LearningState, asked: Asked, outcome: Outcome = 'clean') => recordSolved(s, asked, fact(outcome));
function run(s: LearningState, mode: ModeId, n: number, outcome: Outcome = 'clean', family: FamilyId = 'lines') {
  const changes = [];
  for (let i = 0; i < n; i++) { const r = solve(s, { mode, push: true, family }, outcome); s = r.state; changes.push(...r.changes); }
  return { state: s, changes };
}
const open = (s: LearningState, ids: readonly ModeId[], level: 1 | 2 | 3 = 1, families: FamilyId[] = [...FAMILY_IDS]): LearningState => ({
  ...s, families, strength: Object.fromEntries(families.map(f => [f, 3])),
  modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: ids.includes(m), level: ids.includes(m) ? level : 1 }])) as LearningState['modes'],
});
const asked = (s: LearningState, seed = 1, n = 5) => { const rng = seeded(seed), session = mixedSession(() => s, async () => {}, rng), out: Problem[] = []; for (let i = 0; i < n; i++) out.push(session.makeProblem(rng)); return out; };

describe('unlocking', () => {
  it('starts with Trace It and Where to Start', () => expect(MODE_IDS.filter(m => freshLearning().modes[m].opened)).toEqual(['trace', 'start']));
  it('opens Which Way at Trace It Level 2, Tall Small Tail at Where to Start Level 2, Write It once both are, Write a Word at Write It Level 2', () => {
    const t = run(freshLearning(), 'trace', 6);
    expect(t.state.modes.trace.level).toBe(2);
    expect(t.changes).toContainEqual({ kind: 'open', mode: 'flip' });
    expect(t.state.modes.write.opened).toBe(false);
    const s = run(t.state, 'start', 6);
    expect(s.changes).toContainEqual({ kind: 'open', mode: 'size' });
    expect(s.changes).toContainEqual({ kind: 'open', mode: 'write' });
    expect(s.state.modes.word.opened).toBe(false);
    const w = run(s.state, 'write', 6);
    expect(w.changes).toContainEqual({ kind: 'open', mode: 'word' });
  });
  it('opens what a save has earned when it is read, and reads a broken save as fresh', () => {
    const s = readLearning({ modes: { trace: { level: 2, opened: true }, start: { level: 2, opened: true }, write: { level: 2, opened: true } } });
    expect(MODE_IDS.every(m => s.modes[m].opened)).toBe(true);
    expect(readLearning('nonsense')).toEqual(freshLearning());
    expect(readLearning({ families: ['c', 'lines', 'tall', 'nope'] }).families).toEqual(['lines', 'c', 'tall']);
    expect(readLearning({ families: ['c', 'tall'] }).families).toEqual([]);
  });
});

describe('Mastery', () => {
  it('is quick for a kind\'s first questions, then asks for 16 of 20 or 10 in a row', () => {
    expect(ruleFor(0)).toBe(FAST_RULE);
    expect(ruleFor(FAST_PUSHED)).toBe(SLOW_RULE);
    expect(SLOW_RULE).toMatchObject({ window: 20, mastery: 16, streak: 10 });
    expect(run(freshLearning(), 'trace', 5).state.modes.trace.level).toBe(1);
    expect(run(freshLearning(), 'trace', 6).state.modes.trace.level).toBe(2);
  });
  it('never goes down, and stars at Level 3', () => {
    let s = run(run(freshLearning(), 'start', 6).state, 'start', 6).state;
    expect(s.modes.start.level).toBe(3);
    s = run(s, 'start', 12, 'missed').state;
    expect(s.modes.start.level).toBe(3);
    expect(run(s, 'start', 10).changes).toContainEqual({ kind: 'star', mode: 'start' });
  });
  it('gives an easier question or a replayed miss no credit', () => expect(solve(freshLearning(), { mode: 'trace', push: false, family: 'lines' }).state.modes.trace.window).toEqual([]));
});

describe('Families', () => {
  it('meets each Family before it is asked, in order: straight-line capitals first', () => {
    const first = asked(freshLearning(), 1, 1)[0]!;
    expect(first.mode).toBe('meet');
    expect(first.q).toMatchObject({ kind: 'meet', family: 'lines' });
    const met = solve(freshLearning(), { meet: 'lines' }).state;
    expect(met.families).toEqual(['lines']);
    expect(familyDue(met)).toBe(false);
    let s = met;
    for (let i = 0; i < FAMILY_GAP; i++) s = solve(s, { mode: 'trace', push: false, family: 'lines' }).state;
    expect(familyDue(s)).toBe(true);
    expect(familyDue({ ...s, strength: { lines: 1 } })).toBe(false);
    expect(asked(s, 2, 1)[0]!.q).toMatchObject({ kind: 'meet', family: 'c' });
  });
  it('asks the next question about a letter of the Family just met', () => {
    const s = { ...open(freshLearning(), ['trace', 'start'], 1, ['lines']), sinceMeet: FAMILY_GAP };
    for (let seed = 1; seed < 20; seed++) {
      const [meet, next] = asked(s, seed, 2);
      expect(meet!.mode).toBe('meet');
      if (next!.mode !== 'meet') expect(familyOf(next!.q)).toBe('c');
    }
  });
  it('keeps a strength from 0 to 5: up on a first-try answer, down with help or a miss', () => {
    let s = solve(freshLearning(), { meet: 'lines' }).state;
    s = solve(s, { mode: 'trace', push: true, family: 'lines' }).state;
    expect(s.strength.lines).toBe(1);
    s = solve(s, { mode: 'trace', push: true, family: 'lines' }, 'missed').state;
    expect(s.strength.lines).toBe(0);
    for (let i = 0; i < 9; i++) s = solve(s, { mode: 'trace', push: true, family: 'lines' }).state;
    expect(s.strength.lines).toBe(5);
  });
  it('says what each Family shares, and names every letter', () => {
    for (const f of FAMILY_IDS) expect(PHRASES).toContain(FAMILY_LINES[f]);
    for (const ch of metLetters([...FAMILY_IDS])) for (const p of sayLetter(ch)) expect(PHRASES).toContain(p);
  });
});

describe('a Round', () => {
  it('mixes the kinds he has opened, never the same kind twice running while there is another', () => {
    const s = open(freshLearning(), [...MODE_IDS], 2);
    const kinds = new Set<string>();
    for (let seed = 1; seed < 30; seed++) {
      const ps = asked(s, seed, 5);
      for (let i = 1; i < ps.length; i++) expect(ps[i]!.mode, `seed ${seed}`).not.toBe(ps[i - 1]!.mode);
      for (const p of ps) kinds.add(p.mode);
    }
    expect([...kinds].sort()).toEqual([...MODE_IDS].sort());
  });
  it('asks only letters from Families he has met, at his Level or easier, and mostly at his Level', () => {
    const s = open(freshLearning(), [...MODE_IDS], 3, ['lines', 'c', 'tall']);
    let atLevel = 0, all = 0;
    for (let seed = 1; seed < 40; seed++) for (const p of asked(s, seed, 5)) {
      if (p.mode === 'meet') continue;
      all++; if (p.level === 3) atLevel++;
      expect(p.level).toBeLessThanOrEqual(3);
      expect(['lines', 'c', 'tall']).toContain(letter(p.q.ch).family);
    }
    expect(atLevel / all).toBeGreaterThan(0.5);
  });
  it('brings a miss back as a fresh question of the same kind and Level, with no credit', () => {
    const s = open(freshLearning(), [...MODE_IDS], 2);
    const rng = seeded(4), session = mixedSession(() => s, async () => {}, rng);
    const p = session.makeProblem(rng);
    if (p.mode === 'meet') return;
    const again = session.replay(p, rng);
    expect(again.mode).toBe(p.mode);
    expect(again.level).toBe(p.level);
    expect(again.push).toBe(false);
    expect((again as { replay?: boolean }).replay).toBe(true);
  });
  it('writes letters one stroke at a time: a stroke is not an answer, the last one is, a miss is wrong', () => {
    const s = open(freshLearning(), ['trace'], 1, ['lines']);
    const rng = seeded(1), session = mixedSession(() => s, async () => {}, rng);
    const p = session.makeProblem(rng);
    expect(p.mode).toBe('trace');
    expect(session.check(p, 'more').kind).toBe('not-an-answer');
    expect(session.check(p, 'done').kind).toBe('correct');
    expect(session.check(p, 'miss:start:0:0').kind).toBe('incorrect');
  });
});
