// The Rivals, and every number that sets how hard a Race is, in one table. Each Cup has three Rivals who race all four of its tracks.
// Tracks 1 to 3 each feature one of them, whose part he wins by finishing ahead of that one Rival (not by coming first); the fourth,
// the Cup Final, features the Cup's champion again for the Cup's trophy. The other Rivals run as the pack, a little slower.
//
// The four Cups added on 2026-11-21 (Jungle, Candy, Moon, Rainbow) have five Rivals each, so six cars race: the three who feature (and
// have prizes) and two more in the pack. They are faster than anything in the first six Cups, and slow down less after a win.
//
// A track he has beaten can be raced again for Stars (one, two, three): every Rival on the grid races at full pace and faster with each
// Star (STAR), and only first place wins it. The Mystery Race is an endless ladder of made-up tracks (tracks.ts, mysteryTrack), five
// Rivals from anywhere, faster at each Level (MYSTERY); first place goes up a Level.
//
// Rival pace is measured, not guessed, but only against a scripted child (race.test.ts): the first Rival is a sure thing in the
// starter car, a plausible car for that point in the ladder beats each Rival, and every Rival falls to the starter car in the end,
// because a Rival who beats him gets slower each time (MERCY) until he wins. Rivals also ease off when far ahead (sim.ts, EASE).
import type { Car, PartKey, Stats } from '../garage/parts';
import { EASE, LIGHT_EASE, type Ease } from './sim';
import { CUP_IDS, TRACKS, type CupId, type Surface, type TrackDef } from './tracks';

export const RIVAL_NAMES = [
  'Zippy', 'Sparky', 'Ace', 'Dusty', 'Muddy', 'Rocky', 'Sandy', 'Dune', 'Sunny', 'Chilly', 'Blizzard', 'Icicle', 'Neon', 'Shadow', 'Midnight', 'Magma', 'Ember', 'Blaze',
  'Mango', 'Tiki', 'Kong', 'Leafy', 'Jojo', 'Sprinkles', 'Gumdrop', 'Taffy', 'Fudge', 'Jelly', 'Luna', 'Orbit', 'Nova', 'Astro', 'Cosmo',
  'Prism', 'Dazzle', 'Thunder', 'Glimmer', 'Flash',
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
  /** The part he wins by beating it, or null for a Rival who only races in the pack. */
  readonly prize: PartKey | null;
  readonly look: Omit<Car, 'number'>;
  readonly number: number;
}

const look = (body: string, paint: string, wing: string, decal: string, rims = 'plain', engine = 'v8'): Omit<Car, 'number'> => ({
  body: `body:${body}`, engine: `engine:${engine}`, tyres: 'tyres:street', wing: `wing:${wing}`, booster: 'booster:puffer', paint: `paint:${paint}`,
  rims: `rims:${rims}`, decal: `decal:${decal}`, horn: 'horn:honk', flame: 'flame:orange',
});

