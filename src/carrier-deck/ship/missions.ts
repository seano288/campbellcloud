// The Missions and the Voyage. Thirty-six hand-made Missions, six at each of six places on the sea chart (the Home Port, the Islands, the
// Ice, the Reef, the Storm Sea, the Far Harbor), flown in order, each with its own patch for his wall. Then the Voyage goes on without
// end: each new chart (a stretch of sea with a port) is generated from its number, with its own colour of sea and sky and its own name,
// and each Mission on it is generated from its number too: the job (drop, winch, rings, follow, search, storm), how far, the wind, the sea,
// day or night, and which aircraft suits it. The same number always gives the same Mission, each is a little harder than the last (to a
// ceiling: a Mission can't be failed), and every fifth generated one brings a prize that is never sold: a patch, then a deck marking, in
// turn, made from a picture and colours. gen.test.ts makes thousands and flies each one to its end with the scripted children.
//
// Nothing here is a fight: rescues, supply drops, storm watches, air shows and finding lost boats. Nobody is ever in danger: the raft is
// waiting, not sinking.
import { int, pick, seeded } from '../../game/rng';
import type { Job, Model } from './catalog';

export interface Place { readonly id: string; readonly name: string; readonly icon: string; readonly sea: string; readonly sky: string; readonly ice?: boolean }
/** The six places of the first chart, in order. */
export const PLACES = [
  { id: 'home', name: 'Home Port', icon: '⚓', sea: '#1f4f8a', sky: '#8fd0ff' },
  { id: 'islands', name: 'The Islands', icon: '🏝️', sea: '#1a7fa0', sky: '#9fe3ff' },
  { id: 'ice', name: 'The Ice', icon: '🧊', sea: '#2b5d7d', sky: '#d6ecff', ice: true },
  { id: 'reef', name: 'The Reef', icon: '🪸', sea: '#12a3a8', sky: '#a8f0ff' },
  { id: 'storm', name: 'The Storm Sea', icon: '⛈️', sea: '#203247', sky: '#7c8ea3' },
  { id: 'far', name: 'The Far Harbor', icon: '🏰', sea: '#244e7a', sky: '#ffc9a3' },
] as const satisfies readonly Place[];
export type PlaceName = (typeof PLACES)[number]['name'];
export const PER_PLACE = 6;

/** What a Mission's job is about: what he follows, finds, drops to or lifts. Drawn in the Mission, said on the card. */
export type Subject = 'whale' | 'dolphins' | 'turtle' | 'ferry' | 'rowboat' | 'canoe' | 'kayak' | 'fishing' | 'raft' | 'crate' | 'rings' | 'clouds';
export interface Patch { readonly glyph: string; readonly bg: string; readonly rim: string }

