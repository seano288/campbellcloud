// The single typed list of everything Time Flies says. tools/make_voice.py records a clip for each entry, the build
// fails if one is missing, and say() accepts only these.
import { MAX_BOLTS } from '../round/rules';
import { CALENDAR_PHRASES, type CalendarPhrase } from './calendar/calendar';
import { CLOCK_PHRASES } from './clock/speech';
import {
  BOUGHT_COLOURS, BOUGHT_JETS, colourById, COLOURS, JET_IDS, JET_NAMES, MAX_TAIL_NUMBER, SLOTS,
  type BoughtColour, type BoughtJet, type ColourName, type JetId, type JetName, type ModName, type SlotName,
} from './hangar/catalog';
import { PRICES } from './hangar/hangar';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { TROPHY_PHRASES } from './trophies';

// ---------- around the game ----------
const GAME = [
  'Time Flies!', "Let's go!", 'Pick your first plane!', 'Hangar!', 'Round done!', 'Take off!', 'Wow!',
  'Level up!', 'New times!', 'The long hand can point to the three, the six and the nine.',
  'Now the long hand can point to every number.', 'You can build something new!', 'You built everything!',
  "That's the best one!", 'Tap your plane to do a trick!', 'Touchdown!', 'Add Weapons in the Hangar to fire missiles!',
] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Right on time!', 'Super pilot!', 'Awesome!', 'Ace!'] as const;

type EarnedPhrase = 'You earned 1 Bolt!' | `You earned ${number} Bolts!`;
export const earnedBolts = (n: number): EarnedPhrase => (n === 1 ? 'You earned 1 Bolt!' : `You earned ${n} Bolts!`);
type ModePhrase = ModeName | `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], `You are a ${MODE_NAMES[m]} star!`, `You opened ${MODE_NAMES[m]}!`] as const);

// ---------- the Hangar ----------
type Mods<I extends number> = (typeof SLOTS)[number]['mods'][I];
type BoltModName = Mods<1 | 2 | 3>;
type BoughtName = BoltModName | (typeof JET_NAMES)[BoughtJet] | Extract<(typeof COLOURS)[number], { id: BoughtColour }>['name'];
type BoltsPhrase = 'You need 1 more Bolt.' | `You need ${number} more Bolts.`;
type NumberPhrase = `${number}!`;
type VaultPhrase = 'This one is in the Time Lock vault!' | 'Set the clock to open it!' | 'The vault is open!' | `Get ${Mods<3>} first!` | `You got ${Mods<4>}!`;
export type HangarPhrase = JetName | SlotName | ModName | ColourName | `You got ${BoughtName}!` | `You can get ${BoughtName}!` | BoltsPhrase | NumberPhrase | VaultPhrase;

/** The most Bolts anything costs. */
export const MAX_PRICE = Math.max(...Object.values(PRICES.rungs), PRICES.jet, PRICES.colour);
export const needBolts = (n: number): BoltsPhrase => (n === 1 ? 'You need 1 more Bolt.' : `You need ${n} more Bolts.`);
/** "42!": the Tail Number, read aloud as he turns the wheels. */
export const numberLine = (n: number) => `${n}!` as NumberPhrase;

function hangarPhrases(): HangarPhrase[] {
  const bought: BoughtName[] = [
    ...SLOTS.flatMap(s => s.mods.slice(1, 4) as BoltModName[]), ...BOUGHT_JETS.map(j => JET_NAMES[j]),
    ...BOUGHT_COLOURS.map(c => colourById(c).name as BoughtName),
  ];
  return [
    ...Object.values(JET_NAMES), ...SLOTS.map(s => s.name), ...SLOTS.flatMap(s => s.mods), ...COLOURS.map(c => c.name),
    ...bought.map(m => `You got ${m}!` as const), ...bought.map(m => `You can get ${m}!` as const),
    ...Array.from({ length: MAX_PRICE }, (_, i) => needBolts(i + 1)),
    ...Array.from({ length: MAX_TAIL_NUMBER + 1 }, (_, i) => numberLine(i)),
    'This one is in the Time Lock vault!', 'Set the clock to open it!', 'The vault is open!',
    ...SLOTS.map(s => `Get ${s.mods[3]} first!` as const), ...SLOTS.map(s => `You got ${s.mods[4]}!` as const),
  ];
}

// ---------- facts about each Aircraft, one read each time he picks it or buys it ----------
export const FACTS = {
  p51: ['The Mustang could fly over four hundred miles an hour!', 'Its engine has twelve cylinders and a big, roaring voice!', 'Mustangs flew next to the big bombers to keep them safe.'],
  f16: ['The Falcon can fly twice as fast as sound!', 'Its big bubble canopy lets the pilot see all around.', 'Its air intake under the nose looks like a big smile!'],
  f18: ['The Super Hornet takes off and lands on aircraft carriers!', 'Its wings fold up so it fits on the ship.', 'It has two big engines and can fly faster than sound!'],
  f4u: ["The Corsair's wings bend like a seagull's wings!", "Its engine has eighteen cylinders. That's a lot of power!", 'Corsairs flew off big ships far out at sea.'],
  p38: ['The Lightning has two tails, like a giant fork!', 'Its two propellers spin opposite ways to keep it steady.', 'The pilot sits in the middle, between the two long booms.'],
  a10: ['The Warthog is built around a giant gun!', 'It flies low and slow to help soldiers on the ground.', 'It can keep flying even if one engine stops.'],
  f4: ['The Phantom flew for more than sixty years!', 'Its wing tips point up and its tail points down!', 'Two crew sit inside, one in front and one behind.'],
  f14: ["The Tomcat's wings swing back to go super fast!", 'Two crew fly the Tomcat together as a team.', 'Tomcats landed on aircraft carriers out at sea.'],
  f15: ['The Eagle has two big engines and two tall tails!', 'It can climb almost straight up, like a rocket!', 'It hides a big gun inside its wing.'],
  v22: ['The Osprey flies like a plane and lands like a helicopter!', 'Its engines tilt up so it can take off straight up!', 'It can carry twenty-four people in one ride!'],
  f117: ["The Nighthawk's flat, pointy shape helps it sneak past radar!", 'It was a secret plane for years and years.', 'It hides its bombs inside, behind little doors.'],
  f35: ['The F-35 is a stealth jet that is hard to spot on radar!', 'One kind of F-35 can hover like a helicopter!', 'Secret doors open to hide its missiles inside.'],
  f22: ['The Raptor is a super fast stealth jet!', 'Its engine nozzles move up and down to help it turn.', 'Its missiles hide inside until it is time.'],
  sr71: ['The Blackbird flew faster than a rifle bullet!', 'It flew so high it was near the edge of space!', 'Its black paint helped it stay cool while flying fast.'],
} as const satisfies Record<JetId, readonly string[]>;
export type Fact = (typeof FACTS)[JetId][number];

export const PHRASES = [...new Set([
  ...GAME, ...CHEERS, ...Array.from({ length: MAX_BOLTS }, (_, i) => earnedBolts(i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...CLOCK_PHRASES, ...CALENDAR_PHRASES, ...hangarPhrases(), ...JET_IDS.flatMap(j => FACTS[j]), ...TROPHY_PHRASES,
])];
export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | (typeof CLOCK_PHRASES)[number] | CalendarPhrase | HangarPhrase | Fact | (typeof TROPHY_PHRASES)[number];
