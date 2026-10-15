import { debit } from '../currency/currency';
import type { Buyable } from '../garage/catalog';
import type { GarageState } from '../garage/state';
import type { RewardPurchases } from '../rewards/purchase';
import type { createStore } from '../save/store';
import type { MoneyState } from './save';

export function createGaragePurchases(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'commit'>,
  purchases: RewardPurchases<GarageState, Buyable, unknown>,
) {
  return (item: Buyable) => store.commit(state => {
    const proposal = purchases.proposePurchase(state.garage, item, state.currency.balance);
    if (proposal.kind === 'rejected') return null;
    const payment = debit(state.currency, proposal.cost);
    return payment.kind === 'accepted' ? { ...state, currency: payment.state, garage: proposal.state } : null;
  });
}
