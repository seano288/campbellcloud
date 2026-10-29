// A currency drawn: its icon, and the pile that shows his balance. Each currency in src/currency/kind.ts has one icon here.
import type { JSX } from 'preact';
import { countOf, type CurrencyId, type CurrencyKind } from '../currency/kind';

const ICONS = {
  bolt: () => (
    <>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#ffc21a" stroke="#7a5200" stroke-width="3" />
      <circle cx="20" cy="20" r="7" fill="#e0a000" stroke="#7a5200" stroke-width="2.5" />
    </>
  ),
  // Ammo: a brass cartridge with a copper tip, standing up
  ammo: () => (
    <>
      <path d="M13 17 Q13 3 20 2 Q27 3 27 17 Z" fill="#d9773a" stroke="#5a2a0c" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M17 7 Q18 5 20 4.5" stroke="#f4b183" stroke-width="2" fill="none" stroke-linecap="round" />
      <rect x="12" y="16" width="16" height="19" rx="1.5" fill="#ffc21a" stroke="#7a5200" stroke-width="2.5" />
      <rect x="15" y="19" width="3" height="13" rx="1.5" fill="#ffe27a" />
      <rect x="10.5" y="34" width="19" height="4" rx="1.5" fill="#e0a000" stroke="#7a5200" stroke-width="2.5" />
    </>
  ),
} satisfies Record<CurrencyId, () => JSX.Element>;

export function CurrencyIcon({ kind, size }: { kind: CurrencyKind & { id: CurrencyId }; size: number }) {
  const Art = ICONS[kind.id];
  return <svg class={`currency ${kind.id}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><Art /></svg>;
}

export function CurrencyPile({ kind, count }: { kind: CurrencyKind & { id: CurrencyId }; count: number }) {
  return <div class="pilebox" aria-label={countOf(kind, count)}><CurrencyIcon kind={kind} size={34} /><span>{count}</span></div>;
}
