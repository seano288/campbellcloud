// What each Game Mode says after a miss. A first miss says what went wrong; once help steps in (the second miss, or the
// first when he's been struggling) it teaches the right time on the clock, lighting the hands as it goes.
import type { ChoiceProblem, SetProblem } from '../learning';
import { toast } from '../voice';
import { timePhrase } from './speech';
import { clearLesson, lessonFor, teachTime } from './teach';
import { parseDigital, sameTime, type ClockTime } from './time';

/** Find the Clock: he tapped a clock showing another time. */
export async function explainFind(p: ChoiceProblem, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start(), wrong = parseDigital(answer);
  if (!teach) {
    lesson.pick.value = p.choices.findIndex(c => wrong && sameTime(c, wrong));
    if (wrong) await voice.say('That clock says', timePhrase(wrong), 'Try again!');
    if (voice.active) clearLesson(lesson);
    return;
  }
  await toast(voice, 'Not quite!', 'Not quite!', "Let's look together.");
  if (!voice.active) return;
  lesson.pick.value = p.choices.findIndex(c => sameTime(c, p.target));
  await voice.say('This clock says', timePhrase(p.target));
  await teachTime(p.target, lesson, voice);
}

/** Read the Clock: he picked the wrong written time. */
export async function explainChoice(p: ChoiceProblem, _answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start();
  await toast(voice, 'Not quite!', 'Not quite!', ...(teach ? ["Let's look together." as const] : ['Try again!' as const]));
  if (teach && voice.active) await teachTime(p.target, lesson, voice);
}

/** Set the Clock: the hands show another time. Teaching moves the hands to the right time and explains it. */
export async function explainSet(p: SetProblem, answer: ClockTime, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.run.start();
  await voice.say('Your clock says', timePhrase(answer));
  if (!voice.active) return;
  if (!teach) { await voice.say('Try again!'); return; }
  await voice.say("Let's look together.");
  if (!voice.active) return;
  lesson.show.value = p.target;
  await voice.wait(700);
  await teachTime(p.target, lesson, voice);
}
