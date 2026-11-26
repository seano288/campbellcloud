// The pictures the questions are asked on, drawn as SVG so they stay sharp at any size: a wooden ruler with big ticks (zero is the first
// tick, a little in from the end of the wood), things laid on it, the yellow tape of the Jump Line, jumps as bars, the things of Best Guess
// beside a child, a story's bars, and units laid along a thing. The lessons (teach.ts) move these same pictures.
//
// On-screen inches are not real inches: a ruler is drawn to fill the space it has, so one "inch" is as wide as the screen allows.
import type { ComponentChildren } from 'preact';
import { CHILD_INCHES, thingOf, type Thing } from './things';
import { CM_PER_IN, RULER_PAD, rulerTicks, type Bar, type Ruler, type Shape, type Unit } from './problems';
import type { Show } from './teach';
import { unitWord } from '../phrases';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
/** Svg units in one unit of the ruler. */
const U = 40;
const SHORT: Record<Unit, string> = { in: 'in', cm: 'cm', ft: 'ft' };

// ---------- things laid on a ruler ----------

/** A thing to measure, from x0 to x1 (svg units), standing on y: its ends are exactly where it starts and stops. */
function Thing({ shape, x0, x1, y, h, colour }: { shape: Shape; x0: number; x1: number; y: number; h: number; colour: string }) {
  const w = x1 - x0;
  if (shape === 'crayon') {
    const tip = Math.min(w * .25, h * 1.1);
    return <g class="thing">
      <path d={`M${x0} ${y - h}H${x1 - tip}L${x1} ${y - h / 2}L${x1 - tip} ${y}H${x0}Z`} fill={colour} stroke="#1b1e24" stroke-width="3" stroke-linejoin="round" />
      <rect x={x0 + w * .12} y={y - h * .78} width={Math.max(4, (w - tip) * .55)} height={h * .56} rx="3" fill="rgba(255,255,255,.45)" />
    </g>;
  }
  if (shape === 'pencil') {
    const tip = Math.min(w * .22, h * 1.2), rub = Math.min(w * .12, h * .8);
    return <g class="thing">
      <rect x={x0} y={y - h} width={rub} height={h} fill="#ff9ad5" stroke="#1b1e24" stroke-width="3" />
      <path d={`M${x0 + rub} ${y - h}H${x1 - tip}L${x1} ${y - h / 2}L${x1 - tip} ${y}H${x0 + rub}Z`} fill="#ffd23f" stroke="#1b1e24" stroke-width="3" stroke-linejoin="round" />
      <path d={`M${x1 - tip * .35} ${y - h * .68}L${x1} ${y - h / 2}L${x1 - tip * .35} ${y - h * .32}Z`} fill="#1b1e24" />
    </g>;
  }
  if (shape === 'truck') {
    const r = h * .32;
    return <g class="thing">
      <rect x={x0} y={y - h} width={w * .62} height={h - r} rx="4" fill={colour} stroke="#1b1e24" stroke-width="3" />
      <rect x={x0 + w * .6} y={y - h * .72} width={w * .4} height={h * .72 - r} rx="4" fill={colour} stroke="#1b1e24" stroke-width="3" />
      <circle cx={x0 + r * 1.3} cy={y - r} r={r} fill="#1b1e24" /><circle cx={x1 - r * 1.3} cy={y - r} r={r} fill="#1b1e24" />
    </g>;
  }
  if (shape === 'ribbon') {
    return <g class="thing"><path d={`M${x0} ${y - h}H${x1}L${x1 - h * .3} ${y - h / 2}L${x1} ${y}H${x0}L${x0 + h * .3} ${y - h / 2}Z`} fill={colour} stroke="#1b1e24" stroke-width="3" stroke-linejoin="round" /></g>;
  }
  return <g class="thing"><rect x={x0} y={y - h} width={w} height={h} rx="5" fill={colour} stroke="#1b1e24" stroke-width="3" /></g>;
}

export interface Laid { readonly bar: Bar; readonly colour: string; readonly shape: Shape; readonly slide?: number }
/** A ruler with things laid above it. `hops` draws hops from the first thing's (slid) start, the last one lit; `overlay` lays the second
 *  thing on the first and lights `count` units of what's left over; `lit` lights a whole-unit tick number (the answer). */
