// Everything at the Roost he can buy with Flames: eggs, tricks, pieces of the roost, gear, colours for his dragon's breath and trail, and
// toys and treats. Prices up to 100 can be any number; above 100 they are whole tens up to 400, because the voice has a clip for each of
// those (phrases.ts, PRICE_TENS).
//
// A dear thing always changes what he can do or how the Flight plays: a rare egg hatches a dragon with a different breath (frost reaches
// further, bubbles spread wider), a saddle makes it climb or fly faster, a magnet pulls Flames in, a trick belt gives it another trick
// button, a lookout points to the next beacon, a hot spring hatches eggs a Round sooner, a nest holds another egg. A paint is never the
// dearest thing.
import { BREATHS, type BreathId, type DragonLook } from '../art/dragon';
import type { Effect } from '../flight/sim';

export const CATEGORIES = ['egg', 'trick', 'roost', 'gear', 'colour', 'toy'] as const;
export type Category = (typeof CATEGORIES)[number];
interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string }

// ---------- eggs: forty named dragons ----------

export interface EggItem extends Base { readonly cat: 'egg'; readonly kind: string; readonly rounds: number; readonly look: DragonLook }
/** Each named egg's dragon: body, head, horns, wings, tail, colour, accent, pattern, breath. Horns 8, wings 7 and pattern 8 are kept for
 *  the wild eggs. */