interface Fixed { readonly name: string; readonly job: Job; readonly subject: Subject; readonly night?: boolean; readonly glyph: string; readonly bg: string }
const M = <const N extends string>(name: N, job: Job, subject: Subject, glyph: string, bg: string, night = false) => ({ name, job, subject, glyph, bg, night }) as Fixed & { readonly name: N };
export const FIXED = [
  // Home Port
  M('First Flight', 'rings', 'rings', '🛩️', '#2f8fe8'), M('Follow the Ferry', 'follow', 'ferry', '⛴️', '#1f3a68'), M('Lost Rowboat', 'search', 'rowboat', '🚣', '#14a3a3'),
  M('Lighthouse Drop', 'drop', 'crate', '🗼', '#e63946'), M('Raft Rescue', 'winch', 'raft', '🛟', '#ff7a00'), M('Night Lights', 'rings', 'rings', '🌙', '#101a3a', true),
  // the Islands
  M('Island Delivery', 'drop', 'crate', '🏝️', '#2fa84f'), M('Dolphin Watch', 'follow', 'dolphins', '🐬', '#3d93dc'), M('Ring Run', 'rings', 'rings', '⭕', '#ffd23f'),
  M('Beach Rescue', 'winch', 'raft', '🏖️', '#e2c38a'), M('Rain Clouds', 'storm', 'clouds', '🌧️', '#4a5563'), M('Lost Canoe', 'search', 'canoe', '🛶', '#c46a2f'),
  // the Ice
  M('Penguin Post', 'drop', 'crate', '🐧', '#bfe6ff'), M('Whale Watch', 'follow', 'whale', '🐋', '#1f4f8a'), M('Ice Raft Rescue', 'winch', 'raft', '🧊', '#8ee6c4'),
  M('Snow Search', 'search', 'fishing', '❄️', '#d6ecff'), M('Polar Lights', 'rings', 'rings', '🌌', '#123a2a', true), M('Blizzard Watch', 'storm', 'clouds', '🌨️', '#7c8ea3'),
  // the Reef
  M('Turtle Trail', 'follow', 'turtle', '🐢', '#2fa84f'), M('Reef Supplies', 'drop', 'crate', '🪸', '#ff7aa8'), M('Lost Kayak', 'search', 'kayak', '🛶', '#ffd23f'),
  M('Air Show', 'rings', 'rings', '🎆', '#7b4bd1'), M('Snorkel Rescue', 'winch', 'raft', '🤿', '#14a3a3'), M('Moonlit Reef', 'follow', 'turtle', '🌕', '#101a3a', true),
  // the Storm Sea
  M('Storm Watch', 'storm', 'clouds', '⛈️', '#203247'), M('Supply Run', 'drop', 'crate', '📦', '#c46a2f'), M('Big Wave Rescue', 'winch', 'raft', '🌊', '#1f4f8a'),
  M('Lost Fishing Boat', 'search', 'fishing', '🎣', '#4a5563'), M('Thunder Run', 'storm', 'clouds', '⚡', '#1b1e24'), M('Night Search', 'search', 'rowboat', '🔦', '#101a3a', true),
  // the Far Harbor
  M('Harbor Parade', 'rings', 'rings', '🎉', '#ff7a00'), M('Ferry Escort', 'follow', 'ferry', '🚢', '#2f6fc0'), M('Festival Drop', 'drop', 'crate', '🎁', '#e63946'),
  M('Sailor Rescue', 'winch', 'raft', '⛑️', '#b5172b'), M('Fireworks Flight', 'rings', 'rings', '🎇', '#101a3a', true), M('Grand Air Show', 'rings', 'rings', '🏆', '#e0b13a'),
] as const;
export type MissionName = (typeof FIXED)[number]['name'];
export const FIXED_COUNT = FIXED.length;

/** A generated Mission's call on the radio, by its job. */
export const CALLS = { drop: 'Supply Drop', winch: 'Raft Rescue', rings: 'Ring Run', follow: 'Whale Watch', search: 'Lost Boat Search', storm: 'Storm Watch' } as const satisfies Record<Job, string>;
export type CallName = (typeof CALLS)[Job];

/** Which aircraft suit each job, best first. */
export const SUITS: Record<Job, readonly Model[]> = {
  drop: ['cargo', 'water', 'twin', 'tilt'], winch: ['rescue', 'twin', 'jump', 'tilt'], rings: ['display', 'trainer', 'jump'],
  follow: ['seaplane', 'radar', 'drone'], search: ['radar', 'rescue', 'seaplane'], storm: ['storm', 'drone'],
};

export interface Mission {
  readonly n: number;
  /** A hand-made Mission's name, or null for a generated one (said as its call: "Radio call! Supply Drop"). */
  readonly name: MissionName | null;
  readonly job: Job;
  readonly subject: Subject;
  readonly place: Place;
  /** Which chart of the Voyage it is on, from 1. */
  readonly chart: number;
  readonly night: boolean;
  /** Gusts only wobble the aircraft: 0 to 0.8. */
  readonly wind: number;
  /** How rough the sea looks: 0 to 1. */
  readonly waves: number;
  /** How many things there are to do on the job. */
  readonly count: number;
  readonly suits: readonly Model[];
  readonly patch: Patch;
  /** A generated Mission's prize, every fifth one: never sold. */
  readonly prize: Prize | null;
  /** What it needs first: night Missions need the Deck Lights. A generated night Mission is flown at dusk without them instead. */
  readonly needs: string | null;
  readonly seed: number;
}

