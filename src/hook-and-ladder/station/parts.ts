// Everything at the Station he can earn, and what each one does. Plain tables: station.ts holds his save and the buying.
//
// - Trucks and Aircraft: one vehicle he takes at a time, each with its own trick at the Call (call/sim.ts's TRICKS). Trucks park on
//   the street and spray with the hose; helicopters, the drone, the jet pack and the blimp hover and spray from the air; the two
//   planes fly where he points and drop the water, and send people down by parachute.
// - Engine, Pump, Hose, Ladder, Tank: Rungs that change the Call. The Engine makes the drive quicker and the ladder faster, the Pump
//   sets how high the water reaches, the Hose how wide the spray is, the Ladder how many floors it climbs, the Tank how long he
//   sprays before a short refill.
// - Nozzle: what comes out of the hose (most only look different; Fan, Foam, Twin, Sprinkler, Water Cannon and Triple change how it
//   puts fires out).
// - Gadgets: switched on or off, as many as he likes, and they go on whichever vehicle he takes.
// - Siren, Lights, Paint, Buddy: how his vehicle sounds and looks, and who rides with him (a dalmatian first).
// - Station and Town things: on the Station wall and floor, and in the Town.
// - Prizes: ten things that can't be bought, won every fifth Level of the Mystery Call.
// No price is over 100 Bolts, the most the recorded numbers say.

export const TABS = ['truck', 'air', 'engine', 'pump', 'hose', 'ladder', 'tank', 'nozzle', 'gadget', 'siren', 'lights', 'paint', 'buddy', 'station', 'town'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = {
  truck: 'Trucks', air: 'Aircraft', engine: 'Engine', pump: 'Pump', hose: 'Hose', ladder: 'Ladder', tank: 'Tank', nozzle: 'Nozzle',
  gadget: 'Gadgets', siren: 'Siren', lights: 'Lights', paint: 'Paint', buddy: 'Crew Buddy', station: 'Station', town: 'Town',
} as const satisfies Record<Tab, string>;
/** The tabs whose items fit the vehicle (one at a time, Trucks and Aircraft sharing one place); Gadgets switch on and off; the
 *  Station and Town tabs collect things. */
export const FITTED: readonly Tab[] = ['truck', 'air', 'engine', 'pump', 'hose', 'ladder', 'tank', 'nozzle', 'siren', 'lights', 'paint', 'buddy'];

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
  readonly pattern?: Pattern;
  /** Buddies and things: the emoji (the dalmatian is drawn). */
  readonly emoji?: string;
  /** A Mystery Call prize: won at this Level, never bought. */
  readonly prize?: number;
  /** A vehicle: how it works at the Call. */
  readonly kind?: VehicleKind;
}
export type Pattern = 'stripes' | 'spots' | 'flames' | 'tiger' | 'zebra' | 'camo' | 'rainbow' | 'galaxy' | 'glow' | 'candy'
  | 'checker' | 'stars' | 'lightning' | 'polka' | 'leopard' | 'waves' | 'diamond';
/** truck: parks on the street; hover: hangs in the air beside the scene; plane: flies over it. */
export type VehicleKind = 'truck' | 'hover' | 'plane';

function rungs<const N extends readonly string[]>(names: N, prices: readonly number[]) {
  return names.map((name, i) => ({ id: `r${i}`, name, price: i === 0 ? 0 : prices[i - 1]!, rung: i })) as { id: string; name: N[number]; price: number; rung: number }[];
}

