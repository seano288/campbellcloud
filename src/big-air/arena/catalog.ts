// Everything he can buy at the Arena: truck bodies, truck parts slot by slot, ramp pieces, Rows to jump over, paint (a colour, a pattern, a
// decal and a trim, each chosen apart), arena pieces, drivers and horns. Prices up to 100 can be any number; above 100 they are whole tens
// up to 400, because the voice has a clip for each (phrases.ts, PRICE_TENS). A dear thing always changes how the Jump plays (a bigger
// engine is faster, better tires build speed sooner, springs and a landing ramp make a clean landing easier, a booster pushes in the air,
// a longer run-up or a steeper kicker throws him farther, floodlights open night Jumps); a paint is never the dearest thing.

interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly needs?: string }

// ---------- truck bodies ----------

/** A body is the truck's shape and how fast it tilts in the air. `look` picks the drawing (art/truck.ts). */
export interface BodyItem extends Base { readonly cat: 'body'; readonly tilt: number; readonly look: number; readonly long: number; readonly tall: number }
const body = <const N extends string>(id: string, name: N, price: number, tilt: number, look: number, long: number, tall: number) =>
  ({ cat: 'body', id: `body:${id}`, name, price, icon: '🛻', tilt, look, long, tall }) as BodyItem & { readonly name: N };
export const BODIES = [
  body('mud', 'Mud Truck', 0, 60, 0, 1, 1),
  body('pickup', 'Pickup Body', 20, 64, 1, 1.05, 1),
  body('buggy', 'Dune Buggy', 30, 74, 2, .9, .9),
  body('jeep', 'Jeep Body', 40, 66, 3, 1, 1.05),
  body('racer', 'Racer Body', 55, 78, 4, 1.1, .85),
  body('van', 'Van Body', 65, 60, 5, 1.1, 1.15),
  body('stock', 'Stock Car Body', 75, 82, 6, 1.1, .85),
  body('police', 'Police Truck', 85, 70, 7, 1.05, 1),
  body('fire', 'Fire Truck Body', 95, 66, 8, 1.15, 1.1),
  body('shark', 'Shark Truck', 110, 84, 9, 1.1, 1),
  body('dino', 'Dino Truck', 120, 80, 10, 1.1, 1.1),
  body('rocket', 'Rocket Truck', 130, 90, 11, 1.15, .9),
  body('robot', 'Robot Truck', 140, 88, 12, 1.05, 1.1),
  body('dragon', 'Dragon Truck', 180, 96, 13, 1.15, 1.05),
  body('gold', 'Golden Truck', 280, 104, 14, 1.1, 1),
  body('titan', 'Titan Truck', 360, 112, 15, 1.2, 1.15),
] as const;

// ---------- parts, slot by slot ----------

/** The slots that change the Jump (engine: top speed; tires: how soon speed builds; springs: the clean-landing window; booster: a push in
 *  the air) and the ones that are the truck's look (exhaust, roof lights, flag). */
export const SLOTS = ['engine', 'tires', 'springs', 'booster', 'exhaust', 'lights', 'flag'] as const;
export type Slot = (typeof SLOTS)[number];
export interface PartItem extends Base { readonly cat: 'part'; readonly slot: Slot; readonly power: number; readonly look: number }
const part = <const N extends string>(slot: Slot, id: string, name: N, price: number, icon: string, power: number, look: number) =>
  ({ cat: 'part', id: `part:${slot}:${id}`, name, price, icon, slot, power, look }) as PartItem & { readonly name: N };
