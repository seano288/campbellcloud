// A food cut into pieces, drawn as SVG: a pizza in wedges, a sheet cake or a chocolate bar in a grid. A part is shown as
// the pieces left on the plate: the eaten ones are gone, leaving the empty plate, a dashed outline and a few crumbs.
// Coloured pieces (Color the Part) are tinted with see-through crayon, so the food still shows under it; pieces being
// talked about glow yellow, and while they're counted each shows its number. Pieces can be tapped (Color the Part), or
// reached with the keyboard, a switch or VoiceOver, which then see each piece as a button.
import type { Picture as Pic } from './fraction';
import { useId } from 'preact/hooks';
import { rowsFor } from './problems';

const S = 200, PIE_R = 92, R = PIE_R, C = S / 2;
export const CRAYON = '#ff4fa3';

type Piece = { d: string; cx: number; cy: number; box: [number, number, number, number] };

function wedges(pieces: readonly number[], R = PIE_R): Piece[] {
  let a = -Math.PI / 2;
  return pieces.map(w => {
    const a0 = a, a1 = (a += w * Math.PI * 2), mid = (a0 + a1) / 2, large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (t: number, r = R) => `${(C + Math.cos(t) * r).toFixed(2)} ${(C + Math.sin(t) * r).toFixed(2)}`;
    const d = pieces.length === 1 ? `M${C - R} ${C}a${R} ${R} 0 1 0 ${R * 2} 0a${R} ${R} 0 1 0 ${-R * 2} 0Z` : `M${C} ${C}L${p(a0)}A${R} ${R} 0 ${large} 1 ${p(a1)}Z`;
    const lr = R * (pieces.length <= 2 ? 0.5 : 0.62);
    return { d, cx: C + Math.cos(mid) * lr, cy: C + Math.sin(mid) * lr, box: [0, 0, 0, 0] as [number, number, number, number] };
  });
}

/** The cake and the chocolate bar: `rows` equal rows, the columns as wide as their pieces' shares. Pieces on the edge
 * grow outwards by `bleed`, so a piece's shape can take the cake's shadow or the wrapper along with it. */
function grid(pieces: readonly number[], rows: number, box: { x: number; y: number; w: number; h: number }, bleed = 0): Piece[] {
  const cols = pieces.length / rows, widths = pieces.slice(0, cols).map(w => w * rows);
  const out: Piece[] = [];
  for (let r = 0; r < rows; r++) {
    let x = box.x;
    for (let c = 0; c < cols; c++) {
      const w = widths[c]! * box.w, h = box.h / rows, y = box.y + r * h;
      const x0 = c === 0 ? x - bleed : x, y0 = r === 0 ? y - bleed : y, x1 = c === cols - 1 ? x + w + bleed : x + w, y1 = r === rows - 1 ? y + h + bleed : y + h;
      out.push({ d: `M${x0.toFixed(2)} ${y0.toFixed(2)}H${x1.toFixed(2)}V${y1.toFixed(2)}H${x0.toFixed(2)}Z`, cx: x + w / 2, cy: y + h / 2, box: [x, y, w, h] });
      x += w;
    }
  }
  return out;
}

const BOX = { cake: { x: 14, y: 44, w: 172, h: 120 }, 'chocolate bar': { x: 20, y: 34, w: 160, h: 132 } } as const;
const CORNER = { cake: 10, 'chocolate bar': 4 } as const;

export function piecesOf(p: Pick<Pic, 'food' | 'pieces'>): Piece[] {
  return p.food === 'pizza' ? wedges(p.pieces) : grid(p.pieces, rowsFor(p.food, p.pieces.length), BOX[p.food]);
}
/** The pieces with their share of the crust, the cake's shadow or the wrapper: what goes when a piece is eaten. */
const servingsOf = (p: Pick<Pic, 'food' | 'pieces'>): Piece[] =>
  p.food === 'pizza' ? wedges(p.pieces, PIE_R + 10) : grid(p.pieces, rowsFor(p.food, p.pieces.length), BOX[p.food], 12);
/** The eaten pieces' outlines: the crust's edge for the pizza, the cake's or the slab's for the others. */
const outlinesOf = (p: Pick<Pic, 'food' | 'pieces'>): Piece[] =>
  p.food === 'pizza' ? wedges(p.pieces, PIE_R + 4) : piecesOf(p);
const CRUMB = { pizza: '#d68a3c', cake: '#c98a4b', 'chocolate bar': '#6b3e26' } as const;