const EGG_SPECS: readonly [kind: string, price: number, rounds: number, look: readonly [number, number, number, number, number, number, number, number, BreathId]][] = [
  ['Ember', 6, 3, [0, 0, 1, 0, 0, 1, 2, 0, 'fire']], ['Puddle', 8, 3, [5, 1, 0, 2, 2, 6, 15, 1, 'bubbles']], ['Pebble', 10, 3, [2, 2, 1, 3, 3, 19, 21, 4, 'fire']],
  ['Sprout', 12, 3, [3, 0, 2, 5, 0, 4, 3, 2, 'fire']], ['Sunny', 14, 3, [0, 3, 4, 1, 2, 2, 1, 3, 'sparks']], ['Frosty', 16, 4, [1, 1, 3, 4, 0, 16, 21, 3, 'frost']],
  ['Bubbles', 18, 4, [5, 0, 0, 2, 2, 7, 11, 1, 'bubbles']], ['Mossy', 20, 4, [2, 4, 7, 5, 3, 23, 3, 7, 'fire']], ['Sparky', 22, 4, [3, 1, 6, 0, 0, 2, 0, 6, 'sparks']],
  ['Coral', 24, 4, [4, 0, 1, 6, 4, 11, 5, 1, 'bubbles']], ['Dusty', 26, 4, [2, 2, 2, 0, 3, 18, 13, 7, 'fire']], ['Misty', 28, 4, [1, 3, 5, 1, 2, 17, 21, 0, 'frost']],
  ['Blossom', 30, 4, [0, 0, 0, 2, 2, 12, 4, 5, 'bubbles']], ['Cocoa', 32, 4, [4, 2, 1, 3, 3, 18, 13, 1, 'fire']], ['Clover', 34, 4, [0, 4, 2, 5, 1, 3, 4, 3, 'sparks']],
  ['Pepper', 36, 4, [3, 1, 6, 0, 0, 0, 20, 2, 'fire']], ['Comet', 38, 5, [1, 3, 3, 4, 5, 8, 2, 3, 'sparks']], ['Pumpkin', 40, 5, [4, 0, 1, 3, 4, 1, 4, 2, 'fire']],
  ['Jelly', 44, 5, [5, 1, 0, 2, 2, 11, 12, 1, 'bubbles']], ['Marble', 48, 5, [2, 2, 4, 6, 3, 21, 19, 4, 'frost']], ['Ziggy', 52, 5, [3, 4, 6, 0, 0, 2, 9, 6, 'sparks']],
  ['Nugget', 56, 5, [2, 0, 1, 3, 3, 22, 1, 1, 'fire']], ['Thunder', 60, 5, [1, 1, 3, 4, 0, 8, 2, 6, 'sparks']], ['Snowball', 64, 5, [5, 3, 2, 1, 2, 21, 6, 0, 'frost']],
  ['Lemon', 68, 5, [0, 2, 4, 2, 2, 2, 3, 1, 'bubbles']], ['Berry', 72, 5, [4, 0, 2, 5, 4, 9, 11, 1, 'fire']], ['Cinder', 76, 6, [1, 4, 6, 0, 5, 20, 1, 6, 'fire']],
  ['Glow', 80, 6, [3, 3, 5, 1, 2, 14, 2, 3, 'sparks']], ['Drizzle', 84, 6, [5, 1, 0, 6, 2, 6, 16, 4, 'frost']], ['Breeze', 88, 6, [3, 0, 3, 1, 0, 15, 21, 5, 'frost']],
  ['Pickle', 92, 6, [2, 2, 1, 5, 3, 4, 14, 7, 'bubbles']], ['Waffle', 96, 6, [4, 3, 4, 3, 1, 13, 18, 4, 'fire']], ['Sapphire', 100, 6, [1, 1, 3, 4, 0, 7, 16, 4, 'frost']],
  ['Ruby', 110, 7, [0, 0, 4, 4, 5, 0, 22, 4, 'fire']], ['Storm', 120, 7, [1, 4, 7, 4, 3, 8, 20, 6, 'sparks']], ['Velvet', 120, 7, [3, 3, 5, 1, 2, 9, 12, 3, 'bubbles']],
  ['Aurora', 140, 7, [1, 1, 3, 2, 4, 15, 10, 3, 'rainbow']], ['Galaxy', 150, 8, [3, 3, 5, 4, 0, 8, 21, 3, 'rainbow']], ['Rainbow', 160, 8, [5, 0, 4, 2, 2, 23, 11, 3, 'rainbow']],
  ['Golden', 180, 8, [1, 2, 4, 4, 5, 22, 21, 4, 'rainbow']],
];
export const EGGS: readonly EggItem[] = EGG_SPECS.map(([kind, price, rounds, l]) => ({
  cat: 'egg', id: `egg:${kind.toLowerCase()}`, name: `${kind} Egg`, kind, price, rounds, icon: '🥚',
  look: { body: l[0], head: l[1], horns: l[2], wings: l[3], tail: l[4], colour: l[5], accent: l[6], pattern: l[7], breath: l[8] },
}));
/** The dragon he starts with, already hatched: the first Flight is free on it. */
export const STARTER_LOOK: DragonLook = { body: 0, head: 0, horns: 1, wings: 0, tail: 0, colour: 4, accent: 2, pattern: 1, breath: 'fire' };

// ---------- tricks: each a doing word, a button in the Flight ----------

export interface TrickItem extends Base { readonly cat: 'trick'; readonly verb: string; readonly effect: Effect; readonly power: number }
const trick = (verb: string, price: number, effect: Effect, power: number, icon: string): TrickItem =>
  ({ cat: 'trick', id: `trick:${verb}`, name: verb.charAt(0).toUpperCase() + verb.slice(1), verb, price, effect, power, icon });
