// Boeing F/A-18E Super Hornet. Length 18.31 m, span 13.62 m, height 4.88 m. Big leading-edge extensions (LEX) from the
// wing root up beside the cockpit, caret intakes under them, twin tails canted out 20° ahead of the stabilators.
// Planform traced from the Commons F/A-18F silhouette. Research: .scratch/airplane-clock/research/jets/f18-super-hornet.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f18: JetSpec = {
  id: 'f18', length: 18.31, span: 13.62, height: 4.88,
  bodies: [
    { sections: [ // a gently chined, slightly drooped nose, then a broad flat-sided body over the intake ducts and engines
      oval(0, 0.02, 0.02, 0.02, -0.12), oval(1.0, 0.34, 0.3, 0.32, -0.1, 1.9, 1.9), oval(2.2, 0.5, 0.45, 0.45, -0.06, 2, 1.9),
      oval(3.5, 0.6, 0.55, 0.55, -0.02, 2.2, 2.1), oval(5.0, 0.68, 0.62, 0.62, 0, 2.4, 2.6), oval(6.8, 0.8, 0.62, 0.75, 0.02, 2.4, 3),
      oval(8.5, 1.0, 0.56, 0.95, 0.02, 2.6, 3.6), oval(10.5, 1.2, 0.5, 0.95, 0.02, 3, 4), oval(12.5, 1.18, 0.47, 0.85, 0, 3, 3.6),
      oval(14.5, 1.1, 0.44, 0.7, -0.02, 3, 3), oval(16.3, 0.95, 0.4, 0.55, -0.04, 2.8, 2.8), oval(17.3, 0.86, 0.36, 0.47, -0.05, 2.6, 2.6),
    ] },
    { sections: [ // the big LEX: a sharp-edged shelf flaring out from beside the windscreen to the wing root, blended into the body
      oval(4.1, 0.55, 0.06, 0.04, 0.24, 1.1, 1.6), oval(5.25, 1.0, 0.2, 0.1, 0.22, 1.1, 1.6), oval(6.1, 1.33, 0.24, 0.12, 0.2, 1.1, 1.6),
      oval(6.7, 1.6, 0.26, 0.12, 0.19, 1.1, 1.6), oval(7.4, 1.84, 0.26, 0.12, 0.18, 1.1, 1.6), oval(8.7, 1.98, 0.26, 0.12, 0.16, 1.1, 1.6),
      oval(9.8, 1.95, 0.26, 0.12, 0.15, 1.1, 1.6), oval(11.2, 1.3, 0.28, 0.12, 0.12, 1.1, 1.6), oval(13.0, 1.18, 0.3, 0.1, 0.08, 1.1, 1.6),
      oval(14.5, 1.0, 0.1, 0.06, 0.05, 1.1, 1.6),
    ] },
    { sections: bubble(3.3, 6.7, 0.45, 0.46, 0.7, 0.45), finish: 'glass' },
    { z: 0.98, mirror: true, sections: [ // the square-cut intakes tucked up under the LEX, their outer walls flat
      oval(7.0, 0.36, 0.48, 0.45, -0.38, 6, 6), oval(7.6, 0.4, 0.5, 0.47, -0.38, 5, 5), oval(9.0, 0.41, 0.5, 0.46, -0.38, 4.5, 4.5),
      oval(11.0, 0.3, 0.36, 0.4, -0.38, 4, 4), oval(12.0, 0.2, 0.25, 0.3, -0.36, 3, 3),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([9.2, 0.15, 1.3], 4.7, [11.53, 0.08, 6.45], 2.12, 0.05, 0.04, 4) },
    { kind: 'tail', stations: wingPanel([14.4, -0.05, 0.9], 3.2, [17.15, -0.1, 3.45], 1.15, 0.05, 0.04, 2) },
    { kind: 'fin', stations: wingPanel([12.8, 0.4, 0.82], 3.3, [14.85, 2.82, 1.7], 1.3, 0.05, 0.04, 3) }, // canted out 20°
  ],
  nozzles: [{ at: [17.75, -0.05, 0.5], r: 0.46, len: 1.0, mirror: true }],
  gear: { nose: { x: 4.4, y: -0.55, len: 1.25, r: 0.28, twin: true }, main: { x: 11.0, y: -0.45, z: 1.62, len: 1.18, r: 0.42 } },
  hardpoints: [
    { at: [12.55, 0.08, 6.6], kind: 'tip' }, { at: [11.7, -0.03, 5.1], kind: 'outer' }, { at: [11.05, 0.0, 3.4], kind: 'inner' },
    { at: [11.0, -0.98, 0], kind: 'belly', mirror: false }, { at: [9.0, -0.9, 0.98], kind: 'belly' },
  ],
  cockpit: [5.0, 0.68, 0],
  flame: 'round',
  livery: {
    factory: { base: '#8e979e', under: '#b0b7bc', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'nose', x1: 0.07, color: '#7f878d' }] }, // Navy tactical greys
    camo: { base: '#9cb0c0', under: '#c7d2db', finish: 'matte', insignia: 'none', marks: [{ kind: 'splinter', colors: ['#56708a', '#d9e2ea', '#2f4258'], seed: 18 }] }, // aggressor splinter
    squadron: { base: '#8e979e', under: '#b0b7bc', finish: 'satin', insignia: 'star', marks: [ // CAG colour bird
      { kind: 'fins', color: '#141414' }, { kind: 'stripe', y: 0.18, h: 0.14, color: '#f2c230', x0: 0.05, x1: 0.42 }, { kind: 'nose', x1: 0.05, color: '#141414' },
    ] },
    airshow: { base: '#1b2b6b', under: '#1b2b6b', finish: 'gloss', insignia: 'none', marks: [ // Blue Angels
      { kind: 'leading', color: '#f2c230', w: 0.13, under: true }, { kind: 'spine', w: 0.4, color: '#f2c230', x0: 0.05, x1: 0.95 },
      { kind: 'stripe', y: -0.12, h: 0.16, color: '#f2c230', x0: 0.04, x1: 0.85 }, { kind: 'fins', color: '#f2c230', from: 0.88 },
    ] },
  },
};
