// The sea chart, the ships that arrive, and the crates they bring back: the endless layer.
//
// - Harbours. Twenty-four named ones, sailed to in order, each with a crate of its own (a decoration, a container colour, a stripe or a
//   company mark, never sold). A harbour that needs a piece he hasn't built (the Lighthouse for a night harbour, the Fog Horn for a foggy
//   one, the Breakwater for a stormy one) waits, and the next one is sailed to instead, so he is never stuck. Past them, the chart goes on
//   for ever: Harbour 25, 26 ... each generated from its number (seeded: the same harbour every time), with a name made from two word
//   clips and a flag made from parts (colours, a pattern and a symbol) for his flag wall.
// - Arrivals. Each go loads the ship at the quay. It is his own ship when he has picked one (and a ship he has just bought), else a
//   visiting ship generated from the go's number: its kind, its length and height (growing gently with the number, as far as his crane
//   reaches, so bigger ships arrive as his cranes get better), its colours, funnel mark and name. Every fifth go brings a special crate:
//   twelve hand-made prizes, then numbered Lucky Containers made from parts, without end. None of them is ever sold.
import { seeded, pick, int, shuffle, type Rng } from '../../game/rng';
import { STRIPES, type BoxLook } from '../art/container';
import { SHIP_KINDS, type ShipKind, type ShipLook } from '../art/ship';
import type { ShipShape } from '../crane/sim';

// ---------- flags from parts ----------

export const FLAG_COLOURS = ['#e63946', '#2f6fe0', '#ffd23f', '#2fa84f', '#ffffff', '#141414', '#ff7a00', '#7b4bd1', '#1aa3a3', '#ff6fb5', '#8a4b2a', '#68c3f5'] as const;
export const FLAG_PATTERNS = ['stripes', 'bars', 'cross', 'diagonal', 'quarters', 'border', 'circle', 'triangle'] as const;
export const FLAG_SYMBOLS = ['⭐', '⚓', '🐟', '🌙', '☀️', '🐚', '🌊', '🦀', '🐳', '❄️', '🌴', '🦜', '⛵', '🍀', '🔥', '💎'] as const;
export interface Flag { readonly a: string; readonly b: string; readonly c: string; readonly pattern: (typeof FLAG_PATTERNS)[number]; readonly symbol: string }
export function flagFor(rng: Rng): Flag {
  const [a, b, c] = shuffle(rng, FLAG_COLOURS);
  return { a: a!, b: b!, c: c!, pattern: pick(rng, FLAG_PATTERNS), symbol: rng() < 0.7 ? pick(rng, FLAG_SYMBOLS) : '' };
}

// ---------- harbours ----------

export type Weather = 'clear' | 'night' | 'fog' | 'storm' | 'snow';
export interface Harbour {
  readonly id: string;
  /** 1 to 24 for the named ones, then the chart number. */
  readonly n: number;
  readonly name: string;
  readonly icon: string;
  readonly weather: Weather;
  /** A piece he must build before he can sail here. */
  readonly needs: string | null;
  readonly flag: Flag;
  /** The crate it sends back, for the named ones. */
  readonly crate: Crate | null;
}

export interface Crate { readonly id: string; readonly name: string; readonly kind: 'decor' | 'box' | 'stripe' | 'logo' | 'paint'; readonly icon: string; readonly hex?: string; readonly glyph?: string }
const c = <const N extends string>(id: string, name: N, kind: Crate['kind'], icon: string, more: { hex?: string; glyph?: string } = {}) => ({ id: `crate:${id}`, name, kind, icon, ...more }) as Crate & { readonly name: N };

const NEEDS: Record<Weather, string | null> = { clear: null, night: 'piece:lighthouse', fog: 'piece:foghorn', storm: 'piece:breakwater', snow: null };
const h = <const N extends string, const C extends Crate>(n: number, name: N, icon: string, weather: Weather, crate: C) =>
  ({ id: `h${n}`, n, name, icon, weather, needs: NEEDS[weather], flag: flagFor(seeded(n * 101)), crate }) as Harbour & { readonly name: N; readonly crate: C };

