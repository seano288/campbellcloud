// The Helipad's parts: seventeen Helicopters (three starters, fourteen bought with Bolts), nine Slots, and in each Slot a
// free default plus four Mods: Rungs 1-3 bought with Bolts and a Legendary Rung 4 kept in the Fuel Lock. And Colours,
// shown with Plain paint: Factory (the Helicopter's real scheme) is free. Built like Time Flies' Hangar.
export const HELI_IDS = [
  'uh60', 'mh6', 'ah1', 'uh1', 'lynx', 'tiger', 'ah64', 'mi24', 'ka52', 'ch47', 'ch53', 'mi26', 'rah66', 'b360', 'raider', 'blue', 'airwolf',
] as const;
export type HeliId = (typeof HELI_IDS)[number];
export const STARTER_HELIS = ['uh60', 'mh6', 'ah1'] as const satisfies readonly HeliId[];
export const HELI_NAMES = {
  uh60: 'UH-60 Black Hawk', mh6: 'MH-6 Little Bird', ah1: 'AH-1Z Viper', uh1: 'UH-1 Huey', lynx: 'Lynx', tiger: 'Tiger',
  ah64: 'AH-64 Apache', mi24: 'Mi-24 Hind', ka52: 'Ka-52 Alligator', ch47: 'CH-47 Chinook', ch53: 'CH-53E Super Stallion',
  mi26: 'Mi-26 Halo', rah66: 'RAH-66 Comanche', b360: 'Bell 360 Invictus', raider: 'Raider X', blue: 'Blue Thunder', airwolf: 'Airwolf',
} as const satisfies Record<HeliId, string>;
export type HeliName = (typeof HELI_NAMES)[HeliId];
export type StarterHeli = (typeof STARTER_HELIS)[number];
export type BoughtHeli = Exclude<HeliId, StarterHeli>;
export const isStarter = (h: HeliId): h is StarterHeli => (STARTER_HELIS as readonly HeliId[]).includes(h);
export const BOUGHT_HELIS = HELI_IDS.filter((h): h is BoughtHeli => !isStarter(h));

export const SLOTS = [
  { id: 'paint', name: 'Paint', icon: '🎨', mods: ['Plain', 'Camo', 'Squadron', 'Air Show', 'Gold Chrome'] },
  { id: 'nose', name: 'Nose Art', icon: '🦈', mods: ['No Nose Art', 'Lightning Bolt', 'Shark Mouth', 'Tiger Teeth', 'Fire Dragon'] },
  { id: 'tail', name: 'Tail Art', icon: '⭐', mods: ['Plain Tail', 'Stripes', 'Stars', 'Checkers', 'Golden Eagle'] },
  { id: 'weapons', name: 'Weapons', icon: '🚀', mods: ['No Weapons', 'Rocket Pods', 'Missiles', 'Mega Load', 'Firework Rockets'] },
  { id: 'rotor', name: 'Rotor', icon: '🌀', mods: ['Plain Rotor', 'Striped Tips', 'Glow Tips', 'Fire Ring', 'Rainbow Rotor'] },
  { id: 'smoke', name: 'Smoke', icon: '💨', mods: ['No Smoke', 'White Smoke', 'Red, White and Blue', 'Rainbow Smoke', 'Sparkle Trail'] },
  { id: 'canopy', name: 'Canopy', icon: '🫧', mods: ['Clear', 'Smoke Tint', 'Gold Tint', 'Blue Mirror', 'Diamond'] },
  { id: 'lights', name: 'Lights', icon: '💡', mods: ['Nav Lights', 'Strobes', 'Searchlight', 'Glow Under', 'Laser Show'] },
  { id: 'number', name: 'Tail Number', icon: '#️⃣', mods: ['No Number', 'Plain', 'Outlined', 'Flaming', 'Glowing Gold'] },
] as const;
export type Slot = (typeof SLOTS)[number];
export type SlotId = Slot['id'];
export type SlotName = Slot['name'];
export type ModName = Slot['mods'][number];
/** 0 is the Slot's free default; 1-3 are the first, second and top Rung, bought with Bolts; 4 is Legendary, from the Fuel Lock. */
export type Rung = 0 | 1 | 2 | 3 | 4;
export type BuyRung = Exclude<Rung, 0>;
export const RUNGS = [1, 2, 3, 4] as const;
export const BOLT_RUNGS = [1, 2, 3] as const;
export const LEGENDARY = 4;
export const TOP = 3;

