// Teaching a miss on the containers themselves, never with a red X.
//
// The first miss gets the brief's short lesson, on the picture, and "Try again!":
// - How Many Containers: the word is said slowly and one container drops for each beat. "Rab. Bit. Two."
// - Load the Ship: the containers lift into place one at a time, each one said, then the whole word at normal speed.
// - Split It: the word comes apart at its break, each half is read, the halves slide back together, and the reason is said in a short
//   line ("Two letters in the middle. Split between them.").
// - Read It: the word breaks into containers, each lights as it is read, then the right picture glows.
// - Bossy R: the vowel and its r light up together as one sound ("A and r say ar.").
// - Add-Ons: the add-on unbolts, the base word is read and the add-on's meaning is said ("Un means not. Unlock means not locked.").
// The second miss (or the first when he's been missing a lot, or 🔎) gets the fuller lesson: he taps each container in turn to hear it
// (the next one to tap pulses), then the word is said, then the short lesson, and the answer glows. His own answer is left to fix.
import { signal, type Signal } from '@preact/signals';
import { sClink, sCount } from '../../audio/sfx';
import type { Asking } from '../mix';
import { syl, type Phrase } from '../phrases';
import { ADD_ON_MEANS } from '../words/addons';
import { rSoundOf, rSpellingOf } from '../words/sounds';
import { createVoiceScope, type Item, type VoiceScope } from '../voice';
import { rightAnswer, type Question, type SplitWhy } from './problems';

/** A container in the lesson's row. */
export interface RowBox { readonly text: string; readonly lit?: boolean; readonly pulse?: boolean; readonly off?: boolean; readonly gap?: boolean }

export interface Lesson {
  /** The row of containers the lesson shows, or null. */
  readonly row: Signal<readonly RowBox[] | null>;
  /** Split It: the word drawn apart at its break. */
  readonly apart: Signal<boolean>;
  /** Bossy R: the letters lit as one sound, as [from, to) in the word. */
  readonly lit: Signal<readonly [number, number] | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  /** The container he must tap next, in the fuller lesson. */
  readonly tapNext: Signal<number | null>;
  tapped(i: number): void;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null, release: ((i: number) => void) | null = null;
    const tapNext = signal<number | null>(null);
    const cancel = () => { current?.cancel(); release?.(-1); };
    lesson = {
      row: signal(null), apart: signal(false), lit: signal(null), hint: signal(null), tapNext,
      tapped(i) { if (tapNext.peek() === i) { const r = release; release = null; r?.(i); } },
      task: { cancel, start() { cancel(); const v = createVoiceScope(lifetime); current = v; v.signal.addEventListener('abort', () => { tapNext.value = null; release?.(-1); release = null; }, { once: true }); return v; } },
    };
    (lesson as Lesson & { wait(v: VoiceScope, i: number): Promise<boolean> }).wait = (v, i) => new Promise<boolean>(resolve => {
      if (!v.active) return resolve(false);
      tapNext.value = i;
      release = k => { tapNext.value = null; resolve(k === i); };
    });
    lessons.set(lifetime, lesson);
  }
  return lesson;
}
const waitTap = (lesson: Lesson, v: VoiceScope, i: number) => (lesson as Lesson & { wait(v: VoiceScope, i: number): Promise<boolean> }).wait(v, i);

function reset(lesson: Lesson) { lesson.row.value = null; lesson.apart.value = false; lesson.lit.value = null; lesson.hint.value = null; lesson.tapNext.value = null; }
const NUMBERS: Record<number, Phrase> = { 1: 'One.', 2: 'Two.', 3: 'Three.', 4: 'Four.' };
const word = (w: string) => w as Phrase;

/** The fuller lesson's start: he taps each container to hear it, then hears the whole word. */
async function tapEach(q: Pick<Question, 'syls' | 'word'>, v: VoiceScope, lesson: Lesson, said = true) {
  const n = q.syls.length;
  lesson.row.value = q.syls.map(text => ({ text }));
  await v.say('Tap each container to hear it.');
  for (let i = 0; i < n && v.active; i++) {
    lesson.row.value = q.syls.map((text, j) => ({ text, lit: j < i, pulse: j === i }));
    if (!(await waitTap(lesson, v, i))) return;
    sClink();
    lesson.row.value = q.syls.map((text, j) => ({ text, lit: j <= i }));
    await v.say(syl(q.syls[i]!));
  }
  if (said && v.active) { await v.wait(250); await v.say(word(q.word)); }
}

/** Says the syllables one at a time as each container lights (or drops in), then the word. */
async function readOut(q: Pick<Question, 'syls' | 'word'>, v: VoiceScope, lesson: Lesson, drop: boolean, thenWord = true) {
  const n = q.syls.length;
  for (let i = 0; i < n && v.active; i++) {
    lesson.row.value = q.syls.map((text, j) => ({ text, lit: j === i, off: drop && j > i }));
    sCount(i);
    await v.say(syl(q.syls[i]!));
  }
  lesson.row.value = q.syls.map(text => ({ text, lit: true }));
  if (thenWord && v.active) { await v.wait(200); await v.say(word(q.word)); }
}

