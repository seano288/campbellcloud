// Everything at the Rocket Base he can buy: buildings, rockets, rocket parts, paints, decals, flame colours and payloads. Prices up to 100
// can be any number; above 100 they are whole tens up to 400, because the voice has a clip for each of those (phrases.ts, PRICE_TENS).
// A dear thing always changes what he can do (a taller tower stands a taller rocket, an engine lifts heavier payloads, a dish keeps the
// orbit going longer, floodlights open night Launches, a pad holds another rocket); a paint is never the dearest thing.
//
// Parts matter, and the Launch and the orbit read them (base.ts): engines and boosters set how much a rocket lifts, and a payload too
// heavy for it waits for a bigger rocket; the tower sets which rockets can stand on the pad; tracking dishes and the radio relay make the
// orbit last longer; the Weather Mast calms the clouds; the Control Room draws the path; floodlights open night Launches; the GPS
// satellite points to the next place in orbit; the landing pad and the runway bring the flyback booster and the spaceplane home.

export const CATEGORIES = ['building', 'rocket', 'part', 'paint', 'decal', 'flame', 'payload'] as const;
export type Category = (typeof CATEGORIES)[number];

interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly needs?: string }

// ---------- buildings ----------

/** What a building changes. Most are the base's life (they appear on it); some change how the Launch or the orbit plays. */
export type Does = 'tower' | 'dish' | 'calm' | 'guide' | 'wide' | 'night' | 'pad' | 'landing' | 'runway' | 'factory' | 'replay' | 'look';
export interface BuildingItem extends Base { readonly cat: 'building'; readonly does: Does; readonly spot: number }
const b = <const N extends string>(id: string, name: N, price: number, icon: string, does: Does, spot: number, needs?: string) =>
  ({ cat: 'building', id: `b:${id}`, name, price, icon, does, spot, ...(needs && { needs: `b:${needs}` }) }) as BuildingItem & { readonly name: N };