export const TRUCKS = [
  { id: 'pumper', name: 'Pumper', price: 0, kind: 'truck', trick: 'It is ready for anything!' },
  { id: 'mini', name: 'Mini Pumper', price: 15, kind: 'truck', trick: 'It fills up super fast!' },
  { id: 'ladder', name: 'Ladder Truck', price: 25, kind: 'truck', trick: 'Its ladder reaches two floors higher!' },
  { id: 'tanker', name: 'Tanker', price: 35, kind: 'truck', trick: 'It holds twice the water!' },
  { id: 'quint', name: 'Quint', price: 40, kind: 'truck', trick: 'It has a longer ladder and a bigger tank!' },
  { id: 'rescue', name: 'Rescue Truck', price: 45, kind: 'truck', trick: 'Its ladder goes up super fast!' },
  { id: 'steam', name: 'Steam Engine', price: 50, kind: 'truck', trick: 'Its steam pump puts out fires faster!' },
  { id: 'brush', name: 'Brush Truck', price: 55, kind: 'truck', trick: 'It puts out grass and tree fires in one splash!' },
  { id: 'tower', name: 'Tower Truck', price: 60, kind: 'truck', trick: 'It sprays water from way up high!' },
  { id: 'monster', name: 'Monster Fire Truck', price: 65, kind: 'truck', trick: 'It has two hoses!' },
  { id: 'crash', name: 'Airport Crash Truck', price: 70, kind: 'truck', trick: 'Its foam puts out fires twice as fast!' },
  { id: 'robot', name: 'Robot Truck', price: 75, kind: 'truck', trick: 'Its robot sprays by itself!' },
  { id: 'boat', name: 'Fireboat', price: 85, kind: 'truck', trick: 'It never runs out of water!' },
  { id: 'jet', name: 'Jet Truck', price: 90, kind: 'truck', trick: 'Its jet engines blow a giant spray!' },
  { id: 'train', name: 'Fire Train', price: 95, kind: 'truck', trick: 'It carries three tanks of water!' },
  { id: 'gold', name: 'Golden Fire Engine', price: 0, prize: 30, kind: 'truck', trick: 'It can do everything!' },
] as const satisfies readonly ItemDef[];

export const AIRCRAFT = [
  { id: 'drone', name: 'Fire Drone', price: 30, kind: 'hover', trick: 'It flies right up to the fire!' },
  { id: 'blimp', name: 'Fire Blimp', price: 45, kind: 'hover', trick: 'It floats up high with lots of water!' },
  { id: 'jetpack', name: 'Jet Pack', price: 50, kind: 'hover', trick: 'It zooms people down super fast!' },
  { id: 'scooper', name: 'Water Bomber', price: 60, kind: 'plane', trick: 'It drops water wherever you point!' },
  { id: 'twin', name: 'Twin Rotor Helicopter', price: 80, kind: 'hover', trick: 'It drops two buckets of water!' },
  { id: 'skycrane', name: 'Sky Crane', price: 90, kind: 'hover', trick: 'It drops a giant bucket of water!' },
  { id: 'airtanker', name: 'Air Tanker', price: 95, kind: 'plane', trick: 'It drops a giant wall of water!' },
  { id: 'heli', name: 'Fire Helicopter', price: 100, kind: 'hover', trick: 'It can drop water from the sky!' },
  { id: 'superjet', name: 'Super Jet', price: 0, prize: 45, kind: 'plane', trick: 'It is the fastest plane of all!' },
] as const satisfies readonly ItemDef[];
export type TruckId = (typeof TRUCKS)[number]['id'] | (typeof AIRCRAFT)[number]['id'];
const VEHICLES: readonly ItemDef[] = [...TRUCKS, ...AIRCRAFT];
export const kindOf = (id: TruckId): VehicleKind => VEHICLES.find(v => v.id === id)?.kind ?? 'truck';
/** Where the Tower Truck's hose sprays from: the bucket at the top of its boom (in the truck's own units, back wheel at 0). */
export const TOWER_NOZZLE = { x: 4.3, y: 3.75 } as const;

