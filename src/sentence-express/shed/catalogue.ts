// Everything Bolts buy, in one place, so a later pass can add more by adding rows: engines, cars, paints, track (boxes of track
// squares, bigger tables and track colours), scenery and the sky. Every price is at most 100, the most the recorded numbers go.
// Stations are not bought: a Delivery opens the next one, and the first Delivery from each brings a gift piece of scenery.
//
// A row is plain data. How an engine or a car looks is a few words of style that art/train.ts draws; scenery is an emoji, or a
// drawn piece (the water tower, the tunnel, the bridge, the level crossing, the signal) that sits on or beside the track.
//
// Rows already in a save never change: their ids, names, prices and looks stay as they were when he bought them. New rows were
// added in price order (the tray's order); an engine's top speed is its own `top`, so adding engines never changes another's.
//
// Things that play (layout/fx.ts draws and runs them):
//  - every engine has a `trick`, a button when he drives (a Delivery or Watch it go): a puff of smoke, a boost, sparks, a horn...
//  - a car can `do` something too, at the same time as the engine's trick and when it brings the cargo home; `glow` cars light
//    their windows at night
//  - scenery that `works` moves on the table: crossing gates come down as the train comes, a drawbridge he taps lets a boat
//    through, a volcano he taps erupts; `glow` scenery lights up at night
//  - the Sky tab: the time of day (day, sunset, night) and the weather on his table when the train runs

