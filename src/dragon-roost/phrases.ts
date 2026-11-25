// The single list of everything Dragon Roost says. tools/make_voice.py records a clip for each entry, the build fails if one is missing,
// and voice.test.ts checks every line the game builds at run time is here. Every sentence is one whole clip (so it's said naturally), and
// every word is a clip of its own, so a lesson can say it alone. Numbers and names are clips chained into lines ("It costs", "45",
// "Flames."), as in Math Bots; prices past 100 are whole tens with a clip each (PRICE_TENS), as Turbo Tally's are.
//
// What the three kinds of word are called is in words/terms.ts only, so changing them re-records only those lines.
import { earnedLine } from '../currency/kind';
import { CUR } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { ASK, pluralAsk, shortAsk, squeezeAsk } from './questions/problems';
import { TERM_PHRASES, TERMS } from './words/terms';
import { forAdj, forCapital, forNoun, forVerb, SENTENCES, type Role, type Sentence } from './words/sentences';
import { ONE_JOB } from './words/lexicon';
import { DAYS, MONTHS, NAMES, PLACES } from './words/allowed';
import {
  CHANGING, gapped, LOOKS, PAST_FRAMES_1, PAST_FRAMES_2, PASTS, PLURAL_FRAMES, PLURAL_FRAMES_3, PLURALS, SQUEEZE_SENTENCES, SQUEEZES, squeezed, TIME_FRAMES, VERB_FRAMES, whole,
} from './words/frames';
import { ITEM_NAMES, REPEATS } from './roost/catalog';
import { MARK_NAMES, NAME_ADJECTIVES, NAME_NOUNS, STAGE_NAMES } from './roost/dragons';
import { RANKS, TROPHIES } from './roost/roost';
import { PLACES as FLIGHT_PLACES } from './flight/course';

export type Phrase = string;

export const NUMBERS_TO = 100;
/** The dearest price is 180 (the Golden Egg) and a New Ledge stops at 120, so whole tens are recorded to 200 (economy.test.ts checks). */
export const PRICE_TOP = 200;
export const PRICE_TENS = Array.from({ length: (PRICE_TOP - NUMBERS_TO) / 10 }, (_, i) => `${NUMBERS_TO + 10 * (i + 1)}`);
/** A price as the voice says it: itself to 100, else the whole ten at or above it (up to PRICE_TOP). `exact` says whether that's it. */
export function sayable(x: number): { said: string; exact: boolean } {
  const n = Math.max(0, Math.round(x));
  if (n <= NUMBERS_TO) return { said: `${n}`, exact: true };
  const ten = Math.min(PRICE_TOP, Math.ceil(n / 10) * 10);
  return { said: `${ten}`, exact: ten === n };
}
/** "You need 12 more Flames.", or "You need about 140 more Flames." when it isn't a number the voice has (Turbo Tally's wording). */
export function needLine(x: number): Phrase[] {
  const { said, exact } = sayable(x);
  return x === 1 ? ['You need 1 more Flame.'] : [exact ? 'You need' : 'You need about', said, 'more Flames.'];
}
export const priceLine = (n: number): Phrase[] => ['It costs', sayable(n).said, n === 1 ? 'Flame.' : 'Flames.'];
/** The most Flames said in one "You earned" line: a perfect Round pays 6, a Flight at most 4. */
export const MOST_EARNED = 10;

export const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Tap Fly!', 'You earned a Flight!', 'Tap Next!'];
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Fly high!', 'Super!'];

// ---------- the questions and their lessons ----------

