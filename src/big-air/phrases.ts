// The single typed list of everything Big Air says. tools/make_voice.py records a clip for each entry, the build fails if one is missing,
// and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12", "Bolts."), as
// in Jetway and Globe Hopper. Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// Lengths are said with their unit as one clip ("1 foot", "2 feet", "7 inches", "15 centimetres"), so "foot" and "feet" are never
// chained wrong and the voice says each number and its unit together. A jump past 100 feet is said "one hundred" and the rest ("one
// hundred", "34 feet"), so every distance to 999 has a voice.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { ITEM_NAMES, REPEATS, type ItemName, type RepeatName } from './arena/catalog';
import { MOST_JUMP_BOLTS, RANKS } from './arena/arena';
import { MAX_BOLTS } from '../round/rules';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import type { Unit } from './questions/problems';
import { THINGS, type ThingName } from './questions/things';

export const NUMBERS_TO = 100;
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
export const HUNDREDS = ['one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'] as const;
export type Hundred = (typeof HUNDREDS)[number];
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
/** A plain number to 100, said alone (counting hops). */
export const sayN = (n: number): Phrase[] => [`${Math.max(0, Math.min(NUMBERS_TO, Math.round(n)))}` as Phrase];

// ---------- lengths with their unit ----------

export const UNIT_WORDS = { in: ['inch', 'inches'], ft: ['foot', 'feet'], cm: ['centimetre', 'centimetres'] } as const;
type Words = typeof UNIT_WORDS;
export type LengthPhrase = { [U in Unit]: `1 ${Words[U][0]}` | `${number} ${Words[U][1]}` }[Unit];
/** "1 foot", "7 feet": one clip for every length from 1 to 100 in each unit. */
export const lengthLine = (n: number, unit: Unit) => (n === 1 ? `1 ${UNIT_WORDS[unit][0]}` : `${n} ${UNIT_WORDS[unit][1]}`) as LengthPhrase;
/** A length with its unit as clips: "7 inches", or past 100 "one hundred", "34 feet" (or "two hundred", "feet"). */
export function unitSaid(n: number, unit: Unit): Phrase[] {
  const x = Math.max(0, Math.round(n));
  if (x === 0) return ['0', UNIT_WORDS[unit][1]];
  if (x <= NUMBERS_TO) return [lengthLine(x, unit)];
  const h = Math.min(9, Math.floor(x / 100)), rest = x % 100;
  return rest ? [HUNDREDS[h - 1]!, lengthLine(rest, unit)] : [HUNDREDS[h - 1]!, UNIT_WORDS[unit][1]];
}
/** Words for a unit, written: "inches", "feet", "centimetres". */
export const unitWord = (unit: Unit, n = 2) => (n === 1 ? UNIT_WORDS[unit][0] : UNIT_WORDS[unit][1]);
/** Which lengths have a clip. Feet: every one from 1 to 100 (any jump, and past 100 the part after "one hundred"). Inches and centimetres:
 *  every one to 40 (rulers, bars, "It is 30 inches long."), and past that only the whole fives up to 100, since the only longer ones a
 *  question can say are Best Guess's wrong estimates, five or ten times a small thing ("a book: 10 inches or 100 inches?"). game.test.ts
 *  generates every kind of question and checks each length it says is here. */
export const SMALL_UNITS_TO = 40;
export const saysLength = (n: number, unit: Unit) => Number.isInteger(n) && n >= 1 && n <= NUMBERS_TO && (unit === 'ft' || n <= SMALL_UNITS_TO || n % 5 === 0);
export const LENGTHS: LengthPhrase[] = (['ft', 'in', 'cm'] as const).flatMap(u => Array.from({ length: NUMBERS_TO }, (_, i) => i + 1).filter(n => saysLength(n, u)).map(n => lengthLine(n, u)));

