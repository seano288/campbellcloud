// The single typed list of everything Cargo Words says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12",
// "Bolts."), as in Jetway. Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// Every word on the tables is a clip, and every syllable is a clip said alone, written in brackets ("(rab)"): make_voice.py says each one
// as it sounds in its word (COLLECTION_SPEECH['cargo-words']), since a syllable alone is where the voice slips most.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ITEM_NAMES, REPEATS, SHIP_NAMES, type ItemName, type RepeatName, type ShipName } from './port/catalog';
import { RANKS, TROPHIES, type TrophyName } from './port/port';
import { CHART_FIRST, CHART_SECOND, CRATES, HARBOURS, SPECIALS, VISITOR_FIRST, VISITOR_SECOND, type ChartWord, type HarbourName, type SpecialName, type VisitorWord } from './port/sea';
import { ADD_ON_MEANS, ADD_ON_WORDS, ADD_ONS } from './words/addons';
import { SYLLABLES, WORDS } from './words/words';

export const NUMBERS_TO = 100;
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
/** A price as the voice says it: itself to 100, else the whole ten at or above it (up to 400). `exact` says whether that's it. */
export function sayable(x: number): { said: `${number}`; exact: boolean } {
  const n = Math.max(0, Math.round(x));
  if (n <= NUMBERS_TO) return { said: `${n}`, exact: true };
  const ten = Math.min(PRICE_TOP, Math.ceil(n / 10) * 10);
  return { said: `${ten}`, exact: ten === n };
}
/** "You need 12 more Bolts.", or "You need about 140 more Bolts." when it isn't a number the voice has (Turbo Tally's wording). */
export function needLine(x: number): Phrase[] {
  const { said, exact } = sayable(x);
  return [exact ? 'You need' : 'You need about', said, 'more Bolts.'];
}
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Ship up to 6 (port.ts, MOST_SHIP_BOLTS). */
export const MOST_EARNED = 12;

/** A syllable said alone. */
export type Syl = `(${string})`;
export const syl = (s: string) => `(${s})` as Syl;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Port', 'Sea Chart', 'Tap Go!'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super reading!', 'Awesome!', 'Way to go!', 'Ship shape!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  'Listen.', 'How many beats? Tap that many containers.', 'Read the word. How many beats?',
  'Load the ship!', 'Tap the containers in order.',
  'Where does it split? Tap between the letters.', 'Listen to the beats.',
  'Read the word. Tap its picture.',
  'Which bossy r goes in the gap?',
  'Which picture shows', 'Which word means', 'Which word is hiding in', 'Read it. Then tap the one it tells you.',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Tap each container to hear it.', 'One.', 'Two.', 'Three.', 'Four.',
  'Two small words.', 'Split between them.', 'Two letters the same in the middle.', 'Two letters in the middle.', 'The l e takes the letter before it.',
  'The first vowel says its name.', 'Split right after it.', 'The first vowel is short.', 'Keep the next letter with it.', 'The c k stays with it.', 'Two vowels that each say a sound.',
  'A and r say ar.', 'O and r say or.', 'E and r say er.', 'I and r say er.', 'U and r say er.',
  'means', 'is hiding in', 'This one is the', ...Object.values(ADD_ON_MEANS),
] as const;

// ---------- the Meetings: the three syllable types that are new here ----------
const MEETING = [
  'Here is a new kind of container!',
  'This container ends with its vowel. The vowel says its name.',
  'A letter and l e at the end go together.',
  'A y at the end of a long word says ee.',
] as const;

// ---------- the Port ----------
const PORT = [
  'Port!', 'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Build this first:', 'You need another berth first!',
  'You have 1 Ship to load!', 'Ships to load!', 'Tap Load!', 'Play a Round to earn a Ship!', 'You earned a Ship!', 'Sail to',
  'This ship needs a bigger crane!', 'Build', 'to sail here!', 'sails next!', 'A visiting ship!',
  'Build', 'Cranes', 'Ships', 'Paint', 'Containers', 'Decorations', 'Flags', 'Bests',
  'You can build more of these!', 'Watch it run!', 'Tap again to leave.', 'You won a Trophy!',
] as const;

// ---------- the Crane ----------
const CRANE = [
  'Drag the crane over a container, then tap!', 'Tap a container to pick it up!', 'Now tap the ship!', 'Take it to the ship!', 'That stack is full!',
  'That is the water. Bring it over the ship.', 'The ship is full!', 'Here comes the', 'Welcome to', 'New best!', 'Tallest stack!', 'Quickest loading!',
  'You won a special crate!', 'A crate from', 'Your port is now a', 'tonnes!', 'Great loading!', 'Nothing there to pick up.',
] as const;

type EarnedPhrase = EarnedLine<typeof CUR>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const RANK_NAMES = [...RANKS.map(r => r.name), 'Super Port'] as const;
export type RankName = (typeof RANK_NAMES)[number];
type CrateName = (typeof CRATES)[number]['name'];

/** Every word a question or lesson can say: the long words, the Add-Ons words and their base words, and the near words of "Which word is
 *  hiding" (shown, never said, but a fuller lesson can name them). */
export const WORD_PHRASES: readonly Lowercase<string>[] = [...new Set<Lowercase<string>>([
  ...WORDS.map(w => w.word as Lowercase<string>), ...ADD_ON_WORDS.flatMap(a => [a.word, a.base] as Lowercase<string>[]),
])];
/** Every syllable said alone: the table's and the add-ons'. */
export const SYLLABLE_PHRASES: readonly Syl[] = [...new Set([...SYLLABLES, ...ADD_ONS])].map(syl);
/** What Add-Ons words mean ("not happy"). */
export const MEANINGS: readonly Lowercase<string>[] = [...new Set(ADD_ON_WORDS.map(a => a.means as Lowercase<string>))];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof PORT)[number] | (typeof CRANE)[number]
  | ItemName | RepeatName | HarbourName | ChartWord | VisitorWord | SpecialName | CrateName | TrophyName | RankName | ShipName | Syl
  // the words and meanings come from the tables (all lowercase, unlike every line above); voice.test.ts checks each one has a clip
  | Lowercase<string>;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...QUESTIONS, ...TEACHING, ...MEETING, ...PORT, ...CRANE,
  ...ITEM_NAMES, ...REPEATS.map(r => r.name), ...HARBOURS.map(h => h.name), ...CHART_FIRST, ...CHART_SECOND, ...VISITOR_FIRST, ...VISITOR_SECOND,
  ...SPECIALS.map(s => s.name), 'Lucky Container', ...CRATES.map(c => c.name), ...TROPHIES.map(t => t.name), ...RANK_NAMES, ...SHIP_NAMES,
  ...WORD_PHRASES, ...SYLLABLE_PHRASES, ...MEANINGS,
] as const satisfies readonly Phrase[];
