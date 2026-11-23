// What Jetway asks: five kinds, three Levels each, with Stretch inside a Level. Every generated question has exactly one right
// answer (problems.test.ts checks thousands of them). It starts where Math Bots stops: Big Jumps ends at `28 + 5` and `46 + 20` with
// totals under 100, Tens and Ones at two-digit numbers and their signs, Number Chart at ten more and less to 120.
//
// - Boarding (`add`): two groups of passengers board one plane. Level 1 never carries (`34 + 25`), Level 2 always carries a ten
//   (`38 + 25`, totals under 100), Level 3 passes 100 (`67 + 58`).
// - Jumbo (`hundreds`): seats in blocks of a hundred, rows of ten and single seats. Read the blocks (to 199, then 999); which digit is
//   in a place, and numbers with a zero (`306`, `340`); which plane holds more, then <, > or =.
// - Unload (`take`): bags come off a plane. Level 1 never borrows (`57 - 23`), Level 2 always does (`62 - 17`), Level 3 starts from a
//   round number (`80 - 36`, `100 - 36`) and then from past 100 (`143 - 28`).
// - Ten Hops (`hop`): hops along a runway number line. Ten more and ten less to 200, a hundred more and less to 999, then a sum in two
//   hops (`47 + 38`: a jump of 30, then of 8).
// - Missing Bags (`gap`): bags on the belt, how many more fill the cart: to the next ten, to a later ten, then any two numbers.
//
// Boarding, Unload and Missing Bags are answered on number wheels, one for each digit, so he builds the answer and can't pick it by its
// last digit; three wheels only when the answer can pass 100. Jumbo and Ten Hops are three choices. Sums are written across, never
// stacked in columns (the column method is third grade). About one in four is written with the answer on the left (`? = 38 + 25`).
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';

export type Level = 1 | 2 | 3;
export const KINDS = ['add', 'hundreds', 'take', 'hop', 'gap'] as const;
export type Kind = (typeof KINDS)[number];
/** Nothing he is asked, shown or offered goes past this. */
export const TOP = 999;
/** Where the answer goes: the wheels of the sums, or choices. */
export type Wheels = 2 | 3;

const ones = (n: number) => n % 10, tens = (n: number) => Math.floor(n / 10) % 10, hundredsOf = (n: number) => Math.floor(n / 100);
export const digitsOf = (n: number) => ({ h: hundredsOf(n), t: tens(n), o: ones(n) });
/** Adding these two carries a ten from the ones. */
export const carries = (a: number, b: number) => ones(a) + ones(b) >= 10;
/** Taking b from a has to break a ten. */
export const borrows = (a: number, b: number) => ones(a) < ones(b);

// ---------- choices ----------

const uniq = (xs: readonly number[]) => [...new Set(xs)];
/** `wrong` wrong numbers, real mistakes first then near misses, all in [lo, hi]; the right one's place among them is picked first,
 *  so it isn't always in the middle (Math Bots research, 6.3). Sorted, so he reads them in order. */
export function numberChoices(rng: Rng, target: number, traps: readonly number[], wrong: number, lo: number, hi: number, near: readonly number[] = [1, 10, 2, 100]): number[] {
  const usable = uniq(traps.filter(t => t !== target && t >= lo && t <= hi && Number.isInteger(t)));
  const close = (side: 1 | -1) => near.map(d => target + side * d).filter(x => x >= lo && x <= hi);
  const below = uniq([...shuffle(rng, usable.filter(t => t < target)), ...close(-1)]);
  const above = uniq([...shuffle(rng, usable.filter(t => t > target)), ...close(1)]);
  let under = int(rng, 0, wrong);
  if (below.length < under) under = below.length;
  if (above.length < wrong - under) under = wrong - above.length;
  return [...below.slice(0, under), target, ...above.slice(0, wrong - under)].sort((a, b) => a - b);
}

// ---------- Boarding ----------

