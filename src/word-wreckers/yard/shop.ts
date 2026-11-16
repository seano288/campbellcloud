// Everything Bolts buy, and everything a Job can build. Each table is a plain list, so adding more later is adding rows: a machine, an
// upgrade for a machine, a paint, a driver, a street for the Town, a decoration, or a building. Every price is at most 100, the most the
// recorded numbers go.
//
// Machines knock buildings down (swing a wrecking ball, push with a blade, bite with a bucket), haul the rubble (the dump truck) or lift
// the new building's pieces (the tower crane). A building is wood, brick, concrete or steel (its tier, 1 to 4), and a machine knocks
// down any building up to its power. Power upgrades raise a machine's power, so the free crane can grow into a steel-wrecker too.
// The tallest buildings (tier 4) need the Tower Crane to put up.

export type Action = 'swing' | 'push' | 'bite' | 'haul' | 'lift';
export const MATERIALS = ['wood', 'brick', 'concrete', 'steel'] as const;
export type Tier = 1 | 2 | 3 | 4;
export const TOP_TIER: Tier = 4;

export const MACHINES = [
  { id: 'crane', name: 'Wrecking Ball Crane', price: 0, action: 'swing', power: 1 },
  { id: 'skid', name: 'Skid Steer', price: 10, action: 'push', power: 1 },
  { id: 'dozer', name: 'Bulldozer', price: 15, action: 'push', power: 2 },
  { id: 'digger', name: 'Excavator', price: 30, action: 'bite', power: 2 },
  { id: 'dump', name: 'Dump Truck', price: 40, action: 'haul', power: 0, opens: 'It hauls the rubble away!' },
  { id: 'tower', name: 'Tower Crane', price: 60, action: 'lift', power: 0, opens: 'It can build the tallest buildings!' },
  { id: 'robot', name: 'Demolition Robot', price: 70, action: 'bite', power: 3 },
  { id: 'monster', name: 'Monster Dozer', price: 80, action: 'push', power: 4 },
  { id: 'mega', name: 'Mega Wrecker', price: 90, action: 'swing', power: 4 },
  { id: 'giant', name: 'Giant Excavator', price: 100, action: 'bite', power: 4 },
] as const satisfies readonly { id: string; name: string; price: number; action: Action; power: number; opens?: string }[];
export type MachineId = (typeof MACHINES)[number]['id'];
export type MachineName = (typeof MACHINES)[number]['name'];
export const machine = (id: MachineId) => MACHINES.find(m => m.id === id)!;
export const MACHINE_IDS = MACHINES.map(m => m.id) as MachineId[];
export const isMachineId = (x: unknown): x is MachineId => (MACHINE_IDS as readonly unknown[]).includes(x);
/** The machines that knock buildings down. */
export const WRECKERS = MACHINES.filter(m => m.power > 0).map(m => m.id) as MachineId[];

