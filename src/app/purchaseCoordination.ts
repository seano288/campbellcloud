import { debit, type CurrencyState } from '../currency/currency';
import type { RewardPurchases } from '../rewards/purchase';
import type { createStore } from '../save/store';

export function createRewardPurchases<State extends { currency: CurrencyState }, Reward, Request>(
  store: Pick<ReturnType<typeof createStore<State>>, 'commit'>,
  purchases: RewardPurchases<Reward, Request, unknown>,
  reward: { read(state: State): Reward; replace(state: State, next: Reward): State },
) {
  return (item: Request) => store.commit(state => {
    const proposal = purchases.proposePurchase(reward.read(state), item, state.currency.balance);
    if (proposal.kind === 'rejected') return null;
    const payment = debit(state.currency, proposal.cost);
    return payment.kind === 'accepted' ? { ...reward.replace(state, proposal.state), currency: payment.state } : null;
  });
}
