// Everything Bolts buy, and everything a Job can build. Each table is a plain list, so adding more later is adding rows: a machine, an
// upgrade for a machine, a paint, a driver, a street for the Town, a decoration, or a building. Every price is at most 100, the most the
// recorded numbers go.
//
// Machines knock buildings down six ways (swing a wrecking ball, push with a blade, bite with a bucket, hammer with a jackhammer, blow
// it up with dynamite, lift it off with a magnet), haul the rubble (the dump truck), lift the new building's pieces (the tower crane) or
// pave a road (the steamroller and the cement mixer, for a Road Job). A building is wood, brick, concrete or steel (its tier, 1 to 4),
// and a machine knocks down any building up to its power. Power upgrades raise a machine's power, so the free crane can grow into a
// steel-wrecker too. The tallest buildings (tier 4) need the Tower Crane to put up.
//
// Ids are what a save stores: an existing row's id never changes, and rows are only ever added.

export type Action = 'swing' | 'push' | 'bite' | 'hammer' | 'blast' | 'magnet' | 'haul' | 'lift' | 'pave';
/** The ways to knock a building down. */
export type WreckAction = Extract<Action, 'swing' | 'push' | 'bite' | 'hammer' | 'blast' | 'magnet'>;
export const MATERIALS = ['wood', 'brick', 'concrete', 'steel'] as const;
export type Tier = 1 | 2 | 3 | 4;
export const TOP_TIER: Tier = 4;