/** He starts with a concrete pad, a small gantry (tower level 1) and a hut. `spot` is where it stands on the base drawing. */
export const BUILDINGS = [
  b('tower1', 'Launch Tower', 14, '🗼', 'tower', 1),
  b('tower2', 'Tall Tower', 45, '🗼', 'tower', 1, 'tower1'),
  b('tower3', 'Giant Tower', 120, '🗼', 'tower', 1, 'tower2'),
  b('arm', 'Tower Arm', 18, '🦾', 'look', 2, 'tower1'),
  b('vab', 'Assembly Building', 35, '🏭', 'look', 3),
  b('crawler', 'Crawler', 28, '🚜', 'look', 4, 'vab'),
  b('fuel1', 'Fuel Tank', 10, '🛢️', 'look', 5),
  b('fuel2', 'Big Fuel Tank', 22, '🛢️', 'look', 6, 'fuel1'),
  b('oxygen', 'Oxygen Tank', 16, '🫧', 'look', 7, 'fuel1'),
  b('control', 'Control Room', 30, '🖥️', 'guide', 8),
  b('mission', 'Mission Control', 90, '🎛️', 'wide', 9, 'control'),
  b('dish1', 'Tracking Dish', 20, '📡', 'dish', 10),
  b('dish2', 'Big Dish', 55, '📡', 'dish', 11, 'dish1'),
  b('dish3', 'Giant Dish', 130, '📡', 'dish', 12, 'dish2'),
  b('weather', 'Weather Mast', 25, '🌦️', 'calm', 13),
  b('water', 'Water Tower', 15, '💧', 'look', 14),
  b('landing', 'Landing Pad', 70, '🎯', 'landing', 15),
  b('ship', 'Recovery Ship', 80, '🚢', 'look', 16),
  b('bus', 'Astronaut Bus', 24, '🚌', 'look', 17),
  b('stand', 'Visitor Stand', 18, '🏟️', 'look', 18),
  b('grandstand', 'Big Grandstand', 40, '🏟️', 'look', 19, 'stand'),
  b('flags', 'Flagpoles', 8, '🚩', 'look', 20),
  b('lights', 'Floodlights', 45, '💡', 'night', 21),
  b('pad2', 'Second Pad', 100, '🅿️', 'pad', 22),
  b('pad3', 'Third Pad', 130, '🅿️', 'pad', 23, 'pad2'),
  b('runway', 'Runway', 110, '🛬', 'runway', 24),
  b('hangar', 'Hangar', 40, '🏠', 'look', 25),
  b('factory', 'Module Factory', 60, '🏗️', 'factory', 26),
  b('cleanroom', 'Clean Room', 30, '🧼', 'look', 27),
  b('camera', 'Camera Tower', 20, '🎥', 'replay', 28),
  b('clock', 'Countdown Clock', 12, '⏱️', 'look', 29),
  b('press', 'Press Site', 16, '📰', 'look', 30),
  b('cafe', 'Cafeteria', 14, '🍔', 'look', 31),
  b('school', 'Astronaut School', 50, '🏫', 'look', 32),
  b('museum', 'Rocket Museum', 65, '🏛️', 'look', 33),
  b('garden', 'Rocket Garden', 35, '🌳', 'look', 34),
  b('giftshop', 'Gift Shop', 20, '🎁', 'look', 35),
  b('helipad', 'Helipad', 30, '🚁', 'look', 36),
  b('fire', 'Fire Station', 26, '🚒', 'look', 37),
  b('radar', 'Radar', 40, '📶', 'look', 38),
  b('rods', 'Lightning Towers', 22, '⚡', 'look', 39),
  b('beacon', 'Beacon Light', 10, '🚨', 'look', 40),
  b('windsock', 'Windsock', 6, '🎏', 'look', 41),
  b('fence', 'Fence', 5, '🚧', 'look', 42),
  b('road', 'Road', 7, '🛣️', 'look', 43),
  b('parking', 'Car Park', 12, '🚗', 'look', 44),
  b('train', 'Rocket Train', 75, '🚂', 'look', 45),
  b('observatory', 'Observatory', 85, '🔭', 'look', 46),
  b('pool', 'Training Pool', 55, '🏊', 'look', 47),
  b('spinner', 'Spin Trainer', 70, '🌀', 'look', 48),
  b('solar', 'Solar Farm', 45, '☀️', 'look', 49),
  b('teststand', 'Engine Test Stand', 60, '🔥', 'look', 50),
  b('gate', 'Front Gate', 9, '⛩️', 'look', 51),
  b('sign', 'Big Sign', 11, '🪧', 'look', 52),
] as const;

// ---------- rockets ----------

export const KINDS = ['sounding', 'launcher', 'crew', 'heavy', 'spaceplane', 'flyback'] as const;
export type RocketKind = (typeof KINDS)[number];
export interface KindSpec {
  readonly name: string;
  /** Tower level the pad needs to stand it (he starts at 1). */
  readonly tower: number;
  /** Lift it has before its engines and boosters. */
  readonly lift: number;
  /** It has an upper stage (a sounding rocket has none). */
  readonly upper: boolean;
  /** How it is drawn: width, the main stage's height and the upper stage's, in drawing units. */
  readonly w: number; readonly mainH: number; readonly upperH: number;
  /** A building it needs to come home to. */
  readonly home?: string;
}
export const ROCKET_KINDS: Record<RocketKind, KindSpec> = {
  sounding: { name: 'Sounding Rocket', tower: 1, lift: 1, upper: false, w: 22, mainH: 90, upperH: 0 },
  launcher: { name: 'Satellite Launcher', tower: 2, lift: 2, upper: true, w: 28, mainH: 100, upperH: 46 },
  crew: { name: 'Crew Rocket', tower: 3, lift: 3, upper: true, w: 32, mainH: 112, upperH: 52 },
  heavy: { name: 'Heavy Lifter', tower: 3, lift: 5, upper: true, w: 34, mainH: 118, upperH: 54 },
  spaceplane: { name: 'Spaceplane', tower: 2, lift: 3, upper: true, w: 30, mainH: 104, upperH: 40, home: 'b:runway' },
  flyback: { name: 'Flyback Booster', tower: 4, lift: 4, upper: true, w: 30, mainH: 130, upperH: 50, home: 'b:landing' },
};
export interface RocketItem extends Base { readonly cat: 'rocket'; readonly kind: RocketKind }
const ROCKET_PRICES: Record<RocketKind, number> = { sounding: 0, launcher: 60, crew: 130, heavy: 240, spaceplane: 300, flyback: 350 };
const ROCKET_ICONS: Record<RocketKind, string> = { sounding: '🚀', launcher: '🛰️', crew: '👩‍🚀', heavy: '🏋️', spaceplane: '🛩️', flyback: '↩️' };
export const ROCKETS: readonly RocketItem[] = KINDS.map((k): RocketItem => ({
  cat: 'rocket', kind: k, id: `r:${k}`, name: ROCKET_KINDS[k].name, price: ROCKET_PRICES[k], icon: ROCKET_ICONS[k], ...(ROCKET_KINDS[k].home && { needs: ROCKET_KINDS[k].home }),
}));
export const ROCKET_NAMES = ['Sounding Rocket', 'Satellite Launcher', 'Crew Rocket', 'Heavy Lifter', 'Spaceplane', 'Flyback Booster'] as const;
export type RocketName = (typeof ROCKET_NAMES)[number];

