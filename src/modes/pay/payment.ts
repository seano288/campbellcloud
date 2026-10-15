import { sBad } from '../../audio/sfx';
import type { MoneyKey } from '../../money/money';
import { total } from '../../money/money';
import { explainPay, payment, promptPay } from './feedback';
import { checkPay, type MoneyPayment } from '../../money/payment';

export interface PaymentActions {
  readonly busy: boolean;
  submit(tray: readonly MoneyKey[]): 'correct' | 'incorrect' | 'not-an-answer' | 'ignored';
  help(run: (signal: AbortSignal) => Promise<void>): void;
}

export function createPaymentChallenge(
  problem: MoneyPayment,
  lifetime: AbortSignal,
  accept: (cents: number) => boolean,
  effects = { explain: explainPay, prompt: promptPay },
) {
  let misses = 0, done = false;
  const p = { price: problem.price, bank: Object.freeze([...problem.bank]) };
  function run(effect: () => Promise<void>) {
    try { void effect().catch(() => {}); } catch {}
  }
  const actions: PaymentActions = {
    get busy() { return lifetime.aborted || done; },
    submit(tray) {
      if (actions.busy || tray.some(key => !p.bank.includes(key))) return 'ignored';
      const result = checkPay(p, tray);
      if (result.kind === 'empty') {
        run(() => effects.prompt(lifetime));
        return 'not-an-answer';
      }
      if (result.kind !== 'paid') {
        misses++;
        sBad();
        run(() => effects.explain(p, result, misses >= 2, lifetime));
        return 'incorrect';
      }
      if (!accept(total(tray))) return 'ignored';
      done = true;
      payment(lifetime).run.cancel();
      return 'correct';
    },
    help(effect) { if (!actions.busy) run(() => effect(lifetime)); },
  };
  return { actions, tray: payment(lifetime).tray };
}
