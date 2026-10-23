// The single typed list of everything Chop Chop says. tools/make_voice.py records a clip for each entry, the build fails
// if one is missing, and say() accepts only these.
import { MAX_BOLTS } from '../round/rules';
import { FRACTION_LINES, type FractionPhrase } from './fractions/fraction';
import { problemPhrases } from './fractions/problems';
import {
  BOUGHT_COLOURS, BOUGHT_HELIS, colourById, COLOURS, HELI_IDS, HELI_NAMES, MAX_TAIL_NUMBER, SLOTS,
  type BoughtColour, type BoughtHeli, type ColourName, type HeliId, type HeliName, type ModName, type SlotName,
} from './hangar/catalog';
import { PRICES } from './hangar/helipad';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { TROPHY_PHRASES } from './trophies';

// ---------- around the game ----------
const GAME = [
  'Chop Chop!', "Let's go!", 'Pick your first helicopter!', 'Helipad!', 'Round done!', 'Lift off!', 'Wow!', 'Level up!',
  'You can build something new!', 'You built everything!', 'Tap your helicopter to do a trick!', 'Touchdown!',
  'Add Weapons on the Helipad to fire rockets!', 'The tank is full!', 'You kept trying!',
] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Piece of cake!', 'Super pilot!', 'Awesome!', 'Fair and square!'] as const;

type EarnedPhrase = 'You earned 1 Bolt!' | `You earned ${number} Bolts!`;
export const earnedBolts = (n: number): EarnedPhrase => (n === 1 ? 'You earned 1 Bolt!' : `You earned ${n} Bolts!`);
type ModePhrase = ModeName | `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], `You are a ${MODE_NAMES[m]} star!`, `You opened ${MODE_NAMES[m]}!`] as const);

// ---------- the Helipad ----------
type Mods<I extends number> = (typeof SLOTS)[number]['mods'][I];
type BoltModName = Mods<1 | 2 | 3>;
type BoughtName = BoltModName | (typeof HELI_NAMES)[BoughtHeli] | Extract<(typeof COLOURS)[number], { id: BoughtColour }>['name'];
type BoltsPhrase = 'You need 1 more Bolt.' | `You need ${number} more Bolts.`;
type NumberPhrase = `${number}!`;
type VaultPhrase = 'This one is in the Fuel Lock!' | `Get ${Mods<3>} first!` | `You got ${Mods<4>}!`;
export type HelipadPhrase = HeliName | SlotName | ModName | ColourName | `You got ${BoughtName}!` | `You can get ${BoughtName}!` | BoltsPhrase | NumberPhrase | VaultPhrase;

/** The most Bolts anything costs. */
export const MAX_PRICE = Math.max(...Object.values(PRICES.rungs), PRICES.heli, PRICES.colour);
export const needBolts = (n: number): BoltsPhrase => (n === 1 ? 'You need 1 more Bolt.' : `You need ${n} more Bolts.`);
/** "42!": the Tail Number, read aloud as he turns the wheels. */
export const numberLine = (n: number) => `${n}!` as NumberPhrase;

function helipadPhrases(): HelipadPhrase[] {
  const bought: BoughtName[] = [
    ...SLOTS.flatMap(s => s.mods.slice(1, 4) as BoltModName[]), ...BOUGHT_HELIS.map(h => HELI_NAMES[h]),
    ...BOUGHT_COLOURS.map(c => colourById(c).name as BoughtName),
  ];
  return [
    ...Object.values(HELI_NAMES), ...SLOTS.map(s => s.name), ...SLOTS.flatMap(s => s.mods), ...COLOURS.map(c => c.name),
    ...bought.map(m => `You got ${m}!` as const), ...bought.map(m => `You can get ${m}!` as const),
    ...Array.from({ length: MAX_PRICE }, (_, i) => needBolts(i + 1)),
    ...Array.from({ length: MAX_TAIL_NUMBER + 1 }, (_, i) => numberLine(i)),
    'This one is in the Fuel Lock!', ...SLOTS.map(s => `Get ${s.mods[3]} first!` as const), ...SLOTS.map(s => `You got ${s.mods[4]}!` as const),
  ];
}

// ---------- facts about each Helicopter, one read each time he picks it or buys it ----------
export const FACTS = {
  uh60: ['The Black Hawk can carry eleven soldiers inside!', 'Its tail rotor is tilted to help lift the tail.', 'It has two engines, so it is extra safe.'],
  mh6: ['The Little Bird is small enough to land on a street!', 'Soldiers can ride on benches on the outside!', 'Its body is shaped like an egg.'],
  ah1: ['The Viper is long and skinny, like a snake!', 'Its main rotor has four blades, like a giant fan!', 'Its pilot and gunner sit one behind the other!'],
  uh1: ['Everybody calls this helicopter the Huey!', 'Its rotor has just two big blades.', 'Hueys flew hurt people to the hospital, fast!'],
  lynx: ['The Lynx once set a world speed record!', 'The Lynx can fly a loop, upside down!', 'Its special blade tips help it go fast.'],
  tiger: ['The Tiger was in a James Bond movie!', 'It has an eye on top of its rotor to see far away.', 'It has a spinning gun under its nose, called a turret!'],
  ah64: ['It has a big radar dome on top, like a flying hat.', 'Its spinning rotor is almost fifty feet across!', 'Its tail rotor blades make an X shape!'],
  mi24: ['People call the Hind a flying tank!', 'It carries eight soldiers inside its body!', 'Its two pilots sit in two bubble windows.'],
  ka52: ['The Alligator has two rotors stacked on top of each other!', 'It has no tail rotor at all!', 'Its two pilots sit side by side, like in a car.'],
  ch47: ['The Chinook has two big rotors, one at each end!', 'It can carry a truck under its belly!', 'Chinooks have been flying for more than sixty years.'],
  ch53: ['Its big rotor has seven blades!', 'It has three big engines to lift heavy loads!', 'It can drink fuel from a plane while it flies!'],
  mi26: ['The Halo is the biggest helicopter flying today!', 'It has eight blades on its giant rotor!', 'It once lifted a whole Chinook helicopter!'],
  rah66: ['It was built to be hard for radar to spot!', 'Only two Comanches were ever built!', 'Its tail rotor is a fan hidden inside the tail!'],
  b360: ['It has little wings that help it zoom along, like a plane!', 'Its pilot and gunner sit one behind the other!', 'It was a brand new design for the Army.'],
  raider: ['The Raider X has two rotors, one on top of the other!', 'A big propeller on its tail pushes it forward!', 'Two pilots sit side by side in its cockpit!'],
  blue: ['Its tail has a hidden fan with thirteen blades inside!', 'In the movie, Blue Thunder could fly in a quiet whisper mode!', 'Blue Thunder was built from a little Gazelle helicopter.'],
  airwolf: ['In the TV show, Airwolf had secret guns that popped out!', 'The real Airwolf was a Bell 222 helicopter.', 'In the TV show, Airwolf flew super fast, like a jet!'],
} as const satisfies Record<HeliId, readonly string[]>;
export type Fact = (typeof FACTS)[HeliId][number];

export const PHRASES = [...new Set([
  ...GAME, ...CHEERS, ...Array.from({ length: MAX_BOLTS }, (_, i) => earnedBolts(i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...FRACTION_LINES, ...problemPhrases(), ...helipadPhrases(), ...HELI_IDS.flatMap(h => FACTS[h]), ...TROPHY_PHRASES,
])];
export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | FractionPhrase | HelipadPhrase | Fact | (typeof TROPHY_PHRASES)[number];
