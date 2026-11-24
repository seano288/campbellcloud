// The Fact File's labelled pictures: each part has a label he reads and taps (drawn in art/Diagram.tsx). Plain data.
export const DIAGRAMS = {
  lander: ['hatch', 'ladder', 'legs', 'rocket'],
  suit: ['helmet', 'backpack', 'hands', 'boots'],
  rover: ['dish', 'light', 'box', 'wheels'],
  sky: ['sun', 'Earth', 'moon'],
  ground: ['crater', 'rock', 'dust', 'footprint'],
  telescope: ['big end', 'little end', 'legs'],
  earth: ['blue', 'white', 'space'],
} as const satisfies Record<string, readonly string[]>;
export type DiagramId = keyof typeof DIAGRAMS;
export const isDiagram = (x: unknown): x is DiagramId => typeof x === 'string' && Object.hasOwn(DIAGRAMS, x);
