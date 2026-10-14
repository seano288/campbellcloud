import type { RoundResult } from '../learning/session';
import { isAmount } from './amount';

export interface CurrencyState { readonly balance: number }
export const readCurrency = (balance: unknown): CurrencyState => ({ balance: isAmount(balance) ? balance : 0 });
export type CompletedRound = RoundResult & { readonly status: 'completed' };
export type EarningsPolicy = (result: CompletedRound) => number;
export type CurrencyFailure = 'invalid-balance' | 'invalid-amount' | 'insufficient-funds' | 'overflow';
export type CurrencyChange =
  | { kind: 'accepted'; state: CurrencyState; amount: number }
  | { kind: 'rejected'; reason: CurrencyFailure };

export function credit(state: CurrencyState, amount: number): CurrencyChange {
  if (!isAmount(state.balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isAmount(amount)) return { kind: 'rejected', reason: 'invalid-amount' };
  if (amount > Number.MAX_SAFE_INTEGER - state.balance) return { kind: 'rejected', reason: 'overflow' };
  return { kind: 'accepted', state: { balance: state.balance + amount }, amount };
}

export function debit(state: CurrencyState, amount: number): CurrencyChange {
  if (!isAmount(state.balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isAmount(amount)) return { kind: 'rejected', reason: 'invalid-amount' };
  if (amount > state.balance) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'accepted', state: { balance: state.balance - amount }, amount };
}

export function earn(state: CurrencyState, result: CompletedRound, policy: EarningsPolicy): CurrencyChange {
  if (!isAmount(state.balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  return credit(state, policy(result));
}
