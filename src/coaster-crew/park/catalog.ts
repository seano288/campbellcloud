// Everything in the park he can buy with Tokens: track pieces (coaster/pieces.ts), track styles, train parts (bodies, fronts, paints,
// stripes, riders), park rides, stands and scenery, station themes, and visitors' hats and balloons. Prices up to 100 can be any number;
// above 100 they are whole tens up to 400, because the voice has a clip for each of those (phrases.ts, PRICE_TENS).
//
// A dear thing always changes what he can do or how the Ride plays: taller lifts and steeper drops (more speed, a bigger Thrill), loops,
// boosters, bodies that carry more riders, park things that change the Ride (night rides, the speed sign, the star trail, fireworks). A
// paint is never the dearest thing.
import { PIECES, type Piece } from '../coaster/pieces';

interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string }

// ---------- track styles: how the rails and supports look ----------
export interface StyleItem extends Base { readonly cat: 'style'; readonly rail: string; readonly support: string; readonly tie: string; readonly wood?: boolean }
const style = <const N extends string>(id: string, name: N, price: number, icon: string, rail: string, support: string, tie: string, wood = false) =>
  ({ cat: 'style', id: `st:${id}`, name, price, icon, rail, support, tie, ...(wood && { wood }) }) as StyleItem & { readonly name: N };
export const STYLES = [
  style('steel', 'Steel Track', 0, '🔩', '#e63946', '#f2f2f2', '#9aa3ad'),
  style('wood', 'Wooden Track', 18, '🪵', '#6b4a2b', '#b98a55', '#8a6238', true),
  style('mine', 'Mine Train Track', 26, '⛏️', '#4a3b2a', '#7a5a3a', '#3a2c1e', true),
  style('space', 'Space Track', 34, '🪐', '#7b4bd1', '#1b1e3a', '#5fd3f3'),
  style('candy', 'Candy Track', 22, '🍭', '#ff7aa8', '#ffffff', '#ff9ad5'),
  style('jungle', 'Jungle Track', 30, '🌿', '#2f8f3a', '#7a5a3a', '#9be22d', true),
  style('ice', 'Ice Track', 28, '❄️', '#5fd3f3', '#e6f7ff', '#bfe6ff'),
  style('rainbow', 'Rainbow Track', 48, '🌈', 'rainbow', '#ffffff', '#ffd23f'),
  style('gold', 'Golden Track', 70, '🏆', '#e0b13a', '#fff2b8', '#b58a1a'),
] as const;

// ---------- the train: bodies, fronts, paints, stripes, riders ----------
export interface BodyItem extends Base { readonly cat: 'body'; readonly seats: 2 | 4 | 6; readonly shape: BodyShape; readonly prize?: boolean }
export type BodyShape = 'classic' | 'wood' | 'mine' | 'rocket' | 'dragon' | 'log' | 'bobsled' | 'racer' | 'shark' | 'bat' | 'bus' | 'tub' | 'jet' | 'cloud' | 'duck' | 'train' | 'gold' | 'ghost' | 'dino' | 'ufo';
const body = <const N extends string>(id: string, name: N, price: number, icon: string, seats: 2 | 4 | 6, shape: BodyShape) =>
  ({ cat: 'body', id: `bd:${id}`, name, price, icon, seats, shape }) as BodyItem & { readonly name: N };