export const MACHINES = [
  { id: 'crane', name: 'Wrecking Ball Crane', price: 0, action: 'swing', power: 1 },
  { id: 'minidig', name: 'Mini Digger', price: 6, action: 'bite', power: 1 },
  { id: 'skid', name: 'Skid Steer', price: 10, action: 'push', power: 1 },
  { id: 'dozer', name: 'Bulldozer', price: 15, action: 'push', power: 2 },
  { id: 'jackhammer', name: 'Jackhammer', price: 18, action: 'hammer', power: 1, opens: 'Tap fast to hammer!' },
  { id: 'roller', name: 'Steamroller', price: 25, action: 'pave', power: 0, opens: 'It can pave a road!' },
  { id: 'digger', name: 'Excavator', price: 30, action: 'bite', power: 2 },
  { id: 'mixer', name: 'Cement Mixer', price: 38, action: 'pave', power: 0, opens: 'It can fill holes in the road!' },
  { id: 'dump', name: 'Dump Truck', price: 40, action: 'haul', power: 0, opens: 'It hauls the rubble away!' },
  { id: 'dynamite', name: 'Dynamite Truck', price: 45, action: 'blast', power: 2, opens: 'It blows buildings up!' },
  { id: 'magnet', name: 'Magnet Crane', price: 55, action: 'magnet', power: 3, opens: 'It lifts steel with a magnet!' },
  { id: 'tower', name: 'Tower Crane', price: 60, action: 'lift', power: 0, opens: 'It can build the tallest buildings!' },
  { id: 'breaker', name: 'Rock Breaker', price: 66, action: 'hammer', power: 3, opens: 'Tap fast to hammer!' },
  { id: 'robot', name: 'Demolition Robot', price: 70, action: 'bite', power: 3 },
  { id: 'monster', name: 'Monster Dozer', price: 80, action: 'push', power: 4 },
  { id: 'supermag', name: 'Super Magnet', price: 86, action: 'magnet', power: 4, opens: 'It lifts steel with a magnet!' },
  { id: 'mega', name: 'Mega Wrecker', price: 90, action: 'swing', power: 4 },
  { id: 'blaster', name: 'Mega Blaster', price: 96, action: 'blast', power: 4, opens: 'It blows buildings up!' },
  { id: 'giant', name: 'Giant Excavator', price: 100, action: 'bite', power: 4 },
] as const satisfies readonly { id: string; name: string; price: number; action: Action; power: number; opens?: string }[];
export type MachineId = (typeof MACHINES)[number]['id'];
export type MachineName = (typeof MACHINES)[number]['name'];
export const machine = (id: MachineId) => MACHINES.find(m => m.id === id)!;
export const MACHINE_IDS = MACHINES.map(m => m.id) as MachineId[];
export const isMachineId = (x: unknown): x is MachineId => (MACHINE_IDS as readonly unknown[]).includes(x);
/** The machines that knock buildings down. */
export const WRECKERS = MACHINES.filter(m => m.power > 0).map(m => m.id) as MachineId[];
/** The machines that pave a road, for a Road Job. */
export const PAVERS = MACHINES.filter(m => m.action === 'pave').map(m => m.id) as MachineId[];
export const actionOf = (m: MachineId) => machine(m).action;

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
  // one more for each of the first machines
  { machine: 'crane', id: 'rocket', name: 'Rocket Tracks', price: 36, boost: 'speed' },
  { machine: 'skid', id: 'giantbucket', name: 'Giant Bucket', price: 20, boost: 'size' },
  { machine: 'dozer', id: 'stack', name: 'Smoke Stack', price: 26, boost: 'look' },
  { machine: 'digger', id: 'tracks', name: 'Turbo Tracks', price: 26, boost: 'speed' },
  { machine: 'dump', id: 'flag', name: 'Checkered Flag', price: 16, boost: 'look' },
  { machine: 'tower', id: 'spot', name: 'Spotlight', price: 34, boost: 'look' },
  { machine: 'robot', id: 'jet', name: 'Jet Pack', price: 44, boost: 'speed' },
  { machine: 'robot', id: 'saw', name: 'Spinning Saw', price: 62, boost: 'size' },
  { machine: 'monster', id: 'flames', name: 'Flame Pipes', price: 50, boost: 'look' },
  { machine: 'mega', id: 'swing', name: 'Turbo Swing', price: 58, boost: 'speed' },
  { machine: 'giant', id: 'gold', name: 'Gold Bucket', price: 74, boost: 'look' },
  // the new machines
  { machine: 'minidig', id: 'scoop', name: 'Big Scoop', price: 8, boost: 'power' },
  { machine: 'minidig', id: 'zoom', name: 'Zoom Tracks', price: 12, boost: 'speed' },
  { machine: 'minidig', id: 'flag', name: 'Racing Flag', price: 14, boost: 'look' },
  { machine: 'jackhammer', id: 'bit', name: 'Sharp Bit', price: 16, boost: 'power' },
  { machine: 'jackhammer', id: 'lights', name: 'Flashing Lights', price: 20, boost: 'look' },
  { machine: 'jackhammer', id: 'turbo', name: 'Turbo Hammer', price: 24, boost: 'size' },
  { machine: 'jackhammer', id: 'diamond', name: 'Diamond Bit', price: 40, boost: 'power' },
  { machine: 'roller', id: 'smile', name: 'Smiley Face', price: 15, boost: 'look' },
  { machine: 'roller', id: 'wide', name: 'Wide Drum', price: 20, boost: 'size' },
  { machine: 'roller', id: 'turbo', name: 'Turbo Roller', price: 28, boost: 'speed' },
  { machine: 'mixer', id: 'swirl', name: 'Candy Swirl', price: 18, boost: 'look' },
  { machine: 'mixer', id: 'drum', name: 'Big Drum', price: 26, boost: 'size' },
  { machine: 'mixer', id: 'wheels', name: 'Speedy Wheels', price: 30, boost: 'speed' },
  { machine: 'dynamite', id: 'flag', name: 'Danger Flag', price: 18, boost: 'look' },
  { machine: 'dynamite', id: 'fuse', name: 'Fast Fuse', price: 22, boost: 'speed' },
  { machine: 'dynamite', id: 'tnt', name: 'More TNT', price: 34, boost: 'power' },
  { machine: 'dynamite', id: 'mega', name: 'Mega TNT', price: 52, boost: 'power' },
  { machine: 'magnet', id: 'winch', name: 'Fast Winch', price: 28, boost: 'speed' },
  { machine: 'magnet', id: 'big', name: 'Big Magnet', price: 32, boost: 'size' },
  { machine: 'magnet', id: 'coil', name: 'Super Coil', price: 45, boost: 'power' },
  { machine: 'breaker', id: 'jets', name: 'Rocket Jets', price: 40, boost: 'speed' },
  { machine: 'breaker', id: 'chisel', name: 'Steel Chisel', price: 48, boost: 'power' },
  { machine: 'breaker', id: 'mega', name: 'Mega Hammer', price: 60, boost: 'size' },
  { machine: 'supermag', id: 'lights', name: 'Disco Lights', price: 50, boost: 'look' },
  { machine: 'supermag', id: 'winch', name: 'Turbo Winch', price: 62, boost: 'speed' },
  { machine: 'supermag', id: 'giant', name: 'Giant Magnet', price: 70, boost: 'size' },
  { machine: 'blaster', id: 'fuse', name: 'Quick Fuse', price: 58, boost: 'speed' },
  { machine: 'blaster', id: 'confetti', name: 'Confetti Bombs', price: 64, boost: 'look' },
  { machine: 'blaster', id: 'mega', name: 'Mega Boom', price: 85, boost: 'size' },
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
  { id: 'mint', name: 'Mint Green', price: 5, body: '#8fe3c0', trim: '#3fa883', pattern: null },
  { id: 'navy', name: 'Navy Blue', price: 5, body: '#24407a', trim: '#101f45', pattern: null },
  { id: 'peach', name: 'Peach', price: 6, body: '#ffb88a', trim: '#d97a45', pattern: null },
  { id: 'lavender', name: 'Lavender', price: 6, body: '#c3a8f0', trim: '#7f5fc0', pattern: null },
  { id: 'sand', name: 'Desert Sand', price: 6, body: '#e3c88f', trim: '#a8884a', pattern: null },
  { id: 'coral', name: 'Coral Pink', price: 7, body: '#ff7f73', trim: '#c9483d', pattern: null },
  { id: 'magenta', name: 'Hot Magenta', price: 8, body: '#e0249a', trim: '#900f60', pattern: null },
  { id: 'neon', name: 'Neon Green', price: 8, body: '#5cff4a', trim: '#1fa80f', pattern: null },
  { id: 'ice', name: 'Ice Blue', price: 8, body: '#bfeaff', trim: '#5fa8d0', pattern: null },
  { id: 'copper', name: 'Copper', price: 10, body: '#c9733a', trim: '#7f3f14', pattern: null },
  { id: 'chrome', name: 'Chrome', price: 12, body: '#e4ebf2', trim: '#5f6b78', pattern: null },
  { id: 'ruby', name: 'Ruby Red', price: 12, body: '#b0103a', trim: '#5f0018', pattern: null },
  { id: 'emerald', name: 'Emerald', price: 12, body: '#14a05a', trim: '#05592f', pattern: null },
  { id: 'sapphire', name: 'Sapphire', price: 12, body: '#1f4fd0', trim: '#0a267a', pattern: null },
  { id: 'candy', name: 'Candy Stripes', price: 14, body: '#ffffff', trim: '#ff4f8a', pattern: 'stripes' },
  { id: 'bee', name: 'Bumblebee', price: 14, body: '#ffcf1a', trim: '#2a2d33', pattern: 'zigzag' },
  { id: 'cow', name: 'Cow Spots', price: 16, body: '#ffffff', trim: '#1d1d1f', pattern: 'spots' },
  { id: 'leopard', name: 'Leopard Spots', price: 16, body: '#f0b54a', trim: '#5a3a14', pattern: 'spots' },
  { id: 'zigzag', name: 'Zigzag', price: 16, body: '#3fc0e0', trim: '#ffffff', pattern: 'zigzag' },
  { id: 'hearts', name: 'Hearts', price: 18, body: '#ffc4e0', trim: '#e63946', pattern: 'hearts' },
  { id: 'waves', name: 'Ocean Waves', price: 18, body: '#2f7fd0', trim: '#bfeaff', pattern: 'waves' },
  { id: 'lava', name: 'Lava Flames', price: 20, body: '#c4161c', trim: '#ff9a1f', pattern: 'flames' },
  { id: 'goldchecks', name: 'Gold Checkers', price: 22, body: '#1d1d1f', trim: '#f2c43a', pattern: 'checks' },
  { id: 'galaxy', name: 'Galaxy', price: 24, body: '#3a1f6a', trim: '#ff9ad9', pattern: 'stars' },
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
  { id: 'bunny', name: 'Bunny', price: 6, icon: '🐰' },
  { id: 'chick', name: 'Chick', price: 7, icon: '🐥' },
  { id: 'pig', name: 'Pig', price: 9, icon: '🐷' },
  { id: 'fox', name: 'Fox', price: 10, icon: '🦊' },
  { id: 'cow', name: 'Cow', price: 14, icon: '🐮' },
  { id: 'owl', name: 'Owl', price: 18, icon: '🦉' },
  { id: 'koala', name: 'Koala', price: 22, icon: '🐨' },
  { id: 'turtle', name: 'Turtle', price: 24, icon: '🐢' },
  { id: 'tiger', name: 'Tiger', price: 28, icon: '🐯' },
  { id: 'sloth', name: 'Sloth', price: 30, icon: '🦥' },
  { id: 'octopus', name: 'Octopus', price: 36, icon: '🐙' },
  { id: 'elephant', name: 'Elephant', price: 38, icon: '🐘' },
  { id: 'shark', name: 'Shark', price: 44, icon: '🦈' },
  { id: 'ghost', name: 'Ghost', price: 55, icon: '👻' },
  { id: 'wizard', name: 'Wizard', price: 60, icon: '🧙' },
  { id: 'astronaut', name: 'Astronaut', price: 70, icon: '🧑‍🚀' },
  { id: 'dragon', name: 'Dragon', price: 90, icon: '🐉' },
] as const;
export type DriverId = (typeof DRIVERS)[number]['id'];
export type DriverName = (typeof DRIVERS)[number]['name'];
export const driverOf = (id: string) => DRIVERS.find(d => d.id === id) ?? DRIVERS[0];

