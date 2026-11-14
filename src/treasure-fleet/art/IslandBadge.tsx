// A little island, as on the sea chart: sand, a palm (or its own landmark), its own colours, and an X once he's dug there.
import type { JSX } from 'preact';
import type { Island } from '../fleet/islands';

const K = { stroke: '#2a1a0e', 'stroke-width': 3, 'stroke-linejoin': 'round' as const };
/** The landmark that stands on some islands instead of a palm, so each looks like its name on the sea chart. */
const MARKS: Partial<Record<string, JSX.Element>> = {
  shell: <path d="M-16 -4 Q-14 -34 0 -36 Q14 -34 16 -4 Z M-8 -6 L-3 -32 M0 -6 V-34 M8 -6 L3 -32" fill="#ffb3c7" {...K} />,
  iceberg: <path d="M-24 -4 L-10 -40 L0 -26 L10 -48 L26 -4 Z" fill="#f4fbff" {...K} />,
  banana: <g transform="translate(-8 -10)"><path d="M0 0 Q-2 -18 4 -28" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round" />{[-40, 30, 110].map(a => <ellipse key={a} cx="4" cy="-38" rx="6" ry="12" transform={`rotate(${a} 4 -28)`} fill="#3fa34d" {...K} stroke-width="2" />)}<path d="M2 -26 Q10 -18 16 -26 M4 -24 Q12 -14 18 -20" stroke="#ffe14d" stroke-width="5" fill="none" stroke-linecap="round" /></g>,
  lighthouse: <g><path d="M-8 -2 L-6 -40 L6 -40 L8 -2 Z" fill="#fff" {...K} /><path d="M-7 -14 H7 M-6.5 -28 H6.5" stroke="#d62828" stroke-width="6" /><rect x="-7" y="-50" width="14" height="10" fill="#ffd23f" {...K} /><path d="M-7 -50 L0 -58 L7 -50" fill="#d62828" {...K} /></g>,
  wreck: <g><path d="M-26 -2 L-20 -16 L18 -10 L24 -2 Z" fill="#7e4a24" {...K} /><path d="M-2 -14 L6 -44" stroke="#2a1a0e" stroke-width="6" stroke-linecap="round" /><path d="M6 -44 L-10 -34 L4 -28" fill="#e8dcc0" {...K} stroke-width="2" /></g>,
  thunder: <g><path d="M-26 -30 Q-28 -46 -12 -44 Q-6 -58 10 -50 Q26 -54 26 -38 Q30 -28 18 -28 H-20 Q-30 -26 -26 -30 Z" fill="#7d8597" {...K} /><path d="M2 -28 L-6 -12 L2 -12 L-4 2" fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></g>,
  ghost: <g><path d="M-14 0 V-30 Q-14 -46 0 -46 Q14 -46 14 -30 V0 L8 -6 L2 0 L-4 -6 L-10 0 Z" fill="#eef4ff" {...K} /><circle cx="-5" cy="-30" r="3" fill="#2a1a0e" /><circle cx="5" cy="-30" r="3" fill="#2a1a0e" /></g>,
  rainbow: <g fill="none" stroke-linecap="round">{['#ff5a5a', '#ffb02e', '#ffe14d', '#4cd07a', '#4aa8ff'].map((c, i) => <path key={c} d={`M${-34 + i * 5} -2 A${34 - i * 5} ${34 - i * 5} 0 0 1 ${34 - i * 5} -2`} stroke={c} stroke-width="5" />)}</g>,
};

/** The island drawn centred on 0,0, about 120 across. */
export function IslandArt({ island, dug = false }: { island: Pick<Island, 'id' | 'sand' | 'green' | 'sea'>; dug?: boolean }) {
  const volcano = island.id === 'volcano', skull = island.id === 'skull', mark = MARKS[island.id];
  return (
    <g>
      <ellipse rx="60" ry="34" fill={island.sea} opacity=".35" />
      <path d="M-52 8 Q-50 -24 -16 -26 Q10 -40 36 -22 Q58 -14 54 8 Q40 28 0 26 Q-40 28 -52 8 Z" fill={island.sand} stroke="#2a1a0e" stroke-width="4" stroke-linejoin="round" />
      <path d="M-30 0 Q-24 -20 0 -20 Q22 -24 32 -6 Q20 10 -4 8 Q-24 12 -30 0 Z" fill={island.green} />
      {volcano && <path d="M-14 -6 L0 -44 L14 -6 Z" fill="#6b4a3a" stroke="#2a1a0e" stroke-width="3" />}
      {volcano && <path d="M-4 -44 Q0 -56 6 -44" fill="#ff5a10" stroke="#2a1a0e" stroke-width="2" />}
      {skull && <g transform="translate(0 -14)"><circle r="14" fill="#e6e1d4" stroke="#2a1a0e" stroke-width="3" /><circle cx="-5" cy="-2" r="3.5" fill="#2a1a0e" /><circle cx="5" cy="-2" r="3.5" fill="#2a1a0e" /></g>}
      {mark}
      {!volcano && !skull && !mark && <g transform="translate(-8 -10)"><path d="M0 0 Q-2 -18 4 -28" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round" />{[-60, -10, 40, 100, 150].map(a => <ellipse key={a} cx="4" cy="-38" rx="5" ry="12" transform={`rotate(${a} 4 -28)`} fill="#3fa34d" stroke="#2a1a0e" stroke-width="2" />)}</g>}
      {dug && <path d="M10 2 L26 18 M26 2 L10 18" stroke="#c81d25" stroke-width="6" stroke-linecap="round" />}
    </g>
  );
}

export function IslandBadge({ island, class: cls = '', dug = false }: { island: Pick<Island, 'id' | 'sand' | 'green' | 'sea'>; class?: string; dug?: boolean }) {
  return <svg class={`island-badge ${cls}`} viewBox="-64 -64 128 100" aria-hidden="true"><IslandArt island={island} dug={dug} /></svg>;
}
