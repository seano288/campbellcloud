import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { nonMoneySession } from './nonMoney.fixture';
import { createRound } from './round';
import type { LearningSession, RoundResult, SolvedProblem } from './session';
import { seeded } from '../game/rng';
import { countSession, paySession } from '../modes/session';
import { freshLearning } from '../modes/state';
import { helpPayCoins } from '../money/payment';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('runs five fixed clock problems, reports each solve before its delay and completes only once', async () => {
  const solved: SolvedProblem[] = [], terminal: RoundResult[] = [];
  const controller = createRound({
    roundId: 'clock-1', session: nonMoneySession(), rng: () => 0,
    interrupt: vi.fn(),
    solved: (_id, fact) => solved.push(fact),
    terminal: fact => terminal.push(fact),
  });
  for (let index = 1; index <= 5; index++) {
    const instance = controller.display.value.current!;
    expect(controller.display.value.phase).toBe('answering');
    expect(instance.actions.submit('3:00')).toBe('correct');
    expect(instance.signal.aborted).toBe(true);
    expect(instance.actions.submit('3:00')).toBe('ignored');
    expect(solved).toHaveLength(index);
    expect(solved.at(-1)).toEqual({ index, outcome: 'clean', misses: 0, helped: false, replay: false });
    expect(controller.display.value.answered).toBe(index);
    expect(controller.display.value.phase).toBe('success');
    if (index < 5) {
      await vi.advanceTimersByTimeAsync(1499);
      expect(controller.display.value.current).toBe(instance);
      await vi.advanceTimersByTimeAsync(1);
      expect(controller.display.value.current?.id).not.toBe(instance.id);
    }
  }
  await vi.advanceTimersByTimeAsync(899);
  expect(terminal).toEqual([]);
  await vi.advanceTimersByTimeAsync(1);
  expect(controller.display.value.phase).toBe('completed');
  expect(terminal).toEqual([{ roundId: 'clock-1', status: 'completed', results: solved }]);
  controller.leave();
  await vi.advanceTimersByTimeAsync(5000);
  expect(terminal).toHaveLength(1);
});

it('reports misses and help immediately, holding answers through explanation and the thinking pause', async () => {
  let release = () => {};
  const explanation = new Promise<void>(resolve => { release = resolve; });
  const explain = vi.fn(() => explanation), interrupt = vi.fn(), solved = vi.fn();
  const controller = createRound({
    roundId: 'clock-2', session: { ...nonMoneySession(), check: () => ({ kind: 'incorrect', explain }) }, rng: () => 0,
    interrupt, solved, terminal: vi.fn(),
  });
  const { actions, signal } = controller.display.value.current;
  expect(actions.submit('4:00')).toBe('incorrect');
  expect(interrupt).toHaveBeenLastCalledWith({ roundId: 'clock-2', problemId: 1, index: 1, outcome: 'missed' });
  expect(explain).toHaveBeenCalledWith(false, signal);
  expect(controller.display.value.phase).toBe('explaining');
  await vi.advanceTimersByTimeAsync(2000);
  expect(actions.submit('3:00')).toBe('ignored');
  const help = vi.fn(async () => {});
  actions.help(help);
  expect(interrupt).toHaveBeenLastCalledWith({ roundId: 'clock-2', problemId: 1, index: 1, outcome: 'helped' });
  expect(help).toHaveBeenCalledWith(signal);
  expect(actions.busy).toBe(true);
  release();
  await vi.advanceTimersByTimeAsync(0);
  expect(controller.display.value.phase).toBe('thinking');
  await vi.advanceTimersByTimeAsync(1499);
  expect(actions.busy).toBe(true);
  await vi.advanceTimersByTimeAsync(1);
  expect(actions.busy).toBe(false);
  actions.submit('4:00');
  expect(explain).toHaveBeenLastCalledWith(true, signal);
  expect(interrupt.mock.calls.map(([fact]) => fact.outcome)).toEqual(['missed', 'helped', 'missed', 'helped']);
  expect(solved).not.toHaveBeenCalled();
  controller.leave();
});

