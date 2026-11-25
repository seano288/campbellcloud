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
  // Doubloon: a gold coin stamped with an X, as on a treasure map
  doubloon: () => (
    <>
      <circle cx="20" cy="20" r="17" fill="#ffc21a" stroke="#7a5200" stroke-width="3" />
      <circle cx="20" cy="20" r="11.5" fill="#ffd95a" stroke="#c98a00" stroke-width="2" />
      <path d="M15 15 L25 25 M25 15 L15 25" stroke="#7a5200" stroke-width="3.5" stroke-linecap="round" />
      <path d="M9 14 Q12 8 18 6" stroke="#fff3b8" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </>
  ),
  // Paw Print: a big pad and four toes
  'paw-print': () => (
    <g fill="#f08a3c" stroke="#6b2f0a" stroke-width="2.5" stroke-linejoin="round">
      <path d="M20 19 C26 19 32 26 31 31 C30 37 24 35 20 35 C16 35 10 37 9 31 C8 26 14 19 20 19 Z" />
      <ellipse cx="7.5" cy="17" rx="3.6" ry="4.8" transform="rotate(-20 7.5 17)" />
      <ellipse cx="15" cy="8.5" rx="3.8" ry="5.2" transform="rotate(-6 15 8.5)" />
      <ellipse cx="25" cy="8.5" rx="3.8" ry="5.2" transform="rotate(6 25 8.5)" />
      <ellipse cx="32.5" cy="17" rx="3.6" ry="4.8" transform="rotate(20 32.5 17)" />
    </g>
  ),
  // Ticket: a red card ticket with notched ends, a punched star and a tear line
  ticket: () => (
    <g transform="rotate(-12 20 20)">
      <path d="M3 10 H37 V16 A4 4 0 0 0 37 24 V30 H3 V24 A4 4 0 0 0 3 16 Z" fill="#ef4b4b" stroke="#6e1212" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M27 13 V27" stroke="#6e1212" stroke-width="2" stroke-dasharray="2.5 2.5" />
      <polygon points="15,13.5 16.9,17.6 21.4,18.1 18,21.1 19,25.5 15,23.2 11,25.5 12,21.1 8.6,18.1 13.1,17.6" fill="#ffe27a" stroke="#6e1212" stroke-width="1.5" stroke-linejoin="round" />
    </g>
  ),
  // Gem: a cut green jewel
  gem: () => (
    <>
      <polygon points="11,5 29,5 37,15 20,37 3,15" fill="#2fcf8f" stroke="#0b5a3c" stroke-width="3" stroke-linejoin="round" />
      <polygon points="11,5 29,5 25,15 15,15" fill="#8ff0c4" />
      <path d="M3 15 H37 M15 15 L20 37 L25 15 M11 5 L15 15 M29 5 L25 15" stroke="#0b5a3c" stroke-width="2" fill="none" stroke-linejoin="round" />
    </>
  ),
  // Pearl: a pearl sitting in an open shell
  pearl: () => (
    <>
      <path d="M3 22 Q20 44 37 22 Q28 27 20 27 Q12 27 3 22 Z" fill="#f29bb7" stroke="#7a2d49" stroke-width="2.5" stroke-linejoin="round" />
      <circle cx="20" cy="15" r="11.5" fill="#fdfdfd" stroke="#6b7a94" stroke-width="2.5" />
      <path d="M26 22 A9 9 0 0 0 28.5 13" stroke="#c9d6ea" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <circle cx="15.5" cy="11" r="3" fill="#ffffff" stroke="#dfe7f5" stroke-width="1" />
    </>
  ),
  // Brick: a red clay brick seen from a corner, with two holes in the top
  brick: () => (
    <>
      <path d="M3 15 L26 9 L37 14 V28 L14 34 L3 29 Z" fill="#c8482c" stroke="#5c1a0c" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M3 15 L14 20 L37 14 L26 9 Z" fill="#e8734f" stroke="#5c1a0c" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M14 20 V34" stroke="#5c1a0c" stroke-width="2.5" />
      <ellipse cx="14.5" cy="15.2" rx="3.4" ry="1.6" fill="#b83d23" transform="rotate(-13 14.5 15.2)" />
      <ellipse cx="25" cy="12.6" rx="3.4" ry="1.6" fill="#b83d23" transform="rotate(-13 25 12.6)" />
    </>
  ),
  // Token: a round red and white fairground ride token with a ridged edge and a star stamped in the middle (no number, no head: not a coin).
  // Drawn bold so it still reads at 16px: a notched white rim, a red face, a big white star.
  token: () => (
    <>
      <polygon points="38.6,20 36.3,22.1 38,24.8 35.2,26.3 36.1,29.3 33,30 33.2,33.2 30,33 29.3,36.1 26.3,35.2 24.8,38 22.1,36.3 20,38.6 17.9,36.3 15.2,38 13.7,35.2 10.7,36.1 10,33 6.8,33.2 7,30 3.9,29.3 4.8,26.3 2,24.8 3.7,22.1 1.4,20 3.7,17.9 2,15.2 4.8,13.7 3.9,10.7 7,10 6.8,6.8 10,7 10.7,3.9 13.7,4.8 15.2,2 17.9,3.7 20,1.4 22.1,3.7 24.8,2 26.3,4.8 29.3,3.9 30,7 33.2,6.8 33,10 36.1,10.7 35.2,13.7 38,15.2 36.3,17.9" fill="#ffffff" stroke="#6e1212" stroke-width="2.2" stroke-linejoin="round" />
      <circle cx="20" cy="20" r="12.8" fill="#e63946" stroke="#6e1212" stroke-width="2.2" />
      <polygon points="20,11 22.5,17.1 29.1,17.6 24.1,21.9 25.6,28.4 20,24.9 14.4,28.4 15.9,21.9 10.9,17.6 17.5,17.1" fill="#ffffff" stroke="#6e1212" stroke-width="1.3" stroke-linejoin="round" />
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
