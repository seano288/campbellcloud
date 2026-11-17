// The Rivals, and every number that sets how hard a Race is, in one table. Each Cup has three Rivals who race all four of its tracks.
// Tracks 1 to 3 each feature one of them, whose part he wins by finishing ahead of that one Rival (not by coming first); the fourth,
// the Cup Final, features the Cup's champion again for the Cup's trophy. The other two Rivals run as the pack, a little slower.
//
// Rival pace is measured, not guessed, but only against a scripted child (race.test.ts): the first Rival is a sure thing in the
// starter car, a plausible car for that point in the ladder beats each Rival, and every Rival falls to the starter car in the end,
// because a Rival who beats him gets slower each time (MERCY) until he wins. Rivals also ease off when far ahead (sim.ts, EASE).
import type { Car, PartKey, Stats } from '../garage/parts';
import { TRACKS, type CupId, type Surface, type TrackDef } from './tracks';

export const RIVAL_NAMES = [
  'Zippy', 'Sparky', 'Ace', 'Dusty', 'Muddy', 'Rocky', 'Sandy', 'Dune', 'Sunny', 'Chilly', 'Blizzard', 'Icicle', 'Neon', 'Shadow', 'Midnight', 'Magma', 'Ember', 'Blaze',
] as const;
export type RivalName = (typeof RIVAL_NAMES)[number];

export interface Rival {
  readonly id: string;
  readonly name: RivalName;
  readonly cup: CupId;
  /** Its Speed and Grip numbers, as the Garage counts his. */
  readonly speed: number;
  readonly grip: number;
  readonly boosts: number;
  /** The part he wins by beating it. */
  readonly prize: PartKey;
  readonly look: Omit<Car, 'number'>;
  readonly number: number;
}

const look = (body: string, paint: string, wing: string, decal: string, rims = 'plain', engine = 'v8'): Omit<Car, 'number'> => ({
  body: `body:${body}`, engine: `engine:${engine}`, tyres: 'tyres:street', wing: `wing:${wing}`, booster: 'booster:puffer', paint: `paint:${paint}`,
  rims: `rims:${rims}`, decal: `decal:${decal}`, horn: 'horn:honk', flame: 'flame:orange',
});

// THE TUNING TABLE. Speed is the Garage's Speed number (his starter car is 40, the best shop car 95).
const R = (name: RivalName, cup: CupId, speed: number, grip: number, boosts: number, prize: string, l: Omit<Car, 'number'>, number: number): Rival =>
  ({ id: name.toLowerCase(), name, cup, speed, grip, boosts, prize: prize as PartKey, look: l, number });
export const RIVALS: readonly Rival[] = [
  R('Zippy', 'tarmac', 20, 32, 1, 'wing:zippy', look('kart', 'blue', 'little', 'stripes'), 3),
  R('Sparky', 'tarmac', 30, 36, 1, 'rims:sparky', look('buggy', 'yellow', 'none', 'bolts', 'star'), 11),
  R('Ace', 'tarmac', 35, 40, 1, 'body:ace', look('stock', 'white', 'spoiler', 'checkers', 'red'), 1),
  R('Dusty', 'dirt', 43, 44, 1, 'tyres:mud', look('buggy', 'brown', 'little', 'dots'), 22),
  R('Muddy', 'dirt', 46, 46, 2, 'decal:splash', look('rally', 'green', 'duck', 'side'), 8),
  R('Rocky', 'dirt', 49, 48, 2, 'engine:crusher', look('muscle', 'silver', 'spoiler', 'zigzag', 'spoke'), 44),
  R('Sandy', 'sand', 53, 50, 2, 'tyres:dune', look('buggy', 'lemon', 'little', 'swirls'), 5),
  R('Dune', 'sand', 56, 52, 2, 'body:jumper', look('rally', 'orange', 'duck', 'tiger'), 17),
  R('Sunny', 'sand', 59, 54, 2, 'flame:sun', look('sports', 'sunset', 'spoiler', 'stars', 'gold'), 9),
  R('Chilly', 'snow', 62, 56, 2, 'tyres:ice', look('rally', 'ice', 'duck', 'stripes'), 14),
  R('Blizzard', 'snow', 65, 58, 3, 'decal:snow', look('stock', 'white', 'big', 'zigzag', 'blue'), 31),
  R('Icicle', 'snow', 68, 60, 3, 'wing:icicle', look('formula', 'teal', 'big', 'bubbles', 'chrome'), 2),
  R('Neon', 'night', 71, 62, 3, 'paint:neon', look('sports', 'purple', 'spoiler', 'comet', 'flower'), 77),
  R('Shadow', 'night', 74, 64, 3, 'body:shadow', look('endurance', 'black', 'twin', 'shark', 'chrome'), 13),
  R('Midnight', 'night', 77, 66, 3, 'rims:moon', look('muscle', 'navy', 'big', 'stars', 'diamond'), 12),
  R('Magma', 'volcano', 80, 68, 3, 'engine:magma', look('dragster', 'fire', 'big', 'flames', 'gold'), 66),
  R('Ember', 'volcano', 83, 70, 4, 'booster:ember', look('endurance', 'cherry', 'twin', 'dragon', 'zap'), 21),
  R('Blaze', 'volcano', 86, 72, 4, 'body:blaze', look('rocket', 'gold', 'mega', 'goldtrim', 'rainbow'), 99),
];
/** The Cup Final's champion goes this much faster than when it raced its own track. */
export const FINAL_SPEED = 2;
/** The two Rivals not featured run at this share of their speed. */
export const PACK = .9;
/** Each time the featured Rival beats him on a track it gets this much slower there, down to FLOOR of its pace. */
export const MERCY = .07, FLOOR = .4;
/** A Rival's look is no help to him on the track: they always have the right tyres. */
const rightTyres = (): Record<Surface, number> => ({ tarmac: 1, dirt: 1, sand: 1, snow: 1 });

export const rivalBy = (id: string) => RIVALS.find(r => r.id === id)!;
export const rivalsIn = (cup: CupId) => RIVALS.filter(r => r.cup === cup);
export const isRivalId = (x: unknown): x is string => typeof x === 'string' && RIVALS.some(r => r.id === x);

/** Who a track features: tracks 1 to 3 of a Cup one Rival each, the fourth (the Cup Final) the champion again. */
export function featuredOn(track: TrackDef): Rival {
  const inCup = TRACKS.filter(t => t.cup === track.cup), k = inCup.indexOf(track), crew = rivalsIn(track.cup);
  return crew[Math.min(k, crew.length - 1)]!;
}
export const isFinal = (track: TrackDef) => TRACKS.filter(t => t.cup === track.cup).indexOf(track) === 3;

/** The pace a Rival runs at: a share of its top speed. */
export const mercy = (losses: number) => Math.max(FLOOR, 1 - MERCY * losses);

export interface Starter { readonly rival: Rival; readonly stats: Stats; readonly pace: number; readonly featured: boolean }
/** The three Rivals on the grid for a track, the featured one first, with how fast each will go. */
export function gridFor(track: TrackDef, losses: number): Starter[] {
  const star = featuredOn(track), final = isFinal(track);
  const crew = rivalsIn(track.cup);
  return [star, ...crew.filter(r => r !== star)].map(r => {
    const featured = r === star, speed = r.speed + (featured && final ? FINAL_SPEED : 0);
    return { rival: r, featured, pace: featured ? mercy(losses) : PACK, stats: { speed, grip: r.grip, boosts: r.boosts, suits: rightTyres(), kick: 1 } };
  });
}