export const HARBOURS = [
  h(1, 'Pebble Bay', '🪨', 'clear', c('pebble', 'Pebble Path', 'decor', '🪨')),
  h(2, 'Sunny Cove', '☀️', 'clear', c('sunbox', 'Sunshine Box', 'box', '🟨', { hex: '#ffdd4a' })),
  h(3, 'Gull Island', '🕊️', 'clear', c('gullnest', 'Gull Nest', 'decor', '🪺')),
  h(4, 'Coral Harbour', '🪸', 'clear', c('coralbox', 'Coral Box', 'box', '🟥', { hex: '#ff6f61' })),
  h(5, 'Fishtown', '🐟', 'clear', c('fishsign', 'Fish Sign', 'decor', '🐟')),
  h(6, 'Windy Point', '💨', 'clear', c('windsock', 'Windsock', 'decor', '🎐')),
  h(7, 'Lighthouse Rock', '🗼', 'night', c('beamstripe', 'Beam Stripe', 'stripe', '➖', { glyph: 'band' })),
  h(8, 'Palm Beach', '🌴', 'clear', c('palms', 'Palm Trees', 'decor', '🌴')),
  h(9, 'Big City Docks', '🏙️', 'clear', c('citylogo', 'City Line', 'logo', '🏙️', { glyph: '🏙️' })),
  h(10, 'Misty Isle', '🌫️', 'fog', c('mistbox', 'Misty Box', 'box', '⬜', { hex: '#c9d6df' })),
  h(11, 'Turtle Bay', '🐢', 'clear', c('turtlepond', 'Turtle Pond', 'decor', '🐢')),
  h(12, 'Snowy Port', '❄️', 'snow', c('snowman', 'Snowman', 'decor', '⛄')),
  h(13, 'Whale Sound', '🐳', 'clear', c('whalelogo', 'Whale Tail Line', 'logo', '🐳', { glyph: '🐳' })),
  h(14, 'Rainbow Cove', '🌈', 'clear', c('rainbowbox', 'Rainbow Box', 'box', '🌈', { hex: '#b65cff' })),
  h(15, 'Storm Point', '⛈️', 'storm', c('stormstripe', 'Zigzag Stripe', 'stripe', '⚡', { glyph: 'chevron' })),
  h(16, 'Moonlight Harbour', '🌙', 'night', c('moonlogo', 'Moon Line', 'logo', '🌙', { glyph: '🌙' })),
  h(17, 'Volcano Isle', '🌋', 'clear', c('lavabox', 'Lava Box', 'box', '🟧', { hex: '#ff4d1a' })),
  h(18, 'Seal Rocks', '🦭', 'clear', c('sealstatue', 'Seal Statue', 'decor', '🦭')),
  h(19, 'Fog Bay', '🌁', 'fog', c('foglamp', 'Fog Lamps', 'decor', '🏮')),
  h(20, 'Starfish Reef', '⭐', 'clear', c('starlogo', 'Starfish Line', 'logo', '⭐', { glyph: '🌟' })),
  h(21, 'Polar Station', '🐧', 'snow', c('icebox', 'Ice Box', 'box', '🟦', { hex: '#bfe8ff' })),
  h(22, 'Golden Sands', '🏖️', 'clear', c('goldbox', 'Gold Box', 'box', '🟨', { hex: '#d4a62a' })),
  h(23, 'Thunder Bay', '🌩️', 'storm', c('lighthouse2', 'Little Lighthouse', 'decor', '🗼')),
  h(24, 'Kingfisher Quay', '🐦', 'clear', c('crownlogo', 'Crown Line', 'logo', '👑', { glyph: '👑' })),
] as const;
export type HarbourName = (typeof HARBOURS)[number]['name'];
export const harbourById = (id: string) => HARBOURS.find(x => x.id === id) ?? null;
export const CRATES = HARBOURS.map(x => x.crate);