/** More seats carry more riders round each Ride, so the rider counter climbs faster. */
export const BODIES = [
  body('classic', 'Classic Car', 0, '🎢', 4, 'classic'),
  body('wood', 'Wooden Car', 8, '🪵', 4, 'wood'),
  body('mine', 'Mine Cart', 14, '⛏️', 4, 'mine'),
  body('bobsled', 'Bobsled', 18, '🛷', 2, 'bobsled'),
  body('log', 'Log Boat', 22, '🛶', 4, 'log'),
  body('racer', 'Racing Car', 30, '🏎️', 2, 'racer'),
  body('bat', 'Bat Car', 28, '🦇', 4, 'bat'),
  body('shark', 'Shark Car', 36, '🦈', 4, 'shark'),
  body('rocket', 'Rocket Car', 44, '🚀', 4, 'rocket'),
  body('duck', 'Duck Car', 24, '🦆', 4, 'duck'),
  body('tub', 'Bathtub Car', 32, '🛁', 4, 'tub'),
  body('cloud', 'Cloud Car', 40, '☁️', 4, 'cloud'),
  body('dragon', 'Dragon Car', 60, '🐉', 6, 'dragon'),
  body('bus', 'Bus Car', 80, '🚌', 6, 'bus'),
  body('train', 'Steam Train Car', 90, '🚂', 6, 'train'),
  body('jet', 'Jet Car', 110, '✈️', 6, 'jet'),
  body('ufo', 'Flying Saucer Car', 130, '🛸', 6, 'ufo'),
  body('dino', 'Dinosaur Car', 70, '🦖', 6, 'dino'),
  body('ghost', 'Ghost Car', 50, '👻', 4, 'ghost'),
  body('gold', 'Golden Car', 160, '🏆', 6, 'gold'),
] as const;
/** Cars never sold: they come with every fifth Guest Coaster, after the prize pieces have taken their turn (guest.ts). */
export const PRIZE_BODIES = [
  { id: 'bd:p-comet', name: 'Comet Car', icon: '☄️', seats: 6, shape: 'rocket' },
  { id: 'bd:p-phoenix', name: 'Phoenix Car', icon: '🔥', seats: 6, shape: 'dragon' },
  { id: 'bd:p-unicorn', name: 'Unicorn Car', icon: '🦄', seats: 6, shape: 'cloud' },
  { id: 'bd:p-pirate', name: 'Pirate Ship Car', icon: '🏴‍☠️', seats: 6, shape: 'log' },
  { id: 'bd:p-robot', name: 'Robot Car', icon: '🤖', seats: 6, shape: 'bus' },
  { id: 'bd:p-whale', name: 'Whale Car', icon: '🐋', seats: 6, shape: 'shark' },
  { id: 'bd:p-tiger', name: 'Tiger Car', icon: '🐯', seats: 6, shape: 'racer' },
  { id: 'bd:p-moon', name: 'Moon Buggy Car', icon: '🌕', seats: 6, shape: 'ufo' },
  { id: 'bd:p-candy', name: 'Candy Car', icon: '🍬', seats: 6, shape: 'tub' },
  { id: 'bd:p-star', name: 'Star Car', icon: '🌟', seats: 6, shape: 'gold' },
].map(b => ({ ...b, cat: 'body', price: 0, prize: true })) as readonly (BodyItem & { readonly name: PrizeBodyName })[];
export type PrizeBodyName = 'Comet Car' | 'Phoenix Car' | 'Unicorn Car' | 'Pirate Ship Car' | 'Robot Car' | 'Whale Car' | 'Tiger Car' | 'Moon Buggy Car' | 'Candy Car' | 'Star Car';

export interface FrontItem extends Base { readonly cat: 'front' }
const front = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'front', id: `fr:${id}`, name, price, icon }) as FrontItem & { readonly name: N };
export const FRONTS = [
  front('plain', 'Plain Front', 0, '⬜'), front('lights', 'Headlights', 6, '💡'), front('dragon', 'Dragon Head', 20, '🐲'), front('rocket', 'Rocket Nose', 14, '🚀'),
  front('shark', 'Shark Fin', 12, '🦈'), front('bat', 'Bat Wings', 16, '🦇'), front('lion', 'Lion Face', 18, '🦁'), front('robot', 'Robot Face', 15, '🤖'),
  front('unicorn', 'Unicorn Horn', 22, '🦄'), front('steam', 'Steam Funnel', 17, '🚂'), front('bull', 'Bull Horns', 13, '🐂'), front('dino', 'Dino Head', 24, '🦖'),
] as const;