/** The Engine: how fast the drive is and how quickly the ladder moves, and what comes out of the exhaust. */
export const ENGINES = rungs(['Starter Engine', 'Big Engine', 'Turbo Engine', 'Super Engine', 'Jet Engine', 'Rocket Engine', 'Rainbow Engine'] as const, [10, 20, 35, 55, 75, 100]);
/** How high the water reaches: the highest floor at the middle of a building. */
export const PUMP_FLOORS = [3, 4, 5, 6, 7, 9, 10, 11, 12] as const;
export const PUMPS = rungs(['Starter Pump', 'Strong Pump', 'Super Pump', 'Mega Pump', 'Turbo Pump', 'Giant Pump', 'Rocket Pump', 'Thunder Pump', 'Sky Pump'] as const, [8, 18, 32, 50, 75, 85, 95, 100]);
/** How wide the spray is (0 to 7). */
export const HOSES = rungs(['Garden Hose', 'Fire Hose', 'Big Hose', 'Double Hose', 'Wide Hose', 'Super Hose', 'Mega Hose', 'Giant Hose'] as const, [6, 14, 26, 42, 64, 78, 92]);
/** How many floors the ladder climbs. */
export const LADDER_FLOORS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const LADDERS = rungs(['Short Ladder', 'Long Ladder', 'Tall Ladder', 'Super Ladder', 'Mega Ladder', 'Giant Ladder', 'Sky Ladder', 'Cloud Ladder', 'Space Ladder'] as const, [10, 20, 34, 52, 74, 100, 100, 100]);
/** How many seconds he can spray before the tank refills. */
export const TANK_SECONDS = [4, 6, 8, 11, 14, 18, 22, 26] as const;
export const TANKS = rungs(['Small Tank', 'Big Tank', 'Huge Tank', 'Giant Tank', 'Mega Tank', 'Ocean Tank', 'Whale Tank', 'Planet Tank'] as const, [6, 14, 26, 42, 64, 78, 92]);

export const NOZZLES = [
  { id: 'straight', name: 'Straight Nozzle', price: 0 },
  { id: 'fan', name: 'Fan Nozzle', price: 12, trick: 'It sprays wider!' },
  { id: 'foam', name: 'Foam Nozzle', price: 18, trick: 'Foam puts out fires faster!' },
  { id: 'hearts', name: 'Heart Nozzle', price: 20, trick: 'It sprays hearts!' },
  { id: 'bubbles', name: 'Bubble Nozzle', price: 25, trick: 'It sprays bubbles!' },
  { id: 'stars', name: 'Star Nozzle', price: 28, trick: 'It sprays stars!' },
  { id: 'rainbow', name: 'Rainbow Nozzle', price: 32, trick: 'It sprays a rainbow!' },
  { id: 'confetti', name: 'Confetti Nozzle', price: 35, trick: 'It sprays confetti!' },
  { id: 'slime', name: 'Slime Nozzle', price: 38, trick: 'It sprays green slime!' },
  { id: 'glitter', name: 'Glitter Nozzle', price: 40, trick: 'It sprays glitter!' },
  { id: 'chocolate', name: 'Chocolate Nozzle', price: 45, trick: 'It sprays chocolate milk!' },
  { id: 'snow', name: 'Snow Nozzle', price: 50, trick: 'It sprays snow!' },
  { id: 'sprinkler', name: 'Sprinkler Nozzle', price: 55, trick: 'It sprays super wide!' },
  { id: 'twin', name: 'Twin Nozzle', price: 60, trick: 'It sprays two streams!' },
  { id: 'cannon', name: 'Water Cannon', price: 70, trick: 'It puts out fires super fast!' },
  { id: 'triple', name: 'Triple Nozzle', price: 85, trick: 'It sprays three streams!' },
  { id: 'golden', name: 'Golden Nozzle', price: 0, prize: 20, trick: 'It sprays golden sparkles!' },
] as const satisfies readonly ItemDef[];
export type NozzleId = (typeof NOZZLES)[number]['id'];