// THE TUNING TABLE. Speed is the Garage's Speed number (his starter car is 40, the best shop car 131).
const R = (name: RivalName, cup: CupId, speed: number, grip: number, boosts: number, prize: string | null, l: Omit<Car, 'number'>, number: number): Rival =>
  ({ id: name.toLowerCase(), name, cup, speed, grip, boosts, prize: prize as PartKey | null, look: l, number });
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
  // Jungle, Candy, Moon and Rainbow: three who feature, then two in the pack
  R('Mango', 'jungle', 94, 76, 4, 'paint:mango', look('jeep', 'orange', 'duck', 'leopard', 'fire'), 4),
  R('Tiki', 'jungle', 97, 78, 4, 'wing:tiki', look('pickup', 'brown', 'shark', 'tiger', 'gold'), 18),
  R('Kong', 'jungle', 100, 80, 4, 'body:beast', look('monster', 'jungle', 'big', 'paws', 'spoke'), 88),
  R('Leafy', 'jungle', 92, 74, 3, null, look('buggy', 'lime', 'little', 'dots'), 26),
  R('Jojo', 'jungle', 93, 75, 3, null, look('rally', 'mint', 'spoiler', 'swirls'), 30),
  R('Sprinkles', 'candy', 104, 82, 4, 'decal:sprinkles', look('icecream', 'candy', 'duck', 'dots', 'flower'), 6),
  R('Gumdrop', 'candy', 107, 84, 5, 'tyres:gumdrop', look('ufo', 'pink', 'none', 'hearts', 'red'), 25),
  R('Taffy', 'candy', 110, 86, 5, 'booster:taffy', look('limo', 'lemon', 'twin', 'swirls', 'rainbow'), 55),
  R('Fudge', 'candy', 101, 80, 4, null, look('stock', 'brown', 'spoiler', 'stripes'), 29),
  R('Jelly', 'candy', 102, 81, 4, null, look('taxi', 'purple', 'duck', 'bubbles'), 36),
  R('Luna', 'moon', 114, 88, 5, 'rims:crater', look('ufo', 'silver', 'none', 'stars', 'chrome'), 15),
  R('Orbit', 'moon', 117, 90, 5, 'flame:orbit', look('jet', 'navy', 'jetwing', 'planets', 'diamond'), 33),
  R('Nova', 'moon', 120, 92, 5, 'engine:novaprize', look('star', 'white', 'dragonwing', 'comet', 'platinum'), 50),
  R('Astro', 'moon', 111, 86, 4, null, look('formula', 'white', 'big', 'galaxy'), 42),
  R('Cosmo', 'moon', 112, 87, 4, null, look('tank', 'black', 'none', 'stars'), 61),
  R('Prism', 'rainbow', 124, 94, 6, 'wing:prism', look('bike', 'diamond', 'little', 'rainbow', 'rainbow'), 10),
  R('Dazzle', 'rainbow', 127, 96, 6, 'rims:dazzle', look('dragon', 'rose', 'dragonwing', 'diamonds', 'ruby'), 20),
  R('Thunder', 'rainbow', 130, 98, 6, 'body:thunder', look('jet', 'electric', 'galaxy', 'bolts', 'glow'), 0),
  R('Glimmer', 'rainbow', 121, 92, 5, null, look('sports', 'pearl', 'mega', 'crowns'), 64),
  R('Flash', 'rainbow', 122, 93, 5, null, look('police', 'electric', 'jetwing', 'bolts'), 81),
];
/** The Cup Final's champion goes this much faster than when it raced its own track. */
export const FINAL_SPEED = 2;
/** The Rivals not featured run at this share of their speed. */
export const PACK = .9;
/** Each time the featured Rival beats him on a track it gets this much slower there, down to FLOOR of its pace. */
export const MERCY = .07, FLOOR = .4;
/** The four later Cups are tougher: a fuller, faster pack, and a featured Rival who slows less after a win. */
export const TOUGH = { pack: .93, mercy: .04, floor: .75 } as const;
export const isTough = (cup: CupId) => CUP_IDS.indexOf(cup) >= 6;
/** Star Races. Every Rival on the grid is at least `floor` fast for that Star and `add` faster than in its own Cup for each Star, but
 *  never over `cap`; the same for Grip. Each loss at that Star slows them by `mercy`, down to `low` of their pace. */
export const STAR = { add: 8, floor: [0, 60, 80, 100], grip: 4, gripFloor: [0, 55, 70, 84], cap: 140, gripCap: 108, mercy: .04, low: .8 } as const;
export const STARS = 3;
/** Mystery Races: Level 1 is about the Dirt Cup, and each Level is `step` faster (Level 10 about the Volcano Cup, 20 the Moon Cup),
 *  up to `cap` from about Level 30; each loss at a Level slows them by
 *  `mercy`, down to `low`. The five Rivals spread out a little, so the leader is the one to catch. */
export const MYSTERY = { speed: 48, step: 3, cap: 140, grip: 44, gripStep: 1.4, gripCap: 104, spread: 1.5, mercy: .04, low: .75 } as const;
/** A Rival's look is no help to him on the track: they always have the right tyres. */
const rightTyres = (): Record<Surface, number> => ({ tarmac: 1, dirt: 1, sand: 1, snow: 1 });

export const rivalBy = (id: string) => RIVALS.find(r => r.id === id)!;
export const rivalsIn = (cup: CupId) => RIVALS.filter(r => r.cup === cup);
/** The Rivals who feature on a Cup's tracks, in order (the last is its champion). */
export const featuredIn = (cup: CupId) => rivalsIn(cup).filter(r => r.prize !== null);
export const isRivalId = (x: unknown): x is string => typeof x === 'string' && RIVALS.some(r => r.id === x);

