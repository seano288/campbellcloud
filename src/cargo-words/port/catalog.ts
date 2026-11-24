// Everything there is to buy for the Port. Pieces go in fixed places on the plot (plot.ts), so the layout always works; he picks the
// order. Cranes and their parts change how the Crane plays; ships make his Fleet; paints, funnel marks and container looks dress them.
//
// Pieces matter (port.ts reads them): each berth holds one more ship; the long quay and the deep-water quay take bigger ships; the crane
// rails let the gantry cranes stand; the lighthouse opens night harbours and the fog horn foggy ones; the dry dock lets him repaint a
// hull; the ferry pier, fish market, fuel dock, car park and shipyard each let a kind of ship berth; the paint shop lets him buy container
// stripes and company marks; the rail line, the lorry gate and the warehouses carry containers away in "Watch it run".
//
// Prices up to 100 can be any number; above 100 they are whole tens up to 400, because the voice has a clip for each of those (PRICE_TENS
// in phrases.ts). A dear thing always changes what he can do; a paint is never the dearest thing.
import { SHIP_KINDS, type ShipKind } from '../art/ship';
import type { Stripe } from '../art/container';
import type { CraneLook } from '../crane/render';
import type { CraneSpec, ShipShape } from '../crane/sim';

export const CATEGORIES = ['piece', 'decor', 'crane', 'part', 'cranepaint', 'ship', 'paint', 'mark', 'box', 'stripe', 'logo'] as const;
export type Category = (typeof CATEGORIES)[number];

interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly needs?: string }
export interface PieceItem extends Base { readonly cat: 'piece' | 'decor'; readonly does?: string }
export interface CraneItem extends Base { readonly cat: 'crane'; readonly kind: CraneLook['kind']; readonly reach: ShipShape }
export interface PartItem extends Base { readonly cat: 'part'; readonly slot: PartSlot; readonly rank: number; readonly hex?: string }
export interface ColourItem extends Base { readonly cat: 'cranepaint' | 'paint' | 'box'; readonly hex: string }
export interface ShipItem extends Base { readonly cat: 'ship'; readonly kind: ShipKind }
export interface MarkItem extends Base { readonly cat: 'mark' | 'logo'; readonly glyph: string }
export interface StripeItem extends Base { readonly cat: 'stripe'; readonly stripe: Stripe }
export type Item = PieceItem | CraneItem | PartItem | ColourItem | ShipItem | MarkItem | StripeItem;

// ---------- the Port's pieces ----------

const piece = <const N extends string>(id: string, name: N, price: number, icon: string, needs?: string, does?: string) =>
  ({ cat: 'piece', id: `piece:${id}`, name, price, icon, ...(needs && { needs: needs.includes(':') ? needs : `piece:${needs}` }), ...(does && { does }) }) as PieceItem & { readonly name: N };
const decor = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'decor', id: `decor:${id}`, name, price, icon }) as PieceItem & { readonly name: N };

