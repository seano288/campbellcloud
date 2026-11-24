// The endless layer: things made from a number, the same every time for that number (so a reload shows the same), without end.
//
// - Landings: each Landing's ground is made from its number: the hills, the craters, where the pad is, how far he must slide to it.
//   Each is a little trickier than the one before (further to go, a narrower pad, taller hills), up to a cap, so it never gets too hard.
//   Every fifth Landing carries a special crate with something never sold.
// - Moon rocks: each Landing brings back a rock made from parts (shape, colour, sparkle, size), rarer the further he has got.
// - Modules made from parts, after the named ones: a shape, a colour, windows and a roof fitting, named from two clips ("Blue Pod").
// - Plants for the garden beds, made the same way ("Gold Vine").
// - Lucky statues: the special crates' prizes after the twelve named ones.
import { int, pick, seeded } from '../../game/rng';

// ---------- Landings ----------

export interface Hill { readonly x: number; readonly y: number }
export interface Crater { readonly x: number; readonly r: number; readonly d: number }
export interface LandingPlan {
  readonly n: number;
  /** The ground's height at points every STEP_X along, from x = 0. */
  readonly ground: readonly number[];
  readonly craters: readonly Crater[];
  readonly padX: number;
  readonly padW: number;
  /** Where the ship starts, and how high above the pad. */
  readonly startX: number;
  readonly startY: number;
  readonly night: boolean;
  readonly special: boolean;
}
export const STEP_X = 20;
/** How tricky a Landing is, 0 to 1: it rises over the first sixty Landings, then stays. */
export const trickOf = (n: number) => Math.min(1, Math.max(0, (n - 1) / 60));

export function landingFor(n: number): LandingPlan {
  const rng = seeded(n * 7919 + 13), t = trickOf(n);
  const dist = Math.round(260 + t * 640 + int(rng, 0, 100));
  const padW = Math.round(110 - t * 50);
  const startX = 60, padX = startX + dist, length = padX + 260;
  const points = Math.ceil(length / STEP_X) + 1, amp = 8 + t * 60;
  const ground: number[] = [];
  let h = 0;
  for (let i = 0; i < points; i++) {
    h += (rng() - 0.5) * amp * 0.6;
    h = Math.max(-amp, Math.min(amp, h));
    ground.push(Math.round(h * 10) / 10);
  }
  // a ridge on the way, on the trickier ones
  if (n >= 8) {
    const at = Math.round((startX + dist * (0.4 + rng() * 0.3)) / STEP_X), tall = 30 + t * 70;
    for (let k = -2; k <= 2; k++) if (ground[at + k] !== undefined) ground[at + k] = Math.max(ground[at + k]!, tall * (1 - Math.abs(k) / 3));
  }
  // the pad is flat, and so is a little ground either side of it
  const padH = ground[Math.round(padX / STEP_X)] ?? 0;
  for (let i = 0; i < points; i++) if (Math.abs(i * STEP_X - padX) <= padW / 2 + STEP_X) ground[i] = padH;
  const craters: Crater[] = [];
  const nCraters = 1 + Math.floor(t * 4) + int(rng, 0, 1);
  for (let c = 0; c < nCraters; c++) {
    const x = startX + 80 + rng() * (dist - 160);
    if (Math.abs(x - padX) < padW) continue;
    craters.push({ x: Math.round(x), r: Math.round(20 + rng() * 30), d: Math.round(6 + rng() * 10) });
  }
  const highest = Math.max(...ground);
  return { n, ground, craters, padX, padW, startX, startY: Math.max(highest, padH) + 170 + t * 40, night: n % 7 === 0, special: n % 5 === 0 };
}

