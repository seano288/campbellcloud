// Shorthand for writing Helicopter specs (Time Flies' shorthand, plus a few helicopter shapes).
import type { Station, V3 } from '../../../time-flies/hangar/three/geometry';
export { bubble, circle, joined, oval, roundedPanel, wingPanel } from '../../../time-flies/hangar/jets/parts';

/** An upright fin from its root to its tip, with no copy on the left. */
export const finPanel = (root: V3, rootChord: number, tip: V3, tipChord: number, t = 0.12, steps = 2): Station[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const f = i / steps;
    return { le: [root[0] + (tip[0] - root[0]) * f, root[1] + (tip[1] - root[1]) * f, root[2] + (tip[2] - root[2]) * f] as V3, chord: rootChord + (tipChord - rootChord) * f, t };
  });
