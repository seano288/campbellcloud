// Teaching a miss on the picture itself, never with a red X. The first miss gets one line that points at what to look at and a cue on
// the picture; the second (or the first when he's been missing a lot, or 🔎) gets the whole lesson, said and shown, ending with the
// right answer glowing:
//
// - Need or Want: "You need water to live. A kite is fun, but you can live without it." The need slides onto the heart shelf.
// - Goods and Services: the good is picked up and carried off ("You can hold it."); the service is shown being done to someone.
// - Jobs: the worker is shown doing the job with the tool.
// - Add It Up: the prices become rows of $1 coins that slide together and are counted on from the bigger one.
// - Enough?: his coins line up over the price's coins, one to one. Coins left over mean enough, and they are what's left; a gap is
//   drawn as empty circles and means not enough.
// - Save Up: the same two rows, the missing coins drawn as empty circles and counted; days of earning stacked up and counted.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal), so the view and the lesson draw the
// same picture.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { jobName, usesLine, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import { readSort, type EnoughProblem, type GoodsProblem, type JobProblem, type NeedProblem, type SaveProblem, type TotalProblem } from './problems';
import { BUY_NEEDS, GOODS, jobOf, MADE, NEED_REASONS, NEEDS, SERVICES, WANT_LINE, WANTS } from './things';

/** A row of $1 coins in a lesson: `coins` drawn, the first `lit` glowing, then `empty` empty circles. */
export interface CoinRow { readonly key: string; readonly coins: number; readonly lit?: number; readonly litFrom?: number; readonly empty?: number; readonly emptyLit?: number; readonly tone: 'his' | 'price' | 'day' }

export interface Lesson {
  readonly step: Signal<number>;
  /** Which picture is being talked about (a choice's id). */
  readonly focus: Signal<string | null>;
  /** What the picture shows: 'shelves', 'carry', 'doing', 'tool', 'coins'. */
  readonly show: Signal<string | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  readonly rows: Signal<readonly CoinRow[] | null>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      step: signal(0), focus: signal(null), show: signal(null), hint: signal(null), rows: signal(null),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}
function reset(l: Lesson) { l.step.value = 0; l.focus.value = null; l.show.value = null; l.hint.value = null; l.rows.value = null; }

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
export const n = (x: number) => `${x}` as Phrase;
export const dollars = (x: number): Item[] => [n(x), x === 1 ? 'dollar.' : 'dollars.'];

/** What a thing is called, from any table. */
const ALL_THINGS = [...NEEDS, ...WANTS, ...BUY_NEEDS, ...GOODS, ...SERVICES] as readonly { id: string; name: string }[];
export const thingName = (id: string) => ALL_THINGS.find(t => t.id === id)!.name as Phrase;
const needOf = (id: string) => [...NEEDS, ...BUY_NEEDS].find(t => t.id === id);
const reasonOf = (id: string) => NEED_REASONS[needOf(id)!.cat] as Phrase;

// ---------- Need or Want ----------

async function teachNeed(q: NeedProblem, answer: string, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'sort') {
    // the one he put on the wrong shelf
    const wrong = readSort(answer).find(([id, s]) => q.shelves[id] !== s)?.[0] ?? q.things[0]!, isNeed = q.shelves[wrong] === 'need';
    l.focus.value = wrong;
    if (!full) { await v.say('Could you live without it?'); l.hint.value = q.shelves[wrong]!; return; }
    l.show.value = 'shelves';
    if (isNeed) await v.say(reasonOf(wrong), 'Needs go on the heart shelf.');
    else await v.say(thingName(wrong), WANT_LINE, 'Wants go on the star shelf.');
    l.hint.value = q.shelves[wrong]!;
    return;
  }
  const need = q.form === 'pick' ? q.things.find(id => needOf(id) && NEEDS.some(t => t.id === id))! : q.need;
  const want = q.form === 'pick' ? q.things.find(id => id !== need)! : q.want;
  if (!full) { await v.say(q.form === 'first' ? 'Needs come first.' : 'Could you live without it?'); return; }
  l.show.value = 'shelves';
  l.focus.value = need;
  await v.say(reasonOf(need));
  l.focus.value = want;
  await v.say(thingName(want), WANT_LINE);
  l.focus.value = null;
  if (q.form === 'first') await v.say('Needs come first.');
  l.hint.value = q.answer;
}

