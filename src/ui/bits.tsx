import type { ComponentChildren } from 'preact';
import { game } from '../game/store';
import type { Outcome } from '../learning/session';

export function Bolt({ size }: { size: number }) {
  return (
    <svg class="bolt" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#ffc21a" stroke="#7a5200" stroke-width="3" />
      <circle cx="20" cy="20" r="7" fill="#e0a000" stroke="#7a5200" stroke-width="2.5" />
    </svg>
  );
}

export function BoltPile({ count = game.value.bolts }: { count?: number }) {
  return <div class="pilebox" aria-label={`${count} Bolts`}><Bolt size={34} /><span>{count}</span></div>;
}

/** One star per answered problem; one that wasn't right on the first try without help is only half lit. */
export function Stars({ results }: { results: readonly Outcome[] }) {
  return <div class="stars">{[0, 1, 2, 3, 4].map(i => <span key={i} class={results[i] === 'clean' ? 'on' : results[i] ? 'on half' : ''}>⭐</span>)}</div>;
}

export function LevelDots({ level }: { level: number }) {
  return <span class="lvl" aria-label={`Level ${level}`}>{[1, 2, 3].map(i => <i key={i} class={i <= level ? 'on' : ''} />)}</span>;
}

export function IconButton({ onClick, label, class: cls = '', children }: { onClick: () => void; label: string; class?: string; children: ComponentChildren }) {
  return <button class={`icon-btn ${cls}`} aria-label={label} onClick={onClick}>{children}</button>;
}

/** The little red Truck drawn in 2D, for the Home tile and the celebration road. */
export function TruckArt({ color = '#e63946' }: { color?: string }) {
  return (
    <svg viewBox="0 0 130 90" class="truck" aria-hidden="true">
      <path d="M34 48 L40 62 M96 48 L90 62" stroke="#555" stroke-width="5" />
      <path d="M44 26 L54 6 H84 L94 26 Z" fill={color} />
      <path d="M57 10 H81 L88 25 H50 Z" fill="#bfe3ff" />
      <rect x="12" y="24" width="106" height="26" rx="7" fill={color} />
      <rect x="110" y="30" width="10" height="7" rx="2" fill="#ffd23f" />
      <path d="M16 44 Q30 30 38 40 Q44 28 52 40 Q58 32 64 44 Z" fill="#ffd23f" />
      {[34, 96].map(x => (
        <g key={x}>
          <circle cx={x} cy="68" r="20" fill="#1a1a1a" />
          <circle cx={x} cy="68" r="20" fill="none" stroke="#333" stroke-width="4" stroke-dasharray="5 4" />
          <circle cx={x} cy="68" r="8" fill="#bbb" />
        </g>
      ))}
    </svg>
  );
}
