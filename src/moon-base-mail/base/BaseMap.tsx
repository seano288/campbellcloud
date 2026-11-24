// The Moon Base map: the grid of plots on grey moon ground seen from above, each module standing on its plot (drawn from the front, as
// in art/modules.ts), and tunnels joining modules that stand side by side, drawn by themselves. Plots are as large as lets the whole
// grid fit, so a small base is drawn big. In the Base screen every plot is a button: tap a module to pick it
// up, tap a free plot to put it (or the module that has just come) there. The grid grows with each Land Patch without end; the map
// scrolls, and only the plots on screen (and a margin round them) are drawn, so a base of thousands of plots stays quick on an iPad.
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ModuleArt } from '../art/bits';
import { itemOf } from './catalog';
import { gridSize, HOME, type BaseState } from './base';
import { moduleFor } from './gen';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
/** A plot's size: as big as lets the whole grid fit the map (so a small base is drawn large), but never under 64px or over 132px. */
const MIN_CELL = 64, MAX_CELL = 132;
const cellFor = (w: number, h: number, cols: number, rows: number) => Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(Math.min(w / cols, h / rows))));

/** A module's name as the voice says it: a named one is one clip; a made one is its colour and its word (and its number). */
export const moduleWords = (id: string): string[] => {
  if (!id.startsWith('gen:')) return [moduleName(id)];
  const m = moduleFor(Number(id.slice(4)));
  return [m.colour, m.word, ...(m.number ? ['Number', `${m.number}`] : [])];
};
export const moduleName = (id: string) => (id === HOME ? 'Home Dome' : id.startsWith('gen:') ? (() => { const m = moduleFor(Number(id.slice(4))); return `${m.colour} ${m.word}${m.number ? ` ${m.number}` : ''}`; })() : itemOf(id).name);

export function BaseMap({ b, onPlot, selected, placing }: { b: BaseState; onPlot?(key: string): void; selected?: string | null; placing?: boolean }) {
  const { cols, rows } = gridSize(b.more.land);
  const at = (x: number, y: number) => b.placed[`${x},${y}`];
  // tunnels: between modules side by side
  const tunnels: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!at(x, y)) continue;
    if (x + 1 < cols && at(x + 1, y)) tunnels.push({ x1: x, y1: y, x2: x + 1, y2: y });
    if (y + 1 < rows && at(x, y + 1)) tunnels.push({ x1: x, y1: y, x2: x, y2: y + 1 });
  }
  const scroller = useRef<HTMLDivElement>(null), [win, setWin] = useState<Window>(FIRST_WINDOW), [cell, setCell] = useState(MIN_CELL);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const c = cellFor(el.clientWidth - 16, el.clientHeight - 16, cols, rows);
      setCell(c);
      setWin(old => { const next = windowOf(el, c); return sameWindow(old, next) ? old : next; });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const seen = new ResizeObserver(update);
    seen.observe(el);
    return () => { el.removeEventListener('scroll', update); seen.disconnect(); };
  }, [cols, rows]);
  const w = cols * cell, h = rows * cell, mid = (n: number) => n * cell + cell / 2, tube = Math.round(cell * 0.2);
  return (
    <div class="mb-map-scroll" ref={scroller}>
      <div class="mb-map" style={{ width: `${w}px`, height: `${h}px`, '--cell': `${cell}px` } as Record<string, string>}>
        <svg class="mb-tunnels" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
          {tunnels.filter(t => inWindow(win, t.x1, t.y1) || inWindow(win, t.x2, t.y2)).map((t, i) => (
            <g key={i}>
              <line x1={mid(t.x1)} y1={mid(t.y1) + cell * 0.22} x2={mid(t.x2)} y2={mid(t.y2) + cell * 0.22} stroke="#14161b" stroke-width={tube + 6} stroke-linecap="round" />
              <line x1={mid(t.x1)} y1={mid(t.y1) + cell * 0.22} x2={mid(t.x2)} y2={mid(t.y2) + cell * 0.22} stroke="#d9dde3" stroke-width={tube} stroke-linecap="round" />
            </g>
          ))}
        </svg>
        {range(win.y0, Math.min(rows, win.y1)).map(y => range(win.x0, Math.min(cols, win.x1)).map(x => {
          const k = `${x},${y}`, id = at(x, y);
          return (
            <button key={k} class={cls('mb-plot', id ? 'built' : 'free', selected === k && 'picked', placing && !id && 'target')}
              style={{ left: `${x * cell}px`, top: `${y * cell}px`, width: `${cell}px`, height: `${cell}px` }}
              aria-label={id ? moduleName(id) : `Plot ${y * cols + x + 1}`} onClick={() => onPlot?.(k)}>
              {id && <ModuleArt id={id} b={b} size={Math.round(cell * 0.94)} />}
            </button>
          );
        }))}
      </div>
    </div>
  );
}

// ---------- drawing only what is on screen ----------

/** The plots drawn: columns x0 to x1 and rows y0 to y1 (x1 and y1 not included). */
interface Window { x0: number; y0: number; x1: number; y1: number }
/** Before the map has been measured: enough for any screen the base starts on. */
const FIRST_WINDOW: Window = { x0: 0, y0: 0, x1: 32, y1: 32 };
/** Plots drawn past the edge of the screen, so a quick scroll doesn't show an empty edge. */
const MARGIN = 3;
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const inWindow = (w: Window, x: number, y: number) => x >= w.x0 && x < w.x1 && y >= w.y0 && y < w.y1;
const sameWindow = (a: Window, b: Window) => a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1;
function windowOf(scroller: HTMLElement, cell: number): Window {
  // where the screen is over the map (the map is centred in the scroller while it is smaller than it)
  const map = scroller.firstElementChild?.getBoundingClientRect(), box = scroller.getBoundingClientRect();
  const left = map ? box.left - map.left : 0, top = map ? box.top - map.top : 0;
  return {
    x0: Math.max(0, Math.floor(left / cell) - MARGIN), y0: Math.max(0, Math.floor(top / cell) - MARGIN),
    x1: Math.ceil((left + scroller.clientWidth) / cell) + MARGIN, y1: Math.ceil((top + scroller.clientHeight) / cell) + MARGIN,
  };
}