// ---------- the Town ----------

/**
 * The Town's streets, each with LOTS_PER_STREET lots for buildings and ROAD_SLOTS places on its road for a Road Job's feature. Main
 * Street is free. The last six are districts with their own scenery behind the lots (`scene`, drawn by the Town).
 */
export const LOTS_PER_STREET = 6;
export const ROAD_SLOTS = 3;
export type Scene = 'farm' | 'fair' | 'beach' | 'airport' | 'snow' | 'dino';
export const STREETS = [
  { id: 'main', name: 'Main Street', price: 0, ground: '#9fd06a', sky: '#9fd8f5' },
  { id: 'park', name: 'Park Lane', price: 20, ground: '#7cc45a', sky: '#a9dcf7' },
  { id: 'river', name: 'River Road', price: 35, ground: '#8cc9b0', sky: '#b2e0f5' },
  { id: 'hill', name: 'Hill Street', price: 50, ground: '#b9c46a', sky: '#bfe3f7' },
  { id: 'harbor', name: 'Harbor Way', price: 70, ground: '#d9c58a', sky: '#9fd0f0' },
  { id: 'rocket', name: 'Rocket Row', price: 90, ground: '#c9b2d9', sky: '#3a3f7a' },
  { id: 'farm', name: 'Farm Lane', price: 40, ground: '#a8c94a', sky: '#a9dcf7', scene: 'farm' },
  { id: 'fair', name: 'Fairground', price: 55, ground: '#8fd07a', sky: '#ffd9ec', scene: 'fair' },
  { id: 'beach', name: 'Beach Road', price: 65, ground: '#f2dc9a', sky: '#8fd8f8', scene: 'beach' },
  { id: 'airport', name: 'Airport Way', price: 75, ground: '#b9c2a8', sky: '#bfe0f5', scene: 'airport' },
  { id: 'snow', name: 'Snowy Peak', price: 85, ground: '#f4f8fc', sky: '#cfe2f2', scene: 'snow' },
  { id: 'dino', name: 'Dino Valley', price: 100, ground: '#7aa84a', sky: '#f5c98a', scene: 'dino' },
] as const satisfies readonly { id: string; name: string; price: number; ground: string; sky: string; scene?: Scene }[];
export type StreetId = (typeof STREETS)[number]['id'];
export type StreetName = (typeof STREETS)[number]['name'];

