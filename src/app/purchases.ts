import type { CurrencyState } from '../currency/currency';
import type { Buyable } from '../garage/catalog';
import type { GarageState } from '../garage/state';
import type { RewardPurchases } from '../rewards/purchase';
import type { createStore } from '../save/store';
import { createRewardPurchases } from './purchaseCoordination';

export function createGaragePurchases<State extends { currency: CurrencyState; garage: GarageState }>(
  store: Pick<ReturnType<typeof createStore<State>>, 'commit'>,
  purchases: RewardPurchases<GarageState, Buyable, unknown>,
) {
  return createRewardPurchases(store, purchases, {
    read: state => state.garage,
    replace: (state, garage) => ({ ...state, garage }),
  });
}
