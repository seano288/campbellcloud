// The Camp's parts: ten Squads of green plastic toy soldiers (the Riflemen are his from the start, the rest unlocked with
// Ammo), six Slots of Gear the whole army wears, each with a free default plus four Mods (Rungs 1-3 bought with Ammo and
// a Legendary Rung 4 kept in the Password Lock), and twelve Team Colours. Prices follow the other games: Mods cost 5, 15
// and 30 Ammo by Rung, a Colour 3.
export const UNIT_IDS = ['rifleman', 'scout', 'drummer', 'medic', 'rocket', 'dog', 'para', 'jeep', 'cannon', 'tank'] as const;
export type UnitId = (typeof UNIT_IDS)[number];
export const STARTER_UNIT = 'rifleman' satisfies UnitId;
/** How many soldiers his army starts with. */
export const STARTING_ARMY = 3;

export interface UnitInfo {
  readonly name: string;
  /** Ammo to unlock the Squad (the first soldier comes with it); 0 for the starter. */
  readonly unlock: number;
  /** Ammo for each soldier after that. */
  readonly recruit: number;
  /** The most of them the army can have. */
  readonly max: number;
}
export const UNITS = {
  rifleman: { name: 'Rifleman', unlock: 0, recruit: 2, max: 24 },
  scout: { name: 'Scout', unlock: 10, recruit: 3, max: 8 },
  drummer: { name: 'Drummer', unlock: 10, recruit: 3, max: 4 },
  medic: { name: 'Medic', unlock: 12, recruit: 3, max: 4 },
  rocket: { name: 'Rocket Trooper', unlock: 15, recruit: 4, max: 8 },
  dog: { name: 'Army Dog', unlock: 15, recruit: 4, max: 4 },
  para: { name: 'Paratrooper', unlock: 20, recruit: 5, max: 6 },
  jeep: { name: 'Jeep', unlock: 25, recruit: 8, max: 3 },
  cannon: { name: 'Cannon', unlock: 25, recruit: 8, max: 3 },
  tank: { name: 'Tank', unlock: 30, recruit: 12, max: 3 },
} as const satisfies Record<UnitId, UnitInfo>;
export type UnitName = (typeof UNITS)[UnitId]['name'];
export type BoughtUnit = Exclude<UnitId, typeof STARTER_UNIT>;
export const BOUGHT_UNITS = UNIT_IDS.filter((u): u is BoughtUnit => u !== STARTER_UNIT);
export const ARMY_MAX = UNIT_IDS.reduce((n, u) => n + UNITS[u].max, 0);

export const SLOTS = [
  { id: 'helmet', name: 'Helmet', icon: '🪖', mods: ['Soft Cap', 'Helmet', 'Star Helmet', 'Plume Helmet', 'Viking Horns'] },
  { id: 'pack', name: 'Pack', icon: '🎒', mods: ['No Pack', 'Backpack', 'Radio Pack', 'Jet Pack', 'Dragon Wings'] },
  { id: 'flag', name: 'Flag', icon: '🚩', mods: ['No Flag', 'Little Flag', 'Big Flag', 'Banner', 'Golden Eagle'] },
  { id: 'finish', name: 'Finish', icon: '✨', mods: ['Plastic', 'Shiny', 'Glitter', 'Glow', 'Gold Chrome'] },
  { id: 'mat', name: 'Mat', icon: '🗺️', mods: ['Sandbox', 'Grass', 'Snow', 'Beach', 'The Moon'] },
  { id: 'boom', name: 'Boom', icon: '💥', mods: ['Foam Balls', 'Water Balloons', 'Paint Splats', 'Fireworks', 'Rainbow Blaster'] },
] as const;
export type Slot = (typeof SLOTS)[number];
export type SlotId = Slot['id'];
export type SlotName = Slot['name'];
export type ModName = Slot['mods'][number];
/** 0 is the Slot's free default; 1-3 are the first, second and top Rung, bought with Ammo; 4 is Legendary, from the Password Lock. */
export type Rung = 0 | 1 | 2 | 3 | 4;
export type BuyRung = Exclude<Rung, 0>;
export const RUNGS = [1, 2, 3, 4] as const;
export const BUY_RUNGS = [1, 2, 3] as const;
export const LEGENDARY = 4;
export const TOP = 3;

