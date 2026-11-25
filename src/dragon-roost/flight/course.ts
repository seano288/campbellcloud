// The Flights: where he flies. First the 24 places, each named and hand-set; after those, each Flight's land is generated from its
// number without end: the hills, the lakes, the castles, the weather, where the beacons and clouds are, day or night. The same number
// always gives the same Flight, so a reload flies the same land. Each is a little longer and a little twistier than the one before, up to
// a ceiling, and every one can be finished (gen.test.ts flies thousands).
//
// The world is in units: 0 is the valley floor and 100 the top of the sky. The dragon flies from x = 0 to `length`.
import { seeded, type Rng } from '../../game/rng';

export type Weather = 'clear' | 'wind' | 'snow' | 'rain';
export interface Tower { readonly x: number; readonly w: number; readonly h: number; readonly kind: 'castle' | 'tower' | 'peak' }
export interface Point { readonly x: number; readonly y: number }
export interface Cloud extends Point { readonly r: number }
export interface Course {
  readonly n: number;
  readonly name: string | null;
  readonly length: number;
  readonly seed: number;
  /** Rolling hills: the sum of these waves over a base. */
  readonly waves: readonly { readonly amp: number; readonly len: number; readonly phase: number }[];
  readonly base: number;
  readonly lakes: readonly { readonly x0: number; readonly x1: number }[];
  readonly towers: readonly Tower[];
  readonly beacons: readonly Point[];
  readonly clouds: readonly Cloud[];
  readonly flames: readonly Point[];
  readonly birds: readonly Point[];
  readonly night: boolean;
  readonly weather: Weather;
  /** Which sky and land colours (art). */
  readonly theme: number;
}

export const SKY_TOP = 100, CEILING = 90, LAKE_LEVEL = 6;
/** The 24 places, in the order he flies them. Each says its name when it starts. */
export const PLACES = [
  { name: 'Green Valley', theme: 0, weather: 'clear', night: false }, { name: 'Sunny Hills', theme: 0, weather: 'clear', night: false },
  { name: 'Duck Pond', theme: 1, weather: 'clear', night: false }, { name: 'Castle Rock', theme: 2, weather: 'clear', night: false },
  { name: 'Windy Peak', theme: 3, weather: 'wind', night: false }, { name: 'Pine Wood', theme: 1, weather: 'clear', night: false },
  { name: 'Misty Lake', theme: 4, weather: 'rain', night: false }, { name: 'Star Hill', theme: 5, weather: 'clear', night: true },
  { name: 'Snowy Pass', theme: 3, weather: 'snow', night: false }, { name: 'Red Rocks', theme: 2, weather: 'clear', night: false },
  { name: 'Rainbow Falls', theme: 4, weather: 'rain', night: false }, { name: 'King\'s Castle', theme: 2, weather: 'clear', night: false },
  { name: 'Moon Lake', theme: 5, weather: 'clear', night: true }, { name: 'Cloud Top', theme: 0, weather: 'wind', night: false },
  { name: 'Apple Farm', theme: 1, weather: 'clear', night: false }, { name: 'Frost Ridge', theme: 3, weather: 'snow', night: false },
  { name: 'Sunset Bay', theme: 4, weather: 'clear', night: false }, { name: 'Tall Towers', theme: 2, weather: 'wind', night: false },
  { name: 'Firefly Glen', theme: 5, weather: 'clear', night: true }, { name: 'Big Waterfall', theme: 4, weather: 'rain', night: false },
  { name: 'Giant Steps', theme: 3, weather: 'clear', night: false }, { name: 'Lantern Town', theme: 5, weather: 'clear', night: true },
  { name: 'Thunder Hills', theme: 0, weather: 'rain', night: false }, { name: 'Dragon Mountain', theme: 2, weather: 'wind', night: false },
] as const;
export type PlaceName = (typeof PLACES)[number]['name'];
export const FIXED_FLIGHTS = PLACES.length;
export const THEMES = 6;

/** How much there is to do: a little more each Flight, then it holds. */
export function difficulty(n: number) {
  const k = Math.min(1, (n - 1) / 120);
  return {
    length: Math.round(1000 + 500 * k),
    hills: 6 + 12 * k,
    beacons: 6 + Math.round(4 * k),
    clouds: 8 + Math.round(6 * k),
    towers: 1 + Math.round(4 * k),
    lakes: 1 + Math.round(2 * k),
  };
}

const r = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

/** The height of the land at x: the hills, down to the water at a lake, up over a castle or a peak. */
export function groundAt(c: Pick<Course, 'waves' | 'base' | 'lakes' | 'towers'>, x: number): number {
  let y = c.base;
  for (const w of c.waves) y += w.amp * Math.sin((x / w.len) * Math.PI * 2 + w.phase);
  y = Math.max(8, Math.min(50, y));
  for (const l of c.lakes) if (x > l.x0 && x < l.x1) {
    const edge = Math.min(x - l.x0, l.x1 - x);
    y = edge > 8 ? LAKE_LEVEL : LAKE_LEVEL + (y - LAKE_LEVEL) * (1 - edge / 8);
  }
  for (const t of c.towers) if (x >= t.x && x <= t.x + t.w) {
    const top = t.kind === 'peak' ? t.h * (1 - Math.abs((x - t.x - t.w / 2) / (t.w / 2))) : t.h;
    y = Math.max(y, groundBase(c, t.x + t.w / 2) + top);
  }
  return Math.min(78, y);
}
const groundBase = (c: Pick<Course, 'waves' | 'base'>, x: number) => {
  let y = c.base;
  for (const w of c.waves) y += w.amp * Math.sin((x / w.len) * Math.PI * 2 + w.phase);
  return Math.max(8, Math.min(50, y));
};
export const isLake = (c: Pick<Course, 'lakes'>, x: number) => c.lakes.some(l => x > l.x0 + 3 && x < l.x1 - 3);

