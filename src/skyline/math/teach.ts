// Teaching a miss on the picture itself, never with a red X. The first miss gets one line that points at what to look at, and a
// small cue on the picture. The second (or the first, when he's been missing a lot, or when he taps 🔎) gets the whole lesson:
//
// - Equal Groups and Windows: the buses or rows light one at a time while the count goes up by that number: "4. 8. 12." On the
//   fuller lesson he taps each row (or bus) himself to count it; if he waits, it lights by itself.
// - Odd or Even: the people pair off two by two. One left alone means odd.
// - Count By: the house numbers land on a number line and the jump between them is drawn.
// - Share It: the boxes are dealt out one at a time to each truck, round and round.
// - Times: the fact turns back into its building, and the building is counted row by row. The turn-around tips it on its side.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal), so the view and the lesson that
// explains a miss draw the same picture.
import { signal, type Signal } from '@preact/signals';
import { sClink, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { n, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import type { ArrayQ, CountQ, GroupsQ, PairQ, ShareQ, TimesQ } from './problems';

export interface Lesson {
  /** How many groups (buses, rows, pairs, jumps, boxes dealt) are lit so far. */
  readonly step: Signal<number>;
  /** The one being counted right now. */
  readonly focus: Signal<number | null>;
  /** What the picture shows for the lesson: 'pairs', 'line', 'deal', 'tip', 'picture', 'cue'. */
  readonly show: Signal<string | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** He's counting it himself: a tap on a row (or bus) lights the next one. */
  readonly tapping: Signal<boolean>;
  tap(): void;
  /** Only one thing animates at a time: starting a new lesson stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    // a tap that comes while the count is still being said isn't lost: it's kept for the next row
    let current: VoiceScope | null = null, tapped: (() => void) | null = null, early = 0;
    const cancel = () => current?.cancel();
    lesson = {
      step: signal(0), focus: signal(null), show: signal(null), hint: signal(null), tapping: signal(false),
      tap() { const t = tapped; tapped = null; if (t) t(); else early++; },
      task: { cancel, start() { cancel(); early = 0; return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
    (lesson as unknown as { wait: (v: VoiceScope, ms: number) => Promise<void> }).wait = (v, ms) => new Promise<void>(done => {
      if (early > 0) { early--; done(); return; }
      const timer = setTimeout(() => { tapped = null; done(); }, ms);
      tapped = () => { clearTimeout(timer); done(); };
      v.signal.addEventListener('abort', () => { clearTimeout(timer); done(); }, { once: true });
    });
  }
  return lesson;
}
const waitTap = (lesson: Lesson, v: VoiceScope, ms: number) => (lesson as unknown as { wait: (v: VoiceScope, ms: number) => Promise<void> }).wait(v, ms);

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
function reset(l: Lesson) { l.step.value = 0; l.focus.value = null; l.show.value = null; l.hint.value = null; l.tapping.value = false; }

/**
 * Counts groups of `size`, `groups` of them: each one lights and the running total is said ("4. 8. 12."). With `byHand` he taps each
 * one himself (5 seconds each before it goes on by itself).
 */
/** He counts this many rows (or buses) by hand at most; more than that, the lesson counts them for him. */
const BY_HAND_MOST = 6;
async function countGroups(v: VoiceScope, l: Lesson, groups: number, size: number, hand: boolean, what: 'row' | 'bus' = 'row') {
  const byHand = hand && groups <= BY_HAND_MOST;
  l.step.value = 0;
  if (byHand) { l.tapping.value = true; await v.say(what === 'bus' ? 'Tap each bus to count it.' : 'Tap each row to count it.'); }
  for (let i = 1; i <= groups && v.active; i++) {
    if (byHand) await waitTap(l, v, 5000);
    l.focus.value = i - 1; l.step.value = i;
    sCount(i);
    await v.say(n(i * size));
    if (!byHand && !reduced()) await v.wait(180);
  }
  l.tapping.value = false; l.focus.value = null;
}
/** Counts one by one, lighting each: "1. 2. 3." */
async function countOnes(v: VoiceScope, l: Lesson, to: number) {
  for (let i = 1; i <= to && v.active; i++) { l.step.value = i; sCount(i); await v.say(n(i)); if (!reduced()) await v.wait(120); }
}

// ---------- Equal Groups ----------

async function teachGroups(q: GroupsQ, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'same') {
    l.show.value = 'cue';
    await v.say(full ? "Let's count each bus." : 'Count the people on each bus.');
    if (!full) return;
    for (let i = 0; i < q.buses.length && v.active; i++) { l.focus.value = i; l.step.value = i + 1; sCount(i + 1); await v.say(n(q.buses[i]!)); }
    l.focus.value = null; l.hint.value = q.answer;
    await v.say(q.answer === 'yes' ? 'They all have the same.' : 'One bus is different.');
    return;
  }
  if (q.form === 'buses' || q.form === 'each') {
    l.show.value = 'cue';
    await v.say(q.form === 'buses' ? 'Count the buses.' : 'Count the people on one bus.');
    if (!full) return;
    if (q.form === 'buses') await countOnes(v, l, q.groups); else { l.focus.value = 0; l.show.value = 'one'; await countOnes(v, l, q.each); }
    l.hint.value = q.answer;
    await v.say(n(Number(q.answer)), q.form === 'buses' ? 'buses.' : 'on each.');
    return;
  }
  if (q.form === 'pick') {
    l.show.value = 'cue';
    await v.say('Not every bus has the same.');
    if (!full) return;
    l.hint.value = q.answer;
    await v.say(n(q.groups), 'groups of', n(q.each));
    l.focus.value = Number(q.answer);
    await countGroups(v, l, q.groups, q.each, false);
    return;
  }
  // how many in all: count on by each bus
  if (q.form === 'words') l.show.value = 'picture';
  await v.say(full ? "Let's count each bus." : 'Add the people on each bus.');
  if (!full) { l.show.value = 'picture'; return; }
  await countGroups(v, l, q.groups, q.each, true, 'bus');
  l.hint.value = q.answer;
  await v.say(n(q.groups * q.each), 'people in all!');
}

// ---------- Windows ----------

async function teachArray(q: ArrayQ, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'rows' || q.form === 'cols') {
    l.show.value = 'cue';
    await v.say('Rows go across.');
    if (!full) return;
    if (q.form === 'rows') { await v.say("Let's count the rows."); await countOnes(v, l, q.rows); l.hint.value = q.answer; await v.say(n(q.rows), 'rows.'); }
    else { l.show.value = 'one'; await v.say("Let's count one row."); await countOnes(v, l, q.cols); l.hint.value = q.answer; await v.say(n(q.cols), 'in each row.'); }
    return;
  }
  if (q.form === 'turn') {
    l.show.value = 'tip';
    await v.say('Tip it on its side.', 'The windows stay the same.');
    if (!full) return;
    await countGroups(v, l, q.rows, q.cols, false);
    l.hint.value = q.answer;
    await v.say(q.answer === 'yes' ? 'It has the same number of windows.' : 'It has a different number of windows.');
    return;
  }
  await v.say(full ? "Let's count the rows." : 'Every row has the same.');
  if (!full) { l.show.value = 'cue'; return; }
  await countGroups(v, l, q.rows, q.cols, true);
  l.hint.value = q.answer;
  if (q.form === 'total') await v.say(n(q.rows * q.cols), 'windows!');
  else await v.say(n(q.rows), 'rows of', n(q.cols));
}

// ---------- Odd or Even ----------

async function teachPair(q: PairQ, v: VoiceScope, l: Lesson, full: boolean) {
  const count = q.form === 'which' ? Number(q.answer) : q.n;
  // Which number is even: the people shown are the right number of them, so they wait for the fuller lesson
  l.show.value = q.form === 'which' && !full ? null : 'pairs'; l.step.value = 0;
  if (q.form === 'double' || q.form === 'half') {
    await v.say('Two equal halves make an even number.');
    if (!full) return;
    l.step.value = q.n / 2;
    l.hint.value = q.answer;
    await v.say(n(q.n / 2), 'and', n(q.n / 2), 'make', n(q.n));
    return;
  }
  await v.say("Let's pair them up.");
  // a yes-or-no (or odd-or-even) question is taught whole even on the first miss: the pairing is the lesson. Which number is even
  // waits for the fuller lesson, as pairing the right one would give it away.
  if (!full && q.form === 'which') return;
  const pairs = Math.floor(count / 2);
  for (let i = 1; i <= pairs && v.active; i++) { l.step.value = i; sClink(); if (!reduced()) await v.wait(260); }
  l.hint.value = q.answer;
  await v.say(count % 2 ? 'One is left alone. So it is odd.' : 'Everyone has a partner. So it is even.');
}

// ---------- Count By ----------

const STEP_LINE = { 100: 'Count by hundreds.', 10: 'Count by tens.', 5: 'Count by fives.', 3: 'Count by threes.', 4: 'Count by fours.' } as const;
async function teachCount(q: CountQ, v: VoiceScope, l: Lesson, full: boolean) {
  l.show.value = 'line';
  await v.say('Every jump is', n(q.step));
  if (!full) return;
  const all = q.shown.map(x => x ?? Number(q.answer));
  for (let i = 0; i < all.length && v.active; i++) { l.step.value = i + 1; sCount(i + 1); await v.say(n(all[i]!)); }
  l.hint.value = q.answer;
}
export { STEP_LINE };

// ---------- Share It ----------

async function teachShare(q: ShareQ, v: VoiceScope, l: Lesson, full: boolean) {
  if (q.form === 'trucks') {
    l.show.value = 'fill';
    await v.say("Let's fill the trucks.");
    if (!full) return;
    const trucks = q.total / q.each;
    for (let i = 1; i <= trucks && v.active; i++) { l.step.value = i; sCount(i); await v.say(n(i)); }
    l.hint.value = q.answer;
    await v.say(n(trucks), 'trucks.');
    return;
  }
  l.show.value = 'deal'; l.step.value = 0;
  await v.say('One box for each truck, round and round.');
  if (!full && q.form === 'each') return;
  for (let i = 1; i <= q.total && v.active; i++) { l.step.value = i; sClink(); if (!reduced()) await v.wait(q.total > 16 ? 90 : 200); }
  l.hint.value = q.answer;
  await v.say('Every truck has the same.', n(q.total / q.trucks), 'on each truck.');
}

// ---------- Times ----------

async function teachTimes(q: TimesQ, v: VoiceScope, l: Lesson, full: boolean, level: number) {
  if (q.form === 'turn') {
    l.show.value = 'tip';
    await v.say('Tip it on its side.', 'The windows stay the same.');
    if (!full) return;
    await countGroups(v, l, q.a, q.b, false);
    l.hint.value = q.answer;
    await v.say('It has the same number of windows.');
    return;
  }
  const rows = q.form === 'fact' ? q.a : q.rows, cols = q.form === 'fact' ? q.b : q.cols;
  l.show.value = 'picture';
  if (level >= 2) await v.say(n(rows), 'times', n(cols), 'is a short way to say', n(rows), 'rows of', n(cols));
  else await v.say('This sign means rows of.', n(rows), 'rows of', n(cols));
  if (!full) return;
  await countGroups(v, l, rows, cols, q.form === 'fact');
  l.hint.value = q.answer;
  if (q.form === 'fact') await v.say(n(rows * cols));
}

async function lesson(p: Asking, v: VoiceScope, l: Lesson, full: boolean) {
  const q = p.q;
  switch (q.kind) {
    case 'groups': return teachGroups(q, v, l, full);
    case 'array': return teachArray(q, v, l, full);
    case 'pair': return teachPair(q, v, l, full);
    case 'count': return teachCount(q, v, l, full);
    case 'share': return teachShare(q, v, l, full);
    case 'times': return teachTimes(q, v, l, full, p.level);
  }
}

/** A miss: one line and a cue, or the whole lesson. */
export async function explain(p: Asking, _answer: string, teach: boolean, signal: AbortSignal) {
  const l = lessonFor(signal), v = l.task.start();
  reset(l);
  if (!teach) { await v.say('Not quite!'); await lesson(p, v, l, false); await v.say('Try again!'); return; }
  await v.say("Let's look together.");
  await lesson(p, v, l, true);
  await v.say('Try again!');
}
/** 🔎: the whole lesson, on demand. */
export async function help(p: Asking, signal: AbortSignal) {
  const l = lessonFor(signal), v = l.task.start();
  reset(l);
  await lesson(p, v, l, true);
}
export type { Item, Phrase };
