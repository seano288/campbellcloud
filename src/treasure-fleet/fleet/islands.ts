// The eight islands, nearest first. Each needs a ship with at least its Range. Each one's treasure goes in his Hoard the first time he
// digs it up; going back pays Bolts but no new treasure. Each island has its own sand, trees and sea, and its own spot on the sea chart
// (a map with a compass rose and a key, so the reward quietly uses what the questions teach; it is never a question).
export interface Island {
  readonly id: string;
  readonly name: string;
  readonly range: number;
  readonly treasure: string;
  /** What the treasure looks like in the Hoard and the chest. */
  readonly art: string;
  readonly glow: string;
  readonly sand: string;
  readonly green: string;
  readonly sea: string;
  /** Where it sits on the sea chart, 0 to 100 across (west to east) and down (north to south). Home port is in the south-west. */
  readonly chart: readonly [number, number];
}

export const ISLANDS = [
  { id: 'turtle', name: 'Turtle Island', range: 4, treasure: 'the Golden Compass', art: '🧭', glow: '#ffd23f', sand: '#f2d38a', green: '#4cb05a', sea: '#2f8fd8', chart: [30, 68] },
  { id: 'palm', name: 'Palm Island', range: 5, treasure: 'the Silver Spyglass', art: '🔭', glow: '#d8e2ee', sand: '#f6dd9c', green: '#3e9f4a', sea: '#2a86cf', chart: [52, 78] },
  { id: 'parrot', name: 'Parrot Island', range: 7, treasure: 'the Jade Parrot', art: '🦜', glow: '#3ddc84', sand: '#efcf86', green: '#2f9b62', sea: '#2380c8', chart: [22, 42] },
  { id: 'skull', name: 'Skull Rock', range: 9, treasure: 'the Ruby Skull', art: '💀', glow: '#ff4d6d', sand: '#cfc3a8', green: '#6a8f5a', sea: '#1f6fae', chart: [62, 52] },
  { id: 'mermaid', name: 'Mermaid Lagoon', range: 11, treasure: 'the Emerald Crown', art: '👑', glow: '#2ee6a6', sand: '#f8e2b0', green: '#36b07a', sea: '#1aa6c8', chart: [80, 70] },
  { id: 'volcano', name: 'Volcano Island', range: 13, treasure: 'the Dragon Egg', art: '🥚', glow: '#ff8a1f', sand: '#8a6f5a', green: '#5a7f3a', sea: '#1d5f9a', chart: [45, 24] },
  { id: 'kraken', name: 'Kraken Reef', range: 14, treasure: "the Kraken's Pearl", art: '🦪', glow: '#c9b8ff', sand: '#e7d7b8', green: '#3f8f7a', sea: '#174f86', chart: [78, 32] },
  { id: 'star', name: 'Starfall Island', range: 16, treasure: 'the Diamond Anchor', art: '⚓', glow: '#9fe8ff', sand: '#fff0c8', green: '#59c26a', sea: '#123f74', chart: [68, 10] },
] as const satisfies readonly Island[];
export type IslandId = (typeof ISLANDS)[number]['id'];
export type IslandName = (typeof ISLANDS)[number]['name'];
export type TreasureName = (typeof ISLANDS)[number]['treasure'];
export type IslandDef = (typeof ISLANDS)[number];
export const island = (id: IslandId): IslandDef => ISLANDS.find(i => i.id === id)!;
export const isIslandId = (x: unknown): x is IslandId => ISLANDS.some(i => i.id === x);
/** The home port on the sea chart. */
export const PORT = [10, 90] as const;