export const TRICKS: readonly TrickItem[] = [
  trick('flap', 0, 'hop', 1, '🪽'), trick('hop', 5, 'hop', 1.1, '🦘'), trick('spin', 8, 'ring', .9, '🌀'), trick('zoom', 12, 'zoom', 1, '💨'),
  trick('roar', 15, 'blaze', 1, '📣'), trick('loop', 18, 'ring', 1.1, '➰'), trick('dive', 21, 'magnet', 1, '🤿'), trick('glide', 24, 'float', 1, '🪁'),
  trick('dash', 27, 'zoom', 1.1, '⚡'), trick('wiggle', 30, 'hop', 1.2, '〰️'), trick('swoop', 33, 'magnet', 1.1, '🦅'), trick('puff', 36, 'blaze', 1.1, '💭'),
  trick('twirl', 39, 'ring', 1.2, '💫'), trick('hover', 42, 'float', 1.1, '🚁'), trick('bounce', 45, 'hop', 1.3, '🏀'), trick('splash', 48, 'magnet', 1.2, '💦'),
  trick('soar', 51, 'zoom', 1.2, '🦅'), trick('sneeze', 54, 'blaze', 1.2, '🤧'), trick('tumble', 57, 'ring', 1.3, '🤸'), trick('flutter', 60, 'float', 1.2, '🦋'),
  trick('dance', 63, 'hop', 1.4, '💃'), trick('shake', 66, 'magnet', 1.3, '🫨'), trick('zip', 70, 'zoom', 1.3, '🤐'), trick('sparkle', 74, 'blaze', 1.3, '✨'),
  trick('swirl', 78, 'ring', 1.4, '🌪️'), trick('wave', 82, 'float', 1.3, '👋'), trick('skip', 86, 'hop', 1.5, '🎈'), trick('flip', 90, 'ring', 1.5, '🔄'),
  trick('whirl', 95, 'magnet', 1.4, '🎡'), trick('blast', 100, 'zoom', 1.4, '🚀'),
];

// ---------- the roost: nests, perches and places to play ----------

/** What a piece of the roost does: holds an egg, warms eggs a Round sooner, shows another dragon, points to beacons, calms the wind. */
export type RoostDoes = 'nest' | 'warm' | 'perch' | 'lookout' | 'calm' | 'lights' | 'look';
export interface RoostItem extends Base { readonly cat: 'roost'; readonly does: RoostDoes; readonly needs?: string }
const piece = (id: string, name: string, price: number, icon: string, does: RoostDoes = 'look', needs?: string): RoostItem =>
  ({ cat: 'roost', id: `roost:${id}`, name, price, icon, does, ...(needs && { needs: `roost:${needs}` }) });
export const ROOST: readonly RoostItem[] = [
  piece('straw', 'Straw Nest', 0, '🪺', 'nest'), piece('twig', 'Twig Nest', 9, '🪺', 'nest'), piece('moss', 'Moss Nest', 25, '🪺', 'nest', 'twig'),
  piece('feather', 'Feather Nest', 45, '🪶', 'nest', 'moss'), piece('cloud', 'Cloud Nest', 70, '☁️', 'nest', 'feather'), piece('gold', 'Gold Nest', 100, '👑', 'nest', 'cloud'),
  piece('spring', 'Hot Spring', 90, '♨️', 'warm'), piece('hearth', 'Big Hearth', 120, '🔥', 'warm', 'spring'),
  piece('lookout', 'Lookout', 60, '🔭', 'lookout'), piece('vane', 'Weather Vane', 40, '🧭', 'calm'), piece('lanterns', 'Lanterns', 22, '🏮', 'lights'),
  piece('perch', 'Perch', 7, '🪵', 'perch'), piece('rock', 'Sunny Rock', 15, '🪨', 'perch'), piece('branch', 'Big Branch', 28, '🌳', 'perch'),
  piece('ledge', 'Nap Ledge', 38, '😴', 'perch'), piece('tower', 'Look Tower', 55, '🗼', 'perch'), piece('arch', 'Rock Arch', 75, '🌉', 'perch'),
  piece('waterfall', 'Waterfall', 50, '🌊'), piece('slide', 'Slide', 20, '🛝'), piece('treasure', 'Treasure Cave', 85, '💎'), piece('swing', 'Swing', 12, '🎠'),
  piece('pond', 'Splash Pond', 32, '💧'), piece('bell', 'Big Bell', 18, '🔔'), piece('windmill', 'Windmill', 42, '🎡'), piece('flag', 'Flag', 5, '🚩'),
  piece('garden', 'Flower Garden', 16, '🌷'), piece('mushrooms', 'Mushroom Ring', 24, '🍄'), piece('crystals', 'Crystal Cave', 65, '🔮'), piece('stars', 'Star Gazer', 48, '⭐'),
  piece('bath', 'Bubble Bath', 30, '🛁'), piece('cave', 'Sleepy Cave', 36, '🕳️'), piece('shelf', 'Snack Shelf', 14, '🧺'), piece('toybox', 'Toy Box', 11, '🧸'),
  piece('ladder', 'Rope Ladder', 10, '🪜'), piece('kitepost', 'Kite Post', 26, '🪁'), piece('sundial', 'Sun Dial', 34, '☀️'), piece('steps', 'Stone Steps', 8, '🪨'),
  piece('sign', 'Signpost', 6, '🪧'), piece('statue', 'Dragon Statue', 80, '🗿'), piece('fountain', 'Fountain', 58, '⛲'),
];

