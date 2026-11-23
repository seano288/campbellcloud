// The pictures the questions and lessons share: the seat mat (hundreds blocks, rows of ten and single seats, a column for each place)
// and the runway number line with hops drawn on it. Drawn in SVG, no art files.
import type { Col, Line, Mat, Piece } from './teach';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const COLS: { c: Col; word: string }[] = [{ c: 'h', word: 'hundreds' }, { c: 't', word: 'tens' }, { c: 'o', word: 'ones' }];

/** One seat: a square with a back. */
function Seat({ x, y, s, p }: { x: number; y: number; s: number; p: Piece }) {
  return (
    <g class={cls('seat', `s-${p.c}`, p.lit && 'lit', p.gone && 'gone')} transform={`translate(${x} ${y})`}>
      <rect width={s} height={s} rx={s * .22} />
      <rect class="back" width={s} height={s * .32} rx={s * .16} />
      {p.gone && <path d={`M${s * .1} ${s * .1} L${s * .9} ${s * .9} M${s * .9} ${s * .1} L${s * .1} ${s * .9}`} class="x" />}
    </g>
  );
}

/** The mat. Each column holds its blocks: hundreds as 10 by 10 blocks, tens as rows of ten (stood up), ones loose in fives. */
export function MatView({ mat, lit, jumbled = false }: { mat: Mat; lit?: Col | null; jumbled?: boolean }) {
  // jumbled: the columns stand ones, tens, hundreds, so he reads each by its name and not by where it is
  const cols = (jumbled ? [...COLS].reverse() : COLS).filter(c => mat.wide || c.c !== 'h'), W = cols.length * 220, H = 300;
  const focus = lit ?? mat.focus ?? null;
  return (
    <svg class="mat" viewBox={`0 0 ${W} ${H + 64}`} role="img" aria-label="Seats in hundreds, tens and ones">
      {cols.map(({ c, word }, k) => {
        const x0 = k * 220, ps = mat[c], d = mat.digits?.[c];
        const pieces: preact.JSX.Element[] = [];
        if (c === 'h') ps.forEach((p, i) => {
          const s = 6.4, bx = x0 + 14 + (i % 3) * 66, by = 40 + Math.floor(i / 3) * 70;
          pieces.push(<g key={i} class={cls('flat', p.ring && 'ring')}>{Array.from({ length: 100 }, (_, j) => <Seat key={j} x={bx + (j % 10) * s} y={by + Math.floor(j / 10) * s} s={s - .8} p={p} />)}</g>);
        });
        if (c === 't') {
          // a row of ten stands up, ten seats tall; more than nine go in two shorter rows
          const rows = ps.length > 9 ? 2 : 1, per = Math.ceil(ps.length / rows) || 1, u = Math.min(20, 196 / per - 2, (230 / rows - 8) / 10);
          ps.forEach((p, i) => {
            const bx = x0 + 12 + (i % per) * (u + 2), by = 44 + Math.floor(i / per) * (u * 10 + 8);
            pieces.push(<g key={i} class={cls('rod', p.ring && 'ring', p.c === 'new' && 'arrive')}>{Array.from({ length: 10 }, (_, j) => <Seat key={j} x={bx} y={by + j * u} s={u - 1} p={p} />)}</g>);
          });
        }
        if (c === 'o') ps.forEach((p, i) => {
          const s = 28, bx = x0 + 16 + (i % 5) * 38, by = 44 + Math.floor(i / 5) * 40;
          pieces.push(<g key={i} class={cls('one', p.ring && 'ring')}><Seat x={bx} y={by} s={s} p={p} /></g>);
        });
        return (
          <g key={c} class={cls('mat-col', `col-${c}`, focus === c && 'focus')}>
            <rect class="mat-bg" x={x0 + 4} y={4} width={212} height={H - 8 + 64} rx={14} />
            <text class="mat-word" x={x0 + 110} y={28}>{word}</text>
            {pieces}
            <rect class={cls('mat-digit-box', d === undefined && 'empty')} x={x0 + 70} y={H - 4} width={80} height={60} rx={10} />
            <text class={cls('mat-digit', d !== undefined && 'on')} x={x0 + 110} y={H + 44}>{d ?? ''}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** The runway number line: tens marked, his plane where it is, hops drawn as arcs with what they add. */
export function RunwayLine({ line, plane = true }: { line: Line; plane?: boolean }) {
  const W = 640, X = (v: number) => 30 + ((v - line.lo) / Math.max(1, line.hi - line.lo)) * (W - 60);
  // no more than about a dozen labels: by tens on a short line, by hundreds on a long one (a hundred more and less)
  const span = line.hi - line.lo, step = span > 150 ? 10 : span > 30 ? 5 : 1, label = span > 150 ? 100 : 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(line.lo / step) * step; v <= line.hi; v += step) ticks.push(v);
  const Y = 150;
  return (
    <svg class="runway-line" viewBox={`0 0 ${W} 262`} role="img" aria-label="A runway number line">
      <rect class="rl-strip" x={10} y={Y - 26} width={W - 20} height={52} rx={8} />
      <line class="rl-dash" x1={20} x2={W - 20} y1={Y} y2={Y} />
      {ticks.map(t => <g key={t}><line class={cls('rl-tick', t % label === 0 && 'big')} x1={X(t)} x2={X(t)} y1={Y - (t % label === 0 ? 26 : 12)} y2={Y + (t % label === 0 ? 26 : 12)} />
        {t % label === 0 && t <= 999 && !line.marks.some(m => Math.abs(X(m) - X(t)) < 44) && !line.hops.some(h => Math.abs(X(h.to) - X(t)) < 44) && <text class="rl-num" x={X(t)} y={Y + 58}>{t}</text>}</g>)}
      {line.marks.map(m => <g key={`m${m}`} class="rl-mark"><rect x={X(m) - 30} y={Y + 32} width={60} height={34} rx={6} /><text x={X(m)} y={Y + 58}>{m}</text></g>)}
      {line.hops.map((h, i) => {
        const x1 = X(h.from), x2 = X(h.to), top = Y - 40 - Math.min(80, Math.abs(x2 - x1) * .45);
        return <g key={i} class="rl-hop"><path d={`M${x1} ${Y - 18} Q${(x1 + x2) / 2} ${top} ${x2} ${Y - 18}`} /><text x={(x1 + x2) / 2} y={top + 4}>{h.label}</text>
          {!line.marks.includes(h.to) && (() => {
            // a landing close to a marked number goes a row lower, so the two never print over each other
            const dy = line.marks.some(m => Math.abs(X(m) - x2) < 64) ? 40 : 0;
            return <><rect class="rl-land" x={x2 - 30} y={Y + 32 + dy} width={60} height={34} rx={6} /><text class="rl-land-n" x={x2} y={Y + 58 + dy}>{h.to}</text></>;
          })()}</g>;
      })}
      {plane && line.at !== null && <text class="rl-plane" x={X(line.at)} y={Y + 10}>✈️</text>}
    </svg>
  );
}
