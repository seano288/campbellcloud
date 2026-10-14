import { expect, it } from 'vitest';
import { freshSave } from '../save/migrate';
import { applySolved } from './practice';
import { countAnswer, finishRound } from './trophies';
import { stepId } from '../trophies/trophies';
import { nonMoneySession, progressNonMoney } from '../learning/nonMoney.fixture';
import { countAnswer as countTrophyAnswer, finishRound as finishTrophyRound, readTrophies } from '../trophies/rules';

it('coordinates a solved fact into learning and streak effects while preserving unrelated saved fields', () => {
  const initial = freshSave();
  initial.bolts = 17;
  initial.goal = 'tires:1';
  initial.modes.count = { ...initial.modes.count, opened: true, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean', 'clean'] };
  initial.currentStreak = 4;
  initial.bestStreak = 4;
  const result = applySolved(initial, 'count', { index: 3, outcome: 'clean', misses: 0, helped: false, replay: true });
  expect(result.changes).toEqual([{ kind: 'levelUp', mode: 'count', level: 2 }, { kind: 'open', mode: 'pay' }]);
  expect(result.save.modes.count).toMatchObject({ level: 2, window: [], introPending: true });
  expect(result.save.modes.pay).toMatchObject({ opened: true, fresh: true });
  expect(result.save).toMatchObject({ bolts: 17, goal: 'tires:1', currentStreak: 5, bestStreak: 5, trophies: {}, roundsFinished: 0 });
  expect(initial.modes.count.level).toBe(1);
  expect(initial.currentStreak).toBe(4);
});

it.each(['missed', 'helped'] as const)('breaks the streak on an unsolved %s without adding learning progress or completion effects', outcome => {
  const initial = { ...freshSave(), currentStreak: 7, bestStreak: 12 };
  const interrupted = countAnswer(initial, outcome);
  expect(interrupted).toEqual({ ...initial, currentStreak: 0 });
  const solved = applySolved(interrupted, 'learn', { index: 1, outcome, misses: outcome === 'missed' ? 1 : 0, helped: true, replay: false });
  expect(solved.save.modes.learn.window).toEqual([outcome]);
  expect(solved.changes).toEqual([]);
  expect(solved.save).toMatchObject({ currentStreak: 0, bestStreak: 12, roundsFinished: 0, daysPlayed: 0, trophies: {}, bolts: 0 });
});

it('applies app learning milestones alongside shared Trophy rules without redating earned steps', () => {
  const initial = freshSave();
  initial.modes.learn = { ...initial.modes.learn, level: 3, starred: true };
  initial.roundsFinished = 24;
  initial.daysPlayed = 4;
  initial.lastDay = '2026-10-13';
  initial.trophies = { 'learn:2': '2026-09-01', 'streak:5': '2026-09-02', 'rounds:10': '2026-09-03' };
  initial.currentStreak = 19;
  initial.bestStreak = 19;
  const answered = countAnswer(initial, 'clean');
  const done = finishRound(answered, ['clean', 'clean', 'clean', 'clean', 'clean'], '2026-10-14');
  expect(done.earned.map(stepId)).toEqual(['learn:3', 'learn:star', 'streak:10', 'streak:20', 'perfect', 'rounds:25', 'days:5']);
  expect(done.save).toMatchObject({ roundsFinished: 25, daysPlayed: 5, lastDay: '2026-10-14', currentStreak: 20, bestStreak: 20, bolts: 0 });
  expect(done.save.trophies).toEqual({ 'learn:2': '2026-09-01', 'learn:3': '2026-10-14', 'learn:star': '2026-10-14', 'streak:5': '2026-09-02', 'streak:10': '2026-10-14', 'streak:20': '2026-10-14', perfect: '2026-10-14', 'rounds:10': '2026-09-03', 'rounds:25': '2026-10-14', 'days:5': '2026-10-14' });
  const sameDay = finishRound(done.save, ['helped'], '2026-10-14');
  expect(sameDay.save.daysPlayed).toBe(5);
  expect(sameDay.earned).toEqual([]);
  expect(initial.roundsFinished).toBe(24);
  expect(initial.trophies).not.toHaveProperty('perfect');
});

it('coordinates a non-money checker and progression with app-supplied milestones and independent Trophy validation', async () => {
  const session = nonMoneySession();
  const problem = session.makeProblem(() => 0);
  expect(session.check(problem, '3:00')).toEqual({ kind: 'correct' });
  expect(session.check(problem, '').kind).toBe('not-an-answer');
  const wrong = session.check(problem, '4:00');
  expect(wrong.kind).toBe('incorrect');
  if (wrong.kind !== 'incorrect') throw new Error('Expected incorrect verdict');
  await wrong.explain(true, new AbortController().signal);
  expect(session.replay(problem, () => 0)).toEqual(problem);
  expect(session.needsEarlyHelp()).toBe(false);
  const fact = { index: 1, outcome: 'clean', misses: 0, helped: false, replay: false } as const;
  const progress = progressNonMoney({ solved: 0 }, undefined, fact);
  expect(progress).toEqual({ state: { solved: 1 }, changes: ['first-clock'] });
  const trophies = readTrophies({ earned: { 'old-step': 'not-normalised', unknown: '2026-10-01' }, currentStreak: -1, bestStreak: 4, roundsFinished: 9, daysPlayed: 4, lastDay: '2026-10-13' }, ['old-step', 'first-clock', 'run', 'perfect', 'rounds', 'days'] as const);
  const done = finishTrophyRound(countTrophyAnswer(trophies, 'clean'), ['clean'], '2026-10-14', [
    { id: 'first-clock', kind: 'milestone', reached: progress.changes.includes('first-clock') },
    { id: 'run', kind: 'streak', n: 1 }, { id: 'perfect', kind: 'perfect' },
    { id: 'rounds', kind: 'rounds', n: 10 }, { id: 'days', kind: 'days', n: 5 },
  ]);
  expect(done.earned).toEqual(['first-clock', 'run', 'perfect', 'rounds', 'days']);
  expect(done.state.earned).toEqual({ 'old-step': 'not-normalised', 'first-clock': '2026-10-14', run: '2026-10-14', perfect: '2026-10-14', rounds: '2026-10-14', days: '2026-10-14' });
  expect(done.state).toMatchObject({ currentStreak: 1, bestStreak: 4, roundsFinished: 10, daysPlayed: 5 });
});
