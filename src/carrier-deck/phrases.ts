// The single typed list of everything Carrier Deck says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Stories are chains of pieces round their numbers, as Bot Stories' are ("40", "jets are on the
// deck.", "12", "more jets land."): each piece is a clip, and every number to 100 is a clip. Prices past 100 are whole tens with a clip
// each (PRICE_TENS), as Turbo Tally's are, with "You need about 140 more Bolts." for a gap that isn't a whole ten.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { AIRCRAFT_NAMES, ITEM_NAMES, REPEATS, type AircraftName, type ItemName, type RepeatName } from './ship/catalog';
import { YARD_KINDS, type YardKind } from './ship/fleet';
import { CALLS, FIXED, PLACES, PORT_FIRST, PORT_SECOND, type Chart, type CallName, type MissionName, type PlaceName, type PortWord } from './ship/missions';
import { RANKS, SHIP_NAMES, TROPHIES, type RankName, type ShipName, type TrophyName } from './ship/ship';
import { COMPARE, EXTRA, ONE_STEP, piecesOf, SQUADS, TWO_STEP, type CompareId, type OneId, type Slot, type Squad, type TwoId } from './stories/problems';
import { DECK_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';

export const NUMBERS_TO = 100;
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
/** A number as a clip: every number to 100 has one. */
export const said = (n: number) => `${Math.max(0, Math.min(NUMBERS_TO, Math.round(n)))}` as `${number}`;
/** A price as the voice says it: itself to 100, else the whole ten at or above it (up to 400). `exact` says whether that's it. */
export function sayable(x: number): { said: `${number}`; exact: boolean } {
  const n = Math.max(0, Math.round(x));
  if (n <= NUMBERS_TO) return { said: `${n}`, exact: true };
  const ten = Math.min(PRICE_TOP, Math.ceil(n / 10) * 10);
  return { said: `${ten}`, exact: ten === n };
}
/** "You need 12 more Bolts.", or "You need about 140 more Bolts." when it isn't a number the voice has (Turbo Tally's wording). */
export function needLine(x: number): Phrase[] {
  const { said: s, exact } = sayable(x);
  return [exact ? 'You need' : 'You need about', s, 'more Bolts.'];
}
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Mission up to 7 (ship.ts, MOST_MISSION_BOLTS). */
export const MOST_EARNED = 13;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Carrier', 'Chart'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super thinking!', 'Awesome!', 'Way to go!', 'Smooth flying!'] as const;

// ---------- the questions ----------

type LinesOf<T> = T extends { readonly lines: readonly (readonly (infer P)[])[] } ? P : never;
type MiddleOf<T> = T extends { readonly middle: readonly (infer P)[] } ? P : never;
export type StoryPiece = Exclude<LinesOf<(typeof ONE_STEP)[OneId]> | LinesOf<(typeof COMPARE)[CompareId]> | LinesOf<(typeof TWO_STEP)[TwoId]>
  | MiddleOf<(typeof TWO_STEP)[TwoId]> | (typeof EXTRA)[keyof typeof EXTRA][number], Slot | '.' | '?'>;
type AnyLine = readonly string[];
const linesOf = (t: { readonly lines: readonly AnyLine[] }): AnyLine[] => [...t.lines];
export const STORY_PIECES = [...new Set(piecesOf([
  ...Object.values(ONE_STEP).flatMap(linesOf), ...Object.values(COMPARE).flatMap(linesOf),
  ...Object.values(TWO_STEP).flatMap(t => [...linesOf(t), t.middle as AnyLine]), ...(Object.values(EXTRA) as AnyLine[]),
]))] as StoryPiece[];
export type SquadName = `${Squad} Squadron`;
export const SQUAD_NAMES = SQUADS.map(s => `${s} Squadron` as SquadName);

const QUESTIONS = [
  'Turn the wheels to make the number. Then tap the check.', 'Which number sentence fits the story?', 'Listen to the whole story first.',
  // Mission Board
  'How many crates did', 'carry?', 'How many more crates did', 'carry than', 'carry in all?', 'and',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Tap the arrow.', 'Listen again.', 'That makes',
  // the first miss, by the mistake
  'Do more come, or do some go?', 'That number is in the story.', 'What does the story ask?', 'That is only the first step!',
  'Go straight across from the top of the bar.',
  // the deck, acted out
  'Go backwards.', 'Here is the number sentence.',
  // the bar picture
  'This bar is all of them.', 'These are the two parts.', 'This part is missing.', 'We want all of them.', 'Add the parts.', 'Take away to find it.',
  'The big one is the long bar.', 'The small one is the short bar.', 'This is the extra part.', 'Add to find the big one.',
  'First step.', 'Second step.',
  // How Many More
  'Line them up in pairs.', 'These have no partner.', 'Count the ones with no partner.',
  // Which Sum
  'This number sentence fits the story.',
  // Mission Board
  'Count up the lines.', 'Halfway between', 'Take away the shorter bar.', 'Add the bars.',
] as const;

