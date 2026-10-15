import { describe, expect, it, vi } from 'vitest';
import { freshSave, type Save } from '../save/migrate';
import { createStore } from '../save/store';
import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { moneySave, MONEY_SAVE_KEY, type MoneyState } from './save';
import { createPractice } from './practice';
import { countAnswer, finishRound } from './trophies';
import { stepId } from '../trophies/trophies';
import { nonMoneySession, progressNonMoney } from '../learning/nonMoney.fixture';
import { countAnswer as countTrophyAnswer, finishRound as finishTrophyRound, readTrophies } from '../trophies/rules';

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

async function practiceApp(initial = freshSave(), options: Parameters<typeof createPractice>[1] = {}) {
  let stored = JSON.stringify(initial);
  const write = vi.fn((_key: string, text: string) => { stored = text; });
  const backing = { read: () => stored, write };
  const store = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing });
  await store.load();
  return { store, backing, write, snapshot: (): Save => JSON.parse(stored), practice: createPractice(store, { today: () => '2026-10-14', ...options }) };
}

const clean = (index: number) => ({ index, outcome: 'clean', misses: 0, helped: false, replay: false } as const);

async function solvedPractice(app: Awaited<ReturnType<typeof practiceApp>>, outcomes: readonly Outcome[] = ['clean', 'clean', 'clean', 'clean', 'clean']) {
  const started = app.practice.start('learn');
  if (started.kind !== 'accepted') throw new Error('Expected practice start');
  await started.saved;
  const results: SolvedProblem[] = outcomes.map((outcome, i) => ({ index: i + 1, outcome, misses: outcome === 'missed' ? 1 : 0, helped: outcome === 'helped', replay: i === 2 }));
  for (const fact of results) {
    const answer = app.practice.solve(started.roundId, fact);
    if (answer.kind !== 'accepted') throw new Error('Expected solved commit');
    await answer.saved;
  }
  return { roundId: started.roundId, status: 'completed', results } as const;
}

