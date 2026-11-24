// The single typed list of everything Deep Light says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Questions and lessons are whole sentences from the tables in science/things.ts, so each is
// worded once. Prices and counts are chained from number clips ("It costs", "45", "Pearls."), a bought thing from "You got" and its
// name, and an animal is its name, then its fact.
//
// Answer choices that are words or sentences are read out as they light (he can't read "frosted glass" or "It is too quiet." yet),
// and so are pictures whose name he needs ("wax paper", "a horn"); a picture that says itself (a lit cave, a shadow) is not.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { DEEP_CURRENCY } from './branding';
import { ALL_NAMES, TAB_NAMES, type ItemName } from './dock/parts';
import { TRICKS, type Trick } from './dock/subs';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import {
  COPY_Q, FLASH_SAID, HELLO, KEY, KEY_LINE, KEY_Q, LIGHT_THINGS, LOUD_Q, MATERIALS, MIRROR_LINES, MIRROR_Q, MOON, OWN_ASK, PASS_SAID,
  SCHOOL_WORD, SEE_LINES, SEE_Q, SHADOW_LINES, SHADOW_Q, SHADOW_THINGS, SHAKE_Q, SHAKERS, SIGNAL_ITEMS, SIGNAL_LINES, SORT_ASK, SOUND_LINES,
  SOUND_Q3, SOUNDS, SUN_MOON_Q, THROUGH_LINES, THROUGH_Q, WALL_Q, WALL_SAID, WHY_CHOICES, WHY_Q,
} from './science/things';
import { ANIMALS, type AnimalFact, type AnimalName } from './sea/animals';
import { ZONES, type ZoneName } from './sea/zones';

export const NUMBERS_TO = 100;
/** The most Pearls said in one "You earned" line: a perfect Round pays 6, a Dive's treasure up to 3. */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Bright idea!', 'Nice work, captain!', 'Super scientist!'] as const;

type V<T> = T[keyof T];
type SoundQ3 = V<typeof SOUND_Q3>;
const TEACHING = ["Let's look together.", 'Not quite!', 'Try again!', 'Now you try!', 'Tap the lamp!', 'Tap the string!', 'Tap the light!'] as const;
export const SAID_NAMES = { mirror: 'a mirror' } as const;

// ---------- the Dock, the Dive and the Logbook ----------

const DOCK = [
  'The Dock!', 'It costs', 'Pearls.', 'You need', 'more Pearls.', 'Play a Round to earn Pearls!', 'You got', 'You have everything!',
  'You have 1 Dive!', 'Dives!', 'Tap Dive!', 'Play a Round to earn a Dive!', 'You earned a Dive!', 'Next dive:', 'A new place to dive!',
  'You need a stronger Hull to go there!', 'You need a better Claw to go there!', 'You need better Sonar to go there!', 'You need brighter Headlights to go there!',
  'You need a faster Motor to go there!',
  'You can dive deeper!', 'Your light reaches farther!', 'Your sonar reaches farther!', 'You go faster!', 'Your claw reaches farther!', 'Tap the camera to light up the sea!',
] as const;
export const BETTER = {
  hull: 'You can dive deeper!', lights: 'Your light reaches farther!', sonar: 'Your sonar reaches farther!', motor: 'You go faster!', claw: 'Your claw reaches farther!',
  flash: 'Tap the camera to light up the sea!',
} as const;
export const NEEDS_LINE = {
  hull: 'You need a stronger Hull to go there!', claw: 'You need a better Claw to go there!', sonar: 'You need better Sonar to go there!', lights: 'You need brighter Headlights to go there!',
  motor: 'You need a faster Motor to go there!',
} as const;
const DIVE = [
  'Down we go!', 'Hold your finger where you want to go!', 'Hold your light on it!', 'Click!', 'A new animal!', 'Treasure!', 'Time to go up!',
  'Flash!', 'Dive done!', 'You found a new animal!', 'You found', 'new animals!', 'It is in your Logbook!', 'Tap again to leave.',
  'Your sonar found something!', 'You can see it because it makes its own light!',
] as const;
const LOGBOOK = ['The Logbook!', 'Take pictures on a Dive to fill it!', 'Not found yet!'] as const;

