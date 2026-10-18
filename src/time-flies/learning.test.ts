import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { seeded } from '../game/rng';
import { choiceSession, freshLearning, readLearning, recordSolved, setSession } from './learning';

const clean: SolvedProblem = { index: 1, outcome: 'clean', misses: 0, helped: false, replay: false };

describe('clock Game Modes', () => {
  it('opens only Find the Clock at first', () => {
    const s = freshLearning();
    expect([s.modes.find.opened, s.modes.read.opened, s.modes.set.opened]).toEqual([true, false, false]);
  });
  it('raises a Level after 16 clean answers, and opens the next mode at Level 2', () => {
    let s = freshLearning();
    const changes = [];
    for (let i = 0; i < 15; i++) s = recordSolved(s, 'find', clean).state;
    expect(s.modes.find.level).toBe(1); // 8 of 10 is not enough here
    const r = recordSolved(s, 'find', clean); s = r.state; changes.push(...r.changes);
    expect(s.modes.find.level).toBe(2);
    expect(s.modes.read.opened).toBe(true);
    expect(s.modes.read.fresh).toBe(true);
    expect(changes).toEqual([{ kind: 'levelUp', mode: 'find', level: 2 }, { kind: 'open', mode: 'read' }]);
    for (let i = 0; i < 16; i++) s = recordSolved(s, 'find', clean).state;
    expect(s.modes.find.level).toBe(3);
    expect(s.modes.set.opened).toBe(false); // Set the Clock waits on Read the Clock
  });
  it('needs 16 of the last 20, so a few misses only slow him down', () => {
    let s = freshLearning();
    const missed: SolvedProblem = { ...clean, outcome: 'missed' };
    for (let i = 0; i < 4; i++) s = recordSolved(s, 'find', missed).state;
    for (let i = 0; i < 15; i++) s = recordSolved(s, 'find', clean).state;
    expect(s.modes.find.level).toBe(1);
    s = recordSolved(s, 'find', clean).state;
    expect(s.modes.find.level).toBe(2);
  });
  it('reads a damaged save as a fresh one, keeping what is valid', () => {
    expect(readLearning(null)).toEqual(freshLearning());
    const s = readLearning({ modes: { read: { level: 3, opened: true, window: ['clean', 'nonsense'] } }, lastMode: 'read' });
    expect(s.modes.read).toMatchObject({ level: 3, opened: true, window: ['clean'] });
    expect(s.lastMode).toBe('read');
  });
  it('checks answers: the right time is correct, another is a miss, nothing is not an answer', () => {
    const session = choiceSession(2, () => freshLearning().modes.read, async () => {});
    const p = session.makeProblem(seeded(3));
    const right = p.choices.find(c => c.hour === p.target.hour && c.minute === p.target.minute)!;
    const wrong = p.choices.find(c => c !== right)!;
    expect(session.check(p, `${right.hour}:${String(right.minute).padStart(2, '0')}`).kind).toBe('correct');
    expect(session.check(p, `${wrong.hour}:${String(wrong.minute).padStart(2, '0')}`).kind).toBe('incorrect');
    expect(session.check(p, '').kind).toBe('not-an-answer');
    const set = setSession(1, () => freshLearning().modes.set, async () => {});
    const q = set.makeProblem(seeded(5));
    expect(set.check(q, q.target).kind).toBe('correct');
    expect(set.check(q, q.start).kind).toBe('incorrect');
  });
});