/** Names for the chart past the named harbours: a first part and a second, each a clip. 18 × 12 = 216 names before they repeat with a number. */
export const CHART_FIRST = ['Shell', 'Puffin', 'Otter', 'Maple', 'Copper', 'Silver', 'Driftwood', 'Lobster', 'Heron', 'Pine', 'Amber', 'Saltmarsh', 'Kelp', 'Sandpiper', 'Bluebell', 'Granite', 'Willow', 'Osprey'] as const;
export const CHART_SECOND = ['Bay', 'Cove', 'Harbour', 'Point', 'Island', 'Quay', 'Sound', 'Haven', 'Rocks', 'Inlet', 'Port', 'Landing'] as const;
export type ChartWord = (typeof CHART_FIRST)[number] | (typeof CHART_SECOND)[number];
const WEATHERS: readonly Weather[] = ['clear', 'clear', 'clear', 'night', 'fog', 'storm', 'snow'];
const CHART_ICONS = ['⚓', '🏝️', '🌅', '🗺️', '🐚', '🦀', '🌊', '⛵', '🏖️', '🪸', '🌴', '🐬'] as const;

export const FIRST_CHART = HARBOURS.length + 1;
/** A chart harbour past the named ones, generated from its number: the same every time. Never needs a piece (only named harbours wait). */
export function chartHarbour(n: number): Harbour & { name: string; first: ChartWord; second: ChartWord; round: number } {
  const k = n - FIRST_CHART, rng = seeded(n * 7919 + 17);
  const combos = CHART_FIRST.length * CHART_SECOND.length;
  // walk the names in a scrambled order so neighbours differ
  const i = (k * 97) % combos, first = CHART_FIRST[i % CHART_FIRST.length]!, second = CHART_SECOND[Math.floor(i / CHART_FIRST.length)]!;
  const round = Math.floor(k / combos);
  return {
    id: `c${n}`, n, name: `${first} ${second}${round ? ` ${round + 1}` : ''}`, first, second, round, icon: pick(rng, CHART_ICONS),
    weather: pick(rng, WEATHERS), needs: null, flag: flagFor(rng), crate: null,
  };
}

// ---------- ships that arrive ----------

/** Visiting ships' names: a word and a word (each a clip). */
export const VISITOR_FIRST = ['Blue', 'Red', 'Golden', 'Swift', 'Happy', 'Brave', 'Jolly', 'Little', 'Mighty', 'Silver', 'Sunny', 'Lucky'] as const;
export const VISITOR_SECOND = ['Pelican', 'Otter', 'Dolphin', 'Wave', 'Star', 'Gull', 'Walrus', 'Penguin', 'Marlin', 'Breeze', 'Puffin', 'Comet'] as const;
export type VisitorWord = (typeof VISITOR_FIRST)[number] | (typeof VISITOR_SECOND)[number];
const HULLS = ['#1d3a6e', '#c8302a', '#1f8a6a', '#262626', '#ff7a00', '#0f6fa8', '#6b3fa0', '#8a4b2a', '#14a05a', '#4b5866', '#ff6f91', '#1aa3a3'];
const TRIMS = ['#ffffff', '#ffd23f', '#ff7a00', '#141414', '#68c3f5'];
const FUNNEL_MARKS = ['⚓', '⭐', '🌊', '☀️', '🐟', '🐳', '❤️', '⚡', '🌙', '👑', '🐚', '🧭', '🍀', '🔥', '❄️', '🌍'];
/** The kinds a visitor can be, by how many containers it takes. */
const KINDS_BY_SIZE: [number, ShipKind[]][] = [[3, ['tug', 'fishing', 'research']], [6, ['ferry', 'feeder', 'icebreaker', 'tanker']], [99, ['carcarrier', 'boxship', 'liner', 'feeder']]];

export interface Visitor { readonly n: number; readonly look: ShipLook; readonly shape: ShipShape; readonly first: VisitorWord; readonly second: VisitorWord }
/** The visiting ship for go `n`, as big as his crane reaches: it grows by a stack about every eight goes and a tier about every twenty,
 *  with a little variety, so some small ships still come. */
