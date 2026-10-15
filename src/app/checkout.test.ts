import { expect, it, vi } from 'vitest';
import { FRESH_EXPECTED } from '../../tools/baseline/saves';
import { proposeLegendary, requestLegendary } from '../garage/purchases';
import { chooseBody, fitMod, setDoorNumber } from '../garage/state';
import type { Save } from '../save/migrate';
import { createStore } from '../save/store';
import { createLegendaryCheckout } from './checkout';
import { MONEY_SAVE_KEY, moneySave, type MoneyState } from './save';

const eligible: Save = {
  ...FRESH_EXPECTED, body: 'pickup', bolts: 16, unlocked: ['tires:3', 'horn:3'], goal: 'paint:2',
  modes: { ...FRESH_EXPECTED.modes, pay: { ...FRESH_EXPECTED.modes.pay, level: 2, window: ['clean', 'helped'] } },
  currentStreak: 7, bestStreak: 12, roundsFinished: 24, daysPlayed: 4, lastDay: '2026-10-13',
  trophies: { 'streak:5': '2026-09-01', 'rounds:10': '2026-09-02' },
};

async function checkoutApp(initial = eligible, garage?: Parameters<typeof createLegendaryCheckout>[1], adapter = moneySave) {
  let stored = JSON.stringify(initial);
  const write = vi.fn((_key: string, text: string) => { stored = text; });
  const backing = { read: () => stored, write };
  const store = createStore({ key: MONEY_SAVE_KEY, adapter, backing });
  await store.load();
  return { store, backing, write, snapshot: (): Save => JSON.parse(stored), checkout: createLegendaryCheckout(store, garage) };
}

function observeCommits(app: Awaited<ReturnType<typeof checkoutApp>>) {
  const before = app.store.state.value, saved = app.snapshot();
  const publications = vi.fn();
  const unsubscribe = app.store.state.subscribe(publications);
  publications.mockClear();
  return async () => {
    try {
      expect(app.store.state.value).toBe(before);
      expect(app.snapshot()).toEqual(saved);
      await Promise.resolve();
      expect(publications).not.toHaveBeenCalled();
      expect(app.write).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  };
}

it('commits eligible Tires at the second context with ownership, fit and terminal checkout in one saved publication', async () => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const checkout = opened.checkout;
  expect(checkout).toMatchObject({ item: 'tires:4', context: 2, cents: 110, status: 'active' });
  expect(app.write).not.toHaveBeenCalled();
  const before = app.store.state.value;
  const publications: { state: MoneyState; status: string }[] = [];
  const unsubscribe = app.store.state.subscribe(state => publications.push({ state, status: checkout.status }));
  publications.length = 0;
  const result = checkout.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected exact payment');
  const expected: Save = {
    ...eligible, unlocked: ['tires:3', 'horn:3', 'tires:4'],
    fitted: { ...eligible.fitted, pickup: { ...eligible.fitted.pickup, tires: 4 } },
  };
  expect(publications.map(({ state, status }) => ({ state: moneySave.encode(state), status })))
    .toEqual([{ state: expected, status: 'completed' }]);
  expect(result.state.currency).toBe(before.currency);
  expect(result.state.learning).toBe(before.learning);
  expect(result.state.trophies).toBe(before.trophies);
  expect(moneySave.encode(result.state)).toEqual(expected);
  expect(await result.saved).toBe(true);
  expect(app.write).toHaveBeenCalledTimes(1);
  expect(app.snapshot()).toEqual(expected);
  unsubscribe();
  const restarted = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: app.backing });
  await restarted.load();
  expect(moneySave.encode(restarted.state.value)).toEqual(expected);
});

it.each(['closed', 'replaced'] as const)('ignores late payments from a %s checkout without closing its replacement', async terminal => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const old = opened.checkout;
  const latePayment = old.pay;
  if (terminal === 'closed') old.close();
  const replacement = app.checkout.open('horn:4');
  if (replacement.kind !== 'ready') throw new Error('Expected replacement checkout');
  expect(old.status).toBe(terminal);
  expect(old.id).not.toBe(replacement.checkout.id);
  const assertNoCommit = observeCommits(app);
  old.close();
  expect(latePayment(110, 2).kind).toBe('rejected');
  expect(replacement.checkout.status).toBe('active');
  await assertNoCommit();
  const result = replacement.checkout.pay(290, 2);
  if (result.kind !== 'accepted') throw new Error('Expected replacement purchase');
  expect(await result.saved).toBe(true);
  expect(app.snapshot()).toEqual({
    ...eligible, unlocked: ['tires:3', 'horn:3', 'horn:4'],
    fitted: { ...eligible.fitted, pickup: { ...eligible.fitted.pickup, horn: 4 } },
  });
  expect(app.write).toHaveBeenCalledTimes(1);
});