// ---------- rocket parts, chosen slot by slot ----------

export const SLOTS = ['nose', 'capsule', 'upper', 'main', 'boosters', 'engines', 'fins'] as const;
export type Slot = (typeof SLOTS)[number];
export interface PartItem extends Base { readonly cat: 'part'; readonly slot: Slot; readonly lift: number; readonly look: number }
const part = <const N extends string>(slot: Slot, id: string, name: N, price: number, icon: string, look: number, lift = 0) =>
  ({ cat: 'part', id: `p:${slot}:${id}`, name, price, icon, slot, lift, look }) as PartItem & { readonly name: N };

export const PARTS = [
  part('nose', 'round', 'Round Nose', 0, '🔺', 0), part('nose', 'pointy', 'Pointy Nose', 5, '🔺', 1), part('nose', 'needle', 'Needle Nose', 9, '📍', 2),
  part('nose', 'bullet', 'Bullet Nose', 13, '🔻', 3), part('nose', 'bubble', 'Bubble Nose', 17, '🫧', 4), part('nose', 'fairing', 'Big Fairing', 24, '🥚', 5),
  part('nose', 'star', 'Star Tip', 30, '⭐', 6), part('nose', 'antenna', 'Antenna Nose', 36, '📡', 7), part('nose', 'gold', 'Gold Nose', 45, '🏅', 8),

  part('capsule', 'none', 'No Capsule', 0, '⬜', 0), part('capsule', 'little', 'Little Capsule', 8, '🔔', 1), part('capsule', 'window', 'Window Capsule', 14, '🪟', 2),
  part('capsule', 'crew', 'Crew Capsule', 22, '👩‍🚀', 3), part('capsule', 'big', 'Big Capsule', 32, '🛎️', 4), part('capsule', 'escape', 'Escape Tower', 40, '🗼', 5),
  part('capsule', 'dome', 'Dome Capsule', 48, '🔮', 6), part('capsule', 'gold', 'Gold Capsule', 60, '🏆', 7),

  part('upper', 'short', 'Short Upper Stage', 0, '▫️', 0), part('upper', 'long', 'Long Upper Stage', 10, '▫️', 1), part('upper', 'striped', 'Striped Upper Stage', 16, '🦓', 2),
  part('upper', 'ringed', 'Ringed Upper Stage', 22, '⭕', 3), part('upper', 'tall', 'Tall Upper Stage', 30, '📏', 4), part('upper', 'tank', 'Tank Upper Stage', 38, '🛢️', 5),
  part('upper', 'chrome', 'Chrome Upper Stage', 50, '🪞', 6), part('upper', 'super', 'Super Upper Stage', 64, '💪', 7),

  part('main', 'plain', 'Plain Main Stage', 0, '⬜', 0), part('main', 'long', 'Long Main Stage', 12, '📏', 1), part('main', 'banded', 'Banded Main Stage', 18, '🎗️', 2),
  part('main', 'checker', 'Checkered Main Stage', 26, '🏁', 3), part('main', 'wide', 'Wide Main Stage', 34, '⬛', 4), part('main', 'ribbed', 'Ribbed Main Stage', 42, '🦴', 5),
  part('main', 'chrome', 'Chrome Main Stage', 55, '🪞', 6), part('main', 'super', 'Super Main Stage', 70, '💪', 7),

  part('boosters', 'none', 'No Boosters', 0, '⬜', 0, 0), part('boosters', 'two-little', 'Two Little Boosters', 20, '🧨', 1, 1), part('boosters', 'two', 'Two Boosters', 40, '🧨', 2, 2),
  part('boosters', 'four-little', 'Four Little Boosters', 60, '🧨', 3, 2), part('boosters', 'two-big', 'Two Big Boosters', 85, '🧨', 4, 3),
  part('boosters', 'four', 'Four Boosters', 110, '🧨', 5, 4), part('boosters', 'four-big', 'Four Big Boosters', 130, '🧨', 6, 5), part('boosters', 'super', 'Super Boosters', 180, '🧨', 7, 6),

  part('engines', 'puff', 'Puff Engine', 0, '💨', 0, 1), part('engines', 'twin', 'Twin Engine', 15, '🔥', 1, 2), part('engines', 'triple', 'Triple Engine', 30, '🔥', 2, 3),
  part('engines', 'bell', 'Big Bell Engine', 50, '🔔', 3, 4), part('engines', 'five', 'Five Engines', 75, '🔥', 4, 5), part('engines', 'nine', 'Nine Engines', 100, '🔥', 5, 6),
  part('engines', 'blue', 'Blue Flame Engine', 120, '💙', 6, 7), part('engines', 'super', 'Super Engine', 130, '💥', 7, 8),
  part('engines', 'mega', 'Mega Engine', 200, '💥', 8, 9), part('engines', 'hyper', 'Hyper Engine', 260, '☄️', 9, 10),

  part('fins', 'none', 'No Fins', 0, '⬜', 0), part('fins', 'little', 'Little Fins', 4, '🔻', 1), part('fins', 'swept', 'Swept Fins', 8, '🔻', 2),
  part('fins', 'big', 'Big Fins', 12, '🔻', 3), part('fins', 'delta', 'Delta Fins', 16, '🔺', 4), part('fins', 'grid', 'Grid Fins', 24, '#️⃣', 5),
  part('fins', 'shark', 'Shark Fins', 30, '🦈', 6), part('fins', 'star', 'Star Fins', 36, '⭐', 7), part('fins', 'gold', 'Gold Fins', 44, '🏅', 8),
] as const;

