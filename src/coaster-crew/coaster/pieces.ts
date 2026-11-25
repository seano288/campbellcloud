// Track pieces: what each one is shaped like, where it fits, and what it costs. A coaster is a row of pieces joined end to end after the
// station (coaster/track.ts). Heights are in steps (one step is four metres); a piece fits only where its shape does: a drop needs height
// to drop from, a splash pool sits on the ground, nothing goes above the top of the sky (MAX_H). Whether the car can get over a piece is
// not a fit: the builder lets him add a hill too tall to climb and then shows the car rolling back (the lesson), with the two honest fixes.
//
// Owning a piece lets him use it as often as he likes. A track's length is capped by his track slots ("More Track", bought again and
// again), not by what he owns.

export const STEP = 4;
export const MAX_H = 14;

export type Geo =
  /** A chain lifts the car to this height. */
  | { readonly g: 'lift'; readonly to: number }
  /** Down by d steps; steep ones are shorter and steeper. */
  | { readonly g: 'drop'; readonly d: number; readonly steep?: boolean }
  /** Up by u and back down. */
  | { readonly g: 'hump'; readonly u: number }
  /** Up by u, without a chain. */
  | { readonly g: 'climb'; readonly u: number }
  /** Down by d and back up. */
  | { readonly g: 'dip'; readonly d: number }
  /** A loop r steps across (2r tall); n loops one after the other. */
  | { readonly g: 'loop'; readonly r: number; readonly n: number }
  /** Turns upside down on a small rise: corkscrews and rolls. They rub a little more. */
  | { readonly g: 'twist'; readonly u: number; readonly turns: number; readonly look: 'corkscrew' | 'roll' | 'cobra' }
  /** Flat track of some kind. */
  | { readonly g: 'flat'; readonly l: number; readonly look: FlatLook; readonly drag?: number; readonly boost?: number; readonly brake?: number }
  /** Down into a pool of water on the ground and out again: the water slows it a lot. */
  | { readonly g: 'splash'; readonly l: number };
export type FlatLook = 'straight' | 'tunnel' | 'turn' | 'helix' | 'wave' | 'booster' | 'brakes';

export type Family = 'lift' | 'drop' | 'hill' | 'loop' | 'twist' | 'flat' | 'water' | 'speed';
export interface Piece {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly family: Family;
  readonly geo: Geo;
  readonly icon: string;
  /** Never sold: won on a Guest Coaster. Its rails are drawn gold. */
  readonly prize?: boolean;
}
const p = <const N extends string>(id: string, name: N, price: number, family: Family, icon: string, geo: Geo) =>
  ({ id: `pc:${id}`, name, price, family, icon, geo }) as Piece & { readonly name: N };