export interface PaintItem extends Base { readonly cat: 'paint'; readonly hex: string }
const paint = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'paint', id: `pt:${id}`, name, price, icon: '🎨', hex }) as PaintItem & { readonly name: N };
export const PAINTS = [
  paint('red', 'Coaster Red', 0, '#e63946'), paint('blue', 'Sky Blue', 3, '#3d93dc'), paint('yellow', 'Bulb Yellow', 3, '#ffd23f'), paint('green', 'Go Green', 4, '#2fa84f'),
  paint('orange', 'Orange', 4, '#ff7a00'), paint('purple', 'Purple', 5, '#7b4bd1'), paint('pink', 'Candy Pink', 5, '#ff7aa8'), paint('teal', 'Teal', 6, '#14a3a3'),
  paint('black', 'Night Black', 6, '#1b1e24'), paint('white', 'Snow White', 6, '#f6f8fb'), paint('lime', 'Lime', 7, '#9be22d'), paint('navy', 'Navy', 7, '#1f3a68'),
  paint('silver', 'Silver', 8, '#c9d1da'), paint('cherry', 'Cherry', 8, '#b5172b'), paint('mint', 'Mint', 9, '#8ee6c4'), paint('lemon', 'Lemon', 9, '#fff35c'),
  paint('coral', 'Coral', 10, '#ff8c5a'), paint('lavender', 'Lavender', 10, '#b9a3f0'), paint('forest', 'Forest', 11, '#1f6b3a'), paint('sand', 'Sand', 11, '#e2c38a'),
  paint('sea', 'Sea Green', 12, '#2fd6b8'), paint('plum', 'Plum', 12, '#6b2a6b'), paint('lava', 'Lava', 13, '#ff4d1a'), paint('ice', 'Ice Blue', 13, '#bfe6ff'),
  paint('gold', 'Gold', 15, '#e0b13a'), paint('copper', 'Copper', 15, '#c46a2f'), paint('chrome', 'Chrome', 18, '#e8edf2'), paint('midnight', 'Midnight', 18, '#101a3a'),
  paint('bubble', 'Bubblegum', 20, '#ff9ad5'), paint('rainbow', 'Rainbow', 26, 'rainbow'),
] as const;

export interface StripeItem extends Base { readonly cat: 'stripe'; readonly pattern: string }
const stripe = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'stripe', id: `sp:${id}`, name, price, icon, pattern: id }) as StripeItem & { readonly name: N };
export const STRIPES = [
  stripe('none', 'No Stripe', 0, '⬜'), stripe('one', 'One Stripe', 3, '➖'), stripe('two', 'Two Stripes', 5, '🟰'), stripe('checks', 'Checks', 8, '🏁'),
  stripe('stars', 'Stars', 9, '⭐'), stripe('flames', 'Flames', 12, '🔥'), stripe('zigzag', 'Zigzag', 7, '⚡'), stripe('dots', 'Dots', 6, '🔴'),
  stripe('waves', 'Waves', 8, '🌊'), stripe('hearts', 'Hearts', 10, '❤️'),
] as const;

export interface RidersItem extends Base { readonly cat: 'riders'; readonly faces: readonly string[] }
const riders = <const N extends string>(id: string, name: N, price: number, faces: readonly string[]) => ({ cat: 'riders', id: `rd:${id}`, name, price, icon: faces[0]!, faces }) as RidersItem & { readonly name: N };
export const RIDERS = [
  riders('kids', 'Kids', 0, ['🧒', '👧', '👦', '🧒🏽', '👧🏾', '👦🏻']), riders('grownups', 'Grown-ups', 6, ['🧑', '👩', '👨', '🧑🏾', '👩🏽', '👨🏿']),
  riders('clowns', 'Clowns', 12, ['🤡']), riders('robots', 'Robots', 14, ['🤖']), riders('pirates', 'Pirates', 16, ['🏴‍☠️', '🦜']),
  riders('astronauts', 'Astronauts', 18, ['🧑‍🚀']), riders('dinos', 'Dinosaurs', 20, ['🦕', '🦖']), riders('monsters', 'Monsters', 15, ['👾', '👹']),
  riders('animals', 'Animals', 17, ['🐶', '🐱', '🐰', '🐻', '🐼']), riders('aliens', 'Aliens', 19, ['👽']),
] as const;

