import { afterEach, expect, it, vi } from 'vitest';
import { clockRepeatKey, createClockRepeat } from './clockRepeat';
import { createClockGarage } from './clockGarage';
import { createPaymentChallenge } from '../../src/modes/pay/payment';
import { helpPay, payment } from '../../src/modes/pay/feedback';
import { fitMod, selectGoal } from '../../src/garage/state';
import { createLegendaryCheckout } from '../../src/app/checkout';
import { createMoneyRepeat, moneyRepeatKey } from './moneyRepeat';
import { repeatPurchases } from '../../src/rewards/repeatPurchase.fixture';
import { proposePurchase } from '../../src/garage/purchases';
import type { RoundDisplay } from '../../src/learning/round';
import type { ReadonlySignal } from '@preact/signals';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

async function mixedRound<P, A>(round: { display: Pick<ReadonlySignal<RoundDisplay<P, A>>, 'value'> }, correct: (problem: P) => A, wrong: (problem: P) => A) {
  const first = round.display.value.current;
  for (let i = 0; i < 2; i++) {
    expect(first.actions.submit(wrong(first.problem))).toBe('incorrect');
    await vi.advanceTimersByTimeAsync(1500);
  }
  expect(first.actions.submit(correct(first.problem))).toBe('correct');
  await vi.advanceTimersByTimeAsync(1500);
  const second = round.display.value.current;
  second.actions.help(async () => {});
  second.actions.submit(correct(second.problem));
  await vi.advanceTimersByTimeAsync(1500);
  expect(first.actions.submit(correct(first.problem))).toBe('ignored');
  for (let i = 2; i < 5; i++) {
    const current = round.display.value.current;
    current.actions.submit(correct(current.problem));
    await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
  }
  expect(round.display.value.phase).toBe('completed');
  expect(round.display.value.results).toEqual([
    { index: 1, outcome: 'missed', misses: 2, helped: true, replay: false },
    { index: 2, outcome: 'helped', misses: 0, helped: true, replay: false },
    { index: 3, outcome: 'clean', misses: 0, helped: false, replay: true },
    { index: 4, outcome: 'clean', misses: 0, helped: false, replay: false },
    { index: 5, outcome: 'clean', misses: 0, helped: false, replay: false },
  ]);
}