export const PARTS = [
  // engine: top speed, ft/s
  part('engine', 'stock', 'Stock Engine', 0, '⚙️', 40, 0), part('engine', 'v6', 'V6 Engine', 15, '⚙️', 45, 1), part('engine', 'v8', 'V8 Engine', 30, '⚙️', 50, 2),
  part('engine', 'big', 'Big Block Engine', 45, '⚙️', 55, 3), part('engine', 'turbo', 'Turbo Engine', 65, '🌀', 60, 4), part('engine', 'twin', 'Twin Turbo Engine', 85, '🌀', 65, 5),
  part('engine', 'blower', 'Blower Engine', 100, '💨', 70, 6), part('engine', 'nitro', 'Nitro Engine', 130, '🔥', 75, 7), part('engine', 'jet', 'Jet Engine', 200, '✈️', 81, 8),
  part('engine', 'mega', 'Mega Engine', 300, '💥', 88, 9),
  // tires: how fast speed builds, ft/s²
  part('tires', 'street', 'Street Tires', 0, '⚫', 12, 0), part('tires', 'mud', 'Mud Tires', 10, '⚫', 14, 1), part('tires', 'knobby', 'Knobby Tires', 20, '⚫', 16, 2),
  part('tires', 'paddle', 'Paddle Tires', 32, '⚫', 18, 3), part('tires', 'big', 'Big Tires', 45, '⚫', 20, 4), part('tires', 'giant', 'Giant Tires', 60, '⚫', 22, 5),
  part('tires', 'spike', 'Spike Tires', 75, '⚫', 24, 6), part('tires', 'chrome', 'Chrome Tires', 90, '⚪', 26, 7), part('tires', 'flame', 'Flame Tires', 110, '🔥', 28, 8),
  part('tires', 'monster', 'Monster Tires', 140, '⚫', 31, 9),
  // springs: degrees of a clean landing
  part('springs', 'stiff', 'Stiff Springs', 0, '🌀', 10, 0), part('springs', 'soft', 'Soft Springs', 12, '🌀', 13, 1), part('springs', 'coil', 'Coil Springs', 24, '🌀', 16, 2),
  part('springs', 'big', 'Big Springs', 38, '🌀', 19, 3), part('springs', 'shocks', 'Shocks', 55, '🌀', 22, 4), part('springs', 'air', 'Air Shocks', 75, '🌀', 25, 5),
  part('springs', 'bouncy', 'Bouncy Shocks', 95, '🌀', 28, 6), part('springs', 'super', 'Super Shocks', 120, '🌀', 32, 7),
  // booster: one push in the air, ft/s
  part('booster', 'none', 'No Booster', 0, '⬜', 0, 0), part('booster', 'puff', 'Puff Booster', 25, '🧯', 6, 1), part('booster', 'small', 'Small Booster', 40, '🧯', 9, 2),
  part('booster', 'twin', 'Twin Booster', 60, '🧯', 12, 3), part('booster', 'big', 'Big Booster', 80, '🚀', 15, 4), part('booster', 'nitro', 'Nitro Booster', 100, '🚀', 18, 5),
  part('booster', 'rocket', 'Rocket Booster', 130, '🚀', 21, 6), part('booster', 'mega', 'Mega Booster', 240, '☄️', 25, 7),
  // looks
  part('exhaust', 'pipe', 'Little Pipe', 0, '💨', 0, 0), part('exhaust', 'stack', 'Smoke Stack', 6, '💨', 0, 1), part('exhaust', 'twin', 'Twin Stacks', 10, '💨', 0, 2),
  part('exhaust', 'chrome', 'Chrome Stacks', 14, '💨', 0, 3), part('exhaust', 'flame', 'Flame Pipes', 18, '🔥', 0, 4), part('exhaust', 'tall', 'Tall Stacks', 24, '💨', 0, 5),
  part('exhaust', 'dragon', 'Dragon Pipes', 30, '🐉', 0, 6), part('exhaust', 'gold', 'Gold Stacks', 38, '🏅', 0, 7),
  part('lights', 'none', 'No Roof Lights', 0, '⬜', 0, 0), part('lights', 'two', 'Two Roof Lights', 5, '💡', 0, 1), part('lights', 'bar', 'Light Bar', 9, '💡', 0, 2),
  part('lights', 'four', 'Four Roof Lights', 13, '💡', 0, 3), part('lights', 'siren', 'Siren Lights', 17, '🚨', 0, 4), part('lights', 'disco', 'Disco Lights', 22, '🪩', 0, 5),
  part('lights', 'star', 'Star Lights', 28, '⭐', 0, 6), part('lights', 'laser', 'Laser Lights', 35, '🔦', 0, 7),
  part('flag', 'none', 'No Flag', 0, '⬜', 0, 0), part('flag', 'checker', 'Checkered Flag', 4, '🏁', 0, 1), part('flag', 'red', 'Red Flag', 7, '🚩', 0, 2),
  part('flag', 'pirate', 'Pirate Flag', 10, '🏴‍☠️', 0, 3), part('flag', 'rainbow', 'Rainbow Flag', 14, '🌈', 0, 4), part('flag', 'star', 'Star Flag', 18, '⭐', 0, 5),
  part('flag', 'flame', 'Flame Flag', 23, '🔥', 0, 6), part('flag', 'gold', 'Gold Flag', 30, '🏆', 0, 7),
] as const;

