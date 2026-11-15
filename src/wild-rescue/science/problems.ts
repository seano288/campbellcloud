// The questions, made from the facts tables (facts/). Every question has exactly one right answer among its choices, and every wrong
// choice is plainly wrong: the tables say which habitats, parts, parents and sentences could be argued about, and those are never
// offered. science/problems.test.ts checks every kind, Level and Stretch over many seeds.
//
// An answer is a short string: a habitat id, a part, a job, an animal id, a thing, a need, a sentence, a season and so on. For "tap
// all it needs" it is the needs in a fixed order, joined with "+".
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { animal, arguable, HOMED, poleOf, type AnimalDef, type AnimalId } from '../facts/animals';
import { BABIES, DIFFERENT_NEVER, DIFFERENT_TRUE, SAME_ALWAYS, SAME_DIFFERENT, SAME_NEVER } from '../facts/babies';
import { HABITAT_IDS, VERY_DIFFERENT, type HabitatId } from '../facts/habitats';
import { LIVING, NEED_ASKS, NOT_LIVING, SCENES, type NeedId, type NeedSubject } from '../facts/living';
import { ALSO_USES, DIAGRAMS, WHYS, type JobId } from '../facts/parts';
import { BEFORE, SEASON_IDS, SUN_SPOTS, SUN_TIMES, SUN_WHEN, WEAR, WEATHER_ASKED, type ClothesId, type SeasonId, type SunSpot, type SunTime, type WearDay, type WeatherId } from '../facts/sky';