/** A beacon here can be breathed on: no lake near, and the land for a breath's reach before it is no higher than it. */
export function reachable(c: Pick<Course, 'waves' | 'base' | 'lakes' | 'towers'>, x: number): boolean {
  if (c.lakes.some(l => x > l.x0 - 14 && x < l.x1 + 14)) return false;
  const g = groundAt(c, x);
  for (let k = -26; k <= 3; k += 1) if (groundAt(c, x + k) > g + 2.5) return false;
  return true;
}
/** The highest land for a breath's reach before x: a beacon on a post this high can always be breathed on. */
export function postTop(c: Pick<Course, 'waves' | 'base' | 'lakes' | 'towers'>, x: number): number {
  let top = groundAt(c, x);
  for (let k = -26; k <= 3; k += 1) top = Math.max(top, groundAt(c, x + k));
  return top;
}
function flattest(c: Pick<Course, 'waves' | 'base' | 'lakes' | 'towers'>, a: number, b: number): number {
  let best = a, score = Infinity;
  for (let x = a; x < b; x += 1) {
    const g = groundAt(c, x);
    let worst = 0;
    for (let k = -26; k <= 3; k += 1) worst = Math.max(worst, groundAt(c, x + k) - g);
    if (c.lakes.some(l => x > l.x0 - 14 && x < l.x1 + 14)) worst += 50;
    if (worst < score) { score = worst; best = x; }
  }
  return best;
}

/** The Flight with this number: a named place, or one made from the number. */
export function course(n: number): Course {
  const place = n >= 1 && n <= FIXED_FLIGHTS ? PLACES[n - 1]! : null;
  const rng = seeded(0x5eed ^ Math.imul(n, 2654435761));
  const d = difficulty(n);
  const length = d.length;
  const waves = [
    { amp: d.hills * .55, len: r(rng, 260, 420), phase: r(rng, 0, 6.28) },
    { amp: d.hills * .35, len: r(rng, 110, 180), phase: r(rng, 0, 6.28) },
    { amp: d.hills * .15, len: r(rng, 50, 80), phase: r(rng, 0, 6.28) },
  ];
  const base = r(rng, 18, 24);
  // lakes and castles take turns along the way, never in the first or last stretch, never on top of each other
  const lakes: { x0: number; x1: number }[] = [], towers: Tower[] = [];
  const taken: [number, number][] = [];
  const free = (a: number, b: number) => !taken.some(([x0, x1]) => a < x1 + 30 && b > x0 - 30);
  for (let i = 0, tries = 0; i < d.lakes && tries < 50; tries++) {
    const x0 = r(rng, 150, length - 200), w = r(rng, 50, 90);
    if (!free(x0, x0 + w)) continue;
    lakes.push({ x0, x1: x0 + w }); taken.push([x0, x0 + w]); i++;
  }
  const kinds: Tower['kind'][] = place?.name === 'Tall Towers' || place?.name === "King's Castle" ? ['castle', 'tower', 'castle'] : ['castle', 'tower', 'peak'];
  for (let i = 0, tries = 0; i < d.towers && tries < 60; tries++) {
    const kind = kinds[i % kinds.length]!, w = kind === 'peak' ? r(rng, 40, 70) : kind === 'castle' ? r(rng, 26, 36) : r(rng, 10, 14);
    const x = r(rng, 120, length - 160);
    if (!free(x, x + w)) continue;
    towers.push({ x, w, h: kind === 'peak' ? r(rng, 14, 18 + d.hills) : kind === 'castle' ? r(rng, 10, 16) : r(rng, 16, 24), kind });
    taken.push([x, x + w]); i++;
  }
  const shape = { waves, base, lakes, towers };
  // beacons: spread along the way, on the land (or on top of a castle or tower), a little apart
  const beacons: Point[] = [];
  const step = (length - 220) / d.beacons;
  for (let i = 0; i < d.beacons; i++) {
    // a spot he can reach with his breath: the land just before it is no higher (so he isn't held up above it), and no lake near
    const from = 120 + step * i, spots: number[] = [];
    for (let x = from; x < from + step * .8; x += 2) if (reachable(shape, x)) spots.push(x);
    const x = spots.length ? spots[Math.floor(rng() * spots.length)]! : flattest(shape, from, from + step * .8);
    // where no spot is flat enough, the beacon stands on a post as high as the land before it
    beacons.push({ x, y: postTop(shape, x) + 2 });
  }
  const clouds: Cloud[] = Array.from({ length: d.clouds }, (_, i) => {
    const x = 90 + ((length - 160) / d.clouds) * i + r(rng, 0, 40);
    return { x, y: Math.max(groundAt(shape, x) + 22, r(rng, 55, 84)), r: r(rng, 5, 8) };
  });
  const flames: Point[] = Array.from({ length: 3 }, (_, i) => {
    const x = length * (.25 + i * .25) + r(rng, -30, 30);
    return { x, y: Math.max(groundAt(shape, x) + 14, r(rng, 30, 75)) };
  });
  const birds: Point[] = n >= 3 ? [{ x: length * r(rng, .35, .55), y: r(rng, 62, 80) }] : [];
  const gen = { weather: (['clear', 'clear', 'wind', 'snow', 'rain'] as const)[Math.floor(rng() * 5)]!, night: rng() < .25, theme: Math.floor(rng() * THEMES) };
  return {
    n, name: place?.name ?? null, length, seed: n, waves, base, lakes, towers, beacons, clouds, flames, birds,
    night: place ? place.night : gen.night, weather: place ? place.weather : gen.weather, theme: place ? place.theme : gen.theme,
  };
}
