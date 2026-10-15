import { MONEY, MONEY_NAMES, MONEY_VALUES, type MoneyKey } from './money';

// "{money} is {value}." only for the right pairs
export type NameValue = { [I in keyof typeof MONEY_NAMES & `${number}`]: `${(typeof MONEY_NAMES)[I]} is ${(typeof MONEY_VALUES)[I]}.` }[keyof typeof MONEY_NAMES & `${number}`];
/** "Quarter is 25¢." */
export const moneyIs = (k: MoneyKey) => `${MONEY[k].name} is ${MONEY[k].value}.` as NameValue;
export const MONEY_INSPECTION_PHRASES = MONEY_NAMES.map((_, i) => `${MONEY_NAMES[i]} is ${MONEY_VALUES[i]}.` as NameValue);
