import { describe, expect, it, vi } from 'vitest';
import { FRESH_EXPECTED, PROGRESSED_EXPECTED, SAVE_CASES, STORAGE_KEY, TODAY, UNSAFE_BALANCE_CASE } from '../../tools/baseline/saves';
import { moneySave, type MoneyState } from '../app/save';
import { chooseBody, setDoorNumber } from '../garage/state';
import { credit, readCurrency } from '../currency/currency';
import { createStore, type BackingStore, type Commit } from './store';

const adapter = { ...moneySave, decode: (raw: unknown) => moneySave.decode(raw, TODAY) };

function fakeStore(raw: unknown = PROGRESSED_EXPECTED) {
  const values = new Map([[STORAGE_KEY, JSON.stringify(raw)]]);
  const read = vi.fn((key: string) => values.get(key) ?? null);
  const write = vi.fn((key: string, value: string) => { values.set(key, value); });
  return { values, read, write };
}

const compose = (backing: BackingStore) => createStore({ key: STORAGE_KEY, adapter, backing });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('aggregate commits with persistence', () => {
  it('isolates two explicit app identities on one store, including a fresh second app beside a progressed money save', async () => {
    const backing = fakeStore();
    backing.values.set('mtm-wins', 'old wins');
    backing.values.set('mtm-trophies', 'old trophies');
    const money = compose(backing);
    const otherKey = 'test-learning-save';
    const fresh = () => ({ currency: readCurrency(0), solved: 0 });
    const composeOther = () => createStore({
      key: otherKey, backing,
      adapter: {
        fresh,
        decode(raw: unknown) {
          if (typeof raw !== 'object' || raw === null) return fresh();
          return {
            currency: readCurrency('balance' in raw ? raw.balance : 0),
            solved: 'solved' in raw && typeof raw.solved === 'number' && Number.isSafeInteger(raw.solved) && raw.solved >= 0 ? raw.solved : 0,
          };
        },
        encode: (state: ReturnType<typeof fresh>) => ({ balance: state.currency.balance, solved: state.solved }),
      },
    });
    const other = composeOther();
    await Promise.all([money.load(), other.load()]);
    expect(other.state.value).toEqual({ currency: { balance: 0 }, solved: 0 });
    expect(moneySave.encode(money.state.value)).toEqual(PROGRESSED_EXPECTED);
    expect(backing.write).not.toHaveBeenCalled();
    const otherAction = other.commit(state => {
      const earned = credit(state.currency, 3);
      return earned.kind === 'accepted' ? { currency: earned.state, solved: state.solved + 1 } : null;
    });
    const moneyAction = money.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    if (otherAction.kind !== 'accepted' || moneyAction.kind !== 'accepted') throw new Error('Expected accepted actions');
    await Promise.all([otherAction.saved, moneyAction.saved]);
    expect(backing.write.mock.calls.map(([key]) => key).sort()).toEqual([STORAGE_KEY, otherKey].sort());
    const moneyRestarted = compose(backing), otherRestarted = composeOther();
    await Promise.all([moneyRestarted.load(), otherRestarted.load()]);
    expect(moneySave.encode(moneyRestarted.state.value)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    expect(otherRestarted.state.value).toEqual({ currency: { balance: 3 }, solved: 1 });
    expect(backing.read.mock.calls.map(([key]) => key).sort()).toEqual([STORAGE_KEY, STORAGE_KEY, otherKey, otherKey].sort());
    expect(backing.values.get('mtm-wins')).toBe('old wins');
    expect(backing.values.get('mtm-trophies')).toBe('old trophies');
  });

  it.each([...SAVE_CASES, UNSAFE_BALANCE_CASE])('$id loads without writing and persists the full expected state on a later free selection', async ({ raw, expected }) => {
    const backing = fakeStore(raw);
    const original = backing.values.get(STORAGE_KEY);
    const app = compose(backing);
    await app.load();
    expect(moneySave.encode(app.state.value)).toEqual(expected);
    expect(backing.values.get(STORAGE_KEY)).toBe(original);
    expect(backing.write).not.toHaveBeenCalled();
    const result = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    if (result.kind !== 'accepted') throw new Error('Expected accepted selection');
    await result.saved;
    const saved = { ...expected, body: 'bigfoot' };
    expect(JSON.parse(backing.values.get(STORAGE_KEY)!)).toEqual(saved);
    const restarted = compose(backing);
    await restarted.load();
    expect(moneySave.encode(restarted.state.value)).toEqual(saved);
  });

  it.each([null, '{bad JSON', 'null', '[]', '"not a save"', 'blocked', 'async-blocked'])('loads fresh memory without touching unreadable storage %s', async text => {
    const backing = fakeStore();
    if (text === null) backing.values.delete(STORAGE_KEY);
    else backing.values.set(STORAGE_KEY, text);
    const original = new Map(backing.values);
    const read = () => {
      if (text === 'blocked') throw new Error('Read blocked');
      if (text === 'async-blocked') return Promise.reject(new Error('Read blocked'));
      return backing.read(STORAGE_KEY);
    };
    const app = compose({ ...backing, read });
    await app.load();
    expect(app.ready.value).toBe(true);
    expect(moneySave.encode(app.state.value)).toEqual(FRESH_EXPECTED);
    expect(backing.write).not.toHaveBeenCalled();
    expect(backing.values).toEqual(original);
  });

  it.each(['encoder', 'json-cycle', 'json-bigint', 'json-undefined', 'write-throw', 'write-reject'])('retains committed memory after %s failure and a later action saves all latest state', async failure => {
    const backing = fakeStore();
    const encode = vi.fn<(state: MoneyState) => unknown>(moneySave.encode);
    const write = vi.fn<(key: string, value: string) => void | Promise<void>>(backing.write);
    if (failure === 'encoder') encode.mockImplementationOnce(() => { throw new Error('Cannot encode'); });
    if (failure === 'json-cycle') {
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;
      encode.mockReturnValueOnce(cyclic);
    }
    if (failure === 'json-bigint') encode.mockReturnValueOnce({ value: 1n });
    if (failure === 'json-undefined') encode.mockReturnValueOnce(undefined);
    if (failure === 'write-throw') write.mockImplementationOnce(() => { throw new Error('Write blocked'); });
    if (failure === 'write-reject') write.mockRejectedValueOnce(new Error('Write blocked'));
    const app = createStore({ key: STORAGE_KEY, adapter: { ...adapter, encode }, backing: { ...backing, write } });
    await app.load();
    const first = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    if (first.kind !== 'accepted') throw new Error('Expected accepted selection');
    expect(await first.saved).toBe(false);
    expect(moneySave.encode(app.state.value)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    const restartedBeforeRecovery = compose(backing);
    await restartedBeforeRecovery.load();
    expect(moneySave.encode(restartedBeforeRecovery.state.value)).toEqual(PROGRESSED_EXPECTED);
    const second = app.commit(state => ({ ...state, garage: setDoorNumber(state.garage, 64) }));
    if (second.kind !== 'accepted') throw new Error('Expected accepted selection');
    expect(await second.saved).toBe(true);
    const expected = { ...PROGRESSED_EXPECTED, body: 'bigfoot', fitted: { ...PROGRESSED_EXPECTED.fitted, bigfoot: { ...PROGRESSED_EXPECTED.fitted.bigfoot, doorNumber: 64 } } };
    expect(JSON.parse(backing.values.get(STORAGE_KEY)!)).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(failure.startsWith('write') ? 2 : 1);
    const restarted = compose(backing);
    await restarted.load();
    expect(moneySave.encode(restarted.state.value)).toEqual(expected);
  });

  it('orders complete snapshots even when an earlier asynchronous write is delayed', async () => {
    const backing = fakeStore();
    const firstWrite = deferred<void>();
    const started = deferred<void>();
    const write = vi.fn(async (key: string, value: string) => {
      if (write.mock.calls.length === 1) { started.resolve(); await firstWrite.promise; }
      backing.values.set(key, value);
    });
    const app = compose({ ...backing, write });
    await app.load();
    const first = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    const second = app.commit(state => ({ ...state, garage: setDoorNumber(state.garage, 64) }));
    if (first.kind !== 'accepted' || second.kind !== 'accepted') throw new Error('Expected accepted selections');
    await started.promise;
    const firstExpected = { ...PROGRESSED_EXPECTED, body: 'bigfoot' };
    const lastExpected = { ...firstExpected, fitted: { ...PROGRESSED_EXPECTED.fitted, bigfoot: { ...PROGRESSED_EXPECTED.fitted.bigfoot, doorNumber: 64 } } };
    expect(moneySave.encode(app.state.value)).toEqual(lastExpected);
    expect(write).toHaveBeenCalledTimes(1);
    firstWrite.resolve();
    expect(await first.saved).toBe(true);
    expect(await second.saved).toBe(true);
    expect(write.mock.calls.map(([key, text]) => [key, JSON.parse(text)])).toEqual([[STORAGE_KEY, firstExpected], [STORAGE_KEY, lastExpected]]);
    const restarted = compose(backing);
    await restarted.load();
    expect(moneySave.encode(restarted.state.value)).toEqual(lastExpected);
  });

  it('keeps publication order when a subscriber immediately makes another free selection', async () => {
    const backing = fakeStore();
    const app = compose(backing);
    await app.load();
    let second: Commit<MoneyState> | undefined;
    const unsubscribe = app.state.subscribe(state => {
      if (state.garage.body === 'bigfoot' && state.garage.fitted.bigfoot.doorNumber === 7) {
        second = app.commit(current => ({ ...current, garage: setDoorNumber(current.garage, 64) }));
      }
    });
    const first = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    if (first.kind !== 'accepted' || second?.kind !== 'accepted') throw new Error('Expected accepted selections');
    await Promise.all([first.saved, second.saved]);
    expect(backing.write.mock.calls.map(([, text]) => JSON.parse(text).fitted.bigfoot.doorNumber)).toEqual([7, 64]);
    expect(JSON.parse(backing.values.get(STORAGE_KEY)!)).toEqual(moneySave.encode(app.state.value));
    unsubscribe();
  });

  it('publishes and saves nothing for rejected or failed calculations', async () => {
    const backing = fakeStore();
    const app = compose(backing);
    await app.load();
    const before = app.state.value;
    const published = vi.fn();
    const unsubscribe = app.state.subscribe(published);
    published.mockClear();
    expect(app.commit(() => null)).toEqual({ kind: 'rejected', reason: 'rejected' });
    expect(app.commit(state => state)).toEqual({ kind: 'rejected', reason: 'rejected' });
    expect(app.commit(state => {
      const garage = chooseBody(state.garage, 'bigfoot');
      return { ...state, garage: chooseBody(garage, 'firetruck') };
    })).toEqual({ kind: 'rejected', reason: 'calculation-failed' });
    expect(app.state.value).toBe(before);
    expect(published).not.toHaveBeenCalled();
    expect(backing.write).not.toHaveBeenCalled();
    expect(JSON.parse(backing.values.get(STORAGE_KEY)!)).toEqual(PROGRESSED_EXPECTED);
    unsubscribe();
  });

  it('cannot restart initial loading from a publication after a synchronous blocked read', async () => {
    const backing = fakeStore();
    backing.read.mockImplementationOnce(() => { throw new Error('Read blocked'); });
    const app = compose(backing);
    let loaded = false;
    let repeatedLoad: Promise<void> | undefined;
    let selection: Commit<MoneyState> | undefined;
    const unsubscribe = app.state.subscribe(() => {
      if (!app.ready.value || loaded) return;
      loaded = true;
      selection = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
      repeatedLoad = app.load();
    });
    await app.load();
    await repeatedLoad;
    if (selection?.kind !== 'accepted') throw new Error('Expected accepted selection');
    await selection.saved;
    expect(backing.read).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(moneySave.encode(app.state.value)).toEqual({ ...FRESH_EXPECTED, body: 'bigfoot' });
    unsubscribe();
  });

  it('gates actions until one complete initial load and never reloads over later actions', async () => {
    const pending = deferred<string | null>();
    const backing = { ...fakeStore(), read: vi.fn(() => pending.promise) };
    const app = compose(backing);
    const propose = vi.fn(state => state);
    expect(app.ready.value).toBe(false);
    const loading = app.load();
    expect(app.load()).toBe(loading);
    expect(app.commit(propose)).toEqual({ kind: 'rejected', reason: 'not-ready' });
    expect(propose).not.toHaveBeenCalled();
    const publications: unknown[] = [];
    const unsubscribe = app.state.subscribe(state => { if (app.ready.value) publications.push(moneySave.encode(state)); });
    pending.resolve(JSON.stringify(PROGRESSED_EXPECTED));
    await loading;
    expect(publications).toEqual([PROGRESSED_EXPECTED]);
    expect(backing.write).not.toHaveBeenCalled();
    const result = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    if (result.kind !== 'accepted') throw new Error('Expected accepted selection');
    await result.saved;
    await app.load();
    expect(backing.read).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(moneySave.encode(app.state.value)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    unsubscribe();
  });

  it('publishes a free Body selection once and saves one complete reloadable snapshot without spending Bolts', async () => {
    const backing = fakeStore();
    const app = compose(backing);
    await app.load();
    const published = vi.fn<(state: MoneyState) => void>();
    const unsubscribe = app.state.subscribe(published);
    published.mockClear();
    const result = app.commit(state => ({ ...state, garage: chooseBody(state.garage, 'bigfoot') }));
    expect(result.kind).toBe('accepted');
    expect(published).toHaveBeenCalledTimes(1);
    expect(moneySave.encode(published.mock.calls[0]![0])).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    if (result.kind !== 'accepted') throw new Error('Expected accepted selection');
    expect(await result.saved).toBe(true);
    expect(backing.write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(backing.values.get(STORAGE_KEY)!)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    const restarted = compose(backing);
    await restarted.load();
    expect(moneySave.encode(restarted.state.value)).toEqual({ ...PROGRESSED_EXPECTED, body: 'bigfoot' });
    unsubscribe();
  });
});
