import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshSave, type Save } from '../save/migrate';
import { MONEY_SAVE_KEY } from './save';

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
  const store = await import('../game/store');
  const scheduler = await import('../round/round');
  await store.loadGame();
  return { ...store, ...scheduler };
}

const snapshot = (): Save => JSON.parse(stored);

describe('live practice coordination', () => {
  it('publishes Learn with bound subject actions from its first display, without a legacy writer', async () => {
    const app = await launch();
    let attempted = false;
    const stop = app.round.subscribe(r => {
      if (!r || attempted) return;
      attempted = true;
      app.correct(r.roundId, r.key);
      app.helped(r.roundId, r.key);
    });
    app.startRound('learn');
    expect(app.round.value?.shared?.phase).toBe('answering');
    expect(app.game.value.modes.learn.window).toEqual([]);
    expect(app.game.value.currentStreak).toBe(7);
    stop();
    app.leaveRound();
  });

  it.each(['explaining', 'success'])('keeps accepted answer progress when navigation reacts to %s', async phase => {
    const app = await launch();
    app.startRound('learn');
    const current = app.round.value!.shared!.current;
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
      const current = app.round.value!.shared!.current;
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
      const r = app.round.value!, current = r.shared!.current;
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
    expect(snapshot().modes.learn.window).toEqual(['clean', 'clean', 'clean', 'clean']);
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
    const first = app.round.value!.shared!.current;
    first.actions.submit(first.problem.target === 'p' ? 'n' : 'p');
    expect(app.game.value.currentStreak).toBe(0);
    expect(app.game.value.modes.learn.window).toHaveLength(4);
    await vi.advanceTimersByTimeAsync(1500);
    first.actions.submit(first.problem.target);
    expect(app.round.value?.shared?.results).toEqual([{ index: 1, outcome: 'missed', misses: 1, helped: false, replay: false }]);
    await vi.advanceTimersByTimeAsync(1500);
    const second = app.round.value!.shared!.current;
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
      const r = app.round.value!;
      const current = r.shared!.current;
      const before = app.player.state.value;
      app.correct(r.roundId, r.key);
      app.helped(r.roundId, r.key);
      expect(app.player.state.value).toBe(before);
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
    const first = app.round.value!.shared!.current;
    first.actions.submit(first.problem.target === 'p' ? 'n' : 'p');
    await vi.advanceTimersByTimeAsync(0);
    const oldRequests = [...pending];
    expect(oldRequests.length).toBeGreaterThan(0);
    app.leaveRound();
    random.mockReturnValue(0.6);
    app.startRound('learn');
    const replacement = app.round.value!.shared!.current;
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
    const first = app.round.value!;
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
});
