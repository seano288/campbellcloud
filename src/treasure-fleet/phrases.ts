// The single typed list of everything Treasure Fleet says. tools/make_voice.py records a clip for each entry, the build fails if one
// is missing, and say() accepts only these. Questions are whole sentences where there are few enough of them ("What is left of the
// palm tree?"), so they sound natural. Directions and grid squares are chained from pieces, as numbers are in Math Bots: "Go",
// "north", "2", "squares." and "Tap", "B.", "2". Letter names are recorded as the capital and a full stop ("B."), Sight Squad's trick,
// because spelled-out letter names misfire.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { FLEET_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { CARDINALS, LAND_SYMS, LETTERS, SIDES, type Cardinal, type KeySym, type Letter, type Rel, type Sym } from './map/map';
import { COUNT_SYMS, type CountSym } from './map/problems';
import { ALL_NAMES, COLOURS, type ColourName, type EmblemName, type PartName } from './fleet/parts';
import { ISLANDS, type IslandName, type TreasureName } from './fleet/islands';

export const NUMBERS_TO = 100;
/** The most Doubloons said in one "You earned" line: a perfect Round pays 6, a Voyage up to 6. */
export const MOST_EARNED = 12;

const GAME = ['Treasure Fleet!', "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Ahoy, well done!', 'Awesome!', 'Way to go!', 'Super sailor!', 'Yo ho ho!'] as const;

// ---------- names of things ----------
const NAME = { palm: 'palm tree', hut: 'hut', cave: 'cave', hill: 'hill', rock: 'rock', dock: 'dock', bridge: 'bridge', river: 'river' } as const;
type Name = (typeof NAME)[KeySym];
const ALL_KEY_SYMS: readonly KeySym[] = ['palm', 'hut', 'cave', 'hill', 'rock', 'dock', 'bridge', 'river'];
type The = `the ${Name}.`;
type A = `a ${Name}.`;
type Short = `${Capitalize<Name>}.`;
/** "It is" + "the hut." */
export const theName = (s: KeySym) => `the ${NAME[s]}.` as The;
/** "This one means" + "a hut." */
export const aName = (s: KeySym) => `a ${NAME[s]}.` as A;
/** "Hut.", said as he looks along a scene or a key. */
export const shortName = (s: KeySym) => `${NAME[s][0]!.toUpperCase()}${NAME[s].slice(1)}.` as Short;

// ---------- Where Is It ----------
const REL_WORDS = { left: 'left of', right: 'right of', above: 'above', below: 'below', north: 'north of', south: 'south of', east: 'east of', west: 'west of' } as const;
type RelWord = (typeof REL_WORDS)[Rel];
type LandName = (typeof NAME)[(typeof LAND_SYMS)[number]];
type SideQ = `What is ${RelWord} the ${LandName}?`;
export const sideQ = (rel: Rel, s: Sym) => `What is ${REL_WORDS[rel]} the ${NAME[s]}?` as SideQ;
/** The two names in a "between" question are said in one fixed order, so there is one clip per pair. */
const pairs = () => LAND_SYMS.flatMap((a, i) => LAND_SYMS.slice(i + 1).map(b => [a, b] as const));
type Land = (typeof LAND_SYMS)[number];
type After<T extends readonly unknown[], X> = T extends readonly [infer H, ...infer R] ? (H extends X ? R[number] : After<R, X>) : never;
type BetweenQ = { [S in Land]: `What is between the ${(typeof NAME)[S]} and the ${(typeof NAME)[After<typeof LAND_SYMS, S> & Land]}?` }[Land];
export const betweenQ = (a: Sym, b: Sym) => {
  const [x, y] = LAND_SYMS.indexOf(a as never) < LAND_SYMS.indexOf(b as never) ? [a, b] : [b, a];
  return `What is between the ${NAME[x]} and the ${NAME[y]}?` as BetweenQ;
};
type FurthestQ = `What is furthest ${Cardinal}?`;
export const furthestQ = (d: Cardinal) => `What is furthest ${d}?` as FurthestQ;
/** Said as a direction lights: on the rose, or for left and right on the map itself. */
export const DIR_LINE = {
  north: 'North is up.', south: 'South is down.', east: 'East is this way.', west: 'West is this way.',
  left: 'Left is this way.', right: 'Right is this way.', above: 'Above is higher up.', below: 'Below is lower down.',
} as const satisfies Record<Rel, string>;

// ---------- Map Key ----------
type SymbolQ = `Tap the symbol for a ${Name}.`;
export const symbolQ = (s: KeySym) => `Tap the symbol for a ${NAME[s]}.` as SymbolQ;
type FindQ = `Tap the ${(typeof NAME)[Sym]} on the map.`;
export const findQ = (s: Sym) => `Tap the ${NAME[s]} on the map.` as FindQ;
const PLURAL = { palm: 'palm trees', hut: 'huts', rock: 'rocks', hill: 'hills' } as const satisfies Record<CountSym, string>;
type CountQ = `How many ${(typeof PLURAL)[CountSym]} are there?`;
export const countQ = (s: CountSym) => `How many ${PLURAL[s]} are there?` as CountQ;
type RiverQ = `What is ${'east' | 'west'} of the river?`;
export const riverQ = (d: 'east' | 'west') => `What is ${d} of the river?` as RiverQ;

// ---------- Grid Square ----------
type LetterPhrase = `Letter ${Letter}`;
/** Recorded as "B." (tools/make_voice.py), so the letter's name comes out clean. */
export const letterSaid = (l: Letter) => `Letter ${l}` as LetterPhrase;
type WhichQ = `Which square is the ${LandName} in?`;
export const whichQ = (s: Sym) => `Which square is the ${NAME[s]} in?` as WhichQ;

// ---------- Follow the Clues ----------
type ToThe = `to the ${LandName}.`;
export const toThe = (s: Sym) => `to the ${NAME[s]}.` as ToThe;

const QUESTIONS = [
  'Which map shows this from above?', 'Start at the star.', 'Tap where the treasure is!', 'Go', 'Then go', 'square.', 'squares.', 'Tap',
  ...CARDINALS,
] as const;
const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'It is', 'Look between them.', 'Look for the one nearest the edge.',
  'Look at the map key.', 'This one means', 'That one means', 'Here it is!', "Let's count them.", 'Count them!', 'So there are',
  'Look across the river.', 'Letters go along the bottom.', 'Numbers go up the side.', 'Here they meet.', 'Look down to the letter.',
  'Look across to the number.', 'So it is', "Let's follow the clues.", 'The treasure is here!', 'Look at each thing.',
  'This map shows it from above.', 'Look at the order.',
  ...Object.values(DIR_LINE),
] as const;
const MEETING = [
  'This is a compass rose.', 'It shows the way on a map.', 'Never Eat Soggy Waffles!', 'Tap north!',
  'This is the map key.', 'Each symbol stands for a real thing.', 'These are grid squares.', 'Say the letter first.', 'Tap the square!',
  'Tap the arrow to go on!',
] as const;

