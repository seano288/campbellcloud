// The single typed list of everything Coaster Crew says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12",
// "Tokens."), as in Globe Hopper. Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// Every piece, car, ride and thing is a clip of its own, said alone: that is where the voice slips most, so make_voice.py's
// COLLECTION_SPEECH holds the fixes found by listening.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ITEM_NAMES, REPEATS, type ItemName, type RepeatName } from './park/catalog';
import { ALL_PIECES, type PieceName } from './coaster/pieces';
import { RANKS, TROPHIES, type RankName, type TrophyName } from './park/yard';
import { WORDS } from './questions/problems';
import { ACTIONS, GROUNDS, SHEETS, THINGS } from './questions/tables';

export const NUMBERS_TO = 100;
export const PRICE_TOP = 400;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}` as `${number}`);
/** A number as the voice says it: itself to 100, else the whole ten at or above it (up to 400). `exact` says whether that's it. */
export function sayable(x: number): { said: `${number}`; exact: boolean } {
  const n = Math.max(0, Math.round(x));
  if (n <= NUMBERS_TO) return { said: `${n}`, exact: true };
  const ten = Math.min(PRICE_TOP, Math.ceil(n / 10) * 10);
  return { said: `${ten}`, exact: ten === n };
}
/** "You need 12 more Tokens.", or "You need about 140 more Tokens." when it isn't a number the voice has (Turbo Tally's wording). */
export function needLine(x: number): Phrase[] {
  const { said, exact } = sayable(x);
  if (exact && said === '1') return ['You need', '1', 'more Token.'];
  return [exact ? 'You need' : 'You need about', said, 'more Tokens.'];
}
/** The most Tokens said in one "You earned" line: a perfect Round pays 6. (A Ride's pay is said as "You got", "3", "Tokens.") */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Coaster Yard', 'Tap Ride!', 'You earned a Ride!'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super!', 'Awesome!', 'Way to go!', 'What a scientist!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  ...ACTIONS.map(a => a.said), 'Is it a push or a pull?', 'The hand pushes the box.', 'The rope pulls the box.', 'Which way will it go?',
  'A big push and a small push.', 'Which cart will go farther?',
  'Two carts roll down two hills.', 'Which one is faster at the bottom?', 'The cart rolls down the hill.', 'Will it get over the next hill?',
  'Three carts start at three heights.', 'Which one will get over the hill?', 'Three carts start at the same height.', 'Which one will get over its hill?',
  'Both carts get the same push.', 'Which cart needs the bigger push to get going?', 'The carts roll at the same speed.', 'Which cart is harder to stop?',
  'The cart gets the same push each time.', 'On which ground will it go farthest?', 'Which ground will stop it first?',
  'The cart must stop at the station.', 'Which ground should we use?', 'The cart must coast a long way.',
  'A rolling ball hits a ball that is still.', 'What will the still ball do?', 'A bouncy ball rolls at the wall.', 'Which way will it go after it hits?',
  'A rolling ball gets a push from the side.', 'Which way will it go now?',
  'Which one will the magnet pull?', 'Will the magnet pull it?', 'Look at the ends of the two magnets.', 'Will they pull together or push apart?',
  'Two paper clips, one near and one far.', ...SHEETS.map(s => s.said), 'Will the magnet still pull it?',
  ...Object.values(WORDS), ...GROUNDS.map(g => g.name), ...THINGS.map(t => t.short), ...THINGS.map(t => t.name),
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!',
  'Your turn! Tap it to make it move.', 'Your turn! Tap a cart to push it.', 'Your turn! Tap a cart to let it go.', 'Your turn! Tap the ball to roll it.',
  'Your turn! Tap to bring the magnet near.', 'Your turn! Tap to let the magnets go.',
  'A push moves a thing away from you.', 'A pull moves a thing toward you.', 'So it is a push.', 'So it is a pull.',
  'It moves the way it is pushed.', 'It moves the way the rope pulls it.', 'The big push makes it go faster, so it goes farther.', 'A push or a pull is called a force.',
  'This one started higher, so it is going faster.', 'The higher it starts, the faster it goes at the bottom.', 'It can not go higher than where it started.',
  'The next hill is lower than where it started, so it gets over.', 'The next hill is higher than where it started, so it rolls back.',
  'Only the one that started higher than its hill gets over.', 'It does not matter how heavy it is. Only how high it starts.',
  'Both carts get the same push.', 'The full cart is heavy, so it hardly moves. The empty cart is light, so it goes farther.',
  'The same push gets the light cart going. The heavy cart needs a bigger push.', 'The heavy cart is harder to stop. It keeps going for longer.',
  'Rough ground rubs the wheels and slows the cart down.', 'Smooth ground lets it roll a long way.', 'The rubbing is called friction.',
  'The rolling ball gives the still ball a push, so it rolls on the same way.', 'It hits the wall and comes straight back.', 'It bounces off the wall the other way, like in a mirror.',
  'The push from the side adds to the way it was going, so it goes off in between.',
  'Magnets pull things made of iron or steel.', 'They do not pull wood, plastic, paper, glass or rubber.',
  'It is iron or steel, so the magnet pulls it.', 'It is not iron or steel, so the magnet does not pull it.',
  'Different ends pull together.', 'The same ends push apart.', 'A magnet pulls harder when it is near.', 'Too far away, and it can not pull at all.',
  'A magnet can pull through paper, card or cloth.',
] as const;

// ---------- the Coaster Yard ----------
const YARD = [
  'It costs', 'Token.', 'Tokens.', 'You need', 'You need about', 'more Token.', 'more Tokens.', 'You got', 'You can get more of these!', 'It is in your park!',
  'Buy more land to make room for it!', 'It is in your tray!', 'Pick something to put here!', 'Took it off.', 'Day rides!', 'Night rides!',
  'You have 1 Ride!', 'Rides!', 'Build', 'Track', 'Train', 'Park', 'Looks', 'Records', 'Guest Paint', 'Coaster', 'Took off',
  'Oh no! The car can not get over that.', 'It needs to start higher, or get a push.', 'A taller first hill! Now it gets over.', 'A booster! Now it gets over.',
  'Your coaster rolls back. Fix it first!', 'Add some pieces first!', 'Play a Round to earn a Ride!',
] as const;

// ---------- the Ride ----------
const RIDE = [
  'Which coaster?', 'My Coaster', 'or', 'Guest Coaster', 'Your coaster rolls back. Fix it in the Yard first!', 'Build your coaster in the Yard first!', 'Watch it run!',
  'Eek!', 'Woo-hoo!', 'Snap!', 'Tap the camera!', 'Pull the lever!', 'Hold your finger down to put your hands up!', 'Tap again to leave.', 'What a ride!', 'Great photo!',
  'riders went round!', 'Thrill', 'New best!', 'A prize!', 'A new Guest Paint!', 'A new Trophy!', 'You are now a',
] as const;

type EarnedPhrase = EarnedLine<typeof CUR>;
type Article<N extends string> = N extends `${'A' | 'E' | 'I' | 'O' | 'U'}${string}` ? 'an' : 'a';
type StarLine = { [N in ModeName]: `You are ${Article<N>} ${N} star!` }[ModeName];
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are ${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof YARD)[number] | (typeof RIDE)[number]
  | ItemName | PieceName | RepeatName | RankName | TrophyName;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];
export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...QUESTIONS, ...TEACHING, ...YARD, ...RIDE,
  ...ITEM_NAMES, ...ALL_PIECES.map(p => p.name as PieceName), ...REPEATS.map(r => r.name), ...RANKS.map(r => r.name), ...TROPHIES.map(t => t.name),
]);
