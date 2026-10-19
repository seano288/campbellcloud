import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshSave, type Save } from '../save/migrate';
import { MONEY_SAVE_KEY } from './save';
import { helpPayCoins } from '../money/payment';
import type { Round } from '../round/round';

let stored: string;
const write = vi.fn((_key: string, text: string) => { stored = text; });

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-14T12:00:00Z'));
  stored = JSON.stringify({ ...freshSave(), body: 'pickup', currentStreak: 7, bestStreak: 7 });
  write.mockClear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === MONEY_SAVE_KEY ? stored : null, setItem: write });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('fetch', () => Promise.reject(new Error('No recorded audio in this test')));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function launch() {
  await import('./selectedVoice');
  const store = await import('../game/store');
  const scheduler = await import('../round/round');
  await store.loadGame();
  return { ...store, ...scheduler };
}

const snapshot = (): Save => JSON.parse(stored);

function learnRound(app: Awaited<ReturnType<typeof launch>>) {
  const r = app.round.value;
  if (!r || r.mode !== 'learn') throw new Error('Expected Learn');
  return r;
}

function moneyRound(app: Awaited<ReturnType<typeof launch>>) {
  const r = app.round.value;
  if (!r || r.mode === 'learn') throw new Error('Expected Count or Pay');
  return r;
}

function solveMoney(r: Exclude<Round, { mode: 'learn' }>) {
  return r.mode === 'count'
    ? r.shared.current.actions.submit(r.shared.current.problem.total)
    : r.shared.current.actions.submit(helpPayCoins(r.shared.current.problem.price, r.shared.current.problem.bank));
}

function missMoney(r: Exclude<Round, { mode: 'learn' }>) {
  if (r.mode === 'pay') return r.shared.current.actions.submit(['p']);
  const current = r.shared.current;
  return current.actions.submit(current.problem.choices.find(c => c !== current.problem.total)!);
}

function seedMoney(mode: 'count' | 'pay', progress: Partial<Save['modes']['count']> = {}) {
  const initial = freshSave();
  stored = JSON.stringify({
    ...initial, body: 'pickup', currentStreak: 7, bestStreak: 7,
    modes: { ...initial.modes, [mode]: { ...initial.modes[mode], opened: true, ...progress } },
  });
}