/** What an upgrade does: more power (a stronger material), bigger hits, more speed, or just looks. */
export type Boost = 'power' | 'size' | 'speed' | 'look';
export const UPGRADES = [
  { machine: 'crane', id: 'bigball', name: 'Big Ball', price: 10, boost: 'power' },
  { machine: 'crane', id: 'boom', name: 'Long Boom', price: 20, boost: 'size' },
  { machine: 'crane', id: 'steelball', name: 'Steel Ball', price: 28, boost: 'power' },
  { machine: 'crane', id: 'spiky', name: 'Spiky Ball', price: 55, boost: 'power' },
  { machine: 'skid', id: 'bucket', name: 'Big Bucket', price: 8, boost: 'power' },
  { machine: 'skid', id: 'wheels', name: 'Turbo Wheels', price: 14, boost: 'speed' },
  { machine: 'dozer', id: 'wide', name: 'Wide Blade', price: 18, boost: 'power' },
  { machine: 'dozer', id: 'tracks', name: 'Big Tracks', price: 24, boost: 'speed' },
  { machine: 'dozer', id: 'ripper', name: 'Ripper Teeth', price: 42, boost: 'power' },
  { machine: 'digger', id: 'bucket', name: 'Big Bucket', price: 22, boost: 'power' },
  { machine: 'digger', id: 'arm', name: 'Long Arm', price: 30, boost: 'size' },
  { machine: 'digger', id: 'claw', name: 'Rock Claw', price: 48, boost: 'power' },
  { machine: 'dump', id: 'horn', name: 'Air Horn', price: 12, boost: 'look' },
  { machine: 'dump', id: 'bed', name: 'Big Bed', price: 20, boost: 'speed' },
  { machine: 'dump', id: 'wheels', name: 'Giant Wheels', price: 34, boost: 'look' },
  { machine: 'tower', id: 'lights', name: 'Night Lights', price: 22, boost: 'look' },
  { machine: 'tower', id: 'hook', name: 'Fast Hook', price: 28, boost: 'speed' },
  { machine: 'tower', id: 'mast', name: 'Tall Mast', price: 40, boost: 'look' },
  { machine: 'robot', id: 'eyes', name: 'Laser Eyes', price: 35, boost: 'look' },
  { machine: 'robot', id: 'claw', name: 'Power Claw', price: 50, boost: 'power' },
  { machine: 'monster', id: 'rocket', name: 'Rocket Boost', price: 60, boost: 'speed' },
  { machine: 'monster', id: 'teeth', name: 'Shark Teeth', price: 72, boost: 'size' },
  { machine: 'mega', id: 'chain', name: 'Rainbow Chain', price: 64, boost: 'look' },
  { machine: 'mega', id: 'lightning', name: 'Lightning Ball', price: 80, boost: 'size' },
  { machine: 'giant', id: 'turbo', name: 'Turbo Engine', price: 66, boost: 'speed' },
  { machine: 'giant', id: 'diamond', name: 'Diamond Teeth', price: 85, boost: 'size' },
] as const satisfies readonly { machine: MachineId; id: string; name: string; price: number; boost: Boost }[];
export type UpgradeName = (typeof UPGRADES)[number]['name'];
export const upgradesOf = (m: MachineId) => UPGRADES.filter(u => u.machine === m);