/** Things for the Town's pavement or sky: they stand along the street (or fly over it), and hop and say their name when tapped. */
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
  { id: 'sunflowers', name: 'Sunflowers', price: 5, icon: '🌻' },
  { id: 'birds', name: 'Birds', price: 6, icon: '🐦', sky: true },
  { id: 'cactus', name: 'Cactus', price: 6, icon: '🌵' },
  { id: 'butterflies', name: 'Butterflies', price: 7, icon: '🦋', sky: true },
  { id: 'palms', name: 'Palm Trees', price: 8, icon: '🌴' },
  { id: 'snowman', name: 'Snowman', price: 10, icon: '⛄' },
  { id: 'mushroom', name: 'Giant Mushroom', price: 11, icon: '🍄' },
  { id: 'popcorn', name: 'Popcorn Cart', price: 12, icon: '🍿' },
  { id: 'dog', name: 'Dog', price: 14, icon: '🐕' },
  { id: 'cat', name: 'Cat', price: 14, icon: '🐈' },
  { id: 'duck', name: 'Duck Pond', price: 16, icon: '🦆' },
  { id: 'bubbles', name: 'Bubble Machine', price: 20, icon: '🫧' },
  { id: 'statue', name: 'Big Statue', price: 26, icon: '🗽' },
  { id: 'parachute', name: 'Parachute', price: 30, icon: '🪂', sky: true },
  { id: 'sun', name: 'Smiling Sun', price: 32, icon: '🌞', sky: true },
  { id: 'moon', name: 'Moon', price: 36, icon: '🌙', sky: true },
  { id: 'airplane', name: 'Airplane', price: 46, icon: '✈️', sky: true },
  { id: 'disco', name: 'Disco Ball', price: 48, icon: '🪩', sky: true },
  { id: 'trophy', name: 'Giant Trophy', price: 60, icon: '🏆' },
  { id: 'comet', name: 'Shooting Star', price: 66, icon: '🌠', sky: true },
  { id: 'dinosaur', name: 'Dinosaur Statue', price: 74, icon: '🦕' },
  { id: 'volcano', name: 'Volcano', price: 80, icon: '🌋' },
  { id: 'flyingdragon', name: 'Flying Dragon', price: 92, icon: '🐉', sky: true },
  { id: 'rocket', name: 'Rocket', price: 95, icon: '🚀' },
] as const satisfies readonly { id: string; name: string; price: number; icon: string; sky?: boolean }[];
export type DecoName = (typeof DECOS)[number]['name'];
const OLD_SKY = new Set(['helicopter', 'ufo', 'rainbow', 'fireworks', 'balloons', 'kites']);
export const isSkyDeco = (d: (typeof DECOS)[number]) => OLD_SKY.has(d.id) || ('sky' in d && d.sky === true);

