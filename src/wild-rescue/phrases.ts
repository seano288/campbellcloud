// The single typed list of everything Wild Rescue says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Questions and lessons are whole sentences (they come from the facts tables, so a fact is
// worded once), which is why this game has more clips than the others. Prices and counts are chained from number clips ("It costs",
// "45", "Bolts."), and a bought thing from "You got" and its name, as in Math Bots.
//
// This is the one game where answer choices are read out: a first grader can't read "To keep warm." or "Grassland", so every choice
// that is a word or a sentence is said as it lights. Pictures (animals, the weather, things) are not.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { BOLT } from '../currency/kind';
import { HOMED, RESCUABLE, type RescueCall } from './facts/animals';
import { BABIES, DIFFERENT_NEVER, DIFFERENT_TRUE, SAME_ALWAYS, SAME_DIFFERENT, SAME_NEVER } from './facts/babies';
import { HABITATS, type HabitatAbout, type HabitatLives, type HabitatName } from './facts/habitats';
import { LIVING, LIVING_WHY, NEED_ASKS, NEEDS, NOT_LIVING, NOT_LIVING_WHY, SCENES } from './facts/living';
import { ALSO_USES, DIAGRAMS, JOBS, WHYS } from './facts/parts';
import { AFTER_Q, CLOTHES, DAY_NIGHT, NOON_Q, SEASON_Q, SEASONS, SEASONS_ROUND, SUN_LESSON, SUN_TIMES, SUN_WHEN, WEAR, WEAR_Q, WEATHER, WEATHER_ASKED } from './facts/sky';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ALL_NAMES, PARTS, SLOT_NAMES, type ItemName, type OpensLine } from './park/shop';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Rescue up to 4. */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super ranger!', 'Nice work, ranger!', 'You know your animals!'] as const;

// ---------- the questions, from the facts ----------

// One line per animal with a home, worked out per animal so the type is exactly the lines recorded
type Homed = (typeof HOMED)[number];
type LivesIn<H> = Extract<(typeof HABITATS)[number], { id: H }>['lives'];
type WhereQ = Homed extends infer A ? A extends { a: infer X extends string; name: infer N extends string } ? `Where does ${Lowercase<X>} ${N} live?` : never : never;
type HomeLine = Homed extends infer A ? A extends { a: infer X extends string; name: infer N extends string; home: infer H } ? `${X} ${N} lives ${LivesIn<H>}.` : never : never;
type AlsoQ = `Which of these also lives ${HabitatLives}?`;
type HabitatSaid = `${HabitatName}.`;
export const whereQ = (a: { a: 'A' | 'An'; name: string }) => `Where does ${a.a.toLowerCase()} ${a.name} live?` as WhereQ;
export const homeLine = (a: { a: 'A' | 'An'; name: string }, lives: HabitatLives) => `${a.a} ${a.name} lives ${lives}.` as HomeLine;
export const alsoQ = (lives: HabitatLives) => `Which of these also lives ${lives}?` as AlsoQ;
export const habitatSaid = (name: HabitatName) => `${name}.` as HabitatSaid;
const homeLines = () => HOMED.flatMap(a => [whereQ(a), homeLine(a, HABITATS.find(h => h.id === a.home)!.lives), a.fact as Homed['fact']]);

type DiagramQ = (typeof DIAGRAMS)[number]['asks'][number]['q'];
type DiagramLesson = (typeof DIAGRAMS)[number]['asks'][number]['lesson'];
type WhyQ = (typeof WHYS)[number]['q'];
type WhyLesson = (typeof WHYS)[number]['lesson'];
type JobSaid = (typeof JOBS)[keyof typeof JOBS]['said'];
type AlsoUsesQ = (typeof ALSO_USES)[number]['q'];
type AlsoUsesLesson = (typeof ALSO_USES)[number]['lesson'];

type ThingLine = (typeof LIVING)[number]['line'] | (typeof NOT_LIVING)[number]['line'];
type NeedSaid = (typeof NEEDS)[keyof typeof NEEDS]['said'];
type NeedAsk = (typeof NEED_ASKS)[keyof typeof NEED_ASKS]['q'] | (typeof NEED_ASKS)[keyof typeof NEED_ASKS]['lesson'];
type SceneLine = (typeof SCENES)[number]['q'] | (typeof SCENES)[number]['lesson'];

type BabyLine = (typeof BABIES)[number]['q'] | (typeof BABIES)[number]['lesson'];
type PairQ = (typeof SAME_DIFFERENT)[number]['same'] | (typeof SAME_DIFFERENT)[number]['different'];
type Sentence = typeof SAME_ALWAYS | (typeof SAME_DIFFERENT)[number]['alsoTrue'][number] | (typeof SAME_NEVER)[number] | (typeof DIFFERENT_TRUE)[number] | (typeof DIFFERENT_NEVER)[number];

