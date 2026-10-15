import { describe, expect, it } from 'vitest';
import type { Outcome } from '../learning/session';
import { freshLearning, type ModeProgress } from '../modes/state';
import { completeTrophies, reached } from '../app/trophies';
import { countAnswer, freshTrophies } from './rules';
import { dayOf, earnedCount, stepId, TROPHIES, type StepId, type TrophyStep } from './trophies';

const clean5: Outcome[] = ['clean', 'clean', 'clean', 'clean', 'clean'];
const freshProgress = () => ({ ...freshLearning(), ...freshTrophies<StepId>() });
type Progress = ReturnType<typeof freshProgress>;
const withMode = (s: Progress, mode: 'learn' | 'count' | 'pay', patch: Partial<ModeProgress>): Progress =>
  ({ ...s, modes: { ...s.modes, [mode]: { ...s.modes[mode], ...patch } } });
const answers = (s: Progress, outcomes: Outcome[]) => outcomes.reduce((state, outcome) => ({ ...state, ...countAnswer(state, outcome) }), s);
const ids = (steps: TrophyStep[]) => steps.map(stepId);
const complete = (state: Progress, round: Outcome[], day: string) => {
  const done = completeTrophies(state, state, round, day);
  return { state: { ...state, ...done.state }, earned: done.earned };
};

describe('the trophy checks', () => {
  it('Learning: Level 2, Level 3 and the star in each Game Mode', () => {
    const s = withMode(freshProgress(), 'count', { level: 3, starred: true });
    expect(reached({ kind: 'level', mode: 'count', level: 2 }, s, null)).toBe(true);
    expect(reached({ kind: 'level', mode: 'count', level: 3 }, s, null)).toBe(true);
    expect(reached({ kind: 'star', mode: 'count' }, s, null)).toBe(true);
    expect(reached({ kind: 'level', mode: 'learn', level: 2 }, s, null)).toBe(false);
    expect(reached({ kind: 'star', mode: 'pay' }, s, null)).toBe(false);
  });

  it('Skill: the best streak of first-try answers', () => {
    const s = { ...freshProgress(), bestStreak: 10 };
    expect(reached({ kind: 'streak', n: 5 }, s, null)).toBe(true);
    expect(reached({ kind: 'streak', n: 10 }, s, null)).toBe(true);
    expect(reached({ kind: 'streak', n: 20 }, s, null)).toBe(false);
  });

  it('Skill: a perfect Round is every answer right on the first try without help', () => {
    expect(reached({ kind: 'perfect' }, freshProgress(), clean5)).toBe(true);
    expect(reached({ kind: 'perfect' }, freshProgress(), ['clean', 'clean', 'helped', 'clean', 'clean'])).toBe(false);
    expect(reached({ kind: 'perfect' }, freshProgress(), ['clean', 'missed', 'clean', 'clean', 'clean', 'clean'])).toBe(false);
    expect(reached({ kind: 'perfect' }, freshProgress(), null)).toBe(false);
  });

  it('Sticking with it: Rounds finished and days played', () => {
    const s = { ...freshProgress(), roundsFinished: 25, daysPlayed: 5 };
    expect(reached({ kind: 'rounds', n: 25 }, s, null)).toBe(true);
    expect(reached({ kind: 'rounds', n: 50 }, s, null)).toBe(false);
    expect(reached({ kind: 'days', n: 5 }, s, null)).toBe(true);
    expect(reached({ kind: 'days', n: 5 }, { ...s, daysPlayed: 4 }, null)).toBe(false);
  });

  it('gives every step its own id', () => {
    const all = TROPHIES.flatMap(t => t.steps.map(stepId));
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain('learn:2');
    expect(all).toContain('pay:star');
    expect(all).toContain('streak:20');
    expect(all).toContain('rounds:250');
  });

  it('counting trophies upgrade in place: one spot on the shelf, a step per metal', () => {
    const streak = TROPHIES.find(t => t.id === 'streak')!;
    expect(ids([...streak.steps])).toEqual(['streak:5', 'streak:10', 'streak:20']);
    const rounds = TROPHIES.find(t => t.id === 'rounds')!;
    expect(ids([...rounds.steps])).toEqual(['rounds:10', 'rounds:25', 'rounds:50', 'rounds:100', 'rounds:250']);
    expect(earnedCount(streak, { 'streak:5': '2026-09-01', 'streak:10': '2026-09-02' })).toBe(2);
  });
});

describe('streak counting', () => {
  it('counts first-try answers in a row and keeps the best', () => {
    const s = answers(freshProgress(), ['clean', 'clean', 'clean', 'missed', 'clean']);
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(3);
  });

  it('an answer with help breaks the streak', () => {
    const s = answers(freshProgress(), ['clean', 'clean', 'helped']);
    expect(s.currentStreak).toBe(0);
    expect(s.bestStreak).toBe(2);
  });

  it('carries across Rounds', () => {
    let s = answers(freshProgress(), clean5);
    s = complete(s, clean5, '2026-09-01').state;
    s = answers(s, clean5);
    expect(s.currentStreak).toBe(10);
    expect(s.bestStreak).toBe(10);
  });
});

describe('finishing a Round', () => {
  it('counts the Round and the day, once per day', () => {
    let s = complete(freshProgress(), [], '2026-09-01').state;
    s = complete(s, [], '2026-09-01').state;
    expect(s.roundsFinished).toBe(2);
    expect(s.daysPlayed).toBe(1);
    s = complete(s, [], '2026-09-02').state;
    expect(s.daysPlayed).toBe(2);
    expect(s.lastDay).toBe('2026-09-02');
  });

  it('earns each new trophy once, with the day it was earned', () => {
    const s = answers(withMode(freshProgress(), 'learn', { level: 2 }), clean5);
    const first = complete(s, clean5, '2026-09-01');
    expect(ids(first.earned)).toEqual(['learn:2', 'streak:5', 'perfect']);
    expect(first.state.earned).toEqual({ 'learn:2': '2026-09-01', 'streak:5': '2026-09-01', perfect: '2026-09-01' });
    const again = complete(answers(first.state, clean5), clean5, '2026-09-02');
    expect(ids(again.earned)).toEqual(['streak:10']);
    expect(again.state.earned.perfect).toBe('2026-09-01');
  });

  it('earns the 10 Rounds trophy on the 10th Round', () => {
    const s = { ...freshProgress(), roundsFinished: 9 };
    expect(ids(complete(s, [], '2026-09-01').earned)).toEqual(['rounds:10']);
  });

  it('never takes a trophy away', () => {
    const s = { ...freshProgress(), earned: { 'streak:5': '2026-09-01' }, bestStreak: 0 };
    expect(complete(s, [], '2026-09-02').state.earned).toEqual({ 'streak:5': '2026-09-01' });
  });
});

it('dayOf is the local calendar day', () => {
  expect(dayOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});
