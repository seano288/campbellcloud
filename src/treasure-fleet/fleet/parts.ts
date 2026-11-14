// The ship is built from four slots (Hull, Sails, Cannons, Figurehead) and a Flag. Each slot has a free starter and three upgrades
// bought with Bolts, and each upgrade adds one Range. Range is what takes the ship further out: every island needs some (islands.ts).
// It starts as a rowing boat with a bedsheet sail and ends as a galleon. The flag is only for looks: the skull is free, the shark and
// the dragon cost a little, and its colours are his to choose for nothing.
export const SLOTS = ['hull', 'sails', 'cannons', 'figurehead'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAMES = { hull: 'Hull', sails: 'Sails', cannons: 'Cannons', figurehead: 'Figurehead', flag: 'Flag' } as const;
export type Tab = Slot | 'flag';
export const TABS: readonly Tab[] = [...SLOTS, 'flag'];

export interface Part { readonly slot: Slot; readonly id: string; readonly name: string; readonly price: number; readonly range: number }

// Range is the Rung plus one: a starter adds 1, a top part 4. Prices are about 8, 25 and 55 by step.
export const PARTS = [
  { slot: 'hull', id: 'rowboat', name: 'Rowing Boat', price: 0, range: 1 }, { slot: 'hull', id: 'sloop', name: 'Sloop', price: 10, range: 2 },
  { slot: 'hull', id: 'brig', name: 'Brig', price: 28, range: 3 }, { slot: 'hull', id: 'galleon', name: 'Galleon', price: 60, range: 4 },
  { slot: 'sails', id: 'sheet', name: 'Bedsheet Sail', price: 0, range: 1 }, { slot: 'sails', id: 'patched', name: 'Patched Sails', price: 8, range: 2 },
  { slot: 'sails', id: 'square', name: 'Square Sails', price: 25, range: 3 }, { slot: 'sails', id: 'royal', name: 'Royal Sails', price: 55, range: 4 },
  { slot: 'cannons', id: 'little', name: 'Little Cannon', price: 0, range: 1 }, { slot: 'cannons', id: 'twin', name: 'Twin Cannons', price: 8, range: 2 },
  { slot: 'cannons', id: 'big', name: 'Big Cannons', price: 25, range: 3 }, { slot: 'cannons', id: 'golden', name: 'Golden Cannons', price: 55, range: 4 },
  { slot: 'figurehead', id: 'plain', name: 'Plain Bow', price: 0, range: 1 }, { slot: 'figurehead', id: 'gull', name: 'Seagull', price: 8, range: 2 },
  { slot: 'figurehead', id: 'mermaid', name: 'Mermaid', price: 22, range: 3 }, { slot: 'figurehead', id: 'serpent', name: 'Sea Serpent', price: 50, range: 4 },
] as const satisfies readonly Part[];
export type PartName = (typeof PARTS)[number]['name'];

export interface Emblem { readonly id: string; readonly name: string; readonly price: number }
export const EMBLEMS = [
  { id: 'skull', name: 'Skull Flag', price: 0 },
  { id: 'shark', name: 'Shark Flag', price: 4 },
  { id: 'dragon', name: 'Dragon Flag', price: 6 },
] as const satisfies readonly Emblem[];
export type EmblemId = (typeof EMBLEMS)[number]['id'];
export type EmblemName = (typeof EMBLEMS)[number]['name'];

/** The flag's colours: his to pick, free. The cloth, then the emblem on it. */
export const COLOURS = [
  { id: 'black', name: 'Black', cloth: '#1d1d1f', mark: '#f4f1e8' },
  { id: 'red', name: 'Red', cloth: '#d62828', mark: '#ffd23f' },
  { id: 'blue', name: 'Blue', cloth: '#1f5fd1', mark: '#f4f1e8' },
  { id: 'green', name: 'Green', cloth: '#178046', mark: '#ffd23f' },
  { id: 'purple', name: 'Purple', cloth: '#6b3fb8', mark: '#f4f1e8' },
  { id: 'gold', name: 'Gold', cloth: '#e8b21f', mark: '#1d1d1f' },
] as const;
export type ColourId = (typeof COLOURS)[number]['id'];
export type ColourName = (typeof COLOURS)[number]['name'];
export const isColourId = (x: unknown): x is ColourId => COLOURS.some(c => c.id === x);
export const colourOf = (id: ColourId) => COLOURS.find(c => c.id === id) ?? COLOURS[0];

/** One part or flag, as the save keeps it: "hull:sloop", "flag:shark". */
export type PartKey = `${Slot}:${string}` | `flag:${EmblemId}`;
export const ALL_KEYS: readonly PartKey[] = [...PARTS.map(p => `${p.slot}:${p.id}` as PartKey), ...EMBLEMS.map(e => `flag:${e.id}` as PartKey)];
export const isPartKey = (x: unknown): x is PartKey => typeof x === 'string' && (ALL_KEYS as readonly string[]).includes(x);
export const tabOf = (k: PartKey): Tab => k.split(':')[0] as Tab;
export const idOf = (k: PartKey) => k.split(':')[1]!;
export const keyOf = (tab: Tab, id: string) => `${tab}:${id}` as PartKey;

export function infoOf(k: PartKey): { name: PartName | EmblemName; price: number; range: number } {
  const tab = tabOf(k), id = idOf(k);
  if (tab === 'flag') { const e = EMBLEMS.find(e => e.id === id)!; return { name: e.name, price: e.price, range: 0 }; }
  const p = PARTS.find(p => p.slot === tab && p.id === id)!;
  return { name: p.name, price: p.price, range: p.range };
}
export const keysIn = (tab: Tab): PartKey[] => ALL_KEYS.filter(k => tabOf(k) === tab);
export const STARTERS: readonly PartKey[] = ALL_KEYS.filter(k => infoOf(k).price === 0);
export const ALL_NAMES = ALL_KEYS.map(k => infoOf(k).name);

/** What's on his ship. */
export interface Ship { hull: string; sails: string; cannons: string; figurehead: string; flag: EmblemId; colour: ColourId }
export const starterShip = (): Ship => ({ hull: 'rowboat', sails: 'sheet', cannons: 'little', figurehead: 'plain', flag: 'skull', colour: 'black' });
export const fittedKeys = (s: Ship): PartKey[] => [...SLOTS.map(slot => keyOf(slot, s[slot])), keyOf('flag', s.flag)];
export const rangeOf = (s: Ship) => SLOTS.reduce((sum, slot) => sum + infoOf(keyOf(slot, s[slot])).range, 0);
/** 0 for a starter, 3 for a top part. */
export const rungOf = (s: Ship, slot: Slot) => infoOf(keyOf(slot, s[slot])).range - 1;
export function fit(s: Ship, k: PartKey): Ship {
  const tab = tabOf(k), id = idOf(k);
  return tab === 'flag' ? { ...s, flag: id as EmblemId } : { ...s, [tab]: id };
}
