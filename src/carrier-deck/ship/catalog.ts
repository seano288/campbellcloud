// Everything there is to buy for the Carrier. Ship parts (hull sections and fittings) go in fixed places on the ship (art/ship.ts), so it
// always draws right whatever order he buys in. Aircraft make his Air Wing; each wears a paint and a tail art he buys once and uses on any
// aircraft (30 × 24 = 720 looks, and a number from 1 to 99), and the ship wears a hull colour, a flag and a deck marking. Fleet ships
// sail beside him; deck crew and vehicles busy the deck in "Watch the deck".
//
// Parts matter, and the Mission reads them (ship.ts): hull sections make the deck longer, and a longer deck takes bigger aircraft; each
// catapult launches one more aircraft at once; each landing wire makes the landing zone longer; the hangar deck and its bays set how many
// aircraft he can own; deck lights open night Missions; the mirror lights start the landing lights further out; the angled deck catches
// a little before a wire; the weather station halves the gusts; the ski jump gives every launch a boost; the radar shows what is ahead.
//
// Prices up to 100 can be any number; above 100 they are whole tens up to 400, because the voice has a clip for each of those
// (phrases.ts, PRICE_TENS). A dear thing always changes what he can do; a paint is never the dearest thing. Nothing is a weapon.

export const CATEGORIES = ['part', 'aircraft', 'paint', 'tail', 'hull', 'flag', 'mark', 'fleet', 'crew'] as const;
export type Category = (typeof CATEGORIES)[number];

/** What a part changes in the Mission or the ship. */
export type Does = 'hull' | 'island' | 'catapult' | 'wire' | 'lift' | 'hangar' | 'bay' | 'night' | 'mirror' | 'angled' | 'radar' | 'weather' | 'skijump' | 'boat' | 'room' | 'deck' | 'mast';
interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly needs?: string }
export interface PartItem extends Base { readonly cat: 'part'; readonly does: Does }
export interface AircraftItem extends Base { readonly cat: 'aircraft'; readonly model: Model }
export interface PaintItem extends Base { readonly cat: 'paint' | 'hull'; readonly hex: string }
export interface TailItem extends Base { readonly cat: 'tail'; readonly glyph: string; readonly bg: string }
export interface FlagItem extends Base { readonly cat: 'flag'; readonly colors: readonly string[]; readonly pattern: 'h' | 'v' | 'cross' | 'diag' | 'dot' | 'plain' }
export interface MarkItem extends Base { readonly cat: 'mark'; readonly hex: string; readonly shape: 'stripe' | 'dash' | 'circle' | 'star' | 'number' | 'arrow' | 'check' | 'wave' }
export interface FleetItem extends Base { readonly cat: 'fleet'; readonly ship: ShipLook }
export interface CrewItem extends Base { readonly cat: 'crew'; readonly hex: string; readonly vehicle: boolean }
export type Item = PartItem | AircraftItem | PaintItem | TailItem | FlagItem | MarkItem | FleetItem | CrewItem;

// ---------- ship parts ----------

const part = <const N extends string>(id: string, name: N, price: number, icon: string, does: Does, needs?: string) =>
  ({ cat: 'part', id: `part:${id}`, name, price, icon, does, ...(needs && { needs: `part:${needs}` }) }) as PartItem & { readonly name: N };