/** Switched on or off, as many as he likes; they go on every vehicle. */
export const GADGETS = [
  { id: 'bell', name: 'Brass Bell', price: 8, emoji: '🔔', trick: 'It rings when you get there!' },
  { id: 'flag', name: 'Fire Flag', price: 10, emoji: '🚩', trick: 'It waves in the wind!' },
  { id: 'spotlight', name: 'Spotlight', price: 15, emoji: '🔦', trick: 'It lights up the night!' },
  { id: 'fan', name: 'Smoke Fan', price: 20, emoji: '🌀', trick: 'It blows the smoke away!' },
  { id: 'confetti', name: 'Party Popper', price: 25, emoji: '🎉', trick: 'It pops confetti when you finish!' },
  { id: 'turbo', name: 'Turbo Ladder', price: 30, emoji: '⚡', trick: 'Your ladder moves twice as fast!' },
  { id: 'trailer', name: 'Water Trailer', price: 35, emoji: '🛢️', trick: 'It carries extra water!' },
  { id: 'drone', name: 'Rescue Drone', price: 45, emoji: '🛸', trick: 'It flies people down from any floor!' },
  { id: 'cannon', name: 'Roof Cannon', price: 55, emoji: '💦', trick: 'It sprays another stream of water!' },
  { id: 'hydrant', name: 'Hydrant Hookup', price: 70, emoji: '🚰', trick: 'Your water never runs out!' },
  { id: 'cape', name: 'Hero Cape', price: 0, prize: 50, emoji: '🦸', trick: 'Your crew can fly up to any window!' },
] as const satisfies readonly ItemDef[];
export type GadgetId = (typeof GADGETS)[number]['id'];

export const SIRENS = [
  { id: 'wail', name: 'Wail Siren', price: 0 },
  { id: 'yelp', name: 'Yelp Siren', price: 5 },
  { id: 'hilo', name: 'Hi-Lo Siren', price: 8 },
  { id: 'whoop', name: 'Whoop Siren', price: 12 },
  { id: 'airhorn', name: 'Air Horn', price: 15 },
  { id: 'bell', name: 'Fire Bell', price: 20 },
  { id: 'robot', name: 'Robot Beeps', price: 22 },
  { id: 'bighorn', name: 'Big Horn', price: 25 },
  { id: 'whistle', name: 'Train Whistle', price: 28 },
  { id: 'silly', name: 'Silly Honk', price: 30 },
  { id: 'laser', name: 'Laser Siren', price: 35 },
  { id: 'tune', name: 'Fire Tune', price: 40 },
  { id: 'spooky', name: 'Spooky Siren', price: 45 },
  { id: 'hero', name: 'Hero Horn', price: 0, prize: 25 },
] as const satisfies readonly ItemDef[];
export type SirenId = (typeof SIRENS)[number]['id'];