// ---------- looks: paint, decal, flame ----------

export interface PaintItem extends Base { readonly cat: 'paint'; readonly hex: string; readonly stripe: string }
const paint = <const N extends string>(id: string, name: N, price: number, hex: string, stripe: string) => ({ cat: 'paint', id: `paint:${id}`, name, price, icon: '🎨', hex, stripe }) as PaintItem & { readonly name: N };
export const PAINTS = [
  paint('white', 'Launch White', 0, '#f6f8fb', '#1f2a44'),
  paint('red', 'Rocket Red', 3, '#e63946', '#ffffff'), paint('blue', 'Sky Blue', 3, '#3d93dc', '#ffffff'), paint('black', 'Space Black', 4, '#1b1e24', '#ffd23f'),
  paint('orange', 'Safety Orange', 4, '#ff7a00', '#1b1e24'), paint('yellow', 'Sun Yellow', 5, '#ffd23f', '#1b1e24'), paint('green', 'Go Green', 5, '#2fa84f', '#ffffff'),
  paint('navy', 'Navy', 6, '#1f3a68', '#ffd23f'), paint('silver', 'Silver', 6, '#c9d1da', '#e63946'), paint('purple', 'Purple', 7, '#7b4bd1', '#ffffff'),
  paint('teal', 'Ocean Teal', 7, '#14a3a3', '#ffffff'), paint('pink', 'Pink', 8, '#ff7aa8', '#ffffff'), paint('lime', 'Lime', 8, '#9be22d', '#1b1e24'),
  paint('sand', 'Desert Sand', 9, '#e2c38a', '#7a4a12'), paint('ice', 'Ice Blue', 9, '#bfe6ff', '#1f3a68'), paint('cherry', 'Cherry', 10, '#b5172b', '#ffffff'),
  paint('forest', 'Forest', 10, '#1f6b3a', '#ffd23f'), paint('gold', 'Gold', 12, '#e0b13a', '#1b1e24'), paint('copper', 'Copper', 12, '#c46a2f', '#ffffff'),
  paint('mint', 'Mint', 13, '#8ee6c4', '#1f3a68'), paint('lava', 'Lava', 14, '#ff4d1a', '#1b1e24'), paint('grape', 'Grape', 14, '#5b2a86', '#ffd23f'),
  paint('lemon', 'Lemon', 15, '#fff35c', '#e63946'), paint('storm', 'Storm Grey', 16, '#4a5563', '#ffffff'), paint('bubble', 'Bubblegum', 17, '#ff9ad5', '#7b4bd1'),
  paint('midnight', 'Midnight', 18, '#101a3a', '#5fd3f3'), paint('aqua', 'Aqua', 20, '#2fd6e8', '#1f3a68'), paint('coral', 'Coral', 22, '#ff8c5a', '#ffffff'),
  paint('chrome', 'Chrome', 26, '#e8edf2', '#7d8894'), paint('rainbow', 'Rainbow', 30, 'rainbow', '#ffffff'),
] as const;

