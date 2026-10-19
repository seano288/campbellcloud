import { MONEY, total, type MoneyKey } from './money';

export interface MoneyPayment { price: number; bank: readonly MoneyKey[] }

/** The money Help me pay puts in the tray: biggest first, one at a time. */
export function helpPayCoins(price: number, bank: readonly MoneyKey[]): MoneyKey[] {
  const out: MoneyKey[] = [];
  let left = price;
  for (const k of bank) while (MONEY[k].cents <= left) { out.push(k); left -= MONEY[k].cents; }
  return out;
}

export type PayCheck = { kind: 'paid' } | { kind: 'empty' } | { kind: 'short' | 'over'; by: number };
/** A wrong payment: short or over by some cents, or (when the fewest pieces are asked for) `extra` pieces too many. */
export type PayMiss = { kind: 'short' | 'over' | 'extra'; by: number };

export function checkPay(p: Pick<MoneyPayment, 'price'>, tray: readonly MoneyKey[]): PayCheck {
  const paid = total(tray);
  if (!tray.length) return { kind: 'empty' };
  if (paid === p.price) return { kind: 'paid' };
  return paid < p.price ? { kind: 'short', by: p.price - paid } : { kind: 'over', by: paid - p.price };
}

/** The right amount in the fewest pieces it can be paid with, or how many pieces too many. */
export function checkFewest(p: MoneyPayment, tray: readonly MoneyKey[]): { kind: 'paid' } | { kind: 'extra'; by: number } {
  const extra = tray.length - helpPayCoins(p.price, p.bank).length;
  return extra > 0 ? { kind: 'extra', by: extra } : { kind: 'paid' };
}
