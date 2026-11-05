// The pictures of the second wave of kinds: the number chart, bars and wrenches, shape tiles and outlines. As plain as the rest: flat
// shapes and thick outlines, and colour never carries the answer. Each takes plain data, so a question and a lesson draw the same thing.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { rowWindow, STRIP_UNITS, unitsOf, type Bar, type Laying } from '../numbers/problems';
import { DRAWINGS, FILLS, type Drawing, type FillId, type Piece, type Tile } from '../numbers/shapes';
import { cls } from './Pictures';

// ---------- the number chart ----------

const ROW_MIN = 44; // a tap target, however few rows that leaves
function useFitRows(room: number) {
  const fit = () => Math.max(3, Math.floor((window.innerHeight - room) / ROW_MIN));
  const [rows, setRows] = useState(fit);
  useEffect(() => { const on = () => setRows(fit()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return rows;
}
export interface ChartProps {
  to: number;
  /** The numbers this question is about: the rows shown always hold them. */
  keep?: readonly number[];
  /** A marked square, and one lit as where we started from. */
  at?: number; from?: number;
  lit?: readonly number[];
  hide?(cell: number): boolean;
  wrong?: readonly string[];
  /** Answers tapped on the chart. */
  onTap?(n: number): void;
  room?: number;
}
/** A 120 chart in rows of ten: one row down is ten more. A phone on its side shows only the rows that fit. */
export function Chart({ to, keep = [1], at, from, lit, hide, wrong, onTap, room = 190 }: ChartProps) {
  const total = Math.ceil(to / 10), [first, last] = rowWindow(total, useFitRows(room), keep);
  const cells = Array.from({ length: (last - first) * 10 }, (_, i) => first * 10 + i + 1).filter(c => c <= to);
  return (
    <div class={cls('nchart', onTap && 'tapping')} style={{ '--rows': last - first }} role={onTap ? 'group' : 'img'} aria-label="Number chart">
      {cells.map(c => {
        const blank = !!hide?.(c), style = cls('nc', blank && 'blank', lit?.includes(c) && 'lit', c === from && 'from', c === at && 'at', wrong?.includes(String(c)) && 'wrong');
        return onTap && !blank
          ? <button key={c} class={style} data-n={c} aria-label={String(c)} disabled={wrong?.includes(String(c))} onClick={() => onTap(c)}>{c}</button>
          : <span key={c} class={style} data-n={c}>{blank ? '' : c}</span>;
      })}
    </div>
  );
}

// ---------- bars and wrenches ----------

const pct = (units: number) => `${(units / STRIP_UNITS) * 100}%`;
/** Every wrench is the same drawing, stretched only by `size`. */
function Wrench({ at, size = 1, b, lit, fade }: { at: number; size?: number; b?: boolean; lit?: boolean; fade?: boolean }) {
  return (
    <svg class={cls('wrench', b && 'b', lit && 'lit', fade && 'fade')} style={{ left: pct(at), width: pct(size) }} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 8 H24 L34 15 H68 L78 8 H98 V16 H84 V24 H98 V32 H78 L68 25 H34 L24 32 H2 V24 H16 V16 H2 Z" />
    </svg>
  );
}
/** One bar along the strip, with whatever rests on it. */
export const BarRow = ({ start = 0, len, lit, children }: { start?: number; len: number; lit?: boolean; children?: ComponentChildren }) => (
  <div class="m-row">
    <span class={cls('m-bar', lit && 'lit')} style={{ left: pct(start), width: pct(len) }} />
    {children}
  </div>
);
export const Rope = ({ start, len }: { start: number; len: number }) => <span class="m-rope" style={{ left: pct(start), width: pct(len) }} />;

export function Units({ len, laying = 'right', shown, size = 1, lit = 0 }: { len: number; laying?: Laying; shown?: number; size?: number; lit?: number }) {
  const places = size === 1 ? unitsOf(len, laying) : Array.from({ length: Math.floor(len / size) }, (_, i) => i * size);
  return (
    <div class="m-units" role="img" aria-label={`A bar ${len} wrenches long`}>
      <BarRow len={len}>{places.slice(0, shown ?? places.length).map((at, i) => <Wrench key={i} at={at} size={size} b={i % 2 === 1} lit={i < lit} />)}</BarRow>
    </div>
  );
}
/** Wrenches he has laid down so far. They only ever go end to end: there's no drag to leave a gap with. */
export const Laid = ({ len, count }: { len: number; count: number }) => (
  <div class="m-units" role="img" aria-label={`${count} wrenches on a bar`}>
    <BarRow len={len}>{Array.from({ length: count }, (_, i) => <Wrench key={i} at={i} b={i % 2 === 1} />)}</BarRow>
  </div>
);
export function BarsStage({ bars, rope, lit }: { bars: readonly Bar[]; rope?: number; lit?: string }) {
  return (
    <div class="m-units" role="img" aria-label="Bars">
      {bars.map(b => <BarRow key={b.id} start={b.start} len={b.len} lit={lit === b.id}>{rope !== undefined && <Rope start={b.start} len={rope} />}</BarRow>)}
    </div>
  );
}

// ---------- shapes ----------

const HUES = ['#e8590c', '#1971c2', '#2b8a3e', '#7048e8'];
const pointsOf = (d: Drawing) => d.pts.map(p => p.join(',')).join(' ');
/** A shape as a tile draws it. `lit`: this many of its sides glow, in order. */
export function ShapeArt({ tile, lit = 0 }: { tile: Tile; lit?: number }) {
  const d: Drawing = DRAWINGS[tile.id], fill = d.closed ? HUES[tile.hue % 4] : 'none', stroke = d.closed ? '#000' : HUES[tile.hue % 4], scale = `translate(50 50) rotate(${tile.turn}) scale(${tile.size * 0.9}) translate(-50 -50)`;
  const sides = Array.from({ length: Math.min(lit, d.sides) }, (_, i) => [d.pts[i]!, d.pts[(i + 1) % d.pts.length]!] as const);
  return (
    <svg class="shape-art" viewBox="0 0 100 100" aria-hidden="true">
      <g transform={scale}>
        {d.d ? <path d={d.d} fill={fill} stroke={stroke} stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
          : d.closed ? <polygon points={pointsOf(d)} fill={fill} stroke={stroke} stroke-width="6" stroke-linejoin="round" />
            : <polyline points={pointsOf(d)} fill="none" stroke={stroke} stroke-width="8" stroke-linejoin="round" stroke-linecap="round" />}
        {sides.map(([[x1, y1], [x2, y2]], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd23f" stroke-width="10" stroke-linecap="round" />)}
      </g>
    </svg>
  );
}
const PIECE_PATHS: Record<Piece, string> = { triangle: 'M50 12 L92 86 H8 Z', square: 'M16 16 H84 V84 H16 Z', half: 'M50 12 A42 42 0 0 1 50 96 Z' };
export const PIECE_NAMES = { triangle: 'Triangle.', square: 'Square.', half: 'Half circle.' } as const satisfies Record<Piece, string>;
export const PieceArt = ({ piece }: { piece: Piece }) => (
  <svg class="shape-art" viewBox="0 0 100 100" aria-hidden="true"><path d={PIECE_PATHS[piece]} fill={HUES[1]} stroke="#000" stroke-width="6" stroke-linejoin="round" /></svg>
);
/** An outline with its parts dashed in, the first `placed` of `order` filled. */
export function FillArt({ fill, placed, order }: { fill: FillId; placed: number; order?: readonly number[] }) {
  const parts = FILLS[fill].parts;
  return (
    <svg class="fill-art" viewBox="0 0 120 120" role="img" aria-label="An outline to fill">
      {(order ?? parts.map((_, i) => i)).map((at, i) => <path key={at} d={parts[at]!.d} class={i < placed ? 'in' : 'gap'} style={i < placed ? { fill: HUES[at % 2] } : undefined} />)}
    </svg>
  );
}