export interface DecalItem extends Base { readonly cat: 'decal'; readonly glyph: string }
const decal = <const N extends string>(id: string, name: N, price: number, glyph: string) => ({ cat: 'decal', id: `decal:${id}`, name, price, icon: glyph || '⬜', glyph }) as DecalItem & { readonly name: N };
export const DECALS = [
  decal('none', 'No Decal', 0, ''),
  decal('star', 'Star Decal', 3, '⭐'), decal('globe', 'Globe Decal', 3, '🌍'), decal('bolt', 'Lightning Decal', 4, '⚡'), decal('heart', 'Heart Decal', 4, '❤️'),
  decal('rocket', 'Rocket Decal', 5, '🚀'), decal('comet', 'Comet Decal', 5, '☄️'), decal('sun', 'Sun Decal', 6, '☀️'), decal('snow', 'Snowflake Decal', 6, '❄️'),
  decal('fire', 'Flame Decal', 7, '🔥'), decal('wave', 'Wave Decal', 7, '🌊'), decal('rainbow', 'Rainbow Decal', 8, '🌈'), decal('eagle', 'Eagle Decal', 8, '🦅'),
  decal('lion', 'Lion Decal', 9, '🦁'), decal('dragon', 'Dragon Decal', 10, '🐉'), decal('shark', 'Shark Decal', 10, '🦈'), decal('owl', 'Owl Decal', 11, '🦉'),
  decal('satellite', 'Satellite Decal', 12, '🛰️'), decal('flag', 'Checkered Flag Decal', 12, '🏁'), decal('crown', 'Crown Decal', 14, '👑'),
  decal('diamond', 'Diamond Decal', 15, '💎'), decal('clover', 'Clover Decal', 16, '🍀'), decal('robot', 'Robot Decal', 18, '🤖'), decal('unicorn', 'Unicorn Decal', 20, '🦄'),
] as const;

