// The single typed list of everything Sentence Express says. tools/make_voice.py records a clip for each entry, the build fails if
// one is missing, and say() accepts only these. Every sentence is one whole clip (so it's said naturally, a question rising at the
// end), and every word is a clip of its own, so tapping a car says its word. Prices and counts are chained from number clips ("It
// costs", "45", "Bolts."), and a bought thing from "You got" and its name, as in Math Bots.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { BOLT } from '../currency/kind';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { EXTRA_WORDS } from './reading/problems';
import { ALL_WORDS, SENTENCES, wordKey } from './sentences/index';
import type { Name } from './sentences/words';
import type { AskQ, SentenceText } from './sentences/list';
import { LINE, STATIONS, TAB_NAMES, type ItemName } from './shed/catalogue';
import { ITEMS } from './shed/trainset';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round or a Delivery with a long train pays 6. */
export const MOST_EARNED = 6;

const GAME = ["Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Choo choo!', 'Full steam ahead!', 'Nice reading!'] as const;

// ---------- the questions ----------

export const ASKING = [
  'Build the train!', 'Tap the cars in order.', 'Which engine starts the sentence?', 'Which caboose ends it?', 'Which car goes here?',
  'Read it. Then tap its picture!', 'Find the mistake! Tap the car that is wrong.', 'Tap to give it a capital!', 'Which caboose goes here?',
  'Now tap where it goes!', 'Tap to take it off!', 'Listen.',
] as const;
export const TEACHING = [
  "Let's look together.", 'Not quite!', 'Try again!', 'Listen to the train.',
  'A sentence starts with a capital letter.', 'The word I always has a capital letter.', 'A name starts with a capital letter.',
  'This one tells something, so it ends with a period.', 'This one asks something, so it ends with a question mark.',
  'This one shows a big feeling, so it ends with an exclamation mark.', 'Every sentence needs a mark at the end.',
  'Two cars are swapped.', 'This word does not belong.', 'Look!',
] as const;

// ---------- the Shed, the Layout and the Delivery ----------

const SHED = [
  'The Shed!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You got', 'You built everything!',
  'You have 1 Delivery!', 'Deliveries!', 'Tap Deliver!', 'Play a Round to earn a Delivery!', 'You earned a Delivery!',
  'Coupled!', 'Uncoupled!', 'Your engine can pull 6 cars.', 'More track to lay!', 'A bigger table!', 'Put it on your table!',
] as const;
const LAYOUT = [
  'Your Layout!', 'Drag your finger to lay track!', 'You need more track!', 'Tap a piece, then tap the table.', 'Drag to rub out track.',
  'That does not fit there.', 'Put it on a straight track!', 'Put it on an empty square!', 'Scenery!', 'Track!', 'Rub out!',
] as const;
const DELIVERY = [
  'All aboard!', 'Slide to go!', 'Tap the points to switch them!', 'Now take it to Toy Town!', 'Delivered!', 'Toot toot!', 'Ding ding!',
  'I switched the points for you!', 'Whee!', "Let's fix your track!", 'Loading!', 'A gift for your table!', 'Tap again to leave.',
] as const;
type LineStation = Extract<(typeof STATIONS)[number], { cargo: { name: string } }>;
type GoLine = LineStation extends infer S ? S extends { name: infer N extends string; cargo: { name: infer C extends string } } ? `Go to ${N} to pick up ${C}!` : never : never;
type OpenLine = LineStation extends infer S ? S extends { name: infer N extends string } ? `${Capitalize<N>} is open!` : never : never;
export const goLine = (s: (typeof LINE)[number]) => `Go to ${s.name} to pick up ${s.cargo!.name}!` as GoLine;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const openLine = (s: (typeof LINE)[number]) => `${cap(s.name)} is open!` as OpenLine;

type EarnedPhrase = EarnedLine<typeof BOLT>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
/** A word said alone (its clip): lowercase, except "I" and names. Worked out from the sentences' own text. */
type Split<S extends string> = S extends `${infer A} ${infer B}` ? A | Split<B> : S extends `${infer A}${'.' | '?' | '!'}` ? A : S;
type RawWord = Split<SentenceText>;
export type WordPhrase = (RawWord extends infer W extends string ? W extends 'I' | Name ? W : Lowercase<W> : never) | (typeof EXTRA_WORDS)[number];
export const wordPhrase = (w: string) => wordKey(w) as WordPhrase;

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | SentenceText | AskQ | WordPhrase
  | (typeof ASKING)[number] | (typeof TEACHING)[number] | (typeof SHED)[number] | (typeof LAYOUT)[number] | (typeof DELIVERY)[number]
  | GoLine | OpenLine | (typeof TAB_NAMES)[keyof typeof TAB_NAMES] | ItemName;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];

/** Every word any sentence (or a slipped-in wrong word) uses, as its clip says it. */
export const WORDS_SAID = uniq([...ALL_WORDS, ...EXTRA_WORDS]) as WordPhrase[];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(BOLT, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  ...SENTENCES.map(s => s.text), ...SENTENCES.flatMap(s => s.ask.map(([q]) => q as AskQ)), ...WORDS_SAID,
  ...ASKING, ...TEACHING, ...SHED, ...LAYOUT, ...DELIVERY, ...Object.values(TAB_NAMES),
  ...LINE.map(goLine), ...LINE.map(openLine), ...ITEMS.map(i => i.name as ItemName),
]);