/** Who a track features: tracks 1 to 3 of a Cup one Rival each, the fourth (the Cup Final) the champion again. */
export function featuredOn(track: TrackDef): Rival {
  const inCup = TRACKS.filter(t => t.cup === track.cup), k = inCup.indexOf(track), crew = featuredIn(track.cup);
  return crew[Math.min(Math.max(0, k), crew.length - 1)]!;
}
export const isFinal = (track: TrackDef) => TRACKS.filter(t => t.cup === track.cup).indexOf(track) === 3;

/** The pace a Rival runs at: a share of its top speed. */
export const mercy = (losses: number, cup?: CupId) => cup && isTough(cup) ? Math.max(TOUGH.floor, 1 - TOUGH.mercy * losses) : Math.max(FLOOR, 1 - MERCY * losses);

/** What a Race is for. `cup`: a track whose featured Rival he hasn't beaten yet. `star`: a track he has, raced again for Star `star`.
 *  `fun`: a track with all its Stars. `mystery`: Mystery Level `level`. */
export type RaceMode = 'cup' | 'star' | 'fun' | 'mystery';
export interface RacePlan { readonly track: TrackDef; readonly mode: RaceMode; readonly star: number; readonly level: number }

export interface Starter { readonly rival: Rival; readonly stats: Stats; readonly pace: number; readonly featured: boolean }
const starter = (rival: Rival, featured: boolean, pace: number, speed: number, grip: number, boosts: number): Starter =>
  ({ rival, featured, pace, stats: { speed, grip, boosts, suits: rightTyres(), kick: 1 } });

/** The Rivals on the grid for a Race, the one to beat first, with how fast each will go. `losses` is how many times in a row he has
 *  fallen short at this very thing (this track's Rival, this Star, this Mystery Level). */
export function gridFor(plan: RacePlan | TrackDef, losses: number): Starter[] {
  const p: RacePlan = 'centre' in plan ? { track: plan, mode: 'cup', star: 0, level: 0 } : plan;
  const { track } = p;
  if (p.mode === 'mystery') return mysteryGrid(p.level, losses);
  const lead = featuredOn(track), crew = [lead, ...rivalsIn(track.cup).filter(r => r !== lead)];
  if (p.mode === 'star') {
    const k = Math.max(1, Math.min(STARS, p.star)), pace = Math.max(STAR.low, 1 - STAR.mercy * losses);
    return crew.map((r, i) => starter(r, i === 0, pace * (i === 0 ? 1 : .97),
      Math.min(STAR.cap, Math.max(r.speed + STAR.add * k, STAR.floor[k]!)), Math.min(STAR.gripCap, Math.max(r.grip + STAR.grip * k, STAR.gripFloor[k]!)), Math.min(8, r.boosts + k)));
  }
  const final = isFinal(track), tough = isTough(track.cup);
  return crew.map((r, i) => {
    const featured = i === 0, speed = r.speed + (featured && final ? FINAL_SPEED : 0);
    const pace = p.mode === 'fun' ? (featured ? 1 : PACK) : featured ? mercy(losses, track.cup) : tough ? TOUGH.pack : PACK;
    return starter(r, featured, pace, speed, r.grip, r.boosts);
  });
}

/** How the Rivals ease off when far ahead (sim.ts): gently in the first six Cups' first races, only a little in everything harder. */
export const easeFor = (plan: RacePlan): Ease => (plan.mode === 'cup' || plan.mode === 'fun') && !isTough(plan.track.cup) ? EASE : LIGHT_EASE;

/** A seeded pick, so a Level always has the same Rivals. */
function picker(seed: number) {
  let s = (seed * 48271 + 11) % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
/** Mystery Level `level`: five Rivals from every Cup, as fast as the Level says, the fastest first. */
export function mysteryGrid(level: number, losses: number): Starter[] {
  const L = Math.max(1, level), rand = picker(L), pool = [...RIVALS], five: Rival[] = [];
  while (five.length < 5) five.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
  const speed = Math.min(MYSTERY.cap, MYSTERY.speed + MYSTERY.step * (L - 1)), grip = Math.min(MYSTERY.gripCap, MYSTERY.grip + MYSTERY.gripStep * (L - 1));
  const pace = Math.max(MYSTERY.low, 1 - MYSTERY.mercy * losses), boosts = Math.min(6, 1 + Math.floor(L / 6));
  return five.map((r, i) => starter(r, i === 0, pace, speed - i * MYSTERY.spread, grip - i, boosts));
}