export interface FlameItem extends Base { readonly cat: 'flame'; readonly hex: string; readonly core: string }
const flame = <const N extends string>(id: string, name: N, price: number, hex: string, core: string) => ({ cat: 'flame', id: `flame:${id}`, name, price, icon: '🔥', hex, core }) as FlameItem & { readonly name: N };
export const FLAMES = [
  flame('orange', 'Orange Flame', 0, '#ff7a00', '#ffe08a'), flame('yellow', 'Yellow Flame', 6, '#ffd23f', '#fffbe0'), flame('red', 'Red Flame', 8, '#e63946', '#ffb3a8'),
  flame('blue', 'Blue Flame', 10, '#2f8fe8', '#d6f1ff'), flame('green', 'Green Flame', 12, '#2fa84f', '#d4ffd8'), flame('purple', 'Purple Flame', 14, '#7b4bd1', '#ead9ff'),
  flame('pink', 'Pink Flame', 16, '#ff7aa8', '#ffe0ee'), flame('white', 'White Flame', 18, '#e8f4ff', '#ffffff'), flame('gold', 'Gold Flame', 22, '#e0b13a', '#fff2b8'),
  flame('rainbow', 'Rainbow Flame', 28, 'rainbow', '#ffffff'),
] as const;

// ---------- payloads ----------

/** A payload is bought, waits in the hangar and flies on a Launch that can lift it. Modules join his Station; satellites circle the Earth. */
export type PayloadKind = 'module' | 'satellite' | 'camera';
export type PayloadDoes = 'core' | 'gps' | 'relay' | 'weather' | 'none';
export interface PayloadItem extends Base { readonly cat: 'payload'; readonly kind: PayloadKind; readonly mass: number; readonly does: PayloadDoes; readonly hex: string }
const pay = <const N extends string>(kind: PayloadKind, id: string, name: N, price: number, icon: string, mass: number, hex: string, does: PayloadDoes = 'none', needs?: string) =>
  ({ cat: 'payload', id: `pl:${id}`, name, price, icon, kind, mass, hex, does, ...(needs && { needs: `pl:${needs}` }) }) as PayloadItem & { readonly name: N };
export const PAYLOADS = [
  pay('module', 'core', 'Station Core', 30, '🛰️', 3, '#f6f8fb', 'core'),
  pay('module', 'solar', 'Solar Panels', 20, '🔋', 2, '#2f6fc0', 'none', 'core'),
  pay('module', 'lab', 'Science Lab', 45, '🔬', 4, '#f6f8fb', 'none', 'core'),
  pay('module', 'dome', 'Dome Window', 35, '🪟', 2, '#bfe6ff', 'none', 'core'),
  pay('module', 'arm', 'Docking Arm', 50, '🦾', 3, '#c9d1da', 'none', 'core'),
  pay('module', 'greenhouse', 'Greenhouse', 60, '🌱', 4, '#8ee6c4', 'none', 'core'),
  pay('module', 'sleep', 'Sleeping Pods', 40, '🛏️', 3, '#ffd23f', 'none', 'core'),
  pay('module', 'kitchen', 'Kitchen Module', 38, '🍽️', 3, '#ff8c5a', 'none', 'core'),
  pay('module', 'wings', 'Big Solar Wings', 70, '🔋', 5, '#1f3a68', 'none', 'solar'),
  pay('module', 'airlock', 'Airlock', 42, '🚪', 3, '#c9d1da', 'none', 'core'),
  pay('module', 'storage', 'Storage Module', 48, '📦', 4, '#e2c38a', 'none', 'core'),
  pay('module', 'robot', 'Robot Helper', 55, '🤖', 2, '#ff7a00', 'none', 'arm'),
  pay('module', 'gym', 'Gym Module', 52, '🏋️', 4, '#e63946', 'none', 'core'),
  pay('module', 'radiator', 'Big Radiator', 46, '❄️', 3, '#f6f8fb', 'none', 'core'),
  pay('satellite', 'weather', 'Weather Satellite', 18, '🌦️', 2, '#ffd23f', 'weather'),
  pay('satellite', 'storm', 'Storm Watcher', 34, '⛈️', 3, '#4a5563'),
  pay('satellite', 'ice', 'Ice Watcher', 40, '🧊', 3, '#bfe6ff'),
  pay('satellite', 'oceanwatch', 'Ocean Watcher', 44, '🌊', 3, '#14a3a3'),
  pay('satellite', 'telescope', 'Space Telescope', 90, '🔭', 6, '#c9d1da'),
  pay('satellite', 'bigscope', 'Big Telescope', 130, '🔭', 9, '#e0b13a', 'none', 'telescope'),
  pay('satellite', 'gps', 'GPS Satellite', 50, '🧭', 3, '#2fa84f', 'gps'),
  pay('satellite', 'relay', 'Radio Relay', 60, '📻', 4, '#7b4bd1', 'relay'),
  pay('satellite', 'tv', 'TV Satellite', 28, '📺', 3, '#e63946'),
  pay('camera', 'cam-africa', 'Africa Camera', 25, '📷', 2, '#f59b2e'),
  pay('camera', 'cam-europe', 'Europe Camera', 30, '📷', 2, '#ef5a7a'),
  pay('camera', 'cam-asia', 'Asia Camera', 35, '📷', 3, '#f5cf3b'),
  pay('camera', 'cam-namerica', 'North America Camera', 40, '📷', 3, '#5cbf4a'),
  pay('camera', 'cam-samerica', 'South America Camera', 45, '📷', 3, '#a66bd9'),
  pay('camera', 'cam-australia', 'Australia Camera', 50, '📷', 3, '#e0533c'),
  pay('camera', 'cam-antarctica', 'Antarctica Camera', 60, '📷', 4, '#5d7790'),
] as const;
/** What flies when no bought payload is waiting: supplies for the Station, or a test payload before there is one. Never runs out. */
export const SUPPLIES = { id: 'pl:supplies', name: 'Supply Capsule', mass: 1, icon: '📦' } as const;
export const TEST_PAYLOAD = { id: 'pl:test', name: 'Test Payload', mass: 1, icon: '🧪' } as const;

