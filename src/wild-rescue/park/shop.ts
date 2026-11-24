// Everything Paw Prints buy: the truck's four slots (each a free starter and six upgrades), a buddy to ride along, its paints, the Park's habitats, an extra or
// two for each habitat, and decorations for the paths. Every price is at most 100, the most the recorded numbers go.
//
// Some upgrades open new rescues (the "openers"): Mud Tires reach the forest and the rainforest, Sand Tires the desert and Snow Tracks the polar lands;
// the Boat Trailer reaches ponds and rivers, the Water Tank carries ocean animals, the Big Crate carries large animals and the Giant
// Trailer the biggest. The rest are for looks and a little speed, as Rover Code's Rungs 4 to 6 are.
import type { HabitatId } from '../facts/habitats';

export const SLOTS = ['tires', 'winch', 'lights', 'carrier', 'buddy'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAMES = { tires: 'Tires', winch: 'Winch', lights: 'Lights', carrier: 'Carrier', buddy: 'Buddy', paint: 'Paint' } as const;

export interface Part { readonly slot: Slot; readonly id: string; readonly name: string; readonly price: number; readonly rung: number; readonly opens?: string; readonly icon?: string }

export const PARTS = [
  { slot: 'tires', id: 'street', name: 'Street Tires', price: 0, rung: 0 },
  { slot: 'tires', id: 'mud', name: 'Mud Tires', price: 8, rung: 1, opens: 'They can drive in the forest and the rainforest!' },
  { slot: 'tires', id: 'sand', name: 'Sand Tires', price: 20, rung: 2, opens: 'They can drive in the desert!' },
  { slot: 'tires', id: 'snow', name: 'Snow Tracks', price: 35, rung: 3, opens: 'They can drive on ice and snow!' },
  { slot: 'tires', id: 'big', name: 'Big Tires', price: 55, rung: 4 },
  { slot: 'tires', id: 'monster', name: 'Monster Tires', price: 75, rung: 5 },
  { slot: 'tires', id: 'gold', name: 'Golden Tires', price: 95, rung: 6 },
  { slot: 'winch', id: 'rope', name: 'Rope Winch', price: 0, rung: 0 },
  { slot: 'winch', id: 'steel', name: 'Steel Winch', price: 8, rung: 1 },
  { slot: 'winch', id: 'power', name: 'Power Winch', price: 22, rung: 2 },
  { slot: 'winch', id: 'crane', name: 'Crane Arm', price: 45, rung: 3 },
  { slot: 'winch', id: 'super', name: 'Super Winch', price: 60, rung: 4 },
  { slot: 'winch', id: 'turbo', name: 'Turbo Winch', price: 75, rung: 5 },
  { slot: 'winch', id: 'mega', name: 'Mega Crane', price: 90, rung: 6 },
  { slot: 'lights', id: 'plain', name: 'Headlights', price: 0, rung: 0 },
  { slot: 'lights', id: 'roof', name: 'Roof Light', price: 6, rung: 1 },
  { slot: 'lights', id: 'bar', name: 'Light Bar', price: 18, rung: 2 },
  { slot: 'lights', id: 'siren', name: 'Big Siren', price: 35, rung: 3 },
  { slot: 'lights', id: 'spot', name: 'Spotlight', price: 55, rung: 4 },
  { slot: 'lights', id: 'rainbow', name: 'Rainbow Lights', price: 70, rung: 5 },
  { slot: 'lights', id: 'star', name: 'Star Beacon', price: 85, rung: 6 },
  { slot: 'carrier', id: 'little', name: 'Little Crate', price: 0, rung: 0 },
  { slot: 'carrier', id: 'big', name: 'Big Crate', price: 10, rung: 1, opens: 'It can carry big animals!' },
  { slot: 'carrier', id: 'boat', name: 'Boat Trailer', price: 25, rung: 2, opens: 'It can reach ponds and rivers!' },
  { slot: 'carrier', id: 'tank', name: 'Water Tank', price: 45, rung: 3, opens: 'It can carry ocean animals!' },
  { slot: 'carrier', id: 'giant', name: 'Giant Trailer', price: 65, rung: 4, opens: 'It can carry the biggest animals!' },
  { slot: 'carrier', id: 'ambulance', name: 'Animal Ambulance', price: 80, rung: 5 },
  { slot: 'carrier', id: 'hauler', name: 'Super Hauler', price: 100, rung: 6 },
  // a buddy rides along in the cab window: for looks only, so any one can go on
  { slot: 'buddy', id: 'none', name: 'No Buddy', price: 0, rung: 0 },
  { slot: 'buddy', id: 'puppy', name: 'Puppy', price: 5, rung: 1, icon: '🐶' },
  { slot: 'buddy', id: 'kitty', name: 'Kitty', price: 8, rung: 2, icon: '🐱' },
  { slot: 'buddy', id: 'hamster', name: 'Hamster', price: 12, rung: 3, icon: '🐹' },
  { slot: 'buddy', id: 'bunny', name: 'Bunny', price: 16, rung: 4, icon: '🐰' },
  { slot: 'buddy', id: 'piglet', name: 'Piglet', price: 20, rung: 5, icon: '🐷' },
  { slot: 'buddy', id: 'panda', name: 'Panda', price: 26, rung: 6, icon: '🐼' },
  { slot: 'buddy', id: 'foxcub', name: 'Fox Cub', price: 32, rung: 7, icon: '🦊' },
  { slot: 'buddy', id: 'koala', name: 'Koala', price: 40, rung: 8, icon: '🐨' },
  { slot: 'buddy', id: 'dino', name: 'Dino', price: 50, rung: 9, icon: '🦖' },
  { slot: 'buddy', id: 'unicorn', name: 'Unicorn', price: 65, rung: 10, icon: '🦄' },
  { slot: 'buddy', id: 'dragon', name: 'Dragon', price: 80, rung: 11, icon: '🐲' },
  { slot: 'buddy', id: 'robot', name: 'Robot', price: 95, rung: 12, icon: '🤖' },
] as const satisfies readonly Part[];
export type PartName = (typeof PARTS)[number]['name'];
export type OpensLine = Extract<(typeof PARTS)[number], { opens: string }>['opens'];

/** The truck's colour. Rescue Orange is free; the patterns cover the whole body. */
export const PAINTS = [
  { id: 'orange', name: 'Rescue Orange', price: 0, body: '#ff7a1a', trim: '#c95400', pattern: null },
  { id: 'green', name: 'Ranger Green', price: 4, body: '#4f8a3a', trim: '#2f5a22', pattern: null },
  { id: 'blue', name: 'Sky Blue', price: 4, body: '#3d9be0', trim: '#1f64a8', pattern: null },
  { id: 'yellow', name: 'Sunny Yellow', price: 4, body: '#ffd23f', trim: '#c99a00', pattern: null },
  { id: 'red', name: 'Fire Red', price: 4, body: '#e63946', trim: '#a01f2b', pattern: null },
  { id: 'purple', name: 'Grape Purple', price: 6, body: '#7a4fd8', trim: '#4f2fa0', pattern: null },
  { id: 'white', name: 'Snow White', price: 6, body: '#f4f6f8', trim: '#a9b4bf', pattern: null },
  { id: 'black', name: 'Night Black', price: 6, body: '#2a2d33', trim: '#000000', pattern: null },
  { id: 'pink', name: 'Bubblegum Pink', price: 8, body: '#ff7ac0', trim: '#c94a8c', pattern: null },
  { id: 'teal', name: 'Ocean Teal', price: 8, body: '#1fb5a8', trim: '#11786f', pattern: null },
  { id: 'zebra', name: 'Zebra Stripes', price: 10, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'giraffe', name: 'Giraffe Spots', price: 12, body: '#f2c14e', trim: '#8a4f1a', pattern: 'spots' },
  { id: 'camo', name: 'Jungle Camo', price: 12, body: '#6f8f4a', trim: '#3f5a2a', pattern: 'camo' },
  { id: 'mint', name: 'Mint Green', price: 6, body: '#7fdcb0', trim: '#3f9a72', pattern: null },
  { id: 'lime', name: 'Lemon Lime', price: 6, body: '#b6e04a', trim: '#6f9a1a', pattern: null },
  { id: 'brown', name: 'Chocolate Brown', price: 6, body: '#7a4a2a', trim: '#4a2a14', pattern: null },
  { id: 'silver', name: 'Shiny Silver', price: 10, body: '#c9d1d9', trim: '#7a8794', pattern: null },
  { id: 'gold', name: 'Shiny Gold', price: 16, body: '#f2c43a', trim: '#a87a00', pattern: null },
  { id: 'tiger', name: 'Tiger Stripes', price: 12, body: '#ff8a1f', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'cow', name: 'Cow Spots', price: 12, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'cow' },
  { id: 'leopard', name: 'Leopard Spots', price: 14, body: '#e8b860', trim: '#4a2a14', pattern: 'spots' },
  { id: 'dots', name: 'Polka Dots', price: 14, body: '#3d9be0', trim: '#f4f6f8', pattern: 'dots' },
  { id: 'ladybug', name: 'Ladybug', price: 16, body: '#e63946', trim: '#1d1d1f', pattern: 'dots' },
  { id: 'checks', name: 'Checkers', price: 16, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'checks' },
  { id: 'candy', name: 'Candy Stripes', price: 18, body: '#f4f6f8', trim: '#e63946', pattern: 'stripes' },
  { id: 'flames', name: 'Racing Flames', price: 20, body: '#2a2d33', trim: '#ff7a1a', pattern: 'flames' },
  { id: 'stars', name: 'Starry Night', price: 20, body: '#1f2f6a', trim: '#ffd23f', pattern: 'stars' },
  { id: 'rainbow', name: 'Rainbow', price: 24, body: '#e63946', trim: '#7a4fd8', pattern: 'rainbow' },
] as const;
export type PaintId = (typeof PAINTS)[number]['id'];
export type PaintName = (typeof PAINTS)[number]['name'];

// ---------- the Park ----------

/** Habitats in the order they are offered and laid out. The farm's barn is free: his first rescue lives there. */
export const PARK_HABITATS = [
  { id: 'farm', name: 'Barn', price: 0 },
  { id: 'grassland', name: 'Grassland', price: 15 },
  { id: 'forest', name: 'Forest', price: 30 },
  { id: 'pond', name: 'Pond', price: 45 },
  { id: 'desert', name: 'Desert', price: 60 },
  { id: 'rainforest', name: 'Rainforest', price: 70 },
  { id: 'ocean', name: 'Ocean Pool', price: 80 },
  { id: 'polar', name: 'Polar Ice', price: 100 },
] as const satisfies readonly { id: HabitatId; name: string; price: number }[];
export type PlotName = (typeof PARK_HABITATS)[number]['name'];

/** Five extras for each habitat, for looks: each shows inside its habitat. */
export const EXTRAS = [
  { id: 'hay', home: 'farm', name: 'Hay Bales', price: 8, icon: '🌾' },
  { id: 'tractor', home: 'farm', name: 'Tractor', price: 20, icon: '🚜' },
  { id: 'waterhole', home: 'grassland', name: 'Water Hole', price: 10, icon: '💧' },
  { id: 'acacia', home: 'grassland', name: 'Acacia Tree', price: 22, icon: '🌳' },
  { id: 'log', home: 'forest', name: 'Hollow Log', price: 10, icon: '🪵' },
  { id: 'mushrooms', home: 'forest', name: 'Mushroom Ring', price: 24, icon: '🍄' },
  { id: 'lilies', home: 'pond', name: 'Lily Pads', price: 10, icon: '🪷' },
  { id: 'reeds', home: 'pond', name: 'Cattail Reeds', price: 24, icon: '🌾' },
  { id: 'cactus', home: 'desert', name: 'Cactus Garden', price: 12, icon: '🌵' },
  { id: 'oasis', home: 'desert', name: 'Oasis', price: 26, icon: '🌴' },
  { id: 'coral', home: 'ocean', name: 'Coral Reef', price: 14, icon: '🪸' },
  { id: 'shells', home: 'ocean', name: 'Seashells', price: 28, icon: '🐚' },
  { id: 'icecave', home: 'polar', name: 'Ice Cave', price: 14, icon: '🧊' },
  { id: 'lights', home: 'polar', name: 'Northern Lights', price: 30, icon: '🌌' },
  { id: 'sunflowers', home: 'farm', name: 'Sunflowers', price: 12, icon: '🌻' },
  { id: 'pumpkins', home: 'farm', name: 'Pumpkin Patch', price: 16, icon: '🎃' },
  { id: 'appletree', home: 'farm', name: 'Apple Tree', price: 26, icon: '🍎' },
  { id: 'rock', home: 'grassland', name: 'Big Rock', price: 12, icon: '🪨' },
  { id: 'wildflowers', home: 'grassland', name: 'Wildflowers', price: 16, icon: '🌼' },
  { id: 'nests', home: 'grassland', name: 'Bird Nests', price: 28, icon: '🪹' },
  { id: 'pines', home: 'forest', name: 'Pine Trees', price: 12, icon: '🌲' },
  { id: 'berries', home: 'forest', name: 'Berry Bushes', price: 18, icon: '🫐' },
  { id: 'treehouse', home: 'forest', name: 'Tree House', price: 30, icon: '🛖' },
  { id: 'dock', home: 'pond', name: 'Fishing Dock', price: 12, icon: '🎣' },
  { id: 'canoe', home: 'pond', name: 'Canoe', price: 18, icon: '🛶' },
  { id: 'pondbow', home: 'pond', name: 'Rainbow', price: 30, icon: '🌈' },
  { id: 'blooms', home: 'desert', name: 'Desert Flowers', price: 14, icon: '🌺' },
  { id: 'pots', home: 'desert', name: 'Clay Pots', price: 20, icon: '🏺' },
  { id: 'shade', home: 'desert', name: 'Sun Shade', price: 30, icon: '⛱️' },
  { id: 'castle', home: 'ocean', name: 'Sand Castle', price: 16, icon: '🏰' },
  { id: 'kelp', home: 'ocean', name: 'Sea Kelp', price: 20, icon: '🌿' },
  { id: 'sailboat', home: 'ocean', name: 'Sailboat', price: 30, icon: '⛵' },
  { id: 'snowman', home: 'polar', name: 'Snowman', price: 16, icon: '☃️' },
  { id: 'sled', home: 'polar', name: 'Sled', price: 22, icon: '🛷' },
  { id: 'snowflakes', home: 'polar', name: 'Snowflakes', price: 30, icon: '❄️' },
  { id: 'bananas', home: 'rainforest', name: 'Banana Tree', price: 10, icon: '🍌' },
  { id: 'vines', home: 'rainforest', name: 'Hanging Vines', price: 14, icon: '🍃' },
  { id: 'orchids', home: 'rainforest', name: 'Orchids', price: 18, icon: '🌸' },
  { id: 'waterfall', home: 'rainforest', name: 'Waterfall', price: 24, icon: '🏞️' },
  { id: 'bridge', home: 'rainforest', name: 'Rope Bridge', price: 30, icon: '🌉' },
] as const satisfies readonly { id: string; home: HabitatId; name: string; price: number; icon: string }[];
export type ExtraName = (typeof EXTRAS)[number]['name'];

/** Things for the paths between the habitats. */
export const DECOS = [
  { id: 'flowers', name: 'Flower Beds', price: 4, icon: '🌷' },
  { id: 'benches', name: 'Benches', price: 6, icon: '🪑' },
  { id: 'lamps', name: 'Lamp Posts', price: 8, icon: '🏮' },
  { id: 'picnic', name: 'Picnic Tables', price: 10, icon: '🧺' },
  { id: 'fountain', name: 'Fountain', price: 14, icon: '⛲' },
  { id: 'butterflies', name: 'Butterfly Garden', price: 20, icon: '🦋' },
  { id: 'shop', name: 'Gift Shop', price: 25, icon: '🎁' },
  { id: 'vet', name: 'Animal Hospital', price: 30, icon: '🏥' },
  { id: 'tower', name: 'Lookout Tower', price: 40, icon: '🔭' },
  { id: 'train', name: 'Park Train', price: 60, icon: '🚂' },
  { id: 'balloon', name: 'Hot Air Balloon', price: 80, icon: '🎈' },
  { id: 'sign', name: 'Welcome Sign', price: 5, icon: '🪧' },
  { id: 'flags', name: 'Flags', price: 6, icon: '🎏' },
  { id: 'recycling', name: 'Recycling Bins', price: 7, icon: '♻️' },
  { id: 'icecream', name: 'Ice Cream Cart', price: 12, icon: '🍦' },
  { id: 'popcorn', name: 'Popcorn Stand', price: 15, icon: '🍿' },
  { id: 'snacks', name: 'Snack Bar', price: 18, icon: '🌭' },
  { id: 'bubbles', name: 'Bubble Machine', price: 22, icon: '🫧' },
  { id: 'splash', name: 'Splash Pad', price: 25, icon: '💦' },
  { id: 'band', name: 'Bandstand', price: 28, icon: '🎺' },
  { id: 'playground', name: 'Playground', price: 32, icon: '🛝' },
  { id: 'golf', name: 'Mini Golf', price: 36, icon: '⛳' },
  { id: 'tent', name: 'Big Tent', price: 42, icon: '🎪' },
  { id: 'bus', name: 'Tour Bus', price: 48, icon: '🚌' },
  { id: 'carousel', name: 'Carousel', price: 55, icon: '🎠' },
  { id: 'gondola', name: 'Sky Gondola', price: 62, icon: '🚡' },
  { id: 'ferris', name: 'Ferris Wheel', price: 70, icon: '🎡' },
  { id: 'rocket', name: 'Rocket Ride', price: 78, icon: '🚀' },
  { id: 'coaster', name: 'Roller Coaster', price: 88, icon: '🎢' },
  { id: 'fireworks', name: 'Fireworks', price: 100, icon: '🎆' },
] as const;
export type DecoName = (typeof DECOS)[number]['name'];

// ---------- one key for anything he can own ----------

export type Tab = Slot | 'paint' | 'habitat' | 'extra' | 'deco';
export type ItemKey = `${Tab}:${string}`;
export type ItemName = PartName | PaintName | PlotName | ExtraName | DecoName;
export interface Item { key: ItemKey; tab: Tab; id: string; name: ItemName; price: number }

export const ITEMS: readonly Item[] = [
  ...PARTS.map(p => ({ key: `${p.slot}:${p.id}` as ItemKey, tab: p.slot as Tab, id: p.id as string, name: p.name, price: p.price })),
  ...PAINTS.map(p => ({ key: `paint:${p.id}` as ItemKey, tab: 'paint' as Tab, id: p.id as string, name: p.name, price: p.price })),
  ...PARK_HABITATS.map(h => ({ key: `habitat:${h.id}` as ItemKey, tab: 'habitat' as Tab, id: h.id as string, name: h.name, price: h.price })),
  ...EXTRAS.map(x => ({ key: `extra:${x.id}` as ItemKey, tab: 'extra' as Tab, id: x.id as string, name: x.name, price: x.price })),
  ...DECOS.map(d => ({ key: `deco:${d.id}` as ItemKey, tab: 'deco' as Tab, id: d.id as string, name: d.name, price: d.price })),
];
export const ALL_KEYS = ITEMS.map(i => i.key);
export const isItemKey = (x: unknown): x is ItemKey => typeof x === 'string' && ITEMS.some(i => i.key === x);
export const item = (k: ItemKey) => ITEMS.find(i => i.key === k)!;
export const keyOf = (tab: Tab, id: string) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.split(':')[0] as Tab;
export const idOf = (k: ItemKey) => k.split(':')[1]!;
export const keysIn = (tab: Tab) => ITEMS.filter(i => i.tab === tab).map(i => i.key);
export const STARTERS: readonly ItemKey[] = ITEMS.filter(i => i.price === 0).map(i => i.key);
export const ALL_NAMES = [...new Set(ITEMS.map(i => i.name))];
export const partOf = (k: ItemKey) => PARTS.find(p => `${p.slot}:${p.id}` === k);
export const paintOf = (id: string) => PAINTS.find(p => p.id === id) ?? PAINTS[0];
/** The buddy riding along, or nothing. */
export const buddyIcon = (id: string) => PARTS.find(p => p.slot === 'buddy' && p.id === id && 'icon' in p) as { icon: string } | undefined;

/** What's on his truck. */
export interface Truck { tires: string; winch: string; lights: string; carrier: string; buddy: string; paint: PaintId }
export const starterTruck = (): Truck => ({ tires: 'street', winch: 'rope', lights: 'plain', carrier: 'little', buddy: 'none', paint: 'orange' });
export const rungOf = (t: Truck, slot: Slot) => PARTS.find(p => p.slot === slot && p.id === t[slot])?.rung ?? 0;
export const fittedKeys = (t: Truck): ItemKey[] => [...SLOTS.map(s => keyOf(s, t[s])), keyOf('paint', t.paint)];
export function fit(t: Truck, k: ItemKey): Truck {
  const tab = tabOf(k), id = idOf(k);
  if (tab === 'paint') return { ...t, paint: id as PaintId };
  if ((SLOTS as readonly string[]).includes(tab)) return { ...t, [tab]: id };
  return t;
}
export const isTruckKey = (k: ItemKey) => tabOf(k) === 'paint' || (SLOTS as readonly string[]).includes(tabOf(k));
