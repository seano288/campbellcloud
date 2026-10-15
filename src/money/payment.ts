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

export function checkPay(p: Pick<MoneyPayment, 'price'>, tray: readonly MoneyKey[]): PayCheck {
  const paid = total(tray);
  if (!tray.length) return { kind: 'empty' };
  if (paid === p.price) return { kind: 'paid' };
  return paid < p.price ? { kind: 'short', by: p.price - paid } : { kind: 'over', by: paid - p.price };
}