// ---------- all of it ----------

export type Item = BuildingItem | RocketItem | PartItem | PaintItem | DecalItem | FlameItem | PayloadItem;
export const ITEMS: readonly Item[] = [...BUILDINGS, ...ROCKETS, ...PARTS, ...PAINTS, ...DECALS, ...FLAMES, ...PAYLOADS];
const byId = new Map(ITEMS.map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const itemOf = (id: string): Item => { const i = byId.get(id); if (!i) throw new Error(`no item ${id}`); return i; };
/** What he starts with: the sounding rocket, the starting part in every slot, white paint, no decal, an orange flame. */
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export type ItemName = (typeof BUILDINGS)[number]['name'] | (typeof PARTS)[number]['name'] | (typeof PAINTS)[number]['name'] | (typeof DECALS)[number]['name']
  | (typeof FLAMES)[number]['name'] | (typeof PAYLOADS)[number]['name'] | RocketName;
export const ITEM_NAMES = ITEMS.map(i => i.name) as ItemName[];
export const partsFor = (slot: Slot) => PARTS.filter(p => p.slot === slot);
export const starterPart = (slot: Slot) => partsFor(slot).find(p => p.price === 0)!;

// ---------- things to buy again and again ----------

/** Each opens once its fixed one is built; its price rises a little each time and then stays flat. Pads stop at a base that still draws
 *  well; hangars, dishes and new Station modules never stop (a new module is one he designs, station.ts). */
export const REPEATS = [
  { id: 'pad', name: 'Another Pad', icon: '🅿️', needs: 'b:pad3', base: 120, step: 10, flat: 200, most: 6 },
  { id: 'hangar', name: 'Another Hangar', icon: '🏠', needs: 'b:hangar', base: 45, step: 5, flat: 90, most: Infinity },
  { id: 'dish', name: 'Another Dish', icon: '📡', needs: 'b:dish3', base: 60, step: 5, flat: 100, most: Infinity },
  { id: 'module', name: 'New Station Module', icon: '🧩', needs: 'b:factory', base: 40, step: 4, flat: 80, most: Infinity },
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
