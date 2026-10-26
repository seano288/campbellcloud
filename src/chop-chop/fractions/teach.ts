// Teaching each kind of fraction question. The voice walks through the picture while the pieces it talks about glow, get
// counted with a number on each, or fill with crayon: "Let's count the pieces. One, two, three, four. Four equal pieces
// are quarters. So one piece is one quarter." Each problem has one Lesson (keyed by its lifetime), which the question
// on screen reads. A first miss says what went wrong; once help steps in (the second miss, or the first when he's been
// struggling) it teaches. Before any of that, each new word is met (teachMeet): shown on a food before it's asked, and so
// is writing a part with numbers (teachMeetWriting), before the first Top and Bottom question.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import { createVoiceTask, toast, type VoiceScope } from '../voice';
import {
  bigger, coloredLine, cutEachInHalf, cutInto, eachGets, friendsNeed, HALF_OF, isBigger, isSame, makeTheWhole, means, MEET_CUTS, numberPhrase,
  numbersSay, onePieceIs, parseKey, partOf, piecesAre, platesLine, same, thatOne, thisShows, thoseSay, unit, wholeFood, writeLike, youGet, type Frac,
} from './fraction';
import {
  piecesFor, type BiggerProblem, type ColorProblem, type FairProblem, type FindProblem, type MeetProblem, type MeetWritingProblem, type NameProblem,
  type ShareProblem, type WriteProblem,
} from './problems';

export interface Lesson {
  /** Which of several pictures is being talked about. */
  pick: Signal<number | null>;
  /** Pieces glowing (of the picked picture, or the only one). */
  lit: Signal<readonly number[]>;
  /** Numbers on the pieces while they're counted. */
  labels: Signal<Record<number, string> | null>;
  /** Color the Part: how many pieces teaching has coloured in. */
  show: Signal<number | null>;
  /** Bigger Piece at Level 3: the pictures appear while it's taught. */
  reveal: Signal<boolean>;
  /** Share It: how many cookies have been dealt onto the plates. */
  dealt: Signal<number>;
  /** Meeting a word: how many pieces the food has been cut into so far. */
  cut: Signal<number>;
  /** Written numbers: which of them glows while it's talked about. */
  mark: Signal<Mark>;
  run: ReturnType<typeof createVoiceTask>;
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let l = lessons.get(lifetime);
  if (!l) {
    l = { pick: signal(null), lit: signal([]), labels: signal(null), show: signal(null), reveal: signal(false), dealt: signal(0), cut: signal(1), mark: signal(null), run: createVoiceTask(lifetime) };
    lessons.set(lifetime, l);
  }
  return l;
}
export function clearLesson(l: Lesson) { l.pick.value = null; l.lit.value = []; l.labels.value = null; l.mark.value = null; }
export type Mark = 'top' | 'bottom' | 'both' | null;

const all = (n: number) => Array.from({ length: n }, (_, i) => i);
type Line = Parameters<VoiceScope['say']>[number];
async function step(voice: VoiceScope, run: () => void, ...lines: Line[]) {
  if (!voice.active) return;
  run();
  await voice.say(...lines);
}
/** Counts the pieces aloud, a number appearing on each as it's said. */
async function count(lesson: Lesson, voice: VoiceScope, pieces: readonly number[]) {
  const labels: Record<number, string> = {};
  for (const [k, i] of pieces.entries()) {
    if (!voice.active) return;
    labels[i] = String(k + 1);
    lesson.labels.value = { ...labels };
    lesson.lit.value = [i];
    sCount(k + 1);
    await voice.say(numberPhrase(k + 1));
  }
}

// ---------- Meeting a new word ----------

/**
 * "A new word! Look! A whole pizza. The pizza is cut into two equal pieces. Two equal pieces are halves. Now cut each
 * half in half! The pizza is cut into four equal pieces. Let's count the pieces. One, two, three, four. Four equal pieces
 * are quarters. So one piece is one quarter. Half of a half is one quarter! Four quarters make the whole pizza!"
 */
export async function teachMeet(p: MeetProblem, lesson: Lesson, voice: VoiceScope) {
  clearLesson(lesson);
  await step(voice, () => { lesson.cut.value = 1; }, 'A new word!', wholeFood(p.food));
  const cuts = MEET_CUTS[p.d];
  for (const [i, d] of cuts.entries()) {
    if (i > 0) await step(voice, () => { lesson.lit.value = []; }, cutEachInHalf(cuts[i - 1] as 2 | 3 | 4));
    await step(voice, () => { lesson.cut.value = d; lesson.lit.value = []; lesson.labels.value = null; }, cutInto(p.food, d));
    if (d !== p.d) { await step(voice, () => { lesson.lit.value = all(d); }, piecesAre(d)); continue; } // on the way to the new word
    await voice.say("Let's count the pieces.");
    await count(lesson, voice, all(d));
    await step(voice, () => { lesson.labels.value = null; lesson.lit.value = all(d); }, piecesAre(d));
    await step(voice, () => { lesson.lit.value = [0]; }, onePieceIs(d), ...(p.d in HALF_OF ? [HALF_OF[p.d as keyof typeof HALF_OF]] : []));
    await step(voice, () => { lesson.lit.value = all(d); }, makeTheWhole(d, p.food));
  }
  if (voice.active) clearLesson(lesson);
}

