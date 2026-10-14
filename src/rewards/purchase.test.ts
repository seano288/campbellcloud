import { expect, it } from 'vitest';
import { debit, type CurrencyState } from '../currency/currency';
import { proposePurchase } from '../garage/purchases';
import { freshGarage } from '../garage/state';
import type { RewardPurchases } from './purchase';
import { repeatPurchases } from './repeatPurchase.fixture';

function purchase<S, R, E>(current: { reward: S; currency: CurrencyState }, reward: RewardPurchases<S, R, E>, request: R) {
  const proposal = reward.proposePurchase(current.reward, request, current.currency.balance);
  if (proposal.kind === 'rejected') return current;
  const payment = debit(current.currency, proposal.cost);
  return payment.kind === 'rejected' ? current : { reward: proposal.state, currency: payment.state };
}

it('accepts two intentional repeat purchases through the same interfaces as Garage', () => {
  const initial = { reward: { purchases: 0, available: true }, currency: { balance: 5 } };
  const first = purchase(initial, repeatPurchases, 'buy');
  expect(first).toEqual({ reward: { purchases: 1, available: true }, currency: { balance: 3 } });
  const second = purchase(first, repeatPurchases, 'buy');
  expect(second).toEqual({ reward: { purchases: 2, available: true }, currency: { balance: 1 } });
  expect(purchase(second, repeatPurchases, 'buy')).toBe(second);
  const unavailable = { ...initial, reward: { purchases: 0, available: false } };
  expect(purchase(unavailable, repeatPurchases, 'buy')).toBe(unavailable);
  const garage = purchase({ reward: { ...freshGarage(), goal: 'tires:2' as const }, currency: { balance: 16 } }, { proposePurchase }, 'tires:2');
  expect(garage).toMatchObject({ reward: { unlocked: ['tires:2'], fitted: { pickup: { tires: 2 } }, goal: null }, currency: { balance: 1 } });
  expect(initial).toEqual({ reward: { purchases: 0, available: true }, currency: { balance: 5 } });
});

it('discards a proposed reward when its returned cost is invalid or cannot be paid', () => {
  const initial = { reward: { purchases: 0, available: true }, currency: { balance: 5 } };
  for (const cost of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 6, '2', null, undefined]) {
    const invalidReward: typeof repeatPurchases = {
      proposePurchase: () => ({ kind: 'ready', cost: cost as number, state: { purchases: 1, available: true } }),
    };
    expect(purchase(initial, invalidReward, 'buy')).toBe(initial);
  }
  expect(initial).toEqual({ reward: { purchases: 0, available: true }, currency: { balance: 5 } });
});
