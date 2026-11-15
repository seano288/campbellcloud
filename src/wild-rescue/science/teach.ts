// Teaching a miss, never with a red X: the lesson shows the fact on the picture itself and says it in one plain sentence. The animal
// hops into its habitat; the body part lights up and does its job; the baby grows into its parent in three steps; the sun crosses the
// sky or the tree turns through the seasons, stopping on the answer; the missing need comes back into the picture. A second miss (or
// the first, when he's been missing a lot) says a little more and leaves the answer glowing. 🔎 runs that fuller lesson and counts as help.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal).
import { signal, type Signal } from '@preact/signals';
import { sChime, sCount, sPop } from '../../audio/sfx';
import { animal, type AnimalId } from '../facts/animals';
import { BABIES, SAME_DIFFERENT } from '../facts/babies';
import { habitat, type HabitatId } from '../facts/habitats';
import { LIVING, LIVING_WHY, NEED_ASKS, NEEDS, NOT_LIVING, NOT_LIVING_WHY, SCENES, type NeedId } from '../facts/living';
import { ALSO_USES, DIAGRAMS, WHYS, type JobId } from '../facts/parts';
import { BEFORE, DAY_NIGHT, SEASON_IDS, SEASONS, SEASONS_ROUND, SUN_LESSON, WEAR, WEATHER, type SeasonId, type WeatherId } from '../facts/sky';
import type { Asking } from '../mix';
import { homeLine, type Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import type { Question } from './problems';

export type Show =
  | { kind: 'home'; animal: AnimalId; habitat: HabitatId }
  | { kind: 'part'; part: string }
  | { kind: 'job'; job: JobId }
  | { kind: 'pop'; animal: AnimalId }
  | { kind: 'grow'; step: 0 | 1 | 2 }
  | { kind: 'sun'; spot: 'up' | 'high' | 'down' }
  | { kind: 'season'; season: SeasonId }
  | { kind: 'fixed' }
  | { kind: 'needs'; lit: NeedId[] }
  | { kind: 'weather'; w: WeatherId };

export interface Lesson {
  /** What the picture shows during the lesson; null: the question's own picture. */
  readonly show: Signal<Show | null>;
  /** The choice being read aloud right now. */
  readonly lit: Signal<string | null>;
  /** The answer, shown and left glowing after a fuller lesson. */
  readonly glow: Signal<string | null>;
  /** Only one thing animates at a time: starting a new one stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = { show: signal(null), lit: signal(null), glow: signal(null), task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } } };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
const homeOf = (id: AnimalId) => { const a = animal(id); return homeLine(a, habitat(a.home!).lives); };
const thingLine = (id: string): Phrase => (LIVING.find(t => t.id === id) ?? NOT_LIVING.find(t => t.id === id))!.line;

/** The fact, shown and said. `teach`: the fuller lesson, which ends with the answer glowing. */
async function teach(q: Question, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const glow = () => { if (v.active && full) { l.glow.value = q.answer as string; sChime(); } };

  if (q.kind === 'home') {
    if (q.form === 'where') {
      // the habitat he tapped, as it is, then the animal hopping into its own
      if (answer && answer !== q.answer && !full) { await v.say(habitat(answer as HabitatId).about); if (!v.active) return; }
      l.show.value = { kind: 'home', animal: q.animal, habitat: q.answer };
      sPop();
      await v.say(homeOf(q.animal));
      if (full && v.active) { glow(); await v.say(animal(q.animal).fact as Phrase); }
    } else {
      if (answer && answer !== q.answer) { l.show.value = { kind: 'pop', animal: answer as AnimalId }; await v.say(homeOf(answer as AnimalId)); if (!v.active) return; }
      l.show.value = { kind: 'pop', animal: q.answer };
      sPop();
      await v.say(homeOf(q.answer));
      glow();
    }
    return;
  }

  if (q.kind === 'parts') {
    if (q.form === 'tap') {
      const d = DIAGRAMS[q.diagram]!, wrongAsk = d.asks.find(a => a.part === answer);
      // a part he tapped that has a job of its own here is shown doing it first
      if (wrongAsk && !full) { l.show.value = { kind: 'part', part: wrongAsk.part }; await v.say(wrongAsk.lesson); await beat(v, 300); if (!v.active) return; }
      l.show.value = { kind: 'part', part: q.answer };
      sPop();
      await v.say(d.asks[q.ask]!.lesson);
      glow();
    } else if (q.form === 'why') {
      const w = WHYS[q.why]!;
      l.show.value = { kind: 'job', job: w.right };
      sPop();
      await v.say(w.lesson);
      glow();
    } else {
      const u = ALSO_USES[q.item]!;
      l.show.value = { kind: 'pop', animal: u.right };
      sPop();
      await v.say(u.lesson);
      glow();
    }
    return;
  }

  if (q.kind === 'alive') {
    if (q.form === 'living') {
      if (answer && answer !== q.answer) { l.lit.value = answer; await v.say(thingLine(answer), NOT_LIVING_WHY); if (!v.active) return; }
      l.lit.value = q.answer;
      sPop();
      await v.say(thingLine(q.answer), ...(full ? [LIVING_WHY] as const : []));
      l.lit.value = null;
      glow();
    } else if (q.form === 'needs') {
      const ask = NEED_ASKS[q.subject], right = ask.right as readonly NeedId[];
      const said = v.say(ask.lesson);
      for (let i = 0; i < right.length && v.active; i++) { l.show.value = { kind: 'needs', lit: right.slice(0, i + 1) }; sCount(i); await beat(v, 650); }
      await said;
      if (full && v.active) { l.glow.value = q.answer; sChime(); for (const n of right) { if (!v.active) return; l.lit.value = n; await v.say(NEEDS[n].said); } l.lit.value = null; }
      else l.show.value = null;
    } else {
      const s = SCENES[q.scene]!;
      l.show.value = { kind: 'fixed' };
      sPop();
      await v.say(s.lesson);
      glow();
    }
    return;
  }

  if (q.kind === 'baby') {
    if (q.form === 'grow') {
      const b = BABIES[q.baby]!;
      if (full) await v.say('Watch it grow!');
      for (const step of [0, 1, 2] as const) { if (!v.active) return; l.show.value = { kind: 'grow', step }; sCount(step); await beat(v, 700); }
      await v.say(b.lesson);
      glow();
    } else {
      const p = SAME_DIFFERENT[q.pair]!, b = BABIES.find(x => x.baby === p.baby)!;
      for (const step of [0, 1, 2] as const) { if (!v.active) return; l.show.value = { kind: 'grow', step }; await beat(v, 500); }
      await v.say(b.lesson);
      if (v.active) { l.lit.value = q.answer; await v.say(q.answer as Phrase); l.lit.value = null; }
      glow();
    }
    return;
  }

  // Sky and Seasons
  if (q.form === 'daynight') {
    if (q.answer === 'day') for (const spot of ['up', 'high'] as const) { if (!v.active) return; l.show.value = { kind: 'sun', spot }; await beat(v, 700); }
    await v.say(DAY_NIGHT[q.answer].lesson);
    glow();
  } else if (q.form === 'weather') {
    l.show.value = { kind: 'weather', w: q.answer };
    await v.say(WEATHER[q.answer].lesson!);
    glow();
  } else if (q.form === 'season' || q.form === 'after') {
    if (full || q.form === 'after') await v.say('Watch the tree!');
    // the tree turns through the year, from the season before, and stops on the answer
    const start = SEASON_IDS.indexOf(q.form === 'after' ? BEFORE[q.answer] : SEASON_IDS[(SEASON_IDS.indexOf(q.answer) + 1) % 4]!);
    const path = q.form === 'after' ? [SEASON_IDS[start]!, q.answer] : [0, 1, 2, 3].map(i => SEASON_IDS[(start + i) % 4]!);
    for (const season of path) { if (!v.active) return; l.show.value = { kind: 'season', season }; sCount(SEASON_IDS.indexOf(season)); await beat(v, 650); }
    await v.say(q.form === 'after' ? SEASONS[q.answer].after : SEASONS[q.answer].lesson);
    if (full && q.form === 'after' && v.active) await v.say(SEASONS_ROUND);
    glow();
  } else if (q.form === 'wear') {
    await v.say(WEAR[q.day].lesson);
    glow();
  } else {
    // the sun crosses the sky, stopping where the answer is
    if (full) await v.say('Watch the sun!');
    const stop = q.form === 'noon' ? 1 : q.answer === 'morning' ? 0 : q.answer === 'noon' ? 1 : 2;
    const spots = ['up', 'high', 'down'] as const;
    for (let i = 0; i <= stop && v.active; i++) { l.show.value = { kind: 'sun', spot: spots[i]! }; sCount(i); await v.say(SUN_LESSON[i]!); }
    glow();
  }
}

/** What the round engine runs after a miss, before he can try again. */
export async function explain(p: Asking, answer: string, full: boolean, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null; l.lit.value = null;
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
