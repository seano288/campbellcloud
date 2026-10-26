// Teaching sight words. A first miss says what he tapped ("That one says saw.") and lets him try again; once help steps in
// (the second miss, or the first when he's been struggling, or 🔎) it teaches the word the way teachers do: "This one says
// said. Say it, spell it, say it! said. S, A, I, D. said!", each letter lighting up as it's named in a big panel, then the
// heart part if it has one ("The heart part is tricky. Learn it by heart!", a heart over the tricky letters), and then
// the right answer in the question lights up. Each problem has one Lesson (keyed by its lifetime), which its view reads.
// Before any of that, each new word is met (teachMeet): shown, spelled and used in a sentence before it's asked.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import { findLine, huntLine, makeLine, meetLine, thatOne, thisOne } from '../phrases';
import { createVoiceTask, toast, type VoiceScope } from '../voice';
import { infoOf, isHeart, letterLine, type Word } from './list';
import { huntTargets, sentenceOf, type FillProblem, type HearProblem, type HuntProblem, type MeetProblem, type ReadProblem, type SentenceProblem, type SpellProblem } from './problems';
import { gapText } from './sentences';

export interface Panel {
  readonly word: Word;
  /** The letter being named, while it's spelled. */
  readonly letter: number | null;
  /** The heart over the tricky letters. */
  readonly heart: boolean;
}
export interface Lesson {
  /** The big word being taught, letter by letter. */
  panel: Signal<Panel | null>;
  /** Which choices, cards or words of the sentence glow yellow: the right answer, or the word being met. */
  lit: Signal<readonly number[]>;
  /** The miss being named ("That one says who."): ringed in orange, the colour for "being read aloud", never yellow. */
  named: Signal<readonly number[]>;
  /** Meeting a word: its sentence is showing. */
  sentence: Signal<boolean>;
  run: ReturnType<typeof createVoiceTask>;
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let l = lessons.get(lifetime);
  if (!l) {
    l = { panel: signal(null), lit: signal([]), named: signal([]), sentence: signal(false), run: createVoiceTask(lifetime) };
    lessons.set(lifetime, l);
  }
  return l;
}
export function clearLesson(l: Lesson) { l.panel.value = null; l.lit.value = []; l.named.value = []; }

type Line = Parameters<VoiceScope['say']>[number];
async function step(voice: VoiceScope, run: () => void, ...lines: Line[]) {
  if (!voice.active) return;
  run();
  await voice.say(...lines);
}

/** "Say it, spell it, say it!": the word, each letter lit as it's named, the word again, and its heart part. */
export async function spellOut(w: Word, lesson: Lesson, voice: VoiceScope) {
  const panel = (p: Partial<Panel>) => { lesson.panel.value = { word: w, letter: null, heart: false, ...lesson.panel.peek(), ...p }; };
  await step(voice, () => panel({ letter: null, heart: false }), 'Say it, spell it, say it!', w);
  for (const [i, c] of [...w].entries()) {
    if (!voice.active) return;
    panel({ letter: i });
    sCount(i + 1);
    await voice.say(letterLine(c));
  }
  await step(voice, () => panel({ letter: null }), w);
  if (isHeart(w)) await step(voice, () => panel({ heart: true }), 'The heart part is tricky. Learn it by heart!');
}

/** Teaching a word in full, then lighting the right answer(s) while the question is asked again. */
async function teachWord(w: Word, lesson: Lesson, voice: VoiceScope, right: readonly number[], ask: Line) {
  clearLesson(lesson);
  await step(voice, () => { lesson.panel.value = { word: w, letter: null, heart: false }; }, thisOne(w));
  await spellOut(w, lesson, voice);
  if (!voice.active) return;
  await step(voice, () => { lesson.panel.value = null; lesson.lit.value = right; }, ask);
}

