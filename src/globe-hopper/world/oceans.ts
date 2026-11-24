// The five oceans, the Southern Ocean among them, the way American schools now teach them (a default for the parent to confirm). Tables
// only. Each has a safe area well inside it (geo.test.ts checks every point of it is that ocean), the continents that touch it (its lesson
// names them as it fills with colour), one true "did you know" line, and how the fuller lesson finds it from a continent he knows.
import type { ContinentId, Spot, Way } from './continents';

export const OCEAN_IDS = ['pacific', 'atlantic', 'indian', 'arctic', 'southern'] as const;
export type OceanId = (typeof OCEAN_IDS)[number];

export interface Ocean {
  readonly id: OceanId;
  readonly name: 'Pacific Ocean' | 'Atlantic Ocean' | 'Indian Ocean' | 'Arctic Ocean' | 'Southern Ocean';
  /** The colour it fills with in a lesson. */
  readonly tint: string;
  readonly safe: Spot;
  /** Where the globe looks to show it. */
  readonly face: { readonly lon: number; readonly lat: number };
  readonly touches: readonly ContinentId[];
  readonly line: string;
  readonly from: { readonly start: ContinentId; readonly go: Way };
}

export const OCEANS = [
  { id: 'pacific', name: 'Pacific Ocean', tint: '#5fd3f3', safe: { lon: -140, lat: 4, r: 10 }, face: { lon: -160, lat: 5 },
    touches: ['asia', 'australia', 'namerica', 'samerica', 'antarctica'], line: 'The Pacific is the biggest and deepest ocean.', from: { start: 'samerica', go: 'west' } },
  { id: 'atlantic', name: 'Atlantic Ocean', tint: '#7be0c0', safe: { lon: -36, lat: 24, r: 9 }, face: { lon: -30, lat: 10 },
    touches: ['namerica', 'samerica', 'europe', 'africa', 'antarctica'], line: 'The Atlantic is the second biggest ocean.', from: { start: 'africa', go: 'west' } },
  { id: 'indian', name: 'Indian Ocean', tint: '#b59cf5', safe: { lon: 76, lat: -20, r: 10 }, face: { lon: 75, lat: -15 },
    touches: ['africa', 'asia', 'australia', 'antarctica'], line: 'The Indian Ocean is the third biggest ocean.', from: { start: 'africa', go: 'east' } },
  { id: 'arctic', name: 'Arctic Ocean', tint: '#d6f1ff', safe: { lon: 0, lat: 84, r: 3 }, face: { lon: 0, lat: 70 },
    touches: ['namerica', 'europe', 'asia'], line: 'The Arctic is the smallest ocean. Much of it is covered in ice.', from: { start: 'europe', go: 'north' } },
  { id: 'southern', name: 'Southern Ocean', tint: '#9fd8ff', safe: { lon: -120, lat: -67, r: 2.5 }, face: { lon: -120, lat: -60 },
    touches: ['antarctica'], line: 'The Southern Ocean goes all the way round Antarctica.', from: { start: 'australia', go: 'south' } },
] as const satisfies readonly Ocean[];
export type OceanName = (typeof OCEANS)[number]['name'];
export const ocean = (id: OceanId): Ocean => OCEANS.find(o => o.id === id)!;

/** "Which ocean is between Africa and Australia?": only plain ones, with choices that are plainly wrong. */
export const BETWEEN: readonly { readonly a: ContinentId; readonly b: ContinentId | 'pole'; readonly answer: OceanId; readonly wrong: readonly OceanId[] }[] = [
  { a: 'africa', b: 'australia', answer: 'indian', wrong: ['arctic', 'atlantic'] },
  { a: 'namerica', b: 'europe', answer: 'atlantic', wrong: ['indian', 'pacific', 'southern'] },
  { a: 'samerica', b: 'africa', answer: 'atlantic', wrong: ['indian', 'arctic', 'pacific'] },
  { a: 'asia', b: 'namerica', answer: 'pacific', wrong: ['indian', 'atlantic', 'southern'] },
  { a: 'australia', b: 'samerica', answer: 'pacific', wrong: ['arctic', 'atlantic'] },
  { a: 'antarctica', b: 'pole', answer: 'southern', wrong: ['arctic', 'atlantic', 'indian'] },
];