export const LIGHTS = [
  { id: 'red', name: 'Red Lights', price: 0, color: '#ff2a2a' },
  { id: 'redwhite', name: 'Red and White Lights', price: 5, color: '#ffffff' },
  { id: 'blue', name: 'Blue Lights', price: 6, color: '#2a7bff' },
  { id: 'orange', name: 'Orange Lights', price: 6, color: '#ff8c1a' },
  { id: 'green', name: 'Green Lights', price: 8, color: '#2bff6a' },
  { id: 'pink', name: 'Pink Lights', price: 8, color: '#ff6fb5' },
  { id: 'purple', name: 'Purple Lights', price: 10, color: '#b84dff' },
  { id: 'ice', name: 'Ice Lights', price: 10, color: '#9ff0ff' },
  { id: 'gold', name: 'Gold Lights', price: 12, color: '#ffc21a' },
  { id: 'flicker', name: 'Flicker Lights', price: 15, color: '#ffb03a' },
  { id: 'rainbow', name: 'Rainbow Lights', price: 18, color: '#ff7a00' },
  { id: 'police', name: 'Blue and Red Lights', price: 20, color: '#2a7bff' },
  { id: 'disco', name: 'Disco Lights', price: 25, color: '#ff4dc4' },
  { id: 'sparkle', name: 'Sparkle Lights', price: 30, color: '#bff4ff' },
  { id: 'twinkle', name: 'Twinkle Lights', price: 35, color: '#fff6b0' },
  { id: 'star', name: 'Star Lights', price: 40, color: '#fff27a' },
  { id: 'fireworks', name: 'Fireworks Lights', price: 0, prize: 5, color: '#ff4dc4' },
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
  { id: 'cherry', name: 'Cherry Red', price: 5, color: '#a3102a' },
  { id: 'purple', name: 'Purple', price: 6, color: '#7d3cff' },
  { id: 'pink', name: 'Bubblegum Pink', price: 6, color: '#ff6fb5' },
  { id: 'teal', name: 'Ocean Teal', price: 6, color: '#13a89e' },
  { id: 'brown', name: 'Chocolate Brown', price: 6, color: '#7a4a2a' },
  { id: 'lemon', name: 'Lemon', price: 6, color: '#fff35c' },
  { id: 'grape', name: 'Grape', price: 7, color: '#5a2a8a' },
  { id: 'mint', name: 'Mint Green', price: 7, color: '#7be0b5' },
  { id: 'forest', name: 'Forest Green', price: 7, color: '#1f6b34' },
  { id: 'gold', name: 'Gold', price: 8, color: '#e2b007' },
  { id: 'silver', name: 'Chrome Silver', price: 8, color: '#b9c2cc' },
  { id: 'navy', name: 'Midnight Blue', price: 8, color: '#1c2a6b' },
  { id: 'peach', name: 'Peach', price: 8, color: '#ffb48a' },
  { id: 'lava', name: 'Lava', price: 10, color: '#ff4a1a', pattern: 'glow' },
  { id: 'stripe', name: 'Racing Stripes', price: 10, color: '#d7262e', pattern: 'stripes' },
  { id: 'checker', name: 'Checkers', price: 10, color: '#f4f4f0', pattern: 'checker' },
  { id: 'spots', name: 'Dalmatian Spots', price: 12, color: '#f4f4f0', pattern: 'spots' },
  { id: 'candy', name: 'Candy Stripe', price: 12, color: '#ff6fb5', pattern: 'candy' },
  { id: 'polka', name: 'Polka Dots', price: 12, color: '#3fa9f5', pattern: 'polka' },
  { id: 'waves', name: 'Ocean Waves', price: 14, color: '#13a89e', pattern: 'waves' },
  { id: 'tiger', name: 'Tiger', price: 15, color: '#ff8c1a', pattern: 'tiger' },
  { id: 'zebra', name: 'Zebra', price: 15, color: '#f4f4f0', pattern: 'zebra' },
  { id: 'camo', name: 'Camo', price: 15, color: '#5f7a3a', pattern: 'camo' },
  { id: 'leopard', name: 'Leopard', price: 16, color: '#e8b04a', pattern: 'leopard' },
  { id: 'lightning', name: 'Lightning', price: 18, color: '#1c2a6b', pattern: 'lightning' },
  { id: 'flames', name: 'Flames', price: 18, color: '#2a2a30', pattern: 'flames' },
  { id: 'blueflames', name: 'Blue Flames', price: 18, color: '#f4f4f0', pattern: 'flames' },
  { id: 'starry', name: 'Starry Night', price: 18, color: '#1c2a6b', pattern: 'stars' },
  { id: 'rainbow', name: 'Rainbow', price: 20, color: '#ff2a2a', pattern: 'rainbow' },
  { id: 'galaxy', name: 'Galaxy', price: 20, color: '#2a1550', pattern: 'galaxy' },
  { id: 'goldstar', name: 'Gold Stars', price: 20, color: '#d7262e', pattern: 'stars' },
  { id: 'diamond', name: 'Diamond', price: 0, prize: 15, color: '#c8f4ff', pattern: 'diamond' },
] as const satisfies readonly ItemDef[];
export type PaintId = (typeof PAINTS)[number]['id'];