// ---------- ramp pieces ----------

/** The ramp: the run-up (longer gives more speed), the kicker (steeper and higher throws him farther) and the landing ramp at the far end
 *  (a gentler landing: it widens the clean-landing window). Every piece shows its length in feet. */
export const RAMP_SLOTS = ['runup', 'kicker', 'landing'] as const;
export type RampSlot = (typeof RAMP_SLOTS)[number];
export interface RampItem extends Base { readonly cat: 'ramp'; readonly slot: RampSlot; readonly feet: number; readonly angle: number; readonly lip: number; readonly window: number }
const ramp = <const N extends string>(slot: RampSlot, id: string, name: N, price: number, feet: number, extra: { angle?: number; lip?: number; window?: number } = {}) =>
  ({ cat: 'ramp', id: `ramp:${slot}:${id}`, name, price, icon: slot === 'runup' ? '🛣️' : slot === 'kicker' ? '📐' : '🛬', slot, feet, angle: extra.angle ?? 0, lip: extra.lip ?? 0, window: extra.window ?? 0 }) as RampItem & { readonly name: N };
/** A kicker's length is how far its slope runs along the ground. */
const kick = (angle: number, lip: number) => Math.round(lip / Math.tan((angle * Math.PI) / 180));
export const RAMPS = [
  ramp('runup', 'dirt', 'Dirt Run-Up', 0, 40), ramp('runup', 'gravel', 'Gravel Run-Up', 12, 50), ramp('runup', 'long', 'Long Run-Up', 24, 60),
  ramp('runup', 'paved', 'Paved Run-Up', 38, 70), ramp('runup', 'longer', 'Longer Run-Up', 52, 80), ramp('runup', 'track', 'Race Track Run-Up', 68, 90),
  ramp('runup', 'hill', 'Hill Run-Up', 85, 100), ramp('runup', 'mega', 'Mega Run-Up', 110, 110), ramp('runup', 'super', 'Super Run-Up', 130, 120),
  ramp('runup', 'sky', 'Sky Run-Up', 220, 130),
  ramp('kicker', 'plank', 'Plank Kicker', 0, kick(18, 3), { angle: 18, lip: 3 }), ramp('kicker', 'wood', 'Wood Kicker', 15, kick(20, 3.5), { angle: 20, lip: 3.5 }),
  ramp('kicker', 'dirt', 'Dirt Kicker', 28, kick(22, 4), { angle: 22, lip: 4 }), ramp('kicker', 'steel', 'Steel Kicker', 42, kick(24, 4.5), { angle: 24, lip: 4.5 }),
  ramp('kicker', 'steep', 'Steep Kicker', 58, kick(26, 5), { angle: 26, lip: 5 }), ramp('kicker', 'big', 'Big Kicker', 75, kick(28, 5.5), { angle: 28, lip: 5.5 }),
  ramp('kicker', 'tall', 'Tall Kicker', 95, kick(30, 6), { angle: 30, lip: 6 }), ramp('kicker', 'mega', 'Mega Kicker', 120, kick(31, 7), { angle: 31, lip: 7 }),
  ramp('kicker', 'sky', 'Sky Kicker', 140, kick(33, 8), { angle: 33, lip: 8 }), ramp('kicker', 'moon', 'Moon Kicker', 260, kick(35, 9), { angle: 35, lip: 9 }),
  ramp('landing', 'none', 'No Landing Ramp', 0, 0), ramp('landing', 'dirt', 'Dirt Landing', 10, 10, { window: 2 }), ramp('landing', 'mound', 'Dirt Mound Landing', 20, 15, { window: 3 }),
  ramp('landing', 'wood', 'Wood Landing Ramp', 30, 20, { window: 4 }), ramp('landing', 'long', 'Long Landing Ramp', 42, 25, { window: 5 }), ramp('landing', 'steel', 'Steel Landing Ramp', 55, 30, { window: 6 }),
  ramp('landing', 'padded', 'Padded Landing', 70, 30, { window: 8 }), ramp('landing', 'big', 'Big Landing Ramp', 85, 35, { window: 9 }), ramp('landing', 'air', 'Air Bag Landing', 100, 40, { window: 11 }),
  ramp('landing', 'mega', 'Mega Landing Ramp', 120, 45, { window: 13 }),
] as const;

