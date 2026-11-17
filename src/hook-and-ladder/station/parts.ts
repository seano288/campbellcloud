// Everything at the Station he can earn, and what each one does. Plain tables: station.ts holds his save and the buying.
//
// - Trucks: one he drives at a time, each with its own trick at the Call.
// - Pump, Hose, Ladder, Tank: Rungs that change the Call. The Pump sets how high the water reaches, the Hose how wide the spray is,
//   the Ladder how many floors it climbs, the Tank how long he sprays before a short refill.
// - Nozzle: what comes out of the hose (some only look different; Fan, Foam and Twin change how it puts fires out).
// - Siren, Lights, Paint, Buddy: how his truck sounds and looks, and who rides with him (a dalmatian first).
// - Station and Town things: on the Station wall and floor, and in the Town.
// No price is over 100 Bolts, the most the recorded numbers say.

export const TABS = ['truck', 'pump', 'hose', 'ladder', 'tank', 'nozzle', 'siren', 'lights', 'paint', 'buddy', 'station', 'town'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = {
  truck: 'Trucks', pump: 'Pump', hose: 'Hose', ladder: 'Ladder', tank: 'Tank', nozzle: 'Nozzle', siren: 'Siren', lights: 'Lights',
  paint: 'Paint', buddy: 'Crew Buddy', station: 'Station', town: 'Town',
} as const satisfies Record<Tab, string>;
/** The tabs whose items fit the truck (one at a time); the Station and Town tabs collect things. */
export const FITTED: readonly Tab[] = ['truck', 'pump', 'hose', 'ladder', 'tank', 'nozzle', 'siren', 'lights', 'paint', 'buddy'];

export interface ItemDef {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** Said after its name: what it does. */
  readonly trick?: string;
  /** A Rung: 0 is the free starter. */
  readonly rung?: number;
  /** Paint and lights: the colour (a paint's pattern is drawn in art/truck.ts). */
  readonly color?: string;
  readonly pattern?: 'stripes' | 'spots' | 'flames' | 'tiger' | 'zebra' | 'camo' | 'rainbow' | 'galaxy' | 'glow' | 'candy';
  /** Buddies and things: the emoji (the dalmatian is drawn). */
  readonly emoji?: string;
}

const rungs = (names: readonly string[], prices: readonly number[]): ItemDef[] =>
  names.map((name, i) => ({ id: `r${i}`, name, price: i === 0 ? 0 : prices[i - 1]!, rung: i }));

export const TRUCKS = [
  { id: 'pumper', name: 'Pumper', price: 0, trick: 'It is ready for anything!' },
  { id: 'ladder', name: 'Ladder Truck', price: 25, trick: 'Its ladder reaches two floors higher!' },
  { id: 'tanker', name: 'Tanker', price: 35, trick: 'It holds twice the water!' },
  { id: 'rescue', name: 'Rescue Truck', price: 45, trick: 'Its ladder goes up super fast!' },
  { id: 'brush', name: 'Brush Truck', price: 55, trick: 'It puts out grass and tree fires in one splash!' },
  { id: 'crash', name: 'Airport Crash Truck', price: 70, trick: 'Its foam puts out fires twice as fast!' },
  { id: 'boat', name: 'Fireboat', price: 85, trick: 'It never runs out of water!' },
  { id: 'heli', name: 'Fire Helicopter', price: 100, trick: 'It can drop water from the sky!' },
] as const satisfies readonly ItemDef[];
export type TruckId = (typeof TRUCKS)[number]['id'];

/** How high the water reaches: the highest floor at the middle of a building. */
export const PUMP_FLOORS = [3, 4, 5, 6, 7, 9] as const;
export const PUMPS = rungs(['Starter Pump', 'Strong Pump', 'Super Pump', 'Mega Pump', 'Turbo Pump', 'Giant Pump'], [8, 18, 32, 50, 75]);
/** How wide the spray is (0 to 5). */
export const HOSES = rungs(['Garden Hose', 'Fire Hose', 'Big Hose', 'Double Hose', 'Wide Hose', 'Super Hose'], [6, 14, 26, 42, 64]);
/** How many floors the ladder climbs. */
export const LADDER_FLOORS = [2, 3, 4, 5, 6, 7, 8] as const;
export const LADDERS = rungs(['Short Ladder', 'Long Ladder', 'Tall Ladder', 'Super Ladder', 'Mega Ladder', 'Giant Ladder', 'Sky Ladder'], [10, 20, 34, 52, 74, 100]);
/** How many seconds he can spray before the tank refills. */
export const TANK_SECONDS = [4, 6, 8, 11, 14, 18] as const;
export const TANKS = rungs(['Small Tank', 'Big Tank', 'Huge Tank', 'Giant Tank', 'Mega Tank', 'Ocean Tank'], [6, 14, 26, 42, 64]);

export const NOZZLES = [
  { id: 'straight', name: 'Straight Nozzle', price: 0 },
  { id: 'fan', name: 'Fan Nozzle', price: 12, trick: 'It sprays wider!' },
  { id: 'foam', name: 'Foam Nozzle', price: 18, trick: 'Foam puts out fires faster!' },
  { id: 'bubbles', name: 'Bubble Nozzle', price: 25, trick: 'It sprays bubbles!' },
  { id: 'rainbow', name: 'Rainbow Nozzle', price: 32, trick: 'It sprays a rainbow!' },
  { id: 'glitter', name: 'Glitter Nozzle', price: 40, trick: 'It sprays glitter!' },
  { id: 'snow', name: 'Snow Nozzle', price: 50, trick: 'It sprays snow!' },
  { id: 'twin', name: 'Twin Nozzle', price: 60, trick: 'It sprays two streams!' },
] as const satisfies readonly ItemDef[];
export type NozzleId = (typeof NOZZLES)[number]['id'];

export const SIRENS = [
  { id: 'wail', name: 'Wail Siren', price: 0 },
  { id: 'yelp', name: 'Yelp Siren', price: 5 },
  { id: 'hilo', name: 'Hi-Lo Siren', price: 8 },
  { id: 'whoop', name: 'Whoop Siren', price: 12 },
  { id: 'airhorn', name: 'Air Horn', price: 15 },
  { id: 'bell', name: 'Fire Bell', price: 20 },
  { id: 'bighorn', name: 'Big Horn', price: 25 },
  { id: 'silly', name: 'Silly Honk', price: 30 },
] as const satisfies readonly ItemDef[];
export type SirenId = (typeof SIRENS)[number]['id'];

export const LIGHTS = [
  { id: 'red', name: 'Red Lights', price: 0, color: '#ff2a2a' },
  { id: 'redwhite', name: 'Red and White Lights', price: 5, color: '#ffffff' },
  { id: 'blue', name: 'Blue Lights', price: 6, color: '#2a7bff' },
  { id: 'green', name: 'Green Lights', price: 8, color: '#2bff6a' },
  { id: 'purple', name: 'Purple Lights', price: 10, color: '#b84dff' },
  { id: 'gold', name: 'Gold Lights', price: 12, color: '#ffc21a' },
  { id: 'rainbow', name: 'Rainbow Lights', price: 18, color: '#ff7a00' },
  { id: 'disco', name: 'Disco Lights', price: 25, color: '#ff4dc4' },
  { id: 'sparkle', name: 'Sparkle Lights', price: 30, color: '#bff4ff' },
  { id: 'star', name: 'Star Lights', price: 40, color: '#fff27a' },
] as const satisfies readonly ItemDef[];
export type LightsId = (typeof LIGHTS)[number]['id'];

export const PAINTS = [
  { id: 'red', name: 'Fire Red', price: 0, color: '#d7262e' },
  { id: 'lime', name: 'Lime Green', price: 4, color: '#8fd400' },
  { id: 'sky', name: 'Sky Blue', price: 4, color: '#3fa9f5' },
  { id: 'yellow', name: 'Sunny Yellow', price: 4, color: '#ffd23f' },
  { id: 'orange', name: 'Orange', price: 4, color: '#ff7a00' },
  { id: 'white', name: 'Snow White', price: 5, color: '#f4f4f0' },
  { id: 'black', name: 'Night Black', price: 5, color: '#2a2a30' },
  { id: 'purple', name: 'Purple', price: 6, color: '#7d3cff' },
  { id: 'pink', name: 'Bubblegum Pink', price: 6, color: '#ff6fb5' },
  { id: 'teal', name: 'Ocean Teal', price: 6, color: '#13a89e' },
  { id: 'brown', name: 'Chocolate Brown', price: 6, color: '#7a4a2a' },
  { id: 'mint', name: 'Mint Green', price: 7, color: '#7be0b5' },
  { id: 'gold', name: 'Gold', price: 8, color: '#e2b007' },
  { id: 'silver', name: 'Chrome Silver', price: 8, color: '#b9c2cc' },
  { id: 'navy', name: 'Midnight Blue', price: 8, color: '#1c2a6b' },
  { id: 'lava', name: 'Lava', price: 10, color: '#ff4a1a', pattern: 'glow' },
  { id: 'stripe', name: 'Racing Stripes', price: 10, color: '#d7262e', pattern: 'stripes' },
  { id: 'spots', name: 'Dalmatian Spots', price: 12, color: '#f4f4f0', pattern: 'spots' },
  { id: 'candy', name: 'Candy Stripe', price: 12, color: '#ff6fb5', pattern: 'candy' },
  { id: 'tiger', name: 'Tiger', price: 15, color: '#ff8c1a', pattern: 'tiger' },
  { id: 'zebra', name: 'Zebra', price: 15, color: '#f4f4f0', pattern: 'zebra' },
  { id: 'camo', name: 'Camo', price: 15, color: '#5f7a3a', pattern: 'camo' },
  { id: 'flames', name: 'Flames', price: 18, color: '#2a2a30', pattern: 'flames' },
  { id: 'rainbow', name: 'Rainbow', price: 20, color: '#ff2a2a', pattern: 'rainbow' },
  { id: 'galaxy', name: 'Galaxy', price: 20, color: '#2a1550', pattern: 'galaxy' },
] as const satisfies readonly ItemDef[];
export type PaintId = (typeof PAINTS)[number]['id'];

export const BUDDIES = [
  { id: 'dalmatian', name: 'Dalmatian', price: 0 },
  { id: 'cat', name: 'Kitty', price: 8, emoji: '🐱' },
  { id: 'owl', name: 'Owl', price: 12, emoji: '🦉' },
  { id: 'bunny', name: 'Bunny', price: 15, emoji: '🐰' },
  { id: 'parrot', name: 'Parrot', price: 20, emoji: '🦜' },
  { id: 'fox', name: 'Fox', price: 25, emoji: '🦊' },
  { id: 'bear', name: 'Bear', price: 30, emoji: '🐻' },
  { id: 'penguin', name: 'Penguin', price: 35, emoji: '🐧' },
  { id: 'frog', name: 'Froggy', price: 40, emoji: '🐸' },
  { id: 'monkey', name: 'Monkey', price: 45, emoji: '🐵' },
  { id: 'robot', name: 'Robot', price: 50, emoji: '🤖' },
  { id: 'alien', name: 'Alien', price: 55, emoji: '👽' },
  { id: 'dragon', name: 'Dragon', price: 65, emoji: '🐲' },
  { id: 'unicorn', name: 'Unicorn', price: 75, emoji: '🦄' },
  { id: 'dino', name: 'Dinosaur', price: 90, emoji: '🦖' },
] as const satisfies readonly ItemDef[];
export type BuddyId = (typeof BUDDIES)[number]['id'];

export const STATION_THINGS = [
  { id: 'flag', name: 'Flag', price: 5, emoji: '🚩' },
  { id: 'plant', name: 'Plant', price: 5, emoji: '🪴' },
  { id: 'boots', name: 'Fire Boots', price: 6, emoji: '👢' },
  { id: 'bell', name: 'Bell', price: 8, emoji: '🔔' },
  { id: 'clock', name: 'Clock', price: 8, emoji: '🕰️' },
  { id: 'helmet', name: 'Helmet', price: 10, emoji: '⛑️' },
  { id: 'extinguisher', name: 'Fire Extinguisher', price: 10, emoji: '🧯' },
  { id: 'lantern', name: 'Lantern', price: 10, emoji: '🏮' },
  { id: 'axe', name: 'Axe', price: 12, emoji: '🪓' },
  { id: 'map', name: 'Town Map', price: 12, emoji: '🗺️' },
  { id: 'radio', name: 'Radio', price: 12, emoji: '📻' },
  { id: 'toolbox', name: 'Toolbox', price: 14, emoji: '🧰' },
  { id: 'doctor', name: 'Doctor Kit', price: 14, emoji: '🩺' },
  { id: 'couch', name: 'Couch', price: 16, emoji: '🛋️' },
  { id: 'ladders', name: 'Spare Ladder', price: 16, emoji: '🪜' },
  { id: 'hoop', name: 'Basketball Hoop', price: 18, emoji: '🏀' },
  { id: 'kitchen', name: 'Kitchen', price: 20, emoji: '🍳' },
  { id: 'alarm', name: 'Fire Alarm', price: 20, emoji: '🚨' },
  { id: 'beds', name: 'Bunk Beds', price: 22, emoji: '🛏️' },
  { id: 'trophy', name: 'Trophy', price: 25, emoji: '🏆' },
  { id: 'fish', name: 'Fish Tank', price: 28, emoji: '🐠' },
  { id: 'medal', name: 'Medal', price: 30, emoji: '🏅' },
  { id: 'telescope', name: 'Telescope', price: 35, emoji: '🔭' },
  { id: 'piano', name: 'Piano', price: 40, emoji: '🎹' },
  { id: 'arcade', name: 'Arcade Game', price: 50, emoji: '🕹️' },
  { id: 'disco', name: 'Disco Ball', price: 60, emoji: '🪩' },
] as const satisfies readonly ItemDef[];

export const TOWN_THINGS = [
  { id: 'tree', name: 'Tree', price: 5, emoji: '🌳' },
  { id: 'flowers', name: 'Flowers', price: 6, emoji: '🌷' },
  { id: 'palm', name: 'Palm Tree', price: 8, emoji: '🌴' },
  { id: 'mailbox', name: 'Mailbox', price: 8, emoji: '📮' },
  { id: 'traffic', name: 'Traffic Light', price: 10, emoji: '🚦' },
  { id: 'busstop', name: 'Bus Stop', price: 12, emoji: '🚏' },
  { id: 'snowman', name: 'Snowman', price: 12, emoji: '⛄' },
  { id: 'icecream', name: 'Ice Cream Cart', price: 15, emoji: '🍦' },
  { id: 'fountain', name: 'Fountain', price: 18, emoji: '⛲' },
  { id: 'pond', name: 'Duck Pond', price: 20, emoji: '🦆' },
  { id: 'playground', name: 'Playground', price: 25, emoji: '🛝' },
  { id: 'balloon', name: 'Balloons', price: 30, emoji: '🎈' },
  { id: 'circus', name: 'Circus Tent', price: 35, emoji: '🎪' },
  { id: 'carousel', name: 'Carousel', price: 40, emoji: '🎠' },
  { id: 'statue', name: 'Statue', price: 45, emoji: '🗽' },
  { id: 'wheel', name: 'Ferris Wheel', price: 55, emoji: '🎡' },
  { id: 'castle', name: 'Castle', price: 70, emoji: '🏰' },
  { id: 'coaster', name: 'Roller Coaster', price: 85, emoji: '🎢' },
] as const satisfies readonly ItemDef[];

export const CATALOGUE: Readonly<Record<Tab, readonly ItemDef[]>> = {
  truck: TRUCKS, pump: PUMPS, hose: HOSES, ladder: LADDERS, tank: TANKS, nozzle: NOZZLES, siren: SIRENS, lights: LIGHTS, paint: PAINTS,
  buddy: BUDDIES, station: STATION_THINGS, town: TOWN_THINGS,
};

export type ItemKey = `${Tab}:${string}`;
export const keyOf = (tab: Tab, id: string) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.slice(0, k.indexOf(':')) as Tab;
export const idOf = (k: ItemKey) => k.slice(k.indexOf(':') + 1);
export const ALL_KEYS: readonly ItemKey[] = TABS.flatMap(t => CATALOGUE[t].map(i => keyOf(t, i.id)));
const BY_KEY = new Map(TABS.flatMap(t => CATALOGUE[t].map(i => [keyOf(t, i.id), i] as const)));
export const isItemKey = (x: unknown): x is ItemKey => typeof x === 'string' && BY_KEY.has(x as ItemKey);
export const infoOf = (k: ItemKey): ItemDef => BY_KEY.get(k)!;
export const keysIn = (tab: Tab) => CATALOGUE[tab].map(i => keyOf(tab, i.id));
/** What he starts with: every free thing. */
export const STARTERS: readonly ItemKey[] = ALL_KEYS.filter(k => infoOf(k).price === 0);
export type ItemName = (typeof TRUCKS | typeof NOZZLES | typeof SIRENS | typeof LIGHTS | typeof PAINTS | typeof BUDDIES | typeof STATION_THINGS | typeof TOWN_THINGS)[number]['name']
  | 'Starter Pump' | 'Strong Pump' | 'Super Pump' | 'Mega Pump' | 'Turbo Pump' | 'Giant Pump'
  | 'Garden Hose' | 'Fire Hose' | 'Big Hose' | 'Double Hose' | 'Wide Hose' | 'Super Hose'
  | 'Short Ladder' | 'Long Ladder' | 'Tall Ladder' | 'Super Ladder' | 'Mega Ladder' | 'Giant Ladder' | 'Sky Ladder'
  | 'Small Tank' | 'Big Tank' | 'Huge Tank' | 'Giant Tank' | 'Mega Tank' | 'Ocean Tank';
export type TrickLine = NonNullable<Extract<(typeof TRUCKS | typeof NOZZLES)[number], { trick: string }>['trick']>;
