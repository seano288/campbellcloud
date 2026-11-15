// Animal Parts, Level 1: an animal drawn big with each named part a separate tap target (facts/parts.ts lists them). A part that is
// lit (in a lesson) glows yellow and does its job: wings flap, fins wave, ears turn, legs hop.
import type { ComponentChildren } from 'preact';
import type { AnimalId } from '../facts/animals';

const O = '#1d1d1f';
const L = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

type Parts = Record<string, { draw: ComponentChildren; hit: ComponentChildren }>;
interface Drawing { body: ComponentChildren; parts: Parts; front?: ComponentChildren }

const rect = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} rx={14} />;
const eye = (x: number, y: number, r = 6) => <><circle cx={x} cy={y} r={r} fill={O} /><circle cx={x + r * .35} cy={y - r * .35} r={r * .35} fill="#fff" /></>;

const DRAWINGS: Partial<Record<AnimalId, Drawing>> = {
  bird: {
    body: <>
      <path d="M40 104 L14 118 L22 98 Z" fill="#3d7fd8" {...L} />
      <ellipse cx="96" cy="96" rx="58" ry="40" fill="#5aa9f0" {...L} />
      <circle cx="146" cy="62" r="30" fill="#5aa9f0" {...L} />{eye(154, 56)}
    </>,
    parts: {
      wings: { draw: <path class="flap" d="M70 84 Q96 30 140 70 Q112 74 104 112 Q84 108 70 84 Z" fill="#3d7fd8" {...L} />, hit: rect(64, 34, 82, 80) },
      beak: { draw: <path d="M172 56 L204 66 L172 76 Z" fill="#ffb000" {...L} />, hit: rect(166, 40, 46, 48) },
      feet: { draw: <path d="M86 134 V156 M76 156 H98 M110 134 V156 M100 156 H122" fill="none" stroke="#ff9a1f" stroke-width="7" stroke-linecap="round" />, hit: rect(64, 128, 70, 38) },
    },
  },
  fish: {
    body: <>
      <path d="M40 90 Q70 36 130 44 Q178 54 186 90 Q178 126 130 136 Q70 144 40 90 Z" fill="#ff9a3c" {...L} />{eye(150, 80, 7)}
      <path d="M80 70 Q90 90 80 110 M104 66 Q114 90 104 114" fill="none" stroke="#e8611a" stroke-width="4" />
    </>,
    parts: {
      fins: { draw: <g class="wave"><path d="M40 90 L6 56 L14 90 L6 124 Z" fill="#ffd23f" {...L} /><path d="M96 50 Q110 18 136 46 Z" fill="#ffd23f" {...L} /><path d="M100 132 Q112 160 132 132 Z" fill="#ffd23f" {...L} /></g>, hit: <><rect x={0} y={48} width={44} height={84} rx={14} /><rect x={92} y={14} width={50} height={36} rx={12} /><rect x={94} y={130} width={44} height={34} rx={12} /></> },
      gills: { draw: <path d="M126 64 Q114 90 126 116 M136 68 Q126 90 136 112" fill="none" stroke="#c0392b" stroke-width="6" stroke-linecap="round" />, hit: rect(104, 56, 44, 66) },
      mouth: { draw: <path d="M178 96 Q188 98 186 106 Q178 108 174 102" fill="#c0392b" {...L} />, hit: rect(160, 82, 46, 46) },
    },
  },
  elephant: {
    body: <>
      <path d="M40 72 Q40 34 96 34 Q150 34 152 76 V150 H130 V118 H64 V150 H42 Z" fill="#a9b4bf" {...L} />
      <circle cx="160" cy="72" r="34" fill="#a9b4bf" {...L} />{eye(172, 64, 6)}
      <path d="M176 92 Q186 98 194 94" fill="none" stroke={O} stroke-width="4" />
    </>,
    parts: {
      ears: { draw: <path class="turn" d="M138 48 Q110 50 112 86 Q118 116 146 104 Z" fill="#c6ced6" {...L} />, hit: rect(104, 40, 46, 76) },
      trunk: { draw: <path d="M184 86 Q200 110 192 140 Q186 156 172 150" fill="none" stroke={O} stroke-width="20" stroke-linecap="round" />, hit: rect(164, 82, 44, 76) },
      tail: { draw: <path d="M40 76 Q20 90 26 116" fill="none" stroke={O} stroke-width="6" stroke-linecap="round" />, hit: rect(2, 64, 46, 62) },
    },
    front: <path d="M184 86 Q200 110 192 140 Q186 156 172 150" fill="none" stroke="#a9b4bf" stroke-width="12" stroke-linecap="round" pointer-events="none" />,
  },
  rabbit: {
    body: <>
      <ellipse cx="88" cy="110" rx="56" ry="38" fill="#e6dccf" {...L} />
      <circle cx="32" cy="104" r="14" fill="#fff" {...L} />
      <circle cx="146" cy="84" r="30" fill="#e6dccf" {...L} />{eye(152, 76, 6)}
    </>,
    parts: {
      ears: { draw: <g class="turn"><path d="M130 62 Q112 10 128 6 Q144 14 142 58 Z" fill="#e6dccf" {...L} /><path d="M150 58 Q154 6 170 10 Q178 22 160 64 Z" fill="#e6dccf" {...L} /></g>, hit: rect(108, 0, 76, 64) },
      legs: { draw: <path class="hop" d="M58 128 Q40 150 66 156 H104 Q96 140 84 132 Z" fill="#d8ccbc" {...L} />, hit: rect(36, 122, 76, 44) },
      nose: { draw: <ellipse cx="176" cy="88" rx="7" ry="5" fill="#ff8aa8" {...L} />, hit: rect(158, 68, 46, 46) },
    },
  },
  turtle: {
    body: <>
      <path d="M150 100 Q186 84 196 100 Q194 120 160 116 Z" fill="#7cc46a" {...L} />{eye(184, 98, 5)}
    </>,
    parts: {
      shell: { draw: <><path d="M30 110 Q34 40 102 38 Q166 40 170 110 Z" fill="#8a5a2b" {...L} /><path d="M70 52 L84 80 H120 L134 52 M84 80 L74 108 M120 80 L130 108" fill="none" stroke="#5a3a18" stroke-width="5" /></>, hit: rect(36, 36, 128, 72) },
      legs: { draw: <path class="hop" d="M48 108 L40 140 H62 L66 110 M132 110 L136 140 H158 L152 108" fill="#7cc46a" {...L} />, hit: <><rect x={30} y={106} width={44} height={44} rx={12} /><rect x={126} y={106} width={44} height={44} rx={12} /></> },
      head: { draw: <path d="M150 100 Q186 84 196 100 Q194 120 160 116 Z" fill="#7cc46a" {...L} />, hit: rect(164, 74, 46, 50) },
    },
  },
  giraffe: {
    body: <>
      <path d="M30 92 Q30 70 60 70 H120 Q140 70 140 92 V104 Q140 118 120 118 H60 Q30 118 30 92 Z" fill="#f2c14e" {...L} />
      {[[54, 86], [80, 96], [106, 84], [124, 104], [66, 108]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8} fill="#b8742a" />)}
      <ellipse cx="162" cy="26" rx="24" ry="15" fill="#f2c14e" {...L} />{eye(166, 20, 5)}
      <path d="M150 14 L146 2 M162 12 L162 0" stroke={O} stroke-width="5" stroke-linecap="round" />
    </>,
    parts: {
      neck: { draw: <path d="M122 80 Q140 40 150 30 L162 38 Q150 60 140 96 Z" fill="#f2c14e" {...L} />, hit: rect(118, 26, 50, 72) },
      legs: { draw: <path d="M46 116 V160 M66 116 V160 M110 116 V160 M128 116 V160" stroke={O} stroke-width="11" stroke-linecap="round" />, hit: rect(36, 116, 102, 48) },
      tail: { draw: <path class="swish" d="M30 88 Q14 100 18 124 M14 124 L22 124" fill="none" stroke={O} stroke-width="5" stroke-linecap="round" />, hit: rect(-6, 76, 46, 58) },
    },
  },
};