// ---------- the Shipyard ----------
const SHIPYARD = [
  'Shipyard!', 'Hull', 'Sails', 'Cannons', 'Figurehead', 'Flag', 'It costs', 'Doubloons.', 'You need', 'more Doubloons.', 'Play a Round to earn Doubloons!',
  'Range', 'You have 1 voyage ready!', 'voyages ready!', 'Tap Set Sail!', 'Play a Round to earn a voyage!', 'You earned a voyage!',
  'Next stop', 'Build a faster ship to get there!', 'You built everything!', 'Your ship can sail further!', 'This is your sea chart.',
] as const;
type GotLine = `You got ${PartName | EmblemName}!`;
export const gotLine = (name: PartName | EmblemName) => `You got ${name}!` as GotLine;
type FoundLine = `You found ${TreasureName}!`;
type BackLine = `Welcome back to ${IslandName}!`;
export const foundLine = (t: TreasureName) => `You found ${t}!` as FoundLine;
export const backLine = (name: IslandName) => `Welcome back to ${name}!` as BackLine;

// ---------- the Voyage, the Island and the Hoard ----------
const VOYAGE = [
  'Set sail!', 'Touch where you want to go!', 'Grab the barrels!', 'A barrel!', 'Look out! A sea monster!', 'Tap the cannon!', 'Splash!',
  'Land ho!', 'Hold to walk!', 'Tap the button to jump!', 'Find the X!', 'Tap to dig!', 'Keep digging!', 'Treasure!', 'You found gold!',
  'Tap again to leave.', 'The Hoard!', 'Sail further to find this one!', 'Your ship is waiting outside.',
] as const;

type EarnedPhrase = EarnedLine<typeof FLEET_CURRENCY>;
type StarLine = `You are a ${ModeName} star!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a ${name} star!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof SHIPYARD)[number] | (typeof VOYAGE)[number]
  | The | A | Short | SideQ | BetweenQ | FurthestQ | SymbolQ | FindQ | CountQ | RiverQ | LetterPhrase | WhichQ | ToThe
  | PartName | EmblemName | ColourName | GotLine | IslandName | TreasureName | FoundLine | BackLine;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(FLEET_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...QUESTIONS, ...TEACHING, ...MEETING, ...SHIPYARD, ...VOYAGE,
  ...ALL_KEY_SYMS.flatMap(s => [theName(s), aName(s), shortName(s)]),
  ...[...SIDES, ...CARDINALS].flatMap(rel => LAND_SYMS.map(s => sideQ(rel, s))), ...pairs().map(([a, b]) => betweenQ(a, b)), ...CARDINALS.map(furthestQ),
  ...ALL_KEY_SYMS.map(symbolQ), ...(['palm', 'hut', 'cave', 'hill', 'rock', 'dock', 'bridge'] as const).map(findQ), ...COUNT_SYMS.map(countQ), riverQ('east'), riverQ('west'),
  ...LETTERS.map(letterSaid), ...LAND_SYMS.map(whichQ), ...LAND_SYMS.map(toThe),
  ...ALL_NAMES, ...ALL_NAMES.map(gotLine), ...COLOURS.map(c => c.name),
  ...ISLANDS.flatMap(i => [i.name, i.treasure, foundLine(i.treasure), backLine(i.name)] as const),
] as const satisfies readonly Phrase[];
