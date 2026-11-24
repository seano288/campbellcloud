// The shapes of the land, and where it is hot and cold. Tables only, no game code.
//
// Landforms: each with the one plain sentence its lesson says (from National Geographic Education's encyclopedia definitions, simplified;
// see the spec), whether it has a symbol on a map (Level 2), and which others must never be choices beside it at Level 3, where the
// question is its meaning ("Which one has water all round it?") and those could be argued to fit too.
//
// Hot and cold: places on the globe for the marks Hot and Cold asks about. Hot ones are low, wet places near the equator (no mountains:
// it snows on Kilimanjaro); cold ones are far toward the poles. A question only ever compares one from each list, so "which is colder" has
// one plain answer.
import type { LonLat } from '../map/geo';

export const LANDFORM_IDS = ['mountain', 'hill', 'valley', 'river', 'lake', 'island', 'desert', 'plain', 'volcano', 'coast'] as const;
export type LandformId = (typeof LANDFORM_IDS)[number];

export interface Landform {
  readonly id: LandformId;
  readonly name: 'mountain' | 'hill' | 'valley' | 'river' | 'lake' | 'island' | 'desert' | 'plain' | 'volcano' | 'coast';
  /** "An island is land with water all round it." */
  readonly means: string;
  /** Level 3's question: "Which one has water all round it?" */
  readonly ask: string;
  /** It has a clear symbol on a map (a valley has none a first grader would know). */
  readonly symbol: boolean;
  /** Never a choice beside this one at Level 3: its meaning could be argued to fit them too. */
  readonly clash: readonly LandformId[];
}

export const LANDFORMS = [
  { id: 'mountain', name: 'mountain', means: 'A mountain is very high land with steep sides.', ask: 'Which one is very high land with steep sides?', symbol: true, clash: ['volcano', 'hill', 'valley'] },
  { id: 'hill', name: 'hill', means: 'A hill is land that is higher than the land around it, but lower than a mountain.', ask: 'Which one is a little higher than the land around it, but not as high as a mountain?', symbol: true, clash: ['mountain', 'volcano', 'valley'] },
  { id: 'valley', name: 'valley', means: 'A valley is low land between hills or mountains.', ask: 'Which one is low land between hills or mountains?', symbol: false, clash: ['river', 'plain', 'mountain', 'hill', 'lake'] },
  { id: 'river', name: 'river', means: 'A river is water that flows across the land.', ask: 'Which one is water that flows across the land?', symbol: true, clash: ['valley', 'coast'] },
  { id: 'lake', name: 'lake', means: 'A lake is water with land all round it.', ask: 'Which one is water with land all round it?', symbol: true, clash: ['valley'] },
  { id: 'island', name: 'island', means: 'An island is land with water all round it.', ask: 'Which one is land with water all round it?', symbol: true, clash: ['coast'] },
  { id: 'desert', name: 'desert', means: 'A desert is a very dry place that gets very little rain.', ask: 'Which one is a very dry place with very little rain?', symbol: true, clash: [] },
  { id: 'plain', name: 'plain', means: 'A plain is wide, flat land.', ask: 'Which one is wide, flat land?', symbol: true, clash: ['valley', 'desert'] },
  { id: 'volcano', name: 'volcano', means: 'A volcano is a place where hot, melted rock comes up from inside the Earth.', ask: 'Which one can let out hot, melted rock?', symbol: true, clash: ['mountain', 'hill'] },
  { id: 'coast', name: 'coast', means: 'A coast is the land beside the sea.', ask: 'Which one is the land beside the sea?', symbol: true, clash: ['island', 'river'] },
] as const satisfies readonly Landform[];
export const landform = (id: LandformId): Landform => LANDFORMS.find(l => l.id === id)!;
/** Level 1 never puts a hill beside a mountain or a volcano: from the side, which is "higher" is a judgment, not a shape. */
export const LOOK_ALIKE: readonly (readonly [LandformId, LandformId])[] = [['hill', 'mountain'], ['hill', 'volcano'], ['valley', 'river']];

export interface Spot extends LonLat { readonly name: string; readonly land?: boolean }
/** Hot: low, wet, right by the equator. The steamy scene (Level 2) uses only the ones on land: a jungle, not the open sea. */
export const HOT: readonly Spot[] = [
  { name: 'the Amazon', lon: -60, lat: -3, land: true }, { name: 'the Congo', lon: 20, lat: 0, land: true }, { name: 'Borneo', lon: 114, lat: 1, land: true },
  { name: 'Sumatra', lon: 101, lat: 0, land: true }, { name: 'the middle of the Pacific', lon: -150, lat: 0 }, { name: 'the middle of the Atlantic', lon: -25, lat: 2 },
  { name: 'the Indian Ocean near the equator', lon: 75, lat: -2 }, { name: 'Gabon', lon: 11.5, lat: -0.5, land: true },
];
/** Cold: far toward a pole. */
export const COLD: readonly Spot[] = [
  { name: 'Antarctica', lon: 60, lat: -80 }, { name: 'Antarctica', lon: -100, lat: -78 }, { name: 'the Arctic Ocean', lon: 0, lat: 85 },
  { name: 'Greenland', lon: -40, lat: 75 }, { name: 'the far north of Canada', lon: -95, lat: 72 }, { name: 'the Arctic Ocean', lon: 150, lat: 80 },
  { name: 'the Southern Ocean', lon: 20, lat: -66 }, { name: 'Antarctica', lon: 140, lat: -75 },
];
/** Level 3 also compares a mild place far from both. Every one is low and by the sea. */
export const MILD: readonly Spot[] = [
  { name: 'Spain', lon: -4, lat: 38 }, { name: 'Japan', lon: 137, lat: 35 }, { name: 'California', lon: -119, lat: 35 },
  { name: 'Chile', lon: -71, lat: -35 }, { name: 'South Africa', lon: 22, lat: -33.5 }, { name: 'southern Australia', lon: 138, lat: -34 },
];