// ---------- Rows to jump ----------

/** What he jumps over. Each kind has a real length in feet, so a Row of them is as long as it looks. */
export const OBSTACLES = {
  cone: { name: 'cone', len: 3, h: 2.5, colour: '#ff7a00' }, hay: { name: 'hay bale', len: 4, h: 3, colour: '#e6c35c' }, mini: { name: 'little car', len: 10, h: 4.5, colour: '#5fd3f3' },
  car: { name: 'car', len: 15, h: 5, colour: '#e63946' }, taxi: { name: 'taxi', len: 15, h: 5, colour: '#ffd23f' }, police: { name: 'police car', len: 16, h: 5, colour: '#f6f8fb' },
  van: { name: 'van', len: 17, h: 7, colour: '#c9d1da' }, pickup: { name: 'pickup', len: 19, h: 6, colour: '#2f8fe8' }, icecream: { name: 'ice cream truck', len: 18, h: 9, colour: '#ff9ad5' },
  tractor: { name: 'tractor', len: 14, h: 9, colour: '#2fa84f' }, camper: { name: 'camper', len: 24, h: 10, colour: '#f2e8cf' }, limo: { name: 'limo', len: 25, h: 5, colour: '#1b1e24' },
  dump: { name: 'dump truck', len: 26, h: 11, colour: '#ffb703' }, schoolbus: { name: 'school bus', len: 38, h: 10, colour: '#ffc300' }, bus: { name: 'bus', len: 40, h: 10, colour: '#2fa84f' },
  fire: { name: 'fire truck', len: 36, h: 10, colour: '#d62828' }, boat: { name: 'boat', len: 24, h: 8, colour: '#f6f8fb' }, ring: { name: 'fire ring', len: 8, h: 14, colour: '#ff4d1a' },
  rival: { name: 'monster truck', len: 18, h: 11, colour: '#7b4bd1' }, tanker: { name: 'tanker', len: 45, h: 12, colour: '#c9d1da' }, train: { name: 'train car', len: 50, h: 13, colour: '#8b3a2b' },
  heli: { name: 'helicopter', len: 42, h: 13, colour: '#3d5a80' }, plane: { name: 'plane', len: 70, h: 18, colour: '#f6f8fb' }, pool: { name: 'pool', len: 30, h: 1, colour: '#3d93dc' },
  mud: { name: 'mud pit', len: 20, h: 1, colour: '#6b4226' }, dino: { name: 'dinosaur', len: 40, h: 16, colour: '#5c9e31' }, crane: { name: 'crane', len: 40, h: 22, colour: '#ffb703' },
  logs: { name: 'log truck', len: 50, h: 12, colour: '#8b5a2b' }, whale: { name: 'whale balloon', len: 60, h: 14, colour: '#5d7790' }, rocket: { name: 'rocket', len: 60, h: 10, colour: '#e8edf2' },
} as const;
export type ObstacleKind = keyof typeof OBSTACLES;
/** A gap of this many feet between things in a Row. */
export const ROW_GAP = 1;
export const rowLength = (parts: readonly (readonly [ObstacleKind, number])[]) =>
  parts.reduce((s, [k, n]) => s + n * OBSTACLES[k].len + n * ROW_GAP, 0) + 2;

export interface RowItem extends Base { readonly cat: 'row'; readonly n: number; readonly parts: readonly (readonly [ObstacleKind, number])[]; readonly feet: number }
const row = <const N extends string>(n: number, name: N, icon: string, parts: readonly (readonly [ObstacleKind, number])[]) =>
  ({ cat: 'row', id: `row:${n}`, n, name, icon, parts, feet: rowLength(parts), price: n === 1 ? 0 : n <= 5 ? n + 1 : Math.min(100, 3 + Math.round(n * 2.4)), ...(n > 1 && { needs: `row:${n - 1}` }) }) as RowItem & { readonly name: N };
