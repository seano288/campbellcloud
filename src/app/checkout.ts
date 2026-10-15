import type { GaragePricingContext, LegendaryId } from '../garage/economy';
import { proposeLegendary, requestLegendary } from '../garage/purchases';
import type { Commit, createStore } from '../save/store';
import type { MoneyState } from './save';

export interface LegendaryCheckout {
  readonly id: string;
  readonly item: LegendaryId;
  readonly context: GaragePricingContext;
  readonly cents: number;
  readonly status: 'active' | 'closed' | 'replaced' | 'completed';
  pay(cents: number, context: GaragePricingContext): Commit<MoneyState>;
  close(): void;
}

export function createLegendaryCheckout(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'state' | 'ready' | 'commit'>,
  garage = { requestLegendary, proposeLegendary },
) {
  let sequence = 0;
  let active: { status: LegendaryCheckout['status'] } | undefined;

  function open(item: LegendaryId) {
    if (!store.ready.peek()) return { kind: 'rejected', reason: 'not-ready' } as const;
    const state = store.state.peek(), context = state.learning.modes.pay.level;
    const request = garage.requestLegendary(state.garage, item, context);
    if (request.kind === 'rejected') return request;
    const session: { status: LegendaryCheckout['status'] } = { status: 'active' };
    const checkout: LegendaryCheckout = {
      id: `checkout-${++sequence}`, item: request.item, context, cents: request.cents,
      get status() { return session.status; },
      pay: (cents, paidContext) => store.commit(current => {
        if (active !== session || session.status !== 'active' || paidContext !== context) return null;
        const proposal = garage.proposeLegendary(current.garage, item, context, cents);
        if (proposal.kind === 'rejected') return null;
        const next = { ...current, garage: proposal.state };
        session.status = 'completed';
        active = undefined;
        return next;
      }),
      close() {
        if (active !== session) return;
        session.status = 'closed';
        active = undefined;
      },
    };
    if (active) active.status = 'replaced';
    active = session;
    return { kind: 'ready', checkout } as const;
  }

  return { open };
}
