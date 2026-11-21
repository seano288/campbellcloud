// The submarines he can choose and build, added on 2026-11-21 when the parent asked for more rewards and for him to "choose and build
// his own submarines". The Explorer Sub is free; the others are bought at the Dock. Each one does something of its own on a Dive (its
// trick, said when he taps it), and each one keeps its own build: its nose, tail, fins, top, paint, stripes, light colour, horn, buddy
// and bubbles, so the Shark Sub can wear a Saw Nose and the Duck Sub a Party Hat. The parts that open zones (Hull, Headlights, Sonar,
// Motor, Claw, Flash) are shared: every submarine dives with the ones he has fitted.
//
// A trick never opens a zone (zones need parts he owns), and none of them makes a Dive pay more: they make it easier or more fun.

export const TRICKS = [
  'It turns super quick!', 'Its horn reaches extra far!', 'It has a light all around it!', 'It goes extra fast!',
  'It has one more camera flash!', 'Its light is extra wide!', 'Its sonar reaches extra far!', 'Its claw grabs from extra far!',
  'Its light reaches extra far!', 'It takes pictures super fast!', 'It is fast and bright!',
] as const;
export type Trick = (typeof TRICKS)[number];

/** What a submarine changes on a Dive: times the parts' numbers, or added to them. */
export interface SubMods {
  readonly speed?: number; readonly reach?: number; readonly half?: number; readonly sonar?: number; readonly claw?: number;
  /** Extra camera flashes. */
  readonly flashes?: number;
  /** How quickly it turns toward his finger, times the Explorer's. */
  readonly turn?: number;
  /** Seconds to take a picture, times the usual. */
  readonly snap?: number;
  /** How far the horn makes animals wiggle, times the usual. */
  readonly horn?: number;
  /** A soft light all around it, this far (world units). */
  readonly ring?: number;
}

export interface SubDef {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly trick: Trick | null;
  /** Its own colours: the "Its Own Colors" paint. */
  readonly own: { readonly color: string; readonly color2?: string; readonly pattern?: string };
  readonly mods: SubMods;
}

// No price over 100, the most the voice can say.
export const SUBS = [
  { id: 'explorer', name: 'Explorer Sub', price: 0, trick: null, own: { color: '#ffd23f' }, mods: {} },
  { id: 'mini', name: 'Mini Sub', price: 15, trick: 'It turns super quick!', own: { color: '#ff8a1a', color2: '#ffffff', pattern: 'stripes' }, mods: { turn: 2.2 } },
  { id: 'duck', name: 'Duck Sub', price: 20, trick: 'Its horn reaches extra far!', own: { color: '#ffe23f' }, mods: { horn: 2 } },
  { id: 'bubble', name: 'Bubble Sub', price: 30, trick: 'It has a light all around it!', own: { color: '#e8323a' }, mods: { ring: 210 } },
  { id: 'torpedo', name: 'Torpedo Sub', price: 40, trick: 'It goes extra fast!', own: { color: '#5d6b78', color2: '#e8323a', pattern: 'nosecone' }, mods: { speed: 1.25 } },
  { id: 'turtle', name: 'Turtle Sub', price: 50, trick: 'It has one more camera flash!', own: { color: '#4f9a4a', color2: '#e9d39a', pattern: 'belly' }, mods: { flashes: 1 } },
  { id: 'manta', name: 'Manta Sub', price: 60, trick: 'Its light is extra wide!', own: { color: '#2a3a6a', color2: '#e8eef4', pattern: 'belly' }, mods: { half: 1.3 } },
  { id: 'whale', name: 'Whale Sub', price: 70, trick: 'Its sonar reaches extra far!', own: { color: '#4a6a9a', color2: '#d8e4f0', pattern: 'grooves' }, mods: { sonar: 1.35 } },
  { id: 'shark', name: 'Shark Sub', price: 80, trick: 'Its claw grabs from extra far!', own: { color: '#8a9aa8', color2: '#f4f4f0', pattern: 'shark' }, mods: { claw: 1.4 } },
  { id: 'angler', name: 'Angler Sub', price: 85, trick: 'Its light reaches extra far!', own: { color: '#5a3a4a', color2: '#8a5a6a', pattern: 'spots' }, mods: { reach: 1.25 } },
  { id: 'octo', name: 'Octo Sub', price: 90, trick: 'It takes pictures super fast!', own: { color: '#9a5aff', color2: '#ff9ae0', pattern: 'spots' }, mods: { snap: 0.55 } },
  { id: 'dragon', name: 'Dragon Sub', price: 100, trick: 'It is fast and bright!', own: { color: '#3fae5a', color2: '#ffd23f', pattern: 'belly' }, mods: { speed: 1.15, reach: 1.15 } },
] as const satisfies readonly SubDef[];
export type SubId = (typeof SUBS)[number]['id'];
export type SubName = (typeof SUBS)[number]['name'];
export const SUB_IDS = SUBS.map(s => s.id) as SubId[];
export const isSubId = (x: unknown): x is SubId => typeof x === 'string' && SUBS.some(s => s.id === x);
export const subDef = (id: SubId): SubDef => SUBS.find(s => s.id === id) ?? SUBS[0];