it('does not open checkout before the complete initial load', async () => {
  const write = vi.fn();
  const store = createStore({
    key: MONEY_SAVE_KEY, adapter: { ...moneySave, fresh: () => moneySave.decode(eligible) },
    backing: { read: () => JSON.stringify(eligible), write },
  });
  const checkout = createLegendaryCheckout(store);
  expect(checkout.open('tires:4')).toEqual({ kind: 'rejected', reason: 'not-ready' });
  expect(write).not.toHaveBeenCalled();
  await store.load();
  expect(checkout.open('tires:4').kind).toBe('ready');
});

it('discards a failed purchase calculation without consuming checkout, then accepts a later exact payment', async () => {
  let fail = true;
  const app = await checkoutApp(eligible, {
    requestLegendary,
    proposeLegendary(state, item, context, cents) {
      const proposal = proposeLegendary(state, item, context, cents);
      if (fail) throw new Error('Purchase calculation failed');
      return proposal;
    },
  });
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const assertNoCommit = observeCommits(app);
  expect(opened.checkout.pay(110, 2)).toEqual({ kind: 'rejected', reason: 'calculation-failed' });
  expect(opened.checkout.status).toBe('active');
  await assertNoCommit();
  fail = false;
  const result = opened.checkout.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected calculation recovery');
  expect(await result.saved).toBe(true);
  expect(opened.checkout.status).toBe('completed');
  expect(app.snapshot()).toMatchObject({ unlocked: ['tires:3', 'horn:3', 'tires:4'], fitted: { pickup: { tires: 4 } } });
  expect(app.write).toHaveBeenCalledTimes(1);
});

it.each([
  { cents: 0, context: 2 }, { cents: 109, context: 2 }, { cents: 111, context: 2 },
  { cents: -1, context: 2 }, { cents: 110.5, context: 2 }, { cents: NaN, context: 2 },
  { cents: Infinity, context: 2 }, { cents: Number.MAX_SAFE_INTEGER + 1, context: 2 },
  { cents: 35, context: 1 }, { cents: 335, context: 3 }, { cents: 110, context: 3 },
] as const)('rejects payment $cents in context $context without publishing or consuming checkout', async ({ cents, context }) => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const assertNoCommit = observeCommits(app);
  expect(opened.checkout.pay(cents, context).kind).toBe('rejected');
  expect(opened.checkout.status).toBe('active');
  await assertNoCommit();
});

it.each(['missing-prerequisite', 'already-owned'] as const)('revalidates %s against the latest Garage instead of using entry eligibility', async change => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const changed = app.store.commit(state => ({
    ...state, garage: { ...state.garage, unlocked: change === 'missing-prerequisite' ? ['horn:3'] : ['tires:3', 'horn:3', 'tires:4'] },
  }));
  if (changed.kind !== 'accepted') throw new Error('Expected changed eligibility');
  await changed.saved;
  app.write.mockClear();
  const assertNoCommit = observeCommits(app);
  expect(opened.checkout.pay(110, 2).kind).toBe('rejected');
  expect(opened.checkout.status).toBe('active');
  await assertNoCommit();
});

it('keeps its captured price after a Level change and fits the current Body, while reopening captures fresh context', async () => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const changed = app.store.commit(state => ({
    ...state, garage: chooseBody(state.garage, 'bigfoot'),
    learning: { ...state.learning, modes: { ...state.learning.modes, pay: { ...state.learning.modes.pay, level: 3 } } },
  }));
  if (changed.kind !== 'accepted') throw new Error('Expected changed context');
  await changed.saved;
  const before = app.store.state.value;
  expect(opened.checkout).toMatchObject({ item: 'tires:4', context: 2, cents: 110 });
  expect(opened.checkout.pay(335, 3).kind).toBe('rejected');
  const result = opened.checkout.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected captured-context payment');
  expect(await result.saved).toBe(true);
  expect(app.snapshot()).toEqual({
    ...eligible, body: 'bigfoot', modes: { ...eligible.modes, pay: { ...eligible.modes.pay, level: 3 } },
    unlocked: ['tires:3', 'horn:3', 'tires:4'],
    fitted: { ...eligible.fitted, bigfoot: { ...eligible.fitted.bigfoot, tires: 4 } },
  });
  expect(result.state.learning).toBe(before.learning);
  expect(result.state.currency).toBe(before.currency);
  expect(result.state.trophies).toBe(before.trophies);
  const reopened = app.checkout.open('horn:4');
  if (reopened.kind !== 'ready') throw new Error('Expected fresh checkout');
  expect(reopened.checkout).toMatchObject({ item: 'horn:4', context: 3, cents: 880, status: 'active' });
  expect(reopened.checkout.id).not.toBe(opened.checkout.id);
});

