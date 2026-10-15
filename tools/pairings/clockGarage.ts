import { createLegendaryCheckout, type LegendaryPolicy } from '../../src/app/checkout';
import { createGaragePurchases } from '../../src/app/purchases';
import { createGarageSetup } from '../../src/app/setup';
import { freshGarage, readGarage } from '../../src/garage/state';
import { proposePurchase } from '../../src/garage/purchases';
import { createPaymentChallenge } from '../../src/modes/pay/payment';
import { LEVEL_MONEY } from '../../src/money/money';
import { createStore, type BackingStore, type SaveAdapter } from '../../src/save/store';
import { clockPractice, freshClock, readClock } from './clock';
import { readWallet, record } from './data';

const fresh = () => ({ ...freshClock(), garage: freshGarage() });
export const clockGarageSave: SaveAdapter<ReturnType<typeof fresh>> = {
  fresh, encode: state => state,
  decode: raw => ({ ...readClock(raw), currency: readWallet(raw), garage: readGarage(record(raw).garage) }),
};
export const clockGarageKey = 'test-clock-garage';
export const clockCheckoutPolicy: LegendaryPolicy<ReturnType<typeof fresh>> = {
  kind: 'exact-practice-money', payment: createPaymentChallenge,
  context: () => ({ pricing: 2, bank: LEVEL_MONEY[2] }),
};
export function createClockGarage(backing: BackingStore, policy = clockCheckoutPolicy) {
  const store = createStore({ key: clockGarageKey, adapter: clockGarageSave, backing });
  return {
    store, ...clockPractice(store), buy: createGaragePurchases(store, { proposePurchase }),
    setup: createGarageSetup(store), checkout: createLegendaryCheckout(store, policy),
  };
}