// ---------- Goods and Services ----------

const isGood = (id: string) => GOODS.some(g => g.id === id);
async function sayGood(v: VoiceScope, l: Lesson, id: string) {
  l.focus.value = id;
  if (isGood(id)) { l.show.value = 'carry'; await v.say(thingName(id), 'is a good.', 'You can hold it.'); }
  else { l.show.value = 'doing'; await v.say(thingName(id), 'is a service.', 'Someone does it for you.'); }
}
async function teachGoods(q: GoodsProblem, answer: string, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'who') {
    if (!full) { await v.say('Look at what each one does.'); return; }
    l.show.value = 'tool';
    for (const w of q.workers) {
      if (!v.active) return;
      const j = jobOf(w.job);
      l.focus.value = w.job;
      await v.say(j.does, jobName(j), j.role === 'service' ? 'gives a service.' : 'makes a good.');
    }
    l.focus.value = null;
    l.hint.value = q.answer;
    return;
  }
  if (q.form === 'sort') {
    const wrong = readSort(answer).find(([id, s]) => q.shelves[id] !== s)?.[0] ?? q.things[0]!;
    if (!full) { l.focus.value = wrong; await v.say(isGood(wrong) ? 'Goods are things you can hold.' : 'Services are jobs people do for you.'); l.hint.value = q.shelves[wrong]!; return; }
    await sayGood(v, l, wrong);
    l.hint.value = q.shelves[wrong]!;
    return;
  }
  if (!full) { await v.say(q.ask === 'good' ? 'Goods are things you can hold.' : 'Services are jobs people do for you.'); return; }
  for (const id of q.things) { if (!v.active) return; await sayGood(v, l, id); if (!reduced()) await v.wait(300); }
  l.focus.value = null;
  l.hint.value = q.answer;
}

// ---------- Jobs ----------

async function teachJob(q: JobProblem, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'role') {
    const m = MADE.find(x => x.id === q.good)!;
    if (!full) { await v.say('The maker made it. The shopper paid for it.'); return; }
    l.show.value = 'tool';
    l.focus.value = 'maker'; await v.say(m.madeLine);
    l.focus.value = 'buyer'; await v.say(m.boughtLine);
    l.focus.value = null;
    l.hint.value = q.answer;
    return;
  }
  if (!full) { await v.say('Look at what each one does.'); return; }
  const j = jobOf(q.asked);
  l.show.value = 'tool';
  l.focus.value = q.asked;
  await v.say(q.form === 'who' ? j.does : usesLine(j));
  if (q.form === 'who') await v.say(usesLine(j));
  l.hint.value = q.answer;
}

// ---------- money: rows of coins ----------

/** Lights coins in a row one by one, counting aloud from `from`. */
async function countRow(v: VoiceScope, l: Lesson, key: string, from: number, to: number, said: (i: number) => number, empty = false) {
  for (let i = from; i <= to && v.active; i++) {
    l.rows.value = (l.rows.value ?? []).map(r => (r.key === key ? (empty ? { ...r, emptyLit: i } : { ...r, lit: i }) : r));
    sCount(i);
    await v.say(n(said(i)));
    if (!reduced()) await v.wait(120);
  }
}

async function teachTotal(q: TotalProblem, v: VoiceScope, l: Lesson, full: boolean) {
  const prices = q.order.map(id => q.menu.find(m => m.id === id)!.price);
  if (!full) { await v.say('Count on from the bigger number.'); return; }
  l.show.value = 'coins';
  const sorted = [...prices].sort((a, b) => b - a), big = sorted[0]!;
  l.rows.value = sorted.map((p, i) => ({ key: `p${i}`, coins: p, tone: 'price' as const }));
  await v.say('Each coin is one dollar.');
  if (!reduced()) await v.wait(500);
  // they slide together into one row; the bigger price's coins are already counted
  const sum = prices.reduce((a, b) => a + b, 0);
  l.rows.value = [{ key: 'all', coins: sum, lit: big, tone: 'price' }];
  l.step.value = big;
  await v.say(n(big));
  await countRow(v, l, 'all', big + 1, sum, i => i);
  l.hint.value = q.answer;
  await v.say('That makes', n(sum), 'dollars', 'in all.');
}

