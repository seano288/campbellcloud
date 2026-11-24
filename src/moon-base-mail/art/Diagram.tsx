// The Fact File's labelled pictures, drawn in code. Each part has a written label (in Andika) that is a button: he reads the labels and
// taps the part the question asks for. A thin line joins each label to its part.
import type { JSX } from 'preact';
import { DIAGRAMS, type DiagramId } from '../mail/diagrams';

const S = { stroke: '#111', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

/** Where each part is (in the 300 by 200 picture), and where its label sits (as a share of the picture's width and height). */
const LAYOUT: Record<DiagramId, { draw: () => JSX.Element; parts: Record<string, { at: [number, number]; label: [number, number] }> }> = {
  lander: {
    draw: () => <g {...S}><path d="M110 40 H190 L204 110 H96 Z" fill="#f2f2f2" /><rect x="136" y="60" width="28" height="36" rx="4" fill="#5b6270" /><path d="M100 110 L66 180 M200 110 L234 180 M120 110 L108 180 M180 110 L192 180" /><path d="M58 180 H76 M224 180 H244" /><path d="M128 110 H172 L162 132 H138 Z" fill="#5b6270" /><path d="M140 132 L150 160 L160 132" fill="#ff8c1a" /><path d="M196 110 L204 150 M204 120 H214 M206 135 H216" /><line x1="0" y1="190" x2="300" y2="190" /></g>,
    parts: { hatch: { at: [150, 78], label: [0.16, 0.18] }, ladder: { at: [208, 135], label: [0.86, 0.42] }, legs: { at: [80, 165], label: [0.12, 0.72] }, rocket: { at: [150, 145], label: [0.62, 0.9] } },
  },
  suit: {
    draw: () => <g {...S}><circle cx="150" cy="44" r="30" fill="#f2f2f2" /><rect x="130" y="34" width="40" height="18" rx="8" fill="#e8b923" /><rect x="112" y="80" width="76" height="66" rx="16" fill="#f2f2f2" /><rect x="186" y="84" width="26" height="52" rx="6" fill="#c0c7d0" /><path d="M112 92 L76 132 M188 92 L224 132" stroke-width="14" stroke="#f2f2f2" /><path d="M112 92 L76 132 M188 92 L224 132" fill="none" /><circle cx="72" cy="138" r="12" fill="#ffffff" /><circle cx="228" cy="138" r="12" fill="#ffffff" /><path d="M130 146 V178 M170 146 V178" stroke-width="16" stroke="#f2f2f2" /><rect x="114" y="174" width="32" height="18" rx="6" fill="#5b6270" /><rect x="156" y="174" width="32" height="18" rx="6" fill="#5b6270" /></g>,
    parts: { helmet: { at: [150, 44], label: [0.18, 0.12] }, backpack: { at: [200, 110], label: [0.86, 0.3] }, hands: { at: [72, 138], label: [0.12, 0.55] }, boots: { at: [170, 184], label: [0.84, 0.88] } },
  },
  rover: {
    draw: () => <g {...S}><rect x="60" y="96" width="180" height="36" rx="8" fill="#e63946" /><rect x="96" y="70" width="70" height="26" fill="#9fd3ff" /><rect x="196" y="76" width="40" height="20" fill="#8a6d3b" /><line x1="80" y1="96" x2="80" y2="44" /><path d="M62 44 Q80 22 98 44 Z" fill="#c0c7d0" /><circle cx="238" cy="104" r="7" fill="#ffd23f" /><circle cx="88" cy="150" r="20" fill="#333" /><circle cx="150" cy="150" r="20" fill="#333" /><circle cx="212" cy="150" r="20" fill="#333" /><line x1="0" y1="172" x2="300" y2="172" /></g>,
    parts: { dish: { at: [80, 38], label: [0.1, 0.12] }, light: { at: [238, 104], label: [0.9, 0.38] }, box: { at: [216, 84], label: [0.8, 0.1] }, wheels: { at: [150, 150], label: [0.5, 0.95] } },
  },
  sky: {
    draw: () => <g {...S}><rect x="0" y="0" width="300" height="200" fill="#151a2e" stroke="none" /><circle cx="62" cy="100" r="44" fill="#ffd23f" /><circle cx="200" cy="100" r="22" fill="#3a86ff" /><path d="M190 92 Q200 86 208 96 Q200 108 192 104 Z" fill="#2ec45a" stroke="none" /><circle cx="262" cy="70" r="9" fill="#c0c7d0" /><ellipse cx="200" cy="100" rx="62" ry="40" fill="none" stroke="#fff" stroke-dasharray="4 6" stroke-width="2" /></g>,
    parts: { sun: { at: [62, 100], label: [0.2, 0.86] }, Earth: { at: [200, 100], label: [0.6, 0.88] }, moon: { at: [262, 70], label: [0.88, 0.14] } },
  },
  ground: {
    draw: () => <g {...S}><rect x="0" y="0" width="300" height="200" fill="#151a2e" stroke="none" /><path d="M0 90 Q80 70 150 90 Q230 110 300 86 V200 H0 Z" fill="#7d828c" /><ellipse cx="92" cy="130" rx="54" ry="16" fill="#4b4f57" /><path d="M200 70 L230 52 L252 66 L246 86 L214 90 Z" fill="#9aa0ab" /><path d="M186 150 q6 -10 12 0 q-6 10 -12 0 M214 166 q6 -10 12 0 q-6 10 -12 0 M242 152 q6 -10 12 0 q-6 10 -12 0" fill="#4b4f57" /><circle cx="40" cy="176" r="3" fill="#b9bdc5" /><circle cx="60" cy="184" r="3" fill="#b9bdc5" /><circle cx="150" cy="186" r="3" fill="#b9bdc5" /></g>,
    parts: { crater: { at: [92, 130], label: [0.16, 0.5] }, rock: { at: [228, 72], label: [0.76, 0.12] }, dust: { at: [60, 182], label: [0.1, 0.9] }, footprint: { at: [214, 160], label: [0.84, 0.66] } },
  },
  telescope: {
    draw: () => <g {...S}><path d="M70 110 L210 50 L224 82 L84 142 Z" fill="#f2f2f2" /><ellipse cx="217" cy="66" rx="10" ry="18" transform="rotate(-23 217 66)" fill="#9fd3ff" /><rect x="58" y="112" width="26" height="22" rx="4" transform="rotate(-23 71 123)" fill="#5b6270" /><path d="M150 100 L110 180 M150 100 L150 182 M150 100 L190 180" /></g>,
    parts: { 'big end': { at: [218, 66], label: [0.86, 0.14] }, 'little end': { at: [70, 124], label: [0.14, 0.38] }, legs: { at: [150, 160], label: [0.82, 0.86] } },
  },
  earth: {
    draw: () => <g {...S}><rect x="0" y="0" width="300" height="200" fill="#151a2e" stroke="none" /><circle cx="150" cy="100" r="74" fill="#3a86ff" /><path d="M110 60 Q130 40 160 52 Q150 80 124 78 Z M160 120 Q190 110 200 140 Q170 160 156 140 Z" fill="#2ec45a" /><path d="M92 92 Q120 84 140 96 M160 80 Q190 70 214 86 M100 130 Q130 140 150 126" stroke="#ffffff" stroke-width="8" fill="none" /><path d="M120 34 Q150 24 180 34 Q150 44 120 34 Z" fill="#ffffff" /><circle cx="40" cy="30" r="2" fill="#fff" stroke="none" /><circle cx="262" cy="170" r="2" fill="#fff" stroke="none" /></g>,
    parts: { blue: { at: [120, 150], label: [0.14, 0.86] }, white: { at: [150, 34], label: [0.84, 0.1] }, space: { at: [262, 170], label: [0.86, 0.8] } },
  },
};

export function Diagram({ id, onTap, lit, wrong, disabled }: { id: DiagramId; onTap(part: string): void; lit: string | null; wrong: readonly string[]; disabled: boolean }) {
  const d = LAYOUT[id];
  return (
    <div class="mb-diagram">
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {d.draw()}
        {DIAGRAMS[id].map(part => { const p = d.parts[part]!; return <line key={part} x1={p.at[0]} y1={p.at[1]} x2={p.label[0] * 300} y2={p.label[1] * 200} stroke={lit === part ? '#ffd23f' : '#ffffff'} stroke-width="2.5" stroke-dasharray="3 3" />; })}
      </svg>
      {DIAGRAMS[id].map(part => {
        const p = d.parts[part]!;
        return (
          <button key={part} class={`mb-label ${lit === part ? 'hint' : ''} ${wrong.includes(part) ? 'wrong' : ''}`} lang="en" disabled={disabled && lit !== part}
            style={{ left: `${p.label[0] * 100}%`, top: `${p.label[1] * 100}%` }} aria-label={part} onClick={() => onTap(part)}>{part}</button>
        );
      })}
    </div>
  );
}