export function RulerPic({ ruler, laid, hops = 0, overlay, label }: {
  ruler: Ruler; laid: readonly Laid[]; hops?: number; overlay?: { count: number }; label?: string;
}) {
  const ticks = rulerTicks(ruler), W = (ruler.top + RULER_PAD * 2) * U, rowH = U * 1.05, top = laid.length * rowH + U * .6, woodH = ruler.other ? U * 2.9 : U * 1.95;
  const H = top + woodH + 4, x = (v: number) => (RULER_PAD + v) * U;
  // numbers as big as their spaces allow: bigger on a short ruler, a touch smaller where two digits sit in every space
  const size = ruler.top <= 8 ? 'big' : ruler.top > 12 ? 'dense' : '';
  const first = laid[0];
  return (
    <svg class="ba-ruler" viewBox={`-4 0 ${W + 8} ${H}`} role="img" aria-label={label ?? `A ruler marked in ${unitWord(ruler.unit)}`}>
      {laid.map((l, i) => {
        const at = overlay && i === 1 && laid[0] ? laid[0].bar.start + (l.slide ?? 0) : l.bar.start + (l.slide ?? 0);
        const y = overlay && i === 1 ? top - rowH * (laid.length - 1) - U * .05 : top - rowH * (laid.length - 1 - i) - U * .1;
        return <g key={i} class="laid" style={{ transform: `translateX(${(at - l.bar.start) * U}px)` }}>
          <Thing shape={l.shape} x0={x(l.bar.start)} x1={x(l.bar.start + l.bar.len)} y={y} h={U * .75} colour={l.colour} />
        </g>;
      })}
      {overlay && laid[0] && laid[1] && (
        <g class="left-over">{Array.from({ length: overlay.count }, (_, k) => {
          const from = laid[0]!.bar.start + laid[1]!.bar.len + k;
          return <rect key={k} x={x(from) + 2} y={top - rowH * (laid.length - 1) - U * .9} width={U - 4} height={U * .8} rx="4" class="lit-unit" />;
        })}</g>
      )}
      {hops > 0 && first && (
        <g class="hops">{Array.from({ length: hops }, (_, k) => {
          const a = x(first.bar.start + (first.slide ?? 0) + k), b = a + U;
          return <path key={k} d={`M${a} ${top}Q${(a + b) / 2} ${top - U * .9} ${b} ${top}`} class={cls('hop', k === hops - 1 && 'last')} />;
        })}</g>
      )}
      <rect x="0" y={top} width={W} height={woodH} rx="8" class="wood" />
      <rect x="4" y={top + woodH - 9} width={W - 8} height="5" rx="2" class="wood-edge" />
      {ticks.top.map((t, i) => (
        <g key={i}>
          <line x1={t * U} x2={t * U} y1={top} y2={top + U * (i % 5 === 0 || ruler.top <= 12 ? .6 : .45)} class="tick" />
          <text x={t * U} y={top + U * 1.27} class={cls('tick-n', size)}>{i}</text>
        </g>
      ))}
      {/* the unit's name, under the numbers it belongs to (not at the end, where it sat on the last number) */}
      <text x={W / 2} y={ruler.other ? top + U * 1.62 : top + woodH - U * .3} class="unit-name">{unitWord(ruler.unit).toUpperCase()}</text>
      {ruler.other && <>
        {ticks.bottom.map((t, i) => (
          <g key={`b${i}`}>
            <line x1={t * U} x2={t * U} y1={top + woodH} y2={top + woodH - U * .32} class="tick other" />
            {(ruler.other === 'in' || i % 2 === 0) && <text x={t * U} y={top + woodH - U * .42} class="tick-n other">{i}</text>}
          </g>
        ))}
        <text x={W / 2} y={top + U * 2.02} class="unit-name other">{unitWord(ruler.other).toUpperCase()}</text>
      </>}
    </svg>
  );
}

// ---------- the tape ----------

/** Room either side of the tape, in svg units, so its first and last numbers are never cut off. */
export const TAPE_M = 40;
/** The yellow tape with black numbers, as in the Jump: from `lo` to `hi`, a tick every `step` (and a small one every one when `ones`),
 *  `labels` written. `fill` lights it from one number to another; `hops` draws jumps above it; `onTap` hears a tap as a number. */
