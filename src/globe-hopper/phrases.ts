// The single typed list of everything Globe Hopper says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers and names are one clip each, chained into the lines around them ("It costs", "12",
// "Bolts."), as in Cargo Words. Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// Every continent, ocean, landform and place name is a clip of its own, said alone: that is where the voice slips most, so
// make_voice.py's SAID_AS holds the fixes found by listening.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ITEM_NAMES, REPEATS, type ItemName, type RepeatName } from './base/catalog';
import { SHAPES } from './base/station';
import { RANKS } from './base/base';
import { LAND_SIGNS, WAY_ASKS } from './questions/problems';
import { CONTINENTS } from './world/continents';
import { OCEANS } from './world/oceans';
import { LANDFORMS } from './world/land';
import { FAMOUS, PHOTO_PLACES } from './world/places';

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
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Launch up to 5 (base.ts, MOST_LAUNCH_BOLTS). */
export const MOST_EARNED = 12;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Rocket Base', 'Tap Launch!', 'You earned a Launch!', 'Next'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super!', 'Awesome!', 'Way to go!', 'Out of this world!'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  'Tap', 'Tap the', 'Tap the land.', 'Tap the water.', 'Is there more land or more water on the Earth?',
  'Tap the North Pole.', 'Tap the South Pole.', 'Tap the equator.', 'Is this place north or south of the equator?',
  'Which continent is this?', ...WAY_ASKS, 'Which ocean is between', 'and', 'Which ocean goes all the way round Antarctica?',
  'Find the map sign for', ...LAND_SIGNS, ...LANDFORMS.map(l => l.ask),
  'Tap the cold place.', 'Tap the hot place.', 'It is snowy and icy here.', 'It is hot and steamy here.', 'Where on the Earth could it be? Tap it.',
  'Which place is colder? Tap it.', 'Which place is warmer? Tap it.', 'Tap its pin.',
  'Land', 'Water', 'North', 'South',
] as const;

const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'This is', 'This is the', 'Start at', 'Go north.', 'Go south.', 'Go east.', 'Go west.',
  'It is in', 'It is in the', 'It is between', 'You tapped the',
  'Most of the Earth is covered in water.', 'The land is in colours. The water is blue.', 'Tap right in the middle of a coloured part.', 'Tap right in the middle of the blue.',
  'The North Pole is at the very top of the Earth.', 'The South Pole is at the very bottom of the Earth.', 'The equator goes round the middle of the Earth.',
  'It is halfway between the North Pole and the South Pole.', 'Above the equator is north. Below the equator is south.',
  'This place is above the equator, so it is north.', 'This place is below the equator, so it is south.',
  'Near the equator, the sun shines straight down, so it is hot.', 'Near the poles, the sunlight comes in at a slant, so it is cold.', 'The further from the equator, the colder it gets.',
  ...LANDFORMS.map(l => l.means), ...CONTINENTS.map(c => c.line), ...OCEANS.map(o => o.line),
  'Greenland is the biggest island in the world.',
] as const;

// ---------- the Meetings: each continent, on the globe and the map ----------
const MEETING = ['Here is a new continent!', 'Here it is on the globe. And here it is on the map.', 'Tap Next!'] as const;

// ---------- the Rocket Base ----------
const BASE = [
  'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Build this first:', 'Fly this first:', 'You need a bigger rocket to lift this!',
  'You need a taller tower for this rocket!', 'Build', 'Rockets', 'Parts', 'Paint', 'Payloads', 'Station', 'Photos', 'Logbook',
  'You have 1 Launch!', 'Launches!', 'Play a Round to earn a Launch!', 'You can build more of these!', 'Watch the launch!', 'Tap again to leave.',
  'This rocket can lift', 'This payload weighs', 'It waits for the next Launch.', 'Put it on your Station!', 'Tap a glowing spot to put it there.',
  'Design your module!', 'Shape', 'Colour', 'Windows', 'Solar panels', 'Dish', 'Night launches!', 'Day launches!', 'Your rocket flies next!',
  'Your Station has', 'modules.', 'You have taken', 'photos.', 'Your best launch:', 'Most places in one orbit:', 'You have flown', 'launches.',
  'This rocket is too tall for your tower.', ...SHAPES,
] as const;

// ---------- the Launch and the orbit ----------
const LAUNCH = [
  'Lift off!', 'Hold your finger on the screen to fire the engines!', 'Move your finger left or right to steer!', 'Follow the arrows up through the clouds!',
  'Into the clouds!', 'Bump!', 'Back on the path!', 'Tap to drop the boosters!', 'Tap to drop the main stage!', 'Boosters away!', 'Main stage away!',
  'Look! The sky is turning black.', 'You made it to orbit!', 'Let the payload go! Tap!', 'Payload away!', 'Fly over', 'and take a picture!', 'Then', 'Tap when it is right under the camera!',
  'Not yet!', 'Snap!', 'It went past. Here it comes again!', 'Got it!', 'Free time! Tap to take a picture of anything you fly over.', 'You took a picture of',
  'Coming home!', 'Welcome home!', 'New best!', 'Smoothest launch!', 'Most places in one orbit!', 'A new patch for your wall!', 'You are now a', 'Great flying!',
  'It joined your Station!', 'Your satellite is in orbit!', 'Supplies for the Station!', 'The test payload flew!', 'The booster landed on the pad!', 'The spaceplane landed on the runway!',
  'Night launch!', 'Ten.', 'Nine.', 'Eight.', 'Seven.', 'Six.', 'Five.', 'Four.', 'Three.', 'Two.', 'One.',
] as const;

type EarnedPhrase = EarnedLine<typeof CUR>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export const RANK_NAMES = RANKS.map(r => r.name);

/** Every name said alone: continents, oceans, landforms, places, and the famous places' questions and lines. */
export const NAMES = [
  ...CONTINENTS.map(c => c.name), ...OCEANS.map(o => o.name), ...OCEANS.map(o => `the ${o.name}` as const), ...LANDFORMS.map(l => l.name), ...FAMOUS.map(p => p.name), ...PHOTO_PLACES.map(p => p.name),
  ...FAMOUS.map(f => f.ask), ...FAMOUS.map(f => f.line),
];
type NameSaid = (typeof NAMES)[number];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof BASE)[number] | (typeof LAUNCH)[number]
  | ItemName | RepeatName | (typeof RANKS)[number]['name'] | NameSaid | (typeof SHAPES)[number];

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...QUESTIONS, ...TEACHING, ...MEETING, ...BASE, ...LAUNCH,
  ...ITEM_NAMES, ...REPEATS.map(r => r.name), ...RANK_NAMES, ...new Set(NAMES),
] as const satisfies readonly Phrase[];
