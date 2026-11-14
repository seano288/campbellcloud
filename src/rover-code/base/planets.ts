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
  readonly feature: 'craters' | 'dust' | 'ice' | 'rings' | 'lava' | 'crystals' | 'jungle' | 'rainbow'
    | 'candy' | 'bubbles' | 'ocean' | 'cactus' | 'mushrooms' | 'storm' | 'robot' | 'stars';
  readonly gadget: GadgetId;
}

export const GADGETS = {
  antenna: 'Antenna', wheels: 'Big Wheels', lights: 'Headlights', wings: 'Solar Wings',
  booster: 'Jump Booster', magnet: 'Crystal Magnet', siren: 'Siren Lights', trail: 'Rainbow Trail',
  cannon: 'Confetti Cannon', dome: 'Bubble Dome', dish: 'Satellite Dish', stripes: 'Racing Stripes',
  gold: 'Gold Wheels', turbo: 'Turbo Jets', arm: 'Robot Arm', shield: 'Star Shield',
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
  // the second eight, added on 2026-11-14 with Rungs 4 to 6, once he had been everywhere
  { id: 'candy', name: 'Candy World', said: 'Candy World', power: 17, gravity: 860, sky: ['#3a1440', '#ffb3d9'], ground: ['#ff8fc8', '#c2508f'], globe: '#ff8fc8', feature: 'candy', gadget: 'cannon' },
  { id: 'bubble', name: 'Bubble World', said: 'Bubble World', power: 18, gravity: 470, sky: ['#0a2a4a', '#9fe3ff'], ground: ['#bfe8ff', '#6fb4dc'], globe: '#7fd3ff', feature: 'bubbles', gadget: 'dome' },
  { id: 'ocean', name: 'Ocean World', said: 'Ocean World', power: 20, gravity: 880, sky: ['#06284a', '#58c4f0'], ground: ['#f2d68a', '#c49a4a'], globe: '#2f7fe0', feature: 'ocean', gadget: 'dish' },
  { id: 'cactus', name: 'Cactus World', said: 'Cactus World', power: 21, gravity: 950, sky: ['#5a2a10', '#ffcf7a'], ground: ['#e8b45a', '#b07a2e'], globe: '#e8a54a', feature: 'cactus', gadget: 'stripes' },
  { id: 'mushroom', name: 'Mushroom World', said: 'Mushroom World', power: 23, gravity: 820, sky: ['#1a0f2e', '#7a5ad8'], ground: ['#6a4a8a', '#3d2a55'], globe: '#b06ad8', feature: 'mushrooms', gadget: 'gold' },
  { id: 'thunder', name: 'Thunder World', said: 'Thunder World', power: 24, gravity: 900, sky: ['#0a0c18', '#4a5070'], ground: ['#6a7080', '#3a3e4a'], globe: '#6a7390', feature: 'storm', gadget: 'turbo' },
  { id: 'robot', name: 'Robot World', said: 'Robot World', power: 26, gravity: 940, sky: ['#101820', '#5a7a8a'], ground: ['#a8b0ba', '#5b6170'], globe: '#9aa3ad', feature: 'robot', gadget: 'arm' },
  { id: 'star', name: 'Star World', said: 'Star World', power: 28, gravity: 600, sky: ['#05020f', '#3a1a6a'], ground: ['#ffe14d', '#d8a020'], globe: '#ffd23f', feature: 'stars', gadget: 'shield' },
] as const satisfies readonly Planet[];
export type PlanetId = (typeof PLANETS)[number]['id'];
export type PlanetName = (typeof PLANETS)[number]['name'];
export type PlanetSaid = (typeof PLANETS)[number]['said'];
export type PlanetDef = (typeof PLANETS)[number];
export const planet = (id: PlanetId): PlanetDef => PLANETS.find(p => p.id === id)!;
export const isPlanetId = (x: unknown): x is PlanetId => PLANETS.some(p => p.id === x);
