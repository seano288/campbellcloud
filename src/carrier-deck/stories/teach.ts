// Teaching a miss on the picture itself, never with a red X.
//
// The first miss gets one line about the mistake he made, then the story acted out (and "Try again!"):
// - Deck Log and Two Steps: the story plays again on the deck, one sentence at a time, the counters coming and going as each number is
//   said. When the start is the unknown, the action runs backwards ("Go backwards."). It ends by writing the number sentence in the
//   story's order. (Two Steps acts out the first step, and gives its answer: the middle is never said in the story.)
// - Which Sum: each sentence of the story lights the part of the number sentence it stands for.
// - How Many More: the two rows pair off, and the ones without a partner glow. "These have no partner." (as Bot Stories).
// - Mission Board: a line runs from the top of the bar across to the scale, and the scale is counted by its step.
// The second miss (or the first when he has been missing a lot, or 🔎) gets the fuller lesson with the bar picture: a long bar for the
// whole and two shorter bars for the parts, one of them empty, walked through one step at a time; he taps the arrow to move each step on.
// It ends with the number sentence and its answer, and the answer glows.
import { signal, type Signal } from '@preact/signals';
import { sClink, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { said, type Phrase } from '../phrases';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import type { Bars, DeckScene, GraphMarks, Rows } from './pictures';
import { slipOf, solve, type BoardProblem, type CompareProblem, type Eq, type OneProblem, type PickProblem, type Sentence, type Story, type TwoProblem, type WheelProblem } from './problems';

export interface EqShown { readonly eq: Eq; readonly lit?: 'l' | 'r' | 'res' | 'op' | null; readonly filled?: number | null }
export interface Lesson {
  readonly deck: Signal<DeckScene | null>;
  readonly bars: Signal<Bars | null>;
  readonly rows: Signal<Rows | null>;
  readonly graph: Signal<GraphMarks | null>;
  readonly eq: Signal<EqShown | null>;
  /** A sum of three, for the Mission Board's "in all" (written as text). */
  readonly sum: Signal<string | null>;
  /** The story sentence being said. */
  readonly lit: Signal<number | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
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
      deck: signal(null), bars: signal(null), rows: signal(null), graph: signal(null), eq: signal(null), sum: signal(null), lit: signal(null), hint: signal(null), waiting,
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
function reset(l: Lesson) { l.deck.value = null; l.bars.value = null; l.rows.value = null; l.graph.value = null; l.eq.value = null; l.sum.value = null; l.lit.value = null; l.hint.value = null; l.waiting.value = false; }
/** Waits for his tap on the arrow (the first time in a lesson, it says so). */
async function next(v: VoiceScope, lesson: Lesson, told: { told: boolean }) {
  if (!v.active) return;
  const wait = lesson.wait(v);
  if (!told.told) { told.told = true; void v.say('Tap the arrow.'); }
  await wait;
}
/** A sentence as the voice says it: its pieces, each number a clip. */
export const speechOf = (s: Sentence): Item[] => s.pieces.map(p => (typeof p === 'number' ? said(p) : p as Phrase));

// ---------- acting a one-step story out on the deck ----------

/** The deck after each sentence of a one-step story, the start unknown shown as a box until the end runs it backwards. */
export function deckSteps(s: Story): DeckScene[] {
  const n = s.nums, noun = s.noun, ask = s.ask;
  if (s.shape === 'part') {
    const p = n['#p']!, q = n['#q']!;
    const first: DeckScene = { noun, groups: [{ n: ask === '#p' ? 0 : p, kind: ask === '#p' ? 'ghost' : 'on' }] };
    return ask === '#w' ? [first, { noun, groups: [{ n: p, kind: 'on' }, { n: q, kind: 'come' }] }]
      // the whole first, then the part on deck taken from it: the rest is what's asked
      : [{ noun, groups: [{ n: n['#w']!, kind: 'on' }] }, { noun, groups: [{ n: p, kind: 'on' }, { n: n['#w']! - p, kind: 'ghost', label: '?' }] }];
  }
  const st = n['#s']!, c = n['#c']!, e = n['#e']!;
  if (s.shape === 'join') {
    if (ask === '#e') return [{ noun, groups: [{ n: st, kind: 'on' }] }, { noun, groups: [{ n: st, kind: 'on' }, { n: c, kind: 'come' }] }];
    if (ask === '#c') return [{ noun, groups: [{ n: st, kind: 'on' }] }, { noun, groups: [{ n: st, kind: 'on' }, { n: 0, kind: 'ghost', label: '?' }] }, { noun, groups: [{ n: st, kind: 'on' }, { n: e - st, kind: 'come', label: '?' }] }];
    // the start: some, then more came, then the total; backwards, the ones that came go again
    return [{ noun, groups: [{ n: 0, kind: 'ghost', label: '?' }] }, { noun, groups: [{ n: 0, kind: 'ghost', label: '?' }, { n: c, kind: 'come' }] },
      { noun, groups: [{ n: e - c, kind: 'on', label: '?' }, { n: c, kind: 'come' }] }, { noun, groups: [{ n: e - c, kind: 'on', label: '?' }, { n: c, kind: 'go' }], backwards: true }];
  }
  // separate: what's left, and the ones that went shown leaving
  if (ask === '#e') return [{ noun, groups: [{ n: st, kind: 'on' }] }, { noun, groups: [{ n: e, kind: 'on' }, { n: c, kind: 'go' }] }];
  if (ask === '#c') return [{ noun, groups: [{ n: st, kind: 'on' }] }, { noun, groups: [{ n: st, kind: 'on' }] }, { noun, groups: [{ n: e, kind: 'on' }, { n: st - e, kind: 'go', label: '?' }] }];
  return [{ noun, groups: [{ n: 0, kind: 'ghost', label: '?' }] }, { noun, groups: [{ n: 0, kind: 'ghost', label: '?' }, { n: c, kind: 'go' }] },
    { noun, groups: [{ n: e, kind: 'on' }, { n: c, kind: 'go' }] }, { noun, groups: [{ n: e, kind: 'on' }, { n: c, kind: 'come', label: '?' }], backwards: true }];
}

/** The bar picture for a one-step story: the whole and its two parts, the asked one empty. */
export function barsOf(s: Story): Bars {
  const n = s.nums, k = (slot: keyof typeof n) => (s.ask === slot ? null : n[slot]!);
  if (s.shape === 'join') return { kind: 'parts', whole: k('#e'), parts: [{ n: k('#s') }, { n: k('#c') }] };
  if (s.shape === 'sep') return { kind: 'parts', whole: k('#s'), parts: [{ n: k('#e') }, { n: k('#c') }] };
  if (s.shape === 'part') return { kind: 'parts', whole: k('#w'), parts: [{ n: k('#p') }, { n: k('#q') }] };
  return { kind: 'compare', whole: k('#big'), parts: [{ n: k('#small') }, { n: k('#d') }] };
}
/** The number sentence that finds the answer from the bar picture: the parts added for the whole, else the whole take away the part. */
export function findEq(s: Story): Eq {
  const b = barsOf(s);
  if (b.whole === null) return { l: b.parts[0].n!, op: '+', r: b.parts[1].n!, res: null };
  const known = b.parts[0].n ?? b.parts[1].n!;
  return { l: b.whole, op: '-', r: known, res: null };
}

async function actOut(s: Story, v: VoiceScope, lesson: Lesson, upTo = s.sentences.length - 1) {
  const steps = deckSteps(s);
  for (let i = 0; i < Math.min(upTo, s.sentences.length - 1); i++) {
    if (!v.active) return;
    lesson.lit.value = i;
    const scene = steps[Math.min(i, steps.length - 1)]!;
    lesson.deck.value = scene;
    sCount(i);
    await v.say(...speechOf(s.sentences[i]!));
  }
  const last = steps[steps.length - 1]!;
  if (last.backwards && steps.length > s.sentences.length - 1) {
    lesson.deck.value = last;
    await v.say('Go backwards.');
  }
  lesson.lit.value = null;
}

async function firstLine(q: WheelProblem, answer: string, v: VoiceScope) {
  const given = Number(answer);
  if (!answer || !Number.isFinite(given)) return;
  const slip = slipOf(q, given);
  if (slip === 'otherOp') await v.say('Do more come, or do some go?');
  if (slip === 'echo') await v.say('That number is in the story.', 'What does the story ask?');
  if (slip === 'firstStep') await v.say('That is only the first step!');
  if (slip === 'lineOff') await v.say('Go straight across from the top of the bar.');
}

async function barLesson(s: Story, v: VoiceScope, lesson: Lesson, told: { told: boolean }) {
  const b = barsOf(s), eq = findEq(s);
  lesson.deck.value = null;
  if (b.kind === 'compare') {
    lesson.bars.value = { ...b, lit: 'whole' };
    await v.say('The big one is the long bar.');
    await next(v, lesson, told);
    lesson.bars.value = { ...b, lit: 0 };
    await v.say('The small one is the short bar.');
    await next(v, lesson, told);
    lesson.bars.value = { ...b, lit: 1 };
    await v.say('This is the extra part.');
    await next(v, lesson, told);
    lesson.eq.value = { eq };
    await v.say(b.whole === null ? 'Add to find the big one.' : 'Take away to find it.');
  } else {
    lesson.bars.value = { ...b, lit: 'whole' };
    await v.say('This bar is all of them.');
    await next(v, lesson, told);
    lesson.bars.value = { ...b, lit: null };
    await v.say('These are the two parts.');
    await next(v, lesson, told);
    if (b.whole === null) { lesson.bars.value = { ...b, lit: 'whole' }; await v.say('We want all of them.', 'Add the parts.'); }
    else { lesson.bars.value = { ...b, lit: b.parts[0].n === null ? 0 : 1 }; await v.say('This part is missing.', 'Take away to find it.'); }
    lesson.eq.value = { eq };
  }
  await next(v, lesson, told);
  lesson.eq.value = { eq, filled: s.answer };
  lesson.bars.value = { ...b, lit: null, ...(b.whole === null ? { whole: s.answer } : b.parts[0].n === null ? { parts: [{ n: s.answer }, b.parts[1]] } : { parts: [b.parts[0], { n: s.answer }] }) } as Bars;
  sCount(3);
  await v.say('That makes', said(s.answer));
}

// ---------- each kind ----------

async function teachOne(q: OneProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const s = q.story;
  if (!full) {
    await firstLine(q, answer, v);
    await actOut(s, v, lesson);
    lesson.eq.value = { eq: s.eq };
    await v.say('Here is the number sentence.');
    return;
  }
  const told = { told: false };
  await actOut(s, v, lesson);
  await next(v, lesson, told);
  await barLesson(s, v, lesson, told);
  lesson.hint.value = q.answer;
}

async function teachCompare(q: CompareProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const s = q.story, big = s.nums['#big']!, small = s.nums['#small']!;
  const [bigLabel, smallLabel] = s.id.startsWith('deck') ? ['Deck one', 'Deck two'] : s.id === 'heliMore' ? ['Carrier', 'Supply ship'] : ['Big ship', 'Small ship'];
  const rows: Rows = { big, small, bigLabel, smallLabel, paired: false, glow: false };
  if (!full) {
    await firstLine(q, answer, v);
    lesson.rows.value = rows;
    await v.say('Line them up in pairs.');
    lesson.rows.value = { ...rows, paired: true };
    sCount(1);
    await v.say('These have no partner.');
    lesson.rows.value = { ...rows, paired: true, glow: true };
    await v.say(s.ask === '#d' ? 'Count the ones with no partner.' : 'This is the extra part.');
    return;
  }
  const told = { told: false };
  lesson.rows.value = { ...rows, paired: true, glow: true };
  await v.say('These have no partner.');
  await next(v, lesson, told);
  lesson.rows.value = null;
  await barLesson(s, v, lesson, told);
  lesson.hint.value = q.answer;
}

async function teachTwo(q: TwoProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const s = q.story, [e1, e2] = s.eqs;
  if (!full) {
    await firstLine(q, answer.split(',').at(-1) || answer, v);
    for (let i = 0; i < 2; i++) { lesson.lit.value = i; sCount(i); await v.say(...speechOf(s.sentences[i]!)); }
    lesson.lit.value = null;
    lesson.eq.value = { eq: e1, filled: s.middle };
    await v.say('First step.', 'That makes', said(s.middle));
    return;
  }
  const told = { told: false };
  lesson.eq.value = { eq: e1 };
  lesson.lit.value = 1;
  await v.say('First step.');
  await next(v, lesson, told);
  lesson.eq.value = { eq: e1, filled: s.middle };
  sCount(1);
  await v.say('That makes', said(s.middle));
  await next(v, lesson, told);
  lesson.lit.value = s.sentences.length - 2;
  lesson.eq.value = { eq: e2 };
  await v.say('Second step.');
  await next(v, lesson, told);
  lesson.eq.value = { eq: e2, filled: s.answer };
  sCount(2);
  await v.say('That makes', said(s.answer));
  lesson.lit.value = null;
  lesson.hint.value = q.stepped ? q.answer : String(s.answer);
}

/** Which part of the number sentence a sentence's number stands for. */
function partFor(eq: Eq, n: number): 'l' | 'r' | 'res' | null {
  if (eq.l === n) return 'l';
  if (eq.r === n) return 'r';
  if (eq.res === n) return 'res';
  return null;
}
async function teachPick(q: PickProblem, v: VoiceScope, lesson: Lesson, full: boolean) {
  const s = q.story, eq = parseEq(q.answer);
  const told = { told: false };
  for (const [i, sen] of s.sentences.entries()) {
    if (!v.active) return;
    lesson.lit.value = i;
    const num = sen.nums[0], last = i === s.sentences.length - 1;
    const part = num !== undefined ? partFor(eq, num) : null;
    lesson.eq.value = { eq, lit: last ? (eq.res === null ? 'res' : eq.l === null ? 'l' : 'r') : part ?? (num === undefined ? 'op' : null) };
    await v.say(...speechOf(sen));
    if (full && !last) await next(v, lesson, told);
  }
  lesson.lit.value = null;
  if (full) {
    lesson.bars.value = barsOf(s);
    await v.say('This number sentence fits the story.');
    lesson.hint.value = q.answer;
  }
}
/** A choice's number sentence, read back from its text. */
export function parseEq(text: string): Eq {
  const m = /^(\d+|\?) ([+−]) (\d+|\?) = (\d+|\?)$/.exec(text);
  if (!m) throw new Error(`not a number sentence: ${text}`);
  const v = (x: string) => (x === '?' ? null : Number(x));
  return { l: v(m[1]!), op: m[2] === '+' ? '+' : '-', r: v(m[3]!), res: v(m[4]!) };
}

/** The scale counted up by its step to the line at or under v: "2, 4, 6, 8" and, for a bar between two lines, "Halfway between 8 and 10". */
async function countUp(q: BoardProblem, bar: number, v: VoiceScope, lesson: Lesson) {
  const value = q.bars[bar]!, to = Math.floor(value / q.step) * q.step;
  lesson.graph.value = { across: bar, counted: 0, lit: [bar] };
  await v.say('Count up the lines.');
  for (let x = q.step; x <= to && v.active; x += q.step) {
    lesson.graph.value = { across: bar, counted: x, lit: [bar] };
    sCount(x / q.step);
    await v.say(said(x));
  }
  if (value !== to) { lesson.graph.value = { across: bar, counted: to + q.step, lit: [bar] }; await v.say('Halfway between', said(to), 'and', said(to + q.step)); }
}
async function teachBoard(q: BoardProblem, answer: string, v: VoiceScope, lesson: Lesson, full: boolean) {
  const told = { told: false };
  if (!full) {
    await firstLine(q, answer, v);
    if (q.form === 'read') { await countUp(q, q.asked[0]!, v, lesson); return; }
    lesson.graph.value = { across: q.asked[0]!, lit: [...q.asked] };
    await v.say('Go straight across from the top of the bar.');
    return;
  }
  for (const [i, bar] of q.asked.entries()) {
    if (i) await next(v, lesson, told);
    await countUp(q, bar, v, lesson);
    await v.say('That makes', said(q.bars[bar]!));
  }
  const vals = q.asked.map(i => q.bars[i]!);
  await next(v, lesson, told);
  if (q.form === 'more') { lesson.eq.value = { eq: { l: vals[0]!, op: '-', r: vals[1]!, res: null } }; await v.say('Take away the shorter bar.'); }
  if (q.form === 'total') { lesson.sum.value = `${vals.join(' + ')} = ?`; await v.say('Add the bars.'); }
  if (q.form !== 'read') {
    await next(v, lesson, told);
    if (q.form === 'more') lesson.eq.value = { eq: { l: vals[0]!, op: '-', r: vals[1]!, res: null }, filled: Number(q.answer) };
    else lesson.sum.value = `${vals.join(' + ')} = ${q.answer}`;
    await v.say('That makes', said(Number(q.answer)));
  }
  lesson.hint.value = q.answer;
}

// ---------- the Round's explain and 🔎 ----------

export async function lessonOf(p: Asking, answer: string, full: boolean, v: VoiceScope, lesson: Lesson) {
  const q = p.q;
  if (q.kind === 'one') return teachOne(q, answer, v, lesson, full);
  if (q.kind === 'compare') return teachCompare(q, answer, v, lesson, full);
  if (q.kind === 'two') return teachTwo(q, answer, v, lesson, full);
  if (q.kind === 'pick') return teachPick(q, v, lesson, full);
  return teachBoard(q, answer, v, lesson, full);
}

/** A miss: the first gets the mistake named and the story acted out, the second the whole lesson. `lifetime` is the question's own
 *  (the Round passes it), so the lesson lands on the picture the view draws. The lesson stays on screen; the hint glows until he answers. */
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
export { solve };
export type { Item };