export interface AddProblem {
  readonly kind: 'add'; readonly a: number; readonly b: number;
  readonly answer: string; readonly flip: boolean; readonly wheels: Wheels;
  /** The real mistakes, for the lesson: the ten not carried, and both columns written down (`513`). */
  readonly traps: { readonly noCarry: number | null; readonly columns: number | null };
}
/** Two two-digit numbers with no carry (`34 + 25`), with a carry and a total under 100 (`38 + 25`), or a total past 100 (`67 + 58`). */
export function makeAdd(level: Level, stretch: Stretch, rng: Rng): AddProblem {
  let a = 0, b = 0;
  for (;;) {
    a = int(rng, 10, 98); b = int(rng, 10, 98);
    const sum = a + b, c = carries(a, b);
    if (level === 1) {
      if (c || sum > 99) continue;
      if (stretch === 0 && (sum > 69 || !ones(a) || !ones(b))) continue;
      if (stretch === 1 && (!ones(a) || !ones(b))) continue;
    } else if (level === 2) {
      if (!c || sum > 99) continue;
      if (stretch === 0 && (ones(a) + ones(b) > 12 || sum > 79)) continue;
    } else {
      if (sum <= 100) continue;
      if (stretch === 0 && c) continue; // the tens pass 100 but the ones don't carry: 74 + 52
      if (stretch === 1 && !c) continue; // both carry: 67 + 58
    }
    break;
  }
  const sum = a + b, c = carries(a, b), o = ones(a) + ones(b), t = tens(a) + tens(b);
  const columns = Number(`${t}${o}`);
  return {
    kind: 'add', a, b, answer: String(sum), flip: rng() < 0.25, wheels: level === 3 ? 3 : 2,
    traps: { noCarry: c ? sum - 10 : null, columns: c && columns !== sum && columns <= TOP ? columns : null },
  };
}

// ---------- Unload ----------

export interface TakeProblem {
  readonly kind: 'take'; readonly a: number; readonly b: number;
  readonly answer: string; readonly flip: boolean; readonly wheels: Wheels;
  /** The real mistakes: the smaller digit taken from the bigger in each column (`62 - 17 = 55`), and the two added. */
  readonly traps: { readonly smallFromBig: number | null; readonly added: number };
}
/** No borrowing (`57 - 23`), borrowing a ten (`62 - 17`), from a round number (`80 - 36`, `100 - 36`), then from past 100 (`143 - 28`). */
export function makeTake(level: Level, stretch: Stretch, rng: Rng): TakeProblem {
  let a = 0, b = 0;
  for (;;) {
    if (level === 3) {
      if (stretch === 0) { a = int(rng, 3, 9) * 10; b = int(rng, 11, a - 2); if (!ones(b)) continue; }
      else if (stretch === 1) { a = rng() < 0.5 ? 100 : int(rng, 3, 9) * 10; b = int(rng, 11, Math.min(99, a - 2)); if (!ones(b)) continue; }
      else { a = int(rng, 101, 199); b = int(rng, 11, 99); if (!ones(b)) continue; }
    } else {
      a = int(rng, 21, 99); b = int(rng, 10, a - 1);
      if (level === 1 && borrows(a, b)) continue;
      if (level === 2 && !borrows(a, b)) continue;
      if (level === 1 && stretch === 0 && (!ones(b) || a - b < 10)) continue;
    }
    if (a - b < 2) continue;
    break;
  }
  const da = digitsOf(a), db = digitsOf(b);
  const small = da.h * 100 + Math.abs(da.t - db.t) * 10 + Math.abs(da.o - db.o);
  return {
    kind: 'take', a, b, answer: String(a - b), flip: rng() < 0.25, wheels: a > 100 ? 3 : 2,
    traps: { smallFromBig: small !== a - b ? small : null, added: a + b },
  };
}

// ---------- Missing Bags ----------

