// Money drawn in code: whole dollars only, as gold $1 coins and green $5 and $10 bills. An amount is shown with the fewest pieces
// (12 is a $10 bill and two coins) and its number beside it, so he can count or read. Lessons line up plain $1 coins in rows.
import type { CoinRow } from '../econ/teach';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

export function Coin({ lit = false, empty = false, size = 1 }: { lit?: boolean; empty?: boolean; size?: number }) {
  return (
    <svg class={cls('ft-coin', lit && 'lit', empty && 'empty')} viewBox="0 0 40 40" style={{ '--s': size } as Record<string, number>} aria-hidden="true">
      {empty
        ? <circle cx="20" cy="20" r="16" fill="none" stroke="#1d1d1f" stroke-width="3" stroke-dasharray="5 4" />
        : <><circle cx="20" cy="20" r="17" fill="#e8b923" stroke="#1d1d1f" stroke-width="3" /><circle cx="20" cy="20" r="12" fill="#ffd23f" />
          <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="900" font-family="Nunito,sans-serif" fill="#7a5a00">$1</text></>}
    </svg>
  );
}
export function Bill({ value }: { value: 5 | 10 }) {
  return (
    <svg class={cls('ft-bill', `v${value}`)} viewBox="0 0 80 40" aria-hidden="true">
      <rect x="2" y="2" width="76" height="36" rx="5" fill={value === 5 ? '#8fd18a' : '#5fbf9a'} stroke="#1d1d1f" stroke-width="3" />
      <rect x="8" y="7" width="64" height="26" rx="3" fill="none" stroke="#2f7a3a" stroke-width="2" />
      <circle cx="40" cy="20" r="9" fill="#d9f3d4" stroke="#2f7a3a" stroke-width="2" />
      <text x="40" y="25" text-anchor="middle" font-size="13" font-weight="900" font-family="Nunito,sans-serif" fill="#1f4d26">{value}</text>
      <text x="15" y="17" text-anchor="middle" font-size="10" font-weight="900" font-family="Nunito,sans-serif" fill="#1f4d26">${value}</text>
      <text x="65" y="31" text-anchor="middle" font-size="10" font-weight="900" font-family="Nunito,sans-serif" fill="#1f4d26">${value}</text>
    </svg>
  );
}
/** The fewest bills and coins that make an amount. */
export function piecesOf(n: number): (1 | 5 | 10)[] {
  const out: (1 | 5 | 10)[] = [];
  for (const v of [10, 5, 1] as const) while (n >= v) { out.push(v); n -= v; }
  return out;
}
/** His money: the pieces, and the amount written. */
export function Money({ amount, label = 'You have' }: { amount: number; label?: string }) {
  return (
    <div class="ft-money" role="img" aria-label={`${label} ${amount} dollars`}>
      <span class="ft-wallet" aria-hidden="true">👛</span>
      <span class="ft-pieces">{piecesOf(amount).map((v, i) => (v === 1 ? <Coin key={i} /> : <Bill key={i} value={v} />))}</span>
      <span class="ft-amount">${amount}</span>
    </div>
  );
}
export function PriceTag({ price }: { price: number }) {
  return <span class="ft-tag">${price}</span>;
}
/** A lesson's rows of $1 coins, lined up one to one. Days of earning (Save Up) are short rows, one a day, laid side by side and wrapped,
 *  so ten days still fit a phone on its side. */
export function CoinRows({ rows }: { rows: readonly CoinRow[] }) {
  const width = Math.max(...rows.map(r => r.coins + (r.empty ?? 0))), days = rows.some(r => r.tone === 'day');
  return (
    <div class={cls('ft-rows', days && 'days')} style={{ '--cols': Math.max(width, 1) } as Record<string, number>}>
      {rows.map(r => (
        <div key={r.key} class={cls('ft-row', `t-${r.tone}`)}>
          <span class="ft-row-tag" aria-hidden="true">{r.tone === 'his' ? '👛' : r.tone === 'day' ? '📅' : '🏷️'}</span>
          {Array.from({ length: r.coins }, (_, i) => <Coin key={i} lit={i >= (r.litFrom ?? 0) && i < (r.lit ?? 0)} />)}
          {Array.from({ length: r.empty ?? 0 }, (_, i) => <Coin key={`e${i}`} empty lit={i < (r.emptyLit ?? 0)} />)}
        </div>
      ))}
    </div>
  );
}
