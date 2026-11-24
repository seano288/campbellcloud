// The pictures a story is shown and taught on, drawn in SVG and CSS (no art files):
// - the story card: the sentences, each appearing as it is said, the numbers big; the one being said is lit;
// - the deck: the story acted out with counters in rows of ten (a jet, a crate, a sailor...), blue for what was there, orange for what
//   came, faded for what went, dashed for what we don't know yet;
// - the bar picture (the fuller lesson): a long bar for the whole and two shorter bars for the parts, one of them empty;
// - the two rows of How Many More, pairing off, with the ones without a partner glowing;
// - the Mission Board's bar graph, with the line from a bar's top across to the scale;
// - a number sentence, with the part each sentence stands for lit.
import type { ComponentChildren } from 'preact';
import { eqText, SQUAD_HEX, type Eq, type Noun, type Sentence, type BoardProblem } from './problems';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const NOUN_ICON: Record<Noun, string> = { jets: '✈️', helicopters: '🚁', crates: '📦', sailors: '🧑‍✈️', boats: '🚤' };

// ---------- the story card ----------

/** The story so far: `shown` sentences, the `lit` one being said. Numbers are big and boxed; the question is the last line. */
export function StoryCard({ sentences, shown, lit, extraAt }: { sentences: readonly Sentence[]; shown: number; lit: number | null; extraAt?: number | null }) {
  return (
    <ol class="cd-story" aria-label="The story">
      {sentences.slice(0, shown).map((s, i) => (
        <li key={i} class={cls(lit === i && 'lit', i === sentences.length - 1 && 'q', extraAt === i && 'extra')}>
          {s.text.split(/(\d+)/).map((part, j) => (/^\d+$/.test(part) ? <b key={j} class="cd-num">{part}</b> : part))}
        </li>
      ))}
    </ol>
  );
}

// ---------- the deck ----------

/** One group of counters on the deck: `on` was there, `come` arrived, `go` left (shown faded, leaving), `ghost` is not known yet. */
export interface Group { readonly n: number; readonly kind: 'on' | 'come' | 'go' | 'ghost'; readonly label?: string }
export interface DeckScene { readonly noun: Noun; readonly groups: readonly Group[]; readonly backwards?: boolean }

/** Counters in rows of ten, so 47 is four full rows and seven. */
function Counters({ g, icon }: { g: Group; icon: string }) {
  const rows = Math.ceil(g.n / 10);
  return (
    <div class={cls('cd-group', `g-${g.kind}`)} aria-label={`${g.label ?? ''} ${g.n}`}>
      {g.label && <span class="cd-glabel">{g.label}</span>}
      <div class="cd-rows">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} class={cls('cd-row', Math.min(10, g.n - r * 10) === 10 && 'ten')}>
            {Array.from({ length: Math.min(10, g.n - r * 10) }, (_, i) => <i key={i}>{g.kind === 'ghost' ? '' : icon}</i>)}
          </div>
        ))}
      </div>
    </div>
  );
}
export function Deck({ scene }: { scene: DeckScene }) {
  const icon = NOUN_ICON[scene.noun];
  return (
    <div class={cls('cd-deck', scene.backwards && 'backwards')} role="img" aria-label="The story on the deck">
      <div class="cd-deck-lines" aria-hidden="true" />
      {scene.groups.map((g, i) => <Counters key={i} g={g} icon={icon} />)}
    </div>
  );
}

// ---------- the bar picture ----------

export interface BarPart { readonly n: number | null; readonly lit?: boolean }
/** A whole and its two parts, or (compare) a long bar and a short one with the extra marked. `null` is the one we don't know. */
export interface Bars {
  readonly kind: 'parts' | 'compare';
  readonly whole: number | null;
  readonly parts: readonly [BarPart, BarPart];
  /** Which is lit: the whole, or a part (0 or 1). */
  readonly lit?: 'whole' | 0 | 1 | null;
}
export function BarPicture({ bars }: { bars: Bars }) {
  const a = bars.parts[0].n, b = bars.parts[1].n, whole = bars.whole ?? (a ?? 0) + (b ?? 0);
  const known = Math.max(1, whole);
  // the parts' widths: an unknown one takes what is left (or, with nothing known, half)
  const wa = a ?? Math.max(0, whole - (b ?? whole / 2)), wb = b ?? Math.max(0, whole - wa);
  const pct = (x: number) => `${Math.max(12, Math.min(88, (x / known) * 100))}%`;
  const label = (n: number | null) => (n === null ? '?' : String(n));
  if (bars.kind === 'compare') {
    return (
      <div class="cd-bars compare" role="img" aria-label="The bar picture">
        <div class={cls('cd-bar', 'big', bars.lit === 'whole' && 'lit', bars.whole === null && 'unknown')} style={{ width: '100%' }}><span>{label(bars.whole)}</span></div>
        <div class="cd-bar-row">
          <div class={cls('cd-bar', 'small', bars.lit === 0 && 'lit', a === null && 'unknown')} style={{ width: pct(wa) }}><span>{label(a)}</span></div>
          <div class={cls('cd-bar', 'extra', bars.lit === 1 && 'lit', b === null && 'unknown')} style={{ width: pct(wb) }}><span>{label(b)}</span></div>
        </div>
      </div>
    );
  }
  return (
    <div class="cd-bars parts" role="img" aria-label="The bar picture">
      <div class={cls('cd-bar', 'whole', bars.lit === 'whole' && 'lit', bars.whole === null && 'unknown')}><span>{label(bars.whole)}</span></div>
      <div class="cd-bar-row">
        <div class={cls('cd-bar', 'part-a', bars.lit === 0 && 'lit', a === null && 'unknown')} style={{ width: pct(wa) }}><span>{label(a)}</span></div>
        <div class={cls('cd-bar', 'part-b', bars.lit === 1 && 'lit', b === null && 'unknown')} style={{ width: pct(wb) }}><span>{label(b)}</span></div>
      </div>
    </div>
  );
}

