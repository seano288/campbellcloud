import type { GaragePricingContext, LegendaryId } from '../garage/economy';
import { proposeLegendary, requestLegendary } from '../garage/purchases';
import { LEVEL_MONEY, type MoneyKey } from '../money/money';
import { createPaymentChallenge, type PaymentActions } from '../modes/pay/payment';
import type { Commit, createStore } from '../save/store';
import { createVoiceScope } from '../voice/say';
import type { MoneyState } from './save';

export interface LegendaryPolicy {
  kind: 'exact-practice-money';
  context(state: MoneyState): { pricing: GaragePricingContext; bank: readonly MoneyKey[] };
  payment: typeof createPaymentChallenge;
}

export const moneyLegendaryPolicy: LegendaryPolicy = {
  kind: 'exact-practice-money',
  context: state => {
    const pricing = state.learning.modes.pay.level;
    return { pricing, bank: LEVEL_MONEY[pricing] };
  },
  payment: createPaymentChallenge,
};

export interface LegendaryCheckout {
  readonly id: string;
  readonly item: LegendaryId;
  readonly context: GaragePricingContext;
  readonly cents: number;
  readonly bank: readonly MoneyKey[];
  readonly signal: AbortSignal;
  readonly actions: PaymentActions;
  readonly status: 'active' | 'closed' | 'replaced' | 'completed';
  pay(cents: number, context: GaragePricingContext): Commit<MoneyState>;
  close(): void;
}

export function createLegendaryCheckout(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'state' | 'ready' | 'commit'>,
  policy: LegendaryPolicy,
  garage = { requestLegendary, proposeLegendary },
) {
  if (policy?.kind !== 'exact-practice-money' || typeof policy.context !== 'function' || typeof policy.payment !== 'function') throw new Error('Legendary checkout requires an exact-practice-money policy and payment capability');
  function capture(state: MoneyState) {
    const context = policy.context(state);
    const expected = context && LEVEL_MONEY[context.pricing];
    if (!expected || !Array.isArray(context.bank) || context.bank.length !== expected.length || expected.some((key, i) => key !== context.bank[i])) {
      throw new Error('Legendary checkout requires compatible pricing and money context');
    }
    return { context: context.pricing, bank: Object.freeze([...context.bank]) };
  }
  capture(store.state.peek());
  let sequence = 0;
  let active: { status: LegendaryCheckout['status']; end(status: LegendaryCheckout['status']): void } | undefined;

  function open(item: LegendaryId, lifetime?: AbortSignal, paid?: (result: Extract<Commit<MoneyState>, { kind: 'accepted' }>) => void) {
    if (!store.ready.peek()) return { kind: 'rejected', reason: 'not-ready' } as const;
    if (lifetime?.aborted) return { kind: 'rejected', reason: 'closed' } as const;
    const state = store.state.peek(), { context, bank } = capture(state);
    const request = garage.requestLegendary(state.garage, item, context);
    if (request.kind === 'rejected') return request;
    const voice = createVoiceScope(lifetime);
    const session: NonNullable<typeof active> = {
      status: 'active',
      end(status) {
        if (session.status !== 'active') return;
        session.status = status;
        if (active === session) active = undefined;
        voice.cancel();
      },
    };
    voice.signal.addEventListener('abort', () => session.end('closed'), { once: true });
    const payment = policy.payment({ price: request.cents, bank }, voice.signal, cents => {
      const result = checkout.pay(cents, context);
      if (result.kind !== 'accepted') return false;
      paid?.(result);
      return true;
    });
    const checkout: LegendaryCheckout = {
      id: `checkout-${++sequence}`, item: request.item, context, cents: request.cents, bank, signal: voice.signal,
      actions: payment.actions,
      get status() { return session.status; },
      pay: (cents, paidContext) => store.commit(current => {
        if (active !== session || session.status !== 'active' || paidContext !== context) return null;
        const proposal = garage.proposeLegendary(current.garage, item, context, cents);
        if (proposal.kind === 'rejected') return null;
        const next = { ...current, garage: proposal.state };
        session.end('completed');
        return next;
      }),
      close: () => session.end('closed'),
    };
    active?.end('replaced');
    active = session;
    return { kind: 'ready', checkout } as const;
  }

  return { open };
}
