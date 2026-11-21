// Everything in the Garage. A car is a Body with a part in every Slot, and the parts are real: the Engine (and a little the Body) sets
// Speed, the Tyres and Wing (and a little the Body) set Grip, the Booster sets how many boosts he gets. Tyres also suit a surface:
// slicks on tarmac, knobbly on dirt, paddles on sand, studded on snow; the wrong one slides wider and never stops him. The rest (Paint,
// Rims, Decals, Horn, Boost Flame) is how it looks and sounds. Each slot has a free starter. Prices up to 100 can be anything; above
// 100 they are whole tens, up to 400, because the voice has a clip for each of those (phrases.ts, PRICE_TENS). Rival parts are never
// sold: each is won by finishing ahead of that Rival (rivals.ts); Mystery parts are won in the Mystery Race.
import type { Surface } from '../race/tracks';

export const SLOTS = ['body', 'engine', 'tyres', 'wing', 'booster', 'paint', 'rims', 'decal', 'horn', 'flame'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAMES = {
  body: 'Body', engine: 'Engine', tyres: 'Tyres', wing: 'Wing', booster: 'Booster', paint: 'Paint', rims: 'Rims', decal: 'Decals', horn: 'Horn', flame: 'Boost Flame',
} as const satisfies Record<Slot, string>;
export type SlotName = (typeof SLOT_NAMES)[Slot];

/** How a Body is drawn from above: long and wide in car units, the nose, and whether the wheels stand out from it. */
export interface BodyShape { readonly len: number; readonly wid: number; readonly nose: 'round' | 'point' | 'square' | 'wedge'; readonly open: boolean; readonly cab: number; readonly fins?: boolean; readonly style?: BodyStyle }
/** Vehicles that aren't plain race cars get their own extras drawn on (art/car.ts): a monster truck's big wheels, a fire truck's ladder. */
export const BODY_STYLES = ['pickup', 'jeep', 'taxi', 'icecream', 'police', 'fire', 'monster', 'limo', 'bike', 'tank', 'jet', 'ufo', 'dragon', 'star'] as const;
export type BodyStyle = (typeof BODY_STYLES)[number];

interface PartBase { readonly id: string; readonly name: string; readonly price: number | null }
export interface BodyPart extends PartBase { readonly slot: 'body'; readonly speed: number; readonly grip: number; readonly shape: BodyShape }
export interface EnginePart extends PartBase { readonly slot: 'engine'; readonly speed: number; readonly pipes: number }
export interface TyrePart extends PartBase { readonly slot: 'tyres'; readonly grip: number; readonly suits: Readonly<Record<Surface, number>>; readonly tread: 'street' | 'slick' | 'knobbly' | 'paddle' | 'studded' | 'all' | 'gold' }
export interface WingPart extends PartBase { readonly slot: 'wing'; readonly grip: number; readonly size: number; readonly twin?: boolean; readonly fin?: boolean }
export interface BoosterPart extends PartBase { readonly slot: 'booster'; readonly boosts: number; readonly kick: number; readonly cans: number }
export interface PaintPart extends PartBase { readonly slot: 'paint'; readonly main: string; readonly trim: string }
export interface RimPart extends PartBase { readonly slot: 'rims'; readonly color: string; readonly spokes: number; readonly star?: boolean; readonly rainbow?: boolean }
export interface DecalPart extends PartBase { readonly slot: 'decal'; readonly pattern: string; readonly color: string }
export interface HornPart extends PartBase { readonly slot: 'horn'; readonly sound: number }
export interface FlamePart extends PartBase { readonly slot: 'flame'; readonly colors: readonly string[]; readonly kind: 'flame' | 'stars' | 'bubbles' | 'zap' | 'hearts' | 'confetti' | 'ribbon' | 'comet' }
export type Part = BodyPart | EnginePart | TyrePart | WingPart | BoosterPart | PaintPart | RimPart | DecalPart | HornPart | FlamePart;

const all = (n: number): Record<Surface, number> => ({ tarmac: n, dirt: n, sand: n, snow: n });
/** The wrong tyre for a surface slides this much wider. */
export const WRONG = .65;
const suit = (good: Partial<Record<Surface, number>>): Record<Surface, number> => ({ ...all(WRONG), ...good });
const body = <const N extends string>(id: string, name: N, price: number | null, speed: number, grip: number, shape: BodyShape) => ({ slot: 'body', id, name, price, speed, grip, shape }) as BodyPart & { readonly name: N };

export const BODIES = [
  body('kart', 'Go-Kart', 0, 0, 0, { len: 64, wid: 36, nose: 'round', open: true, cab: .5 }),
  body('buggy', 'Beach Buggy', 6, 1, 1, { len: 66, wid: 38, nose: 'round', open: true, cab: .45 }),
  body('rod', 'Hot Rod', 12, 2, 1, { len: 70, wid: 36, nose: 'square', open: true, cab: .3 }),
  body('stock', 'Stock Car', 18, 2, 2, { len: 70, wid: 38, nose: 'square', open: false, cab: .45 }),
  body('rally', 'Rally Car', 25, 3, 3, { len: 68, wid: 38, nose: 'round', open: false, cab: .45 }),
  body('muscle', 'Muscle Car', 32, 4, 3, { len: 74, wid: 40, nose: 'square', open: false, cab: .4 }),
  body('formula', 'Formula Car', 40, 5, 4, { len: 76, wid: 34, nose: 'point', open: true, cab: .45 }),
  body('sports', 'Sports Car', 50, 6, 5, { len: 74, wid: 38, nose: 'wedge', open: false, cab: .5 }),
  body('dragster', 'Dragster', 60, 7, 5, { len: 84, wid: 32, nose: 'point', open: true, cab: .25 }),
  body('endurance', 'Endurance Racer', 72, 8, 6, { len: 78, wid: 38, nose: 'wedge', open: false, cab: .5, fins: true }),
  body('hover', 'Hover Car', 120, 9, 7, { len: 74, wid: 40, nose: 'round', open: false, cab: .5 }),
  body('rocket', 'Rocket Car', 160, 10, 8, { len: 82, wid: 36, nose: 'point', open: false, cab: .55, fins: true }),
  // More vehicles (2026-11-21): fun ones in the middle, then the fastest things on wheels (or tracks, or none)
  body('pickup', 'Pickup Truck', 30, 2, 3, { len: 76, wid: 40, nose: 'square', open: false, cab: .55, style: 'pickup' }),
  body('jeep', 'Jeep', 38, 3, 4, { len: 68, wid: 40, nose: 'square', open: true, cab: .5, style: 'jeep' }),
  body('taxi', 'Taxi', 44, 4, 3, { len: 72, wid: 38, nose: 'square', open: false, cab: .5, style: 'taxi' }),
  body('icecream', 'Ice Cream Truck', 55, 3, 5, { len: 78, wid: 42, nose: 'square', open: false, cab: .7, style: 'icecream' }),
  body('police', 'Police Car', 70, 6, 5, { len: 74, wid: 38, nose: 'square', open: false, cab: .5, style: 'police' }),
  body('fire', 'Fire Truck', 80, 5, 6, { len: 84, wid: 42, nose: 'square', open: false, cab: .78, style: 'fire' }),
  body('monster', 'Monster Truck', 110, 7, 8, { len: 74, wid: 48, nose: 'square', open: false, cab: .5, style: 'monster' }),
  body('limo', 'Limo', 120, 8, 6, { len: 96, wid: 38, nose: 'square', open: false, cab: .6, style: 'limo' }),
  body('bike', 'Race Bike', 150, 10, 7, { len: 60, wid: 22, nose: 'point', open: true, cab: .45, style: 'bike' }),
  body('tank', 'Tank', 180, 9, 11, { len: 80, wid: 50, nose: 'square', open: false, cab: .5, style: 'tank' }),
  body('jet', 'Jet Car', 220, 12, 9, { len: 88, wid: 34, nose: 'point', open: false, cab: .6, fins: true, style: 'jet' }),
  body('ufo', 'Flying Saucer', 280, 13, 11, { len: 66, wid: 62, nose: 'round', open: false, cab: .5, style: 'ufo' }),
  body('dragon', 'Dragon Car', 340, 14, 12, { len: 86, wid: 40, nose: 'point', open: false, cab: .55, style: 'dragon' }),
  body('star', 'Star Cruiser', 400, 15, 13, { len: 84, wid: 44, nose: 'wedge', open: false, cab: .5, fins: true, style: 'star' }),
] as const satisfies readonly BodyPart[];

export const ENGINES = [
  { slot: 'engine', id: 'putt', name: 'Putt-Putt Engine', price: 0, speed: 40, pipes: 1 },
  { slot: 'engine', id: 'zoom', name: 'Zoomer Engine', price: 8, speed: 46, pipes: 1 },
  { slot: 'engine', id: 'v6', name: 'V6 Engine', price: 16, speed: 52, pipes: 2 },
  { slot: 'engine', id: 'v8', name: 'V8 Engine', price: 28, speed: 58, pipes: 2 },
  { slot: 'engine', id: 'turbo', name: 'Turbo Engine', price: 42, speed: 65, pipes: 2 },
  { slot: 'engine', id: 'twin', name: 'Twin Turbo', price: 70, speed: 72, pipes: 4 },
  { slot: 'engine', id: 'jet', name: 'Jet Engine', price: 110, speed: 79, pipes: 1 },
  { slot: 'engine', id: 'rocket', name: 'Rocket Engine', price: 150, speed: 85, pipes: 3 },
  { slot: 'engine', id: 'warp', name: 'Warp Engine', price: 200, speed: 92, pipes: 2 },
  { slot: 'engine', id: 'star', name: 'Star Engine', price: 260, speed: 100, pipes: 4 },
  { slot: 'engine', id: 'galaxy', name: 'Galaxy Engine', price: 320, speed: 108, pipes: 3 },
  { slot: 'engine', id: 'nova', name: 'Supernova Engine', price: 400, speed: 116, pipes: 4 },
] as const satisfies readonly EnginePart[];

export const TYRES = [
  { slot: 'tyres', id: 'street', name: 'Street Tyres', price: 0, grip: 30, suits: all(.85), tread: 'street' },
  { slot: 'tyres', id: 'slick', name: 'Slick Tyres', price: 10, grip: 36, suits: suit({ tarmac: 1 }), tread: 'slick' },
  { slot: 'tyres', id: 'knobbly', name: 'Knobbly Tyres', price: 10, grip: 36, suits: suit({ dirt: 1, sand: .85 }), tread: 'knobbly' },
  { slot: 'tyres', id: 'paddle', name: 'Paddle Tyres', price: 12, grip: 36, suits: suit({ sand: 1, dirt: .85 }), tread: 'paddle' },
  { slot: 'tyres', id: 'studded', name: 'Studded Tyres', price: 12, grip: 36, suits: suit({ snow: 1 }), tread: 'studded' },
  { slot: 'tyres', id: 'race', name: 'Racing Slicks', price: 40, grip: 46, suits: suit({ tarmac: 1 }), tread: 'slick' },
  { slot: 'tyres', id: 'terrain', name: 'All-Terrain Tyres', price: 60, grip: 42, suits: all(.95), tread: 'all' },
  { slot: 'tyres', id: 'gold', name: 'Gold Tyres', price: 130, grip: 48, suits: all(1), tread: 'gold' },
  { slot: 'tyres', id: 'super', name: 'Super Grippers', price: 180, grip: 54, suits: all(.95), tread: 'all' },
  { slot: 'tyres', id: 'rocket', name: 'Rocket Tyres', price: 240, grip: 58, suits: all(1), tread: 'slick' },
  { slot: 'tyres', id: 'star', name: 'Star Tyres', price: 320, grip: 64, suits: all(1), tread: 'gold' },
] as const satisfies readonly TyrePart[];

export const WINGS = [
  { slot: 'wing', id: 'none', name: 'No Wing', price: 0, grip: 0, size: 0 },
  { slot: 'wing', id: 'little', name: 'Little Wing', price: 6, grip: 5, size: .5 },
  { slot: 'wing', id: 'duck', name: 'Duck Tail', price: 14, grip: 9, size: .6 },
  { slot: 'wing', id: 'spoiler', name: 'Spoiler', price: 24, grip: 13, size: .75 },
  { slot: 'wing', id: 'big', name: 'Big Wing', price: 36, grip: 17, size: 1 },
  { slot: 'wing', id: 'twin', name: 'Twin Wing', price: 50, grip: 21, size: .9, twin: true },
  { slot: 'wing', id: 'shark', name: 'Shark Fin', price: 80, grip: 25, size: .9, fin: true },
  { slot: 'wing', id: 'mega', name: 'Mega Wing', price: 130, grip: 30, size: 1.25, twin: true },
  { slot: 'wing', id: 'jetwing', name: 'Jet Wing', price: 170, grip: 34, size: 1.1, fin: true },
  { slot: 'wing', id: 'dragonwing', name: 'Dragon Wing', price: 230, grip: 38, size: 1.3, twin: true, fin: true },
  { slot: 'wing', id: 'galaxy', name: 'Galaxy Wing', price: 300, grip: 42, size: 1.4, twin: true },
] as const satisfies readonly WingPart[];

export const BOOSTERS = [
  { slot: 'booster', id: 'puffer', name: 'Puffer', price: 0, boosts: 1, kick: 1, cans: 1 },
  { slot: 'booster', id: 'fizz', name: 'Fizz Can', price: 8, boosts: 2, kick: 1, cans: 1 },
  { slot: 'booster', id: 'nitro', name: 'Nitro', price: 18, boosts: 2, kick: 1.15, cans: 2 },
  { slot: 'booster', id: 'turbo', name: 'Turbo Can', price: 30, boosts: 3, kick: 1.1, cans: 2 },
  { slot: 'booster', id: 'twin', name: 'Twin Nitro', price: 45, boosts: 3, kick: 1.25, cans: 2 },
  { slot: 'booster', id: 'pack', name: 'Rocket Pack', price: 60, boosts: 4, kick: 1.2, cans: 3 },
  { slot: 'booster', id: 'jet', name: 'Jet Pack', price: 110, boosts: 4, kick: 1.35, cans: 3 },
  { slot: 'booster', id: 'mega', name: 'Mega Boost', price: 150, boosts: 5, kick: 1.35, cans: 4 },
  { slot: 'booster', id: 'super', name: 'Super Nitro', price: 200, boosts: 6, kick: 1.4, cans: 4 },
  { slot: 'booster', id: 'hyper', name: 'Hyper Boost', price: 260, boosts: 7, kick: 1.45, cans: 4 },
  { slot: 'booster', id: 'galaxy', name: 'Galaxy Boost', price: 350, boosts: 8, kick: 1.55, cans: 4 },
] as const satisfies readonly BoosterPart[];

const paint = <const N extends string>(id: string, name: N, price: number | null, main: string, trim: string) => ({ slot: 'paint', id, name, price, main, trim }) as PaintPart & { readonly name: N };
export const PAINTS = [
  paint('red', 'Racing Red', 0, '#e63946', '#ffffff'), paint('yellow', 'Sunny Yellow', 3, '#ffd23f', '#1d1d1f'), paint('blue', 'Sky Blue', 3, '#3a8dde', '#ffffff'),
  paint('green', 'Grass Green', 3, '#3cb15b', '#ffffff'), paint('orange', 'Tiger Orange', 3, '#ff8a1f', '#1d1d1f'), paint('purple', 'Grape Purple', 4, '#8e5bd8', '#ffd23f'),
  paint('pink', 'Bubblegum Pink', 4, '#ff7ac8', '#ffffff'), paint('white', 'Snow White', 4, '#f4f6fa', '#e63946'), paint('black', 'Night Black', 5, '#2a2d36', '#ffd23f'),
  paint('silver', 'Chrome Silver', 6, '#c9ccd6', '#3a8dde'), paint('teal', 'Ocean Teal', 6, '#2fb3a6', '#ffffff'), paint('lime', 'Lime Green', 6, '#a8e63b', '#1d1d1f'),
  paint('navy', 'Midnight Blue', 6, '#22337a', '#ffd23f'), paint('brown', 'Chocolate Brown', 5, '#7a4a26', '#ffd23f'), paint('mint', 'Mint Green', 8, '#9be8c6', '#e63946'),
  paint('lemon', 'Lemon Yellow', 8, '#fff07a', '#8e5bd8'), paint('cherry', 'Cherry Red', 10, '#a3132a', '#ffffff'), paint('sunset', 'Sunset Gold', 12, '#ffb02e', '#e63946'),
  paint('candy', 'Cotton Candy', 12, '#ffc4e8', '#43b8f0'), paint('ice', 'Ice Blue', 14, '#bfe8ff', '#22337a'), paint('fire', 'Fire Orange', 15, '#ff5a10', '#ffd23f'),
  paint('jungle', 'Jungle Green', 16, '#1f6b3a', '#ffd23f'), paint('royal', 'Royal Purple', 18, '#4b2a9a', '#ffd23f'), paint('gold', 'Gold Rush', 20, '#e8b923', '#1d1d1f'),
  paint('lava', 'Lava Red', 30, '#c81d11', '#ffb02e'), paint('electric', 'Electric Blue', 35, '#0a6cff', '#fff07a'), paint('toxic', 'Toxic Green', 40, '#7dff1a', '#2a2d36'),
  paint('pearl', 'Pearl White', 50, '#fbf7ef', '#c9a227'), paint('rose', 'Rose Gold', 60, '#e8a598', '#ffffff'), paint('galaxy', 'Galaxy Purple', 80, '#3b1d6e', '#39ff88'),
  paint('diamond', 'Diamond Blue', 100, '#7fdcff', '#ffffff'), paint('solid', 'Solid Gold', 150, '#ffcc00', '#a3132a'),
] as const satisfies readonly PaintPart[];

const rim = <const N extends string>(id: string, name: N, price: number | null, color: string, spokes: number, extra: Partial<RimPart> = {}) => ({ slot: 'rims', id, name, price, color, spokes, ...extra }) as RimPart & { readonly name: N };
export const RIMS = [
  rim('plain', 'Plain Rims', 0, '#c9ccd6', 0), rim('red', 'Red Rims', 4, '#e63946', 0), rim('star', 'Star Rims', 6, '#ffd23f', 5, { star: true }),
  rim('spoke', 'Spoke Rims', 8, '#e6e9ef', 8), rim('blue', 'Blue Rims', 10, '#3a8dde', 5), rim('spinner', 'Spinner Rims', 14, '#c9ccd6', 3),
  rim('gold', 'Gold Rims', 18, '#e8b923', 6), rim('flower', 'Flower Rims', 22, '#ff7ac8', 6, { star: true }), rim('zap', 'Lightning Rims', 26, '#fff07a', 4),
  rim('rainbow', 'Rainbow Rims', 30, '#ffffff', 6, { rainbow: true }), rim('chrome', 'Chrome Rims', 35, '#f4f6fa', 10), rim('diamond', 'Diamond Rims', 40, '#bfe8ff', 8, { star: true }),
  rim('fire', 'Fire Rims', 50, '#ff5a10', 5), rim('ice', 'Ice Rims', 60, '#e6f7ff', 6, { star: true }), rim('fan', 'Fan Rims', 75, '#3cb15b', 12),
  rim('glow', 'Glow Rims', 90, '#39ff88', 4, { star: true }), rim('platinum', 'Platinum Rims', 120, '#e6e9ef', 16), rim('ruby', 'Ruby Rims', 150, '#d1103a', 8, { star: true }),
] as const satisfies readonly RimPart[];

const decal = <const N extends string>(id: string, name: N, price: number | null, pattern: string, color: string) => ({ slot: 'decal', id, name, price, pattern, color }) as DecalPart & { readonly name: N };
export const DECALS = [
  decal('none', 'No Decals', 0, 'none', '#fff'), decal('side', 'Side Stripe', 3, 'side', '#ffffff'), decal('stripes', 'Racing Stripes', 5, 'stripes', '#ffffff'),
  decal('dots', 'Polka Dots', 5, 'dots', '#ffffff'), decal('stars', 'Stars', 6, 'stars', '#ffd23f'), decal('hearts', 'Hearts', 6, 'hearts', '#ff7ac8'),
  decal('zigzag', 'Zigzag', 7, 'zigzag', '#1d1d1f'), decal('bolts', 'Lightning Bolts', 8, 'bolts', '#fff07a'), decal('flames', 'Flames', 8, 'flames', '#ff8a1f'),
  decal('checkers', 'Checkers', 10, 'checkers', '#1d1d1f'), decal('bubbles', 'Bubbles', 9, 'bubbles', '#bfe8ff'), decal('paws', 'Paw Prints', 9, 'paws', '#1d1d1f'),
  decal('swirls', 'Swirls', 11, 'swirls', '#ffffff'), decal('tiger', 'Tiger Stripes', 12, 'tiger', '#1d1d1f'), decal('shark', 'Shark Teeth', 14, 'shark', '#ffffff'),
  decal('rainbow', 'Rainbow Stripe', 18, 'rainbow', '#ffffff'), decal('dragon', 'Dragon', 25, 'dragon', '#3cb15b'), decal('comet', 'Comet', 30, 'comet', '#ffd23f'),
  decal('galaxy', 'Galaxy', 38, 'galaxy', '#8e5bd8'), decal('goldtrim', 'Gold Trim', 45, 'goldtrim', '#e8b923'),
  decal('waves', 'Waves', 40, 'waves', '#43b8f0'), decal('leopard', 'Leopard Spots', 55, 'leopard', '#3a2a14'), decal('diamonds', 'Diamonds', 65, 'diamonds', '#ffffff'),
  decal('pixels', 'Pixels', 75, 'pixels', '#39ff88'), decal('web', 'Spider Web', 90, 'web', '#ffffff'), decal('planets', 'Planets', 120, 'planets', '#ffd23f'),
  decal('crowns', 'Crowns', 150, 'crowns', '#ffd23f'), decal('tally', 'Tally Marks', 200, 'tally', '#ffffff'),
] as const satisfies readonly DecalPart[];

export const HORNS = [
  { slot: 'horn', id: 'beep', name: 'Beep Horn', price: 0, sound: 0 }, { slot: 'horn', id: 'honk', name: 'Honk Horn', price: 5, sound: 1 },
  { slot: 'horn', id: 'bell', name: 'Bike Bell', price: 7, sound: 2 }, { slot: 'horn', id: 'duck', name: 'Duck Horn', price: 9, sound: 3 },
  { slot: 'horn', id: 'air', name: 'Air Horn', price: 12, sound: 4 }, { slot: 'horn', id: 'clown', name: 'Clown Horn', price: 15, sound: 5 },
  { slot: 'horn', id: 'train', name: 'Train Horn', price: 20, sound: 6 }, { slot: 'horn', id: 'siren', name: 'Siren', price: 25, sound: 7 },
  { slot: 'horn', id: 'tune', name: 'Tune Horn', price: 32, sound: 8 }, { slot: 'horn', id: 'rig', name: 'Big Rig Horn', price: 40, sound: 9 },
  { slot: 'horn', id: 'roar', name: 'Lion Roar', price: 50, sound: 10 }, { slot: 'horn', id: 'laser', name: 'Laser Horn', price: 70, sound: 11 },
  { slot: 'horn', id: 'alarm', name: 'Car Alarm', price: 90, sound: 12 }, { slot: 'horn', id: 'fanfare', name: 'Fanfare Horn', price: 120, sound: 13 },
] as const satisfies readonly HornPart[];

export const FLAMES = [
  { slot: 'flame', id: 'orange', name: 'Orange Flame', price: 0, colors: ['#ff5a10', '#ffb02e', '#fff6c2'], kind: 'flame' },
  { slot: 'flame', id: 'blue', name: 'Blue Flame', price: 6, colors: ['#1f5fd1', '#43b8f0', '#e6f7ff'], kind: 'flame' },
  { slot: 'flame', id: 'green', name: 'Green Flame', price: 9, colors: ['#1f8a3a', '#7be36b', '#eaffd9'], kind: 'flame' },
  { slot: 'flame', id: 'purple', name: 'Purple Flame', price: 12, colors: ['#5b2aa8', '#b37bff', '#f3e6ff'], kind: 'flame' },
  { slot: 'flame', id: 'pink', name: 'Pink Flame', price: 15, colors: ['#d12a8a', '#ff7ac8', '#ffe6f5'], kind: 'flame' },
  { slot: 'flame', id: 'white', name: 'White Flame', price: 18, colors: ['#9aa3ad', '#e6e9ef', '#ffffff'], kind: 'flame' },
  { slot: 'flame', id: 'rainbow', name: 'Rainbow Flame', price: 25, colors: ['#e63946', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'], kind: 'flame' },
  { slot: 'flame', id: 'stars', name: 'Star Sparks', price: 30, colors: ['#ffd23f', '#fff07a', '#ffffff'], kind: 'stars' },
  { slot: 'flame', id: 'bubbles', name: 'Bubble Trail', price: 38, colors: ['#bfe8ff', '#ffffff', '#43b8f0'], kind: 'bubbles' },
  { slot: 'flame', id: 'zap', name: 'Lightning Trail', price: 50, colors: ['#fff07a', '#ffffff', '#43b8f0'], kind: 'zap' },
  { slot: 'flame', id: 'gold', name: 'Gold Flame', price: 60, colors: ['#b8901c', '#ffd23f', '#fff6c2'], kind: 'flame' },
  { slot: 'flame', id: 'ghost', name: 'Ghost Flame', price: 70, colors: ['#4fd1a5', '#b8ffe6', '#ffffff'], kind: 'flame' },
  { slot: 'flame', id: 'hearts', name: 'Heart Trail', price: 80, colors: ['#ff3c8a', '#ff7ac8', '#ffc4e8'], kind: 'hearts' },
  { slot: 'flame', id: 'confetti', name: 'Confetti Trail', price: 100, colors: ['#e63946', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'], kind: 'confetti' },
  { slot: 'flame', id: 'ribbon', name: 'Rainbow Trail', price: 140, colors: ['#e63946', '#ff8a1f', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'], kind: 'ribbon' },
  { slot: 'flame', id: 'comet', name: 'Comet Tail', price: 200, colors: ['#43b8f0', '#bfe8ff', '#ffffff'], kind: 'comet' },
] as const satisfies readonly FlamePart[];

/** Won from Rivals, one each, never sold (rivals.ts says who has which). Each is about as good as the shop's parts at that point in the
 *  ladder, a little better than what he can likely afford, so a win helps with the next Rival without making the shop pointless. */
export const RIVAL_PARTS = [
  { slot: 'wing', id: 'zippy', name: 'Lightning Wing', price: null, grip: 12, size: .8, fin: true },
  { slot: 'rims', id: 'sparky', name: 'Spark Rims', price: null, color: '#ffd23f', spokes: 7, star: true },
  { slot: 'body', id: 'ace', name: 'Ace Racer', price: null, speed: 3, grip: 3, shape: { len: 76, wid: 38, nose: 'wedge', open: false, cab: .45, fins: true } },
  { slot: 'tyres', id: 'mud', name: 'Mud Tyres', price: null, grip: 40, suits: suit({ dirt: 1, sand: .9 }), tread: 'knobbly' },
  { slot: 'decal', id: 'splash', name: 'Mud Splash', price: null, pattern: 'splash', color: '#7a4a26' },
  { slot: 'engine', id: 'crusher', name: 'Rock Crusher Engine', price: null, speed: 62, pipes: 4 },
  { slot: 'tyres', id: 'dune', name: 'Dune Paddles', price: null, grip: 40, suits: suit({ sand: 1, dirt: .9 }), tread: 'paddle' },
  { slot: 'body', id: 'jumper', name: 'Dune Jumper', price: null, speed: 4, grip: 4, shape: { len: 70, wid: 42, nose: 'round', open: true, cab: .4 } },
  { slot: 'flame', id: 'sun', name: 'Sun Flame', price: null, colors: ['#ff8a1f', '#ffe14d', '#fffbe0'], kind: 'stars' },
  { slot: 'tyres', id: 'ice', name: 'Ice Spikes', price: null, grip: 42, suits: suit({ snow: 1, tarmac: .85 }), tread: 'studded' },
  { slot: 'decal', id: 'snow', name: 'Snowflakes', price: null, pattern: 'snow', color: '#ffffff' },
  { slot: 'wing', id: 'icicle', name: 'Icicle Wing', price: null, grip: 22, size: 1.15, twin: true },
  { slot: 'paint', id: 'neon', name: 'Neon Glow', price: null, main: '#39ff88', trim: '#ff3ccf' },
  { slot: 'body', id: 'shadow', name: 'Shadow Racer', price: null, speed: 8, grip: 7, shape: { len: 80, wid: 36, nose: 'wedge', open: false, cab: .55, fins: true } },
  { slot: 'rims', id: 'moon', name: 'Moon Rims', price: null, color: '#fff6c2', spokes: 0, star: true },
  { slot: 'engine', id: 'magma', name: 'Magma Engine', price: null, speed: 88, pipes: 4 },
  { slot: 'booster', id: 'ember', name: 'Ember Booster', price: null, boosts: 5, kick: 1.5, cans: 4 },
  { slot: 'body', id: 'blaze', name: 'Blaze Bolt', price: null, speed: 11, grip: 9, shape: { len: 84, wid: 38, nose: 'point', open: false, cab: .5, fins: true } },
  // the four Cups added on 2026-11-21: Jungle, Candy, Moon, Rainbow
  { slot: 'paint', id: 'mango', name: 'Mango Paint', price: null, main: '#ffa62b', trim: '#3cb15b' },
  { slot: 'wing', id: 'tiki', name: 'Tiki Wing', price: null, grip: 32, size: 1.1, fin: true },
  { slot: 'body', id: 'beast', name: 'Jungle Beast', price: null, speed: 12, grip: 11, shape: { len: 78, wid: 48, nose: 'square', open: false, cab: .5, style: 'monster' } },
  { slot: 'decal', id: 'sprinkles', name: 'Candy Sprinkles', price: null, pattern: 'sprinkles', color: '#ffffff' },
  { slot: 'tyres', id: 'gumdrop', name: 'Gumdrop Tyres', price: null, grip: 56, suits: suit({ snow: 1, tarmac: .9, sand: .9, dirt: .9 }), tread: 'studded' },
  { slot: 'booster', id: 'taffy', name: 'Taffy Twister', price: null, boosts: 6, kick: 1.5, cans: 4 },
  { slot: 'rims', id: 'crater', name: 'Crater Rims', price: null, color: '#c9ccd6', spokes: 0, star: true },
  { slot: 'flame', id: 'orbit', name: 'Orbit Rings', price: null, colors: ['#bfe8ff', '#8e5bd8', '#ffffff'], kind: 'bubbles' },
  { slot: 'engine', id: 'novaprize', name: 'Nova Engine', price: null, speed: 112, pipes: 4 },
  { slot: 'wing', id: 'prism', name: 'Prism Wing', price: null, grip: 40, size: 1.3, twin: true },
  { slot: 'rims', id: 'dazzle', name: 'Dazzle Rims', price: null, color: '#ffffff', spokes: 8, rainbow: true },
  { slot: 'body', id: 'thunder', name: 'Thunderbolt', price: null, speed: 16, grip: 14, shape: { len: 88, wid: 38, nose: 'point', open: false, cab: .55, fins: true, style: 'jet' } },
] as const satisfies readonly Part[];

/** Won in the Mystery Race, one at every fifth Level (garage.ts, MYSTERY_PRIZE_EVERY), never sold. The later ones are the best there are. */
export const MYSTERY_PARTS = [
  { slot: 'paint', id: 'mystery', name: 'Mystery Paint', price: null, main: '#5a2fd6', trim: '#39ff88' },
  { slot: 'rims', id: 'mystery', name: 'Mystery Rims', price: null, color: '#8e5bd8', spokes: 5, star: true },
  { slot: 'decal', id: 'mystery', name: 'Question Marks', price: null, pattern: 'question', color: '#ffd23f' },
  { slot: 'flame', id: 'mystery', name: 'Mystery Sparks', price: null, colors: ['#8e5bd8', '#39ff88', '#ffd23f', '#ffffff'], kind: 'confetti' },
  { slot: 'horn', id: 'mystery', name: 'Mystery Horn', price: null, sound: 14 },
  { slot: 'wing', id: 'mystery', name: 'Mystery Wing', price: null, grip: 44, size: 1.35, twin: true, fin: true },
  { slot: 'tyres', id: 'mystery', name: 'Mystery Tyres', price: null, grip: 66, suits: all(1), tread: 'gold' },
  { slot: 'booster', id: 'mystery', name: 'Mystery Booster', price: null, boosts: 8, kick: 1.6, cans: 4 },
  { slot: 'engine', id: 'mystery', name: 'Mystery Engine', price: null, speed: 120, pipes: 4 },
  { slot: 'body', id: 'mystery', name: 'Mystery Racer', price: null, speed: 17, grip: 15, shape: { len: 86, wid: 42, nose: 'wedge', open: false, cab: .5, fins: true, style: 'star' } },
] as const satisfies readonly Part[];

export const PARTS: readonly Part[] = [...BODIES, ...ENGINES, ...TYRES, ...WINGS, ...BOOSTERS, ...PAINTS, ...RIMS, ...DECALS, ...HORNS, ...FLAMES, ...RIVAL_PARTS, ...MYSTERY_PARTS];
export type PartName = (typeof BODIES | typeof ENGINES | typeof TYRES | typeof WINGS | typeof BOOSTERS | typeof PAINTS | typeof RIMS | typeof DECALS | typeof HORNS | typeof FLAMES | typeof RIVAL_PARTS | typeof MYSTERY_PARTS)[number]['name'];

/** One part, as the save keeps it: "engine:v8", "paint:blue". */
export type PartKey = `${Slot}:${string}`;
export const keyOf = (p: Pick<Part, 'slot' | 'id'>) => `${p.slot}:${p.id}` as PartKey;
export const ALL_KEYS: readonly PartKey[] = PARTS.map(keyOf);
const BY_KEY = new Map<string, Part>(PARTS.map(p => [keyOf(p), p]));
export const MYSTERY_KEYS: readonly PartKey[] = MYSTERY_PARTS.map(keyOf);
export const isPartKey = (x: unknown): x is PartKey => typeof x === 'string' && BY_KEY.has(x);
export const partOf = (k: PartKey): Part => BY_KEY.get(k)!;
export const slotOf = (k: PartKey) => k.split(':')[0] as Slot;
export const nameOf = (k: PartKey) => partOf(k).name as PartName;
export const priceOf = (k: PartKey) => partOf(k).price;
export const forSale = (k: PartKey) => partOf(k).price !== null;
export const isRivalPart = (k: PartKey) => partOf(k).price === null && !MYSTERY_KEYS.includes(k);
export const isMysteryPart = (k: PartKey) => MYSTERY_KEYS.includes(k);
export const keysIn = (slot: Slot) => ALL_KEYS.filter(k => slotOf(k) === slot);
export const STARTERS: readonly PartKey[] = ALL_KEYS.filter(k => partOf(k).price === 0);
export const ALL_NAMES = PARTS.map(p => p.name as PartName);

/** What's fitted, one per slot, and his race number. */
export type Car = { readonly [S in Slot]: PartKey } & { readonly number: number };
export const starterCar = (): Car => ({ ...Object.fromEntries(SLOTS.map(s => [s, STARTERS.find(k => slotOf(k) === s)!])) as { [S in Slot]: PartKey }, number: 7 });

export interface Stats { readonly speed: number; readonly grip: number; readonly boosts: number; readonly suits: Readonly<Record<Surface, number>>; readonly kick: number }
/** The three numbers in the Garage, and what the Race does with them. */
export function statsOf(car: Car): Stats {
  const b = partOf(car.body) as BodyPart, e = partOf(car.engine) as EnginePart, t = partOf(car.tyres) as TyrePart, w = partOf(car.wing) as WingPart, x = partOf(car.booster) as BoosterPart;
  return { speed: e.speed + b.speed, grip: t.grip + w.grip + b.grip, boosts: x.boosts, suits: t.suits, kick: x.kick };
}
/** What a part adds to the numbers (the Garage shows what it would change). */
export const changesStats = (k: PartKey) => ['body', 'engine', 'tyres', 'wing', 'booster'].includes(slotOf(k));
/** The car with this part fitted. */
export const fit = (car: Car, k: PartKey): Car => ({ ...car, [slotOf(k)]: k });
export const fittedKeys = (car: Car): PartKey[] => SLOTS.map(s => car[s]);