/** The machines' paint, bought once for all of them; each machine wears its own. Hi-Vis Yellow is free. */
export const PAINTS = [
  { id: 'yellow', name: 'Hi-Vis Yellow', price: 0, body: '#ffc61a', trim: '#c98f00', pattern: null },
  { id: 'orange', name: 'Safety Orange', price: 4, body: '#ff7a1a', trim: '#c95400', pattern: null },
  { id: 'red', name: 'Fire Red', price: 4, body: '#e63946', trim: '#a01f2b', pattern: null },
  { id: 'blue', name: 'Sky Blue', price: 4, body: '#3d9be0', trim: '#1f64a8', pattern: null },
  { id: 'green', name: 'Grass Green', price: 5, body: '#4fae4a', trim: '#2f7a2a', pattern: null },
  { id: 'lime', name: 'Lemon Lime', price: 6, body: '#b6e04a', trim: '#6f9a1a', pattern: null },
  { id: 'purple', name: 'Grape Purple', price: 6, body: '#7a4fd8', trim: '#4f2fa0', pattern: null },
  { id: 'white', name: 'Snow White', price: 6, body: '#f4f6f8', trim: '#a9b4bf', pattern: null },
  { id: 'black', name: 'Night Black', price: 6, body: '#2a2d33', trim: '#000000', pattern: null },
  { id: 'brown', name: 'Chocolate Brown', price: 6, body: '#7a4a2a', trim: '#4a2a14', pattern: null },
  { id: 'pink', name: 'Bubblegum Pink', price: 8, body: '#ff7ac0', trim: '#c94a8c', pattern: null },
  { id: 'teal', name: 'Ocean Teal', price: 8, body: '#1fb5a8', trim: '#11786f', pattern: null },
  { id: 'silver', name: 'Shiny Silver', price: 10, body: '#c9d1d9', trim: '#7a8794', pattern: null },
  { id: 'hazard', name: 'Hazard Stripes', price: 12, body: '#ffc61a', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'zebra', name: 'Zebra Stripes', price: 12, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'tiger', name: 'Tiger Stripes', price: 12, body: '#ff8a1f', trim: '#1d1d1f', pattern: 'stripes' },
  { id: 'dots', name: 'Polka Dots', price: 14, body: '#3d9be0', trim: '#f4f6f8', pattern: 'dots' },
  { id: 'checks', name: 'Checkers', price: 14, body: '#f4f6f8', trim: '#1d1d1f', pattern: 'checks' },
  { id: 'camo', name: 'Army Camo', price: 14, body: '#6f8f4a', trim: '#3f5a2a', pattern: 'camo' },
  { id: 'gold', name: 'Shiny Gold', price: 16, body: '#f2c43a', trim: '#a87a00', pattern: null },
  { id: 'flames', name: 'Racing Flames', price: 20, body: '#2a2d33', trim: '#ff7a1a', pattern: 'flames' },
  { id: 'stars', name: 'Starry Night', price: 20, body: '#1f2f6a', trim: '#ffd23f', pattern: 'stars' },
  { id: 'bolts', name: 'Lightning Bolts', price: 22, body: '#3d2a8a', trim: '#ffd23f', pattern: 'lightning' },
  { id: 'rainbow', name: 'Rainbow', price: 24, body: '#e63946', trim: '#7a4fd8', pattern: 'rainbow' },
] as const;
export type PaintId = (typeof PAINTS)[number]['id'];
export type PaintName = (typeof PAINTS)[number]['name'];
export const paintOf = (id: string) => PAINTS.find(p => p.id === id) ?? PAINTS[0];

/** Who sits in the cab of every machine: for looks only. */
export const DRIVERS = [
  { id: 'worker', name: 'Hard Hat', price: 0, icon: '👷' },
  { id: 'puppy', name: 'Puppy', price: 5, icon: '🐶' },
  { id: 'kitty', name: 'Kitty', price: 8, icon: '🐱' },
  { id: 'bear', name: 'Bear', price: 12, icon: '🐻' },
  { id: 'monkey', name: 'Monkey', price: 16, icon: '🐵' },
  { id: 'penguin', name: 'Penguin', price: 20, icon: '🐧' },
  { id: 'lion', name: 'Lion', price: 26, icon: '🦁' },
  { id: 'panda', name: 'Panda', price: 32, icon: '🐼' },
  { id: 'frog', name: 'Frog', price: 40, icon: '🐸' },
  { id: 'alien', name: 'Alien', price: 50, icon: '👽' },
  { id: 'robot', name: 'Robot', price: 65, icon: '🤖' },
  { id: 'dino', name: 'Dino', price: 80, icon: '🦖' },
  { id: 'unicorn', name: 'Unicorn', price: 95, icon: '🦄' },
] as const;
export type DriverId = (typeof DRIVERS)[number]['id'];
export type DriverName = (typeof DRIVERS)[number]['name'];
export const driverOf = (id: string) => DRIVERS.find(d => d.id === id) ?? DRIVERS[0];

// ---------- the Town ----------

