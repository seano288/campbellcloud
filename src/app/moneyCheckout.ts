// The money game's Legendary checkout: Pay the Shop's current Level sets both the price and the money tray.
import { pricingAt } from '../garage/economy';
import { LEVEL_MONEY } from '../money/money';
import { createPaymentChallenge } from '../modes/pay/payment';
import type { LegendaryPolicy } from './checkout';
import type { MoneyState } from './save';

export const moneyLegendaryPolicy: LegendaryPolicy<MoneyState> = {
  kind: 'exact-practice-money',
  context: state => {
    const pricing = pricingAt(state.learning.modes.pay.level);
    return { pricing, bank: LEVEL_MONEY[pricing] };
  },
  payment: createPaymentChallenge,
};