/**
 * Traffic: vehicles that drive up and down the Town's road on their own once bought, each at its own speed. Tapping one honks it and
 * says its name. `faces`: which way the emoji points, so it is turned to face the way it drives.
 */
export const TRAFFIC = [
  { id: 'bike', name: 'Bicycle', price: 6, icon: '🚲', speed: 70, faces: 1 },
  { id: 'skateboard', name: 'Skateboard', price: 8, icon: '🛹', speed: 80, faces: -1 },
  { id: 'scooter', name: 'Scooter', price: 10, icon: '🛵', speed: 110, faces: -1 },
  { id: 'redcar', name: 'Red Car', price: 12, icon: '🚗', speed: 140, faces: -1 },
  { id: 'taxi', name: 'Taxi', price: 14, icon: '🚕', speed: 150, faces: -1 },
  { id: 'bluecar', name: 'Blue Car', price: 16, icon: '🚙', speed: 130, faces: -1 },
  { id: 'motorbike', name: 'Motorbike', price: 18, icon: '🏍️', speed: 190, faces: -1 },
  { id: 'van', name: 'Camper Van', price: 22, icon: '🚐', speed: 100, faces: -1 },
  { id: 'pickup', name: 'Pickup Truck', price: 24, icon: '🛻', speed: 120, faces: -1 },
  { id: 'trolley', name: 'Trolley Bus', price: 28, icon: '🚎', speed: 90, faces: -1 },
  { id: 'delivery', name: 'Delivery Truck', price: 30, icon: '🚚', speed: 110, faces: -1 },
  { id: 'tractor', name: 'Tractor', price: 34, icon: '🚜', speed: 60, faces: -1 },
  { id: 'bigrig', name: 'Big Rig', price: 40, icon: '🚛', speed: 100, faces: -1 },
  { id: 'racecar', name: 'Race Car', price: 50, icon: '🏎️', speed: 260, faces: -1 },
  { id: 'fireengine', name: 'Fire Engine', price: 60, icon: '🚒', speed: 150, faces: -1 },
  { id: 'snail', name: 'Racing Snail', price: 70, icon: '🐌', speed: 30, faces: -1 },
  { id: 'trex', name: 'Running T-Rex', price: 88, icon: '🦖', speed: 170, faces: -1 },
] as const satisfies readonly { id: string; name: string; price: number; icon: string; speed: number; faces: 1 | -1 }[];
export type TrafficName = (typeof TRAFFIC)[number]['name'];