export function Tape({ lo, hi, step, labels, ones, fill, hops = [], mark, onTap, label }: {
  lo: number; hi: number; step: number; labels: readonly number[]; ones?: boolean; fill?: { from: number; to: number } | null;
  hops?: readonly { from: number; to: number; text: string }[]; mark?: number | null; onTap?: (n: number) => void; label: string;
}) {
  const W = 1000, padX = 40, H = 230, y0 = 120, th = 92, x = (n: number) => padX + ((n - lo) / (hi - lo)) * (W - padX * 2);
  function tap(e: PointerEvent) {
    if (!onTap) return;
    const svg = e.currentTarget as SVGSVGElement, b = svg.getBoundingClientRect();
    const vx = ((e.clientX - b.left) / b.width) * (W + TAPE_M * 2) - TAPE_M;
    const n = lo + ((vx - padX) / (W - padX * 2)) * (hi - lo), snap = ones ? 1 : step;
    onTap(Math.max(lo, Math.min(hi, Math.round(n / snap) * snap)));
  }
  const smalls = ones ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) : [];
  const bigs = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  return (
    <svg class={cls('ba-tape', onTap && 'tappable', labels.length > 6 && 'dense')} viewBox={`${-TAPE_M} 0 ${W + TAPE_M * 2} ${H}`} role="img" aria-label={label} onPointerDown={tap}>
      {hops.map((h, i) => {
        const a = x(h.from), b = x(h.to), top = y0 - 20 - Math.min(90, (b - a) * .35);
        return <g key={i} class="tape-hop"><path d={`M${a} ${y0}Q${(a + b) / 2} ${top} ${b} ${y0}`} /><text x={(a + b) / 2} y={top + 28}>{h.text}</text></g>;
      })}
      <rect x={padX - 26} y={y0} width={W - padX * 2 + 52} height={th} rx="10" class="tape-body" />
      {fill && <rect x={x(fill.from)} y={y0 + 6} width={Math.max(0, x(fill.to) - x(fill.from))} height={th - 12} rx="6" class="tape-fill" />}
      {smalls.map(n => <line key={`s${n}`} x1={x(n)} x2={x(n)} y1={y0} y2={y0 + 26} class="tape-tick small" />)}
      {bigs.map(n => <line key={`b${n}`} x1={x(n)} x2={x(n)} y1={y0} y2={y0 + 44} class="tape-tick" />)}
      {labels.map(n => <text key={`l${n}`} x={x(n)} y={y0 + th - 6} class="tape-n">{n}</text>)}
      {mark != null && <g class="tape-mark"><path d={`M${x(mark)} ${y0 - 4}l-16 -30h32z`} /><text x={x(mark)} y={y0 - 42}>{mark}</text></g>}
    </svg>
  );
}

// ---------- jumps as bars ----------

/** Two jumps as bars to scale, red above, blue below, each with its length; the lesson lays the blue one on the red and counts the rest. */
export function JumpBars({ a, b, laid, count, unit = 'ft' }: { a: number; b: number; laid?: boolean; count?: number; unit?: Unit }) {
  const W = 1000, H = 230, most = Math.max(a, b), x = (n: number) => 20 + (n / most) * (W - 60);
  const yA = 30, yB = laid ? 30 : 130, h = 70;
  return (
    <svg class="ba-bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${a} and ${b} ${unitWord(unit)}`}>
      <rect x={x(0)} y={yA} width={x(a) - x(0)} height={h} rx="10" class="bar red" />
      <text x={x(a) - 12} y={yA + h / 2 + 12} class="bar-n end">{a} {SHORT[unit]}</text>
      <g style={{ transform: `translateY(${yB - 130}px)` }} class="laid">
        <rect x={x(0)} y={130} width={x(b) - x(0)} height={h} rx="10" class={cls('bar', 'blue', laid && 'on-top')} />
        <text x={x(b) - 12} y={130 + h / 2 + 12} class="bar-n end">{b} {SHORT[unit]}</text>
      </g>
      {laid && count != null && count > 0 && <rect x={x(b)} y={yA - 8} width={x(b + count) - x(b)} height={h + 16} rx="8" class="lit-unit" />}
      {laid && count != null && count > 0 && <text x={(x(b) + x(b + count)) / 2} y={yA + h + 70} class="bar-n">{count} {SHORT[unit]}</text>}
    </svg>
  );
}

