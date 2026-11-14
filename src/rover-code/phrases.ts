// The single typed list of everything Rover Code says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers are one clip each, chained into the lines around them ("It costs", "12", "Bolts."),
// as in Math Bots.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { ROVER_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ALL_NAMES, type PaintName, type PartName } from './base/parts';
import { GADGETS, PLANETS, type GadgetName, type PlanetName, type PlanetSaid } from './base/planets';
import type { Dir } from './code/grid';
import type { SpaceThing, Token } from './code/problems';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a trip up to 8. */
export const MOST_EARNED = 12;

const GAME = ['Rover Code!', "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super coding!', 'Awesome!', 'Way to go!', 'Nice driving!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  'Drive the rover to the flag.', 'This program has a bug.', 'Watch it go.', 'Tap the step that is wrong.', 'Which way should it go?',
  'What comes next?', 'What is missing?', 'How many times?', 'Fill in the loops.', 'Which program gets to the flag?',
] as const;
/** The arrows, said as a direction, and the things in a pattern. */
export const DIR_SAID: Record<Dir, 'Up.' | 'Right.' | 'Down.' | 'Left.'> = { U: 'Up.', R: 'Right.', D: 'Down.', L: 'Left.' };
export const THING_SAID: Record<SpaceThing, 'Star.' | 'Moon.' | 'Planet.' | 'Rocket.' | 'Alien.' | 'Sun.'> = { star: 'Star.', moon: 'Moon.', planet: 'Planet.', rocket: 'Rocket.', alien: 'Alien.', sun: 'Sun.' };
export const tokenSaid = (t: Token) => (t.length === 1 ? DIR_SAID[t as Dir] : THING_SAID[t as SpaceThing]);
const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Watch your program.',
  'Bump! A rock is in the way.', 'Oops! That goes off the map.', 'It stopped before the flag.', 'It drove past the flag.',
  'This step went the wrong way.', 'That step is fine.', 'Here is a way to the flag.', 'Count the squares.', 'So it goes', 'times.',
  'This one gets to the flag.', 'Look at the part that repeats.', 'It goes', 'again and again.', 'So next comes', 'So the missing one is',
  'The arrow turns like a clock hand.', 'That way goes here.',
  ...Object.values(DIR_SAID), ...Object.values(THING_SAID),
] as const;
const MEETING = [
  'This is your rover.', 'Tap the arrows to tell it where to go.', 'Then tap Go!', 'Tap Go!',
  'This is a loop.', 'It does the same step again and again.',
] as const;

// ---------- the Space Base ----------
const BASE = [
  'Space Base!', 'Nose', 'Body', 'Fins', 'Engine', 'Paint', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!',
  'Power', 'You have 1 launch ready!', 'launches ready!', 'Tap Launch!', 'Play a Round to earn a launch!', 'You earned a launch!',
  'Next stop', 'Build a stronger rocket to get there!', 'You built everything!', 'Your rocket got stronger!',
] as const;
type GotLine = `You got ${PartName | PaintName}!`;
export const gotLine = (name: PartName | PaintName) => `You got ${name}!` as GotLine;
type ExploredLine = `You explored ${PlanetSaid}!`;
type BackLine = `Welcome back to ${PlanetSaid}!`;
type GadgetLine = `Your rover got ${GadgetName}!`;
export const exploredLine = (said: PlanetSaid) => `You explored ${said}!` as ExploredLine;
export const backLine = (said: PlanetSaid) => `Welcome back to ${said}!` as BackLine;
export const gadgetLine = (name: GadgetName) => `Your rover got ${name}!` as GadgetLine;

// ---------- the trip ----------
const TRIP = [
  'Press the big button to launch!', 'Blast off!', 'Move your finger to steer!', 'Catch the Bolts!', 'Look out!', 'Landing!',
  'Drive to the flag!', 'Hold the arrows to drive!', 'Tap the button to jump!', 'A crystal!', 'Plant your flag!', 'You found', 'crystals!',
  'You found 1 crystal!', 'Tap again to leave.',
] as const;

type EarnedPhrase = EarnedLine<typeof ROVER_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof BASE)[number] | (typeof TRIP)[number]
  | PartName | PaintName | GotLine | PlanetName | ExploredLine | BackLine | GadgetLine;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(ROVER_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...QUESTIONS, ...TEACHING, ...MEETING, ...BASE, ...TRIP,
  ...ALL_NAMES, ...ALL_NAMES.map(gotLine), ...PLANETS.flatMap(p => [p.name, exploredLine(p.said), backLine(p.said)] as const),
  ...Object.values(GADGETS).map(gadgetLine),
] as const satisfies readonly Phrase[];