// ---------- Meeting writing ----------

/** The bottom number counted as the pieces, the top as the pieces left; then what the numbers say. */
async function readNumbers(f: Frac, lesson: Lesson, voice: VoiceScope) {
  await step(voice, () => { lesson.mark.value = 'bottom'; lesson.lit.value = []; }, 'The bottom number says how many equal pieces.');
  await count(lesson, voice, all(f.d));
  await step(voice, () => { lesson.mark.value = 'top'; lesson.labels.value = null; lesson.lit.value = []; }, 'The top number says how many pieces are left.');
  await count(lesson, voice, all(f.n));
  await step(voice, () => { lesson.mark.value = 'both'; lesson.labels.value = null; lesson.lit.value = all(f.n); }, numbersSay(f));
}

/**
 * "A new way to write it! This one has one quarter left! We write one quarter like this. The bottom number says how many
 * equal pieces. One, two, three, four. The top number says how many pieces are left. One. These numbers say one quarter!"
 */
export async function teachMeetWriting(p: MeetWritingProblem, lesson: Lesson, voice: VoiceScope) {
  const f = unit(p.d);
  clearLesson(lesson);
  lesson.reveal.value = false;
  await step(voice, () => { lesson.lit.value = [0]; }, 'A new way to write it!', thisShows(f));
  await step(voice, () => { lesson.reveal.value = true; lesson.lit.value = []; lesson.mark.value = 'both'; }, writeLike(f));
  await readNumbers(f, lesson, voice);
  if (voice.active) clearLesson(lesson);
}

// ---------- Top and Bottom ----------

/** The right numbers glow (or, when he's finding the food, the right food), and are read from the picture. */
export async function teachWrite(p: WriteProblem, lesson: Lesson, voice: VoiceScope) {
  lesson.pick.value = p.choices.findIndex(c => same(c, p.target));
  await readNumbers(p.target, lesson, voice);
}
export async function explainWrite(p: WriteProblem, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start(), wrong = parseKey(answer);
  if (!teach && wrong) {
    const i = p.choices.findIndex(c => same(c, wrong));
    if (p.read) await step(voice, () => { lesson.pick.value = i; lesson.mark.value = 'both'; }, thoseSay(wrong), 'Try again!');
    else await step(voice, () => { lesson.pick.value = i; lesson.lit.value = all(wrong.n); }, thatOne(wrong), 'Try again!');
    if (voice.active) clearLesson(lesson);
    return;
  }
  await toast(voice, 'Not quite!', 'Not quite!', "Let's look together.");
  if (voice.active) { clearLesson(lesson); await teachWrite(p, lesson, voice); }
}

// ---------- Fair Shares ----------

export async function teachFair(p: FairProblem, lesson: Lesson, voice: VoiceScope) {
  await voice.say('Equal pieces are all the same size.');
  const unfair = p.pictures.findIndex((_, i) => i !== p.answer);
  await step(voice, () => { lesson.pick.value = unfair; lesson.lit.value = all(p.pictures[unfair]!.pieces.length); }, 'These pieces are not the same size.');
  await step(voice, () => { lesson.pick.value = p.answer; lesson.lit.value = all(p.pictures[p.answer]!.pieces.length); }, 'These pieces are all the same size!');
}
export async function explainFair(p: FairProblem, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start(), wrong = Number(answer);
  if (!teach) {
    await step(voice, () => { lesson.pick.value = wrong; lesson.lit.value = all(p.pictures[wrong]!.pieces.length); }, 'These pieces are not the same size.', 'Try again!');
    if (voice.active) clearLesson(lesson);
    return;
  }
  await toast(voice, 'Not quite!', 'Not quite!', "Let's look together.");
  if (voice.active) await teachFair(p, lesson, voice);
}

// ---------- Name the Piece ----------

export async function teachName(p: NameProblem, lesson: Lesson, voice: VoiceScope) {
  await voice.say(cutInto(p.picture.food, p.d), "Let's count the pieces.");
  await count(lesson, voice, all(p.d));
  await step(voice, () => { lesson.lit.value = all(p.d); }, piecesAre(p.d));
  await step(voice, () => { lesson.labels.value = null; lesson.lit.value = [0]; }, onePieceIs(p.d));
}

// ---------- Find the Part ----------