// ---------- Best Guess ----------

/** A school eraser, pink with a blue sleeve, drawn because no emoji shows one (🧽 is a sponge). Sits in a 120×100 box at (x, y). */
function Eraser({ x = 0, y = 0, w = 120 }: { x?: number; y?: number; w?: number }) {
  const k = w / 120, line = { stroke: '#111', 'stroke-width': 5, 'stroke-linejoin': 'round' as const };
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M30 30H112L90 62H8Z" fill="#ffc2d4" {...line} />
      <path d="M8 62H90V82H8Z" fill="#ff6f9f" {...line} />
      <path d="M90 62L112 30V50L90 82Z" fill="#e0508a" {...line} />
      <path d="M50 30H80L58 62H28Z" fill="#2f8fe8" {...line} />
      <path d="M28 62H58V82H28Z" fill="#1d6fd1" {...line} />
      <path d="M50 42H66M44 50H60" stroke="#fff" stroke-width="4" stroke-linecap="round" />
    </g>
  );
}
/** A thing's picture: its emoji, or a drawing where no emoji fits. */
export function ThingPic({ t }: { t: Thing }) {
  if (t.id === 'eraser') return <svg viewBox="0 0 120 100" aria-hidden="true"><Eraser /></svg>;
  return <>{t.emoji}</>;
}
/** A thing as a card: its picture and its name, all cards the same size so the picture can't tell which is longer. */
export function ThingCard({ id, children }: { id: string; children?: ComponentChildren }) {
  const t = thingOf(id);
  return <span class="thing-card"><span class="thing-emoji" aria-hidden="true"><ThingPic t={t} /></span><span class="thing-name">{t.name}</span>{children}</span>;
}
/** Things side by side at the same scale, with a child standing beside them (about 4 feet tall). */
export function ScalePic({ things }: { things: readonly Thing[] }) {
  const most = Math.max(CHILD_INCHES * .6, ...things.map(t => t.inches)), W = 1000, ground = 270, k = (W - 240) / most;
  const childH = Math.min(220, CHILD_INCHES * k);
  return (
    <svg class="ba-scale" viewBox={`0 0 ${W} 300`} role="img" aria-label="Next to a child">
      <line x1="0" x2={W} y1={ground} y2={ground} class="ground" />
      <text x="190" y={ground - 4} class="child" text-anchor="end" style={{ fontSize: `${Math.max(18, Math.min(170, childH))}px` }}>🧒</text>
      {things.map((t, i) => {
        const w = Math.max(3, t.inches * k), y = ground - 18 - i * 84;
        return <g key={t.id}><rect x="200" y={y - 26} width={w} height="26" rx="6" class={cls('bar', i ? 'blue' : 'red')} />{t.id === 'eraser'
          ? <><Eraser x={200} y={y - 62} w={34} /><text x="242" y={y - 34} class="scale-name">{t.name}</text></>
          : <text x="200" y={y - 34} class="scale-name">{t.emoji} {t.name}</text>}</g>;
      })}
    </svg>
  );
}

// ---------- Length Stories ----------

export interface Len { readonly n: number; readonly known: boolean }
/** How a story is drawn: two pieces end to end with the whole underneath, or two lengths one above the other with the difference lit. */
export type StoryPicture =
  | { readonly join: true; readonly first: Len; readonly second: Len; readonly whole: Len }
  | { readonly join: false; readonly top: Len; readonly bottom: Len; readonly diff: Len };
