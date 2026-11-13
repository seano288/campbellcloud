// McDonnell Douglas AV-8B Harrier II. Length 14.12 m, span 9.25 m, height 3.55 m. A jump jet: one Pegasus engine blows
// out of four swivelling nozzles on the fuselage sides (shown pointing aft, as in forward flight), fed by huge intakes
// either side of a high bubble canopy; a shoulder wing drooping 12° to small outrigger wheels, a drooped tailplane, a
// tall fin, a long tail cone, strakes under the belly and stubby bicycle gear. Planform from the AV-8B top-view
// silhouette on Wikimedia Commons, profile from its three-view. Research: .scratch/airplane-clock/research/jets/av8b-harrier.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const av8b: JetSpec = {
  id: 'av8b', length: 14.12, span: 9.25, height: 3.55,
  bodies: [
    { sections: [ // a drooping nose under a raised cockpit, a fat middle round the engine, then a long thin tail cone
      oval(0, 0.02, 0.02, 0.02, -0.3), oval(0.6, 0.26, 0.21, 0.21, -0.29), oval(1.34, 0.42, 0.44, 0.44, -0.14, 2.2, 2.3), oval(2.2, 0.5, 0.5, 0.5, -0.1, 2.3, 2.4),
      oval(3.2, 0.58, 0.56, 0.56, -0.06, 2.4, 2.6), oval(4.2, 0.7, 0.71, 0.71, 0.09, 2.6, 2.8), oval(5.5, 0.95, 0.74, 0.74, 0.12, 2.8, 3),
      oval(7.5, 1.0, 0.74, 0.74, 0.12, 2.8, 3), oval(9.4, 0.8, 0.69, 0.69, 0.14, 2.6, 2.8), oval(10.5, 0.62, 0.58, 0.58, 0.18, 2.4, 2.4),
      oval(11.5, 0.5, 0.48, 0.48, 0.23), oval(12.8, 0.3, 0.31, 0.31, 0.31), oval(14.12, 0.07, 0.07, 0.07, 0.42),
    ] },
    { sections: bubble(1.3, 4.4, 0.38, 0.45, 0.67, 0.55), finish: 'glass', frames: [0.24] }, // the raised bubble canopy
    { sections: [oval(9.9, 0.03, 0.01, 0.05, 0.78), oval(10.7, 0.07, 0.12, 0.05, 0.78), oval(11.4, 0.07, 0.32, 0.05, 0.76), oval(11.9, 0.05, 0.5, 0.05, 0.74)], segs: 16 }, // the fin's dorsal fillet
    { z: 0.85, mirror: true, sections: [ // the huge intakes either side of the cockpit
      oval(3.5, 0.42, 0.49, 0.49, -0.1, 2.3, 2.3), oval(4.2, 0.44, 0.5, 0.52, -0.1, 2.4, 2.4), oval(5.5, 0.38, 0.46, 0.5, -0.1, 2.6, 2.6),
      oval(7.0, 0.2, 0.35, 0.4, -0.12), oval(8.0, 0.05, 0.2, 0.25, -0.15),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([6.1, 0.74, 0.6], 3.9, [8.2, -0.11, 4.62], 1.15, 0.09, 0.06, 3) }, // drooping 12°
    { kind: 'strake', stations: [{ le: [4.9, 0.78, 0.75], chord: 2.0, t: 0.03 }, { le: [6.5, 0.71, 1.42], chord: 0.6, t: 0.03 }] }, // leading-edge root extensions
    { kind: 'tail', stations: wingPanel([11.6, 0.76, 0.3], 1.9, [13.15, 0.23, 2.3], 0.42, 0.05, 0.04, 2) }, // drooped
    { kind: 'fin', mirror: false, stations: [
      { le: [11.2, 0.72, 0], chord: 2.3, t: 0.04 }, { le: [11.7, 1.1, 0], chord: 1.8, t: 0.05 }, { le: [12.75, 2.1, 0], chord: 0.75, t: 0.05 }, { le: [13.05, 2.45, 0], chord: 0.45, t: 0.05 },
    ] },
    { kind: 'other', stations: [{ le: [4.9, -0.58, 0.27], chord: 3.3, t: 0.03 }, { le: [5.1, -0.82, 0.27], chord: 2.9, t: 0.03 }] }, // the strakes under the belly
  ],
  nozzles: [ // the four swivelling nozzles: cool air at the front, hot exhaust at the back
    { at: [6.1, -0.35, 1.12], r: 0.3, len: 0.6, mirror: true },
    { at: [8.7, -0.35, 1.05], r: 0.34, len: 0.6, mirror: true },
  ],
  gear: { // bicycle gear: one leg in front, one behind and an outrigger under each wing
    nose: { x: 4.4, y: -0.55, len: 0.22, r: 0.3 }, tail: { x: 9.0, y: -0.55, len: 0.2, r: 0.32 },
    main: { x: 8.6, y: 0.26, z: 2.6, len: 1.15, r: 0.18 },
  },
  hardpoints: [
    { at: [8.5, 0.08, 3.3], kind: 'outer' }, { at: [8.2, 0.3, 2.1], kind: 'inner' }, { at: [7.2, -0.62, 0.55], kind: 'belly' },
  ],
  cockpit: [3.0, 0.66, 0],
  flame: 'round',
  loads: { 1: { outer: 'aim9', inner: 'maverick', belly: 'pod' }, 2: { outer: 'mk82', inner: 'gbu', belly: 'pod' }, 3: { outer: 'aim9', inner: 'tank', belly: 'pod' } },
  livery: {
    factory: { base: '#6f777d', under: '#8b9399', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#596066'], scale: 1.4, seed: 8 }] }, // Marine tactical greys
    camo: { base: '#4a5640', under: '#9aa3a8', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2d3729', '#5c6359'], scale: 1.1, seed: 51 }] }, // early green and grey
    squadron: { base: '#6f777d', under: '#8b9399', finish: 'satin', insignia: 'star', marks: [{ kind: 'fins', color: '#141414' }, { kind: 'stripe', y: 0.2, h: 0.12, color: '#c8202f', x0: 0.1, x1: 0.4 }] },
    airshow: { base: '#f2f2ee', under: '#c8202f', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'nose', x1: 0.07, color: '#c8202f' }, { kind: 'stripe', y: 0.05, h: 0.14, color: '#c8202f', x0: 0.08, x1: 0.85 }, { kind: 'fins', color: '#1d3a8a', from: 0.5 },
      { kind: 'wingtips', color: '#c8202f', from: 0.7 },
    ] },
  },
};
