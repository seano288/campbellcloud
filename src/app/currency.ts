import type { CurrencyState, EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import type { Save } from '../save/migrate';

export const currencyFromSave = (save: Save): CurrencyState => ({ balance: save.bolts });
export const withCurrency = (save: Save, state: CurrencyState): Save => ({ ...save, bolts: state.balance });
export const boltEarnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));
