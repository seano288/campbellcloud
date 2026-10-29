// The single typed list of everything Sight Squad says. tools/make_voice.py records a clip for each entry, the build fails
// if one is missing, and say() accepts only these.
import {
  ARMY_MAX, BOUGHT_COLOURS, BOUGHT_UNITS, colourById, COLOURS, SLOTS, UNIT_IDS, UNITS,
  type BoughtColour, type BoughtUnit, type ColourName, type ModName, type SlotName, type UnitId, type UnitName,
} from './camp/catalog';
import { PRICES } from './camp/camp';
import { earnedLine, needLine, type EarnedLine, type NeedLine } from '../currency/kind';
import { MAX_BOLTS } from '../round/rules';
import { SQUAD_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { TROPHY_PHRASES } from './trophies';
import { LETTER_PHRASES, NOUNS, WORDS, type AnyWord, type Noun, type Word } from './words/list';
import { GAP_TEXTS, SENTENCES, type GapText, type SentenceText } from './words/sentences';

// ---------- around the game ----------
const GAME = [
  'Sight Squad!', "Let's go!", "Pick your army's color!", 'Camp!', 'Round done!', 'Wow!', 'Level up!',
  'You can build something new!', 'You built everything!', 'You kept trying!', 'Tap again to go home.',
] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super reader!', 'Awesome!', 'Way to go, soldier!', 'You can read it!'] as const;

type EarnedPhrase = EarnedLine<typeof SQUAD_CURRENCY>;
type ModePhrase = ModeName | `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], `You are a ${MODE_NAMES[m]} star!`, `You opened ${MODE_NAMES[m]}!`] as const);

// ---------- the words ----------
/** "Find the word said." and the other lines about one word. */
export const findLine = (w: Word) => `Find the word ${w}.` as const;
export const huntLine = (w: Word) => `Find every word that says ${w}.` as const;
export const makeLine = (w: Word) => `Make the word ${w}.` as const;
export const meetLine = (w: Word) => `This word is ${w}.` as const;
export const thisOne = (w: Word) => `This one says ${w}.` as const;
export const thatOne = (w: AnyWord) => `That one says ${w}.` as const;
type WordPhrase = AnyWord | ReturnType<typeof findLine | typeof huntLine | typeof makeLine | typeof meetLine | typeof thisOne> | `That one says ${AnyWord}.`;
const wordPhrases = (): WordPhrase[] => [
  ...WORDS.flatMap(w => [w, findLine(w), huntLine(w), makeLine(w), meetLine(w), thisOne(w), thatOne(w)]),
  ...NOUNS.flatMap((n: Noun) => [n, thatOne(n)]),
];
const TEACHING = [
  'A new word!', 'Say it, spell it, say it!', 'The heart part is tricky. Learn it by heart!', 'Not quite!', "Let's look together.",
  'Try again!', 'Which word is this?', 'Which word is missing?', 'Listen.', 'Not that letter.', 'Tap the letters.',
  'You found one!', 'Tap the word!',
] as const;

// ---------- the Camp ----------
type Mods<I extends number> = (typeof SLOTS)[number]['mods'][I];
type BuyModName = Mods<1 | 2 | 3>;
type BoughtName = BuyModName | (typeof UNITS)[BoughtUnit]['name'] | Extract<(typeof COLOURS)[number], { id: BoughtColour }>['name'];
type NeedPhrase = NeedLine<typeof SQUAD_CURRENCY>;
type VaultPhrase = 'This one is in the Password Lock!' | `Get ${Mods<3>} first!` | `You got ${Mods<4>}!`;
type ArmyPhrase = 'You have 1 soldier!' | `You have ${number} soldiers!`;
type RecruitPhrase = `A new ${UnitName}!` | `The ${UnitName} squad is full!`;
export type CampPhrase = UnitName | SlotName | ModName | ColourName | `You got ${BoughtName}!` | `You can get ${BoughtName}!` | NeedPhrase
  | VaultPhrase | ArmyPhrase | RecruitPhrase;

/** The most Ammo anything costs. */
export const MAX_PRICE = Math.max(...Object.values(PRICES.rungs), PRICES.colour, ...UNIT_IDS.map(u => Math.max(UNITS[u].unlock, UNITS[u].recruit)));
export const armyLine = (n: number): ArmyPhrase => (n === 1 ? 'You have 1 soldier!' : `You have ${n} soldiers!`);
export const newSoldier = (u: UnitId) => `A new ${UNITS[u].name}!` as RecruitPhrase;
export const fullLine = (u: UnitId) => `The ${UNITS[u].name} squad is full!` as RecruitPhrase;

const CAMP = [
  'This one is in the Password Lock!', 'Build the password!', 'The lock is open!', 'Squads!', 'Tap a soldier!',
  'Parade!', 'Forward, march!', 'Tap a word to give an order!', 'Halt!',
  'Battle!', 'Here come the robots!', 'Tap go to start!', 'Charge!', 'Poof!', 'Bounce back!', 'You won!', 'Hooray!',
] as const;

function campPhrases(): CampPhrase[] {
  const bought: BoughtName[] = [
    ...SLOTS.flatMap(s => s.mods.slice(1, 4) as BuyModName[]), ...BOUGHT_UNITS.map(u => UNITS[u].name as BoughtName),
    ...BOUGHT_COLOURS.map(c => colourById(c).name as BoughtName),
  ];
  return [
    ...UNIT_IDS.map(u => UNITS[u].name), ...SLOTS.map(s => s.name), ...SLOTS.flatMap(s => s.mods), ...COLOURS.map(c => c.name),
    ...bought.map(m => `You got ${m}!` as const), ...bought.map(m => `You can get ${m}!` as const),
    ...Array.from({ length: MAX_PRICE }, (_, i) => needLine(SQUAD_CURRENCY, i + 1)),
    ...Array.from({ length: ARMY_MAX }, (_, i) => armyLine(i + 1)),
    ...UNIT_IDS.flatMap(u => [newSoldier(u), fullLine(u)]),
    ...SLOTS.map(s => `Get ${s.mods[3]} first!` as const), ...SLOTS.map(s => `You got ${s.mods[4]}!` as const),
  ];
}

// ---------- facts about each Squad, one read each time he taps it ----------
export const FACTS = {
  rifleman: ['Green plastic army men were first made more than eighty years ago!', 'Toy soldiers have been around for hundreds of years!', 'Riflemen are the biggest squad in a toy army!'],
  scout: ['A scout goes first to look ahead!', 'Scouts use binoculars to see far away!'],
  drummer: ['Long ago, drums told soldiers when to march!', 'The drum helps everyone march in step!'],
  medic: ['A medic helps people who get hurt!', 'A medic carries a bag of bandages!'],
  rocket: ['His rocket launcher sits on his shoulder!', 'This rocket is just pretend. It shoots foam!'],
  dog: ['Army dogs have super sniffing noses!', 'A dog can smell much better than a person can!'],
  para: ['A paratrooper jumps out of a plane!', 'A parachute opens up so he floats down slowly!'],
  jeep: ['A jeep can drive over bumpy hills!', 'Jeeps were made to go almost anywhere!'],
  cannon: ['Long ago, horses pulled the cannons!', 'A cannon has two big wheels!'],
  tank: ['A tank rolls on tracks, not wheels!', 'A real tank is as heavy as ten elephants!'],
} as const satisfies Record<UnitId, readonly string[]>;
type Fact = (typeof FACTS)[UnitId][number];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | WordPhrase | (typeof TEACHING)[number] | (typeof LETTER_PHRASES)[number] | SentenceText | GapText
  | CampPhrase | (typeof CAMP)[number] | Fact | (typeof TROPHY_PHRASES)[number];

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MAX_BOLTS }, (_, i) => earnedLine(SQUAD_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...wordPhrases(), ...TEACHING, ...LETTER_PHRASES, ...SENTENCES.map(s => s.text), ...GAP_TEXTS,
  ...campPhrases(), ...CAMP, ...Object.values(FACTS).flat(), ...TROPHY_PHRASES,
] as const satisfies readonly Phrase[];
