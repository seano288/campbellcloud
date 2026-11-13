// Northrop F-20 Tigershark. Length 14.4 m, span 8.13 m (8.53 m with tip missiles), height 4.2 m. A one-engine F-5: the
// flat "shark" nose (wider than it is tall, with sharp edges), a long slim body with a raised canopy, big leading-edge
// extensions running forward beside the intakes, a small thin wing with tip rails, a low tailplane, a tall fin with a
// forward-leaning rudder, and one big F404 nozzle under a tail-cone fairing. Planform and profile measured from the F-5E
// three-view on Wikimedia Commons (the F-20 shares its wing, tail and canopy), with the F-20's nose, LERX and single
// engine from photos. Research: .scratch/airplane-clock/research/jets/f20-tigershark.md
import type { JetSpec } from '../three/spec';
import { bubble, circle, oval, wingPanel } from './parts';

export const f20: JetSpec = {
  id: 'f20', length: 14.4, span: 8.13, height: 4.2,
  bodies: [
    { sections: [ // the shark nose is wider than it is tall, with sharp edges, then a long slim body
      oval(0, 0.02, 0.01, 0.01, -0.42), oval(0.6, 0.22, 0.13, 0.14, -0.41, 1.6, 1.7), oval(1.1, 0.34, 0.21, 0.23, -0.38, 1.7, 1.8),
      oval(1.6, 0.41, 0.28, 0.29, -0.34, 1.9, 2), oval(2.4, 0.46, 0.37, 0.37, -0.26, 2.1, 2.2), oval(3.1, 0.48, 0.45, 0.45, -0.18, 2.2, 2.4),
      oval(3.65, 0.48, 0.5, 0.5, -0.13, 2.3, 2.5), oval(5.0, 0.49, 0.54, 0.54, -0.09, 2.4, 2.6), oval(6.5, 0.6, 0.71, 0.71, 0.16, 2.5, 2.7),
      oval(8.0, 0.72, 0.67, 0.67, 0.13, 2.6, 2.8), oval(10.0, 0.78, 0.6, 0.6, 0.07, 2.6, 2.8), oval(11.5, 0.76, 0.52, 0.52, 0.05, 2.4, 2.6),
      oval(13.0, 0.62, 0.47, 0.47, 0.05, 2.2, 2.2), oval(14.05, 0.5, 0.46, 0.46, 0.05),
    ] },
    { sections: bubble(3.55, 6.4, 0.4, 0.38, 0.54, 0.6), finish: 'glass', frames: [0.2] },
    { z: 0.66, mirror: true, sections: [ // the D-shaped intakes beside the fuselage, under the leading-edge extensions
      oval(5.5, 0.19, 0.44, 0.44, -0.05, 2.6, 2.6), oval(6.3, 0.2, 0.45, 0.45, -0.05, 2.6, 2.6), oval(8.0, 0.14, 0.38, 0.4, -0.05), oval(9.5, 0.04, 0.2, 0.25, -0.05),
    ], openFront: true },
    { sections: [oval(9.0, 0.03, 0.01, 0.05, 0.6), oval(9.8, 0.07, 0.12, 0.05, 0.6), oval(10.5, 0.07, 0.35, 0.05, 0.58), oval(11.0, 0.05, 0.6, 0.05, 0.56)], segs: 16 }, // the fin's dorsal fillet
    { sections: [oval(12.4, 0.04, 0.04, 0.04, 0.5), oval(13.1, 0.13, 0.13, 0.12, 0.5), oval(14.3, 0.11, 0.11, 0.11, 0.52), oval(14.8, 0.02, 0.03, 0.03, 0.52)], segs: 14 }, // the fairing over the nozzle
    { sections: [circle(-0.35, 0.015, -0.42), circle(0.05, 0.03, -0.42)], segs: 8, finish: 'metal' }, // the nose probe
  ],
  surfaces: [
    { kind: 'strake', stations: [ // the big leading-edge extensions
      { le: [5.45, 0.3, 0.52], chord: 4.6, t: 0.03 }, { le: [6.6, 0.0, 0.93], chord: 3.4, t: 0.03 }, { le: [7.74, -0.24, 1.36], chord: 2.6, t: 0.035 },
    ] },
    { kind: 'wing', stations: wingPanel([7.46, -0.25, 0.8], 2.9, [9.31, -0.25, 4.07], 0.7, 0.045, 0.035, 3) },
    { kind: 'tail', stations: wingPanel([11.8, -0.2, 0.5], 1.5, [12.66, -0.2, 2.06], 0.55, 0.045, 0.035, 2) },
    { kind: 'fin', mirror: false, stations: [
      { le: [10.3, 0.55, 0], chord: 3.25, t: 0.04 }, { le: [11.0, 1.2, 0], chord: 2.35, t: 0.05 }, { le: [12.27, 2.58, 0], chord: 0.7, t: 0.045 },
    ] },
  ],
  nozzles: [{ at: [14.35, 0.05, 0], r: 0.43, len: 0.9 }],
  gear: { nose: { x: 3.7, y: -0.63, len: 0.75, r: 0.3 }, main: { x: 8.9, y: -0.31, z: 1.55, len: 1.02, r: 0.35 } },
  hardpoints: [
    { at: [9.55, -0.25, 4.1], kind: 'tip' }, { at: [9.3, -0.3, 2.9], kind: 'outer' }, { at: [9.0, -0.32, 1.85], kind: 'inner' },
    { at: [8.5, -0.55, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [4.9, 0.55, 0],
  flame: 'round',
  livery: {
    factory: { base: '#f2f2ee', under: '#d4d6d8', finish: 'gloss', insignia: 'none', marks: [ // demonstrator white with red and blue
      { kind: 'stripe', y: 0.05, h: 0.12, color: '#c8202f', x0: 0.05, x1: 0.9 }, { kind: 'stripe', y: -0.12, h: 0.1, color: '#1d3a8a', x0: 0.08, x1: 0.88 },
      { kind: 'fins', color: '#1d3a8a', from: 0.7 }, { kind: 'antiglare', x0: 0.14, x1: 0.26 },
    ] },
    camo: { base: '#7f878d', under: '#a3abb0', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#5f676d'], scale: 1.3, seed: 20 }] }, // air superiority greys
    squadron: { base: '#c9ad7c', under: '#9fb3c4', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#8a6a42', '#5d6a43'], scale: 1.1, seed: 31 }] }, // aggressor desert
    airshow: { base: '#f4f5f7', under: '#1d3a8a', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'nose', x1: 0.08, color: '#c8202f' }, { kind: 'rays', colors: ['#c8202f', '#1d3a8a'] }, { kind: 'leading', color: '#c8202f', w: 0.14 },
    ] },
  },
};
