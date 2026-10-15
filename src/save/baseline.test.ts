import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRESH_EXPECTED, SAVE_CASES, STORAGE_KEY, TODAY } from '../../tools/baseline/saves';
import { migrate } from './migrate';
import { browserStorage, createStore } from './storage';
import { moneySave } from '../app/save';

const compose = () => createStore({ key: STORAGE_KEY, adapter: { ...moneySave, decode: (raw: unknown) => moneySave.decode(raw, TODAY) }, backing: browserStorage });

describe('independent synthetic save baseline', () => {
  it.each(SAVE_CASES)('$id preserves the specified player state', ({ raw, expected }) => {
    const input: unknown = JSON.parse(JSON.stringify(raw));
    expect(migrate(input, TODAY)).toEqual(expected);
    expect(input).toEqual(raw);
  });
});

describe('synthetic saves through storage', () => {
  let values: Map<string, string>;
  const getItem = vi.fn<(key: string) => string | null>();
  const setItem = vi.fn<(key: string, value: string) => void>();

  beforeEach(() => {
    values = new Map([['mtm-wins', 'old game'], ['other-app', 'unrelated']]);
    getItem.mockImplementation(key => values.get(key) ?? null);
    setItem.mockImplementation((key, value) => { values.set(key, value); });
    vi.stubGlobal('localStorage', { getItem, setItem });
    vi.stubGlobal('navigator', { storage: { persist: () => Promise.resolve(false) } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 14, 12));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it.each(SAVE_CASES)('$id loads without writing, then saves and reloads the expected version-4 state', async ({ raw, expected }) => {
    const original = JSON.stringify(raw);
    values.set(STORAGE_KEY, original);
    const store = compose();
    await store.load();
    const loaded = moneySave.encode(store.state.value);
    expect(loaded).toEqual(expected);
    expect(setItem).not.toHaveBeenCalled();
    expect(values.get(STORAGE_KEY)).toBe(original);
    expect(getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    const committed = store.commit(state => ({ ...state }));
    if (committed.kind !== 'accepted') throw new Error('Expected saved snapshot');
    expect(await committed.saved).toBe(true);
    expect(setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, expect.any(String));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    const reloaded = compose();
    await reloaded.load();
    expect(moneySave.encode(reloaded.state.value)).toEqual(expected);
    expect(values.get('mtm-wins')).toBe('old game');
    expect(values.get('other-app')).toBe('unrelated');
  });

  it.each([null, '{not JSON', 'null', '[]', '"not a save"'])('uses fresh memory without rewriting unreadable input %s', async text => {
    if (text !== null) values.set(STORAGE_KEY, text);
    const store = compose();
    await store.load();
    expect(moneySave.encode(store.state.value)).toEqual(FRESH_EXPECTED);
    expect(setItem).not.toHaveBeenCalled();
    expect(values.get(STORAGE_KEY) ?? null).toBe(text);
  });

  it('uses fresh memory without writing when storage reads are blocked', async () => {
    getItem.mockImplementation(() => { throw new Error('synthetic blocked read'); });
    const store = compose();
    await store.load();
    expect(moneySave.encode(store.state.value)).toEqual(FRESH_EXPECTED);
    expect(setItem).not.toHaveBeenCalled();
  });
});
