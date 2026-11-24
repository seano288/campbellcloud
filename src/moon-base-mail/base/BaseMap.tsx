// The Moon Base from above: the grid of plots on grey moon ground, each module on its plot, and tunnels joining modules that stand side
// by side (and each one to the home dome's row), drawn by themselves. In the Base screen every plot is a button: tap a module to pick it
// up, tap a free plot to put it (or the module that has just come) there. The grid grows with each Land Patch; the map scrolls, and only
// what is on screen is drawn.
import { Shown } from '../art/pics';
import { itemOf, isItemId } from './catalog';
import { domeHex, gridSize, HOME, type BaseState } from './base';
import { moduleFor, type GenModule } from './gen';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const CELL = 64;

/** A module made from parts, drawn from above: its colour, its windows and its roof fitting. */
export function GenModuleArt({ m, size = 48 }: { m: GenModule; size?: number }) {
  const shape = m.word === 'Tower' || m.word === 'Cube' || m.word === 'Lab' ? 'square' : m.word === 'Tube' || m.word === 'Hall' ? 'long' : 'round';
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {shape === 'round' && <circle cx="24" cy="24" r="18" fill={m.hex} stroke="#111" stroke-width="3" />}
      {shape === 'square' && <rect x="7" y="7" width="34" height="34" rx="5" fill={m.hex} stroke="#111" stroke-width="3" />}
      {shape === 'long' && <rect x="4" y="13" width="40" height="22" rx="11" fill={m.hex} stroke="#111" stroke-width="3" />}
      {Array.from({ length: m.windows }, (_, i) => <rect key={i} x={12 + i * 7} y="21" width="5" height="5" fill="#ffd23f" stroke="#111" stroke-width="1" />)}
      {m.roof === 'antenna' && <path d="M24 24 L32 6" stroke="#111" stroke-width="2" />}
      {m.roof === 'dish' && <circle cx="30" cy="16" r="5" fill="#c0c7d0" stroke="#111" stroke-width="2" />}
      {m.roof === 'flag' && <path d="M26 24 V8 L36 11 L26 14" fill="#e63946" stroke="#111" stroke-width="2" />}
      {m.roof === 'light' && <circle cx="24" cy="14" r="4" fill="#ff4d4d" stroke="#111" stroke-width="2" />}
      {m.roof === 'wings' && <path d="M2 24 H12 M36 24 H46" stroke="#3a86ff" stroke-width="5" />}
      {m.roof === 'bubble' && <circle cx="24" cy="24" r="8" fill="#9fd3ff" stroke="#111" stroke-width="2" />}
      {m.roof === 'spire' && <path d="M20 20 L24 4 L28 20 Z" fill="#c0c7d0" stroke="#111" stroke-width="2" />}
    </svg>
  );
}

/** What stands on a plot, drawn. */
export function ModuleArt({ id, b, size = 44 }: { id: string; b: Pick<BaseState, 'domePaint'>; size?: number }) {
  if (id === HOME) return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true"><circle cx="24" cy="24" r="20" fill={domeHex(b)} stroke="#111" stroke-width="3" /><circle cx="24" cy="24" r="7" fill="#ffd23f" stroke="#111" stroke-width="2" /><path d="M24 4 V0" stroke="#111" /></svg>
  );
  if (id.startsWith('gen:')) return <GenModuleArt m={moduleFor(Number(id.slice(4)))} size={size} />;
  return isItemId(id) ? <span class="mb-mod" style={{ background: domeHex(b) }}><Shown show={itemOf(id).icon} size={size * 0.75} /></span> : null;
}
/** A module's name as the voice says it: a named one is one clip; a made one is its colour and its word (and its number). */
export const moduleWords = (id: string): string[] => {
  if (!id.startsWith('gen:')) return [moduleName(id)];
  const m = moduleFor(Number(id.slice(4)));
  return [m.colour, m.word, ...(m.number ? ['Number', `${m.number}`] : [])];
};
export const moduleName = (id: string) => (id === HOME ? 'Home Dome' : id.startsWith('gen:') ? (() => { const m = moduleFor(Number(id.slice(4))); return `${m.colour} ${m.word}${m.number ? ` ${m.number}` : ''}`; })() : itemOf(id).name);

export function BaseMap({ b, mini, onPlot, selected, placing }: { b: BaseState; mini?: boolean; onPlot?(key: string): void; selected?: string | null; placing?: boolean }) {
  const { cols, rows } = gridSize(b.more.land);
  const at = (x: number, y: number) => b.placed[`${x},${y}`];
  // tunnels: between modules side by side
  const tunnels: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!at(x, y)) continue;
    if (x + 1 < cols && at(x + 1, y)) tunnels.push({ x1: x, y1: y, x2: x + 1, y2: y });
    if (y + 1 < rows && at(x, y + 1)) tunnels.push({ x1: x, y1: y, x2: x, y2: y + 1 });
  }
  const w = cols * CELL, h = rows * CELL;
  if (mini) {
    return (
      <svg class="mb-map mini" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect width={w} height={h} fill="#8a8f99" />
        {tunnels.map((t, i) => <line key={i} x1={t.x1 * CELL + CELL / 2} y1={t.y1 * CELL + CELL / 2} x2={t.x2 * CELL + CELL / 2} y2={t.y2 * CELL + CELL / 2} stroke="#c0c7d0" stroke-width="14" />)}
        {Object.entries(b.placed).map(([k, id]) => {
          const [x, y] = k.split(',').map(Number) as [number, number];
          const fill = id === HOME ? domeHex(b) : id.startsWith('gen:') ? moduleFor(Number(id.slice(4))).hex : domeHex(b);
          return <circle key={k} cx={x * CELL + CELL / 2} cy={y * CELL + CELL / 2} r={CELL * 0.36} fill={fill} stroke="#111" stroke-width="4" />;
        })}
      </svg>
    );
  }
  return (
    <div class="mb-map-scroll">
      <div class="mb-map" style={{ width: `${w}px`, height: `${h}px` }}>
        <svg class="mb-tunnels" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
          {tunnels.map((t, i) => <line key={i} x1={t.x1 * CELL + CELL / 2} y1={t.y1 * CELL + CELL / 2} x2={t.x2 * CELL + CELL / 2} y2={t.y2 * CELL + CELL / 2} stroke="#c0c7d0" stroke-width="16" stroke-linecap="round" />)}
        </svg>
        {Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => {
          const k = `${x},${y}`, id = at(x, y);
          return (
            <button key={k} class={cls('mb-plot', id ? 'built' : 'free', selected === k && 'picked', placing && !id && 'target')} style={{ left: `${x * CELL}px`, top: `${y * CELL}px` }}
              aria-label={id ? moduleName(id) : `Plot ${y * cols + x + 1}`} onClick={() => onPlot?.(k)}>
              {id && <ModuleArt id={id} b={b} />}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