/** The Town's streets, each with LOTS_PER_STREET lots for buildings. Main Street is free. */
export const LOTS_PER_STREET = 6;
export const STREETS = [
  { id: 'main', name: 'Main Street', price: 0, ground: '#9fd06a', sky: '#9fd8f5' },
  { id: 'park', name: 'Park Lane', price: 20, ground: '#7cc45a', sky: '#a9dcf7' },
  { id: 'river', name: 'River Road', price: 35, ground: '#8cc9b0', sky: '#b2e0f5' },
  { id: 'hill', name: 'Hill Street', price: 50, ground: '#b9c46a', sky: '#bfe3f7' },
  { id: 'harbor', name: 'Harbor Way', price: 70, ground: '#d9c58a', sky: '#9fd0f0' },
  { id: 'rocket', name: 'Rocket Row', price: 90, ground: '#c9b2d9', sky: '#3a3f7a' },
] as const;
export type StreetId = (typeof STREETS)[number]['id'];
export type StreetName = (typeof STREETS)[number]['name'];

/** Things for the Town's pavement, for looks: they stand along the street. */
export const DECOS = [
  { id: 'trees', name: 'Trees', price: 4, icon: '🌳' },
  { id: 'flowers', name: 'Flower Pots', price: 5, icon: '🌷' },
  { id: 'benches', name: 'Benches', price: 6, icon: '🪑' },
  { id: 'flags', name: 'Flags', price: 6, icon: '🚩' },
  { id: 'mailbox', name: 'Mailbox', price: 7, icon: '📮' },
  { id: 'lamps', name: 'Street Lamps', price: 8, icon: '🏮' },
  { id: 'balloons', name: 'Balloons', price: 8, icon: '🎈' },
  { id: 'lights', name: 'Traffic Lights', price: 10, icon: '🚦' },
  { id: 'kites', name: 'Kites', price: 10, icon: '🪁' },
  { id: 'bus', name: 'Bus Stop', price: 12, icon: '🚏' },
  { id: 'hotdog', name: 'Hot Dog Cart', price: 12, icon: '🌭' },
  { id: 'fountain', name: 'Fountain', price: 14, icon: '⛲' },
  { id: 'icecream', name: 'Ice Cream Truck', price: 15, icon: '🍦' },
  { id: 'hoop', name: 'Basketball Hoop', price: 18, icon: '🏀' },
  { id: 'sailboat', name: 'Sailboat', price: 20, icon: '⛵' },
  { id: 'playground', name: 'Playground', price: 22, icon: '🛝' },
  { id: 'schoolbus', name: 'School Bus', price: 25, icon: '🚌' },
  { id: 'ambulance', name: 'Ambulance', price: 28, icon: '🚑' },
  { id: 'firetruck', name: 'Fire Truck', price: 30, icon: '🚒' },
  { id: 'police', name: 'Police Car', price: 30, icon: '🚓' },
  { id: 'band', name: 'Marching Band', price: 34, icon: '🎺' },
  { id: 'tent', name: 'Circus Tent', price: 38, icon: '🎪' },
  { id: 'carousel', name: 'Carousel', price: 44, icon: '🎠' },
  { id: 'helicopter', name: 'Helicopter', price: 50, icon: '🚁' },
  { id: 'train', name: 'Train', price: 56, icon: '🚂' },
  { id: 'ferris', name: 'Ferris Wheel', price: 62, icon: '🎡' },
  { id: 'coaster', name: 'Roller Coaster', price: 70, icon: '🎢' },
  { id: 'ufo', name: 'Flying Saucer', price: 78, icon: '🛸' },
  { id: 'rainbow', name: 'Rainbow', price: 88, icon: '🌈' },
  { id: 'fireworks', name: 'Fireworks', price: 100, icon: '🎆' },
] as const;
export type DecoName = (typeof DECOS)[number]['name'];

/**
 * What a Job builds: free, one per finished Job. `tier`: the material of the old building he has to knock down first (and so how
 * strong a machine it needs); tier 4 also needs the Tower Crane. `look` and `sign` say how it's drawn (art/buildings.ts).
 */
