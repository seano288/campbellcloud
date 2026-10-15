import { expect, it, vi } from 'vitest';
import { createRound } from '../learning/round';
import { nonMoneySession, progressNonMoney } from '../learning/nonMoney.fixture';
import { createStore } from '../save/store';
import { createPracticeCoordinator } from './coordination';
import { createRewardPurchases } from './purchaseCoordination';
import { repeatPurchases } from '../rewards/repeatPurchase.fixture';

it('commits a non-money Round through the shared controller and coordinator without Garage or money state', async () => {
  vi.useFakeTimers();
  try {
    const fresh = () => ({ learning: { solved: 0 }, currency: { balance: 0 } });
    const store = createStore({
      key: 'clock-test', adapter: { fresh, decode: fresh, encode: state => state },
      backing: { read: () => null, write() {} },
    });
    await store.load();
    const practice = createPracticeCoordinator(store, {
      start: state => ({ state: { ...state }, context: undefined, intro: false }),
      acknowledge: state => state,
      solve: (state, context, fact) => {
        const next = progressNonMoney(state.learning, context, fact);
        return { state: { ...state, learning: next.state }, changes: next.changes };
      },
      interrupt: state => state,
      earnings: () => 4,
      complete: state => ({ state, facts: { response: 'Finished' } }),
    });
    const started = practice.start(undefined);
    if (started.kind !== 'accepted') throw new Error('Expected Round start');
    const controller = createRound({
      roundId: started.roundId, session: nonMoneySession(), rng: () => 0,
      interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
      solved: (id, fact) => { practice.solve(id, fact); },
      terminal: fact => { practice.terminal(fact); },
    });
    for (let i = 0; i < 5; i++) {
      expect(controller.display.value.current.actions.submit('3:00')).toBe('correct');
      await vi.advanceTimersByTimeAsync(i === 4 ? 900 : 1500);
    }
    expect(controller.display.value.phase).toBe('completed');
    expect(store.state.value).toEqual({ learning: { solved: 5 }, currency: { balance: 4 } });
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results: controller.display.value.results }).kind).toBe('rejected');
    expect(store.state.value.currency.balance).toBe(4);
  } finally {
    vi.useRealTimers();
  }
});

it('persists two intentional repeat purchases and rejects a later debit without losing the reward state', async () => {
  let saved: string | null = null;
  const fresh = () => ({ currency: { balance: 4 }, reward: { purchases: 0, available: true } });
  const backing = { read: () => saved, write: (_key: string, text: string) => { saved = text; } };
  const adapter = { fresh, decode: (raw: unknown) => raw ? JSON.parse(JSON.stringify(raw)) as ReturnType<typeof fresh> : fresh(), encode: (state: ReturnType<typeof fresh>) => state };
  const store = createStore({ key: 'repeat-test', adapter, backing });
  await store.load();
  const buy = createRewardPurchases(store, repeatPurchases, {
    read: state => state.reward, replace: (state, reward) => ({ ...state, reward }),
  });
  for (let i = 0; i < 2; i++) {
    const bought = buy('buy');
    if (bought.kind !== 'accepted') throw new Error('Expected repeat purchase');
    expect(await bought.saved).toBe(true);
  }
  const before = store.state.value;
  expect(buy('buy').kind).toBe('rejected');
  expect(store.state.value).toBe(before);
  const reloaded = createStore({ key: 'repeat-test', adapter, backing });
  await reloaded.load();
  expect(reloaded.state.value).toEqual({ currency: { balance: 0 }, reward: { purchases: 2, available: true } });
});