/** A story's bars. Until the answer is shown (step 3) the length asked about is a "?". Step 1 draws the first bar, 2 the rest. */
export function StoryBars({ pic, step }: { pic: StoryPicture; step: number }) {
  const W = 1000, h = 64, shown = (l: Len) => (l.known || step >= 3 ? `${l.n} ft` : '?');
  if (pic.join) {
    const { first, second, whole } = pic, most = Math.max(whole.n, first.n + second.n), px = (n: number) => 20 + (n / most) * (W - 60);
    return (
      <svg class="ba-bars" viewBox={`0 0 ${W} 230`} role="img" aria-label="The lengths end to end">
        <rect x={px(0)} y="20" width={px(first.n) - px(0)} height={h} rx="10" class={cls('bar', 'red', !first.known && step < 3 && 'unknown')} />
        <text x={(px(0) + px(first.n)) / 2} y={20 + h / 2 + 12} class="bar-n">{shown(first)}</text>
        {step >= 1 && <><rect x={px(first.n)} y="20" width={px(first.n + second.n) - px(first.n)} height={h} rx="10" class={cls('bar', 'blue', !second.known && step < 3 && 'unknown')} />
          <text x={(px(first.n) + px(first.n + second.n)) / 2} y={20 + h / 2 + 12} class="bar-n">{shown(second)}</text></>}
        {step >= 2 && <><rect x={px(0)} y="120" width={px(whole.n) - px(0)} height={h} rx="10" class={cls('bar', 'whole', !whole.known && step < 3 && 'unknown')} />
          <text x={(px(0) + px(whole.n)) / 2} y={120 + h / 2 + 12} class="bar-n">{shown(whole)}</text></>}
      </svg>
    );
  }
  const { top, bottom, diff } = pic, most = Math.max(top.n, bottom.n), px = (n: number) => 20 + (n / most) * (W - 60);
  return (
    <svg class="ba-bars" viewBox={`0 0 ${W} 230`} role="img" aria-label="The lengths one above the other">
      <rect x={px(0)} y="20" width={px(top.n) - px(0)} height={h} rx="10" class={cls('bar', 'red', !top.known && step < 3 && 'unknown')} />
      <text x={px(top.n) - 12} y={20 + h / 2 + 12} class="bar-n end">{shown(top)}</text>
      {step >= 1 && <><rect x={px(0)} y="120" width={px(bottom.n) - px(0)} height={h} rx="10" class={cls('bar', 'blue', !bottom.known && step < 3 && 'unknown')} />
        <text x={px(bottom.n) - 12} y={120 + h / 2 + 12} class="bar-n end">{shown(bottom)}</text></>}
      {step >= 2 && <><rect x={px(bottom.n)} y="118" width={Math.max(4, px(top.n) - px(bottom.n))} height={h + 4} rx="8" class="lit-unit" />
        <text x={(px(bottom.n) + px(top.n)) / 2} y={120 + h + 34} class="bar-n">{shown(diff)}</text></>}
    </svg>
  );
}

// ---------- Two Units ----------

/** A thing with big units laid along its top and small ones along its bottom: plainly, more of the small ones fit. */
export function UnitsPic({ big, small, bigUnit, smallUnit, laidBig, laidSmall, shape = 'stick' }: {
  big: number; small: number; bigUnit: Unit; smallUnit: Unit; laidBig: number; laidSmall: number; shape?: Shape;
}) {
  const W = 1000, len = W - 80, x0 = 40, perBig = len / big, perSmall = len / small;
  return (
    <svg class="ba-units" viewBox={`0 0 ${W} 260`} role="img" aria-label={`${big} ${unitWord(bigUnit)}, ${small} ${unitWord(smallUnit)}`}>
      {Array.from({ length: laidBig }, (_, i) => <rect key={`b${i}`} x={x0 + i * perBig + 2} y="20" width={perBig - 4} height="50" rx="6" class="unit-tile big" />)}
      <Thing shape={shape} x0={x0} x1={x0 + len} y={170} h={80} colour="#ff7a00" />
      {Array.from({ length: laidSmall }, (_, i) => <rect key={`s${i}`} x={x0 + i * perSmall + 1} y="185" width={Math.max(2, perSmall - 2)} height="40" rx="3" class="unit-tile small" />)}
      {laidBig > 0 && <text x={x0 + len} y="58" class="bar-n end">{laidBig} {SHORT[bigUnit]}</text>}
      {laidSmall > 0 && <text x={x0 + len} y="254" class="bar-n end">{laidSmall} {SHORT[smallUnit]}</text>}
    </svg>
  );
}
export { CM_PER_IN };
export type { Show };