// ---------- How Many More: two rows ----------

export interface Rows {
  readonly big: number; readonly small: number; readonly bigLabel: string; readonly smallLabel: string; readonly paired: boolean; readonly glow: boolean;
  /** The row whose number is asked: labelled "?", so the lesson shows the story without saying the answer (pass 2). */
  readonly unknown?: 'big' | 'small' | null;
}
/** Two rows of counters. Paired, the small row's counters sit under the big row's and a line joins each pair; the ones with no partner
 *  glow. In rows of ten, so 47 and 30 line up ten under ten. */
export function PairRows({ rows, noun }: { rows: Rows; noun: Noun }) {
  const icon = NOUN_ICON[noun];
  const row = (n: number, label: string, which: 'big' | 'small') => (
    <div class={cls('cd-pair-row', which)}>
      <span class="cd-pair-label">{label} <b>{rows.unknown === which ? '?' : n}</b></span>
      <div class="cd-pair-cells">
        {Array.from({ length: n }, (_, i) => <i key={i} class={cls(rows.paired && i < rows.small && 'paired', rows.glow && which === 'big' && i >= rows.small && 'glow', i % 10 === 9 && 'tenth')}>{n <= 30 ? icon : ''}</i>)}
      </div>
    </div>
  );
  return (
    <div class={cls('cd-pairs', rows.paired && 'paired', rows.big > 30 && 'many')} role="img" aria-label="Two rows to compare">
      {row(rows.big, rows.bigLabel, 'big')}
      {row(rows.small, rows.smallLabel, 'small')}
    </div>
  );
}

// ---------- the Mission Board ----------

export interface GraphMarks { readonly across?: number | null; readonly counted?: number; readonly lit?: readonly number[] }
/** The bar graph: four squadrons' bars, the scale up the side counting by its step, a line every step. `across`: draw the line from
 *  that bar's top to the scale; `counted`: light the scale's numbers up to this one, as they are counted. */
export function BarGraph({ q, marks = {} }: { q: BoardProblem; marks?: GraphMarks }) {
  const W = 360, H = 260, left = 40, bottom = 26, top = 10, plotH = H - bottom - top, n = q.top / q.step;
  const y = (v: number) => H - bottom - (v / q.top) * plotH;
  const bw = (W - left - 10) / 4;
  const across = marks.across ?? null;
  return (
    <svg class="cd-graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Crates each squadron carried">
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = i * q.step, on = marks.counted !== undefined && v <= marks.counted && v > 0;
        return (
          <g key={i}>
            <line x1={left} x2={W - 6} y1={y(v)} y2={y(v)} class={cls('gl', i === 0 && 'base')} />
            <text x={left - 6} y={y(v) + 5} class={cls('gn', on && 'on')} text-anchor="end">{v}</text>
          </g>
        );
      })}
      {q.bars.map((v, i) => {
        const x = left + 8 + i * bw, lit = marks.lit?.includes(i) || q.asked.includes(i);
        return (
          <g key={i}>
            <rect x={x} y={y(v)} width={bw - 16} height={y(0) - y(v)} fill={SQUAD_HEX[q.squads[i]!]} class={cls('gb', lit && 'asked')} rx="3" />
            <text x={x + (bw - 16) / 2} y={H - 8} class="gs" text-anchor="middle">{q.squads[i]}</text>
          </g>
        );
      })}
      {across !== null && <line x1={left} x2={left + 8 + across * bw + (bw - 16)} y1={y(q.bars[across]!)} y2={y(q.bars[across]!)} class="gacross" />}
    </svg>
  );
}

// ---------- a number sentence ----------

/** A number sentence written across, with a lit part ('l', 'r', 'res', or the op) and the box filled once it's known. */
export function EqCard({ eq, lit, filled, children }: { eq: Eq; lit?: 'l' | 'r' | 'res' | 'op' | null; filled?: number | null; children?: ComponentChildren }) {
  const part = (k: 'l' | 'r' | 'res') => {
    const v = eq[k], box = v === null;
    return <span class={cls('cd-eqp', lit === k && 'lit', box && 'box', box && filled !== undefined && filled !== null && 'filled')}>{box ? (filled ?? '?') : v}</span>;
  };
  return (
    <div class="cd-eq" aria-label={eqText(eq)}>
      {part('l')}<span class={cls('cd-eqop', lit === 'op' && 'lit')}>{eq.op === '+' ? '+' : '−'}</span>{part('r')}<span class="cd-eqop">=</span>{part('res')}{children}
    </div>
  );
}
