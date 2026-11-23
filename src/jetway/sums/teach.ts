// Teaching a miss on the picture itself, never with a red X. Every lesson uses the same picture: hundreds blocks, rows of ten and single
// seats on a mat with a column for each place (the Mat), or the runway number line for hops.
//
// The first miss gets one line pointing at what to look at, the mat or line on screen, and "Try again!". The second miss (or the
// first, when he's been missing a lot, or when he taps 🔎) gets the fuller lesson: the same sum walked through one step at a time, and
// he taps the arrow to move each step on. It ends with the right answer glowing.
//
// - Boarding: the ones slide together, ten of them snap into a new row of ten, and it moves over to the tens.
// - Unload: when there are not enough ones, a row of ten breaks into ten ones first (and a hundred into ten rows, when it must).
// - Jumbo: the number is built block by block, hundreds first, and each digit lights as its blocks land.
// - Ten Hops: the hop is drawn on the line and the digit that changes lights while the ones stay still.
// - Missing Bags: the line hops to the next ten, then to the target, and the two hops are added.
import { signal, type Signal } from '@preact/signals';
import { sCount, sClink } from '../../audio/sfx';
import type { Asking } from '../mix';
import { sayNum, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import { digitsOf, type AddProblem, type GapProblem, type HopProblem, type HundredsProblem, type TakeProblem } from './problems';

export type Col = 'h' | 't' | 'o';
/** One block on the mat: whose it is ('a' the first number, 'b' the second, 'new' made by regrouping), lit while it's counted, ringed
 *  when ten are about to become one, crossed when taken away. */
export interface Piece { readonly c: 'a' | 'b' | 'new'; readonly lit?: boolean; readonly ring?: boolean; readonly gone?: boolean }
export interface Mat {
  readonly h: readonly Piece[]; readonly t: readonly Piece[]; readonly o: readonly Piece[];
  /** Digits written under the columns, once they're known. */
  readonly digits?: Partial<Record<Col, number>>;
  /** The column the lesson is talking about. */
  readonly focus?: Col | null;
  /** Show the hundreds column (anything that reaches 100). */
  readonly wide: boolean;
}
export interface Hop { readonly from: number; readonly to: number; readonly label: string }
export interface Line { readonly lo: number; readonly hi: number; readonly marks: readonly number[]; readonly hops: readonly Hop[]; readonly at: number | null }

export interface Lesson {
  readonly mat: Signal<Mat | null>;
  readonly line: Signal<Line | null>;
  /** For Jumbo's compare: which number is lit, 0 or 1, and which column of both. */
  readonly focus: Signal<number | null>;
  readonly col: Signal<Col | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** He has to tap the arrow to go on. */
  readonly waiting: Signal<boolean>;
  advance(): void;
  /** Resolves on his tap on the arrow, or when the lesson is stopped. */
  wait(v: VoiceScope): Promise<void>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null, release: (() => void) | null = null;
    const cancel = () => { current?.cancel(); release?.(); };
    const waiting = signal(false);
    lesson = {
      mat: signal(null), line: signal(null), focus: signal(null), col: signal(null), hint: signal(null), waiting,
      advance() { if (waiting.peek()) { waiting.value = false; sClink(); const r = release; release = null; r?.(); } },
      wait: v => new Promise<void>(resolve => {
        if (!v.active) return resolve();
        release = resolve;
        waiting.value = true;
      }),
      task: {
        cancel, start() { cancel(); const v = createVoiceScope(lifetime); current = v; v.signal.addEventListener('abort', () => { waiting.value = false; release?.(); release = null; }, { once: true }); return v; },
      },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}
/** Waits for his tap on the arrow (the first time in a lesson, it says so). */
async function next(v: VoiceScope, lesson: Lesson, said: { told: boolean }) {
  if (!v.active) return;
  const wait = lesson.wait(v);
  if (!said.told) { said.told = true; void v.say('Tap the arrow.'); }
  await wait;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const n = (x: number) => sayNum(x);
const of = (k: number, c: Piece['c'], extra: Partial<Piece> = {}): Piece[] => Array.from({ length: k }, () => ({ c, ...extra }));
function reset(lesson: Lesson) { lesson.mat.value = null; lesson.line.value = null; lesson.focus.value = null; lesson.col.value = null; lesson.hint.value = null; lesson.waiting.value = false; }
const tensWord = (k: number): Phrase => (k === 1 ? 'ten.' : 'tens.');
const onesWord = (k: number): Phrase => (k === 1 ? 'one.' : 'ones.');
const hundredsWord = (k: number): Phrase => (k === 1 ? 'hundred.' : 'hundreds.');
/** The mat for a number, in one colour. */
export function matOf(x: number, c: Piece['c'] = 'a', wide = x >= 100): Mat {
  const d = digitsOf(x);
  return { h: of(d.h, c), t: of(d.t, c), o: of(d.o, c), wide };
}
const lightAll = (ps: readonly Piece[], k = ps.length) => ps.map((p, i) => (i < k ? { ...p, lit: true } : p));

// ---------- Boarding ----------

export function addMat(q: Pick<AddProblem, 'a' | 'b'>): Mat {
  const a = digitsOf(q.a), b = digitsOf(q.b);
  return { h: [], t: [...of(a.t, 'a'), ...of(b.t, 'b')], o: [...of(a.o, 'a'), ...of(b.o, 'b')], wide: q.a + q.b >= 100 };
}
async function teachAdd(q: AddProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const start = addMat(q);
  lesson.mat.value = start;
  if (!full) {
    const said = Number(answer);
    await v.say(said === q.traps.noCarry ? "Don't forget the new ten!" : said === q.traps.columns ? 'Ten ones make a new ten.' : 'Add the ones first.');
    return;
  }
  const told = { told: false }, a = digitsOf(q.a), b = digitsOf(q.b), ones = a.o + b.o, sum = q.a + q.b;
  lesson.mat.value = { ...start, focus: 'o' };
  await v.say('Add the ones first.');
  await next(v, lesson, told);
  lesson.mat.value = { ...start, o: lightAll(start.o), focus: 'o' };
  await v.say(...n(a.o), 'and', ...n(b.o), 'make', ...n(ones));
  let mat: Mat = { ...start, o: lightAll(start.o) };
  if (ones >= 10) {
    await next(v, lesson, told);
    mat = { ...mat, o: mat.o.map((p, i) => (i < 10 ? { ...p, ring: true } : p)), focus: 'o' };
    lesson.mat.value = mat;
    await v.say('Ten ones make a new ten.');
    await next(v, lesson, told);
    mat = { ...mat, o: mat.o.slice(10).map(p => ({ ...p, lit: false })), t: [...mat.t, { c: 'new', lit: true }], focus: 't' };
    lesson.mat.value = mat;
    sCount(1);
    await v.say('That is one ten and', ...n(ones - 10), onesWord(ones - 10));
    await v.say('The new ten goes with the tens.');
  }
  await next(v, lesson, told);
  const tens = a.t + b.t + (ones >= 10 ? 1 : 0);
  mat = { ...mat, o: mat.o.map(p => ({ ...p, lit: false })), t: lightAll(mat.t), focus: 't', digits: { o: ones % 10 } };
  lesson.mat.value = mat;
  await v.say('Now add the tens.');
  await v.say(...n(tens), tensWord(tens));
  if (tens >= 10) {
    await next(v, lesson, told);
    mat = { ...mat, t: mat.t.map((p, i) => (i < 10 ? { ...p, ring: true } : p)) };
    lesson.mat.value = mat;
    await v.say('Ten tens make a hundred.');
    await next(v, lesson, told);
    mat = { ...mat, t: mat.t.slice(10), h: [{ c: 'new', lit: true }], focus: 'h' };
    lesson.mat.value = mat;
    sCount(2);
  }
  await next(v, lesson, told);
  const d = digitsOf(sum);
  lesson.mat.value = { ...mat, focus: null, digits: sum >= 100 ? { h: d.h, t: d.t, o: d.o } : { t: d.t, o: d.o } };
  lesson.hint.value = q.answer;
  await v.say('That makes', ...n(sum));
}

// ---------- Unload ----------

async function teachTake(q: TakeProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const a = digitsOf(q.a), b = digitsOf(q.b);
  let mat: Mat = { ...matOf(q.a), wide: q.a >= 100 };
  lesson.mat.value = mat;
  if (!full) {
    await v.say(Number(answer) === q.traps.smallFromBig || a.o < b.o ? 'Not enough ones? Break a ten.' : 'Take away the ones first.');
    return;
  }
  const told = { told: false };
  lesson.mat.value = { ...mat, focus: b.o ? 'o' : 't' };
  if (b.o) await v.say('Take away the ones first.');
  let ones = a.o, tens = a.t;
  if (a.o < b.o) {
    await next(v, lesson, told);
    await v.say('You need to take', ...n(b.o), 'and there are only', ...n(a.o));
    if (tens === 0) {
      // no rows of ten: a hundred breaks into ten rows first
      await next(v, lesson, told);
      mat = { ...mat, h: mat.h.slice(1), t: [...mat.t, ...of(10, 'new')], focus: 'h' };
      lesson.mat.value = mat;
      sCount(1);
      await v.say('Break a hundred.');
      tens = 10;
    }
    await next(v, lesson, told);
    mat = { ...mat, t: mat.t.slice(0, -1), o: [...mat.o, ...of(10, 'new')], focus: 'o' };
    lesson.mat.value = mat;
    sCount(2);
    await v.say('Break a ten.');
    ones += 10; tens -= 1;
    await v.say('Now there are', ...n(ones), onesWord(ones));
  }
  // no ones to take (65 - 40): straight on to the tens, rather than "Take away 0"
  if (b.o > 0) {
    await next(v, lesson, told);
    mat = { ...mat, o: mat.o.map((p, i) => (i >= mat.o.length - b.o ? { ...p, gone: true } : p)), focus: 'o' };
    lesson.mat.value = mat;
    await v.say('Take away', ...n(b.o));
  }
  await next(v, lesson, told);
  if (tens < b.t) {
    // not enough rows of ten for the tens (112 - 28): a hundred breaks into ten rows
    mat = { ...mat, h: mat.h.slice(1), t: [...mat.t, ...of(10, 'new')], focus: 'h' };
    lesson.mat.value = mat;
    sCount(1);
    await v.say('Break a hundred.');
    tens += 10;
    await next(v, lesson, told);
  }
  mat = { ...mat, t: mat.t.map((p, i) => (i >= mat.t.length - b.t ? { ...p, gone: true } : p)), focus: 't' };
  lesson.mat.value = mat;
  await v.say('Now take away the tens.');
  await v.say('Take away', ...n(b.t), tensWord(b.t));
  await next(v, lesson, told);
  const left = q.a - q.b, d = digitsOf(left);
  lesson.mat.value = { ...mat, focus: null, digits: q.a >= 100 ? { h: d.h, t: d.t, o: d.o } : { t: d.t, o: d.o } };
  lesson.hint.value = q.answer;
  await v.say('That leaves', ...n(left));
}

// ---------- Missing Bags ----------

const nextTen = (x: number) => Math.ceil(x / 10) * 10;
export function gapLine(q: GapProblem, hops: Hop[] = [], at: number | null = q.a): Line {
  return { lo: Math.floor(q.a / 10) * 10, hi: Math.max(nextTen(q.target), Math.floor(q.a / 10) * 10 + 20), marks: [q.a, q.target], hops, at };
}
async function teachGap(q: GapProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  lesson.line.value = gapLine(q);
  if (!full) { await v.say(q.target === nextTen(q.a) ? 'Count up from the smaller number.' : 'Hop to the next ten first.'); return; }
  const told = { told: false }, ten = nextTen(q.a), d1 = ten - q.a, d2 = q.target - ten;
  await v.say('Hop to the next ten.');
  await next(v, lesson, told);
  const first: Hop = { from: q.a, to: ten, label: `+${d1}` };
  lesson.line.value = gapLine(q, [first], ten);
  sCount(1);
  await v.say('That is', ...n(d1));
  if (d2 > 0) {
    await next(v, lesson, told);
    await v.say('Then hop to', ...n(q.target));
    lesson.line.value = gapLine(q, [first, { from: ten, to: q.target, label: `+${d2}` }], q.target);
    sCount(2);
    await v.say('That is', ...n(d2), 'more.');
    await next(v, lesson, told);
    lesson.hint.value = q.answer;
    await v.say(...n(d1), 'and', ...n(d2), 'make', ...n(d1 + d2));
  } else lesson.hint.value = q.answer;
}

// ---------- Jumbo ----------

/** Builds the number block by block, hundreds first, each digit lighting as its blocks land. */
async function build(x: number, v: VoiceScope, lesson: Lesson, told: { told: boolean }, step: boolean) {
  const d = digitsOf(x), cols: [Col, number][] = [['h', d.h], ['t', d.t], ['o', d.o]];
  let mat: Mat = { h: [], t: [], o: [], wide: true, digits: {} };
  for (const [c, k] of cols) {
    mat = { ...mat, focus: c };
    lesson.mat.value = mat;
    for (let i = 1; i <= k && v.active; i++) { mat = { ...mat, [c]: of(i, 'a') }; lesson.mat.value = mat; sCount(i); if (!reduced()) await v.wait(110); }
    mat = { ...mat, digits: { ...mat.digits, [c]: k } };
    lesson.mat.value = mat;
    if (k === 0) await v.say(c === 't' ? 'No tens, so the tens digit is zero.' : c === 'o' ? 'No ones, so the ones digit is zero.' : 'Count the hundreds first.');
    else await v.say(...n(k), c === 'h' ? hundredsWord(k) : c === 't' ? tensWord(k) : onesWord(k));
    if (step && c !== 'o') await next(v, lesson, told);
  }
  lesson.mat.value = { ...mat, focus: null };
}
async function teachHundreds(q: HundredsProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  const told = { told: false };
  if (q.form === 'read' || q.form === 'expanded') {
    lesson.mat.value = matOf(q.n, 'a', true);
    if (!full) { await v.say('Count the hundreds first.'); return; }
    await v.say('Count the hundreds first.');
    await build(q.n, v, lesson, told, true);
    lesson.hint.value = q.answer;
    await v.say('That makes', ...n(q.n));
    return;
  }
  if (q.form === 'digit') {
    const c: Col = q.place === 'hundreds' ? 'h' : q.place === 'tens' ? 't' : 'o';
    const line: Phrase = c === 'h' ? 'This is the hundreds place.' : c === 't' ? 'This is the tens place.' : 'This is the ones place.';
    lesson.col.value = c;
    if (!full) { await v.say(line); return; }
    await build(q.n, v, lesson, told, true);
    await next(v, lesson, told);
    lesson.mat.value = { ...lesson.mat.peek()!, focus: c };
    lesson.hint.value = q.answer;
    const k = Number(q.answer);
    await v.say(line, ...n(k), c === 'h' ? hundredsWord(k) : c === 't' ? tensWord(k) : onesWord(k));
    return;
  }
  // which holds more, and the signs: the hundreds first, then the tens, then the ones
  const a = digitsOf(q.a), b = digitsOf(q.b);
  const first: Phrase = q.form === 'sign' && q.answer !== '=' ? 'The open side faces the bigger number.' : 'Look at the hundreds first.';
  lesson.col.value = 'h';
  if (!full) { await v.say(first); return; }
  await v.say('Look at the hundreds first.');
  if (a.h === b.h) {
    await next(v, lesson, told);
    lesson.col.value = 't';
    await v.say('Same hundreds. Look at the tens.');
    if (a.t === b.t) { await next(v, lesson, told); lesson.col.value = 'o'; await v.say('Same tens. Look at the ones.'); }
  }
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  if (q.form === 'sign') {
    await v.say(...n(q.a), q.answer === '<' ? 'is less than' : q.answer === '>' ? 'is more than' : 'is the same as', ...n(q.b));
    return;
  }
  const big = q.a > q.b ? 0 : 1, want = q.answer === 'a' ? 0 : 1;
  lesson.focus.value = want;
  await v.say(...n(want === 0 ? q.a : q.b), want === big ? 'is more.' : 'is fewer.');
}

// ---------- Ten Hops ----------

/** What a hop of ten or a hundred does to the digits, said true for this number. Across a hundred the tens digit doesn't just go up or
 *  down one (93 + 10 = 103, 104 - 10 = 94): ten more makes ten tens, a new hundred; ten less from no tens breaks a hundred. */
export function stepLesson(n: number, step: 10 | -10 | 100 | -100): Phrase[] {
  if (step === 100) return ['A hundred more: the hundreds digit goes up one.'];
  if (step === -100) return ['A hundred less: the hundreds digit goes down one.'];
  const crosses = Math.floor(n / 100) !== Math.floor((n + step) / 100);
  if (step === 10) return crosses ? ['Ten more.', 'Ten tens make a hundred.'] : ['Ten more: the tens digit goes up one.'];
  return crosses ? ['Ten less.', 'No tens, so break a hundred.'] : ['Ten less: the tens digit goes down one.'];
}

export function hopLine(q: HopProblem, hops: Hop[] = [], at: number | null = null): Line {
  if (q.form === 'step') {
    const to = q.n + q.step, span = Math.abs(q.step) === 100 ? 100 : 10, lo = Math.min(q.n, to), hi = Math.max(q.n, to);
    const pad = span;
    return { lo: Math.max(0, Math.floor((lo - pad / 2) / span) * span), hi: Math.ceil((hi + pad / 2) / span) * span, marks: [q.n], hops, at: at ?? q.n };
  }
  const end = q.op === '+' ? q.a + q.b : q.a - q.b, lo = Math.min(q.a, end), hi = Math.max(q.a, end);
  return { lo: Math.floor(lo / 10) * 10, hi: Math.ceil((hi + 1) / 10) * 10, marks: [q.a], hops, at: at ?? q.a };
}
async function teachHop(q: HopProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  const told = { told: false };
  if (q.form === 'step') {
    const big = Math.abs(q.step) === 100, up = q.step > 0, to = q.n + q.step;
    const line = stepLesson(q.n, q.step);
    lesson.line.value = hopLine(q);
    lesson.col.value = big ? 'h' : 't';
    if (!full) { await v.say(...line); return; }
    await v.say(...line);
    await next(v, lesson, told);
    lesson.line.value = hopLine(q, [{ from: q.n, to, label: `${up ? '+' : '−'}${Math.abs(q.step)}` }], to);
    sCount(1);
    await v.say('The ones stay the same.');
    lesson.hint.value = q.answer;
    await v.say('That makes', ...n(to));
    return;
  }
  const t = Math.floor(q.b / 10) * 10, o = q.b % 10, sign = q.op === '+' ? '+' : '−';
  lesson.line.value = hopLine(q);
  if (!full) { await v.say('Jump the tens first.'); return; }
  await v.say('Jump the tens first.');
  await next(v, lesson, told);
  const h1: Hop = { from: q.a, to: q.first, label: `${sign}${t}` };
  lesson.line.value = hopLine(q, [h1], q.first);
  sCount(1);
  await v.say(...n(q.a), q.op === '+' ? 'plus' : 'take away', ...n(t), 'lands on', ...n(q.first));
  await next(v, lesson, told);
  await v.say('Then jump the ones.');
  lesson.line.value = hopLine(q, [h1, { from: q.first, to: q.second, label: `${sign}${o}` }], q.second);
  sCount(2);
  await v.say(...n(q.first), q.op === '+' ? 'plus' : 'take away', ...n(o), 'lands on', ...n(q.second));
  lesson.hint.value = q.answer;
}

// ---------- the Round's explain and 🔎 ----------

export async function lessonOf(p: Asking, answer: string, full: boolean, v: VoiceScope, lesson: Lesson) {
  const q = p.q;
  if (q.kind === 'add') return teachAdd(q, answer, v, lesson, full);
  if (q.kind === 'take') return teachTake(q, answer, v, lesson, full);
  if (q.kind === 'gap') return teachGap(q, v, lesson, full);
  if (q.kind === 'hundreds') return teachHundreds(q, v, lesson, full);
  return teachHop(q, v, lesson, full);
}

/** A miss: the first gets a pointer, the second the whole lesson. `lifetime` is the question's own (the Round passes it), so the
 *  lesson lands on the picture the view draws. The lesson stays on screen; the hint glows until he answers. */
export async function explain(p: Asking, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await v.say(teach ? "Let's look together." : 'Not quite!');
  await lessonOf(p, answer, teach, v, lesson);
  if (!teach && v.active) await v.say('Try again!');
}

/** 🔎 runs the whole lesson. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await lessonOf(p, '', true, v, lesson);
}
export type { Item };
