// The planets in a row, nearest first. Each needs a rocket with at least its Power. The first visit to each one gives his rover a
// gadget he keeps (the rover wears every gadget it has, so it gets cooler with every new planet), and some gadgets change how it
// drives. Each planet has its own sky, ground and pull: the Moon's low gravity makes floaty jumps.
export interface Planet {
  readonly id: string;
  readonly name: string;
  /** How it's said in a sentence: "You explored the Moon!" */
  readonly said: string;
  readonly power: number;
  readonly gravity: number;
  readonly sky: readonly [string, string];
  readonly ground: readonly [string, string];
  /** The planet's colour seen from space. */
  readonly globe: string;
  readonly feature: 'craters' | 'dust' | 'ice' | 'rings' | 'lava' | 'crystals' | 'jungle' | 'rainbow';
  readonly gadget: GadgetId;
}

export const GADGETS = {
  antenna: 'Antenna', wheels: 'Big Wheels', lights: 'Headlights', wings: 'Solar Wings',
  booster: 'Jump Booster', magnet: 'Crystal Magnet', siren: 'Siren Lights', trail: 'Rainbow Trail',
} as const;
export type GadgetId = keyof typeof GADGETS;
export type GadgetName = (typeof GADGETS)[GadgetId];
export const GADGET_IDS = Object.keys(GADGETS) as GadgetId[];

export const PLANETS = [
  { id: 'moon', name: 'Moon', said: 'the Moon', power: 4, gravity: 520, sky: ['#05060f', '#1b1f3a'], ground: ['#c9ccd6', '#8a8f9e'], globe: '#cfd3dc', feature: 'craters', gadget: 'antenna' },
  { id: 'mars', name: 'Mars', said: 'Mars', power: 5, gravity: 900, sky: ['#3b1407', '#d9824a'], ground: ['#d0592b', '#8e3418'], globe: '#d0592b', feature: 'dust', gadget: 'wheels' },
  { id: 'frosty', name: 'Frosty', said: 'Frosty', power: 7, gravity: 820, sky: ['#0d2a52', '#7fc4f0'], ground: ['#eaf6ff', '#9cc8e8'], globe: '#9fd8ff', feature: 'ice', gadget: 'lights' },
  { id: 'ringo', name: 'Ringo', said: 'Ringo', power: 9, gravity: 760, sky: ['#1f0f3d', '#c287e6'], ground: ['#e8c26a', '#b07c2e'], globe: '#e8c26a', feature: 'rings', gadget: 'wings' },
  { id: 'lava', name: 'Lava World', said: 'Lava World', power: 11, gravity: 980, sky: ['#1a0505', '#7a1d0c'], ground: ['#3a2a2a', '#1d1414'], globe: '#ff5a10', feature: 'lava', gadget: 'booster' },
  { id: 'crystal', name: 'Crystal World', said: 'Crystal World', power: 13, gravity: 700, sky: ['#071a2c', '#2fb3a6'], ground: ['#4a3d7a', '#2a2150'], globe: '#5bd6c7', feature: 'crystals', gadget: 'magnet' },
  { id: 'jungle', name: 'Jungle World', said: 'Jungle World', power: 14, gravity: 940, sky: ['#08301a', '#8fe08a'], ground: ['#3e8f3a', '#22541f'], globe: '#3e8f3a', feature: 'jungle', gadget: 'siren' },
  { id: 'rainbow', name: 'Rainbow World', said: 'Rainbow World', power: 16, gravity: 640, sky: ['#2a1a5e', '#ff9ad5'], ground: ['#ffffff', '#c9b8ff'], globe: '#ff7ad9', feature: 'rainbow', gadget: 'trail' },
] as const satisfies readonly Planet[];
export type PlanetId = (typeof PLANETS)[number]['id'];
export type PlanetName = (typeof PLANETS)[number]['name'];
export type PlanetSaid = (typeof PLANETS)[number]['said'];
export type PlanetDef = (typeof PLANETS)[number];
export const planet = (id: PlanetId): PlanetDef => PLANETS.find(p => p.id === id)!;
export const isPlanetId = (x: unknown): x is PlanetId => PLANETS.some(p => p.id === x);