type WeatherLine = NonNullable<(typeof WEATHER)[keyof typeof WEATHER]['q'] | (typeof WEATHER)[keyof typeof WEATHER]['lesson']>;
type SeasonLine = (typeof SEASONS)[keyof typeof SEASONS]['said' | 'lesson' | 'after'];
type SkyLine = WeatherLine | SeasonLine | typeof DAY_NIGHT.q | typeof DAY_NIGHT.day.said | typeof DAY_NIGHT.night.said | typeof DAY_NIGHT.day.lesson | typeof DAY_NIGHT.night.lesson
  | typeof SEASON_Q | (typeof AFTER_Q)[keyof typeof AFTER_Q] | typeof SEASONS_ROUND | (typeof CLOTHES)[keyof typeof CLOTHES]['said'] | typeof WEAR_Q
  | (typeof WEAR)[keyof typeof WEAR]['lesson'] | (typeof SUN_TIMES)[keyof typeof SUN_TIMES]['said'] | (typeof SUN_WHEN)[keyof typeof SUN_WHEN]['q'] | typeof NOON_Q
  | (typeof SUN_LESSON)[number];

const ASKING = ['Tap the living thing!', 'Tap all the ones it needs. Then tap Done.'] as const;
const TEACHING = ["Let's look together.", 'Not quite!', 'Try again!', 'Watch it grow!', 'Watch the sun!', 'Watch the tree!'] as const;

// ---------- the Garage, the Rescue and the Park ----------

const GARAGE = [
  'Garage!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You got', 'You built everything!',
  'You have 1 rescue call!', 'rescue calls!', 'Tap Rescue!', 'Play a Round to earn a rescue call!', 'You earned a rescue call!',
  'Your truck needs', 'Habitats', 'Extras', 'Decorations',
] as const;
const RESCUE = [
  'Calling all rangers!', 'Hold to drive!', 'Tap the button to jump!', 'Grab the Bolts!', 'A Bolt!', 'You found it!', 'Splash!', 'Bump!',
  'Pull the net off!', 'Keep pulling!', 'Tap the winch to lift it out!', 'Keep winching!', 'Tap the treats to lead it to the crate!', 'Yum!',
  'Into the crate!', 'Time to go home!', 'You did it!', 'Tap again to leave.', 'This one is going back to the wild.', 'Back to the wild!',
] as const;
const PARK = [
  'The Park!', 'Carry it to its home!', 'Not here!', 'Welcome home!', 'Tap an animal to feed it!', 'Rescue animals to fill it!',
  'Buy this habitat with Bolts!', 'All the animals are home!',
] as const;

type EarnedPhrase = EarnedLine<typeof BOLT>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | WhereQ | HomeLine | AlsoQ | HabitatSaid | HabitatAbout | Homed['fact']
  | DiagramQ | DiagramLesson | WhyQ | WhyLesson | JobSaid | AlsoUsesQ | AlsoUsesLesson
  | ThingLine | typeof LIVING_WHY | typeof NOT_LIVING_WHY | NeedSaid | NeedAsk | SceneLine
  | BabyLine | PairQ | Sentence | SkyLine
  | (typeof ASKING)[number] | (typeof TEACHING)[number] | (typeof GARAGE)[number] | (typeof RESCUE)[number] | (typeof PARK)[number]
  | RescueCall | ItemName | (typeof SLOT_NAMES)[keyof typeof SLOT_NAMES] | OpensLine;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(BOLT, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  // Where It Lives
  ...homeLines(), ...HABITATS.flatMap(h => [alsoQ(h.lives), habitatSaid(h.name), h.about] as const),
  // Animal Parts
  ...DIAGRAMS.flatMap(d => d.asks.flatMap(a => [a.q, a.lesson] as const)), ...WHYS.flatMap(w => [w.q, w.lesson] as const), ...Object.values(JOBS).map(j => j.said),
  ...ALSO_USES.flatMap(u => [u.q, u.lesson] as const),
  // Alive or Not
  ...LIVING.map(t => t.line), ...NOT_LIVING.map(t => t.line), LIVING_WHY, NOT_LIVING_WHY, ...Object.values(NEEDS).map(n => n.said),
  ...Object.values(NEED_ASKS).flatMap(n => [n.q, n.lesson] as const), ...SCENES.flatMap(s => [s.q, s.lesson] as const),
  // Babies
  ...BABIES.flatMap(b => [b.q, b.lesson] as const), ...SAME_DIFFERENT.flatMap(p => [p.same, p.different, ...p.alsoTrue] as const),
  SAME_ALWAYS, ...SAME_NEVER, ...DIFFERENT_TRUE, ...DIFFERENT_NEVER,
  // Sky and Seasons
  ...WEATHER_ASKED.flatMap(w => [WEATHER[w].q, WEATHER[w].lesson] as const), DAY_NIGHT.q, DAY_NIGHT.day.said, DAY_NIGHT.night.said, DAY_NIGHT.day.lesson, DAY_NIGHT.night.lesson,
  SEASON_Q, ...Object.values(SEASONS).flatMap(s => [s.said, s.lesson, s.after] as const), ...Object.values(AFTER_Q), SEASONS_ROUND,
  ...Object.values(CLOTHES).map(c => c.said), WEAR_Q, ...Object.values(WEAR).map(w => w.lesson), ...Object.values(SUN_TIMES).map(t => t.said),
  ...Object.values(SUN_WHEN).map(w => w.q), NOON_Q, ...SUN_LESSON,
  ...ASKING, ...TEACHING,
  // the reward
  ...GARAGE, ...RESCUE, ...PARK, ...RESCUABLE.map(a => a.rescue.call), ...ALL_NAMES, ...Object.values(SLOT_NAMES),
  ...PARTS.flatMap(p => ('opens' in p ? [p.opens] : [])),
]);