export type ModId = `${SlotId}:${BuyRung}`;
export const modId = <R extends BuyRung>(slot: SlotId, rung: R) => `${slot}:${rung}` as `${SlotId}:${R}`;
export const parseMod = (id: ModId) => { const [s, r] = id.split(':'); return { slot: s as SlotId, rung: Number(r) as BuyRung }; };
export const ALL_MODS: readonly ModId[] = SLOTS.flatMap(s => RUNGS.map(r => modId(s.id, r)));
export const isLegendary = (mod: ModId) => parseMod(mod).rung === LEGENDARY;
export type LegendaryId = `${SlotId}:${typeof LEGENDARY}`;

export const COLOURS = [
  { id: 'factory', name: 'Factory', hex: '#8d96a0' },
  { id: 'red', name: 'Red', hex: '#c8262c' },
  { id: 'orange', name: 'Orange', hex: '#f26b1d' },
  { id: 'yellow', name: 'Yellow', hex: '#f7c531' },
  { id: 'green', name: 'Green', hex: '#3f7d3a' },
  { id: 'teal', name: 'Teal', hex: '#16a090' },
  { id: 'sky', name: 'Sky Blue', hex: '#4aa8e8' },
  { id: 'navy', name: 'Navy', hex: '#1d2e6b' },
  { id: 'purple', name: 'Purple', hex: '#7c3fc4' },
  { id: 'pink', name: 'Pink', hex: '#f065a8' },
  { id: 'black', name: 'Black', hex: '#1b1d21' },
  { id: 'white', name: 'White', hex: '#eef1f4' },
] as const;
export type Colour = (typeof COLOURS)[number];
export type ColourId = Colour['id'];
export type ColourName = Colour['name'];
export const FREE_COLOUR = 'factory' satisfies ColourId;
export type BoughtColour = Exclude<ColourId, typeof FREE_COLOUR>;
export const BOUGHT_COLOURS = COLOURS.map(c => c.id).filter((c): c is BoughtColour => c !== FREE_COLOUR);
export const colourById = (id: ColourId): Colour => COLOURS.find(c => c.id === id)!;

/** Something bought on the Helipad: a Mod, a Helicopter that isn't a starter, or a Colour that isn't free. */
export type HeliItem = `heli:${BoughtHeli}`;
export type ColourItem = `colour:${BoughtColour}`;
export type Buyable = ModId | HeliItem | ColourItem;
export const heliItem = (h: BoughtHeli): HeliItem => `heli:${h}`;
export const isHeliItem = (x: Buyable): x is HeliItem => x.startsWith('heli:');
export const heliOf = (x: HeliItem) => x.slice(5) as BoughtHeli;
export const colourItem = (c: BoughtColour): ColourItem => `colour:${c}`;
export const isColourItem = (x: Buyable): x is ColourItem => x.startsWith('colour:');
export const colourOf = (x: ColourItem) => x.slice(7) as BoughtColour;
export const isModItem = (x: Buyable): x is ModId => !isHeliItem(x) && !isColourItem(x);
export const ALL_BUYABLES: readonly Buyable[] = [...ALL_MODS, ...BOUGHT_HELIS.map(heliItem), ...BOUGHT_COLOURS.map(colourItem)];

export const slotById = (id: SlotId): Slot => SLOTS.find(s => s.id === id)!;
export const modName = (slot: SlotId, rung: Rung): ModName => slotById(slot).mods[rung];
export const buyableName = (x: Buyable): ModName | HeliName | ColourName => {
  if (isHeliItem(x)) return HELI_NAMES[heliOf(x)];
  if (isColourItem(x)) return colourById(colourOf(x)).name;
  const { slot, rung } = parseMod(x);
  return modName(slot, rung);
};

/** The number painted on the tail, 0 to 99, which he picks himself. The Tail Number Slot's Mods are its style. */
export const MAX_TAIL_NUMBER = 99, DEFAULT_TAIL_NUMBER = 1;
export const isTailNumber = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_TAIL_NUMBER;

/** The Mods fitted on a Helicopter, the number on its tail and its Colour. */
export type Fit = Record<SlotId, Rung> & { tailNumber: number; colour: ColourId };
export const defaultFit = (): Fit => ({
  paint: 0, nose: 0, tail: 0, weapons: 0, rotor: 0, smoke: 0, canopy: 0, lights: 0, number: 0,
  tailNumber: DEFAULT_TAIL_NUMBER, colour: FREE_COLOUR,
});
