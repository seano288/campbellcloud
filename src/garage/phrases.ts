import { BODY_NAMES, BOUGHT_BODIES, BOUGHT_COLOURS, colourById, COLOURS, MAX_DOOR_NUMBER, MIN_DOOR_NUMBER, SLOTS, type BodyName, type BoughtBody, type BoughtColour, type ColourName, type ModName, type SlotName } from './catalog';
import { PRICES } from './economy';

// ---------- Garage ----------
const GARAGE = ['Garage!', 'You built everything!', 'You can build something new!', 'Wow!', "That's the best one!"] as const;
type Mods<I extends number> = (typeof SLOTS)[number]['mods'][I];
/** The 15 Mods that cost Bolts (not the free defaults or the Legendaries), the top ones, and the Legendaries. */
type BoltModName = Mods<1 | 2 | 3>;
type TopModName = Mods<3>;
type LegendaryName = Mods<4>;
type BoughtBodyName = (typeof BODY_NAMES)[BoughtBody];
type BoughtColourName = Extract<(typeof COLOURS)[number], { id: BoughtColour }>['name'];
type BoltsPhrase = `You need 1 more Bolt.` | `You need ${number} more Bolts.`;
type GaragePhrase = (typeof GARAGE)[number] | BodyName | SlotName | ModName | ColourName
  | `You got ${BoltModName | BoughtBodyName | BoughtColourName}!` | `You can get ${BoltModName | BoughtBodyName | BoughtColourName}!`
  | `${LegendaryName} costs` | `You bought ${LegendaryName}!` | `Get ${TopModName} first!` | BoltsPhrase | NumberPhrase;
/** The most Bolts anything costs. */
export const MAX_PRICE = Math.max(...Object.values(PRICES.rungs), PRICES.body, PRICES.colour);
/** "You need 4 more Bolts." */
export const needBolts = (n: number): BoltsPhrase => (n === 1 ? 'You need 1 more Bolt.' : `You need ${n} more Bolts.`);
/** "42!": the Door Number, read aloud as he turns the wheels. */
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type NumberPhrase = `${Digit}!` | `${Exclude<Digit, 0>}${Digit}!`;
export const numberLine = (n: number) => `${n}!` as NumberPhrase;
const numberPhrases = () => Array.from({ length: MAX_DOOR_NUMBER - MIN_DOOR_NUMBER + 1 }, (_, i) => numberLine(MIN_DOOR_NUMBER + i));
const garagePhrases = (): GaragePhrase[] => {
  const boltMods = SLOTS.flatMap(s => s.mods.slice(1, 4)) as BoltModName[];
  const legendaries = SLOTS.map(s => s.mods[4]), tops = SLOTS.map(s => s.mods[3]);
  const bought = [...boltMods, ...BOUGHT_BODIES.map(b => BODY_NAMES[b]), ...BOUGHT_COLOURS.map(c => colourById(c).name as BoughtColourName)];
  return [
    ...GARAGE, ...Object.values(BODY_NAMES), ...SLOTS.map(s => s.name), ...SLOTS.flatMap(s => s.mods), ...COLOURS.map(c => c.name),
    ...bought.map(m => `You got ${m}!` as const), ...bought.map(m => `You can get ${m}!` as const),
    ...legendaries.map(m => `${m} costs` as const), ...legendaries.map(m => `You bought ${m}!` as const), ...tops.map(m => `Get ${m} first!` as const),
    ...Array.from({ length: MAX_PRICE }, (_, i) => needBolts(i + 1)), ...numberPhrases(),
  ];
};

// ---------- Show Off ----------
const SHOW = ['Show time!'] as const;
export const GARAGE_PHRASES = [...garagePhrases(), ...SHOW];
