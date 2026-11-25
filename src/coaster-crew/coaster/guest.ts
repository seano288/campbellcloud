// Guest Coasters: the endless layer. Each is made from its number alone (a seeded generator), so Guest Coaster 37 is the same coaster on
// every reload and every device. Each is a little longer and wilder than the one before, up to a ceiling a Ride can carry. Every one runs
// from end to end without rolling back: the generator checks each piece with the one motion model as it goes and, where a climb would be
// too much, puts a booster in front of it (guest.test.ts makes thousands and rides each to the end).
//
// Every fifth Guest Coaster gives a prize that is never sold: the prize pieces, then the prize cars, then (once those are all won) a
// numbered Guest Paint, made from the number, without end.
import { seeded, pick, int, type Rng } from '../../game/rng';
import { ALL_PIECES, afterPiece, MAX_H, PRIZE_PIECES, type Piece } from './pieces';
import { check } from './track';
import { PRIZE_BODIES, STYLES, BODIES, PAINTS } from '../park/catalog';

export const WEATHERS = ['sunny', 'sunset', 'night', 'rain', 'snow', 'stars'] as const;
export type Weather = (typeof WEATHERS)[number];
export const WEATHER_NAMES: Record<Weather, string> = { sunny: 'Sunny', sunset: 'Sunset', night: 'Night', rain: 'Rainy', snow: 'Snowy', stars: 'Starry' };

export interface Guest {
  readonly n: number;
  readonly pieces: readonly string[];
  readonly style: string;
  readonly weather: Weather;
  readonly body: string;
  readonly paint: string;
  readonly cars: number;
}

export const PRIZE_EVERY = 5;
/** How long Guest Coasters grow: 5 pieces at first, one more every three, up to 16 (a Ride of about a minute). */
export const MAX_GUEST_LENGTH = 16;
export const guestLength = (n: number) => Math.min(MAX_GUEST_LENGTH, 5 + Math.floor((n - 1) / 3));
/** How tall their lift is: 3 steps at first, a step taller every six, up to 13. */
export const guestLift = (n: number) => Math.min(13, 3 + 2 * Math.floor((n - 1) / 6));

const SHAPES = ALL_PIECES.filter(p => p.geo.g !== 'lift' && p.id !== 'pc:brakes');
const BOOSTERS = ['pc:boost', 'pc:bigboost', 'pc:launch'];
const cache = new Map<number, Guest>();

/** Guest Coaster `n` (from 1). */
export function guest(n: number): Guest {
  const hit = cache.get(n);
  if (hit) return hit;
  const r: Rng = seeded(n * 7919 + 17);
  const want = guestLength(n), lift = guestLift(n);
  const lifts = ALL_PIECES.filter(p => p.geo.g === 'lift' && p.geo.to <= lift && !p.prize).sort((a, b) => (b.geo as { to: number }).to - (a.geo as { to: number }).to);
  const pieces: string[] = [lifts[0]!.id];
  let h = (lifts[0]!.geo as { to: number }).to;
  // wilder as it goes: more loops and twists, bigger hills
  const wild = Math.min(1, n / 60);
  for (let tries = 0; pieces.length < want && tries < want * 40; tries++) {
    const fits = SHAPES.filter(p => afterPiece(p.geo, h) !== null && (!p.prize || n > 20));
    const weighted = fits.filter(p => (p.family === 'loop' || p.family === 'twist' ? r() < .25 + .6 * wild : true));
    const next: Piece = pick(r, weighted.length ? weighted : fits);
    const tryIt = [...pieces, next.id];
    if (check(tryIt).backAt === null) { pieces.push(next.id); h = afterPiece(next.geo, h)!; continue; }
    // too much for it here: a booster in front, if that gets it over; else something flat
    const boosted = [...pieces, pick(r, BOOSTERS), next.id];
    if (pieces.length + 2 <= want && check(boosted).backAt === null) { pieces.push(boosted[boosted.length - 2]!, next.id); h = afterPiece(next.geo, h)!; continue; }
    if (h > 0 && afterPiece({ g: 'drop', d: Math.min(h, 2) }, h) !== null && r() < .5) {
      const d = ALL_PIECES.find(p => p.geo.g === 'drop' && p.geo.d <= h && !p.prize)!;
      if (check([...pieces, d.id]).backAt === null) { pieces.push(d.id); h = afterPiece(d.geo, h)!; }
    }
  }
  // never short: fill with flat track that keeps it running (checked)
  while (pieces.length < want) {
    const flat = check([...pieces, 'pc:tunnel']).backAt === null ? 'pc:tunnel' : 'pc:boost';
    pieces.push(flat);
  }
  const g: Guest = {
    n, pieces, style: pick(r, STYLES).id, weather: pick(r, WEATHERS), body: pick(r, BODIES).id, paint: pick(r, PAINTS).id, cars: int(r, 2, 5),
  };
  cache.set(n, g);
  void MAX_H;
  return g;
}

/** What Guest Coaster `n` gives, if it is a fifth one: a prize piece, a prize car, else a numbered Guest Paint. */
export type Prize = { readonly kind: 'piece' | 'body'; readonly id: string; readonly name: string } | { readonly kind: 'paint'; readonly id: string; readonly k: number };
export const PRIZES: readonly { readonly kind: 'piece' | 'body'; readonly id: string; readonly name: string }[] = [
  ...PRIZE_PIECES.flatMap((p, i) => [{ kind: 'piece' as const, id: p.id, name: p.name }, { kind: 'body' as const, id: PRIZE_BODIES[i]!.id, name: PRIZE_BODIES[i]!.name }]),
];
export function prizeFor(n: number): Prize | null {
  if (n % PRIZE_EVERY !== 0) return null;
  const k = n / PRIZE_EVERY;
  if (k <= PRIZES.length) return PRIZES[k - 1]!;
  return { kind: 'paint', id: `gp:${k - PRIZES.length}`, k: k - PRIZES.length };
}

/** A Guest Paint's colours from its number: a colour and a second colour for its stripe, never the same twice in the first thousands. */
export function guestPaint(k: number): { body: string; stripe: string } {
  const hue = (k * 137.508) % 360, hue2 = (hue + 120 + (k % 7) * 20) % 360, light = 42 + (k % 5) * 6;
  return { body: `hsl(${hue.toFixed(1)} 75% ${light}%)`, stripe: `hsl(${hue2.toFixed(1)} 85% ${92 - light / 2}%)` };
}