// ---------- the Voyage's generated charts ----------

export const PORT_FIRST = ['Coral', 'Whale', 'Seagull', 'Sunny', 'Misty', 'Pearl', 'Otter', 'Seal', 'Amber', 'Shell', 'Puffin', 'Starfish', 'Kelp', 'Harbor', 'Breezy', 'Lantern', 'Turtle', 'Pelican', 'Driftwood', 'Moonlight'] as const;
export const PORT_SECOND = ['Bay', 'Cove', 'Point', 'Harbor', 'Island', 'Sound', 'Reef', 'Haven', 'Rock', 'Lagoon', 'Beach', 'Inlet'] as const;
export type PortWord = (typeof PORT_FIRST)[number] | (typeof PORT_SECOND)[number];
const SEAS = ['#1f4f8a', '#1a7fa0', '#12a3a8', '#244e7a', '#2b5d7d', '#1b6a8f', '#0f5f7a', '#2a4f9a', '#156b6b', '#33558a'];
const SKIES = ['#8fd0ff', '#9fe3ff', '#ffc9a3', '#c9b8ff', '#ffe08a', '#b8f0d8', '#ffb3c7', '#a8d8ff', '#d6ecff', '#ffd6a8'];
export interface Chart extends Place { readonly n: number; readonly first: (typeof PORT_FIRST)[number]; readonly second: (typeof PORT_SECOND)[number] }
/** Chart `n` (from 1). The first six are the hand-made places; after them each is made from its number, the same every time. */
export function chart(n: number): Chart {
  if (n <= PLACES.length) { const p = PLACES[n - 1]!; return { ...p, n, first: 'Harbor', second: 'Bay' }; }
  const k = n - PLACES.length - 1, rng = seeded(0xc4a7 + n * 104729);
  // every pair of words once before any comes round again (7 shares no factor with the 240 pairs)
  const pairs = PORT_FIRST.length * PORT_SECOND.length, idx = (k * 7) % pairs;
  const first = PORT_FIRST[idx % PORT_FIRST.length]!, second = PORT_SECOND[Math.floor(idx / PORT_FIRST.length)]!;
  return { id: `chart:${n}`, n, name: `${first} ${second}`, first, second, icon: pick(rng, ['⚓', '🏝️', '🗼', '🏘️', '🌋', '🏔️', '🌴', '🐚', '🦭', '🐳']), sea: pick(rng, SEAS), sky: pick(rng, SKIES), ice: rng() < .15 };
}
export const chartOf = (n: number) => Math.ceil(n / PER_PLACE);

// ---------- prizes ----------

export const PRIZE_EVERY = 5;
const GLYPHS = ['🐳', '🦭', '🐙', '🦑', '🐠', '🐡', '🦞', '🐚', '🪼', '🦩', '🦜', '🦅', '🌟', '🌈', '🌻', '🍀', '🎈', '🪁', '🎯', '🎨', '🧭', '🗺️', '⛵', '🏝️', '🌋', '🗻', '🌙', '☀️', '⚡', '❄️'];
const COLOURS = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1', '#ff7aa8', '#14a3a3', '#1f3a68', '#c46a2f', '#e0b13a', '#101a3a'];
export type Prize =
  | { readonly id: `gpatch:${number}`; readonly kind: 'patch'; readonly number: number; readonly patch: Patch }
  | { readonly id: `gmark:${number}`; readonly kind: 'mark'; readonly number: number; readonly hex: string; readonly shape: 'stripe' | 'dash' | 'circle' | 'star' | 'arrow' | 'check' | 'wave' };
