import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROGRESSED_EXPECTED, STORAGE_KEY } from '../../tools/baseline/saves';

describe('live money save composition', () => {
  let values: Map<string, string>;
  const read = vi.fn<(key: string) => string | null>();
  const write = vi.fn<(key: string, text: string) => void>();

  beforeEach(() => {
    vi.resetModules();
    values = new Map([[STORAGE_KEY, JSON.stringify(PROGRESSED_EXPECTED)]]);
    read.mockImplementation(key => values.get(key) ?? null);
    write.mockImplementation((key, text) => { values.set(key, text); });
    vi.stubGlobal('localStorage', { getItem: read, setItem: write });
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.resolve(false) } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('preserves free fits, Colours and Door Numbers per Body through a real app restart', async () => {
    const { game, player, loadGame } = await import('../game/store');
    const { chooseBody, tapMod, tapColour, setDoorNumber } = await import('./garage');
    await loadGame();
    const published = vi.fn();
    const unsubscribe = player.state.subscribe(published);
    published.mockClear();
    chooseBody('bigfoot');
    expect(tapMod('tires', 4).kind).toBe('fitted');
    expect(tapColour('teal').kind).toBe('fitted');
    setDoorNumber(64);
    chooseBody('jeep');
    expect(game.value.fitted.jeep).toEqual(PROGRESSED_EXPECTED.fitted.jeep);
    chooseBody('bigfoot');
    const expected = {
      ...PROGRESSED_EXPECTED, body: 'bigfoot',
      fitted: { ...PROGRESSED_EXPECTED.fitted, bigfoot: { ...PROGRESSED_EXPECTED.fitted.bigfoot, tires: 4, paint: 0, colour: 'teal', doorNumber: 64 } },
    };
    expect(game.value).toEqual(expected);
    expect(published).toHaveBeenCalledTimes(6);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(6));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    unsubscribe();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(6);
  });

  it('keeps compatibility updates on the same aggregate and writes each update only once', async () => {
    const { game, player, loadGame, update } = await import('../game/store');
    await loadGame();
    const accepted = update(save => ({ ...save, bolts: 47, lastMode: 'count' }));
    if (accepted.kind !== 'accepted') throw new Error('Expected accepted update');
    expect(await accepted.saved).toBe(true);
    expect(player.state.value.currency.balance).toBe(47);
    expect(player.state.value.learning.lastMode).toBe('count');
    expect(game.value).toEqual({ ...PROGRESSED_EXPECTED, bolts: 47, lastMode: 'count' });
    expect(write).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, expect.any(String));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(game.value);
  });

  it.each(['denied', 'throws', 'rejects'])('loads progress even when persistent-storage permission %s', async failure => {
    const persist = vi.fn(() => {
      if (failure === 'throws') throw new Error('Permission blocked');
      return failure === 'rejects' ? Promise.reject(new Error('Permission blocked')) : Promise.resolve(false);
    });
    vi.stubGlobal('navigator', { storage: { persist } });
    const { game, loadGame } = await import('../game/store');
    await loadGame();
    await loadGame();
    expect(game.value).toEqual(PROGRESSED_EXPECTED);
    expect(write).not.toHaveBeenCalled();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('routes a live free Body selection through one module aggregate publication and one saved snapshot', async () => {
    const { game, player, loadGame } = await import('../game/store');
    const { chooseBody } = await import('./garage');
    await loadGame();
    expect(game.value).toEqual(PROGRESSED_EXPECTED);
    expect(write).not.toHaveBeenCalled();
    const published = vi.fn();
    const unsubscribe = player.state.subscribe(published);
    published.mockClear();
    chooseBody('bigfoot');
    expect(player.state.value.garage.body).toBe('bigfoot');
    expect(player.state.value.currency.balance).toBe(46);
    expect(published).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    await loadGame();
    expect(read).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(game.value.body).toBe('bigfoot');
    unsubscribe();
  });
});
