// What Big Air asks: six kinds of measuring, three Levels each, with Stretch inside a Level. Every question has exactly one right answer:
// a number typed on the number pad (Ruler, How Much Longer), a tap on the line (Jump Line Levels 1 and 2) or one of two or three choices.
// Every number is from 0 to 100. problems.test.ts makes thousands and checks each one against the brief's rules.
//
// Rulers: zero is the first tick, a little in from the end of the wood, and the ticks are evenly spaced (rulerTicks). A thing measured on
// a ruler always ends exactly on a tick: second grade measures to the nearest whole unit, and a thing between two ticks would have two
// arguable answers.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { BIG, SMALL, thingOf, type Thing, type Unit } from './things';

export const KINDS = ['ruler', 'guess', 'longer', 'line', 'story', 'units'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;
export type { Unit };

/** Short Meetings before a question needs them: how to read a ruler, what a centimetre is, what a foot is. */
export const MEETINGS = ['ruler', 'cm', 'feet'] as const;
export type MeetingId = (typeof MEETINGS)[number];

/** A wrong answer that is a real mistake, and which one (the lesson says so). */
export type Why = 'end' | 'ticks' | 'unit' | 'start' | 'longer' | 'shorter' | 'both' | 'ends' | 'ten' | 'ones' | 'tens' | 'other-op' | 'echo' | 'other';
export interface Trap { readonly value: string; readonly why: Why }

/** How far a centimetre is from an inch (an inch is 2.54 cm). */
export const CM_PER_IN = 2.54;

/** A ruler: which unit is along its top edge, how far it runs (0 to `top`), and, on a two-sided ruler, the unit along its bottom. */
export interface Ruler { readonly unit: 'in' | 'cm'; readonly top: number; readonly other?: 'in' | 'cm' }
/** A bar laid on a ruler: where it starts and how long it is, in the ruler's top unit. */
export interface Bar { readonly start: number; readonly len: number }
export type Shape = 'crayon' | 'pencil' | 'stick' | 'truck' | 'ribbon';
export const SHAPES: readonly Shape[] = ['crayon', 'pencil', 'stick', 'truck', 'ribbon'];

interface Common { readonly level: Level; readonly answer: string; readonly traps: readonly Trap[]; readonly needs: readonly MeetingId[] }

export type RulerQ = Common & { readonly kind: 'ruler'; readonly ruler: Ruler; readonly bar: Bar; readonly shape: Shape };
export type GuessQ = Common & { readonly kind: 'guess' } & (
  /** Which is longer in real life? Both drawn the same size, so the picture can't tell him. */
  | { readonly form: 'longer'; readonly a: string; readonly b: string; readonly choices: readonly string[] }
  /** About how long is it: 2 feet or 20 feet? */
  | { readonly form: 'about'; readonly thing: string; readonly unit: Unit; readonly choices: readonly string[] }
  /** Inches or feet: which would you use? */
  | { readonly form: 'unit'; readonly thing: string; readonly choices: readonly ['in', 'ft'] }
);
export type LongerQ = Common & { readonly kind: 'longer' } & (
  /** Two bars on one ruler (red on top, blue below): both from zero at Level 1, not lined up at Level 3. */
  | { readonly form: 'ruler'; readonly ruler: Ruler; readonly a: Bar; readonly b: Bar }
  /** Two jumps given as numbers, with their bars to scale. */
  | { readonly form: 'jumps'; readonly a: number; readonly b: number }
);
export type LineQ = Common & { readonly kind: 'line' } & (
  /** Tap where `n` is on a 0 to 100 line ticked in tens; only `labels` are written. */
  | { readonly form: 'tens'; readonly n: number; readonly labels: readonly number[] }
  /** Tap where `n` is on a stretch of the line from `lo` to `lo + 10`, ticked in ones. */
  | { readonly form: 'ones'; readonly lo: number; readonly n: number; readonly labels: readonly number[] }
  /** A jump of `a`, then `b` more: where does it land? Three choices. */
  | { readonly form: 'hops'; readonly a: number; readonly b: number; readonly choices: readonly string[] }
);
export type StoryForm = 'add-piece' | 'end-to-end' | 'cut' | 'shorter' | 'shorter-than' | 'longer-than' | 'start-add' | 'start-cut';
export type StoryQ = Common & {
  readonly kind: 'story'; readonly form: StoryForm;
  /** The two numbers in the story, in the order said. */
  readonly x: number; readonly y: number;
  readonly choices: readonly string[];
  /** How the bars are drawn: end to end (put together, or the start unknown) or one above the other (comparing, cutting). */
  readonly bars: 'join' | 'stack';
};
export type UnitsQ = Common & { readonly kind: 'units' } & (
  /** A thing on a ruler marked in inches along the top and centimetres along the bottom: which number is bigger (or smaller)? */
  | { readonly form: 'which'; readonly inches: number; readonly cm: number; readonly want: 'bigger' | 'smaller'; readonly shape: Shape; readonly choices: readonly ['in', 'cm'] }
  /** It is 3 feet long. Would it be more inches or fewer? */
  | { readonly form: 'more'; readonly n: number; readonly unit: Unit; readonly to: Unit; readonly choices: readonly ['more', 'fewer'] }
  /** The same jump in feet and in inches (or a toy in inches and centimetres): which number goes with this unit? */
  | { readonly form: 'match'; readonly big: { readonly unit: Unit; readonly n: number }; readonly small: { readonly unit: Unit; readonly n: number }; readonly ask: Unit; readonly choices: readonly string[] }
);
export type Question = RulerQ | GuessQ | LongerQ | LineQ | StoryQ | UnitsQ;

export const TOP = 100;
const traps = (answer: number | string, list: ReadonlyArray<readonly [number | string, Why]>): Trap[] => {
  const seen = new Set([String(answer)]), out: Trap[] = [];
  for (const [v, why] of list) {
    if (typeof v === 'number' && (v < 0 || v > TOP || !Number.isInteger(v))) continue;
    if (seen.has(String(v))) continue;
    seen.add(String(v));
    out.push({ value: String(v), why });
  }
  return out;
};
/** The right answer and the first `n - 1` real mistakes, shuffled; a made-up near number fills in if there are too few mistakes. */
function choicesOf(rng: Rng, answer: number, ts: readonly Trap[], n = 3): string[] {
  const out = [String(answer), ...ts.map(t => t.value).slice(0, n - 1)];
  for (const d of [1, 2, -1, -2, 3, -3, 5, -5]) { if (out.length >= n) break; const v = answer + d; if (v >= 1 && v <= TOP && !out.includes(String(v))) out.push(String(v)); }
  return shuffle(rng, out);
}

// ---------- Ruler ----------

/** Where each tick of a ruler sits, from the left end of the wood, in units of the top scale: zero is `PAD` in from the end, and every
 *  tick after it is one unit further. The other scale's ticks (a two-sided ruler) use the same zero. */
export const RULER_PAD = 0.5;
export function rulerTicks(r: Ruler): { top: number[]; bottom: number[] } {
  const top = Array.from({ length: r.top + 1 }, (_, i) => RULER_PAD + i);
  if (!r.other) return { top, bottom: [] };
  const per = r.unit === 'in' ? CM_PER_IN : 1 / CM_PER_IN; // other units per top unit
  const count = Math.floor(r.top * per + 1e-9);
  return { top, bottom: Array.from({ length: count + 1 }, (_, i) => RULER_PAD + i / per) };
}
/** What the other scale reads at `x` top units from zero, to the nearest whole one. */
export const otherReading = (r: Ruler, x: number) => Math.round(x * (r.unit === 'in' ? CM_PER_IN : 1 / CM_PER_IN));

function makeRuler(level: Level, stretch: Stretch, rng: Rng): RulerQ {
  const shape = pick(rng, SHAPES);
  if (level === 1) {
    const len = stretch === 0 ? int(rng, 2, 4) : int(rng, 1, 6);
    return { kind: 'ruler', level, ruler: { unit: 'in', top: 8 }, bar: { start: 0, len }, shape, answer: String(len), traps: traps(len, [[len + 1, 'ticks'], [len - 1, 'other']]), needs: ['ruler'] };
  }
  if (level === 2) {
    // inches up to 12 first; then centimetres up to 20, on a two-sided ruler once he's further on
    const cm = stretch > 0 && rng() < (stretch === 1 ? .4 : .6);
    if (!cm) {
      const len = int(rng, stretch === 0 ? 5 : 6, 12);
      return { kind: 'ruler', level, ruler: { unit: 'in', top: 12 }, bar: { start: 0, len }, shape, answer: String(len), traps: traps(len, [[len + 1, 'ticks']]), needs: ['ruler'] };
    }
    const len = int(rng, 6, 20), top = Math.min(20, Math.max(12, len + 2)), ruler: Ruler = stretch === 2 ? { unit: 'cm', top, other: 'in' } : { unit: 'cm', top };
    return {
      kind: 'ruler', level, ruler, bar: { start: 0, len }, shape, answer: String(len),
      traps: traps(len, [[len + 1, 'ticks'], ...(ruler.other ? [[otherReading(ruler, len), 'unit'] as const] : [])]), needs: ['ruler', 'cm'],
    };
  }
  // Level 3: the thing does not start at zero
  const cm = rng() < .4, top = cm ? 20 : 12, two = stretch === 2 && rng() < .5;
  const ruler: Ruler = cm ? { unit: 'cm', top, ...(two && { other: 'in' as const }) } : { unit: 'in', top, ...(two && { other: 'cm' as const }) };
  const start = int(rng, 1, cm ? 8 : 5), len = int(rng, 2, Math.min(cm ? 12 : 7, top - start));
  const end = start + len;
  // a centimetre ruler only runs a little past the thing, so its ticks stay big on a phone
  if (cm) (ruler as { top: number }).top = Math.min(20, Math.max(12, end + 2));
  return {
    kind: 'ruler', level, ruler, bar: { start, len }, shape, answer: String(len),
    traps: traps(len, [[end, 'end'], [len + 1, 'ticks'], [start, 'start'], ...(ruler.other ? [[otherReading(ruler, len), 'unit'] as const] : [])]),
    needs: cm ? ['ruler', 'cm'] : ['ruler'],
  };
}

// ---------- Best Guess ----------

/** The wrong estimate: ten times too big or too small (or five times, to stay within 100), never closer than five times. */
export function wrongEstimate(n: number, rng: Rng): number {
  const options = [n * 10, n / 10, n * 5, n / 5].filter(x => Number.isInteger(x) && x >= 1 && x <= TOP && Math.max(x, n) / Math.min(x, n) >= 5);
  return options.length ? pick(rng, options) : n >= 5 ? Math.floor(n / 5) : n * 5;
}
function makeGuess(level: Level, stretch: Stretch, rng: Rng): GuessQ {
  if (level === 1) {
    // a small thing and a big one, always at least five times apart (the test checks every pair)
    const small = pick(rng, SMALL), big = pick(rng, stretch === 0 ? BIG : [...BIG, ...SMALL.filter(s => s.inches * 5 <= small.inches)].filter(x => x.inches >= small.inches * 5));
    const [a, b] = shuffle(rng, [small, big] as Thing[]);
    return { kind: 'guess', level, form: 'longer', a: a!.id, b: b!.id, choices: [a!.id, b!.id], answer: big.id, traps: [{ value: small.id, why: 'other' }], needs: [] };
  }
  if (level === 2) {
    const cm = stretch === 2 && rng() < .3;
    const th = cm ? pick(rng, SMALL.filter(s => s.cm)) : pick(rng, stretch === 0 ? BIG : [...BIG, ...SMALL]);
    const unit: Unit = cm ? 'cm' : th.about.unit, n = cm ? th.cm! : th.about.n, wrong = wrongEstimate(n, rng);
    const needs: MeetingId[] = unit === 'cm' ? ['cm'] : unit === 'ft' ? ['feet'] : [];
    return { kind: 'guess', level, form: 'about', thing: th.id, unit, choices: shuffle(rng, [String(n), String(wrong)]), answer: String(n), traps: [{ value: String(wrong), why: 'other' }], needs };
  }
  const th = pick<Thing>(rng, rng() < .5 ? SMALL : BIG);
  return { kind: 'guess', level, form: 'unit', thing: th.id, choices: ['in', 'ft'], answer: th.about.unit, traps: [{ value: th.about.unit === 'in' ? 'ft' : 'in', why: 'unit' }], needs: ['feet'] };
}

// ---------- How Much Longer ----------

function makeLonger(level: Level, stretch: Stretch, rng: Rng): LongerQ {
  if (level === 1) {
    const top = 12, a = int(rng, stretch === 0 ? 4 : 3, top), b = int(rng, 1, a - 1), d = a - b;
    return { kind: 'longer', level, form: 'ruler', ruler: { unit: 'in', top }, a: { start: 0, len: a }, b: { start: 0, len: b }, answer: String(d),
      traps: traps(d, [[a, 'longer'], [b, 'shorter'], [d + 1, 'ticks'], [a + b, 'both']]), needs: ['ruler'] };
  }
  if (level === 2) {
    // two jumps as numbers: within 20, then no borrowing to 60, then any to 99
    let a: number, b: number;
    for (;;) {
      if (stretch === 0) { a = int(rng, 8, 20); b = int(rng, 2, a - 1); break; }
      if (stretch === 1) { a = int(rng, 21, 60); b = int(rng, 10, a - 1); if (b % 10 <= a % 10) break; continue; }
      a = int(rng, 31, 99); b = int(rng, 11, a - 2); break;
    }
    const d = a - b;
    return { kind: 'longer', level, form: 'jumps', a, b, answer: String(d), traps: traps(d, [[a + b, 'both'], [a, 'longer'], [d + 10, 'ten'], [d - 10, 'ten']]), needs: ['feet'] };
  }
  // Level 3: two bars that don't line up at the start; the lengths, not the ends, are compared
  const cm = rng() < .4, top = cm ? 20 : 12;
  for (;;) {
    const la = int(rng, 3, cm ? 12 : 8), lb = int(rng, 1, la - 1), sa = int(rng, 0, top - la), sb = int(rng, 0, top - lb);
    const ea = sa + la, eb = sb + lb;
    // the ends must tell a different story from the lengths, or reading the ends would be right by luck
    if (sa === sb || ea - eb === la - lb || Math.abs(ea - eb) === la - lb) continue;
    const d = la - lb;
    return { kind: 'longer', level, form: 'ruler', ruler: { unit: cm ? 'cm' : 'in', top }, a: { start: sa, len: la }, b: { start: sb, len: lb }, answer: String(d),
      traps: traps(d, [[Math.abs(ea - eb), 'ends'], [la, 'longer'], [ea, 'end'], [d + 1, 'ticks']]), needs: cm ? ['ruler', 'cm'] : ['ruler'] };
  }
}

// ---------- Jump Line ----------

function makeLine(level: Level, stretch: Stretch, rng: Rng): LineQ {
  if (level === 1) {
    const labels = stretch === 0 ? [0, 20, 40, 60, 80, 100] : stretch === 1 ? [0, 50, 100] : [0, 100];
    const n = pick(rng, [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(x => !labels.includes(x)));
    return { kind: 'line', level, form: 'tens', n, labels, answer: String(n), traps: traps(n, [[n + 10, 'ticks'], [n - 10, 'ticks']]), needs: ['feet'] };
  }
  if (level === 2) {
    const lo = int(rng, 0, 9) * 10, labels = stretch === 0 ? [lo, lo + 5, lo + 10] : [lo, lo + 10];
    const n = pick(rng, [1, 2, 3, 4, 6, 7, 8, 9].filter(k => !labels.includes(lo + k)).map(k => lo + k));
    return { kind: 'line', level, form: 'ones', lo, n, labels, answer: String(n), traps: traps(n, [[n + 1, 'ticks'], [n - 1, 'ticks']]), needs: ['feet'] };
  }
  // a hop and then another: whole tens more, then no carrying, then carrying
  let a: number, b: number;
  for (;;) {
    a = int(rng, 11, 59);
    b = stretch === 0 ? int(rng, 1, 4) * 10 : int(rng, 11, 39);
    const carry = (a % 10) + (b % 10) >= 10;
    if (a + b > TOP || b % 10 === 0 && stretch > 0) continue;
    if (stretch === 1 && carry) continue;
    if (stretch === 2 && !carry) continue;
    break;
  }
  const sum = a + b, t = traps(sum, [[a + (b % 10), 'tens'], [a + Math.floor(b / 10) * 10, 'ones'], [sum + 10, 'ten'], [sum - 10, 'ten'], [sum + 1, 'ticks']]);
  return { kind: 'line', level, form: 'hops', a, b, choices: choicesOf(rng, sum, t), answer: String(sum), traps: t, needs: ['feet'] };
}

// ---------- Length Stories ----------

/** The stories at each Level. Level 1 puts lengths together; Level 2 takes away and compares (with "longer" stories that add and
 *  "shorter" ones that take away, so no word gives the sum away); Level 3 asks for the start. */
export const STORY_FORMS: Record<Level, readonly StoryForm[]> = {
  1: ['add-piece', 'end-to-end'],
  2: ['cut', 'shorter', 'shorter-than', 'longer-than'],
  3: ['start-add', 'start-cut', 'longer-than'],
};
/** Two numbers whose sum is to `top`: round tens first, then no carrying, then carrying. */
function addends(stretch: Stretch, rng: Rng, top: number): [number, number] {
  for (;;) {
    let x: number, y: number;
    if (stretch === 0) { x = int(rng, 1, 6) * 10; y = int(rng, 1, 3) * 10; if (rng() < .5) y = int(rng, 2, 9); }
    else if (stretch === 1) { x = int(rng, 11, 60); y = int(rng, 3, 30); if ((x % 10) + (y % 10) >= 10) continue; }
    else { x = int(rng, 15, 70); y = int(rng, 6, 29); if ((x % 10) + (y % 10) < 10) continue; }
    if (x + y <= top && x !== y) return [x, y];
  }
}
export function storyAnswer(form: StoryForm, x: number, y: number): number {
  switch (form) {
    case 'add-piece': case 'end-to-end': case 'longer-than': case 'start-cut': return x + y;
    case 'cut': case 'shorter': case 'shorter-than': case 'start-add': return x - y;
  }
}
function makeStory(level: Level, stretch: Stretch, rng: Rng): StoryQ {
  const form = pick(rng, STORY_FORMS[level]);
  let x: number, y: number;
  if (form === 'add-piece' || form === 'end-to-end' || form === 'longer-than' || form === 'start-cut') {
    // x is said first: the length there was, and y what was added (or how much longer, or what was cut)
    [x, y] = addends(level === 1 ? stretch : (Math.min(2, stretch + 1) as Stretch), rng, TOP);
  } else {
    const [p, q] = addends(level === 2 ? stretch : (Math.min(2, stretch + 1) as Stretch), rng, TOP);
    x = p + q; y = q; // x − y = p: the total and the part taken
  }
  const answer = storyAnswer(form, x, y), other = form === 'start-add' || form === 'cut' || form === 'shorter' || form === 'shorter-than' ? x + y : x - y;
  const t = traps(answer, [[other, 'other-op'], [answer + 10, 'ten'], [answer - 10, 'ten'], [answer + 1, 'ticks']]).filter(tr => tr.value !== String(x) && tr.value !== String(y));
  const bars = form === 'cut' || form === 'shorter' || form === 'shorter-than' || form === 'longer-than' ? 'stack' : 'join';
  return { kind: 'story', level, form, x, y, choices: fill(rng, answer, t, [x, y]), answer: String(answer), traps: t, bars, needs: ['feet'] };
}
/** Three choices without the story's own numbers. */
function fill(rng: Rng, answer: number, ts: readonly Trap[], said: readonly number[]): string[] {
  const out = [String(answer)];
  for (const v of [...ts.map(t => Number(t.value)), answer + 2, answer - 2, answer + 3, answer - 3, answer + 5, answer - 5])
    if (out.length < 3 && v >= 1 && v <= TOP && !out.includes(String(v)) && !said.includes(v)) out.push(String(v));
  return shuffle(rng, out);
}

// ---------- Two Units ----------

/** Lengths in whole inches that are about a whole number of centimetres (2 in is about 5 cm, 4 about 10, 6 about 15, 8 about 20). */
export const IN_CM = [[2, 5], [4, 10], [6, 15], [8, 20]] as const;
function makeUnits(level: Level, stretch: Stretch, rng: Rng): UnitsQ {
  if (level === 1) {
    const [inches, cm] = pick(rng, IN_CM), want = rng() < .5 ? 'bigger' : 'smaller';
    return { kind: 'units', level, form: 'which', inches, cm, want, shape: pick(rng, SHAPES), choices: ['in', 'cm'], answer: want === 'bigger' ? 'cm' : 'in', traps: [{ value: want === 'bigger' ? 'in' : 'cm', why: 'unit' }], needs: ['cm'] };
  }
  if (level === 2) {
    // half ask about a smaller unit (more of them), half about a bigger one (fewer)
    const pairs: ReadonlyArray<readonly [Unit, Unit, number, number]> = [['ft', 'in', 2, 8], ['in', 'ft', 15, 40], ['in', 'cm', 2, 12], ['cm', 'in', 6, 30]];
    const usable = stretch === 0 ? pairs.filter(p => p[0] !== 'cm' && p[1] !== 'cm') : pairs;
    const [unit, to, lo, hi] = pick(rng, usable), n = int(rng, lo, hi), answer = smaller(to, unit) ? 'more' : 'fewer';
    return { kind: 'units', level, form: 'more', n, unit, to, choices: ['more', 'fewer'], answer, traps: [{ value: answer === 'more' ? 'fewer' : 'more', why: 'unit' }], needs: unit === 'cm' || to === 'cm' ? ['feet', 'cm'] : ['feet'] };
  }
  // the same jump in feet and inches, or a toy in inches and centimetres: match the number to the unit (the bigger number goes with the
  // smaller unit). The numbers are the real measures, but he is never asked to work one out from the other.
  const feet = stretch === 0 || rng() < .6;
  let big: { unit: Unit; n: number }, small: { unit: Unit; n: number };
  if (feet) { const f = int(rng, 2, 8); big = { unit: 'ft', n: f }; small = { unit: 'in', n: f * 12 }; }
  else { const [i, c] = pick(rng, IN_CM); big = { unit: 'in', n: i }; small = { unit: 'cm', n: c }; }
  const ask = rng() < .5 ? big.unit : small.unit, answer = ask === big.unit ? big.n : small.n, wrong = ask === big.unit ? small.n : big.n;
  return { kind: 'units', level, form: 'match', big, small, ask, choices: shuffle(rng, [String(big.n), String(small.n)]), answer: String(answer), traps: [{ value: String(wrong), why: 'unit' }], needs: feet ? ['feet'] : ['cm'] };
}
/** Is `a` a smaller unit than `b`? */
export const smaller = (a: Unit, b: Unit) => SIZE[a] < SIZE[b];
const SIZE: Record<Unit, number> = { cm: 1, in: CM_PER_IN, ft: 12 * CM_PER_IN };

// ---------- any kind ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'ruler': return makeRuler(level, stretch, rng);
    case 'guess': return makeGuess(level, stretch, rng);
    case 'longer': return makeLonger(level, stretch, rng);
    case 'line': return makeLine(level, stretch, rng);
    case 'story': return makeStory(level, stretch, rng);
    case 'units': return makeUnits(level, stretch, rng);
  }
}