// ---------- gear: saddles, magnets, breath, trick belts, hats ----------

export type GearSlot = 'saddle' | 'magnet' | 'breath' | 'belt' | 'hat' | 'goggles' | 'extra';
export interface GearItem extends Base {
  readonly cat: 'gear'; readonly slot: GearSlot;
  /** Climb and speed for a saddle; reach for breath gear; grab for a magnet; trick buttons for a belt. */
  readonly climb?: number; readonly speed?: number; readonly reach?: number; readonly grab?: number; readonly slots?: number; readonly colour?: string;
}
const gear = (slot: GearSlot, id: string, name: string, price: number, icon: string, x: Partial<GearItem> = {}): GearItem =>
  ({ cat: 'gear', id: `gear:${id}`, name, price, icon, slot, ...x });
export const GEAR: readonly GearItem[] = [
  gear('saddle', 'rope', 'Rope Saddle', 12, '🪢', { climb: 1.12, colour: '#c8a165' }), gear('saddle', 'leather', 'Leather Saddle', 30, '🟫', { climb: 1.22, colour: '#8b4a1c' }),
  gear('saddle', 'racing', 'Racing Saddle', 55, '🏁', { climb: 1.2, speed: 1.08, colour: '#e8483b' }), gear('saddle', 'feather', 'Feather Saddle', 75, '🪶', { climb: 1.35, colour: '#f4f1e8' }),
  gear('saddle', 'cloud', 'Cloud Saddle', 95, '☁️', { climb: 1.45, colour: '#9fd8ff' }), gear('saddle', 'rocket', 'Rocket Saddle', 120, '🚀', { climb: 1.4, speed: 1.15, colour: '#6b7280' }),
  gear('saddle', 'gold', 'Gold Saddle', 150, '🥇', { climb: 1.6, speed: 1.12, colour: '#f5c518' }),
  gear('magnet', 'magnet', 'Flame Magnet', 35, '🧲', { grab: 4 }), gear('magnet', 'big-magnet', 'Big Magnet', 70, '🧲', { grab: 8 }), gear('magnet', 'super-magnet', 'Super Magnet', 110, '🧲', { grab: 12 }),
  gear('breath', 'long', 'Long Breath', 40, '🌬️', { reach: 3 }), gear('breath', 'longer', 'Longer Breath', 80, '🌬️', { reach: 6 }), gear('breath', 'mighty', 'Mighty Breath', 140, '🌬️', { reach: 9 }),
  gear('belt', 'belt', 'Trick Belt', 25, '🎒', { slots: 3 }), gear('belt', 'big-belt', 'Big Trick Belt', 90, '🎒', { slots: 4 }), gear('belt', 'super-belt', 'Super Trick Belt', 170, '🎒', { slots: 5 }),
  gear('hat', 'crown', 'Crown', 28, '👑'), gear('hat', 'top', 'Top Hat', 14, '🎩'), gear('hat', 'cap', 'Cap', 8, '🧢'), gear('hat', 'flower', 'Flower', 6, '🌸'),
  gear('hat', 'bow', 'Bow', 10, '🎀'), gear('hat', 'party', 'Party Hat', 18, '🥳'), gear('hat', 'helmet', 'Helmet', 22, '⛑️'), gear('hat', 'graduate', 'Smart Hat', 32, '🎓'),
  gear('goggles', 'snow-goggles', 'Snow Goggles', 26, '🥽'), gear('goggles', 'night-goggles', 'Night Goggles', 44, '🕶️'),
  gear('extra', 'bell', 'Little Bell', 9, '🔔'), gear('extra', 'scarf', 'Scarf', 13, '🧣'), gear('extra', 'cape', 'Cape', 24, '🦸'), gear('extra', 'backpack', 'Backpack', 17, '🎒'),
];
export const GEAR_SLOTS: readonly GearSlot[] = ['saddle', 'magnet', 'breath', 'belt', 'hat', 'goggles', 'extra'];