/** The pieces for sale (the free ones he starts with have price 0). */
export const PIECES = [
  // lifts
  p('lift3', 'Little Lift', 0, 'lift', '⛓️', { g: 'lift', to: 3 }),
  p('lift5', 'Lift Hill', 14, 'lift', '⛓️', { g: 'lift', to: 5 }),
  p('lift7', 'Big Lift', 38, 'lift', '⛓️', { g: 'lift', to: 7 }),
  p('lift9', 'Giant Lift', 85, 'lift', '⛓️', { g: 'lift', to: 9 }),
  p('lift11', 'Sky Lift', 170, 'lift', '⛓️', { g: 'lift', to: 11 }),
  p('lift13', 'Mega Lift', 290, 'lift', '⛓️', { g: 'lift', to: 13 }),
  // drops
  p('drop2', 'Little Drop', 0, 'drop', '⬇️', { g: 'drop', d: 2 }),
  p('drop3', 'Drop', 6, 'drop', '⬇️', { g: 'drop', d: 3 }),
  p('drop5', 'Big Drop', 24, 'drop', '⬇️', { g: 'drop', d: 5 }),
  p('drop7', 'Steep Drop', 55, 'drop', '⏬', { g: 'drop', d: 7, steep: true }),
  p('drop9', 'Giant Drop', 120, 'drop', '⏬', { g: 'drop', d: 9, steep: true }),
  p('drop11', 'Sky Drop', 230, 'drop', '⏬', { g: 'drop', d: 11, steep: true }),
  // hills
  p('hop1', 'Bunny Hop', 4, 'hill', '〰️', { g: 'hump', u: 1 }),
  p('hump2', 'Hump', 9, 'hill', '⛰️', { g: 'hump', u: 2 }),
  p('camel3', 'Camelback', 20, 'hill', '🐫', { g: 'hump', u: 3 }),
  p('camel4', 'Big Camelback', 42, 'hill', '🐫', { g: 'hump', u: 4 }),
  p('tophat', 'Top Hat', 140, 'hill', '🎩', { g: 'hump', u: 6 }),
  p('climb1', 'Little Climb', 7, 'hill', '↗️', { g: 'climb', u: 1 }),
  p('climb2', 'Climb', 16, 'hill', '↗️', { g: 'climb', u: 2 }),
  p('dip1', 'Dip', 5, 'hill', '↘️', { g: 'dip', d: 1 }),
  p('dip2', 'Valley', 13, 'hill', '🏞️', { g: 'dip', d: 2 }),
  // loops and twists
  p('loop', 'Loop', 36, 'loop', '➰', { g: 'loop', r: 1, n: 1 }),
  p('bigloop', 'Big Loop', 75, 'loop', '➰', { g: 'loop', r: 1.5, n: 1 }),
  p('double', 'Double Loop', 150, 'loop', '➿', { g: 'loop', r: 1, n: 2 }),
  p('cork', 'Corkscrew', 30, 'twist', '🌀', { g: 'twist', u: 1, turns: 1, look: 'corkscrew' }),
  p('cork2', 'Double Corkscrew', 68, 'twist', '🌀', { g: 'twist', u: 1, turns: 2, look: 'corkscrew' }),
  p('zerog', 'Zero-G Roll', 52, 'twist', '🔄', { g: 'twist', u: 2, turns: 1, look: 'roll' }),
  p('heart', 'Heartline Roll', 46, 'twist', '💗', { g: 'twist', u: 0, turns: 1, look: 'roll' }),
  p('cobra', 'Cobra Roll', 110, 'twist', '🐍', { g: 'twist', u: 2, turns: 2, look: 'cobra' }),
  // flat track
  p('straight', 'Straight', 0, 'flat', '➖', { g: 'flat', l: 14, look: 'straight' }),
  p('long', 'Long Straight', 5, 'flat', '➖', { g: 'flat', l: 28, look: 'straight' }),
  p('tunnel', 'Tunnel', 12, 'flat', '🕳️', { g: 'flat', l: 18, look: 'tunnel' }),
  p('longtunnel', 'Long Tunnel', 27, 'flat', '🕳️', { g: 'flat', l: 34, look: 'tunnel' }),
  p('turn', 'Banked Turn', 9, 'flat', '↪️', { g: 'flat', l: 18, look: 'turn', drag: 0.03 }),
  p('wave', 'Wave Turn', 19, 'flat', '🌊', { g: 'flat', l: 22, look: 'wave', drag: 0.03 }),
  p('helix', 'Helix', 26, 'flat', '🌪️', { g: 'flat', l: 30, look: 'helix', drag: 0.035 }),
  p('helix2', 'Double Helix', 58, 'flat', '🌪️', { g: 'flat', l: 50, look: 'helix', drag: 0.035 }),
  p('brakes', 'Brakes', 3, 'flat', '🛑', { g: 'flat', l: 14, look: 'brakes', brake: 5 }),
  // water
  p('splash', 'Splash Pool', 23, 'water', '💦', { g: 'splash', l: 24 }),
  p('bigsplash', 'Big Splash', 62, 'water', '🌊', { g: 'splash', l: 40 }),
  // speed
  p('boost', 'Booster', 40, 'speed', '⚡', { g: 'flat', l: 16, look: 'booster', boost: 18 }),
  p('bigboost', 'Big Booster', 95, 'speed', '⚡', { g: 'flat', l: 22, look: 'booster', boost: 24 }),
  p('launch', 'Rocket Launch', 180, 'speed', '🚀', { g: 'flat', l: 30, look: 'booster', boost: 30 }),
] as const;

