import { repeatPurchases } from '../../src/rewards/repeatPurchase.fixture';
import { createRewardPurchases } from '../../src/app/purchaseCoordination';
import type { createStore } from '../../src/save/store';
import { count, record } from './data';

export const freshRepeat = () => ({ purchases: 0, available: true });
export const readRepeat = (raw: unknown) => ({ purchases: count(record(raw).purchases), available: record(raw).available !== false });
export function repeatBuyer<State extends { currency: { balance: number }; reward: ReturnType<typeof freshRepeat> }>(store: ReturnType<typeof createStore<State>>) {
  return createRewardPurchases(store, repeatPurchases, { read: state => state.reward, replace: (state, reward) => ({ ...state, reward }) });
}