/** The ground's height at x (craters dip into it). */
export function groundAt(p: Pick<LandingPlan, 'ground' | 'craters'>, x: number): number {
  const i = Math.max(0, Math.min(p.ground.length - 2, Math.floor(x / STEP_X))), f = Math.max(0, Math.min(1, x / STEP_X - i));
  let y = p.ground[i]! * (1 - f) + p.ground[i + 1]! * f;
  for (const c of p.craters) { const d = Math.abs(x - c.x); if (d < c.r) y -= c.d * (1 - (d / c.r) ** 2); }
  return y;
}
export const landingLength = (p: Pick<LandingPlan, 'ground'>) => (p.ground.length - 1) * STEP_X;

// ---------- names made from two clips ----------

export const COLOUR_WORDS = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Pink', 'Purple', 'Orange', 'White', 'Black', 'Teal', 'Yellow'] as const;
export const COLOUR_HEX: Record<(typeof COLOUR_WORDS)[number], string> = {
  Red: '#e63946', Blue: '#3a86ff', Green: '#2ec45a', Gold: '#e8b923', Silver: '#c0c7d0', Pink: '#ff6fb5', Purple: '#8e44ec', Orange: '#ff8c1a',
  White: '#f2f2f2', Black: '#30303a', Teal: '#16b3b3', Yellow: '#ffd23f',
};
export type ColourWord = (typeof COLOUR_WORDS)[number];
/** The kth of a family of names made from a colour and a word: every pair once, then the pairs again with a number (up to 100). */
function named<W extends string>(k: number, words: readonly W[]): { colour: ColourWord; word: W; number: number } {
  const per = COLOUR_WORDS.length * words.length, round = Math.floor(k / per), i = k % per;
  // spread so neighbours differ in both parts
  const c = i % COLOUR_WORDS.length, m = Math.floor(i / COLOUR_WORDS.length);
  const colour = COLOUR_WORDS[(c * 5) % COLOUR_WORDS.length]!, word = words[(m * 13 + c) % words.length]!;
  return { colour, word, number: round === 0 ? 0 : Math.min(100, round + 1) };
}

// ---------- moon rocks ----------

export const ROCK_WORDS = ['Rock', 'Pebble', 'Stone', 'Lump', 'Crystal', 'Gem'] as const;
export const SPARKLES = ['none', 'some', 'lots', 'rainbow'] as const;
export interface MoonRock { readonly n: number; readonly word: (typeof ROCK_WORDS)[number]; readonly colour: ColourWord; readonly hex: string; readonly sparkle: (typeof SPARKLES)[number]; readonly size: 1 | 2 | 3; readonly lumps: readonly number[]; readonly rare: boolean }
/** The rock Landing n brings back. Rarer shapes and sparkle come more often the further he has got (and with the Moon Mine). */
export function rockFor(n: number, mine = false): MoonRock {
  const rng = seeded(n * 104729 + 7), reach = Math.min(1, n / 120) + (mine ? 0.25 : 0);
  const shapeTop = 2 + Math.floor(reach * 4), word = ROCK_WORDS[Math.min(ROCK_WORDS.length - 1, Math.floor(rng() * shapeTop))]!;
  const plain = rng() < 0.55 - reach * 0.35;
  const colour = plain ? pick(rng, ['Silver', 'White', 'Black'] as const) : pick(rng, COLOUR_WORDS);
  const s = rng(), sparkle = s < 0.5 - reach * 0.3 ? 'none' : s < 0.85 - reach * 0.2 ? 'some' : s < 0.97 - reach * 0.1 ? 'lots' : 'rainbow';
  const lumps = Array.from({ length: 8 }, () => Math.round((0.75 + rng() * 0.4) * 100) / 100);
  return { n, word, colour, hex: COLOUR_HEX[colour], sparkle, size: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3, lumps, rare: sparkle === 'rainbow' || word === 'Gem' };
}

// ---------- modules made from parts ----------