export interface GapProblem {
  readonly kind: 'gap'; readonly a: number; readonly target: number;
  readonly answer: string; readonly flip: boolean; readonly wheels: Wheels;
}
const nextTen = (n: number) => Math.ceil(n / 10) * 10;
/** `38 + ? = 40`, then `38 + ? = 60`, then `38 + ? = 65`. Nothing passes 99. */
export function makeGap(level: Level, stretch: Stretch, rng: Rng): GapProblem {
  let a = 0, target = 0;
  for (;;) {
    a = int(rng, 11, 89);
    if (!ones(a)) continue;
    if (level === 1) { target = nextTen(a); if (stretch === 0 && ones(a) < 5) continue; }
    else if (level === 2) { target = nextTen(a) + 10 * int(rng, 1, 3); if (stretch === 0 && target - nextTen(a) > 10) continue; }
    else {
      target = int(rng, a + 11, 99);
      if (!ones(target)) continue;
      const bridges = ones(target) < ones(a);
      if (stretch === 0 && bridges) continue; // 32 + ? = 65: no ten to pass
      if (stretch === 1 && !bridges) continue; // 38 + ? = 65
    }
    if (target > 99) continue;
    break;
  }
  return { kind: 'gap', a, target, answer: String(target - a), flip: rng() < 0.25, wheels: 2 };
}

// ---------- Jumbo ----------

export type Place = 'hundreds' | 'tens' | 'ones';
export const PLACES: readonly Place[] = ['hundreds', 'tens', 'ones'];
export type Sign = '<' | '>' | '=';
export const SIGNS: readonly Sign[] = ['<', '=', '>'];
export type HundredsProblem =
  /** Blocks on the seat map: which number is it? `jumbled` shows the ones and tens before the hundreds. */
  | { readonly kind: 'hundreds'; readonly form: 'read'; readonly n: number; readonly jumbled: boolean; readonly choices: readonly number[]; readonly answer: string }
  /** "Which digit is in the tens place?" He taps a digit of the number; its digits are all different. */
  | { readonly kind: 'hundreds'; readonly form: 'digit'; readonly n: number; readonly place: Place; readonly answer: string }
  /** `300 + 40 + 6`: which number? */
  | { readonly kind: 'hundreds'; readonly form: 'expanded'; readonly n: number; readonly choices: readonly number[]; readonly answer: string }
  /** Which plane holds more (or fewer)? 'a' or 'b'. */
  | { readonly kind: 'hundreds'; readonly form: 'more'; readonly a: number; readonly b: number; readonly fewer: boolean; readonly answer: 'a' | 'b' }
  /** Which sign goes between? */
  | { readonly kind: 'hundreds'; readonly form: 'sign'; readonly a: number; readonly b: number; readonly answer: Sign };

/** Read wrong: tens and ones swapped, the digits back to front, a block left out or counted twice. */
function readTraps(n: number): number[] {
  const { h, t, o } = digitsOf(n);
  return [h * 100 + o * 10 + t, o * 100 + t * 10 + h, t * 100 + h * 10 + o, n + 10, n - 10, n + 1, n - 1, n + 100, n - 100];
}
function zeroTraps(n: number): number[] {
  const { h, t, o } = digitsOf(n);
  return [h * 10 + (t || o), t ? h * 100 + o * 10 + t : h * 100 + o * 10, h * 100 + t + o * 10, t * 100 + h * 10 + o].filter(x => x !== n);
}
const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=');
const distinctDigits = (n: number) => { const { h, t, o } = digitsOf(n); return h !== t && t !== o && h !== o; };

/** Two three-digit numbers for "which holds more": different hundreds, then the same hundreds, then the bigger tens in the smaller. */
function comparePair(stretch: Stretch, rng: Rng): [number, number] {
  for (;;) {
    const a = int(rng, 100, 999), b = int(rng, 100, 999);
    if (a === b) continue;
    const sameH = hundredsOf(a) === hundredsOf(b), sameT = sameH && tens(a) === tens(b);
    if (stretch === 0 && (sameH || Math.abs(a - b) < 100)) continue;
    if (stretch === 1 && !sameH) continue;
    if (stretch === 2) {
      // the smaller one has the bigger tens or ones (389 and 412), or the same hundreds and tens (346 and 342)
      const [lo, hi] = a < b ? [a, b] : [b, a];
      if (!(tens(lo) > tens(hi) || ones(lo) > ones(hi) || sameT)) continue;
    }
    return [a, b];
  }
}

