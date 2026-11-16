// Teaching a miss, never with a red X: the lesson shows the rule on the train itself and says it in one plain line.
//
// - Build the Train: a train couples up car by car in the right order while each word is said, then the whole sentence is said. His
//   cars stay where he put them, with the first wrong one lit, so he can fix it (tapping a car uncouples it and the cars behind it).
// - Engine and Caboose: the right engine's capital or the caboose's mark glows in its place, with its line ("A sentence starts with a
//   capital letter." / "This one asks something, so it ends with a question mark.").
// - What Happened and Who, What, Where: the words that decide it light up in the sentence ("under"), and the matching part of the
//   right picture lights with them.
// - Fix the Train: the bad car lights, with its line.
// A second miss (or the first, when he's been missing a lot) says a little more and leaves the answer glowing. 🔎 runs that fuller
// lesson and counts as help.
import { signal, type Signal } from '@preact/signals';
import { sChime, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { wordPhrase, type Phrase } from '../phrases';
import { sentence, type Sentence } from '../sentences/index';
import { wordFor, type Attr, type Meaning } from '../sentences/scenes';
import { isName } from '../sentences/words';
import type { Lit } from '../art/Scene';
import { createVoiceScope, type VoiceScope } from '../voice';
import { piecesOf, type AskQ, type FixQ, type MeanQ, type Question } from './problems';

export type Show =
  /** The right train coupling up: this many pieces so far. */
  | { kind: 'couple'; n: number }
  /** Words lit in a sentence (`s`), and a part of the right picture. */
  | { kind: 'words'; s: number; idx: number[]; lit: Lit }
  /** A piece of the train lit (an index into the train as shown), with the right piece shown in its place. */
  | { kind: 'piece'; idx: number; fixed?: string };

export interface Lesson {
  /** What the lesson shows now; null: nothing. */
  readonly show: Signal<Show | null>;
  /** The piece or choice being said right now. */
  readonly lit: Signal<string | null>;
  /** The answer, left glowing after a fuller lesson. */
  readonly glow: Signal<string | null>;
  /** In Build the Train: the first of his cars that's wrong, after a lesson. */
  readonly firstWrong: Signal<number | null>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = { show: signal(null), lit: signal(null), glow: signal(null), firstWrong: signal(null), task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } } };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);

/** The line for a sentence's end mark. */
export const markLine = (mark: string): Phrase => mark === '?' ? 'This one asks something, so it ends with a question mark.'
  : mark === '!' ? 'This one shows a big feeling, so it ends with an exclamation mark.' : 'This one tells something, so it ends with a period.';
/** The line for a capital: the first word, "I", or a name. */
export const capitalLine = (s: Sentence, slot: number): Phrase => slot === 0 ? 'A sentence starts with a capital letter.'
  : s.words[slot] === 'I' ? 'The word I always has a capital letter.' : isName(s.words[slot]!) ? 'A name starts with a capital letter.' : 'A sentence starts with a capital letter.';

/** The train couples up piece by piece, each word said, then the whole sentence. */
async function couple(s: Sentence, l: Lesson, v: VoiceScope) {
  await v.say('Listen to the train.');
  const pieces = piecesOf(s);
  for (let k = 1; k <= pieces.length && v.active; k++) {
    l.show.value = { kind: 'couple', n: k };
    sCount(k);
    if (k <= s.words.length) await v.say(wordPhrase(s.words[k - 1]!)); else await beat(v, 450);
  }
  if (v.active) await v.say(s.text);
}

const LIT: Record<Attr, Lit> = { who: 'who', n: 'who', size: 'who', color: 'who', act: 'who', rel: 'at', at: 'at', has: 'has', hasColor: 'has' };

/** Which words decide a picture: the ones that say what this wrong picture changed (or, with no wrong picture, all of it). */
function deciding(s: Sentence, m: Meaning, attrs: readonly Attr[]): { idx: number[]; lit: Lit } {
  const idx = [...new Set(attrs.map(a => wordFor(s.words, a, m[a])).filter(i => i >= 0))];
  const lits = [...new Set(attrs.map(a => LIT[a]))];
  return { idx, lit: lits.length === 1 ? lits[0]! : 'all' };
}

