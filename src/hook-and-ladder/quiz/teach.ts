// Teaching a miss, never with a red X: the lesson shows why on the words and pictures themselves, and says it.
//
// - Two Words, One Word: the two halves slide together and become the compound's picture while the three words are said: "fire.
//   truck. fire truck." At Level 2 the word comes apart at the right place; at Level 3 the wrong half is tried ("rain dog is not a
//   word") and then the right one goes in.
// - Opposites: both pictures (or words) side by side, the two words said one after the other.
// - Sort It: the things that belong move into one box, and the group is named: "These are all animals. shoe is not an animal."
// - Endings: the ending is a separate tile that joins the word, and the picture changes to match (one dog becomes two; the jump is
//   shown finished, or happening, or every day).
// - Strong Words: the words sit on a bar that grows from small to big, each said in a matching voice size, quiet to loud.
// A second miss (or the first, when he's been missing a lot) says a little more and leaves the answer glowing. 🔎 runs that fuller
// lesson and counts as help.
import { signal, type Signal } from '@preact/signals';
import { sChime, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { groupLine, notLine, wordPhrase, type Phrase } from '../phrases';
import { createVoiceScope, voiceSize, type VoiceScope } from '../voice';
import { FACTS } from '../words/sorting';
import { SCALES } from '../words/strong';
import { compound, groupOf, SEP, type Question } from './problems';

export type Show =
  /** Two Words: the halves sliding together (`joined`: they've become the compound). */
  | { kind: 'join'; joined: boolean; tried?: string }
  /** Opposites: the word and its opposite side by side. */
  | { kind: 'pair' }
  /** Sort It: the things that belong, in their box. */
  | { kind: 'box'; items: readonly string[] }
  /** Endings: the word with its ending tile (`on`: joined). */
  | { kind: 'ending'; on: boolean }
  /** Strong Words: the bar, with this many of its words shown so far, weakest first. */
  | { kind: 'bar'; words: readonly string[]; n: number };

export interface Lesson {
  readonly show: Signal<Show | null>;
  /** The answer, left glowing after a fuller lesson. */
  readonly glow: Signal<string | null>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => { current?.cancel(); voiceSize(1); };
    lesson = { show: signal(null), glow: signal(null), task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } } };
    lifetime.addEventListener('abort', () => voiceSize(1), { once: true });
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
const w = wordPhrase;

/** The line for an ending: what it says about when, or how many. */
export const endingLine = (ending: string, n = 2): Phrase =>
  ending === 'ed' ? 'It already happened.' : ending === 'ing' ? 'It is happening now.' : ending === 's' && n === 0 ? 'It happens every day.' : n === 1 ? 'Just one.' : 'More than one.';

/** Says the words of a Strong Words set weakest first, each a little louder, as the bar grows. */
async function bar(words: readonly string[], l: Lesson, v: VoiceScope) {
  l.show.value = { kind: 'bar', words, n: 0 };
  for (let i = 0; i < words.length && v.active; i++) {
    l.show.value = { kind: 'bar', words, n: i + 1 };
    sCount(i + 1);
    voiceSize(words.length === 2 ? (i ? 1 : 0.4) : [0.3, 0.6, 1][i]!);
    await v.say(w(words[i]!));
    voiceSize(1);
    await beat(v, 150);
  }
  voiceSize(1);
}

async function teach(q: Question, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  if (q.kind === 'join') {
    const c = compound(q.word);
    if (q.form === 'half' && answer && answer !== c.b) {
      l.show.value = { kind: 'join', joined: false, tried: answer };
      await v.say(w(c.a), w(answer), 'is not a word.');
      if (!v.active) return;
    }
    l.show.value = { kind: 'join', joined: false };
    if (full) await v.say('Two words make one word!');
    await v.say(w(c.a), w(c.b));
    if (!v.active) return;
    l.show.value = { kind: 'join', joined: true };
    sChime();
    await v.say(q.form === 'split' ? 'It splits here.' : w(c.word));
    if (q.form !== 'split' && full && v.active) await v.say(w(c.a), 'and', w(c.b), 'make', w(c.word));
  } else if (q.kind === 'opposite') {
    l.show.value = { kind: 'pair' };
    sChime();
    await v.say(w(q.word), w(q.answer));
    if (full && v.active) await v.say(w(q.word), 'and', w(q.answer), 'are opposites.');
  } else if (q.kind === 'sort') {
    if (q.form === 'fact') {
      const f = FACTS[q.fact]!;
      l.glow.value = q.answer;
      sChime();
      await v.say(w(q.answer), f.says as Phrase);
      if (!full) l.glow.value = null;
      return;
    }
    const g = q.group, ins = q.form === 'name' ? q.items : q.items.filter(x => groupOf(x) === g);
    l.show.value = { kind: 'box', items: ins };
    sChime();
    await v.say(groupLine(g));
    // name the one that doesn't belong: the odd one, or one he picked that isn't in the group
    const odd = q.form === 'odd' ? q.answer : q.form === 'all' ? answer.split(SEP).find(x => x && groupOf(x) !== g) : undefined;
    if (odd && v.active) await v.say(w(odd), notLine(g));
  } else if (q.kind === 'ending') {
    l.show.value = { kind: 'ending', on: false };
    await v.say(w(q.word));
    if (!v.active) return;
    l.show.value = { kind: 'ending', on: true };
    sChime();
    if (q.form === 'count') await v.say(endingLine('s', q.n), w(q.answer));
    else if (q.form === 'frame') await v.say(w(q.answer), endingLine(q.answer.endsWith('ed') ? 'ed' : q.answer.endsWith('ing') ? 'ing' : 's', 0));
    else await v.say(w(q.shown), 'has', w(q.word), 'hiding in it.');
  } else {
    const words = q.form === 'pair' ? [q.answer === q.words[0] ? q.words[1]! : q.words[0]!, q.answer] : [...SCALES[q.scale]!.words];
    await v.say('From a little to a lot!');
    if (!v.active) return;
    await bar(words, l, v);
    if (q.form === 'pair' && full && v.active) await v.say(w(q.answer), 'is', q.more as Phrase, 'than', w(words[0]!));
  }
  if (full && v.active) l.glow.value = q.kind === 'strong' && q.form === 'order' ? null : q.answer;
}

/** What the round engine runs after a miss, before he can try again. */
export async function explain(p: Asking, answer: string, full: boolean, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null;
  await v.say(full ? "Let's look together." : 'Not quite!');
  if (!v.active) return;
  await teach(p.q, answer, full, l, v);
  if (!v.active) return;
  await beat(v, 300);
  // the picture goes back so he can answer, unless it shows the answer he needs (Endings and Opposites leave theirs)
  if (p.q.kind === 'join' || p.q.kind === 'sort') l.show.value = null;
  if (v.active) await v.say('Try again!');
}

/** 🔎: the fuller lesson without a miss, which counts as help. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null;
  await teach(p.q, '', true, l, v);
}