/** The hand-made Rows, in order: each opens in the shop when the one before is cleared. */
export const ROWS = [
  row(1, 'Three Cones', '🔺', [['cone', 3]]), row(2, 'Hay Bales', '🌾', [['hay', 3]]), row(3, 'One Little Car', '🚗', [['mini', 1], ['cone', 1]]),
  row(4, 'One Car', '🚗', [['car', 1]]), row(5, 'Two Little Cars', '🚗', [['mini', 2]]), row(6, 'The Taxi', '🚕', [['taxi', 1], ['cone', 1]]),
  row(7, 'The Police Car', '🚓', [['police', 1], ['hay', 1]]), row(8, 'The Mud Pit', '🟫', [['mud', 1]]), row(9, 'Two Cars', '🚗', [['car', 1], ['mini', 1]]),
  row(10, 'The Fire Ring', '🔥', [['ring', 1], ['car', 1], ['cone', 1]]), row(11, 'Two Tractors', '🚜', [['tractor', 2]]), row(12, 'The Pool', '🏊', [['pool', 1], ['cone', 1]]),
  row(13, 'The Pickup Row', '🛻', [['pickup', 1], ['van', 1]]), row(14, 'The Ice Cream Trucks', '🍦', [['icecream', 2]]), row(15, 'One Bus', '🚌', [['bus', 1]]),
  row(16, 'The Camper', '🚐', [['camper', 1], ['van', 1]]), row(17, 'One School Bus', '🚌', [['schoolbus', 1], ['cone', 1]]), row(18, 'Rival Trucks', '🛻', [['rival', 2], ['hay', 2]]),
  row(19, 'Two Limos', '🚘', [['limo', 2]]), row(20, 'Two Fire Rings', '🔥', [['ring', 2], ['car', 2]]), row(21, 'Two Dump Trucks', '🚚', [['dump', 2]]),
  row(22, 'The Boat Show', '🛥️', [['boat', 2]]), row(23, 'The Bus Stop', '🚏', [['bus', 1], ['car', 1]]), row(24, 'The Fire Truck', '🚒', [['fire', 1], ['ring', 1], ['car', 1]]),
  row(25, 'The Tanker', '🛢️', [['tanker', 1], ['ring', 1], ['cone', 2]]), row(26, 'The Big Mud Pit', '🟫', [['mud', 2], ['rival', 1], ['cone', 1]]), row(27, 'The Helicopter', '🚁', [['heli', 1], ['pickup', 1], ['hay', 1]]),
  row(28, 'The Train', '🚃', [['train', 1], ['ring', 1], ['cone', 2]]), row(29, 'The Dinosaur', '🦖', [['dino', 1], ['tractor', 1], ['hay', 2]]), row(30, 'Two School Buses', '🚌', [['schoolbus', 2]]),
  row(31, 'The Crane', '🏗️', [['crane', 1], ['dump', 1], ['cone', 2]]), row(32, 'The Log Truck', '🪵', [['logs', 1], ['limo', 1]]), row(33, 'A Parked Plane', '✈️', [['plane', 1], ['cone', 2]]),
  row(34, 'Two Buses', '🚌', [['bus', 2], ['cone', 1]]), row(35, 'The Whale Balloon', '🐋', [['whale', 1], ['pool', 1]]), row(36, 'The Rocket', '🚀', [['rocket', 1], ['ring', 2], ['hay', 2]]),
  row(37, 'The Long Train', '🚃', [['train', 1], ['ring', 1], ['camper', 1], ['hay', 1]]), row(38, 'The Air Show', '✈️', [['plane', 1], ['ring', 1], ['cone', 2]]), row(39, 'The Monster Pile', '🛻', [['rival', 5]]),
  row(40, 'The Grand Finale', '🎆', [['plane', 1], ['ring', 2], ['car', 1]]),
] as const;

// ---------- paint, made from parts ----------

