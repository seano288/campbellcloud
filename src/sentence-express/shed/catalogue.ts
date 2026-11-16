// Everything Bolts buy, in one place, so a later pass can add more by adding rows: engines, cars, paints, track (boxes of track
// squares and bigger tables) and scenery. Every price is at most 100, the most the recorded numbers go. Stations are not bought: a
// Delivery opens the next one, and the first Delivery from each brings a gift piece of scenery.
//
// A row is plain data. How an engine or a car looks is a few words of style that art/train.ts draws; scenery is an emoji, or a
// drawn piece (the water tower, the tunnel, the bridge, the level crossing, the signal) that sits on or beside the track.

export const TABS = ['engine', 'car', 'paint', 'track', 'scenery'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = { engine: 'Engines', car: 'Cars', paint: 'Paint', track: 'Track', scenery: 'Scenery' } as const;

export type EngineKind = 'tank' | 'steam' | 'shunter' | 'diesel' | 'electric' | 'bullet' | 'tram';
export interface EngineRow { readonly id: string; readonly name: string; readonly price: number; readonly kind: EngineKind; readonly big?: boolean; readonly plow?: boolean; readonly trim?: string }
export const ENGINES = [
  { id: 'tank', name: 'Little Tank Engine', price: 0, kind: 'tank' },
  { id: 'shunter', name: 'Yard Shunter', price: 12, kind: 'shunter' },
  { id: 'tram', name: 'Tram', price: 18, kind: 'tram' },
  { id: 'steam', name: 'Big Steam Engine', price: 30, kind: 'steam', big: true },
  { id: 'mail', name: 'Mail Engine', price: 40, kind: 'steam', trim: '#ffd23f' },
  { id: 'plow', name: 'Snow Plow Engine', price: 50, kind: 'diesel', plow: true },
  { id: 'diesel', name: 'Diesel Engine', price: 60, kind: 'diesel', big: true },
  { id: 'electric', name: 'Electric Engine', price: 70, kind: 'electric' },
  { id: 'mountain', name: 'Mountain Engine', price: 78, kind: 'steam', big: true, plow: true },
  { id: 'oldtimer', name: 'Old Timer', price: 85, kind: 'tank', big: true, trim: '#c9a227' },
  { id: 'golden', name: 'Golden Engine', price: 92, kind: 'steam', big: true, trim: '#f2c43a' },
  { id: 'skytrain', name: 'Sky Train', price: 96, kind: 'electric', big: true, trim: '#7fdcff' },
  { id: 'bullet', name: 'Bullet Train', price: 100, kind: 'bullet' },
] as const satisfies readonly EngineRow[];

export type CarShape = 'open' | 'box' | 'tank' | 'flat' | 'coach' | 'caboose' | 'hopper';
export interface CarRow { readonly id: string; readonly name: string; readonly price: number; readonly shape: CarShape; readonly load?: string; readonly color?: string }
export const CARS = [
  { id: 'wagon', name: 'Open Wagon', price: 0, shape: 'open' },
  { id: 'coal', name: 'Coal Car', price: 6, shape: 'open', load: 'coal' },
  { id: 'logs', name: 'Log Car', price: 8, shape: 'flat', load: '🪵' },
  { id: 'blocks', name: 'Block Car', price: 9, shape: 'flat', load: 'blocks' },
  { id: 'animals', name: 'Animal Car', price: 10, shape: 'box', load: '🐄' },
  { id: 'tanker', name: 'Milk Tanker', price: 12, shape: 'tank', color: '#f4f6f8' },
  { id: 'coach', name: 'Passenger Car', price: 15, shape: 'coach' },
  { id: 'caboose', name: 'Caboose', price: 18, shape: 'caboose' },
  { id: 'mailcar', name: 'Mail Car', price: 20, shape: 'box', load: '✉️' },
  { id: 'hopper', name: 'Rock Hopper', price: 22, shape: 'hopper', load: 'rocks' },
  { id: 'icecream', name: 'Ice Cream Car', price: 25, shape: 'box', load: '🍦', color: '#ff9ec7' },
  { id: 'fruit', name: 'Fruit Car', price: 28, shape: 'open', load: '🍎' },
  { id: 'fuel', name: 'Fuel Tanker', price: 30, shape: 'tank', color: '#2a2d33' },
  { id: 'circus', name: 'Circus Car', price: 32, shape: 'box', load: '🎪', color: '#e63946' },
  { id: 'dining', name: 'Dining Car', price: 35, shape: 'coach', load: '🍽️' },
  { id: 'sleeper', name: 'Sleeper Car', price: 40, shape: 'coach', load: '💤', color: '#3a4fa0' },
  { id: 'toys', name: 'Toy Car', price: 45, shape: 'open', load: '🧸' },
  { id: 'crane', name: 'Crane Car', price: 50, shape: 'flat', load: 'crane' },
  { id: 'carrier', name: 'Car Carrier', price: 55, shape: 'flat', load: '🚗' },
  { id: 'treasure', name: 'Treasure Car', price: 60, shape: 'open', load: '💎' },
  { id: 'fish', name: 'Fish Tank Car', price: 65, shape: 'tank', load: '🐠', color: '#7fd0f0' },
  { id: 'rocket', name: 'Rocket Car', price: 70, shape: 'flat', load: '🚀' },
  { id: 'dino', name: 'Dino Car', price: 80, shape: 'flat', load: '🦕' },
  { id: 'party', name: 'Party Car', price: 90, shape: 'coach', load: '🎈', color: '#7a4fd8' },
  { id: 'goldcar', name: 'Golden Car', price: 100, shape: 'box', load: '⭐', color: '#f2c43a' },
] as const satisfies readonly CarRow[];
/** The most cars his engine can pull. */
export const MAX_CARS = 6;

/** The colour of his train: the engine's body and the cars' sides. Patterns are drawn over the body. */
export interface PaintRow { readonly id: string; readonly name: string; readonly price: number; readonly body: string; readonly trim: string; readonly pattern?: 'stripes' | 'dots' | 'checks' | 'stars' | 'flames' | 'rainbow' | 'spots' }
export const PAINTS = [
  { id: 'red', name: 'Toy Red', price: 0, body: '#e63946', trim: '#a01f2b' },
  { id: 'blue', name: 'Toy Blue', price: 4, body: '#2f7fd8', trim: '#1f4f98' },
  { id: 'green', name: 'Toy Green', price: 4, body: '#2bb673', trim: '#1a7a4a' },
  { id: 'yellow', name: 'Sunny Yellow', price: 4, body: '#ffd23f', trim: '#c99a00' },
  { id: 'orange', name: 'Orange', price: 6, body: '#ff7a1a', trim: '#c95400' },
  { id: 'purple', name: 'Grape Purple', price: 6, body: '#7a4fd8', trim: '#4f2fa0' },
  { id: 'black', name: 'Night Black', price: 6, body: '#2a2d33', trim: '#000000' },
  { id: 'white', name: 'Snow White', price: 6, body: '#f4f6f8', trim: '#a9b4bf' },
  { id: 'brown', name: 'Wood Brown', price: 6, body: '#9a6a3a', trim: '#5a3a1a' },
  { id: 'pink', name: 'Bubblegum Pink', price: 8, body: '#ff7ac0', trim: '#c94a8c' },
  { id: 'teal', name: 'Ocean Teal', price: 8, body: '#1fb5a8', trim: '#11786f' },
  { id: 'mint', name: 'Mint Green', price: 8, body: '#7fdcb0', trim: '#3f9a72' },
  { id: 'silver', name: 'Shiny Silver', price: 10, body: '#c9d1d9', trim: '#7a8794' },
  { id: 'stripes', name: 'Red Stripes', price: 10, body: '#f4f6f8', trim: '#e63946', pattern: 'stripes' },
  { id: 'zebra', name: 'Zebra Stripes', price: 12, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'tiger', name: 'Tiger Stripes', price: 12, body: '#ff8a1f', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'dots', name: 'Polka Dots', price: 14, body: '#2f7fd8', trim: '#f4f6f8', pattern: 'dots' },
  { id: 'leopard', name: 'Leopard Spots', price: 14, body: '#e8b860', trim: '#4a2a14', pattern: 'spots' },
  { id: 'gold', name: 'Shiny Gold', price: 16, body: '#f2c43a', trim: '#a87a00' },
  { id: 'checks', name: 'Checkers', price: 16, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'checks' },
  { id: 'ladybug', name: 'Ladybug', price: 16, body: '#e63946', trim: '#1d1d1f', pattern: 'dots' },
  { id: 'candy', name: 'Candy Stripes', price: 18, body: '#ff9ec7', trim: '#f4f6f8', pattern: 'stripes' },
  { id: 'flames', name: 'Racing Flames', price: 20, body: '#2a2d33', trim: '#ff7a1a', pattern: 'flames' },
  { id: 'stars', name: 'Starry Night', price: 20, body: '#1f2f6a', trim: '#ffd23f', pattern: 'stars' },
  { id: 'rainbow', name: 'Rainbow Stripes', price: 24, body: '#e63946', trim: '#7a4fd8', pattern: 'rainbow' },
] as const satisfies readonly PaintRow[];

/** Track: boxes of track squares he lays on his table, and bigger tables. Track boxes are cheap so he can always buy something. */
export interface TrackRow { readonly id: string; readonly name: string; readonly price: number; readonly squares?: number; readonly table?: { w: number; h: number }; readonly color: string }
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
] as const satisfies readonly TrackRow[];
/** The table he starts with, and the track squares that come with it (the starter loop and a few to spare). */
export const START_TABLE = { w: 12, h: 8 } as const;
export const START_SQUARES = 40;