const SPLIT_LINES: Record<SplitWhy, Phrase[]> = {
  compound: ['Two small words.', 'Split between them.'],
  twin: ['Two letters the same in the middle.', 'Split between them.'],
  two: ['Two letters in the middle.', 'Split between them.'],
  le: ['The l e takes the letter before it.'],
  open: ['The first vowel says its name.', 'Split right after it.'],
  closed: ['The first vowel is short.', 'Keep the next letter with it.'],
  vowels: ['Two vowels that each say a sound.', 'Split between them.'],
};
const R_LINES = { ar: 'A and r say ar.', or: 'O and r say or.', er: 'E and r say er.', ir: 'I and r say er.', ur: 'U and r say er.' } as const satisfies Record<string, Phrase>;

/** Lights the bossy r in its syllable: where in the whole word its vowel and r are. */
function rSpot(q: Pick<Question, 'syls'>, i: number): [number, number] {
  const before = q.syls.slice(0, i).join('').length, s = q.syls[i]!, at = s.indexOf(rSpellingOf(s)!);
  return [before + at, before + at + 2];
}

/** `answered`: false for 🔎 before he has answered, when Read It (and Bossy R's reading) must not say the word. */
export async function lessonOf(p: Asking, _answer: string, full: boolean, v: VoiceScope, lesson: Lesson, answered = true) {
  const q = p.q;
  const secret = !answered && (q.kind === 'read' || (q.kind === 'r' && q.form === 'read'));
  if (full) await tapEach(q.kind === 'addon' ? { syls: q.syls, word: q.word } : q, v, lesson, q.kind !== 'count' && !secret);
  if (!v.active) return;
  switch (q.kind) {
    case 'count': {
      await readOut(q, v, lesson, true, false);
      await v.say(NUMBERS[q.syls.length]!);
      lesson.hint.value = rightAnswer(q);
      return;
    }
    case 'build': {
      await readOut(q, v, lesson, true);
      // the ship comes back for him to load, its first container glowing
      lesson.row.value = null;
      lesson.hint.value = q.syls[0]!;
      return;
    }
    case 'split': {
      lesson.apart.value = true;
      await readOut(q, v, lesson, false, false);
      await v.say(...SPLIT_LINES[q.why]);
      lesson.apart.value = false;
      // the word comes back (its cuts are where he answers), with the right cut glowing
      lesson.row.value = null;
      lesson.hint.value = rightAnswer(q);
      return;
    }
    case 'read': {
      await readOut(q, v, lesson, false, !secret);
      if (!secret) lesson.hint.value = q.word;
      return;
    }
    case 'r': {
      const i = q.form === 'gap' ? q.gap : q.syls.findIndex(s => rSoundOf(s));
      const spelling = rSpellingOf(q.syls[i]!)!;
      lesson.lit.value = rSpot(q, i);
      lesson.row.value = q.syls.map((text, j) => ({ text, lit: j === i }));
      sCount(1);
      await v.say(R_LINES[spelling as keyof typeof R_LINES]);
      if (q.form === 'gap' && !full) await v.say(syl(q.syls[i]!), word(q.word));
      else await readOut(q, v, lesson, false, !secret);
      if (q.form === 'build') lesson.row.value = null;
      if (!secret) lesson.hint.value = q.form === 'build' ? q.syls[0]! : rightAnswer(q);
      return;
    }
    case 'addon': {
      const a = q.add, front = a.add === 'un' || a.add === 're';
      // the add-on unbolts from the word
      lesson.row.value = q.syls.map((text, j) => ({ text, lit: (front ? j === 0 : j === 1), gap: true }));
      sCount(1);
      if (q.form === 'compare') {
        await v.say(ADD_ON_MEANS[a.add]);
        lesson.hint.value = rightAnswer(q);
        await v.say('This one is the', word(a.word));
        return;
      }
      await v.say(word(a.base));
      await v.say(ADD_ON_MEANS[a.add]);
      lesson.row.value = q.syls.map(text => ({ text, lit: true }));
      if (q.form === 'hide') { lesson.hint.value = a.base; await v.say(word(a.base), 'is hiding in', word(a.word)); return; }
      await v.say(word(a.word), 'means', a.means as Phrase);
      lesson.hint.value = rightAnswer(q);
      return;
    }
  }
}

/** A miss: the short lesson first, the fuller one on the second miss. `lifetime` is the question's own, so the lesson lands on the picture
 *  the view draws. The hint glows until he answers. */
export async function explain(p: Asking, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await v.say(teach ? "Let's look together." : 'Not quite!');
  await lessonOf(p, answer, teach, v, lesson);
  if (v.active) await v.say('Try again!');
}

/** 🔎 runs the whole lesson. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await lessonOf(p, '', true, v, lesson, false);
}
export type { Item };