/** Is this the answer? Null when it isn't an answer at all (an empty pad). */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (answer === '') return null;
  return answer === q.answer;
}
/** Which real mistake a wrong answer was, if any. */
export const whyOf = (q: Question, answer: string): Why | null => q.traps.find(t => t.value === answer)?.why ?? null;
/** How he answers it. */
export const inputOf = (q: Question): 'pad' | 'tap' | 'choices' =>
  q.kind === 'ruler' || q.kind === 'longer' ? 'pad' : q.kind === 'line' && q.form !== 'hops' ? 'tap' : 'choices';
export { thingOf };

/** How a story is drawn (pictures.tsx, StoryBars): which lengths are known, and which is asked. */
export function storyPicture(q: StoryQ) {
  const k = (n: number, known: boolean) => ({ n, known }), x = q.x, y = q.y, a = Number(q.answer);
  switch (q.form) {
    case 'add-piece': case 'end-to-end': return { join: true as const, first: k(x, true), second: k(y, true), whole: k(x + y, false) };
    case 'start-add': return { join: true as const, first: k(a, false), second: k(y, true), whole: k(x, true) };
    case 'start-cut': return { join: true as const, first: k(x, true), second: k(y, true), whole: k(a, false) };
    case 'cut': return { join: false as const, top: k(x, true), bottom: k(a, false), diff: k(y, true) };
    case 'shorter': return { join: false as const, top: k(x, true), bottom: k(y, true), diff: k(a, false) };
    case 'shorter-than': return { join: false as const, top: k(x, true), bottom: k(a, false), diff: k(y, true) };
    case 'longer-than': return { join: false as const, top: k(a, false), bottom: k(x, true), diff: k(y, true) };
  }
}
/** What the story says, in clips: the numbers are said as lengths ("12 feet"). */
export function storySaid(q: StoryQ, L: (n: number) => string): string[] {
  const x = L(q.x), y = L(q.y);
  switch (q.form) {
    case 'add-piece': return ['The ramp is', x, 'long.', 'He adds a piece', y, 'long.', 'How long is the ramp now?'];
    case 'end-to-end': return ['A row of cars is', x, 'long.', 'A row of buses is', y, 'long.', 'He puts them end to end.', 'How long is that?'];
    case 'cut': return ['The rope is', x, 'long.', 'He cuts off', y, 'How long is the rope now?'];
    case 'shorter': return ['The red jump went', x, 'The blue jump went', y, 'How much shorter was the blue jump?'];
    case 'shorter-than': return ['The blue jump was', y, 'shorter than the red jump.', 'The red jump went', x, 'How far did the blue jump go?'];
    case 'longer-than': return ['The red jump was', y, 'longer than the blue jump.', 'The blue jump went', x, 'How far did the red jump go?'];
    case 'start-add': return ['He added', y, 'to the ramp.', 'Now it is', x, 'long.', 'How long was the ramp before?'];
    case 'start-cut': return ['He cut', y, 'off the rope.', 'Now it is', x, 'long.', 'How long was the rope before?'];
  }
}
