// The single typed list of everything Word Wreckers says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Every word on the list is recorded alone, and again slowly ("Slowly: cat", recorded as "cat"
// at a slower rate) for the sound boxes to light along with. The voice never says a lone sound or a misspelling: Fix It says the word
// he should see, and shows the wrong spelling. Prices and counts are chained from number clips ("It costs", "45", "Bolts."), and a
// bought thing from "You got" and its name, as in the other games.
import { BOLT, earnedLine, type EarnedLine } from '../currency/kind';
import { PATTERN_IDS, WORDS, type PatternId, type Word } from '../dino-dig/words/list';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { PHRASES as PICK_PHRASES, type PickPhrase } from './spelling/problems';
import { ALL_NAMES, BUILDING_NAMES, MACHINES, type BuildingName, type ItemName, type OpensLine } from './yard/shop';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6. */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super speller!', 'Nice building!', 'You know your sounds!'] as const;

// ---------- the questions ----------

export type Slowly = `Slowly: ${Word}`;
export const slowly = (w: Word) => `Slowly: ${w}` as Slowly;
const ASKING = [
  'Build the word', 'Which sound is missing?', 'Use the chunks to build', 'This should say', 'Find the mistake!', 'Tap the glowing mistake!',
  'Now pick the right one!', 'Is a letter missing, or is there one too many?', 'Which one spells', 'Which one says',
] as const;
const TEACHING = [
  'Listen.', 'Each sound gets a box.', 'Watch me build it.', 'Now you build it!', 'Try again!', 'These letters make one sound.',
  'Here is the mistake.', 'This one is extra.', 'A letter is missing here.',
] as const;

/** Meeting a Pattern: a line that says what's new, then its three example words. */
export const PATTERN_LINES = {
  cvc: 'Words are made of sounds. Each sound gets a box.',
  digraph: 'Two letters can make one sound. They share one box.',
  blend: 'Some words have two sounds side by side. Each sound gets its own box.',
  'magic-e': 'A magic e at the end makes the vowel say its name.',
  team: 'Two vowels can team up to make one sound.',
  r: 'An r after a vowel changes the vowel sound.',
} as const satisfies Record<PatternId, string>;
const MEETING = ['A new sound pattern!', 'Tap Go when you are ready!'] as const;

// ---------- the Yard, the Job and the Town ----------

const YARD = [
  'The Yard!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You got', 'You built everything!',
  'You have 1 Job!', 'Jobs!', 'Tap Job!', 'Play a Round to earn a Job!', 'You earned a Job!', 'First get the',
  'Machines', 'Upgrades', 'Paint', 'Driver', 'Town', 'More power!', 'Bigger hits!', 'Faster!',
] as const;
export const MATERIAL_LINES = ['An old wooden shed!', 'An old brick building!', 'An old concrete building!', 'An old steel tower!'] as const;
const JOB = [
  'A new Job!', 'Pick a machine!', 'Knock it down!', 'Pull the ball back and let go!', 'Hold the arrow to push!', 'Tap the building to dig!',
  'Crash!', 'Boom!', 'Smash!', 'A Bolt!', 'The lot is clear!', 'Haul it away!', 'What will you build?',
  'Move the crane, then let go to drop!', 'Nice drop!', 'One more!', 'You built', 'Your Town is full!', 'Make one gold!', 'It is gold now!',
  'Tap again to leave.', 'Off to your Town!', 'Just for fun!',
] as const;
const TOWN = ['Your Town!', 'Honk honk!', 'Hold the arrows to drive!', 'This street is for sale!', 'Do a Job to build here!'] as const;

type EarnedPhrase = EarnedLine<typeof BOLT>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | Word | Slowly | PickPhrase | (typeof ASKING)[number] | (typeof TEACHING)[number] | (typeof PATTERN_LINES)[PatternId] | (typeof MEETING)[number]
  | (typeof YARD)[number] | (typeof MATERIAL_LINES)[number] | (typeof JOB)[number] | (typeof TOWN)[number]
  | ItemName | BuildingName | OpensLine;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(BOLT, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  ...WORDS, ...WORDS.map(slowly), ...Object.values(PICK_PHRASES), ...ASKING, ...TEACHING, ...PATTERN_IDS.map(p => PATTERN_LINES[p]), ...MEETING,
  ...YARD, ...MATERIAL_LINES, ...JOB, ...TOWN, ...ALL_NAMES, ...BUILDING_NAMES, ...MACHINES.flatMap(m => ('opens' in m ? [m.opens] : [])),
]);
