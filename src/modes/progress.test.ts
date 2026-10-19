import { describe, expect, it } from 'vitest';
import type { Outcome } from '../learning/session';
import type { ModeProgress } from './state';
import { recordOutcome, stretchOf, struggling } from './progress';

const mode = (over: Partial<ModeProgress> = {}): ModeProgress => ({ level: 1, window: [], opened: true, starred: false, introPending: false, fresh: false, ...over });
const play = (m: ModeProgress, outcomes: Outcome[]) => {
  const events = [];
  for (const o of outcomes) { const r = recordOutcome(m, o); m = r.mode; if (r.event) events.push(r.event); }
  return { mode: m, events };
};
const times = (n: number, o: Outcome): Outcome[] => Array(n).fill(o);

describe('recordOutcome', () => {
  it('keeps only the last 10 problems', () => {
    const { mode: m } = play(mode(), [...times(7, 'missed'), ...times(5, 'clean'), ...times(2, 'helped')]);
    expect(m.window).toEqual([...times(3, 'missed'), ...times(5, 'clean'), ...times(2, 'helped')]);
  });

  it('raises the Level on 8 of the last 10 right on the first try', () => {
    const { mode: m, events } = play(mode(), [...times(5, 'clean'), 'missed', ...times(2, 'clean'), 'missed']);
    expect(events).toEqual([]);
    expect(play(m, ['clean']).events).toEqual(['levelUp']);
  });

  it('raises the Level sooner on 6 in a row right on the first try', () => {
    const { mode: m, events } = play(mode(), ['missed', 'helped', ...times(6, 'clean')]);
    expect(events).toEqual(['levelUp']);
    expect(m.level).toBe(2);
    expect(play(mode(), ['missed', ...times(5, 'clean')]).events).toEqual([]);
  });

  it('does not count problems solved with help toward Mastery', () => {
    const { mode: m, events } = play(mode(), [...times(4, 'clean'), 'helped', ...times(3, 'clean'), 'helped', 'helped']);
    expect(events).toEqual([]);
    expect(m.level).toBe(1);
  });

  it('clears the window and asks for the introduction card on a Level up', () => {
    const { mode: m } = play(mode(), times(6, 'clean'));
    expect(m.window).toEqual([]);
    expect(m.introPending).toBe(true);
  });

  it('never lowers the Level, however many misses', () => {
    const { mode: m } = play(mode({ level: 2 }), times(30, 'missed'));
    expect(m.level).toBe(2);
  });

  it('tops out at Level 5, where Mastery gives the star once', () => {
    const { mode: m, events } = play(mode({ level: 5 }), times(20, 'clean'));
    expect(m.level).toBe(5);
    expect(m.starred).toBe(true);
    expect(events).toEqual(['star']);
  });

  it('climbs from Level 1 to the star', () => {
    const { mode: m, events } = play(mode(), times(30, 'clean'));
    expect(events).toEqual(['levelUp', 'levelUp', 'levelUp', 'levelUp', 'star']);
    expect(m).toMatchObject({ level: 5, starred: true });
  });
});

describe('struggling', () => {
  it('steps in after 5 misses in the last 10', () => {
    expect(struggling(play(mode(), [...times(4, 'missed'), ...times(6, 'clean')]).mode)).toBe(false);
    expect(struggling(play(mode(), [...times(5, 'missed'), ...times(5, 'clean')]).mode)).toBe(true);
  });

  it('counts only misses, not problems where he asked for help', () => {
    expect(struggling(play(mode(), times(10, 'helped')).mode)).toBe(false);
  });

  it('lets old misses drop out of the window', () => {
    expect(struggling(play(mode(), [...times(5, 'missed'), ...times(6, 'clean')]).mode)).toBe(false);
  });
});

describe('stretchOf', () => {
  it('starts each Level small', () => {
    expect(stretchOf(mode({ level: 3 }))).toBe(0);
  });

  it('grows as first-try answers outnumber the misses', () => {
    expect(stretchOf(mode({ window: ['clean', 'clean'] }))).toBe(1);
    expect(stretchOf(mode({ window: times(5, 'clean') }))).toBe(2);
    expect(stretchOf(mode({ window: [...times(5, 'clean'), 'missed'] }))).toBe(1);
  });

  it('shrinks back when he is missing a lot', () => {
    expect(stretchOf(mode({ window: [...times(4, 'clean'), ...times(4, 'missed')] }))).toBe(0);
  });

  it("doesn't count help either way", () => {
    expect(stretchOf(mode({ window: times(10, 'helped') }))).toBe(0);
  });
});