export interface ColourItem extends Base { readonly cat: 'colour'; readonly hex: string }
export interface PatternItem extends Base { readonly cat: 'pattern'; readonly look: number }
export interface DecalItem extends Base { readonly cat: 'decal'; readonly glyph: string }
export interface TrimItem extends Base { readonly cat: 'trim'; readonly hex: string }
const colour = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'colour', id: `colour:${id}`, name, price, icon: '🎨', hex }) as ColourItem & { readonly name: N };
const pattern = <const N extends string>(id: string, name: N, price: number, look: number, icon: string) => ({ cat: 'pattern', id: `pattern:${id}`, name, price, icon, look }) as PatternItem & { readonly name: N };
const decal = <const N extends string>(id: string, name: N, price: number, glyph: string) => ({ cat: 'decal', id: `decal:${id}`, name, price, icon: glyph || '⬜', glyph }) as DecalItem & { readonly name: N };
const trim = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'trim', id: `trim:${id}`, name, price, icon: '✨', hex }) as TrimItem & { readonly name: N };
export const COLOURS = [
  colour('red', 'Fire Red', 0, '#e63946'), colour('orange', 'Blaze Orange', 3, '#ff7a00'), colour('yellow', 'Hot Yellow', 3, '#ffd23f'), colour('lime', 'Lime Green', 4, '#9be22d'),
  colour('green', 'Turbo Green', 4, '#2fa84f'), colour('blue', 'Electric Blue', 5, '#2f8fe8'), colour('sky', 'Sky Blue', 5, '#5fd3f3'), colour('purple', 'Grape Purple', 6, '#7b4bd1'),
  colour('pink', 'Hot Pink', 6, '#ff5fa2'), colour('black', 'Night Black', 7, '#1b1e24'), colour('white', 'Snow White', 7, '#f6f8fb'), colour('silver', 'Silver', 8, '#c9d1da'),
  colour('teal', 'Teal', 8, '#14a3a3'), colour('brown', 'Mud Brown', 9, '#7a4a22'), colour('navy', 'Navy', 9, '#1f3a68'), colour('cherry', 'Cherry', 10, '#b5172b'),
  colour('mint', 'Mint', 11, '#8ee6c4'), colour('gold', 'Gold', 14, '#e0b13a'), colour('copper', 'Copper', 15, '#c46a2f'), colour('lava', 'Lava', 17, '#ff4d1a'),
  colour('chrome', 'Chrome', 22, '#e8edf2'), colour('glow', 'Glow Green', 26, '#7dff6b'),
] as const;
export const PATTERNS = [
  pattern('plain', 'Plain', 0, 0, '⬜'), pattern('stripes', 'Racing Stripes', 6, 1, '🏁'), pattern('flames', 'Flames', 9, 2, '🔥'), pattern('checks', 'Checkers', 12, 3, '🏁'),
  pattern('spots', 'Spots', 14, 4, '🔴'), pattern('zigzag', 'Zigzags', 16, 5, '⚡'), pattern('tiger', 'Tiger Stripes', 19, 6, '🐯'), pattern('stars', 'Stars', 22, 7, '⭐'),
  pattern('camo', 'Camo', 25, 8, '🌿'), pattern('scales', 'Dragon Scales', 30, 9, '🐉'),
] as const;
export const DECALS = [
  decal('none', 'No Decal', 0, ''), decal('star', 'Star Decal', 3, '⭐'), decal('bolt', 'Lightning Decal', 3, '⚡'), decal('skull', 'Skull Decal', 4, '💀'),
  decal('fire', 'Fire Decal', 4, '🔥'), decal('number', 'Number One Decal', 5, '1️⃣'), decal('eyes', 'Big Eyes Decal', 6, '👀'), decal('teeth', 'Shark Teeth Decal', 7, '🦷'),
  decal('dino', 'Dino Decal', 8, '🦖'), decal('crown', 'Crown Decal', 9, '👑'), decal('rocket', 'Rocket Decal', 10, '🚀'), decal('dragon', 'Dragon Decal', 12, '🐉'),
  decal('trophy', 'Trophy Decal', 13, '🏆'), decal('alien', 'Alien Decal', 14, '👽'), decal('tiger', 'Tiger Decal', 16, '🐯'), decal('wings', 'Wings Decal', 18, '🪽'),
] as const;
export const TRIMS = [
  trim('black', 'Black Trim', 0, '#1b1e24'), trim('white', 'White Trim', 5, '#f6f8fb'), trim('chrome', 'Chrome Trim', 8, '#e8edf2'), trim('yellow', 'Yellow Trim', 10, '#ffd23f'),
  trim('red', 'Red Trim', 12, '#e63946'), trim('blue', 'Blue Trim', 14, '#2f8fe8'), trim('gold', 'Gold Trim', 18, '#e0b13a'), trim('neon', 'Neon Trim', 24, '#7dff6b'),
] as const;

// ---------- the arena ----------

