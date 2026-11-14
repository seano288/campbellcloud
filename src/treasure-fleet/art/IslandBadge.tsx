// A little island, as on the sea chart: sand, a palm, its own colours, and an X once he's dug there (the X is drawn by whoever shows it).
import type { Island } from '../fleet/islands';

/** The island drawn centred on 0,0, about 120 across. */
export function IslandArt({ island, dug = false }: { island: Pick<Island, 'id' | 'sand' | 'green' | 'sea'>; dug?: boolean }) {
  const volcano = island.id === 'volcano', skull = island.id === 'skull';
  return (
    <g>
      <ellipse rx="60" ry="34" fill={island.sea} opacity=".35" />
      <path d="M-52 8 Q-50 -24 -16 -26 Q10 -40 36 -22 Q58 -14 54 8 Q40 28 0 26 Q-40 28 -52 8 Z" fill={island.sand} stroke="#2a1a0e" stroke-width="4" stroke-linejoin="round" />
      <path d="M-30 0 Q-24 -20 0 -20 Q22 -24 32 -6 Q20 10 -4 8 Q-24 12 -30 0 Z" fill={island.green} />
      {volcano && <path d="M-14 -6 L0 -44 L14 -6 Z" fill="#6b4a3a" stroke="#2a1a0e" stroke-width="3" />}
      {volcano && <path d="M-4 -44 Q0 -56 6 -44" fill="#ff5a10" stroke="#2a1a0e" stroke-width="2" />}
      {skull && <g transform="translate(0 -14)"><circle r="14" fill="#e6e1d4" stroke="#2a1a0e" stroke-width="3" /><circle cx="-5" cy="-2" r="3.5" fill="#2a1a0e" /><circle cx="5" cy="-2" r="3.5" fill="#2a1a0e" /></g>}
      {!volcano && !skull && <g transform="translate(-8 -10)"><path d="M0 0 Q-2 -18 4 -28" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round" />{[-60, -10, 40, 100, 150].map(a => <ellipse key={a} cx="4" cy="-38" rx="5" ry="12" transform={`rotate(${a} 4 -28)`} fill="#3fa34d" stroke="#2a1a0e" stroke-width="2" />)}</g>}
      {dug && <path d="M10 2 L26 18 M26 2 L10 18" stroke="#c81d25" stroke-width="6" stroke-linecap="round" />}
    </g>
  );
}

export function IslandBadge({ island, class: cls = '', dug = false }: { island: Pick<Island, 'id' | 'sand' | 'green' | 'sea'>; class?: string; dug?: boolean }) {
  return <svg class={`island-badge ${cls}`} viewBox="-64 -64 128 100" aria-hidden="true"><IslandArt island={island} dug={dug} /></svg>;
}
