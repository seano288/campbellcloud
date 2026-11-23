// The pictures the questions and lessons share: the seat mat (hundreds blocks, rows of ten and single seats, a column for each place)
// and the runway number line with hops drawn on it. Drawn in SVG, no art files.
import type { Col, Line, Mat, Piece } from './teach';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// One seat is U across, everywhere on the mat: a row of ten is one seat wide and ten tall, a hundred is ten rows of ten side by side
// (ten seats each way), so the picture shows a hundred as ten tens and a ten as ten ones. Each block is drawn as one rounded shape with
// its seat backs in a single path, so a mat of 999 is about sixty shapes rather than two thousand.
export const U = 20;
const GAP_T = 8, GAP_H = 16, GAP_O = 8, PAD = 18;
const ROD_H = 10 * U, FLAT = 10 * U;

export interface Block { readonly c: Col; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly p: Piece }
export interface MatColumn { readonly c: Col; readonly word: string; readonly x: number; readonly w: number }
export interface MatLayout { readonly W: number; readonly H: number; readonly f: number; readonly top: number; readonly cols: readonly MatColumn[]; readonly blocks: readonly Block[] }

/** Where every block on the mat goes. The columns are as wide as the most blocks they'll hold in this lesson (`room`), not as the blocks
 *  on it now, so nothing jumps as a ten snaps together or a hundred breaks: rows of ten stand up to ten to a line (room for five at
 *  least), ones lie five to a line (two lines make ten), hundreds up to three to a line. */
export function matLayout(mat: Mat, jumbled = false): MatLayout {
  const room = (c: Col) => Math.max(mat[c].length, mat.room?.[c] ?? 0);
  const hRoom = Math.max(room('h'), 1), hCols = hRoom <= 1 ? 1 : hRoom <= 4 ? 2 : 3, hRows = Math.ceil(hRoom / hCols);
  const tRoom = Math.max(room('t'), 5), tPer = Math.min(10, tRoom), tRows = tRoom > 10 ? 2 : 1, oRows = Math.max(2, Math.ceil(room('o') / 5));
  const inner: Record<Col, { w: number; h: number }> = {
    h: { w: hCols * FLAT + (hCols - 1) * GAP_H, h: hRows * FLAT + (hRows - 1) * GAP_H },
    t: { w: tPer * U + (tPer - 1) * GAP_T, h: tRows * ROD_H + (tRows - 1) * GAP_H },
    o: { w: Math.max(5 * U + 4 * GAP_O, 140), h: oRows * U + (oRows - 1) * GAP_O },
  };
  const order = (jumbled ? (['o', 't', 'h'] as const) : (['h', 't', 'o'] as const)).filter(c => mat.wide || c !== 'h');
  const contentW = order.reduce((s, c) => s + inner[c].w + 2 * PAD, 0) + (order.length - 1) * 12;
  // the words and digits grow with the picture, so they read the same size on screen however many blocks there are
  const CH = Math.max(...order.map(c => inner[c].h)), f = Math.max(1, contentW / 760, (CH + 170) / 400), top = Math.round(52 * f);
  const cols: MatColumn[] = [], blocks: Block[] = [];
  let x = 0;
  for (const c of order) {
    const w = inner[c].w + 2 * PAD, x0 = x + PAD + (inner[c].w - (c === 'o' ? 5 * U + 4 * GAP_O : inner[c].w)) / 2, y0 = top + PAD;
    cols.push({ c, word: c === 'h' ? 'hundreds' : c === 't' ? 'tens' : 'ones', x, w });
    mat[c].forEach((p, i) => {
      if (c === 'h') blocks.push({ c, p, x: x0 + (i % hCols) * (FLAT + GAP_H), y: y0 + Math.floor(i / hCols) * (FLAT + GAP_H), w: FLAT, h: FLAT });
      if (c === 't') blocks.push({ c, p, x: x0 + (i % tPer) * (U + GAP_T), y: y0 + Math.floor(i / tPer) * (ROD_H + GAP_H), w: U, h: ROD_H });
      if (c === 'o') blocks.push({ c, p, x: x0 + (i % 5) * (U + GAP_O), y: y0 + Math.floor(i / 5) * (U + GAP_O), w: U, h: U });
    });
    x += w + 12;
  }
  return { W: x - 12, H: top + PAD + CH + PAD + Math.round(80 * f), f, top, cols, blocks };
}