it('ignores empty input without locking and cancels unlocked manual help when the helped problem is solved', async () => {
  const interrupt = vi.fn(), solved = vi.fn(), prompt = vi.fn(async () => { throw new Error('prompt failed'); });
  const session = nonMoneySession();
  const controller = createRound({
    roundId: 'clock-help', session: { ...session, check: (p, answer: string) => answer ? session.check(p, answer) : { kind: 'not-an-answer', prompt } },
    rng: () => 0, interrupt, solved, terminal: vi.fn(),
  });
  const { actions, signal } = controller.display.value.current;
  expect(actions.submit('')).toBe('not-an-answer');
  expect(prompt).toHaveBeenCalledWith(signal);
  expect(actions.busy).toBe(false);
  expect(interrupt).not.toHaveBeenCalled();
  let release = () => {};
  let taught = false;
  actions.help(async signal => {
    expect(interrupt).toHaveBeenLastCalledWith({ roundId: 'clock-help', problemId: 1, index: 1, outcome: 'helped' });
    await new Promise<void>(resolve => { release = resolve; });
    if (!signal.aborted) taught = true;
  });
  expect(actions.busy).toBe(false);
  expect(actions.submit('3:00')).toBe('correct');
  expect(solved).toHaveBeenCalledWith('clock-help', { index: 1, outcome: 'helped', misses: 0, helped: true, replay: false });
  release();
  await vi.advanceTimersByTimeAsync(1500);
  expect(taught).toBe(false);
  actions.help(async () => { taught = true; });
  expect(taught).toBe(false);
  expect(controller.display.value.current.actions.submit('3:00')).toBe('correct');
  expect(solved).toHaveBeenLastCalledWith('clock-help', { index: 2, outcome: 'clean', misses: 0, helped: false, replay: false });
  controller.leave();
});

it.each([false, true])('replays a miss only after an intervening solve, with fresh tracking and no further replay, missed again %s', async missAgain => {
  let generated = 0;
  const session: LearningSession<{ word: string }, string> = {
    makeProblem: () => ({ word: `word-${++generated}` }), replay: problem => ({ ...problem }),
    needsEarlyHelp: () => false,
    check: (problem, answer) => answer === problem.word ? { kind: 'correct' } : { kind: 'incorrect', explain: async () => {} },
  };
  const solved = vi.fn(), terminal = vi.fn();
  const controller = createRound({ roundId: 'words', session, rng: () => 0, interrupt: vi.fn(), solved, terminal });
  const first = controller.display.value.current;
  first.actions.submit('wrong');
  await vi.advanceTimersByTimeAsync(1500);
  first.actions.submit('word-1');
  expect(solved).toHaveBeenLastCalledWith('words', { index: 1, outcome: 'missed', misses: 1, helped: false, replay: false });
  await vi.advanceTimersByTimeAsync(1500);
  expect(controller.display.value.current.problem.word).toBe('word-2');
  controller.display.value.current.actions.submit('word-2');
  await vi.advanceTimersByTimeAsync(1500);
  const replay = controller.display.value.current;
  expect(replay.problem.word).toBe('word-1');
  expect(replay.actions).not.toBe(first.actions);
  expect(replay.signal).not.toBe(first.signal);
  expect(first.actions.submit('word-1')).toBe('ignored');
  if (missAgain) {
    replay.actions.submit('wrong');
    await vi.advanceTimersByTimeAsync(1500);
  }
  replay.actions.submit('word-1');
  expect(solved).toHaveBeenLastCalledWith('words', { index: 3, outcome: missAgain ? 'missed' : 'clean', misses: missAgain ? 1 : 0, helped: false, replay: true });
  for (const word of ['word-3', 'word-4']) {
    await vi.advanceTimersByTimeAsync(1500);
    expect(controller.display.value.current.problem.word).toBe(word);
    controller.display.value.current.actions.submit(word);
  }
  await vi.advanceTimersByTimeAsync(900);
  expect(terminal).toHaveBeenCalledOnce();
  expect(controller.display.value.results).toHaveLength(5);
});