/** He starts with a short hull: three sections, one catapult and two landing wires. Each section bought makes it longer. */
export const START_SECTIONS = 3, HULL_SECTIONS = 8;
export const PARTS = [
  // the hull, a section at a time (Hull Section 1 needs nothing; each after needs the one before)
  ...Array.from({ length: HULL_SECTIONS }, (_, i) => part(`hull${i + 1}`, `Ship Section ${i + 1}` as `Ship Section ${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, [8, 16, 26, 38, 52, 68, 85, 100][i]!, '🚢', 'hull', i ? `hull${i}` : undefined)),
  // the island, where the ship is steered from, and what stands on it
  part('island', 'Island', 14, '🏢', 'island'),
  part('bridge', 'Bridge', 24, '🪟', 'island', 'island'),
  part('radar', 'Radar', 45, '📡', 'radar', 'island'),
  part('bigradar', 'Big Radar', 150, '🛰️', 'radar', 'radar'),
  part('mast', 'Radio Mast', 18, '🚩', 'mast', 'island'),
  part('flagline', 'Flag Line', 9, '🎏', 'mast', 'mast'),
  part('lookout', 'Lookout', 30, '🔭', 'island', 'bridge'),
  part('dish', 'Satellite Dish', 55, '📡', 'radar', 'radar'),
  part('weather', 'Weather Station', 70, '🌦️', 'weather', 'island'),
  part('tower', 'Flight Control', 60, '🎛️', 'island', 'bridge'),
  part('bell', "Ship's Bell", 6, '🔔', 'island', 'island'),
  part('horn', 'Foghorn', 12, '📯', 'island', 'island'),
  // the flight deck
  part('cat2', 'Catapult 2', 90, '🎯', 'catapult'),
  part('cat3', 'Catapult 3', 130, '🎯', 'catapult', 'cat2'),
  part('cat4', 'Catapult 4', 160, '🎯', 'catapult', 'cat3'),
  part('wire3', 'Landing Wire 3', 40, '〰️', 'wire'),
  part('wire4', 'Landing Wire 4', 75, '〰️', 'wire', 'wire3'),
  part('angled', 'Angled Deck', 220, '📐', 'angled', 'hull4'),
  part('lights', 'Deck Lights', 65, '💡', 'night'),
  part('mirror', 'Mirror Lights', 80, '🔆', 'mirror', 'lights'),
  part('skijump', 'Ski Jump', 140, '⛷️', 'skijump', 'hull2'),
  part('fence', 'Jet Blast Fence', 22, '🧱', 'deck'),
  part('spots', 'Helicopter Spots', 15, '🅷', 'deck'),
  part('bowlights', 'Bow Lights', 20, '🔦', 'deck', 'lights'),
  part('searchlight', 'Searchlight', 28, '🔦', 'island', 'island'),
  // lifts and the hangar below
  part('lift1', 'Deck Lift 1', 20, '🛗', 'lift'),
  part('lift2', 'Deck Lift 2', 48, '🛗', 'lift', 'lift1'),
  part('lift3', 'Deck Lift 3', 95, '🛗', 'lift', 'lift2'),
  part('hangar', 'Hangar Deck', 50, '🏭', 'hangar', 'lift1'),
  part('bay1', 'Hangar Bay 1', 30, '🅿️', 'bay', 'hangar'),
  part('bay2', 'Hangar Bay 2', 42, '🅿️', 'bay', 'bay1'),
  part('bay3', 'Hangar Bay 3', 58, '🅿️', 'bay', 'bay2'),
  part('bay4', 'Hangar Bay 4', 78, '🅿️', 'bay', 'bay3'),
  part('workshop', 'Workshop', 35, '🔧', 'room', 'hangar'),
  part('fuel', 'Fuel Station', 32, '⛽', 'deck'),
  // the decks inside, for the cutaway
  part('galley', 'Kitchen', 16, '🍳', 'room'),
  part('mess', 'Mess Hall', 26, '🍽️', 'room', 'galley'),
  part('bunks', 'Bunk Rooms', 20, '🛏️', 'room'),
  part('sickbay', 'Sick Bay', 34, '🩺', 'room'),
  part('gym', 'Gym', 30, '🏋️', 'room'),
  part('library', 'Library', 18, '📚', 'room'),
  part('cinema', 'Movie Room', 40, '🎬', 'room', 'bunks'),
  part('bandroom', 'Band Room', 24, '🥁', 'room'),
  part('laundry', 'Laundry', 10, '🧺', 'room'),
  part('bakery', 'Bakery', 22, '🥐', 'room', 'galley'),
  // over the side
  part('bowanchor', 'Front Anchor', 11, '⚓', 'boat'),
  part('sternanchor', 'Back Anchor', 13, '⚓', 'boat'),
  part('rescueboat', 'Rescue Boat', 36, '🛟', 'boat'),
  part('lifeboats', 'Lifeboats', 27, '🚤', 'boat'),
  part('crane', 'Crane', 44, '🏗️', 'boat'),
  part('boatbay', 'Boat Bay', 62, '🚪', 'boat', 'rescueboat'),
  part('sonar', 'Sonar Dome', 85, '🔊', 'radar', 'hull3'),
  part('hoses', 'Fire Hoses', 19, '🚒', 'deck'),
] as const;

// ---------- the Air Wing ----------

export const MODELS = ['trainer', 'rescue', 'cargo', 'radar', 'twin', 'seaplane', 'storm', 'water', 'display', 'jump', 'tilt', 'drone'] as const;
export type Model = (typeof MODELS)[number];
export type Job = 'drop' | 'winch' | 'rings' | 'follow' | 'search' | 'storm';
export const JOBS: readonly Job[] = ['drop', 'winch', 'rings', 'follow', 'search', 'storm'];
export interface AircraftSpec {
  readonly name: string;
  readonly look: 'jet' | 'prop' | 'heli' | 'twin' | 'tilt' | 'drone' | 'float';
  /** Hull sections the deck needs before it can fly from it (beyond the three he starts with). */
  readonly deck: number;
  /** Speed, 1 the trainer's. */
  readonly speed: number;
  /** It can hover, so it can lower a winch. */
  readonly hover: boolean;
  /** The jobs it suits (a Mission names one). */
  readonly suits: readonly Job[];
  /** Body length in drawing units, and its default colours. */
  readonly len: number;
}
export const AIRCRAFT: Record<Model, AircraftSpec> = {
  trainer: { name: 'Trainer Jet', look: 'jet', deck: 0, speed: 1, hover: false, suits: ['rings'], len: 60 },
  rescue: { name: 'Rescue Helicopter', look: 'heli', deck: 0, speed: .8, hover: true, suits: ['winch', 'search'], len: 62 },
  cargo: { name: 'Cargo Plane', look: 'prop', deck: 4, speed: .85, hover: false, suits: ['drop'], len: 84 },
  radar: { name: 'Radar Plane', look: 'prop', deck: 5, speed: .9, hover: false, suits: ['search', 'follow'], len: 78 },
  twin: { name: 'Twin-Rotor Helicopter', look: 'twin', deck: 2, speed: .8, hover: true, suits: ['winch', 'drop'], len: 82 },
  seaplane: { name: 'Seaplane', look: 'float', deck: 1, speed: .85, hover: false, suits: ['search', 'follow'], len: 66 },
  storm: { name: 'Storm-Watch Plane', look: 'prop', deck: 3, speed: .95, hover: false, suits: ['storm'], len: 74 },
  water: { name: 'Water Bomber', look: 'float', deck: 4, speed: .85, hover: false, suits: ['drop'], len: 80 },
  display: { name: 'Display Jet', look: 'jet', deck: 2, speed: 1.15, hover: false, suits: ['rings'], len: 64 },
  jump: { name: 'Jump Jet', look: 'jet', deck: 0, speed: 1.1, hover: true, suits: ['winch', 'rings'], len: 62 },
  tilt: { name: 'Tiltrotor', look: 'tilt', deck: 3, speed: 1, hover: true, suits: ['winch', 'drop'], len: 72 },
  drone: { name: 'Weather Drone', look: 'drone', deck: 0, speed: .9, hover: false, suits: ['storm', 'follow'], len: 44 },
};
const AIRCRAFT_PRICES: Record<Model, number> = {
  trainer: 0, rescue: 45, drone: 70, seaplane: 110, twin: 150, cargo: 200, storm: 190, radar: 260, water: 240, display: 290, tilt: 330, jump: 380,
};
const AIRCRAFT_ICONS: Record<Model, string> = {
  trainer: '🛩️', rescue: '🚁', cargo: '📦', radar: '📡', twin: '🚁', seaplane: '🛥️', storm: '⛈️', water: '💧', display: '🎆', jump: '🦘', tilt: '🔄', drone: '🛸',
};
export const PLANES = MODELS.map(m => ({ cat: 'aircraft', id: `air:${m}`, name: AIRCRAFT[m].name, price: AIRCRAFT_PRICES[m], icon: AIRCRAFT_ICONS[m], model: m }) as AircraftItem);

// ---------- looks ----------

const paint = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'paint', id: `paint:${id}`, name, price, icon: '🎨', hex }) as PaintItem & { readonly name: N };
export const PAINTS = [
  paint('white', 'Snow White', 0, '#f4f6fa'),
  paint('grey', 'Sea Grey', 3, '#8e9aa6'), paint('navy', 'Navy Blue', 4, '#1f3a68'), paint('yellow', 'Deck Yellow', 4, '#ffd23f'),
  paint('red', 'Rescue Red', 5, '#e63946'), paint('orange', 'Safety Orange', 5, '#ff7a00'), paint('green', 'Deck Green', 6, '#2fa84f'),
  paint('purple', 'Fuel Purple', 6, '#7b4bd1'), paint('blue', 'Sky Blue', 7, '#3d93dc'), paint('black', 'Night Black', 7, '#1b1e24'),
  paint('teal', 'Ocean Teal', 8, '#14a3a3'), paint('pink', 'Coral Pink', 8, '#ff7aa8'), paint('lime', 'Lime', 9, '#9be22d'),
  paint('sand', 'Sand', 9, '#e2c38a'), paint('mint', 'Mint', 10, '#8ee6c4'), paint('cherry', 'Cherry', 10, '#b5172b'),
  paint('gold', 'Gold', 12, '#e0b13a'), paint('silver', 'Silver', 12, '#c9d1da'), paint('sunset', 'Sunset', 14, '#ff8c5a'),
  paint('ice', 'Ice Blue', 14, '#bfe6ff'), paint('lava', 'Lava', 16, '#ff4d1a'), paint('forest', 'Forest', 16, '#1f6b3a'),
  paint('grape', 'Grape Purple', 18, '#5b2a86'), paint('lemon', 'Lemon', 18, '#fff35c'), paint('storm', 'Storm Grey', 20, '#4a5563'),
  paint('bubble', 'Bubblegum', 22, '#ff9ad5'), paint('midnight', 'Midnight', 24, '#101a3a'), paint('copper', 'Copper', 26, '#c46a2f'),
  paint('aqua', 'Aqua', 28, '#2fd6e8'), paint('rainbow', 'Rainbow', 40, 'rainbow'),
] as const;

const tail = <const N extends string>(id: string, name: N, price: number, glyph: string, bg: string) => ({ cat: 'tail', id: `tail:${id}`, name, price, icon: glyph, glyph, bg }) as TailItem & { readonly name: N };
export const TAILS = [
  tail('none', 'Plain Tail', 0, '', '#f4f6fa'),
  tail('anchor', 'Anchor Tail', 4, '⚓', '#1f3a68'), tail('star', 'Star Tail', 4, '⭐', '#1f3a68'), tail('wave', 'Wave Tail', 5, '🌊', '#3d93dc'),
  tail('gull', 'Gull Tail', 5, '🕊️', '#3d93dc'), tail('sun', 'Sun Tail', 6, '☀️', '#ff7a00'), tail('moon', 'Moon Tail', 6, '🌙', '#101a3a'),
  tail('whale', 'Whale Tail', 8, '🐋', '#14a3a3'), tail('dolphin', 'Dolphin Tail', 8, '🐬', '#3d93dc'), tail('octopus', 'Octopus Tail', 9, '🐙', '#7b4bd1'),
  tail('turtle', 'Turtle Tail', 9, '🐢', '#2fa84f'), tail('shark', 'Shark Tail', 10, '🦈', '#4a5563'), tail('crab', 'Crab Tail', 10, '🦀', '#e63946'),
  tail('penguin', 'Penguin Tail', 12, '🐧', '#bfe6ff'), tail('eagle', 'Eagle Tail', 12, '🦅', '#c46a2f'), tail('owl', 'Owl Tail', 14, '🦉', '#5b2a86'),
  tail('lightning', 'Lightning Tail', 14, '⚡', '#1b1e24'), tail('rainbow', 'Rainbow Tail', 16, '🌈', '#3d93dc'), tail('rocket', 'Rocket Tail', 16, '🚀', '#101a3a'),
  tail('dragon', 'Dragon Tail', 18, '🐉', '#1f6b3a'), tail('comet', 'Comet Tail', 18, '☄️', '#101a3a'), tail('crown', 'Crown Tail', 20, '👑', '#b5172b'),
  tail('lion', 'Lion Tail', 20, '🦁', '#e0b13a'), tail('unicorn', 'Unicorn Tail', 24, '🦄', '#ff9ad5'),
] as const;

const hullPaint = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'hull', id: `hull:${id}`, name, price, icon: '🚢', hex }) as PaintItem & { readonly name: N };
export const HULL_PAINTS = [
  hullPaint('grey', 'Ship Grey', 0, '#7d8894'),
  hullPaint('dark', 'Dark Grey Ship', 8, '#4a525c'), hullPaint('navy', 'Navy Ship', 10, '#1f3a68'), hullPaint('white', 'White Ship', 12, '#eef1f5'),
  hullPaint('black', 'Black Ship', 12, '#1b1e24'), hullPaint('red', 'Red Ship', 14, '#b5172b'), hullPaint('blue', 'Blue Ship', 14, '#2f6fc0'),
  hullPaint('green', 'Green Ship', 16, '#1f6b3a'), hullPaint('sand', 'Sand Ship', 16, '#c9a96e'), hullPaint('teal', 'Teal Ship', 18, '#14838a'),
  hullPaint('orange', 'Orange Ship', 20, '#e06a14'), hullPaint('purple', 'Purple Ship', 22, '#5b2a86'), hullPaint('dazzle', 'Dazzle Ship', 30, 'dazzle'),
] as const;

const flag = <const N extends string>(id: string, name: N, price: number, colors: readonly string[], pattern: FlagItem['pattern']) => ({ cat: 'flag', id: `flag:${id}`, name, price, icon: '🏳️', colors, pattern }) as FlagItem & { readonly name: N };
export const FLAGS = [
  flag('none', 'Plain Flag', 0, ['#f4f6fa'], 'plain'),
  flag('blue', 'Blue Flag', 3, ['#2f6fc0'], 'plain'), flag('red', 'Red Flag', 3, ['#e63946'], 'plain'), flag('yellow', 'Yellow Flag', 4, ['#ffd23f'], 'plain'),
  flag('stripes', 'Striped Flag', 5, ['#e63946', '#f4f6fa'], 'h'), flag('halves', 'Half and Half', 5, ['#2f6fc0', '#ffd23f'], 'v'),
  flag('cross', 'Cross Flag', 6, ['#2f6fc0', '#f4f6fa'], 'cross'), flag('diag', 'Corner Flag', 6, ['#ffd23f', '#e63946'], 'diag'),
  flag('dot', 'Sun Flag', 7, ['#f4f6fa', '#e63946'], 'dot'), flag('green', 'Green Cross', 7, ['#2fa84f', '#f4f6fa'], 'cross'),
  flag('purple', 'Purple Stripes', 8, ['#7b4bd1', '#ffd23f'], 'h'), flag('teal', 'Teal Corner', 8, ['#14a3a3', '#f4f6fa'], 'diag'),
  flag('orange', 'Orange Dot', 9, ['#ff7a00', '#1b1e24'], 'dot'), flag('night', 'Night Flag', 10, ['#101a3a', '#ffd23f'], 'dot'),
  flag('candy', 'Candy Stripes', 10, ['#ff7aa8', '#f4f6fa'], 'h'), flag('forest', 'Forest Flag', 11, ['#1f6b3a', '#e2c38a'], 'v'),
  flag('signal', 'Signal Flag', 12, ['#ffd23f', '#2f6fc0'], 'cross'), flag('fire', 'Fire Flag', 12, ['#ff4d1a', '#ffd23f'], 'diag'),
  flag('ice', 'Ice Flag', 14, ['#bfe6ff', '#2f6fc0'], 'v'), flag('rainbow', 'Rainbow Flag', 16, ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1'], 'h'),
] as const;

const mark = <const N extends string>(id: string, name: N, price: number, hex: string, shape: MarkItem['shape']) => ({ cat: 'mark', id: `mark:${id}`, name, price, icon: '✳️', hex, shape }) as MarkItem & { readonly name: N };
export const MARKS = [
  mark('none', 'Plain Deck', 0, '#f4f6fa', 'stripe'),
  mark('white', 'White Lines', 5, '#f4f6fa', 'stripe'), mark('yellow', 'Yellow Lines', 5, '#ffd23f', 'stripe'), mark('dashes', 'Dashed Lines', 6, '#f4f6fa', 'dash'),
  mark('number', 'Big Number', 7, '#f4f6fa', 'number'), mark('circle', 'Landing Circle', 8, '#ffd23f', 'circle'), mark('arrows', 'Deck Arrows', 8, '#ffd23f', 'arrow'),
  mark('star', 'Deck Star', 10, '#f4f6fa', 'star'), mark('red', 'Red Lines', 10, '#e63946', 'stripe'), mark('green', 'Green Dashes', 11, '#2fa84f', 'dash'),
  mark('check', 'Checkered Deck', 12, '#f4f6fa', 'check'), mark('blue', 'Blue Circle', 12, '#2f8fe8', 'circle'), mark('wave', 'Wave Lines', 14, '#14a3a3', 'wave'),
  mark('orange', 'Orange Arrows', 14, '#ff7a00', 'arrow'), mark('gold', 'Gold Star', 16, '#e0b13a', 'star'), mark('purple', 'Purple Waves', 16, '#7b4bd1', 'wave'),
  mark('pink', 'Pink Checks', 18, '#ff7aa8', 'check'), mark('glow', 'Glow Lines', 20, '#8ee6c4', 'stripe'),
] as const;

// ---------- the Fleet ----------

/** How a Fleet ship is drawn: hull shape, deckhouse, mast, funnel and colour (the Yard makes new ones from these parts, fleet.ts). */
export interface ShipLook { readonly hull: number; readonly house: number; readonly mast: number; readonly funnel: number; readonly hex: string; readonly stripe: string }
const fleet = <const N extends string>(id: string, name: N, price: number, icon: string, ship: ShipLook) => ({ cat: 'fleet', id: `fleet:${id}`, name, price, icon, ship, needs: 'part:hull1' }) as FleetItem & { readonly name: N };
export const FLEET = [
  fleet('tug', 'Tug', 40, '⛴️', { hull: 1, house: 1, mast: 0, funnel: 1, hex: '#e63946', stripe: '#1b1e24' }),
  fleet('rescue', 'Rescue Cutter', 60, '🛟', { hull: 4, house: 2, mast: 1, funnel: 0, hex: '#f4f6fa', stripe: '#ff7a00' }),
  fleet('supply', 'Supply Ship', 80, '📦', { hull: 0, house: 0, mast: 2, funnel: 2, hex: '#4a525c', stripe: '#ffd23f' }),
  fleet('tender', 'Lighthouse Tender', 100, '🗼', { hull: 2, house: 3, mast: 3, funnel: 0, hex: '#1f3a68', stripe: '#f4f6fa' }),
  fleet('research', 'Research Ship', 120, '🔬', { hull: 0, house: 4, mast: 4, funnel: 1, hex: '#f4f6fa', stripe: '#2f8fe8' }),
  fleet('tanker', 'Fuel Tanker', 130, '🛢️', { hull: 3, house: 0, mast: 1, funnel: 2, hex: '#7b4bd1', stripe: '#f4f6fa' }),
  fleet('hospital', 'Hospital Ship', 150, '🏥', { hull: 0, house: 5, mast: 2, funnel: 1, hex: '#f4f6fa', stripe: '#e63946' }),
  fleet('icebreaker', 'Icebreaker', 160, '🧊', { hull: 5, house: 1, mast: 3, funnel: 2, hex: '#ff7a00', stripe: '#1b1e24' }),
] as const;

// ---------- deck crew and vehicles ----------

const crew = <const N extends string>(id: string, name: N, price: number, icon: string, hex: string, vehicle = false) => ({ cat: 'crew', id: `crew:${id}`, name, price, icon, hex, vehicle }) as CrewItem & { readonly name: N };
/** The deck crew wear bright jerseys by their job: yellow sends the aircraft, green runs the catapults and wires, purple fuels, blue
 *  drives the tractors, red is the fire and rescue crew, white checks it is safe, brown looks after one aircraft each. */
export const CREW = [
  crew('yellow', 'Yellow Shirts', 8, '🟨', '#ffd23f'), crew('green', 'Green Shirts', 10, '🟩', '#2fa84f'), crew('blue', 'Blue Shirts', 12, '🟦', '#2f8fe8'),
  crew('purple', 'Purple Shirts', 14, '🟪', '#7b4bd1'), crew('red', 'Red Shirts', 16, '🟥', '#e63946'), crew('white', 'White Shirts', 18, '⬜', '#f4f6fa'),
  crew('brown', 'Brown Shirts', 20, '🟫', '#8a5a2b'),
  crew('tractor', 'Tow Tractor', 25, '🚜', '#ffd23f', true), crew('firetruck', 'Deck Fire Truck', 35, '🚒', '#e63946', true),
  crew('decrane', 'Deck Crane', 45, '🏗️', '#ffd23f', true), crew('fuelcart', 'Fuel Cart', 30, '⛽', '#7b4bd1', true),
  crew('forklift', 'Forklift', 28, '🚛', '#ff7a00', true), crew('sweeper', 'Deck Sweeper', 22, '🧹', '#2f8fe8', true),
  crew('stairs', 'Pilot Steps', 12, '🪜', '#c9d1da', true), crew('cart', 'Tool Cart', 15, '🛒', '#2fa84f', true),
] as const;

// ---------- all of it ----------

export const ITEMS: readonly Item[] = [...PARTS, ...PLANES, ...PAINTS, ...TAILS, ...HULL_PAINTS, ...FLAGS, ...MARKS, ...FLEET, ...CREW];
const byId = new Map(ITEMS.map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const itemOf = (id: string): Item => { const i = byId.get(id); if (!i) throw new Error(`no item ${id}`); return i; };
/** What he starts with: the trainer jet, white paint, a plain tail, a grey ship, a plain flag and a plain deck. */
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export type ItemName = (typeof PARTS)[number]['name'] | (typeof PAINTS)[number]['name'] | (typeof TAILS)[number]['name'] | (typeof HULL_PAINTS)[number]['name']
  | (typeof FLAGS)[number]['name'] | (typeof MARKS)[number]['name'] | (typeof FLEET)[number]['name'] | (typeof CREW)[number]['name'];
export const ITEM_NAMES = [...PARTS, ...PAINTS, ...TAILS, ...HULL_PAINTS, ...FLAGS, ...MARKS, ...FLEET, ...CREW].map(i => i.name) as ItemName[];
export const AIRCRAFT_NAMES = ['Trainer Jet', 'Rescue Helicopter', 'Cargo Plane', 'Radar Plane', 'Twin-Rotor Helicopter', 'Seaplane', 'Storm-Watch Plane', 'Water Bomber', 'Display Jet', 'Jump Jet', 'Tiltrotor', 'Weather Drone'] as const;
export type AircraftName = (typeof AIRCRAFT_NAMES)[number];

// ---------- things to buy again and again ----------

/** Each opens once the last fixed one of its kind is built, and its price rises a little each time and then stays flat. Hull sections
 *  and bays stop at a length that still draws well; the Yard's new ships never stop (fleet.ts makes each one from parts). */
export const REPEATS = [
  { id: 'hull', name: 'Another Ship Section', icon: '🚢', needs: 'part:hull8', base: 60, step: 5, flat: 100, most: 8 },
  { id: 'bay', name: 'Another Hangar Bay', icon: '🅿️', needs: 'part:bay4', base: 50, step: 5, flat: 90, most: 8 },
  { id: 'yard', name: 'New Ship from the Yard', icon: '🛳️', needs: 'fleet:tug', base: 60, step: 5, flat: 120, most: Infinity },
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