describe('live practice coordination', () => {
  it('runs Pay through its subject checker, prompting for an empty tray without marking a miss or help', async () => {
    const app = await launch();
    app.startRound('pay');
    const r = app.round.value!;
    expect(r.shared?.phase).toBe('answering');
    if (r.mode !== 'pay' || !r.shared) throw new Error('Expected shared Pay');
    const { actions, problem } = r.shared.current;
    expect(actions.submit([])).toBe('not-an-answer');
    expect(actions.busy).toBe(false);
    expect(app.game.value.currentStreak).toBe(7);
    expect(app.game.value.modes.pay.window).toEqual([]);
    expect(actions.submit(helpPayCoins(problem.price, problem.bank))).toBe('correct');
    expect(app.round.value?.shared?.results).toEqual([{ index: 1, outcome: 'clean', misses: 0, helped: false, replay: false }]);
    app.leaveRound();
    await vi.advanceTimersByTimeAsync(5000);
    expect(snapshot().modes.pay.window).toEqual(['clean']);
    expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0 });
  });

  it('runs Count through bound subject actions and commits its answer before the success delay', async () => {
    const app = await launch();
    app.startRound('count');
    const r = app.round.value!;
    expect(r.shared?.phase).toBe('answering');
    if (r.mode !== 'count' || !r.shared) throw new Error('Expected shared Count');
    const current = r.shared.current;
    expect(current.actions.submit(current.problem.total)).toBe('correct');
    expect(app.game.value.modes.count.window).toEqual(['clean']);
    expect(app.game.value.modes.learn.window).toEqual([]);
    expect(app.game.value).toMatchObject({ currentStreak: 8, bolts: 0, roundsFinished: 0 });
    expect(app.round.value?.shared?.phase).toBe('success');
    app.leaveRound();
    await vi.advanceTimersByTimeAsync(5000);
    expect(snapshot().modes.count.window).toEqual(['clean']);
    expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0 });
  });

  it('accepts a bound Learn answer from the first published display exactly once', async () => {
    const app = await launch();
    let attempted = false;
    const stop = app.round.subscribe(r => {
      if (!r || r.mode !== 'learn' || attempted) return;
      attempted = true;
      const current = r.shared.current;
      current.actions.submit(current.problem.target);
      current.actions.submit(current.problem.target);
      current.actions.help(async () => {});
    });
    app.startRound('learn');
    expect(app.round.value?.shared?.phase).toBe('success');
    expect(app.game.value.modes.learn.window).toEqual(['clean']);
    expect(app.game.value.currentStreak).toBe(8);
    stop();
    app.leaveRound();
  });

  it.each(['explaining', 'success'])('keeps accepted answer progress when navigation reacts to %s', async phase => {
    const app = await launch();
    app.startRound('learn');
    const current = learnRound(app).shared.current;
    const stop = app.round.subscribe(r => {
      if (r?.shared?.phase === phase) app.leaveRound();
    });
    current.actions.submit(phase === 'success' ? current.problem.target : current.problem.target === 'p' ? 'n' : 'p');
    await vi.advanceTimersByTimeAsync(5000);
    expect(app.round.value).toBeNull();
    expect(snapshot()).toMatchObject({ currentStreak: phase === 'success' ? 8 : 0, bolts: 0, roundsFinished: 0 });
    expect(snapshot().modes.learn.window).toEqual(phase === 'success' ? ['clean'] : []);
    stop();
  });

  it('commits rewards before publishing completion and retains them when that publication navigates away', async () => {
    const app = await launch();
    app.startRound('learn');
    const stop = app.round.subscribe(r => {
      if (r?.shared?.phase === 'completed') app.leaveRound();
    });
    for (let index = 0; index < 5; index++) {
      const current = learnRound(app).shared.current;
      current.actions.submit(current.problem.target);
      if (index < 4) await vi.advanceTimersByTimeAsync(1500);
    }
    await vi.advanceTimersByTimeAsync(900);
    expect(app.round.value).toBeNull();
    expect(snapshot()).toMatchObject({ bolts: 6, roundsFinished: 1, daysPlayed: 1, currentStreak: 12 });
    expect(snapshot().modes.learn.window).toEqual(['clean', 'clean', 'clean', 'clean', 'clean']);
    await vi.advanceTimersByTimeAsync(5000);
    expect(snapshot()).toMatchObject({ bolts: 6, roundsFinished: 1 });
    stop();
  });

  it('uses the entry Level for generation while committing a Level increase and retaining the next introduction', async () => {
    const initial = freshSave();
    stored = JSON.stringify({ ...initial, body: 'pickup', modes: { ...initial.modes, learn: { ...initial.modes.learn, window: Array(7).fill('clean') } } });
    const app = await launch();
    app.startRound('learn');
    for (let index = 0; index < 5; index++) {
      const r = learnRound(app), current = r.shared.current;
      expect(r.level).toBe(1);
      expect(['p', 'n', 'd']).toContain(current.problem.target);
      expect('choices' in current.problem ? current.problem.choices : current.problem.options).not.toContain('q');
      current.actions.submit(current.problem.target);
      expect(app.game.value.modes.learn).toMatchObject({ level: 2, introPending: true });
      if (index < 4) await vi.advanceTimersByTimeAsync(1500);
    }
    expect(app.round.value?.events).toEqual([{ kind: 'levelUp', mode: 'learn', level: 2 }, { kind: 'open', mode: 'count' }]);
    await vi.advanceTimersByTimeAsync(900);
    expect(app.game.value).toMatchObject({ bolts: 6, roundsFinished: 1 });
    // the rest of the Round was asked at Level 1, so none of it counts toward Level 2
    expect(snapshot().modes.learn.window).toEqual([]);
    app.leaveRound();
    app.startRound('learn');
    expect(app.round.value).toMatchObject({ level: 2, intro: true });
    app.leaveRound();
  });

  it('retains pending introductions on leaving and ignores an old acknowledgement after replacement', async () => {
    const initial = freshSave();
    stored = JSON.stringify({ ...initial, body: 'pickup', modes: { ...initial.modes, learn: { ...initial.modes.learn, level: 2, introPending: true } } });
    const app = await launch();
    app.startRound('learn');
    const old = app.round.value!.shared!.introduction!;
    app.leaveRound();
    expect(app.game.value.modes.learn.introPending).toBe(true);
    app.startRound('learn');
    const current = app.round.value!.shared!.introduction!;
    old.acknowledge();
    expect(app.game.value.modes.learn.introPending).toBe(true);
    expect(app.round.value?.intro).toBe(true);
    current.acknowledge();
    current.acknowledge();
    expect(app.game.value.modes.learn.introPending).toBe(false);
    expect(app.round.value?.shared?.phase).toBe('answering');
    app.leaveRound();
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot().modes.learn.introPending).toBe(false);
    expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0 });
  });

  it('reads current progression for early help, commits misses immediately and retains solved facts on abandonment', async () => {
    const initial = freshSave();
    stored = JSON.stringify({ ...initial, body: 'pickup', currentStreak: 7, bestStreak: 7, modes: {
      ...initial.modes, learn: { ...initial.modes.learn, window: Array(4).fill('missed') },
    } });
    const app = await launch();
    app.startRound('learn');
    const first = learnRound(app).shared.current;
    first.actions.submit(first.problem.target === 'p' ? 'n' : 'p');
    expect(app.game.value.currentStreak).toBe(0);
    expect(app.game.value.modes.learn.window).toHaveLength(4);
    await vi.advanceTimersByTimeAsync(1500);
    first.actions.submit(first.problem.target);
    expect(app.round.value?.shared?.results).toEqual([{ index: 1, outcome: 'missed', misses: 1, helped: false, replay: false }]);
    await vi.advanceTimersByTimeAsync(1500);
    const second = learnRound(app).shared.current;
    second.actions.submit(second.problem.target === 'p' ? 'n' : 'p');
    await vi.advanceTimersByTimeAsync(1500);
    second.actions.submit(second.problem.target);
    expect(app.round.value?.shared?.results.at(-1)).toEqual({ index: 2, outcome: 'missed', misses: 1, helped: true, replay: false });
    app.leaveRound();
    await vi.advanceTimersByTimeAsync(5000);
    expect(snapshot().modes.learn.window).toEqual(['missed', 'missed', 'missed', 'missed', 'missed', 'missed']);
    expect(snapshot()).toMatchObject({ bolts: 0, currentStreak: 0, bestStreak: 7, roundsFinished: 0 });
  });

  it.each([899, 900])('keeps solved progress but only commits completion after the final delay at %i ms', async elapsed => {
    const app = await launch();
    app.startRound('learn');
    for (let index = 0; index < 5; index++) {
      const r = learnRound(app);
      const current = r.shared!.current;
      current.actions.submit(current.problem.target);
      current.actions.submit(current.problem.target);
      current.actions.help(async () => {});
      expect(app.game.value.currentStreak).toBe(8 + index);
      expect(app.game.value.modes.learn.window).toHaveLength(index + 1);
      if (index < 4) await vi.advanceTimersByTimeAsync(1500);
    }
    expect(app.game.value).toMatchObject({ bolts: 0, roundsFinished: 0, daysPlayed: 0, trophies: {} });
    expect(app.round.value?.ended).toBe(false);
    await vi.advanceTimersByTimeAsync(elapsed);
    const afterDelay = app.round.value!;
    const completed = elapsed === 900;
    expect(afterDelay).toMatchObject({ ended: completed, earned: completed ? 6 : 0 });
    expect(app.game.value).toMatchObject({ bolts: completed ? 6 : 0, roundsFinished: completed ? 1 : 0, daysPlayed: completed ? 1 : 0 });
    if (completed) expect(afterDelay.events).toEqual([
      { kind: 'trophy', step: { kind: 'streak', n: 5 } },
      { kind: 'trophy', step: { kind: 'streak', n: 10 } },
      { kind: 'trophy', step: { kind: 'perfect' } },
    ]);
    app.leaveRound();
    await vi.advanceTimersByTimeAsync(5000);
    expect(app.round.value).toBeNull();
    expect(snapshot()).toMatchObject({ bolts: completed ? 6 : 0, currentStreak: 12, bestStreak: 12, roundsFinished: completed ? 1 : 0 });
    expect(snapshot().modes.learn.window).toEqual(['clean', 'clean', 'clean', 'clean', 'clean']);
    if (!completed) expect(snapshot().trophies).toEqual({});
    const saved = snapshot();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(saved);
    expect((await import('../round/round')).round.value).toBeNull();
  });

  it('does not let an old explanation unlock a replacement problem or record a solved answer', async () => {
    const pending: ((error: Error) => void)[] = [];
    vi.stubGlobal('fetch', () => new Promise((_resolve, reject) => { pending.push(reject); }));
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const app = await launch();
    app.startRound('learn');
    const first = learnRound(app).shared.current;
    first.actions.submit(first.problem.target === 'p' ? 'n' : 'p');
    await vi.advanceTimersByTimeAsync(0);
    const oldRequests = [...pending];
    expect(oldRequests.length).toBeGreaterThan(0);
    app.leaveRound();
    random.mockReturnValue(0.6);
    app.startRound('learn');
    const replacement = learnRound(app).shared.current;
    replacement.actions.submit(replacement.problem.target === 'p' ? 'n' : 'p');
    const before = app.player.state.value;
    for (const reject of oldRequests) reject(new Error('Old audio unavailable'));
    await vi.advanceTimersByTimeAsync(1500);
    expect(app.round.value?.thinking).toBe(true);
    expect(replacement.actions.submit(replacement.problem.target)).toBe('ignored');
    expect(first.actions.submit(first.problem.target)).toBe('ignored');
    expect(app.player.state.value).toBe(before);
    expect(snapshot().modes.learn.window).toEqual([]);
    expect(snapshot()).toMatchObject({ currentStreak: 0, bolts: 0, roundsFinished: 0 });
  });

  it('ignores solved and help callbacks from a replaced Round', async () => {
    const app = await launch();
    app.startRound('learn');
    const first = learnRound(app);
    const oldCorrect = () => first.shared!.current.actions.submit(first.shared!.current.problem.target);
    const oldHelp = () => first.shared!.current.actions.help(async () => {});
    app.startRound('learn');
    const replacement = app.round.value;
    const before = app.player.state.value;
    await vi.advanceTimersByTimeAsync(0);
    write.mockClear();
    oldHelp();
    oldCorrect();
    expect(app.player.state.value).toBe(before);
    expect(app.round.value).toBe(replacement);
    await vi.advanceTimersByTimeAsync(2000);
    expect(write).not.toHaveBeenCalled();
    expect(snapshot()).toMatchObject({ currentStreak: 7, bolts: 0, roundsFinished: 0 });
  });

  describe.each(['count', 'pay'] as const)('%s shared Rounds', mode => {
    it.each([{ clean: 5, bolts: 6 }, { clean: 2, bolts: 3 }, { clean: 0, bolts: 1 }])('credits $bolts Bolts for $clean clean answers exactly once', async ({ clean, bolts }) => {
      seedMoney(mode);
      const app = await launch();
      app.startRound(mode);
      for (let index = 0; index < 5; index++) {
        const r = moneyRound(app);
        if (index >= clean) r.shared.current.actions.help(async () => {});
        expect(solveMoney(r)).toBe('correct');
        expect(solveMoney(r)).toBe('ignored');
        if (index < 4) await vi.advanceTimersByTimeAsync(1500);
      }
      expect(app.game.value).toMatchObject({ bolts: 0, roundsFinished: 0 });
      await vi.advanceTimersByTimeAsync(900);
      expect(app.game.value).toMatchObject({ bolts, roundsFinished: 1, daysPlayed: 1 });
      expect(app.game.value.modes[mode].window).toEqual([...Array(clean).fill('clean'), ...Array(5 - clean).fill('helped')]);
      expect(app.game.value.modes[mode === 'count' ? 'pay' : 'count'].window).toEqual([]);
      expect(app.game.value.trophies).toEqual(clean === 5 ? {
        'streak:5': '2026-10-14', 'streak:10': '2026-10-14', perfect: '2026-10-14',
      } : { 'streak:5': '2026-10-14' });
      const before = app.player.state.value;
      moneyRound(app).shared.current.actions.help(async () => { throw new Error('stale help'); });
      expect(solveMoney(moneyRound(app))).toBe('ignored');
      app.leaveRound();
      await vi.advanceTimersByTimeAsync(5000);
      expect(app.player.state.value).toBe(before);
      expect(snapshot()).toMatchObject({ bolts, roundsFinished: 1 });
    });

    it('keeps five answers but earns nothing when leaving during the final delay', async () => {
      seedMoney(mode);
      const app = await launch();
      app.startRound(mode);
      for (let index = 0; index < 5; index++) {
        solveMoney(moneyRound(app));
        if (index < 4) await vi.advanceTimersByTimeAsync(1500);
      }
      const old = moneyRound(app);
      await vi.advanceTimersByTimeAsync(899);
      app.leaveRound();
      app.startRound(mode);
      expect(solveMoney(old)).toBe('ignored');
      await vi.advanceTimersByTimeAsync(5000);
      expect(moneyRound(app).shared.answered).toBe(0);
      expect(snapshot().modes[mode].window).toEqual(Array(5).fill('clean'));
      expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0, daysPlayed: 0, trophies: {} });
      app.leaveRound();
    });

    it.each([1, 5] as const)('captures Level %i generation while saving a Level increase or star', async level => {
      seedMoney(mode, { level, window: Array(7).fill('clean'), fresh: true });
      const app = await launch();
      app.startRound(mode);
      expect(app.game.value.modes[mode].fresh).toBe(false);
      for (let index = 0; index < 5; index++) {
        const r = moneyRound(app);
        expect(r.level).toBe(level);
        if (level === 1) {
          if (r.mode === 'count') expect(r.shared.current.problem.pile.every(k => ['d', 'n', 'p'].includes(k))).toBe(true);
          else {
            expect(r.shared.current.problem.price).toBeLessThanOrEqual(25);
            expect(r.shared.current.problem.bank).toEqual(['d', 'n', 'p']);
          }
        }
        solveMoney(r);
        // above Level 1 a Round opens with a warm-up from the Level below, which doesn't count toward Mastery
        if (level === 5 && index === 0) expect(app.game.value.modes[mode]).toMatchObject({ level: 5, starred: false });
        else expect(app.game.value.modes[mode]).toMatchObject(level === 1 ? { level: 2, introPending: true } : { level: 5, starred: true });
        if (index < 4) await vi.advanceTimersByTimeAsync(1500);
      }
      await vi.advanceTimersByTimeAsync(900);
      expect(app.game.value.trophies).toHaveProperty(`${mode}:${level === 1 ? 2 : 'star'}`, '2026-10-14');
      if (mode === 'count' && level === 1) expect(app.game.value.modes.pay).toMatchObject({ opened: true, fresh: true });
      app.leaveRound();
    });

    it('scopes introduction acknowledgement to its active Round and leaves pending state intact', async () => {
      seedMoney(mode, { level: 2, introPending: true });
      const app = await launch();
      app.startRound(mode);
      const old = moneyRound(app).shared.introduction!;
      expect(solveMoney(moneyRound(app))).toBe('ignored');
      app.startRound(mode);
      old.acknowledge();
      expect(old.signal.aborted).toBe(true);
      expect(app.game.value.modes[mode].introPending).toBe(true);
      const current = moneyRound(app).shared.introduction!;
      current.acknowledge();
      current.acknowledge();
      expect(app.game.value.modes[mode].introPending).toBe(false);
      expect(moneyRound(app).shared.phase).toBe('answering');
      app.leaveRound();
    });

    it('uses current Mastery for early help and replays a miss after an intervening answer with fresh actions', async () => {
      seedMoney(mode, { window: Array(4).fill('missed') });
      const app = await launch();
      app.startRound(mode);
      const first = moneyRound(app);
      expect(missMoney(first)).toBe('incorrect');
      expect(solveMoney(first)).toBe('ignored');
      expect(app.game.value.currentStreak).toBe(0);
      expect(app.game.value.modes[mode].window).toHaveLength(4);
      await vi.advanceTimersByTimeAsync(1500);
      expect(solveMoney(first)).toBe('correct');
      expect(moneyRound(app).shared.results).toEqual([{ index: 1, outcome: 'missed', misses: 1, helped: false, replay: false }]);
      await vi.advanceTimersByTimeAsync(1500);
      const second = moneyRound(app);
      expect(missMoney(second)).toBe('incorrect');
      await vi.advanceTimersByTimeAsync(10000);
      expect(solveMoney(second)).toBe('correct');
      expect(moneyRound(app).shared.results.at(-1)).toEqual({ index: 2, outcome: 'missed', misses: 1, helped: true, replay: false });
      await vi.advanceTimersByTimeAsync(1500);
      const replay = moneyRound(app);
      if (replay.mode === 'count' && first.mode === 'count') {
        expect(replay.shared.current.problem.pile).toEqual(first.shared.current.problem.pile);
        expect(replay.shared.current.problem.total).toBe(first.shared.current.problem.total);
        expect([...replay.shared.current.problem.choices].sort()).toEqual([...first.shared.current.problem.choices].sort());
      } else expect(replay.shared.current.problem).toEqual(first.shared.current.problem);
      expect(replay.shared.current.actions).not.toBe(first.shared.current.actions);
      expect(solveMoney(first)).toBe('ignored');
      expect(solveMoney(replay)).toBe('correct');
      expect(moneyRound(app).shared.results.at(-1)).toEqual({ index: 3, outcome: 'clean', misses: 0, helped: false, replay: true });
      app.leaveRound();
      await vi.advanceTimersByTimeAsync(5000);
      expect(snapshot().modes[mode].window).toEqual(['missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'clean']);
      expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0 });
    });

    it('cancels held explanations and ignores stale answers and help after replacement', async () => {
      seedMoney(mode);
      const requests: ((error: Error) => void)[] = [];
      vi.stubGlobal('fetch', () => new Promise((_resolve, reject) => { requests.push(reject); }));
      const app = await launch();
      app.startRound(mode);
      const first = moneyRound(app);
      missMoney(first);
      await vi.advanceTimersByTimeAsync(0);
      const oldRequests = [...requests];
      expect(oldRequests.length).toBeGreaterThan(0);
      app.startRound(mode === 'count' ? 'pay' : 'count');
      missMoney(moneyRound(app));
      const before = app.player.state.value;
      for (const reject of oldRequests) reject(new Error('Old recording unavailable'));
      first.shared.current.actions.help(async () => { throw new Error('stale help'); });
      await vi.advanceTimersByTimeAsync(5000);
      expect(first.shared.current.signal.aborted).toBe(true);
      expect(solveMoney(first)).toBe('ignored');
      expect(solveMoney(moneyRound(app))).toBe('ignored');
      expect(moneyRound(app).shared.phase).toBe('explaining');
      expect(app.player.state.value).toBe(before);
      expect(snapshot()).toMatchObject({ bolts: 0, roundsFinished: 0, currentStreak: 0 });
      app.leaveRound();
    });
  });
});
