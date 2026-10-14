import type { CurrencyState } from '../currency/currency';
import type { GarageState } from '../garage/state';
import type { LearningState } from '../modes/state';
import { freshSave, migrate, SAVE_VERSION, type Save } from '../save/migrate';
import type { TrophyState } from '../trophies/rules';
import type { StepId } from '../trophies/trophies';
import { currencyFromSave } from './currency';
import { learningFromSave } from './practice';
import { trophiesFromSave, trophyFields } from './trophies';

export const MONEY_SAVE_KEY = 'mtm2-save';

export interface MoneyState {
  learning: LearningState;
  currency: CurrencyState;
  garage: GarageState;
  trophies: TrophyState<StepId>;
}

export const garageFromSave = (save: Save): GarageState => ({
  body: save.body, ownedBodies: save.ownedBodies, fitted: save.fitted, unlocked: save.unlocked, colours: save.colours, goal: save.goal,
});

export const moneyFromSave = (save: Save): MoneyState => ({
  learning: learningFromSave(save), currency: currencyFromSave(save), trophies: trophiesFromSave(save), garage: garageFromSave(save),
});

export const moneySave = {
  fresh: (): MoneyState => moneyFromSave(freshSave()),
  decode: (raw: unknown, today?: string): MoneyState => moneyFromSave(migrate(raw, today)),
  encode: (state: MoneyState): Save => ({
    version: SAVE_VERSION, bolts: state.currency.balance, ...state.learning, ...state.garage, ...trophyFields(state.trophies),
  }),
};