// ---------- the park: rides, stands, scenery ----------
/** What a park thing changes about the Ride or the park, if anything. */
export type Does = 'night' | 'speedo' | 'stars' | 'fireworks' | 'photo' | 'music' | 'queue' | 'board' | 'look';
export interface ParkItem extends Base { readonly cat: 'ride' | 'stand'; readonly does: Does; readonly big: boolean }
const ride = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'ride', id: `rk:${id}`, name, price, icon, does: 'look', big: true }) as ParkItem & { readonly name: N };
const stand = <const N extends string>(id: string, name: N, price: number, icon: string, does: Does = 'look') => ({ cat: 'stand', id: `sd:${id}`, name, price, icon, does, big: false }) as ParkItem & { readonly name: N };
export const RIDES = [
  ride('carousel', 'Carousel', 30, '🎠'), ride('ferris', 'Ferris Wheel', 70, '🎡'), ride('bumper', 'Bumper Cars', 45, '🚗'), ride('flume', 'Log Flume', 90, '🛶'),
  ride('tower', 'Drop Tower', 100, '🗼'), ride('swings', 'Swings', 35, '🪢'), ride('teacups', 'Teacups', 28, '☕'), ride('pirate', 'Pirate Ship', 60, '🏴‍☠️'),
  ride('haunted', 'Haunted House', 55, '👻'), ride('mirrors', 'Hall of Mirrors', 32, '🪞'), ride('train', 'Park Train', 65, '🚂'), ride('karts', 'Go-Karts', 75, '🏎️'),
  ride('helter', 'Helter Skelter', 40, '🌀'), ride('slide', 'Giant Slide', 26, '🛝'), ride('pony', 'Pony Ride', 24, '🐴'), ride('rocket', 'Rocket Ride', 50, '🚀'),
  ride('octopus', 'Octopus', 58, '🐙'), ride('waves', 'Wave Swinger', 62, '🌊'), ride('ghost', 'Ghost Train', 48, '🚃'), ride('water', 'Water Slide', 68, '💦'),
  ride('bouncy', 'Bouncy Castle', 22, '🏰'), ride('golf', 'Mini Golf', 27, '⛳'), ride('balloon', 'Balloon Ride', 80, '🎈'), ride('spaceshot', 'Space Shot', 110, '🛰️'),
  ride('pendulum', 'Pendulum', 85, '🔔'), ride('rapids', 'River Rapids', 95, '🛟'), ride('carpet', 'Magic Carpet', 52, '🧞'), ride('skyride', 'Sky Ride', 78, '🚡'),
  ride('monorail', 'Monorail', 120, '🚝'), ride('maze', 'Hedge Maze', 34, '🌳'),
] as const;
export const STANDS = [
  stand('icecream', 'Ice Cream Stand', 8, '🍦'), stand('popcorn', 'Popcorn Stand', 7, '🍿'), stand('candyfloss', 'Candy Floss Stand', 9, '🍭'), stand('hotdog', 'Hot Dog Stand', 10, '🌭'),
  stand('pizza', 'Pizza Stand', 11, '🍕'), stand('drinks', 'Drinks Stand', 6, '🥤'), stand('balloons', 'Balloon Seller', 9, '🎈'), stand('gifts', 'Gift Shop', 14, '🎁'),
  stand('darts', 'Dart Game', 12, '🎯'), stand('rings', 'Ring Toss', 10, '⭕'), stand('ducks', 'Duck Pond', 11, '🦆'), stand('donuts', 'Donut Stand', 9, '🍩'),
  stand('bench', 'Bench', 3, '🪑'), stand('lamp', 'Lamp Post', 4, '🏮'), stand('tree', 'Tree', 3, '🌳'), stand('palm', 'Palm Tree', 5, '🌴'),
  stand('pine', 'Pine Tree', 4, '🌲'), stand('flowers', 'Flower Bed', 4, '🌷'), stand('sunflowers', 'Sunflowers', 5, '🌻'), stand('cactus', 'Cactus', 5, '🌵'),
  stand('fountain', 'Fountain', 16, '⛲'), stand('pond', 'Pond', 12, '🪷'), stand('statue', 'Statue', 18, '🗿'), stand('flags', 'Flags', 6, '🚩'),
  stand('clock', 'Clock Tower', 22, '🕰️'), stand('bridge', 'Bridge', 20, '🌉'), stand('rock', 'Big Rock', 4, '🪨'), stand('mushroom', 'Mushroom House', 19, '🍄'),
  stand('info', 'Information Booth', 8, 'ℹ️'), stand('aid', 'First Aid Hut', 9, '⛑️'),
  // these change the Ride or the park
  stand('lights', 'Night Lights', 45, '💡', 'night'), stand('speedo', 'Speed Sign', 35, '⏱️', 'speedo'), stand('startrail', 'Star Trail', 55, '✨', 'stars'),
  stand('fireworks', 'Fireworks Tower', 65, '🎆', 'fireworks'), stand('photobooth', 'Photo Booth', 30, '📸', 'photo'), stand('band', 'Band Stand', 25, '🎶', 'music'),
  stand('queue', 'Waiting Line', 15, '🚧', 'queue'), stand('board', 'Rider Board', 20, '📋', 'board'), stand('arch', 'Big Arch', 26, '⛩️'), stand('bins', 'Bins', 3, '🗑️'),
] as const;

