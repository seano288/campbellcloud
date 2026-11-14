// A map on screen: parchment with a strip of sea round the island, the things on it as symbols, and whatever the lesson draws on top
// (an arrow sweeping one way, a glowing answer, a lit column and row, a dotted line of clues). It's an SVG, so it fits any screen;
// the things (or, for Grid Square and Follow the Clues, the squares) are its buttons.
import type { JSX } from 'preact';
import { cellId, letterOf, numberOf, same, STEP, type Cell, type IsleMap } from './map';
import { Symbol } from './art';
import type { Lesson } from './teach';

export const S = 100;
/** Grid Square's column letters each have a colour, used again where the square is written, so B and C can be told apart by eye too. */
export const LETTER_COLOURS = ['#c81d25', '#1f5fd1', '#178046', '#c25e00', '#6b3fb8'] as const;
const NAMES: Record<string, string> = { palm: 'Palm tree', hut: 'Hut', cave: 'Cave', hill: 'Hill', rock: 'Rock', dock: 'Dock', bridge: 'Bridge' };

/** A gently wavy coastline round the land, the same for every map of a size. */
function coast(w: number, h: number) {
  const W = w * S, H = h * S, per = 2 * (W + H), n = 2 * (w + h) * 2, pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / n) * per, wob = 9 * Math.sin(i * 2.3) + 5 * Math.cos(i * 1.1);
    if (d < W) pts.push([d, -14 - wob]); else if (d < W + H) pts.push([W + 14 + wob, d - W]); else if (d < 2 * W + H) pts.push([W - (d - W - H), H + 14 + wob]); else pts.push([-14 - wob, H - (d - 2 * W - H)]);
  }
  // a smooth curve through the midpoints, so the shore has no sharp corners
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2].map(v => v.toFixed(1)).join(' ');
  return `M${mid(pts.at(-1)!, pts[0]!)} ` + pts.map((p, i) => `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mid(p, pts[(i + 1) % pts.length]!)}`).join(' ') + ' Z';
}

const centre = (c: Cell) => ({ cx: c.x * S + S / 2, cy: c.y * S + S / 2 });

export interface MapViewProps {
  map: IsleMap;
  lesson?: Lesson | null;
  /** What he can tap: the things, every square, or nothing. */
  tap?: 'things' | 'cells' | null;
  onTap?: (c: Cell) => void;
  /** Grid Square: letters along the bottom, numbers up the side, and the squares drawn. */
  labels?: boolean;
  /** Follow the Clues: the squares drawn, without labels. */
  squares?: boolean;
  start?: Cell | null;
  /** Squares he tapped that weren't it, and the one that was. */
  wrong?: readonly string[];
  right?: string | null;
  label: string;
  class?: string;
}

export function MapView({ map, lesson, tap = null, onTap, labels = false, squares = false, start = null, wrong = [], right = null, label, class: cls = '' }: MapViewProps) {
  const W = map.w * S, H = map.h * S, pad = squares ? 22 : 34, left = labels ? 70 : pad, bottom = labels ? 74 : pad;
  const glow = lesson?.glow.value ?? [], pulse = lesson?.pulse.value ?? [], ray = lesson?.ray.value ?? null, span = lesson?.span.value ?? null;
  const col = lesson?.col.value ?? null, row = lesson?.row.value ?? null, path = lesson?.path.value ?? null, counted = lesson?.counted.value ?? [];
  const parts: JSX.Element[] = [];
  const grid = labels || squares;
  if (grid) for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const on = (col === x) || (row === y), meet = col === x && row === y;
    parts.push(<rect key={`g${x},${y}`} x={x * S + 3} y={y * S + 3} width={S - 6} height={S - 6} rx="10" class={`sq ${on ? 'on' : ''} ${meet ? 'meet' : ''}`} />);
  }
  return (
    <svg class={`isle-map ${cls}`} viewBox={`${-left} ${-pad} ${W + left + pad} ${H + pad + bottom}`} role="group" aria-label={label}>
      <rect x={-left} y={-pad} width={W + left + pad} height={H + pad + bottom} rx="22" class="parchment" />
      <rect x={-pad + 8} y={-pad + 8} width={W + 2 * pad - 16} height={H + 2 * pad - 16} rx="16" class="sea" />
      <path d={coast(map.w, map.h)} class="land" />
      {map.river !== null && <path d={riverPath(map.river, map.h)} class={`river ${lesson?.riverLit.value ? 'lit' : ''}`} />}
      {parts}
      {grid && <rect x="0" y="0" width={W} height={H} class="grid-edge" />}
      {labels && Array.from({ length: map.w }, (_, x) => (
        <text key={`l${x}`} x={x * S + S / 2} y={H + 58} text-anchor="middle" class={`gl letter ${col === x ? 'on' : ''}`} fill={LETTER_COLOURS[x]}>{letterOf(x)}</text>
      ))}
      {labels && Array.from({ length: map.h }, (_, y) => (
        <text key={`n${y}`} x={-36} y={y * S + S / 2 + 16} text-anchor="middle" class={`gl number ${row === y ? 'on' : ''}`}>{numberOf(map.h, y)}</text>
      ))}
      {span && <SpanBand a={span.a} b={span.b} />}
      {map.things.map(t => {
        const id = cellId(t), c = centre(t);
        return (
          <g key={`t${id}`} transform={`translate(${c.cx} ${c.cy})`} class={`thing ${glow.includes(id) ? 'glow' : ''} ${pulse.includes(id) ? 'pulse' : ''} ${wrong.includes(id) ? 'wrong' : ''} ${right === id ? 'right' : ''}`}>
            {(glow.includes(id) || pulse.includes(id) || right === id) && <circle r="47" class="halo" />}
            <Symbol sym={t.sym} />
            {counted.includes(id) && <g class="count-badge"><circle cx="30" cy="-30" r="18" /><text x="30" y="-22" text-anchor="middle">{counted.indexOf(id) + 1}</text></g>}
          </g>
        );
      })}
      {start && <g transform={`translate(${centre(start).cx} ${centre(start).cy})`} class="start-mark"><Star /></g>}
      {path && <Trail path={path} />}
      {ray && <Ray from={ray.from} dir={STEP[ray.rel]} to={ray.to} map={map} />}
      {grid && glow.map(id => { const [x, y] = id.split(',').map(Number) as [number, number]; return map.things.some(t => same(t, { x, y })) ? null : <rect key={`gl${id}`} x={x * S + 6} y={y * S + 6} width={S - 12} height={S - 12} rx="10" class="sq-glow" />; })}
      {grid && wrong.map(id => { const [x, y] = id.split(',').map(Number) as [number, number]; return <text key={`w${id}`} x={x * S + S / 2} y={y * S + S / 2 + 14} text-anchor="middle" class="sq-tried">·</text>; })}
      {right && (grid || tap === 'cells') && (() => { const [x, y] = right.split(',').map(Number) as [number, number]; return <g transform={`translate(${x * S + S / 2} ${y * S + S / 2})`} class="x-mark"><XMark /></g>; })()}
      {tap === 'things' && map.things.map(t => (
        <rect key={`b${cellId(t)}`} x={t.x * S + 2} y={t.y * S + 2} width={S - 4} height={S - 4} rx="14" class="hit" role="button" tabIndex={0} aria-label={NAMES[t.sym]} data-cell={cellId(t)} onClick={() => onTap?.(t)} />
      ))}
      {tap === 'cells' && Array.from({ length: map.w * map.h }, (_, i) => {
        const c = { x: i % map.w, y: Math.floor(i / map.w) };
        return <rect key={`c${i}`} x={c.x * S + 2} y={c.y * S + 2} width={S - 4} height={S - 4} rx="10" class="hit" role="button" tabIndex={0} aria-label={labels ? `${letterOf(c.x)}${numberOf(map.h, c.y)}` : `Square ${i + 1}`} data-cell={cellId(c)} onClick={() => onTap?.(c)} />;
      })}
    </svg>
  );
}

