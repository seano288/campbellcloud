// The seven continents, as American schools teach them (a default for the parent to confirm: some places teach six or five). Tables only,
// no game code. Each has its one colour, used everywhere (the flat map, the globe, the orbit, the photo wall), a safe area well inside its
// coast where its target is placed and its name is drawn (geo.test.ts checks every point of it is that continent and nothing arguable),
// the point the globe turns to face it, one true "did you know" line (sources in .scratch/globe-hopper/spec.md), and how the fuller lesson
// finds it from a continent he already knows.

export const CONTINENT_IDS = ['africa', 'europe', 'asia', 'namerica', 'samerica', 'australia', 'antarctica'] as const;
export type ContinentId = (typeof CONTINENT_IDS)[number];

/** A circle on the Earth: centre and radius in degrees. */
export interface Spot { readonly lon: number; readonly lat: number; readonly r: number }
export type Way = 'north' | 'south' | 'east' | 'west';

export interface Continent {
  readonly id: ContinentId;
  readonly name: 'Africa' | 'Europe' | 'Asia' | 'North America' | 'South America' | 'Australia' | 'Antarctica';
  readonly colour: string;
  /** The darker shade for its outline and its name. */
  readonly ink: string;
  readonly safe: Spot;
  /** Where the globe looks to show it whole. */
  readonly face: { readonly lon: number; readonly lat: number };
  /** Its "did you know" line, said when it is met and in its lesson. */
  readonly line: string;
  /** The fuller lesson: "Start at Africa. Go north. This is Europe." */
  readonly from: { readonly start: ContinentId; readonly go: Way };
}

export const CONTINENTS = [
  { id: 'africa', name: 'Africa', colour: '#f59b2e', ink: '#8a4a00', safe: { lon: 21, lat: 5, r: 8 }, face: { lon: 18, lat: 2 },
    line: 'Africa is the hottest continent.', from: { start: 'europe', go: 'south' } },
  { id: 'europe', name: 'Europe', colour: '#ef5a7a', ink: '#8c1c36', safe: { lon: 17, lat: 49, r: 4 }, face: { lon: 15, lat: 50 },
    line: 'Europe is the second smallest continent.', from: { start: 'africa', go: 'north' } },
  { id: 'asia', name: 'Asia', colour: '#f5cf3b', ink: '#7d6400', safe: { lon: 92, lat: 41, r: 8 }, face: { lon: 95, lat: 35 },
    line: 'Asia is the biggest continent.', from: { start: 'europe', go: 'east' } },
  { id: 'namerica', name: 'North America', colour: '#5cbf4a', ink: '#1f6b14', safe: { lon: -102, lat: 42, r: 7 }, face: { lon: -100, lat: 42 },
    line: 'Canada, the United States and Mexico are in North America.', from: { start: 'samerica', go: 'north' } },
  { id: 'samerica', name: 'South America', colour: '#a66bd9', ink: '#4f2280', safe: { lon: -59, lat: -11, r: 8 }, face: { lon: -60, lat: -18 },
    line: 'The Andes mountains run all the way down the west side of South America.', from: { start: 'namerica', go: 'south' } },
  { id: 'australia', name: 'Australia', colour: '#e0533c', ink: '#7a1a0c', safe: { lon: 134, lat: -24, r: 5 }, face: { lon: 134, lat: -25 },
    line: 'Australia is the smallest continent.', from: { start: 'asia', go: 'south' } },
  { id: 'antarctica', name: 'Antarctica', colour: '#f3f7fc', ink: '#5d7790', safe: { lon: 60, lat: -80, r: 4 }, face: { lon: 30, lat: -70 },
    line: 'Antarctica is the coldest continent. It is covered in ice.', from: { start: 'samerica', go: 'south' } },
] as const satisfies readonly Continent[];
export type ContinentName = (typeof CONTINENTS)[number]['name'];
export const continent = (id: ContinentId): Continent => CONTINENTS.find(c => c.id === id)!;

/** Land drawn on the maps but never a continent's answer. Greenland is an island, not a continent (and never a choice). */
export const APART_COLOURS = { greenland: '#e4ecf2', oceania: '#f2aa9c', islands: '#d9d9d9' } as const;

/** "Which continent is south of Europe?": only the questions with one plain answer, and the choices that are plainly wrong for each. */
export const NEIGHBOURS: readonly { readonly from: ContinentId; readonly way: Way; readonly answer: ContinentId; readonly wrong: readonly ContinentId[] }[] = [
  { from: 'europe', way: 'south', answer: 'africa', wrong: ['namerica', 'australia', 'samerica', 'antarctica'] },
  { from: 'africa', way: 'north', answer: 'europe', wrong: ['australia', 'samerica', 'antarctica', 'namerica'] },
  { from: 'namerica', way: 'south', answer: 'samerica', wrong: ['europe', 'asia', 'australia', 'africa'] },
  { from: 'samerica', way: 'north', answer: 'namerica', wrong: ['australia', 'asia', 'antarctica', 'europe'] },
  { from: 'europe', way: 'east', answer: 'asia', wrong: ['namerica', 'samerica', 'antarctica', 'australia'] },
  { from: 'samerica', way: 'south', answer: 'antarctica', wrong: ['europe', 'asia', 'namerica', 'africa'] },
];
