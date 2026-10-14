import { isAmount } from '../currency/amount';
import type { RewardPurchases } from './purchase';

interface RepeatState { purchases: number; available: boolean }
export const repeatPurchases: RewardPurchases<RepeatState, 'buy', 'unavailable' | 'insufficient-funds'> = {
  proposePurchase(state, _request, balance) {
    if (!state.available) return { kind: 'rejected', reason: 'unavailable' };
    if (!isAmount(balance) || balance < 2) return { kind: 'rejected', reason: 'insufficient-funds' };
    return { kind: 'ready', cost: 2, state: { ...state, purchases: state.purchases + 1 } };
  },
};
