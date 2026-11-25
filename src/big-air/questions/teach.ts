// Teaching a miss on the picture itself, never with a red X. The first miss gets one line about the mistake he made (the number at the
// end, the lines counted instead of the spaces, the other side of the ruler...), the picture moves to show it, and "Try again!". The
// second miss (or the first, when he has been missing a lot, or when he taps 🔎) gets the fuller lesson: the same question walked
// through one step at a time, and he taps the arrow to move each step on. It ends with the right answer glowing.
//
// - Ruler: the thing slides to zero, then each unit is counted as a hop along the ruler. "Count the spaces, not the lines."
// - How Much Longer: the shorter bar is laid on the longer one, and the part left over lights up and is counted.
// - Jump Line: the tape fills from zero, ten at a time and then by ones.
// - Best Guess: the two things are drawn side by side at the same scale, with a child standing next to them.
// - Length Stories: the bars are drawn end to end or one above the other, as the story says, and the number sentence is said.
// - Two Units: both units are laid along the thing, and more of the small ones fit.
import { signal, type Signal } from '@preact/signals';
import { sClink, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { sayN, unitSaid, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import { smaller, storyAnswer, thingOf, whyOf, type GuessQ, type LineQ, type LongerQ, type Question, type RulerQ, type StoryQ, type UnitsQ } from './problems';

/** What the lesson draws on the question's picture. */
export type Show =
  /** The bar slides by `slide` units (to zero), then `hops` hops are drawn from its start, the last one lit. */
  | { readonly k: 'ruler'; readonly slide: number; readonly hops: number }
  /** How Much Longer: the short bar laid on the long one (`laid`), and `count` units of what's left over lit. */
  | { readonly k: 'longer'; readonly laid: boolean; readonly count: number }
  /** Jump Line: the tape lit from zero (or from `from`) up to `to`. */
  | { readonly k: 'fill'; readonly from: number; readonly to: number }
  /** Best Guess: the things at the same scale beside a child. */
  | { readonly k: 'scale' }
  /** Length Stories: the bars drawn, step by step (1: the first, 2: both, 3: the answer). */
  | { readonly k: 'bars'; readonly step: number }
  /** Two Units: `big` big units and `small` small units laid along the thing. */
  | { readonly k: 'units'; readonly big: number; readonly small: number };

export interface Lesson {
  readonly show: Signal<Show | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** He has to tap the arrow to go on. */
  readonly waiting: Signal<boolean>;
  advance(): void;
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
      show: signal(null), hint: signal(null), waiting,
      advance() { if (waiting.peek()) { waiting.value = false; sClink(); const r = release; release = null; r?.(); } },
      wait: v => new Promise<void>(resolve => { if (!v.active) return resolve(); release = resolve; waiting.value = true; }),
      task: {
        cancel, start() { cancel(); const v = createVoiceScope(lifetime); current = v; v.signal.addEventListener('abort', () => { waiting.value = false; release?.(); release = null; }, { once: true }); return v; },
      },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}
async function next(v: VoiceScope, lesson: Lesson, told: { told: boolean }) {
  if (!v.active) return;
  const wait = lesson.wait(v);
  if (!told.told) { told.told = true; void v.say('Tap the arrow.'); }
  await wait;
}
const pause = (v: VoiceScope, ms: number) => v.wait(ms);

// ---------- Ruler ----------

async function teachRuler(q: RulerQ, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const { start, len } = q.bar, unit = q.ruler.unit, why = whyOf(q, answer);
  if (!full) {
    const line: Phrase = why === 'end' ? 'That is the number at the end.' : why === 'start' ? 'That is the number at the start.'
      : why === 'unit' ? (unit === 'in' ? 'Read the inch side.' : 'Read the centimetre side.') : 'Count the spaces, not the lines.';
    await v.say(line);
    if (start > 0) { lesson.show.value = { k: 'ruler', slide: -start, hops: 0 }; await v.say('It does not start at zero.', 'Slide it to zero.'); }
    return;
  }
  const told = { told: false };
  if (start > 0) {
    await v.say('It does not start at zero.');
    await next(v, lesson, told);
    lesson.show.value = { k: 'ruler', slide: -start, hops: 0 };
    await v.say('Slide it to zero.');
  } else await v.say('Start at zero.');
  await next(v, lesson, told);
  await v.say('Count the spaces, not the lines.');
  for (let i = 1; i <= len && v.active; i++) {
    lesson.show.value = { k: 'ruler', slide: -start, hops: i };
    sCount(i % 12);
    await v.say(...sayN(i));
  }
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  await v.say('It is', ...unitSaid(len, unit), 'long.');
}

// ---------- How Much Longer ----------

async function teachLonger(q: LongerQ, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const d = Number(q.answer), why = whyOf(q, answer), unit = q.form === 'jumps' ? 'ft' : q.ruler.unit;
  if (!full) {
    const line: Phrase = why === 'longer' ? 'That is how long the long one is.' : why === 'shorter' ? 'That is how long the short one is.'
      : why === 'both' ? "Don't add them. Find the difference." : why === 'ends' || why === 'end' ? 'They do not start at the same place.'
      : why === 'ten' ? 'Check the tens.' : 'Count the spaces, not the lines.';
    await v.say(line);
    lesson.show.value = { k: 'longer', laid: true, count: 0 };
    await v.say('Lay the short one on the long one.');
    return;
  }
  const told = { told: false };
  if (q.form === 'ruler' && q.a.start !== q.b.start) { await v.say('They do not start at the same place.', 'Measure each one first.'); await next(v, lesson, told); }
  lesson.show.value = { k: 'longer', laid: true, count: 0 };
  await v.say('Lay the short one on the long one.');
  await next(v, lesson, told);
  await v.say('Count the part left over.');
  if (q.form === 'jumps') {
    // big numbers: count on from the short jump by tens, then ones
    const b = q.b, a = q.a;
    let at = b;
    const steps: number[] = [];
    while (at + 10 <= a) { at += 10; steps.push(at); }
    while (at < a) { at += 1; steps.push(at); }
    for (let i = 0; i < steps.length && v.active; i++) { lesson.show.value = { k: 'longer', laid: true, count: steps[i]! - b }; sCount(i % 12); await v.say(...sayN(steps[i]!)); }
  } else {
    for (let i = 1; i <= d && v.active; i++) { lesson.show.value = { k: 'longer', laid: true, count: i }; sCount(i % 12); await v.say(...sayN(i)); }
  }
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  await v.say('It is', ...unitSaid(d, unit), 'longer.');
}

// ---------- Jump Line ----------

async function teachLine(q: LineQ, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  if (q.form === 'hops') {
    const t = Math.floor(q.b / 10) * 10, o = q.b % 10, why = whyOf(q, answer);
    if (!full) {
      await v.say(why === 'tens' ? 'Find the tens first.' : why === 'ones' ? 'Then add the ones.' : why === 'ten' ? 'Check the tens.' : 'Find the tens first.');
      lesson.show.value = { k: 'fill', from: q.a, to: q.a + t };
      return;
    }
    const told = { told: false };
    await v.say('Find the tens first.');
    for (let x = q.a + 10; x <= q.a + t && v.active; x += 10) { lesson.show.value = { k: 'fill', from: q.a, to: x }; sCount(1); await v.say(...sayN(x)); }
    if (o) {
      await next(v, lesson, told);
      await v.say('Then add the ones.');
      for (let x = q.a + t + 1; x <= q.a + q.b && v.active; x++) { lesson.show.value = { k: 'fill', from: q.a, to: x }; sCount(x % 12); await v.say(...sayN(x)); }
    }
    await next(v, lesson, told);
    lesson.hint.value = q.answer;
    await v.say('It lands on', ...unitSaid(q.a + q.b, 'ft'));
    return;
  }
  const n = q.n, lo = q.form === 'ones' ? q.lo : 0;
  if (!full) {
    await v.say(q.form === 'tens' ? 'Count by tens from zero.' : 'Count on by ones.');
    lesson.show.value = { k: 'fill', from: lo, to: n };
    return;
  }
  const told = { told: false };
  if (q.form === 'tens') {
    await v.say('Count by tens from zero.');
    for (let x = 10; x <= n && v.active; x += 10) { lesson.show.value = { k: 'fill', from: 0, to: x }; sCount(x / 10); await v.say(...sayN(x)); }
  } else {
    await v.say('Count on by ones.');
    await v.say(...sayN(lo));
    for (let x = lo + 1; x <= n && v.active; x++) { lesson.show.value = { k: 'fill', from: lo, to: x }; sCount(x % 12); await v.say(...sayN(x)); }
  }
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  await v.say('It lands on', ...unitSaid(n, 'ft'));
}

// ---------- Best Guess ----------

async function teachGuess(q: GuessQ, _answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  lesson.show.value = { k: 'scale' };
  if (q.form === 'longer') {
    const a = thingOf(q.a), b = thingOf(q.b);
    await v.say('Here they are next to a child.');
    if (!full) return;
    const told = { told: false };
    for (const th of [a, b]) { await next(v, lesson, told); await v.say(th.name as Phrase, 'is about', ...unitSaid(th.about.n, th.about.unit), 'long.'); }
    lesson.hint.value = q.answer;
    return;
  }
  const th = thingOf(q.thing);
  if (q.form === 'about') {
    await v.say('Think how big it is in real life.');
    if (!full) return;
    const told = { told: false };
    await v.say('Here they are next to a child.');
    await next(v, lesson, told);
    lesson.hint.value = q.answer;
    await v.say(th.name as Phrase, 'is about', ...unitSaid(Number(q.answer), q.unit), 'long.');
    return;
  }
  await v.say(th.about.unit === 'in' ? 'Small things are measured in inches.' : 'Big things are measured in feet.');
  if (!full) return;
  const told = { told: false };
  await v.say('Here they are next to a child.');
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  await v.say(th.name as Phrase, 'is about', ...unitSaid(th.about.n, th.about.unit), 'long.');
}

// ---------- Length Stories ----------

async function teachStory(q: StoryQ, _answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const adds = storyAnswer(q.form, q.x, q.y) === q.x + q.y, line: Phrase = q.bars === 'join'
    ? (adds ? 'Put them end to end.' : 'Take the piece away.') : (adds ? 'Line them up.' : 'Line them up.');
  lesson.show.value = { k: 'bars', step: 2 };
  if (!full) { await v.say(line); return; }
  const told = { told: false }, ans = Number(q.answer);
  lesson.show.value = { k: 'bars', step: 1 };
  await v.say(line);
  await next(v, lesson, told);
  lesson.show.value = { k: 'bars', step: 2 };
  const sum: Item[] = adds ? [...unitSaid(q.x, 'ft'), 'plus', ...unitSaid(q.y, 'ft')] : [...unitSaid(q.x, 'ft'), 'take away', ...unitSaid(q.y, 'ft')];
  // the start unknown: the sum is the other way round from the story (he added 8 and it's 30: 30 take away 8)
  await v.say(...sum);
  await next(v, lesson, told);
  lesson.show.value = { k: 'bars', step: 3 };
  lesson.hint.value = q.answer;
  await v.say('is', ...unitSaid(ans, 'ft'));
}

// ---------- Two Units ----------

async function teachUnits(q: UnitsQ, _answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  if (q.form === 'which') {
    lesson.show.value = { k: 'units', big: q.inches, small: q.cm };
    await v.say('A centimetre is smaller than an inch.', 'More of them fit.');
    if (!full) return;
    const told = { told: false };
    await next(v, lesson, told);
    lesson.show.value = { k: 'units', big: 0, small: 0 };
    for (let i = 1; i <= q.inches && v.active; i++) { lesson.show.value = { k: 'units', big: i, small: 0 }; sCount(i); await v.say(...sayN(i)); }
    await v.say('inches.');
    await next(v, lesson, told);
    for (let i = 1; i <= q.cm && v.active; i++) { lesson.show.value = { k: 'units', big: q.inches, small: i }; sCount(i % 12); await pause(v, 140); }
    await v.say(...sayN(q.cm), 'centimetres.');
    lesson.hint.value = q.answer;
    await v.say('The smaller unit gives the bigger number.');
    return;
  }
  const pair = q.form === 'more' ? [q.unit, q.to] as const : [q.small.unit, q.big.unit] as const;
  const small = smaller(pair[0], pair[1]) ? pair[0] : pair[1], big = small === pair[0] ? pair[1] : pair[0];
  lesson.show.value = { k: 'units', big: 3, small: 0 };
  await v.say(unitLine(small, big));
  if (!full) return;
  const told = { told: false };
  await next(v, lesson, told);
  lesson.show.value = { k: 'units', big: 3, small: 1 };
  await v.say('More of them fit.');
  await next(v, lesson, told);
  lesson.hint.value = q.answer;
  await v.say('The smaller unit gives the bigger number.');
}
function unitLine(small: string, big: string): Phrase {
  if (small === 'in' && big === 'ft') return 'An inch is smaller than a foot.';
  if (small === 'cm' && big === 'ft') return 'A centimetre is smaller than a foot.';
  return 'A centimetre is smaller than an inch.';
}

// ---------- any kind ----------

export async function lessonOf(p: Asking, answer: string, full: boolean, v: VoiceScope, lesson: Lesson) {
  const q: Question = p.q;
  switch (q.kind) {
    case 'ruler': return teachRuler(q, answer, v, lesson, full);
    case 'longer': return teachLonger(q, answer, v, lesson, full);
    case 'line': return teachLine(q, answer, v, lesson, full);
    case 'guess': return teachGuess(q, answer, v, lesson, full);
    case 'story': return teachStory(q, answer, v, lesson, full);
    case 'units': return teachUnits(q, answer, v, lesson, full);
  }
}
function reset(lesson: Lesson) { lesson.show.value = null; lesson.hint.value = null; lesson.waiting.value = false; }

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