/** What an arena piece does: most are the arena's life (they appear around the jump); some change how a Jump plays or looks. */
export type ArenaDoes = 'look' | 'night' | 'fireworks' | 'screen' | 'windsock' | 'speed' | 'lights' | 'confetti' | 'flashes';
export interface ArenaItem extends Base { readonly cat: 'arena'; readonly does: ArenaDoes; readonly spot: number }
const arena = <const N extends string>(id: string, name: N, price: number, icon: string, does: ArenaDoes, spot: number, needs?: string) =>
  ({ cat: 'arena', id: `arena:${id}`, name, price, icon, does, spot, ...(needs && { needs: `arena:${needs}` }) }) as ArenaItem & { readonly name: N };
export const ARENA = [
  arena('flags', 'Flag Row', 8, '🚩', 'look', 1), arena('banner', 'Big Banner', 12, '🎌', 'look', 2), arena('lights', 'Start Lights', 15, '🚦', 'lights', 3),
  arena('windsock', 'Windsock', 15, '🎏', 'windsock', 4), arena('hotdog', 'Hot Dog Stand', 18, '🌭', 'look', 5), arena('balloons', 'Balloon Arch', 20, '🎈', 'look', 6),
  arena('tow', 'Tow Truck', 24, '🚛', 'look', 7), arena('flashes', 'Camera Crew', 25, '📸', 'flashes', 8), arena('speed', 'Speed Board', 30, '📟', 'speed', 9),
  arena('ambulance', 'Ambulance', 30, '🚑', 'look', 10), arena('booth', 'Announcer Booth', 35, '🎙️', 'look', 11), arena('mascot', 'Dino Mascot', 38, '🦖', 'look', 12),
  arena('confetti', 'Confetti Cannons', 40, '🎊', 'confetti', 13), arena('band', 'Drum Band', 45, '🥁', 'look', 14), arena('smoke', 'Smoke Machine', 50, '🌫️', 'look', 15),
  arena('pit', 'Pit Garage', 55, '🔧', 'look', 16), arena('floodlights', 'Floodlights', 60, '💡', 'night', 17), arena('spot', 'Spotlights', 65, '🔦', 'look', 18, 'floodlights'),
  arena('trophycase', 'Trophy Case', 70, '🏆', 'look', 19), arena('fireworks', 'Fireworks', 80, '🎆', 'fireworks', 20), arena('lasers', 'Laser Show', 90, '🌈', 'look', 21, 'floodlights'),
  arena('blimp', 'Blimp', 100, '🎈', 'look', 22), arena('screen', 'Big Screen', 120, '📺', 'screen', 23), arena('sign', 'Giant Sign', 130, '🪧', 'look', 24),
] as const;

// ---------- drivers and horns ----------

export interface DriverItem extends Base { readonly cat: 'driver'; readonly helmet: string; readonly face: string }
export interface HornItem extends Base { readonly cat: 'horn'; readonly sound: number }
const driver = <const N extends string>(id: string, name: N, price: number, helmet: string, face: string) => ({ cat: 'driver', id: `driver:${id}`, name, price, icon: face, helmet, face }) as DriverItem & { readonly name: N };
const horn = <const N extends string>(id: string, name: N, price: number, icon: string, sound: number) => ({ cat: 'horn', id: `horn:${id}`, name, price, icon, sound }) as HornItem & { readonly name: N };
export const DRIVERS = [
  driver('rookie', 'Rookie Driver', 0, '#f6f8fb', '🙂'), driver('ace', 'Ace Driver', 8, '#e63946', '😎'), driver('robot', 'Robot Driver', 14, '#c9d1da', '🤖'),
  driver('cat', 'Cat Driver', 18, '#ff7a00', '🐱'), driver('dog', 'Dog Driver', 22, '#7a4a22', '🐶'), driver('alien', 'Alien Driver', 28, '#7dff6b', '👽'),
  driver('dino', 'Dino Driver', 34, '#2fa84f', '🦖'), driver('monkey', 'Monkey Driver', 40, '#c46a2f', '🐵'), driver('ghost', 'Ghost Driver', 48, '#f6f8fb', '👻'),
  driver('lion', 'Lion Driver', 60, '#e0b13a', '🦁'),
] as const;
export const HORNS = [
  horn('beep', 'Beep Horn', 0, '📯', 0), horn('honk', 'Honk Horn', 4, '📯', 1), horn('truck', 'Truck Horn', 7, '🚛', 2), horn('train', 'Train Horn', 10, '🚂', 3),
  horn('duck', 'Duck Horn', 13, '🦆', 4), horn('tune', 'Tune Horn', 17, '🎵', 5), horn('siren', 'Siren Horn', 21, '🚨', 6), horn('air', 'Air Horn', 26, '📣', 7),
  horn('roar', 'Roar Horn', 32, '🦁', 8), horn('rocket', 'Rocket Horn', 40, '🚀', 9),
] as const;

