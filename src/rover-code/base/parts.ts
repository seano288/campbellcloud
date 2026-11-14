// The rocket is built from five slots (Nose, Body, Fins, Engine, Boosters) and a Paint. Each slot has a free starter and Rungs bought
// with Bolts, and each Rung adds one Power. Boosters came on 2026-11-14 (he asked for more boosters, more kinds and more of them): the
// starter is none at all, then two, four, six and eight strapped round the body, in plain and fancy kinds. Six more wings came at the
// same time, all at the top Rung, so whichever he fits his rocket stays as strong. Rungs 4 to 6 came on 2026-11-14, once he had bought everything else, to double the reward. Power is what takes the rocket further: every planet needs some (planets.ts). Paint is
// only for looks and costs a little. Rungs, like the vehicle games, so cooler parts cost more. The shop also sells rovers and Kit
// gadgets (rovers.ts) under the same keys ("rover:monster", "kit:spoiler"); they add no Power and don't go on the rocket.
import { KIT, KIT_IDS, ROVER_IDS, ROVERS, type KitId, type KitName, type RoverId, type RoverName } from './rovers';

export const SLOTS = ['nose', 'body', 'fins', 'engine', 'boosters'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAMES = { nose: 'Nose', body: 'Body', fins: 'Fins', engine: 'Engine', boosters: 'Boosters', paint: 'Paint', rover: 'Rover', kit: 'Gadgets' } as const;
export type Tab = Slot | 'paint' | 'rover' | 'kit';
export const TABS: readonly Tab[] = [...SLOTS, 'paint', 'rover', 'kit'];
/** The tabs for his rover rather than his rocket. */
export const isRoverTab = (t: Tab) => t === 'rover' || t === 'kit';

export interface Part { readonly slot: Slot; readonly id: string; readonly name: string; readonly price: number; readonly power: number }

// Power is the Rung plus one: a starter adds 1, a top part 7. Boosters start at none, so theirs is the Rung itself (0 to 8). No price
// is over 100, the most the voice can say.
export const PARTS = [
  { slot: 'nose', id: 'cone', name: 'Plain Nose', price: 0, power: 1 }, { slot: 'nose', id: 'bubble', name: 'Bubble Nose', price: 8, power: 2 },
  { slot: 'nose', id: 'needle', name: 'Needle Nose', price: 24, power: 3 }, { slot: 'nose', id: 'star', name: 'Star Nose', price: 50, power: 4 },
  { slot: 'nose', id: 'drill', name: 'Drill Nose', price: 55, power: 5 }, { slot: 'nose', id: 'shark', name: 'Shark Nose', price: 70, power: 6 },
  { slot: 'nose', id: 'diamond', name: 'Diamond Nose', price: 85, power: 7 },
  { slot: 'body', id: 'can', name: 'Tin Can', price: 0, power: 1 }, { slot: 'body', id: 'long', name: 'Long Hull', price: 10, power: 2 },
  { slot: 'body', id: 'stripe', name: 'Stripe Hull', price: 30, power: 3 }, { slot: 'body', id: 'gold', name: 'Gold Hull', price: 60, power: 4 },
  { slot: 'body', id: 'armor', name: 'Armor Hull', price: 65, power: 5 }, { slot: 'body', id: 'zap', name: 'Lightning Hull', price: 80, power: 6 },
  { slot: 'body', id: 'rainbow', name: 'Rainbow Hull', price: 95, power: 7 },
  { slot: 'fins', id: 'little', name: 'Little Fins', price: 0, power: 1 }, { slot: 'fins', id: 'swept', name: 'Swept Fins', price: 8, power: 2 },
  { slot: 'fins', id: 'big', name: 'Big Fins', price: 24, power: 3 }, { slot: 'fins', id: 'wing', name: 'Wing Fins', price: 50, power: 4 },
  { slot: 'fins', id: 'spike', name: 'Spike Fins', price: 55, power: 5 }, { slot: 'fins', id: 'jet', name: 'Jet Wings', price: 70, power: 6 },
  { slot: 'fins', id: 'dragon', name: 'Dragon Wings', price: 85, power: 7 },
  { slot: 'fins', id: 'bat', name: 'Bat Wings', price: 87, power: 7 }, { slot: 'fins', id: 'butterfly', name: 'Butterfly Wings', price: 89, power: 7 },
  { slot: 'fins', id: 'eagle', name: 'Eagle Wings', price: 91, power: 7 }, { slot: 'fins', id: 'ice', name: 'Ice Wings', price: 94, power: 7 },
  { slot: 'fins', id: 'fire', name: 'Fire Wings', price: 97, power: 7 }, { slot: 'fins', id: 'starwing', name: 'Star Wings', price: 100, power: 7 },
  { slot: 'engine', id: 'puff', name: 'Puff Engine', price: 0, power: 1 }, { slot: 'engine', id: 'twin', name: 'Twin Engine', price: 12, power: 2 },
  { slot: 'engine', id: 'triple', name: 'Triple Engine', price: 36, power: 3 }, { slot: 'engine', id: 'mega', name: 'Mega Booster', price: 72, power: 4 },
  { slot: 'engine', id: 'quad', name: 'Quad Engine', price: 75, power: 5 }, { slot: 'engine', id: 'plasma', name: 'Plasma Engine', price: 90, power: 6 },
  { slot: 'engine', id: 'hyper', name: 'Hyper Drive', price: 100, power: 7 },
  { slot: 'boosters', id: 'none', name: 'No Boosters', price: 0, power: 0 }, { slot: 'boosters', id: 'two', name: 'Two Boosters', price: 10, power: 1 },
  { slot: 'boosters', id: 'four', name: 'Four Boosters', price: 20, power: 2 }, { slot: 'boosters', id: 'fire', name: 'Fire Boosters', price: 32, power: 3 },
  { slot: 'boosters', id: 'six', name: 'Six Boosters', price: 45, power: 4 }, { slot: 'boosters', id: 'ice', name: 'Ice Boosters', price: 58, power: 5 },
  { slot: 'boosters', id: 'gold', name: 'Gold Boosters', price: 70, power: 6 }, { slot: 'boosters', id: 'eight', name: 'Eight Boosters', price: 85, power: 7 },
  { slot: 'boosters', id: 'rainbow', name: 'Rainbow Boosters', price: 100, power: 8 },
] as const satisfies readonly Part[];
export type PartName = (typeof PARTS)[number]['name'];

export interface Paint { readonly id: string; readonly name: string; readonly price: number; readonly main: string; readonly trim: string }
export const PAINTS = [
  { id: 'white', name: 'Snow White', price: 0, main: '#f4f6fa', trim: '#e63946' },
  { id: 'red', name: 'Fire Red', price: 4, main: '#e63946', trim: '#ffd23f' },
  { id: 'blue', name: 'Sky Blue', price: 4, main: '#3a8dde', trim: '#f4f6fa' },
  { id: 'orange', name: 'Sunset Orange', price: 4, main: '#ff8a1f', trim: '#2a2f5a' },
  { id: 'green', name: 'Alien Green', price: 4, main: '#4cc46b', trim: '#1d1d1f' },
  { id: 'purple', name: 'Galaxy Purple', price: 4, main: '#8e5bd8', trim: '#ffd23f' },
  { id: 'black', name: 'Night Black', price: 6, main: '#2a2d36', trim: '#ff7a00' },
  { id: 'pink', name: 'Bubblegum Pink', price: 8, main: '#ff7ac8', trim: '#8e5bd8' },
  { id: 'yellow', name: 'Lemon Yellow', price: 8, main: '#ffe14d', trim: '#3a8dde' },
  { id: 'teal', name: 'Ocean Teal', price: 8, main: '#2fb3a6', trim: '#ffd23f' },
  { id: 'silver', name: 'Chrome Silver', price: 10, main: '#c9ccd6', trim: '#3a8dde' },
  { id: 'navy', name: 'Midnight Blue', price: 10, main: '#22337a', trim: '#ffd23f' },
  { id: 'candy', name: 'Cotton Candy', price: 10, main: '#ffc4e8', trim: '#43b8f0' },
  { id: 'lime', name: 'Glow Lime', price: 12, main: '#b6ff3b', trim: '#8e5bd8' },
] as const satisfies readonly Paint[];
export type PaintId = (typeof PAINTS)[number]['id'];
export type PaintName = (typeof PAINTS)[number]['name'];

/** One thing in the shop, as the save keeps it: "engine:twin", "paint:red", "rover:monster", "kit:spoiler". */
export type PartKey = `${Slot}:${string}` | `paint:${PaintId}` | `rover:${RoverId}` | `kit:${KitId}`;
export const ALL_KEYS: readonly PartKey[] = [
  ...PARTS.map(p => `${p.slot}:${p.id}` as PartKey), ...PAINTS.map(p => `paint:${p.id}` as PartKey),
  ...ROVER_IDS.map(id => `rover:${id}` as PartKey), ...KIT_IDS.map(id => `kit:${id}` as PartKey),
];
export const isPartKey = (x: unknown): x is PartKey => typeof x === 'string' && (ALL_KEYS as readonly string[]).includes(x);
export const tabOf = (k: PartKey): Tab => k.split(':')[0] as Tab;
export const idOf = (k: PartKey) => k.split(':')[1]!;
export const keyOf = (tab: Tab, id: string) => `${tab}:${id}` as PartKey;

export type ShopName = PartName | PaintName | RoverName | KitName;
export function infoOf(k: PartKey): { name: ShopName; price: number; power: number } {
  const tab = tabOf(k), id = idOf(k);
  if (tab === 'paint') { const p = PAINTS.find(p => p.id === id)!; return { name: p.name, price: p.price, power: 0 }; }
  if (tab === 'rover') { const r = ROVERS.find(r => r.id === id)!; return { name: r.name, price: r.price, power: 0 }; }
  if (tab === 'kit') { const g = KIT.find(g => g.id === id)!; return { name: g.name, price: g.price, power: 0 }; }
  const p = PARTS.find(p => p.slot === tab && p.id === id)!;
  return { name: p.name, price: p.price, power: p.power };
}
export const keysIn = (tab: Tab): PartKey[] => ALL_KEYS.filter(k => tabOf(k) === tab);
export const STARTERS: readonly PartKey[] = ALL_KEYS.filter(k => infoOf(k).price === 0);
export const ALL_NAMES = ALL_KEYS.map(k => infoOf(k).name);

/** What's on his rocket. */
export interface Rocket { nose: string; body: string; fins: string; engine: string; boosters: string; paint: PaintId }
export const starterRocket = (): Rocket => ({ nose: 'cone', body: 'can', fins: 'little', engine: 'puff', boosters: 'none', paint: 'white' });
export const fittedKeys = (r: Rocket): PartKey[] => [...SLOTS.map(s => keyOf(s, r[s])), keyOf('paint', r.paint)];
export const powerOf = (r: Rocket) => SLOTS.reduce((sum, s) => sum + infoOf(keyOf(s, r[s])).power, 0);
export const rungOf = (r: Rocket, s: Slot) => infoOf(keyOf(s, r[s])).power - 1;
export const paintOf = (r: Rocket) => PAINTS.find(p => p.id === r.paint) ?? PAINTS[0];
/** The rocket with this part on it; a rover or a Kit gadget leaves the rocket as it is. */
export function fit(r: Rocket, k: PartKey): Rocket {
  const tab = tabOf(k), id = idOf(k);
  if (isRoverTab(tab)) return r;
  return tab === 'paint' ? { ...r, paint: id as PaintId } : { ...r, [tab]: id };
}
