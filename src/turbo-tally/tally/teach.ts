// Teaching a miss on the picture itself, never with a red X. The first miss gets one line that points at what to look at, and a
// small cue on the picture. The second (or the first, when he's been missing a lot, or when he taps 🔎) gets the whole worked lesson,
// said and shown, ending with the right answer glowing:
//
// - Podium: the cars count off from the front, each lighting as its place is said: "First. Second. Third." A pass moves the car first.
// - Faster Car: both numbers turn into tens rods and ones. "41 has 4 tens. 14 has 1 ten. 41 is more." The sign opens toward the bigger.
// - Tally Board: the bundles are counted by fives, then the loose marks by ones.
// - Race Chart: the columns are counted; for "how many more" the two columns pair off and the ones left over light up.
// - Line Up: the numbers drop onto a number line.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal), so the view and the lesson that
// explains a miss draw the same picture.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { carWonLine, ordinalSaid, placeLine, wonMostLine, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import { bundlesOf, type ChartProblem, type MoreProblem, type OrderProblem, type PlaceProblem, type TallyProblem } from './problems';

export interface Lesson {
  /** How many things have been counted so far (cars from the front, marks, a column's wins, numbers on the line). */
  readonly step: Signal<number>;
  /** Which thing is being counted: a column of the chart, a number on the line. */
  readonly focus: Signal<number | null>;
  /** What the picture shows for the lesson: 'rods', 'line', 'pairs', 'moved', 'finish', 'model'. */
  readonly show: Signal<string | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** Only one thing animates at a time: starting a new lesson stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      step: signal(0), focus: signal(null), show: signal(null), hint: signal(null),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const n = (x: number) => `${x}` as Phrase;
/** Counts out loud: each tick lights the next thing, then says it. */
async function count(v: VoiceScope, lesson: Lesson, from: number, to: number, said: (i: number) => Item[], pause = 160) {
  for (let i = from; i <= to && v.active; i++) {
    lesson.step.value = i;
    sCount(i);
    await v.say(...said(i));
    if (!reduced()) await v.wait(pause);
  }
}
function reset(lesson: Lesson) { lesson.step.value = 0; lesson.focus.value = null; lesson.show.value = null; lesson.hint.value = null; }

// ---------- Podium ----------

function newPlace(q: PlaceProblem) { return q.form === 'tap' ? q.place : Number(q.answer); }
async function teachPlace(q: PlaceProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  lesson.show.value = 'finish';
  await v.say('Count from the finish line.');
  if (!full) return;
  if (q.form === 'passes' || q.form === 'passed') {
    await v.wait(300);
    lesson.show.value = 'moved';
    await v.say(q.form === 'passes' ? 'It passes one car, so it moves up one.' : 'One car passes it, so it moves back one.');
  }
  const to = newPlace(q);
  await count(v, lesson, 1, to, i => [ordinalSaid(i)], 220);
  lesson.hint.value = q.answer;
  await v.say(placeLine(to));
}

// ---------- Faster Car ----------

const tensLine = (x: number): Item[] => { const t = Math.floor(x / 10); return t === 0 ? [n(x), 'has', 'no tens.'] : [n(x), 'has', n(t), t === 1 ? 'ten.' : 'tens.']; };
const onesLine = (x: number): Item[] => { const o = x % 10; return [n(x), 'has', n(o), o === 1 ? 'one.' : 'ones.']; };
async function teachMore(q: MoreProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  const twoDigit = q.a >= 10 && q.b >= 10;
  const same = q.answer === '=';
  if (!full) {
    lesson.show.value = 'rods';
    // the open side means nothing when the two are the same: then the tens (and the ones) are what to look at
    await v.say(q.form === 'sign' && !same ? 'The open side faces the bigger number.' : twoDigit ? 'Look at the tens first.' : q.form === 'slower' ? 'Which number is smaller?' : 'Which number is bigger?');
    return;
  }
  lesson.show.value = 'rods';
  lesson.focus.value = 0;
  await v.say(...tensLine(q.a));
  lesson.focus.value = 1;
  await v.say(...tensLine(q.b));
  if (Math.floor(q.a / 10) === Math.floor(q.b / 10)) {
    lesson.focus.value = null;
    await v.say('Same tens. Look at the ones.');
    lesson.focus.value = 0; await v.say(...onesLine(q.a));
    lesson.focus.value = 1; await v.say(...onesLine(q.b));
  }
  lesson.focus.value = null;
  if (q.form === 'sign') {
    lesson.hint.value = q.answer;
    await v.say(same ? 'This one means the same.' : 'The open side faces the bigger number.');
    await v.say(n(q.a), q.answer === '<' ? 'is less than' : q.answer === '>' ? 'is more than' : 'is the same as', n(q.b));
    return;
  }
  const big = Math.max(q.a, q.b), small = Math.min(q.a, q.b);
  lesson.hint.value = q.answer;
  if (q.form === 'faster') await v.say(n(big), 'is more.', 'The bigger number is faster.');
  else await v.say(n(small), 'is less.', 'The smaller number is slower.');
}

// ---------- Tally Board ----------

/** Counts a tally of `total` marks: the bundles by fives, then the loose marks by ones. */
async function countTally(v: VoiceScope, lesson: Lesson, total: number) {
  const { fives } = bundlesOf(total);
  if (fives) {
    await v.say('Count the bundles by fives.');
    for (let k = 1; k <= fives && v.active; k++) { lesson.step.value = k * 5; sCount(k); await v.say(n(k * 5)); if (!reduced()) await v.wait(160); }
  }
  if (total % 5) {
    if (fives) await v.say('Then count the ones.');
    await count(v, lesson, fives * 5 + 1, total, i => [n(i)]);
  }
  await v.say('That makes', n(total));
}
async function teachTally(q: TallyProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  // fewer than five marks make no bundle: then each mark is one
  if (!full) { lesson.show.value = 'bundles'; await v.say(q.form === 'make' ? 'Each bundle is five.' : q.n < 5 ? 'Each mark is one.' : 'Count the bundles by fives.'); return; }
  if (q.form === 'make') {
    // count his tally, then show the one asked for
    const his = Number(answer);
    if (his > 0) await countTally(v, lesson, his);
    lesson.step.value = 0;
    lesson.show.value = 'model';
    await v.say('Make a tally that shows', n(q.n));
    await countTally(v, lesson, q.n);
    lesson.hint.value = q.answer;
    return;
  }
  if (q.form === 'pick') {
    lesson.focus.value = q.choices.indexOf(q.n);
    await countTally(v, lesson, q.n);
    lesson.hint.value = q.answer;
    return;
  }
  await countTally(v, lesson, q.n);
  lesson.hint.value = q.answer;
}

// ---------- Race Chart ----------

async function countColumn(v: VoiceScope, lesson: Lesson, k: number, wins: number) {
  lesson.focus.value = k;
  lesson.step.value = 0;
  await count(v, lesson, 1, wins, i => [n(i)], 120);
}
async function teachChart(q: ChartProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  const first = q.form === 'each' ? 'Look at the top of the bar.' : q.form === 'more' ? 'Pair them up.' : q.form === 'total' ? 'Count all the races.' : 'Count up the column.';
  if (!full) { lesson.show.value = q.form === 'each' ? 'top' : null; await v.say(first); return; }
  if (q.form === 'most' || q.form === 'fewest') {
    await v.say(first);
    for (const [k, r] of q.rows.entries()) { if (!v.active) return; await countColumn(v, lesson, k, r.wins); await v.wait(250); }
    lesson.focus.value = null;
    lesson.hint.value = q.answer;
    await v.say(wonMostLine(q.answer as ChartProblem['rows'][number]['car'], q.form === 'most'));
    return;
  }
  if (q.form === 'each') {
    const k = q.rows.findIndex(r => r.car === q.car);
    lesson.show.value = 'top';
    await v.say(first);
    await countColumn(v, lesson, k, q.rows[k]!.wins);
    lesson.hint.value = q.answer;
    await v.say(carWonLine(q.car!), n(q.rows[k]!.wins));
    return;
  }
  if (q.form === 'more') {
    lesson.show.value = 'pairs';
    await v.say(first);
    if (!reduced()) await v.wait(500);
    const big = q.rows.find(r => r.car === q.car)!, small = q.rows.find(r => r.car === q.other)!;
    lesson.focus.value = q.rows.indexOf(big);
    lesson.show.value = 'left';
    await v.say('These have no partner.');
    lesson.step.value = small.wins;
    await count(v, lesson, small.wins + 1, big.wins, i => [n(i - small.wins)], 160);
    lesson.hint.value = q.answer;
    await v.say(n(big.wins - small.wins), 'more.');
    return;
  }
  // total: keep counting across the columns
  await v.say(first);
  lesson.show.value = 'total';
  let sum = 0;
  for (const [k, r] of q.rows.entries()) {
    lesson.focus.value = k;
    for (let i = 1; i <= r.wins && v.active; i++) { lesson.step.value = i; sCount(sum + i); await v.say(n(sum + i)); }
    sum += r.wins;
  }
  lesson.focus.value = null;
  lesson.hint.value = q.answer;
  await v.say('That makes', n(sum), 'in all.');
}

// ---------- Line Up ----------

async function teachOrder(q: OrderProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  if (q.form === 'between') {
    lesson.show.value = 'line';
    await v.say('Look at the number line.');
    if (!full) return;
    const right = Number(q.answer);
    lesson.focus.value = right;
    lesson.hint.value = q.answer;
    await v.say(n(right), 'is between', n(q.lo), 'and', n(q.hi));
    return;
  }
  if (!full) { await v.say(q.form === 'up' ? 'Find the smallest first.' : 'Find the biggest first.'); return; }
  lesson.show.value = 'line';
  await v.say('Look at the number line.');
  const order = q.answer.split(',').map(Number);
  for (const [i, x] of order.entries()) { if (!v.active) return; lesson.focus.value = x; lesson.step.value = i + 1; sCount(i); await v.say(n(x)); await v.wait(200); }
  lesson.focus.value = null;
  lesson.hint.value = String(order[0]);
  await v.say(q.form === 'up' ? 'Find the smallest first.' : 'Find the biggest first.');
}

// ---------- the Round's explain and 🔎 ----------

export async function lessonOf(p: Asking, answer: string, full: boolean, v: VoiceScope, lesson: Lesson) {
  const q = p.q;
  if (q.kind === 'place') return teachPlace(q, v, lesson, full);
  if (q.kind === 'more') return teachMore(q, v, lesson, full);
  if (q.kind === 'tally') return teachTally(q, answer, v, lesson, full);
  if (q.kind === 'chart') return teachChart(q, v, lesson, full);
  return teachOrder(q, v, lesson, full);
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
