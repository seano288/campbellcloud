// Letters drawn from their stroke data (letters/strokes.ts), as SVG: the same ball-and-stick shapes he traces, on the three writing lines
// when asked. A row of letters can be moved up or down (Tall, Small, Tail) or turned (Which Way).
import type { ComponentChildren } from 'preact';
import type { Turn } from '../letters/glyphs';
import { letter, type Pt } from '../letters/strokes';

export interface GlyphPart { ch: string; dy?: number; turn?: Turn }
const GAP = 0.45, PAD = 0.35;

/** Where each letter of a row sits, and how wide the row is, in line units. */
export function rowLayout(parts: readonly GlyphPart[]) {
  let x = 0;
  const at = parts.map(p => { const L = letter(p.ch), here = x; x += L.width + GAP; return { x: here, w: L.width }; });
  return { at, width: Math.max(0.3, x - GAP) };
}

const pathOf = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join('');

/** The SVG transform for a turned letter: mirrored about its middle, flipped about its own top and bottom. */
function turnOf(ch: string, turn: Turn | undefined, x: number) {
  const L = letter(ch), ys = L.strokes.flatMap(s => s.pts.map(p => p[1])), top = Math.min(...ys), bottom = Math.max(...ys), cx = L.width / 2, cy = (top + bottom) / 2;
  const sx = turn === 'm' || turn === 'r' ? -1 : 1, sy = turn === 'f' || turn === 'r' ? -1 : 1;
  return `translate(${x + cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;
}

export function Lines({ x0, x1, faint }: { x0: number; x1: number; faint?: boolean }) {
  return (
    <g class={`sw-lines ${faint ? 'faint' : ''}`}>
      <line x1={x0} x2={x1} y1={0} y2={0} class="ln top" />
      <line x1={x0} x2={x1} y1={1} y2={1} class="ln mid" />
      <line x1={x0} x2={x1} y1={2} y2={2} class="ln base" />
      <line x1={x0} x2={x1} y1={3} y2={3} class="ln tail" />
    </g>
  );
}

/** One letter's strokes at an x offset. `lit`: strokes drawn in the lesson colour; `faded`: strokes drawn faint. */
export function LetterStrokes({ ch, x = 0, dy = 0, turn, lit, faded, cls = '' }: { ch: string; x?: number; dy?: number; turn?: Turn; lit?: readonly number[]; faded?: readonly number[]; cls?: string }) {
  const L = letter(ch);
  return (
    <g transform={`translate(0 ${dy}) ${turnOf(ch, turn, x)}`} class={`sw-letter ${cls}`}>
      {L.strokes.map((s, k) => s.dot
        ? <circle key={k} cx={s.pts[0]![0]} cy={s.pts[0]![1]} r={0.11} class={`st dot ${lit?.includes(k) ? 'lit' : ''} ${faded?.includes(k) ? 'faded' : ''}`} />
        : <path key={k} d={pathOf(s.pts)} pathLength={1} class={`st ${lit?.includes(k) ? 'lit' : ''} ${faded?.includes(k) ? 'faded' : ''}`} />)}
    </g>
  );
}

/** A row of letters, on the lines or not. `children` draws on top in the same units (dots, arrows). */
export function Glyph({ parts, lines = true, label, cls = '', lit, children, tall }: {
  parts: readonly GlyphPart[]; lines?: boolean; label?: string; cls?: string; lit?: { at: number; strokes: readonly number[] } | null; children?: ComponentChildren; tall?: boolean;
}) {
  const { at, width } = rowLayout(parts), top = lines || tall ? -PAD : -0.1;
  const ys = parts.flatMap(p => letter(p.ch).strokes.flatMap(s => s.pts.map(q => q[1] + (p.dy ?? 0))));
  const y0 = lines || tall ? top : Math.min(...ys) - PAD, y1 = lines || tall ? 3 + PAD : Math.max(...ys) + PAD;
  return (
    <svg class={`sw-glyph ${cls}`} viewBox={`${-PAD} ${y0} ${width + PAD * 2} ${y1 - y0}`} role="img" aria-label={label ?? parts.map(p => p.ch).join('')}>
      {lines && <Lines x0={-PAD} x1={width + PAD} />}
      {parts.map((p, i) => <LetterStrokes key={i} ch={p.ch} x={at[i]!.x} dy={p.dy} turn={p.turn} lit={lit?.at === i ? lit.strokes : undefined} />)}
      {children}
    </svg>
  );
}