it('scopes introduction acknowledgement to its active lifetime and leaves unacknowledged introductions pending', () => {
  const acknowledge = vi.fn(), terminal = vi.fn(), help = vi.fn();
  const options = { roundId: 'intro-1', session: nonMoneySession(), rng: () => 0, interrupt: vi.fn(), solved: vi.fn(), terminal, introduction: { acknowledge } };
  const first = createRound(options);
  const intro = first.display.value.introduction!;
  expect(first.display.value.phase).toBe('introduction');
  expect(first.display.value.current.actions.submit('3:00')).toBe('ignored');
  first.display.value.current.actions.help(help);
  expect(help).not.toHaveBeenCalled();
  first.leave();
  expect(intro.signal.aborted).toBe(true);
  const second = createRound({ ...options, roundId: 'intro-2' });
  intro.acknowledge();
  expect(acknowledge).not.toHaveBeenCalled();
  expect(second.display.value.phase).toBe('introduction');
  const activeIntro = second.display.value.introduction!;
  activeIntro.acknowledge();
  activeIntro.acknowledge();
  expect(acknowledge).toHaveBeenCalledOnce();
  expect(activeIntro.signal.aborted).toBe(true);
  expect(second.display.value.introduction).toBeNull();
  expect(second.display.value.current.actions.submit('3:00')).toBe('correct');
  second.leave();
  expect(terminal.mock.calls.map(([fact]) => [fact.roundId, fact.status, fact.results.length])).toEqual([
    ['intro-1', 'abandoned', 0], ['intro-2', 'abandoned', 1],
  ]);
});

it.each(['throw', 'reject'] as const)('cleans up an explanation %s without success and teaches on the first miss when current progression requests it', async failure => {
  let earlyHelp = false;
  const explain = vi.fn(() => {
    if (failure === 'throw') throw new Error('explanation failed');
    return Promise.reject(new Error('explanation failed'));
  });
  const session = nonMoneySession(), solved = vi.fn();
  const controller = createRound({
    roundId: 'failure', session: {
      ...session, needsEarlyHelp: () => earlyHelp,
      check: (p, answer: string) => answer === '3:00' ? session.check(p, answer) : { kind: 'incorrect', explain },
    },
    rng: () => 0, interrupt: vi.fn(), solved, terminal: vi.fn(),
  });
  earlyHelp = true;
  const { actions, signal } = controller.display.value.current;
  actions.submit('4:00');
  expect(explain).toHaveBeenCalledWith(true, signal);
  await vi.advanceTimersByTimeAsync(1500);
  expect(actions.busy).toBe(false);
  expect(solved).not.toHaveBeenCalled();
  actions.submit('3:00');
  expect(solved).toHaveBeenCalledWith('failure', { index: 1, outcome: 'missed', misses: 1, helped: true, replay: false });
  controller.leave();
});

it('cancels late explanations without a replacement pause or changes to a newer Round', async () => {
  let reject = (_error: Error) => {};
  const explanation = new Promise<void>((_resolve, fail) => { reject = fail; });
  const terminal = vi.fn();
  const first = createRound({
    roundId: 'old', session: { ...nonMoneySession(), check: () => ({ kind: 'incorrect', explain: () => explanation }) },
    rng: () => 0, interrupt: vi.fn(), solved: vi.fn(), terminal,
  });
  const old = first.display.value.current;
  old.actions.submit('4:00');
  first.leave();
  first.leave();
  const next = createRound({
    roundId: 'new', session: { ...nonMoneySession(), check: () => ({ kind: 'incorrect', explain: () => new Promise(() => {}) }) },
    rng: () => 0, interrupt: vi.fn(), solved: vi.fn(), terminal,
  });
  next.display.value.current.actions.submit('4:00');
  const before = next.display.value;
  reject(new Error('late explanation'));
  await vi.advanceTimersByTimeAsync(10000);
  expect(old.signal.aborted).toBe(true);
  expect(old.actions.submit('3:00')).toBe('ignored');
  expect(first.display.value.phase).toBe('abandoned');
  expect(next.display.value).toBe(before);
  expect(terminal).toHaveBeenCalledExactlyOnceWith({ roundId: 'old', status: 'abandoned', results: [] });
  next.leave();
});

