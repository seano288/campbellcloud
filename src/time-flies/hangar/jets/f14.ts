// Grumman F-14 Tomcat. Length 19.1 m, height 4.88 m, span 19.55 m with the wings forward (20°) and 11.65 m swept (68°).
// A flat "pancake" body between widely spaced engines, box intakes, a fixed glove ahead of the wing pivots, twin tails.
// The wings sweep back for Take Off. Planform traced from the public-domain Commons three-view.
// Research: .scratch/airplane-clock/research/jets/f14-tomcat.md
import type { JetSpec } from '../three/spec';
import { oval, wingPanel } from './parts';

const PIVOT_Z = 2.75;

export const f14: JetSpec = {
  id: 'f14', length: 19.1, span: 19.55, height: 4.88,
  bodies: [
    { sections: [ // the long drooped nose and tandem cockpit, then the centre spine running back to the flat "beaver tail"
      oval(0, 0.02, 0.02, 0.02, -0.45), oval(1.2, 0.36, 0.36, 0.38, -0.32), oval(2.5, 0.58, 0.55, 0.55, -0.18, 2.1, 2.1),
      oval(3.6, 0.7, 0.68, 0.62, -0.1, 2.2, 2.4), oval(5.0, 0.82, 0.74, 0.7, -0.05, 2.4, 3), oval(6.5, 0.9, 0.78, 0.68, 0, 2.6, 3.2),
      oval(8.5, 1.0, 0.8, 0.52, 0, 3, 3), oval(12.0, 1.05, 0.78, 0.48, 0, 3, 3), oval(15.0, 1.0, 0.66, 0.46, 0.02, 3, 3),
      oval(17.5, 0.8, 0.45, 0.4, 0.06, 2.8, 2.8), oval(18.6, 0.7, 0.18, 0.15, 0.1, 3, 3), oval(19.3, 0.45, 0.05, 0.05, 0.1, 3, 3),
    ] },
    { sections: [ // the "pancake": a flat deck across the engines out to the glove, the whole back a lifting body
      oval(6.6, 1.5, 0.08, 0.08, 0.4, 4, 4), oval(8.0, 1.9, 0.22, 0.2, 0.38, 5, 3), oval(9.7, 2.15, 0.25, 0.22, 0.36, 5, 3),
      oval(17.0, 2.15, 0.22, 0.2, 0.32, 5, 3), oval(18.0, 1.95, 0.16, 0.16, 0.3, 5, 3), oval(18.6, 1.7, 0.06, 0.06, 0.3, 4, 4),
    ] },
    { sections: [ // the tandem canopy: pilot in front, radar officer behind
      oval(3.3, 0.08, 0.02, 0.06, 0.5), oval(3.9, 0.42, 0.4, 0.1, 0.5), oval(4.8, 0.52, 0.72, 0.1, 0.5), oval(6.0, 0.54, 0.8, 0.1, 0.5),
      oval(7.0, 0.5, 0.7, 0.1, 0.5), oval(7.8, 0.38, 0.45, 0.1, 0.5), oval(8.5, 0.14, 0.06, 0.08, 0.5),
    ], finish: 'glass' },
    { z: 1.35, mirror: true, sections: [ // the box intakes and engine nacelles, slung under the pancake
      oval(6.0, 0.37, 0.48, 0.52, -0.22, 6, 6), oval(7.0, 0.45, 0.52, 0.55, -0.2, 5, 5), oval(10.0, 0.6, 0.55, 0.6, -0.2, 3.5, 3.5),
      oval(14.0, 0.65, 0.6, 0.62, -0.15, 2.6, 2.6), oval(17.0, 0.6, 0.58, 0.58, -0.1, 2.2, 2.2), oval(18.4, 0.55, 0.55, 0.55, -0.05),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'strake', stations: [ // the fixed glove, swept sharply back from the intakes to the pivot
      { le: [6.1, 0.45, 1.7], chord: 8.0, t: 0.035 }, { le: [8.45, 0.45, 2.6], chord: 5.6, t: 0.045 }, { le: [10.83, 0.44, 3.46], chord: 3.2, t: 0.06 },
    ] },
    { kind: 'wing', part: 'wing', stations: [
      { le: [10.6, 0.43, PIVOT_Z], chord: 3.4, t: 0.09 }, ...wingPanel([10.85, 0.42, 3.46], 3.15, [13.2, 0.32, 9.75], 1.35, 0.085, 0.06, 4),
    ] },
    { kind: 'tail', stations: wingPanel([15.35, 0.12, 2.0], 2.7, [18.3, 0.06, 5.0], 0.75, 0.05, 0.04, 2) },
    { kind: 'fin', stations: wingPanel([15.2, 0.6, 1.45], 3.5, [18.0, 2.73, 1.62], 1.05, 0.05, 0.04, 3) },
    { kind: 'other', stations: wingPanel([15.8, -0.55, 1.55], 1.4, [16.4, -1.05, 1.75], 0.8, 0.05, 0.04, 1) }, // ventral fins
  ],
  pivots: [{ part: 'wing', at: [11.5, 0, PIVOT_Z], axis: [0, 1, 0] }],
  nozzles: [{ at: [18.95, -0.05, 1.35], r: 0.5, len: 1.2, mirror: true }],
  gear: { nose: { x: 3.7, y: -0.55, len: 1.32, r: 0.28, twin: true }, main: { x: 12.4, y: 0.25, z: 2.45, len: 1.98, r: 0.42 } },
  hardpoints: [
    { at: [10.4, 0.2, 2.4], kind: 'inner' }, { at: [9.0, -0.55, 0.5], kind: 'belly' }, { at: [13.0, -0.52, 0.5], kind: 'belly' },
  ],
  cockpit: [4.6, 0.78, 0],
  seats: [[4.6, 0.78, 0], [6.3, 0.85, 0]],
  flame: 'round',
  loads: { 1: { inner: 'aim9', belly: 'aim120' }, 2: { inner: 'aim9', belly: 'mk82' }, 3: { inner: 'aim9', belly: 'aim54' } },
  livery: {
    factory: { base: '#a8aca9', under: '#f2f2ee', finish: 'satin', insignia: 'star', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.65 }, { kind: 'nose', x1: 0.05, color: '#e8e2cc' }] }, // 1970s gull grey and white
    camo: { base: '#7f878d', under: '#a3abb0', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#5f676d'], scale: 1.3, seed: 14 }] }, // low-vis tactical greys
    squadron: { base: '#a8aca9', under: '#f2f2ee', finish: 'satin', insignia: 'star', marks: [ // the Jolly Rogers
      { kind: 'fins', color: '#141414' }, { kind: 'stripe', y: 0.15, h: 0.12, color: '#f2c230', x0: 0.06, x1: 0.35 },
    ] },
    airshow: { base: '#f2f2ee', under: '#f2f2ee', finish: 'gloss', insignia: 'star', marks: [ // Sundowners sunburst on the fins
      { kind: 'fins', color: '#c8202f', from: 0.35 }, { kind: 'stripe', y: 0.0, h: 0.16, color: '#c8202f', x0: 0.05, x1: 0.85 }, { kind: 'leading', color: '#c8202f', w: 0.1 },
    ] },
  },
};