export const PIECES = [
  // berths: each holds one more ship
  piece('berth2', 'Berth 2', 12, '⚓', undefined, 'berth'),
  piece('berth3', 'Berth 3', 24, '⚓', 'berth2', 'berth'),
  piece('berth4', 'Berth 4', 38, '⚓', 'berth3', 'berth'),
  piece('berth5', 'Berth 5', 55, '⚓', 'berth4', 'berth'),
  piece('berth6', 'Berth 6', 75, '⚓', 'berth5', 'berth'),
  piece('berth7', 'Berth 7', 80, '⚓', 'berth6', 'berth'),
  piece('berth8', 'Berth 8', 85, '⚓', 'berth7', 'berth'),
  piece('berth9', 'Berth 9', 90, '⚓', 'berth8', 'berth'),
  piece('berth10', 'Berth 10', 95, '⚓', 'berth9', 'berth'),
  // the quay
  piece('bollards', 'Bollards', 6, '🪢'),
  piece('fenders', 'Fenders', 9, '⭕'),
  piece('longquay', 'Long Quay', 60, '🧱', undefined, 'longer ships'),
  piece('deepquay', 'Deep-Water Quay', 200, '🌊', 'longquay', 'the biggest ships'),
  piece('rails', 'Crane Rails', 45, '🛤️', undefined, 'gantry cranes'),
  piece('floodlights', 'Floodlights', 30, '💡'),
  // the yard, and what takes containers away
  piece('yard', 'Container Yard', 20, '📦'),
  piece('bigyard', 'Big Yard', 70, '🏗️', 'yard'),
  piece('reefer', 'Reefer Plugs', 28, '🔌', 'yard'),
  piece('straddle', 'Straddle Carrier', 50, '🚜', 'yard'),
  piece('stacker', 'Reach Stacker', 40, '🚛', 'yard'),
  piece('repair', 'Container Repair', 32, '🔧', 'yard'),
  piece('paintshop', 'Paint Shop', 26, '🎨', undefined, 'container stripes and marks'),
  piece('rail', 'Rail Line', 48, '🛤️', undefined, 'trains'),
  piece('engine', 'Train Engine', 65, '🚂', 'rail'),
  piece('longtrain', 'Long Train', 90, '🚃', 'engine'),
  piece('gate', 'Lorry Gate', 22, '🚧', undefined, 'lorries'),
  piece('lorry', 'Lorry', 30, '🚚', 'gate'),
  piece('biglorry', 'Big Lorry', 55, '🚛', 'lorry'),
  piece('weigh', 'Weighbridge', 18, '⚖️', 'gate'),
  piece('shed', 'Warehouse', 40, '🏚️'),
  piece('bigshed', 'Big Warehouse', 85, '🏭', 'shed'),
  piece('coldstore', 'Cold Store', 60, '🧊', 'shed'),
  // the harbour
  piece('lighthouse', 'Lighthouse', 80, '🗼', undefined, 'night harbours'),
  piece('harbourlights', 'Harbour Lights', 35, '🚨', 'lighthouse'),
  piece('foghorn', 'Fog Horn', 45, '📯', undefined, 'foggy harbours'),
  piece('breakwater', 'Breakwater', 110, '🪨', undefined, 'stormy harbours'),
  piece('office', 'Harbour Office', 16, '🏢'),
  piece('clock', 'Clock Tower', 42, '🕰️', 'office'),
  piece('signal', 'Signal Mast', 20, '🚩'),
  piece('radar', 'Radar Mast', 52, '📡', 'signal'),
  piece('pilot', 'Pilot Station', 34, '🧭'),
  piece('tugshed', 'Tug Shed', 26, '🛖'),
  piece('customs', 'Customs House', 46, '🏛️', 'office'),
  piece('weather', 'Weather Station', 24, '🌡️'),
  piece('watertower', 'Water Tower', 30, '🗼'),
  piece('canteen', 'Canteen', 22, '🍲'),
  // what lets each kind of ship berth
  piece('fishmarket', 'Fish Market', 32, '🐟', undefined, 'fishing boats'),
  piece('fuel', 'Fuel Dock', 70, '⛽', undefined, 'tankers'),
  piece('oiltanks', 'Oil Tanks', 50, '🛢️', 'fuel'),
  piece('ferrypier', 'Ferry Pier', 65, '⛴️', undefined, 'ferries and cruise liners'),
  piece('carpark', 'Car Park', 40, '🅿️', undefined, 'car carriers'),
  piece('shipyard', 'Shipyard', 120, '🛠️', undefined, 'research ships and icebreakers'),
  piece('drydock', 'Dry Dock', 90, '🚢', undefined, 'repaint a hull'),
  // more of the harbour
  piece('ice', 'Ice Plant', 28, '❄️', 'fishmarket'),
  piece('ramp', 'Boat Ramp', 14, '🛶'),
  piece('rescue', 'Rescue Station', 44, '🛟'),
  piece('coastguard', 'Coast Guard', 75, '🚤', 'rescue'),
  piece('silo', 'Grain Silo', 38, '🌾'),
  piece('wind', 'Wind Turbine', 58, '🌬️'),
  piece('solar', 'Solar Roof', 36, '☀️', 'shed'),
  piece('busstop', 'Bus Stop', 12, '🚏'),
] as const;