export const BUILDINGS = [
  { id: 'house', name: 'House', tier: 1, look: 'house', sign: '', color: '#f2a65a' },
  { id: 'lemonade', name: 'Lemonade Stand', tier: 1, look: 'stand', sign: '🍋', color: '#ffe066' },
  { id: 'treehouse', name: 'Tree House', tier: 1, look: 'treehouse', sign: '', color: '#b07a4a' },
  { id: 'barn', name: 'Barn', tier: 1, look: 'barn', sign: '', color: '#d9483b' },
  { id: 'icecream', name: 'Ice Cream Shop', tier: 1, look: 'shop', sign: '🍦', color: '#ffb3d9' },
  { id: 'cabin', name: 'Cabin', tier: 1, look: 'cabin', sign: '', color: '#9a6a3a' },
  { id: 'petshop', name: 'Pet Shop', tier: 1, look: 'shop', sign: '🐶', color: '#9fd8a8' },
  { id: 'bakery', name: 'Bakery', tier: 1, look: 'shop', sign: '🧁', color: '#f7d7a8' },
  { id: 'fire', name: 'Fire Station', tier: 2, look: 'station', sign: '🚒', color: '#e63946' },
  { id: 'police', name: 'Police Station', tier: 2, look: 'station', sign: '🚓', color: '#3d7be0' },
  { id: 'school', name: 'School', tier: 2, look: 'school', sign: '🍎', color: '#e8c06a' },
  { id: 'library', name: 'Library', tier: 2, look: 'columns', sign: '📚', color: '#d9cdb8' },
  { id: 'toyshop', name: 'Toy Shop', tier: 2, look: 'shop', sign: '🧸', color: '#ff9ac8' },
  { id: 'pizza', name: 'Pizza Place', tier: 2, look: 'shop', sign: '🍕', color: '#f5c76a' },
  { id: 'post', name: 'Post Office', tier: 2, look: 'office', sign: '✉️', color: '#8fb3e0' },
  { id: 'diner', name: 'Diner', tier: 2, look: 'diner', sign: '🍔', color: '#c9e8f2' },
  { id: 'candy', name: 'Candy Store', tier: 2, look: 'shop', sign: '🍭', color: '#c9a8f2' },
  { id: 'bikeshop', name: 'Bike Shop', tier: 2, look: 'shop', sign: '🚲', color: '#a8e0c9' },
  { id: 'hospital', name: 'Hospital', tier: 3, look: 'office', sign: '🏥', color: '#f4f6f8' },
  { id: 'museum', name: 'Museum', tier: 3, look: 'columns', sign: '🦖', color: '#e8dcc0' },
  { id: 'trainstation', name: 'Train Station', tier: 3, look: 'station', sign: '🚂', color: '#c98a5a' },
  { id: 'watertower', name: 'Water Tower', tier: 3, look: 'watertower', sign: '💧', color: '#8fc9e8' },
  { id: 'lighthouse', name: 'Lighthouse', tier: 3, look: 'lighthouse', sign: '', color: '#f4f6f8' },
  { id: 'castle', name: 'Castle', tier: 3, look: 'castle', sign: '', color: '#b9b2a8' },
  { id: 'aquarium', name: 'Aquarium', tier: 3, look: 'dome', sign: '🐠', color: '#6fc9e8' },
  { id: 'clocktower', name: 'Clock Tower', tier: 3, look: 'clock', sign: '', color: '#d9b28a' },
  { id: 'movies', name: 'Movie Theater', tier: 3, look: 'office', sign: '🎬', color: '#8a5ad9' },
  { id: 'bridge', name: 'Bridge', tier: 3, look: 'bridge', sign: '', color: '#e05a3a' },
  { id: 'skyscraper', name: 'Skyscraper', tier: 4, look: 'tower', sign: '', color: '#7ab8e0' },
  { id: 'stadium', name: 'Stadium', tier: 4, look: 'stadium', sign: '⚽', color: '#d9d9d9' },
  { id: 'rocketpad', name: 'Rocket Pad', tier: 4, look: 'rocket', sign: '', color: '#f4f6f8' },
  { id: 'airport', name: 'Airport Tower', tier: 4, look: 'airport', sign: '✈️', color: '#c9d1d9' },
  { id: 'tvtower', name: 'TV Tower', tier: 4, look: 'needle', sign: '', color: '#e63946' },
  { id: 'factory', name: 'Robot Factory', tier: 4, look: 'factory', sign: '🤖', color: '#9aa8b5' },
  { id: 'hotel', name: 'Hotel', tier: 4, look: 'tower', sign: '🛎️', color: '#e8b86a' },
  { id: 'space', name: 'Space Center', tier: 4, look: 'dome', sign: '🛰️', color: '#c9c9f2' },
] as const satisfies readonly { id: string; name: string; tier: Tier; look: string; sign: string; color: string }[];
export type BuildingId = (typeof BUILDINGS)[number]['id'];
export type BuildingName = (typeof BUILDINGS)[number]['name'];
export type Look = (typeof BUILDINGS)[number]['look'];
export const building = (id: BuildingId) => BUILDINGS.find(b => b.id === id)!;
export const isBuildingId = (x: unknown): x is BuildingId => BUILDINGS.some(b => b.id === x);

