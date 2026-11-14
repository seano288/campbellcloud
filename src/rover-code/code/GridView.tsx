// The grid on screen: space-rock ground in squares, boulders, the flag, and the rover seen from above, turned the way it last drove so
// "which way" is always visible. It draws whatever the lesson says (lesson.ts): where the rover is in a run, a crash, and a way across
// with numbered squares. Arrows are drawn here too, the same everywhere: on the pad, in the program and in patterns.
import type { JSX } from 'preact';
import type { Cell, Dir, Grid } from './grid';
import { MOVE } from './grid';
import type { Lesson } from './teach';

const ANGLE: Record<Dir, number> = { R: 0, D: 90, L: 180, U: 270 };
const S = 100;

export function Arrow({ dir, size = '1em', class: cls = '' }: { dir: Dir; size?: string; class?: string }) {
  return (
    <svg class={`arrow-art ${cls}`} viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
      <path transform={`rotate(${ANGLE[dir]})`} d="M-36 -13 H6 V-32 L40 0 L6 32 V13 H-36 Z" fill="currentColor" stroke="#000" stroke-width="7" stroke-linejoin="round" />
    </svg>
  );
}

/** The rover from above, facing right at 0°. */
export function RoverTop({ angle = 0 }: { angle?: number }) {
  return (
    <g transform={`rotate(${angle})`}>
      {[-24, 0, 24].flatMap(x => [-1, 1].map(s => <rect key={`${x}${s}`} x={x - 10} y={s * 28 - 7} width="20" height="14" rx="4" fill="#1d1d1f" />))}
      <rect x="-32" y="-24" width="64" height="48" rx="12" fill="#ffd23f" stroke="#000" stroke-width="5" />
      <rect x="-25" y="-15" width="28" height="30" rx="4" fill="#2f6fd6" stroke="#000" stroke-width="3" />
      <path d="M-11 -15 V15 M-25 0 H3" stroke="#9cc8ff" stroke-width="2.5" />
      <circle cx="18" cy="0" r="11" fill="#fff" stroke="#000" stroke-width="4" />
      <circle cx="22" cy="0" r="4.5" fill="#1d1d1f" />
    </g>
  );
}

function Flag() {
  return (
    <g>
      <ellipse cx="0" cy="30" rx="30" ry="9" fill="#3ddc8466" stroke="#3ddc84" stroke-width="3" />
      <path d="M-10 32 V-34" stroke="#000" stroke-width="7" stroke-linecap="round" />
      <path d="M-10 32 V-34" stroke="#e6e9ef" stroke-width="3" stroke-linecap="round" />
      <path d="M-8 -34 L30 -22 L-8 -8 Z" fill="#3ddc84" stroke="#000" stroke-width="5" stroke-linejoin="round" />
    </g>
  );
}

function Rock({ seed }: { seed: number }) {
  const r = (n: number) => 26 + ((seed * 7 + n * 13) % 9);
  const pts = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 + seed; return `${(Math.cos(a) * r(i)).toFixed(1)},${(Math.sin(a) * r(i) * .82 + 4).toFixed(1)}`; }).join(' ');
  return (
    <g>
      <polygon points={pts} fill="#8a8494" stroke="#000" stroke-width="5" stroke-linejoin="round" />
      <path d="M-12 -6 Q-4 -14 8 -10" stroke="#c4bfcc" stroke-width="5" fill="none" stroke-linecap="round" />
    </g>
  );
}

function Boom() {
  const pts = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 18 : 40; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  return <polygon class="boom" points={pts} fill="#ffb02e" stroke="#000" stroke-width="4" stroke-linejoin="round" />;
}

const at = (c: Cell) => `translate(${c.x * S + S / 2} ${c.y * S + S / 2})`;

/** Which way the rover faces after `k` steps of a run: the way it last moved, or right before it has moved. */
function facing(cells: readonly Cell[], k: number, crash: Cell | null, start: Dir): number {
  const from = cells[Math.min(k, cells.length - 1)]!;
  const to = crash ?? (k > 0 ? from : null), prev = crash ? from : k > 0 ? cells[k - 1]! : null;
  if (!to || !prev) return ANGLE[start];
  const dx = to.x - prev.x, dy = to.y - prev.y;
  const dir = (Object.keys(MOVE) as Dir[]).find(d => MOVE[d][0] === Math.sign(dx) && MOVE[d][1] === Math.sign(dy));
  return dir ? ANGLE[dir] : ANGLE[start];
}

export function GridView({ grid, lesson, face = 'R', label }: { grid: Grid; lesson: Lesson; face?: Dir; label: string }) {
  const run = lesson.run.value, trail = lesson.trail.value, counted = lesson.counted.value;
  const here = run ? run.cells[Math.min(run.at, run.cells.length - 1)]! : grid.start;
  const angle = run ? facing(run.cells, run.at, run.crash, face) : ANGLE[face];
  const tiles: JSX.Element[] = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
    tiles.push(<rect key={`t${x},${y}`} x={x * S + 2} y={y * S + 2} width={S - 4} height={S - 4} rx="12" class={(x + y) % 2 ? 'tile-b' : 'tile-a'} />);
  }
  return (
    <svg class="rc-grid" viewBox={`-6 -6 ${grid.w * S + 12} ${grid.h * S + 12}`} role="img" aria-label={label}>
      <rect x="-6" y="-6" width={grid.w * S + 12} height={grid.h * S + 12} rx="18" class="grid-floor" />
      {tiles}
      {trail?.map((c, i) => (
        <g key={`w${i}`} transform={at(c)} class={`way ${i > 0 && i <= counted ? 'on' : ''}`}>
          {i > 0 && <circle r="16" />}
          {i > 0 && i <= counted && <text y="9" text-anchor="middle">{i}</text>}
        </g>
      ))}
      {grid.rocks.map((c, i) => <g key={`r${i}`} transform={at(c)}><Rock seed={i + c.x * 3 + c.y} /></g>)}
      <g transform={at(grid.goal)}><Flag /></g>
      <g class="rover-pos" style={{ transform: `translate(${here.x * S + S / 2}px, ${here.y * S + S / 2}px)` }}>
        <g class="rover-turn" style={{ transform: `rotate(${angle}deg)` }}><RoverTop /></g>
      </g>
      {run?.crash && <g transform={at(run.crash)}><Boom /></g>}
    </svg>
  );
}
