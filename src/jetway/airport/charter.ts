// Charter Flights: the endless layer, made on the spot. Each one is generated from its number: the town, the scenery, the weather, the
// wind, day or night, how far, the stars on the way and a little airport at the far end laid out from parts. The same number always
// gives the same Charter, so a reload changes nothing. Each is a little longer and windier than the last (to a ceiling, so it never
// gets hard to finish: the Flight can't be failed whatever the wind), and every fifth brings a Charter-only prize that is never sold:
// first a set of hand-made ones, then tails made from a picture and a colour, without end. charter.test.ts makes thousands and flies
// each one to its end with the scripted children in flight/sim.ts.
import { pick, seeded } from '../../game/rng';
import { PAINTS } from './catalog';
import { farAirport, SCENES, starsFor, type Destination, type Scene, type Weather } from './routes';

/** Charter towns, each said by the voice. */
export const TOWNS = ['Pine Bay', 'Maple Falls', 'Otter Creek', 'Sunny Hill', 'Fox Hollow', 'Blue Harbor', 'Willow Park', 'Bear Lake', 'Cedar Point', 'Rocky Ridge',
  'Golden Sands', 'Misty Glen', 'Eagle Peak', 'Coral Cove', 'Frost Valley', 'Berry Field', 'Windy Gap', 'Pebble Beach', 'Owl Woods', 'Thunder Bay',
  'Lantern Isle', 'Cactus Flats', 'Seal Rock', 'Apple Grove', 'Moon Lake', 'Kite Hill', 'Robin Wood', 'Clover Farm', 'Starry Point', 'Honey Meadow'] as const;
export type TownName = (typeof TOWNS)[number];

/** Charters open once he has flown this many Routes. */
export const CHARTER_OPENS = 3;
/** Every fifth Charter brings a prize. */
export const PRIZE_EVERY = 5;

/** The hand-made Charter prizes, in the order they come: tails, runway light colours and signs. Never sold. */
export const CHARTER_PRIZES = [
  { id: 'prize:comet', name: 'Comet Tail', kind: 'tail', glyph: '☄️', bg: '#1d3a78' },
  { id: 'prize:purple', name: 'Purple Runway Lights', kind: 'lights', hex: '#b26bff' },
  { id: 'prize:aurora', name: 'Aurora Tail', kind: 'tail', glyph: '🌌', bg: '#123a2a' },
  { id: 'prize:charter', name: 'Charter Sign', kind: 'sign', glyph: '🧭' },
  { id: 'prize:pink', name: 'Pink Runway Lights', kind: 'lights', hex: '#ff7ac8' },
  { id: 'prize:phoenix', name: 'Phoenix Tail', kind: 'tail', glyph: '🔥', bg: '#7a1010' },
  { id: 'prize:globe', name: 'Globe Sign', kind: 'sign', glyph: '🌍' },
  { id: 'prize:green', name: 'Green Runway Lights', kind: 'lights', hex: '#3ddc84' },
  { id: 'prize:whale', name: 'Whale Tail', kind: 'tail', glyph: '🐋', bg: '#0d4f6b' },
  { id: 'prize:trophy', name: 'Trophy Sign', kind: 'sign', glyph: '🏆' },
  { id: 'prize:rainbowlights', name: 'Rainbow Runway Lights', kind: 'lights', hex: 'rainbow' },
  { id: 'prize:ufo', name: 'Flying Saucer Tail', kind: 'tail', glyph: '🛸', bg: '#24262c' },
] as const;
export type CharterPrizeName = (typeof CHARTER_PRIZES)[number]['name'];
export type CharterPrize =
  | (typeof CHARTER_PRIZES)[number]
  /** After the hand-made ones: a tail made from a picture and a colour, numbered. */
  | { readonly id: `ctail:${number}`; readonly name: 'Charter Tail'; readonly kind: 'tail'; readonly glyph: string; readonly bg: string; readonly number: number };

const GLYPHS = ['🦅', '🐬', '🦋', '🐙', '🦊', '🐼', '🦁', '🐸', '🐧', '🦜', '🐝', '🐢', '🦒', '🐘', '🦖', '🍉', '🍩', '🎸', '⚽', '🎯', '🍀', '🌵', '🌻', '🍄', '⛵', '🏁', '🎈', '🪁', '🧸', '🎲'];

/** The prize the `n`th Charter brings, or null when it brings none. */
export function prizeFor(n: number): CharterPrize | null {
  if (n < 1 || n % PRIZE_EVERY) return null;
  const k = n / PRIZE_EVERY - 1;
  if (k < CHARTER_PRIZES.length) return CHARTER_PRIZES[k]!;
  const m = k - CHARTER_PRIZES.length + 1, colours = PAINTS.filter(p => p.hex !== 'rainbow');
  return { id: `ctail:${m}`, name: 'Charter Tail', kind: 'tail', glyph: GLYPHS[(m * 7) % GLYPHS.length]!, bg: colours[(m * 11 + Math.floor(m / GLYPHS.length)) % colours.length]!.hex, number: m };
}
export const prizeById = (id: string): CharterPrize | null => {
  const hand = CHARTER_PRIZES.find(p => p.id === id);
  if (hand) return hand;
  const m = /^ctail:(\d+)$/.exec(id);
  return m && Number(m[1]) >= 1 ? prizeFor((Number(m[1]) + CHARTER_PRIZES.length) * PRIZE_EVERY) : null;
};

const CHARTER_WEATHER: readonly Weather[] = ['clear', 'clear', 'cloud', 'cloud', 'rain', 'snow', 'wind', 'fog'];
/** How far and how windy, rising a little with each Charter and then holding. */
export const charterDistance = (n: number) => Math.round(5400 + Math.min(n, 80) * 40);
export const charterWind = (n: number, roll: number) => Math.min(.8, .15 + Math.min(n, 60) * .008 + roll * .15);

export function charter(n: number): Destination & { readonly n: number; readonly town: TownName; readonly prize: CharterPrize | null } {
  const rng = seeded(0x51ab + n * 7919), town = TOWNS[(n * 13 + Math.floor(n / TOWNS.length)) % TOWNS.length]!;
  const scene: Scene = pick(rng, SCENES), weather = pick(rng, CHARTER_WEATHER), night = n > 3 && rng() < .3, wind = charterWind(n, rng());
  const distance = charterDistance(n), count = Math.min(18, 10 + Math.floor(n / 10));
  return {
    id: `charter:${n}`, n, town, name: town, icon: '🧭', scene, weather, night, wind, distance,
    stars: starsFor(rng, distance, count), fires: [distance * .25, distance * .5, distance * .75].map(Math.round),
    far: farAirport(rng, Math.min(3, Math.floor(n / 20))), sea: scene === 'island' || scene === 'reef', needs: null, prize: prizeFor(n),
  };
}