export type ModId = `${SlotId}:${BuyRung}`;
export const modId = <R extends BuyRung>(slot: SlotId, rung: R) => `${slot}:${rung}` as `${SlotId}:${R}`;
export const parseMod = (id: ModId) => { const [s, r] = id.split(':'); return { slot: s as SlotId, rung: Number(r) as BuyRung }; };
export const ALL_MODS: readonly ModId[] = SLOTS.flatMap(s => RUNGS.map(r => modId(s.id, r)));
export const isLegendary = (mod: ModId) => parseMod(mod).rung === LEGENDARY;
export type LegendaryId = `${SlotId}:${typeof LEGENDARY}`;

/** Real army men come in one colour of plastic each; his whole army is one Team Colour. He picks one of the first three
 * when he starts, and the rest cost 3 Ammo each. */
export const COLOURS = [
  { id: 'green', name: 'Army Green', hex: '#4f7a2a' },
  { id: 'tan', name: 'Tan', hex: '#c8a46a' },
  { id: 'grey', name: 'Grey', hex: '#8a9097' },
  { id: 'blue', name: 'Blue', hex: '#2d6fd0' },
  { id: 'red', name: 'Red', hex: '#c8262c' },
  { id: 'orange', name: 'Orange', hex: '#f26b1d' },
  { id: 'yellow', name: 'Yellow', hex: '#f2c230' },
  { id: 'purple', name: 'Purple', hex: '#7c3fc4' },
  { id: 'pink', name: 'Pink', hex: '#f065a8' },
  { id: 'teal', name: 'Teal', hex: '#16a090' },
  { id: 'white', name: 'White', hex: '#e9ecef' },
  { id: 'black', name: 'Black', hex: '#2a2d33' },
] as const;
export type Colour = (typeof COLOURS)[number];
export type ColourId = Colour['id'];
export type ColourName = Colour['name'];
export const STARTER_COLOURS = ['green', 'tan', 'grey'] as const satisfies readonly ColourId[];
export type StarterColour = (typeof STARTER_COLOURS)[number];
export type BoughtColour = Exclude<ColourId, StarterColour>;
export const isStarterColour = (c: ColourId): c is StarterColour => (STARTER_COLOURS as readonly ColourId[]).includes(c);
export const BOUGHT_COLOURS = COLOURS.map(c => c.id).filter((c): c is BoughtColour => !isStarterColour(c));
export const colourById = (id: ColourId): Colour => COLOURS.find(c => c.id === id)!;

/** Something bought once in the Camp: a Mod, a Squad, or a Colour that isn't free. Recruits are bought again and again. */
export type UnitItem = `unit:${BoughtUnit}`;
export type ColourItem = `colour:${BoughtColour}`;
export type Buyable = ModId | UnitItem | ColourItem;
export type Recruit = `recruit:${UnitId}`;
export type Purchase = Buyable | Recruit;
export const unitItem = (u: BoughtUnit): UnitItem => `unit:${u}`;
export const isUnitItem = (x: Purchase): x is UnitItem => x.startsWith('unit:');
export const unitOf = (x: UnitItem) => x.slice(5) as BoughtUnit;
export const recruit = (u: UnitId): Recruit => `recruit:${u}`;
export const isRecruit = (x: Purchase): x is Recruit => x.startsWith('recruit:');
export const recruitOf = (x: Recruit) => x.slice(8) as UnitId;
export const colourItem = (c: BoughtColour): ColourItem => `colour:${c}`;
export const isColourItem = (x: Purchase): x is ColourItem => x.startsWith('colour:');
export const colourOf = (x: ColourItem) => x.slice(7) as BoughtColour;
export const isModItem = (x: Purchase): x is ModId => !isUnitItem(x) && !isColourItem(x) && !isRecruit(x);
export const ALL_BUYABLES: readonly Buyable[] = [...ALL_MODS, ...BOUGHT_UNITS.map(unitItem), ...BOUGHT_COLOURS.map(colourItem)];

export const slotById = (id: SlotId): Slot => SLOTS.find(s => s.id === id)!;
export const modName = (slot: SlotId, rung: Rung): ModName => slotById(slot).mods[rung];
export const buyableName = (x: Buyable): ModName | UnitName | ColourName => {
  if (isUnitItem(x)) return UNITS[unitOf(x)].name;
  if (isColourItem(x)) return colourById(colourOf(x)).name;
  const { slot, rung } = parseMod(x);
  return modName(slot, rung);
};

/** The Gear the army wears: one Rung in each Slot. */
export type Gear = Record<SlotId, Rung>;
export const defaultGear = (): Gear => ({ helmet: 0, pack: 0, flag: 0, finish: 0, mat: 0, boom: 0 });