/** His horn: what every machine honks with (📯 in the Town, and when a Job starts). Honk Honk is free; the rest are made in code. */
export const HORNS = [
  { id: 'honk', name: 'Honk Honk', price: 0, icon: '📯' },
  { id: 'beep', name: 'Little Beep', price: 6, icon: '🔔' },
  { id: 'clown', name: 'Clown Horn', price: 10, icon: '🤡' },
  { id: 'duck', name: 'Duck Quack', price: 14, icon: '🦆' },
  { id: 'train', name: 'Train Horn', price: 24, icon: '🚂' },
  { id: 'siren', name: 'Siren', price: 30, icon: '🚨' },
  { id: 'icecream', name: 'Ice Cream Tune', price: 36, icon: '🍦' },
  { id: 'cow', name: 'Cow Moo', price: 40, icon: '🐄' },
  { id: 'robot', name: 'Robot Beeps', price: 46, icon: '🤖' },
  { id: 'trumpet', name: 'Trumpet', price: 55, icon: '🎺' },
  { id: 'dino', name: 'Dino Roar', price: 70, icon: '🦖' },
  { id: 'laser', name: 'Space Laser', price: 85, icon: '🛸' },
] as const satisfies readonly { id: string; name: string; price: number; icon: string }[];
export type HornId = (typeof HORNS)[number]['id'];
export type HornName = (typeof HORNS)[number]['name'];
export const isHornId = (x: unknown): x is HornId => HORNS.some(h => h.id === x);

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
  // wood
  { id: 'farmhouse', name: 'Farmhouse', tier: 1, look: 'house', sign: '', color: '#f4f0e0' },
  { id: 'coop', name: 'Chicken Coop', tier: 1, look: 'barn', sign: '', color: '#e8b04a' },
  { id: 'windmill', name: 'Windmill', tier: 1, look: 'windmill', sign: '', color: '#f2e4c8' },
  { id: 'beachhut', name: 'Beach Hut', tier: 1, look: 'cabin', sign: '', color: '#6fc9e8' },
  { id: 'surfshop', name: 'Surf Shop', tier: 1, look: 'shop', sign: '🏄', color: '#8fe3c0' },
  { id: 'flowershop', name: 'Flower Shop', tier: 1, look: 'shop', sign: '🌻', color: '#ffd0e0' },
  { id: 'igloo', name: 'Igloo', tier: 1, look: 'igloo', sign: '', color: '#f4f8fc' },
  { id: 'hotdogstand', name: 'Hot Dog Stand', tier: 1, look: 'stand', sign: '🌭', color: '#ff9a5a' },
  { id: 'popcornstand', name: 'Popcorn Stand', tier: 1, look: 'stand', sign: '🍿', color: '#ff6f6f' },
  // brick
  { id: 'silo', name: 'Silo', tier: 2, look: 'silo', sign: '', color: '#c4553a' },
  { id: 'bowling', name: 'Bowling Alley', tier: 2, look: 'diner', sign: '🎳', color: '#d9c9f2' },
  { id: 'icerink', name: 'Ice Rink', tier: 2, look: 'dome', sign: '⛸️', color: '#bfeaff' },
  { id: 'barber', name: 'Barber Shop', tier: 2, look: 'shop', sign: '💈', color: '#f4f6f8' },
  { id: 'musicshop', name: 'Music Shop', tier: 2, look: 'shop', sign: '🎸', color: '#f2a65a' },
  { id: 'bank', name: 'Bank', tier: 2, look: 'columns', sign: '💰', color: '#e8dcc0' },
  { id: 'vet', name: 'Vet', tier: 2, look: 'office', sign: '🐾', color: '#c9f2d9' },
  { id: 'gym', name: 'Gym', tier: 2, look: 'station', sign: '🏋️', color: '#8a9fd9' },
  { id: 'donuts', name: 'Donut Shop', tier: 2, look: 'diner', sign: '🍩', color: '#ffc4e0' },
  // concrete
  { id: 'funhouse', name: 'Funhouse', tier: 3, look: 'funhouse', sign: '', color: '#ffd23f' },
  { id: 'bigtop', name: 'Big Top', tier: 3, look: 'bigtop', sign: '', color: '#e63946' },
  { id: 'planetarium', name: 'Planetarium', tier: 3, look: 'dome', sign: '🔭', color: '#3a3f7a' },
  { id: 'zoo', name: 'Zoo', tier: 3, look: 'columns', sign: '🦒', color: '#c9e08a' },
  { id: 'lab', name: 'Science Lab', tier: 3, look: 'office', sign: '🧪', color: '#d9f2f2' },
  { id: 'skijump', name: 'Ski Jump', tier: 3, look: 'skijump', sign: '', color: '#e05a3a' },
  { id: 'greenhouse', name: 'Greenhouse', tier: 3, look: 'dome', sign: '🌱', color: '#bfe8b0' },
  { id: 'boathouse', name: 'Boathouse', tier: 3, look: 'station', sign: '⛵', color: '#8fb3e0' },
  { id: 'cityhall', name: 'City Hall', tier: 3, look: 'columns', sign: '⭐', color: '#f4f0e0' },
  // steel
  { id: 'hangar', name: 'Hangar', tier: 4, look: 'hangar', sign: '✈️', color: '#c9d1d9' },
  { id: 'terminal', name: 'Airport Terminal', tier: 4, look: 'airport', sign: '🧳', color: '#d9e8f2' },
  { id: 'pyramid', name: 'Glass Pyramid', tier: 4, look: 'pyramid', sign: '', color: '#9fe0f5' },
  { id: 'volcanolab', name: 'Volcano Lab', tier: 4, look: 'factory', sign: '🌋', color: '#c98a5a' },
  { id: 'dinodome', name: 'Dino Dome', tier: 4, look: 'dome', sign: '🦕', color: '#9fd06a' },
  { id: 'spacehotel', name: 'Space Hotel', tier: 4, look: 'tower', sign: '🪐', color: '#b2a8f2' },
  { id: 'icepalace', name: 'Ice Palace', tier: 4, look: 'castle', sign: '', color: '#cfefff' },
  { id: 'mall', name: 'Mega Mall', tier: 4, look: 'office', sign: '🛍️', color: '#ffb3d9' },
  { id: 'giantwheel', name: 'Giant Wheel', tier: 4, look: 'wheel', sign: '', color: '#e63946' },
] as const satisfies readonly { id: string; name: string; tier: Tier; look: string; sign: string; color: string }[];
export type BuildingId = (typeof BUILDINGS)[number]['id'];
export type BuildingName = (typeof BUILDINGS)[number]['name'];
export type Look = (typeof BUILDINGS)[number]['look'];
export const building = (id: BuildingId) => BUILDINGS.find(b => b.id === id)!;
export const isBuildingId = (x: unknown): x is BuildingId => BUILDINGS.some(b => b.id === x);