function riverPath(x: number, h: number) {
  const l = x * S + 22, r = x * S + S - 22, H = h * S;
  let d = `M${l} -30`;
  for (let y = 0; y <= H + 30; y += 50) d += ` Q${l + (y % 100 ? -10 : 10)} ${y - 25} ${l} ${y}`;
  d += ` L${r} ${H + 30}`;
  for (let y = H + 30; y >= -30; y -= 50) d += ` Q${r + (y % 100 ? 10 : -10)} ${y - 25} ${r} ${y - 50}`;
  return d + ' Z';
}

export function Star() {
  return <path d="M0 -34 L10 -11 L34 -10 L15 6 L22 30 L0 16 L-22 30 L-15 6 L-34 -10 L-10 -11 Z" fill="#ffd23f" stroke="#2a1a0e" stroke-width="4" stroke-linejoin="round" />;
}
export function XMark() {
  return <path d="M-26 -26 L26 26 M26 -26 L-26 26" stroke="#c81d25" stroke-width="13" stroke-linecap="round" />;
}

/** An arrow from a thing, one way: to the map's edge, or to the answer. */
function Ray({ from, dir, to, map }: { from: Cell; dir: readonly [number, number]; to: Cell | null; map: IsleMap }) {
  const a = centre(from), [dx, dy] = dir;
  const end = to ? centre(to) : { cx: dx > 0 ? map.w * S + 10 : dx < 0 ? -10 : a.cx, cy: dy > 0 ? map.h * S + 10 : dy < 0 ? -10 : a.cy };
  const ax = a.cx + dx * 42, ay = a.cy + dy * 42, bx = end.cx - (to ? dx * 46 : 0), by = end.cy - (to ? dy * 46 : 0);
  const head = `M${bx} ${by} l${-dx * 26 - dy * 18} ${-dy * 26 - dx * 18} M${bx} ${by} l${-dx * 26 + dy * 18} ${-dy * 26 + dx * 18}`;
  return (
    <g class="ray" key={`${from.x},${from.y},${dx},${dy},${to ? 'to' : ''}`}>
      <path d={`M${ax} ${ay} L${bx} ${by}`} class="ray-line" pathLength={1} />
      <path d={head} class="ray-head" />
    </g>
  );
}

/** "Between": a band joining the two things named. */
function SpanBand({ a, b }: { a: Cell; b: Cell }) {
  const p = centre(a), q = centre(b), across = a.y === b.y;
  const x = Math.min(p.cx, q.cx) - (across ? 0 : 46), y = Math.min(p.cy, q.cy) - (across ? 46 : 0);
  return <rect x={x} y={y} width={across ? Math.abs(q.cx - p.cx) : 92} height={across ? 92 : Math.abs(q.cy - p.cy)} rx="40" class="span-band" />;
}

/** The clues followed so far: a dotted line from the star. */
function Trail({ path }: { path: readonly Cell[] }) {
  if (path.length < 2) return null;
  const d = path.map((c, i) => `${i ? 'L' : 'M'}${centre(c).cx} ${centre(c).cy}`).join(' ');
  return <path d={d} class="trail" />;
}