/** The Big Letters Meeting ends on it, and so does a second miss: a day, a month and a place aren't what a child calls a name. */
export const CAPITAL_RULE = 'Names, days, months and places start with a big letter.';
export const TEACH = [
  CAPITAL_RULE,
  'Not quite!', 'Try again!',
  'It names something.', 'It is something you do.', 'It tells what something is like.',
  'It is a person.', 'It is an animal.', 'It is a place.', 'It is a thing.',
  'One dragon flies. Two dragons fly.', 'When one does it, the word ends in s.',
  'Yesterday means it has happened.', 'Tomorrow means it will happen.', 'For yesterday, most words get e d at the end.', 'Some words change for yesterday.',
  'Some words change when there is more than one.', 'Some words stay the same.',
  'Two words can squeeze into one.', 'The apostrophe goes where the letters came out.', "Will not squeezes into won't.",
  'is a name.', 'is a day.', 'is a month.', 'is a place.', 'Names start with a big letter.', 'Days start with a big letter.', 'Months start with a big letter.',
  'Places start with a big letter.', 'It already has a big letter.', 'This one tells about it.',
];
/** "One mouse, two mice." for each word that changes (or doesn't). */
export const pairLine = (one: string, many: string) => `One ${one}, two ${many}.`;
/** "Today I run. Yesterday I ran." for each doing word that changes. */
export const pastLine = (now: string, then: string) => `Today I ${now}. Yesterday I ${then}.`;

// ---------- the Meetings ----------

export const MEET_LINES = {
  plural: 'Here is something new: words for more than one!',
  past: 'Here is something new: words for yesterday!',
  squeeze: 'Here is something new: squeezing two words into one!',
  capital: 'Here is something new: big letters for names!',
  dragonWords: 'Here are some dragon words. They are nouns too!',
  dragonVerbs: 'Watch my dragon do some verbs!',
  dragonLooks: 'Watch my dragon change!',
} as const;
export const meetLines = (m: ModeId): Phrase[] => {
  if (m === 'noun' || m === 'verb' || m === 'adj') return [TERMS[m].meet, TERMS[m].means];
  return [MEET_LINES[m]];
};

// ---------- the Roost ----------

export const ROOST_LINES = [
  'The Roost!', 'It costs', 'Flames.', 'Flame.', 'You need', 'You need about', 'more Flames.', 'You need 1 more Flame.', 'You got',
  'You have 1 Flight!', 'Flights!', 'Play a Round to earn a Flight!', 'Play a Round to warm your eggs!',
  'It is warm! Tap it to hatch!', 'It needs', 'more Rounds.', '1 more Round.', 'Your nests are full!', 'Get a nest or a ledge for another egg!',
  'Wild eggs come after twenty other eggs!', 'Get this first:', 'Hatch!', 'Name your dragon!', 'Pick one word. Then pick another!', 'Hello,',
  'Your dragon flies next!', 'On!', 'Off!', 'It goes on a trick button!',
  'Tap a dragon!', 'Visit the roost', 'Feed', 'Yum!', 'Your best:',
  'Roost', 'Eggs', 'Tricks', 'Gear', 'Colours', 'Toys', 'Places', 'Trophies', 'Dragons', 'You can build more of these!',
  'It warms your eggs!', 'It holds an egg!', 'Another dragon can sit here!', 'It points to the beacons!', 'It stops the wind!', 'It lights the night!',
  'Your eggs got warmer!', 'It flies faster!', 'It climbs faster!', 'It pulls Flames in!', 'Its breath goes further!', 'Another trick button!', 'It has a new breath!',
];

// ---------- the Flight ----------

export const FLIGHT_LINES = [
  'Hold your finger to fly up and down!', 'Hold Breathe to light the beacons!', 'Tap a trick!', 'Light the beacons!', 'A bird! Race it!',
  'You beat the bird!', 'You made it!', 'Every beacon is lit!', 'New best!', 'You lit', 'beacons.', 'out of', 'Your dragon grew!', 'It is young now!',
  'It is a great dragon now!', 'You are now a', 'You won a trophy!', 'Welcome to', 'A new place!', 'Tap again to leave.', 'Night flight!',
  ...MARK_NAMES,
];

// ---------- every word, said alone ----------