export const BUDDIES = [
  { id: 'dalmatian', name: 'Dalmatian', price: 0 },
  { id: 'cat', name: 'Kitty', price: 8, emoji: '🐱' },
  { id: 'hamster', name: 'Hamster', price: 10, emoji: '🐹' },
  { id: 'owl', name: 'Owl', price: 12, emoji: '🦉' },
  { id: 'pig', name: 'Piggy', price: 12, emoji: '🐷' },
  { id: 'bunny', name: 'Bunny', price: 15, emoji: '🐰' },
  { id: 'cow', name: 'Cow', price: 15, emoji: '🐮' },
  { id: 'parrot', name: 'Parrot', price: 20, emoji: '🦜' },
  { id: 'hedgehog', name: 'Hedgehog', price: 20, emoji: '🦔' },
  { id: 'fox', name: 'Fox', price: 25, emoji: '🦊' },
  { id: 'koala', name: 'Koala', price: 25, emoji: '🐨' },
  { id: 'bear', name: 'Bear', price: 30, emoji: '🐻' },
  { id: 'panda', name: 'Panda', price: 30, emoji: '🐼' },
  { id: 'penguin', name: 'Penguin', price: 35, emoji: '🐧' },
  { id: 'turtle', name: 'Turtle', price: 35, emoji: '🐢' },
  { id: 'frog', name: 'Froggy', price: 40, emoji: '🐸' },
  { id: 'sloth', name: 'Sloth', price: 40, emoji: '🦥' },
  { id: 'monkey', name: 'Monkey', price: 45, emoji: '🐵' },
  { id: 'lion', name: 'Lion', price: 45, emoji: '🦁' },
  { id: 'robot', name: 'Robot', price: 50, emoji: '🤖' },
  { id: 'octopus', name: 'Octopus', price: 50, emoji: '🐙' },
  { id: 'alien', name: 'Alien', price: 55, emoji: '👽' },
  { id: 'ghost', name: 'Friendly Ghost', price: 55, emoji: '👻' },
  { id: 'firefighter', name: 'Firefighter', price: 60, emoji: '🧑‍🚒' },
  { id: 'dragon', name: 'Dragon', price: 65, emoji: '🐲' },
  { id: 'shark', name: 'Shark', price: 70, emoji: '🦈' },
  { id: 'unicorn', name: 'Unicorn', price: 75, emoji: '🦄' },
  { id: 'elephant', name: 'Elephant', price: 80, emoji: '🐘' },
  { id: 'dino', name: 'Dinosaur', price: 90, emoji: '🦖' },
  { id: 'longneck', name: 'Long Neck Dinosaur', price: 100, emoji: '🦕' },
  { id: 'hero', name: 'Super Hero', price: 0, prize: 10, emoji: '🦸' },
] as const satisfies readonly ItemDef[];
export type BuddyId = (typeof BUDDIES)[number]['id'];

