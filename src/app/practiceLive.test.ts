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
  it.each([899, 900])('keeps solved progress but only commits completion after the final delay at %i ms', async elapsed => {
    const app = await launch();
    app.startRound('learn');
    for (let index = 0; index < 5; index++) {
      const r = app.round.value!;
      app.correct(r.roundId, r.key);
      app.correct(r.roundId, r.key);
      app.helped(r.roundId, r.key);
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
    const app = await launch();
    app.startRound('learn');
    const first = app.round.value!;
    let release = () => {};
    const explanation = new Promise<void>(resolve => { release = resolve; });
    app.miss(first.roundId, first.key, () => explanation);
    app.leaveRound();
    app.startRound('learn');
    const replacement = app.round.value!;
    app.miss(replacement.roundId, replacement.key, () => new Promise(() => {}));
    const before = app.player.state.value;
    release();
    await vi.advanceTimersByTimeAsync(1500);
    expect(app.round.value?.thinking).toBe(true);
    app.correct(replacement.roundId, replacement.key);
    expect(app.player.state.value).toBe(before);
    expect(snapshot().modes.learn.window).toEqual([]);
    expect(snapshot()).toMatchObject({ currentStreak: 0, bolts: 0, roundsFinished: 0 });
  });

  it('ignores solved and help callbacks from a replaced Round', async () => {
    const app = await launch();
    app.startRound('learn');
    const first = app.round.value!;
    const oldCorrect = () => app.correct(first.roundId, first.key);
    const oldHelp = () => app.helped(first.roundId, first.key);
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