async function lineUp(v: VoiceScope, l: Lesson, have: number, price: number) {
  l.show.value = 'coins';
  const gap = Math.max(0, price - have);
  l.rows.value = [{ key: 'his', coins: have, empty: gap, tone: 'his' }, { key: 'price', coins: price, tone: 'price' }];
  await v.say('Line up the coins.');
  if (!reduced()) await v.wait(400);
}

async function teachEnough(q: EnoughProblem, answer: string, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'which') {
    if (!full) { await v.say('Line up the coins.'); return; }
    // his pick (if he made one), then the one he can buy
    const picked = q.items.find(i => i.id === answer && i.id !== q.answer), right = q.items.find(i => i.id === q.answer)!;
    if (picked) { l.focus.value = picked.id; await lineUp(v, l, q.have, picked.price); await v.say('Not enough.'); if (!reduced()) await v.wait(300); }
    l.focus.value = right.id;
    await lineUp(v, l, q.have, right.price);
    await v.say('You have enough!');
    l.hint.value = q.answer;
    return;
  }
  if (!full) { await v.say('Line up the coins.'); if (q.form === 'left') { l.show.value = 'coins'; l.rows.value = [{ key: 'his', coins: q.have, tone: 'his' }, { key: 'price', coins: q.price, tone: 'price' }]; } return; }
  await lineUp(v, l, q.have, q.price);
  if (q.price > q.have) {
    await v.say('Not enough.');
    await countRow(v, l, 'his', 1, q.price - q.have, i => i, true);
    await v.say('You need more.');
  } else {
    await v.say('You have enough!');
    if (q.have > q.price) {
      // the coins left over are what's left: they light up and are counted
      l.rows.value = l.rows.value!.map(r => (r.key === 'his' ? { ...r, lit: q.price, litFrom: q.price } : r));
      await countRow(v, l, 'his', q.price + 1, q.have, i => i - q.price);
      if (q.form === 'left') await v.say('That makes', n(q.have - q.price), q.have - q.price === 1 ? 'dollar' : 'dollars', 'left.');
    }
  }
  l.hint.value = q.answer;
}

async function teachSave(q: SaveProblem, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'more') {
    if (!full) { await v.say('Count the empty spots.'); return; }
    await lineUp(v, l, q.have, q.price);
    await v.say('Count the empty spots.');
    await countRow(v, l, 'his', 1, q.price - q.have, i => i, true);
    l.hint.value = q.answer;
    await v.say('You need', ...dollars(q.price - q.have));
    return;
  }
  if (q.form === 'days') {
    if (!full) { await v.say('Count the days.'); return; }
    l.show.value = 'coins';
    const days = (q.goal - q.start) / q.perDay;
    l.rows.value = q.start ? [{ key: 'start', coins: q.start, lit: q.start, tone: 'his' }] : [];
    await v.say('Count the days.');
    let total = q.start;
    for (let d = 1; d <= days && v.active; d++) {
      total += q.perDay;
      l.rows.value = [...(l.rows.value ?? []), { key: `d${d}`, coins: q.perDay, lit: q.perDay, tone: 'day' }];
      l.step.value = d;
      sCount(d);
      await v.say(n(total));
      if (!reduced()) await v.wait(200);
    }
    l.hint.value = q.answer;
    await v.say('That makes', n(days), 'days.');
    return;
  }
  const sum = q.a.price + q.b.price;
  await v.say('Both together cost', ...dollars(sum));
  if (!full) return;
  await lineUp(v, l, q.have, sum);
  if (sum <= q.have) await v.say('You can buy both!'); else { await countRow(v, l, 'his', 1, sum - q.have, i => i, true); await v.say('You can not buy both.'); }
  l.hint.value = q.answer;
}

// ---------- the Round's explain and 🔎 ----------

export async function lessonOf(p: Asking, answer: string, full: boolean, v: VoiceScope, l: Lesson) {
  const q = p.q;
  if (q.kind === 'need') return teachNeed(q, answer, v, l, full);
  if (q.kind === 'goods') return teachGoods(q, answer, v, l, full);
  if (q.kind === 'job') return teachJob(q, v, l, full);
  if (q.kind === 'total') return teachTotal(q, v, l, full);
  if (q.kind === 'enough') return teachEnough(q, answer, v, l, full);
  return teachSave(q, v, l, full);
}

/** A miss: the first gets a pointer, the second the whole lesson. The lesson stays on screen; the hint glows until he answers. */
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