/** The empty plate the food sits on, showing where pieces have been eaten. */
function Plate({ food }: { food: Pic['food'] }) {
  if (food === 'pizza') return <circle cx={C} cy={C} r={R + 8} fill="#fbfaf7" stroke="#000" stroke-width="3" />;
  const b = BOX[food];
  return <rect x={b.x - 10} y={b.y - 10} width={b.w + 20} height={b.h + 24} rx="16" fill="#fbfaf7" stroke="#000" stroke-width="3" />;
}

/** The knife's lines: only the cuts between pieces, so the crust, the cake's edge and the wrapper stay showing. */
function cutsOf(p: Pick<Pic, 'food' | 'pieces'>): string {
  if (p.pieces.length < 2) return '';
  if (p.food === 'pizza') {
    let a = -Math.PI / 2;
    return p.pieces.map(w => { const t = a; a += w * Math.PI * 2; return `M${C} ${C}L${(C + Math.cos(t) * (R + 3)).toFixed(2)} ${(C + Math.sin(t) * (R + 3)).toFixed(2)}`; }).join('');
  }
  const b = BOX[p.food], rows = rowsFor(p.food, p.pieces.length), cols = p.pieces.length / rows;
  let x = b.x, d = '';
  for (let c = 0; c < cols - 1; c++) { x += p.pieces[c]! * rows * b.w; d += `M${x.toFixed(2)} ${b.y}V${b.y + b.h}`; }
  for (let r = 1; r < rows; r++) d += `M${b.x} ${(b.y + (r * b.h) / rows).toFixed(2)}H${b.x + b.w}`;
  return d;
}

/** The food under the pieces: crust and cheese, sponge and frosting, or a chocolate slab with little squares pressed in. */
function Base({ food }: { food: Pic['food'] }) {
  if (food === 'pizza') return <>
    <circle cx={C} cy={C} r={R + 4} fill="#d68a3c" stroke="#000" stroke-width="4" />
    <circle cx={C} cy={C} r={R - 6} fill="#ffd36e" />
    {[[0.35, 0.3], [0.62, 0.38], [0.45, 0.62], [0.7, 0.66], [0.3, 0.55], [0.55, 0.2], [0.22, 0.4], [0.78, 0.5]].map(([x, y], i) => <circle key={i} cx={x! * S} cy={y! * S} r="9" fill="#d9442b" opacity=".9" />)}
  </>;
  if (food === 'cake') {
    const b = BOX.cake;
    return <>
      <rect x={b.x} y={b.y + 8} width={b.w} height={b.h} rx="10" fill="#c98a4b" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="10" fill="#f8d9a6" stroke="#000" stroke-width="4" />
      <path d={`M${b.x + 4} ${b.y + 14}${Array.from({ length: 9 }, () => `q${b.w / 18} 14 ${b.w / 9 - 1} 0`).join('')}V${b.y + 4}H${b.x + 4}Z`} fill="#ff9fc8" />
      {Array.from({ length: 22 }, (_, i) => <rect key={i} x={b.x + 10 + ((i * 47) % (b.w - 20))} y={b.y + 30 + ((i * 29) % (b.h - 40))} width="7" height="3" rx="1.5" fill={['#3fa7ff', '#ffd23f', '#5ad16b', '#ff6b6b'][i % 4]} transform={`rotate(${(i * 37) % 180} ${b.x + 13 + ((i * 47) % (b.w - 20))} ${b.y + 31 + ((i * 29) % (b.h - 40))})`} />)}
    </>;
  }
  const b = BOX['chocolate bar'];
  return <>
    <rect x={b.x - 6} y={b.y - 6} width={b.w + 12} height={b.h + 12} rx="8" fill="#7b3fb8" stroke="#000" stroke-width="4" />
    <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="#6b3e26" />
  </>;
}

/** On the chocolate bar every piece is a square pressed into the slab. */
const Pressed = ({ pieces }: { pieces: Piece[] }) => <>{pieces.map((p, i) => {
  const [x, y, w, h] = p.box;
  return <rect key={i} x={x + 7} y={y + 7} width={Math.max(w - 14, 2)} height={Math.max(h - 14, 2)} rx="5" fill="#7d4a2e" stroke="#4e2b18" stroke-width="3" pointer-events="none" />;
})}</>;

