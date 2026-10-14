import { describe, expect, it } from 'vitest';
import { createApp, clockLearning, garageReward, memoryStore, moneyLearning, recruitmentReward } from './model';

const moneyCheckout = { kind: 'practice-money', priceBand: 2 } as const;

describe('throwaway swap evidence through app coordination', () => {
  it('pairs numeric money answers with repeat purchases without imposing Garage ownership', () => {
    const app = createApp(moneyLearning, recruitmentReward, memoryStore(), 'prototype-money-recruit');
    app.start();
    for (let i = 0; i < 5; i++) {
      expect(app.problem?.actions.submit(15)).toBe('correct');
      app.advance();
    }
    app.finish();
    expect(app.buy('recruit')).toBe('accepted');
    expect(app.buy('recruit')).toBe('accepted');
    expect(app.state).toMatchObject({
      currency: { balance: 0 }, reward: { quantity: 2 }, learning: { practice: 'count', answers: 5 },
    });
    const before = app.state;
    expect(app.buy('recruit')).toBe('insufficient-funds');
    expect(app.state).toBe(before);
  });

  it('captures newly affordable facts once and keeps presentation separate from purchases', () => {
    const reward = garageReward(moneyCheckout);
    const app = createApp(moneyLearning, reward, memoryStore(), 'prototype-money-garage');
    app.start();
    for (let i = 0; i < 5; i++) { app.problem?.actions.submit(15); app.advance(); }
    app.finish();
    expect(app.completion).toEqual({ earned: 6, beforeBalance: 0, afterBalance: 6, newlyAffordable: true });
    app.buy('tires:1');
    const committed = app.state;
    expect(app.buy('tires:1')).toBe('already-owned');
    expect(app.state).toBe(committed);
    expect(app.completion?.newlyAffordable).toBe(true);
    expect(reward.hasAffordable(app.state.reward, app.state.currency.balance)).toBe(false);
    expect(app.state).toBe(committed);
  });

  it('reports helped and missed answers, replays a miss, and abandons without earnings', () => {
    const app = createApp(clockLearning, recruitmentReward, memoryStore(), 'prototype-clock-recruit');
    app.start();
    const stale = app.problem?.actions;
    app.problem?.actions.help(async () => {});
    app.problem?.actions.submit('3:00');
    app.advance();
    app.problem?.actions.submit('4:00');
    app.problem?.actions.submit('3:00');
    app.advance();
    app.problem?.actions.submit('3:00');
    app.advance();
    app.problem?.actions.submit('3:00');
    expect(app.results).toEqual([
      { index: 1, outcome: 'helped', misses: 0, helped: true, replay: false },
      { index: 2, outcome: 'missed', misses: 1, helped: false, replay: false },
      { index: 3, outcome: 'clean', misses: 0, helped: false, replay: false },
      { index: 4, outcome: 'clean', misses: 0, helped: false, replay: true },
    ]);
    app.abandon();
    app.start();
    expect(stale?.submit('3:00')).toBe('ignored');
    expect(app.state).toMatchObject({ currency: { balance: 0 }, completedRounds: 0 });
    expect(app.state.learning.observations).toEqual(['helped', 'missed', 'clean', 'clean']);
  });

  it('isolates two apps in one backing store through completion, purchase and reload', () => {
    const values = new Map<string, string>();
    const reads: string[] = [];
    const writes: string[] = [];
    const store = {
      read(key: string) { reads.push(key); return values.get(key) ?? null; },
      write(key: string, value: string) { writes.push(key); values.set(key, value); },
    };
    const money = createApp(moneyLearning, garageReward(moneyCheckout), store, 'prototype-money');
    money.start();
    for (let i = 0; i < 5; i++) { money.problem?.actions.submit(15); money.advance(); }
    money.finish();
    money.buy('tires:1');
    const moneySave = values.get('prototype-money');
    const clock = createApp(clockLearning, recruitmentReward, store, 'prototype-clock');
    expect(clock.state).toMatchObject({ currency: { balance: 0 }, reward: { quantity: 0 } });
    clock.start();
    for (let i = 0; i < 5; i++) { clock.problem?.actions.submit('3:00'); clock.advance(); }
    clock.finish();
    clock.buy('recruit');
    expect(values.get('prototype-money')).toBe(moneySave);
    expect(createApp(moneyLearning, garageReward(moneyCheckout), store, 'prototype-money').state).toEqual(money.state);
    expect(createApp(clockLearning, recruitmentReward, store, 'prototype-clock').state).toEqual(clock.state);
    expect(reads).toEqual(['prototype-money', 'prototype-clock', 'prototype-money', 'prototype-clock']);
    expect(writes).toEqual([...Array(7).fill('prototype-money'), ...Array(7).fill('prototype-clock')]);
    expect(clock.state).toMatchObject({ currency: { balance: 3 }, reward: { quantity: 1 } });
  });

  it('keeps a failed completion write committed in memory and saves it with the next action', () => {
    const store = memoryStore();
    let fail = false;
    const app = createApp(clockLearning, recruitmentReward, {
      read: key => store.read(key),
      write(key, value) { if (fail) throw new Error('Synthetic quota failure'); store.write(key, value); },
    }, 'prototype-failure');
    app.start();
    for (let i = 0; i < 5; i++) { app.problem?.actions.submit('3:00'); app.advance(); }
    fail = true;
    const result = app.finish();
    expect(app.writeFailed).toBe(true);
    app.notify(result);
    expect(app.state).toMatchObject({ currency: { balance: 6 }, completedRounds: 1 });
    expect(createApp(clockLearning, recruitmentReward, store, 'prototype-failure').state.currency.balance).toBe(0);
    fail = false;
    app.buy('recruit');
    expect(app.writeFailed).toBe(false);
    expect(createApp(clockLearning, recruitmentReward, store, 'prototype-failure').state).toEqual(app.state);
  });

  it('discards an invalid debit proposal without saving or granting a reward', () => {
    const store = memoryStore();
    const app = createApp(clockLearning, {
      ...recruitmentReward,
      proposePurchase: () => ({ kind: 'ready', cost: NaN, state: { quantity: 99 } }),
    }, store, 'prototype-invalid-cost');
    const before = app.state;
    expect(app.buy('recruit')).toBe('invalid-amount');
    expect(app.state).toBe(before);
    expect(store.read('prototype-invalid-cost')).toBeNull();
  });

  it('pairs clock learning with Garage, credits completion once and buys a Mod coherently', () => {
    const store = memoryStore();
    const app = createApp(clockLearning, garageReward(moneyCheckout), store, 'prototype-clock-garage');
    app.start();
    for (let i = 0; i < 5; i++) {
      expect(app.problem?.actions.submit('3:00')).toBe('correct');
      app.advance();
    }
    const result = app.finish();
    expect(app.state).toMatchObject({ currency: { balance: 6 }, completedRounds: 1 });
    app.notify(result);
    expect(app.state.currency.balance).toBe(6);
    expect(app.buy('tires:1')).toBe('accepted');
    expect(app.state).toMatchObject({
      currency: { balance: 1 },
      reward: { unlocked: ['tires:1'], fitted: 'tires:1', goal: null },
    });
    const loaded = createApp(clockLearning, garageReward(moneyCheckout), store, 'prototype-clock-garage');
    expect(loaded.state).toEqual(app.state);
  });
});
