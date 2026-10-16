// Teaching a time: the voice walks through the hands while the clock lights each part it talks about. "The short hand
// shows the hour. The short hand is between the three and the four. So the hour is three. The long hand shows the
// minutes. The long hand points to the three. Count by fives! Five, ten, fifteen. So it is three fifteen."
// Each problem has one Lesson (keyed by its lifetime), which the clock on screen reads.
import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import { createVoiceTask, type VoiceScope } from '../voice';
import { FIVES, hourWord, timePhrase } from './speech';
import type { ClockTime } from './time';

export interface Lesson {
  /** The hand being talked about. */
  hand: Signal<'hour' | 'minute' | null>;
  /** Dial numbers lit up (1-12). */
  lit: Signal<readonly number[]>;
  /** How far round the dial he has counted by fives (0 = not counting): shows 5, 10, 15... outside the numbers. */
  fives: Signal<number>;
  /** Which of several clocks the lesson is about, when there are several. */
  pick: Signal<number | null>;
  /** Set the Clock: the time the hands are moved to while it's taught. */
  show: Signal<ClockTime | null>;
  run: ReturnType<typeof createVoiceTask>;
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let l = lessons.get(lifetime);
  if (!l) {
    l = { hand: signal(null), lit: signal([]), fives: signal(0), pick: signal(null), show: signal(null), run: createVoiceTask(lifetime) };
    lessons.set(lifetime, l);
  }
  return l;
}

export function clearLesson(l: Lesson) {
  l.hand.value = null; l.lit.value = []; l.fives.value = 0; l.pick.value = null;
}

const nextHour = (h: number) => (h % 12) + 1;

/** Walks through how to read this time on the clock, lighting each part as it's said. */
export async function teachTime(t: ClockTime, lesson: Lesson, voice: VoiceScope) {
  const step = async (run: () => void, ...lines: Parameters<VoiceScope['say']>) => {
    if (!voice.active) return;
    run();
    await voice.say(...lines);
  };
  await step(() => { lesson.hand.value = 'hour'; lesson.lit.value = []; lesson.fives.value = 0; }, 'The short hand shows the hour.');
  if (t.minute === 0) await step(() => { lesson.lit.value = [t.hour]; }, 'The short hand points to the', hourWord(t.hour));
  else await step(() => { lesson.lit.value = [t.hour, nextHour(t.hour)]; }, 'The short hand is between the', hourWord(t.hour), 'and the', hourWord(nextHour(t.hour)));
  if (t.minute !== 0) await step(() => { lesson.lit.value = [t.hour]; }, 'So the hour is', hourWord(t.hour));
  await step(() => { lesson.hand.value = 'minute'; lesson.lit.value = []; }, 'The long hand shows the minutes.');
  if (t.minute === 0) await step(() => { lesson.lit.value = [12]; }, 'The long hand points to the twelve.', "That means o'clock.");
  else {
    const n = t.minute / 5;
    await step(() => { lesson.lit.value = [n]; }, 'The long hand points to the', hourWord(n), 'Count by fives!');
    for (let k = 1; k <= n; k++) {
      if (!voice.active) return;
      lesson.fives.value = k;
      lesson.lit.value = [k];
      sCount(k);
      await voice.say(FIVES[k - 1]!);
    }
  }
  await step(() => { lesson.hand.value = null; lesson.lit.value = []; }, 'So it is', timePhrase(t));
  if (voice.active) lesson.fives.value = 0;
}

/** Help asked for (or given automatically): the lesson for this time. */
export const helpTime = (t: ClockTime, lifetime: AbortSignal) => {
  const lesson = lessonFor(lifetime);
  return teachTime(t, lesson, lesson.run.start());
};