export interface ThemeItem extends Base { readonly cat: 'theme'; readonly roof: string; readonly wall: string }
const theme = <const N extends string>(id: string, name: N, price: number, icon: string, roof: string, wall: string) => ({ cat: 'theme', id: `th:${id}`, name, price, icon, roof, wall }) as ThemeItem & { readonly name: N };
export const THEMES = [
  theme('plain', 'Plain Station', 0, '🏠', '#e63946', '#f6f8fb'), theme('circus', 'Circus Tent', 12, '🎪', '#e63946', '#ffd23f'), theme('castle', 'Castle', 22, '🏰', '#7b4bd1', '#c9d1da'),
  theme('pirate', 'Pirate Cove', 18, '🏴‍☠️', '#1b1e24', '#a0703f'), theme('space', 'Space Port', 26, '🛸', '#5fd3f3', '#1b1e3a'), theme('jungle', 'Jungle Hut', 16, '🌴', '#2f8f3a', '#c49a5a'),
  theme('ice', 'Ice Palace', 24, '🧊', '#bfe6ff', '#e6f7ff'), theme('candy', 'Candy House', 20, '🍬', '#ff7aa8', '#fff3f8'), theme('west', 'Wild West', 17, '🤠', '#a0703f', '#e2c38a'),
  theme('haunted', 'Haunted Mansion', 25, '🏚️', '#3a2a4a', '#6b5a7a'), theme('dino', 'Dino Cave', 21, '🦕', '#6b5a3a', '#a89060'), theme('robot', 'Robot Factory', 23, '🏭', '#9aa3ad', '#4a5563'),
  theme('sea', 'Under the Sea', 27, '🐠', '#14a3a3', '#8ee6c4'), theme('volcano', 'Volcano', 30, '🌋', '#ff4d1a', '#5a2a1a'), theme('fire', 'Fire Station', 15, '🚒', '#e63946', '#c9d1da'),
  theme('rail', 'Train Station', 14, '🚉', '#1f3a68', '#e2c38a'), theme('tree', 'Treehouse', 19, '🌳', '#2fa84f', '#8a6238'), theme('pyramid', 'Pyramid', 28, '🔺', '#e0b13a', '#f1d58c'),
  theme('rainbow', 'Rainbow Arch', 32, '🌈', '#ff7aa8', '#ffffff'), theme('gold', 'Gold Palace', 60, '👑', '#e0b13a', '#fff2b8'),
] as const;