type EarnedPhrase = EarnedLine<typeof DEEP_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | V<typeof LOCKED_HINTS> | `${number}`
  // Light to See
  | V<typeof SEE_Q> | V<typeof WHY_Q> | (typeof WHY_CHOICES)[number]['said'] | typeof OWN_ASK | typeof SUN_MOON_Q | V<typeof SEE_LINES>
  | (typeof LIGHT_THINGS)[number]['name'] | typeof MOON.name | V<typeof SAID_NAMES>
  // Through or Not
  | V<typeof THROUGH_Q> | typeof SORT_ASK | typeof WALL_Q | V<typeof PASS_SAID> | V<typeof WALL_SAID> | V<typeof SCHOOL_WORD> | V<typeof THROUGH_LINES>
  | (typeof MATERIALS)[number]['name']
  // Mirrors and Shadows
  | V<typeof MIRROR_Q> | V<typeof MIRROR_LINES> | V<typeof SHADOW_Q> | V<typeof SHADOW_LINES> | (typeof SHADOW_THINGS)[number]['name']
  // Shake and Sound
  | (typeof SOUNDS)[number]['name'] | V<typeof LOUD_Q> | typeof SHAKE_Q | (typeof SHAKERS)[number]['name'] | SoundQ3['q'] | SoundQ3['right'] | SoundQ3['wrong'][number]
  | V<typeof SOUND_LINES>
  // Signals
  | V<typeof HELLO>['q'] | V<typeof HELLO>['lesson'] | (typeof SIGNAL_ITEMS)[number]['said'] | typeof COPY_Q | V<typeof FLASH_SAID> | (typeof KEY)[number]['said']
  | typeof KEY_Q | typeof KEY_LINE | V<typeof SIGNAL_LINES>
  | (typeof TEACHING)[number]
  // the reward
  | (typeof DOCK)[number] | (typeof DIVE)[number] | (typeof LOGBOOK)[number] | Trick | ItemName | V<typeof TAB_NAMES> | ZoneName | AnimalName | AnimalFact;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];
const vals = <T extends object>(o: T) => Object.values(o) as V<T>[];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(DEEP_CURRENCY, i + 1)), ...modePhrases(), ...vals(LOCKED_HINTS), ...numberPhrases(),
  // Light to See
  ...vals(SEE_Q), ...vals(WHY_Q), ...WHY_CHOICES.map(c => c.said), OWN_ASK, SUN_MOON_Q, ...vals(SEE_LINES), ...LIGHT_THINGS.map(t => t.name), MOON.name, ...vals(SAID_NAMES),
  // Through or Not
  ...vals(THROUGH_Q), SORT_ASK, WALL_Q, ...vals(PASS_SAID), ...vals(WALL_SAID), ...vals(SCHOOL_WORD), ...vals(THROUGH_LINES), ...MATERIALS.map(m => m.name),
  // Mirrors and Shadows
  ...vals(MIRROR_Q), ...vals(MIRROR_LINES), ...vals(SHADOW_Q), ...vals(SHADOW_LINES), ...SHADOW_THINGS.map(t => t.name),
  // Shake and Sound
  ...SOUNDS.map(s => s.name), ...vals(LOUD_Q), SHAKE_Q, ...SHAKERS.map(s => s.name), ...vals(SOUND_Q3).flatMap(f => [f.q, f.right, ...f.wrong]), ...vals(SOUND_LINES),
  // Signals
  ...vals(HELLO).flatMap(h => [h.q, h.lesson]), ...SIGNAL_ITEMS.map(s => s.said), COPY_Q, ...vals(FLASH_SAID), ...KEY.map(k => k.said), KEY_Q, KEY_LINE, ...vals(SIGNAL_LINES),
  ...TEACHING,
  // the reward
  ...DOCK, ...DIVE, ...LOGBOOK, ...TRICKS, ...(ALL_NAMES as ItemName[]), ...vals(TAB_NAMES), ...ZONES.map(z => z.name), ...ANIMALS.flatMap(a => [a.name, a.fact]),
]);