export const hasDiagram = (id: AnimalId) => !!DRAWINGS[id];
export const diagramParts = (id: AnimalId) => Object.keys(DRAWINGS[id]?.parts ?? {});

/** `lit`: the part a lesson is showing; `wrong`: parts he tapped that weren't it (faded a little, never crossed out). */
export function Diagram({ animal, onTap, lit, wrong = [], right, label }: { animal: AnimalId; onTap?: (part: string) => void; lit?: string | null; wrong?: readonly string[]; right?: string | null; label: string }) {
  const d = DRAWINGS[animal];
  if (!d) return null;
  return (
    <svg class="diagram" viewBox="-6 -10 220 180" role="group" aria-label={label}>
      {d.body}
      {Object.entries(d.parts).map(([name, p]) => (
        <g key={name} class={`part ${lit === name ? 'lit' : ''} ${wrong.includes(name) ? 'wrong' : ''} ${right === name ? 'right' : ''}`} data-part={name}>
          {lit === name && <g class="part-halo">{p.hit}</g>}
          {p.draw}
        </g>
      ))}
      {d.front}
      {onTap && Object.entries(d.parts).map(([name, p]) => (
        <g key={`hit-${name}`} class="part-hit" role="button" aria-label={name} tabIndex={0} data-part={name}
          onClick={() => onTap(name)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTap(name); }}>{p.hit}</g>
      ))}
    </svg>
  );
}