it('consumes checkout before subscribers run and returns the purchase fit even if a subscriber refits immediately', async () => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const duplicate = vi.fn();
  const unsubscribe = app.store.state.subscribe(state => {
    if (state.garage.fitted.pickup.tires !== 4) return;
    expect(opened.checkout.status).toBe('completed');
    duplicate(opened.checkout.pay(110, 2));
    app.store.commit(current => ({ ...current, garage: fitMod(current.garage, 'tires', 0) }));
  });
  const result = opened.checkout.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected committed purchase');
  expect(duplicate).toHaveBeenCalledExactlyOnceWith({ kind: 'rejected', reason: 'rejected' });
  expect(result.state.garage.fitted.pickup.tires).toBe(4);
  expect(app.store.state.value.garage.fitted.pickup.tires).toBe(0);
  expect(await result.saved).toBe(true);
  await vi.waitFor(() => expect(app.write).toHaveBeenCalledTimes(2));
  expect(app.write.mock.calls.map(([, text]) => JSON.parse(text).fitted.pickup.tires)).toEqual([4, 0]);
  const before = app.store.state.value, saved = app.snapshot();
  app.write.mockClear();
  expect(opened.checkout.pay(110, 2).kind).toBe('rejected');
  opened.checkout.close();
  expect(opened.checkout.status).toBe('completed');
  expect(app.store.state.value).toBe(before);
  expect(app.snapshot()).toEqual(saved);
  await Promise.resolve();
  expect(app.write).not.toHaveBeenCalled();
  unsubscribe();
});

it.each(['serialization', 'write'] as const)('retains ownership, fit and consumed checkout after a failed %s, then saves current state on a later action', async failure => {
  let failSerialization = false;
  const app = await checkoutApp(eligible, undefined, {
    ...moneySave,
    encode(state) {
      if (failSerialization) throw new Error('Cannot serialize');
      return moneySave.encode(state);
    },
  });
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  if (failure === 'serialization') failSerialization = true;
  else app.write.mockImplementationOnce(() => { throw new Error('Storage full'); });
  const result = opened.checkout.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected committed purchase');
  expect(await result.saved).toBe(false);
  const purchased: Save = {
    ...eligible, unlocked: ['tires:3', 'horn:3', 'tires:4'],
    fitted: { ...eligible.fitted, pickup: { ...eligible.fitted.pickup, tires: 4 } },
  };
  expect(moneySave.encode(app.store.state.value)).toEqual(purchased);
  expect(opened.checkout.status).toBe('completed');
  expect(app.snapshot()).toEqual(eligible);
  app.write.mockClear();
  expect(opened.checkout.pay(110, 2).kind).toBe('rejected');
  await Promise.resolve();
  expect(app.write).not.toHaveBeenCalled();
  const restarted = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: app.backing });
  await restarted.load();
  expect(moneySave.encode(restarted.state.value)).toEqual(eligible);
  failSerialization = false;
  const recovery = app.store.commit(state => ({ ...state, garage: setDoorNumber(state.garage, 64) }));
  if (recovery.kind !== 'accepted') throw new Error('Expected free action');
  expect(await recovery.saved).toBe(true);
  const recovered: Save = { ...purchased, fitted: { ...purchased.fitted, pickup: { ...purchased.fitted.pickup, doorNumber: 64 } } };
  expect(app.snapshot()).toEqual(recovered);
  expect(app.write).toHaveBeenCalledTimes(1);
  const afterRecovery = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: app.backing });
  await afterRecovery.load();
  expect(moneySave.encode(afterRecovery.state.value)).toEqual(recovered);
  expect(createLegendaryCheckout(afterRecovery).open('tires:4')).toEqual({ kind: 'rejected', reason: 'already-owned' });
  expect(app.write).toHaveBeenCalledTimes(1);
});

it('binds payment to its original item and context rather than caller-supplied checkout metadata', async () => {
  const app = await checkoutApp();
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected eligible checkout');
  const substituted = { ...opened.checkout, id: 'unknown-checkout', item: 'horn:4', context: 3, cents: 880 };
  const before = app.store.state.value;
  expect(substituted.pay(880, 3).kind).toBe('rejected');
  expect(app.store.state.value).toBe(before);
  const result = substituted.pay(110, 2);
  if (result.kind !== 'accepted') throw new Error('Expected original bound purchase');
  expect(await result.saved).toBe(true);
  expect(opened.checkout.status).toBe('completed');
  expect(app.snapshot()).toEqual({
    ...eligible, unlocked: ['tires:3', 'horn:3', 'tires:4'],
    fitted: { ...eligible.fitted, pickup: { ...eligible.fitted.pickup, tires: 4 } },
  });
  expect(app.write).toHaveBeenCalledTimes(1);
});
