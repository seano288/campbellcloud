import type { CurrencyState } from '../currency/currency';
import type { Save } from '../save/migrate';

export const currencyFromSave = (save: Save): CurrencyState => ({ balance: save.bolts });
