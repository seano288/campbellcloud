// The single typed list of everything Skyline says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs",
// "12", "Bricks."; "3", "rows of", "4"), as in Math Bots and Turbo Tally.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { SKYLINE_CURRENCY } from './branding';
import { BUILDINGS, DISTRICTS, JOB_NAMES, JOB_THINGS, NAMED_JOBS, PAINTS, PARTS, STREET_THINGS, TROPHIES, VEHICLES } from './city/catalog';
import { RANKS } from './city/city';
import { GEN_COLOURS, GEN_KINDS } from './city/gen';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';

/** Every number to 200 has a clip (house numbers go past 100 in Count By), then the hundreds to 1,000. */
export const NUMBERS_TO = 200;
export const HUNDREDS = [300, 400, 500, 600, 700, 800, 900, 1000].map(n => `${n}` as `${number}`);
/** Prices above 100 are whole tens up to 400 (Turbo Tally's pattern), and each of those has a clip too. */
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
/** Can the voice say this number? */
export const canSay = (n: number) => Number.isInteger(n) && n >= 0 && (n <= NUMBERS_TO || (n <= PRICE_TOP && n % 10 === 0) || (n <= 1000 && n % 100 === 0));
/** A number the voice can say: itself if it has a clip, else the whole ten at or above it. `exact` says whether that's it. */
export function sayable(x: number): { said: `${number}`; exact: boolean } {
  const n = Math.max(0, Math.round(x));
  if (canSay(n)) return { said: `${n}`, exact: true };
  const ten = Math.min(PRICE_TOP, Math.ceil(n / 10) * 10);
  return { said: `${ten}`, exact: ten === n };
}
/** "You need 12 more Bricks.", or "You need about 130 more Bricks." when it isn't a number the voice has. */
export function needLine(x: number): Phrase[] {
  const { said, exact } = sayable(x);
  return [exact ? 'You need' : 'You need about', said, 'more Bricks.'];
}
/** The most Bricks said in one "You earned" line: a perfect Round pays 6, a Job up to 5. */
export const MOST_EARNED = 6;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super counting!', 'Awesome!', 'Way to go!', 'Nice building!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  // Equal Groups
  'Do all the buses have the same number of people?', 'How many buses?', 'How many people on each bus?', 'buses.', 'on each.', 'How many people?',
  'groups of', 'How many in all?', 'Which picture shows',
  // Windows
  'How many rows?', 'How many windows in each row?', 'How many windows?', 'Which adding sentence matches the building?',
  'This building has', 'That one has', 'rows of', 'Do they have the same number of windows?',
  // Odd or Even
  'Everyone pairs up for a ride.', 'Does everyone get a partner?', 'Is it odd or even?', 'Is', 'odd or even?', 'Which number is even?', 'Which number is odd?',
  'Which double makes', 'people make two equal teams.', 'How many on each team?',
  // Count By
  'Count by hundreds.', 'Count by tens.', 'Count by fives.', 'Count by threes.', 'Count by fours.', 'What number comes next?', 'What number is missing?',
  // Share It
  'boxes.', 'trucks.', 'Share them fairly.', 'Tap a truck to give it a box. Then tap the check.', 'How many on each truck?', 'on each truck.', 'How many trucks?',
  'Share all the boxes.',
  // Times
  'Which building shows', 'Which one tells about this building?', 'times', 'is the same as which?',
  // shared
  'Yes', 'No', 'Odd', 'Even',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Tap each row to count it.', 'Tap each bus to count it.',
  // groups and rows
  "Let's count each bus.", 'Count the people on each bus.', 'Add the people on each bus.', 'Count the buses.', 'Count the people on one bus.', 'They all have the same.', 'One bus is different.',
  'people in all!', 'Rows go across.', "Let's count the rows.", "Let's count one row.", 'in each row.', 'windows!', 'rows.',
  'make', 'Every row has the same.', 'Not every bus has the same.', 'Tip it on its side.', 'The windows stay the same.',
  'It has the same number of windows.', 'It has a different number of windows.',
  // odd or even
  "Let's pair them up.", 'One is left alone. So it is odd.', 'Everyone has a partner. So it is even.', 'Two equal halves make an even number.', 'and',
  // count by
  'Every jump is',   // share
  'One box for each truck, round and round.', 'Every truck has the same.', "Let's fill the trucks.",
  // times
  'This sign means rows of.', 'is a short way to say', ] as const;

const MEETING = [
  'Here is a new sign.', 'It is a short way to write rows of.', 'This sign has a name.', 'We say times.', 'Tap Go!',
] as const;

// ---------- the City ----------
const CITY = [
  'City!', 'It costs', 'Bricks.', 'You need', 'You need about', 'more Bricks.', 'Play a Round to earn Bricks!', 'Play a Round to earn a Job!',
  'You have 1 Job ready!', 'Jobs ready!', 'Tap Job!', 'You earned a Job!', 'You got', 'Another floor!', 'floors high!', 'New land!',
  'Tap an empty plot to build on it.', 'Tap where it goes.', 'Moved!', 'It needs a big plot.', 'It needs a wide plot.',
  'It needs a small plot.', 'Buy more land to build more!', 'Your building', 'Roof', 'Windows', 'Walls', 'Sign',
  'Buildings', 'Vehicles', 'Paint', 'Street', 'Parts', 'Land', 'New Street', 'Design', 'Trophies', 'Skyline',
  'Your city is a', 'Fly over!', 'Good night!', 'Good morning!', 'This is your tallest tower!', 'It is the top floor!',
  'Open', 'to get it.', 'Do more Jobs to open it!', 'It drives', 'Jobs.', 'It goes faster!', 'It carries more!', 'It flies!',
  'Another block of land!', 'Your city grew!', 'Pick a building.', 'Most in one Job', 'Tallest tower',
  'You can buy this when you have', 'Super City', 'Win it by doing Jobs!',
] as const;

// ---------- the Job ----------
const JOBS = [
  'Hold your finger where you want to go!', 'Go!', 'Last stop!', 'Job done!', 'New best!', 'number', 'Head for the star!',
  'Tap again to leave.', 'You opened a new District!', 'You won',
] as const;

type EarnedPhrase = EarnedLine<typeof SKYLINE_CURRENCY>;
type StarLine = { [M in ModeName]: M extends `${'A' | 'E' | 'I' | 'O' | 'U'}${string}` ? `You are an ${M} star!` : `You are a ${M} star!` }[ModeName];
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a${/^[AEIOU]/.test(name) ? 'n' : ''} ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

/** Everything with a name in the City is one clip. */
export const NAMES = [
  ...BUILDINGS.map(b => b.name), ...VEHICLES.map(v => v.name), ...PAINTS.map(p => p.name), ...STREET_THINGS.map(t => t.name), ...PARTS.map(p => p.name),
  ...NAMED_JOBS.map(j => j.name), ...TROPHIES.map(t => t.name), ...DISTRICTS.map(d => d.name), ...Object.values(JOB_NAMES), ...Object.values(JOB_THINGS),
  ...GEN_KINDS, ...GEN_COLOURS, ...RANKS,
];
export type Name = (typeof NAMES)[number];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof CITY)[number] | (typeof JOBS)[number] | Name;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(SKYLINE_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...HUNDREDS, ...PRICE_TENS, ...QUESTIONS, ...TEACHING, ...MEETING, ...CITY, ...JOBS, ...NAMES,
] as const satisfies readonly Phrase[];

/** A number as its clip (the caller makes sure it's one the voice can say: canSay). */
export const n = (x: number) => `${x}` as Phrase;
/** A name from the City's lists, as its clip. */
export const named = (s: string) => s as Phrase;