export interface WearItem extends Base { readonly cat: 'hat' | 'balloon' }
const hat = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'hat', id: `ht:${id}`, name, price, icon }) as WearItem & { readonly name: N };
const balloon = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'balloon', id: `bl:${id}`, name, price, icon }) as WearItem & { readonly name: N };
export const HATS = [
  hat('cap', 'Caps', 4, '🧢'), hat('party', 'Party Hats', 5, '🥳'), hat('cowboy', 'Cowboy Hats', 7, '🤠'), hat('crown', 'Crowns', 12, '👑'), hat('pirate', 'Pirate Hats', 8, '🏴‍☠️'),
  hat('wizard', 'Wizard Hats', 10, '🧙'), hat('ears', 'Bunny Ears', 6, '🐰'), hat('top', 'Top Hats', 9, '🎩'), hat('helmet', 'Hard Hats', 6, '⛑️'), hat('flower', 'Flower Crowns', 8, '🌸'),
] as const;
export const BALLOONS = [
  balloon('red', 'Red Balloons', 3, '🎈'), balloon('star', 'Star Balloons', 5, '⭐'), balloon('heart', 'Heart Balloons', 5, '❤️'), balloon('dino', 'Dino Balloons', 8, '🦕'),
  balloon('rocket', 'Rocket Balloons', 8, '🚀'), balloon('fish', 'Fish Balloons', 7, '🐟'), balloon('rainbow', 'Rainbow Balloons', 9, '🌈'), balloon('moon', 'Moon Balloons', 7, '🌙'),
  balloon('unicorn', 'Unicorn Balloons', 10, '🦄'), balloon('gold', 'Gold Balloons', 12, '🏆'),
] as const;

// ---------- all of it ----------

export type PieceItem = Piece & { readonly cat: 'piece' };
export type Item = PieceItem | StyleItem | BodyItem | FrontItem | PaintItem | StripeItem | RidersItem | ParkItem | ThemeItem | WearItem;
const pieceItems: PieceItem[] = PIECES.map(x => ({ ...x, cat: 'piece' }));
export const ITEMS: readonly Item[] = [...pieceItems, ...STYLES, ...BODIES, ...FRONTS, ...PAINTS, ...STRIPES, ...RIDERS, ...RIDES, ...STANDS, ...THEMES, ...HATS, ...BALLOONS];
/** Never sold, won on Guest Coasters: the prize pieces and cars. */
export const PRIZE_ITEMS: readonly Item[] = [...PRIZE_BODIES];
const byId = new Map([...ITEMS, ...PRIZE_ITEMS].map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const itemOf = (id: string): Item => { const i = byId.get(id); if (!i) throw new Error(`no item ${id}`); return i; };
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export const PARK_THINGS: readonly ParkItem[] = [...RIDES, ...STANDS];
export const isParkThing = (id: string) => id.startsWith('rk:') || id.startsWith('sd:');

export type ItemName = (typeof PIECES)[number]['name'] | (typeof STYLES)[number]['name'] | (typeof BODIES)[number]['name'] | (typeof FRONTS)[number]['name']
  | (typeof PAINTS)[number]['name'] | (typeof STRIPES)[number]['name'] | (typeof RIDERS)[number]['name'] | (typeof RIDES)[number]['name']
  | (typeof STANDS)[number]['name'] | (typeof THEMES)[number]['name'] | (typeof HATS)[number]['name'] | (typeof BALLOONS)[number]['name'] | PrizeBodyName;
export const ITEM_NAMES = [...ITEMS, ...PRIZE_ITEMS].map(i => i.name) as ItemName[];

// ---------- things to buy again and again ----------

/** Each one bought shows or does something. Track slots stop at what a Ride can carry (MAX_SLOTS), cars at what a train draws
 *  (MAX_CARS); plots of land and new coasters never stop. */
export const START_SLOTS = 6, MAX_SLOTS = 30, START_CARS = 2, MAX_CARS = 6, START_PLOTS = 2, SPOTS_PER_PLOT = 6;
export const REPEATS = [
  { id: 'track', name: 'More Track', icon: '➕', base: 10, step: 2, flat: 40, most: MAX_SLOTS - START_SLOTS },
  { id: 'car', name: 'Another Car', icon: '🚃', base: 25, step: 10, flat: 60, most: MAX_CARS - START_CARS },
  { id: 'plot', name: 'More Land', icon: '🟩', base: 20, step: 4, flat: 60, most: Infinity },
  { id: 'coaster', name: 'Another Coaster', icon: '🎢', base: 60, step: 10, flat: 120, most: Infinity },
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
