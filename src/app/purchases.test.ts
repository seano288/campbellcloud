import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRESH_EXPECTED, STORAGE_KEY } from '../../tools/baseline/saves';
import type { Save } from '../save/migrate';
import { moneySave, type MoneyState } from './save';

describe('live Garage purchase coordination', () => {
  let values: Map<string, string>;
  const write = vi.fn<(key: string, text: string) => void>();

  beforeEach(() => {
    vi.resetModules();
    values = new Map();
    write.mockImplementation((key, text) => { values.set(key, text); });
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: write });
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  async function launch(seed: Save) {
    values.set(STORAGE_KEY, JSON.stringify(seed));
    const store = await import('../game/store');
    const actions = await import('./garage');
    await store.loadGame();
    return { ...store, ...actions };
  }

  it('routes live Legendary payment through one commit and leaves owned Legendary fitting free', async () => {
    const initial: Save = {
      ...FRESH_EXPECTED, body: 'pickup', bolts: 16, unlocked: ['tires:3'], goal: 'paint:2',
      modes: { ...FRESH_EXPECTED.modes, pay: { ...FRESH_EXPECTED.modes.pay, level: 2 } },
      currentStreak: 7, bestStreak: 7,
    };
    const app = await launch(initial);
    expect(app.tapMod('tires', 4)).toEqual({ kind: 'checkout' });
    const opened = app.legendaryCheckout.open('tires:4');
    if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
    const publications: MoneyState[] = [];
    const unsubscribe = app.player.state.subscribe(state => publications.push(state));
    publications.length = 0;
    const result = opened.checkout.pay(110, 2);
    if (result.kind !== 'accepted') throw new Error('Expected committed Legendary');
    const expected: Save = {
      ...initial, unlocked: ['tires:3', 'tires:4'],
      fitted: { ...initial.fitted, pickup: { ...initial.fitted.pickup, tires: 4 } },
    };
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    expect(opened.checkout.status).toBe('completed');
    expect(await result.saved).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    for (const rung of [0, 4] as const) {
      const free = app.tapMod('tires', rung);
      if (free.kind !== 'fitted') throw new Error('Expected free fit');
      expect(await free.saved).toBe(true);
      expect(app.game.value).toEqual({ ...expected, fitted: { ...expected.fitted, pickup: { ...expected.fitted.pickup, tires: rung } } });
    }
    write.mockClear();
    expect(opened.checkout.pay(110, 2).kind).toBe('rejected');
    expect(app.legendaryCheckout.open('tires:4')).toEqual({ kind: 'rejected', reason: 'already-owned' });
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('rejects direct purchases of owned items without refitting, switching or clearing another Goal', async () => {
    const initial: Save = {
      ...FRESH_EXPECTED, body: 'pickup', bolts: 60, goal: 'horn:3',
      unlocked: ['tires:2'], colours: ['teal'], ownedBodies: ['pickup', 'bigfoot', 'dragster', 'schoolbus'],
    };
    const app = await launch(initial);
    const before = app.player.state.value;
    const publications = vi.fn();
    const unsubscribe = app.player.state.subscribe(publications);
    publications.mockClear();
    for (const item of ['tires:2', 'body:schoolbus', 'colour:teal'] as const) {
      expect(app.buyWithBolts(item)).toEqual({ kind: 'rejected', reason: 'rejected' });
    }
    expect(app.player.state.value).toBe(before);
    expect(app.game.value).toEqual(initial);
    await Promise.resolve();
    expect(publications).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(initial);
    unsubscribe();
  });

  it('keeps owned fits, Body switches, defaults and Door Number edits free and app-coordinated', async () => {
    const initial: Save = {
      ...FRESH_EXPECTED, body: 'pickup', bolts: 0, goal: 'horn:3',
      unlocked: ['tires:2'], colours: ['teal'], ownedBodies: ['pickup', 'bigfoot', 'dragster', 'schoolbus'],
    };
    const app = await launch(initial);
    const publications: MoneyState[] = [];
    const unsubscribe = app.player.state.subscribe(state => publications.push(state));
    publications.length = 0;
    const results = [
      app.tapMod('tires', 2), app.tapColour('teal'), app.tapBody('schoolbus'),
      app.tapMod('tires', 0), app.tapColour('red'), app.setDoorNumber(64), app.tapBody('pickup'),
    ];
    for (const result of results) {
      if (result.kind === 'rejected' || result.kind === 'checkout' || result.kind === 'waiting') throw new Error('Expected free action');
      expect(await result.saved).toBe(true);
    }
    expect(publications).toHaveLength(7);
    for (const state of publications) {
      expect(state.currency.balance).toBe(0);
      expect(state.garage).toMatchObject({ unlocked: ['tires:2'], colours: ['teal'], goal: 'horn:3' });
    }
    const expected: Save = {
      ...initial,
      fitted: {
        ...initial.fitted,
        pickup: { ...initial.fitted.pickup, tires: 2, colour: 'teal' },
        schoolbus: { ...initial.fitted.schoolbus, doorNumber: 64 },
      },
    };
    expect(app.game.value).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(7);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    unsubscribe();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(expected);
  });

  it('rechecks stale displayed affordability and rejects a direct unaffordable or cash purchase without writing', async () => {
    const initial: Save = { ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2' };
    const app = await launch(initial);
    expect(app.canAfford('tires', 2)).toBe(true);
    const colour = app.tapColour('teal');
    if (colour.kind !== 'unlocked') throw new Error('Expected Colour purchase');
    await colour.saved;
    write.mockClear();
    const before = app.player.state.value;
    const publications = vi.fn();
    const unsubscribe = app.player.state.subscribe(publications);
    publications.mockClear();
    expect(app.buyWithBolts('tires:2').kind).toBe('rejected');
    expect(app.buyWithBolts('tires:4').kind).toBe('rejected');
    expect(app.player.state.value).toBe(before);
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();
    expect(publications).not.toHaveBeenCalled();
    expect(app.tapMod('tires', 2).kind).toBe('goal');
    expect(app.game.value).toMatchObject({ bolts: 13, unlocked: [], goal: 'tires:2', colours: ['teal'] });
    expect(app.game.value.fitted.pickup.tires).toBe(0);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(app.game.value);
    unsubscribe();
  });

  it('retains the whole accepted purchase when browser storage throws and recovers on a later free action', async () => {
    const initial: Save = { ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2' };
    const app = await launch(initial);
    write.mockImplementationOnce(() => { throw new Error('Storage full'); });
    const result = app.tapMod('tires', 2);
    if (result.kind !== 'unlocked') throw new Error('Expected committed Mod purchase');
    expect(await result.saved).toBe(false);
    const purchased: Save = {
      ...initial, bolts: 1, unlocked: ['tires:2'], goal: null,
      fitted: { ...initial.fitted, pickup: { ...initial.fitted.pickup, tires: 2 } },
    };
    expect(app.game.value).toEqual(purchased);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(initial);
    expect(app.buyWithBolts('tires:2').kind).toBe('rejected');
    vi.resetModules();
    const beforeRecovery = await import('../game/store');
    await beforeRecovery.loadGame();
    expect(beforeRecovery.game.value).toEqual(initial);
    const recovery = app.setDoorNumber(64);
    if (recovery.kind !== 'accepted') throw new Error('Expected free Door Number edit');
    expect(await recovery.saved).toBe(true);
    const expected: Save = { ...purchased, fitted: { ...purchased.fitted, pickup: { ...purchased.fitted.pickup, doorNumber: 64 } } };
    expect(app.game.value).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(2);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    vi.resetModules();
    const recovered = await import('../game/store');
    await recovered.loadGame();
    expect(recovered.game.value).toEqual(expected);
  });

  it('returns the purchase snapshot even if a subscriber immediately refits, preserving save order', async () => {
    const app = await launch({ ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2' });
    const unsubscribe = app.player.state.subscribe(state => {
      if (state.garage.fitted.pickup.tires === 2) app.tapMod('tires', 0);
    });
    const result = app.tapMod('tires', 2);
    if (result.kind !== 'unlocked') throw new Error('Expected committed Mod purchase');
    expect(app.currentFit(result.state).tires).toBe(2);
    expect(app.currentFit().tires).toBe(0);
    expect(app.game.value).toMatchObject({ bolts: 1, unlocked: ['tires:2'], goal: null });
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    expect(write.mock.calls.map(([, text]) => JSON.parse(text).fitted.pickup.tires)).toEqual([2, 0]);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(app.game.value);
    unsubscribe();
  });

  it('does not report successful free actions before load or after invalid edits', async () => {
    const store = await import('../game/store');
    const actions = await import('./garage');
    expect(actions.tapMod('tires', 0).kind).toBe('rejected');
    expect(actions.tapColour('red').kind).toBe('rejected');
    expect(actions.tapBody('pickup').kind).toBe('rejected');
    expect(actions.buyWithBolts('tires:2').kind).toBe('rejected');
    values.set(STORAGE_KEY, JSON.stringify({ ...FRESH_EXPECTED, body: 'pickup' }));
    await store.loadGame();
    const before = store.player.state.value;
    expect(actions.setDoorNumber(100).kind).toBe('rejected');
    expect(actions.chooseBody('jeep').kind).toBe('rejected');
    expect(store.player.state.value).toBe(before);
    expect(write).not.toHaveBeenCalled();
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 17, 'throws'])('discards the entire purchase when its proposed cost is %s', async cost => {
    const { createGaragePurchases } = await import('./purchases');
    const { createStore } = await import('../save/store');
    const { proposePurchase } = await import('../garage/purchases');
    const initial: Save = { ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2' };
    values.set(STORAGE_KEY, JSON.stringify(initial));
    const store = createStore({
      key: STORAGE_KEY, adapter: moneySave,
      backing: { read: key => values.get(key) ?? null, write },
    });
    const buy = createGaragePurchases(store, {
      proposePurchase(state, item, balance) {
        const proposal = proposePurchase(state, item, balance);
        if (typeof cost === 'string') throw new Error('Purchase calculation failed');
        return proposal.kind === 'ready' ? { ...proposal, cost } : proposal;
      },
    });
    await store.load();
    const before = store.state.value;
    const publications = vi.fn();
    const unsubscribe = store.state.subscribe(publications);
    publications.mockClear();
    expect(buy('tires:2')).toEqual({ kind: 'rejected', reason: cost === 'throws' ? 'calculation-failed' : 'rejected' });
    expect(store.state.value).toBe(before);
    expect(moneySave.encode(store.state.value)).toEqual(initial);
    await Promise.resolve();
    expect(publications).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(initial);
    unsubscribe();
  });

  it('returns only the committed Body purchase for presentation, including its saved fit and cleared Goal', async () => {
    const initial: Save = {
      ...FRESH_EXPECTED, body: 'pickup', bolts: 35, goal: 'body:schoolbus',
      fitted: {
        ...FRESH_EXPECTED.fitted,
        pickup: { ...FRESH_EXPECTED.fitted.pickup, doorNumber: 42 },
        schoolbus: { ...FRESH_EXPECTED.fitted.schoolbus, doorNumber: 17 },
      },
    };
    const app = await launch(initial);
    const publications: MoneyState[] = [];
    const unsubscribe = app.player.state.subscribe(state => publications.push(state));
    publications.length = 0;
    const result = app.tapBody('schoolbus');
    const expected: Save = {
      ...initial, bolts: 5, body: 'schoolbus', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'schoolbus'], goal: null,
    };
    expect(result).toMatchObject({ kind: 'bought' });
    if (result.kind !== 'bought') throw new Error('Expected committed Body purchase');
    expect(moneySave.encode(result.state)).toEqual(expected);
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    expect(await result.saved).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    unsubscribe();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(expected);
  });

  it('buys a selected Colour with its Plain-Paint fallback and preserves every other Body in one commit', async () => {
    const initial: Save = {
      ...FRESH_EXPECTED, body: 'pickup', bolts: 5, unlocked: ['paint:3'], goal: 'colour:teal',
      fitted: {
        ...FRESH_EXPECTED.fitted,
        pickup: { ...FRESH_EXPECTED.fitted.pickup, paint: 3, doorNumber: 42 },
        bigfoot: { ...FRESH_EXPECTED.fitted.bigfoot, doorNumber: 17 },
      },
    };
    const app = await launch(initial);
    const publications: MoneyState[] = [];
    const unsubscribe = app.player.state.subscribe(state => publications.push(state));
    publications.length = 0;
    app.tapColour('teal');
    const expected: Save = {
      ...initial, bolts: 2, colours: ['teal'], goal: null,
      fitted: { ...initial.fitted, pickup: { ...initial.fitted.pickup, colour: 'teal', paint: 0 } },
    };
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    unsubscribe();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(expected);
  });

  it('commits a selected 15-Bolt Mod from 16 Bolts in one publication and one reloadable snapshot', async () => {
    const initial: Save = { ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2' };
    const app = await launch(initial);
    const publications: MoneyState[] = [];
    const unsubscribe = app.player.state.subscribe(state => publications.push(state));
    publications.length = 0;
    app.tapMod('tires', 2);
    const expected: Save = {
      ...initial, bolts: 1, unlocked: ['tires:2'], goal: null,
      fitted: { ...initial.fitted, pickup: { ...initial.fitted.pickup, tires: 2 } },
    };
    expect(publications.map(moneySave.encode)).toEqual([expected]);
    expect(app.game.value).toEqual(expected);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(expected);
    unsubscribe();
    vi.resetModules();
    const restarted = await import('../game/store');
    await restarted.loadGame();
    expect(restarted.game.value).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(1);
  });
});
