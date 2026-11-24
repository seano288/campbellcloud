// Everything Gems buy, as plain tables. Every price is at most 100 (the voice only has number clips up to 100). No row's id or price
// may change once a save holds it: a save keeps the ids it owns.
//
//   Tools      what he digs with: each clears more dirt a stroke and cracks rock in fewer taps, and opens a deeper dig site.
//   Gadgets    change how a Dig plays (the Bone Finder shows bones through the dirt, the Bone Magnet pulls them to the crate...).
//   Colors, Markings, Hats, Roars   looks and sounds for a living dinosaur, each dinosaur its own.
//   Gear       changes how the Alive run plays (Super Jump, Snack Magnet, Glider Cape...).
//   Lands      where the Alive run goes (the Fern Forest is free; the Beach, the Swamp, the Desert...), each with its own snacks.
//   Museum     things for the Museum hall, which do something when tapped.
// Gadgets and Gear are on once bought, unless he switches one off.

export const TABS = ['tool', 'gadget', 'color', 'marking', 'hat', 'roar', 'gear', 'land', 'deco'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = {
  tool: 'Tools', gadget: 'Gadgets', color: 'Colors', marking: 'Markings', hat: 'Hats', roar: 'Roars', gear: 'Gear', land: 'Lands', deco: 'Museum',
} as const satisfies Record<Tab, string>;
export const TAB_ICONS: Record<Tab, string> = { tool: '⛏️', gadget: '🔦', color: '🎨', marking: '🐆', hat: '🎩', roar: '📣', gear: '🏃', land: '🌋', deco: '🏛️' };

export interface Item { id: string; name: string; price: number; pic: string; line?: string }

/** Dig tools, weakest first. `tier`: which sites it opens; `radius`: how wide a stroke clears; `crack`: how hard it hits rock. */
export const TOOLS = [
  { id: 'brush', name: 'Brush', price: 0, pic: '🖌️', tier: 1, radius: 30, crack: 1 },
  { id: 'trowel', name: 'Trowel', price: 10, pic: '🥄', tier: 2, radius: 38, crack: 2 },
  { id: 'shovel', name: 'Shovel', price: 30, pic: '🪏', tier: 3, radius: 46, crack: 3 },
  { id: 'pickaxe', name: 'Pickaxe', price: 45, pic: '⛏️', tier: 4, radius: 52, crack: 4 },
  { id: 'jackhammer', name: 'Jackhammer', price: 60, pic: '🔨', tier: 5, radius: 58, crack: 6 },
  { id: 'digger', name: 'Digger', price: 100, pic: '🚜', tier: 6, radius: 72, crack: 9 },
] as const satisfies readonly (Item & { tier: number; radius: number; crack: number })[];
export type ToolId = (typeof TOOLS)[number]['id'];

export const GADGETS = [
  { id: 'lamp', name: 'Headlamp', price: 12, pic: '🔦', line: 'A light shines where you dig!' },
  { id: 'finder', name: 'Bone Finder', price: 15, pic: '📡', line: 'It shows the bones under the dirt!' },
  { id: 'goldscan', name: 'Gem Finder', price: 18, pic: '🔍', line: 'It shows the Gems under the dirt!' },
  { id: 'blower', name: 'Leaf Blower', price: 20, pic: '💨', line: 'Tap it to blow the dirt away!' },
  { id: 'magnet', name: 'Bone Magnet', price: 25, pic: '🪝', line: 'Bones fly to the crate by themselves!' },
  { id: 'hose', name: 'Water Hose', price: 30, pic: '🚿', line: 'Tap it to wash the mud away!' },
  { id: 'dynamite', name: 'Dynamite', price: 35, pic: '🧨', line: 'Tap it to blast all the rocks!' },
  { id: 'dog', name: 'Dig Dog', price: 40, pic: '🐕', line: 'A dog helps you dig!' },
  { id: 'drone', name: 'Rock Drone', price: 55, pic: '🛸', line: 'It flies over and cracks the rocks!' },
  { id: 'robot', name: 'Dig Robot', price: 70, pic: '🤖', line: 'A robot digs with you!' },
] as const satisfies readonly Item[];
export type GadgetId = (typeof GADGETS)[number]['id'];

/** Skin colours. Natural is free: each dinosaur's own colours. */
export const COLORS = [
  { id: 'natural', name: 'Natural', price: 0, pic: '🦖', skin: '', belly: '' },
  { id: 'red', name: 'Red', price: 3, pic: '🟥', skin: '#d63a2f', belly: '#f6b1a6' },
  { id: 'orange', name: 'Orange', price: 3, pic: '🟧', skin: '#ef8a22', belly: '#fbd29b' },
  { id: 'yellow', name: 'Yellow', price: 3, pic: '🟨', skin: '#f2c53a', belly: '#fff0b0' },
  { id: 'green', name: 'Green', price: 3, pic: '🟩', skin: '#3fa34d', belly: '#c4ebb6' },
  { id: 'blue', name: 'Blue', price: 3, pic: '🟦', skin: '#3a72d0', belly: '#b8d0f7' },
  { id: 'purple', name: 'Purple', price: 4, pic: '🟪', skin: '#8a4fc7', belly: '#dcc4f2' },
  { id: 'brown', name: 'Brown', price: 4, pic: '🟫', skin: '#8a5a33', belly: '#dfc19f' },
  { id: 'pink', name: 'Pink', price: 5, pic: '🌸', skin: '#ee7fb3', belly: '#fbd5e6' },
  { id: 'lime', name: 'Lime', price: 5, pic: '🍏', skin: '#93d13a', belly: '#e3f5b8' },
  { id: 'teal', name: 'Teal', price: 6, pic: '🩵', skin: '#1fa6a0', belly: '#b3ece6' },
  { id: 'black', name: 'Night Black', price: 6, pic: '⬛', skin: '#2b2b33', belly: '#7a7a88' },
  { id: 'white', name: 'Snow White', price: 6, pic: '⬜', skin: '#eef1f4', belly: '#ffffff' },
  { id: 'sky', name: 'Sky Blue', price: 8, pic: '🩵', skin: '#7cc4f2', belly: '#d9f0ff' },
  { id: 'lava', name: 'Lava Red', price: 10, pic: '🌋', skin: '#a3150e', belly: '#ff8a3d' },
  { id: 'silver', name: 'Silver', price: 15, pic: '🥈', skin: '#b8c0c8', belly: '#eef1f4' },
  { id: 'gold', name: 'Gold', price: 25, pic: '🥇', skin: '#e0b12a', belly: '#fff2b8' },
  { id: 'rainbow', name: 'Rainbow', price: 40, pic: '🌈', skin: 'rainbow', belly: '#ffffff' },
] as const satisfies readonly (Item & { skin: string; belly: string })[];
export type ColorId = (typeof COLORS)[number]['id'];

/** Markings drawn over the skin. None is free. */
export const MARKINGS = [
  { id: 'none', name: 'No Markings', price: 0, pic: '⚪' },
  { id: 'spots', name: 'Spots', price: 8, pic: '🔴' },
  { id: 'stripes', name: 'Stripes', price: 8, pic: '🦓' },
  { id: 'scales', name: 'Scales', price: 10, pic: '🐊' },
  { id: 'dots', name: 'Polka Dots', price: 12, pic: '🔵' },
  { id: 'zigzag', name: 'Zigzag', price: 12, pic: '⚡' },
  { id: 'hearts', name: 'Hearts', price: 15, pic: '💖' },
  { id: 'stars', name: 'Stars', price: 15, pic: '⭐' },
  { id: 'tiger', name: 'Tiger', price: 20, pic: '🐯' },
  { id: 'leopard', name: 'Leopard', price: 22, pic: '🐆' },
  { id: 'camo', name: 'Camo', price: 25, pic: '🪖' },
  { id: 'flames', name: 'Flames', price: 30, pic: '🔥' },
  { id: 'galaxy', name: 'Galaxy', price: 45, pic: '🌌' },
  { id: 'glow', name: 'Glow Stripes', price: 60, pic: '✨' },
] as const satisfies readonly Item[];
export type MarkingId = (typeof MARKINGS)[number]['id'];

export const HATS = [
  { id: 'none', name: 'No Hat', price: 0, pic: '🚫' },
  { id: 'cap', name: 'Cap', price: 6, pic: '🧢' },
  { id: 'bow', name: 'Hair Bow', price: 6, pic: '🎀' },
  { id: 'shades', name: 'Sunglasses', price: 10, pic: '🕶️' },
  { id: 'flower', name: 'Flower', price: 10, pic: '🌼' },
  { id: 'sunhat', name: 'Sun Hat', price: 12, pic: '👒' },
  { id: 'grad', name: 'Smart Hat', price: 15, pic: '🎓' },
  { id: 'phones', name: 'Headphones', price: 18, pic: '🎧' },
  { id: 'goggles', name: 'Goggles', price: 20, pic: '🥽' },
  { id: 'hardhat', name: 'Hard Hat', price: 22, pic: '⛑️' },
  { id: 'tophat', name: 'Top Hat', price: 28, pic: '🎩' },
  { id: 'helmet', name: 'Army Helmet', price: 30, pic: '🪖' },
  { id: 'crown', name: 'Crown', price: 50, pic: '👑' },
] as const satisfies readonly Item[];
export type HatId = (typeof HATS)[number]['id'];

/** Roars, made in code (sounds.ts). Big Roar is free. */
export const ROARS = [
  { id: 'roar', name: 'Big Roar', price: 0, pic: '🦖' },
  { id: 'squeak', name: 'Squeak', price: 5, pic: '🐭' },
  { id: 'chirp', name: 'Chirp', price: 8, pic: '🐦' },
  { id: 'honk', name: 'Honk', price: 8, pic: '📯' },
  { id: 'growl', name: 'Growl', price: 12, pic: '🐻' },
  { id: 'trumpet', name: 'Trumpet', price: 15, pic: '🎺' },
  { id: 'thunder', name: 'Thunder', price: 20, pic: '⛈️' },
  { id: 'robot', name: 'Robot', price: 25, pic: '🤖' },
  { id: 'dragon', name: 'Dragon', price: 30, pic: '🐉' },
  { id: 'siren', name: 'Siren', price: 35, pic: '🚨' },
  { id: 'laser', name: 'Space Laser', price: 40, pic: '🛸' },
  { id: 'mega', name: 'Mega Roar', price: 60, pic: '💥' },
] as const satisfies readonly Item[];
export type RoarId = (typeof ROARS)[number]['id'];

/** Gear for the Alive run, on for every dinosaur once bought. */
export const GEAR = [
  { id: 'sparkle', name: 'Sparkle Feet', price: 12, pic: '✨', line: 'Sparkles where you step!' },
  { id: 'trail', name: 'Rainbow Trail', price: 20, pic: '🌈', line: 'A rainbow follows you!' },
  { id: 'confetti', name: 'Confetti Roar', price: 25, pic: '🎉', line: 'Your roar throws confetti!' },
  { id: 'magnet', name: 'Snack Magnet', price: 35, pic: '🧲', line: 'Snacks fly to you!' },
  { id: 'springs', name: 'Super Jump', price: 40, pic: '🦘', line: 'You jump extra high!' },
  { id: 'turbo', name: 'Turbo Run', price: 50, pic: '⚡', line: 'You run extra fast!' },
  { id: 'stomp', name: 'Big Stomp', price: 60, pic: '💥', line: 'Land a jump to smash rocks!' },
  { id: 'cape', name: 'Glider Cape', price: 75, pic: '🦸', line: 'Hold jump to glide!' },
] as const satisfies readonly Item[];
export type GearId = (typeof GEAR)[number]['id'];

/** Where the Alive run goes. Each has its own sky, ground, snack and thing in the way. */
export const LANDS = [
  { id: 'forest', name: 'Fern Forest', price: 0, pic: '🌿', sky: ['#9fd8f0', '#e3f4d6'], ground: '#5d8f3a', ground2: '#4a7a2c', snack: '🍃', thing: 'log' },
  { id: 'beach', name: 'Sunny Beach', price: 20, pic: '🏖️', sky: ['#7fd0f5', '#fff2c8'], ground: '#ecd18b', ground2: '#d9b96d', snack: '🦐', thing: 'crab' },
  { id: 'swamp', name: 'Swamp', price: 30, pic: '🐸', sky: ['#a8c99a', '#dfe8c4'], ground: '#5b6b3a', ground2: '#46552b', snack: '🪰', thing: 'puddle' },
  { id: 'desert', name: 'Desert', price: 40, pic: '🏜️', sky: ['#f6c46a', '#fde8b4'], ground: '#d9a85e', ground2: '#c4924a', snack: '🌵', thing: 'cactus' },
  { id: 'snow', name: 'Snowy Hills', price: 55, pic: '🏔️', sky: ['#b8d6ee', '#f2f7fb'], ground: '#f4f8fb', ground2: '#d6e4ef', snack: '🫐', thing: 'snowman' },
  { id: 'volcano', name: 'Volcano', price: 70, pic: '🌋', sky: ['#5a2d2a', '#d9673a'], ground: '#4a3a36', ground2: '#3a2c29', snack: '🌶️', thing: 'lava' },
  { id: 'night', name: 'Night Jungle', price: 85, pic: '🌙', sky: ['#14183a', '#3a3f7a'], ground: '#2b4a2a', ground2: '#203a20', snack: '🍇', thing: 'log' },
  { id: 'candy', name: 'Candy Land', price: 100, pic: '🍭', sky: ['#ffc4e6', '#fff0fa'], ground: '#ff9fcf', ground2: '#f07fbf', snack: '🍬', thing: 'gumdrop' },
] as const satisfies readonly (Item & { sky: readonly [string, string]; ground: string; ground2: string; snack: string; thing: string })[];
export type LandId = (typeof LANDS)[number]['id'];

/** Things for the Museum hall. */
export const DECOS = [
  { id: 'ferns', name: 'Ferns', price: 5, pic: '🌿' },
  { id: 'bench', name: 'Bench', price: 6, pic: '🪑' },
  { id: 'balloons', name: 'Balloons', price: 8, pic: '🎈' },
  { id: 'palm', name: 'Palm Tree', price: 10, pic: '🌴' },
  { id: 'banners', name: 'Banners', price: 12, pic: '🎏' },
  { id: 'nest', name: 'Egg Nest', price: 15, pic: '🪺' },
  { id: 'visitors', name: 'Visitors', price: 18, pic: '🧒' },
  { id: 'clock', name: 'Big Clock', price: 20, pic: '🕰️' },
  { id: 'lights', name: 'Spotlights', price: 22, pic: '💡' },
  { id: 'fountain', name: 'Fountain', price: 25, pic: '⛲' },
  { id: 'volcano', name: 'Volcano Model', price: 30, pic: '🌋' },
  { id: 'meteor', name: 'Meteor', price: 35, pic: '☄️' },
  { id: 'shop', name: 'Gift Shop', price: 40, pic: '🛍️' },
  { id: 'disco', name: 'Disco Ball', price: 45, pic: '🪩' },
  { id: 'robot', name: 'Robot Guide', price: 50, pic: '🤖' },
  { id: 'skylight', name: 'Skylight', price: 55, pic: '☀️' },
  { id: 'rocket', name: 'Rocket', price: 65, pic: '🚀' },
  { id: 'rainbow', name: 'Rainbow Arch', price: 80, pic: '🌈' },
] as const satisfies readonly Item[];
export type DecoId = (typeof DECOS)[number]['id'];

// ---------- keys ----------

export const TABLES = { tool: TOOLS, gadget: GADGETS, color: COLORS, marking: MARKINGS, hat: HATS, roar: ROARS, gear: GEAR, land: LANDS, deco: DECOS } as const;
export type IdOf<T extends Tab> = (typeof TABLES)[T][number]['id'];
export type ItemKey = { [T in Tab]: `${T}:${IdOf<T>}` }[Tab];
export const keyOf = <T extends Tab>(tab: T, id: IdOf<T>) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.split(':')[0] as Tab;
export const idOf = (k: ItemKey) => k.split(':')[1]!;
export const ALL_KEYS: readonly ItemKey[] = TABS.flatMap(t => (TABLES[t] as readonly Item[]).map(i => `${t}:${i.id}` as ItemKey));
export const isItemKey = (x: unknown): x is ItemKey => (ALL_KEYS as readonly unknown[]).includes(x);
export const item = (k: ItemKey): Item => (TABLES[tabOf(k)] as readonly Item[]).find(i => i.id === idOf(k))!;
/** What he owns from the start. */
export const STARTERS: readonly ItemKey[] = ALL_KEYS.filter(k => item(k).price === 0);
/** Everything that costs Gems. */
export const FOR_SALE: readonly ItemKey[] = ALL_KEYS.filter(k => item(k).price > 0);
export const TOTAL_PRICE = FOR_SALE.reduce((n, k) => n + item(k).price, 0);

export type ItemName = (typeof TABLES)[Tab][number]['name'];
export type ItemLine = (typeof GADGETS)[number]['line'] | (typeof GEAR)[number]['line'];
export const ALL_NAMES: readonly ItemName[] = ALL_KEYS.map(k => item(k).name as ItemName);