/** The seat backs of a block: a darker strip across the top of every seat in it, as one path. */
function backs(b: Block): string {
  let d = '';
  for (let y = b.y; y < b.y + b.h - 1; y += U) for (let x = b.x; x < b.x + b.w - 1; x += U) d += `M${x + 3} ${y + 3}h${U - 6}v5h${-(U - 6)}z`;
  return d;
}
/** The lines between the rows of ten inside a hundred, so it shows as ten tens. */
function rodLines(b: Block): string {
  let d = '';
  for (let k = 1; k < 10; k++) d += `M${b.x + k * U} ${b.y}v${b.h}`;
  return d;
}

/** The mat. Each column holds its blocks: hundreds, rows of ten (stood up) and single seats, all from the same seat. */
export function MatView({ mat, lit, jumbled = false }: { mat: Mat; lit?: Col | null; jumbled?: boolean }) {
  const L = matLayout(mat, jumbled), focus = lit ?? mat.focus ?? null, f = L.f;
  const digitY = L.H - Math.round(74 * f);
  return (
    <svg class="mat" viewBox={`0 0 ${L.W} ${L.H}`} role="img" aria-label="Seats in hundreds, tens and ones">
      {L.cols.map(col => {
        const d = mat.digits?.[col.c], cx = col.x + col.w / 2;
        return (
          <g key={col.c} class={cls('mat-col', `col-${col.c}`, focus === col.c && 'focus')}>
            <rect class="mat-bg" x={col.x + 2} y={2} width={col.w - 4} height={L.H - 4} rx={16 * f} />
            <rect class="mat-head" x={col.x + 10 * f} y={10 * f} width={col.w - 20 * f} height={L.top - 6 * f} rx={10 * f} />
            <text class="mat-word" x={cx} y={L.top * .66} style={{ fontSize: `${24 * f}px` }}>{col.word}</text>
            <rect class={cls('mat-digit-box', d === undefined && 'empty')} x={cx - 44 * f} y={digitY} width={88 * f} height={64 * f} rx={10 * f} />
            <text class={cls('mat-digit', d !== undefined && 'on')} x={cx} y={digitY + 50 * f} style={{ fontSize: `${52 * f}px` }}>{d ?? ''}</text>
          </g>
        );
      })}
      {L.blocks.map((b, i) => (
        <g key={`${b.c}${i}`} class={cls('blk', b.c === 'h' ? 'flat' : b.c === 't' ? 'rod' : 'one', `s-${b.p.c}`, b.p.lit && 'lit', b.p.gone && 'gone', b.p.ring && 'ring', b.p.c === 'new' && b.c !== 'o' && 'arrive')}>
          <rect class="body" x={b.x} y={b.y} width={b.w} height={b.h} rx={5} />
          <path class="backs" d={backs(b)} />
          {b.c === 'h' && <path class="rods" d={rodLines(b)} />}
          {b.p.gone && <path class="x" d={`M${b.x + 3} ${b.y + 3}L${b.x + b.w - 3} ${b.y + b.h - 3}M${b.x + b.w - 3} ${b.y + 3}L${b.x + 3} ${b.y + b.h - 3}`} />}
        </g>
      ))}
    </svg>
  );
}

