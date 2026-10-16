// The Hangar's parts: fourteen Aircraft (three starters, eleven bought with Bolts), nine Slots, and in each Slot a free
// default plus four Mods: Rungs 1-3 bought with Bolts and a Legendary Rung 4 kept in the Time Lock vault. And Colours,
// shown with Plain paint: Factory (the Aircraft's real scheme) is free.
export const JET_IDS = ['p51', 'f16', 'f18', 'f4u', 'p38', 'a10', 'f4', 'f14', 'f15', 'v22', 'f117', 'f35', 'f22', 'sr71'] as const;
export type JetId = (typeof JET_IDS)[number];
export const STARTER_JETS = ['p51', 'f16', 'f18'] as const satisfies readonly JetId[];
export const JET_NAMES = {
  p51: 'P-51 Mustang', f16: 'F-16 Falcon', f18: 'F/A-18 Super Hornet', f4u: 'F4U Corsair', p38: 'P-38 Lightning',
  a10: 'A-10 Warthog', f4: 'F-4 Phantom', f14: 'F-14 Tomcat', f15: 'F-15 Eagle', v22: 'V-22 Osprey',
  f117: 'F-117 Nighthawk', f35: 'F-35 Lightning II', f22: 'F-22 Raptor', sr71: 'SR-71 Blackbird',
} as const satisfies Record<JetId, string>;
export type JetName = (typeof JET_NAMES)[JetId];
export type StarterJet = (typeof STARTER_JETS)[number];
export type BoughtJet = Exclude<JetId, StarterJet>;
export const isStarter = (j: JetId): j is StarterJet => (STARTER_JETS as readonly JetId[]).includes(j);
export const BOUGHT_JETS = JET_IDS.filter((j): j is BoughtJet => !isStarter(j));
/** Propeller aircraft: their Engine Mods light the exhaust stacks rather than an afterburner. */
export const PROP_JETS: readonly JetId[] = ['p51', 'f4u', 'p38', 'v22'];

export const SLOTS = [
  { id: 'paint', name: 'Paint', icon: '🎨', mods: ['Plain', 'Camo', 'Squadron', 'Air Show', 'Gold Chrome'] },
  { id: 'nose', name: 'Nose Art', icon: '🦈', mods: ['No Nose Art', 'Lightning Bolt', 'Shark Mouth', 'Tiger Teeth', 'Fire Dragon'] },
  { id: 'tail', name: 'Tail Art', icon: '⭐', mods: ['Plain Tail', 'Stripes', 'Stars', 'Checkers', 'Golden Eagle'] },
  { id: 'weapons', name: 'Weapons', icon: '🚀', mods: ['No Weapons', 'Missiles', 'Bombs', 'Mega Load', 'Firework Rockets'] },
  { id: 'engine', name: 'Engine', icon: '🔥', mods: ['Standard', 'Turbo', 'Afterburner', 'Mega Burner', 'Rainbow Burner'] },
  { id: 'smoke', name: 'Smoke', icon: '💨', mods: ['No Smoke', 'White Smoke', 'Red, White and Blue', 'Rainbow Smoke', 'Sparkle Trail'] },
  { id: 'canopy', name: 'Canopy', icon: '🫧', mods: ['Clear', 'Smoke Tint', 'Gold Tint', 'Blue Mirror', 'Diamond'] },
  { id: 'lights', name: 'Lights', icon: '💡', mods: ['Nav Lights', 'Strobes', 'Landing Lights', 'Glow Under', 'Laser Show'] },
  { id: 'number', name: 'Tail Number', icon: '#️⃣', mods: ['No Number', 'Plain', 'Outlined', 'Flaming', 'Glowing Gold'] },
] as const;
export type Slot = (typeof SLOTS)[number];
export type SlotId = Slot['id'];
export type SlotName = Slot['name'];
export type ModName = Slot['mods'][number];
/** 0 is the Slot's free default; 1-3 are the first, second and top Rung, bought with Bolts; 4 is Legendary, from the vault. */
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

/** Something bought in the Hangar: a Mod, an Aircraft that isn't a starter, or a Colour that isn't free. */
export type JetItem = `jet:${BoughtJet}`;
export type ColourItem = `colour:${BoughtColour}`;
export type Buyable = ModId | JetItem | ColourItem;
export const jetItem = (j: BoughtJet): JetItem => `jet:${j}`;
export const isJetItem = (x: Buyable): x is JetItem => x.startsWith('jet:');
export const jetOf = (x: JetItem) => x.slice(4) as BoughtJet;
export const colourItem = (c: BoughtColour): ColourItem => `colour:${c}`;
export const isColourItem = (x: Buyable): x is ColourItem => x.startsWith('colour:');
export const colourOf = (x: ColourItem) => x.slice(7) as BoughtColour;
export const isModItem = (x: Buyable): x is ModId => !isJetItem(x) && !isColourItem(x);
export const ALL_BUYABLES: readonly Buyable[] = [...ALL_MODS, ...BOUGHT_JETS.map(jetItem), ...BOUGHT_COLOURS.map(colourItem)];

export const slotById = (id: SlotId): Slot => SLOTS.find(s => s.id === id)!;
export const modName = (slot: SlotId, rung: Rung): ModName => slotById(slot).mods[rung];
export const buyableName = (x: Buyable): ModName | JetName | ColourName => {
  if (isJetItem(x)) return JET_NAMES[jetOf(x)];
  if (isColourItem(x)) return colourById(colourOf(x)).name;
  const { slot, rung } = parseMod(x);
  return modName(slot, rung);
};

/** The number painted on the tail, 0 to 99, which he picks himself. The Tail Number Slot's Mods are its style. */
export const MAX_TAIL_NUMBER = 99, DEFAULT_TAIL_NUMBER = 1;
export const isTailNumber = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_TAIL_NUMBER;

/** The Mods fitted on an Aircraft, the number on its tail and its Colour. */
export type Fit = Record<SlotId, Rung> & { tailNumber: number; colour: ColourId };
export const defaultFit = (): Fit => ({
  paint: 0, nose: 0, tail: 0, weapons: 0, engine: 0, smoke: 0, canopy: 0, lights: 0, number: 0,
  tailNumber: DEFAULT_TAIL_NUMBER, colour: FREE_COLOUR,
});