export const DECOR = [
  decor('benches', 'Benches', 5, '🪑'), decor('trees', 'Trees', 7, '🌳'), decor('flowers', 'Flower Beds', 8, '🌷'), decor('lamps', 'Lamp Posts', 10, '🏮'),
  decor('fountain', 'Fountain', 26, '⛲'), decor('statue', 'Sailor Statue', 34, '🗿'), decor('icecream', 'Ice Cream Stand', 15, '🍦'),
  decor('kiosk', 'Kite Shop', 18, '🪁'), decor('gulls', 'Seagull Rock', 9, '🪨'), decor('bunting', 'Flag Bunting', 11, '🎏'),
  decor('playground', 'Playground', 40, '🛝'), decor('anchor', 'Big Anchor', 22, '⚓'),
] as const;

// ---------- cranes and their parts ----------

const crane = <const N extends string>(id: string, name: N, price: number, kind: CraneLook['kind'], reach: ShipShape, needs?: string) =>
  ({ cat: 'crane', id: `crane:${id}`, name, price, icon: '🏗️', kind, reach, ...(needs && { needs }) }) as CraneItem & { readonly name: N };
/** Each crane reaches a ship this many stacks long and this many high. */
export const CRANES = [
  crane('dock', 'Dock Crane', 0, 'dock', { cols: 3, tiers: 2 }),
  crane('tall', 'Tall Crane', 70, 'tall', { cols: 4, tiers: 2 }),
  crane('gantry', 'Gantry Crane', 150, 'gantry', { cols: 5, tiers: 2 }, 'piece:rails'),
  crane('floating', 'Floating Crane', 220, 'floating', { cols: 4, tiers: 3 }, 'crane:tall'),
  crane('giant', 'Giant Gantry', 380, 'giant', { cols: 6, tiers: 3 }, 'piece:deepquay'),
] as const;

export const PART_SLOTS = ['grab', 'cable', 'trolley', 'lights', 'horn'] as const;
export type PartSlot = (typeof PART_SLOTS)[number];
const part = <const N extends string>(slot: PartSlot, id: string, name: N, price: number, rank: number, icon: string, extra: { hex?: string; needs?: string } = {}) =>
  ({ cat: 'part', id: `part:${id}`, name, price, slot, rank, icon, ...extra }) as PartItem & { readonly name: N };