export const MODULE_WORDS = ['Pod', 'Dome', 'Tower', 'Hut', 'Tube', 'Lab', 'Hall', 'Cube'] as const;
export const ROOFS = ['antenna', 'dish', 'flag', 'light', 'wings', 'bubble', 'spire'] as const;
export interface GenModule { readonly k: number; readonly word: (typeof MODULE_WORDS)[number]; readonly colour: ColourWord; readonly hex: string; readonly windows: number; readonly roof: (typeof ROOFS)[number]; readonly number: number }
export function moduleFor(k: number): GenModule {
  const { colour, word, number } = named(k, MODULE_WORDS), rng = seeded(k * 31337 + 5);
  return { k, word, colour, hex: COLOUR_HEX[colour], windows: 1 + Math.floor(rng() * 4), roof: pick(rng, ROOFS), number };
}

// ---------- plants made from parts ----------

export const PLANT_WORDS = ['Flower', 'Vine', 'Bush', 'Fern', 'Cactus', 'Pepper'] as const;
export interface GenPlant { readonly k: number; readonly word: (typeof PLANT_WORDS)[number]; readonly colour: ColourWord; readonly hex: string; readonly number: number }
export function plantFor(k: number): GenPlant {
  const { colour, word, number } = named(k + 7, PLANT_WORDS);
  return { k, word, colour, hex: COLOUR_HEX[colour], number };
}

// ---------- special crates: every fifth Landing ----------

export const SPECIALS = [
  { id: 'special:goldmoon', name: 'Gold Moon Statue', icon: '🌕' },
  { id: 'special:comet', name: 'Comet Lamp', icon: '☄️' },
  { id: 'special:alien', name: 'Alien Toy', icon: '👽' },
  { id: 'special:crystaltree', name: 'Crystal Tree', icon: '💎' },
  { id: 'special:starmap', name: 'Star Map', icon: '🗺️' },
  { id: 'special:rocketfountain', name: 'Rocket Fountain', icon: '⛲' },
  { id: 'special:spaceswing', name: 'Space Swing', icon: '🎢' },
  { id: 'special:discodome', name: 'Disco Dome', icon: '🪩' },
  { id: 'special:robotband', name: 'Robot Band', icon: '🎺' },
  { id: 'special:meteor', name: 'Meteor in a Jar', icon: '🫙' },
  { id: 'special:goldlander', name: 'Gold Lander Statue', icon: '🏆' },
  { id: 'special:earthlamp', name: 'Earth Lamp', icon: '🌍' },
] as const;
export type SpecialName = (typeof SPECIALS)[number]['name'];
// "Kitty", not "Cat": the voice says a lone "Cat" as "Kate"
export const STATUE_WORDS = ['Star', 'Moon', 'Rocket', 'Kitty', 'Robot', 'Comet'] as const;
export interface Special { readonly id: string; readonly name: string; readonly icon: string; readonly lucky?: { colour: ColourWord; word: (typeof STATUE_WORDS)[number]; hex: string; number: number } }
const STATUE_ICONS: Record<(typeof STATUE_WORDS)[number], string> = { Star: '⭐', Moon: '🌙', Rocket: '🚀', Kitty: '🐈', Robot: '🤖', Comet: '☄️' };
/** The special crate on Landing n (every fifth): the twelve named prizes in order, then lucky statues made from parts, without end. */
export function specialFor(n: number): Special | null {
  if (n % 5 !== 0) return null;
  const k = n / 5 - 1;
  if (k < SPECIALS.length) return SPECIALS[k]!;
  const { colour, word, number } = named(k - SPECIALS.length, STATUE_WORDS);
  return { id: `lucky:${k - SPECIALS.length}`, name: `${colour} ${word} Statue`, icon: STATUE_ICONS[word], lucky: { colour, word, hex: COLOUR_HEX[colour], number } };
}
export const isSpecialId = (x: unknown) => typeof x === 'string' && (SPECIALS.some(s => s.id === x) || /^lucky:\d+$/.test(x));
export function specialById(id: string): Special | null {
  const named = SPECIALS.find(s => s.id === id);
  if (named) return named;
  const m = /^lucky:(\d+)$/.exec(id);
  return m ? specialFor((Number(m[1]) + SPECIALS.length + 1) * 5) : null;
}
