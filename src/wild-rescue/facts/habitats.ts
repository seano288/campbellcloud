// The seven habitats, as a first grader meets them. Plain data, no game code. The game's questions, its lessons and the Park all
// read these, so a habitat is named and described the same way everywhere.
//
// "Polar" is one habitat at this age, but it is really two places at opposite ends of the Earth: penguins live in the far south and
// polar bears in the far north. They are never shown as neighbours (see animals.ts, `pole`).

export const HABITAT_IDS = ['ocean', 'pond', 'forest', 'grassland', 'desert', 'polar', 'farm'] as const;
export type HabitatId = (typeof HABITAT_IDS)[number];

export interface Habitat {
  readonly id: HabitatId;
  /** On its tile, and said alone ("Desert."). */
  readonly name: string;
  /** The end of "A camel lives …" and "Which of these also lives …?". */
  readonly lives: string;
  /** One plain sentence about the place, said in the lesson and in the Park. */
  readonly about: string;
  /** The ground and sky its tile, its Park plot and its drive are painted in. */
  readonly ground: string;
  readonly sky: string;
  readonly accent: string;
  /** A small sign for the place on its tile, drawn from emoji the iPad shows clearly. */
  readonly sign: string;
}

export const HABITATS = [
  { id: 'ocean', name: 'Ocean', lives: 'in the ocean', about: 'The ocean is big and salty.', ground: '#2f8fd8', sky: '#9fd8f5', accent: '#f2d38a', sign: '🌊' },
  { id: 'pond', name: 'Pond and river', lives: 'in ponds and rivers', about: 'Ponds and rivers have fresh water.', ground: '#5aa9d6', sky: '#bfe6f5', accent: '#5fb34a', sign: '💧' },
  { id: 'forest', name: 'Forest', lives: 'in the forest', about: 'A forest has lots of trees.', ground: '#3f8a3a', sky: '#bfe3b0', accent: '#7a4f2a', sign: '🌲' },
  { id: 'grassland', name: 'Grassland', lives: 'in the grassland', about: 'A grassland is wide and flat, with tall grass.', ground: '#d8c25a', sky: '#f6e7a6', accent: '#8a9a3a', sign: '🌾' },
  { id: 'desert', name: 'Desert', lives: 'in the desert', about: 'A desert is hot and dry.', ground: '#f0c97a', sky: '#ffe3b0', accent: '#d9822b', sign: '🏜️' },
  { id: 'polar', name: 'Polar', lives: 'in the icy polar lands', about: 'The polar lands are icy and cold.', ground: '#eef6fb', sky: '#cfe8f6', accent: '#7fb8dc', sign: '❄️' },
  { id: 'farm', name: 'Farm', lives: 'on a farm', about: 'People raise animals on a farm.', ground: '#8cc152', sky: '#cdeaa8', accent: '#c0392b', sign: '🚜' },
] as const satisfies readonly Habitat[];
export type HabitatName = (typeof HABITATS)[number]['name'];
export type HabitatLives = (typeof HABITATS)[number]['lives'];
export type HabitatAbout = (typeof HABITATS)[number]['about'];
export const habitat = (id: HabitatId) => HABITATS.find(h => h.id === id)!;

/**
 * Habitats so unlike each other that no animal could be argued into both: Where It Lives Level 1 offers the right habitat and one of
 * these. Symmetric, checked by a test.
 */
export const VERY_DIFFERENT: Record<HabitatId, readonly HabitatId[]> = {
  ocean: ['desert', 'farm', 'forest', 'grassland'],
  pond: ['desert', 'polar'],
  forest: ['ocean', 'desert', 'polar'],
  grassland: ['ocean', 'polar'],
  desert: ['ocean', 'pond', 'forest', 'polar'],
  polar: ['desert', 'pond', 'forest', 'grassland', 'farm'],
  farm: ['ocean', 'polar'],
};