it('cancels problem work but preserves Round success effects and abandons on parent cancellation during the final delay', async () => {
  const parent = new AbortController(), success = vi.fn(async (_fact: SolvedProblem, _signal: AbortSignal) => { throw new Error('success audio failed'); }), terminal = vi.fn();
  const controller = createRound({
    roundId: 'parent', session: nonMoneySession(), rng: () => 0, signal: parent.signal,
    interrupt: vi.fn(), solved: vi.fn(), terminal, effects: { correct: success },
  });
  for (let i = 0; i < 5; i++) {
    controller.display.value.current.actions.submit('3:00');
    if (i < 4) await vi.advanceTimersByTimeAsync(1500);
  }
  expect(success).toHaveBeenCalledTimes(5);
  const successSignal = success.mock.calls.at(-1)![1];
  expect(successSignal.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(899);
  parent.abort();
  expect(successSignal.aborted).toBe(true);
  await vi.advanceTimersByTimeAsync(5000);
  expect(controller.display.value.phase).toBe('abandoned');
  expect(terminal).toHaveBeenCalledOnce();
  expect(terminal.mock.calls[0]![0]).toMatchObject({ roundId: 'parent', status: 'abandoned', results: Array.from({ length: 5 }, (_, index) => ({
    index: index + 1, outcome: 'clean', misses: 0, helped: false, replay: false,
  })) });
});

it('keeps failed help unlocked and cancels a late not-an-answer prompt before it can affect the next problem', async () => {
  let release = () => {};
  let promptEffect = '';
  const session = nonMoneySession();
  const controller = createRound({
    roundId: 'prompt', session: {
      ...session,
      check: (p, answer: string) => answer ? session.check(p, answer) : {
        kind: 'not-an-answer',
        prompt: async signal => {
          await new Promise<void>(resolve => { release = resolve; });
          if (!signal.aborted) promptEffect = 'Tap a clock answer';
        },
      },
    },
    rng: () => 0, interrupt: vi.fn(), solved: vi.fn(), terminal: vi.fn(),
  });
  const first = controller.display.value.current;
  first.actions.help(() => { throw new Error('help failed'); });
  expect(first.actions.busy).toBe(false);
  first.actions.submit('');
  expect(first.actions.busy).toBe(false);
  first.actions.submit('3:00');
  await vi.advanceTimersByTimeAsync(1500);
  const next = controller.display.value;
  release();
  await vi.advanceTimersByTimeAsync(5000);
  expect(promptEffect).toBe('');
  expect(controller.display.value).toBe(next);
  expect(next.phase).toBe('answering');
  expect(next.results).toEqual([{ index: 1, outcome: 'helped', misses: 0, helped: true, replay: false }]);
  controller.leave();
});

it.each(['display', 'report'])('reports the solve before abandonment when leaving during the %s callback', leaveAt => {
  const reported: string[] = [];
  const terminal = vi.fn((fact: RoundResult) => { reported.push(fact.status); });
  const controller = createRound({
    roundId: 'observed', session: nonMoneySession(), rng: () => 0, interrupt: vi.fn(),
    solved: () => { reported.push('solved'); if (leaveAt === 'report') controller.leave(); },
    terminal,
  });
  const stop = controller.display.subscribe(display => {
    if (leaveAt === 'display' && display.phase === 'success') controller.leave();
  });
  controller.display.value.current.actions.submit('3:00');
  expect(reported).toEqual(['solved', 'abandoned']);
  expect(controller.display.value.results).toEqual([{ index: 1, outcome: 'clean', misses: 0, helped: false, replay: false }]);
  expect(terminal).toHaveBeenCalledWith({ roundId: 'observed', status: 'abandoned', results: [{ index: 1, outcome: 'clean', misses: 0, helped: false, replay: false }] });
  stop();
});

it('reports a miss before publishing its explanation and locks reentrant submissions during interruption reporting', () => {
  const reported: string[] = [];
  const controller = createRound({
    roundId: 'observed-miss', session: nonMoneySession(), rng: () => 0, solved: vi.fn(),
    interrupt: fact => {
      reported.push(fact.outcome);
      expect(controller.display.value.current.actions.submit('3:00')).toBe('ignored');
    },
    terminal: fact => { reported.push(fact.status); },
  });
  const stop = controller.display.subscribe(display => {
    if (display.phase === 'explaining') controller.leave();
  });
  controller.display.value.current.actions.submit('4:00');
  expect(reported).toEqual(['missed', 'abandoned']);
  stop();
});

it('reports completion only once when its terminal callback immediately leaves', async () => {
  const terminal = vi.fn((_fact: RoundResult) => { controller.leave(); });
  const controller = createRound({
    roundId: 'terminal-navigation', session: nonMoneySession(), rng: () => 0,
    interrupt: vi.fn(), solved: vi.fn(), terminal,
  });
  for (let index = 0; index < 5; index++) {
    controller.display.value.current.actions.submit('3:00');
    await vi.advanceTimersByTimeAsync(index === 4 ? 900 : 1500);
  }
  expect(terminal).toHaveBeenCalledOnce();
  expect(terminal.mock.calls[0]![0].status).toBe('completed');
  expect(controller.display.value.phase).toBe('completed');
});

it.each([
  { mode: 'count', failure: 'throw' }, { mode: 'count', failure: 'reject' },
  { mode: 'pay', failure: 'throw' }, { mode: 'pay', failure: 'reject' },
] as const)('releases a $mode explanation $failure through the shared thinking lifecycle without losing its miss', async ({ mode, failure }) => {
  const learning = freshLearning(), solved = vi.fn(), interrupt = vi.fn();
  const explain = () => {
    if (failure === 'throw') throw new Error('Explanation failed');
    return Promise.reject(new Error('Explanation failed'));
  };
  async function exercise<P, A>(session: LearningSession<P, A>, wrong: (p: P) => A, right: (p: P) => A) {
    const controller = createRound({ roundId: mode, session, rng: seeded(11), interrupt, solved, terminal: vi.fn() });
    const { actions, problem } = controller.display.value.current;
    expect(actions.submit(wrong(problem))).toBe('incorrect');
    expect(controller.display.value.phase).toBe('explaining');
    actions.help(async () => {});
    expect(actions.submit(right(problem))).toBe('ignored');
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.display.value.phase).toBe('thinking');
    await vi.advanceTimersByTimeAsync(1499);
    expect(actions.submit(right(problem))).toBe('ignored');
    await vi.advanceTimersByTimeAsync(1);
    expect(actions.submit(right(problem))).toBe('correct');
    expect(solved).toHaveBeenCalledExactlyOnceWith(mode, { index: 1, outcome: 'missed', misses: 1, helped: true, replay: false });
    controller.leave();
  }
  if (mode === 'count') await exercise(countSession(1, () => learning.modes.count, explain), p => p.choices.find(c => c !== p.total)!, p => p.total);
  else await exercise(paySession(1, () => learning.modes.pay, explain, async () => {}), () => ['p'] as const, p => helpPayCoins(p.price, p.bank));
});
