// Running a lesson after a miss, and the quiet clock behind top Strength. He's never shown a timer and nothing he does is
// hurried: this only tells recall from counting, starting when the question has finished being said.
import type { Explanation } from '../learning';
import type { Asking } from '../mix';
import type { Input } from './problems';
import { lessonFor, missSteps, playSteps, teachSteps, type Lesson } from './teach';
import type { VoiceScope } from '../voice';

export const RECALL_MS = 4000;

const asked = new WeakMap<AbortSignal, number>();
/** The question has been said: the clock starts. */
export const markAsked = (lifetime: AbortSignal) => { asked.set(lifetime, Date.now()); };
export const tookLong = (lifetime: AbortSignal) => { const t = asked.get(lifetime); return t === undefined || Date.now() - t > RECALL_MS; };

/** The long line about = is said once in a Round, however many Weigh-Ins he misses. */
let saidInRound = false;
export const newRoundOfTeaching = () => { saidInRound = false; };

/** He answers on the picture itself here, so a lesson has to give it back when it's done. */
const ON_THE_PICTURE: ReadonlySet<Input> = new Set(['chart', 'lay', 'pick', 'tiles', 'fill']);

export async function teachIn(p: Asking, lesson: Lesson, voice: VoiceScope) {
  await playSteps(teachSteps(p.q, saidInRound), lesson, voice);
  if (voice.active && ON_THE_PICTURE.has(p.q.input)) { lesson.stage.value = null; lesson.caption.value = null; }
  if (p.q.kind === 'scale' && p.q.form === 'balance') saidInRound = true;
}

export const explain: Explanation<Asking> = async (p, answer, teach, lifetime) => {
  const lesson = lessonFor(lifetime), voice = lesson.run.start();
  if (teach) return teachIn(p, lesson, voice);
  await playSteps(missSteps(p.q, answer), lesson, voice);
  if (voice.active) { lesson.stage.value = null; lesson.caption.value = null; }
};
