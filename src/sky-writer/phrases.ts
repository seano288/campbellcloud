// The single typed list of everything Sky Writer says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Letter names are recorded as "B." (make_voice.py's "Letter B"), numbers as numbers, and a
// letter's stroke words come from the small shared set in letters/strokes.ts (STROKE_WORDS), one clip each, chained one stroke at a time
// while the plane flies it. Prices and counts are chained from number clips ("It costs", "45", "Bolts.").
import { BOLT, earnedLine, type EarnedLine } from '../currency/kind';
import { ALL_NAMES, GEAR, PLANES, TAB_NAMES, TABS, TRICKS, type ItemLine, type ItemName, type Tab } from './airfield/parts';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { FAMILY_IDS, STROKE_WORDS, type FamilyId, type StrokeWord } from './letters/strokes';
import { SHOWS, type ShowName } from './show/places';
import { WORDS, type ShortWord } from './writing/problems';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6. */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Airfield', 'Wall', 'Show'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Great writing!', 'Super flying!', 'You wrote it!'] as const;

// ---------- letters ----------

export const UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] as const;
export type LetterName = `Letter ${(typeof UPPER)[number]}`;
/** A letter's name, said the same for a capital and a lowercase letter; a digit is its number. */
export const nameOf = (ch: string) => (/[0-9]/.test(ch) ? (ch as `${number}`) : (`Letter ${ch.toUpperCase()}` as LetterName));
/** How a letter is asked for: "capital B", "B", "7". */
export const sayLetter = (ch: string): Phrase[] => (/[A-Z]/.test(ch) ? ['capital', nameOf(ch)] : [nameOf(ch)]);

// ---------- the questions ----------

const ASKING = [
  'Trace', 'Write', 'capital', 'Write the word', 'Tap', 'Where does it start? Tap the dot!', 'Which way does it go first?', 'Which line comes second? Tap it!',
  'One letter is backwards. Tap it!', 'Is it tall, small, or a tail letter?', 'Which one sits on the line the right way?', 'One letter floats or sinks. Tap it!',
  'Look!', 'Now write it!', 'Now the next box!',
] as const;
/** What he hears while he writes: never "wrong". */
const WRITING = ['Start at the green dot!', 'Keep going!', 'Stay on the path!', 'Watch the plane!', 'Now you try!', 'Trace the smoke!', 'Lift your finger. Then the next line!'] as const;
const TEACHING = [
  'Let me show you.', 'It starts here.', 'It goes this way first.', 'This line comes first.', 'This line comes second.',
  'This one faces the right way.', 'This one is backwards.', 'This one is upside down.',
  'Tall letters touch the top line.', 'Small letters fit between the middle line and the bottom line.', 'Tail letters hang below the bottom line.',
  'This letter floats.', 'This letter sinks.', 'Letters sit on the bottom line.', 'Tall', 'Small', 'Tail',
  'b starts with the tall line.', 'd starts with the round part.', 'p starts with the long line.', 'q starts with the round part.',
] as const;

/** Meeting a Family: what its letters share, then each one written while it's named. */
export const FAMILY_LINES = {
  lines: 'These capitals are all straight lines.',
  c: 'These letters all start like c.',
  tall: 'These letters start with a line pulled down.',
  bumps: 'These letters go down, then back up and over.',
  slants: 'These letters have slanted lines.',
  rest: 'Here are the last small letters.',
  numbers: 'Now the numbers!',
  capitals: 'Here are the rest of the capitals.',
} as const satisfies Record<FamilyId, string>;
const MEETING = ['A new letter family!', 'Tap Go when you are ready!'] as const;

// ---------- the Airfield, the Show and the Wall ----------

const AIRFIELD = [
  'The Airfield!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You got', 'You bought everything!', 'On!', 'Off!',
  'It flies faster!', 'It turns tighter!', 'It makes more smoke!', 'It speeds up quicker!', 'Play a Round to earn a Show!', 'You earned a Show!', 'Tap Show!',
  'You have 1 Show!', 'You have', 'Shows!', 'Pick a place to fly!', 'Fly a new Show to open it!', 'Pick a trick for your trick button!',
] as const;
const SHOW = [
  'Take off!', 'Hold your finger on the sky to steer!', 'Fly through the rings!', 'Through the ring!', 'Last ring!', 'Wobble!', 'Boing!', 'Loop!', 'Roll!',
  'Zoom!', 'The sky is yours!', 'Draw with your smoke!', 'Keep it as a postcard?', 'You kept a postcard!', 'Your Wall is full!', 'Out of smoke!', 'Show done!',
  'You flew through', 'rings!', 'You earned a patch!', 'A new place to fly!', 'Tap again to leave.', 'Draw something first!',
] as const;
const WALL = ['Your Wall!', 'Tap again to take it down.', 'Draw in Free Sky to make a postcard!', 'Fly a Show to earn its patch!'] as const;

type EarnedPhrase = EarnedLine<typeof BOLT>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export type TabName = (typeof TAB_NAMES)[Tab];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | LetterName | StrokeWord | (typeof ASKING)[number] | (typeof WRITING)[number] | (typeof TEACHING)[number] | (typeof FAMILY_LINES)[FamilyId]
  | (typeof MEETING)[number] | ShortWord | (typeof AIRFIELD)[number] | (typeof SHOW)[number] | (typeof WALL)[number] | ItemName | ItemLine | TabName | ShowName;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(BOLT, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  ...UPPER.map(u => `Letter ${u}` as LetterName), ...STROKE_WORDS, ...ASKING, ...WRITING, ...TEACHING, ...FAMILY_IDS.map(f => FAMILY_LINES[f]), ...MEETING,
  ...WORDS, ...AIRFIELD, ...SHOW, ...WALL, ...ALL_NAMES, ...PLANES.map(p => p.line), ...TRICKS.map(t => t.line), ...GEAR.map(g => g.line),
  ...TABS.map(t => TAB_NAMES[t]), ...SHOWS.map(s => s.name),
]);
