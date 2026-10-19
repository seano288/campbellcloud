import { describe, expect, it, vi } from 'vitest';
import type { Outcome } from '../learning/session';
import { seeded } from '../game/rng';
import { countSession, nextShape } from './session';
import { freshMode, type ModeProgress } from './state';

const at = (level: ModeProgress['level'], window: Outcome[] = []): ModeProgress => ({ ...freshMode('count'), opened: true, level, window });

describe('choosing the next problem', () => {
  it('opens a Round above Level 1 with a warm-up from the Level below, which does not count', () => {
    expect(nextShape(3, at(3), true, false)).toEqual({ level: 2, stretch: 1, push: false });
    expect(nextShape(1, at(1), true, false)).toEqual({ level: 1, stretch: 0, push: true });
  });

  it('follows a miss with an easier one', () => {
    expect(nextShape(4, at(4, Array(8).fill('clean')), false, true)).toEqual({ level: 3, stretch: 1, push: false });
    expect(nextShape(1, at(1, Array(8).fill('clean')), false, true)).toEqual({ level: 1, stretch: 0, push: true });
  });

  it('otherwise asks at his Level, sized by how he has been doing', () => {
    expect(nextShape(2, at(2), false, false)).toEqual({ level: 2, stretch: 0, push: true });
    expect(nextShape(2, at(2, ['clean', 'clean', 'clean']), false, false)).toEqual({ level: 2, stretch: 1, push: true });
    expect(nextShape(2, at(2, Array(5).fill('clean')), false, false)).toEqual({ level: 2, stretch: 2, push: true });
  });

  it('after a Level up mid-Round, asks the rest at the old Level\'s hardest without counting it', () => {
    expect(nextShape(2, at(3), false, false)).toEqual({ level: 2, stretch: 2, push: false });
  });
});

describe('an adaptive session', () => {
  it('warms up, pushes, and eases off after a miss', () => {
    const mode = at(3, ['clean', 'clean', 'clean', 'clean', 'clean']);
    const session = countSession(3, () => mode, vi.fn(async () => {}));
    const rng = seeded(9);
    const first = session.makeProblem(rng);
    expect(first.push).toBe(false);
    expect(first.pile.every(k => k !== 'b1' && k !== 'b5')).toBe(true); // Level 2 money
    session.note('clean');
    expect(session.makeProblem(rng).push).toBe(true);
    session.note('missed');
    expect(session.makeProblem(rng).push).toBe(false);
    session.note('clean');
    const back = session.makeProblem(rng);
    expect(back.push).toBe(true);
    expect(session.replay(back, rng).push).toBe(true);
  });
});