// ---------- one key for anything he can own ----------

export type Tab = 'machine' | 'up' | 'paint' | 'driver' | 'street' | 'deco';
export type ItemKey = `${Tab}:${string}`;
export type ItemName = MachineName | UpgradeName | PaintName | DriverName | StreetName | DecoName;
export interface Item { key: ItemKey; tab: Tab; id: string; name: ItemName; price: number; machine?: MachineId }

/** An upgrade's key names its machine: "up:dozer:wide". */
export const upKey = (m: MachineId, id: string) => `up:${m}:${id}` as ItemKey;
export const ITEMS: readonly Item[] = [
  ...MACHINES.map(m => ({ key: `machine:${m.id}` as ItemKey, tab: 'machine' as Tab, id: m.id as string, name: m.name, price: m.price })),
  ...UPGRADES.map(u => ({ key: upKey(u.machine, u.id), tab: 'up' as Tab, id: u.id as string, name: u.name, price: u.price, machine: u.machine as MachineId })),
  ...PAINTS.map(p => ({ key: `paint:${p.id}` as ItemKey, tab: 'paint' as Tab, id: p.id as string, name: p.name, price: p.price })),
  ...DRIVERS.map(d => ({ key: `driver:${d.id}` as ItemKey, tab: 'driver' as Tab, id: d.id as string, name: d.name, price: d.price })),
  ...STREETS.map(s => ({ key: `street:${s.id}` as ItemKey, tab: 'street' as Tab, id: s.id as string, name: s.name, price: s.price })),
  ...DECOS.map(d => ({ key: `deco:${d.id}` as ItemKey, tab: 'deco' as Tab, id: d.id as string, name: d.name, price: d.price })),
];
export const ALL_KEYS = ITEMS.map(i => i.key);
export const isItemKey = (x: unknown): x is ItemKey => typeof x === 'string' && ITEMS.some(i => i.key === x);
export const item = (k: ItemKey) => ITEMS.find(i => i.key === k)!;
export const keyOf = (tab: Exclude<Tab, 'up'>, id: string) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.split(':')[0] as Tab;
export const idOf = (k: ItemKey) => k.split(':').at(-1)!;
export const STARTERS: readonly ItemKey[] = ITEMS.filter(i => i.price === 0).map(i => i.key);
export const ALL_NAMES = [...new Set(ITEMS.map(i => i.name))];
export const BUILDING_NAMES = BUILDINGS.map(b => b.name);
/** The line said when a machine that opens something is bought or tried. */
export type OpensLine = Extract<(typeof MACHINES)[number], { opens: string }>['opens'];
export const opensOf = (k: ItemKey): OpensLine | undefined => { const m = tabOf(k) === 'machine' ? MACHINES.find(x => x.id === idOf(k)) : undefined; return m && 'opens' in m ? m.opens : undefined; };