export const KINDS = ['home', 'parts', 'alive', 'baby', 'sky'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

export type HomeQ =
  | { kind: 'home'; form: 'where'; animal: AnimalId; choices: HabitatId[]; answer: HabitatId }
  | { kind: 'home'; form: 'also'; subject: AnimalId; habitat: HabitatId; choices: AnimalId[]; answer: AnimalId };
export type PartsQ =
  | { kind: 'parts'; form: 'tap'; diagram: number; ask: number; answer: string }
  | { kind: 'parts'; form: 'why'; why: number; choices: JobId[]; answer: JobId }
  | { kind: 'parts'; form: 'also'; item: number; choices: AnimalId[]; answer: AnimalId };
export type AliveQ =
  | { kind: 'alive'; form: 'living'; choices: string[]; answer: string }
  | { kind: 'alive'; form: 'needs'; subject: NeedSubject; choices: NeedId[]; answer: string }
  | { kind: 'alive'; form: 'missing'; scene: number; choices: NeedId[]; answer: NeedId };
export type BabyQ =
  | { kind: 'baby'; form: 'grow'; baby: number; choices: AnimalId[]; answer: AnimalId }
  | { kind: 'baby'; form: 'same' | 'different'; pair: number; choices: string[]; answer: string };
export type SkyQ =
  | { kind: 'sky'; form: 'daynight'; choices: ('day' | 'night')[]; answer: 'day' | 'night' }
  | { kind: 'sky'; form: 'weather'; choices: WeatherId[]; answer: WeatherId }
  | { kind: 'sky'; form: 'season'; choices: SeasonId[]; answer: SeasonId }
  | { kind: 'sky'; form: 'wear'; day: WearDay; choices: ClothesId[]; answer: ClothesId }
  | { kind: 'sky'; form: 'after'; choices: SeasonId[]; answer: SeasonId }
  | { kind: 'sky'; form: 'noon'; choices: SunSpot[]; answer: 'high' }
  | { kind: 'sky'; form: 'sunwhen'; which: keyof typeof SUN_WHEN; choices: SunTime[]; answer: SunTime };
export type Question = HomeQ | PartsQ | AliveQ | BabyQ | SkyQ;

/** Picks n distinct items. */
const some = <T,>(rng: Rng, xs: readonly T[], n: number) => shuffle(rng, xs).slice(0, n);
const withRight = <T,>(rng: Rng, right: T, wrong: readonly T[]) => shuffle(rng, [right, ...wrong]);

// ---------- Where It Lives ----------

/** Animals asked about: one clear home. */
export const HOME_ANIMALS = HOMED;

/** The wrong habitats that may be offered for this animal: never its home, never one it also lives in. */
export const wrongHabitats = (a: AnimalDef, veryDifferent: boolean) =>
  (veryDifferent ? VERY_DIFFERENT[a.home!] : HABITAT_IDS).filter(h => !arguable(a, h));

/** For "Which of these also lives in X?": another animal there (on the same side of the Earth, for polar ones). */
export const neighboursOf = (a: AnimalDef) => HOMED.filter(b => b.id !== a.id && b.home === a.home && poleOf(b) === poleOf(a));
/** Plainly not living in that habitat. */
export const strangersTo = (h: HabitatId) => HOMED.filter(b => !arguable(b, h));
export const ALSO_SUBJECTS = HOMED.filter(a => neighboursOf(a).length > 0);

function makeHome(level: Level, stretch: Stretch, rng: Rng): HomeQ {
  if (level === 3) {
    const subject = pick(rng, ALSO_SUBJECTS), h = subject.home!, right = pick(rng, neighboursOf(subject));
    // the two wrong animals come from two different habitats, so the choices don't look like a set
    const strangers = shuffle(rng, strangersTo(h)), wrong: AnimalDef[] = [];
    for (const s of strangers) if (wrong.length < 2 && !wrong.some(w => w.home === s.home)) wrong.push(s);
    return { kind: 'home', form: 'also', subject: subject.id, habitat: h, choices: withRight(rng, right, wrong).map(x => x.id), answer: right.id };
  }
  const veryDifferent = level === 1;
  const pool = HOME_ANIMALS.filter(a => wrongHabitats(a, veryDifferent).length >= (level === 1 ? 1 : 3));
  const a = pick(rng, pool), n = level === 1 ? 1 : stretch === 2 ? 3 : 2;
  return { kind: 'home', form: 'where', animal: a.id, choices: withRight(rng, a.home!, some(rng, wrongHabitats(a, veryDifferent), n)), answer: a.home! };
}

// ---------- Animal Parts ----------

export const TAPS = DIAGRAMS.flatMap((d, diagram) => d.asks.map((_, ask) => ({ diagram, ask })));

function makeParts(level: Level, _stretch: Stretch, rng: Rng): PartsQ {
  if (level === 1) {
    const { diagram, ask } = pick(rng, TAPS);
    return { kind: 'parts', form: 'tap', diagram, ask, answer: DIAGRAMS[diagram]!.asks[ask]!.part };
  }
  if (level === 2) {
    const why = int(rng, 0, WHYS.length - 1), w = WHYS[why]!;
    return { kind: 'parts', form: 'why', why, choices: withRight<JobId>(rng, w.right, some(rng, w.wrong, 2)), answer: w.right };
  }
  const item = int(rng, 0, ALSO_USES.length - 1), u = ALSO_USES[item]!;
  return { kind: 'parts', form: 'also', item, choices: withRight<AnimalId>(rng, u.right, some(rng, u.wrong, 2)), answer: u.right };
}

// ---------- Alive or Not ----------

/** The needs in the order they are always shown and joined. */
export const NEED_ORDER: readonly NeedId[] = ['sun', 'water', 'air', 'food', 'shelter', 'candy', 'toys', 'tv', 'shoes', 'sunglasses'];
export const needsAnswer = (ids: readonly NeedId[]) => NEED_ORDER.filter(n => ids.includes(n)).join('+');

function makeAlive(level: Level, stretch: Stretch, rng: Rng): AliveQ {
  if (level === 1) {
    const right = pick(rng, LIVING), n = stretch + 1;
    return { kind: 'alive', form: 'living', choices: withRight(rng, right.id as string, some(rng, NOT_LIVING, n).map(t => t.id)), answer: right.id };
  }
  if (level === 2) {
    const subject: NeedSubject = rng() < .5 ? 'plant' : 'animal', ask = NEED_ASKS[subject];
    const wrong: readonly NeedId[] = some(rng, ask.wrong as readonly NeedId[], stretch === 0 ? 1 : 2);
    return { kind: 'alive', form: 'needs', subject, choices: shuffle(rng, [...(ask.right as readonly NeedId[]), ...wrong]), answer: needsAnswer(ask.right) };
  }
  const scene = int(rng, 0, SCENES.length - 1), s = SCENES[scene]!;
  return { kind: 'alive', form: 'missing', scene, choices: withRight<NeedId>(rng, s.right, s.wrong), answer: s.right };
}

// ---------- Babies ----------

export const ALIKE = BABIES.flatMap((b, i) => (b.alike ? [i] : []));
export const DIFFERENT = BABIES.flatMap((b, i) => (b.alike ? [] : [i]));

function makeBaby(level: Level, stretch: Stretch, rng: Rng): BabyQ {
  if (level < 3) {
    const baby = pick(rng, level === 1 ? ALIKE : DIFFERENT), b = BABIES[baby]!, n = level === 1 && stretch === 0 ? 1 : 2;
    return { kind: 'baby', form: 'grow', baby, choices: withRight<AnimalId>(rng, b.parent, some(rng, b.wrong, n)), answer: b.parent };
  }
  const pair = int(rng, 0, SAME_DIFFERENT.length - 1), p = SAME_DIFFERENT[pair]!;
  if (rng() < .5) {
    const right = pick(rng, [SAME_ALWAYS, ...p.alsoTrue] as string[]);
    return { kind: 'baby', form: 'same', pair, choices: withRight(rng, right, some(rng, SAME_NEVER, 2)), answer: right };
  }
  const right = pick(rng, DIFFERENT_TRUE) as string;
  return { kind: 'baby', form: 'different', pair, choices: withRight(rng, right, some(rng, DIFFERENT_NEVER, 2)), answer: right };
}

// ---------- Sky and Seasons ----------

/** Seasons that sit opposite each other in the year, so a picture of one can't be argued to be the other. */
export const OPPOSITE: Record<SeasonId, SeasonId> = { spring: 'fall', summer: 'winter', fall: 'spring', winter: 'summer' };

function makeSky(level: Level, stretch: Stretch, rng: Rng): SkyQ {
  if (level === 1) {
    if (rng() < .4) { const answer = rng() < .5 ? 'day' : 'night'; return { kind: 'sky', form: 'daynight', choices: ['day', 'night'], answer }; }
    const answer = pick(rng, WEATHER_ASKED), others = (['sunny', 'rainy', 'snowy', 'cloudy'] as const).filter(w => w !== answer);
    return { kind: 'sky', form: 'weather', choices: withRight<WeatherId>(rng, answer, some(rng, others, stretch + 1)), answer };
  }
  if (level === 2) {
    if (rng() < .55) {
      const answer = pick(rng, SEASON_IDS);
      const wrong = stretch === 0 ? [OPPOSITE[answer]] : some(rng, SEASON_IDS.filter(s => s !== answer), stretch + 1);
      return { kind: 'sky', form: 'season', choices: withRight(rng, answer, wrong), answer };
    }
    const day = pick(rng, Object.keys(WEAR) as WearDay[]), w = WEAR[day], answer = pick(rng, w.right as readonly ClothesId[]);
    return { kind: 'sky', form: 'wear', day, choices: withRight(rng, answer, w.wrong as readonly ClothesId[]), answer };
  }
  const r = rng();
  if (r < .5) {
    const answer = pick(rng, SEASON_IDS);
    return { kind: 'sky', form: 'after', choices: withRight(rng, answer, SEASON_IDS.filter(s => s !== answer && s !== BEFORE[answer])), answer };
  }
  if (r < .7) return { kind: 'sky', form: 'noon', choices: shuffle(rng, SUN_SPOTS), answer: 'high' };
  const which = rng() < .5 ? 'up' : 'down';
  return { kind: 'sky', form: 'sunwhen', which, choices: shuffle(rng, Object.keys(SUN_TIMES) as SunTime[]), answer: SUN_WHEN[which].right };
}

// ---------- any question ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  if (kind === 'home') return makeHome(level, stretch, rng);
  if (kind === 'parts') return makeParts(level, stretch, rng);
  if (kind === 'alive') return makeAlive(level, stretch, rng);
  if (kind === 'baby') return makeBaby(level, stretch, rng);
  return makeSky(level, stretch, rng);
}

/** Every answer a tap could give for this question. */
export function answersOf(q: Question): string[] {
  if (q.kind === 'parts' && q.form === 'tap') return [...DIAGRAMS[q.diagram]!.parts];
  if (q.kind === 'alive' && q.form === 'needs') return [q.answer]; // any set can be sent; only one is right
  return (q.choices as readonly string[]).map(String);
}
export const isAnswer = (q: Question, a: string) => (q.kind === 'alive' && q.form === 'needs')
  ? a.split('+').every(n => (q.choices as string[]).includes(n)) && a.length > 0
  : answersOf(q).includes(a);
export const rightAnswer = (q: Question) => q.answer as string;
/** The animal pictured in a question, if any (for the ones he has met before, and the tour). */
export function animalOf(q: Question): AnimalId | null {
  if (q.kind === 'home') return q.form === 'where' ? q.animal : q.subject;
  if (q.kind === 'parts') return q.form === 'tap' ? DIAGRAMS[q.diagram]!.animal : q.form === 'why' ? WHYS[q.why]!.animal : ALSO_USES[q.item]!.shown;
  return null;
}
export { animal };