export const STATION_THINGS = [
  { id: 'flag', name: 'Flag', price: 5, emoji: '🚩' },
  { id: 'plant', name: 'Plant', price: 5, emoji: '🪴' },
  { id: 'bucket', name: 'Fire Bucket', price: 5, emoji: '🪣' },
  { id: 'boots', name: 'Fire Boots', price: 6, emoji: '👢' },
  { id: 'ball', name: 'Soccer Ball', price: 6, emoji: '⚽' },
  { id: 'bell', name: 'Bell', price: 8, emoji: '🔔' },
  { id: 'clock', name: 'Clock', price: 8, emoji: '🕰️' },
  { id: 'teddy', name: 'Teddy Bear', price: 8, emoji: '🧸' },
  { id: 'helmet', name: 'Helmet', price: 10, emoji: '⛑️' },
  { id: 'extinguisher', name: 'Fire Extinguisher', price: 10, emoji: '🧯' },
  { id: 'lantern', name: 'Lantern', price: 10, emoji: '🏮' },
  { id: 'ring', name: 'Life Ring', price: 10, emoji: '🛟' },
  { id: 'axe', name: 'Axe', price: 12, emoji: '🪓' },
  { id: 'map', name: 'Town Map', price: 12, emoji: '🗺️' },
  { id: 'radio', name: 'Radio', price: 12, emoji: '📻' },
  { id: 'kite', name: 'Kite', price: 12, emoji: '🪁' },
  { id: 'toolbox', name: 'Toolbox', price: 14, emoji: '🧰' },
  { id: 'doctor', name: 'Doctor Kit', price: 14, emoji: '🩺' },
  { id: 'puzzle', name: 'Puzzle', price: 14, emoji: '🧩' },
  { id: 'couch', name: 'Couch', price: 16, emoji: '🛋️' },
  { id: 'ladders', name: 'Spare Ladder', price: 16, emoji: '🪜' },
  { id: 'skateboard', name: 'Skateboard', price: 16, emoji: '🛹' },
  { id: 'hoop', name: 'Basketball Hoop', price: 18, emoji: '🏀' },
  { id: 'kitchen', name: 'Kitchen', price: 20, emoji: '🍳' },
  { id: 'alarm', name: 'Fire Alarm', price: 20, emoji: '🚨' },
  { id: 'pizza', name: 'Pizza Oven', price: 20, emoji: '🍕' },
  { id: 'beds', name: 'Bunk Beds', price: 22, emoji: '🛏️' },
  { id: 'cupcakes', name: 'Cupcakes', price: 22, emoji: '🧁' },
  { id: 'trophy', name: 'Trophy', price: 25, emoji: '🏆' },
  { id: 'tv', name: 'TV', price: 25, emoji: '📺' },
  { id: 'fish', name: 'Fish Tank', price: 28, emoji: '🐠' },
  { id: 'medal', name: 'Medal', price: 30, emoji: '🏅' },
  { id: 'guitar', name: 'Guitar', price: 30, emoji: '🎸' },
  { id: 'telescope', name: 'Telescope', price: 35, emoji: '🔭' },
  { id: 'drums', name: 'Drums', price: 35, emoji: '🥁' },
  { id: 'piano', name: 'Piano', price: 40, emoji: '🎹' },
  { id: 'arcade', name: 'Arcade Game', price: 50, emoji: '🕹️' },
  { id: 'disco', name: 'Disco Ball', price: 60, emoji: '🪩' },
  { id: 'crown', name: 'Golden Crown', price: 0, prize: 35, emoji: '👑' },
] as const satisfies readonly ItemDef[];