// ---------- all of it ----------

export type Item = BodyItem | PartItem | RampItem | RowItem | ColourItem | PatternItem | DecalItem | TrimItem | ArenaItem | DriverItem | HornItem;
export const ITEMS: readonly Item[] = [...BODIES, ...PARTS, ...RAMPS, ...ROWS, ...COLOURS, ...PATTERNS, ...DECALS, ...TRIMS, ...ARENA, ...DRIVERS, ...HORNS];
const byId = new Map(ITEMS.map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const itemOf = (id: string): Item => { const i = byId.get(id); if (!i) throw new Error(`no item ${id}`); return i; };
/** What he starts with: the Mud Truck, the starting part in every slot, the dirt run-up and plank kicker, the first Row, red paint. */
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export type ItemName = (typeof BODIES)[number]['name'] | (typeof PARTS)[number]['name'] | (typeof RAMPS)[number]['name'] | (typeof ROWS)[number]['name']
  | (typeof COLOURS)[number]['name'] | (typeof PATTERNS)[number]['name'] | (typeof DECALS)[number]['name'] | (typeof TRIMS)[number]['name']
  | (typeof ARENA)[number]['name'] | (typeof DRIVERS)[number]['name'] | (typeof HORNS)[number]['name'];
export const ITEM_NAMES = ITEMS.map(i => i.name) as ItemName[];
export const partsFor = (slot: Slot) => PARTS.filter(p => p.slot === slot);
export const rampsFor = (slot: RampSlot) => RAMPS.filter(p => p.slot === slot);
export const starterPart = (slot: Slot) => partsFor(slot).find(p => p.price === 0)!;
export const starterRamp = (slot: RampSlot) => rampsFor(slot).find(p => p.price === 0)!;

// ---------- things to buy again and again ----------

/** Each can be bought without end, its price rising a little each time and then staying flat. Seat blocks grow the crowd (drawn and
 *  counted on the board); each tune of the engine, springs or booster adds a little less than the last, so the record always has
 *  somewhere to go and never runs away. */
export const REPEATS = [
  { id: 'seats', name: 'More Seats', icon: '🏟️', needs: undefined, base: 12, step: 3, flat: 60 },
  { id: 'engine', name: 'Tune the Engine', icon: '🔧', needs: 'part:engine:v8', base: 30, step: 5, flat: 60 },
  { id: 'springs', name: 'Tune the Springs', icon: '🔧', needs: 'part:springs:coil', base: 20, step: 4, flat: 60 },
  { id: 'booster', name: 'Tune the Booster', icon: '🔧', needs: 'part:booster:small', base: 25, step: 5, flat: 60 },
] as const;
export type RepeatId = (typeof REPEATS)[number]['id'];
export type RepeatName = (typeof REPEATS)[number]['name'];
export const REPEAT_IDS = REPEATS.map(r => r.id) as RepeatId[];
export const repeatOf = (id: RepeatId) => REPEATS.find(r => r.id === id)!;
/** The price of the next one when he has bought `k`: whole tens above 100, so the voice can say it. */
export function repeatPrice(id: RepeatId, k: number): number {
  const r = repeatOf(id), p = Math.min(r.flat, r.base + r.step * k);
  return p > 100 ? Math.round(p / 10) * 10 : p;
}
/** What the k-th tune adds (k from 1): a little less each time, without end (the sum keeps growing, slowly). */
export const TUNE_GAIN = { engine: 2.4, springs: 1.2, booster: 1.6 } as const;
export const tuneTotal = (id: 'engine' | 'springs' | 'booster', k: number) => { let s = 0; for (let i = 1; i <= k; i++) s += TUNE_GAIN[id] / (1 + (i - 1) * .25); return s; };