const SHAPES = ['star', 'circle', 'wave', 'check', 'arrow', 'dash', 'stripe'] as const;
/** The prize generated Mission `n` brings, or null. Every fifth: a patch, then a deck marking, numbered, without end. */
export function prizeFor(n: number): Prize | null {
  if (n <= FIXED_COUNT || (n - FIXED_COUNT) % PRIZE_EVERY) return null;
  const k = (n - FIXED_COUNT) / PRIZE_EVERY, number = Math.ceil(k / 2);
  if (k % 2) return { id: `gpatch:${number}`, kind: 'patch', number, patch: { glyph: GLYPHS[(number * 7) % GLYPHS.length]!, bg: COLOURS[(number * 5 + Math.floor(number / GLYPHS.length)) % COLOURS.length]!, rim: COLOURS[(number * 3 + 4) % COLOURS.length]! } };
  return { id: `gmark:${number}`, kind: 'mark', number, hex: COLOURS[(number * 5 + 1) % COLOURS.length]!, shape: SHAPES[number % SHAPES.length]! };
}
export function prizeById(id: string): Prize | null {
  const m = /^g(patch|mark):(\d+)$/.exec(id);
  if (!m || Number(m[2]) < 1) return null;
  const number = Number(m[2]), k = m[1] === 'patch' ? number * 2 - 1 : number * 2;
  return prizeFor(FIXED_COUNT + k * PRIZE_EVERY);
}

// ---------- every Mission ----------

const JOB_ORDER: readonly Job[] = ['drop', 'winch', 'rings', 'follow', 'search', 'storm'];
const SUBJECTS: Record<Job, readonly Subject[]> = {
  drop: ['crate'], winch: ['raft'], rings: ['rings'], follow: ['whale', 'dolphins', 'turtle', 'ferry'], search: ['rowboat', 'canoe', 'kayak', 'fishing'], storm: ['clouds'],
};
/** How windy, how rough and how much to do: rising a little with each Mission, then holding. */
export const windFor = (n: number, roll: number) => Math.min(.8, .05 + Math.min(n, 70) * .008 + roll * .12);
export const countFor = (n: number) => Math.min(9, 4 + Math.floor(n / 12));

/** Each run of six generated Missions has every job once, in its own order. A run starts with one of the first three jobs and ends with one
 *  of the last three, so the radio never has the same job twice running, even from one run to the next. */
function blockOrder(b: number): Job[] {
  const rng = seeded(0x10b + b * 31337), first = JOB_ORDER[int(rng, 0, 2)]!, last = JOB_ORDER[int(rng, 3, 5)]!;
  const middle = JOB_ORDER.filter(j => j !== first && j !== last);
  for (let i = middle.length - 1; i > 0; i--) { const j = int(rng, 0, i); [middle[i], middle[j]] = [middle[j]!, middle[i]!]; }
  return [first, ...middle, last];
}
export function jobOf(n: number): Job {
  const k = n - FIXED_COUNT - 1;
  return blockOrder(Math.floor(k / JOB_ORDER.length))[k % JOB_ORDER.length]!;
}

export function mission(n: number): Mission {
  const rng = seeded(0x5eaf + n * 7919), c = chartOf(n), place = chart(c);
  if (n <= FIXED_COUNT) {
    const f = FIXED[n - 1]!;
    return {
      n, name: f.name, job: f.job, subject: f.subject, place, chart: c, night: !!f.night, wind: windFor(n, rng()), waves: Math.min(1, .1 + n * .02 + (place.id === 'storm' ? .4 : 0)),
      count: countFor(n), suits: SUITS[f.job], patch: { glyph: f.glyph, bg: f.bg, rim: '#ffd23f' }, prize: null, needs: f.night ? 'part:lights' : null, seed: n * 7919 + 17,
    };
  }
  const job = jobOf(n), prize = prizeFor(n);
  return {
    n, name: null, job, subject: pick(rng, SUBJECTS[job]), place, chart: c, night: rng() < .25, wind: windFor(n, rng()), waves: Math.min(1, .2 + rng() * .6 + (place.ice ? 0 : .1)),
    count: countFor(n), suits: SUITS[job], patch: prize?.kind === 'patch' ? prize.patch : { glyph: '📻', bg: COLOURS[n % COLOURS.length]!, rim: '#f4f6fa' }, prize, needs: null, seed: n * 7919 + 17,
  };
}
