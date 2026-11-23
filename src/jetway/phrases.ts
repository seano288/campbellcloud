// The single typed list of everything Jetway says. tools/make_voice.py records a clip for each entry, the build fails if one is missing,
// and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12", "Bolts."), as
// in Math Bots and Turbo Tally. Numbers past 100 are said as a hundreds clip and the rest ("one hundred", "43"), so every number to 999
// has a voice from 109 clips. Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { AIRLINE_FIRST, AIRLINE_SECOND, ITEM_NAMES, PLANE_NAMES, REPEATS, type ItemName, type RepeatName } from './airport/catalog';
import { CHARTER_PRIZES, TOWNS, type CharterPrizeName, type TownName } from './airport/charter';
import { RANKS, TROPHIES, type TrophyName } from './airport/airport';
import { ROUTE_NAMES, type RouteName } from './airport/routes';
import { JET_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';

export const NUMBERS_TO = 100;
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
export const HUNDREDS = ['one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'] as const;
export type Hundred = (typeof HUNDREDS)[number];
/** Any number to 999 as clips: itself to 100, else "three hundred" and the rest ("three hundred", "6"). */
export function sayNum(x: number): Phrase[] {
  const n = Math.max(0, Math.min(999, Math.round(x)));
  if (n <= NUMBERS_TO) return [`${n}` as Phrase];
  const h = Math.floor(n / 100), rest = n % 100;
  return rest ? [HUNDREDS[h - 1]!, `${rest}` as Phrase] : [HUNDREDS[h - 1]!];
}
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
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Flight up to 9 (airport.ts, MOST_FLIGHT_BOLTS). */
export const MOST_EARNED = 15;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Airport', 'Routes'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super adding!', 'Awesome!', 'Way to go!', 'Smooth flying!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  // stories, said once around the numbers
  'people are on the plane.', 'more get on.', 'How many are on the plane now?',
  'bags are on the plane.', 'bags come off.', 'How many are left?',
  'bags are on the belt.', 'The cart holds', 'How many more bags fill it?',
  'Turn the wheels to make the number. Then tap the check.',
  // Jumbo
  'Which number do the seats show?', 'Which number is this?', 'Which plane holds more?', 'Which plane holds fewer?', 'Which sign goes in the middle?',
  'Which digit is in the hundreds place?', 'Which digit is in the tens place?', 'Which digit is in the ones place?',
  // Ten Hops
  'What is ten more than', 'What is ten less than', 'What is a hundred more than', 'What is a hundred less than',
  'plus', 'take away', 'in two hops.', 'First jump', 'First jump back', 'Now jump', 'Now jump back', 'Where does it land?',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Tap the arrow.',
  'and', 'make', 'That makes', 'hundred.', 'hundreds.', 'ten.', 'tens.', 'one.', 'ones.',
  // Boarding
  'Add the ones first.', "Don't forget the new ten!", 'Ten ones make a new ten.', 'That is one ten and', 'The new ten goes with the tens.',
  'Now add the tens.', 'Ten tens make a hundred.',
  // Unload
  'Take away the ones first.', 'Not enough ones? Break a ten.', 'You need to take', 'and there are only', 'Break a ten.', 'Now there are',
  'Take away', 'Now take away the tens.', 'That leaves', 'Break a hundred.',
  // Missing Bags
  'Hop to the next ten first.', 'Hop to the next ten.', 'Then hop to', 'That is', 'more.', 'Count up from the smaller number.',
  // Jumbo
  'Count the hundreds first.', 'This is the hundreds place.', 'This is the tens place.', 'This is the ones place.',
  'No tens, so the tens digit is zero.', 'No ones, so the ones digit is zero.', 'Look at the hundreds first.', 'Same hundreds. Look at the tens.',
  'Same tens. Look at the ones.', 'is more.', 'is fewer.', 'The open side faces the bigger number.', 'is more than', 'is less than', 'is the same as',
  // Ten Hops
  'Ten more: the tens digit goes up one.', 'Ten less: the tens digit goes down one.', 'A hundred more: the hundreds digit goes up one.',
  'A hundred less: the hundreds digit goes down one.', 'Ten more.', 'Ten less.', 'No tens, so break a hundred.', 'The ones stay the same.', 'Jump the tens first.', 'Then jump the ones.', 'lands on',
] as const;

const MEETING = [
  'This is one seat.', 'Ten seats make a row of ten.', 'Ten rows make a block of a hundred.',
  'Signs compare two numbers.', 'This one means less than.', 'This one means more than.', 'This one means the same.', 'Tap Go!',
] as const;

// ---------- the Airport ----------
const AIRPORT = [
  'Airport!', 'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Build this first:',
  'You have 1 Flight ready!', 'Flights ready!', 'Tap Fly!', 'Play a Round to earn a Flight!', 'You earned a Flight!', 'Fly to',
  'This plane needs', 'to fly!', 'Build', 'to fly here!', 'You will fly',
  'Body', 'Trim', 'Lights', 'Planes', 'Paint', 'Tails', 'Stripes', 'Marks', 'Trucks', 'Signs', 'Garden',
  'You can build more of these!', 'Watch it run!', 'Tap again to leave.', 'You won a Trophy!',
] as const;

// ---------- the Flight ----------
const FLIGHT = [
  'Charter Flight!', 'Charter', 'Hold your finger on the taxiway to lead the plane!', 'Follow the car!', 'Line up!', 'Hold the throttle!',
  'Lift off!', 'Hold your finger where you want to fly!', 'Pick up the stars!', 'Pick up the crates!', 'Tap Drop on the fires!', 'Fire out!',
  'Follow the lights down!', 'Too high! Go around!', 'The plane will land itself.', 'Touchdown!', 'Smooth landing!', 'Good landing!',
  'Bumpy landing!', 'Welcome to', 'New best!', 'A new Route is open!', 'You won a Charter prize!', 'passengers flew with you!',
  'Your airport is now a', 'Great flight!', 'Boom!', 'On the grass you go slow.',
] as const;

type EarnedPhrase = EarnedLine<typeof JET_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const RANK_NAMES = [...RANKS.map(r => r.name), 'Super Hub'] as const;
export type RankName = (typeof RANK_NAMES)[number];
export const PLANE_NAME_LIST = PLANE_NAMES;
export type PlaneName = (typeof PLANE_NAMES)[number];
export type AirlineWord = (typeof AIRLINE_FIRST)[number] | (typeof AIRLINE_SECOND)[number];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | Hundred | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof AIRPORT)[number] | (typeof FLIGHT)[number]
  | ItemName | RepeatName | RouteName | TownName | CharterPrizeName | 'Charter Tail' | TrophyName | RankName | PlaneName | AirlineWord;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(JET_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...HUNDREDS, ...PRICE_TENS, ...QUESTIONS, ...TEACHING, ...MEETING, ...AIRPORT, ...FLIGHT,
  ...ITEM_NAMES, ...REPEATS.map(r => r.name), ...ROUTE_NAMES, ...TOWNS, ...CHARTER_PRIZES.map(p => p.name), 'Charter Tail', ...TROPHIES.map(t => t.name),
  ...RANK_NAMES, ...PLANE_NAMES, ...AIRLINE_FIRST, ...AIRLINE_SECOND,
] as const satisfies readonly Phrase[];