// ---------- colours: for the breath and the trail behind ----------

export interface ColourItem extends Base { readonly cat: 'colour'; readonly part: 'breath' | 'trail'; readonly hex: string; readonly core: string }
const colour = (part: 'breath' | 'trail', id: string, name: string, price: number, hex: string, core: string): ColourItem =>
  ({ cat: 'colour', id: `${part}:${id}`, name, price, icon: part === 'breath' ? '🔥' : '✨', part, hex, core });
export const COLOURS: readonly ColourItem[] = [
  colour('breath', 'plain', 'Its Own Breath', 0, '', ''),
  colour('breath', 'blue', 'Blue Fire', 4, '#3b82e8', '#cfe6ff'), colour('breath', 'green', 'Green Fire', 5, '#2fae5a', '#d4ffd8'), colour('breath', 'pink', 'Pink Fire', 6, '#ff5fa2', '#ffe0ee'),
  colour('breath', 'purple', 'Purple Fire', 7, '#8a4fd6', '#ead9ff'), colour('breath', 'gold', 'Gold Fire', 9, '#f5c518', '#fffbe0'), colour('breath', 'white', 'White Fire', 10, '#f4f1e8', '#ffffff'),
  colour('breath', 'red', 'Red Fire', 11, '#e8483b', '#ffd0c8'), colour('breath', 'teal', 'Teal Fire', 12, '#16a89a', '#c8fff6'), colour('breath', 'lime', 'Lime Fire', 13, '#9bd42a', '#f1ffd0'),
  colour('breath', 'silver', 'Silver Fire', 15, '#b8c0cc', '#ffffff'), colour('breath', 'black', 'Black Fire', 17, '#3a3a44', '#9ea3b0'), colour('breath', 'candy', 'Candy Fire', 19, '#ff9e9e', '#fff0f0'),
  colour('breath', 'sky', 'Sky Fire', 21, '#2bb5e8', '#e0f7ff'), colour('breath', 'rainbow', 'Rainbow Fire', 30, 'rainbow', '#ffffff'),
  colour('trail', 'none', 'No Trail', 0, '', ''),
  colour('trail', 'sparkle', 'Sparkle Trail', 4, '#ffe14d', '#ffffff'), colour('trail', 'heart', 'Heart Trail', 5, '#ff5fa2', '#ffd0e4'), colour('trail', 'star', 'Star Trail', 6, '#f5c518', '#fff6c2'),
  colour('trail', 'leaf', 'Leaf Trail', 7, '#2fae5a', '#c9f27a'), colour('trail', 'snow', 'Snow Trail', 8, '#f4f1e8', '#9fd8ff'), colour('trail', 'bubble', 'Bubble Trail', 9, '#9fd8ff', '#ffffff'),
  colour('trail', 'smoke', 'Smoke Trail', 10, '#9ea3b0', '#e5e7eb'), colour('trail', 'flower', 'Flower Trail', 12, '#ff9e9e', '#ffd27f'), colour('trail', 'moon', 'Moon Trail', 14, '#b9a6ff', '#ffffff'),
  colour('trail', 'ember', 'Ember Trail', 16, '#ff8a1f', '#ffd27f'), colour('trail', 'cloud', 'Cloud Trail', 18, '#e5e7eb', '#ffffff'), colour('trail', 'gold', 'Gold Trail', 20, '#d4a017', '#fff2b8'),
  colour('trail', 'comet', 'Comet Trail', 24, '#2bb5e8', '#ffffff'), colour('trail', 'rainbow', 'Rainbow Trail', 32, 'rainbow', '#ffffff'),
];