export async function teachFind(p: FindProblem, lesson: Lesson, voice: VoiceScope) {
  const i = p.choices.findIndex(c => same(c, p.target));
  await step(voice, () => { lesson.pick.value = i; lesson.lit.value = []; }, means(p.target));
  await count(lesson, voice, all(p.target.d));
  await step(voice, () => { lesson.labels.value = null; lesson.lit.value = all(p.target.n); }, thisShows(p.target));
}
export async function explainFind(p: FindProblem, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start(), wrong = parseKey(answer);
  if (!teach && wrong) {
    await step(voice, () => { lesson.pick.value = p.choices.findIndex(c => same(c, wrong)); lesson.lit.value = all(wrong.n); }, thatOne(wrong), 'Try again!');
    if (voice.active) clearLesson(lesson);
    return;
  }
  await toast(voice, 'Not quite!', 'Not quite!', "Let's look together.");
  if (voice.active) await teachFind(p, lesson, voice);
}

// ---------- Color the Part ----------

export async function teachColor(p: ColorProblem, lesson: Lesson, voice: VoiceScope) {
  const k = piecesFor(p);
  await step(voice, () => { lesson.show.value = 0; }, means(p.target));
  await voice.say(partOf(p.target, p.d));
  for (let i = 1; i <= k; i++) { // colour them in one by one, counting
    if (!voice.active) return;
    lesson.show.value = i;
    lesson.labels.value = Object.fromEntries(all(i).map(j => [j, String(j + 1)]));
    sCount(i);
    await voice.say(numberPhrase(i));
  }
  if (voice.active) lesson.labels.value = null;
}
export async function explainColor(p: ColorProblem, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start(), shown = parseKey(answer);
  if (shown) await voice.say(coloredLine(shown.n, p.d));
  if (!voice.active) return;
  if (!teach) { await voice.say('Try again!'); return; }
  await voice.say("Let's look together.");
  if (voice.active) await teachColor(p, lesson, voice);
}

// ---------- Bigger Piece ----------

export async function teachBigger(p: BiggerProblem, lesson: Lesson, voice: VoiceScope) {
  lesson.reveal.value = true;
  const look = (i: 0 | 1, f: Frac, ...lines: Line[]) => step(voice, () => { lesson.pick.value = i; lesson.lit.value = all(f.n); }, ...lines);
  if (same(p.a, p.b)) {
    await look(0, p.a, means(p.a));
    await look(1, p.b, means(p.b));
    await step(voice, () => { lesson.pick.value = null; }, 'They are the same!', isSame(p.a, p.b));
    return;
  }
  const big = bigger(p.a, p.b) ? p.a : p.b, at = big === p.a ? 0 : 1;
  if (p.a.n === 1 && p.b.n === 1) {
    await look(0, p.a, cutInto(p.food, p.a.d));
    await look(1, p.b, cutInto(p.food, p.b.d));
    await voice.say('More pieces means smaller pieces!');
  } else {
    await look(0, p.a, means(p.a));
    await look(1, p.b, means(p.b));
  }
  await look(at, big, isBigger(big));
}

// ---------- Share It ----------

export async function teachShare(p: ShareProblem, lesson: Lesson, voice: VoiceScope) {
  if ('friends' in p) {
    lesson.reveal.value = true;
    await voice.say('One piece for each friend!');
    await count(lesson, voice, all(p.friends));
    await step(voice, () => { lesson.labels.value = null; lesson.lit.value = all(p.friends); }, friendsNeed(p.friends));
    return;
  }
  await step(voice, () => { lesson.dealt.value = 0; }, platesLine(p.d));
  for (let i = 1; i <= p.total; i++) { // one cookie onto each plate in turn
    if (!voice.active) return;
    lesson.dealt.value = i;
    sCount(((i - 1) % p.d) + 1);
    await voice.wait(380);
  }
  if (voice.active) lesson.lit.value = [0];
  await voice.say(eachGets(p.answer), youGet(p.answer));
}

/** A miss on a question answered by tapping one of several words or numbers: try again, or teach. */
export const explainWith = <P>(teachIt: (p: P, lesson: Lesson, voice: VoiceScope) => Promise<void>) =>
  async (p: P, _answer: string, teach: boolean, lifetime: AbortSignal) => {
    const lesson = lessonFor(lifetime), voice = lesson.run.start();
    await toast(voice, 'Not quite!', 'Not quite!', ...(teach ? ["Let's look together." as const] : ['Try again!' as const]));
    if (teach && voice.active) await teachIt(p, lesson, voice);
  };
export const explainName = explainWith(teachName);
export const explainBigger = explainWith(teachBigger);
export const explainShare = explainWith(teachShare);

/** 🔎 Help: the lesson for this question. */
export const helpWith = <P>(teachIt: (p: P, lesson: Lesson, voice: VoiceScope) => Promise<void>) => (p: P, lifetime: AbortSignal) => {
  const lesson = lessonFor(lifetime);
  clearLesson(lesson);
  return teachIt(p, lesson, lesson.run.start());
};