export const PARTS = [
  part('grab', 'single', 'Single Grab', 0, 0, '🪝'), part('grab', 'twin', 'Twin Grab', 180, 1, '🪝', { needs: 'crane:tall' }),
  part('cable', 'cable1', 'Steel Cable', 0, 0, '🧵'), part('cable', 'cable2', 'Fast Cable', 40, 1, '🧵'), part('cable', 'cable3', 'Faster Cable', 90, 2, '🧵', { needs: 'part:cable2' }), part('cable', 'cable4', 'Turbo Cable', 150, 3, '🧵', { needs: 'part:cable3' }),
  part('trolley', 'trolley1', 'Trolley', 0, 0, '🛒'), part('trolley', 'trolley2', 'Fast Trolley', 35, 1, '🛒'), part('trolley', 'trolley3', 'Faster Trolley', 80, 2, '🛒', { needs: 'part:trolley2' }), part('trolley', 'trolley4', 'Turbo Trolley', 140, 3, '🛒', { needs: 'part:trolley3' }),
  part('lights', 'nolights', 'No Lights', 0, 0, '⚫'), part('lights', 'whitelights', 'White Lights', 18, 1, '⚪', { hex: '#ffffff' }), part('lights', 'redlights', 'Red Lights', 22, 1, '🔴', { hex: '#ff4a3d' }),
  part('lights', 'bluelights', 'Blue Lights', 26, 1, '🔵', { hex: '#3da5ff' }), part('lights', 'greenlights', 'Green Lights', 26, 1, '🟢', { hex: '#3ddc84' }), part('lights', 'rainbowlights', 'Rainbow Lights', 60, 2, '🌈', { hex: 'rainbow' }),
  part('horn', 'toot', 'Toot Horn', 0, 0, '📣'), part('horn', 'whistle', 'Ship Whistle', 14, 1, '🎶'), part('horn', 'bighorn', 'Big Horn', 28, 1, '📯'), part('horn', 'airhorn', 'Air Horn', 34, 1, '🔊'), part('horn', 'tunehorn', 'Tune Horn', 46, 2, '🎵'),
] as const;
/** How fast each rank of cable and trolley is, in the Crane's units a second (crane/sim.ts). */
export const CABLE_SPEED = [24, 30, 36, 44] as const, TROLLEY_SPEED = [26, 32, 40, 48] as const;

const colour = <C extends 'cranepaint' | 'paint' | 'box', const N extends string>(cat: C, id: string, name: N, price: number, hex: string, needs?: string) =>
  ({ cat, id: `${cat}:${id}`, name, price, hex, icon: '🎨', ...(needs && { needs }) }) as ColourItem & { readonly cat: C; readonly name: N };
export const CRANE_PAINTS = [
  colour('cranepaint', 'yellow', 'Safety Yellow', 0, '#ffcc00'), colour('cranepaint', 'orange', 'Crane Orange', 10, '#ff7a00'), colour('cranepaint', 'red', 'Crane Red', 10, '#e63946'),
  colour('cranepaint', 'blue', 'Crane Blue', 12, '#2f6fe0'), colour('cranepaint', 'green', 'Crane Green', 12, '#2fa84f'), colour('cranepaint', 'white', 'Crane White', 14, '#f4f4f0'),
  colour('cranepaint', 'purple', 'Crane Purple', 16, '#7b4bd1'), colour('cranepaint', 'pink', 'Crane Pink', 16, '#ff6fb5'), colour('cranepaint', 'black', 'Crane Black', 18, '#2b2b2b'),
  colour('cranepaint', 'silver', 'Crane Silver', 24, '#b8c0c8'),
] as const;

// ---------- ships ----------

const ship = <const N extends string>(kind: ShipKind, name: N, price: number, needs?: string) => ({ cat: 'ship', id: `ship:${kind}`, name, price, icon: '🚢', kind, ...(needs && { needs }) }) as ShipItem & { readonly name: N };
export const SHIPS = [
  ship('tug', 'Tug', 0), ship('fishing', 'Fishing Boat', 30, 'piece:fishmarket'), ship('feeder', 'Feeder Ship', 60),
  ship('research', 'Research Ship', 90, 'piece:shipyard'), ship('ferry', 'Ferry', 110, 'piece:ferrypier'), ship('tanker', 'Tanker', 130, 'piece:fuel'),
  ship('icebreaker', 'Icebreaker', 150, 'piece:shipyard'), ship('carcarrier', 'Car Carrier', 170, 'piece:carpark'), ship('boxship', 'Container Ship', 250, 'piece:longquay'),
  ship('liner', 'Cruise Liner', 300, 'piece:deepquay'),
] as const;
/** How many stacks long and high each kind is, as he owns it. Visiting ships are generated (ships.ts). */
export const SHIP_SHAPES: Record<ShipKind, ShipShape> = {
  tug: { cols: 2, tiers: 1 }, fishing: { cols: 2, tiers: 2 }, research: { cols: 3, tiers: 1 }, ferry: { cols: 3, tiers: 2 }, feeder: { cols: 3, tiers: 2 },
  icebreaker: { cols: 3, tiers: 2 }, tanker: { cols: 4, tiers: 1 }, carcarrier: { cols: 4, tiers: 2 }, boxship: { cols: 5, tiers: 2 }, liner: { cols: 5, tiers: 3 },
};