export function makeHundreds(level: Level, stretch: Stretch, rng: Rng): HundredsProblem {
  if (level === 1) {
    const n = stretch === 0 ? int(rng, 111, 199) : int(rng, 111, 999);
    const { t, o } = digitsOf(n);
    if (!t || !o || t === o) return makeHundreds(level, stretch, rng); // zeros and repeats are Level 2's
    return { kind: 'hundreds', form: 'read', n, jumbled: stretch === 2 && rng() < 0.5, choices: numberChoices(rng, n, readTraps(n), 2, 100, TOP), answer: String(n) };
  }
  if (level === 2) {
    const roll = rng();
    const form = stretch === 0 ? (roll < 0.7 ? 'digit' : 'zero') : stretch === 1 ? (roll < 0.4 ? 'digit' : 'zero') : roll < 0.3 ? 'digit' : roll < 0.65 ? 'zero' : 'expanded';
    if (form === 'digit') {
      let n: number;
      do n = int(rng, 102, 987); while (!distinctDigits(n));
      const place = pick(rng, PLACES), d = digitsOf(n);
      return { kind: 'hundreds', form: 'digit', n, place, answer: String(place === 'hundreds' ? d.h : place === 'tens' ? d.t : d.o) };
    }
    if (form === 'zero') {
      const h = int(rng, 1, 9), x = int(rng, 1, 9), n = rng() < 0.5 ? h * 100 + x : h * 100 + x * 10; // 306 or 340
      return { kind: 'hundreds', form: 'read', n, jumbled: false, choices: numberChoices(rng, n, zeroTraps(n), 2, 10, TOP, []), answer: String(n) };
    }
    let n: number;
    do n = int(rng, 111, 999); while (!distinctDigits(n) || !ones(n) || !tens(n));
    return { kind: 'hundreds', form: 'expanded', n, choices: numberChoices(rng, n, readTraps(n), 2, 100, TOP), answer: String(n) };
  }
  if (stretch === 2 || (stretch === 1 && rng() < 0.4)) {
    if (rng() < 1 / 6) { const a = int(rng, 100, 999); return { kind: 'hundreds', form: 'sign', a, b: a, answer: '=' }; }
    const [a, b] = comparePair(stretch === 2 ? 2 : 1, rng);
    return { kind: 'hundreds', form: 'sign', a, b, answer: signOf(a, b) };
  }
  const [a, b] = comparePair(stretch, rng), fewer = stretch > 0 && rng() < 0.3;
  return { kind: 'hundreds', form: 'more', a, b, fewer, answer: (fewer ? a < b : a > b) ? 'a' : 'b' };
}

// ---------- Ten Hops ----------

export type HopProblem =
  /** Ten (or a hundred) more or less than n: three choices. */
  | { readonly kind: 'hop'; readonly form: 'step'; readonly n: number; readonly step: 10 | -10 | 100 | -100; readonly choices: readonly number[]; readonly answer: string }
  /** `47 + 38` in two hops, the tens then the ones: he taps where each lands. The answer is `77,85`. */
  | { readonly kind: 'hop'; readonly form: 'two'; readonly a: number; readonly b: number; readonly op: '+' | '-';
      readonly first: number; readonly second: number; readonly firstChoices: readonly number[]; readonly secondChoices: readonly number[]; readonly answer: string };

