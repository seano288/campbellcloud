// Teaching a calendar question: chant the week (or the year) along a strip of chips, lighting each one as it's said, then
// light the answer; or, for a Time Fact, say the fact. Each problem has one Lesson (keyed by its lifetime), which the
// question on screen reads.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import { createVoiceTask, toast, type VoiceScope } from '../voice';
import { DAYS, MONTHS, type FactLine, type QuizProblem, type QuizWord } from './calendar';

export interface QuizLesson {
  /** The strip being chanted along, with month numbers when they matter. */
  strip: Signal<{ kind: 'week' } | { kind: 'year'; numbers: boolean } | null>;
  /** The chip, or answer, being talked about. */
  lit: Signal<QuizWord | null>;
  /** The Time Fact being told. */
  fact: Signal<FactLine | null>;
  run: ReturnType<typeof createVoiceTask>;
}

const lessons = new WeakMap<AbortSignal, QuizLesson>();
export function quizLessonFor(lifetime: AbortSignal): QuizLesson {
  let l = lessons.get(lifetime);
  if (!l) {
    l = { strip: signal(null), lit: signal(null), fact: signal(null), run: createVoiceTask(lifetime) };
    lessons.set(lifetime, l);
  }
  return l;
}

export async function teachQuiz(p: QuizProblem, lesson: QuizLesson, voice: VoiceScope) {
  if (p.teach.kind === 'fact') {
    lesson.fact.value = p.teach.line;
    lesson.lit.value = p.answer;
    await voice.say(p.teach.line);
    return;
  }
  const week = p.teach.kind === 'week', names: readonly QuizWord[] = week ? DAYS : MONTHS;
  lesson.strip.value = p.teach;
  lesson.lit.value = null;
  await voice.say(week ? "Let's say the days of the week." : "Let's say the months of the year.");
  for (const [i, name] of names.entries()) {
    if (!voice.active) return;
    lesson.lit.value = name;
    sCount(i + 1);
    await voice.say(name);
  }
  if (!voice.active) return;
  lesson.lit.value = p.answer;
  await voice.say('So it is', p.answer);
}

/** He picked another answer. A first miss says try again; once help steps in, it teaches. */
export async function explainQuiz(p: QuizProblem, _answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = quizLessonFor(lifetime), voice = lesson.run.start();
  await toast(voice, 'Not quite!', 'Not quite!', ...(teach ? ["Let's look together." as const] : ['Try again!' as const]));
  if (teach && voice.active) await teachQuiz(p, lesson, voice);
}

/** 🔎 Help: the lesson for this question. */
export const helpQuiz = (p: QuizProblem, lifetime: AbortSignal) => {
  const lesson = quizLessonFor(lifetime);
  return teachQuiz(p, lesson, lesson.run.start());
};