/** After a miss: what he tapped, then try again; or, once help steps in, the whole word taught. */
function explainer<P>(wrongWord: (p: P, answer: string) => Line[], target: (p: P) => Word, right: (p: P) => readonly number[], ask: (p: P) => Line, wrongAt?: (p: P, answer: string) => number | null) {
  return async (p: P, answer: string, teach: boolean, lifetime: AbortSignal) => {
    const lesson = lessonFor(lifetime), voice = lesson.run.start(), said = wrongWord(p, answer), at = wrongAt?.(p, answer) ?? null;
    if (!teach) {
      await step(voice, () => { lesson.named.value = at === null ? [] : [at]; }, ...said, 'Try again!');
      if (voice.active) clearLesson(lesson);
      return;
    }
    await toast(voice, 'Not quite!', 'Not quite!', "Let's look together.");
    if (voice.active) await teachWord(target(p), lesson, voice, right(p), ask(p));
  };
}
/** Help (🔎): the word taught in full without a miss first. */
export function helpWith<P>(target: (p: P) => Word, right: (p: P) => readonly number[], ask: (p: P) => Line) {
  return (p: P, lifetime: AbortSignal) => { const lesson = lessonFor(lifetime); return teachWord(target(p), lesson, lesson.run.start(), right(p), ask(p)); };
}

const choiceAt = (answer: string) => Number(answer);
const indexOfTarget = (p: { target: Word; choices: readonly Word[] }) => [p.choices.indexOf(p.target)];

// ---------- the six kinds ----------

export const hearHelp = { target: (p: HearProblem) => p.target, right: indexOfTarget, ask: (p: HearProblem) => findLine(p.target) };
export const explainHear = explainer<HearProblem>((p, a) => [thatOne(p.choices[choiceAt(a)]!)], hearHelp.target, hearHelp.right, hearHelp.ask, (_, a) => choiceAt(a));

export const readHelp = { target: (p: ReadProblem) => p.target, right: indexOfTarget, ask: (p: ReadProblem) => p.target };
export const explainRead = explainer<ReadProblem>((p, a) => [thatOne(p.choices[choiceAt(a)]!)], readHelp.target, readHelp.right, readHelp.ask, (_, a) => choiceAt(a));

export const fillHelp = { target: (p: FillProblem) => p.target, right: indexOfTarget, ask: (p: FillProblem) => p.sentence };
export const explainFill = explainer<FillProblem>((p, a) => [thatOne(p.choices[choiceAt(a)]!)], fillHelp.target, fillHelp.right, fillHelp.ask, (_, a) => choiceAt(a));

const lastTap = (a: string) => Number(a.split(',').at(-1));
export const huntHelp = { target: (p: HuntProblem) => p.target, right: huntTargets, ask: (p: HuntProblem) => huntLine(p.target) };
export const explainHunt = explainer<HuntProblem>((p, a) => [thatOne(p.cards[lastTap(a)]!.word)], huntHelp.target, huntHelp.right, huntHelp.ask, (_, a) => lastTap(a));

const targetToken = (p: SentenceProblem) => sentenceOf(p.sentence).tokens.flatMap((t, i) => (t.word === p.target ? [i] : []));
export const sentenceHelp = { target: (p: SentenceProblem) => p.target, right: targetToken, ask: (p: SentenceProblem) => findLine(p.target) };
export const explainSentence = explainer<SentenceProblem>((p, a) => [thatOne(sentenceOf(p.sentence).tokens[choiceAt(a)]!.word)], sentenceHelp.target, sentenceHelp.right, sentenceHelp.ask, (_, a) => choiceAt(a));

export const spellHelp = { target: (p: SpellProblem) => p.target, right: () => [], ask: (p: SpellProblem) => makeLine(p.target) };
export const explainSpell = explainer<SpellProblem>((_, a) => [letterLine(a.at(-1)!), 'Not that letter.'], spellHelp.target, spellHelp.right, spellHelp.ask);

/** The Fill the Gap question, said: "I see blank cat. Which word is missing?" */
export const fillAsk = (p: FillProblem): Line[] => [gapText(sentenceOf(p.sentence)), 'Which word is missing?'];

// ---------- Meeting a new word ----------

/** "A new word! This word is said. Say it, spell it, say it! ... The cat said yes." */
export async function teachMeet(p: MeetProblem, lesson: Lesson, voice: VoiceScope) {
  clearLesson(lesson);
  lesson.sentence.value = false;
  await step(voice, () => { lesson.panel.value = { word: p.target, letter: null, heart: false }; }, 'A new word!', meetLine(p.target));
  await spellOut(p.target, lesson, voice);
  if (p.sentence && voice.active) {
    const at = sentenceOf(p.sentence).tokens.flatMap((t, i) => (t.word === p.target ? [i] : []));
    await step(voice, () => { lesson.sentence.value = true; lesson.lit.value = at; }, p.sentence);
  }
}
export const heartLetters = (w: Word) => infoOf(w).heart;