export function Picture({ picture, colored, lit = [], labels, onTap, left, class: cls = '' }: {
  picture: Pick<Pic, 'food' | 'pieces'> & { shaded?: readonly number[] };
  /** Pieces filled with crayon (default: the picture's shaded pieces). */
  colored?: readonly number[];
  /** Pieces glowing while they're talked about. */
  lit?: readonly number[];
  /** Numbers on pieces while they're counted. */
  labels?: Readonly<Record<number, string>>;
  onTap?: (i: number) => void;
  /** The pieces still there: the rest have been eaten, leaving the empty plate (default: the whole food, no plate). */
  left?: readonly number[];
  class?: string;
}) {
  const id = useId().replace(/\W/g, ''), clip = `clip-${id}`, clipped = picture.food === 'pizza' ? undefined : `url(#${clip})`;
  const pieces = piecesOf(picture), cuts = cutsOf(picture), fill = colored ?? picture.shaded ?? [];
  const eaten = left ? pieces.map((_, i) => i).filter(i => !left.includes(i)) : [];
  return (
    <svg class={`fraction ${onTap ? 'tappable' : ''} ${cls}`} viewBox={`0 0 ${S} ${S}`} aria-hidden={onTap ? undefined : 'true'} role={onTap ? 'group' : undefined}>
      {picture.food !== 'pizza' && ( // the pieces' colour stays inside the cake's or the slab's rounded corners
        <clipPath id={clip}><rect x={BOX[picture.food].x} y={BOX[picture.food].y} width={BOX[picture.food].w} height={BOX[picture.food].h} rx={CORNER[picture.food]} /></clipPath>
      )}
      {left && <clipPath id={`left-${id}`}>{servingsOf(picture).map((p, i) => left.includes(i) && <path key={i} d={p.d} />)}</clipPath>}
      {left && <Plate food={picture.food} />}
      <g clip-path={left ? `url(#left-${id})` : undefined}>
        <Base food={picture.food} />
        {picture.food === 'chocolate bar' && <Pressed pieces={pieces} />}
      </g>
      {eaten.map(i => { // where an eaten piece was: its outline and a few crumbs
        const o = outlinesOf(picture)[i]!, p = pieces[i]!;
        return <g key={`e${i}`} pointer-events="none">
          <path d={o.d} fill="none" stroke="#a8a29a" stroke-width="3" stroke-dasharray="8 7" stroke-linejoin="round" />
          {[[-14, -9], [11, -4], [-3, 13]].map(([dx, dy], k) => <circle key={k} cx={p.cx + dx!} cy={p.cy + dy!} r={k === 1 ? 2.5 : 3.5} fill={CRUMB[picture.food]} opacity=".7" />)}
        </g>;
      })}
      <g clip-path={clipped}>{pieces.map((p, i) => (
        <path key={`f${i}`} d={p.d} class={`piece ${fill.includes(i) ? 'colored' : ''}`}
          fill={fill.includes(i) ? CRAYON : 'transparent'} fill-opacity={fill.includes(i) ? 0.6 : undefined}
          onPointerDown={onTap ? e => { e.preventDefault(); onTap(i); } : undefined}
          {...(onTap ? {
            role: 'button', tabIndex: 0, 'aria-label': `Piece ${i + 1}`, 'aria-pressed': fill.includes(i),
            onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(i); } },
          } : {})} />
      ))}</g>
      {cuts && <path d={cuts} fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" pointer-events="none" />}
      {cuts && <path d={cuts} fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" pointer-events="none" />}
      <g clip-path={clipped}>{lit.map(i => pieces[i] && <path key={`l${i}`} d={pieces[i]!.d} fill="#ffd23f55" stroke="#ffd23f" stroke-width="7" stroke-linejoin="round" pointer-events="none" class="lit-piece" />)}</g>
      {labels && Object.entries(labels).map(([i, t]) => pieces[+i] && (
        <g key={`t${i}`} pointer-events="none">
          <circle cx={pieces[+i]!.cx} cy={pieces[+i]!.cy} r="17" fill="#fff" stroke="#000" stroke-width="3" />
          <text x={pieces[+i]!.cx} y={pieces[+i]!.cy + 7} text-anchor="middle" class="piece-num">{t}</text>
        </g>
      ))}
    </svg>
  );
}

/** Pieces of a whole: the drawing as cut into d equal pieces, with the first `shaded` coloured. */
export const equalPicture = (food: Pic['food'], d: number, shaded = 0) =>
  ({ food, pieces: Array.from({ length: d }, () => 1 / d), shaded: Array.from({ length: shaded }, (_, i) => i) });
/** A part as the food left on the plate: the first n of d equal pieces are there, the rest have been eaten. */
export const leftOf = (n: number) => Array.from({ length: n }, (_, i) => i);