export const TOWN_THINGS = [
  { id: 'tree', name: 'Tree', price: 5, emoji: '🌳' },
  { id: 'flowers', name: 'Flowers', price: 6, emoji: '🌷' },
  { id: 'sunflowers', name: 'Sunflowers', price: 6, emoji: '🌻' },
  { id: 'palm', name: 'Palm Tree', price: 8, emoji: '🌴' },
  { id: 'mailbox', name: 'Mailbox', price: 8, emoji: '📮' },
  { id: 'mushroom', name: 'Mushroom', price: 8, emoji: '🍄' },
  { id: 'traffic', name: 'Traffic Light', price: 10, emoji: '🚦' },
  { id: 'busstop', name: 'Bus Stop', price: 12, emoji: '🚏' },
  { id: 'snowman', name: 'Snowman', price: 12, emoji: '⛄' },
  { id: 'tent', name: 'Tent', price: 12, emoji: '⛺' },
  { id: 'icecream', name: 'Ice Cream Cart', price: 15, emoji: '🍦' },
  { id: 'holiday', name: 'Holiday Tree', price: 15, emoji: '🎄' },
  { id: 'fountain', name: 'Fountain', price: 18, emoji: '⛲' },
  { id: 'sailboat', name: 'Sailboat', price: 18, emoji: '⛵' },
  { id: 'pond', name: 'Duck Pond', price: 20, emoji: '🦆' },
  { id: 'beach', name: 'Beach', price: 22, emoji: '🏖️' },
  { id: 'playground', name: 'Playground', price: 25, emoji: '🛝' },
  { id: 'train', name: 'Train', price: 28, emoji: '🚂' },
  { id: 'balloon', name: 'Balloons', price: 30, emoji: '🎈' },
  { id: 'rainbow', name: 'Rainbow', price: 32, emoji: '🌈' },
  { id: 'circus', name: 'Circus Tent', price: 35, emoji: '🎪' },
  { id: 'carousel', name: 'Carousel', price: 40, emoji: '🎠' },
  { id: 'mountain', name: 'Mountain', price: 40, emoji: '🗻' },
  { id: 'statue', name: 'Statue', price: 45, emoji: '🗽' },
  { id: 'stadium', name: 'Stadium', price: 50, emoji: '🏟️' },
  { id: 'wheel', name: 'Ferris Wheel', price: 55, emoji: '🎡' },
  { id: 'rocket', name: 'Rocket', price: 60, emoji: '🚀' },
  { id: 'volcano', name: 'Volcano', price: 65, emoji: '🌋' },
  { id: 'castle', name: 'Castle', price: 70, emoji: '🏰' },
  { id: 'ufo', name: 'Flying Saucer', price: 75, emoji: '🛸' },
  { id: 'coaster', name: 'Roller Coaster', price: 85, emoji: '🎢' },
  { id: 'tokyo', name: 'Tall Tower', price: 95, emoji: '🗼' },
  { id: 'hall', name: 'Hero Hall', price: 0, prize: 40, emoji: '🏛️' },
] as const satisfies readonly ItemDef[];

export const CATALOGUE: Readonly<Record<Tab, readonly ItemDef[]>> = {
  truck: TRUCKS, air: AIRCRAFT, engine: ENGINES, pump: PUMPS, hose: HOSES, ladder: LADDERS, tank: TANKS, nozzle: NOZZLES, gadget: GADGETS,
  siren: SIRENS, lights: LIGHTS, paint: PAINTS, buddy: BUDDIES, station: STATION_THINGS, town: TOWN_THINGS,
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
export const isPrize = (k: ItemKey) => infoOf(k).prize !== undefined;
/** What he starts with: every free thing that isn't a prize. */
export const STARTERS: readonly ItemKey[] = ALL_KEYS.filter(k => infoOf(k).price === 0 && !isPrize(k));
/** What there is to buy. */
export const FOR_SALE: readonly ItemKey[] = ALL_KEYS.filter(k => infoOf(k).price > 0);
/** The Mystery Call's prizes, in the order they're won (every fifth Level). */
export const PRIZES: readonly ItemKey[] = ALL_KEYS.filter(isPrize).sort((a, b) => infoOf(a).prize! - infoOf(b).prize!);
export const PRIZE_EVERY = 5;

type Named = typeof TRUCKS | typeof AIRCRAFT | typeof NOZZLES | typeof GADGETS | typeof SIRENS | typeof LIGHTS | typeof PAINTS | typeof BUDDIES | typeof STATION_THINGS | typeof TOWN_THINGS;
export type ItemName = Named[number]['name'] | (typeof ENGINES | typeof PUMPS | typeof HOSES | typeof LADDERS | typeof TANKS)[number]['name'];
export type TrickLine = NonNullable<Extract<(typeof TRUCKS | typeof AIRCRAFT | typeof NOZZLES | typeof GADGETS)[number], { trick: string }>['trick']>;