// hull paints need the Dry Dock
const H = 'piece:drydock';
export const PAINTS = [
  colour('paint', 'navy', 'Navy Blue', 8, '#1d3a6e', H), colour('paint', 'red', 'Ship Red', 8, '#c8302a', H), colour('paint', 'green', 'Sea Green', 9, '#1f8a6a', H),
  colour('paint', 'black', 'Hull Black', 9, '#262626', H), colour('paint', 'orange', 'Bright Orange', 10, '#ff7a00', H), colour('paint', 'sky', 'Sky Blue', 10, '#57b7ff', H),
  colour('paint', 'teal', 'Teal', 11, '#1aa3a3', H), colour('paint', 'yellow', 'Sun Yellow', 11, '#ffc531', H), colour('paint', 'grey', 'Steel Grey', 12, '#6e7882', H),
  colour('paint', 'purple', 'Plum Purple', 12, '#6b3fa0', H), colour('paint', 'pink', 'Coral Pink', 13, '#ff6f91', H), colour('paint', 'brown', 'Rust Brown', 13, '#8a4b2a', H),
  colour('paint', 'lime', 'Lime Green', 14, '#7ccf3a', H), colour('paint', 'cream', 'Cream', 14, '#f3e7c4', H), colour('paint', 'white', 'Snow White', 15, '#f8f8f8', H),
  colour('paint', 'maroon', 'Maroon', 15, '#7a1f2b', H), colour('paint', 'gold', 'Gold', 30, '#d4a62a', H), colour('paint', 'silver', 'Silver', 28, '#b9c2cb', H),
  colour('paint', 'mint', 'Mint', 16, '#8fe3c0', H), colour('paint', 'lilac', 'Lilac', 16, '#c3a6f0', H), colour('paint', 'ocean', 'Ocean Blue', 17, '#0f6fa8', H),
  colour('paint', 'forest', 'Forest Green', 17, '#255e3a', H), colour('paint', 'tomato', 'Tomato Red', 18, '#ff5a3c', H), colour('paint', 'sand', 'Sand', 18, '#e3c38a', H),
  colour('paint', 'midnight', 'Midnight', 20, '#14213d', H), colour('paint', 'bubblegum', 'Bubblegum', 20, '#ff9ad5', H), colour('paint', 'lemon', 'Lemon', 20, '#fff35c', H),
  colour('paint', 'slate', 'Slate', 22, '#4b5866', H), colour('paint', 'copper', 'Copper', 26, '#b8733a', H), colour('paint', 'emerald', 'Emerald', 26, '#14a05a', H),
] as const;

const mark = <C extends 'mark' | 'logo', const N extends string>(cat: C, id: string, name: N, price: number, glyph: string, needs?: string) =>
  ({ cat, id: `${cat}:${id}`, name, price, glyph, icon: glyph, ...(needs && { needs }) }) as MarkItem & { readonly cat: C; readonly name: N };