/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Jump up to 5 (arena.ts, MOST_JUMP_BOLTS); each is its own line. */
export const MOST_EARNED = Math.max(MAX_BOLTS, MOST_JUMP_BOLTS);

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Arena', 'Tap Jump!', 'You earned a Jump!', 'Tap Go!'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super!', 'Awesome!', 'Way to go!', 'Big air!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  'How many inches long is it?', 'How many centimetres long is it?', 'Tap the numbers. Then tap the check.',
  'Which is longer in real life?', 'or', 'About how long is', 'Would you measure', 'in inches or in feet?',
  'How much longer is the red one than the blue one?', 'The red jump went', 'The blue jump went', 'How much longer was the red jump?',
  'Tap', 'on the tape.', 'The truck jumped', 'Then it went', 'more.', 'Where did it land?',
  // Length Stories
  'The ramp is', 'long.', 'He adds a piece', 'How long is the ramp now?', 'A row of cars is', 'A row of buses is', 'He puts them end to end.', 'How long is that?',
  'The rope is', 'He cuts off', 'How long is the rope now?', 'How much shorter was the blue jump?', 'The blue jump was', 'shorter than the red jump.',
  'How far did the blue jump go?', 'The red jump was', 'longer than the blue jump.', 'How far did the red jump go?',
  'He added', 'to the ramp.', 'Now it is', 'How long was the ramp before?', 'He cut', 'off the rope.', 'How long was the rope before?',
  // Two Units
  'It was measured in inches and in centimetres.', 'Which number is bigger?', 'Which number is smaller?', 'It is',
  'Would it be more inches or fewer inches?', 'Would it be more feet or fewer feet?', 'Would it be more centimetres or fewer centimetres?',
  'The same jump was measured in feet and in inches.', 'The same toy was measured in inches and in centimetres.',
  'Which number is the feet?', 'Which number is the inches?', 'Which number is the centimetres?',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Tap the arrow.',
  'Count the spaces, not the lines.', 'It does not start at zero.', 'That is the number at the end.', 'That is the number at the start.',
  'Read the inch side.', 'Read the centimetre side.', 'Slide it to zero.', 'Start at zero.',
  'Lay the short one on the long one.', 'That is how long the long one is.', 'That is how long the short one is.', 'Count the part left over.',
  "Don't add them. Find the difference.", 'They do not start at the same place.', 'Measure each one first.', 'Check the tens.', 'longer.',
  'Count by tens from zero.', 'Count on by ones.', 'Find the tens first.', 'Then add the ones.', 'It lands on',
  'Here they are next to a child.', 'is about', 'Think how big it is in real life.', 'Small things are measured in inches.', 'Big things are measured in feet.',
  'Put them end to end.', 'Take the piece away.', 'Line them up.', 'plus', 'take away', 'is',
  'A centimetre is smaller than an inch.', 'An inch is smaller than a foot.', 'A centimetre is smaller than a foot.', 'More of them fit.',
  'The smaller unit gives the bigger number.', 'inches.', 'centimetres.', 'feet', 'inches', 'centimetres', '0',
] as const;

// ---------- the Meetings ----------
const MEETING = [
  'This is a ruler.', 'Each space is one inch.', 'Start at zero. Count the spaces.',
  'This is a centimetre.', 'This is a foot.', 'Twelve inches make a foot.', 'Jumps are measured in feet.',
] as const;

// ---------- the Arena ----------
const ARENA = [
  'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Clear this first:', 'Buy this first:',
  'Truck', 'Paint', 'Ramp', 'Rows', 'Tune', 'Records',
  'You have 1 Jump!', 'Jumps!', 'Play a Round to earn a Jump!', 'You can buy more of these!', 'Watch it!', 'It is set up for your next Jump!',
  'Night jumps!', 'Day jumps!', 'Next up:', 'A Show!', 'The crowd grows!', 'It goes faster!', 'Softer landings!', 'A bigger push!',
] as const;

// ---------- the Jump ----------
const JUMP = [
  'Three!', 'Two!', 'One!', 'Go!', 'Hold the pedal!', 'Hold the pedal to go fast!', 'Off the ramp!', 'Tap Boost!', 'Boost!',
  'Hold left or right of the truck to tilt it!', 'Clean landing!', 'Bounce!', 'Crunch!', "Let's see how far!", 'New record!',
  'You cleared it!', 'So close! The wind will help next time.', 'The wind is with you!', 'A head wind!', 'A tail wind!', 'Night show!',
  'You won a Show Cup!', 'You won a trophy for', 'You are now a', 'You are now', 'Great jumping!',
] as const;

type EarnedPhrase = EarnedLine<typeof CUR>;
type Article<N extends string> = N extends `${'A' | 'E' | 'I' | 'O' | 'U'}${string}` ? 'an' : 'a';
type StarLine = { [N in ModeName]: `You are ${Article<N>} ${N} star!` }[ModeName];
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are ${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const RANK_NAMES = RANKS.map(r => r.name);
export const THING_NAMES = THINGS.map(t => t.name) as ThingName[];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | Hundred | LengthPhrase | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof ARENA)[number] | (typeof JUMP)[number]
  | ItemName | RepeatName | (typeof RANKS)[number]['name'] | ThingName;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...HUNDREDS, ...LENGTHS, ...QUESTIONS, ...TEACHING, ...MEETING, ...ARENA, ...JUMP,
  ...new Set([...ITEM_NAMES, ...REPEATS.map(r => r.name), ...RANK_NAMES, ...THING_NAMES]),
] as const satisfies readonly Phrase[];