// ---------- toys and treats ----------

export interface ToyItem extends Base { readonly cat: 'toy'; readonly treat: boolean }
const toy = (id: string, name: string, price: number, icon: string, treat = false): ToyItem => ({ cat: 'toy', id: `toy:${id}`, name, price, icon, treat });
export const TOYS: readonly ToyItem[] = [
  toy('apple', 'Apple', 3, '🍎', true), toy('muffin', 'Muffin', 4, '🧁', true), toy('pancake', 'Pancakes', 5, '🥞', true), toy('pretzel', 'Pretzel', 5, '🥨', true),
  toy('sandwich', 'Sandwich', 6, '🥪', true), toy('cake', 'Big Cake', 8, '🎂', true), toy('popcorn', 'Popcorn', 7, '🍿', true), toy('pumpkin', 'Pumpkin Pie', 9, '🥧', true),
  toy('candy', 'Candy', 10, '🍬', true), toy('peach', 'Peach', 4, '🍑', true), toy('corn', 'Corn', 3, '🌽', true), toy('toast', 'Toast', 5, '🍞', true),
  toy('jelly', 'Jelly', 8, '🍮', true), toy('milk', 'Milk', 3, '🥛', true), toy('pizza', 'Pizza', 12, '🍕', true),
  toy('ball', 'Ball', 6, '⚽'), toy('kite', 'Kite', 9, '🪁'), toy('drum', 'Drum', 11, '🥁'), toy('teddy', 'Teddy', 13, '🧸'), toy('blocks', 'Blocks', 15, '🧱'),
  toy('boat', 'Toy Boat', 17, '⛵'), toy('wand', 'Bubble Wand', 19, '🫧'), toy('trumpet', 'Trumpet', 21, '🎺'), toy('robot', 'Toy Robot', 23, '🤖'), toy('rocket', 'Toy Rocket', 25, '🚀'),
  toy('puzzle', 'Puzzle', 27, '🧩'), toy('marbles', 'Marbles', 29, '🔮'), toy('pinwheel', 'Pinwheel', 31, '🎐'), toy('yoyo', 'Yo-yo', 33, '🪀'), toy('piano', 'Piano', 45, '🎹'),
];

// ---------- all of it ----------

export type Item = EggItem | TrickItem | RoostItem | GearItem | ColourItem | ToyItem;
export const ITEMS: readonly Item[] = [...EGGS, ...TRICKS, ...ROOST, ...GEAR, ...COLOURS, ...TOYS];
const byId = new Map(ITEMS.map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const itemOf = (id: string): Item => { const i = byId.get(id); if (!i) throw new Error(`no item ${id}`); return i; };
/** What he starts with: Flap, the Straw Nest, his dragon's own breath and no trail. */
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export const ITEM_NAMES = ITEMS.map(i => i.name);
export { BREATHS };

// ---------- things to buy again and again ----------

/** A new ledge higher up the mountain, with room for another nest and another dragon to sit: the roost has no top. Wild eggs come after
 *  the forty named ones, each made from its number. Each costs a little more than the last, then stays flat. */
export const REPEATS = [
  { id: 'ledge', name: 'New Ledge', icon: '⛰️', base: 40, step: 10, flat: 120 },
  { id: 'wild', name: 'Wild Egg', icon: '🥚', base: 40, step: 2, flat: 60 },
] as const;
export type RepeatId = (typeof REPEATS)[number]['id'];
export type RepeatName = (typeof REPEATS)[number]['name'];
export const REPEAT_IDS = REPEATS.map(r => r.id) as RepeatId[];
export const repeatOf = (id: RepeatId) => REPEATS.find(r => r.id === id)!;
/** The price of the next one, when he has bought `k`: whole tens above 100, so the voice can say it. */
export function repeatPrice(id: RepeatId, k: number): number {
  const r = repeatOf(id), p = Math.min(r.flat, r.base + r.step * k);
  return p > 100 ? Math.round(p / 10) * 10 : p;
}