async function teachMean(q: MeanQ, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const s = sentence(q.s), m = s.m!, picked = q.choices.find(c => c.key === answer);
  const attrs: Attr[] = picked?.attr ? [picked.attr] : (Object.keys(m) as Attr[]).filter(a => a !== 'who' || q.choices.some(c => c.attr === 'who'));
  const d = deciding(s, m, attrs.length ? attrs : ['who']);
  // the sentence is said now: it's a lesson, not the question
  await v.say(s.text);
  if (!v.active) return;
  l.show.value = { kind: 'words', s: s.id, idx: d.idx, lit: d.lit };
  sChime();
  await v.say('Look!');
  for (const i of d.idx) { if (!v.active) return; await v.say(wordPhrase(s.words[i]!)); }
  if (full && v.active) l.glow.value = q.answer;
}

async function teachAsk(q: AskQ, full: boolean, l: Lesson, v: VoiceScope) {
  const s = sentence(q.s), m = s.m!;
  const attrs: Attr[] = q.about === 'who' ? ['who'] : q.about === 'where' ? ['rel', 'at'] : q.about === 'what' ? ['has'] : ['act'];
  const d = deciding(s, m, attrs);
  await v.say('Listen.');
  if (!v.active) return;
  l.show.value = { kind: 'words', s: s.id, idx: d.idx, lit: d.lit === 'all' ? 'who' : d.lit };
  sChime();
  await v.say(s.text);
  if (v.active) await v.say(q.q as Phrase);
  if (full && v.active) l.glow.value = q.answer;
}

async function teachFix(q: FixQ, full: boolean, l: Lesson, v: VoiceScope) {
  const s = sentence(q.s), bad = q.bad[0]!;
  l.show.value = { kind: 'piece', idx: bad };
  sChime();
  if (q.mistake === 'capital') await v.say(capitalLine(s, bad));
  else if (q.mistake === 'mark') await v.say(q.caboose ? markLine(s.mark) : 'Every sentence needs a mark at the end.');
  else if (q.mistake === 'extra') { await v.say('This word does not belong.'); if (v.active) await v.say(s.text); }
  else {
    l.show.value = { kind: 'piece', idx: q.bad[0]! };
    await v.say('Two cars are swapped.');
    if (v.active) { l.show.value = { kind: 'piece', idx: q.bad[1]! }; await v.say(s.text); }
  }
  if (full && v.active) l.glow.value = `${q.bad[0]}`;
  else l.show.value = null;
}

/** The lesson for a miss. `full`: the fuller one, which leaves the answer glowing. */
async function teach(q: Question, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const s = sentence(q.s);
  if (q.kind === 'order') {
    await couple(s, l, v);
    if (!v.active) return;
    l.show.value = null;
    // his cars stay, with the first wrong one lit
    const mine = answer ? answer.split('|') : [], right = piecesOf(s), first = mine.findIndex((p, i) => p !== right[i]);
    l.firstWrong.value = first >= 0 ? first : null;
    if (full) l.glow.value = right[first >= 0 ? first : 0]!;
    return;
  }
  if (q.kind === 'marks') {
    const fixed = q.answer;
    l.show.value = { kind: 'piece', idx: q.slot, fixed };
    sChime();
    await v.say(q.form === 'caboose' ? markLine(s.mark) : capitalLine(s, q.slot));
    if (full && v.active) l.glow.value = q.answer;
    else l.show.value = null;
    return;
  }
  if (q.kind === 'mean') return teachMean(q, answer, full, l, v);
  if (q.kind === 'ask') return teachAsk(q, full, l, v);
  return teachFix(q, full, l, v);
}

/** What the round engine runs after a miss, before he can try again. */
export async function explain(p: Asking, answer: string, full: boolean, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null; l.lit.value = null; l.firstWrong.value = null;
  await v.say(full ? "Let's look together." : 'Not quite!');
  if (!v.active) return;
  await teach(p.q, answer, full, l, v);
  if (v.active) await v.say('Try again!');
}

/** 🔎: the fuller lesson without a miss, which counts as help. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null; l.lit.value = null;
  await teach(p.q, '', true, l, v);
}
