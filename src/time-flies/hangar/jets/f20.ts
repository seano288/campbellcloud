// Northrop F-20 Tigershark. Length 14.4 m, span 8.13 m (8.53 m with tip missiles), height 4.2 m. A one-engine F-5: the
// flat "shark" nose, leading-edge extensions running forward beside the cockpit, a small thin wing with tip rails,
// intakes beside the fuselage and one big afterburning engine. Research: .scratch/airplane-clock/research/jets/f20-tigershark.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f20: JetSpec = {
  id: 'f20', length: 14.4, span: 8.13, height: 4.2,
  bodies: [
    { sections: [ // the shark nose is wider than it is tall
      oval(0, 0.02, 0.01, 0.01, -0.02), oval(0.9, 0.24, 0.17, 0.17, -0.02, 2, 2), oval(2.2, 0.42, 0.34, 0.34, 0, 1.8, 2), oval(3.6, 0.5, 0.44, 0.44, 0.02, 2.2, 2.4),
      oval(5.6, 0.6, 0.5, 0.48, 0.02, 2.6, 2.8), oval(8.5, 0.66, 0.5, 0.46, 0.02, 2.8, 3), oval(11.0, 0.6, 0.48, 0.44, 0.02, 2.6, 2.6),
      oval(13.2, 0.5, 0.46, 0.44, 0.02, 2.2, 2.2), oval(14.1, 0.47, 0.45, 0.44, 0.02),
    ] },
    { sections: bubble(3.0, 5.7, 0.4, 0.4, 0.52, 0.4), finish: 'glass' },
    { sections: [oval(5.3, 0.3, 0.02, 0.1, 0.42), oval(6.2, 0.34, 0.2, 0.1, 0.44), oval(10.0, 0.3, 0.18, 0.1, 0.44), oval(11.4, 0.16, 0.04, 0.1, 0.42)] }, // the spine
    { z: 0.7, mirror: true, sections: [ // the intakes beside the fuselage
      oval(5.2, 0.22, 0.38, 0.38, -0.12, 4, 4), oval(5.9, 0.3, 0.4, 0.4, -0.12, 3.5, 3.5), oval(8.6, 0.3, 0.38, 0.38, -0.12, 3, 3), oval(10.4, 0.1, 0.22, 0.26, -0.12),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'strake', stations: [{ le: [3.4, 0.0, 0.45], chord: 4.4, t: 0.03 }, { le: [5.6, -0.04, 0.8], chord: 2.6, t: 0.035 }, { le: [6.9, -0.06, 1.0], chord: 3.4, t: 0.04 }] },
    { kind: 'wing', stations: wingPanel([6.9, -0.06, 0.95], 3.5, [8.5, -0.08, 3.9], 1.2, 0.045, 0.035, 3) },
    { kind: 'tail', stations: wingPanel([12.0, -0.12, 0.45], 1.8, [13.25, -0.12, 2.2], 0.8, 0.045, 0.035, 2) },
    { kind: 'fin', mirror: false, stations: wingPanel([10.2, 0.45, 0], 3.4, [12.75, 2.65, 0], 1.25, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [14.4, 0.02, 0], r: 0.42, len: 0.9 }],
  gear: { nose: { x: 3.6, y: -0.5, len: 0.82, r: 0.22 }, main: { x: 8.9, y: -0.45, z: 1.05, len: 0.78, r: 0.3 } },
  hardpoints: [
    { at: [9.0, -0.08, 4.05], kind: 'tip' }, { at: [8.6, -0.14, 2.9], kind: 'outer' }, { at: [8.2, -0.12, 1.85], kind: 'inner' },
    { at: [8.0, -0.5, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [4.2, 0.85, 0],
  flame: 'round',
  livery: {
    factory: { base: '#f2f2ee', under: '#d4d6d8', finish: 'gloss', insignia: 'none', marks: [ // demonstrator white with red and blue
      { kind: 'stripe', y: 0.05, h: 0.12, color: '#c8202f', x0: 0.05, x1: 0.9 }, { kind: 'stripe', y: -0.12, h: 0.1, color: '#1d3a8a', x0: 0.08, x1: 0.88 },
      { kind: 'fins', color: '#1d3a8a', from: 0.7 }, { kind: 'antiglare', x0: 0.12, x1: 0.24 },
    ] },
    camo: { base: '#7f878d', under: '#a3abb0', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#5f676d'], scale: 1.3, seed: 20 }] }, // air superiority greys
    squadron: { base: '#c9ad7c', under: '#9fb3c4', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#8a6a42', '#5d6a43'], scale: 1.1, seed: 31 }] }, // aggressor desert
    airshow: { base: '#f4f5f7', under: '#1d3a8a', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'nose', x1: 0.08, color: '#c8202f' }, { kind: 'rays', colors: ['#c8202f', '#1d3a8a'] }, { kind: 'leading', color: '#c8202f', w: 0.14 },
    ] },
  },
};