/**
 * What a Road Job builds on the Town's road (free, one per Road Job): things that work when he drives through them, or taps them.
 * `effect` is what happens; `line` is said as it does.
 */
export const FEATURES = [
  { id: 'carwash', name: 'Car Wash', effect: 'wash', line: 'Squeaky clean!' },
  { id: 'ramp', name: 'Jump Ramp', effect: 'jump', line: 'Wheee!' },
  { id: 'bumps', name: 'Speed Bumps', effect: 'bumps', line: 'Bumpy!' },
  { id: 'tunnel', name: 'Tunnel', effect: 'tunnel', line: 'Into the tunnel!' },
  { id: 'mud', name: 'Mud Puddle', effect: 'splash', line: 'Splash!' },
  { id: 'loop', name: 'Loop the Loop', effect: 'loop', line: 'Round and round!' },
  { id: 'bubbles', name: 'Bubble Arch', effect: 'bubbles', line: 'Bubbles!' },
  { id: 'confetti', name: 'Confetti Gate', effect: 'confetti', line: 'Hooray!' },
  { id: 'sprinkler', name: 'Sprinklers', effect: 'spray', line: 'Splash!' },
  { id: 'rainbowarch', name: 'Rainbow Arch', effect: 'sparkle', line: 'Over the rainbow!' },
  { id: 'turbo', name: 'Turbo Pad', effect: 'turbo', line: 'Zoom!' },
  { id: 'fireworkpad', name: 'Firework Pad', effect: 'fireworks', line: 'Ooh, fireworks!' },
] as const;
export type FeatureId = (typeof FEATURES)[number]['id'];
export type FeatureName = (typeof FEATURES)[number]['name'];
export type FeatureLine = (typeof FEATURES)[number]['line'];
export type Effect = (typeof FEATURES)[number]['effect'];
export const feature = (id: FeatureId) => FEATURES.find(f => f.id === id)!;
export const isFeatureId = (x: unknown): x is FeatureId => FEATURES.some(f => f.id === x);