describe('practice commits', () => {
  it('accepts abandonment when the final answer publication is ahead of the scheduler result snapshot', async () => {
    const app = await practiceApp();
    const started = app.practice.start('learn');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    const results = [1, 2, 3, 4, 5].map(clean);
    for (const fact of results.slice(0, 4)) {
      const solved = app.practice.solve(started.roundId, fact);
      if (solved.kind !== 'accepted') throw new Error('Expected solved commit');
      await solved.saved;
    }
    let abandonment: ReturnType<typeof app.practice.terminal> | undefined;
    const unsubscribe = app.store.state.subscribe(state => {
      if (state.learning.modes.learn.window.length === 5) abandonment = app.practice.terminal({ roundId: started.roundId, status: 'abandoned', results: results.slice(0, 4) });
    });
    const solved = app.practice.solve(started.roundId, clean(5));
    if (solved.kind !== 'accepted') throw new Error('Expected final solved commit');
    expect(abandonment).toEqual({ kind: 'abandoned' });
    expect(await solved.saved).toBe(true);
    app.write.mockClear();
    expect(app.practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('rejected');
    expect(app.snapshot()).toMatchObject({ bolts: 0, currentStreak: 5, roundsFinished: 0, daysPlayed: 0, trophies: {} });
    expect(app.snapshot().modes.learn.window).toEqual(['clean', 'clean', 'clean', 'clean', 'clean']);
    expect(app.write).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('allows a newly completed Round to earn once on the same day without redating Trophies', async () => {
    const app = await practiceApp();
    const first = await solvedPractice(app);
    const completed = app.practice.terminal(first);
    if (completed.kind !== 'accepted') throw new Error('Expected first completion');
    await completed.saved;
    const earned = app.snapshot().trophies;
    const second = await solvedPractice(app);
    const before = app.store.state.value;
    expect(app.practice.terminal(first).kind).toBe('rejected');
    expect(app.store.state.value).toBe(before);
    const done = app.practice.terminal(second);
    if (done.kind !== 'accepted') throw new Error('Expected second completion');
    expect(done.trophies.map(stepId)).toEqual(['learn:2', 'streak:10']);
    expect(await done.saved).toBe(true);
    expect(app.snapshot()).toMatchObject({ bolts: 12, roundsFinished: 2, daysPlayed: 1, trophies: { ...earned, 'learn:2': '2026-10-14', 'streak:10': '2026-10-14' } });
    expect(app.practice.terminal(second).kind).toBe('rejected');
  });

  it('retains completion and its consumed guard after a failed write, then saves the full aggregate on a later action', async () => {
    const app = await practiceApp();
    const fact = await solvedPractice(app);
    const lastSaved = app.snapshot();
    app.write.mockClear();
    app.write.mockImplementationOnce(() => { throw new Error('Storage full'); });
    const done = app.practice.terminal(fact);
    if (done.kind !== 'accepted') throw new Error('Expected committed completion');
    const expected: Save = {
      ...lastSaved, bolts: 6, roundsFinished: 1, daysPlayed: 1, lastDay: '2026-10-14',
      trophies: { 'streak:5': '2026-10-14', perfect: '2026-10-14' },
    };
    expect(await done.saved).toBe(false);
    expect(moneySave.encode(app.store.state.value)).toEqual(expected);
    expect(app.snapshot()).toEqual(lastSaved);
    expect(app.practice.terminal(fact).kind).toBe('rejected');
    expect(app.write).toHaveBeenCalledTimes(1);
    const restart = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: app.backing });
    await restart.load();
    expect(moneySave.encode(restart.state.value)).toEqual(lastSaved);
    expect(createPractice(restart).terminal(fact).kind).toBe('rejected');
    expect(app.write).toHaveBeenCalledTimes(1);
    const recovery = app.practice.start('learn');
    if (recovery.kind !== 'accepted') throw new Error('Expected later action');
    expect(await recovery.saved).toBe(true);
    expect(app.snapshot()).toEqual(expected);
    expect(app.practice.terminal(fact).kind).toBe('rejected');
    const recovered = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: app.backing });
    await recovered.load();
    expect(moneySave.encode(recovered.state.value)).toEqual(expected);
    expect(app.write).toHaveBeenCalledTimes(2);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 'overflow', 'policy-throws', 'completion-throws'])('publishes no completion effects and keeps the guard available after %s', async failure => {
    let rejecting = true;
    const app = await practiceApp({ ...freshSave(), bolts: failure === 'overflow' ? Number.MAX_SAFE_INTEGER - 5 : 0 }, {
      earnings: () => {
        if (!rejecting) return 1;
        if (failure === 'policy-throws') throw new Error('Earnings failed');
        return typeof failure === 'number' ? failure : 6;
      },
      today: () => {
        if (rejecting && failure === 'completion-throws') throw new Error('Completion calculation failed');
        return '2026-10-14';
      },
    });
    const fact = await solvedPractice(app);
    const before = app.store.state.value;
    const snapshot = app.snapshot();
    app.write.mockClear();
    const publications = vi.fn();
    const unsubscribe = app.store.state.subscribe(publications);
    publications.mockClear();
    expect(app.practice.terminal(fact)).toEqual({ kind: 'rejected', reason: typeof failure === 'string' && failure.endsWith('throws') ? 'calculation-failed' : 'rejected' });
    expect(app.store.state.value).toBe(before);
    expect(app.snapshot()).toEqual(snapshot);
    expect(publications).not.toHaveBeenCalled();
    expect(app.write).not.toHaveBeenCalled();
    expect(snapshot).toMatchObject({ currentStreak: 5, roundsFinished: 0, daysPlayed: 0, trophies: {} });
    expect(snapshot.modes.learn.window).toEqual(['clean', 'clean', 'clean', 'clean', 'clean']);
    rejecting = false;
    const retried = app.practice.terminal(fact);
    if (retried.kind !== 'accepted') throw new Error('Expected completion retry');
    expect(retried.earned).toBe(1);
    expect(await retried.saved).toBe(true);
    expect(app.snapshot()).toMatchObject({ bolts: snapshot.bolts + 1, roundsFinished: 1, daysPlayed: 1 });
    expect(app.write).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it.each([
    { outcomes: ['clean', 'clean', 'helped', 'missed', 'helped'], earned: 3 },
    { outcomes: ['helped', 'missed', 'helped', 'missed', 'helped'], earned: 1 },
  ] satisfies { outcomes: Outcome[]; earned: number }[])('keeps the production earnings policy for $earned Bolts', async ({ outcomes, earned }) => {
    const app = await practiceApp();
    const fact = await solvedPractice(app, outcomes);
    const done = app.practice.terminal(fact);
    if (done.kind !== 'accepted') throw new Error('Expected completion');
    expect(done.earned).toBe(earned);
    expect(done.state.currency.balance).toBe(earned);
    expect(done.state.trophies.earned).not.toHaveProperty('perfect');
    expect(await done.saved).toBe(true);
    expect(app.snapshot()).toMatchObject({ bolts: earned, roundsFinished: 1, daysPlayed: 1 });
  });

  it('rejects incomplete or mismatched terminal facts without consuming the active Round', async () => {
    const app = await practiceApp();
    const started = app.practice.start('learn');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    const results = [1, 2, 3, 4, 5].map(clean);
    expect(app.practice.solve(started.roundId, clean(2)).kind).toBe('rejected');
    expect(app.practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('rejected');
    for (const fact of results) {
      const answer = app.practice.solve(started.roundId, fact);
      if (answer.kind !== 'accepted') throw new Error('Expected solved commit');
      await answer.saved;
    }
    const before = app.store.state.value;
    app.write.mockClear();
    for (const invalid of [results.slice(0, 4), [...results.slice(0, 4), clean(4)], [{ ...clean(1), outcome: 'helped' as const }, ...results.slice(1)]]) {
      expect(app.practice.terminal({ roundId: started.roundId, status: 'completed', results: invalid }).kind).toBe('rejected');
    }
    expect(app.store.state.value).toBe(before);
    expect(app.write).not.toHaveBeenCalled();
    const done = app.practice.terminal({ roundId: started.roundId, status: 'completed', results });
    if (done.kind !== 'accepted') throw new Error('Expected valid completion');
    expect(await done.saved).toBe(true);
    expect(app.snapshot()).toMatchObject({ bolts: 6, roundsFinished: 1 });
  });

  it.each([0, 2, 5])('abandons after %i solved answers without completion effects and rejects late or inactive facts', async count => {
    const app = await practiceApp();
    const started = app.practice.start('learn');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    await started.saved;
    const results = Array.from({ length: count }, (_, i) => clean(i + 1));
    for (const fact of results) {
      const answer = app.practice.solve(started.roundId, fact);
      if (answer.kind !== 'accepted') throw new Error('Expected solved commit');
      await answer.saved;
    }
    if (count < 5) {
      const missed = app.practice.interrupt(started.roundId, count + 1, 'missed');
      if (missed.kind !== 'accepted') throw new Error('Expected miss commit');
      await missed.saved;
    }
    const before = app.store.state.value;
    const snapshot = app.snapshot();
    app.write.mockClear();
    const terminal: RoundResult = { roundId: started.roundId, status: 'abandoned', results };
    expect(app.practice.terminal(terminal)).toEqual({ kind: 'abandoned' });
    expect(app.practice.terminal(terminal).kind).toBe('rejected');
    expect(app.practice.terminal({ ...terminal, status: 'completed' }).kind).toBe('rejected');
    expect(app.practice.terminal({ ...terminal, roundId: 'unknown' }).kind).toBe('rejected');
    expect(app.practice.solve(started.roundId, clean(count + 1)).kind).toBe('rejected');
    expect(app.practice.interrupt(started.roundId, count + 1, 'helped').kind).toBe('rejected');
    expect(app.store.state.value).toBe(before);
    expect(app.snapshot()).toEqual(snapshot);
    expect(app.write).not.toHaveBeenCalled();
    expect(snapshot).toMatchObject({ bolts: 0, roundsFinished: 0, daysPlayed: 0, trophies: {} });
    expect(snapshot.modes.learn.window).toHaveLength(count);
    const next = app.practice.start('learn');
    if (next.kind !== 'accepted') throw new Error('Expected next Round');
    expect(app.practice.terminal({ ...terminal, status: 'completed' }).kind).toBe('rejected');
    for (const fact of [1, 2, 3, 4, 5].map(clean)) app.practice.solve(next.roundId, fact);
    const done = app.practice.terminal({ roundId: next.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(clean) });
    if (done.kind !== 'accepted') throw new Error('Expected next Round completion');
    expect(await done.saved).toBe(true);
    expect(app.snapshot()).toMatchObject({ bolts: 6, roundsFinished: 1, daysPlayed: 1 });
  });

  it('commits six Bolts, production Trophy effects and the terminal guard together before returning presentation facts', async () => {
    const initial = freshSave();
    initial.modes.learn = { ...initial.modes.learn, level: 3, starred: true };
    initial.currentStreak = 19;
    initial.bestStreak = 19;
    initial.roundsFinished = 24;
    initial.daysPlayed = 4;
    initial.lastDay = '2026-10-13';
    initial.trophies = { 'learn:2': '2026-09-01', 'streak:5': '2026-09-02', 'rounds:10': '2026-09-03' };
    const app = await practiceApp(initial);
    const started = app.practice.start('learn');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    const results = [1, 2, 3, 4, 5].map(clean);
    for (const fact of results) {
      const answer = app.practice.solve(started.roundId, fact);
      if (answer.kind !== 'accepted') throw new Error('Expected solved commit');
      await answer.saved;
    }
    const before = app.snapshot();
    expect(before).toMatchObject({ bolts: 0, currentStreak: 24, roundsFinished: 24, daysPlayed: 4, trophies: initial.trophies });
    app.write.mockClear();
    const fact: RoundResult = { roundId: started.roundId, status: 'completed', results };
    const publications: MoneyState[] = [];
    const duplicate = vi.fn();
    const unsubscribe = app.store.state.subscribe(state => {
      if (state.currency.balance !== 6) return;
      publications.push(state);
      duplicate(app.practice.terminal(fact));
    });
    const done = app.practice.terminal(fact);
    if (done.kind !== 'accepted') throw new Error('Expected completion commit');
    expect(done.earned).toBe(6);
    expect(done.canBuild).toBe(true);
    expect(done.trophies.map(stepId)).toEqual(['learn:3', 'learn:star', 'streak:10', 'streak:20', 'perfect', 'rounds:25', 'days:5']);
    const expected: Save = {
      ...before, bolts: 6, roundsFinished: 25, daysPlayed: 5, lastDay: '2026-10-14',
      trophies: { ...initial.trophies, 'learn:3': '2026-10-14', 'learn:star': '2026-10-14', 'streak:10': '2026-10-14', 'streak:20': '2026-10-14', perfect: '2026-10-14', 'rounds:25': '2026-10-14', 'days:5': '2026-10-14' },
    };
    expect(moneySave.encode(done.state)).toEqual(expected);
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    expect(duplicate).toHaveBeenCalledExactlyOnceWith({ kind: 'rejected', reason: 'rejected' });
    expect(await done.saved).toBe(true);
    expect(app.snapshot()).toEqual(expected);
    expect(app.practice.terminal(fact).kind).toBe('rejected');
    expect(app.practice.terminal({ ...fact, status: 'abandoned' }).kind).toBe('rejected');
    expect(app.practice.solve(started.roundId, clean(6)).kind).toBe('rejected');
    expect(app.practice.interrupt(started.roundId, 6, 'helped').kind).toBe('rejected');
    expect(app.write).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('scopes saved introduction acknowledgement and answer facts to the active practice', async () => {
    const initial = freshSave();
    initial.modes.count = { ...initial.modes.count, opened: true, fresh: true, level: 2, introPending: true };
    const app = await practiceApp(initial);
    const first = app.practice.start('count');
    if (first.kind !== 'accepted') throw new Error('Expected practice start');
    await first.saved;
    expect(first).toMatchObject({ mode: 'count', level: 2, intro: true });
    expect(app.practice.solve(first.roundId, clean(1)).kind).toBe('rejected');
    expect(app.practice.interrupt(first.roundId, 1, 'helped').kind).toBe('rejected');
    const second = app.practice.start('count');
    if (second.kind !== 'accepted') throw new Error('Expected replacement practice');
    await second.saved;
    expect(second.roundId).not.toBe(first.roundId);
    app.write.mockClear();
    expect(app.practice.acknowledge(first.roundId).kind).toBe('rejected');
    expect(app.practice.solve(first.roundId, clean(1)).kind).toBe('rejected');
    expect(app.practice.interrupt(first.roundId, 1, 'missed').kind).toBe('rejected');
    expect(app.store.state.value.learning.modes.count.introPending).toBe(true);
    const acknowledged = app.practice.acknowledge(second.roundId);
    if (acknowledged.kind !== 'accepted') throw new Error('Expected introduction acknowledgement');
    expect(await acknowledged.saved).toBe(true);
    expect(app.snapshot().modes.count).toMatchObject({ introPending: false, fresh: false, window: [] });
    expect(app.practice.acknowledge(second.roundId).kind).toBe('rejected');
    expect(app.write).toHaveBeenCalledTimes(1);
    expect(app.practice.solve(second.roundId, clean(1)).kind).toBe('accepted');
  });

  it.each(['missed', 'helped'] as const)('commits an accepted unsolved %s immediately without adding Mastery or completion effects', async outcome => {
    const initial = { ...freshSave(), currentStreak: 7, bestStreak: 12 };
    const app = await practiceApp(initial);
    const started = app.practice.start('learn');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    await started.saved;
    app.write.mockClear();
    const interrupted = app.practice.interrupt(started.roundId, 1, outcome);
    if (interrupted.kind !== 'accepted') throw new Error('Expected interrupt commit');
    expect(moneySave.encode(app.store.state.value)).toEqual({ ...initial, currentStreak: 0 });
    expect(await interrupted.saved).toBe(true);
    expect(app.snapshot()).toEqual({ ...initial, currentStreak: 0 });
    expect(app.write).toHaveBeenCalledTimes(1);
    const solved = app.practice.solve(started.roundId, { index: 1, outcome, misses: outcome === 'missed' ? 1 : 0, helped: true, replay: false });
    if (solved.kind !== 'accepted') throw new Error('Expected solved commit');
    expect(solved.state.learning.modes.learn.window).toEqual([outcome]);
    expect(solved.state.trophies).toMatchObject({ currentStreak: 0, bestStreak: 12, roundsFinished: 0, daysPlayed: 0, earned: {} });
    await solved.saved;
    const before = app.store.state.value;
    expect(app.practice.interrupt(started.roundId, 1, outcome).kind).toBe('rejected');
    expect(app.practice.interrupt('unknown', 2, outcome).kind).toBe('rejected');
    expect(app.store.state.value).toBe(before);
    expect(app.write).toHaveBeenCalledTimes(2);
  });

  it('publishes and saves solved progression and streak effects together once using the captured practice and latest state', async () => {
    const initial = freshSave();
    initial.bolts = 17;
    initial.goal = 'tires:1';
    initial.currentStreak = 4;
    initial.bestStreak = 4;
    initial.modes.count = { ...initial.modes.count, opened: true, fresh: true, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean'] };
    const app = await practiceApp(initial);
    const started = app.practice.start('count');
    if (started.kind !== 'accepted') throw new Error('Expected practice start');
    expect(started).toMatchObject({ mode: 'count', level: 1, intro: false });
    await started.saved;
    expect(app.snapshot()).toMatchObject({ lastMode: 'count', modes: { count: { fresh: false } } });
    const changed = app.store.commit(state => ({ ...state, learning: { ...state.learning, lastMode: 'learn', modes: { ...state.learning.modes, count: { ...state.learning.modes.count, window: [...state.learning.modes.count.window, 'clean'] } } } }));
    if (changed.kind !== 'accepted') throw new Error('Expected current progression change');
    await changed.saved;
    app.write.mockClear();
    const publications: MoneyState[] = [];
    const unsubscribe = app.store.state.subscribe(state => publications.push(state));
    publications.length = 0;
    const result = app.practice.solve(started.roundId, clean(1));
    if (result.kind !== 'accepted') throw new Error('Expected solved commit');
    expect(result.changes).toEqual([{ kind: 'levelUp', mode: 'count', level: 2 }, { kind: 'open', mode: 'pay' }]);
    const expected: Save = {
      ...initial, lastMode: 'learn', currentStreak: 5, bestStreak: 5,
      modes: {
        ...initial.modes, count: { ...initial.modes.count, level: 2, fresh: false, window: [], introPending: true },
        pay: { ...initial.modes.pay, opened: true, fresh: true },
      },
    };
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    expect(await result.saved).toBe(true);
    expect(app.snapshot()).toEqual(expected);
    expect(app.practice.solve(started.roundId, clean(1)).kind).toBe('rejected');
    expect(app.write).toHaveBeenCalledTimes(1);
    expect(moneySave.encode(app.store.state.value)).toEqual(expected);
    unsubscribe();
  });
});
