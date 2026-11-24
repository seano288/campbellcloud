// The sixteen islands, nearest first (the second eight were added on 2026-11-14, when he had dug up all of the first). Each needs a ship with at least its Range. Each one's treasure goes in his Hoard the first time he
// digs it up; going back pays Doubloons but no new treasure. Each island has its own sand, trees and sea, and its own spot on the sea chart
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
  /** The sky over its beach. */
  readonly sky: string;
  /** Where it sits on the sea chart, 0 to 100 across (west to east) and down (north to south). Home port is in the south-west. */
  readonly chart: readonly [number, number];
}

export const ISLANDS = [
  { id: 'turtle', name: 'Turtle Island', range: 4, treasure: 'the Golden Compass', art: '🧭', glow: '#ffd23f', sand: '#f2d38a', green: '#4cb05a', sea: '#2f8fd8', sky: '#7cc6f2', chart: [28, 72] },
  { id: 'palm', name: 'Palm Island', range: 5, treasure: 'the Silver Spyglass', art: '🔭', glow: '#d8e2ee', sand: '#f6dd9c', green: '#3e9f4a', sea: '#2a86cf', sky: '#7cc6f2', chart: [46, 88] },
  { id: 'parrot', name: 'Parrot Island', range: 7, treasure: 'the Jade Parrot', art: '🦜', glow: '#3ddc84', sand: '#efcf86', green: '#2f9b62', sea: '#2380c8', sky: '#7cc6f2', chart: [14, 56] },
  { id: 'skull', name: 'Skull Rock', range: 9, treasure: 'the Ruby Skull', art: '💀', glow: '#ff4d6d', sand: '#cfc3a8', green: '#6a8f5a', sea: '#1f6fae', sky: '#8fb4cf', chart: [38, 58] },
  { id: 'mermaid', name: 'Mermaid Lagoon', range: 11, treasure: 'the Emerald Crown', art: '👑', glow: '#2ee6a6', sand: '#f8e2b0', green: '#36b07a', sea: '#1aa6c8', sky: '#86d8f0', chart: [62, 82] },
  { id: 'volcano', name: 'Volcano Island', range: 13, treasure: 'the Dragon Egg', art: '🥚', glow: '#ff8a1f', sand: '#8a6f5a', green: '#5a7f3a', sea: '#1d5f9a', sky: '#f2a46a', chart: [26, 38] },
  { id: 'kraken', name: 'Kraken Reef', range: 14, treasure: "the Kraken's Pearl", art: '🦪', glow: '#c9b8ff', sand: '#e7d7b8', green: '#3f8f7a', sea: '#174f86', sky: '#9fb2e0', chart: [54, 64] },
  { id: 'star', name: 'Starfall Island', range: 16, treasure: 'the Diamond Anchor', art: '⚓', glow: '#9fe8ff', sand: '#fff0c8', green: '#59c26a', sea: '#123f74', sky: '#5d7fd0', chart: [80, 92] },
  { id: 'shell', name: 'Seashell Cove', range: 17, treasure: 'the Magic Conch', art: '🐚', glow: '#ffb3c7', sand: '#fbe3d0', green: '#5fbf7a', sea: '#2aa0d0', sky: '#ffc9b0', chart: [44, 34] },
  { id: 'iceberg', name: 'Iceberg Island', range: 18, treasure: 'the Crystal Sword', art: '🗡️', glow: '#bfefff', sand: '#eef6fb', green: '#9fd3c7', sea: '#3f86b8', sky: '#cfe8f6', chart: [66, 54] },
  { id: 'banana', name: 'Banana Island', range: 20, treasure: 'the Golden Banana', art: '🍌', glow: '#ffe14d', sand: '#f7d77a', green: '#2fa84a', sea: '#1f94c4', sky: '#7cd0f2', chart: [92, 74] },
  { id: 'lighthouse', name: 'Lighthouse Point', range: 21, treasure: 'the Lucky Lantern', art: '🏮', glow: '#ff5a3c', sand: '#e9d6a8', green: '#5a9f5a', sea: '#1d6aa6', sky: '#f6b878', chart: [32, 14] },
  { id: 'wreck', name: 'Shipwreck Bay', range: 23, treasure: 'the Old Pirate Map', art: '🗺️', glow: '#f2d38a', sand: '#d8c49a', green: '#6f8f4a', sea: '#1a5a8c', sky: '#a9bccb', chart: [56, 20] },
  { id: 'thunder', name: 'Thunder Isle', range: 24, treasure: 'the Storm Bell', art: '🔔', glow: '#ffe066', sand: '#b9ad94', green: '#4f7a5a', sea: '#16466e', sky: '#5f6b84', chart: [78, 40] },
  { id: 'ghost', name: 'Ghost Island', range: 26, treasure: 'the Silver Key', art: '🗝️', glow: '#b8ffe6', sand: '#c9c6d8', green: '#5f7a78', sea: '#233f66', sky: '#6a5f9a', chart: [72, 10] },
  { id: 'rainbow', name: 'Rainbow Reef', range: 28, treasure: 'the Rainbow Diamond', art: '💎', glow: '#ff7ce0', sand: '#fff3d6', green: '#4cc77a', sea: '#1aa0d8', sky: '#b9a8ff', chart: [92, 34] },
] as const satisfies readonly Island[];
export type IslandId = (typeof ISLANDS)[number]['id'];
export type IslandName = (typeof ISLANDS)[number]['name'];
export type TreasureName = (typeof ISLANDS)[number]['treasure'];
export type IslandDef = (typeof ISLANDS)[number];
export const island = (id: IslandId): IslandDef => ISLANDS.find(i => i.id === id)!;
export const isIslandId = (x: unknown): x is IslandId => ISLANDS.some(i => i.id === x);
/** The home port on the sea chart. */
export const PORT = [10, 90] as const;
