// The single typed list of everything Hook and Ladder says. tools/make_voice.py records a clip for each entry, the build fails if
// one is missing, and say() accepts only these. Every content word is a clip of its own (the skill is meaning, so every word he
// sees is also said), and lines are chained from pieces where they would otherwise multiply ("rain", "and", "bow", "make",
// "rainbow"; "It costs", "45", "Bolts."), as in Math Bots and Sentence Express.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { BOLT } from '../currency/kind';
import { SCENES } from './call/scenes';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ACTIONS, FRAMES, THINGS, type Action, type Thing } from './words/endings';
import { COMPOUNDS, SILLY_HALVES } from './words/compounds';
import { OPPOSITES } from './words/opposites';
import { FACTS, GROUP_IDS, GROUPS } from './words/sorting';
import { PAIRS, SCALES } from './words/strong';
import { CATALOGUE, TAB_NAMES, TABS, type ItemName, type TrickLine } from './station/parts';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6. */
export const MOST_EARNED = 6;

const GAME = ["Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Nice work!', 'Super!', 'You are on fire!'] as const;

// ---------- the words ----------

type Groups = typeof GROUPS;
type GroupThing = { [G in keyof Groups]: Groups[G]['things'][number] }[keyof Groups];
type FactWord = (typeof FACTS)[number]['yes' | 'no'][number];
type CompoundWord = (typeof COMPOUNDS)[number]['word' | 'a' | 'b'] | (typeof SILLY_HALVES)[number];
type OppWord = (typeof OPPOSITES)[number]['word' | 'opp'];
type StrongWord = (typeof SCALES)[number]['words'][number] | (typeof PAIRS)[number]['words'][number];
type EndingWord = Thing | `${Thing}s` | Action | `${Action}${'s' | 'ed' | 'ing'}`;
type GroupName = Groups[keyof Groups]['plural'];
/** A word said alone. */
export type WordPhrase = CompoundWord | OppWord | GroupThing | FactWord | EndingWord | StrongWord | GroupName;
export const wordPhrase = (w: string) => w as WordPhrase;

const uniq = <T,>(xs: readonly T[]) => [...new Set(xs)];
export const WORDS_SAID: readonly WordPhrase[] = uniq<WordPhrase>([
  ...COMPOUNDS.flatMap(c => [c.word, c.a, c.b]), ...SILLY_HALVES,
  ...OPPOSITES.flatMap(o => [o.word, o.opp]),
  ...GROUP_IDS.flatMap(g => [...GROUPS[g].things, GROUPS[g].plural]), ...FACTS.flatMap(f => [...f.yes, ...f.no]),
  ...THINGS.flatMap(t => [t, `${t}s` as const]), ...ACTIONS.flatMap(a => [a, `${a}s` as const, `${a}ed` as const, `${a}ing` as const]),
  ...SCALES.flatMap(s => s.words), ...PAIRS.flatMap(p => p.words),
]);

// ---------- the questions ----------

export const ASKING = [
  'What word do they make?', 'Tap where it splits into two words!', 'and what makes a real word?',
  'Tap the opposite of', 'What is the opposite of', 'It is...',
  'Then tap the check!', 'Which one does not belong?', 'and', 'are all...',
  'Tap the word that matches the picture!', 'Which word fits?', 'Which word is hiding in', 'or',
] as const;
export type SortAsk = `Tap all the ${GroupName}!`;
export const sortAsk = (g: keyof Groups) => `Tap all the ${GROUPS[g].plural}!` as SortAsk;
type More = (typeof SCALES)[number]['more'] | (typeof PAIRS)[number]['more'];
type Most = (typeof SCALES)[number]['most'];
export type MoreAsk = `Which is ${More}?`;
export type MostAsk = `Which is the ${Most}?`;
export const moreAsk = (more: string) => `Which is ${more}?` as MoreAsk;
export const mostAsk = (most: string) => `Which is the ${most}?` as MostAsk;
type FactAsk = (typeof FACTS)[number]['ask'] | (typeof FACTS)[number]['says'];
type OrderAsk = (typeof SCALES)[number]['order'];
type SaySentence = NonNullable<(typeof OPPOSITES)[number]['say']>;
type FrameStart = (typeof FRAMES)[number]['start'];

export const TEACHING = [
  "Let's look together.", 'Not quite!', 'Try again!', 'Look!', 'Listen.',
  'Two words make one word!', 'make', 'is not a word.', 'It splits here.',
  'are opposites.',
  'More than one.', 'Just one.', 'It already happened.', 'It is happening now.', 'It happens every day.', 'has', 'hiding in it.',
  'is', 'than', 'From a little to a lot!',
] as const;
export type GroupLine = `These are all ${GroupName}.`;
type One = Groups[keyof Groups]['one'];
export type NotLine = `is not ${One}.`;
export const groupLine = (g: keyof Groups) => `These are all ${GROUPS[g].plural}.` as GroupLine;
export const notLine = (g: keyof Groups) => `is not ${GROUPS[g].one}.` as NotLine;
/** The comparing words said alone in a lesson: "huge", "is", "bigger", "than", "big". */
type MoreWord = More | Most;

// ---------- the Station, the Town and the Call ----------

const STATION = [
  'The Station!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You got', 'You have everything!',
  'You have 1 Call!', 'Calls!', 'Tap Call!', 'Play a Round to earn a Call!', 'You earned a Call!',
  'Your water reaches higher!', 'Your spray is wider!', 'Your ladder reaches higher!', 'Your tank holds more!',
  'Next call:', 'Badges!', 'Answer more Calls to fill your wall!', 'Put it on!',
] as const;
const TOWN = ['The Town!', 'says thank you!', 'Answer a Call to build here!', 'Tap a building to go there again!'] as const;
const CALL = [
  'Off to', 'Tap the siren!', 'Drag your finger to spray!', 'Tap them to send the ladder!', 'Refilling!', 'Out!', 'Saved!',
  'Thank you!', 'Help!', 'Meow!', 'Woof!', 'A stronger Pump will reach that one!', 'A longer Ladder will reach them!',
  'A bigger Tank sprays longer!', 'Here comes help!', 'All the fires are out!', 'You got a new badge!', 'It is in your Town now!',
  'Tap again to leave.', 'Drop it!', 'Call done!', 'Wee-oo!',
] as const;
type SceneName = (typeof SCENES)[number]['name'];
export const sceneName = (id: string) => (SCENES.find(s => s.id === id)?.name ?? SCENES[0]!.name) as SceneName;
type TabName = (typeof TAB_NAMES)[keyof typeof TAB_NAMES];

type EarnedPhrase = EarnedLine<typeof BOLT>;
type StarLine = `You are a ${Exclude<ModeName, 'Opposites' | 'Endings'>} star!` | `You are an ${'Opposites' | 'Endings'} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are ${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS] | `${number}`
  | WordPhrase | (typeof ASKING)[number] | SortAsk | MoreAsk | MostAsk | FactAsk | OrderAsk | SaySentence | FrameStart
  | (typeof TEACHING)[number] | GroupLine | NotLine | MoreWord
  | (typeof STATION)[number] | (typeof TOWN)[number] | (typeof CALL)[number] | SceneName | TabName | ItemName | TrickLine;

export const PHRASES = uniq<Phrase>([
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(BOLT, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS), ...numberPhrases(),
  ...WORDS_SAID, ...ASKING, ...GROUP_IDS.map(sortAsk), ...SCALES.flatMap(s => [moreAsk(s.more), mostAsk(s.most), s.order, s.more, s.most]),
  ...PAIRS.flatMap(p => [moreAsk(p.more), p.more]), ...FACTS.flatMap(f => [f.ask, f.says]),
  ...OPPOSITES.flatMap(o => ('say' in o && o.say ? [o.say] : [])), ...FRAMES.map(f => f.start),
  ...TEACHING, ...GROUP_IDS.flatMap(g => [groupLine(g), notLine(g)]),
  ...STATION, ...TOWN, ...CALL, ...SCENES.map(s => s.name), ...TABS.map(t => TAB_NAMES[t]),
  ...TABS.flatMap(t => CATALOGUE[t].flatMap(i => [i.name as ItemName, ...(i.trick ? [i.trick as TrickLine] : [])])),
]);