export const MARKS = [
  mark('mark', 'anchor', 'Anchor Mark', 6, '⚓'), mark('mark', 'star', 'Star Mark', 6, '⭐'), mark('mark', 'wave', 'Wave Mark', 7, '🌊'), mark('mark', 'sun', 'Sun Mark', 7, '☀️'),
  mark('mark', 'fish', 'Fish Mark', 8, '🐟'), mark('mark', 'whale', 'Whale Mark', 8, '🐳'), mark('mark', 'gull', 'Gull Mark', 9, '🕊️'), mark('mark', 'heart', 'Heart Mark', 9, '❤️'),
  mark('mark', 'bolt', 'Lightning Mark', 10, '⚡'), mark('mark', 'moon', 'Moon Mark', 10, '🌙'), mark('mark', 'crown', 'Crown Mark', 12, '👑'), mark('mark', 'rocket', 'Rocket Mark', 12, '🚀'),
  mark('mark', 'shell', 'Shell Mark', 11, '🐚'), mark('mark', 'octopus', 'Octopus Mark', 13, '🐙'), mark('mark', 'compass', 'Compass Mark', 13, '🧭'), mark('mark', 'clover', 'Clover Mark', 14, '🍀'),
  mark('mark', 'flame', 'Flame Mark', 14, '🔥'), mark('mark', 'snow', 'Snowflake Mark', 15, '❄️'), mark('mark', 'dino', 'Dino Mark', 16, '🦖'), mark('mark', 'tiger', 'Tiger Mark', 16, '🐯'),
  mark('mark', 'globe', 'Globe Mark', 18, '🌍'), mark('mark', 'diamond', 'Diamond Mark', 22, '💎'), mark('mark', 'trophy', 'Trophy Mark', 24, '🏆'), mark('mark', 'rainbow', 'Rainbow Mark', 26, '🌈'),
] as const;

// containers: colours, and with the Paint Shop, stripes and company marks
export const BOX_COLOURS = [
  colour('box', 'rust', 'Rust Red', 0, '#c8452f'), colour('box', 'blue', 'Bright Blue', 0, '#2f6fe0'), colour('box', 'green', 'Box Green', 7, '#2f9a55'),
  colour('box', 'orange', 'Box Orange', 7, '#f07c1f'), colour('box', 'yellow', 'Box Yellow', 8, '#f2c230'), colour('box', 'grey', 'Box Grey', 8, '#8a939c'),
  colour('box', 'teal', 'Box Teal', 9, '#1a9a9a'), colour('box', 'purple', 'Box Purple', 10, '#7b4bd1'), colour('box', 'pink', 'Box Pink', 11, '#f06aa8'),
  colour('box', 'brown', 'Box Brown', 11, '#8a5a35'), colour('box', 'white', 'Box White', 12, '#eeeeee'), colour('box', 'navy', 'Box Navy', 12, '#1f3870'),
  colour('box', 'lime', 'Box Lime', 13, '#8cd23c'), colour('box', 'sky', 'Box Sky', 13, '#68c3f5'),
] as const;
const stripe = <const N extends string>(s: Stripe, name: N, price: number) => ({ cat: 'stripe', id: `stripe:${s}`, name, price, stripe: s, icon: '➖', ...(s !== 'none' && { needs: 'piece:paintshop' }) }) as StripeItem & { readonly name: N };
export const STRIPE_ITEMS = [
  stripe('none', 'Plain', 0), stripe('band', 'Middle Band', 8), stripe('top', 'Top Band', 8), stripe('twin', 'Twin Stripes', 10), stripe('chevron', 'Chevron', 12),
  stripe('dots', 'Dots', 12), stripe('diagonal', 'Slash', 14), stripe('checks', 'Checks', 16),
] as const;
const P = 'piece:paintshop';
export const LOGOS = [
  mark('logo', 'none', 'No Mark', 0, ''), mark('logo', 'star', 'Star Line', 9, '⭐', P), mark('logo', 'whale', 'Whale Line', 9, '🐋', P), mark('logo', 'leaf', 'Leaf Line', 10, '🍃', P),
  mark('logo', 'bolt', 'Bolt Line', 10, '⚡', P), mark('logo', 'apple', 'Apple Line', 11, '🍎', P), mark('logo', 'bear', 'Bear Line', 11, '🐻', P), mark('logo', 'tulip', 'Tulip Line', 12, '🌷', P),
  mark('logo', 'gem', 'Gem Line', 12, '💠', P), mark('logo', 'paw', 'Paw Line', 13, '🐾', P), mark('logo', 'planet', 'Planet Line', 14, '🪐', P), mark('logo', 'crab', 'Crab Line', 14, '🦀', P),
  mark('logo', 'owl', 'Owl Line', 15, '🦉', P),
] as const;