export function visitor(n: number, reach: ShipShape): Visitor {
  const rng = seeded(n * 104729 + 3);
  const cols = Math.max(2, Math.min(reach.cols, 2 + Math.floor(n / 8) - int(rng, 0, 1)));
  const tiers = Math.max(1, Math.min(reach.tiers, 1 + Math.floor(n / 20) - (rng() < 0.3 ? 1 : 0)));
  const size = cols * tiers, kinds = KINDS_BY_SIZE.find(([most]) => size <= most)![1];
  const first = pick(rng, VISITOR_FIRST), second = pick(rng, VISITOR_SECOND);
  const hull = pick(rng, HULLS);
  return { n, shape: { cols, tiers }, first, second, look: { kind: pick(rng, kinds), hull, trim: pick(rng, TRIMS.filter(t => t !== hull)), funnel: pick(rng, ['#ffd23f', '#e63946', '#2f6fe0', '#ffffff', '#141414']), mark: pick(rng, FUNNEL_MARKS), name: `${first} ${second}` } };
}

// ---------- special crates: every fifth go ----------

export const SPECIAL_EVERY = 5;
export interface Special { readonly id: string; readonly name: string; readonly icon: string; readonly kind: 'decor' | 'box' | 'stripe' | 'logo' | 'lucky'; readonly hex?: string; readonly look?: BoxLook; readonly number?: number }
const s = <const N extends string>(id: string, name: N, kind: Special['kind'], icon: string, hex?: string) => ({ id: `special:${id}`, name, kind, icon, ...(hex && { hex }) }) as Special & { readonly name: N };
export const SPECIALS = [
  s('goldbox', 'Shiny Gold Box', 'box', '🟨', '#ffcf3a'), s('glow', 'Glow Box', 'box', '🟩', '#7dff6a'), s('treasure', 'Treasure Chest', 'decor', '💰'),
  s('mermaid', 'Mermaid Statue', 'decor', '🧜'), s('whalefountain', 'Whale Fountain', 'decor', '🐳'), s('anchorlogo', 'Golden Anchor Line', 'logo', '⚓'),
  s('night', 'Night Sky Box', 'box', '🟦', '#1b2a6b'), s('ferris', 'Ferris Wheel', 'decor', '🎡'), s('rocketlogo', 'Space Line', 'logo', '🚀'),
  s('candy', 'Candy Box', 'box', '🟪', '#ff7ad9'), s('carousel', 'Carousel', 'decor', '🎠'), s('dragonlogo', 'Sea Dragon Line', 'logo', '🐉'),
] as const;
export type SpecialName = (typeof SPECIALS)[number]['name'] | 'Lucky Container';
/** The special crate on go `n` (every fifth go), or null. The hand-made ones first, then numbered Lucky Containers from parts. */
export function specialFor(n: number): Special | null {
  if (n % SPECIAL_EVERY !== 0) return null;
  const k = n / SPECIAL_EVERY - 1;
  if (k < SPECIALS.length) return SPECIALS[k]!;
  const number = k - SPECIALS.length + 1, rng = seeded(number * 6151 + 29);
  const look: BoxLook = { hex: pick(rng, ['#ff4f8b', '#22d3c5', '#ffb000', '#7c5cff', '#3ddc84', '#ff6b35', '#00a6ff', '#e0e0e0']), stripe: pick(rng, STRIPES.filter(x => x !== 'none')), stripeHex: pick(rng, ['#ffffff', '#141414', '#ffd23f']), mark: pick(rng, ['🍀', '⭐', '💎', '🌈', '🎈', '🪐', '🦄', '🎯']) };
  return { id: `lucky:${number}`, name: 'Lucky Container', kind: 'lucky', icon: '🍀', look, number };
}
export const isSpecialId = (x: unknown): x is string => typeof x === 'string' && (SPECIALS.some(p => p.id === x) || /^lucky:[1-9]\d{0,6}$/.test(x));
export const specialById = (id: string): Special | null => SPECIALS.find(p => p.id === id) ?? (/^lucky:(\d+)$/.test(id) ? specialFor((Number(id.slice(6)) + SPECIALS.length) * SPECIAL_EVERY) : null);

export { SHIP_KINDS };