/** Treasures hidden under old buildings: every other Job has one in its bricks. Found, never bought; they sit on his Treasure shelf. */
export const TREASURES = [
  { id: 'coin', name: 'Old Coin', icon: '🪙' },
  { id: 'bone', name: 'Dino Bone', icon: '🦴' },
  { id: 'map', name: 'Treasure Map', icon: '🗺️' },
  { id: 'capsule', name: 'Time Capsule', icon: '⏳' },
  { id: 'crown', name: 'Gold Crown', icon: '👑' },
  { id: 'gem', name: 'Big Gem', icon: '💎' },
  { id: 'key', name: 'Old Key', icon: '🗝️' },
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸' },
  { id: 'medal', name: 'Gold Medal', icon: '🥇' },
  { id: 'compass', name: 'Compass', icon: '🧭' },
  { id: 'shell', name: 'Seashell', icon: '🐚' },
  { id: 'egg', name: 'Dino Egg', icon: '🥚' },
  { id: 'ring', name: 'Shiny Ring', icon: '💍' },
  { id: 'yoyo', name: 'Yo-Yo', icon: '🪀' },
  { id: 'baseball', name: 'Old Baseball', icon: '⚾' },
  { id: 'lamp', name: 'Magic Lamp', icon: '🪔' },
  { id: 'spyglass', name: 'Spyglass', icon: '🔭' },
  { id: 'guitar', name: 'Toy Guitar', icon: '🎸' },
  { id: 'toytrain', name: 'Toy Train', icon: '🚂' },
  { id: 'spacerock', name: 'Space Rock', icon: '☄️' },
  { id: 'trumpet', name: 'Old Trumpet', icon: '🎺' },
  { id: 'camera', name: 'Old Camera', icon: '📷' },
  { id: 'phone', name: 'Old Phone', icon: '☎️' },
  { id: 'radio', name: 'Old Radio', icon: '📻' },
  { id: 'piggy', name: 'Piggy Bank', icon: '🐷' },
  { id: 'dice', name: 'Lucky Dice', icon: '🎲' },
  { id: 'boot', name: 'Cowboy Boot', icon: '👢' },
  { id: 'tophat', name: 'Top Hat', icon: '🎩' },
  { id: 'crystal', name: 'Crystal Ball', icon: '🔮' },
  { id: 'toyrobot', name: 'Toy Robot', icon: '🤖' },
] as const;
export type TreasureId = (typeof TREASURES)[number]['id'];
export type TreasureName = (typeof TREASURES)[number]['name'];
export const treasure = (id: TreasureId) => TREASURES.find(t => t.id === id)!;
export const isTreasureId = (x: unknown): x is TreasureId => TREASURES.some(t => t.id === x);

/** What the old building is, said as a Job starts: one list per material, and the Job's shape number picks from it. */
export const OLD_LINES = {
  1: ['An old wooden shed!', 'An old wooden barn!', 'An old wooden fort!', 'An old wooden garage!', 'An old wooden tower!', 'An old wooden boathouse!'],
  2: ['An old brick building!', 'An old brick school!', 'An old brick factory!', 'An old brick wall!', 'An old brick castle!', 'An old brick chimney!'],
  3: ['An old concrete building!', 'An old concrete car park!', 'An old concrete bunker!', 'An old concrete dam!', 'An old concrete office!', 'An old concrete tower!'],
  4: ['An old steel tower!', 'An old steel warehouse!', 'An old steel bridge!', 'An old steel factory!', 'An old steel tank!', 'An old steel skyscraper!'],
} as const satisfies Record<Tier, readonly string[]>;
export type OldLine = (typeof OLD_LINES)[Tier][number];

// ---------- one key for anything he can own ----------

export type Tab = 'machine' | 'up' | 'paint' | 'driver' | 'street' | 'deco' | 'traffic' | 'horn';
export type ItemKey = `${Tab}:${string}`;
export type ItemName = MachineName | UpgradeName | PaintName | DriverName | StreetName | DecoName | TrafficName | HornName;
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
  ...TRAFFIC.map(t => ({ key: `traffic:${t.id}` as ItemKey, tab: 'traffic' as Tab, id: t.id as string, name: t.name, price: t.price })),
  ...HORNS.map(h => ({ key: `horn:${h.id}` as ItemKey, tab: 'horn' as Tab, id: h.id as string, name: h.name, price: h.price })),
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
export const FEATURE_NAMES = FEATURES.map(f => f.name);
export const TREASURE_NAMES = TREASURES.map(t => t.name);
/** The line said when a machine that opens something is bought or tried. */
export type OpensLine = Extract<(typeof MACHINES)[number], { opens: string }>['opens'];
export const opensOf = (k: ItemKey): OpensLine | undefined => { const m = tabOf(k) === 'machine' ? MACHINES.find(x => x.id === idOf(k)) : undefined; return m && 'opens' in m ? m.opens : undefined; };
