// The map symbols, drawn in code: each one a simple shape seen from above, so a symbol on a map, its row in the map key and its spot on
// the sea chart all look the same. Each sits centred on 0,0 in about an 80-unit square. The side views are for From Above's scene.
// The compass rose is drawn here too.
import type { JSX } from 'preact';
import type { Cardinal, KeySym, Sym } from './map';

const O = '#2a1a0e'; // ink: the outline on a parchment map
const line = { stroke: O, 'stroke-width': 4, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };

function Palm() {
  return (
    <g>
      {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-20" rx="11" ry="22" transform={`rotate(${a})`} fill="#3fa34d" {...line} />)}
      <circle r="9" fill="#8a5a2b" {...line} />
    </g>
  );
}
function Hut() {
  return (
    <g>
      <rect x="-26" y="-6" width="52" height="34" fill="#e2b06b" {...line} />
      <path d="M-38 -2 L0 -36 L38 -2 Z" fill="#c9893a" {...line} />
      <path d="M-24 -10 L-12 -20 M12 -20 L24 -10" stroke="#a4682a" stroke-width="3" />
      <rect x="-8" y="8" width="16" height="20" fill="#6b4420" {...line} stroke-width="3" />
    </g>
  );
}
function Cave() {
  return (
    <g>
      <path d="M-34 22 Q-38 -26 0 -32 Q38 -26 34 22 Z" fill="#9a9488" {...line} />
      <path d="M-16 22 Q-16 -6 0 -8 Q16 -6 16 22 Z" fill="#2b2622" {...line} stroke-width="3" />
    </g>
  );
}
function Hill() {
  return (
    <g>
      <path d="M-40 26 Q-34 -30 0 -32 Q34 -30 40 26 Z" fill="#7cc46a" {...line} />
      <path d="M-16 -16 Q-4 -24 8 -20" fill="none" stroke="#b5e3a3" stroke-width="6" stroke-linecap="round" />
      <path d="M-22 12 Q-12 4 -2 10 M8 4 Q18 -2 26 6" fill="none" stroke="#4e8f45" stroke-width="3" stroke-linecap="round" />
    </g>
  );
}
function Rock() {
  return (
    <g>
      <path d="M-30 6 L-22 -20 L2 -28 L26 -16 L32 8 L16 26 L-14 26 Z" fill="#8f8f96" {...line} />
      <path d="M-12 -10 L4 -16 L14 -8" fill="none" stroke="#c5c5cc" stroke-width="4" stroke-linecap="round" />
    </g>
  );
}
function Dock() {
  return (
    <g>
      <rect x="-36" y="-36" width="72" height="72" rx="14" fill="#6fb6e0" stroke="#3d7fa8" stroke-width="3" />
      <rect x="-12" y="-36" width="24" height="60" fill="#b07a3e" {...line} />
      <rect x="-30" y="12" width="60" height="16" fill="#b07a3e" {...line} />
      <path d="M-12 -18 H12 M-12 0 H12" stroke={O} stroke-width="2.5" />
      {[-22, 22].map(x => <circle key={x} cx={x} cy="20" r="5" fill="#6b4420" stroke={O} stroke-width="2.5" />)}
    </g>
  );
}
function Bridge() {
  return (
    <g>
      <rect x="-44" y="-16" width="88" height="32" fill="#b07a3e" {...line} />
      {[-30, -15, 0, 15, 30].map(x => <path key={x} d={`M${x} -16 V16`} stroke={O} stroke-width="2.5" />)}
      <path d="M-44 -20 H44 M-44 20 H44" stroke="#6b4420" stroke-width="5" stroke-linecap="round" />
    </g>
  );
}
/** The river in the key: a little wavy band. */
function RiverMark() {
  return (
    <g>
      <path d="M-14 -38 Q8 -20 -6 0 Q-18 20 6 38 L26 38 Q4 20 14 0 Q28 -20 6 -38 Z" fill="#4aa3df" {...line} />
      <path d="M2 -24 Q8 -14 2 -6 M0 10 Q-6 18 2 26" fill="none" stroke="#bfe6ff" stroke-width="3" stroke-linecap="round" />
    </g>
  );
}

const SYMBOL: Record<KeySym, () => JSX.Element> = { palm: Palm, hut: Hut, cave: Cave, hill: Hill, rock: Rock, dock: Dock, bridge: Bridge, river: RiverMark };
export function Symbol({ sym }: { sym: KeySym }) {
  const Draw = SYMBOL[sym];
  return <Draw />;
}
/** A symbol on its own, for the map key and buttons. */
export function SymbolIcon({ sym, size = '1em' }: { sym: KeySym; size?: string }) {
  return <svg class="sym-icon" viewBox="-46 -46 92 92" width={size} height={size} aria-hidden="true"><Symbol sym={sym} /></svg>;
}

// ---------- the side views, standing on y = 0 ----------

const SIDE: Record<Sym, () => JSX.Element> = {
  palm: () => (
    <g>
      <path d="M-4 0 Q-10 -60 6 -118 L14 -116 Q2 -60 8 0 Z" fill="#9b6a35" {...line} />
      {[-150, -110, -60, -20, 20].map(a => <path key={a} d="M10 -118 q28 -14 52 6 q-28 -4 -52 -6 Z" transform={`rotate(${a + 90} 10 -118)`} fill="#3fa34d" {...line} />)}
      <circle cx="4" cy="-112" r="6" fill="#6b4420" /><circle cx="15" cy="-110" r="6" fill="#6b4420" />
    </g>
  ),
  hut: () => (
    <g>
      <rect x="-40" y="-56" width="80" height="56" fill="#e2b06b" {...line} />
      <path d="M-56 -50 L0 -100 L56 -50 Z" fill="#c9893a" {...line} />
      <rect x="-12" y="-34" width="24" height="34" fill="#6b4420" {...line} stroke-width="3" />
    </g>
  ),
  cave: () => (
    <g>
      <path d="M-66 0 Q-60 -90 0 -96 Q60 -90 66 0 Z" fill="#9a9488" {...line} />
      <path d="M-24 0 Q-24 -46 0 -48 Q24 -46 24 0 Z" fill="#2b2622" {...line} stroke-width="3" />
    </g>
  ),
  hill: () => <path d="M-74 0 Q-40 -84 0 -86 Q40 -84 74 0 Z" fill="#7cc46a" {...line} />,
  rock: () => (
    <g>
      <path d="M-42 0 L-34 -36 L-6 -52 L28 -42 L44 0 Z" fill="#8f8f96" {...line} />
      <path d="M-18 -30 L0 -40 L16 -32" fill="none" stroke="#c5c5cc" stroke-width="4" stroke-linecap="round" />
    </g>
  ),
  dock: () => <rect x="-50" y="-16" width="100" height="16" fill="#b07a3e" {...line} />,
  bridge: () => <rect x="-50" y="-16" width="100" height="16" fill="#b07a3e" {...line} />,
};
export function SideThing({ sym }: { sym: Sym }) {
  const Draw = SIDE[sym];
  return <Draw />;
}

// ---------- the compass rose ----------

const POINTS: Record<Cardinal, { angle: number; letter: string; at: [number, number] }> = {
  north: { angle: 0, letter: 'N', at: [0, -84] }, east: { angle: 90, letter: 'E', at: [84, 0] }, south: { angle: 180, letter: 'S', at: [0, 84] }, west: { angle: 270, letter: 'W', at: [-84, 0] },
};
/** North always up. `lit`: the point to light; `onTap` makes each point a button (the Meeting asks him to tap north). */
export function Rose({ lit = null, big = false, onTap, label = 'Compass rose' }: { lit?: Cardinal | null; big?: boolean; onTap?: (d: Cardinal) => void; label?: string }) {
  return (
    <svg class={`rose ${big ? 'big' : ''} ${lit ? 'has-lit' : ''}`} viewBox="-110 -110 220 220" role="img" aria-label={label}>
      <circle r="62" fill="#f6e7bf" stroke={O} stroke-width="4" />
      <circle r="44" fill="none" stroke={O} stroke-width="2" stroke-dasharray="4 5" />
      {[45, 135, 225, 315].map(a => <path key={a} d="M0 -46 L9 0 L0 9 L-9 0 Z" transform={`rotate(${a})`} fill="#c9b27a" stroke={O} stroke-width="2.5" stroke-linejoin="round" />)}
      {/* the needles first (north last, so it's on top), then the lettered points over them */}
      {(['east', 'south', 'west', 'north'] as const).map(d => (
        <path key={d} d="M0 -70 L14 -8 L0 0 L-14 -8 Z" transform={`rotate(${POINTS[d].angle})`} fill={lit === d ? '#ffd23f' : d === 'north' ? '#d62828' : '#2f4b6e'} stroke={O} stroke-width="3" stroke-linejoin="round" />
      ))}
      <circle r="7" fill={O} />
      {(Object.keys(POINTS) as Cardinal[]).map(d => {
        const p = POINTS[d], on = lit === d;
        return (
          <g key={d} class={`rose-pt ${on ? 'lit' : ''}`} {...(onTap ? { role: 'button', 'aria-label': d[0]!.toUpperCase() + d.slice(1), tabIndex: 0, onClick: () => onTap(d) } : {})}>
            <circle cx={p.at[0]} cy={p.at[1]} r="24" fill={on ? '#ffd23f' : '#fff8e6'} stroke={O} stroke-width="3" />
            <text x={p.at[0]} y={p.at[1] + 9} text-anchor="middle" class="rose-letter">{p.letter}</text>
          </g>
        );
      })}
    </svg>
  );
}
