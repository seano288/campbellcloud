// The single typed list of everything Dino Dig says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Every word on the list is recorded alone, and again slowly ("Slowly: cat", recorded as "cat"
// at a slower rate) for the sound boxes to light along with. The voice never says a lone sound or a silly word. Read and Find's
// sentences are said in pieces ("A fox", "in a", "box"), each piece lit as it's said. Prices and counts are chained from number clips
// ("It costs", "45", "Gems."), a bought thing from "You got" and its name, a found bone from "You found" and "the ribs".
import { earnedLine, type EarnedLine } from '../currency/kind';
import { DINO_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { BONE_NAMES, DINOS, FOSSILS, SITES, type BoneId, type DinoLine, type DinoName, type FossilName } from './museum/dinos';
import { ALL_NAMES, GADGETS, GEAR, TAB_NAMES, TABS, type ItemLine, type ItemName, type Tab } from './shop/shop';
import { PATTERN_IDS, WORDS, type PatternId, type Word } from './words/list';
import { SUBJECTS } from './words/pictures';

export const NUMBERS_TO = 100;
/** The most Gems said in one "You earned" line: a perfect Round pays 6. */
export const MOST_EARNED = 10;

const GAME = ["Let's go!", 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Dig', 'Museum', 'Shop'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super reader!', 'You read it!', 'Dino-mite!'] as const;

// ---------- the questions ----------

export type Slowly = `Slowly: ${Word}`;
export const slowly = (w: Word) => `Slowly: ${w}` as Slowly;
const ASKING = [
  'Read the word. Tap its picture!', 'Tap the word', 'This says', 'Make it say', 'Tap the glowing sound!', 'Tap the sound to change.',
  'Now pick the new sound!', 'Which one is a real word?', 'Read it. Tap the picture!',
] as const;
const TEACHING = ['Listen.', 'Try again!', 'This one is a real word.', 'This is the sound to change.'] as const;

/** Read and Find's sentences, in the pieces they're said in. */
const PIECES = ['A big', 'A little', 'I see a', 'I see a big', 'I see a little', 'in a', 'on a', 'and a', 'big', 'little', 'in', 'on'] as const;
export type Subject = `A ${(typeof SUBJECTS)[number]}`;
const SUBJECT_PIECES = SUBJECTS.map(s => `A ${s}` as Subject);

/** Meeting a Pattern: a line that says what's new, then its three example words. */
export const PATTERN_LINES = {
  cvc: 'Words are made of sounds. Each sound gets a box.',
  digraph: 'Two letters can make one sound. They share one box.',
  blend: 'Some words have two sounds side by side. Each sound gets its own box.',
  'magic-e': 'A magic e at the end makes the vowel say its name.',
  team: 'Two vowels can team up to make one sound.',
  r: 'An r after a vowel changes the vowel sound.',
} as const satisfies Record<PatternId, string>;
const MEETING = ['A new sound pattern!', 'Tap Go when you are ready!'] as const;

// ---------- the Dig, the Museum, the run and the shop ----------

const DIG = [
  'A new Dig!', 'Rub the dirt away!', 'Tap the rock to crack it!', 'A bone!', 'Drag it to the crate!', 'A Gem!', 'You found', 'A fossil!',
  'Every bone is in the crate!', 'Off to the Museum!', 'Tap again to leave.', 'Get a better tool to dig deeper!', 'Just for fun!',
  'The skeleton is done!', 'Crack!', 'Smash!', 'Woof!', 'Boom!', 'Whoosh!', 'Splash!', 'Keep digging!', 'Dig here!', 'You need the', 'to dig here!',
  'You have 1 Dig!', 'Digs!', 'You have', 'Tap Dig!', 'Play a Round to earn a Dig!', 'You earned a Dig!',
] as const;
const MUSEUM = [
  'The Museum!', 'Find more bones to finish it!', 'Bring it to life!', 'It is alive!', 'Play as it!', 'out of', 'fossils found!',
  'Find it in a Dig!', 'bones found!', 'Tap a dinosaur to play!',
] as const;
const RUN = ['Hold to walk!', 'Tap to jump!', 'Roar!', 'Yum!', 'You made it!', 'You ate', 'snacks!', 'Bonk!', 'Stomp!', 'Crunch!', 'Home!'] as const;
const SHOP = [
  'The Shop!', 'It costs', 'Gems.', 'You need', 'more Gems.', 'Play a Round to earn Gems!', 'You got', 'You bought everything!',
  'Bring a dinosaur to life first!', 'On!', 'Off!', 'It digs bigger and cracks rocks faster!', 'It opens', 'Pick a dinosaur to dress up!',
] as const;

type EarnedPhrase = EarnedLine<typeof DINO_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);
export type SiteName = (typeof SITES)[number]['name'];
export type BoneName = (typeof BONE_NAMES)[BoneId];
export type TabName = (typeof TAB_NAMES)[Tab];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | Word | Slowly | (typeof ASKING)[number] | (typeof TEACHING)[number] | (typeof PIECES)[number] | Subject | (typeof PATTERN_LINES)[PatternId]
  | (typeof MEETING)[number] | (typeof DIG)[number] | (typeof MUSEUM)[number] | (typeof RUN)[number] | (typeof SHOP)[number]
  | DinoName | DinoLine | FossilName | SiteName | BoneName | TabName | ItemName | ItemLine;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(DINO_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  ...WORDS, ...WORDS.map(slowly), ...ASKING, ...TEACHING, ...PIECES, ...SUBJECT_PIECES, ...PATTERN_IDS.map(p => PATTERN_LINES[p]), ...MEETING,
  ...DIG, ...MUSEUM, ...RUN, ...SHOP, ...DINOS.map(d => d.name), ...DINOS.map(d => d.line), ...FOSSILS.map(f => f.name), ...SITES.map(s => s.name),
  ...Object.values(BONE_NAMES), ...TABS.map(t => TAB_NAMES[t]), ...ALL_NAMES, ...GADGETS.map(g => g.line), ...GEAR.map(g => g.line),
]);
