// Teaching a miss on the letter itself, never with a red X.
//
// The first miss gets the brief's short lesson, and "Try again!":
// - Read the Mail, Fact File and every detail question: the sentence that holds the answer lights up and is read aloud, and then the
//   answer is said with it: "It says: Sam put the box in the dome. So the box is in the dome." A labelled part glows; for "Does the
//   report say this?" the sentence is read, or "The report does not say that."
// - What Came Next: the story plays in order, one picture or sentence at a time, with "First", "Next", "Then" and "Last" said.
// - Big Idea: each sentence lights in turn and points at the same idea: "This one is about the plants. This one too. And this one. So
//   the letter is about the plants." The one that does not belong: "But not this one!"
// - Clue Finder: the clue words light up one at a time and are said, then the thinking: "Helmet. Big boots. You put those on to go
//   outside."
// The second miss (or the first when he has been missing a lot) gets the fuller lesson: the whole letter read aloud with each word lighting
// as it is said, then the short lesson, and then the question again. His answer is left to try again.
import { signal, type Signal } from '@preact/signals';
import type { Asking } from '../mix';
import { said, type Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { letterOf, questionOf } from './problems';
import { wordsOf } from '../mail/words';

export interface Lesson {
  /** Sentences lit (by number in the letter). */
  readonly lit: Signal<readonly number[]>;
  /** In the fuller lesson, the word being said: its sentence and its place. */
  readonly word: Signal<{ line: number; at: number } | null>;
  /** Clue Finder: the clue being said, lit wherever it is in the letter. */
  readonly clue: Signal<string | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** What Came Next: the story shown in its right order, up to this many. */
  readonly ordered: Signal<number | null>;
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let l = lessons.get(lifetime);
  if (!l) { l = { lit: signal([]), word: signal(null), clue: signal(null), hint: signal(null), ordered: signal(null) }; lessons.set(lifetime, l); }
  return l;
}

/** Whether he had any of this question read to him (Sentence Express's rule: that answer is helped). Kept per question. */
const heardOn = new WeakSet<AbortSignal>();
export const markListened = (lifetime: AbortSignal) => heardOn.add(lifetime);
export const listened = (lifetime: AbortSignal) => heardOn.has(lifetime);

const ORDER_WORDS: Phrase[] = ['First,', 'Next,', 'Then,', 'Last,'];
/** How the order lesson names the nth of n. */
export const orderWord = (i: number, n: number): Phrase => (i === 0 ? 'First,' : i === n - 1 ? 'Last,' : i === 1 ? 'Next,' : 'Then,');

/** A sentence said with each word lighting in turn (the clip's length is shared out by the words' letters). */
async function readAlong(v: VoiceScope, lesson: Lesson, line: number, text: string) {
  const words = wordsOf(text), weights = words.map(w => w.length + 2), total = weights.reduce((a, b) => a + b, 0);
  const perLetter = 0.062 * 1000, start = performance.now();
  let stop = false;
  const tick = () => {
    if (stop || !v.active) return;
    const t = (performance.now() - start) / perLetter;
    let acc = 0, at = words.length - 1;
    for (let i = 0; i < weights.length; i++) { acc += weights[i]!; if (t < acc) { at = i; break; } }
    lesson.word.value = { line, at };
    requestAnimationFrame(tick);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tick);
  await v.say(said(text));
  stop = true;
  lesson.word.value = total ? { line, at: words.length - 1 } : null;
  await v.wait(150);
  lesson.word.value = null;
}

/** The lesson's lines, as data, so the tests can check every one is recorded and the order lesson says the story in order. */
export type Step = { say: Phrase[]; lit?: number[]; clue?: string; hint?: string; ordered?: number };
export function shortLesson(p: Asking): Step[] {
  const q = p.q, letter = letterOf(q), qq = questionOf(q), steps: Step[] = [];
  if (letter.kind === 'order') {
    steps.push({ say: ["Let's put it in order."] });
    // a Level 3 line already starts with its word ("First, Kit got a pot of dirt."), so it is not said twice
    letter.lines.forEach((line, i) => {
      const word = orderWord(i, letter.lines.length);
      steps.push({ say: line.startsWith(word) ? [said(line)] : [word, said(line)], lit: [i], ordered: i + 1 });
    });
    steps.push({ say: [], hint: qq.right });
    return steps;
  }
  if (letter.kind === 'main' && letter.topic && !qq.so) {
    const about = qq.form === 'line' ? letter.lines.map((_, i) => i).filter(i => i !== letter.odd) : qq.at;
    about.forEach((i, k) => steps.push({ say: k === 0 ? ['This one is about', said(letter.topic!)] : k === about.length - 1 ? ['And this one.'] : ['This one too.'], lit: [i] }));
    if (letter.odd !== undefined && qq.form === 'line') steps.push({ say: ['But not this one!'], lit: [letter.odd], hint: qq.right });
    else steps.push({ say: ['So the letter is about', said(letter.topic)], lit: [...about], hint: qq.right });
    return steps;
  }
  if (qq.clues) {
    steps.push({ say: ['Look for the clues.'] });
    for (const c of qq.clues) steps.push({ say: [said(c)], clue: c });
    steps.push({ say: [said(qq.think!)], hint: qq.right });
    return steps;
  }
  if (qq.form === 'yn' && !qq.at.length) return [{ say: ['The report does not say that.'], hint: qq.right }];
  for (const i of qq.at) steps.push({ say: ['It says:', said(letter.lines[i]!)], lit: [i] });
  if (qq.form === 'yn') steps.push({ say: [qq.right === 'yes' ? 'The report says so.' : 'The report says it is not so.'], hint: qq.right, lit: [...qq.at] });
  else steps.push({ say: qq.so ? [said(qq.so)] : [], hint: qq.right, lit: [...qq.at] });
  return steps;
}

export async function explain(p: Asking, _answer: string, teach: boolean, signal: AbortSignal) {
  const v = createVoiceScope(signal), lesson = lessonFor(signal);
  const reset = () => { lesson.lit.value = []; lesson.word.value = null; lesson.clue.value = null; lesson.ordered.value = null; };
  reset();
  lesson.hint.value = null;
  await v.say('Not quite!');
  if (teach) {
    // the fuller lesson: the whole letter, read along
    await v.say("Let's read it together.");
    const letter = letterOf(p.q), order = letter.kind === 'order' && !letter.pics ? letter.lines.map((_, i) => i) : p.q.shown;
    for (const i of order) { if (!v.active) return; lesson.lit.value = [i]; await readAlong(v, lesson, i, letter.lines[i]!); }
    reset();
  }
  for (const s of shortLesson(p)) {
    if (!v.active) return;
    if (s.lit) lesson.lit.value = s.lit;
    if (s.clue !== undefined) lesson.clue.value = s.clue;
    if (s.ordered !== undefined) lesson.ordered.value = s.ordered;
    if (s.hint !== undefined) lesson.hint.value = s.hint;
    if (s.say.length) await v.say(...s.say);
    await v.wait(250);
  }
  lesson.clue.value = null;
  if (teach && v.active) { await v.say('Listen again.'); await v.say(said(questionOf(p.q).ask)); }
  if (v.active) await v.say('Try again!');
  lesson.ordered.value = null;
}

/** Every line a lesson can say for this question (the tests check each is recorded). */
export const lessonClips = (p: Asking): Phrase[] => [
  'Not quite!', "Let's read it together.", 'Listen again.', said(questionOf(p.q).ask), 'Try again!',
  ...letterOf(p.q).lines.map(said), ...shortLesson(p).flatMap(s => s.say), ...ORDER_WORDS,
];
