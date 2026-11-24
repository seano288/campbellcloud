// The single list of everything Moon Base Mail says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and voice.test.ts checks that every line the game can say is on it. Numbers and names are one clip each, chained into the
// lines around them ("It costs", "12", "Bolts."). Prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// Every sentence of every letter is a clip, so the speaker beside it and the lessons can say it; so is every question, every written
// answer, every lesson line ("So the box is in the dome.") and every clue.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { FIRST_ASK, LAST_ASK, ORDER_ASK, PASSAGES } from './mail/index';
import { BASE_WORDS } from './mail/words';
import { DIAGRAMS } from './mail/diagrams';
import { ITEM_NAMES, REPEATS } from './base/catalog';
import { BADGES, NEW_CREW } from './base/base';
import { COLOUR_WORDS, MODULE_WORDS, PLANT_WORDS, ROCK_WORDS, SPECIALS, STATUE_WORDS } from './base/gen';

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
/** The most Bolts said in one "You earned" line: a perfect Round pays 6, a Landing up to 5. */
export const MOST_EARNED = 11;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Moon Base', 'Tap Go!', 'Go'] as const;
export const CHEERS = ['Great reading!', 'You got it!', 'Super!', 'Awesome!', 'Way to go!', 'Out of this world!'] as const;

// ---------- reading the mail ----------
const ASKING = [
  'You have mail!', 'Read the letter.', 'Read the report.', 'Read the sentences.', 'Then tap I read it.', 'Tap the sentence.',
  'Tap the picture.', 'Tap the part.', 'Here are some new words!',
] as const;
const TEACHING = [
  'Not quite!', 'Try again!', 'It says:', "Let's read it together.", "Let's put it in order.", 'First,', 'Next,', 'Then,', 'Last,',
  'This one is about', 'This one too.', 'And this one.', 'So the letter is about', 'But not this one!', 'Look for the clues.',
  'The report does not say that.', 'The report says so.', 'The report says it is not so.', 'Listen again.',
] as const;

// ---------- the reward ----------
const BASE = [
  'It costs', 'Bolts.', 'You need', 'You need about', 'more Bolts.', 'You got', 'Build this first:', 'You need more land first!',
  'You have 1 Landing!', 'Landings!', 'Tap Land!', 'Play a Round to earn a Landing!', 'You earned a Landing!', 'It will come on the next Landing!',
  'Tap a plot to put it there!', 'Your new module is here!', 'Modules', 'Landers', 'Suits', 'Paint', 'Garden', 'Things', 'Buggy', 'Rocks', 'Badges',
  'Tap and hold to move it.', 'You can buy more of these!', 'Walk the base!', 'Tap again to leave.', 'You won a badge!', 'A new crew member!',
  'Here is a moon rock!', 'A special crate!', 'A supply crate for the crew!', 'Moon rock', 'Statue', 'Number', 'Build more modules first!',
  'Your plants grew!',
] as const;
const LANDING = [
  'Hold the engine to slow down!', 'Slide your finger to steer!', 'Get to the lights on the pad!', 'Landing', 'Bump!', 'Big bounce!',
  'Soft as a feather!', 'Nice and soft!', 'Right in the middle!', 'Close to the middle!', 'On the pad!', 'Touchdown!', 'Softest landing!',
  'Closest to the middle!', 'New best!', 'Hop, hop!', 'Great landing!', 'Night landing!', 'Off it goes to the pad!',
] as const;
const WALK = ['Hi, Commander!', 'Moon hop!', 'Look at the Earth!', 'Lights on!', 'Beep boop!', 'Meow!', 'Drive!', 'Walk!', 'Telescope'] as const;

type EarnedPhrase = EarnedLine<typeof CUR>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

/** A line from the tables (a letter's sentence, a question, an answer, a name): any text, typed so a fixed line can't be misspelt. */
export type Said = Lowercase<string> | Capitalize<Lowercase<string>> | `${Capitalize<Lowercase<string>>}${string}`;
export const said = (s: string) => s as Said;

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof ASKING)[number] | (typeof TEACHING)[number] | (typeof BASE)[number] | (typeof LANDING)[number] | (typeof WALK)[number] | Said;

/** Every line of the letters, and everything about them that is said. */
export function mailPhrases(): string[] {
  const out: string[] = [ORDER_ASK.pics, ORDER_ASK.lines, FIRST_ASK, LAST_ASK, 'yes', 'no', 'not in the report'];
  for (const p of PASSAGES) {
    out.push(...p.lines);
    if (p.topic) out.push(p.topic);
    for (const q of p.qs) {
      out.push(q.ask);
      if (q.form === 'words' || q.form === 'label') out.push(q.right, ...q.wrong);
      for (const x of [q.so, q.think, q.says, ...(q.clues ?? [])]) if (x) out.push(x);
    }
  }
  out.push(...BASE_WORDS.map(b => b.word), ...Object.values(DIAGRAMS).flat());
  return out;
}
/** Every name in the reward: things to buy, crew, badges, specials, and the words made things are named from. */
export function rewardPhrases(): string[] {
  return [
    ...ITEM_NAMES, ...REPEATS.map(r => r.name), ...BADGES.map(b => b.name), ...SPECIALS.map(s => s.name),
    ...NEW_CREW.flatMap(c => [c.name, c.line]), 'Home Dome', 'Ava', 'Sam', 'Kit', 'Ben', 'Jo', 'Dot', 'Pip',
    ...COLOUR_WORDS, ...MODULE_WORDS, ...PLANT_WORDS, ...ROCK_WORDS, ...STATUE_WORDS,
  ];
}

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...PRICE_TENS, ...ASKING, ...TEACHING, ...BASE, ...LANDING, ...WALK,
  ...[...new Set([...mailPhrases(), ...rewardPhrases()])].map(said),
] as const satisfies readonly Phrase[];