// ---------- the whole catalogue ----------

export const ITEMS: readonly Item[] = [...PIECES, ...DECOR, ...CRANES, ...PARTS, ...CRANE_PAINTS, ...SHIPS, ...PAINTS, ...MARKS, ...BOX_COLOURS, ...STRIPE_ITEMS, ...LOGOS];
/** Free from the start: the pier's Dock Crane, the Tug, and the plain parts and looks. */
export const STARTERS: readonly string[] = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE: readonly Item[] = ITEMS.filter(i => i.price > 0);
export const isItemId = (x: unknown): x is string => typeof x === 'string' && ITEMS.some(i => i.id === x);
export const itemOf = (id: string): Item => ITEMS.find(i => i.id === id)!;
export type ItemName = (typeof PIECES)[number]['name'] | (typeof DECOR)[number]['name'] | (typeof CRANES)[number]['name'] | (typeof PARTS)[number]['name']
  | (typeof CRANE_PAINTS)[number]['name'] | (typeof SHIPS)[number]['name'] | (typeof PAINTS)[number]['name'] | (typeof MARKS)[number]['name']
  | (typeof BOX_COLOURS)[number]['name'] | (typeof STRIPE_ITEMS)[number]['name'] | (typeof LOGOS)[number]['name'];
export const ITEM_NAMES = ITEMS.map(i => i.name as ItemName);

/** The speeds and grab of a crane with these parts. */
export function craneSpec(owned: (id: string) => boolean): CraneSpec {
  const rank = (slot: 'cable' | 'trolley') => Math.max(0, ...PARTS.filter(p => p.slot === slot && owned(p.id)).map(p => p.rank));
  return { cable: CABLE_SPEED[rank('cable')]!, trolley: TROLLEY_SPEED[rank('trolley')]!, twin: owned('part:twin') };
}

// ---------- the again-and-again things ----------

export const REPEATS = [
  { id: 'berth', name: 'Another Berth', icon: '⚓', start: 60, step: 10, top: 120, needs: 'piece:berth10' },
  { id: 'block', name: 'Another Yard Block', icon: '📦', start: 30, step: 5, top: 60, needs: 'piece:yard' },
  { id: 'shed', name: 'Another Warehouse', icon: '🏚️', start: 50, step: 10, top: 100, needs: 'piece:shed' },
  { id: 'rail', name: 'More Rail', icon: '🛤️', start: 25, step: 5, top: 50, needs: 'piece:rail' },
  { id: 'crane', name: 'Another Crane', icon: '🏗️', start: 80, step: 10, top: 160, needs: 'crane:gantry' },
] as const;
export type RepeatId = (typeof REPEATS)[number]['id'];
export type RepeatName = (typeof REPEATS)[number]['name'];
export const REPEAT_IDS = REPEATS.map(r => r.id) as RepeatId[];
export const repeatOf = (id: RepeatId) => REPEATS.find(r => r.id === id)!;
/** The price of the next one: rising gently, then flat. */
export const repeatPrice = (id: RepeatId, have: number) => { const r = repeatOf(id); return Math.min(r.top, r.start + r.step * have); };

/** Names he taps through for a ship of his own (each said). */
export const SHIP_NAMES = [
  'Sea Star', 'Big Blue', 'Sunny', 'Gull', 'Whale', 'Comet', 'Pebble', 'Rocket', 'Lucky', 'Tiger', 'Puffin', 'Thunder',
  'Coral', 'Captain', 'Seal', 'Polly', 'Bubbles', 'Rusty', 'Dolphin', 'Storm', 'Kelp', 'Starfish', 'Hero', 'Breeze',
] as const;
export type ShipName = (typeof SHIP_NAMES)[number];

export { SHIP_KINDS };