const lower = (w: string) => (/^(I|I'm|I'll)$/.test(w) || (NAMES as readonly string[]).includes(w) || (DAYS as readonly string[]).includes(w) || (MONTHS as readonly string[]).includes(w) || (PLACES as readonly string[]).includes(w) ? w : w.toLowerCase());
/** A word as its clip says it: lowercase, except I, names, days, months and places. */
export const wordPhrase = (w: string) => lower(w.replace(/[.!?,]/g, ''));
/** The Meetings' examples (meetings.ts), said alone. */
const MEETING_WORDS = ['king', 'dog', 'hill', 'cake', 'dragon', 'egg', 'wing', 'roost', 'flame', 'fly', 'roar', 'glide', 'flap', 'loop', 'dive', 'big', 'little', 'green', 'happy', 'muddy', 'Sam', 'Monday', 'May', 'Spain'];
const JOB_ROLES: readonly Role[] = ['n', 'N', 'D', 'M', 'P', 'v', 'a'];
/** The words of a sentence a lesson can say alone: in "tap the noun, verb or adjective", any word with one of those jobs (the right one,
 *  or a wrong one said with its own job); in Big Letters, the words to fix and any word that already has its big letter. */
const sentenceWordsSaid = (s: Sentence) => {
  const asked = forNoun(s) || forVerb(s) || forAdj(s), capital = ([1, 2, 3] as const).some(l => forCapital(s, l));
  return s.words.filter(w => (asked && JOB_ROLES.includes(w.role)) || (capital && /^[A-Z]/.test(w.text))).map(w => w.text);
};
/** Every word said alone, and only those (teach.test.ts runs every lesson and checks each word it says is here): the Level 1 and sorting
 *  words, the words of the sentences the lessons say, the Meetings', the plurals' and squeezes', and the words he names a dragon with. */
export const WORDS_SAID: readonly string[] = [...new Set([
  ...ONE_JOB.map(l => l.w), ...SENTENCES.flatMap(sentenceWordsSaid), ...MEETING_WORDS, ...NAME_ADJECTIVES, ...NAME_NOUNS,
  ...CHANGING.map(p => p.one), ...SQUEEZES.map(s => s.word),
].map(wordPhrase))];
/** The two words a squeezed word comes from, said together ("do not"). */
export const FROMS = SQUEEZES.map(s => s.from);

const FRAMES = [...VERB_FRAMES, ...PLURAL_FRAMES, ...PLURAL_FRAMES_3, ...PAST_FRAMES_1, ...PAST_FRAMES_2, ...TIME_FRAMES];
type Star = { [M in ModeId]: string };
export const starLine = (m: ModeId) => (m === 'noun' || m === 'verb' || m === 'adj' ? TERMS[m].star : `You are a ${MODE_NAMES[m]} star!`);
export const openedLine = (m: ModeId) => (m === 'noun' || m === 'verb' || m === 'adj' ? TERMS[m].opened : `You opened ${MODE_NAMES[m]}!`);
void (null as unknown as Star);

const uniq = (xs: readonly string[]) => [...new Set(xs)];
export const PHRASES: readonly Phrase[] = uniq([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)),
  ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(m), openedLine(m)]), ...Object.values(LOCKED_HINTS), ...TERM_PHRASES,
  ...Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}`), ...PRICE_TENS,
  ...Object.values(ASK), ...PLURALS.filter(p => !p.same).map(p => pluralAsk(p.one)),
  ...SQUEEZES.filter(s => s.level === 1).flatMap(s => [squeezeAsk(s.word), shortAsk(s.from)]),
  ...SENTENCES.map(s => s.text), ...FRAMES.flatMap(f => [whole(f), gapped(f)]), ...SQUEEZE_SENTENCES.flatMap(s => [s.text, squeezed(s)]), ...LOOKS.map(l => l.text),
  ...WORDS_SAID, ...FROMS,
  ...TEACH, ...PLURALS.map(p => pairLine(p.one, p.many)), ...PASTS.map(([now, then]) => pastLine(now, then)),
  ...Object.values(MEET_LINES),
  ...ROOST_LINES, ...FLIGHT_LINES,
  ...ITEM_NAMES, ...REPEATS.map(r => r.name), ...RANKS.map(r => r.name), ...TROPHIES.map(t => t.name), ...FLIGHT_PLACES.map(p => p.name), ...STAGE_NAMES,
]);