const MEETING = [
  'This is a bar graph.', 'Each bar is a squadron.', 'The bar shows how many crates it carried.', 'Go from the top of the bar across to the numbers.',
  'These numbers count by', 'twos.', 'fives.', 'tens.', 'Tap Go!',
] as const;

// ---------- the Carrier ----------
const CARRIER = [
  'Carrier!', 'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Build this first:',
  'You have 1 Mission ready!', 'Missions ready!', 'Tap Fly!', 'Play a Round to earn a Mission!', 'You earned a Mission!',
  'This aircraft needs a longer deck!', 'You will fly', 'Make room in the hangar first!', 'You can build more of these!', 'Watch the deck!',
  'Tap again to leave.', 'You won a medal!', 'A new ship joined your Fleet!', 'The Yard has a new ship!',
  'Ship', 'Air Wing', 'Paint', 'Tails', 'Flags', 'Fleet', 'Crew', 'Side', 'Top', 'Inside', 'Number',
] as const;

// ---------- the Mission ----------
const MISSION = [
  'Mission', 'Radio call!', 'Night Mission!', 'This aircraft suits the job!',
  'Hold the button to fill the catapult!', 'Let go to launch!', 'Launch!', 'Great launch!', 'The catapult fires!', 'Lift off!',
  'Hold your finger where you want to fly!', 'Fly through the rings!', 'Follow the whale!', 'Follow the dolphins!', 'Follow the turtle!',
  'Follow the ferry!', 'Find the lost boats! Fly low!', 'Fly into the storm clouds!', 'Tap Drop over the island!',
  'Hold your finger low to lower the winch!', 'The winch is coming down.', 'Hold on!', 'Got them!', 'Bullseye!', 'On the island!',
  'Splash! A boat will pick it up.', 'Found one!', 'Photo!', 'Head home!', 'Follow the landing lights down!', 'Too high! Go round!',
  'The deck crew will bring you in.', 'You caught wire', 'Perfect landing!', 'Good landing!', 'Safe landing!', 'Welcome back!',
  'New best!', 'You won a prize!', 'A new patch for your wall!', 'A new deck marking!', 'You reached a new port!', 'You are now a',
  'Great flying!',
] as const;

type EarnedPhrase = EarnedLine<typeof DECK_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const RANK_NAMES = [...RANKS.map(r => r.name), 'Fleet Admiral'] as const;
export const MISSION_NAMES = FIXED.map(f => f.name) as MissionName[];
export const CALL_NAMES = [...new Set(Object.values(CALLS))] as CallName[];
export const PLACE_NAMES = PLACES.map(p => p.name) as PlaceName[];
export const PORT_WORDS = [...new Set([...PORT_FIRST, ...PORT_SECOND])] as PortWord[];
/** A port's name as the voice says it: the six hand-made places are a clip each, a generated port is its two words (pass 2: the Chart said
 *  a generated port's whole name, which has no clip, so it was silent). */
export const portLine = (c: Pick<Chart, 'n' | 'name' | 'first' | 'second'>): Phrase[] => (c.n <= PLACES.length ? [c.name as PlaceName] : [c.first as PortWord, c.second as PortWord]);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | StoryPiece | SquadName | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof CARRIER)[number]
  | (typeof MISSION)[number] | ItemName | AircraftName | RepeatName | MissionName | CallName | PlaceName | PortWord | YardKind | ShipName | RankName | TrophyName;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(DECK_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...STORY_PIECES, ...SQUAD_NAMES, ...QUESTIONS, ...TEACHING, ...MEETING, ...CARRIER, ...MISSION,
  ...ITEM_NAMES, ...AIRCRAFT_NAMES, ...REPEATS.map(r => r.name), ...MISSION_NAMES, ...CALL_NAMES, ...PLACE_NAMES, ...PORT_WORDS, ...YARD_KINDS,
  ...SHIP_NAMES, ...RANK_NAMES, ...TROPHIES.map(t => t.name),
] as const satisfies readonly Phrase[];