it('completes, purchases twice and reloads the non-money/non-Garage composition', async () => {
  vi.useFakeTimers();
  const data = new Map<string, string>();
  const backing = { read: (key: string) => data.get(key) ?? null, write: (key: string, text: string) => { data.set(key, text); } };
  const app = createClockRepeat(backing);
  await app.store.load();
  const round = app.begin();
  for (let i = 0; i < 5; i++) {
    expect(round.display.value.current.actions.submit('3:00')).toBe('correct');
    await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
  }
  expect(app.store.state.value.learning).toEqual({ solved: 5 });
  expect(app.store.state.value.currency.balance).toBe(4);
  expect(app.store.state.value.trophies.earned).toMatchObject({ 'first-clock': '2026-10-15', perfect: '2026-10-15' });
  for (let i = 0; i < 2; i++) {
    const result = app.buy('buy');
    if (result.kind !== 'accepted') throw new Error('Expected repeat purchase');
    expect(await result.saved).toBe(true);
  }
  expect(app.buy('buy').kind).toBe('rejected');
  expect(repeatPurchases.proposePurchase(app.store.state.value.reward, 'buy', app.store.state.value.currency.balance)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  const reloaded = createClockRepeat(backing);
  await reloaded.store.load();
  expect(reloaded.store.state.value).toEqual(app.store.state.value);
  expect(reloaded.store.state.value).toMatchObject({ currency: { balance: 0 }, reward: { purchases: 2 } });
  expect(reloaded.store.state.value).not.toHaveProperty('garage');
  expect(reloaded.store.state.value.learning).not.toHaveProperty('modes');
});

it('uses money learning with repeat rewards and no Garage state, earning from actual help outcomes', async () => {
  vi.useFakeTimers();
  const data = new Map<string, string>();
  const backing = { read: (key: string) => data.get(key) ?? null, write: (key: string, text: string) => { data.set(key, text); } };
  const app = createMoneyRepeat(backing);
  await app.store.load();
  const abandoned = app.begin();
  abandoned.display.value.current.actions.submit(abandoned.display.value.current.problem.target);
  abandoned.leave();
  await vi.advanceTimersByTimeAsync(10000);
  expect(app.store.state.value).toMatchObject({ currency: { balance: 0 }, trophies: { roundsFinished: 0 } });
  const round = app.begin();
  for (let i = 0; i < 5; i++) {
    const { current } = round.display.value;
    if (i < 2) current.actions.help(async () => {});
    expect(current.actions.submit(current.problem.target)).toBe('correct');
    await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
  }
  expect(round.display.value.results.map(r => r.outcome)).toEqual(['helped', 'helped', 'clean', 'clean', 'clean']);
  expect(app.store.state.value.currency.balance).toBe(4);
  expect(app.store.state.value.learning.modes.learn.window).toEqual(['clean', 'helped', 'helped', 'clean', 'clean', 'clean']);
  for (let i = 0; i < 2; i++) {
    const bought = app.buy('buy');
    if (bought.kind !== 'accepted') throw new Error('Expected repeat purchase');
    await bought.saved;
  }
  const before = app.store.state.value;
  expect(app.buy('buy').kind).toBe('rejected');
  expect(repeatPurchases.proposePurchase(app.store.state.value.reward, 'buy', app.store.state.value.currency.balance)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  const reloaded = createMoneyRepeat(backing);
  await reloaded.store.load();
  expect(reloaded.store.state.value).toEqual(before);
  expect(reloaded.store.state.value).not.toHaveProperty('garage');
  expect(reloaded.store.state.value.reward).toEqual({ purchases: 2, available: true });
});

it('composes non-money learning with real Garage setup, free actions, purchases and scoped money checkout', async () => {
  vi.useFakeTimers();
  const data = new Map<string, string>();
  const backing = { read: (key: string) => data.get(key) ?? null, write: (key: string, text: string) => { data.set(key, text); } };
  const app = createClockGarage(backing);
  await app.store.load();
  const setup = app.setup.open(new AbortController().signal, () => {});
  const chosen = setup.confirm('pickup');
  if (chosen.kind !== 'accepted') throw new Error('Expected setup');
  await chosen.saved;
  for (let n = 0; n < 2; n++) {
    const round = app.begin();
    for (let i = 0; i < 5; i++) {
      round.display.value.current.actions.submit('3:00');
      await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
    }
  }
  expect(app.store.state.value.trophies.earned).toEqual({
    'first-clock': '2026-10-15', perfect: '2026-10-15', 'rounds:1': '2026-10-15', 'rounds:2': '2026-10-15',
  });
  const bought = app.buy('tires:1');
  if (bought.kind !== 'accepted') throw new Error('Expected Garage purchase');
  await bought.saved;
  expect(app.store.state.value).toMatchObject({ currency: { balance: 3 }, garage: { unlocked: ['tires:1'], fitted: { pickup: { tires: 1 } } } });
  expect(app.buy('tires:1').kind).toBe('rejected');
  expect(app.buy('horn:1').kind).toBe('rejected');
  expect(proposePurchase(app.store.state.value.garage, 'tires:1', 3)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  expect(proposePurchase(app.store.state.value.garage, 'horn:1', 3)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  const free = app.store.commit(state => ({ ...state, garage: selectGoal(fitMod(state.garage, 'tires', 0), 'horn:1') }));
  if (free.kind !== 'accepted') throw new Error('Expected free actions');
  await free.saved;
  expect(app.store.state.value.currency.balance).toBe(3);
  const eligible = app.store.commit(state => ({ ...state, garage: { ...state.garage, unlocked: [...state.garage.unlocked, 'tires:3'] } }));
  if (eligible.kind !== 'accepted') throw new Error('Expected synthetic prerequisite');
  await eligible.saved;
  const before = app.store.state.value;
  const opened = app.checkout.open('tires:4');
  if (opened.kind !== 'ready') throw new Error('Expected selected checkout capability');
  expect(opened.checkout.actions.submit([])).toBe('not-an-answer');
  expect(opened.checkout.actions.submit(['p'])).toBe('incorrect');
  expect(opened.checkout.actions.submit(['q', 'q', 'q', 'q', 'q'])).toBe('incorrect');
  await vi.advanceTimersByTimeAsync(3000);
  expect(payment(opened.checkout.signal).tray.value).toEqual(['q', 'q', 'q', 'q', 'd']);
  expect(app.store.state.value).toBe(before);
  opened.checkout.actions.help(signal => helpPay({ price: opened.checkout.cents, bank: opened.checkout.bank }, signal));
  await vi.advanceTimersByTimeAsync(3000);
  expect(payment(opened.checkout.signal).tray.value).toEqual(['q', 'q', 'q', 'q', 'd']);
  expect(app.store.state.value).toBe(before);
  opened.checkout.close();
  expect(opened.checkout.actions.submit(['q', 'q', 'q', 'q', 'd'])).toBe('ignored');
  const next = app.checkout.open('tires:4');
  if (next.kind !== 'ready') throw new Error('Expected reopened checkout');
  expect(next.checkout.actions.submit(['q', 'q', 'q', 'q', 'd'])).toBe('correct');
  expect(app.store.state.value.learning).toBe(before.learning);
  expect(app.store.state.value.currency).toBe(before.currency);
  expect(app.store.state.value.trophies).toBe(before.trophies);
  const flushed = app.store.commit(state => ({ ...state }));
  if (flushed.kind !== 'accepted') throw new Error('Expected saved snapshot');
  await flushed.saved;
  const reloaded = createClockGarage(backing);
  await reloaded.store.load();
  expect(reloaded.store.state.value).toEqual(app.store.state.value);
  expect(reloaded.store.state.value.learning).toEqual({ solved: 10 });
  expect(reloaded.checkout.open('tires:4')).toEqual({ kind: 'rejected', reason: 'already-owned' });
  expect(() => Reflect.apply(createLegendaryCheckout, undefined, [app.store, undefined])).toThrow(/Legendary.*policy/);
  expect(() => createClockGarage(backing, { kind: 'exact-practice-money', payment: createPaymentChallenge, context: () => ({ pricing: 2, bank: ['p'] }) })).toThrow(/Legendary.*context/);
});

it.each([createClockRepeat, createClockGarage])('retains solved progress but no earnings on abandonment, then records help, misses and replay through %s', async compose => {
  vi.useFakeTimers();
  const data = new Map<string, string>();
  const backing = { read: (key: string) => data.get(key) ?? null, write: (key: string, text: string) => { data.set(key, text); } };
  const app = compose(backing);
  await app.store.load();
  const abandoned = app.begin();
  expect(abandoned.display.value.current.actions.submit('')).toBe('not-an-answer');
  abandoned.display.value.current.actions.submit('3:00');
  abandoned.leave();
  await vi.advanceTimersByTimeAsync(10000);
  expect(app.store.state.value).toMatchObject({ learning: { solved: 1 }, currency: { balance: 0 }, trophies: { roundsFinished: 0 } });
  const round = app.begin();
  await mixedRound(round, () => '3:00', () => '4:00');
  expect(app.store.state.value).toMatchObject({ learning: { solved: 6 }, currency: { balance: 4 }, trophies: { roundsFinished: 1, currentStreak: 3 } });
  expect(app.store.state.value.trophies.earned).not.toHaveProperty('perfect');
  const before = app.store.state.value;
  expect(app.practice.terminal({ roundId: round.display.value.roundId, status: 'completed', results: round.display.value.results }).kind).toBe('rejected');
  expect(app.store.state.value).toBe(before);
  const reloaded = compose(backing);
  await reloaded.store.load();
  expect(reloaded.store.state.value).toEqual(before);
});

it('isolates two complete compositions on one backing store without importing a money or legacy balance', async () => {
  vi.useFakeTimers();
  const data = new Map([['mtm2-save', '{"version":4,"bolts":999}'], ['mtm-wins', '88']]);
  const read = vi.fn((key: string) => data.get(key) ?? null);
  const write = vi.fn((key: string, text: string) => { data.set(key, text); });
  const backing = { read, write };
  const clock = createClockRepeat(backing), money = createMoneyRepeat(backing);
  await clock.store.load();
  await money.store.load();
  expect(read.mock.calls).toEqual([[clockRepeatKey], [moneyRepeatKey]]);
  expect(write).not.toHaveBeenCalled();
  expect(clock.store.state.value.currency.balance).toBe(0);
  expect(money.store.state.value.currency.balance).toBe(0);
  const clockRound = clock.begin();
  for (let i = 0; i < 5; i++) {
    clockRound.display.value.current.actions.submit('3:00');
    await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
  }
  const clockPurchase = clock.buy('buy');
  if (clockPurchase.kind !== 'accepted') throw new Error('Expected clock reward');
  await clockPurchase.saved;
  expect(write.mock.calls.every(([key]) => key === clockRepeatKey)).toBe(true);
  expect(money.store.state.value.currency.balance).toBe(0);
  const clockSaved = data.get(clockRepeatKey);
  write.mockClear();
  const moneyRound = money.begin();
  await mixedRound(moneyRound, p => p.target, p => p.target === 'p' ? 'n' : 'p');
  const moneyPurchase = money.buy('buy');
  if (moneyPurchase.kind !== 'accepted') throw new Error('Expected money reward');
  await moneyPurchase.saved;
  expect(write.mock.calls.every(([key]) => key === moneyRepeatKey)).toBe(true);
  expect(money.store.state.value.currency.balance).toBe(2);
  expect(data.get(clockRepeatKey)).toBe(clockSaved);
  const restartedClock = createClockRepeat(backing), restartedMoney = createMoneyRepeat(backing);
  await restartedClock.store.load();
  await restartedMoney.store.load();
  expect(restartedClock.store.state.value).toEqual(clock.store.state.value);
  expect(restartedMoney.store.state.value).toEqual(money.store.state.value);
  expect(read.mock.calls).toEqual([[clockRepeatKey], [moneyRepeatKey], [clockRepeatKey], [moneyRepeatKey]]);
  expect(write).toHaveBeenCalled();
  expect(data.get('mtm2-save')).toBe('{"version":4,"bolts":999}');
  expect(data.get('mtm-wins')).toBe('88');
});

it('keeps the production money/Garage wiring on mtm2-save with the same shared outcome and purchase paths', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  let stored: string | null = null;
  const read = vi.fn(() => stored);
  vi.stubGlobal('localStorage', { getItem: read, setItem: (_key: string, text: string) => { stored = text; } });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('fetch', () => Promise.reject(new Error('No browser audio')));
  const { moneyApp } = await import('../../src/app/money');
  const scheduler = await import('../../src/round/round');
  const { buyWithBolts } = await import('../../src/app/garage');
  await moneyApp.load();
  expect(read.mock.calls).toEqual([['mtm2-save']]);
  scheduler.startRound('learn');
  const abandoned = scheduler.round.value;
  if (!abandoned || abandoned.mode !== 'learn') throw new Error('Expected production Learn');
  abandoned.shared.current.actions.submit(abandoned.shared.current.problem.target);
  scheduler.leaveRound();
  expect(moneyApp.store.state.value.currency.balance).toBe(0);
  scheduler.startRound('learn');
  const current = scheduler.round.value;
  if (!current || current.mode !== 'learn') throw new Error('Expected production Learn');
  const view = { get value() {
    const live = scheduler.round.value;
    if (!live || live.mode !== 'learn') throw new Error('Expected production Learn');
    return live.shared;
  } };
  await mixedRound({ display: view }, p => p.target, p => p.target === 'p' ? 'n' : 'p');
  expect(moneyApp.store.state.value.currency.balance).toBe(4);
  const bought = buyWithBolts('colour:teal');
  if (bought.kind !== 'accepted') throw new Error('Expected production colour purchase');
  await bought.saved;
  expect(moneyApp.store.state.value).toMatchObject({ currency: { balance: 1 }, garage: { colours: ['teal'] }, trophies: { roundsFinished: 1 } });
  expect(buyWithBolts('colour:teal').kind).toBe('rejected');
  expect(buyWithBolts('tires:1').kind).toBe('rejected');
  const committed = moneyApp.store.state.value;
  scheduler.leaveRound();
  vi.resetModules();
  const restarted = await import('../../src/app/money');
  await restarted.moneyApp.load();
  expect(restarted.moneyApp.store.state.value).toEqual(committed);
});
