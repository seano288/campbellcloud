// Grumman F-14 Tomcat. Length 19.1 m, height 4.88 m, span 19.55 m with the wings forward (20°) and 11.65 m swept (68°).
// A flat "pancake" body between widely spaced engines, box intakes, a fixed glove ahead of the wing pivots, twin tails.
// The wings sweep back for Take Off. Research: .scratch/airplane-clock/research/jets/f14-tomcat.md
import type { JetSpec } from '../three/spec';
import { oval, wingPanel } from './parts';

const PIVOT_Z = 2.75;

export const f14: JetSpec = {
  id: 'f14', length: 19.1, span: 19.55, height: 4.88,
  bodies: [
    { sections: [ // the forward fuselage, then the flat centre between the engines
      oval(0, 0.02, 0.02, 0.02, 0), oval(1.2, 0.4, 0.4, 0.4, 0), oval(2.8, 0.58, 0.58, 0.55, 0.02), oval(4.5, 0.68, 0.62, 0.6, 0.04, 2.2, 2.5),
      oval(7.0, 0.85, 0.62, 0.5, 0.05, 2.6, 3), oval(9.5, 1.15, 0.5, 0.4, 0.05, 3.5, 4), oval(14.0, 1.2, 0.4, 0.35, 0.05, 4, 4),
      oval(17.0, 0.9, 0.3, 0.3, 0.05, 3.5, 3.5), oval(19.1, 0.35, 0.08, 0.1, 0.05, 3, 3),
    ] },
    { sections: [ // the tandem canopy
      oval(3.3, 0.08, 0.02, 0.06, 0.55), oval(4.0, 0.44, 0.42, 0.1, 0.55), oval(5.2, 0.5, 0.5, 0.1, 0.55), oval(6.6, 0.48, 0.46, 0.1, 0.55),
      oval(7.4, 0.36, 0.25, 0.1, 0.55), oval(8.0, 0.12, 0.04, 0.08, 0.55),
    ], finish: 'glass' },
    { z: 1.55, mirror: true, sections: [ // the box intakes and engine nacelles
      oval(6.4, 0.42, 0.55, 0.5, -0.2, 6, 6), oval(7.5, 0.5, 0.58, 0.52, -0.2, 5, 5), oval(11.0, 0.55, 0.56, 0.55, -0.2, 3, 3),
      oval(15.0, 0.55, 0.55, 0.55, -0.2, 2.4, 2.4), oval(17.6, 0.52, 0.52, 0.52, -0.2),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'strake', stations: [ // the fixed glove, swept back to the pivot
      { le: [6.2, 0.05, 0.9], chord: 10.2, t: 0.04 }, { le: [8.4, 0.04, 2.0], chord: 7.2, t: 0.05 }, { le: [10.2, 0.03, PIVOT_Z + 0.1], chord: 4.6, t: 0.06 },
    ] },
    { kind: 'wing', part: 'wing', stations: wingPanel([10.6, 0.02, PIVOT_Z], 3.4, [13.2, -0.05, 9.75], 1.45, 0.09, 0.06, 4) },
    { kind: 'tail', stations: wingPanel([16.3, -0.15, 1.95], 3.1, [18.5, -0.2, 4.95], 1.25, 0.05, 0.04, 2) },
    { kind: 'fin', stations: wingPanel([14.1, 0.4, 1.6], 3.6, [17.1, 3.05, 1.82], 1.35, 0.05, 0.04, 3) },
    { kind: 'other', stations: wingPanel([16.0, -0.6, 1.5], 1.4, [16.6, -1.1, 1.7], 0.8, 0.05, 0.04, 1) }, // ventral fins
  ],
  pivots: [{ part: 'wing', at: [11.5, 0, PIVOT_Z], axis: [0, 1, 0] }],
  nozzles: [{ at: [18.75, -0.2, 1.55], r: 0.5, len: 1.2, mirror: true }],
  gear: { nose: { x: 3.7, y: -0.55, len: 1.3, r: 0.28, twin: true }, main: { x: 12.4, y: -0.45, z: 2.45, len: 1.3, r: 0.42 } },
  hardpoints: [
    { at: [10.4, -0.35, 2.3], kind: 'inner' }, { at: [9.0, -0.5, 0.5], kind: 'belly' }, { at: [13.0, -0.5, 0.5], kind: 'belly' },
  ],
  cockpit: [4.6, 0.9, 0],
  seats: [[4.6, 0.9, 0], [6.3, 0.95, 0]],
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