export function makeHop(level: Level, stretch: Stretch, rng: Rng): HopProblem {
  if (level === 1) {
    // to 200: no hundred crossed, then crossing it (93 + 10, 104 - 10), then anything
    for (;;) {
      const step = rng() < 0.5 ? 10 : -10, n = int(rng, 10, 200), to = n + step;
      if (to < 1 || to > 200) continue;
      const crosses = hundredsOf(n) !== hundredsOf(to);
      if (stretch === 0 && (crosses || n < 100)) continue;
      if (stretch === 1 && !crosses) continue;
      const traps = [n + step / 10, n - step, n + step * 10, n + step * 2, n + 100 * Math.sign(step)];
      return { kind: 'hop', form: 'step', n, step: step as 10 | -10, choices: numberChoices(rng, to, traps, 2, 0, TOP), answer: String(to) };
    }
  }
  if (level === 2) {
    for (;;) {
      const step = stretch === 0 ? 100 : stretch === 1 ? -100 : pick(rng, [100, -100, 10, -10] as const);
      const n = int(rng, 10, 999), to = n + step;
      if (to < 1 || to > TOP) continue;
      if (Math.abs(step) === 10 && n < 200) continue; // past 200 now
      const traps = [n + step / 10, n - step, n + Math.sign(step), n + step * 2, n + (Math.abs(step) === 100 ? 10 : 100) * Math.sign(step)];
      return { kind: 'hop', form: 'step', n, step, choices: numberChoices(rng, to, traps, 2, 0, TOP), answer: String(to) };
    }
  }
  for (;;) {
    const op: '+' | '-' = stretch === 2 && rng() < 0.5 ? '-' : '+';
    const a = int(rng, 11, 89), b = int(rng, 11, 79);
    if (!ones(b) || !ones(a)) continue;
    const total = op === '+' ? a + b : a - b;
    if (total < 2 || total > 99) continue;
    const bridges = op === '+' ? carries(a, b) : borrows(a, b);
    if (stretch === 0 && bridges) continue;
    if (stretch === 1 && !bridges) continue;
    const t = tens(b) * 10, first = op === '+' ? a + t : a - t, second = total;
    const s = op === '+' ? 1 : -1;
    const firstTraps = [a + s * tens(b), first - s * 10, first + s * 10, a + s * ones(b)];
    const secondTraps = [second - s * 10, second + s * 10, first + s * ones(b) * 10, first - s * ones(b)];
    return {
      kind: 'hop', form: 'two', a, b, op, first, second, answer: `${first},${second}`,
      firstChoices: numberChoices(rng, first, firstTraps, 2, 0, TOP), secondChoices: numberChoices(rng, second, secondTraps, 2, 0, TOP),
    };
  }
}

// ---------- every kind ----------

export type Question = AddProblem | HundredsProblem | TakeProblem | HopProblem | GapProblem;
export type WheelProblem = AddProblem | TakeProblem | GapProblem;
export const onWheels = (q: Question): q is WheelProblem => q.kind === 'add' || q.kind === 'take' || q.kind === 'gap';

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'add': return makeAdd(level, stretch, rng);
    case 'hundreds': return makeHundreds(level, stretch, rng);
    case 'take': return makeTake(level, stretch, rng);
    case 'hop': return makeHop(level, stretch, rng);
    case 'gap': return makeGap(level, stretch, rng);
  }
}

/** Everything he could give as an answer: every choice, every digit he could tap, every number the wheels make. */
export function possibleAnswers(q: Question): string[] {
  if (onWheels(q)) return Array.from({ length: q.wheels === 3 ? 1000 : 100 }, (_, n) => String(n));
  if (q.kind === 'hundreds') {
    if (q.form === 'read' || q.form === 'expanded') return q.choices.map(String);
    if (q.form === 'digit') { const d = digitsOf(q.n); return [d.h, d.t, d.o].map(String); }
    if (q.form === 'more') return ['a', 'b'];
    return [...SIGNS];
  }
  if (q.form === 'step') return q.choices.map(String);
  return q.firstChoices.flatMap(f => q.secondChoices.map(s => `${f},${s}`));
}

/** Null when it isn't an answer to this question at all. */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (onWheels(q)) return /^\d{1,3}$/.test(answer) ? Number(answer) === Number(q.answer) : null;
  if (!possibleAnswers(q).includes(answer) && !(q.kind === 'hop' && q.form === 'two' && /^\d+,\d*$/.test(answer))) return null;
  return answer === q.answer;
}

/** The sum as it's written across: `38 + 25 = ?`, or `? = 38 + 25`. */
export function sumText(q: WheelProblem, shown = '?'): string {
  const left = q.kind === 'add' ? `${q.a} + ${q.b}` : q.kind === 'take' ? `${q.a} − ${q.b}` : `${q.a} + ${shown}`;
  const right = q.kind === 'gap' ? String(q.target) : shown;
  return q.flip ? `${right} = ${left}` : `${left} = ${right}`;
}