const LINE_W = 640;
/** Where a number sits on the runway line, in its own units. */
export const lineX = (line: Line, v: number) => 30 + ((v - line.lo) / Math.max(1, line.hi - line.lo)) * (LINE_W - 60);
/** The row (0, 1, 2) of each number box under the line, marks first then landings, each on the first row where it clears the boxes
 *  already placed (a box is 60 wide): 69 and 70 in "69 + ? = 70", or two hops landing on 86 and 91 on a phone, never print over each
 *  other (pass 2 found both). */
export function labelRows(line: Line): Map<number, number> {
  const rows = new Map<number, number>();
  for (const v of [...line.marks, ...line.hops.map(h => h.to).filter(v => !line.marks.includes(v))]) {
    if (rows.has(v)) continue;
    let row = 0;
    while ([...rows].some(([u, r]) => r === row && Math.abs(lineX(line, u) - lineX(line, v)) < 64)) row++;
    rows.set(v, row);
  }
  return rows;
}

/** The runway number line: tens marked, his plane where it is, hops drawn as arcs with what they add. */
export function RunwayLine({ line, plane = true }: { line: Line; plane?: boolean }) {
  const W = LINE_W, X = (v: number) => lineX(line, v);
  // no more than about a dozen labels: by tens on a short line, by hundreds on a long one (a hundred more and less)
  const span = line.hi - line.lo, step = span > 150 ? 10 : span > 30 ? 5 : 1, label = span > 150 ? 100 : 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(line.lo / step) * step; v <= line.hi; v += step) ticks.push(v);
  const Y = 150;
  const rows = labelRows(line), rowOf = (v: number) => rows.get(v) ?? 0, deep = Math.max(0, ...rows.values()) - 1;
  return (
    <svg class="runway-line" viewBox={`0 0 ${W} ${262 + Math.max(0, deep) * 40}`} role="img" aria-label="A runway number line">
      <rect class="rl-strip" x={10} y={Y - 26} width={W - 20} height={52} rx={8} />
      <path class="rl-edge" d={`M22 ${Y - 18}H${W - 22}M22 ${Y + 18}H${W - 22}`} />
      <line class="rl-dash" x1={34} x2={W - 34} y1={Y} y2={Y} />
      {/* the marks hang under the runway's edge, like distance boards, so they never cross its centre line */}
      {ticks.map(t => <g key={t}><line class={cls('rl-tick', t % label === 0 && 'big')} x1={X(t)} x2={X(t)} y1={Y + 26} y2={Y + (t % label === 0 ? 44 : 35)} />
        {t % label === 0 && t <= 999 && !line.marks.some(m => Math.abs(X(m) - X(t)) < 44) && !line.hops.some(h => Math.abs(X(h.to) - X(t)) < 44) && <text class="rl-num" x={X(t)} y={Y + 64}>{t}</text>}</g>)}
      {line.marks.map(m => <g key={`m${m}`} class="rl-mark"><rect x={X(m) - 30} y={Y + 32 + rowOf(m) * 40} width={60} height={34} rx={6} /><text x={X(m)} y={Y + 58 + rowOf(m) * 40}>{m}</text></g>)}
      {line.hops.map((h, i) => {
        const x1 = X(h.from), x2 = X(h.to), top = Y - 40 - Math.min(80, Math.abs(x2 - x1) * .45);
        return <g key={i} class="rl-hop"><path d={`M${x1} ${Y - 18} Q${(x1 + x2) / 2} ${top} ${x2} ${Y - 18}`} /><text x={(x1 + x2) / 2} y={top + 4}>{h.label}</text>
          {!line.marks.includes(h.to) && <><rect class="rl-land" x={x2 - 30} y={Y + 32 + rowOf(h.to) * 40} width={60} height={34} rx={6} /><text class="rl-land-n" x={x2} y={Y + 58 + rowOf(h.to) * 40}>{h.to}</text></>}</g>;
      })}
      {plane && line.at !== null && <text class="rl-plane" x={X(line.at)} y={Y + 10}>✈️</text>}
    </svg>
  );
}