export const TABS = ['engine', 'car', 'paint', 'track', 'scenery', 'sky'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = { engine: 'Engines', car: 'Cars', paint: 'Paint', track: 'Track', scenery: 'Scenery', sky: 'Sky' } as const;

/** What an engine (or a car) does when he taps the trick button, and the word the voice says for it. */
export const TRICKS = {
  puff: { icon: '💨', word: 'Puff puff!' },
  boost: { icon: '🚀', word: 'Boost!' },
  sparks: { icon: '⚡', word: 'Sparks!' },
  horn: { icon: '📢', word: 'Honk honk!' },
  snow: { icon: '❄️', word: 'Snow spray!' },
  fire: { icon: '🔥', word: 'Dragon fire!' },
  water: { icon: '💦', word: 'Splash!' },
  rainbow: { icon: '🌈', word: 'Rainbow!' },
  bubbles: { icon: '🧼', word: 'Bubbles!' },
  siren: { icon: '🚨', word: 'Wee woo!' },
  music: { icon: '🎵', word: 'Music!' },
  stars: { icon: '✨', word: 'Sparkle!' },
  ghost: { icon: '👻', word: 'Boo!' },
  cannon: { icon: '💣', word: 'Boom!' },
  roar: { icon: '🦖', word: 'Roar!' },
  disco: { icon: '🕺', word: 'Disco!' },
  confetti: { icon: '🎉', word: 'Confetti!' },
  dump: { icon: '🪨', word: 'Dump it out!' },
  balloons: { icon: '🎈', word: 'Balloons!' },
  fireworks: { icon: '🎆', word: 'Fireworks!' },
  popcorn: { icon: '🍿', word: 'Pop pop!' },
  hearts: { icon: '❤️', word: 'Hearts!' },
} as const;
export type Trick = keyof typeof TRICKS;

export type EngineKind = 'tank' | 'steam' | 'shunter' | 'diesel' | 'electric' | 'bullet' | 'tram';
/** Something extra on an engine's body: a ladder, a siren, a crown... */
export type EngineExtra = 'ladder' | 'siren' | 'cone' | 'eyes' | 'disco' | 'flag' | 'spikes' | 'crown' | 'horns' | 'horn' | 'fins' | 'bubble';
export interface EngineRow {
  readonly id: string; readonly name: string; readonly price: number; readonly kind: EngineKind; readonly big?: boolean; readonly plow?: boolean; readonly trim?: string;
  /** Its top speed in a Delivery, squares a second. */
  readonly top: number;
  readonly trick: Trick;
  readonly extra?: EngineExtra;
  /** A colour of its own for the body (otherwise his paint). */
  readonly color?: string;
  /** An emoji on its roof, seen from above. */
  readonly badge?: string;
}
export const ENGINES = [
  { id: 'tank', name: 'Little Tank Engine', price: 0, kind: 'tank', top: 2.4, trick: 'puff' },
  { id: 'bubble', name: 'Bubble Engine', price: 8, kind: 'tank', trim: '#7fd0f0', top: 2.45, trick: 'bubbles', extra: 'bubble', badge: '🧼' },
  { id: 'shunter', name: 'Yard Shunter', price: 12, kind: 'shunter', top: 2.48, trick: 'horn' },
  { id: 'tram', name: 'Tram', price: 18, kind: 'tram', top: 2.56, trick: 'sparks' },
  { id: 'fire', name: 'Fire Engine', price: 22, kind: 'diesel', trim: '#f4f6f8', color: '#e63946', top: 2.6, trick: 'water', extra: 'ladder', badge: '🚒' },
  { id: 'icecream', name: 'Ice Cream Engine', price: 26, kind: 'tram', trim: '#ff9ec7', top: 2.55, trick: 'music', extra: 'cone', badge: '🍦' },
  { id: 'steam', name: 'Big Steam Engine', price: 30, kind: 'steam', big: true, top: 2.64, trick: 'puff' },
  { id: 'police', name: 'Police Engine', price: 34, kind: 'diesel', trim: '#f4f6f8', color: '#1f3d8a', top: 2.7, trick: 'siren', extra: 'siren', badge: '🚓' },
  { id: 'mail', name: 'Mail Engine', price: 40, kind: 'steam', trim: '#ffd23f', top: 2.72, trick: 'puff' },
  { id: 'penguin', name: 'Penguin Engine', price: 44, kind: 'shunter', plow: true, trim: '#1d1d1f', top: 2.62, trick: 'snow', extra: 'eyes', badge: '🐧' },
  { id: 'hauler', name: 'Freight Hauler', price: 48, kind: 'diesel', big: true, trim: '#ff7a1a', top: 2.85, trick: 'horn' },
  { id: 'plow', name: 'Snow Plow Engine', price: 50, kind: 'diesel', plow: true, top: 2.8, trick: 'snow' },
  { id: 'turbo', name: 'Turbo Diesel', price: 53, kind: 'diesel', big: true, trim: '#2bb673', top: 3.0, trick: 'boost', extra: 'fins' },
  { id: 'monorail', name: 'Monorail', price: 56, kind: 'bullet', trim: '#7fdcff', top: 3.02, trick: 'boost' },
  { id: 'disco', name: 'Disco Engine', price: 58, kind: 'electric', trim: '#ff7ac0', top: 2.9, trick: 'disco', extra: 'disco', badge: '🕺' },
  { id: 'diesel', name: 'Diesel Engine', price: 60, kind: 'diesel', big: true, top: 2.88, trick: 'horn' },
  { id: 'robot', name: 'Robot Engine', price: 63, kind: 'shunter', trim: '#c9d1d9', color: '#8a96a3', top: 2.92, trick: 'sparks', extra: 'eyes', badge: '🤖' },
  { id: 'ghost', name: 'Ghost Train', price: 67, kind: 'tank', big: true, trim: '#c9d1d9', color: '#eef2f6', top: 3.0, trick: 'ghost', extra: 'eyes', badge: '👻' },
  { id: 'electric', name: 'Electric Engine', price: 70, kind: 'electric', top: 2.96, trick: 'sparks' },
  { id: 'pirate', name: 'Pirate Engine', price: 74, kind: 'steam', big: true, trim: '#c9a227', color: '#2a2d33', top: 3.05, trick: 'cannon', extra: 'flag', badge: '🏴‍☠️' },
  { id: 'mountain', name: 'Mountain Engine', price: 78, kind: 'steam', big: true, plow: true, top: 3.04, trick: 'puff' },
  { id: 'dino', name: 'Dino Engine', price: 80, kind: 'steam', trim: '#1a7a4a', color: '#2bb673', top: 3.1, trick: 'roar', extra: 'spikes', badge: '🦕' },
  { id: 'royal', name: 'Royal Engine', price: 84, kind: 'steam', big: true, trim: '#f2c43a', color: '#7a4fd8', top: 3.15, trick: 'confetti', extra: 'crown', badge: '👑' },
  { id: 'oldtimer', name: 'Old Timer', price: 85, kind: 'tank', big: true, trim: '#c9a227', top: 3.12, trick: 'puff' },
  { id: 'dragon', name: 'Dragon Engine', price: 88, kind: 'steam', big: true, trim: '#ffd23f', color: '#c0392b', top: 3.2, trick: 'fire', extra: 'horns', badge: '🐉' },
  { id: 'golden', name: 'Golden Engine', price: 92, kind: 'steam', big: true, trim: '#f2c43a', top: 3.2, trick: 'stars' },
  { id: 'unicorn', name: 'Unicorn Engine', price: 94, kind: 'tank', big: true, trim: '#ff9ec7', color: '#f4f6f8', top: 3.25, trick: 'rainbow', extra: 'horn', badge: '🦄' },
  { id: 'skytrain', name: 'Sky Train', price: 96, kind: 'electric', big: true, trim: '#7fdcff', top: 3.28, trick: 'boost' },
  { id: 'rocket', name: 'Rocket Engine', price: 98, kind: 'bullet', trim: '#ff7a1a', color: '#c9d1d9', top: 3.4, trick: 'boost', extra: 'fins', badge: '🚀' },
  { id: 'bullet', name: 'Bullet Train', price: 100, kind: 'bullet', top: 3.36, trick: 'boost' },
] as const satisfies readonly EngineRow[];

export type CarShape = 'open' | 'box' | 'tank' | 'flat' | 'coach' | 'caboose' | 'hopper' | 'tipper' | 'double' | 'dome';
export interface CarRow {
  readonly id: string; readonly name: string; readonly price: number; readonly shape: CarShape; readonly load?: string; readonly color?: string;
  /** What it does with the engine's trick, and when it brings the cargo home. */
  readonly does?: Trick;
  /** Its windows light up at night. */
  readonly glow?: boolean;
}
export const CARS = [
  { id: 'wagon', name: 'Open Wagon', price: 0, shape: 'open' },
  { id: 'hay', name: 'Hay Car', price: 5, shape: 'flat', load: '🌾' },
  { id: 'coal', name: 'Coal Car', price: 6, shape: 'open', load: 'coal', does: 'dump' },
  { id: 'pumpkin', name: 'Pumpkin Car', price: 7, shape: 'open', load: '🎃' },
  { id: 'logs', name: 'Log Car', price: 8, shape: 'flat', load: '🪵' },
  { id: 'blocks', name: 'Block Car', price: 9, shape: 'flat', load: 'blocks' },
  { id: 'animals', name: 'Animal Car', price: 10, shape: 'box', load: '🐄' },
  { id: 'sand', name: 'Sand Hopper', price: 11, shape: 'hopper', load: 'sand', does: 'dump' },
  { id: 'tanker', name: 'Milk Tanker', price: 12, shape: 'tank', color: '#f4f6f8' },
  { id: 'water', name: 'Water Tanker', price: 13, shape: 'tank', color: '#3d9be0', does: 'water' },
  { id: 'coach', name: 'Passenger Car', price: 15, shape: 'coach', glow: true },
  { id: 'tipper', name: 'Tipper Car', price: 16, shape: 'tipper', load: 'rocks', does: 'dump' },
  { id: 'caboose', name: 'Caboose', price: 18, shape: 'caboose', glow: true },
  { id: 'banana', name: 'Banana Car', price: 19, shape: 'open', load: '🍌' },
  { id: 'mailcar', name: 'Mail Car', price: 20, shape: 'box', load: '✉️' },
  { id: 'cookie', name: 'Cookie Car', price: 21, shape: 'box', load: '🍪', color: '#c98a4a' },
  { id: 'hopper', name: 'Rock Hopper', price: 22, shape: 'hopper', load: 'rocks', does: 'dump' },
  { id: 'popcorn', name: 'Popcorn Car', price: 24, shape: 'box', load: '🍿', color: '#ffd23f', does: 'popcorn' },
  { id: 'icecream', name: 'Ice Cream Car', price: 25, shape: 'box', load: '🍦', color: '#ff9ec7', does: 'music' },
  { id: 'honey', name: 'Honey Tanker', price: 27, shape: 'tank', color: '#f2a516' },
  { id: 'fruit', name: 'Fruit Car', price: 28, shape: 'open', load: '🍎' },
  { id: 'present', name: 'Present Car', price: 29, shape: 'flat', load: '🎁' },
  { id: 'fuel', name: 'Fuel Tanker', price: 30, shape: 'tank', color: '#2a2d33' },
  { id: 'lantern', name: 'Lantern Coach', price: 31, shape: 'coach', load: '🏮', color: '#c0392b', glow: true },
  { id: 'circus', name: 'Circus Car', price: 32, shape: 'box', load: '🎪', color: '#e63946', does: 'confetti' },
  { id: 'snowcar', name: 'Snow Car', price: 33, shape: 'open', load: 'snow', does: 'snow' },
  { id: 'dining', name: 'Dining Car', price: 35, shape: 'coach', load: '🍽️', glow: true },
  { id: 'music', name: 'Music Car', price: 36, shape: 'box', load: '🎵', color: '#2f7fd8', does: 'music' },
  { id: 'bubblecar', name: 'Bubble Car', price: 39, shape: 'tank', load: '🧼', color: '#b8e6ff', does: 'bubbles' },
  { id: 'sleeper', name: 'Sleeper Car', price: 40, shape: 'coach', load: '💤', color: '#3a4fa0', glow: true },
  { id: 'pizza', name: 'Pizza Car', price: 41, shape: 'box', load: '🍕', color: '#f4f6f8' },
  { id: 'dome', name: 'Glass Dome Car', price: 43, shape: 'dome', glow: true },
  { id: 'toys', name: 'Toy Car', price: 45, shape: 'open', load: '🧸' },
  { id: 'firecar', name: 'Fire Car', price: 46, shape: 'tank', load: '🧯', color: '#e63946', does: 'water' },
  { id: 'heart', name: 'Heart Car', price: 48, shape: 'box', load: '❤️', color: '#ff7ac0', does: 'hearts' },
  { id: 'crane', name: 'Crane Car', price: 50, shape: 'flat', load: 'crane' },
  { id: 'double', name: 'Double Decker', price: 52, shape: 'double', glow: true },
  { id: 'carrier', name: 'Car Carrier', price: 55, shape: 'flat', load: '🚗' },
  { id: 'balloon', name: 'Balloon Car', price: 57, shape: 'flat', load: '🎈', does: 'balloons' },
  { id: 'treasure', name: 'Treasure Car', price: 60, shape: 'open', load: '💎', does: 'stars' },
  { id: 'discocar', name: 'Disco Car', price: 62, shape: 'coach', load: '🕺', color: '#7a4fd8', glow: true, does: 'disco' },
  { id: 'fish', name: 'Fish Tank Car', price: 65, shape: 'tank', load: '🐠', color: '#7fd0f0', does: 'bubbles' },
  { id: 'gems', name: 'Gem Hopper', price: 67, shape: 'hopper', load: 'gems', does: 'dump' },
  { id: 'rocket', name: 'Rocket Car', price: 70, shape: 'flat', load: '🚀', does: 'fireworks' },
  { id: 'searchlight', name: 'Searchlight Car', price: 72, shape: 'flat', load: '🔦', glow: true },
  { id: 'royalcoach', name: 'Royal Coach', price: 76, shape: 'coach', load: '👑', color: '#7a4fd8', glow: true, does: 'stars' },
  { id: 'dino', name: 'Dino Car', price: 80, shape: 'flat', load: '🦕', does: 'roar' },
  { id: 'fireworks', name: 'Fireworks Car', price: 85, shape: 'flat', load: '🎆', does: 'fireworks' },
  { id: 'party', name: 'Party Car', price: 90, shape: 'coach', load: '🎈', color: '#7a4fd8', glow: true, does: 'balloons' },
  { id: 'rainbowcar', name: 'Rainbow Car', price: 95, shape: 'box', load: '🌈', color: '#f4f6f8', does: 'rainbow' },
  { id: 'dragoncar', name: 'Dragon Car', price: 99, shape: 'flat', load: '🐉', does: 'fire' },
  { id: 'goldcar', name: 'Golden Car', price: 100, shape: 'box', load: '⭐', color: '#f2c43a', does: 'stars' },
] as const satisfies readonly CarRow[];
/** The most cars his engine can pull. */
export const MAX_CARS = 6;

/** The colour of his train: the engine's body and the cars' sides. Patterns are drawn over the body. */
export type Pattern = 'stripes' | 'dots' | 'checks' | 'stars' | 'flames' | 'rainbow' | 'spots' | 'hearts' | 'zigzag';
export interface PaintRow { readonly id: string; readonly name: string; readonly price: number; readonly body: string; readonly trim: string; readonly pattern?: Pattern }
export const PAINTS = [
  { id: 'red', name: 'Toy Red', price: 0, body: '#e63946', trim: '#a01f2b' },
  { id: 'blue', name: 'Toy Blue', price: 4, body: '#2f7fd8', trim: '#1f4f98' },
  { id: 'green', name: 'Toy Green', price: 4, body: '#2bb673', trim: '#1a7a4a' },
  { id: 'yellow', name: 'Sunny Yellow', price: 4, body: '#ffd23f', trim: '#c99a00' },
  { id: 'skyblue', name: 'Sky Blue', price: 5, body: '#7fc8f8', trim: '#3a8ac0' },
  { id: 'lime', name: 'Lime Green', price: 5, body: '#a8e04a', trim: '#5f9a1a' },
  { id: 'orange', name: 'Orange', price: 6, body: '#ff7a1a', trim: '#c95400' },
  { id: 'purple', name: 'Grape Purple', price: 6, body: '#7a4fd8', trim: '#4f2fa0' },
  { id: 'black', name: 'Night Black', price: 6, body: '#2a2d33', trim: '#000000' },
  { id: 'white', name: 'Snow White', price: 6, body: '#f4f6f8', trim: '#a9b4bf' },
  { id: 'brown', name: 'Wood Brown', price: 6, body: '#9a6a3a', trim: '#5a3a1a' },
  { id: 'peach', name: 'Peach', price: 7, body: '#ffb98a', trim: '#d9784a' },
  { id: 'lavender', name: 'Lavender', price: 7, body: '#c3a8f0', trim: '#7a5ab8' },
  { id: 'navy', name: 'Navy Blue', price: 7, body: '#1f3d8a', trim: '#0f1f4a' },
  { id: 'forest', name: 'Forest Green', price: 7, body: '#1f6b3a', trim: '#0f3a1f' },
  { id: 'pink', name: 'Bubblegum Pink', price: 8, body: '#ff7ac0', trim: '#c94a8c' },
  { id: 'teal', name: 'Ocean Teal', price: 8, body: '#1fb5a8', trim: '#11786f' },
  { id: 'mint', name: 'Mint Green', price: 8, body: '#7fdcb0', trim: '#3f9a72' },
  { id: 'cherry', name: 'Cherry Red', price: 9, body: '#b5122e', trim: '#6a0a1a' },
  { id: 'hotpink', name: 'Hot Pink', price: 9, body: '#ff2e93', trim: '#a8105a' },
  { id: 'coral', name: 'Coral', price: 9, body: '#ff6f61', trim: '#c0403a' },
  { id: 'silver', name: 'Shiny Silver', price: 10, body: '#c9d1d9', trim: '#7a8794' },
  { id: 'stripes', name: 'Red Stripes', price: 10, body: '#f4f6f8', trim: '#e63946', pattern: 'stripes' },
  { id: 'bluestripes', name: 'Blue Stripes', price: 11, body: '#f4f6f8', trim: '#2f7fd8', pattern: 'stripes' },
  { id: 'zebra', name: 'Zebra Stripes', price: 12, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'tiger', name: 'Tiger Stripes', price: 12, body: '#ff8a1f', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'bronze', name: 'Bronze', price: 12, body: '#c07a3a', trim: '#7a4a1a' },
  { id: 'copper', name: 'Copper', price: 13, body: '#d9774a', trim: '#8a3f1f' },
  { id: 'bee', name: 'Bee Stripes', price: 13, body: '#ffd23f', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'cow', name: 'Cow Spots', price: 13, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'spots' },
  { id: 'dots', name: 'Polka Dots', price: 14, body: '#2f7fd8', trim: '#f4f6f8', pattern: 'dots' },
  { id: 'leopard', name: 'Leopard Spots', price: 14, body: '#e8b860', trim: '#4a2a14', pattern: 'spots' },
  { id: 'midnight', name: 'Midnight Blue', price: 15, body: '#14214f', trim: '#7fdcff' },
  { id: 'pinkdots', name: 'Pink Polka Dots', price: 15, body: '#ff9ec7', trim: '#f4f6f8', pattern: 'dots' },
  { id: 'gold', name: 'Shiny Gold', price: 16, body: '#f2c43a', trim: '#a87a00' },
  { id: 'checks', name: 'Checkers', price: 16, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'checks' },
  { id: 'ladybug', name: 'Ladybug', price: 16, body: '#e63946', trim: '#1d1d1f', pattern: 'dots' },
  { id: 'greenchecks', name: 'Green Checkers', price: 17, body: '#f4f6f8', trim: '#2bb673', pattern: 'checks' },
  { id: 'giraffe', name: 'Giraffe Spots', price: 17, body: '#ffd27a', trim: '#a0582a', pattern: 'spots' },
  { id: 'candy', name: 'Candy Stripes', price: 18, body: '#ff9ec7', trim: '#f4f6f8', pattern: 'stripes' },
  { id: 'camo', name: 'Camo', price: 18, body: '#6b8a3a', trim: '#3a4a1f', pattern: 'spots' },
  { id: 'hearts', name: 'Hearts', price: 19, body: '#ff9ec7', trim: '#e63946', pattern: 'hearts' },
  { id: 'flames', name: 'Racing Flames', price: 20, body: '#2a2d33', trim: '#ff7a1a', pattern: 'flames' },
  { id: 'stars', name: 'Starry Night', price: 20, body: '#1f2f6a', trim: '#ffd23f', pattern: 'stars' },
  { id: 'zigzag', name: 'Zigzags', price: 21, body: '#ffd23f', trim: '#2f7fd8', pattern: 'zigzag' },
  { id: 'goldstars', name: 'Gold Stars', price: 22, body: '#7a4fd8', trim: '#ffd23f', pattern: 'stars' },
  { id: 'iceflames', name: 'Ice Flames', price: 23, body: '#1f3d8a', trim: '#7fdcff', pattern: 'flames' },
  { id: 'rainbow', name: 'Rainbow Stripes', price: 24, body: '#e63946', trim: '#7a4fd8', pattern: 'rainbow' },
  { id: 'purplezigzag', name: 'Purple Zigzags', price: 25, body: '#c3a8f0', trim: '#4f2fa0', pattern: 'zigzag' },
  { id: 'galaxy', name: 'Galaxy', price: 28, body: '#2a1a5a', trim: '#ff9ec7', pattern: 'stars' },
] as const satisfies readonly PaintRow[];

/** Track: boxes of track squares he lays on his table, bigger tables, and the colour his track is. Track boxes are cheap so he can
 *  always buy something. */
export interface TrackRow {
  readonly id: string; readonly name: string; readonly price: number; readonly squares?: number; readonly table?: { w: number; h: number }; readonly color: string;
  /** A track colour: the wooden strip, its grooves, and what's special about it (stripes, a rainbow, a glow at night). */
  readonly rails?: { readonly strip: string; readonly groove: string; readonly look?: 'candy' | 'rainbow' | 'glow' };
}
export const TRACK = [
  { id: 'box1', name: 'Red Track Box', price: 2, squares: 12, color: '#e63946' },
  { id: 'box2', name: 'Blue Track Box', price: 2, squares: 12, color: '#2f7fd8' },
  { id: 'box3', name: 'Green Track Box', price: 3, squares: 12, color: '#2bb673' },
  { id: 'box4', name: 'Yellow Track Box', price: 3, squares: 12, color: '#ffd23f' },
  { id: 'box5', name: 'Orange Track Box', price: 3, squares: 12, color: '#ff7a1a' },
  { id: 'box6', name: 'Purple Track Box', price: 4, squares: 12, color: '#7a4fd8' },
  { id: 'box7', name: 'Pink Track Box', price: 4, squares: 12, color: '#ff7ac0' },
  { id: 'box8', name: 'Brown Track Box', price: 4, squares: 12, color: '#9a6a3a' },
  { id: 'box9', name: 'Silver Track Box', price: 5, squares: 12, color: '#c9d1d9' },
  { id: 'box10', name: 'Gold Track Box', price: 5, squares: 12, color: '#f2c43a' },
  { id: 'table1', name: 'Bigger Table', price: 25, table: { w: 14, h: 9 }, color: '#d9b77e' },
  { id: 'table2', name: 'Big Table', price: 50, table: { w: 16, h: 10 }, color: '#c9a46a' },
  { id: 'table3', name: 'Giant Table', price: 80, table: { w: 18, h: 11 }, color: '#b8905a' },
  { id: 'box11', name: 'Teal Track Box', price: 5, squares: 12, color: '#1fb5a8' },
  { id: 'box12', name: 'Black Track Box', price: 5, squares: 12, color: '#2a2d33' },
  { id: 'box13', name: 'White Track Box', price: 5, squares: 12, color: '#f4f6f8' },
  { id: 'box14', name: 'Mint Track Box', price: 5, squares: 12, color: '#7fdcb0' },
  { id: 'box15', name: 'Sky Track Box', price: 5, squares: 12, color: '#7fc8f8' },
  { id: 'box16', name: 'Lime Track Box', price: 5, squares: 12, color: '#a8e04a' },
  { id: 'box17', name: 'Ruby Track Box', price: 5, squares: 12, color: '#b5122e' },
  { id: 'box18', name: 'Star Track Box', price: 5, squares: 12, color: '#1f2f6a' },
  { id: 'box19', name: 'Rainbow Track Box', price: 5, squares: 12, color: '#ff9a1f' },
  { id: 'box20', name: 'Diamond Track Box', price: 5, squares: 12, color: '#b8e6ff' },
  { id: 'table4', name: 'Huge Table', price: 100, table: { w: 20, h: 12 }, color: '#a87a4a' },
  { id: 'wood', name: 'Wood Track', price: 0, color: '#c99a5e', rails: { strip: '#c99a5e', groove: '#7a5230' } },
  { id: 'redrails', name: 'Red Track', price: 6, color: '#e63946', rails: { strip: '#e8575f', groove: '#8a1a24' } },
  { id: 'bluerails', name: 'Blue Track', price: 6, color: '#2f7fd8', rails: { strip: '#5a9ae0', groove: '#1f4f98' } },
  { id: 'chocolate', name: 'Chocolate Track', price: 10, color: '#6a3f1f', rails: { strip: '#7a4a28', groove: '#3a1f0a' } },
  { id: 'icerails', name: 'Ice Track', price: 14, color: '#b8e6ff', rails: { strip: '#cdeeff', groove: '#5aa0d0' } },
  { id: 'candycane', name: 'Candy Cane Track', price: 18, color: '#ff9ec7', rails: { strip: '#f4f6f8', groove: '#e63946', look: 'candy' } },
  { id: 'silverrails', name: 'Silver Track', price: 22, color: '#c9d1d9', rails: { strip: '#c9d1d9', groove: '#5d6470' } },
  { id: 'goldrails', name: 'Gold Track', price: 30, color: '#f2c43a', rails: { strip: '#f2c43a', groove: '#a87a00' } },
  { id: 'rainbowrails', name: 'Rainbow Track', price: 40, color: '#7a4fd8', rails: { strip: '#e63946', groove: '#1d1d1f', look: 'rainbow' } },
  { id: 'glowrails', name: 'Glow Track', price: 50, color: '#7fffd4', rails: { strip: '#9ff5d8', groove: '#1fb58a', look: 'glow' } },
  { id: 'lavarails', name: 'Lava Track', price: 60, color: '#ff5a1f', rails: { strip: '#ff7a1a', groove: '#8a1a0a', look: 'glow' } },
] as const satisfies readonly TrackRow[];
/** The table he starts with, and the track squares that come with it (the starter loop and a few to spare). */
export const START_TABLE = { w: 12, h: 8 } as const;
export const START_SQUARES = 40;

/** Scenery: `on: 'track'` pieces go on a straight bit of track (a tunnel, a bridge, a level crossing); the rest on an empty square. */
export type Drawn = 'tower' | 'tunnel' | 'bridge' | 'crossing' | 'signal' | 'windmill' | 'gates' | 'drawbridge' | 'wash' | 'arch' | 'blinker' | 'spinmill' | 'turbine' | 'wheel';
/** How a working piece moves: by itself (gates, the signal, the wash and the arch when the train comes; the windmill, turbine and wheel
 *  all the time) and when he taps it while the train runs (all of them). */
export type Works = 'gates' | 'drawbridge' | 'wash' | 'arch' | 'blinker' | 'spinmill' | 'turbine' | 'wheel' | 'fountain' | 'volcano' | 'launch' | 'balloon' | 'fireworks' | 'musicbox';
export type SceneryGroup = 'nature' | 'town' | 'fun' | 'track' | 'works';
export interface SceneryRow {
  readonly id: string; readonly name: string; readonly price: number; readonly icon?: string; readonly drawn?: Drawn; readonly on?: 'track';
  readonly group: SceneryGroup; readonly glow?: boolean; readonly works?: Works;
}
export const SCENERY = [
  { id: 'trees', name: 'Trees', price: 3, icon: '🌳', group: 'nature' },
  { id: 'flowers', name: 'Flowers', price: 3, icon: '🌷', group: 'nature' },
  { id: 'bushes', name: 'Bushes', price: 3, icon: '🌿', group: 'nature' },
  { id: 'clover', name: 'Clover', price: 3, icon: '🍀', group: 'nature' },
  { id: 'pines', name: 'Pine Trees', price: 4, icon: '🌲', group: 'nature' },
  { id: 'rocks', name: 'Rocks', price: 4, icon: '🪨', group: 'nature' },
  { id: 'hay', name: 'Hay Bales', price: 4, icon: '🌾', group: 'nature' },
  { id: 'snails', name: 'Snails', price: 4, icon: '🐌', group: 'nature' },
  { id: 'mushrooms', name: 'Mushrooms', price: 4, icon: '🍄', group: 'nature' },
  { id: 'roadworks', name: 'Road Works', price: 4, icon: '🚧', group: 'town' },
  { id: 'sunflowers', name: 'Sunflowers', price: 5, icon: '🌻', group: 'nature' },
  { id: 'busstop', name: 'Bus Stop', price: 5, icon: '🚏', group: 'town' },
  { id: 'bench', name: 'Bench', price: 5, icon: '🪑', group: 'town' },
  { id: 'roses', name: 'Roses', price: 5, icon: '🌹', group: 'nature' },
  { id: 'signal', name: 'Signal', price: 6, drawn: 'signal', group: 'town' },
  { id: 'mailbox', name: 'Mailbox', price: 6, icon: '📮', group: 'town' },
  { id: 'cactus', name: 'Cactus', price: 6, icon: '🌵', group: 'nature' },
  { id: 'butterflies', name: 'Butterflies', price: 6, icon: '🦋', group: 'nature' },
  { id: 'maple', name: 'Maple Tree', price: 6, icon: '🍁', group: 'nature' },
  { id: 'trafficlight', name: 'Traffic Light', price: 6, icon: '🚦', group: 'town', glow: true },
  { id: 'bicycle', name: 'Bicycle', price: 6, icon: '🚲', group: 'town' },
  { id: 'lamp', name: 'Lamp Post', price: 7, icon: '🏮', group: 'town', glow: true },
  { id: 'blossom', name: 'Blossom Tree', price: 7, icon: '🌸', group: 'nature' },
  { id: 'bamboo', name: 'Bamboo', price: 7, icon: '🎋', group: 'nature' },
  { id: 'ducks', name: 'Ducks', price: 8, icon: '🦆', group: 'nature' },
  { id: 'picnic', name: 'Picnic Basket', price: 9, icon: '🧺', group: 'fun' },
  { id: 'snowman', name: 'Snowman', price: 8, icon: '⛄', group: 'nature' },
  { id: 'pumpkins', name: 'Pumpkins', price: 8, icon: '🎃', group: 'nature' },
  { id: 'taxi', name: 'Taxi', price: 8, icon: '🚕', group: 'town' },
  { id: 'kite', name: 'Kite', price: 8, icon: '🪁', group: 'fun' },
  { id: 'palm', name: 'Palm Tree', price: 9, icon: '🌴', group: 'nature' },
  { id: 'pigs', name: 'Pigs', price: 9, icon: '🐖', group: 'nature' },
  { id: 'chickens', name: 'Chickens', price: 9, icon: '🐔', group: 'nature' },
  { id: 'melons', name: 'Melon Stand', price: 9, icon: '🍉', group: 'town' },
  { id: 'sheep', name: 'Sheep', price: 10, icon: '🐑', group: 'nature' },
  { id: 'cows', name: 'Cows', price: 10, icon: '🐄', group: 'nature' },
  { id: 'house', name: 'Little House', price: 10, icon: '🏠', group: 'town', glow: true },
  { id: 'frogs', name: 'Frog Pond', price: 10, icon: '🐸', group: 'nature' },
  { id: 'schoolbus', name: 'School Bus', price: 10, icon: '🚌', group: 'town' },
  { id: 'goats', name: 'Goats', price: 11, icon: '🐐', group: 'nature' },
  { id: 'bunnies', name: 'Bunnies', price: 11, icon: '🐇', group: 'nature' },
  { id: 'tower', name: 'Water Tower', price: 12, drawn: 'tower', group: 'town' },
  { id: 'tent', name: 'Camp Tent', price: 12, icon: '⛺', group: 'fun' },
  { id: 'owl', name: 'Owl', price: 12, icon: '🦉', group: 'nature' },
  { id: 'policecar', name: 'Police Car', price: 12, icon: '🚓', group: 'town' },
  { id: 'deer', name: 'Deer', price: 13, icon: '🦌', group: 'nature' },
  { id: 'horse', name: 'Horse', price: 14, icon: '🐎', group: 'nature' },
  { id: 'turtle', name: 'Turtle', price: 14, icon: '🐢', group: 'nature' },
  { id: 'truck', name: 'Delivery Truck', price: 14, icon: '🚚', group: 'town' },
  { id: 'donuts', name: 'Donut Shop', price: 14, icon: '🍩', group: 'town', glow: true },
  { id: 'crossing', name: 'Level Crossing', price: 15, drawn: 'crossing', on: 'track', group: 'track' },
  { id: 'icecream', name: 'Ice Cream Stand', price: 15, icon: '🍦', group: 'town' },
  { id: 'magichat', name: 'Magic Hat', price: 15, icon: '🎩', group: 'fun' },
  { id: 'bears', name: 'Bears', price: 16, icon: '🐻', group: 'nature' },
  { id: 'ambulance', name: 'Ambulance', price: 16, icon: '🚑', group: 'town' },
  { id: 'candyshop', name: 'Candy Shop', price: 16, icon: '🍬', group: 'town', glow: true },
  { id: 'blinker', name: 'Blinking Signal', price: 16, drawn: 'blinker', group: 'works', works: 'blinker', glow: true },
  { id: 'bridge', name: 'Bridge', price: 18, drawn: 'bridge', on: 'track', group: 'track' },
  { id: 'fountain', name: 'Fountain', price: 18, icon: '⛲', group: 'town' },
  { id: 'penguins', name: 'Penguins', price: 18, icon: '🐧', group: 'nature' },
  { id: 'pizzashop', name: 'Pizza Shop', price: 18, icon: '🍕', group: 'town', glow: true },
  { id: 'motorbike', name: 'Motorbike', price: 18, icon: '🏍️', group: 'town' },
  { id: 'tunnel', name: 'Tunnel', price: 20, drawn: 'tunnel', on: 'track', group: 'track' },
  { id: 'school', name: 'School', price: 20, icon: '🏫', group: 'town', glow: true },
  { id: 'gas', name: 'Gas Station', price: 20, icon: '⛽', group: 'town', glow: true },
  { id: 'monkey', name: 'Monkey', price: 20, icon: '🐒', group: 'nature' },
  { id: 'bowling', name: 'Bowling', price: 20, icon: '🎳', group: 'fun' },
  { id: 'buildingsite', name: 'Building Site', price: 20, icon: '🏗️', group: 'town' },
  { id: 'playground', name: 'Playground', price: 22, icon: '🛝', group: 'fun' },
  { id: 'flamingo', name: 'Flamingo', price: 22, icon: '🦩', group: 'nature' },
  { id: 'cornershop', name: 'Corner Shop', price: 22, icon: '🏪', group: 'town', glow: true },
  { id: 'gates', name: 'Crossing Gates', price: 24, drawn: 'gates', on: 'track', group: 'works', works: 'gates', glow: true },
  { id: 'elephant', name: 'Elephant', price: 24, icon: '🐘', group: 'nature' },
  { id: 'windmill', name: 'Windmill', price: 25, drawn: 'windmill', group: 'fun' },
  { id: 'bakery', name: 'Bakery', price: 25, icon: '🥐', group: 'town', glow: true },
  { id: 'bigstar', name: 'Big Star', price: 25, icon: '⭐', group: 'fun', glow: true },
  { id: 'lion', name: 'Lion', price: 26, icon: '🦁', group: 'nature' },
  { id: 'bigstore', name: 'Big Store', price: 26, icon: '🏬', group: 'town', glow: true },
  { id: 'sailboat', name: 'Sailboat', price: 28, icon: '⛵', group: 'fun' },
  { id: 'camel', name: 'Camel', price: 28, icon: '🐫', group: 'nature' },
  { id: 'splash', name: 'Splash Fountain', price: 28, icon: '⛲', group: 'works', works: 'fountain' },
  { id: 'firestation', name: 'Fire Station', price: 30, icon: '🚒', group: 'town', glow: true },
  { id: 'factory', name: 'Factory', price: 30, icon: '🏭', group: 'town', glow: true },
  { id: 'rainbow', name: 'Rainbow', price: 30, icon: '🌈', group: 'nature' },
  { id: 'polarbear', name: 'Polar Bear', price: 30, icon: '🐻‍❄️', group: 'nature' },
  { id: 'racecar', name: 'Racing Car', price: 30, icon: '🏎️', group: 'town' },
  { id: 'postoffice', name: 'Post Office', price: 32, icon: '🏤', group: 'town', glow: true },
  { id: 'spinmill', name: 'Spinning Windmill', price: 34, drawn: 'spinmill', group: 'works', works: 'spinmill' },
  { id: 'mountain', name: 'Mountain', price: 35, icon: '⛰️', group: 'nature' },
  { id: 'bank', name: 'Bank', price: 35, icon: '🏦', group: 'town', glow: true },
  { id: 'trophy', name: 'Trophy', price: 35, icon: '🏆', group: 'fun' },
  { id: 'hospital', name: 'Hospital', price: 38, icon: '🏥', group: 'town', glow: true },
  { id: 'turbine', name: 'Wind Turbine', price: 38, drawn: 'turbine', group: 'works', works: 'turbine', glow: true },
  { id: 'bigtent', name: 'Circus Tent', price: 40, icon: '🎪', group: 'fun' },
  { id: 'robot', name: 'Robot', price: 40, icon: '🤖', group: 'fun' },
  { id: 'wash', name: 'Car Wash', price: 44, drawn: 'wash', on: 'track', group: 'works', works: 'wash' },
  { id: 'balloon', name: 'Hot Air Balloon', price: 45, icon: '🎈', group: 'fun' },
  { id: 'hotel', name: 'Hotel', price: 45, icon: '🏨', group: 'town', glow: true },
  { id: 'mermaid', name: 'Mermaid', price: 45, icon: '🧜', group: 'fun' },
  { id: 'musicbox', name: 'Music Box', price: 48, icon: '🎶', group: 'works', works: 'musicbox' },
  { id: 'helicopter', name: 'Helicopter', price: 50, icon: '🚁', group: 'fun' },
  { id: 'arch', name: 'Rainbow Arch', price: 54, drawn: 'arch', on: 'track', group: 'works', works: 'arch' },
  { id: 'carousel', name: 'Carousel', price: 55, icon: '🎠', group: 'fun', glow: true },
  { id: 'alien', name: 'Space Alien', price: 55, icon: '👽', group: 'fun' },
  { id: 'castle', name: 'Castle', price: 60, icon: '🏰', group: 'fun', glow: true },
  { id: 'drawbridge', name: 'Drawbridge', price: 64, drawn: 'drawbridge', on: 'track', group: 'works', works: 'drawbridge' },
  { id: 'dino', name: 'Dinosaur', price: 65, icon: '🦕', group: 'nature' },
  { id: 'dragon', name: 'Dragon', price: 66, icon: '🐉', group: 'fun' },
  { id: 'ferris', name: 'Ferris Wheel', price: 70, icon: '🎡', group: 'fun', glow: true },
  { id: 'balloonride', name: 'Balloon Ride', price: 72, icon: '🎈', group: 'works', works: 'balloon' },
  { id: 'stadium', name: 'Stadium', price: 75, icon: '🏟️', group: 'fun', glow: true },
  { id: 'unicorn', name: 'Unicorn', price: 75, icon: '🦄', group: 'fun' },
  { id: 'volcano', name: 'Volcano', price: 80, icon: '🌋', group: 'nature' },
  { id: 'wheel', name: 'Big Wheel', price: 82, drawn: 'wheel', group: 'works', works: 'wheel', glow: true },
  { id: 'whale', name: 'Whale Pond', price: 85, icon: '🐳', group: 'nature' },
  { id: 'airplane', name: 'Airplane', price: 85, icon: '✈️', group: 'fun' },
  { id: 'fireworks', name: 'Fireworks Stand', price: 88, icon: '🎆', group: 'works', works: 'fireworks' },
  { id: 'rocketpad', name: 'Rocket', price: 90, icon: '🚀', group: 'fun' },
  { id: 'smoky', name: 'Smoky Volcano', price: 92, icon: '🌋', group: 'works', works: 'volcano' },
  { id: 'coaster', name: 'Roller Coaster', price: 95, icon: '🎢', group: 'fun', glow: true },
  { id: 'launchpad', name: 'Launch Pad', price: 98, icon: '🚀', group: 'works', works: 'launch' },
  { id: 'spaceship', name: 'Flying Saucer', price: 100, icon: '🛸', group: 'fun', glow: true },
] as const satisfies readonly SceneryRow[];

/** The sky over his table when the train runs: one time of day (Sunny Day is free) and one kind of weather, or none. */
export interface SkyRow { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly kind: 'time' | 'weather' }
export const SKY = [
  { id: 'day', name: 'Sunny Day', price: 0, icon: '☀️', kind: 'time' },
  { id: 'clouds', name: 'Fluffy Clouds', price: 6, icon: '☁️', kind: 'weather' },
  { id: 'rain', name: 'Rain', price: 12, icon: '🌧️', kind: 'weather' },
  { id: 'leaves', name: 'Falling Leaves', price: 16, icon: '🍂', kind: 'weather' },
  { id: 'petals', name: 'Blossom Petals', price: 20, icon: '🌸', kind: 'weather' },
  { id: 'snow', name: 'Snow', price: 24, icon: '❄️', kind: 'weather' },
  { id: 'bubbles', name: 'Bubbles', price: 28, icon: '🧼', kind: 'weather' },
  { id: 'sunset', name: 'Sunset', price: 30, icon: '🌅', kind: 'time' },
  { id: 'fireflies', name: 'Fireflies', price: 36, icon: '✨', kind: 'weather' },
  { id: 'storm', name: 'Storm', price: 42, icon: '⛈️', kind: 'weather' },
  { id: 'night', name: 'Night Sky', price: 45, icon: '🌙', kind: 'time' },
  { id: 'balloons', name: 'Floating Balloons', price: 50, icon: '🎈', kind: 'weather' },
  { id: 'shooting', name: 'Shooting Stars', price: 58, icon: '🌠', kind: 'weather' },
  { id: 'rainbowsky', name: 'Rainbow Sky', price: 64, icon: '🌈', kind: 'weather' },
  { id: 'fireworks', name: 'Fireworks Night', price: 70, icon: '🎆', kind: 'weather' },
  { id: 'aurora', name: 'Northern Lights', price: 85, icon: '🌌', kind: 'weather' },
] as const satisfies readonly SkyRow[];
export type SkyId = (typeof SKY)[number]['id'];

/** The groups a tab's tray is split into, so a long tray stays easy to look through. A tab with one group shows them all. */
export const GROUPS = {
  car: { goods: { icon: '📦', name: 'Freight Cars' }, people: { icon: '🚃', name: 'Passenger Cars' }, tricks: { icon: '✨', name: 'Trick Cars' } },
  paint: { colors: { icon: '🎨', name: 'Colors' }, patterns: { icon: '🦓', name: 'Patterns' } },
  track: { boxes: { icon: '📦', name: 'Track Boxes' }, tables: { icon: '🟫', name: 'Tables' }, rails: { icon: '🌈', name: 'Track Colors' } },
  scenery: { nature: { icon: '🌳', name: 'Nature' }, town: { icon: '🏠', name: 'Town' }, fun: { icon: '🎡', name: 'Fun' }, track: { icon: '🛤️', name: 'On the Track' }, works: { icon: '⚙️', name: 'Working Toys' } },
} as const;
export type GroupName = { [T in keyof typeof GROUPS]: (typeof GROUPS)[T][keyof (typeof GROUPS)[T]] extends { name: infer N } ? N : never }[keyof typeof GROUPS];

// ---------- the line: stations, their cargo and their gifts ----------

/** Toy Town is home: every Delivery brings its cargo there. The other sixteen open one at a time, the Farm first. */
export const STATIONS = [
  { id: 'town', name: 'Toy Town', icon: '🏘️', cargo: null, gift: null },
  { id: 'farm', name: 'the Farm', icon: '🐄', cargo: { name: 'the milk', icon: '🥛' }, gift: { id: 'barn', name: 'Red Barn', icon: '🛖' } },
  { id: 'quarry', name: 'the Quarry', icon: '⛏️', cargo: { name: 'the rocks', icon: '🪨' }, gift: { id: 'digger', name: 'Digger', icon: '🚜' } },
  { id: 'port', name: 'the Port', icon: '⚓', cargo: { name: 'the fish', icon: '🐟' }, gift: { id: 'lighthouse', name: 'Lighthouse', icon: '🗼' } },
  { id: 'city', name: 'the City', icon: '🏙️', cargo: { name: 'the mail', icon: '✉️' }, gift: { id: 'skyscraper', name: 'Tall Building', icon: '🏢' } },
  { id: 'mill', name: 'the Mill', icon: '🪚', cargo: { name: 'the logs', icon: '🪵' }, gift: { id: 'cabin', name: 'Log Cabin', icon: '🏡' } },
  { id: 'mine', name: 'the Mine', icon: '💎', cargo: { name: 'the coal', icon: '⚫' }, gift: { id: 'gems', name: 'Gem Pile', icon: '💎' } },
  { id: 'zoo', name: 'the Zoo', icon: '🦁', cargo: { name: 'the bananas', icon: '🍌' }, gift: { id: 'giraffe', name: 'Giraffe', icon: '🦒' } },
  { id: 'toys', name: 'the Toy Shop', icon: '🧸', cargo: { name: 'the toys', icon: '🧸' }, gift: { id: 'teddy', name: 'Giant Teddy', icon: '🧸' } },
  { id: 'bakery', name: 'the Bakery', icon: '🥖', cargo: { name: 'the bread', icon: '🍞' }, gift: { id: 'cake', name: 'Giant Cake', icon: '🎂' } },
  { id: 'beach', name: 'the Beach', icon: '🏖️', cargo: { name: 'the beach balls', icon: '🏐' }, gift: { id: 'umbrella', name: 'Beach Umbrella', icon: '⛱️' } },
  { id: 'airport', name: 'the Airport', icon: '🛫', cargo: { name: 'the suitcases', icon: '🧳' }, gift: { id: 'jet', name: 'Jumbo Jet', icon: '🛩️' } },
  { id: 'candy', name: 'the Candy Factory', icon: '🍭', cargo: { name: 'the candy', icon: '🍬' }, gift: { id: 'lollipop', name: 'Giant Lollipop', icon: '🍭' } },
  { id: 'northpole', name: 'the North Pole', icon: '❄️', cargo: { name: 'the presents', icon: '🎁' }, gift: { id: 'reindeer', name: 'Reindeer', icon: '🦌' } },
  { id: 'dinopark', name: 'the Dino Park', icon: '🦖', cargo: { name: 'the dino eggs', icon: '🥚' }, gift: { id: 'trex', name: 'T. Rex', icon: '🦖' } },
  { id: 'cove', name: 'the Pirate Cove', icon: '🏴‍☠️', cargo: { name: 'the treasure', icon: '💰' }, gift: { id: 'pirateflag', name: 'Pirate Flag', icon: '🏴‍☠️' } },
  { id: 'space', name: 'the Space Center', icon: '🛰️', cargo: { name: 'the moon rocks', icon: '🌑' }, gift: { id: 'satellite', name: 'Satellite', icon: '🛰️' } },
] as const;
export type StationId = (typeof STATIONS)[number]['id'];
export type Station = (typeof STATIONS)[number];
export const station = (id: StationId) => STATIONS.find(s => s.id === id)!;
export const LINE = STATIONS.slice(1) as readonly Station[];
export const GIFTS = LINE.map(s => s.gift!);
/** Gifts that light up at night. */
export const GLOWING_GIFTS: ReadonlySet<string> = new Set(['lighthouse', 'skyscraper', 'cabin', 'lollipop']);

/** Every name a thing he can own is said by. */
export type ItemName = (typeof ENGINES)[number]['name'] | (typeof CARS)[number]['name'] | (typeof PAINTS)[number]['name'] | (typeof TRACK)[number]['name']
  | (typeof SCENERY)[number]['name'] | (typeof SKY)[number]['name'] | NonNullable<(typeof STATIONS)[number]['gift']>['name'];