/** Scenery: `on: 'track'` pieces go on a straight bit of track (a tunnel, a bridge, a level crossing); the rest on an empty square. */
export type Drawn = 'tower' | 'tunnel' | 'bridge' | 'crossing' | 'signal' | 'windmill';
export interface SceneryRow { readonly id: string; readonly name: string; readonly price: number; readonly icon?: string; readonly drawn?: Drawn; readonly on?: 'track' }
export const SCENERY = [
  { id: 'trees', name: 'Trees', price: 3, icon: '🌳' },
  { id: 'flowers', name: 'Flowers', price: 3, icon: '🌷' },
  { id: 'bushes', name: 'Bushes', price: 3, icon: '🌿' },
  { id: 'pines', name: 'Pine Trees', price: 4, icon: '🌲' },
  { id: 'rocks', name: 'Rocks', price: 4, icon: '🪨' },
  { id: 'hay', name: 'Hay Bales', price: 4, icon: '🌾' },
  { id: 'sunflowers', name: 'Sunflowers', price: 5, icon: '🌻' },
  { id: 'busstop', name: 'Bus Stop', price: 5, icon: '🚏' },
  { id: 'bench', name: 'Bench', price: 5, icon: '🪑' },
  { id: 'signal', name: 'Signal', price: 6, drawn: 'signal' },
  { id: 'mailbox', name: 'Mailbox', price: 6, icon: '📮' },
  { id: 'cactus', name: 'Cactus', price: 6, icon: '🌵' },
  { id: 'lamp', name: 'Lamp Post', price: 7, icon: '🏮' },
  { id: 'ducks', name: 'Ducks', price: 8, icon: '🦆' },
  { id: 'picnic', name: 'Picnic Basket', price: 9, icon: '🧺' },
  { id: 'snowman', name: 'Snowman', price: 8, icon: '⛄' },
  { id: 'pumpkins', name: 'Pumpkins', price: 8, icon: '🎃' },
  { id: 'palm', name: 'Palm Tree', price: 9, icon: '🌴' },
  { id: 'sheep', name: 'Sheep', price: 10, icon: '🐑' },
  { id: 'cows', name: 'Cows', price: 10, icon: '🐄' },
  { id: 'house', name: 'Little House', price: 10, icon: '🏠' },
  { id: 'tower', name: 'Water Tower', price: 12, drawn: 'tower' },
  { id: 'tent', name: 'Camp Tent', price: 12, icon: '⛺' },
  { id: 'horse', name: 'Horse', price: 14, icon: '🐎' },
  { id: 'crossing', name: 'Level Crossing', price: 15, drawn: 'crossing', on: 'track' },
  { id: 'icecream', name: 'Ice Cream Stand', price: 15, icon: '🍦' },
  { id: 'bridge', name: 'Bridge', price: 18, drawn: 'bridge', on: 'track' },
  { id: 'fountain', name: 'Fountain', price: 18, icon: '⛲' },
  { id: 'tunnel', name: 'Tunnel', price: 20, drawn: 'tunnel', on: 'track' },
  { id: 'school', name: 'School', price: 20, icon: '🏫' },
  { id: 'gas', name: 'Gas Station', price: 20, icon: '⛽' },
  { id: 'playground', name: 'Playground', price: 22, icon: '🛝' },
  { id: 'windmill', name: 'Windmill', price: 25, drawn: 'windmill' },
  { id: 'bakery', name: 'Bakery', price: 25, icon: '🥐' },
  { id: 'sailboat', name: 'Sailboat', price: 28, icon: '⛵' },
  { id: 'firestation', name: 'Fire Station', price: 30, icon: '🚒' },
  { id: 'factory', name: 'Factory', price: 30, icon: '🏭' },
  { id: 'rainbow', name: 'Rainbow', price: 30, icon: '🌈' },
  { id: 'postoffice', name: 'Post Office', price: 32, icon: '🏤' },
  { id: 'mountain', name: 'Mountain', price: 35, icon: '⛰️' },
  { id: 'bank', name: 'Bank', price: 35, icon: '🏦' },
  { id: 'hospital', name: 'Hospital', price: 38, icon: '🏥' },
  { id: 'bigtent', name: 'Circus Tent', price: 40, icon: '🎪' },
  { id: 'balloon', name: 'Hot Air Balloon', price: 45, icon: '🎈' },
  { id: 'hotel', name: 'Hotel', price: 45, icon: '🏨' },
  { id: 'helicopter', name: 'Helicopter', price: 50, icon: '🚁' },
  { id: 'carousel', name: 'Carousel', price: 55, icon: '🎠' },
  { id: 'castle', name: 'Castle', price: 60, icon: '🏰' },
  { id: 'dino', name: 'Dinosaur', price: 65, icon: '🦕' },
  { id: 'ferris', name: 'Ferris Wheel', price: 70, icon: '🎡' },
  { id: 'stadium', name: 'Stadium', price: 75, icon: '🏟️' },
  { id: 'volcano', name: 'Volcano', price: 80, icon: '🌋' },
  { id: 'whale', name: 'Whale Pond', price: 85, icon: '🐳' },
  { id: 'airplane', name: 'Airplane', price: 85, icon: '✈️' },
  { id: 'rocketpad', name: 'Rocket', price: 90, icon: '🚀' },
  { id: 'coaster', name: 'Roller Coaster', price: 95, icon: '🎢' },
  { id: 'spaceship', name: 'Flying Saucer', price: 100, icon: '🛸' },
] as const satisfies readonly SceneryRow[];

// ---------- the line: stations, their cargo and their gifts ----------

/** Toy Town is home: every Delivery brings its cargo there. The other eight open one at a time, the Farm first. */
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
] as const;
export type StationId = (typeof STATIONS)[number]['id'];
export type Station = (typeof STATIONS)[number];
export const station = (id: StationId) => STATIONS.find(s => s.id === id)!;
export const LINE = STATIONS.slice(1) as readonly Station[];
export const GIFTS = LINE.map(s => s.gift!);

/** Every name a thing he can own is said by. */
export type ItemName = (typeof ENGINES)[number]['name'] | (typeof CARS)[number]['name'] | (typeof PAINTS)[number]['name'] | (typeof TRACK)[number]['name']
  | (typeof SCENERY)[number]['name'] | NonNullable<(typeof STATIONS)[number]['gift']>['name'];
