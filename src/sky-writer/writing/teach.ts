// Teaching a miss, never with a red X. Writing: a little plane flies the stroke the right way, leaving smoke, while the voice says its
// stroke words ("Start at the top. Pull down. Back up and around."), then he traces over the smoke. For b and d (and p and q) the two
// letters are first shown side by side, each first stroke lit as it's said: "b starts with the tall line. d starts with the round part."
// A second miss (or the first when he's been missing a lot, or 🔎, which counts as help) holds the start dot lit and walks the letter one
// stroke at a time: the plane flies a stroke, he traces it, then the next.
//
// The tap kinds are taught on the letter itself: its strokes light up in order as their words are said, and the right choice glows.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal).
import { signal, type Signal } from '@preact/signals';
import { sChime, sPop } from '../../audio/sfx';
import { isBdpq } from '../letters/glyphs';
import { letter, type Letter } from '../letters/strokes';
import type { Asking } from '../mix';
import { nameOf, type Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { boxesOf, isWriting, type Question } from './problems';

export interface Fly { box: number; stroke: number; from: number; ms: number }
export interface Lesson {
  /** The plane flying a stroke right now (the pad draws it from `from` for `ms`). */
  readonly fly: Signal<Fly | null>;
  /** Strokes the plane has flown, left as smoke to trace over. */
  readonly guide: Signal<readonly { box: number; stroke: number }[]>;
  /** One stroke at a time, the start dot held lit. */
  readonly walk: Signal<boolean>;
  /** b and d side by side (or p and q), and which one is lit. */
  readonly pair: Signal<{ chars: readonly [string, string]; lit: number | null } | null>;
  /** Tap kinds: the choice that glows, and the strokes of the letter lit so far. */
  readonly glow: Signal<string | null>;
  readonly lit: Signal<readonly number[]>;
  /** Written by the pad: which box he is on, how many strokes it has done. */
  readonly at: { box: number; done: number };
  /** Only one thing animates at a time: starting a new one stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void; isCurrent(v: VoiceScope): boolean };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      fly: signal(null), guide: signal([]), walk: signal(false), pair: signal(null), glow: signal(null), lit: signal([]), at: { box: 0, done: 0 },
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); }, isCurrent: v => v === current },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
/** How long the plane takes to fly a stroke. */
export const flyMs = (L: Letter, k: number) => (L.strokes[k]!.dot ? 450 : Math.max(800, L.strokes[k]!.len * 620));

/** The plane flies one stroke of a box's letter while its words are said; its smoke stays to trace over. */
export async function flyStroke(v: VoiceScope, l: Lesson, ch: string, box: number, k: number) {
  const L = letter(ch), ms = flyMs(L, k);
  l.fly.value = { box, stroke: k, from: performance.now(), ms };
  await Promise.all([v.say(...L.strokes[k]!.say), beat(v, ms)]);
  if (l.fly.peek()?.stroke === k) l.fly.value = null;
  if (!l.guide.peek().some(g => g.box === box && g.stroke === k)) l.guide.value = [...l.guide.peek(), { box, stroke: k }];
}

/** The lines for b, d, p and q side by side. */
const PAIR_LINES: Record<string, Phrase> = { b: 'b starts with the tall line.', d: 'd starts with the round part.', p: 'p starts with the long line.', q: 'q starts with the round part.' };
const PARTNER: Record<string, string> = { b: 'd', d: 'b', p: 'q', q: 'p' };
async function pairLesson(v: VoiceScope, l: Lesson, ch: string) {
  const chars = [ch, PARTNER[ch]!] as const;
  l.pair.value = { chars, lit: null };
  for (let i = 0; i < 2 && v.active; i++) { l.pair.value = { chars, lit: i }; sPop(); await v.say(PAIR_LINES[chars[i]!]!); await beat(v, 250); }
  await beat(v, 300);
  l.pair.value = null;
}

/** Lights a letter's strokes one by one while their words are said. */
async function sweepStrokes(v: VoiceScope, l: Lesson, ch: string, upTo = Infinity) {
  const L = letter(ch);
  l.lit.value = [];
  for (let k = 0; k < L.strokes.length && k < upTo && v.active; k++) { l.lit.value = [...l.lit.peek(), k]; await Promise.all([v.say(...L.strokes[k]!.say), beat(v, 500)]); }
}

async function teachWriting(q: Question & { kind: 'trace' | 'write' | 'word' }, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const box = l.at.box, ch = boxesOf(q)[box] ?? boxesOf(q)[0]!, L = letter(ch), from = Math.min(l.at.done, L.strokes.length - 1);
  if (isBdpq(ch) && answer.startsWith('miss')) await pairLesson(v, l, ch);
  if (!v.active) return;
  if (full) {
    // one stroke at a time: this one now, and the pad asks for the next when he has traced it
    l.walk.value = true;
    await v.say('Watch the plane!');
    if (v.active) await flyStroke(v, l, ch, box, from);
    if (v.active) await v.say('Now you try!');
    return;
  }
  await v.say('Watch the plane!');
  for (let k = from; k < L.strokes.length && v.active; k++) await flyStroke(v, l, ch, box, k);
  if (v.active) await v.say('Trace the smoke!');
}

async function teachTap(p: Asking, _answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const q = p.q;
  if (q.kind === 'start') {
    if (full) await sweepStrokes(v, l, q.ch);
    if (q.step === 'dot') { l.lit.value = [0]; l.glow.value = q.answer; sChime(); await v.say('It starts here.', ...letter(q.ch).strokes[0]!.say); }
    else if (q.step === 'way') { l.lit.value = [0]; l.glow.value = q.answer; sChime(); await v.say('It goes this way first.', ...letter(q.ch).strokes[0]!.say); }
    else { l.lit.value = [0]; await v.say('This line comes first.'); await beat(v, 300); l.lit.value = [0, 1]; l.glow.value = q.answer; sChime(); await v.say('This line comes second.'); }
    return;
  }
  if (q.kind === 'flip') {
    if (isBdpq(q.ch)) await pairLesson(v, l, q.ch);
    if (!v.active) return;
    if (full) await sweepStrokes(v, l, q.ch);
    l.glow.value = q.answer; sChime();
    await v.say(q.step === 'word' ? 'This one is backwards.' : 'This one faces the right way.');
    return;
  }
  if (q.kind === 'size') {
    if (q.step === 'sort') {
      const L = letter(q.ch);
      l.glow.value = q.answer; sChime();
      await v.say(nameOf(q.ch), L.size === 'tall' ? 'Tall letters touch the top line.' : L.size === 'tail' ? 'Tail letters hang below the bottom line.' : 'Small letters fit between the middle line and the bottom line.');
      return;
    }
    const moved = q.rows?.flatMap(r => r).find(x => x.dy !== 0);
    l.glow.value = q.answer; sChime();
    if (q.step === 'odd' && moved) await v.say(moved.dy < 0 ? 'This letter floats.' : 'This letter sinks.');
    await v.say('Letters sit on the bottom line.');
  }
}

/** The lesson after a miss. `full`: the fuller one. Writing answers are "miss:why:stroke". */
export function explain(p: Asking, answer: string, full: boolean, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal), v = l.task.start();
  l.glow.value = null;
  const run = isWriting(p.q) ? teachWriting(p.q, answer, full, l, v) : teachTap(p, answer, full, l, v);
  return run.finally(() => { if (l.task.isCurrent(v)) { l.fly.value = null; l.pair.value = null; } });
}

/** 🔎: the fuller lesson, on demand. It counts as help. */
export function help(p: Asking, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal);
  l.glow.value = null;
  const v = l.task.start();
  return (isWriting(p.q) ? teachWriting(p.q, 'help', true, l, v) : teachTap(p, 'help', true, l, v)).finally(() => { if (l.task.isCurrent(v)) l.fly.value = null; });
}

/** Walking the letter: he traced a stroke, so the plane flies the next one. */
export function walkNext(signal: AbortSignal, ch: string, box: number, k: number) {
  const l = lessonFor(signal), v = l.task.start();
  return flyStroke(v, l, ch, box, k);
}

/** After three rub-outs in a row: the plane shows the stroke again (not a miss, and not help). */
export function showAgain(signal: AbortSignal, ch: string, box: number, k: number) {
  const l = lessonFor(signal), v = l.task.start();
  return v.say('Watch the plane!').then(() => (v.active ? flyStroke(v, l, ch, box, k) : undefined));
}
