// The single typed list of everything Turbo Tally says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12",
// "Bolts."), as in Math Bots and Rover Code. Lines that name a car's colour are recorded whole, so they sound like one sentence.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { TALLY_CURRENCY } from './branding';
import { ALL_NAMES, SLOT_NAMES, type PartName, type SlotName } from './garage/parts';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { RIVAL_NAMES, type RivalName } from './race/rivals';
import { CUPS, TRACK_NAMES, type CupName, type TrackName } from './race/tracks';
import { CAR_COLOURS, CHART_COLOURS, ORDINALS, type CarColour, type ChartColour, type Ordinal } from './tally/problems';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Race 5. */
export const MOST_EARNED = 6;

const GAME = ["Turbo Tally!", "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Garage', 'Cups'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super counting!', 'Awesome!', 'Way to go!', 'Nice driving!'] as const;

// ---------- words used everywhere ----------
const cap = <S extends string>(s: S) => (s[0]!.toUpperCase() + s.slice(1)) as Capitalize<S>;
/** "First.", said while counting places off. */
export type OrdinalSaid = `${Capitalize<Ordinal>}.`;
export const ordinalSaid = (n: number) => `${cap(ORDINALS[n - 1]!)}.` as OrdinalSaid;
/** "Second place!" */
export type PlaceLine = `${Capitalize<Ordinal>} place!`;
export const placeLine = (n: number) => `${cap(ORDINALS[n - 1]!)} place!` as PlaceLine;

// ---------- the questions ----------
type TapPlace = `Tap the car in ${'first' | 'second' | 'third' | 'fourth' | 'fifth'} place.`;
export const tapPlaceLine = (n: number) => `Tap the car in ${ORDINALS[n - 1]!} place.` as TapPlace;
type WhichPlace = `What place is the ${CarColour} car in?`;
export const whichPlaceLine = (c: CarColour) => `What place is the ${c} car in?` as WhichPlace;
type Passes = `The ${CarColour} car passes one car. What place is it in now?`;
export const passesLine = (c: CarColour) => `The ${c} car passes one car. What place is it in now?` as Passes;
type Passed = `The ${CarColour} car is passed by one car. What place is it in now?`;
export const passedLine = (c: CarColour) => `The ${c} car is passed by one car. What place is it in now?` as Passed;
type HowManyWon = `How many races did the ${ChartColour} car win?`;
export const howManyWonLine = (c: ChartColour) => `How many races did the ${c} car win?` as HowManyWon;
type HowManyMore = { [A in ChartColour]: `How many more races did the ${A} car win than the ${Exclude<ChartColour, A>} car?` }[ChartColour];
export const howManyMoreLine = (a: ChartColour, b: ChartColour) => `How many more races did the ${a} car win than the ${b} car?` as HowManyMore;
type CarWon = `The ${ChartColour} car won`;
export const carWonLine = (c: ChartColour) => `The ${c} car won` as CarWon;
type WonMost = `The ${ChartColour} car won the most.` | `The ${ChartColour} car won the fewest.`;
export const wonMostLine = (c: ChartColour, most: boolean) => `The ${c} car won the ${most ? 'most' : 'fewest'}.` as WonMost;

const QUESTIONS = [
  'Tap the faster car.', 'Tap the slower car.', 'Which sign goes in the middle?',
  'How many tally marks?', 'Make the tally for', 'Which tally shows', 'Tap plus to add a mark. Then tap the check.',
  'Which car won the most races?', 'Which car won the fewest races?', 'How many races did they win in all?',
  'Tap the cars from smallest to biggest.', 'Tap the cars from biggest to smallest.', 'Which number goes between', 'and',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!',
  // Podium
  'Count from the finish line.', 'It passes one car, so it moves up one.', 'One car passes it, so it moves back one.',
  // Faster Car
  'Look at the tens first.', 'Which number is bigger?', 'Which number is smaller?', 'has', 'ten.', 'tens.', 'no tens.', 'one.', 'ones.',
  'is more.', 'is less.', 'Same tens. Look at the ones.', 'The open side faces the bigger number.', 'is more than', 'is less than', 'is the same as',
  'The bigger number is faster.',
  // Tally Board
  'Count the bundles by fives.', 'Then count the ones.', 'That makes', 'Each bundle is five.',
  // Race Chart
  'Count up the column.', 'Look at the top of the bar.', 'Pair them up.', 'These have no partner.', 'more.', 'Count all the races.', 'in all.',
  // Line Up
  'Find the smallest first.', 'Find the biggest first.', 'Look at the number line.', 'is between',
] as const;

const MEETING = [
  'These are tally marks.', 'Each mark is one.', 'The fifth mark goes across.', 'That makes a bundle of five.',
  'Signs compare two numbers.', 'This one means less than.', 'This one means more than.', 'This one means the same.', 'Tap Go!',
] as const;

// ---------- the Garage ----------
const GARAGE = [
  'Garage!', 'Race number', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!',
  'Speed', 'Grip', 'Boost', 'You have 1 Race ready!', 'Races ready!', 'Tap Race!', 'Play a Round to earn a Race!', 'You earned a Race!',
  'You built everything!', 'Your car got faster!', 'Your car grips better!', 'You get more boosts!', 'Beat', 'to win it!', 'Your number is',
  'Good on tarmac!', 'Good on dirt!', 'Good on sand!', 'Good on snow!', 'Good everywhere!',
] as const;
type GotLine = `You got ${PartName}!`;
export const gotLine = (name: PartName) => `You got ${name}!` as GotLine;

// ---------- the Race, the Cups and the shelf ----------
const RACE = [
  'Next up', 'to win', 'to win the', 'Cup Final!', 'Go!', 'Hold your finger where you want to go!', 'Tap Boost to go fast!', 'Boost!',
  'Lap 2!', 'Last lap!', 'You passed a car!', 'Bump!', 'Finish!', 'You!', 'You came first!', 'You came second!', 'You came third!', 'You came fourth!',
  'You beat', 'is getting tired!', 'Great race!', 'What a race!', 'Tap again to leave.', 'A new track is open!', 'Race again!',
  'Watch it go!', 'Open your prize!', 'Cups!', 'Win the track before to open it!', 'You won it!', 'Win the Cup Final to get it!', 'You won every Cup!',
] as const;
type CupLine = `You won the ${CupName}!`;
export const cupLine = (name: CupName) => `You won the ${name}!` as CupLine;

type EarnedPhrase = EarnedLine<typeof TALLY_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const ORDINAL_COUNT = ORDINALS.length;

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof GARAGE)[number] | (typeof RACE)[number]
  | OrdinalSaid | PlaceLine | TapPlace | WhichPlace | Passes | Passed | HowManyWon | HowManyMore | CarWon | WonMost
  | PartName | GotLine | SlotName | RivalName | TrackName | CupName | CupLine;

const each = <T, R>(xs: readonly T[], f: (x: T) => R) => xs.map(f);
export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(TALLY_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...QUESTIONS, ...TEACHING, ...MEETING, ...GARAGE, ...RACE,
  ...ORDINALS.map((_, i) => ordinalSaid(i + 1)), ...ORDINALS.map((_, i) => placeLine(i + 1)), ...[1, 2, 3, 4, 5].map(tapPlaceLine),
  ...each(CAR_COLOURS, whichPlaceLine), ...each(CAR_COLOURS, passesLine), ...each(CAR_COLOURS, passedLine),
  ...each(CHART_COLOURS, howManyWonLine), ...CHART_COLOURS.flatMap(a => CHART_COLOURS.filter(b => b !== a).map(b => howManyMoreLine(a, b))),
  ...each(CHART_COLOURS, carWonLine), ...CHART_COLOURS.flatMap(c => [wonMostLine(c, true), wonMostLine(c, false)]),
  ...ALL_NAMES, ...ALL_NAMES.map(gotLine), ...Object.values(SLOT_NAMES), ...RIVAL_NAMES, ...TRACK_NAMES, ...CUPS.map(c => c.name), ...CUPS.map(c => cupLine(c.name)),
] as const satisfies readonly Phrase[];