/** Pieces never sold: one comes with every fifth Guest Coaster (guest.ts) until all are won. */
export const PRIZE_PIECES = [
  p('gold-loop', 'Golden Loop', 0, 'loop', '🏅', { g: 'loop', r: 1.25, n: 1 }),
  p('thunder', 'Thunder Booster', 0, 'speed', '🌩️', { g: 'flat', l: 20, look: 'booster', boost: 27 }),
  p('rainbow-drop', 'Rainbow Drop', 0, 'drop', '🌈', { g: 'drop', d: 6, steep: true }),
  p('star-cork', 'Star Corkscrew', 0, 'twist', '⭐', { g: 'twist', u: 1, turns: 3, look: 'corkscrew' }),
  p('moon-hill', 'Moon Hill', 0, 'hill', '🌙', { g: 'hump', u: 5 }),
  p('triple', 'Triple Loop', 0, 'loop', '➿', { g: 'loop', r: 1, n: 3 }),
  p('comet-lift', 'Comet Lift', 0, 'lift', '☄️', { g: 'lift', to: 14 }),
  p('dragon-dive', 'Dragon Dive', 0, 'drop', '🐉', { g: 'drop', d: 13, steep: true }),
  p('jelly-hops', 'Jelly Hops', 0, 'hill', '🍮', { g: 'hump', u: 1.5 }),
  p('geyser', 'Geyser Splash', 0, 'water', '⛲', { g: 'splash', l: 30 }),
].map(x => ({ ...x, prize: true })) as readonly (Piece & { readonly name: (typeof PRIZE_PIECES_NAMES)[number] })[];
const PRIZE_PIECES_NAMES = ['Golden Loop', 'Thunder Booster', 'Rainbow Drop', 'Star Corkscrew', 'Moon Hill', 'Triple Loop', 'Comet Lift', 'Dragon Dive', 'Jelly Hops', 'Geyser Splash'] as const;

export const ALL_PIECES: readonly Piece[] = [...PIECES, ...PRIZE_PIECES];
const byId = new Map(ALL_PIECES.map(x => [x.id, x]));
export const isPieceId = (x: unknown): x is string => typeof x === 'string' && byId.has(x);
export const pieceOf = (id: string): Piece => { const x = byId.get(id); if (!x) throw new Error(`no piece ${id}`); return x; };
export type PieceName = (typeof PIECES)[number]['name'] | (typeof PRIZE_PIECES_NAMES)[number];

/** The height after this piece, starting at `h` steps, or null if it doesn't fit there. */
export function afterPiece(geo: Geo, h: number): number | null {
  switch (geo.g) {
    case 'lift': return geo.to > h && geo.to <= MAX_H ? geo.to : null;
    case 'drop': return h - geo.d >= 0 ? h - geo.d : null;
    case 'hump': return h + geo.u <= MAX_H ? h : null;
    case 'climb': return h + geo.u <= MAX_H ? h + geo.u : null;
    case 'dip': return h - geo.d >= 0 ? h : null;
    case 'loop': return h + 2 * geo.r <= MAX_H ? h : null;
    // a roll turns over above the ground: it needs a step of height under it
    case 'twist': return h >= 1 && h + geo.u <= MAX_H ? h : null;
    case 'flat': return h;
    case 'splash': return h === 0 ? 0 : null;
  }
}
/** Pieces that go upside down, for the Thrill number. */
export const inversions = (geo: Geo) => (geo.g === 'loop' ? geo.n : geo.g === 'twist' ? geo.turns : 0);

/** Heights after each piece of a track, from the ground (null at the first piece that doesn't fit). */
export function heights(ids: readonly string[]): (number | null)[] {
  let h: number | null = 0;
  return ids.map(id => (h = h === null ? null : afterPiece(pieceOf(id).geo, h)));
}
export const fitsAfter = (ids: readonly string[], id: string) => {
  const hs = heights(ids), h = hs.length ? hs[hs.length - 1]! : 0;
  return h !== null && afterPiece(pieceOf(id).geo, h) !== null;
};
